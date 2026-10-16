// Revisión del head fbeb256, hallazgo 2: los resúmenes de Analizar con el gráfico agrupado por semana.
// Uso: node reproducir-2-semanas.cjs [ruta a packages/domain/dist/index.js]   (por omisión, el dominio de este árbol)
//
// Con el dominio de fbeb256, los resúmenes aceptan puntos semanales y los tratan como observaciones: 1.500 en lugar de
// 1.875, y «sin valor» del 16 al 20. Con el dominio corregido, los rechazan (falla en voz alta) y sobre los días dan lo
// esperado. Los valores esperados son los de la revisión, calculados a mano.
const path = require('node:path');
const d = require(process.argv[2] ?? path.resolve(__dirname, '../../../../packages/domain/dist/index.js'));

const def = d.definicionDeMetrica('nutricion.energia', '');
const punto = (fecha, valor, extra = {}) => ({
  pointId: `d:${fecha}`,
  date: fecha,
  dateEnd: null,
  at: null,
  value: valor,
  quality: 'COMPLETE',
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
const serie = (grain, points) => ({ metricId: def.id, label: def.nombre, unit: 'kcal', scale: 'RATIO', grain, aggregation: grain === 'WEEK' ? 'MEAN_OF_DAYS_WITH_DATA' : 'SUM_OF_KNOWN', points, gaps: [], segments: [], notes: [] });

// Del 7 al 20 de septiembre de 2026: la primera semana, un único día con 1.000 kcal; la segunda, siete días con 2.000.
const diaria = serie('DAY', [punto('2026-09-09', 1000), ...[14, 15, 16, 17, 18, 19, 20].map((x) => punto(`2026-09-${x}`, 2000))]);
const semanal = serie('WEEK', [
  punto('2026-09-07', 1000, { pointId: 'w:2026-09-07', dateEnd: '2026-09-13', n: 1 }),
  punto('2026-09-14', 2000, { pointId: 'w:2026-09-14', dateEnd: '2026-09-20', n: 7 }),
]);

const intentar = (que, f) => {
  try {
    return f();
  } catch (e) {
    return `rechazada: ${e.message.slice(0, 90)}…`;
  }
};
const resumen = (s, a, b) => intentar('resumen', () => {
  const x = d.resumirPeriodo(s, def, a, b);
  return `${x.valor === null ? 'sin valor' : x.valor} · n ${x.n}`;
});
const filas = [
  ['Media del 7 al 20, serie de días', resumen(diaria, '2026-09-07', '2026-09-20'), '1875 · n 8'],
  ['Media del 7 al 20, serie semanal', resumen(semanal, '2026-09-07', '2026-09-20'), '1875 · n 8 (o rechazada)'],
  ['Media del 16 al 20, serie de días', resumen(diaria, '2026-09-16', '2026-09-20'), '2000 · n 5'],
  ['Media del 16 al 20, serie semanal', resumen(semanal, '2026-09-16', '2026-09-20'), '2000 · n 5 (o rechazada)'],
  [
    'Comparar 7-13 con 16-20, serie de días',
    intentar('comparación', () => {
      const c = d.compararPeriodos(diaria, def, { desde: '2026-09-07', hasta: '2026-09-13' }, { desde: '2026-09-16', hasta: '2026-09-20' });
      return `diferencia ${c.diferencia ?? c.motivoSinDiferencia}`;
    }),
    'diferencia 1000',
  ],
  [
    'Comparar 7-13 con 16-20, serie semanal',
    intentar('comparación', () => {
      const c = d.compararPeriodos(semanal, def, { desde: '2026-09-07', hasta: '2026-09-13' }, { desde: '2026-09-16', hasta: '2026-09-20' });
      return `diferencia ${c.diferencia ?? c.motivoSinDiferencia}`;
    }),
    'diferencia 1000 (o rechazada)',
  ],
];
for (const [que, obtenido, esperado] of filas) console.log(`${que}: ${obtenido}   [esperado: ${esperado}]`);
