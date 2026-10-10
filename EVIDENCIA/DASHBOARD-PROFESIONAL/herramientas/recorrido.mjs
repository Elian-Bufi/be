// Recorrido real del entorno profesional (encargo §18; ACEPTACION.md): Chrome contra la web y la API locales, con los datos
// sintéticos de `datos/regenerar.sh`. Interactúa con los controles y comprueba resultados; las capturas complementan.
//
// Uso: node recorrido.mjs [funcional|capturas|todo|descartable|menu|analizar]   (lee trabajo/estado.json; escribe trabajo/recorrido/)
//
// - Una sesión por cuenta y por navegador (el límite de inicios es 5 cada 15 minutos).
// - Respeta el cupo de 120 lecturas protegidas por minuto: si se acerca, espera (`cupo`).
// - Las fallas (503, 429, sin red) y la respuesta lenta se simulan interceptando pedidos en el navegador: no se toca la
//   API ni la base.
// - Un gráfico no se da por bueno por su título: `comprobarGraficos` mira lo que realmente se dibujó (superficie, ejes,
//   curvas y marcas), que nada lo tape y, en una captura de la ventana, los píxeles del color de cada métrica.
// - Las capturas no usan `fullPage`: esa captura achica la ventana a 1 × 1 por un instante, recharts quita el gráfico
//   (su contenedor mide 0) y la imagen puede salir sin él (revisión de #153, hallazgo 1). Se agranda la ventana al alto
//   de la página, se espera el dibujo y se captura la ventana tal cual.
// - El encabezado, el menú de la cuenta y las tarjetas de preguntas (WP-ESCRITORIO-AMABLE, E-17 y E-18) se comprueban al
//   final del modo funcional, en una sesión propia porque termina cerrándola. `menu` corre solo esa parte.
// - La composición de Analizar y el lenguaje de sus gráficos (WP-ESCRITORIO-AMABLE, parte 2) se comprueban en
//   `analizarRecompuesto`, también en una sesión propia, antes del encabezado. `analizar` corre solo esa parte.
// - `descartable` usa las cuentas descartables de `datos/generar.mjs descartable-cuentas` y `descartable-datos`
//   (valores medidos, informados y estimados; revocación desde la web del asesorado).
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { enTrabajo, REPO } from './rutas.mjs';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const [modo = 'todo'] = process.argv.slice(2);
const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const WEB = 'http://localhost:3000';
const API = 'http://localhost:3001';
const CRED = 'clave-sintetica-de-prueba-01';
const DIR = enTrabajo('recorrido/');
fs.mkdirSync(DIR, { recursive: true });
const DESCARGAS = fileURLToPath(enTrabajo('recorrido/descargas/'));
fs.rmSync(DESCARGAS, { recursive: true, force: true });
fs.mkdirSync(DESCARGAS, { recursive: true });
const AXE = fs.readFileSync(`${REPO}/node_modules/axe-core/axe.min.js`, 'utf8');
/** El registro de la API (entorno.sh lo agrega a trabajo/api.log): se mira solo lo que escribió esta corrida. */
const API_LOG = enTrabajo('api.log');
const inicioDelLog = fs.existsSync(API_LOG) ? fs.statSync(API_LOG).size : 0;
const dominio = createRequire(`${REPO}/packages/domain/`)(`${REPO}/packages/domain/dist/index.js`);
/** «8 sept 2026», como `diaCivil` de la web. */
const diaCivil = (f) => new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${f}T12:00:00Z`));
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const hoy = estado.hoy;
const diaMenos = (fecha, n) => new Date(Date.parse(`${fecha}T12:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);
const FICHA_A = `/pro/advisees?id=${estado.aseId}`;
const FICHA_B = `/pro/advisees?id=${estado.aseBId}`;
const TRES = 'nutricion.energia,nutricion.proteinas,antropometria.peso';
/** El nombre de la vista guardada de esta corrida (único: una corrida interrumpida puede dejar otra). */
const VISTA = `Recorrido ${new Date().toISOString().slice(11, 19).replace(/:/g, '')}`;
/** La referencia que guarda esa vista: un rango fijo dentro de sus 30 días. */
const REF_DE_LA_VISTA = `${diaMenos(estado.hoy, 20)}_${diaMenos(estado.hoy, 14)}`;

// ─── Resultados ───────────────────────────────────────────────────────────────────────────────

const resultados = [];
/** Un dato medido que no se evalúa contra un umbral (se informa tal cual). */
function informar(pro, descripcion, detalle) {
  resultados.push({ pro, descripcion, ok: true, informativo: true, detalle: String(detalle) });
  console.log(`DATO  ${pro} · ${descripcion} — ${detalle}`);
}
function comprobar(pro, descripcion, ok, detalle = '') {
  resultados.push({ pro, descripcion, ok: Boolean(ok), detalle: String(detalle).slice(0, 400) });
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${pro} · ${descripcion}${detalle ? ` — ${String(detalle).slice(0, 160)}` : ''}`);
}

// ─── Navegador, vigilancia de pedidos e intercepción ──────────────────────────────────────────

const CORS = { 'Access-Control-Allow-Origin': WEB, 'Access-Control-Expose-Headers': 'x-request-id', Vary: 'Origin' };
const PREFLIGHT = { ...CORS, 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': '*', 'Access-Control-Max-Age': '5' };

async function abrir() {
  const navegador = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--lang=es-AR'],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await navegador.newPage();
  // `urls`: todo pedido a la API (también los OPTIONS), para comprobar que ningún texto buscado viaja en una URL;
  // `cuerpos`: los de API-DSH-04-BUSQUEDA; `token`: la sesión de la página, para leer la API como ella.
  const v = { enVuelo: 0, ultimo: Date.now(), marcas: [], errores: [], malas: [], reglas: [], urls: [], cuerpos: [], token: null };
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    const url = req.url();
    if (url.startsWith(API)) {
      v.urls.push(`${req.method()} ${url}`);
      if (req.method() === 'POST' && url.includes('/timeline/search')) v.cuerpos.push(req.postData() ?? '');
      if (req.headers().authorization) v.token = req.headers().authorization;
    }
    if (url.startsWith(API) && req.method() !== 'OPTIONS') {
      v.enVuelo++;
      v.ultimo = Date.now();
      v.marcas.push(Date.now());
      if (process.env.RECORRIDO_PEDIDOS) console.log(`  → ${new Date().toISOString().slice(11, 23)} ${req.method()} ${url.replace(API, '').replace(/[0-9a-f-]{36}/g, ':id').slice(0, 110)}`);
    }
    const regla = v.reglas.find((r) => r.coincide(url));
    if (!regla) return req.continue();
    if (req.method() === 'OPTIONS') return req.respond({ status: 204, headers: PREFLIGHT });
    if (regla.accion === 'demorar') {
      await pausa(regla.ms);
      return req.continue();
    }
    if (regla.accion === 'cortar') return req.abort('internetdisconnected');
    return req.respond({ status: regla.status, headers: CORS, contentType: 'application/json; charset=utf-8', body: JSON.stringify({ error: { code: regla.codigo, message: 'Falla simulada por el recorrido.' } }) });
  });
  const fin = (r) => {
    if (r.url().startsWith(API) && r.method() !== 'OPTIONS') {
      v.enVuelo = Math.max(0, v.enVuelo - 1);
      v.ultimo = Date.now();
      if (process.env.RECORRIDO_PEDIDOS) console.log(`  ← ${new Date().toISOString().slice(11, 23)} ${r.response()?.status() ?? 'falló'} ${r.url().replace(API, '').replace(/[0-9a-f-]{36}/g, ':id').slice(0, 110)}`);
    }
  };
  page.on('requestfinished', fin);
  page.on('requestfailed', fin);
  page.on('response', (r) => r.url().startsWith(API) && r.status() >= 400 && v.malas.push(`${r.status()} ${new URL(r.url()).pathname.replace(/[0-9a-f-]{36}/g, ':id')}`));
  page.on('pageerror', (e) => v.errores.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && v.errores.push(m.text()));
  const cdp = await navegador.target().createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DESCARGAS, eventsEnabled: true });
  return { navegador, page, v };
}

/**
 * Espera a que no haya pedidos a la API en vuelo ni «Cargando…» en pantalla, con al menos `silencio` ms desde la llamada
 * (una acción recién hecha puede tardar unos ms en empezar a pedir). Devuelve los ms hasta la última respuesta.
 */
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

/** No pasar de ~90 lecturas en un minuto móvil (el límite es 120 en una ventana fija de 60 s). */
async function cupo(v, maximo = 90) {
  for (;;) {
    const ahora = Date.now();
    v.marcas = v.marcas.filter((t) => ahora - t < 61_000);
    if (v.marcas.length <= maximo) return;
    await pausa(1000);
  }
}

async function iniciarSesion(page, v, correo, destino) {
  await page.goto(`${WEB}/login?volver=${encodeURIComponent(destino)}`, { waitUntil: 'networkidle0' });
  await page.type('#correo', correo);
  await page.type('#contrasena', CRED);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
  const ruta = destino.split('?')[0];
  await page.waitForFunction((r) => location.pathname.startsWith(r), { timeout: 60_000 }, ruta);
}

/** Lee la API como la página (con su sesión), para calcular a mano lo esperado. */
async function leerApi(v, ruta) {
  const r = await fetch(`${API}/api/v1${ruta}`, { headers: { Authorization: v.token, 'X-BE-Surface': 'WEB', Accept: 'application/json' } });
  if (!r.ok) throw new Error(`${ruta}: ${r.status}`);
  v.marcas.push(Date.now());
  return r.json();
}

/** Navega dentro de la aplicación, sin recargar: la sesión vive en memoria. */
const ir = (page, url) => page.evaluate((u) => window.next.router.push(u), url);
const parametros = (page) => new URL(page.url()).searchParams;
const texto = (page, s) => page.evaluate((s) => document.querySelector(s)?.innerText.replace(/\s+/g, ' ').trim() ?? '', s);
const textos = (page, s) => page.evaluate((s) => [...document.querySelectorAll(s)].map((e) => e.innerText.replace(/\s+/g, ' ').trim()), s);
const sinDesborde = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1);

/**
 * El período de la ficha es un solo control (WP-ESCRITORIO-AMABLE, C-02): se abre y adentro están los atajos. Elegir uno
 * lo cierra, así que cada elección vuelve a abrirlo.
 */
async function elegirPeriodo(page, atajo) {
  if (!(await page.$('.periodo-del-seguimiento__panel'))) await clic(page, '.periodo-del-seguimiento__boton', 'Período');
  await page.waitForSelector('.periodo-del-seguimiento__opciones button', { timeout: 5_000 });
  await clic(page, '.periodo-del-seguimiento__opciones button', atajo);
}

/**
 * Abre el control de período y dice qué ofrece y si el panel entra en la ventana; después lo cierra con Escape.
 * Es lo que antes se contaba a la vista (cuatro atajos y «Otro rango»), ahora a un clic.
 */
async function mirarPeriodo(page) {
  if (!(await page.$('.periodo-del-seguimiento__boton'))) return { boton: 0, atajos: 0, fechas: 0, entra: false, cierra: false };
  await page.evaluate(() => document.querySelector('.periodo-del-seguimiento__boton').click());
  await page.waitForSelector('.periodo-del-seguimiento__panel', { timeout: 5_000 });
  const dentro = await page.evaluate(() => {
    const r = document.querySelector('.periodo-del-seguimiento__panel').getBoundingClientRect();
    return {
      boton: document.querySelectorAll('.periodo-del-seguimiento__boton').length,
      atajos: document.querySelectorAll('.periodo-del-seguimiento__opciones button').length,
      fechas: document.querySelectorAll('.periodo-del-seguimiento__rango input[type="date"]').length,
      entra: r.left >= -1 && r.right <= document.documentElement.clientWidth + 1,
    };
  });
  await page.keyboard.press('Escape');
  const cierra = await page.waitForFunction(() => !document.querySelector('.periodo-del-seguimiento__panel'), { timeout: 3_000 }).then(() => true, () => false);
  return { ...dentro, cierra };
}

/**
 * El tema se elige en el menú de la cuenta, en la esquina del encabezado (WP-ESCRITORIO-AMABLE): se abre, se marca la
 * opción y se cierra con el mismo botón. Todo sin teclado y sin mover el foco: Escape cerraría también otro panel
 * abierto (el del período) y dejaría el aro de foco en las capturas. No recarga la página ni cierra la sesión.
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
}
/**
 * «Más acciones» guarda lo que se usa de vez en cuando en Analizar (WP-ESCRITORIO-AMABLE, C-08): las vistas guardadas, la
 * descarga, las capas, el intervalo con fechas y la comparación de dos períodos. Lo abre si está cerrado.
 */
async function abrirMasAcciones(page) {
  if (await page.$('.mas-acciones')) return;
  await clic(page, '.pregunta-en-curso__acciones button', 'Más acciones');
  await page.waitForSelector('.mas-acciones', { timeout: 5_000 });
}

/**
 * El pie de los gráficos abre, debajo de ellos, la tabla de datos, el resumen en texto, los hitos, las etapas o «Cómo se
 * calcula»: una cosa a la vez. Abre la que se pide, si no está, y espera a que aparezca.
 */
async function abrirDelPie(page, texto, selector) {
  if (await page.$(selector)) return;
  await clic(page, '.pie-de-graficos button', texto);
  await page.waitForSelector(selector, { timeout: 5_000 });
}
/** Hace clic (de verdad, con el mouse) en el primer elemento visible y habilitado que contiene el texto. */
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
}

/** Elige una opción del `<select>` cuya etiqueta contiene el texto, dentro del contenedor. */
async function elegir(page, contenedor, etiqueta, valor) {
  const marca = `s${Math.random().toString(36).slice(2)}`;
  const ok = await page.evaluate(
    (c, e, m) => {
      const label = [...document.querySelectorAll(`${c} label`)].find((l) => l.textContent.includes(e));
      const sel = label ? document.getElementById(label.htmlFor) : null;
      if (!sel) return false;
      sel.setAttribute('data-recorrido', m);
      return true;
    },
    contenedor,
    etiqueta,
    marca,
  );
  if (!ok) throw new Error(`no encontré el campo «${etiqueta}»`);
  await page.select(`[data-recorrido="${marca}"]`, valor);
}

/** Abre un <details> si está cerrado (con un clic en su resumen, como lo haría una persona). */
async function abrirDetalles(page, selector) {
  const cerrado = await page.evaluate((s) => { const d = document.querySelector(s); return d ? !d.open : false; }, selector);
  if (cerrado) await page.click(`${selector} > summary`);
}

/** Lleva un campo de fecha a un valor, como lo haría el selector del navegador (el evento que escucha React). */
async function fijarFecha(page, selector, valor) {
  await page.evaluate(
    (s, v) => {
      const el = document.querySelector(s);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    selector,
    valor,
  );
}

/** El intervalo visible de Analizar, con los campos «Desde» y «Hasta» (el atajo del arrastre hace lo mismo). */
async function fijarIntervalo(page, v, desde, hasta) {
  await abrirMasAcciones(page);
  await abrirDetalles(page, 'details.intervalo');
  await page.evaluate(() => document.querySelectorAll('details.intervalo input[type="date"]').forEach((c, i) => c.setAttribute('data-intervalo', i === 0 ? 'desde' : 'hasta')));
  await fijarFecha(page, '[data-intervalo="desde"]', desde);
  await pausa(150);
  await fijarFecha(page, '[data-intervalo="hasta"]', hasta);
  await quieto(page, v, { silencio: 300 });
}

/** Acerca el primer gráfico arrastrando el mouse de la fracción `a` a la `b` de su área de dibujo. */
async function arrastrar(page, v, a, b) {
  const caja = await page.evaluate(() => {
    const s = document.querySelector('.grafico__lienzo svg.recharts-surface');
    s.scrollIntoView({ block: 'center' });
    const r = s.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  const y = caja.y + caja.h * 0.5;
  const x0 = caja.x + 62 + (caja.w - 78) * a;
  const x1 = caja.x + 62 + (caja.w - 78) * b;
  await page.mouse.move(x0, y);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) await page.mouse.move(x0 + ((x1 - x0) * i) / 12, y);
  await page.mouse.up();
  await quieto(page, v, { silencio: 300 });
}

/** El primer «±X % contra la referencia» del panel de lectura. */
const lecturaRelativa = async (page) => /[+-]?[\d.,]+ % contra la referencia/.exec(await texto(page, '.panel-de-lectura'))?.[0] ?? '';

/** La fila de una métrica en la tabla de comparación de dos períodos (sus celdas, sin el nombre). */
const filaDeComparacion = (page, nombre) =>
  page.evaluate((n) => {
    const t = [...document.querySelectorAll('table')].find((x) => x.querySelector('caption')?.textContent.includes('Comparación'));
    const fila = [...(t?.querySelectorAll('tbody tr') ?? [])].find((r) => r.querySelector('th')?.textContent.startsWith(n));
    return fila ? [...fila.querySelectorAll('td')].map((c) => c.innerText.replace(/\s+/g, ' ').trim()).join(' | ') : '';
  }, nombre);

/** Espera el CSV que descargó la página (la carpeta se vacía al empezar cada corrida). */
async function esperarCsv(anteriores = []) {
  for (let i = 0; i < 40; i++) {
    const archivo = fs.readdirSync(DESCARGAS).find((x) => x.endsWith('.csv') && !anteriores.includes(x));
    if (archivo) return { archivo, csv: fs.readFileSync(`${DESCARGAS}/${archivo}`, 'utf8') };
    await pausa(250);
  }
  return { archivo: null, csv: '' };
}

async function axe(page) {
  await page.evaluate(AXE);
  return page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
    return r.violations.map((x) => ({ id: x.id, impacto: x.impact, nodos: x.nodes.length, ejemplo: x.nodes[0]?.target?.join(' ') ?? '' }));
  });
}

// ─── Lo que de verdad se dibujó ───────────────────────────────────────────────────────────────

/**
 * Cada gráfico de la página, después de llevarlo al centro de la ventana: su superficie SVG, las marcas de los dos ejes,
 * las curvas con trazo, las marcas de los puntos (con su clase de dato), la banda de referencia y, en el centro de cada
 * marca que está a la vista, si el elemento que hay ahí es del propio gráfico (nada lo tapa).
 */
async function dibujo(page) {
  const cantidad = await page.$$eval('figure.grafico__figura', (x) => x.length);
  const figuras = [];
  for (let i = 0; i < cantidad; i++) {
    figuras.push(
      await page.evaluate((i) => {
        const f = document.querySelectorAll('figure.grafico__figura')[i];
        f.scrollIntoView({ block: 'center' });
        const svg = f.querySelector('.grafico__lienzo svg.recharts-surface');
        const caja = svg?.getBoundingClientRect();
        const marcas = [...f.querySelectorAll('.grafico__elegible')].filter((m) => m.getBoundingClientRect().width > 0);
        let visibles = 0;
        let tapadas = 0;
        for (const m of marcas) {
          const b = m.getBoundingClientRect();
          const x = b.x + b.width / 2;
          const y = b.y + b.height / 2;
          if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
          const e = document.elementFromPoint(x, y);
          if (e && f.contains(e)) visibles++;
          else tapadas++;
        }
        return {
          titulo: f.querySelector('.grafico__titulo')?.textContent ?? '',
          svg: !!svg,
          ancho: Math.round(caja?.width ?? 0),
          alto: Math.round(caja?.height ?? 0),
          ejeX: f.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick').length,
          ejeY: f.querySelectorAll('.recharts-yAxis .recharts-cartesian-axis-tick').length,
          curvas: [...f.querySelectorAll('path.recharts-line-curve')].filter((p) => (p.getAttribute('d') ?? '').length > 10).length,
          marcas: marcas.length,
          visibles,
          tapadas,
          // recharts 3 dibuja la etiqueta de un área en su propia capa: la banda está si hay un rectángulo de área y la
          // etiqueta «Referencia» (que solo se dibuja cuando su rectángulo existe).
          banda: f.querySelectorAll('.recharts-reference-area-rect').length > 0 && [...f.querySelectorAll('svg text')].some((t) => t.textContent.trim() === 'Referencia'),
          clases: [...new Set(marcas.map((m) => m.dataset.clase).filter(Boolean))],
        };
      }, i),
    );
  }
  return figuras;
}

/**
 * Los píxeles del gráfico `i` en una captura de la ventana tal como está (sin `fullPage` ni `clip`: no cambia su
 * tamaño): la fracción de píxeles que no son del fondo y cuántos tienen el color de cada métrica (--metrica-1 a 3).
 * La captura se decodifica en un canvas de la misma página (la CSP admite imágenes `data:`): una pestaña aparte pasaría
 * al frente, y la captura de una pestaña de fondo no termina.
 *
 * Se mide **sin los textos del gráfico** (los rótulos de los ejes y de las bandas) y sin la línea de lo planificado, que
 * lleva el color de su métrica. En Azul noche, el color de los textos secundarios queda a un paso del de la primera
 * métrica: los bordes suavizados de las letras entraban en la tolerancia y sumaban píxeles «de la métrica» aunque no
 * hubiera serie (126 en un gráfico de tres marcas). Lo destapó la prueba de la prueba (`laMedicionDetectaUnGraficoVacio`).
 */
async function pintura(page, i) {
  const caja = await page.evaluate((i) => {
    const f = document.querySelectorAll('figure.grafico__figura .grafico__lienzo')[i];
    f.scrollIntoView({ block: 'center' });
    const b = f.getBoundingClientRect();
    const color = (n) => {
      const s = document.createElement('span');
      s.style.color = `var(--metrica-${n})`;
      document.body.appendChild(s);
      const c = getComputedStyle(s).color;
      s.remove();
      return c;
    };
    const x = Math.max(0, b.x);
    const y = Math.max(0, b.y);
    return { x, y, ancho: Math.min(b.right, innerWidth) - x, alto: Math.min(b.bottom, innerHeight) - y, colores: [1, 2, 3].map(color) };
  }, i);
  const soloElDibujo = await page.addStyleTag({ content: 'figure.grafico__figura svg text, figure.grafico__figura .grafico__plan { visibility: hidden !important; }' });
  await pausa(150);
  const png = await page.screenshot({ encoding: 'base64' });
  await soloElDibujo.evaluate((e) => e.remove());
  return page.evaluate(
    async (png, caja) => {
      const img = new Image();
      img.src = `data:image/png;base64,${png}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.floor(caja.ancho));
      c.height = Math.max(1, Math.floor(caja.alto));
      const ctx = c.getContext('2d');
      ctx.drawImage(img, caja.x, caja.y, c.width, c.height, 0, 0, c.width, c.height);
      const { data } = ctx.getImageData(0, 0, c.width, c.height);
      const rgb = (t) => (t.match(/\d+/g) ?? []).slice(0, 3).map(Number);
      const metricas = caja.colores.map(rgb);
      const cuenta = new Map();
      for (let p = 0; p < data.length; p += 4) {
        const k = (data[p] << 16) | (data[p + 1] << 8) | data[p + 2];
        cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
      }
      const [fondo] = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0];
      const lejos = (k, [r, g, b], tolerancia) => Math.abs(((k >> 16) & 255) - r) + Math.abs(((k >> 8) & 255) - g) + Math.abs((k & 255) - b) > tolerancia;
      const fondoRgb = [(fondo >> 16) & 255, (fondo >> 8) & 255, fondo & 255];
      let tinta = 0;
      const porMetrica = metricas.map(() => 0);
      for (const [k, n] of cuenta) {
        if (lejos(k, fondoRgb, 30)) tinta += n;
        metricas.forEach((m, j) => {
          if (!lejos(k, m, 60)) porMetrica[j] += n;
        });
      }
      return { ancho: c.width, alto: c.height, tinta: Number((tinta / (c.width * c.height)).toFixed(4)), porMetrica };
    },
    png,
    caja,
  );
}

/**
 * Comprueba que los gráficos están dibujados y a la vista, y no solo su título y su leyenda: `figuras` gráficos, cada
 * uno con superficie, los dos ejes con marcas, al menos `curvas` curvas, marcas a la vista y sin tapar, la banda de
 * referencia si se pide, y al menos 100 píxeles de cada color de métrica esperado (`colores`: los índices 1 a 3 por
 * gráfico). Espera hasta 5 s a que el dibujo se complete (después de un cambio de tamaño, recharts lo rearma).
 *
 * En una serie de pocos puntos el mínimo es de 30 píxeles por marca: dos marcas huecas unidas por una línea fina no
 * llegan a 100 sobre una superficie oscura (89 en Azul noche, con la paleta de WP-ESCRITORIO-AMABLE). Que esto sigue
 * distinguiendo un gráfico dibujado de uno vacío lo comprueba `laMedicionDetectaUnGraficoVacio`.
 */
const minimoDeColor = (marcas) => Math.min(100, 30 * marcas);

/**
 * La prueba de la prueba: oculta el dibujo de las series (curvas y marcas) y vuelve a medir. Sin dibujo, ningún gráfico
 * puede llegar al mínimo de píxeles de su métrica; si llegara, la medición no estaría mirando el gráfico.
 */
async function laMedicionDetectaUnGraficoVacio(page, pro, descripcion, colores) {
  const d = await dibujo(page);
  const estilo = await page.addStyleTag({ content: 'figure.grafico__figura path.recharts-line-curve, figure.grafico__figura .grafico__elegible { visibility: hidden !important; }' });
  await pausa(150);
  const sinDibujo = [];
  for (let i = 0; i < d.length; i++) sinDibujo.push(await pintura(page, i));
  await estilo.evaluate((e) => e.remove());
  await pausa(150);
  const fallaria = d.length > 0 && d.every((x, i) => (colores[i] ?? []).every((c) => sinDibujo[i].porMetrica[c - 1] < minimoDeColor(x.marcas)));
  comprobar(pro, descripcion, fallaria, d.map((x, i) => `${x.titulo.slice(0, 24)}: ${(colores[i] ?? []).map((c) => sinDibujo[i].porMetrica[c - 1]).join('/')} px sin dibujo (mínimo ${minimoDeColor(x.marcas)})`).join(' · '));
}
async function comprobarGraficos(page, pro, descripcion, { figuras, curvas = 1, banda = false, colores }) {
  let d = [];
  for (let i = 0; i < 25; i++) {
    d = await dibujo(page);
    if (d.length === figuras && d.every((x) => x.svg && x.curvas >= curvas && x.ejeX > 0 && x.ejeY > 0)) break;
    await pausa(200);
  }
  const p = [];
  for (let i = 0; i < d.length; i++) p.push(await pintura(page, i));
  const bien = (x, i) =>
    x.svg && x.ancho > 100 && x.alto > 80 && x.ejeX > 1 && x.ejeY > 1 && x.curvas >= curvas && x.marcas > 0 && x.visibles > 0 && x.tapadas === 0 && (!banda || x.banda) && p[i].tinta > 0.01 && (colores?.[i] ?? []).every((c) => p[i].porMetrica[c - 1] >= minimoDeColor(x.marcas));
  const ok = d.length === figuras && d.every(bien);
  const detalle = d.map((x, i) => `${x.titulo.slice(0, 28)}: ${x.ancho}×${x.alto}, ejes ${x.ejeX}/${x.ejeY}, curvas ${x.curvas}, marcas ${x.visibles}/${x.marcas}${x.tapadas ? ` (${x.tapadas} tapadas)` : ''}${banda ? `, banda ${x.banda ? 'sí' : 'no'}` : ''}, tinta ${(p[i].tinta * 100).toFixed(1)} %, color ${(colores?.[i] ?? []).map((c) => p[i].porMetrica[c - 1]).join('/')} px`);
  comprobar(pro, descripcion, ok, `${d.length} gráfico(s) · ${detalle.join(' · ')}`);
  return { d, p };
}

/**
 * Una captura de la página entera **sin** `fullPage`: la ventana se agranda al alto de la página (hasta `tope`), se
 * espera a que la página quede quieta y los gráficos dibujados, y se captura la ventana tal cual. La línea de tiempo se
 * corta en sus primeros 2.400 px (filtros y los primeros días): el resto es la misma entrada repetida.
 */
async function captura(page, v, nombre, { tope = nombre.startsWith('linea-') ? 2400 : 15_000 } = {}) {
  const path = fileURLToPath(new URL(`${nombre}.png`, DIR));
  const vista = page.viewport();
  let alto = vista.height;
  for (let i = 0; i < 4; i++) {
    const total = Math.min(tope, await page.evaluate(() => document.documentElement.scrollHeight));
    if (total === alto && i > 0) break;
    alto = Math.max(total, vista.height);
    await page.setViewport({ width: vista.width, height: alto });
    await quieto(page, v, { silencio: 300 });
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  // Los gráficos, dibujados en la ventana grande: si alguno no lo está, la captura no se toma por buena.
  let figuras = [];
  for (let i = 0; i < 25; i++) {
    figuras = await page.evaluate(() =>
      [...document.querySelectorAll('figure.grafico__figura')].map((f) => ({ svg: !!f.querySelector('svg.recharts-surface'), curvas: f.querySelectorAll('path.recharts-line-curve').length })),
    );
    if (figuras.every((x) => x.svg && x.curvas > 0)) break;
    await pausa(200);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await pausa(200);
  await page.screenshot({ path });
  // Después de la captura, el dibujo sigue ahí: la captura no lo alteró.
  const despues = await page.evaluate(() => [...document.querySelectorAll('figure.grafico__figura')].filter((f) => f.querySelector('svg.recharts-surface')).length);
  await page.setViewport(vista);
  await quieto(page, v, { silencio: 300 });
  return { figuras: figuras.length, dibujadas: figuras.filter((x) => x.svg && x.curvas > 0).length, despues };
}

// ─── Recorrido funcional ──────────────────────────────────────────────────────────────────────

async function funcional() {
  const { navegador, page, v } = await abrir();
  const a11y = {};
  try {
    // 1 · Resumen ───────────────────────────────────────────────────────────────────────────────
    await iniciarSesion(page, v, estado.proCorreo, FICHA_A);
    await quieto(page, v);
    // Desde que sale el pedido de inicio de sesión (el primero a la API) hasta la última respuesta del Resumen.
    const tResumen = v.ultimo - v.marcas[0];
    informar('PRO-24', 'Primera carga del Resumen, desde el envío del inicio de sesión hasta la última respuesta (puede incluir el arranque en frío de la API)', `${tResumen} ms`);
    comprobar('PRO-01', 'La ficha tiene las pestañas Resumen, Línea de tiempo y Analizar', (await textos(page, 'nav[aria-label="Vistas del seguimiento"] a')).join(',') === 'Resumen,Línea de tiempo,Analizar');
    const ind = await textos(page, '.indicador');
    comprobar('PRO-02', 'Cuatro indicadores con unidad, fecha y cobertura', ind.length === 4 && /kcal/.test(ind[0]) && /registros/.test(ind[1]) && /kg/.test(ind[2]) && /Última toma: \d/.test(ind[2]) && /series/.test(ind[3]), ind.join(' | '));
    // WP-DASHBOARD-COMPRENSION (pasada del 2026-10-09): la cobertura de los indicadores es la misma de las tablas
    // (`partesDeLaCobertura`): «hoy, en curso: fuera de la media» y «de ellos, N son subtotales (falta algún dato)».
    comprobar('PRO-11', 'La media de energía no cuenta el día en curso y dice sus subtotales', /hoy, en curso: fuera de la media/.test(ind[0]) && /subtotal/.test(ind[0]), ind[0]);
    comprobar('PRO-15', 'El peso compara solo dentro de su tramo comparable', /tomas comparables|no hay con qué comparar/.test(ind[2]), ind[2]);
    const cob = await texto(page, '.cobertura');
    comprobar('PRO-12', 'La cobertura por área dice su denominador y no da porcentajes', /\d+ días de \d+ con algún registro/.test(cob) && !/%/.test(cob), cob.slice(0, 220));
    comprobar('PRO-02', 'Lo último que pasó: seis hechos del período', (await textos(page, '.recientes li')).length === 6);
    a11y.resumen = await axe(page);

    // 2 · Línea de tiempo ───────────────────────────────────────────────────────────────────────
    await cupo(v);
    await clic(page, 'nav[aria-label="Vistas del seguimiento"] a', 'Línea de tiempo');
    await quieto(page, v);
    const p1 = parametros(page);
    comprobar('PRO-01', 'La línea de tiempo conserva el asesorado y el período', p1.get('id') === estado.aseId && p1.get('vista') === 'linea' && p1.get('p') === null);
    const estadoLinea = await texto(page, 'section p[role="status"]');
    const total = Number(/(\d+) hechos coinciden/.exec(estadoLinea)?.[1] ?? NaN);
    const dias = await page.$$eval('.linea-de-tiempo__dia', (d) => d.map((x) => x.dataset.fecha));
    comprobar('PRO-03', 'Los días van por la fecha del hecho, del más reciente al más viejo', dias.length > 3 && dias.every((d, i) => i === 0 || d < dias[i - 1]) && dias[0] === hoy, `${dias.slice(0, 4).join(', ')}…`);
    const encabezado = await texto(page, '.linea-de-tiempo__dia h3');
    comprobar('PRO-17', 'El día se nombra en castellano, con mayúscula solo al principio', /^[A-ZÁÉÍÓÚ][a-záéíóú]+, \d{1,2} de [a-z]+ de \d{4}$/.test(encabezado), encabezado);
    const tardia = await page.evaluate(() => {
      const e = [...document.querySelectorAll('.entrada')].find((x) => x.innerText.includes('Carga tardía') && x.innerText.includes('Toma'));
      return e ? { dia: e.closest('.linea-de-tiempo__dia').dataset.fecha, texto: e.innerText.replace(/\s+/g, ' ') } : null;
    });
    comprobar('PRO-03', 'La toma de ayer cargada hoy queda en el día de ayer, marcada como carga tardía', tardia?.dia === diaMenos(hoy, 1), tardia?.texto ?? 'no está');
    const ayer = await page.evaluate((f) => [...document.querySelectorAll(`.linea-de-tiempo__dia[data-fecha="${f}"] .entrada`)].map((e) => e.innerText.replace(/\s+/g, ' ')), diaMenos(hoy, 1));
    const almuerzos = ayer.filter((t) => /Almuerzo/.test(t));
    comprobar('PRO-16', 'El almuerzo rectificado es una sola entrada, marcada «Rectificado»', almuerzos.length === 1 && /Rectificado/.test(almuerzos[0]), almuerzos.join(' || '));
    comprobar('PRO-16', 'La merienda anulada sigue en la historia, marcada «Anulado»', ayer.filter((t) => /Merienda/.test(t) && /Anulado/.test(t)).length === 1);

    // Filtros combinados y paginación completa y estable.
    await clic(page, '.filtros-de-linea fieldset button.chip', 'Nutrición');
    await quieto(page, v);
    await elegir(page, '.filtros-de-linea', 'Tipo de hecho', 'MEAL_RECORDED');
    await quieto(page, v);
    const p2 = parametros(page);
    const filtrado = Number(/(\d+) hechos coinciden/.exec(await texto(page, 'section p[role="status"]'))?.[1] ?? NaN);
    comprobar('PRO-04', 'Área y tipo combinados quedan en la URL y reducen el conjunto', p2.get('areas') === 'NUTRITION' && p2.get('tipos') === 'MEAL_RECORDED' && filtrado > 50 && filtrado < total, `${filtrado} de ${total}`);
    for (let i = 0; i < 12; i++) {
      const hay = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.startsWith('Ver más')));
      if (!hay) break;
      await cupo(v);
      await clic(page, 'button', 'Ver más');
      await quieto(page, v);
    }
    const ids = await page.$$eval('.entrada', (e) => e.map((x) => x.dataset.id));
    const areas = await textos(page, '.entrada__area');
    comprobar('PRO-04', '«Ver más» completa el conjunto sin repetir ni perder entradas', ids.length === filtrado && new Set(ids).size === ids.length && areas.every((a) => a === 'NUTRICIÓN' || a === 'Nutrición'), `${ids.length} entradas, ${new Set(ids).size} distintas`);

    // El registro original, y la vuelta con la posición.
    const yAntes = await page.evaluate(() => {
      const botones = [...document.querySelectorAll('.entrada button')].filter((b) => b.textContent.startsWith('Abrir registro'));
      botones[botones.length - 1].scrollIntoView({ block: 'center' });
      botones[botones.length - 1].setAttribute('data-recorrido', 'ultimo');
      return window.scrollY;
    });
    const urlAntes = page.url();
    await page.click('[data-recorrido="ultimo"]');
    await page.waitForSelector('dialog[open]');
    await quieto(page, v);
    const dialogo = await texto(page, 'dialog[open]');
    comprobar('PRO-05', '«Abrir registro» muestra el registro de comida de esa entrada', /Ver en Nutrición/.test(dialogo) && dialogo.length > 80, dialogo.slice(0, 160));
    a11y.registro = await axe(page);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('dialog[open]'));
    const yDespues = await page.evaluate(() => window.scrollY);
    const foco = await page.evaluate(() => document.activeElement?.getAttribute('data-recorrido'));
    comprobar('PRO-05', 'Al cerrar con Esc vuelve a la misma posición, con el foco en el disparador y la URL igual', Math.abs(yDespues - yAntes) < 4 && foco === 'ultimo' && page.url() === urlAntes, `scroll ${yAntes} → ${yDespues}, foco ${foco}`);

    // Búsqueda en el período (nunca en la URL) y limpiar.
    await clic(page, 'button', 'Limpiar filtros');
    await quieto(page, v);
    // El texto no viaja en ninguna URL, ni la de la página ni la de la API: va en el cuerpo de un POST (API-DSH-04-BUSQUEDA),
    // también al pedir más páginas (revisión de #153, hallazgo 4).
    const desdeUrl = v.urls.length;
    const desdeCuerpo = v.cuerpos.length;
    await page.type('input[type="search"]', 'cena');
    await clic(page, '.filtros-de-linea button[type="submit"]', 'Buscar');
    await quieto(page, v);
    const conCena = await textos(page, '.entrada__titulo');
    const totalCena = Number(/(\d+) hechos coinciden/.exec(await texto(page, 'section p[role="status"]'))?.[1] ?? NaN);
    comprobar('PRO-04', 'La búsqueda recorre el período y no viaja en la URL de la página', !page.url().includes('cena') && conCena.length > 0 && conCena.every((t) => /cena/i.test(t)), `${conCena.length} entradas; URL ${page.url().replace(WEB, '')}`);
    let paginasCena = 1;
    for (; paginasCena < 8; paginasCena++) {
      const hay = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.startsWith('Ver más')));
      if (!hay) break;
      await cupo(v);
      await clic(page, 'button', 'Ver más');
      await quieto(page, v);
    }
    const idsCena = await page.$$eval('.entrada', (e) => e.map((x) => x.dataset.id));
    const titulosCena = await textos(page, '.entrada__titulo');
    comprobar('PRO-04', '«Ver más» con la búsqueda activa completa las coincidencias de todo el período, sin repetir', idsCena.length === totalCena && new Set(idsCena).size === idsCena.length && titulosCena.every((t) => /cena/i.test(t)), `${idsCena.length} de ${totalCena} en ${paginasCena} página(s)`);
    const urlsDeLaBusqueda = v.urls.slice(desdeUrl);
    const cuerposDeLaBusqueda = v.cuerpos.slice(desdeCuerpo).map((c) => JSON.parse(c));
    comprobar(
      'PRO-04',
      'El texto buscado viaja en el cuerpo de un POST (API-DSH-04-BUSQUEDA): ninguna URL de la API lo lleva, tampoco la de «Ver más»',
      urlsDeLaBusqueda.some((u) => u.startsWith('POST') && u.includes('/timeline/search')) &&
        !urlsDeLaBusqueda.some((u) => /cena/i.test(u)) &&
        cuerposDeLaBusqueda.length >= paginasCena &&
        cuerposDeLaBusqueda.every((c) => c.q === 'cena') &&
        (paginasCena === 1 || cuerposDeLaBusqueda.some((c) => typeof c.cursor === 'string')),
      `${urlsDeLaBusqueda.length} pedidos a la API durante la búsqueda, ninguno con el texto; ${cuerposDeLaBusqueda.length} POST con el texto en el cuerpo${cuerposDeLaBusqueda.some((c) => c.cursor) ? ' (los de «Ver más», con su cursor)' : ''}`,
    );
    await clic(page, 'button', 'Limpiar filtros');
    await quieto(page, v);
    const limpio = Number(/(\d+) hechos coinciden/.exec(await texto(page, 'section p[role="status"]'))?.[1] ?? NaN);
    comprobar('PRO-04', 'Limpiar recupera la vista completa', limpio === total && !parametros(page).get('areas'), `${limpio} de ${total}`);
    a11y.linea = await axe(page);

    // El Resumen otra vez, con la API en uso: es el caso que mide el presupuesto.
    await cupo(v);
    const t1 = Date.now();
    await clic(page, 'nav[aria-label="Vistas del seguimiento"] a', 'Resumen');
    await quieto(page, v);
    const tCaliente = v.ultimo - t1;
    comprobar('PRO-24', 'El Resumen completo con la API en uso, desde el clic en la pestaña hasta la última respuesta', tCaliente <= 2500, `${tCaliente} ms (presupuesto 2.500 ms)`);

    // 3 · Analizar ──────────────────────────────────────────────────────────────────────────────
    await cupo(v);
    await clic(page, 'nav[aria-label="Vistas del seguimiento"] a', 'Analizar');
    await quieto(page, v);
    // WP-DASHBOARD-COMPRENSION: los presets se retiraron; la misma lectura es la pregunta de alimentación y medidas, con la
    // medida corporal elegida de forma explícita (nunca se sustituye por la primera disponible).
    await abrirDetalles(page, 'details.preguntas-profesionales__mas');
    await clic(page, '.tarjeta-de-pregunta', 'la alimentación y las medidas corporales');
    await quieto(page, v);
    await elegir(page, '.parametros-de-pregunta', 'Medida corporal', 'antropometria.peso');
    await clic(page, '.parametros-de-pregunta button[type="submit"]', 'Ver la respuesta');
    await quieto(page, v);
    const titulos = await textos(page, '.grafico__titulo');
    comprobar('PRO-06', 'Una pregunta de tres métricas dibuja tres paneles', titulos.length === 3, titulos.join(' | '));
    comprobar('PRO-07', 'Cada panel conserva su unidad (kcal, g, kg)', /· kcal$/.test(titulos[0]) && /· g$/.test(titulos[1]) && /· kg$/.test(titulos[2]), titulos.join(' | '));
    await comprobarGraficos(page, 'PRO-08', 'Separadas: los tres gráficos están dibujados y a la vista (ejes, curvas, marcas sin tapar y el color de cada métrica)', { figuras: 3, colores: [[1], [2], [3]] });
    // Cada modo es un segmento con su opción adentro; el motivo de uno apagado se dice al costado, y la opción lo referencia.
    const modos = await page.$$eval('.modo-elegible', (m) => m.map((x) => ({ nombre: x.innerText.replace(/\s+/g, ' ').trim(), deshabilitado: x.querySelector('input').disabled, descrito: !!document.getElementById(x.querySelector('input').getAttribute('aria-describedby') ?? '') })));
    const motivos = await textos(page, '.modos-de-analizar__aviso .modo-no-disponible');
    comprobar('PRO-08', 'Juntar kcal, g y kg se bloquea y dice por qué', modos[1].nombre === 'Juntas' && modos[1].deshabilitado && modos[1].descrito && motivos.some((t) => /«Juntas» pide métricas con la misma unidad/.test(t)), `${JSON.stringify(modos[1])} · ${motivos.join(' | ')}`);
    comprobar('PRO-08', 'Sin observaciones del peso en la referencia, el cambio relativo se bloquea y lo dice', modos[2].nombre === 'Cambio relativo' && modos[2].deshabilitado && modos[2].descrito && motivos.some((t) => /«Cambio relativo»: Peso no tiene observaciones/.test(t)), `${JSON.stringify(modos[2])} · ${motivos.join(' | ')}`);

    // La cuarta métrica pide reemplazo y no pierde la selección.
    const mAntes = parametros(page).get('m');
    await abrirDetalles(page, 'details.agregar');
    await elegir(page, '.agregar-metrica', 'Métrica', 'nutricion.grasas');
    await clic(page, '.agregar-metrica button', 'Agregar');
    await page.waitForSelector('dialog[open]');
    const reemplazo = await texto(page, 'dialog[open]');
    await clic(page, 'dialog[open] button', 'Cancelar');
    await page.waitForFunction(() => !document.querySelector('dialog[open]'));
    comprobar('PRO-06', 'La cuarta métrica abre «Elegí cuál reemplazar»; cancelar conserva las tres', /Elegí cuál reemplazar/.test(reemplazo) && parametros(page).get('m') === mAntes);

    // Teclado: la fecha elegida, sincronizada, sin simular simultaneidad.
    await page.focus('.grafico__lienzo');
    await page.keyboard.press('Home');
    await pausa(300);
    const primera = parametros(page).get('f');
    await page.keyboard.press('ArrowRight');
    await pausa(300);
    const segunda = parametros(page).get('f');
    comprobar('PRO-22', 'Con el teclado (Inicio y flecha) la fecha avanza, en la URL y en la lectura', primera && segunda && segunda > primera && (await texto(page, '.panel-de-lectura')).includes('Lectura del'), `${primera} → ${segunda}`);
    // La primera toma de peso es del 18/7; se avanza hasta un día con comidas y sin toma.
    let lectura = '';
    for (let i = 0; i < 6; i++) {
      lectura = await texto(page, '.panel-de-lectura');
      if (/Sin dato en esta fecha/.test(lectura)) break;
      await page.keyboard.press('ArrowRight');
      await pausa(300);
    }
    comprobar('PRO-09', 'Una fecha sin toma de peso dice «sin dato» y el más cercano «no es simultáneo»', /Sin dato en esta fecha\. El más cercano: .* No es simultáneo\./.test(lectura), `${parametros(page).get('f')}: ${lectura.slice(lectura.indexOf('Peso'), lectura.indexOf('Peso') + 160)}`);
    await page.keyboard.press('End');
    await pausa(300);
    const hoyLectura = await texto(page, '.panel-de-lectura');
    comprobar('PRO-11', 'El día de hoy se lee como «día en curso»', parametros(page).get('f') === hoy && /día en curso/.test(hoyLectura), hoyLectura.slice(0, 200));
    comprobar('PRO-07', 'La fecha elegida es la misma en los tres paneles (una sola lectura para las tres)', (await page.$$eval('.panel-de-lectura__metrica', (m) => m.length)) === 3);

    // El origen del punto, y la vuelta sin perder nada.
    const urlAnalisis = page.url();
    await clic(page, '.panel-de-lectura button', 'Ver origen');
    await page.waitForSelector('dialog[open]');
    await quieto(page, v);
    const origen = await texto(page, 'dialog[open]');
    comprobar('PRO-26', 'El punto de energía de hoy abre su registro de comida', /n = 1/.test(origen) && /Ver en Nutrición/.test(origen), origen.slice(0, 200));
    await clic(page, 'dialog[open] button', 'Cerrar');
    await page.waitForFunction(() => !document.querySelector('dialog[open]'));
    comprobar('PRO-05', 'Al cerrar el origen, la vista sigue igual (período, métricas, modo y fecha)', page.url() === urlAnalisis);

    // A la pestaña del dominio y de vuelta con «Atrás».
    await clic(page, '.panel-de-lectura button', 'Ver origen');
    await page.waitForSelector('dialog[open]');
    await quieto(page, v);
    await clic(page, 'dialog[open] a', 'Ver en Nutrición');
    await page.waitForFunction(() => location.pathname.startsWith('/pro/advisees/nutrition'));
    await quieto(page, v);
    await page.goBack();
    await page.waitForFunction(() => location.pathname === '/pro/advisees' && location.search.includes('vista=analizar'));
    await quieto(page, v);
    comprobar('PRO-05', 'Desde la pestaña de Nutrición, «Atrás» devuelve el análisis tal como estaba', page.url() === urlAnalisis && (await page.$$eval('.grafico__lienzo', (g) => g.length)) === 3, page.url().replace(WEB, ''));
    a11y.analizar = await axe(page);

    // Cambio relativo con referencia explícita.
    await clic(page, '.metricas-elegidas button', 'Quitar');
    await page.waitForFunction(() => document.querySelectorAll('.metricas-elegidas li').length === 2);
    // Se quitó la primera (energía): queda proteínas y peso; se quita también el peso.
    await clic(page, '.metricas-elegidas button', 'Peso');
    await quieto(page, v);
    await page.evaluate(() => document.querySelectorAll('input[name="modo-de-lectura"]')[2].click());
    await quieto(page, v);
    const referencias = await texto(page, '.referencias');
    const relativa = await texto(page, '.panel-de-lectura');
    comprobar('PRO-08', 'El cambio relativo muestra su referencia (regla, rango, valor y n) y la lectura da el % y el valor real', /media de los días con valor del .* \(n = \d+/.test(referencias) && /% contra la referencia · valor real/.test(relativa), `${referencias.slice(0, 160)} || ${relativa.slice(0, 160)}`);
    await comprobarGraficos(page, 'PRO-08', 'Cambio relativo: el gráfico está dibujado y a la vista, con la banda de la referencia', { figuras: 1, banda: true, colores: [[1]] });

    // La referencia no es el intervalo visible: acercar (arrastre), alejar (fechas) y restablecer no la mueven; solo
    // «Aplicar» la cambia, y queda en la URL (revisión de #153, hallazgo 3).
    await cupo(v);
    const fechaFija = diaMenos(hoy, 10);
    await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent('nutricion.proteinas')}&modo=R&f=${fechaFija}`);
    await quieto(page, v);
    const ref0 = await texto(page, '.referencias');
    const lec0 = await lecturaRelativa(page);
    await arrastrar(page, v, 0.55, 0.97);
    const intervalo1 = /Intervalo: ([^.]*)\./.exec(await texto(page, '.analizar__lienzo'))?.[1] ?? '';
    const [ref1, lec1, vig1] = [await texto(page, '.referencias'), await lecturaRelativa(page), await texto(page, '.referencia-vigente')];
    await fijarIntervalo(page, v, diaMenos(hoy, 70), hoy);
    const intervalo2 = /Intervalo: ([^.]*)\./.exec(await texto(page, '.analizar__lienzo'))?.[1] ?? '';
    const [ref2, lec2] = [await texto(page, '.referencias'), await lecturaRelativa(page)];
    await clic(page, '.analizar__lienzo button', 'Restablecer vista');
    await quieto(page, v, { silencio: 300 });
    const [ref3, lec3] = [await texto(page, '.referencias'), await lecturaRelativa(page)];
    comprobar(
      'PRO-08',
      'La referencia del cambio relativo y el % de una fecha no cambian al acercar (arrastre), alejar (fechas) ni restablecer el gráfico',
      ref0.length > 0 && lec0.length > 0 && intervalo1 && intervalo2 && [ref1, ref2, ref3].every((r) => r === ref0) && [lec1, lec2, lec3].every((l) => l === lec0) && /fuera del intervalo visible/.test(vig1) && !parametros(page).get('ref'),
      `acercado a «${intervalo1}», alejado a «${intervalo2}»: ${[lec0, lec1, lec2, lec3].join(' / ')} · ${ref0.slice(0, 110)}`,
    );
    await fijarIntervalo(page, v, diaMenos(hoy, 20), diaMenos(hoy, 1));
    await clic(page, '.referencia-del-cambio button', 'Cambiar la referencia');
    await clic(page, '.referencia-del-cambio label', 'Un rango de fechas fijo');
    await clic(page, '.referencia-del-cambio button', 'Copiar el intervalo visible');
    const urlSinAplicar = parametros(page).get('ref');
    await clic(page, '.referencia-del-cambio button', 'Aplicar la referencia');
    await quieto(page, v);
    const refElegida = `${diaMenos(hoy, 20)}_${diaMenos(hoy, 1)}`;
    const [ref4, vig4] = [await texto(page, '.referencias'), await texto(page, '.referencia-vigente')];
    comprobar(
      'PRO-08',
      'Cambiar la referencia es explícito: copiar el intervalo no la cambia hasta «Aplicar»; después queda en la URL y en pantalla, con su rango',
      urlSinAplicar === null && parametros(page).get('ref') === refElegida && ref4 !== ref0 && ref4.includes(diaCivil(diaMenos(hoy, 20))) && /rango fijo/.test(vig4),
      `ref=${parametros(page).get('ref')} · ${vig4.slice(0, 120)}`,
    );
    await clic(page, '.analizar__lienzo button', 'Restablecer vista');
    await quieto(page, v, { silencio: 300 });
    comprobar('PRO-08', 'Restablecer el gráfico no deshace la referencia elegida', parametros(page).get('ref') === refElegida && (await texto(page, '.referencias')) === ref4);

    // Agrupar por semana no cambia la comparación ni la referencia: salen de los días del rango exacto (hallazgo 2).
    await cupo(v);
    let miercoles = diaMenos(hoy, 45);
    while (new Date(`${miercoles}T12:00:00Z`).getUTCDay() !== 3) miercoles = diaMenos(miercoles, -1);
    const A = { desde: miercoles, hasta: diaMenos(miercoles, -12) }; // de miércoles a lunes: corta tres semanas
    const B = { desde: diaMenos(miercoles, -15), hasta: diaMenos(miercoles, -24) }; // de jueves a sábado
    await ir(page, `${FICHA_A}&vista=analizar&m=nutricion.energia&cmp=${A.desde}_${A.hasta}_${B.desde}_${B.hasta}`);
    await quieto(page, v);
    const porDia = await filaDeComparacion(page, 'Calorías');
    // WP-DASHBOARD-COMPRENSION: «Grano» pasó a «Agrupar por» y sus opciones a «Cada registro», «Día» y «Semana».
    await clic(page, '.modos-de-analizar label', 'Semana');
    await quieto(page, v);
    const porSemana = await filaDeComparacion(page, 'Calorías');
    const lecturaSemanal = await texto(page, '.panel-de-lectura');
    // Lo esperado, a mano: la media de los días con valor (sin el día en curso) de cada rango, de la serie diaria de la API,
    // y su cobertura en días del rango. WP-DASHBOARD-COMPRENSION (pasada del 2026-10-09): el denominador son los días del
    // rango, no los días con registros («n = 8 de 8» escondía los días sin registros).
    const diaria = (await leerApi(v, `/advisees/${estado.aseId}/projections/NUTRITION_PRESCRIBED_VS_RECORDED?metric=ENERGY&grain=DAY&periodStart=${diaMenos(hoy, 89)}&periodEnd=${hoy}`)).data.result.recorded.points;
    const esperado = (r) => {
      const delRango = diaria.filter((p) => p.date >= r.desde && p.date <= r.hasta);
      const dias = delRango.filter((p) => p.value !== null && !p.partialBucket);
      const media = dias.reduce((t, p) => t + p.value, 0) / dias.length;
      const duracion = Math.round((Date.parse(`${r.hasta}T12:00:00Z`) - Date.parse(`${r.desde}T12:00:00Z`)) / 86_400_000) + 1;
      const hoyAdentro = r.desde <= hoy && hoy <= r.hasta;
      const terminados = delRango.filter((p) => p.date !== hoy && !p.partialBucket);
      const sinRegistros = duracion - new Set(terminados.map((p) => p.date)).size - (hoyAdentro ? 1 : 0);
      return [`${dominio.nutrienteParaMostrar({ value: String(media) }, dominio.NUTRIENTE_DE_LA_METRICA.ENERGY)} kcal`, `${duracion} días: ${dias.length} con valor`, ...(sinRegistros > 0 ? [`${sinRegistros} sin registros`] : [])];
    };
    const [eA, eB] = [esperado(A), esperado(B)];
    comprobar(
      'PRO-18',
      'Por semana, la comparación de dos rangos que cortan semanas es la misma que por día y coincide con la media de los días calculada a mano, con la cobertura en días del rango',
      porDia.length > 0 && porDia === porSemana && [...eA, ...eB].every((x) => porDia.includes(x)) && /semana del/.test(lecturaSemanal),
      `esperado A «${eA.join(' · ')}», B «${eB.join(' · ')}» · por día «${porDia.slice(0, 220)}» · por semana igual: ${porDia === porSemana ? 'sí' : `no («${porSemana.slice(0, 150)}»)`}`,
    );
    await comprobarGraficos(page, 'PRO-08', 'Por semana: el gráfico semanal está dibujado y a la vista', { figuras: 1, colores: [[1]] });
    await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent('nutricion.proteinas')}&modo=R`);
    await quieto(page, v);
    const refDia = await texto(page, '.referencias');
    // WP-DASHBOARD-COMPRENSION: «Grano» pasó a «Agrupar por» y sus opciones a «Cada registro», «Día» y «Semana».
    await clic(page, '.modos-de-analizar label', 'Semana');
    await quieto(page, v);
    const refSemana = await texto(page, '.referencias');
    comprobar('PRO-08', 'Por semana, la referencia del cambio relativo es la misma que por día (los días de su rango, no las semanas)', refDia.length > 0 && refDia === refSemana, refDia.slice(0, 160));
    await comprobarGraficos(page, 'PRO-08', 'Cambio relativo por semana: dibujado y a la vista, con la banda de la referencia', { figuras: 1, banda: true, colores: [[1]] });

    // «Juntas»: dos macronutrientes en gramos comparten un gráfico. Todas las marcas son puntos, así que cada línea lleva su
    // nombre al final: el color no es lo único que las distingue (WCAG 1.4.1; WP-ESCRITORIO-AMABLE, C-16 y C-33).
    await cupo(v);
    await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent('nutricion.proteinas,nutricion.carbohidratos')}&modo=S`);
    await quieto(page, v);
    const superpuestas = await textos(page, '.grafico__titulo');
    const alFinal = await page.$$eval('.grafico__nombre-de-linea', (t) => t.map((x) => x.textContent.trim()).sort());
    const muestras = await textos(page, '.grafico__muestras .grafico__muestra');
    comprobar(
      'PRO-08',
      'Proteínas y carbohidratos (misma familia y unidad) van juntas en un solo gráfico, con su unidad, y cada línea lleva su nombre al final',
      superpuestas.length === 1 && /^Proteínas y carbohidratos registrados por día · g$/.test(superpuestas[0]) && alFinal.join(',') === 'Carbohidratos,Proteínas' && muestras.length === 2,
      `${superpuestas.join(' | ')} · al final de cada línea: ${alFinal.join(', ')} · en el encabezado: ${muestras.join(', ')}`,
    );
    await comprobarGraficos(page, 'PRO-08', 'Juntas: un gráfico con las dos curvas dibujadas y a la vista, cada una con su color', { figuras: 1, curvas: 2, colores: [[1, 2]] });

    // Dos etapas, con el mismo criterio y sin conclusiones causales. Desde WP-DASHBOARD-COMPRENSION son las etapas reales
    // del plan (las versiones activadas), con la pregunta «¿Qué cambió entre dos etapas?».
    await ir(page, `${FICHA_A}&vista=analizar&pregunta=comparar-etapas&area=NUTRICION&etapaA=${estado.nutricion.planV1}&etapaB=${estado.nutricion.planV2}`);
    await quieto(page, v);
    const comparacion = await texto(page, '.comparacion-de-etapas');
    comprobar(
      'PRO-18',
      'La comparación de dos etapas dice criterio, cobertura, duración y diferencia, sin causas',
      // La cobertura en días de la etapa (pasada del 2026-10-09): «48 días: 44 con valor», nunca «44 de 44 días».
      /B − A/.test(comparacion) && /\d+ días: \d+ con valor/.test(comparacion) && !/\b(\d+) de \1 días/.test(comparacion) && /Duración/.test(comparacion) && !/mejor|peor|gracias a|provoc|causó/i.test(comparacion),
      comparacion.slice(0, 260),
    );
    // La exportación es de lo que se ve en el lienzo: se vuelve a las tres métricas.
    await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent(TRES)}`);
    await quieto(page, v);

    // Exportación de lo que se ve.
    await abrirMasAcciones(page);
    await clic(page, 'button', 'Descargar los datos (CSV)');
    let archivo = null;
    for (let i = 0; i < 40 && !archivo; i++) {
      await pausa(250);
      archivo = fs.readdirSync(DESCARGAS).find((f) => f.endsWith('.csv'));
    }
    const csv = archivo ? fs.readFileSync(`${DESCARGAS}/${archivo}`, 'utf8') : '';
    const lineasCsv = csv.split('\r\n');
    const filas = lineasCsv.slice(lineasCsv.findIndex((l) => l.startsWith('Métrica;Unidad;Método')) + 1).filter((l) => l.length > 0);
    comprobar('PRO-10', 'El CSV distingue calidad y día en curso, con período, zona y generación, sin nombre de persona en el archivo', archivo && /^BE-analisis-\d{4}-\d{2}-\d{2}-a-\d{4}-\d{2}-\d{2}\.csv$/.test(archivo) && csv.startsWith('\uFEFF') && /Zona horaria;/.test(csv) && /Generado;/.test(csv) && filas.length > 10 && filas.some((f) => f.split(';')[8] === 'sí'), `${archivo} · ${filas.length} filas`);
    comprobar('PRO-20', 'El CSV no tiene celdas que una planilla lea como fórmula', !csv.split('\r\n').some((l) => l.split(';').some((c) => /^[=+\-@]/.test(c))));

    // Vista guardada, con una referencia propia (se reabre en otra sesión, más abajo).
    await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent(TRES)}&p=30&ref=${REF_DE_LA_VISTA}`);
    await quieto(page, v);
    await abrirMasAcciones(page);
    await clic(page, 'details.vistas-guardadas summary', 'Vistas guardadas');
    await page.type('details.vistas-guardadas input', VISTA);
    await clic(page, 'details.vistas-guardadas button', 'Guardar esta vista');
    await page.waitForFunction(() => document.querySelector('details.vistas-guardadas')?.innerText.includes('Guardada:'));
    // La lista se vuelve a pedir después del aviso: se espera a que la vista nueva esté en ella.
    await page.waitForFunction((n) => [...document.querySelectorAll('details.vistas-guardadas li strong')].some((e) => e.textContent === n), { timeout: 15_000 }, VISTA);
    const guardada = await page.evaluate((n) => [...document.querySelectorAll('details.vistas-guardadas li')].find((l) => l.querySelector('strong')?.textContent === n)?.innerText.replace(/\s+/g, ' ') ?? '', VISTA);
    const [rd, rh] = REF_DE_LA_VISTA.split('_');
    comprobar('PRO-19', 'Guardar una vista la suma a la lista, que dice su referencia del cambio relativo', guardada.includes(`referencia: del ${diaCivil(rd)} al ${diaCivil(rh)}`), guardada.slice(0, 160));

    // 4 · Respuesta tardía ────────────────────────────────────────────────────────────────────
    await cupo(v);
    await ir(page, `${FICHA_A}&vista=linea`);
    await quieto(page, v);
    const desde7 = diaMenos(hoy, 6);
    v.reglas = [{ coincide: (u) => u.includes('/timeline') && u.includes(`periodStart=${desde7}`), accion: 'demorar', ms: 3000 }];
    await elegirPeriodo(page, '7 días');
    await pausa(150);
    await elegirPeriodo(page, '90 días');
    await pausa(3600);
    await quieto(page, v);
    v.reglas = [];
    const tras = Number(/(\d+) hechos coinciden/.exec(await texto(page, 'section p[role="status"]'))?.[1] ?? NaN);
    comprobar('PRO-21', 'La respuesta lenta de «7 días» no pisa la de «90 días» elegida después', tras === total && parametros(page).get('p') === '90', `${tras} hechos (esperado ${total})`);

    await cupo(v);
    v.reglas = [{ coincide: (u) => u.includes(estado.aseId), accion: 'demorar', ms: 3000 }];
    await ir(page, FICHA_A);
    await pausa(200);
    await ir(page, FICHA_B);
    await pausa(3600);
    await quieto(page, v);
    v.reglas = [];
    const deB = await page.evaluate(() => ({ titulo: document.querySelector('#titulo-asesorado')?.textContent ?? '', indicadores: [...document.querySelectorAll('.indicador')].map((e) => e.innerText.replace(/\s+/g, ' ')) }));
    comprobar('PRO-21', 'Al cambiar de asesorado durante una respuesta lenta, no aparece nada del anterior', !deB.indicadores.some((t) => /Peso muerto|Sentadilla/.test(t)) && parametros(page).get('id') === estado.aseBId, `${deB.titulo} · ${deB.indicadores.join(' | ')}`);

    // 5 · Vista parcial (asesorado B) ─────────────────────────────────────────────────────────
    const parcialB = await texto(page, 'main');
    comprobar('PRO-20', 'Asesorado B: un solo aviso de vista parcial, sin nombrar lo oculto', /Vista parcial según tu acceso actual/.test(parcialB));
    await ir(page, `${FICHA_B}&vista=analizar`);
    await quieto(page, v);
    // WP-DASHBOARD-COMPRENSION: Analizar empieza por las preguntas; el selector de métricas está en «Análisis personalizado».
    await clic(page, 'button', 'Análisis personalizado');
    await quieto(page, v);
    const areasB = await page.evaluate(() => {
      const label = [...document.querySelectorAll('.agregar-metrica label')].find((l) => l.textContent === 'Área');
      return label ? [...document.getElementById(label.htmlFor).options].map((o) => o.value) : [];
    });
    comprobar('PRO-20', 'Asesorado B: el selector ofrece solo las áreas permitidas', areasB.length > 0 && !areasB.includes('ENTRENAMIENTO'), areasB.join(', '));

    // 6 · Fallas: cada una con su texto, y lo que cargó bien sigue ───────────────────────────
    await cupo(v);
    v.reglas = [{ coincide: (u) => u.includes('/projections/ANTHROPOMETRY_LONGITUDINAL') && u.includes('metric='), accion: 'responder', status: 503, codigo: 'DB_UNAVAILABLE' }];
    await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent(TRES)}`);
    await quieto(page, v);
    const con503 = await texto(page, '.analizar__lienzo');
    comprobar('PRO-21', 'Si falla el peso (503), energía y proteínas siguen dibujadas y el peso dice que BE no está disponible', (await page.$$eval('.grafico__lienzo', (g) => g.length)) === 2 && /BE no está disponible en este momento/.test(con503), con503.slice(0, 200));
    v.reglas = [];
    await clic(page, '.analizar__lienzo button', 'Reintentar');
    await quieto(page, v);
    comprobar('PRO-21', '«Reintentar» recupera el panel que faltaba', (await page.$$eval('.grafico__lienzo', (g) => g.length)) === 3);

    await cupo(v);
    v.reglas = [{ coincide: (u) => u.includes('/timeline'), accion: 'responder', status: 429, codigo: 'RATE_LIMITED' }];
    await ir(page, `${FICHA_A}&vista=linea`);
    await quieto(page, v);
    const con429 = await texto(page, 'main');
    comprobar('PRO-21', 'Con el límite de consultas, la línea de tiempo dice «esperá un minuto» y no «sin datos»', /muchas consultas seguidas/.test(con429) && !/No hay hechos registrados/.test(con429));
    v.reglas = [{ coincide: (u) => u.includes('/projections/'), accion: 'cortar' }];
    await ir(page, FICHA_A);
    await quieto(page, v);
    const sinRed = await texto(page, 'main');
    comprobar('PRO-21', 'Sin red, el Resumen dice «no hay conexión con BE» y no muestra ceros', /no hay conexión con BE/.test(sinRed) && !/No hay datos de ninguna área/.test(sinRed), sinRed.slice(0, 200));
    v.reglas = [];
    a11y.errores = await axe(page);

    // 7 · Zoom de texto y reflujo ─────────────────────────────────────────────────────────────
    await cupo(v);
    await page.setViewport({ width: 320, height: 800 });
    await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent(TRES)}`);
    await quieto(page, v);
    comprobar('PRO-23', 'A 320 px (reflujo de WCAG 1.4.10) Analizar no desborda de costado', await sinDesborde(page));
    await page.setViewport({ width: 1280, height: 900 });
    await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
    await pausa(500);
    comprobar('PRO-22', 'Con el texto al 200 % (WCAG 1.4.4) no hay desborde de costado', await sinDesborde(page));
    await page.evaluate(() => (document.documentElement.style.fontSize = ''));
    await page.setViewport({ width: 1440, height: 900 });
  } finally {
    comprobar('PRO-25', 'Sin errores de JavaScript en la página durante el recorrido', v.errores.length === 0, v.errores.slice(0, 3).join(' | '));
    fs.writeFileSync(new URL('accesibilidad.json', DIR), JSON.stringify(a11y, null, 2));
    for (const [vista, violaciones] of Object.entries(a11y)) comprobar('PRO-22', `axe (WCAG 2.2 A/AA) en ${vista}: sin violaciones automáticas`, violaciones.length === 0, violaciones.map((x) => `${x.id}×${x.nodos} (${x.ejemplo})`).join('; '));
    await navegador.close();
  }

  // 8 · Otra sesión: la vista guardada se reabre y se borra; un tercero no ve nada ────────────
  {
    const { navegador, page, v } = await abrir();
    try {
      // El retorno del inicio de sesión admite solo la ficha (destinoSeguro): la vista se abre después, en la aplicación.
      await iniciarSesion(page, v, estado.proCorreo, FICHA_A);
      await quieto(page, v);
      await ir(page, `${FICHA_A}&vista=analizar`);
      await quieto(page, v);
      await clic(page, 'details.vistas-guardadas summary', 'Vistas guardadas');
      await page.waitForFunction((n) => document.querySelector('details.vistas-guardadas')?.innerText.includes(n), {}, VISTA);
      await clic(page, 'details.vistas-guardadas button', `Abrir ${VISTA}`);
      await quieto(page, v);
      const p = parametros(page);
      // WP-DASHBOARD-COMPRENSION: la referencia detallada se muestra en el modo «Cambio relativo» (encargo §10, «los
      // controles avanzados se revelan cuando ayudan»); en paneles, la vista la conserva en la URL (`ref`).
      comprobar(
        'PRO-19',
        'En una sesión nueva, la vista guardada reabre la misma configuración —también su referencia— y vuelve a pedir los datos',
        p.get('m') === TRES && p.get('p') === '30' && p.get('ref') === REF_DE_LA_VISTA && (await page.$$eval('.grafico__lienzo', (g) => g.length)) === 3,
        `${page.url().replace(WEB, '')}`,
      );
      await clic(page, 'details.vistas-guardadas button', `Borrar ${VISTA}`);
      const confirmar = await texto(page, 'details.vistas-guardadas');
      await clic(page, 'details.vistas-guardadas button', 'Sí, borrar');
      await page.waitForFunction(() => document.querySelector('details.vistas-guardadas')?.innerText.includes('Borrada:'));
      await quieto(page, v);
      comprobar('PRO-19', 'Borrar pide confirmación y la vista desaparece', /No se puede deshacer/.test(confirmar) && !(await texto(page, 'details.vistas-guardadas')).includes(`Abrir ${VISTA}`));
      // Las vistas que dejaron corridas interrumpidas se borran también, para no ensuciar la cuenta sintética.
      for (let i = 0; i < 10; i++) {
        const sobrante = await page.evaluate(() => [...document.querySelectorAll('details.vistas-guardadas li strong')].map((e) => e.textContent).find((n) => n.startsWith('Recorrido')));
        if (!sobrante) break;
        await clic(page, 'details.vistas-guardadas button', `Borrar ${sobrante}`);
        await clic(page, 'details.vistas-guardadas button', 'Sí, borrar');
        await quieto(page, v);
      }
    } finally {
      await navegador.close();
    }
  }
  {
    const { navegador, page, v } = await abrir();
    try {
      await iniciarSesion(page, v, estado.terceroCorreo, FICHA_A);
      await quieto(page, v);
      await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent(TRES)}`);
      await quieto(page, v);
      const ajeno = await texto(page, 'main');
      const pedidos = v.malas.filter((m) => m.startsWith('404'));
      comprobar('PRO-20', 'Un tercero ve «no encontramos un recurso disponible»: ni pestañas, ni indicadores, ni gráficos', /No encontramos un recurso disponible/.test(ajeno) && !/Analizar|kcal|Peso muerto/.test(ajeno) && pedidos.length > 0, `${ajeno.slice(0, 160)} · ${pedidos.slice(0, 3).join(', ')}`);
    } finally {
      await navegador.close();
    }
  }
  await analizarRecompuesto();
  await encabezadoYMenu();
  // El registro de la API de esta corrida: cada búsqueda como ruta parametrizada y ningún texto buscado (hallazgo 4).
  const registro = fs.existsSync(API_LOG) ? fs.readFileSync(API_LOG).subarray(inicioDelLog).toString('utf8') : '';
  const lineasDeBusqueda = registro.split('\n').filter((l) => l.includes('/timeline/search'));
  comprobar(
    'PRO-04',
    'El registro de la API tiene cada búsqueda como ruta parametrizada y nunca el texto buscado',
    lineasDeBusqueda.length > 0 && lineasDeBusqueda.every((l) => l.includes('/advisees/:adviseeId/timeline/search')) && !/cena/i.test(registro),
    `${lineasDeBusqueda.length} línea(s) de búsqueda, p. ej. ${(lineasDeBusqueda[0] ?? '').replace(/"requestId":"[^"]+",/, '').slice(0, 140)}; «cena» en el registro: ${/cena/i.test(registro) ? 'sí' : 'no'}`,
  );
}

// ─── Analizar, recompuesto (WP-ESCRITORIO-AMABLE, parte 2: E-24 a E-36, E-38 y E-39) ───────────────────────────────

/**
 * La composición de Analizar y el lenguaje de sus gráficos. Lo esperado (el objetivo de calorías, los días sin
 * registros, las etapas y los cortes) se calcula a mano con lo que devuelve la API, sin el dominio. Cada comprobación
 * negativa («no lleva…») mira con el mismo selector que una positiva de la misma pantalla: con el selector mal, la
 * positiva fallaría. En una sesión propia; el modo funcional la corre antes del encabezado y también va sola, con
 * `node recorrido.mjs analizar`.
 */
async function analizarRecompuesto() {
  const { navegador, page, v } = await abrir();
  try {
    await iniciarSesion(page, v, estado.proCorreo, FICHA_A);
    await quieto(page, v);
    const desde90 = diaMenos(hoy, 89);
    const diasEntre = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
    /** «17 ago», como `diaYMesCivil` de la web. */
    const diaYMes = (f) => new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${f}T12:00:00Z`));
    const abrirAnalisis = async (consulta) => {
      await cupo(v);
      await ir(page, `${FICHA_A}&vista=analizar&${consulta}`);
      await quieto(page, v);
      await page.evaluate(() => window.scrollTo(0, 0));
      await pausa(350);
    };
    const figuras = (fn) => page.evaluate(fn);
    const nut = (await leerApi(v, `/advisees/${estado.aseId}/projections/NUTRITION_PRESCRIBED_VS_RECORDED?metric=ENERGY&grain=DAY&periodStart=${desde90}&periodEnd=${hoy}`)).data.result;
    const peso = (await leerApi(v, `/advisees/${estado.aseId}/projections/ANTHROPOMETRY_LONGITUDINAL?metric=peso&periodStart=${desde90}&periodEnd=${hoy}`)).data.result.series[0];

    // E-24 · La composición: una barra, los gráficos y la lectura ───────────────────────────────────────
    await page.setViewport({ width: 1440, height: 900 });
    await abrirAnalisis(`m=${encodeURIComponent(TRES)}&p=90`);
    const medirComposicion = () =>
      page.evaluate(() => {
        const partes = ['.pregunta-en-curso', '.selector-de-metricas', '.modos-de-analizar', '.tarjeta-de-graficos', '.tarjeta-de-lectura'].map((s) => document.querySelector(s));
        const todas = [...document.querySelectorAll('figure.grafico__figura')];
        // recharts 3 escribe las fechas del eje en una capa aparte de la línea del eje: se mide el texto, que es lo que se lee.
        const fechas = todas.at(-1)?.querySelector('.recharts-xAxis-tick-labels')?.getBoundingClientRect();
        const g = partes[3]?.getBoundingClientRect();
        const l = partes[4]?.getBoundingClientRect();
        return {
          estan: partes.every(Boolean),
          enOrden: partes.every((e, i) => i === 0 || (!!e && !!partes[i - 1] && (partes[i - 1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0)),
          figuras: todas.length,
          finDeLasFechas: fechas ? Math.round(fechas.bottom + scrollY) : null,
          lecturaAlCostado: !!g && !!l && l.left >= g.right - 1 && Math.abs(l.top - g.top) <= 4,
          alto: document.documentElement.scrollHeight,
          desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
    const enUnaPantalla = (m) => m.estan && m.enOrden && m.figuras === 3 && m.lecturaAlCostado && m.finDeLasFechas !== null && m.finDeLasFechas <= 900 && m.desborde <= 1;
    const composicion = await medirComposicion();
    // La prueba de la prueba: una barra alta, como la configuración de antes, saca los gráficos de la primera pantalla.
    const empujar = await page.addStyleTag({ content: '.barra-de-analizar { padding-bottom: 20rem !important; }' });
    await pausa(350);
    const empujada = await medirComposicion();
    await empujar.evaluate((e) => e.remove());
    await pausa(350);
    comprobar(
      'E-24',
      'A 1440 × 900 y con tres métricas, la pregunta, las métricas, los modos, los gráficos y la lectura van en ese orden, la lectura queda al costado y los tres gráficos, con sus fechas, entran en la primera pantalla',
      enUnaPantalla(composicion),
      JSON.stringify(composicion),
    );
    comprobar('E-24', 'La medición detecta una barra que saca los gráficos de la primera pantalla (la prueba de la prueba)', !enUnaPantalla(empujada) && (empujada.finDeLasFechas ?? 0) > 900, JSON.stringify(empujada));
    // Otras ventanas, sin umbral: se informa dónde terminan las fechas del último gráfico (una portátil de 1366 × 768
    // es más baja que los tres gráficos).
    for (const [ancho, alto] of [[1280, 900], [1024, 900], [1366, 768]]) {
      await page.setViewport({ width: ancho, height: alto });
      await pausa(600);
      informar('E-24', `La composición a ${ancho} × ${alto} (se informa; la primera pantalla se exige a 1440 × 900)`, JSON.stringify(await medirComposicion()));
    }
    await page.setViewport({ width: 1440, height: 900 });
    await pausa(600);

    // E-25 · «Más acciones» y el pie de los gráficos ────────────────────────────────────────────────────
    const masAcciones = () =>
      page.evaluate(() => {
        const b = [...document.querySelectorAll('.pregunta-en-curso__acciones button')].find((x) => x.textContent.includes('Más acciones'));
        const p = document.querySelector('.mas-acciones');
        return {
          expandido: b?.getAttribute('aria-expanded') ?? null,
          controla: !!b && !!p && b.getAttribute('aria-controls') === p.id,
          panel: !!p,
          vistas: !!p?.querySelector('details.vistas-guardadas'),
          descarga: !!p && [...p.querySelectorAll('button')].some((x) => x.textContent.includes('Descargar los datos (CSV)')),
          capas: p ? [...p.querySelectorAll('fieldset.capas input[type="checkbox"]')].map((i) => i.closest('label').innerText.replace(/\s+/g, ' ').trim()) : [],
          intervalo: !!p?.querySelector('details.intervalo'),
          comparar: !!p && [...p.querySelectorAll('button')].some((x) => x.textContent.includes('Comparar dos períodos')),
        };
      });
    const masAlEntrar = await masAcciones();
    await clic(page, '.pregunta-en-curso__acciones button', 'Más acciones');
    await page.waitForSelector('.mas-acciones', { timeout: 5_000 });
    const masAbierto = await masAcciones();
    await clic(page, '.pregunta-en-curso__acciones button', 'Más acciones');
    await page.waitForFunction(() => !document.querySelector('.mas-acciones'), { timeout: 5_000 });
    const masCerrado = await masAcciones();
    comprobar(
      'E-25',
      '«Más acciones» está cerrado al entrar; abierto, tiene las vistas guardadas, la descarga, las dos capas, el intervalo con fechas y la comparación de dos períodos; el botón dice su estado y lo vuelve a cerrar',
      masAlEntrar.expandido === 'false' &&
        !masAlEntrar.panel &&
        masAbierto.expandido === 'true' &&
        masAbierto.controla &&
        masAbierto.vistas &&
        masAbierto.descarga &&
        masAbierto.capas.length === 2 &&
        /^Etapas de los planes/.test(masAbierto.capas[0]) &&
        /^Hitos/.test(masAbierto.capas[1]) &&
        masAbierto.intervalo &&
        masAbierto.comparar &&
        masCerrado.expandido === 'false' &&
        !masCerrado.panel,
      JSON.stringify({ alEntrar: { expandido: masAlEntrar.expandido, panel: masAlEntrar.panel }, abierto: masAbierto, cerrado: { expandido: masCerrado.expandido, panel: masCerrado.panel } }),
    );
    const pie = () =>
      page.evaluate(() => ({
        botones: [...document.querySelectorAll('.pie-de-graficos button')].map((b) => b.innerText.replace(/\s+/g, ' ').trim()),
        abiertos: [...document.querySelectorAll('.pie-de-graficos button[aria-expanded="true"]')].map((b) => b.innerText.replace(/\s+/g, ' ').trim()),
        regiones: [...(document.querySelector('.bajo-los-graficos')?.children ?? [])].map((e) => e.className),
      }));
    const pieAlEntrar = await pie();
    await clic(page, '.pie-de-graficos button', 'Tabla de datos');
    await page.waitForSelector('.bajo-los-graficos .tabla-de-datos', { timeout: 5_000 });
    const pieConTabla = await pie();
    await clic(page, '.pie-de-graficos button', 'Resumen en texto');
    await page.waitForSelector('.bajo-los-graficos .resumen-en-texto', { timeout: 5_000 });
    const pieConResumen = await pie();
    await clic(page, '.pie-de-graficos button', 'Resumen en texto');
    await page.waitForFunction(() => !document.querySelector('.bajo-los-graficos'), { timeout: 5_000 });
    const pieCerrado = await pie();
    const ORDEN_DEL_PIE = [/^Tabla de datos \(\d+ fechas?\)$/, /^Resumen en texto$/, /^Hitos \(\d+\)$/, /^Comparar etapas$/, /^Cómo se calcula$/];
    comprobar(
      'E-25',
      'El pie de los gráficos ofrece la tabla de datos, el resumen en texto, los hitos, las etapas y «Cómo se calcula», y abre debajo una cosa a la vez: abrir el resumen cierra la tabla, y volver a tocarlo lo cierra',
      pieAlEntrar.botones.length === ORDEN_DEL_PIE.length &&
        ORDEN_DEL_PIE.every((r, i) => r.test(pieAlEntrar.botones[i])) &&
        pieAlEntrar.abiertos.length === 0 &&
        pieAlEntrar.regiones.length === 0 &&
        pieConTabla.abiertos.length === 1 &&
        /^Tabla de datos/.test(pieConTabla.abiertos[0]) &&
        pieConTabla.regiones.join() === 'tabla-de-datos' &&
        pieConResumen.abiertos.join() === 'Resumen en texto' &&
        pieConResumen.regiones.join() === 'resumen-en-texto' &&
        pieCerrado.abiertos.length === 0 &&
        pieCerrado.regiones.length === 0,
      JSON.stringify({ alEntrar: pieAlEntrar, conTabla: { abiertos: pieConTabla.abiertos, regiones: pieConTabla.regiones }, conResumen: { abiertos: pieConResumen.abiertos, regiones: pieConResumen.regiones }, cerrado: pieCerrado.regiones }),
    );

    // E-38 · Lo desplegado es del análisis que se mira ──────────────────────────────────────────────────
    await abrirMasAcciones(page);
    await abrirDelPie(page, 'Tabla de datos', '.tabla-de-datos');
    const desplegado = () => page.evaluate(() => ({ mas: !!document.querySelector('.mas-acciones'), tabla: !!document.querySelector('.bajo-los-graficos .tabla-de-datos') }));
    await abrirAnalisis(`m=${encodeURIComponent('nutricion.energia,nutricion.proteinas')}&p=90`);
    const trasOtraSeleccion = await desplegado();
    await clic(page, '.pregunta-en-curso__acciones button', 'Empezar por una pregunta');
    await page.waitForSelector('.preguntas-profesionales', { timeout: 10_000 });
    await quieto(page, v);
    const enLaEntrada = await page.evaluate(() => ({ preguntas: document.querySelectorAll('.tarjeta-de-pregunta').length, mas: !!document.querySelector('.mas-acciones'), graficos: document.querySelectorAll('figure.grafico__figura').length }));
    await abrirAnalisis(`m=${encodeURIComponent(TRES)}&p=90`);
    const trasLaEntrada = await desplegado();
    comprobar(
      'E-38',
      'Lo desplegado (el panel de «Más acciones» y la tabla de datos) sigue abierto al cambiar las métricas y vuelve cerrado después de pasar por la entrada de Analizar',
      trasOtraSeleccion.mas && trasOtraSeleccion.tabla && enLaEntrada.preguntas >= 4 && enLaEntrada.graficos === 0 && !trasLaEntrada.mas && !trasLaEntrada.tabla && (await page.$$eval('figure.grafico__figura', (f) => f.length)) === 3,
      JSON.stringify({ trasOtraSeleccion, enLaEntrada, trasLaEntrada }),
    );

    // E-26, E-34 y E-33 · Las marcas, los nombres y los modos (con las tres métricas a la vista) ─────────────
    const marcas = await figuras(() => {
      const grupos = [...document.querySelectorAll('figure.grafico__figura g.grafico__elegible')];
      const formas = (raiz) => [...new Set([...raiz.querySelectorAll('*')].map((e) => e.tagName.toLowerCase()))];
      return {
        porGrafico: [...document.querySelectorAll('figure.grafico__figura')].map((f) => f.querySelectorAll('g.grafico__elegible').length),
        formas: [...new Set(grupos.flatMap(formas))].sort(),
        muestras: [...new Set([...document.querySelectorAll('svg.marca-de-metrica')].flatMap(formas))].sort(),
        colores: [...document.querySelectorAll('figure.grafico__figura')].map((f) => [...new Set([...f.querySelectorAll('g.grafico__elegible circle')].map((c) => c.getAttribute('stroke')))].join()),
      };
    });
    comprobar(
      'E-26',
      'Todas las marcas de los tres gráficos son puntos (círculos), cada gráfico con el color de su métrica, y las muestras de las métricas son una línea con un punto',
      marcas.porGrafico.length === 3 && marcas.porGrafico.every((n) => n > 0) && marcas.formas.join() === 'circle,g' && marcas.muestras.join() === 'circle,g,line' && marcas.colores.join(' ') === 'var(--metrica-1) var(--metrica-2) var(--metrica-3)',
      JSON.stringify(marcas),
    );
    const nombres = await page.evaluate(() => ({
      etiquetas: [...document.querySelectorAll('.metricas-elegidas--amable li > span')].map((s) => s.innerText.trim()),
      titulos: [...document.querySelectorAll('figure.grafico__figura .grafico__titulo')].map((t) => t.innerText.replace(/\s+/g, ' ').trim()),
      lectura: [...document.querySelectorAll('.panel-de-lectura__metrica strong')].map((s) => s.innerText.trim()).slice(0, 3),
      energia: /Energ[ií]a/.test(document.querySelector('section.analizar').innerText),
      opciones: [...document.querySelectorAll('details.agregar select[id$="-nut"] option')].map((o) => o.textContent.trim()),
      modos: [...document.querySelectorAll('.modos-de-analizar fieldset')].map((f) => `${f.querySelector('legend')?.innerText.trim()}: ${[...f.querySelectorAll('label')].map((l) => l.innerText.replace(/\s+/g, ' ').trim()).join(', ')}`),
    }));
    comprobar(
      'E-34',
      'Analizar dice «Calorías» (en la etiqueta, en el título de su gráfico y entre las métricas que se pueden agregar) y no «Energía»; las métricas de Nutrición van en un solo orden: calorías, carbohidratos, grasas y proteínas',
      nombres.etiquetas.join() === 'Calorías,Proteínas,Peso' &&
        /^Calorías registradas por día · kcal$/.test(nombres.titulos[0]) &&
        !nombres.energia &&
        ['Calorías', 'Carbohidratos', 'Grasas', 'Proteínas'].every((n, i) => (nombres.opciones[i] ?? '').startsWith(n)),
      JSON.stringify({ etiquetas: nombres.etiquetas, titulos: nombres.titulos, energia: nombres.energia, opciones: nombres.opciones }),
    );
    await abrirAnalisis(`m=${encodeURIComponent('nutricion.proteinas,nutricion.carbohidratos')}&p=30`);
    await clic(page, '.modos-de-analizar label', 'Juntas');
    await quieto(page, v);
    const conJuntas = parametros(page).get('modo');
    await clic(page, '.modos-de-analizar label', 'Semana');
    await quieto(page, v);
    const conSemana = parametros(page).get('g');
    await clic(page, '.modos-de-analizar label', 'Separadas');
    await quieto(page, v);
    const conSeparadas = parametros(page).get('modo');
    comprobar(
      'E-33',
      'Los modos se llaman «Separadas», «Juntas» y «Cambio relativo», y la agrupación, «Registro», «Día» y «Semana»; en la URL siguen las mismas letras de antes (S para juntas, W para semana, y nada para separadas)',
      nombres.modos.join(' | ') === 'Ver como: Separadas, Juntas, Cambio relativo | Agrupar por: Registro, Día, Semana' && conJuntas === 'S' && conSemana === 'W' && conSeparadas === null,
      `${nombres.modos.join(' | ')} · modo=${conJuntas} · g=${conSemana} · al volver: modo=${conSeparadas}`,
    );

    // E-27 · Lo planificado y lo registrado: el objetivo de calorías ────────────────────────────────────
    // Lo esperado, a mano: cada escalón del requerimiento rige hasta el día anterior al siguiente, recortado al período.
    const escalones = [...nut.prescribed.energyRequirement].sort((a, b) => a.from.localeCompare(b.from));
    const tramos = escalones.flatMap((e, i) => {
      const siguiente = escalones[i + 1];
      const fin = siguiente ? diaMenos(siguiente.from, 1) : (e.to ?? hoy);
      const inicio = e.from < desde90 ? desde90 : e.from;
      return inicio <= hoy && fin >= desde90 && inicio <= fin ? [{ desde: inicio, valor: e.value }] : [];
    });
    const objetivoDe = (fecha) => {
      const t = [...tramos].reverse().find((x) => x.desde <= fecha);
      return t ? dominio.numero(t.valor) : 'Sin objetivo';
    };
    await abrirAnalisis(`m=${encodeURIComponent('nutricion.energia,nutricion.proteinas')}&p=90`);
    const plan = await figuras(() =>
      [...document.querySelectorAll('figure.grafico__figura')].map((f) => ({
        titulo: f.querySelector('.grafico__titulo')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
        muestras: [...f.querySelectorAll('.grafico__encabezado > .grafico__muestra')].map((m) => m.innerText.trim()),
        lineas: [...f.querySelectorAll('g.grafico__plan line')]
          .map((l) => ({ x1: Number(l.getAttribute('x1')), x2: Number(l.getAttribute('x2')), y1: Number(l.getAttribute('y1')), y2: Number(l.getAttribute('y2')), corte: l.getAttribute('stroke-dasharray'), color: l.getAttribute('stroke') }))
          .sort((a, b) => a.x1 - b.x1),
        descripcion: f.querySelector('p.visualmente-oculto')?.textContent ?? '',
      })),
    );
    const [deCalorias, deProteinas] = plan;
    // Un escalón más alto se dibuja más arriba (una y menor); dos iguales, a la misma altura.
    const alturasEnOrden = (deCalorias?.lineas ?? []).every((l, i, todas) => i === 0 || Math.sign(tramos[i].valor - tramos[i - 1].valor) === Math.sign(todas[i - 1].y1 - l.y1));
    comprobar(
      'E-27',
      'El gráfico de calorías dibuja el objetivo: un tramo horizontal y discontinuo, del color de la métrica, por cada escalón del requerimiento que devuelve la API, con la muestra «Objetivo» en su encabezado; el de proteínas no lleva ninguno',
      tramos.length > 0 &&
        deCalorias.lineas.length === tramos.length &&
        deCalorias.lineas.every((l) => Math.abs(l.y1 - l.y2) < 0.5 && l.x2 > l.x1 && !!l.corte && l.color === 'var(--metrica-1)') &&
        alturasEnOrden &&
        deCalorias.muestras.join() === 'Objetivo' &&
        deProteinas.lineas.length === 0 &&
        deProteinas.muestras.length === 0,
      `API: ${tramos.map((t) => `${t.valor} kcal desde ${t.desde}`).join('; ')} · calorías: ${deCalorias.lineas.length} tramo(s) ${JSON.stringify(deCalorias.lineas.map((l) => [Math.round(l.x1), Math.round(l.x2), Math.round(l.y1), l.corte]))}, muestra «${deCalorias.muestras.join()}» · proteínas: ${deProteinas.lineas.length} tramo(s)`,
    );
    const lecturas = await page.evaluate(() => [...document.querySelectorAll('.panel-de-lectura__metrica')].map((m) => m.innerText.replace(/\s+/g, ' ').trim()));
    comprobar(
      'E-27',
      'La lectura dice el objetivo que rige en la fecha elegida, con el valor de la API, sin calcular una diferencia ni un porcentaje; la de proteínas no dice ninguno',
      lecturas.length === 2 && lecturas[0].includes(`Objetivo: ${objetivoDe(hoy)} kcal por día`) && !/diferencia|cumpl|%/i.test(lecturas[0]) && !/Objetivo/.test(lecturas[1]),
      lecturas.map((l) => l.slice(0, 150)).join(' · '),
    );
    await abrirDelPie(page, 'Tabla de datos', '.tabla-de-datos');
    const tabla = await page.evaluate(() => {
      const t = document.querySelector('.tabla-de-datos table');
      const limpio = (e) => e.innerText.replace(/\s+/g, ' ').trim();
      return { columnas: [...t.querySelectorAll('thead th')].map(limpio), filas: [...t.querySelectorAll('tbody tr')].map((r) => [...r.children].map(limpio)) };
    });
    const fechaDe = new Map();
    for (let d = desde90; d <= hoy; d = diaMenos(d, -1)) fechaDe.set(diaCivil(d), d);
    const columna = tabla.columnas.indexOf('Objetivo de calorías (kcal por día)');
    const filasMal = tabla.filas.filter((f) => !fechaDe.has(f[0]) || f[columna] !== objetivoDe(fechaDe.get(f[0])));
    comprobar(
      'E-27',
      'La tabla de datos tiene la columna del objetivo, una sola vez y al lado de las calorías, y en cada fecha dice el que regía ese día según la API',
      columna === 2 && tabla.columnas.filter((c) => /Objetivo/.test(c)).length === 1 && tabla.filas.length > 0 && filasMal.length === 0,
      `${tabla.columnas.join(' | ')} · ${tabla.filas.length} filas, ${filasMal.length} distintas de lo esperado${filasMal.length ? `: ${JSON.stringify(filasMal.slice(0, 2))}` : ''} · primera: ${JSON.stringify(tabla.filas[0])}`,
    );
    await clic(page, '.pie-de-graficos button', 'Resumen en texto');
    await page.waitForSelector('.bajo-los-graficos .resumen-en-texto', { timeout: 5_000 });
    const resumen = await texto(page, '.bajo-los-graficos .resumen-en-texto');
    const frase = `Objetivo de calorías (requerimiento energético estimado): ${tramos.map((t) => `${dominio.numero(t.valor)} kcal por día desde el ${diaCivil(t.desde)}`).join('; ')}.`;
    comprobar(
      'E-27',
      'El resumen en texto y la descripción del gráfico dicen el objetivo con sus fechas, una vez: lo que el gráfico dibuja se puede leer sin verlo',
      resumen.split(frase).length === 2 && resumen.split('Objetivo de calorías').length === 2 && deCalorias.descripcion.split(frase).length === 2,
      `esperado: «${frase}» · en el resumen: ${resumen.includes(frase) ? 'sí' : 'no'} · en la descripción: ${deCalorias.descripcion.includes(frase) ? 'sí' : 'no'}`,
    );
    await clic(page, '.pie-de-graficos button', 'Resumen en texto');
    await page.waitForFunction(() => !document.querySelector('.bajo-los-graficos'), { timeout: 5_000 });

    // E-28 · Los días sin registros, en gris ────────────────────────────────────────────────────────
    // Lo esperado, a mano: los huecos que declara la API, sin el día en curso.
    const huecos = nut.recorded.gaps.flatMap((h) => {
      const desde = h.from < desde90 ? desde90 : h.from;
      const hasta = h.to >= hoy ? diaMenos(hoy, 1) : h.to;
      return hasta >= desde ? [{ desde, hasta }] : [];
    });
    const diasSinRegistros = huecos.reduce((s, h) => s + diasEntre(h.desde, h.hasta) + 1, 0);
    const gris = () =>
      figuras(() =>
        [...document.querySelectorAll('figure.grafico__figura')].map((f) => ({
          titulo: f.querySelector('.grafico__titulo')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
          zonas: f.querySelectorAll('g.grafico__sin-registros').length,
          cobertura: f.querySelector('.grafico__cobertura')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
          muestra: !!f.querySelector('.grafico__cobertura .muestra-de-hueco'),
        })),
      );
    await abrirAnalisis(`m=${encodeURIComponent('nutricion.energia,antropometria.peso')}&p=90`);
    const grisPorDia = await gris();
    await abrirAnalisis(`m=${encodeURIComponent('nutricion.energia,antropometria.peso')}&p=90&g=W`);
    const grisPorSemana = await gris();
    // Dos métricas de Nutrición juntas comparten los días sin registros (salen de los mismos registros): el mismo gris.
    await abrirAnalisis(`m=${encodeURIComponent('nutricion.proteinas,nutricion.carbohidratos')}&modo=S&p=90`);
    const grisJuntas = await gris();
    comprobar(
      'E-28',
      'Por día, el gráfico de calorías sombrea los días sin registros que declara la API (sin el día en curso) y su encabezado los cuenta, con la muestra gris; en «Juntas», dos métricas de Nutrición llevan el mismo sombreado; por semana no hay sombreado ni muestra, y el peso (cada toma) nunca lo lleva',
      huecos.length > 0 &&
        grisPorDia[0].zonas === huecos.length &&
        grisPorDia[0].cobertura.includes(`${dominio.numero(diasSinRegistros)} sin registros`) &&
        grisPorDia[0].muestra &&
        grisPorDia[1].zonas === 0 &&
        !grisPorDia[1].muestra &&
        grisPorSemana[0].zonas === 0 &&
        !grisPorSemana[0].muestra &&
        grisJuntas.length === 1 &&
        grisJuntas[0].zonas === huecos.length,
      `API: ${huecos.map((h) => `${h.desde}..${h.hasta}`).join(', ')} (${diasSinRegistros} días) · por día: ${JSON.stringify(grisPorDia)} · por semana: ${JSON.stringify(grisPorSemana[0])} · juntas: ${JSON.stringify(grisJuntas)}`,
    );

    // E-29 · Las etapas de cada área, con el rótulo arriba y una vez por área ───────────────────────────
    // Lo esperado, a mano: las versiones del plan de Nutrición que se ven al menos 20 días en el período (con lugar
    // de sobra para su rótulo entero a 1440 px).
    const diasVisibles = (b) => diasEntre(b.from < desde90 ? desde90 : b.from, b.to && b.to <= hoy ? b.to : diaMenos(hoy, -1));
    const rotulosEsperados = nut.planVersions.filter((b) => diasVisibles(b) >= 20).map((b) => `Nutrición · ${b.label.replace(/^v(\d+)$/, 'versión $1')}`);
    const etapas = () =>
      figuras(() =>
        [...document.querySelectorAll('figure.grafico__figura')].map((f) => {
          const rects = [...f.querySelectorAll('g.grafico__banda .recharts-reference-area-rect')].map((r) => r.getBoundingClientRect());
          const techo = Math.min(...rects.map((r) => r.top));
          const textos = [...f.querySelectorAll('svg text.recharts-label')].filter((t) => /versión \d+$|^v\d+$/.test(t.textContent.trim()));
          return { bandas: rects.filter((r) => r.width >= 1).length, rotulos: textos.map((t) => t.textContent.trim()), arriba: textos.every((t) => t.getBoundingClientRect().bottom <= techo + 1) };
        }),
      );
    await abrirAnalisis(`m=${encodeURIComponent(TRES)}&p=90`);
    const etapasEnTres = await etapas();
    comprobar(
      'E-29',
      'Con calorías, proteínas y peso, las etapas de Nutrición están en los tres gráficos (el peso lleva las de las otras métricas) y su rótulo va una sola vez, en el primero, arriba del dibujo',
      rotulosEsperados.length > 0 &&
        etapasEnTres.length === 3 &&
        etapasEnTres.every((e) => e.bandas === etapasEnTres[0].bandas && e.bandas >= rotulosEsperados.length) &&
        etapasEnTres[0].rotulos.join(' | ') === rotulosEsperados.join(' | ') &&
        etapasEnTres[0].arriba &&
        etapasEnTres[1].rotulos.length === 0 &&
        etapasEnTres[2].rotulos.length === 0,
      `esperado: ${rotulosEsperados.join(' | ')} · ${JSON.stringify(etapasEnTres)}`,
    );
    // Una etapa que no llega a verse en el período no lleva rótulo: la pregunta del plan empieza el día de su activación,
    // y la versión anterior termina justo ahí.
    await abrirAnalisis(`pregunta=cambio-desde-el-plan&area=NUTRICION&version=${estado.nutricion.planV2}`);
    const etapasDelPlan = await etapas();
    comprobar(
      'E-29',
      'En la pregunta del plan (que empieza el día de la activación), el gráfico rotula la versión elegida y no la anterior, que ya no se ve',
      etapasDelPlan.length > 0 && etapasDelPlan[0].rotulos.join() === 'Nutrición · versión 2' && etapasDelPlan[0].arriba,
      JSON.stringify(etapasDelPlan),
    );

    // E-30 · Los cortes del peso: cambio de protocolo, método o unidad ────────────────────────────────
    // Lo esperado, a mano: cada tramo que la API declara no comparable con el anterior empieza un corte, en la fecha de
    // su primera toma (el primer tramo de un período no tiene anterior: no lleva corte).
    const cortesEsperados = (serie, desde) =>
      serie.segments
        .filter((t) => t.breakReason)
        .map((t) => ({ fecha: serie.points.find((p) => p.segment === t.segment)?.date ?? '', motivo: t.breakReason.replace(/\.$/, '') }))
        .filter((c) => c.fecha > desde && c.fecha <= hoy)
        .sort((a, b) => a.fecha.localeCompare(b.fecha));
    const cortes = () =>
      page.evaluate(() => ({
        porGrafico: [...document.querySelectorAll('figure.grafico__figura')].map((f) => ({
          lineas: f.querySelectorAll('g.grafico__corte').length,
          rotulos: [...f.querySelectorAll('svg text.recharts-label')].map((t) => t.textContent.trim()).filter((t) => !/versión \d+$|^v\d+$|^Referencia$/.test(t)),
        })),
        leyenda: [...document.querySelectorAll('.leyenda li')].map((l) => l.innerText.replace(/\s+/g, ' ').trim()),
      }));
    const enMinuscula = (t) => t.charAt(0).toLowerCase() + t.slice(1);
    const todos = cortesEsperados(peso, desde90);
    await abrirAnalisis(`m=${encodeURIComponent('nutricion.energia,antropometria.peso')}&p=90`);
    const cortesEn90 = await cortes();
    if (todos.length >= 2) {
      comprobar(
        'E-30',
        'Con varios cambios de protocolo en el período, el gráfico del peso marca cada uno con un número y la leyenda dice su fecha y su motivo; el de calorías no marca cortes (sus tramos son huecos)',
        cortesEn90.porGrafico[1].lineas === todos.length &&
          cortesEn90.porGrafico[1].rotulos.join() === todos.map((_, i) => String(i + 1)).join() &&
          todos.every((c, i) => cortesEn90.leyenda.includes(`${i + 1} ${diaCivil(c.fecha)}: ${enMinuscula(c.motivo)} (no se compara con lo anterior)`)) &&
          cortesEn90.porGrafico[0].lineas === 0,
        `API: ${todos.map((c) => `${c.fecha} ${c.motivo}`).join('; ')} · ${JSON.stringify(cortesEn90)}`,
      );
      // Con uno solo a la vista, el motivo va escrito en el gráfico. El período empieza el día anterior a la toma que
      // precede al último corte: así ese corte tiene un tramo anterior adentro del período, y es el único. Lo esperado
      // sale de la misma lectura que hace la página, para ese período.
      const tomas = [...peso.points].sort((a, b) => a.date.localeCompare(b.date));
      const previa = tomas[tomas.findIndex((p) => p.date === todos.at(-1).fecha) - 1];
      const desdeElUltimo = diaMenos(previa.date, 1);
      const pesoDelTramo = (await leerApi(v, `/advisees/${estado.aseId}/projections/ANTHROPOMETRY_LONGITUDINAL?metric=peso&periodStart=${desdeElUltimo}&periodEnd=${hoy}`)).data.result.series[0];
      const unoSolo = cortesEsperados(pesoDelTramo, desdeElUltimo);
      await abrirAnalisis(`m=${encodeURIComponent('antropometria.peso')}&desde=${desdeElUltimo}&hasta=${hoy}`);
      const cortesConUno = await cortes();
      comprobar(
        'E-30',
        'Con un solo cambio de protocolo a la vista, el gráfico lo marca con su motivo y su fecha escritos, y la leyenda no lo repite',
        unoSolo.length === 1 && cortesConUno.porGrafico[0].lineas === 1 && cortesConUno.porGrafico[0].rotulos.join() === `${unoSolo[0].motivo} · ${diaYMes(unoSolo[0].fecha)}` && !cortesConUno.leyenda.some((l) => /no se compara con lo anterior/.test(l)),
        `del ${desdeElUltimo} al ${hoy} · API: ${unoSolo.map((c) => `${c.fecha} ${c.motivo}`).join('; ')} · ${JSON.stringify(cortesConUno)}`,
      );
    } else {
      informar('E-30', 'Los cortes del peso en el escenario', `${todos.length} en 90 días: no alcanzan para comprobar los dos casos`);
    }

    // E-31 · Las líneas de los hitos, solo con su lista abierta ─────────────────────────────────────────
    await abrirAnalisis(`m=${encodeURIComponent('nutricion.energia,nutricion.proteinas')}&p=90`);
    const lineasDeHitos = () => figuras(() => [...document.querySelectorAll('figure.grafico__figura')].map((f) => [...f.querySelectorAll('.recharts-reference-line-line')].filter((l) => l.getAttribute('stroke-dasharray') === '2 4').length));
    const hitosCerrados = await lineasDeHitos();
    await clic(page, '.pie-de-graficos button', 'Hitos (');
    await page.waitForSelector('.bajo-los-graficos .hitos li', { timeout: 5_000 });
    await pausa(300);
    const listados = await page.$$eval('.bajo-los-graficos .hitos li', (l) => l.length);
    const hitosAbiertos = await lineasDeHitos();
    await clic(page, '.pie-de-graficos button', 'Hitos (');
    await page.waitForFunction(() => !document.querySelector('.bajo-los-graficos'), { timeout: 5_000 });
    await pausa(300);
    const hitosVueltosACerrar = await lineasDeHitos();
    comprobar(
      'E-31',
      'Las líneas de los hitos no se dibujan con su lista cerrada; al abrir «Hitos», cada gráfico dibuja una por hito de la lista, y al cerrarla se van',
      listados > 0 && hitosCerrados.every((n) => n === 0) && hitosAbiertos.length === 2 && hitosAbiertos.every((n) => n === listados) && hitosVueltosACerrar.every((n) => n === 0),
      `${listados} hitos en la lista · líneas por gráfico: cerrada ${hitosCerrados.join('/')}, abierta ${hitosAbiertos.join('/')}, cerrada otra vez ${hitosVueltosACerrar.join('/')}`,
    );

    // E-35 · La lectura: el valor grande y, debajo, cómo leerlo ─────────────────────────────────────────
    // Un día terminado y completo de la API (no el día en curso, ni un subtotal).
    const completo = [...nut.recorded.points].reverse().find((p) => p.date !== hoy && p.value !== null && !p.partialBucket && p.quality !== 'PARTIAL');
    if (completo) {
      await abrirAnalisis(`m=${encodeURIComponent('nutricion.energia')}&p=90&f=${completo.date}`);
      const lectura = await page.evaluate(() => ({
        titulo: document.querySelector('.panel-de-lectura h3')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
        valor: document.querySelector('.dato-de-lectura__valor')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
        grande: Number.parseFloat(getComputedStyle(document.querySelector('.dato-de-lectura__valor')).fontSize) > Number.parseFloat(getComputedStyle(document.querySelector('.panel-de-lectura__metrica')).fontSize) * 1.3,
        origen: [...document.querySelectorAll('.panel-de-lectura__metrica button')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()),
        irAUnaFecha: document.querySelector('.lectura__fecha input[type="date"]')?.value ?? '',
      }));
      comprobar(
        'E-35',
        'La lectura de un día completo dice su fecha, el valor de la API en grande con su unidad, «Ver origen» con el nombre de la métrica y el campo «Ir a una fecha» con esa fecha',
        lectura.titulo.includes(diaCivil(completo.date)) && lectura.valor === `${dominio.numero(Math.round(completo.value))} kcal` && lectura.grande && lectura.origen.join() === 'Ver origen de Calorías' && lectura.irAUnaFecha === completo.date,
        `API: ${completo.date} = ${completo.value} kcal · ${JSON.stringify(lectura)}`,
      );
    } else {
      informar('E-35', 'La lectura de un día completo', 'el escenario no tiene un día terminado y completo en 90 días');
    }

    // E-36 · La leyenda dice solo lo que está dibujado ──────────────────────────────────────────────────
    // Una semana terminada, con valor todos los días y sin subtotales: ahí no hay nada que explicar.
    const dias = nut.recorded.points.filter((p) => p.date !== hoy);
    const limpio = (p) => p.value !== null && !p.partialBucket && p.quality !== 'PARTIAL';
    let semanaLimpia = null;
    for (let fin = diaMenos(hoy, 1); fin >= diaMenos(desde90, -6) && !semanaLimpia; fin = diaMenos(fin, 1)) {
      const inicio = diaMenos(fin, 6);
      const deLaSemana = dias.filter((p) => p.date >= inicio && p.date <= fin);
      if (deLaSemana.length === 7 && deLaSemana.every(limpio)) semanaLimpia = { desde: inicio, hasta: fin };
    }
    await abrirAnalisis(`m=${encodeURIComponent('nutricion.energia')}&p=90`);
    const leyendaEn90 = await textos(page, '.tarjeta-de-graficos .leyenda li');
    if (semanaLimpia) {
      await abrirAnalisis(`m=${encodeURIComponent('nutricion.energia')}&desde=${semanaLimpia.desde}&hasta=${semanaLimpia.hasta}`);
      const sinLeyenda = await page.evaluate(() => ({ leyenda: document.querySelectorAll('.tarjeta-de-graficos .leyenda').length, marcas: document.querySelectorAll('figure.grafico__figura g.grafico__elegible').length }));
      comprobar(
        'E-36',
        'Con el día en curso a la vista, la leyenda explica el punto hueco; en una semana terminada y completa (siete puntos llenos) no hay leyenda: un estado que no aparece no ocupa lugar',
        leyendaEn90.some((l) => /^Hueco: subtotal/.test(l)) && sinLeyenda.leyenda === 0 && sinLeyenda.marcas === 7,
        `90 días: ${leyendaEn90.join(' | ')} · del ${semanaLimpia.desde} al ${semanaLimpia.hasta}: ${JSON.stringify(sinLeyenda)}`,
      );
    } else {
      informar('E-36', 'La leyenda en una semana completa', 'el escenario no tiene siete días seguidos completos en 90 días');
    }

    // El aro de la fecha elegida, entero ────────────────────────────────────────────────────────────
    // Con 90 días a la vista, el último punto queda a medio día del borde derecho del gráfico: el aro tiene que verse
    // entero (antes iba adentro del grupo de puntos de la línea, que recharts recorta al área de dibujo).
    await abrirAnalisis(`m=${encodeURIComponent('nutricion.energia,nutricion.proteinas')}&p=90`);
    const aros = () =>
      figuras(() =>
        [...document.querySelectorAll('figure.grafico__figura')].map((f) => {
          const svg = f.querySelector('svg.recharts-surface').getBoundingClientRect();
          const marca = f.querySelector('g.grafico__elegible[data-elegido] circle')?.getBoundingClientRect();
          return [...f.querySelectorAll('g.grafico__aro circle')].map((c) => {
            const r = c.getBoundingClientRect();
            let recortado = false;
            for (let e = c; e && e.tagName.toLowerCase() !== 'svg'; e = e.parentElement) if (e.hasAttribute('clip-path') || getComputedStyle(e).clipPath !== 'none') recortado = true;
            return {
              entero: r.left >= svg.left - 0.5 && r.right <= svg.right + 0.5 && r.top >= svg.top - 0.5 && r.bottom <= svg.bottom + 0.5,
              recortado,
              rodea: !!marca && r.left < marca.left && r.right > marca.right && r.top < marca.top && r.bottom > marca.bottom,
            };
          });
        }),
      );
    const enteros = (a) => a.length === 2 && a.every((x) => x.length === 1 && x[0].entero && !x[0].recortado && x[0].rodea);
    const arosVistos = await aros();
    const recortar = await page.addStyleTag({ content: 'figure.grafico__figura g.grafico__aro { clip-path: inset(0 60% 0 0); }' });
    await pausa(200);
    const arosRecortados = await aros();
    await recortar.evaluate((e) => e.remove());
    comprobar('E-39', 'Con 90 días a la vista, el aro de la fecha elegida (la última) rodea su marca y se ve entero en cada gráfico: nada lo recorta contra el borde', enteros(arosVistos), JSON.stringify(arosVistos));
    comprobar('E-39', 'La medición detecta un aro recortado (la prueba de la prueba)', !enteros(arosRecortados) && arosRecortados.every((x) => x.every((a) => a.recortado)), JSON.stringify(arosRecortados));

    // E-32 · El encabezado de cada gráfico y las fechas, una sola vez ───────────────────────────────────
    await abrirAnalisis(`m=${encodeURIComponent(TRES)}&p=90`);
    const encabezados = await figuras(() =>
      [...document.querySelectorAll('figure.grafico__figura')].map((f) => ({
        titulo: f.querySelector('.grafico__titulo strong')?.innerText.trim() ?? '',
        detalle: f.querySelector('.grafico__detalle')?.innerText.trim() ?? '',
        cobertura: f.querySelector('.grafico__cobertura')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
        fechas: f.querySelectorAll('.recharts-xAxis-tick-labels text').length,
        marcasDelEje: f.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick-line').length,
      })),
    );
    comprobar(
      'E-32',
      'Cada gráfico dice en su encabezado el nombre, qué es cada punto y su unidad, y la cobertura; las fechas se escriben una sola vez, bajo el último, y los demás conservan las marcas del eje',
      encabezados.length === 3 &&
        encabezados.map((e) => `${e.titulo} ${e.detalle}`).join(' | ') === 'Calorías registradas por día · kcal | Proteínas registradas por día · g | Peso cada toma · kg' &&
        /^90 días: \d+ con valor/.test(encabezados[0].cobertura) &&
        /^\d+ tomas?/.test(encabezados[2].cobertura) &&
        encabezados[0].fechas === 0 &&
        encabezados[1].fechas === 0 &&
        encabezados[2].fechas > 1 &&
        encabezados.every((e) => e.marcasDelEje > 1 && e.marcasDelEje === encabezados[2].marcasDelEje),
      JSON.stringify(encabezados),
    );

    // Accesibilidad con todo desplegado, en los dos temas: los controles nuevos (segmentos, etiquetas, paneles).
    await abrirMasAcciones(page);
    await abrirDelPie(page, 'Tabla de datos', '.tabla-de-datos');
    const temaInicial = await page.evaluate(() => document.documentElement.dataset.tema);
    const violaciones = {};
    for (const tema of ['claro', 'azul-noche']) {
      await ponerTema(page, tema);
      await pausa(300);
      violaciones[tema] = await axe(page);
    }
    await ponerTema(page, temaInicial);
    comprobar(
      'PRO-22',
      'Analizar recompuesto, con «Más acciones» y la tabla de datos abiertos: axe no encuentra faltas de WCAG 2.2 AA en ninguno de los dos temas',
      violaciones.claro.length === 0 && violaciones['azul-noche'].length === 0,
      JSON.stringify(violaciones),
    );
    comprobar('PRO-25', 'Sin errores de JavaScript ni respuestas con error de la API durante el recorrido de Analizar recompuesto', v.errores.length === 0 && v.malas.length === 0, [...v.errores, ...v.malas].slice(0, 4).join(' · ') || 'ninguno');
  } finally {
    await navegador.close();
  }
}

// ─── El encabezado, el menú de la cuenta y las tarjetas de preguntas (WP-ESCRITORIO-AMABLE, E-17 y E-18) ─────────────

/**
 * En una sesión propia, porque termina cerrándola. El modo funcional la corre al final; también va sola, con
 * `node recorrido.mjs menu`.
 */
async function encabezadoYMenu() {
  const { navegador, page, v } = await abrir();
  try {
    await iniciarSesion(page, v, estado.proCorreo, FICHA_A);
    await quieto(page, v);
    const lugares = await textos(page, '.encabezado .navegacion a');
    const palabra = await texto(page, '.menu-de-cuenta__boton');
    const medirEncabezado = () =>
      page.evaluate(() => {
        const enlaces = [...document.querySelectorAll('.encabezado .navegacion a')].map((a) => Math.round(a.getBoundingClientRect().top));
        const boton = document.querySelector('.menu-de-cuenta__boton').getBoundingClientRect();
        return {
          alto: Math.round(document.querySelector('.encabezado').getBoundingClientRect().height),
          lineasDeNavegacion: new Set(enlaces).size,
          conAviso: /Ambiente de prueba/.test(document.querySelector('.encabezado').innerText),
          botonEnLaEsquina: Math.round(document.documentElement.clientWidth - boton.right) <= 34 && boton.top < 20,
          desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
    // Un renglón: 65 px medidos; el tope deja margen para un cambio de letra, no para un segundo renglón (más de 100).
    const enOrden = (m) => m.alto <= 70 && m.lineasDeNavegacion === 1 && m.botonEnLaEsquina && m.desborde <= 1 && !m.conAviso;
    const encabezado = {};
    for (const ancho of [1440, 1280, 1024, 768]) {
      await page.setViewport({ width: ancho, height: 900 });
      await pausa(400);
      encabezado[ancho] = await medirEncabezado();
    }
    // La prueba de la prueba, en la tablet de pie: con la navegación partida en dos líneas, como quedaba antes, la
    // medición lo dice. La hoja que lo provoca se quita enseguida.
    const partir = await page.addStyleTag({ content: '.encabezado .navegacion { flex: 0 1 20rem !important; } .encabezado .navegacion ul { flex-wrap: wrap !important; overflow: visible !important; }' });
    await pausa(300);
    const partido = await medirEncabezado();
    await partir.evaluate((e) => e.remove());
    await page.setViewport({ width: 1440, height: 900 });
    await pausa(400);
    comprobar('E-17', 'La navegación del profesional tiene sus cuatro lugares; «Cuenta» ya no está ahí: es el botón de la esquina', lugares.join(',') === 'Espacio profesional,Plantillas y habituales,Mis recetas,Mis ejercicios' && palabra === 'Cuenta', `${lugares.join(' · ')} + botón «${palabra}»`);
    comprobar(
      'E-17',
      'La barra de marca ocupa un solo renglón a 1440, 1280 y 1024 px y en la tablet de pie (768), con la navegación sin partir, el botón en la esquina y sin el aviso de ambiente (E-19)',
      [1440, 1280, 1024, 768].every((a) => enOrden(encabezado[a])),
      JSON.stringify(encabezado),
    );
    comprobar('E-17', 'La medición del encabezado detecta una navegación partida en dos líneas (la prueba de la prueba)', !enOrden(partido) && partido.lineasDeNavegacion > 1, JSON.stringify(partido));

    // Con el teclado: se abre con Enter, y adentro están los datos de la cuenta, la apariencia y cerrar sesión.
    await page.focus('.menu-de-cuenta__boton');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.menu-de-cuenta__panel', { timeout: 5_000 });
    const abierto = await page.evaluate(() => {
      const p = document.querySelector('.menu-de-cuenta__panel');
      const r = p.getBoundingClientRect();
      const b = document.querySelector('.menu-de-cuenta__boton');
      return {
        expandido: b.getAttribute('aria-expanded'),
        controla: b.getAttribute('aria-controls') === p.id,
        opciones: [...p.querySelectorAll('a, button')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()),
        grupo: p.querySelector('fieldset legend')?.innerText.trim() ?? '',
        temas: [...p.querySelectorAll('input[type="radio"]')].map((i) => `${i.closest('label').innerText.trim()}${i.checked ? ' (elegido)' : ''}`),
        elegido: p.querySelector('input[type="radio"]:checked')?.value ?? '',
        tema: document.documentElement.dataset.tema,
        entra: r.left >= 0 && r.right <= document.documentElement.clientWidth && r.bottom <= window.innerHeight,
      };
    });
    comprobar(
      'E-17',
      'El menú de la cuenta se abre con el teclado y ofrece los datos de la cuenta, la apariencia (dos opciones; la elegida es la que se ve) y cerrar sesión',
      abierto.expandido === 'true' && abierto.controla && abierto.opciones.length === 2 && /^Datos de la cuenta/.test(abierto.opciones[0]) && abierto.opciones[1] === 'Cerrar sesión' && abierto.grupo === 'Apariencia' && abierto.temas.length === 2 && abierto.elegido === abierto.tema && abierto.entra,
      JSON.stringify(abierto),
    );
    const axeDelMenu = { [abierto.tema]: await axe(page) };

    // Elegir el otro tema lo aplica en el momento y lo guarda en el navegador. No pide nada a la API ni sale de la ficha.
    const otro = abierto.tema === 'claro' ? 'azul-noche' : 'claro';
    const pedidosAntes = v.urls.length;
    const urlAntes = page.url();
    await page.click(`.menu-de-cuenta__panel input[type="radio"][value="${otro}"]`);
    await page.waitForFunction((t) => document.documentElement.dataset.tema === t, { timeout: 5_000 }, otro);
    await pausa(400);
    const elegido = await page.evaluate(() => ({ tema: document.documentElement.dataset.tema, guardado: localStorage.getItem('be-apariencia'), panel: !!document.querySelector('.menu-de-cuenta__panel'), ficha: !!document.querySelector('.marco-de-la-ficha') }));
    comprobar(
      'E-17',
      'Elegir el otro tema lo aplica en el momento y lo guarda en el navegador, sin pedir nada a la API, sin salir de la ficha y sin cerrar el menú',
      elegido.tema === otro && elegido.guardado === otro && elegido.ficha && elegido.panel && v.urls.length === pedidosAntes && page.url() === urlAntes,
      JSON.stringify({ ...elegido, pedidos: v.urls.length - pedidosAntes }),
    );
    axeDelMenu[otro] = await axe(page);
    await page.screenshot({ path: fileURLToPath(new URL(`menu-de-cuenta-1440-${otro}.png`, DIR)) });
    for (const [tema, violaciones] of Object.entries(axeDelMenu)) comprobar('E-17', `axe (WCAG 2.2 A/AA) con el menú de la cuenta abierto, en ${tema}: sin violaciones automáticas`, violaciones.length === 0, violaciones.map((x) => `${x.id}×${x.nodos} (${x.ejemplo})`).join('; '));

    // Escape lo cierra y devuelve el foco al botón; salir de él con Tab también lo cierra.
    await page.keyboard.press('Escape');
    await pausa(200);
    const conEscape = await page.evaluate(() => ({ panel: !!document.querySelector('.menu-de-cuenta__panel'), foco: document.activeElement?.classList.contains('menu-de-cuenta__boton') ?? false, expandido: document.querySelector('.menu-de-cuenta__boton').getAttribute('aria-expanded') }));
    await page.keyboard.press('Enter');
    await page.waitForSelector('.menu-de-cuenta__panel', { timeout: 5_000 });
    const paradas = [];
    for (let i = 0; i < 8 && (await page.$('.menu-de-cuenta__panel')); i++) {
      await page.keyboard.press('Tab');
      await pausa(100);
      paradas.push(await page.evaluate(() => (document.activeElement?.closest('.menu-de-cuenta__panel') ? (document.activeElement.innerText || document.activeElement.closest('label')?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 22) : 'fuera')));
    }
    const conTab = await page.evaluate(() => ({ panel: !!document.querySelector('.menu-de-cuenta__panel'), focoFuera: !document.activeElement?.closest('.menu-de-cuenta') }));
    comprobar(
      'E-17',
      'Escape cierra el menú y devuelve el foco a su botón; salir de él con Tab también lo cierra, así el foco no queda detrás del panel',
      !conEscape.panel && conEscape.foco && conEscape.expandido === 'false' && !conTab.panel && conTab.focoFuera && paradas.length === 4 && paradas[3] === 'fuera',
      JSON.stringify({ conEscape, paradas, conTab }),
    );

    // Las tarjetas de «Empezar por una pregunta», todas del mismo tamaño (E-18), a los tres anchos del escritorio.
    await cupo(v);
    await ir(page, `${FICHA_A}&vista=analizar`);
    await quieto(page, v);
    const medirTarjetas = () =>
      page.evaluate(() => {
        const lista = document.querySelector('.preguntas-profesionales > .preguntas-profesionales__lista');
        const cajas = [...lista.querySelectorAll('.tarjeta-de-pregunta')].map((t) => t.getBoundingClientRect());
        return { cantidad: cajas.length, anchos: [...new Set(cajas.map((c) => Math.round(c.width)))], altos: [...new Set(cajas.map((c) => Math.round(c.height)))], columnas: new Set(cajas.map((c) => Math.round(c.left))).size };
      });
    const iguales = (m) => m.cantidad === 4 && m.columnas === 2 && m.anchos.length === 1 && m.altos.length === 1;
    const tarjetas = {};
    for (const ancho of [1440, 1280, 1024]) {
      await page.setViewport({ width: ancho, height: 900 });
      await pausa(400);
      tarjetas[ancho] = await medirTarjetas();
    }
    await page.setViewport({ width: 1440, height: 900 });
    await pausa(400);
    // La prueba de la prueba: sin el arreglo (cada tarjeta con el alto de su texto), la medición encuentra una más baja.
    const soltar = await page.addStyleTag({ content: '.preguntas-profesionales__lista { grid-auto-rows: auto !important; } .preguntas-profesionales__lista > li { display: block !important; } .tarjeta-de-pregunta { height: auto !important; }' });
    await pausa(300);
    const sueltas = await medirTarjetas();
    await soltar.evaluate((e) => e.remove());
    await pausa(200);
    comprobar(
      'E-18',
      'Las cuatro tarjetas de «Empezar por una pregunta» miden lo mismo, en dos columnas, a 1440, 1280 y 1024 px',
      Object.values(tarjetas).every(iguales),
      JSON.stringify(tarjetas),
    );
    comprobar('E-18', 'La medición de las tarjetas detecta una más baja que las otras, como estaban antes (la prueba de la prueba)', !iguales(sueltas) && sueltas.altos.length > 1, JSON.stringify(sueltas));

    // «Datos de la cuenta» abre la cuenta sin cerrar la sesión; estando ahí, el menú ya no ofrece ese enlace.
    await page.click('.menu-de-cuenta__boton');
    await page.waitForSelector('.menu-de-cuenta__panel a', { timeout: 5_000 });
    await clic(page, '.menu-de-cuenta__panel a', 'Datos de la cuenta');
    await page.waitForFunction(() => location.pathname.startsWith('/account'), { timeout: 15_000 });
    await quieto(page, v);
    const enCuenta = await page.evaluate(() => ({ titulo: document.querySelector('h1')?.innerText.trim() ?? '', panel: !!document.querySelector('.menu-de-cuenta__panel'), conDatos: !!document.querySelector('#titulo-estado'), tema: document.documentElement.dataset.tema }));
    await page.click('.menu-de-cuenta__boton');
    await page.waitForSelector('.menu-de-cuenta__panel', { timeout: 5_000 });
    const opcionesEnCuenta = await textos(page, '.menu-de-cuenta__panel a, .menu-de-cuenta__panel button');
    comprobar(
      'E-17',
      '«Datos de la cuenta» abre la cuenta sin cerrar la sesión, con el tema elegido, y el menú se cierra al cambiar de página; estando ahí, ya no ofrece ese enlace',
      enCuenta.titulo === 'Cuenta' && enCuenta.conDatos && !enCuenta.panel && enCuenta.tema === otro && opcionesEnCuenta.join() === 'Cerrar sesión',
      JSON.stringify({ ...enCuenta, opcionesEnCuenta }),
    );

    // «Cerrar sesión» la cierra en la API y lleva a «Iniciar sesión» con su aviso; el token viejo ya no sirve.
    const tokenViejo = v.token;
    const desde = v.urls.length;
    await clic(page, '.menu-de-cuenta__panel button', 'Cerrar sesión');
    await page.waitForFunction(() => location.pathname.startsWith('/login'), { timeout: 20_000 });
    await page.waitForSelector('.menu-de-cuenta__boton', { timeout: 15_000 });
    await pausa(600);
    const cierre = v.urls.slice(desde).filter((u) => /^DELETE .*\/auth\/sessions\/current$/.test(u));
    const despues = await fetch(`${API}/api/v1/me`, { headers: { Authorization: tokenViejo, 'X-BE-Surface': 'WEB', Accept: 'application/json' } }).then((r) => r.status, () => 0);
    const enLogin = await page.evaluate(() => ({ aviso: document.querySelector('main')?.innerText.includes('Cerraste la sesión.') ?? false, boton: document.querySelector('.menu-de-cuenta__boton').innerText.replace(/\s+/g, ' ').trim(), tema: document.documentElement.dataset.tema, ruta: location.pathname + location.search }));
    await page.click('.menu-de-cuenta__boton');
    await page.waitForSelector('.menu-de-cuenta__panel', { timeout: 5_000 });
    const sinSesion = await page.evaluate(() => {
      const p = document.querySelector('.menu-de-cuenta__panel');
      return { enlacesYBotones: p.querySelectorAll('a, button').length, temas: p.querySelectorAll('input[type="radio"]').length, elegido: p.querySelector('input[type="radio"]:checked')?.value ?? '' };
    });
    comprobar(
      'E-17',
      '«Cerrar sesión» cierra la sesión en la API (el token deja de servir) y lleva a «Iniciar sesión» con su aviso; la apariencia elegida sigue después de la recarga',
      cierre.length === 1 && despues === 401 && enLogin.aviso && enLogin.tema === otro && /^\/login\/?\?aviso=sesion-cerrada$/.test(enLogin.ruta),
      JSON.stringify({ cierre: cierre.map((u) => u.replace(API, '')), tokenViejo: despues, ...enLogin }),
    );
    comprobar('E-17', 'Sin sesión, el botón de la esquina dice «Apariencia» y abre solo las dos opciones de apariencia', enLogin.boton === 'Apariencia' && sinSesion.enlacesYBotones === 0 && sinSesion.temas === 2 && sinSesion.elegido === otro, JSON.stringify({ boton: enLogin.boton, ...sinSesion }));
    // El aviso de ambiente salió de la barra (E-19): queda en el pie de la cara pública, y esta comprobación lo cuida.
    const pie = await texto(page, 'footer.pie');
    const barra = await texto(page, '.encabezado');
    comprobar(
      'E-19',
      'El aviso de ambiente de prueba no está en la barra y sigue en el pie de la cara pública, donde se inicia sesión y se crea la cuenta',
      !/Ambiente de prueba/.test(barra) && /Ambiente de prueba: usá solo datos sintéticos\. No ingreses datos reales de personas\./.test(pie),
      `barra: «${barra.slice(0, 60)}» · pie: «${pie.slice(0, 170)}»`,
    );
  } finally {
    await navegador.close();
  }
}

// ─── Capturas: cinco anchos, dos temas y las tres vistas ───────────────────────────────────────

async function capturas() {
  const { navegador, page, v } = await abrir();
  try {
    await iniciarSesion(page, v, estado.proCorreo, FICHA_A);
    await quieto(page, v);
    for (const tema of ['azul-noche', 'claro']) {
      await ponerTema(page, tema);
      await pausa(300);
      for (const ancho of [1440, 1280, 1024, 768, 390]) {
        await page.setViewport({ width: ancho, height: 900 });
        for (const [vista, url] of [
          ['resumen', FICHA_A],
          ['linea', `${FICHA_A}&vista=linea`],
          ['analizar', `${FICHA_A}&vista=analizar&m=${encodeURIComponent(TRES)}`],
        ]) {
          await cupo(v);
          await ir(page, url);
          await quieto(page, v);
          await page.evaluate(() => window.scrollTo(0, 0));
          const c = await captura(page, v, `${vista}-${ancho}-${tema}`);
          const pestanas = await page.evaluate(() => document.querySelectorAll('nav[aria-label="Vistas del seguimiento"] a').length);
          // El período: un solo control que, abierto, ofrece los cuatro atajos y el rango propio sin salirse de la ventana.
          const periodo = await mirarPeriodo(page);
          comprobar(
            'PRO-23',
            `${vista} a ${ancho} px en ${tema}: sin desborde de costado, con las tres vistas y el período (cuatro atajos y un rango propio, a un clic)`,
            (await sinDesborde(page)) && pestanas === 3 && periodo.boton === 1 && periodo.atajos === 4 && periodo.fechas === 2 && periodo.entra && periodo.cierra,
            JSON.stringify({ pestanas, ...periodo }),
          );
          if (vista === 'analizar') comprobar('PRO-08', `La captura de analizar a ${ancho} px en ${tema} tiene los tres gráficos dibujados (y siguen después)`, c.figuras === 3 && c.dibujadas === 3 && c.despues === 3, `${c.dibujadas} de ${c.figuras} dibujados; ${c.despues} después`);
        }
        // En escritorio, los tres modos, comprobados en el dibujo y en píxeles, y capturados (revisión de #153, hallazgo 1).
        if (ancho >= 1280) {
          await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent(TRES)}`);
          await quieto(page, v);
          await comprobarGraficos(page, 'PRO-08', `Separadas a ${ancho} px en ${tema}: los tres dibujados y a la vista`, { figuras: 3, colores: [[1], [2], [3]] });
          for (const [modo, letra, opciones] of [
            ['superpuestas', 'S', { figuras: 1, curvas: 2, colores: [[1, 2]] }],
            ['relativo', 'R', { figuras: 1, curvas: 2, banda: true, colores: [[1, 2]] }],
          ]) {
            await cupo(v);
            await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent('nutricion.proteinas,nutricion.carbohidratos')}&modo=${letra}`);
            await quieto(page, v);
            await comprobarGraficos(page, 'PRO-08', `${modo === 'relativo' ? 'Cambio relativo' : 'Juntas'} a ${ancho} px en ${tema}: dibujado y a la vista`, opciones);
            await page.evaluate(() => window.scrollTo(0, 0));
            const c = await captura(page, v, `analizar-${modo}-${ancho}-${tema}`);
            comprobar('PRO-08', `La captura analizar-${modo}-${ancho}-${tema} tiene el gráfico dibujado`, c.figuras === 1 && c.dibujadas === 1 && c.despues === 1, `${c.dibujadas} de ${c.figuras}`);
          }
        }
      }
    }
    // El registro original abierto, en el teléfono y en claro (el último tema).
    await page.setViewport({ width: 390, height: 900 });
    await ir(page, `${FICHA_A}&vista=linea`);
    await quieto(page, v);
    await clic(page, '.entrada button', 'Abrir registro');
    await page.waitForSelector('dialog[open]');
    await quieto(page, v);
    await page.screenshot({ path: fileURLToPath(new URL('registro-390-claro.png', DIR)) });
  } finally {
    await navegador.close();
  }
}

// ─── Escenario descartable: valores estimados y revocación desde la interfaz (revisión de #153, hallazgo 5) ─────────

/**
 * Con las cuentas descartables (`datos/generar.mjs descartable-cuentas` y `descartable-datos`): el profesional ve el peso
 * (medido, informado por la persona y medido) y el IMC (estimado por un método) en los dos temas; la lectura, la tabla y el
 * CSV dicen la clase. Después el asesorado revoca desde su web el acceso de Antropometría y, con la pantalla del
 * profesional todavía abierta, cada consulta nueva (el origen de un punto, la exportación, los gráficos) ya no da nada.
 */
async function descartable() {
  const d = estado.descartable;
  if (!d?.datos) throw new Error('falta el escenario descartable: datos/generar.mjs descartable-cuentas y descartable-datos');
  const FICHA_D = `/pro/advisees?id=${d.aseId}`;
  const URL_D = `${FICHA_D}&vista=analizar&m=${encodeURIComponent('antropometria.peso,antropometria.imc')}`;
  const pro = await abrir();
  try {
    await iniciarSesion(pro.page, pro.v, d.proCorreo, FICHA_D);
    await quieto(pro.page, pro.v);
    for (const tema of ['claro', 'azul-noche']) {
      await ponerTema(pro.page, tema);
      await pausa(300);
      await ir(pro.page, URL_D);
      await quieto(pro.page, pro.v);
      const { d: dib } = await comprobarGraficos(pro.page, 'PRO-10', `Peso e IMC en ${tema}: los dos gráficos dibujados y a la vista`, { figuras: 2, colores: [[1], [2]] });
      await laMedicionDetectaUnGraficoVacio(pro.page, 'PRO-10', `En ${tema}, con las series ocultas la medición de píxeles no da por dibujado ningún gráfico (prueba de la prueba)`, [[1], [2]]);
      const leyenda = await texto(pro.page, '.leyenda');
      comprobar(
        'PRO-10',
        `En ${tema}, lo reportado y lo calculado se dibujan distinto (contorno cortado en el peso reportado, un punto adentro en el IMC) y la leyenda lo dice`,
        dib[0]?.clases.includes('REPORTED') && !dib[0]?.clases.includes('DERIVED') && dib[1]?.clases.includes('DERIVED') && /Contorno cortado: reportado por la persona, no medido/.test(leyenda) && /Con un punto adentro: calculado por un método/.test(leyenda) && !/\(estimación\)/.test(leyenda),
        `peso: ${dib[0]?.clases.join(',') || 'sin clase'}; IMC: ${dib[1]?.clases.join(',') || 'sin clase'} · ${leyenda.slice(0, 170)}`,
      );
      const c = await captura(pro.page, pro.v, `analizar-clases-1440-${tema}`);
      comprobar('PRO-10', `La captura analizar-clases-1440-${tema} tiene los dos gráficos dibujados`, c.figuras === 2 && c.dibujadas === 2 && c.despues === 2, `${c.dibujadas} de ${c.figuras}`);
    }
    await ir(pro.page, `${URL_D}&f=${d.fechas.informada}`);
    await quieto(pro.page, pro.v);
    const lectura = await texto(pro.page, '.panel-de-lectura');
    comprobar('PRO-10', 'La lectura del día de la toma reportada dice «Reportado por la persona, no medido»', /80,5 kg/.test(lectura) && /Clase de dato: Reportado por la persona, no medido/.test(lectura), lectura.slice(0, 220));
    await abrirDelPie(pro.page, 'Tabla de datos', '.tabla-de-datos');
    const tabla = await texto(pro.page, '.tabla-de-datos');
    // WP-DASHBOARD-COMPRENSION: calculado no es siempre estimado; el IMC es un índice y la tabla lo dice.
    comprobar('PRO-10', 'La tabla de datos marca el peso reportado y el IMC calculado (un índice, no una estimación); lo medido va sin marca', /80,5 kg \(reportado por la persona, no medido\)/.test(tabla) && /\(calculado: un índice calculado sobre medidas, no una estimación\)/.test(tabla) && /81,2 kg(?! \()/.test(tabla), tabla.slice(0, 260));
    await abrirMasAcciones(pro.page);
    await clic(pro.page, 'button', 'Descargar los datos (CSV)');
    const { archivo, csv } = await esperarCsv();
    const lineasCsv = csv.split('\r\n');
    const filasCsv = lineasCsv.slice(lineasCsv.findIndex((l) => l.startsWith('Métrica;Unidad;Método')) + 1).filter((l) => l.length > 0).map((l) => l.split(';'));
    // Los valores, con los decimales fijos de cada métrica en el archivo (el IMC, con dos: «25,60»).
    const porClase = (texto) => filasCsv.filter((x) => x[16] === texto).map((x) => x[6]).sort();
    comprobar(
      'PRO-10',
      'El CSV tiene la columna «Clase de dato»: medido, reportado por la persona y calculado por un método',
      archivo &&
        porClase('Medido').join(' ') === '79,9 81,2' &&
        porClase('Reportado por la persona, no medido').join(' ') === '80,5' &&
        filasCsv.filter((x) => x[16].startsWith('Calculado: un índice calculado sobre medidas, no una estimación')).map((x) => x[6]).sort().join(' ') === d.imc.map((c) => c.valor.toFixed(2).replace('.', ',')).sort().join(' '),
      `${archivo} · ${filasCsv.map((x) => `${x[6]}: ${x[16]}`).join(' · ')}`,
    );
    await clic(pro.page, '.panel-de-lectura button', 'Ver origen');
    await pro.page.waitForSelector('dialog[open]');
    await quieto(pro.page, pro.v);
    const origenAntes = await texto(pro.page, 'dialog[open]');
    await clic(pro.page, 'dialog[open] button', 'Cerrar');
    await pro.page.waitForFunction(() => !document.querySelector('dialog[open]'));
    comprobar('PRO-10', 'Antes de revocar, el origen del peso reportado abre su toma, con la clase de cada medición («Reportado», la palabra de la pestaña de Antropometría)', /Toma del/.test(origenAntes) && /Peso\s+80,5 kg\s+Reportado/.test(origenAntes), origenAntes.slice(0, 260));

    // Una segunda pantalla del profesional, cargada antes de revocar: ahí se prueba la exportación con datos viejos en
    // pantalla (en la primera, la consulta del origen ya vuelve a pedir los gráficos y el botón de descarga se va).
    const pro2 = await abrir();
    await iniciarSesion(pro2.page, pro2.v, d.proCorreo, FICHA_D);
    await quieto(pro2.page, pro2.v);
    await ir(pro2.page, URL_D);
    await quieto(pro2.page, pro2.v);
    const graficosAntes = await pro2.page.$$eval('figure.grafico__figura', (g) => g.length);

    // El asesorado, desde su web y en su propio navegador, revoca el acceso de Antropometría.
    const ase = await abrir();
    try {
      await iniciarSesion(ase.page, ase.v, d.aseCorreo, `/account/relationships/detail?id=${d.vinculos.ANTROPOMETRIA}`);
      await quieto(ase.page, ase.v);
      const antes = await texto(ase.page, 'main');
      await clic(ase.page, 'button', `Revocar acceso de ${d.profesional}`);
      await ase.page.waitForSelector('dialog[open]');
      const explicacion = await texto(ase.page, 'dialog[open]');
      await clic(ase.page, 'dialog[open] button', 'Revocar acceso');
      await ase.page.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 30_000 });
      await quieto(ase.page, ase.v);
      const despues = await texto(ase.page, 'body');
      comprobar(
        'PRO-20',
        'El asesorado revoca desde su web el acceso de Antropometría del profesional: explicación, confirmación y aviso',
        /Antropometr/i.test(antes) && explicacion.length > 40 && /Acceso revocado/.test(despues),
        `${explicacion.slice(0, 120)} · ${/Acceso revocado[^.]*\./.exec(despues)?.[0] ?? 'sin aviso'}`,
      );
      await captura(ase.page, ase.v, 'revocacion-asesorado-1440');
    } finally {
      await ase.navegador.close();
    }

    // El profesional, con las pantallas de antes todavía abiertas: cada consulta nueva decide con el acceso de ahora.
    // a) La exportación vuelve a preguntar antes de armar el archivo: no sale ninguno, y lo dice.
    try {
      const antes = fs.readdirSync(DESCARGAS).filter((x) => x.endsWith('.csv'));
      await abrirMasAcciones(pro2.page);
      await clic(pro2.page, 'button', 'Descargar los datos (CSV)');
      await pro2.page.waitForFunction(() => /No se descargó ningún archivo|Descargado:/.test(document.querySelector('.exportar')?.innerText ?? ''), { timeout: 20_000 }).catch(() => {});
      const aviso = await texto(pro2.page, '.exportar');
      await pausa(1500);
      const nuevos = fs.readdirSync(DESCARGAS).filter((x) => x.endsWith('.csv') && !antes.includes(x));
      await quieto(pro2.page, pro2.v);
      const despuesDeExportar = await texto(pro2.page, '.analizar__lienzo');
      comprobar(
        'PRO-20',
        'Después de revocar, «Descargar los datos» con la pantalla vieja vuelve a consultar: no sale ningún archivo y dice por qué; los gráficos se vuelven a pedir',
        graficosAntes === 2 && nuevos.length === 0 && /No se descargó ningún archivo/.test(aviso) && /no está disponible con tu acceso actual/.test(aviso) && (await pro2.page.$$eval('figure.grafico__figura', (g) => g.length)) === 0 && /no está disponible con tu acceso actual/.test(despuesDeExportar),
        `${graficosAntes} gráficos antes · ${nuevos.length} archivo(s) nuevo(s) · aviso: ${aviso.slice(0, 160)}`,
      );
      await captura(pro2.page, pro2.v, 'revocado-exportacion-1440');
    } finally {
      await pro2.navegador.close();
    }
    // b) El origen de un punto que seguía en pantalla: ya no se muestra, y los gráficos se vuelven a pedir.
    await clic(pro.page, '.panel-de-lectura button', 'Ver origen');
    await pro.page.waitForSelector('dialog[open]');
    await quieto(pro.page, pro.v);
    const origenDespues = await texto(pro.page, 'dialog[open]');
    comprobar('PRO-20', 'Después de revocar, el origen de un punto que seguía en pantalla dice «no está disponible con tu acceso actual» y no repite el valor', /no está disponible con tu acceso actual/.test(origenDespues) && !/80,5|81,2/.test(origenDespues), origenDespues.slice(0, 200));
    await clic(pro.page, 'dialog[open] button', 'Cerrar');
    await pro.page.waitForFunction(() => !document.querySelector('dialog[open]'));
    await quieto(pro.page, pro.v);
    const lienzoTrasElOrigen = await texto(pro.page, '.analizar__lienzo');
    comprobar(
      'PRO-20',
      'Los gráficos se vuelven a pedir y dicen «no está disponible con tu acceso actual», sin un punto ni un valor de antes',
      (await pro.page.$$eval('figure.grafico__figura', (g) => g.length)) === 0 && (lienzoTrasElOrigen.match(/no está disponible con tu acceso actual/g) ?? []).length === 2 && !/80,5|81,2|25,6/.test(await texto(pro.page, 'main')),
      lienzoTrasElOrigen.slice(0, 220),
    );
    // c) Una consulta nueva desde cero (abrir Analizar otra vez): lo mismo, y la línea de tiempo no trae tomas.
    await ir(pro.page, URL_D);
    await quieto(pro.page, pro.v);
    const reabierto = await texto(pro.page, '.analizar__lienzo');
    // La descarga de antes de revocar ya no se anuncia: «Descargado» hablaría de datos que no están en pantalla.
    const avisoViejo = /Descargado:/.test(await texto(pro.page, 'main'));
    await captura(pro.page, pro.v, 'revocado-analizar-1440-azul-noche');
    await ir(pro.page, `${FICHA_D}&vista=linea`);
    await quieto(pro.page, pro.v);
    const entradasDeLaLinea = await textos(pro.page, '.entrada');
    const pestanas = await textos(pro.page, 'nav[aria-label="Vistas del seguimiento"] a');
    comprobar(
      'PRO-20',
      'Al volver a abrir Analizar y la línea de tiempo, no hay gráficos, valores ni tomas de Antropometría, ni el aviso de una descarga anterior; el resto del vínculo sigue',
      (reabierto.match(/no está disponible con tu acceso actual/g) ?? []).length === 2 && !avisoViejo && !entradasDeLaLinea.some((e) => /Toma|kg/.test(e)) && pestanas.length === 3,
      `${reabierto.slice(0, 140)} · aviso de una descarga anterior: ${avisoViejo ? 'sí' : 'no'} · ${entradasDeLaLinea.length} entrada(s) en la línea de tiempo, ninguna de Antropometría`,
    );
  } finally {
    await pro.navegador.close();
  }
}

// ─── Principal ────────────────────────────────────────────────────────────────────────────────

const inicio = new Date();
try {
  if (modo === 'funcional' || modo === 'todo') await funcional();
  if (modo === 'capturas' || modo === 'todo') await capturas();
  if (modo === 'descartable') await descartable();
  if (modo === 'menu') await encabezadoYMenu();
  if (modo === 'analizar') await analizarRecompuesto();
} catch (e) {
  comprobar('—', 'El recorrido terminó por una excepción', false, e instanceof Error ? e.message : String(e));
} finally {
  const fallas = resultados.filter((r) => !r.ok);
  fs.writeFileSync(new URL(`resultado-${modo}.json`, DIR), JSON.stringify({ modo, inicio: inicio.toISOString(), fin: new Date().toISOString(), hoy, total: resultados.length, fallas: fallas.length, resultados }, null, 2));
  console.log(`\n${resultados.length - fallas.length}/${resultados.length} comprobaciones bien${fallas.length ? `; fallan: ${fallas.map((f) => f.pro).join(', ')}` : ''}`);
  process.exitCode = fallas.length ? 1 : 0;
}
