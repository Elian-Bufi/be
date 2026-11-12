import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CODIGO_INTERNO, DESCRIPCIONES_DE_PLANTILLAS, descripcionDeLaPlantilla, tieneCodigosInternos } from './descripciones-de-plantillas';
import { PLANTILLAS_DE_INICIO, PLANTILLAS_VIGENTES_DE_INICIO } from './plantillas-de-inicio';
import { terminosProhibidosEn, terminosProhibidosDeFormulariosEn } from './index';

// ── ED-05 · Textos sin códigos internos (WP-EDITORES-PROFESIONAL; TEST-EDP-006) ───────────────────────────────────

test('TEST-EDP-006 · cada plantilla de inicio tiene su descripción para el profesional, sin códigos internos', () => {
  for (const p of PLANTILLAS_VIGENTES_DE_INICIO) {
    const d = descripcionDeLaPlantilla(p.clave, p.proposito);
    assert.ok(d && d.length > 40, p.clave);
    assert.equal(tieneCodigosInternos(d), false, d);
    assert.deepEqual(terminosProhibidosEn(d), [], d);
    assert.deepEqual(terminosProhibidosDeFormulariosEn(d), [], d);
    assert.doesNotMatch(d, /asesorad/i, d);
  }
  assert.deepEqual(Object.keys(DESCRIPCIONES_DE_PLANTILLAS).sort(), [...new Set(PLANTILLAS_DE_INICIO.map((p) => p.clave))].sort());
});

test('TEST-EDP-006 · el propósito guardado con notas del equipo nunca va a la vista, y no cambia', () => {
  // Los propósitos guardados de las versiones vigentes tienen notas («Sucede a la v2 (DL-165, ronda 2.1)…»): son
  // inmutables, y por eso la pantalla muestra la descripción de la tabla.
  assert.ok(PLANTILLAS_DE_INICIO.some((p) => tieneCodigosInternos(p.proposito)), 'hay propósitos guardados con notas del equipo');
  // Una plantilla que no está en la tabla muestra su propósito solo si no tiene códigos; si los tiene, nada.
  assert.equal(descripcionDeLaPlantilla('OTRA', 'Lo que la persona cuenta de su semana.'), 'Lo que la persona cuenta de su semana.');
  assert.equal(descripcionDeLaPlantilla('OTRA', 'Sucede a la v2 (DL-165, ronda 2.1).'), null);
  assert.equal(descripcionDeLaPlantilla('OTRA', null), null);
  // Lo que se reconoce como código interno.
  for (const t of ['(DL-1)', 'TB-47', 'RF-071', 'UC-P32', 'API-FRM-01', 'REG-06-210', 'INV-06-133', 'la ronda 2']) assert.match(t, CODIGO_INTERNO, t);
  for (const t of ['Dato 1: falta el valor.', 'Cómo comés hoy', 'Los hábitos se piden aparte']) assert.doesNotMatch(t, CODIGO_INTERNO, t);
});
