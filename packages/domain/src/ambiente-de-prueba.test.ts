/**
 * UF-08 de WP-USO-FINAL (DL-169): cuándo se muestran los avisos de prueba. En `test` y en desarrollo aparecen (08 §33),
 * en producción nunca, y el interruptor `BE_AVISOS_DE_PRUEBA=no` los apaga fuera de producción. Que ninguna pantalla los
 * escriba por su cuenta lo revisa `scripts/avisos-de-prueba.test.mjs`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AVISOS_DE_PRUEBA, AVISOS_DE_PRUEBA_APAGADOS, DESCARGAR_LA_APP, muestraLosAvisosDePrueba, ofreceElCatalogoDeDemostracion, PROCEDENCIA_DE_DEMOSTRACION } from './ambiente-de-prueba';
import { COPY_ACCESO_GOOGLE } from './copy-acceso-google';

test('TEST-UF-012 · en producción no se muestran nunca, tampoco con el interruptor en otra cosa', () => {
  for (const interruptor of [undefined, null, '', 'si', 'sí', 'no']) assert.equal(muestraLosAvisosDePrueba('production', interruptor), false, String(interruptor));
  assert.equal(muestraLosAvisosDePrueba(' Production '), false, 'sin distinguir mayúsculas ni espacios');
});

test('TEST-UF-012 · en test y en desarrollo se muestran, salvo con el interruptor apagado', () => {
  for (const ambiente of ['test', 'development']) {
    assert.equal(muestraLosAvisosDePrueba(ambiente), true, ambiente);
    assert.equal(muestraLosAvisosDePrueba(ambiente, 'si'), true, ambiente);
    assert.equal(muestraLosAvisosDePrueba(ambiente, AVISOS_DE_PRUEBA_APAGADOS), false, ambiente);
    assert.equal(muestraLosAvisosDePrueba(ambiente, ' NO '), false, ambiente);
  }
  assert.equal(AVISOS_DE_PRUEBA_APAGADOS, 'no');
});

test('TEST-UF-012 · un ambiente que no se reconoce o que falta los muestra: mejor uno de más en producción que uno de menos en test', () => {
  for (const ambiente of [undefined, null, '', 'staging', 'prod']) assert.equal(muestraLosAvisosDePrueba(ambiente), true, String(ambiente));
});

test('TEST-UF-012 · los textos de prueba viven acá, y el de Google es el mismo que usa el acceso con Google', () => {
  for (const texto of Object.values(AVISOS_DE_PRUEBA)) assert.match(texto, /de prueba/i);
  assert.equal(COPY_ACCESO_GOOGLE.avisoDePrueba, AVISOS_DE_PRUEBA.google);
  assert.doesNotMatch(DESCARGAR_LA_APP, /prueba/i);
});

test('TEST-UF-013 · el catálogo de demostración solo se ofrece en test y en desarrollo; en producción, nunca', () => {
  for (const ambiente of ['test', 'development', ' Test ']) assert.equal(ofreceElCatalogoDeDemostracion(ambiente), true, ambiente);
  assert.equal(ofreceElCatalogoDeDemostracion('production'), false);
  assert.equal(ofreceElCatalogoDeDemostracion(' PRODUCTION '), false, 'sin distinguir mayúsculas ni espacios');
});

test('TEST-UF-013 · un ambiente que no se reconoce o que falta no lo ofrece: un ejemplo de menos, nunca un valor inventado en una base real', () => {
  for (const ambiente of [undefined, null, '', 'staging', 'prod', 'produccion']) assert.equal(ofreceElCatalogoDeDemostracion(ambiente), false, String(ambiente));
  assert.equal(PROCEDENCIA_DE_DEMOSTRACION, 'BE_SYNTHETIC_SEED');
});
