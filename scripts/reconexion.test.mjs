/**
 * La reconexión al abrir la APK (precierre del 2026-10-06, §5): `verificarAcotado` y `recuperarSesion` de
 * `apps/mobile/src/sesion-persistente.ts`, con un reloj y una API de mentira, sin esperas reales.
 *
 * La API de prueba duerme cuando no se usa y despertarla llevó unos 23 s (`docs/DESPLIEGUE.md`). Con el tope anterior de
 * 10 s, la app se rendía antes y «Reintentar» lanzaba otro pedido encima. Lo que se prueba:
 *  1. una demora de 25, 30 o 35 s (lo pedido), de 43 s (lo medido en test el 2026-10-06) o de 60 s termina bien con un
 *     solo pedido: la sesión se recupera y se conserva;
 *  2. el aviso de los 5 s es «esperando», no un error, y mientras hay un pedido en curso no hay otro;
 *  3. sin respuesta en la espera máxima (75 s), el pedido se corta (AbortController) y es «tiempo agotado»; recién entonces «Reintentar»
 *     hace otro pedido, y nunca hay dos en curso;
 *  4. un 503 o un 429 mientras la API arranca se reintenta solo, de a uno y dentro de la espera; si sigue, es «servicio no
 *     disponible», con los intentos acotados;
 *  5. sin red se dice enseguida, sin esperar;
 *  6. ninguno de estos casos borra la credencial.
 *
 * **Lo que esto no prueba:** la red real del teléfono ni el arranque real de la API en Render. La demora real de 30 s
 * contra la API local, con la pantalla de la APK, está en el recorrido de la evidencia.
 * Uso: node --test scripts/reconexion.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const p = await import('../apps/mobile/src/sesion-persistente.ts');

const HORA = 3_600_000;
const A = { token: 'token-a', identidadId: 'identidad-a', expiresAt: '2026-10-06T22:00:00.000Z', vigenciaMs: 12 * HORA };
const aceptada = { ok: true, datos: { data: { identityId: 'identidad-a', session: { id: 's', expiresAt: A.expiresAt } } }, fechaDelServidor: 'Tue, 06 Oct 2026 15:00:00 GMT' };
const rechazo = (status, codigo) => ({ ok: false, tipo: 'API', status, codigo, issues: [] });

/** Un reloj con tareas: el tiempo avanza cuando la prueba lo dice, y entre paso y paso se dejan correr las promesas. */
function relojDePrueba() {
  const r = { ms: 0, tareas: [] };
  return {
    r,
    ahoraMs: () => r.ms,
    temporizador: {
      esperar(ms, alCumplirse) {
        const tarea = { en: r.ms + ms, alCumplirse, viva: true };
        r.tareas.push(tarea);
        return () => {
          tarea.viva = false;
        };
      },
    },
    async avanzar(ms, paso = 500) {
      const fin = r.ms + ms;
      while (r.ms < fin) {
        r.ms = Math.min(fin, r.ms + paso);
        for (const tarea of r.tareas) {
          if (tarea.viva && tarea.en <= r.ms) {
            tarea.viva = false;
            tarea.alCumplirse();
          }
        }
        for (let i = 0; i < 5; i++) await new Promise((listo) => setImmediate(listo));
      }
    },
  };
}

/** Una API que responde cuando la prueba lo programa, y que cuenta los pedidos y los que están en curso a la vez. */
function apiDePrueba(reloj, respuestas) {
  const api = { pedidos: [], enCurso: 0, maximoEnCurso: 0, cortados: 0 };
  api.verificar = (token, senal) => {
    const n = api.pedidos.length;
    api.pedidos.push({ token, en: reloj.r.ms });
    api.enCurso++;
    api.maximoEnCurso = Math.max(api.maximoEnCurso, api.enCurso);
    const plan = respuestas[n] ?? respuestas[respuestas.length - 1];
    return new Promise((resolver, rechazar) => {
      const listo = (valor, error) => {
        api.enCurso--;
        error ? rechazar(error) : resolver(valor);
      };
      senal.addEventListener('abort', () => {
        api.cortados++;
        listo(null, new Error('cortado'));
      });
      if (plan.tras === undefined) return; // no responde nunca
      reloj.temporizador.esperar(plan.tras, () => {
        if (!senal.aborted) listo(plan.respuesta);
      });
    });
  };
  return api;
}

function almacenFalso() {
  const datos = new Map();
  return { datos, leer: async (k) => datos.get(k) ?? null, guardar: async (k, v) => void datos.set(k, v), borrar: async (k) => void datos.delete(k) };
}

async function recuperarCon(reloj, api, { credencial } = {}) {
  const almacen = almacenFalso();
  const guarda = p.crearGuardaDeSesion(almacen);
  await guarda.guardar(A);
  const promesa = p.recuperarSesion({
    guarda,
    verificar: api.verificar,
    credencial,
    ahora: () => ({ monotono: reloj.r.ms, reloj: Date.parse('2026-10-06T15:00:00.000Z') + reloj.r.ms }),
    sigueVigente: () => true,
    temporizador: reloj.temporizador,
    ahoraMs: reloj.ahoraMs,
  });
  return { promesa, almacen };
}

for (const segundos of [25, 30, 35, 43, 60]) {
  test(`1 · una API que tarda ${segundos} s en despertar: un solo pedido, y la sesión se recupera sin hacer nada`, async () => {
    const reloj = relojDePrueba();
    const api = apiDePrueba(reloj, [{ tras: segundos * 1000, respuesta: aceptada }]);
    let resultado = null;
    const { promesa, almacen } = await recuperarCon(reloj, api);
    void promesa.then((r) => (resultado = r));
    // El aviso de demora de la pantalla: a los 5 s dice que está tardando, y el pedido sigue.
    let tardando = false;
    const vigia = p.crearVigiaDeDemora(reloj.temporizador, () => (tardando = true));
    vigia.reiniciar();
    await reloj.avanzar(5_000);
    assert.equal(tardando, true, 'a los 5 s, «Está tardando más de lo habitual»');
    assert.equal(resultado, null, 'esperar no es fallar: todavía no hay resultado');
    await reloj.avanzar(segundos * 1000 - 5_000 + 1_000);
    assert.equal(resultado?.tipo, 'recuperada');
    assert.equal(api.pedidos.length, 1, 'un solo pedido');
    assert.equal(api.maximoEnCurso, 1);
    assert.ok(almacen.datos.has(p.CLAVE_DE_LA_SESION), 'la sesión se conserva');
  });
}

test('2 · mientras el pedido sigue, otro intento de verificar no sale: nunca hay dos en curso', async () => {
  // La raíz lo garantiza con su candado; acá, el mismo pedido en curso no se repite aunque pasen 50 s.
  const reloj = relojDePrueba();
  const api = apiDePrueba(reloj, [{ tras: 50_000, respuesta: aceptada }]);
  const { promesa } = await recuperarCon(reloj, api);
  await reloj.avanzar(49_000);
  assert.equal(api.pedidos.length, 1);
  await reloj.avanzar(2_000);
  assert.equal((await promesa).tipo, 'recuperada');
  assert.equal(api.maximoEnCurso, 1);
});

test('3 · sin respuesta en la espera máxima: el pedido se corta y es «tiempo agotado»; «Reintentar» hace otro, nunca dos a la vez', async () => {
  const reloj = relojDePrueba();
  const api = apiDePrueba(reloj, [{ tras: undefined }, { tras: 1_000, respuesta: aceptada }]);
  let resultado = null;
  const { promesa, almacen } = await recuperarCon(reloj, api);
  void promesa.then((r) => (resultado = r));
  await reloj.avanzar(p.ESPERA_MAXIMA_DE_VERIFICACION_MS - 1_000);
  assert.equal(resultado, null, 'un segundo antes de la espera máxima, sigue esperando');
  await reloj.avanzar(1_500);
  assert.equal(resultado?.tipo, 'sin-verificar');
  assert.equal(resultado.causa, 'tiempo-agotado');
  assert.equal(api.cortados, 1, 'el pedido colgado se cortó');
  assert.equal(api.enCurso, 0, 'no queda ningún pedido en curso');
  assert.ok(almacen.datos.has(p.CLAVE_DE_LA_SESION));
  // «Reintentar»: un pedido nuevo, sin el anterior encima.
  const otro = await recuperarCon(reloj, api, { credencial: resultado.credencial });
  await reloj.avanzar(2_000);
  assert.equal((await otro.promesa).tipo, 'recuperada');
  assert.equal(api.pedidos.length, 2);
  assert.equal(api.maximoEnCurso, 1, 'nunca hubo dos pedidos a la vez');
});

test('4 · un 503 mientras la API arranca se reintenta solo, de a uno, y la sesión se recupera', async () => {
  const reloj = relojDePrueba();
  const api = apiDePrueba(reloj, [
    { tras: 1_000, respuesta: rechazo(503, 'SERVICE_UNAVAILABLE') },
    { tras: 1_000, respuesta: rechazo(429, 'RATE_LIMITED') },
    { tras: 20_000, respuesta: aceptada },
  ]);
  const { promesa } = await recuperarCon(reloj, api);
  await reloj.avanzar(40_000);
  assert.equal((await promesa).tipo, 'recuperada');
  assert.equal(api.pedidos.length, 3);
  assert.equal(api.maximoEnCurso, 1);
  // Las esperas entre pedidos son las declaradas: 2 s después del 503 y 4 s después del 429 (cada respuesta tardó 1 s).
  const primero = api.pedidos[0].en;
  assert.deepEqual(api.pedidos.map((x) => x.en - primero), [0, 3_000, 8_000]);
});

test('4 · si el servicio sigue sin estar disponible, se deja de reintentar dentro de la espera: «servicio no disponible»', async () => {
  const reloj = relojDePrueba();
  const api = apiDePrueba(reloj, [{ tras: 500, respuesta: rechazo(503, 'SERVICE_UNAVAILABLE') }]);
  const { promesa, almacen } = await recuperarCon(reloj, api);
  await reloj.avanzar(p.ESPERA_MAXIMA_DE_VERIFICACION_MS + 5_000);
  const r = await promesa;
  assert.equal(r.tipo, 'sin-verificar');
  assert.equal(r.causa, 'servicio-no-disponible');
  assert.ok(api.pedidos.length <= 8, `intentos acotados: ${api.pedidos.length}`);
  assert.ok(api.pedidos.at(-1).en < p.ESPERA_MAXIMA_DE_VERIFICACION_MS, 'ninguno después de la espera máxima');
  assert.equal(api.maximoEnCurso, 1);
  assert.ok(almacen.datos.has(p.CLAVE_DE_LA_SESION));
});

test('5 · sin red se dice enseguida: no se espera un minuto ni se reintenta solo', async () => {
  const reloj = relojDePrueba();
  const api = { pedidos: 0, verificar: async () => (api.pedidos++, { ok: false, tipo: 'RED' }) };
  const { promesa, almacen } = await recuperarCon(reloj, api);
  await reloj.avanzar(500);
  const r = await promesa;
  assert.equal(r.causa, 'sin-conexion');
  assert.equal(api.pedidos, 1);
  assert.ok(almacen.datos.has(p.CLAVE_DE_LA_SESION));
});
