// Recorrido real del entorno profesional (encargo §18; ACEPTACION.md): Chrome contra la web y la API locales, con los datos
// sintéticos de `datos/regenerar.sh`. Interactúa con los controles y comprueba resultados; las capturas complementan.
//
// Uso: node recorrido.mjs [funcional|capturas|todo|descartable]   (lee trabajo/estado.json; escribe trabajo/recorrido/)
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
  await pausa(150);
  const png = await page.screenshot({ encoding: 'base64' });
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
 */
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
    x.svg && x.ancho > 100 && x.alto > 80 && x.ejeX > 1 && x.ejeY > 1 && x.curvas >= curvas && x.marcas > 0 && x.visibles > 0 && x.tapadas === 0 && (!banda || x.banda) && p[i].tinta > 0.01 && (colores?.[i] ?? []).every((c) => p[i].porMetrica[c - 1] >= 100);
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
    comprobar('PRO-11', 'La media de energía no cuenta el día en curso y dice sus subtotales', /sin contar hoy/.test(ind[0]) && /subtotal/.test(ind[0]), ind[0]);
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
    comprobar('PRO-07', 'Cada panel conserva su unidad (kcal, g, kg)', /kcal/.test(titulos[0]) && /\(g\)/.test(titulos[1]) && /kg/.test(titulos[2]));
    await comprobarGraficos(page, 'PRO-08', 'Paneles: los tres gráficos están dibujados y a la vista (ejes, curvas, marcas sin tapar y el color de cada métrica)', { figuras: 3, colores: [[1], [2], [3]] });
    const modos = await page.$$eval('.modo-elegible', (m) => m.map((x) => ({ deshabilitado: x.querySelector('input').disabled, texto: x.innerText.replace(/\s+/g, ' ') })));
    comprobar('PRO-08', 'Superponer kcal, g y kg se bloquea y dice por qué', modos[1].deshabilitado && /unidades distintas/.test(modos[1].texto), modos[1].texto);
    comprobar('PRO-08', 'Sin observaciones del peso en la referencia, el cambio relativo se bloquea y lo dice', modos[2].deshabilitado && /Peso: no tiene observaciones/.test(modos[2].texto), modos[2].texto);

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
    await clic(page, '.panel-de-lectura button', 'Ver el origen de este dato');
    await page.waitForSelector('dialog[open]');
    await quieto(page, v);
    const origen = await texto(page, 'dialog[open]');
    comprobar('PRO-26', 'El punto de energía de hoy abre su registro de comida', /n = 1/.test(origen) && /Ver en Nutrición/.test(origen), origen.slice(0, 200));
    await clic(page, 'dialog[open] button', 'Cerrar');
    await page.waitForFunction(() => !document.querySelector('dialog[open]'));
    comprobar('PRO-05', 'Al cerrar el origen, la vista sigue igual (período, métricas, modo y fecha)', page.url() === urlAnalisis);

    // A la pestaña del dominio y de vuelta con «Atrás».
    await clic(page, '.panel-de-lectura button', 'Ver el origen de este dato');
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
    const porDia = await filaDeComparacion(page, 'Energía');
    // WP-DASHBOARD-COMPRENSION: «Grano» pasó a «Agrupar por» y sus opciones a «Cada registro», «Día» y «Semana».
    await clic(page, '.analizar__opciones label', 'Semana');
    await quieto(page, v);
    const porSemana = await filaDeComparacion(page, 'Energía');
    const lecturaSemanal = await texto(page, '.panel-de-lectura');
    // Lo esperado, a mano: la media de los días con valor (sin el día en curso) de cada rango, de la serie diaria de la API.
    const diaria = (await leerApi(v, `/advisees/${estado.aseId}/projections/NUTRITION_PRESCRIBED_VS_RECORDED?metric=ENERGY&grain=DAY&periodStart=${diaMenos(hoy, 89)}&periodEnd=${hoy}`)).data.result.recorded.points;
    const esperado = (r) => {
      const delRango = diaria.filter((p) => p.date >= r.desde && p.date <= r.hasta);
      const dias = delRango.filter((p) => p.value !== null && !p.partialBucket);
      const media = dias.reduce((t, p) => t + p.value, 0) / dias.length;
      return `${dominio.nutrienteParaMostrar({ value: String(media) }, dominio.NUTRIENTE_DE_LA_METRICA.ENERGY)} kcal · n = ${dominio.numero(dias.length)} de ${dominio.numero(delRango.length)}`;
    };
    const [eA, eB] = [esperado(A), esperado(B)];
    comprobar(
      'PRO-18',
      'Por semana, la comparación de dos rangos que cortan semanas es la misma que por día y coincide con la media de los días calculada a mano',
      porDia.length > 0 && porDia === porSemana && porDia.includes(eA) && porDia.includes(eB) && /semana del/.test(lecturaSemanal),
      `esperado A «${eA}», B «${eB}» · por día «${porDia.slice(0, 150)}» · por semana igual: ${porDia === porSemana ? 'sí' : `no («${porSemana.slice(0, 150)}»)`}`,
    );
    await comprobarGraficos(page, 'PRO-08', 'Por semana: el gráfico semanal está dibujado y a la vista', { figuras: 1, colores: [[1]] });
    await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent('nutricion.proteinas')}&modo=R`);
    await quieto(page, v);
    const refDia = await texto(page, '.referencias');
    // WP-DASHBOARD-COMPRENSION: «Grano» pasó a «Agrupar por» y sus opciones a «Cada registro», «Día» y «Semana».
    await clic(page, '.analizar__opciones label', 'Semana');
    await quieto(page, v);
    const refSemana = await texto(page, '.referencias');
    comprobar('PRO-08', 'Por semana, la referencia del cambio relativo es la misma que por día (los días de su rango, no las semanas)', refDia.length > 0 && refDia === refSemana, refDia.slice(0, 160));
    await comprobarGraficos(page, 'PRO-08', 'Cambio relativo por semana: dibujado y a la vista, con la banda de la referencia', { figuras: 1, banda: true, colores: [[1]] });

    // Superposición compatible: dos macronutrientes en gramos comparten un gráfico, con trazos distintos.
    await cupo(v);
    await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent('nutricion.proteinas,nutricion.carbohidratos')}&modo=S`);
    await quieto(page, v);
    const superpuestas = await textos(page, '.grafico__titulo');
    const leyenda = await texto(page, '.leyenda');
    comprobar(
      'PRO-08',
      'Proteínas y carbohidratos (misma familia y unidad) se superponen en un solo gráfico, con trazos distintos',
      superpuestas.length === 1 && /Superpuestas en valores reales \(g\)/.test(superpuestas[0]) && /línea continua/.test(leyenda) && /línea rayada/.test(leyenda),
      `${superpuestas.join(' | ')} · ${leyenda.slice(0, 160)}`,
    );
    await comprobarGraficos(page, 'PRO-08', 'Superpuestas: un gráfico con las dos curvas dibujadas y a la vista, cada una con su color', { figuras: 1, curvas: 2, colores: [[1, 2]] });

    // Dos etapas, con el mismo criterio y sin conclusiones causales. Desde WP-DASHBOARD-COMPRENSION son las etapas reales
    // del plan (las versiones activadas), con la pregunta «¿Qué cambió entre dos etapas?».
    await ir(page, `${FICHA_A}&vista=analizar&pregunta=comparar-etapas&area=NUTRICION&etapaA=${estado.nutricion.planV1}&etapaB=${estado.nutricion.planV2}`);
    await quieto(page, v);
    const comparacion = await texto(page, '.comparacion-de-etapas');
    comprobar(
      'PRO-18',
      'La comparación de dos etapas dice criterio, cobertura, duración y diferencia, sin causas',
      /B − A/.test(comparacion) && /\d+ de \d+ días con valor/.test(comparacion) && /Duración/.test(comparacion) && !/mejor|peor|gracias a|provoc|causó/i.test(comparacion),
      comparacion.slice(0, 260),
    );
    // La exportación es de lo que se ve en el lienzo: se vuelve a las tres métricas.
    await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent(TRES)}`);
    await quieto(page, v);

    // Exportación de lo que se ve.
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
    await clic(page, '.periodo-del-seguimiento__opciones button', '7 días');
    await pausa(150);
    await clic(page, '.periodo-del-seguimiento__opciones button', '90 días');
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

// ─── Capturas: cinco anchos, dos temas y las tres vistas ───────────────────────────────────────

async function capturas() {
  const { navegador, page, v } = await abrir();
  try {
    await iniciarSesion(page, v, estado.proCorreo, FICHA_A);
    await quieto(page, v);
    for (const tema of ['azul-noche', 'claro']) {
      await page.select('.apariencia select', tema);
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
          const acciones = await page.evaluate(() => ({
            pestanas: document.querySelectorAll('nav[aria-label="Vistas del seguimiento"] a').length,
            periodos: document.querySelectorAll('.periodo-del-seguimiento__opciones button').length,
          }));
          comprobar('PRO-23', `${vista} a ${ancho} px en ${tema}: sin desborde de costado, con pestañas y períodos`, (await sinDesborde(page)) && acciones.pestanas === 3 && acciones.periodos === 5);
          if (vista === 'analizar') comprobar('PRO-08', `La captura de analizar a ${ancho} px en ${tema} tiene los tres gráficos dibujados (y siguen después)`, c.figuras === 3 && c.dibujadas === 3 && c.despues === 3, `${c.dibujadas} de ${c.figuras} dibujados; ${c.despues} después`);
        }
        // En escritorio, los tres modos, comprobados en el dibujo y en píxeles, y capturados (revisión de #153, hallazgo 1).
        if (ancho >= 1280) {
          await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent(TRES)}`);
          await quieto(page, v);
          await comprobarGraficos(page, 'PRO-08', `Paneles a ${ancho} px en ${tema}: los tres dibujados y a la vista`, { figuras: 3, colores: [[1], [2], [3]] });
          for (const [modo, letra, opciones] of [
            ['superpuestas', 'S', { figuras: 1, curvas: 2, colores: [[1, 2]] }],
            ['relativo', 'R', { figuras: 1, curvas: 2, banda: true, colores: [[1, 2]] }],
          ]) {
            await cupo(v);
            await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent('nutricion.proteinas,nutricion.carbohidratos')}&modo=${letra}`);
            await quieto(page, v);
            await comprobarGraficos(page, 'PRO-08', `${modo === 'relativo' ? 'Cambio relativo' : 'Superpuestas'} a ${ancho} px en ${tema}: dibujado y a la vista`, opciones);
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
      await pro.page.select('.apariencia select', tema);
      await pausa(300);
      await ir(pro.page, URL_D);
      await quieto(pro.page, pro.v);
      const { d: dib } = await comprobarGraficos(pro.page, 'PRO-10', `Peso e IMC en ${tema}: los dos gráficos dibujados y a la vista`, { figuras: 2, colores: [[1], [2]] });
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
    await abrirDetalles(pro.page, 'details.tabla-de-datos');
    const tabla = await texto(pro.page, 'details.tabla-de-datos');
    // WP-DASHBOARD-COMPRENSION: calculado no es siempre estimado; el IMC es un índice y la tabla lo dice.
    comprobar('PRO-10', 'La tabla de datos marca el peso reportado y el IMC calculado (un índice, no una estimación); lo medido va sin marca', /80,5 kg \(reportado por la persona, no medido\)/.test(tabla) && /\(calculado: un índice calculado sobre medidas, no una estimación\)/.test(tabla) && /81,2 kg(?! \()/.test(tabla), tabla.slice(0, 260));
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
    await clic(pro.page, '.panel-de-lectura button', 'Ver el origen de este dato');
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
    await clic(pro.page, '.panel-de-lectura button', 'Ver el origen de este dato');
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
} catch (e) {
  comprobar('—', 'El recorrido terminó por una excepción', false, e instanceof Error ? e.message : String(e));
} finally {
  const fallas = resultados.filter((r) => !r.ok);
  fs.writeFileSync(new URL(`resultado-${modo}.json`, DIR), JSON.stringify({ modo, inicio: inicio.toISOString(), fin: new Date().toISOString(), hoy, total: resultados.length, fallas: fallas.length, resultados }, null, 2));
  console.log(`\n${resultados.length - fallas.length}/${resultados.length} comprobaciones bien${fallas.length ? `; fallan: ${fallas.map((f) => f.pro).join(', ')}` : ''}`);
  process.exitCode = fallas.length ? 1 : 0;
}
