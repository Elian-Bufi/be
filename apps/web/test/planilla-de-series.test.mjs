/**
 * ED-23 · La planilla de series (WP-EDITORES-PROFESIONAL). La lógica, sin React (`planilla-de-series.ts`); de la
 * planilla se lee la fuente.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const d = await import('@be/domain');
const P = await import('../src/app/pro/advisees/training/planilla-de-series.ts');
const EJERCICIO = readFileSync(new URL('../src/app/pro/advisees/training/ejercicio-del-editor.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const prescripcion = (sets) => ({ exerciseVersionId: 'e', sets, intensity: { criterion: 'RIR', target: { value: 2, reference: null } }, restSeconds: 90 });
const estructura = (p) => ({ blocks: [{ label: 'B', sessions: [{ label: 'S', instructions: null, prescriptions: [p] }] }] });
const tres = () => [{ repetitions: { value: 8 } }, { repetitions: { value: 8 } }, { repetitions: { value: 8 } }, { repetitions: { value: 8 } }];

test('TEST-EDP-024 · lo que se ve heredado es lo que la API guarda heredado', () => {
  const sets = tres();
  // Tres series elegidas, «2:00» en descanso: las tres lo tienen propio; la cuarta sigue tomando de lo general.
  const escritas = P.escribirEnLasSeries(sets, new Set([0, 1, 2]), 'restSeconds', 120);
  assert.deepEqual(escritas.map((s) => s.restSeconds), [120, 120, 120, undefined]);
  assert.equal('restSeconds' in escritas[3], false);
  // Lo efectivo de cada serie (lo que recibe la APK) dice el propio en las tres y el general en la cuarta.
  assert.deepEqual(d.objetivosEfectivos(prescripcion(escritas)).map((o) => o.restSeconds), [120, 120, 120, 90]);
  // Un RIR propio distinto de lo general: la API lo trata como objetivo por serie.
  const conRir = P.escribirEnLasSeries(escritas, new Set([0, 1, 2]), 'rir', 1);
  assert.equal(d.planExigeObjetivosPorSerie(estructura(prescripcion(conRir))), true);
  // «Volver a lo general» quita la clave (no deja un null, que sería «Sin objetivo»): todo vuelve a heredarse.
  const devueltas = P.volverALoGeneral(conRir, new Set([0, 1, 2]));
  assert.deepEqual(devueltas, sets);
  assert.equal(d.planExigeObjetivosPorSerie(estructura(prescripcion(devueltas))), false);
  // «Sin objetivo» (null) también vuelve a lo general; las repeticiones y la nota no se tocan.
  const conNull = [{ repetitions: { value: 6 }, rir: null, note: 'x', suggestedLoad: { value: 80, unit: 'kg' } }];
  assert.deepEqual(P.volverALoGeneral(conNull, new Set([0])), [{ repetitions: { value: 6 }, note: 'x' }]);
});

test('ED-23 · Ctrl+D copia hacia abajo, también «toma de lo general»', () => {
  const sets = [{ repetitions: { min: 8, max: 12 }, suggestedLoad: { value: 60, unit: 'kg' } }, { repetitions: { value: 6 }, restSeconds: 60 }];
  const copiada = P.copiarHaciaAbajo(sets, 1, 'repetitions');
  assert.deepEqual(copiada[1].repetitions, { min: 8, max: 12 });
  // Una copia, no la misma referencia.
  assert.notEqual(copiada[1].repetitions, sets[0].repetitions);
  assert.deepEqual(P.copiarHaciaAbajo(sets, 1, 'suggestedLoad')[1].suggestedLoad, { value: 60, unit: 'kg' });
  // La de arriba toma el descanso de lo general: la de abajo también.
  assert.equal('restSeconds' in P.copiarHaciaAbajo(sets, 1, 'restSeconds')[1], false);
  // La primera no tiene de dónde copiar.
  assert.deepEqual(P.copiarHaciaAbajo(sets, 0, 'repetitions'), sets);
  assert.deepEqual(P.celdaDeLaPlanilla('b0-s1-p2-serie-3-carga', 'b0-s1-p2'), { serie: 3, campo: 'suggestedLoad' });
  assert.deepEqual(P.celdaDeLaPlanilla('b0-s1-p2-serie-0', 'b0-s1-p2'), { serie: 0, campo: 'repetitions' });
  assert.equal(P.celdaDeLaPlanilla('b0-s1-p22-serie-0', 'b0-s1-p2'), null);
});

test('TEST-EDP-056 · quitar una serie con valores propios los nombra antes, y «Cancelar» no toca nada', () => {
  const sets = [{ repetitions: { value: 8 } }, { repetitions: { value: 8 }, rir: 1, suggestedLoad: { value: 82.5, unit: 'kg' } }];
  assert.equal(P.loQueSePierdeAlQuitarLaSerie(sets, 1), 'Quitar la serie 2: se pierde su RIR (1) y su carga (82,5 kg).');
  // Sin valores propios, se quita sin preguntar.
  assert.equal(P.loQueSePierdeAlQuitarLaSerie(sets, 0), null);
  assert.match(EJERCICIO, /if \(loQueSePierdeAlQuitarLaSerie\(p\.sets, n\)\) return setQuitando\(n\);/);
  // «Cancelar» enfocado; cerrar el cuadro (Escape, «Cerrar», «Cancelar») solo lo cierra.
  assert.match(EJERCICIO, /focoEnCancelar\n\s*principal=/);
  assert.match(EJERCICIO, /onCerrar=\{\(\) => setQuitando\(null\)\}/);
});
