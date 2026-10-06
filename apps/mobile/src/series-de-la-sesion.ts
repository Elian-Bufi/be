/**
 * La tabla de series de la sesión enfocada (WP-ENTRENAMIENTO-SERIES §7.3; DL-122): lo planificado de cada serie y lo que
 * escribe la persona, siempre separados.
 *
 * - **Placeholders** (`placeholdersDeLaSerie`): el objetivo de ESA serie, en gris, o «Sin objetivo». Son presentación:
 *   nunca entran a lo que se guarda. `leerFila` solo lee lo escrito.
 * - **Lo escrito** se lee con `leerNumero` (coma o punto). El cero es un valor: 0 kg y RIR 0 se guardan como 0. Vacío
 *   es `null`: no informado. El RIR admite decimales, de 0 a 20; las repeticiones, enteros.
 * - **«Registrar serie N»** se habilita con carga o repeticiones escritas (`puedeRegistrar`): el dominio exige una de
 *   las dos para confirmar (`SET_WITHOUT_DATA`), y no se ofrece «Realizada sin detalle». Nunca se fabrica una serie.
 * - **API-TRN-17 reemplaza `exercises` entero** (`ejerciciosParaGuardar`): se parte de lo que el servidor ya tiene y se
 *   suman las series pendientes del teléfono. Una serie que el servidor ya tiene con ese número no se pisa: queda en
 *   conflicto.
 *
 * Es lógica pura, sin React.
 */
import {
  COPY_ENTRENAMIENTO_POR_SERIE,
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

export type Unidad = 'kg' | 'lb';

/** Lo que la persona escribió en la fila activa, tal cual. */
export interface FilaEscrita {
  readonly carga: string;
  readonly repeticiones: string;
  readonly rir: string;
}

export const FILA_VACIA: FilaEscrita = { carga: '', repeticiones: '', rir: '' };

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

/** «Registrar serie N» se habilita con la carga o las repeticiones escritas. Los placeholders no cuentan: no son texto. */
export const puedeRegistrar = (f: FilaEscrita): boolean => f.carga.trim() !== '' || f.repeticiones.trim() !== '';

/** Si hay algo escrito en la fila: salir de la pantalla así pregunta antes. */
export const hayAlgoEscrito = (f: FilaEscrita): boolean => f.carga.trim() !== '' || f.repeticiones.trim() !== '' || f.rir.trim() !== '';

export type ErroresDeFila = Partial<Record<keyof FilaEscrita | 'fila', string>>;
export type LecturaDeFila = { readonly ok: true; readonly serie: SerieEjecutadaApi } | { readonly ok: false; readonly errores: ErroresDeFila };

/** Los límites del contrato de una serie realizada (`SerieEjecutadaSchema`). */
const MAXIMO_DE_REPETICIONES = 1000;
const RIR_MAXIMO = 20;

/**
 * La serie que se registra con lo escrito en la fila, y solo con eso. Vacío es `null`; el cero es un valor. Los errores
 * van por campo, para mostrarlos al lado del campo y en su nombre accesible.
 */
export function leerFila(f: FilaEscrita, setIndex: number, unidad: Unidad): LecturaDeFila {
  const errores: ErroresDeFila = {};
  if (!puedeRegistrar(f)) return { ok: false, errores: { fila: COPY_ENTRENAMIENTO_POR_SERIE.faltaUnDato } };
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

/**
 * Las filas de la tabla de un ejercicio: las series planificadas, más las registradas de más y las que la persona sumó
 * (`extra`). Cada una con su estado: guardada en el servidor, pendiente de enviar, en conflicto o sin registrar. Una
 * pendiente dice además dónde está (`proteccion`, del almacén): «guardada en el teléfono» solo si la escritura que la
 * incluye terminó bien.
 */
export function filasDelEjercicio(
  p: Pick<PrescripcionConObjetivos, 'prescriptionId' | 'sets'>,
  guardadas: readonly SerieEjecutadaApi[],
  locales: readonly SerieLocal[],
  extra = 0,
  proteccion: (l: SerieLocal) => ProteccionDeSerie = () => 'guardando',
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
  const maximo = Math.max(0, ...filas.keys());
  for (let i = 1; i <= extra && maximo + i <= MAXIMO_DE_SERIES; i++) filas.set(maximo + i, sinPlan(maximo + i));
  return [...filas.values()].sort((a, b) => a.setIndex - b.setIndex);
}

/** La primera fila sin registrar después de `despuesDe` (o desde el principio), o `null`. */
export function primeraSinRegistrar(filas: readonly FilaDeLaTabla[], despuesDe = 0): FilaDeLaTabla | null {
  return filas.find((f) => f.estado === 'sin-registrar' && f.setIndex > despuesDe) ?? null;
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
 * `exercises` entero para API-TRN-17: lo que el borrador del servidor ya tiene, más las series pendientes del teléfono.
 * - `incluidas`: las que viajan en este pedido;
 * - `ocupadas`: las que el servidor ya tiene con ese número, o un ejercicio registrado por resumen. No se pisan.
 * Solo viaja lo escrito por la persona: un placeholder no es una serie.
 */
export function ejerciciosParaGuardar(borrador: Pick<BorradorDeEjecucion, 'exercises'>, locales: readonly SerieLocal[]): { readonly exercises: EjercicioRegistradoEntrada[]; readonly incluidas: SerieLocal[]; readonly ocupadas: SerieLocal[] } {
  const exercises: EjercicioRegistradoEntrada[] = borrador.exercises.map((e) =>
    e.sets
      ? { prescriptionId: e.prescriptionId, performedExerciseVersionId: e.performedExerciseVersionId, sets: [...e.sets] }
      : { prescriptionId: e.prescriptionId, performedExerciseVersionId: e.performedExerciseVersionId, executionSummary: e.executionSummary ?? { description: '' } },
  );
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
  return { exercises, incluidas, ocupadas };
}

/** Si dos series registradas dicen lo mismo (para reconocer una pendiente que el servidor ya guardó). */
export function mismosDatos(a: SerieEjecutadaApi, b: SerieEjecutadaApi): boolean {
  return (
    a.setIndex === b.setIndex &&
    a.completedRepetitions === b.completedRepetitions &&
    a.rir === b.rir &&
    a.perceivedExertion === b.perceivedExertion &&
    (a.load === null ? b.load === null : b.load !== null && a.load.value === b.load.value && a.load.unit === b.load.unit)
  );
}

/**
 * Las series del teléfono frente a un borrador recién leído: las que el servidor ya tiene igual salen (llegaron aunque
 * se perdió la respuesta); las que tiene con ese número y otros datos quedan en conflicto. Las demás siguen pendientes.
 */
export function conciliarSeries(locales: readonly SerieLocal[], borrador: Pick<BorradorDeEjecucion, 'exercises'>): SerieLocal[] {
  return locales.flatMap((l): SerieLocal[] => {
    const delServidor = guardadasDe(borrador, l.prescriptionId).find((s) => s.setIndex === l.serie.setIndex);
    if (!delServidor) return [{ ...l, enConflicto: false }];
    return mismosDatos(delServidor, l.serie) ? [] : [{ ...l, enConflicto: true }];
  });
}

// ─── El resumen antes de finalizar ──────────────────────────────────────────────────────────────

export interface ResumenDelEjercicio {
  readonly prescriptionId: string;
  readonly nombre: string;
  readonly registradas: number;
  readonly planificadas: number;
  /** Las series planificadas que no tienen registro. La ausencia no es «no realizada» (DL-106). */
  readonly sinRegistrar: readonly number[];
}

/** Por ejercicio, «N de M series registradas» y las que quedan «Sin registrar». */
export function resumenDelRegistro(sesion: SesionConObjetivos, borrador: Pick<BorradorDeEjecucion, 'exercises'> | null, locales: readonly SerieLocal[]): ResumenDelEjercicio[] {
  return sesion.prescriptions.map((p) => {
    const filas = filasDelEjercicio(p, guardadasDe(borrador, p.prescriptionId), locales);
    return {
      prescriptionId: p.prescriptionId,
      nombre: p.exerciseName,
      registradas: filas.filter((f) => f.estado !== 'sin-registrar').length,
      planificadas: p.sets.length,
      sinRegistrar: filas.filter((f) => f.planificada && f.estado === 'sin-registrar').map((f) => f.setIndex),
    };
  });
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
  return null;
}

/** La unidad con la que se escribe la carga de un ejercicio: la de su objetivo, si tiene; si no, kg. */
export function unidadDelEjercicio(p: Pick<PrescripcionConObjetivos, 'sets' | 'suggestedLoad'> | null): Unidad {
  return p?.sets.find((s) => s.target.suggestedLoad)?.target.suggestedLoad?.unit ?? p?.suggestedLoad?.unit ?? 'kg';
}

// ─── La disposición ─────────────────────────────────────────────────────────────────────────────

export const ANCHO_DE_LA_COLUMNA_SERIE = 44;
export const ANCHO_MINIMO_DE_CELDA = 72;
export const SEPARACION_DE_CELDAS = 6;

/**
 * Tabla o tarjetas apiladas. Con la letra grande, tres celdas por fila no entran sin cortar el objetivo: cada serie pasa
 * a una tarjeta con sus tres campos, en el mismo orden y con las mismas acciones.
 */
export function disposicionDeLaTabla(ancho: number, escalaDeLetra: number): 'tabla' | 'tarjetas' {
  const escala = Math.max(1, escalaDeLetra);
  if (escala >= 1.6) return 'tarjetas';
  const celda = (ancho - ANCHO_DE_LA_COLUMNA_SERIE * escala - 3 * SEPARACION_DE_CELDAS) / 3;
  return celda >= ANCHO_MINIMO_DE_CELDA * escala ? 'tabla' : 'tarjetas';
}
