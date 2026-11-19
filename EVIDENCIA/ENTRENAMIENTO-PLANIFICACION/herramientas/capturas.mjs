// Las capturas de WP-ENTRENAMIENTO-PLANIFICACION (DL-181): el editor del plan de Entrenamiento con los bloques de la
// sesión, la revisión honesta en el panel, el menú de la fase entero, el criterio arriba de las series con la edición
// conjunta y el preset con la sesión vacía. En la CI: esta PC no levanta la API, el website y PostgreSQL juntos. Corre en
// el trabajo `capturas-de-la-planificacion` (.github/workflows/capturas-de-la-planificacion.yml) y deja las imágenes como
// artefacto. Solo datos sintéticos: la cohorte (08 §33) y, encima, una versión en preparación del plan de Diego Sosa con
// un bloque en vueltas en una sesión, con el nombre de lo que trabaja («Pierna» en «Piernas A»), que arma Prof. Martín
// Acosta por la API.
//
// Uso:  BE_E2E_DATABASE_URL=postgresql://be_test:be_test@localhost:5432/be_test_cohorte node capturas.mjs <salida>
//   Requiere compilados la API (`npm run build:api`) y el website contra la API local
//   (`BE_API_BASE_URL=http://localhost:3001 npm run build:web`). CHROME apunta al navegador.
//
// Qué captura, en Claro y en Azul noche, a 1280 × 800, a 1536 × 730 (Windows al 125 % con Chrome al 100 % en 1920 × 1080)
// y a 1920 × 950. Cada pantalla es un paso: si uno falla, queda anotado en `capturas.json` con una captura del momento y
// se sigue. `capturas.json` anota, además, si un menú abierto queda entero y si la tabla de series se desplaza adentro.
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '../../..');
const COHORTE = path.join(REPO, 'EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte');
const TRABAJO = path.join(REPO, 'EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/trabajo-cohorte');
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const OTPAuth = createRequire(path.join(REPO, 'apps/api/'))('otpauth');

const salida = path.resolve(process.argv[2] ?? 'capturas-de-la-planificacion');
const API = 'http://localhost:3001';
const WEB = 'http://localhost:3000';
const CHROME = process.env.CHROME ?? (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome');
const TAMANOS = [
  [1280, 800],
  [1536, 730],
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


// ─── El plan en preparación con bloques, encima de la cohorte ───────────────────────────────────────────────────

const { clienteDe, dominio } = await import(pathToFileURL(path.join(COHORTE, 'api.mjs')).href);
const cliente = clienteDe(API);
/** Lo que declara el website: lee el tipo de serie y los bloques de la sesión. */
const DEL_WEBSITE = dominio.valorDeCapacidades([dominio.CAPACIDAD_TIPOS_DE_SERIE, dominio.CAPACIDAD_BLOQUES_DE_LA_SESION, dominio.CAPACIDAD_FORMULARIOS_FORMATO_3]);

/**
 * Prof. Martín Acosta prepara una versión nueva del plan de Diego Sosa (o sigue la que ya tiene en preparación) y le arma
 * en la primera sesión con dos ejercicios o más un bloque en vueltas (3, con 90 s al terminar cada vuelta) con el nombre
 * de lo que trabaja la sesión («Pierna» en «Piernas A»), y con un tercer ejercicio, «Complementarios», seguido. Devuelve
 * dónde quedó esa sesión, para pedirla en la dirección.
 */
async function prepararLosBloques(ids, nota) {
  const c = cuentas();
  const martin = await cliente.sesion(c.PRO_T_CORREO, c.PRO_T_CLAVE, 'WEB');
  const lista = await cliente.pedir('GET', `/advisees/${ids.diego}/training/plans?limit=50`, { token: martin, capacidades: DEL_WEBSITE });
  let borrador = lista.data.find((v) => v.state === 'DRAFT');
  if (!borrador) {
    const vigente = lista.data.find((v) => v.isEffective) ?? lista.data[0];
    const objetivo = await cliente.pedir('GET', `/advisees/${ids.diego}/training/objectives/effective`, { token: martin });
    const objectiveVersionId = objetivo.data.objective?.versionId ?? vigente?.objectiveVersionId;
    borrador = (await cliente.pedir('POST', `/advisees/${ids.diego}/training/plans`, { token: martin, cuerpo: { objectiveVersionId, ...(vigente ? { basedOnPlanId: vigente.planId } : {}) } })).data;
  }
  const detalle = (await cliente.pedir('GET', `/training/plans/${borrador.planId}/detail`, { token: martin, capacidades: DEL_WEBSITE })).data;
  const fases = dominio.estructuraConObjetivosComoEntrada(detalle);
  // La primera sesión con dos ejercicios o más, y su lugar (fase, semana si la hay, sesión).
  let lugar = null;
  fases.forEach((f, i) => {
    const grupos = (f.microcycles ?? []).length > 0 ? f.microcycles.map((m, j) => ({ j, sesiones: m.sessions })) : [{ j: null, sesiones: f.sessions ?? [] }];
    for (const g of grupos) g.sesiones.forEach((s, k) => {
      if (!lugar && s.prescriptions.length >= 2) lugar = { i, j: g.j, k, sesion: s };
    });
  });
  if (!lugar) throw new Error('El plan de Diego Sosa no tiene una sesión con dos ejercicios.');
  const s = lugar.sesion;
  const vueltas = 3;
  const vacia = { repetitions: { value: 10 } };
  // El nombre del bloque, coherente con su sesión: las capturas las ve el tutor («Torso» dentro de «Piernas A», con
  // sentadilla y zancadas, confundía).
  const nombreDelBloque = /pierna/i.test(s.label) ? 'Pierna' : /torso/i.test(s.label) ? 'Torso' : 'Principal';
  s.exerciseGroups = [
    { groupId: 'g-1', label: nombreDelBloque, kind: 'ROUNDS', rounds: vueltas, restAfterRoundSeconds: 90 },
    ...(s.prescriptions.length >= 3 ? [{ groupId: 'g-2', label: 'Complementarios', kind: 'SEQUENTIAL' }] : []),
  ];
  s.prescriptions.forEach((p, n) => {
    if (n < 2) {
      p.exerciseGroupId = 'g-1';
      p.sets = dominio.seriesParaLasVueltas(p.sets, vueltas, vacia);
    } else if (n === 2) p.exerciseGroupId = 'g-2';
  });
  await cliente.pedir('PATCH', `/training/plans/${borrador.planId}`, { token: martin, capacidades: DEL_WEBSITE, cuerpo: { expectedVersion: detalle.version, changes: { blocks: fases } } });
  nota(`bloques en la fase ${lugar.i + 1}${lugar.j === null ? '' : `, semana ${lugar.j + 1}`}, sesión ${lugar.k + 1} (${s.prescriptions.length} ejercicios)`);
  return lugar;
}

// ─── Las pantallas ──────────────────────────────────────────────────────────────────────────────────────────────

/** El panel a la vista: a menos de 1440 se abre con «Panel»; a 1440 o más ya está. */
async function conElPanel(page) {
  const oculto = await page.evaluate(() => {
    const p = document.querySelector('#zona-panel');
    return !p || getComputedStyle(p).display === 'none';
  });
  if (oculto) await clic(page, '[data-abrir-panel]');
}

function pantallas(ids, lugar) {
  const pedido = `bloque=${lugar.i + 1}${lugar.j === null ? '' : `&micro=${lugar.j + 1}`}&sesion=${lugar.k + 1}`;
  const editor = `/pro/advisees/training?id=${ids.diego}&vista=plan&${pedido}`;
  return [
    {
      nombre: '01-sesion-con-bloques',
      llegar: async (page) => {
        await ir(page, editor);
        await visible(page, '.bloque-del-editor');
        // La revisión se pide sola cuando lo guardado se queda quieto: se espera su respuesta.
        await page.waitForSelector('[data-estado-de-la-revision="lista"], [data-estado-de-la-revision="fallo"]', { timeout: 30_000 }).catch(() => {});
        await asentar(page);
        // El bloque a la vista, arriba del centro (que se desplaza solo).
        await page.evaluate(() => document.querySelector('.bloque-del-editor')?.scrollIntoView({ block: 'start' }));
        await pausa(300);
      },
    },
    {
      nombre: '02-revision-en-el-panel',
      vistaInicial: [1280, 800],
      llegar: async (page) => {
        await conElPanel(page);
        await visible(page, '[data-revision]');
      },
      despues: async (page) => {
        await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
        const abierto = await page.$('.estacion[data-panel-abierto]');
        if (abierto) await clic(page, '[data-abrir-panel]');
      },
    },
    {
      nombre: '03-menu-de-la-fase',
      vistaInicial: [1280, 800],
      llegar: async (page) => {
        await clic(page, '#menu-del-bloque');
        await visible(page, '.menu-de-acciones__panel[data-ubicado]');
      },
      despues: async (page) => {
        await page.keyboard.press('Escape');
        await pausa(300);
      },
    },
    {
      nombre: '04-ejercicio-abierto-y-series-elegidas',
      llegar: async (page) => {
        await clic(page, '.bloque-del-editor [id^="abrir-ejercicio-"]');
        await visible(page, '[data-criterio-del-ejercicio]');
        await clic(page, '[data-seleccionar-series]');
        const casillas = await page.$$('.series-del-editor__elegir input[type="checkbox"]');
        for (const c of casillas.slice(0, 2)) await c.click();
        await asentar(page);
        // El ejercicio abierto desde su título: el criterio arriba, la barra y las series.
        await page.evaluate(() => document.querySelector('.bloque-del-editor [data-abierta]')?.scrollIntoView({ block: 'start' }));
        await pausa(300);
      },
    },
    {
      nombre: '05-sesion-vacia-con-un-preset',
      llegar: async (page, nota) => {
        await clic(page, '[data-mas-sesion]');
        await page.keyboard.press('Enter');
        await asentar(page);
        await clic(page, '[data-galeria-de-prescripcion]');
        await clic(page, '.galeria__tarjeta[data-preset]');
        const texto = await page.evaluate(() => document.querySelector('[data-para-los-que-agregues]')?.textContent ?? null);
        if (!texto) nota('la galería no dijo qué hace el preset con la sesión vacía');
      },
      despues: (page) => cerrarCuadros(page),
    },
  ];
}

/** Lo que conviene anotar de cada captura: desbordes a lo ancho, el alto de la página y si algún menú queda cortado. */
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
    // ENP-D11: el panel de un menú abierto tiene que estar entero dentro de la ventana.
    const menu = [...document.querySelectorAll('.menu-de-acciones__panel:not([hidden])')].map((m) => {
      const r = m.getBoundingClientRect();
      return { entero: r.left >= 0 && r.top >= 0 && r.right <= window.innerWidth && r.bottom <= window.innerHeight, x: Math.round(r.left), y: Math.round(r.top), ancho: Math.round(r.width), alto: Math.round(r.height) };
    });
    // ENP-D14: la tabla de series no se desplaza adentro.
    const tablas = [...document.querySelectorAll('.series-del-editor')].map((t) => ({ desplaza: t.scrollWidth - t.clientWidth, contenedor: (t.parentElement?.scrollWidth ?? 0) - (t.parentElement?.clientWidth ?? 0) }));
    return {
      desbordeHorizontal: document.documentElement.scrollWidth - ancho,
      desbordan,
      alto: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
      menu,
      tablas,
      revision: document.querySelector('[data-estado-de-la-revision]')?.textContent?.trim() ?? null,
    };
  });

async function capturarTodo() {
  const estado = JSON.parse(fs.readFileSync(path.join(TRABAJO, 'estado.json'), 'utf8'));
  const ids = { diego: estado.personas?.diego?.aseId };
  if (!ids.diego) throw new Error('La cohorte no dejó a Diego Sosa en estado.json.');
  const notasDeLaPreparacion = [];
  const lugar = await prepararLosBloques(ids, (t) => notasDeLaPreparacion.push(t));
  console.log(`preparación: ${notasDeLaPreparacion.join(' · ')}`);
  const resultado = { hoy: estado.hoy, commit: process.env.GITHUB_SHA ?? null, preparacion: notasDeLaPreparacion, pantallas: [], errores: [] };
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
    await entrar(page, 'PRO_T');
    for (const p of pantallas(ids, lugar)) {
      const fila = { pantalla: p.nombre, ok: true, notas: [], medidas: {} };
      const nota = (t) => fila.notas.push(t);
      try {
        const [anchoInicial, altoInicial] = p.vistaInicial ?? [1440, 900];
        await page.setViewport({ width: anchoInicial, height: altoInicial, deviceScaleFactor: 1 });
        await pausa(400);
        await p.llegar(page, nota);
        for (const tema of TEMAS) {
          await ponerTema(page, tema);
          for (const [ancho, alto] of TAMANOS) {
            await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
            await pausa(700);
            await page.screenshot({ path: path.join(salida, `${p.nombre}-${tema}-${ancho}.png`) });
            fila.medidas[`${tema}-${ancho}`] = await medir(page);
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
