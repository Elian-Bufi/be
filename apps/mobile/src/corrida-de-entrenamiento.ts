/**
 * La corrida de una sesión de entrenamiento en el teléfono (WP-ENTRENAMIENTO-SERIES §5 y §7.4; DL-124): las acciones de
 * la persona convertidas en eventos de tiempo.
 *
 * - **Cada acción arma sus eventos** (`armarAccion`) con un identificador de cliente, la corrida, la secuencia
 *   correlativa y, si la acción es compuesta, un `compoundActionId` común. Los eventos de una acción comparten el
 *   instante: «finalizar el descanso e iniciar la serie» pasa en el mismo momento.
 * - **Antes de encolarlos, se validan** con `aplicarEventos`, la misma regla que aplica la API: una medición abierta a la
 *   vez, nada se mide en pausa, una sola corrida. Lo que el dominio rechaza no se encola.
 * - **Lo que se muestra mientras corre** sale de `enVivo`, desde los instantes. Nada se cuenta sumando ticks.
 * - **Los eventos viajan en lotes** de hasta 30, en orden (`loteSiguiente`). `RECORDED` y `DUPLICATE` salen de
 *   pendientes; `CONFLICT` y `REJECTED` quedan y se muestran (`aplicarResultadosDelLote`): nada se descarta en silencio.
 * - **Si el proceso murió con una medición abierta**, la abrió un evento que no creó este proceso
 *   (`medicionDeOtroProceso` del almacén, que no depende del ancla: con el reloj desde el arranque, el ancla sigue igual
 *   al reabrir la app). La app pregunta y nunca la cierra sola: «Terminó ahora» es un instante declarado y «Dejarla
 *   incompleta» no afirma ningún fin.
 *
 * Es lógica pura: el reloj y los identificadores se inyectan.
 */
import {
  aplicarEventos,
  enVivo,
  estadoDeLaCorrida,
  EventoDeTiempoSchema,
  type ContextoDeEventos,
  type DuracionApi,
  type EstadoDeLaCorrida,
  type EventoDeTiempo,
  type MotivoDeEvento,
  type ResultadoDeEvento,
} from '@be/domain';
import type { RelojDeSesion } from './reloj-de-sesion';

/** Los eventos de una corrida: los que la API ya registró y los que esperan en el teléfono, en orden de secuencia. */
export interface Corrida {
  readonly registrados: readonly EventoDeTiempo[];
  readonly pendientes: readonly EventoDeTiempo[];
}

export const CORRIDA_VACIA: Corrida = { registrados: [], pendientes: [] };

/** Cuántos eventos lleva, como mucho, un pedido de API-TIE-01. */
export const EVENTOS_POR_PEDIDO = 30;

/** Lo que se inyecta: el reloj del proceso y un generador de identificadores con prefijo. */
export interface Herramientas {
  readonly reloj: RelojDeSesion;
  readonly nuevoId: (prefijo: string) => string;
}

export type ResolucionDeMedicion = 'termino-ahora' | 'incompleta';

/** Las acciones explícitas que marcan tiempos. Abrir la técnica, el plan o el historial no es ninguna. */
export type AccionDeTiempo =
  /** «Iniciar entrenamiento»: empieza la sesión con el ejercicio que se ve. */
  | { readonly tipo: 'iniciar'; readonly prescriptionId: string }
  /** «Siguiente ejercicio» o «Pasar a este ejercicio». */
  | { readonly tipo: 'activar-ejercicio'; readonly prescriptionId: string }
  /** «Iniciar descanso»: queda ligado a la serie que lo originó. */
  | { readonly tipo: 'iniciar-descanso'; readonly prescriptionId: string; readonly setIndex: number }
  | { readonly tipo: 'finalizar-descanso' }
  /** «Cronometrar serie». Con un descanso en curso, es la acción compuesta «finalizar descanso e iniciar la serie». */
  | { readonly tipo: 'cronometrar-serie'; readonly prescriptionId: string; readonly setIndex: number }
  | { readonly tipo: 'finalizar-serie' }
  /** «Pausar sesión». Con una medición abierta, la finaliza primero, en la misma acción. */
  | { readonly tipo: 'pausar' }
  | { readonly tipo: 'reanudar' }
  /** Resolver una medición abierta: «Terminó ahora» (declarado) o «Dejarla incompleta». */
  | { readonly tipo: 'resolver-medicion'; readonly resolucion: ResolucionDeMedicion }
  /** Finalizar el entrenamiento: exige que no quede nada abierto. */
  | { readonly tipo: 'finalizar' }
  /** «Dejarlo incompleto»: cierra la corrida sin afirmar cuándo terminó. */
  | { readonly tipo: 'dejar-incompleta' };

/** Un evento sin su identidad ni su instante: lo que define una acción. */
type SinIdentidad<E> = E extends unknown ? Omit<E, 'eventId' | 'runId' | 'sequence' | 'compoundActionId' | 'at'> : never;
export type Paso = SinIdentidad<EventoDeTiempo> & { readonly instante?: 'medido' | 'declarado' };

export type MotivoDeRechazoLocal = MotivoDeEvento | 'EVENTO_INVALIDO' | 'SIN_SESION' | 'SIN_CRONOMETROS';
export type ResultadoDeAccion = { readonly ok: true; readonly corrida: Corrida; readonly eventos: readonly EventoDeTiempo[] } | { readonly ok: false; readonly motivo: MotivoDeRechazoLocal };

const porSecuencia = (a: EventoDeTiempo, b: EventoDeTiempo) => a.sequence - b.sequence;

/** Todos los eventos de la corrida, en orden de secuencia, sin repetir un evento que ya está registrado. */
export function eventosDeLaCorrida(c: Corrida): EventoDeTiempo[] {
  const registrados = new Set(c.registrados.map((e) => e.eventId));
  return [...c.registrados, ...c.pendientes.filter((e) => !registrados.has(e.eventId))].sort(porSecuencia);
}

export const estadoLocal = (c: Corrida): EstadoDeLaCorrida => estadoDeLaCorrida(eventosDeLaCorrida(c));

/** Si la corrida empezó y todavía no se cerró. */
export function corridaAbierta(c: Corrida): boolean {
  const e = estadoLocal(c);
  return e.runId !== null && e.cierre === null;
}

/** Lo que se muestra mientras corre: la sesión sin pausas y la medición abierta, recalculadas desde los instantes. */
export function enVivoDeLaCorrida(c: Corrida, reloj: RelojDeSesion): { readonly sesionSinPausas: DuracionApi; readonly medicionAbierta: DuracionApi | null; readonly pausada: boolean } {
  return enVivo(eventosDeLaCorrida(c), reloj.ahora());
}

/**
 * Los pasos de una acción, según el estado de la corrida, o el motivo por el que no tiene sentido. Lo que la regla del
 * dominio rechaza (un descanso en pausa, dos mediciones abiertas) lo decide después `aplicarEventos`, no esta función.
 */
export function pasosDeLaAccion(accion: AccionDeTiempo, estado: EstadoDeLaCorrida, nuevoId: (prefijo: string) => string): readonly Paso[] | MotivoDeEvento {
  const abierta = estado.medicionAbierta;
  const cerrar = (instante: 'medido' | 'declarado'): Paso | null =>
    !abierta ? null : abierta.kind === 'REST' ? { type: 'REST_FINISHED', restId: abierta.measurementId, instante } : { type: 'SET_TIMING_FINISHED', timingId: abierta.measurementId, instante };
  switch (accion.tipo) {
    case 'iniciar':
      return [{ type: 'SESSION_STARTED' }, { type: 'EXERCISE_ACTIVATED', prescriptionId: accion.prescriptionId }];
    case 'activar-ejercicio':
      return [{ type: 'EXERCISE_ACTIVATED', prescriptionId: accion.prescriptionId }];
    case 'iniciar-descanso':
      return [{ type: 'REST_STARTED', restId: nuevoId('descanso'), prescriptionId: accion.prescriptionId, setIndex: accion.setIndex }];
    case 'finalizar-descanso':
      return abierta?.kind === 'REST' ? [cerrar('medido')!] : 'MEASUREMENT_NOT_OPEN';
    case 'cronometrar-serie': {
      const iniciar: Paso = { type: 'SET_TIMING_STARTED', timingId: nuevoId('serie'), prescriptionId: accion.prescriptionId, setIndex: accion.setIndex };
      // Con un descanso en curso: la acción compuesta «finalizar descanso e iniciar la serie», auditada con su identificador.
      return abierta?.kind === 'REST' ? [cerrar('medido')!, iniciar] : [iniciar];
    }
    case 'finalizar-serie':
      return abierta?.kind === 'SET' ? [cerrar('medido')!] : 'MEASUREMENT_NOT_OPEN';
    case 'pausar':
      // En pausa no se mide nada: lo abierto se finaliza primero, en la misma acción.
      return abierta ? [cerrar('medido')!, { type: 'SESSION_PAUSED' }] : [{ type: 'SESSION_PAUSED' }];
    case 'reanudar':
      return [{ type: 'SESSION_RESUMED' }];
    case 'resolver-medicion':
      if (!abierta) return 'MEASUREMENT_NOT_OPEN';
      // «Terminó ahora» es una declaración de la persona, no una medición: el instante va como DECLARED.
      return accion.resolucion === 'termino-ahora' ? [cerrar('declarado')!] : [{ type: 'MEASUREMENT_LEFT_INCOMPLETE', measurementId: abierta.measurementId }];
    case 'finalizar':
      return [{ type: 'SESSION_FINISHED', resolution: 'FINISHED' }];
    case 'dejar-incompleta':
      // No afirma cuándo terminó: el instante es el de la decisión, y va declarado.
      return [{ type: 'SESSION_FINISHED', resolution: 'LEFT_INCOMPLETE', instante: 'declarado' }];
  }
}

/**
 * Arma los eventos de una acción sobre la corrida y los valida con la regla del dominio antes de encolarlos. Devuelve la
 * corrida con los eventos nuevos como pendientes, o el motivo del rechazo: nada a medias.
 */
export function armarAccion(corrida: Corrida, accion: AccionDeTiempo, contexto: ContextoDeEventos, h: Herramientas): ResultadoDeAccion {
  const previos = eventosDeLaCorrida(corrida);
  const estado = estadoDeLaCorrida(previos);
  const pasos = pasosDeLaAccion(accion, estado, h.nuevoId);
  if (typeof pasos === 'string') return { ok: false, motivo: pasos };
  const runId = pasos[0]?.type === 'SESSION_STARTED' ? h.nuevoId('corrida') : estado.runId;
  if (runId === null) return { ok: false, motivo: 'SESSION_NOT_STARTED' };
  const compoundActionId = pasos.length > 1 ? h.nuevoId('accion') : null;
  const medido = h.reloj.ahora();
  const eventos = pasos.map(({ instante, ...paso }, i) => ({
    ...paso,
    eventId: h.nuevoId('evento'),
    runId,
    sequence: estado.lastSequence + 1 + i,
    compoundActionId,
    at: instante === 'declarado' ? h.reloj.declarado() : medido,
  })) as EventoDeTiempo[];
  if (!eventos.every((e) => EventoDeTiempoSchema.safeParse(e).success)) return { ok: false, motivo: 'EVENTO_INVALIDO' };
  const { resultados } = aplicarEventos(previos, eventos, contexto);
  const rechazo = resultados.find((r) => r.status !== 'RECORDED');
  if (rechazo) return { ok: false, motivo: rechazo.reason ?? 'EVENTO_INVALIDO' };
  return { ok: true, corrida: { registrados: corrida.registrados, pendientes: [...corrida.pendientes, ...eventos] }, eventos };
}

// ─── Sincronización ─────────────────────────────────────────────────────────────────────────────

/** El próximo lote para API-TIE-01: los primeros pendientes en orden de secuencia, hasta 30. */
export function loteSiguiente(c: Corrida, tamano = EVENTOS_POR_PEDIDO): EventoDeTiempo[] {
  const registrados = new Set(c.registrados.map((e) => e.eventId));
  return c.pendientes
    .filter((e) => !registrados.has(e.eventId))
    .sort(porSecuencia)
    .slice(0, tamano);
}

/** Todos los pendientes partidos en lotes de hasta 30, en orden. */
export function lotesDeEventos(pendientes: readonly EventoDeTiempo[], tamano = EVENTOS_POR_PEDIDO): EventoDeTiempo[][] {
  const ordenados = [...pendientes].sort(porSecuencia);
  const lotes: EventoDeTiempo[][] = [];
  for (let i = 0; i < ordenados.length; i += tamano) lotes.push(ordenados.slice(i, i + tamano));
  return lotes;
}

/**
 * La corrida después de la respuesta de API-TIE-01 a un lote:
 * - `RECORDED` y `DUPLICATE` salen de pendientes: la API ya los tiene;
 * - el primer `CONFLICT` o `REJECTED` es el `rechazo`, y queda en pendientes con los que dependen de él
 *   (`PREVIOUS_EVENT_NOT_RECORDED`). La pantalla lo muestra: nada se descarta en silencio;
 * - si la API devolvió sus eventos, esos son los registrados.
 * Se aplica sobre la corrida vigente, con los eventos que la persona haya sumado mientras viajaba el pedido.
 */
export function aplicarResultadosDelLote(c: Corrida, lote: readonly EventoDeTiempo[], resultados: readonly ResultadoDeEvento[], delServidor?: readonly EventoDeTiempo[]): { readonly corrida: Corrida; readonly rechazo: ResultadoDeEvento | null } {
  const porId = new Map(resultados.map((r) => [r.eventId, r] as const));
  const aceptados = new Set<string>();
  let rechazo: ResultadoDeEvento | null = null;
  for (const ev of lote) {
    const r = porId.get(ev.eventId);
    if (!r) continue;
    // El primero que no se registró es el que explica el resto: los siguientes dicen PREVIOUS_EVENT_NOT_RECORDED.
    if (r.status === 'RECORDED' || r.status === 'DUPLICATE') aceptados.add(ev.eventId);
    else rechazo ??= r;
  }
  const registrados = delServidor ? [...delServidor].sort(porSecuencia) : [...c.registrados, ...lote.filter((e) => aceptados.has(e.eventId))].sort(porSecuencia);
  return { corrida: { registrados, pendientes: c.pendientes.filter((e) => !aceptados.has(e.eventId)) }, rechazo };
}
