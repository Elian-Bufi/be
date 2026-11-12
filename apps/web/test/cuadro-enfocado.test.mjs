/**
 * ED-10 · El cuadro enfocado (WP-EDITORES-PROFESIONAL, §2.3; TEST-EDP-011). El componente une el cajón y el diálogo, y
 * tiene las reglas: un solo principal, el foco al título y de vuelta al que lo abrió, Escape y «Cancelar» que no
 * escriben, y cerrar con cambios que pregunta en el mismo cuadro. Se lee el componente (sin React en las pruebas).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const CUADRO = leer('components/cuadro-enfocado.tsx');
const CAJON = leer('components/cajon.tsx');

test('TEST-EDP-011 · un solo botón principal por cuadro, y el cajón es su forma «panel»', () => {
  assert.equal(CUADRO.match(/boton--primario/g)?.length, 1);
  assert.match(CAJON, /<CuadroEnfocado forma="panel" \{\.\.\.props\} \/>/);
  assert.doesNotMatch(CAJON, /<dialog/);
});

test('TEST-EDP-011 · el foco entra al título (o a lo pedido) y el diálogo nativo modal lo devuelve al cerrar', () => {
  assert.match(CUADRO, /d\.showModal\(\);/);
  assert.match(CUADRO, /\(focoInicial\?\.current \?\? tituloRef\.current\)\?\.focus\(/);
  assert.match(CUADRO, /<h2 id=\{`\$\{id\}-titulo`\} ref=\{tituloRef\} tabIndex=\{-1\}>/);
});

test('TEST-EDP-011 · Escape, «Cerrar» y «Cancelar» no escriben: van por la misma salida, que solo llama a onCerrar', () => {
  const salida = CUADRO.slice(CUADRO.indexOf('const pedirCerrar'), CUADRO.indexOf('const clase'));
  assert.match(salida, /if \(ocupado\) return;/);
  assert.match(salida, /if \(conCambios && !preguntando\) return setPreguntando\(true\);/);
  assert.match(salida, /onCerrar\(\);/);
  assert.doesNotMatch(salida, /principal|alTocar/);
  assert.match(CUADRO, /onCancel=\{\(e\) => \{\n\s*e\.preventDefault\(\);\n\s*pedirCerrar\(\);/);
  // «Cerrar» y «Cancelar» llaman a la misma salida.
  assert.equal(CUADRO.match(/onClick=\{pedirCerrar\}/g)?.length, 3);
});

test('TEST-EDP-011 · con cambios, cerrar pregunta en el mismo cuadro, con «Seguir editando» enfocado', () => {
  assert.match(CUADRO, /if \(preguntando\) seguirRef\.current\?\.focus\(\);/);
  assert.match(CUADRO, /<button ref=\{seguirRef\} type="button" className="boton boton--secundario"/);
  // Un cuadro no abre otro: la pregunta es una parte del pie, no un `<dialog>` aparte.
  assert.equal(CUADRO.match(/<dialog\n/g)?.length, 1);
});
