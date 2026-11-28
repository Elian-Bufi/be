import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GuardarPrescripcionHabitualRequestSchema,
  ListaDePrescripcionesHabitualesResponseSchema,
  PresetDeFaseContenidoSchema,
  PresetDeSesionContenidoSchema,
  PresetPropioDeEntrenamientoSchema,
} from './contratos-habituales';
import { detalleDelPresetDeFase, detalleDelPresetDeSesion, ejerciciosDelPreset, faseDelPreset, presetDeFaseDe, presetDeSesionDe, sesionDelPreset } from './presets-por-nivel';
import { normalizarEstructuraDeEntrenamiento } from './index';

const EJ = '11111111-1111-4111-8111-111111111111';
const EJ2 = '22222222-2222-4222-8222-222222222222';
const contador = () => {
  let n = 0;
  return () => `nuevo-${++n}`;
};

/** Una sesión de un plan real: con cargas, notas, % RM con referencia, un bloque «En vueltas» y sus identificadores. */
const sesion = () => ({
  sessionId: 'ses-a',
  label: 'Torso A',
  instructions: 'Entrada en calor de 10 min',
  exerciseGroups: [{ groupId: 'grp-1', label: 'Circuito', kind: 'ROUNDS' as const, rounds: 3, restAfterRoundSeconds: 90 }],
  prescriptions: [
    {
      prescriptionId: 'pre-1',
      exerciseVersionId: EJ,
      sets: [{ repetitions: { value: 8 }, suggestedLoad: { value: 60, unit: 'kg' as const }, note: 'Diego: cuidar el hombro' }, { repetitions: { value: 8 } }],
      intensity: { criterion: 'PERCENT_RM', target: { value: 75, reference: { description: '1RM estimado · Epley v1 · 11/11/2026' } } },
      suggestedLoad: { value: 70, unit: 'kg' as const },
      note: 'Diego lo hace en máquina',
      restSeconds: 120,
      professionalParameters: [{ label: 'Tempo', value: '3-1-1' }],
    },
    { prescriptionId: 'pre-2', exerciseVersionId: EJ2, sets: [{ repetitions: { value: 12 }, rir: 2 }], intensity: { criterion: 'RIR', target: { value: 2, reference: null } }, exerciseGroupId: 'grp-1' },
  ],
});
const planificacion = () => ({
  startDate: '2026-11-30',
  weeks: 12,
  phases: [{ blockId: 'blo-1', weeks: 4 }],
  warmUps: [{ prescriptionId: 'pre-1', mode: 'FROM_WORKING_LOAD' as const, workingLoadShares: [40, 60], step: 2.5 as const }, { prescriptionId: 'de-otra-fase', mode: 'MANUAL' as const, workingLoadShares: [], step: 1 as const }],
  progressions: [{ blockId: 'blo-1', model: 'LINEAR' as const, loadStep: 2.5, repStep: null, repRange: null, waves: null, deload: { week: 4, mode: 'LOAD' as const, workingLoadShare: 60, setsRemoved: 1 }, prescriptionIds: ['pre-1'] }],
  privateNotes: { plan: null, phases: [{ blockId: 'blo-1', text: 'Diego viene de una lesión' }] },
});
const agenda = () => ({ startDate: '2026-11-30', sessions: [{ sessionId: 'ses-a', weekdays: ['MONDAY' as const, 'THURSDAY' as const] }], moves: [] });

test('DL-203 · el preset de sesión guarda los ejercicios y sus series, nunca cargas, notas ni la referencia del % RM', () => {
  const g = presetDeSesionDe(sesion(), planificacion());
  const texto = JSON.stringify(g.contenido);
  assert.doesNotMatch(texto, /suggestedLoad|Diego|Epley|"note"/, 'ni cargas, ni notas, ni la referencia del % RM');
  assert.deepEqual(g.contenido.session.prescriptions.map((p) => p.exerciseVersionId), [EJ, EJ2], 'los ejercicios sí: los eligió el profesional');
  assert.deepEqual(g.contenido.session.prescriptions[0]!.intensity, { criterion: 'PERCENT_RM', target: { value: 75, reference: null } }, 'en % RM queda el %');
  assert.equal(g.contenido.session.instructions, 'Entrada en calor de 10 min', 'las indicaciones de la sesión, sí');
  // Las claves son locales, y lo que las cita las sigue.
  assert.deepEqual([g.contenido.session.sessionId, ...g.contenido.session.prescriptions.map((p) => p.prescriptionId)], ['s1', 'p1', 'p2']);
  assert.equal(g.contenido.session.prescriptions[1]!.exerciseGroupId, 'g1');
  assert.deepEqual(g.contenido.session.exerciseGroups!.map((x) => x.groupId), ['g1']);
  assert.deepEqual(g.contenido.warmUps!.map((w) => w.prescriptionId), ['p1'], 'las aproximaciones de esta sesión, no las de otra');
  // Antes de guardar se dice qué no viaja y qué textos viajan, para revisarlos.
  assert.equal(g.seQuita.length, 3);
  assert.ok(g.seGuardanEscritos.includes('«Tempo: 3-1-1»'));
  assert.ok(g.seGuardanEscritos.includes('las indicaciones de «Torso A»'));
  // El contrato lo acepta tal cual; con una carga o una nota, no (400).
  assert.equal(PresetDeSesionContenidoSchema.safeParse(g.contenido).success, true);
  const conCarga = structuredClone(g.contenido) as { session: { prescriptions: Record<string, unknown>[] } };
  conCarga.session.prescriptions[0]!.suggestedLoad = { value: 60, unit: 'kg' };
  assert.equal(PresetDeSesionContenidoSchema.safeParse(conCarga).success, false, 'mutación: una carga en el preset');
  const conNota = structuredClone(g.contenido) as { session: { prescriptions: { sets: Record<string, unknown>[] }[] } };
  conNota.session.prescriptions[0]!.sets[0]!.note = 'Diego';
  assert.equal(PresetDeSesionContenidoSchema.safeParse(conNota).success, false, 'mutación: una nota en una serie');
  assert.equal(detalleDelPresetDeSesion(g.contenido), '2 ejercicios · 3 series');
});

test('DL-203 · aplicar un preset de sesión remapea todos los identificadores; dos veces en el mismo plan no chocan', () => {
  const g = presetDeSesionDe(sesion(), planificacion()).contenido;
  const nuevo = contador();
  const a = sesionDelPreset(g, nuevo);
  const b = sesionDelPreset(g, nuevo);
  const ids = (x: typeof a) => [x.sesion.sessionId, ...x.sesion.prescriptions.map((p) => p.prescriptionId), ...(x.sesion.exerciseGroups ?? []).map((y) => y.groupId)];
  assert.equal(new Set([...ids(a), ...ids(b)]).size, ids(a).length * 2, 'ningún identificador repetido');
  assert.equal(a.sesion.prescriptions[1]!.exerciseGroupId, a.sesion.exerciseGroups![0]!.groupId, 'el ejercicio sigue en su bloque');
  assert.deepEqual(a.aproximaciones.map((w) => w.prescriptionId), [a.sesion.prescriptions[0]!.prescriptionId]);
  assert.equal(a.sesion.prescriptions[0]!.suggestedLoad, undefined, 'sin carga: la pone el 1RM de quien lo recibe');
  // La sesión aplicada es válida en un plan.
  assert.equal(normalizarEstructuraDeEntrenamiento({ blocks: [{ label: 'Fase', sessions: [a.sesion, b.sesion] }] }, () => crypto.randomUUID()).ok, true);
  assert.deepEqual(ejerciciosDelPreset(g), [EJ, EJ2]);
});

test('DL-203 · el preset de fase guarda semanas, sesiones, días, progresión (también por ejercicio) y aproximaciones', () => {
  const bloque = { blockId: 'blo-1', label: 'Base', purpose: 'Técnica y volumen', sessions: [sesion()] };
  const g = presetDeFaseDe(bloque, planificacion(), agenda());
  assert.ok('contenido' in g);
  const c = g.contenido;
  assert.deepEqual([c.label, c.weeks, c.purpose], ['Base', 4, 'Técnica y volumen']);
  assert.deepEqual(c.days, [{ sessionId: 's1', weekdays: ['MONDAY', 'THURSDAY'] }]);
  assert.deepEqual(c.progression?.prescriptionIds, ['p1'], 'la progresión de los ejercicios elegidos sigue a su clave');
  assert.equal(c.progression?.model, 'LINEAR');
  assert.ok(g.seQuita.some((t) => /anotaciones de la fase/.test(t)), 'las anotaciones privadas nunca');
  assert.doesNotMatch(JSON.stringify(c), /Diego|lesión|blo-1|ses-a|pre-1/);
  assert.equal(g.seGuardanEscritos[0], 'el objetivo de «Base»');
  assert.equal(PresetDeFaseContenidoSchema.safeParse(c).success, true);
  assert.equal(detalleDelPresetDeFase(c), '1 sesión · 2 ejercicios · 4 semanas · con progresión');
  // Una fase con microciclos no se guarda: no se crean microciclos nuevos.
  assert.ok('noSePuede' in presetDeFaseDe({ label: 'Vieja', microcycles: [{ label: 'Semana 1', sessions: [sesion()] }] }, planificacion(), agenda()));
});

test('DL-203 · aplicar un preset de fase: fase nueva con identificadores nuevos, sus días, su progresión y sus aproximaciones', () => {
  const g = presetDeFaseDe({ blockId: 'blo-1', label: 'Base', sessions: [sesion()] }, planificacion(), agenda());
  assert.ok('contenido' in g);
  const f = faseDelPreset(g.contenido, 'Base (preset)', contador());
  assert.equal(f.bloque.label, 'Base (preset)');
  assert.equal(f.semanas, 4);
  const sesionNueva = f.bloque.sessions![0]!;
  assert.deepEqual(f.dias, [{ sessionId: sesionNueva.sessionId, weekdays: ['MONDAY', 'THURSDAY'] }]);
  assert.equal(f.progresion?.blockId, f.bloque.blockId);
  assert.deepEqual(f.progresion?.prescriptionIds, [sesionNueva.prescriptions[0]!.prescriptionId]);
  assert.deepEqual(f.aproximaciones.map((w) => w.prescriptionId), [sesionNueva.prescriptions[0]!.prescriptionId]);
  assert.equal(normalizarEstructuraDeEntrenamiento({ blocks: [f.bloque] }, () => crypto.randomUUID()).ok, true);
});

test('DL-203 · el contrato: los tres niveles en API-HAB-07, sin `kind` es SERIES, y la lista los trae juntos', () => {
  const series = { sets: [{ repetitions: { value: 5 }, rir: 1 }], intensity: { criterion: 'RIR', target: { value: 1 } }, restSeconds: 180 };
  assert.equal(GuardarPrescripcionHabitualRequestSchema.safeParse({ name: 'Fuerza', prescription: series }).success, true, 'como hasta ahora');
  const sesionG = presetDeSesionDe(sesion(), planificacion()).contenido;
  assert.equal(GuardarPrescripcionHabitualRequestSchema.safeParse({ name: 'Torso', kind: 'SESION', session: sesionG }).success, true);
  assert.equal(GuardarPrescripcionHabitualRequestSchema.safeParse({ name: 'Torso', kind: 'FASE', session: sesionG }).success, false, 'mutación: el tipo no coincide con el contenido');
  assert.equal(GuardarPrescripcionHabitualRequestSchema.safeParse({ name: 'Torso', kind: 'SESION', session: sesionG, replaces: EJ }).success, false, 'reemplazar pide la versión');
  const lista = ListaDePrescripcionesHabitualesResponseSchema.parse({
    data: [
      { presetId: EJ, version: 'v1', name: 'Fuerza', kind: 'SERIES', prescription: series, createdAt: '2026-11-26T12:00:00.000Z', updatedAt: '2026-11-26T12:00:00.000Z' },
      { presetId: EJ2, version: 'v1', name: 'Torso', kind: 'SESION', session: sesionG, exercises: { [EJ]: { exerciseId: EJ, exerciseName: 'Press de banca', available: true } }, createdAt: '2026-11-26T12:00:00.000Z', updatedAt: '2026-11-26T12:00:00.000Z' },
    ],
  });
  assert.deepEqual(lista.data.map((p) => p.kind), ['SERIES', 'SESION']);
  assert.equal(PresetPropioDeEntrenamientoSchema.safeParse({ ...lista.data[0], kind: 'FASE' }).success, false);
});
