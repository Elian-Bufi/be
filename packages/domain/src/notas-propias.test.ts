/**
 * WP-PULIDO-GRANDES (DL-173), la parte pura de las dos notas:
 * - TEST-PG-015 (PG-16): las notas propias del profesional. Dónde aparece una nota atada en el editor, cómo se dice su
 *   ancla en el bloc y que archivar no borra (la archivada sigue en «Archivadas»). Lo que solo puede ver su autor lo fija
 *   la prueba de integración `test/integration/notas-pulido-grandes.int-spec.ts`.
 * - TEST-PG-014 (PG-15): los contratos de la nota para el profe: hasta 280 caracteres, sin campos de más, y cómo se agrupan
 *   por sesión las que lee el profesional (la nueva queda debajo).
 *
 * Mutaciones verificadas, cada una pone su prueba en rojo: comparar las comidas sin sacar las tildes; dejar que una nota
 * archivada aparezca al lado de su ejercicio; decir «Sobre…» cuando el ejercicio ya no está en el plan; ordenar las notas
 * de una sesión de la más nueva a la más vieja.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AgregarNotaDeLaSesionRequestSchema, MAXIMO_DE_CARACTERES_DE_LA_NOTA_DE_LA_SESION, NotaDeLaSesionSchema } from './contratos-notas-de-la-sesion';
import { AgregarNotaPropiaRequestSchema, MAXIMO_DE_CARACTERES_DE_LA_NOTA_PROPIA, type NotaPropia } from './contratos-notas-propias';
import { notasPorSesion } from './copy-notas-de-la-sesion';
import { claveDeLaComida, mismaComida, notasActivas, notasArchivadas, notasPropiasDeLaComida, notasPropiasDelEjercicio, rotuloDelAncla } from './notas-propias';

const SENTADILLA = '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e01';
const BANCA = '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e02';

const nota = (noteId: string, campos: Partial<NotaPropia> = {}): NotaPropia => ({
  noteId,
  adviseeId: 'persona',
  text: `Nota ${noteId}`,
  anchor: null,
  recordedAt: '2026-11-10T12:00:00.000Z',
  archivedAt: null,
  ...campos,
});
const delEjercicio = (exerciseId: string, inPlan: boolean | null = true) => ({ type: 'EXERCISE' as const, exerciseId, exerciseName: 'Sentadilla', inPlan });
const deLaComida = (mealLabel: string, inPlan: boolean | null = true) => ({ type: 'MEAL' as const, mealLabel, inPlan });

test('TEST-PG-015 · la comida es la misma sin mirar mayúsculas, tildes ni espacios de más', () => {
  assert.equal(claveDeLaComida('  Almuerzo   del  mediodía '), 'almuerzo del mediodia');
  assert.equal(mismaComida('Colación', 'colacion'), true);
  assert.equal(mismaComida('Almuerzo', 'Cena'), false);
});

test('TEST-PG-015 · al lado del ejercicio, solo sus notas activas, de la más nueva a la más vieja', () => {
  const notas = [
    nota('a', { anchor: delEjercicio(SENTADILLA), recordedAt: '2026-11-01T10:00:00.000Z' }),
    nota('b', { anchor: delEjercicio(SENTADILLA), recordedAt: '2026-11-08T10:00:00.000Z' }),
    nota('c', { anchor: delEjercicio(SENTADILLA), archivedAt: '2026-11-09T10:00:00.000Z' }),
    nota('d', { anchor: delEjercicio(BANCA) }),
    nota('e'),
  ];
  assert.deepEqual(notasPropiasDelEjercicio(notas, SENTADILLA.toUpperCase()).map((n) => n.noteId), ['b', 'a']);
  assert.deepEqual(notasPropiasDelEjercicio(notas, null), []);
});

test('TEST-PG-015 · al lado de cada comida con ese nombre, en cualquier día tipo', () => {
  const notas = [nota('a', { anchor: deLaComida('Almuerzo') }), nota('b', { anchor: deLaComida('Cena') }), nota('c', { anchor: deLaComida('almuerzo'), archivedAt: '2026-11-11T10:00:00.000Z' })];
  assert.deepEqual(notasPropiasDeLaComida(notas, 'ALMUERZO').map((n) => n.noteId), ['a']);
  assert.deepEqual(notasPropiasDeLaComida(notas, '   '), []);
});

test('TEST-PG-015 · archivar no borra: la nota pasa de las activas a las archivadas', () => {
  const notas = [nota('a'), nota('b', { archivedAt: '2026-11-12T10:00:00.000Z' }), nota('c', { archivedAt: '2026-11-13T10:00:00.000Z' })];
  assert.deepEqual(notasActivas(notas).map((n) => n.noteId), ['a']);
  assert.deepEqual(notasArchivadas(notas).map((n) => n.noteId), ['c', 'b']);
  assert.equal(notasActivas(notas).length + notasArchivadas(notas).length, notas.length);
});

test('TEST-PG-015 · el ancla en el bloc: «que ya no está» solo si el plan ya no la tiene', () => {
  assert.equal(rotuloDelAncla(null), null);
  assert.equal(rotuloDelAncla(delEjercicio(SENTADILLA, true)), 'Sobre el ejercicio Sentadilla');
  assert.equal(rotuloDelAncla(delEjercicio(SENTADILLA, false)), 'Del ejercicio Sentadilla, que ya no está en el plan');
  // Sin plan de esa área no se sabe si «estaba»: no se dice que ya no está.
  assert.equal(rotuloDelAncla(delEjercicio(SENTADILLA, null)), 'Sobre el ejercicio Sentadilla');
  assert.equal(rotuloDelAncla(deLaComida('Almuerzo', false)), 'De la comida «Almuerzo», que ya no está en el plan');
  assert.equal(rotuloDelAncla(deLaComida('Almuerzo', null)), 'Sobre la comida «Almuerzo»');
});

test('TEST-PG-015 · el pedido: hasta 1000 caracteres, el ancla es un ejercicio o una comida, y nada más', () => {
  assert.equal(AgregarNotaPropiaRequestSchema.safeParse({ text: 'x'.repeat(MAXIMO_DE_CARACTERES_DE_LA_NOTA_PROPIA) }).success, true);
  assert.equal(AgregarNotaPropiaRequestSchema.safeParse({ text: 'x'.repeat(MAXIMO_DE_CARACTERES_DE_LA_NOTA_PROPIA + 1) }).success, false);
  assert.equal(AgregarNotaPropiaRequestSchema.safeParse({ text: '   ' }).success, false);
  assert.equal(AgregarNotaPropiaRequestSchema.safeParse({ text: 'ok', anchor: { type: 'EXERCISE', exerciseId: SENTADILLA } }).success, true);
  assert.equal(AgregarNotaPropiaRequestSchema.safeParse({ text: 'ok', anchor: { type: 'MEAL', mealLabel: 'Almuerzo' } }).success, true);
  assert.equal(AgregarNotaPropiaRequestSchema.safeParse({ text: 'ok', anchor: { type: 'EXERCISE', exerciseId: 'sentadilla' } }).success, false);
  assert.equal(AgregarNotaPropiaRequestSchema.safeParse({ text: 'ok', anchor: { type: 'SESSION', sessionId: 'x' } }).success, false);
  assert.equal(AgregarNotaPropiaRequestSchema.safeParse({ text: 'ok', recipients: [] }).success, false);
});

test('TEST-PG-014 · la nota para el profe: hasta 280 caracteres, recortada en sus bordes, sin campos de más', () => {
  const r = AgregarNotaDeLaSesionRequestSchema.safeParse({ text: '  Tuve poco tiempo.  ' });
  assert.equal(r.success && r.data.text, 'Tuve poco tiempo.');
  assert.equal(AgregarNotaDeLaSesionRequestSchema.safeParse({ text: 'x'.repeat(MAXIMO_DE_CARACTERES_DE_LA_NOTA_DE_LA_SESION + 1) }).success, false);
  assert.equal(AgregarNotaDeLaSesionRequestSchema.safeParse({ text: '' }).success, false);
  assert.equal(AgregarNotaDeLaSesionRequestSchema.safeParse({ text: 'ok', sessionCondition: 'COMPLETED' }).success, false);
  assert.equal(NotaDeLaSesionSchema.safeParse({ noteId: 'n', executionId: 'x', text: 'ok', recordedAt: '2026-11-14T12:00:00.000Z', reply: 'no' }).success, false);
});

test('TEST-PG-014 · las notas de cada sesión, de la más vieja a la más nueva: una nueva queda debajo', () => {
  const porSesion = notasPorSesion([
    { noteId: '2', executionId: 'x1', recordedAt: '2026-11-14T12:05:00.000Z' },
    { noteId: '3', executionId: 'x2', recordedAt: '2026-11-13T09:00:00.000Z' },
    { noteId: '1', executionId: 'x1', recordedAt: '2026-11-14T12:00:00.000Z' },
  ]);
  assert.deepEqual(porSesion.get('x1')?.map((n) => n.noteId), ['1', '2']);
  assert.deepEqual(porSesion.get('x2')?.map((n) => n.noteId), ['3']);
  assert.equal(porSesion.get('x3'), undefined);
});
