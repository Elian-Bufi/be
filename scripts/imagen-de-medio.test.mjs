/**
 * La carga de una imagen privada en la APK (precierre del 2026-10-06, §5): `apps/mobile/src/cargador-de-imagen.ts`, la
 * lógica que dibuja `imagen-de-medio.tsx`, con un acceso a medios inyectado (API-MED-03) y sin teléfono.
 *
 *  1. Sin imagen y descarga fallida son dos estados distintos, con textos distintos: una imagen nula no prueba nada.
 *  2. Una descarga que falla con un medio que existe: se renueva el acceso una sola vez; si vuelve a fallar, queda el
 *     respaldo. Si la ruta había vencido, la renovada se muestra. Si la API no da acceso, el respaldo, sin bucles.
 *  3. Si cambia el ejercicio, el medio o la cuenta mientras se pide o se renueva un acceso, la respuesta tardía se
 *     descarta: el recurso anterior nunca reaparece.
 *  4. El acceso se recuerda mientras vale y dos pedidos del mismo medio comparten el pedido.
 *
 * **Lo que esto no prueba:** el dibujo de React Native ni el `onError` real de una descarga en Android. La descarga
 * fallida con una serie registrada encima se prueba en el recorrido de la APK renderizada contra la API real.
 * Uso: node --test scripts/imagen-de-medio.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const { crearAccesoAMedios, crearCargadorDeImagen, MARGEN_DEL_ACCESO_MS } = await import('../apps/mobile/src/cargador-de-imagen.ts');
const { COPY_REGISTRO_DE_COMIDAS, COPY_ENTRENAMIENTO_POR_SERIE } = await import('@be/domain');

const AHORA = Date.parse('2026-10-06T16:00:00.000Z');
const sinPerdida = () => false;
const esperar = () => new Promise((r) => setImmediate(r));

/** API-MED-03 de mentira: cada pedido da una ruta nueva, o falla si se le pide; se puede frenar para ordenar respuestas. */
function apiDeMedios() {
  const a = {
    pedidos: [],
    negar: new Set(),
    frenos: [],
    async acceder(token, mediaId) {
      a.pedidos.push(`${token}|${mediaId}`);
      const n = a.pedidos.length;
      if (a.frenos.length > 0) await a.frenos.shift();
      if (a.negar.has(mediaId)) return { ok: false, tipo: 'API', status: 404, codigo: 'RESOURCE_NOT_FOUND', issues: [] };
      return { ok: true, datos: { data: { mediaId, path: `/media/${mediaId}/content?firma=${n}`, expiresAt: new Date(AHORA + 15 * 60_000).toISOString() } } };
    },
  };
  return a;
}

function nuevo(api = apiDeMedios(), ahora = { ms: AHORA }) {
  const acceso = crearAccesoAMedios({ acceder: (t, m) => api.acceder(t, m), urlDe: (r) => `https://api.prueba${r}`, ahoraMs: () => ahora.ms });
  const estados = [];
  const cargador = crearCargadorDeImagen(acceso, (e) => estados.push(e));
  return { api, acceso, cargador, estados, ahora };
}

test('1 · sin imagen y descarga fallida son dos estados distintos, con sus textos', async () => {
  const { cargador, api } = nuevo();
  cargador.mostrar('token', null, true, sinPerdida);
  assert.deepEqual(cargador.estado(), { tipo: 'sin-imagen' });
  assert.equal(api.pedidos.length, 0, 'sin imagen no se pide acceso');
  // Los textos del respaldo de un ejercicio: uno para cada caso.
  assert.notEqual(COPY_ENTRENAMIENTO_POR_SERIE.sinImagen, COPY_REGISTRO_DE_COMIDAS.imagenNoDisponible);
  assert.equal(COPY_REGISTRO_DE_COMIDAS.imagenNoDisponible, 'La imagen no se pudo mostrar.');
});

test('2 · un medio que existe y no descarga: una sola renovación y después el respaldo, sin más pedidos', async () => {
  const { cargador, api } = nuevo();
  cargador.mostrar('token', 'medio-1', true, sinPerdida);
  assert.deepEqual(cargador.estado(), { tipo: 'cargando' });
  await esperar();
  assert.deepEqual(cargador.estado(), { tipo: 'lista', url: 'https://api.prueba/media/medio-1/content?firma=1', renovada: false });
  // La descarga falla (la ruta respondió un error): se pide un acceso nuevo, una vez.
  cargador.alFallarLaDescarga();
  await esperar();
  assert.deepEqual(cargador.estado(), { tipo: 'lista', url: 'https://api.prueba/media/medio-1/content?firma=2', renovada: true });
  // Vuelve a fallar: el respaldo. Y no se pide nada más, aunque lleguen más errores.
  cargador.alFallarLaDescarga();
  assert.deepEqual(cargador.estado(), { tipo: 'fallo' });
  cargador.alFallarLaDescarga();
  await esperar();
  assert.deepEqual(cargador.estado(), { tipo: 'fallo' });
  assert.equal(api.pedidos.length, 2, 'la carga y una sola renovación');
});

test('2 · una ruta vencida: la renovada se muestra', async () => {
  const { cargador } = nuevo();
  cargador.mostrar('token', 'medio-1', true, sinPerdida);
  await esperar();
  cargador.alFallarLaDescarga();
  await esperar();
  assert.equal(cargador.estado().tipo, 'lista');
  assert.equal(cargador.estado().renovada, true);
});

test('2 · si la API no da acceso, el respaldo directamente, sin renovar', async () => {
  const { cargador, api } = nuevo();
  api.negar.add('medio-suprimido');
  cargador.mostrar('token', 'medio-suprimido', true, sinPerdida);
  await esperar();
  assert.deepEqual(cargador.estado(), { tipo: 'fallo' });
  cargador.alFallarLaDescarga();
  await esperar();
  assert.equal(api.pedidos.length, 1);
});

test('3 · si cambia el ejercicio mientras se renueva el acceso, la respuesta tardía no hace reaparecer la imagen anterior', async () => {
  const { cargador, api } = nuevo();
  cargador.mostrar('token', 'medio-a', true, sinPerdida);
  await esperar();
  // La descarga de A falla y la renovación de A queda frenada.
  let soltar;
  api.frenos.push(new Promise((r) => (soltar = r)));
  cargador.alFallarLaDescarga();
  // Mientras tanto, la persona pasa a otro ejercicio: se muestra B.
  cargador.mostrar('token', 'medio-b', true, sinPerdida);
  await esperar();
  assert.match(cargador.estado().url, /medio-b/);
  // Llega tarde la renovación de A: se descarta.
  soltar();
  await esperar();
  await esperar();
  assert.match(cargador.estado().url, /medio-b/, 'la imagen de A no reaparece');
  assert.equal(cargador.estado().renovada, false);
});

test('3 · si cambia la cuenta mientras se pide el acceso, o la imagen deja de mostrarse, lo que llega tarde se descarta', async () => {
  const { cargador, api } = nuevo();
  let soltar;
  api.frenos.push(new Promise((r) => (soltar = r)));
  cargador.mostrar('token-de-a', 'medio-1', true, sinPerdida);
  cargador.mostrar('token-de-b', null, true, sinPerdida);
  soltar();
  await esperar();
  await esperar();
  assert.deepEqual(cargador.estado(), { tipo: 'sin-imagen' }, 'la otra cuenta no ve la imagen de la anterior');

  const otro = nuevo();
  let soltarOtro;
  otro.api.frenos.push(new Promise((r) => (soltarOtro = r)));
  otro.cargador.mostrar('token', 'medio-1', true, sinPerdida);
  otro.cargador.soltar();
  soltarOtro();
  await esperar();
  await esperar();
  assert.deepEqual(otro.cargador.estado(), { tipo: 'cargando' }, 'después de soltar, no se aplica nada');
});

test('4 · el acceso se recuerda mientras vale, y dos imágenes del mismo medio comparten el pedido', async () => {
  const { acceso, api, ahora } = nuevo();
  const [x, y] = await Promise.all([acceso.url('token', 'medio-1', false, sinPerdida), acceso.url('token', 'medio-1', false, sinPerdida)]);
  assert.equal(x, y);
  assert.equal(api.pedidos.length, 1);
  await acceso.url('token', 'medio-1', false, sinPerdida);
  assert.equal(api.pedidos.length, 1, 'mientras vale, no se pide otro');
  // Cerca del vencimiento (dentro del margen), se pide otro.
  ahora.ms = AHORA + 15 * 60_000 - MARGEN_DEL_ACCESO_MS + 1;
  await acceso.url('token', 'medio-1', false, sinPerdida);
  assert.equal(api.pedidos.length, 2);
});
