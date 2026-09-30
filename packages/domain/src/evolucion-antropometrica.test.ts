/**
 * Evolución antropométrica (`evolucion-antropometrica.ts`): la lógica que comparten el gráfico, el detalle y la tabla.
 * Datos sintéticos validados contra el esquema estricto de API-ANT-06, así las pruebas no se apoyan en formas que la
 * API no devuelve.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EvolucionResponseSchema, type PuntoDeSerieApi, type SerieApi } from './contratos-antropometria';
import { terminosProhibidosDeAntropometriaEn } from './copy-antropometria';
import {
  COPY_EVOLUCION,
  diferenciaDescriptiva,
  fechaCivil,
  grupoVigente,
  metricaVigente,
  motivosEnPalabras,
  nombreDelGrupo,
  observacionesDelGrupo,
  observacionPorId,
  prepararSerie,
  resumenDeObservacion,
  textoDeDiferenciaAntropometrica,
} from './evolucion-antropometrica';

const ZONA = 'America/Argentina/Buenos_Aires';
const GRUPOS = [
  { comparabilityGroup: 'cmp-1', protocolVersionId: 'proto-1', protocolName: 'PROTO-LAB', methodVersionId: null, unit: 'kg' },
  { comparabilityGroup: 'cmp-2', protocolVersionId: 'proto-2', protocolName: 'PROTO-CAMPO', methodVersionId: null, unit: 'kg' },
  { comparabilityGroup: 'cmp-3', protocolVersionId: 'proto-1', protocolName: 'PROTO-LAB', methodVersionId: null, unit: 'lb' },
];
let n = 0;
function punto(occurredAt: string, value: number, extra: Partial<PuntoDeSerieApi> = {}): PuntoDeSerieApi {
  n += 1;
  return {
    occurredAt,
    recordedAt: occurredAt,
    value,
    unit: 'kg',
    sourceEvaluationId: `ev-${n}`,
    sourceId: `med-${n}`,
    dataClass: 'MEASURED',
    comparabilityGroup: 'cmp-1',
    correctionState: 'EFFECTIVE',
    incomparableWithPrevious: [],
    ...extra,
  };
}
function serie(series: PuntoDeSerieApi[], gaps: SerieApi['gaps'] = [], grupos = GRUPOS): SerieApi {
  const s: SerieApi = { metricCode: 'peso', series, gaps, comparability: { groups: grupos } };
  // Validada tal como la publica la API.
  EvolucionResponseSchema.parse({ data: { adviseeId: 'a', period: { start: '2026-09-01', end: '2026-09-30', timeZone: ZONA }, metrics: [s], partialView: false, honesty: { interpolated: false, imputed: false, carriedForward: false } } });
  return s;
}

test('serie vacía y un único punto', () => {
  const vacia = prepararSerie(serie([]), ZONA);
  assert.deepEqual(vacia.observaciones, []);
  assert.equal(grupoVigente(vacia, null), null);
  const una = prepararSerie(serie([punto('2026-09-03T14:00:00.000Z', 72.5)]), ZONA);
  assert.equal(una.observaciones.length, 1);
  assert.deepEqual(una.observaciones[0]!.delDia, { orden: 1, total: 1 });
  assert.equal(grupoVigente(una, null), 'cmp-1');
});

test('un cero realmente registrado sigue siendo cero, y no se confunde con un hueco', () => {
  const s = prepararSerie(serie([punto('2026-09-03T14:00:00.000Z', 0)], [{ from: '2026-09-04', to: '2026-09-06', state: 'NO_DATA', days: 3 }]), ZONA);
  assert.equal(s.observaciones[0]!.punto.value, 0);
  assert.equal(resumenDeObservacion(s.observaciones[0]!), '0 kg · Medido');
  assert.deepEqual(s.filas.map((f) => f.tipo), ['observacion', 'hueco']);
});

test('huecos iniciales, intermedios y finales conservan su lugar en la tabla, ordenados con las observaciones', () => {
  const s = prepararSerie(
    serie(
      [punto('2026-09-10T12:00:00.000Z', 71), punto('2026-09-20T12:00:00.000Z', 70)],
      [
        { from: '2026-09-01', to: '2026-09-09', state: 'NO_DATA', days: 9 },
        { from: '2026-09-11', to: '2026-09-19', state: 'NO_DATA', days: 9 },
        { from: '2026-09-21', to: '2026-09-30', state: 'NO_DATA', days: 10 },
      ],
    ),
    ZONA,
  );
  assert.deepEqual(s.filas.map((f) => (f.tipo === 'hueco' ? `hueco ${f.hueco.from}` : `obs ${f.observacion.fecha}`)), ['hueco 2026-09-01', 'obs 2026-09-10', 'hueco 2026-09-11', 'obs 2026-09-20', 'hueco 2026-09-21']);
});

test('varias observaciones el mismo día conservan su identidad: dos puntos, «1 de 2» y «2 de 2», sin promediar', () => {
  // A las 23:30 UTC del 3 todavía es 3 en Buenos Aires; a las 02:30 UTC del 4 es 3 a la noche en Buenos Aires.
  const s = prepararSerie(serie([punto('2026-09-04T02:30:00.000Z', 72.9), punto('2026-09-03T23:30:00.000Z', 72.1)]), ZONA);
  assert.deepEqual(s.observaciones.map((o) => [o.fecha, o.punto.value, o.delDia.orden, o.delDia.total]), [['2026-09-03', 72.1, 1, 2], ['2026-09-03', 72.9, 2, 2]]);
  assert.equal(fechaCivil('2026-09-04T02:30:00.000Z', ZONA), '2026-09-03');
  assert.equal(COPY_EVOLUCION.delDia(2, 2), '2 de 2 del día');
});

test('la selección sigue al sourceId, no a la fecha ni al índice', () => {
  const s = prepararSerie(serie([punto('2026-09-03T12:00:00.000Z', 72, { sourceId: 'med-a' }), punto('2026-09-03T18:00:00.000Z', 73, { sourceId: 'med-b' })]), ZONA);
  assert.equal(observacionPorId(s, 'med-b')!.punto.value, 73);
  assert.equal(observacionPorId(s, 'med-z'), null);
  assert.equal(observacionPorId(s, null), null);
});

test('cambio de protocolo, método o unidad: grupos distintos, cada uno con su eje; los motivos se dicen en palabras', () => {
  const s = prepararSerie(
    serie([
      punto('2026-09-01T12:00:00.000Z', 72),
      punto('2026-09-08T12:00:00.000Z', 71.5, { comparabilityGroup: 'cmp-2', incomparableWithPrevious: ['PROTOCOL'] }),
      punto('2026-09-15T12:00:00.000Z', 157, { unit: 'lb', comparabilityGroup: 'cmp-3', incomparableWithPrevious: ['PROTOCOL', 'UNIT'] }),
    ]),
    ZONA,
  );
  assert.equal(s.variosGrupos, true);
  assert.deepEqual(observacionesDelGrupo(s, 'cmp-3').map((o) => o.punto.unit), ['lb']);
  assert.deepEqual(motivosEnPalabras(s.observaciones[2]!), ['Se tomó con otro protocolo', 'Está en otra unidad']);
  assert.equal(nombreDelGrupo(GRUPOS[2]!), 'PROTO-LAB · lb');
  // El grupo vigente al abrir es el de la observación más reciente; un grupo que no existe cae ahí.
  assert.equal(grupoVigente(s, null), 'cmp-3');
  assert.equal(grupoVigente(s, 'cmp-9'), 'cmp-3');
  assert.equal(grupoVigente(s, 'cmp-1'), 'cmp-1');
});

test('la corrección vigente se marca en el resumen, con el mismo dato para gráfico y tabla', () => {
  const s = prepararSerie(serie([punto('2026-09-03T12:00:00.000Z', 71.8, { correctionState: 'CORRECTED' })]), ZONA);
  assert.equal(resumenDeObservacion(s.observaciones[0]!), '71,8 kg · Medido · Corregida');
});

test('la métrica elegida deja de estar disponible al cambiar el período: se resuelve a la primera, explícitamente', () => {
  const metricas = [serie([punto('2026-09-03T12:00:00.000Z', 72)]), { ...serie([]), metricCode: 'talla' }];
  assert.equal(metricaVigente(metricas, 'talla'), 'talla');
  assert.equal(metricaVigente(metricas, 'cintura'), 'peso');
  assert.equal(metricaVigente([], 'peso'), null);
});

test('la diferencia es aritmética, solo dentro del mismo grupo, e identifica los días entre observaciones', () => {
  const s = prepararSerie(
    serie([punto('2026-09-01T12:00:00.000Z', 72.5), punto('2026-09-11T12:00:00.000Z', 71), punto('2026-09-21T12:00:00.000Z', 156, { unit: 'lb', comparabilityGroup: 'cmp-3', incomparableWithPrevious: ['UNIT'] })]),
    ZONA,
  );
  const [a, b, c] = s.observaciones;
  const d = diferenciaDescriptiva(a!, b!)!;
  assert.deepEqual(d, { delta: -1.5, unidad: 'kg', dias: 10 });
  assert.equal(textoDeDiferenciaAntropometrica(d), '−1,5 kg');
  assert.deepEqual(diferenciaDescriptiva(b!, a!), d, 'el orden de los argumentos no cambia el signo');
  assert.equal(diferenciaDescriptiva(b!, c!), null, 'otro grupo: no se compara');
  assert.equal(textoDeDiferenciaAntropometrica({ delta: 0, unidad: 'kg' }), '0 kg');
});

test('TEST-PRJ-009 · el copy de la evolución no califica ni completa huecos', () => {
  const textos = Object.values(COPY_EVOLUCION).map((v) => (typeof v === 'function' ? v(1, 2) : v));
  assert.deepEqual(textos.flatMap((t) => terminosProhibidosDeAntropometriaEn(t).map((p) => `${p} en «${t}»`)), []);
});
