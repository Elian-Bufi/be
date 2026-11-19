// NUP-15 (WP-NUTRICION-PLANIFICACION) · Las capturas del editor del plan de Nutrición con los números donde se planifica,
// en la CI: esta PC no levanta la API, el website y PostgreSQL juntos. Corre en el trabajo `capturas-de-la-planificacion`
// (.github/workflows/capturas-de-la-planificacion.yml) y deja las imágenes como artefacto. Solo datos sintéticos: la
// cohorte (08 §33), con Lic. Sofía Paz y el plan vigente de Norma Castro, del que se hace una copia en preparación.
//
// Uso:  BE_E2E_DATABASE_URL=postgresql://be_test:be_test@localhost:5432/be_test_cohorte node capturas.mjs <salida>
//   Requiere compilados la API (`npm run build:api`) y el website contra la API local
//   (`BE_API_BASE_URL=http://localhost:3001 npm run build:web`). CHROME apunta al navegador.
//
// Qué captura, en Claro y en Azul noche, a 1280 × 800, a 1536 × 760 (Windows al 125 %: Chrome al 100 % en una pantalla
// de 1920 mide 1536 de ancho) y a 1920 × 950:
// - el asistente: el objetivo con sus kcal y el «%» con su base (el caso real de Dirección: 2.500 kcal con P 112, C 80 y
//   G 335), el error alineado, los rangos indicados en los pasos 3 y 4 con la suma frente al objetivo, y el paso 5 con
//   las cuatro formas de sumar una opción;
// - el editor: la suma arriba de las comidas, las comidas plegadas con lo que aportan, una comida abierta con sus
//   opciones en renglones, una opción abierta con lo que aporta cada alimento, la pista de su composición y la línea
//   frente a los rangos, el cuadro de la opción, la pregunta al tocar afuera con algo cambiado y la comida vacía.
// - WP-NUTRICION-ALIMENTOS (DL-180, escenas 15 a 26): el buscador con los niveles y los íconos, mirar lo de otro
//   profesional antes de sumarlo, la sugerencia del equivalente, crear a mano con el grupo, el alimento retirado en el
//   editor, «Mis alimentos» (corregir y retirar), la imagen de la receta nueva (también desde el plan) y la consola de
//   Administración. Sus datos sintéticos los prepara `prepararLosAlimentos`.
// Cada pantalla es un paso: si uno falla, queda anotado en `capturas.json` con una captura del momento y se sigue.
// No mide peticiones ni compara con oráculos: es para mirar.
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '../../..');
const COHORTE = path.join(REPO, 'EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte');
const TRABAJO = path.join(REPO, 'EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/trabajo-cohorte');
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const OTPAuth = createRequire(path.join(REPO, 'apps/api/'))('otpauth');
const { PrismaClient } = createRequire(path.join(REPO, 'apps/api/'))('@prisma/client');

const salida = path.resolve(process.argv[2] ?? 'capturas-de-la-planificacion');
const API = 'http://localhost:3001';
const WEB = 'http://localhost:3000';
const CHROME = process.env.CHROME ?? (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome');
const TAMANOS = [
  [1280, 800],
  [1536, 760],
  [1920, 950],
];
const TEMAS = ['claro', 'azul-noche'];

/** La base se declara y tiene que ser local y de prueba: la misma guardia que la cohorte (destino.mjs). */
const BASE = process.env.BE_E2E_DATABASE_URL ?? '';
{
  const u = new URL(BASE || 'postgresql://x@nada/nada');
  if (!['localhost', '127.0.0.1'].includes(u.hostname) || !/^\/be_test_[a-z0-9_]+$/.test(u.pathname)) {
    throw new Error('Guardia: BE_E2E_DATABASE_URL tiene que ser una base be_test_* de localhost.');
  }
}
for (const necesario of ['apps/api/dist/main.js', 'apps/web/out/index.html', 'packages/domain/dist/index.js']) {
  if (!fs.existsSync(path.join(REPO, necesario))) throw new Error(`Falta ${necesario}: compilá antes (ver el encabezado).`);
}
fs.mkdirSync(salida, { recursive: true });
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── La API, la cohorte y el website ────────────────────────────────────────────────────────────────────────────

const SECRETO = randomBytes(36).toString('base64url');
const CLAVE_DEL_SEGUNDO_FACTOR = randomBytes(32).toString('base64url');
let registroDeLaApi = [];

async function arrancarApi(demoProfesionales = '') {
  const env = {
    ...process.env,
    APP_ENV: 'development',
    PORT: '3001',
    DATABASE_URL: BASE,
    JWT_SECRET: SECRETO,
    BCRYPT_COST: '10',
    TRUST_PROXY_HOPS: '0',
    CORS_ALLOWED_ORIGINS: WEB,
    BE_DEMO_PROFESIONALES: demoProfesionales,
    BE_CLAVE_DEL_SEGUNDO_FACTOR: CLAVE_DEL_SEGUNDO_FACTOR,
    RATE_LIMIT_REGISTRO_MAX: '50',
    RATE_LIMIT_LOGIN_MAX: '100',
  };
  const proceso = spawn(process.execPath, [path.join(REPO, 'apps/api/dist/main.js')], { cwd: REPO, env, stdio: ['ignore', 'pipe', 'pipe'] });
  const anotar = (b) => {
    registroDeLaApi.push(b.toString());
    if (registroDeLaApi.length > 600) registroDeLaApi = registroDeLaApi.slice(-600);
  };
  proceso.stdout.on('data', anotar);
  proceso.stderr.on('data', anotar);
  for (let i = 0; i < 90; i++) {
    if (proceso.exitCode !== null) break;
    if (await fetch(`${API}/health/ready`).then((r) => r.ok).catch(() => false)) return proceso;
    await pausa(1000);
  }
  process.stderr.write(registroDeLaApi.join('').slice(-4000));
  proceso.kill();
  throw new Error('La API no respondió /health/ready a tiempo.');
}

async function parar(proceso) {
  if (!proceso || proceso.exitCode !== null) return;
  proceso.kill('SIGTERM');
  for (let i = 0; i < 20 && proceso.exitCode === null; i++) await pausa(250);
  if (proceso.exitCode === null) proceso.kill('SIGKILL');
}

const cohorte = (fase) =>
  execFileSync(process.execPath, [path.join(COHORTE, 'cargar.mjs'), 'local', fase], {
    cwd: COHORTE,
    env: { ...process.env, BE_E2E_DATABASE_URL: BASE, BE_API: API },
    stdio: 'inherit',
  });

/** Las cuentas sintéticas que generó la cohorte en esta corrida. Nunca se imprimen ni se suben. */
function cuentas() {
  const texto = fs.readFileSync(path.join(TRABAJO, 'cuentas.env'), 'utf8');
  return Object.fromEntries(
    texto
      .split(/\r?\n/)
      .filter((l) => /^[A-Z0-9_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
  );
}

// ─── Ayudas del navegador ───────────────────────────────────────────────────────────────────────────────────────

async function asentar(page) {
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 30_000 }).catch(() => {});
  await pausa(700);
}

/** Navega dentro de la aplicación, sin recargar: la sesión vive en memoria. */
async function ir(page, ruta) {
  await page.evaluate((u) => window.next.router.push(u), ruta);
  await asentar(page);
}

/** El elemento visible que coincide con el selector (y, si se pide, contiene el texto). */
async function visible(page, selector, texto = null, timeout = 30_000) {
  const h = await page.waitForFunction(
    (s, t) => [...document.querySelectorAll(s)].find((e) => (t === null || e.textContent.includes(t)) && (e.offsetParent !== null || getComputedStyle(e).position === 'fixed')) ?? null,
    { timeout, polling: 150 },
    selector,
    texto,
  );
  return h.asElement();
}

async function clic(page, selector, texto = null) {
  const e = await visible(page, selector, texto);
  await e.evaluate((x) => x.scrollIntoView({ block: 'center' }));
  await pausa(150);
  await e.click();
  await asentar(page);
  return e;
}

/** Escribe en un campo visible, reemplazando lo que tenga. */
async function escribir(page, selector, texto) {
  const e = await visible(page, selector);
  await e.evaluate((x) => x.scrollIntoView({ block: 'center' }));
  await e.click();
  // Todo lo que tenía, seleccionado y borrado (el triple clic dejaba parte del número).
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await e.type(texto);
  return e;
}

async function ponerTema(page, tema) {
  await page.evaluate((t) => {
    document.documentElement.dataset.tema = t;
    try {
      localStorage.setItem('be-apariencia', t);
    } catch {}
  }, tema);
  await pausa(500);
}

async function cerrarCuadros(page) {
  for (let i = 0; i < 4 && (await page.$('dialog[open]')); i++) {
    await page.keyboard.press('Escape');
    await pausa(400);
  }
}

// La compuerta de `/pro` pedía el segundo factor (UF-11); desde DL-177 el profesional entra sin él. Si aparece, se escribe.
const PERIODO_MS = 30_000;
const codigoDelPaso = (secreto, paso) =>
  new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secreto), algorithm: 'SHA1', digits: 6, period: 30 }).generate({ timestamp: paso * PERIODO_MS });

async function entrar(page, prefijo) {
  const c = cuentas();
  await page.goto(`${WEB}/login?volver=${encodeURIComponent('/pro')}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => Object.keys(document.querySelector('#correo') ?? {}).some((k) => k.startsWith('__reactProps')), { timeout: 60_000 });
  await page.type('#correo', c[`${prefijo}_CORREO`]);
  await page.type('#contrasena', c[`${prefijo}_CLAVE`]);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => location.pathname.startsWith('/pro'), { timeout: 60_000 });
  const conCompuerta = await page.waitForSelector('#mfa-codigo', { timeout: 15_000 }).then(() => true).catch(() => false);
  if (conCompuerta) {
    const secreto = c[`${prefijo}_AUTENTICADOR`];
    if (!secreto) throw new Error(`La cohorte no guardó el autenticador de ${prefijo}.`);
    const usado = Number(c[`${prefijo}_ULTIMO_PASO`] ?? -1);
    while (Math.floor(Date.now() / PERIODO_MS) <= usado) await pausa(1000);
    const paso = Math.floor(Date.now() / PERIODO_MS);
    await page.type('#mfa-codigo', codigoDelPaso(secreto, paso));
    await clic(page, 'form button[type="submit"]', 'Confirmar');
    await page.waitForFunction(() => !document.querySelector('#mfa-codigo'), { timeout: 30_000 });
  }
  await asentar(page);
}

/** Indica un rango desde el botón visible número `n` (`[data-indicar-rango]`), con los gramos de cada macro. */
async function indicarRango(page, n, gramos) {
  const botones = await page.$$('[data-indicar-rango]');
  const boton = botones[n];
  if (!boton) throw new Error(`no hay un botón para indicar el rango número ${n + 1}`);
  await boton.evaluate((x) => x.scrollIntoView({ block: 'center' }));
  await boton.click();
  await visible(page, 'dialog[open] .rangos-indicados__tabla');
  for (const [macro, [min, max]] of Object.entries(gramos)) {
    if (min !== null) await escribir(page, `dialog[open] input[aria-label="${macro}, mínimo"]`, String(min));
    if (max !== null) await escribir(page, `dialog[open] input[aria-label="${macro}, máximo"]`, String(max));
  }
  await clic(page, 'dialog[open] [data-principal-del-cuadro]', 'Guardar el rango');
  await page.waitForFunction(() => !document.querySelector('dialog[open] .rangos-indicados__tabla'), { timeout: 30_000 });
  await asentar(page);
}

// ─── WP-NUTRICION-ALIMENTOS (DL-180): los alimentos de las capturas ─────────────────────────────────────────────
//
// Por la API real, con datos sintéticos: los alimentos propios de Lic. Sofía Paz (uno corregido y verificado, uno
// retirado, uno con un equivalente de la tabla oficial), uno de otro profesional (cargado como lo deja la API, con su fila
// de compartido) y una administradora con su autenticador, que revisa. Nada de esto toca otra base que la efímera de la CI.

const ALIMENTOS = {
  ajeno: 'Avena tostada con miel (de otro profesional)',
  propio: 'Avena con cacao casera',
  verificado: 'Barrita de cereal casera',
  retirado: 'Yogur de almendras casero',
  equivalente: 'Arroz blanco casero',
  enElPlan: 'Proteína en polvo (de prueba)',
};
const prepararLos = { token: null, enElPlan: null, ultimoPasoAdmin: -1 };
const composicion = (kcal, p, c, g, f) => ({ referenceAmount: '100g', energyKcal: kcal, proteinG: p, carbohydrateG: c, fatG: g, ...(f === undefined ? {} : { fiberG: f }) });

/** Una llamada a la API con su clave de idempotencia (también en PATCH, que la exige ALI-02). */
async function llamar(metodo, ruta, { token, cuerpo, esperado = [200, 201] } = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-BE-Surface': 'WEB' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (metodo !== 'GET') headers['Idempotency-Key'] = `capturas-${randomBytes(12).toString('hex')}`;
  const r = await fetch(`${API}/api/v1${ruta}`, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const texto = await r.text();
  if (!esperado.includes(r.status)) throw new Error(`${metodo} ${ruta}: ${r.status} ${texto.slice(0, 400)}`);
  return texto ? JSON.parse(texto) : null;
}

async function prepararLosAlimentos() {
  const c = cuentas();
  const { data } = await llamar('POST', '/auth/sessions', { cuerpo: { method: 'LOCAL', identifier: c.PRO_N_CORREO, credential: c.PRO_N_CLAVE } });
  const token = data.session.accessToken;
  prepararLos.token = token;
  const cargar = async (nombre, comp, grupo) => (await llamar('POST', '/nutrition/catalog-items', { token, cuerpo: { name: nombre, itemType: 'FOOD', composition: comp, group: grupo } })).data;
  await cargar(ALIMENTOS.propio, composicion(390, 12, 63, 9, 9), 'GRAINS');
  const barrita = await cargar(ALIMENTOS.verificado, composicion(430, 8, 64, 16, 4), 'GRAINS');
  await llamar('PATCH', `/nutrition/catalog-items/${barrita.catalogItemId}`, { token, cuerpo: { expectedVersion: 'v1', name: ALIMENTOS.verificado, composition: composicion(412, 9, 62, 14, 5), group: 'GRAINS' } });
  const yogur = await cargar(ALIMENTOS.retirado, composicion(70, 2, 8, 3), 'DAIRY');
  await llamar('POST', `/nutrition/catalog-items/${yogur.catalogItemId}/retirement`, { token, cuerpo: { expectedVersion: 'v1' } });
  const arroz = await cargar(ALIMENTOS.equivalente, composicion(131, 2.7, 28, 0.4), 'GRAINS');
  prepararLos.enElPlan = (await cargar(ALIMENTOS.enElPlan, composicion(380, 75, 8, 5), 'DAIRY')).catalogItemId;

  // Lo de otro profesional: como lo deja API-INT-NUT-01 desde DL-180 (el elemento, su versión, su grupo y su fila de
  // compartido), a nombre del profesional de Entrenamiento de la cohorte, que ya existe. La cohorte tiene un solo
  // profesional de Nutrición.
  const prisma = new PrismaClient({ datasources: { db: { url: BASE } } });
  try {
    const [otro] = await prisma.$queryRaw`SELECT "identidad_id"::text AS "id" FROM "metodo_de_acceso" WHERE "referencia" = ${c.PRO_T_CORREO} LIMIT 1`;
    const PROCEDENCIA = { fuente: 'PROPIA', casoDeUso: 'UC-P10', operacion: 'API-INT-NUT-01', carga: 'MANUAL', nota: 'Capturas de WP-NUTRICION-ALIMENTOS (sintético)' };
    const elemento = await prisma.elementoDeCatalogoNutricional.create({ data: { procedencia: 'PROFESSIONAL_MANUAL', creadoPorId: otro.id } });
    await prisma.versionDeElementoNutricional.create({ data: { elementoId: elemento.id, nombre: ALIMENTOS.ajeno, composicion: composicion(402, 10, 66, 11, 7), disponibilidad: 'DISPONIBLE', procedencia: PROCEDENCIA } });
    await prisma.alimentoCompartido.create({ data: { elementoId: elemento.id, procedencia: PROCEDENCIA } });
    await prisma.grupoDeAlimentoAsignado.create({ data: { elementoId: elemento.id, numero: 1, grupo: 'CEREALES', autorId: otro.id, procedencia: PROCEDENCIA } });
  } finally {
    await prisma.$disconnect();
  }

  // La administradora: el alta pública, el comando interno, el autenticador y una sesión con el segundo factor.
  const admin = { correo: `admin.capturas.${Date.now().toString(36)}@example.invalid`, clave: `clave-sintetica-${randomBytes(9).toString('hex')}` };
  const dominio = createRequire(path.join(REPO, 'packages/domain/'))(path.join(REPO, 'packages/domain/dist/index.js'));
  await llamar('POST', '/registrations', {
    cuerpo: {
      registrationIntent: 'ADVISEE',
      identity: { localIdentifier: admin.correo, localCredential: admin.clave },
      profile: { displayName: 'Administración de las capturas' },
      termsAcceptance: { versionId: dominio.VERSION_VIGENTE.TERMINOS.id },
      privacyAcknowledgement: { versionId: dominio.VERSION_VIGENTE.PRIVACIDAD_INFO.id },
      adultDeclaration: { versionId: dominio.VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: true },
    },
  });
  const salida = execFileSync(
    process.execPath,
    [path.join(REPO, 'apps/api/dist/administracion/comando.js'), 'incorporar', '--correo', admin.correo, '--nombre', 'Administración de las capturas', '--fundamento', 'Capturas de WP-NUTRICION-ALIMENTOS, datos sintéticos', '--operador', 'CI de capturas', '--salida', 'json'],
    { cwd: REPO, env: { ...process.env, DATABASE_URL: BASE, APP_ENV: 'development' }, encoding: 'utf8' },
  );
  const { codigoDeIncorporacion } = JSON.parse(salida.trim().split('\n').pop());
  const primera = await llamar('POST', '/admin/auth/sessions', { cuerpo: { identifier: admin.correo, credential: admin.clave } });
  const tokenAdmin = primera.data.session.accessToken;
  const { data: config } = await llamar('POST', '/admin/auth/second-factor/enrollment', { token: tokenAdmin, cuerpo: { incorporationCode: codigoDeIncorporacion } });
  admin.secreto = config.secret;
  const paso = Math.floor(Date.now() / PERIODO_MS);
  prepararLos.ultimoPasoAdmin = paso;
  await llamar('POST', '/admin/auth/second-factor/enrollment/confirm', { token: tokenAdmin, cuerpo: { code: codigoDelPaso(admin.secreto, paso) } });
  // Lo que decide: la barrita (versión 2) verificada con una fuente; el arroz casero, equivalente del de la tabla oficial.
  await llamar('POST', `/admin/foods/${barrita.catalogItemId}/decisions`, { token: tokenAdmin, cuerpo: { expectedVersion: 'v2', decision: 'CERTIFY', source: 'Rótulo del envase, lote sintético de las capturas' } });
  const { data: oficiales } = await llamar('POST', '/admin/foods/verified/query', { token: tokenAdmin, cuerpo: { q: 'arroz blanco de grano largo cocido' } });
  const oficial = oficiales.find((v) => v.name === 'Arroz blanco de grano largo, cocido') ?? oficiales[0];
  await llamar('POST', `/admin/foods/${arroz.catalogItemId}/decisions`, { token: tokenAdmin, cuerpo: { expectedVersion: 'v1', decision: 'EQUIVALENT', equivalentCatalogItemId: oficial.catalogItemId } });
  return admin;
}

/**
 * NUA-02, escena 19: la proteína en polvo de prueba entra en la opción 1 del almuerzo del borrador de Norma (por la API,
 * contra su versión) y después se retira. El editor la tiene que seguir mostrando, con la marca.
 */
async function ponerEnElBorradorYRetirar(norma) {
  const token = prepararLos.token;
  const { data: planes } = await llamar('GET', `/advisees/${norma}/nutrition/plans`, { token });
  const borrador = planes.find((p) => p.state === 'DRAFT');
  if (!borrador) throw new Error('Norma no tiene un borrador');
  const { data: plan } = await llamar('GET', `/nutrition/plans/${borrador.planId}`, { token });
  const changes = {
    dayTypes: plan.dayTypes.map((d) => ({
      dayTypeId: d.dayTypeId,
      label: d.label,
      meals: d.meals.map((m) => ({
        mealId: m.mealId,
        label: m.label,
        prescriptionMode: m.prescriptionMode,
        options: m.options.map((o) =>
          o.recipe
            ? { optionId: o.optionId, label: o.label, items: [], recipeVersionId: o.recipe.recipeVersionId }
            : { optionId: o.optionId, label: o.label, items: o.items.map((it) => ({ itemId: it.itemId, catalogItemId: it.catalogItemId, quantity: it.quantity, preparationState: it.preparationState, note: it.note })) },
        ),
      })),
    })),
  };
  const almuerzo = changes.dayTypes[0].meals[1];
  const opcion = almuerzo.options.find((o) => !o.recipeVersionId) ?? almuerzo.options[0];
  opcion.items.push({ catalogItemId: prepararLos.enElPlan, quantity: { value: 30, unit: 'g' }, preparationState: 'AS_PURCHASED', note: null });
  await llamar('PATCH', `/nutrition/plans/${borrador.planId}`, { token, cuerpo: { expectedVersion: plan.version, changes } });
  await llamar('POST', `/nutrition/catalog-items/${prepararLos.enElPlan}/retirement`, { token, cuerpo: { expectedVersion: 'v1' } });
}

/** NUA-04: la consola de Administración, en otro contexto del navegador (otra sesión, otro almacenamiento). */
async function capturarAdministracion(navegador, admin, resultado) {
  const contexto = await navegador.createBrowserContext();
  const page = await contexto.newPage();
  await page.emulateTimezone('America/Argentina/Buenos_Aires');
  page.on('pageerror', (e) => resultado.errores.push(String(e).slice(0, 300)));
  const escenas = [
    {
      nombre: '25-administracion-alimentos',
      entera: true,
      llegar: async () => {
        await page.goto(`${WEB}/admin/foods`, { waitUntil: 'networkidle0' });
        await page.waitForSelector('#adm-correo', { timeout: 60_000 });
        await page.waitForFunction(() => Object.keys(document.querySelector('#adm-correo') ?? {}).some((k) => k.startsWith('__reactProps')), { timeout: 60_000 });
        await page.type('#adm-correo', admin.correo);
        await page.type('#adm-contrasena', admin.clave);
        await page.keyboard.press('Enter');
        await page.waitForSelector('#adm-codigo', { timeout: 30_000 });
        while (Math.floor(Date.now() / PERIODO_MS) <= prepararLos.ultimoPasoAdmin) await pausa(1000);
        await page.type('#adm-codigo', codigoDelPaso(admin.secreto, Math.floor(Date.now() / PERIODO_MS)));
        await page.keyboard.press('Enter');
        await visible(page, '[data-alimento-para-revisar]', null, 60_000);
        await asentar(page);
      },
    },
    {
      nombre: '26-administracion-revisar',
      llegar: async () => {
        await clic(page, '[data-alimento-para-revisar] [data-revisar]');
        await visible(page, '[data-decidir-sobre-alimento]');
        await page.$eval('[data-decidir-sobre-alimento]', (e) => e.scrollIntoView({ block: 'center' }));
      },
    },
  ];
  for (const p of escenas) {
    const fila = { pantalla: p.nombre, ok: true, notas: [], medidas: {} };
    try {
      await page.setViewport({ width: 1536, height: 760, deviceScaleFactor: 1 });
      await p.llegar();
      for (const tema of TEMAS) {
        await ponerTema(page, tema);
        for (const [ancho, alto] of TAMANOS) {
          await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
          await pausa(700);
          await page.screenshot({ path: path.join(salida, `${p.nombre}-${tema}-${ancho}.png`) });
          fila.medidas[`${tema}-${ancho}`] = await medir(page);
          if (p.entera && fila.medidas[`${tema}-${ancho}`].alto > alto + 40) {
            await page.setViewport({ width: ancho, height: Math.min(fila.medidas[`${tema}-${ancho}`].alto, 9000), deviceScaleFactor: 1 });
            await pausa(700);
            await page.screenshot({ path: path.join(salida, `${p.nombre}-${tema}-${ancho}-entera.png`) });
          }
        }
      }
    } catch (e) {
      fila.ok = false;
      fila.error = String(e?.message ?? e).slice(0, 500);
      await page.screenshot({ path: path.join(salida, `${p.nombre}-FALLO.png`) }).catch(() => {});
    }
    resultado.pantallas.push(fila);
    console.log(`${p.nombre}: ${fila.ok ? 'bien' : `FALLÓ (${fila.error})`}`);
  }
  await contexto.close();
}

// ─── Las pantallas ──────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Cada pantalla: su nombre, cómo se llega (desde donde dejó la anterior), si se guarda también la página entera, y
 * `reponer`: lo que hay que volver a hacer antes de cada captura (la pista se cierra al cambiar el tamaño de la ventana).
 */
function pantallas(norma) {
  const nutricion = (extra = '') => `/pro/advisees/nutrition?id=${norma}&vista=plan${extra}`;
  const comida = (n) => `.comida-del-editor[data-comida="${n}"]`;
  const abrirComida = async (page, n) => {
    if (!(await page.$(`${comida(n)}[data-abierta]`))) await clic(page, `${comida(n)} .comida-del-plan__boton`);
    await page.waitForSelector(`${comida(n)}[data-abierta]`, { timeout: 15_000 });
  };
  const abrirOpcion1 = async (page) => {
    const boton = `${comida(2)} [data-opcion-plegable="1"] .opcion-plegable__boton`;
    if (await page.$(`${boton}[aria-expanded="false"]`)) await clic(page, boton);
  };
  return [
    {
      nombre: '01-asistente-objetivo-kcal-y-porcentaje',
      entera: true,
      llegar: async (page) => {
        await ir(page, nutricion('&asistente=1'));
        await clic(page, '[data-punto-de-partida="vigente"]');
        await clic(page, '[data-asistente-principal]');
        await visible(page, '[data-asistente="2"]');
        await clic(page, '[data-objetivo-nuevo]');
        await visible(page, '#objetivo-kcal');
        // El caso real de Dirección: 2.500 kcal con P 112, C 80 y G 335 (unas 3.780 kcal).
        await escribir(page, '#objetivo-kcal', '2500');
        await escribir(page, '#objetivo-proteina', '112');
        await escribir(page, '#objetivo-carbohidratos', '80');
        await escribir(page, '#objetivo-grasas', '335');
        await (await visible(page, '[data-kcal-del-objetivo]')).evaluate((x) => x.scrollIntoView({ block: 'center' }));
        await pausa(400);
      },
    },
    {
      nombre: '02-asistente-objetivo-error-alineado',
      llegar: async (page) => {
        // Un error en Proteínas, al enviar: los tres campos siguen a la misma altura.
        await escribir(page, '#objetivo-proteina', 'abc');
        await clic(page, 'form.formulario button[type="submit"]');
        await (await visible(page, '#objetivo-proteina')).evaluate((x) => x.scrollIntoView({ block: 'center' }));
        await pausa(400);
        const alturas = await page.$$eval(['#objetivo-proteina', '#objetivo-carbohidratos', '#objetivo-grasas'].join(','), (xs) => xs.map((x) => Math.round(x.getBoundingClientRect().top)));
        return { alturasDeLosCampos: alturas };
      },
      despues: async (page) => {
        await clic(page, 'form.formulario button', 'Cancelar').catch(() => {});
      },
    },
    {
      nombre: '03-asistente-paso-3-rango-del-dia',
      entera: true,
      llegar: async (page) => {
        await ir(page, nutricion('&asistente=3'));
        await visible(page, '[data-asistente="3"]');
        await indicarRango(page, 0, { Proteínas: [70, 100], Carbohidratos: [180, 260], Grasas: [45, 70] });
      },
    },
    {
      nombre: '04-asistente-paso-4-rangos-y-suma',
      entera: true,
      llegar: async (page, nota) => {
        await ir(page, nutricion('&asistente=4'));
        await visible(page, '[data-asistente="4"]');
        const rangos = [
          { Proteínas: [15, 25], Carbohidratos: [30, 50], Grasas: [5, 15] },
          { Proteínas: [30, 40], Carbohidratos: [40, 70], Grasas: [10, 20] },
          { Proteínas: [8, 15], Carbohidratos: [20, 40], Grasas: [3, 10] },
          { Proteínas: [25, 35], Carbohidratos: [30, 60], Grasas: [8, null] },
        ];
        // La colación queda sin rango: la suma lo dice («sin tope»).
        for (const [n, r] of rangos.entries()) await indicarRango(page, n, r).catch((e) => nota(`rango ${n + 1}: ${String(e.message ?? e).slice(0, 120)}`));
        await (await visible(page, '[data-suma-de-los-rangos]')).evaluate((x) => x.scrollIntoView({ block: 'start' }));
        await pausa(400);
      },
    },
    {
      nombre: '05-asistente-paso-5-formas-de-sumar',
      entera: true,
      llegar: async (page) => {
        await ir(page, nutricion('&asistente=5'));
        await visible(page, '[data-asistente-formas-de-sumar]');
      },
    },
    {
      nombre: '06-editor-suma-y-comidas-plegadas',
      // Entera: a 1280 la tabla de la suma queda debajo del objetivo, y es la que se mira (el número pegado a su unidad).
      entera: true,
      llegar: async (page) => {
        await ir(page, nutricion());
        await visible(page, '[data-suma-de-los-rangos]');
        await visible(page, '[data-aporta-la-comida]');
      },
    },
    {
      nombre: '07-editor-comida-abierta-opciones-plegadas',
      llegar: async (page) => {
        // El almuerzo de Norma tiene tres opciones: plegadas, cada una con sus números.
        await abrirComida(page, 2);
        // Subirlo y bajarlo no le abre ninguna opción: vuelve a su lugar con las tres plegadas (NUP-D04; baja de la
        // revisión adversaria: quedaba abierta la primera).
        await clic(page, `${comida(2)} .comida-del-editor__acciones button`, 'Subir');
        await clic(page, `${comida(1)} .comida-del-editor__acciones [data-bajar]`);
        await page.waitForSelector(`${comida(2)}[data-abierta]`, { timeout: 15_000 });
        await page.$eval(comida(2), (e) => e.scrollIntoView({ block: 'start' }));
        await pausa(400);
        return {
          nombreDeLaComida2: await page.$eval(`${comida(2)} .comida-del-plan__nombre`, (e) => e.textContent),
          opcionesAbiertasTrasMoverla: await page.$$eval(`${comida(2)} .opcion-plegable__boton[aria-expanded="true"]`, (xs) => xs.length),
        };
      },
    },
    {
      nombre: '08-editor-opcion-abierta-aporte-y-rango',
      llegar: async (page) => {
        await clic(page, `${comida(2)} [data-opcion-plegable="1"] .opcion-plegable__boton`);
        await visible(page, `${comida(2)} [data-aporte-del-item]`);
        await page.$eval(`${comida(2)} [data-opcion-plegable="1"]`, (e) => e.scrollIntoView({ block: 'start' }));
        await pausa(400);
      },
    },
    {
      nombre: '09-editor-pista-de-la-composicion',
      llegar: async (page) => {
        await page.$eval(`${comida(2)} .item-del-editor__cantidad`, (e) => e.scrollIntoView({ block: 'center' }));
      },
      // La pista se cierra al cambiar el tamaño de la ventana: se vuelve a enfocar la cantidad antes de cada captura.
      reponer: async (page) => {
        await page.$eval(`${comida(2)} .item-del-editor__cantidad`, (e) => {
          e.blur();
          e.scrollIntoView({ block: 'center' });
        });
        await pausa(200);
        await page.focus(`${comida(2)} .item-del-editor__cantidad`);
        await pausa(400);
      },
    },
    {
      nombre: '10-editor-cantidad-en-vivo',
      llegar: async (page) => {
        // Se cambian los gramos: la fila, el total y la línea frente al rango cambian mientras se escribe.
        await escribir(page, `${comida(2)} .item-del-editor__cantidad`, '260');
        await page.$eval(`${comida(2)} [data-opcion-plegable="1"]`, (e) => e.scrollIntoView({ block: 'start' }));
        await page.evaluate(() => document.activeElement?.blur());
        await pausa(400);
      },
    },
    {
      nombre: '11-cuadro-de-la-opcion',
      llegar: async (page) => {
        await clic(page, `${comida(2)} [data-agregar-item]`);
        await visible(page, 'dialog[open] .cuadro-de-la-opcion__cuerpo');
        await asentar(page);
      },
    },
    {
      nombre: '12-cuadro-tocar-afuera-pregunta',
      llegar: async (page) => {
        // Algo cambiado en el cuadro y un toque en el fondo: pregunta antes de cerrar.
        await escribir(page, '#opcion-en-un-cuadro-nombre', 'Merluza con puré, sin sal');
        await page.mouse.click(6, 6);
        await visible(page, 'dialog[open] .cuadro-enfocado__pregunta');
      },
      despues: cerrarCuadros,
    },
    {
      nombre: '13-editor-comida-vacia',
      llegar: async (page) => {
        await clic(page, '#agregar-comida', 'Agregar comida');
        await clic(page, '.menu-de-acciones[data-abierto] .menu-de-acciones__accion', 'Una comida vacía');
        const e = await visible(page, '[data-empeza-con]');
        await e.evaluate((x) => x.scrollIntoView({ block: 'center' }));
        await page.evaluate(() => document.activeElement?.blur());
        await pausa(400);
      },
    },
    {
      nombre: '14-cuadro-de-una-opcion-vacia',
      llegar: async (page) => {
        // «alimentos» abre la opción 1, vacía, de la comida nueva en su cuadro: frente a los rangos va una sola indicación
        // neutra, no una línea «sin dato» por macro (baja de la revisión adversaria).
        await clic(page, '[data-empeza-con] button', 'alimentos');
        await visible(page, 'dialog[open] .cuadro-de-la-opcion__cuerpo');
        await asentar(page);
        return { frenteEnElCuadro: await page.$eval('dialog[open] [data-frente-en-el-cuadro]', (x) => x.innerText).catch(() => null) };
      },
      reponer: async (page) => {
        await page.$eval('dialog[open] [data-frente-en-el-cuadro]', (x) => x.scrollIntoView({ block: 'center' })).catch(() => {});
        await pausa(300);
      },
      despues: cerrarCuadros,
    },
    // ─── WP-NUTRICION-ALIMENTOS (DL-180): las escenas del segundo tramo ───────────────────────────────────────────
    {
      nombre: '15-buscador-niveles-e-iconos',
      llegar: async (page) => {
        // NUA-03 y NUA-05: «avena» trae la tabla oficial («Verificado»), lo propio («Tuyo»), lo de demostración y, después
        // dentro de su grupo, lo de otro profesional; cada fila con el ícono de su grupo.
        await ir(page, nutricion());
        await abrirComida(page, 2);
        await abrirOpcion1(page);
        await clic(page, `${comida(2)} [data-agregar-item]`);
        await visible(page, 'dialog[open] .cuadro-de-la-opcion__cuerpo');
        await escribir(page, 'dialog[open] .buscador-de-la-opcion__campo input', 'avena');
        await visible(page, 'dialog[open] [data-nivel="OTHER_PROFESSIONAL"]', null, 20_000);
        await page.$eval('dialog[open] .buscador-de-la-opcion__lista', (e) => e.scrollIntoView({ block: 'center' }));
        return { niveles: await page.$$eval('dialog[open] .buscador-de-la-opcion__resultado', (xs) => xs.map((x) => `${x.querySelector('strong')?.textContent} · ${x.querySelector('[data-nivel]')?.textContent ?? '—'} · ${x.querySelector('[data-grupo]')?.getAttribute('data-grupo')}`)) };
      },
    },
    {
      nombre: '16-mirar-antes-de-sumar',
      llegar: async (page) => {
        // NUA-03: lo de otro profesional se mira antes de sumarlo.
        await clic(page, 'dialog[open] .buscador-de-la-opcion__resultado .buscador-de-la-opcion__alimento', ALIMENTOS.ajeno);
        await visible(page, 'dialog[open] [data-mirar-antes-de-sumar]');
        await page.$eval('dialog[open] [data-mirar-antes-de-sumar]', (e) => e.scrollIntoView({ block: 'center' }));
      },
    },
    {
      nombre: '17-sugerencia-del-equivalente',
      llegar: async (page) => {
        // NUA-04: el verificado que Administración marcó como equivalente va justo antes, como sugerencia.
        await clic(page, 'dialog[open] [data-mirar-antes-de-sumar] button', 'Volver a buscar');
        await escribir(page, 'dialog[open] .buscador-de-la-opcion__campo input', 'arroz blanco');
        await visible(page, 'dialog[open] [data-sugerido-por]', null, 20_000);
        await page.$eval('dialog[open] .buscador-de-la-opcion__lista', (e) => e.scrollIntoView({ block: 'center' }));
      },
      despues: cerrarCuadros,
    },
    {
      nombre: '18-crear-a-mano-con-grupo',
      llegar: async (page) => {
        // NUA-05 y NUA-D05: crear a mano pide el grupo y avisa que lo ven los demás profesionales.
        await abrirOpcion1(page);
        await clic(page, `${comida(2)} [data-agregar-item]`);
        await visible(page, 'dialog[open] .cuadro-de-la-opcion__cuerpo');
        await clic(page, 'dialog[open] .cuadro-de-la-opcion__otro button', 'Crearlo a mano');
        await visible(page, 'dialog[open] [data-aviso-de-compartir]');
        await escribir(page, '#opcion-crear-a-mano-nombre', 'Galletitas de arroz caseras');
        await page.select('#opcion-crear-a-mano-grupo', 'GRAINS');
        await page.$eval('dialog[open] [data-aviso-de-compartir]', (e) => e.scrollIntoView({ block: 'center' }));
      },
      despues: cerrarCuadros,
    },
    {
      nombre: '19-editor-alimento-retirado',
      llegar: async (page) => {
        // NUA-02: el alimento que se retiró después de citarlo sigue en la fila, con la marca discreta.
        // Antes, que el editor guarde lo que tenga pendiente; después, se monta de nuevo para leer el borrador.
        await asentar(page);
        await ir(page, '/pro');
        await ponerEnElBorradorYRetirar(norma);
        await ir(page, nutricion());
        await abrirComida(page, 2);
        await abrirOpcion1(page);
        const fila = await visible(page, `${comida(2)} [data-marca-retirado]`, null, 20_000);
        await fila.evaluate((x) => x.scrollIntoView({ block: 'center' }));
        await page.evaluate(() => document.activeElement?.blur());
        await pausa(400);
      },
    },
    {
      nombre: '20-mis-alimentos',
      entera: true,
      llegar: async (page) => {
        // NUA-01 y NUA-02: los propios, corregidos (versión 2, verificado), retirados y sin compartir.
        await ir(page, '/pro/foods');
        await visible(page, '[data-alimento-propio]');
      },
    },
    {
      nombre: '21-mis-alimentos-corregir',
      llegar: async (page) => {
        await clic(page, '[data-alimento-propio] [data-corregir]');
        await visible(page, 'dialog[open] [data-aviso-de-compartir]');
      },
      despues: cerrarCuadros,
    },
    {
      nombre: '22-mis-alimentos-retirar',
      llegar: async (page) => {
        await clic(page, '[data-alimento-propio]:not([data-retirado]) [data-retirar]');
        await visible(page, 'dialog[open]');
      },
      despues: cerrarCuadros,
    },
    {
      nombre: '23-receta-nueva-con-imagen',
      entera: true,
      llegar: async (page) => {
        // NUA-06: la imagen se elige al crear la receta.
        await ir(page, '/pro/recipes?nueva=1');
        await visible(page, 'section[aria-label="Imagen de referencia"]');
      },
    },
    {
      nombre: '24-receta-nueva-desde-el-plan',
      llegar: async (page) => {
        // NUA-06: «Receta nueva» desde una comida del plan, con la imagen en el formulario.
        await ir(page, nutricion());
        await abrirComida(page, 2);
        await clic(page, `${comida(2)} [data-opcion-de-receta]`);
        await clic(page, '[data-receta-nueva]');
        const seccion = await visible(page, 'dialog[open] section[aria-label="Imagen de referencia"]', null, 20_000);
        await seccion.evaluate((x) => x.scrollIntoView({ block: 'center' }));
      },
      despues: cerrarCuadros,
    },
  ];
}

const medir = (page) =>
  page.evaluate(() => {
    const ancho = document.documentElement.clientWidth;
    const desbordan = [...document.querySelectorAll('body *')]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.right > ancho + 1 && getComputedStyle(e).position !== 'fixed';
      })
      .slice(0, 6)
      .map((e) => `${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? `.${e.className.trim().split(/\s+/).join('.')}` : ''}`);
    return {
      desbordeHorizontal: document.documentElement.scrollWidth - ancho,
      desbordan,
      alto: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
      suma: [...document.querySelectorAll('[data-fila-de-la-suma]')].map((f) => f.innerText.replace(/\s+/g, ' ').trim()),
      // La tabla de la suma no se corre de costado dentro de su caja (la suma y el objetivo no se cortan: la ubicación se
      // acomoda), y cada cifra queda en un renglón.
      sumaDesbordaSuCaja: [...document.querySelectorAll('[data-suma-de-los-rangos] .desplazable-x')].map((d) => d.scrollWidth - d.clientWidth),
      cifrasEnMasDeUnRenglon: [...document.querySelectorAll('.suma-de-los-rangos__cifra')]
        .filter((c) => {
          if (c.offsetParent === null) return false;
          const r = document.createRange();
          r.selectNodeContents(c);
          return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size > 1;
        })
        .map((c) => c.innerText),
      kcalDelObjetivo: document.querySelector('[data-kcal-del-objetivo]')?.innerText ?? null,
      pista: [...document.querySelectorAll('.pista__globo:not([hidden])')].map((p) => p.innerText),
    };
  });

async function capturarTodo(admin) {
  const estado = JSON.parse(fs.readFileSync(path.join(TRABAJO, 'estado.json'), 'utf8'));
  const norma = estado.personas?.norma?.aseId;
  if (!norma) throw new Error('La cohorte no dejó a Norma en estado.json.');
  const resultado = { hoy: estado.hoy, commit: process.env.GITHUB_SHA ?? null, pantallas: [], errores: [] };
  const navegador = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--lang=es-AR', '--force-color-profile=srgb'],
    defaultViewport: { width: 1536, height: 760, deviceScaleFactor: 1 },
  });
  try {
    const contexto = await navegador.createBrowserContext();
    const page = await contexto.newPage();
    await page.emulateTimezone('America/Argentina/Buenos_Aires');
    page.on('pageerror', (e) => resultado.errores.push(String(e).slice(0, 300)));
    await entrar(page, 'PRO_N');
    for (const p of pantallas(norma)) {
      const fila = { pantalla: p.nombre, ok: true, notas: [], medidas: {} };
      const nota = (t) => fila.notas.push(t);
      try {
        await page.setViewport({ width: 1536, height: 760, deviceScaleFactor: 1 });
        const extra = await p.llegar(page, nota);
        if (extra) fila.extra = extra;
        for (const tema of TEMAS) {
          await ponerTema(page, tema);
          for (const [ancho, alto] of TAMANOS) {
            await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
            await pausa(700);
            if (p.reponer) await p.reponer(page);
            await page.screenshot({ path: path.join(salida, `${p.nombre}-${tema}-${ancho}.png`) });
            fila.medidas[`${tema}-${ancho}`] = await medir(page);
            if (p.entera) {
              const total = fila.medidas[`${tema}-${ancho}`].alto;
              if (total > alto + 40) {
                await page.setViewport({ width: ancho, height: Math.min(total, 9000), deviceScaleFactor: 1 });
                await pausa(700);
                await page.screenshot({ path: path.join(salida, `${p.nombre}-${tema}-${ancho}-entera.png`) });
                await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
              }
            }
          }
        }
      } catch (e) {
        fila.ok = false;
        fila.error = String(e?.message ?? e).slice(0, 500);
        await page.screenshot({ path: path.join(salida, `${p.nombre}-FALLO.png`) }).catch(() => {});
      }
      if (p.despues) await p.despues(page).catch(() => {});
      resultado.pantallas.push(fila);
      console.log(`${p.nombre}: ${fila.ok ? 'bien' : `FALLÓ (${fila.error})`}${fila.notas.length ? ` · ${fila.notas.join(' · ')}` : ''}`);
    }
    await contexto.close();
    if (admin) await capturarAdministracion(navegador, admin, resultado);
    else resultado.errores.push('sin la administradora: no se capturó la consola');
  } finally {
    fs.writeFileSync(path.join(salida, 'capturas.json'), `${JSON.stringify(resultado, null, 2)}\n`);
    await navegador.close();
  }
  return resultado;
}

// ─── La corrida ─────────────────────────────────────────────────────────────────────────────────────────────────

console.log('migraciones…');
execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'migrate', 'deploy'], {
  cwd: REPO,
  env: { ...process.env, DATABASE_URL: BASE },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
let api = await arrancarApi();
let web = null;
try {
  console.log('la cohorte: profesionales…');
  cohorte('profesionales');
  const demo = /BE_DEMO_PROFESIONALES=(.*)/.exec(fs.readFileSync(path.join(TRABAJO, 'demo-profesionales.txt'), 'utf8'))[1].trim();
  await parar(api);
  api = await arrancarApi(demo);
  console.log('la cohorte: ejercicios y personas…');
  cohorte('ejercicios');
  cohorte('personas');
  cohorte('resumen');
  web = spawn(process.execPath, [path.join(REPO, 'EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/servir-web.mjs'), path.join(REPO, 'apps/web/out'), '3000', API], {
    stdio: 'inherit',
  });
  await pausa(1500);
  let admin = null;
  try {
    admin = await prepararLosAlimentos();
  } catch (e) {
    console.error(`No se prepararon todos los alimentos de las capturas: ${String(e?.message ?? e).slice(0, 600)}`);
  }
  const r = await capturarTodo(admin);
  const fallas = r.pantallas.filter((p) => !p.ok);
  console.log(`${r.pantallas.length - fallas.length} de ${r.pantallas.length} pantallas capturadas; errores de la página: ${r.errores.length ? r.errores.slice(0, 8).join(' | ') : 'ninguno'}`);
  if (fallas.length) process.exitCode = 1;
} finally {
  fs.writeFileSync(path.join(salida, 'api.log'), registroDeLaApi.join(''));
  web?.kill();
  await parar(api);
}
