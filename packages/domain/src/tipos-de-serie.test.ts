/**
 * DL-178 (decisión de Dirección del 2026-11-18) · las series de calentamiento: se indican y se registran, pero no cuentan.
 * Datos sintéticos, validados contra los esquemas estrictos del contrato.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planTieneCalentamiento } from './compatibilidad-de-clientes';
import { compararEjecucion, observacionesDelEjercicio, evolucion } from './comparacion-de-entrenamiento';
import {
  EjecucionDeEntrenamientoSchema,
  EstructuraDePlanDeEntrenamientoEntradaSchema,
  SerieEjecutadaSchema,
  SeriePrescriptaEntradaSchema,
  type EjecucionDeEntrenamiento,
  type Prescripcion,
  type SerieEjecutadaApi,
} from './contratos-entrenamiento';
import { EJERCICIOS_DE_LA_ESTIMACION_V1 } from './estimacion-de-fuerza';
import { seriesDeLasSesiones } from './fuerza-del-analisis';
import { cuentaDeLaSesion, encabezadoDelEjercicio, renglonDelEjercicio, seriesDelEjercicio } from './lectura-del-plan-de-entrenamiento';
import { normalizarEstructuraDeEntrenamiento } from './plan-de-entrenamiento';
import { aplicarPrescripcion } from './prescripcion-rapida';
import { seriesPlanificadas } from './presentacion-de-prescripcion';
import { serieConTipo, serieEnSuForma, serieSinTipo } from './registro-por-niveles';
import {
  calentamientoFueraDeLugar,
  conElCalentamientoArriba,
  cuentaDeSeries,
  numerosEfectivos,
  registradasEfectivas,
  rotulosDeLasSeries,
  seriesEfectivas,
  tipoDeSerie,
} from './tipos-de-serie';

const C = { setKind: 'WARM_UP' as const };
const E = { setKind: 'WORKING' as const };

// ─── El dato ────────────────────────────────────────────────────────────────────────────────────

test('TEST-DL178-01 · sin el campo, la serie es efectiva; el contrato acepta WORKING y WARM_UP, y rechaza otro tipo', () => {
  assert.equal(tipoDeSerie({}), 'WORKING');
  assert.equal(tipoDeSerie({ setKind: null }), 'WORKING');
  assert.equal(tipoDeSerie(C), 'WARM_UP');
  const base = { setIndex: 1, load: { value: 40, unit: 'kg' }, completedRepetitions: 10, rir: null, perceivedExertion: null };
  assert.ok(SerieEjecutadaSchema.safeParse(base).success, 'una APK que no conoce el campo sigue registrando');
  assert.ok(SerieEjecutadaSchema.safeParse({ ...base, setKind: 'WARM_UP' }).success);
  assert.ok(!SerieEjecutadaSchema.safeParse({ ...base, setKind: 'COOL_DOWN' }).success, 'un tipo que no existe es un 400');
  assert.ok(SeriePrescriptaEntradaSchema.safeParse({ repetitions: { value: 8 } }).success);
  assert.ok(SeriePrescriptaEntradaSchema.safeParse({ repetitions: { value: 8 }, setKind: 'WARM_UP' }).success);
});

test('TEST-DL178-02 · los números efectivos: las efectivas 1, 2, 3 sin contar el calentamiento; sin calentamiento, el setIndex', () => {
  assert.deepEqual([...numerosEfectivos([{ setIndex: 1, ...C }, { setIndex: 2, ...C }, { setIndex: 3 }, { setIndex: 4 }, { setIndex: 5 }])], [
    [1, null],
    [2, null],
    [3, 1],
    [4, 2],
    [5, 3],
  ]);
  // Sin calentamiento, lo de antes responde igual, también con huecos (una serie no registrada).
  assert.deepEqual([...numerosEfectivos([{ setIndex: 1 }, { setIndex: 3 }, { setIndex: 4 }])], [
    [1, 1],
    [3, 3],
    [4, 4],
  ]);
  // Un calentamiento indicado y no registrado igual corre la numeración (la union de lo indicado y lo registrado).
  assert.deepEqual([...numerosEfectivos([{ setIndex: 1, ...C }, { setIndex: 2 }, { setIndex: 2 }])], [
    [1, null],
    [2, 1],
  ]);
  assert.deepEqual(
    rotulosDeLasSeries([C, C, {}, E]).map((r) => [r.corto, r.largo]),
    [
      ['C', 'Calentamiento'],
      ['C', 'Calentamiento'],
      ['1', 'Serie 1'],
      ['2', 'Serie 2'],
    ],
  );
});

test('TEST-DL178-03 · el orden: el calentamiento va arriba; uno después de una efectiva se señala, no se reordena en silencio', () => {
  assert.equal(calentamientoFueraDeLugar([C, C, {}, {}]), null);
  assert.equal(calentamientoFueraDeLugar([{}, {}]), null);
  assert.equal(calentamientoFueraDeLugar([C, {}, C]), 2);
  const series: { n: number; setKind?: 'WARM_UP' }[] = [{ n: 1 }, { n: 2, ...C }, { n: 3 }];
  assert.deepEqual(conElCalentamientoArriba(series), [{ n: 2, ...C }, { n: 1 }, { n: 3 }]);
  const plan = (sets: object[]) =>
    EstructuraDePlanDeEntrenamientoEntradaSchema.parse({ blocks: [{ label: 'B', sessions: [{ label: 'S', prescriptions: [{ exerciseVersionId: 'ver-1', sets, intensity: null }] }] }] });
  let n = 0;
  const id = () => `n-${++n}`;
  const fuera = normalizarEstructuraDeEntrenamiento(plan([{ repetitions: { value: 8 } }, { repetitions: { value: 10 }, ...C }]), id);
  assert.deepEqual(fuera, { ok: false, tipo: 'ESTRUCTURA', issues: [{ code: 'WARM_UP_AFTER_WORKING_SET', path: 'blocks[0].sessions[0].prescriptions[0].sets[1].setKind' }] });
});

test('TEST-DL178-04 · se guarda solo el calentamiento: un plan sin calentamiento (o con WORKING explícito) queda idéntico al de antes', () => {
  const plan = (sets: object[]) =>
    EstructuraDePlanDeEntrenamientoEntradaSchema.parse({ blocks: [{ blockId: 'b', label: 'B', sessions: [{ sessionId: 's', label: 'S', prescriptions: [{ prescriptionId: 'p', exerciseVersionId: 'ver-1', sets, intensity: null }] }] }] });
  const sinCampo = normalizarEstructuraDeEntrenamiento(plan([{ repetitions: { value: 8 } }, { repetitions: { value: 8 } }]), () => 'x');
  const conWorking = normalizarEstructuraDeEntrenamiento(plan([{ repetitions: { value: 8 }, ...E }, { repetitions: { value: 8 }, ...E }]), () => 'x');
  assert.deepEqual(conWorking, sinCampo);
  assert.ok(sinCampo.ok);
  assert.deepEqual(sinCampo.contenido.blocks[0]!.sessions[0]!.prescriptions[0]!.sets, [
    { repetitions: { value: 8 }, note: null },
    { repetitions: { value: 8 }, note: null },
  ]);
  const conCalentamiento = normalizarEstructuraDeEntrenamiento(plan([{ repetitions: { value: 12 }, ...C }, { repetitions: { value: 8 } }]), () => 'x');
  assert.ok(conCalentamiento.ok);
  assert.deepEqual(conCalentamiento.contenido.blocks[0]!.sessions[0]!.prescriptions[0]!.sets, [
    { repetitions: { value: 12 }, note: null, setKind: 'WARM_UP' },
    { repetitions: { value: 8 }, note: null },
  ]);
  assert.equal(planTieneCalentamiento(sinCampo.contenido), false);
  assert.equal(planTieneCalentamiento(conCalentamiento.contenido), true);
});

test('TEST-DL178-05 · la serie registrada: se guarda solo WARM_UP; sale explícita para quien la lee y sin el campo para quien no', () => {
  const s: SerieEjecutadaApi = { setIndex: 1, load: { value: 40, unit: 'kg' }, completedRepetitions: 10, rir: null, perceivedExertion: null };
  assert.deepEqual(serieEnSuForma({ ...s, setKind: 'WORKING' }), s, 'una efectiva queda idéntica a las de antes');
  assert.deepEqual(serieEnSuForma({ ...s, setKind: 'WARM_UP' }), { ...s, setKind: 'WARM_UP' });
  assert.deepEqual(serieConTipo(s), { ...s, setKind: 'WORKING' });
  assert.deepEqual(serieSinTipo({ ...s, setKind: 'WARM_UP' }), s);
});

// ─── Lo que no usa las de calentamiento ─────────────────────────────────────────────────────────

const SENTADILLA = EJERCICIOS_DE_LA_ESTIMACION_V1[0]!;
const prescripcion = (sets: Prescripcion['sets']): Prescripcion => ({
  prescriptionId: 'rx-1',
  order: 1,
  exerciseId: SENTADILLA.exerciseId,
  exerciseVersionId: 'ver-sentadilla',
  exerciseName: SENTADILLA.nombre,
  sets,
  intensity: { criterion: 'RIR', target: { value: 2, reference: null } },
  suggestedLoad: null,
  professionalParameters: [],
  note: null,
});
const indicada = (setIndex: number, reps: number, tipo?: 'WARM_UP'): Prescripcion['sets'][number] => ({ setIndex, repetitions: { value: reps }, note: null, ...(tipo ? { setKind: tipo } : {}) });
const hecha = (setIndex: number, kg: number, reps: number, rir: number, tipo?: 'WARM_UP'): SerieEjecutadaApi => ({
  setIndex,
  load: { value: kg, unit: 'kg' },
  completedRepetitions: reps,
  rir,
  perceivedExertion: null,
  ...(tipo ? { setKind: tipo } : {}),
});

let secuencia = 0;
function ejecucion(fecha: string, p: Prescripcion, sets: SerieEjecutadaApi[]): EjecucionDeEntrenamiento {
  const id = `x-${++secuencia}`;
  const instante = `${fecha}T10:00:00.000-03:00`;
  return EjecucionDeEntrenamientoSchema.parse({
    executionId: id,
    state: 'REGISTERED',
    adviseeId: 'ase-1',
    planId: 'plan-v1',
    snapshotDigest: 'a'.repeat(64),
    occurrenceId: `oc-${id}`,
    date: fecha,
    timeZone: 'America/Argentina/Buenos_Aires',
    plannedSession: { sessionId: 'ses-a', label: 'Piernas A', order: 1, instructions: null, prescriptions: [p], blockId: 'b', blockLabel: 'Bloque 1', microcycleId: null, microcycleLabel: null },
    original: {
      granularity: 'SET',
      sessionCondition: 'COMPLETED',
      reason: null,
      exercises: [
        {
          prescriptionId: p.prescriptionId,
          prescribedExerciseVersionId: p.exerciseVersionId,
          prescribedExerciseName: p.exerciseName,
          performedExerciseVersionId: p.exerciseVersionId,
          performedExerciseName: p.exerciseName,
          substituted: false,
          sets,
          executionSummary: null,
        },
      ],
      sessionSummary: null,
    },
    corrections: [],
    effectiveView: { kind: 'ORIGINAL' },
    occurredAt: instante,
    recordedAt: instante,
  });
}

const conCalentamiento = prescripcion([indicada(1, 10, 'WARM_UP'), indicada(2, 5, 'WARM_UP'), indicada(3, 8), indicada(4, 8)]);
const hoy = ejecucion('2026-11-18', conCalentamiento, [hecha(1, 40, 10, 6, 'WARM_UP'), hecha(2, 140, 5, 0, 'WARM_UP'), hecha(3, 100, 8, 2), hecha(4, 100, 7, 2)]);
const antes = ejecucion('2026-11-11', prescripcion([indicada(1, 8), indicada(2, 8)]), [hecha(1, 95, 8, 2), hecha(2, 95, 8, 2)]);

test('TEST-DL178-06 · la comparación (tira, «La vez pasada», historial, Analizar): el calentamiento queda afuera y las efectivas se numeran 1, 2', () => {
  const [c] = compararEjecucion(hoy);
  assert.deepEqual(
    c!.filas.map((f) => [f.numero, f.setIndex]),
    [
      [1, 3],
      [2, 4],
    ],
  );
  assert.deepEqual(
    c!.calentamiento.map((s) => [s.setIndex, s.planificada, s.registrada?.completedRepetitions]),
    [
      [1, true, 10],
      [2, true, 5],
    ],
  );
  // Lo de antes responde igual: sin calentamiento, número y posición coinciden y no hay nada aparte.
  const [v] = compararEjecucion(antes);
  assert.deepEqual(
    v!.filas.map((f) => [f.numero, f.setIndex]),
    [
      [1, 1],
      [2, 2],
    ],
  );
  assert.deepEqual(v!.calentamiento, []);
  // La serie 1 de hoy (la tercera que hizo) se compara con la serie 1 de la semana pasada, no con un calentamiento.
  const obs = observacionesDelEjercicio([antes, hoy], `e:${SENTADILLA.exerciseId}`);
  const puntos = evolucion(obs, { variable: 'carga', unidad: 'kg' }, 1);
  assert.deepEqual(
    puntos.map((p) => (p.registrado.tipo === 'valor' ? p.registrado.valor : null)),
    [95, 100],
  );
});

test('TEST-DL178-07 · el 1RM estimado (Epley v1): «la de mayor carga por sesión» sale solo de las efectivas', () => {
  const [g] = seriesDeLasSesiones([hoy], new Map());
  assert.deepEqual(
    g!.ubicaciones.map((u) => u.setIndex),
    [3, 4],
  );
  assert.ok(!g!.series.some((s) => s.load?.value === 140), 'el calentamiento de 140 kg no entra ni como candidato');
  // Si el registro no marcó el tipo pero el plan sí, tampoco entra (una APK que registró sin el campo).
  assert.deepEqual(
    registradasEfectivas([hecha(1, 40, 10, 6), hecha(2, 100, 8, 2)], [indicada(1, 10, 'WARM_UP'), indicada(2, 8)]).map((s) => s.setIndex),
    [2],
  );
});

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────

test('TEST-DL178-08 · cuando un texto cuenta series con calentamiento, dice «series efectivas»; sin calentamiento, como siempre', () => {
  assert.equal(cuentaDeSeries([{}, {}, {}]), '3 series');
  assert.equal(cuentaDeSeries([C, C, {}, {}, {}]), '3 series efectivas + 2 de calentamiento');
  assert.equal(cuentaDeSeries([C, {}]), '1 serie efectiva + 1 de calentamiento');
  assert.equal(cuentaDeLaSesion({ prescriptions: [{ sets: [C, {}, {}] }, { sets: [{}, {}] }] }), '2 ejercicios · 4 series efectivas + 1 de calentamiento');
  const objetivo = (setIndex: number, reps: number, tipo?: 'WARM_UP') => ({
    setIndex,
    note: null,
    ...(tipo ? { setKind: tipo } : {}),
    target: { repetitions: { value: reps }, rir: tipo ? null : 2, suggestedLoad: null, restSeconds: null },
    targetOrigin: { rir: 'PRESCRIPTION' as const, suggestedLoad: 'NONE' as const, restSeconds: 'NONE' as const },
  });
  const p = { intensity: { criterion: 'RIR' as const, target: { value: 2, reference: null } }, sets: [objetivo(1, 12, 'WARM_UP'), objetivo(2, 8), objetivo(3, 8), objetivo(4, 8)] };
  assert.equal(renglonDelEjercicio(p), '3 × 8 rep. + 1 de calentamiento · RIR 2');
  assert.equal(renglonDelEjercicio({ ...p, sets: p.sets.slice(1) }), '3 × 8 rep. · RIR 2', 'sin calentamiento, como siempre');
  assert.equal(encabezadoDelEjercicio(p), '3 series efectivas + 1 de calentamiento · criterio de intensidad: RIR');
  assert.ok(!renglonDelEjercicio(p).includes('repeticiones por serie'), 'las 12 del calentamiento no hacen «repeticiones por serie»');
  assert.deepEqual(
    seriesDelEjercicio(p).filas.map((f) => [f.serie, f.deCalentamiento ?? false]),
    [
      [1, true],
      [1, false],
      [2, false],
      [3, false],
    ],
  );
  assert.deepEqual(seriesPlanificadas({ sets: [indicada(1, 12, 'WARM_UP'), indicada(2, 8), indicada(3, 8)] }), ['Calentamiento: 1 serie (12)', '2 × 8']);
  assert.deepEqual(seriesPlanificadas({ sets: [indicada(1, 8), indicada(2, 8)] }), ['2 × 8']);
  assert.deepEqual(seriesEfectivas([C, E, {}]), [E, {}]);
});

test('TEST-DL178-09 · la prescripción rápida («4×8») describe las efectivas: el calentamiento queda arriba, como estaba', () => {
  const p = { exerciseVersionId: 'ver-1', intensity: null, sets: [{ repetitions: { value: 12 }, setKind: 'WARM_UP' as const }, { repetitions: { value: 10 } }] };
  const { prescripcion: nueva, cambio } = aplicarPrescripcion(p, { series: 3, repeticiones: { value: 8 }, rir: null, carga: null, descanso: null });
  assert.deepEqual(
    nueva.sets.map((s) => [s.setKind ?? 'WORKING', s.repetitions]),
    [
      ['WARM_UP', { value: 12 }],
      ['WORKING', { value: 8 }],
      ['WORKING', { value: 8 }],
      ['WORKING', { value: 8 }],
    ],
  );
  assert.deepEqual(cambio.series, { antes: 1, despues: 3 });
});
