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
  method: null,
  planVersionIds: [],
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

/** La cobertura de un día de nutrición, con sus comidas del plan (DL-153): como la arma `serieNutricional`. */
const cobertura = (registros: number, conCantidades: number, comidas: Partial<NonNullable<PuntoAnalitico['coverage']>['planMeals']> = {}): NonNullable<PuntoAnalitico['coverage']> => ({
  records: registros,
  recordsWithQuantities: conCantidades,
  recordsWithoutQuantities: registros - conCantidades,
  daysWithData: null,
  daysInBucket: null,
  planMeals: { daysKnown: 1, daysUndetermined: [], expected: 0, withPlanOption: 0, withDifferentMeal: 0, withoutRecord: 0, ...comidas },
});

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
          punto('2026-10-01', 1341.5, { coverage: cobertura(4, 4, { expected: 4, withPlanOption: 4 }) }),
          // Un cero registrado un día sin plan vigente: es 0, y no se dice que el día esté completo.
          punto('2026-10-02', 0, { coverage: cobertura(1, 1, { daysKnown: 0, daysUndetermined: [{ reason: 'NO_ACTIVE_PLAN', days: 1 }] }) }),
          punto('2026-10-03', null, { missing: [{ reason: 'SIN_CANTIDADES', count: 2 }], coverage: cobertura(2, 0, { expected: 2, withPlanOption: 2 }) }),
          punto('2026-10-04', 900, {
            quality: 'PARTIAL',
            missing: [
              { reason: 'COMIDA_DIFERENTE_SIN_CANTIDADES', count: 1 },
              { reason: 'COMIDA_DEL_PLAN_SIN_REGISTRO', count: 1 },
            ],
            coverage: cobertura(3, 2, { expected: 4, withPlanOption: 2, withDifferentMeal: 1, withoutRecord: 1 }),
          }),
          // Hoy, con una comida de cuatro: subtotal, y sin completar.
          punto('2026-10-08', 227, { quality: 'PARTIAL', partialBucket: true, corrected: true, missing: [{ reason: 'COMIDA_DEL_PLAN_SIN_REGISTRO', count: 3 }], coverage: cobertura(1, 1, { expected: 4, withPlanOption: 1, withoutRecord: 3 }) }),
        ]),
      },
    ],
  });
  const filas = filasDeDatos(csv);
  assert.deepEqual(
    filas.map((f) => [f[3], f[6], f[7], f[8], f[11]]),
    [
      ['2026-10-01', '1342', 'cada comida del plan con registro, con cantidades', 'no', 'no'],
      ['2026-10-02', '0', 'registros con cantidades, sin saber qué comidas indicaba el plan', 'no', 'no'],
      ['2026-10-03', '', 'sin valor conocido', 'no', 'no'],
      ['2026-10-04', '900', 'subtotal', 'no', 'no'],
      ['2026-10-08', '227', 'subtotal', 'sí', 'sí'],
    ],
  );
  // DL-153: en nutrición la calidad nunca dice «sin faltantes»: lo registrado no es todo lo que se comió.
  assert.doesNotMatch(csv, /sin faltantes/);
  assert.deepEqual(filas[0]!.slice(12, 15), ['4', '4', '0'], 'la cobertura del punto');
  assert.deepEqual(
    filas.map((f) => f[15]),
    ['4 de 4 con registro', 'sin determinar: no había un plan vigente', '2 de 2 con registro', '3 de 4 con registro · 1 sin registro · 2 con opción del plan · 1 con comida diferente', '1 de 4 con registro · 3 sin registro'],
    'las comidas del plan de cada día: el mismo conteo que la pantalla y la pestaña Registros (DL-153, criterios del 2026-10-24)',
  );
  assert.equal(filas[2]![16], '2 registro(s) sin cantidades');
  assert.equal(filas[3]![16], '1 comida(s) diferente(s) sin cantidades, 1 comida(s) del plan sin registro');
  assert.match(csv, new RegExp(`Diccionario de métricas;${VERSION_DEL_DICCIONARIO}`));
  assert.match(csv, /Zona horaria;America\/Argentina\/Buenos_Aires/);
  assert.match(csv, /Generado;2026-10-08T18:00:00.000Z/);
  assert.match(csv, /Valor vacío: sin valor conocido \(nunca es 0\)/);
  assert.match(csv, /Agrupación;Energía: por día/);
  assert.ok(filas.every((f) => f[17] === ''), 'en nutrición la clase de dato no aplica: la columna queda vacía');
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
    filasDeDatos(csv).map((f) => [f[3], f[6], f[17]]),
    [
      ['2026-09-01', '80,0', 'Medido'],
      ['2026-09-10', '79,0', 'Reportado por la persona, no medido'],
      // Sin método identificado no se afirma que sea una estimación (encargo del 2026-10-09, eje 3).
      ['2026-09-20', '79,4', 'Calculado por un método'],
    ],
  );
  assert.match(csv, /Agrupación;Peso: cada observación \(toma o sesión\)/);
});

test('calculado no es siempre estimado: la exportación dice la naturaleza del método y su nombre (eje 3)', () => {
  const peso = definicionDeMetrica('antropometria.peso', 'kg') as DefinicionDeMetrica;
  const indice = { methodVersionId: '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f01', name: 'Índice de masa corporal (IMC)', nature: 'INDEX' as const };
  const ecuacion = { methodVersionId: '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f08', name: 'Durnin y Womersley, hombres · Siri', nature: 'ESTIMATE' as const };
  const csv = csvDelAnalisis({
    asesorado: 'A',
    desde: '2026-09-01',
    hasta: '2026-09-30',
    zona: 'America/Argentina/Buenos_Aires',
    generadoEl: '2026-09-30T12:00:00.000Z',
    series: [
      {
        nombre: 'Calculados',
        definicion: peso,
        serie: {
          ...serie(peso, [punto('2026-09-01', 24.1, { dataClass: 'DERIVED', method: indice }), punto('2026-09-20', 18.2, { dataClass: 'DERIVED', method: ecuacion })], 'kg'),
          grain: 'ORIGINAL',
          aggregation: 'NONE',
        },
      },
    ],
  });
  assert.deepEqual(
    filasDeDatos(csv).map((f) => f[17]),
    ['Calculado: un índice calculado sobre medidas, no una estimación (Índice de masa corporal (IMC))', 'Calculado: una estimación con una ecuación de predicción (Durnin y Womersley, hombres · Siri)'],
  );
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

test('DL-158: el objetivo y lo indicado en sus columnas; un día sin registros con indicado tiene su fila, con el valor vacío', () => {
  const energia = def('nutricion.energia');
  const proteinas = def('nutricion.proteinas');
  const objetivo = [
    { objectiveVersionId: 'o1', from: '2026-09-20', to: '2026-10-02', amount: { value: 2200, unit: 'kcal/day' as const }, energyShare: null },
    { objectiveVersionId: 'o2', from: '2026-10-02', to: null, amount: { value: 1950, unit: 'kcal/day' as const }, energyShare: null },
  ];
  const indicado = [
    { date: '2026-10-01', state: 'DETERMINED' as const, value: 2012.4, planVersionId: 'p1', dayTypeId: 'd', dayType: 'Día habitual' },
    { date: '2026-10-02', state: 'DETERMINED' as const, value: 1890, planVersionId: 'p1', dayTypeId: 'd', dayType: 'Día habitual' },
    { date: '2026-10-03', state: 'UNDETERMINED' as const, reason: 'SEVERAL_OPTIONS' as const, planVersionId: 'p1', mealsWithSeveralOptions: [{ meal: 'Almuerzo', options: 3 }] },
    { date: '2026-10-04', state: 'UNDETERMINED' as const, reason: 'NO_ACTIVE_PLAN' as const, planVersionId: null, mealsWithSeveralOptions: [] },
  ];
  // Una semana que empieza en el rango (la exportación no lleva las que empiezan antes) y en la que cambió el objetivo.
  const semanal: SerieAnalitica = { ...serie(energia, [punto('2026-10-01', 1500, { dateEnd: '2026-10-04' })]), grain: 'WEEK', aggregation: 'MEAN_OF_DAYS_WITH_DATA' };
  const csv = csvDelAnalisis({
    asesorado: 'Asesorado · 9b2284',
    desde: '2026-10-01',
    hasta: '2026-10-04',
    zona: 'America/Argentina/Buenos_Aires',
    generadoEl: '2026-10-04T18:00:00.000Z',
    series: [
      { nombre: 'Calorías registradas', definicion: energia, serie: serie(energia, [punto('2026-10-01', 1341.5, { coverage: cobertura(2, 2, { expected: 2, withPlanOption: 2 }) }), punto('2026-10-03', null)]), comparacion: { objetivo, indicado } },
      { nombre: 'Proteínas registradas', definicion: proteinas, serie: serie(proteinas, [punto('2026-10-01', 80)]), comparacion: { objetivo: [{ objectiveVersionId: 'o3', from: '2026-09-01', to: null, amount: null, energyShare: 0.3 }], indicado: [] } },
      { nombre: 'Calorías por semana', definicion: energia, serie: semanal, comparacion: { objetivo, indicado } },
      { nombre: 'Sin comparación', definicion: energia, serie: serie(energia, [punto('2026-10-02', 10)]) },
    ],
  });
  const filas = filasDeDatos(csv);
  const objetivoCol = COLUMNAS_DE_LA_EXPORTACION.indexOf('Objetivo del profesional (por día)');
  const indicadoCol = COLUMNAS_DE_LA_EXPORTACION.indexOf('Indicado en el plan');
  assert.deepEqual([objetivoCol, indicadoCol], [18, 19], 'las columnas nuevas van al final: las de antes no se mueven');
  assert.deepEqual(
    filas.map((f) => [f[0], f[3], f[6], f[9], f[objetivoCol], f[indicadoCol]]),
    [
      ['Calorías registradas', '2026-10-01', '1342', '1', '2200', '2012'],
      // El día del cambio de objetivo ya vale el nuevo; sin registros, pero con indicado: su fila, con el valor vacío.
      ['Calorías registradas', '2026-10-02', '', '0', '1950', '1890'],
      ['Calorías registradas', '2026-10-03', '', '1', '1950', 'sin indicado: comidas con varias opciones'],
      // El 2026-10-04 no tiene registros ni indicado: no hay fila (el gráfico tampoco dibuja nada).
      ['Proteínas registradas', '2026-10-01', '80,0', '1', 'proporción de las calorías 0,3', ''],
      ['Calorías por semana', '2026-10-01', '1500', '1', '2200 y 1950', 'es por día: no se agrupa por semana'],
      ['Sin comparación', '2026-10-02', '10', '1', '', ''],
    ],
  );
  // La fila del día sin registros lo dice en la calidad, y no tiene cobertura que contar más que cero.
  assert.deepEqual(filas[1]!.slice(6, 16), ['', 'sin registros', '', '0', '', '', '0', '0', '0', '']);
  assert.equal(filas[0]![7], 'cada comida del plan con registro, con cantidades');
  assert.ok(filas.every((f) => f.length === COLUMNAS_DE_LA_EXPORTACION.length), 'cada fila tiene todas las columnas');
  assert.match(csv, /Indicado en el plan: lo que indicaba el plan ese día, solo si cada comida tenía una sola opción/);
  assert.match(csv, /Las alternativas no se suman ni se promedian/);
});
