import { Injectable } from '@nestjs/common';
import {
  calibrar,
  CodigoDeError,
  ESPECIFICACION_DEL_UNO_RM,
  esConBarra,
  guardadosEnOrden,
  sesionesDeLosRegistros,
  SumarUnoRMRequestSchema,
  ultimoRegistroEnRango,
  vigenteDelUnoRM,
  type BandaDelUnoRM,
  type OrigenDelUnoRM,
  type SerieDelUnoRM,
  type UnoRMDelEjercicio,
  type UnoRMDelRegistro,
  type UnoRMDelRegistroApi,
  type UnoRMDeLaPersonaResponse,
  type UnoRMGuardado,
  type UnoRMGuardadoApi,
} from '@be/domain';
import type { Prisma, UnoRMDeReferencia as FilaDeUnoRM } from '@prisma/client';
import { ejecucionesDelPeriodo } from '../analisis/fuentes';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { ZONA_POR_DEFECTO, fechaLocalEn } from '../nutricion/zona';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecucionesDeEntrenamientoService } from './ejecuciones.service';
import { EjecutorDeEntrenamiento, esUuid } from './ejecutor';
import { registrarEventoDeEntrenamiento } from './eventos';
import { nombreVisibleDe } from './lectura-entrenamiento';

type Tx = Prisma.TransactionClient;

const CASO_DE_USO = 'UC-P15';
const RECURSO = 'UnoRMDeReferencia';
/** Hasta cuántos ejercicios se piden juntos (los de una sesión larga, o los de una fase). */
const TOPE_DE_EJERCICIOS = 60;
/** Lo guardado que se devuelve por ejercicio. */
const TOPE_DE_LA_HISTORIA = 20;
/** Cuánto atrás se busca el último registro en rango: un año. */
const DIAS_DEL_REGISTRO = 365;
const fechaDe = (d: Date): string => d.toISOString().slice(0, 10);
const comoFecha = (f: string): Date => new Date(`${f}T00:00:00.000Z`);
const restarDias = (f: string, n: number): string => fechaDe(new Date(comoFecha(f).getTime() - n * 86_400_000));

const METODO = { specification: ESPECIFICACION_DEL_UNO_RM.especificacion, version: ESPECIFICACION_DEL_UNO_RM.version, method: ESPECIFICACION_DEL_UNO_RM.metodo } as const;

interface SerieGuardada {
  readonly load: { readonly value: number; readonly unit: 'kg' | 'lb' };
  readonly completedRepetitions: number;
  readonly rir: number;
}

const serieDeLaFila = (f: FilaDeUnoRM): SerieDelUnoRM | null => {
  const s = f.serie as unknown as SerieGuardada | null;
  return s ? { carga: s.load, repeticiones: s.completedRepetitions, rir: s.rir } : null;
};
const serieApi = (s: SerieDelUnoRM): SerieGuardada => ({ load: s.carga, completedRepetitions: s.repeticiones, rir: s.rir });

/** Una fila en los términos del dominio. */
function guardadoDe(f: FilaDeUnoRM): UnoRMGuardado {
  return {
    entryId: f.id,
    origen: f.origen as OrigenDelUnoRM,
    valor: { value: f.valor, unit: f.unidad as 'kg' | 'lb' },
    fecha: fechaDe(f.fechaLocal),
    registradoEn: f.momentoDeRegistro.toISOString(),
    serie: serieDeLaFila(f),
    banda: (f.banda as BandaDelUnoRM | null) ?? null,
  };
}

function guardadoApi(f: FilaDeUnoRM, autor: string): UnoRMGuardadoApi {
  const s = serieDeLaFila(f);
  return {
    entryId: f.id,
    exerciseId: f.ejercicioId,
    origin: f.origen as OrigenDelUnoRM,
    value: { value: f.valor, unit: f.unidad as 'kg' | 'lb' },
    localDate: fechaDe(f.fechaLocal),
    set: s ? serieApi(s) : null,
    method: f.metodo ? METODO : null,
    band: (f.banda as BandaDelUnoRM | null) ?? null,
    record: (f.registro as unknown as UnoRMGuardadoApi['record']) ?? null,
    note: f.nota,
    author: { identityId: f.profesionalId, displayName: autor },
    recordedAt: f.momentoDeRegistro.toISOString(),
  };
}

const registroApi = (r: UnoRMDelRegistro): UnoRMDelRegistroApi => ({
  value: r.valor,
  localDate: r.fecha,
  set: serieApi(r.serie),
  band: r.banda,
  executionId: r.executionId,
  prescriptionId: r.prescriptionId,
  setIndex: r.setIndex,
  method: METODO,
});

/** Dónde está el dato que impide calibrar, para el 422 (la pantalla lo pone junto a su campo). */
const LUGAR_DEL_MOTIVO: Readonly<Record<string, string>> = { SIN_CARGA: 'load', REPETICIONES_FUERA: 'completedRepetitions', SIN_RIR: 'rir', RIR_MAYOR_QUE_2: 'rir', FUERA_DE_ESCALA: 'load' };

/**
 * DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2, ET2-01 a ET2-04) · el 1RM de referencia: API-RMX-01 y 02, familia propia de BE.
 * - **Permisos:** los de la serie observada (API-FZA-01 a 03): el PDP de Entrenamiento con el profesional que pide y la
 *   persona, decidido en la transacción; cada profesional ve y suma lo propio (DL-057). Lo ajeno y lo inexistente son el
 *   mismo 404. Cada lectura y cada escritura quedan auditadas por el ejecutor.
 * - **El registro** se calcula al leer, desde las sesiones registradas en los planes de este profesional con la persona
 *   del último año (`BE-E1RM` v2): nunca se acepta del cliente. Elegirlo (`RECORD`) vuelve a leerlo y a calcularlo.
 * - **Solo agregar:** nada se edita ni se borra; la base lo impide.
 * - **La persona no lo recibe:** no hay ruta del titular, y la APK no lee nada de esto.
 */
@Injectable()
export class UnoRMService {
  constructor(
    private readonly ejecutor: EjecutorDeEntrenamiento,
    private readonly pdp: PdpService,
    private readonly ejecuciones: EjecucionesDeEntrenamientoService,
  ) {}

  // ─── API-RMX-01 ────────────────────────────────────────────────────────────────────────────
  listar(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<UnoRMDeLaPersonaResponse> {
    const desconocidos = Object.keys(query).filter((k) => k !== 'exerciseIds');
    if (desconocidos.length > 0) throw errores.solicitudInvalida(desconocidos.map((k) => ({ code: 'UNKNOWN_QUERY_PARAMETER', path: k })));
    const texto = query.exerciseIds;
    if (typeof texto !== 'string' || texto.length === 0 || texto.length > TOPE_DE_EJERCICIOS * 37) throw errores.solicitudInvalida([{ code: 'INVALID_FILTER', path: 'exerciseIds' }]);
    const ids = [...new Set(texto.split(',').map((x) => x.trim().toLowerCase()))];
    if (ids.length > TOPE_DE_EJERCICIOS || ids.some((x) => !esUuid(x))) throw errores.solicitudInvalida([{ code: 'INVALID_FILTER', path: 'exerciseIds' }]);
    return this.ejecutor.leer({
      operacion: 'API-RMX-01',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        const asesoradoId = await this.decidir(tx, 'API-RMX-01', actor, adviseeId, null, ctx);
        return { data: await this.delosEjercicios(tx, actor.identidadId, asesoradoId, ids) };
      },
    });
  }

  // ─── API-RMX-02 ────────────────────────────────────────────────────────────────────────────
  sumar(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-RMX-02',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      clave,
      esquema: SumarUnoRMRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        const asesoradoId = await this.decidir(tx, 'API-RMX-02', actor, adviseeId, { tipo: 'Asesorado', id: adviseeId }, ctx);
        const ejercicio = await this.ejercicioDe(tx, pedido.exerciseId);
        if (!ejercicio) throw errores.validacionFallida([{ code: 'EXERCISE_UNKNOWN', path: 'exerciseId' }]);
        const hoy = fechaLocalEn(await momentoDeLaBase(tx), ZONA_POR_DEFECTO);
        const comun = { profesionalId: actor.identidadId, asesoradoId, ejercicioId: pedido.exerciseId, procedencia: procedencia as unknown as Prisma.InputJsonValue };
        let data: Prisma.UnoRMDeReferenciaUncheckedCreateInput;
        if (pedido.origin === 'RECORD') {
          const [antes] = await this.delosEjercicios(tx, actor.identidadId, asesoradoId, [pedido.exerciseId]);
          const registro = antes?.lastRecord ?? null;
          // Solo el último registro en rango, el que la pantalla mostró: otro (o uno que ya no está) no se elige.
          if (!registro || registro.executionId !== pedido.executionId || registro.prescriptionId !== pedido.prescriptionId || registro.setIndex !== pedido.setIndex) {
            throw errores.validacionFallida([{ code: 'RECORD_NOT_CURRENT', path: 'executionId' }]);
          }
          data = {
            ...comun,
            origen: 'RECORD',
            valor: registro.value.value,
            unidad: registro.value.unit,
            fechaLocal: comoFecha(registro.localDate),
            serie: registro.set as unknown as Prisma.InputJsonValue,
            metodo: METODO as unknown as Prisma.InputJsonValue,
            banda: registro.band,
            registro: { executionId: registro.executionId, prescriptionId: registro.prescriptionId, setIndex: registro.setIndex } as unknown as Prisma.InputJsonValue,
          };
        } else {
          if (pedido.localDate > hoy) throw new ErrorDeApi(422, CodigoDeError.VALIDATION_FAILED, 'La fecha no puede ser futura.', { issues: [{ code: 'DATE_IN_FUTURE', path: 'localDate' }] });
          const nota = pedido.note?.trim() || null;
          if (pedido.origin === 'CALIBRATION') {
            const serie = { carga: pedido.load, repeticiones: pedido.completedRepetitions, rir: pedido.rir };
            const r = calibrar(serie);
            if (!r.ok) throw new ErrorDeApi(422, CodigoDeError.VALIDATION_FAILED, 'Con esta serie no se puede calibrar.', { issues: [{ code: r.motivo, path: LUGAR_DEL_MOTIVO[r.motivo] ?? 'load' }] });
            data = {
              ...comun,
              origen: 'CALIBRATION',
              valor: r.valor.value,
              unidad: r.valor.unit,
              fechaLocal: comoFecha(pedido.localDate),
              serie: serieApi(serie) as unknown as Prisma.InputJsonValue,
              metodo: METODO as unknown as Prisma.InputJsonValue,
              banda: esConBarra(ejercicio.equipamiento, ejercicio.nombre) ? 'CORE' : 'ORIENTATIVE',
              nota,
            };
          } else {
            data = { ...comun, origen: 'DECLARED', valor: pedido.value.value, unidad: pedido.value.unit, fechaLocal: comoFecha(pedido.localDate), nota };
          }
        }
        const fila = await tx.unoRMDeReferencia.create({ data });
        await registrarEventoDeEntrenamiento(tx, {
          tipo: 'UnoRMDeReferenciaSumado',
          profesionalId: actor.identidadId,
          asesoradoId,
          recurso: { tipo: RECURSO, id: fila.id },
          estadoPrevio: null,
          estadoPosterior: fila.origen,
          actorId: actor.identidadId,
          procedencia: procedencia as Parameters<typeof registrarEventoDeEntrenamiento>[1]['procedencia'],
          momento: null,
        });
        const [delEjercicio] = await this.delosEjercicios(tx, actor.identidadId, asesoradoId, [pedido.exerciseId]);
        return {
          estadoHttp: 201,
          cuerpo: { data: { entry: guardadoApi(fila, await nombreVisibleDe(tx, actor.identidadId)), exercise: delEjercicio! } },
          sujetoId: asesoradoId,
          recurso: { tipo: RECURSO, id: fila.id },
        };
      },
    });
  }

  // ─── Apoyo ─────────────────────────────────────────────────────────────────────────────────

  /** El PDP de Entrenamiento, como la serie observada; devuelve la identidad del titular. */
  private async decidir(tx: Tx, operacion: string, actor: ActorAutenticado, adviseeId: string, recurso: { tipo: string; id: string } | null, ctx: ContextoDeSolicitud): Promise<string> {
    const d = await this.pdp.decidirEnTransaccion(tx, { operacion, actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: adviseeId, alcance: 'ENTRENAMIENTO', recurso }, ctx);
    return d.hechos.titular?.identidadId as string;
  }

  /** El nombre vigente y el equipamiento de la clasificación vigente de un ejercicio, o `null` si no existe. */
  private async ejercicioDe(tx: Tx, exerciseId: string): Promise<{ nombre: string; equipamiento: string[] } | null> {
    return (await this.ejerciciosDe(tx, [exerciseId])).get(exerciseId) ?? null;
  }

  private async ejerciciosDe(tx: Tx, ids: readonly string[]): Promise<Map<string, { nombre: string; equipamiento: string[] }>> {
    if (ids.length === 0) return new Map();
    const filas = await tx.ejercicioDeCatalogo.findMany({
      where: { id: { in: [...ids] } },
      select: {
        id: true,
        versiones: { orderBy: { momentoDeRegistro: 'desc' }, take: 1, select: { nombre: true } },
        clasificaciones: { orderBy: { numero: 'desc' }, take: 1, select: { equipamiento: true } },
      },
    });
    return new Map(filas.map((f) => [f.id, { nombre: f.versiones[0]?.nombre ?? '', equipamiento: [...(f.clasificaciones[0]?.equipamiento ?? [])] }]));
  }

  /** Lo de cada ejercicio pedido: el vigente, el aviso, el último registro y lo guardado. */
  private async delosEjercicios(tx: Tx, profesionalId: string, asesoradoId: string, ids: readonly string[]): Promise<UnoRMDelEjercicio[]> {
    const hoy = fechaLocalEn(await momentoDeLaBase(tx), ZONA_POR_DEFECTO);
    const filas = await tx.unoRMDeReferencia.findMany({
      where: { profesionalId, asesoradoId, ejercicioId: { in: [...ids] } },
      orderBy: [{ fechaLocal: 'desc' }, { momentoDeRegistro: 'desc' }, { id: 'desc' }],
    });
    const ejercicios = await this.ejerciciosDe(tx, ids);
    // Una sola lectura de las sesiones para todos los ejercicios pedidos.
    const ejecuciones = await ejecucionesDelPeriodo(tx, this.ejecuciones, profesionalId, asesoradoId, restarDias(hoy, DIAS_DEL_REGISTRO), hoy);
    const porEjercicio = sesionesDeLosRegistros(ejecuciones);
    const autor = await nombreVisibleDe(tx, profesionalId);
    return ids.map((exerciseId) => {
      const propias = filas.filter((f) => f.ejercicioId === exerciseId);
      const guardados = guardadosEnOrden(propias.map(guardadoDe));
      const ej = ejercicios.get(exerciseId) ?? { nombre: '', equipamiento: [] };
      // El registro en la unidad de lo último guardado: entre kg y lb no se compara (sin nada guardado, cualquiera).
      const unidad = guardados[0]?.valor.unit ?? null;
      const registro = ultimoRegistroEnRango(porEjercicio.get(exerciseId) ?? [], unidad, esConBarra(ej.equipamiento, ej.nombre));
      const { vigente, aviso } = vigenteDelUnoRM(guardados, registro);
      return {
        exerciseId,
        current: vigente ? { origin: vigente.origen, value: vigente.valor, localDate: vigente.fecha, band: vigente.banda, set: vigente.serie ? serieApi(vigente.serie) : null, entryId: vigente.entryId } : null,
        warning: aviso ? { record: registroApi(aviso.registro), relativeDifference: aviso.diferencia } : null,
        lastRecord: registro ? registroApi(registro) : null,
        history: propias.slice(0, TOPE_DE_LA_HISTORIA).map((f) => guardadoApi(f, autor)),
      };
    });
  }
}
