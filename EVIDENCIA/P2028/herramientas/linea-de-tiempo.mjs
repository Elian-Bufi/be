// Línea de tiempo de una lectura: cada consulta con su momento relativo, y cuánto pasa entre la última consulta de
// datos y el COMMIT (trabajo de la API con la conexión tomada). Uso: node linea-de-tiempo.mjs <clave>
import fs from 'node:fs';
const S = process.env.BE_E2E_DIR + '/';
const E = JSON.parse(fs.readFileSync(S + 'estado.json', 'utf8'));
const API = 'http://localhost:3001/api/v1';
const ase = E.aseId, ultima = E.evaluaciones[E.evaluaciones.length - 1].id;
const RUTAS = {
  'ant-evolucion': `/advisees/${ase}/anthropometry/progress`,
  'ant-toma': `/anthropometry/evaluations/${ultima}`,
  'ant-calculos': `/advisees/${ase}/calculations`,
  'ant-lista': `/advisees/${ase}/anthropometry/evaluations`,
  'nut-revision': `/advisees/${ase}/nutrition/review-context?periodStart=${new Date(Date.now() - 27 * 864e5).toISOString().slice(0, 10)}&periodEnd=${new Date().toISOString().slice(0, 10)}`,
};
const clave = process.argv[2];
const login = await fetch(API + '/auth/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-BE-Surface': 'WEB' }, body: JSON.stringify({ method: 'LOCAL', identifier: E.proCorreo, credential: 'clave-sintetica-local-e2e-01' }) });
const token = (await login.json()).data.session.accessToken;
await new Promise((r) => setTimeout(r, 400));
// Tres veces: la primera calienta; se informa la última.
let lineas = [], t0 = 0, t1 = 0;
for (let i = 0; i < 3; i++) {
  await new Promise((r) => setTimeout(r, 300));
  t0 = Date.now();
  const r = await fetch(API + RUTAS[clave], { headers: { Authorization: `Bearer ${token}`, 'X-BE-Surface': 'WEB' } });
  await r.text();
  t1 = Date.now();
  await new Promise((r) => setTimeout(r, 300));
  lineas = fs.readFileSync(S + 'api.log', 'utf8').split('\n').filter((l) => l.includes('consulta_diag')).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((x) => x && x.t >= t0 && x.t <= t1 + 5);
}
const begin = lineas.findIndex((x) => x.q.startsWith('BEGIN'));
const commit = lineas.findIndex((x) => x.q.startsWith('COMMIT'));
const dentro = lineas.slice(begin + 1, commit);
console.log(`${clave}: pedido ${t1 - t0} ms · ${lineas.length} consultas (${dentro.length} dentro de la transacción)`);
console.log(`  transacción abierta ${lineas[commit].t - lineas[begin].t} ms · base dentro ${dentro.reduce((n, x) => n + x.ms, 0)} ms`);
console.log(`  de la última consulta al COMMIT: ${lineas[commit].t - lineas[commit - 1].t} ms · del COMMIT a la respuesta: ${t1 - lineas[commit].t} ms`);
const huecos = dentro.map((x, i) => ({ i, hueco: x.t - (i === 0 ? lineas[begin].t : dentro[i - 1].t), q: x.q.replace(/\s+/g, ' ').slice(0, 60) })).sort((a, b) => b.hueco - a.hueco).slice(0, 4);
for (const h of huecos) console.log(`  hueco antes de la consulta ${h.i + 1}: ${h.hueco} ms · ${h.q}`);
