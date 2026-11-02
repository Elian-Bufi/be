/**
 * La corrección de una sesión registrada (PA-04, decisión de Dirección del 2026-11-02): la lógica, sin React. La pantalla
 * es `pantallas/correccion-de-entrenamiento.tsx`.
 *
 * - **Se arma con lo que rige y con lo planificado** (`estadoInicial`): cada ejercicio es una tarjeta y cada serie una
 *   fila, como en la sesión. Las series registradas vienen escritas; las planificadas que no se registraron aparecen
 *   vacías, con el plan en gris, para cargarlas: así se suma lo que faltó. Un ejercicio planificado que no se registró
 *   aparece entero, con todas sus series en gris.
 * - **Se lee con las reglas del registro** (`leerFila`): los mismos números, los mismos límites y los mismos textos.
 *   Nunca se fabrica una serie: una fila vacía no viaja. Lo gris es presentación y nunca se envía.
 * - **Lo que no se toca queda igual**, con su forma de carga (`recordedAs`), su esfuerzo percibido y su duración
 *   (DL-161). Lo que se escribe o se suma va como `TYPED`: lo escribió la persona. La duración no se inventa: una serie
 *   que se suma va sin ella, y una que se reescribe conserva la que tenía.
 * - **Quitar una serie** la marca, con «Deshacer» hasta registrar la corrección. Las demás conservan su número (la API
 *   admite huecos; solo prohíbe duplicados). El registro original no se toca nunca (REG-06-116).
 * - **El orden** es el de lo que rige y después lo sumado, en el orden de la sesión: la API compara en orden para
 *   decir «la corrección no cambia nada», y sin esto una corrección sin cambios parecería un cambio.
 * - **El motivo** se elige de un toque, o se escribe (B10-06:868-886: «Requiere: motivo, cambio»).
 */
import {
  cantidad,
  COPY_ENTRENAMIENTO,
  numero,
  registroVigente,
  type EjecucionDeEntrenamiento,
  type EjercicioRegistradoEntrada,
  type ObjetivoDeSerie,
  type RegistroDeEjecucion,
  type SerieEjecutadaApi,
  type SesionConObjetivos,
} from '@be/domain';
import { FILA_VACIA, hayAlgoEscrito, leerFila, MAXIMO_DE_SERIES, unidadDelEjercicio, type ErroresDeFila, type FilaEscrita, type Unidad } from './series-de-la-sesion';

export type Condicion = 'COMPLETED' | 'COMPLETED_WITH_DEVIATION' | 'NOT_COMPLETED';

/** De dónde sale una fila: lo registrado que rige, una serie planificada sin registro, o una que suma la persona. */
export type OrigenDeFila = 'registrada' | 'planificada' | 'nueva';

export interface FilaEnCorreccion {
  readonly setIndex: number;
  readonly origen: OrigenDeFila;
  readonly escrita: FilaEscrita;
  readonly unidad: Unidad;
  /** Quitada hasta registrar la corrección; «Deshacer» la devuelve. No viaja. */
  readonly quitada: boolean;
  /** Lo registrado que rige, en una fila `registrada`; `null` en las demás. */
  readonly antes: SerieEjecutadaApi | null;
  /** El objetivo de esa serie, que se muestra en gris; `null` en una serie de más o sin plan por serie. */
  readonly objetivo: ObjetivoDeSerie | null;
}

export interface EjercicioEnCorreccion {
  readonly prescriptionId: string;
  /** El ejercicio planificado. */
  readonly nombre: string;
  /** El que se registró en su lugar, si se sustituyó; `null` si no. */
  readonly ejecutado: string | null;
  readonly performedExerciseVersionId: string;
  /** Si estaba en lo que rige. Uno que no estaba aparece entero en gris, para sumarlo. */
  readonly estaba: boolean;
  readonly filas: readonly FilaEnCorreccion[];
  /** El resumen del ejercicio, en un registro por resumen; `null` en uno por serie. */
  readonly resumen: string | null;
}

/** Los motivos de un toque, y «Otro» para escribirlo. */
export type MotivoDeCorreccion = 'falto-cargar' | 'otro-numero' | 'como-resulto' | 'otro';

export interface EstadoDeCorreccion {
  readonly condicion: Condicion;
  /** El comentario de la sesión (el `reason` del registro). */
  readonly comentario: string;
  /** `SET`: por serie. `EXERCISE_OR_SESSION`: por resumen. Una sesión registrada sin series se corrige por serie. */
  readonly forma: 'SET' | 'EXERCISE_OR_SESSION';
  readonly ejercicios: readonly EjercicioEnCorreccion[];
  readonly resumenDeSesion: string;
  /** Si lo que rige es «No pude realizarla»: entonces se puede contar cómo fue en lugar de cargar las series. */
  readonly sinDatosAntes: boolean;
  readonly motivo: MotivoDeCorreccion | null;
  readonly otroMotivo: string;
}

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────

/** Los textos de la corrección. Ninguno califica: describen lo registrado y lo que cambia. */
export const TEXTOS_DE_LA_CORRECCION = {
  titulo: COPY_ENTRENAMIENTO.corregirRegistro,
  bajada: 'Cambiá lo que haga falta. Lo que registraste antes no se borra.',
  comoResulto: '¿Cómo resultó la sesión?',
  realizada: 'Realizada',
  conDesvio: 'Realizada con desvío',
  comentario: 'Comentario sobre la sesión (opcional)',
  sinSeries: 'Con «No pude realizarla», la corrección queda sin series. Lo que registraste sigue en el registro original.',
  enGris: 'En gris: lo planificado. Escribí encima para sumar lo que hiciste.',
  sinRegistrar: 'Sin registrar',
  conResumen: 'Registrado con un resumen',
  registradas: (n: number, de: number) => `${numero(n, 0)} de ${numero(de, 0)} ${de === 1 ? 'serie registrada' : 'series registradas'}`,
  agregarSerie: 'Agregar una serie',
  quitarSerie: (n: number) => `Quitar la serie ${n}`,
  quitada: (n: number) => `Serie ${n} quitada`,
  deshacer: 'Deshacer',
  nueva: 'Nueva',
  antes: (texto: string) => `Antes: ${texto}`,
  unidad: 'Unidad de la carga',
  resumenDelEjercicio: COPY_ENTRENAMIENTO.resumenDelEjercicio,
  resumenDeLaSesion: COPY_ENTRENAMIENTO.resumenDeLaSesion,
  prefieroContarlo: 'Prefiero contar cómo fue, sin series',
  contaComoFue: 'Contá cómo fue la sesión',
  queCambia: 'Qué cambia',
  sinCambiosTodavia: 'Todavía no cambiaste nada.',
  cambios: (n: number) => (n === 1 ? '1 cambio' : `${numero(n, 0)} cambios`),
  porQue: '¿Por qué corregís?',
  motivos: {
    'falto-cargar': 'Me faltó cargar algo',
    'otro-numero': 'Anoté un número distinto',
    'como-resulto': 'Cambió cómo resultó',
    otro: 'Otro motivo',
  },
  otroMotivo: 'Contá el motivo',
  nota: 'El registro original no se borra: vos y tu profesional siguen viéndolo, con esta corrección al lado.',
  registrar: 'Registrar corrección',
  cancelar: 'Cancelar',
  registrada: 'Corrección registrada. El registro original se conserva.',
  // Los errores: cada uno dice qué hacer.
  faltaElMotivo: 'Contá por qué corregís el registro.',
  sinCambios: 'La corrección no cambia nada del registro.',
  vaciada: (n: number) => `Anotá la carga o las repeticiones de la serie ${n}, o quitala.`,
  sinNingunaSerie: 'Para una sesión realizada, dejá al menos una serie.',
  sinNada: 'Contá cómo fue la sesión.',
  revisaLasSeries: 'Revisá las series marcadas.',
  seriesYResumen: 'Con series, el resumen de la sesión no va: borralo o quitá las series.',
  datoNoAceptado: 'Hay un dato de la corrección que no se puede guardar. Revisalo y volvé a intentar.',
  conflicto: 'Este registro cambió mientras lo corregías: por ejemplo, lo corrigió tu profesional. Mirá la versión nueva antes de seguir.',
  verLaVersionNueva: 'Ver la versión nueva',
  loQueEscribiste: 'la corrección del registro',
} as const;

const T = TEXTOS_DE_LA_CORRECCION;

/** «Realizada», «Realizada con desvío» o «No pude realizarla»: las opciones de la condición. */
export const CONDICIONES: readonly { readonly valor: Condicion; readonly texto: string }[] = [
  { valor: 'COMPLETED', texto: T.realizada },
  { valor: 'COMPLETED_WITH_DEVIATION', texto: T.conDesvio },
  { valor: 'NOT_COMPLETED', texto: COPY_ENTRENAMIENTO.noPudeRealizarla },
];

export const MOTIVOS: readonly MotivoDeCorreccion[] = ['falto-cargar', 'otro-numero', 'como-resulto', 'otro'];

// ─── Lo que rige, como entrada ──────────────────────────────────────────────────────────────────

/** Un registro corregido, con la forma que pide API-TRN-20 (`RegistroDeEjecucionEntradaSchema`). */
export interface RegistroCorregido {
  readonly granularity: 'SET' | 'EXERCISE_OR_SESSION' | null;
  readonly sessionCondition: Condicion;
  readonly reason: string | null;
  readonly exercises: EjercicioRegistradoEntrada[];
  readonly sessionSummary: { readonly description: string } | null;
}

/** Lo que rige, escrito como una corrección: es contra lo que se compara para saber si algo cambió. */
export function registroComoEntrada(r: RegistroDeEjecucion): RegistroCorregido {
  return {
    granularity: r.granularity,
    sessionCondition: r.sessionCondition,
    reason: r.reason,
    exercises: r.exercises.map((e) =>
      e.sets
        ? { prescriptionId: e.prescriptionId, performedExerciseVersionId: e.performedExerciseVersionId, sets: [...e.sets] }
        : { prescriptionId: e.prescriptionId, performedExerciseVersionId: e.performedExerciseVersionId, executionSummary: { description: e.executionSummary?.description ?? '' } },
    ),
    sessionSummary: r.sessionSummary,
  };
}

/** El mismo valor escrito siempre igual (las claves ordenadas): para comparar dos registros sin depender del orden de las claves. */
export function canonico(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(canonico).join(',')}]`;
  if (valor && typeof valor === 'object') {
    return `{${Object.keys(valor)
      .filter((k) => (valor as Record<string, unknown>)[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonico((valor as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(valor);
}

// ─── El estado inicial ──────────────────────────────────────────────────────────────────────────

/**
 * Un número ya guardado, escrito dentro de un campo: solo cambia el punto decimal por la coma. No va `numero`, que es
 * para mostrar y separa los miles con punto: lo que se precarga tiene que volver de `leerNumero` idéntico.
 */
export const paraEditar = (v: number): string => String(v).replace('.', ',');

/** Una serie registrada, escrita en su fila tal como está. */
export function filaDeLaSerie(s: SerieEjecutadaApi): FilaEscrita {
  return {
    carga: s.load ? paraEditar(s.load.value) : '',
    repeticiones: s.completedRepetitions === null ? '' : paraEditar(s.completedRepetitions),
    rir: s.rir === null ? '' : paraEditar(s.rir),
  };
}

const unidadDe = (u: string | undefined, porDefecto: Unidad): Unidad => (u === 'kg' || u === 'lb' ? u : porDefecto);

/**
 * El estado con el que abre la corrección: lo que rige, más lo planificado que no se registró. `sesion` es la de
 * API-SER-02 (con el objetivo de cada serie) o, si no se pudo leer, la de la ocurrencia (`sesionDesdeLaOcurrencia`).
 */
export function estadoInicial(x: Pick<EjecucionDeEntrenamiento, 'original' | 'corrections' | 'effectiveView'>, sesion: SesionConObjetivos): EstadoDeCorreccion {
  const base = registroVigente(x);
  const forma = base.granularity === 'EXERCISE_OR_SESSION' ? 'EXERCISE_OR_SESSION' : 'SET';
  const prescripcion = (id: string) => sesion.prescriptions.find((p) => p.prescriptionId === id) ?? null;
  const ejercicios: EjercicioEnCorreccion[] = [];
  for (const e of base.exercises) {
    const p = prescripcion(e.prescriptionId);
    const porDefecto = unidadDelEjercicio(p);
    const filas: FilaEnCorreccion[] = [];
    if (forma === 'SET') {
      for (const s of e.sets ?? []) {
        filas.push({ setIndex: s.setIndex, origen: 'registrada', escrita: filaDeLaSerie(s), unidad: unidadDe(s.load?.unit, porDefecto), quitada: false, antes: s, objetivo: p?.sets.find((x) => x.setIndex === s.setIndex)?.target ?? null });
      }
      for (const ps of p?.sets ?? []) {
        if (filas.some((f) => f.setIndex === ps.setIndex)) continue;
        filas.push({ setIndex: ps.setIndex, origen: 'planificada', escrita: FILA_VACIA, unidad: porDefecto, quitada: false, antes: null, objetivo: ps.target });
      }
      filas.sort((a, b) => a.setIndex - b.setIndex);
    }
    ejercicios.push({
      prescriptionId: e.prescriptionId,
      nombre: e.prescribedExerciseName,
      ejecutado: e.substituted ? e.performedExerciseName : null,
      performedExerciseVersionId: e.performedExerciseVersionId,
      estaba: true,
      filas,
      resumen: forma === 'EXERCISE_OR_SESSION' ? (e.executionSummary?.description ?? '') : null,
    });
  }
  // Lo planificado que no se registró, en el orden de la sesión, después de lo que rige.
  for (const p of sesion.prescriptions) {
    if (ejercicios.some((e) => e.prescriptionId === p.prescriptionId)) continue;
    const unidad = unidadDelEjercicio(p);
    ejercicios.push({
      prescriptionId: p.prescriptionId,
      nombre: p.exerciseName,
      ejecutado: null,
      performedExerciseVersionId: p.exerciseVersionId,
      estaba: false,
      filas: forma === 'SET' ? p.sets.map((s) => ({ setIndex: s.setIndex, origen: 'planificada' as const, escrita: FILA_VACIA, unidad, quitada: false, antes: null, objetivo: s.target })) : [],
      resumen: forma === 'EXERCISE_OR_SESSION' ? '' : null,
    });
  }
  return {
    condicion: base.sessionCondition,
    comentario: base.reason ?? '',
    forma,
    ejercicios,
    resumenDeSesion: base.sessionSummary?.description ?? '',
    sinDatosAntes: base.sessionCondition === 'NOT_COMPLETED',
    motivo: null,
    otroMotivo: '',
  };
}

// ─── Los cambios que hace la persona ────────────────────────────────────────────────────────────

export type AccionDeCorreccion =
  | { readonly tipo: 'condicion'; readonly condicion: Condicion }
  | { readonly tipo: 'comentario'; readonly texto: string }
  | { readonly tipo: 'escribir'; readonly prescriptionId: string; readonly setIndex: number; readonly campo: keyof FilaEscrita; readonly texto: string }
  | { readonly tipo: 'unidad'; readonly prescriptionId: string; readonly unidad: Unidad }
  | { readonly tipo: 'quitar' | 'deshacer'; readonly prescriptionId: string; readonly setIndex: number }
  | { readonly tipo: 'agregar'; readonly prescriptionId: string }
  | { readonly tipo: 'resumen'; readonly prescriptionId: string; readonly texto: string }
  | { readonly tipo: 'resumen-de-sesion'; readonly texto: string }
  | { readonly tipo: 'motivo'; readonly motivo: MotivoDeCorreccion }
  | { readonly tipo: 'otro-motivo'; readonly texto: string };

function cambiarEjercicio(e: EstadoDeCorreccion, prescriptionId: string, cambio: (ej: EjercicioEnCorreccion) => EjercicioEnCorreccion): EstadoDeCorreccion {
  return { ...e, ejercicios: e.ejercicios.map((ej) => (ej.prescriptionId === prescriptionId ? cambio(ej) : ej)) };
}

function cambiarFila(e: EstadoDeCorreccion, prescriptionId: string, setIndex: number, cambio: (f: FilaEnCorreccion) => FilaEnCorreccion): EstadoDeCorreccion {
  return cambiarEjercicio(e, prescriptionId, (ej) => ({ ...ej, filas: ej.filas.map((f) => (f.setIndex === setIndex ? cambio(f) : f)) }));
}

/** El estado después de un cambio. Puro: la pantalla lo usa con `useReducer`. */
export function corregir(e: EstadoDeCorreccion, a: AccionDeCorreccion): EstadoDeCorreccion {
  switch (a.tipo) {
    case 'condicion':
      return { ...e, condicion: a.condicion };
    case 'comentario':
      return { ...e, comentario: a.texto };
    case 'escribir':
      return cambiarFila(e, a.prescriptionId, a.setIndex, (f) => ({ ...f, escrita: { ...f.escrita, [a.campo]: a.texto } }));
    case 'unidad':
      // La unidad es del ejercicio: pasa a todas sus filas, también a las registradas (una carga anotada en otra unidad).
      return cambiarEjercicio(e, a.prescriptionId, (ej) => ({ ...ej, filas: ej.filas.map((f) => ({ ...f, unidad: a.unidad })) }));
    case 'quitar':
      return cambiarFila(e, a.prescriptionId, a.setIndex, (f) => ({ ...f, quitada: true }));
    case 'deshacer':
      return cambiarFila(e, a.prescriptionId, a.setIndex, (f) => ({ ...f, quitada: false }));
    case 'agregar':
      return cambiarEjercicio(e, a.prescriptionId, (ej) => {
        const siguiente = Math.max(0, ...ej.filas.map((f) => f.setIndex)) + 1;
        if (siguiente > MAXIMO_DE_SERIES) return ej;
        const unidad = unidadDelEjercicioEnCorreccion(ej) ?? ej.filas[0]?.unidad ?? 'kg';
        return { ...ej, filas: [...ej.filas, { setIndex: siguiente, origen: 'nueva', escrita: FILA_VACIA, unidad, quitada: false, antes: null, objetivo: null }] };
      });
    case 'resumen':
      return cambiarEjercicio(e, a.prescriptionId, (ej) => ({ ...ej, resumen: a.texto }));
    case 'resumen-de-sesion':
      return { ...e, resumenDeSesion: a.texto };
    case 'motivo':
      return { ...e, motivo: a.motivo };
    case 'otro-motivo':
      return { ...e, otroMotivo: a.texto };
  }
}

/** La unidad de las filas de un ejercicio, o `null` si hay filas en kg y en lb a la vez. */
export function unidadDelEjercicioEnCorreccion(ej: Pick<EjercicioEnCorreccion, 'filas'>): Unidad | null {
  const unidades = new Set(ej.filas.map((f) => f.unidad));
  return unidades.size === 1 ? ([...unidades][0] as Unidad) : unidades.size === 0 ? 'kg' : null;
}

/** Si se puede sumar otra serie a este ejercicio (el contrato admite hasta 50). */
export const sePuedeAgregar = (ej: Pick<EjercicioEnCorreccion, 'filas'>): boolean => Math.max(0, ...ej.filas.map((f) => f.setIndex)) < MAXIMO_DE_SERIES;

/** «2 de 3 series registradas» o «Sin registrar», según lo que rige: lo que se escribe todavía no cuenta. */
export function estadoDelEjercicio(ej: EjercicioEnCorreccion): string {
  if (ej.resumen !== null) return ej.estaba ? T.conResumen : T.sinRegistrar;
  const registradas = ej.filas.filter((f) => f.origen === 'registrada').length;
  const planificadas = ej.filas.filter((f) => f.origen !== 'nueva').length;
  return registradas === 0 ? T.sinRegistrar : T.registradas(registradas, Math.max(planificadas, registradas));
}

// ─── El registro corregido ──────────────────────────────────────────────────────────────────────

/** La clave de una fila, para ubicar sus errores. */
export const claveDeFila = (prescriptionId: string, setIndex: number): string => `${prescriptionId}#${setIndex}`;

export type ConstruccionDeLaCorreccion =
  | { readonly ok: true; readonly correction: RegistroCorregido }
  | { readonly ok: false; readonly mensaje: string; readonly errores: ReadonlyMap<string, ErroresDeFila> };

const mismaCarga = (a: SerieEjecutadaApi['load'], b: SerieEjecutadaApi['load']): boolean => (a === null ? b === null : b !== null && a.value === b.value && a.unit === b.unit);
/** Si lo leído de una fila dice lo mismo que lo registrado: carga con su unidad, repeticiones y RIR. */
const mismosValores = (a: SerieEjecutadaApi, b: SerieEjecutadaApi): boolean => mismaCarga(a.load, b.load) && a.completedRepetitions === b.completedRepetitions && a.rir === b.rir;

/**
 * La serie que se registra con una fila, o sus errores; `null` si la fila no viaja (quitada, o vacía y sin registro).
 * Una registrada que no cambió vuelve tal cual: conserva su forma de carga, su esfuerzo y su duración.
 */
function serieDeLaFila(f: FilaEnCorreccion): { readonly serie: SerieEjecutadaApi | null; readonly errores: ErroresDeFila | null } {
  if (f.quitada) return { serie: null, errores: null };
  if (f.origen !== 'registrada' && !hayAlgoEscrito(f.escrita)) return { serie: null, errores: null };
  const lectura = leerFila(f.escrita, f.setIndex, f.unidad);
  if (!lectura.ok) {
    // Una registrada vaciada no se borra en silencio: se quita, o se le anota un dato.
    const vaciada = f.origen === 'registrada' && !hayAlgoEscrito(f.escrita);
    return { serie: null, errores: vaciada ? { fila: T.vaciada(f.setIndex) } : lectura.errores };
  }
  if (f.antes && mismosValores(lectura.serie, f.antes)) return { serie: f.antes, errores: null };
  const serie: SerieEjecutadaApi = {
    ...lectura.serie,
    perceivedExertion: f.antes?.perceivedExertion ?? null,
    // Escrita por la persona en la corrección (DL-161).
    recordedAs: 'TYPED',
    ...(f.antes?.durationSeconds !== undefined ? { durationSeconds: f.antes.durationSeconds } : {}),
  };
  return { serie, errores: null };
}

/** El registro corregido que describe el estado, o lo que falta para poder registrarlo. No mira el motivo. */
export function construirCorreccion(e: EstadoDeCorreccion): ConstruccionDeLaCorreccion {
  const reason = e.comentario.trim() || null;
  if (e.condicion === 'NOT_COMPLETED') return { ok: true, correction: { granularity: null, sessionCondition: e.condicion, reason, exercises: [], sessionSummary: null } };
  const errores = new Map<string, ErroresDeFila>();
  if (e.forma === 'EXERCISE_OR_SESSION') {
    const exercises: EjercicioRegistradoEntrada[] = e.ejercicios
      .filter((ej) => (ej.resumen ?? '').trim() !== '')
      .map((ej) => ({ prescriptionId: ej.prescriptionId, performedExerciseVersionId: ej.performedExerciseVersionId, executionSummary: { description: (ej.resumen ?? '').trim() } }));
    const sessionSummary = e.resumenDeSesion.trim() ? { description: e.resumenDeSesion.trim() } : null;
    if (exercises.length === 0 && !sessionSummary) return { ok: false, mensaje: T.sinNada, errores };
    return { ok: true, correction: { granularity: 'EXERCISE_OR_SESSION', sessionCondition: e.condicion, reason, exercises, sessionSummary } };
  }
  const exercises: EjercicioRegistradoEntrada[] = [];
  for (const ej of e.ejercicios) {
    const sets: SerieEjecutadaApi[] = [];
    for (const f of ej.filas) {
      const { serie, errores: deLaFila } = serieDeLaFila(f);
      if (deLaFila) errores.set(claveDeFila(ej.prescriptionId, f.setIndex), deLaFila);
      if (serie) sets.push(serie);
    }
    // Un ejercicio sin ninguna serie no viaja: no hay un ejercicio por serie vacío (SET_REQUIRED).
    if (sets.length > 0) exercises.push({ prescriptionId: ej.prescriptionId, performedExerciseVersionId: ej.performedExerciseVersionId, sets: sets.sort((a, b) => a.setIndex - b.setIndex) });
  }
  if (errores.size > 0) return { ok: false, mensaje: T.revisaLasSeries, errores };
  const resumen = e.sinDatosAntes ? e.resumenDeSesion.trim() : '';
  if (exercises.length > 0 && resumen) return { ok: false, mensaje: T.seriesYResumen, errores };
  // Desde «No pude realizarla» se puede contar cómo fue, sin series: el resumen es de la sesión entera.
  if (exercises.length === 0 && resumen) return { ok: true, correction: { granularity: 'EXERCISE_OR_SESSION', sessionCondition: e.condicion, reason, exercises: [], sessionSummary: { description: resumen } } };
  if (exercises.length === 0) return { ok: false, mensaje: T.sinNingunaSerie, errores };
  return { ok: true, correction: { granularity: 'SET', sessionCondition: e.condicion, reason, exercises, sessionSummary: null } };
}

/** El motivo de la corrección: el del toque, o el escrito con «Otro motivo». `null` si todavía no hay. */
export function motivoDeLaCorreccion(e: Pick<EstadoDeCorreccion, 'motivo' | 'otroMotivo'>): string | null {
  if (e.motivo === null) return null;
  if (e.motivo === 'otro') return e.otroMotivo.trim() || null;
  return T.motivos[e.motivo];
}

export type PedidoDeCorreccion = { readonly ok: true; readonly reason: string; readonly correction: RegistroCorregido } | { readonly ok: false; readonly mensaje: string; readonly errores: ReadonlyMap<string, ErroresDeFila> };

/** El pedido para API-TRN-20: el registro corregido, que cambie algo, y el motivo. */
export function pedidoDeCorreccion(e: EstadoDeCorreccion, base: RegistroDeEjecucion): PedidoDeCorreccion {
  const c = construirCorreccion(e);
  if (!c.ok) return c;
  // Corregir exige un cambio: una corrección igual a lo que rige no rectifica nada (B10-06:879-884).
  if (canonico(c.correction) === canonico(registroComoEntrada(base))) return { ok: false, mensaje: T.sinCambios, errores: new Map() };
  const reason = motivoDeLaCorreccion(e);
  if (!reason) return { ok: false, mensaje: T.faltaElMotivo, errores: new Map() };
  return { ok: true, reason, correction: c.correction };
}

// ─── Qué cambia ─────────────────────────────────────────────────────────────────────────────────

/** «58 kg · 8 reps · RIR 2»: una serie en una línea corta. Lo que no se anotó no se nombra. */
export function textoCortoDeSerie(s: Pick<SerieEjecutadaApi, 'load' | 'completedRepetitions' | 'rir'>): string {
  const partes = [s.load ? cantidad(s.load.value, s.load.unit) : null, s.completedRepetitions === null ? null : `${numero(s.completedRepetitions, 0)} ${COPY_ENTRENAMIENTO.reps.toLowerCase()}`, s.rir === null ? null : `RIR ${numero(s.rir)}`];
  return partes.filter((p): p is string => p !== null).join(' · ');
}

/**
 * Lo que cambia entre lo que rige y la corrección, en frases: «Sentadilla · serie 1: 58 kg · 8 reps → 60 kg · 8 reps»,
 * «Press de banca · serie 2: se suma (45 kg · 9 reps)», «Cómo resultó: Realizada → Realizada con desvío». Con esto se
 * cuenta cuántos cambios hay y se muestran antes de registrar.
 */
export function cambiosEntre(antes: RegistroCorregido, despues: RegistroCorregido, nombreDe: (prescriptionId: string) => string): string[] {
  const cambios: string[] = [];
  if (antes.sessionCondition !== despues.sessionCondition) {
    // Con las palabras de las opciones que eligió la persona: «No pude realizarla», no la etiqueta del registro.
    const condicion = (valor: Condicion) => CONDICIONES.find((o) => o.valor === valor)?.texto ?? valor;
    cambios.push(`Cómo resultó: ${condicion(antes.sessionCondition)} → ${condicion(despues.sessionCondition)}`);
  }
  if ((antes.reason ?? '') !== (despues.reason ?? '')) cambios.push(despues.reason ? `Comentario de la sesión: «${despues.reason}»` : 'Se quita el comentario de la sesión');
  const series = (r: RegistroCorregido, id: string) => {
    const e = r.exercises.find((x) => x.prescriptionId === id);
    return e && 'sets' in e ? e.sets : [];
  };
  const resumen = (r: RegistroCorregido, id: string) => {
    const e = r.exercises.find((x) => x.prescriptionId === id);
    return e && 'executionSummary' in e ? e.executionSummary.description : null;
  };
  const ids = [...new Set([...antes.exercises, ...despues.exercises].map((e) => e.prescriptionId))];
  for (const id of ids) {
    const nombre = nombreDe(id);
    const [a, d] = [series(antes, id), series(despues, id)];
    const indices = [...new Set([...a, ...d].map((s) => s.setIndex))].sort((x, y) => x - y);
    for (const i of indices) {
      const [sa, sd] = [a.find((s) => s.setIndex === i), d.find((s) => s.setIndex === i)];
      if (sa && !sd) cambios.push(`${nombre} · serie ${i}: se quita (${textoCortoDeSerie(sa)})`);
      else if (!sa && sd) cambios.push(`${nombre} · serie ${i}: se suma (${textoCortoDeSerie(sd)})`);
      else if (sa && sd && !mismosValores(sa, sd)) cambios.push(`${nombre} · serie ${i}: ${textoCortoDeSerie(sa)} → ${textoCortoDeSerie(sd)}`);
    }
    const [ra, rd] = [resumen(antes, id), resumen(despues, id)];
    if (ra !== rd) cambios.push(ra === null ? `${nombre}: se suma un resumen` : rd === null ? `${nombre}: se quita el resumen` : `${nombre}: cambia el resumen`);
  }
  const [sa, sd] = [antes.sessionSummary?.description ?? null, despues.sessionSummary?.description ?? null];
  if (sa !== sd) cambios.push(sa === null ? 'Se suma un resumen de la sesión' : sd === null ? 'Se quita el resumen de la sesión' : 'Cambia el resumen de la sesión');
  return cambios;
}

/** Los cambios del estado frente a lo que rige; vacío si todavía no se puede armar el registro. */
export function cambiosDelEstado(e: EstadoDeCorreccion, base: RegistroDeEjecucion, nombreDe: (prescriptionId: string) => string): string[] {
  const c = construirCorreccion(e);
  return c.ok ? cambiosEntre(registroComoEntrada(base), c.correction, nombreDe) : [];
}

/** Si hay algo para preguntar antes de salir: un cambio en lo registrado, o un motivo escrito. */
export function hayAlgoSinGuardar(e: EstadoDeCorreccion, inicial: EstadoDeCorreccion): boolean {
  return canonico({ ...e, motivo: null, otroMotivo: '' }) !== canonico({ ...inicial, motivo: null, otroMotivo: '' }) || e.otroMotivo.trim() !== '';
}

/** Si lo que rige cambió entre dos lecturas de la ejecución (otra corrección, por ejemplo la del profesional). */
export function cambioLoQueRige(antes: Pick<EjecucionDeEntrenamiento, 'effectiveView' | 'corrections'>, ahora: Pick<EjecucionDeEntrenamiento, 'effectiveView' | 'corrections'>): boolean {
  return canonico(antes.effectiveView) !== canonico(ahora.effectiveView) || antes.corrections.length !== ahora.corrections.length;
}

// ─── Para dibujar ───────────────────────────────────────────────────────────────────────────────

/** Cómo está una fila frente a lo que rige: igual, cambiada, quitada, sumada (algo escrito en una sin registro) o vacía. */
export type EstadoDeLaFila = 'igual' | 'cambiada' | 'quitada' | 'sumada' | 'vacia';

export function estadoDeLaFila(f: FilaEnCorreccion): EstadoDeLaFila {
  if (f.quitada) return 'quitada';
  if (f.origen !== 'registrada') return hayAlgoEscrito(f.escrita) ? 'sumada' : 'vacia';
  const lectura = leerFila(f.escrita, f.setIndex, f.unidad);
  return lectura.ok && f.antes && mismosValores(lectura.serie, f.antes) ? 'igual' : 'cambiada';
}

/** Los errores de una fila en una frase, con el nombre de cada campo: van debajo de la fila y en su nombre accesible. */
export function textoDeLosErrores(errores: ErroresDeFila | undefined): string | null {
  if (!errores) return null;
  const nombre = { carga: COPY_ENTRENAMIENTO.carga, repeticiones: 'Repeticiones', rir: 'RIR' } as const;
  const partes = [errores.fila ?? null, ...(['carga', 'repeticiones', 'rir'] as const).map((c) => (errores[c] ? `${nombre[c]}: ${errores[c]}` : null))];
  const texto = partes.filter((p): p is string => p !== null).join(' ');
  return texto || null;
}

/** El ancho del botón de quitar al final de cada fila, en dp (con su área de toque, que llega a 48). */
export const ANCHO_DEL_QUITAR = 36;
const COLUMNA_SERIE = 44;
const SEPARACION = 6;
const CELDA_MINIMA = 56;

/**
 * Tabla o tarjetas, como en la sesión: con la letra grande, o si tres celdas no entran junto al número y al botón de
 * quitar, cada serie pasa a una tarjeta con sus tres campos. Las celdas de la corrección llevan solo números.
 */
export function disposicionDeLaCorreccion(ancho: number, escalaDeLetra: number): 'tabla' | 'tarjetas' {
  const escala = Math.max(1, escalaDeLetra);
  if (escala >= 1.6) return 'tarjetas';
  const celda = (ancho - COLUMNA_SERIE * escala - ANCHO_DEL_QUITAR - 4 * SEPARACION) / 3;
  return celda >= CELDA_MINIMA * escala ? 'tabla' : 'tarjetas';
}
