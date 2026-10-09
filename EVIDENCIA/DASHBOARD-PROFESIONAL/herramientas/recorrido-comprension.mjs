// Recorrido de WP-DASHBOARD-COMPRENSION: Chrome contra la web y la API locales, con los escenarios D y E de
// `datos/comprension.mjs` (fases `comprension`, `comprension-e` y `verificar-comprension` de `datos/generar.mjs`).
//
// Uso: BE_TRABAJO=<carpeta> node recorrido-comprension.mjs mirar [ancho] [tema] | capturas | funcional | revocacion
//
// - `mirar`: cada pantalla nueva de la ficha, con su captura, su texto, axe, el desborde de costado y los paneles con
//   desplazamiento propio (doble desplazamiento). Sirve para mirar la pantalla de verdad, no para dar nada por aprobado.
// - `capturas`: las capturas «después» de las tres vistas (las mismas que las «antes»: 1440, 1280 y 1024 px en los dos
//   temas), las pantallas nuevas y los estados críticos, con lo que se dibujó comprobado.
// - `funcional`: los recorridos 1, 2, 3, 4 y 6 del encargo (§12) y los criterios CP que se prueban en el navegador, con
//   el resultado esperado calculado aparte (de la API o del escenario). El recorrido 2 registra una revisión sintética:
//   cambia el corte de Entrenamiento del escenario D, por eso va al final.
// - `revocacion`: el recorrido 5 con las cuentas descartables (`datos/generar.mjs descartable-cuentas` y
//   `descartable-datos`, con la API reiniciada con `demo-profesionales-descartable.txt`): el escenario D no se toca.
// - Una sesión por navegador (el límite de inicios es 5 cada 15 minutos). La sesión vive en memoria: se navega con el
//   router, sin recargar. No pasar de ~90 lecturas por minuto (el límite es 120).
// - Las capturas no usan `fullPage` (ver `captura` en recorrido.mjs): se agranda la ventana al alto de la página.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { enTrabajo, REPO } from './rutas.mjs';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const [modo = 'mirar', anchoPedido = '1440', temaPedido = 'azul-noche'] = process.argv.slice(2);
const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const WEB = 'http://localhost:3000';
const API = 'http://localhost:3001';
const CRED = 'clave-sintetica-de-prueba-01';
const AXE = fs.readFileSync(`${REPO}/node_modules/axe-core/axe.min.js`, 'utf8');
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const hoy = estado.hoy;
const diaMenos = (fecha, n) => new Date(Date.parse(`${fecha}T12:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);
const FICHA_A = `/pro/advisees?id=${estado.aseId}`;
const FICHA_E = estado.escenarioE ? `/pro/advisees?id=${estado.escenarioE.aseEId}` : null;
const TRES = 'nutricion.energia,nutricion.proteinas,antropometria.peso';
const ZONA = 'America/Argentina/Buenos_Aires';
/** «19 sept 2026»: la fecha civil de un instante en la zona del asesorado, como la ficha. */
const diaDe = (instante) => new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeZone: ZONA }).format(new Date(instante));
const fechaCivilDe = (instante) => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(instante));

// ─── Resultados ───────────────────────────────────────────────────────────────────────────────

const resultados = [];
function comprobar(clave, descripcion, ok, detalle = '') {
  resultados.push({ clave, descripcion, ok: Boolean(ok), detalle: String(detalle).slice(0, 800) });
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${clave} · ${descripcion}${detalle ? ` — ${String(detalle).slice(0, 220)}` : ''}`);
}
function informar(clave, descripcion, detalle) {
  resultados.push({ clave, descripcion, ok: true, informativo: true, detalle: String(detalle).slice(0, 800) });
  console.log(`DATO  ${clave} · ${descripcion} — ${String(detalle).slice(0, 220)}`);
}
/** Una parte del recorrido: si falla, se anota y sigue la siguiente. */
async function parte(clave, nombre, fn) {
  try {
    await fn();
  } catch (e) {
    comprobar(clave, `${nombre}: el recorrido llegó al final`, false, e instanceof Error ? e.message : String(e));
  }
}

// ─── Navegador ────────────────────────────────────────────────────────────────────────────────

const CORS = { 'Access-Control-Allow-Origin': WEB, 'Access-Control-Expose-Headers': 'x-request-id', Vary: 'Origin' };
const PREFLIGHT = { ...CORS, 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'Access-Control-Allow-Headers': '*', 'Access-Control-Max-Age': '5' };

/**
 * Un navegador con una pestaña. `v` vigila los pedidos a la API: los que están en vuelo, las URL (para comprobar que
 * ningún texto viaja en una), los cuerpos de las búsquedas, las respuestas con error, y el token de la sesión (para leer
 * la API como la página). Las reglas de `v.reglas` simulan una respuesta lenta, una falla o un conflicto sin tocar la API.
 */
async function abrir(ancho, { descargas = null } = {}) {
  const navegador = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--lang=es-AR'],
    defaultViewport: { width: ancho, height: 900 },
  });
  const page = await navegador.newPage();
  const v = { enVuelo: 0, ultimo: Date.now(), marcas: [], errores: [], malas: [], urls: [], cuerpos: [], reglas: [], token: null };
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    const url = req.url();
    if (url.startsWith(API)) {
      v.urls.push(`${req.method()} ${url}`);
      if (req.method() === 'POST' && /\/search$/.test(new URL(url).pathname)) v.cuerpos.push({ url, cuerpo: req.postData() ?? '' });
      if (req.headers().authorization) v.token = req.headers().authorization;
      if (req.method() !== 'OPTIONS') {
        v.enVuelo++;
        v.ultimo = Date.now();
        v.marcas.push(Date.now());
      }
    }
    const regla = v.reglas.find((r) => r.coincide(url, req.method()));
    if (!regla) return req.continue();
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: PREFLIGHT });
    if (regla.accion === 'demorar') {
      await pausa(regla.ms);
      return req.continue();
    }
    return req.respond({ status: regla.status, headers: CORS, contentType: 'application/json; charset=utf-8', body: JSON.stringify({ error: { code: regla.codigo, message: 'Falla simulada por el recorrido.' } }) });
  });
  const fin = (r) => {
    if (r.url().startsWith(API) && r.method() !== 'OPTIONS') {
      v.enVuelo = Math.max(0, v.enVuelo - 1);
      v.ultimo = Date.now();
    }
  };
  page.on('requestfinished', fin);
  page.on('requestfailed', fin);
  page.on('response', (r) => r.url().startsWith(API) && r.status() >= 400 && v.malas.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname.replace(/[0-9a-f-]{36}/g, ':id')}`));
  page.on('pageerror', (e) => v.errores.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && v.errores.push(m.text()));
  if (descargas) {
    const cdp = await navegador.target().createCDPSession();
    await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: descargas, eventsEnabled: true });
  }
  return { navegador, page, v };
}

async function quieto(page, v, { silencio = 600, maximo = 40_000 } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < maximo) {
    const cargando = await page.evaluate(() => document.querySelectorAll('.cargando').length);
    if (v.enVuelo === 0 && Date.now() - Math.max(v.ultimo, t0) >= silencio && cargando === 0) {
      await pausa(150);
      return Math.max(0, v.ultimo - t0);
    }
    await pausa(100);
  }
  throw new Error(`la página no terminó de cargar (${v.enVuelo} pedidos en vuelo)`);
}

/** No pasar de ~90 lecturas en un minuto móvil (el límite de la API es 120 en una ventana fija de 60 s). */
async function cupo(v, maximo = 90) {
  for (;;) {
    const ahora = Date.now();
    v.marcas = v.marcas.filter((t) => ahora - t < 61_000);
    if (v.marcas.length <= maximo) return;
    await pausa(1000);
  }
}

async function iniciarSesion(page, correo, destino) {
  await page.goto(`${WEB}/login?volver=${encodeURIComponent(destino)}`, { waitUntil: 'networkidle0' });
  await page.type('#correo', correo);
  await page.type('#contrasena', CRED);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
  await page.waitForFunction((r) => location.pathname.startsWith(r), { timeout: 60_000 }, destino.split('?')[0]);
}

/** Lee la API como la página (con su sesión), para calcular aparte lo esperado. */
async function leerApi(v, ruta) {
  const r = await fetch(`${API}/api/v1${ruta}`, { headers: { Authorization: v.token, 'X-BE-Surface': 'WEB', Accept: 'application/json' } });
  v.marcas.push(Date.now());
  if (!r.ok) throw new Error(`${ruta.replace(/[0-9a-f-]{36}/g, ':id')}: ${r.status}`);
  return r.json();
}

const ir = (page, url) => page.evaluate((u) => window.next.router.push(u), url);
const parametros = (page) => new URL(page.url()).searchParams;
const texto = (page, s) => page.evaluate((s) => document.querySelector(s)?.innerText.replace(/\s+/g, ' ').trim() ?? '', s);
const textos = (page, s) => page.evaluate((s) => [...document.querySelectorAll(s)].map((e) => e.innerText.replace(/\s+/g, ' ').trim()), s);
const sinDesborde = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1);
/** Las escrituras que hizo la página (las búsquedas por cuerpo y el inicio de sesión no escriben nada). */
const escrituras = (v, desde = 0) =>
  v.urls.slice(desde).filter((u) => /^(POST|PUT|PATCH|DELETE) /.test(u) && !/\/search(\?|$)/.test(u) && !/\/auth\/sessions/.test(u));

/** Hace clic (con el mouse) en el primer elemento visible y habilitado que contiene el texto. */
async function clic(page, selector, contiene) {
  const marca = `r${Math.random().toString(36).slice(2)}`;
  const ok = await page.evaluate(
    (s, t, m) => {
      const el = [...document.querySelectorAll(s)].find((e) => e.textContent.replace(/\s+/g, ' ').includes(t) && !e.disabled && e.getClientRects().length > 0);
      if (!el) return false;
      el.setAttribute('data-recorrido', m);
      el.scrollIntoView({ block: 'center' });
      return true;
    },
    selector,
    contiene,
    marca,
  );
  if (!ok) throw new Error(`no encontré «${contiene}» en ${selector}`);
  await page.click(`[data-recorrido="${marca}"]`);
  return marca;
}

/** Elige en el `<select>` cuya etiqueta contiene el texto: la opción `valor`, la que empieza con `textoDeOpcion`, o la primera con valor. */
async function elegir(page, contenedor, etiqueta, { valor = null, textoDeOpcion = null } = {}) {
  const marca = `s${Math.random().toString(36).slice(2)}`;
  const elegido = await page.evaluate(
    (c, e, m, val, txt) => {
      const label = [...document.querySelectorAll(`${c} label`)].find((l) => l.textContent.includes(e));
      const sel = label ? document.getElementById(label.htmlFor) : null;
      if (!sel) return null;
      sel.setAttribute('data-recorrido', m);
      if (val) return val;
      const opciones = [...sel.options].filter((o) => o.value);
      return (txt ? opciones.find((o) => o.textContent.trim().startsWith(txt)) : opciones[0])?.value ?? null;
    },
    contenedor,
    etiqueta,
    marca,
    valor,
    textoDeOpcion,
  );
  if (elegido === null) throw new Error(`no encontré el campo «${etiqueta}» o la opción «${textoDeOpcion ?? valor ?? 'primera'}»`);
  await page.select(`[data-recorrido="${marca}"]`, elegido);
  return elegido;
}

/** Abre un <details> si está cerrado (con un clic en su resumen, como lo haría una persona). */
async function abrirDetalles(page, selector) {
  const cerrado = await page.evaluate((s) => {
    const d = document.querySelector(s);
    return d ? !d.open : false;
  }, selector);
  if (cerrado) await page.click(`${selector} > summary`);
}

/** Lleva un campo de fecha a un valor, como lo haría el selector del navegador (el evento que escucha React). */
async function fijarFecha(page, selector, valor) {
  await page.evaluate(
    (s, val) => {
      const el = document.querySelector(s);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    selector,
    valor,
  );
}

async function axe(page) {
  await page.evaluate(AXE);
  return page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
    return r.violations.map((x) => ({ id: x.id, impacto: x.impact, nodos: x.nodes.length, ejemplo: x.nodes[0]?.target?.join(' ') ?? '' }));
  });
}

/**
 * Los paneles con desplazamiento vertical propio dentro de la página (doble desplazamiento): un elemento que recorta en
 * vertical y tiene más contenido que alto. Las tablas que se desplazan de costado y las pestañas no cuentan.
 */
const doblesDesplazamientos = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('main *')]
      .filter((el) => {
        const cs = getComputedStyle(el);
        return /(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0;
      })
      .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} (${el.clientHeight}/${el.scrollHeight})`),
  );

/** Los gráficos dibujados: superficie, curvas y marcas con su clase de dato. */
const graficos = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('figure.grafico__figura')].map((f) => ({
      titulo: f.querySelector('.grafico__titulo')?.textContent ?? '',
      svg: !!f.querySelector('svg.recharts-surface'),
      curvas: f.querySelectorAll('path.recharts-line-curve').length,
      clases: [...new Set([...f.querySelectorAll('[data-clase]')].map((g) => g.getAttribute('data-clase')))],
    })),
  );

async function captura(page, v, carpeta, nombre, tope = 9000) {
  const path = fileURLToPath(new URL(`${nombre}.png`, carpeta));
  const vista = page.viewport();
  let alto = vista.height;
  for (let i = 0; i < 4; i++) {
    const total = Math.min(tope, await page.evaluate(() => document.documentElement.scrollHeight));
    if (total === alto && i > 0) break;
    alto = Math.max(total, vista.height);
    await page.setViewport({ width: vista.width, height: alto });
    await quieto(page, v, { silencio: 300 });
  }
  let figuras = [];
  for (let i = 0; i < 25; i++) {
    figuras = await graficos(page);
    if (figuras.every((x) => x.svg && x.curvas > 0)) break;
    await pausa(200);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await pausa(200);
  await page.screenshot({ path });
  await page.setViewport(vista);
  await quieto(page, v, { silencio: 300 });
  return { figuras: figuras.length, dibujadas: figuras.filter((x) => x.svg && x.curvas > 0).length };
}

/** Espera el CSV que descargó la página (la carpeta se vacía al empezar). */
async function esperarCsv(carpeta, anteriores = []) {
  for (let i = 0; i < 40; i++) {
    const archivo = fs.readdirSync(carpeta).find((x) => x.endsWith('.csv') && !anteriores.includes(x));
    if (archivo) return { archivo, csv: fs.readFileSync(`${carpeta}/${archivo}`, 'utf8') };
    await pausa(250);
  }
  return { archivo: null, csv: '' };
}

// ─── Mirar ────────────────────────────────────────────────────────────────────────────────────

async function mirar() {
  const ancho = Number(anchoPedido);
  const carpeta = enTrabajo('mirar-comprension/');
  fs.mkdirSync(carpeta, { recursive: true });
  const { navegador, page, v } = await abrir(ancho);
  const informe = [];
  /** Una pantalla: llegar (`llegar`), esperar, capturar y medir. Una falla no corta el resto. */
  async function pantalla(nombre, llegar) {
    const erroresAntes = v.errores.length;
    const malasAntes = v.malas.length;
    try {
      await cupo(v);
      await llegar();
      await quieto(page, v);
      await page.evaluate(() => window.scrollTo(0, 0));
      const archivo = `${nombre}-${ancho}-${temaPedido}`;
      // La primera pantalla, tal como se ve sin desplazarse (lo que se mira primero), y la página entera.
      await page.screenshot({ path: fileURLToPath(new URL(`${archivo}-ventana.png`, carpeta)) });
      await captura(page, v, carpeta, archivo);
      fs.writeFileSync(fileURLToPath(new URL(`${archivo}.txt`, carpeta)), `${page.url().replace(WEB, '')}\n\n${await page.evaluate(() => document.querySelector('main')?.innerText ?? '')}`);
      const violaciones = await axe(page);
      const dobles = await doblesDesplazamientos(page);
      // Lo que se desplaza de costado dentro de su caja (una tabla ancha): se informa, no es una falla.
      const deCostado = await page.evaluate(() => [...document.querySelectorAll('main .desplazable-x')].filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => `${el.firstElementChild?.className ?? ''} (${el.clientWidth}/${el.scrollWidth})`));
      if (deCostado.length) informar('MIRAR', `${nombre}: contenido que se desplaza de costado`, deCostado.join(' · '));
      const fila = { nombre, desborde: !(await sinDesborde(page)), axe: violaciones, dobles, errores: v.errores.slice(erroresAntes), malas: v.malas.slice(malasAntes) };
      informe.push(fila);
      comprobar('MIRAR', `${nombre}: sin desborde, sin violaciones de axe, sin doble desplazamiento y sin errores`, !fila.desborde && violaciones.length === 0 && dobles.length === 0 && fila.errores.length === 0, JSON.stringify({ axe: violaciones, dobles, errores: fila.errores, malas: fila.malas }));
    } catch (e) {
      informe.push({ nombre, falla: String(e) });
      comprobar('MIRAR', `${nombre}: se pudo llegar`, false, String(e));
    }
  }
  try {
    await iniciarSesion(page, estado.proCorreo, FICHA_A);
    await quieto(page, v);
    await page.select('.apariencia select', temaPedido);
    await pausa(300);
    const e = estado;
    const conPregunta = (q) => `${FICHA_A}&vista=analizar&${q}`;

    await pantalla('resumen', () => ir(page, FICHA_A));
    await pantalla('resumen-todas', async () => {
      await ir(page, FICHA_A);
      await quieto(page, v);
      await clic(page, '.encabezado-de-bloque button, .encabezado-de-bloque a', 'Ver todas');
    });
    await pantalla('linea-novedades', async () => {
      await ir(page, FICHA_A);
      await quieto(page, v);
      await clic(page, '.observacion[data-regla="NOVEDADES_DESDE_EL_CORTE"] a', '');
    });
    await pantalla('analizar-preguntas', () => ir(page, `${FICHA_A}&vista=analizar`));
    await pantalla('pregunta-ejercicio-falta', async () => {
      await ir(page, `${FICHA_A}&vista=analizar`);
      await quieto(page, v);
      await clic(page, '.tarjeta-de-pregunta', 'progresando este ejercicio');
    });
    await pantalla('pregunta-ejercicio', async () => {
      await elegir(page, '.parametros-de-pregunta', 'Ejercicio');
      await quieto(page, v, { silencio: 300 });
      await clic(page, '.parametros-de-pregunta button[type="submit"]', '');
    });
    await pantalla('pregunta-cambio-nutricion', () => ir(page, conPregunta(`pregunta=cambio-desde-el-plan&area=NUTRICION&version=${e.nutricion.planV2}`)));
    await pantalla('pregunta-etapas-nutricion', () => ir(page, conPregunta(`pregunta=comparar-etapas&area=NUTRICION&etapaA=${e.nutricion.planV1}&etapaB=${e.nutricion.planV2}`)));
    // La comparación a mano, secundaria: plegada debajo de la tabla de etapas, se abre y sigue accesible.
    await pantalla('pregunta-etapas-nutricion-a-mano', async () => {
      await page.evaluate(() => document.querySelector('details.comparar-a-mano')?.setAttribute('open', ''));
    });
    await pantalla('pregunta-etapas-entrenamiento-falta', () => ir(page, conPregunta('pregunta=comparar-etapas&area=ENTRENAMIENTO')));
    await pantalla('pregunta-contraste-nutricion', () => ir(page, conPregunta('pregunta=registrado-vs-indicado&area=NUTRICION')));
    // Pasada del 2026-10-09: el filtro separa el modo de registro de la diferencia comprobada.
    await pantalla('pregunta-contraste-nutricion-distintas', async () => {
      await clic(page, '.contraste .capa', 'Distintas de lo indicado');
    });
    await pantalla('pregunta-contraste-entrenamiento-falta', () => ir(page, conPregunta('pregunta=registrado-vs-indicado&area=ENTRENAMIENTO')));
    await pantalla('pregunta-informacion', () => ir(page, conPregunta('pregunta=informacion-para-revisar&area=NUTRICION')));
    await pantalla('pregunta-alimentacion-falta', () => ir(page, conPregunta('pregunta=alimentacion-y-medidas')));
    await pantalla('analizar-imc-punto', () => ir(page, `${FICHA_A}&vista=analizar&m=antropometria.imc&g=O`));
    await pantalla('preparar-revision-nutricion', async () => {
      await ir(page, FICHA_A);
      await quieto(page, v);
      await clic(page, '.acciones-del-resumen a', 'Preparar la revisión de Nutrición');
    });
    // La evidencia con un día marcado entero y otro en parte (casilla mixta), con «Lo que marcaste» abierto.
    await pantalla('preparar-revision-nutricion-marcada', async () => {
      await page.evaluate(() => {
        const dias = [...document.querySelectorAll('#revision-evidencia .evidencia__dia')];
        dias[0]?.querySelector('.evidencia__grupo-casilla input')?.click();
        dias[1]?.querySelector('.evidencia__ver')?.click();
      });
      await pausa(200);
      await page.evaluate(() => {
        document.querySelectorAll('#revision-evidencia .evidencia__dia')[1]?.querySelector('.evidencia__registros label input')?.click();
      });
      await pausa(200);
      await page.evaluate(() => document.querySelector('#revision-evidencia details.evidencia__marcadas')?.setAttribute('open', ''));
    });
    await pantalla('nutricion-volver-a-la-ficha', async () => {
      await clic(page, '.retorno-a-la-ficha a', 'Volver a la ficha');
      await page.waitForFunction(() => location.pathname === '/pro/advisees', { timeout: 20_000 });
    });
    if (FICHA_E) await pantalla('resumen-escenario-e', () => ir(page, FICHA_E));
  } finally {
    fs.writeFileSync(fileURLToPath(new URL(`informe-${ancho}-${temaPedido}.json`, carpeta)), JSON.stringify({ ancho, tema: temaPedido, informe, resultados }, null, 2));
    await navegador.close();
  }
}

// ─── Capturas «después» ───────────────────────────────────────────────────────────────────────

/**
 * Las tres vistas como las «antes» (Resumen, Línea de tiempo y Analizar con energía, proteínas y peso; 1440, 1280 y 1024
 * px; los dos temas), las pantallas nuevas en los mismos anchos, el Resumen y una pregunta a 768 y 390 px (no es el
 * objetivo, pero no se rompe) y los estados críticos a 1440 px.
 */
async function capturas() {
  const carpeta = enTrabajo('despues/');
  fs.mkdirSync(carpeta, { recursive: true });
  const { navegador, page, v } = await abrir(1440);
  try {
    await iniciarSesion(page, estado.proCorreo, FICHA_A);
    await quieto(page, v);
    const corteN = (await leerApi(v, `/advisees/${estado.aseId}/dashboard`)).data.domains.nutrition.summary.lastReview.recordedAt;
    // La clave del ejercicio más registrado, tomada de la pantalla (la pregunta la pide y nunca la elige sola).
    await ir(page, `${FICHA_A}&vista=analizar&pregunta=progreso-de-un-ejercicio`);
    await quieto(page, v);
    await elegir(page, '.parametros-de-pregunta', 'Ejercicio');
    await quieto(page, v, { silencio: 300 });
    await clic(page, '.parametros-de-pregunta button[type="submit"]', '');
    await quieto(page, v);
    const preguntaDelEjercicio = page.url().replace(WEB, '');
    // La revisión de Nutrición preparada desde la ficha: la evidencia agrupada por día (pasada del 2026-10-09).
    await ir(page, FICHA_A);
    await quieto(page, v);
    const prepararNutricion = await page.evaluate(() => [...document.querySelectorAll('.acciones-del-resumen a')].find((a) => a.textContent.includes('Preparar la revisión de Nutrición'))?.getAttribute('href') ?? null);
    const vistas = [
      ...(prepararNutricion ? [['revision-nutricion', prepararNutricion]] : []),
      ['resumen', FICHA_A],
      ['linea', `${FICHA_A}&vista=linea`],
      ['analizar', `${FICHA_A}&vista=analizar&m=${encodeURIComponent(TRES)}`],
      ['preguntas', `${FICHA_A}&vista=analizar`],
      ['pregunta-ejercicio', preguntaDelEjercicio],
      ['etapas', `${FICHA_A}&vista=analizar&pregunta=comparar-etapas&area=NUTRICION&etapaA=${estado.nutricion.planV1}&etapaB=${estado.nutricion.planV2}`],
      ['contraste', `${FICHA_A}&vista=analizar&pregunta=registrado-vs-indicado&area=NUTRICION`],
      ['informacion', `${FICHA_A}&vista=analizar&pregunta=informacion-para-revisar&area=NUTRICION`],
      ['linea-novedades', `${FICHA_A}&vista=linea&areas=NUTRITION&novedades=${encodeURIComponent(corteN)}`],
    ];
    for (const tema of ['azul-noche', 'claro']) {
      await page.select('.apariencia select', tema);
      await pausa(300);
      for (const ancho of [1440, 1280, 1024, 768, 390]) {
        await page.setViewport({ width: ancho, height: 900 });
        for (const [nombre, url] of vistas) {
          if (ancho < 1024 && !['resumen', 'pregunta-ejercicio'].includes(nombre)) continue;
          await cupo(v);
          await ir(page, url);
          await quieto(page, v);
          await page.evaluate(() => window.scrollTo(0, 0));
          const tope = nombre.startsWith('linea') ? 2600 : 9000;
          const c = await captura(page, v, carpeta, `${nombre}-${ancho}-${tema}`, tope);
          const dobles = await doblesDesplazamientos(page);
          comprobar('CP-27', `${nombre} a ${ancho} px en ${tema}: sin desborde de costado ni doble desplazamiento; los gráficos, dibujados`, (await sinDesborde(page)) && dobles.length === 0 && c.dibujadas === c.figuras, `${c.dibujadas} de ${c.figuras} gráficos${dobles.length ? ` · ${dobles.join(', ')}` : ''}`);
          if (nombre === 'resumen' && ancho === 1440) {
            const yPrimera = await page.evaluate(() => {
              const o = document.querySelector('.observacion');
              return o ? Math.round(o.getBoundingClientRect().bottom + scrollY) : null;
            });
            comprobar('CP-01', `A 1440 × 900 en ${tema}, la primera observación de la síntesis se ve sin desplazarse`, yPrimera !== null && yPrimera <= 900, `termina en y = ${yPrimera}`);
            await page.screenshot({ path: fileURLToPath(new URL(`resumen-1440-${tema}-primera-pantalla.png`, carpeta)) });
          }
        }
      }
    }
    // A 1280 × 800 (GUIA II.1): lo principal de cada vista empieza en la primera pantalla.
    await page.select('.apariencia select', 'azul-noche');
    await page.setViewport({ width: 1280, height: 800 });
    for (const [nombre, url, selector] of [
      ['Resumen: el objetivo y la planificación', FICHA_A, '.tabla-de-planificacion tbody tr'],
      ['Analizar: las preguntas', `${FICHA_A}&vista=analizar`, '.tarjeta-de-pregunta'],
      ['Línea de tiempo: el primer hecho', `${FICHA_A}&vista=linea`, '.entrada'],
    ]) {
      await cupo(v);
      await ir(page, url);
      await quieto(page, v);
      await page.evaluate(() => window.scrollTo(0, 0));
      const y = await page.evaluate((s) => {
        const el = document.querySelector(s);
        return el ? Math.round(el.getBoundingClientRect().top) : null;
      }, selector);
      comprobar('GUIA-II.1', `A 1280 × 800, ${nombre} empieza en la primera pantalla`, y !== null && y < 800, `y = ${y}`);
      await page.screenshot({ path: fileURLToPath(new URL(`primera-pantalla-1280x800-${nombre.split(':')[0].toLowerCase().replace(/[^a-záéíóú]+/g, '-')}.png`, carpeta)) });
    }
    // Los tres modos del gráfico en los dos temas, con lo que se dibujó comprobado (CP-27).
    await page.setViewport({ width: 1440, height: 900 });
    for (const tema of ['azul-noche', 'claro']) {
      await page.select('.apariencia select', tema);
      await pausa(300);
      for (const [nombre, letra, metricas, esperadas] of [
        ['paneles', 'P', TRES, 3],
        ['superpuestas', 'S', 'nutricion.proteinas,nutricion.carbohidratos', 1],
        ['relativo', 'R', 'nutricion.proteinas,nutricion.carbohidratos', 1],
      ]) {
        await cupo(v);
        await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent(metricas)}${letra === 'P' ? '' : `&modo=${letra}`}`);
        await quieto(page, v);
        const c = await captura(page, v, carpeta, `analizar-${nombre}-1440-${tema}`);
        comprobar('CP-27', `Modo ${nombre} en ${tema}: ${esperadas} gráfico(s), dibujado(s) con sus curvas`, c.figuras === esperadas && c.dibujadas === esperadas, `${c.dibujadas} de ${c.figuras}`);
      }
    }
    // Estados críticos, a 1440 en Azul noche.
    await page.select('.apariencia select', 'azul-noche');
    await pausa(300);
    // Error de una sola parte: la proyección nutricional falla; el peso se dibuja y la parte que falta lo dice.
    v.reglas = [{ coincide: (u) => u.includes('/projections/NUTRITION'), accion: 'responder', status: 503, codigo: 'SERVICE_UNAVAILABLE' }];
    await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent(TRES)}`);
    await quieto(page, v);
    await captura(page, v, carpeta, 'estado-error-parcial-1440-azul-noche');
    v.reglas = [];
    // Una respuesta lenta: lo confirmado queda a la vista mientras se actualiza.
    v.reglas = [{ coincide: (u) => u.includes('/dashboard'), accion: 'demorar', ms: 4000 }];
    await ir(page, `${FICHA_A}&p=30`);
    await pausa(1200);
    await page.screenshot({ path: fileURLToPath(new URL('estado-lento-1440-azul-noche.png', carpeta)) });
    await quieto(page, v);
    v.reglas = [];
    if (FICHA_E) {
      await ir(page, FICHA_E);
      await quieto(page, v);
      await captura(page, v, carpeta, 'escenario-e-resumen-1440-azul-noche');
    }
  } finally {
    await navegador.close();
  }
}

// ─── Funcional: recorridos 1, 3, 4, 6 y 2, y criterios CP en el navegador ───────────────────────

async function funcional() {
  const descargas = fileURLToPath(enTrabajo('funcional-comprension/descargas/'));
  fs.rmSync(descargas, { recursive: true, force: true });
  fs.mkdirSync(descargas, { recursive: true });
  const carpeta = enTrabajo('funcional-comprension/');
  const { navegador, page, v } = await abrir(1440, { descargas });
  try {
    await iniciarSesion(page, estado.proCorreo, FICHA_A);
    const tPrimera = await quieto(page, v);
    informar('CP-29', 'Primera carga del Resumen después de iniciar sesión, hasta la última respuesta', `${tPrimera} ms`);
    await page.select('.apariencia select', 'azul-noche');
    await pausa(300);
    const panel = (await leerApi(v, `/advisees/${estado.aseId}/dashboard`)).data.domains;
    const cortes = { NUTRITION: panel.nutrition.summary.lastReview, TRAINING: panel.training.summary.lastReview };
    await parte('R1', 'Recorrido 1 (preparar una consulta)', () => recorridoConsulta(page, v, cortes, carpeta));
    if (FICHA_E) await parte('CP-04', 'Escenario E (una sola área, sin revisión)', () => escenarioUnaArea(page, v, carpeta));
    await parte('R3', 'Recorrido 3 (nutrición)', () => recorridoNutricion(page, v, carpeta));
    await parte('R3', 'Evidencia de la revisión de Nutrición (pasada del 2026-10-09)', () => evidenciaDeLaRevision(page, v, carpeta));
    await parte('R4', 'Recorrido 4 (comparar etapas)', () => recorridoEtapas(page, v, carpeta));
    await parte('CP-18', 'Cobertura con huecos (pasada del 2026-10-09)', () => coberturaConHuecos(page, v, carpeta));
    await parte('CP-11', 'Clases del dato', () => clasesDelDato(page, v, descargas, carpeta));
    await parte('CP-25', 'Búsqueda en los catálogos', () => busquedaEnCatalogos(page, v));
    await parte('R6', 'Recorrido 6 (recuperación)', () => recorridoRecuperacion(page, v, carpeta));
    await parte('CP-28', 'Teclado, zoom y árbol de accesibilidad', () => accesibilidad(page, v, carpeta));
    await parte('CP-29', 'Rendimiento', () => rendimiento(page, v));
    // Al final: registra una revisión sintética y mueve el corte de Entrenamiento.
    await parte('R2', 'Recorrido 2 (revisar entrenamiento)', () => recorridoEntrenamiento(page, v, cortes, carpeta));
    comprobar('CP-25', 'Ningún pedido a la API llevó texto de búsqueda en la URL durante el recorrido', !v.urls.some((u) => /[?&]q=/.test(u)), `${v.urls.length} pedidos`);
  } finally {
    await navegador.close();
  }
}

/** Recorrido 1: abrir persona → comprender novedades → elegir pregunta → abrir evidencia → volver (CP-01 a CP-05, CP-21). */
async function recorridoConsulta(page, v, cortes, carpeta) {
  await cupo(v);
  await ir(page, FICHA_A);
  await quieto(page, v);
  const desde = v.urls.length;
  const orden = await page.evaluate(() => {
    const h2 = [...document.querySelectorAll('main h2')].map((h) => h.textContent.trim());
    const sintesis = [...document.querySelectorAll('main h2')].find((h) => h.textContent.includes('Para tu próxima revisión'));
    const primera = document.querySelector('.observacion');
    return { nombre: document.querySelector('h1')?.textContent ?? '', h2, ySintesis: sintesis ? Math.round(sintesis.getBoundingClientRect().top + scrollY) : null, yPrimera: primera ? Math.round(primera.getBoundingClientRect().bottom + scrollY) : null, graficos: document.querySelectorAll('figure.grafico__figura').length };
  });
  const iObjetivo = orden.h2.indexOf('Objetivo y planificación');
  const iSintesis = orden.h2.indexOf('Para tu próxima revisión');
  comprobar('CP-01', 'El Resumen presenta la persona, el objetivo y la síntesis, en ese orden y sin gráficos', orden.nombre.length > 0 && iObjetivo >= 0 && iSintesis > iObjetivo && orden.graficos === 0, `${orden.nombre} · ${orden.h2.join(' › ')}`);
  comprobar('CP-01', 'A 1440 × 900, la primera observación de «Para tu próxima revisión» se ve sin desplazarse', orden.yPrimera !== null && orden.yPrimera <= 900, `síntesis en y = ${orden.ySintesis}; la primera observación termina en y = ${orden.yPrimera}`);

  const etiquetaVerTodas = (await textos(page, '.encabezado-de-bloque button, .encabezado-de-bloque a')).find((t) => /Ver todas/.test(t)) ?? '';
  const total = Number(/Ver todas \((\d+)\)/.exec(etiquetaVerTodas)?.[1] ?? NaN);
  await clic(page, '.encabezado-de-bloque button, .encabezado-de-bloque a', 'Ver todas');
  const obs = await page.$$eval('.observacion', (xs) =>
    xs.map((o) => ({
      regla: o.dataset.regla,
      alcance: o.querySelector('.observacion__alcance')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
      texto: o.querySelector('.observacion__texto')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
      fuente: /Sale de /.test(o.querySelector('.observacion__pie')?.innerText ?? ''),
      acciones: o.querySelectorAll('.observacion__pie a, .observacion__pie button').length,
    })),
  );
  comprobar('CP-02', 'Cada observación dice su área y alcance, el hecho, de dónde sale y cómo profundizarlo', obs.length > 0 && obs.every((o) => o.alcance && o.texto && o.fuente && (o.acciones > 0 || o.regla === 'PARTE_NO_DISPONIBLE')), obs.map((o) => `${o.regla}(${o.acciones})`).join(' '));
  comprobar('CP-02', '«Ver todas» dice cuántas hay y las muestra todas', obs.length === total, `${obs.length} de ${total}`);
  const palabras = ['mejoró', 'empeoró', 'no cumplió', 'adherencia', 'bien', 'mal'];
  comprobar('CP-02', 'Ninguna observación califica a la persona', !obs.some((o) => palabras.some((p) => new RegExp(`\\b${p}\\b`, 'i').test(o.texto))), '');

  // CP-03: un corte por área, el de su última revisión.
  const alcances = obs.filter((o) => o.regla === 'NOVEDADES_DESDE_EL_CORTE').map((o) => o.alcance);
  comprobar(
    'CP-03',
    'Cada área tiene su propio corte: la última revisión de Nutrición y la de Entrenamiento, en fechas distintas',
    alcances.some((a) => a.startsWith('Nutrición') && a.includes(`Desde la revisión del ${diaDe(cortes.NUTRITION.recordedAt)}`)) &&
      alcances.some((a) => a.startsWith('Entrenamiento') && a.includes(`Desde la revisión del ${diaDe(cortes.TRAINING.recordedAt)}`)) &&
      cortes.NUTRITION.recordedAt !== cortes.TRAINING.recordedAt,
    alcances.join(' | '),
  );
  // CP-05: lo que ocurrió después, lo cargado después y lo corregido después, como lo cuenta la API (registros que
  // ocurrieron; hechos anteriores de cualquier tipo cargados o corregidos después).
  const esperados = {};
  for (const [area, dominio, registro] of [
    ['Nutrición', 'NUTRITION', 'MEAL_RECORDED'],
    ['Entrenamiento', 'TRAINING', 'TRAINING_SESSION_RECORDED'],
  ]) {
    const conteos = (await leerApi(v, `/advisees/${estado.aseId}/timeline?periodStart=${diaMenos(hoy, 365)}&periodEnd=${hoy}&domain=${dominio}&since=${encodeURIComponent(cortes[dominio].recordedAt)}&limit=1`)).data.sinceCounts.counts;
    const suma = (kind, soloRegistro) => conteos.filter((c) => c.domain === dominio && c.kind === kind && (!soloRegistro || c.eventType === registro)).reduce((s, c) => s + c.count, 0);
    const esperado = { ocurrieron: suma('OCURRIO_DESPUES', true), incorporadas: suma('INCORPORADO_DESPUES', false), corregidas: suma('CORREGIDO_DESPUES', false) };
    esperados[dominio] = { ...esperado, todas: conteos.filter((c) => c.domain === dominio).reduce((s, c) => s + c.count, 0) };
    const t = obs.find((o) => o.regla === 'NOVEDADES_DESDE_EL_CORTE' && o.alcance.startsWith(area))?.texto ?? '';
    const n = (re) => Number(re.exec(t)?.[1] ?? 0);
    const obtenido = {
      ocurrieron: n(/^(\d+) (?:comidas? registradas?|sesi[oó]n(?:es)? registradas?)/),
      incorporadas: n(/(\d+) hechos? anterior(?:es)? cargados? después/),
      corregidas: n(/(\d+) registros? anterior(?:es)? corregidos? o anulados?/),
    };
    comprobar('CP-05', `${area}: lo que ocurrió después, lo cargado después y lo corregido después se cuentan aparte, como la API`, JSON.stringify(obtenido) === JSON.stringify(esperado), `«${t}» · API ${JSON.stringify(esperado)}`);
  }
  // CP-03: mirar no es revisar.
  const despues = (await leerApi(v, `/advisees/${estado.aseId}/dashboard`)).data.domains;
  comprobar(
    'CP-03',
    'Abrir la ficha y la síntesis no registra nada: los cortes siguen iguales y la página no escribió',
    despues.nutrition.summary.lastReview.reviewId === cortes.NUTRITION.reviewId && despues.training.summary.lastReview.reviewId === cortes.TRAINING.reviewId && escrituras(v, desde).length === 0,
    escrituras(v, desde).join(' · ') || 'sin escrituras',
  );

  // Las novedades de Nutrición en la línea de tiempo, ya filtradas y explicadas.
  await clic(page, '.observacion[data-regla="NOVEDADES_DESDE_EL_CORTE"] a', '(Nutrición)');
  await quieto(page, v);
  const p = parametros(page);
  const aviso = await texto(page, '.aviso-de-filtro');
  const totalLinea = Number(/(\d+) hechos? coincid/.exec(await texto(page, 'section p[role="status"]'))?.[1] ?? NaN);
  const areas = [...new Set(await textos(page, '.entrada__area'))];
  comprobar(
    'R1',
    'La observación abre la línea de tiempo filtrada a lo nuevo desde la revisión de Nutrición, con un aviso que lo explica; en la URL solo el instante y el área',
    p.get('novedades') === new Date(cortes.NUTRITION.recordedAt).toISOString() && p.get('areas') === 'NUTRITION' && /Lo nuevo desde la revisión del/.test(aviso) && totalLinea === esperados.NUTRITION.todas && areas.every((a) => /nutrici/i.test(a)),
    `${totalLinea} hechos (la API cuenta ${esperados.NUTRITION.todas}) · ${aviso.slice(0, 140)}`,
  );
  await clic(page, '.aviso-de-filtro button', 'Ver todo el período elegido');
  await quieto(page, v);
  comprobar('R1', '«Ver todo el período elegido» quita el corte y deja los demás filtros', !parametros(page).get('novedades') && parametros(page).get('areas') === 'NUTRITION', page.url().replace(WEB, ''));

  // Una pregunta desde el Resumen: el ejercicio se elige; la serie y la unidad se sugieren a la vista.
  await cupo(v);
  await ir(page, FICHA_A);
  await quieto(page, v);
  await clic(page, '.preguntas-del-resumen__lista a', 'progresando este ejercicio');
  await quieto(page, v);
  const formulario = await texto(page, '.parametros-de-pregunta');
  const sinElegir = await page.evaluate(() => {
    const label = [...document.querySelectorAll('.parametros-de-pregunta label')].find((l) => l.textContent.includes('Ejercicio'));
    return label ? document.getElementById(label.htmlFor)?.value ?? null : null;
  });
  comprobar('CP-07', 'La pregunta del ejercicio pide el ejercicio: no elige el primero por la persona', sinElegir === '' && /Elegí un ejercicio/.test(formulario), formulario.slice(0, 160));
  const ejercicio = await elegir(page, '.parametros-de-pregunta', 'Ejercicio', { textoDeOpcion: 'Peso muerto' });
  await quieto(page, v, { silencio: 300 });
  await clic(page, '.parametros-de-pregunta button[type="submit"]', 'Ver la respuesta');
  await quieto(page, v);
  const activa = await texto(page, '.pregunta-activa');
  const dibujados = await graficos(page);
  comprobar('CP-07', 'La pregunta arma la vista real: carga, repeticiones y RIR de la serie, con su encabezado y su límite', /Peso muerto · serie \d/.test(activa) && dibujados.length === 3 && dibujados.every((g) => g.svg && g.curvas > 0) && parametros(page).get('ejercicio') === ejercicio, `${activa.slice(0, 160)} · ${dibujados.map((g) => g.titulo).join(' | ')}`);

  // La evidencia: el origen del punto elegido, al costado, y la vuelta sin perder nada (CP-21).
  const urlAntes = page.url();
  const yAntes = await page.evaluate(() => window.scrollY);
  const marca = await clic(page, '.panel-de-lectura button', 'Ver el origen de este dato');
  await page.waitForSelector('dialog[open]');
  await quieto(page, v);
  const dialogo = await texto(page, 'dialog[open]');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog[open]'));
  const foco = await page.evaluate(() => document.activeElement?.getAttribute('data-recorrido'));
  comprobar('CP-21', 'El origen del punto se abre al costado (la sesión) y al cerrarlo con Esc la vista sigue igual, con el foco en el disparador', /Sesión|sesión/.test(dialogo) && page.url() === urlAntes && foco === marca, `foco ${foco === marca ? 'en el disparador' : foco} · scroll ${yAntes} · ${dialogo.slice(0, 120)}`);
  // Ir al registro completo y volver con la configuración (la pestaña del área lleva `volver`).
  await clic(page, '.panel-de-lectura button', 'Ver el origen de este dato');
  await page.waitForSelector('dialog[open]');
  await quieto(page, v);
  await clic(page, 'dialog[open] a', 'Ver en Entrenamiento');
  await page.waitForFunction(() => location.pathname === '/pro/advisees/training', { timeout: 20_000 });
  await quieto(page, v);
  const conVolver = parametros(page).get('volver') ?? '';
  await clic(page, '.retorno-a-la-ficha a', 'Volver a la ficha');
  await page.waitForFunction(() => location.pathname === '/pro/advisees', { timeout: 20_000 });
  await quieto(page, v);
  const vuelta = parametros(page);
  const antes = new URL(urlAntes).searchParams;
  const iguales = ['vista', 'pregunta', 'ejercicio', 'serie', 'unidad', 'm', 'p', 'desde', 'hasta'].every((k) => (vuelta.get(k) ?? '') === (antes.get(k) ?? ''));
  comprobar('CP-21', 'Del origen a la pestaña del área y de vuelta: la ficha vuelve con la misma pregunta, ejercicio, serie, métricas y período', conVolver.length > 0 && iguales && (await graficos(page)).length === 3, `volver=${decodeURIComponent(conVolver).slice(0, 120)}`);
  await page.screenshot({ path: fileURLToPath(new URL('r1-vuelta-a-la-pregunta.png', carpeta)) });
}

/**
 * El escenario E: una persona con una sola área autorizada (Nutrición), sin revisiones y con el plan activado hoy.
 * CP-04: sin revisión, el alcance es el período elegido y se dice. CP-08: lo que no se puede leer no aporta ni conteos.
 */
async function escenarioUnaArea(page, v, carpeta) {
  await cupo(v);
  await ir(page, FICHA_E);
  await quieto(page, v);
  await clic(page, '.encabezado-de-bloque button, .encabezado-de-bloque a', 'Ver todas').catch(() => {});
  const obs = await page.$$eval('.observacion', (xs) => xs.map((o) => ({ regla: o.dataset.regla, alcance: o.querySelector('.observacion__alcance')?.innerText.replace(/\s+/g, ' ').trim() ?? '', texto: o.querySelector('.observacion__texto')?.innerText.replace(/\s+/g, ' ').trim() ?? '' })));
  const fila = await page.evaluate(() => [...document.querySelectorAll('.tabla-de-planificacion tbody tr')].map((r) => r.innerText.replace(/\s+/g, ' ')).join(' | '));
  const cobertura = obs.find((o) => o.regla === 'COBERTURA_NUTRICIONAL');
  comprobar(
    'CP-04',
    'Sin revisión previa, la síntesis habla del período seleccionado y lo dice; la cobertura aclara desde cuándo rige el plan',
    obs.length > 0 && obs.every((o) => !/Desde la revisión/.test(o.alcance)) && /En el período seleccionado/.test(cobertura?.alcance ?? '') && /El plan rige desde el/.test(cobertura?.texto ?? '') && /Sin revisiones registradas/.test(fila),
    `${cobertura?.alcance ?? 'sin cobertura'} · ${cobertura?.texto ?? ''}`,
  );
  const main = await texto(page, 'main');
  comprobar(
    'CP-08',
    'Con una sola área autorizada, la ficha no muestra nada de las otras: ni filas, ni observaciones, ni conteos de sesiones o tomas',
    obs.every((o) => /^Nutrición/.test(o.alcance)) && !/Entrenamiento ·|Antropometría ·|sesi(ón|ones) registradas?|tomas? (registradas?|en el período)/.test(main) && !/Entrenamiento|Antropometría/.test(fila),
    fila.slice(0, 200),
  );
  await cupo(v);
  await ir(page, `${FICHA_E}&vista=analizar&pregunta=informacion-para-revisar&area=NUTRICION`);
  await quieto(page, v);
  const info = await texto(page, '.informacion-para-revisar');
  comprobar('CP-08', 'La pregunta de información, con acceso parcial, dice solo lo de Nutrición', /Nutrición/.test(info) && !/Entrenamiento|Antropometría/.test(info), info.slice(0, 200));
  await captura(page, v, carpeta, 'cp08-informacion-con-una-sola-area');
}

/** Recorrido 3: plan/opción y cantidades → detectar un faltante → solicitar contexto → salir sin escribir (CP-09, CP-24). */
async function recorridoNutricion(page, v, carpeta) {
  await cupo(v);
  await ir(page, `${FICHA_A}&vista=analizar&pregunta=registrado-vs-indicado&area=NUTRICION`);
  await quieto(page, v);
  // Pasada del 2026-10-09: el modo de registro (cómo se cargaron las cantidades) y la diferencia comprobada con la opción
  // van en columnas y filtros separados. Columnas: Día, Comida, Lo registrado, Modo de registro, Frente a lo indicado,
  // Versión del plan, Detalle. Lo esperado sale de la API, con el mismo rasgo de calidad de cada filtro.
  const filasDe = () => page.$$eval('.tabla-del-contraste tbody tr', (rs) => rs.map((r) => [...r.querySelectorAll('th, td')].map((c) => c.innerText.replace(/\s+/g, ' ').trim())));
  const cuantasHay = async (calidad) => (await leerApi(v, `/advisees/${estado.aseId}/timeline?periodStart=${diaMenos(hoy, 89)}&periodEnd=${hoy}&domain=NUTRITION&type=MEAL_RECORDED&quality=${calidad}&limit=1`)).data.totalMatching;
  await clic(page, '.contraste .capa', 'Distintas de lo indicado');
  await quieto(page, v);
  const distintas = await filasDe();
  const metaDistintas = await texto(page, '.contraste .metadatos');
  const totalDistintas = await cuantasHay('QUANTITIES_DIFFER_FROM_PLAN');
  comprobar(
    'R3',
    '«Distintas de lo indicado» deja solo las comidas con una diferencia comprobada (las mismas que cuenta la API), informadas a mano, y cada una dice en cuántos ingredientes',
    totalDistintas > 0 && distintas.length === Math.min(50, totalDistintas) && distintas.every((f) => f[3] === 'Informó las cantidades a mano' && /^Distinta de lo indicado en \d+ de \d+ ingredientes?$/.test(f[4])) && new RegExp(`${totalDistintas} comidas? distintas de lo indicado`).test(metaDistintas),
    `${distintas.length} filas de ${totalDistintas} · ${metaDistintas} · ${distintas[0]?.join(' | ')}`,
  );
  await captura(page, v, carpeta, 'r3-contraste-distintas-de-lo-indicado');
  await clic(page, '.contraste .capa', 'Con cantidades informadas a mano');
  await quieto(page, v);
  const informadas = await filasDe();
  const totalInformadas = await cuantasHay('QUANTITIES_REPORTED');
  const igualAMano = informadas.find((f) => f[4] === 'Igual a lo indicado');
  const distintaAMano = informadas.find((f) => /^Distinta de lo indicado/.test(f[4]));
  comprobar(
    'R3',
    'Con cantidades informadas a mano: una igual a la opción dice «Igual a lo indicado» (el modo no es una diferencia) y una distinta, en cuántos ingredientes',
    informadas.length === Math.min(50, totalInformadas) && informadas.every((f) => f[3] === 'Informó las cantidades a mano') && !!igualAMano && !!distintaAMano,
    `${informadas.length} filas de ${totalInformadas} · igual: ${igualAMano?.join(' | ')} · distinta: ${distintaAMano?.join(' | ')}`,
  );
  await clic(page, '.contraste .capa', 'Sin confirmar o comidas diferentes');
  await quieto(page, v);
  const filas = await filasDe();
  const totalSinComparar = await cuantasHay('QUANTITIES_UNCONFIRMED,DIFFERENT_MEAL');
  const sinConfirmar = filas.find((f) => f[3] === 'Sin confirmar las cantidades' && f[4] === 'No se puede comprobar: sin confirmar');
  const diferente = filas.find((f) => f[3] === 'Una comida diferente' && f[4] === 'No se compara: fuera de lo indicado');
  comprobar(
    'CP-09',
    'Sin confirmar sigue sin confirmar y una comida diferente queda fuera de lo indicado: ninguna se presenta como distinta',
    filas.length === Math.min(50, totalSinComparar) && !!sinConfirmar && !!diferente && !filas.some((f) => /^Distinta/.test(f[4])),
    `${filas.length} filas de ${totalSinComparar} · ${sinConfirmar?.join(' | ')} · ${diferente?.join(' | ')}`,
  );
  // El detalle de una comida sin confirmar: lo indicado al costado, sin cantidades consumidas inventadas.
  const fila = filas.indexOf(sinConfirmar);
  await page.evaluate((i) => document.querySelectorAll('.tabla-del-contraste tbody tr')[i].querySelector('button').setAttribute('data-recorrido', 'comida'), fila);
  await page.click('[data-recorrido="comida"]');
  await page.waitForSelector('dialog[open]');
  await quieto(page, v);
  const detalle = await texto(page, 'dialog[open]');
  comprobar('CP-09', 'El detalle de una comida sin confirmar dice lo indicado por la opción y no da cantidades consumidas', /sin confirmar|Sin confirmar/.test(detalle) && /indicado|Indicado/.test(detalle), detalle.slice(0, 220));
  await page.screenshot({ path: fileURLToPath(new URL('r3-detalle-sin-confirmar.png', carpeta)) });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog[open]'));
  // CP-24: el detalle de una comida que ya no se puede leer dice que no está disponible y no muestra valores.
  v.reglas = [{ coincide: (u, m) => m === 'GET' && /\/nutrition\/meal-records\/[0-9a-f-]{36}$/.test(new URL(u).pathname), accion: 'responder', status: 404, codigo: 'RESOURCE_NOT_FOUND' }];
  await page.click('[data-recorrido="comida"]');
  await page.waitForSelector('dialog[open]');
  await quieto(page, v);
  const noDisponible = await texto(page, 'dialog[open]');
  v.reglas = [];
  comprobar('CP-24', 'El detalle de una comida que ya no se puede leer dice «no está disponible con tu acceso actual», sin valores', /no está disponible/.test(noDisponible) && !/\d+ ?g\b|\d+ kcal/.test(noDisponible), noDisponible.slice(0, 200));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog[open]'));
  // Solicitar contexto: el flujo de formularios con su retorno, y salir sin enviar no escribe nada.
  const desde = v.urls.length;
  const antes = (await leerApi(v, `/advisees/${estado.aseId}/form-requests?limit=50`)).data.length;
  await cupo(v);
  await ir(page, FICHA_A);
  await quieto(page, v);
  await clic(page, '.acciones-del-resumen a', 'Solicitar contexto');
  await page.waitForFunction(() => location.pathname === '/pro/advisees/forms', { timeout: 20_000 });
  await quieto(page, v);
  const pedido = await texto(page, 'main');
  await clic(page, '.retorno-a-la-ficha a', 'Volver a la ficha');
  await page.waitForFunction(() => location.pathname === '/pro/advisees', { timeout: 20_000 });
  await quieto(page, v);
  const despues = (await leerApi(v, `/advisees/${estado.aseId}/form-requests?limit=50`)).data.length;
  comprobar('R3', '«Solicitar contexto» abre el flujo de formularios con su retorno; salir sin enviar no crea ninguna solicitud', /Volver a la ficha/.test(pedido) && antes === despues && escrituras(v, desde).length === 0, `${antes} → ${despues} solicitudes · ${escrituras(v, desde).join(' · ') || 'sin escrituras'}`);
}

/**
 * Pasada del 2026-10-09: la evidencia de una revisión de Nutrición (decenas de comidas) agrupada por día. Nada viene
 * marcado; marcar un día marca cada una de sus comidas; se ve y se cambia lo marcado; nada se escribe sin registrar.
 */
async function evidenciaDeLaRevision(page, v, carpeta) {
  const desde = v.urls.length;
  await cupo(v);
  await ir(page, FICHA_A);
  await quieto(page, v);
  await clic(page, '.acciones-del-resumen a', 'Preparar la revisión de Nutrición');
  await page.waitForFunction(() => location.pathname === '/pro/advisees/nutrition', { timeout: 20_000 });
  await quieto(page, v);
  const leer = () =>
    page.evaluate(() => {
      const f = document.querySelector('#revision-evidencia');
      if (!f) return null;
      const casilla = (d) => d.querySelector('.evidencia__grupo-casilla input');
      return {
        resumen: f.querySelector('.evidencia__resumen')?.textContent ?? '',
        dias: [...f.querySelectorAll('.evidencia__dia')].map((d) => ({ texto: d.querySelector('.evidencia__grupo-casilla')?.textContent.replace(/\s+/g, ' ').trim() ?? '', marcado: casilla(d)?.checked ?? false, mixto: casilla(d)?.indeterminate ?? false })),
        alto: Math.round(f.getBoundingClientRect().height),
        altoDeUnaCasilla: Math.round(f.querySelector('.evidencia__seccion .acto')?.getBoundingClientRect().height ?? 0),
        otras: f.querySelectorAll('.evidencia__seccion:first-of-type > .acto').length,
      };
    });
  const marcadasEn = (resumen) => Number(/^Marcaste (\d+) de/.exec(resumen)?.[1] ?? 0);
  const inicial = await leer();
  // Cuántas comidas tiene cada día, del rótulo de su casilla («marcar las 4 comidas»).
  const porDia = (inicial?.dias ?? []).map((d) => Number(/las (\d+) comidas/.exec(d.texto)?.[1] ?? (/marcar la comida/.test(d.texto) ? 1 : 0)));
  const comidas = porDia.reduce((s, n) => s + n, 0);
  comprobar(
    'R3',
    'La evidencia de la revisión de Nutrición se abre sin nada marcado y agrupada por día: una casilla por día, no una por comida',
    inicial !== null && inicial.resumen === 'Todavía no marcaste nada.' && inicial.dias.every((d) => !d.marcado && !d.mixto) && inicial.dias.length > 1 && inicial.dias.length < comidas,
    `${inicial?.dias.length} días para ${comidas} comidas · ${inicial?.resumen}`,
  );
  // El alto de la lista, contra una casilla por registro (como antes): se mide, no se estima a ojo.
  const antes = (comidas + (inicial?.otras ?? 0)) * ((inicial?.altoDeUnaCasilla ?? 0) + 8);
  informar('R3', 'Alto de la evidencia de Nutrición: ahora y con una casilla por registro', `${inicial?.alto} px · ${antes} px (${comidas} comidas y ${inicial?.otras} de planificación y objetivo, a ${inicial?.altoDeUnaCasilla} px cada una)`);
  comprobar('R3', 'La evidencia ocupa menos de la mitad que una casilla por registro', (inicial?.alto ?? Infinity) < antes / 2, `${inicial?.alto} de ${antes} px`);
  // Marcar el primer día marca cada una de sus comidas; el resumen dice lo marcado (no «examinado»).
  await page.evaluate(() => document.querySelector('#revision-evidencia .evidencia__dia .evidencia__grupo-casilla input')?.click());
  await pausa(150);
  const conUnDia = await leer();
  comprobar(
    'R3',
    'Marcar un día marca, una por una, sus comidas, y el resumen lo dice como marcado',
    marcadasEn(conUnDia.resumen) === porDia[0] && new RegExp(`${porDia[0]} comidas? de 1 día`).test(conUnDia.resumen) && conUnDia.dias[0].marcado && !/examin/i.test(conUnDia.resumen),
    conUnDia.resumen,
  );
  // Se cambia uno por uno: desplegar el día y desmarcar una comida deja la casilla del día en estado mixto.
  await page.evaluate(() => document.querySelector('#revision-evidencia .evidencia__dia .evidencia__ver')?.click());
  await pausa(150);
  await page.evaluate(() => document.querySelector('#revision-evidencia .evidencia__dia .evidencia__registros label input')?.click());
  await pausa(150);
  const sinUna = await leer();
  comprobar('R3', 'Desmarcar una comida del día la saca de lo marcado y deja el día en estado mixto', marcadasEn(sinUna.resumen) === porDia[0] - 1 && (porDia[0] === 1 || sinUna.dias[0].mixto), sinUna.resumen);
  // «Lo que marcaste» lista lo marcado y «Quitar» lo saca.
  await page.evaluate(() => document.querySelector('#revision-evidencia details.evidencia__marcadas')?.setAttribute('open', ''));
  await pausa(100);
  const listadas = await page.$$eval('#revision-evidencia .evidencia__lista li', (ls) => ls.length);
  await captura(page, v, carpeta, 'r3-evidencia-de-la-revision-agrupada');
  await page.evaluate(() => document.querySelector('#revision-evidencia .evidencia__lista button')?.click());
  await pausa(150);
  const quitada = await leer();
  comprobar('R3', '«Lo que marcaste» lista lo marcado y «Quitar» lo saca', listadas === porDia[0] - 1 && marcadasEn(quitada.resumen) === Math.max(0, porDia[0] - 2), `${listadas} listadas · ${quitada.resumen}`);
  await clic(page, 'form button', 'Cancelar');
  await quieto(page, v);
  comprobar('R3', 'Abrir, marcar y cancelar la revisión no escribe nada', escrituras(v, desde).length === 0, escrituras(v, desde).join(' · ') || 'sin escrituras');
}

/**
 * Pasada del 2026-10-09 (revisión de 643c603): la cobertura de un resumen de nutrición con huecos, en la pantalla. Un
 * rango con un hueco de días sin registros dice los días del rango y cuántos no tienen registros; nunca «N de N días».
 * Lo esperado se calcula a mano con los puntos diarios de la API, sin el dominio.
 */
async function coberturaConHuecos(page, v, carpeta) {
  const desdeLeido = diaMenos(hoy, 99);
  const puntos = (await leerApi(v, `/advisees/${estado.aseId}/projections/NUTRITION_PRESCRIBED_VS_RECORDED?metric=ENERGY&grain=DAY&periodStart=${desdeLeido}&periodEnd=${hoy}`)).data.result;
  const diaria = puntos.recorded.points;
  const huecos = puntos.recorded.gaps;
  const esperado = (r) => {
    const delRango = diaria.filter((p) => p.date >= r.desde && p.date <= r.hasta);
    const conValor = delRango.filter((p) => p.value !== null && !p.partialBucket && p.date !== hoy);
    const duracion = Math.round((Date.parse(`${r.hasta}T12:00:00Z`) - Date.parse(`${r.desde}T12:00:00Z`)) / 86_400_000) + 1;
    const hoyAdentro = r.desde <= hoy && hoy <= r.hasta;
    const terminados = delRango.filter((p) => p.date !== hoy && !p.partialBucket);
    const sinRegistros = duracion - new Set(terminados.map((p) => p.date)).size - (hoyAdentro ? 1 : 0);
    // Los días sin registros del rango, según los huecos que declara la API (sin hoy): tienen que ser los mismos.
    const deLosHuecos = huecos.flatMap((h) => {
      const dias = [];
      for (let d = h.from; d <= h.to; d = diaMenos(d, -1)) if (d >= r.desde && d <= r.hasta && d !== hoy) dias.push(d);
      return dias;
    }).length;
    return { duracion, n: conValor.length, sinRegistros, deLosHuecos, media: conValor.reduce((s, p) => s + p.value, 0) / Math.max(1, conValor.length) };
  };
  // A: 14 días alrededor del hueco de cuatro días de la base (D-62 a D-59); B: los últimos 14 días terminados.
  const A = { desde: diaMenos(hoy, 65), hasta: diaMenos(hoy, 52) };
  const B = { desde: diaMenos(hoy, 14), hasta: diaMenos(hoy, 1) };
  const [eA, eB] = [esperado(A), esperado(B)];
  await cupo(v);
  await ir(page, `${FICHA_A}&vista=analizar&m=nutricion.energia&desde=${desdeLeido}&hasta=${hoy}&cmp=${A.desde}_${A.hasta}_${B.desde}_${B.hasta}`);
  await quieto(page, v);
  const fila = await page.evaluate(() => {
    const t = [...document.querySelectorAll('table')].find((x) => x.querySelector('caption')?.textContent.includes('Comparación de los dos períodos'));
    const f = [...(t?.querySelectorAll('tbody tr') ?? [])].find((r) => r.querySelector('th')?.textContent.startsWith('Energía'));
    return f ? [...f.querySelectorAll('td')].map((c) => c.innerText.replace(/\s+/g, ' ').trim()) : [];
  });
  const kcal = (t) => Number((/^([\d.]+(?:,\d+)?) kcal/.exec(t ?? '')?.[1] ?? 'NaN').replace(/\./g, '').replace(',', '.'));
  comprobar(
    'CP-18',
    'Con huecos, «Comparar dos períodos» dice los días del rango, cuántos tienen valor y cuántos no tienen registros (los mismos huecos que declara la API), con la media de los valores disponibles',
    eA.sinRegistros > 0 &&
      eA.sinRegistros === eA.deLosHuecos &&
      (fila[1] ?? '').includes(`${eA.duracion} días: ${eA.n} con valor`) &&
      (fila[1] ?? '').includes(`${eA.sinRegistros} sin registros`) &&
      Math.abs(kcal(fila[1]) - eA.media) <= 1 &&
      (fila[2] ?? '').includes(`${eB.duracion} días: ${eB.n} con valor`) &&
      !/\b(\d+) de \1 días/.test(fila.join(' ')),
    `A esperado: ${eA.duracion} días, ${eA.n} con valor, ${eA.sinRegistros} sin registros (huecos de la API: ${eA.deLosHuecos}), media ${eA.media.toFixed(1)} · tabla: ${fila.join(' | ').slice(0, 300)}`,
  );
  await captura(page, v, carpeta, 'cp18-comparar-dos-periodos-con-huecos');
}

/** Recorrido 4: etapas A/B → valores a mano → agrupar → acercar → referencia conservada → guardar y reabrir (CP-14, CP-17, CP-18, CP-26). */
async function recorridoEtapas(page, v, carpeta) {
  const e = estado;
  const url = `${FICHA_A}&vista=analizar&pregunta=comparar-etapas&area=NUTRICION&etapaA=${e.nutricion.planV1}&etapaB=${e.nutricion.planV2}&ref=14`;
  await cupo(v);
  await ir(page, url);
  await quieto(page, v);
  // CP-14: las etapas salen de las vigencias reales.
  const vig = (await leerApi(v, `/advisees/${e.aseId}/projections/NUTRITION_PRESCRIBED_VS_RECORDED?metric=ENERGY&periodStart=${diaMenos(hoy, 365)}&periodEnd=${hoy}`)).data.result;
  const vA = vig.planVersions.find((x) => x.planVersionId === e.nutricion.planV1);
  const vB = vig.planVersions.find((x) => x.planVersionId === e.nutricion.planV2);
  const tarjetas = await textos(page, '.comparacion-de-etapas .etapa');
  comprobar(
    'CP-14',
    'Las etapas salen de las activaciones reales: A termina el día anterior al corte y B sigue vigente; sin doble conteo del día del corte',
    vA && vB && vA.to === vB.from && tarjetas[0]?.includes(`Desde ${diaDe(vA.activatedAt)}`) && tarjetas[0]?.includes(diaDe(`${diaMenos(vA.to, 1)}T15:00:00Z`)) && /Sigue vigente/.test(tarjetas[1] ?? ''),
    tarjetas.map((t) => t.slice(0, 140)).join(' || '),
  );
  // CP-18: la tabla con el mismo criterio; los valores y la cobertura en días de cada etapa, calculados aparte con los
  // puntos diarios de la API. Pasada del 2026-10-09: «48 días: 44 con valor · 4 sin registros», nunca «44 de 44 días».
  const puntos = vig.recorded.points;
  const media = (d1, d2) => {
    const delRango = puntos.filter((pt) => pt.date >= d1 && pt.date <= d2);
    const xs = delRango.filter((pt) => pt.value !== null && !pt.partialBucket && pt.date !== hoy).map((pt) => pt.value);
    const dias = Math.round((Date.parse(`${d2}T12:00:00Z`) - Date.parse(`${d1}T12:00:00Z`)) / 86_400_000) + 1;
    const hoyAdentro = d1 <= hoy && hoy <= d2;
    const terminados = delRango.filter((pt) => pt.date !== hoy && !pt.partialBucket);
    return { n: xs.length, media: xs.reduce((s, x) => s + x, 0) / xs.length, dias, hoyAdentro, sinRegistros: dias - new Set(terminados.map((pt) => pt.date)).size - (hoyAdentro ? 1 : 0) };
  };
  const coberturaAMano = (x) => [`${x.dias} días: ${x.n} con valor`, ...(x.sinRegistros > 0 ? [`${x.sinRegistros} sin registros`] : []), ...(x.hoyAdentro ? ['hoy, en curso: fuera de la media'] : [])];
  const esperadoA = media(vA.from, diaMenos(vA.to, 1));
  const esperadoB = media(vB.from, hoy);
  const fila = async () => page.evaluate(() => {
    const f = [...document.querySelectorAll('.tabla-de-etapas tbody tr')].find((r) => r.querySelector('th')?.textContent.startsWith('Energía'));
    return f ? [...f.querySelectorAll('td')].map((c) => c.innerText.replace(/\s+/g, ' ').trim()) : [];
  });
  const energia = await fila();
  const numeroDe = (t) => Number((/^(-?[\d.]+(?:,\d+)?) kcal/.exec(t ?? '')?.[1] ?? 'NaN').replace(/\./g, '').replace(',', '.'));
  const diferencia = Number((/([−-]?[\d.]+) kcal/.exec(energia[3] ?? '')?.[1] ?? 'NaN').replace('−', '-').replace(/\./g, ''));
  comprobar(
    'CP-18',
    'Energía por etapa: la media de los días con valor y la cobertura en días de la etapa, calculadas a mano con los puntos de la API, coinciden con la tabla (y la diferencia también)',
    Math.round(esperadoA.media) === numeroDe(energia[1]) &&
      Math.round(esperadoB.media) === numeroDe(energia[2]) &&
      Math.abs(diferencia - (esperadoB.media - esperadoA.media)) <= 1 &&
      coberturaAMano(esperadoA).every((x) => energia[1].includes(x)) &&
      coberturaAMano(esperadoB).every((x) => energia[2].includes(x)) &&
      !/\b(\d+) de \1 días/.test(energia.join(' ')),
    `tabla: ${energia.join(' | ').slice(0, 300)} · a mano: A ${esperadoA.media.toFixed(1)} (${coberturaAMano(esperadoA).join(' · ')}), B ${esperadoB.media.toFixed(1)} (${coberturaAMano(esperadoB).join(' · ')})`,
  );
  comprobar('CP-18', 'El hueco de cuatro días de la etapa A queda en la cobertura como días sin registros: no sale del denominador', esperadoA.sinRegistros >= 4 && energia[1].includes(`${esperadoA.sinRegistros} sin registros`), energia[1]);
  // Analizar según la pregunta (pasada del 2026-10-09): con la pregunta de etapas, la comparación a mano es secundaria y
  // plegada debajo de la tabla, el resumen en texto se pliega, no se repite la lista de etapas, cada límite se dice una vez
  // y la letra no se achica.
  const vista = await page.evaluate(() => {
    const etapas = document.querySelector('.comparacion-de-etapas');
    const aMano = document.querySelector('details.comparar-a-mano');
    const visible = document.querySelector('.analizar')?.innerText ?? '';
    const veces = (re) => (visible.match(re) ?? []).length;
    return {
      aMano: aMano ? { abierta: aMano.open, justoDebajo: etapas?.nextElementSibling === aMano, rotulo: aMano.querySelector('summary')?.textContent ?? '' } : null,
      seccionAlFinal: [...document.querySelectorAll('.analizar h3')].some((h) => h.textContent === 'Comparar dos períodos'),
      resumenPlegado: !!document.querySelector('details.resumen-en-texto--plegado') && !document.querySelector('section.resumen-en-texto'),
      listaDeEtapas: !!document.querySelector('details.etapas-del-grafico'),
      causa: veces(/no indica causa/g),
      noSeRestan: veces(/No se restan totales/g),
      letraDeLaCobertura: parseFloat(getComputedStyle(document.querySelector('.tabla-de-etapas .celda__detalle')).fontSize),
      raiz: parseFloat(getComputedStyle(document.documentElement).fontSize),
    };
  });
  comprobar('R4', 'Con la pregunta de etapas, «Comparar otros dos períodos» es una opción plegada, justo debajo de la tabla de etapas, y no una sección más al final', !!vista.aMano && !vista.aMano.abierta && vista.aMano.justoDebajo && /Comparar otros dos períodos/.test(vista.aMano.rotulo) && !vista.seccionAlFinal, JSON.stringify(vista.aMano));
  comprobar('R4', 'Sin repetir: el resumen en texto plegado, sin la lista de etapas que repetía las tarjetas, y cada límite de interpretación a la vista una sola vez', vista.resumenPlegado && !vista.listaDeEtapas && vista.causa === 1 && vista.noSeRestan === 1, `causa ×${vista.causa} · no se restan ×${vista.noSeRestan} · resumen plegado: ${vista.resumenPlegado} · lista de etapas: ${vista.listaDeEtapas}`);
  comprobar('R4', 'La letra no se achicó: la cobertura de la tabla de etapas tiene el tamaño de un dato secundario (0,95 rem)', vista.letraDeLaCobertura >= 0.95 * vista.raiz - 0.05, `${vista.letraDeLaCobertura} px · raíz ${vista.raiz} px`);
  // La comparación a mano sigue accesible: se abre, y elegir fechas arma su tabla con la misma cobertura.
  await page.evaluate(() => document.querySelector('details.comparar-a-mano summary')?.click());
  await pausa(150);
  const camposAMano = await page.$$eval('details.comparar-a-mano input[type="date"]', (cs) => cs.length);
  comprobar('R4', '«Comparar otros dos períodos» se abre con un toque y tiene sus cuatro fechas', camposAMano === 4, `${camposAMano} campos de fecha`);
  await page.evaluate(() => document.querySelector('details.comparar-a-mano summary')?.click());
  const registros = await page.evaluate(() => [...document.querySelectorAll('.tabla-de-etapas tbody tr')].find((r) => r.querySelector('th')?.textContent.startsWith('Registros'))?.innerText.replace(/\s+/g, ' ') ?? '');
  comprobar('CP-18', 'Dos totales de duraciones distintas no se restan, y se dice por qué', /duraciones distintas no se restan/.test(registros), registros.slice(0, 200));
  const graficosEtapas = await graficos(page);
  comprobar('R4', 'Debajo de la tabla, los gráficos de las métricas de la pregunta con el período de las dos etapas', graficosEtapas.length >= 2 && graficosEtapas.every((g) => g.svg && g.curvas > 0) && parametros(page).get('desde') === vA.from, `${graficosEtapas.length} gráficos · desde ${parametros(page).get('desde')} hasta ${parametros(page).get('hasta')}`);
  await captura(page, v, carpeta, 'r4-etapas-con-graficos');
  // CP-17: agrupar por semana y acercar no cambian la tabla ni la referencia fija.
  const tablaAntes = await texto(page, '.tabla-de-etapas');
  await clic(page, '.capa', 'Semana');
  await quieto(page, v);
  const conSemana = await texto(page, '.tabla-de-etapas');
  await abrirDetalles(page, 'details.intervalo');
  await page.evaluate(() => document.querySelectorAll('details.intervalo input[type="date"]').forEach((c, i) => c.setAttribute('data-intervalo', i === 0 ? 'desde' : 'hasta')));
  await fijarFecha(page, '[data-intervalo="desde"]', diaMenos(hoy, 40));
  await pausa(150);
  await fijarFecha(page, '[data-intervalo="hasta"]', diaMenos(hoy, 10));
  await quieto(page, v, { silencio: 300 });
  const conZoom = await texto(page, '.tabla-de-etapas');
  comprobar('CP-17', 'Agrupar por semana y acercar el gráfico no cambian la tabla A/B (resume las observaciones originales) ni la referencia fija', tablaAntes === conSemana && conSemana === conZoom && parametros(page).get('ref') === '14' && parametros(page).get('g') === 'W', `g=${parametros(page).get('g')} · ref=${parametros(page).get('ref')}`);
  // CP-26: guardar la vista con la pregunta, reabrirla, y en otro asesorado las etapas se piden de nuevo.
  const nombre = `Etapas ${new Date().toISOString().slice(11, 19).replace(/:/g, '')}`;
  await clic(page, 'details.vistas-guardadas summary', 'Vistas guardadas');
  await page.type('details.vistas-guardadas input', nombre);
  await clic(page, 'details.vistas-guardadas button', 'Guardar esta vista');
  await page.waitForFunction(() => document.querySelector('details.vistas-guardadas')?.innerText.includes('Guardada:'), { timeout: 20_000 });
  const guardadas = (await leerApi(v, '/me/analysis-views')).data;
  const guardada = guardadas.find((x) => x.name === nombre);
  comprobar('CP-26', 'La vista guardada lleva la pregunta y sus parámetros como identificadores, sin resultados', guardada?.configuration?.question?.id === 'comparar-etapas' && guardada.configuration.question.params.stageA === e.nutricion.planV1 && !JSON.stringify(guardada).includes('kcal'), JSON.stringify(guardada?.configuration?.question ?? null));
  await cupo(v);
  await ir(page, FICHA_A);
  await quieto(page, v);
  await ir(page, `${FICHA_A}&vista=analizar&m=nutricion.energia`);
  await quieto(page, v);
  await clic(page, 'details.vistas-guardadas summary', 'Vistas guardadas');
  await quieto(page, v);
  await clic(page, 'details.vistas-guardadas button', `Abrir ${nombre}`);
  await quieto(page, v);
  const reabierta = parametros(page);
  comprobar('CP-26', 'Reabierta en el mismo asesorado, vuelve la comparación de las mismas etapas', reabierta.get('pregunta') === 'comparar-etapas' && reabierta.get('etapaA') === e.nutricion.planV1 && (await textos(page, '.comparacion-de-etapas .etapa')).length === 2, page.url().replace(WEB, '').slice(0, 200));
  if (FICHA_E) {
    await cupo(v);
    await ir(page, `${FICHA_E}&vista=analizar&m=nutricion.energia`);
    await quieto(page, v);
    await clic(page, 'details.vistas-guardadas summary', 'Vistas guardadas');
    await quieto(page, v);
    await clic(page, 'details.vistas-guardadas button', `Abrir ${nombre}`);
    await quieto(page, v);
    const enOtro = await texto(page, '.analizar');
    comprobar('CP-26', 'Abierta en otro asesorado, las etapas del primero no aplican: se dice y se piden de nuevo, sin sustituirlas', /no aplica a este asesorado/.test(enOtro) && (await textos(page, '.comparacion-de-etapas .etapa')).length === 0, enOtro.slice(0, 220));
    await captura(page, v, carpeta, 'r4-vista-en-otro-asesorado');
  }
}

/** CP-11 a CP-13: la clase y el método del dato, iguales en el gráfico, la lectura, la tabla y el CSV; el punto elegido la conserva. */
async function clasesDelDato(page, v, descargas, carpeta = null) {
  const tomas = (await leerApi(v, `/advisees/${estado.aseId}/projections/ANTHROPOMETRIC_SERIES?metric=peso&periodStart=${diaMenos(hoy, 89)}&periodEnd=${hoy}`).catch(() => null))?.data?.result ?? null;
  const reportada = tomas?.points?.find((pt) => pt.dataClass === 'REPORTED');
  informar('CP-11', 'El peso reportado por la persona en el escenario', reportada ? `${reportada.date}: ${reportada.value} kg` : 'no se pudo leer por la proyección; se busca en la pantalla');
  await cupo(v);
  await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent('antropometria.peso,antropometria.imc')}&g=O`);
  await quieto(page, v);
  const g = await graficos(page);
  const leyenda = await texto(page, '.leyenda');
  comprobar('CP-11', 'En el gráfico, el peso tiene puntos medidos y reportados y el IMC calculados, cada clase con su forma, y la leyenda lo dice', g[0]?.clases.includes('REPORTED') && g[1]?.clases.includes('DERIVED') && /reportado por la persona/.test(leyenda) && /calculado por un método/.test(leyenda), `peso: ${g[0]?.clases.join(',')} · IMC: ${g[1]?.clases.join(',')}`);
  // El punto reportado elegido: la lectura dice su clase y el aro de selección no la tapa (sigue la marca de la clase).
  const fechaReportada = reportada?.date ?? diaMenos(hoy, 5);
  await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent('antropometria.peso,antropometria.imc')}&g=O&f=${fechaReportada}`);
  await quieto(page, v);
  const lectura = await texto(page, '.panel-de-lectura');
  // El punto elegido lleva un aro (un círculo sin relleno, en el color del texto) dibujado DEBAJO de su marca: el grupo
  // conserva la clase (`data-clase`) y la forma de la clase sigue encima del aro.
  const elegido = await page.evaluate(() => {
    const grupos = [...document.querySelectorAll('figure.grafico__figura g.grafico__elegible')];
    const g = grupos.find((x) => x.querySelector('circle[fill="none"][stroke="var(--texto)"]'));
    const aro = g?.querySelector('circle[fill="none"][stroke="var(--texto)"]');
    return { hay: !!g, clase: g?.getAttribute('data-clase') ?? null, marcas: g ? g.children.length : 0, aroPrimero: g ? g.firstElementChild === aro : false };
  });
  comprobar(
    'CP-12',
    'Al elegir el punto reportado, la lectura dice «Reportado por la persona, no medido» y el punto conserva su clase: el aro va debajo de la marca de la clase',
    /Reportado por la persona, no medido/.test(lectura) && elegido.hay && elegido.clase === 'REPORTED' && elegido.marcas >= 2 && elegido.aroPrimero,
    `${lectura.slice(0, 160)} · marca elegida: ${JSON.stringify(elegido)}`,
  );
  if (carpeta) await captura(page, v, carpeta, 'cp12-punto-elegido-reportado');
  // CP-13: el IMC es un índice, no una estimación; el método se nombra.
  await ir(page, `${FICHA_A}&vista=analizar&m=antropometria.imc&g=O`);
  await quieto(page, v);
  const lecturaImc = await texto(page, '.panel-de-lectura');
  await abrirDetalles(page, 'details.tabla-de-datos');
  const tabla = await texto(page, 'details.tabla-de-datos');
  comprobar('CP-13', 'El IMC se dice calculado (un índice, no una estimación), con su método, en la lectura y en la tabla', /Calculado: un índice calculado sobre medidas, no una estimación/.test(lecturaImc) && /Índice de masa corporal \(IMC\)/.test(lecturaImc) && /un índice calculado sobre medidas, no una estimación/.test(tabla) && !/estimación\)/.test(tabla.replaceAll('no una estimación', '')), lecturaImc.slice(0, 220));
  const anteriores = fs.readdirSync(descargas).filter((x) => x.endsWith('.csv'));
  await clic(page, 'button', 'Descargar los datos (CSV)');
  const { archivo, csv } = await esperarCsv(descargas, anteriores);
  const lineas = csv.split('\r\n');
  const filas = lineas.slice(lineas.findIndex((l) => l.startsWith('Métrica;Unidad;Método')) + 1).filter((l) => l.length > 0).map((l) => l.split(';'));
  comprobar('CP-11', 'El CSV dice la misma clase y el método: «Calculado: un índice…» con el nombre del método', !!archivo && filas.length > 0 && filas.every((f) => f.some((c) => c.startsWith('Calculado: un índice calculado sobre medidas, no una estimación (Índice de masa corporal (IMC))'))), `${archivo} · ${filas.map((f) => f.find((c) => c.startsWith('Calculado')) ?? '').slice(0, 2).join(' · ')}`);
}

/** CP-25: buscar en los catálogos desde la web nueva no pone el texto en ninguna URL (va en el cuerpo de un POST). */
async function busquedaEnCatalogos(page, v) {
  const desdeUrl = v.urls.length;
  const desdeCuerpo = v.cuerpos.length;
  await cupo(v);
  await ir(page, '/pro/recipes');
  await quieto(page, v);
  await clic(page, 'button, a', 'Nueva receta');
  await quieto(page, v);
  const buscador = await page.$('#receta-buscar-texto');
  if (!buscador) throw new Error('no encontré el buscador de alimentos en «Nueva receta»');
  await buscador.type('arroz');
  await page.keyboard.press('Enter');
  await quieto(page, v);
  await pausa(800);
  await quieto(page, v);
  const urls = v.urls.slice(desdeUrl);
  const cuerpos = v.cuerpos.slice(desdeCuerpo);
  comprobar('CP-25', 'La búsqueda de alimentos viaja en el cuerpo de un POST; ninguna URL lleva el texto', cuerpos.some((c) => c.url.includes('/catalog-items/search') && c.cuerpo.includes('arroz')) && !urls.some((u) => /arroz/i.test(u)), `${cuerpos.length} búsqueda(s) por cuerpo · ${urls.filter((u) => /catalog/.test(u)).map((u) => u.replace(API, '').slice(0, 70)).join(' · ')}`);
  const log = fs.readFileSync(enTrabajo('api.log'), 'utf8');
  comprobar('CP-25', 'El registro de la API no tiene el texto buscado', !/arroz/i.test(log), `${log.length} caracteres revisados`);
}

/** Recorrido 6: respuesta lenta que llega tarde, error de una sola área y conflicto de escritura (CP-06, CP-22). */
async function recorridoRecuperacion(page, v, carpeta) {
  // CP-22: la respuesta del asesorado A llega después de pasar al E; no se mezcla.
  if (FICHA_E) {
    v.reglas = [{ coincide: (u, m) => m === 'GET' && u.includes(`/advisees/${estado.aseId}/projections/`), accion: 'demorar', ms: 3500 }];
    await cupo(v);
    await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent(TRES)}`);
    await pausa(600);
    await ir(page, `${FICHA_E}&vista=analizar&m=nutricion.energia`);
    await pausa(4200);
    await quieto(page, v);
    v.reglas = [];
    const titulo = await texto(page, 'h1');
    const lienzo = await textos(page, '.grafico__titulo');
    const peso = lienzo.some((t) => /Peso/.test(t));
    comprobar('CP-22', 'La respuesta lenta del asesorado anterior llega después de cambiar de persona y no se muestra: solo los datos de la persona elegida', titulo !== '' && !/2fa34a/.test(titulo) && !peso && lienzo.length === 1, `${titulo} · ${lienzo.join(' | ')}`);
  }
  // CP-06: la lectura de lo nuevo falla; la síntesis lo dice y no lo convierte en «no hay novedades».
  v.reglas = [{ coincide: (u, m) => m === 'GET' && /\/timeline\?/.test(u) && /[?&]since=/.test(u), accion: 'responder', status: 503, codigo: 'SERVICE_UNAVAILABLE' }];
  await cupo(v);
  await ir(page, `${FICHA_A}&p=30`);
  await quieto(page, v);
  await clic(page, '.encabezado-de-bloque button, .encabezado-de-bloque a', 'Ver todas').catch(() => {});
  const sintesis = await texto(page, '.para-tu-revision');
  // Lo que falta va primero: el aviso está antes de la primera observación.
  const primero = await page.evaluate(() => {
    const f = document.querySelector('.para-tu-revision .observaciones__fallas');
    const o = document.querySelector('.para-tu-revision .observacion');
    return f && o ? Boolean(f.compareDocumentPosition(o) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
  });
  v.reglas = [];
  comprobar('CP-06', 'Si falla la lectura de lo nuevo, la síntesis dice «No pudimos completar esta parte» antes que las observaciones, nunca «No hay registros nuevos»', /No pudimos completar esta parte \(lo nuevo desde la revisión\)/.test(sintesis) && !/No hay registros nuevos/.test(sintesis) && primero, sintesis.slice(0, 260));
  await captura(page, v, carpeta, 'r6-sintesis-con-una-parte-que-falla');
  // Error de una sola área en Analizar: la nutrición falla y el peso se dibuja; la parte que falta tiene reintento.
  v.reglas = [{ coincide: (u, m) => m === 'GET' && u.includes('/projections/NUTRITION'), accion: 'responder', status: 503, codigo: 'SERVICE_UNAVAILABLE' }];
  await cupo(v);
  await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent(TRES)}`);
  await quieto(page, v);
  const analizar = await texto(page, '.analizar');
  const dibujados = await graficos(page);
  v.reglas = [];
  comprobar('R6', 'Con la nutrición sin responder, el peso se dibuja y las partes que faltan lo dicen con su reintento, sin ceros', dibujados.length === 1 && /Peso/.test(dibujados[0]?.titulo ?? '') && /Reintentar/.test(analizar), `${dibujados.map((g) => g.titulo).join(' | ')}`);
  // El «Reintentar» de una serie (no el de lo que hay en el período): trae también lo demás que falló.
  await clic(page, '.analizar__lienzo .campo__error button', 'Reintentar');
  await quieto(page, v);
  comprobar('R6', 'Reintentar, con la API de nuevo disponible, trae los tres gráficos', (await graficos(page)).length === 3, '');
  // Conflicto de escritura: guardar los indicadores choca con otra versión; lo elegido no se pierde.
  await cupo(v);
  await ir(page, FICHA_A);
  await quieto(page, v);
  await clic(page, 'button', 'Elegir indicadores');
  await quieto(page, v);
  v.reglas = [{ coincide: (u, m) => (m === 'POST' || m === 'PUT') && u.includes('/me/analysis-views'), accion: 'responder', status: 409, codigo: 'VERSION_CONFLICT' }];
  // Se cambia la elección (se desmarca el primero) y se guarda contra una versión que ya cambió.
  await page.evaluate(() => document.querySelector('.editor-de-indicadores input[type="checkbox"]:checked')?.click());
  const marcadasAntes = await page.$$eval('.editor-de-indicadores input[type="checkbox"]:checked', (xs) => xs.map((x) => x.parentElement.textContent.trim()));
  await clic(page, '.editor-de-indicadores button', 'Guardar indicadores');
  await quieto(page, v);
  const error = await texto(page, '.editor-de-indicadores .campo__error');
  const marcadasDespues = await page.$$eval('.editor-de-indicadores input[type="checkbox"]:checked', (xs) => xs.map((x) => x.parentElement.textContent.trim()));
  v.reglas = [];
  comprobar('R6', 'Un conflicto al guardar los indicadores se explica, la elección hecha sigue marcada y se vuelve a leer la guardada', /cambiaron en otra pestaña/.test(error) && /Tu elección sigue acá/.test(error) && JSON.stringify(marcadasAntes) === JSON.stringify(marcadasDespues), `${error} · ${marcadasDespues.join(', ')}`);
  await captura(page, v, carpeta, 'r6-conflicto-al-guardar-indicadores');
  await clic(page, '.encabezado-de-bloque button', 'Cerrar');
}

/** CP-28: teclado y foco visible, zoom al 200 % y el árbol de accesibilidad de la síntesis y de las preguntas. */
async function accesibilidad(page, v, carpeta) {
  await cupo(v);
  await ir(page, FICHA_A);
  await quieto(page, v);
  // Teclado: desde el encabezado, con Tab se llega a la primera observación y a las preguntas; el foco se ve.
  await page.focus('h1').catch(() => {});
  const recorridos = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const a = document.activeElement;
      const cs = a ? getComputedStyle(a) : null;
      return { texto: a?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 60) ?? '', visible: !!cs && (cs.outlineStyle !== 'none' || cs.boxShadow !== 'none'), dentro: !!a?.closest('.observacion, .preguntas-del-resumen, .acciones-del-resumen') };
    });
    recorridos.push(f);
    if (f.dentro && /pregunta|progresando|registrado coincide|información cuento/i.test(f.texto)) break;
  }
  const llegados = recorridos.filter((f) => f.dentro);
  comprobar('CP-28', 'Con el teclado se alcanzan las acciones de las observaciones y las preguntas del Resumen, con el foco visible', llegados.length > 0 && llegados.every((f) => f.visible), `${recorridos.length} Tab · ${llegados.map((f) => f.texto).slice(0, 4).join(' | ')}`);
  // Zoom al 200 %: la ventana de 1440 px vale 720 px de CSS. Sin desborde de la página.
  await page.setViewport({ width: 720, height: 900, deviceScaleFactor: 2 });
  await quieto(page, v, { silencio: 300 });
  comprobar('CP-28', 'Con el zoom al 200 % (720 px de CSS), el Resumen no desborda de costado', await sinDesborde(page), '');
  await page.screenshot({ path: fileURLToPath(new URL('cp28-resumen-zoom-200.png', carpeta)) });
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await quieto(page, v, { silencio: 300 });
  // El árbol de accesibilidad: lo que oiría un lector de pantalla (no reemplaza la prueba con una persona).
  const arbol = await page.accessibility.snapshot({ interestingOnly: true });
  const planos = [];
  const recorrer = (n, nivel) => {
    if (!n) return;
    if (n.name || n.role === 'heading' || n.role === 'link' || n.role === 'button') planos.push(`${'  '.repeat(Math.min(nivel, 6))}${n.role}${n.level ? ` ${n.level}` : ''}: ${n.name ?? ''}`);
    for (const h of n.children ?? []) recorrer(h, nivel + 1);
  };
  recorrer(arbol, 0);
  fs.writeFileSync(fileURLToPath(new URL('arbol-de-accesibilidad-resumen.txt', carpeta)), planos.join('\n'));
  const sinNombre = planos.filter((l) => /^(\s*)(link|button): $/.test(l));
  comprobar('CP-28', 'En el árbol de accesibilidad del Resumen, los encabezados están y ningún enlace o botón queda sin nombre', planos.some((l) => /heading 2: Para tu próxima revisión/.test(l)) && sinNombre.length === 0, `${planos.length} nodos · sin nombre: ${sinNombre.length}`);
  informar('CP-28', 'Lector de pantalla', 'No se probó con NVDA, JAWS ni Narrador: no están instalados (NVDA, JAWS) o no se pueden manejar ni escuchar de forma automática (Narrador). Se deja el árbol de accesibilidad y el guion para la prueba con una persona.');
}

/** CP-29: tiempos en este equipo, con la API y la web locales y los datos del escenario (no se generalizan a Render). */
async function rendimiento(page, v) {
  const medir = async (nombre, url) => {
    await cupo(v);
    const desde = v.urls.length;
    const t0 = Date.now();
    await ir(page, url);
    await quieto(page, v);
    const ms = v.ultimo - t0;
    const pedidos = v.urls.slice(desde).filter((u) => !u.startsWith('OPTIONS')).length;
    informar('CP-29', `${nombre}: desde la navegación hasta la última respuesta`, `${ms} ms · ${pedidos} pedidos a la API`);
    return { ms, pedidos };
  };
  const r = await medir('Resumen', `${FICHA_A}&p=90`);
  comprobar('CP-29', 'El Resumen con la API en uso, dentro del presupuesto del paquete anterior (2,5 s)', r.ms <= 2500, `${r.ms} ms`);
  await medir('Analizar con tres métricas', `${FICHA_A}&vista=analizar&m=${encodeURIComponent(TRES)}`);
  await medir('Comparar dos etapas', `${FICHA_A}&vista=analizar&pregunta=comparar-etapas&area=NUTRICION&etapaA=${estado.nutricion.planV1}&etapaB=${estado.nutricion.planV2}`);
  await medir('Línea de tiempo con lo nuevo desde la revisión', `${FICHA_A}&vista=linea&areas=NUTRITION&novedades=${encodeURIComponent((await leerApi(v, `/advisees/${estado.aseId}/dashboard`)).data.domains.nutrition.summary.lastReview.recordedAt)}`);
}

/** Recorrido 2: ejercicio/serie → contraste histórico → preparar revisión → registrar → actualización sin duplicados (CP-09, CP-15, CP-19, CP-20). */
async function recorridoEntrenamiento(page, v, cortes, carpeta) {
  await cupo(v);
  await ir(page, `${FICHA_A}&vista=analizar&pregunta=registrado-vs-indicado&area=ENTRENAMIENTO`);
  await quieto(page, v);
  await elegir(page, '.parametros-de-pregunta', 'Ejercicio', { textoDeOpcion: 'Peso muerto' });
  await quieto(page, v, { silencio: 300 });
  await clic(page, '.parametros-de-pregunta button[type="submit"]', 'Ver la respuesta');
  await quieto(page, v);
  const contraste = await texto(page, '.contraste');
  comprobar('CP-09', 'El contraste de entrenamiento muestra cada sesión con lo que indicaba la versión que ejecutó', contraste.length > 100 && /Plan|planificado|indicad/i.test(contraste), contraste.slice(0, 260));
  await captura(page, v, carpeta, 'r2-contraste-entrenamiento');
  // Preparar la revisión: abre el formulario con el período desde la última revisión y no escribe.
  const desde = v.urls.length;
  await cupo(v);
  await ir(page, FICHA_A);
  await quieto(page, v);
  await clic(page, '.acciones-del-resumen a', 'Preparar la revisión de Entrenamiento');
  await page.waitForFunction(() => location.pathname === '/pro/advisees/training', { timeout: 20_000 });
  await quieto(page, v);
  const preparado = await texto(page, 'main');
  comprobar('CP-19', '«Preparar la revisión» abre el formulario con el período desde la última revisión, dicho como preparado por BE, y no escribe nada', /Preparado por BE para esta revisión/.test(preparado) && preparado.includes(diaDe(cortes.TRAINING.recordedAt)) && escrituras(v, desde).length === 0, escrituras(v, desde).join(' · ') || 'sin escrituras');
  // Registrar una revisión sintética: una sola escritura, y el resumen se actualiza.
  const listaAntes = (await textos(page, '.revisiones li, .revision')).length;
  // Pasada del 2026-10-09: nada viene marcado; se marca la versión del plan y un día entero de sesiones, y viaja una
  // referencia por registro marcado (el contrato no cambia).
  const resumenAlAbrir = await texto(page, '#trn-revision-evidencia .evidencia__resumen');
  const marcadasAlAbrir = await page.$$eval('#trn-revision-evidencia input[type="checkbox"]', (cs) => cs.filter((c) => c.checked || c.indeterminate).length);
  comprobar('CP-19', 'La evidencia de la revisión de Entrenamiento se abre sin nada marcado', resumenAlAbrir === 'Todavía no marcaste nada.' && marcadasAlAbrir === 0, `${resumenAlAbrir} · ${marcadasAlAbrir} casillas marcadas`);
  await page.evaluate(() => {
    document.querySelector('#trn-revision-evidencia .evidencia__seccion > .acto input')?.click();
    document.querySelector('#trn-revision-evidencia .evidencia__dia .evidencia__grupo-casilla input')?.click();
  });
  await pausa(150);
  const resumenMarcado = await texto(page, '#trn-revision-evidencia .evidencia__resumen');
  const marcadas = Number(/^Marcaste (\d+) de/.exec(resumenMarcado)?.[1] ?? 0);
  await page.type('#trn-revision-interpretacion', 'Interpretación sintética del recorrido 2.');
  await clic(page, '#trn-revision-resultado label', 'Mantener');
  await page.type('#trn-revision-fundamento', 'Fundamento sintético.');
  await page.type('#trn-revision-accion', 'Seguir con el plan vigente.');
  const desdeEnvio = v.urls.length;
  const cuerpos = [];
  const oyente = (req) => {
    if (req.method() === 'POST' && /\/training\/reviews$/.test(new URL(req.url()).pathname)) cuerpos.push(req.postData() ?? '');
  };
  page.on('request', oyente);
  await clic(page, 'form button[type="submit"]', 'Registrar revisión');
  await quieto(page, v);
  page.off('request', oyente);
  const referencias = (() => {
    try {
      return JSON.parse(cuerpos[0] ?? '{}').evidenceReferences ?? [];
    } catch {
      return [];
    }
  })();
  comprobar(
    'CP-20',
    'La revisión envía una referencia por registro marcado: el día marcado como grupo viaja como sus sesiones, una por una, con la versión del plan',
    marcadas >= 2 && referencias.length === marcadas && new Set(referencias.map((r) => r.id)).size === referencias.length && referencias.some((r) => r.type === 'PLAN_VERSION') && referencias.some((r) => r.type === 'EXECUTION'),
    `${resumenMarcado} · ${referencias.length} referencias: ${referencias.map((r) => r.type).join(', ')}`,
  );
  const posts = escrituras(v, desdeEnvio).filter((u) => /\/training\/reviews$/.test(new URL(u.split(' ')[1]).pathname));
  const tras = await texto(page, 'main');
  const aviso = await texto(page, '[role="status"]');
  comprobar('CP-20', 'Registrar la revisión hace una sola escritura y avisa, con la vuelta a la ficha', posts.length === 1 && /Volver a la ficha/.test(tras), `${posts.length} POST · ${aviso.slice(0, 120)}`);
  const listaDespues = (await textos(page, '.revisiones li, .revision')).length;
  informar('CP-20', 'Revisiones en la lista, antes y después', `${listaAntes} → ${listaDespues}`);
  await clic(page, 'a', 'Volver a la ficha');
  await page.waitForFunction(() => location.pathname === '/pro/advisees', { timeout: 20_000 });
  await quieto(page, v);
  const nuevo = (await leerApi(v, `/advisees/${estado.aseId}/dashboard`)).data.domains.training.summary.lastReview;
  const filaEntrenamiento = await page.evaluate(() => [...document.querySelectorAll('.tabla-de-planificacion tbody tr')].find((r) => r.querySelector('th')?.textContent === 'Entrenamiento')?.innerText.replace(/\s+/g, ' ') ?? '');
  const sintesis = await texto(page, '.observaciones');
  comprobar(
    'CP-20',
    'La ficha ya dice la revisión nueva (hoy, sin aplicar) y lo nuevo de Entrenamiento se cuenta desde ella: sin recargar ni duplicar',
    nuevo.reviewId !== cortes.TRAINING.reviewId && fechaCivilDe(nuevo.recordedAt) === hoy && filaEntrenamiento.includes(`Última: ${diaDe(nuevo.recordedAt)}`) && /registrada, sin aplicar/.test(filaEntrenamiento),
    `${filaEntrenamiento.slice(0, 200)} · ${sintesis.slice(0, 120)}`,
  );
  await captura(page, v, carpeta, 'r2-ficha-despues-de-registrar');
}

// ─── Revocación (recorrido 5) ─────────────────────────────────────────────────────────────────

/**
 * Con las cuentas descartables: el profesional tiene la ficha abierta en dos pestañas; el asesorado revoca Antropometría
 * desde su web; en la primera pestaña, abrir el origen de un punto lo descubre y la cabecera, los valores y las acciones de
 * ese alcance se retiran; en la segunda, exportar vuelve a consultar y no sale ningún archivo (CP-23).
 */
async function revocacion() {
  const d = estado.descartable;
  if (!d?.datos) throw new Error('falta el escenario descartable: datos/generar.mjs descartable-cuentas y descartable-datos');
  const carpeta = enTrabajo('funcional-comprension/');
  fs.mkdirSync(carpeta, { recursive: true });
  const descargas = fileURLToPath(enTrabajo('funcional-comprension/descargas-revocacion/'));
  fs.rmSync(descargas, { recursive: true, force: true });
  fs.mkdirSync(descargas, { recursive: true });
  const FICHA_D = `/pro/advisees?id=${d.aseId}`;
  const URL_D = `${FICHA_D}&vista=analizar&m=${encodeURIComponent('antropometria.peso,antropometria.imc')}`;
  const pro = await abrir(1440);
  const pro2 = await abrir(1440, { descargas });
  try {
    await iniciarSesion(pro.page, d.proCorreo, FICHA_D);
    await quieto(pro.page, pro.v);
    const cabeceraAntes = await texto(pro.page, '.ficha__acceso');
    await ir(pro.page, URL_D);
    await quieto(pro.page, pro.v);
    await iniciarSesion(pro2.page, d.proCorreo, FICHA_D);
    await quieto(pro2.page, pro2.v);
    await ir(pro2.page, URL_D);
    await quieto(pro2.page, pro2.v);
    const ase = await abrir(1440);
    try {
      await iniciarSesion(ase.page, d.aseCorreo, `/account/relationships/detail?id=${d.vinculos.ANTROPOMETRIA}`);
      await quieto(ase.page, ase.v);
      await clic(ase.page, 'button', 'Revocar acceso');
      await ase.page.waitForSelector('dialog[open]');
      await clic(ase.page, 'dialog[open] button', 'Revocar acceso');
      await ase.page.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 30_000 });
      await quieto(ase.page, ase.v);
      comprobar('R5', 'El asesorado revoca desde su web el acceso de Antropometría', /Acceso revocado/.test(await texto(ase.page, 'body')), '');
    } finally {
      await ase.navegador.close();
    }
    // Primera pestaña: abrir el origen de un punto descubre la revocación; la cabecera y la ficha se actualizan solas.
    await clic(pro.page, '.panel-de-lectura button', 'Ver el origen de este dato');
    await pro.page.waitForSelector('dialog[open]');
    await quieto(pro.page, pro.v);
    const origen = await texto(pro.page, 'dialog[open]');
    await clic(pro.page, 'dialog[open] button', 'Cerrar');
    await pro.page.waitForFunction(() => !document.querySelector('dialog[open]'));
    // El aviso de «no disponible» vuelve a preguntar el acceso (como mucho cada 5 s) sin vaciar la pantalla.
    await pro.page.waitForFunction(() => /Antropometría: (?!Activo)/.test(document.querySelector('.ficha__acceso')?.innerText ?? ''), { timeout: 15_000 }).catch(() => {});
    await quieto(pro.page, pro.v);
    const cabeceraDespues = await texto(pro.page, '.ficha__acceso');
    const lienzo = await texto(pro.page, '.analizar');
    comprobar('CP-23', 'Después de revocar, el origen dice «no está disponible» sin valores', /no está disponible/.test(origen) && !/\d+,\d kg/.test(origen), origen.slice(0, 300));
    comprobar('CP-23', 'La cabecera deja de decir «Activo» para Antropometría sin recargar; Nutrición sigue activa', /Antropometría: (?!Activo)/.test(cabeceraDespues) && /Nutrición: Activo/.test(cabeceraDespues), `antes: ${cabeceraAntes} · después: ${cabeceraDespues}`);
    comprobar('CP-23', 'Los gráficos de Antropometría se retiran y dicen por qué, sin valores viejos', (await graficos(pro.page)).length === 0 && /no está disponible con tu acceso actual/.test(lienzo), lienzo.slice(0, 200));
    await captura(pro.page, pro.v, carpeta, 'r5-revocado-analizar');
    await ir(pro.page, FICHA_D);
    await quieto(pro.page, pro.v);
    const resumen = await texto(pro.page, 'main');
    comprobar('CP-23', 'En el Resumen, Antropometría ya no aporta valores ni acciones; el resto del vínculo sigue', !/Abrir Antropometría|Ver la toma/.test(resumen) && /Nutrición/.test(resumen), resumen.slice(0, 260));
    await captura(pro.page, pro.v, carpeta, 'r5-revocado-resumen');
    // Segunda pestaña, con los datos viejos en pantalla: exportar vuelve a consultar y no sale ningún archivo.
    const antes = fs.readdirSync(descargas).filter((x) => x.endsWith('.csv'));
    await clic(pro2.page, 'button', 'Descargar los datos (CSV)');
    await pro2.page.waitForFunction(() => /No se descargó ningún archivo|Descargado:/.test(document.querySelector('.exportar')?.innerText ?? ''), { timeout: 20_000 }).catch(() => {});
    await pausa(1500);
    const nuevos = fs.readdirSync(descargas).filter((x) => x.endsWith('.csv') && !antes.includes(x));
    const avisoExportar = await texto(pro2.page, '.exportar');
    comprobar('CP-23', 'En la otra pestaña, exportar con la pantalla vieja vuelve a consultar: no sale ningún archivo y dice por qué', nuevos.length === 0 && /No se descargó ningún archivo/.test(avisoExportar), avisoExportar.slice(0, 200));
  } finally {
    await pro.navegador.close();
    await pro2.navegador.close();
  }
}

// ─── Principal ────────────────────────────────────────────────────────────────────────────────

const inicio = new Date();
try {
  if (modo === 'mirar') await mirar();
  else if (modo === 'capturas') await capturas();
  else if (modo === 'funcional') await funcional();
  else if (modo === 'revocacion') await revocacion();
  else if (modo === 'clases') {
    // Solo CP-11 a CP-13 (la clase y el método del dato, y el punto elegido), sin escribir nada.
    const descargas = fileURLToPath(enTrabajo('funcional-comprension/descargas-clases/'));
    fs.rmSync(descargas, { recursive: true, force: true });
    fs.mkdirSync(descargas, { recursive: true });
    const { navegador, page, v } = await abrir(1440, { descargas });
    try {
      await iniciarSesion(page, estado.proCorreo, FICHA_A);
      await quieto(page, v);
      await clasesDelDato(page, v, descargas, enTrabajo('funcional-comprension/'));
    } finally {
      await navegador.close();
    }
  }
  else {
    console.error('uso: node recorrido-comprension.mjs mirar [ancho] [tema] | capturas | funcional | revocacion');
    process.exit(2);
  }
} catch (e) {
  comprobar('—', 'El recorrido terminó por una excepción', false, e instanceof Error ? e.stack ?? e.message : String(e));
} finally {
  const fallas = resultados.filter((r) => !r.ok);
  if (modo !== 'mirar') {
    const carpeta = enTrabajo('funcional-comprension/');
    fs.mkdirSync(carpeta, { recursive: true });
    fs.writeFileSync(new URL(`resultado-${modo}.json`, carpeta), JSON.stringify({ modo, inicio: inicio.toISOString(), fin: new Date().toISOString(), hoy, total: resultados.length, fallas: fallas.length, resultados }, null, 2));
  }
  console.log(`\n${resultados.length - fallas.length} de ${resultados.length} bien${fallas.length ? `; con observaciones: ${fallas.map((f) => `${f.clave} ${f.descripcion.split(':')[0]}`).join(' · ')}` : ''}`);
  process.exitCode = fallas.length ? 1 : 0;
}
