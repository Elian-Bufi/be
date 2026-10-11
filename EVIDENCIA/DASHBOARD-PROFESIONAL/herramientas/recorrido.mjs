// Recorrido real del entorno profesional (encargo §18; ACEPTACION.md): Chrome contra la web y la API locales, con los datos
// sintéticos de `datos/regenerar.sh`. Interactúa con los controles y comprueba resultados; las capturas complementan.
//
// Uso: node recorrido.mjs [funcional|capturas|todo|descartable|menu|analizar|resumen]   (lee trabajo/estado.json; escribe trabajo/recorrido/)
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
// - El Resumen por área (WP-ESCRITORIO-AMABLE, parte 3) y la composición de Analizar con el lenguaje de sus gráficos
//   (parte 2) se comprueban en `resumenPorArea` y `analizarRecompuesto`, las dos en una misma sesión propia
//   (`fichaRecompuesta`), antes del encabezado. `resumen` y `analizar` corren una sola de las dos partes.
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
/** El escenario E (una sola área, sin revisiones), si el juego de datos lo tiene. */
const FICHA_E = estado.escenarioE?.aseEId ? `/pro/advisees?id=${estado.escenarioE.aseEId}` : null;
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
    // WP-ESCRITORIO-AMABLE (parte 3, E-53): los indicadores por defecto son calorías y proteínas registradas, la carga
    // de la primera serie del ejercicio más registrado y el peso, en el orden de las áreas (antes: energía, registros,
    // peso y series registradas). Cada uno dice su unidad, su regla y su cobertura; el peso, la fecha de su última toma.
    comprobar(
      'PRO-02',
      'Cuatro indicadores con unidad, regla, fecha y cobertura',
      ind.length === 4 &&
        /kcal por día/.test(ind[0]) && /Media de los días con valor/.test(ind[0]) && /\d+ días: \d+ con valor/.test(ind[0]) &&
        /g por día/.test(ind[1]) && /Media de los días con valor/.test(ind[1]) &&
        /kg/.test(ind[2]) && /Mediana de las sesiones/.test(ind[2]) && /\d+ sesiones?: \d+ con valor/.test(ind[2]) &&
        /kg/.test(ind[3]) && /Última toma: \d/.test(ind[3]) && /\d+ tomas?/.test(ind[3]),
      ind.join(' | '),
    );
    // WP-DASHBOARD-COMPRENSION (pasada del 2026-10-09): la cobertura de los indicadores es la misma de las tablas
    // (`partesDeLaCobertura`): «hoy, en curso: fuera de la media» y «de ellos, N son subtotales (falta algún dato)».
    comprobar('PRO-11', 'La media de calorías no cuenta el día en curso y dice sus subtotales', /hoy, en curso: fuera de la media/.test(ind[0]) && /subtotal/.test(ind[0]), ind[0]);
    comprobar('PRO-15', 'El peso compara solo dentro de su tramo comparable', /tomas comparables|no hay con qué comparar/.test(ind[3]), ind[3]);
    // La cobertura del área está en su tarjeta, plegada cuando el área tiene una revisión (E-51): se abre y se lee. La
    // frase es la del dominio («80 de 90 días con algún registro»; antes la pantalla la escribía «80 días de 90…»). El
    // «sin porcentajes» se mira ahora sobre todo el Resumen, con la cobertura abierta.
    await abrirDetalles(page, '.area[data-area="NUTRICION"] details.area__periodo');
    const cob = await texto(page, '.area[data-area="NUTRICION"] .observacion[data-regla="COBERTURA_NUTRICIONAL"]');
    const todoElResumen = await texto(page, 'main');
    comprobar('PRO-12', 'La cobertura por área dice su denominador y el Resumen no da porcentajes', /\d+ de \d+ días con algún registro/.test(cob) && /\d+ registros?: \d+ con cantidades y \d+ sin cantidades/.test(cob) && todoElResumen.length > 400 && !/%/.test(todoElResumen), cob.slice(0, 220));
    a11y.resumen = await axe(page);

    // 2 · Línea de tiempo ───────────────────────────────────────────────────────────────────────
    await cupo(v);
    await clic(page, 'nav[aria-label="Vistas del seguimiento"] a', 'Línea de tiempo');
    await quieto(page, v);
    const p1 = parametros(page);
    comprobar('PRO-01', 'La línea de tiempo conserva el asesorado y el período', p1.get('id') === estado.aseId && p1.get('vista') === 'linea' && p1.get('p') === null);
    // WP-ESCRITORIO-AMABLE (parte 3): «Lo último que pasó» ya no se repite en el Resumen: es esta pestaña, a un clic.
    // Lo que protegía esa comprobación (los últimos hechos del período, a mano) se mira acá: hay al menos seis.
    comprobar('PRO-02', 'Los últimos hechos del período están a un clic del Resumen: la línea de tiempo muestra al menos seis', (await page.$$eval('.entrada', (e) => e.length)) >= 6);
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
    // La negativa («nada del anterior») va con sus positivas: B tiene indicadores y tarjetas propios, leídos con los
    // mismos selectores. Sin ellas, un selector que no encuentra nada la daría por buena (WP-ESCRITORIO-AMABLE, parte 3).
    const deB = await page.evaluate(() => ({
      titulo: document.querySelector('#titulo-asesorado')?.textContent ?? '',
      indicadores: [...document.querySelectorAll('.indicador')].map((e) => e.innerText.replace(/\s+/g, ' ')),
      tarjetas: [...document.querySelectorAll('.area')].map((e) => e.dataset.area),
      enLasTarjetas: [...document.querySelectorAll('.area')].map((e) => e.innerText.replace(/\s+/g, ' ')).join(' | '),
    }));
    comprobar(
      'PRO-21',
      'Al cambiar de asesorado durante una respuesta lenta, no aparece nada del anterior: ni sus ejercicios en los indicadores, ni su tarjeta de Entrenamiento',
      deB.indicadores.length > 0 && !deB.indicadores.some((t) => /Peso muerto|Sentadilla/.test(t)) && deB.tarjetas.length > 0 && !deB.tarjetas.includes('ENTRENAMIENTO') && !/sesi[oó]n|Entrenamiento/.test(deB.enLasTarjetas) && parametros(page).get('id') === estado.aseBId,
      `${deB.titulo} · tarjetas: ${deB.tarjetas.join(', ')} · ${deB.indicadores.join(' | ')}`,
    );

    // 5 · Vista parcial (asesorado B) ─────────────────────────────────────────────────────────
    const parcialB = await texto(page, 'main');
    comprobar('PRO-20', 'Asesorado B: un solo aviso de vista parcial, sin nombrar lo oculto', /Vista parcial según tu acceso actual/.test(parcialB));
    await ir(page, `${FICHA_B}&vista=analizar`);
    await quieto(page, v);
    // WP-ESCRITORIO-AMABLE (C-19): las métricas para comparar están a la vista en la entrada de Analizar, un grupo por área.
    const areasB = await page.$$eval('.elegir-metricas .grupo-de-metricas__titulo', (t) => t.map((x) => x.textContent.trim()));
    comprobar('PRO-20', 'Asesorado B: la entrada de Analizar ofrece solo las áreas permitidas', areasB.length > 0 && !areasB.includes('Entrenamiento'), areasB.join(', '));

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
    // WP-ESCRITORIO-AMABLE (parte 3): la negativa miraba un texto de «Analizar» («No hay datos de ninguna área»), que el
    // Resumen nunca escribe. Ahora niega los «sin datos» del propio Resumen, y pide además que cada tarjeta diga qué
    // parte no pudo completar: una falla nunca es ausencia de datos, ni en los indicadores ni en las tarjetas.
    comprobar(
      'PRO-21',
      'Sin red, el Resumen dice «no hay conexión con BE» y qué parte no se pudo completar, y no muestra ceros ni «sin datos»',
      /no hay conexión con BE/.test(sinRed) && /No pudimos completar esta parte \(la cobertura del período\)/.test(sinRed) && !/Sin indicadores con datos|Sin registros en este período|Sin datos en el período|Sin registros de comida en el período/.test(sinRed) && !/\b0 (kcal|g|kg|registros)\b/.test(sinRed),
      sinRed.slice(0, 260),
    );
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
      // En la entrada de Analizar, cada vista guardada es una etiqueta que la abre (WP-ESCRITORIO-AMABLE, C-19).
      await page.waitForFunction((n) => document.querySelector('.vistas-para-retomar')?.textContent.includes(n), {}, VISTA);
      await clic(page, '.vistas-para-retomar button', `Abrir ${VISTA}`);
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
  await fichaRecompuesta();
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

// ─── Analizar, recompuesto (WP-ESCRITORIO-AMABLE, parte 2: E-24 a E-47) ───────────────────────────────

/**
 * La composición de Analizar, el lenguaje de sus gráficos, la entrada («¿Qué querés mirar?»), el estado de cada métrica
 * en el lugar de su gráfico y la ayuda de la vista. Lo esperado (el objetivo de calorías, los días sin
 * registros, las etapas y los cortes) se calcula a mano con lo que devuelve la API, sin el dominio. Cada comprobación
 * negativa («no lleva…») mira con el mismo selector que una positiva de la misma pantalla: con el selector mal, la
 * positiva fallaría. Corre en la sesión de `fichaRecompuesta`, después de la parte del Resumen; sola, con
 * `node recorrido.mjs analizar`.
 */
async function analizarRecompuesto(page, v) {
  {
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

    // E-41 a E-44 · La entrada: «¿Qué querés mirar?» (C-19) ───────────────────────────────────────────────────
    // Lo esperado, a mano: lo que la API dice que hay en el período, en el orden en que la entrada lo ofrece (los
    // ejercicios, por sesiones; las medidas, por tomas; las cuatro más medidas, a la vista).
    const ejercicios = [...(await leerApi(v, `/advisees/${estado.aseId}/projections/TRAINING_PROGRESSION_BY_EXERCISE?periodStart=${desde90}&periodEnd=${hoy}`)).data.result.exercises].sort((a, b) => b.sessions - a.sessions);
    const medidas = [...(await leerApi(v, `/advisees/${estado.aseId}/projections/ANTHROPOMETRY_LONGITUDINAL?periodStart=${desde90}&periodEnd=${hoy}`)).data.result.available].sort((a, b) => b.observations - a.observations);
    const primero = ejercicios[0];
    const cargaEsperada = primero ? `Carga · ${primero.name} · serie ${primero.setNumbers.includes(1) ? 1 : primero.setNumbers[0]} (${primero.loadUnits.includes('kg') ? 'kg' : primero.loadUnits[0]})` : '';
    await abrirAnalisis('p=90');
    const leerEntrada = () =>
      page.evaluate(() => {
        const limpio = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
        const tarjetas = [...document.querySelectorAll('.entrada-de-analizar .tarjeta-de-entrada')];
        const cajas = tarjetas.map((t) => t.getBoundingClientRect());
        const ver = [...document.querySelectorAll('.elegir-metricas__pie button')].find((b) => b.textContent.includes('Ver los gráficos'));
        const casillas = [...document.querySelectorAll('.elegir-metricas .casilla-de-metrica input')];
        return {
          titulo: limpio(document.querySelector('.pregunta-en-curso h2')),
          tarjetas: tarjetas.map((t) => limpio(t.querySelector('h3'))),
          alCostado: cajas.length === 3 && cajas[2].left > cajas[0].right - 1 && Math.abs(cajas[2].top - cajas[0].top) <= 2,
          preguntas: document.querySelectorAll('.preguntas-profesionales > .preguntas-profesionales__lista .tarjeta-de-pregunta').length,
          masPreguntas: limpio(document.querySelector('.preguntas-profesionales__mas > summary')),
          grupos: [...document.querySelectorAll('.elegir-metricas .grupo-de-metricas')].map((g) => ({
            titulo: limpio(g.querySelector('.grupo-de-metricas__titulo')),
            aLaVista: [...g.querySelectorAll(':scope > .grupo-de-metricas__casillas .casilla-de-metrica > span:not(.casilla-de-metrica__detalle)')].map(limpio),
            mas: limpio(g.querySelector('.grupo-de-metricas__mas > summary')) || null,
            ejercicio: g.querySelector('select[id$="-ej"]') ? limpio(g.querySelector('select[id$="-ej"]').selectedOptions[0]) : null,
          })),
          cupo: limpio(document.querySelector('.elegir-metricas__cupo')),
          marcadas: casillas.filter((c) => c.checked).length,
          sinMarcarApagadas: casillas.filter((c) => !c.checked).every((c) => c.disabled),
          sinMarcarEncendidas: casillas.filter((c) => !c.checked).every((c) => !c.disabled),
          verApagado: ver ? ver.disabled : null,
          finDeVer: ver ? Math.round(ver.getBoundingClientRect().bottom + scrollY) : null,
          graficos: document.querySelectorAll('figure.grafico__figura').length,
        };
      });
    const entrada = await leerEntrada();
    const gruposEsperados = [
      { titulo: 'Nutrición', aLaVista: ['Calorías', 'Carbohidratos', 'Grasas', 'Proteínas', 'Fibra', 'Registros'], mas: null },
      { titulo: 'Entrenamiento', aLaVista: ['Carga', 'Repeticiones', 'RIR', 'Series registradas'], mas: null },
      { titulo: 'Antropometría', aLaVista: medidas.slice(0, 4).map((m) => m.name), mas: medidas.length > 4 ? `Más medidas (${medidas.length - 4})` : null },
    ];
    comprobar(
      'E-41',
      'La entrada de Analizar se llama «¿Qué querés mirar?» y tiene los dos caminos a la vista: las cuatro preguntas (y «Más preguntas») con las vistas guardadas debajo, y al costado las métricas para comparar, sin ningún gráfico todavía',
      entrada.titulo === '¿Qué querés mirar?' &&
        entrada.tarjetas.join(' | ') === 'Empezar por una pregunta | Retomar una vista guardada | Comparar métricas, sin pregunta' &&
        entrada.alCostado &&
        entrada.preguntas === 4 &&
        entrada.masPreguntas === 'Más preguntas (2)' &&
        entrada.graficos === 0,
      JSON.stringify({ titulo: entrada.titulo, tarjetas: entrada.tarjetas, alCostado: entrada.alCostado, preguntas: entrada.preguntas, masPreguntas: entrada.masPreguntas, finDeVer: entrada.finDeVer }),
    );
    comprobar(
      'E-41',
      'Las métricas se ofrecen por área, con lo que la API dice que hay en el período: las seis de Nutrición en su orden, las cuatro de Entrenamiento con el ejercicio más registrado elegido a la vista, y las cuatro medidas corporales con más tomas (las demás, en «Más medidas»)',
      primero !== undefined &&
        medidas.length > 0 &&
        entrada.grupos.length === 3 &&
        entrada.grupos.every((g, i) => g.titulo === gruposEsperados[i].titulo && g.aLaVista.join(' | ') === gruposEsperados[i].aLaVista.join(' | ') && g.mas === gruposEsperados[i].mas) &&
        entrada.grupos[1].ejercicio.startsWith(`${primero.name} · ${primero.sessions} `) &&
        entrada.cupo === 'Elegiste 0 de 3. Marcá al menos una.' &&
        entrada.verApagado === true,
      `API: ${ejercicios.length} ejercicios (el primero, ${primero?.name}, ${primero?.sessions} sesiones); medidas: ${medidas.map((m) => `${m.name} ${m.observations}`).join(', ')} · pantalla: ${JSON.stringify(entrada.grupos)} · ${entrada.cupo}`,
    );
    // Hasta tres: la cuarta no se puede marcar, y se dice por qué. El orden en que se marcan es el de los gráficos.
    const marcar = (texto) => clic(page, '.elegir-metricas .casilla-de-metrica', texto);
    await marcar('Proteínas');
    await marcar(medidas[0].name);
    await marcar('Calorías');
    const conTres = await leerEntrada();
    await marcar(medidas[0].name);
    const conDos = await leerEntrada();
    await marcar('Carga');
    const conCarga = await leerEntrada();
    comprobar(
      'E-42',
      'Con tres métricas marcadas, las demás casillas quedan apagadas y el pie dice cuáles son y que para sumar otra hay que sacar una; al sacar una se vuelven a poder marcar. Una de Entrenamiento se nombra con su ejercicio, su serie y su unidad',
      conTres.marcadas === 3 &&
        conTres.sinMarcarApagadas &&
        conTres.cupo === `Elegiste 3 de 3: Proteínas; ${medidas[0].name}; Calorías. Para sumar otra, sacá una.` &&
        conDos.marcadas === 2 &&
        conDos.sinMarcarEncendidas &&
        conDos.cupo === 'Elegiste 2 de 3: Proteínas; Calorías.' &&
        conCarga.cupo === `Elegiste 3 de 3: Proteínas; Calorías; ${cargaEsperada}. Para sumar otra, sacá una.` &&
        conCarga.verApagado === false,
      `con tres: ${conTres.cupo} · con dos: ${conDos.cupo} · con la carga: ${conCarga.cupo}`,
    );
    await clic(page, '.elegir-metricas__pie button', 'Ver los gráficos');
    await quieto(page, v);
    const armado = await page.evaluate(() => ({
      titulo: document.querySelector('.pregunta-en-curso h2')?.textContent.trim() ?? '',
      etiquetas: [...document.querySelectorAll('.metricas-elegidas--amable li > span')].map((s) => s.textContent.trim()),
      lugares: document.querySelectorAll('.paneles-sincronizados > *').length,
      entrada: !!document.querySelector('.entrada-de-analizar'),
    }));
    const mArmado = parametros(page).get('m') ?? '';
    comprobar(
      'E-41',
      '«Ver los gráficos» arma la comparación libre con las tres métricas, en el orden en que se marcaron, y recién ahí las escribe en la URL',
      armado.titulo === 'Comparación libre' &&
        armado.etiquetas.join(' | ') === `Proteínas | Calorías | ${cargaEsperada}` &&
        armado.lugares === 3 &&
        !armado.entrada &&
        mArmado.split(',').length === 3 &&
        mArmado.startsWith('nutricion.proteinas,nutricion.energia,entrenamiento.carga') &&
        parametros(page).get('pregunta') === null,
      `${JSON.stringify(armado)} · m=${mArmado}`,
    );
    // Quitar la última métrica de una comparación libre vuelve a la entrada.
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => document.querySelector('.metricas-elegidas--amable .quitar-metrica')?.click());
      await quieto(page, v, { silencio: 300 });
    }
    const deVuelta = await leerEntrada();
    comprobar('E-41', 'Al quitar la última métrica de una comparación libre, Analizar vuelve a la entrada, con nada marcado', deVuelta.titulo === '¿Qué querés mirar?' && deVuelta.grupos.length === 3 && deVuelta.marcadas === 0 && parametros(page).get('m') === null, `${deVuelta.titulo} · ${deVuelta.cupo} · m=${parametros(page).get('m')}`);

    // E-45 y E-46 · El estado de cada métrica, en el lugar de su gráfico (pantalla 15) ─────────────────────────
    const lugares = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('.tarjeta-de-graficos .paneles-sincronizados > *, .tarjeta-de-graficos > .grafico--sin-dibujo')].map((e) => ({
          grafico: e.matches('figure.grafico__figura'),
          nombre: e.querySelector('.grafico__titulo strong')?.textContent.trim() ?? '',
          clase: [...(e.querySelector('.estado-de-grafico')?.classList ?? [])].find((c) => c.startsWith('estado-de-grafico--')) ?? null,
          titulo: e.querySelector('.estado-de-grafico__titulo')?.textContent.trim() ?? null,
          texto: e.querySelector('.estado-de-grafico .nota')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
          reintentar: !!e.querySelector('.estado-de-grafico button'),
          fechas: e.querySelectorAll('.recharts-xAxis-tick-labels text').length,
        })),
      );
    // Una falla (503) en la serie del medio: su bloque queda entre los dos gráficos, con el motivo y «Reintentar».
    const malasAntes = v.malas.length;
    v.reglas = [{ coincide: (u) => u.includes('/projections/NUTRITION_PRESCRIBED_VS_RECORDED') && u.includes('metric=PROTEIN'), accion: 'responder', status: 503, codigo: 'DB_UNAVAILABLE' }];
    await abrirAnalisis(`m=${encodeURIComponent(TRES)}&p=90`);
    const conFalla = await lugares();
    const lecturaConFalla = await texto(page, '.tarjeta-de-lectura');
    v.reglas = [];
    // Las respuestas con error de este paso son las que el recorrido simuló: se apartan, para que la comprobación del
    // final (ninguna respuesta con error) siga valiendo para todo lo demás.
    const simuladas = v.malas.splice(malasAntes);
    await clic(page, '.analizar__lienzo .estado-de-grafico button', 'Reintentar');
    await quieto(page, v);
    const trasReintentar = await lugares();
    comprobar(
      'E-45',
      'Si falla una de tres métricas, su bloque queda en su lugar, entre los dos gráficos, con el nombre de la métrica, «No pudimos completar esta parte», el motivo y «Reintentar»; las fechas siguen bajo el último gráfico, y «Reintentar» trae el gráfico que faltaba',
      conFalla.length === 3 &&
        conFalla[0].grafico &&
        !conFalla[1].grafico &&
        conFalla[2].grafico &&
        conFalla[1].nombre === 'Proteínas' &&
        conFalla[1].clase === 'estado-de-grafico--error' &&
        conFalla[1].titulo === 'No pudimos completar esta parte' &&
        /BE no está disponible en este momento\. .*Las otras métricas siguen\./.test(conFalla[1].texto ?? '') &&
        conFalla[1].reintentar &&
        conFalla[0].fechas === 0 &&
        conFalla[2].fechas > 1 &&
        simuladas.length > 0 &&
        simuladas.every((m) => m.startsWith('503 ')) &&
        trasReintentar.length === 3 &&
        trasReintentar.every((l) => l.grafico),
      `${JSON.stringify(conFalla)} · respuestas simuladas: ${simuladas.length} (503) · después: ${trasReintentar.map((l) => (l.grafico ? 'gráfico' : 'bloque')).join(', ')} · lectura: ${lecturaConFalla.slice(0, 60)}`,
    );
    // Una respuesta lenta: mientras tanto, «Cargando…» en su lugar, y los otros dos ya dibujados.
    v.reglas = [{ coincide: (u) => u.includes('/projections/ANTHROPOMETRY_LONGITUDINAL') && u.includes('metric='), accion: 'demorar', ms: 3500 }];
    await cupo(v);
    await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent('nutricion.energia,antropometria.peso,nutricion.proteinas')}&p=30`);
    const llegoAVerse = await page.waitForFunction(() => document.querySelectorAll('figure.grafico__figura').length === 2 && !!document.querySelector('.estado-de-grafico--cargando'), { timeout: 15_000 }).then(() => true, () => false);
    const mientrasCarga = llegoAVerse ? await lugares() : [];
    v.reglas = [];
    await quieto(page, v);
    const yaCargado = await lugares();
    comprobar(
      'E-45',
      'Mientras una métrica tarda en llegar, las otras dos ya están dibujadas y la que falta dice «Cargando…» en su lugar (la del medio); cuando llega, es su gráfico',
      mientrasCarga.length === 3 && mientrasCarga[0].grafico && !mientrasCarga[1].grafico && mientrasCarga[2].grafico && mientrasCarga[1].nombre === 'Peso' && mientrasCarga[1].clase === 'estado-de-grafico--cargando' && mientrasCarga[1].texto === 'Cargando Peso…' && yaCargado.length === 3 && yaCargado.every((l) => l.grafico),
      `mientras: ${JSON.stringify(mientrasCarga.map((l) => (l.grafico ? `gráfico ${l.nombre}` : `${l.clase}: ${l.texto}`)))} · después: ${yaCargado.map((l) => (l.grafico ? 'gráfico' : 'bloque')).join(', ')}`,
    );
    // Fechas sin nada (antes del primer registro y de la primera toma): no es una falla ni un cero, y se dice.
    const primerRegistro = nut.recorded.points.map((p) => p.date).sort()[0];
    const primeraToma = peso.points.map((p) => p.date).sort()[0];
    const finSinNada = diaMenos([primerRegistro, primeraToma].sort()[0], 1);
    if (finSinNada >= desde90) {
      await abrirAnalisis(`m=${encodeURIComponent('nutricion.energia,antropometria.peso')}&desde=${desde90}&hasta=${finSinNada}`);
      const sinNada = await lugares();
      const lecturaSinNada = await texto(page, '.tarjeta-de-lectura');
      const tarjetaSinNada = await texto(page, '.tarjeta-de-graficos');
      const rango = `del ${diaCivil(desde90)} al ${diaCivil(finSinNada)}`;
      comprobar(
        'E-46',
        'En fechas sin registros ni tomas, cada métrica lo dice en su lugar («no es un cero»), sin gráfico vacío, sin «Reintentar» y sin presentarlo como una falla; la lectura dice para qué sirve',
        sinNada.length === 2 &&
          sinNada.every((l) => !l.grafico && l.clase === 'estado-de-grafico--sin-puntos' && !l.reintentar) &&
          sinNada[0].nombre === 'Calorías' &&
          sinNada[0].titulo === 'Sin registros de comida en estas fechas' &&
          sinNada[0].texto === `No es un cero: no hay registros de comida ${rango}. Probá con un período más largo.` &&
          sinNada[1].nombre === 'Peso' &&
          sinNada[1].titulo === 'Sin tomas en estas fechas' &&
          sinNada[1].texto === `No es un cero: no hay tomas registradas con esta medida ${rango}. Probá con un período más largo.` &&
          !/No pudimos/.test(tarjetaSinNada) &&
          /Cuando un gráfico tenga datos, elegí una fecha y sus valores se leen acá\./.test(lecturaSinNada),
        `${rango} · ${JSON.stringify(sinNada)} · lectura: ${lecturaSinNada}`,
      );
    } else {
      informar('E-46', 'Fechas sin registros ni tomas', 'el escenario tiene registros desde el primer día de los 90: no hay un rango vacío para probar');
    }

    // E-47 · «Cómo se lee esta vista» (C-04) ────────────────────────────────────────────────────────
    await abrirAnalisis(`m=${encodeURIComponent(TRES)}&p=90`);
    const marco = {};
    for (const ancho of [1440, 1280, 1024]) {
      await page.setViewport({ width: ancho, height: 900 });
      await pausa(500);
      marco[ancho] = await page.evaluate(() => {
        const b = document.querySelector('.marco-de-la-ficha .como-se-lee__boton');
        return { alto: Math.round(document.querySelector('.marco-de-la-ficha').getBoundingClientRect().height), boton: b ? b.textContent.replace(/\s+/g, ' ').trim() : null, anchoDelBoton: b ? Math.round(b.getBoundingClientRect().width) : 0, desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
    }
    await page.setViewport({ width: 1440, height: 900 });
    await pausa(500);
    await clic(page, '.marco-de-la-ficha button', 'Cómo se lee esta vista');
    await page.waitForSelector('dialog.como-se-lee[open]', { timeout: 5_000 });
    const ayuda = await page.evaluate(() => {
      const d = document.querySelector('dialog.como-se-lee[open]');
      return { titulo: d.querySelector('h2').textContent.trim(), renglones: d.querySelectorAll('.como-se-lee__lista > li').length, muestras: d.querySelectorAll('.como-se-lee__lista svg').length, focoAdentro: d.contains(document.activeElement), texto: d.textContent.replace(/\s+/g, ' ') };
    });
    const axeConLaAyuda = await axe(page);
    await page.keyboard.press('Escape');
    const cerro = await page.waitForFunction(() => !document.querySelector('dialog.como-se-lee[open]'), { timeout: 3_000 }).then(() => true, () => false);
    const focoDespues = await page.evaluate(() => document.activeElement?.textContent.replace(/\s+/g, ' ').trim() ?? '');
    // El botón aparece solo en las vistas que tienen su ayuda. WP-ESCRITORIO-AMABLE, parte 3: el Resumen ya tiene la
    // suya (se comprueba en `resumenPorArea`); la Línea de tiempo todavía no, y ahí el botón no está.
    await cupo(v);
    await ir(page, `${FICHA_A}&vista=linea`);
    await quieto(page, v);
    const enLaLinea = await page.evaluate(() => ({ boton: !!document.querySelector('.como-se-lee__boton'), periodo: !!document.querySelector('.periodo-del-seguimiento__boton') }));
    comprobar(
      'E-47',
      'En Analizar, el marco de la ficha ofrece «Cómo se lee esta vista» sin crecer (143 px a 1440, 1280 y 1024; a 1024, el botón queda con su ícono y conserva su nombre); en la Línea de tiempo, que todavía no tiene su ayuda, el botón no está',
      [1440, 1280, 1024].every((a) => marco[a].alto === 143 && marco[a].boton === 'Cómo se lee esta vista' && marco[a].desborde <= 1) && marco[1024].anchoDelBoton < 60 && marco[1440].anchoDelBoton > 120 && !enLaLinea.boton && enLaLinea.periodo,
      `${JSON.stringify(marco)} · Línea de tiempo: ${JSON.stringify(enLaLinea)}`,
    );
    comprobar(
      'E-47',
      'La ayuda de Analizar se abre como un diálogo con su título, toma el foco, explica cada marca con su muestra y lo que la vista no dice; axe no encuentra faltas con ella abierta; Escape la cierra y el foco vuelve al botón',
      ayuda.titulo === 'Cómo se lee Analizar' && ayuda.renglones >= 10 && ayuda.muestras >= 10 && ayuda.focoAdentro && /No son ceros/.test(ayuda.texto) && /no indica que una cause la otra/.test(ayuda.texto) && /no se resta ni se califica/.test(ayuda.texto) && axeConLaAyuda.length === 0 && cerro && focoDespues === 'Cómo se lee esta vista',
      `${ayuda.titulo} · ${ayuda.renglones} renglones, ${ayuda.muestras} muestras · foco adentro: ${ayuda.focoAdentro} · axe: ${JSON.stringify(axeConLaAyuda)} · Escape la cierra: ${cerro} · foco después: «${focoDespues}»`,
    );
    await abrirAnalisis(`m=${encodeURIComponent(TRES)}&p=90`);

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
  }
}

// ─── El Resumen por área (WP-ESCRITORIO-AMABLE, parte 3: E-49 a E-64) ────────────────────────────────

/**
 * El Resumen organizado por área: las tarjetas, la tira del objetivo, los hechos con su alcance, la acción y el botón
 * lleno, los indicadores con su minigráfico, la primera pantalla, «Actualizar» y la ayuda de la vista. Lo esperado (los
 * números del objetivo, el corte de cada área, la cobertura, el valor de cada indicador, los puntos de cada minigráfico)
 * se calcula a mano con lo que devuelve la API, sin el dominio. Cada comprobación negativa («no hay…») mira con el mismo
 * selector que una positiva de la misma pantalla. Corre en la sesión de `fichaRecompuesta`, recién iniciada: lo primero
 * que mira es qué guiones cargó la ficha. Sola, con `node recorrido.mjs resumen`.
 */
async function resumenPorArea(page, v, guiones) {
  {
    const desde90 = diaMenos(hoy, 89);
    /** «20 sept», como escribe el Resumen una fecha del año en curso; con el año si es de otro. */
    const fechaBreve = (f) => (f.slice(0, 4) === hoy.slice(0, 4) ? new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${f}T12:00:00Z`)) : diaCivil(f));
    /** La fecha civil de un instante en la zona de la demostración (UTC−3, sin horario de verano). */
    const diaDe = (instante) => new Date(Date.parse(instante) - 3 * 3_600_000).toISOString().slice(0, 10);
    const num = (n, decimales = 0) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: decimales }).format(n);
    const contar = (n, uno, varios) => `${num(n)} ${n === 1 ? uno : varios}`;
    const diasEntre = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
    const consulta = `periodStart=${desde90}&periodEnd=${hoy}`;
    const proy = async (clave, extra = '') => (await leerApi(v, `/advisees/${estado.aseId}/projections/${clave}?${consulta}${extra}`)).data.result;
    /** Vuelve a montar el Resumen (pasando por la línea de tiempo): todas sus lecturas se repiten. */
    const abrirResumen = async (ficha = FICHA_A) => {
      await cupo(v, 60);
      await ir(page, `${ficha}&vista=linea`);
      await quieto(page, v);
      await ir(page, ficha);
      await quieto(page, v);
      await page.evaluate(() => window.scrollTo(0, 0));
      await pausa(350);
    };

    // E-54 · La ficha se carga sin la biblioteca de gráficos ──────────────────────────────────────────────
    // Lo primero, antes de abrir «Analizar» en esta sesión: qué guiones pidió la ficha para mostrar el Resumen. La
    // biblioteca de gráficos está en los archivos de la compilación que contienen su código; ninguno tiene que estar.
    const carpetaDeGuiones = `${REPO}/apps/web/out/_next/static/chunks`;
    const conLaBiblioteca = fs
      .readdirSync(carpetaDeGuiones, { recursive: true })
      .map(String)
      .filter((f) => f.endsWith('.js') && fs.readFileSync(`${carpetaDeGuiones}/${f}`, 'utf8').includes('recharts-surface'))
      .map((f) => f.split(/[\\/]/).pop());
    const cargadosEnElResumen = [...guiones];
    const minigraficosAlEntrar = await page.$$eval('.minigrafico svg', (g) => g.length);

    await page.setViewport({ width: 1440, height: 900 });
    await pausa(400);
    const panel = (await leerApi(v, `/advisees/${estado.aseId}/dashboard?periodStart=${encodeURIComponent(`${desde90}T00:00:00.000-03:00`)}&periodEnd=${encodeURIComponent(`${hoy}T23:59:59.999-03:00`)}`)).data.domains;

    // E-49 · Una tarjeta por área ─────────────────────────────────────────────────────────────────────────
    const tarjetas = await page.evaluate(() =>
      [...document.querySelectorAll('.resumen .area')].map((a) => ({
        area: a.dataset.area,
        titulo: a.querySelector('h2')?.textContent.trim() ?? '',
        abrir: a.querySelector('.area__abrir')?.textContent.trim() ?? '',
        destino: a.querySelector('.area__abrir')?.getAttribute('href') ?? '',
        contexto: [...a.querySelectorAll('.area__contexto > div > dt')].map((d) => d.textContent.trim()),
        accion: a.querySelector('.area__accion a')?.textContent.trim() ?? '',
      })),
    );
    const titulos = await page.evaluate(() => [...document.querySelectorAll('main h2')].filter((h) => h.checkVisibility()).map((h) => h.textContent.trim()));
    const deAntes = await page.evaluate(() => ['.tabla-de-planificacion', '.para-tu-revision', '.acciones-del-resumen', '.cobertura', '.recientes'].filter((s) => document.querySelector(s)));
    comprobar(
      'E-49',
      'Una tarjeta por área, en el orden de BE, cada una con su título, «Abrir …» con retorno a la ficha, su contexto y su acción; después van los indicadores y las preguntas; no queda nada de la tabla, la lista ni «Acciones» de antes',
      tarjetas.map((t) => t.area).join() === 'NUTRICION,ENTRENAMIENTO,ANTROPOMETRIA' &&
        tarjetas.every((t) => t.abrir === `Abrir ${t.titulo}` && t.destino.includes(`id=${estado.aseId}`) && /[?&]volver=/.test(t.destino)) &&
        /\/pro\/advisees\/nutrition\?/.test(tarjetas[0].destino) &&
        /\/pro\/advisees\/training\?/.test(tarjetas[1].destino) &&
        /\/pro\/advisees\/anthropometry\?/.test(tarjetas[2].destino) &&
        JSON.stringify(tarjetas.map((t) => t.contexto)) === JSON.stringify([['Objetivo', 'Objetivo del día, en números', 'Plan'], ['Objetivo', 'Plan'], ['Tomas', 'Revisiones']]) &&
        tarjetas.map((t) => t.accion).join('|') === 'Preparar la revisión de Nutrición|Preparar la revisión de Entrenamiento|Preparar una toma' &&
        titulos.join('|') === 'Nutrición|Entrenamiento|Antropometría|Indicadores|Empezar por una pregunta' &&
        deAntes.length === 0,
      `${titulos.join(' › ')} · ${JSON.stringify(tarjetas.map((t) => [t.area, t.contexto.length, t.accion]))} · de antes: ${deAntes.join(', ') || 'nada'}`,
    );

    // E-55 · La primera pantalla, medida ──────────────────────────────────────────────────────────────────
    const medir = () =>
      page.evaluate(() => {
        const fin = (s) => {
          const e = [...document.querySelectorAll(s)];
          return e.length ? Math.round(Math.max(...e.map((x) => x.getBoundingClientRect().bottom + scrollY))) : null;
        };
        return {
          tarjetas: document.querySelectorAll('.area').length,
          finDeLasTarjetas: fin('.area'),
          finDeLasAcciones: fin('.area__accion'),
          tituloDeIndicadores: Math.round((document.querySelector('.indicadores-del-resumen h2')?.getBoundingClientRect().top ?? -1) + scrollY),
          indicadores: document.querySelectorAll('.indicador').length,
          finDeLosNombres: fin('.indicador h3'),
          finDeLosValores: fin('.indicador__valor'),
          finDeLasReglas: fin('.indicador__regla'),
          finDeLosGraficos: fin('.minigrafico'),
          finDeLosIndicadores: fin('.indicador'),
          finDeLasPreguntas: fin('.preguntas-del-resumen'),
          alto: document.documentElement.scrollHeight,
          desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
    // Lo que se exige: las tarjetas enteras y, de cada indicador, el nombre y el valor. El alto de una tarjeta depende de
    // cuántos hechos tenga el área: se mide con el asesorado A recién generado, y lo que sigue (la regla, el minigráfico,
    // la cobertura) se informa con su medida. La primera versión de esta comprobación exigía también la regla, medida
    // sobre datos que `recorrido-comprension.mjs funcional` ya había cambiado (una revisión de Entrenamiento de hoy, sin
    // nada nuevo): con los datos recién generados esa tarjeta tiene un renglón más y la regla quedaba 7 px debajo del borde.
    const enLaPrimeraPantalla = (m) => m.tarjetas === 3 && m.indicadores === 4 && m.finDeLasTarjetas !== null && m.finDeLasTarjetas <= 900 && m.finDeLosNombres !== null && m.finDeLosNombres <= 900 && m.finDeLosValores !== null && m.finDeLosValores <= 900 && m.desborde <= 1;
    const primera = await medir();
    // La prueba de la prueba: un contexto alto, como la tabla de antes, saca los indicadores de la primera pantalla.
    const empujar = await page.addStyleTag({ content: '.area__contexto { padding-bottom: 12rem !important; }' });
    await pausa(350);
    const empujada = await medir();
    await empujar.evaluate((e) => e.remove());
    await pausa(350);
    comprobar('E-55', 'A 1440 × 900 entran, sin desplazarse, las tres tarjetas enteras (con su acción) y el nombre y el valor de los cuatro indicadores', enLaPrimeraPantalla(primera), JSON.stringify(primera));
    comprobar('E-55', 'La medición detecta un contexto alto que saca los indicadores de la primera pantalla (la prueba de la prueba)', !enLaPrimeraPantalla(empujada) && (empujada.finDeLosValores ?? 0) > 900, JSON.stringify(empujada));
    informar('E-55', 'A 1440 × 900, dónde termina lo que sigue al valor de cada indicador (el borde de la ventana está en 900)', `la regla, en ${primera.finDeLasReglas}; el minigráfico, en ${primera.finDeLosGraficos}; la cobertura, en ${primera.finDeLosIndicadores}; las preguntas, en ${primera.finDeLasPreguntas}`);
    // Otras ventanas, sin umbral: se informa dónde termina cada cosa (una portátil de 1366 × 768 es más baja que las tarjetas).
    const otras = {};
    for (const [ancho, alto] of [[1920, 950], [1280, 900], [1366, 768]]) {
      await page.setViewport({ width: ancho, height: alto });
      await pausa(500);
      const m = await medir();
      otras[`${ancho}×${alto}`] = { tarjetas: m.finDeLasTarjetas, valores: m.finDeLosValores, reglas: m.finDeLasReglas, graficos: m.finDeLosGraficos, indicadores: m.finDeLosIndicadores, alto: m.alto };
    }
    await page.setViewport({ width: 1440, height: 900 });
    await pausa(500);
    informar('E-55', 'Otras ventanas (ancho × alto): dónde terminan las tarjetas, los valores, las reglas, los minigráficos y los indicadores', JSON.stringify(otras));
    informar('E-55', 'El alto del Resumen a 1440 px, con el asesorado A y 90 días (antes de esta parte, con el marco de hoy: 2.130 px)', `${primera.alto} px`);

    // E-59 · La tira del objetivo ─────────────────────────────────────────────────────────────────────────
    const efectivo = (await leerApi(v, `/advisees/${estado.aseId}/nutrition/objectives/effective`)).data.objective;
    const tira = () => page.$$eval('.area[data-area="NUTRICION"] .tira-del-objetivo > div', (d) => d.map((x) => x.innerText.replace(/\s+/g, ' ').trim()));
    const macro = (m) => (m.unit === 'g/day' ? `${num(m.value, 2)} g` : `${num(m.value, 4)} de las calorías (proporción)`);
    const tiraEsperada = [
      `Calorías (requerimiento energético estimado) ${num(panel.nutrition.summary.objective.estimatedEnergyRequirement.value, 2)} kcal`,
      `Carbohidratos ${macro(efectivo.macronutrientDistribution.carbohydrate)}`,
      `Grasas ${macro(efectivo.macronutrientDistribution.fat)}`,
      `Proteínas ${macro(efectivo.macronutrientDistribution.protein)}`,
    ];
    const tiraEnPantalla = await tira();
    const delObjetivo = await texto(page, '.area[data-area="NUTRICION"] .area__contexto > div:first-child dd');
    comprobar(
      'E-59',
      'La tira del objetivo dice las calorías del resumen de la ficha y los tres macros del objetivo efectivo (API-NUT-06, la misma versión), en el orden de la APK, cada uno con su palabra; arriba, «por día» y desde cuándo rige',
      efectivo.versionId === panel.nutrition.summary.objective.objectiveVersionId && JSON.stringify(tiraEnPantalla) === JSON.stringify(tiraEsperada) && delObjetivo === `por día · desde el ${fechaBreve(diaDe(panel.nutrition.summary.objective.effectiveFrom))}`,
      `pantalla: ${tiraEnPantalla.join(' · ')} («${delObjetivo}») · esperado: ${tiraEsperada.join(' · ')}`,
    );
    const malasAntesDeLosMacros = v.malas.length;
    v.reglas = [{ coincide: (u) => u.includes('/nutrition/objectives/effective'), accion: 'responder', status: 503, codigo: 'DB_UNAVAILABLE' }];
    await abrirResumen();
    const sinMacros = { tira: await tira(), aviso: await texto(page, '.area[data-area="NUTRICION"] .tira-del-objetivo__falla') };
    v.reglas = [];
    await clic(page, '.area[data-area="NUTRICION"] .tira-del-objetivo__falla button', 'Reintentar');
    await quieto(page, v);
    const tiraRecuperada = await tira();
    // El 503 fue simulado en el navegador: no es una respuesta con error de la API.
    v.malas = [...v.malas.slice(0, malasAntesDeLosMacros), ...v.malas.slice(malasAntesDeLosMacros).filter((m) => !m.includes('objectives/effective'))];
    comprobar(
      'E-59',
      'Si la lectura de los macros falla (503 simulado), quedan las calorías, se dice que no se pudieron cargar —no que falten— y «Reintentar» los trae; nunca un cero',
      sinMacros.tira.length === 1 && sinMacros.tira[0] === tiraEsperada[0] && /No pudimos cargar los macros del objetivo\. No es que falten/.test(sinMacros.aviso) && JSON.stringify(tiraRecuperada) === JSON.stringify(tiraEsperada),
      `con la falla: ${sinMacros.tira.join(' · ')} · «${sinMacros.aviso}» · después de reintentar: ${tiraRecuperada.join(' · ')}`,
    );

    // E-51 · Los hechos de cada tarjeta, con su alcance ──────────────────────────────────────────────────────────
    const leerHechos = () =>
      page.evaluate(() =>
        [...document.querySelectorAll('.resumen .area')].map((a) => {
          const corte = a.querySelector('.area__corte');
          const plegado = a.querySelector('details.area__periodo');
          return {
            area: a.dataset.area,
            corte: corte ? corte.innerText.replace(/\s+/g, ' ').trim() : '',
            yDelCorte: corte ? Math.round(corte.getBoundingClientRect().top + scrollY) : null,
            proxima: a.querySelector('.area__proxima')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
            plegado: plegado ? { abierto: plegado.open, titulo: plegado.querySelector('summary').textContent.replace(/\s+/g, ' ').trim(), adentro: plegado.querySelectorAll('.observacion').length, aLaVista: [...plegado.querySelectorAll('.observacion')].some((o) => o.checkVisibility()) } : null,
            tomaEnElContexto: a.querySelector('.area__contexto button')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
            filas: [...a.querySelectorAll('.observacion')].map((o) => {
              const fila = o.querySelector('.observacion__fila');
              return {
                regla: o.dataset.regla,
                prioridad: o.dataset.prioridad,
                alcance: o.querySelector('.observacion__alcance')?.textContent.replace(/\s+/g, ' ').trim() ?? '',
                // Lo que está adentro de un plegable cerrado no se dibuja y su `innerText` viene vacío: ahí se lee el texto del documento.
                texto: ((t) => (t ? t.innerText || t.textContent : ''))(o.querySelector('.observacion__texto')).replace(/\s+/g, ' ').trim(),
                entero: o.innerText.replace(/\s+/g, ' ').trim(),
                enlace: fila?.tagName === 'A' ? fila.getAttribute('href') : null,
                destino: o.querySelector('.observacion__fila > .visualmente-oculto')?.textContent.replace(/\s+/g, ' ').trim() ?? '',
                icono: fila?.firstElementChild?.tagName.toLowerCase() === 'svg',
                peso: Number(getComputedStyle(o.querySelector('.observacion__frase, .observacion__cuenta')).fontWeight),
                y: Math.round(o.getBoundingClientRect().top + scrollY),
                plegada: !!o.closest('details.area__periodo'),
              };
            }),
          };
        }),
      );
    const hechos = await leerHechos();
    const todasLasFilas = hechos.flatMap((a) => a.filas.map((f) => ({ ...f, area: a.area })));
    const NOMBRE = { NUTRICION: 'Nutrición', ENTRENAMIENTO: 'Entrenamiento', ANTROPOMETRIA: 'Antropometría' };
    const SIN_ENLACE = ['OBJETIVO_NUEVO_DESPUES_DEL_CORTE'];
    const filaBien = (f) => new RegExp(`^${NOMBRE[f.area]} · (Hoy|Desde la revisión del \\d{1,2} [a-z]{3,4}|En el período seleccionado):$`).test(f.alcance) && f.texto.length > 10 && (SIN_ENLACE.includes(f.regla) ? f.enlace === null : !!f.enlace && f.destino.length > 5);
    const filasMal = todasLasFilas.filter((f) => !filaBien(f));
    comprobar(
      'E-51',
      'Cada hecho es un renglón que dice su área y su alcance (también para el lector de pantalla), el hecho, y abre su evidencia; la última toma no se repite como hecho: está en el contexto de su tarjeta, con el botón que la abre',
      todasLasFilas.length >= 6 && filasMal.length === 0 && !todasLasFilas.some((f) => f.regla === 'ULTIMA_TOMA') && /^Ver la toma: la última, el \d{1,2} [a-z]{3,4}$/.test(hechos[2].tomaEnElContexto ?? ''),
      filasMal.length
        ? `no cumplen: ${filasMal.map((f) => JSON.stringify({ regla: f.regla, alcance: f.alcance, texto: f.texto.slice(0, 40), enlace: !!f.enlace, destino: f.destino })).join(' ')}`
        : `${todasLasFilas.map((f) => `${f.area.slice(0, 3)}:${f.regla}${f.enlace ? '→' : ''}`).join(' ')} · toma: «${hechos[2].tomaEnElContexto}»`,
    );
    const pendientes = todasLasFilas.filter((f) => f.prioridad === '1');
    const cuentas = todasLasFilas.filter((f) => f.regla === 'NOVEDADES_DESDE_EL_CORTE' && /^\d/.test(f.texto));
    comprobar(
      'E-51',
      'Lo pendiente va primero en su tarjeta (antes del corte) y se reconoce por su ícono y su peso, no por un color; las cuentas no llevan ícono ni negrita',
      pendientes.length >= 2 &&
        pendientes.every((f) => f.icono && f.peso >= 600 && !f.plegada && f.y < (hechos.find((a) => a.area === f.area).yDelCorte ?? Infinity)) &&
        cuentas.length >= 1 &&
        cuentas.every((f) => !f.icono && f.peso < 600),
      `pendientes: ${pendientes.map((f) => `${f.regla} (ícono ${f.icono}, peso ${f.peso})`).join(', ')} · cuentas: ${cuentas.map((f) => `${f.area} (ícono ${f.icono}, peso ${f.peso})`).join(', ')}`,
    );
    // El corte de cada área: su última revisión, con su fecha y si ya se aplicó; Antropometría no tiene revisiones.
    const corteEsperado = (resumen) => {
      const r = resumen.lastReview;
      const base = `Desde la revisión del ${fechaBreve(diaDe(r.recordedAt))}`;
      if (!r.application) return { empieza: base, aplicada: false };
      return { empieza: base, aplicada: true, sufijo: diaDe(r.application.appliedAt) === diaDe(r.recordedAt) ? ' · aplicada' : ` · aplicada el ${fechaBreve(diaDe(r.application.appliedAt))}` };
    };
    const cortes = { NUTRICION: corteEsperado(panel.nutrition.summary), ENTRENAMIENTO: corteEsperado(panel.training.summary) };
    const corteBien = (area) => {
      const h = hechos.find((a) => a.area === area);
      const c = cortes[area];
      const sinAplicar = h.filas.some((f) => f.regla === 'REVISION_SIN_APLICAR');
      return h.corte.startsWith(c.empieza) && (c.aplicada ? h.corte.includes(c.sufijo) && !sinAplicar : !/aplicada/.test(h.corte) && sinAplicar);
    };
    comprobar(
      'E-51',
      'Cada área dice su propio corte: la fecha de su última revisión y si ya se aplicó (si no, es un pendiente de esa tarjeta); Antropometría dice que no tiene revisiones y mira el período elegido',
      corteBien('NUTRICION') && corteBien('ENTRENAMIENTO') && cortes.NUTRICION.empieza !== cortes.ENTRENAMIENTO.empieza && hechos[2].corte === 'En el período seleccionado' && /No tiene revisiones en BE/.test(await texto(page, '.area[data-area="ANTROPOMETRIA"] .area__contexto')),
      hechos.map((a) => `${a.area}: «${a.corte}»`).join(' · '),
    );
    // E-56 · La próxima revisión acordada está siempre en la tarjeta, una sola vez: como pendiente (a una semana o menos,
    // o ya pasada) o junto al corte.
    const proximaBien = (area, resumen) => {
      const h = hechos.find((a) => a.area === area);
      const fecha = resumen.activePlan?.nextReviewAt ?? null;
      const pendiente = h.filas.find((f) => f.regla === 'PROXIMA_REVISION');
      if (fecha !== null && diasEntre(hoy, fecha) <= 7) return !!pendiente && pendiente.texto.includes(fechaBreve(fecha)) && h.proxima === null;
      return !pendiente && h.proxima === `Próxima revisión acordada: ${fecha ? fechaBreve(fecha) : 'sin fecha acordada'}`;
    };
    comprobar(
      'E-56',
      'La próxima revisión acordada de cada área está en su tarjeta una sola vez: como pendiente si falta una semana o menos (o ya pasó); si no, junto al corte, con su fecha o «sin fecha acordada»',
      proximaBien('NUTRICION', panel.nutrition.summary) && proximaBien('ENTRENAMIENTO', panel.training.summary) && hechos[2].proxima === null,
      `API: Nutrición ${panel.nutrition.summary.activePlan?.nextReviewAt ?? 'sin fecha'}, Entrenamiento ${panel.training.summary.activePlan?.nextReviewAt ?? 'sin fecha'} · pantalla: ${hechos.map((a) => `${a.area}: ${a.proxima ?? (a.filas.find((f) => f.regla === 'PROXIMA_REVISION')?.texto ?? '—')}`).join(' · ')}`,
    );
    // La cobertura del período, plegada cuando el área tiene una revisión: se abre y dice lo que decía «Qué se registró
    // en el período», con los números de la API.
    const plegados = hechos.filter((a) => a.plegado).map((a) => ({ area: a.area, ...a.plegado }));
    await abrirDetalles(page, '.area[data-area="NUTRICION"] details.area__periodo');
    await abrirDetalles(page, '.area[data-area="ENTRENAMIENTO"] details.area__periodo');
    await pausa(200);
    const abiertos = await leerHechos();
    const cob = (await proy('NUTRITION_PRESCRIBED_VS_RECORDED', '&metric=RECORDS')).coverage;
    const linea = (await leerApi(v, `/advisees/${estado.aseId}/timeline?${consulta}&limit=1`)).data.periodCounts;
    const deTipo = (t) => linea.byEventType.find((x) => x.eventType === t)?.count ?? 0;
    const coberturaN = abiertos[0].filas.find((f) => f.regla === 'COBERTURA_NUTRICIONAL');
    const coberturaE = abiertos[1].filas.find((f) => f.regla === 'COBERTURA_DE_ENTRENAMIENTO');
    const partesDeNutricion = [
      `${num(cob.daysWithRecords)} de ${contar(cob.daysInPeriod, 'día', 'días')} con algún registro`,
      `${contar(cob.records, 'registro', 'registros')}: ${num(cob.recordsWithQuantities)} con cantidades y ${num(cob.recordsWithoutQuantities)} sin cantidades`,
      ...(cob.differentMealsWithoutQuantities ? [contar(cob.differentMealsWithoutQuantities, 'comida diferente, entre los registros sin cantidades', 'comidas diferentes, entre los registros sin cantidades')] : []),
      ...(cob.annulledExcluded ? [contar(cob.annulledExcluded, 'anulado, fuera de los totales', 'anulados, fuera de los totales')] : []),
      ...(cob.rectifiedCountedOnce ? [contar(cob.rectifiedCountedOnce, 'rectificado, contado una vez', 'rectificados, contados una vez')] : []),
    ];
    comprobar(
      'E-51',
      'La cobertura del período queda plegada en la tarjeta de un área con revisión (su título dice el alcance y cuántos hechos guarda); abierta, dice los días y los registros de la API, los anulados, los rectificados y las comidas diferentes, y que en Entrenamiento no hay «sesiones esperadas»',
      plegados.map((p) => p.area).join() === 'NUTRICION,ENTRENAMIENTO' &&
        plegados.every((p) => !p.abierto && !p.aLaVista && p.adentro === 1 && p.titulo === 'En el período seleccionado: cobertura del registro (1)') &&
        !!coberturaN && partesDeNutricion.every((p) => coberturaN.entero.includes(p)) && coberturaN.alcance === 'Nutrición · En el período seleccionado:' &&
        !!coberturaE && coberturaE.entero.includes(contar(deTipo('TRAINING_SESSION_RECORDED'), 'sesión registrada', 'sesiones registradas')) && coberturaE.entero.includes('Sin calendario prescripto, no hay «sesiones esperadas».'),
      `Nutrición: «${coberturaN?.entero ?? 'no está'}» (esperado: ${partesDeNutricion.join(' | ')}) · Entrenamiento: «${coberturaE?.entero ?? 'no está'}»`,
    );
    const tardias = await page.evaluate(() => ({ texto: document.querySelector('.resumen__tardias')?.innerText.replace(/\s+/g, ' ').trim() ?? '', destino: document.querySelector('.resumen__tardias a')?.getAttribute('href') ?? '' }));
    comprobar(
      'E-51',
      '«Cargado otro día» es del período entero, no de un área: va al pie con el número de la API y lleva a esos hechos en la línea de tiempo',
      linea.recordedLate > 0 && tardias.texto.includes(`${num(linea.recordedLate)} hechos del período se registraron un día posterior al que ocurrieron (carga tardía)`) && /vista=linea/.test(tardias.destino) && /tardias=1/.test(tardias.destino),
      `API: ${linea.recordedLate} · «${tardias.texto}» → ${tardias.destino}`,
    );

    // E-56 · Un solo botón lleno ──────────────────────────────────────────────────────────────────────────
    const acciones = await page.$$eval('.resumen .area', (as) => as.map((a) => ({ area: a.dataset.area, botones: [...a.querySelectorAll('.area__accion a')].map((b) => ({ texto: b.textContent.trim(), lleno: b.classList.contains('boton--primario'), contorno: b.classList.contains('boton--secundario'), destino: b.getAttribute('href') ?? '' })) })));
    const conFecha = [['NUTRICION', panel.nutrition], ['ENTRENAMIENTO', panel.training]].filter(([, e]) => e.available && e.summary?.activePlan?.nextReviewAt).map(([area, e]) => ({ area, fecha: e.summary.activePlan.nextReviewAt })).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const llenos = acciones.flatMap((a) => a.botones.filter((b) => b.lleno).map(() => a.area));
    const boton = (area) => acciones.find((a) => a.area === area).botones[0];
    comprobar(
      'E-56',
      'Un solo botón lleno en todo el Resumen: el del área con la próxima revisión acordada más cercana según el resumen de la ficha; los demás, con contorno. «Preparar la revisión…» lleva a su formulario preparado y «Preparar una toma», a la toma en preparación, los dos con retorno',
      conFecha.length > 0 && llenos.join() === conFecha[0].area && acciones.every((a) => a.botones.length === 1 && a.botones[0].lleno !== a.botones[0].contorno) &&
        new RegExp(`/pro/advisees/nutrition\\?id=${estado.aseId}&vista=revisiones&preparar=1&volver=`).test(boton('NUTRICION').destino) &&
        new RegExp(`/pro/advisees/training\\?id=${estado.aseId}&vista=revisiones&preparar=1&volver=`).test(boton('ENTRENAMIENTO').destino) &&
        new RegExp(`/pro/advisees/anthropometry\\?id=${estado.aseId}&vista=preparacion&volver=`).test(boton('ANTROPOMETRIA').destino),
      `fechas de la API: ${conFecha.map((c) => `${c.area} ${c.fecha}`).join(', ') || 'ninguna'} · lleno: ${llenos.join(', ') || 'ninguno'}`,
    );

    // E-60 · Las preguntas ────────────────────────────────────────────────────────────────────────────────
    const preguntas = await page.evaluate(() => ({ lista: [...document.querySelectorAll('.preguntas-del-resumen__lista a')].map((a) => ({ texto: a.textContent.trim(), destino: a.getAttribute('href') ?? '' })), mas: document.querySelector('.preguntas-del-resumen__mas')?.getAttribute('href') ?? '' }));
    comprobar(
      'E-60',
      'Las cuatro preguntas principales, con las palabras del dominio y en su orden; cada una arma «Analizar» desde cero (sin métricas ni fecha de un análisis anterior) y «Más preguntas» lleva a la entrada de Analizar',
      preguntas.lista.map((p) => p.texto).join('|') === dominio.PREGUNTAS_PROFESIONALES.filter((p) => p.principal).map((p) => p.pregunta).join('|') &&
        preguntas.lista.length === 4 &&
        preguntas.lista.every((p) => /vista=analizar/.test(p.destino) && /pregunta=[a-z-]+/.test(p.destino) && !/[?&](m|f)=/.test(p.destino)) &&
        /vista=analizar/.test(preguntas.mas) && !/pregunta=|[?&]m=/.test(preguntas.mas),
      preguntas.lista.map((p) => p.texto).join(' · '),
    );

    // E-53 · Los indicadores por defecto y su valor, calculado a mano ───────────────────────────────────────────
    await cupo(v, 60);
    const nut = await proy('NUTRITION_PRESCRIBED_VS_RECORDED', '&metric=ENERGY&grain=DAY');
    const prot = await proy('NUTRITION_PRESCRIBED_VS_RECORDED', '&metric=PROTEIN&grain=DAY');
    const deEntrenamiento = await proy('TRAINING_PROGRESSION_BY_EXERCISE');
    const ej = [...deEntrenamiento.exercises].sort((a, b) => b.sessions - a.sessions)[0];
    const serieDeCarga = ej.setNumbers[0] ?? 1;
    const carga = (await proy('TRAINING_PROGRESSION_BY_EXERCISE', `&exerciseId=${encodeURIComponent(ej.exerciseKey)}&metric=LOAD&setIndex=${serieDeCarga}&unit=${ej.loadUnits[0]}&grain=ORIGINAL`)).progression.series;
    const peso = (await proy('ANTHROPOMETRY_LONGITUDINAL', '&metric=peso')).series[0];
    const enElPeriodo = (s) => s.points.filter((p) => p.date >= desde90 && p.date <= hoy);
    const completos = (s) => enElPeriodo(s).filter((p) => p.value !== null && !p.partialBucket);
    const media = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const mediana = (xs) => {
      const o = [...xs].sort((a, b) => a - b);
      const m = Math.floor(o.length / 2);
      return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
    };
    /** Redondeo «mitad hacia arriba» sobre el número escrito en decimal, como la pantalla de registro (no el del binario). */
    const mitadArriba = (x, decimales) => {
      const [entera, decimal = ''] = String(x).split('.');
      const cifras = decimal.padEnd(decimales + 1, '0');
      const base = Number(decimales ? `${entera}.${cifras.slice(0, decimales)}` : entera);
      return cifras[decimales] >= '5' ? Number((base + 10 ** -decimales).toFixed(decimales)) : base;
    };
    const conValorDelPeso = enElPeriodo(peso).filter((p) => p.value !== null);
    const ultimaToma = conValorDelPeso.at(-1);
    const sesiones = completos(carga);
    const ultimaSesion = enElPeriodo(carga).filter((p) => p.value !== null).at(-1);
    const esperados = [
      { metrica: 'nutricion.energia', nombre: 'Calorías registradas', valor: `${num(mitadArriba(media(completos(nut.recorded).map((p) => p.value)), 0))} kcal por día`, regla: 'Media de los días con valor' },
      { metrica: 'nutricion.proteinas', nombre: 'Proteínas registradas', valor: `${num(mitadArriba(media(completos(prot.recorded).map((p) => p.value)), 1), 1)} g por día`, regla: 'Media de los días con valor' },
      { metrica: 'entrenamiento.carga', nombre: `Carga · ${ej.name} · serie ${serieDeCarga}`, valor: `${num(Number(mediana(sesiones.map((p) => p.value)).toFixed(1)), 1)} ${ej.loadUnits[0]}`, regla: 'Mediana de las sesiones' },
      { metrica: 'antropometria.peso', nombre: 'Peso', valor: `${num(Number(ultimaToma.value.toFixed(2)), 2)} ${peso.unit}`, regla: `Última toma: ${fechaBreve(ultimaToma.date)}` },
    ];
    const leerIndicadores = () =>
      page.$$eval('.indicador', (is) =>
        is.map((i) => {
          const g = i.querySelector('.minigrafico');
          const tramo = g?.querySelector('.minigrafico__tramo');
          const muestra = document.createElement('span');
          muestra.style.color = 'var(--metrica-1)';
          i.appendChild(muestra);
          const colorDeLaMetrica = getComputedStyle(muestra).color;
          muestra.remove();
          return {
            metrica: i.dataset.metrica,
            nombre: i.querySelector('.indicador__nombre')?.firstChild?.textContent.trim() ?? '',
            valor: i.querySelector('.indicador__valor')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
            regla: i.querySelector('.indicador__regla')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
            cobertura: i.querySelector('.indicador__cobertura')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
            muestraGris: !!i.querySelector('.indicador__cobertura .muestra-de-hueco'),
            notas: [...i.querySelectorAll('.indicador__nota')].map((n) => n.innerText.replace(/\s+/g, ' ').trim()),
            clase: i.querySelector('.etiqueta-de-dato')?.innerText.replace(/\s+/g, ' ').trim() ?? null,
            analizar: i.querySelector('h3 a.indicador__analizar')?.getAttribute('href') ?? '',
            nombreDelEnlace: i.querySelector('h3 a.indicador__analizar')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
            flecha: i.querySelector('h3 a.indicador__analizar')?.lastElementChild?.tagName.toLowerCase() === 'svg',
            grafico: g
              ? {
                  rol: g.getAttribute('role'),
                  descripcion: g.getAttribute('aria-label') ?? '',
                  puntos: g.querySelectorAll('.minigrafico__punto').length,
                  huecos: g.querySelectorAll('.minigrafico__punto[data-hueco="si"]').length,
                  tramos: g.querySelectorAll('.minigrafico__tramo').length,
                  grises: g.querySelectorAll('.minigrafico__sin-registros').length,
                  marcas: [...g.querySelectorAll('.minigrafico__marca text')].map((t) => t.textContent.trim()),
                  plan: g.querySelectorAll('.minigrafico__plan').length,
                  delColorDeLaMetrica: tramo ? getComputedStyle(tramo).stroke === colorDeLaMetrica : null,
                  conFoco: g.matches('[tabindex]') || !!g.querySelector('[tabindex], a, button'),
                }
              : null,
          };
        }),
      );
    const indicadores = await leerIndicadores();
    comprobar(
      'E-53',
      'Los cuatro indicadores por defecto son calorías y proteínas registradas, la carga de la primera serie del ejercicio más registrado y el peso, en el orden de las áreas; el valor de cada uno es el que sale de la API con su regla (media de los días con valor, mediana de las sesiones, última toma)',
      indicadores.length === 4 && esperados.every((e, i) => indicadores[i].metrica === e.metrica && indicadores[i].nombre === e.nombre && indicadores[i].valor === e.valor && indicadores[i].regla === e.regla),
      `pantalla: ${indicadores.map((i) => `${i.nombre} = ${i.valor} (${i.regla})`).join(' · ')} · esperado: ${esperados.map((e) => `${e.nombre} = ${e.valor} (${e.regla})`).join(' · ')}`,
    );
    const diasConRegistros = new Set(enElPeriodo(nut.recorded).filter((p) => !p.partialBucket && p.date !== hoy).map((p) => p.date)).size;
    const sinRegistros = 90 - diasConRegistros - 1;
    const CLASE = { MEASURED: 'Medido', REPORTED: 'Reportado', DERIVED: 'Calculado' };
    comprobar(
      'E-53',
      'Cada indicador dice su cobertura con las palabras del dominio (los días con valor y sin registros, las sesiones, las tomas del tramo comparable); la carga dice además su última sesión, y el peso, la clase de su última toma, que es el único dato que la trae',
      indicadores[0].cobertura.startsWith(`90 días: ${num(completos(nut.recorded).length)} con valor`) &&
        (sinRegistros > 0 ? indicadores[0].cobertura.includes(`${num(sinRegistros)} sin registros`) && indicadores[0].muestraGris : true) &&
        indicadores[2].cobertura === `${contar(enElPeriodo(carga).length, 'sesión', 'sesiones')}: ${num(sesiones.length)} con valor` &&
        indicadores[2].notas.includes(`Última sesión: ${fechaBreve(ultimaSesion.date)} · ${num(Number(ultimaSesion.value.toFixed(1)), 1)} ${ej.loadUnits[0]}`) &&
        indicadores[3].cobertura.startsWith(contar(conValorDelPeso.length, 'toma', 'tomas')) &&
        indicadores[3].notas.some((n) => /^Primera comparable del período: [\d.,]+ kg el \d{1,2} [a-z]{3,4} · diferencia [+−-]?[\d.,]+ kg \(\d+ tomas comparables\)$|^Una sola observación comparable: no hay con qué comparar\.$/.test(n)) &&
        indicadores[3].clase === `Clase de dato: ${CLASE[ultimaToma.dataClass]}` &&
        indicadores.slice(0, 3).every((i) => i.clase === null),
      indicadores.map((i) => `${i.nombre}: ${i.cobertura} [${i.notas.join(' | ')}]${i.clase ? ` {${i.clase}}` : ''}`).join(' · '),
    );
    comprobar(
      'E-64',
      'El nombre de cada indicador es un enlace que abre su gráfico en «Analizar» (con su métrica y sin la fecha ni la pregunta de un análisis anterior), con una flecha y un nombre que lo dice',
      indicadores.every((i) => /vista=analizar/.test(i.analizar) && new RegExp(`[?&]m=${encodeURIComponent(i.metrica).replace(/[.]/g, '\\.')}`).test(i.analizar) && !/[?&](f|pregunta)=/.test(i.analizar) && i.flecha && i.nombreDelEnlace === `${i.nombre} · analizar`),
      indicadores.map((i) => `${i.nombreDelEnlace} → ${i.analizar.replace(/^[^?]+\?id=[^&]+/, '…')}`).join(' · '),
    );

    // E-54 · El minigráfico dibuja lo mismo que la serie de la API ──────────────────────────────────────────────
    const delGrafico = (serie) => {
      const dibujados = enElPeriodo(serie).filter((p) => p.value !== null);
      const porTramo = new Map();
      for (const p of dibujados) if (!p.partialBucket) porTramo.set(p.segment, (porTramo.get(p.segment) ?? 0) + 1);
      // Se sombrean los días sin registros de una serie diaria, sin el día en curso.
      const grises = serie.grain === 'DAY' ? serie.gaps.filter((h) => (h.to >= hoy ? diaMenos(hoy, 1) : h.to) >= h.from).length : 0;
      return { puntos: dibujados.length, huecos: dibujados.filter((p) => p.quality === 'PARTIAL' || p.partialBucket).length, tramos: [...porTramo.values()].filter((n) => n >= 2).length, grises, minimo: Math.min(...dibujados.map((p) => p.value)), maximo: Math.max(...dibujados.map((p) => p.value)) };
    };
    const series = [nut.recorded, prot.recorded, carga, peso];
    const graficosEsperados = series.map(delGrafico);
    const aNumero = (t) => Number(t.replace(/\./g, '').replace(',', '.').replace('−', '-'));
    const graficoBien = (i, e) => !!i.grafico && i.grafico.puntos === e.puntos && i.grafico.huecos === e.huecos && i.grafico.tramos === e.tramos && i.grafico.grises === e.grises && i.grafico.marcas.length === 2 && aNumero(i.grafico.marcas[0]) >= e.maximo && aNumero(i.grafico.marcas[1]) <= e.minimo;
    const sinBiblioteca = await page.evaluate(() => ({ deLaBiblioteca: document.querySelectorAll('.recharts-surface, .recharts-wrapper, figure.grafico__figura').length, propios: document.querySelectorAll('.minigrafico svg').length }));
    comprobar(
      'E-54',
      'Cada minigráfico dibuja lo mismo que su serie de la API: un punto por día, sesión o toma con valor (los subtotales y el día en curso, huecos), una línea por tramo comparable, el gris de los días sin registros, y dos marcas en el eje que encierran todos los valores',
      indicadores.every((i, n) => graficoBien(i, graficosEsperados[n])) && graficosEsperados[0].puntos > 30 && graficosEsperados[0].grises > 0 && graficosEsperados[3].tramos >= 1,
      indicadores.map((i, n) => `${i.nombre}: ${JSON.stringify({ puntos: i.grafico?.puntos, huecos: i.grafico?.huecos, tramos: i.grafico?.tramos, grises: i.grafico?.grises, marcas: i.grafico?.marcas })} · API ${JSON.stringify(graficosEsperados[n])}`).join(' · '),
    );
    // Desde cuándo rige el primer plan del período: se marca en el gráfico y se dice debajo, solo si empezó adentro.
    const primerPlan = (vigencias) => {
      if (!vigencias || vigencias.length === 0) return null;
      const primero = vigencias.map((x) => x.from).sort()[0];
      return primero > desde90 ? primero : null;
    };
    const planes = [primerPlan(nut.planVersions), primerPlan(prot.planVersions), primerPlan(deEntrenamiento.planVersions), null];
    comprobar(
      'E-54',
      'El inicio del primer plan del período se marca en el minigráfico y se dice debajo («El plan rige desde el…») solo cuando empezó adentro del período, con la fecha de la API; el del peso, que no se registra contra un plan, no lo lleva',
      indicadores.every((i, n) => (planes[n] ? i.grafico.plan === 1 && i.notas.includes(`El plan rige desde el ${fechaBreve(planes[n])}`) : i.grafico.plan === 0 && !i.notas.some((x) => /El plan rige/.test(x)))) && planes.some(Boolean),
      `API: ${planes.map((p) => p ?? '—').join(', ')} · pantalla: ${indicadores.map((i) => `${i.grafico?.plan} ${i.notas.find((x) => /El plan rige/.test(x)) ?? '—'}`).join(' · ')}`,
    );
    comprobar(
      'E-54',
      'El minigráfico es un dibujo propio, con el color de las métricas, sin foco ni nada para tocar, y con su descripción para el lector de pantalla; el Resumen no dibuja ningún gráfico de la biblioteca',
      sinBiblioteca.propios === 4 && sinBiblioteca.deLaBiblioteca === 0 && indicadores.every((i) => i.grafico.rol === 'img' && i.grafico.descripcion.startsWith(`Gráfico de ${i.nombre}. `) && i.grafico.descripcion.length > 60 && i.grafico.delColorDeLaMetrica === true && !i.grafico.conFoco),
      `${sinBiblioteca.propios} propios, ${sinBiblioteca.deLaBiblioteca} de la biblioteca · ${indicadores[0].grafico?.descripcion.slice(0, 140)}…`,
    );
    comprobar(
      'E-54',
      'La ficha se abre y muestra el Resumen, con sus cuatro minigráficos, sin haber cargado la biblioteca de gráficos',
      conLaBiblioteca.length > 0 && cargadosEnElResumen.length > 5 && !cargadosEnElResumen.some((g) => conLaBiblioteca.includes(g)) && minigraficosAlEntrar === 4,
      `${cargadosEnElResumen.length} guiones cargados, ninguno de ${conLaBiblioteca.join(', ') || '(no encontré la biblioteca en la compilación)'} · minigráficos al entrar: ${minigraficosAlEntrar}`,
    );

    // E-58 · «Actualizar» vuelve a leer todo lo que el Resumen muestra ──────────────────────────────────────────
    await cupo(v, 50);
    const antesDeActualizar = v.urls.length;
    await clic(page, '.ficha__consulta button', 'Actualizar');
    await quieto(page, v);
    const pedidos = v.urls.slice(antesDeActualizar).filter((u) => u.startsWith('GET '));
    const LECTURAS = [
      ['el resumen por área', /\/dashboard\?/],
      ['los vínculos', /\/me\/relationships/],
      ['qué hay de Nutrición y su cobertura', /NUTRITION_PRESCRIBED_VS_RECORDED\?[^ ]*metric=RECORDS/],
      ['qué ejercicios hay', /TRAINING_PROGRESSION_BY_EXERCISE\?(?![^ ]*exerciseId)/],
      ['qué medidas hay', /ANTHROPOMETRY_LONGITUDINAL\?(?![^ ]*metric=)/],
      ['los conteos del período', /\/timeline\?(?![^ ]*since=)/],
      ['lo nuevo desde la revisión de Nutrición', /\/timeline\?[^ ]*domain=NUTRITION[^ ]*since=|\/timeline\?[^ ]*since=[^ ]*domain=NUTRITION/],
      ['lo nuevo desde la revisión de Entrenamiento', /\/timeline\?[^ ]*domain=TRAINING[^ ]*since=|\/timeline\?[^ ]*since=[^ ]*domain=TRAINING/],
      ['los macros del objetivo', /\/nutrition\/objectives\/effective/],
      ['los indicadores elegidos', /\/me\/analysis-views/],
      ['la serie de calorías', /metric=ENERGY/],
      ['la serie de proteínas', /metric=PROTEIN/],
      ['la serie de la carga', /metric=LOAD/],
      ['la serie del peso', /ANTHROPOMETRY_LONGITUDINAL\?[^ ]*metric=peso/],
    ];
    const faltan = LECTURAS.filter(([, re]) => !pedidos.some((u) => re.test(u))).map(([nombre]) => nombre);
    comprobar(
      'E-58',
      '«Actualizar» vuelve a leer todo lo que el Resumen muestra, no solo el acceso: el resumen por área, lo que hay en el período y su cobertura, lo nuevo desde cada revisión, los macros del objetivo y las series de los cuatro indicadores',
      faltan.length === 0 && (await page.$$eval('.indicador__valor', (x) => x.length)) === 4,
      faltan.length ? `no se volvió a leer: ${faltan.join(', ')} (de ${pedidos.length} lecturas)` : `${pedidos.length} lecturas después del clic`,
    );

    // E-62 · La ayuda del Resumen ─────────────────────────────────────────────────────────────────────────
    await page.evaluate(() => window.scrollTo(0, 0));
    await clic(page, '.marco-de-la-ficha button', 'Cómo se lee esta vista');
    await page.waitForSelector('dialog.como-se-lee[open]', { timeout: 5_000 });
    await pausa(250);
    const ayuda = await page.evaluate(() => {
      const d = document.querySelector('dialog.como-se-lee[open]');
      const h = d.querySelector('h2').getBoundingClientRect();
      return {
        titulo: d.querySelector('h2').textContent.trim(),
        renglones: d.querySelectorAll('.como-se-lee__lista > li').length,
        muestras: d.querySelectorAll('.como-se-lee__lista .como-se-lee__muestra > *').length,
        focoEnElTitulo: document.activeElement === d.querySelector('h2'),
        tituloALaVista: h.top >= 0 && h.bottom <= innerHeight && d.scrollTop === 0,
        fuentesPlegadas: d.querySelector('details.como-se-lee__fuentes') ? !d.querySelector('details.como-se-lee__fuentes').open : null,
        texto: d.innerText.replace(/\s+/g, ' '),
      };
    });
    const axeConLaAyuda = await axe(page);
    await page.click('dialog.como-se-lee[open] details.como-se-lee__fuentes > summary');
    await pausa(200);
    const fuentes = await page.$$eval('dialog.como-se-lee[open] .como-se-lee__fuentes [data-regla]', (f) => f.map((x) => ({ regla: x.dataset.regla, texto: x.innerText.replace(/\s+/g, ' ').trim(), aLaVista: x.checkVisibility() })));
    const axeConLasFuentes = await axe(page);
    await page.keyboard.press('Escape');
    const cerroLaAyuda = await page.waitForFunction(() => !document.querySelector('dialog.como-se-lee[open]'), { timeout: 3_000 }).then(() => true, () => false);
    const focoDespues = await page.evaluate(() => document.activeElement?.textContent.replace(/\s+/g, ' ').trim() ?? '');
    comprobar(
      'E-62',
      'La ayuda del Resumen se abre desde el marco como un diálogo, por el principio (el foco va al título, que queda a la vista), explica cada parte con su muestra y lo que la vista no dice; axe no encuentra faltas con ella abierta; Escape la cierra y el foco vuelve al botón',
      ayuda.titulo === 'Cómo se lee el Resumen' && ayuda.renglones >= 10 && ayuda.muestras >= 10 && ayuda.focoEnElTitulo && ayuda.tituloALaVista && /No son ceros/.test(ayuda.texto) && /sin calificar/.test(ayuda.texto) && /BE no decide qué es urgente/.test(ayuda.texto) && /No registra nada hasta que lo confirmes/.test(ayuda.texto) && axeConLaAyuda.length === 0 && axeConLasFuentes.length === 0 && cerroLaAyuda && focoDespues === 'Cómo se lee esta vista',
      `${ayuda.titulo} · ${ayuda.renglones} renglones, ${ayuda.muestras} muestras · foco en el título: ${ayuda.focoEnElTitulo}, a la vista: ${ayuda.tituloALaVista} · axe: ${JSON.stringify([...axeConLaAyuda, ...axeConLasFuentes])} · Escape la cierra: ${cerroLaAyuda} · foco después: «${focoDespues}»`,
    );
    const reglasEnPantalla = [...new Set(todasLasFilas.map((f) => f.regla))];
    comprobar(
      'E-62',
      '«De dónde sale» cada hecho está en la ayuda, plegado y una vez por regla: todas las reglas de los hechos que hay en pantalla tienen su fuente («Sale de…»), y ningún renglón de las tarjetas la repite',
      ayuda.fuentesPlegadas === true && reglasEnPantalla.length >= 4 && reglasEnPantalla.every((r) => fuentes.some((f) => f.regla === r && f.aLaVista && /Sale de .+\.$/.test(f.texto))) && new Set(fuentes.map((f) => f.regla)).size === fuentes.length && !todasLasFilas.some((f) => /Sale de /.test(f.entero)),
      `en pantalla: ${reglasEnPantalla.join(', ')} · en la ayuda: ${fuentes.length} fuentes, p. ej. «${fuentes[0]?.texto ?? ''}»`,
    );

    // E-63 · La composición en otros anchos y con menos áreas ───────────────────────────────────────────────────
    const composicion = () =>
      page.evaluate(() => {
        const cajas = (s) => [...document.querySelectorAll(s)].map((e) => e.getBoundingClientRect()).map((r) => ({ x: Math.round(r.left), y: Math.round(r.top + scrollY), ancho: Math.round(r.width), fin: Math.round(r.bottom + scrollY) }));
        const porFila = (c) => {
          const filas = new Map();
          for (const e of c) filas.set(e.y, (filas.get(e.y) ?? 0) + 1);
          return [...filas.values()];
        };
        const [tarjetas, indicadores, preguntas] = [cajas('.area'), cajas('.indicador'), cajas('.preguntas-del-resumen__lista > li')];
        const caja = (s) => cajas(s)[0] ?? null;
        return { tarjetas: porFila(tarjetas), indicadores: porFila(indicadores), preguntas: porFila(preguntas), cajaDeTarjetas: tarjetas, cajaDeIndicadores: caja('.indicadores-del-resumen'), cajaDePreguntas: caja('.preguntas-del-resumen'), desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
    const porAncho = {};
    for (const ancho of [1440, 1280, 1024, 768, 390]) {
      await page.setViewport({ width: ancho, height: 900 });
      await pausa(500);
      porAncho[ancho] = await composicion();
    }
    const filas = (c) => `${c.tarjetas.join('+')} tarjetas · ${c.indicadores.join('+')} indicadores · ${c.preguntas.join('+')} preguntas · desborde ${c.desborde}`;
    comprobar(
      'E-63',
      'A 1440 y 1280 px van tres áreas y cuatro indicadores por fila, y las preguntas en un renglón; a 1024, dos áreas y la tercera debajo de lado a lado, y los indicadores y las preguntas de a dos; a 768 y 390 nada desborda (una tarjeta por fila)',
      [1440, 1280].every((a) => porAncho[a].tarjetas.join() === '3' && porAncho[a].indicadores.join() === '4' && porAncho[a].preguntas.join() === '4') &&
        porAncho[1024].tarjetas.join() === '2,1' && porAncho[1024].cajaDeTarjetas[2].ancho > porAncho[1024].cajaDeTarjetas[0].ancho * 1.8 && porAncho[1024].indicadores.join() === '2,2' && porAncho[1024].preguntas.join() === '2,2' &&
        porAncho[768].tarjetas.join() === '1,1,1' && porAncho[390].tarjetas.join() === '1,1,1' && porAncho[390].indicadores.join() === '1,1,1,1' &&
        Object.values(porAncho).every((c) => c.desborde <= 1 && c.cajaDeIndicadores.y >= c.cajaDeTarjetas.at(-1).fin && c.cajaDePreguntas.y >= c.cajaDeIndicadores.fin),
      Object.entries(porAncho).map(([a, c]) => `${a}: ${filas(c)}`).join(' | '),
    );
    await page.setViewport({ width: 1440, height: 900 });
    await pausa(400);
    // Lo que pasó con el asesorado A, antes de mirar otras fichas (un área sin acceso responde «no disponible» a propósito).
    const erroresConA = [...v.errores];
    const malasConA = [...v.malas];

    // Accesibilidad con la cobertura abierta, en los dos temas, y el minigráfico en Azul noche.
    await abrirDetalles(page, '.area[data-area="NUTRICION"] details.area__periodo');
    const temaInicial = await page.evaluate(() => document.documentElement.dataset.tema);
    const violaciones = {};
    const enCadaTema = {};
    for (const tema of ['claro', 'azul-noche']) {
      await ponerTema(page, tema);
      await pausa(300);
      violaciones[tema] = await axe(page);
      enCadaTema[tema] = (await leerIndicadores()).map((i) => ({ puntos: i.grafico?.puntos, delColor: i.grafico?.delColorDeLaMetrica }));
    }
    await ponerTema(page, temaInicial);
    comprobar(
      'PRO-22',
      'El Resumen por área, con la cobertura abierta: axe no encuentra faltas de WCAG 2.2 AA en ninguno de los dos temas, y los minigráficos se dibujan igual, con el color de las métricas de cada tema',
      violaciones.claro.length === 0 && violaciones['azul-noche'].length === 0 && JSON.stringify(enCadaTema.claro) === JSON.stringify(enCadaTema['azul-noche']) && enCadaTema.claro.every((g, n) => g.puntos === graficosEsperados[n].puntos && g.delColor === true),
      JSON.stringify(violaciones),
    );

    // E-63 · Con dos áreas y con una ──────────────────────────────────────────────────────────────────────
    await abrirResumen(FICHA_B);
    const deB = { ...(await composicion()), areas: await page.$$eval('.area', (a) => a.map((x) => x.dataset.area)), preguntas: await textos(page, '.preguntas-del-resumen__lista a') };
    comprobar(
      'E-63',
      'Con dos áreas (el asesorado B, sin Entrenamiento): dos tarjetas y, en la columna que queda libre a su lado, las preguntas; debajo, los indicadores. No hay tarjeta de Entrenamiento ni se ofrece la pregunta del ejercicio (E-60)',
      deB.areas.join() === 'NUTRICION,ANTROPOMETRIA' && deB.tarjetas.join() === '2' && !!deB.cajaDePreguntas && deB.cajaDePreguntas.y === deB.cajaDeTarjetas[0].y && deB.cajaDePreguntas.x > deB.cajaDeTarjetas[1].x && deB.cajaDeIndicadores.y >= deB.cajaDeTarjetas[0].fin && deB.preguntas.length === 3 && !deB.preguntas.some((p) => /ejercicio/.test(p)) && deB.desborde <= 1,
      `${deB.areas.join(', ')} · preguntas: ${deB.preguntas.join(' · ')} · ${JSON.stringify({ tarjetas: deB.cajaDeTarjetas.map((c) => [c.x, c.y]), preguntas: deB.cajaDePreguntas, indicadores: deB.cajaDeIndicadores })}`,
    );
    if (FICHA_E) {
      await abrirResumen(FICHA_E);
      const deE = { ...(await composicion()), areas: await page.$$eval('.area', (a) => a.map((x) => x.dataset.area)), sinMas: await texto(page, '.indicadores__sin-mas'), corte: await texto(page, '.area .area__corte') };
      comprobar(
        'E-63',
        'Con una sola área (el escenario E): su tarjeta a la izquierda y, a su costado, los indicadores y debajo las preguntas; se dice que no hay más indicadores con datos; sin revisiones, el alcance es el período y la cobertura está a la vista',
        deE.areas.join() === 'NUTRICION' && deE.cajaDeIndicadores.x > deE.cajaDeTarjetas[0].x + deE.cajaDeTarjetas[0].ancho - 1 && Math.abs(deE.cajaDeIndicadores.y - deE.cajaDeTarjetas[0].y) <= 4 && deE.cajaDePreguntas.y >= deE.cajaDeIndicadores.fin && deE.cajaDePreguntas.x >= deE.cajaDeIndicadores.x - 1 && /Sin más indicadores con datos en este período\./.test(deE.sinMas) && deE.corte.startsWith('En el período seleccionado · sin revisiones registradas') && (await page.$$eval('.area details.area__periodo', (d) => d.length)) === 0 && (await page.$$eval('.area .observacion[data-regla="COBERTURA_NUTRICIONAL"]', (o) => o.filter((x) => x.checkVisibility()).length)) === 1 && deE.desborde <= 1,
        `${deE.areas.join(', ')} · «${deE.corte}» · «${deE.sinMas}» · ${JSON.stringify({ tarjeta: deE.cajaDeTarjetas[0], indicadores: deE.cajaDeIndicadores, preguntas: deE.cajaDePreguntas })}`,
      );
    } else {
      informar('E-63', 'Una sola área', 'este juego de datos no tiene el escenario E');
    }
    // La prueba de la prueba de «sin la biblioteca de gráficos»: al abrir Analizar con una métrica, sus guiones sí se
    // piden, y la misma lista los detecta.
    await cupo(v, 60);
    await ir(page, `${FICHA_A}&vista=analizar&m=nutricion.energia&p=30`);
    await quieto(page, v);
    await page.waitForSelector('figure.grafico__figura .recharts-surface', { timeout: 20_000 }).catch(() => {});
    const despuesDeAnalizar = guiones.filter((g) => conLaBiblioteca.includes(g));
    comprobar('E-54', 'La misma medición detecta la biblioteca de gráficos cuando se abre «Analizar» (la prueba de la prueba)', despuesDeAnalizar.length > 0, despuesDeAnalizar.join(', ') || 'no se cargó ninguno');
    await abrirResumen(FICHA_A);
    comprobar(
      'PRO-25',
      'Sin errores de JavaScript durante el recorrido del Resumen por área, ni respuestas con error de la API con el asesorado A',
      v.errores.length === 0 && malasConA.length === 0,
      [...new Set([...erroresConA, ...v.errores, ...malasConA])].slice(0, 4).join(' · ') || 'ninguno',
    );
  }
}

/**
 * El Resumen por área y Analizar recompuesto, en una misma sesión (una sola entrada de la cuenta: el límite es de cinco
 * cada quince minutos). La parte del Resumen va primero, con la ficha recién abierta: ahí se mira qué guiones cargó.
 * El modo funcional corre las dos antes del encabezado; `resumen` y `analizar` corren una sola.
 */
async function fichaRecompuesta({ resumen = true, analizar = true } = {}) {
  const { navegador, page, v } = await abrir();
  // Los guiones que pide la página, desde antes de entrar: para saber con qué se cargó la ficha.
  const guiones = [];
  page.on('request', (r) => {
    if (r.resourceType() === 'script') guiones.push(new URL(r.url()).pathname.split('/').pop());
  });
  try {
    await iniciarSesion(page, v, estado.proCorreo, FICHA_A);
    await quieto(page, v);
    if (resumen) await resumenPorArea(page, v, guiones);
    if (resumen && analizar) {
      // Cada parte responde por sus propios errores.
      v.errores.length = 0;
      v.malas.length = 0;
    }
    if (analizar) await analizarRecompuesto(page, v);
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
    // Desde la parte 2 son filas, una debajo de otra (C-19): una sola columna, y todas con el mismo ancho y alto.
    const iguales = (m) => m.cantidad === 4 && m.columnas === 1 && m.anchos.length === 1 && m.altos.length === 1;
    const tarjetas = {};
    for (const ancho of [1440, 1280, 1024]) {
      await page.setViewport({ width: ancho, height: 900 });
      await pausa(400);
      tarjetas[ancho] = await medirTarjetas();
    }
    // La prueba de la prueba: sin el arreglo (cada fila con el alto de su texto), la medición encuentra una más baja.
    // Se hace a 1024 px, donde las bajadas de las preguntas ocupan distinta cantidad de renglones.
    const soltar = await page.addStyleTag({ content: '.preguntas-profesionales__lista { grid-auto-rows: auto !important; } .preguntas-profesionales__lista > li { display: block !important; } .tarjeta-de-pregunta { height: auto !important; min-height: 0 !important; }' });
    await pausa(300);
    const sueltas = await medirTarjetas();
    await soltar.evaluate((e) => e.remove());
    await page.setViewport({ width: 1440, height: 900 });
    await pausa(400);
    comprobar(
      'E-18',
      'Las cuatro filas de «Empezar por una pregunta» miden lo mismo, una debajo de otra, a 1440, 1280 y 1024 px',
      Object.values(tarjetas).every(iguales),
      JSON.stringify(tarjetas),
    );
    comprobar('E-18', 'La medición de las filas detecta una más baja que las otras, como estaban antes (la prueba de la prueba)', !iguales(sueltas) && sueltas.altos.length > 1, JSON.stringify(sueltas));

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
  if (modo === 'analizar') await fichaRecompuesta({ resumen: false });
  if (modo === 'resumen') await fichaRecompuesta({ analizar: false });
} catch (e) {
  comprobar('—', 'El recorrido terminó por una excepción', false, e instanceof Error ? e.message : String(e));
} finally {
  const fallas = resultados.filter((r) => !r.ok);
  fs.writeFileSync(new URL(`resultado-${modo}.json`, DIR), JSON.stringify({ modo, inicio: inicio.toISOString(), fin: new Date().toISOString(), hoy, total: resultados.length, fallas: fallas.length, resultados }, null, 2));
  console.log(`\n${resultados.length - fallas.length}/${resultados.length} comprobaciones bien${fallas.length ? `; fallan: ${fallas.map((f) => f.pro).join(', ')}` : ''}`);
  process.exitCode = fallas.length ? 1 : 0;
}
