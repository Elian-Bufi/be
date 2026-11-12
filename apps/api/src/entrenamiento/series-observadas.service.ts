import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  EJERCICIOS_DE_LA_ESTIMACION_V1,
  estimacionApi,
  estimarLaSerie,
  RegistrarSerieObservadaRequestSchema,
  SucederSerieObservadaRequestSchema,
  type EstimacionDeFuerzaApi,
  type SerieObservada as SerieObservadaApiEntrada,
  type SerieObservadaGuardada,
} from '@be/domain';
import type { Prisma, SerieObservada as FilaDeSerieObservada } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { fechaLocalEn } from '../nutricion/zona';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase, sinDuplicar } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecutorDeEntrenamiento, esUuid } from './ejecutor';
import { registrarEventoDeEntrenamiento } from './eventos';
import { nombreVisibleDe } from './lectura-entrenamiento';

type Tx = Prisma.TransactionClient;

const CASO_DE_USO = 'UC-P14';
const RECURSO = 'SerieObservada';
const TOPE_DE_LA_LISTA = 200;
const token = (n: number): string => `v${n}`;
const comoFecha = (f: string): Date => new Date(`${f}T00:00:00.000Z`);
const fechaDe = (d: Date): string => d.toISOString().slice(0, 10);

/** Dónde está el dato que impide estimar, para el 422 (la pantalla lo pone junto a su campo). */
const LUGAR_DEL_MOTIVO: Readonly<Record<string, string>> = {
  FUERA_DE_LA_LISTA: 'exerciseId',
  SIN_CARGA: 'load',
  SIN_REPETICIONES: 'completedRepetitions',
  MAS_DE_12: 'completedRepetitions',
  SIN_RIR: 'rir',
  RIR_MAYOR_QUE_2: 'rir',
};

/**
 * ED-72 (WP-EDITORES-PROFESIONAL; DL-171) · La serie observada por el profesional: API-FZA-01 a 03, familia propia de BE.
 * - **Permisos:** los de la evaluación de entrenamiento (API-TRN-01 a 03): el PDP de Entrenamiento, decidido en la
 *   transacción, y cada profesional ve y sucede solo lo propio (DL-057). Lo ajeno es el 404 de lo inexistente. Cada
 *   lectura y cada escritura quedan auditadas (08 §29) por el ejecutor.
 * - **El dato:** el ejercicio de la lista de la v1, la fecha civil y la zona, la carga con su unidad, las repeticiones,
 *   el RIR (obligatorio, de 0 a 2) y una nota. Se guarda con su estimación Epley v1 (especificación, versión, método,
 *   banda, entradas y valor) como hecho histórico (REG-06-205). Lo que no se puede estimar no se guarda (ED-D19): 422
 *   STRENGTH_OBSERVATION_NOT_ESTIMABLE con el motivo del dominio.
 * - **Solo agregar:** no se edita. Corregir o anular es una fila nueva que sucede a la vigente, con su motivo y la versión
 *   esperada; la base impide cambiarla, borrarla o sucederla dos veces.
 * - **La persona no la recibe:** no hay ruta del titular, y la APK no lee nada de esto.
 */
@Injectable()
export class SeriesObservadasService {
  constructor(
    private readonly ejecutor: EjecutorDeEntrenamiento,
    private readonly pdp: PdpService,
  ) {}

  // ─── API-FZA-01 ────────────────────────────────────────────────────────────────────────────
  registrar(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-FZA-01',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      clave,
      esquema: RegistrarSerieObservadaRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        const asesoradoId = await this.decidir(tx, 'API-FZA-01', actor, adviseeId, { tipo: 'Asesorado', id: adviseeId }, ctx);
        const estimacion = await this.estimable(tx, pedido);
        const fila = await tx.serieObservada.create({
          data: {
            profesionalId: actor.identidadId,
            asesoradoId,
            ejercicioId: pedido.exerciseId,
            ...valores(pedido, estimacion),
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
        });
        await this.evento(tx, 'SerieObservadaRegistrada', fila, procedencia);
        return { estadoHttp: 201, cuerpo: { data: serieObservadaApi(fila, await nombreVisibleDe(tx, actor.identidadId)) }, sujetoId: asesoradoId, recurso: { tipo: RECURSO, id: fila.id } };
      },
    });
  }

  // ─── API-FZA-02 ────────────────────────────────────────────────────────────────────────────
  listar(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: SerieObservadaGuardada[]; page: unknown }> {
    const desconocidos = Object.keys(query).filter((k) => k !== 'exerciseId');
    if (desconocidos.length > 0) throw errores.solicitudInvalida(desconocidos.map((k) => ({ code: 'UNKNOWN_QUERY_PARAMETER', path: k })));
    const exerciseId = query.exerciseId;
    if (exerciseId !== undefined && (typeof exerciseId !== 'string' || !esUuid(exerciseId))) throw errores.solicitudInvalida([{ code: 'INVALID_FILTER', path: 'exerciseId' }]);
    return this.ejecutor.leer({
      operacion: 'API-FZA-02',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        const asesoradoId = await this.decidir(tx, 'API-FZA-02', actor, adviseeId, null, ctx);
        const filas = await vigentesDe(tx, actor.identidadId, asesoradoId, typeof exerciseId === 'string' ? exerciseId : null, TOPE_DE_LA_LISTA + 1);
        const nombre = await nombreVisibleDe(tx, actor.identidadId);
        const pagina = filas.slice(0, TOPE_DE_LA_LISTA);
        return { data: pagina.map((f) => serieObservadaApi(f, nombre)), page: { limit: TOPE_DE_LA_LISTA, nextCursor: null, hasMore: filas.length > TOPE_DE_LA_LISTA } };
      },
    });
  }

  // ─── API-FZA-03 ────────────────────────────────────────────────────────────────────────────
  suceder(actor: ActorAutenticado, observationId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO, id: observationId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-FZA-03',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: SucederSerieObservadaRequestSchema,
      cuerpo,
      huellaExtra: { observationId },
      efecto: async (tx, pedido, procedencia) => {
        const previa = esUuid(observationId) ? await tx.serieObservada.findUnique({ where: { id: observationId }, include: { sucesora: { select: { id: true } } } }) : null;
        // Lo ajeno, una anulación o lo inexistente: el mismo 404 (la anulación no es una observación que se pueda leer).
        if (!previa || previa.tipo !== 'OBSERVADA') throw this.ejecutor.noRevelable({ operacion: 'API-FZA-03', actorId: actor.identidadId, recurso }, ctx);
        await this.decidir(tx, 'API-FZA-03', actor, previa.asesoradoId, recurso, ctx);
        if (previa.profesionalId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-FZA-03', actorId: actor.identidadId, recurso, sujetoId: previa.asesoradoId }, ctx);
        if (previa.sucesora || pedido.expectedVersion !== token(previa.posicion)) throw errores.conflictoDeVersion();
        const comun = {
          profesionalId: actor.identidadId,
          asesoradoId: previa.asesoradoId,
          ejercicioId: previa.ejercicioId,
          predecesoraId: previa.id,
          motivo: pedido.reason,
          posicion: previa.posicion + 1,
          procedencia: procedencia as unknown as Prisma.InputJsonValue,
        };
        // La unicidad de la predecesora frena a dos sucesoras simultáneas: la segunda es un conflicto de versión.
        if (pedido.action === 'VOID') {
          const anulacion = await sinDuplicar(tx.serieObservada.create({ data: { ...comun, tipo: 'ANULACION', fechaLocal: previa.fechaLocal, zonaHoraria: previa.zonaHoraria } }), () => errores.conflictoDeVersion());
          await this.evento(tx, 'SerieObservadaSucedida', anulacion, procedencia);
          return {
            estadoHttp: 201,
            cuerpo: { data: { action: 'VOIDED', voidedObservationId: previa.id, reason: pedido.reason, recordedAt: anulacion.momentoDeRegistro.toISOString() } },
            sujetoId: previa.asesoradoId,
            recurso: { tipo: RECURSO, id: anulacion.id },
          };
        }
        const corregida = { ...pedido.observation, exerciseId: previa.ejercicioId };
        const estimacion = await this.estimable(tx, corregida);
        const fila = await sinDuplicar(tx.serieObservada.create({ data: { ...comun, ...valores(corregida, estimacion) } }), () => errores.conflictoDeVersion());
        await this.evento(tx, 'SerieObservadaSucedida', fila, procedencia);
        return {
          estadoHttp: 201,
          cuerpo: { data: { action: 'CORRECTED', observation: serieObservadaApi(fila, await nombreVisibleDe(tx, actor.identidadId)) } },
          sujetoId: previa.asesoradoId,
          recurso: { tipo: RECURSO, id: fila.id },
        };
      },
    });
  }

  // ─── Apoyo ─────────────────────────────────────────────────────────────────────────────────

  /** El PDP de Entrenamiento, como la evaluación (API-TRN-01 a 03); devuelve la identidad del titular. */
  private async decidir(tx: Tx, operacion: string, actor: ActorAutenticado, adviseeId: string, recurso: { tipo: string; id: string } | null, ctx: ContextoDeSolicitud): Promise<string> {
    const d = await this.pdp.decidirEnTransaccion(tx, { operacion, actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: adviseeId, alcance: 'ENTRENAMIENTO', recurso }, ctx);
    return d.hechos.titular?.identidadId as string;
  }

  /**
   * La estimación de lo observado, o el 422 con su motivo. Antes, que la fecha no sea futura en la zona declarada: una
   * zona que no existe es un 400, no un 500.
   */
  private async estimable(tx: Tx, s: SerieObservadaApiEntrada): Promise<EstimacionDeFuerzaApi> {
    let hoy: string;
    try {
      hoy = fechaLocalEn(await momentoDeLaBase(tx), s.timeZone);
    } catch {
      throw errores.solicitudInvalida([{ code: 'TIME_ZONE_INVALID', path: 'timeZone' }]);
    }
    if (s.localDate > hoy) throw new ErrorDeApi(422, CodigoDeError.VALIDATION_FAILED, 'La fecha de la serie observada no puede ser futura.', { issues: [{ code: 'OBSERVED_DATE_IN_FUTURE', path: 'localDate' }] });
    const r = estimarLaSerie({ exerciseId: s.exerciseId, fuente: 'OBSERVADA', load: s.load, completedRepetitions: s.completedRepetitions, rir: s.rir, fechaCivil: s.localDate });
    if (!r.entra) {
      throw new ErrorDeApi(422, CodigoDeError.STRENGTH_OBSERVATION_NOT_ESTIMABLE, 'Esta serie no se puede estimar con Epley v1: no se guarda.', {
        issues: [{ code: r.motivo, path: LUGAR_DEL_MOTIVO[r.motivo] ?? 'observation' }],
      });
    }
    return estimacionApi(r.estimacion);
  }

  private evento(tx: Tx, tipo: 'SerieObservadaRegistrada' | 'SerieObservadaSucedida', fila: FilaDeSerieObservada, procedencia: unknown): Promise<void> {
    return registrarEventoDeEntrenamiento(tx, {
      tipo,
      profesionalId: fila.profesionalId,
      asesoradoId: fila.asesoradoId,
      recurso: { tipo: RECURSO, id: fila.id },
      estadoPrevio: null,
      estadoPosterior: fila.tipo,
      actorId: fila.profesionalId,
      procedencia: procedencia as Parameters<typeof registrarEventoDeEntrenamiento>[1]['procedencia'],
      momento: null,
    });
  }
}

/** Las columnas de una observación con sus valores y su estimación. */
function valores(s: SerieObservadaApiEntrada, estimacion: EstimacionDeFuerzaApi) {
  const nota = s.note?.trim();
  return {
    tipo: 'OBSERVADA' as const,
    fechaLocal: comoFecha(s.localDate),
    zonaHoraria: s.timeZone,
    carga: s.load.value,
    unidad: s.load.unit,
    repeticiones: s.completedRepetitions,
    rir: s.rir,
    nota: nota ? nota : null,
    estimacion: estimacion as unknown as Prisma.InputJsonValue,
  };
}

/**
 * Las observaciones vigentes de este profesional con la persona: las que nadie sucedió (ni corrigió ni anuló), de la
 * más reciente a la más antigua. ED-74 las suma a la evolución.
 */
export function vigentesDe(tx: Tx, profesionalId: string, asesoradoId: string, ejercicioId: string | null, tope: number, periodo?: { desde: string; hasta: string }): Promise<FilaDeSerieObservada[]> {
  return tx.serieObservada.findMany({
    where: {
      profesionalId,
      asesoradoId,
      tipo: 'OBSERVADA',
      sucesora: { is: null },
      ...(ejercicioId ? { ejercicioId } : {}),
      ...(periodo ? { fechaLocal: { gte: comoFecha(periodo.desde), lte: comoFecha(periodo.hasta) } } : {}),
    },
    orderBy: [{ fechaLocal: 'desc' }, { momentoDeRegistro: 'desc' }, { id: 'desc' }],
    take: tope,
  });
}

/** Una observación vigente en la forma de la API. */
export function serieObservadaApi(f: FilaDeSerieObservada, nombreDelProfesional: string): SerieObservadaGuardada {
  return {
    observationId: f.id,
    version: token(f.posicion),
    adviseeId: f.asesoradoId,
    exerciseId: f.ejercicioId,
    exerciseName: EJERCICIOS_DE_LA_ESTIMACION_V1.find((e) => e.exerciseId === f.ejercicioId)?.nombre ?? '',
    localDate: fechaDe(f.fechaLocal),
    timeZone: f.zonaHoraria,
    note: f.nota,
    estimate: f.estimacion as unknown as EstimacionDeFuerzaApi,
    observedBy: { identityId: f.profesionalId, displayName: nombreDelProfesional },
    supersedes: f.predecesoraId ? { observationId: f.predecesoraId, reason: f.motivo ?? '' } : null,
    recordedAt: f.momentoDeRegistro.toISOString(),
  };
}
