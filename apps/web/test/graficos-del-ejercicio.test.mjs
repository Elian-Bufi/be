/**
 * DL-204 (WP-GRAFICOS-DEL-EJERCICIO) · los gráficos del ejercicio en el panel del editor de Entrenamiento: «La carga por
 * semana» con la regla, la historia y «Cambiar progresión…», y «Serie por serie» (TEST-GE-WEB-01 a 07). Las cuentas
 * viven en el dominio y tienen sus pruebas allá (`packages/domain/src/graficos-del-ejercicio.test.ts`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as D from '@be/domain';

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const CARGA = leer('app/pro/advisees/training/panel-de-la-parte-b.tsx');
const SERIES = leer('app/pro/advisees/training/serie-por-serie.tsx');
const GRAFICO = leer('app/pro/advisees/training/grafico-de-semanas.tsx');
const EDITOR = leer('app/pro/advisees/training/editor.tsx');
const PANEL = leer('app/pro/advisees/training/panel-del-editor.tsx');
const VEZ = leer('app/pro/advisees/training/la-vez-pasada.tsx');
const CSS = leer('app/globals.css');

test('TEST-GE-WEB-01 · arriba, la regla que rige y «Cambiar progresión…», que abre el cuadro ancho con el ejercicio elegido', () => {
  assert.match(CARGA, /<span className="carga-por-semana__regla-rotulo">\{C\.rigeLaRegla\}:<\/span> <strong>\{regla\.texto\}<\/strong>/);
  assert.match(CARGA, /onClick=\{onCambiarProgresion\} data-cambiar-progresion>\n\s+\{C\.cambiarProgresion\}/);
  assert.match(EDITOR, /regla: \{ texto: reglaEnPalabras\(cambiaAlgo\(regla\) \? regla : null, base\.unidad\), origen: cambiaAlgo\(regla\) \? origenEnPalabras\(origen\) : null \}/);
  assert.match(EDITOR, /conIdDeLaFase\(\(fase\) => setProgresionAbierta\(\{ blockId: fase, prescriptionId: id, copia: null \}\)\);\n\s+\}\n\s+: null,/);
  assert.equal(D.COPY_GRAFICOS_DEL_EJERCICIO.cambiarProgresion, 'Cambiar progresión…');
});

test('TEST-GE-WEB-02 · la historia: planificado antes, realizado y este plan, con el inicio marcado y la leyenda fija', () => {
  assert.match(CARGA, /\{ clave: 'antes', nombre: C\.planificadoAntes, forma: 'antes'/);
  assert.match(CARGA, /\{ clave: 'plan', nombre: C\.estePlan, forma: 'plan'/);
  assert.match(CARGA, /\{ clave: 'hecho', nombre: C\.realizado, forma: 'hecho'/);
  assert.match(CARGA, /separador=\{antes > 0 && fase \? \{ columna: antes \+ 1, rotulo: fase\.posicion === 0 \? C\.inicioDelPlan : C\.inicioDeLaFase \} : null\}/);
  // Lo planificado antes sale de las sesiones ya leídas para «La vez pasada»: ninguna lectura nueva.
  assert.match(VEZ, /ejecuciones: d\.registeredExecutions \}/);
  assert.match(PANEL, /lectura\.tipo === 'lista' \? lectura\.ejecuciones : null/);
  assert.match(CARGA, /cargasPlanificadasDelEjercicio\(ejecuciones, exerciseId, unidad\)/);
  // Lo realizado, en puntos llenos, sin línea; lo de antes, punteado y tenue.
  assert.match(GRAFICO, /\.filter\(\(t\) => t\.length > 1 && s\.forma !== 'hecho'\)/);
  assert.match(CSS, /\.grafico-de-semanas__linea--antes \{\n  stroke: var\(--tenue\);\n  stroke-width: 1\.5;\n  stroke-dasharray: 2 3;\n\}/);
});

test('TEST-GE-WEB-03 · RP-19: el renglón de los registros está siempre y dice «Sin registros todavía» si no hay', () => {
  assert.match(CARGA, /<p className="nota carga-por-semana__registros" aria-live="polite"/);
  assert.match(CARGA, /veces === null \? C\.leyendo : hayRegistros \? '\\u00a0' : C\.sinRegistros/);
  assert.match(CSS, /\.carga-por-semana__registros \{\n  min-height: 1\.3em;/);
  assert.equal(D.COPY_GRAFICOS_DEL_EJERCICIO.sinRegistros, 'Sin registros todavía');
});

test('TEST-GE-WEB-04 · serie por serie: las series en orden, desde 0, las aproximaciones más suaves y el 1RM punteado', () => {
  assert.match(SERIES, /const y = \(v: number\) => M\.arr \+ alto - \(v \/ \(yMax \|\| 1\)\) \* alto;/);
  assert.match(SERIES, /for \(let v = 0; v <= max/);
  assert.match(SERIES, /b\.aproximacion \? 'serie-por-serie__barra serie-por-serie__barra--aproximacion' : 'serie-por-serie__barra'/);
  assert.match(SERIES, /<title>\{textoDeLaBarra\(b, unidad\)\}<\/title>/);
  assert.match(SERIES, /\{C\.unoRM\(unoRM, unidad\)\}/);
  assert.match(CSS, /\.serie-por-serie__uno-rm line \{\n  stroke: var\(--tenue\);\n  stroke-width: 1\.25;\n  stroke-dasharray: 4 3;\n\}/);
  assert.match(CSS, /\.serie-por-serie__barra--aproximacion \{\n  fill-opacity: 0\.35;\n\}/);
});

test('TEST-GE-WEB-05 · el selector de semana lleva la progresión a cada serie; lo realizado de esa semana se superpone', () => {
  assert.match(SERIES, /prescripcionDeLaSemana\(prescripcion, \{ \.\.\.reglas, semana: elegida, semanas: n \}, nombre, aproximaciones\)/);
  assert.match(SERIES, /data-semana-de-las-series/);
  assert.match(SERIES, /vezDeLaSemana\(veces, fase, elegida\)/);
  assert.match(SERIES, /className="serie-por-serie__hecho"/);
  // Accesible: el foco, ← y →, la lectura en su renglón y «Ver la tabla».
  assert.match(SERIES, /tabIndex=\{0\}\n\s+onKeyDown=\{alTeclado\}/);
  assert.match(SERIES, /className="grafico-de-semanas__lectura nota" aria-live="polite"/);
  assert.match(SERIES, /\{tabla \? 'Ocultar la tabla' : 'Ver la tabla'\}/);
});

test('TEST-GE-WEB-06 · el cardio no lleva «Serie por serie»; los favoritos del plan, solo el gráfico', () => {
  assert.match(EDITOR, /\{abrirProgresion && !cardioDe\(q\) \? \(\n\s+<SeriePorSerie/);
  assert.match(EDITOR, /cargaPorSemana=\{cargaPorSemanaDe\(n, q, exerciseId\)\}\n\s+soloElGrafico/);
});

test('TEST-GE-WEB-07 · ubica, no califica: sin colores de juicio ni palabras de logro en lo nuevo', () => {
  for (const fuente of [SERIES, CARGA]) {
    assert.doesNotMatch(fuente, /--error|--exito|cumplimiento|adherencia/i);
  }
  const css = CSS.slice(CSS.indexOf('/* DL-204 (GE-05 a GE-08)'), CSS.indexOf('.serie-por-serie__vacia'));
  assert.doesNotMatch(css, /--error|--exito|--alerta/);
});
