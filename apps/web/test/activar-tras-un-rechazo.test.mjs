/**
 * ED-62 · Activar después de un 409 o un 422 (WP-EDITORES-PROFESIONAL; TEST-EDP-049).
 *
 * Un 409, un 422 sin problemas con lugar o una activación sin respuesta releen la versión antes de decir nada: «Ya quedó
 * activa» si quedó activada, el conflicto si otra pestaña cambió el borrador, lo que impide activar con su lugar si fue
 * la validación. Cada código tiene su texto, nunca un «Probá de nuevo» genérico; con el resultado incierto, la clave se
 * conserva y el intento siguiente la reusa.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const R = await import('../src/app/pro/advisees/resultado-de-activar.ts');
const { ClaveDeIntento } = await import('../src/lib/clave-de-intento.ts');

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const api = (status, codigo, issues = []) => ({ ok: false, tipo: 'API', status, codigo, issues });
const RED = { ok: false, tipo: 'RED' };
const borrador = (version) => ({ estado: 'DRAFT', version });
const activada = { estado: 'ACTIVATED', version: '8' };

test('TEST-EDP-049 · qué respuestas se releen antes de decir nada', () => {
  assert.equal(R.hayQueReleer({ ok: true, datos: {} }), false);
  assert.equal(R.hayQueReleer(RED), true);
  assert.equal(R.hayQueReleer(api(200, 'RESPUESTA_NO_RECONOCIDA')), true);
  assert.equal(R.hayQueReleer(api(409, 'VERSION_CONFLICT')), true);
  assert.equal(R.hayQueReleer(api(409, 'ACTIVE_PLAN_CONFLICT')), true);
  assert.equal(R.hayQueReleer(api(422, 'INVALID_STATE_TRANSITION')), true);
  // Un 422 de la validación trae sus problemas, con su lugar: no hace falta releer.
  assert.equal(R.hayQueReleer(api(422, 'TRAINING_PLAN_STRUCTURE_INVALID', [{ code: 'PRESCRIPTION_REQUIRED', path: 'blocks[0].sessions[2]' }])), false);
});

test('TEST-EDP-049 · la versión releída manda: si quedó activada, «Ya quedó activa»', () => {
  for (const r of [RED, api(409, 'VERSION_CONFLICT'), api(422, 'INVALID_STATE_TRANSITION'), api(422, 'PLAN_NOT_EDITABLE')]) {
    assert.deepEqual(R.loQuePasoAlActivar(r, activada, '7'), { tipo: 'YA_QUEDO_ACTIVA' }, JSON.stringify(r));
  }
  // Ya no está (se descartó en otra pestaña).
  assert.deepEqual(R.loQuePasoAlActivar(api(409, 'VERSION_CONFLICT'), { estado: 'NO_ESTA' }, '7'), { tipo: 'YA_NO_ESTA' });
  // Otra pestaña cambió el borrador: el conflicto.
  assert.deepEqual(R.loQuePasoAlActivar(api(409, 'VERSION_CONFLICT'), borrador('9'), '7'), { tipo: 'CAMBIO_EN_OTRA_PESTANA' });
  // Sin respuesta: si el borrador sigue igual, no se sabe (se reintenta con la misma clave); si cambió, el conflicto.
  assert.deepEqual(R.loQuePasoAlActivar(RED, borrador('7'), '7'), { tipo: 'INCIERTO' });
  assert.deepEqual(R.loQuePasoAlActivar(RED, null, '7'), { tipo: 'INCIERTO' });
  assert.deepEqual(R.loQuePasoAlActivar(RED, borrador('9'), '7'), { tipo: 'CAMBIO_EN_OTRA_PESTANA' });
  // Un 422 de la validación: lo que impide, con su lugar.
  const problemas = [{ code: 'PRESCRIPTION_REQUIRED', path: 'blocks[0].sessions[2]' }];
  assert.deepEqual(R.loQuePasoAlActivar(api(422, 'TRAINING_PLAN_STRUCTURE_INVALID', problemas), null, '7'), { tipo: 'IMPIDE', problemas });
  // Cada rechazo con su nombre.
  assert.equal(R.loQuePasoAlActivar(api(409, 'ACTIVE_PLAN_CONFLICT'), borrador('7'), '7').tipo, 'OTRO_PLAN_VIGENTE');
  assert.equal(R.loQuePasoAlActivar(api(422, 'CAPACITY_NOT_AVAILABLE'), borrador('7'), '7').tipo, 'SIN_CAPACIDAD');
  assert.equal(R.loQuePasoAlActivar(api(409, 'CLIENT_CAPABILITY_REQUIRED'), borrador('7'), '7').tipo, 'SU_APP');
  assert.equal(R.loQuePasoAlActivar({ ok: true, datos: {} }, null, '7').tipo, 'ACTIVADA');
});

test('TEST-EDP-049 · cada resultado tiene su texto, y ninguno es un «Probá de nuevo» genérico', () => {
  const T = R.COPY_RESULTADO_DE_ACTIVAR;
  assert.equal(T.yaQuedoActiva(9), 'Ya quedó activa. La versión 9 es la vigente, y la persona ya la ve.');
  const textos = [T.yaQuedoActiva(9), T.yaNoEsta, T.impide, T.cambioEnOtraPestana, T.otroPlanVigente('entrenamiento'), T.sinCapacidad, T.incierto, T.otro];
  assert.equal(new Set(textos).size, textos.length, 'un texto por resultado');
  for (const t of textos) assert.doesNotMatch(t, /Probá de nuevo|asesorad|VERSION_CONFLICT|409|422/, t);
  // Los editores ya no tienen el genérico.
  for (const ruta of ['app/pro/advisees/training/editor.tsx', 'app/pro/advisees/nutrition/editor.tsx']) assert.doesNotMatch(leer(ruta), /Probá de nuevo/, ruta);
});

test('TEST-EDP-049 · con el resultado incierto, la clave se conserva y el intento siguiente la reusa', () => {
  let n = 0;
  const c = new ClaveDeIntento(() => `clave-${++n}`);
  const primera = c.actual('plan-1:7');
  c.registrar(true); // sin respuesta
  assert.equal(c.quedoIncierto(), true);
  assert.equal(c.actual('plan-1:7'), primera, 'el mismo pedido reusa la clave');
  // Una respuesta definitiva la libera: el próximo intento es otro.
  c.registrar(false);
  assert.notEqual(c.actual('plan-1:7'), primera);
  // Otro pedido (la versión cambió) es otro intento: otra clave, aunque el anterior haya quedado incierto (reusarla
  // con otro cuerpo daría 409 IDEMPOTENCY_KEY_REUSED).
  const otra = c.actual('plan-1:8');
  c.registrar(true);
  assert.notEqual(c.actual('plan-1:9'), otra);
  // Sin decir qué se manda, como antes.
  const sola = new ClaveDeIntento(() => `k-${++n}`);
  const k = sola.actual();
  sola.registrar(true);
  assert.equal(sola.actual(), k);
});

test('TEST-EDP-049 · los editores: la clave del pedido, la relectura y «Volver» que conserva la clave incierta', () => {
  for (const [ruta, releer] of [
    ['app/pro/advisees/training/editor.tsx', 'planConObjetivos'],
    ['app/pro/advisees/nutrition/editor.tsx', 'consultarPlan'],
  ]) {
    const fuente = leer(ruta);
    assert.match(fuente, /intentoDeActivar\.actual\(`\$\{planId\}:\$\{v\.version\}`\)\);\n\s*intentoDeActivar\.registrar\(r\);/, ruta);
    assert.match(fuente, new RegExp(`if \\(hayQueReleer\\(r\\)\\) \\{\\n\\s*const actual = await api\\.${releer}\\(token, planId\\);`), ruta);
    assert.match(fuente, /const que = loQuePasoAlActivar\(r, releida, v\.version\);/, ruta);
    // Un 422 de la validación queda en el mismo cuadro, con su lugar.
    assert.match(fuente, /case 'IMPIDE':\n[^\n]*\n\s*setRevision\(\{ estado: 'lista', problemas: que\.problemas \}\);/, ruta);
    // «Volver» no tira la clave de un intento incierto.
    assert.match(fuente, /if \(!intentoDeActivar\.quedoIncierto\(\)\) intentoDeActivar\.descartar\(\);/, ruta);
    assert.doesNotMatch(fuente, /\n\s*intentoDeActivar\.descartar\(\);\n/, ruta);
  }
});
