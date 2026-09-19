#!/usr/bin/env node
/**
 * Medición del corte (D5; TEST-RNF-PRI-002) contra una API desplegada. Cada ciclo arma el vínculo completo (solicitud,
 * aceptación, B2 y A3), confirma que el profesional accede, revoca B2 y mide los milisegundos desde que llega la
 * confirmación de la revocación hasta que llega la respuesta de la request siguiente del profesional, que tiene que ser 404.
 *
 * Uso: node scripts/medir-corte-wp03.mjs [baseDeLaApi] [ciclos] [salida.json]
 *
 * - El profesional es DEMO-PN (.env.cuentas-demo, o DEMO_PN_CORREO y DEMO_PN_CLAVE en el ambiente).
 * - Cada ciclo usa un asesorado sintético nuevo. No imprime contraseñas ni tokens.
 * - Lo que no se puede medir desde afuera, porque exige leer la base, lo miden las pruebas de CI: que ninguna decisión
 *   PERMITIDA tenga hora posterior a la revocación, también con lecturas concurrentes.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const [base = 'https://be-api-hndp.onrender.com', ciclosTexto = '10', salida] = process.argv.slice(2);
const API = `${base.replace(/\/+$/, '')}/api/v1`;
const ciclos = Number(ciclosTexto);

const archivo = join(RAIZ, '.env.cuentas-demo');
const env = Object.fromEntries(
  (existsSync(archivo) ? readFileSync(archivo, 'utf8') : '')
    .split('\n')
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
const correoPro = process.env.DEMO_PN_CORREO ?? env.DEMO_PN_CORREO;
const clavePro = process.env.DEMO_PN_CLAVE ?? env.DEMO_PN_CLAVE;
if (!correoPro || !clavePro) throw new Error('Falta DEMO-PN: .env.cuentas-demo o DEMO_PN_CORREO y DEMO_PN_CLAVE');

async function pedir(metodo, ruta, { token, cuerpo, clave } = {}) {
  const h = { Accept: 'application/json', 'X-BE-Surface': 'WEB' };
  if (cuerpo !== undefined) h['Content-Type'] = 'application/json';
  if (token) h.Authorization = `Bearer ${token}`;
  if (clave) h['Idempotency-Key'] = clave;
  const r = await fetch(`${API}${ruta}`, { method: metodo, headers: h, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const texto = await r.text();
  return { status: r.status, cuerpo: texto ? JSON.parse(texto) : null };
}
const clave = () => `medicion-${randomUUID()}`;
async function sesion(correo, contrasena) {
  const r = await pedir('POST', '/auth/sessions', { cuerpo: { method: 'LOCAL', identifier: correo, credential: contrasena } });
  if (r.status !== 201) throw new Error(`login: ${r.status}`);
  const token = r.cuerpo.data.session.accessToken;
  return { token, id: (await pedir('GET', '/me', { token })).cuerpo.data.identityId };
}

for (let i = 0; i < 20; i++) {
  const r = await fetch(`${base.replace(/\/+$/, '')}/health/ready`).catch(() => null);
  if (r?.status === 200) break;
  await new Promise((res) => setTimeout(res, 6000));
}

const pro = await sesion(correoPro, clavePro);
const muestras = [];
for (let i = 0; i < ciclos; i++) {
  const correo = `medicion-corte-${Date.now()}-${i}@example.invalid`;
  const contrasena = `Sint-${randomBytes(9).toString('base64url')}-9a`;
  await pedir('POST', '/registrations', {
    clave: clave(),
    cuerpo: {
      registrationIntent: 'ADVISEE',
      identity: { localIdentifier: correo, localCredential: contrasena },
      termsAcceptance: { versionId: 'terminos-2026-09-demo' },
      privacyAcknowledgement: { versionId: 'privacidad-2026-09-demo' },
    },
  });
  const a = await sesion(correo, contrasena);
  const s = await pedir('POST', '/relationship-requests', {
    token: pro.token,
    clave: clave(),
    cuerpo: { target: { type: 'ADVISEE', identityId: a.id }, scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL' },
  });
  const vinculoId = (await pedir('POST', `/relationship-requests/${s.cuerpo.data.relationshipRequestId}/accept`, { token: a.token, clave: clave(), cuerpo: { expectedVersion: 'v1' } })).cuerpo.data
    .relationshipId;
  const req = await pedir('GET', `/relationships/${vinculoId}/consent-requirements`, { token: a.token });
  const consentId = (await pedir('POST', `/relationships/${vinculoId}/consents`, { token: a.token, clave: clave(), cuerpo: { consentVersionId: req.cuerpo.data.consentVersion.id } })).cuerpo.data.consentId;
  const a3 = await pedir('GET', '/me/health-data-consent-requirement', { token: a.token });
  await pedir('POST', '/me/health-data-consents', { token: a.token, clave: clave(), cuerpo: { consentVersionId: a3.cuerpo.data.consentVersion.id } });

  const antes = await pedir('GET', `/advisees/${a.id}/dashboard`, { token: pro.token });
  const revocada = await pedir('POST', `/me/consents/${consentId}/revoke`, { token: a.token, cuerpo: {} });
  const confirmada = performance.now();
  const despues = await pedir('GET', `/advisees/${a.id}/dashboard`, { token: pro.token });
  const ms = performance.now() - confirmada;
  muestras.push({ ciclo: i + 1, antes: antes.status, revocacion: revocada.status, siguiente: despues.status, ms: Math.round(ms * 10) / 10 });
  process.stdout.write(`ciclo ${i + 1}: antes ${antes.status} · revocación ${revocada.status} · siguiente ${despues.status} · ${Math.round(ms)} ms\n`);
  // El vínculo del ciclo termina: la lista del profesional demo no se llena de vínculos vivos.
  const version = (await pedir('GET', `/relationships/${vinculoId}`, { token: a.token })).cuerpo.data.version;
  await pedir('POST', `/relationships/${vinculoId}/finalize`, { token: a.token, clave: clave(), cuerpo: { expectedVersion: version, reason: 'OBJETIVO_CUMPLIDO' } });
}

const orden = muestras.map((m) => m.ms).sort((x, y) => x - y);
const mediana = orden.length % 2 ? orden[(orden.length - 1) / 2] : (orden[orden.length / 2 - 1] + orden[orden.length / 2]) / 2;
const resumen = {
  prueba: 'medicion-del-corte-en-ambiente',
  api: base,
  momento: new Date().toISOString(),
  ciclos,
  accesoAntesDeRevocar: muestras.filter((m) => m.antes === 200).length,
  permitidasDespuesDeRevocar: muestras.filter((m) => m.siguiente === 200).length,
  medianaMs: mediana,
  p95Ms: orden[Math.ceil(0.95 * orden.length) - 1],
  maximoMs: orden[orden.length - 1],
  muestras,
};
if (salida) writeFileSync(salida, `${JSON.stringify(resumen, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ ...resumen, muestras: undefined })}\n`);
process.exit(resumen.permitidasDespuesDeRevocar === 0 && resumen.accesoAntesDeRevocar === ciclos ? 0 : 1);
