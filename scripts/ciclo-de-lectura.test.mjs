/**
 * El ciclo de una lectura protegida de la APK (`apps/mobile/src/ciclo-de-lectura.ts`) frente a revocaciones, cierres de
 * sesión, cambios de cuenta y respuestas tardías (tanda del 2026-10-03, etapa A). Cada caso define primero lo que manda
 * el contrato (DL-115; 08:406) y después lo prueba. Las carreras se controlan a mano: cada respuesta es una promesa que
 * la prueba resuelve cuando quiere, sin esperas.
 *
 * Uso: node --test scripts/ciclo-de-lectura.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { crearMemoriaDeLecturas, CODIGOS_DE_SESION_NO_VALIDA } = require('../packages/domain/dist/index.js');
const { crearCicloDeLectura } = await import('../apps/mobile/src/ciclo-de-lectura.ts');
const { leerLista, leerMiEvolucion } = await import('../apps/mobile/src/lecturas-de-las-zonas.ts');

/** El mismo predicado que usa la APK (useSesionPerdida): solo un código de sesión cierra la sesión. */
function contadorDeCierres() {
  const c = { veces: 0 };
  c.sesionPerdida = (r) => {
    if (!r.ok && r.tipo === 'API' && CODIGOS_DE_SESION_NO_VALIDA.has(r.codigo)) {
      c.veces++;
      return true;
    }
    return false;
  };
  return c;
}

const PROHIBIDO = { ok: false, tipo: 'API', status: 403, codigo: 'ACTION_FORBIDDEN', issues: [] };
const SIN_SESION = { ok: false, tipo: 'API', status: 401, codigo: 'SESSION_REVOKED', issues: [] };
const RED = { ok: false, tipo: 'RED' };
const SATURADA = { ok: false, tipo: 'API', status: 503, codigo: 'DB_UNAVAILABLE', issues: [] };
const DEMASIADOS = { ok: false, tipo: 'API', status: 429, codigo: 'RATE_LIMITED', issues: [] };
const ok = (datos) => ({ ok: true, datos });

/** Una API de mentira: cada pedido queda pendiente hasta que la prueba lo resuelve. */
function apiControlada() {
  const pendientes = [];
  return {
    pedir: () => new Promise((resolver) => pendientes.push(resolver)),
    pendientes: () => pendientes.length,
    /** Resuelve el pedido `i` (el primero que sigue sin resolver, si no se dice) y deja correr las promesas. */
    async responder(resultado, i = 0) {
      const resolver = pendientes.splice(i, 1)[0];
      assert.ok(resolver, 'no hay un pedido pendiente para responder');
      resolver(resultado);
      for (let n = 0; n < 5; n++) await Promise.resolve();
    },
  };
}

/** Un ciclo con su registro de todo lo que la pantalla llegó a mostrar. */
function pantalla(memoria, token, api, { clave = 'mi-evolucion', sesionPerdida = () => false } = {}) {
  const mostrado = [];
  const ciclo = crearCicloDeLectura({ memoria, token, clave, pedir: api.pedir, sesionPerdida, alCambiar: (e) => mostrado.push(e) });
  return { ciclo, mostrado, datosMostrados: () => mostrado.filter((e) => e.tipo === 'listo').map((e) => e.datos) };
}

/** Deja una lectura recordada en la memoria, como si la pantalla se hubiera visitado antes en esta sesión. */
async function visitadaAntes(memoria, token, datos, clave = 'mi-evolucion') {
  const api = apiControlada();
  const p = pantalla(memoria, token, api, { clave });
  const carga = p.ciclo.cargar();
  await api.responder(ok(datos));
  await carga;
  p.ciclo.terminar();
}

test('1 · revocar el A3 en el mismo teléfono y volver a una pantalla ya visitada: nunca se ve lo de antes', async () => {
  // Contrato: revocado el A3, lo propio no se lee (403); la APK no muestra lo que había leído.
  const memoria = crearMemoriaDeLecturas();
  await visitadaAntes(memoria, 'token-a', { toma: '1/10' });
  memoria.olvidarLecturas(); // la revocación es una escritura: olvida todo lo leído
  const api = apiControlada();
  const p = pantalla(memoria, 'token-a', api);
  const carga = p.ciclo.cargar();
  assert.deepEqual(p.mostrado.at(-1), { tipo: 'verificando' });
  await api.responder(PROHIBIDO);
  await carga;
  assert.equal(p.ciclo.estado().tipo, 'rechazado');
  assert.deepEqual(p.datosMostrados(), []);
});

test('2 · revocación desde otro dispositivo: al volver a la sección no se muestra lo recordado antes de que la API confirme', async () => {
  // Contrato: la APK no sabe de la revocación hasta preguntar. Al entrar, no muestra nada protegido sin confirmación.
  const memoria = crearMemoriaDeLecturas();
  await visitadaAntes(memoria, 'token-a', { toma: '1/10' });
  const api = apiControlada();
  const p = pantalla(memoria, 'token-a', api);
  const carga = p.ciclo.cargar();
  assert.deepEqual(p.mostrado, [{ tipo: 'verificando' }], 'lo recordado no se muestra mientras se verifica');
  await api.responder(PROHIBIDO);
  await carga;
  assert.equal(p.ciclo.estado().tipo, 'rechazado');
  assert.deepEqual(p.datosMostrados(), []);
  assert.equal(memoria.leer('token-a', 'mi-evolucion'), undefined, 'lo recordado se borra');
});

test('2 · regreso a la app con la pantalla abierta: lo confirmado sigue a la vista mientras se reconfirma, y se retira si la API lo niega', async () => {
  const memoria = crearMemoriaDeLecturas();
  const api = apiControlada();
  const p = pantalla(memoria, 'token-a', api);
  const entrada = p.ciclo.cargar();
  await api.responder(ok({ toma: '1/10' }));
  await entrada;
  const regreso = p.ciclo.cargar(); // AppState vuelve a «active»
  assert.deepEqual(p.ciclo.estado(), { tipo: 'listo', datos: { toma: '1/10' }, actualizando: true, sinActualizar: false });
  await api.responder(PROHIBIDO);
  await regreso;
  assert.equal(p.ciclo.estado().tipo, 'rechazado');
});

test('3 · cerrar la sesión con un pedido en curso: la respuesta no repuebla nada', async () => {
  const memoria = crearMemoriaDeLecturas();
  const api = apiControlada();
  const p = pantalla(memoria, 'token-a', api);
  const carga = p.ciclo.cargar();
  memoria.olvidarLaSesion(); // terminar(): cierre de sesión
  p.ciclo.terminar(); // la pantalla se desmonta
  await api.responder(ok({ toma: '1/10' }));
  await carga;
  assert.deepEqual(p.mostrado, [{ tipo: 'verificando' }]);
  assert.equal(memoria.leer('token-a', 'mi-evolucion'), undefined);
});

test('4 · entrar con otra cuenta después de tener datos cargados: nada de la anterior se ve ni se reusa', async () => {
  const memoria = crearMemoriaDeLecturas();
  await visitadaAntes(memoria, 'token-a', { de: 'a' });
  const api = apiControlada();
  const p = pantalla(memoria, 'token-b', api);
  const carga = p.ciclo.cargar();
  await api.responder(ok({ de: 'b' }));
  await carga;
  assert.deepEqual(p.datosMostrados(), [{ de: 'b' }]);
  assert.equal(memoria.leer('token-a', 'mi-evolucion'), undefined, 'lo de la cuenta anterior se olvidó');
});

test('5 · una respuesta pedida antes de revocar llega tarde: no se guarda ni se muestra, y se pide de nuevo', async () => {
  const memoria = crearMemoriaDeLecturas();
  const api = apiControlada();
  const p = pantalla(memoria, 'token-a', api);
  const carga = p.ciclo.cargar();
  memoria.olvidarLecturas(); // una revocación mientras el pedido viaja
  await api.responder(ok({ vieja: true }));
  assert.equal(api.pendientes(), 1, 'se volvió a pedir');
  await api.responder(PROHIBIDO);
  await carga;
  assert.deepEqual(p.datosMostrados(), []);
  assert.equal(memoria.leer('token-a', 'mi-evolucion'), undefined);
});

test('5 · una respuesta de una sesión anterior no se guarda en la nueva', async () => {
  const memoria = crearMemoriaDeLecturas();
  const api = apiControlada();
  const vieja = pantalla(memoria, 'token-a', api);
  const carga = vieja.ciclo.cargar();
  memoria.olvidarLaSesion();
  vieja.ciclo.terminar();
  memoria.marca('token-b'); // la nueva sesión ya leyó
  await api.responder(ok({ de: 'a' }));
  await carga;
  assert.equal(memoria.leer('token-b', 'mi-evolucion'), undefined);
});

test('5 · un pedido viejo de la misma pantalla que llega después del nuevo no pisa nada', async () => {
  const memoria = crearMemoriaDeLecturas();
  const api = apiControlada();
  const p = pantalla(memoria, 'token-a', api);
  const primero = p.ciclo.cargar();
  const segundo = p.ciclo.cargar();
  await api.responder(ok({ version: 2 }), 1); // responde primero el segundo
  await api.responder(ok({ version: 1 }), 0);
  await Promise.all([primero, segundo]);
  assert.deepEqual(p.ciclo.estado().datos, { version: 2 });
});

test('6 · un 403 al actualizar datos que estaban a la vista: se retiran y se olvidan', async () => {
  const memoria = crearMemoriaDeLecturas();
  const api = apiControlada();
  const p = pantalla(memoria, 'token-a', api);
  const entrada = p.ciclo.cargar();
  await api.responder(ok({ toma: '1/10' }));
  await entrada;
  const otra = p.ciclo.cargar();
  await api.responder(PROHIBIDO);
  await otra;
  assert.equal(p.ciclo.estado().tipo, 'rechazado');
  assert.equal(memoria.leer('token-a', 'mi-evolucion'), undefined);
});

test('7 · sin red, 429 o 503 al actualizar: la sesión sigue y lo confirmado en esta entrada queda con aviso', async () => {
  for (const falla of [RED, DEMASIADOS, SATURADA]) {
    const memoria = crearMemoriaDeLecturas();
    const api = apiControlada();
    const cierres = contadorDeCierres();
    const p = pantalla(memoria, 'token-a', api, { sesionPerdida: cierres.sesionPerdida });
    const entrada = p.ciclo.cargar();
    await api.responder(ok({ toma: '1/10' }));
    await entrada;
    const otra = p.ciclo.cargar();
    await api.responder(falla);
    await otra;
    assert.deepEqual(p.ciclo.estado(), { tipo: 'listo', datos: { toma: '1/10' }, actualizando: false, sinActualizar: true });
    assert.equal(cierres.veces, 0, `${falla.tipo === 'RED' ? 'sin red' : falla.status} no cierra la sesión`);
  }
});

test('7 · sin red al entrar, aunque haya algo recordado: no se muestra sin confirmar; se dice y se ofrece reintentar', async () => {
  const memoria = crearMemoriaDeLecturas();
  await visitadaAntes(memoria, 'token-a', { toma: '1/10' });
  const api = apiControlada();
  const p = pantalla(memoria, 'token-a', api);
  const carga = p.ciclo.cargar();
  await api.responder(RED);
  await carga;
  assert.deepEqual(p.ciclo.estado(), { tipo: 'sin-confirmar', falla: RED });
  assert.deepEqual(p.datosMostrados(), []);
});

test('8 · volver a otorgar el A3: la pantalla vuelve a confirmar y muestra lo permitido', async () => {
  const memoria = crearMemoriaDeLecturas();
  const api = apiControlada();
  const p = pantalla(memoria, 'token-a', api);
  const entrada = p.ciclo.cargar();
  await api.responder(PROHIBIDO);
  await entrada;
  memoria.olvidarLecturas(); // otorgar el A3 es una escritura
  const otra = p.ciclo.cargar();
  assert.deepEqual(p.mostrado.at(-1), { tipo: 'verificando' });
  await api.responder(ok({ toma: '1/10' }));
  await otra;
  assert.deepEqual(p.ciclo.estado().datos, { toma: '1/10' });
});

test('una sesión que ya no sirve: la app sale y el ciclo no muestra nada más', async () => {
  const memoria = crearMemoriaDeLecturas();
  const api = apiControlada();
  let salidas = 0;
  const p = pantalla(memoria, 'token-a', api, { sesionPerdida: (r) => !r.ok && r.tipo === 'API' && r.status === 401 && ++salidas > 0 });
  const carga = p.ciclo.cargar();
  await api.responder(SIN_SESION);
  await carga;
  assert.equal(salidas, 1);
  assert.deepEqual(p.mostrado, [{ tipo: 'verificando' }]);
});

test('si la respuesta dice lo mismo que lo recordado, se reusa el mismo objeto: no se recalcula ni se redibuja', async () => {
  const memoria = crearMemoriaDeLecturas();
  await visitadaAntes(memoria, 'token-a', { toma: '1/10', medidas: [1, 2, 3] });
  const recordado = memoria.leer('token-a', 'mi-evolucion');
  const api = apiControlada();
  const p = pantalla(memoria, 'token-a', api);
  const carga = p.ciclo.cargar();
  await api.responder(ok({ toma: '1/10', medidas: [1, 2, 3] }));
  await carga;
  assert.equal(p.ciclo.estado().datos, recordado);
});

test('si algo se olvida en cada intento, no queda nada a la vista sin confirmar', async () => {
  const memoria = crearMemoriaDeLecturas();
  const api = apiControlada();
  const p = pantalla(memoria, 'token-a', api);
  const carga = p.ciclo.cargar();
  for (let i = 0; i < 3; i++) {
    memoria.olvidarLecturas();
    await api.responder(ok({ intento: i }));
  }
  await carga;
  assert.deepEqual(p.ciclo.estado(), { tipo: 'sin-confirmar', falla: null });
  assert.deepEqual(p.datosMostrados(), []);
});

test('cargar desde cero (después de una escritura propia, o si la sesión pudo vencer dormida): lo confirmado se oculta hasta que la API conteste', async () => {
  const memoria = crearMemoriaDeLecturas();
  const api = apiControlada();
  const p = pantalla(memoria, 'token-a', api);
  const entrada = p.ciclo.cargar();
  await api.responder(ok({ toma: '1/10' }));
  await entrada;
  const otra = p.ciclo.cargar({ desdeCero: true });
  assert.deepEqual(p.ciclo.estado(), { tipo: 'verificando' });
  await api.responder(RED);
  await otra;
  assert.deepEqual(p.ciclo.estado(), { tipo: 'sin-confirmar', falla: RED }, 'sin red no vuelve lo de antes');
});

test('un 401 de sesión vencida, en cambio, sí cierra la sesión: es el único caso', async () => {
  const memoria = crearMemoriaDeLecturas();
  const api = apiControlada();
  const cierres = contadorDeCierres();
  const p = pantalla(memoria, 'token-a', api, { sesionPerdida: cierres.sesionPerdida });
  const carga = p.ciclo.cargar();
  await api.responder({ ok: false, tipo: 'API', status: 401, codigo: 'SESSION_EXPIRED', issues: [] });
  await carga;
  assert.equal(cierres.veces, 1);
});

// ─── Las lecturas combinadas de «Mi evolución» e «Información» ──────────────────────────────────

const vacia = { data: { period: { start: '2026-07-06', end: '2026-10-03', timeZone: 'America/Argentina/Buenos_Aires' }, metrics: [{ series: [] }] } };
const conToma = { data: { period: { start: '2026-04-07', end: '2026-07-05', timeZone: 'America/Argentina/Buenos_Aires' }, metrics: [{ series: [{ value: 1 }] }] } };
/** Una API de las zonas con respuestas en fila. */
function apiDeZonas({ evolucion = [], lista, requisito }) {
  const cola = [...evolucion];
  return {
    miEvolucionAntropometrica: async () => cola.shift(),
    misSolicitudesDeFormulario: async () => lista,
    consultarRequisitoA3: async () => requisito,
  };
}

test('«Mi evolución»: una falla pasajera o de acceso en la búsqueda hacia atrás no se muestra como «sin mediciones»', async () => {
  for (const falla of [RED, SATURADA, DEMASIADOS, PROHIBIDO]) {
    const r = await leerMiEvolucion(apiDeZonas({ evolucion: [ok(vacia), falla] }), 'token-a');
    assert.deepEqual(r, falla);
  }
  const conAnterior = await leerMiEvolucion(apiDeZonas({ evolucion: [ok(vacia), ok(conToma)] }), 'token-a');
  assert.deepEqual(conAnterior, ok(conToma.data));
  const otraFalla = { ok: false, tipo: 'API', status: 400, codigo: 'PERIOD_INVALID', issues: [] };
  const sinNada = await leerMiEvolucion(apiDeZonas({ evolucion: [ok(vacia), otraFalla] }), 'token-a');
  assert.deepEqual(sinNada, ok(vacia.data), 'un rechazo de otro tipo deja el período actual');
});

test('«Información»: si el A3 no se pudo consultar, no se presume vigente; la lista sin aviso no se confirma', async () => {
  const lista = ok({ data: [], page: { limit: 20, nextCursor: null, hasMore: false } });
  assert.deepEqual(await leerLista(apiDeZonas({ lista, requisito: RED }), 'token-a'), RED);
  assert.deepEqual(await leerLista(apiDeZonas({ lista, requisito: SIN_SESION }), 'token-a'), SIN_SESION);
  const vigente = ok({ data: { currentConsent: { state: 'ACTIVE' } } });
  const revocado = ok({ data: { currentConsent: { state: 'REVOKED' } } });
  assert.equal((await leerLista(apiDeZonas({ lista, requisito: vigente }), 'token-a')).datos.sinA3, false);
  assert.equal((await leerLista(apiDeZonas({ lista, requisito: revocado }), 'token-a')).datos.sinA3, true);
});
