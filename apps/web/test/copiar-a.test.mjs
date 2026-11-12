/**
 * ED-23 y ED-24 · Copiar en la estación de Entrenamiento (WP-EDITORES-PROFESIONAL; V3 E-01 a E-03): la sesión a otro
 * bloque o semana, y el ejercicio, la prescripción o las series. Las copias van sin identificadores, nunca cambian el
 * borrador de entrada, respetan los topes y dicen antes lo que reemplazan.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const C = await import('../src/app/pro/advisees/training/copiar-a.ts');

const serie = (value, extra = {}) => ({ repetitions: { value }, ...extra });
const ejercicio = (id, sets, extra = {}) => ({ prescriptionId: `p-${id}`, exerciseVersionId: id, sets, intensity: null, ...extra });
const sesion = (id, label, prescriptions) => ({ sessionId: id, label, instructions: null, prescriptions });
const plan = () => [
  {
    blockId: 'b1',
    label: 'Fuerza',
    microcycles: [
      { microcycleId: 'm1', label: 'Semana 1', sessions: [sesion('s1', 'Piernas A', [ejercicio('sentadilla', [serie(8), serie(8)], { intensity: { criterion: 'RIR', target: { value: 2 } }, note: 'Profunda' }), ejercicio('remo', [serie(10)])])] },
      { microcycleId: 'm2', label: '', sessions: [] },
    ],
  },
  { blockId: 'b2', label: '', sessions: [sesion('s2', 'Torso', [])] },
];

test('ED-24 · los lugares del plan y los destinos de una sesión', () => {
  assert.deepEqual(C.gruposDelPlan(plan()).map((g) => g.nombre), ['Fuerza · Semana 1', 'Fuerza · Semana 2', 'Bloque 2']);
  assert.deepEqual(C.destinosDeLaSesion(plan(), { i: 0, j: 0 }).map((g) => g.nombre), ['Fuerza · Semana 2', 'Bloque 2']);
  assert.deepEqual(C.destinosDeLaSesion(plan(), { i: 0, j: 0 }, true).map((g) => g.nombre), ['Fuerza · Semana 2']);
  assert.deepEqual(C.destinosDeLaSesion(plan(), { i: 1, j: null }, true), []);
});

test('ED-24 · «Copiar la sesión a…» la suma al final del destino, sin identificadores y con su nombre; la entrada no cambia', () => {
  const b = plan();
  const antes = structuredClone(b);
  const r = C.copiarLaSesion(b, { i: 0, j: 0, k: 0 }, { i: 0, j: 1 });
  assert.equal(r.tipo, 'copiada');
  assert.equal(r.posicion, 0);
  const copia = r.bloques[0].microcycles[1].sessions[0];
  assert.equal(copia.label, 'Piernas A');
  assert.equal(copia.sessionId, undefined);
  assert.ok(copia.prescriptions.every((p) => p.prescriptionId === undefined));
  assert.deepEqual(copia.prescriptions[0].sets, b[0].microcycles[0].sessions[0].prescriptions[0].sets);
  assert.deepEqual(b, antes);
  // A un bloque sin microciclos, también.
  const otro = C.copiarLaSesion(b, { i: 0, j: 0, k: 0 }, { i: 1, j: null });
  assert.equal(otro.bloques[1].sessions.length, 2);
  assert.equal(
    C.vistaPreviaDeLaSesion(b, { i: 0, j: 0, k: 0 }, { i: 1, j: null, nombre: 'Bloque 2' }),
    'Se suma «Piernas A» (2 ejercicios, 3 series) al final de Bloque 2, como su sesión 2. Sin días: los elegís con los chips.',
  );
  // Al mismo lugar, o con el tope del microciclo, no.
  assert.equal(C.copiarLaSesion(b, { i: 0, j: 0, k: 0 }, { i: 0, j: 0 }).motivo, 'MISMO_LUGAR');
  const lleno = plan();
  lleno[0].microcycles[1].sessions = Array.from({ length: 14 }, (_, n) => sesion(`x${n}`, `S${n}`, []));
  assert.equal(C.copiarLaSesion(lleno, { i: 0, j: 0, k: 0 }, { i: 0, j: 1 }).motivo, 'TOPE');
});

test('ED-23 · «Copiar el ejercicio a…» lo suma a otra sesión, sin su identificador, con sus series y su nota', () => {
  const b = plan();
  const r = C.copiarElEjercicio(b, { i: 0, j: 0, k: 0, l: 0 }, { i: 1, j: null, k: 0 });
  const copia = r.bloques[1].sessions[0].prescriptions[0];
  assert.equal(copia.prescriptionId, undefined);
  assert.equal(copia.note, 'Profunda');
  assert.equal(copia.sets.length, 2);
  assert.equal(C.copiarElEjercicio(b, { i: 0, j: 0, k: 0, l: 0 }, { i: 0, j: 0, k: 0 }).motivo, 'MISMO_LUGAR');
});

test('ED-23 · «Copiar la prescripción a…» pisa todo menos el ejercicio, su identificador y su nota; «las series», solo las series', () => {
  const b = plan();
  const antes = structuredClone(b);
  const nombre = (p) => ({ sentadilla: 'Sentadilla', remo: 'Remo' })[p.exerciseVersionId];
  assert.equal(C.loQueSeReemplaza(b, { i: 0, j: 0, k: 0, l: 0 }, [1], 'prescripcion', nombre), 'Se reemplazan la serie y lo general de Remo.');
  const pres = C.copiarSobre(b, { i: 0, j: 0, k: 0, l: 0 }, [0, 1], 'prescripcion')[0].microcycles[0].sessions[0].prescriptions;
  assert.deepEqual(pres[1], { prescriptionId: 'p-remo', exerciseVersionId: 'remo', sets: [serie(8), serie(8)], intensity: { criterion: 'RIR', target: { value: 2 } } });
  // El origen no se toca, aunque esté en la lista.
  assert.equal(pres[0].note, 'Profunda');
  const conSeries = C.copiarSobre(b, { i: 0, j: 0, k: 0, l: 1 }, [0], 'series')[0].microcycles[0].sessions[0].prescriptions[0];
  assert.deepEqual(conSeries.sets, [serie(10)]);
  assert.deepEqual(conSeries.intensity, { criterion: 'RIR', target: { value: 2 } });
  assert.equal(conSeries.note, 'Profunda');
  assert.equal(C.loQueSeReemplaza(b, { i: 0, j: 0, k: 0, l: 1 }, [0], 'series', nombre), 'Se reemplazan las 2 series de Sentadilla.');
  assert.deepEqual(b, antes);
});
