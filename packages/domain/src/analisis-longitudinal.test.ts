/**
 * El entorno profesional de seguimiento (WP-DASHBOARD-PROFESIONAL): diccionario de métricas, series de nutrición,
 * entrenamiento y antropometría, referencia y cambio relativo, comparación de períodos y línea de tiempo.
 *
 * Los resultados esperados se escriben a mano, a partir del encargo de Dirección del 2026-10-08 (§11 a §13 y §17), y no
 * dependen de la implementación. Si una prueba falla, se corrige el cálculo, no el oráculo.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { z } from 'zod';
import { CLAVES_DE_PROYECCION, ProyeccionResponseSchema, type EntradaDeLineaDeTiempo, type SerieAnalitica } from './contratos-analisis';
import type { SerieApi } from './contratos-antropometria';
import { EjecucionDeEntrenamientoSchema, type EjecucionDeEntrenamiento, type Prescripcion, type SerieEjecutadaApi } from './contratos-entrenamiento';
import type { Nutrientes } from './contratos-recetas';
import { serieAntropometrica } from './antropometria-del-analisis';
import { ejerciciosDelPeriodo, objetivosDeLaVersionDelPlan, serieDeEntrenamiento } from './entrenamiento-del-analisis';
import type { ContenidoDePlanDeEntrenamiento } from './plan-de-entrenamiento';
import { agruparPorDia, codificarCursor, cumpleFiltros, decodificarCursor, ordenarEntradas, paginarEntradas, registradoTarde } from './linea-de-tiempo';
import { aplicarPreset, definicionAntropometrica, definicionDeMetrica, MAXIMO_DE_METRICAS, METRICAS_DEL_DICCIONARIO, PRESETS_DE_ANALISIS } from './metricas-del-analisis';
import { coberturaNutricional, diasNutricionales, serieNutricional, type RegistroParaAnalisis } from './nutricion-del-analisis';
import { compararPeriodos, huecosDelRango, lecturaEnFecha, lunesDe, puntosRelativos, referenciaDeLaSerie, resumenTextual, semanasDelPeriodo, superposicionPermitida } from './series-del-analisis';
import { sumaExacta } from './calculo-nutricional';

const ZONA = 'America/Argentina/Buenos_Aires';
const definicion = (id: string) => {
  const d = definicionDeMetrica(id);
  if (!d) throw new Error(`no existe ${id}`);
  return d;
};

// ─── Diccionario y contrato ─────────────────────────────────────────────────────────────────────

test('el catálogo de proyecciones es el del 09: ocho claves, ninguna extra (11A TEST-PRJ-001)', () => {
  assert.deepEqual([...CLAVES_DE_PROYECCION].sort(), [
    'ANTHROPOMETRY_LONGITUDINAL',
    'NUTRITION_PRESCRIBED_VS_RECORDED',
    'TRAINING_EFFECTIVE_VS_TOTAL_VOLUME',
    'TRAINING_PERSONAL_RECORDS',
    'TRAINING_PROGRESSION_BY_EXERCISE',
    'TRAINING_VOLUME_BY_EXERCISE',
    'TRAINING_VOLUME_BY_MUSCLE_ZONE',
    'TRAINING_WORK_DISTRIBUTION_BY_MUSCLE_ZONE',
  ]);
});

test('el contrato de la proyección no tiene dónde poner un puntaje, una adherencia ni un cumplimiento (TEST-PRJ-009)', () => {
  const claves = JSON.stringify(z.toJSONSchema(ProyeccionResponseSchema));
  assert.doesNotMatch(claves, /score|compliance|adherence|grade|percent|cumplimiento|adherencia/i);
});

test('el diccionario: tres métricas como máximo, presets sin una cuarta escondida, y lo que no se ofrece lo dice', () => {
  assert.equal(MAXIMO_DE_METRICAS, 3);
  for (const p of PRESETS_DE_ANALISIS) assert.ok(p.metricas.length <= 3, `${p.id} tiene más de tres métricas`);
  for (const m of METRICAS_DEL_DICCIONARIO) assert.ok(m.explicacion.length > 0 && m.comoSeCalcula.length > 0 && m.ausencias.length > 0, m.id);
  // El volumen no se ofrece sin una convención de carga externa: es futuro, no un cálculo inventado (encargo §12).
  const volumen = definicion('entrenamiento.volumen-carga-externa');
  assert.equal(volumen.implementada, false);
  assert.equal(volumen.clase, 'FUTURA');
  assert.match(volumen.comoSeCalcula, /50 kg × 8 = 400 kg·rep/);
  // Lo previsto del día no se suma: el plan tiene alternativas por comida (encargo §11).
  assert.equal(definicion('nutricion.energia-prevista-del-dia').clase, 'INCOMPLETA');
  // El RIR es ordinal: no admite cambio relativo.
  assert.equal(definicion('entrenamiento.rir').cambioRelativo, false);
  assert.equal(definicion('entrenamiento.rir').escala, 'ORDINAL');
});

test('un preset con una métrica que falta dice cuál falta y no la reemplaza por un sustituto', () => {
  const preset = PRESETS_DE_ANALISIS.find((p) => p.id === 'medidas-corporales')!;
  const r = aplicarPreset(preset, new Set(['antropometria.peso', 'antropometria.perimetro-cintura']));
  assert.deepEqual(r.usables, ['antropometria.peso', 'antropometria.perimetro-cintura']);
  assert.deepEqual(r.faltantes, ['antropometria.suma-6-pliegues-isak']);
});

test('las antropométricas: un porcentaje no admite cambio relativo ni se superpone; peso, masa y perímetro sí', () => {
  assert.equal(definicionAntropometrica('grasa-faulkner', '%').cambioRelativo, false);
  assert.equal(definicionAntropometrica('peso', 'kg').cambioRelativo, true);
  assert.equal(definicionAntropometrica('peso', 'kg').familia, 'masa-kg');
  assert.equal(definicionAntropometrica('perimetro-cintura', 'cm').familia, 'perimetro-cm');
  assert.equal(definicionAntropometrica('pliegue-triceps', 'mm').familia, 'pliegue-mm');
  assert.match(definicionAntropometrica('peso', 'kg').limites.join(' '), /no distingue grasa de músculo/);
});

// ─── Nutrición ──────────────────────────────────────────────────────────────────────────────────

const nutrientes = (kcal: string | null, proteina: string | null = '30'): Nutrientes => ({
  energyKcal: { value: kcal, missing: kcal === null ? [{ key: 'pan', reason: 'SIN_DATO_DEL_NUTRIENTE' }] : [] },
  carbohydrateG: { value: '50', missing: [] },
  fatG: { value: '20', missing: [] },
  proteinG: { value: proteina, missing: proteina === null ? [{ key: 'pan', reason: 'SIN_DATO_DEL_NUTRIENTE' }] : [] },
  fiberG: { value: '5', missing: [] },
});

let id = 0;
function registro(fecha: string, opciones: { kcal?: string | null; sinCantidades?: boolean; diferente?: boolean; anulado?: boolean; rectificado?: boolean; hora?: string } = {}): RegistroParaAnalisis {
  const sinCantidades = opciones.sinCantidades ?? false;
  return {
    recordId: `r-${++id}`,
    kind: opciones.diferente ? 'DIFFERENT' : 'PLAN_OPTION',
    localDate: fecha,
    occurredAt: `${fecha}T${opciones.hora ?? '13:00'}:00.000-03:00`,
    consumption: sinCantidades ? { status: 'UNCONFIRMED', items: [], source: 'ORIGINAL', rectifiedAt: null } : { status: 'REPORTED', items: [], source: opciones.rectificado ? 'RECTIFIED' : 'ORIGINAL', rectifiedAt: opciones.rectificado ? `${fecha}T20:00:00.000-03:00` : null },
    consumed: sinCantidades ? null : nutrientes(opciones.kcal === undefined ? '600' : opciones.kcal),
    annulment: opciones.anulado ? { annulledAt: `${fecha}T21:00:00.000-03:00`, reason: null } : null,
  };
}

const OPC = { desde: '2026-09-28', hasta: '2026-10-11', hoy: '2026-10-11' };

test('600 kcal confirmadas, un registro sin cantidades y una foto no son un total diario de 600 kcal: es un subtotal', () => {
  const dias = diasNutricionales([registro('2026-10-01'), registro('2026-10-01', { sinCantidades: true }), registro('2026-10-01', { sinCantidades: true, diferente: true })], OPC.desde, OPC.hasta);
  const s = serieNutricional(dias, definicion('nutricion.energia'), 'ENERGY', 'DAY', OPC);
  assert.equal(s.points.length, 1);
  const p = s.points[0]!;
  assert.equal(p.value, 600);
  assert.equal(p.quality, 'PARTIAL', 'subtotal de lo registrado, no completo');
  assert.deepEqual(p.missing, [
    { reason: 'SIN_CANTIDADES', count: 1 },
    { reason: 'COMIDA_DIFERENTE_SIN_CANTIDADES', count: 1 },
  ]);
  assert.deepEqual(p.coverage, { records: 3, recordsWithQuantities: 1, recordsWithoutQuantities: 2, daysWithData: null, daysInBucket: null });
  assert.equal(s.label, 'Energía registrada', 'nunca «consumo» ni «total»');
  assert.doesNotMatch(JSON.stringify(s), /consumo total|ingesta total del día/i);
});

test('un día solo con registros sin cantidades no es cero: es un punto sin valor que dice «sin cantidades»', () => {
  const dias = diasNutricionales([registro('2026-10-02', { sinCantidades: true })], OPC.desde, OPC.hasta);
  const p = serieNutricional(dias, definicion('nutricion.energia'), 'ENERGY', 'DAY', OPC).points[0]!;
  assert.equal(p.value, null);
  assert.equal(p.quality, 'UNKNOWN');
});

test('un nutriente sin dato en un alimento: el subtotal sigue con lo conocido y dice por qué falta', () => {
  const dias = diasNutricionales([registro('2026-10-03', { kcal: '500' }), registro('2026-10-03', { kcal: null })], OPC.desde, OPC.hasta);
  const p = serieNutricional(dias, definicion('nutricion.energia'), 'ENERGY', 'DAY', OPC).points[0]!;
  assert.equal(p.value, 500);
  assert.equal(p.quality, 'PARTIAL');
  assert.deepEqual(p.missing, [{ reason: 'SIN_DATO_DEL_NUTRIENTE', count: 1 }]);
  // Las proteínas del mismo día sí están completas.
  assert.equal(serieNutricional(dias, definicion('nutricion.proteinas'), 'PROTEIN', 'DAY', OPC).points[0]!.quality, 'COMPLETE');
});

test('una anulación queda fuera del número y una rectificación cuenta una sola vez (PRO-16)', () => {
  const registros = [registro('2026-10-04', { kcal: '700' }), registro('2026-10-04', { kcal: '400', anulado: true }), registro('2026-10-04', { kcal: '650', rectificado: true })];
  const dias = diasNutricionales(registros, OPC.desde, OPC.hasta);
  const p = serieNutricional(dias, definicion('nutricion.energia'), 'ENERGY', 'DAY', OPC).points[0]!;
  assert.equal(p.value, 1350, '700 + 650: la anulada no suma y la rectificada suma su valor vigente una vez');
  assert.equal(p.corrected, true);
  const c = coberturaNutricional(dias, OPC.desde, OPC.hasta);
  assert.equal(c.annulledExcluded, 1);
  assert.equal(c.rectifiedCountedOnce, 1);
  assert.equal(c.records, 2);
});

test('la media semanal es sobre los días con valor y dice su denominador: nunca la suma dividida por siete', () => {
  // Semana del lunes 28/9: dos días con cantidades (600 y 1000) de los siete.
  const dias = diasNutricionales([registro('2026-09-28', { kcal: '600' }), registro('2026-09-30', { kcal: '1000' })], OPC.desde, OPC.hasta);
  const p = serieNutricional(dias, definicion('nutricion.energia'), 'ENERGY', 'WEEK', OPC).points[0]!;
  assert.equal(p.value, 800, '(600 + 1000) / 2, no 1600 / 7');
  assert.equal(p.n, 2);
  assert.equal(p.coverage?.daysWithData, 2);
  assert.equal(p.coverage?.daysInBucket, 7);
  assert.equal(p.date, '2026-09-28');
  assert.equal(p.dateEnd, '2026-10-04');
});

test('caso difícil: baja la cobertura, pero no las cantidades de los días cuantificados', () => {
  // Semana 1: siete días con 2000 kcal. Semana 2: tres días con 2000 kcal y cuatro solo con registros sin cantidades.
  const registros = [
    ...['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'].map((f) => registro(f, { kcal: '2000' })),
    ...['2026-10-05', '2026-10-06', '2026-10-07'].map((f) => registro(f, { kcal: '2000' })),
    ...['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'].map((f) => registro(f, { sinCantidades: true })),
  ];
  const s = serieNutricional(diasNutricionales(registros, OPC.desde, OPC.hasta), definicion('nutricion.energia'), 'ENERGY', 'WEEK', OPC);
  const [a, b] = s.points;
  assert.equal(a!.value, 2000);
  assert.equal(b!.value, 2000, 'la media de los días cuantificados no baja: lo que baja es la cobertura');
  assert.equal(a!.coverage?.daysWithData, 7);
  assert.equal(b!.coverage?.daysWithData, 3);
  assert.equal(b!.quality, 'PARTIAL');
});

test('la suma exacta no pierde decimales: 0,1 + 0,2 es 0,3', () => {
  assert.equal(sumaExacta(['0.1', '0.2']), '0.3');
  assert.equal(sumaExacta(['529.22', '70.78']), '600');
});

test('un día sin registros corta la línea (no se une a través de un hueco) y es un hueco declarado', () => {
  const dias = diasNutricionales([registro('2026-10-01'), registro('2026-10-02'), registro('2026-10-04')], OPC.desde, OPC.hasta);
  const s = serieNutricional(dias, definicion('nutricion.energia'), 'ENERGY', 'DAY', OPC);
  assert.deepEqual(s.points.map((p) => p.segment), ['t1', 't1', 't2']);
  assert.ok(s.gaps.some((g) => g.from === '2026-10-03' && g.to === '2026-10-03'));
});

test('registros por día es cobertura: cuenta los efectivos y no convierte un día vacío en cero', () => {
  const dias = diasNutricionales([registro('2026-10-01'), registro('2026-10-01', { sinCantidades: true }), registro('2026-10-01', { anulado: true })], OPC.desde, OPC.hasta);
  const s = serieNutricional(dias, definicion('nutricion.registros'), 'RECORDS', 'DAY', OPC);
  assert.equal(s.points.length, 1);
  assert.equal(s.points[0]!.value, 2);
});

// ─── Fechas civiles ─────────────────────────────────────────────────────────────────────────────

test('semanas de lunes a domingo en fechas civiles, con las semanas parciales del período marcadas (PRO-17)', () => {
  assert.equal(lunesDe('2026-10-04'), '2026-09-28', 'el domingo 4/10 es de la semana del lunes 28/9');
  assert.equal(lunesDe('2026-10-05'), '2026-10-05');
  const semanas = semanasDelPeriodo('2026-10-01', '2026-10-14');
  assert.deepEqual(
    semanas.map((s) => [s.lunes, s.diasEnElPeriodo, s.parcial]),
    [
      ['2026-09-28', 4, true],
      ['2026-10-05', 7, false],
      ['2026-10-12', 3, true],
    ],
  );
  // 23:30 del domingo en Buenos Aires son las 02:30 UTC del lunes: el hecho es del domingo.
  assert.equal(registradoTarde('2026-10-04', '2026-10-05T02:30:00.000Z', ZONA), false);
  assert.equal(registradoTarde('2026-10-04', '2026-10-05T12:00:00.000Z', ZONA), true);
  assert.deepEqual(huecosDelRango('2026-10-01', '2026-10-05', new Set(['2026-10-02', '2026-10-05'])), [
    { from: '2026-10-01', to: '2026-10-01', days: 1, state: 'NO_DATA' },
    { from: '2026-10-03', to: '2026-10-04', days: 2, state: 'NO_DATA' },
  ]);
});

// ─── Entrenamiento ──────────────────────────────────────────────────────────────────────────────

const SENTADILLA = { exerciseId: '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e01', exerciseVersionId: '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0f01', exerciseName: 'Sentadilla goblet' };
const prescripcion: Prescripcion = {
  prescriptionId: 'rx-sentadilla',
  order: 1,
  ...SENTADILLA,
  sets: [1, 2, 3].map((setIndex) => ({ setIndex, repetitions: { min: 8, max: 10 }, note: null })),
  intensity: { criterion: 'RIR', target: { value: 2, reference: null } },
  suggestedLoad: { value: 20, unit: 'kg' },
  professionalParameters: [],
  note: null,
};
const serie = (setIndex: number, carga: number | null, reps: number | null, rir: number | null, unidad: 'kg' | 'lb' = 'kg'): SerieEjecutadaApi => ({
  setIndex,
  load: carga === null ? null : { value: carga, unit: unidad },
  completedRepetitions: reps,
  rir,
  perceivedExertion: null,
});

let secuencia = 0;
function ejecucion(fecha: string, series: SerieEjecutadaApi[] | null, condicion: 'COMPLETED' | 'NOT_COMPLETED' = 'COMPLETED'): EjecucionDeEntrenamiento {
  const x = `00000000-0000-4000-8000-${String(++secuencia).padStart(12, '0')}`;
  const ocurrio = `${fecha}T18:00:00.000-03:00`;
  const registro = {
    granularity: condicion === 'NOT_COMPLETED' ? null : ('SET' as const),
    sessionCondition: condicion,
    reason: null,
    exercises:
      condicion === 'NOT_COMPLETED'
        ? []
        : [
            {
              prescriptionId: 'rx-sentadilla',
              prescribedExerciseVersionId: SENTADILLA.exerciseVersionId,
              prescribedExerciseName: SENTADILLA.exerciseName,
              performedExerciseVersionId: SENTADILLA.exerciseVersionId,
              performedExerciseName: SENTADILLA.exerciseName,
              substituted: false,
              sets: series,
              executionSummary: null,
            },
          ],
    sessionSummary: null,
  };
  return EjecucionDeEntrenamientoSchema.parse({
    executionId: x,
    state: 'REGISTERED',
    adviseeId: 'ase-1',
    planId: 'plan-v1',
    snapshotDigest: 'a'.repeat(64),
    occurrenceId: `oc-${x}`,
    date: fecha,
    timeZone: ZONA,
    plannedSession: { sessionId: 'ses-a', label: 'Piernas A', order: 1, instructions: null, prescriptions: [prescripcion], blockId: 'blq-1', blockLabel: 'Bloque 1', microcycleId: null, microcycleLabel: null },
    original: registro,
    corrections: [],
    effectiveView: { kind: 'ORIGINAL' },
    occurredAt: ocurrio,
    recordedAt: ocurrio,
  });
}

const EJERCICIO = `e:${SENTADILLA.exerciseId}`;
const ENTRENO = [
  ejecucion('2026-09-01', [serie(1, 20, 10, 2), serie(2, 20, 9, null), serie(3, 22, 8, 0)]),
  ejecucion('2026-09-04', [serie(1, 22, 10, 1), serie(2, 22, 9, 1)]),
  ejecucion('2026-09-08', null, 'NOT_COMPLETED'),
  ejecucion('2026-09-11', [serie(1, 50, 8, 2, 'lb')]),
];
const RANGO = { desde: '2026-09-01', hasta: '2026-09-30' };

test('la carga de la serie 1, sesión por sesión: kg y lb nunca se mezclan, y lo que falta no es cero (PRO-14)', () => {
  const s = serieDeEntrenamiento(ENTRENO, definicion('entrenamiento.carga'), { exerciseKey: EJERCICIO, metrica: 'LOAD', serie: 1, unidad: 'kg', grano: 'ORIGINAL', ...RANGO });
  assert.deepEqual(s.points.map((p) => [p.date, p.value]), [
    ['2026-09-01', 20],
    ['2026-09-04', 22],
  ]);
  assert.equal(s.unit, 'kg');
  assert.ok(s.notes.some((n) => /en lb/.test(n)), 'la sesión en lb está en su propia escala');
  // El objetivo histórico de esa serie viaja con el punto (PRO-13).
  assert.ok(s.points[0]!.detail.some((d) => d.label === 'Objetivo de esta serie' && /20 kg/.test(d.value)));
});

test('RIR nulo no es un punto y RIR 0 sí lo es (PRO-13)', () => {
  const serie2 = serieDeEntrenamiento(ENTRENO, definicion('entrenamiento.rir'), { exerciseKey: EJERCICIO, metrica: 'RIR', serie: 2, unidad: 'kg', grano: 'ORIGINAL', ...RANGO });
  assert.deepEqual(serie2.points.map((p) => [p.date, p.value]), [['2026-09-04', 1]], 'el 1/9 la serie 2 no informó RIR: sin dato');
  const serie3 = serieDeEntrenamiento(ENTRENO, definicion('entrenamiento.rir'), { exerciseKey: EJERCICIO, metrica: 'RIR', serie: 3, unidad: 'kg', grano: 'ORIGINAL', ...RANGO });
  assert.deepEqual(serie3.points.map((p) => [p.date, p.value]), [['2026-09-01', 0]], 'RIR 0 es una respuesta válida');
});

test('series registradas: una sesión «no realizada» aporta 0 y lo dice; nunca se suma entre ejercicios', () => {
  const s = serieDeEntrenamiento(ENTRENO, definicion('entrenamiento.series-registradas'), { exerciseKey: EJERCICIO, metrica: 'SETS_RECORDED', serie: null, unidad: 'kg', grano: 'ORIGINAL', ...RANGO });
  assert.deepEqual(s.points.map((p) => [p.date, p.value]), [
    ['2026-09-01', 3],
    ['2026-09-04', 2],
    ['2026-09-08', 0],
    ['2026-09-11', 1],
  ]);
  assert.ok(s.points[2]!.detail.some((d) => d.value === 'Registrada como no realizada'));
  const semanal = serieDeEntrenamiento(ENTRENO, definicion('entrenamiento.series-registradas'), { exerciseKey: EJERCICIO, metrica: 'SETS_RECORDED', serie: null, unidad: 'kg', grano: 'WEEK', ...RANGO });
  assert.deepEqual(semanal.points.map((p) => [p.date, p.value, p.n]), [
    ['2026-08-31', 5, 2],
    ['2026-09-07', 1, 2],
  ]);
});

test('los ejercicios del período, por identidad, con sus series y unidades', () => {
  const [e] = ejerciciosDelPeriodo(ENTRENO);
  assert.equal(e!.exerciseKey, EJERCICIO);
  assert.equal(e!.sessions, 4);
  assert.deepEqual(e!.setNumbers, [1, 2, 3]);
  assert.deepEqual([...e!.loadUnits].sort(), ['kg', 'lb']);
});

// ─── Antropometría ──────────────────────────────────────────────────────────────────────────────

const punto = (sourceId: string, occurredAt: string, value: number, grupo: string, incomparable: ('PROTOCOL' | 'METHOD' | 'UNIT')[] = []) => ({
  occurredAt,
  recordedAt: occurredAt,
  value,
  unit: 'mm',
  sourceEvaluationId: `ev-${sourceId}`,
  sourceId,
  dataClass: 'DERIVED' as const,
  comparabilityGroup: grupo,
  correctionState: 'EFFECTIVE' as const,
  incomparableWithPrevious: incomparable,
});

const SUMATORIA: SerieApi = {
  metricCode: 'suma-6-pliegues-isak',
  series: [
    punto('m1', '2026-07-01T09:00:00.000-03:00', 72, 'cmp-1'),
    punto('m2', '2026-08-01T09:00:00.000-03:00', 70, 'cmp-1'),
    punto('m3', '2026-08-01T18:00:00.000-03:00', 69.5, 'cmp-1'),
    // Otro método: parece un salto de composición, pero es otra técnica. La línea se corta.
    punto('m4', '2026-09-01T09:00:00.000-03:00', 60, 'cmp-2', ['METHOD']),
  ],
  gaps: [{ from: '2026-07-02', to: '2026-07-31', state: 'NO_DATA', days: 30 }],
  comparability: {
    groups: [
      { comparabilityGroup: 'cmp-1', protocolVersionId: 'p1', protocolName: 'Perfil ISAK', methodVersionId: 'm-a', unit: 'mm' },
      { comparabilityGroup: 'cmp-2', protocolVersionId: 'p1', protocolName: 'Perfil ISAK', methodVersionId: 'm-b', unit: 'mm' },
    ],
  },
};

test('un cambio de método corta la comparación y dos tomas del mismo día son dos (PRO-15)', () => {
  const s = serieAntropometrica(SUMATORIA, definicionAntropometrica('suma-6-pliegues-isak', 'mm'), ZONA);
  assert.equal(s.points.length, 4);
  assert.equal(new Set(s.points.slice(0, 3).map((p) => p.segment)).size, 1);
  assert.notEqual(s.points[3]!.segment, s.points[2]!.segment, 'el método nuevo no se une al anterior');
  assert.match(s.segments[1]!.breakReason ?? '', /método/);
  assert.ok(s.points[1]!.detail.some((d) => d.value === '1 de 2'));
  assert.ok(s.points[2]!.detail.some((d) => d.value === '2 de 2'));
  assert.equal(s.gaps.length, 1);
});

test('la diferencia entre etapas no cruza un cambio de método: «no comparables» en lugar de un salto de −10 mm', () => {
  const d = definicionAntropometrica('suma-6-pliegues-isak', 'mm');
  const s = serieAntropometrica(SUMATORIA, d, ZONA);
  const c = compararPeriodos(s, d, { desde: '2026-07-01', hasta: '2026-08-15' }, { desde: '2026-08-16', hasta: '2026-09-30' });
  assert.equal(c.diferencia, null);
  assert.equal(c.motivoSinDiferencia, 'TRAMOS_NO_COMPARABLES');
});

// ─── Referencia, cambio relativo, lectura y superposición ───────────────────────────────────────

const serieDe = (valores: [string, number | null][], d = definicion('nutricion.energia')): SerieAnalitica => ({
  metricId: d.id,
  label: d.nombre,
  unit: d.unidad,
  scale: d.escala,
  grain: 'DAY',
  aggregation: 'SUM_OF_KNOWN',
  points: valores.map(([fecha, v]) => ({
    pointId: `d:${fecha}`,
    date: fecha,
    dateEnd: null,
    at: null,
    value: v,
    quality: v === null ? ('UNKNOWN' as const) : ('COMPLETE' as const),
    n: 1,
    segment: 't1',
    corrected: false,
    partialBucket: false,
    coverage: null,
    missing: [],
    detail: [],
    sources: [],
    sourcesTruncated: false,
  })),
  gaps: [],
  segments: [{ segment: 't1', label: '', breakReason: null }],
  notes: [],
});

test('cambio relativo: 100 × (valor − referencia) / referencia, con la referencia explícita y su n (PRO-08)', () => {
  const s = serieDe([
    ['2026-10-01', 2000],
    ['2026-10-02', 1800],
    ['2026-10-05', 2200],
  ]);
  const ref = referenciaDeLaSerie(s, definicion('nutricion.energia'), '2026-10-01', '2026-10-02');
  assert.equal(ref.tipo, 'valida');
  if (ref.tipo !== 'valida') return;
  assert.equal(ref.valor, 1900);
  assert.equal(ref.n, 2);
  assert.deepEqual(ref.fechas, ['2026-10-01', '2026-10-02']);
  const rel = puntosRelativos(s, ref);
  assert.ok(Math.abs((rel[2]!.relativo as number) - 15.789473684) < 1e-6);
  assert.equal(rel[2]!.value, 2200, 'el valor original se conserva');
});

test('sin referencia válida no hay cambio relativo: base cero, sin observaciones o escala ordinal (PRO-08)', () => {
  const d = definicion('nutricion.energia');
  assert.deepEqual(referenciaDeLaSerie(serieDe([['2026-10-01', 0]]), d, '2026-10-01', '2026-10-01'), { tipo: 'invalida', motivo: 'NO_POSITIVA', desde: '2026-10-01', hasta: '2026-10-01' });
  assert.equal((referenciaDeLaSerie(serieDe([['2026-10-05', 10]]), d, '2026-10-01', '2026-10-02') as { motivo: string }).motivo, 'SIN_OBSERVACIONES');
  const rir = definicion('entrenamiento.rir');
  assert.equal((referenciaDeLaSerie(serieDe([['2026-10-01', 2]], rir), rir, '2026-10-01', '2026-10-01') as { motivo: string }).motivo, 'ESCALA_NO_ADMITE');
});

test('el cursor no simula simultaneidad: sin observación es «sin dato»; el más cercano solo si se pide, con su distancia (PRO-09)', () => {
  const s = serieDe([
    ['2026-10-01', 2000],
    ['2026-10-04', 1800],
  ]);
  assert.deepEqual(lecturaEnFecha(s, '2026-10-02'), { tipo: 'sin-dato', masCercano: null });
  const cercano = lecturaEnFecha(s, '2026-10-03', true);
  assert.equal(cercano.tipo, 'sin-dato');
  if (cercano.tipo === 'sin-dato') assert.deepEqual([cercano.masCercano?.punto.date, cercano.masCercano?.distanciaDias], ['2026-10-04', 1]);
  const valores = lecturaEnFecha(s, '2026-10-01');
  assert.equal(valores.tipo, 'valores');
});

test('superponer exige la misma familia y la misma unidad: proteínas con carbohidratos sí; con energía, no', () => {
  const g = { definicion: definicion('nutricion.proteinas'), unidad: 'g' };
  assert.deepEqual(superposicionPermitida([g, { definicion: definicion('nutricion.carbohidratos'), unidad: 'g' }]), { permitida: true, motivo: null });
  assert.equal(superposicionPermitida([g, { definicion: definicion('nutricion.energia'), unidad: 'kcal' }]).permitida, false);
  const cm = { definicion: definicionAntropometrica('perimetro-cintura', 'cm'), unidad: 'cm' };
  assert.equal(superposicionPermitida([cm, { definicion: definicionAntropometrica('pliegue-triceps', 'cm'), unidad: 'cm' }]).motivo, 'FAMILIAS_DISTINTAS', 'compartir la unidad no alcanza');
  assert.equal(superposicionPermitida([g]).motivo, 'UNA_SOLA_METRICA');
});

test('dos períodos con el mismo criterio: duración, n y cobertura; los totales de distinta duración no se restan (PRO-18)', () => {
  const d = definicion('nutricion.energia');
  const s = serieDe([
    ['2026-09-01', 2000],
    ['2026-09-02', null],
    ['2026-09-03', 1800],
    ['2026-09-10', 2100],
  ]);
  const c = compararPeriodos(s, d, { desde: '2026-09-01', hasta: '2026-09-07' }, { desde: '2026-09-08', hasta: '2026-09-14' });
  assert.equal(c.a.valor, 1900);
  assert.equal(c.a.n, 2);
  assert.equal(c.a.observaciones, 3);
  assert.equal(c.a.duracionDias, 7);
  assert.equal(c.diferencia, 200);
  const conteo = definicion('nutricion.registros');
  const t = compararPeriodos(serieDe([['2026-09-01', 3], ['2026-09-10', 4]], conteo), conteo, { desde: '2026-09-01', hasta: '2026-09-07' }, { desde: '2026-09-08', hasta: '2026-09-20' });
  assert.equal(t.diferencia, null);
  assert.equal(t.motivoSinDiferencia, 'DURACIONES_DISTINTAS');
});

test('el resumen textual dice n, la primera y la última con sus fechas, y los subtotales; no califica', () => {
  const texto = resumenTextual(serieDe([['2026-10-01', 2000], ['2026-10-03', 1800]]), definicion('nutricion.energia'), '2026-10-01', '2026-10-07');
  assert.match(texto, /Energía registrada \(kcal\), del 1\/10\/2026 al 7\/10\/2026: 2 observaciones con valor; la primera, 2\.000 kcal el 1\/10\/2026; la última, 1\.800 kcal el 3\/10\/2026/);
  assert.doesNotMatch(texto, /mejor|peor|bien|mal|riesgo/i);
});

// ─── Línea de tiempo ────────────────────────────────────────────────────────────────────────────

const entrada = (idE: string, fecha: string, hora: string | null, registrado: string | null, extra: Partial<EntradaDeLineaDeTiempo> = {}): EntradaDeLineaDeTiempo => ({
  timelineEntryId: idE,
  domain: 'NUTRITION',
  eventType: 'MEAL_RECORDED',
  source: { type: 'MEAL_RECORD', id: idE },
  occurredAt: hora ? `${fecha}T${hora}:00.000-03:00` : null,
  occurredDate: fecha,
  recordedAt: registrado,
  recordedLate: registrado ? registradoTarde(fecha, registrado, ZONA) : false,
  timeZone: ZONA,
  author: null,
  title: 'Almuerzo · Arroz con pollo',
  details: [],
  state: 'EFFECTIVE',
  quality: [],
  planVersionId: null,
  exerciseKeys: [],
  relations: [],
  ...extra,
});

test('la línea de tiempo ordena por el hecho: una carga del miércoles sobre un lunes queda en el lunes (PRO-03)', () => {
  const lunes = entrada('a', '2026-10-05', '13:00', '2026-10-07T15:00:00.000Z');
  const martes = entrada('b', '2026-10-06', '13:00', '2026-10-06T16:05:00.000Z');
  const soloFecha = entrada('c', '2026-10-06', null, '2026-10-06T23:00:00.000Z', { domain: 'TRAINING', eventType: 'TRAINING_PLAN_ACTIVATED' });
  const orden = ordenarEntradas([lunes, soloFecha, martes]);
  assert.deepEqual(orden.map((e) => e.timelineEntryId), ['b', 'c', 'a'], 'el lunes va después del martes, aunque se haya registrado el miércoles');
  assert.equal(lunes.recordedLate, true);
  assert.equal(martes.recordedLate, false);
  assert.deepEqual(agruparPorDia(orden).map((g) => [g.fecha, g.entradas.length]), [
    ['2026-10-06', 2],
    ['2026-10-05', 1],
  ]);
});

test('paginación con cursor: estable, completa y sin repetir, también con empates (PRO-04)', () => {
  const todas = ordenarEntradas(Array.from({ length: 23 }, (_, i) => entrada(`e-${String(i).padStart(2, '0')}`, `2026-10-${String(1 + (i % 4)).padStart(2, '0')}`, i % 3 === 0 ? null : '12:00', '2026-10-09T12:00:00.000Z')));
  const vistas: string[] = [];
  let cursor = null;
  for (let vuelta = 0; vuelta < 10; vuelta++) {
    const p = paginarEntradas(todas, cursor, 5);
    vistas.push(...p.entradas.map((e) => e.timelineEntryId));
    if (!p.siguiente) break;
    cursor = decodificarCursor(p.siguiente);
    assert.ok(cursor, 'el cursor se lee');
  }
  assert.equal(vistas.length, 23);
  assert.equal(new Set(vistas).size, 23);
  assert.deepEqual(vistas, todas.map((e) => e.timelineEntryId));
  assert.equal(decodificarCursor('no es un cursor!'), null);
  assert.equal(decodificarCursor(codificarCursor({ d: '2026-10-01', t: null, r: null, i: 'x' }))?.i, 'x');
});

test('filtros combinados y búsqueda sin acentos ni mayúsculas, sobre lo visible (PRO-04)', () => {
  const e = entrada('a', '2026-10-05', '13:00', null, { quality: ['QUANTITIES_UNCONFIRMED'], details: [{ label: 'Comida', value: 'Almuerzo' }] });
  assert.equal(cumpleFiltros(e, { q: 'ALMUÉRZO arroz' }), true);
  assert.equal(cumpleFiltros(e, { q: 'cena' }), false);
  assert.equal(cumpleFiltros(e, { dominios: ['TRAINING'] }), false);
  assert.equal(cumpleFiltros(e, { dominios: ['NUTRITION'], calidades: ['QUANTITIES_UNCONFIRMED'] }), true);
  assert.equal(cumpleFiltros(e, { estados: ['ANNULLED'] }), false);
  assert.equal(cumpleFiltros(e, { soloTardias: true }), false);
});

test('los objetivos por serie de una versión: lo propio de la serie, lo heredado de la prescripción o «sin objetivo» (DL-122)', () => {
  const contenido: ContenidoDePlanDeEntrenamiento = {
    blocks: [
      {
        blockId: 'b1',
        label: 'Bloque',
        purpose: null,
        microcycles: [],
        sessions: [
          {
            sessionId: 's1',
            label: 'Piernas A',
            instructions: null,
            prescriptions: [
              {
                prescriptionId: 'rx-a',
                exerciseVersionId: '00000000-0000-4000-8000-000000000001',
                // La serie 2 fija su RIR (1) y la 3 lo quita (null): sin objetivo, no el de la prescripción.
                sets: [{ repetitions: { value: 10 }, note: null }, { repetitions: { value: 10 }, note: null, rir: 1 }, { repetitions: { value: 8 }, note: null, rir: null }],
                intensity: { criterion: 'RIR', target: { value: 2, reference: null } },
                suggestedLoad: { value: 20, unit: 'kg' },
                professionalParameters: [],
                note: null,
              },
            ],
          },
        ],
      },
    ],
  };
  const objetivos = objetivosDeLaVersionDelPlan(contenido);
  assert.deepEqual([...objetivos.keys()], ['rx-a']);
  assert.deepEqual(objetivos.get('rx-a'), [
    { setIndex: 1, target: { rir: 2, suggestedLoad: { value: 20, unit: 'kg' } }, targetOrigin: { rir: 'PRESCRIPTION', suggestedLoad: 'PRESCRIPTION' } },
    { setIndex: 2, target: { rir: 1, suggestedLoad: { value: 20, unit: 'kg' } }, targetOrigin: { rir: 'SET', suggestedLoad: 'PRESCRIPTION' } },
    { setIndex: 3, target: { rir: null, suggestedLoad: { value: 20, unit: 'kg' } }, targetOrigin: { rir: 'SET', suggestedLoad: 'PRESCRIPTION' } },
  ]);
});
