/**
 * El período de una revisión en preparación (WP-ESCRITORIO-AREAS, parte 10; `apps/web/src/app/pro/advisees/periodo-de-la-revision.ts`):
 * el que propone BE (desde la última revisión, hasta 92 días) y la frase que dice de dónde salió el que se está mirando.
 * «Preparado por BE» se dice solo si el período es el que BE preparó.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const { periodoPreparado, procedenciaDelPeriodo } = await import('../apps/web/src/app/pro/advisees/periodo-de-la-revision.ts');
const { diaDelAnioEnCurso } = await import('../apps/web/src/lib/formato.ts');

const HOY = '2026-10-14';
const decir = (d) => diaDelAnioEnCurso(d, HOY);
// La última es la del 27 de septiembre a las 23:30 en Buenos Aires: en UTC ya es el 28, y el día civil es el 27.
const REVISIONES = [{ recordedAt: '2026-09-10T15:00:00Z' }, { recordedAt: '2026-09-28T02:30:00Z' }];

test('BE propone desde el día civil de la última revisión hasta hoy', () => {
  assert.deepEqual(periodoPreparado(REVISIONES, HOY), { desde: '2026-09-27', hasta: HOY, ultimaRevision: '2026-09-27' });
  assert.equal(periodoPreparado([], HOY), null, 'sin revisiones, queda el período que propone la API');
});

test('una revisión de hace más de 92 días se recorta a los últimos 92, y la frase lo dice', () => {
  const p = periodoPreparado([{ recordedAt: '2026-05-02T15:00:00Z' }], HOY);
  assert.deepEqual(p, { desde: '2026-07-15', hasta: HOY, ultimaRevision: '2026-05-02' });
  assert.equal(procedenciaDelPeriodo({ start: p.desde, end: p.hasta }, p, true, decir), 'Preparado por BE: los últimos 92 días, lo más largo que abarca una revisión. Tu última revisión fue el 2 may.');
});

test('«Preparado por BE» se dice solo si el período es el que BE preparó', () => {
  const p = periodoPreparado(REVISIONES, HOY);
  assert.equal(procedenciaDelPeriodo({ start: '2026-09-27', end: HOY }, p, true, decir), 'Preparado por BE: desde tu última revisión, del 27 sept, hasta hoy.');
  const otro = procedenciaDelPeriodo({ start: '2026-09-15', end: HOY }, p, true, decir);
  assert.equal(otro, 'Lo elegiste vos. Tu última revisión fue el 27 sept.');
  assert.doesNotMatch(otro, /Preparado por BE/);
  assert.match(procedenciaDelPeriodo({ start: '2026-09-27', end: '2026-10-13' }, p, true, decir), /^Lo elegiste vos\./, 'el mismo comienzo con otro fin tampoco es el preparado');
});

test('sin revisiones, el período que propone la API se dice como propuesto por BE; uno pedido, como elegido', () => {
  assert.equal(procedenciaDelPeriodo({ start: '2026-10-08', end: HOY }, null, false, decir), 'Preparado por BE: todavía no hay revisiones registradas, así que es el período que propone BE.');
  assert.equal(procedenciaDelPeriodo({ start: '2026-10-01', end: HOY }, null, true, decir), 'Lo elegiste vos. Todavía no hay revisiones registradas.');
});

test('una revisión de otro año lleva el año', () => {
  const p = periodoPreparado([{ recordedAt: '2025-12-30T15:00:00Z' }], '2026-01-10');
  assert.equal(procedenciaDelPeriodo({ start: p.desde, end: p.hasta }, p, true, (d) => diaDelAnioEnCurso(d, '2026-01-10')), 'Preparado por BE: desde tu última revisión, del 30 dic 2025, hasta hoy.');
});
