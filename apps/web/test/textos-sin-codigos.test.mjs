/**
 * ED-05 · Textos sin códigos internos (WP-EDITORES-PROFESIONAL; TEST-EDP-006), la parte del website: «Pedir información»
 * muestra la descripción de cada plantilla que da el dominio, por su clave, y nunca el propósito guardado (que lleva notas
 * del equipo, como «Sucede a la v2 (DL-165, ronda 2.1)»). La regla sobre todos los textos de /pro está en T13
 * (`scripts/copy-pantallas.test.cjs`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const d = await import('@be/domain');
const pedir = readFileSync(new URL('../src/app/pro/advisees/forms/pedir.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('TEST-EDP-006 · «Pedir información» muestra la descripción del dominio, no el propósito guardado', () => {
  assert.match(pedir, /\{descripcionDeLaPlantilla\(p\.key, p\.purpose\)\}/);
  assert.doesNotMatch(pedir, /\{p\.purpose\}/);
  // Con el propósito guardado de la versión vigente, lo que se ve no tiene códigos.
  for (const p of d.PLANTILLAS_VIGENTES_DE_INICIO) {
    const visto = d.descripcionDeLaPlantilla(p.clave, p.proposito);
    assert.ok(visto, p.clave);
    assert.doesNotMatch(visto, d.CODIGO_INTERNO, visto);
  }
});
