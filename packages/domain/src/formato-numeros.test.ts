/** DL-091 punto 4 · los números se muestran como los lee una persona en español rioplatense, en las dos superficies. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { cantidad, leerNumero, numero } from './formato-numeros';

test('coma decimal y punto de miles, sin ceros de relleno', () => {
  assert.equal(numero(72.5), '72,5');
  assert.equal(numero(72), '72');
  assert.equal(numero(1850), '1.850');
  assert.equal(numero(1234567.891), '1.234.567,89');
  assert.equal(numero(0.05, 1), '0,1');
  assert.equal(numero(-3.25), '−3,25');
  assert.equal(numero(Number.NaN), '—');
});

test('la unidad va como la escribió el contrato', () => {
  assert.equal(cantidad(72.5, 'kg'), '72,5 kg');
  assert.equal(cantidad(1850, 'kcal'), '1.850 kcal');
  assert.equal(cantidad(174.25, 'cm', 1), '174,3 cm');
});

test('lo que escribe la persona: coma o punto valen igual; lo que no es número es null, nunca NaN', () => {
  assert.equal(leerNumero('72,5'), 72.5);
  assert.equal(leerNumero('72.5'), 72.5);
  assert.equal(leerNumero(' 1 850 '), 1850);
  assert.equal(leerNumero('-3,25'), -3.25);
  assert.equal(leerNumero(''), null);
  assert.equal(leerNumero('abc'), null);
  assert.equal(leerNumero('1.234,5'), null, 'sin separador de miles al escribir: una sola convención de entrada');
  assert.equal(leerNumero('72,'), null);
});
