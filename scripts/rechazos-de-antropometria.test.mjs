/**
 * Lo que dice Antropometría cuando la API rechaza una escritura por un motivo que se puede explicar
 * (`apps/web/src/app/pro/advisees/anthropometry/rechazos-de-antropometria.ts`; WP-ESCRITORIO-AREAS, parte 9). Se verifica
 * que cada rechazo conocido dice su motivo, que la fecha futura va a su campo, que lo desconocido y las fallas de red
 * siguen al mensaje general, y que ningún texto deja ver un código ni hace pensar que BE está caído.
 *
 * Uso: node --test scripts/rechazos-de-antropometria.test.mjs
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

const r = await import('../apps/web/src/app/pro/advisees/anthropometry/rechazos-de-antropometria.ts');
const rechazo = (codigo, issues = []) => ({ ok: false, tipo: 'API', status: 422, codigo, issues });

test('una fecha futura se dice como tal y va a «Cuándo se tomó»', () => {
  assert.deepEqual(r.motivoDelRechazo(rechazo('ANTHROPOMETRY_EVALUATION_INVALID', [{ code: 'OCCURRED_AT_IN_FUTURE', path: 'occurredAt' }])), { texto: 'La fecha de la toma no puede ser futura.', campo: 'momento' });
  // El otro motivo del mismo código: registrar una toma vacía.
  assert.deepEqual(r.motivoDelRechazo(rechazo('ANTHROPOMETRY_EVALUATION_INVALID')), { texto: 'Una toma sin mediciones no se puede registrar.', campo: null });
});

test('cada rechazo conocido dice su motivo, sin campo', () => {
  for (const codigo of Object.keys(r.TEXTO_DEL_RECHAZO)) {
    const m = r.motivoDelRechazo(rechazo(codigo));
    assert.equal(m?.texto, r.TEXTO_DEL_RECHAZO[codigo], codigo);
    assert.equal(m?.campo, null, codigo);
  }
  assert.match(r.motivoDelRechazo(rechazo('CORRECTION_NOT_ALLOWED')).texto, /anulada/);
  assert.match(r.motivoDelRechazo(rechazo('CALCULATION_INPUTS_INSUFFICIENT')).texto, /No se calculó nada/);
});

test('lo desconocido, el éxito y la falta de red no tienen motivo propio: dicen el mensaje general', () => {
  assert.equal(r.motivoDelRechazo(rechazo('ALGO_NUEVO')), null);
  assert.equal(r.motivoDelRechazo({ ok: false, tipo: 'RED' }), null);
  assert.equal(r.motivoDelRechazo({ ok: true, datos: {} }), null);
  assert.equal(r.motivoDelRechazo(null), null);
});

test('ningún texto deja ver un código ni dice que el servicio no está disponible', () => {
  for (const texto of [...Object.values(r.TEXTO_DEL_RECHAZO), r.FECHA_DE_TOMA_FUTURA]) {
    assert.doesNotMatch(texto, /[A-Z]{3,}_[A-Z_]+/, texto);
    assert.doesNotMatch(texto, /no está disponible/i, texto);
  }
});

test('una fecha es futura si pasa de este minuto: el minuto de ahora todavía vale', () => {
  const ahora = new Date(2026, 9, 15, 8, 55, 30);
  assert.equal(r.esFechaFutura('2026-10-15T08:55', ahora), false, 'este minuto');
  assert.equal(r.esFechaFutura('2026-10-15T08:54', ahora), false);
  assert.equal(r.esFechaFutura('2026-10-15T08:56', ahora), true, 'el minuto que viene');
  assert.equal(r.esFechaFutura('2026-10-16T08:00', ahora), true, 'mañana');
  assert.equal(r.esFechaFutura('', ahora), false, 'un campo vacío no es una fecha futura');
});
