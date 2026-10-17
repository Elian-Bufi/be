/**
 * WP-INVITACION (DL-136): la APK reconoce el enlace de una invitación (apps/mobile/src/enlace-de-invitacion.ts) en sus
 * dos formas, el esquema propio y el App Link del website, y nada más.
 *
 * Uso: node --test scripts/enlace-de-invitacion.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { enlaceDeInvitacion } from '@be/domain';

const { invitacionDelEnlace } = await import('../apps/mobile/src/enlace-de-invitacion.ts');

const TOKEN = 'a'.repeat(21) + 'B-_' + 'c'.repeat(19);

test('el enlace del website (App Link) y el del esquema propio llevan a la misma invitación', () => {
  assert.equal(TOKEN.length, 43);
  const web = enlaceDeInvitacion('https://be-web.example', TOKEN);
  assert.equal(web, `https://be-web.example/invitacion#t=${TOKEN}`);
  assert.deepEqual(invitacionDelEnlace(web), { token: TOKEN });
  assert.deepEqual(invitacionDelEnlace(`https://be-web.example/invitacion/#t=${TOKEN}`), { token: TOKEN });
  assert.deepEqual(invitacionDelEnlace(`be://invitacion?t=${TOKEN}`), { token: TOKEN });
  assert.deepEqual(invitacionDelEnlace(`be://invitacion/?t=${encodeURIComponent(TOKEN)}`), { token: TOKEN });
});

test('lo que no es una invitación con un token bien formado no abre nada', () => {
  for (const url of [
    null,
    undefined,
    '',
    'https://be-web.example/invitacion',
    'https://be-web.example/invitacion#t=corto',
    `https://be-web.example/pro#t=${TOKEN}`,
    `https://be-web.example/invitacion/otra#t=${TOKEN}`,
    'be://invitacion',
    'be://invitacion?t=',
    `be://novedades?t=${TOKEN}`,
    `http://be-web.example/invitacion#t=${TOKEN}`,
  ]) {
    assert.equal(invitacionDelEnlace(url), null, String(url));
  }
});
