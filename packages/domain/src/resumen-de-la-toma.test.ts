/**
 * DL-111 · «Tu última toma» (`resumen-de-la-toma.ts`): la evaluación más reciente, cada valor con el anterior del mismo
 * grupo y la diferencia como resta. Datos sintéticos validados contra el esquema estricto de API-ANT-06.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EvolucionResponseSchema, type EvolucionResponse, type PuntoDeSerieApi, type SerieApi } from './contratos-antropometria';
import { ultimaToma } from './resumen-de-la-toma';

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
