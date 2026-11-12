/**
 * TEST-UF-012 · UF-08 de WP-USO-FINAL (DL-169): los avisos de prueba salen del ambiente y no de un texto fijo. En `test`
 * aparecen (08 §33, solo datos sintéticos), en producción nunca, y en `test` se apagan con `BE_AVISOS_DE_PRUEBA=no`.
 *
 * La regla vive en `packages/domain/src/ambiente-de-prueba.ts` (`muestraLosAvisosDePrueba`) y la prueba su dominio. Esta
 * recorre el código del website y de la APK y exige que:
 * 1. ninguna pantalla escriba por su cuenta un aviso de prueba («Ambiente de prueba», «correo inventado», «cuenta de
 *    Google de prueba», «APK de prueba»): los textos son los de `AVISOS_DE_PRUEBA` del dominio;
 * 2. todo archivo que muestra uno de esos textos (`AVISOS_DE_PRUEBA.` o `avisoDePrueba`) lo haga pasando por la regla
 *    (`AVISOS_DE_PRUEBA_VISIBLES`);
 * 3. cada cliente calcule `AVISOS_DE_PRUEBA_VISIBLES` con la regla del dominio y con los valores de su build: el website
 *    con `BE_AMBIENTE` y `BE_AVISOS_DE_PRUEBA` (next.config.mjs); la APK con `APP_ENV` y `BE_AVISOS_DE_PRUEBA`
 *    (app.config.ts).
 *
 * Uso: node --test scripts/avisos-de-prueba.test.mjs
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

/** El código de las pantallas: `.ts` y `.tsx` del website y de la APK, sin las pruebas. */
function archivos(dir) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return nombre === 'node_modules' ? [] : archivos(ruta);
    return /\.(ts|tsx)$/.test(nombre) && !/\.test\.tsx?$/.test(nombre) ? [ruta] : [];
  });
}
const CODIGO = [...archivos(join(RAIZ, 'apps/web/src')), ...archivos(join(RAIZ, 'apps/mobile/src')), join(RAIZ, 'apps/mobile/App.tsx')];
const leer = (ruta) => readFileSync(ruta, 'utf8');
const nombre = (ruta) => relative(RAIZ, ruta).split('\\').join('/');

/** Las frases de los avisos de prueba, sin distinguir mayúsculas. */
const FRASES = [/ambiente de prueba/i, /correo inventado/i, /cuenta de google de prueba/i, /apk de prueba/i];

test('TEST-UF-012 · ninguna pantalla del website ni de la APK escribe un aviso de prueba por su cuenta', () => {
  const escritos = [];
  for (const ruta of CODIGO) {
    leer(ruta)
      .split('\n')
      .forEach((linea, i) => {
        for (const frase of FRASES) if (frase.test(linea)) escritos.push(`${nombre(ruta)}:${i + 1}: ${linea.trim().slice(0, 120)}`);
      });
  }
  assert.deepEqual(escritos, [], 'los textos de prueba son los de AVISOS_DE_PRUEBA (packages/domain/src/ambiente-de-prueba.ts)');
});

test('TEST-UF-012 · todo archivo que muestra un aviso de prueba pasa por la regla del ambiente', () => {
  const usan = CODIGO.filter((ruta) => /AVISOS_DE_PRUEBA\.|\bavisoDePrueba\b/.test(leer(ruta)));
  assert.ok(usan.length >= 6, `se esperaban los avisos del website y de la APK; están en: ${usan.map(nombre).join(', ')}`);
  const sinLaRegla = usan.filter((ruta) => !/\bAVISOS_DE_PRUEBA_VISIBLES\b/.test(leer(ruta))).map(nombre);
  assert.deepEqual(sinLaRegla, []);
});

test('TEST-UF-012 · cada cliente calcula la regla con el ambiente y el interruptor de su build', () => {
  const web = leer(join(RAIZ, 'apps/web/src/lib/ambiente.ts'));
  assert.match(web, /AVISOS_DE_PRUEBA_VISIBLES\s*=\s*muestraLosAvisosDePrueba\(\s*process\.env\.BE_AMBIENTE\s*,\s*process\.env\.BE_AVISOS_DE_PRUEBA\s*\)/);
  const next = leer(join(RAIZ, 'apps/web/next.config.mjs'));
  assert.match(next, /BE_AMBIENTE:/);
  assert.match(next, /BE_AVISOS_DE_PRUEBA:/);
  const apk = leer(join(RAIZ, 'apps/mobile/src/ambiente.ts'));
  assert.match(apk, /AVISOS_DE_PRUEBA_VISIBLES\s*=\s*muestraLosAvisosDePrueba\(/);
  assert.match(apk, /appEnv/);
  assert.match(apk, /avisosDePrueba/);
  const config = leer(join(RAIZ, 'apps/mobile/app.config.ts'));
  assert.match(config, /avisosDePrueba:\s*process\.env\.BE_AVISOS_DE_PRUEBA/);
});
