// El cliente de la API en el render de Entrenamiento: datos SINTÉTICOS por escena (?escena=...). No hay red ni cuentas.
// - La sesión es «Piernas A» del paquete de Dirección (BE_Entrenamiento_Autonomo_2026-10-06, `datos/sesion_demo.json`):
//   sus tres ejercicios, sus nueve series y los objetivos de cada una. Lo común va en la prescripción y lo distinto en cada
//   serie, como lo cargaría el profesional; el objetivo efectivo lo resuelve el dominio (`objetivosEfectivos`), como la API.
// - Las imágenes son los tres PNG del paquete (salida/fotos), con la licencia, la autoría y la revisión de `CATALOGO.json`.
// - Los tiempos son eventos sintéticos con el ancla del «proceso» del render (shims/reloj-de-sesion.ts); los totales los
//   calcula el dominio (`calcularTiempos`), y los eventos nuevos se registran con su misma regla (`aplicarEventos`).
// - Cada respuesta se valida con el esquema estricto de su contrato en @be/domain: si no cumpliera, el render falla.
import {
  AccesoAMedioResponseSchema,
  aplicarEventos,
  BorradorDeEjecucionResponseSchema,
  calcularTiempos,
  HoyDeEntrenamientoResponseSchema,
  objetivosEfectivos,
  ResultadoDeEventosResponseSchema,
  SesionEnCursoResponseSchema,
  SesionParaRegistrarResponseSchema,
  TiemposDeSesionResponseSchema,
} from '@be/domain';
import catalogo from '@paquete-entrenamiento/ejercicios/CATALOGO.json';
import demo from '@paquete-entrenamiento/datos/sesion_demo.json';
import { AHORA_CIVIL, AHORA_MONOTONICO, ANCLA_DEL_PROCESO } from './reloj-de-sesion';

const parametros = new URLSearchParams(globalThis.location?.search ?? '');
const escena = parametros.get('escena') ?? 'sesion-serie-1';

type R = Promise<any>;
const ok = (datos: unknown): R => Promise.resolve({ ok: true, datos });
const nunca = (): R => new Promise(() => undefined);
const noEncontrado = (): R => Promise.resolve({ ok: false, tipo: 'API', status: 404, codigo: 'RESOURCE_NOT_FOUND', issues: [] });

const HOY = '2026-10-06';
const ZONA = 'America/Argentina/Buenos_Aires';
const PLAN = 'plan-sintetico-1';
const OCURRENCIA = 'occ_cGxhbi1zaW50ZXRpY28tMS5zZXNpb24tcGllcm5hcy1h';
const BORRADOR = 'borrador-sintetico-1';
const SESION = 'sesion-piernas-a';
const HUELLA = 'a'.repeat(64);

// ─── La sesión de «Piernas A», como la cargaría el profesional ─────────────────────────────────

const BASE_DE_CARGA: Record<string, string> = { 'Única mancuerna': 'SINGLE_IMPLEMENT', 'Por mancuerna; dos mancuernas': 'PER_IMPLEMENT', 'Carga externa total': 'TOTAL_EXTERNAL' };
const BASE_DE_REPETICIONES: Record<string, string> = { 'Por serie': 'PER_SET', 'Por pierna, no duplicar automáticamente': 'PER_SIDE' };
const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const PRESCRIPCIONES = demo.exercises.map((e, i) => {
  const ficha = catalogo.assets.find((a) => a.fixtureKey === e.catalogFixtureKey)!;
  const primera = e.sets[0]!;
  const conRir = e.sets.some((s) => s.plannedRir !== null);
  // Lo común (lo de la primera serie) en la prescripción; cada serie declara solo lo que cambia, o `null` si lo quita.
  const declaradas = e.sets.map((s, j) => {
    const serie: Record<string, unknown> = { repetitions: s.plannedRepetitions };
    if (j > 0) {
      if (conRir && s.plannedRir !== primera.plannedRir) serie.rir = s.plannedRir;
      if (!igual(s.suggestedLoad, primera.suggestedLoad)) serie.suggestedLoad = s.suggestedLoad;
      if (s.recommendedRestSeconds !== primera.recommendedRestSeconds) serie.restSeconds = s.recommendedRestSeconds;
    }
    return serie;
  });
  const intensidad = conRir ? { criterion: 'RIR' as const, target: { value: primera.plannedRir as number, reference: null } } : null;
  const objetivos = objetivosEfectivos({ intensity: intensidad, suggestedLoad: primera.suggestedLoad as any, restSeconds: primera.recommendedRestSeconds, sets: declaradas as any });
  const exerciseVersionId = `version-${e.catalogFixtureKey}`;
  return {
    prescriptionId: `prescripcion-${e.fixtureKey.toLowerCase()}`,
    order: i + 1,
    exerciseId: `ejercicio-${e.catalogFixtureKey}`,
    exerciseVersionId,
    exerciseName: ficha.name,
    image: {
      mediaId: `imagen-${e.catalogFixtureKey}`,
      imageVersion: 1,
      exerciseVersionId,
      provenance: 'AI_GENERATED',
      authorship: ficha.origin,
      license: { kind: 'NO_EXTERNAL_LICENSE', usage: ficha.usage },
      technicalReview: 'PENDING_PROFESSIONAL_REVIEW',
      altText: ficha.alt,
      associatedAt: '2026-10-06T13:00:00.000Z',
    },
    sets: e.sets.map((s, j) => {
      const o = objetivos[j]!;
      // Lo declarado por la serie (con sus tres estados) y el objetivo efectivo; las repeticiones van en `target`.
      const { repetitions: _repeticiones, ...propios } = declaradas[j]!;
      return { setIndex: s.setIndex, note: null, ...propios, target: { repetitions: o.repetitions, rir: o.rir, suggestedLoad: o.suggestedLoad, restSeconds: o.restSeconds }, targetOrigin: o.origin };
    }),
    intensity: intensidad,
    suggestedLoad: primera.suggestedLoad,
    restSeconds: primera.recommendedRestSeconds,
    loadBasis: BASE_DE_CARGA[e.loadBasis] ?? null,
    repetitionBasis: BASE_DE_REPETICIONES[e.repetitionBasis] ?? null,
    professionalParameters: [],
    note: null,
  };
});
const SESION_CON_OBJETIVOS = { sessionId: SESION, label: demo.name, order: 1, instructions: null, prescriptions: PRESCRIPCIONES };

/** La misma sesión como la lee «Hoy» (API-TRN-14): la forma vieja, con lo general de cada prescripción. */
export const SESION_DE_LA_OCURRENCIA = {
  sessionId: SESION,
  label: demo.name,
  order: 1,
  instructions: null,
  blockId: 'bloque-1',
  blockLabel: 'Bloque 1',
  microcycleId: null,
  microcycleLabel: null,
  prescriptions: PRESCRIPCIONES.map((p) => ({
    prescriptionId: p.prescriptionId,
    order: p.order,
    exerciseId: p.exerciseId,
    exerciseVersionId: p.exerciseVersionId,
    exerciseName: p.exerciseName,
    sets: p.sets.map((s: any) => ({ setIndex: s.setIndex, repetitions: s.target.repetitions, note: null })),
    intensity: p.intensity,
    suggestedLoad: p.suggestedLoad,
    professionalParameters: [],
    note: null,
  })),
};

export const DATOS = { draftId: BORRADOR, occurrenceId: OCURRENCIA, fecha: HOY, sesion: SESION_DE_LA_OCURRENCIA, etiqueta: demo.name };
const [A, B, C] = PRESCRIPCIONES.map((p) => p.prescriptionId) as [string, string, string];
const recomendado = (id: string, n: number) => (PRESCRIPCIONES.find((p) => p.prescriptionId === id)?.sets as any[] | undefined)?.find((s) => s.setIndex === n)?.target.restSeconds ?? null;

// ─── El borrador de cada escena ─────────────────────────────────────────────────────────────────

/** Las series registradas de muestra del paquete (`sampleRecordedSets`), y las del rumano para la escena de la zancada. */
const MUESTRA_A = demo.sampleRecordedSets.map((s) => ({ setIndex: s.setIndex, load: s.actualLoad, completedRepetitions: s.actualRepetitions, rir: s.actualRir, perceivedExertion: null }));
const MUESTRA_B = [
  { setIndex: 1, load: { value: 10, unit: 'kg' }, completedRepetitions: 12, rir: 3, perceivedExertion: null },
  { setIndex: 2, load: { value: 12, unit: 'kg' }, completedRepetitions: 10, rir: 2.5, perceivedExertion: null },
  { setIndex: 3, load: { value: 12, unit: 'kg' }, completedRepetitions: 9, rir: 2, perceivedExertion: null },
];

function registrado(id: string, sets: unknown[]) {
  const p = PRESCRIPCIONES.find((x) => x.prescriptionId === id)!;
  return { prescriptionId: id, prescribedExerciseVersionId: p.exerciseVersionId, prescribedExerciseName: p.exerciseName, performedExerciseVersionId: p.exerciseVersionId, performedExerciseName: p.exerciseName, substituted: false, sets, executionSummary: null };
}

function ejerciciosDeLaEscena(): unknown[] {
  if (escena.startsWith('sesion-descanso')) return [registrado(A, MUESTRA_A.slice(0, 1))];
  if (escena.startsWith('sesion-resumen')) return [registrado(A, MUESTRA_A)];
  if (escena.startsWith('sesion-sin-objetivo')) return [registrado(A, MUESTRA_A), registrado(B, MUESTRA_B)];
  return [];
}

let numeroDeVersion = 1;
let borrador: any = {
  draftId: BORRADOR,
  version: 'v1',
  state: 'DRAFT',
  occurrenceId: OCURRENCIA,
  date: HOY,
  timeZone: ZONA,
  planId: PLAN,
  sessionId: SESION,
  granularity: ejerciciosDeLaEscena().length > 0 ? 'SET' : null,
  sessionCondition: null,
  reason: null,
  exercises: ejerciciosDeLaEscena(),
  sessionSummary: null,
  occurredAt: null,
  executionId: null,
  createdAt: new Date(AHORA_CIVIL - 20 * 60_000).toISOString(),
  updatedAt: new Date(AHORA_CIVIL - 60_000).toISOString(),
};

// ─── Los tiempos de cada escena ─────────────────────────────────────────────────────────────────

/** Un instante medido por el «proceso» del render, `segundos` antes de ahora. */
const antes = (segundos: number) => ({ civil: new Date(AHORA_CIVIL - segundos * 1000).toISOString(), monotonic: { anchor: ANCLA_DEL_PROCESO, ms: AHORA_MONOTONICO - segundos * 1000 }, source: 'MONOTONIC' as const });

function corrida(pasos: Record<string, unknown>[]) {
  return pasos.map((p, i) => ({ compoundActionId: null, ...p, eventId: `evento-del-render-${String(i + 1).padStart(3, '0')}`, runId: 'corrida-del-render', sequence: i + 1 }));
}

function eventosDeLaEscena(): any[] {
  if (escena.startsWith('entrenamiento-')) return [];
  if (escena.startsWith('sesion-descanso')) {
    return corrida([
      { type: 'SESSION_STARTED', at: antes(545), compoundActionId: 'accion-inicio' },
      { type: 'EXERCISE_ACTIVATED', prescriptionId: A, at: antes(545), compoundActionId: 'accion-inicio' },
      { type: 'REST_STARTED', restId: 'descanso-a1', prescriptionId: A, setIndex: 1, at: antes(48) },
    ]);
  }
  if (escena.startsWith('sesion-resumen')) {
    return corrida([
      { type: 'SESSION_STARTED', at: antes(750), compoundActionId: 'accion-inicio' },
      { type: 'EXERCISE_ACTIVATED', prescriptionId: A, at: antes(750), compoundActionId: 'accion-inicio' },
      { type: 'SET_TIMING_STARTED', timingId: 'serie-a1', prescriptionId: A, setIndex: 1, at: antes(740) },
      { type: 'SET_TIMING_FINISHED', timingId: 'serie-a1', at: antes(700) },
      { type: 'REST_STARTED', restId: 'descanso-a1', prescriptionId: A, setIndex: 1, at: antes(695) },
      { type: 'REST_FINISHED', restId: 'descanso-a1', at: antes(605) },
      { type: 'REST_STARTED', restId: 'descanso-a2', prescriptionId: A, setIndex: 2, at: antes(480) },
      { type: 'REST_FINISHED', restId: 'descanso-a2', at: antes(345) },
    ]);
  }
  if (escena.startsWith('sesion-sin-objetivo')) {
    return corrida([
      { type: 'SESSION_STARTED', at: antes(1500), compoundActionId: 'accion-inicio' },
      { type: 'EXERCISE_ACTIVATED', prescriptionId: A, at: antes(1500), compoundActionId: 'accion-inicio' },
      { type: 'EXERCISE_ACTIVATED', prescriptionId: B, at: antes(900) },
      { type: 'EXERCISE_ACTIVATED', prescriptionId: C, at: antes(300) },
    ]);
  }
  // La serie 1 de la sentadilla goblet, con la sesión empezada hace 6:40.
  return corrida([
    { type: 'SESSION_STARTED', at: antes(400), compoundActionId: 'accion-inicio' },
    { type: 'EXERCISE_ACTIVATED', prescriptionId: A, at: antes(400), compoundActionId: 'accion-inicio' },
  ]);
}

const eventosDelServidor: any[] = eventosDeLaEscena();
const CONTEXTO = { prescripciones: new Set([A, B, C]), otraSesionEnCurso: false };

function tiempos() {
  return TiemposDeSesionResponseSchema.parse({
    data: {
      ...calcularTiempos(eventosDelServidor, recomendado),
      draftId: BORRADOR,
      occurrenceId: OCURRENCIA,
      executionId: null,
      events: eventosDelServidor.map((event) => ({ event, receivedAt: event.at.civil })),
    },
  }).data;
}

// ─── «Hoy» (API-TRN-14) ─────────────────────────────────────────────────────────────────────────

function hoy() {
  return HoyDeEntrenamientoResponseSchema.parse({
    data: {
      date: HOY,
      timeZone: ZONA,
      planState: 'AVAILABLE',
      activePlan: { planId: PLAN, trainingPlanId: 'plan-de-entrenamiento-sintetico', snapshotVersion: HUELLA, activatedAt: '2026-10-06T13:30:00.000Z' },
      occurrences: [
        {
          occurrenceId: OCURRENCIA,
          date: HOY,
          planId: PLAN,
          plannedSession: SESION_DE_LA_OCURRENCIA,
          execution: { state: 'NOT_STARTED', draftId: null, executionId: null, sessionCondition: null },
        },
      ],
    },
  });
}

/** Cada medio, con el archivo que lo dibuja en el render. La ruta firmada es sintética. */
const ARCHIVO: Record<string, string> = Object.fromEntries(catalogo.assets.map((a) => [`imagen-${a.fixtureKey}`, `fotos/${a.image.split('/').pop()}`]));

export const api = {
  urlDe: (ruta: string): string => ARCHIVO[ruta.replace('/media/content/', '')] ?? 'fotos/no-existe.png',
  accederAMedio: (_t: string, mediaId: string): R => ok(AccesoAMedioResponseSchema.parse({ data: { mediaId, path: `/media/content/${mediaId}`, expiresAt: new Date(Date.now() + 15 * 60_000).toISOString() } })),
  hoyDeEntrenamiento: (): R => ok(hoy()),
  sesionEnCurso: (): R => ok(SesionEnCursoResponseSchema.parse({ data: { inProgress: null } })),
  sesionParaRegistrar: (): R => ok(SesionParaRegistrarResponseSchema.parse({ data: { occurrenceId: OCURRENCIA, date: HOY, timeZone: ZONA, planId: PLAN, snapshotDigest: HUELLA, imagesAsOf: new Date(AHORA_CIVIL).toISOString(), session: SESION_CON_OBJETIVOS } })),
  abrirBorradorDeEjecucion: (): R => ok(BorradorDeEjecucionResponseSchema.parse({ data: borrador })),
  consultarBorradorDeEjecucion: (): R => ok(BorradorDeEjecucionResponseSchema.parse({ data: borrador })),
  guardarBorradorDeEjecucion: (_t: string, _d: string, cuerpo: { expectedVersion: string; changes: Record<string, any> }): R => {
    if (cuerpo.expectedVersion !== borrador.version) return Promise.resolve({ ok: false, tipo: 'API', status: 409, codigo: 'VERSION_CONFLICT', issues: [] });
    const c = cuerpo.changes;
    numeroDeVersion += 1;
    borrador = {
      ...borrador,
      ...('granularity' in c ? { granularity: c.granularity } : {}),
      ...('sessionCondition' in c ? { sessionCondition: c.sessionCondition } : {}),
      ...('reason' in c ? { reason: c.reason } : {}),
      ...('occurredAt' in c ? { occurredAt: c.occurredAt } : {}),
      ...('sessionSummary' in c ? { sessionSummary: c.sessionSummary } : {}),
      ...('exercises' in c ? { exercises: c.exercises.map((e: any) => registrado(e.prescriptionId, e.sets ?? [])) } : {}),
      version: `v${numeroDeVersion}`,
      updatedAt: new Date().toISOString(),
    };
    return ok(BorradorDeEjecucionResponseSchema.parse({ data: borrador }));
  },
  tiemposDelBorrador: (): R => ok({ data: tiempos() }),
  registrarEventosDeTiempo: (_t: string, _d: string, cuerpo: { events: any[] }): R => {
    const { resultados, aRegistrar } = aplicarEventos(eventosDelServidor, cuerpo.events, CONTEXTO);
    eventosDelServidor.push(...aRegistrar);
    return ok(ResultadoDeEventosResponseSchema.parse({ data: { results: resultados, timing: tiempos() } }));
  },
  ocurrenciasDeEntrenamiento: (): R => nunca(),
  confirmarEjecucion: (): R => nunca(),
  consultarEjecucionDeEntrenamiento: (): R => noEncontrado(),
  tiemposDeLaEjecucion: (): R => noEncontrado(),
  misEjecucionesDeEntrenamiento: (): R => nunca(),
  listarPlanesDeEntrenamiento: (): R => nunca(),
  consultarCuenta: (): R => nunca(),
};
export const apiConfigurada = true;
export const extra = {};
export const nuevaClaveDeIdempotencia = () => `apk-render-${Math.random().toString(36).slice(2, 10)}`;
