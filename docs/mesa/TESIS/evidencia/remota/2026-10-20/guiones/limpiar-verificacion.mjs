// Cierra los vínculos de las personas sintéticas «Verificación QA …» que quedaron abiertos con la profesional de
// Nutrición de la cohorte. Solo toca esos vínculos; no imprime credenciales.
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

const API = 'https://be-api-hndp.onrender.com';
const WEB = 'https://be-web-1ngj.onrender.com';
const env = Object.fromEntries(
  readFileSync('C:/Users/bufim/BE-datos-locales/cohorte-test/cuentas.env', 'utf8')
    .split('\n')
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
async function pedir(metodo, ruta, { token, cuerpo } = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-BE-Surface': 'WEB', Origin: WEB };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (metodo === 'POST' && token) headers['Idempotency-Key'] = `limpieza-${randomUUID()}`;
  const r = await fetch(`${API}/api/v1${ruta}`, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const t = await r.text();
  const json = t ? JSON.parse(t) : null;
  if (r.status >= 400) throw new Error(`${metodo} ${ruta.replace(/[0-9a-f-]{36}/g, ':id')}: ${r.status} ${JSON.stringify(json?.error ?? json).slice(0, 200)}`);
  return json;
}
const token = (await pedir('POST', '/auth/sessions', { cuerpo: { method: 'LOCAL', identifier: env.PRO_N_CORREO, credential: env.PRO_N_CLAVE } })).data.session.accessToken;
const todos = [];
let cursor;
do {
  const q = new URLSearchParams(cursor ? { cursor } : {});
  const r = await pedir('GET', `/me/relationships${q.size ? `?${q}` : ''}`, { token });
  todos.push(...r.data);
  cursor = r.page?.nextCursor ?? null;
} while (cursor);
const abiertos = todos.filter((v) => (v.advisee?.displayName ?? '').startsWith('Verificación QA') && v.relationshipState !== 'FINALIZADO');
console.log(`vínculos de la profesional: ${todos.length}; de verificación abiertos: ${abiertos.length}`);
for (const v of abiertos) {
  await pedir('POST', `/relationships/${v.relationshipId}/finalize`, { token, cuerpo: { expectedVersion: v.version, reason: 'OTRO' } });
  console.log(`finalizado: ${v.advisee.displayName} (${v.relationshipState} → FINALIZADO)`);
}
