// Las capturas de WP-TABLERO-ALTA-GAMA (TB-00 y la recaptura de cada parte, §8.1), en la CI: esta PC no levanta la API,
// el website y PostgreSQL juntos. Corre en el trabajo `capturas-del-tablero` (.github/workflows/capturas-del-tablero.yml)
// y deja las imágenes y las mediciones como artefacto. Solo datos sintéticos: la cohorte (08 §33).
//
// Uso:  BE_E2E_DATABASE_URL=postgresql://be_test:be_test@localhost:5432/be_test_cohorte node capturas.mjs <salida>
//   Requiere compilados la API (`npm run build:api`) y el website contra la API local
//   (`BE_API_BASE_URL=http://localhost:3001 npm run build:web`). CHROME apunta al navegador.
//
// Pasos: migraciones → API → los profesionales de la cohorte → API de nuevo, con su habilitación (DL-036) → sus
// ejercicios y las seis personas → website con la CSP de render.yaml → capturas → mediciones.json.
//
// Qué captura, en Claro y en Azul noche, a 1280 × 800, a 1440 × 900 y a 1920 × 950 (el área útil de un monitor de
// 1920 × 1080):
// la primera pantalla y la página entera del Espacio profesional, el Resumen de la ficha, «Analizar», Nutrición y
// Antropometría de Diego Sosa vistos por Sofía Paz, y el Espacio, el Resumen y Entrenamiento vistos por Martín Acosta.
// Cuenta las peticiones a la API al abrir cada página (TEST-TAG-032): la cuenta queda en mediciones.json.
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

const salida = path.resolve(process.argv[2] ?? 'capturas-del-tablero');
const API = 'http://localhost:3001';
const WEB = 'http://localhost:3000';
const CHROME = process.env.CHROME ?? (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome');
const TAMANOS = [
  [1280, 800],
  [1440, 900],
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
    // La cohorte da de alta nueve cuentas y las capturas inician sesión varias veces: los limitadores se prueban en
    // las pruebas de integración, no acá.
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

// ─── Las capturas ───────────────────────────────────────────────────────────────────────────────────────────────

/** Qué se captura de cada profesional: el nombre del archivo y la ruta, con {diego} en lugar del identificador. */
const PAGINAS = {
  PRO_N: [
    ['espacio', '/pro'],
    ['resumen', '/pro/advisees?id={diego}'],
    ['analizar', '/pro/advisees?id={diego}&vista=analizar'],
    // El gráfico grande: «Analizar» con Calorías elegida (se elige en pantalla, como lo haría el profesional).
    ['analizar-calorias', '/pro/advisees?id={diego}&vista=analizar', 'Calorías'],
    ['nutricion', '/pro/advisees/nutrition?id={diego}&vista=resumen'],
    ['antropometria', '/pro/advisees/anthropometry?id={diego}&vista=evolucion'],
  ],
  PRO_T: [
    ['espacio', '/pro'],
    ['resumen', '/pro/advisees?id={diego}'],
    ['entrenamiento', '/pro/advisees/training?id={diego}&vista=resumen'],
  ],
};
const NOMBRES = { PRO_N: 'sofia-paz', PRO_T: 'martin-acosta' };

async function capturarTodo() {
  const estado = JSON.parse(fs.readFileSync(path.join(TRABAJO, 'estado.json'), 'utf8'));
  const diego = estado.personas?.diego?.aseId;
  if (!diego) throw new Error('La cohorte no dejó a Diego Sosa en estado.json.');
  const c = cuentas();
  const mediciones = { hoy: estado.hoy, commit: process.env.GITHUB_SHA ?? null, paginas: [], errores: [] };
  const navegador = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--lang=es-AR', '--force-color-profile=srgb'],
    defaultViewport: { width: TAMANOS[0][0], height: TAMANOS[0][1], deviceScaleFactor: 1 },
  });
  try {
    for (const [prefijo, paginas] of Object.entries(PAGINAS)) {
      // Cada profesional en su propio contexto, sin la sesión del anterior.
      const contexto = await navegador.createBrowserContext();
      const page = await contexto.newPage();
      await page.emulateTimezone('America/Argentina/Buenos_Aires');
      page.on('pageerror', (e) => mediciones.errores.push(`${NOMBRES[prefijo]}: ${String(e).slice(0, 300)}`));
      let peticiones = 0;
      page.on('request', (r) => {
        if (r.url().startsWith(`${API}/api/`) && r.method() !== 'OPTIONS') peticiones += 1;
      });
      await page.goto(`${WEB}/login?volver=${encodeURIComponent('/pro')}`, { waitUntil: 'networkidle0' });
      await page.type('#correo', c[`${prefijo}_CORREO`]);
      await page.type('#contrasena', c[`${prefijo}_CLAVE`]);
      await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
      await page.waitForFunction(() => location.pathname.startsWith('/pro'), { timeout: 60_000 });
      await asentar(page);
      for (const [nombre, plantilla, metrica] of paginas) {
        const ruta = plantilla.replace('{diego}', diego);
        // Para contar lo que pide una página al abrirse, se llega desde otra: la cuenta, que no comparte lecturas.
        await page.evaluate(() => window.next.router.push('/account'));
        await asentar(page);
        peticiones = 0;
        // La sesión vive en memoria: se navega dentro de la aplicación, sin recargar.
        await page.evaluate((u) => window.next.router.push(u), ruta);
        await asentar(page);
        if (metrica) {
          await page.evaluate((m) => {
            const casilla = [...document.querySelectorAll('label')].find((l) => l.textContent.trim() === m)?.querySelector('input[type="checkbox"]');
            casilla?.click();
          }, metrica);
          await asentar(page);
          // Y «Ver los gráficos», que abre el gráfico de lo elegido.
          await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Ver los gráficos')?.click());
          await asentar(page);
        }
        const fila = { profesional: NOMBRES[prefijo], pagina: nombre, ruta: plantilla, peticionesAlAbrir: peticiones, alto: {} };
        for (const tema of TEMAS) {
          await ponerTema(page, tema);
          for (const [ancho, alto] of TAMANOS) {
            const carpeta = path.join(salida, NOMBRES[prefijo], tema);
            fs.mkdirSync(carpeta, { recursive: true });
            await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
            await pausa(700);
            await page.screenshot({ path: path.join(carpeta, `${nombre}-${ancho}-pantalla.png`) });
            const total = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
            // La página entera con la ventana estirada a su alto: con `fullPage`, los gráficos se quedan sin dibujo.
            await page.setViewport({ width: ancho, height: Math.min(Math.max(total, alto), 16000), deviceScaleFactor: 1 });
            await pausa(700);
            await page.screenshot({ path: path.join(carpeta, `${nombre}-${ancho}-entera.png`) });
            fila.alto[`${tema}-${ancho}`] = total;
          }
        }
        await page.setViewport({ width: TAMANOS[0][0], height: TAMANOS[0][1], deviceScaleFactor: 1 });
        mediciones.paginas.push(fila);
        console.log(`${NOMBRES[prefijo]} · ${nombre}: ${fila.peticionesAlAbrir} peticiones al abrir · ${JSON.stringify(fila.alto)}`);
      }
      await contexto.close();
    }
  } finally {
    fs.writeFileSync(path.join(salida, 'mediciones.json'), `${JSON.stringify(mediciones, null, 2)}\n`);
    await navegador.close();
  }
  return mediciones;
}

/** Espera a que la página termine de pedir datos y de acomodarse. */
async function asentar(page) {
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 30_000 }).catch(() => {});
  await pausa(600);
}

/**
 * El tema se elige en el menú de la cuenta (WP-ESCRITORIO-AMABLE), sin teclado y sin mover el foco, como en
 * EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/paginas.mjs: Escape cerraría otro panel y dejaría el aro de foco.
 */
async function ponerTema(page, tema) {
  if ((await page.evaluate(() => document.documentElement.dataset.tema)) === tema) return;
  await page.waitForSelector('.menu-de-cuenta__boton', { timeout: 15_000 });
  await page.evaluate(() => document.querySelector('.menu-de-cuenta__boton').click());
  await page.waitForSelector('.menu-de-cuenta__panel input[type="radio"]', { timeout: 5_000 });
  await page.evaluate((t) => document.querySelector(`.menu-de-cuenta__panel input[type="radio"][value="${t}"]`).click(), tema);
  await page.waitForFunction((t) => document.documentElement.dataset.tema === t, { timeout: 5_000 }, tema);
  await page.evaluate(() => document.querySelector('.menu-de-cuenta__boton').click());
  await page.waitForFunction(() => !document.querySelector('.menu-de-cuenta__panel'), { timeout: 3_000 });
  await pausa(300);
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
  const m = await capturarTodo();
  console.log(`errores de la página: ${m.errores.length ? m.errores.slice(0, 8).join(' | ') : 'ninguno'}`);
} finally {
  fs.writeFileSync(path.join(salida, 'api.log'), registroDeLaApi.join(''));
  web?.kill();
  await parar(api);
}
