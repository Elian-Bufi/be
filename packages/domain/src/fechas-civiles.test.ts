/** Fechas civiles (`fechas-civiles.ts`): la zona se pasa siempre; la aritmética es de calendario. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diaSiguiente, diasEntreFechas, esFechaCivil, fechaCivil, inicioDelDia } from './fechas-civiles';

const BA = 'America/Argentina/Buenos_Aires';

test('la fecha civil depende de la zona, no del proceso; una zona desconocida cae a la fecha UTC', () => {
  assert.equal(fechaCivil('2026-09-30T02:30:00.000Z', BA), '2026-09-29');
  assert.equal(fechaCivil('2026-09-30T02:30:00.000Z', 'Asia/Tokyo'), '2026-09-30');
  assert.equal(fechaCivil('2026-09-30T02:30:00.000Z', 'Marte/Olympus'), '2026-09-30');
});

test('días de calendario, día siguiente e inicio del día en la zona', () => {
  assert.equal(diasEntreFechas('2026-09-29', '2026-10-01'), 2);
  assert.equal(diasEntreFechas('2026-10-01', '2026-09-29'), -2);
  assert.equal(diasEntreFechas('2025-12-31', '2026-01-01'), 1);
  assert.equal(diaSiguiente('2026-12-31'), '2027-01-01');
  assert.equal(new Date(inicioDelDia('2026-09-29', BA)).toISOString(), '2026-09-29T03:00:00.000Z');
  assert.equal(new Date(inicioDelDia('2026-09-29', 'UTC')).toISOString(), '2026-09-29T00:00:00.000Z');
  assert.equal(inicioDelDia('2026-09-29', 'Marte/Olympus'), inicioDelDia('2026-09-29', 'UTC'));
});

test('una fecha civil válida existe en el calendario', () => {
  assert.equal(esFechaCivil('2026-02-28'), true);
  assert.equal(esFechaCivil('2026-02-30'), false);
  assert.equal(esFechaCivil('2026-13-01'), false);
  assert.equal(esFechaCivil('ayer'), false);
  assert.equal(esFechaCivil('2026-09-30T00:00:00Z'), false);
  assert.equal(esFechaCivil(20260930), false);
});
