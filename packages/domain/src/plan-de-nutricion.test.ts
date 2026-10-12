/**
 * Nutrición · Plan (WP-ESCRITORIO-AREAS, parte 5): el número de una versión, el historial, el día tipo que se muestra,
 * cómo se cuentan las opciones de una comida y cómo se dice lo indicado de un ítem.
 *
 * Los resultados esperados se escriben a mano, a partir de la maqueta 16 y de las reglas que la pantalla ya cumplía (el
 * número de versión es el orden de activación; las opciones no son equivalencias; un hueco no es un cero). Si una prueba
 * falla, se corrige el cálculo, no el oráculo.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { terminosProhibidosEn } from './copy-nutricion';
import { COPY_DEL_PLAN, NINGUNA_COMIDA, comidasAbiertas, diaTipoElegido, historialDeVersiones, indicadoDelItem, numerosDeVersionDePlan, opcionesEnPalabras, pedidoDeComidas, tituloDeLaOpcion } from './plan-de-nutricion';

const version = (planId: string, activatedAt: string | null, isEffective = false) => ({ planId, activatedAt, isEffective });

// ─── Las versiones ──────────────────────────────────────────────────────────────────────────────

test('el número de una versión es su orden de activación, llegue la lista como llegue; un borrador no tiene número', () => {
  // La lista llega con la más nueva primero y el borrador adelante, como la entrega la API.
  const lista = [version('borrador', null), version('tercera', '2026-10-05T12:00:00.000Z', true), version('primera', '2026-08-17T12:00:00.000Z'), version('segunda', '2026-09-07T12:00:00.000Z')];
  const numeros = numerosDeVersionDePlan(lista);
  assert.deepEqual([numeros.get('primera'), numeros.get('segunda'), numeros.get('tercera')], [1, 2, 3]);
  assert.equal(numeros.has('borrador'), false);
  assert.equal(numerosDeVersionDePlan([]).size, 0);
});

test('el historial va de la versión más nueva a la más vieja, sin el borrador, y la vigente es la que dice la API', () => {
  const lista = [version('primera', '2026-08-17T12:00:00.000Z'), version('borrador', null), version('segunda', '2026-09-07T12:00:00.000Z', true)];
  assert.deepEqual(historialDeVersiones(lista), [
    { planId: 'segunda', numero: 2, activadaEl: '2026-09-07T12:00:00.000Z', vigente: true },
    { planId: 'primera', numero: 1, activadaEl: '2026-08-17T12:00:00.000Z', vigente: false },
  ]);
  // La vigente no se deduce de la fecha: si la API dice que rige la primera, rige la primera.
  const rara = historialDeVersiones([version('primera', '2026-08-17T12:00:00.000Z', true), version('segunda', '2026-09-07T12:00:00.000Z')]);
  assert.deepEqual(rara.map((v) => [v.numero, v.vigente]), [[2, false], [1, true]]);
  assert.deepEqual(historialDeVersiones([version('borrador', null)]), []);
});

// ─── El día tipo ────────────────────────────────────────────────────────────────────────────────

test('el día tipo que se muestra: el que pide la dirección por su número de orden; si no, el primero', () => {
  // Llegan desordenados: el primero es el de menor orden, no el que llegó primero.
  const dias = [{ order: 2, label: 'Día de descanso' }, { order: 1, label: 'Día de entrenamiento' }];
  assert.equal(diaTipoElegido(dias, null)?.label, 'Día de entrenamiento');
  assert.equal(diaTipoElegido(dias, '2')?.label, 'Día de descanso');
  assert.equal(diaTipoElegido(dias, '1')?.label, 'Día de entrenamiento');
  // Un día que esta versión no tiene, o algo que no es un número de orden: el primero, no un error ni un día vacío.
  assert.equal(diaTipoElegido(dias, '7')?.label, 'Día de entrenamiento');
  assert.equal(diaTipoElegido(dias, 'descanso')?.label, 'Día de entrenamiento');
  assert.equal(diaTipoElegido([], '1'), null);
});

// ─── Una comida y sus opciones ──────────────────────────────────────────────────────────────────

test('las opciones de una comida: con una sola no se dice «se elige una»; con ninguna, se dice', () => {
  assert.equal(opcionesEnPalabras(1), '1 opción');
  assert.equal(opcionesEnPalabras(2), '2 opciones · se elige una');
  assert.equal(opcionesEnPalabras(3), '3 opciones · se elige una');
  assert.equal(opcionesEnPalabras(0), 'Sin opciones');
});

test('el título de una opción lleva su número solo si la comida tiene más de una', () => {
  assert.equal(tituloDeLaOpcion({ order: 2, label: 'Tarta de atún' }, 3), 'Opción 2: Tarta de atún');
  assert.equal(tituloDeLaOpcion({ order: 1, label: 'Yogur con manzana' }, 1), 'Yogur con manzana');
});

test('lo indicado de un ítem: la cantidad con su unidad y el estado, en minúscula; el número, con coma', () => {
  assert.equal(indicadoDelItem({ quantity: { value: 120, unit: 'g' }, preparationState: 'COOKED' }), '120 g · cocido');
  assert.equal(indicadoDelItem({ quantity: { value: 200, unit: 'ml' }, preparationState: 'RAW' }), '200 ml · crudo');
  assert.equal(indicadoDelItem({ quantity: { value: 60, unit: 'g' }, preparationState: 'AS_PURCHASED' }), '60 g · tal como se adquiere');
  assert.equal(indicadoDelItem({ quantity: { value: 7.5, unit: 'g' }, preparationState: 'RAW' }), '7,5 g · crudo');
  assert.equal(indicadoDelItem({ quantity: { value: 120, unit: 'g' }, preparationState: null }), '120 g');
});

test('un ítem sin cantidad es un hueco: se dice, no se muestra vacío ni con un cero', () => {
  assert.equal(indicadoDelItem({ quantity: null, preparationState: null }), 'sin cantidad indicada');
  assert.equal(indicadoDelItem({ quantity: null, preparationState: 'COOKED' }), 'sin cantidad indicada · cocido');
  assert.equal(/\b0\b/.test(indicadoDelItem({ quantity: null, preparationState: null })), false);
});

// ─── Las comidas abiertas ───────────────────────────────────────────────────────────────────────

// Llegan desordenadas: la primera es la de menor orden.
const COMIDAS = [{ order: 3 }, { order: 1 }, { order: 2 }, { order: 4 }];

test('sin pedido está abierta la primera comida, y solo esa; un día sin comidas no tiene ninguna', () => {
  assert.deepEqual([...comidasAbiertas(COMIDAS, null)], [1]);
  assert.deepEqual([...comidasAbiertas([], null)], []);
});

test('las comidas abiertas se piden por su número de orden; «ninguna» las pliega todas; lo que el día no tiene se ignora', () => {
  assert.deepEqual([...comidasAbiertas(COMIDAS, '2.4')], [2, 4]);
  assert.deepEqual([...comidasAbiertas(COMIDAS, '4.2')], [2, 4]);
  assert.deepEqual([...comidasAbiertas(COMIDAS, NINGUNA_COMIDA)], []);
  assert.deepEqual([...comidasAbiertas(COMIDAS, '2.9.cena')], [2]);
  assert.deepEqual([...comidasAbiertas(COMIDAS, '')], []);
  // «12» no es «1» ni «2»: se compara el número entero.
  assert.deepEqual([...comidasAbiertas(COMIDAS, '12')], []);
});

test('lo que se escribe en la dirección: nada si es lo que se ve sin pedir; «ninguna» si están todas plegadas', () => {
  assert.equal(pedidoDeComidas(COMIDAS, new Set([1])), null);
  assert.equal(pedidoDeComidas(COMIDAS, new Set()), NINGUNA_COMIDA);
  assert.equal(pedidoDeComidas(COMIDAS, new Set([4, 2])), '2.4');
  // Abierta una sola que no es la primera: hay que decirlo, o al volver se abriría la primera.
  assert.equal(pedidoDeComidas(COMIDAS, new Set([2])), '2');
  assert.equal(pedidoDeComidas(COMIDAS, new Set([1, 2, 3, 4])), '1.2.3.4');
  assert.equal(pedidoDeComidas([], new Set()), null);
  // Una comida que el día no tiene no se escribe: la dirección no guarda lo que la pantalla no puede mostrar.
  assert.equal(pedidoDeComidas(COMIDAS, new Set([2, 9])), '2');
  assert.equal(pedidoDeComidas(COMIDAS, new Set([9])), NINGUNA_COMIDA);
});

test('ida y vuelta: lo que se escribe en la dirección abre las mismas comidas', () => {
  for (const abiertas of [[], [1], [2], [1, 3], [1, 2, 3, 4]]) {
    const pedido = pedidoDeComidas(COMIDAS, new Set(abiertas));
    assert.deepEqual([...comidasAbiertas(COMIDAS, pedido)], abiertas, `con ${JSON.stringify(abiertas)} se escribió ${pedido}`);
  }
});

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────

test('los textos del plan: ninguno usa un término prohibido de Nutrición, tampoco los que llevan un dato', () => {
  const textos: string[] = [];
  const juntar = (valor: unknown): void => {
    if (typeof valor === 'string') textos.push(valor);
    else if (typeof valor === 'function') juntar((valor as (...a: unknown[]) => unknown)(2, '7 oct'));
    else if (valor && typeof valor === 'object') Object.values(valor).forEach(juntar);
  };
  juntar(COPY_DEL_PLAN);
  for (const n of [0, 1, 2, 3]) textos.push(opcionesEnPalabras(n));
  assert.ok(textos.length > 25);
  assert.deepEqual(textos.flatMap((t) => terminosProhibidosEn(t).map((p) => `${p} en «${t}»`)), []);
  assert.equal(COPY_DEL_PLAN.versionActivada(2, '7 oct'), 'Versión 2 · activada el 7 oct');
});
