/**
 * La recuperación de la sesión al abrir la APK (WP-ENTRENAMIENTO-SERIES §7.6, referencia 02; ACEPTACION R01 a R03):
 * las causas de una comprobación que no termina bien y el umbral de demora, en `apps/mobile/src/sesion-persistente.ts`.
 * Completa `scripts/sesion-persistente.test.mjs`, que sigue probando qué se guarda, qué se borra y cuándo.
 *
 * Con respuestas controladas y un temporizador inyectado, sin esperas reales:
 *  1. cada causa es distinta: sin conexión, tiempo agotado, servicio no disponible (5xx o 429) y otra respuesta; solo la
 *     credencial inválida o vencida vuelve a Iniciar sesión;
 *  2. una falla de red, el tiempo agotado o un servicio caído no borran la credencial;
 *  3. a los 5 s se avisa una sola vez que está tardando; el pedido sigue hasta su tope de 10 s; un reintento vuelve a
 *     contar y una respuesta a tiempo cancela el aviso.
 *
 * **Lo que esto no prueba:** el dibujo de la pantalla con el isotipo, el indicador quieto con movimiento reducido ni
 * TalkBack. El dibujo está en los renders del navegador (EVIDENCIA/ENTRENAMIENTO-SERIES); lo demás, en el teléfono.
 * Uso: node --test scripts/recuperacion-de-sesion.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const p = await import('../apps/mobile/src/sesion-persistente.ts');

const HORA = 3_600_000;
const A = { token: 'token-a', identidadId: 'identidad-a', expiresAt: '2026-10-06T22:00:00.000Z', vigenciaMs: 12 * HORA };
const rechazo = (status, codigo) => ({ ok: false, tipo: 'API', status, codigo, issues: [] });
const aceptada = { ok: true, datos: { data: { identityId: 'identidad-a', session: { id: 's', expiresAt: A.expiresAt } } }, fechaDelServidor: 'Tue, 06 Oct 2026 15:00:00 GMT' };

function almacenFalso() {
  const datos = new Map();
  return { datos, leer: async (k) => datos.get(k) ?? null, guardar: async (k, v) => void datos.set(k, v), borrar: async (k) => void datos.delete(k) };
}

/** Un temporizador de mentira: el tiempo avanza cuando la prueba lo dice. */
function temporizadorDePrueba() {
  const t = { ahora: 0, tareas: [] };
  return {
    t,
    esperar(ms, alCumplirse) {
      const tarea = { en: t.ahora + ms, alCumplirse, viva: true };
      t.tareas.push(tarea);
      return () => {
        tarea.viva = false;
      };
    },
    avanzar(ms) {
      t.ahora += ms;
      for (const tarea of t.tareas) {
        if (tarea.viva && tarea.en <= t.ahora) {
          tarea.viva = false;
          tarea.alCumplirse();
        }
      }
    },
    pendientes: () => t.tareas.filter((x) => x.viva).length,
  };
}

// ─── 1. Las causas ──────────────────────────────────────────────────────────────────────────────

test('1 · cada causa es distinta: sin conexión, tiempo agotado, servicio no disponible y otra respuesta', () => {
  const decidir = (r) => p.decidirRecuperacion(A, r, 0, Date.parse('2026-10-06T15:00:00Z'));
  const casos = [
    [{ ok: false, tipo: 'RED' }, 'sin-conexion', true],
    [p.TIEMPO_AGOTADO, 'tiempo-agotado', false],
    [rechazo(503, 'SERVICE_UNAVAILABLE'), 'servicio-no-disponible', false],
    [rechazo(500, 'INTERNAL_ERROR'), 'servicio-no-disponible', false],
    [rechazo(429, 'RATE_LIMITED'), 'servicio-no-disponible', false],
    [rechazo(403, 'ACTION_FORBIDDEN'), 'otra', false],
    [rechazo(200, 'RESPUESTA_NO_RECONOCIDA'), 'otra', false],
  ];
  for (const [respuesta, causa, sinConexion] of casos) {
    const d = decidir(respuesta);
    assert.equal(d.tipo, 'sin-verificar', JSON.stringify(respuesta));
    assert.equal(d.causa, causa, JSON.stringify(respuesta));
    assert.equal(d.sinConexion, sinConexion, 'sinConexion es exactamente «sin conexión»');
    assert.equal(d.credencial, A);
  }
  // Solo la credencial inválida o vencida vuelve a Iniciar sesión.
  assert.equal(decidir(rechazo(401, 'SESSION_INVALID')).tipo, 'no-valida');
  assert.equal(decidir(rechazo(401, 'SESSION_REVOKED')).tipo, 'no-valida');
  assert.equal(decidir(rechazo(401, 'SESSION_EXPIRED')).tipo, 'vencida');
  assert.equal(decidir(aceptada).tipo, 'recuperada');
});

// ─── 2. Ninguna falla de red borra la credencial ───────────────────────────────────────────────

test('2 · sin conexión, con el tiempo agotado o con el servicio caído, la credencial queda y se puede reintentar', async () => {
  for (const [verificar, causa] of [
    [async () => ({ ok: false, tipo: 'RED' }), 'sin-conexion'],
    [() => new Promise(() => {}), 'tiempo-agotado'],
    [async () => rechazo(503, 'SERVICE_UNAVAILABLE'), 'servicio-no-disponible'],
  ]) {
    const almacen = almacenFalso();
    const guarda = p.crearGuardaDeSesion(almacen);
    await guarda.guardar(A);
    const r = await p.recuperarSesion({ guarda, verificar, ahora: () => ({ monotono: 0, reloj: Date.now() }), sigueVigente: () => true, esperaMaximaDeVerificacionMs: 15 });
    assert.equal(r.causa, causa);
    await new Promise((listo) => setImmediate(listo));
    assert.ok(almacen.datos.has(p.CLAVE_DE_LA_SESION), `${causa}: la credencial no se borra`);
    const otra = await p.recuperarSesion({ guarda, credencial: r.credencial, verificar: async () => aceptada, ahora: () => ({ monotono: 0, reloj: Date.now() }), sigueVigente: () => true });
    assert.equal(otra.tipo, 'recuperada', `${causa}: reintentar con la API de vuelta la recupera`);
  }
});

test('2 · el tope del pedido es de 10 s y el umbral de demora, de 5 s', () => {
  assert.equal(p.TOPE_DE_VERIFICACION_MS, 10_000);
  assert.equal(p.UMBRAL_DE_DEMORA_MS, 5_000);
  assert.ok(p.UMBRAL_DE_DEMORA_MS < p.TOPE_DE_VERIFICACION_MS, 'el aviso llega antes del tope: el pedido sigue');
});

// ─── 3. El umbral de demora ────────────────────────────────────────────────────────────────────

test('3 · a los 5 s se avisa una sola vez que está tardando; antes, no', () => {
  const reloj = temporizadorDePrueba();
  let avisos = 0;
  const vigia = p.crearVigiaDeDemora(reloj, () => avisos++);
  vigia.reiniciar();
  reloj.avanzar(4_999);
  assert.equal(avisos, 0, 'a los 4,999 s todavía comprueba');
  reloj.avanzar(1);
  assert.equal(avisos, 1, 'a los 5 s, «Está tardando más de lo habitual»');
  reloj.avanzar(5_000);
  assert.equal(avisos, 1, 'una sola vez');
});

test('3 · una respuesta a tiempo cancela el aviso; «Reintentar» vuelve a contar desde cero, sin dos avisos en paralelo', () => {
  const reloj = temporizadorDePrueba();
  let avisos = 0;
  const vigia = p.crearVigiaDeDemora(reloj, () => avisos++);
  vigia.reiniciar();
  reloj.avanzar(3_000);
  vigia.parar(); // llegó la respuesta
  reloj.avanzar(10_000);
  assert.equal(avisos, 0);
  vigia.reiniciar();
  reloj.avanzar(4_000);
  vigia.reiniciar(); // la persona reintentó
  assert.equal(reloj.pendientes(), 1, 'un solo temporizador vivo');
  reloj.avanzar(4_000);
  assert.equal(avisos, 0, 'cuenta desde el reintento');
  reloj.avanzar(1_000);
  assert.equal(avisos, 1);
});
