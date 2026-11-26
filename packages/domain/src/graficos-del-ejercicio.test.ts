/**
 * DL-204 (WP-GRAFICOS-DEL-EJERCICIO) · las cuentas de los gráficos del ejercicio: la regla en palabras, la historia antes
 * del inicio de la fase y la serie por serie. TEST-GE-01 a TEST-GE-08.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prescripcionDeLaSemana, type SemanaDeLaFase } from './carga-de-la-semana';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import type { EjecucionDeEntrenamiento, ProgresionDeLaFase } from './contratos-entrenamiento';
import {
  cargasPlanificadasDelEjercicio,
  cargasRealizadas,
  COPY_GRAFICOS_DEL_EJERCICIO as C,
  historiaAntesDelInicio,
  lecturaDeLaSerie,
  origenEnPalabras,
  reglaEnPalabras,
  semanaAntesDelInicio,
  SEMANAS_HACIA_ATRAS,
  seriesParaElGrafico,
  textoDeLaBarra,
  vezDeLaSemana,
} from './graficos-del-ejercicio';
import type { VezPasada } from './la-vez-pasada';

const kg = (value: number) => ({ value, unit: 'kg' as const });
const regla = (p: Partial<ProgresionDeLaFase>): ProgresionDeLaFase => ({ blockId: 'f1', model: 'LINEAR', loadStep: 2.5, repStep: 0, repRange: null, waves: null, deload: null, prescriptionIds: null, ...p });

const vez = (fecha: string, cargas: (number | null)[], comparable = true): VezPasada => ({
  executionId: `x-${fecha}`,
  prescriptionId: 'p1',
  fecha,
  sesion: 'Piernas A',
  cargadaOtroDia: false,
  corregida: false,
  comparable,
  como: { tipo: 'series', enLugarDe: null, series: cargas.map((c, i) => ({ numero: i + 1, carga: c === null ? null : kg(c), repeticiones: 8, rir: 2, duracion: null, cargaRapida: false, delPlan: [] })) },
});

test('TEST-GE-01 · la regla que rige, en palabras y con su origen', () => {
  assert.equal(reglaEnPalabras(regla({}), 'kg'), 'Lineal · +2,5 kg/sem');
  assert.equal(reglaEnPalabras(regla({ deload: { week: 4, mode: 'LOAD', workingLoadShare: 60, setsRemoved: 0 } }), 'kg'), 'Lineal · +2,5 kg/sem · descarga S4');
  assert.equal(reglaEnPalabras(regla({ model: 'DOUBLE', repRange: { min: 8, max: 12 } }), 'kg'), 'Doble progresión · 8-12 reps, +2,5 kg');
  assert.equal(reglaEnPalabras(regla({ model: null, loadStep: null, deload: { week: 4, mode: 'SETS', workingLoadShare: 100, setsRemoved: 1 } }), 'kg'), 'Descarga S4');
  assert.equal(reglaEnPalabras(regla({ model: null, loadStep: null }), 'kg'), 'Sin progresión');
  assert.equal(reglaEnPalabras(null, 'kg'), 'Sin progresión');
  assert.equal(origenEnPalabras('FASE'), 'la de la fase');
  assert.equal(origenEnPalabras('PROPIA'), 'propia');
  assert.equal(origenEnPalabras('NINGUNA'), null);
});

test('TEST-GE-02 · la semana antes del inicio: 1 es la de justo antes, con el tope de 12', () => {
  assert.equal(SEMANAS_HACIA_ATRAS, 12);
  assert.equal(semanaAntesDelInicio('2026-11-30', '2026-11-30'), null);
  assert.equal(semanaAntesDelInicio('2026-11-30', '2026-11-29'), 1);
  assert.equal(semanaAntesDelInicio('2026-11-30', '2026-11-23'), 1);
  assert.equal(semanaAntesDelInicio('2026-11-30', '2026-11-22'), 2);
  assert.equal(semanaAntesDelInicio('2026-11-30', '2026-09-07'), 12);
  assert.equal(semanaAntesDelInicio('2026-11-30', '2026-09-06'), null);
});

test('TEST-GE-03 · la historia: desde la semana más vieja con dato, lo más alto de cada semana, la más vieja primero', () => {
  const h = historiaAntesDelInicio(
    '2026-11-30',
    [
      { fecha: '2026-11-25', valor: 60 },
      { fecha: '2026-11-11', valor: 57.5 },
    ],
    [
      { fecha: '2026-11-26', valor: 60 },
      { fecha: '2026-11-24', valor: 62.5 },
      { fecha: '2026-11-12', valor: 55 },
      // Del plan actual: no es de antes.
      { fecha: '2026-12-01', valor: 70 },
    ],
  );
  assert.equal(h.semanas, 3);
  assert.deepEqual(h.planificadoAntes, [57.5, null, 60]);
  assert.deepEqual(h.realizado, [55, null, 62.5]);
});

test('TEST-GE-04 · un ejercicio nuevo, sin historia, no suma semanas', () => {
  const h = historiaAntesDelInicio('2026-11-30', [], []);
  assert.deepEqual(h, { semanas: 0, planificadoAntes: [], realizado: [] });
  assert.deepEqual(cargasRealizadas([], 'kg'), []);
  assert.deepEqual(cargasPlanificadasDelEjercicio([], 'E1', 'kg'), []);
});

test('TEST-GE-05 · lo planificado antes sale de la instantánea de cada sesión registrada, del mismo ejercicio y en su unidad', () => {
  const prescripcion = (exerciseId: string, carga: { value: number; unit: 'kg' | 'lb' } | null) => ({ prescriptionId: 'p', order: 1, exerciseId, exerciseVersionId: 'v', exerciseName: 'Sentadilla', sets: [], intensity: null, suggestedLoad: carga, professionalParameters: [], note: null });
  const ejecucion = (date: string, prescriptions: unknown[]) => ({ date, plannedSession: { prescriptions } }) as unknown as EjecucionDeEntrenamiento;
  const r = cargasPlanificadasDelEjercicio(
    [ejecucion('2026-11-20', [prescripcion('E1', kg(60)), prescripcion('E2', kg(100))]), ejecucion('2026-11-13', [prescripcion('e1', { value: 130, unit: 'lb' })]), ejecucion('2026-11-06', [prescripcion('E1', null)])],
    'E1',
    'kg',
  );
  assert.deepEqual(r, [{ fecha: '2026-11-20', valor: 60 }]);
  // Lo realizado: lo más alto de cada vez, sin las series sin carga.
  assert.deepEqual(cargasRealizadas([vez('2026-11-20', [20, 60, 62.5, null])], 'kg'), [{ fecha: '2026-11-20', valor: 62.5 }]);
});

test('TEST-GE-06 · serie por serie: A1, A2 y S1…, con la carga de la semana, la parte del 1RM y lo realizado', () => {
  const p = {
    prescriptionId: 'p1',
    intensity: null,
    suggestedLoad: kg(60),
    sets: [
      { setKind: 'WARM_UP' as const, repetitions: { value: 8 }, suggestedLoad: kg(25) },
      { setKind: 'WARM_UP' as const, repetitions: { value: 5 }, suggestedLoad: kg(40) },
      { setKind: 'WORKING' as const, repetitions: { value: 8 } },
      { setKind: 'WORKING' as const, repetitions: { value: 8 } },
    ],
  };
  // Semana 3 de una lineal de +2,5 kg: las efectivas suben 5 kg; las aproximaciones a mano quedan.
  const s: SemanaDeLaFase = { progresion: regla({}), semana: 3, semanas: 4 };
  const semana3 = prescripcionDeLaSemana(p, s, 'Sentadilla', null);
  const barras = seriesParaElGrafico(semana3, 'kg', 100, [
    { numero: 1, carga: kg(25) },
    { numero: 3, carga: kg(65) },
    { numero: 5, carga: kg(60) },
  ]);
  assert.deepEqual(
    barras.map((b) => [b.rotulo, b.aproximacion, b.planificada, b.realizada, b.delUnoRM]),
    [
      ['A1', true, 25, 25, 25],
      ['A2', true, 40, null, 40],
      ['S1', false, 65, 65, 65],
      ['S2', false, 65, null, 65],
      ['S3', false, null, 60, null],
    ],
  );
  assert.equal(textoDeLaBarra(barras[0]!, 'kg'), '25 kg · 25 % del 1RM');
  assert.equal(lecturaDeLaSerie(barras[2]!, 'kg', true), 'S1: Planificada 65 kg · 65 % del 1RM · Realizado 65 kg');
  assert.equal(lecturaDeLaSerie(barras[1]!, 'kg', false), 'A2 (aproximación): Planificada 40 kg · 40 % del 1RM');
  // Sin 1RM, la carga sola: ningún porcentaje sin base.
  assert.equal(textoDeLaBarra(seriesParaElGrafico(semana3, 'kg', null)[2]!, 'kg'), '65 kg');
  assert.equal(C.unoRM(101.5, 'kg'), '1RM 101,5 kg');
});

test('TEST-GE-07 · la vez de la semana: la más reciente con series del mismo ejercicio', () => {
  const fase = { desde: '2026-11-30', hasta: '2026-12-27' };
  const veces = [vez('2026-12-03', [60]), vez('2026-12-01', [57.5]), vez('2026-12-04', [70], false), vez('2026-12-09', [62.5])];
  assert.equal(vezDeLaSemana(veces, fase, 1)?.fecha, '2026-12-03');
  assert.equal(vezDeLaSemana(veces, fase, 2)?.fecha, '2026-12-09');
  assert.equal(vezDeLaSemana(veces, fase, 3), null);
});

test('TEST-GE-08 · ubica, no califica: ningún término prohibido y el «%» siempre con su base', () => {
  const textos = [
    ...Object.values(C).flatMap((v) => (typeof v === 'string' ? [v] : [])),
    C.seriePorSerie('Sentadilla'),
    C.delUnoRM(25),
    C.unoRM(101.5, 'kg'),
    C.semanasAntes(3),
    C.realizadoEl('jue 3 dic'),
    reglaEnPalabras(regla({ model: 'UNDULATING', waves: [90, 100, 105] }), 'kg'),
  ];
  for (const t of textos) assert.deepEqual(terminosProhibidosDeEntrenamientoEn(t), [], t);
  // Un porcentaje suelto sigue prohibido.
  assert.deepEqual(terminosProhibidosDeEntrenamientoEn('80 % logrado'), ['%']);
});
