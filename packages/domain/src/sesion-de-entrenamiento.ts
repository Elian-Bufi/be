/**
 * La sesión en curso como una secuencia de eventos de tiempo (WP-ENTRENAMIENTO-SERIES; DL-124). La API y la APK usan
 * esta misma lógica:
 * - `aplicarEventos` decide qué se registra. Las reglas:
 *   - una sola corrida por borrador, con un solo ejercicio activo;
 *   - a lo sumo una medición abierta, sea un descanso o una serie cronometrada;
 *   - nada se mide en pausa;
 *   - el orden causal es la secuencia, sin huecos;
 *   - un reintento no suma, y el mismo identificador con otro contenido es un conflicto.
 * - `calcularTiempos` arma los tiempos con su calidad, desde los eventos registrados. La sesión, los ejercicios y lo no
 *   asignado salen de `resumenDeSesion`; cada descanso y cada serie cronometrada, de `duracionDeIntervalo`.
 * - `enVivo` da lo que la APK muestra mientras corre. No se guarda ni se manda: la API no recibe un evento por segundo.
 * Es lógica pura y sin reloj propio: quien llama pasa los instantes.
 */
import type {
  CalculoDeTiempos,
  CalidadDeTiempoApi,
  DuracionApi,
  EventoDeTiempo,
  InstanteDeEventoApi,
  MotivoDeEvento,
  ResultadoDeEvento,
} from './contratos-entrenamiento-por-serie';
import { descansoCalculado, duracionDeIntervalo, resumenDeSesion, TOLERANCIA_ENTRE_RELOJES_MS, type CalidadDeTiempo, type DuracionCalculada, type InstanteDeEvento } from './tiempos-de-entrenamiento';

export const CALIDAD_HACIA_API: Readonly<Record<CalidadDeTiempo, CalidadDeTiempoApi>> = {
  MEDIDO: 'MEASURED',
  ESTIMADO: 'ESTIMATED',
  INCOMPLETO: 'INCOMPLETE',
  SIN_DATO: 'NO_DATA',
  INVALIDO: 'INVALID',
};

/** El instante de un evento, en la forma de `tiempos-de-entrenamiento.ts`. */
export function instanteDelEvento(at: InstanteDeEventoApi): InstanteDeEvento {
  return {
    civilMs: Date.parse(at.civil),
    monotonico: at.monotonic ? { ancla: at.monotonic.anchor, ms: at.monotonic.ms } : null,
    origen: at.source === 'MONOTONIC' ? 'MONOTONICO' : at.source === 'DECLARED' ? 'DECLARADO' : 'RELOJ_CIVIL_RECUPERADO',
  };
}

const duracionApi = (d: DuracionCalculada): DuracionApi => ({ ms: d.ms === null ? null : Math.round(d.ms), quality: CALIDAD_HACIA_API[d.calidad] });

// ─── El estado de la corrida ────────────────────────────────────────────────────────────────────

export interface MedicionAbierta {
  readonly kind: 'REST' | 'SET';
  readonly measurementId: string;
  readonly prescriptionId: string;
  readonly setIndex: number;
  readonly inicio: EventoDeTiempo;
}

export interface EstadoDeLaCorrida {
  readonly runId: string | null;
  readonly lastSequence: number;
  readonly pausada: boolean;
  readonly cierre: null | 'FINISHED' | 'LEFT_INCOMPLETE';
  readonly ejercicioActivo: string | null;
  readonly medicionAbierta: MedicionAbierta | null;
  /** Los identificadores de descanso y de serie cronometrada ya usados: no se reusan. */
  readonly idsDeMedicion: ReadonlySet<string>;
}

export const CORRIDA_SIN_EMPEZAR: EstadoDeLaCorrida = {
  runId: null,
  lastSequence: 0,
  pausada: false,
  cierre: null,
  ejercicioActivo: null,
  medicionAbierta: null,
  idsDeMedicion: new Set(),
};

/** El estado después de un evento ya admitido. No valida: eso es `motivoDeRechazo`. */
export function aplicarAlEstado(estado: EstadoDeLaCorrida, ev: EventoDeTiempo): EstadoDeLaCorrida {
  const base = { ...estado, lastSequence: ev.sequence };
  switch (ev.type) {
    case 'SESSION_STARTED':
      return { ...base, runId: ev.runId };
    case 'SESSION_PAUSED':
      return { ...base, pausada: true };
    case 'SESSION_RESUMED':
      return { ...base, pausada: false };
    case 'SESSION_FINISHED':
      return { ...base, cierre: ev.resolution, pausada: false, medicionAbierta: null };
    case 'EXERCISE_ACTIVATED':
      return { ...base, ejercicioActivo: ev.prescriptionId };
    case 'REST_STARTED':
      return { ...base, medicionAbierta: { kind: 'REST', measurementId: ev.restId, prescriptionId: ev.prescriptionId, setIndex: ev.setIndex, inicio: ev }, idsDeMedicion: new Set([...estado.idsDeMedicion, ev.restId]) };
    case 'SET_TIMING_STARTED':
      return { ...base, medicionAbierta: { kind: 'SET', measurementId: ev.timingId, prescriptionId: ev.prescriptionId, setIndex: ev.setIndex, inicio: ev }, idsDeMedicion: new Set([...estado.idsDeMedicion, ev.timingId]) };
    case 'REST_FINISHED':
    case 'SET_TIMING_FINISHED':
    case 'MEASUREMENT_LEFT_INCOMPLETE':
      return { ...base, medicionAbierta: null };
  }
}

export const estadoDeLaCorrida = (eventos: readonly EventoDeTiempo[]): EstadoDeLaCorrida =>
  [...eventos].sort((a, b) => a.sequence - b.sequence).reduce(aplicarAlEstado, CORRIDA_SIN_EMPEZAR);

export interface ContextoDeEventos {
  /** Las prescripciones de la sesión de esa ocurrencia, según la instantánea del plan. */
  readonly prescripciones: ReadonlySet<string>;
  /** Si el titular tiene otra sesión en curso, en otro borrador sin registrar. */
  readonly otraSesionEnCurso: boolean;
}

/** Por qué un evento no puede seguir a este estado, o `null` si puede. La secuencia y los duplicados se ven antes. */
export function motivoDeRechazo(estado: EstadoDeLaCorrida, ev: EventoDeTiempo, contexto: ContextoDeEventos): MotivoDeEvento | null {
  if (ev.type === 'SESSION_STARTED') {
    if (estado.runId !== null) return 'SESSION_ALREADY_STARTED';
    if (contexto.otraSesionEnCurso) return 'ANOTHER_SESSION_IN_PROGRESS';
    return null;
  }
  if (estado.runId === null) return 'SESSION_NOT_STARTED';
  if (ev.runId !== estado.runId) return 'RUN_MISMATCH';
  if (estado.cierre !== null) return 'SESSION_FINISHED';
  const abierta = estado.medicionAbierta;
  switch (ev.type) {
    case 'SESSION_PAUSED':
      if (estado.pausada) return 'SESSION_PAUSED';
      return abierta ? 'MEASUREMENT_OPEN' : null;
    case 'SESSION_RESUMED':
      return estado.pausada ? null : 'SESSION_NOT_PAUSED';
    case 'SESSION_FINISHED':
      // Dejarla incompleta no exige resolver lo abierto: también queda incompleto. Terminarla, sí.
      return ev.resolution === 'FINISHED' && abierta ? 'MEASUREMENT_OPEN' : null;
    case 'EXERCISE_ACTIVATED':
      if (estado.pausada) return 'SESSION_PAUSED';
      if (!contexto.prescripciones.has(ev.prescriptionId)) return 'PRESCRIPTION_NOT_IN_SESSION';
      return estado.ejercicioActivo === ev.prescriptionId ? 'EXERCISE_ALREADY_ACTIVE' : null;
    case 'REST_STARTED':
    case 'SET_TIMING_STARTED': {
      if (estado.pausada) return 'SESSION_PAUSED';
      if (abierta) return 'MEASUREMENT_OPEN';
      if (!contexto.prescripciones.has(ev.prescriptionId)) return 'PRESCRIPTION_NOT_IN_SESSION';
      return estado.idsDeMedicion.has(ev.type === 'REST_STARTED' ? ev.restId : ev.timingId) ? 'MEASUREMENT_ID_REUSED' : null;
    }
    case 'REST_FINISHED':
      return abierta?.kind === 'REST' && abierta.measurementId === ev.restId ? null : 'MEASUREMENT_NOT_OPEN';
    case 'SET_TIMING_FINISHED':
      return abierta?.kind === 'SET' && abierta.measurementId === ev.timingId ? null : 'MEASUREMENT_NOT_OPEN';
    case 'MEASUREMENT_LEFT_INCOMPLETE':
      return abierta?.measurementId === ev.measurementId ? null : 'MEASUREMENT_NOT_OPEN';
  }
}

/** La forma canónica de un evento: las claves ordenadas, para comparar contenidos sin depender del orden. */
function canonico(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(canonico).join(',')}]`;
  if (valor !== null && typeof valor === 'object') {
    return `{${Object.keys(valor as object)
      .sort()
      .filter((k) => (valor as Record<string, unknown>)[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${canonico((valor as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(valor);
}
export const mismoEvento = (a: EventoDeTiempo, b: EventoDeTiempo): boolean => canonico(a) === canonico(b);

/**
 * Qué pasa con cada evento nuevo frente a los ya registrados. Los nuevos van en el orden en que se mandaron.
 * - **Duplicado:** el mismo identificador con el mismo contenido. No se registra de nuevo y no suma tiempo.
 * - **Conflicto:** el mismo identificador con otro contenido, o una secuencia ya ocupada por otro evento.
 * - **Rechazo:** una transición imposible o un hueco en la secuencia.
 * - Desde el primer evento que no se registra, los siguientes que no sean duplicados se rechazan: dependen de él.
 */
export function aplicarEventos(registrados: readonly EventoDeTiempo[], nuevos: readonly EventoDeTiempo[], contexto: ContextoDeEventos): { resultados: ResultadoDeEvento[]; aRegistrar: EventoDeTiempo[] } {
  const porId = new Map(registrados.map((e) => [e.eventId, e] as const));
  let estado = estadoDeLaCorrida(registrados);
  let detenido = false;
  const resultados: ResultadoDeEvento[] = [];
  const aRegistrar: EventoDeTiempo[] = [];
  const no = (ev: EventoDeTiempo, status: 'CONFLICT' | 'REJECTED', reason: MotivoDeEvento) => {
    resultados.push({ eventId: ev.eventId, status, reason });
    detenido = true;
  };
  for (const ev of nuevos) {
    const previo = porId.get(ev.eventId);
    if (previo) {
      if (mismoEvento(previo, ev)) resultados.push({ eventId: ev.eventId, status: 'DUPLICATE', reason: null });
      else no(ev, 'CONFLICT', 'EVENT_ID_REUSED');
      continue;
    }
    if (detenido) {
      resultados.push({ eventId: ev.eventId, status: 'REJECTED', reason: 'PREVIOUS_EVENT_NOT_RECORDED' });
      continue;
    }
    // La corrida antes que la secuencia: un segundo inicio desde otro dispositivo es eso, no una secuencia repetida.
    if (estado.runId !== null && ev.runId !== estado.runId) {
      no(ev, 'REJECTED', ev.type === 'SESSION_STARTED' ? 'SESSION_ALREADY_STARTED' : 'RUN_MISMATCH');
      continue;
    }
    if (ev.sequence <= estado.lastSequence) {
      no(ev, 'CONFLICT', 'SEQUENCE_REUSED');
      continue;
    }
    if (ev.sequence > estado.lastSequence + 1) {
      no(ev, 'REJECTED', 'SEQUENCE_GAP');
      continue;
    }
    const motivo = motivoDeRechazo(estado, ev, contexto);
    if (motivo) {
      no(ev, 'REJECTED', motivo);
      continue;
    }
    estado = aplicarAlEstado(estado, ev);
    porId.set(ev.eventId, ev);
    aRegistrar.push(ev);
    resultados.push({ eventId: ev.eventId, status: 'RECORDED', reason: null });
  }
  return { resultados, aRegistrar };
}

// ─── Los tiempos ────────────────────────────────────────────────────────────────────────────────

/**
 * La línea de tiempo de la corrida para los totales de la sesión. Es monotónica si todos los eventos se tomaron en
 * el mismo proceso y el reloj civil no se adelantó al monotónico. Si no, es civil y la calidad es `ESTIMADO`.
 * Los valores se redondean al milisegundo antes de sumar: así la suma de los ejercicios y de lo no asignado da
 * exactamente la sesión sin pausas.
 */
function lineaDeTiempo(eventos: readonly EventoDeTiempo[]): { t: (e: EventoDeTiempo) => number; calidad: CalidadDeTiempo } {
  const primero = eventos[0]!;
  const ultimo = eventos[eventos.length - 1]!;
  const ancla = primero.at.monotonic?.anchor;
  const monotonica =
    ancla !== undefined &&
    eventos.every((e) => e.at.source === 'MONOTONIC' && e.at.monotonic?.anchor === ancla) &&
    Date.parse(ultimo.at.civil) - Date.parse(primero.at.civil) - (ultimo.at.monotonic!.ms - primero.at.monotonic!.ms) <= TOLERANCIA_ENTRE_RELOJES_MS;
  return monotonica ? { t: (e) => Math.round(e.at.monotonic!.ms), calidad: 'MEDIDO' } : { t: (e) => Math.round(Date.parse(e.at.civil)), calidad: 'ESTIMADO' };
}

const SIN = (calidad: CalidadDeTiempo): DuracionApi => ({ ms: null, quality: CALIDAD_HACIA_API[calidad] });

/**
 * Los tiempos de una corrida, con su calidad.
 * - **Sin inicio:** no hay nada que afirmar.
 * - **Sin fin, o dejada incompleta:** la sesión, los ejercicios y lo no asignado quedan incompletos. Nunca se cierran a
 *   la hora de reabrir.
 * - **Terminada:** el total, las pausas, «sin pausas», cada ejercicio y lo no asignado, sobre una sola línea de tiempo.
 * - **Descansos y series cronometradas:** cada uno con su propio par de instantes. El descanso trae su recomendado
 *   histórico y la diferencia, sin juicio.
 */
export function calcularTiempos(eventos: readonly EventoDeTiempo[], recomendado: (prescriptionId: string, setIndex: number) => number | null): CalculoDeTiempos {
  const ordenados = [...eventos].sort((a, b) => a.sequence - b.sequence);
  const estado = estadoDeLaCorrida(ordenados);
  const inicio = ordenados.find((e) => e.type === 'SESSION_STARTED') ?? null;
  const fin = ordenados.find((e): e is Extract<EventoDeTiempo, { type: 'SESSION_FINISHED' }> => e.type === 'SESSION_FINISHED') ?? null;
  const cierreDe = (id: string) => ordenados.find((e) => (e.type === 'REST_FINISHED' && e.restId === id) || (e.type === 'SET_TIMING_FINISHED' && e.timingId === id) || (e.type === 'MEASUREMENT_LEFT_INCOMPLETE' && e.measurementId === id));
  const finMedido = (id: string) => {
    const c = cierreDe(id);
    return c && c.type !== 'MEASUREMENT_LEFT_INCOMPLETE' ? c : null;
  };

  const rests = ordenados.flatMap((e) => {
    if (e.type !== 'REST_STARTED') return [];
    const finDelDescanso = finMedido(e.restId);
    const objetivo = recomendado(e.prescriptionId, e.setIndex);
    const d = descansoCalculado(instanteDelEvento(e.at), finDelDescanso ? instanteDelEvento(finDelDescanso.at) : null, objetivo);
    return [
      {
        restId: e.restId,
        prescriptionId: e.prescriptionId,
        setIndex: e.setIndex,
        startedAt: e.at.civil,
        finishedAt: finDelDescanso?.at.civil ?? null,
        duration: duracionApi(d),
        recommendedSeconds: objetivo,
        differenceMs: d.diferenciaMs === null ? null : Math.round(d.diferenciaMs),
      },
    ];
  });
  const timedSets = ordenados.flatMap((e) => {
    if (e.type !== 'SET_TIMING_STARTED') return [];
    const finDeLaSerie = finMedido(e.timingId);
    return [
      {
        timingId: e.timingId,
        prescriptionId: e.prescriptionId,
        setIndex: e.setIndex,
        startedAt: e.at.civil,
        finishedAt: finDeLaSerie?.at.civil ?? null,
        duration: duracionApi(duracionDeIntervalo(instanteDelEvento(e.at), finDeLaSerie ? instanteDelEvento(finDeLaSerie.at) : null)),
      },
    ];
  });

  const activados = [...new Set(ordenados.flatMap((e) => (e.type === 'EXERCISE_ACTIVATED' ? [e.prescriptionId] : [])))];
  let session: CalculoDeTiempos['session'];
  let exercises: CalculoDeTiempos['exercises'];
  let unassigned: DuracionApi;
  if (!inicio) {
    session = { elapsed: SIN('SIN_DATO'), pauses: SIN('SIN_DATO'), withoutPauses: SIN('SIN_DATO') };
    exercises = [];
    unassigned = SIN('SIN_DATO');
  } else if (!fin || fin.resolution === 'LEFT_INCOMPLETE') {
    session = { elapsed: SIN('INCOMPLETO'), pauses: SIN('INCOMPLETO'), withoutPauses: SIN('INCOMPLETO') };
    exercises = activados.map((prescriptionId) => ({ prescriptionId, duration: SIN('INCOMPLETO') }));
    unassigned = SIN('INCOMPLETO');
  } else {
    const corrida = ordenados.filter((e) => e.sequence >= inicio.sequence && e.sequence <= fin.sequence);
    const { t, calidad } = lineaDeTiempo(corrida);
    const invertida = corrida.some((e, i) => i > 0 && t(e) < t(corrida[i - 1]!));
    if (invertida) {
      session = { elapsed: SIN('INVALIDO'), pauses: SIN('INVALIDO'), withoutPauses: SIN('INVALIDO') };
      exercises = activados.map((prescriptionId) => ({ prescriptionId, duration: SIN('INVALIDO') }));
      unassigned = SIN('INVALIDO');
    } else {
      const pausas: { inicio: number; fin: number | null }[] = [];
      const tramos: { ejercicio: string; inicio: number; fin: null }[] = [];
      for (const e of corrida) {
        if (e.type === 'SESSION_PAUSED') pausas.push({ inicio: t(e), fin: null });
        else if (e.type === 'SESSION_RESUMED') {
          const abierta = pausas[pausas.length - 1];
          if (abierta && abierta.fin === null) abierta.fin = t(e);
        } else if (e.type === 'EXERCISE_ACTIVATED') tramos.push({ ejercicio: e.prescriptionId, inicio: t(e), fin: null });
      }
      const r = resumenDeSesion({ inicio: t(inicio), fin: t(fin), pausas, tramos });
      const q = CALIDAD_HACIA_API[calidad];
      session = { elapsed: { ms: r.transcurridoMs, quality: q }, pauses: { ms: r.pausasMs, quality: q }, withoutPauses: { ms: r.sinPausasMs, quality: q } };
      exercises = activados.map((prescriptionId) => ({ prescriptionId, duration: { ms: r.porEjercicioMs[prescriptionId] ?? 0, quality: q } }));
      unassigned = { ms: r.sinEjercicioMs, quality: q };
    }
  }

  const abierta = estado.medicionAbierta;
  return {
    state: estado.cierre ?? (estado.runId === null ? 'NOT_STARTED' : estado.pausada ? 'PAUSED' : 'IN_PROGRESS'),
    runId: estado.runId,
    lastSequence: estado.lastSequence,
    startedAt: inicio?.at.civil ?? null,
    finishedAt: fin && fin.resolution === 'FINISHED' ? fin.at.civil : null,
    activePrescriptionId: estado.cierre === null ? estado.ejercicioActivo : null,
    openMeasurement: abierta ? { kind: abierta.kind, measurementId: abierta.measurementId, prescriptionId: abierta.prescriptionId, setIndex: abierta.setIndex, startedAt: abierta.inicio.at.civil } : null,
    session,
    exercises,
    unassigned,
    rests,
    timedSets,
  };
}

// ─── Mientras corre ─────────────────────────────────────────────────────────────────────────────

/**
 * Lo que la APK muestra mientras corre, con `ahora` como fin provisorio: la sesión sin pausas y la medición abierta.
 * Se recalcula desde los instantes cada vez que se muestra, nunca sumando ticks: si el teléfono bloqueó la pantalla,
 * al volver da lo que corresponde. No es un dato registrado.
 */
export function enVivo(eventos: readonly EventoDeTiempo[], ahora: InstanteDeEventoApi): { readonly sesionSinPausas: DuracionApi; readonly medicionAbierta: DuracionApi | null; readonly pausada: boolean } {
  const ordenados = [...eventos].sort((a, b) => a.sequence - b.sequence);
  const estado = estadoDeLaCorrida(ordenados);
  const inicio = ordenados.find((e) => e.type === 'SESSION_STARTED');
  if (!inicio || estado.cierre !== null) return { sesionSinPausas: SIN(inicio ? 'INCOMPLETO' : 'SIN_DATO'), medicionAbierta: null, pausada: false };
  const provisorio: EventoDeTiempo = { eventId: 'provisorio', runId: inicio.runId, sequence: estado.lastSequence + 1, at: ahora, compoundActionId: null, type: 'SESSION_FINISHED', resolution: 'FINISHED' };
  const calculo = calcularTiempos([...ordenados, provisorio], () => null);
  const abierta = estado.medicionAbierta;
  return {
    sesionSinPausas: calculo.session.withoutPauses,
    medicionAbierta: abierta ? duracionApi(duracionDeIntervalo(instanteDelEvento(abierta.inicio.at), instanteDelEvento(ahora))) : null,
    pausada: estado.pausada,
  };
}
