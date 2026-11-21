// WP-OBJETIVO-Y-CALCULADOR (DL-186) · Las capturas del objetivo con su toma de referencia, el calculador de macros y la
// propuesta de rangos, en la CI: esta PC no levanta la API, el website y PostgreSQL juntos. Corre en el trabajo
// `capturas-de-la-planificacion` (.github/workflows/capturas-de-la-planificacion.yml) y deja las imágenes como artefacto.
// Solo datos sintéticos: la cohorte (08 §33), con Lic. Sofía Paz (Nutrición y Antropometría) y Norma Castro, con sus tomas.
//
// Uso:  BE_E2E_DATABASE_URL=postgresql://be_test:be_test@localhost:5432/be_test_cohorte node capturas.mjs <salida>
//   Requiere compilados la API (`npm run build:api`) y el website contra la API local
//   (`BE_API_BASE_URL=http://localhost:3001 npm run build:web`). CHROME apunta al navegador.
//
// Qué captura, a 1920, 1440 y 1280 en Claro (y a 1440 en Azul noche): el calculador con la toma de Norma, la fórmula con
// sus números, el factor y los macros; los valores llevados al objetivo; el objetivo guardado con la toma vinculada; la
// propuesta de rangos con el reparto por comida y lo que se conserva; los rangos guardados, y una opción del almuerzo
// ubicada frente al rango de su comida. Cada pantalla es un paso: si uno falla, queda anotado en `capturas.json` con una
// captura del momento y se sigue. No mide peticiones ni compara con oráculos: es para mirar.
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

const salida = path.resolve(process.argv[2] ?? 'capturas-del-objetivo-y-calculador');
const API = 'http://localhost:3001';
const WEB = 'http://localhost:3000';
const CHROME = process.env.CHROME ?? (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome');
/** A 1920, 1440 y 1280 en Claro (el pedido de Dirección), y a 1440 también en Azul noche. */
const CAPTURAS = [
  ['claro', 1920, 1000],
  ['claro', 1440, 900],
  ['claro', 1280, 800],
  ['azul-noche', 1440, 900],
];

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


// ─── Lo que se prepara por la API (datos sintéticos) ────────────────────────────────────────────────────────────

/** Una llamada a la API con su clave de idempotencia. */
async function llamar(metodo, ruta, { token, cuerpo, esperado = [200, 201] } = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-BE-Surface': 'WEB' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (metodo !== 'GET') headers['Idempotency-Key'] = `capturas-${randomBytes(12).toString('hex')}`;
  const r = await fetch(`${API}/api/v1${ruta}`, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const texto = await r.text();
  if (!esperado.includes(r.status)) throw new Error(`${metodo} ${ruta}: ${r.status} ${texto.slice(0, 400)}`);
  return texto ? JSON.parse(texto) : null;
}

async function tokenDeSofia() {
  const c = cuentas();
  const { data } = await llamar('POST', '/auth/sessions', { cuerpo: { method: 'LOCAL', identifier: c.PRO_N_CORREO, credential: c.PRO_N_CLAVE } });
  return data.session.accessToken;
}

/**
 * Una versión en preparación del plan de Norma a partir del vigente, con el objetivo que se acaba de guardar con su
 * cálculo (el borrador cita el objetivo vigente). Si ya hay una en preparación, se usa esa.
 */
async function borradorConElObjetivoNuevo(norma) {
  const token = await tokenDeSofia();
  const { data: planes } = await llamar('GET', `/advisees/${norma}/nutrition/plans`, { token });
  const borrador = planes.find((p) => p.state === 'DRAFT');
  if (borrador) return borrador.planId;
  const vigente = planes.find((p) => p.state === 'ACTIVATED');
  const { data: efectivo } = await llamar('GET', `/advisees/${norma}/nutrition/objectives/effective`, { token });
  const { data } = await llamar('POST', `/advisees/${norma}/nutrition/plans`, { token, cuerpo: { objectiveVersionId: efectivo.objective.versionId, basedOnPlanId: vigente.planId } });
  return data.planId;
}

// ─── Las pantallas ──────────────────────────────────────────────────────────────────────────────────────────────

function pantallas(norma) {
  const resumen = `/pro/advisees/nutrition?id=${norma}&vista=resumen`;
  const plan = `/pro/advisees/nutrition?id=${norma}&vista=plan`;
  const comida = (n) => `.comida-del-editor[data-comida="${n}"]`;
  return [
    {
      // OBC-03: el calculador abierto con la toma más nueva de Norma, el método a la vista y lo que falta, si falta.
      nombre: '01-calculador-con-la-toma',
      entera: true,
      llegar: async (page) => {
        await ir(page, resumen);
        await clic(page, 'button', 'Nueva versión de objetivo');
        await clic(page, '[data-abrir-el-calculador]');
        await visible(page, '[data-calculador] [data-referencia-del-calculo]', null, 30_000);
        // La ecuación se elige por sexo: lo elige la profesional.
        await clic(page, '[data-metodo-del-calculo] label', 'Mujer');
        // RP-05 (DL-188): los g/kg son campos numéricos de a 0,1: se escriben con punto.
        await escribir(page, '[data-macros-del-calculo] input[id$="-proteina"]', '1.2');
        await escribir(page, '[data-macros-del-calculo] input[id$="-grasa"]', '0.9');
        await (await visible(page, '[data-calculador]')).evaluate((x) => x.scrollIntoView({ block: 'start' }));
        await pausa(400);
        return {
          datosDeLaToma: await page.$eval('[data-datos-de-la-toma]', (e) => e.innerText).catch(() => null),
          reposo: await page.$eval('[data-gasto-en-reposo]', (e) => e.innerText).catch(() => null),
        };
      },
    },
    {
      // OBC-04: la fórmula con sus números y la cita; el factor del día de descanso y el ajuste; los macros con su base.
      nombre: '02-calculador-formula-factor-y-macros',
      entera: true,
      llegar: async (page) => {
        await clic(page, '[data-actividad-del-calculo] label', 'Usar otro factor para el día de descanso');
        // RP-05: el sentido se elige («Déficit») y la cantidad va sin signo.
        await clic(page, '[data-sentido-del-ajuste] label', 'Déficit');
        const unidad = await visible(page, '[data-actividad-del-calculo] select[id$="-unidad-ajuste"]');
        await unidad.select('KCAL');
        await escribir(page, '[data-actividad-del-calculo] input[id$="-valor-ajuste"]', '150');
        await (await visible(page, '[data-gasto-en-reposo]')).evaluate((x) => x.scrollIntoView({ block: 'start' }));
        await pausa(400);
        return {
          formula: await page.$eval('[data-formula-aplicada]', (e) => e.innerText).catch(() => null),
          macros: await page.$$eval('[data-macros-del-dia]', (xs) => xs.map((x) => x.innerText.replace(/\s+/g, ' '))),
        };
      },
    },
    {
      // OBC-03: «Usar estos valores» lleva las kcal, los gramos y la declaración del método al objetivo.
      nombre: '03-valores-llevados-al-objetivo',
      llegar: async (page) => {
        await clic(page, '[data-usar-el-calculo]');
        await escribir(page, '#objetivo-fundamento', 'Mantener el peso con más proteína en el desayuno y la cena (capturas, datos sintéticos).');
        await (await visible(page, '#objetivo-kcal')).evaluate((x) => x.scrollIntoView({ block: 'center' }));
        await pausa(400);
        return { kcal: await page.$eval('#objetivo-kcal', (e) => e.value), metodo: await page.$eval('#objetivo-metodo', (e) => e.value) };
      },
    },
    {
      // OBC-02 y OBC-06: guardado, el resumen muestra la toma vinculada y el cálculo, con su fórmula.
      nombre: '04-objetivo-con-la-toma-vinculada',
      entera: true,
      llegar: async (page) => {
        await clic(page, 'form.formulario button[type="submit"]', 'Guardar nueva versión');
        await visible(page, '[data-referencia-del-objetivo]', null, 30_000);
        await clic(page, '[data-referencia-del-objetivo] summary');
        await (await visible(page, '[data-referencia-del-objetivo]')).evaluate((x) => x.scrollIntoView({ block: 'start' }));
        await pausa(400);
        return { referencia: await page.$eval('[data-referencia-del-objetivo]', (e) => e.innerText.replace(/\s+/g, ' ').slice(0, 600)) };
      },
    },
    {
      // OBC-07: la propuesta de rangos desde el cálculo, con el reparto sugerido por el nombre de cada comida.
      nombre: '05-propuesta-de-rangos',
      llegar: async (page) => {
        await borradorConElObjetivoNuevo(norma);
        await ir(page, plan);
        await clic(page, '[data-proponer-rangos]');
        await visible(page, 'dialog[open] [data-reparto-por-comida]', null, 30_000);
        await page.$eval('dialog[open] [data-propuesta-de-rangos]', (e) => e.scrollIntoView({ block: 'start' }));
        await pausa(400);
        return { fuente: await page.$eval('dialog[open] [data-fuente-de-la-propuesta]', (e) => e.innerText).catch(() => null) };
      },
    },
    {
      // OBC-08: lo que ya estaba escrito no se pisa sin la casilla; la lista de lo que se conserva.
      nombre: '06-propuesta-lo-que-se-conserva',
      llegar: async (page) => {
        const casilla = await page.$('dialog[open] [data-reemplazar-rangos]');
        if (casilla) await casilla.evaluate((x) => x.scrollIntoView({ block: 'center' }));
        else await page.$eval('dialog[open] [data-reparto-por-comida]', (e) => e.scrollIntoView({ block: 'end' }));
        await pausa(300);
        return { conRangosYaEscritos: !!casilla };
      },
    },
    {
      // Guardada la propuesta: los rangos indicados del día y de cada comida, en la lista del panel.
      nombre: '07-rangos-guardados-desde-la-propuesta',
      llegar: async (page) => {
        await clic(page, 'dialog[open] [data-principal-del-cuadro]', 'Guardar la propuesta como rangos');
        await page.waitForFunction(() => !document.querySelector('dialog[open] [data-propuesta-de-rangos]'), { timeout: 30_000 });
        await asentar(page);
        await (await visible(page, '[data-rangos-indicados]')).evaluate((x) => x.scrollIntoView({ block: 'start' }));
        await pausa(400);
        return { rangos: await page.$$eval('[data-rangos-indicados] li', (xs) => xs.map((x) => x.innerText.replace(/\s+/g, ' ')).slice(0, 8)) };
      },
    },
    {
      // NUP-04 frente al rango propuesto: una opción (o receta) del almuerzo, ubicada frente al rango de su comida.
      nombre: '08-receta-frente-al-rango-de-su-comida',
      llegar: async (page) => {
        if (!(await page.$(`${comida(2)}[data-abierta]`))) await clic(page, `${comida(2)} .comida-del-plan__boton`);
        await page.waitForSelector(`${comida(2)}[data-abierta]`, { timeout: 15_000 });
        // Si el almuerzo tiene una receta, esa; si no, la primera opción.
        const conReceta = await page.$$eval(`${comida(2)} [data-opcion-plegable]`, (xs) => xs.findIndex((x) => /receta/i.test(x.innerText)));
        const n = conReceta >= 0 ? conReceta + 1 : 1;
        const boton = `${comida(2)} [data-opcion-plegable="${n}"] .opcion-plegable__boton`;
        if (await page.$(`${boton}[aria-expanded="false"]`)) await clic(page, boton);
        await visible(page, `${comida(2)} [data-frente-a-los-rangos]`, null, 30_000);
        await page.$eval(`${comida(2)} [data-frente-a-los-rangos]`, (e) => e.scrollIntoView({ block: 'center' }));
        await pausa(400);
        return { conReceta: conReceta >= 0, frente: await page.$$eval(`${comida(2)} [data-frente-a-los-rangos] li`, (xs) => xs.map((x) => x.innerText)) };
      },
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
    return { desbordeHorizontal: document.documentElement.scrollWidth - ancho, desbordan, alto: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) };
  });

async function capturarTodo() {
  const estado = JSON.parse(fs.readFileSync(path.join(TRABAJO, 'estado.json'), 'utf8'));
  const norma = estado.personas?.norma?.aseId;
  if (!norma) throw new Error('La cohorte no dejó a Norma en estado.json.');
  const resultado = { hoy: estado.hoy, commit: process.env.GITHUB_SHA ?? null, pantallas: [], errores: [] };
  const navegador = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--lang=es-AR', '--force-color-profile=srgb'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });
  try {
    const contexto = await navegador.createBrowserContext();
    const page = await contexto.newPage();
    await page.emulateTimezone('America/Argentina/Buenos_Aires');
    page.on('pageerror', (e) => resultado.errores.push(String(e).slice(0, 300)));
    await entrar(page, 'PRO_N');
    for (const p of pantallas(norma)) {
      const fila = { pantalla: p.nombre, ok: true, notas: [], medidas: {} };
      try {
        await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
        const extra = await p.llegar(page, (t) => fila.notas.push(t));
        if (extra) fila.extra = extra;
        for (const [tema, ancho, alto] of CAPTURAS) {
          await ponerTema(page, tema);
          await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
          await pausa(700);
          await page.screenshot({ path: path.join(salida, `${p.nombre}-${tema}-${ancho}.png`) });
          fila.medidas[`${tema}-${ancho}`] = await medir(page);
          const total = fila.medidas[`${tema}-${ancho}`].alto;
          if (p.entera && total > alto + 40 && !(await page.$('dialog[open]'))) {
            await page.setViewport({ width: ancho, height: Math.min(total, 9000), deviceScaleFactor: 1 });
            await pausa(700);
            await page.screenshot({ path: path.join(salida, `${p.nombre}-${tema}-${ancho}-entera.png`) });
            await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
          }
        }
        await ponerTema(page, 'claro');
      } catch (e) {
        fila.ok = false;
        fila.error = String(e?.message ?? e).slice(0, 500);
        await page.screenshot({ path: path.join(salida, `${p.nombre}-FALLO.png`), fullPage: true }).catch(() => {});
      }
      resultado.pantallas.push(fila);
      console.log(`${p.nombre}: ${fila.ok ? 'bien' : `FALLÓ (${fila.error})`}${fila.notas.length ? ` · ${fila.notas.join(' · ')}` : ''}`);
    }
    await contexto.close();
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
  web = spawn(process.execPath, [path.join(REPO, 'EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/servir-web.mjs'), path.join(REPO, 'apps/web/out'), '3000', API], { stdio: 'inherit' });
  await pausa(1500);
  const r = await capturarTodo();
  const fallas = r.pantallas.filter((p) => !p.ok);
  console.log(`${r.pantallas.length - fallas.length} de ${r.pantallas.length} pantallas capturadas; errores de la página: ${r.errores.length ? r.errores.slice(0, 8).join(' | ') : 'ninguno'}`);
  if (fallas.length) process.exitCode = 1;
} finally {
  fs.writeFileSync(path.join(salida, 'api.log'), registroDeLaApi.join(''));
  web?.kill();
  await parar(api);
}
