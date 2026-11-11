/**
 * WP-CATALOGO-VISUAL (etapa 2; DL-081): las capas de la figura de zonas del website (`apps/web/public/zonas/`) son las
 * del set de Dirección, una por zona y vista, y ninguna sobra ni falta. La figura arma el nombre de cada archivo con el
 * identificador de la zona (`be-mask-m-{front|back}-{zona}.png`): una zona nueva o renombrada en el dominio sin su
 * máscara se vería como un hueco en la pantalla, sin error. También cuida el peso: el cuerpo de frente original pesaba
 * 2,1 MB.
 *
 * Uso: node --test scripts/figura-de-zonas.test.cjs (después de construir @be/domain).
 */
const assert = require('node:assert/strict');
const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { ZONAS_MUSCULARES } = require('../packages/domain/dist/index.js');

const CARPETA = join(__dirname, '..', 'apps/web/public/zonas');
const ARCHIVO_DE_LA_VISTA = { ANTERIOR: 'front', POSTERIOR: 'back' };
/** Lo que pesa, como mucho, cada capa: las máscaras rondan los 6 KB y el cuerpo de frente, 65 KB. */
const KB_MAXIMOS = { mascara: 16, cuerpo: 100 };

test('hay un cuerpo por vista y una máscara por zona y vista declarada, y nada más', () => {
  const esperados = ['be-body-m-front.webp', 'be-body-m-back.webp'];
  for (const zona of ZONAS_MUSCULARES) for (const vista of zona.anatomicalViews) esperados.push(`be-mask-m-${ARCHIVO_DE_LA_VISTA[vista]}-${zona.zoneId}.png`);
  assert.deepEqual(readdirSync(CARPETA).sort(), esperados.sort());
});

test('cada capa es liviana y del formato que la figura pide, en la misma grilla (320 × 944)', () => {
  for (const nombre of readdirSync(CARPETA)) {
    const bytes = readFileSync(join(CARPETA, nombre));
    const cuerpo = nombre.startsWith('be-body-');
    assert.ok(statSync(join(CARPETA, nombre)).size <= (cuerpo ? KB_MAXIMOS.cuerpo : KB_MAXIMOS.mascara) * 1024, `${nombre} pesa de más`);
    if (cuerpo) {
      assert.equal(bytes.subarray(0, 4).toString('latin1'), 'RIFF', `${nombre} es WebP`);
      assert.equal(bytes.subarray(8, 12).toString('latin1'), 'WEBP', `${nombre} es WebP`);
    } else {
      assert.equal(bytes.subarray(1, 4).toString('latin1'), 'PNG', `${nombre} es PNG`);
      // IHDR: ancho y alto en los bytes 16 a 23.
      assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [320, 944], `${nombre} está en la grilla de la figura`);
    }
  }
});
