/**
 * DL-195 (WP-RECORRIDOS-GUIADOS) · Los recorridos guiados en el website, sin React (TEST-GUI-020 a 023): cada ancla de
 * cada paso está marcada en la pantalla con `data-recorrido`, los dos editores montan su recorrido y su «Ver el
 * recorrido», el botón es discreto (no un enlace subrayado), y el estilo sale de los tokens y no corre nada. La lógica de
 * los pasos y del estado visto u omitido está en `packages/domain/src/recorridos-guiados.test.ts`; el recorrido en Chrome,
 * en `test/navegador/recorridos.mjs` (`recorridosGuiados`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const d = await import('@be/domain');
const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const leer = (r) => readFileSync(join(SRC, r), 'utf8');

function archivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? archivos(p) : /\.tsx?$/.test(n) ? [p] : [];
  });
}
const FUENTES = archivos(SRC).map((p) => ({ p, texto: readFileSync(p, 'utf8') }));

// Las anclas que usan el atributo que el lugar ya tenía (la pieza las nombra en ANCLAS_CON_ATRIBUTO_PROPIO).
const PROPIAS = new Set(/ANCLAS_CON_ATRIBUTO_PROPIO: ReadonlySet<string> = new Set\(\[([^\]]*)\]\)/.exec(leer('components/recorrido-guiado.tsx'))[1].match(/'[^']+'/g).map((x) => x.slice(1, -1)));

test('TEST-GUI-020 · cada ancla de cada paso está marcada en la pantalla (data-recorrido, o el atributo propio data-<ancla>)', () => {
  const faltan = [];
  for (const def of Object.values(d.DEFINICIONES_DE_RECORRIDOS)) {
    for (const paso of def.pasos) {
      for (const ancla of paso.anclas) {
        const propio = PROPIAS.has(ancla) && FUENTES.some((f) => new RegExp(`\\sdata-${ancla}[\\s>=]`).test(f.texto));
        if (!propio && !FUENTES.some((f) => f.texto.includes(`data-recorrido="${ancla}"`))) faltan.push(`${def.id}/${paso.id}: ${ancla}`);
      }
    }
  }
  assert.deepEqual(faltan, []);
});

test('TEST-GUI-021 · los dos editores montan su recorrido, lo piden a la API y ofrecen «Ver el recorrido»', () => {
  const entrenamiento = leer('app/pro/advisees/training/editor.tsx');
  const nutricion = leer('app/pro/advisees/nutrition/editor.tsx');
  assert.match(entrenamiento, /useRecorridoGuiado\('training-plan-editor'/);
  assert.match(entrenamiento, /<RecorridoGuiado definicion=\{RECORRIDO_DEL_EDITOR_DE_ENTRENAMIENTO\}/);
  assert.match(entrenamiento, /<BotonVerElRecorrido alTocar=\{recorrido\.abrir\}/);
  assert.match(nutricion, /useRecorridoGuiado\('nutrition-plan-editor'/);
  assert.match(nutricion, /<RecorridoGuiado definicion=\{RECORRIDO_DEL_EDITOR_DE_NUTRICION\}/);
  assert.match(nutricion, /<BotonVerElRecorrido alTocar=\{recorrido\.abrir\}/);
  const pieza = leer('components/recorrido-guiado.tsx');
  assert.match(pieza, /api\.consultarRecorridosVistos/);
  assert.match(pieza, /api\.marcarRecorrido/);
});

test('TEST-GUI-022 · «Ver el recorrido» es un botón discreto, y el cartel un diálogo modal con Escape, flechas y Tab', () => {
  const pieza = leer('components/recorrido-guiado.tsx');
  assert.match(pieza, /<button type="button" className="boton boton--discreto recorrido__ver"/);
  assert.doesNotMatch(pieza, /boton--enlace/);
  assert.match(pieza, /role="dialog"/);
  assert.match(pieza, /aria-modal="true"/);
  for (const tecla of ["'Escape'", "'ArrowRight'", "'ArrowLeft'", "'Tab'"]) assert.ok(pieza.includes(tecla), tecla);
  assert.match(pieza, /prefers-reduced-motion/);
  assert.match(pieza, /createPortal/);
});

test('TEST-GUI-023 · el estilo sale de los tokens, va fijo a la ventana y el velo existe en los dos temas', () => {
  const css = leer('app/globals.css');
  const tokens = leer('app/tokens.css');
  const bloque = css.slice(css.indexOf('/* ─── Recorridos guiados'), css.indexOf('/*\n * La pista (DL-146)'));
  assert.ok(bloque.length > 0, 'el bloque de los recorridos está junto a «Cómo se lee esta vista»');
  assert.doesNotMatch(bloque, /#[0-9a-f]{3,8}\b|rgb\(/i, 'sin colores literales');
  assert.match(bloque, /\.recorrido \{\n {2}position: fixed;/);
  assert.match(bloque, /\.recorrido__cartel \{\n {2}position: fixed;/);
  assert.doesNotMatch(bloque, /text-decoration: underline/);
  const raiz = tokens.slice(tokens.indexOf(':root {'), tokens.indexOf('}', tokens.indexOf(':root {')));
  const noche = tokens.slice(tokens.indexOf("[data-tema='azul-noche'] {"));
  assert.match(raiz, /--velo-del-recorrido:/);
  assert.match(noche, /--velo-del-recorrido:/);
});
