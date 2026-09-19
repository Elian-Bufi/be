#!/usr/bin/env node
/**
 * Guion ejecutable de los casos adversariales de DV-05 que cubre WP-03 (1, 2, 3 en su variante profesional, 4, 5 y 9),
 * contra una API desplegada. Pensado para correrlo en vivo frente al tribunal (docs/paquetes/WP-03.md §6; D-B).
 *
 * Uso: node scripts/adversariales-wp03.mjs [baseDeLaApi] [salida.json]
 *   baseDeLaApi: por defecto https://be-api-hndp.onrender.com (ambiente test)
 *
 * - El profesional es la cuenta demo DEMO-PN (MESA-01 punto 14). Su correo y su contraseña se leen de
 *   .env.cuentas-demo, que git ignora.
 * - Los asesorados se crean en cada corrida por la API pública, con correo @example.invalid y contraseña aleatoria que
 *   no se guarda.
 * - No imprime contraseñas ni tokens. Cada caso dice PASA o FALLA, con lo observado.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const [base = 'https://be-api-hndp.onrender.com', salida] = process.argv.slice(2);
const API = `${base.replace(/\/+$/, '')}/api/v1`;

// DEMO_PN_CORREO y DEMO_PN_CLAVE del ambiente, si están (p. ej. contra una API local), tienen prioridad sobre el archivo.
const archivo = join(RAIZ, '.env.cuentas-demo');
const env = Object.fromEntries(
  (existsSync(archivo) ? readFileSync(archivo, 'utf8') : '')
    .split('\n')
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
env.DEMO_PN_CORREO = process.env.DEMO_PN_CORREO ?? env.DEMO_PN_CORREO;
env.DEMO_PN_CLAVE = process.env.DEMO_PN_CLAVE ?? env.DEMO_PN_CLAVE;
if (!env.DEMO_PN_CORREO || !env.DEMO_PN_CLAVE) throw new Error('Falta DEMO-PN: .env.cuentas-demo o DEMO_PN_CORREO y DEMO_PN_CLAVE');

async function pedir(metodo, ruta, { token, cuerpo, clave, superficie = 'WEB' } = {}) {
  const h = { Accept: 'application/json', 'X-BE-Surface': superficie };
  if (cuerpo !== undefined) h['Content-Type'] = 'application/json';
  if (token) h.Authorization = `Bearer ${token}`;
  if (clave) h['Idempotency-Key'] = clave;
  const inicio = performance.now();
  const r = await fetch(`${API}${ruta}`, { method: metodo, headers: h, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const ms = performance.now() - inicio;
  const texto = await r.text();
  return { status: r.status, cuerpo: texto ? JSON.parse(texto) : null, ms, cabeceras: Object.fromEntries(r.headers) };
}
const clave = () => `adv-${randomUUID()}`;
const mediana = (xs) => {
  const o = [...xs].sort((a, b) => a - b);
  return o.length % 2 ? o[(o.length - 1) / 2] : (o[o.length / 2 - 1] + o[o.length / 2]) / 2;
};

async function sesion(correo, contrasena) {
  const r = await pedir('POST', '/auth/sessions', { cuerpo: { method: 'LOCAL', identifier: correo, credential: contrasena } });
  if (r.status !== 201) throw new Error(`login ${correo}: ${r.status}`);
  const token = r.cuerpo.data.session.accessToken;
  const me = await pedir('GET', '/me', { token });
  return { correo, token, id: me.cuerpo.data.identityId, capacidades: me.cuerpo.data.actorCapabilities };
}

async function asesoradoNuevo(etiqueta) {
  const correo = `adversarial-${etiqueta}-${Date.now()}@example.invalid`;
  const contrasena = `Sint-${randomBytes(9).toString('base64url')}-9a`;
  const alta = await pedir('POST', '/registrations', {
    clave: clave(),
    cuerpo: {
      registrationIntent: 'ADVISEE',
      identity: { localIdentifier: correo, localCredential: contrasena },
      termsAcceptance: { versionId: 'terminos-2026-09-demo' },
      privacyAcknowledgement: { versionId: 'privacidad-2026-09-demo' },
    },
  });
  if (alta.status !== 201) throw new Error(`alta ${etiqueta}: ${alta.status}`);
  return sesion(correo, contrasena);
}

const dashboard = (pro, asesoradoId, superficie) => pedir('GET', `/advisees/${asesoradoId}/dashboard`, { token: pro.token, superficie });

async function vinculoAceptado(pro, ase) {
  const s = await pedir('POST', '/relationship-requests', {
    token: pro.token,
    clave: clave(),
    cuerpo: { target: { type: 'ADVISEE', identityId: ase.id }, scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL' },
  });
  const solicitudId = s.cuerpo.data.relationshipRequestId;
  const a = await pedir('POST', `/relationship-requests/${solicitudId}/accept`, { token: ase.token, clave: clave(), cuerpo: { expectedVersion: 'v1' } });
  return a.cuerpo.data.relationshipId;
}
async function consentir(ase, vinculoId) {
  const req = await pedir('GET', `/relationships/${vinculoId}/consent-requirements`, { token: ase.token });
  const r = await pedir('POST', `/relationships/${vinculoId}/consents`, { token: ase.token, clave: clave(), cuerpo: { consentVersionId: req.cuerpo.data.consentVersion.id } });
  return r.cuerpo.data.consentId;
}
async function otorgarA3(ase) {
  const req = await pedir('GET', '/me/health-data-consent-requirement', { token: ase.token });
  return pedir('POST', '/me/health-data-consents', { token: ase.token, clave: clave(), cuerpo: { consentVersionId: req.cuerpo.data.consentVersion.id } });
}
const version = async (token, vinculoId) => (await pedir('GET', `/relationships/${vinculoId}`, { token })).cuerpo.data.version;

// ─── Despertar la API (el plan gratuito duerme después de 15 minutos) ────────────────────────────
for (let i = 0; i < 20; i++) {
  const r = await fetch(`${base.replace(/\/+$/, '')}/health/ready`).catch(() => null);
  if (r?.status === 200) break;
  await new Promise((res) => setTimeout(res, 6000));
}

const casos = [];
const registrar = (id, titulo, pasa, observado) => {
  casos.push({ caso: id, titulo, resultado: pasa ? 'PASA' : 'FALLA', observado });
  process.stdout.write(`${pasa ? 'PASA ' : 'FALLA'}  ${id} — ${titulo}\n        ${JSON.stringify(observado)}\n`);
};

const pro = await sesion(env.DEMO_PN_CORREO, env.DEMO_PN_CLAVE);
const a = await asesoradoNuevo('a');
const b = await asesoradoNuevo('b');
const vinculoId = await vinculoAceptado(pro, a);
const consentId = await consentir(a, vinculoId);

// ─── 3 (variante profesional): B2 sin A3 no da acceso ────────────────────────────────────────────
{
  const sinA3 = await dashboard(pro, a.id);
  registrar('3', 'vínculo aceptado y B2 otorgado, pero sin A3: el profesional no accede', sinA3.status === 404, { dashboard: sinA3.status, codigo: sinA3.cuerpo?.error?.code });
}
await otorgarA3(a);
const control = await dashboard(pro, a.id);
if (control.status !== 200) throw new Error(`control positivo: el dashboard con B2 y A3 dio ${control.status}`);

// ─── 1: ajeno ≡ inexistente, en código, cuerpo, cabeceras y tiempo ───────────────────────────────
{
  const inventado = randomUUID();
  const tiempos = { ajeno: [], inexistente: [] };
  let ajeno;
  let inexistente;
  for (let i = 0; i < 15; i++) {
    ajeno = await dashboard(pro, b.id);
    inexistente = await dashboard(pro, inventado);
    tiempos.ajeno.push(ajeno.ms);
    tiempos.inexistente.push(inexistente.ms);
  }
  const claves = (c) => Object.keys(c).filter((k) => !['x-request-id', 'date', 'content-length'].includes(k)).sort().join(',');
  const iguales = ajeno.status === 404 && inexistente.status === 404 && JSON.stringify(ajeno.cuerpo) === JSON.stringify(inexistente.cuerpo) && claves(ajeno.cabeceras) === claves(inexistente.cabeceras);
  const diferencia = Math.abs(mediana(tiempos.ajeno) - mediana(tiempos.inexistente));
  registrar('1', 'asesorado ajeno e identificador inventado: 404 idéntico, sin diferencia de tiempo útil', iguales && diferencia < 50, {
    ajeno: ajeno.status,
    inexistente: inexistente.status,
    cuerpo: ajeno.cuerpo,
    medianaAjenoMs: Math.round(mediana(tiempos.ajeno)),
    medianaInexistenteMs: Math.round(mediana(tiempos.inexistente)),
  });
}

// ─── 4: lo que el cliente declara no cambia la decisión ─────────────────────────────────────────
{
  const conCampos = await pedir('POST', '/relationship-requests', {
    token: pro.token,
    clave: clave(),
    cuerpo: { target: { type: 'ADVISEE', identityId: b.id }, scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL', professionalId: pro.id, actorCapabilities: ['ADMIN'] },
  });
  const conQuery = await pedir('GET', `/advisees/${b.id}/dashboard?professionalId=${pro.id}`, { token: pro.token });
  const sinVinculo = await dashboard(pro, b.id);
  const pasa = conCampos.status === 400 && conCampos.cuerpo?.error?.code === 'UNKNOWN_FIELD' && conQuery.status === 400 && sinVinculo.status === 404 && pro.capacidades.includes('PROFESSIONAL_WORKSPACE');
  registrar('4', 'campos y parámetros autoritativos del cliente se rechazan; la capacidad de /me no abre nada', pasa, {
    campos: `${conCampos.status} ${conCampos.cuerpo?.error?.code}`,
    query: `${conQuery.status} ${conQuery.cuerpo?.error?.code}`,
    capacidadesEnMe: pro.capacidades,
    dashboardSinVinculo: sinVinculo.status,
  });
}

// ─── 5: la API directa, sin pantallas, decide igual desde cualquier superficie ──────────────────
{
  const web = await dashboard(pro, b.id, 'WEB');
  const apk = await dashboard(pro, b.id, 'APK');
  registrar('5', 'llamar la API directo (declarando WEB o APK) no saltea al PDP: mismo 404', web.status === 404 && apk.status === 404 && JSON.stringify(web.cuerpo) === JSON.stringify(apk.cuerpo), {
    web: web.status,
    apk: apk.status,
  });
}

// ─── 9: vínculo PAUSADO ─────────────────────────────────────────────────────────────────────────
{
  const pausa = await pedir('POST', `/relationships/${vinculoId}/pause`, { token: a.token, clave: clave(), cuerpo: { expectedVersion: await version(a.token, vinculoId), reason: 'DISPONIBILIDAD' } });
  const duranteLaPausa = await dashboard(pro, a.id);
  const vista = await pedir('GET', `/relationships/${vinculoId}`, { token: a.token });
  const reanuda = await pedir('POST', `/relationships/${vinculoId}/resume`, { token: a.token, clave: clave(), cuerpo: { expectedVersion: await version(a.token, vinculoId) } });
  const despues = await dashboard(pro, a.id);
  registrar('9', 'pausado: el profesional recibe 404; el asesorado ve su vínculo con el acceso bloqueado; al reanudar vuelve', pausa.status === 200 && duranteLaPausa.status === 404 && vista.cuerpo?.data?.accessMode === 'BLOCKED' && reanuda.status === 200 && despues.status === 200, {
    pausa: pausa.status,
    dashboardEnPausa: duranteLaPausa.status,
    vistaDelAsesorado: `${vista.cuerpo?.data?.relationshipState} · ${vista.cuerpo?.data?.accessMode}`,
    reanudacion: reanuda.status,
    dashboardAlReanudar: despues.status,
  });
}

// ─── 2: el corte es inmediato ───────────────────────────────────────────────────────────────────
{
  const antes = await dashboard(pro, a.id);
  const revocada = await pedir('POST', `/me/consents/${consentId}/revoke`, { token: a.token, cuerpo: {} });
  const confirmada = performance.now();
  const despues = await dashboard(pro, a.id);
  const ms = performance.now() - confirmada;
  const vinculo = await pedir('GET', `/relationships/${vinculoId}`, { token: a.token });
  registrar('2', 'revocar B2: la request siguiente del profesional ya es 404; el vínculo sigue ACEPTADO', antes.status === 200 && revocada.status === 200 && despues.status === 404 && vinculo.cuerpo?.data?.relationshipState === 'ACEPTADO', {
    antes: antes.status,
    revocacion: revocada.status,
    revocadoEn: revocada.cuerpo?.data?.revokedAt,
    siguiente: despues.status,
    msHastaLaDenegacion: Math.round(ms),
    vinculoDespues: vinculo.cuerpo?.data?.relationshipState,
  });
}

// El vínculo de la corrida termina; el siguiente arranca de cero.
await pedir('POST', `/relationships/${vinculoId}/finalize`, { token: a.token, clave: clave(), cuerpo: { expectedVersion: await version(a.token, vinculoId), reason: 'OBJETIVO_CUMPLIDO' } });

const resumen = { api: base, momento: new Date().toISOString(), profesional: 'DEMO-PN', casos, todos: casos.every((c) => c.resultado === 'PASA') };
if (salida) writeFileSync(salida, `${JSON.stringify(resumen, null, 2)}\n`);
process.stdout.write(`\n${resumen.todos ? 'Los seis casos pasan.' : 'Hay casos que fallan.'}\n`);
process.exit(resumen.todos ? 0 : 1);
