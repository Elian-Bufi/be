/**
 * API-PLN-02 y API-PLN-03 (decisión de Dirección del 2026-11-13, «Último peso, guardado en gramos») · La cuenta de los
 * rangos de macronutrientes. Lo que fija esta prueba:
 * - gramos por kilo a gramos, con el redondeo al gramo (la mitad hacia arriba) y sin errores de coma flotante;
 * - lo desconocido nunca es cero: un límite sin escribir queda `null`, y lo que no se entiende se rechaza con su lugar;
 * - sin peso, nada en gramos por kilo; con un peso, se guarda solo si algo lo usa;
 * - lo guardado no se mueve con un peso más nuevo, que solo se avisa;
 * - sin permiso para ver el peso registrado, se retienen el peso y los gramos por kilo.
 * Los valores esperados se calcularon a mano: si una prueba falla, se corrige la cuenta, no el oráculo.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EscribirRangosRequestSchema, RangosDelPlanSchema, type PesoDeReferencia, type RangosDeDiaTipoEntrada } from './contratos-rangos-de-nutricion';
import { escalado, gramosDesdeGramosPorKilo, nodosDelPlan, pesoAlDecimo, pesoMasNuevo, problemasDelPesoManual, rangosParaGuardar, rangosParaMostrar } from './rangos-de-nutricion';

const NODOS = nodosDelPlan([
  { dayTypeId: 'd1', meals: [{ mealId: 'm1' }, { mealId: 'm2' }] },
  { dayTypeId: 'd2', meals: [{ mealId: 'm3' }] },
]);
const REGISTRADO_78: PesoDeReferencia = { source: 'RECORDED', valueKg: 78, measuredOn: '2026-11-10', measurementId: 'med-78' };
const A_MANO_80: PesoDeReferencia = { source: 'MANUAL', valueKg: 80, measuredOn: '2026-11-12', measurementId: null };
const dia = (day: RangosDeDiaTipoEntrada['day'], meals: RangosDeDiaTipoEntrada['meals'] = [], dayTypeId = 'd1'): RangosDeDiaTipoEntrada => ({ dayTypeId, day, meals });

test('g/kg a gramos: g/kg × kg, redondeado al gramo con la mitad hacia arriba', () => {
  const casos: [number, number, number][] = [
    [1.6, 78, 125], // 124,8
    [2, 78, 156],
    [1.25, 78.5, 98], // 98,125
    [0.25, 50, 13], // 12,5: la mitad sube
    [0.15, 70, 11], // 10,5 (0,15 no es exacto en coma flotante)
    [1.15, 100.1, 115], // 115,115
    [0, 78, 0], // un cero escrito es cero
    [20, 350, 7000],
  ];
  for (const [gPorKg, kg, esperado] of casos) assert.equal(gramosDesdeGramosPorKilo(gPorKg, kg), esperado, `${gPorKg} g/kg con ${kg} kg`);
});

test('lo desconocido nunca es cero: sin valor, sin peso o con más decimales, no hay gramos', () => {
  for (const [g, kg] of [
    [null, 78],
    [1.6, null],
    [undefined, 78],
    [Number.NaN, 78],
    [1.6, Number.POSITIVE_INFINITY],
    [-1, 78],
    [1.234, 78],
    [1.6, 78.25],
  ] as [number | null | undefined, number | null][]) {
    assert.equal(gramosDesdeGramosPorKilo(g, kg), null, `${g} con ${kg}`);
  }
  assert.equal(escalado('1,6', 2), null);
  assert.equal(escalado(1.1, 1), 11);
});

test('el peso registrado se usa al décimo de kilo, con la mitad hacia arriba', () => {
  assert.deepEqual([72.35, 72.3499, 78, 80.05, 64.25].map(pesoAlDecimo), [72.4, 72.3, 78, 80.1, 64.3]);
  assert.deepEqual([0, -1, Number.NaN].map(pesoAlDecimo), [null, null, null]);
});

test('API-PLN-03 · en gramos se guarda lo escrito; en g/kg, los gramos y el peso del que salieron', () => {
  const r = rangosParaGuardar(
    [dia({ protein: { unit: 'g_per_kg', min: 1.6, max: 2 }, carbohydrate: { unit: 'g', min: 250, max: null } }, [{ mealId: 'm2', range: { fat: { unit: 'g', min: null, max: 25.5 } } }])],
    REGISTRADO_78,
    NODOS,
  );
  assert.ok(r.ok);
  assert.deepEqual(r.contenido, {
    bodyWeight: REGISTRADO_78,
    dayTypes: [
      {
        dayTypeId: 'd1',
        day: {
          protein: { unit: 'g_per_kg', perKg: { min: 1.6, max: 2 }, grams: { min: 125, max: 156 } },
          carbohydrate: { unit: 'g', perKg: null, grams: { min: 250, max: null } },
        },
        meals: [{ mealId: 'm2', range: { fat: { unit: 'g', perKg: null, grams: { min: null, max: 25.5 } } } }],
      },
    ],
  });
  // Un límite que falta sigue faltando: nunca se guarda como cero.
  assert.equal(r.contenido.dayTypes[0]!.day!.carbohydrate!.grams.max, null);
});

test('API-PLN-03 · el peso se guarda solo si algo va en g/kg; sin peso, g/kg no se guarda', () => {
  const soloGramos = rangosParaGuardar([dia({ protein: { unit: 'g', min: 100, max: 140 } })], A_MANO_80, NODOS);
  assert.ok(soloGramos.ok);
  assert.equal(soloGramos.contenido.bodyWeight, null);
  const sinPeso = rangosParaGuardar([dia({ protein: { unit: 'g_per_kg', min: 1.6, max: 2 } }), dia(null, [{ mealId: 'm3', range: { fat: { unit: 'g_per_kg', min: 0.8, max: null } } }], 'd2')], null, NODOS);
  assert.deepEqual(sinPeso, { ok: false, issues: [{ code: 'BODY_WEIGHT_REQUIRED', path: 'bodyWeight' }] });
});

test('API-PLN-03 · lo que no se entiende se rechaza con su lugar, y nada se guarda a medias', () => {
  const r = rangosParaGuardar(
    [
      dia({ protein: { unit: 'g', min: null, max: null }, fat: { unit: 'g', min: 90, max: 60 }, carbohydrate: { unit: 'g', min: 10.25, max: 2500 } }, [
        { mealId: 'm9', range: { fat: { unit: 'g', min: 1, max: 2 } } },
        { mealId: 'm1', range: {} },
      ]),
      dia(null, [{ mealId: 'm3', range: { protein: { unit: 'g_per_kg', min: 1.234, max: 25 } } }], 'd2'),
      dia(null, [], 'd2'),
      dia(null, [], 'otro'),
    ],
    A_MANO_80,
    NODOS,
  );
  assert.equal(r.ok, false);
  assert.deepEqual(!r.ok && r.issues, [
    { code: 'RANGE_BOUND_REQUIRED', path: 'dayTypes.0.day.protein' },
    { code: 'RANGE_VALUE_OUT_OF_BOUNDS', path: 'dayTypes.0.day.carbohydrate.min' },
    { code: 'RANGE_VALUE_OUT_OF_BOUNDS', path: 'dayTypes.0.day.carbohydrate.max' },
    { code: 'RANGE_MIN_ABOVE_MAX', path: 'dayTypes.0.day.fat' },
    { code: 'RANGE_TARGET_NOT_IN_PLAN', path: 'dayTypes.0.meals.0.mealId' },
    { code: 'RANGE_EMPTY', path: 'dayTypes.0.meals.1.range' },
    { code: 'RANGE_VALUE_OUT_OF_BOUNDS', path: 'dayTypes.1.meals.0.range.protein.min' },
    { code: 'RANGE_VALUE_OUT_OF_BOUNDS', path: 'dayTypes.1.meals.0.range.protein.max' },
    { code: 'RANGE_TARGET_REPEATED', path: 'dayTypes.2.dayTypeId' },
    { code: 'RANGE_TARGET_NOT_IN_PLAN', path: 'dayTypes.3.dayTypeId' },
  ]);
  // El contrato no deja pasar un número que no es número ni un límite negativo.
  assert.equal(EscribirRangosRequestSchema.safeParse({ expectedRevision: 0, bodyWeight: null, dayTypes: [dia({ protein: { unit: 'g', min: -1, max: null } })] }).success, false);
  assert.equal(EscribirRangosRequestSchema.safeParse({ expectedRevision: 0, bodyWeight: null, dayTypes: [dia({ protein: { unit: 'g', min: '100', max: null } } as never)] }).success, false);
});

test('el peso a mano: entre 20 y 350 kg, con un decimal y sin fecha futura', () => {
  assert.deepEqual(problemasDelPesoManual(78.5, '2026-11-12', '2026-11-13'), []);
  assert.deepEqual(problemasDelPesoManual(78.55, '2026-11-14', '2026-11-13'), [
    { code: 'BODY_WEIGHT_OUT_OF_BOUNDS', path: 'bodyWeight.valueKg' },
    { code: 'BODY_WEIGHT_DATE_IN_FUTURE', path: 'bodyWeight.measuredOn' },
  ]);
  assert.equal(problemasDelPesoManual(0, '2026-11-12', '2026-11-13').length, 1);
  assert.equal(problemasDelPesoManual(400, '2026-11-12', '2026-11-13').length, 1);
});

test('un pesaje nuevo no mueve lo guardado: leer devuelve los mismos gramos y solo se avisa el peso más nuevo', () => {
  const guardado = rangosParaGuardar([dia({ protein: { unit: 'g_per_kg', min: 1.6, max: 2 } })], REGISTRADO_78, NODOS);
  assert.ok(guardado.ok);
  const ultimo = { measurementId: 'med-80', valueKg: 80, measuredOn: '2026-11-12' };
  const leido = rangosParaMostrar(guardado.contenido, NODOS, true);
  assert.deepEqual(leido.dayTypes[0]!.day!.protein!.grams, { min: 125, max: 156 });
  assert.deepEqual(leido.bodyWeight, REGISTRADO_78);
  assert.deepEqual(pesoMasNuevo(leido.bodyWeight, ultimo), ultimo);
  // El mismo peso, uno más viejo o ninguno: no hay aviso.
  assert.equal(pesoMasNuevo(leido.bodyWeight, { measurementId: 'med-78', valueKg: 78, measuredOn: '2026-11-10' }), null);
  assert.equal(pesoMasNuevo(leido.bodyWeight, { measurementId: 'med-70', valueKg: 70, measuredOn: '2026-11-01' }), null);
  assert.equal(pesoMasNuevo(leido.bodyWeight, null), null);
  assert.equal(pesoMasNuevo(null, ultimo), null);
  // Con un peso a mano, avisa uno registrado de una fecha posterior.
  assert.equal(pesoMasNuevo(A_MANO_80, ultimo), null);
  assert.deepEqual(pesoMasNuevo(A_MANO_80, { ...ultimo, measuredOn: '2026-11-13' }), { ...ultimo, measuredOn: '2026-11-13' });
});

test('sin permiso para ver el peso registrado, se retienen el peso y los g/kg; los gramos quedan', () => {
  const guardado = rangosParaGuardar([dia({ protein: { unit: 'g_per_kg', min: 1.6, max: 2 }, fat: { unit: 'g', min: 60, max: 80 } })], REGISTRADO_78, NODOS);
  assert.ok(guardado.ok);
  const sinPermiso = rangosParaMostrar(guardado.contenido, NODOS, false);
  assert.equal(sinPermiso.bodyWeight, null);
  assert.equal(sinPermiso.bodyWeightWithheld, true);
  assert.deepEqual(sinPermiso.dayTypes[0]!.day, {
    protein: { unit: 'g_per_kg', perKg: null, grams: { min: 125, max: 156 } },
    fat: { unit: 'g', perKg: null, grams: { min: 60, max: 80 } },
  });
  assert.doesNotMatch(JSON.stringify(sinPermiso), /78|med-78|1\.6/);
  // Un peso cargado a mano lo escribió el profesional: se ve con o sin Antropometría.
  const aMano = rangosParaGuardar([dia({ protein: { unit: 'g_per_kg', min: 1.6, max: 2 } })], A_MANO_80, NODOS);
  assert.ok(aMano.ok);
  const leido = rangosParaMostrar(aMano.contenido, NODOS, false);
  assert.deepEqual([leido.bodyWeight, leido.bodyWeightWithheld, leido.dayTypes[0]!.day!.protein], [A_MANO_80, false, { unit: 'g_per_kg', perKg: { min: 1.6, max: 2 }, grams: { min: 128, max: 160 } }]);
});

test('API-PLN-02 · lo de un día tipo o una comida que el borrador ya no tiene no se lee', () => {
  const guardado = rangosParaGuardar(
    [dia({ fat: { unit: 'g', min: 60, max: 80 } }, [{ mealId: 'm1', range: { fat: { unit: 'g', min: 10, max: 20 } } }]), dia(null, [{ mealId: 'm3', range: { fat: { unit: 'g', min: 5, max: 9 } } }], 'd2')],
    null,
    NODOS,
  );
  assert.ok(guardado.ok);
  const sinM1niD2 = rangosParaMostrar(guardado.contenido, nodosDelPlan([{ dayTypeId: 'd1', meals: [{ mealId: 'm2' }] }]), true);
  assert.deepEqual(sinM1niD2.dayTypes, [{ dayTypeId: 'd1', day: { fat: { unit: 'g', perKg: null, grams: { min: 60, max: 80 } } }, meals: [] }]);
  assert.deepEqual(rangosParaMostrar(null, NODOS, true), { bodyWeight: null, bodyWeightWithheld: false, dayTypes: [] });
  // La respuesta cumple el contrato.
  assert.ok(RangosDelPlanSchema.safeParse({ planId: 'p', state: 'DRAFT', revision: 1, anthropometry: { enabled: true, latestWeight: null }, ...sinM1niD2 }).success);
});
