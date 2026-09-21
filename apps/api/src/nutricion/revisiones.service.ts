import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  EFECTO_DE_RESULTADO,
  RESULTADO_DESDE_API,
  RegistrarRevisionRequestSchema,
  VersionEsperadaRequestSchema,
  construirContraste,
  evaluarRevision,
  fechasDelPeriodo,
  revisionPendiente,
  type ContenidoDeInstantanea,
  type ContextoDeRevisionResponse,
  type ResultadoDeRevisionApi,
  type Revision,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { ProcesoService } from '../proceso/proceso.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { esToken } from '../vinculo/lectura';
import { EjecutorNutricional, esUuid } from './ejecutor';
import { EvaluacionesService } from './evaluaciones.service';
import { registrarEventoDeNutricion } from './eventos';
import { INCLUIR_PLAN, fechaLocal, ingestaApi, nombreVisibleDe, revisionApi, versionDeObjetivoApi, versionDePlanApi } from './lectura-nutricion';
import { PlanesService } from './planes.service';
import { ZONA_POR_DEFECTO, fechaLocalEn } from './zona';

type Tx = Prisma.TransactionClient;

/** Período por defecto del contexto de revisión: los últimos 7 días, hoy incluido. */
const DIAS_POR_DEFECTO = 7;
/** Tope del período, para que el contraste no crezca sin límite. */
const DIAS_MAXIMOS = 92;

const componenteRequerido = (issues: { code: string; path: string }[]) =>
  new ErrorDeApi(422, CodigoDeError.REVIEW_COMPONENT_REQUIRED, 'Falta información para registrar la revisión.', { issues });

/**
 * UC-P13, UC-I05 y UC-I06 — Revisión y continuidad nutricional (API-NUT-17 a 20; RF-034, RF-035, RF-056).
 *
 * - Abrir el contexto no es revisar (RF-034; 06:5881): la revisión es un acto explícito con todos sus componentes
 *   (REG-06-141) y un resultado de la taxonomía cerrada (REG-06-144).
 * - El contraste es descriptivo: lo prescripto, lo registrado y lo que falta como «sin registro». Sin puntaje, porcentaje
 *   ni juicio (REG-06-125; INV-06-135).
 * - Aplicar es otro acto (UC-I06): primero la consecuencia vertical (borrador sucesor, objetivo nuevo, próxima revisión
 *   o cierre) y recién después el evento ContinuidadOCierreAplicado. Si la consecuencia no se puede aplicar, no hay
 *   evento ni éxito (REG-06-75, 77, 149).
 */
@Injectable()
export class RevisionesService {
  constructor(
    private readonly ejecutor: EjecutorNutricional,
    private readonly pdp: PdpService,
    private readonly procesos: ProcesoService,
    private readonly planes: PlanesService,
    private readonly evaluaciones: EvaluacionesService,
  ) {}

  // ─── API-NUT-17 ────────────────────────────────────────────────────────────────────────────
  contexto(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<ContextoDeRevisionResponse> {
    const periodo = leerPeriodo(query);
    return this.ejecutor.leer({
      operacion: 'API-NUT-17',
      casoDeUso: 'UC-P13',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        const asesoradoId = await this.decidir(tx, 'API-NUT-17', actor, adviseeId, null, ctx);
        const zona = ZONA_POR_DEFECTO;
        const hoy = fechaLocalEn(await momentoDeLaBase(tx), zona);
        const fin = periodo.fin ?? hoy;
        const inicio = periodo.inicio ?? fechasDelPeriodo(restarDias(fin, DIAS_POR_DEFECTO - 1), fin)[0] ?? fin;
        if (inicio > fin) throw errores.solicitudInvalida([{ code: 'PERIOD_START_AFTER_END', path: 'periodStart' }]);
        const fechas = fechasDelPeriodo(inicio, fin, DIAS_MAXIMOS);
        if (fechas[fechas.length - 1] !== fin) throw errores.solicitudInvalida([{ code: 'PERIOD_TOO_LONG', path: 'periodEnd' }]);

        const nombre = await nombreVisibleDe(tx, actor.identidadId);
        const objetivoFila = await tx.objetivoNutricional.findUnique({ where: { profesionalId_asesoradoId: { profesionalId: actor.identidadId, asesoradoId } } });
        const objetivoEfectivo = objetivoFila ? await this.evaluaciones.efectivaDe(tx, objetivoFila.id) : null;

        // Versiones activadas del plan de este profesional y el período en que cada una rigió.
        const activadas = await tx.versionDePlanNutricional.findMany({
          where: { plan: { profesionalId: actor.identidadId, asesoradoId }, estado: 'ACTIVADA' },
          include: INCLUIR_PLAN,
          orderBy: [{ momentoDeActivacion: 'asc' }, { id: 'asc' }],
        });
        const conVigencia = activadas.map((v) => {
          const sucesora = activadas.find((s) => s.predecesoraId === v.id);
          return {
            fila: v,
            desde: fechaLocalEn(v.momentoDeActivacion as Date, zona),
            hasta: sucesora?.momentoDeActivacion ? fechaLocalEn(sucesora.momentoDeActivacion, zona) : null,
          };
        });
        // `hasta >= inicio`: una versión reemplazada el primer día del período todavía tiene registros de ese día.
        const enPeriodo = conVigencia.filter((v) => v.desde <= fin && (v.hasta === null || v.hasta >= inicio));

        const ingestas = await tx.ingestaNutricional.findMany({
          where: {
            asesoradoId,
            versionDePlan: { plan: { profesionalId: actor.identidadId } },
            fechaLocal: { gte: new Date(`${inicio}T00:00:00.000Z`), lte: new Date(`${fin}T00:00:00.000Z`) },
          },
          include: { correcciones: true },
          orderBy: [{ fechaLocal: 'asc' }, { momentoDeOcurrencia: 'asc' }],
        });
        const contraste = construirContraste(
          fechas,
          enPeriodo.map((v) => ({ planId: v.fila.id, desde: v.desde, hasta: v.hasta, instantanea: v.fila.instantanea?.contenido as unknown as ContenidoDeInstantanea })),
          ingestas.map((i) => ({
            executionId: i.id,
            planId: i.versionDePlanId,
            localDate: fechaLocal(i.fechaLocal),
            origin: i.origen === 'PRESCRIPTA' ? 'PRESCRIBED' : 'OUTSIDE_PRESCRIPTION',
            dayTypeId: i.diaTipoId,
            mealId: i.comidaId,
            optionId: i.opcionId,
            consumedItems: i.itemsConsumidos as never,
            description: i.descripcion,
          })),
        );

        const procesos = await tx.procesoOperativo.findMany({
          where: { profesionalId: actor.identidadId, asesoradoId, alcance: 'NUTRICION' },
          orderBy: [{ momentoDeRegistro: 'desc' }, { id: 'desc' }],
        });
        const proceso = procesos.find((p) => p.estado === 'ABIERTO') ?? procesos[0] ?? null;
        const revisiones = await tx.revisionNutricional.findMany({
          where: { procesoId: { in: procesos.map((p) => p.id) } },
          include: { aplicacion: true },
          orderBy: [{ momentoDeRegistro: 'desc' }, { id: 'desc' }],
        });
        return {
          data: {
            period: { start: inicio, end: fin, timeZone: zona },
            objective: objetivoEfectivo && objetivoFila ? versionDeObjetivoApi(objetivoEfectivo, objetivoFila, true, nombre) : null,
            activePlanVersions: enPeriodo.map((v) => {
              const { dayTypes: _d, ...resumen } = versionDePlanApi(v.fila, nombre, new Map(), false);
              return resumen;
            }),
            registeredIntakes: ingestas.map((i) => ingestaApi(i, new Map())),
            descriptiveContrast: contraste,
            missingData: contraste.days.filter((d) => d.dataState === 'NO_DATA').map((d) => d.date),
            previousReviews: revisiones.map((r) => revisionApi(r, { asesoradoId }, nombre, r.procesoId)),
            process: proceso ? { processId: proceso.id, state: proceso.estado } : null,
            pendingReview: proceso ? await this.pendiente(tx, proceso.id, proceso.estado === 'ABIERTO', hoy) : { pending: false, since: null },
          },
        };
      },
    });
  }

  // ─── API-NUT-18 ────────────────────────────────────────────────────────────────────────────
  registrar(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-NUT-18',
      casoDeUso: 'UC-P13',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      clave,
      esquema: RegistrarRevisionRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        const asesoradoId = await this.decidir(tx, 'API-NUT-18', actor, adviseeId, { tipo: 'Asesorado', id: adviseeId }, ctx);
        // UC-I05: taxonomía cerrada. Un valor fuera de ella no es 400: es REVIEW_RESULT_INVALID (UC-P13 E05).
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
        if (!evaluacion.valida) {
          throw componenteRequerido(evaluacion.faltantes.map((f) => ({ code: `REVIEW_${f}_REQUIRED`, path: RUTA_DE_FALTANTE[f] })));
        }
        if (resultado === 'CAMBIAR_OBJETIVO' && !pedido.nextAction.objective) {
          throw componenteRequerido([{ code: 'REVIEW_NEW_OBJECTIVE_REQUIRED', path: 'nextAction.objective' }]);
        }
        // La revisión es inmutable: si el objetivo nuevo cita una evaluación ajena o inexistente, nunca se podría aplicar.
        // Se rechaza al registrarla, con la ruta exacta.
        if (resultado === 'CAMBIAR_OBJETIVO' && pedido.nextAction.objective) {
          const refId = pedido.nextAction.objective.evaluationId;
          const ref = esUuid(refId) ? await tx.evaluacionNutricional.findUnique({ where: { id: refId }, select: { profesionalId: true, asesoradoId: true } }) : null;
          if (!ref || ref.profesionalId !== actor.identidadId || ref.asesoradoId !== asesoradoId) throw componenteRequerido([{ code: 'EVALUATION_NOT_COMPATIBLE', path: 'nextAction.objective.evaluationId' }]);
        }
        // UC-P13 precondición: hay un seguimiento abierto que revisar.
        const proceso = await tx.procesoOperativo.findFirst({ where: { profesionalId: actor.identidadId, asesoradoId, alcance: 'NUTRICION', estado: 'ABIERTO' } });
        if (!proceso) {
          throw new ErrorDeApi(422, CodigoDeError.REVIEW_NOT_ALLOWED, 'No hay un seguimiento nutricional abierto para revisar.');
        }
        await this.exigirEvidenciaReconstruible(tx, actor.identidadId, asesoradoId, pedido.evidenceReferences);
        const momento = await momentoDeLaBase(tx);
        const revision = await tx.revisionNutricional.create({
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
        await registrarEventoDeNutricion(tx, {
          tipo: 'RevisionRegistrada',
          profesionalId: actor.identidadId,
          asesoradoId,
          recurso: { tipo: 'RevisionNutricional', id: revision.id },
          estadoPrevio: null,
          estadoPosterior: null,
          actorId: actor.identidadId,
          procedencia,
          momento,
        });
        return {
          estadoHttp: 201,
          cuerpo: { data: revisionApi(revision, { asesoradoId }, await nombreVisibleDe(tx, actor.identidadId), proceso.id) },
          sujetoId: asesoradoId,
          recurso: { tipo: 'RevisionNutricional', id: revision.id },
        };
      },
    });
  }

  // ─── API-NUT-19 ────────────────────────────────────────────────────────────────────────────
  consultar(actor: ActorAutenticado, reviewId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: Revision }> {
    if (Object.keys(query ?? {}).length > 0) throw errores.solicitudInvalida(Object.keys(query).map((c) => ({ code: 'UNKNOWN_QUERY_PARAMETER', path: c })));
    const recurso = { tipo: 'RevisionNutricional', id: reviewId };
    return this.ejecutor.leer({
      operacion: 'API-NUT-19',
      casoDeUso: 'UC-P13',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const r = esUuid(reviewId) ? await tx.revisionNutricional.findUnique({ where: { id: reviewId }, include: { aplicacion: true, proceso: true } }) : null;
        if (!r) throw this.ejecutor.noRevelable({ operacion: 'API-NUT-19', actorId: actor.identidadId, recurso }, ctx);
        await this.decidir(tx, 'API-NUT-19', actor, r.proceso.asesoradoId, recurso, ctx);
        if (r.proceso.profesionalId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-NUT-19', actorId: actor.identidadId, recurso, sujetoId: r.proceso.asesoradoId }, ctx);
        return { data: revisionApi(r, r.proceso, await nombreVisibleDe(tx, actor.identidadId), r.procesoId) };
      },
    });
  }

  // ─── API-NUT-20 ────────────────────────────────────────────────────────────────────────────
  aplicar(actor: ActorAutenticado, reviewId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'RevisionNutricional', id: reviewId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-NUT-20',
      casoDeUso: 'UC-I06',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: VersionEsperadaRequestSchema,
      cuerpo,
      huellaExtra: { reviewId },
      efecto: async (tx, pedido, procedencia) => {
        // 1-3. Releer la revisión, PDP y aplicabilidad (09v9:929-949).
        const r = esUuid(reviewId) ? await tx.revisionNutricional.findUnique({ where: { id: reviewId }, include: { aplicacion: true, proceso: true } }) : null;
        if (!r) throw this.ejecutor.noRevelable({ operacion: 'API-NUT-20', actorId: actor.identidadId, recurso }, ctx);
        const asesoradoId = r.proceso.asesoradoId;
        await this.decidir(tx, 'API-NUT-20', actor, asesoradoId, recurso, ctx);
        if (r.proceso.profesionalId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-NUT-20', actorId: actor.identidadId, recurso, sujetoId: asesoradoId }, ctx);
        if (!esToken(pedido.expectedVersion, 1)) throw errores.conflictoDeVersion();
        // Dos aplicaciones a la vez con claves distintas: la fila de la revisión las serializa, y la segunda ve la
        // aplicación de la primera en vez de chocar con el índice único (09 v0.16.1:208).
        await tx.$queryRaw`SELECT 1 FROM "revision_nutricional" WHERE "id" = ${r.id}::uuid FOR UPDATE`;
        if (r.aplicacion || (await tx.aplicacionDeRevision.count({ where: { revisionId: r.id } })) > 0) throw new ErrorDeApi(409, CodigoDeError.REVIEW_ALREADY_APPLIED, 'Esta revisión ya se aplicó.');
        if (r.proceso.estado !== 'ABIERTO') {
          throw new ErrorDeApi(422, CodigoDeError.CONTINUITY_ACTION_NOT_APPLICABLE, 'El seguimiento ya está cerrado: la revisión no se puede aplicar.');
        }
        const momento = await momentoDeLaBase(tx);
        const accion = r.proximaAccion as { description: string; nextReviewAt?: string | null; objective?: Parameters<EvaluacionesService['emitirVersionDeObjetivo']>[1]['contenido'] };
        const efecto = EFECTO_DE_RESULTADO[r.resultado];

        // 4-5. Consecuencia vertical, antes del evento (REG-06-77). Orden de bloqueos: plan → versión → Proceso.
        let versionDePlanCreadaId: string | null = null;
        let versionDeObjetivoCreadaId: string | null = null;
        if (efecto.vertical === 'BORRADOR_SUCESOR') {
          const plan = await tx.planNutricional.findUnique({ where: { profesionalId_asesoradoId: { profesionalId: actor.identidadId, asesoradoId } } });
          const objetivo = await tx.objetivoNutricional.findUnique({ where: { profesionalId_asesoradoId: { profesionalId: actor.identidadId, asesoradoId } } });
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
            // UC-I06 E02: combinación incompatible (ya hay un borrador): no hay transición parcial ni evento.
            if (e instanceof ErrorDeApi && e.code === CodigoDeError.RESOURCE_CONFLICT) {
              throw new ErrorDeApi(422, CodigoDeError.CONTINUITY_ACTION_NOT_APPLICABLE, 'Ya hay un borrador del plan. Activalo o seguí trabajando sobre él antes de aplicar esta revisión.', e.details);
            }
            throw e;
          }
        } else if (efecto.vertical === 'NUEVA_VERSION_DE_OBJETIVO') {
          if (!accion.objective) throw new ErrorDeApi(422, CodigoDeError.REVIEW_NOT_VALID_FOR_APPLICATION, 'La revisión no trae el objetivo nuevo.');
          // Si el objetivo ya no se puede emitir, la revisión no es aplicable tal como quedó (09v10:1441).
          const v = await this.evaluaciones.emitirVersionDeObjetivo(tx, { profesionalId: actor.identidadId, asesoradoId, contenido: accion.objective, revisionDeOrigenId: r.id, procedencia }).catch((e: unknown) => {
            if (e instanceof ErrorDeApi && e.status === 422) throw new ErrorDeApi(422, CodigoDeError.REVIEW_NOT_VALID_FOR_APPLICATION, 'El objetivo que trae la revisión ya no se puede emitir.', e.details);
            throw e;
          });
          versionDeObjetivoCreadaId = v.id;
        }

        // 6-7. Transición del Proceso y evento ContinuidadOCierreAplicado (REG-06-73 a 75).
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
        // REG-06-145/146: la revisión fija la próxima expectativa. FINALIZAR cierra y no deja ninguna.
        if (r.resultado !== 'FINALIZAR' && accion.nextReviewAt) {
          await this.procesos.fijarProximaRevision(tx, { procesoId: proceso.id, fecha: accion.nextReviewAt, fuente: { revisionId: r.id }, actorId: actor.identidadId, procedencia, momento });
        }
        const aplicacion = await tx.aplicacionDeRevision.create({
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

  /** REG-06-150 sobre un Proceso: expectativa vigente y si una revisión aplicada posterior la resolvió. */
  async pendiente(tx: Tx, procesoId: string, abierto: boolean, hoy: string): Promise<{ pending: boolean; since: string | null }> {
    const expectativa = await this.procesos.proximaRevisionVigente(tx, procesoId);
    const aplicadaPosterior = expectativa
      ? (await tx.aplicacionDeRevision.count({ where: { revision: { procesoId, momentoDeRegistro: { gt: expectativa.momentoDeRegistro } } } })) > 0
      : false;
    const r = revisionPendiente({
      procesoAbierto: abierto,
      expectativa: expectativa ? { fechaObjetivo: expectativa.fechaObjetivo ? fechaLocal(expectativa.fechaObjetivo) : null, registradaEn: fechaLocal(expectativa.momentoDeRegistro) } : undefined,
      revisionAplicadaPosterior: aplicadaPosterior,
      ahora: hoy,
    });
    return r.pendiente ? { pending: true, since: r.desde } : { pending: false, since: null };
  }

  /**
   * REG-06-141: la evidencia examinada es reconstruible. Cada referencia existe y es de esta terna (UC-I05 E02).
   */
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
        return (await tx.ingestaNutricional.count({ where: { id: ref.id, asesoradoId, versionDePlan: { plan: { profesionalId } } } })) > 0;
      case 'PLAN_VERSION':
        return (await tx.versionDePlanNutricional.count({ where: { id: ref.id, estado: 'ACTIVADA', plan: { profesionalId, asesoradoId } } })) > 0;
      case 'OBJECTIVE_VERSION':
        return (await tx.versionDeObjetivoNutricional.count({ where: { id: ref.id, objetivo: { profesionalId, asesoradoId } } })) > 0;
      case 'EVALUATION':
        return (await tx.evaluacionNutricional.count({ where: { id: ref.id, profesionalId, asesoradoId } })) > 0;
      default:
        return false;
    }
  }

  private async decidir(tx: Tx, operacion: string, actor: ActorAutenticado, adviseeId: string, recurso: { tipo: string; id: string } | null, ctx: ContextoDeSolicitud): Promise<string> {
    const d = await this.pdp.decidirEnTransaccion(
      tx,
      { operacion, actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: adviseeId, alcance: 'NUTRICION', recurso },
      ctx,
    );
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
