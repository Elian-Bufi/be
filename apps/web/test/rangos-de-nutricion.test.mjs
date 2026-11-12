/**
 * ED-31, ED-33 y ED-34 · Los totales de cada opción, los rangos de Nutrición y lo que se va al quitar
 * (WP-EDITORES-PROFESIONAL). TEST-EDP-029 (un hueco nunca suma cero), TEST-EDP-032 (reescrita por DJ-4: el rango del
 * día suma el mínimo y el máximo de cada comida, nunca dos alternativas de la misma) y TEST-EDP-057 (quitar con
 * contenido nombra lo que se va; sin contenido, no pregunta).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const R = await import('../src/app/pro/advisees/nutrition/rangos.ts');
const Q = await import('../src/app/pro/advisees/nutrition/quitar-con-contenido.ts');
const { calcularNutrientes } = await import('@be/domain');

// Composiciones cada 100 g (sintéticas): banana, arroz, pollo y una sin el dato de las grasas.
const comp = (energyKcal, proteinG, carbohydrateG, fatG) => ({ referenceAmount: '100g', energyKcal, proteinG, carbohydrateG, fatG });
const COMPOSICIONES = new Map([
  ['banana', comp(89, 1.1, 22.8, 0.3)],
  ['arroz', comp(130, 2.7, 28.2, 0.3)],
  ['pollo', comp(165, 31, 0, 3.6)],
  ['sin-grasas', { referenceAmount: '100g', energyKcal: 50, proteinG: 1, carbohydrateG: 10, fatG: null }],
  ['leyendo', 'leyendo'],
  ['ilegible', 'sin-composicion'],
]);
const NOMBRES = { banana: 'Banana', arroz: 'Arroz', pollo: 'Pollo', 'sin-grasas': 'Caldo', leyendo: 'Avena', otro: 'Queso', ilegible: 'Mijo' };
const item = (catalogItemId, value, unit = 'g') => ({ catalogItemId, quantity: value === null ? null : { value, unit }, preparationState: 'RAW', note: null });
const opcion = (label, items) => ({ label, items });
const comida = (label, options) => ({ label, prescriptionMode: 'DISH_OPTIONS', options });
const sinReceta = () => null;
const kcal = (r) => (r.energyKcal.tipo === 'rango' ? [r.energyKcal.min, r.energyKcal.max] : r.energyKcal.tipo);

test('ED-31 · el total de una opción es la cuenta del dominio, con las kcal de la fuente, y cambia en el momento', () => {
  const a120 = R.totalDeLaOpcion(R.itemsParaElTotal(opcion('Fruta', [item('banana', 120)]), NOMBRES, sinReceta), COMPOSICIONES);
  const a150 = R.totalDeLaOpcion(R.itemsParaElTotal(opcion('Fruta', [item('banana', 150)]), NOMBRES, sinReceta), COMPOSICIONES);
  assert.equal(a120.energyKcal.exacto, '106.8');
  assert.equal(a150.energyKcal.exacto, '133.5');
  // La misma cuenta que la API (`SUM_SOURCE_PER_100G_V1`), para una tabla de casos.
  const casos = [
    [item('banana', 120), item('arroz', 200), item('pollo', 150)],
    [item('arroz', 75.5)],
    [item('pollo', 0.1), item('banana', 4999)],
  ];
  for (const items of casos) {
    const web = R.totalDeLaOpcion(R.itemsParaElTotal(opcion('X', items), NOMBRES, sinReceta), COMPOSICIONES);
    const api = calcularNutrientes(items.map((it, n) => ({ clave: String(n), cantidad: it.quantity, composicion: COMPOSICIONES.get(it.catalogItemId) })));
    for (const n of R.NUTRIENTES_DEL_RANGO) assert.equal(web[n].exacto, api.nutrientes[n].exacto, `${n} de ${items.map((i) => i.catalogItemId)}`);
  }
  assert.equal(R.totalEnUnaLinea(a120), '107 kcal · P 1,3 g · C 27,4 g · G 0,4 g');
});

test('TEST-EDP-029 · un hueco nunca suma cero: dice «Sin dato» y qué lo impide', () => {
  const t = (items) => R.totalDeLaOpcion(R.itemsParaElTotal(opcion('X', items), NOMBRES, sinReceta), COMPOSICIONES);
  const sinCantidad = t([item('banana', null), item('arroz', 100)]);
  assert.equal(sinCantidad.energyKcal.exacto, null);
  assert.deepEqual(sinCantidad.energyKcal.faltan, [{ donde: '', nombre: 'Banana', motivo: 'SIN_CANTIDAD' }]);
  // Lo que no se entiende mientras se escribe (NaN) no es cero.
  assert.equal(t([item('banana', Number.NaN)]).energyKcal.exacto, null);
  // Un nutriente que la fuente no trae: ese, y solo ese.
  const caldo = t([item('sin-grasas', 200)]);
  assert.equal(caldo.energyKcal.exacto, '100');
  assert.equal(caldo.fatG.exacto, null);
  assert.equal(R.queFaltaEnPalabras(caldo.fatG.faltan[0]), 'Caldo: la fuente no trae ese dato');
  // En unidades, sin equivalencia: «en unidades: sin estimación».
  assert.equal(R.queFaltaEnPalabras(t([item('banana', 2, 'unit')]).energyKcal.faltan[0]), 'Banana en unidades: sin estimación');
  // Una composición cuya lectura falló; una que todavía se está leyendo, y una que ni se pidió (otro día tipo): esas
  // dos dicen «leyendo», nunca «no se pudo leer».
  assert.equal(t([item('ilegible', 30)]).energyKcal.faltan[0].motivo, 'SIN_COMPOSICION');
  assert.equal(t([item('leyendo', 30)]).energyKcal.faltan[0].motivo, 'LEYENDO');
  assert.equal(t([item('otro', 30)]).energyKcal.faltan[0].motivo, 'LEYENDO');
  // La fibra, con la misma cuenta: lo que la fuente no trae es «Sin dato».
  assert.equal(R.fibraDeLaOpcion(R.itemsParaElTotal(opcion('X', [item('banana', 100)]), NOMBRES, sinReceta), COMPOSICIONES).exacto, null);
  assert.equal(R.fibraDeLaOpcion([], COMPOSICIONES).faltan[0].motivo, 'SIN_ALIMENTOS');
  const conFibra = new Map([['avena', { ...comp(389, 16.9, 66.3, 6.9), fiberG: 10.6 }]]);
  assert.equal(R.fibraDeLaOpcion([{ catalogItemId: 'avena', quantity: { value: 50, unit: 'g' }, nombre: 'Avena' }], conFibra).exacto, '5.3');
  // Sin alimentos, o una receta todavía sin guardar: nada de cero.
  assert.equal(t([]).energyKcal.exacto, null);
  const receta = R.totalDeLaOpcion(R.itemsParaElTotal({ label: 'Budín', items: [], recipeVersionId: 'rv1' }, NOMBRES, sinReceta), COMPOSICIONES, 'Budín');
  assert.equal(receta.energyKcal.faltan[0].motivo, 'RECETA_SIN_GUARDAR');
  assert.match(R.totalEnUnaLinea(sinCantidad), /^Sin dato · P Sin dato/);
});

test('TEST-EDP-032 · el rango de cada comida va de la opción que menos aporta a la que más; el día suma mínimos y máximos', () => {
  const dia = {
    label: 'Entrenamiento',
    meals: [
      comida('Desayuno', [opcion('A', [item('banana', 100)]), opcion('B', [item('arroz', 100)])]), // 89 y 130
      comida('Almuerzo', [opcion('A', [item('pollo', 200)]), opcion('B', [item('arroz', 300)]), opcion('C', [item('pollo', 100)])]), // 330, 390 y 165
      comida('Merienda', [opcion('Única', [item('banana', 200)])]), // 178
    ],
  };
  const r = R.rangosDelDia(dia, 0, COMPOSICIONES, NOMBRES, sinReceta);
  assert.deepEqual(kcal(r.comidas[0].rango), ['89', '130']);
  assert.deepEqual(kcal(r.comidas[1].rango), ['165', '390']);
  assert.deepEqual(kcal(r.comidas[2].rango), ['178', '178']);
  // El día: 89 + 165 + 178 y 130 + 390 + 178. Nunca la suma de las alternativas (89 + 130 + …).
  assert.deepEqual(kcal(r.dia), ['432', '698']);
  const sumaDeAlternativas = [89, 130, 330, 390, 165, 178].reduce((a, b) => a + b, 0);
  assert.notEqual(Number(r.dia.energyKcal.max), sumaDeAlternativas);
  assert.equal(R.rangoDelDiaEnPalabras(r.dia.energyKcal), 'El día va de 432 a 698 kcal según lo que elija');
  assert.equal(R.rangoEnUnaCelda(r.comidas[1].rango.energyKcal, 'energyKcal'), 'de 165 a 390');
  assert.equal(R.rangoEnUnaCelda(r.comidas[2].rango.energyKcal, 'energyKcal'), '178');
  // Cada nutriente por su cuenta: el mínimo de proteínas no tiene por qué venir de la misma opción que el de las kcal.
  assert.deepEqual([r.comidas[0].rango.proteinG.min, r.comidas[0].rango.proteinG.max], ['1.1', '2.7']);
});

test('TEST-EDP-032 · un hueco en una opción deja la comida y el día sin dato, y nombra el ingrediente', () => {
  const dia = {
    label: '',
    meals: [comida('Desayuno', [opcion('A', [item('banana', 100)])]), comida('Almuerzo', [opcion('A', [item('pollo', 200)]), opcion('Opción 2', [item('arroz', null)])])],
  };
  const r = R.rangosDelDia(dia, 1, COMPOSICIONES, NOMBRES, sinReceta);
  assert.equal(r.comidas[0].rango.energyKcal.tipo, 'rango');
  assert.equal(r.comidas[1].rango.energyKcal.tipo, 'sin-dato');
  assert.equal(r.dia.energyKcal.tipo, 'sin-dato');
  assert.equal(R.rangoDelDiaEnPalabras(r.dia.energyKcal), 'Sin dato: Almuerzo · Opción 2: Arroz sin cantidad');
  // Sin comidas, o una comida sin opciones: tampoco hay rango.
  assert.equal(R.rangosDelDia({ label: 'Descanso', meals: [] }, 0, COMPOSICIONES, NOMBRES, sinReceta).dia.energyKcal.tipo, 'sin-dato');
  const sinOpciones = R.rangosDelDia({ label: 'Descanso', meals: [comida('Colación', [])] }, 0, COMPOSICIONES, NOMBRES, sinReceta);
  assert.equal(R.rangoDelDiaEnPalabras(sinOpciones.dia.energyKcal), 'Sin dato: Colación: sin opciones');
});

test('ED-34 · una opción de receta guardada suma con los ítems que armó la API', () => {
  const deLaReceta = (optionId) => (optionId === 'o1' ? [{ catalogItemId: 'banana', name: 'Banana', quantity: { value: 50, unit: 'g' } }] : null);
  const dia = { label: 'D', meals: [comida('Merienda', [{ optionId: 'o1', label: 'Budín', items: [], recipeVersionId: 'rv1' }, opcion('Fruta', [item('banana', 100)])])] };
  const r = R.rangosDelDia(dia, 0, COMPOSICIONES, NOMBRES, deLaReceta);
  assert.deepEqual(kcal(r.comidas[0].rango), ['44.5', '89']);
});

test('ED-34 · los textos de Nutrición no dicen «%» (DJ-7) ni califican', () => {
  const fuente = readFileSync(new URL('../src/app/pro/advisees/nutrition/rangos.ts', import.meta.url), 'utf8');
  const textos = [...fuente.matchAll(/'[^'\n]*'|`[^`\n]*`/g)].map((m) => m[0]);
  assert.ok(textos.length > 20);
  for (const t of textos) assert.doesNotMatch(t, /%|cumplimiento|adherencia|racha/i, t);
});

test('TEST-EDP-057 · quitar con contenido nombra lo que se va; sin contenido, no pregunta; nunca cambia la estructura', () => {
  const merienda = comida('Merienda', [opcion('A', [item('banana', 100), item('arroz', 50), item('pollo', 30)]), opcion('B', [item('banana', 1), item('arroz', 2), item('pollo', 3), item('otro', 4)])]);
  const antes = structuredClone(merienda);
  assert.equal(Q.alQuitarLaComida(merienda, 2), 'Quitar Merienda: 2 opciones y 7 alimentos');
  assert.deepEqual(merienda, antes);
  // Una comida recién creada, con su opción 1 vacía: se quita sin preguntar.
  assert.equal(Q.alQuitarLaComida(comida('', [opcion('Opción 1', [])]), 3), null);
  const conReceta = comida('Postre', [{ label: 'Budín', items: [], recipeVersionId: 'rv1' }, opcion('Fruta', [item('banana', 100)])]);
  assert.equal(Q.alQuitarLaComida(conReceta, 0), 'Quitar Postre: 2 opciones (1 de receta) y 1 alimento');
  const dia = { label: 'Entrenamiento', meals: [merienda, comida('Colación', [])] };
  assert.equal(Q.alQuitarElDia(dia, 0), 'Quitar Entrenamiento: 2 comidas, 2 opciones y 7 alimentos');
  assert.equal(Q.alQuitarElDia({ label: '', meals: [] }, 1), null);
  assert.equal(Q.alQuitarLaOpcion(opcion('Opción 2', [item('banana', 1)]), 1), 'Quitar Opción 2: 1 alimento');
  assert.equal(Q.alQuitarLaOpcion(opcion('Opción 2', []), 1), null);
});

test('ED-30 (DJ-7) · ningún texto de las pantallas de Nutrición dice «%»', () => {
  const carpeta = new URL('../src/app/pro/advisees/nutrition/', import.meta.url);
  for (const archivo of readdirSync(carpeta)) {
    const fuente = readFileSync(new URL(archivo, carpeta), 'utf8');
    // Lo que se ve: el texto entre etiquetas de JSX y las cadenas. Los comentarios no se leen en pantalla.
    const sinComentarios = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    const textos = [...sinComentarios.matchAll(/'[^'\n]*'|`[^`\n]*`|>[^<>{}\n]+</g)].map((m) => m[0]);
    for (const t of textos) assert.doesNotMatch(t, /\d\s?%|%\s|\bpor ciento\b/, `${archivo}: ${t}`);
  }
});

test('ED-31 · el total de la opción, con los nombres completos para el lector de pantalla (maqueta 08)', () => {
  const v = (exacto) => ({ exacto, faltan: [] });
  const total = { energyKcal: v(107), proteinG: v(1.3), carbohydrateG: v(27.4), fatG: { exacto: null, faltan: [] } };
  assert.equal(R.totalEnPalabras(total), 'Energía 107 kcal · Proteínas 1,3 g · Carbohidratos 27,4 g · Grasas sin dato');
  assert.equal(R.totalEnUnaLinea(total), '107 kcal · P 1,3 g · C 27,4 g · G Sin dato');
});
