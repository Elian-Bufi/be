import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  CorregirIngestaRequestSchema,
  RegistrarIngestaRequestSchema,
  evaluarIngestaPrescripta,
  evaluarNuevaCorreccion,
  serializacionCanonica,
  type ContenidoDeInstantanea,
  type HoyResponse,
  type Ingesta,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { DenegacionDelPdp, PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { CatalogoService } from './catalogo.service';
import { EjecutorNutricional, esUuid } from './ejecutor';
import { registrarEventoDeNutricion } from './eventos';
import { diasTipoApi, ingestaApi, nombreVisibleDe } from './lectura-nutricion';
import { ZONA_POR_DEFECTO, fechaLocalEn } from './zona';

type Tx = Prisma.TransactionClient;

const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000;
const INCLUIR_CORRECCIONES = { correcciones: true } as const;

/** Plan vigente del asesorado: versión efectiva de un plan con su Proceso ABIERTO (REG-06-66; UC-I06 V05). */
interface PlanDelAsesorado {
  versionId: string;
  version: number;
  profesionalId: string;
  momentoDeActivacion: Date;
  versionDeObjetivoId: string;
  instantanea: ContenidoDeInstantanea;
}

/**
 * UC-P12 — «Hoy» y registro de ingesta del asesorado (API-NUT-14 a 16; RF-032, RF-033) y estructuración profesional de
 * una ingesta libre (API-NUT-21; UC-I12).
 *
 * - El asesorado ve exactamente la instantánea vigente, nunca un borrador ni el catálogo actual (REG-06-105).
 * - La ingesta se registra contra la versión vigente y nunca modifica la prescripción (REG-06-106).
 * - La vigencia la decide el mismo PDP: si el asesorado revocó el consentimiento o su A3, «UC-I02 deniega la operación
 *   futura» (UC-P12 E06).
 * - Prescripto ≠ registrado, y una comida fuera del plan es un dato aparte que no marca ninguna comida (CONS:599-612).
 * - La corrección de una ingesta libre es una Corrección trazable de B-06: el original queda intacto (REG-06-14, 121).
 */
@Injectable()
export class IngestasService {
  constructor(private readonly ejecutor: EjecutorNutricional, private readonly pdp: PdpService, private readonly catalogo: CatalogoService) {}

  // ─── API-NUT-14 ────────────────────────────────────────────────────────────────────────────
  hoy(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<HoyResponse> {
    const { dayTypeId, ...resto } = query;
    sinParametrosDeQuery(resto);
    if (dayTypeId !== undefined && typeof dayTypeId !== 'string') throw errores.solicitudInvalida([{ code: 'INVALID_DAY_TYPE', path: 'dayTypeId' }]);
    return this.ejecutor.leer({
      operacion: 'API-NUT-14',
      casoDeUso: 'UC-P12',
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        const zona = ZONA_POR_DEFECTO;
        const fecha = fechaLocalEn(await momentoDeLaBase(tx), zona);
        const registrado = await this.ingestasDelDia(tx, actor.identidadId, fecha);
        const base = { date: fecha, timeZone: zona, registeredIntake: registrado, dataState: registrado.length > 0 ? ('HAS_DATA' as const) : ('NO_DATA' as const) };
        const plan = await this.planVigente(tx, actor.identidadId);
        if (!plan) return { data: { ...base, planState: 'NO_ACTIVE_PLAN', activePlan: null, selectedDayTypeId: null } };
        try {
          await this.pdp.decidirEnTransaccion(
            tx,
            { operacion: 'API-NUT-14', actorDeLaDecision: actor.identidadId, profesionalId: plan.profesionalId, titularId: actor.identidadId, alcance: 'NUTRICION', recurso: { tipo: 'VersionDePlanNutricional', id: plan.versionId } },
            ctx,
          );
        } catch (e) {
          if (!(e instanceof DenegacionDelPdp)) throw e;
          // UC-P12 E06: hay plan, pero el acceso está suspendido. La decisión denegada queda registrada.
          await this.pdp.registrarDenegacion(e);
          return { data: { ...base, planState: 'NOT_AVAILABLE', activePlan: null, selectedDayTypeId: null } };
        }
        const objetivo = await tx.versionDeObjetivoNutricional.findUniqueOrThrow({ where: { id: plan.versionDeObjetivoId } });
        const dias = diasTipoApi({ dayTypes: [] }, plan.instantanea, new Map());
        // No se elige un día tipo en silencio (09v9:680; DL-049): el único, o el que eligió el asesorado.
        const elegido = dias.length === 1 ? dias[0]!.dayTypeId : dias.find((d) => d.dayTypeId === dayTypeId)?.dayTypeId ?? null;
        return {
          data: {
            ...base,
            planState: 'AVAILABLE',
            activePlan: {
              planId: plan.versionId,
              version: `v${plan.version}`,
              activatedAt: plan.momentoDeActivacion.toISOString(),
              objective: {
                versionId: objetivo.id,
                estimatedEnergyRequirement: objetivo.requerimientoEnergetico as never,
                macronutrientDistribution: objetivo.distribucionDeMacronutrientes as never,
                mealDistribution: objetivo.distribucionPorComida,
                effectiveFrom: objetivo.vigenteDesde.toISOString(),
                effectiveUntil: objetivo.vigenteHasta?.toISOString() ?? null,
              },
              dayTypes: dias,
            },
            selectedDayTypeId: elegido,
          },
        };
      },
    });
  }

  // ─── API-NUT-15 ────────────────────────────────────────────────────────────────────────────
  registrar(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-NUT-15',
      casoDeUso: 'UC-P12',
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: RegistrarIngestaRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        const recurso = { tipo: 'VersionDePlanNutricional', id: pedido.activePlanId };
        const dueño = esUuid(pedido.activePlanId)
          ? await tx.versionDePlanNutricional.findUnique({ where: { id: pedido.activePlanId }, select: { estado: true, plan: { select: { asesoradoId: true, profesionalId: true } } } })
          : null;
        // Un plan ajeno o un borrador no existen para el asesorado (09v9:503).
        if (!dueño || dueño.plan.asesoradoId !== actor.identidadId || dueño.estado !== 'ACTIVADA') {
          throw this.ejecutor.noRevelable({ operacion: 'API-NUT-15', actorId: actor.identidadId, recurso, sujetoId: dueño ? dueño.plan.asesoradoId : null }, ctx);
        }
        await this.pdp.decidirEnTransaccion(
          tx,
          { operacion: 'API-NUT-15', actorDeLaDecision: actor.identidadId, profesionalId: dueño.plan.profesionalId, titularId: actor.identidadId, alcance: 'NUTRICION', recurso },
          ctx,
        );
        const plan = await this.planVigente(tx, actor.identidadId);
        // UC-P12 E03: una referencia que ya no es la vigente no se reasigna en silencio.
        if (!plan || plan.versionId !== pedido.activePlanId) {
          throw new ErrorDeApi(422, CodigoDeError.ACTIVE_PLAN_REQUIRED, 'El plan que estás viendo ya no es el vigente. Actualizá para ver tu plan actual.');
        }
        const momento = await momentoDeLaBase(tx);
        const ocurrencia = new Date(pedido.occurredAt);
        if (ocurrencia.getTime() > momento.getTime() + TOLERANCIA_FUTURO_MS) {
          throw new ErrorDeApi(422, CodigoDeError.NUTRITION_EXECUTION_INVALID, 'La comida no puede ser futura.', { issues: [{ code: 'OCCURRED_AT_IN_FUTURE', path: 'occurredAt' }] });
        }
        const zona = ZONA_POR_DEFECTO;
        const fecha = fechaLocalEn(ocurrencia, zona);
        let fila;
        if (pedido.recording.origin === 'PRESCRIBED') {
          const r = pedido.recording;
          const dayTypeId = (pedido as { dayTypeId: string }).dayTypeId;
          const consumidos = r.consumedItems ?? [];
          const ev = evaluarIngestaPrescripta(plan.instantanea, { dayTypeId, mealId: r.mealId, optionId: r.optionId, consumedItems: consumidos });
          if (!ev.valida) {
            throw new ErrorDeApi(422, CodigoDeError.NUTRITION_EXECUTION_INVALID, 'La comida registrada no corresponde al plan vigente.', { issues: [{ code: ev.motivo, path: 'recording' }] });
          }
          // REG-06-107: una por (versión, fecha, comida). Un reintento equivalente devuelve la existente (UC-P12 E04).
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`ingesta|${plan.versionId}|${fecha}|${r.mealId}`}, 0))`;
          const previa = await tx.ingestaNutricional.findFirst({
            where: { versionDePlanId: plan.versionId, fechaLocal: new Date(`${fecha}T00:00:00.000Z`), comidaId: r.mealId, origen: 'PRESCRIPTA' },
            include: INCLUIR_CORRECCIONES,
          });
          if (previa) {
            const igual =
              previa.opcionId === r.optionId &&
              previa.diaTipoId === dayTypeId &&
              // jsonb reordena las claves: la comparación es por serialización canónica, no por texto.
              serializacionCanonica(previa.itemsConsumidos) === serializacionCanonica(consumidos) &&
              (previa.observacion ?? null) === (r.observation ?? null);
            if (!igual) {
              throw new ErrorDeApi(409, CodigoDeError.EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY, 'Esa comida ya está registrada para ese día.', { executionId: previa.id });
            }
            return { estadoHttp: 200, cuerpo: { data: ingestaApi(previa, new Map()) }, sujetoId: actor.identidadId, recurso: { tipo: 'IngestaNutricional', id: previa.id } };
          }
          fila = await tx.ingestaNutricional.create({
            data: {
              versionDePlanId: plan.versionId,
              asesoradoId: actor.identidadId,
              origen: 'PRESCRIPTA',
              modo: 'OPCIONES_DE_PLATO',
              fechaLocal: new Date(`${fecha}T00:00:00.000Z`),
              zonaHoraria: zona,
              diaTipoId: dayTypeId,
              comidaId: r.mealId,
              opcionId: r.optionId,
              itemsConsumidos: consumidos as unknown as Prisma.InputJsonValue,
              observacion: r.observation ?? null,
              procedencia: procedencia as unknown as Prisma.InputJsonValue,
              momentoDeOcurrencia: ocurrencia,
            },
            include: INCLUIR_CORRECCIONES,
          });
        } else {
          const r = pedido.recording;
          fila = await tx.ingestaNutricional.create({
            data: {
              versionDePlanId: plan.versionId,
              asesoradoId: actor.identidadId,
              origen: 'FUERA_DE_PRESCRIPCION',
              modo: 'DESCRIPCION_LIBRE',
              fechaLocal: new Date(`${fecha}T00:00:00.000Z`),
              zonaHoraria: zona,
              descripcion: r.description,
              descripcionDePorcion: r.portionDescription ?? null,
              procedencia: procedencia as unknown as Prisma.InputJsonValue,
              momentoDeOcurrencia: ocurrencia,
            },
            include: INCLUIR_CORRECCIONES,
          });
        }
        await registrarEventoDeNutricion(tx, {
          tipo: 'IngestaRegistrada',
          profesionalId: plan.profesionalId,
          asesoradoId: actor.identidadId,
          recurso: { tipo: 'IngestaNutricional', id: fila.id },
          estadoPrevio: null,
          estadoPosterior: null,
          actorId: actor.identidadId,
          procedencia,
          momento: ocurrencia,
        });
        return { estadoHttp: 201, cuerpo: { data: ingestaApi(fila, new Map()) }, sujetoId: actor.identidadId, recurso: { tipo: 'IngestaNutricional', id: fila.id } };
      },
    });
  }

  // ─── API-NUT-16 ────────────────────────────────────────────────────────────────────────────
  /** El asesorado titular o el profesional autor del plan; nadie más (09v9:750-756). */
  consultar(actor: ActorAutenticado, executionId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: Ingesta }> {
    sinParametrosDeQuery(query);
    const recurso = { tipo: 'IngestaNutricional', id: executionId };
    return this.ejecutor.leer({
      operacion: 'API-NUT-16',
      casoDeUso: 'UC-P12',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const i = esUuid(executionId)
          ? await tx.ingestaNutricional.findUnique({ where: { id: executionId }, include: { ...INCLUIR_CORRECCIONES, versionDePlan: { select: { plan: { select: { profesionalId: true } } } } } })
          : null;
        if (!i) throw this.ejecutor.noRevelable({ operacion: 'API-NUT-16', actorId: actor.identidadId, recurso }, ctx);
        const profesionalDelPlan = i.versionDePlan.plan.profesionalId;
        const esTitular = i.asesoradoId === actor.identidadId;
        // El titular, con el Proceso vigente de su profesional; un profesional, primero el PDP y después la propiedad (DL-057).
        await this.pdp.decidirEnTransaccion(
          tx,
          { operacion: 'API-NUT-16', actorDeLaDecision: actor.identidadId, profesionalId: esTitular ? profesionalDelPlan : actor.identidadId, titularId: i.asesoradoId, alcance: 'NUTRICION', recurso },
          ctx,
        );
        if (!esTitular && profesionalDelPlan !== actor.identidadId) {
          throw this.ejecutor.noRevelable({ operacion: 'API-NUT-16', actorId: actor.identidadId, recurso, sujetoId: i.asesoradoId }, ctx);
        }
        return { data: ingestaApi(i, await this.nombresDeAutores(tx, i.correcciones.map((c) => c.autorId))) };
      },
    });
  }

  // ─── Registros propios (NUT-11 del 10; DL-055) ────────────────────────────────────────────
  /**
   * Lista de las ingestas propias del asesorado, para «Registros» del APK (B10-05 NUT-11; 10-B01:351-357). El 09 no la
   * declara (DL-055). Exige el A3 vigente: revocado, se suspende toda operación sensible del titular (08:406).
   */
  listarPropias(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: Ingesta[]; page: unknown }> {
    const consulta = leerConsultaDeLista(query, {});
    return this.ejecutor.leer({
      operacion: 'API-NUT-16-LISTA',
      casoDeUso: 'UC-P12',
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        const [a3] = await tx.$queryRaw<{ vigente: boolean }[]>`
          SELECT EXISTS (SELECT 1 FROM "acto_registrable" WHERE "identidad_id" = ${actor.identidadId}::uuid AND "tipo" = 'DATOS_SALUD_BE' AND "estado" = 'VIGENTE') AS "vigente"`;
        if (!a3?.vigente) throw errores.accionNoPermitida();
        const filas = await tx.ingestaNutricional.findMany({
          where: { asesoradoId: actor.identidadId, ...despuesDelCursor(consulta.cursor) },
          include: INCLUIR_CORRECCIONES,
          orderBy: ORDEN_DE_LISTA,
          take: consulta.limit + 1,
        });
        const { pagina, page } = paginar(filas, consulta.limit);
        const nombres = await this.nombresDeAutores(tx, pagina.flatMap((i) => i.correcciones.map((c) => c.autorId)));
        return { data: pagina.map((i) => ingestaApi(i, nombres)), page };
      },
    });
  }

  // ─── API-NUT-21 ────────────────────────────────────────────────────────────────────────────
  corregir(actor: ActorAutenticado, executionId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'IngestaNutricional', id: executionId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-NUT-21',
      casoDeUso: 'UC-I12',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: CorregirIngestaRequestSchema,
      cuerpo,
      huellaExtra: { executionId },
      efecto: async (tx, pedido, procedencia) => {
        const i = esUuid(executionId)
          ? await tx.ingestaNutricional.findUnique({ where: { id: executionId }, include: { versionDePlan: { select: { plan: { select: { profesionalId: true } } } } } })
          : null;
        if (!i) throw this.ejecutor.noRevelable({ operacion: 'API-NUT-21', actorId: actor.identidadId, recurso }, ctx);
        await this.pdp.decidirEnTransaccion(
          tx,
          { operacion: 'API-NUT-21', actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: i.asesoradoId, alcance: 'NUTRICION', recurso },
          ctx,
        );
        if (i.versionDePlan.plan.profesionalId !== actor.identidadId) {
          throw this.ejecutor.noRevelable({ operacion: 'API-NUT-21', actorId: actor.identidadId, recurso, sujetoId: i.asesoradoId }, ctx);
        }
        if (i.origen !== 'FUERA_DE_PRESCRIPCION' || i.modo !== 'DESCRIPCION_LIBRE') {
          throw new ErrorDeApi(422, CodigoDeError.NUTRITION_FREE_DESCRIPTION_REQUIRED, 'Solo se estructura un registro libre de una comida fuera del plan.');
        }
        const conCatalogo = pedido.structuredEstimate.items.flatMap((it) => (it.catalogItemId ? [it.catalogItemId] : []));
        const disponibles = await this.catalogo.disponibles(tx, actor.identidadId, conCatalogo);
        const invalido = conCatalogo.findIndex((id) => !disponibles.has(id));
        if (invalido >= 0) {
          throw new ErrorDeApi(422, CodigoDeError.STRUCTURED_ESTIMATE_INVALID, 'Hay un alimento de la estimación que no está en el catálogo.', {
            issues: [{ code: 'CATALOG_REFERENCE_INVALID', path: `structuredEstimate.items[${invalido}].catalogItemId` }],
          });
        }
        // La ingesta se bloquea (sin modificarla) para que las correcciones queden en una sola cadena (REG-06-15).
        await tx.$queryRaw`SELECT 1 FROM "ingesta_nutricional" WHERE "id" = ${i.id}::uuid FOR NO KEY UPDATE`;
        const existentes = await tx.correccionDeIngesta.findMany({ where: { ingestaId: i.id }, select: { id: true, ingestaId: true, correccionPreviaId: true } });
        const relaciones = existentes.map((c) => ({ id: c.id, originalId: c.ingestaId, correccionPreviaId: c.correccionPreviaId }));
        const terminal = relaciones.find((c) => !relaciones.some((s) => s.correccionPreviaId === c.id))?.id ?? null;
        const ev = evaluarNuevaCorreccion(i.id, relaciones, { originalId: i.id, correccionPreviaId: terminal });
        if (!ev.valida) throw new ErrorDeApi(422, CodigoDeError.CORRECTION_NOT_ALLOWED, 'La historia de correcciones de este registro no se puede continuar.');
        const correccion = await tx.correccionDeIngesta.create({
          data: {
            ingestaId: i.id,
            correccionPreviaId: ev.correccionPreviaId,
            estimacion: pedido.structuredEstimate as unknown as Prisma.InputJsonValue,
            declaracion: pedido.estimationStatement,
            autorId: actor.identidadId,
            procedencia: { ...procedencia, naturaleza: 'ESTIMACION' } as unknown as Prisma.InputJsonValue,
          },
        });
        await registrarEventoDeNutricion(tx, {
          tipo: 'CorreccionDeIngestaRegistrada',
          profesionalId: actor.identidadId,
          asesoradoId: i.asesoradoId,
          recurso: { tipo: 'CorreccionDeIngesta', id: correccion.id },
          estadoPrevio: null,
          estadoPosterior: null,
          actorId: actor.identidadId,
          procedencia,
          momento: await momentoDeLaBase(tx),
        });
        const actualizada = await tx.ingestaNutricional.findUniqueOrThrow({ where: { id: i.id }, include: INCLUIR_CORRECCIONES });
        return {
          estadoHttp: 201,
          cuerpo: { data: ingestaApi(actualizada, await this.nombresDeAutores(tx, actualizada.correcciones.map((c) => c.autorId))) },
          sujetoId: i.asesoradoId,
          recurso: { tipo: 'CorreccionDeIngesta', id: correccion.id },
        };
      },
    });
  }

  // ─── Auxiliares ─────────────────────────────────────────────────────────────────────────────

  /**
   * La versión efectiva del plan del asesorado cuyo Proceso nutricional está ABIERTO. Como máximo hay una: activar con
   * otro profesional abierto es ACTIVE_PLAN_CONFLICT (RF-031).
   */
  async planVigente(tx: Tx, asesoradoId: string): Promise<PlanDelAsesorado | null> {
    const [fila] = await tx.$queryRaw<(Omit<PlanDelAsesorado, 'instantanea'> & { instantanea: ContenidoDeInstantanea })[]>`
      SELECT v."id"::text AS "versionId", v."version", p."profesional_id"::text AS "profesionalId", v."momento_de_activacion" AS "momentoDeActivacion",
             v."version_de_objetivo_id"::text AS "versionDeObjetivoId", i."contenido" AS "instantanea"
        FROM "plan_nutricional" p
        JOIN "version_de_plan_nutricional" v ON v."id" = p."version_efectiva_id"
        JOIN "instantanea_de_plan_nutricional" i ON i."version_de_plan_id" = v."id"
        JOIN "proceso_operativo" pr ON pr."profesional_id" = p."profesional_id" AND pr."asesorado_id" = p."asesorado_id"
                                    AND pr."alcance" = 'NUTRICION' AND pr."estado" = 'ABIERTO'
       WHERE p."asesorado_id" = ${asesoradoId}::uuid`;
    return fila ?? null;
  }

  private async ingestasDelDia(tx: Tx, asesoradoId: string, fecha: string): Promise<Ingesta[]> {
    const filas = await tx.ingestaNutricional.findMany({
      where: { asesoradoId, fechaLocal: new Date(`${fecha}T00:00:00.000Z`) },
      include: INCLUIR_CORRECCIONES,
      orderBy: [{ momentoDeOcurrencia: 'asc' }, { id: 'asc' }],
    });
    const nombres = await this.nombresDeAutores(tx, filas.flatMap((i) => i.correcciones.map((c) => c.autorId)));
    return filas.map((i) => ingestaApi(i, nombres));
  }

  private async nombresDeAutores(tx: Tx, ids: readonly string[]): Promise<Map<string, string>> {
    const unicos = [...new Set(ids)];
    return new Map(await Promise.all(unicos.map(async (id) => [id, await nombreVisibleDe(tx, id)] as const)));
  }
}
