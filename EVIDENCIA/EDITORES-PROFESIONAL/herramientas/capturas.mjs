// Las capturas de las pantallas nuevas de WP-EDITORES-PROFESIONAL (revisión visual pedida por Dirección el 2026-11-13),
// en la CI: esta PC no levanta la API, el website y PostgreSQL juntos. Corre en el trabajo `capturas-de-los-editores`
// (.github/workflows/capturas-de-los-editores.yml) y deja las imágenes como artefacto. Solo datos sintéticos: la cohorte
// (08 §33), con la sentadilla, la banca, el peso muerto, el press militar y el remo del catálogo de DL-141 que entran en
// la estimación de la fuerza (BE_COHORTE_CON_LA_ESTIMACION=si, catalogo.mjs).
//
// Uso:  BE_E2E_DATABASE_URL=postgresql://be_test:be_test@localhost:5432/be_test_cohorte node capturas.mjs <salida>
//   Requiere compilados la API (`npm run build:api`) y el website contra la API local
//   (`BE_API_BASE_URL=http://localhost:3001 npm run build:web`). CHROME apunta al navegador.
//
// Qué captura, en Claro y en Azul noche, a 1280 × 800, a 1440 × 900 y a 1920 × 950 (el área útil de 1920 × 1080):
// - con Prof. Martín Acosta: la estación de Entrenamiento (el borrador de Camila Ortiz), la planilla de series de un
//   ejercicio con la fuerza, su detalle con la fuerza estimada, «Registrar una serie observada», la galería de presets,
//   «Antes de activar», el asistente (pasos 1, 4 y 7, sobre una copia de la versión vigente de Norma Castro), la
//   evolución de la fuerza en «Analizar» (Diego Sosa), «Pedir información» y las solicitudes enviadas;
// - con Lic. Sofía Paz: el asistente de Nutrición (pasos 1 y 5, sobre una copia de la vigente de Norma Castro) y el
//   editor de Nutrición con el rango del día.
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

const salida = path.resolve(process.argv[2] ?? 'capturas-de-los-editores');
const API = 'http://localhost:3001';
const WEB = 'http://localhost:3000';
const CHROME = process.env.CHROME ?? (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome');
const TAMANOS = [
  [1280, 800],
  [1440, 900],
  [1920, 950],
];
const TEMAS = ['claro', 'azul-noche'];
/** La sentadilla trasera con barra (Epley v1): la de la evolución de la fuerza en «Analizar». */
const SENTADILLA = '2aba46d7-c2d9-539c-847f-dc13a4322e18';

/** La base se declara y tiene que ser local y de prueba: la misma guardia que la cohorte (destino.mjs). */
const BASE = process.env.BE_E2E_DATABASE_URL ?? '';
{
  const u = new URL(BASE || 'postgresql://x@nada/nada');
  if (!['localhost', '127.0.0.1'].includes(u.hostname) || !/^\/be_test_[a-z0-9_]+$/.test(u.pathname)) {
    throw new Error('Guardia: BE_E2E_DATABASE_URL tiene que ser una base be_test_* de localhost.');
  }
}
if (process.env.BE_COHORTE_CON_LA_ESTIMACION !== 'si') throw new Error('Falta BE_COHORTE_CON_LA_ESTIMACION=si: sin ella, la cohorte no tiene ejercicios con la fuerza estimada.');
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

/** Espera a que la página termine de pedir datos y de acomodarse. */
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

/** Un clic de verdad, con el elemento a la vista. */
async function clic(page, selector, texto = null) {
  const e = await visible(page, selector, texto);
  await e.evaluate((x) => x.scrollIntoView({ block: 'center' }));
  await pausa(150);
  await e.click();
  await asentar(page);
  return e;
}

/** El tema, como lo aplica el menú de la cuenta (`aplicarTema`): el atributo y la preferencia guardada. */
async function ponerTema(page, tema) {
  await page.evaluate((t) => {
    document.documentElement.dataset.tema = t;
    try {
      localStorage.setItem('be-apariencia', t);
    } catch {}
  }, tema);
  await pausa(500);
}

/** Cierra los cuadros abiertos con Escape, hasta que no quede ninguno. */
async function cerrarCuadros(page) {
  for (let i = 0; i < 4 && (await page.$('dialog[open]')); i++) {
    await page.keyboard.press('Escape');
    await pausa(400);
  }
}

// UF-11 (DL-169): la compuerta de `/pro` pide el segundo factor una vez por sesión. La cohorte lo configuró y guardó la
// clave del autenticador en sus cuentas; acá se escribe el código de un paso de 30 s que esa cuenta no usó.
const PERIODO_MS = 30_000;
const codigoDelPaso = (secreto, paso) =>
  new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secreto), algorithm: 'SHA1', digits: 6, period: 30 }).generate({ timestamp: paso * PERIODO_MS });
const ultimoPaso = {};

async function entrar(page, prefijo) {
  const c = cuentas();
  await page.goto(`${WEB}/login?volver=${encodeURIComponent('/pro')}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => Object.keys(document.querySelector('#correo') ?? {}).some((k) => k.startsWith('__reactProps')), { timeout: 60_000 });
  await page.type('#correo', c[`${prefijo}_CORREO`]);
  await page.type('#contrasena', c[`${prefijo}_CLAVE`]);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => location.pathname.startsWith('/pro'), { timeout: 60_000 });
  const conCompuerta = await page.waitForSelector('#mfa-codigo', { timeout: 20_000 }).then(() => true).catch(() => false);
  if (conCompuerta) {
    const secreto = c[`${prefijo}_AUTENTICADOR`];
    if (!secreto) throw new Error(`La cohorte no guardó el autenticador de ${prefijo}.`);
    const usado = Math.max(Number(c[`${prefijo}_ULTIMO_PASO`] ?? -1), ultimoPaso[prefijo] ?? -1);
    while (Math.floor(Date.now() / PERIODO_MS) <= usado) await pausa(1000);
    const paso = Math.floor(Date.now() / PERIODO_MS);
    ultimoPaso[prefijo] = paso;
    await page.waitForFunction(() => Object.keys(document.querySelector('#mfa-codigo') ?? {}).some((k) => k.startsWith('__reactProps')), { timeout: 30_000 });
    await page.type('#mfa-codigo', codigoDelPaso(secreto, paso));
    await clic(page, 'form button[type="submit"]', 'Confirmar');
    await page.waitForFunction(() => !document.querySelector('#mfa-codigo'), { timeout: 30_000 });
  }
  await asentar(page);
}

// ─── Las pantallas ──────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Cada pantalla: su nombre, cómo se llega (desde donde dejó la anterior) y si se guarda también la página entera (las
 * que se desplazan como página; la estación mide una pantalla y desplaza cada zona, y los cuadros van sobre la vista).
 */
function pantallas(ids) {
  const { camila, norma, diego } = ids;
  const entrenamiento = (id, extra = '') => `/pro/advisees/training?id=${id}&vista=plan${extra}`;
  const nutricion = (id, extra = '') => `/pro/advisees/nutrition?id=${id}&vista=plan${extra}`;
  return {
    PRO_T: [
      {
        nombre: '01-estacion-entrenamiento',
        llegar: async (page) => {
          await ir(page, entrenamiento(camila));
          await visible(page, '[data-estacion] [data-zona="editor"]');
        },
      },
      {
        nombre: '02-planilla-de-series',
        llegar: async (page, nota) => {
          // El primer ejercicio con la fuerza estimada (los del catálogo de Epley v1); si no hay, el primero.
          const total = await page.$$eval('[data-ejercicio]', (xs) => xs.length);
          let elegido = null;
          for (let i = 1; i <= total && !elegido; i++) {
            const abierto = await page.$eval(`[data-ejercicio="${i}"]`, (e) => e.hasAttribute('data-abierta'));
            if (!abierto) await clic(page, `[data-ejercicio="${i}"] .comida-del-plan__boton`);
            if (await page.$(`[data-ejercicio="${i}"] [data-detalle-con-fuerza]`)) elegido = i;
            else await clic(page, `[data-ejercicio="${i}"] .comida-del-plan__boton`);
          }
          if (!elegido) {
            nota('ningún ejercicio del borrador entra en la estimación: se muestra el primero');
            await clic(page, '[data-ejercicio="1"] .comida-del-plan__boton');
            elegido = 1;
          }
          await page.$eval(`[data-ejercicio="${elegido}"]`, (e) => e.scrollIntoView({ block: 'start' }));
          await pausa(400);
          return { ejercicio: elegido };
        },
      },
      {
        nombre: '03-detalle-del-ejercicio-con-la-fuerza',
        llegar: async (page) => {
          await clic(page, '[data-ejercicio][data-abierta] [data-detalle-con-fuerza]');
          await visible(page, 'dialog[open] .detalle-del-ejercicio');
          await asentar(page);
        },
      },
      {
        nombre: '04-serie-observada',
        llegar: async (page) => {
          await clic(page, 'dialog[open] [data-registrar-observada]');
          await asentar(page);
        },
        despues: cerrarCuadros,
      },
      {
        nombre: '05-galeria-de-presets',
        llegar: async (page) => {
          await clic(page, '[data-galeria-de-prescripcion]');
          await visible(page, '[data-galeria]');
          // La primera tarjeta elegida, para que la vista previa muestre algo.
          const tarjeta = await page.$('[data-galeria] .galeria__tarjeta');
          if (tarjeta) {
            await tarjeta.click();
            await asentar(page);
          }
        },
        despues: cerrarCuadros,
      },
      {
        nombre: '06-antes-de-activar',
        llegar: async (page) => {
          await clic(page, '[data-revisar-y-activar]');
          await visible(page, 'dialog[open] [data-antes-de-activar]');
          await asentar(page);
        },
        despues: cerrarCuadros,
      },
      {
        nombre: '07-asistente-entrenamiento-paso-1',
        entera: true,
        llegar: async (page) => {
          await ir(page, entrenamiento(norma, '&asistente=1'));
          await visible(page, '[data-asistente="1"]');
        },
      },
      {
        nombre: '08-asistente-entrenamiento-paso-4',
        entera: true,
        llegar: async (page) => {
          // «Copiar la versión vigente» y «Siguiente»: el borrador nace y el asistente sigue en el paso 2.
          await clic(page, '[data-punto-de-partida="vigente"]');
          await clic(page, '[data-asistente-principal]');
          await visible(page, '[data-asistente="2"]');
          await ir(page, entrenamiento(norma, '&asistente=4'));
          await visible(page, '[data-asistente="4"]');
        },
      },
      {
        nombre: '09-asistente-entrenamiento-paso-7',
        entera: true,
        llegar: async (page) => {
          await ir(page, entrenamiento(norma, '&asistente=7'));
          await visible(page, '[data-asistente="7"]');
        },
      },
      {
        nombre: '10-fuerza-en-analizar',
        entera: true,
        llegar: async (page) => {
          await ir(page, `/pro/advisees?id=${diego}&vista=analizar&pregunta=fuerza-estimada&ejercicio=${SENTADILLA}&unidad=kg`);
          await pausa(1500);
        },
      },
      {
        nombre: '11-pedir-informacion',
        entera: true,
        llegar: async (page) => {
          await ir(page, `/pro/advisees/forms?id=${diego}&vista=pedir&plantilla=FRM-ENTRENAMIENTO`);
          await pausa(800);
        },
      },
      {
        nombre: '12-solicitudes-enviadas',
        entera: true,
        llegar: async (page) => {
          await ir(page, '/pro');
          await visible(page, '#solicitudes-enviadas');
          await page.$eval('#solicitudes-enviadas', (e) => e.scrollIntoView({ block: 'start' }));
          await pausa(500);
        },
      },
    ],
    PRO_N: [
      {
        nombre: '13-asistente-nutricion-paso-1',
        entera: true,
        llegar: async (page) => {
          await ir(page, nutricion(norma, '&asistente=1'));
          await visible(page, '[data-asistente="1"]');
        },
      },
      {
        nombre: '14-asistente-nutricion-paso-5',
        entera: true,
        llegar: async (page) => {
          await clic(page, '[data-punto-de-partida="vigente"]');
          await clic(page, '[data-asistente-principal]');
          await visible(page, '[data-asistente="2"]');
          await ir(page, nutricion(norma, '&asistente=5'));
          await visible(page, '[data-asistente="5"]');
        },
      },
      {
        nombre: '15-editor-nutricion-rango-del-dia',
        llegar: async (page, nota) => {
          await ir(page, nutricion(norma));
          await visible(page, '[data-estacion], .editor-del-plan');
          const rango = await page.$('[data-rango-del-dia]');
          if (!rango) nota('sin [data-rango-del-dia] a la vista al abrir');
          await asentar(page);
        },
      },
    ],
  };
}

/** Lo que conviene anotar de cada captura para la revisión: desbordes a lo ancho y el alto de la página. */
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
      rangoDelDia: document.querySelector('[data-rango-del-dia]')?.textContent?.trim() ?? null,
      titulo: document.querySelector('h1')?.textContent?.trim() ?? null,
    };
  });

async function capturarTodo() {
  const estado = JSON.parse(fs.readFileSync(path.join(TRABAJO, 'estado.json'), 'utf8'));
  const ids = {};
  for (const clave of ['camila', 'norma', 'diego']) {
    ids[clave] = estado.personas?.[clave]?.aseId;
    if (!ids[clave]) throw new Error(`La cohorte no dejó a ${clave} en estado.json.`);
  }
  const resultado = { hoy: estado.hoy, commit: process.env.GITHUB_SHA ?? null, pantallas: [], errores: [] };
  const navegador = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--lang=es-AR', '--force-color-profile=srgb'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });
  try {
    for (const [prefijo, lista] of Object.entries(pantallas(ids))) {
      const contexto = await navegador.createBrowserContext();
      const page = await contexto.newPage();
      await page.emulateTimezone('America/Argentina/Buenos_Aires');
      page.on('pageerror', (e) => resultado.errores.push(`${prefijo}: ${String(e).slice(0, 300)}`));
      await entrar(page, prefijo);
      for (const p of lista) {
        const fila = { pantalla: p.nombre, profesional: prefijo, ok: true, notas: [], medidas: {} };
        const nota = (t) => fila.notas.push(t);
        try {
          await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
          const extra = await p.llegar(page, nota);
          if (extra) fila.extra = extra;
          for (const tema of TEMAS) {
            await ponerTema(page, tema);
            for (const [ancho, alto] of TAMANOS) {
              await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
              await pausa(700);
              await page.screenshot({ path: path.join(salida, `${p.nombre}-${tema}-${ancho}.png`) });
              fila.medidas[`${tema}-${ancho}`] = await medir(page);
              if (p.entera) {
                const total = fila.medidas[`${tema}-${ancho}`].alto;
                if (total > alto + 40) {
                  // La página entera con la ventana estirada a su alto: con `fullPage`, los gráficos se quedan sin dibujo.
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
        await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
        resultado.pantallas.push(fila);
        console.log(`${prefijo} · ${p.nombre}: ${fila.ok ? 'bien' : `FALLÓ (${fila.error})`}${fila.notas.length ? ` · ${fila.notas.join(' · ')}` : ''}`);
      }
      await contexto.close();
    }
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
  const r = await capturarTodo();
  const fallas = r.pantallas.filter((p) => !p.ok);
  console.log(`${r.pantallas.length - fallas.length} de ${r.pantallas.length} pantallas capturadas; errores de la página: ${r.errores.length ? r.errores.slice(0, 8).join(' | ') : 'ninguno'}`);
  if (fallas.length) process.exitCode = 1;
} finally {
  fs.writeFileSync(path.join(salida, 'api.log'), registroDeLaApi.join(''));
  web?.kill();
  await parar(api);
}
