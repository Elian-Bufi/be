/**
 * La estructura del plan de entrenamiento y el registro de ejecución, como reglas puras (B-08; 09v10 §5-§6, §27-§30).
 *
 * Se separan tres momentos, porque el 09 los separa:
 * - **al guardar el borrador de plan** (API-TRN-10) se rechaza lo mal formado: dos nodos con el mismo identificador,
 *   un bloque con sesiones y microciclos a la vez, un criterio de intensidad fuera de los dos admitidos. Un borrador
 *   incompleto **sí** se guarda: para eso es un borrador;
 * - **al validar** (API-TRN-11) se informa lo que falta, como `issues`, con `200` aunque `valid` sea falso;
 * - **al activar** (API-TRN-12) se exige que no falte nada.
 *
 * Lo mismo para la ejecución: al guardar el borrador se rechaza lo incoherente (series en un registro agregado), y
 * al confirmar se exige el contenido mínimo según la granularidad y la condición (09v10:1161).
 *
 * **Qué no se valida, y es deliberado** (09v10:738-744): que el programa sea «bueno», el volumen o la frecuencia
 * ideales, la selección de ejercicios, la progresión. Tampoco se exige criterio de intensidad: REG-06-128 es
 * condicional, y una prescripción sin criterio es legítima (DL-088).
 */
import type { EjercicioRegistradoEntrada, EstructuraDePlanDeEntrenamientoEntrada, SesionEntrada } from './contratos-entrenamiento';
import type { ValidationIssue } from './contratos';
import type { CondicionDeSesion, GranularidadDeRegistro, MotivoDeIntensidadInvalida } from './entrenamiento';

// ─── Lo que se guarda (versión de plan en borrador) y lo que se congela (instantánea) ───────────
export type CriterioApi = 'PERCENT_RM' | 'RIR';
export interface IntensidadGuardada {
  readonly criterion: CriterioApi;
  readonly target: { readonly value: number; readonly reference: { readonly description: string } | null };
}
export interface SeriePrescriptaGuardada {
  readonly repetitions: { readonly value: number } | { readonly min: number; readonly max: number } | null;
  readonly note: string | null;
}
export interface ParametroGuardado {
  readonly label: string;
  readonly value: string | number;
  readonly unit: string | null;
}
export interface PrescripcionGuardada {
  readonly prescriptionId: string;
  readonly exerciseVersionId: string;
  readonly sets: readonly SeriePrescriptaGuardada[];
  readonly intensity: IntensidadGuardada | null;
  readonly suggestedLoad: { readonly value: number; readonly unit: 'kg' | 'lb' } | null;
  readonly professionalParameters: readonly ParametroGuardado[];
  readonly note: string | null;
}
export interface SesionGuardada {
  readonly sessionId: string;
  readonly label: string;
  readonly instructions: string | null;
  readonly prescriptions: readonly PrescripcionGuardada[];
}
export interface MicrocicloGuardado {
  readonly microcycleId: string;
  readonly label: string;
  readonly purpose: string | null;
  readonly sessions: readonly SesionGuardada[];
}
export interface BloqueGuardado {
  readonly blockId: string;
  readonly label: string;
  readonly purpose: string | null;
  readonly microcycles: readonly MicrocicloGuardado[];
  readonly sessions: readonly SesionGuardada[];
}
/** El contenido de una versión de plan: el orden es el del arreglo (REG-06-111: «en orden identificable»). */
export interface ContenidoDePlanDeEntrenamiento {
  readonly blocks: readonly BloqueGuardado[];
}

/**
 * La instantánea congela, además, el ejercicio de cada prescripción tal como estaba en el catálogo al activar: un
 * cambio posterior de catálogo no la reescribe (REG-06-112; 09v10:706, 1592).
 */
export interface EjercicioCongelado {
  readonly exerciseId: string;
  readonly exerciseName: string;
}
export interface InstantaneaDeEntrenamiento {
  readonly contenido: ContenidoDePlanDeEntrenamiento;
  readonly ejercicios: Readonly<Record<string, EjercicioCongelado>>;
}

// ─── Códigos de problema (DL-088) ───────────────────────────────────────────────────────────────
export const CodigoDeProblemaDePlanDeEntrenamiento = {
  // Al guardar: estructura mal formada (TRAINING_PLAN_STRUCTURE_INVALID).
  DUPLICATE_NODE_ID: 'DUPLICATE_NODE_ID',
  SESSIONS_AND_MICROCYCLES_IN_BLOCK: 'SESSIONS_AND_MICROCYCLES_IN_BLOCK',
  // Al guardar: intensidad (INTENSITY_CRITERION_INVALID).
  INTENSITY_CRITERION_UNKNOWN: 'INTENSITY_CRITERION_UNKNOWN',
  INTENSITY_CRITERIA_COMBINED: 'INTENSITY_CRITERIA_COMBINED',
  PERCEIVED_EXERTION_AS_CRITERION: 'PERCEIVED_EXERTION_AS_CRITERION',
  INTENSITY_TARGET_OUT_OF_RANGE: 'INTENSITY_TARGET_OUT_OF_RANGE',
  // Al guardar o al validar: la referencia al catálogo (EXERCISE_REFERENCE_INVALID).
  EXERCISE_REFERENCE_INVALID: 'EXERCISE_REFERENCE_INVALID',
  EXERCISE_NOT_AVAILABLE: 'EXERCISE_NOT_AVAILABLE',
  // Al validar: lo que falta.
  BLOCK_REQUIRED: 'BLOCK_REQUIRED',
  SESSION_REQUIRED: 'SESSION_REQUIRED',
  PRESCRIPTION_REQUIRED: 'PRESCRIPTION_REQUIRED',
} as const;
const P = CodigoDeProblemaDePlanDeEntrenamiento;

const MOTIVO_A_CODIGO: Readonly<Record<MotivoDeIntensidadInvalida, string>> = {
  CRITERIO_DESCONOCIDO: P.INTENSITY_CRITERION_UNKNOWN,
  DOS_CRITERIOS: P.INTENSITY_CRITERIA_COMBINED,
  ESFUERZO_COMO_CRITERIO: P.PERCEIVED_EXERTION_AS_CRITERION,
  VALOR_SIN_CRITERIO: P.INTENSITY_CRITERION_UNKNOWN,
};

/**
 * El criterio llega como texto y se interpreta acá, con su motivo. `RPE` y sus variantes son esfuerzo percibido
 * usado como criterio (REG-06-129; H-09-TRN-02); los dos tokens juntos son dos criterios (09v10:371, 1589).
 */
export function interpretarCriterio(texto: string): { readonly criterio: CriterioApi } | { readonly motivo: MotivoDeIntensidadInvalida } {
  const t = texto.trim().toUpperCase();
  if (t === 'PERCENT_RM' || t === 'RIR') return { criterio: t };
  if (/RPE|PERCEIVED|ESFUERZO|BORG/.test(t)) return { motivo: 'ESFUERZO_COMO_CRITERIO' };
  if (t.includes('PERCENT_RM') && t.includes('RIR')) return { motivo: 'DOS_CRITERIOS' };
  return { motivo: 'CRITERIO_DESCONOCIDO' };
}

/**
 * Rango de **significado** del objetivo, no un valor prescripto (DL-088): un porcentaje de la repetición máxima está
 * entre 0 y 100, y las repeticiones en reserva no son negativas. El valor concreto lo decide el profesional.
 */
function objetivoEnRango(criterio: CriterioApi, valor: number): boolean {
  return criterio === 'PERCENT_RM' ? valor > 0 && valor <= 100 : valor >= 0 && valor <= 10;
}

export type ResultadoDeNormalizacion =
  | { readonly ok: true; readonly contenido: ContenidoDePlanDeEntrenamiento }
  | { readonly ok: false; readonly tipo: 'ESTRUCTURA' | 'INTENSIDAD'; readonly issues: readonly ValidationIssue[] };

/**
 * Normaliza la estructura que manda el profesional: asigna identificadores a los nodos nuevos, conserva los que
 * vienen (REG-06-111), y rechaza lo mal formado. Primero la estructura, después la intensidad: un error de forma se
 * informa antes que uno de contenido.
 */
export function normalizarEstructuraDeEntrenamiento(entrada: EstructuraDePlanDeEntrenamientoEntrada, nuevoId: () => string): ResultadoDeNormalizacion {
  const estructura: ValidationIssue[] = [];
  const intensidad: ValidationIssue[] = [];
  const vistos = new Set<string>();
  const id = (dado: string | undefined, ruta: string): string => {
    const valor = dado ?? nuevoId();
    if (vistos.has(valor)) estructura.push({ code: P.DUPLICATE_NODE_ID, path: ruta });
    vistos.add(valor);
    return valor;
  };

  const sesion = (s: SesionEntrada, ruta: string): SesionGuardada => ({
    sessionId: id(s.sessionId, `${ruta}.sessionId`),
    label: s.label,
    instructions: s.instructions ?? null,
    prescriptions: s.prescriptions.map((p, k) => {
      const rp = `${ruta}.prescriptions[${k}]`;
      let intensity: IntensidadGuardada | null = null;
      if (p.intensity) {
        const c = interpretarCriterio(p.intensity.criterion);
        if ('motivo' in c) intensidad.push({ code: MOTIVO_A_CODIGO[c.motivo], path: `${rp}.intensity.criterion` });
        else if (!objetivoEnRango(c.criterio, p.intensity.target.value)) intensidad.push({ code: P.INTENSITY_TARGET_OUT_OF_RANGE, path: `${rp}.intensity.target.value` });
        else intensity = { criterion: c.criterio, target: { value: p.intensity.target.value, reference: p.intensity.target.reference ?? null } };
      }
      return {
        prescriptionId: id(p.prescriptionId, `${rp}.prescriptionId`),
        exerciseVersionId: p.exerciseVersionId,
        sets: p.sets.map((x) => ({ repetitions: x.repetitions, note: x.note ?? null })),
        intensity,
        suggestedLoad: p.suggestedLoad ?? null,
        professionalParameters: (p.professionalParameters ?? []).map((q) => ({ label: q.label, value: q.value, unit: q.unit ?? null })),
        note: p.note ?? null,
      };
    }),
  });

  const blocks = entrada.blocks.map((b, i): BloqueGuardado => {
    const rb = `blocks[${i}]`;
    const microcycles = b.microcycles ?? [];
    const sesiones = b.sessions ?? [];
    // «Cuando existen microciclos, las sesiones se organizan bajo ellos» (09v10:281).
    if (microcycles.length > 0 && sesiones.length > 0) estructura.push({ code: P.SESSIONS_AND_MICROCYCLES_IN_BLOCK, path: `${rb}.sessions` });
    return {
      blockId: id(b.blockId, `${rb}.blockId`),
      label: b.label,
      purpose: b.purpose ?? null,
      microcycles: microcycles.map((m, j) => ({
        microcycleId: id(m.microcycleId, `${rb}.microcycles[${j}].microcycleId`),
        label: m.label,
        purpose: m.purpose ?? null,
        sessions: m.sessions.map((s, k) => sesion(s, `${rb}.microcycles[${j}].sessions[${k}]`)),
      })),
      sessions: sesiones.map((s, k) => sesion(s, `${rb}.sessions[${k}]`)),
    };
  });

  if (estructura.length > 0) return { ok: false, tipo: 'ESTRUCTURA', issues: estructura };
  if (intensidad.length > 0) return { ok: false, tipo: 'INTENSIDAD', issues: intensidad };
  return { ok: true, contenido: { blocks } };
}

/** Cada sesión con su ubicación y su ruta. La usan la validación, la instantánea y las ocurrencias. */
export interface SesionUbicada {
  readonly bloque: BloqueGuardado;
  readonly microciclo: MicrocicloGuardado | null;
  readonly sesion: SesionGuardada;
  readonly ruta: string;
}
export function sesionesDelPlan(contenido: ContenidoDePlanDeEntrenamiento): SesionUbicada[] {
  const r: SesionUbicada[] = [];
  contenido.blocks.forEach((bloque, i) => {
    bloque.microcycles.forEach((microciclo, j) =>
      microciclo.sessions.forEach((sesion, k) => r.push({ bloque, microciclo, sesion, ruta: `blocks[${i}].microcycles[${j}].sessions[${k}]` })),
    );
    bloque.sessions.forEach((sesion, k) => r.push({ bloque, microciclo: null, sesion, ruta: `blocks[${i}].sessions[${k}]` }));
  });
  return r;
}

/** Cada prescripción con su ruta, para verificar las referencias al catálogo con el lugar exacto del problema. */
export function prescripcionesDelPlan(contenido: ContenidoDePlanDeEntrenamiento): { readonly prescripcion: PrescripcionGuardada; readonly ruta: string }[] {
  return sesionesDelPlan(contenido).flatMap((s) => s.sesion.prescriptions.map((prescripcion, k) => ({ prescripcion, ruta: `${s.ruta}.prescriptions[${k}]` })));
}

/**
 * Lo que falta para poder activar (API-TRN-11). Vinculado a bloque → sesión → ejercicio (B10-06:571-577). No incluye
 * la falta de criterio de intensidad: REG-06-128 la admite. Las referencias al catálogo las agrega el servicio.
 */
export function problemasDeCompletitud(contenido: ContenidoDePlanDeEntrenamiento): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (contenido.blocks.length === 0) issues.push({ code: P.BLOCK_REQUIRED, path: 'blocks' });
  contenido.blocks.forEach((b, i) => {
    if (b.microcycles.length === 0 && b.sessions.length === 0) issues.push({ code: P.SESSION_REQUIRED, path: `blocks[${i}].sessions` });
    b.microcycles.forEach((m, j) => {
      if (m.sessions.length === 0) issues.push({ code: P.SESSION_REQUIRED, path: `blocks[${i}].microcycles[${j}].sessions` });
    });
  });
  for (const s of sesionesDelPlan(contenido)) if (s.sesion.prescriptions.length === 0) issues.push({ code: P.PRESCRIPTION_REQUIRED, path: `${s.ruta}.prescriptions` });
  return issues;
}

// ─── Registro de ejecución ──────────────────────────────────────────────────────────────────────
export const CodigoDeProblemaDeRegistro = {
  // Al guardar (EXECUTION_GRANULARITY_INVALID).
  GRANULARITY_REQUIRED_FOR_EXERCISES: 'GRANULARITY_REQUIRED_FOR_EXERCISES',
  GRANULARITY_MISMATCH: 'GRANULARITY_MISMATCH',
  // Al guardar (EXECUTION_VALUE_INVALID).
  DUPLICATE_PRESCRIPTION: 'DUPLICATE_PRESCRIPTION',
  DUPLICATE_SET_INDEX: 'DUPLICATE_SET_INDEX',
  PRESCRIPTION_NOT_IN_SESSION: 'PRESCRIPTION_NOT_IN_SESSION',
  PERFORMED_EXERCISE_INVALID: 'PERFORMED_EXERCISE_INVALID',
  OCCURRED_AT_OUTSIDE_OCCURRENCE_DATE: 'OCCURRED_AT_OUTSIDE_OCCURRENCE_DATE',
  OCCURRED_AT_IN_FUTURE: 'OCCURRED_AT_IN_FUTURE',
  // Al confirmar (EXECUTION_DRAFT_NOT_READY).
  SESSION_CONDITION_REQUIRED: 'SESSION_CONDITION_REQUIRED',
  GRANULARITY_REQUIRED: 'GRANULARITY_REQUIRED',
  NOT_COMPLETED_WITH_EXECUTION_DATA: 'NOT_COMPLETED_WITH_EXECUTION_DATA',
  EXECUTION_DATA_REQUIRED: 'EXECUTION_DATA_REQUIRED',
  SET_REQUIRED: 'SET_REQUIRED',
  SET_WITHOUT_DATA: 'SET_WITHOUT_DATA',
  OCCURRED_AT_REQUIRED: 'OCCURRED_AT_REQUIRED',
} as const;
const R = CodigoDeProblemaDeRegistro;

/** El registro en términos de dominio: condición y granularidad ya interpretadas. */
export interface RegistroEnBorrador {
  readonly condicion: CondicionDeSesion | null;
  readonly granularidad: GranularidadDeRegistro | null;
  readonly ejercicios: readonly EjercicioRegistradoEntrada[];
  readonly resumenDeSesion: { readonly description: string } | null;
}

/**
 * Coherencia al guardar: la forma de cada ejercicio corresponde a la granularidad elegida, y no hay duplicados. No
 * se sintetizan series desde un resumen ni al revés (09v10:1101; REG-06-132). La condición `NO_REALIZADA` con datos
 * cargados **no** se rechaza acá: el asesorado puede haber apretado «No pude realizarla» por error, y lo que ya cargó
 * no se le borra. Se exige coherencia al confirmar.
 */
export function problemasDeCoherencia(r: RegistroEnBorrador): { readonly granularidad: ValidationIssue[]; readonly valores: ValidationIssue[] } {
  const granularidad: ValidationIssue[] = [];
  const valores: ValidationIssue[] = [];
  const prescripciones = new Set<string>();
  r.ejercicios.forEach((e, i) => {
    const ruta = `exercises[${i}]`;
    const porSerie = 'sets' in e;
    if (r.granularidad === null) granularidad.push({ code: R.GRANULARITY_REQUIRED_FOR_EXERCISES, path: ruta });
    else if ((r.granularidad === 'SERIE') !== porSerie) granularidad.push({ code: R.GRANULARITY_MISMATCH, path: ruta });
    if (prescripciones.has(e.prescriptionId)) valores.push({ code: R.DUPLICATE_PRESCRIPTION, path: `${ruta}.prescriptionId` });
    prescripciones.add(e.prescriptionId);
    if (porSerie) {
      const indices = new Set<number>();
      e.sets.forEach((s, j) => {
        if (indices.has(s.setIndex)) valores.push({ code: R.DUPLICATE_SET_INDEX, path: `${ruta}.sets[${j}].setIndex` });
        indices.add(s.setIndex);
      });
    }
  });
  // El resumen de sesión es del registro agregado: con series, el detalle ya está en las series.
  if (r.resumenDeSesion !== null && r.granularidad !== 'EJERCICIO_O_SESION') granularidad.push({ code: R.GRANULARITY_MISMATCH, path: 'sessionSummary' });
  return { granularidad, valores };
}

/**
 * Contenido mínimo para confirmar (09v10:1161). La condición es obligatoria; `NO_REALIZADA` va sin granularidad ni
 * datos de entrenamiento; las otras dos exigen la granularidad y algo registrado. Una serie sin carga ni repeticiones
 * no registra nada. Nada de esto infiere lo faltante: solo exige que lo que se confirma diga algo.
 */
export function problemasParaConfirmar(r: RegistroEnBorrador): ValidationIssue[] {
  const coherencia = problemasDeCoherencia(r);
  const issues: ValidationIssue[] = [...coherencia.granularidad, ...coherencia.valores];
  if (r.condicion === null) return [{ code: R.SESSION_CONDITION_REQUIRED, path: 'sessionCondition' }, ...issues];
  if (r.condicion === 'NO_REALIZADA') {
    if (r.granularidad !== null || r.ejercicios.length > 0 || r.resumenDeSesion !== null) issues.push({ code: R.NOT_COMPLETED_WITH_EXECUTION_DATA, path: 'sessionCondition' });
    return issues;
  }
  if (r.granularidad === null) return [...issues, { code: R.GRANULARITY_REQUIRED, path: 'granularity' }];
  if (r.granularidad === 'SERIE') {
    if (r.ejercicios.length === 0) issues.push({ code: R.EXECUTION_DATA_REQUIRED, path: 'exercises' });
    r.ejercicios.forEach((e, i) => {
      if (!('sets' in e)) return;
      if (e.sets.length === 0) issues.push({ code: R.SET_REQUIRED, path: `exercises[${i}].sets` });
      e.sets.forEach((s, j) => {
        if (s.load === null && s.completedRepetitions === null) issues.push({ code: R.SET_WITHOUT_DATA, path: `exercises[${i}].sets[${j}]` });
      });
    });
  } else if (r.ejercicios.length === 0 && r.resumenDeSesion === null) {
    issues.push({ code: R.EXECUTION_DATA_REQUIRED, path: 'exercises' });
  }
  return issues;
}

// ─── Identificador de la ocurrencia (DL-077; 09v10:924) ─────────────────────────────────────────
/** La ocurrencia: una sesión planificada de una versión activada, en una fecha local. */
export interface OcurrenciaPlanificada {
  readonly versionDePlanId: string;
  readonly sesionPlanificadaId: string;
  readonly fechaLocal: string;
}

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const PREFIJO = 'occ_';
const FORMA = /^[0-9a-f-]{36}\.[A-Za-z0-9_-]{1,64}\.\d{4}-\d{2}-\d{2}$/;

function aBase64Url(ascii: string): string {
  let salida = '';
  let acumulado = 0;
  let bits = 0;
  for (let i = 0; i < ascii.length; i++) {
    acumulado = (acumulado << 8) | ascii.charCodeAt(i);
    bits += 8;
    while (bits >= 6) {
      bits -= 6;
      salida += ALFABETO[(acumulado >> bits) & 63];
    }
    acumulado &= (1 << bits) - 1;
  }
  if (bits > 0) salida += ALFABETO[(acumulado << (6 - bits)) & 63];
  return salida;
}

function deBase64Url(texto: string): string | null {
  let salida = '';
  let acumulado = 0;
  let bits = 0;
  for (const c of texto) {
    const v = ALFABETO.indexOf(c);
    if (v < 0) return null;
    acumulado = (acumulado << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      salida += String.fromCharCode((acumulado >> bits) & 255);
    }
    acumulado &= (1 << bits) - 1;
  }
  return salida;
}

/**
 * El `occurrenceId` es **opaco**: lo emite el servidor, y el cliente lo usa sin interpretarlo. Se codifica en vez de
 * guardarse porque una ocurrencia existe aunque nadie la haya registrado todavía: materializarla al leer «Hoy»
 * haría que una lectura escriba. Decodificar no autoriza nada: el servidor verifica igual que la versión sea del
 * asesorado, que esté vigente ese día y que la sesión exista en su instantánea.
 */
export function codificarOcurrencia(o: OcurrenciaPlanificada): string {
  return PREFIJO + aBase64Url(`${o.versionDePlanId}.${o.sesionPlanificadaId}.${o.fechaLocal}`);
}

/** `null` si no es un identificador que este servidor pueda haber emitido. Solo acepta la forma canónica. */
export function decodificarOcurrencia(id: string): OcurrenciaPlanificada | null {
  if (!id.startsWith(PREFIJO) || id.length > 200) return null;
  const texto = deBase64Url(id.slice(PREFIJO.length));
  if (texto === null || !FORMA.test(texto)) return null;
  const [versionDePlanId, sesionPlanificadaId, fechaLocal] = texto.split('.') as [string, string, string];
  const o = { versionDePlanId, sesionPlanificadaId, fechaLocal };
  // Una sola escritura por ocurrencia: dos cadenas que decodifican igual no pueden ser las dos válidas.
  return codificarOcurrencia(o) === id ? o : null;
}
