/**
 * WP-USO-FINAL en el website (DL-169) · UF-11, el segundo factor del profesional (TEST-UF-014, la mitad del website). Sin
 * React:
 *  1. la compuerta: qué se muestra según API-MFA-01 (`pasoDelSegundoFactor`); solo VERIFIED y NOT_REQUIRED dejan pasar, y
 *     sin respuesta o con una que no se reconoce no se pasa;
 *  2. qué se hace con lo que responde un código (`alEnviarUnCodigo`);
 *  3. la estructura: `/pro` pone el segundo factor adentro de «Antes de seguir»; `/account` no lo pide.
 * La garantía está en la API (test/integration/segundo-factor-del-profesional.int-spec.ts): esto solo dice qué falta.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const S = await import('../src/lib/segundo-factor-del-profesional.ts');
const { COPY, COPY_SEGUNDO_FACTOR_DEL_PROFESIONAL: C } = await import('@be/domain');

const WEB = fileURLToPath(new URL('..', import.meta.url));
const leer = (ruta) => readFileSync(join(WEB, ruta), 'utf8');

const estado = (secondFactor) => ({ ok: true, datos: { data: { secondFactor, recoveryCodesRemaining: null, recentSignInUntil: null } } });
const falla = (status, codigo, extra = {}) => ({ ok: false, tipo: 'API', status, codigo, issues: [], ...extra });

test('TEST-UF-014 · la compuerta deja pasar solo con el segundo factor verificado o sin perfil profesional', () => {
  assert.deepEqual(S.pasoDelSegundoFactor(estado({ state: 'VERIFIED', method: 'TOTP' })), { tipo: 'seguir' });
  assert.deepEqual(S.pasoDelSegundoFactor(estado({ state: 'NOT_REQUIRED' })), { tipo: 'seguir' });
  assert.deepEqual(S.pasoDelSegundoFactor(estado({ state: 'REQUIRED' })), { tipo: 'codigo' });
  assert.deepEqual(S.pasoDelSegundoFactor(estado({ state: 'ENROLLMENT_REQUIRED', deadline: '2026-11-12T12:10:00.000Z' })), { tipo: 'configurar', plazo: '2026-11-12T12:10:00.000Z' });
  assert.deepEqual(S.pasoDelSegundoFactor(estado({ state: 'RECENT_SIGN_IN_REQUIRED' })), { tipo: 'volver-a-entrar' });
});

test('TEST-UF-014 · sin respuesta, con un 5xx, un 429 o una respuesta que no se reconoce, no se deja pasar; sin sesión, a Iniciar sesión', () => {
  for (const r of [{ ok: false, tipo: 'RED' }, falla(503, 'DB_UNAVAILABLE'), falla(429, 'RATE_LIMITED'), falla(404, 'RESOURCE_NOT_FOUND'), falla(200, 'RESPUESTA_NO_RECONOCIDA')]) {
    assert.deepEqual(S.pasoDelSegundoFactor(r), { tipo: 'sin-respuesta' }, JSON.stringify(r));
  }
  assert.deepEqual(S.pasoDelSegundoFactor(estado({ state: 'MAYBE' })), { tipo: 'sin-respuesta' }, 'un estado que no se conoce no deja pasar');
  assert.deepEqual(S.pasoDelSegundoFactor(falla(401, 'SESSION_REVOKED')), { tipo: 'sesion' });
});

test('TEST-UF-014 · lo que responde un código: al campo con los intentos, bloqueado, releer, sesión o aviso', () => {
  assert.deepEqual(S.alEnviarUnCodigo({ ok: true, datos: {} }), { tipo: 'listo' });
  assert.deepEqual(S.alEnviarUnCodigo(falla(422, 'SECOND_FACTOR_INVALID', { intentosRestantes: 2 })), { tipo: 'campo', mensaje: C.codigo.invalido(2) });
  assert.match(C.codigo.invalido(2), /Te quedan 2 intentos/);
  assert.deepEqual(S.alEnviarUnCodigo(falla(422, 'SECOND_FACTOR_LOCKED')), { tipo: 'bloqueado' });
  assert.deepEqual(S.alEnviarUnCodigo(falla(422, 'INVALID_STATE_TRANSITION')), { tipo: 'releer', aviso: null });
  assert.deepEqual(S.alEnviarUnCodigo({ ok: false, tipo: 'RED' }), { tipo: 'releer', aviso: COPY.resultadoIncierto }, 'sin respuesta, el código pudo haberse aceptado: se vuelve a preguntar');
  assert.deepEqual(S.alEnviarUnCodigo(falla(401, 'SESSION_REVOKED')), { tipo: 'sesion' }, 'cinco códigos que no valen revocan la sesión');
  assert.deepEqual(S.alEnviarUnCodigo(falla(429, 'RATE_LIMITED')), { tipo: 'aviso', mensaje: C.codigo.demasiadosIntentos });
  assert.equal(S.claveEnGrupos('JBSWY3DPEHPK3PXP===='), 'JBSW Y3DP EHPK 3PXP');
});

test('TEST-UF-014 · /pro pone el segundo factor adentro de «Antes de seguir»; /account no lo pide', () => {
  const pro = leer('src/app/pro/layout.tsx');
  const adentro = pro.indexOf('<SegundoFactorDelProfesional>');
  assert.ok(adentro > pro.indexOf('<AntesDeSeguir espacio="pro">') && pro.indexOf('<AntesDeSeguir espacio="pro">') >= 0, 'el nombre primero, el segundo factor después');
  assert.ok(pro.indexOf('{children}', adentro) > adentro, 'la página va adentro del segundo factor');
  assert.doesNotMatch(leer('src/app/account/layout.tsx'), /SegundoFactorDelProfesional/);
  const compuerta = leer('src/components/segundo-factor-del-profesional.tsx');
  assert.match(compuerta, /case 'seguir':\s*return <>\{children\}<\/>;/, 'solo el paso «seguir» monta la página');
  assert.equal((compuerta.match(/<>\{children\}<\/>/g) ?? []).length, 2, 'la página se monta solo al seguir, o sin sesión (cada página manda a entrar)');
});
