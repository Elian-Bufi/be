/**
 * La sesión guardada en el teléfono (DL-012, decisión de Dirección del 2026-10-03): `apps/mobile/src/sesion-persistente.ts`.
 *
 * Son los ocho casos de la tanda de cierre de la candidata 0.13.2, con un almacén falso y respuestas de la API
 * controladas, sin esperas. Las operaciones diferidas fijan el orden en que terminan:
 *  1. una sesión válida se recupera después de reiniciar el proceso, y solo después de que la API la verifica;
 *  2. una credencial vencida se borra, y el aviso dice que venció y cuánto duraba;
 *  3. una revocada o inválida se borra, con su aviso;
 *  4. sin red, con 429 o con 503 no se borra, y se puede reintentar;
 *  5. después de cerrar la sesión, reabrir no encuentra nada;
 *  6. un cambio de cuenta deja guardada solo la nueva;
 *  7. una escritura o una verificación que termina después del cierre no restaura nada;
 *  8. si el almacén falla, la app no se bloquea y no dice que recordará la sesión.
 *
 * **Lo que esto no prueba:** que Android conserve el valor cifrado al cerrar el proceso. Eso es del almacenamiento
 * nativo (`expo-secure-store`), y se comprueba en el teléfono con la APK nueva.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const p = await import('../apps/mobile/src/sesion-persistente.ts');
const memoria = await import('../apps/mobile/src/sesion-en-memoria.ts');

const HORA = 3_600_000;
const A = { token: 'token-a', identidadId: 'identidad-a', expiresAt: '2026-10-03T22:00:00.000Z', vigenciaMs: 12 * HORA };
const B = { token: 'token-b', identidadId: 'identidad-b', expiresAt: '2026-10-04T01:00:00.000Z', vigenciaMs: 12 * HORA };

/** La respuesta de API-ACC-05 (`/me`) que importa acá: la identidad y la vigencia de la sesión. */
const aceptada = (identityId, expiresAt, fechaDelServidor) => ({ ok: true, datos: { data: { identityId, session: { id: 'sesion', expiresAt } } }, fechaDelServidor });
const rechazo = (status, codigo) => ({ ok: false, tipo: 'API', status, codigo, issues: [] });
const SIN_RED = { ok: false, tipo: 'RED' };

function diferido() {
  let resolver;
  let rechazar;
  const promesa = new Promise((r, j) => {
    resolver = r;
    rechazar = j;
  });
  return { promesa, resolver, rechazar };
}

/** Un almacén en memoria. Con `demorar`, cada escritura espera a que la prueba la termine (`terminarEscritura`). */
function almacenFalso({ demorar = false } = {}) {
  const datos = new Map();
  const pendientes = [];
  const a = {
    datos,
    falla: { leer: false, guardar: false, borrar: false },
    async leer(clave) {
      if (a.falla.leer) throw new Error('falla de lectura');
      return datos.get(clave) ?? null;
    },
    guardar(clave, valor) {
      if (a.falla.guardar) return Promise.reject(new Error('falla de escritura'));
      if (!demorar) {
        datos.set(clave, valor);
        return Promise.resolve();
      }
      const d = diferido();
      pendientes.push({ hacer: () => datos.set(clave, valor), d });
      return d.promesa;
    },
    async borrar(clave) {
      if (a.falla.borrar) throw new Error('falla de borrado');
      datos.delete(clave);
    },
    terminarEscritura() {
      const x = pendientes.shift();
      x.hacer();
      x.d.resolver();
    },
  };
  return a;
}

const vaciar = () => new Promise((r) => setImmediate(r));
const ahora = (reloj) => () => ({ monotono: 50_000, reloj });

/** Un proceso nuevo: la memoria del módulo vacía y una fila nueva sobre el mismo almacén. */
function procesoNuevo(almacen, opciones) {
  memoria.olvidarSesion();
  return p.crearGuardaDeSesion(almacen, opciones);
}

// ─── 1. Recuperar una sesión válida después de reiniciar el proceso ──────────────────────────────────────────────

test('1 · después de reiniciar el proceso, la sesión guardada se recupera solo cuando la API la acepta', async () => {
  const almacen = almacenFalso();
  assert.equal(await p.crearGuardaDeSesion(almacen).guardar(A), true);
  const guarda = procesoNuevo(almacen);
  assert.equal(memoria.sesionAlMontar(1, Date.now()).estado, 'ninguna', 'el proceso nuevo no tiene la sesión en memoria');

  // La verificación tarda: hasta que la API responde no hay sesión que mostrar.
  const respuesta = diferido();
  const verificados = [];
  let terminada = false;
  const recuperacion = p
    .recuperarSesion({ guarda, verificar: (token) => (verificados.push(token), respuesta.promesa), ahora: ahora(Date.parse('2026-10-03T15:00:00Z')), sigueVigente: () => true })
    .then((r) => ((terminada = true), r));
  await vaciar();
  assert.equal(terminada, false, 'sin la respuesta de la API no se recupera nada');
  assert.deepEqual(verificados, ['token-a']);

  // A las 15:00 del servidor le quedan 7 de sus 12 horas.
  respuesta.resolver(aceptada('identidad-a', A.expiresAt, 'Sat, 03 Oct 2026 15:00:00 GMT'));
  const r = await recuperacion;
  assert.equal(r.tipo, 'recuperada');
  assert.equal(r.sesion.token, 'token-a');
  assert.equal(memoria.restanteMs(r.sesion, 50_000, Date.parse('2026-10-03T15:00:00Z')), 7 * HORA);
  assert.equal(memoria.avisoDeVencimiento(r.sesion), 'Tu sesión venció: duraba 12 horas. Iniciá sesión para continuar.');
  assert.equal(guarda.recordada('token-a'), true);
  assert.ok(almacen.datos.has(p.CLAVE_DE_LA_SESION), 'sigue guardada');
});

// ─── 2. Credencial vencida ───────────────────────────────────────────────────────────────────────────────────────

test('2 · si la API dice que venció, se borra y el aviso dice que venció y cuánto duraba', async () => {
  const almacen = almacenFalso();
  await p.crearGuardaDeSesion(almacen).guardar(A);
  const r = await p.recuperarSesion({ guarda: procesoNuevo(almacen), verificar: async () => rechazo(401, 'SESSION_EXPIRED'), ahora: ahora(Date.now()), sigueVigente: () => true });
  assert.deepEqual(r, { tipo: 'vencida', vigenciaMs: 12 * HORA });
  assert.equal(memoria.avisoDeVencimiento(r), 'Tu sesión venció: duraba 12 horas. Iniciá sesión para continuar.');
  await vaciar();
  assert.equal(almacen.datos.size, 0);
});

// ─── 3. Revocada o inválida ──────────────────────────────────────────────────────────────────────────────────────

test('3 · si la API la rechaza (revocada, inválida, sin autenticar) o la identidad no coincide, se borra', async () => {
  const respuestas = [rechazo(401, 'SESSION_REVOKED'), rechazo(401, 'SESSION_INVALID'), rechazo(401, 'AUTHENTICATION_REQUIRED'), aceptada('otra-identidad', A.expiresAt, 'Sat, 03 Oct 2026 15:00:00 GMT')];
  for (const respuesta of respuestas) {
    const almacen = almacenFalso();
    await p.crearGuardaDeSesion(almacen).guardar(A);
    const r = await p.recuperarSesion({ guarda: procesoNuevo(almacen), verificar: async () => respuesta, ahora: ahora(Date.now()), sigueVigente: () => true });
    assert.deepEqual(r, { tipo: 'no-valida', aviso: 'La sesión ya no es válida. Iniciá sesión para continuar.' }, JSON.stringify(respuesta));
    await vaciar();
    assert.equal(almacen.datos.size, 0);
  }
});

// ─── 4. Sin red al recuperar ─────────────────────────────────────────────────────────────────────────────────────

test('4 · sin red, con 429, 503 o un 403, la credencial no se borra; reintentar con la API de vuelta la recupera', async () => {
  for (const [respuesta, sinConexion] of [
    [SIN_RED, true],
    [rechazo(429, 'RATE_LIMITED'), false],
    [rechazo(503, 'SERVICE_UNAVAILABLE'), false],
    [rechazo(403, 'ACTION_FORBIDDEN'), false],
  ]) {
    const almacen = almacenFalso();
    await p.crearGuardaDeSesion(almacen).guardar(A);
    const guarda = procesoNuevo(almacen);
    const r = await p.recuperarSesion({ guarda, verificar: async () => respuesta, ahora: ahora(Date.now()), sigueVigente: () => true });
    assert.equal(r.tipo, 'sin-verificar', JSON.stringify(respuesta));
    assert.equal(r.sinConexion, sinConexion);
    assert.ok(almacen.datos.has(p.CLAVE_DE_LA_SESION), 'no se borra por una falla que no es de sesión');
    // Reintentar con la misma credencial, sin volver a leer.
    const otra = await p.recuperarSesion({ guarda, credencial: r.credencial, verificar: async () => aceptada('identidad-a', A.expiresAt, 'Sat, 03 Oct 2026 15:00:00 GMT'), ahora: ahora(Date.now()), sigueVigente: () => true });
    assert.equal(otra.tipo, 'recuperada');
  }
});

test('4 · si la API no responde a tiempo, cuenta como sin conexión: la credencial queda y se puede reintentar', async () => {
  const almacen = almacenFalso();
  await p.crearGuardaDeSesion(almacen).guardar(A);
  const r = await p.recuperarSesion({ guarda: procesoNuevo(almacen), verificar: () => new Promise(() => {}), ahora: ahora(Date.now()), sigueVigente: () => true, esperaMaximaDeVerificacionMs: 20 });
  assert.equal(r.tipo, 'sin-verificar');
  assert.equal(r.sinConexion, true);
  assert.ok(almacen.datos.has(p.CLAVE_DE_LA_SESION));
});

test('8 · un borrado que el almacén no termina no frena la decisión: la app va a Iniciar sesión igual', async () => {
  const almacen = almacenFalso();
  await p.crearGuardaDeSesion(almacen).guardar(A);
  almacen.borrar = () => new Promise(() => {});
  const r = await p.recuperarSesion({ guarda: procesoNuevo(almacen), verificar: async () => rechazo(401, 'SESSION_EXPIRED'), ahora: ahora(Date.now()), sigueVigente: () => true });
  assert.equal(r.tipo, 'vencida');
});

// ─── 5. Cerrar la sesión y volver a abrir ────────────────────────────────────────────────────────────────────────

test('5 · después de cerrar la sesión, reabrir la app no encuentra nada que recuperar', async () => {
  const almacen = almacenFalso();
  const guarda = p.crearGuardaDeSesion(almacen);
  await guarda.guardar(A);
  assert.equal(await guarda.borrar(), true);
  let verifico = false;
  const r = await p.recuperarSesion({ guarda: procesoNuevo(almacen), verificar: async () => ((verifico = true), SIN_RED), ahora: ahora(Date.now()), sigueVigente: () => true });
  assert.deepEqual(r, { tipo: 'ninguna' });
  assert.equal(verifico, false, 'sin credencial no se le pregunta nada a la API');
});

// ─── 6. Cambio de cuenta ─────────────────────────────────────────────────────────────────────────────────────────

test('6 · un cambio de cuenta deja guardada solo la nueva, y se verifica la nueva', async () => {
  const almacen = almacenFalso();
  const guarda = p.crearGuardaDeSesion(almacen);
  await guarda.guardar(A);
  await guarda.borrar();
  await guarda.guardar(B);
  assert.equal(guarda.recordada('token-a'), null);
  assert.equal(guarda.recordada('token-b'), true);
  const verificados = [];
  const r = await p.recuperarSesion({
    guarda: procesoNuevo(almacen),
    verificar: async (token) => (verificados.push(token), aceptada('identidad-b', B.expiresAt, 'Sat, 03 Oct 2026 15:00:00 GMT')),
    ahora: ahora(Date.now()),
    sigueVigente: () => true,
  });
  assert.deepEqual(verificados, ['token-b']);
  assert.equal(r.sesion.identidadId, 'identidad-b');
});

// ─── 7. Lo que termina después del cierre no restaura nada ───────────────────────────────────────────────────────

test('7 · una escritura que termina después de cerrar la sesión no deja el token guardado', async () => {
  const almacen = almacenFalso({ demorar: true });
  const guarda = p.crearGuardaDeSesion(almacen);
  const escritura = guarda.guardar(A);
  await vaciar();
  const borrado = guarda.borrar(); // la persona cierra la sesión con la escritura en curso
  almacen.terminarEscritura(); // la escritura termina tarde
  assert.equal(await escritura, false, 'no se informa como guardada');
  assert.equal(await borrado, true);
  assert.equal(almacen.datos.size, 0, 'el estado final es el del último pedido: nada guardado');
  assert.equal(guarda.recordada('token-a'), null);
});

test('7 · con dos cuentas seguidas, una escritura vieja que todavía no empezó no pisa a la nueva', async () => {
  const almacen = almacenFalso({ demorar: true });
  const guarda = p.crearGuardaDeSesion(almacen);
  const deA = guarda.guardar(A);
  await vaciar();
  const borrado = guarda.borrar();
  const deB = guarda.guardar(B);
  almacen.terminarEscritura(); // termina la de A
  await vaciar();
  almacen.terminarEscritura(); // termina la de B
  assert.deepEqual([await deA, await borrado, await deB], [false, true, true]);
  assert.equal(p.leerCredencial(almacen.datos.get(p.CLAVE_DE_LA_SESION)).token, 'token-b');
});

test('7 · una verificación que responde después de «Iniciar sesión de nuevo» se ignora y no restaura nada', async () => {
  const almacen = almacenFalso();
  await p.crearGuardaDeSesion(almacen).guardar(A);
  const guarda = procesoNuevo(almacen);
  const respuesta = diferido();
  let vigente = true;
  const recuperacion = p.recuperarSesion({ guarda, verificar: () => respuesta.promesa, ahora: ahora(Date.now()), sigueVigente: () => vigente });
  await vaciar();
  vigente = false; // la persona elige no esperar
  await guarda.borrar();
  respuesta.resolver(aceptada('identidad-a', A.expiresAt, 'Sat, 03 Oct 2026 15:00:00 GMT'));
  assert.equal(await recuperacion, null);
  assert.equal(almacen.datos.size, 0);
});

// ─── 8. Fallas del almacenamiento seguro ─────────────────────────────────────────────────────────────────────────

test('8 · si no se puede guardar, la sesión sigue en memoria pero no se promete recordarla', async () => {
  const almacen = almacenFalso();
  almacen.falla.guardar = true;
  const guarda = p.crearGuardaDeSesion(almacen);
  assert.equal(await guarda.guardar(A), false);
  assert.equal(guarda.recordada('token-a'), false);
});

test('8 · si no se puede leer, o el almacén no responde, la app arranca en la bienvenida sin quedarse esperando', async () => {
  const conFalla = almacenFalso();
  conFalla.falla.leer = true;
  assert.deepEqual(await p.recuperarSesion({ guarda: procesoNuevo(conFalla), verificar: async () => SIN_RED, ahora: ahora(Date.now()), sigueVigente: () => true }), { tipo: 'ninguna' });

  const colgado = almacenFalso();
  colgado.leer = () => new Promise(() => {});
  const r = await p.recuperarSesion({ guarda: procesoNuevo(colgado, { esperaMaximaDeLecturaMs: 20 }), verificar: async () => SIN_RED, ahora: ahora(Date.now()), sigueVigente: () => true });
  assert.deepEqual(r, { tipo: 'ninguna' });
});

test('8 · si no se puede borrar, se informa; lo guardado que no es una credencial válida se descarta', async () => {
  const almacen = almacenFalso();
  const guarda = p.crearGuardaDeSesion(almacen);
  await guarda.guardar(A);
  almacen.falla.borrar = true;
  assert.equal(await guarda.borrar(), false);

  for (const roto of ['no es JSON', JSON.stringify({ v: 2, token: 't', identidadId: 'i', expiresAt: A.expiresAt, vigenciaMs: null }), JSON.stringify({ v: 1, token: '', identidadId: 'i', expiresAt: A.expiresAt, vigenciaMs: null })]) {
    const otro = almacenFalso();
    otro.datos.set(p.CLAVE_DE_LA_SESION, roto);
    const r = await p.recuperarSesion({ guarda: procesoNuevo(otro), verificar: async () => SIN_RED, ahora: ahora(Date.now()), sigueVigente: () => true });
    assert.deepEqual(r, { tipo: 'ninguna' });
    await vaciar();
    assert.equal(otro.datos.size, 0, 'se borró');
  }
});

// ─── Qué se guarda y dónde ───────────────────────────────────────────────────────────────────────────────────────

test('se guarda solo el token, la identidad y la vigencia: ni contraseña ni datos de salud', () => {
  assert.deepEqual(Object.keys(JSON.parse(p.serializarCredencial(A))), ['v', 'token', 'identidadId', 'expiresAt', 'vigenciaMs']);
});

test('sin la hora del servidor, la sesión recuperada compara con el reloj del teléfono y el aviso no dice la duración', () => {
  const s = p.sesionRecuperada(A, A.expiresAt, null, 1_000, Date.parse('2026-10-03T15:00:00Z'));
  assert.equal(s.vigenciaMs, null);
  assert.equal(memoria.avisoDeVencimiento(s), 'Tu sesión venció. Iniciá sesión para continuar.');
});

test('el token va solo al almacenamiento seguro: la lógica no importa ningún almacenamiento y el adaptador usa expo-secure-store', () => {
  const logica = readFileSync(resolve(RAIZ, 'apps/mobile/src/sesion-persistente.ts'), 'utf8');
  assert.doesNotMatch(logica.split('\n').filter((l) => /^import /.test(l)).join('\n'), /async-storage|secure-store|localStorage/);
  const adaptador = readFileSync(resolve(RAIZ, 'apps/mobile/src/almacen-seguro.ts'), 'utf8');
  assert.match(adaptador, /from 'expo-secure-store'/);
  assert.doesNotMatch(adaptador, /async-storage/);
  const app = readFileSync(resolve(RAIZ, 'apps/mobile/App.tsx'), 'utf8');
  assert.match(app, /crearGuardaDeSesion\(almacenSeguro\)/);
  assert.doesNotMatch(app, /async-storage/);
  // La raíz borra la credencial al terminar la sesión, la guarda al iniciarla y la verifica al montar sin sesión.
  const terminar = app.slice(app.indexOf('const terminar = useCallback('), app.indexOf('const recuperar = useCallback('));
  assert.match(terminar, /void guarda\.borrar\(\);/);
  assert.match(terminar, /intentoDeRecuperacion\.current\+\+;/);
  assert.match(app, /void guarda\.guardar\(\{ token, identidadId, expiresAt, vigenciaMs: nueva\.vigenciaMs \}\)/);
  assert.match(app, /if \(alMontar\.estado === 'ninguna'\) void recuperar\(\);/);
  const config = readFileSync(resolve(RAIZ, 'apps/mobile/app.config.ts'), 'utf8');
  assert.match(config, /\['expo-secure-store', \{ configureAndroidBackup: true, faceIDPermission: false \}\]/);
});
