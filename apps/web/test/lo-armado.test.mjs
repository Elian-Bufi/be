/**
 * ED-14 · «Lo que llevás armado», al costado del asistente (WP-EDITORES-PROFESIONAL; maquetas 01 y 03): se deduce del
 * borrador, no lo cambia y dice por sesión sus ejercicios, lo que falta prescribir y sus días.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const P = await import('../src/app/pro/advisees/asistente/paso-que-sigue.ts');

const prescrita = { exerciseVersionId: 'e1', sets: [{ repetitions: { value: 8 } }], intensity: null };
const sinPrescribir = { exerciseVersionId: 'e2', sets: [{ repetitions: null }], intensity: null };
const sesion = (id, label, prescriptions) => ({ sessionId: id, label, instructions: null, prescriptions });
const corto = (d) => ({ MONDAY: 'L', THURSDAY: 'J' })[d];

test('ED-14 · lo armado, en pocas líneas, sin tocar el borrador', () => {
  const bloques = [{ label: 'B', microcycles: [{ label: 'Semana 1', sessions: [sesion('a', 'Piernas A', [prescrita, sinPrescribir]), sesion('b', '', [])] }] }];
  const agenda = { startDate: '2026-11-16', sessions: [{ sessionId: 'a', weekdays: ['MONDAY', 'THURSDAY'] }], moves: [] };
  const antes = structuredClone(bloques);
  assert.deepEqual(P.loQueLlevasArmado(bloques, agenda, corto), ['1 bloque · 1 semana · 2 sesiones', 'Piernas A · 2 ejercicios · 1 sin prescribir · L J', 'Sesión 2 · sin ejercicios · sin días']);
  assert.deepEqual(bloques, antes);
  assert.deepEqual(P.loQueLlevasArmado([{ label: 'B', sessions: [] }], null, corto), ['1 bloque · 0 sesiones', 'Todavía sin sesiones.']);
  const muchas = [{ label: 'B', sessions: Array.from({ length: 10 }, (_, n) => sesion(`s${n}`, `S${n}`, [prescrita])) }];
  const lineas = P.loQueLlevasArmado(muchas, null, corto, 8);
  assert.equal(lineas.length, 10);
  assert.equal(lineas.at(-1), 'y 2 sesiones más');
});
