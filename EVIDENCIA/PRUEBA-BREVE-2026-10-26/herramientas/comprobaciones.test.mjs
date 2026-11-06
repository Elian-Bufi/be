// Las pruebas de comprobaciones.mjs, sin red: los casos negativos del verificador estricto (encargo de Dirección del
// 2026-10-26, §2). Uso: node --test comprobaciones.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import * as esperado from './esperado.mjs';
import { COMIDAS_DOS, COMIDAS_TRES, FECHAS, HUECO_DOS, OBJETIVO_DOS, OBJETIVO_TRES, PLAN_DOS, PLAN_TRES, SESION_UNO } from './datos.mjs';
import { ALIMENTOS, EJERCICIOS_BASE } from '../../DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/catalogo.mjs';
import { diaMenos } from '../../DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/herramientas.mjs';
import {
  COMPROBADO,
  CON_DIFERENCIAS,
  FALTA,
  NO_COMPROBADO,
  busquedaPrevista,
  compararNutricion,
  comprobado,
  conDiferencias,
  controlDeSesion,
  falta,
  noComprobado,
  nutricionPrevista,
  rechazoPrevisto,
  sesionPrevista,
  veredicto,
} from './comprobaciones.mjs';

const api = (status, codigo) => ({ ok: false, tipo: 'API', status, codigo, issues: [] });
const RED = { ok: false, tipo: 'RED' };
const OK = { ok: true, datos: { data: [] } };

// ─── El rechazo de Cuatro y Cinco ──────────────────────────────────────────────────────────────────────────────

test('el rechazo del contrato (404 RESOURCE_NOT_FOUND) queda comprobado', () => {
  assert.equal(rechazoPrevisto(api(404, 'RESOURCE_NOT_FOUND')).estado, COMPROBADO);
});

test('una sesión vencida, revocada o ausente no prueba el rechazo', () => {
  for (const codigo of ['SESSION_EXPIRED', 'SESSION_REVOKED', 'SESSION_INVALID', 'AUTHENTICATION_REQUIRED']) assert.equal(rechazoPrevisto(api(401, codigo)).estado, NO_COMPROBADO, codigo);
});

test('un 503, un 500, el límite de pedidos o una falla de red no prueban el rechazo', () => {
  assert.equal(rechazoPrevisto(api(503, 'SERVICE_UNAVAILABLE')).estado, NO_COMPROBADO);
  assert.equal(rechazoPrevisto(api(500, 'INTERNAL_ERROR')).estado, NO_COMPROBADO);
  assert.equal(rechazoPrevisto(api(429, 'RATE_LIMITED')).estado, NO_COMPROBADO);
  assert.equal(rechazoPrevisto(RED).estado, NO_COMPROBADO);
  assert.equal(rechazoPrevisto(api(502, 'RESPUESTA_NO_RECONOCIDA')).estado, NO_COMPROBADO);
});

test('que el profesional lea, u otro rechazo, son diferencias', () => {
  assert.equal(rechazoPrevisto(OK).estado, CON_DIFERENCIAS);
  assert.equal(rechazoPrevisto(api(403, 'ACTION_FORBIDDEN')).estado, CON_DIFERENCIAS);
  assert.equal(rechazoPrevisto(api(404, 'OTRO_CODIGO')).estado, CON_DIFERENCIAS);
  assert.equal(rechazoPrevisto(api(422, 'VALIDATION_FAILED')).estado, CON_DIFERENCIAS);
});

test('el control de la sesión solo vale si la misma sesión leyó', () => {
  assert.equal(controlDeSesion(OK).estado, COMPROBADO);
  assert.equal(controlDeSesion(api(401, 'SESSION_EXPIRED')).estado, NO_COMPROBADO);
  assert.equal(controlDeSesion(RED).estado, NO_COMPROBADO);
});

// ─── El veredicto ──────────────────────────────────────────────────────────────────────────────────────────────

const OBLIGATORIOS = ['A', 'B', 'C'].map((clave) => ({ clave, nombre: `Escenario ${clave}` }));
const escenario = (clave, ...partes) => ({ clave, nombre: `Escenario ${clave}`, partes });
const sinDiferenciasEn = (v) => v.lineas.some((l) => l.includes('SIN DIFERENCIAS'));

test('SIN DIFERENCIAS y salida 0 solo con todos los obligatorios comprobados', () => {
  const v = veredicto([escenario('A', comprobado('a')), escenario('B', comprobado('b')), escenario('C', comprobado('c'))], OBLIGATORIOS);
  assert.equal(v.codigo, 0);
  assert.match(v.lineas.at(-1), /^SIN DIFERENCIAS/);
  assert.deepEqual(v.comprobados, ['A', 'B', 'C']);
});

test('una fase que falta: PREPARACIÓN INCOMPLETA, salida 2 y nunca SIN DIFERENCIAS', () => {
  const v = veredicto([escenario('A', comprobado('a')), escenario('B', falta('falta la fase «pasado»')), escenario('C', comprobado('c'))], OBLIGATORIOS);
  assert.equal(v.codigo, 2);
  assert.match(v.lineas.at(-1), /^PREPARACIÓN INCOMPLETA/);
  assert.equal(sinDiferenciasEn(v), false);
  assert.deepEqual(v.pendientes, ['B']);
});

test('un escenario que no se pudo comprobar (503) también deja la preparación incompleta', () => {
  const v = veredicto([escenario('A', comprobado('a')), escenario('B', comprobado('b'), noComprobado('la API no respondió bien (503)')), escenario('C', comprobado('c'))], OBLIGATORIOS);
  assert.equal(v.codigo, 2);
  assert.equal(sinDiferenciasEn(v), false);
});

test('un escenario omitido o sin partes cuenta como faltante', () => {
  assert.equal(veredicto([escenario('A', comprobado('a')), escenario('B', comprobado('b'))], OBLIGATORIOS).codigo, 2);
  assert.equal(veredicto([escenario('A', comprobado('a')), escenario('B', comprobado('b')), escenario('C')], OBLIGATORIOS).codigo, 2);
});

test('diferencias: salida 1, y con algo pendiente, salida 2 con las dos listas', () => {
  const v = veredicto([escenario('A', comprobado('a')), escenario('B', conDiferencias('registrado 1418, se esperaba 1419')), escenario('C', comprobado('c'))], OBLIGATORIOS);
  assert.equal(v.codigo, 1);
  assert.match(v.lineas.at(-1), /^DIFERENCIAS/);
  const w = veredicto([escenario('A', falta('falta la fase «api»')), escenario('B', conDiferencias('x')), escenario('C', comprobado('c'))], OBLIGATORIOS);
  assert.equal(w.codigo, 2);
  assert.ok(w.lineas.some((l) => l.startsWith('Diferencias (1)')));
  assert.ok(w.lineas.some((l) => l.startsWith('Faltan o no se pudieron comprobar (1)')));
  assert.equal(sinDiferenciasEn(w), false);
});

// ─── La comparación de Nutrición ───────────────────────────────────────────────────────────────────────────────

const HOY = '2026-10-26';
const COMPOSICION = Object.fromEntries(Object.entries(ALIMENTOS).map(([k, a]) => [k, { energyKcal: a.kcal, proteinG: a.p }]));
const DOS = { plan: PLAN_DOS, objetivo: OBJETIVO_DOS, comidas: COMIDAS_DOS, hueco: HUECO_DOS };
const TRES = { plan: PLAN_TRES, objetivo: OBJETIVO_TRES, comidas: COMIDAS_TRES };

/** Una respuesta con la forma de API-PRJ-01 armada con lo esperado: la que el comparador tiene que aceptar sin diferencias. */
function respuestaComoLaEsperada(x, metrica) {
  const nutriente = metrica === 'ENERGY' ? 'energyKcal' : 'proteinG';
  const delDia = esperado.delDia(x.plan, COMPOSICION, nutriente);
  const days = [];
  const points = [];
  for (let k = FECHAS.activacion.hace; k >= 0; k--) {
    const date = diaMenos(HOY, k);
    days.push(delDia.state === 'DETERMINED' ? { date, state: 'DETERMINED', value: Number(esperado.exacto(delDia.value)) } : { date, state: 'UNDETERMINED', reason: delDia.reason, mealsWithSeveralOptions: delDia.mealsWithSeveralOptions });
    const dia = x.comidas.find((y) => y.hace === k);
    if (!dia) continue;
    const r = esperado.registradoDelDia(x.plan, dia, COMPOSICION, nutriente);
    points.push({ date, value: Number(esperado.exacto(r.total)), quality: r.completo ? 'COMPLETE' : 'PARTIAL', n: Object.keys(dia.comidas).length, segment: x.hueco !== undefined && k < x.hueco ? 'tramo-2' : 'tramo-1' });
  }
  const meals = x.comidas.flatMap((dia) =>
    Object.entries(dia.comidas).map(([comida, reg]) => {
      const v = esperado.indicadoDeLaComida(x.plan, comida, reg, COMPOSICION, nutriente);
      return v === null ? { state: 'UNDETERMINED', reason: 'DIFFERENT_MEAL' } : { state: 'DETERMINED', value: Number(esperado.exacto(v)) };
    }),
  );
  const gaps = x.hueco !== undefined ? [{ from: diaMenos(HOY, x.hueco), to: diaMenos(HOY, x.hueco), days: 1, state: 'NO_DATA' }] : [];
  const objetivo = metrica === 'ENERGY' ? x.objetivo.kcal : x.objetivo.proteina;
  return {
    recorded: { points, gaps },
    prescribed: { objectiveSteps: [{ from: diaMenos(HOY, FECHAS.objetivo.hace), to: null, amount: { value: objetivo } }], planned: { days, meals } },
    coverage: { daysWithRecords: x.comidas.length, records: x.comidas.reduce((n, d) => n + Object.keys(d.comidas).length, 0) },
  };
}
const diferencias = (x, r, metrica = 'ENERGY') => compararNutricion(x, HOY, COMPOSICION, r, metrica).diferencias;

test('la comparación acepta una respuesta igual a lo esperado (Dos y Tres, kcal y proteína)', () => {
  for (const x of [DOS, TRES]) for (const m of ['ENERGY', 'PROTEIN']) assert.deepEqual(diferencias(x, respuestaComoLaEsperada(x, m), m), []);
});

test('un número registrado distinto es una diferencia', () => {
  const r = respuestaComoLaEsperada(DOS, 'ENERGY');
  r.recorded.points.at(-1).value += 1;
  assert.equal(diferencias(DOS, r).length, 1);
});

test('el subtotal tiene que llegar como parcial', () => {
  const r = respuestaComoLaEsperada(DOS, 'ENERGY');
  r.recorded.points.find((p) => p.date === diaMenos(HOY, 2)).quality = 'COMPLETE';
  assert.match(diferencias(DOS, r)[0], /calidad COMPLETE, se esperaba PARTIAL/);
});

test('el hueco: tiene que figurar como hueco y cortar la línea', () => {
  const unida = respuestaComoLaEsperada(DOS, 'ENERGY');
  for (const p of unida.recorded.points) p.segment = 'tramo-1';
  assert.ok(diferencias(DOS, unida).some((d) => d.startsWith('hueco: la línea une')));
  const sinHueco = respuestaComoLaEsperada(DOS, 'ENERGY');
  sinHueco.recorded.gaps = [];
  assert.ok(diferencias(DOS, sinHueco).some((d) => d.includes('no figura entre los huecos')));
  const conCero = respuestaComoLaEsperada(DOS, 'ENERGY');
  conCero.recorded.points.push({ date: diaMenos(HOY, HUECO_DOS), value: 0, quality: 'COMPLETE', n: 1, segment: 'tramo-1' });
  assert.ok(diferencias(DOS, conCero).some((d) => d.includes('se esperaba un día sin registros')));
});

test('con alternativas no hay indicado del día; si llega uno, es una diferencia', () => {
  const r = respuestaComoLaEsperada(TRES, 'ENERGY');
  r.prescribed.planned.days[3] = { date: r.prescribed.planned.days[3].date, state: 'DETERMINED', value: 1500 };
  assert.match(diferencias(TRES, r)[0], /indicado DETERMINED, se esperaba UNDETERMINED/);
});

test('la comida diferente no tiene indicado; si llega uno, es una diferencia', () => {
  const r = respuestaComoLaEsperada(TRES, 'ENERGY');
  const i = r.prescribed.planned.meals.findIndex((m) => m.state === 'UNDETERMINED');
  r.prescribed.planned.meals[i] = { state: 'DETERMINED', value: 800 };
  assert.ok(diferencias(TRES, r).length >= 1);
});

test('una comparación que no se pudo leer no se compara: queda sin comprobar', () => {
  assert.equal(nutricionPrevista(DOS, HOY, COMPOSICION, api(503, 'SERVICE_UNAVAILABLE'), 'ENERGY').parte.estado, NO_COMPROBADO);
  assert.equal(nutricionPrevista(DOS, HOY, COMPOSICION, RED, 'ENERGY').parte.estado, NO_COMPROBADO);
  assert.equal(nutricionPrevista(DOS, HOY, COMPOSICION, api(404, 'RESOURCE_NOT_FOUND'), 'ENERGY').parte.estado, CON_DIFERENCIAS);
});

// ─── La sesión de Uno ──────────────────────────────────────────────────────────────────────────────────────────

function hoyDeUno(estado = 'NOT_STARTED') {
  const prescripcion = (x, nombre) => ({
    exerciseVersionId: EJERCICIOS_BASE[x.ejercicio],
    exerciseName: nombre,
    sets: Array.from({ length: x.series }, () => ({ repetitions: { value: x.repeticiones } })),
    suggestedLoad: { value: x.cargaKg, unit: 'kg' },
    intensity: { criterion: 'RIR', target: { value: x.rir } },
  });
  return {
    planState: 'AVAILABLE',
    occurrences: [{ plannedSession: { label: SESION_UNO.sesion, prescriptions: [prescripcion(SESION_UNO.ejercicios[0], 'Press de banca'), prescripcion(SESION_UNO.ejercicios[1], 'Sentadilla')] }, execution: { state: estado } }],
  };
}

test('la sesión de Uno: comprobada sin empezar; ya usada o con otra carga, diferencias', () => {
  assert.equal(sesionPrevista(hoyDeUno(), SESION_UNO).estado, COMPROBADO);
  assert.equal(sesionPrevista(hoyDeUno('COMPLETED'), SESION_UNO).estado, CON_DIFERENCIAS);
  const otraCarga = hoyDeUno();
  otraCarga.occurrences[0].plannedSession.prescriptions[1].suggestedLoad.value = 60;
  assert.equal(sesionPrevista(otraCarga, SESION_UNO).estado, CON_DIFERENCIAS);
  assert.equal(sesionPrevista({ planState: 'AVAILABLE', occurrences: [] }, SESION_UNO).estado, CON_DIFERENCIAS);
});

test('la búsqueda tiene que traer un ejercicio disponible distinto de los de la sesión', () => {
  const propios = SESION_UNO.ejercicios.map((x) => ({ versionId: EJERCICIOS_BASE[x.ejercicio], name: x.ejercicio, available: true }));
  assert.equal(busquedaPrevista(propios, SESION_UNO, 'press').estado, CON_DIFERENCIAS);
  assert.equal(busquedaPrevista([...propios, { versionId: 'otro', name: 'Press inclinado', available: false }], SESION_UNO, 'press').estado, CON_DIFERENCIAS);
  assert.equal(busquedaPrevista([...propios, { versionId: 'otro', name: 'Press inclinado', available: true }], SESION_UNO, 'press').estado, COMPROBADO);
});

test('los estados son los cuatro previstos', () => {
  assert.deepEqual([COMPROBADO, CON_DIFERENCIAS, FALTA, NO_COMPROBADO], ['COMPROBADO', 'CON DIFERENCIAS', 'FALTA', 'NO COMPROBADO']);
});
