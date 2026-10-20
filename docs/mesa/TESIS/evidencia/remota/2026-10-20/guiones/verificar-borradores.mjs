// Verificación REMOTA de los borradores (DL-148) y de la navegación sin conexión (DL-149 D-10) en test, con las
// direcciones HTTPS reales y Chrome o Edge. Usa a la profesional sintética de Nutrición de la cohorte (Sofía), con una
// PERSONA SINTÉTICA NUEVA creada para esta verificación: no toca los planes de la cohorte. Al terminar finaliza ese
// vínculo. Las credenciales se leen del archivo local de la cohorte y no se imprimen.
// Uso: node verificar-borradores.mjs [chrome|edge]
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const requerir = createRequire('C:/Users/bufim/BE-Best-entrenamiento/package.json');
const puppeteer = requerir('puppeteer-core');
const dominio = requerir('C:/Users/bufim/BE-Best-entrenamiento/packages/domain/dist/index.js');
const WEB = 'https://be-web-1ngj.onrender.com';
const API = 'https://be-api-hndp.onrender.com';
const NAVEGADORES = {
  chrome: { nombre: 'Chrome', ruta: 'C:/Program Files/Google/Chrome/Application/chrome.exe' },
  edge: { nombre: 'Edge', ruta: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' },
};
const elegido = NAVEGADORES[process.argv[2] ?? 'chrome'];
const SALIDA = join('C:/Users/bufim/AppData/Local/Temp/claude/C--Users-bufim-BE-Best/5a047096-4cd1-4db9-9da5-fb4a43ad72ef/scratchpad/remoto', `borradores-${new Date().toISOString().replace(/[:.]/g, '-')}`);
mkdirSync(SALIDA, { recursive: true });
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

const env = Object.fromEntries(
  readFileSync('C:/Users/bufim/BE-datos-locales/cohorte-test/cuentas.env', 'utf8')
    .split('\n')
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
const SOFIA = { correo: env.PRO_N_CORREO, clave: env.PRO_N_CLAVE };
if (!SOFIA.correo || !SOFIA.clave) throw new Error('faltan las credenciales de la profesional de Nutrición en cuentas.env');

async function pedir(metodo, ruta, { token, cuerpo, superficie = 'WEB', clave } = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-BE-Surface': superficie, Origin: WEB };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (clave !== false && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(metodo)) headers['Idempotency-Key'] = `verif-${randomUUID()}`;
  const r = await fetch(`${API}/api/v1${ruta}`, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const t = await r.text();
  const json = t ? JSON.parse(t) : null;
  if (r.status >= 400) throw new Error(`${metodo} ${ruta.replace(/[0-9a-f-]{36}/g, ':id')}: ${r.status} ${JSON.stringify(json?.error ?? json).slice(0, 200)}`);
  return json;
}
const sesion = async (cuenta, superficie = 'WEB') => (await pedir('POST', '/auth/sessions', { cuerpo: { method: 'LOCAL', identifier: cuenta.correo, credential: cuenta.clave }, superficie, clave: false })).data.session.accessToken;

// ─── Preparación: la persona sintética nueva, su vínculo con Sofía y un plan en preparación ─────────────────────────
const hoy = new Date().toISOString().slice(0, 10);
const persona = { correo: `verif-qa-${randomUUID().slice(0, 8)}@example.invalid`, clave: `${randomBytes(18).toString('base64url')}Aa1!` };
await pedir('POST', '/registrations', {
  cuerpo: {
    registrationIntent: 'ADVISEE',
    identity: { localIdentifier: persona.correo, localCredential: persona.clave },
    termsAcceptance: { versionId: dominio.VERSION_VIGENTE.TERMINOS.id },
    privacyAcknowledgement: { versionId: dominio.VERSION_VIGENTE.PRIVACIDAD_INFO.id },
    adultDeclaration: { versionId: dominio.VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: true },
  },
});
const tokenPersona = await sesion(persona, 'APK');
const yo = (await pedir('GET', '/me', { token: tokenPersona, superficie: 'APK' })).data;
const personaId = yo.identityId ?? yo.identity?.identityId ?? yo.id;
await pedir('PATCH', '/me/profile', { token: tokenPersona, superficie: 'APK', cuerpo: { expectedVersion: 'v0', changes: { displayName: `Verificación QA ${hoy}` } } });
await pedir('POST', '/me/health-data-consents', { token: tokenPersona, superficie: 'APK', cuerpo: { consentVersionId: dominio.VERSION_VIGENTE.DATOS_SALUD_BE.id } });
const tokenSofia = await sesion(SOFIA);
const solicitud = await pedir('POST', '/relationship-requests', { token: tokenSofia, cuerpo: { target: { type: 'ADVISEE', identityId: personaId }, scope: { code: 'NUTRICION' }, purpose: dominio.FINALIDAD_DE_ALCANCE.NUTRICION } });
const aceptada = await pedir('POST', `/relationship-requests/${solicitud.data.relationshipRequestId}/accept`, { token: tokenPersona, superficie: 'APK', cuerpo: { expectedVersion: solicitud.data.version ?? 'v1' } });
const vinculoId = aceptada.data.relationshipId;
const requisitos = await pedir('GET', `/relationships/${vinculoId}/consent-requirements`, { token: tokenPersona, superficie: 'APK' });
await pedir('POST', `/relationships/${vinculoId}/consents`, { token: tokenPersona, superficie: 'APK', cuerpo: { consentVersionId: requisitos.data.consentVersion.id } });
const alimento = async (q) => (await pedir('POST', '/nutrition/catalog-items/search', { token: tokenSofia, cuerpo: { q, limit: 5 }, clave: false })).data[0].catalogItemId;
const evaluacion = (await pedir('POST', `/advisees/${personaId}/nutrition/evaluations`, { token: tokenSofia, cuerpo: { occurredAt: new Date(Date.now() - 2 * 3600_000).toISOString(), context: 'Verificación QA de borradores en test.', assessment: { entries: [{ concept: 'Comidas por día', value: 4, unit: 'comidas', source: 'REPORTED' }] }, evidenceReferences: [], professionalNotes: 'Datos sintéticos.' } })).data.evaluationId;
const objetivo = (await pedir('POST', `/advisees/${personaId}/nutrition/objectives`, { token: tokenSofia, cuerpo: { evaluationId: evaluacion, effectiveFrom: new Date(Date.now() - 3600_000).toISOString(), effectiveUntil: null, estimatedEnergyRequirement: { value: 2100, unit: 'kcal/day' }, macronutrientDistribution: { protein: { value: 130, unit: 'g/day' }, carbohydrate: { value: 220, unit: 'g/day' }, fat: { value: 65, unit: 'g/day' } }, mealDistribution: 'Cuatro comidas.', rationale: 'Objetivo sintético de verificación.', methodStatement: null } })).data.versionId;
const [avena, arroz] = [await alimento('avena'), await alimento('arroz')];
await pedir('POST', `/advisees/${personaId}/nutrition/plans`, {
  token: tokenSofia,
  cuerpo: {
    objectiveVersionId: objetivo,
    initialStructure: {
      dayTypes: [
        {
          label: 'Día habitual',
          meals: [
            { label: 'Desayuno', prescriptionMode: 'DISH_OPTIONS', options: [{ label: 'Avena', items: [{ catalogItemId: avena, quantity: { value: 50, unit: 'g' }, preparationState: 'RAW' }] }] },
            { label: 'Almuerzo', prescriptionMode: 'DISH_OPTIONS', options: [{ label: 'Arroz', items: [{ catalogItemId: arroz, quantity: { value: 150, unit: 'g' }, preparationState: 'COOKED' }] }] },
          ],
        },
      ],
    },
  },
});
console.log('preparado: persona sintética nueva, vínculo de Nutrición con la profesional de la cohorte y un plan en preparación');

// ─── El navegador ───────────────────────────────────────────────────────────────────────────────────────────────────
const navegador = await puppeteer.launch({ executablePath: elegido.ruta, headless: true, args: ['--lang=es-AR', '--no-first-run', '--disable-gpu', '--disable-extensions', '--disable-background-networking', '--disable-component-update', '--renderer-process-limit=2', '--js-flags=--max-old-space-size=192'] });
const version = await navegador.version();
const resultados = [];
const anotar = (id, ok, detalle = '') => {
  resultados.push({ id, ok, detalle });
  console.log(`${ok ? '✔' : '✖'} [${elegido.nombre}] ${id}${detalle ? ` · ${detalle}` : ''}`);
};
const EDITOR = `${WEB}/pro/advisees/nutrition?id=${encodeURIComponent(personaId)}&vista=plan`;
const estado = (p) => p.evaluate(() => {
  const e = document.querySelector('.editor-del-plan__estado');
  return e ? { tipo: e.dataset.estado, texto: e.textContent.trim() } : null;
});
async function renombrar(p, n, nombre) {
  const comida = `.comida-del-editor[data-comida="${n}"]`;
  await p.waitForSelector(comida, { timeout: 60_000 });
  if (!(await p.$(`${comida}[data-abierta]`))) await p.click(`${comida} .comida-del-plan__boton`);
  await p.waitForSelector(`${comida} .comida-del-editor__acciones .menu-de-acciones__boton`, { timeout: 30_000 });
  await p.click(`${comida} .comida-del-editor__acciones .menu-de-acciones__boton`);
  const accion = await p.waitForFunction((c) => [...document.querySelectorAll(`${c} .menu-de-acciones[data-abierto] .menu-de-acciones__accion`)].find((b) => b.textContent.includes('Cambiar el nombre')) ?? null, { timeout: 30_000, polling: 200 }, comida);
  await accion.asElement().click();
  await p.waitForFunction(() => document.activeElement instanceof HTMLInputElement, { timeout: 30_000, polling: 100 });
  await p.keyboard.down('Control');
  await p.keyboard.press('KeyA');
  await p.keyboard.up('Control');
  await p.keyboard.type(nombre);
  await p.keyboard.press('Enter');
}
const esperarEstado = (p, tipo, conHora = false, timeout = 45_000) =>
  p.waitForFunction((t, h) => {
    const e = document.querySelector('.editor-del-plan__estado');
    return e?.dataset.estado === t && (!h || e.textContent.includes('a las'));
  }, { timeout, polling: 200 }, tipo, conHora);

try {
  const ctx = await navegador.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(`${WEB}/login?volver=${encodeURIComponent(`/pro/advisees/nutrition?id=${personaId}&vista=plan`)}`, { waitUntil: 'networkidle2', timeout: 90_000 });
  await p.waitForFunction(() => { const e = document.querySelector('#correo'); return !!e && Object.keys(e).some((k) => k.startsWith('__reactProps')); }, { timeout: 60_000, polling: 200 });
  await p.type('#correo', SOFIA.correo);
  await p.type('#contrasena', SOFIA.clave);
  await p.click('form button[type="submit"]');
  await p.waitForSelector('.comida-del-editor[data-comida="1"]', { timeout: 90_000 });
  anotar('el editor del borrador abre en test', true);

  // 1. «Pendiente de guardar» mientras no se guardó; «Guardado a las…» solo con la respuesta del servidor.
  await renombrar(p, 1, 'Desayuno de la verificación');
  const antes = await estado(p);
  anotar('recién escrito, dice «Pendiente de guardar» (no «Guardado»)', antes?.tipo === 'pendiente', antes?.texto ?? 'sin estado');
  await esperarEstado(p, 'guardado', true);
  anotar('a los segundos, «Guardado a las…» (respuesta del servidor)', true, (await estado(p))?.texto);
  await p.reload({ waitUntil: 'networkidle2', timeout: 90_000 });
  await p.waitForFunction(() => document.querySelector('.comida-del-editor[data-comida="1"]')?.textContent.includes('Desayuno de la verificación'), { timeout: 60_000, polling: 250 });
  anotar('lo guardado sigue al recargar', true);

  // 2. Un cambio que solo está en memoria: recargar pregunta y, si se sigue, ese texto no vuelve (no se promete recuperarlo).
  await renombrar(p, 2, 'Almuerzo que no se guarda');
  let pregunto = false;
  p.once('dialog', async (d) => {
    pregunto = d.type() === 'beforeunload';
    await d.accept();
  });
  await p.reload({ waitUntil: 'networkidle2', timeout: 90_000 });
  await p.waitForSelector('.comida-del-editor[data-comida="2"]', { timeout: 60_000 });
  const almuerzo = await p.$eval('.comida-del-editor[data-comida="2"]', (e) => e.textContent);
  anotar('con un cambio pendiente, recargar pregunta antes de irse', pregunto, pregunto ? 'aviso beforeunload del navegador' : 'no preguntó');
  anotar('lo que solo estaba en memoria no reaparece (nada se prometió)', !almuerzo.includes('que no se guarda'), almuerzo.slice(0, 60));

  // 3. Dos pestañas: la segunda no pisa a la primera.
  const otra = await ctx.newPage();
  await otra.setViewport({ width: 1440, height: 900 });
  await otra.goto(EDITOR, { waitUntil: 'networkidle2', timeout: 90_000 });
  await otra.waitForSelector('.comida-del-editor[data-comida="1"]', { timeout: 90_000 });
  await p.bringToFront();
  await renombrar(p, 1, 'Desayuno de la pestaña A');
  await esperarEstado(p, 'guardado', true);
  await otra.bringToFront();
  await renombrar(otra, 2, 'Almuerzo de la pestaña B');
  await esperarEstado(otra, 'fallo');
  const enB = await otra.evaluate(() => document.body.innerText);
  anotar('la segunda pestaña dice el conflicto y no pisa', enB.includes(dominio.COPY_GUARDADO.conflictoCorto) && enB.includes('Almuerzo de la pestaña B'));
  const cargar = await otra.waitForFunction((t) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(t)) ?? null, { timeout: 30_000, polling: 200 }, dominio.COPY_GUARDADO.cargarGuardada);
  await cargar.asElement().click();
  await otra.waitForFunction(() => document.querySelector('.comida-del-editor[data-comida="1"]')?.textContent.includes('pestaña A') && !document.querySelector('.comida-del-editor[data-comida="2"]')?.textContent.includes('pestaña B'), { timeout: 60_000, polling: 250 });
  anotar('«Cargar la versión guardada» trae lo de la otra pestaña', true);
  await otra.close();

  // 4. Sin conexión: abrir otra comida no saca de la página; el estado lo dice; al volver, se guarda solo.
  await p.bringToFront();
  await p.setOfflineMode(true);
  await renombrar(p, 2, 'Almuerzo sin conexión');
  await esperarEstado(p, 'fallo');
  await p.click('.comida-del-editor[data-comida="1"] .comida-del-plan__boton').catch(() => {});
  await pausa(1500);
  const sigue = await p.evaluate(() => location.href);
  anotar('sin conexión, abrir otra comida no lleva a la página de error', sigue.startsWith(WEB), sigue.slice(0, 70));
  anotar('sin conexión, el estado dice que no se pudo guardar', (await estado(p))?.tipo === 'fallo', (await estado(p))?.texto);
  await p.setOfflineMode(false);
  await esperarEstado(p, 'guardado', true, 60_000).then(
    () => anotar('al volver la conexión, se guarda solo', true, ''),
    async () => anotar('al volver la conexión, se guarda solo', false, JSON.stringify(await estado(p))),
  );
  await p.screenshot({ path: join(SALIDA, `${elegido.nombre.toLowerCase()}-final.png`) });
  await ctx.close();
} catch (e) {
  anotar('error inesperado', false, e.message.slice(0, 300));
} finally {
  await navegador.close();
}

// ─── Limpieza: el vínculo con la persona de verificación termina ─────────────────────────────────────────────────
try {
  const tokenFin = await sesion(persona, 'APK');
  const vinculos = (await pedir('GET', '/relationships', { token: tokenFin, superficie: 'APK' })).data;
  const v = vinculos.find((x) => x.relationshipId === vinculoId);
  await pedir('POST', `/relationships/${vinculoId}/finalize`, { token: tokenFin, superficie: 'APK', cuerpo: { expectedVersion: v.version, reason: 'OTRO' } });
  console.log('limpieza: vínculo de verificación finalizado');
} catch (e) {
  console.log(`limpieza pendiente: ${e.message}`);
}
writeFileSync(join(SALIDA, 'informe.json'), JSON.stringify({ fecha: new Date().toISOString(), navegador: version, resultados }, null, 2));
const fallas = resultados.filter((r) => !r.ok);
console.log(`\n${version} · ${fallas.length ? `fallas: ${fallas.map((f) => f.id).join('; ')}` : 'todo bien'} · ${SALIDA}`);
