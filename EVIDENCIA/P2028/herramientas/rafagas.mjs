// Reproduce las lecturas concurrentes de la página de un asesorado (nutrición y antropometría) contra la API local.
// Uso: node rafagas.mjs <rondas> <paginasEnParalelo> [solo:clave]. Mide estado y duración de cada pedido y, entre
// rondas, qué hace cada conexión de la base (pg_stat_activity). Datos sintéticos.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');
const E = JSON.parse(fs.readFileSync((process.env.BE_E2E_DIR + '/estado.json'), 'utf8'));
const API = 'http://localhost:3001/api/v1';
const [rondas = '5', paginas = '1', solo = ''] = process.argv.slice(2);
const login = await fetch(API + '/auth/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-BE-Surface': 'WEB' }, body: JSON.stringify({ method: 'LOCAL', identifier: E.proCorreo, credential: 'clave-sintetica-local-e2e-01' }) });
const token = (await login.json()).data.session.accessToken;
const ase = E.aseId, ultima = E.evaluaciones[E.evaluaciones.length - 1].id;
const hoy = new Date().toISOString().slice(0, 10), hace = new Date(Date.now() - 27 * 864e5).toISOString().slice(0, 10);
const PAGINA = {
  'ant-lista': `/advisees/${ase}/anthropometry/evaluations`,
  'ant-toma': `/anthropometry/evaluations/${ultima}`,
  'ant-calculos': `/advisees/${ase}/calculations`,
  'ant-metodos': `/professional-methods`,
  'ant-evolucion': `/advisees/${ase}/anthropometry/progress`,
  'vinculos': `/me/relationships`,
  'nut-evaluaciones': `/advisees/${ase}/nutrition/evaluations`,
  'nut-planes': `/advisees/${ase}/nutrition/plans`,
  'nut-objetivos': `/advisees/${ase}/nutrition/objectives`,
  'nut-efectivo': `/advisees/${ase}/nutrition/objectives/effective`,
  'nut-revision': `/advisees/${ase}/nutrition/review-context?periodStart=${hace}&periodEnd=${hoy}`,
};
const claves = Object.keys(PAGINA).filter((k) => !solo || k === solo);
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
const resultados = [];
for (let r = 0; r < Number(rondas); r++) {
  const pedidos = [];
  for (let p = 0; p < Number(paginas); p++) for (const k of claves) {
    const t0 = performance.now();
    pedidos.push(fetch(API + PAGINA[k], { headers: { Authorization: `Bearer ${token}`, 'X-BE-Surface': 'WEB' }, signal: AbortSignal.timeout(60000) }).then(async (res) => {
      const cuerpo = await res.text();
      resultados.push({ ronda: r, k, status: res.status, ms: Math.round(performance.now() - t0), codigo: res.status >= 400 ? (JSON.parse(cuerpo).error?.code ?? '') : '' });
    }).catch((e) => { resultados.push({ ronda: r, k, status: 0, ms: Math.round(performance.now() - t0), codigo: e.name }); }));
  }
  // A mitad de la ronda, una foto de las conexiones de la base.
  const foto = new Promise((ok) => setTimeout(async () => {
    const filas = await db.$queryRaw`SELECT state, wait_event_type, wait_event, count(*)::int AS n FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid() GROUP BY 1,2,3 ORDER BY 4 DESC`;
    ok(filas);
  }, 150));
  await Promise.all(pedidos);
  const conexiones = await foto;
  console.log(`ronda ${r}: ${JSON.stringify(conexiones)}`);
}
await db.$disconnect();
const porClave = {};
for (const x of resultados) { const g = (porClave[x.k] ??= { n: 0, errores: {}, ms: [] }); g.n++; g.ms.push(x.ms); if (x.status >= 400) g.errores[`${x.status} ${x.codigo}`] = (g.errores[`${x.status} ${x.codigo}`] ?? 0) + 1; }
for (const [k, g] of Object.entries(porClave)) { g.ms.sort((a, b) => a - b); console.log(k.padEnd(18), `n=${g.n}`, `mediana=${g.ms[Math.floor(g.ms.length / 2)]}ms`, `máx=${g.ms[g.ms.length - 1]}ms`, JSON.stringify(g.errores)); }
fs.writeFileSync(new URL(`./resultado-${rondas}x${paginas}${solo ? '-' + solo : ''}.json`, import.meta.url), JSON.stringify(resultados));
