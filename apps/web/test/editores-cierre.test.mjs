/**
 * WP-EDITORES-PROFESIONAL · el cierre del website (§8.3 y §8.4): lo pendiente de V3 que no choca con la API.
 * - ED-33 · «Copiar desde otra comida» y «Usar una comida habitual», en el «⋯» de la comida (TEST-EDP-031: la copia no
 *   comparte identificadores con el original).
 *
 * Uso: npm run test -w @be/web.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const leer = (r) => readFileSync(new URL(`../src/app/pro/advisees/${r}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const O = await import('../src/app/pro/advisees/nutrition/opcion-de-otra-comida.ts');

const item = (itemId, catalogItemId) => ({ itemId, catalogItemId, quantity: { value: 100, unit: 'g' }, preparationState: 'COOKED', note: 'sin sal' });
const dias = [
  {
    label: 'Día habitual',
    meals: [
      { mealId: 'm1', label: 'Almuerzo', options: [{ optionId: 'o1', label: 'Arroz con pollo', items: [item('i1', 'arroz'), item('i2', 'pollo')] }, { optionId: 'o2', label: '', items: [] }] },
      { mealId: 'm2', label: 'Merienda', options: [{ optionId: 'o3', label: 'Yogur', items: [item('i3', 'yogur')] }] },
    ],
  },
  { label: '', meals: [{ mealId: 'm3', label: '', options: [{ optionId: 'o4', label: 'Tarta', items: [], recipeVersionId: 'rv1' }] }] },
];

test('ED-33 · las opciones para copiar son las de las otras comidas, de todos los días tipo, sin las vacías', () => {
  const o = O.origenesDeLaCopia(dias, 0, 1);
  assert.deepEqual(
    o.map((x) => [x.clave, x.donde, x.opcion, x.tiene]),
    [
      ['0-0-0', 'Día habitual · Almuerzo', 'Arroz con pollo', '2 alimentos'],
      ['1-0-0', 'Día tipo 2 · Comida 1', 'Tarta', 'Receta'],
    ],
  );
  // La misma comida no se ofrece: para eso está «Duplicar opción».
  assert.ok(O.origenesDeLaCopia(dias, 0, 0).every((x) => x.clave !== '0-0-0'));
  assert.deepEqual(O.origenesDeLaCopia([dias[0]], 0, 0).map((x) => x.clave), ['0-1-0']);
});

test('TEST-EDP-031 · la copia desde otra comida es independiente: sin identificadores, con su nombre y todo lo demás', () => {
  const fuente = dias[0].meals[0].options[0];
  const copia = O.copiaDesdeOtraComida(fuente, 0);
  assert.equal(copia.optionId, undefined);
  assert.equal(copia.label, 'Arroz con pollo');
  assert.deepEqual(copia.items, [
    { catalogItemId: 'arroz', quantity: { value: 100, unit: 'g' }, preparationState: 'COOKED', note: 'sin sal' },
    { catalogItemId: 'pollo', quantity: { value: 100, unit: 'g' }, preparationState: 'COOKED', note: 'sin sal' },
  ]);
  // Cambiar la copia no toca el original.
  copia.items[0].quantity.value = 5;
  assert.equal(fuente.items[0].quantity.value, 100);
  // Una de receta sigue citando la misma versión.
  assert.equal(O.copiaDesdeOtraComida(dias[1].meals[0].options[0], 0).recipeVersionId, 'rv1');
  assert.equal(O.copiaDesdeOtraComida({ label: ' ', items: [] }, 2).label, 'Opción 3');
});

test('ED-33 · una comida habitual entra como opciones, con su nombre, sin pasar de doce', () => {
  const una = { name: 'Desayuno de siempre', structure: { options: [{ optionId: 'h1', label: 'Opción 1', items: [{ itemId: 'x', catalogItemId: 'avena' }] }] } };
  const r = O.opcionesDeLaHabitual(una, 3);
  assert.deepEqual(r, { opciones: [{ label: 'Desayuno de siempre', items: [{ catalogItemId: 'avena' }] }], quedanAfuera: 0 });
  const tres = { name: 'Cena', structure: { options: [{ label: 'Pescado', items: [] }, { label: '', items: [] }, { label: 'Pasta', items: [] }] } };
  const dos = O.opcionesDeLaHabitual(tres, 2);
  assert.deepEqual(dos.opciones.map((o) => o.label), ['Cena · Pescado', 'Cena · Opción 2']);
  assert.equal(dos.quedanAfuera, 1);
  assert.deepEqual(O.opcionesDeLaHabitual(tres, 0), { opciones: [], quedanAfuera: 3 });
  assert.equal(O.COPY_DE_OTRA_COMIDA.usada('Cena', 'Almuerzo', 2), '«Cena» entró como 2 opciones de Almuerzo.');
  assert.equal(O.COPY_DE_OTRA_COMIDA.quedanAfuera(1), 'Una opción de la habitual no entró: la comida llegó a doce.');
});

test('ED-33 · las dos entradas van en el «⋯» de la comida, con su motivo si no se pueden', () => {
  const comida = leer('nutrition/comida-del-editor.tsx');
  assert.match(comida, /clave: 'copiar-desde-otra', texto: COPY_DE_OTRA_COMIDA\.copiar, alElegir: alCopiarDesdeOtra, noSePuede: noSePuedeCopiar/);
  assert.match(comida, /clave: 'usar-habitual', texto: COPY_DE_OTRA_COMIDA\.usarHabitual, alElegir: alUsarHabitual, noSePuede: noSePuedeUsarHabitual/);
  const editor = leer('nutrition/editor.tsx');
  // Cambian el borrador (el autoguardado lo lleva): ninguna escritura propia.
  assert.match(editor, /cambiar\(\(x\) => \(x\[di\]!\.meals\[j\]!\.options\.push\(\.\.\.opciones\), x\)\);/);
});
