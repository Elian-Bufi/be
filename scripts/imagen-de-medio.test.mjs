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
 *  5. Imágenes livianas (DL-191, en la app con DL-194, A32-05): la variante que le alcanza a cada marco, en la clave del
 *     acceso; si la API no la conoce, la de siempre; y la foto de una comida achicada una vez, al elegirla.
 *
 * **Lo que esto no prueba:** el dibujo de React Native ni el `onError` real de una descarga en Android. La descarga
 * fallida con una serie registrada encima se prueba en el recorrido de la APK renderizada contra la API real.
 * Uso: node --test scripts/imagen-de-medio.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

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

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
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

// ─── 5. Imágenes livianas (DL-191, en la app con DL-194, A32-05) ──────────────────────────────────────────────────

const { varianteParaElMarco, rechazaLaVariante, LADO_DE_LA_MINIATURA } = await import('../apps/mobile/src/cargador-de-imagen.ts');
const { fotoParaSubir, medidasParaSubir, LADO_AL_ACHICAR, CALIDAD_AL_ACHICAR } = await import('../apps/mobile/src/achicar-la-foto.ts');

/** API-MED-03 de DL-191: anota la variante pedida. Con `sinVariantes`, como una API de antes: un 400 si llega `variant`. */
function apiConVariantes({ sinVariantes = false } = {}) {
  const a = {
    pedidos: [],
    async acceder(token, mediaId, variante) {
      a.pedidos.push(variante ?? 'sin-variante');
      if (variante && sinVariantes) return { ok: false, tipo: 'API', status: 400, codigo: 'INVALID_REQUEST', issues: [{ code: 'UNKNOWN_QUERY_PARAMETER', path: 'variant' }] };
      return { ok: true, datos: { data: { mediaId, path: `/media/content/${mediaId}-${variante ?? 'guardada'}`, expiresAt: new Date(AHORA + 15 * 60_000).toISOString() } } };
    },
  };
  return a;
}

test('5 · TEST-A32-010 · cada marco pide la medida que le alcanza: la miniatura chica, la grande a todo el ancho', () => {
  assert.equal(LADO_DE_LA_MINIATURA, 400);
  assert.equal(varianteParaElMarco(72, 2.625), 'thumbnail', 'la miniatura de 72 dp');
  assert.equal(varianteParaElMarco(150, 3), 'thumbnail', 'la imagen al lado de lo registrado (450 px)');
  assert.equal(varianteParaElMarco(340, 2.625), 'large', 'la foto a todo el ancho: con la miniatura se vería borrosa');
  assert.equal(varianteParaElMarco(500, 1), 'thumbnail', 'en una tableta de densidad 1, 500 px todavía es la miniatura');
  assert.equal(varianteParaElMarco(501, 1), 'large');
  assert.equal(varianteParaElMarco(Number.NaN, 2), 'large', 'sin medida, la grande: nunca una imagen borrosa');
  assert.equal(varianteParaElMarco(100, Number.NaN), 'thumbnail', 'sin densidad, 1');
});

test('5 · TEST-A32-011 · la variante va en la clave del acceso: la miniatura y la grande son dos accesos', async () => {
  const api = apiConVariantes();
  const acceso = crearAccesoAMedios({ acceder: (t, m, v) => api.acceder(t, m, v), urlDe: (r) => `https://api.prueba${r}`, ahoraMs: () => AHORA });
  assert.equal(await acceso.url('token', 'receta-1', false, sinPerdida, 'thumbnail'), 'https://api.prueba/media/content/receta-1-thumbnail');
  assert.equal(await acceso.url('token', 'receta-1', false, sinPerdida, 'large'), 'https://api.prueba/media/content/receta-1-large');
  assert.equal(await acceso.url('token', 'receta-1', false, sinPerdida, 'thumbnail'), 'https://api.prueba/media/content/receta-1-thumbnail', 'recordada');
  assert.equal(await acceso.url('token', 'receta-1', false, sinPerdida), 'https://api.prueba/media/content/receta-1-guardada');
  assert.deepEqual(api.pedidos, ['thumbnail', 'large', 'sin-variante']);
  // El cargador lleva la variante a la carga y a la renovación.
  const cargador = crearCargadorDeImagen(acceso, () => undefined);
  cargador.mostrar('token', 'receta-2', true, sinPerdida, 'large');
  await esperar();
  assert.equal(cargador.estado().url, 'https://api.prueba/media/content/receta-2-large');
  cargador.alFallarLaDescarga();
  await esperar();
  assert.deepEqual(api.pedidos.slice(-2), ['large', 'large'], 'la renovación pide la misma medida');
});

test('5 · TEST-A32-012 · tolerante: si la API no conoce la variante, se pide como siempre, y no se vuelve a probar', async () => {
  const api = apiConVariantes({ sinVariantes: true });
  const acceso = crearAccesoAMedios({ acceder: (t, m, v) => api.acceder(t, m, v), urlDe: (r) => `https://api.prueba${r}`, ahoraMs: () => AHORA });
  assert.equal(await acceso.url('token', 'receta-1', false, sinPerdida, 'thumbnail'), 'https://api.prueba/media/content/receta-1-guardada');
  assert.deepEqual(api.pedidos, ['thumbnail', 'sin-variante'], 'un 400 por el parámetro: la de siempre');
  assert.equal(await acceso.url('token', 'receta-2', false, sinPerdida, 'large'), 'https://api.prueba/media/content/receta-2-guardada');
  assert.deepEqual(api.pedidos, ['thumbnail', 'sin-variante', 'sin-variante'], 'en el proceso, ya no se manda la variante');
  // Solo un 400 dice que no conoce la variante: un 404 es que no hay medio, y una red caída no dice nada.
  assert.equal(rechazaLaVariante({ ok: false, tipo: 'API', status: 400, codigo: 'INVALID_REQUEST', issues: [] }), true);
  assert.equal(rechazaLaVariante({ ok: false, tipo: 'API', status: 404, codigo: 'RESOURCE_NOT_FOUND', issues: [] }), false);
  assert.equal(rechazaLaVariante({ ok: false, tipo: 'RED' }), false);
});

test('5 · TEST-A32-013 · la pantalla: las imágenes de Nutrición son livianas, la de un ejercicio no, y la liviana espera a medir', () => {
  const IMAGEN = readFileSync(resolve(RAIZ, 'apps/mobile/src/imagen-de-medio.tsx'), 'utf8');
  assert.match(IMAGEN, /const listaParaPedir = cargar && \(!liviana \|\| ladoMayor !== null\);/);
  assert.match(IMAGEN, /varianteParaElMarco\(ladoMayor, PixelRatio\.get\(\)\)/);
  assert.match(IMAGEN, /cargador\.mostrar\(token, mediaId, listaParaPedir, sesionPerdida, variante\);/);
  for (const archivo of ['nutricion-hoy.tsx', 'nutricion.tsx', 'opcion-de-comida.tsx']) {
    const fuente = readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas', archivo), 'utf8');
    const imagenes = fuente.match(/<ImagenDeMedio\b[\s\S]*?\/>/g) ?? [];
    assert.ok(imagenes.length > 0, archivo);
    for (const i of imagenes) assert.match(i, /\bliviana\b/, `${archivo}: ${i.slice(0, 80)}`);
  }
  for (const archivo of ['sesion-enfocada.tsx', 'plan-por-serie.tsx', 'correccion-de-entrenamiento.tsx']) {
    const fuente = readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas', archivo), 'utf8');
    for (const i of fuente.match(/<ImagenDeMedio\b[\s\S]*?\/>/g) ?? []) assert.doesNotMatch(i, /\bliviana\b/, 'la ilustración de un ejercicio no tiene variantes');
  }
});

test('5 · TEST-A32-014 · la foto de una comida se achica una vez, al elegirla, a 1600 px en JPEG; si no se puede, la original', async () => {
  assert.equal(LADO_AL_ACHICAR, 1600);
  assert.equal(CALIDAD_AL_ACHICAR, 0.85);
  assert.deepEqual(medidasParaSubir(4000, 3000), { ancho: 1600, alto: 1200, achicar: true });
  assert.deepEqual(medidasParaSubir(3000, 4000), { ancho: 1200, alto: 1600, achicar: true }, 'vertical');
  assert.deepEqual(medidasParaSubir(1600, 900), { ancho: 1600, alto: 900, achicar: false }, 'sin agrandar');
  assert.deepEqual(medidasParaSubir(9000, 1), { ancho: 1600, alto: 1, achicar: true }, 'nunca 0 px');
  assert.throws(() => medidasParaSubir(0, 10), RangeError);
  // Si el dominio ya trae `medidasAlAchicar` (DL-191), la regla es la misma.
  const dominio = await import('@be/domain');
  if (typeof dominio.medidasAlAchicar === 'function') {
    for (const [a, b] of [[4000, 3000], [3000, 4000], [1600, 900], [9000, 1], [1601, 1601]]) assert.deepEqual(medidasParaSubir(a, b), dominio.medidasAlAchicar(a, b), `${a} × ${b}`);
    assert.equal(LADO_AL_ACHICAR, dominio.LIMITES_DE_MEDIO.ladoAlAchicarEnElCliente);
    assert.equal(CALIDAD_AL_ACHICAR, dominio.LIMITES_DE_MEDIO.calidadAlAchicarEnElCliente);
  }
  const llamadas = [];
  const achicar = async (uri, medidas, calidad) => {
    llamadas.push({ uri, ...medidas, calidad });
    return { uri: 'file:///cache/achicada.jpg', width: medidas.ancho, height: medidas.alto };
  };
  const grande = { uri: 'file:///dcim/foto.heic', mimeType: 'image/heic', fileName: 'foto.heic', fileSize: 4_000_000, width: 4032, height: 3024 };
  assert.deepEqual(await fotoParaSubir(grande, achicar), { uri: 'file:///cache/achicada.jpg', mimeType: 'image/jpeg', fileName: null, fileSize: null, width: 1600, height: 1200 });
  assert.deepEqual(llamadas, [{ uri: 'file:///dcim/foto.heic', ancho: 1600, alto: 1200, calidad: 0.85 }]);
  const chica = { uri: 'file:///dcim/chica.jpg', mimeType: 'image/jpeg', width: 1200, height: 900 };
  assert.equal(await fotoParaSubir(chica, achicar), chica, 'una foto chica no se toca');
  const sinMedidas = { uri: 'file:///dcim/x.jpg' };
  assert.equal(await fotoParaSubir(sinMedidas, achicar), sinMedidas, 'sin medidas, la original');
  const falla = async () => {
    throw new Error('sin memoria');
  };
  assert.equal(await fotoParaSubir(grande, falla), grande, 'si el teléfono no la pudo achicar, la original');
  assert.equal(await fotoParaSubir(grande, async () => ({ uri: '', width: 0, height: 0 })), grande, 'un resultado sin medidas, la original');
  assert.equal(llamadas.length, 1, 'una sola vez');
  // En la pantalla, se achica al elegirla, antes de validar y de guardarla en el borrador: el reintento sube la misma.
  const DIFERENTE = readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas/comida-diferente.tsx'), 'utf8');
  const usar = DIFERENTE.slice(DIFERENTE.indexOf('const usarImagen = async'), DIFERENTE.indexOf('// Si Android cerró la app con la cámara abierta, lo escrito'));
  assert.ok(usar.indexOf('fotoParaSubir(original, achicarEnElTelefono)') >= 0 && usar.indexOf('fotoParaSubir(original, achicarEnElTelefono)') < usar.indexOf('fotoDesdeElSelector(imagen)'));
  assert.match(DIFERENTE, /ImageManipulator\.manipulate\(uri\)\.resize\(\{ width: medidas\.ancho, height: medidas\.alto \}\)/);
  assert.match(DIFERENTE, /saveAsync\(\{ compress: calidad, format: SaveFormat\.JPEG \}\)/);
  assert.match(readFileSync(resolve(RAIZ, 'apps/mobile/package.json'), 'utf8'), /"expo-image-manipulator": "57\.0\.\d+"/);
});
