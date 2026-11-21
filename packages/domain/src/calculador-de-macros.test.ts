/**
 * WP-OBJETIVO-Y-CALCULADOR (DL-186) · El calculador de macros del profesional. Lo que fija esta prueba:
 * - cada ecuación del gasto en reposo da lo que dan sus coeficientes publicados (Mifflin-St Jeor 1990, Harris-Benedict
 *   revisada por Roza y Shizgal 1984, FAO/OMS/UNU 1985 por franja de edad, Katch-McArdle, Cunningham 1980 y, desde RP-09
 *   de DL-188, ten Haaf y Weijs 2014 en sus dos variantes), con la
 *   fórmula y los números a la vista;
 * - si falta un dato, el método dice cuál, y no inventa nada; fuera de la población de la ecuación, lo dice;
 * - el gasto total, el ajuste del profesional, los macros en g/kg y los carbohidratos por diferencia, con el «%» sobre
 *   la energía del día;
 * - la propuesta de rangos por día y por comida, con la tolerancia y el reparto que elige el profesional.
 * Los valores esperados se calcularon a mano con los coeficientes de cada publicación: si una prueba falla, se corrige la
 * cuenta, no el oráculo.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  calcularObjetivo,
  datosQueFaltan,
  FICHA_DEL_METODO_DE_REPOSO,
  declaracionCompartible,
  declaracionDelCalculo,
  gastoEnReposo,
  macrosDelDia,
  notaDeLaPoblacion,
  porcentajesQueSuman100,
  problemasDelReparto,
  propuestaDeRangos,
  repartirEnteros,
  repartoParejo,
  repartoSugerido,
} from './calculador-de-macros';
import { LIMITES_DE_LOS_GRAMOS_POR_KG, METODOS_DE_REPOSO, ObjetivoConReferenciaRequestSchema, ParametrosDelCalculoSchema, ResultadoDelCalculoSchema, type DatosUsados, type ParametrosDelCalculo } from './contratos-objetivo-y-calculador';

const MUJER = { weightKg: 68, heightCm: 162, ageYears: 45, sex: 'FEMALE' as const, leanMassKg: 46.5 };
const HOMBRE = { weightKg: 70, heightCm: 175, ageYears: 30, sex: 'MALE' as const, leanMassKg: 55 };
const kcal = (r: ReturnType<typeof gastoEnReposo>) => (r.state === 'CALCULATED' ? r.kcal : r.state);
const PARAMETROS_DE_TEN_HAAF = { sex: 'MALE', restingMethod: 'TEN_HAAF_2014_WEIGHT', activity: { factor: 1.7, restDayFactor: null }, adjustment: null, macros: null } as const;

test('Mifflin-St Jeor (1990): 10 × peso + 6,25 × talla − 5 × edad, +5 en hombres y −161 en mujeres', () => {
  const m = gastoEnReposo('MIFFLIN_ST_JEOR', MUJER);
  assert.equal(kcal(m), 1307); // 680 + 1.012,5 − 225 − 161 = 1.306,5: la mitad sube
  assert.ok(m.state === 'CALCULATED');
  assert.equal(m.equation, '10 × peso (kg) + 6,25 × talla (cm) − 5 × edad (años) − 161');
  assert.equal(m.applied, '10 × 68 + 6,25 × 162 − 5 × 45 − 161 = 1.306,5');
  assert.equal(kcal(gastoEnReposo('MIFFLIN_ST_JEOR', HOMBRE)), 1649); // 700 + 1.093,75 − 150 + 5 = 1.648,75
});

test('Harris-Benedict revisada (Roza y Shizgal, 1984), con la constante adelante', () => {
  const h = gastoEnReposo('HARRIS_BENEDICT_REVISED', HOMBRE);
  assert.equal(kcal(h), 1696); // 88,362 + 937,79 + 839,825 − 170,31 = 1.695,667
  assert.ok(h.state === 'CALCULATED' && h.equation.startsWith('88,362 + 13,397 × peso (kg)'));
  assert.equal(kcal(gastoEnReposo('HARRIS_BENEDICT_REVISED', MUJER)), 1383); // 447,593 + 628,796 + 501,876 − 194,85 = 1.383,415
});

test('FAO/OMS/UNU (1985): la ecuación de la franja de edad y sexo, solo con el peso', () => {
  assert.equal(kcal(gastoEnReposo('FAO_WHO_UNU_1985', HOMBRE)), 1691); // 30 años: 11,6 × 70 + 879
  assert.equal(kcal(gastoEnReposo('FAO_WHO_UNU_1985', MUJER)), 1421); // 30 a 59: 8,7 × 68 + 829 = 1.420,6
  assert.equal(kcal(gastoEnReposo('FAO_WHO_UNU_1985', { ...MUJER, weightKg: 60, ageYears: 25 })), 1378); // 14,7 × 60 + 496
  const mayor = gastoEnReposo('FAO_WHO_UNU_1985', { ...HOMBRE, weightKg: 75, ageYears: 65 });
  assert.equal(kcal(mayor), 1500); // 13,5 × 75 + 487 = 1.499,5
  assert.ok(mayor.state === 'CALCULATED' && mayor.equation.endsWith('(hombres de 60 años o más)'));
  // La talla no hace falta: no la pide.
  assert.deepEqual(datosQueFaltan('FAO_WHO_UNU_1985', { ...MUJER, heightCm: null }), []);
});

test('Katch-McArdle y Cunningham (1980): con la masa libre de grasa, sin sexo ni edad', () => {
  assert.equal(kcal(gastoEnReposo('KATCH_MCARDLE', { ...HOMBRE, sex: null, ageYears: null })), 1558); // 370 + 21,6 × 55
  assert.equal(kcal(gastoEnReposo('CUNNINGHAM_1980', { ...HOMBRE, sex: null, ageYears: null })), 1710); // 500 + 22 × 55
  const c = gastoEnReposo('CUNNINGHAM_1980', HOMBRE);
  assert.ok(c.state === 'CALCULATED' && c.applied === '500 + 22 × 55 = 1.710');
});

test('RP-09 · ten Haaf y Weijs (2014), con el peso: como se publicó, con la talla en metros y el sexo 1 o 0', () => {
  const m = gastoEnReposo('TEN_HAAF_2014_WEIGHT', MUJER);
  // 11,936 × 68 + 587,728 × 1,62 − 8,129 × 45 + 191,027 × 0 + 29,279 = 811,648 + 952,11936 − 365,805 + 0 + 29,279 = 1.427,24136
  assert.equal(kcal(m), 1427);
  assert.ok(m.state === 'CALCULATED');
  assert.equal(m.equation, '11,936 × peso (kg) + 587,728 × talla (m) − 8,129 × edad (años) + 191,027 × sexo (1 hombre, 0 mujer) + 29,279');
  assert.equal(m.applied, '11,936 × 68 + 587,728 × 1,62 − 8,129 × 45 + 191,027 × 0 + 29,279 = 1.427,2');
  // 835,52 + 1.028,524 − 243,87 + 191,027 + 29,279 = 1.840,48
  assert.equal(kcal(gastoEnReposo('TEN_HAAF_2014_WEIGHT', HOMBRE)), 1840);
  assert.deepEqual(datosQueFaltan('TEN_HAAF_2014_WEIGHT', { ...MUJER, sex: null, heightCm: null }), ['heightCm', 'sex']);
  // Fuera de la franja con que se publicó: se dice, sin bloquear; dentro, nada.
  assert.match(notaDeLaPoblacion('TEN_HAAF_2014_WEIGHT', MUJER) ?? '', /18 a 35 años: con 45 años/);
  assert.equal(notaDeLaPoblacion('TEN_HAAF_2014_WEIGHT', HOMBRE), null);
  assert.equal(notaDeLaPoblacion('MIFFLIN_ST_JEOR', MUJER), null);
});

test('RP-09 · ten Haaf y Weijs (2014), con la masa libre de grasa: 22,771 × MLG + 484,264', () => {
  const m = gastoEnReposo('TEN_HAAF_2014_LEAN_MASS', { ...MUJER, sex: null, ageYears: null });
  // 22,771 × 46,5 + 484,264 = 1.058,8515 + 484,264 = 1.543,1155
  assert.equal(kcal(m), 1543);
  assert.ok(m.state === 'CALCULATED' && m.applied === '22,771 × 46,5 + 484,264 = 1.543,1');
  assert.equal(kcal(gastoEnReposo('TEN_HAAF_2014_LEAN_MASS', HOMBRE)), 1737); // 1.252,405 + 484,264 = 1.736,669
  assert.equal(gastoEnReposo('TEN_HAAF_2014_LEAN_MASS', { ...MUJER, leanMassKg: 70 }).state, 'OUT_OF_RANGE');
  // Cada método dice para quién sirve, en pocas palabras, y su cita es la del artículo original.
  for (const m of METODOS_DE_REPOSO) assert.ok(FICHA_DEL_METODO_DE_REPOSO[m].paraQuien.length > 0 && FICHA_DEL_METODO_DE_REPOSO[m].paraQuien.length <= 50, m);
  assert.ok(FICHA_DEL_METODO_DE_REPOSO.TEN_HAAF_2014_WEIGHT.cita.includes('PLoS One. 2014;9(10):e108460'));
  assert.equal(ParametrosDelCalculoSchema.safeParse({ ...PARAMETROS_DE_TEN_HAAF }).success, true);
});

test('RP-05 · los g/kg de un cálculo nuevo tienen sus límites con nombre; lo ya guardado se sigue leyendo', () => {
  assert.deepEqual(LIMITES_DE_LOS_GRAMOS_POR_KG, { proteina: { minimo: 0.6, maximo: 3, paso: 0.1 }, grasa: { minimo: 0.5, maximo: 2.5, paso: 0.1 } });
  // Un cálculo viejo con 3,5 g/kg de proteína (append-only) sigue pasando el contrato de lectura.
  assert.equal(ParametrosDelCalculoSchema.safeParse({ ...PARAMETROS_DE_TEN_HAAF, macros: { base: 'BODY_WEIGHT', proteinPerKg: 3.5, fatPerKg: 2.8 } }).success, true);
});

test('si falta un dato, el método dice cuál; fuera de su población, lo dice; nunca inventa', () => {
  assert.deepEqual(gastoEnReposo('MIFFLIN_ST_JEOR', { ...MUJER, heightCm: null, sex: null }), { state: 'MISSING_DATA', method: 'MIFFLIN_ST_JEOR', missing: ['heightCm', 'sex'] });
  assert.deepEqual(gastoEnReposo('KATCH_MCARDLE', { ...MUJER, leanMassKg: null }), { state: 'MISSING_DATA', method: 'KATCH_MCARDLE', missing: ['leanMassKg'] });
  assert.equal(gastoEnReposo('MIFFLIN_ST_JEOR', { ...MUJER, ageYears: 17 }).state, 'OUT_OF_RANGE');
  assert.equal(gastoEnReposo('CUNNINGHAM_1980', { ...MUJER, leanMassKg: 68 }).state, 'OUT_OF_RANGE');
});

const usados = (d: typeof MUJER): DatosUsados => ({
  weightKg: { value: d.weightKg, origin: 'MEASUREMENT' },
  heightCm: { value: d.heightCm, origin: 'MEASUREMENT' },
  ageYears: { value: d.ageYears, origin: 'MANUAL' },
  leanMassKg: { value: d.leanMassKg, origin: 'CALCULATION', method: 'Masa libre de grasa (Durnin y Womersley)', bodyFatValue: null },
});
const PARAMETROS: ParametrosDelCalculo = {
  sex: 'FEMALE',
  restingMethod: 'MIFFLIN_ST_JEOR',
  activity: { factor: 1.55, restDayFactor: 1.4 },
  adjustment: { kind: 'KCAL', value: -300 },
  macros: { base: 'BODY_WEIGHT', proteinPerKg: 1.8, fatPerKg: 0.9 },
};

test('el cálculo entero: gasto total, ajuste y macros con los carbohidratos por diferencia', () => {
  const r = calcularObjetivo(usados(MUJER), PARAMETROS);
  ResultadoDelCalculoSchema.parse(r);
  // 1.306,5 × 1,55 = 2.025,075 y × 1,40 = 1.829,1: el gasto total sale del exacto, no del redondeado.
  assert.deepEqual(r.totals, { day: 2025, restDay: 1829 });
  assert.deepEqual(r.energy, { day: 1725, restDay: 1529 });
  assert.ok(r.macros);
  assert.deepEqual(r.macros.day, {
    energyKcal: 1725,
    protein: { grams: 122, perKg: 1.8, kcal: 488, energyShare: 28.3 }, // 1,8 × 68 = 122,4
    carbohydrate: { grams: 172, perKg: 2.53, kcal: 688, energyShare: 39.9 }, // (1.725 − 488 − 549) / 4
    fat: { grams: 61, perKg: 0.9, kcal: 549, energyShare: 31.8 }, // 0,9 × 68 = 61,2
  });
  assert.equal(r.macros.restDay?.carbohydrate.grams, 123); // (1.529 − 1.037) / 4
  assert.deepEqual(r.issues, []);
  // El ajuste en porcentaje: 2.025 × 0,85.
  assert.deepEqual(calcularObjetivo(usados(MUJER), { ...PARAMETROS, adjustment: { kind: 'PERCENT', value: -15 } }).energy, { day: 1721, restDay: 1555 });
  // Por la masa libre de grasa: 1,8 × 46,5 = 83,7.
  assert.equal(calcularObjetivo(usados(MUJER), { ...PARAMETROS, macros: { base: 'LEAN_MASS', proteinPerKg: 1.8, fatPerKg: 0.9 } }).macros?.day.protein.grams, 84);
});

test('lo que no cierra se dice: sin masa libre de grasa, sin peso, o carbohidratos que no alcanzan', () => {
  const sinMasa = calcularObjetivo({ ...usados(MUJER), leanMassKg: null }, { ...PARAMETROS, macros: { base: 'LEAN_MASS', proteinPerKg: 2, fatPerKg: 1 } });
  assert.deepEqual([sinMasa.macros, sinMasa.issues], [null, ['LEAN_MASS_MISSING']]);
  const sinTalla = calcularObjetivo({ ...usados(MUJER), heightCm: null }, PARAMETROS);
  assert.deepEqual([sinTalla.resting.state, sinTalla.totals, sinTalla.energy, sinTalla.macros], ['MISSING_DATA', null, null, null]);
  const poco = calcularObjetivo(usados(MUJER), { ...PARAMETROS, adjustment: { kind: 'KCAL', value: -1000 }, macros: { base: 'BODY_WEIGHT', proteinPerKg: 2.5, fatPerKg: 1.5 } });
  assert.equal(poco.macros?.day.carbohydrate.grams, 0);
  assert.deepEqual(poco.issues, ['CARBOHYDRATE_NEGATIVE']);
  assert.deepEqual(macrosDelDia(0, 70, 1, 1).macros.protein.energyShare, 0);
});

test('los topes de lo que se escribe', () => {
  assert.equal(ParametrosDelCalculoSchema.safeParse({ ...PARAMETROS, activity: { factor: 3, restDayFactor: null } }).success, false);
  assert.equal(ParametrosDelCalculoSchema.safeParse({ ...PARAMETROS, adjustment: { kind: 'PERCENT', value: -60 } }).success, false);
  assert.equal(ParametrosDelCalculoSchema.safeParse({ ...PARAMETROS, extra: 1 }).success, false);
  const referencia = { source: 'MANUAL', measuredOn: '2026-11-10', weightKg: 68, heightCm: null, ageYears: 45, leanMassKg: null, leanMassNote: null };
  const objetivo = {
    evaluationId: 'e1',
    effectiveFrom: '2026-11-19T12:00:00.000Z',
    effectiveUntil: null,
    estimatedEnergyRequirement: { value: 1725, unit: 'kcal/day' },
    macronutrientDistribution: { protein: { value: 122, unit: 'g/day' }, carbohydrate: { value: 172, unit: 'g/day' }, fat: { value: 61, unit: 'g/day' } },
    mealDistribution: null,
    rationale: 'Sostener el peso',
    methodStatement: null,
  };
  assert.equal(ObjetivoConReferenciaRequestSchema.safeParse({ objective: objetivo, reference: referencia, parameters: PARAMETROS }).success, true);
  assert.equal(ObjetivoConReferenciaRequestSchema.safeParse({ objective: objetivo, reference: { ...referencia, weightKg: 10 }, parameters: null }).success, false);
});

test('la declaración del método, para que quede con la versión del objetivo', () => {
  assert.equal(
    declaracionDelCalculo(PARAMETROS, 'con la toma del 10/11'),
    'Estimación: Mifflin-St Jeor (1990) con la toma del 10/11 · factor de actividad 1,55 (descanso 1,4) · ajuste −300 kcal · proteína 1,8 g/kg y grasa 0,9 g/kg del peso, carbohidratos por diferencia.',
  );
  const enPorcentaje = { ...PARAMETROS, adjustment: { kind: 'PERCENT', value: -15 } } as const;
  assert.match(declaracionDelCalculo(enPorcentaje, 'a mano', calcularObjetivo(usados(MUJER), enPorcentaje)), /ajuste −15 % de las 2.025 kcal del gasto total/);
});

test('lo que va al objetivo no deja deducir datos de Antropometría: ni la toma, ni el factor, ni el ajuste, ni los g/kg', () => {
  const d = declaracionCompartible(PARAMETROS);
  assert.equal(d, 'Estimación de partida con el calculador de BE: gasto en reposo por Mifflin-St Jeor (1990), carbohidratos por diferencia.');
  assert.doesNotMatch(d, /toma|factor|ajuste|g\/kg|\d+,\d/);
});

test('un déficit mayor que el gasto total: la energía no positiva se dice y no hay macros', () => {
  // Mifflin, mujer de 50 kg, 150 cm y 80 años: 500 + 937,5 − 400 − 161 = 876,5; × 1,4 = 1.227; − 1.500 = −273.
  const r = calcularObjetivo(usados({ ...MUJER, weightKg: 50, heightCm: 150, ageYears: 80 }), { ...PARAMETROS, activity: { factor: 1.4, restDayFactor: null }, adjustment: { kind: 'KCAL', value: -1500 } });
  ResultadoDelCalculoSchema.parse(r);
  assert.deepEqual([r.energy, r.macros, r.issues], [{ day: -273, restDay: null }, null, ['ENERGY_NOT_POSITIVE']]);
});

test('la propuesta de rangos: el día con su tolerancia y cada comida con el reparto que elige el profesional', () => {
  assert.deepEqual(porcentajesQueSuman100([1, 1, 1]), [34, 33, 33]);
  assert.deepEqual(repartoParejo(4).map((c) => c.protein), [25, 25, 25, 25]);
  const reparto = repartoSugerido(['Desayuno', 'Almuerzo', 'Merienda', 'Cena']);
  // Más carbohidratos en el desayuno y el almuerzo; la merienda, con más proteína y grasa que carbohidratos.
  assert.deepEqual(reparto, [
    { protein: 22, carbohydrate: 32, fat: 20 },
    { protein: 26, carbohydrate: 35, fat: 24 },
    { protein: 26, carbohydrate: 14, fat: 32 },
    { protein: 26, carbohydrate: 19, fat: 24 },
  ]);
  assert.deepEqual(problemasDelReparto(reparto), []);
  const p = propuestaDeRangos({ protein: 122, carbohydrate: 172, fat: 61 }, 10, reparto);
  assert.ok(p);
  assert.deepEqual(p.dia, { protein: { min: 110, max: 134 }, carbohydrate: { min: 155, max: 189 }, fat: { min: 55, max: 67 } });
  // Cada comida, su parte del mínimo y del máximo del día, por el resto mayor. Desayuno: proteínas 110 × 22 % = 24,2 → 24
  // y 134 × 22 % = 29,48 → 29 (los tres 34,84 del resto se llevan el gramo que falta); carbohidratos 155 × 32 % = 49,6 → 50
  // y 189 × 32 % = 60,48 → 61; grasas 55 × 20 % = 11 y 67 × 20 % = 13,4 → 13.
  assert.deepEqual(p.comidas[0], { protein: { min: 24, max: 29 }, carbohydrate: { min: 50, max: 61 }, fat: { min: 11, max: 13 } });
  // Sumadas, las comidas dan exactamente el rango del día.
  for (const m of ['protein', 'carbohydrate', 'fat'] as const) {
    assert.equal(p.comidas.reduce((s, c) => s + c[m].min, 0), p.dia[m].min);
    assert.equal(p.comidas.reduce((s, c) => s + c[m].max, 0), p.dia[m].max);
  }
  assert.deepEqual(repartirEnteros(10, [1, 1, 1]), [4, 3, 3]);
  // Un reparto que no suma 100 % no propone nada, y dice qué macro y cuánto suma.
  const malo = [...reparto.slice(0, 3), { protein: 26, carbohydrate: 10, fat: 24 }];
  assert.deepEqual(problemasDelReparto(malo), [{ macro: 'carbohydrate', suma: 91 }]);
  assert.equal(propuestaDeRangos({ protein: 122, carbohydrate: 172, fat: 61 }, 10, malo), null);
  // Con tolerancia cero, el número exacto; sin comidas, solo el día.
  assert.deepEqual(propuestaDeRangos({ protein: 100, carbohydrate: 0, fat: 50 }, 0, [])?.dia.protein, { min: 100, max: 100 });
});
