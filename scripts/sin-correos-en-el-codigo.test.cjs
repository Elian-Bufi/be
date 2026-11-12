/**
 * TEST-UF-017 (UF-07 de WP-USO-FINAL, DL-169) · ninguna dirección de correo real queda escrita en el código.
 *
 * Las direcciones de contacto de BE (soporte y privacidad) y el remitente de los correos salen de la configuración de la
 * API (`BE_CONTACTO_*`, `BE_CORREO_REMITENTE`): el repositorio es público y una dirección escrita en una pantalla obligaría
 * a reconstruir la APK para cambiarla. Esta guardia recorre el código que se publica (el dominio, la API, el website y la
 * APK, sin las pruebas) y exige que toda dirección sea de un dominio reservado para ejemplos (RFC 2606 y RFC 6761):
 * `.invalid`, `.example`, `.test`, `.localhost` o `example.com`, `.net` y `.org`.
 *
 * Uso: node --test scripts/sin-correos-en-el-codigo.test.cjs
 */
const assert = require('node:assert/strict');
const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');
const test = require('node:test');

const RAIZ = join(__dirname, '..');
const CARPETAS = ['packages/domain/src', 'apps/api/src', 'apps/web/src', 'apps/mobile/src'];
const SUELTOS = ['apps/mobile/App.tsx', 'apps/mobile/app.config.ts'];
const EXTENSIONES = /\.(ts|tsx|js|mjs|cjs|json)$/;
const PRUEBAS = /\.(spec|test)\.(ts|tsx|js|mjs|cjs)$/;

/** Una dirección: algo, arroba y un dominio con al menos un punto y un final de letras. */
const DIRECCION = /[A-Za-z0-9._%+-]+@((?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,})/g;
const RESERVADO = /(^|\.)(invalid|example|test|localhost)$|(^|\.)example\.(com|net|org)$/i;

function archivos(dir) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return nombre === 'node_modules' ? [] : archivos(ruta);
    return EXTENSIONES.test(nombre) && !PRUEBAS.test(nombre) ? [ruta] : [];
  });
}

/** Las direcciones que no son de un dominio reservado, con su archivo. */
function direccionesReales(texto) {
  return [...texto.matchAll(DIRECCION)].filter((m) => !RESERVADO.test(m[1])).map((m) => m[0]);
}

test('TEST-UF-017 · la guardia reconoce una dirección real y deja pasar las sintéticas', () => {
  assert.deepEqual(direccionesReales("const a = 'soporte@be-salud.com.ar';"), ['soporte@be-salud.com.ar']);
  assert.deepEqual(direccionesReales("'persona@example.invalid' · 'a@be.example' · 'x@example.com' · 'y@algo.test'"), []);
  assert.deepEqual(direccionesReales("import { z } from '@be/domain';"), []);
});

test('TEST-UF-017 · ninguna dirección de correo real en el código del dominio, la API, el website y la APK', () => {
  const encontradas = [];
  for (const carpeta of CARPETAS) {
    for (const ruta of archivos(join(RAIZ, carpeta))) {
      for (const d of direccionesReales(readFileSync(ruta, 'utf8'))) encontradas.push(`${relative(RAIZ, ruta)}: ${d}`);
    }
  }
  for (const suelto of SUELTOS) {
    for (const d of direccionesReales(readFileSync(join(RAIZ, suelto), 'utf8'))) encontradas.push(`${suelto}: ${d}`);
  }
  assert.deepEqual(encontradas, [], `direcciones escritas en el código (van por configuración):\n${encontradas.join('\n')}`);
});
