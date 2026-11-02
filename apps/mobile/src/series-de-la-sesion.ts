/**
 * La tabla de series de la sesión enfocada (WP-ENTRENAMIENTO-SERIES §7.3; DL-122): lo planificado de cada serie y lo que
 * escribe la persona, siempre separados.
 *
 * - **Placeholders** (`placeholdersDeLaSerie`): el objetivo de ESA serie, en gris, o «Sin objetivo». Son presentación:
 *   nunca entran a lo que se guarda. `leerFila` solo lee lo escrito.
 * - **Lo escrito** se lee con `leerNumero` (coma o punto). El cero es un valor: 0 kg y RIR 0 se guardan como 0. Vacío
 *   es `null`: no informado. El RIR admite decimales, de 0 a 20; las repeticiones, enteros.
 * - **Leer lo escrito** (`leerFila`) pide carga o repeticiones escritas (`puedeRegistrar`): el dominio exige una de
 *   las dos para confirmar (`SET_WITHOUT_DATA`), y no se ofrece «Realizada sin detalle». Nunca se fabrica una serie.
 * - **La casilla de la fila** (PA-02, 2026-11-02; DL-161) registra con `serieAlTildar`: lo escrito y, en lo vacío, lo
 *   planificado que se veía en gris, con `recordedAs` (`TYPED` o `AS_PLANNED`) y el tiempo en `durationSeconds`. Un rango
 *   de repeticiones no se convierte en un número. Destildar deja la fila para sacarla del borrador (`FilaQuitada`).
 * - **Lo escrito** de cada fila se guarda en el teléfono con su unidad (PA-01): `EscritasDeLaSesion`.
 * - **API-TRN-17 reemplaza `exercises` entero** (`ejerciciosParaGuardar`): se parte de lo que el servidor ya tiene y se
 *   suman las series pendientes del teléfono. Una serie que el servidor ya tiene con ese número no se pisa: queda en
 *   conflicto.
 *
 * Es lógica pura, sin React.
 */
import {
  COPY_ENTRENAMIENTO,
  COPY_ENTRENAMIENTO_POR_SERIE,
  duracionParaMostrar,
  ETIQUETA_DE_BASE_DE_CARGA,
  ETIQUETA_DE_BASE_DE_REPETICIONES,
  hayDatosRealizados,
  leerNumero,
  motivoDeNumeroIlegible,
  numero,
  objetivosEfectivos,
  textoDelPlanDeLaSerie,
  textoDeSegundos,
  type BorradorDeEjecucion,
  type EjercicioRegistradoEntrada,
  type ObjetivoDeSerie,
  type PrescripcionConObjetivos,
  type SerieEjecutadaApi,
  type SesionConObjetivos,
  type SesionDeOcurrencia,
} from '@be/domain';
import { TEXTOS_DE_LA_SESION } from './textos-de-la-sesion';

export type Unidad = 'kg' | 'lb';

/** Lo que la persona escribió en una fila, tal cual. */
export interface FilaEscrita {
  readonly carga: string;
  readonly repeticiones: string;
  readonly rir: string;
  /**
   * El tiempo de la serie (DL-161), escrito o medido con el reloj de la fila: «1:30» o «45». Opcional: ausente es vacío.
   * No es un valor del plan, así que no cuenta para decir si la serie se escribió o se tildó con lo planificado.
   */
  readonly tiempo?: string;
}

export const FILA_VACIA: FilaEscrita = { carga: '', repeticiones: '', rir: '' };

/**
 * Lo escrito en una fila, como se guarda en el teléfono (PA-01): con la unidad de la carga, para que una carga escrita en
 * lb no se registre como kg después de reabrir la app.
 */
export interface FilaEscritaGuardada extends FilaEscrita {
  readonly unidad: Unidad;
}

/** Lo escrito de toda la sesión, por fila: la clave es `claveDeFila`. */
export type EscritasDeLaSesion = Readonly<Record<string, FilaEscritaGuardada>>;

/** La clave de una fila: «prescripción:serie». */
export const claveDeFila = (prescriptionId: string, setIndex: number): string => `${prescriptionId}:${setIndex}`;

/** Lo escrito en las filas de un ejercicio, por número de serie. */
export function escritasDelEjercicio(escritas: EscritasDeLaSesion, prescriptionId: string): ReadonlyMap<number, FilaEscritaGuardada> {
  const propias = new Map<number, FilaEscritaGuardada>();
  const prefijo = `${prescriptionId}:`;
  for (const [clave, fila] of Object.entries(escritas)) {
    if (!clave.startsWith(prefijo)) continue;
    const setIndex = Number(clave.slice(prefijo.length));
    if (Number.isInteger(setIndex) && setIndex > 0) propias.set(setIndex, fila);
  }
  return propias;
}

/** Lo escrito de un ejercicio con la unidad nueva: al cambiar de kg a lb, lo escrito pasa a leerse en lb. */
export function escritasConUnidad(escritas: EscritasDeLaSesion, prescriptionId: string, unidad: Unidad): EscritasDeLaSesion {
  const prefijo = `${prescriptionId}:`;
  return Object.fromEntries(Object.entries(escritas).map(([clave, f]) => [clave, clave.startsWith(prefijo) ? { ...f, unidad } : f]));
}

/**
 * Una serie que la persona destildó y que el servidor puede tener (PA-02): la próxima API-TRN-17 la saca del borrador.
 * Mientras no se confirma la sesión, destildar deshace.
 */
export interface FilaQuitada {
  readonly prescriptionId: string;
  readonly setIndex: number;
}

export const esQuitada = (quitadas: readonly FilaQuitada[], prescriptionId: string, setIndex: number): boolean => quitadas.some((q) => q.prescriptionId === prescriptionId && q.setIndex === setIndex);

/** Una serie registrada en el teléfono que todavía no está en el borrador de la API, o que quedó en conflicto. */
export interface SerieLocal {
  readonly prescriptionId: string;
  readonly performedExerciseVersionId: string;
  readonly serie: SerieEjecutadaApi;
  /** El servidor ya tiene una serie con ese número: no se manda hasta que la persona decida. */
  readonly enConflicto: boolean;
}

/** Dónde está una serie registrada que todavía no se envió: en el teléfono, guardándose, o solo en la app. */
export type ProteccionDeSerie = 'en-el-telefono' | 'guardando' | 'solo-en-la-app';

/** El máximo de series de un ejercicio que admite el contrato (`SerieEjecutadaSchema.setIndex`). */
export const MAXIMO_DE_SERIES = 50;

// ─── Lo planificado ─────────────────────────────────────────────────────────────────────────────

export interface Placeholders {
  readonly carga: string;
  readonly repeticiones: string;
  readonly rir: string;
}

/**
 * Lo que muestran en gris los campos vacíos de una serie: el objetivo de esa serie, o «Sin objetivo». La carga lleva la
 * unidad solo si no es la de la columna: «16» en una columna en kg, «35 lb» si el objetivo está en libras.
 */
export function placeholdersDeLaSerie(objetivo: ObjetivoDeSerie | null, unidadDeLaColumna: Unidad): Placeholders {
  const sin = COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo;
  const carga = objetivo?.suggestedLoad ?? null;
  const reps = objetivo?.repetitions ?? null;
  const rir = objetivo?.rir ?? null;
  return {
    carga: carga === null ? sin : carga.unit === unidadDeLaColumna ? numero(carga.value) : `${numero(carga.value)} ${carga.unit}`,
    repeticiones: reps === null ? sin : 'value' in reps ? numero(reps.value, 0) : `${numero(reps.min, 0)}–${numero(reps.max, 0)}`,
    // El cero es un objetivo: «RIR 0» se muestra, no se confunde con «Sin objetivo».
    rir: rir === null ? sin : numero(rir),
  };
}

/** La banda «Plan de la serie N»: el objetivo completo, que sigue a la vista aunque se escriba encima del placeholder. */
export function bandaDeLaSerie(setIndex: number, objetivo: ObjetivoDeSerie | null): { readonly titulo: string; readonly plan: string; readonly descanso: string | null; readonly completa: string } {
  const titulo = COPY_ENTRENAMIENTO_POR_SERIE.planDeLaSerie(setIndex);
  const plan = objetivo ? textoDelPlanDeLaSerie(objetivo) : COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo;
  const segundos = objetivo?.restSeconds ?? null;
  const descanso = segundos === null ? null : `${COPY_ENTRENAMIENTO_POR_SERIE.descansoRecomendado} ${textoDeSegundos(segundos)}`;
  return { titulo, plan, descanso, completa: [`${titulo}: ${plan}`, descanso].filter((p): p is string => p !== null).join(' · ') };
}

/** La base declarada de la carga y de las repeticiones, para la cabecera de la tabla. `null` si no se declaró: no se supone. */
export function basesDeLaPrescripcion(p: Pick<PrescripcionConObjetivos, 'loadBasis' | 'repetitionBasis'>): { readonly carga: string | null; readonly repeticiones: string | null } {
  return {
    carga: p.loadBasis ? ETIQUETA_DE_BASE_DE_CARGA[p.loadBasis] : null,
    repeticiones: p.repetitionBasis ? ETIQUETA_DE_BASE_DE_REPETICIONES[p.repetitionBasis] : null,
  };
}

/** «3 ejercicios · 9 series». */
export function ejerciciosYSeries(prescripciones: readonly { readonly sets: readonly unknown[] }[]): string {
  const ejercicios = prescripciones.length;
  const series = prescripciones.reduce((n, p) => n + p.sets.length, 0);
  return `${numero(ejercicios, 0)} ${ejercicios === 1 ? 'ejercicio' : 'ejercicios'} · ${numero(series, 0)} ${series === 1 ? 'serie' : 'series'}`;
}

/** Lo que dice la pantalla mientras usa la sesión de respaldo (`sesionDesdeLaOcurrencia`). */
export const AVISO_SIN_PLAN_POR_SERIE =
  'No pudimos leer el plan de cada serie. Hasta poder leerlo, no mostramos la carga ni el RIR objetivo: podrían no ser los de esa serie. Podés registrar igual.';

/**
 * La sesión armada desde «Hoy» (API-TRN-14) cuando API-SER-02 no se pudo leer (precierre del 2026-10-06, §2).
 *
 * «Hoy» trae la forma de siempre: las repeticiones de cada serie, y la intensidad y la carga **generales** de cada
 * prescripción. Con objetivos por serie, esas generales pueden no ser las de una serie, y desde «Hoy» no se puede saber:
 * por eso no se muestran como objetivo de ninguna serie, ni como dato del ejercicio. Quedan las repeticiones de cada
 * serie, que sí son de esa serie, el ejercicio, sus series y las notas. Sin imágenes ni descanso estructurado. La
 * pantalla lo avisa y deja registrar igual: lo que se registra nunca sale de un objetivo.
 */
export function sesionDesdeLaOcurrencia(s: SesionDeOcurrencia): SesionConObjetivos {
  return {
    sessionId: s.sessionId,
    label: s.label,
    order: s.order,
    instructions: s.instructions,
    prescriptions: s.prescriptions.map((p) => ({
      prescriptionId: p.prescriptionId,
      order: p.order,
      exerciseId: p.exerciseId,
      exerciseVersionId: p.exerciseVersionId,
      exerciseName: p.exerciseName,
      image: null,
      sets: p.sets.map((x) => ({
        setIndex: x.setIndex,
        note: x.note,
        target: { repetitions: x.repetitions, rir: null, suggestedLoad: null, restSeconds: null },
        targetOrigin: { rir: 'NONE', suggestedLoad: 'NONE', restSeconds: 'NONE' },
      })),
      intensity: null,
      suggestedLoad: null,
      restSeconds: null,
      loadBasis: null,
      repetitionBasis: null,
      professionalParameters: p.professionalParameters,
      note: p.note,
    })),
  };
}

// ─── Lo escrito ─────────────────────────────────────────────────────────────────────────────────

/** Si lo escrito alcanza para leer la fila: la carga o las repeticiones. Los placeholders no cuentan: no son texto. */
export const puedeRegistrar = (f: FilaEscrita): boolean => f.carga.trim() !== '' || f.repeticiones.trim() !== '';

/** Si la persona escribió algún valor de la serie (carga, repeticiones o RIR). El tiempo no es un valor del plan. */
export const hayValoresEscritos = (f: FilaEscrita): boolean => f.carga.trim() !== '' || f.repeticiones.trim() !== '' || f.rir.trim() !== '';

/** Si hay algo escrito en la fila, también solo el tiempo: «Antes de finalizar» lo lista para no perderlo. */
export const hayAlgoEscrito = (f: FilaEscrita): boolean => hayValoresEscritos(f) || (f.tiempo ?? '').trim() !== '';

export type ErroresDeFila = Partial<Record<keyof FilaEscrita | 'fila', string>>;
export type LecturaDeFila = { readonly ok: true; readonly serie: SerieEjecutadaApi } | { readonly ok: false; readonly errores: ErroresDeFila };

/** Los límites del contrato de una serie realizada (`SerieEjecutadaSchema`). */
const MAXIMO_DE_REPETICIONES = 1000;
const RIR_MAXIMO = 20;
/** `durationSeconds` llega hasta 36.000 s: 10 horas (DL-161). */
export const MAXIMO_DE_SEGUNDOS = 36000;

/** La carga, las repeticiones y el RIR escritos, leídos y validados como en el contrato. Vacío es `null`; el cero es un valor. */
function leerCampos(f: FilaEscrita): { carga: number | null; repeticiones: number | null; rir: number | null; errores: ErroresDeFila } {
  const errores: ErroresDeFila = {};
  const leer = (texto: string, campo: keyof FilaEscrita): number | null => {
    if (texto.trim() === '') return null;
    const n = leerNumero(texto);
    if (n === null) errores[campo] = motivoDeNumeroIlegible(texto);
    return n;
  };
  const carga = leer(f.carga, 'carga');
  const repeticiones = leer(f.repeticiones, 'repeticiones');
  const rir = leer(f.rir, 'rir');
  if (carga !== null && carga < 0) errores.carga = 'La carga no puede ser negativa.';
  if (repeticiones !== null) {
    if (!Number.isInteger(repeticiones)) errores.repeticiones = 'Las repeticiones van sin decimales.';
    else if (repeticiones < 0) errores.repeticiones = 'Las repeticiones no pueden ser negativas.';
    else if (repeticiones > MAXIMO_DE_REPETICIONES) errores.repeticiones = `Revisá las repeticiones: el máximo es ${numero(MAXIMO_DE_REPETICIONES, 0)}.`;
  }
  if (rir !== null && (rir < 0 || rir > RIR_MAXIMO)) errores.rir = 'El RIR va de 0 a 20.';
  return { carga, repeticiones, rir, errores };
}

/**
 * El tiempo escrito de una serie: «1:30» (minutos y segundos), «1:02:30» (con horas) o «45» (solo segundos). Vacío es
 * `null`: el tiempo es opcional. Nunca se infiere (DL-161).
 */
export function leerTiempo(texto: string): { readonly ok: true; readonly segundos: number | null } | { readonly ok: false; readonly error: string } {
  const t = texto.trim();
  if (t === '') return { ok: true, segundos: null };
  const partes = /^(\d{1,5})(?::(\d{2}))?(?::(\d{2}))?$/.exec(t);
  if (!partes) return { ok: false, error: TEXTOS_DE_LA_SESION.tiempoIlegible };
  // Sin «:», son segundos; con uno, minutos y segundos; con dos, horas, minutos y segundos.
  const [, primero, segundo, tercero] = partes;
  const numeros = [primero, segundo, tercero].filter((x): x is string => x !== undefined).map(Number);
  if (numeros.slice(1).some((n) => n > 59)) return { ok: false, error: TEXTOS_DE_LA_SESION.tiempoIlegible };
  const total = numeros.reduce((suma, n) => suma * 60 + n, 0);
  if (total > MAXIMO_DE_SEGUNDOS) return { ok: false, error: TEXTOS_DE_LA_SESION.tiempoMaximo };
  return { ok: true, segundos: total };
}

/** Los segundos de una serie, como se muestran y se escriben: «01:30», o «1:02:30» con horas. */
export const textoDeTiempo = (segundos: number): string => duracionParaMostrar(segundos * 1000) ?? '';

/** Lo planificado de una serie que se puede registrar tal cual: un rango de repeticiones no es un número, así que no se elige uno. */
export function valoresDelPlan(objetivo: ObjetivoDeSerie | null): { readonly carga: SerieEjecutadaApi['load']; readonly repeticiones: number | null; readonly rir: number | null } {
  const carga = objetivo?.suggestedLoad ?? null;
  const reps = objetivo?.repetitions ?? null;
  const rir = objetivo?.rir ?? null;
  return {
    carga: carga && Number.isFinite(carga.value) && carga.value >= 0 ? { value: carga.value, unit: carga.unit } : null,
    repeticiones: reps && 'value' in reps && Number.isInteger(reps.value) && reps.value >= 0 && reps.value <= MAXIMO_DE_REPETICIONES ? reps.value : null,
    rir: rir !== null && Number.isFinite(rir) && rir >= 0 && rir <= RIR_MAXIMO ? rir : null,
  };
}

/**
 * La serie que registra la casilla de la fila (PA-02; DL-161): lo escrito y, en cada campo vacío, lo planificado que se
 * veía en gris. `recordedAs` dice cómo se cargó: `TYPED` si se escribió la carga, las repeticiones o el RIR;
 * `AS_PLANNED` si se tildó sin escribir ninguno. El tiempo, escrito o medido, va en `durationSeconds` y no cambia eso:
 * no es un valor del plan.
 *
 * Un rango de repeticiones (10–12) no se convierte en un número: queda sin informar. Sin carga ni repeticiones, ni
 * escritas ni planificadas, no hay serie: el dominio exige una de las dos (`SET_WITHOUT_DATA`), y nunca se fabrica.
 */
export function serieAlTildar(f: FilaEscrita, objetivo: ObjetivoDeSerie | null, setIndex: number, unidad: Unidad): LecturaDeFila {
  const { carga, repeticiones, rir, errores } = leerCampos(f);
  const tiempo = leerTiempo(f.tiempo ?? '');
  if (!tiempo.ok) errores.tiempo = tiempo.error;
  if (!tiempo.ok || Object.keys(errores).length > 0) return { ok: false, errores };
  const plan = valoresDelPlan(objetivo);
  const load = carga !== null ? { value: carga, unit: unidad } : plan.carga;
  const completedRepetitions = repeticiones ?? plan.repeticiones;
  if (load === null && completedRepetitions === null) {
    const rango = f.repeticiones.trim() === '' && objetivo?.repetitions && 'min' in objetivo.repetitions ? objetivo.repetitions : null;
    return { ok: false, errores: { fila: rango ? TEXTOS_DE_LA_SESION.repeticionesEnRango(`${numero(rango.min, 0)}–${numero(rango.max, 0)}`) : COPY_ENTRENAMIENTO_POR_SERIE.faltaUnDato } };
  }
  const serie: SerieEjecutadaApi = {
    setIndex,
    load,
    completedRepetitions,
    rir: rir ?? plan.rir,
    perceivedExertion: null,
    recordedAs: hayValoresEscritos(f) ? 'TYPED' : 'AS_PLANNED',
    ...(tiempo.segundos === null ? {} : { durationSeconds: tiempo.segundos }),
  };
  return { ok: true, serie };
}

/**
 * Lo que vuelve a la fila al destildar una serie: lo que se había escrito. Una tildada con lo planificado vuelve vacía,
 * con el plan en gris otra vez; el tiempo vuelve en las dos.
 */
export function escritaDeLaSerie(serie: SerieEjecutadaApi, unidadDeLaColumna: Unidad): FilaEscritaGuardada {
  const tiempo = serie.durationSeconds === null || serie.durationSeconds === undefined ? '' : textoDeTiempo(serie.durationSeconds);
  if (serie.recordedAs === 'AS_PLANNED') return { carga: '', repeticiones: '', rir: '', tiempo, unidad: unidadDeLaColumna };
  return {
    carga: serie.load ? numero(serie.load.value) : '',
    repeticiones: serie.completedRepetitions === null ? '' : String(serie.completedRepetitions),
    rir: serie.rir === null ? '' : numero(serie.rir),
    tiempo,
    unidad: serie.load?.unit ?? unidadDeLaColumna,
  };
}

/**
 * La serie que se registra con lo escrito en la fila, y solo con eso. Vacío es `null`; el cero es un valor. Los errores
 * van por campo, para mostrarlos al lado del campo y en su nombre accesible.
 */
export function leerFila(f: FilaEscrita, setIndex: number, unidad: Unidad): LecturaDeFila {
  if (!puedeRegistrar(f)) return { ok: false, errores: { fila: COPY_ENTRENAMIENTO_POR_SERIE.faltaUnDato } };
  const { carga, repeticiones, rir, errores } = leerCampos(f);
  if (Object.keys(errores).length > 0) return { ok: false, errores };
  const serie: SerieEjecutadaApi = {
    setIndex,
    load: carga === null ? null : { value: carga, unit: unidad },
    completedRepetitions: repeticiones,
    rir,
    perceivedExertion: null,
  };
  // Una fila sin ningún dato realizado no es una serie: nunca se fabrica.
  if (!hayDatosRealizados({ carga: serie.load, repeticiones: serie.completedRepetitions, rir: serie.rir })) return { ok: false, errores: { fila: COPY_ENTRENAMIENTO_POR_SERIE.faltaUnDato } };
  return { ok: true, serie };
}

// ─── Las filas de un ejercicio ──────────────────────────────────────────────────────────────────

export type EstadoDeFila = 'guardada' | 'pendiente-de-enviar' | 'en-conflicto' | 'sin-registrar';

export interface FilaDeLaTabla {
  readonly setIndex: number;
  /** El objetivo efectivo de esa serie; `null` en una serie de más, que no estaba planificada. */
  readonly objetivo: ObjetivoDeSerie | null;
  readonly nota: string | null;
  readonly planificada: boolean;
  readonly estado: EstadoDeFila;
  /**
   * Una serie pendiente de enviar: si ya está guardada en el teléfono, si se está guardando o si está solo en la app
   * (la escritura falló o no se pudo leer lo guardado). `null` en las demás.
   */
  readonly proteccion: ProteccionDeSerie | null;
  /** Lo registrado (en el servidor o en el teléfono), o `null`. */
  readonly registrada: SerieEjecutadaApi | null;
}

/** Las series de un ejercicio que ya están en el borrador del servidor. */
export function guardadasDe(borrador: Pick<BorradorDeEjecucion, 'exercises'> | null, prescriptionId: string): readonly SerieEjecutadaApi[] {
  return borrador?.exercises.find((e) => e.prescriptionId === prescriptionId)?.sets ?? [];
}

/** Las del servidor que siguen valiendo: sin las que la persona destildó y todavía no salieron del borrador. */
export function guardadasVigentes(borrador: Pick<BorradorDeEjecucion, 'exercises'> | null, prescriptionId: string, quitadas: readonly FilaQuitada[]): readonly SerieEjecutadaApi[] {
  const guardadas = guardadasDe(borrador, prescriptionId);
  return quitadas.length === 0 ? guardadas : guardadas.filter((s) => !esQuitada(quitadas, prescriptionId, s.setIndex));
}

/**
 * Las filas de la tabla de un ejercicio: las series planificadas, más las registradas de más, las que la persona sumó
 * (`extra`) y las de más que tienen algo escrito (`conEscritas`: así reaparecen al reabrir). Cada una con su estado:
 * guardada en el servidor, pendiente de enviar, en conflicto o sin registrar. Una pendiente dice además dónde está
 * (`proteccion`, del almacén): «guardada en el teléfono» solo si la escritura que la incluye terminó bien.
 */
export function filasDelEjercicio(
  p: Pick<PrescripcionConObjetivos, 'prescriptionId' | 'sets'>,
  guardadas: readonly SerieEjecutadaApi[],
  locales: readonly SerieLocal[],
  extra = 0,
  proteccion: (l: SerieLocal) => ProteccionDeSerie = () => 'guardando',
  conEscritas: Iterable<number> = [],
): FilaDeLaTabla[] {
  const propias = locales.filter((l) => l.prescriptionId === p.prescriptionId);
  const filas = new Map<number, FilaDeLaTabla>();
  for (const s of p.sets) filas.set(s.setIndex, { setIndex: s.setIndex, objetivo: s.target, nota: s.note, planificada: true, estado: 'sin-registrar', proteccion: null, registrada: null });
  const sinPlan = (setIndex: number): FilaDeLaTabla => ({ setIndex, objetivo: null, nota: null, planificada: false, estado: 'sin-registrar', proteccion: null, registrada: null });
  for (const g of guardadas) filas.set(g.setIndex, { ...(filas.get(g.setIndex) ?? sinPlan(g.setIndex)), estado: 'guardada', proteccion: null, registrada: g });
  for (const l of propias) {
    const previa = filas.get(l.serie.setIndex) ?? sinPlan(l.serie.setIndex);
    // Lo que ya guardó el servidor manda; la del teléfono con el mismo número queda en conflicto.
    if (previa.estado === 'guardada') filas.set(l.serie.setIndex, previa);
    else filas.set(l.serie.setIndex, { ...previa, estado: l.enConflicto ? 'en-conflicto' : 'pendiente-de-enviar', proteccion: proteccion(l), registrada: l.serie });
  }
  for (const n of conEscritas) if (Number.isInteger(n) && n > 0 && n <= MAXIMO_DE_SERIES && !filas.has(n)) filas.set(n, sinPlan(n));
  const maximo = Math.max(0, ...filas.keys());
  for (let i = 1; i <= extra && maximo + i <= MAXIMO_DE_SERIES; i++) filas.set(maximo + i, sinPlan(maximo + i));
  return [...filas.values()].sort((a, b) => a.setIndex - b.setIndex);
}

/** La primera fila sin registrar después de `despuesDe` (o desde el principio), o `null`. */
export function primeraSinRegistrar(filas: readonly FilaDeLaTabla[], despuesDe = 0): FilaDeLaTabla | null {
  return filas.find((f) => f.estado === 'sin-registrar' && f.setIndex > despuesDe) ?? null;
}

/**
 * La fila que queda enfocada al tildar la serie `tildada` (PA-02): si era la enfocada, la próxima sin registrar del mismo
 * ejercicio (o la primera que quede); si no, la enfocada sigue. Nunca pasa sola al ejercicio siguiente: «Siguiente
 * ejercicio» es explícito (WP-ENTRENAMIENTO-SERIES §7.2).
 */
export function focoTrasTildar(filas: readonly FilaDeLaTabla[], tildada: number, enfocada: number): number {
  if (tildada !== enfocada) return enfocada;
  return (primeraSinRegistrar(filas, tildada) ?? primeraSinRegistrar(filas))?.setIndex ?? enfocada;
}

/**
 * La serie que origina el descanso que se inicia ahora: la última registrada antes de la enfocada, o la enfocada si ya
 * está registrada. Al tildar, el foco pasa a la serie siguiente; el descanso sigue ligado a la que se hizo, no a la que
 * viene (encargo del 2026-10-06, :96).
 */
export function serieQueOriginaElDescanso(filas: readonly FilaDeLaTabla[], enfocada: number): number {
  const activa = filas.find((f) => f.setIndex === enfocada);
  if (activa && activa.estado !== 'sin-registrar') return enfocada;
  const previas = filas.filter((f) => f.setIndex < enfocada && f.estado !== 'sin-registrar');
  return previas.length > 0 ? previas[previas.length - 1]!.setIndex : enfocada;
}

/**
 * La fila que queda enfocada al terminar el descanso de la serie `serieDelDescanso`. Si la persona ya enfocó otra fila,
 * se respeta: el descanso sigue ligado a su serie igual. Si la serie del descanso ya tiene registro, se pasa a la próxima
 * sin registrar; si todavía no lo tiene, se queda en ella para registrarla.
 */
export function focoTrasElDescanso(filas: readonly FilaDeLaTabla[], serieDelDescanso: number, focoActual: number): number {
  if (focoActual !== serieDelDescanso) return focoActual;
  const delDescanso = filas.find((f) => f.setIndex === serieDelDescanso);
  if (delDescanso?.estado === 'sin-registrar') return serieDelDescanso;
  return primeraSinRegistrar(filas, serieDelDescanso)?.setIndex ?? focoActual;
}

// ─── API-TRN-17 ─────────────────────────────────────────────────────────────────────────────────

const mismaSerie = (a: SerieLocal, b: SerieLocal) => a.prescriptionId === b.prescriptionId && a.serie.setIndex === b.serie.setIndex;

/**
 * `exercises` entero para API-TRN-17: lo que el borrador del servidor ya tiene, menos lo que la persona destildó, más las
 * series pendientes del teléfono.
 * - `incluidas`: las que viajan en este pedido;
 * - `ocupadas`: las que el servidor ya tiene con ese número, o un ejercicio registrado por resumen. No se pisan.
 * - `quitadasAplicadas`: las destildadas que el servidor tenía y este pedido saca; `quitadasSinEfecto`, las que el
 *   servidor ya no tiene (nunca llegaron): no hace falta mandar nada por ellas.
 * Un ejercicio que se queda sin series por haberlas destildado sale del pedido, salvo que se haya sustituido (DL-151): la
 * sustitución se conserva, y «Antes de finalizar» dice que le falta una serie.
 * Solo viaja lo que la persona registró: un placeholder no es una serie.
 */
export function ejerciciosParaGuardar(
  borrador: Pick<BorradorDeEjecucion, 'exercises'>,
  locales: readonly SerieLocal[],
  quitadas: readonly FilaQuitada[] = [],
): { readonly exercises: EjercicioRegistradoEntrada[]; readonly incluidas: SerieLocal[]; readonly ocupadas: SerieLocal[]; readonly quitadasAplicadas: FilaQuitada[]; readonly quitadasSinEfecto: FilaQuitada[] } {
  const quitadasAplicadas = quitadas.filter((q) => guardadasDe(borrador, q.prescriptionId).some((s) => s.setIndex === q.setIndex));
  const quitadasSinEfecto = quitadas.filter((q) => !quitadasAplicadas.includes(q));
  const exercises: EjercicioRegistradoEntrada[] = borrador.exercises.flatMap((e): EjercicioRegistradoEntrada[] => {
    if (!e.sets) return [{ prescriptionId: e.prescriptionId, performedExerciseVersionId: e.performedExerciseVersionId, executionSummary: e.executionSummary ?? { description: '' } }];
    const sets = e.sets.filter((s) => !esQuitada(quitadasAplicadas, e.prescriptionId, s.setIndex));
    if (sets.length === 0 && e.sets.length > 0 && !e.substituted) return [];
    return [{ prescriptionId: e.prescriptionId, performedExerciseVersionId: e.performedExerciseVersionId, sets }];
  });
  const incluidas: SerieLocal[] = [];
  const ocupadas: SerieLocal[] = [];
  for (const l of locales) {
    if (l.enConflicto || incluidas.some((i) => mismaSerie(i, l))) continue;
    let ejercicio = exercises.find((e) => e.prescriptionId === l.prescriptionId);
    if (!ejercicio) {
      ejercicio = { prescriptionId: l.prescriptionId, performedExerciseVersionId: l.performedExerciseVersionId, sets: [] };
      exercises.push(ejercicio);
    }
    if (!('sets' in ejercicio) || ejercicio.sets.some((s) => s.setIndex === l.serie.setIndex)) {
      ocupadas.push(l);
      continue;
    }
    ejercicio.sets.push(l.serie);
    incluidas.push(l);
  }
  for (const e of exercises) if ('sets' in e) e.sets.sort((a, b) => a.setIndex - b.setIndex);
  return { exercises, incluidas, ocupadas, quitadasAplicadas, quitadasSinEfecto };
}

/**
 * Si dos series registradas dicen lo mismo (para reconocer una pendiente que el servidor ya guardó). También cómo se
 * cargaron y cuánto duraron (DL-161): ausente es `TYPED` y sin tiempo.
 */
export function mismosDatos(a: SerieEjecutadaApi, b: SerieEjecutadaApi): boolean {
  return (
    a.setIndex === b.setIndex &&
    a.completedRepetitions === b.completedRepetitions &&
    a.rir === b.rir &&
    a.perceivedExertion === b.perceivedExertion &&
    (a.load === null ? b.load === null : b.load !== null && a.load.value === b.load.value && a.load.unit === b.load.unit) &&
    (a.recordedAs ?? 'TYPED') === (b.recordedAs ?? 'TYPED') &&
    (a.durationSeconds ?? null) === (b.durationSeconds ?? null)
  );
}

/**
 * Las series del teléfono frente a un borrador recién leído: las que el servidor ya tiene igual salen (llegaron aunque
 * se perdió la respuesta); las que tiene con ese número y otros datos quedan en conflicto, salvo que la persona haya
 * destildado la del servidor (`quitadas`): entonces la del teléfono la reemplaza. Las demás siguen pendientes.
 */
export function conciliarSeries(locales: readonly SerieLocal[], borrador: Pick<BorradorDeEjecucion, 'exercises'>, quitadas: readonly FilaQuitada[] = []): SerieLocal[] {
  return locales.flatMap((l): SerieLocal[] => {
    const delServidor = guardadasDe(borrador, l.prescriptionId).find((s) => s.setIndex === l.serie.setIndex);
    if (!delServidor) return [{ ...l, enConflicto: false }];
    if (esQuitada(quitadas, l.prescriptionId, l.serie.setIndex)) return [{ ...l, enConflicto: false }];
    return mismosDatos(delServidor, l.serie) ? [] : [{ ...l, enConflicto: true }];
  });
}

// ─── El resumen antes de finalizar ──────────────────────────────────────────────────────────────

export interface ResumenDelEjercicio {
  readonly prescriptionId: string;
  /** El ejercicio planificado. */
  readonly nombre: string;
  /** El que se registra en su lugar, si se sustituyó (DL-151); `null` si no. Las dos puntas se muestran. */
  readonly ejecutado: string | null;
  readonly registradas: number;
  readonly planificadas: number;
  /** Las series planificadas que no tienen registro. La ausencia no es «no realizada» (DL-106). */
  readonly sinRegistrar: readonly number[];
  /** Las series sin registrar que tienen algo escrito (PA-01): se nombran para registrarlas o descartarlas. */
  readonly escritas: readonly number[];
}

/**
 * Por ejercicio, «N de M series registradas», las que quedan «Sin registrar», las escritas sin registrar y la
 * sustitución, si la hay. Una serie destildada (`quitadas`) cuenta como sin registrar.
 */
export function resumenDelRegistro(
  sesion: SesionConObjetivos,
  borrador: Pick<BorradorDeEjecucion, 'exercises'> | null,
  locales: readonly SerieLocal[],
  quitadas: readonly FilaQuitada[] = [],
  escritas: EscritasDeLaSesion = {},
): ResumenDelEjercicio[] {
  return sesion.prescriptions.map((p) => {
    const delEjercicio = escritasDelEjercicio(escritas, p.prescriptionId);
    const filas = filasDelEjercicio(p, guardadasVigentes(borrador, p.prescriptionId, quitadas), locales, 0, undefined, delEjercicio.keys());
    const registrado = borrador?.exercises.find((e) => e.prescriptionId === p.prescriptionId);
    return {
      prescriptionId: p.prescriptionId,
      nombre: p.exerciseName,
      ejecutado: registrado?.substituted ? registrado.performedExerciseName : null,
      registradas: filas.filter((f) => f.estado !== 'sin-registrar').length,
      planificadas: p.sets.length,
      sinRegistrar: filas.filter((f) => f.planificada && f.estado === 'sin-registrar').map((f) => f.setIndex),
      escritas: filas.filter((f) => f.estado === 'sin-registrar' && hayAlgoEscrito(delEjercicio.get(f.setIndex) ?? FILA_VACIA)).map((f) => f.setIndex),
    };
  });
}

/** Una serie escrita y sin registrar, con lo que se registraría al tildarla (o por qué no se puede). */
export interface PendienteDeRegistrar {
  readonly prescriptionId: string;
  readonly nombre: string;
  readonly setIndex: number;
  readonly planificada: boolean;
  readonly lectura: LecturaDeFila;
}

/**
 * Lo escrito sin registrar de toda la sesión (PA-01), en el orden de la rutina: lo que «Antes de finalizar» ofrece
 * registrar de una. Cada una se lee como al tildarla (`serieAlTildar`): lo escrito y, en lo vacío, lo planificado.
 */
export function pendientesDeRegistrar(
  sesion: SesionConObjetivos,
  borrador: Pick<BorradorDeEjecucion, 'exercises'> | null,
  locales: readonly SerieLocal[],
  quitadas: readonly FilaQuitada[],
  escritas: EscritasDeLaSesion,
): PendienteDeRegistrar[] {
  return sesion.prescriptions.flatMap((p) => {
    const delEjercicio = escritasDelEjercicio(escritas, p.prescriptionId);
    if (delEjercicio.size === 0) return [];
    const filas = filasDelEjercicio(p, guardadasVigentes(borrador, p.prescriptionId, quitadas), locales, 0, undefined, delEjercicio.keys());
    return filas.flatMap((f): PendienteDeRegistrar[] => {
      const escrita = delEjercicio.get(f.setIndex);
      if (f.estado !== 'sin-registrar' || !escrita || !hayAlgoEscrito(escrita)) return [];
      return [{ prescriptionId: p.prescriptionId, nombre: p.exerciseName, setIndex: f.setIndex, planificada: f.planificada, lectura: serieAlTildar(escrita, f.objetivo, f.setIndex, escrita.unidad) }];
    });
  });
}

/** El primer motivo por el que una serie escrita no se puede registrar, dicho en una frase. */
export function motivoDeLaLectura(lectura: Extract<LecturaDeFila, { readonly ok: false }>): string {
  const e = lectura.errores;
  return e.fila ?? e.carga ?? e.repeticiones ?? e.rir ?? e.tiempo ?? COPY_ENTRENAMIENTO_POR_SERIE.faltaUnDato;
}

/**
 * Lo que impediría confirmar el borrador, dicho antes de cerrar la corrida: así la sesión no queda cerrada sin poder
 * registrarse. Repite, del lado del teléfono, los mínimos de API-TRN-18 (`EXECUTION_DRAFT_NOT_READY`). `null` si está listo.
 */
export function problemaParaConfirmar(b: Pick<BorradorDeEjecucion, 'sessionCondition' | 'exercises' | 'sessionSummary'> | null): string | null {
  if (!b) return 'Todavía no se cargó la sesión.';
  if (!b.sessionCondition) return 'Falta indicar cómo resultó la sesión.';
  if (b.sessionCondition === 'NOT_COMPLETED') return null;
  const series = b.exercises.flatMap((e) => e.sets ?? []);
  const resumenes = b.exercises.filter((e) => e.executionSummary).length + (b.sessionSummary ? 1 : 0);
  if (series.length === 0 && resumenes === 0) return 'Registrá al menos una serie antes de finalizar.';
  if (series.some((s) => s.load === null && s.completedRepetitions === null)) return 'Hay una serie sin carga ni repeticiones.';
  // Un ejercicio por serie sin ninguna serie (SET_REQUIRED). Desde la sesión enfocada solo lo deja una sustitución hecha
  // antes de la primera serie (DL-151): se dice cuál, y cómo se resuelve.
  const vacio = b.exercises.find((e) => e.sets !== null && e.sets.length === 0);
  if (vacio) {
    return vacio.substituted
      ? `Sustituiste «${vacio.prescribedExerciseName}» por «${vacio.performedExerciseName}», pero no registraste ninguna serie de ese ejercicio. Registrá una, o pasá a ese ejercicio y volvé al planificado desde «${COPY_ENTRENAMIENTO.sustituirEjercicio}».`
      : `«${vacio.performedExerciseName}» no tiene series registradas. Registrá una antes de finalizar.`;
  }
  return null;
}

/** La unidad con la que se escribe la carga de un ejercicio: la de su objetivo, si tiene; si no, kg. */
export function unidadDelEjercicio(p: Pick<PrescripcionConObjetivos, 'sets' | 'suggestedLoad'> | null): Unidad {
  return p?.sets.find((s) => s.target.suggestedLoad)?.target.suggestedLoad?.unit ?? p?.suggestedLoad?.unit ?? 'kg';
}

// ─── La disposición ─────────────────────────────────────────────────────────────────────────────

/** La columna del número de serie. */
export const ANCHO_DE_LA_COLUMNA_SERIE = 34;
/** La columna de la casilla: el área de toque mínima de 44 dp (PA-02), que no crece con la letra. */
export const ANCHO_DE_LA_CASILLA = 44;
/** Lo mínimo para que «12–16» o «Sin objetivo» entren en una celda sin cortarse, con la letra normal. */
export const ANCHO_MINIMO_DE_CELDA = 48;
export const SEPARACION_DE_CELDAS = 4;
/** kg, Rep., RIR y Tiempo (PA-02). */
export const CELDAS_POR_FILA = 4;

/**
 * Tabla o tarjetas apiladas. Serie · kg · Rep · RIR · Tiempo y la casilla: con la letra grande, las cuatro celdas no
 * entran sin cortar el objetivo, y cada serie pasa a una tarjeta con sus campos, en el mismo orden y con las mismas
 * acciones. `ancho` es el de la fila, sin los rellenos de la pantalla.
 */
export function disposicionDeLaTabla(ancho: number, escalaDeLetra: number): 'tabla' | 'tarjetas' {
  const escala = Math.max(1, escalaDeLetra);
  if (escala >= 1.6) return 'tarjetas';
  const celda = (ancho - ANCHO_DE_LA_COLUMNA_SERIE * escala - ANCHO_DE_LA_CASILLA - (CELDAS_POR_FILA + 1) * SEPARACION_DE_CELDAS) / CELDAS_POR_FILA;
  return celda >= ANCHO_MINIMO_DE_CELDA * escala ? 'tabla' : 'tarjetas';
}
