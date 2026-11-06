// Reproduce UX-01 contra el dominio construido (dist) de la rama que se le pase: un día con 3 de las 4 comidas del plan
// registradas, todas con cantidades. Imprime la calidad del punto, lo que dice la exportación y la cobertura del Resumen.
// Uso: node reproducir-ux01.mjs <raiz-del-arbol>
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const raiz = process.argv[2];
const d = await import(pathToFileURL(join(raiz, 'packages/domain/dist/index.js')).href);

const nutrientes = (kcal) => {
  const v = (value) => ({ value, unit: 'g', missing: [] });
  return { energyKcal: { value: String(kcal), unit: 'kcal', missing: [] }, proteinG: v('20'), carbohydrateG: v('50'), fatG: v('10'), fiberG: v('5') };
};
const registro = (id, fecha, hora, comida, kcal) => ({
  recordId: id,
  kind: 'PLAN_OPTION',
  planId: 'version-1',
  localDate: fecha,
  occurredAt: `${fecha}T${hora}:00.000Z`,
  dayTypeId: 'dia-unico',
  meal: { mealId: comida, label: comida },
  option: null,
  description: null,
  consumption: { status: 'PLAN_PORTIONS', items: [], source: 'ORIGINAL', rectifiedAt: null },
  consumed: nutrientes(kcal),
  annulment: null,
});
// El 20/10, las cuatro comidas; el 21/10, falta la cena (3 de 4). Hoy es el 23/10.
const registros = [
  registro('r1', '2026-10-20', '11:00', 'desayuno', 500),
  registro('r2', '2026-10-20', '15:00', 'almuerzo', 800),
  registro('r3', '2026-10-20', '19:00', 'merienda', 300),
  registro('r4', '2026-10-20', '23:30', 'cena', 750),
  registro('r5', '2026-10-21', '11:00', 'desayuno', 500),
  registro('r6', '2026-10-21', '15:00', 'almuerzo', 800),
  registro('r7', '2026-10-21', '19:00', 'merienda', 300),
];
const definicion = d.METRICAS_DEL_DICCIONARIO.find((m) => m.id === 'nutricion.energia');
const dias = d.diasNutricionales(registros, '2026-10-17', '2026-10-23');
const opciones = { desde: '2026-10-17', hasta: '2026-10-23', hoy: '2026-10-23' };
// La rama corregida pide las comidas del plan: se le pasa el contraste armado con el plan de cuatro comidas.
const plan = {
  planId: 'version-1',
  desde: '2026-10-01',
  hasta: null,
  instantanea: { dayTypes: [{ dayTypeId: 'dia-unico', label: 'Día', meals: ['desayuno', 'almuerzo', 'merienda', 'cena'].map((m) => ({ mealId: m, label: m, prescriptionMode: 'DISH_OPTIONS', options: [] })) }] },
};
if (typeof d.comidasDelPlanDeLosDias === 'function') opciones.comidasDelPlan = d.comidasDelPlanDeLosDias(dias, [plan]);
const serie = d.serieNutricional(dias, definicion, 'ENERGY', 'DAY', opciones);
for (const p of serie.points) console.log(`${p.date}: ${p.value} kcal · calidad ${p.quality} · falta ${JSON.stringify(p.missing)} · detalle ${p.detail.map((x) => `${x.label}=${x.value}`).join(', ')}`);
const csv = d.csvDelAnalisis({ asesorado: 'Persona sintética', desde: '2026-10-17', hasta: '2026-10-23', zona: 'America/Argentina/Buenos_Aires', generadoEl: '2026-10-23T21:00:00Z', series: [{ nombre: 'Calorías registradas', definicion, serie }] });
console.log('Exportación (filas de datos):');
for (const linea of csv.split('\r\n').filter((l) => l.startsWith('Calorías registradas;'))) console.log('  ' + linea);
const r = d.resumirPeriodo(serie, definicion, '2026-10-17', '2026-10-23', '2026-10-23');
console.log(`Resumen: valor ${r.valor} · n ${r.n} · subtotales ${r.parciales}`);
console.log('Cobertura breve:', JSON.stringify(d.coberturaBreve(r)));
