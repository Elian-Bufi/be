/**
 * DL-111 · las figuras de la lámina son las del compositor de Dirección, byte a byte, en todos los lugares desde donde se
 * sirven: el dominio guarda la huella de cada PNG (`FIGURAS_DE_LA_LAMINA`) y esta prueba la compara con las copias que
 * empaquetan la APK y el website. Si alguien recomprime o reemplaza una imagen, las posiciones calibradas en el
 * compositor dejan de caer sobre el cuerpo: por eso no se acepta otra imagen sin pasar por el dominio.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { FIGURAS_DE_LA_LAMINA } = require('../packages/domain/dist');

const RAIZ = join(__dirname, '..');
const huella = (ruta) => createHash('sha256').update(readFileSync(ruta)).digest('hex');
const figuras = Object.values(FIGURAS_DE_LA_LAMINA).flatMap((porEncuadre) => Object.values(porEncuadre));

test('las seis figuras del dominio son los PNG del compositor', () => {
  assert.equal(figuras.length, 6);
  for (const f of figuras) assert.equal(huella(join(RAIZ, 'packages/domain/assets/figura', f.archivo)), f.sha256, f.archivo);
});

test('las copias de la APK y del website son las mismas imágenes', () => {
  const copias = [join(RAIZ, 'apps/mobile/assets/figura'), join(RAIZ, 'apps/web/public/figura')];
  let revisadas = 0;
  for (const carpeta of copias) {
    for (const f of figuras) {
      const ruta = join(carpeta, f.archivo);
      if (!existsSync(ruta)) continue;
      assert.equal(huella(ruta), f.sha256, ruta);
      revisadas += 1;
    }
  }
  // La APK lleva al menos el cuerpo entero de las dos figuras.
  assert.ok(revisadas >= 2);
});
