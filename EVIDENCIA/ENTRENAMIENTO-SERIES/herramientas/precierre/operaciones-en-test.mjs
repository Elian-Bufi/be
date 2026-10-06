// Qué operaciones nuevas sirve hoy la API del ambiente `test` (precierre del 2026-10-06, §6): antes de construir una APK
// candidata, comprobar que su API existe en el destino. Solo lecturas GET sin credenciales: no escribe nada ni usa
// ninguna cuenta. Una ruta que existe responde 401 (pide sesión); una que no existe, 404.
//
// Uso: node operaciones-en-test.mjs [https://be-api-hndp.onrender.com] [salida.json]
// La primera respuesta puede tardar alrededor de un minuto: el plan gratuito duerme la API después de 15 minutos.
import fs from 'node:fs';

const BASE = process.argv[2] ?? 'https://be-api-hndp.onrender.com';
const SALIDA = process.argv[3] ?? null;
const ID = '00000000-0000-4000-8000-000000000000';

/** Una lectura de cada operación nueva de #147 y #149, más dos rutas para calibrar la respuesta. */
const SONDAS = [
  { id: 'calibracion: ruta existente (API-ACC-05)', pr: 'main', ruta: '/api/v1/me' },
  { id: 'calibracion: ruta inexistente', pr: '—', ruta: '/api/v1/ruta-que-no-existe' },
  { id: 'API-ING-01', pr: '#147', ruta: '/api/v1/me/nutrition/today/options' },
  { id: 'API-ING-03', pr: '#147', ruta: `/api/v1/nutrition/meal-records/${ID}` },
  { id: 'API-REC-02', pr: '#147', ruta: '/api/v1/nutrition/recipes' },
  { id: 'API-REC-03', pr: '#147', ruta: `/api/v1/nutrition/recipes/${ID}` },
  { id: 'API-MED-03', pr: '#147', ruta: `/api/v1/media/${ID}/access` },
  { id: 'API-SER-01', pr: '#149', ruta: `/api/v1/training/plans/${ID}/detail` },
  { id: 'API-SER-02', pr: '#149', ruta: `/api/v1/training/occurrences/${ID}/session` },
  { id: 'API-TIE-02', pr: '#149', ruta: `/api/v1/training/execution-drafts/${ID}/timing` },
  { id: 'API-TIE-03', pr: '#149', ruta: `/api/v1/training/executions/${ID}/timing` },
  { id: 'API-TIE-04', pr: '#149', ruta: '/api/v1/me/training/session-in-progress' },
  { id: 'API-EJE-01', pr: '#149', ruta: '/api/v1/training/own-exercises' },
];

async function pedir(ruta) {
  const inicio = Date.now();
  try {
    const r = await fetch(`${BASE}${ruta}`, { headers: { Accept: 'application/json', 'X-BE-Surface': 'APK' }, signal: AbortSignal.timeout(120_000) });
    const texto = await r.text();
    let codigo = null;
    try {
      codigo = JSON.parse(texto)?.error?.code ?? null;
    } catch {
      codigo = null;
    }
    return { status: r.status, codigo, ms: Date.now() - inicio, cuerpo: ruta.startsWith('/health') ? texto.slice(0, 400) : undefined };
  } catch (e) {
    return { status: null, codigo: String(e?.name ?? e), ms: Date.now() - inicio };
  }
}

const salud = await pedir('/health/ready');
let commit = null;
try {
  commit = JSON.parse(salud.cuerpo ?? '{}')?.data?.version?.commit ?? null;
} catch {
  commit = null;
}
console.log(`/health/ready: ${salud.status} en ${salud.ms} ms · commit desplegado: ${commit ?? '(no se pudo leer)'}`);
const resultados = [];
for (const s of SONDAS) {
  const r = await pedir(s.ruta);
  const existe = r.status === 401 ? true : r.status === 404 ? false : null;
  resultados.push({ ...s, status: r.status, codigo: r.codigo, existe, ms: r.ms });
  console.log(`${s.pr.padEnd(5)} ${s.id.padEnd(45)} ${String(r.status).padEnd(4)} ${r.codigo ?? ''} → ${existe === true ? 'existe' : existe === false ? 'NO existe' : 'indeterminado'}`);
}
const informe = { base: BASE, consultado: new Date().toISOString(), salud: { status: salud.status, ms: salud.ms, commit }, resultados };
if (SALIDA) fs.writeFileSync(SALIDA, JSON.stringify(informe, null, 2) + '\n');
