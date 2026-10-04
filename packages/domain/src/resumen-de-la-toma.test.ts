/**
 * DL-111 · «Tu última toma» (`resumen-de-la-toma.ts`): la evaluación más reciente, cada valor con el anterior del mismo
 * grupo y la diferencia como resta. Datos sintéticos validados contra el esquema estricto de API-ANT-06.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EvolucionResponseSchema, type EvolucionResponse, type PuntoDeSerieApi, type SerieApi } from './contratos-antropometria';
import { tomaDe, tomasDelPeriodo, ultimaToma, valoresPorToma } from './resumen-de-la-toma';

const ZONA = 'America/Argentina/Buenos_Aires';
const G_PESO = { comparabilityGroup: 'cmp-1', protocolVersionId: 'perfil', protocolName: 'Perfil antropométrico completo', methodVersionId: null, unit: 'kg' };
const G_CINTURA = { comparabilityGroup: 'cmp-2', protocolVersionId: 'perfil', protocolName: 'Perfil antropométrico completo', methodVersionId: null, unit: 'cm' };
const G_IMC = { comparabilityGroup: 'cmp-3', protocolVersionId: 'perfil', protocolName: 'Perfil antropométrico completo', methodVersionId: 'imc-v1', unit: 'kg/m2' };
const G_IMC_OTRO = { comparabilityGroup: 'cmp-4', protocolVersionId: 'perfil', protocolName: 'Perfil antropométrico completo', methodVersionId: 'imc-v2', unit: 'kg/m2' };

let n = 0;
const punto = (evaluacion: string, dia: string, value: number, grupo: { comparabilityGroup: string; unit: string }, extra: Partial<PuntoDeSerieApi> = {}): PuntoDeSerieApi => ({
  occurredAt: `${dia}T13:00:00.000Z`,
  recordedAt: `${dia}T13:05:00.000Z`,
  value,
  unit: grupo.unit,
  sourceEvaluationId: evaluacion,
  sourceId: `origen-${++n}`,
  dataClass: 'MEASURED',
  comparabilityGroup: grupo.comparabilityGroup,
  correctionState: 'EFFECTIVE',
  incomparableWithPrevious: [],
  ...extra,
});
const serie = (metricCode: string, series: PuntoDeSerieApi[], groups: SerieApi['comparability']['groups']): SerieApi => ({ metricCode, series, gaps: [], comparability: { groups } });
const datos = (metrics: SerieApi[]): EvolucionResponse['data'] =>
  EvolucionResponseSchema.parse({
    data: { adviseeId: 'a', period: { start: '2026-07-01', end: '2026-09-28', timeZone: ZONA }, metrics, partialView: false, honesty: { interpolated: false, imputed: false, carriedForward: false } },
  }).data;

test('sin observaciones en el período no hay toma', () => {
  assert.equal(ultimaToma(datos([serie('peso', [], [])])), null);
});

test('la toma es la evaluación más reciente; cada valor va con el anterior de su grupo y la diferencia es una resta', () => {
  const d = datos([
    serie('peso', [punto('ev-julio', '2026-07-20', 82.4, G_PESO), punto('ev-agosto', '2026-08-25', 80.9, G_PESO), punto('ev-septiembre', '2026-09-24', 80, G_PESO)], [G_PESO]),
    // La cintura no se midió en agosto: se compara con la de julio, que es la anterior de su grupo.
    serie('perimetro-cintura', [punto('ev-julio', '2026-07-20', 90, G_CINTURA), punto('ev-septiembre', '2026-09-24', 86.5, G_CINTURA)], [G_CINTURA]),
    serie(
      'imc',
      [punto('ev-agosto', '2026-08-25', 26.4, G_IMC, { dataClass: 'DERIVED' }), punto('ev-septiembre', '2026-09-24', 26.1, G_IMC, { dataClass: 'DERIVED' })],
      [G_IMC],
    ),
  ]);
  const toma = ultimaToma(d)!;
  assert.equal(toma.evaluacionId, 'ev-septiembre');
  assert.equal(toma.fecha, '2026-09-24');
  // Las medidas en el orden del catálogo de BE (peso antes que perímetros); los resultados de fórmulas, aparte.
  assert.deepEqual(
    toma.medidas.map((m) => [m.nombre, m.actual.punto.value, m.anterior?.punto.value ?? null, m.diferencia]),
    [
      ['Peso', 80, 80.9, { delta: -0.9, unidad: 'kg', dias: 30 }],
      ['Perímetro de cintura', 86.5, 90, { delta: -3.5, unidad: 'cm', dias: 66 }],
    ],
  );
  assert.deepEqual(
    toma.derivadas.map((m) => [m.metrica, m.actual.punto.value, m.diferencia?.delta ?? null]),
    [['imc', 26.1, -0.3]],
  );
  // La fecha anterior que más se repite entre las comparaciones: agosto (peso e IMC) sobre julio (cintura).
  assert.equal(toma.fechaAnterior, '2026-08-25');
});

test('un valor de otro grupo (otro método) no se compara: queda sin anterior', () => {
  const d = datos([
    serie(
      'imc',
      [punto('ev-1', '2026-08-01', 25, G_IMC_OTRO, { dataClass: 'DERIVED' }), punto('ev-2', '2026-09-01', 24.8, G_IMC, { dataClass: 'DERIVED', incomparableWithPrevious: ['METHOD'] })],
      [G_IMC_OTRO, G_IMC],
    ),
    serie('peso', [punto('ev-2', '2026-09-01', 70, G_PESO)], [G_PESO]),
  ]);
  const toma = ultimaToma(d)!;
  assert.equal(toma.derivadas[0]!.anterior, null);
  assert.equal(toma.derivadas[0]!.diferencia, null);
  assert.equal(toma.fechaAnterior, null);
});

test('una métrica que no está en la última toma no aparece en ella, aunque tenga valores anteriores', () => {
  const d = datos([
    serie('peso', [punto('ev-1', '2026-08-01', 71, G_PESO), punto('ev-2', '2026-09-01', 70, G_PESO)], [G_PESO]),
    serie('perimetro-cintura', [punto('ev-1', '2026-08-01', 80, G_CINTURA)], [G_CINTURA]),
  ]);
  assert.deepEqual(
    ultimaToma(d)!.medidas.map((m) => m.metrica),
    ['peso'],
  );
});

test('sin anterior comparable, la toma dice por qué: no hubo una antes, o la hubo con otro método o protocolo', () => {
  const d = datos([
    serie('peso', [punto('ev-septiembre', '2026-09-24', 80, G_PESO)], [G_PESO]),
    serie('imc', [punto('ev-agosto', '2026-08-25', 26.4, G_IMC_OTRO, { dataClass: 'DERIVED' }), punto('ev-septiembre', '2026-09-24', 26.1, G_IMC, { dataClass: 'DERIVED' })], [G_IMC, G_IMC_OTRO]),
    serie('perimetro-cintura', [punto('ev-agosto', '2026-08-25', 88, G_CINTURA), punto('ev-septiembre', '2026-09-24', 86.5, G_CINTURA)], [G_CINTURA]),
  ]);
  const toma = ultimaToma(d)!;
  const motivo = (m: string) => [...toma.medidas, ...toma.derivadas].find((x) => x.metrica === m)!.motivoSinAnterior;
  assert.equal(motivo('peso'), 'SIN_PREVIA');
  assert.equal(motivo('imc'), 'OTRO_GRUPO');
  assert.equal(motivo('perimetro-cintura'), null);
});

// ─── DL-117 · el selector de tomas: T1, T2, T3… por evaluación, nunca por fecha ──────────────────

test('las tomas del período van de la más vieja a la más nueva, una por evaluación, con su fecha y sus métricas', () => {
  const d = datos([
    serie('peso', [punto('ev-julio', '2026-07-20', 82.4, G_PESO), punto('ev-agosto', '2026-08-25', 80.9, G_PESO), punto('ev-septiembre', '2026-09-24', 80, G_PESO)], [G_PESO]),
    serie('perimetro-cintura', [punto('ev-julio', '2026-07-20', 90, G_CINTURA), punto('ev-septiembre', '2026-09-24', 86.5, G_CINTURA)], [G_CINTURA]),
  ]);
  assert.deepEqual(
    tomasDelPeriodo(d).map((t) => [t.etiqueta, t.evaluacionId, t.fecha, t.metricas]),
    [
      ['T1', 'ev-julio', '2026-07-20', 2],
      ['T2', 'ev-agosto', '2026-08-25', 1],
      ['T3', 'ev-septiembre', '2026-09-24', 2],
    ],
  );
  // La última toma es la misma que resume `ultimaToma`.
  assert.equal(ultimaToma(d)!.evaluacionId, tomasDelPeriodo(d).at(-1)!.evaluacionId);
});

test('dos evaluaciones del mismo día son dos tomas, con la misma fecha: no se juntan por fecha', () => {
  const d = datos([
    serie('peso', [punto('ev-manana', '2026-09-24', 80, G_PESO, { occurredAt: '2026-09-24T12:00:00.000Z' }), punto('ev-tarde', '2026-09-24', 80.6, G_PESO, { occurredAt: '2026-09-24T20:00:00.000Z' })], [G_PESO]),
  ]);
  const tomas = tomasDelPeriodo(d);
  assert.deepEqual(
    tomas.map((t) => [t.etiqueta, t.evaluacionId, t.fecha]),
    [
      ['T1', 'ev-manana', '2026-09-24'],
      ['T2', 'ev-tarde', '2026-09-24'],
    ],
  );
  // La de la tarde se compara con la de la mañana: otra evaluación, aunque sea del mismo día.
  const tarde = tomaDe(d, 'ev-tarde')!;
  assert.equal(tarde.medidas[0]!.anterior?.punto.sourceEvaluationId, 'ev-manana');
});

test('una toma anterior se resume igual que la última: con el anterior comparable de una evaluación anterior a ella', () => {
  const d = datos([
    serie('peso', [punto('ev-julio', '2026-07-20', 82.4, G_PESO), punto('ev-agosto', '2026-08-25', 80.9, G_PESO), punto('ev-septiembre', '2026-09-24', 80, G_PESO)], [G_PESO]),
    serie('perimetro-cintura', [punto('ev-julio', '2026-07-20', 90, G_CINTURA), punto('ev-septiembre', '2026-09-24', 86.5, G_CINTURA)], [G_CINTURA]),
  ]);
  const agosto = tomaDe(d, 'ev-agosto')!;
  assert.equal(agosto.fecha, '2026-08-25');
  assert.deepEqual(
    agosto.medidas.map((m) => [m.metrica, m.actual.punto.value, m.anterior?.punto.value ?? null, m.diferencia?.delta ?? null]),
    [['peso', 80.9, 82.4, -1.5]],
  );
  assert.equal(agosto.fechaAnterior, '2026-07-20');
  // La primera toma no tiene con qué compararse, y una evaluación que no está en el período no se resume.
  assert.equal(tomaDe(d, 'ev-julio')!.medidas.every((m) => m.motivoSinAnterior === 'SIN_PREVIA'), true);
  assert.equal(tomaDe(d, 'ev-otra'), null);
});

test('los valores de una métrica por toma son de su grupo; una toma sin la métrica, o con otro método, es un hueco', () => {
  const d = datos([
    serie('peso', [punto('ev-1', '2026-07-20', 82, G_PESO), punto('ev-3', '2026-09-24', 80, G_PESO)], [G_PESO]),
    serie(
      'imc',
      [punto('ev-1', '2026-07-20', 26.6, G_IMC, { dataClass: 'DERIVED' }), punto('ev-2', '2026-08-25', 26.4, G_IMC_OTRO, { dataClass: 'DERIVED' }), punto('ev-3', '2026-09-24', 26.1, G_IMC, { dataClass: 'DERIVED' })],
      [G_IMC, G_IMC_OTRO],
    ),
  ]);
  const tomas = tomasDelPeriodo(d);
  assert.deepEqual(tomas.map((t) => t.etiqueta), ['T1', 'T2', 'T3']);
  assert.deepEqual(valoresPorToma(d, 'peso', 'cmp-1', tomas).map((o) => o?.punto.value ?? null), [82, null, 80]);
  assert.deepEqual(valoresPorToma(d, 'imc', 'cmp-3', tomas).map((o) => o?.punto.value ?? null), [26.6, null, 26.1], 'el IMC de otro método no entra en el gráfico');
  assert.deepEqual(valoresPorToma(d, 'cintura', 'cmp-2', tomas), [null, null, null]);
});
