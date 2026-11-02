/**
 * DL-161 en el escritorio del profesional (decisión de Dirección del 2026-11-02): una serie tildada sin escribir
 * («carga rápida», `recordedAs: AS_PLANNED`) se ve en los gráficos como un punto hueco, con la leyenda «carga rápida», y
 * queda fuera de las comparaciones con lo indicado y de toda estadística de tendencia (los resúmenes, la comparación de
 * períodos, la referencia y el cambio relativo). Lo que la persona escribió o cambió va lleno y se compara como siempre.
 * La cantidad de series registradas se cuenta siempre, también las tildadas.
 *
 * Los resultados esperados se escriben a mano, desde esa decisión. Datos sintéticos. Si una prueba falla, se corrige el
 * cálculo, no el oráculo.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compararEjecucion, evolucion, observacionesDelEjercicio, rotuloCorto, seriesParaGraficar } from './comparacion-de-entrenamiento';
import { EjecucionDeEntrenamientoSchema, type EjecucionDeEntrenamiento, type Prescripcion, type SerieEjecutadaApi } from './contratos-entrenamiento';
import { serieDeEntrenamiento } from './entrenamiento-del-analisis';
import { csvDelAnalisis } from './exportacion-del-analisis';
import { definicionDeMetrica } from './metricas-del-analisis';
import {
  compararPeriodos,
  DETALLE_DE_CARGA_RAPIDA,
  esPuntoDeCargaRapida,
  partesDeLaCobertura,
  partesDelResumenTextual,
  puntosRelativos,
  referenciaDeLaSerie,
  resumirPeriodo,
} from './series-del-analisis';

const ZONA = 'America/Argentina/Buenos_Aires';
const definicion = (id: string) => {
  const d = definicionDeMetrica(id);
  if (!d) throw new Error(`no existe ${id}`);
  return d;
};

const SENTADILLA = { exerciseId: '5a2c3d7f-8b02-4d02-8f02-7b7e3c7b1e02', exerciseVersionId: '5a2c3d7f-8b02-4d02-8f02-7b7e3c7b1f02', exerciseName: 'Sentadilla goblet' };
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
/** Una serie escrita por la persona. */
const escrita = (setIndex: number, carga: number, reps: number, rir: number | null = 2): SerieEjecutadaApi => ({ setIndex, load: { value: carga, unit: 'kg' }, completedRepetitions: reps, rir, perceivedExertion: null });
/** Una serie tildada sin escribir: los valores del plan (20 kg, 10 repeticiones, RIR 2), con la marca. */
const tildada = (setIndex: number): SerieEjecutadaApi => ({ ...escrita(setIndex, 20, 10, 2), recordedAs: 'AS_PLANNED' });

let secuencia = 0;
function ejecucion(fecha: string, series: SerieEjecutadaApi[]): EjecucionDeEntrenamiento {
  const x = `00000000-0000-4000-8000-${String(++secuencia).padStart(12, '0')}`;
  const ocurrio = `${fecha}T18:00:00.000-03:00`;
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
    original: {
      granularity: 'SET',
      sessionCondition: 'COMPLETED',
      reason: null,
      exercises: [
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
    },
    corrections: [],
    effectiveView: { kind: 'ORIGINAL' },
    occurredAt: ocurrio,
    recordedAt: ocurrio,
  });
}

const EJERCICIO = `e:${SENTADILLA.exerciseId}`;
/** El 1/9, todo escrito; el 4/9, todo tildado; el 8/9, la serie 1 escrita (con más carga) y la 2 tildada. */
const ENTRENO = [ejecucion('2026-09-01', [escrita(1, 20, 10), escrita(2, 20, 9)]), ejecucion('2026-09-04', [tildada(1), tildada(2)]), ejecucion('2026-09-08', [escrita(1, 24, 8, 1), tildada(2)])];
const RANGO = { desde: '2026-09-01', hasta: '2026-09-30' };
const CARGA = definicion('entrenamiento.carga');
const cargaDeLaSerie1 = () => serieDeEntrenamiento(ENTRENO, CARGA, { exerciseKey: EJERCICIO, metrica: 'LOAD', serie: 1, unidad: 'kg', grano: 'ORIGINAL', ...RANGO });

// ─── La serie de «Analizar» ─────────────────────────────────────────────────────────────────────────────────

test('la carga de la serie 1: el punto de carga rápida está, con su marca en el detalle; los escritos, sin marca', () => {
  const s = cargaDeLaSerie1();
  assert.deepEqual(
    s.points.map((p) => [p.date, p.value, esPuntoDeCargaRapida(p)]),
    [
      ['2026-09-01', 20, false],
      ['2026-09-04', 20, true],
      ['2026-09-08', 24, false],
    ],
  );
  // La marca es un detalle factual, el mismo que lee la pantalla: «Cómo se cargó: Carga rápida, tildada sin escribir».
  assert.deepEqual(s.points[1]!.detail.find((d) => d.label === DETALLE_DE_CARGA_RAPIDA.label), { label: 'Cómo se cargó', value: 'Carga rápida, tildada sin escribir' });
  assert.equal(s.points[0]!.detail.some((d) => d.label === DETALLE_DE_CARGA_RAPIDA.label), false);
  // Sigue en su línea: un punto de carga rápida no corta el tramo.
  assert.equal(new Set(s.points.map((p) => p.segment)).size, 1);
  // La nota de la serie lo explica para quien lee la respuesta.
  assert.ok(s.notes.includes('1 sesión tiene esta serie con carga rápida (tildada sin escribir, con los valores del plan): es un punto hueco, que no se compara con el objetivo ni entra en los resúmenes ni en el cambio relativo.'), s.notes.join(' | '));
});

test('sin ninguna serie tildada, la serie queda como antes: ningún detalle ni nota de carga rápida', () => {
  const soloEscritas = [ejecucion('2026-09-02', [escrita(1, 20, 10)]), ejecucion('2026-09-05', [escrita(1, 22, 9)])];
  const s = serieDeEntrenamiento(soloEscritas, CARGA, { exerciseKey: EJERCICIO, metrica: 'LOAD', serie: 1, unidad: 'kg', grano: 'ORIGINAL', ...RANGO });
  assert.equal(s.points.some(esPuntoDeCargaRapida), false);
  assert.equal(s.notes.some((n) => /carga rápida/.test(n)), false);
  const r = resumirPeriodo(s, CARGA, RANGO.desde, RANGO.hasta);
  assert.equal('deCargaRapida' in r, false);
});

test('la cantidad de series registradas se cuenta siempre, también las tildadas', () => {
  const s = serieDeEntrenamiento(ENTRENO, definicion('entrenamiento.series-registradas'), { exerciseKey: EJERCICIO, metrica: 'SETS_RECORDED', serie: null, unidad: 'kg', grano: 'ORIGINAL', ...RANGO });
  assert.deepEqual(
    s.points.map((p) => [p.date, p.value, esPuntoDeCargaRapida(p)]),
    [
      ['2026-09-01', 2, false],
      ['2026-09-04', 2, false],
      ['2026-09-08', 2, false],
    ],
  );
});

// ─── Las estadísticas ───────────────────────────────────────────────────────────────────────────────────────

test('el resumen de un período deja fuera la carga rápida: la mediana es de lo escrito, y se dice cuántas quedaron fuera', () => {
  const r = resumirPeriodo(cargaDeLaSerie1(), CARGA, RANGO.desde, RANGO.hasta);
  // Con las tres, la mediana sería 20; sin la tildada, es la de 20 y 24.
  assert.deepEqual([r.valor, r.n, r.observaciones, r.sinValor, r.deCargaRapida], [22, 2, 3, 0, 1]);
  assert.deepEqual(partesDeLaCobertura(r), ['3 sesiones: 2 con valor', '1 de carga rápida, fuera del resumen']);
  // Un período con solo la tildada no tiene valor: no es «sin valor registrado», es carga rápida.
  const soloTildada = resumirPeriodo(cargaDeLaSerie1(), CARGA, '2026-09-03', '2026-09-05');
  assert.deepEqual([soloTildada.valor, soloTildada.n, soloTildada.observaciones, soloTildada.sinValor, soloTildada.deCargaRapida], [null, 0, 1, 0, 1]);
  // Comparar dos períodos usa el mismo criterio: la tildada no entra en ninguno.
  const c = compararPeriodos(cargaDeLaSerie1(), CARGA, { desde: '2026-09-01', hasta: '2026-09-05' }, { desde: '2026-09-06', hasta: '2026-09-10' });
  assert.deepEqual([c.a.valor, c.b.valor, c.diferencia], [20, 24, 4]);
});

test('la referencia del cambio relativo no usa la carga rápida, y un punto de carga rápida no tiene cambio relativo', () => {
  const s = cargaDeLaSerie1();
  const r = referenciaDeLaSerie(s, CARGA, '2026-09-01', '2026-09-05');
  assert.equal(r.tipo, 'valida');
  if (r.tipo !== 'valida') return;
  assert.deepEqual([r.valor, r.n, r.fechas, r.deCargaRapida], [20, 1, ['2026-09-01'], 1]);
  // Solo la tildada en el rango: no hay referencia, y se dice por qué.
  assert.deepEqual(referenciaDeLaSerie(s, CARGA, '2026-09-03', '2026-09-05'), { tipo: 'invalida', motivo: 'SOLO_CARGA_RAPIDA', desde: '2026-09-03', hasta: '2026-09-05' });
  // Un rango sin nada sigue diciendo lo de siempre.
  assert.deepEqual(referenciaDeLaSerie(s, CARGA, '2026-09-20', '2026-09-25'), { tipo: 'invalida', motivo: 'SIN_OBSERVACIONES', desde: '2026-09-20', hasta: '2026-09-25' });
  assert.deepEqual(
    puntosRelativos(s, r).map((p) => [p.date, p.relativo, p.motivoSinRelativo]),
    [
      ['2026-09-01', 0, null],
      ['2026-09-04', null, 'CARGA_RAPIDA'],
      ['2026-09-08', 20, null],
    ],
  );
});

test('el resumen en texto dice cuántas son de carga rápida, para quien no ve los puntos huecos', () => {
  const { partes } = partesDelResumenTextual(cargaDeLaSerie1(), CARGA, RANGO.desde, RANGO.hasta);
  assert.ok(partes.includes('1 es de carga rápida (tildada sin escribir, con los valores del plan): no se compara ni entra en los resúmenes'), partes.join(' | '));
});

test('la exportación lo dice en la calidad de la fila, sin una columna nueva', () => {
  const csv = csvDelAnalisis({ asesorado: 'Persona sintética', desde: RANGO.desde, hasta: RANGO.hasta, zona: ZONA, generadoEl: '2026-11-02T12:00:00.000Z', series: [{ nombre: 'Carga · serie 1', definicion: CARGA, serie: cargaDeLaSerie1() }] });
  assert.equal(csv.split('\n').filter((l) => l.includes('carga rápida, no se compara')).length, 1);
  assert.ok(csv.split('\n').some((l) => l.includes('2026-09-04') && l.includes('carga rápida, no se compara')));
});

// ─── «Planificado y registrado»: por serie y evolución ──────────────────────────────────────────────────────

test('la evolución de la serie 1: el punto de carga rápida no tiene diferencia con lo planificado y su rótulo lo dice', () => {
  const observaciones = observacionesDelEjercicio(ENTRENO, EJERCICIO);
  const medida = { variable: 'carga', unidad: 'kg' } as const;
  const puntos = evolucion(observaciones, medida, 1);
  assert.deepEqual(
    puntos.map((p) => [p.observacion.comparacion.fecha, p.cargaRapida ?? false, p.diferencia === null]),
    [
      ['2026-09-01', false, false],
      ['2026-09-04', true, true],
      ['2026-09-08', false, false],
    ],
  );
  assert.equal(rotuloCorto(puntos[1]!, medida), 'carga rápida');
  // Lo escrito se rotula como siempre: con su diferencia.
  assert.notEqual(rotuloCorto(puntos[2]!, medida), 'carga rápida');
  // Sin la marca, la clave no aparece: lo de antes queda igual.
  assert.equal('cargaRapida' in puntos[0]!, false);
});

test('por serie, dentro de una sesión: la tildada no se compara, la escrita sí, y la que no se registró sigue sin dato', () => {
  const [c] = compararEjecucion(ENTRENO[2]!);
  const medida = { variable: 'repeticiones' } as const;
  const series = seriesParaGraficar(c!, medida);
  assert.deepEqual(
    series.map((s) => [s.numero, s.cargaRapida ?? false, s.diferencia?.tipo ?? null, rotuloCorto(s, medida)]),
    [
      [1, false, 'dentro-del-rango', 'en rango'],
      [2, true, null, 'carga rápida'],
      [3, false, null, 'sin dato'],
    ],
  );
});
