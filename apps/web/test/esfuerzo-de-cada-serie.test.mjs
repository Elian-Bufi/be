/**
 * DL-202 (WP-ESFUERZO-POR-SERIE) en el website: «Pedir el esfuerzo de cada serie» en «Configurar plan» y lo que cambia en
 * Registros cuando el plan no la pide.
 *  1. La casilla está en el mismo bloque que la del esfuerzo de la sesión, apagada por defecto, con el texto en la
 *     notación que se está eligiendo; tocarla deja el valor escrito (`true` o `false`).
 *  2. Un plan de antes, sin la opción escrita, la muestra como la resolvió la API (`askSetEffort` de API-SER-01).
 *  3. Registros: las versiones que no la piden no cuentan un RIR sin registrar como un dato que falta, y la comparación no
 *     ofrece el RIR si nadie lo registró.
 *  4. El CSS nuevo va junto a su tema, no al final de globals.css.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as D from '@be/domain';

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const CUADROS = leer('app/pro/advisees/training/cuadros-del-plan.tsx');
const EDITOR = leer('app/pro/advisees/training/editor.tsx');
const EJECUCIONES = leer('app/pro/advisees/training/ejecuciones.tsx');
const COMPARACION = leer('app/pro/advisees/training/comparacion.tsx');
const CSS = leer('app/globals.css');

test('1 · la casilla, en el bloque del esfuerzo de la sesión, apagada por defecto y con la notación del plan', () => {
  const bloque = CUADROS.slice(CUADROS.indexOf('<div className="esfuerzo-de-la-sesion-del-plan"'), CUADROS.indexOf('{enLaPlantilla ? null : (\n        <div className="datos-del-plan__textos">'));
  assert.ok(bloque.includes('data-pedir-el-esfuerzo\n'), 'la del esfuerzo de la sesión');
  assert.ok(bloque.includes('data-pedir-el-esfuerzo-de-cada-serie'), 'y la nueva, en el mismo bloque');
  assert.ok(bloque.indexOf('data-pedir-el-esfuerzo\n') < bloque.indexOf('data-pedir-el-esfuerzo-de-cada-serie'), 'debajo de la de la sesión');
  assert.match(bloque, /\{COPY_ESFUERZO_DE_CADA_SERIE\.opcionDelPlan\}/);
  assert.match(bloque, /COPY_ESFUERZO_DE_CADA_SERIE\.opcionExplicada\(guardadoDeLaIntensidad\(intensidad, notacion\)\.notacion\)/, 'la notación que se está eligiendo');
  // Apagada por defecto: sin nada escrito ni resuelto por la API, `false`.
  assert.match(CUADROS, /pedidoPorLosRegistros = false,/);
  assert.match(bloque, /checked=\{p\.askSetEffort \?\? pedidoPorLosRegistros\}/);
  // Tocarla deja el valor escrito, en los dos estados.
  assert.match(bloque, /onChange=\{\(e\) => setP\(\{ \.\.\.p, askSetEffort: e\.target\.checked \}\)\}/);
  assert.equal(D.COPY_ESFUERZO_DE_CADA_SERIE.opcionExplicada('RPE'), 'La app le pregunta a la persona el RPE de cada serie efectiva, no de las aproximaciones.');
  assert.equal(D.COPY_ESFUERZO_DE_CADA_SERIE.opcionExplicada('RIR'), 'La app le pregunta a la persona el RIR de cada serie efectiva, no de las aproximaciones.');
  for (const t of [D.COPY_ESFUERZO_DE_CADA_SERIE.opcionDelPlan, D.COPY_ESFUERZO_DE_CADA_SERIE.opcionExplicada('RIR'), D.COPY_ESFUERZO_DE_CADA_SERIE.porLosRegistros]) {
    assert.doesNotMatch(t, /cumplimiento|adherencia|racha|puntaje|volumen/i, t);
  }
});

test('2 · un plan de antes muestra lo que resolvió la API, y lo guardado manda en los dos estados', () => {
  assert.match(EDITOR, /pedidoPorLosRegistros=\{!!version && 'askSetEffort' in version && version\.askSetEffort === true\}/);
  // La aclaración sale de lo guardado, no de la casilla: no aparece ni se va al tocarla (RP-19).
  assert.match(CUADROS, /planificacion\.askSetEffort === undefined && pedidoPorLosRegistros \?/);
  const base = { startDate: null, weeks: null, goal: null, phases: [] };
  assert.equal(D.pideElEsfuerzoDeCadaSerie(base, false), false, 'nuevo, apagado');
  assert.equal(D.pideElEsfuerzoDeCadaSerie(base, true), true, 'de antes, con esfuerzos registrados');
  assert.equal(D.pideElEsfuerzoDeCadaSerie({ ...base, askSetEffort: false }, true), false, 'apagado a mano');
  assert.equal(D.pideElEsfuerzoDeCadaSerie({ ...base, askSetEffort: true }, false), true, 'encendido a mano');
  assert.equal(D.PlanConObjetivosSchema.shape.askSetEffort.safeParse(false).success, true);
});

test('3 · Registros sin el esfuerzo de cada serie: sin «RIR: sin dato» ni la medida del RIR vacía', () => {
  assert.match(EJECUCIONES, /plan\?\.askSetEffort === false/);
  assert.match(EJECUCIONES, /componerLasSesiones\(ejecuciones, objetivosPorVersion, notacion, sinEsfuerzoPorSerie\)/);
  assert.match(EJECUCIONES, /pideElEsfuerzo=\{!sinEsfuerzoPorSerie\.has\(abierta\.planId\)\}/);
  assert.match(COMPARACION, /medidasDisponibles\(\[c\], pideElEsfuerzo\)/);
  const objetivo = { repetitions: { value: 8 }, rir: 2, suggestedLoad: null };
  const sinRir = { setIndex: 1, load: { value: 60, unit: 'kg' }, completedRepetitions: 8, rir: null, perceivedExertion: null };
  assert.equal(D.relacionDeUnaSerie(objetivo, sinRir, 'RIR', true).texto, 'RIR: sin dato');
  assert.equal(D.relacionDeUnaSerie(objetivo, sinRir, 'RIR', false).texto, 'Dentro de lo indicado');
});

test('4 · el CSS nuevo va junto al del esfuerzo de la sesión, no al final de globals.css', () => {
  const tema = CSS.indexOf('.esfuerzo-de-la-sesion-del-plan .nota {');
  const nuevo = CSS.indexOf('.esfuerzo-de-la-sesion-del-plan .esfuerzo-de-cada-serie-del-plan {');
  assert.ok(tema > 0 && nuevo > tema && nuevo - tema < 200, 'pegado a su tema');
  assert.ok(nuevo < CSS.length - 2000, 'no al final');
});
