/**
 * ED-74 (WP-EDITORES-PROFESIONAL; DL-171) · La derivación de `TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE`: el registro
 * vigente de cada sesión, las observaciones del profesional y el interruptor. Oráculos RM-01, RM-11, RM-23, RM-24, RM-25,
 * RM-29, RM-33 y RM-43 de §5.8, sobre ejecuciones armadas como las devuelve la API. Datos sintéticos; si una prueba
 * falla, se corrige el cálculo, no el oráculo.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ProyeccionResponseSchema } from './contratos-analisis';
import type { EjecucionDeEntrenamiento, SerieEjecutadaApi } from './contratos-entrenamiento';
import { estimacionDeFuerzaDelPeriodo, type ObservacionParaElAnalisis } from './fuerza-del-analisis';

const PRESS = 'b5a3ddca-2d35-5d67-833b-cedfe0f6b1d7';
const PRESS_V = '0f0f0f0f-0000-4000-8000-000000000001';
const OTRO = '0f0f0f0f-0000-4000-8000-0000000000aa';
const DIEGO = { identityId: '0f0f0f0f-0000-4000-8000-0000000000d1', displayName: 'Diego' };
const MARTIN = { identityId: '0f0f0f0f-0000-4000-8000-0000000000e1', displayName: 'Martín' };
const ESCRITA = { load: 'PERSON', completedRepetitions: 'PERSON', rir: 'PERSON' } as const;

const serie = (setIndex: number, carga: number, reps: number, rir: number | null, extra: Partial<SerieEjecutadaApi> = {}): SerieEjecutadaApi => ({
  setIndex,
  load: { value: carga, unit: 'kg' },
  completedRepetitions: reps,
  rir,
  perceivedExertion: null,
  fieldOrigins: ESCRITA,
  ...extra,
});

function ejecucion(id: string, fecha: string, sets: SerieEjecutadaApi[], opciones: { exerciseId?: string; sustituido?: boolean; correccion?: SerieEjecutadaApi[] } = {}): EjecucionDeEntrenamiento {
  const registro = (s: SerieEjecutadaApi[]) => ({
    granularity: 'SET' as const,
    sessionCondition: 'COMPLETED' as const,
    reason: null,
    exercises: [
      {
        prescriptionId: 'rx-banca',
        prescribedExerciseVersionId: PRESS_V,
        prescribedExerciseName: 'Press de banca plano con barra',
        performedExerciseVersionId: PRESS_V,
        performedExerciseName: 'Press de banca plano con barra',
        substituted: opciones.sustituido ?? false,
        sets: s,
        executionSummary: null,
      },
    ],
    sessionSummary: null,
  });
  return {
    executionId: id,
    state: 'REGISTERED',
    adviseeId: DIEGO.identityId,
    planId: '0f0f0f0f-0000-4000-8000-0000000000f1',
    snapshotDigest: 'a'.repeat(64),
    occurrenceId: `o-${id}`,
    date: fecha,
    timeZone: 'America/Argentina/Buenos_Aires',
    plannedSession: {
      sessionId: 's1',
      label: 'Torso A',
      order: 1,
      instructions: null,
      blockId: 'b1',
      blockLabel: 'Bloque 1',
      microcycleId: null,
      microcycleLabel: null,
      prescriptions: [
        { prescriptionId: 'rx-banca', order: 1, exerciseId: opciones.exerciseId ?? PRESS, exerciseVersionId: PRESS_V, exerciseName: 'Press de banca plano con barra', sets: [], intensity: null, suggestedLoad: null, professionalParameters: [], note: null },
      ],
    },
    original: registro(sets),
    corrections: opciones.correccion
      ? [{ correctionId: `c-${id}`, previousCorrectionId: null, reason: 'Corrijo', correction: registro(opciones.correccion), author: DIEGO, authorRole: 'ADVISEE', recordedAt: `${fecha}T22:00:00.000Z` }]
      : [],
    effectiveView: opciones.correccion ? { kind: 'CORRECTED', correctionId: `c-${id}` } : { kind: 'ORIGINAL' },
    occurredAt: `${fecha}T20:00:00.000Z`,
    recordedAt: `${fecha}T20:30:00.000Z`,
  };
}

const derivar = (ejecuciones: EjecucionDeEntrenamiento[], extra: { incluirOrientativas?: boolean; observaciones?: ObservacionParaElAnalisis[]; exerciseId?: string | null } = {}) =>
  estimacionDeFuerzaDelPeriodo({
    ejecuciones,
    bases: new Map(),
    observaciones: extra.observaciones ?? [],
    persona: DIEGO,
    exerciseId: extra.exerciseId === undefined ? PRESS : extra.exerciseId,
    unidad: null,
    incluirOrientativas: extra.incluirOrientativas ?? false,
    otrosProfesionales: false,
    vigencias: [],
  });

test('RM-43 · una sesión con 70 × 12 RIR 0 y 65 × 8 RIR 2: apagado, 65 × 8 (86,67); encendido, 70 × 12 (98,0)', () => {
  const x = ejecucion('e1', '2026-11-11', [serie(1, 70, 12, 0), serie(2, 65, 8, 2)]);
  const apagado = derivar([x]).estimate!;
  assert.equal(apagado.points.length, 1);
  assert.equal(apagado.points[0]!.origin.type === 'TRAINING_EXECUTION' && apagado.points[0]!.origin.setIndex, 2);
  assert.ok(Math.abs(apagado.points[0]!.estimate.value - 86.6666666) < 1e-6);
  assert.equal(apagado.points[0]!.estimate.band, 'CORE');
  assert.deepEqual(apagado.points[0]!.writtenBy, DIEGO);
  const encendido = derivar([x], { incluirOrientativas: true }).estimate!;
  assert.equal(encendido.points[0]!.estimate.value, 98);
  assert.equal(encendido.points[0]!.estimate.band, 'ORIENTATIVE');
});

test('RM-24, RM-23 y RM-33 · lo que vino del plan, lo tildado y lo de antes de la procedencia no entran, con su motivo', () => {
  const x = ejecucion('e2', '2026-11-10', [
    serie(1, 60, 10, 2, { fieldOrigins: { load: 'PLAN', completedRepetitions: 'PERSON', rir: 'PLAN' } }),
    serie(2, 60, 8, 2, { recordedAs: 'AS_PLANNED', fieldOrigins: undefined }),
    serie(3, 60, 8, 2, { fieldOrigins: undefined }),
  ]);
  const r = derivar([x]).estimate!;
  assert.deepEqual(r.points, []);
  assert.deepEqual(
    r.notIncluded.map((n) => [n.setIndex, n.reason, n.fields]),
    [
      [1, 'VALOR_DEL_PLAN', ['load', 'rir']],
      [2, 'CARGA_RAPIDA', []],
      [3, 'SIN_PROCEDENCIA', []],
    ],
  );
});

test('RM-11 · la corrección vigente es la que se lee; RM-25 · un ejercicio sustituido no entra', () => {
  const corregida = ejecucion('e3', '2026-11-09', [serie(1, 80, 6, 2)], { correccion: [serie(1, 82.5, 6, 2)] });
  const p = derivar([corregida]).estimate!.points[0]!;
  assert.equal(p.estimate.load.value, 82.5);
  assert.equal(p.origin.type === 'TRAINING_EXECUTION' && p.origin.corrected, true);
  const sustituida = ejecucion('e4', '2026-11-08', [serie(1, 80, 6, 2)], { sustituido: true });
  assert.deepEqual(derivar([sustituida]).estimate!.notIncluded.map((n) => n.reason), ['SUSTITUIDO']);
});

test('RM-16 · fuera de la lista no hay ejercicio ni valor; RM-01 · sin registros, ningún punto desde la prescripción', () => {
  const r = derivar([ejecucion('e5', '2026-11-07', [serie(1, 80, 6, 2)], { exerciseId: OTRO })], { exerciseId: null });
  assert.deepEqual(r.exercises, []);
  assert.equal(r.estimate, null);
  assert.deepEqual(derivar([]).estimate!.points, []);
});

test('RM-36 y RM-29 · las observaciones suman su punto, siguen el interruptor y kg y lb no se mezclan', () => {
  const observacion = (id: string, unidad: 'kg' | 'lb', band: 'CORE' | 'ORIENTATIVE'): ObservacionParaElAnalisis => ({
    observationId: id,
    exerciseId: PRESS,
    localDate: '2026-11-12',
    observedBy: MARTIN,
    estimate: { specification: 'BE-E1RM', version: 1, method: 'EPLEY_V1', band, load: { value: 85, unit: unidad }, completedRepetitions: 5, rir: 1, equivalentRepetitions: 6, value: 102 },
  });
  const r = derivar([], { observaciones: [observacion('o1', 'kg', 'CORE'), observacion('o2', 'lb', 'CORE'), observacion('o3', 'kg', 'ORIENTATIVE')] });
  assert.deepEqual(r.exercises.map((e) => [e.exerciseId, e.observations, e.units]), [[PRESS, 3, ['kg', 'lb']]]);
  assert.deepEqual(r.estimate!.points.map((p) => p.pointId), ['o:o1']);
  assert.deepEqual(r.estimate!.points[0]!.writtenBy, MARTIN);
  assert.deepEqual(derivar([], { observaciones: [observacion('o3', 'kg', 'ORIENTATIVE')], incluirOrientativas: true }).estimate!.points.map((p) => p.pointId), ['o:o3']);
});

test('la respuesta de API-PRJ-01 con la clave nueva cumple el contrato', () => {
  const result = derivar([ejecucion('e6', '2026-11-11', [serie(1, 80, 6, 2)])]);
  const r = ProyeccionResponseSchema.safeParse({
    data: {
      projectionKey: 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE',
      period: { start: '2026-08-20', end: '2026-11-12', timeZone: 'America/Argentina/Buenos_Aires' },
      partialView: false,
      generatedAt: '2026-11-12T12:00:00.000Z',
      dataState: 'AVAILABLE',
      reason: null,
      derivation: { specificationId: 'BE-E1RM', version: '1', method: 'EPLEY_V1' },
      sourceDomains: ['TRAINING'],
      result,
    },
  });
  assert.equal(r.success, true, JSON.stringify(r.error?.issues));
});
