// Tiempos de las lecturas del entorno profesional contra la API local, para el presupuesto de PRO-24 (ACEPTACION.md).
// Uso: node tiempos.mjs [días=84] [vueltas=7]   (lee trabajo/estado.json; escribe trabajo/tiempos-<días>.json)
// Inicia una sola sesión por corrida: el límite de inicios es 5 cada 15 minutos.
import fs from 'node:fs';
import { enTrabajo } from './rutas.mjs';

const e = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const O = 'http://localhost:3001/api/v1';
const [dias = '84', vueltas = '7'] = process.argv.slice(2);
const N = Number(vueltas);
const sesion = await (
  await fetch(`${O}/auth/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-BE-Surface': 'WEB' },
    body: JSON.stringify({ method: 'LOCAL', identifier: e.proCorreo, credential: 'clave-sintetica-de-prueba-01' }),
  })
).json();
const token = sesion.data.session.accessToken;

const pedir = async (ruta) => {
  const t0 = performance.now();
  const r = await fetch(`${O}${ruta}`, { headers: { Authorization: `Bearer ${token}` } });
  const cuerpo = await r.text();
  return { ms: performance.now() - t0, status: r.status, cuerpo };
};
const resumir = (t) => {
  const s = [...t].sort((a, b) => a - b);
  return { mediana: Math.round(s[Math.floor(s.length / 2)]), min: Math.round(s[0]), max: Math.round(s[s.length - 1]) };
};
const fila = (nombre, r) => console.log(`${nombre.padEnd(44)} mediana ${String(r.mediana).padStart(5)} ms (mín ${r.min}, máx ${r.max})`);
const medir = async (nombre, ruta) => {
  await pedir(ruta); // calentamiento
  const t = [];
  for (let i = 0; i < N; i++) {
    const r = await pedir(ruta);
    if (r.status !== 200) throw new Error(`${nombre}: respondió ${r.status}`);
    t.push(r.ms);
  }
  const res = resumir(t);
  fila(nombre, res);
  return res;
};

const desde = new Date(Date.now() - (Number(dias) - 1) * 86400000).toISOString().slice(0, 10);
const q = `periodStart=${desde}`;
const a = `/advisees/${e.aseId}`;
// Si una corrida anterior agotó el cupo de lecturas, se espera a que venza la ventana.
let primera = await pedir(`${a}/projections/TRAINING_PROGRESSION_BY_EXERCISE?${q}`);
if (primera.status === 429) {
  console.log('Cupo de lecturas agotado por una corrida anterior: espero un minuto.');
  await new Promise((r) => setTimeout(r, 61_000));
  primera = await pedir(`${a}/projections/TRAINING_PROGRESSION_BY_EXERCISE?${q}`);
}
const lista = JSON.parse(primera.cuerpo);
const ejercicio = encodeURIComponent([...lista.data.result.exercises].sort((x, y) => y.sessions - x.sessions)[0].exerciseKey);
console.log(`Período de ${dias} días desde ${desde}; ${N} vueltas secuenciales después de una de calentamiento.`);

const lecturas = {
  'DSH-03 resumen por dominio': `${a}/dashboard`,
  'DSH-04 línea de tiempo (6, con conteos)': `${a}/timeline?${q}&limit=6`,
  'DSH-04 línea de tiempo (50)': `${a}/timeline?${q}&limit=50`,
  'DSH-04 búsqueda en el período': `${a}/timeline?${q}&q=cena&limit=20`,
  'PRJ nutrición: registros por día': `${a}/projections/NUTRITION_PRESCRIBED_VS_RECORDED?${q}&metric=RECORDS`,
  'PRJ nutrición: energía por semana': `${a}/projections/NUTRITION_PRESCRIBED_VS_RECORDED?${q}&metric=ENERGY&grain=WEEK`,
  'PRJ entrenamiento: lista de ejercicios': `${a}/projections/TRAINING_PROGRESSION_BY_EXERCISE?${q}`,
  'PRJ entrenamiento: carga de la serie 1': `${a}/projections/TRAINING_PROGRESSION_BY_EXERCISE?${q}&exerciseId=${ejercicio}&metric=LOAD&setIndex=1&unit=kg`,
  'PRJ antropometría: peso': `${a}/projections/ANTHROPOMETRY_LONGITUDINAL?${q}&metric=peso`,
  'VAN-01 vistas guardadas': `/me/analysis-views`,
};
const resultados = {};
for (const [nombre, ruta] of Object.entries(lecturas)) resultados[nombre] = await medir(nombre, ruta);

// El límite de lecturas protegidas es de 120 por minuto por actor: se espera a que venza la ventana antes de seguir.
await new Promise((r) => setTimeout(r, 61_000));

// El Resumen tal como lo pide la página: una primera ola (lo disponible, el resumen por dominio, las vistas guardadas y
// el período) y una segunda (los cuatro indicadores por defecto), cada una en paralelo.
const ola1 = [
  `${a}/dashboard`,
  `/me/analysis-views`,
  `${a}/projections/NUTRITION_PRESCRIBED_VS_RECORDED?${q}&metric=RECORDS`,
  `${a}/projections/TRAINING_PROGRESSION_BY_EXERCISE?${q}`,
  `${a}/projections/ANTHROPOMETRY_LONGITUDINAL?${q}`,
  `${a}/timeline?${q}&limit=6`,
];
const ola2 = [
  `${a}/projections/NUTRITION_PRESCRIBED_VS_RECORDED?${q}&metric=ENERGY&grain=DAY`,
  `${a}/projections/NUTRITION_PRESCRIBED_VS_RECORDED?${q}&metric=RECORDS&grain=DAY`,
  `${a}/projections/ANTHROPOMETRY_LONGITUDINAL?${q}&metric=peso`,
  `${a}/projections/TRAINING_PROGRESSION_BY_EXERCISE?${q}&exerciseId=${ejercicio}&metric=SETS_RECORDED&grain=ORIGINAL`,
];
const vueltasDelResumen = [];
for (let i = 0; i < N; i++) {
  const t0 = performance.now();
  const r1 = await Promise.all(ola1.map(pedir));
  const r2 = await Promise.all(ola2.map(pedir));
  const malas = [...r1, ...r2].filter((r) => r.status !== 200);
  if (malas.length) throw new Error(`el Resumen tuvo respuestas distintas de 200: ${malas.map((r) => `${r.status} ${r.cuerpo.slice(0, 120)}`).join(' | ')}`);
  vueltasDelResumen.push(performance.now() - t0);
}
const resumen = resumir(vueltasDelResumen);
fila(`Resumen completo (${ola1.length} + ${ola2.length} lecturas)`, resumen);
fs.writeFileSync(enTrabajo(`tiempos-${dias}.json`), JSON.stringify({ dias: Number(dias), desde, vueltas: N, lecturas: resultados, resumen }, null, 2));
