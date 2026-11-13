/**
 * ED-76 · Del % RM a los kilos (DL-171; WP-EDITORES-PROFESIONAL §5.8): los oráculos RM-38 a RM-40. Cada negativa se
 * probó en rojo con una mutación de la cuenta (redondear al más cercano por defecto, convertir lb a kg, escribir el
 * valor en la referencia).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PASOS_DEL_REDONDEO, cargaDesdeLaEstimacion, referenciaDeLaEstimacion } from './carga-desde-la-estimacion';
import { terminosProhibidosDeFuerzaEn } from './estimacion-de-fuerza';

/** 70 kg × 12 con RIR 0: 70 × (1 + 12/30) = 98,0 kg (RM-02). */
const press = { carga: 70, repeticiones: 12, rir: 0, unidad: 'kg' as const };

test('RM-38 · 75 % RM de 98,0 kg con paso de 2,5 kg: 73,5 → 72,5 kg, hacia abajo y a la vista', () => {
  const c = cargaDesdeLaEstimacion(press, 75);
  assert.ok(c);
  assert.equal(c.sugerida, 72.5);
  assert.equal(c.unidad, 'kg');
  assert.equal(c.cuenta, '75 % RM de 98,0 kg = 73,5 kg → 72,5 kg');
  assert.equal(c.redondeo, 'Múltiplo de 2,5, hacia abajo: nunca más que el % RM pedido.');
  // Mutación: al más cercano de entrada daría 72,5 también; con 76 % (74,48) se ve la diferencia.
  assert.equal(cargaDesdeLaEstimacion(press, 76)!.sugerida, 72.5);
  assert.equal(cargaDesdeLaEstimacion(press, 76, 2.5, 'CERCANO')!.sugerida, 75);
});

test('RM-38 · el paso y el sentido elegidos, y el margen del binario', () => {
  assert.equal(cargaDesdeLaEstimacion(press, 75, 1)!.sugerida, 73);
  assert.equal(cargaDesdeLaEstimacion(press, 75, 0.5)!.sugerida, 73.5);
  // 100 kg × 1 con RIR 0 es 100; el 29 % es 28,999… en binario: son 29, no 28.
  assert.equal(cargaDesdeLaEstimacion({ carga: 100, repeticiones: 1, rir: 0, unidad: 'kg' }, 29, 1)!.sugerida, 29);
  // Un paso que no es de la unidad no se usa: 5 es de lb.
  assert.equal(cargaDesdeLaEstimacion(press, 75, 5), null);
});

test('RM-39 · 75 % RM de 220 lb con paso de 5 lb: 165 lb, nunca se pasa a kg', () => {
  // Una estimación de 220 lb exactos: 220 lb × 1 con RIR 0 (con una sola repetición equivalente, es la carga).
  const c = cargaDesdeLaEstimacion({ carga: 220, repeticiones: 1, rir: 0, unidad: 'lb' }, 75, 5);
  assert.ok(c);
  assert.equal(c.sugerida, 165);
  assert.equal(c.unidad, 'lb');
  assert.match(c.cuenta, /lb → 165 lb$/);
  assert.doesNotMatch(c.cuenta, /kg/);
  assert.deepEqual(PASOS_DEL_REDONDEO.lb, [5, 2.5]);
});

test('ED-76 · un % sin sentido no da carga: el cuadro no escribe nada', () => {
  for (const p of [0, -5, 101, Number.NaN]) assert.equal(cargaDesdeLaEstimacion(press, p), null, String(p));
  // Tan poco que, hacia abajo, no llega a un paso.
  assert.equal(cargaDesdeLaEstimacion(press, 1), null);
});

test('RM-40 · la referencia lleva el método y la fecha, nunca el valor', () => {
  const r = referenciaDeLaEstimacion('2026-11-11');
  assert.equal(r, '1RM estimado · Epley v1 · 11/11/2026');
  assert.doesNotMatch(r, /98|kg|lb/);
  assert.deepEqual(terminosProhibidosDeFuerzaEn(r), []);
});

test('ED-76 (revisión del 13/11) · hacia abajo, el bruto a la vista va truncado: la cuenta no muestra un múltiplo que después «baja»', () => {
  // 80 × 8 con RIR 2: 80 × (1 + 10/30) = 106,7 kg (el ejemplo de ED-73). El 82 % es 87,47: redondeado se leía 87,5 → 85.
  const c = cargaDesdeLaEstimacion({ carga: 80, repeticiones: 8, rir: 2, unidad: 'kg' }, 82);
  assert.ok(c);
  assert.equal(c.sugerida, 85);
  assert.equal(c.cuenta, '82 % RM de 106,7 kg = 87,4 kg → 85 kg');
  // Los otros dos casos de la revisión: 70 × 12 con RIR 0 al 51 % (49,98) y 85 × 5 con RIR 1 al 98 % (99,96).
  assert.equal(cargaDesdeLaEstimacion(press, 51)!.cuenta, '51 % RM de 98,0 kg = 49,9 kg → 47,5 kg');
  assert.equal(cargaDesdeLaEstimacion({ carga: 85, repeticiones: 5, rir: 1, unidad: 'kg' }, 98)!.cuenta, '98 % RM de 102,0 kg = 99,9 kg → 97,5 kg');
  // Un bruto exacto no cambia (RM-38), y al más cercano se sigue redondeando.
  assert.equal(cargaDesdeLaEstimacion(press, 75)!.cuenta, '75 % RM de 98,0 kg = 73,5 kg → 72,5 kg');
  assert.equal(cargaDesdeLaEstimacion({ carga: 80, repeticiones: 8, rir: 2, unidad: 'kg' }, 82, 2.5, 'CERCANO')!.cuenta, '82 % RM de 106,7 kg = 87,5 kg → 87,5 kg');
});
