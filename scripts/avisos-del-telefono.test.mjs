/**
 * WP-NOVEDADES-Y-AVISOS (DL-133): la lógica de los avisos en la APK (apps/mobile/src/avisos.ts), con un teléfono y una
 * API falsos. Lo que se prueba:
 * - el permiso se pide recién al activar; negado, no se registra nada;
 * - sin Firebase (no hay token), «no disponibles», y nada queda guardado como activo;
 * - el teléfono tiene un identificador propio y estable;
 * - activos por cuenta: al entrar se renueva el token solo si esta cuenta los activó; al salir se retiran y se olvidan;
 * - solo un aviso con los datos de BE abre Novedades.
 *
 * Uso: node --test scripts/avisos-del-telefono.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const avisos = await import('../apps/mobile/src/avisos.ts');

function telefono({ permiso = 'sin-preguntar', alPedir = 'concedido', token = 'ExponentPushToken[telefono-de-prueba]' } = {}) {
  const guardado = new Map();
  const pedidos = [];
  let estadoDelPermiso = permiso;
  let preguntas = 0;
  let ids = 0;
  return {
    pedidos,
    guardado,
    preguntas: () => preguntas,
    d: {
      canal: {
        permiso: async () => estadoDelPermiso,
        pedirPermiso: async () => {
          preguntas++;
          estadoDelPermiso = alPedir;
          return alPedir;
        },
        token: async () => {
          if (token === null) throw new Error('Default FirebaseApp is not initialized');
          return token;
        },
      },
      almacen: {
        leer: async (k) => guardado.get(k) ?? null,
        guardar: async (k, v) => void guardado.set(k, v),
        borrar: async (k) => void guardado.delete(k),
      },
      api: {
        registrar: async (sesion, deviceId, expoPushToken) => {
          pedidos.push({ tipo: 'registrar', sesion, deviceId, expoPushToken });
          return { ok: true, datos: {} };
        },
        retirar: async (sesion, deviceId) => {
          pedidos.push({ tipo: 'retirar', sesion, deviceId });
          return { ok: true, datos: null };
        },
      },
      nuevoIdentificador: () => `0000000${++ids}-0000-4000-8000-000000000000`,
    },
  };
}

const ANA = { token: 'sesion-de-ana', identidadId: 'AAAAAAAA-0000-4000-8000-000000000001' };
const BRUNO = { token: 'sesion-de-bruno', identidadId: 'bbbbbbbb-0000-4000-8000-000000000002' };

test('activar pide el permiso en ese momento, registra el teléfono y lo recuerda para esa cuenta', async () => {
  const t = telefono();
  assert.deepEqual(await avisos.estadoGuardado(t.d, ANA.identidadId), { tipo: 'apagados' });
  assert.equal(t.preguntas(), 0, 'abrir Cuenta no pide el permiso');
  assert.deepEqual(await avisos.activar(t.d, ANA), { tipo: 'activos' });
  assert.equal(t.preguntas(), 1);
  assert.deepEqual(t.pedidos, [{ tipo: 'registrar', sesion: 'sesion-de-ana', deviceId: '00000001-0000-4000-8000-000000000000', expoPushToken: 'ExponentPushToken[telefono-de-prueba]' }]);
  assert.deepEqual(await avisos.estadoGuardado(t.d, ANA.identidadId), { tipo: 'activos' });
  // Otra cuenta en el mismo teléfono no los tiene activos.
  assert.deepEqual(await avisos.estadoGuardado(t.d, BRUNO.identidadId), { tipo: 'apagados' });
});

test('con el permiso negado no se registra nada; sin Firebase, «no disponibles» y nada queda activo', async () => {
  const negado = telefono({ alPedir: 'denegado' });
  assert.deepEqual(await avisos.activar(negado.d, ANA), { tipo: 'sin-permiso' });
  assert.deepEqual(negado.pedidos, []);
  const sinFirebase = telefono({ token: null });
  assert.deepEqual(await avisos.activar(sinFirebase.d, ANA), { tipo: 'no-disponibles' });
  assert.deepEqual(sinFirebase.pedidos, []);
  assert.deepEqual(await avisos.estadoGuardado(sinFirebase.d, ANA.identidadId), { tipo: 'apagados' });
});

test('el identificador del teléfono es uno solo, y sirve para todas las cuentas', async () => {
  const t = telefono({ permiso: 'concedido' });
  await avisos.activar(t.d, ANA);
  await avisos.activar(t.d, BRUNO);
  assert.equal(new Set(t.pedidos.map((p) => p.deviceId)).size, 1);
});

test('al entrar se renueva el token solo si esta cuenta los activó; al salir se retiran y se olvidan', async () => {
  const t = telefono({ permiso: 'concedido' });
  await avisos.renovar(t.d, ANA);
  assert.deepEqual(t.pedidos, [], 'sin activar, entrar no registra nada');
  await avisos.activar(t.d, ANA);
  await avisos.renovar(t.d, ANA);
  assert.deepEqual(t.pedidos.map((p) => p.tipo), ['registrar', 'registrar']);
  await avisos.retirarAlSalir(t.d, ANA);
  assert.deepEqual(t.pedidos.map((p) => p.tipo), ['registrar', 'registrar', 'retirar']);
  assert.deepEqual(await avisos.estadoGuardado(t.d, ANA.identidadId), { tipo: 'apagados' });
  // Salir de nuevo, o salir una cuenta que no los tenía, no pide nada.
  await avisos.retirarAlSalir(t.d, ANA);
  await avisos.retirarAlSalir(t.d, BRUNO);
  assert.equal(t.pedidos.length, 3);
});

test('desactivar se olvida aunque la API no responda; sin permiso en los ajustes, Cuenta lo dice', async () => {
  const t = telefono({ permiso: 'concedido' });
  await avisos.activar(t.d, ANA);
  t.d.api.retirar = async () => ({ ok: false, tipo: 'RED' });
  const r = await avisos.desactivar(t.d, ANA);
  assert.equal(r.tipo, 'error');
  assert.deepEqual(await avisos.estadoGuardado(t.d, ANA.identidadId), { tipo: 'apagados' });
  const sinPermiso = telefono({ permiso: 'concedido' });
  await avisos.activar(sinPermiso.d, ANA);
  sinPermiso.d.canal.permiso = async () => 'denegado';
  assert.deepEqual(await avisos.estadoGuardado(sinPermiso.d, ANA.identidadId), { tipo: 'sin-permiso' });
});

test('solo un aviso con los datos de BE abre Novedades', () => {
  assert.equal(avisos.esAvisoDeBe({ type: 'NEW_INTERNAL_UPDATE', referenceId: 'n1' }), true);
  for (const otro of [null, undefined, {}, { type: 'OTRO', referenceId: 'n1' }, { type: 'NEW_INTERNAL_UPDATE' }, 'texto']) assert.equal(avisos.esAvisoDeBe(otro), false);
});
