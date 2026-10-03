// Una lectura por vez: cuántas consultas hace dentro de su transacción, cuánto tarda la base en total y cuánto el
// pedido entero. La diferencia es el tiempo en que la conexión queda tomada esperando a la API ("idle in transaction").
import fs from 'node:fs';
const S = process.env.BE_E2E_DIR + '/';
const E = JSON.parse(fs.readFileSync(S + 'estado.json', 'utf8'));
const API = 'http://localhost:3001/api/v1';
const login = await fetch(API + '/auth/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-BE-Surface': 'WEB' }, body: JSON.stringify({ method: 'LOCAL', identifier: E.proCorreo, credential: 'clave-sintetica-local-e2e-01' }) });
const token = (await login.json()).data.session.accessToken;
const ase = E.aseId, ultima = E.evaluaciones[E.evaluaciones.length - 1].id;
const hoy = new Date().toISOString().slice(0, 10), hace = new Date(Date.now() - 27 * 864e5).toISOString().slice(0, 10);
const PAGINA = {
  'ant-lista': `/advisees/${ase}/anthropometry/evaluations`, 'ant-toma': `/anthropometry/evaluations/${ultima}`, 'ant-calculos': `/advisees/${ase}/calculations`,
  'ant-metodos': `/professional-methods`, 'ant-evolucion': `/advisees/${ase}/anthropometry/progress`, 'vinculos': `/me/relationships`,
  'nut-evaluaciones': `/advisees/${ase}/nutrition/evaluations`, 'nut-planes': `/advisees/${ase}/nutrition/plans`, 'nut-objetivos': `/advisees/${ase}/nutrition/objectives`,
  'nut-efectivo': `/advisees/${ase}/nutrition/objectives/effective`, 'nut-revision': `/advisees/${ase}/nutrition/review-context?periodStart=${hace}&periodEnd=${hoy}`,
};
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const filas = [];
for (const [k, ruta] of Object.entries(PAGINA)) {
  const medidas = [];
  for (let i = 0; i < 3; i++) {
    await pausa(300);
    const t0 = Date.now();
    const r = await fetch(API + ruta, { headers: { Authorization: `Bearer ${token}`, 'X-BE-Surface': 'WEB' } });
    await r.text();
    const t1 = Date.now();
    await pausa(200);
    const lineas = fs.readFileSync(S + 'api.log', 'utf8').split('\n').filter((l) => l.includes('consulta_diag')).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((x) => x && x.t >= t0 && x.t <= t1 + 5);
    medidas.push({ status: r.status, pedidoMs: t1 - t0, consultas: lineas.length, baseMs: lineas.reduce((n, x) => n + x.ms, 0) });
  }
  const m = medidas[2];
  filas.push({ k, ...m });
  console.log(k.padEnd(17), `estado ${m.status}`, `pedido ${String(m.pedidoMs).padStart(4)} ms`, `consultas ${String(m.consultas).padStart(3)}`, `base ${String(m.baseMs).padStart(4)} ms`);
}
fs.writeFileSync(new URL('./consultas-por-lectura.json', import.meta.url), JSON.stringify(filas, null, 1));
