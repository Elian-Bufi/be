/**
 * DL-203 (WP-PRESETS-POR-NIVEL) · Los presets del profesional en cada nivel: guardar una sesión o una fase como preset, y
 * aplicarlo en otro plan. Sin React y sin red, para probarlo solo (`presets-por-nivel.test.ts`). El contrato, en
 * `contratos-habituales.ts` (`PresetDeSesionContenidoSchema` y `PresetDeFaseContenidoSchema`).
 *
 * **Guardar** (`presetDeSesionDe`, `presetDeFaseDe`) arma el contenido y dice antes qué no se guarda y qué textos se guardan
 * para revisar, como API-HAB-07 (`prescripcionHabitualDe`):
 * - los ejercicios sí; las cargas absolutas nunca (en % RM queda el %, sin la referencia, que es de cada persona);
 * - las notas del ejercicio y de sus series, nunca, ni las anotaciones privadas de la fase;
 * - los nombres, el objetivo de la fase, las indicaciones de la sesión y los parámetros escritos se guardan y se nombran,
 *   para revisar que no digan nada de la persona;
 * - los identificadores pasan a ser claves locales («s1», «p1», «g1»), y con ellos los días, las aproximaciones y la
 *   progresión que los citan.
 *
 * **Aplicar** (`sesionDelPreset`, `faseDelPreset`) remapea las claves a identificadores nuevos (`nuevoId`), así se puede
 * aplicar dos veces en el mismo plan, y devuelve lo que va en la planificación y en la agenda.
 */
import type { AgendaDeEntrenamiento, AproximacionesDelEjercicio, EstructuraDePlanDeEntrenamientoEntrada, PlanificacionDelPlan, ProgresionDeLaFase } from './contratos-entrenamiento';
import type { EjercicioDelPreset, PresetDeFaseContenido, PresetDeSesionContenido, SesionDelPreset } from './contratos-habituales';

type BloqueE = EstructuraDePlanDeEntrenamientoEntrada['blocks'][number];
type SesionE = NonNullable<BloqueE['sessions']>[number];
type PrescripcionE = SesionE['prescriptions'][number];

/** Lo que se guarda y lo que hay que saber antes: qué no se guarda y qué textos escritos viajan con el preset. */
export interface PresetParaGuardar<C> {
  readonly contenido: C;
  readonly seQuita: readonly string[];
  readonly seGuardanEscritos: readonly string[];
}

export const COPY_PRESETS_POR_NIVEL = {
  cargas: 'las cargas, que son de cada persona (en % RM queda el %, y la carga sale del 1RM de quien lo recibe)',
  notas: 'las notas de los ejercicios y de sus series, que pueden nombrar a la persona',
  referencia: 'la referencia del % RM, que es de cada persona',
  anotaciones: 'las anotaciones de la fase, que son tuyas sobre esta persona',
  conSemanas: 'Esta fase está organizada en semanas (microciclos): no se guarda como preset. Copiala con «Duplicar la fase».',
  sinSesiones: 'La fase todavía no tiene sesiones.',
  sinEjercicios: 'La sesión todavía no tiene ejercicios.',
} as const;

/** Las claves locales del preset, en orden: «s1», «s2»…, «p1», «p2»…, «g1»… */
function claves(prefijo: string): (original: string | null | undefined) => string {
  const vistas = new Map<string, string>();
  let n = 0;
  return (original) => {
    if (original && vistas.has(original)) return vistas.get(original)!;
    const clave = `${prefijo}${++n}`;
    if (original) vistas.set(original, clave);
    return clave;
  };
}

interface Recolector {
  readonly seQuita: Set<string>;
  readonly escritos: string[];
  readonly prescripciones: Map<string, string>;
  readonly sesiones: Map<string, string>;
  readonly clavePrescripcion: (id: string | null | undefined) => string;
  readonly claveSesion: (id: string | null | undefined) => string;
  readonly claveGrupo: (id: string | null | undefined) => string;
}

const recolector = (): Recolector => {
  const prescripciones = new Map<string, string>();
  const sesiones = new Map<string, string>();
  const p = claves('p');
  const s = claves('s');
  return {
    seQuita: new Set(),
    escritos: [],
    prescripciones,
    sesiones,
    clavePrescripcion: (id) => {
      const k = p(id);
      if (id) prescripciones.set(id, k);
      return k;
    },
    claveSesion: (id) => {
      const k = s(id);
      if (id) sesiones.set(id, k);
      return k;
    },
    claveGrupo: claves('g'),
  };
};

/** Un ejercicio del plan, como va en el preset: sin carga, sin nota, sin la referencia del % RM y con su clave local. */
function ejercicioDelPreset(x: PrescripcionE, r: Recolector, grupos: ReadonlyMap<string, string>): EjercicioDelPreset {
  const { suggestedLoad, note, prescriptionId, exerciseGroupId, ...resto } = structuredClone(x);
  if (suggestedLoad || x.sets.some((s) => !!s.suggestedLoad)) r.seQuita.add(COPY_PRESETS_POR_NIVEL.cargas);
  if (note || x.sets.some((s) => !!s.note)) r.seQuita.add(COPY_PRESETS_POR_NIVEL.notas);
  if (x.intensity?.target.reference) r.seQuita.add(COPY_PRESETS_POR_NIVEL.referencia);
  for (const par of x.professionalParameters ?? []) if (typeof par.value === 'string') r.escritos.push(`«${par.label}: ${par.value}»`);
  return {
    ...resto,
    prescriptionId: r.clavePrescripcion(prescriptionId),
    intensity: resto.intensity ? { criterion: resto.intensity.criterion, target: { value: resto.intensity.target.value, reference: null } } : null,
    sets: x.sets.map(({ suggestedLoad: _c, note: _n, ...s }) => s),
    ...(exerciseGroupId ? { exerciseGroupId: grupos.get(exerciseGroupId) ?? null } : {}),
  };
}

function sesionParaElPreset(s: SesionE, r: Recolector): SesionDelPreset {
  const grupos = new Map((s.exerciseGroups ?? []).map((g) => [g.groupId, r.claveGrupo(g.groupId)] as const));
  if (s.instructions?.trim()) r.escritos.push(`las indicaciones de «${s.label}»`);
  return {
    sessionId: r.claveSesion(s.sessionId),
    label: s.label,
    ...(s.instructions?.trim() ? { instructions: s.instructions } : {}),
    prescriptions: s.prescriptions.map((x) => ejercicioDelPreset(x, r, grupos)),
    ...(s.exerciseGroups?.length ? { exerciseGroups: s.exerciseGroups.map((g) => ({ ...structuredClone(g), groupId: grupos.get(g.groupId)! })) } : {}),
  };
}

/** Las aproximaciones de los ejercicios guardados, con sus claves locales. */
const aproximacionesDelPreset = (p: PlanificacionDelPlan | null | undefined, r: Recolector): AproximacionesDelEjercicio[] =>
  (p?.warmUps ?? []).flatMap((w) => {
    const k = r.prescripciones.get(w.prescriptionId);
    return k ? [{ ...structuredClone(w), prescriptionId: k }] : [];
  });

/** «Guardar como preset» desde el «…» de la sesión: la sesión entera, con sus ejercicios, sus series y sus aproximaciones. */
export function presetDeSesionDe(s: SesionE, planificacion: PlanificacionDelPlan | null | undefined): PresetParaGuardar<PresetDeSesionContenido> {
  const r = recolector();
  const session = sesionParaElPreset(s, r);
  const warmUps = aproximacionesDelPreset(planificacion, r);
  return { contenido: { session, ...(warmUps.length > 0 ? { warmUps } : {}) }, seQuita: [...r.seQuita], seGuardanEscritos: r.escritos };
}

/**
 * «Guardar como preset» desde el «…» de la fase: el nombre, las semanas, las sesiones con sus ejercicios y sus series, los
 * días de cada sesión, la progresión de la fase (también la de los ejercicios elegidos) y las aproximaciones. Una fase
 * organizada en microciclos no se guarda (DL-203: no se crean microciclos nuevos).
 */
export function presetDeFaseDe(
  b: BloqueE,
  planificacion: PlanificacionDelPlan | null | undefined,
  agenda: AgendaDeEntrenamiento | null | undefined,
): PresetParaGuardar<PresetDeFaseContenido> | { readonly noSePuede: string } {
  if ((b.microcycles ?? []).length > 0) return { noSePuede: COPY_PRESETS_POR_NIVEL.conSemanas };
  const r = recolector();
  const sessions = (b.sessions ?? []).map((s) => sesionParaElPreset(s, r));
  if (b.purpose?.trim()) r.escritos.unshift(`el objetivo de «${b.label}»`);
  if (b.blockId && planificacion?.privateNotes?.phases.some((n) => n.blockId === b.blockId)) r.seQuita.add(COPY_PRESETS_POR_NIVEL.anotaciones);
  const weeks = b.blockId ? (planificacion?.phases.find((f) => f.blockId === b.blockId)?.weeks ?? null) : null;
  const days = (agenda?.sessions ?? []).flatMap((d) => (r.sesiones.has(d.sessionId) ? [{ sessionId: r.sesiones.get(d.sessionId)!, weekdays: [...d.weekdays] }] : []));
  const regla = b.blockId ? (planificacion?.progressions ?? []).find((p) => p.blockId === b.blockId) : undefined;
  let progression: PresetDeFaseContenido['progression'] = null;
  if (regla) {
    const { blockId: _b, prescriptionIds, ...resto } = structuredClone(regla);
    const ids = prescriptionIds?.flatMap((id) => (r.prescripciones.has(id) ? [r.prescripciones.get(id)!] : [])) ?? null;
    progression = { ...resto, prescriptionIds: ids && ids.length > 0 ? ids : null };
  }
  const warmUps = aproximacionesDelPreset(planificacion, r);
  return {
    contenido: {
      label: b.label,
      ...(b.purpose?.trim() ? { purpose: b.purpose } : {}),
      weeks,
      sessions,
      ...(days.length > 0 ? { days } : {}),
      ...(progression ? { progression } : {}),
      ...(warmUps.length > 0 ? { warmUps } : {}),
    },
    seQuita: [...r.seQuita],
    seGuardanEscritos: r.escritos,
  };
}

// ─── Aplicar ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** Lo que trae aplicar un preset: lo del plan con identificadores nuevos y lo que va en la planificación. */
export interface SesionAplicada {
  readonly sesion: SesionE;
  readonly aproximaciones: readonly AproximacionesDelEjercicio[];
  /** De la clave local a la nueva, para lo que la cite. */
  readonly prescripciones: ReadonlyMap<string, string>;
}

function sesionConIds(s: SesionDelPreset, nuevoId: () => string, prescripciones: Map<string, string>): SesionE {
  const grupos = new Map((s.exerciseGroups ?? []).map((g) => [g.groupId, nuevoId()] as const));
  return {
    sessionId: nuevoId(),
    label: s.label,
    ...(s.instructions ? { instructions: s.instructions } : {}),
    prescriptions: s.prescriptions.map((x) => {
      const id = nuevoId();
      prescripciones.set(x.prescriptionId, id);
      const { exerciseGroupId, ...resto } = structuredClone(x);
      return { ...resto, prescriptionId: id, ...(exerciseGroupId ? { exerciseGroupId: grupos.get(exerciseGroupId) ?? null } : {}) } as PrescripcionE;
    }),
    ...(s.exerciseGroups?.length ? { exerciseGroups: s.exerciseGroups.map((g) => ({ ...structuredClone(g), groupId: grupos.get(g.groupId)! })) } : {}),
  };
}

const aproximacionesConIds = (w: readonly AproximacionesDelEjercicio[] | undefined, ids: ReadonlyMap<string, string>): AproximacionesDelEjercicio[] =>
  (w ?? []).flatMap((a) => (ids.has(a.prescriptionId) ? [{ ...structuredClone(a), prescriptionId: ids.get(a.prescriptionId)! }] : []));

/** Un preset de sesión como sesión del plan, con identificadores nuevos. */
export function sesionDelPreset(c: PresetDeSesionContenido, nuevoId: () => string): SesionAplicada {
  const prescripciones = new Map<string, string>();
  const sesion = sesionConIds(c.session, nuevoId, prescripciones);
  return { sesion, aproximaciones: aproximacionesConIds(c.warmUps, prescripciones), prescripciones };
}

export interface FaseAplicada {
  readonly bloque: BloqueE & { readonly blockId: string };
  readonly semanas: number | null;
  readonly dias: readonly { readonly sessionId: string; readonly weekdays: readonly AgendaDeEntrenamiento['sessions'][number]['weekdays'][number][] }[];
  readonly progresion: ProgresionDeLaFase | null;
  readonly aproximaciones: readonly AproximacionesDelEjercicio[];
}

/** Un preset de fase como fase nueva del plan, con identificadores nuevos, y con el nombre que se le da (`nombre`). */
export function faseDelPreset(c: PresetDeFaseContenido, nombre: string, nuevoId: () => string): FaseAplicada {
  const prescripciones = new Map<string, string>();
  const sesiones = new Map<string, string>();
  const sessions = c.sessions.map((s) => {
    const nueva = sesionConIds(s, nuevoId, prescripciones);
    sesiones.set(s.sessionId, nueva.sessionId!);
    return nueva;
  });
  const blockId = nuevoId();
  const dias = (c.days ?? []).flatMap((d) => (sesiones.has(d.sessionId) ? [{ sessionId: sesiones.get(d.sessionId)!, weekdays: [...d.weekdays] }] : []));
  const progresion: ProgresionDeLaFase | null = c.progression
    ? { ...structuredClone(c.progression), blockId, prescriptionIds: c.progression.prescriptionIds ? c.progression.prescriptionIds.flatMap((k) => (prescripciones.has(k) ? [prescripciones.get(k)!] : [])) : null }
    : null;
  return {
    bloque: { blockId, label: nombre, ...(c.purpose ? { purpose: c.purpose } : {}), sessions },
    semanas: c.weeks,
    dias,
    progresion: progresion && progresion.prescriptionIds?.length === 0 ? { ...progresion, prescriptionIds: null } : progresion,
    aproximaciones: aproximacionesConIds(c.warmUps, prescripciones),
  };
}

// ─── La API ──────────────────────────────────────────────────────────────────────────────────────────────────────

/** El preset como estructura de un plan, para validarlo como tal (forma, criterios de intensidad y ejercicios del catálogo). */
export const estructuraDelPreset = (c: PresetDeSesionContenido | PresetDeFaseContenido): EstructuraDePlanDeEntrenamientoEntrada => ({
  blocks: [{ label: 'label' in c ? c.label : 'Preset', sessions: ('session' in c ? [c.session] : c.sessions) as SesionE[] }],
});

/** El código de un día, una aproximación o una progresión que cita una clave que el preset no tiene. */
export const REFERENCIA_DEL_PRESET_INEXISTENTE = 'PRESET_REFERENCE_UNKNOWN';

/**
 * Lo que cita claves que el preset no tiene: los días de una sesión, las aproximaciones o la progresión de un ejercicio.
 * Las rutas son las del contenido (`days[0].sessionId`). Vacío: todo cita lo que existe.
 */
export function referenciasDelPresetInexistentes(c: PresetDeSesionContenido | PresetDeFaseContenido): { readonly code: string; readonly path: string }[] {
  const sesiones = 'session' in c ? [c.session] : c.sessions;
  const ses = new Set(sesiones.map((s) => s.sessionId));
  const pre = new Set(sesiones.flatMap((s) => s.prescriptions.map((p) => p.prescriptionId)));
  const problemas: { code: string; path: string }[] = [];
  (c.warmUps ?? []).forEach((w, n) => {
    if (!pre.has(w.prescriptionId)) problemas.push({ code: REFERENCIA_DEL_PRESET_INEXISTENTE, path: `warmUps[${n}].prescriptionId` });
  });
  if (!('session' in c)) {
    (c.days ?? []).forEach((d, n) => {
      if (!ses.has(d.sessionId)) problemas.push({ code: REFERENCIA_DEL_PRESET_INEXISTENTE, path: `days[${n}].sessionId` });
    });
    (c.progression?.prescriptionIds ?? []).forEach((id, n) => {
      if (!pre.has(id)) problemas.push({ code: REFERENCIA_DEL_PRESET_INEXISTENTE, path: `progression.prescriptionIds[${n}]` });
    });
  }
  return problemas;
}

/**
 * Cómo se lee en la API lo guardado en la columna de siempre (PN-D08): con `kind` es un preset de sesión o de fase; sin él,
 * la prescripción habitual de antes de DL-203.
 */
export function presetPropioEnLaApi(guardado: unknown): { readonly kind: 'SERIES'; readonly prescription: unknown } | { readonly kind: 'SESION'; readonly session: unknown } | { readonly kind: 'FASE'; readonly phase: unknown } {
  const g = guardado as { kind?: unknown; contenido?: unknown } | null;
  if (g && typeof g === 'object' && g.kind === 'SESION') return { kind: 'SESION', session: g.contenido };
  if (g && typeof g === 'object' && g.kind === 'FASE') return { kind: 'FASE', phase: g.contenido };
  return { kind: 'SERIES', prescription: guardado };
}

/** Lo que se guarda en la columna: la prescripción tal cual (como antes), o el contenido con su nivel. */
export const presetPropioParaGuardar = (p: { kind?: 'SERIES' | 'SESION' | 'FASE'; prescription?: unknown; session?: unknown; phase?: unknown }): unknown =>
  p.kind === 'SESION' ? { kind: 'SESION', contenido: p.session } : p.kind === 'FASE' ? { kind: 'FASE', contenido: p.phase } : p.prescription;

/** Los ejercicios del catálogo que cita un preset de sesión o de fase (por versión), para pedir sus nombres y su 1RM. */
export const ejerciciosDelPreset = (c: PresetDeSesionContenido | PresetDeFaseContenido): string[] => [
  ...new Set(('session' in c ? [c.session] : c.sessions).flatMap((s) => s.prescriptions.map((p) => p.exerciseVersionId))),
];

/** «3 sesiones · 14 ejercicios · 4 semanas»: un preset de fase en un renglón. */
export function detalleDelPresetDeFase(c: PresetDeFaseContenido): string {
  const ejercicios = c.sessions.reduce((n, s) => n + s.prescriptions.length, 0);
  return [
    c.sessions.length === 1 ? '1 sesión' : `${c.sessions.length} sesiones`,
    ejercicios === 1 ? '1 ejercicio' : `${ejercicios} ejercicios`,
    ...(c.weeks ? [c.weeks === 1 ? '1 semana' : `${c.weeks} semanas`] : []),
    ...(c.progression?.model || c.progression?.deload ? ['con progresión'] : []),
  ].join(' · ');
}

/** «6 ejercicios · 22 series»: un preset de sesión en un renglón. */
export function detalleDelPresetDeSesion(c: PresetDeSesionContenido): string {
  const n = c.session.prescriptions.length;
  const series = c.session.prescriptions.reduce((t, p) => t + p.sets.filter((s) => s.setKind !== 'WARM_UP').length, 0);
  return [n === 1 ? '1 ejercicio' : `${n} ejercicios`, series === 1 ? '1 serie' : `${series} series`].join(' · ');
}
