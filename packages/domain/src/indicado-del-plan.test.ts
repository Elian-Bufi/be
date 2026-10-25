/**
 * WP-NUTRICION-COMPARACION (DL-158): «Indicado en el plan» y «Objetivo del profesional», con los casos de la definición
 * (§3). Los valores esperados están calculados a mano con las composiciones de cada prueba, no con el código que se prueba.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { IndicadoDeLaComidaSchema, IndicadoDelDiaSchema, EscalonDelObjetivoSchema } from './contratos-analisis';
import {
  CAPAS_DE_LA_COMPARACION,
  escalonDelObjetivoApi,
  escalonesDelRango,
  indicadoDelDiaEnCelda,
  indicadoDelDiaEnPalabras,
  indicadoDelPeriodoEnTexto,
  objetivoDelRango,
  objetivoEnCelda,
  sinIndicadoParaDibujar,
  indicadoDeLaComidaApi,
  indicadoDeLaComidaEnPalabras,
  indicadoDelDiaApi,
  motivoCortoSinIndicadoDelDia,
  motivoSinIndicadoDelDia,
  objetivoEnPalabras,
} from './copy-comparacion-nutricional';
import { terminosProhibidosEn } from './copy-nutricion';
import { escalonesDelObjetivo, indicadoDeLasComidas, indicadoDeLosDias, type ObjetivoParaComparar } from './indicado-del-plan';
import type { ContenidoDeInstantanea, VersionEnPeriodo } from './nutricion';
import type { RegistroParaAnalisis } from './nutricion-del-analisis';

// ─── Un plan de prueba ──────────────────────────────────────────────────────────────────────────

type Composicion = { referenceAmount: '100g'; energyKcal: number; proteinG: number; carbohydrateG: number; fatG: number; fiberG?: number };
const AVENA: Composicion = { referenceAmount: '100g', energyKcal: 389, proteinG: 16.9, carbohydrateG: 66.3, fatG: 6.9, fiberG: 10.6 };
const ARROZ: Composicion = { referenceAmount: '100g', energyKcal: 130, proteinG: 2.7, carbohydrateG: 28.2, fatG: 0.3, fiberG: 0.4 };
const POLLO: Composicion = { referenceAmount: '100g', energyKcal: 165, proteinG: 31, carbohydrateG: 0, fatG: 3.6 };

const item = (id: string, gramos: number, composition: Composicion) => ({
  itemId: id,
  catalogItemId: `c-${id}`,
  catalogItemVersionId: `cv-${id}`,
  name: id,
  composition,
  quantity: { value: gramos, unit: 'g' as const },
  preparationState: null,
  note: null,
});
const opcion = (optionId: string, items: ReturnType<typeof item>[]) => ({ optionId, label: optionId, items });
const comida = (mealId: string, label: string, options: ReturnType<typeof opcion>[]) => ({ mealId, label, prescriptionMode: 'DISH_OPTIONS' as const, options });
const plan = (dias: { dayTypeId: string; label: string; meals: ReturnType<typeof comida>[] }[]) => ({ dayTypes: dias }) as unknown as ContenidoDeInstantanea;
const version = (planId: string, desde: string, hasta: string | null, instantanea: ContenidoDeInstantanea): VersionEnPeriodo => ({ planId, desde, hasta, instantanea });

/** Una opción por comida: avena 50 g (194,5 kcal; 8,45 g de proteínas) y arroz 150 g (195 kcal; 4,05 g). */
const SIMPLE = plan([{ dayTypeId: 'habitual', label: 'Día habitual', meals: [comida('desayuno', 'Desayuno', [opcion('o-avena', [item('avena', 50, AVENA)])]), comida('almuerzo', 'Almuerzo', [opcion('o-arroz', [item('arroz', 150, ARROZ)])])] }]);
/** El almuerzo con dos opciones: arroz o pollo 120 g (198 kcal). */
const CON_ALTERNATIVAS = plan([
  {
    dayTypeId: 'habitual',
    label: 'Día habitual',
    meals: [comida('desayuno', 'Desayuno', [opcion('o-avena', [item('avena', 50, AVENA)])]), comida('almuerzo', 'Almuerzo', [opcion('o-arroz', [item('arroz', 150, ARROZ)]), opcion('o-pollo', [item('pollo', 120, POLLO)])])],
  },
]);
/** La versión siguiente: avena 80 g (311,2 kcal) y el mismo arroz. */
const SIGUIENTE = plan([{ dayTypeId: 'habitual', label: 'Día habitual', meals: [comida('desayuno', 'Desayuno', [opcion('o-avena-2', [item('avena', 80, AVENA)])]), comida('almuerzo', 'Almuerzo', [opcion('o-arroz-2', [item('arroz', 150, ARROZ)])])] }]);
/** Dos días tipo: «Entrena» (avena y pollo) y «Descansa» (solo arroz). */
const DOS_DIAS_TIPO = plan([
  { dayTypeId: 'entrena', label: 'Entrena', meals: [comida('d-e', 'Desayuno', [opcion('o-e-avena', [item('avena', 50, AVENA)])]), comida('a-e', 'Almuerzo', [opcion('o-e-pollo', [item('pollo', 120, POLLO)])])] },
  { dayTypeId: 'descansa', label: 'Descansa', meals: [comida('a-d', 'Almuerzo', [opcion('o-d-arroz', [item('arroz', 150, ARROZ)])])] },
]);

let n = 0;
function registro(planId: string, fecha: string, extra: Partial<RegistroParaAnalisis> & { optionId?: string; mealId?: string } = {}): RegistroParaAnalisis {
  const { optionId, mealId, ...resto } = extra;
  return {
    recordId: `r-${++n}`,
    kind: 'PLAN_OPTION',
    planId,
    localDate: fecha,
    occurredAt: `${fecha}T12:00:00.000Z`,
    consumption: null,
    consumed: null,
    annulment: null,
    dayTypeId: 'habitual',
    meal: { mealId: mealId ?? 'almuerzo', label: 'Almuerzo' },
    option: optionId ? ({ optionId } as unknown as RegistroParaAnalisis['option']) : null,
    description: null,
    ...resto,
  } as RegistroParaAnalisis;
}

const dias = (...fechas: string[]) => fechas;

// ─── Por día ────────────────────────────────────────────────────────────────────────────────────

test('una opción por comida: el día tiene indicado, la suma exacta (a mano: 194,5 + 195 = 389,5 kcal), también sin registros', () => {
  const r = indicadoDeLosDias({ fechas: dias('2026-10-20', '2026-10-21'), versiones: [version('A', '2026-10-01', null, SIMPLE)], registros: [], metrica: 'ENERGY' });
  assert.deepEqual(r, [
    { fecha: '2026-10-20', estado: 'DETERMINADO', valor: '389.5', planId: 'A', diaTipoId: 'habitual', diaTipo: 'Día habitual' },
    { fecha: '2026-10-21', estado: 'DETERMINADO', valor: '389.5', planId: 'A', diaTipoId: 'habitual', diaTipo: 'Día habitual' },
  ]);
  // Proteínas, a mano: 50 × 16,9 / 100 + 150 × 2,7 / 100 = 8,45 + 4,05 = 12,5 g.
  const p = indicadoDeLosDias({ fechas: dias('2026-10-20'), versiones: [version('A', '2026-10-01', null, SIMPLE)], registros: [], metrica: 'PROTEIN' });
  assert.equal(p[0]?.estado === 'DETERMINADO' ? p[0].valor : null, '12.5');
});

test('varias opciones en una comida: sin indicado del día, con cuál comida y cuántas; nada suma ni promedia alternativas', () => {
  const r = indicadoDeLosDias({ fechas: dias('2026-10-20'), versiones: [version('B', '2026-10-01', null, CON_ALTERNATIVAS)], registros: [registro('B', '2026-10-20', { optionId: 'o-pollo' })], metrica: 'ENERGY' });
  assert.deepEqual(r, [{ fecha: '2026-10-20', estado: 'SIN_DETERMINAR', motivo: 'VARIAS_OPCIONES', planId: 'B', comidasConVariasOpciones: [{ comida: 'Almuerzo', opciones: 2 }] }]);
  // Ni con la opción registrada se arma un indicado del día: lo indicado del día no depende de lo que se comió.
  assert.ok(!r.some((d) => d.estado === 'DETERMINADO'));
  const api = indicadoDelDiaApi(r[0]!);
  assert.ok(IndicadoDelDiaSchema.safeParse(api).success);
  assert.equal(api.state === 'UNDETERMINED' ? motivoSinIndicadoDelDia(api) : '', 'Sin indicado del día: Almuerzo tiene 2 opciones. BE no elige entre ellas ni las suma.');
});

test('por comida registrada: lo indicado de la opción elegida (pollo 120 g = 198 kcal); una comida diferente no tiene', () => {
  const pollo = registro('B', '2026-10-20', { optionId: 'o-pollo' });
  const diferente = registro('B', '2026-10-20', { kind: 'DIFFERENT', option: null, description: 'Pizza' });
  const r = indicadoDeLasComidas({ registros: [pollo, diferente], instantaneas: new Map([['B', CON_ALTERNATIVAS]]), metrica: 'ENERGY' });
  assert.deepEqual(r, [
    { recordId: pollo.recordId, estado: 'DETERMINADO', valor: '198', planId: 'B' },
    { recordId: diferente.recordId, estado: 'SIN_DETERMINAR', motivo: 'COMIDA_DIFERENTE', planId: 'B' },
  ]);
  const api = r.map(indicadoDeLaComidaApi);
  assert.ok(api.every((c) => IndicadoDeLaComidaSchema.safeParse(c).success));
  assert.equal(indicadoDeLaComidaEnPalabras(api[0]!, 'ENERGY'), 'Indicado en el plan: 198 kcal');
  assert.equal(indicadoDeLaComidaEnPalabras(api[1]!, 'ENERGY'), 'Comida diferente: no es una opción del plan y no tiene indicado.');
});

test('un registro sin cantidades: lo registrado no tiene número, pero lo indicado de su opción sí', () => {
  const sinCantidades = registro('A', '2026-10-20', { optionId: 'o-arroz', consumption: null, consumed: null });
  const [c] = indicadoDeLasComidas({ registros: [sinCantidades], instantaneas: new Map([['A', SIMPLE]]), metrica: 'ENERGY' });
  assert.deepEqual(c, { recordId: sinCantidades.recordId, estado: 'DETERMINADO', valor: '195', planId: 'A' });
});

test('un día parcial (falta una comida) y el día en curso tienen el indicado del plan: lo indicado no depende de lo registrado', () => {
  const soloDesayuno = registro('A', '2026-10-22', { optionId: 'o-avena', mealId: 'desayuno' });
  const r = indicadoDeLosDias({ fechas: dias('2026-10-22', '2026-10-25'), versiones: [version('A', '2026-10-01', null, SIMPLE)], registros: [soloDesayuno], metrica: 'ENERGY' });
  assert.deepEqual(
    r.map((d) => (d.estado === 'DETERMINADO' ? d.valor : d.motivo)),
    ['389.5', '389.5'],
  );
});

test('cambio de versión: el día del cambio no tiene indicado del día; antes y después, el de su versión (la instantánea)', () => {
  const versiones = [version('A', '2026-10-01', '2026-10-15', SIMPLE), version('A2', '2026-10-15', null, SIGUIENTE)];
  const r = indicadoDeLosDias({ fechas: dias('2026-10-14', '2026-10-15', '2026-10-16'), versiones, registros: [], metrica: 'ENERGY' });
  assert.deepEqual(
    r.map((d) => [d.fecha, d.estado === 'DETERMINADO' ? `${d.planId}:${d.valor}` : d.motivo]),
    [
      ['2026-10-14', 'A:389.5'],
      ['2026-10-15', 'CAMBIO_DE_VERSION'],
      // A mano: 80 × 389 / 100 + 195 = 311,2 + 195 = 506,2 kcal.
      ['2026-10-16', 'A2:506.2'],
    ],
  );
  // Cada comida del día del cambio, con la versión que cita su registro.
  const manana = registro('A', '2026-10-15', { optionId: 'o-arroz' });
  const tarde = registro('A2', '2026-10-15', { optionId: 'o-avena-2', mealId: 'desayuno' });
  const comidas = indicadoDeLasComidas({ registros: [manana, tarde], instantaneas: new Map([['A', SIMPLE], ['A2', SIGUIENTE]]), metrica: 'ENERGY' });
  assert.deepEqual(
    comidas.map((c) => (c.estado === 'DETERMINADO' ? `${c.planId}:${c.valor}` : c.motivo)),
    ['A:195', 'A2:311.2'],
  );
});

test('varios días tipo: sin registros no se sabe cuál (sin indicado); con un registro del día, el de ese día tipo', () => {
  const versiones = [version('C', '2026-10-01', null, DOS_DIAS_TIPO)];
  const entrena = registro('C', '2026-10-21', { optionId: 'o-e-avena', mealId: 'd-e', dayTypeId: 'entrena' });
  const r = indicadoDeLosDias({ fechas: dias('2026-10-20', '2026-10-21'), versiones, registros: [entrena], metrica: 'ENERGY' });
  assert.deepEqual(r[0], { fecha: '2026-10-20', estado: 'SIN_DETERMINAR', motivo: 'SIN_DIA_TIPO', planId: 'C', comidasConVariasOpciones: [] });
  // A mano: 194,5 + 198 = 392,5 kcal.
  assert.deepEqual(r[1], { fecha: '2026-10-21', estado: 'DETERMINADO', valor: '392.5', planId: 'C', diaTipoId: 'entrena', diaTipo: 'Entrena' });
});

test('sin plan vigente y sin el dato de un nutriente: se dice por qué, sin número', () => {
  const sinPlan = indicadoDeLosDias({ fechas: dias('2026-09-30'), versiones: [version('A', '2026-10-01', null, SIMPLE)], registros: [], metrica: 'ENERGY' });
  assert.equal(sinPlan[0]?.estado === 'SIN_DETERMINAR' ? sinPlan[0].motivo : null, 'SIN_PLAN');
  // El pollo no trae fibra: un día con pollo no tiene la fibra indicada (no se toma como cero).
  const fibra = indicadoDeLosDias({ fechas: dias('2026-10-21'), versiones: [version('C', '2026-10-01', null, DOS_DIAS_TIPO)], registros: [registro('C', '2026-10-21', { optionId: 'o-e-avena', mealId: 'd-e', dayTypeId: 'entrena' })], metrica: 'FIBER' });
  assert.equal(fibra[0]?.estado === 'SIN_DETERMINAR' ? fibra[0].motivo : null, 'SIN_DATO_DEL_NUTRIENTE');
  const api = indicadoDelDiaApi(fibra[0]!);
  assert.equal(api.state === 'UNDETERMINED' ? motivoCortoSinIndicadoDelDia(api) : '', 'sin indicado: sin dato del nutriente');
});

test('la cuenta de registros no tiene indicado ni objetivo', () => {
  assert.deepEqual(indicadoDeLosDias({ fechas: dias('2026-10-20'), versiones: [version('A', '2026-10-01', null, SIMPLE)], registros: [], metrica: 'RECORDS' }), []);
  assert.deepEqual(indicadoDeLasComidas({ registros: [registro('A', '2026-10-20', { optionId: 'o-arroz' })], instantaneas: new Map([['A', SIMPLE]]), metrica: 'RECORDS' }), []);
});

// ─── El objetivo ────────────────────────────────────────────────────────────────────────────────

test('el objetivo: las calorías y los macros en gramos son escalones con sus fechas; una proporción no se convierte; la fibra no tiene', () => {
  const objetivos: ObjetivoParaComparar[] = [
    { id: 'o1', desde: '2026-10-01', hasta: '2026-10-10', requerimientoKcal: 2100, macros: { protein: { value: 130, unit: 'g/day' }, carbohydrate: { value: 220, unit: 'g/day' }, fat: { value: 65, unit: 'g/day' } } },
    { id: 'o2', desde: '2026-10-10', hasta: null, requerimientoKcal: 2300, macros: { protein: { value: 0.25, unit: 'energy_share' }, carbohydrate: { value: 240, unit: 'g/day' }, fat: { value: 70, unit: 'g/day' } } },
    // Fuera del rango: no aparece.
    { id: 'o0', desde: '2026-08-01', hasta: '2026-09-01', requerimientoKcal: 1900, macros: null },
  ];
  assert.deepEqual(
    escalonesDelObjetivo(objetivos, 'ENERGY', '2026-10-05', '2026-10-20').map((e) => [e.objetivoId, e.desde, e.hasta, e.cantidad?.valor]),
    [
      ['o1', '2026-10-01', '2026-10-10', 2100],
      ['o2', '2026-10-10', null, 2300],
    ],
  );
  const proteinas = escalonesDelObjetivo(objetivos, 'PROTEIN', '2026-10-05', '2026-10-20');
  assert.deepEqual(
    proteinas.map((e) => [e.objetivoId, e.cantidad, e.proporcionDeLaEnergia]),
    [
      ['o1', { valor: 130, unidad: 'g/day' }, null],
      ['o2', null, 0.25],
    ],
  );
  const api = proteinas.map(escalonDelObjetivoApi);
  assert.ok(api.every((e) => EscalonDelObjetivoSchema.safeParse(e).success));
  assert.equal(objetivoEnPalabras(api[0]!, 'PROTEIN'), '130 g por día');
  assert.equal(objetivoEnPalabras(api[1]!, 'PROTEIN'), '0,25 de las calorías (proporción): BE no la convierte a gramos ni la dibuja');
  assert.deepEqual(escalonesDelObjetivo(objetivos, 'FIBER', '2026-10-05', '2026-10-20'), []);
});

// ─── Las palabras ───────────────────────────────────────────────────────────────────────────────

test('los textos de la comparación no califican: ni porcentajes, ni cumplimiento, ni adherencia (también en negación)', () => {
  const textos = [
    ...Object.values(CAPAS_DE_LA_COMPARACION),
    ...(['NO_ACTIVE_PLAN', 'PLAN_VERSION_CHANGED', 'DAY_TYPE_UNKNOWN', 'NO_MEALS', 'SEVERAL_OPTIONS', 'EXCHANGE_PORTIONS', 'NUTRIENT_DATA_MISSING'] as const).flatMap((reason) => {
      const d = { date: '2026-10-20', state: 'UNDETERMINED' as const, reason, planVersionId: null, mealsWithSeveralOptions: reason === 'SEVERAL_OPTIONS' ? [{ meal: 'Almuerzo', options: 3 }] : [] };
      return [motivoSinIndicadoDelDia(d), motivoCortoSinIndicadoDelDia(d)];
    }),
    ...(['DIFFERENT_MEAL', 'OPTION_NOT_FOUND', 'NUTRIENT_DATA_MISSING'] as const).map((reason) => indicadoDeLaComidaEnPalabras({ recordId: 'r', state: 'UNDETERMINED', reason, planVersionId: 'p' }, 'ENERGY')),
  ];
  for (const t of textos) assert.deepEqual(terminosProhibidosEn(t), [], t);
});

test('el objetivo de un rango: el día del cambio ya vale el nuevo; en una semana con cambio, los dos; la proporción, dicha', () => {
  const escalones = [
    { objectiveVersionId: 'o1', from: '2026-10-01', to: '2026-10-10', amount: { value: 2200, unit: 'kcal/day' as const }, energyShare: null },
    { objectiveVersionId: 'o2', from: '2026-10-10', to: null, amount: { value: 1950, unit: 'kcal/day' as const }, energyShare: null },
  ];
  assert.equal(objetivoDelRango(escalones, 'ENERGY', '2026-10-09', '2026-10-09'), '2.200 kcal por día');
  assert.equal(objetivoDelRango(escalones, 'ENERGY', '2026-10-10', '2026-10-10'), '1.950 kcal por día');
  assert.equal(objetivoDelRango(escalones, 'ENERGY', '2026-10-06', '2026-10-12'), '2.200 kcal y 1.950 kcal por día');
  assert.equal(objetivoEnCelda(escalones, 'ENERGY', '2026-10-06', '2026-10-12'), '2.200 kcal y 1.950 kcal');
  assert.equal(objetivoDelRango(escalones, 'ENERGY', '2026-09-01', '2026-09-30'), null);
  assert.deepEqual(
    escalonesDelRango(escalones, '2026-10-06', '2026-10-12').map((x) => [x.escalon.objectiveVersionId, x.desde]),
    [
      ['o1', '2026-10-06'],
      ['o2', '2026-10-10'],
    ],
  );
  const proporcion = [{ objectiveVersionId: 'o3', from: '2026-10-01', to: null, amount: null, energyShare: 0.3 }];
  assert.equal(objetivoEnCelda(proporcion, 'PROTEIN', '2026-10-05', '2026-10-05'), '0,3 de las calorías (proporción)');
});

test('lo indicado en la tabla y la lectura: con el redondeo de lo registrado; sin indicado, por qué; ningún día dibujado, se dice', () => {
  const determinado = { date: '2026-10-20', state: 'DETERMINED' as const, value: 2012.5, planVersionId: 'p2', dayTypeId: 'd', dayType: 'Día habitual' };
  // HALF_UP sobre el exacto, como la pantalla de registro: 2012,5 da 2.013.
  assert.equal(indicadoDelDiaEnCelda(determinado, 'ENERGY'), '2.013 kcal');
  assert.equal(indicadoDelDiaEnCelda({ ...determinado, value: 12.25 }, 'PROTEIN'), '12,3 g');
  assert.equal(indicadoDelDiaEnPalabras(determinado, 'ENERGY', (id) => (id === 'p2' ? 'versión 2 del plan' : null)), '2.013 kcal · versión 2 del plan · Día habitual');
  const varias = { date: '2026-10-21', state: 'UNDETERMINED' as const, reason: 'SEVERAL_OPTIONS' as const, planVersionId: 'p2', mealsWithSeveralOptions: [{ meal: 'Cena', options: 2 }] };
  assert.equal(indicadoDelDiaEnCelda(varias, 'ENERGY'), 'sin indicado: comidas con varias opciones');
  assert.equal(indicadoDelPeriodoEnTexto([determinado, varias, { ...varias, date: '2026-10-22' }]), 'Indicado en el plan: 1 día con un valor; 2 días sin indicado (comidas con varias opciones).');
  assert.equal(sinIndicadoParaDibujar([determinado, varias]), null);
  assert.equal(
    sinIndicadoParaDibujar([varias, { ...varias, date: '2026-10-22' }]),
    'Indicado en el plan: ningún día de estas fechas tiene un indicado del día (comidas con varias opciones). Lo indicado de cada comida registrada está en «Ver origen».',
  );
  for (const x of [indicadoDelPeriodoEnTexto([varias]), sinIndicadoParaDibujar([varias]) ?? '']) assert.deepEqual(terminosProhibidosEn(x), [], x);
});
