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
  diasEnPalabras,
  diasEntreFechas,
  diaSiguiente,
  diferenciaDescriptiva,
  fechaCivil,
  grupoVigente,
  inicioDelDia,
  limitesDelPeriodo,
  marcasDelPeriodo,
  metodoEnPalabras,
  metricaVigente,
  motivosEnPalabras,
  nombreDelGrupo,
  observacionesDelGrupo,
  observacionPorId,
  prepararSerie,
  dominioDelEjeVertical,
  protocoloEnPalabras,
  resumenDeObservacion,
  textoDeDiferenciaAntropometrica,
} from './evolucion-antropometrica';

const ZONA = 'America/Argentina/Buenos_Aires';
const GRUPOS: SerieApi['comparability']['groups'] = [
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

test('el eje temporal se recorta en la zona del período, no en la del navegador: los extremos caen adentro', () => {
  // Período de un solo día, 29/09, en Buenos Aires (UTC−3): va de las 03:00Z del 29 a las 03:00Z del 30.
  const un_dia = { start: '2026-09-29', end: '2026-09-29' };
  const { desde, hasta } = limitesDelPeriodo(un_dia, ZONA);
  assert.equal(new Date(desde).toISOString(), '2026-09-29T03:00:00.000Z');
  assert.equal(new Date(hasta).toISOString(), '2026-09-30T03:00:00.000Z');
  // La observación de las 23:30 locales del 29 (02:30Z del 30) es válida para la API y entra en el eje.
  const tarde = new Date('2026-09-30T02:30:00.000Z').getTime();
  assert.ok(tarde >= desde && tarde < hasta, 'la última hora del día local queda dentro del eje');
  // Y la de las 00:30 locales del 29 (03:30Z del 29) también; la de las 02:30Z del 29 (23:30 del 28) no.
  assert.ok(new Date('2026-09-29T03:30:00.000Z').getTime() >= desde);
  assert.ok(new Date('2026-09-29T02:30:00.000Z').getTime() < desde);
  // Con `T00:00:00Z` (la regla anterior) el mismo punto quedaba fuera: es lo que se corrige.
  assert.ok(tarde > new Date('2026-09-29T23:59:59Z').getTime());
  // Las marcas de un día: una sola, al mediodía local, con su fecha civil.
  assert.deepEqual(marcasDelPeriodo(un_dia, ZONA), [{ instante: new Date('2026-09-29T15:00:00.000Z').getTime(), fecha: '2026-09-29' }]);
  // Un mes: hasta siete marcas, ninguna después del último día del período.
  const mes = { start: '2026-09-01', end: '2026-09-30' };
  const marcas = marcasDelPeriodo(mes, ZONA);
  assert.ok(marcas.length >= 4 && marcas.length <= 7, `${marcas.length} marcas`);
  assert.deepEqual(marcas.map((m) => m.fecha), ['2026-09-01', '2026-09-06', '2026-09-11', '2026-09-16', '2026-09-21', '2026-09-26']);
  const fin = limitesDelPeriodo(mes, ZONA).hasta;
  assert.ok(marcas.every((m) => m.instante < fin && m.instante >= limitesDelPeriodo(mes, ZONA).desde));
  // Otra zona, mismo período: los límites cambian con la zona del período, no con la del proceso.
  assert.equal(new Date(limitesDelPeriodo(un_dia, 'Asia/Tokyo').desde).toISOString(), '2026-09-28T15:00:00.000Z');
  assert.equal(new Date(inicioDelDia('2026-09-29', 'UTC')).toISOString(), '2026-09-29T00:00:00.000Z');
  // Una zona desconocida se trata como UTC, sin romper el gráfico.
  assert.equal(inicioDelDia('2026-09-29', 'Marte/Olympus'), inicioDelDia('2026-09-29', 'UTC'));
  assert.equal(diaSiguiente('2026-12-31'), '2027-01-01');
  assert.equal(diasEntreFechas('2026-09-29', '2026-10-01'), 2);
});

test('los días de la diferencia son de calendario en la zona del período: cambio de fecha con menos de 12 horas', () => {
  const s = prepararSerie(
    serie([
      punto('2026-09-04T02:30:00.000Z', 72.9), // 3/9 a las 23:30 en Buenos Aires
      punto('2026-09-04T04:00:00.000Z', 72.4), // 4/9 a la 01:00: fecha siguiente, 1,5 horas después
      punto('2026-09-03T12:00:00.000Z', 73.2), // 3/9 a las 09:00: mismo día que la primera, 14,5 horas antes
      punto('2026-09-05T11:00:00.000Z', 72), // 5/9 a las 08:00
    ]),
    ZONA,
  );
  const [maniana3, noche3, madrugada4, dia5] = s.observaciones;
  assert.deepEqual(diferenciaDescriptiva(noche3!, madrugada4!), { delta: -0.5, unidad: 'kg', dias: 1 }, 'fechas consecutivas a 1,5 h: 1 día, no 0');
  assert.deepEqual(diferenciaDescriptiva(maniana3!, noche3!), { delta: -0.3, unidad: 'kg', dias: 0 }, 'mismo día a 14,5 h: 0 días, no 1');
  assert.deepEqual(diferenciaDescriptiva(maniana3!, dia5!), { delta: -1.2, unidad: 'kg', dias: 2 });
  assert.equal(diferenciaDescriptiva(noche3!, noche3!), null, 'una observación no se compara consigo misma');
  assert.equal(diasEnPalabras(0), 'el mismo día');
  assert.equal(diasEnPalabras(1), 'con 1 día de calendario entre las fechas');
  assert.equal(diasEnPalabras(12), 'con 12 días de calendario entre las fechas');
});

test('dos grupos que solo se distinguen por la versión del método o del protocolo tienen nombres distintos', () => {
  const conMetodo: SerieApi['comparability']['groups'] = [
    { comparabilityGroup: 'cmp-a', protocolVersionId: 'proto-1', protocolName: 'PROTO-LAB', methodVersionId: 'metodo-v1-0000', unit: '%' },
    { comparabilityGroup: 'cmp-b', protocolVersionId: 'proto-1', protocolName: 'PROTO-LAB', methodVersionId: 'metodo-v2-0000', unit: '%' },
    { comparabilityGroup: 'cmp-c', protocolVersionId: 'proto-1', protocolName: 'PROTO-LAB', methodVersionId: null, unit: '%' },
  ];
  const s = prepararSerie(
    serie(
      [
        punto('2026-09-01T12:00:00.000Z', 18.2, { unit: '%', comparabilityGroup: 'cmp-a', dataClass: 'DERIVED' }),
        punto('2026-09-08T12:00:00.000Z', 18, { unit: '%', comparabilityGroup: 'cmp-b', dataClass: 'DERIVED', incomparableWithPrevious: ['METHOD'] }),
      ],
      [],
      conMetodo,
    ),
    ZONA,
  );
  assert.equal(s.variosGrupos, true);
  assert.deepEqual(motivosEnPalabras(s.observaciones[1]!), ['Se calculó con otro método']);
  // Solo cambia la versión del método: el nombre lo dice con la referencia del contrato, sin inventar un nombre.
  const nombres = conMetodo.map((g) => nombreDelGrupo(g, conMetodo));
  assert.equal(new Set(nombres).size, 3, 'tres nombres distintos');
  assert.equal(nombres[2], 'PROTO-LAB · %');
  // Las referencias recortadas coincidirían («metodo-v…»): se usa el identificador entero.
  assert.equal(nombres[0], 'PROTO-LAB · calculado con método · % (método metodo-v1-0000)');
  assert.equal(nombres[1], 'PROTO-LAB · calculado con método · % (método metodo-v2-0000)');
  // Referencias largas y distintas: recortadas.
  const largos = [
    { ...conMetodo[0]!, methodVersionId: 'a1b2c3d4-0000-4000-8000-000000000001' },
    { ...conMetodo[1]!, methodVersionId: 'f9e8d7c6-0000-4000-8000-000000000002' },
  ];
  assert.equal(nombreDelGrupo(largos[0]!, largos), 'PROTO-LAB · calculado con método · % (método a1b2c3d4…)');
  assert.equal(metodoEnPalabras('a1b2c3d4-0000-4000-8000-000000000001'), 'Calculado con el método declarado en la evaluación (referencia a1b2c3d4-0000-4000-8000-000000000001)');
  // DL-111: un método del catálogo de BE se nombra.
  assert.equal(metodoEnPalabras('3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f01'), 'Calculado con el método «Índice de masa corporal (IMC)»');
  // Mismo nombre de protocolo, otra versión: también se distingue, en el nombre del grupo y en el detalle.
  const versiones: SerieApi['comparability']['groups'] = [
    { comparabilityGroup: 'cmp-1', protocolVersionId: 'proto-1', protocolName: 'PROTO-LAB', methodVersionId: null, unit: 'kg' },
    { comparabilityGroup: 'cmp-4', protocolVersionId: 'proto-2', protocolName: 'PROTO-LAB', methodVersionId: null, unit: 'kg' },
  ];
  assert.equal(nombreDelGrupo(versiones[1]!, versiones), 'PROTO-LAB · kg (versión del protocolo proto-2)');
  assert.equal(protocoloEnPalabras(versiones[1]!, versiones), 'PROTO-LAB (versión proto-2)');
  assert.equal(protocoloEnPalabras(GRUPOS[1]!, GRUPOS), 'PROTO-CAMPO', 'sin homónimos, el nombre solo');
  // Sin homónimos, nada cambia respecto del nombre simple.
  assert.equal(nombreDelGrupo(GRUPOS[2]!, GRUPOS), 'PROTO-LAB · lb');
});

test('TEST-PRJ-009 · el copy de la evolución no califica ni completa huecos', () => {
  const textos = Object.values(COPY_EVOLUCION).map((v) => (typeof v === 'function' ? (v as (...args: never[]) => string)(...([1, 2] as never[])) : v));
  textos.push(COPY_EVOLUCION.zona('America/Argentina/Buenos_Aires'), COPY_EVOLUCION.delDia(1, 2));
  assert.deepEqual(textos.flatMap((t) => terminosProhibidosDeAntropometriaEn(t).map((p) => `${p} en «${t}»`)), []);
});

test('el eje vertical tiene margen de al menos una unidad y del 5 %, sin forzar el cero; con un valor queda centrado', () => {
  assert.deepEqual(dominioDelEjeVertical(85, 88), { desde: 80, hasta: 93 });
  assert.deepEqual(dominioDelEjeVertical(10, 10), { desde: 9, hasta: 11 });
  assert.deepEqual(dominioDelEjeVertical(0.5, 0.6), { desde: -1, hasta: 2 });
});
