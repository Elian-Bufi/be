/**
 * El retorno después del login del website (`apps/web/src/lib/copy.ts`, 10-B01:1146-1189): solo rutas propias conocidas,
 * con el identificador de la ruta con forma de UUID. «Mis recetas» (DL-119) vuelve a la receta abierta con `?receta=`.
 * Desde DL-147, cuando la sesión vence, también vuelve a la misma vista y al mismo período, y nada más.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const { destinoSeguro, inicioPropio, retornoDeLaPagina } = await import('../apps/web/src/lib/copy.ts');

test('DL-147: el retorno de la página conserva la ruta, el id, la vista y el período, y descarta lo demás', () => {
  const id = '0b6a7f52-3c1d-4e8f-9a2b-5c6d7e8f9a01';
  // Con la barra final del export estático y con parámetros que no se conservan (una métrica, la fecha elegida).
  assert.equal(retornoDeLaPagina('/pro/advisees/', `?id=${id}&vista=analizar&p=30&m=peso&f=2026-10-01`, '/pro'), `/pro/advisees?id=${id}&vista=analizar&p=30`);
  // Una vista que no se retoma (un pedido a medio armar) cae en el retorno que pidió la página.
  assert.equal(retornoDeLaPagina('/pro/advisees/forms/', `?id=${id}&vista=pedir`, `/pro/advisees/forms?id=${id}`), `/pro/advisees/forms?id=${id}`);
  // Una ruta sin forma conocida, también.
  assert.equal(retornoDeLaPagina('/pro/guia/', '', '/pro'), '/pro');
  assert.equal(retornoDeLaPagina('/account/', '', '/account'), '/account');
});

const UUID = '0b6a7f52-3c1d-4e8f-9a2b-5c6d7e8f9a01';

test('las rutas propias conocidas vuelven tal cual, también Plantillas y Mis recetas', () => {
  for (const ruta of ['/account', '/account/relationships', '/account/privacy', '/pro', '/pro/templates', '/pro/recipes', '/pro/exercises']) assert.equal(destinoSeguro(ruta), ruta);
  assert.equal(destinoSeguro(null), '/account');
});

test('una receta abierta vuelve con su identificador, y un asesorado con el suyo', () => {
  assert.equal(destinoSeguro(`/pro/recipes?receta=${UUID}`), `/pro/recipes?receta=${UUID}`);
  // La pestaña Entrenamiento de un asesorado (WP-ENTRENAMIENTO-SERIES): faltaba, y el login volvía a Cuenta.
  assert.equal(destinoSeguro(`/pro/advisees/training?id=${UUID}`), `/pro/advisees/training?id=${UUID}`);
  assert.equal(destinoSeguro(`/pro/advisees/nutrition?id=${UUID}`), `/pro/advisees/nutrition?id=${UUID}`);
  // Las otras dos pestañas de área. Información faltaba (WP-ESCRITORIO-AREAS, parte 4): quien iniciaba sesión desde ahí
  // volvía a Cuenta.
  assert.equal(destinoSeguro(`/pro/advisees/anthropometry?id=${UUID}`), `/pro/advisees/anthropometry?id=${UUID}`);
  assert.equal(destinoSeguro(`/pro/advisees/forms?id=${UUID}`), `/pro/advisees/forms?id=${UUID}`);
});

test('DL-147: vuelve a la misma vista y al mismo período, con valores de forma conocida', () => {
  assert.equal(destinoSeguro(`/pro/advisees/nutrition?id=${UUID}&vista=plan`), `/pro/advisees/nutrition?id=${UUID}&vista=plan`);
  assert.equal(destinoSeguro(`/pro/advisees?id=${UUID}&vista=analizar&p=90`), `/pro/advisees?id=${UUID}&vista=analizar&p=90`);
  assert.equal(destinoSeguro(`/pro/advisees?id=${UUID}&desde=2026-07-01&hasta=2026-10-19&vista=linea`), `/pro/advisees?id=${UUID}&vista=linea&desde=2026-07-01&hasta=2026-10-19`);
  assert.equal(destinoSeguro(`/pro/advisees/training?vista=ejecuciones&id=${UUID}`), `/pro/advisees/training?id=${UUID}&vista=ejecuciones`);
});

test('cualquier otra cosa vuelve a Cuenta', () => {
  for (const valor of [
    `/pro/recipes?id=${UUID}`,
    `/pro/recipes?receta=${UUID}&nueva=1`,
    '/pro/recipes?receta=no-es-un-uuid',
    '/pro/recipes?nueva=1',
    `/pro/advisees/nutrition?receta=${UUID}`,
    `/pro/advisees/nutrition?id=${UUID}&vista=lamina`,
    `/pro/advisees?id=${UUID}&vista=analizar&q=dolor`,
    `/pro/advisees?id=${UUID}&p=14`,
    `/pro/advisees?id=${UUID}&desde=2026-10-01`,
    `/pro/advisees?id=${UUID}&desde=1-10-2026&hasta=2026-10-19`,
    `/pro/advisees?id=${UUID}&id=${UUID}`,
    // Un pedido de información a medio armar no se retoma después de iniciar sesión: se vuelve a las solicitudes.
    `/pro/advisees/forms?id=${UUID}&vista=pedir`,
    `//otro.example/pro?id=${UUID}`,
    'https://otro.example/account',
    `/pro/recipes/../account?receta=${UUID}`,
    '/desconocida',
  ]) {
    assert.equal(destinoSeguro(valor), '/account', valor);
  }
});

test('sin un retorno pedido, el profesional entra a su espacio y el resto a Cuenta (DL-025, 2026-10-17)', () => {
  assert.equal(inicioPropio(['PROFESSIONAL_WORKSPACE']), '/pro');
  assert.equal(inicioPropio(['OTRA', 'PROFESSIONAL_WORKSPACE']), '/pro');
  assert.equal(inicioPropio([]), '/account');
  // Si la API no respondió, Cuenta: ahí se reintenta, y el enlace al espacio aparece cuando la API lo informa.
  assert.equal(inicioPropio(null), '/account');
});
