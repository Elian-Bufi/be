/**
 * WP-NOVEDADES-Y-AVISOS (DL-133): el ícono de los avisos de Android sale del isotipo (scripts/generar-icono-de-aviso.cjs).
 * Si cambia la marca y no se regenera, esta prueba lo dice. También comprueba lo que Android exige: 96 × 96, blanco y con
 * transparencia (si no, muestra un cuadrado).
 *
 * Uso: node --test scripts/icono-de-aviso.test.cjs
 */
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const zlib = require('node:zlib');

const RAIZ = join(__dirname, '..');

test('el ícono de los avisos está al día con el isotipo', () => {
  execFileSync(process.execPath, [join(__dirname, 'generar-icono-de-aviso.cjs'), '--verificar'], { stdio: 'pipe' });
});

test('es de 96 × 96, RGBA, todo blanco, con transparencia y con dibujo', () => {
  const b = readFileSync(join(RAIZ, 'apps/mobile/assets/icono-de-aviso.png'));
  assert.equal(b.readUInt32BE(16), 96);
  assert.equal(b.readUInt32BE(20), 96);
  assert.equal(b[25], 6, 'RGBA');
  const idat = [];
  for (let o = 8; o < b.length; ) {
    const n = b.readUInt32BE(o);
    if (b.toString('ascii', o + 4, o + 8) === 'IDAT') idat.push(b.subarray(o + 8, o + 8 + n));
    o += 12 + n;
  }
  const crudo = zlib.inflateSync(Buffer.concat(idat));
  let transparentes = 0;
  let opacos = 0;
  for (let y = 0; y < 96; y++) {
    for (let x = 0; x < 96; x++) {
      const p = y * (1 + 96 * 4) + 1 + x * 4;
      assert.deepEqual([crudo[p], crudo[p + 1], crudo[p + 2]], [255, 255, 255]);
      if (crudo[p + 3] === 0) transparentes++;
      if (crudo[p + 3] > 200) opacos++;
    }
  }
  assert.ok(transparentes > 96 * 96 * 0.3, 'tiene que tener fondo transparente');
  assert.ok(opacos > 96 * 96 * 0.05, 'tiene que tener dibujo');
});
