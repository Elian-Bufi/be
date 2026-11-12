/**
 * ED-24 · «Duplicar el día» (WP-EDITORES-PROFESIONAL; Dirección, 2026-11-12: copia las sesiones de ese día a otro
 * día). Las copias van justo después de su original, con «(copia)», sin identificadores de ejercicio y con un
 * identificador de sesión nuevo que entra en la agenda con el día de destino; las originales y la entrada no cambian.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const D = await import('../src/app/pro/advisees/estacion/duplicar-el-dia.ts');

const sesion = (id, label) => ({ sessionId: id, label, instructions: null, prescriptions: [{ prescriptionId: `p-${id}`, exerciseVersionId: 'v', sets: [{ repetitions: { value: 5 } }], intensity: null }] });
const bloques = () => [{ blockId: 'b1', label: 'Fuerza', microcycles: [{ microcycleId: 'm1', label: 'Semana 1', sessions: [sesion('s1', 'Torso A'), sesion('s2', 'Piernas A'), sesion('s3', 'Torso B')] }] }];
const agenda = () => ({
  startDate: '2026-11-16',
  sessions: [
    { sessionId: 's1', weekdays: ['MONDAY'] },
    { sessionId: 's2', weekdays: ['MONDAY', 'WEDNESDAY'] },
    { sessionId: 's3', weekdays: ['FRIDAY'] },
  ],
  moves: [],
});
let n = 0;
const nuevoId = () => `nueva-${++n}`;

test('ED-24 · copia las sesiones del lunes al jueves, después de cada original, y las pone en el jueves', () => {
  n = 0;
  const b = bloques();
  const a = agenda();
  const antes = [structuredClone(b), structuredClone(a)];
  const r = D.duplicarElDia(b, a, 'MONDAY', 'THURSDAY', nuevoId);
  assert.equal(r.tipo, 'duplicado');
  const s = r.bloques[0].microcycles[0].sessions;
  assert.deepEqual(
    s.map((x) => [x.sessionId, x.label]),
    [
      ['s1', 'Torso A'],
      ['nueva-1', 'Torso A (copia)'],
      ['s2', 'Piernas A'],
      ['nueva-2', 'Piernas A (copia)'],
      ['s3', 'Torso B'],
    ],
  );
  assert.equal(s[1].prescriptions[0].prescriptionId, undefined);
  assert.deepEqual(s[1].prescriptions[0].sets, s[0].prescriptions[0].sets);
  assert.deepEqual(r.agenda.sessions.slice(3), [
    { sessionId: 'nueva-1', weekdays: ['THURSDAY'] },
    { sessionId: 'nueva-2', weekdays: ['THURSDAY'] },
  ]);
  // Las originales siguen en su día, y la entrada no cambió.
  assert.deepEqual(r.agenda.sessions.slice(0, 3), a.sessions);
  assert.deepEqual([b, a], antes);
  assert.deepEqual(r.copiadas, ['Torso A (copia)', 'Piernas A (copia)']);
  assert.deepEqual(D.sesionesDelDia(b, a, 'MONDAY'), ['Torso A', 'Piernas A']);
});

test('ED-24 · el mismo día, un día sin sesiones o pasar el tope no copian nada', () => {
  assert.deepEqual(D.duplicarElDia(bloques(), agenda(), 'MONDAY', 'MONDAY', nuevoId), { tipo: 'no-se-puede', motivo: 'MISMO_DIA' });
  assert.deepEqual(D.duplicarElDia(bloques(), agenda(), 'SUNDAY', 'MONDAY', nuevoId), { tipo: 'no-se-puede', motivo: 'SIN_SESIONES' });
  assert.deepEqual(D.duplicarElDia(bloques(), null, 'MONDAY', 'TUESDAY', nuevoId), { tipo: 'no-se-puede', motivo: 'SIN_SESIONES' });
  const llena = bloques();
  for (let k = 4; k <= 13; k++) llena[0].microcycles[0].sessions.push(sesion(`s${k}`, `Sesión ${k}`));
  const conTodas = { ...agenda(), sessions: [...agenda().sessions, ...Array.from({ length: 10 }, (_, k) => ({ sessionId: `s${k + 4}`, weekdays: ['MONDAY'] }))] };
  assert.deepEqual(D.duplicarElDia(llena, conTodas, 'MONDAY', 'TUESDAY', nuevoId), { tipo: 'no-se-puede', motivo: 'TOPE' });
  assert.deepEqual(D.diasDeDestino('MONDAY'), ['TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']);
});
