/**
 * DL-153 (encargo del 2026-10-23, punto 3): la completitud de Nutrición, separada en sus cuatro dimensiones.
 * - **Cantidades conocidas** dentro de los registros que hay (la calidad de siempre: registros sin cantidades o sin el dato
 *   del nutriente hacen un subtotal).
 * - **Comidas del plan**, cuando el plan deja conocerlas: el mismo contraste que la pestaña Registros (`construirContraste`).
 *   Una comida sin ningún registro hace del día un subtotal y se dice cuál; si no se pueden conocer, se dice y no se inventan.
 * - **Cobertura temporal** del período: días con valor, sin registros y hoy en curso (sin cambios).
 * - **Lo indicado frente a lo registrado:** nada de esto es adherencia; el valor del día y la media no cambian.
 *
 * El defecto que motivó el cambio (UX-01 de la auditoría del 2026-10-21, reproducido el 2026-10-23 contra main 0fb1bff):
 * un día con 3 de las 4 comidas del plan registradas, todas con cantidades, salía `COMPLETE` y se exportaba «sin
 * faltantes», y el Resumen decía 0 subtotales. Los resultados esperados están escritos a mano y no salen del cálculo.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Nutrientes } from './contratos-recetas';
import { csvDelAnalisis, COLUMNAS_DE_LA_EXPORTACION } from './exportacion-del-analisis';
import { definicionDeMetrica, type DefinicionDeMetrica } from './metricas-del-analisis';
import type { ContenidoDeInstantanea, VersionEnPeriodo } from './nutricion';
import { construirContraste } from './nutricion';
import {
  calidadEnPalabras,
  coberturaNutricional,
  comidasDelPlanDeLosDias,
  diasNutricionales,
  ingestaDelContraste,
  serieNutricional,
  type RegistroParaAnalisis,
} from './nutricion-del-analisis';
import { componerLosRegistros, resumenDeUnDia } from './registros-de-nutricion';
import { coberturaBreve, partesDeLaCobertura, resumirPeriodo } from './series-del-analisis';
import { partesDeObservacion, textoDeObservacion, type FormatoDeLaSintesis, type ObservacionDelResumen } from './sintesis-del-resumen';

const definicion = (id: string): DefinicionDeMetrica => {
  const d = definicionDeMetrica(id);
  if (!d) throw new Error(`no existe ${id}`);
  return d;
};
const ENERGIA = definicion('nutricion.energia');

// ─── El plan y los registros ────────────────────────────────────────────────────────────────────

const COMIDAS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'] as const;
const comida = (label: string) => ({ mealId: `m-${label.toLowerCase()}`, label, prescriptionMode: 'DISH_OPTIONS' as const, options: [] });
/** Un plan de un día tipo con las cuatro comidas, y otro de dos días tipo (entreno y descanso). */
const UN_DIA_TIPO: ContenidoDeInstantanea = { dayTypes: [{ dayTypeId: 'dt-unico', label: 'Día', meals: COMIDAS.map(comida) }] };
const DOS_DIAS_TIPO: ContenidoDeInstantanea = {
  dayTypes: [
    { dayTypeId: 'dt-entreno', label: 'Entreno', meals: COMIDAS.map(comida) },
    { dayTypeId: 'dt-descanso', label: 'Descanso', meals: [comida('Almuerzo'), comida('Cena')] },
  ],
};
const VERSION = '00000000-0000-4000-8000-0000000000b1';
const versiones = (instantanea: ContenidoDeInstantanea): VersionEnPeriodo[] => [{ planId: VERSION, desde: '2026-10-01', hasta: null, instantanea }];

const nutrientes = (kcal: string): Nutrientes => ({
  energyKcal: { value: kcal, missing: [] },
  carbohydrateG: { value: '50', missing: [] },
  fatG: { value: '20', missing: [] },
  proteinG: { value: '30', missing: [] },
  fiberG: { value: '5', missing: [] },
});

let id = 0;
interface Opciones {
  readonly kcal?: string;
  readonly diaTipo?: string;
  readonly sinCantidades?: boolean;
  readonly diferente?: boolean;
  /** La comida del plan en la que se registró una comida diferente, o `null` si no fue en ninguna. */
  readonly enLaComida?: string | null;
  readonly anulado?: boolean;
  readonly rectificado?: boolean;
}
function registro(fecha: string, nombreDeLaComida: string | null, o: Opciones = {}): RegistroParaAnalisis {
  const diferente = o.diferente ?? false;
  const comidaDelRegistro = diferente ? (o.enLaComida ?? null) : nombreDeLaComida;
  return {
    recordId: `r-${++id}`,
    kind: diferente ? 'DIFFERENT' : 'PLAN_OPTION',
    planId: VERSION,
    localDate: fecha,
    occurredAt: `${fecha}T${String(8 + (id % 12)).padStart(2, '0')}:00:00.000-03:00`,
    dayTypeId: comidaDelRegistro ? (o.diaTipo ?? 'dt-unico') : null,
    meal: comidaDelRegistro ? { mealId: `m-${comidaDelRegistro.toLowerCase()}`, label: comidaDelRegistro } : null,
    option: null,
    description: diferente ? 'Algo distinto' : null,
    consumption: diferente || o.sinCantidades ? (diferente ? null : { status: 'UNCONFIRMED', items: [], source: 'ORIGINAL', rectifiedAt: null }) : { status: 'PLAN_PORTIONS', items: [], source: o.rectificado ? 'RECTIFIED' : 'ORIGINAL', rectifiedAt: o.rectificado ? `${fecha}T22:00:00.000-03:00` : null },
    consumed: diferente || o.sinCantidades ? null : nutrientes(o.kcal ?? '500'),
    annulment: o.anulado ? { annulledAt: `${fecha}T23:00:00.000-03:00`, reason: null } : null,
  };
}
const dia = (fecha: string, comidas: readonly string[], o: Opciones = {}) => comidas.map((c) => registro(fecha, c, o));

const PERIODO = { desde: '2026-10-17', hasta: '2026-10-23', hoy: '2026-10-23' };
/** La serie como la arma la API: los días, sus comidas del plan desde el contraste, y la serie. */
function serieDe(registros: readonly RegistroParaAnalisis[], instantanea: ContenidoDeInstantanea | null, metrica: 'ENERGY' | 'RECORDS' = 'ENERGY', grano: 'DAY' | 'WEEK' = 'DAY') {
  const dias = diasNutricionales(registros, PERIODO.desde, PERIODO.hasta);
  const comidasDelPlan = comidasDelPlanDeLosDias(dias, instantanea ? versiones(instantanea) : []);
  const serie = serieNutricional(dias, metrica === 'ENERGY' ? ENERGIA : definicion('nutricion.registros'), metrica, grano, { ...PERIODO, comidasDelPlan });
  return { dias, comidasDelPlan, serie, cobertura: coberturaNutricional(dias, PERIODO.desde, PERIODO.hasta, { comidasDelPlan, hoy: PERIODO.hoy }) };
}
const punto = (s: ReturnType<typeof serieDe>, fecha: string) => {
  const p = s.serie.points.find((x) => x.date === fecha);
  if (!p) throw new Error(`sin punto el ${fecha}`);
  return p;
};
const detalle = (p: ReturnType<typeof punto>, rotulo: string) => p.detail.find((d) => d.label === rotulo)?.value ?? null;

// ─── 1. Completo según el criterio ──────────────────────────────────────────────────────────────

test('1 · las cuatro comidas del plan registradas con cantidades: completo según el plan, y la palabra no dice «sin faltantes»', () => {
  const s = serieDe(dia('2026-10-20', COMIDAS), UN_DIA_TIPO);
  const p = punto(s, '2026-10-20');
  assert.equal(p.value, 2000);
  assert.equal(p.quality, 'COMPLETE');
  assert.deepEqual(p.missing, []);
  assert.deepEqual(p.coverage?.planMeals, { daysKnown: 1, daysUndetermined: [], expected: 4, withPlanOption: 4, withDifferentMeal: 0, withoutRecord: 0 });
  assert.equal(detalle(p, 'Comidas del plan'), '4 de 4 con registro');
  assert.equal(calidadEnPalabras(p), 'cada comida del plan con registro, con cantidades');
  assert.doesNotMatch(calidadEnPalabras(p), /sin faltantes|complet/);
});

// ─── 2. Una comida esperada sin registrar ───────────────────────────────────────────────────────

test('2 · el defecto: 3 de 4 comidas del plan con cantidades es un subtotal que dice cuál falta (antes, «sin faltantes»)', () => {
  const s = serieDe([...dia('2026-10-20', COMIDAS), ...dia('2026-10-21', ['Desayuno', 'Almuerzo', 'Merienda'])], UN_DIA_TIPO);
  const p = punto(s, '2026-10-21');
  assert.equal(p.value, 1500, 'el valor del día no cambia: es la suma de lo registrado');
  assert.equal(p.quality, 'PARTIAL', 'antes salía COMPLETE');
  assert.deepEqual(p.missing, [{ reason: 'COMIDA_DEL_PLAN_SIN_REGISTRO', count: 1 }]);
  assert.equal(detalle(p, 'Comidas del plan'), '3 de 4 con registro · 1 sin registro');
  assert.equal(detalle(p, 'Sin registro'), 'Cena', 'se dice qué falta, con el nombre del plan');
  assert.equal(calidadEnPalabras(p), 'subtotal de lo registrado');
  // La media y su denominador no cambian: los dos días tienen valor; cambia cuántos son subtotales y qué se dice.
  const r = resumirPeriodo(s.serie, ENERGIA, PERIODO.desde, PERIODO.hasta, PERIODO.hoy);
  assert.equal(r.valor, 1750, '(2000 + 1500) / 2, igual que antes');
  assert.equal(r.n, 2);
  assert.equal(r.parciales, 1, 'antes, 0');
  assert.deepEqual(coberturaBreve(r), {
    principal: ['7 días: 2 con valor', '4 sin registros'],
    detalle: ['1 subtotal', '1 comida del plan sin registro', 'hoy, en curso: fuera de la media'],
  });
  assert.deepEqual(partesDeLaCobertura(r), ['7 días: 2 con valor', 'de ellos, 1 es un subtotal (falta algún dato)', '1 comida del plan sin registro', '4 sin registros', 'hoy, en curso: fuera de la media']);
});

test('2 · la exportación dice lo mismo que la pantalla: subtotal, las comidas del plan y lo que falta', () => {
  const s = serieDe([...dia('2026-10-20', COMIDAS), ...dia('2026-10-21', ['Desayuno', 'Almuerzo', 'Merienda'])], UN_DIA_TIPO);
  const csv = csvDelAnalisis({ asesorado: 'Persona sintética', desde: PERIODO.desde, hasta: PERIODO.hasta, zona: 'America/Argentina/Buenos_Aires', generadoEl: '2026-10-23T21:00:00.000Z', series: [{ nombre: 'Calorías registradas', definicion: ENERGIA, serie: s.serie }] });
  const lineas = csv.trimEnd().split('\r\n');
  const filas = lineas.slice(lineas.indexOf(COLUMNAS_DE_LA_EXPORTACION.join(';')) + 1).map((l) => l.split(';'));
  const col = (nombre: (typeof COLUMNAS_DE_LA_EXPORTACION)[number]) => COLUMNAS_DE_LA_EXPORTACION.indexOf(nombre);
  assert.deepEqual(
    filas.map((f) => [f[col('Fecha')], f[col('Valor')], f[col('Calidad')], f[col('Comidas del plan')], f[col('Falta')]]),
    [
      ['2026-10-20', '2000', 'cada comida del plan con registro, con cantidades', '4 de 4 con registro', ''],
      ['2026-10-21', '1500', 'subtotal', '3 de 4 con registro · 1 sin registro', '1 comida(s) del plan sin registro'],
    ],
  );
  assert.doesNotMatch(csv, /sin faltantes/);
});

// ─── 3. Cantidades desconocidas ─────────────────────────────────────────────────────────────────

test('3 · una comida registrada sin confirmar cantidades: la comida tiene registro, el número es un subtotal por cantidades', () => {
  const s = serieDe([...dia('2026-10-20', ['Desayuno', 'Almuerzo', 'Merienda']), registro('2026-10-20', 'Cena', { sinCantidades: true })], UN_DIA_TIPO);
  const p = punto(s, '2026-10-20');
  assert.equal(p.value, 1500);
  assert.equal(p.quality, 'PARTIAL');
  assert.deepEqual(p.missing, [{ reason: 'SIN_CANTIDADES', count: 1 }], 'no falta registrar ninguna comida: falta una cantidad');
  assert.equal(p.coverage?.planMeals.withoutRecord, 0);
  assert.equal(p.coverage?.planMeals.withPlanOption, 4);
});

test('3 · un día con una comida del plan sin registro y el resto sin cantidades sigue contándose «sin cantidades», no «sin el dato del nutriente»', () => {
  const s = serieDe(dia('2026-10-20', ['Desayuno', 'Almuerzo', 'Merienda'], { sinCantidades: true }), UN_DIA_TIPO);
  const p = punto(s, '2026-10-20');
  assert.equal(p.value, null);
  assert.equal(p.quality, 'UNKNOWN');
  assert.deepEqual(p.missing, [
    { reason: 'SIN_CANTIDADES', count: 3 },
    { reason: 'COMIDA_DEL_PLAN_SIN_REGISTRO', count: 1 },
  ]);
  const r = resumirPeriodo(s.serie, ENERGIA, PERIODO.desde, PERIODO.hasta, PERIODO.hoy);
  assert.equal(r.dias?.sinCantidades, 1, 'la comida sin registro es otra dimensión: no cambia por qué el día no tiene valor');
  assert.equal(r.dias?.sinDatoDelNutriente, 0);
  assert.equal(r.dias?.comidasDelPlan?.sinRegistro, 1);
});

// ─── 4. Día sin registros ───────────────────────────────────────────────────────────────────────

test('4 · un día sin registros es un hueco: no se inventan cuatro comidas sin registro ni un cero', () => {
  const s = serieDe(dia('2026-10-20', COMIDAS), UN_DIA_TIPO);
  assert.equal(s.serie.points.length, 1);
  assert.ok(s.serie.gaps.some((g) => g.from === '2026-10-21'), 'desde el 21, sin registros: un hueco declarado');
  assert.ok(!s.comidasDelPlan.has('2026-10-21'));
  const r = resumirPeriodo(s.serie, ENERGIA, PERIODO.desde, PERIODO.hasta, PERIODO.hoy);
  assert.equal(r.dias?.sinRegistros, 5, 'del 17 al 23: el 20 con valor y hoy en curso; los otros cinco, sin registros');
  assert.equal(r.dias?.comidasDelPlan?.sinRegistro, 0);
  assert.equal(s.cobertura.planMeals.withoutRecord, 0);
});

// ─── 5. Día en curso ────────────────────────────────────────────────────────────────────────────

test('5 · hoy, con una comida de cuatro: subtotal y en curso, fuera de la media, y sus comidas pendientes no se cuentan como faltantes del período', () => {
  const s = serieDe([...dia('2026-10-22', COMIDAS), registro('2026-10-23', 'Desayuno')], UN_DIA_TIPO);
  const hoy = punto(s, '2026-10-23');
  assert.equal(hoy.partialBucket, true);
  assert.equal(hoy.quality, 'PARTIAL', 'lo de hoy es un subtotal: puede faltar registrar');
  assert.equal(hoy.coverage?.planMeals.withoutRecord, 3);
  const r = resumirPeriodo(s.serie, ENERGIA, PERIODO.desde, PERIODO.hasta, PERIODO.hoy);
  assert.equal(r.valor, 2000, 'la media es del día terminado');
  assert.equal(r.incompletos, 1);
  assert.equal(r.parciales, 0, 'hoy no cuenta como subtotal del período');
  assert.equal(r.dias?.comidasDelPlan?.sinRegistro, 0, 'las tres de hoy todavía se pueden registrar');
  assert.deepEqual(coberturaBreve(r).detalle, ['hoy, en curso: fuera de la media']);
  assert.equal(s.cobertura.planMeals.daysKnown, 1, 'la cobertura del período no cuenta hoy');
  assert.equal(s.cobertura.planMeals.withoutRecord, 0);
});

// ─── 6. Comida diferente al plan ────────────────────────────────────────────────────────────────

test('6 · D-2, ejemplo 1: tres opciones del plan y una comida diferente en la cena, de cuatro: «4 de 4 con registro · 3 con opción del plan · 1 con comida diferente»', () => {
  const s = serieDe([...dia('2026-10-20', ['Desayuno', 'Almuerzo', 'Merienda']), registro('2026-10-20', null, { diferente: true, enLaComida: 'Cena' })], UN_DIA_TIPO);
  const p = punto(s, '2026-10-20');
  assert.equal(p.value, 1500, 'las cantidades no cambian');
  assert.equal(p.quality, 'PARTIAL');
  assert.deepEqual(p.missing, [{ reason: 'COMIDA_DIFERENTE_SIN_CANTIDADES', count: 1 }], 'la cena tiene registro: lo que falta es la cantidad, que sigue desconocida');
  assert.deepEqual(p.coverage?.planMeals, { daysKnown: 1, daysUndetermined: [], expected: 4, withPlanOption: 3, withDifferentMeal: 1, withoutRecord: 0 });
  assert.equal(detalle(p, 'Comidas del plan'), '4 de 4 con registro · 3 con opción del plan · 1 con comida diferente');
  assert.equal(detalle(p, 'Sin registro'), null);
});

test('6 · D-2, ejemplo 2: dos opciones, una comida diferente y una sin registro: «3 de 4 con registro · 1 sin registro», con el desglose', () => {
  const registros = [...dia('2026-10-20', ['Desayuno', 'Almuerzo']), registro('2026-10-20', null, { diferente: true, enLaComida: 'Merienda' })];
  const p = punto(serieDe(registros, UN_DIA_TIPO), '2026-10-20');
  assert.deepEqual(p.coverage?.planMeals, { daysKnown: 1, daysUndetermined: [], expected: 4, withPlanOption: 2, withDifferentMeal: 1, withoutRecord: 1 });
  assert.equal(detalle(p, 'Comidas del plan'), '3 de 4 con registro · 1 sin registro · 2 con opción del plan · 1 con comida diferente');
  assert.equal(detalle(p, 'Sin registro'), 'Cena');
  assert.deepEqual(p.missing, [
    { reason: 'COMIDA_DIFERENTE_SIN_CANTIDADES', count: 1 },
    { reason: 'COMIDA_DEL_PLAN_SIN_REGISTRO', count: 1 },
  ]);
  // Registros dice el mismo conteo, con el desglose en sus notas.
  const contraste = construirContraste(['2026-10-20'], versiones(UN_DIA_TIPO), registros.map(ingestaDelContraste));
  const enRegistros = resumenDeUnDia(componerLosRegistros(contraste, null)[0]!, false);
  assert.equal(enRegistros.principal, '3 de 4 comidas con registro');
  assert.deepEqual(
    enRegistros.notas.map((n) => n.texto),
    ['2 con opción del plan', '1 comida diferente', '1 sin registro'],
  );
});

test('6 · una comida diferente fuera de toda comida del plan no ocupa ninguna: la cena sigue sin registro', () => {
  const s = serieDe([...dia('2026-10-20', ['Desayuno', 'Almuerzo', 'Merienda']), registro('2026-10-20', null, { diferente: true, enLaComida: null })], UN_DIA_TIPO);
  const p = punto(s, '2026-10-20');
  assert.deepEqual(p.missing, [
    { reason: 'COMIDA_DIFERENTE_SIN_CANTIDADES', count: 1 },
    { reason: 'COMIDA_DEL_PLAN_SIN_REGISTRO', count: 1 },
  ]);
  assert.equal(detalle(p, 'Sin registro'), 'Cena');
  // D-2, ejemplo 3: no cubre ninguna comida del plan, ni se suma al conteo.
  assert.equal(detalle(p, 'Comidas del plan'), '3 de 4 con registro · 1 sin registro');
});

test('6 · una comida con su opción del plan y además una comida diferente cuenta una vez, como opción del plan', () => {
  const p = punto(serieDe([...dia('2026-10-20', COMIDAS), registro('2026-10-20', null, { diferente: true, enLaComida: 'Cena' })], UN_DIA_TIPO), '2026-10-20');
  assert.deepEqual(p.coverage?.planMeals, { daysKnown: 1, daysUndetermined: [], expected: 4, withPlanOption: 4, withDifferentMeal: 0, withoutRecord: 0 });
  assert.equal(detalle(p, 'Comidas del plan'), '4 de 4 con registro', 'no «5 de 4», ni el desglose: todas tienen la opción del plan');
});

test('6 · un día con registros pero ninguno en una comida del plan no dice «0 de 4»', () => {
  const p = punto(serieDe([registro('2026-10-20', null, { diferente: true, enLaComida: null })], UN_DIA_TIPO), '2026-10-20');
  assert.equal(detalle(p, 'Comidas del plan'), 'ninguna de 4 con registro · 4 sin registro');
});

// ─── 7. Rectificación y anulación ───────────────────────────────────────────────────────────────

test('7 · una rectificación sigue ocupando su comida y cuenta una vez; una anulación la libera y queda fuera del número', () => {
  const s = serieDe(
    [
      registro('2026-10-20', 'Desayuno', { kcal: '450', rectificado: true }),
      registro('2026-10-20', 'Almuerzo'),
      registro('2026-10-20', 'Merienda'),
      registro('2026-10-20', 'Cena', { anulado: true }),
    ],
    UN_DIA_TIPO,
  );
  const p = punto(s, '2026-10-20');
  assert.equal(p.value, 1450, '450 (la rectificación vigente) + 500 + 500; la cena anulada no suma');
  assert.equal(p.corrected, true);
  assert.equal(p.quality, 'PARTIAL');
  assert.deepEqual(p.missing, [{ reason: 'COMIDA_DEL_PLAN_SIN_REGISTRO', count: 1 }], 'deshacer la cena la deja sin registro');
  assert.equal(detalle(p, 'Sin registro'), 'Cena');
  assert.equal(s.cobertura.annulledExcluded, 1);
  assert.equal(s.cobertura.rectifiedCountedOnce, 1);
});

// ─── Sin un criterio confiable: no se inventan comidas ──────────────────────────────────────────

test('sin plan vigente (ninguna versión conocida): los registros con cantidades no son «completos», se dice que no se sabe qué indicaba el plan', () => {
  const s = serieDe(dia('2026-10-20', ['Desayuno', 'Almuerzo']), null);
  const p = punto(s, '2026-10-20');
  assert.equal(p.quality, 'COMPLETE', 'nada falta de lo que el punto suma');
  assert.deepEqual(p.coverage?.planMeals, { daysKnown: 0, daysUndetermined: [{ reason: 'NO_ACTIVE_PLAN', days: 1 }], expected: 0, withPlanOption: 0, withDifferentMeal: 0, withoutRecord: 0 });
  assert.equal(calidadEnPalabras(p), 'registros con cantidades, sin saber qué comidas indicaba el plan');
  assert.equal(detalle(p, 'Comidas del plan'), 'sin determinar: no había un plan vigente');
  const r = resumirPeriodo(s.serie, ENERGIA, PERIODO.desde, PERIODO.hasta, PERIODO.hoy);
  assert.equal(r.dias?.comidasDelPlan?.diasSinDeterminar, 1);
  assert.deepEqual(coberturaBreve(r).detalle, ['1 día sin saber qué comidas indicaba el plan', 'hoy, en curso: fuera de la media']);
});

test('dos días tipo: con opciones del plan registradas, el día tipo es el que usó la persona; solo con comidas diferentes, no se elige ninguno', () => {
  const descanso = serieDe([registro('2026-10-20', 'Almuerzo', { diaTipo: 'dt-descanso' }), registro('2026-10-20', 'Cena', { diaTipo: 'dt-descanso' })], DOS_DIAS_TIPO);
  assert.deepEqual(punto(descanso, '2026-10-20').coverage?.planMeals, { daysKnown: 1, daysUndetermined: [], expected: 2, withPlanOption: 2, withDifferentMeal: 0, withoutRecord: 0 }, 'el descanso tiene dos comidas, no cuatro');
  const soloDiferentes = serieDe([registro('2026-10-20', null, { diferente: true, enLaComida: 'Almuerzo', diaTipo: 'dt-entreno' })], DOS_DIAS_TIPO);
  const p = punto(soloDiferentes, '2026-10-20');
  assert.deepEqual(p.coverage?.planMeals.daysUndetermined, [{ reason: 'DAY_TYPE_NOT_RECORDED', days: 1 }]);
  assert.ok(!p.missing.some((m) => m.reason === 'COMIDA_DEL_PLAN_SIN_REGISTRO'), 'sin el día tipo no se cuentan comidas sin registro');
  assert.equal(detalle(p, 'Comidas del plan'), 'sin determinar: el plan tiene más de un día tipo y no hay registros del plan que digan cuál');
});

// ─── El mismo criterio que la pestaña Registros ─────────────────────────────────────────────────

test('Analizar y Registros cuentan igual el mismo día: «3 de 4 comidas con registro» y «3 de 4 con registro · 1 sin registro»', () => {
  const registros = [...dia('2026-10-21', ['Desayuno', 'Almuerzo', 'Merienda'])];
  const contraste = construirContraste(['2026-10-21'], versiones(UN_DIA_TIPO), registros.map(ingestaDelContraste));
  const enRegistros = resumenDeUnDia(componerLosRegistros(contraste, null)[0]!, false);
  assert.equal(enRegistros.principal, '3 de 4 comidas con registro');
  assert.ok(enRegistros.notas.some((n) => n.texto === '1 sin registro'));
  assert.equal(detalle(punto(serieDe(registros, UN_DIA_TIPO), '2026-10-21'), 'Comidas del plan'), '3 de 4 con registro · 1 sin registro');
});

// ─── La semana, el conteo y el Resumen del área ─────────────────────────────────────────────────

test('la semana suma las comidas del plan de sus días y es un subtotal si a alguno le falta una', () => {
  const s = serieDe([...dia('2026-10-19', COMIDAS), ...dia('2026-10-20', ['Desayuno', 'Almuerzo'])], UN_DIA_TIPO, 'ENERGY', 'WEEK');
  const semana = s.serie.points.find((p) => p.date === '2026-10-19')!;
  assert.equal(semana.value, 1500, 'la media de los días con valor: (2000 + 1000) / 2, como siempre');
  assert.equal(semana.quality, 'PARTIAL');
  assert.deepEqual(semana.missing, [{ reason: 'COMIDA_DEL_PLAN_SIN_REGISTRO', count: 2 }]);
  assert.deepEqual(semana.coverage?.planMeals, { daysKnown: 2, daysUndetermined: [], expected: 8, withPlanOption: 6, withDifferentMeal: 0, withoutRecord: 2 });
  assert.equal(semana.detail.find((d) => d.label === 'Comidas del plan')?.value, '6 de 8 con registro · 2 sin registro en 2 días');
});

test('el conteo de registros es exacto aunque falte una comida: no se vuelve un subtotal, pero dice las comidas del plan', () => {
  const s = serieDe(dia('2026-10-21', ['Desayuno', 'Almuerzo', 'Merienda']), UN_DIA_TIPO, 'RECORDS');
  const p = punto(s, '2026-10-21');
  assert.equal(p.value, 3);
  assert.equal(p.quality, 'COMPLETE');
  assert.equal(calidadEnPalabras(p, true), 'cuenta de los registros');
  assert.equal(detalle(p, 'Comidas del plan'), '3 de 4 con registro · 1 sin registro');
});

test('el Resumen del área dice las comidas del plan sin registro del período, sin contar hoy, en el texto y en sus partes', () => {
  const s = serieDe([...dia('2026-10-20', COMIDAS), ...dia('2026-10-21', ['Desayuno', 'Almuerzo', 'Merienda']), registro('2026-10-23', 'Desayuno')], UN_DIA_TIPO);
  assert.deepEqual(s.cobertura.planMeals, { daysKnown: 2, daysUndetermined: [], expected: 8, withPlanOption: 7, withDifferentMeal: 0, withoutRecord: 1 });
  const formato: FormatoDeLaSintesis = { fecha: (f) => f, dia: (i) => i };
  const o: ObservacionDelResumen = { regla: 'COBERTURA_NUTRICIONAL', area: 'NUTRICION', prioridad: 4, alcance: { tipo: 'PERIODO', desde: PERIODO.desde, hasta: PERIODO.hasta }, origen: [], accion: null, args: { ...s.cobertura, primerPlanDesde: null } };
  assert.equal(textoDeObservacion(o, formato), '3 de 7 días con algún registro; 8 registros: 8 con cantidades y 0 sin cantidades; 1 comida del plan sin registro.');
  assert.deepEqual(partesDeObservacion(o, formato).at(-1), { cifra: '1', texto: 'comida del plan sin registro' });
});
