// Las capturas de los gráficos de WP-GRAFICOS (DL-174), en la CI. Dirección preguntó si preparamos cómo se iban a ver los
// gráficos y si quedaron estéticos y fáciles de entender: esta herramienta los muestra en pantalla. Esta PC no levanta la
// API, el website y PostgreSQL juntos, así que corre en el trabajo `capturas-de-los-graficos`
// (.github/workflows/capturas-de-los-graficos.yml) y deja las imágenes como artefacto. No es un check de la integración:
// no bloquea ni despliega nada. Solo datos sintéticos: la cohorte (08 §33), con los ejercicios del catálogo de DL-141 que
// entran en la estimación de la fuerza y la procedencia de cada valor escrito (BE_COHORTE_CON_LA_ESTIMACION=si,
// catalogo.mjs e historia.mjs).
//
// Uso:  BE_E2E_DATABASE_URL=postgresql://be_test:be_test@localhost:5432/be_test_cohorte BE_COHORTE_CON_LA_ESTIMACION=si \
//         node capturas.mjs <salida>
//   Requiere compilados la API (`npm run build:api`) y el website contra la API local
//   (`BE_API_BASE_URL=http://localhost:3001 npm run build:web`). CHROME apunta al navegador. BE_CAPTURAS_SOLO (opcional):
//   los prefijos de las pantallas que se capturan, separados por comas («01,07»); sin ella, todas.
//
// Qué captura, en Claro y en Azul noche, a 1024 × 768, 1280 × 800, 1440 × 900 y 1920 × 950 (el área útil de 1920 × 1080),
// siempre con Diego Sosa (tres años en BE, las tres áreas):
// - con Prof. Martín Acosta (Entrenamiento): el buscador «Agregar ejercicio» con la marca «Con historial» (GR-04), «La vez
//   pasada» con y sin la fuerza estimada (GR-01), el historial y el perfil del ejercicio (GR-02, GR-03, GR-05, GR-06 y la
//   cinta GR-23), la fuerza estimada en «Analizar» (GR-02), «Superpuestas» con el 1RM estimado y la carga (GR-26), «Comparar
//   dos etapas» (GR-24) y «Patrones», en la ficha y en la estación (GR-27);
// - con Lic. Sofía Paz (Nutrición y Antropometría): «Desde el inicio y desde la anterior» (GR-16), «Día por día» (GR-14),
//   «Por sitio» (GR-18) y «Por método» (GR-20), «Superpuestas» y «Alineadas» (GR-26), «Comparar dos etapas» (GR-24),
//   «Patrones» con «Ver la relación» (SP-02) y «Armá tu gráfico» (GR-26).
// La misma lista sirve en cada rama de WP-GRAFICOS apenas trae main: una pantalla que la rama todavía no tiene se anota y
// se saltea, y una que falla queda anotada con una captura del momento; ninguna corta la corrida. Cada pantalla deja la
// ventana visible y, si un gráfico no entra entero en ella, el recorte de su panel. `indice.md` dice qué es cada imagen,
// quién mira, la persona y lo que no se pudo capturar y por qué; `capturas.json`, lo mismo con las medidas de cada captura.
// No mide peticiones ni compara con oráculos: es para mirar.
//
// La API, la cohorte, la entrada con el segundo factor y el tema son los de EDITORES-PROFESIONAL/herramientas/capturas.mjs,
// copiados: esa herramienta es un guion que corre entero al cargarse, así que importarla la correría.
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

const salida = path.resolve(process.argv[2] ?? 'capturas-de-los-graficos');
const API = 'http://localhost:3001';
const WEB = 'http://localhost:3000';
const CHROME = process.env.CHROME ?? (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome');
const TAMANOS = [
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 950],
];
const TEMAS = ['claro', 'azul-noche'];
/** Dónde se llega a cada pantalla antes de recorrer los tamaños: el escritorio de siempre. */
const LLEGADA = { width: 1440, height: 900, deviceScaleFactor: 1 };
/** La sentadilla trasera con barra (Epley v1): la de la fuerza estimada en «Analizar» y en «Comparar dos etapas». */
const SENTADILLA = '2aba46d7-c2d9-539c-847f-dc13a4322e18';
/** Lo que se busca en «Agregar ejercicio» hasta encontrar resultados con la marca «Con historial» (GR-04). */
const BUSQUEDAS = ['barra', 'sentadilla', 'press', 'remo', 'peso muerto'];
const PERSONA = {
  clave: 'diego',
  nombre: 'Diego Sosa',
  descripcion:
    'persona sintética de la cohorte (ninguna persona es real): 36 años, tres años en BE; nunca había entrenado y pasó de 104,5 a 80,8 kg y la sentadilla de 20 a 135 kg. Nutrición y Antropometría con Lic. Sofía Paz; Entrenamiento con Prof. Martín Acosta, cuatro días por semana. Con BE_COHORTE_CON_LA_ESTIMACION=si, la sentadilla, la banca, el peso muerto, el press militar y el remo son los del catálogo de DL-141 que entran en la estimación de la fuerza, y cada valor escrito de una serie dice que lo escribió la persona (ED-70): sin eso, el 1RM estimado quedaría vacío.',
};
const PROFESIONALES = { PRO_T: 'Prof. Martín Acosta (Entrenamiento)', PRO_N: 'Lic. Sofía Paz (Nutrición y Antropometría)' };
const SOLO = (process.env.BE_CAPTURAS_SOLO ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

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

/** Lo que la rama todavía no tiene: la pantalla se saltea y se anota por qué, sin contarse como una falla. */
class NoEstaEnLaRama extends Error {}

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
    // El recorrido pasa por las pantallas mucho más rápido que una persona: con el tope de 120 lecturas protegidas por
    // minuto, un 429 del recorrido se vería en la captura como si el gráfico fallara.
    RATE_LIMIT_CONSULTA_PROTEGIDA_MAX: '3000',
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

/** El elemento visible, o `null` si no aparece a tiempo: para preguntar si la rama tiene una pieza. */
const siAparece = (page, selector, texto = null, timeout = 8_000) => visible(page, selector, texto, timeout).catch(() => null);

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
  for (let i = 0; i < 5 && (await page.$('dialog[open]')); i++) {
    await page.keyboard.press('Escape');
    await pausa(400);
  }
}

const CARGANDO = 'p.cargando, .estado-de-grafico--cargando, .grafico-base__cargando, [aria-busy="true"]';

/** Espera a que no quede nada cargando a la vista (dentro de `raiz`); si no termina, lo anota y sigue. */
async function esperarQueCargue(page, nota, raiz = 'body', timeout = 20_000) {
  const listo = await page
    .waitForFunction(
      (r, s) => {
        const base = document.querySelector(r);
        if (!base) return true;
        return ![...base.querySelectorAll(s)].some((e) => e.getClientRects().length > 0);
      },
      { timeout, polling: 250 },
      raiz,
      CARGANDO,
    )
    .then(() => true)
    .catch(() => false);
  if (!listo) nota(`a los ${Math.round(timeout / 1000)} s seguía algo cargando`);
  await asentar(page);
}

/**
 * Los estados de error y los vacíos que se ven (en el cuadro abierto, si hay uno): van a las notas, para no confundir una
 * captura vacía con un gráfico.
 */
async function anotarEstados(page, nota) {
  const e = await page.evaluate(() => {
    const raiz = document.querySelector('dialog[open]') ?? document.body;
    const vis = (x) => x.getClientRects().length > 0;
    const texto = (x) => x.textContent.replace(/\s+/g, ' ').trim().slice(0, 180);
    return {
      errores: [...raiz.querySelectorAll('.estado-de-grafico--error, .aviso--error')].filter(vis).map(texto).slice(0, 4),
      vacios: [...raiz.querySelectorAll('.estado-de-grafico--vacio, .estado-vacio')].filter(vis).map(texto).slice(0, 4),
    };
  });
  for (const t of e.errores) nota(`se ve un error: «${t}»`);
  for (const t of e.vacios) nota(`se ve un estado vacío: «${t}»`);
}

/** Si la pantalla muestra un error, es una falla (con su texto); si no, la pieza no está en esta rama. */
async function faltaOError(page, motivo) {
  const error = await page.evaluate(() =>
    [...document.querySelectorAll('.estado-de-grafico--error, .aviso--error')]
      .filter((x) => x.getClientRects().length > 0)
      .map((x) => x.textContent.replace(/\s+/g, ' ').trim().slice(0, 200))[0] ?? null,
  );
  if (error) throw new Error(`la pantalla muestra un error: «${error}»`);
  throw new NoEstaEnLaRama(motivo);
}

/** El primer elemento visible del selector cuyo texto contiene `texto`, o `null`. */
async function porTexto(page, selector, texto, timeout = 5_000) {
  const h = await page
    .waitForFunction((s, t) => [...document.querySelectorAll(s)].find((e) => e.textContent.replace(/\s+/g, ' ').includes(t) && e.getClientRects().length > 0) ?? null, { timeout, polling: 200 }, selector, texto)
    .catch(() => null);
  return h ? h.asElement() : null;
}

/** Lleva a la vista lo que importa de la pantalla: entero si entra, y si no, desde su principio. */
async function enfocar(page, cual) {
  if (typeof cual === 'function') return cual(page);
  await page.evaluate((s) => {
    const e = [...document.querySelectorAll(s)].find((x) => x.getClientRects().length > 0);
    if (!e) return;
    e.scrollIntoView({ block: e.getBoundingClientRect().height < innerHeight * 0.8 ? 'center' : 'start' });
  }, cual);
  await pausa(300);
}

/** Si el elemento entra entero en la ventana y en los contenedores que lo recortan. */
const enteroALaVista = (page, selector) =>
  page.evaluate((s) => {
    const e = document.querySelector(s);
    if (!e) return true;
    const r = e.getBoundingClientRect();
    if (r.top < -1 || r.bottom > innerHeight + 1) return false;
    for (let p = e.parentElement; p; p = p.parentElement) {
      const estilo = getComputedStyle(p);
      if (/(auto|scroll|hidden|clip)/.test(estilo.overflowY)) {
        const q = p.getBoundingClientRect();
        if (r.top < q.top - 1 || r.bottom > q.bottom + 1) return false;
      }
    }
    return true;
  }, selector);

/**
 * El recorte de un panel: la ventana se estira hasta que el panel entra entero (los cuadros laterales crecen con ella y
 * dejan de desplazarse adentro), se lo centra, se captura y se vuelve al tamaño de antes. Con `fullPage`, los gráficos que
 * miden su ancho se quedan sin dibujo: por eso se estira la ventana. Si el panel se desplaza adentro de un cuadro, se
 * suma lo que ocupan la cabecera y el pie fijos del cuadro: si no, lo tapan.
 */
async function recortar(page, selector, archivo, ancho, alto) {
  const { h, fijo } = await page
    .$eval(selector, (e) => {
      let fijo = 0;
      for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(p).overflowY)) {
          fijo = Math.max(0, innerHeight - p.clientHeight);
          break;
        }
      }
      return { h: e.getBoundingClientRect().height, fijo };
    })
    .catch(() => ({ h: 0, fijo: 0 }));
  if (h < 8) return false;
  const necesario = Math.min(Math.ceil(h + fijo) + 240, 6000);
  const estirada = necesario > alto;
  try {
    if (estirada) {
      await page.setViewport({ width: ancho, height: necesario, deviceScaleFactor: 1 });
      await pausa(900);
    }
    const e = await page.$(selector);
    if (!e) return false;
    await e.evaluate((x) => x.scrollIntoView({ block: 'center' }));
    await pausa(300);
    await e.screenshot({ path: archivo });
    return true;
  } finally {
    if (estirada) {
      await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
      await pausa(600);
    }
  }
}

/** Un nombre de archivo a partir de un texto: sin tildes, en minúsculas y corto. */
const enNombre = (t) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36)
    .replace(/-+$/g, '');

/**
 * Los paneles de una pantalla: los que pide (con su nombre) y, si pide `graficos`, cada gráfico de la fase 2 que haya
 * adentro de esa raíz (los `[data-grafico]` de cada rama y las piezas `.grafico-base` de la base, sin repetir uno que esté
 * adentro de otro). A cada gráfico se le pone una marca para volver a encontrarlo al estirar la ventana.
 */
async function panelesDe(page, p) {
  const lista = [...(p.paneles ?? [])];
  if (p.graficos) {
    const graficos = await page.evaluate((raiz) => {
      for (const x of document.querySelectorAll('[data-captura-panel]')) x.removeAttribute('data-captura-panel');
      const base = document.querySelector(raiz);
      if (!base) return [];
      const todos = [...base.querySelectorAll('[data-grafico], .grafico-base')].filter((x) => x.getClientRects().length > 0 && x.getBoundingClientRect().height > 24);
      const sueltos = todos.filter((x) => !todos.some((o) => o !== x && o.contains(x)));
      return sueltos.map((x, i) => {
        x.setAttribute('data-captura-panel', String(i));
        const titulo = x.querySelector('.grafico-base__titulo, h3, h4')?.textContent ?? x.getAttribute('aria-label') ?? '';
        return { i, codigo: x.getAttribute('data-grafico') ?? (x.classList.contains('grafico-cinta') ? 'GR-23' : null), titulo: titulo.replace(/\s+/g, ' ').trim().slice(0, 120) };
      });
    }, p.graficos);
    const usados = new Map();
    for (const g of graficos) {
      let nombre = g.codigo ? `${enNombre(g.codigo).replace('-', '')}${g.codigo === 'GR-23' ? '-cinta' : ''}` : `grafico-${enNombre(g.titulo) || g.i + 1}`;
      const n = (usados.get(nombre) ?? 0) + 1;
      usados.set(nombre, n);
      if (n > 1) nombre = `${nombre}-${n}`;
      lista.push({ nombre, selector: `[data-captura-panel="${g.i}"]`, titulo: g.titulo });
    }
  }
  return lista;
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

// ─── Cómo se llega a cada pieza ─────────────────────────────────────────────────────────────────────────────────

/**
 * La estación de Entrenamiento de Diego con un borrador: «Ajustar el plan» (`crear=vigente`, ED-16) lo crea desde la
 * versión vigente la primera vez y, si ya hay uno, lo abre. La base es efímera: el borrador no le llega a nadie.
 */
async function abrirLaEstacion(page, persona) {
  await cerrarCuadros(page);
  const ya = await page.evaluate(
    (id) => location.pathname.startsWith('/pro/advisees/training') && new URLSearchParams(location.search).get('id') === id && !!document.querySelector('[data-estacion] [data-zona="editor"]'),
    persona,
  );
  if (ya) return;
  await ir(page, `/pro/advisees/training?id=${persona}&vista=plan&crear=vigente`);
  await visible(page, '[data-estacion] [data-zona="editor"]', null, 45_000);
  await asentar(page);
}

/**
 * El cuadro lateral de un ejercicio de la sesión abierta: «Detalle y fuerza estimada» si es de la lista de la v1 (ED-75)
 * o «La vez pasada» si no (GR-01). Abre los ejercicios de a uno hasta encontrar el botón, como un profesional.
 */
async function abrirElCuadroDelEjercicio(page, persona, conFuerza) {
  await abrirLaEstacion(page, persona);
  const boton = conFuerza ? '[data-detalle-con-fuerza]' : '[data-la-vez-pasada-del-ejercicio]';
  const total = await page.$$eval('[data-ejercicio]', (xs) => xs.length);
  let elegido = null;
  for (let i = 1; i <= total && !elegido; i++) {
    const abierto = await page.$eval(`[data-ejercicio="${i}"]`, (e) => e.hasAttribute('data-abierta'));
    if (!abierto) await clic(page, `[data-ejercicio="${i}"] .comida-del-plan__boton`);
    if (await page.$(`[data-ejercicio="${i}"] ${boton}`)) elegido = i;
    else await clic(page, `[data-ejercicio="${i}"] .comida-del-plan__boton`);
  }
  if (!elegido) throw new Error(`ningún ejercicio de la sesión abierta tiene ${conFuerza ? '«Detalle y fuerza estimada»' : '«La vez pasada» en su cuadro propio'}`);
  const nombre = await page.$eval(`[data-ejercicio="${elegido}"] .comida-del-plan__nombre`, (e) => e.textContent.trim());
  await clic(page, `[data-ejercicio="${elegido}"] ${boton}`);
  await visible(page, 'dialog[open]', null, 20_000);
  return { ejercicio: elegido, nombre };
}

/** Busca en el cajón «Agregar ejercicio» y cuenta los resultados con la marca «Con historial». */
async function buscarEnElCajon(page, termino, espera) {
  const campo = 'dialog[open] form[role="search"] input[type="search"]';
  await visible(page, campo);
  await page.click(campo, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type(campo, termino);
  await page.keyboard.press('Enter');
  // La lista nueva dice el texto buscado entre comillas («con «barra»» o «Ningún ejercicio coincide con «barra»»): así
  // no se confunde con la de la búsqueda anterior.
  await page.waitForFunction(
    (t) => {
      const s = document.querySelector('dialog[open] [data-resultados]');
      return s && ((s.getAttribute('data-resultados') === 'lista' && s.textContent.includes(`«${t}»`)) || s.getAttribute('data-resultados') === 'falla');
    },
    { timeout: 25_000, polling: 200 },
    termino,
  );
  // El historial se lee una vez, al abrir el cajón: la marca puede llegar después que los resultados.
  await page.waitForSelector('dialog[open] [data-con-historial], dialog[open] [data-historial-sin-leer]', { timeout: espera }).catch(() => {});
  await asentar(page);
  return page.$$eval('dialog[open] [data-con-historial]', (xs) => xs.length);
}

/** «Patrones» es una vista de la ficha cuando la rama E la monta: si la pestaña elegida no es esa, la rama no la tiene. */
async function exigirPatrones(page) {
  const actual = await siAparece(page, 'nav.pestanas a[aria-current="page"]', null, 20_000);
  const texto = actual ? await actual.evaluate((e) => e.textContent.trim()) : '';
  if (!texto.includes('Patrones')) {
    throw new NoEstaEnLaRama('la vista «Patrones» de la ficha la monta la rama E (wp-graficos-patrones-y-enfoques): en esta rama la ficha no la tiene y abre el Resumen.');
  }
}

/**
 * GR-26 renombra los modos de «Analizar»: sin «Alineadas» en la pantalla, la rama todavía tiene «Separadas» y «Juntas» (y
 * su diccionario no conoce las series nuevas, como el 1RM estimado), así que la pantalla no es la de la rama D.
 */
async function exigirAlineadas(page, nota) {
  await siAparece(page, 'fieldset.segmentos, .analizar__lienzo', null, 25_000);
  await asentar(page);
  if (!(await page.evaluate(() => document.body.textContent.includes('Alineadas')))) {
    throw new NoEstaEnLaRama('«Alineadas» y «Superpuestas» (GR-26) los monta la rama D (wp-graficos-cruces-y-analizar): en esta rama, «Analizar» dice «Separadas» y «Juntas».');
  }
  if (!(await page.$('fieldset.segmentos'))) throw new Error('«Analizar» no mostró «Ver como» con estas métricas');
  const elegido = await page.evaluate(() => document.querySelector('label.modo-elegible input[type="radio"]:checked')?.closest('label')?.textContent.trim() ?? null);
  if (elegido) nota(`modo elegido: «${elegido}»`);
  const motivos = await page.$$eval('.modo-no-disponible', (xs) => xs.map((x) => x.textContent.trim()));
  for (const m of motivos) nota(`modo apagado: «${m}»`);
}

// ─── Las pantallas ──────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Cada pantalla: su nombre, el ID de la propuesta, de dónde sale (la fase 1, en main, o la rama que la monta), qué se ve,
 * cómo se llega (`llegar`, que tira `NoEstaEnLaRama` si la rama no la tiene), qué se lleva a la vista antes de cada
 * captura (`enfocar`), qué paneles se recortan si no entran (`paneles`, y `graficos`: la raíz donde se buscan los
 * gráficos de la fase 2), si va también la página entera (`entera`) y qué hacer en cada tamaño antes de capturar
 * (`antes`).
 */
function pantallas({ diego, versiones }) {
  const enLaFicha = (params) => `/pro/advisees?${new URLSearchParams({ id: diego, ...params }).toString()}`;
  const trn = versiones.ENTRENAMIENTO ?? [];
  const nut = versiones.NUTRICION ?? [];
  const historial = (paso) => async (page, nota) => {
    const { nombre } = await abrirElCuadroDelEjercicio(page, diego, true);
    const boton = paso === 'historial' ? '[data-abrir-historial]' : '[data-abrir-perfil]';
    if (!(await siAparece(page, `dialog[open] ${boton}`, null, 6_000))) {
      throw new NoEstaEnLaRama(
        paso === 'historial'
          ? 'el historial del ejercicio («En el tiempo»: GR-02, GR-03, GR-05 y la cinta GR-23) lo monta la rama B (wp-graficos-entrenamiento): en esta rama el cuadro no tiene «Ver el historial».'
          : 'el perfil carga-repeticiones (GR-06) lo monta la rama B (wp-graficos-entrenamiento): en esta rama el cuadro no lo ofrece.',
      );
    }
    await clic(page, `dialog[open] ${boton}`);
    await visible(page, `dialog[open] [data-historial-del-ejercicio="${paso}"]`, null, 30_000);
    nota(`ejercicio: ${nombre}; período: el de entrada (12 semanas)`);
  };
  const dosEtapas = (area) => async (page, nota) => {
    const lista = area === 'ENTRENAMIENTO' ? trn : nut;
    if (lista.length < 2) throw new Error(`la cohorte no dejó dos versiones activadas de ${area}`);
    const params = { vista: 'analizar', pregunta: 'comparar-etapas', area, etapaA: lista.at(-2), etapaB: lista.at(-1) };
    if (area === 'ENTRENAMIENTO') Object.assign(params, { ejercicio: `e:${SENTADILLA}`, serie: '1', unidad: 'kg' });
    await ir(page, enLaFicha(params));
    await visible(page, '.comparacion-de-etapas', null, 30_000);
    await esperarQueCargue(page, nota, '.comparacion-de-etapas');
    nota(`etapas: las dos últimas versiones activadas del plan de ${area === 'ENTRENAMIENTO' ? 'Entrenamiento («Fuerza 2» y «Fuerza 3»), con la sentadilla, serie 1, en kg' : 'Nutrición'}`);
    if (!(await page.$('.etapas-lado-a-lado'))) nota('sin «Lado a lado, con todas las observaciones» (GR-24): llega con la rama D (wp-graficos-cruces-y-analizar)');
  };
  const patrones = { entera: true, graficos: '.ficha__cuerpo', enfocar: (page) => page.evaluate(() => window.scrollTo(0, 0)) };
  return {
    PRO_T: [
      {
        nombre: '01-gr04-buscador-con-historial',
        codigo: 'GR-04',
        de: 'fase 1 (main, #273)',
        que: '«Agregar ejercicio» del editor de Entrenamiento: cada resultado que la persona ya hizo dice «Con historial · N sesiones · la última el …», y arriba de los resultados, una vez, qué cuenta la marca.',
        llegar: async (page, nota) => {
          await abrirLaEstacion(page, diego);
          await clic(page, '[data-agregar-ejercicio]');
          let mejor = { termino: null, cuantos: -1 };
          let ultimo = null;
          for (const [i, termino] of BUSQUEDAS.entries()) {
            const cuantos = await buscarEnElCajon(page, termino, i === 0 ? 15_000 : 4_000);
            ultimo = termino;
            if (cuantos > mejor.cuantos) mejor = { termino, cuantos };
            if (cuantos >= 3) break;
          }
          if (mejor.termino !== ultimo) await buscarEnElCajon(page, mejor.termino, 4_000);
          const total = await page.$$eval('dialog[open] [data-ejercicio-del-catalogo]', (xs) => xs.length);
          nota(`búsqueda: «${mejor.termino}»; ${mejor.cuantos} de ${total} resultados llevan la marca`);
          if (await page.$('dialog[open] [data-historial-sin-leer]')) nota('el cajón dice que no pudo leer el historial');
        },
        // El principio de los resultados (cuántos son y qué cuenta la marca); si así no se ve ninguna marca, la primera.
        enfocar: (page) =>
          page.evaluate(() => {
            document.querySelector('dialog[open] [data-resultados]')?.scrollIntoView({ block: 'start' });
            const fila = document.querySelector('dialog[open] [data-con-historial]')?.closest('tr');
            if (fila && fila.getBoundingClientRect().bottom > innerHeight - 260) fila.scrollIntoView({ block: 'center' });
          }),
        paneles: [{ nombre: 'resultados', selector: 'dialog[open] .agregar-item__resultados' }],
      },
      {
        nombre: '02-gr01-la-vez-pasada-con-fuerza',
        codigo: 'GR-01',
        de: 'fase 1 (main, #273)',
        que: '«La vez pasada» dentro de «Detalle y fuerza estimada», en un ejercicio de la lista de la v1: las últimas tres veces, serie por serie, debajo de «Lo que indica el plan» y antes de la tarjeta de la fuerza.',
        llegar: async (page, nota) => {
          const { nombre } = await abrirElCuadroDelEjercicio(page, diego, true);
          await visible(page, 'dialog[open] [data-la-vez-pasada]', null, 20_000);
          await esperarQueCargue(page, nota, 'dialog[open]');
          const veces = await page.$$eval('dialog[open] [data-la-vez-pasada] [data-vez]', (xs) => xs.length);
          nota(`ejercicio: ${nombre}; ${veces} veces en la tabla`);
        },
        enfocar: 'dialog[open] [data-la-vez-pasada]',
        paneles: [{ nombre: 'la-vez-pasada', selector: 'dialog[open] [data-la-vez-pasada]' }],
      },
      {
        nombre: '03-gr02-gr03-gr05-historial-del-ejercicio',
        codigo: 'GR-02, GR-03, GR-05 y GR-23',
        de: 'rama B (wp-graficos-entrenamiento)',
        que: 'El paso «Historial» del cuadro del ejercicio: el 1RM estimado (Epley v1) sesión a sesión con las versiones del plan de fondo (GR-02), carga, repeticiones y RIR de la misma serie en paneles alineados (GR-03), el RIR indicado y el registrado (GR-05) y, debajo, la cinta del tiempo (GR-23).',
        llegar: historial('historial'),
        enfocar: 'dialog[open] [data-historial-del-ejercicio]',
        graficos: 'dialog[open]',
      },
      {
        nombre: '04-gr06-perfil-carga-y-repeticiones',
        codigo: 'GR-06',
        de: 'rama B (wp-graficos-entrenamiento)',
        que: 'El paso «Perfil» del cuadro del ejercicio: la carga frente a las repeticiones equivalentes, con las últimas 4 semanas distinguidas de las anteriores.',
        llegar: historial('perfil'),
        enfocar: 'dialog[open] [data-historial-del-ejercicio]',
        graficos: 'dialog[open]',
      },
      {
        nombre: '05-gr01-la-vez-pasada-sin-fuerza',
        codigo: 'GR-01',
        de: 'fase 1 (main, #273)',
        que: '«La vez pasada» en su propio cuadro lateral, para un ejercicio fuera de la lista de la v1: «Lo que indica el plan» arriba y lo registrado abajo, sin la fuerza estimada.',
        llegar: async (page, nota) => {
          const { nombre } = await abrirElCuadroDelEjercicio(page, diego, false);
          await visible(page, 'dialog[open] [data-la-vez-pasada]', null, 20_000);
          await esperarQueCargue(page, nota, 'dialog[open]');
          const veces = await page.$$eval('dialog[open] [data-la-vez-pasada] [data-vez]', (xs) => xs.length);
          nota(`ejercicio: ${nombre}; ${veces} veces en la tabla`);
        },
        enfocar: 'dialog[open] [data-la-vez-pasada]',
        paneles: [{ nombre: 'la-vez-pasada', selector: 'dialog[open] [data-la-vez-pasada]' }],
      },
      {
        nombre: '06-patrones-en-la-estacion',
        codigo: 'GR-27 y «Patrones»',
        de: 'rama E (wp-graficos-patrones-y-enfoques)',
        que: 'La pestaña «Patrones» del panel de la estación de Entrenamiento: el enfoque del plan (o el de la persona) y sus gráficos, en densidad compacta.',
        llegar: async (page) => {
          await abrirLaEstacion(page, diego);
          const pestana = await page.evaluate(() => [...document.querySelectorAll('.estacion__pestanas [role="tab"]')].some((e) => e.textContent.includes('Patrones')));
          if (!pestana) throw new NoEstaEnLaRama('la pestaña «Patrones» del panel de la estación la monta la rama E (wp-graficos-patrones-y-enfoques): en esta rama el panel no la tiene.');
          await clic(page, '.estacion__pestanas [role="tab"]', 'Patrones');
        },
        // En 1280 y en 1024 el panel va plegado: se abre para ver la pestaña.
        antes: async (page) => {
          const plegado = await page.$('[data-abrir-panel][aria-expanded="false"]');
          if (plegado && (await plegado.evaluate((e) => e.getClientRects().length > 0))) {
            await plegado.click();
            await asentar(page);
          }
        },
        enfocar: '#zona-panel',
        paneles: [{ nombre: 'panel', selector: '#zona-panel' }],
        graficos: '#zona-panel',
      },
      {
        nombre: '07-gr02-fuerza-en-analizar',
        codigo: 'GR-02',
        de: 'main (ED-74); con el ruido por versión, la rama B',
        que: '«Analizar · Fuerza estimada» de la sentadilla en el último año: el 1RM estimado (Epley v1) por sesión, con las versiones del plan; con la rama B, la mediana del RIR, las repeticiones y el ruido de cada versión, y si cambió lo indicado.',
        llegar: async (page, nota) => {
          await ir(page, enLaFicha({ vista: 'analizar', pregunta: 'fuerza-estimada', ejercicio: SENTADILLA, unidad: 'kg', p: '365' }));
          await visible(page, '[data-fuerza-en-analizar]', null, 30_000);
          await esperarQueCargue(page, nota, '[data-fuerza-en-analizar]');
          if (!(await page.$('[data-lectura-por-version]'))) nota('sin el ruido por versión: es la pieza de ED-74; GR-02 con el ruido llega con la rama B (wp-graficos-entrenamiento)');
        },
        enfocar: '[data-fuerza-en-analizar]',
        paneles: [{ nombre: 'grafico', selector: '.fuerza-en-analizar__zonas' }],
      },
      {
        nombre: '08-gr26-superpuestas-fuerza-y-carga',
        codigo: 'GR-26',
        de: 'rama D (wp-graficos-cruces-y-analizar)',
        que: '«Analizar» en «Superpuestas»: el 1RM estimado y la carga de la serie 1 de la sentadilla en el último año, en el mismo gráfico, cada familia con su eje.',
        llegar: async (page, nota) => {
          await ir(page, enLaFicha({ vista: 'analizar', m: [`entrenamiento.1rm-estimado~e:${SENTADILLA}~~kg`, `entrenamiento.carga~e:${SENTADILLA}~1~kg`].join(','), modo: 'S', p: '365' }));
          await exigirAlineadas(page, nota);
        },
        enfocar: '.analizar__lienzo',
        paneles: [{ nombre: 'grafico', selector: '.analizar__lienzo' }],
      },
      {
        nombre: '09-gr24-dos-etapas-entrenamiento',
        codigo: 'GR-24',
        de: 'main («Comparar dos etapas», C-12); «Lado a lado», la rama D',
        que: '«Comparar dos etapas» con las dos últimas versiones del plan de Entrenamiento y la sentadilla: las tarjetas, la tabla, las métricas en el tiempo y, con la rama D, «Lado a lado, con todas las observaciones».',
        llegar: dosEtapas('ENTRENAMIENTO'),
        enfocar: '.comparacion-de-etapas',
        paneles: [
          { nombre: 'en-el-tiempo', selector: '.comparacion-de-etapas .graficos-de-etapas' },
          { nombre: 'lado-a-lado', selector: '.etapas-lado-a-lado' },
        ],
      },
      {
        nombre: '10-patrones-con-entrenamiento',
        codigo: '«Patrones» y GR-27',
        de: 'rama E (wp-graficos-patrones-y-enfoques)',
        que: 'La vista «Patrones» de la ficha, con lo que ve el entrenador: la cinta arriba, «En el tiempo», «Comparaciones» y «Agregar un gráfico», en el último año.',
        llegar: async (page) => {
          await ir(page, enLaFicha({ vista: 'patrones', p: '365' }));
          await exigirPatrones(page);
        },
        ...patrones,
      },
    ],
    PRO_N: [
      {
        nombre: '11-gr16-desde-el-inicio',
        codigo: 'GR-16',
        de: 'fase 1 (main, #273)',
        que: '«Desde el inicio y desde la anterior» al final de la toma más reciente de «Tomas»: cada medida con su valor, la resta contra la primera toma y contra la anterior, los días entre fechas y la línea del error de medición.',
        llegar: async (page, nota) => {
          await ir(page, `/pro/advisees/anthropometry?id=${diego}&vista=evaluaciones`);
          await visible(page, '[data-desde-el-inicio]', null, 40_000);
          await esperarQueCargue(page, nota, '[data-desde-el-inicio]', 40_000);
          const filas = await page.$$eval('[data-desde-el-inicio] tr[data-medida]', (xs) => xs.length);
          nota(`${filas} filas en la tabla`);
        },
        enfocar: '[data-desde-el-inicio]',
        paneles: [{ nombre: 'desde-el-inicio', selector: '[data-desde-el-inicio]' }],
      },
      {
        nombre: '12-gr14-dia-por-dia',
        codigo: 'GR-14 (y GR-11)',
        de: 'rama C (wp-graficos-nutricion-y-cuerpo)',
        que: '«Día por día» arriba de «Registros» de Nutrición: lo indicado y lo registrado de cada día, en gramos, con las comidas sin registro y las diferentes (30 días).',
        llegar: async (page) => {
          await ir(page, `/pro/advisees/nutrition?id=${diego}&vista=registros&p=30`);
          await asentar(page);
          if (!(await siAparece(page, '.dia-por-dia', null, 15_000))) await faltaOError(page, '«Día por día» (GR-14), arriba de «Registros» de Nutrición, lo monta la rama C (wp-graficos-nutricion-y-cuerpo).');
        },
        enfocar: '.dia-por-dia',
        paneles: [{ nombre: 'dia-por-dia', selector: '.dia-por-dia' }],
        graficos: '.dia-por-dia',
      },
      {
        nombre: '13-gr18-por-sitio',
        codigo: 'GR-18',
        de: 'rama C (wp-graficos-nutricion-y-cuerpo)',
        que: '«Evolución» de Antropometría vista «Por sitio»: cada sitio en dos tomas, en orden anatómico, unidos por un segmento, con la diferencia escrita (90 días).',
        llegar: async (page) => {
          await ir(page, `/pro/advisees/anthropometry?id=${diego}&vista=evolucion&como=sitio&p=90`);
          await visible(page, '.evolucion', null, 30_000);
          if (!(await siAparece(page, '.vistas-de-evolucion', null, 8_000))) await faltaOError(page, '«Por sitio» y «Por método» en «Evolución» los monta la rama C (wp-graficos-nutricion-y-cuerpo).');
        },
        enfocar: '.evolucion__cuerpo',
        paneles: [{ nombre: 'grafico', selector: '.evolucion__cuerpo' }],
      },
      {
        nombre: '14-gr20-por-metodo',
        codigo: 'GR-20',
        de: 'rama C (wp-graficos-nutricion-y-cuerpo)',
        que: '«Evolución» de Antropometría vista «Por método»: la masa grasa según cada método (Durnin-Womersley y otros), un panel por masa con un eje común en kg (90 días).',
        llegar: async (page) => {
          await ir(page, `/pro/advisees/anthropometry?id=${diego}&vista=evolucion&como=metodo&p=90`);
          await visible(page, '.evolucion', null, 30_000);
          if (!(await siAparece(page, '.vistas-de-evolucion', null, 8_000))) await faltaOError(page, '«Por sitio» y «Por método» en «Evolución» los monta la rama C (wp-graficos-nutricion-y-cuerpo).');
        },
        enfocar: '.evolucion__cuerpo',
        paneles: [{ nombre: 'grafico', selector: '.evolucion__cuerpo' }],
      },
      {
        nombre: '15-gr26-superpuestas-energia-y-peso',
        codigo: 'GR-26',
        de: 'rama D (wp-graficos-cruces-y-analizar)',
        que: '«Analizar» en «Superpuestas»: la energía registrada (kcal) y el peso (kg) del último año en el mismo gráfico, con un eje a cada lado y la frase de la coincidencia.',
        llegar: async (page, nota) => {
          await ir(page, enLaFicha({ vista: 'analizar', m: 'nutricion.energia,antropometria.peso', modo: 'S', p: '365' }));
          await exigirAlineadas(page, nota);
        },
        enfocar: '.analizar__lienzo',
        paneles: [{ nombre: 'grafico', selector: '.analizar__lienzo' }],
      },
      {
        nombre: '16-gr26-alineadas-tres-series',
        codigo: 'GR-26',
        de: 'rama D (wp-graficos-cruces-y-analizar)',
        que: '«Analizar» en «Alineadas» (el modo por defecto): la energía, las proteínas y el peso del último año, uno arriba del otro, con el mismo eje de fechas.',
        llegar: async (page, nota) => {
          await ir(page, enLaFicha({ vista: 'analizar', m: 'nutricion.energia,nutricion.proteinas,antropometria.peso', p: '365' }));
          await exigirAlineadas(page, nota);
        },
        enfocar: '.analizar__lienzo',
        paneles: [{ nombre: 'grafico', selector: '.analizar__lienzo' }],
      },
      {
        nombre: '17-gr24-dos-etapas-nutricion',
        codigo: 'GR-24',
        de: 'main («Comparar dos etapas», C-12); «Lado a lado», la rama D',
        que: '«Comparar dos etapas» con las dos últimas versiones del plan de Nutrición: las tarjetas, la tabla, las métricas en el tiempo y, con la rama D, «Lado a lado, con todas las observaciones».',
        llegar: dosEtapas('NUTRICION'),
        enfocar: '.comparacion-de-etapas',
        paneles: [
          { nombre: 'en-el-tiempo', selector: '.comparacion-de-etapas .graficos-de-etapas' },
          { nombre: 'lado-a-lado', selector: '.etapas-lado-a-lado' },
        ],
      },
      {
        nombre: '18-patrones-con-nutricion-y-cuerpo',
        codigo: '«Patrones», GR-27 y SP-02',
        de: 'rama E (wp-graficos-patrones-y-enfoques)',
        que: 'La vista «Patrones» de la ficha, con lo que ve la nutricionista que también lleva Antropometría: los sugeridos para sus áreas (GR-12, GR-13, GR-16 o GR-20) y «Ver la relación» con la energía y el peso (SP-02), en el último año.',
        llegar: async (page) => {
          await ir(page, enLaFicha({ vista: 'patrones', p: '365' }));
          await exigirPatrones(page);
        },
        ...patrones,
      },
      {
        nombre: '19-gr26-arma-tu-grafico',
        codigo: 'GR-26',
        de: 'ramas D y E',
        que: '«Armá tu gráfico», desde «Patrones › Agregar un gráfico»: el compositor con hasta tres series, el modo y la vista previa.',
        llegar: async (page) => {
          await ir(page, enLaFicha({ vista: 'patrones', p: '365' }));
          await exigirPatrones(page);
          const ACCIONES = 'button, a, summary, [role="menuitem"]';
          let boton = await porTexto(page, ACCIONES, 'Armá tu gráfico', 4_000);
          if (!boton) {
            const agregar = await porTexto(page, ACCIONES, 'Agregar un gráfico', 4_000);
            if (agregar) {
              await agregar.evaluate((e) => e.scrollIntoView({ block: 'center' }));
              await agregar.click();
              await asentar(page);
              boton = await porTexto(page, ACCIONES, 'Armá tu gráfico', 6_000);
            }
          }
          if (!boton) throw new NoEstaEnLaRama('«Armá tu gráfico» en «Patrones» lo montan las ramas D y E: en esta rama «Patrones» no lo ofrece.');
          await boton.evaluate((e) => e.scrollIntoView({ block: 'center' }));
          await boton.click();
          await asentar(page);
        },
        paneles: [{ nombre: 'compositor', selector: 'dialog[open]' }],
        graficos: 'body',
      },
      {
        nombre: '20-gr14-por-semana',
        codigo: 'GR-14 (y GR-11)',
        de: 'rama C (wp-graficos-nutricion-y-cuerpo), pasada visual',
        que: 'Lo indicado y lo registrado arriba de «Registros» de Nutrición con 90 días: por semana de entrada (más de seis semanas), con la media de cada semana como barra, las semanas sin media en gris y los días tenues detrás.',
        llegar: async (page, nota) => {
          await ir(page, `/pro/advisees/nutrition?id=${diego}&vista=registros&p=90`);
          await asentar(page);
          if (!(await siAparece(page, '.dia-por-dia', null, 15_000))) await faltaOError(page, 'Lo indicado y lo registrado (GR-14), arriba de «Registros» de Nutrición, lo monta la rama C (wp-graficos-nutricion-y-cuerpo).');
          // Si ninguna semana tiene media, el gráfico arranca día por día (GR-VC12): se elige «Por semana» para verlo.
          if (await siAparece(page, '.dia-por-dia [data-por-semana][aria-pressed="false"]', null, 15_000)) {
            nota('arrancó día por día (ninguna semana con media): se eligió «Por semana»');
            await page.click('.dia-por-dia [data-por-semana]');
            await asentar(page);
          }
        },
        enfocar: '.dia-por-dia',
        paneles: [{ nombre: 'por-semana', selector: '.dia-por-dia' }],
        graficos: '.dia-por-dia',
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
      titulo: document.querySelector('h1')?.textContent?.trim() ?? null,
    };
  });

async function capturarUna(page, p, fila) {
  const nota = (t) => fila.notas.push(t);
  await page.setViewport(LLEGADA);
  await p.llegar(page, nota);
  await esperarQueCargue(page, nota);
  await anotarEstados(page, nota);
  for (const tema of TEMAS) {
    await ponerTema(page, tema);
    for (const [ancho, alto] of TAMANOS) {
      await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
      await pausa(900);
      if (p.antes) await p.antes(page, ancho);
      if (p.enfocar) await enfocar(page, p.enfocar);
      else await page.evaluate(() => window.scrollTo(0, 0));
      await pausa(300);
      const archivo = `${p.nombre}__${tema}__${ancho}.png`;
      await page.screenshot({ path: path.join(salida, archivo) });
      fila.archivos.push(archivo);
      fila.medidas[`${tema}-${ancho}`] = await medir(page);
      for (const panel of await panelesDe(page, p)) {
        if (!(await page.$(panel.selector))) continue;
        if (await enteroALaVista(page, panel.selector)) continue;
        const recorte = `${p.nombre}--${panel.nombre}__${tema}__${ancho}.png`;
        if (await recortar(page, panel.selector, path.join(salida, recorte), ancho, alto).catch(() => false)) {
          fila.archivos.push(recorte);
          if (!fila.recortes.some((r) => r.nombre === panel.nombre)) fila.recortes.push({ nombre: panel.nombre, titulo: panel.titulo ?? null });
        }
        if (p.enfocar) await enfocar(page, p.enfocar);
      }
      if (p.entera) {
        const total = fila.medidas[`${tema}-${ancho}`].alto;
        if (total > alto + 40) {
          // La página entera con la ventana estirada a su alto: con `fullPage`, los gráficos se quedan sin dibujo.
          await page.setViewport({ width: ancho, height: Math.min(total, 9000), deviceScaleFactor: 1 });
          await pausa(900);
          await page.evaluate(() => window.scrollTo(0, 0));
          const entera = `${p.nombre}--entera__${tema}__${ancho}.png`;
          await page.screenshot({ path: path.join(salida, entera) });
          fila.archivos.push(entera);
          await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
          await pausa(500);
        }
      }
    }
  }
}

async function capturarTodo() {
  const estado = JSON.parse(fs.readFileSync(path.join(TRABAJO, 'estado.json'), 'utf8'));
  const persona = estado.personas?.[PERSONA.clave];
  if (!persona?.aseId) throw new Error(`La cohorte no dejó a ${PERSONA.nombre} en estado.json.`);
  const ids = { diego: persona.aseId, versiones: persona.versiones ?? {} };
  const resultado = {
    hoy: estado.hoy ?? null,
    rama: process.env.GITHUB_REF_NAME ?? null,
    commit: process.env.GITHUB_SHA ?? null,
    persona: PERSONA.nombre,
    pantallas: [],
    errores: [],
  };
  const navegador = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--lang=es-AR', '--force-color-profile=srgb'],
    defaultViewport: LLEGADA,
  });
  try {
    for (const [prefijo, todas] of Object.entries(pantallas(ids))) {
      const lista = todas.filter((p) => SOLO.length === 0 || SOLO.some((s) => p.nombre.startsWith(s)));
      if (lista.length === 0) continue;
      const contexto = await navegador.createBrowserContext();
      const page = await contexto.newPage();
      await page.emulateTimezone('America/Argentina/Buenos_Aires');
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      let actual = null;
      page.on('pageerror', (e) => {
        const t = String(e).slice(0, 300);
        resultado.errores.push(`${prefijo}: ${t}`);
        actual?.erroresDeLaPagina.push(t);
      });
      page.on('response', (r) => {
        if (!actual || !r.url().startsWith(API) || r.status() < 400) return;
        const linea = `${r.request().method()} ${new URL(r.url()).pathname} → ${r.status()}`;
        if (!actual.respuestas.includes(linea) && actual.respuestas.length < 12) actual.respuestas.push(linea);
      });
      page.on('dialog', (d) => d.dismiss().catch(() => {}));
      let entrada = null;
      try {
        await entrar(page, prefijo);
      } catch (e) {
        entrada = `no se pudo entrar como ${PROFESIONALES[prefijo]}: ${String(e?.message ?? e).slice(0, 300)}`;
      }
      for (const p of lista) {
        const fila = { pantalla: p.nombre, codigo: p.codigo, de: p.de, que: p.que, profesional: PROFESIONALES[prefijo], estado: 'capturada', motivo: null, notas: [], archivos: [], recortes: [], medidas: {}, erroresDeLaPagina: [], respuestas: [] };
        actual = fila;
        if (entrada) {
          fila.estado = 'falló';
          fila.motivo = entrada;
        } else {
          try {
            await capturarUna(page, p, fila);
          } catch (e) {
            if (e instanceof NoEstaEnLaRama) {
              fila.estado = 'salteada';
              fila.motivo = e.message;
            } else {
              fila.estado = 'falló';
              fila.motivo = String(e?.message ?? e).slice(0, 500);
              const archivo = `${p.nombre}__FALLO.png`;
              if (await page.screenshot({ path: path.join(salida, archivo) }).then(() => true).catch(() => false)) fila.archivos.push(archivo);
            }
          }
          await cerrarCuadros(page).catch(() => {});
          await page.setViewport(LLEGADA).catch(() => {});
        }
        resultado.pantallas.push(fila);
        console.log(`${prefijo} · ${p.nombre}: ${fila.estado}${fila.motivo ? ` (${fila.motivo})` : ''}${fila.notas.length ? ` · ${fila.notas.join(' · ')}` : ''}`);
      }
      actual = null;
      await contexto.close();
    }
  } finally {
    fs.writeFileSync(path.join(salida, 'capturas.json'), `${JSON.stringify(resultado, null, 2)}\n`);
    fs.writeFileSync(path.join(salida, 'indice.md'), indice(resultado));
    await navegador.close();
  }
  return resultado;
}

// ─── El índice ──────────────────────────────────────────────────────────────────────────────────────────────────

const celda = (t) => String(t ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

function indice(r) {
  const n = (estado) => r.pantallas.filter((p) => p.estado === estado);
  const capturadas = n('capturada');
  const salteadas = n('salteada');
  const fallidas = n('falló');
  const l = [];
  l.push('# Capturas de los gráficos (WP-GRAFICOS, DL-174)');
  l.push('');
  l.push(`Rama \`${r.rama ?? '(local)'}\`${r.commit ? `, commit \`${r.commit.slice(0, 8)}\`` : ''}; la cohorte sintética cargada con hoy = ${r.hoy ?? '(sin fecha)'}.`);
  l.push(
    `${capturadas.length} de ${r.pantallas.length} pantallas capturadas, ${salteadas.length} salteadas porque esta rama todavía no las tiene y ${fallidas.length} con una falla. Cada una en Claro y en Azul noche, a 1024 × 768, 1280 × 800, 1440 × 900 y 1920 × 950.`,
  );
  l.push('');
  l.push(`**La persona:** ${PERSONA.nombre}, ${PERSONA.descripcion}`);
  l.push('');
  l.push(
    '**Quién mira:** Prof. Martín Acosta en Entrenamiento y Lic. Sofía Paz en Nutrición y Antropometría, los dos con su segundo factor. Para el editor, la herramienta crea un borrador del plan de Entrenamiento desde la versión vigente («Ajustar el plan»): la base es efímera y el borrador no le llega a nadie.',
  );
  l.push('');
  l.push('## Cómo se leen los nombres');
  l.push('');
  l.push('- `<pantalla>__<tema>__<ancho>.png`: la ventana visible, con lo que importa de la pantalla llevado a la vista.');
  l.push('- `<pantalla>--<panel>__<tema>__<ancho>.png`: el recorte de un panel que no entraba entero en la ventana (la ventana se estira hasta que entra). `gr02`, `gr03`… son los gráficos de cada rama por su ID; `gr23-cinta`, la cinta del tiempo; `grafico-…`, una pieza de la base por su título.');
  l.push('- `<pantalla>--entera__<tema>__<ancho>.png`: la página entera, con la ventana estirada a su alto.');
  l.push('- `<pantalla>__FALLO.png`: cómo estaba la pantalla cuando falló.');
  l.push('');
  l.push('## Las pantallas');
  l.push('');
  l.push('| Pantalla | ID | De dónde | Quién mira | Qué se ve | Estado | Imágenes |');
  l.push('|---|---|---|---|---|---|---|');
  for (const p of r.pantallas) {
    const estado = p.estado === 'capturada' ? 'capturada' : p.estado === 'salteada' ? 'salteada: no está en esta rama' : 'falló';
    l.push(`| \`${p.pantalla}\` | ${celda(p.codigo)} | ${celda(p.de)} | ${celda(p.profesional)} | ${celda(p.que)} | ${estado} | ${p.archivos.length} |`);
  }
  l.push('');
  if (capturadas.length) {
    l.push('## Lo que se anotó al capturar');
    l.push('');
    for (const p of capturadas) {
      const partes = [...p.notas];
      if (p.recortes.length) partes.push(`paneles recortados: ${p.recortes.map((x) => (x.titulo ? `\`${x.nombre}\` («${x.titulo}»)` : `\`${x.nombre}\``)).join(', ')}`);
      if (p.respuestas.length) partes.push(`la API respondió con error a: ${p.respuestas.join('; ')}`);
      if (p.erroresDeLaPagina.length) partes.push(`errores de la página: ${p.erroresDeLaPagina.slice(0, 3).join(' | ')}`);
      l.push(`- \`${p.pantalla}\`: ${partes.length ? partes.join('; ') : 'sin novedades'}.`);
    }
    l.push('');
  }
  l.push('## Lo que no se pudo capturar y por qué');
  l.push('');
  if (!salteadas.length && !fallidas.length) l.push('Nada: todas las pantallas de la lista se capturaron.');
  for (const p of salteadas) l.push(`- \`${p.pantalla}\` (${celda(p.codigo)}): ${p.motivo}`);
  for (const p of fallidas) {
    const extra = [p.respuestas.length ? `la API respondió con error a: ${p.respuestas.join('; ')}` : null, p.erroresDeLaPagina.length ? `errores de la página: ${p.erroresDeLaPagina.slice(0, 3).join(' | ')}` : null].filter(Boolean);
    l.push(`- \`${p.pantalla}\` (${celda(p.codigo)}): **falló**: ${p.motivo}${extra.length ? `. ${extra.join('; ')}` : ''}${p.archivos.includes(`${p.pantalla}__FALLO.png`) ? ` (ver \`${p.pantalla}__FALLO.png\`)` : ''}.`);
  }
  l.push('');
  l.push(
    'GR-11, GR-12 y GR-13 (las temporadas, la energía por día y los macros en paneles) no tienen un lugar propio fuera de «Patrones»: se ven ahí cuando llegue la rama E. La cinta del tiempo (GR-23) está en main desde #276, pero solo la monta el historial del ejercicio (rama B) y, cuando lleguen, «Analizar» y «Patrones».',
  );
  l.push('');
  const desbordes = r.pantallas.flatMap((p) => Object.entries(p.medidas).filter(([, m]) => m.desbordeHorizontal > 0).map(([k, m]) => `\`${p.pantalla}\` en ${k}: ${m.desbordeHorizontal} px (${m.desbordan.join(', ')})`));
  l.push('## Desbordes a lo ancho');
  l.push('');
  l.push(desbordes.length ? desbordes.map((d) => `- ${d}`).join('\n') : 'Ninguna captura desborda a lo ancho.');
  l.push('');
  return `${l.join('\n')}\n`;
}

/** Un resumen corto en la página de la corrida (GitHub Actions), para ver qué salió sin bajar el artefacto. */
function resumenDeLaCorrida(r) {
  const destino = process.env.GITHUB_STEP_SUMMARY;
  if (!destino) return;
  const l = ['### Capturas de los gráficos', '', '| Pantalla | Estado | Imágenes | Motivo o notas |', '|---|---|---|---|'];
  for (const p of r.pantallas) l.push(`| \`${p.pantalla}\` | ${p.estado} | ${p.archivos.length} | ${celda(p.motivo ?? p.notas.join(' · '))} |`);
  fs.appendFileSync(destino, `${l.join('\n')}\n`);
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
  resumenDeLaCorrida(r);
  const cuenta = (e) => r.pantallas.filter((p) => p.estado === e).length;
  console.log(`${cuenta('capturada')} capturadas, ${cuenta('salteada')} salteadas (no están en esta rama) y ${cuenta('falló')} con una falla, de ${r.pantallas.length}; errores de la página: ${r.errores.length ? r.errores.slice(0, 8).join(' | ') : 'ninguno'}`);
  // Una pantalla que falla queda en el índice y no corta nada: la corrida solo falla si no se pudo capturar ninguna.
  if (cuenta('capturada') === 0) process.exitCode = 1;
} finally {
  fs.writeFileSync(path.join(salida, 'api.log'), registroDeLaApi.join(''));
  web?.kill();
  await parar(api);
}
