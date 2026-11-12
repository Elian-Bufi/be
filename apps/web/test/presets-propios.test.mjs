/**
 * ED-13 · Los presets propios en el website (WP-EDITORES-PROFESIONAL; DL-167): una prescripción habitual se aplica como
 * un preset de BE (DJ-8): con un clic si solo llena lo vacío, con la vista previa del alcance si pisa algo, las cargas
 * se conservan y «Deshacer» devuelve lo de antes. Y el reparto habitual se escribe siempre en gramos (DJ-7).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const A = await import('../src/app/pro/advisees/alcance-del-preset.ts');

const habitual = { sets: [{ repetitions: { value: 3 } }, { repetitions: { value: 3 } }, { repetitions: { value: 3 } }], intensity: { criterion: 'RIR', target: { value: 1, reference: null } }, restSeconds: 180 };
const nombreDe = (p) => p.exerciseVersionId;

test('ED-13 · sobre ejercicios vacíos, un clic: la habitual llena las series', () => {
  const vacios = [{ exerciseVersionId: 'Sentadilla', sets: [{ repetitions: null }], intensity: null }];
  const a = A.alcanceDeLaHabitual(vacios, [0], habitual, nombreDe, 'Piernas A');
  assert.equal(a.soloLlenaLoVacio, true);
  assert.equal(a.nuevas.get(0).sets.length, 3);
  assert.equal(a.nuevas.get(0).intensity.criterion, 'RIR');
});

test('ED-13 (DJ-8) · si pisa algo, la vista previa lo dice; las cargas se conservan y «Deshacer» devuelve lo de antes', () => {
  const conCargas = [{ exerciseVersionId: 'Press', sets: [{ repetitions: { min: 6, max: 8 } }, { repetitions: { min: 6, max: 8 } }], intensity: null, suggestedLoad: { value: 80, unit: 'kg' } }];
  const antes = structuredClone(conCargas);
  const a = A.alcanceDeLaHabitual(conCargas, [0], habitual, nombreDe, 'Torso A');
  assert.equal(a.soloLlenaLoVacio, false);
  assert.deepEqual(a.nuevas.get(0).suggestedLoad, { value: 80, unit: 'kg' });
  assert.equal(a.filas[0].cambio.carga.revisar, 'escrita para 6-8: revisala');
  assert.match(a.resumen, /pasa de 2 a 3 series/);
  assert.deepEqual(a.antes.get(0), antes[0]);
  assert.deepEqual(conCargas, antes);
});

test('DJ-7 · el reparto habitual se lee y se guarda en gramos por día, sin porcentajes', () => {
  const fuente = readFileSync(new URL('../src/app/pro/advisees/nutrition/repartos-habituales.tsx', import.meta.url), 'utf8');
  assert.match(fuente, /unit: 'g\/day' as const/);
  assert.doesNotMatch(fuente, /%/);
});
