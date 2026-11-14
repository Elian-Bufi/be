/**
 * TEST-GR-016 (WP-GRAFICOS GR-16, DL-174): «Desde el inicio y desde la anterior», la tabla de cada toma.
 * - Cada medida de la toma, contra la primera y la anterior **del mismo grupo** (protocolo, método y unidad), aunque las
 *   respuestas de API-ANT-06 vengan en tramos con nombres de grupo distintos.
 * - Una medida tomada antes con otro protocolo no se compara y lo dice; una que no se tomó antes, también.
 * - La diferencia es una resta con su signo; los días son de calendario entre las fechas.
 * - Los tramos de lectura cubren las fechas de las tomas, de hasta 92 días con el margen, sin pasar de hoy.
 * - La línea fija del error de medición está, y ningún texto califica.
 *
 * Los resultados esperados se escriben a mano. Datos sintéticos validados contra el esquema estricto de API-ANT-06.
 * Mutaciones que estas pruebas ponen en rojo: comparar por `comparabilityGroup` (el nombre de cada respuesta) en vez de
 * por protocolo, método y unidad; tomar la anterior de cualquier grupo; contar dos veces un punto repetido entre tramos.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { terminosProhibidosDeAntropometriaEn } from './copy-antropometria';
import { EvolucionResponseSchema, type EvolucionResponse, type PuntoDeSerieApi, type SerieApi } from './contratos-antropometria';
import { COPY_DESDE_EL_INICIO, desdeElInicioYLaAnterior, diasEntreLasTomas, diferenciaDeLaFila, MAXIMO_DE_TRAMOS_DE_LAS_TOMAS, tramosDeLasTomas, valorDeLaFila } from './desde-el-inicio';
import { diasEntreFechas } from './fechas-civiles';

const ZONA = 'America/Argentina/Buenos_Aires';
type Grupo = SerieApi['comparability']['groups'][number];
const grupo = (comparabilityGroup: string, protocolVersionId: string, unit: string, methodVersionId: string | null = null): Grupo => ({
  comparabilityGroup,
  protocolVersionId,
  protocolName: protocolVersionId === 'perfil' ? 'Perfil antropométrico completo' : 'Perfil básico',
  methodVersionId,
  unit,
});

let n = 0;
const punto = (evaluacion: string, dia: string, value: number, g: Grupo, extra: Partial<PuntoDeSerieApi> = {}): PuntoDeSerieApi => ({
  occurredAt: `${dia}T13:00:00.000Z`,
  recordedAt: `${dia}T13:05:00.000Z`,
  value,
  unit: g.unit,
  sourceEvaluationId: evaluacion,
  sourceId: `origen-${++n}`,
  dataClass: 'MEASURED',
  comparabilityGroup: g.comparabilityGroup,
  correctionState: 'EFFECTIVE',
  incomparableWithPrevious: [],
  ...extra,
});
const serie = (metricCode: string, series: PuntoDeSerieApi[], groups: Grupo[]): SerieApi => ({ metricCode, series, gaps: [], comparability: { groups } });
const respuesta = (start: string, end: string, metrics: SerieApi[], partialView = false): EvolucionResponse['data'] =>
  EvolucionResponseSchema.parse({ data: { adviseeId: 'persona-1', period: { start, end, timeZone: ZONA }, metrics, partialView, honesty: { interpolated: false, imputed: false, carriedForward: false } } }).data;

// Tres tomas: mayo (inicio), julio y septiembre. Cada tramo nombra sus grupos a su manera (`cmp-1`, `cmp-7`…).
const PESO_A = grupo('cmp-1', 'perfil', 'kg');
const PESO_B = grupo('cmp-7', 'perfil', 'kg');
const CINTURA_A = grupo('cmp-2', 'perfil', 'cm');
const CINTURA_B = grupo('cmp-8', 'perfil', 'cm');
const TRICEPS_BASICO = grupo('cmp-3', 'basico', 'mm');
const TRICEPS_PERFIL = grupo('cmp-9', 'perfil', 'mm');
const BRAZO = grupo('cmp-10', 'perfil', 'cm');
const IMC_A = grupo('cmp-4', 'perfil', 'kg/m2', 'imc-v1');
const IMC_B = grupo('cmp-11', 'perfil', 'kg/m2', 'imc-v1');

const julio = punto('ev-julio', '2026-07-15', 80.9, PESO_A);
const TRAMOS = [
  respuesta('2026-05-09', '2026-07-16', [
    serie('peso', [punto('ev-mayo', '2026-05-10', 82.4, PESO_A), julio], [PESO_A]),
    serie('perimetro-cintura', [punto('ev-mayo', '2026-05-10', 90, CINTURA_A)], [CINTURA_A]),
    serie('pliegue-triceps', [punto('ev-mayo', '2026-05-10', 14, TRICEPS_BASICO)], [TRICEPS_BASICO]),
    serie('imc', [punto('ev-mayo', '2026-05-10', 26.9, IMC_A, { dataClass: 'DERIVED' })], [IMC_A]),
  ]),
  respuesta('2026-07-14', '2026-09-25', [
    // El punto de julio llega también en este tramo (los tramos se tocan): cuenta una sola vez.
    serie('peso', [{ ...julio, comparabilityGroup: 'cmp-7' }, punto('ev-septiembre', '2026-09-24', 80, PESO_B)], [PESO_B]),
    serie('perimetro-cintura', [punto('ev-septiembre', '2026-09-24', 86.5, CINTURA_B)], [CINTURA_B]),
    serie('pliegue-triceps', [punto('ev-septiembre', '2026-09-24', 12, TRICEPS_PERFIL)], [TRICEPS_PERFIL]),
    serie('perimetro-brazo-relajado', [punto('ev-septiembre', '2026-09-24', 31, BRAZO)], [BRAZO]),
    serie('imc', [punto('ev-septiembre', '2026-09-24', 26.1, IMC_B, { dataClass: 'DERIVED' })], [IMC_B]),
  ]),
];

test('TEST-GR-016 · cada medida contra la primera y la anterior del mismo grupo, juntando los tramos por lo que son', () => {
  const t = desdeElInicioYLaAnterior(TRAMOS, 'ev-septiembre')!;
  assert.equal(t.fecha, '2026-09-24');
  const fila = (metrica: string) => [...t.medidas, ...t.resultados].find((f) => f.metrica === metrica)!;
  // Peso: desde mayo (−2,4 kg en 137 días) y desde julio (−0,9 kg en 71 días), aunque julio y septiembre vinieron con
  // grupos de nombre distinto.
  assert.deepEqual(fila('peso').desdeElInicio, { delta: -2.4, unidad: 'kg', desde: '2026-05-10', dias: 137 });
  assert.deepEqual(fila('peso').desdeLaAnterior, { delta: -0.9, unidad: 'kg', desde: '2026-07-15', dias: 71 });
  // La cintura no se midió en julio: la anterior de su grupo es la de mayo, que también es el inicio.
  assert.deepEqual(fila('perimetro-cintura').desdeElInicio, { delta: -3.5, unidad: 'cm', desde: '2026-05-10', dias: 137 });
  assert.deepEqual(fila('perimetro-cintura').desdeLaAnterior, fila('perimetro-cintura').desdeElInicio);
  // El tríceps se tomó en mayo con otro protocolo: no se compara, y se dice por qué.
  assert.deepEqual([fila('pliegue-triceps').desdeElInicio, fila('pliegue-triceps').desdeLaAnterior, fila('pliegue-triceps').motivo], [null, null, 'OTRO_GRUPO']);
  // El brazo se mide por primera vez.
  assert.deepEqual([fila('perimetro-brazo-relajado').desdeElInicio, fila('perimetro-brazo-relajado').motivo], [null, 'SIN_PREVIA']);
  // Los resultados de las fórmulas van aparte; el IMC del mismo método se compara.
  assert.deepEqual(
    t.resultados.map((f) => [f.metrica, f.desdeElInicio?.delta ?? null]),
    [['imc', -0.8]],
  );
  assert.deepEqual(t.medidas.map((f) => f.metrica).includes('imc'), false);
  // El inicio es el mismo para todas las filas que lo tienen; la anterior, no (julio para el peso, mayo para la cintura).
  assert.equal(t.fechaDelInicio, '2026-05-10');
  assert.equal(t.fechaDeLaAnterior, null);
  assert.equal(t.parcial, false);
});

test('TEST-GR-016 · la primera toma no tiene con qué compararse; una toma que no está en lo leído no arma tabla', () => {
  const t = desdeElInicioYLaAnterior(TRAMOS, 'ev-mayo')!;
  assert.ok([...t.medidas, ...t.resultados].every((f) => f.desdeElInicio === null && f.desdeLaAnterior === null && f.motivo === 'SIN_PREVIA'));
  assert.equal(t.fechaDelInicio, null);
  assert.equal(desdeElInicioYLaAnterior(TRAMOS, 'ev-que-no-esta'), null);
});

test('TEST-GR-016 · la toma del medio se compara solo con lo anterior a ella; dos valores de la misma toma, el último', () => {
  const t = desdeElInicioYLaAnterior(TRAMOS, 'ev-julio')!;
  assert.deepEqual(t.medidas.map((f) => [f.metrica, f.desdeLaAnterior?.delta ?? null]), [['peso', -1.5]]);
  const repetida = respuesta('2026-09-01', '2026-09-30', [
    serie('peso', [punto('ev-1', '2026-09-02', 70, PESO_A), punto('ev-2', '2026-09-20', 69.4, PESO_A), punto('ev-2', '2026-09-20', 69.6, PESO_A, { occurredAt: '2026-09-20T13:30:00.000Z' })], [PESO_A]),
  ]);
  assert.deepEqual(desdeElInicioYLaAnterior([repetida], 'ev-2')!.medidas[0]!.desdeLaAnterior, { delta: -0.4, unidad: 'kg', desde: '2026-09-02', dias: 18 });
});

test('TEST-GR-016 · con tomas de otro profesional en lo leído, se dice', () => {
  const parcial = respuesta('2026-09-01', '2026-09-30', [serie('peso', [punto('ev-1', '2026-09-02', 70, PESO_A)], [PESO_A])], true);
  assert.equal(desdeElInicioYLaAnterior([parcial], 'ev-1')!.parcial, true);
});

test('TEST-GR-016 · los tramos de lectura cubren las fechas de las tomas, de hasta 92 días con el margen, sin pasar de hoy', () => {
  // De enero a fines de marzo hay 89 días: un tramo. Septiembre, otro. No se lee lo que no tiene tomas.
  const { tramos, completo } = tramosDeLasTomas(['2026-03-31', '2026-01-01', '2026-02-20', '2026-09-24', '2026-09-24'], '2026-11-14');
  assert.deepEqual(tramos, [
    { desde: '2025-12-31', hasta: '2026-04-01' },
    { desde: '2026-09-23', hasta: '2026-09-25' },
  ]);
  assert.equal(completo, true);
  for (const t of tramos) assert.ok(diasEntreFechas(t.desde, t.hasta) + 1 <= 92, `${t.desde} a ${t.hasta}`);
  // A 90 días ya no entran juntas.
  assert.equal(tramosDeLasTomas(['2026-01-01', '2026-04-01'], '2026-11-14').tramos.length, 2);
  // Una toma de hoy: el tramo no pasa de hoy.
  assert.deepEqual(tramosDeLasTomas(['2026-11-14'], '2026-11-14').tramos, [{ desde: '2026-11-13', hasta: '2026-11-14' }]);
  // Con más tramos que el máximo, los más recientes, y lo dice.
  const muchas = Array.from({ length: 13 }, (_, i) => new Date(Date.UTC(2023, 0, 1 + i * 100, 12)).toISOString().slice(0, 10));
  const leidos = tramosDeLasTomas(muchas, '2026-11-14');
  const diaAntes = (f: string) => new Date(Date.parse(`${f}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  assert.equal(leidos.completo, false);
  assert.equal(MAXIMO_DE_TRAMOS_DE_LAS_TOMAS, 8);
  assert.equal(leidos.tramos.length, MAXIMO_DE_TRAMOS_DE_LAS_TOMAS);
  assert.equal(leidos.tramos[0]!.desde, diaAntes(muchas[muchas.length - MAXIMO_DE_TRAMOS_DE_LAS_TOMAS]!));
});

test('TEST-GR-016 · las palabras: la resta con su signo, los días, el valor y la línea del error de medición', () => {
  assert.equal(diferenciaDeLaFila({ delta: -2.4, unidad: 'kg', desde: '2026-05-10', dias: 137 }), '−2,4 kg');
  assert.equal(diferenciaDeLaFila({ delta: 1.5, unidad: 'cm', desde: '2026-05-10', dias: 137 }), '+1,5 cm');
  assert.equal(diferenciaDeLaFila({ delta: 0, unidad: 'kg', desde: '2026-05-10', dias: 137 }), '0 kg');
  assert.equal(diasEntreLasTomas(0), 'el mismo día');
  assert.equal(diasEntreLasTomas(1), '1 día');
  assert.equal(diasEntreLasTomas(137), '137 días');
  assert.equal(valorDeLaFila({ valor: 86.5, unidad: 'cm' }), '86,5 cm');
  assert.equal(COPY_DESDE_EL_INICIO.sinErrorDeMedicion, 'BE no tiene cargado el error de medición de quien mide: no se puede decir si estos cambios lo superan.');
  assert.equal(COPY_DESDE_EL_INICIO.inicioYAnterior('10 may', '15 jul'), 'Inicio: la toma del 10 may; anterior: la del 15 jul');
  assert.equal(COPY_DESDE_EL_INICIO.inicioYAnterior('10 may', null), 'Inicio: la toma del 10 may');
  const textos = Object.values(COPY_DESDE_EL_INICIO).map((v) => (typeof v === 'string' ? v : (v as unknown as (a: string, b: string) => string)('10 may', '15 jul')));
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosDeAntropometriaEn(t), [], t);
    assert.doesNotMatch(t, /[↑↓→←▲▼]|mejor|peor|bien|mal\b|normal/i, t);
  }
});
