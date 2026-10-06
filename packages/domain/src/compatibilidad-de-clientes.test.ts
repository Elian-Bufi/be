/**
 * Precierre del 2026-10-06, §2 (DL-122): qué clientes pueden recibir un plan con objetivos por serie. Las APK instaladas
 * (0.13.2, versionCode 22; candidatas 0.14.0, 23 y 24) muestran solo los objetivos generales y no muestran textos del
 * servidor: un plan que exige objetivos por serie no se les entrega ni se activa para un titular sin un cliente capaz.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearClienteBe } from './cliente-http';
import {
  CAPACIDAD_OBJETIVOS_POR_SERIE,
  capacidadesDeclaradas,
  HEADER_DE_CAPACIDADES,
  planExigeObjetivosPorSerie,
  prescripcionExigeObjetivosPorSerie,
  valorDeCapacidades,
} from './compatibilidad-de-clientes';
import type { PrescripcionParaResolver } from './objetivos-por-serie';

const kg = (value: number) => ({ value, unit: 'kg' as const });
const general: PrescripcionParaResolver = {
  intensity: { criterion: 'RIR', target: { value: 3 } },
  suggestedLoad: kg(16),
  restSeconds: 90,
  sets: [{ repetitions: { min: 12, max: 16 } }, { repetitions: { min: 10, max: 12 } }, { repetitions: { min: 8, max: 10 } }],
};
const conSerie = (i: number, campos: Partial<PrescripcionParaResolver['sets'][number]>): PrescripcionParaResolver => ({
  ...general,
  sets: general.sets.map((s, j) => (j === i ? { ...s, ...campos } : s)),
});

test('sin la cabecera, o con una que no se entiende, el cliente no declara ninguna capacidad', () => {
  assert.equal(capacidadesDeclaradas(undefined).size, 0);
  assert.equal(capacidadesDeclaradas(null).size, 0);
  assert.equal(capacidadesDeclaradas('').size, 0);
  assert.equal(capacidadesDeclaradas('otra-cosa').size, 0);
  assert.equal(capacidadesDeclaradas(`${CAPACIDAD_OBJETIVOS_POR_SERIE},${'x'.repeat(300)}`).size, 0, 'una cabecera desmedida no se lee');
  assert.deepEqual([...capacidadesDeclaradas(CAPACIDAD_OBJETIVOS_POR_SERIE)], [CAPACIDAD_OBJETIVOS_POR_SERIE]);
  assert.deepEqual([...capacidadesDeclaradas(` futura-1 , ${CAPACIDAD_OBJETIVOS_POR_SERIE} `)], [CAPACIDAD_OBJETIVOS_POR_SERIE]);
  assert.deepEqual([...capacidadesDeclaradas(['futura-1', CAPACIDAD_OBJETIVOS_POR_SERIE])], [CAPACIDAD_OBJETIVOS_POR_SERIE]);
  assert.equal(valorDeCapacidades([CAPACIDAD_OBJETIVOS_POR_SERIE, CAPACIDAD_OBJETIVOS_POR_SERIE]), CAPACIDAD_OBJETIVOS_POR_SERIE);
});

test('una prescripción exige objetivos por serie solo si alguna serie tiene un RIR o una carga distintos de los generales', () => {
  assert.equal(prescripcionExigeObjetivosPorSerie(general), false, 'sin nada por serie');
  assert.equal(prescripcionExigeObjetivosPorSerie(conSerie(1, { rir: 3 })), false, 'el mismo RIR que el general');
  assert.equal(prescripcionExigeObjetivosPorSerie(conSerie(1, { suggestedLoad: kg(16) })), false, 'la misma carga que la general');
  assert.equal(prescripcionExigeObjetivosPorSerie(conSerie(1, { restSeconds: 120 })), false, 'solo otro descanso: una APK anterior no muestra descansos');
  assert.equal(prescripcionExigeObjetivosPorSerie(conSerie(1, { rir: 2 })), true, 'otro RIR');
  assert.equal(prescripcionExigeObjetivosPorSerie(conSerie(2, { rir: null })), true, 'una serie sin RIR: la APK anterior mostraría RIR 3');
  assert.equal(prescripcionExigeObjetivosPorSerie(conSerie(1, { suggestedLoad: kg(18) })), true, 'otra carga');
  assert.equal(prescripcionExigeObjetivosPorSerie(conSerie(1, { suggestedLoad: { value: 16, unit: 'lb' } })), true, 'otra unidad');
  assert.equal(prescripcionExigeObjetivosPorSerie(conSerie(0, { suggestedLoad: null })), true, 'una serie sin carga');
  // Con %RM no hay RIR por serie (REG-06-128), pero sí puede haber otra carga.
  const porcentaje: PrescripcionParaResolver = { ...general, intensity: { criterion: '%RM', target: { value: 70 } } };
  assert.equal(prescripcionExigeObjetivosPorSerie(porcentaje), false);
  assert.equal(prescripcionExigeObjetivosPorSerie({ ...porcentaje, sets: [{ repetitions: { value: 5 }, suggestedLoad: kg(60) }] }), true);
  // Sin carga general, una serie con carga también exige un cliente capaz.
  assert.equal(prescripcionExigeObjetivosPorSerie({ ...general, suggestedLoad: null, sets: [{ repetitions: { value: 5 }, suggestedLoad: kg(10) }] }), true);
});

test('«Piernas A» del paquete exige objetivos por serie; un plan con los mismos objetivos en todas las series, no', () => {
  // A y B cambian el RIR y la carga por serie (sesion_demo.json); C solo cambia el descanso de la última serie.
  const A = conSerie(2, { rir: 1, suggestedLoad: kg(20), restSeconds: 150 });
  const C: PrescripcionParaResolver = { intensity: null, suggestedLoad: kg(0), restSeconds: 90, sets: [{ repetitions: { min: 10, max: 12 } }, { repetitions: { min: 8, max: 10 }, restSeconds: null }] };
  assert.equal(prescripcionExigeObjetivosPorSerie(C), false);
  assert.equal(planExigeObjetivosPorSerie({ blocks: [{ sessions: [{ prescriptions: [A, C] }], microcycles: [] }] }), true);
  assert.equal(planExigeObjetivosPorSerie({ blocks: [{ sessions: [], microcycles: [{ sessions: [{ prescriptions: [C] }] }, { sessions: [{ prescriptions: [A] }] }] }] }), true, 'también dentro de un microciclo');
  assert.equal(planExigeObjetivosPorSerie({ blocks: [{ sessions: [{ prescriptions: [general, C] }], microcycles: [] }] }), false);
  assert.equal(planExigeObjetivosPorSerie({ blocks: [] }), false);
});

test('el cliente HTTP declara sus capacidades solo si las tiene, en todos los pedidos', async () => {
  const vistos: Headers[] = [];
  const fetch = (async (_url: string, init?: RequestInit) => {
    vistos.push(new Headers(init?.headers));
    return new Response(JSON.stringify({ error: { code: 'RESOURCE_NOT_FOUND', message: 'x' } }), { status: 404, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof globalThis.fetch;
  await crearClienteBe({ baseUrl: '/api/v1', superficie: 'APK', capacidades: [CAPACIDAD_OBJETIVOS_POR_SERIE], fetch }).hoyDeEntrenamiento('token-de-prueba');
  await crearClienteBe({ baseUrl: '/api/v1', superficie: 'APK', fetch }).hoyDeEntrenamiento('token-de-prueba');
  await crearClienteBe({ baseUrl: '/api/v1', superficie: 'WEB', capacidades: [], fetch }).hoyDeEntrenamiento('token-de-prueba');
  assert.equal(vistos[0]!.get(HEADER_DE_CAPACIDADES), CAPACIDAD_OBJETIVOS_POR_SERIE);
  assert.equal(vistos[1]!.get(HEADER_DE_CAPACIDADES), null);
  assert.equal(vistos[2]!.get(HEADER_DE_CAPACIDADES), null);
});
