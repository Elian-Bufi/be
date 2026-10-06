/**
 * El retorno después del login del website (`apps/web/src/lib/copy.ts`, 10-B01:1146-1189): solo rutas propias conocidas,
 * y como único parámetro el identificador de la ruta con forma de UUID. «Mis recetas» (DL-119) vuelve a la receta abierta
 * con `?receta=`: recargar la página exige volver a entrar (DL-012), y la persona tiene que volver a la misma receta.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const { destinoSeguro } = await import('../apps/web/src/lib/copy.ts');

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
});

test('cualquier otra cosa vuelve a Cuenta', () => {
  for (const valor of [
    `/pro/recipes?id=${UUID}`,
    `/pro/recipes?receta=${UUID}&nueva=1`,
    '/pro/recipes?receta=no-es-un-uuid',
    '/pro/recipes?nueva=1',
    `/pro/advisees/nutrition?receta=${UUID}`,
    `/pro/advisees/nutrition?id=${UUID}&vista=plan`,
    `//otro.example/pro?id=${UUID}`,
    'https://otro.example/account',
    `/pro/recipes/../account?receta=${UUID}`,
    '/desconocida',
  ]) {
    assert.equal(destinoSeguro(valor), '/account', valor);
  }
});
