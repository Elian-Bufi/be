/**
 * Tanda 7 del editor de Entrenamiento · el plan en RPE: «Pasarlos a…» también para RIR y RPE (ET2-D06, a ratificar), entre
 * RIR y RPE sin casilla (es la misma medida), un solo texto del RPE y el esfuerzo de la sesión en la notación del plan.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as D from '@be/domain';

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const CUADROS = leer('app/pro/advisees/training/cuadros-del-plan.tsx');
const EJERCICIO = leer('app/pro/advisees/training/ejercicio-del-editor.tsx');

test('T7-01 · con cualquier cambio de intensidad se cuentan los que pierden el objetivo; entre RIR y RPE, sin casilla', () => {
  assert.match(CUADROS, /const otros = intensidad !== intensidadDeAntes \? conOtraIntensidad\(intensidad\) : 0;/);
  assert.doesNotMatch(CUADROS, /!\(\(intensidad === 'RIR' \|\| intensidad === 'RPE'\) && \(intensidadDeAntes === 'RIR'/, 'RPE ya no esconde «Pasarlos a…»');
  assert.match(CUADROS, /soloLaNotacion \? \(\n\s*<p className="nota" data-solo-la-notacion>\{T\.mismaMedida\(T\.nombreDeLaIntensidad\[intensidad\]\)\}<\/p>/);
  // Dice cuántos y qué se pierde.
  assert.match(CUADROS, /`Pasar los \$\{n\} ejercicios a \$\{nombre\}: pierden el objetivo de intensidad que tienen \(el % RM, o el RIR o RPE de sus series\) y lo escribís de nuevo\.`/);
  assert.match(CUADROS, /`Pasar el ejercicio a \$\{nombre\}: pierde el objetivo de intensidad/);
  assert.match(CUADROS, /`Hay \$\{n\} ejercicios con otra intensidad\./);
});

test('T7-02 · ET2-D06: la casilla «Pasarlos» viene marcada', () => {
  assert.match(CUADROS, /const \[pasar, setPasar\] = useState\(true\);/);
  assert.match(CUADROS, /setPasar\(true\);\n\s*\/\/ Solo al abrir/);
});

test('T7-03 · un solo texto del RPE, corto; el esfuerzo de la sesión nombra la notación del plan', () => {
  assert.match(CUADROS, /RPE: 'Esfuerzo percibido, de 6 a 10. Equivale a RIR: RPE 8 = 2 en reserva.',/);
  assert.doesNotMatch(CUADROS, /COPY_NOTACION_DEL_ESFUERZO\.queEs/, 'el segundo texto, que decía lo mismo, no va');
  assert.match(D.COPY_ESFUERZO_DE_LA_SESION.opcionExplicadaEn('RPE'), /aparte del RPE de cada serie\.$/);
  assert.match(D.COPY_ESFUERZO_DE_LA_SESION.opcionExplicadaEn('RIR'), /aparte del RIR de cada serie\.$/);
  assert.match(D.COPY_ESFUERZO_DE_LA_SESION.opcionExplicadaEn(null), /aparte de la intensidad de cada serie\.$/);
  assert.match(CUADROS, /opcionExplicadaEn\(intensidad === 'RPE' \|\| intensidad === 'RIR' \? intensidad : null\)/);
});

test('T7-04 · en RPE, nada de RIR a la vista: la columna, el ejemplo, lo que no se entiende y el resumen', async () => {
  const P = await import('../src/app/pro/advisees/training/planilla-de-series.ts');
  const [celda] = P.loQueNoSeEntiendeEnLasSeries('e', { sets: [{ repetitions: { value: 8 }, rir: Number.NaN }] }, ['la serie 1'], 'RPE');
  assert.equal(celda.que, 'el RPE de la serie 1');
  assert.match(celda.como, /de 6 a 10, de a medio punto, o «6 o menos»/);
  assert.match(EJERCICIO, /loQueNoSeEntiendeEnLasSeries\(id, p, p\.sets\.map\(\(_, n\) => cual\(n\)\), esfuerzo\)/);
  assert.match(EJERCICIO, /const nombreDeLaIntensidad = conRir \? esfuerzo :/);
  assert.match(EJERCICIO, /notacion === 'RPE' \? 'ej\. 8' : 'ej\. 2'/);
  // El resumen plegado, en RPE.
  const plegado = D.ejercicioPlegadoDelEditor({ intensity: { criterion: 'RIR', target: { value: 2 } }, sets: [{ repetitions: { value: 8 } }] }, 0, 'RPE');
  assert.match(JSON.stringify(plegado), /RPE 8/);
  assert.doesNotMatch(JSON.stringify(plegado), /RIR/);
});
