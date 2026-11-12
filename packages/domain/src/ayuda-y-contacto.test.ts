/**
 * UF-07 de WP-USO-FINAL (DL-169): Ayuda y contacto, la parte del dominio de TEST-UF-017. La configuración de la API está
 * en apps/api/src/config/entorno.spec.ts; la respuesta real, en test/integration/ayuda-y-contacto.int-spec.ts; que
 * ninguna dirección quede escrita en el código, en scripts/sin-correos-en-el-codigo.test.cjs.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OPERACIONES } from './openapi';
import { CanalDeContactoResponseSchema, COPY_AYUDA, direccionDeContacto, enlaceDeCorreo } from './ayuda-y-contacto';

test('TEST-UF-017 · la respuesta: las dos direcciones o null, nada más', () => {
  assert.ok(CanalDeContactoResponseSchema.safeParse({ data: { supportEmail: 'soporte@example.invalid', privacyEmail: 'privacidad@example.invalid' } }).success);
  assert.ok(CanalDeContactoResponseSchema.safeParse({ data: { supportEmail: null, privacyEmail: null } }).success, 'sin configuración, null');
  assert.equal(CanalDeContactoResponseSchema.safeParse({ data: { supportEmail: 'no es un correo', privacyEmail: null } }).success, false);
  assert.equal(CanalDeContactoResponseSchema.safeParse({ data: { supportEmail: null, privacyEmail: null, phone: '1' } }).success, false, 'estricta');
});

test('TEST-UF-017 · la dirección de la configuración se normaliza o no vale', () => {
  assert.equal(direccionDeContacto('  Soporte@Example.Invalid '), 'soporte@example.invalid');
  for (const mala of ['', '   ', 'sin-arroba', 'a@b', 'dos @espacios.invalid', undefined, null]) assert.equal(direccionDeContacto(mala), null, String(mala));
  assert.equal(enlaceDeCorreo('soporte@example.invalid'), 'mailto:soporte@example.invalid');
  assert.equal(enlaceDeCorreo('soporte@example.invalid', 'Ayuda con BE'), 'mailto:soporte@example.invalid?subject=Ayuda%20con%20BE');
});

test('TEST-UF-017 · el contrato: API-SOP-01 es una lectura pública, sin sesión ni cuerpo', () => {
  const op = OPERACIONES.find((o) => o.id === 'API-SOP-01');
  assert.ok(op, 'está en el contrato');
  assert.deepEqual([op.metodo, op.ruta, op.autenticacion, op.exitos.map((e) => e.status)], ['get', '/support/contact', 'PUBLIC', [200]]);
  assert.equal(op.request, undefined);
});

test('TEST-UF-017 · los textos no escriben ninguna dirección: la pantalla muestra la que llega de la API', () => {
  const todo = JSON.stringify(COPY_AYUDA);
  assert.equal(/[^\s@"]+@[^\s@"]+\.[a-z]{2,}/i.test(todo), false);
  assert.match(COPY_AYUDA.sinCanal, /todavía no está publicado/);
});
