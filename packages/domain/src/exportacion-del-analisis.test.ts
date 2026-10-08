/**
 * La exportación CSV de Analizar (PRO-10 y PRO-20): lo desconocido, el cero, el subtotal y lo incompleto siguen distintos
 * en el archivo; los valores se redondean como en la pantalla; el rango se respeta, y una celda de texto nunca se puede
 * leer como fórmula. Los resultados esperados están escritos a mano.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PuntoAnalitico, SerieAnalitica } from './contratos-analisis';
import { celdaDeTexto, COLUMNAS_DE_LA_EXPORTACION, csvDelAnalisis, nombreDeLaExportacion, numeroParaExportar } from './exportacion-del-analisis';
import { definicionDeMetrica, VERSION_DEL_DICCIONARIO, type DefinicionDeMetrica } from './metricas-del-analisis';

const def = (id: string): DefinicionDeMetrica => {
  const d = definicionDeMetrica(id, '');
  if (!d) throw new Error(`sin definición: ${id}`);
  return d;
};

const punto = (fecha: string, valor: number | null, extra: Partial<PuntoAnalitico> = {}): PuntoAnalitico => ({
  pointId: `d:${fecha}`,
  date: fecha,
  dateEnd: null,
  at: null,
  value: valor,
  quality: valor === null ? 'UNKNOWN' : 'COMPLETE',
  n: 1,
  segment: 't1',
  corrected: false,
  partialBucket: false,
  dataClass: null,
  coverage: null,
  missing: [],
  detail: [],
  sources: [],
  sourcesTruncated: false,
  ...extra,
});

const serie = (d: DefinicionDeMetrica, puntos: PuntoAnalitico[], unidad = d.unidad): SerieAnalitica => ({
  metricId: d.id,
  label: d.nombre,
  unit: unidad,
  scale: d.escala,
  grain: 'DAY',
  aggregation: 'SUM_OF_KNOWN',
  points: puntos,
  gaps: [],
  segments: [{ segment: 't1', label: '', breakReason: null }],
  notes: [],
});

/** Las filas de datos (después del encabezado de columnas), como listas de celdas. */
const filasDeDatos = (csv: string): string[][] => {
  const lineas = csv.trimEnd().split('\r\n');
  const i = lineas.indexOf(COLUMNAS_DE_LA_EXPORTACION.join(';'));
  assert.ok(i > 0, 'el encabezado de columnas está después del bloque que explica el archivo');
  return lineas.slice(i + 1).map((l) => l.split(';'));
};

test('desconocido vacío, cero como 0, subtotal y día sin completar en sus columnas; redondeo de la pantalla (PRO-10)', () => {
  const energia = def('nutricion.energia');
  const csv = csvDelAnalisis({
    asesorado: 'Asesorado · 9b2284',
    desde: '2026-10-01',
    hasta: '2026-10-08',
    zona: 'America/Argentina/Buenos_Aires',
    generadoEl: '2026-10-08T18:00:00.000Z',
    series: [
      {
        nombre: 'Energía',
        definicion: energia,
        serie: serie(energia, [
          punto('2026-09-30', 1999), // fuera del rango: no se exporta
          punto('2026-10-01', 1341.5, { coverage: { records: 4, recordsWithQuantities: 4, recordsWithoutQuantities: 0, daysWithData: null, daysInBucket: null } }),
          punto('2026-10-02', 0),
          punto('2026-10-03', null, { missing: [{ reason: 'SIN_CANTIDADES', count: 2 }] }),
          punto('2026-10-04', 900, { quality: 'PARTIAL', missing: [{ reason: 'COMIDA_DIFERENTE_SIN_CANTIDADES', count: 1 }] }),
          punto('2026-10-08', 227, { partialBucket: true, corrected: true }),
        ]),
      },
    ],
  });
  const filas = filasDeDatos(csv);
  assert.deepEqual(
    filas.map((f) => [f[3], f[6], f[7], f[8], f[11]]),
    [
      ['2026-10-01', '1342', 'sin faltantes', 'no', 'no'],
      ['2026-10-02', '0', 'sin faltantes', 'no', 'no'],
      ['2026-10-03', '', 'sin valor conocido', 'no', 'no'],
      ['2026-10-04', '900', 'subtotal', 'no', 'no'],
      ['2026-10-08', '227', 'sin faltantes', 'sí', 'sí'],
    ],
  );
  assert.deepEqual(filas[0]!.slice(12, 15), ['4', '4', '0'], 'la cobertura del punto');
  assert.equal(filas[2]![15], '2 registro(s) sin cantidades');
  assert.equal(filas[3]![15], '1 comida(s) diferente(s) sin cantidades');
  assert.match(csv, new RegExp(`Diccionario de métricas;${VERSION_DEL_DICCIONARIO}`));
  assert.match(csv, /Zona horaria;America\/Argentina\/Buenos_Aires/);
  assert.match(csv, /Generado;2026-10-08T18:00:00.000Z/);
  assert.match(csv, /Valor vacío: sin valor conocido \(nunca es 0\)/);
  assert.match(csv, /Agrupación;Energía: por día/);
  assert.ok(filas.every((f) => f[16] === ''), 'en nutrición la clase de dato no aplica: la columna queda vacía');
});

test('la clase del dato antropométrico se exporta: medido, reportado por la persona o calculado por un método (PRO-10)', () => {
  const peso = definicionDeMetrica('antropometria.peso', 'kg');
  if (!peso) throw new Error('sin definición del peso');
  const csv = csvDelAnalisis({
    asesorado: 'A',
    desde: '2026-09-01',
    hasta: '2026-09-30',
    zona: 'America/Argentina/Buenos_Aires',
    generadoEl: '2026-09-30T12:00:00.000Z',
    series: [
      {
        nombre: 'Peso',
        definicion: peso,
        serie: {
          ...serie(peso, [punto('2026-09-01', 80, { dataClass: 'MEASURED' }), punto('2026-09-10', 79, { dataClass: 'REPORTED' }), punto('2026-09-20', 79.4, { dataClass: 'DERIVED' })], 'kg'),
          grain: 'ORIGINAL',
          aggregation: 'NONE',
        },
      },
    ],
  });
  assert.deepEqual(
    filasDeDatos(csv).map((f) => [f[3], f[6], f[16]]),
    [
      ['2026-09-01', '80,0', 'Medido'],
      ['2026-09-10', '79,0', 'Reportado por la persona, no medido'],
      ['2026-09-20', '79,4', 'Calculado por un método (estimación)'],
    ],
  );
  assert.match(csv, /Agrupación;Peso: cada observación \(toma o sesión\)/);
});

test('gramos a un decimal con coma (HALF_UP sobre el exacto) y la hora en la zona del asesorado', () => {
  const proteinas = def('nutricion.proteinas');
  assert.equal(numeroParaExportar(13.25, proteinas), '13,3');
  assert.equal(numeroParaExportar(76.5, proteinas), '76,5');
  const csv = csvDelAnalisis({
    asesorado: 'A',
    desde: '2026-10-01',
    hasta: '2026-10-01',
    zona: 'America/Argentina/Buenos_Aires',
    generadoEl: '2026-10-01T12:00:00.000Z',
    series: [{ nombre: 'Proteínas', definicion: proteinas, serie: serie(proteinas, [punto('2026-10-01', 13.25, { at: '2026-10-01T11:30:00.000Z' })]) }],
  });
  assert.deepEqual(filasDeDatos(csv)[0]!.slice(5, 7), ['08:30', '13,3'], '11:30 UTC son las 08:30 en Buenos Aires');
});

test('una celda de texto nunca es una fórmula, y un separador o una comilla no rompen la fila (PRO-20)', () => {
  assert.equal(celdaDeTexto('=HYPERLINK("http://x","clic")'), `"'=HYPERLINK(""http://x"",""clic"")"`);
  assert.equal(celdaDeTexto('+54 11'), "'+54 11");
  assert.equal(celdaDeTexto('-1'), "'-1");
  assert.equal(celdaDeTexto('@SUMA(A1)'), "'@SUMA(A1)");
  assert.equal(celdaDeTexto('Press; banca'), '"Press; banca"');
  assert.equal(celdaDeTexto('Sentadilla'), 'Sentadilla');
  const carga = def('entrenamiento.carga');
  const csv = csvDelAnalisis({
    asesorado: 'A',
    desde: '2026-10-01',
    hasta: '2026-10-01',
    zona: 'America/Argentina/Buenos_Aires',
    generadoEl: '2026-10-01T12:00:00.000Z',
    series: [{ nombre: '=cmd|/c calc · serie 1 (kg)', definicion: carga, serie: serie(carga, [punto('2026-10-01', 62.5)], 'kg') }],
  });
  assert.equal(filasDeDatos(csv)[0]![0], "'=cmd|/c calc · serie 1 (kg)");
  assert.equal(filasDeDatos(csv)[0]![6], '62,5');
  assert.equal(nombreDeLaExportacion('2026-07-11', '2026-10-08'), 'BE-analisis-2026-07-11-a-2026-10-08.csv');
});
