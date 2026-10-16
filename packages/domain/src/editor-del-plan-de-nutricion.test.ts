/**
 * Nutrición · La versión en preparación (WP-ESCRITORIO-AREAS, parte 7): dónde está un problema de «Validar», qué no deja
 * guardar, qué dice una comida plegada, qué se mira según la dirección y qué entra y qué queda al activar.
 *
 * Los resultados esperados se escriben a mano, a partir de la maqueta 17 y de lo que el editor ya decía («Día → Comida
 * → Opción N → Ítem N»). Si una prueba falla, se corrige el cálculo, no el oráculo.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { terminosProhibidosEn } from './copy-nutricion';
import {
  COPY_DE_ACTIVAR_EL_PLAN,
  PROBLEMA_DEL_EDITOR,
  avisoDeLoQueNoDejaGuardar,
  comidaPlegadaDelEditor,
  comidasAbiertasEnElEditor,
  loQueEntraAlActivar,
  loQueNoDejaGuardar,
  lugarDelProblema,
  pedidoDeComidasDelEditor,
  pedidoDeLaPosicion,
  pestanaDeLaOpcion,
  posicionPedida,
  problemasDeLaComida,
  ubicacionDelProblema,
} from './editor-del-plan-de-nutricion';

const item = (valor: number | null) => ({ quantity: valor === null ? null : { value: valor } });
const DIAS = [
  {
    label: 'Día de entrenamiento',
    meals: [
      { label: 'Desayuno', options: [{ label: 'Avena con leche', items: [item(50), item(200)] }] },
      { label: 'Almuerzo', options: [{ label: 'Pollo, arroz y verduras', items: [item(120)] }, { label: '', items: [] }, { label: 'Wok de carne', items: [item(null)] }] },
    ],
  },
  { label: '', meals: [{ label: '', options: [] }] },
];

// ─── Los problemas de «Validar» ──────────────────────────────────────────────────────────────────────────────────

test('la ruta de un problema da las posiciones de su día tipo, su comida, su opción y su ítem, hasta donde llegue', () => {
  assert.deepEqual(lugarDelProblema('dayTypes[0]'), { dia: 0, comida: null, opcion: null, item: null });
  assert.deepEqual(lugarDelProblema('dayTypes[1].meals[2]'), { dia: 1, comida: 2, opcion: null, item: null });
  assert.deepEqual(lugarDelProblema('dayTypes[0].meals[1].options[2]'), { dia: 0, comida: 1, opcion: 2, item: null });
  assert.deepEqual(lugarDelProblema('dayTypes[0].meals[1].options[2].items[10].preparationState'), { dia: 0, comida: 1, opcion: 2, item: 10 });
  // Lo que no es de la estructura no ubica nada: es del plan entero.
  assert.deepEqual(lugarDelProblema('objectiveVersionId'), { dia: null, comida: null, opcion: null, item: null });
  assert.deepEqual(lugarDelProblema(''), { dia: null, comida: null, opcion: null, item: null });
});

test('la ubicación de un problema se dice con los nombres, sin rutas técnicas; lo que no tiene nombre, por lo que es y su número', () => {
  assert.equal(ubicacionDelProblema('dayTypes[0].meals[1].options[2].items[0]', DIAS), 'Día de entrenamiento → Almuerzo → Opción 3 → Ítem 1');
  assert.equal(ubicacionDelProblema('dayTypes[0].meals[0]', DIAS), 'Día de entrenamiento → Desayuno');
  assert.equal(ubicacionDelProblema('dayTypes[1].meals[0]', DIAS), 'Día tipo 2 → Comida 1');
  assert.equal(ubicacionDelProblema('dayTypes[0]', DIAS), 'Día de entrenamiento');
  assert.equal(ubicacionDelProblema('objectiveVersionId', DIAS), 'Plan');
  // Una ruta a algo que ya no está (se quitó después de validar) no rompe.
  assert.equal(ubicacionDelProblema('dayTypes[5].meals[1]', DIAS), 'Día tipo 6 → Comida 2');
});

test('los problemas de una comida son los que están en ella o adentro, no los de otra comida ni los de otro día', () => {
  const rutas = ['dayTypes[0].meals[1]', 'dayTypes[0].meals[1].options[1]', 'dayTypes[0].meals[1].options[2].items[0]', 'dayTypes[0].meals[0].options[0]', 'dayTypes[1].meals[1]', 'dayTypes[0]', 'objectiveVersionId'];
  assert.equal(problemasDeLaComida(rutas, 0, 1), 3);
  assert.equal(problemasDeLaComida(rutas, 0, 0), 1);
  assert.equal(problemasDeLaComida(rutas, 1, 1), 1);
  assert.equal(problemasDeLaComida(rutas, 1, 0), 0);
  assert.equal(problemasDeLaComida([], 0, 0), 0);
});

// ─── Lo que no deja guardar ────────────────────────────────────────────────────────────────────────────────────

test('lo que no deja guardar se lista en el orden de la estructura, con la ruta a su lugar: lo que quedó sin nombre y las cantidades que no se entienden', () => {
  const N = PROBLEMA_DEL_EDITOR.faltaElNombre;
  const C = PROBLEMA_DEL_EDITOR.cantidadIlegible;
  assert.deepEqual(loQueNoDejaGuardar(DIAS), [
    { code: N, path: 'dayTypes[0].meals[1].options[1]' },
    { code: N, path: 'dayTypes[1]' },
    { code: N, path: 'dayTypes[1].meals[0]' },
  ]);
  const conIlegibles = [{ label: 'Día', meals: [{ label: 'Cena', options: [{ label: 'Tarta', items: [item(Number.NaN), item(80), item(Number.NaN)] }, { label: '  ', items: [item(Number.NaN)] }] }] }];
  assert.deepEqual(loQueNoDejaGuardar(conIlegibles), [
    { code: C, path: 'dayTypes[0].meals[0].options[0].items[0]' },
    { code: C, path: 'dayTypes[0].meals[0].options[0].items[2]' },
    { code: N, path: 'dayTypes[0].meals[0].options[1]' },
    { code: C, path: 'dayTypes[0].meals[0].options[1].items[0]' },
  ]);
  // Lo que está completo no tiene nada que corregir: ni un ítem sin cantidad, ni una comida sin opciones (eso lo dice «Validar»).
  assert.deepEqual(loQueNoDejaGuardar([DIAS[0]!].map((d) => ({ ...d, meals: [d.meals[0]!, { label: 'Cena', options: [] }, { label: 'Colación', options: [{ label: 'Fruta', items: [item(null)] }] }] }))), []);
  assert.deepEqual(loQueNoDejaGuardar([]), []);
  // Cada uno se puede ubicar: la lista lleva a su lugar.
  for (const p of [...loQueNoDejaGuardar(DIAS), ...loQueNoDejaGuardar(conIlegibles)]) assert.notEqual(lugarDelProblema(p.path).dia, null, p.path);
  assert.deepEqual(lugarDelProblema('dayTypes[0].meals[0].options[1].items[0]'), { dia: 0, comida: 0, opcion: 1, item: 0 });
});

test('el aviso de lo que no deja guardar dice qué hay que corregir: nombres, cantidades o las dos cosas', () => {
  const nombre = { code: PROBLEMA_DEL_EDITOR.faltaElNombre, path: 'dayTypes[1]' };
  const cantidad = { code: PROBLEMA_DEL_EDITOR.cantidadIlegible, path: 'dayTypes[0].meals[0].options[0].items[0]' };
  assert.equal(avisoDeLoQueNoDejaGuardar([nombre]), 'Hay nombres sin completar. Completalos antes de guardar.');
  assert.equal(avisoDeLoQueNoDejaGuardar([cantidad, cantidad]), 'Hay cantidades que no se entienden. Corregilas antes de guardar.');
  assert.equal(avisoDeLoQueNoDejaGuardar([cantidad, nombre]), 'Hay nombres sin completar y cantidades que no se entienden. Corregilos antes de guardar.');
  const textos = [avisoDeLoQueNoDejaGuardar([nombre]), avisoDeLoQueNoDejaGuardar([cantidad]), avisoDeLoQueNoDejaGuardar([cantidad, nombre])];
  assert.deepEqual(textos.flatMap((t) => terminosProhibidosEn(t).map((p) => `${p} en «${t}»`)), []);
});

// ─── Lo que se mira, según la dirección ─────────────────────────────────────────────────────────────────────────

test('el día tipo que se mira: el que pide la dirección, contando desde uno; si no, el primero', () => {
  assert.equal(posicionPedida(2, null), 0);
  assert.equal(posicionPedida(2, '1'), 0);
  assert.equal(posicionPedida(2, '2'), 1);
  // Un día que la versión no tiene, o algo que no es una posición: el primero, no un error ni un día vacío.
  assert.equal(posicionPedida(2, '3'), 0);
  assert.equal(posicionPedida(2, '0'), 0);
  assert.equal(posicionPedida(2, 'descanso'), 0);
  assert.equal(posicionPedida(2, '02'), 0);
  assert.equal(posicionPedida(0, '1'), -1);
  assert.equal(pedidoDeLaPosicion(0), null);
  assert.equal(pedidoDeLaPosicion(1), '2');
  // Ida y vuelta.
  for (const p of [0, 1, 2]) assert.equal(posicionPedida(3, pedidoDeLaPosicion(p)), p);
});

test('en el editor, al entrar no hay ninguna comida abierta; la dirección nombra las abiertas desde uno', () => {
  assert.deepEqual([...comidasAbiertasEnElEditor(4, null)], []);
  assert.deepEqual([...comidasAbiertasEnElEditor(4, 'ninguna')], []);
  assert.deepEqual([...comidasAbiertasEnElEditor(4, '2.4')].sort(), [1, 3]);
  // Lo que el día no tiene se ignora; «12» no es «1» ni «2».
  assert.deepEqual([...comidasAbiertasEnElEditor(4, '2.9.cena')], [1]);
  assert.deepEqual([...comidasAbiertasEnElEditor(4, '12')], []);
  assert.deepEqual([...comidasAbiertasEnElEditor(0, '1')], []);
  assert.equal(pedidoDeComidasDelEditor(new Set()), null);
  assert.equal(pedidoDeComidasDelEditor(new Set([3, 1])), '2.4');
  for (const abiertas of [[], [0], [2], [0, 3]]) assert.deepEqual([...comidasAbiertasEnElEditor(4, pedidoDeComidasDelEditor(new Set(abiertas)))].sort(), abiertas);
});

// ─── Una comida plegada ────────────────────────────────────────────────────────────────────────────────────────

test('una comida plegada dice su nombre y cuántas opciones tiene; con una sola no dice «se elige una»', () => {
  assert.deepEqual(comidaPlegadaDelEditor(DIAS[0]!.meals[0]!, 0, 0), { titulo: 'Desayuno', opciones: '1 opción', avisos: [] });
  assert.deepEqual(comidaPlegadaDelEditor({ label: ' Cena ', options: [{ label: 'Tarta', items: [] }, { label: 'Sopa', items: [] }, { label: 'Wok', items: [] }] }, 3, 0), { titulo: 'Cena', opciones: '3 opciones · se elige una', avisos: [] });
});

test('plegar no esconde lo que falta: una comida o una opción sin nombre, una cantidad que no se entiende y los problemas de «Validar» se dicen en su renglón', () => {
  assert.deepEqual(comidaPlegadaDelEditor(DIAS[1]!.meals[0]!, 0, 0), { titulo: 'Comida 1', opciones: 'Sin opciones', avisos: ['Falta el nombre'] });
  // Una opción sin nombre está en una pestaña que quizá no es la elegida: también se dice.
  assert.deepEqual(comidaPlegadaDelEditor(DIAS[0]!.meals[1]!, 1, 0), { titulo: 'Almuerzo', opciones: '3 opciones · se elige una', avisos: ['1 opción sin nombre'] });
  assert.deepEqual(comidaPlegadaDelEditor({ label: '', options: [{ label: ' ', items: [item(Number.NaN)] }, { label: '', items: [] }] }, 2, 1).avisos, ['Falta el nombre', '2 opciones sin nombre', '1 cantidad que no se entiende', '1 problema para revisar']);
  const conIlegibles = { label: 'Cena', options: [{ label: 'Tarta', items: [item(Number.NaN), item(80)] }, { label: 'Sopa', items: [item(Number.NaN)] }] };
  assert.deepEqual(comidaPlegadaDelEditor(conIlegibles, 3, 0).avisos, ['2 cantidades que no se entienden']);
  assert.deepEqual(comidaPlegadaDelEditor({ label: 'Cena', options: [{ label: 'Tarta', items: [item(Number.NaN)] }] }, 3, 1).avisos, ['1 cantidad que no se entiende', '1 problema para revisar']);
  assert.deepEqual(comidaPlegadaDelEditor(DIAS[0]!.meals[0]!, 0, 4).avisos, ['4 problemas para revisar']);
  // Un ítem sin cantidad no es una cantidad ilegible: nace así, y se completa después.
  assert.deepEqual(comidaPlegadaDelEditor({ label: 'Cena', options: [{ label: 'Tarta', items: [item(null), {}] }] }, 3, 0).avisos, []);
});

test('la pestaña de una opción lleva su número y su nombre; sin nombre, o con el que nace, solo «Opción N»', () => {
  assert.equal(pestanaDeLaOpcion({ label: 'Pollo, arroz y verduras' }, 0), '1 · Pollo, arroz y verduras');
  assert.equal(pestanaDeLaOpcion({ label: '  ' }, 2), 'Opción 3');
  // La opción nace llamándose por su número: la pestaña no lo dice dos veces.
  assert.equal(pestanaDeLaOpcion({ label: 'Opción 4' }, 3), 'Opción 4');
  // Si ese nombre ya no es su número (se quitó una opción de antes), es un nombre como cualquiera.
  assert.equal(pestanaDeLaOpcion({ label: 'Opción 4' }, 2), '3 · Opción 4');
});

// ─── Activar ───────────────────────────────────────────────────────────────────────────────────────────────────

test('lo que entra al activar se cuenta de la estructura, en singular y en plural', () => {
  assert.equal(loQueEntraAlActivar(DIAS), '2 días tipo y 3 comidas');
  assert.equal(loQueEntraAlActivar([DIAS[0]!]), '1 día tipo y 2 comidas');
  assert.equal(loQueEntraAlActivar([DIAS[1]!]), '1 día tipo y 1 comida');
  assert.equal(loQueEntraAlActivar([]), '0 días tipo y 0 comidas');
});

test('los textos de activar: la versión que entra no lleva un número prometido; la que queda dice el suyo y desde cuándo', () => {
  // Cada frase va en dos partes —de quién habla, que en pantalla va destacado, y qué le pasa— que se leen seguidas.
  const entra = COPY_DE_ACTIVAR_EL_PLAN.entra('2 días tipo y 8 comidas');
  const queda = COPY_DE_ACTIVAR_EL_PLAN.queda(2, '7 sept');
  assert.deepEqual(entra, { quien: 'Esta versión', que: ' pasa a ser la vigente: 2 días tipo y 8 comidas.' });
  assert.equal(entra.quien + entra.que, 'Esta versión pasa a ser la vigente: 2 días tipo y 8 comidas.');
  assert.equal(/[Vv]ersión \d/.test(entra.quien + entra.que), false);
  assert.deepEqual(queda, { quien: 'La versión 2', que: ', activa desde el 7 sept, queda en el historial.' });
  assert.equal(queda.quien + queda.que, 'La versión 2, activa desde el 7 sept, queda en el historial.');
  const textos = [entra.quien + entra.que, queda.quien + queda.que, ...(Object.values(COPY_DE_ACTIVAR_EL_PLAN) as readonly unknown[]).filter((v): v is string => typeof v === 'string')];
  assert.deepEqual(textos.flatMap((t) => terminosProhibidosEn(t).map((p) => `${p} en «${t}»`)), []);
});
