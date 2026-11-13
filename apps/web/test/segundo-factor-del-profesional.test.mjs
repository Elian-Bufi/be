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

test('desde el mismo teléfono: la clave a la vista, con un botón para copiarla y el enlace que abre la aplicación de códigos', () => {
  // Lo que se copia es lo que se ve, en un bloque: sin espacios de los grupos ni el relleno de base32.
  assert.equal(S.claveParaCopiar('JBSWY3DPEHPK3PXP===='), 'JBSWY3DPEHPK3PXP');
  assert.equal(S.restoDelEnlaceOtpauth('otpauth://totp/BE:persona?secret=JBSW&issuer=BE'), 'totp/BE:persona?secret=JBSW&issuer=BE');
  assert.equal(S.restoDelEnlaceOtpauth('https://otro.sitio/'), '', 'solo un enlace de la aplicación de códigos');
  const pantalla = leer('src/components/segundo-factor-del-profesional.tsx');
  const configuracion = pantalla.slice(pantalla.indexOf('export function PasoDeConfiguracion('));
  // Ya no queda escondida en un desplegable: va al lado del QR.
  assert.doesNotMatch(configuracion, /<details className="ayuda">\s*<summary>\{C\.configuracion\.clave\}/);
  assert.match(configuracion, /<div className="clave-a-la-vista">[\s\S]*?<code>\{claveEnGrupos\(datos\.secret\)\}<\/code>/);
  assert.match(configuracion, /onClick=\{\(\) => void copiarLaClave\(datos\.secret\)\}>\s*\{C\.configuracion\.copiarLaClave\}/);
  assert.match(configuracion, /await navigator\.clipboard\.writeText\(claveParaCopiar\(secreto\)\);/);
  assert.match(configuracion, /href=\{`otpauth:\/\/\$\{restoDelEnlaceOtpauth\(datos\.otpauthUri\)\}`\}>\s*\{C\.configuracion\.abrirEnLaAplicacion\}/);
  assert.match(configuracion, /role="status" aria-live="polite"/, 'el resultado de copiar se anuncia');
  for (const clave of ['copiarLaClave', 'claveCopiada', 'noSePudoCopiar', 'abrirEnLaAplicacion', 'desdeElTelefono']) assert.ok(C.configuracion[clave]?.trim(), clave);
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

test('la clave copiada no se queda en el portapapeles: se vacía al confirmar, al pedir otra, al salir o al minuto', async () => {
  const escrito = [];
  const programados = new Map();
  let siguiente = 0;
  const crear = () =>
    S.borradoDelPortapapeles(
      async (texto) => void escrito.push(texto),
      (alVencer, ms) => {
        assert.equal(ms, S.TOPE_DE_LA_CLAVE_COPIADA_MS);
        programados.set(++siguiente, alVencer);
        return siguiente;
      },
      (id) => programados.delete(id),
    );
  // Sin copia pendiente, vaciar no hace nada: no se borra lo que la persona copió de otro lado.
  const p = crear();
  p.vaciar();
  assert.deepEqual(escrito, []);
  // Copiada y confirmada: se vacía una vez, y el minuto ya no corre.
  p.alCopiar();
  assert.equal(programados.size, 1);
  p.vaciar();
  p.vaciar();
  assert.deepEqual(escrito, ['']);
  assert.equal(programados.size, 0);
  // Copiada y sin confirmar: al minuto se vacía. Copiar de nuevo reinicia el plazo, sin dos relojes.
  p.alCopiar();
  p.alCopiar();
  assert.equal(programados.size, 1);
  [...programados.values()][0]();
  assert.deepEqual(escrito, ['', '']);
  // Si el navegador no deja escribir, no rompe nada.
  const q = S.borradoDelPortapapeles(() => Promise.reject(new Error('sin permiso')), () => 1, () => {});
  q.alCopiar();
  q.vaciar();
  await new Promise((r) => setImmediate(r));
  assert.equal(S.TOPE_DE_LA_CLAVE_COPIADA_MS, 60_000);

  // La pantalla: al confirmar se vacía antes de esperar a la API; una clave nueva vacía y borra «Clave copiada.».
  const pantalla = leer('src/components/segundo-factor-del-profesional.tsx');
  const configuracion = pantalla.slice(pantalla.indexOf('export function PasoDeConfiguracion('));
  assert.match(configuracion, /async function confirmar\(e: FormEvent\) \{\s*e\.preventDefault\(\);\s*if \(enviando\) return;\s*(?:\/\/[^\n]*\n\s*)*portapapeles\.current\?\.vaciar\(\);/);
  const confirmar = configuracion.slice(configuracion.indexOf('async function confirmar('));
  assert.ok(confirmar.indexOf('portapapeles.current?.vaciar()') < confirmar.indexOf('await '), 'se vacía antes del await');
  assert.match(configuracion, /async function empezar\(\) \{[\s\S]*?portapapeles\.current\?\.vaciar\(\);\s*setCopiada\(null\);[\s\S]*?await api\.iniciarConfiguracionDeLaSesion/);
  assert.match(configuracion, /await navigator\.clipboard\.writeText\(claveParaCopiar\(secreto\)\);\s*portapapeles\.current\?\.alCopiar\(\);/);
  assert.match(configuracion, /return \(\) => alSalir\?\.vaciar\(\);/, 'al salir del paso');
  assert.match(C.configuracion.claveCopiada, /vaciar el portapapeles/);
});

test('«Abrir en la aplicación de códigos» es el camino principal en el teléfono y no aparece en la computadora', () => {
  const pantalla = leer('src/components/segundo-factor-del-profesional.tsx');
  const acciones = pantalla.slice(pantalla.indexOf('<div className="clave-a-la-vista">'));
  // Primero abrir; copiar, como alternativa.
  assert.ok(acciones.indexOf('mfa-abrir-en-la-aplicacion') < acciones.indexOf('copiarLaClave(datos.secret)'));
  assert.match(acciones, /className="boton boton--enlace" onClick=\{\(\) => void copiarLaClave\(datos\.secret\)\}/);
  assert.match(acciones, /<p className="nota mfa-desde-el-telefono">\{C\.configuracion\.desdeElTelefono\}<\/p>/);
  const css = readFileSync(join(WEB, 'src/app/globals.css'), 'utf8');
  assert.match(css, /@media not all and \(pointer: coarse\) \{\s*\.mfa-abrir-en-la-aplicacion,\s*\.mfa-desde-el-telefono \{\s*display: none;\s*\}\s*\}/);
});
