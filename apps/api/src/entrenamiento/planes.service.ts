import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  CrearPlanDeEntrenamientoRequestSchema,
  EditarPlanDeEntrenamientoRequestSchema,
  VersionEsperadaRequestSchema,
  construirInstantaneaDeEntrenamiento,
  evaluarSucesion,
  evaluarTransicionDePlanDeEntrenamiento,
  normalizarEstructuraDeEntrenamiento,
  problemasDeCompletitud,
  problemasDeReferencias,
  referenciasDeEjercicio,
  serializacionCanonica,
  type ContenidoDePlanDeEntrenamiento,
  type EjercicioCitable,
  type EstructuraDePlanDeEntrenamientoEntrada,
  type Procedencia,
  type ValidationIssue,
  type VersionDePlanDeEntrenamiento,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { ProcesoService } from '../proceso/proceso.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { esToken } from '../vinculo/lectura';
import { CatalogoDeEjerciciosService } from './catalogo.service';
import { EjecutorDeEntrenamiento, esUuid, exigirA3Vigente } from './ejecutor';
import { EvaluacionesDeEntrenamientoService } from './evaluaciones.service';
import { registrarEventoDeEntrenamiento } from './eventos';
import { INCLUIR_PLAN_DE_ENTRENAMIENTO, nombreVisibleDe, seguimientoAbierto, versionDePlanApi, type VersionConPlan } from './lectura-entrenamiento';

type Tx = Prisma.TransactionClient;

interface VersionBloqueada {
  id: string;
  planId: string;
  predecesoraId: string | null;
  estado: 'BORRADOR' | 'ACTIVADA';
  version: number;
  versionDeObjetivoId: string;
  contenido: ContenidoDePlanDeEntrenamiento;
  proximaRevision: Date | null;
  profesionalId: string;
  asesoradoId: string;
}

const RECURSO = 'VersionDePlanDeEntrenamiento';

const noEditable = () =>
  new ErrorDeApi(422, CodigoDeError.PLAN_NOT_EDITABLE, 'Esta versión está activada y no se puede editar. Para cambiarla, creá una nueva versión a partir de esta.');
const noLista = (issues: ValidationIssue[]) => new ErrorDeApi(422, CodigoDeError.OPERATION_NOT_READY, 'Hay elementos por corregir antes de activar.', { issues });
const objetivoNoAplicable = () =>
  new ErrorDeApi(422, CodigoDeError.OBJECTIVE_NOT_EFFECTIVE_OR_COMPATIBLE, 'El objetivo indicado no es el objetivo vigente de este asesorado.', {
    issues: [{ code: 'OBJECTIVE_NOT_EFFECTIVE_OR_COMPATIBLE', path: 'objectiveVersionId' }],
  });

/**
 * UC-P15 y UC-P16 — Plan de entrenamiento (API-TRN-07 a 12; RF-039, RF-040, RF-041).
 *
 * - Una sola colección: el borrador es la misma versión con `state: "DRAFT"` (09v10:238-245). No hay colección de
 *   borradores de plan, y eso es deliberado.
 * - La máquina es BORRADOR → ACTIVADA y nada más. **No existe VALIDADO**: validar es una condición de activar, no un
 *   estado (06:4330). La base rechaza cualquier cambio sobre una ACTIVADA aunque este servicio se equivocara.
 * - Validar la forma no es juzgar el programa: ni volumen, ni frecuencia, ni selección de ejercicios (09v10:738-744).
 * - La activación es la transacción del 09 (09v10:807-823): versión esperada, PDP, validación, instantánea **antes**
 *   de la vigencia, vigencia única, Proceso nuevo con capacidad o continuidad, hecho y auditoría. Si algo falla, no
 *   cambia nada. El Proceso es el mismo de nutrición (06:5164), desatado de ese dominio en la base (§9.7).
 */
@Injectable()
export class PlanesDeEntrenamientoService {
  constructor(
    private readonly ejecutor: EjecutorDeEntrenamiento,
    private readonly pdp: PdpService,
    private readonly catalogo: CatalogoDeEjerciciosService,
    private readonly evaluaciones: EvaluacionesDeEntrenamientoService,
    private readonly procesos: ProcesoService,
  ) {}

  // ─── API-TRN-07 ────────────────────────────────────────────────────────────────────────────
  crearBorrador(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-TRN-07',
      casoDeUso: 'UC-P15',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      clave,
      esquema: CrearPlanDeEntrenamientoRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        const asesoradoId = await this.decidir(tx, 'API-TRN-07', actor, actor.identidadId, adviseeId, { tipo: 'Asesorado', id: adviseeId }, ctx);
        if (pedido.basedOnPlanId && pedido.initialStructure) {
          throw errores.validacionFallida([{ code: 'BASED_ON_AND_STRUCTURE_ARE_EXCLUSIVE', path: 'initialStructure' }]);
        }
        const version = await this.crearVersionBorrador(tx, {
          profesionalId: actor.identidadId,
          asesoradoId,
          objetivoVersionId: pedido.objectiveVersionId,
          estructura: pedido.initialStructure ?? null,
          basadaEn: pedido.basedOnPlanId ?? null,
          proximaRevision: pedido.nextReviewAt ?? null,
          revisionDeOrigenId: null,
          procedencia,
        });
        return { estadoHttp: 201, cuerpo: { data: await this.leerVersion(tx, version) }, sujetoId: asesoradoId, recurso: { tipo: RECURSO, id: version } };
      },
    });
  }

  /**
   * CrearBorrador (06:5157): versión editable, no vigente, sucesora de la efectiva si la hay. Un solo borrador por plan
   * (la base lo exige con un índice parcial). La usan API-TRN-07 y la aplicación de AJUSTAR o SUSTITUIR.
   */
  async crearVersionBorrador(
    tx: Tx,
    p: {
      profesionalId: string;
      asesoradoId: string;
      objetivoVersionId: string;
      estructura: EstructuraDePlanDeEntrenamientoEntrada | null;
      /** `planId` de la versión efectiva a copiar (DL-047, por homología), o `null`. */
      basadaEn: string | null;
      proximaRevision: string | null;
      revisionDeOrigenId: string | null;
      procedencia: Procedencia;
    },
  ): Promise<string> {
    await this.exigirObjetivoEfectivo(tx, p.profesionalId, p.asesoradoId, p.objetivoVersionId);
    const plan = await this.planBloqueado(tx, p.profesionalId, p.asesoradoId);
    const versiones = await tx.versionDePlanDeEntrenamiento.findMany({
      where: { planId: plan.id },
      select: { id: true, planId: true, predecesoraId: true, estado: true, contenido: true, instantanea: { select: { contenido: true } } },
    });
    const borrador = versiones.find((v) => v.estado === 'BORRADOR');
    if (borrador) {
      throw new ErrorDeApi(409, CodigoDeError.RESOURCE_CONFLICT, 'Ya hay un borrador de este plan. Seguí trabajando sobre ese borrador.', { draftPlanId: borrador.id });
    }
    let contenido: ContenidoDePlanDeEntrenamiento;
    if (p.basadaEn) {
      if (p.basadaEn !== plan.versionEfectivaId) throw errores.validacionFallida([{ code: 'BASED_ON_MUST_BE_EFFECTIVE_VERSION', path: 'basedOnPlanId' }]);
      // La sucesora parte de lo que se activó —la instantánea—, con los mismos identificadores de nodo: una ejecución
      // registrada contra la anterior sigue apuntando a una sesión identificable (REG-06-111).
      const base = versiones.find((v) => v.id === p.basadaEn);
      contenido = JSON.parse(JSON.stringify((base?.instantanea?.contenido as { contenido?: unknown } | undefined)?.contenido ?? base?.contenido)) as ContenidoDePlanDeEntrenamiento;
    } else {
      contenido = await this.normalizarYVerificar(tx, p.profesionalId, p.estructura ?? { blocks: [] });
    }
    const sucesion = evaluarSucesion(
      versiones.map((v) => ({ id: v.id, objetoId: v.planId, predecesoraId: v.predecesoraId })),
      { objetoId: plan.id, predecesoraId: plan.versionEfectivaId },
    );
    if (!sucesion.valida) throw errores.conflictoDeVersion();
    const evaluacion = evaluarTransicionDePlanDeEntrenamiento(null, { transicion: 'CrearBorrador', evaluacionYObjetivoIdentificables: true });
    if (!evaluacion.permitida) throw errores.estadoNoPermite();
    const momento = await momentoDeLaBase(tx);
    const version = await tx.versionDePlanDeEntrenamiento.create({
      data: {
        planId: plan.id,
        predecesoraId: plan.versionEfectivaId,
        versionDeObjetivoId: p.objetivoVersionId,
        contenido: contenido as unknown as Prisma.InputJsonValue,
        proximaRevision: p.proximaRevision ? new Date(`${p.proximaRevision}T00:00:00.000Z`) : null,
        revisionDeOrigenId: p.revisionDeOrigenId,
        autorId: p.profesionalId,
        procedencia: p.procedencia as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });
    await registrarEventoDeEntrenamiento(tx, {
      tipo: 'BorradorDePlanDeEntrenamientoCreado',
      profesionalId: p.profesionalId,
      asesoradoId: p.asesoradoId,
      recurso: { tipo: RECURSO, id: version.id },
      estadoPrevio: null,
      estadoPosterior: 'BORRADOR',
      actorId: p.profesionalId,
      procedencia: p.procedencia,
      momento,
    });
    return version.id;
  }

  // ─── API-TRN-08 ────────────────────────────────────────────────────────────────────────────
  listar(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: Omit<VersionDePlanDeEntrenamiento, 'blocks'>[]; page: unknown }> {
    const consulta = leerConsultaDeLista(query, { state: ['DRAFT', 'ACTIVATED'] });
    return this.ejecutor.leer({
      operacion: 'API-TRN-08',
      casoDeUso: 'UC-P15',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        // «Proyección profesional/asesorado según actor» (09v10:696). El asesorado titular ve solo lo ACTIVADO de cada
        // plan cuyo profesional conserva el acceso: un borrador no existe para él (09v10:683), igual que en TRN-09.
        if (adviseeId === actor.identidadId) return this.listarComoTitular(tx, actor, consulta, ctx);
        const asesoradoId = await this.decidir(tx, 'API-TRN-08', actor, actor.identidadId, adviseeId, null, ctx);
        const estado = consulta.filtros.state === 'DRAFT' ? 'BORRADOR' : consulta.filtros.state === 'ACTIVATED' ? 'ACTIVADA' : undefined;
        const filas = await tx.versionDePlanDeEntrenamiento.findMany({
          where: { plan: { profesionalId: actor.identidadId, asesoradoId }, ...(estado ? { estado } : {}), ...despuesDelCursor(consulta.cursor) },
          include: INCLUIR_PLAN_DE_ENTRENAMIENTO,
          orderBy: ORDEN_DE_LISTA,
          take: consulta.limit + 1,
        });
        const { pagina, page } = paginar(filas, consulta.limit);
        const nombre = await nombreVisibleDe(tx, actor.identidadId);
        const abierto = await seguimientoAbierto(tx, actor.identidadId, asesoradoId);
        return {
          data: pagina.map((v) => {
            const { blocks: _b, ...resumen } = versionDePlanApi(v, nombre, new Map(), abierto);
            return resumen;
          }),
          page,
        };
      },
    });
  }

  // ─── API-TRN-09 ────────────────────────────────────────────────────────────────────────────
  /**
   * El profesional autor ve sus versiones. El asesorado titular ve solo las ACTIVADAS («no visible como vigente al
   * asesorado» mientras es borrador, 09v10:683), desde la instantánea.
   *
   * Para el titular, una versión ACTIVADA es su plan **tal como lo aceptó**: historia propia, no acceso de un tercero.
   * Alcanza con su A3 vigente, como en nutrición y antropometría (DL-089 opción A; 08:199, 08:58, 08:406). Lo que
   * *opera* sobre el plan vigente —«Hoy», abrir un borrador, confirmar, corregir— sigue bajo el PDP de su profesional
   * (UC-P17 E03).
   */
  consultar(actor: ActorAutenticado, planId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: VersionDePlanDeEntrenamiento }> {
    sinParametrosDeQuery(query);
    const recurso = { tipo: RECURSO, id: planId };
    return this.ejecutor.leer({
      operacion: 'API-TRN-09',
      casoDeUso: 'UC-P15',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const v = esUuid(planId) ? await tx.versionDePlanDeEntrenamiento.findUnique({ where: { id: planId }, include: INCLUIR_PLAN_DE_ENTRENAMIENTO }) : null;
        if (!v) throw this.ejecutor.noRevelable({ operacion: 'API-TRN-09', actorId: actor.identidadId, recurso }, ctx);
        const titular = v.plan.asesoradoId;
        if (titular === actor.identidadId) {
          if (v.estado !== 'ACTIVADA') throw this.ejecutor.noRevelable({ operacion: 'API-TRN-09', actorId: actor.identidadId, recurso, sujetoId: titular }, ctx);
          await exigirA3Vigente(tx, actor.identidadId);
        } else {
          await this.decidir(tx, 'API-TRN-09', actor, actor.identidadId, titular, recurso, ctx);
          if (v.plan.profesionalId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-TRN-09', actorId: actor.identidadId, recurso, sujetoId: titular }, ctx);
        }
        return { data: await this.leerVersion(tx, v.id) };
      },
    });
  }

  // ─── API-TRN-10 ────────────────────────────────────────────────────────────────────────────
  editarBorrador(actor: ActorAutenticado, planId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO, id: planId };
    return this.ejecutor.escribir({
      operacion: 'API-TRN-10',
      casoDeUso: 'UC-P15',
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: EditarPlanDeEntrenamientoRequestSchema,
      cuerpo,
      efecto: async (tx, pedido, procedencia) => {
        const v = await this.versionDelAutor(tx, 'API-TRN-10', actor, planId, ctx);
        // La inmutabilidad se informa antes que la versión: editar una ACTIVADA nunca es posible (adversarial 8).
        if (v.estado !== 'BORRADOR') throw noEditable();
        if (!esToken(pedido.expectedVersion, v.version)) throw errores.conflictoDeVersion();
        const objetivo = pedido.objectiveVersionId ?? v.versionDeObjetivoId;
        if (pedido.objectiveVersionId) await this.exigirObjetivoEfectivo(tx, v.profesionalId, v.asesoradoId, objetivo);
        const contenido = await this.normalizarYVerificar(tx, v.profesionalId, pedido.changes);
        const evaluacion = evaluarTransicionDePlanDeEntrenamiento(v.estado, { transicion: 'GuardarBorrador', cambiosValidosComoBorrador: true });
        if (!evaluacion.permitida) throw noEditable();
        await tx.versionDePlanDeEntrenamiento.update({
          where: { id: v.id },
          data: {
            contenido: contenido as unknown as Prisma.InputJsonValue,
            versionDeObjetivoId: objetivo,
            proximaRevision: pedido.nextReviewAt === undefined ? v.proximaRevision : pedido.nextReviewAt ? new Date(`${pedido.nextReviewAt}T00:00:00.000Z`) : null,
            version: v.version + 1,
          },
        });
        await registrarEventoDeEntrenamiento(tx, {
          tipo: 'BorradorDePlanDeEntrenamientoGuardado',
          profesionalId: v.profesionalId,
          asesoradoId: v.asesoradoId,
          recurso,
          estadoPrevio: 'BORRADOR',
          estadoPosterior: 'BORRADOR',
          actorId: actor.identidadId,
          procedencia,
          momento: await momentoDeLaBase(tx),
        });
        return { estadoHttp: 200, cuerpo: { data: await this.leerVersion(tx, v.id) }, sujetoId: v.asesoradoId, recurso };
      },
    });
  }

  // ─── API-TRN-11 ────────────────────────────────────────────────────────────────────────────
  /** Validar no activa y no es un estado: `200` aunque haya problemas (09v10:784). */
  validar(actor: ActorAutenticado, planId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO, id: planId };
    return this.ejecutor.escribir({
      operacion: 'API-TRN-11',
      casoDeUso: 'UC-I04',
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: VersionEsperadaRequestSchema,
      cuerpo,
      efecto: async (tx, pedido) => {
        const v = await this.versionDelAutor(tx, 'API-TRN-11', actor, planId, ctx);
        if (v.estado !== 'BORRADOR') throw noEditable();
        if (!esToken(pedido.expectedVersion, v.version)) throw errores.conflictoDeVersion();
        const { issues } = await this.problemasParaActivar(tx, v);
        return { estadoHttp: 200, cuerpo: { data: { valid: issues.length === 0, version: `v${v.version}`, issues } }, sujetoId: v.asesoradoId, recurso };
      },
    });
  }

  // ─── API-TRN-12 ────────────────────────────────────────────────────────────────────────────
  activar(actor: ActorAutenticado, planId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO, id: planId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-TRN-12',
      casoDeUso: 'UC-P16',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: VersionEsperadaRequestSchema,
      cuerpo,
      huellaExtra: { planId },
      efecto: async (tx, pedido, procedencia) => {
        // 1-3. Versión esperada, PDP actual, alcance y B2 (09v10:810-812).
        const v = await this.versionDelAutor(tx, 'API-TRN-12', actor, planId, ctx);
        if (!esToken(pedido.expectedVersion, v.version)) throw errores.conflictoDeVersion();
        if (v.estado !== 'BORRADOR') throw new ErrorDeApi(422, CodigoDeError.OPERATION_NOT_READY, 'Esta versión ya está activada.');
        const plan = await tx.planDeEntrenamiento.findUniqueOrThrow({ where: { id: v.planId } });
        // La sucesora se activa sobre la efectiva de la que partió; si cambió, el borrador quedó viejo.
        if (v.predecesoraId !== plan.versionEfectivaId) throw errores.conflictoDeVersion();
        // RF-041: sin vigencias contradictorias. Otro profesional con un seguimiento de entrenamiento abierto con el
        // mismo asesorado es ACTIVE_PLAN_CONFLICT (09v10:830). Las activaciones del asesorado se serializan.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`activacion-entrenamiento|${v.asesoradoId}`}, 0))`;
        const [otro] = await tx.$queryRaw<{ id: string }[]>`
          SELECT "id"::text AS "id" FROM "proceso_operativo"
           WHERE "asesorado_id" = ${v.asesoradoId}::uuid AND "alcance" = 'ENTRENAMIENTO' AND "estado" = 'ABIERTO' AND "profesional_id" <> ${v.profesionalId}::uuid`;
        if (otro) throw new ErrorDeApi(409, CodigoDeError.ACTIVE_PLAN_CONFLICT, 'El asesorado ya tiene un plan de entrenamiento vigente con otro profesional.');
        // 5. Validar (UC-I04).
        const { issues, catalogo } = await this.problemasParaActivar(tx, v);
        if (issues.length > 0) throw noLista(issues);
        // 6. Preservar la instantánea ANTES de la vigencia (REG-06-104).
        const instantanea = construirInstantaneaDeEntrenamiento(v.contenido, catalogo);
        const evaluacion = evaluarTransicionDePlanDeEntrenamiento(v.estado, { transicion: 'ActivarVersion', borradorValido: true, instantaneaPreservable: instantanea !== null });
        if (!evaluacion.permitida || !instantanea) throw noLista([{ code: 'SNAPSHOT_NOT_PRESERVABLE', path: 'blocks' }]);
        const huella = createHash('sha256').update(serializacionCanonica(instantanea)).digest('hex');
        const momento = await momentoDeLaBase(tx);
        await tx.instantaneaDePlanDeEntrenamiento.create({ data: { versionDePlanId: v.id, contenido: instantanea as unknown as Prisma.InputJsonValue, huella } });
        // 7. Conmutar la vigencia única: la versión se vuelve inmutable y el plan apunta a ella (INV-06-110).
        await tx.versionDePlanDeEntrenamiento.update({ where: { id: v.id }, data: { estado: 'ACTIVADA', version: v.version + 1, momentoDeActivacion: momento } });
        // 9. El hecho, en la misma transacción (la base lo exige).
        await registrarEventoDeEntrenamiento(tx, {
          tipo: 'VersionDePlanDeEntrenamientoActivada',
          profesionalId: v.profesionalId,
          asesoradoId: v.asesoradoId,
          recurso,
          estadoPrevio: 'BORRADOR',
          estadoPosterior: 'ACTIVADA',
          actorId: actor.identidadId,
          procedencia,
          momento,
        });
        await tx.planDeEntrenamiento.update({ where: { id: plan.id }, data: { versionEfectivaId: v.id } });
        // 4 y 8. Capacidad y Proceso: continuidad, o NUEVO con admisión (06:5164 «ActivarVersion reutiliza B-04»).
        const apertura = await this.procesos.abrirOContinuar(tx, {
          profesionalId: v.profesionalId,
          asesoradoId: v.asesoradoId,
          alcance: 'ENTRENAMIENTO',
          versionDeAperturaId: v.id,
          actorId: actor.identidadId,
          procedencia,
          momento,
        });
        if (v.proximaRevision) {
          await this.procesos.fijarProximaRevision(tx, {
            procesoId: apertura.procesoId,
            fecha: v.proximaRevision.toISOString().slice(0, 10),
            fuente: { versionDePlanDeEntrenamientoId: v.id },
            actorId: actor.identidadId,
            procedencia,
            momento,
          });
        }
        return {
          estadoHttp: 200,
          cuerpo: {
            data: {
              planId: v.id,
              trainingPlanId: plan.id,
              state: 'ACTIVATED',
              version: `v${v.version + 1}`,
              activatedAt: momento.toISOString(),
              snapshotDigest: huella,
              processId: apertura.procesoId,
              processOpened: apertura.abierto,
              supersededPlanId: plan.versionEfectivaId,
            },
          },
          sujetoId: v.asesoradoId,
          recurso,
        };
      },
    });
  }

  // ─── Auxiliares ─────────────────────────────────────────────────────────────────────────────

  async leerVersion(tx: Tx, id: string): Promise<VersionDePlanDeEntrenamiento> {
    const v = (await tx.versionDePlanDeEntrenamiento.findUniqueOrThrow({ where: { id }, include: INCLUIR_PLAN_DE_ENTRENAMIENTO })) as VersionConPlan;
    const catalogo =
      v.estado === 'BORRADOR'
        ? await this.catalogo.citables(tx, v.plan.profesionalId, 'PROFESIONAL', referenciasDeEjercicio(v.contenido as unknown as ContenidoDePlanDeEntrenamiento))
        : new Map();
    return versionDePlanApi(v, await nombreVisibleDe(tx, v.plan.profesionalId), aCitables(catalogo), await seguimientoAbierto(tx, v.plan.profesionalId, v.plan.asesoradoId));
  }

  /**
   * TRN-08 para el titular: las versiones ACTIVADAS de sus planes, sin borradores. Es su historia, así que se listan
   * todas con su A3 vigente, sin depender de que el profesional conserve el acceso (DL-089 opción A; 08:199, 08:58).
   * Si no se listaran, `API-TRN-09` devolvería 200 sobre una versión que la pantalla ya no puede ofrecer: el titular
   * vería una lista vacía de algo que sí conserva.
   */
  private async listarComoTitular(
    tx: Tx,
    actor: ActorAutenticado,
    consulta: ReturnType<typeof leerConsultaDeLista>,
    ctx: ContextoDeSolicitud,
  ): Promise<{ data: Omit<VersionDePlanDeEntrenamiento, 'blocks'>[]; page: unknown }> {
    await exigirA3Vigente(tx, actor.identidadId);
    const visibles = await tx.planDeEntrenamiento.findMany({ where: { asesoradoId: actor.identidadId }, select: { id: true, profesionalId: true } });
    const filas = consulta.filtros.state === 'DRAFT' || visibles.length === 0
      ? []
      : await tx.versionDePlanDeEntrenamiento.findMany({
          where: { planId: { in: visibles.map((p) => p.id) }, estado: 'ACTIVADA', ...despuesDelCursor(consulta.cursor) },
          include: INCLUIR_PLAN_DE_ENTRENAMIENTO,
          orderBy: ORDEN_DE_LISTA,
          take: consulta.limit + 1,
        });
    const { pagina, page } = paginar(filas, consulta.limit);
    const nombres = new Map<string, string>();
    const abiertos = new Map<string, boolean>();
    for (const p of visibles) {
      nombres.set(p.profesionalId, await nombreVisibleDe(tx, p.profesionalId));
      abiertos.set(p.profesionalId, await seguimientoAbierto(tx, p.profesionalId, actor.identidadId));
    }
    return {
      data: pagina.map((v) => {
        const { blocks: _b, ...resumen } = versionDePlanApi(v, nombres.get(v.plan.profesionalId) ?? '', new Map(), abiertos.get(v.plan.profesionalId) ?? false);
        return resumen;
      }),
      page,
    };
  }

  /**
   * Normaliza la estructura y rechaza lo que no se puede guardar ni siquiera como borrador, con el código que declara
   * el 09 para cada cosa (09v10:748-754). Lo incompleto sí se guarda: lo informa validar.
   */
  private async normalizarYVerificar(tx: Tx, profesionalId: string, entrada: EstructuraDePlanDeEntrenamientoEntrada): Promise<ContenidoDePlanDeEntrenamiento> {
    const r = normalizarEstructuraDeEntrenamiento(entrada, randomUUID);
    if (!r.ok) {
      const codigo = r.tipo === 'ESTRUCTURA' ? CodigoDeError.TRAINING_PLAN_STRUCTURE_INVALID : CodigoDeError.INTENSITY_CRITERION_INVALID;
      throw new ErrorDeApi(422, codigo, 'Hay elementos del plan que no se pueden guardar.', { issues: [...r.issues] });
    }
    const catalogo = await this.catalogo.citables(tx, profesionalId, 'PROFESIONAL', referenciasDeEjercicio(r.contenido));
    const referencias = problemasDeReferencias(r.contenido, aCitables(catalogo));
    if (referencias.length > 0) throw new ErrorDeApi(422, CodigoDeError.EXERCISE_REFERENCE_INVALID, 'Hay ejercicios que no se pueden usar en el plan.', { issues: referencias });
    return r.contenido;
  }

  private async problemasParaActivar(tx: Tx, v: VersionBloqueada): Promise<{ issues: ValidationIssue[]; catalogo: Map<string, EjercicioCitable> }> {
    const catalogo = aCitables(await this.catalogo.citables(tx, v.profesionalId, 'PROFESIONAL', referenciasDeEjercicio(v.contenido)));
    const issues = [...problemasDeCompletitud(v.contenido), ...problemasDeReferencias(v.contenido, catalogo)];
    const objetivoEfectivo = await this.objetivoEfectivoId(tx, v.profesionalId, v.asesoradoId);
    if (objetivoEfectivo !== v.versionDeObjetivoId) issues.push({ code: 'OBJECTIVE_NOT_EFFECTIVE', path: 'objectiveVersionId' });
    return { issues, catalogo };
  }

  /**
   * La versión del profesional autor, bloqueada, con el PDP decidido. Si no existe o es de otro profesional, el mismo
   * 404 (DL-057). Orden de bloqueos: PDP → plan → versión (prisma/concurrencia.ts).
   */
  private async versionDelAutor(tx: Tx, operacion: string, actor: ActorAutenticado, planId: string, ctx: ContextoDeSolicitud): Promise<VersionBloqueada> {
    const recurso = { tipo: RECURSO, id: planId };
    const dueño = esUuid(planId)
      ? await tx.versionDePlanDeEntrenamiento.findUnique({ where: { id: planId }, select: { plan: { select: { id: true, profesionalId: true, asesoradoId: true } } } })
      : null;
    if (!dueño) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso }, ctx);
    await this.decidir(tx, operacion, actor, actor.identidadId, dueño.plan.asesoradoId, recurso, ctx);
    if (dueño.plan.profesionalId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso, sujetoId: dueño.plan.asesoradoId }, ctx);
    await tx.$queryRaw`SELECT 1 FROM "plan_de_entrenamiento" WHERE "id" = ${dueño.plan.id}::uuid FOR NO KEY UPDATE`;
    const [v] = await tx.$queryRaw<Omit<VersionBloqueada, 'profesionalId' | 'asesoradoId'>[]>`
      SELECT "id"::text AS "id", "plan_id"::text AS "planId", "predecesora_id"::text AS "predecesoraId", "estado"::text AS "estado",
             "version", "version_de_objetivo_id"::text AS "versionDeObjetivoId", "contenido", "proxima_revision" AS "proximaRevision"
        FROM "version_de_plan_de_entrenamiento" WHERE "id" = ${planId}::uuid FOR NO KEY UPDATE`;
    if (!v) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso }, ctx);
    return { ...v, profesionalId: dueño.plan.profesionalId, asesoradoId: dueño.plan.asesoradoId };
  }

  /** El plan de la terna, creado si no existe, y bloqueado. */
  private async planBloqueado(tx: Tx, profesionalId: string, asesoradoId: string): Promise<{ id: string; versionEfectivaId: string | null }> {
    await tx.$executeRaw`
      INSERT INTO "plan_de_entrenamiento" ("id", "profesional_id", "asesorado_id")
      VALUES (gen_random_uuid(), ${profesionalId}::uuid, ${asesoradoId}::uuid)
      ON CONFLICT ("profesional_id", "asesorado_id") DO NOTHING`;
    const [fila] = await tx.$queryRaw<{ id: string; versionEfectivaId: string | null }[]>`
      SELECT "id"::text AS "id", "version_efectiva_id"::text AS "versionEfectivaId" FROM "plan_de_entrenamiento"
       WHERE "profesional_id" = ${profesionalId}::uuid AND "asesorado_id" = ${asesoradoId}::uuid FOR NO KEY UPDATE`;
    if (!fila) throw new Error('plan no creado');
    return fila;
  }

  private async objetivoEfectivoId(tx: Tx, profesionalId: string, asesoradoId: string): Promise<string | null> {
    const objetivo = await tx.objetivoDeEntrenamiento.findUnique({ where: { profesionalId_asesoradoId: { profesionalId, asesoradoId } }, select: { id: true } });
    return objetivo ? ((await this.evaluaciones.efectivaDe(tx, objetivo.id))?.id ?? null) : null;
  }

  /** «Objetivo compatible obligatorio» (09v10:686): el efectivo de esta terna. */
  private async exigirObjetivoEfectivo(tx: Tx, profesionalId: string, asesoradoId: string, versionId: string): Promise<void> {
    if ((await this.objetivoEfectivoId(tx, profesionalId, asesoradoId)) !== versionId) throw objetivoNoAplicable();
  }

  /** PDP en la transacción, alcance ENTRENAMIENTO. Devuelve el titular resuelto. */
  private async decidir(tx: Tx, operacion: string, actor: ActorAutenticado, profesionalId: string, titularId: string, recurso: { tipo: string; id: string } | null, ctx: ContextoDeSolicitud): Promise<string> {
    const d = await this.pdp.decidirEnTransaccion(tx, { operacion, actorDeLaDecision: actor.identidadId, profesionalId, titularId, alcance: 'ENTRENAMIENTO', recurso }, ctx);
    return d.hechos.titular?.identidadId as string;
  }
}

/** Del catálogo de la API a la forma que usan las reglas puras. */
function aCitables(filas: ReadonlyMap<string, { ejercicioId: string; nombre: string; disponible: boolean }>): Map<string, EjercicioCitable> {
  return new Map([...filas].map(([k, f]) => [k, { ejercicioId: f.ejercicioId, nombre: f.nombre, disponible: f.disponible }]));
}
