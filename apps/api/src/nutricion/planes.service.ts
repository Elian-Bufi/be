import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  CrearPlanRequestSchema,
  EditarBorradorRequestSchema,
  VersionEsperadaRequestSchema,
  construirInstantanea,
  copiarEstructura,
  evaluarSucesion,
  evaluarTransicionDePlan,
  normalizarEstructura,
  problemasDeBorrador,
  problemasParaActivar,
  serializacionCanonica,
  type ContenidoDePlan,
  type Procedencia,
  type ValidationIssue,
  type VersionDePlan,
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
import { CatalogoService } from './catalogo.service';
import { EjecutorNutricional, esUuid } from './ejecutor';
import { EvaluacionesService } from './evaluaciones.service';
import { registrarEventoDeNutricion } from './eventos';
import { INCLUIR_PLAN, nombreVisibleDe, nombresDeCatalogo, versionDePlanApi, type VersionConPlan } from './lectura-nutricion';

type Tx = Prisma.TransactionClient;

interface VersionBloqueada {
  id: string;
  planId: string;
  predecesoraId: string | null;
  estado: 'BORRADOR' | 'ACTIVADA';
  version: number;
  versionDeObjetivoId: string;
  contenido: ContenidoDePlan;
  proximaRevision: Date | null;
  profesionalId: string;
  asesoradoId: string;
}

const noEditable = () =>
  new ErrorDeApi(422, CodigoDeError.PLAN_NOT_EDITABLE, 'Esta versión está activada y no se puede editar. Para cambiarla, creá una nueva versión a partir de esta.');
const noLista = (issues: ValidationIssue[]) =>
  new ErrorDeApi(422, CodigoDeError.OPERATION_NOT_READY, 'Hay elementos por corregir antes de activar.', { issues });
const objetivoNoAplicable = () =>
  new ErrorDeApi(422, CodigoDeError.OBJECTIVE_NOT_EFFECTIVE_OR_COMPATIBLE, 'El objetivo indicado no es el objetivo vigente de este asesorado.', {
    issues: [{ code: 'OBJECTIVE_NOT_EFFECTIVE_OR_COMPATIBLE', path: 'objectiveVersionId' }],
  });

/** Problemas de borrador → error de API (09v9:558-562): modalidad B, referencia de catálogo o estructura. */
function errorDeBorrador(issues: ValidationIssue[]): ErrorDeApi {
  const codigo = issues.some((i) => i.code === 'EXCHANGE_MODE_NOT_AVAILABLE')
    ? CodigoDeError.EXCHANGE_MODE_NOT_AVAILABLE
    : issues.some((i) => i.code === 'CATALOG_REFERENCE_INVALID')
      ? CodigoDeError.CATALOG_REFERENCE_INVALID
      : CodigoDeError.NUTRITION_PLAN_STRUCTURE_INVALID;
  return new ErrorDeApi(422, codigo, 'Hay elementos del plan que no se pueden guardar.', { issues });
}

const idsDeCatalogo = (c: ContenidoDePlan): string[] => c.dayTypes.flatMap((d) => d.meals.flatMap((m) => m.options.flatMap((o) => o.items.map((i) => i.catalogItemId))));

/**
 * UC-P10 y UC-P11 — Plan nutricional (API-NUT-07 a 12; RF-030, RF-031).
 *
 * - Versión de plan con la máquina literal del §10.7: BORRADOR → ACTIVADA y nada más (06:4307; INV-06-109). La base
 *   rechaza cualquier cambio sobre una ACTIVADA: si este servicio tuviera un error, igual no se podría reabrir.
 * - Corregir un plan activado es emitir una sucesora: con API-NUT-07 y `basedOnPlanId` (UC-P10 V07; DL-047) o al
 *   aplicar una revisión AJUSTAR o SUSTITUIR (DL-052). La activada y su instantánea quedan intactas.
 * - La activación es atómica (REG-06-104; 09v9:616-632): PDP, validación, instantánea ANTES de la vigencia, vigencia
 *   única, Proceso nuevo con capacidad o continuidad, eventos y auditoría. Si algo falla, no cambia nada.
 */
@Injectable()
export class PlanesService {
  constructor(
    private readonly ejecutor: EjecutorNutricional,
    private readonly pdp: PdpService,
    private readonly catalogo: CatalogoService,
    private readonly evaluaciones: EvaluacionesService,
    private readonly procesos: ProcesoService,
  ) {}

  // ─── API-NUT-07 ────────────────────────────────────────────────────────────────────────────
  crearBorrador(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-NUT-07',
      casoDeUso: 'UC-P10',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      clave,
      esquema: CrearPlanRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        const asesoradoId = await this.decidir(tx, 'API-NUT-07', actor, actor.identidadId, adviseeId, { tipo: 'Asesorado', id: adviseeId }, ctx);
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
        return {
          estadoHttp: 201,
          cuerpo: { data: await this.leerVersion(tx, version, actor.identidadId) },
          sujetoId: asesoradoId,
          recurso: { tipo: 'VersionDePlanNutricional', id: version },
        };
      },
    });
  }

  /**
   * CrearBorrador (06 §10.7): versión editable, no vigente, sucesora de la efectiva si la hay (REG-06-12, 103). Un solo
   * borrador por plan. La usan API-NUT-07 y la aplicación de AJUSTAR o SUSTITUIR.
   */
  async crearVersionBorrador(
    tx: Tx,
    p: {
      profesionalId: string;
      asesoradoId: string;
      objetivoVersionId: string;
      estructura: { dayTypes: Parameters<typeof normalizarEstructura>[0]['dayTypes'] } | null;
      /** `planId` de la versión efectiva a copiar (DL-047), o `null`. */
      basadaEn: string | null;
      proximaRevision: string | null;
      revisionDeOrigenId: string | null;
      procedencia: Procedencia;
    },
  ): Promise<string> {
    await this.exigirObjetivoEfectivo(tx, p.profesionalId, p.asesoradoId, p.objetivoVersionId);
    const plan = await this.planBloqueado(tx, p.profesionalId, p.asesoradoId);
    const versiones = await tx.versionDePlanNutricional.findMany({ where: { planId: plan.id }, select: { id: true, planId: true, predecesoraId: true, estado: true, contenido: true } });
    const borrador = versiones.find((v) => v.estado === 'BORRADOR');
    if (borrador) {
      throw new ErrorDeApi(409, CodigoDeError.RESOURCE_CONFLICT, 'Ya hay un borrador de este plan. Seguí trabajando sobre ese borrador.', { draftPlanId: borrador.id });
    }
    let contenido: ContenidoDePlan;
    if (p.basadaEn) {
      if (p.basadaEn !== plan.versionEfectivaId) {
        throw errores.validacionFallida([{ code: 'BASED_ON_MUST_BE_EFFECTIVE_VERSION', path: 'basedOnPlanId' }]);
      }
      const base = versiones.find((v) => v.id === p.basadaEn);
      contenido = copiarEstructura(base?.contenido as unknown as ContenidoDePlan);
      // La copia conserva los identificadores de nodo; solo se verifica la estructura (el catálogo lo informa validar).
      const estructurales = problemasDeBorrador(contenido, new Set(idsDeCatalogo(contenido))).filter((i) => i.code !== 'CATALOG_REFERENCE_INVALID');
      if (estructurales.length > 0) throw errorDeBorrador(estructurales);
    } else {
      contenido = normalizarEstructura(p.estructura ?? { dayTypes: [] }, randomUUID);
      const disponibles = await this.catalogo.disponibles(tx, p.profesionalId, idsDeCatalogo(contenido));
      const problemas = problemasDeBorrador(contenido, new Set(disponibles.keys()));
      if (problemas.length > 0) throw errorDeBorrador(problemas);
    }
    const predecesora = plan.versionEfectivaId;
    const sucesion = evaluarSucesion(
      versiones.map((v) => ({ id: v.id, objetoId: v.planId, predecesoraId: v.predecesoraId })),
      { objetoId: plan.id, predecesoraId: predecesora },
    );
    if (!sucesion.valida) throw errores.conflictoDeVersion();
    const evaluacion = evaluarTransicionDePlan(null, { transicion: 'CrearBorrador', evaluacionYObjetivoIdentificables: true });
    if (!evaluacion.permitida) throw errores.estadoNoPermite();
    const momento = await momentoDeLaBase(tx);
    const version = await tx.versionDePlanNutricional.create({
      data: {
        planId: plan.id,
        predecesoraId: predecesora,
        versionDeObjetivoId: p.objetivoVersionId,
        contenido: contenido as unknown as Prisma.InputJsonValue,
        proximaRevision: p.proximaRevision ? new Date(`${p.proximaRevision}T00:00:00.000Z`) : null,
        revisionDeOrigenId: p.revisionDeOrigenId,
        autorId: p.profesionalId,
        procedencia: p.procedencia as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });
    await registrarEventoDeNutricion(tx, {
      tipo: 'BorradorDePlanCreado',
      profesionalId: p.profesionalId,
      asesoradoId: p.asesoradoId,
      recurso: { tipo: 'VersionDePlanNutricional', id: version.id },
      estadoPrevio: null,
      estadoPosterior: 'BORRADOR',
      actorId: p.profesionalId,
      procedencia: p.procedencia,
      momento,
    });
    return version.id;
  }

  // ─── API-NUT-08 ────────────────────────────────────────────────────────────────────────────
  listar(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: Omit<VersionDePlan, 'dayTypes'>[]; page: unknown }> {
    const consulta = leerConsultaDeLista(query, { state: ['DRAFT', 'ACTIVATED'] });
    return this.ejecutor.leer({
      operacion: 'API-NUT-08',
      casoDeUso: 'UC-P10',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        const asesoradoId = await this.decidir(tx, 'API-NUT-08', actor, actor.identidadId, adviseeId, null, ctx);
        const estado = consulta.filtros.state === 'DRAFT' ? 'BORRADOR' : consulta.filtros.state === 'ACTIVATED' ? 'ACTIVADA' : undefined;
        const filas = await tx.versionDePlanNutricional.findMany({
          where: { plan: { profesionalId: actor.identidadId, asesoradoId }, ...(estado ? { estado } : {}), ...despuesDelCursor(consulta.cursor) },
          include: INCLUIR_PLAN,
          orderBy: ORDEN_DE_LISTA,
          take: consulta.limit + 1,
        });
        const { pagina, page } = paginar(filas, consulta.limit);
        const nombre = await nombreVisibleDe(tx, actor.identidadId);
        return {
          data: pagina.map((v) => {
            const { dayTypes: _d, ...resumen } = versionDePlanApi(v, nombre, new Map(), false);
            return resumen;
          }),
          page,
        };
      },
    });
  }

  // ─── API-NUT-09 ────────────────────────────────────────────────────────────────────────────
  /**
   * El profesional autor ve sus versiones; el asesorado titular ve solo las ACTIVADAS (09v9:503-509: «no expone
   * borradores»), desde la instantánea y solo con el Proceso vigente (REG-06-66; UC-P12 E06).
   */
  consultar(actor: ActorAutenticado, planId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: VersionDePlan }> {
    sinParametrosDeQuery(query);
    const recurso = { tipo: 'VersionDePlanNutricional', id: planId };
    return this.ejecutor.leer({
      operacion: 'API-NUT-09',
      casoDeUso: 'UC-P10',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const v = esUuid(planId) ? await tx.versionDePlanNutricional.findUnique({ where: { id: planId }, include: INCLUIR_PLAN }) : null;
        if (!v) throw this.ejecutor.noRevelable({ operacion: 'API-NUT-09', actorId: actor.identidadId, recurso }, ctx);
        const titular = v.plan.asesoradoId;
        if (titular === actor.identidadId) {
          // El asesorado: solo versiones activadas y con su Proceso vigente (el PDP evaluado sobre el profesional del plan).
          if (v.estado !== 'ACTIVADA') throw this.ejecutor.noRevelable({ operacion: 'API-NUT-09', actorId: actor.identidadId, recurso, sujetoId: titular }, ctx);
          await this.decidir(tx, 'API-NUT-09', actor, v.plan.profesionalId, titular, recurso, ctx);
        } else {
          // Un profesional: primero el PDP sobre el titular real (queda su dimensión); después, que el plan sea suyo (DL-057).
          await this.decidir(tx, 'API-NUT-09', actor, actor.identidadId, titular, recurso, ctx);
          if (v.plan.profesionalId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-NUT-09', actorId: actor.identidadId, recurso, sujetoId: titular }, ctx);
        }
        return { data: await this.leerVersion(tx, v.id, v.plan.profesionalId) };
      },
    });
  }

  // ─── API-NUT-10 ────────────────────────────────────────────────────────────────────────────
  editarBorrador(actor: ActorAutenticado, planId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'VersionDePlanNutricional', id: planId };
    return this.ejecutor.escribir({
      operacion: 'API-NUT-10',
      casoDeUso: 'UC-P10',
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: EditarBorradorRequestSchema,
      cuerpo,
      efecto: async (tx, pedido, procedencia) => {
        const v = await this.versionDelAutor(tx, 'API-NUT-10', actor, planId, ctx);
        // La inmutabilidad se informa antes que la versión: editar una ACTIVADA nunca es posible (adversarial 8).
        if (v.estado !== 'BORRADOR') throw noEditable();
        if (!esToken(pedido.expectedVersion, v.version)) throw errores.conflictoDeVersion();
        const objetivo = pedido.objectiveVersionId ?? v.versionDeObjetivoId;
        if (pedido.objectiveVersionId) await this.exigirObjetivoEfectivo(tx, v.profesionalId, v.asesoradoId, objetivo);
        const contenido = normalizarEstructura(pedido.changes, randomUUID);
        const disponibles = await this.catalogo.disponibles(tx, v.profesionalId, idsDeCatalogo(contenido));
        const problemas = problemasDeBorrador(contenido, new Set(disponibles.keys()));
        if (problemas.length > 0) throw errorDeBorrador(problemas);
        const evaluacion = evaluarTransicionDePlan(v.estado, { transicion: 'GuardarBorrador', cambiosValidosComoBorrador: true });
        if (!evaluacion.permitida) throw noEditable();
        const momento = await momentoDeLaBase(tx);
        await tx.versionDePlanNutricional.update({
          where: { id: v.id },
          data: {
            contenido: contenido as unknown as Prisma.InputJsonValue,
            versionDeObjetivoId: objetivo,
            proximaRevision: pedido.nextReviewAt === undefined ? v.proximaRevision : pedido.nextReviewAt ? new Date(`${pedido.nextReviewAt}T00:00:00.000Z`) : null,
            version: v.version + 1,
          },
        });
        await registrarEventoDeNutricion(tx, {
          tipo: 'BorradorDePlanGuardado',
          profesionalId: v.profesionalId,
          asesoradoId: v.asesoradoId,
          recurso,
          estadoPrevio: 'BORRADOR',
          estadoPosterior: 'BORRADOR',
          actorId: actor.identidadId,
          procedencia,
          momento,
        });
        return { estadoHttp: 200, cuerpo: { data: await this.leerVersion(tx, v.id, v.profesionalId) }, sujetoId: v.asesoradoId, recurso };
      },
    });
  }

  // ─── API-NUT-11 ────────────────────────────────────────────────────────────────────────────
  /** UC-I04: validar no activa (TEST-NUT-001). Responde 200 aunque haya problemas (09v9:584-597). */
  validar(actor: ActorAutenticado, planId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'VersionDePlanNutricional', id: planId };
    return this.ejecutor.escribir({
      operacion: 'API-NUT-11',
      casoDeUso: 'UC-I04',
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: VersionEsperadaRequestSchema,
      cuerpo,
      efecto: async (tx, pedido) => {
        const v = await this.versionDelAutor(tx, 'API-NUT-11', actor, planId, ctx);
        if (v.estado !== 'BORRADOR') throw noEditable();
        if (!esToken(pedido.expectedVersion, v.version)) throw errores.conflictoDeVersion();
        const issues = await this.problemasParaActivar(tx, v);
        return {
          estadoHttp: 200,
          cuerpo: { data: { valid: issues.length === 0, version: `v${v.version}`, issues } },
          sujetoId: v.asesoradoId,
          recurso,
        };
      },
    });
  }

  // ─── API-NUT-12 ────────────────────────────────────────────────────────────────────────────
  activar(actor: ActorAutenticado, planId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'VersionDePlanNutricional', id: planId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-NUT-12',
      casoDeUso: 'UC-P11',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: VersionEsperadaRequestSchema,
      cuerpo,
      huellaExtra: { planId },
      efecto: async (tx, pedido, procedencia) => {
        // 1-3. PDP actual y la versión reclamada (09v9:616-620).
        const v = await this.versionDelAutor(tx, 'API-NUT-12', actor, planId, ctx);
        if (!esToken(pedido.expectedVersion, v.version)) throw errores.conflictoDeVersion();
        if (v.estado !== 'BORRADOR') throw new ErrorDeApi(422, CodigoDeError.OPERATION_NOT_READY, 'Esta versión ya está activada.');
        const plan = await tx.planNutricional.findUniqueOrThrow({ where: { id: v.planId } });
        // La sucesora se activa sobre la efectiva de la que partió; si cambió, el borrador quedó viejo.
        if (v.predecesoraId !== plan.versionEfectivaId) throw errores.conflictoDeVersion();
        await this.exigirObjetivoEfectivo(tx, v.profesionalId, v.asesoradoId, v.versionDeObjetivoId, 'OPERATION_NOT_READY');
        // RF-031: sin vigencias contradictorias. Otro profesional con un seguimiento nutricional abierto con el mismo
        // asesorado es un conflicto (09v9:637 ACTIVE_PLAN_CONFLICT). Las activaciones del asesorado se serializan.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`activacion-nutricional|${v.asesoradoId}`}, 0))`;
        const [otro] = await tx.$queryRaw<{ id: string }[]>`
          SELECT "id"::text AS "id" FROM "proceso_operativo"
           WHERE "asesorado_id" = ${v.asesoradoId}::uuid AND "alcance" = 'NUTRICION' AND "estado" = 'ABIERTO' AND "profesional_id" <> ${v.profesionalId}::uuid`;
        if (otro) throw new ErrorDeApi(409, CodigoDeError.ACTIVE_PLAN_CONFLICT, 'El asesorado ya tiene un plan nutricional vigente con otro profesional.');
        // 5. Validar estructura (UC-I04).
        const ids = idsDeCatalogo(v.contenido);
        const catalogo = await this.catalogo.disponibles(tx, v.profesionalId, ids);
        const issues = problemasParaActivar(v.contenido, new Set(catalogo.keys()));
        if (issues.length > 0) throw noLista(issues);
        // 6. Preservar la instantánea ANTES de la vigencia (REG-06-104; 06:1391).
        const instantanea = construirInstantanea(v.contenido, catalogo);
        const evaluacion = evaluarTransicionDePlan(v.estado, {
          transicion: 'ActivarVersion',
          validacionFavorable: true,
          instantaneaPreservable: instantanea !== null,
          // La capacidad se decide al abrir el Proceso, más abajo, en esta misma transacción: si no admite, se revierte todo.
          capacidadFavorable: true,
        });
        if (!evaluacion.permitida || !instantanea) throw noLista([{ code: 'SNAPSHOT_NOT_PRESERVABLE', path: 'dayTypes' }]);
        const huella = createHash('sha256').update(serializacionCanonica(instantanea)).digest('hex');
        const momento = await momentoDeLaBase(tx);
        await tx.instantaneaDePlanNutricional.create({
          data: { versionDePlanId: v.id, contenido: instantanea as unknown as Prisma.InputJsonValue, huella },
        });
        // 7. Conmutar la vigencia única: la versión se vuelve inmutable y el plan apunta a ella (INV-06-110).
        await tx.versionDePlanNutricional.update({ where: { id: v.id }, data: { estado: 'ACTIVADA', version: v.version + 1, momentoDeActivacion: momento } });
        await registrarEventoDeNutricion(tx, {
          tipo: 'VersionDePlanActivada',
          profesionalId: v.profesionalId,
          asesoradoId: v.asesoradoId,
          recurso,
          estadoPrevio: 'BORRADOR',
          estadoPosterior: 'ACTIVADA',
          actorId: actor.identidadId,
          procedencia,
          momento,
        });
        await tx.planNutricional.update({ where: { id: plan.id }, data: { versionEfectivaId: v.id } });
        // 4 y 8. Proceso: continuidad, o NUEVO con admisión de capacidad (REG-06-64, 91, 93).
        const apertura = await this.procesos.abrirOContinuar(tx, {
          profesionalId: v.profesionalId,
          asesoradoId: v.asesoradoId,
          alcance: 'NUTRICION',
          versionDeAperturaId: v.id,
          actorId: actor.identidadId,
          procedencia,
          momento,
        });
        // REG-06-145: la próxima revisión que fija la versión se vuelve expectativa del Proceso.
        if (v.proximaRevision) {
          await this.procesos.fijarProximaRevision(tx, {
            procesoId: apertura.procesoId,
            fecha: v.proximaRevision.toISOString().slice(0, 10),
            fuente: { versionDePlanId: v.id },
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
              nutritionPlanId: plan.id,
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

  async leerVersion(tx: Tx, id: string, profesionalId: string): Promise<VersionDePlan> {
    const v = (await tx.versionDePlanNutricional.findUniqueOrThrow({ where: { id }, include: INCLUIR_PLAN })) as VersionConPlan;
    const catalogo = v.estado === 'BORRADOR' ? await nombresDeCatalogo(tx, v.contenido as unknown as ContenidoDePlan) : new Map();
    return versionDePlanApi(v, await nombreVisibleDe(tx, profesionalId), catalogo);
  }

  private async problemasParaActivar(tx: Tx, v: VersionBloqueada): Promise<ValidationIssue[]> {
    const catalogo = await this.catalogo.disponibles(tx, v.profesionalId, idsDeCatalogo(v.contenido));
    const issues = problemasParaActivar(v.contenido, new Set(catalogo.keys()));
    const objetivoEfectivo = await this.objetivoEfectivoId(tx, v.profesionalId, v.asesoradoId);
    if (objetivoEfectivo !== v.versionDeObjetivoId) issues.push({ code: 'OBJECTIVE_NOT_EFFECTIVE', path: 'objectiveVersionId' });
    return issues;
  }

  /**
   * Versión del profesional autor, bloqueada, con el PDP decidido. Si no existe o es de otro profesional, 404 idéntico
   * (DL-057). El orden de bloqueos es PDP → plan → versión (prisma/concurrencia.ts).
   */
  private async versionDelAutor(tx: Tx, operacion: string, actor: ActorAutenticado, planId: string, ctx: ContextoDeSolicitud): Promise<VersionBloqueada> {
    const recurso = { tipo: 'VersionDePlanNutricional', id: planId };
    const dueño = esUuid(planId)
      ? await tx.versionDePlanNutricional.findUnique({ where: { id: planId }, select: { plan: { select: { id: true, profesionalId: true, asesoradoId: true } } } })
      : null;
    if (!dueño) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso }, ctx);
    await this.decidir(tx, operacion, actor, actor.identidadId, dueño.plan.asesoradoId, recurso, ctx);
    if (dueño.plan.profesionalId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso, sujetoId: dueño.plan.asesoradoId }, ctx);
    await tx.$queryRaw`SELECT 1 FROM "plan_nutricional" WHERE "id" = ${dueño.plan.id}::uuid FOR NO KEY UPDATE`;
    const [v] = await tx.$queryRaw<Omit<VersionBloqueada, 'profesionalId' | 'asesoradoId'>[]>`
      SELECT "id"::text AS "id", "plan_id"::text AS "planId", "predecesora_id"::text AS "predecesoraId", "estado"::text AS "estado",
             "version", "version_de_objetivo_id"::text AS "versionDeObjetivoId", "contenido", "proxima_revision" AS "proximaRevision"
        FROM "version_de_plan_nutricional" WHERE "id" = ${planId}::uuid FOR NO KEY UPDATE`;
    if (!v) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso }, ctx);
    return { ...v, profesionalId: dueño.plan.profesionalId, asesoradoId: dueño.plan.asesoradoId };
  }

  /** El plan de la terna, creado si no existe, y bloqueado. */
  private async planBloqueado(tx: Tx, profesionalId: string, asesoradoId: string): Promise<{ id: string; versionEfectivaId: string | null }> {
    await tx.$executeRaw`
      INSERT INTO "plan_nutricional" ("id", "profesional_id", "asesorado_id")
      VALUES (gen_random_uuid(), ${profesionalId}::uuid, ${asesoradoId}::uuid)
      ON CONFLICT ("profesional_id", "asesorado_id") DO NOTHING`;
    const [fila] = await tx.$queryRaw<{ id: string; versionEfectivaId: string | null }[]>`
      SELECT "id"::text AS "id", "version_efectiva_id"::text AS "versionEfectivaId" FROM "plan_nutricional"
       WHERE "profesional_id" = ${profesionalId}::uuid AND "asesorado_id" = ${asesoradoId}::uuid FOR NO KEY UPDATE`;
    if (!fila) throw new Error('plan no creado');
    return fila;
  }

  private async objetivoEfectivoId(tx: Tx, profesionalId: string, asesoradoId: string): Promise<string | null> {
    const objetivo = await tx.objetivoNutricional.findUnique({ where: { profesionalId_asesoradoId: { profesionalId, asesoradoId } }, select: { id: true } });
    return objetivo ? ((await this.evaluaciones.efectivaDe(tx, objetivo.id))?.id ?? null) : null;
  }

  /** REG-06-102: el plan se relaciona con la versión de objetivo aplicable, que es la efectiva de esta terna. */
  private async exigirObjetivoEfectivo(tx: Tx, profesionalId: string, asesoradoId: string, versionId: string, codigo?: 'OPERATION_NOT_READY'): Promise<void> {
    if ((await this.objetivoEfectivoId(tx, profesionalId, asesoradoId)) === versionId) return;
    if (codigo) throw noLista([{ code: 'OBJECTIVE_NOT_EFFECTIVE', path: 'objectiveVersionId' }]);
    throw objetivoNoAplicable();
  }

  /** PDP en la transacción. Devuelve el titular resuelto. */
  private async decidir(tx: Tx, operacion: string, actor: ActorAutenticado, profesionalId: string, titularId: string, recurso: { tipo: string; id: string } | null, ctx: ContextoDeSolicitud): Promise<string> {
    const d = await this.pdp.decidirEnTransaccion(tx, { operacion, actorDeLaDecision: actor.identidadId, profesionalId, titularId, alcance: 'NUTRICION', recurso }, ctx);
    return d.hechos.titular?.identidadId as string;
  }
}

