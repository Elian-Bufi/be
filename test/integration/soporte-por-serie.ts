/**
 * Soporte e2e de WP-ENTRENAMIENTO-SERIES (DL-122 a DL-124). Todo pasa por la API real, con datos sintéticos y con los datos
 * del paquete de Dirección `BE_Entrenamiento_Autonomo_2026-10-06`, leídos del repositorio: la sesión «Piernas A» con sus
 * objetivos por serie (`sesion_demo.json`), las tres imágenes con su catálogo (`ejercicios/`) y los casos de tiempos
 * (`casos_tiempos.json`). Los números salen del paquete, no de estas pruebas.
 *
 * El titular usa la APK que muestra el objetivo de cada serie y lo declara (`X-BE-Capabilities`; DL-122, precierre del
 * 2026-10-06): sin eso, «Piernas A» no se activa ni se le entrega. Las APK instaladas, que no lo declaran, se prueban en
 * `compatibilidad-de-clientes.int-spec.ts`.
 */
import type { INestApplication } from '@nestjs/common';
import { CAPACIDAD_OBJETIVOS_POR_SERIE, HEADER_DE_CAPACIDADES, valorDeCapacidades, type BaseDelRelojApi, type EventoDeTiempo, type InstanteDeEventoApi } from '@be/domain';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { RAIZ } from './soporte';
import { claveDeIdempotencia, conSesion } from './soporte-api';
import { circuitoListoParaPlanificarEntrenamiento, type CircuitoParaPlanificar } from './soporte-entrenamiento';
import { subirImagen } from './soporte-recetas';
import type { Parte } from './soporte-vinculo';

export const PAQUETE_DE_ENTRENAMIENTO = join(RAIZ, 'docs', 'fuente_entrenamiento', 'BE_Entrenamiento_Autonomo_2026-10-06');
const leer = <T>(ruta: string): T => JSON.parse(readFileSync(join(PAQUETE_DE_ENTRENAMIENTO, ruta), 'utf8')) as T;

// ─── El paquete ──────────────────────────────────────────────────────────────────────────────────

type Carga = { value: number; unit: 'kg' | 'lb' };
export interface SerieDeLaDemo {
  setIndex: number;
  plannedRepetitions: { min: number; max: number } | { value: number };
  suggestedLoad: Carga | null;
  plannedRir: number | null;
  recommendedRestSeconds: number | null;
}
export interface EjercicioDeLaDemo {
  fixtureKey: string;
  catalogFixtureKey: string;
  loadBasis: string;
  repetitionBasis: string;
  sets: SerieDeLaDemo[];
}
export interface SerieRegistradaDeLaDemo {
  exerciseFixtureKey: string;
  setIndex: number;
  actualLoad: Carga | null;
  actualRepetitions: number | null;
  actualRir: number | null;
}
export const SESION_DEMO = leer<{ name: string; exercises: EjercicioDeLaDemo[]; sampleRecordedSets: SerieRegistradaDeLaDemo[] }>('datos/sesion_demo.json');

export interface ImagenDelPaquete {
  fixtureKey: string;
  name: string;
  image: string;
  alt: string;
  origin: string;
  generationMethod: string;
  technicalReviewStatus: string;
  usage: string;
  externalLicenseIdentifier: string | null;
}
export const IMAGENES_DEL_PAQUETE = leer<{ assets: ImagenDelPaquete[] }>('ejercicios/CATALOGO.json').assets;
export const bytesDe = (imagen: ImagenDelPaquete): Buffer => readFileSync(join(PAQUETE_DE_ENTRENAMIENTO, imagen.image));

export interface CasoDeTiempo {
  id: string;
  kind: string;
  start: number | null;
  end: number | null;
  target?: number | null;
  pauses?: [number, number][];
  exerciseSpans?: { exercise: string; start: number; end: number }[];
  expected: Record<string, unknown>;
}
const CASOS_DE_TIEMPOS = leer<{ cases: CasoDeTiempo[] }>('datos/casos_tiempos.json').cases;
export const caso = (id: string): CasoDeTiempo => {
  const c = CASOS_DE_TIEMPOS.find((x) => x.id === id);
  if (!c) throw new Error(`caso de tiempos inexistente: ${id}`);
  return c;
};

/** Las bases del paquete, escritas en palabras, como tokens del contrato. Se reconoce el comienzo de la frase. */
export function baseDeCarga(texto: string): 'SINGLE_IMPLEMENT' | 'PER_IMPLEMENT' | 'TOTAL_EXTERNAL' {
  if (texto.startsWith('Única mancuerna')) return 'SINGLE_IMPLEMENT';
  if (texto.startsWith('Por mancuerna')) return 'PER_IMPLEMENT';
  if (texto.startsWith('Carga externa total')) return 'TOTAL_EXTERNAL';
  throw new Error(`base de carga desconocida: ${texto}`);
}
export function baseDeRepeticiones(texto: string): 'PER_SET' | 'PER_SIDE' {
  if (texto.startsWith('Por serie')) return 'PER_SET';
  if (texto.startsWith('Por pierna')) return 'PER_SIDE';
  throw new Error(`base de repeticiones desconocida: ${texto}`);
}
/** El estado de revisión del catálogo del paquete, como token del contrato. */
export const revisionTecnica = (texto: string): 'PENDING_PROFESSIONAL_REVIEW' | 'REVIEWED_BY_PROFESSIONAL' =>
  texto === 'PENDIENTE_REVISION_PROFESIONAL' ? 'PENDING_PROFESSIONAL_REVIEW' : 'REVIEWED_BY_PROFESSIONAL';

export const prescripcionIdDe = (e: EjercicioDeLaDemo): string => `rx-${e.fixtureKey.toLowerCase()}`;
export const SESION_ID = 'piernas-a';

/**
 * Una prescripción de «Piernas A» como la cargaría el profesional: lo común va en la prescripción (lo de la primera serie
 * que lo declara) y cada serie dice solo lo distinto, con `null` donde no tiene ese objetivo aunque la prescripción sí.
 * Sin RIR en ninguna serie, la prescripción no declara criterio: un RIR por serie exige el criterio RIR (REG-06-128).
 */
export function prescripcionDeLaDemo(e: EjercicioDeLaDemo, exerciseVersionId: string): Record<string, unknown> & { sets: Record<string, unknown>[] } {
  const primera = e.sets[0]!;
  const rirComun = e.sets.find((s) => s.plannedRir !== null)?.plannedRir ?? null;
  const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  return {
    prescriptionId: prescripcionIdDe(e),
    exerciseVersionId,
    intensity: rirComun === null ? null : { criterion: 'RIR', target: { value: rirComun } },
    suggestedLoad: primera.suggestedLoad,
    restSeconds: primera.recommendedRestSeconds,
    loadBasis: baseDeCarga(e.loadBasis),
    repetitionBasis: baseDeRepeticiones(e.repetitionBasis),
    sets: e.sets.map((s) => ({
      repetitions: s.plannedRepetitions,
      ...(rirComun !== null && !igual(s.plannedRir, rirComun) ? { rir: s.plannedRir } : {}),
      ...(!igual(s.suggestedLoad, primera.suggestedLoad) ? { suggestedLoad: s.suggestedLoad } : {}),
      ...(!igual(s.recommendedRestSeconds, primera.recommendedRestSeconds) ? { restSeconds: s.recommendedRestSeconds } : {}),
    })),
  };
}

/** El objetivo efectivo de cada serie según el paquete: lo que tienen que devolver SER-01 y SER-02. */
export const objetivoDeLaDemo = (s: SerieDeLaDemo) => ({
  repetitions: s.plannedRepetitions,
  rir: s.plannedRir,
  suggestedLoad: s.suggestedLoad,
  restSeconds: s.recommendedRestSeconds,
});

// ─── Ejercicios propios y plan ───────────────────────────────────────────────────────────────────

export interface EjercicioCreado {
  readonly exerciseId: string;
  readonly versionId: string;
}

/** Los tres ejercicios de la demostración, cargados a mano por el profesional (API-INT-TRN-01), con el nombre del catálogo del paquete. */
export async function ejerciciosDeLaDemo(app: INestApplication, pro: Parte): Promise<Map<string, EjercicioCreado>> {
  const creados = new Map<string, EjercicioCreado>();
  for (const e of SESION_DEMO.exercises) {
    const imagen = IMAGENES_DEL_PAQUETE.find((i) => i.fixtureKey === e.catalogFixtureKey)!;
    const r = await conSesion(app, pro.token)
      .post('/api/v1/training/exercises')
      .send({ name: imagen.name, muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } })
      .expect(201);
    creados.set(e.catalogFixtureKey, { exerciseId: r.body.data.exerciseId as string, versionId: r.body.data.versionId as string });
  }
  return creados;
}

/** La estructura de «Piernas A» con sus objetivos por serie; `extra` suma sesiones (por ejemplo, para otra sesión en curso). */
export function estructuraDeLaDemo(ejercicios: ReadonlyMap<string, EjercicioCreado>, extra: Record<string, unknown>[] = []): { blocks: Record<string, unknown>[] } {
  return {
    blocks: [
      {
        label: 'Bloque de la demostración',
        sessions: [
          { sessionId: SESION_ID, label: SESION_DEMO.name, prescriptions: SESION_DEMO.exercises.map((e) => prescripcionDeLaDemo(e, ejercicios.get(e.catalogFixtureKey)!.versionId)) },
          ...extra,
        ],
      },
    ],
  };
}

export interface PlanDeLaDemo extends CircuitoParaPlanificar {
  readonly ejercicios: Map<string, EjercicioCreado>;
  readonly planId: string;
  /** Las respuestas de API-TRN-07 y 10, para las pruebas de compatibilidad (C01). */
  readonly creado: Record<string, unknown>;
  readonly guardado: Record<string, unknown>;
  readonly version: string;
}

/**
 * El borrador de «Piernas A»: TRN-07 sin estructura y TRN-10 con los objetivos por serie, como guarda el editor. Antes, el
 * titular abre «Hoy» con la APK que muestra los objetivos de cada serie (`usarLaApk`), como en la demostración: sin eso el
 * plan no se activa. `apk: false` deja al titular sin haberla usado (las pruebas de compatibilidad).
 */
export async function borradorDeLaDemo(app: INestApplication, etiqueta: string, extra: Record<string, unknown>[] = [], opciones: { apk?: boolean } = {}): Promise<PlanDeLaDemo> {
  const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta);
  if (opciones.apk !== false) await usarLaApk(app, c.ase);
  const ejercicios = await ejerciciosDeLaDemo(app, c.pro);
  const creado = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/training/plans`).send({ objectiveVersionId: c.objectiveVersionId }).expect(201);
  const guardado = await conSesion(app, c.pro.token)
    .patch(`/api/v1/training/plans/${creado.body.data.planId}`)
    .send({ expectedVersion: creado.body.data.version, changes: estructuraDeLaDemo(ejercicios, extra) })
    .expect(200);
  return { ...c, ejercicios, planId: guardado.body.data.planId as string, creado: creado.body, guardado: guardado.body, version: guardado.body.data.version as string };
}

/** La activación por la API (API-TRN-12). */
export function activar(app: INestApplication, plan: PlanDeLaDemo, version = plan.version, clave = claveDeIdempotencia()) {
  return conSesion(app, plan.pro.token).post(`/api/v1/training/plans/${plan.planId}/activate`, clave).send({ expectedVersion: version });
}

// ─── La APK que muestra los objetivos por serie (DL-122, precierre del 2026-10-06) ──────────────────────

/** El valor de `X-BE-Capabilities` de la APK que muestra el objetivo de cada serie. */
export const CAPACIDADES_DE_LA_APK = valorDeCapacidades([CAPACIDAD_OBJETIVOS_POR_SERIE]);

/**
 * Los pedidos del titular desde la APK que muestra el objetivo de cada serie: los de `conSesion`, con la capacidad
 * declarada. `capacidades` cambia el valor de la cabecera (por ejemplo, solo capacidades que la API no conoce).
 */
export function conLaApk(app: INestApplication, token: string, capacidades = CAPACIDADES_DE_LA_APK) {
  const s = conSesion(app, token);
  return {
    get: (ruta: string) => s.get(ruta).set(HEADER_DE_CAPACIDADES, capacidades),
    delete: (ruta: string) => s.delete(ruta).set(HEADER_DE_CAPACIDADES, capacidades),
    post: (ruta: string, clave?: string) => s.post(ruta, clave).set(HEADER_DE_CAPACIDADES, capacidades),
    patch: (ruta: string) => s.patch(ruta).set(HEADER_DE_CAPACIDADES, capacidades),
    put: (ruta: string, clave?: string) => s.put(ruta, clave).set(HEADER_DE_CAPACIDADES, capacidades),
  };
}

/** El titular abre «Hoy» (API-TRN-14) con esa APK: la API registra que usa un cliente que muestra los objetivos por serie. */
export async function usarLaApk(app: INestApplication, ase: Parte): Promise<void> {
  await conLaApk(app, ase.token).get('/api/v1/me/training/today').expect(200);
}

/** La ocurrencia de hoy de una sesión del plan (API-TRN-14), como la lee la APK que muestra los objetivos por serie. */
export async function ocurrenciaDeHoy(app: INestApplication, ase: Parte, sesionId = SESION_ID): Promise<string> {
  const hoy = await conLaApk(app, ase.token).get('/api/v1/me/training/today').expect(200);
  const o = (hoy.body.data.occurrences as { occurrenceId: string; plannedSession: { sessionId: string } }[]).find((x) => x.plannedSession.sessionId === sesionId);
  if (!o) throw new Error(`sin ocurrencia de hoy para ${sesionId}`);
  return o.occurrenceId;
}

/** El borrador de la ocurrencia (API-TRN-15), abierto desde la APK que muestra los objetivos por serie. */
export async function abrirBorrador(app: INestApplication, ase: Parte, occurrenceId: string): Promise<{ draftId: string; version: string }> {
  const r = await conLaApk(app, ase.token).put(`/api/v1/training/occurrences/${occurrenceId}/execution-draft`).send({});
  if (r.status !== 200 && r.status !== 201) throw new Error(`TRN-15 respondió ${r.status}: ${JSON.stringify(r.body)}`);
  return { draftId: r.body.data.draftId as string, version: r.body.data.version as string };
}

/** Lo registrado de la demostración (`sampleRecordedSets`) para API-TRN-17: cada valor tal como vino, nada se completa. */
export function registroDeLaDemo(ejercicios: ReadonlyMap<string, EjercicioCreado>): Record<string, unknown> {
  const porEjercicio = new Map<string, SerieRegistradaDeLaDemo[]>();
  for (const s of SESION_DEMO.sampleRecordedSets) porEjercicio.set(s.exerciseFixtureKey, [...(porEjercicio.get(s.exerciseFixtureKey) ?? []), s]);
  return {
    granularity: 'SET',
    sessionCondition: 'COMPLETED',
    exercises: [...porEjercicio].map(([clave, series]) => {
      const e = SESION_DEMO.exercises.find((x) => x.fixtureKey === clave)!;
      return {
        prescriptionId: prescripcionIdDe(e),
        performedExerciseVersionId: ejercicios.get(e.catalogFixtureKey)!.versionId,
        sets: series.map((s) => ({ setIndex: s.setIndex, load: s.actualLoad, completedRepetitions: s.actualRepetitions, rir: s.actualRir, perceivedExertion: null })),
      };
    }),
  };
}

/** TRN-17 con lo registrado de la demostración y TRN-18: la ejecución queda registrada. */
export async function registrarYConfirmar(app: INestApplication, plan: PlanDeLaDemo, borrador: { draftId: string; version: string }): Promise<{ executionId: string; recordedAt: string; guardado: Record<string, unknown>; confirmado: Record<string, unknown> }> {
  const apk = conSesion(app, plan.ase.token);
  const guardado = await apk.patch(`/api/v1/training/execution-drafts/${borrador.draftId}`).send({ expectedVersion: borrador.version, changes: registroDeLaDemo(plan.ejercicios) }).expect(200);
  const confirmado = await apk.post(`/api/v1/training/execution-drafts/${borrador.draftId}/confirm`, claveDeIdempotencia()).send({ expectedVersion: guardado.body.data.version }).expect(201);
  return { executionId: confirmado.body.data.executionId as string, recordedAt: confirmado.body.data.recordedAt as string, guardado: guardado.body, confirmado: confirmado.body };
}

// ─── Imágenes (DL-123) ───────────────────────────────────────────────────────────────────────────

/** La autoría declarada de una imagen del paquete: su origen y su método de generación. */
export const autoriaDe = (imagen: ImagenDelPaquete): string => `${imagen.origin} (${imagen.generationMethod})`;

/** API-MED-01 y 02 con la finalidad de la imagen de un ejercicio, procedencia IA y autoría declarada. */
export function subirImagenDeEjercicio(app: INestApplication, pro: Parte, imagen: ImagenDelPaquete) {
  return subirImagen(app, pro, bytesDe(imagen), { contentType: 'image/png', purpose: 'EXERCISE_REFERENCE', provenance: 'AI_GENERATED', authorship: autoriaDe(imagen) });
}

/** El cuerpo de API-EJE-02 para una imagen del paquete: sin licencia externa, con el uso del catálogo y su revisión. */
export function cuerpoDeImagen(imagen: ImagenDelPaquete, exerciseVersionId: string, mediaId: string, expectedImageVersion: number): Record<string, unknown> {
  return {
    exerciseVersionId,
    mediaId,
    expectedImageVersion,
    altText: imagen.alt,
    license: { kind: 'NO_EXTERNAL_LICENSE', usage: imagen.usage },
    technicalReview: revisionTecnica(imagen.technicalReviewStatus),
  };
}

export function asociarImagen(app: INestApplication, pro: Parte, exerciseId: string, cuerpo: Record<string, unknown>, clave = claveDeIdempotencia()) {
  return conSesion(app, pro.token).put(`/api/v1/training/exercises/${exerciseId}/image`, clave).send(cuerpo);
}

export function retirarImagen(app: INestApplication, pro: Parte, exerciseId: string, query: string, clave = claveDeIdempotencia()) {
  return conSesion(app, pro.token).delete(`/api/v1/training/exercises/${exerciseId}/image${query}`).set('Idempotency-Key', clave);
}

// ─── Tiempos (DL-124) ────────────────────────────────────────────────────────────────────────────

/**
 * Un instante monotónico de `ancla`, `s` segundos después de `base`; el civil avanza igual. Por defecto, con el reloj del
 * proceso (`PROCESS_MONOTONIC`), el que tenían estos instantes antes de que el contrato pidiera la base: con él, el
 * dominio calcula exactamente como antes. `reloj` pide el reloj desde el arranque (`ELAPSED_SINCE_BOOT`).
 */
export const monotonico = (base: number, s: number, ancla = 'proceso-de-la-prueba', reloj: BaseDelRelojApi = 'PROCESS_MONOTONIC'): InstanteDeEventoApi => ({
  civil: new Date(base + s * 1000).toISOString(),
  monotonic: { anchor: ancla, ms: 5_000 + s * 1000, clock: reloj },
  source: 'MONOTONIC',
});

/** Un paso de la corrida: el evento sin su identidad, en el segundo `s` desde el inicio. */
type SinIdentidad<E> = E extends unknown ? Omit<E, 'eventId' | 'runId' | 'sequence' | 'compoundActionId' | 'at'> : never;
export type Paso = { s: number; evento: SinIdentidad<EventoDeTiempo> };

/** Arma eventos con secuencia e identificadores correlativos desde `primera`; cada dispositivo genera los suyos. */
export function corrida(pasos: readonly Paso[], base: number, runId: string, primera = 1, ancla?: string, reloj?: BaseDelRelojApi): EventoDeTiempo[] {
  return pasos.map(
    (p, i) => ({ ...p.evento, eventId: `${runId}-${String(primera + i).padStart(3, '0')}`, runId, sequence: primera + i, compoundActionId: null, at: monotonico(base, p.s, ancla, reloj) }) as EventoDeTiempo,
  );
}

/**
 * El ejemplo reproducible principal de DECISIONES_Y_TIEMPOS.md, armado con los casos del paquete: la sesión, la pausa y
 * los tramos de cada ejercicio (T08), la serie A1 medida (T01) y los descansos tras A1 y A2 (T04 y T05).
 */
export function pasosDelEjemplo(a: string, b: string): Paso[] {
  const sesion = caso('T08');
  const serie = caso('T01');
  const [descansoA1, descansoA2] = [caso('T04'), caso('T05')];
  const [tramoA, tramoB] = sesion.exerciseSpans!;
  const [pausa] = sesion.pauses!;
  const pasos: Paso[] = [
    { s: sesion.start!, evento: { type: 'SESSION_STARTED' } },
    { s: tramoA!.start, evento: { type: 'EXERCISE_ACTIVATED', prescriptionId: a } },
    { s: serie.start!, evento: { type: 'SET_TIMING_STARTED', timingId: 'serie-a1-medida', prescriptionId: a, setIndex: 1 } },
    { s: serie.end!, evento: { type: 'SET_TIMING_FINISHED', timingId: 'serie-a1-medida' } },
    { s: descansoA1.start!, evento: { type: 'REST_STARTED', restId: 'descanso-a1', prescriptionId: a, setIndex: 1 } },
    { s: descansoA1.end!, evento: { type: 'REST_FINISHED', restId: 'descanso-a1' } },
    { s: descansoA2.start!, evento: { type: 'REST_STARTED', restId: 'descanso-a2', prescriptionId: a, setIndex: 2 } },
    { s: descansoA2.end!, evento: { type: 'REST_FINISHED', restId: 'descanso-a2' } },
    { s: tramoB!.start, evento: { type: 'EXERCISE_ACTIVATED', prescriptionId: b } },
    { s: pausa![0], evento: { type: 'SESSION_PAUSED' } },
    { s: pausa![1], evento: { type: 'SESSION_RESUMED' } },
    { s: sesion.end!, evento: { type: 'SESSION_FINISHED', resolution: 'FINISHED' } },
  ];
  return pasos.sort((x, y) => x.s - y.s);
}

/** API-TIE-01 como lo manda la APK: sin Idempotency-Key, porque cada evento trae su identidad. */
export function mandarEventos(app: INestApplication, parte: Parte, draftId: string, events: readonly EventoDeTiempo[]) {
  return request(app.getHttpServer()).post(`/api/v1/training/execution-drafts/${draftId}/timing-events`).set('Authorization', `Bearer ${parte.token}`).send({ events });
}
