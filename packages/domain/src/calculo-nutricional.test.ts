/**
 * El cálculo de energía y macros (`calculo-nutricional.ts`, DL-119) contra el paquete de Dirección del 2026-10-05
 * (`docs/fuente_nutricion/BE_Nutricion_Demo_2026-10-05`): los 11 casos numéricos exactos, el redondeo de presentación de
 * las tres recetas y los casos de comportamiento que el paquete deja para BE. Los resultados esperados se leen del
 * paquete y no se tocan: si una prueba falla, se corrige el cálculo, no el oráculo.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  aDecimal,
  calcularNutrientes,
  cantidadDeUnaPorcion,
  decimalExacto,
  dividirPorPorciones,
  METODO_DE_CALCULO_NUTRICIONAL,
  mismoValorExacto,
  NUTRIENTES_CALCULADOS,
  redondeoDePresentacion,
  ValorNoCalculable,
  type IngredienteDelCalculo,
  type NutrienteCalculado,
} from './calculo-nutricional';

const DATOS = join(__dirname, '..', '..', '..', 'docs', 'fuente_nutricion', 'BE_Nutricion_Demo_2026-10-05', 'datos');
const leer = (archivo: string) => JSON.parse(readFileSync(join(DATOS, archivo), 'utf8'));

interface AlimentoDelPaquete {
  id: string;
  nutrients_per_100g: Record<'energy_kcal' | 'carbohydrate_g' | 'fat_g' | 'protein_g' | 'fiber_g', string>;
}
interface RecetaDelPaquete {
  id: string;
  items: { food_id: string; quantity_g: string }[];
  servings: string;
  display_nutrients: Record<string, string>;
  expected_nutrients_unrounded: Record<string, string>;
}
const alimentos = new Map<string, AlimentoDelPaquete>((leer('alimentos_usda_100g.json').foods as AlimentoDelPaquete[]).map((a) => [a.id, a]));
const recetas = new Map<string, RecetaDelPaquete>((leer('recetas_demo.json').recipes as RecetaDelPaquete[]).map((r) => [r.id, r]));
const casos = leer('casos_calculo.json');

/** El nombre de cada nutriente en el paquete. */
const DEL_PAQUETE: Readonly<Record<NutrienteCalculado, string>> = { energyKcal: 'energy_kcal', carbohydrateG: 'carbohydrate_g', fatG: 'fat_g', proteinG: 'protein_g', fiberG: 'fiber_g' };

/** Los ingredientes de una receta del paquete como entrada del cálculo, con la composición como la guarda el catálogo. */
function ingredientesDe(receta: RecetaDelPaquete, reemplazos: Record<string, string> = {}): IngredienteDelCalculo[] {
  return receta.items.map((item) => {
    const a = alimentos.get(item.food_id)!;
    const n = a.nutrients_per_100g;
    return {
      clave: item.food_id,
      cantidad: { value: reemplazos[item.food_id] ?? item.quantity_g, unit: 'g' },
      // Como números de JS, igual que en la composición del catálogo: «130.0» llega como 130 y «28.17» como 28.17.
      composicion: { referenceAmount: '100g', energyKcal: Number(n.energy_kcal), carbohydrateG: Number(n.carbohydrate_g), fatG: Number(n.fat_g), proteinG: Number(n.protein_g), fiberG: Number(n.fiber_g) },
    };
  });
}

test('el método se llama como lo declara el paquete', () => {
  assert.equal(METODO_DE_CALCULO_NUTRICIONAL, 'SUM_SOURCE_PER_100G_V1');
  assert.equal(casos.method, 'SUM_SOURCE_PER_100G_V1');
});

test('los 11 casos numéricos del paquete dan exactamente lo esperado, sin redondeo intermedio', () => {
  assert.equal(casos.numeric_cases.length, 11);
  for (const caso of casos.numeric_cases) {
    const resultado = calcularNutrientes(ingredientesDe(recetas.get(caso.recipe_id)!, caso.quantity_overrides_g), caso.factor);
    for (const nutriente of NUTRIENTES_CALCULADOS) {
      const esperado = caso.expected[DEL_PAQUETE[nutriente]];
      const v = resultado.nutrientes[nutriente];
      assert.deepEqual(v.faltan, [], `${caso.id}: ${nutriente} no debería tener faltantes`);
      assert.ok(v.exacto !== null && mismoValorExacto(v.exacto, esperado), `${caso.id}: ${nutriente} da ${v.exacto}, se esperaba ${esperado}`);
    }
  }
});

test('las tres recetas: el exacto y el redondeo de presentación HALF_UP coinciden con la ficha', () => {
  for (const receta of recetas.values()) {
    const resultado = calcularNutrientes(ingredientesDe(receta));
    for (const nutriente of NUTRIENTES_CALCULADOS) {
      const exacto = resultado.nutrientes[nutriente].exacto!;
      assert.ok(mismoValorExacto(exacto, receta.expected_nutrients_unrounded[DEL_PAQUETE[nutriente]]), `${receta.id}: ${nutriente}`);
      assert.equal(redondeoDePresentacion(exacto, nutriente), receta.display_nutrients[DEL_PAQUETE[nutriente]], `${receta.id}: ${nutriente} al mostrar`);
    }
  }
  // Las anclas que el paquete calcula aparte para detectar alteraciones.
  const pollo = calcularNutrientes(ingredientesDe(recetas.get('BE-DEMO-NUT-001')!));
  assert.equal(pollo.nutrientes.energyKcal.exacto, '529.22');
  assert.equal(pollo.nutrientes.fatG.exacto, '13.186');
});

test('el recálculo del paquete: arroz de 160 a 200 g y sin los 8 g de aceite, por cero o por «no lo comí»', () => {
  const receta = recetas.get('BE-DEMO-NUT-001')!;
  const conMasArroz = calcularNutrientes(ingredientesDe(receta, { arroz_cocido: '200' }));
  assert.equal(conMasArroz.nutrientes.energyKcal.exacto, '581.22');
  assert.equal(conMasArroz.nutrientes.carbohydrateG.exacto, '67.838');
  const sinAceitePorCero = calcularNutrientes(ingredientesDe(receta, { aceite_oliva: '0' }));
  const sinAceiteDeclarado = calcularNutrientes(ingredientesDe(receta).map((i) => (i.clave === 'aceite_oliva' ? { ...i, noConsumido: true } : i)));
  for (const n of NUTRIENTES_CALCULADOS) assert.equal(sinAceiteDeclarado.nutrientes[n].exacto, sinAceitePorCero.nutrientes[n].exacto, n);
  assert.equal(sinAceiteDeclarado.nutrientes.energyKcal.exacto, '458.5');
  assert.equal(sinAceiteDeclarado.nutrientes.fatG.exacto, '5.186');
});

test('el doble se verifica antes de redondear: dos veces el exacto, no dos veces lo mostrado', () => {
  const receta = recetas.get('BE-DEMO-NUT-002')!;
  const simple = calcularNutrientes(ingredientesDe(receta));
  const doble = calcularNutrientes(ingredientesDe(receta), '2');
  for (const n of NUTRIENTES_CALCULADOS) {
    const dos = decimalExacto(simple.nutrientes[n].exacto!)!;
    assert.ok(mismoValorExacto(doble.nutrientes[n].exacto!, aDecimal({ n: dos.n * 2n, d: dos.d })), n);
  }
  // 24,155 g al doble es 48,31; redondear antes daría 48,4.
  assert.equal(redondeoDePresentacion(doble.nutrientes.fatG.exacto!, 'fatG'), '48.3');
});

test('un nutriente sin dato es desconocido, no cero: el total no se presenta y nombra al ingrediente', () => {
  const receta = recetas.get('BE-DEMO-NUT-001')!;
  const ingredientes = ingredientesDe(receta).map((i) => (i.clave === 'brocoli_cocido' ? { ...i, composicion: { ...i.composicion!, fiberG: null } } : i));
  const r = calcularNutrientes(ingredientes);
  assert.equal(r.nutrientes.fiberG.exacto, null);
  assert.deepEqual(r.nutrientes.fiberG.faltan, [{ clave: 'brocoli_cocido', motivo: 'SIN_DATO_DEL_NUTRIENTE' }]);
  // Los demás siguen completos y exactos.
  assert.equal(r.nutrientes.energyKcal.exacto, '529.22');
  // Ausente (undefined) es lo mismo que null: la composición vieja del catálogo no tiene fibra.
  const sinFibra = calcularNutrientes(ingredientesDe(receta).map((i) => ({ ...i, composicion: { ...i.composicion!, fiberG: undefined } })));
  assert.equal(sinFibra.nutrientes.fiberG.exacto, null);
  assert.equal(sinFibra.nutrientes.fiberG.faltan.length, receta.items.length);
});

test('una cantidad desconocida no se reemplaza por cero ni por la prevista', () => {
  const receta = recetas.get('BE-DEMO-NUT-003')!;
  const ingredientes = ingredientesDe(receta).map((i) => (i.clave === 'lentejas_cocidas' ? { ...i, cantidad: null } : i));
  const r = calcularNutrientes(ingredientes);
  for (const n of NUTRIENTES_CALCULADOS) {
    assert.equal(r.nutrientes[n].exacto, null, n);
    assert.deepEqual(r.nutrientes[n].faltan, [{ clave: 'lentejas_cocidas', motivo: 'SIN_CANTIDAD' }]);
  }
});

test('mililitros contra una composición cada 100 g, o «unidad», no se convierten: quedan sin dato', () => {
  const composicion = { referenceAmount: '100g' as const, energyKcal: 884, carbohydrateG: 0, fatG: 100, proteinG: 0, fiberG: 0 };
  const enMl = calcularNutrientes([{ clave: 'aceite', cantidad: { value: 10, unit: 'ml' }, composicion }]);
  const enUnidades = calcularNutrientes([{ clave: 'aceite', cantidad: { value: 1, unit: 'unit' }, composicion }]);
  for (const r of [enMl, enUnidades]) {
    assert.equal(r.nutrientes.energyKcal.exacto, null);
    assert.equal(r.nutrientes.energyKcal.faltan[0]!.motivo, 'UNIDAD_SIN_EQUIVALENCIA');
  }
  // Mililitros con una composición cada 100 ml sí se calculan.
  const leche = calcularNutrientes([{ clave: 'leche', cantidad: { value: 200, unit: 'ml' }, composicion: { ...composicion, referenceAmount: '100ml', energyKcal: 61 } }]);
  assert.equal(leche.nutrientes.energyKcal.exacto, '122');
});

test('una cantidad negativa o que no es un número se rechaza', () => {
  const composicion = { referenceAmount: '100g' as const, energyKcal: 100, carbohydrateG: 1, fatG: 1, proteinG: 1 };
  assert.throws(() => calcularNutrientes([{ clave: 'x', cantidad: { value: -5, unit: 'g' }, composicion }]), ValorNoCalculable);
  assert.throws(() => calcularNutrientes([{ clave: 'x', cantidad: { value: 'diez', unit: 'g' }, composicion }]), ValorNoCalculable);
  assert.throws(() => calcularNutrientes([{ clave: 'x', cantidad: { value: Number.NaN, unit: 'g' }, composicion }]), ValorNoCalculable);
});

test('por porción: la receta de una porción no cambia; dividir entre 3 guarda 6 decimales internos', () => {
  const receta = recetas.get('BE-DEMO-NUT-001')!;
  const total = calcularNutrientes(ingredientesDe(receta));
  assert.deepEqual(dividirPorPorciones(total, 1), total);
  const mitad = dividirPorPorciones(total, 2);
  assert.equal(mitad.nutrientes.energyKcal.exacto, '264.61');
  const tercio = dividirPorPorciones(total, 3);
  assert.equal(tercio.nutrientes.energyKcal.exacto, '176.406667');
  assert.throws(() => dividirPorPorciones(total, 0), ValorNoCalculable);
});

test('la porción de un ingrediente: exacta, o a 0,1 g HALF_UP si no da un decimal', () => {
  assert.equal(cantidadDeUnaPorcion(120, 1), 120);
  assert.equal(cantidadDeUnaPorcion(160, 2), 80);
  assert.equal(cantidadDeUnaPorcion(100, 3), 33.3);
  assert.equal(cantidadDeUnaPorcion(5, 2), 2.5);
  assert.equal(cantidadDeUnaPorcion('0.25', 2), 0.1);
});

test('la escritura decimal se lee exacta, también la de un número de JS', () => {
  assert.deepEqual(decimalExacto('28.17'), { n: 2817n, d: 100n });
  assert.deepEqual(decimalExacto(28.17), { n: 2817n, d: 100n });
  assert.deepEqual(decimalExacto('130.0'), { n: 130n, d: 1n });
  assert.deepEqual(decimalExacto('.5'), { n: 1n, d: 2n });
  assert.deepEqual(decimalExacto('1e-3'), { n: 1n, d: 1000n });
  assert.equal(decimalExacto('abc'), null);
  assert.equal(decimalExacto(Number.POSITIVE_INFINITY), null);
  assert.equal(redondeoDePresentacion('56.55', 'carbohydrateG'), '56.6');
  assert.equal(redondeoDePresentacion('529.5', 'energyKcal'), '530');
  assert.equal(redondeoDePresentacion('43.964', 'proteinG'), '44.0');
});
