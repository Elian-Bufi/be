import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  EFECTO_DE_RESULTADO,
  RESULTADO_DESDE_API,
  RESULTADO_HACIA_API,
  RegistrarRevisionDeEntrenamientoRequestSchema,
  VersionEsperadaRequestSchema,
  evaluarRevision,
  fechasDelPeriodo,
  revisionPendiente,
  type ContextoDeRevisionDeEntrenamientoResponse,
  type CrearObjetivoDeEntrenamientoRequest,
  type ResultadoDeRevisionApi,
  type RevisionDeEntrenamiento,
} from '@be/domain';
import type { AplicacionDeRevisionDeEntrenamiento, Prisma, RevisionDeEntrenamiento as FilaDeRevision } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { ProcesoService } from '../proceso/proceso.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { ZONA_POR_DEFECTO, fechaLocalEn } from '../nutricion/zona';
import { esToken, token } from '../vinculo/lectura';
import { EjecucionesDeEntrenamientoService } from './ejecuciones.service';
import { EjecutorDeEntrenamiento, esUuid } from './ejecutor';
import { EvaluacionesDeEntrenamientoService } from './evaluaciones.service';
import { registrarEventoDeEntrenamiento } from './eventos';
import { INCLUIR_PLAN_DE_ENTRENAMIENTO, nombreVisibleDe, versionDeObjetivoApi, versionDePlanApi } from './lectura-entrenamiento';
import { PlanesDeEntrenamientoService } from './planes.service';

type Tx = Prisma.TransactionClient;

/** Período por defecto del contexto: los últimos 7 días, hoy incluido. Tope de 92 días, como nutrición. */
const DIAS_POR_DEFECTO = 7;
const DIAS_MAXIMOS = 92;

const componenteRequerido = (issues: { code: string; path: string }[]) =>
  new ErrorDeApi(422, CodigoDeError.REVIEW_COMPONENT_REQUIRED, 'Falta información para registrar la revisión.', { issues });

const fechaDe = (d: Date): string => d.toISOString().slice(0, 10);

/** Una revisión de entrenamiento en la forma del contrato. */
function revisionApi(r: FilaDeRevision & { aplicacion: AplicacionDeRevisionDeEntrenamiento | null }, asesoradoId: string, nombreAutor: string): RevisionDeEntrenamiento {
  return {
    reviewId: r.id,
    version: token(1),
    adviseeId: asesoradoId,
    processId: r.procesoId,
    period: { start: fechaDe(r.periodoInicio), end: fechaDe(r.periodoFin), timeZone: r.zonaHoraria },
    evidenceReferences: r.evidencias as RevisionDeEntrenamiento['evidenceReferences'],
    interpretation: r.interpretacion,
    result: RESULTADO_HACIA_API[r.resultado],
    rationale: r.fundamento,
    nextAction: r.proximaAccion as RevisionDeEntrenamiento['nextAction'],
    author: { identityId: r.autorId, displayName: nombreAutor },
    recordedAt: r.momentoDeRegistro.toISOString(),
    application: r.aplicacion
      ? {
          appliedAt: r.aplicacion.momentoDeRegistro.toISOString(),
          eventId: r.aplicacion.eventoId,
          type: r.aplicacion.tipo,
          processId: r.procesoId,
          processStateAfter: r.aplicacion.estadoDeProcesoPosterior,
          createdPlanId: r.aplicacion.versionDePlanCreadaId,
          createdObjectiveVersionId: r.aplicacion.versionDeObjetivoCreadaId,
        }
      : null,
  };
}

/**
 * UC-P18, UC-I05 y UC-I06 — Revisión y continuidad de entrenamiento (API-TRN-21 a 24; RF-045, RF-046, RF-056).
 *
 * La semántica es **la misma de nutrición**, porque el 05 dice que UC-P18 «no redefine DEC-043» (05:9437): seis
 * resultados, ningún séptimo. La progresión se expresa como AJUSTAR o SUSTITUIR según su efecto sobre el plan, y la
 * decide el profesional (REG-06-117; 09v10:1348-1371).
 *
 * - Abrir el contexto no es revisar: es un read model que no persiste nada y **no calcula** volumen, marcas, mapa
 *   muscular ni puntaje (09v10:1285-1295). Los días sin registro son «sin dato», nunca sesiones no realizadas.
 * - Aplicar es otro acto: primero la consecuencia (borrador sucesor, objetivo nuevo, próxima revisión o cierre) y
 *   después el evento. Si la consecuencia no se puede aplicar, no hay evento ni éxito parcial (09v10:1426-1432).
 */
@Injectable()
export class RevisionesDeEntrenamientoService {
  constructor(
    private readonly ejecutor: EjecutorDeEntrenamiento,
    private readonly pdp: PdpService,
    private readonly procesos: ProcesoService,
    private readonly planes: PlanesDeEntrenamientoService,
    private readonly evaluaciones: EvaluacionesDeEntrenamientoService,
    private readonly ejecuciones: EjecucionesDeEntrenamientoService,
  ) {}

  // ─── API-TRN-21 ────────────────────────────────────────────────────────────────────────────
  contexto(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<ContextoDeRevisionDeEntrenamientoResponse> {
    const periodo = leerPeriodo(query);
    return this.ejecutor.leer({
      operacion: 'API-TRN-21',
      casoDeUso: 'UC-P18',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        const asesoradoId = await this.decidir(tx, 'API-TRN-21', actor, adviseeId, null, ctx);
        const zona = ZONA_POR_DEFECTO;
        const hoy = fechaLocalEn(await momentoDeLaBase(tx), zona);
        const fin = periodo.fin ?? hoy;
        const inicio = periodo.inicio ?? restarDias(fin, DIAS_POR_DEFECTO - 1);
        if (inicio > fin) throw errores.solicitudInvalida([{ code: 'PERIOD_START_AFTER_END', path: 'periodStart' }]);
        const fechas = fechasDelPeriodo(inicio, fin, DIAS_MAXIMOS);
        if (fechas[fechas.length - 1] !== fin) throw errores.solicitudInvalida([{ code: 'PERIOD_TOO_LONG', path: 'periodEnd' }]);

        const nombre = await nombreVisibleDe(tx, actor.identidadId);
        const objetivoFila = await tx.objetivoDeEntrenamiento.findUnique({ where: { profesionalId_asesoradoId: { profesionalId: actor.identidadId, asesoradoId } } });
        const objetivoEfectivo = objetivoFila ? await this.evaluaciones.efectivaDe(tx, objetivoFila.id) : null;

        // Versiones activadas que rigieron en algún momento del período.
        const activadas = await tx.versionDePlanDeEntrenamiento.findMany({
          where: { plan: { profesionalId: actor.identidadId, asesoradoId }, estado: 'ACTIVADA' },
          include: INCLUIR_PLAN_DE_ENTRENAMIENTO,
          orderBy: [{ momentoDeActivacion: 'asc' }, { id: 'asc' }],
        });
        const enPeriodo = activadas.filter((v) => {
          const sucesora = activadas.find((s) => s.predecesoraId === v.id);
          const desde = fechaLocalEn(v.momentoDeActivacion as Date, zona);
          const hasta = sucesora?.momentoDeActivacion ? fechaLocalEn(sucesora.momentoDeActivacion, zona) : null;
          return desde <= fin && (hasta === null || hasta >= inicio);
        });

        // Solo lo registrado: el borrador no es evidencia (09v10:980) y acá no aparece.
        const ejecuciones = await tx.ejecucionDeEntrenamiento.findMany({
          where: { asesoradoId, versionDePlan: { plan: { profesionalId: actor.identidadId } }, fechaLocal: { gte: new Date(`${inicio}T00:00:00.000Z`), lte: new Date(`${fin}T00:00:00.000Z`) } },
          select: { id: true, fechaLocal: true },
          orderBy: [{ fechaLocal: 'asc' }, { momentoDeOcurrencia: 'asc' }, { id: 'asc' }],
        });
        // En serie: una transacción interactiva usa una sola conexión.
        const registradas = [];
        for (const x of ejecuciones) registradas.push(await this.ejecuciones.ejecucionApi(tx, x.id));
        const conRegistro = new Set(ejecuciones.map((x) => fechaDe(x.fechaLocal)));

        // Las correcciones registradas dentro del período, de cualquier ejecución de este seguimiento.
        const correcciones = registradas.flatMap((x) =>
          x.corrections.filter((c) => fechaLocalEn(new Date(c.recordedAt), zona) >= inicio && fechaLocalEn(new Date(c.recordedAt), zona) <= fin).map((c) => ({ ...c, executionId: x.executionId })),
        );

        const procesos = await tx.procesoOperativo.findMany({
          where: { profesionalId: actor.identidadId, asesoradoId, alcance: 'ENTRENAMIENTO' },
          orderBy: [{ momentoDeRegistro: 'desc' }, { id: 'desc' }],
        });
        const proceso = procesos.find((p) => p.estado === 'ABIERTO') ?? procesos[0] ?? null;
        const revisiones = await tx.revisionDeEntrenamiento.findMany({
          where: { procesoId: { in: procesos.map((p) => p.id) } },
          include: { aplicacion: true },
          orderBy: [{ momentoDeRegistro: 'desc' }, { id: 'desc' }],
        });
        return {
          data: {
            period: { start: inicio, end: fin, timeZone: zona },
            objective: objetivoEfectivo && objetivoFila ? versionDeObjetivoApi(objetivoEfectivo, objetivoFila, true, nombre) : null,
            activePlanVersions: enPeriodo.map((v) => {
              const { blocks: _b, ...resumen } = versionDePlanApi(v, nombre, new Map());
              return resumen;
            }),
            registeredExecutions: registradas,
            corrections: correcciones,
            // «Un período sin registro es un período sin dato» (06:4661): días sin nada registrado, no sesiones perdidas.
            missingData: fechas.filter((f) => !conRegistro.has(f)),
            previousReviews: revisiones.map((r) => revisionApi(r, asesoradoId, nombre)),
            process: proceso ? { processId: proceso.id, state: proceso.estado } : null,
            pendingReview: proceso ? await this.pendiente(tx, proceso.id, proceso.estado === 'ABIERTO', hoy) : { pending: false, since: null },
          },
        };
      },
    });
  }

  // ─── API-TRN-22 ────────────────────────────────────────────────────────────────────────────
  registrar(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-TRN-22',
      casoDeUso: 'UC-P18',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      clave,
      esquema: RegistrarRevisionDeEntrenamientoRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        const asesoradoId = await this.decidir(tx, 'API-TRN-22', actor, adviseeId, { tipo: 'Asesorado', id: adviseeId }, ctx);
        // Seis resultados, ninguno más: `PROGRESS` es REVIEW_RESULT_INVALID, no un séptimo (REG-06-117; 09v10:1338-1344).
        const resultado = RESULTADO_DESDE_API[pedido.result as ResultadoDeRevisionApi];
        if (!resultado) {
          throw new ErrorDeApi(422, CodigoDeError.REVIEW_RESULT_INVALID, 'El resultado de la revisión no es uno de los previstos.', { issues: [{ code: 'REVIEW_RESULT_INVALID', path: 'result' }] });
        }
        const evaluacion = evaluarRevision({
          periodo: { inicio: pedido.period.start, fin: pedido.period.end },
          evidencias: pedido.evidenceReferences,
          interpretacion: pedido.interpretation,
          resultado,
          fundamento: pedido.rationale,
          proximaAccion: pedido.nextAction.description,
          proximaRevision: pedido.nextAction.nextReviewAt ?? null,
        });
        if (!evaluacion.valida) throw componenteRequerido(evaluacion.faltantes.map((f) => ({ code: `REVIEW_${f}_REQUIRED`, path: RUTA_DE_FALTANTE[f] ?? 'nextAction' })));
        if (resultado === 'CAMBIAR_OBJETIVO' && !pedido.nextAction.objective) throw componenteRequerido([{ code: 'REVIEW_NEW_OBJECTIVE_REQUIRED', path: 'nextAction.objective' }]);
        // UC-P18: hay un seguimiento de entrenamiento abierto que revisar.
        const proceso = await tx.procesoOperativo.findFirst({ where: { profesionalId: actor.identidadId, asesoradoId, alcance: 'ENTRENAMIENTO', estado: 'ABIERTO' } });
        if (!proceso) throw new ErrorDeApi(422, CodigoDeError.REVIEW_NOT_ALLOWED, 'No hay un seguimiento de entrenamiento abierto para revisar.');
        await this.exigirEvidenciaReconstruible(tx, actor.identidadId, asesoradoId, pedido.evidenceReferences);
        const momento = await momentoDeLaBase(tx);
        const revision = await tx.revisionDeEntrenamiento.create({
          data: {
            procesoId: proceso.id,
            periodoInicio: new Date(`${pedido.period.start}T00:00:00.000Z`),
            periodoFin: new Date(`${pedido.period.end}T00:00:00.000Z`),
            zonaHoraria: pedido.period.timeZone,
            evidencias: pedido.evidenceReferences as unknown as Prisma.InputJsonValue,
            interpretacion: pedido.interpretation,
            resultado,
            fundamento: pedido.rationale,
            proximaAccion: pedido.nextAction as unknown as Prisma.InputJsonValue,
            autorId: actor.identidadId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeOcurrencia: momento,
          },
          include: { aplicacion: true },
        });
        await registrarEventoDeEntrenamiento(tx, {
          tipo: 'RevisionDeEntrenamientoRegistrada',
          profesionalId: actor.identidadId,
          asesoradoId,
          recurso: { tipo: 'RevisionDeEntrenamiento', id: revision.id },
          estadoPrevio: null,
          estadoPosterior: null,
          actorId: actor.identidadId,
          procedencia,
          momento,
        });
        return {
          estadoHttp: 201,
          cuerpo: { data: revisionApi(revision, asesoradoId, await nombreVisibleDe(tx, actor.identidadId)) },
          sujetoId: asesoradoId,
          recurso: { tipo: 'RevisionDeEntrenamiento', id: revision.id },
        };
      },
    });
  }

  // ─── API-TRN-23 ────────────────────────────────────────────────────────────────────────────
  consultar(actor: ActorAutenticado, reviewId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: RevisionDeEntrenamiento }> {
    if (Object.keys(query ?? {}).length > 0) throw errores.solicitudInvalida(Object.keys(query).map((c) => ({ code: 'UNKNOWN_QUERY_PARAMETER', path: c })));
    const recurso = { tipo: 'RevisionDeEntrenamiento', id: reviewId };
    return this.ejecutor.leer({
      operacion: 'API-TRN-23',
      casoDeUso: 'UC-P18',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const r = esUuid(reviewId) ? await tx.revisionDeEntrenamiento.findUnique({ where: { id: reviewId }, include: { aplicacion: true, proceso: true } }) : null;
        if (!r) throw this.ejecutor.noRevelable({ operacion: 'API-TRN-23', actorId: actor.identidadId, recurso }, ctx);
        await this.decidir(tx, 'API-TRN-23', actor, r.proceso.asesoradoId, recurso, ctx);
        if (r.proceso.profesionalId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-TRN-23', actorId: actor.identidadId, recurso, sujetoId: r.proceso.asesoradoId }, ctx);
        return { data: revisionApi(r, r.proceso.asesoradoId, await nombreVisibleDe(tx, actor.identidadId)) };
      },
    });
  }

  // ─── API-TRN-24 ────────────────────────────────────────────────────────────────────────────
  aplicar(actor: ActorAutenticado, reviewId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'RevisionDeEntrenamiento', id: reviewId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-TRN-24',
      casoDeUso: 'UC-I06',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: VersionEsperadaRequestSchema,
      cuerpo,
      huellaExtra: { reviewId },
      efecto: async (tx, pedido, procedencia) => {
        const r = esUuid(reviewId) ? await tx.revisionDeEntrenamiento.findUnique({ where: { id: reviewId }, include: { aplicacion: true, proceso: true } }) : null;
        if (!r) throw this.ejecutor.noRevelable({ operacion: 'API-TRN-24', actorId: actor.identidadId, recurso }, ctx);
        const asesoradoId = r.proceso.asesoradoId;
        await this.decidir(tx, 'API-TRN-24', actor, asesoradoId, recurso, ctx);
        if (r.proceso.profesionalId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-TRN-24', actorId: actor.identidadId, recurso, sujetoId: asesoradoId }, ctx);
        if (!esToken(pedido.expectedVersion, 1)) throw errores.conflictoDeVersion();
        if (r.aplicacion) throw new ErrorDeApi(409, CodigoDeError.REVIEW_ALREADY_APPLIED, 'Esta revisión ya se aplicó.');
        if (r.proceso.estado !== 'ABIERTO') throw new ErrorDeApi(422, CodigoDeError.CONTINUITY_ACTION_NOT_APPLICABLE, 'El seguimiento ya está cerrado: la revisión no se puede aplicar.');
        const momento = await momentoDeLaBase(tx);
        const accion = r.proximaAccion as { description: string; nextReviewAt?: string | null; objective?: CrearObjetivoDeEntrenamientoRequest };
        const efecto = EFECTO_DE_RESULTADO[r.resultado];

        // La consecuencia, antes del evento (09v10:1400-1424). El snapshot activo no se edita: se crea un sucesor.
        let versionDePlanCreadaId: string | null = null;
        let versionDeObjetivoCreadaId: string | null = null;
        if (efecto.vertical === 'BORRADOR_SUCESOR') {
          const plan = await tx.planDeEntrenamiento.findUnique({ where: { profesionalId_asesoradoId: { profesionalId: actor.identidadId, asesoradoId } } });
          const objetivo = await tx.objetivoDeEntrenamiento.findUnique({ where: { profesionalId_asesoradoId: { profesionalId: actor.identidadId, asesoradoId } } });
          const objetivoEfectivo = objetivo ? await this.evaluaciones.efectivaDe(tx, objetivo.id) : null;
          if (!plan?.versionEfectivaId || !objetivoEfectivo) {
            throw new ErrorDeApi(422, CodigoDeError.CONTINUITY_ACTION_NOT_APPLICABLE, 'No hay un plan vigente sobre el que preparar la nueva versión.');
          }
          try {
            versionDePlanCreadaId = await this.planes.crearVersionBorrador(tx, {
              profesionalId: actor.identidadId,
              asesoradoId,
              objetivoVersionId: objetivoEfectivo.id,
              estructura: null,
              basadaEn: plan.versionEfectivaId,
              proximaRevision: accion.nextReviewAt ?? null,
              revisionDeOrigenId: r.id,
              procedencia,
            });
          } catch (e) {
            // Ya hay un borrador: la continuidad no se puede aplicar, y no hay transición parcial ni evento (UC-I06 E02).
            if (e instanceof ErrorDeApi && e.code === CodigoDeError.RESOURCE_CONFLICT) {
              throw new ErrorDeApi(422, CodigoDeError.CONTINUITY_ACTION_NOT_APPLICABLE, 'Ya hay un borrador del plan. Activalo o seguí trabajando sobre él antes de aplicar esta revisión.', e.details);
            }
            throw e;
          }
        } else if (efecto.vertical === 'NUEVA_VERSION_DE_OBJETIVO') {
          if (!accion.objective) throw new ErrorDeApi(422, CodigoDeError.REVIEW_NOT_VALID_FOR_APPLICATION, 'La revisión no trae el objetivo nuevo.');
          const v = await this.evaluaciones.emitirVersionDeObjetivo(tx, { profesionalId: actor.identidadId, asesoradoId, contenido: accion.objective, revisionDeOrigenId: r.id, procedencia });
          versionDeObjetivoCreadaId = v.id;
        }

        // La transición del Proceso y el evento ContinuidadOCierreAplicado, recién después del éxito completo.
        const proceso = await this.procesos.bloquear(tx, r.procesoId);
        if (!proceso || proceso.estado !== 'ABIERTO') {
          throw new ErrorDeApi(422, CodigoDeError.CONTINUITY_ACTION_NOT_APPLICABLE, 'El seguimiento cambió mientras se aplicaba la revisión. Actualizá y volvé a intentar.');
        }
        const aplicado = await this.procesos.aplicarResultado(tx, {
          proceso,
          revisionId: r.id,
          resultado: r.resultado,
          datos: { resultado: r.resultado, versionDePlanCreadaId, versionDeObjetivoCreadaId } as Prisma.InputJsonValue,
          actorId: actor.identidadId,
          procedencia,
          momento,
        });
        if (r.resultado !== 'FINALIZAR' && accion.nextReviewAt) {
          await this.procesos.fijarProximaRevision(tx, {
            procesoId: proceso.id,
            fecha: accion.nextReviewAt,
            fuente: { revisionDeEntrenamientoId: r.id },
            actorId: actor.identidadId,
            procedencia,
            momento,
          });
        }
        const aplicacion = await tx.aplicacionDeRevisionDeEntrenamiento.create({
          data: {
            revisionId: r.id,
            eventoId: aplicado.eventoId,
            tipo: aplicado.tipo,
            estadoDeProcesoPosterior: aplicado.estadoPosterior,
            versionDePlanCreadaId,
            versionDeObjetivoCreadaId,
          },
        });
        return {
          estadoHttp: 200,
          cuerpo: {
            data: {
              reviewId: r.id,
              application: {
                appliedAt: aplicacion.momentoDeRegistro.toISOString(),
                eventId: aplicado.eventoId,
                type: aplicado.tipo,
                processId: proceso.id,
                processStateAfter: aplicado.estadoPosterior,
                createdPlanId: versionDePlanCreadaId,
                createdObjectiveVersionId: versionDeObjetivoCreadaId,
              },
            },
          },
          sujetoId: asesoradoId,
          recurso,
        };
      },
    });
  }

  /** REG-06-150 sobre un Proceso de entrenamiento: expectativa vigente y si una revisión aplicada después la resolvió. */
  private async pendiente(tx: Tx, procesoId: string, abierto: boolean, hoy: string): Promise<{ pending: boolean; since: string | null }> {
    const expectativa = await this.procesos.proximaRevisionVigente(tx, procesoId);
    const aplicadaPosterior = expectativa
      ? (await tx.aplicacionDeRevisionDeEntrenamiento.count({ where: { revision: { procesoId }, momentoDeRegistro: { gt: expectativa.momentoDeRegistro } } })) > 0
      : false;
    const r = revisionPendiente({
      procesoAbierto: abierto,
      expectativa: expectativa ? { fechaObjetivo: expectativa.fechaObjetivo ? fechaDe(expectativa.fechaObjetivo) : null, registradaEn: fechaDe(expectativa.momentoDeRegistro) } : undefined,
      revisionAplicadaPosterior: aplicadaPosterior,
      ahora: hoy,
    });
    return r.pendiente ? { pending: true, since: r.desde } : { pending: false, since: null };
  }

  /** REG-06-141: la evidencia examinada es reconstruible: cada referencia existe y es de esta terna (UC-I05 E02). */
  private async exigirEvidenciaReconstruible(tx: Tx, profesionalId: string, asesoradoId: string, refs: readonly { type: string; id: string }[]): Promise<void> {
    const invalidas: { code: string; path: string }[] = [];
    for (const [i, ref] of refs.entries()) {
      const ok = esUuid(ref.id) && (await this.existeEvidencia(tx, profesionalId, asesoradoId, ref));
      if (!ok) invalidas.push({ code: 'EVIDENCE_NOT_RECONSTRUCTIBLE', path: `evidenceReferences[${i}]` });
    }
    if (invalidas.length > 0) {
      throw new ErrorDeApi(422, CodigoDeError.REVIEW_EVIDENCE_NOT_RECONSTRUCTIBLE, 'Parte de la evidencia indicada no corresponde a este seguimiento.', { issues: invalidas });
    }
  }

  private async existeEvidencia(tx: Tx, profesionalId: string, asesoradoId: string, ref: { type: string; id: string }): Promise<boolean> {
    switch (ref.type) {
      case 'EXECUTION':
        // Una ejecución registrada, no un borrador: el borrador no es evidencia (09v10:980).
        return (await tx.ejecucionDeEntrenamiento.count({ where: { id: ref.id, asesoradoId, versionDePlan: { plan: { profesionalId } } } })) > 0;
      case 'PLAN_VERSION':
        return (await tx.versionDePlanDeEntrenamiento.count({ where: { id: ref.id, plan: { profesionalId, asesoradoId } } })) > 0;
      case 'OBJECTIVE_VERSION':
        return (await tx.versionDeObjetivoDeEntrenamiento.count({ where: { id: ref.id, objetivoDeLaSerie: { profesionalId, asesoradoId } } })) > 0;
      case 'EVALUATION':
        return (await tx.evaluacionDeEntrenamiento.count({ where: { id: ref.id, profesionalId, asesoradoId } })) > 0;
      default:
        return false;
    }
  }

  private async decidir(tx: Tx, operacion: string, actor: ActorAutenticado, adviseeId: string, recurso: { tipo: string; id: string } | null, ctx: ContextoDeSolicitud): Promise<string> {
    const d = await this.pdp.decidirEnTransaccion(tx, { operacion, actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: adviseeId, alcance: 'ENTRENAMIENTO', recurso }, ctx);
    return d.hechos.titular?.identidadId as string;
  }
}

const RUTA_DE_FALTANTE: Record<string, string> = {
  PERIODO: 'period',
  EVIDENCIA: 'evidenceReferences',
  INTERPRETACION: 'interpretation',
  RESULTADO_FUERA_DE_TAXONOMIA: 'result',
  FUNDAMENTO: 'rationale',
  PROXIMA_ACCION_O_CIERRE: 'nextAction.description',
  PROXIMA_REVISION: 'nextAction.nextReviewAt',
};

function leerPeriodo(query: Record<string, unknown>): { inicio: string | null; fin: string | null } {
  const permitidos = new Set(['periodStart', 'periodEnd']);
  const desconocidos = Object.keys(query ?? {}).filter((k) => !permitidos.has(k));
  if (desconocidos.length > 0) throw errores.solicitudInvalida(desconocidos.map((c) => ({ code: 'UNKNOWN_QUERY_PARAMETER', path: c })));
  const leer = (clave: string): string | null => {
    const v = query[clave];
    if (v === undefined) return null;
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(new Date(`${v}T00:00:00Z`).getTime())) {
      throw errores.solicitudInvalida([{ code: 'INVALID_DATE', path: clave }]);
    }
    return v;
  };
  return { inicio: leer('periodStart'), fin: leer('periodEnd') };
}

function restarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

