/**
 * ED-63 · El RIR de «Analizar» dice de dónde sale (WP-EDITORES-PROFESIONAL; TEST-EDP-050).
 *
 * La APK completa el RIR vacío con el del plan al tildar la serie (`serieAlTildar`), así que el RIR registrado no siempre
 * lo escribió la persona. Hasta la procedencia por campo (ED-70), la métrica no puede decir «declaró la persona».
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { definicionDeMetrica, VERSION_DE_LOS_TEXTOS_DEL_DICCIONARIO, VERSION_DEL_DICCIONARIO } from './metricas-del-analisis';

test('TEST-EDP-050 · la métrica del RIR se llama «RIR registrado en la serie» y dice que puede venir del plan', () => {
  const rir = definicionDeMetrica('entrenamiento.rir');
  assert.ok(rir, 'la métrica existe');
  assert.equal(rir.nombre, 'RIR registrado en la serie');
  assert.match(
    rir.explicacion,
    /Lo escribió la persona o, si dejó el campo vacío, quedó el del plan\. Hasta que la app guarde quién escribió cada dato, no se distinguen\.$/,
  );
  assert.ok(rir.limites.includes('Un RIR igual al del plan puede ser el que escribió la persona o el que quedó del plan.'));
  // Ningún texto de la métrica dice que la persona lo declaró.
  for (const texto of [rir.nombre, rir.nombreCorto, rir.explicacion, rir.comoSeCalcula, rir.ausencias, ...rir.limites]) {
    assert.doesNotMatch(texto, /declar/i, texto);
  }
});

test('TEST-EDP-050 · sube la versión de los textos; la de las derivaciones, que devuelve API-PRJ-01, no cambia (EDT-01)', () => {
  assert.equal(VERSION_DE_LOS_TEXTOS_DEL_DICCIONARIO, 'BE-METRICAS-TEXTOS-2026-11-v2');
  assert.equal(VERSION_DEL_DICCIONARIO, 'BE-METRICAS-2026-10-v1');
});
