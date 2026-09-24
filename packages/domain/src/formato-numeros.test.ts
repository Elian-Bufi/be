/** DL-091 punto 4 · los números se muestran como los lee una persona en español rioplatense, en las dos superficies. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { cantidad, esMilesConPunto, leerNumero, motivoDeNumeroIlegible, numero, numeroConPrecision } from './formato-numeros';

test('coma decimal y punto de miles, sin ceros de relleno', () => {
  assert.equal(numero(72.5), '72,5');
  assert.equal(numero(72), '72');
  assert.equal(numero(1850), '1.850');
  assert.equal(numero(-3.25), '−3,25');
  assert.equal(numero(Number.NaN), '—');
});

test('REG-06-158 · mostrar no redondea en silencio: sin máximo, se ven todos los decimales del dato', () => {
  assert.equal(numero(23.673), '23,673');
  assert.equal(numero(1.755), '1,755');
  assert.equal(numero(0.125), '0,125');
  assert.equal(numero(1234567.891), '1.234.567,891');
  assert.equal(numero(0.1 + 0.2), '0,3', 'el ruido binario de un double no se muestra');
});

test('con un máximo explícito, a lo sumo esos decimales: para conteos y lecturas deliberadamente resumidas', () => {
  assert.equal(numero(0.05, 1), '0,1');
  assert.equal(numero(12, 0), '12');
  assert.equal(numero(1234567.891, 2), '1.234.567,89');
});

test('REG-06-158 · un cálculo se muestra con la precisión que declara el método, aunque termine en cero', () => {
  assert.equal(numeroConPrecision(23.67, 3), '23,670');
  assert.equal(numeroConPrecision(23.6734, 3), '23,673');
  assert.equal(numeroConPrecision(1850, 1), '1.850,0');
  assert.equal(numeroConPrecision(-0.0001, 2), '0,00', 'un cero redondeado no lleva signo');
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
  assert.equal(leerNumero('0.125'), 0.125);
  assert.equal(leerNumero('1850'), 1850);
  assert.equal(leerNumero(''), null);
  assert.equal(leerNumero('abc'), null);
  assert.equal(leerNumero('1.234,5'), null, 'sin separador de miles al escribir: una sola convención de entrada');
  assert.equal(leerNumero('72,'), null);
});

test('lo ambiguo no es un número: «1.850» se lee 1.850 en pantalla y sería 1,85 si el punto fuera decimal', () => {
  for (const ambiguo of ['1.850', '12.500', '123.456', '1.000.000', '-1.000']) {
    assert.equal(leerNumero(ambiguo), null, ambiguo);
    assert.equal(esMilesConPunto(ambiguo), true, ambiguo);
  }
  for (const claro of ['1.5', '1.85', '0.125', '1850', '1,850', '1234.5']) assert.equal(esMilesConPunto(claro), false, claro);
  assert.equal(leerNumero('1,850'), 1.85, 'con coma no hay ambigüedad: es decimal');
  assert.match(motivoDeNumeroIlegible('1.850'), /sin punto de miles/);
  assert.match(motivoDeNumeroIlegible('abc'), /Escribí un número/);
});
