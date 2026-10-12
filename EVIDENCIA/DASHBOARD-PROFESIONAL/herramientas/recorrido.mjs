// Recorrido real del entorno profesional (encargo §18; ACEPTACION.md): Chrome contra la web y la API locales, con los datos
// sintéticos de `datos/regenerar.sh`. Interactúa con los controles y comprueba resultados; las capturas complementan.
//
// Uso: node recorrido.mjs [funcional|capturas|todo|descartable|menu|analizar|resumen|linea|espacio|areas|registros|sesiones|estimacion]   (lee trabajo/estado.json; escribe trabajo/recorrido/)
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
// - El Resumen por área (WP-ESCRITORIO-AMABLE, parte 3), la Línea de tiempo por día (parte 4) y la composición de
//   Analizar con el lenguaje de sus gráficos (parte 2) se comprueban en `resumenPorArea`, `lineaPorDia` y
//   `analizarRecompuesto`, las tres en una misma sesión propia (`fichaRecompuesta`), antes del encabezado. `resumen`,
//   `linea` y `analizar` corren una sola de las tres partes.
// - El Espacio profesional (parte 5: los pendientes con sus vistas, el directorio y los dos diálogos) se comprueba en
//   `espacioProfesional`, al final de esa misma sesión; sola, con `espacio`. Los tipos de pendiente que el escenario no
//   tiene se miran con una respuesta simulada en el navegador (`cartera-simulada.mjs`). Una cuenta sin asesorados se
//   mira en la sesión del tercero; el envío de una solicitud y el aviso de vista parcial real, en `descartable`.
// - El marco de las pestañas de área (WP-ESCRITORIO-AREAS, parte 0: Nutrición, Entrenamiento, Antropometría e
//   Información) se comprueba en `marcoDeLasAreas`, al final de esa misma sesión; solo, con `areas`. Un área que deja
//   de poder leerse se mira ahí con respuestas simuladas en el navegador, y con una revocación real en `descartable`.
// - Nutrición · Registros por día (WP-ESCRITORIO-AREAS, parte 1) se comprueba en `registrosDeNutricion`, en esa misma
//   sesión; solo, con `registros`. Lo esperado sale de las dos lecturas de la API, calculado a mano.
// - Entrenamiento · Registros por sesión (WP-ESCRITORIO-AREAS, parte 2) se comprueba en `sesionesDeEntrenamiento`, en
//   esa misma sesión; solo, con `sesiones`. Lo esperado sale del contexto de revisión, del plan de cada versión y de la
//   lista de versiones, calculado a mano.
// - Antropometría · Tomas (WP-ESCRITORIO-AREAS, parte 3) se comprueba en `tomasDeAntropometria`, en esa misma sesión;
//   solo, con `tomas`. Lo esperado sale de la lista entera, del detalle de cada toma, de los cálculos y de los métodos,
//   calculado a mano (`esperadoDeTomas`). Lo que ESCRIBE —corregir, anular, calcular y dejar una referencia— va en
//   `medicionesDeUnaToma`: corre solo, con `mediciones`, sobre las cuentas descartables con la toma del perfil completo
//   (`datos/generar.mjs descartable-toma-completa`), y no toca los datos de A, B ni C.
// - La estimación del profesional sobre una comida diferente (`estimacionDeUnaComida`) ESCRIBE en el escenario: no va
//   dentro de `funcional`. Corre sola, con `estimacion`, y última en la pasada completa.
// - `descartable` usa las cuentas descartables de `datos/generar.mjs descartable-cuentas` y `descartable-datos`
//   (valores medidos, informados y estimados; revocación desde la web del asesorado).
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { carteraSimulada } from './cartera-simulada.mjs';
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
    // Una respuesta armada por el recorrido, para mirar una pantalla con datos que el escenario no tiene.
    if (regla.accion === 'entregar') return req.respond({ status: 200, headers: CORS, contentType: 'application/json; charset=utf-8', body: JSON.stringify(regla.cuerpo) });
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
 * La línea de tiempo por día (WP-ESCRITORIO-AMABLE, parte 4). La cuenta de la cabecera dice «N hechos en el período» sin
 * filtros y «N hechos coinciden» con ellos; desde mil lleva punto de miles.
 */
const cuentaDeLaLinea = async (page) => {
  const escrito = await texto(page, 'section.linea p[role="status"]');
  if (/^Un hecho /.test(escrito)) return 1;
  const leido = /^([\d.]+) hechos (?:en el período|coinciden)/.exec(escrito);
  return leido ? Number(leido[1].replace(/\./g, '')) : NaN;
};
/**
 * Los hechos de la lista. Las comidas de un grupo cerrado están en el documento, ocultas: se cuentan por su
 * identificador. `anunciados` es lo que se ve sin abrir nada (un renglón por hecho suelto y la cantidad que dice cada
 * grupo): tiene que sumar lo mismo.
 */
const hechosDeLaLinea = (page) =>
  page.evaluate(() => {
    const filas = [...document.querySelectorAll('.linea-de-tiempo .entrada')];
    const grupos = [...document.querySelectorAll('.grupo-de-hechos')];
    return {
      ids: filas.map((e) => e.dataset.id),
      areas: filas.map((e) => e.dataset.area),
      anunciados: document.querySelectorAll('.linea-de-tiempo__hechos > .entrada').length + grupos.reduce((n, g) => n + Number(/(\d+) registradas/.exec(g.querySelector('.grupo-de-hechos__cabecera').innerText)?.[1] ?? NaN), 0),
    };
  });
/** Toca «Ver días anteriores» hasta que no queden tandas. Devuelve cuántas tandas se leyeron. */
async function verTodosLosDias(page, v, maximo = 12) {
  let tandas = 1;
  for (; tandas < maximo; tandas++) {
    const hay = await page.evaluate(() => [...document.querySelectorAll('.linea__mas button')].some((b) => b.textContent.startsWith('Ver días anteriores')));
    if (!hay) break;
    await cupo(v);
    await clic(page, '.linea__mas button', 'Ver días anteriores');
    await quieto(page, v);
  }
  return tandas;
}

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
/**
 * El origen de un dato de Analizar (WP-ESCRITORIO-AMABLE, C-13). En una ventana ancha va al costado, en el lugar de la
 * lectura (`aside.origen-del-dato`); en una angosta, encima, en el panel de siempre (`dialog.dialogo--panel[open]`).
 * Estas piezas abren, leen y cierran el que haya: así cada comprobación sigue protegiendo lo suyo a cualquier ancho.
 */
const ORIGEN = 'aside.origen-del-dato, dialog.dialogo--panel[open]';
const enElOrigen = (s) => ORIGEN.split(', ').map((o) => `${o} ${s}`).join(', ');
async function abrirOrigen(page) {
  const marca = await clic(page, '.panel-de-lectura button', 'Ver origen');
  await page.waitForSelector(ORIGEN, { timeout: 15_000 });
  return marca;
}
/** Vuelve del origen a la lectura: «Volver a la lectura» si está al costado; «Cerrar» si es el panel. */
async function cerrarOrigen(page) {
  const alCostado = !!(await page.$('aside.origen-del-dato'));
  await clic(page, enElOrigen('button'), alCostado ? 'Volver a la lectura' : 'Cerrar');
  await page.waitForFunction((s) => !document.querySelector(s), { timeout: 10_000 }, ORIGEN);
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
  // La marca que quedó en el elemento: sirve para comprobar después que el foco volvió a él.
  return marca;
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
    // Parte 4: los hechos se leen por día y las comidas de un día van en un renglón. Lo que protegía esta comprobación
    // (los últimos hechos del período, a mano) se mira en lo que la lista anuncia sin abrir nada, que tiene que ser lo
    // mismo que tiene adentro.
    const alLlegar = await hechosDeLaLinea(page);
    comprobar(
      'PRO-02',
      'Los últimos hechos del período están a un clic del Resumen: la línea de tiempo anuncia al menos seis, y son los que tiene',
      alLlegar.anunciados >= 6 && alLlegar.anunciados === alLlegar.ids.length,
      `${alLlegar.anunciados} hechos anunciados en la primera lectura; ${alLlegar.ids.length} en la lista`,
    );
    const total = await cuentaDeLaLinea(page);
    const dias = await page.$$eval('.linea-de-tiempo__dia', (d) => d.map((x) => x.dataset.fecha));
    comprobar('PRO-03', 'Los días van por la fecha del hecho, del más reciente al más viejo', dias.length > 3 && dias.every((d, i) => i === 0 || d < dias[i - 1]) && dias[0] === hoy, `${dias.slice(0, 4).join(', ')}…`);
    // El día se escribe corto a la vista («10 oct», «sábado») y entero para el lector de pantalla, en el mismo título.
    const encabezado = await page.evaluate(() => {
      const h = document.querySelector('.linea-de-tiempo__dia h3');
      return { paraElLector: h?.querySelector('.visualmente-oculto')?.textContent ?? '', aLaVista: [...(h?.querySelectorAll('[aria-hidden="true"] > span') ?? [])].map((s) => s.textContent) };
    });
    comprobar(
      'PRO-17',
      'El día se nombra en castellano, con mayúscula solo al principio: entero para el lector de pantalla, y corto a la vista',
      /^[A-ZÁÉÍÓÚ][a-záéíóú]+, \d{1,2} de [a-z]+ de \d{4}$/.test(encabezado.paraElLector) && /^\d{1,2} [a-z]{3,4}$/.test(encabezado.aLaVista[0] ?? '') && /^[a-záéíóú]+$/.test(encabezado.aLaVista[1] ?? ''),
      `${encabezado.paraElLector} · ${encabezado.aLaVista.join(' / ')}`,
    );
    const tardia = await page.evaluate(() => {
      const e = [...document.querySelectorAll('.linea-de-tiempo__hechos > .entrada')].find((x) => x.innerText.includes('Cargado otro día') && x.innerText.includes('Toma'));
      return e ? { dia: e.closest('.linea-de-tiempo__dia').dataset.fecha, texto: e.innerText.replace(/\s+/g, ' ') } : null;
    });
    comprobar('PRO-03', 'La toma de ayer cargada hoy queda en el día de ayer, con su etiqueta «Cargado otro día»', tardia?.dia === diaMenos(hoy, 1), tardia?.texto ?? 'no está');
    // Las comidas de ayer van en un renglón, que anuncia lo que tiene adentro; abierto, cada una dice lo suyo.
    const deAyer = `.linea-de-tiempo__dia[data-fecha="${diaMenos(hoy, 1)}"]`;
    const grupoDeAyer = await texto(page, `${deAyer} .grupo-de-hechos__cabecera`);
    const aLaVistaCerrado = await page.evaluate((s) => [...document.querySelectorAll(`${s} .grupo-de-hechos .entrada`)].filter((e) => e.getClientRects().length > 0).length, deAyer);
    await page.click(`${deAyer} .grupo-de-hechos__cabecera`);
    await pausa(200);
    const ayer = await page.evaluate((s) => [...document.querySelectorAll(`${s} .grupo-de-hechos .entrada`)].filter((e) => e.getClientRects().length > 0).map((e) => e.innerText.replace(/\s+/g, ' ')), deAyer);
    const horasDeAyer = ayer.map((t) => /^\d{2}:\d{2}/.exec(t)?.[0] ?? '');
    comprobar(
      'E-66',
      'Las comidas de ayer van en un renglón que dice cuántas son y lo que tienen de distinto (una anulada, una rectificada); cerrado no muestra ninguna, y abierto las muestra todas, del desayuno a la cena',
      /Comidas 4 registradas/.test(grupoDeAyer) && /1 anulada/.test(grupoDeAyer) && /1 rectificada/.test(grupoDeAyer) && aLaVistaCerrado === 0 && ayer.length === 4 && horasDeAyer.every((h, i) => h !== '' && (i === 0 || h >= horasDeAyer[i - 1])),
      `${grupoDeAyer} · cerrado: ${aLaVistaCerrado} a la vista · abierto: ${horasDeAyer.join(', ')}`,
    );
    const almuerzos = ayer.filter((t) => /Almuerzo/.test(t));
    comprobar('PRO-16', 'El almuerzo rectificado es una sola entrada, marcada «Rectificado»', almuerzos.length === 1 && /Rectificado/.test(almuerzos[0]), almuerzos.join(' || '));
    comprobar('PRO-16', 'La merienda anulada sigue en la historia, marcada «Anulado»', ayer.filter((t) => /Merienda/.test(t) && /Anulado/.test(t)).length === 1);

    // Filtros combinados y paginación completa y estable. La combinación libre está en «Más filtros».
    await clic(page, '.vistas-de-la-linea button', 'Más filtros');
    await page.waitForSelector('.filtros-de-linea fieldset button.chip', { timeout: 5_000 });
    await clic(page, '.filtros-de-linea fieldset button.chip', 'Nutrición');
    await quieto(page, v);
    await elegir(page, '.filtros-de-linea', 'Tipo de hecho', 'MEAL_RECORDED');
    await quieto(page, v);
    const p2 = parametros(page);
    const filtrado = await cuentaDeLaLinea(page);
    comprobar('PRO-04', 'Área y tipo combinados quedan en la URL y reducen el conjunto', p2.get('areas') === 'NUTRITION' && p2.get('tipos') === 'MEAL_RECORDED' && filtrado > 50 && filtrado < total, `${filtrado} de ${total}`);
    await verTodosLosDias(page, v);
    const completo = await hechosDeLaLinea(page);
    comprobar(
      'PRO-04',
      '«Ver días anteriores» completa el conjunto sin repetir ni perder entradas, todas de Nutrición, y lo que anuncian los renglones suma lo mismo',
      completo.ids.length === filtrado && new Set(completo.ids).size === completo.ids.length && completo.areas.length > 0 && completo.areas.every((a) => a === 'NUTRITION') && completo.anunciados === filtrado,
      `${completo.ids.length} entradas, ${new Set(completo.ids).size} distintas, ${completo.anunciados} anunciadas`,
    );

    // El detalle, al costado, y la vuelta con la posición. El renglón entero abre: no hay un «Abrir registro» aparte.
    const yAntes = await page.evaluate(() => {
      const filas = [...document.querySelectorAll('.entrada__fila')].filter((b) => b.getClientRects().length > 0);
      const ultima = filas[filas.length - 1];
      ultima.scrollIntoView({ block: 'center' });
      ultima.setAttribute('data-recorrido', 'ultimo');
      return window.scrollY;
    });
    const urlAntes = page.url();
    await page.click('[data-recorrido="ultimo"]');
    await page.waitForSelector('.detalle-del-hecho');
    await quieto(page, v);
    const detalle = await texto(page, '.detalle-del-hecho');
    const conElDetalle = await page.evaluate(() => {
      const lista = document.querySelector('.linea-de-tiempo').getBoundingClientRect();
      const panel = document.querySelector('.detalle-del-hecho').getBoundingClientRect();
      return {
        modal: !!document.querySelector('dialog[open]'),
        alCostado: panel.left >= lista.right,
        elegido: document.querySelector('[data-recorrido="ultimo"]').getAttribute('aria-current'),
        focoEnElDetalle: !!document.activeElement?.closest('.detalle-del-hecho'),
        desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    comprobar('PRO-05', 'Un renglón abre el registro de comida de esa entrada, con cuándo ocurrió y cuándo se cargó', /Ver en Nutrición/.test(detalle) && /Ocurrió/.test(detalle) && /Se cargó/.test(detalle) && detalle.length > 80, detalle.slice(0, 160));
    comprobar(
      'E-70',
      'A 1440, el detalle se abre al costado y no tapa la lista: no es un diálogo, el renglón queda marcado, el foco pasa al detalle y la página no desborda',
      !conElDetalle.modal && conElDetalle.alCostado && conElDetalle.elegido === 'true' && conElDetalle.focoEnElDetalle && conElDetalle.desborde <= 1,
      JSON.stringify(conElDetalle),
    );
    a11y.registro = await axe(page);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.detalle-del-hecho'));
    await pausa(200);
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
    await page.type('.buscador-de-la-linea input[type="search"]', 'cena');
    // El botón de buscar es la lupa (su nombre, «Buscar», lo lleva el ícono): se toca, como lo haría una persona.
    const nombreDeLaLupa = await page.$eval('.buscador-de-la-linea button[type="submit"] svg', (s) => s.getAttribute('aria-label'));
    await page.click('.buscador-de-la-linea button[type="submit"]');
    await quieto(page, v);
    const conCena = await textos(page, '.entrada__titulo');
    const totalCena = await cuentaDeLaLinea(page);
    comprobar('PRO-04', 'La búsqueda recorre el período y no viaja en la URL de la página', nombreDeLaLupa === 'Buscar' && !page.url().includes('cena') && conCena.length > 0 && conCena.every((t) => /cena/i.test(t)), `${conCena.length} entradas; URL ${page.url().replace(WEB, '')}`);
    const paginasCena = await verTodosLosDias(page, v, 8);
    const deCena = await hechosDeLaLinea(page);
    const titulosCena = await textos(page, '.entrada__titulo');
    comprobar(
      'PRO-04',
      '«Ver días anteriores» con la búsqueda activa completa las coincidencias de todo el período, sin repetir, y cada una a la vista en su renglón',
      deCena.ids.length === totalCena && new Set(deCena.ids).size === deCena.ids.length && titulosCena.length === totalCena && titulosCena.every((t) => /cena/i.test(t)),
      `${deCena.ids.length} de ${totalCena} en ${paginasCena} página(s)`,
    );
    const urlsDeLaBusqueda = v.urls.slice(desdeUrl);
    const cuerposDeLaBusqueda = v.cuerpos.slice(desdeCuerpo).map((c) => JSON.parse(c));
    comprobar(
      'PRO-04',
      'El texto buscado viaja en el cuerpo de un POST (API-DSH-04-BUSQUEDA): ninguna URL de la API lo lleva, tampoco la de «Ver días anteriores»',
      urlsDeLaBusqueda.some((u) => u.startsWith('POST') && u.includes('/timeline/search')) &&
        !urlsDeLaBusqueda.some((u) => /cena/i.test(u)) &&
        cuerposDeLaBusqueda.length >= paginasCena &&
        cuerposDeLaBusqueda.every((c) => c.q === 'cena') &&
        (paginasCena === 1 || cuerposDeLaBusqueda.some((c) => typeof c.cursor === 'string')),
      `${urlsDeLaBusqueda.length} pedidos a la API durante la búsqueda, ninguno con el texto; ${cuerposDeLaBusqueda.length} POST con el texto en el cuerpo${cuerposDeLaBusqueda.some((c) => c.cursor) ? ' (los de «Ver días anteriores», con su cursor)' : ''}`,
    );
    await clic(page, 'button', 'Limpiar filtros');
    await quieto(page, v);
    const limpio = await cuentaDeLaLinea(page);
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
    await abrirOrigen(page);
    await quieto(page, v);
    const origen = await texto(page, ORIGEN);
    comprobar('PRO-26', 'El punto de energía de hoy abre su registro de comida', /n = 1/.test(origen) && /Ver en Nutrición/.test(origen), origen.slice(0, 200));
    await cerrarOrigen(page);
    comprobar('PRO-05', 'Al cerrar el origen, la vista sigue igual (período, métricas, modo y fecha)', page.url() === urlAnalisis);

    // A la pestaña del dominio y de vuelta con «Atrás».
    await abrirOrigen(page);
    await quieto(page, v);
    await clic(page, enElOrigen('a'), 'Ver en Nutrición');
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
    const tras = await cuentaDeLaLinea(page);
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
      // El Espacio profesional de esa cuenta (WP-ESCRITORIO-AMABLE, parte 5): sin asesorados, cada lista dice que está
      // vacía con sus palabras. Lo que tiene la cuenta se le pregunta a la API con su sesión.
      const cuenta = (await leerApi(v, '/me')).data;
      const suyos = (await leerApi(v, '/me/relationships')).data.filter((x) => x.professional.identityId === cuenta.identityId);
      const susEnvios = (await leerApi(v, '/me/relationship-requests')).data.filter((x) => x.professional.identityId === cuenta.identityId && x.initiatedBy === 'PROFESSIONAL');
      if (cuenta.actorCapabilities.includes('PROFESSIONAL_WORKSPACE') && suyos.length === 0) {
        await ir(page, '/pro');
        await page.waitForSelector('section.pendientes', { timeout: 30_000 });
        await quieto(page, v);
        const sinNadie = await espacioEnPantalla(page);
        const susPendientes = (await leerApi(v, '/me/portfolio?limit=50')).data.items.length;
        comprobar(
          'E-96',
          'Una cuenta profesional sin asesorados: «Nada pendiente con lo que BE puede saber…», las cinco vistas en cero, «Todavía no tenés asesorados activos en este contexto» y las solicitudes enviadas que dice la API. Cada lista dice que está vacía; ninguna es una falla',
          susPendientes === 0 &&
            sinNadie.vacio === 'Nada pendiente con lo que BE puede saber. Lo que no está registrado, no está acá.' &&
            sinNadie.vistas.length === 5 &&
            sinNadie.vistas.every((x) => x.cuenta === '0') &&
            sinNadie.filas.length === 0 &&
            sinNadie.falla === null &&
            sinNadie.sinCoincidencias === null &&
            sinNadie.directorioVacio === 'Todavía no tenés asesorados activos en este contexto.' &&
            sinNadie.personas.length === 0 &&
            sinNadie.fallaDelDirectorio === null &&
            sinNadie.solicitudes === `Solicitudes enviadas (${susEnvios.length})`,
          `${sinNadie.vacio} · ${sinNadie.vistas.map((x) => `${x.vista} ${x.cuenta}`).join(' · ')} · ${sinNadie.directorioVacio} · ${sinNadie.solicitudes}`,
        );
      } else {
        informar('E-96', 'Una cuenta profesional sin asesorados', `el tercero del escenario tiene ${suyos.length} vínculo(s) como profesional`);
      }
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
        /^Hitos de planificación \(activaciones, objetivos, revisiones\)$/.test(masAbierto.capas[1]) &&
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
    const ORDEN_DEL_PIE = [/^Tabla de datos \(\d+ fechas?\)$/, /^Resumen en texto$/, /^Hitos de planificación \(\d+\)$/, /^Comparar etapas$/, /^Cómo se calcula$/];
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
    await clic(page, '.pie-de-graficos button', 'Hitos de planificación (');
    await page.waitForSelector('.bajo-los-graficos .hitos li', { timeout: 5_000 });
    await pausa(300);
    const listados = await page.$$eval('.bajo-los-graficos .hitos li', (l) => l.length);
    const hitosAbiertos = await lineasDeHitos();
    await clic(page, '.pie-de-graficos button', 'Hitos de planificación (');
    await page.waitForFunction(() => !document.querySelector('.bajo-los-graficos'), { timeout: 5_000 });
    await pausa(300);
    const hitosVueltosACerrar = await lineasDeHitos();
    // WP-ESCRITORIO-AMABLE, parte 4: son los hitos de planificación. La línea de tiempo llama «hitos» también a las tomas
    // (que en un gráfico ya son puntos): acá no se listan, y la cantidad es la de la API sin ellas.
    const delPeriodo = (await leerApi(v, `/advisees/${estado.aseId}/timeline?periodStart=${diaMenos(hoy, 89)}&periodEnd=${hoy}&limit=1`)).data.periodCounts.byEventType;
    const dePlanificacion = delPeriodo.filter((x) => !['MEAL_RECORDED', 'TRAINING_SESSION_RECORDED', 'ANTHROPOMETRIC_EVALUATION_RECORDED'].includes(x.eventType)).reduce((n, x) => n + x.count, 0);
    const tomasDelPeriodo = delPeriodo.find((x) => x.eventType === 'ANTHROPOMETRIC_EVALUATION_RECORDED')?.count ?? 0;
    comprobar(
      'E-31',
      'Las líneas de los hitos de planificación no se dibujan con su lista cerrada; al abrirla, cada gráfico dibuja una por hito de la lista, y al cerrarla se van; son los de la API sin las tomas',
      listados > 0 && listados === dePlanificacion && tomasDelPeriodo > 0 && hitosCerrados.every((n) => n === 0) && hitosAbiertos.length === 2 && hitosAbiertos.every((n) => n === listados) && hitosVueltosACerrar.every((n) => n === 0),
      `${listados} hitos de planificación en la lista (la API: ${dePlanificacion}, y ${tomasDelPeriodo} tomas que no se listan) · líneas por gráfico: cerrada ${hitosCerrados.join('/')}, abierta ${hitosAbiertos.join('/')}, cerrada otra vez ${hitosVueltosACerrar.join('/')}`,
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
    // El botón aparece solo en las vistas que tienen su ayuda. Desde la parte 4 la tienen las tres: la del Resumen se
    // comprueba en `resumenPorArea` y la de la Línea de tiempo en `lineaPorDia`. Acá, que el marco tampoco crece allí.
    await cupo(v);
    await ir(page, `${FICHA_A}&vista=linea`);
    await quieto(page, v);
    const enLaLinea = await page.evaluate(() => ({
      boton: document.querySelector('.marco-de-la-ficha .como-se-lee__boton')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
      periodo: !!document.querySelector('.periodo-del-seguimiento__boton'),
      alto: Math.round(document.querySelector('.marco-de-la-ficha').getBoundingClientRect().height),
    }));
    comprobar(
      'E-47',
      'En Analizar, el marco de la ficha ofrece «Cómo se lee esta vista» sin crecer (143 px a 1440, 1280 y 1024; a 1024, el botón queda con su ícono y conserva su nombre); en la Línea de tiempo el botón también está, y el marco mide lo mismo',
      [1440, 1280, 1024].every((a) => marco[a].alto === 143 && marco[a].boton === 'Cómo se lee esta vista' && marco[a].desborde <= 1) && marco[1024].anchoDelBoton < 60 && marco[1440].anchoDelBoton > 120 && enLaLinea.boton === 'Cómo se lee esta vista' && enLaLinea.periodo && enLaLinea.alto === 143,
      `${JSON.stringify(marco)} · Línea de tiempo: ${JSON.stringify(enLaLinea)}`,
    );
    comprobar(
      'E-47',
      'La ayuda de Analizar se abre como un diálogo con su título, toma el foco, explica cada marca con su muestra y lo que la vista no dice; axe no encuentra faltas con ella abierta; Escape la cierra y el foco vuelve al botón',
      ayuda.titulo === 'Cómo se lee Analizar' && ayuda.renglones >= 10 && ayuda.muestras >= 10 && ayuda.focoAdentro && /No son ceros/.test(ayuda.texto) && /no indica que una cause la otra/.test(ayuda.texto) && /no se resta ni se califica/.test(ayuda.texto) && axeConLaAyuda.length === 0 && cerro && focoDespues === 'Cómo se lee esta vista',
      `${ayuda.titulo} · ${ayuda.renglones} renglones, ${ayuda.muestras} muestras · foco adentro: ${ayuda.focoAdentro} · axe: ${JSON.stringify(axeConLaAyuda)} · Escape la cierra: ${cerro} · foco después: «${focoDespues}»`,
    );
    // C-13 · De dónde sale un dato: en el lugar de la lectura, con lo que aporta cada comida ─────────────────
    // Un día terminado y completo que salga de varias comidas (entre 2 y 8 registros): sus fuentes las dice la API. Lo
    // que aporta cada una se lee aparte, registro por registro, con la misma operación que usa la pantalla.
    const conComidas = [...nut.recorded.points].reverse().find((p) => p.date !== hoy && p.value !== null && !p.partialBucket && p.quality !== 'PARTIAL' && p.sources.length >= 2 && p.sources.length <= 8 && !p.sourcesTruncated && p.sources.every((s) => s.type === 'MEAL_RECORD'));
    if (conComidas) {
      await page.setViewport({ width: 1440, height: 900 });
      await abrirAnalisis(`m=${encodeURIComponent(TRES)}&p=90&f=${conComidas.date}`);
      const registros = [];
      for (const s of conComidas.sources) registros.push((await leerApi(v, `/nutrition/meal-records/${s.id}`)).data);
      registros.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
      const kcalDe = (r) => (r.consumed && r.consumed.energyKcal.value !== null ? Number(r.consumed.energyKcal.value) : null);
      const suma = registros.reduce((t, r) => t + (kcalDe(r) ?? 0), 0);
      const opcionDe = (r) => (r.kind === 'PLAN_OPTION' && r.option ? r.option.label : `Comió algo diferente${r.description ? `: «${r.description}»` : ''}`);
      const filasEsperadas = registros.map((r) => `${r.meal?.label ?? ''}|${opcionDe(r)}|${kcalDe(r) === null ? '' : `${dominio.numero(Math.round(kcalDe(r)))} kcal`}`);
      const leerElOrigen = () =>
        page.evaluate(() => {
          const a = document.querySelector('aside.origen-del-dato');
          const d = document.querySelector('dialog.dialogo--panel[open]');
          const donde = a ?? d;
          const g = document.querySelector('.tarjeta-de-graficos')?.getBoundingClientRect();
          const r = a?.getBoundingClientRect();
          return {
            alCostado: !!a && !!g && !!r && r.left >= g.right - 1 && r.width >= 380,
            panel: !!d,
            graficos: [...document.querySelectorAll('figure.grafico__figura')].filter((f) => f.getClientRects().length > 0).length,
            lecturaALaVista: (document.querySelector('.panel-de-lectura')?.getClientRects().length ?? 0) > 0,
            titulo: a?.querySelector('h3')?.textContent.trim() ?? '',
            focoEnElTitulo: !!a && document.activeElement === a.querySelector('h3'),
            metrica: donde?.querySelector('.origen-del-dato__metrica')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
            valor: donde?.querySelector('.origen-del-dato__valor .dato-de-lectura__valor')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
            filas: [...(donde?.querySelectorAll('.fuente__fila') ?? [])].map((f) => ({
              hora: f.querySelector('.fuente__hora')?.textContent.trim() ?? '',
              comida: f.querySelector('.fuente__que strong')?.textContent.trim() ?? '',
              opcion: f.querySelector('.fuente__que > span')?.textContent.trim() ?? '',
              aporte: f.querySelector('.fuente__aporte')?.textContent.trim() ?? '',
            })),
            sinLeer: donde?.querySelectorAll('.fuente--sin-leer').length ?? 0,
            total: donde?.querySelector('.fuentes-del-dato__total')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
            chips: donde?.querySelectorAll('.selector-de-series .chip').length ?? 0,
            volver: a?.querySelector('.origen-del-dato__volver')?.textContent.replace(/\s+/g, ' ').trim() ?? '',
            enlace: donde?.querySelector('.enlace-al-area a')?.textContent.trim() ?? '',
            abiertas: donde?.querySelectorAll('.fuente__registro').length ?? 0,
            desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          };
        });
      const lecturasDeComidas = (desde) => v.urls.slice(desde).filter((u) => /^GET .*\/nutrition\/meal-records\//.test(u)).length;
      let pedidosAntes = v.urls.length;
      const marcaDelOrigen = await clic(page, '.panel-de-lectura__metrica button', 'Ver origen');
      await page.waitForSelector('aside.origen-del-dato .fuente__fila', { timeout: 20_000 });
      await quieto(page, v);
      const lecturasAlAbrir = lecturasDeComidas(pedidosAntes);
      const origen = await leerElOrigen();
      comprobar(
        'C-13',
        'El origen de un dato va en el lugar de la lectura, al costado de los gráficos, que siguen a la vista: con su título (que recibe el foco), la métrica y la fecha, el valor de la API y «Volver a la lectura»; no se abre un panel encima',
        origen.alCostado &&
          !origen.panel &&
          origen.graficos === 3 &&
          !origen.lecturaALaVista &&
          origen.titulo === 'De dónde sale este dato' &&
          origen.focoEnElTitulo &&
          origen.metrica === `Calorías registradas · ${diaCivil(conComidas.date)}` &&
          origen.valor === `${dominio.numero(Math.round(conComidas.value))} kcal` &&
          origen.volver === `Volver a la lectura del ${diaCivil(conComidas.date)}` &&
          origen.desborde <= 1,
        JSON.stringify({ ...origen, filas: origen.filas.length }),
      );
      comprobar(
        'C-13',
        'El origen lista cada comida de ese día en el orden en que ocurrió, con su hora, su comida, la opción y lo que aporta, como lo dice cada registro leído aparte; lo que aportan suma el valor del punto, y el total es ese valor',
        origen.filas.length === conComidas.sources.length &&
          origen.sinLeer === 0 &&
          origen.filas.map((f) => `${f.comida}|${f.opcion}|${f.aporte}`).join(' ‖ ') === filasEsperadas.join(' ‖ ') &&
          origen.filas.every((f) => /^\d{2}:\d{2}$/.test(f.hora)) &&
          Math.abs(suma - conComidas.value) <= 1 &&
          origen.total === `Total del día ${dominio.numero(Math.round(conComidas.value))} kcal`,
        `API: ${conComidas.date} = ${conComidas.value} kcal de ${conComidas.sources.length} registros (suman ${suma.toFixed(1)}) · esperado: ${filasEsperadas.join(' ‖ ')} · pantalla: ${origen.filas.map((f) => `${f.hora} ${f.comida}|${f.opcion}|${f.aporte}`).join(' ‖ ')} · ${origen.total}`,
      );
      // Abrir una comida muestra su registro sin pedirlo de nuevo: se leyó una vez, al abrir el origen.
      pedidosAntes = v.urls.length;
      await page.evaluate(() => document.querySelector('aside.origen-del-dato .fuente__fila')?.setAttribute('data-recorrido', 'primera-comida'));
      await page.click('[data-recorrido="primera-comida"]');
      await page.waitForSelector('aside.origen-del-dato .fuente__registro', { timeout: 5_000 });
      await quieto(page, v, { silencio: 400 });
      const abierta = await page.evaluate(() => ({
        expandida: document.querySelector('[data-recorrido="primera-comida"]')?.getAttribute('aria-expanded'),
        registro: document.querySelector('aside.origen-del-dato .fuente__registro')?.innerText.replace(/\s+/g, ' ').trim() ?? '',
        abiertas: document.querySelectorAll('aside.origen-del-dato .fuente__registro').length,
      }));
      comprobar(
        'C-13',
        'Se lee un registro por comida al abrir el origen, y ninguno más al desplegar una: la fila abre su registro (la opción, cómo informó las cantidades y la estimación) con lo ya leído',
        lecturasAlAbrir === conComidas.sources.length && lecturasDeComidas(pedidosAntes) === 0 && abierta.expandida === 'true' && abierta.abiertas === 1 && abierta.registro.includes(registros[0].kind === 'PLAN_OPTION' && registros[0].option ? registros[0].option.label : 'Comió algo diferente') && /Estimación de lo consumido/.test(abierta.registro),
        `${lecturasAlAbrir} lecturas al abrir (${conComidas.sources.length} fuentes) · ${lecturasDeComidas(pedidosAntes)} al desplegar · ${abierta.registro.slice(0, 160)}`,
      );
      const axeConElOrigen = await axe(page);
      // Escape vuelve a la lectura: la vista sigue igual y el foco vuelve a «Ver origen».
      const urlConElOrigen = page.url();
      await page.keyboard.press('Escape');
      const cerroElOrigen = await page.waitForFunction(() => !document.querySelector('aside.origen-del-dato'), { timeout: 5_000 }).then(() => true, () => false);
      const trasCerrar = await page.evaluate(() => ({ foco: document.activeElement?.getAttribute('data-recorrido') ?? '', lectura: (document.querySelector('.panel-de-lectura')?.getClientRects().length ?? 0) > 0, graficos: document.querySelectorAll('figure.grafico__figura').length }));
      comprobar(
        'C-13',
        'Escape cierra el origen y vuelve a la lectura: la dirección no cambió, los tres gráficos siguen y el foco vuelve a «Ver origen»; con el origen abierto, axe no encuentra faltas',
        cerroElOrigen && page.url() === urlConElOrigen && trasCerrar.foco === marcaDelOrigen && trasCerrar.lectura && trasCerrar.graficos === 3 && axeConElOrigen.length === 0,
        `cerró: ${cerroElOrigen} · foco: ${trasCerrar.foco === marcaDelOrigen ? 'en «Ver origen»' : trasCerrar.foco || 'en otro lado'} · axe: ${JSON.stringify(axeConElOrigen)}`,
      );
      // Con más fuentes de las que se leen de una vez (una semana entera), no se leen todas: se elige cuál abrir, como
      // antes. Es la misma consulta que arriba: ahí había filas y ningún botón para elegir; acá, al revés.
      const semanas =(await leerApi(v, `/advisees/${estado.aseId}/projections/NUTRITION_PRESCRIBED_VS_RECORDED?metric=ENERGY&grain=WEEK&periodStart=${desde90}&periodEnd=${hoy}`)).data.result.recorded.points;
      const semana = [...semanas].reverse().find((p) => p.value !== null && !p.partialBucket && p.sources.length > 8);
      if (semana) {
        await abrirAnalisis(`m=${encodeURIComponent('nutricion.energia')}&p=90&g=W&f=${semana.date}`);
        pedidosAntes = v.urls.length;
        await clic(page, '.panel-de-lectura__metrica button', 'Ver origen');
        await page.waitForSelector('aside.origen-del-dato .selector-de-series .chip', { timeout: 20_000 });
        await quieto(page, v);
        const deLaSemana = await leerElOrigen();
        comprobar(
          'C-13',
          'Un punto que sale de más de ocho registros (una semana) no los lee todos: ofrece elegir cuál abrir, y abre uno',
          deLaSemana.chips === semana.sources.length && deLaSemana.filas.length === 0 && lecturasDeComidas(pedidosAntes) === 1 && deLaSemana.alCostado,
          `${semana.sources.length} fuentes en la API · ${deLaSemana.chips} para elegir · ${deLaSemana.filas.length} filas · ${lecturasDeComidas(pedidosAntes)} lectura al abrir`,
        );
        await clic(page, 'aside.origen-del-dato button', 'Volver a la lectura');
        await page.waitForFunction(() => !document.querySelector('aside.origen-del-dato'), { timeout: 5_000 });
      } else {
        informar('C-13', 'Un punto con más de ocho registros', 'el escenario no tiene una semana terminada con más de ocho registros');
      }
      // A 1024 px no hay lugar al costado: el origen se abre encima, en el panel que retiene el foco, con lo mismo.
      await page.setViewport({ width: 1024, height: 900 });
      await abrirAnalisis(`m=${encodeURIComponent(TRES)}&p=90&f=${conComidas.date}`);
      await clic(page, '.panel-de-lectura__metrica button', 'Ver origen');
      const abrioElPanel = await page.waitForSelector('dialog.dialogo--panel[open] .fuente__fila', { timeout: 20_000 }).then(() => true, () => false);
      await quieto(page, v);
      const enElPanel = await leerElOrigen();
      const focoEnElPanel = await page.evaluate(() => !!document.querySelector('dialog.dialogo--panel[open]')?.contains(document.activeElement));
      await page.keyboard.press('Escape');
      const cerroElPanel = await page.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 5_000 }).then(() => true, () => false);
      comprobar(
        'C-13',
        'A 1024 px el origen se abre encima, en el panel que retiene el foco, con la misma lista de comidas y el mismo total; no hay nada al costado, y Escape lo cierra',
        abrioElPanel && enElPanel.panel && !enElPanel.alCostado && enElPanel.titulo === '' && focoEnElPanel && enElPanel.filas.map((f) => `${f.comida}|${f.opcion}|${f.aporte}`).join(' ‖ ') === filasEsperadas.join(' ‖ ') && enElPanel.total === origen.total && enElPanel.desborde <= 1 && cerroElPanel,
        `panel: ${enElPanel.panel} · al costado: ${enElPanel.alCostado} · foco adentro: ${focoEnElPanel} · ${enElPanel.filas.length} filas · ${enElPanel.total} · desborde ${enElPanel.desborde} · Escape lo cierra: ${cerroElPanel}`,
      );
      await page.setViewport({ width: 1440, height: 900 });
    } else {
      informar('C-13', 'El origen de un dato con varias comidas', 'el escenario no tiene un día terminado y completo con entre 2 y 8 registros de comida');
    }

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

// ─── La Línea de tiempo por día (WP-ESCRITORIO-AMABLE, parte 4: E-65 a E-78) ─────────────────────────

/**
 * La línea de tiempo con el día como unidad: los días con su tarjeta o lisos, el grupo de comidas, los hitos, las vistas
 * con nombre y su cantidad, el detalle al costado, los días enteros, los días sin hechos y la ayuda de la vista. Lo
 * esperado (qué hechos tiene cada día, cuántos de cada rasgo, las cantidades de las vistas, los instantes del detalle)
 * se calcula a mano con lo que devuelve la API, sin el dominio. Cada comprobación negativa («no hay…») mira con el mismo
 * selector que una positiva de la misma pantalla. Corre en la sesión de `fichaRecompuesta`; sola, con
 * `node recorrido.mjs linea`.
 */
async function lineaPorDia(page, v) {
  const desde90 = diaMenos(hoy, 89);
  const consulta = `periodStart=${desde90}&periodEnd=${hoy}`;
  const num = (n) => new Intl.NumberFormat('es-AR').format(n);
  const ZONA = 'America/Argentina/Buenos_Aires';
  /** «20 sept», como escribe la línea una fecha del año en curso; con el año si es de otro. */
  const fechaBreve = (f) => (f.slice(0, 4) === hoy.slice(0, 4) ? new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${f}T12:00:00Z`)) : diaCivil(f));
  /** «24 sept, 13:30»: un instante en la zona del hecho. */
  const momento = (instante) => {
    const fecha = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date(instante));
    return `${fechaBreve(fecha)}, ${new Intl.DateTimeFormat('es-AR', { timeStyle: 'short', hourCycle: 'h23', timeZone: ZONA }).format(new Date(instante))}`;
  };
  const linea = (extra = '') => leerApi(v, `/advisees/${estado.aseId}/timeline?${consulta}${extra}`);
  const abrirLinea = async (extra = '') => {
    await cupo(v, 60);
    // Pasar por otra vista vuelve a montar la línea: empieza sin grupos abiertos ni detalle.
    await ir(page, FICHA_A);
    await quieto(page, v);
    await ir(page, `${FICHA_A}&vista=linea${extra}`);
    await quieto(page, v);
    await page.evaluate(() => window.scrollTo(0, 0));
    await pausa(300);
  };
  const DE_TODOS_LOS_DIAS = new Set(['MEAL_RECORDED', 'TRAINING_SESSION_RECORDED']);
  /** Los rasgos de un hecho, a mano desde los campos de la API. */
  const rasgosDe = (e) =>
    [
      e.quality.includes('QUANTITIES_UNCONFIRMED') && 'SIN_CONFIRMAR',
      e.quality.includes('QUANTITIES_DIFFER_FROM_PLAN') && 'DISTINTO_DE_LO_INDICADO',
      e.quality.includes('DIFFERENT_MEAL') && 'COMIDA_DIFERENTE',
      e.quality.includes('SESSION_WITH_DEVIATION') && 'SESION_CON_CAMBIOS',
      e.quality.includes('SESSION_NOT_COMPLETED') && 'SESION_NO_REALIZADA',
      e.quality.includes('SESSION_SUMMARY_ONLY') && 'SESION_RESUMIDA',
      e.state === 'ANNULLED' && 'ANULADO',
      e.state === 'RECTIFIED' && 'RECTIFICADO',
      e.state === 'CORRECTED' && 'CORREGIDO',
      e.recordedLate && 'CARGADO_OTRO_DIA',
    ].filter(Boolean);
  /** Cada día de la lista, tal como se ve. */
  const diasEnPantalla = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.linea-de-tiempo__dia')].map((d) => {
        const lista = d.querySelector('.linea-de-tiempo__hechos');
        const estilo = getComputedStyle(lista);
        const grupo = d.querySelector('.grupo-de-hechos');
        const cabecera = grupo?.querySelector('.grupo-de-hechos__cabecera');
        return {
          fecha: d.dataset.fecha,
          novedades: d.dataset.novedades,
          fin: Math.round(d.getBoundingClientRect().bottom + scrollY),
          tarjeta: estilo.borderTopWidth !== '0px' && estilo.borderTopStyle !== 'none' && estilo.backgroundColor !== 'rgba(0, 0, 0, 0)',
          sueltos: [...d.querySelectorAll('.linea-de-tiempo__hechos > .entrada')].map((e) => ({ id: e.dataset.id, hito: e.dataset.hito === 'si', rasgos: [...e.querySelectorAll('[data-rasgo]')].map((r) => r.dataset.rasgo), texto: e.innerText.replace(/\s+/g, ' ').trim() })),
          grupo: grupo
            ? {
                cabecera: cabecera.innerText.replace(/\s+/g, ' ').trim(),
                abierto: cabecera.getAttribute('aria-expanded'),
                rasgos: Object.fromEntries([...cabecera.querySelectorAll('[data-rasgo]')].map((r) => [r.dataset.rasgo, Number(/^\d+/.exec(r.innerText.trim())?.[0] ?? NaN)])),
                ids: [...grupo.querySelectorAll('.entrada')].map((e) => e.dataset.id),
                aLaVista: [...grupo.querySelectorAll('.entrada')].filter((e) => e.getClientRects().length > 0).length,
              }
            : null,
        };
      }),
    );
  await page.setViewport({ width: 1440, height: 900 });
  await abrirLinea();

  // Lo esperado: todas las tandas de la API, por fecha.
  const tandas = [];
  for (let cursor = null; tandas.length < 12; ) {
    const r = await linea(`&limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    tandas.push(r);
    cursor = r.page.nextCursor;
    if (!cursor) break;
  }
  const entradasApi = tandas.flatMap((r) => r.data.entries);
  const conteos = tandas[0].data.periodCounts;
  const totalDelPeriodo = conteos.byEventType.reduce((n, t) => n + t.count, 0);
  const porDia = new Map();
  for (const e of entradasApi) porDia.set(e.occurredDate, [...(porDia.get(e.occurredDate) ?? []), e]);
  const esperadoDe = (fecha) => {
    const hechos = porDia.get(fecha) ?? [];
    const comidas = hechos.filter((e) => e.eventType === 'MEAL_RECORDED');
    const otros = hechos.filter((e) => e.eventType !== 'MEAL_RECORDED');
    const rasgos = {};
    for (const c of comidas) for (const r of rasgosDe(c)) rasgos[r] = (rasgos[r] ?? 0) + 1;
    return {
      hechos: hechos.length,
      comidas: comidas.length,
      agrupadas: comidas.length >= 2,
      sueltos: otros.length + (comidas.length >= 2 ? 0 : comidas.length),
      hitos: otros.filter((e) => !DE_TODOS_LOS_DIAS.has(e.eventType)).map((e) => e.timelineEntryId).sort(),
      novedades: otros.length > 0 || comidas.some((c) => rasgosDe(c).length > 0) ? 'si' : 'no',
      rasgos,
    };
  };
  const igual = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

  // E-65 · Cada día, como lo arma la API ──────────────────────────────────────────────────────────────────
  const enPantalla = await diasEnPantalla();
  const diferencias = enPantalla.flatMap((d) => {
    const e = esperadoDe(d.fecha);
    const faltas = [];
    if (d.novedades !== e.novedades) faltas.push(`novedades ${d.novedades}, esperado ${e.novedades}`);
    if (d.tarjeta !== (e.novedades === 'si')) faltas.push(`tarjeta ${d.tarjeta}`);
    if (!!d.grupo !== e.agrupadas) faltas.push(`grupo ${!!d.grupo}, esperado ${e.agrupadas}`);
    if (d.grupo && !new RegExp(`^Comidas ${e.comidas} registradas`).test(d.grupo.cabecera)) faltas.push(`cabecera «${d.grupo.cabecera}», esperado ${e.comidas}`);
    if (d.grupo && !igual(d.grupo.rasgos, e.rasgos)) faltas.push(`rasgos ${JSON.stringify(d.grupo.rasgos)}, esperado ${JSON.stringify(e.rasgos)}`);
    if (d.grupo && (d.grupo.ids.length !== e.comidas || d.grupo.aLaVista !== 0 || d.grupo.abierto !== 'false')) faltas.push(`grupo con ${d.grupo.ids.length} (${d.grupo.aLaVista} a la vista, abierto ${d.grupo.abierto})`);
    if (d.sueltos.length !== e.sueltos) faltas.push(`${d.sueltos.length} renglones, esperado ${e.sueltos}`);
    if (JSON.stringify(d.sueltos.filter((s) => s.hito).map((s) => s.id).sort()) !== JSON.stringify(e.hitos)) faltas.push('los hitos no son los de la API');
    // Los hitos van primero: ningún renglón que no es un hito queda antes de uno que sí.
    if (d.sueltos.some((s, i) => s.hito && d.sueltos.slice(0, i).some((x) => !x.hito))) faltas.push('un hito no va primero');
    return faltas.length ? [`${d.fecha}: ${faltas.join('; ')}`] : [];
  });
  const conTarjeta = enPantalla.filter((d) => d.tarjeta).length;
  comprobar(
    'E-65',
    'Cada día se arma con lo que entrega la API: los hitos primero, las comidas en un renglón que dice cuántas son y cuántas tienen cada rasgo, y la tarjeta solo si hay una sesión, un hito o un rasgo; hay días de las dos clases',
    diferencias.length === 0 && enPantalla.length >= 5 && conTarjeta > 0 && conTarjeta < enPantalla.length,
    diferencias.length ? diferencias.slice(0, 4).join(' · ') : `${enPantalla.length} días a la vista: ${conTarjeta} con tarjeta y ${enPantalla.length - conTarjeta} lisos`,
  );

  // E-71 · Días enteros: el último día leído espera ─────────────────────────────────────────────────────
  const fechasDeLaPrimera = [...new Set(tandas[0].data.entries.map((e) => e.occurredDate))];
  const fechasEsperadas = tandas[0].page.nextCursor ? fechasDeLaPrimera.slice(0, -1) : fechasDeLaPrimera;
  const ultimoDeLaPrimera = fechasDeLaPrimera[fechasDeLaPrimera.length - 1];
  const cortado = tandas[0].data.entries.filter((e) => e.occurredDate === ultimoDeLaPrimera).length < (porDia.get(ultimoDeLaPrimera)?.length ?? 0);
  const hechosDe = (d) => d.sueltos.length + (d.grupo?.ids.length ?? 0);
  const incompletos = enPantalla.filter((d) => hechosDe(d) !== esperadoDe(d.fecha).hechos).map((d) => d.fecha);
  const aLaVista = enPantalla.reduce((n, d) => n + hechosDe(d), 0);
  const pie = await texto(page, '.linea__mas');
  comprobar(
    'E-71',
    'Se muestran días enteros: de la primera tanda de 50 hechos, el último día (que la tanda cortó) espera a «Ver días anteriores»; cada día a la vista tiene todos sus hechos, y el pie dice cuántos se ven y hasta qué día',
    JSON.stringify(enPantalla.map((d) => d.fecha)) === JSON.stringify(fechasEsperadas) && incompletos.length === 0 && pie.includes(`Se ven ${num(aLaVista)} de ${num(totalDelPeriodo)} hechos, hasta el ${fechaBreve(fechasEsperadas[fechasEsperadas.length - 1])}.`),
    `${fechasEsperadas.length} días · el ${ultimoDeLaPrimera} ${cortado ? 'quedó cortado por la tanda y espera' : 'entró entero en la tanda, y espera igual: no se puede saber sin leer más'} · ${pie}`,
  );
  // La prueba de la prueba: si la lista mostrara también el día cortado, la comparación lo vería.
  if (cortado) {
    const conElCortado = [...enPantalla.map((d) => ({ fecha: d.fecha, hechos: hechosDe(d) })), { fecha: ultimoDeLaPrimera, hechos: tandas[0].data.entries.filter((e) => e.occurredDate === ultimoDeLaPrimera).length }];
    comprobar('E-71', 'Si se mostrara el día cortado por la tanda, la comparación con la API lo detecta (prueba de la prueba)', conElCortado.some((d) => d.hechos !== esperadoDe(d.fecha).hechos), `${ultimoDeLaPrimera}: ${conElCortado[conElCortado.length - 1].hechos} de ${esperadoDe(ultimoDeLaPrimera).hechos} hechos en la primera tanda`);
  } else {
    informar('E-71', 'El último día de la primera tanda', 'entró entero: el escenario no tiene un día cortado para la prueba de la prueba');
  }

  // E-72 · La primera pantalla ───────────────────────────────────────────────────────────────────────────
  const enteros = (alto, dias = enPantalla) => dias.filter((d) => d.fin <= alto).length;
  const altoDeLaPagina = await page.evaluate(() => document.documentElement.scrollHeight);
  // Con la densidad de antes (una tarjeta de cinco renglones por hecho), la misma medición tiene que dar menos días.
  await page.addStyleTag({ content: '.entrada__fila, .grupo-de-hechos__cabecera { min-height: 215px !important; }' }).then((h) => h.evaluate((s) => s.setAttribute('data-recorrido', 'densidad-de-antes')));
  await pausa(200);
  const conLaDensidadDeAntes = enteros(900, await diasEnPantalla());
  await page.evaluate(() => document.querySelector('style[data-recorrido="densidad-de-antes"]').remove());
  await pausa(200);
  const otrosAnchos = {};
  for (const [ancho, alto] of [
    [1920, 950],
    [1280, 900],
  ]) {
    await page.setViewport({ width: ancho, height: alto });
    await pausa(400);
    otrosAnchos[`${ancho}×${alto}`] = enteros(alto, await diasEnPantalla());
  }
  await page.setViewport({ width: 1440, height: 900 });
  await pausa(400);
  comprobar(
    'E-72',
    'A 1440 × 900, la primera pantalla muestra enteros al menos cinco días con todos sus hechos (antes, los primeros 50 hechos ocupaban casi doce pantallas); con la densidad de antes la misma medición da menos (prueba de la prueba)',
    enteros(900) >= 5 && conLaDensidadDeAntes < 5 && altoDeLaPagina < 2400,
    `${enteros(900)} días enteros en 900 px (el séptimo termina en ${enPantalla[6]?.fin ?? '—'} px) · ${JSON.stringify(otrosAnchos)} · la página con la primera tanda mide ${altoDeLaPagina} px · con renglones de 215 px: ${conLaDensidadDeAntes}`,
  );

  // E-66 · El grupo, abierto: todas sus comidas, en el orden en que ocurrieron ──────────────────────────
  const conGrupo = enPantalla.find((d) => d.grupo && Object.keys(d.grupo.rasgos).length > 0) ?? enPantalla.find((d) => d.grupo);
  const delGrupo = `.linea-de-tiempo__dia[data-fecha="${conGrupo.fecha}"] .grupo-de-hechos`;
  await page.click(`${delGrupo} .grupo-de-hechos__cabecera`);
  await pausa(250);
  const abierto = await page.evaluate(
    (s) => ({
      expandido: document.querySelector(`${s} .grupo-de-hechos__cabecera`).getAttribute('aria-expanded'),
      filas: [...document.querySelectorAll(`${s} .entrada`)].filter((e) => e.getClientRects().length > 0).map((e) => ({ id: e.dataset.id, rasgos: [...e.querySelectorAll('[data-rasgo]')].map((r) => r.dataset.rasgo), texto: e.innerText.replace(/\s+/g, ' ').trim() })),
    }),
    delGrupo,
  );
  const comidasDelDia = (porDia.get(conGrupo.fecha) ?? []).filter((e) => e.eventType === 'MEAL_RECORDED').sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
  comprobar(
    'E-66',
    'Un grupo abierto muestra todas las comidas del día, de la más temprana a la más tardía, cada una con los rasgos que le da la API; el botón dice que está abierto',
    abierto.expandido === 'true' && JSON.stringify(abierto.filas.map((f) => f.id)) === JSON.stringify(comidasDelDia.map((e) => e.timelineEntryId)) && abierto.filas.every((f, i) => JSON.stringify(f.rasgos) === JSON.stringify(rasgosDe(comidasDelDia[i]))),
    `${conGrupo.fecha}: ${abierto.filas.map((f) => f.texto.slice(0, 44)).join(' | ')}`,
  );
  // Lo que se mudó al detalle no está en el renglón; la positiva (que el detalle sí lo dice) va con E-70.
  const renglones = abierto.filas.map((f) => f.texto).join(' | ');
  const sinLoQueSeMudo = !/Registrado el|Plan: versión|versión \d+ del plan|Abrir registro/.test(renglones);

  // E-70 · El detalle, con lo que el renglón ya no repite ───────────────────────────────────────────────
  const comida = comidasDelDia[comidasDelDia.length > 1 ? 1 : 0];
  await page.click(`${delGrupo} .entrada[data-id="${comida.timelineEntryId}"] .entrada__fila`);
  await page.waitForSelector('.detalle-del-hecho', { timeout: 5_000 });
  await quieto(page, v);
  const detalle = await page.evaluate(() => {
    const d = document.querySelector('.detalle-del-hecho');
    const dato = (rotulo) => [...d.querySelectorAll('.datos-del-hecho__tiempos > div')].find((x) => x.querySelector('dt').innerText.trim() === rotulo)?.querySelector('dd').innerText.trim() ?? null;
    return {
      titulo: d.querySelector('h3').innerText.trim(),
      focoEnElTitulo: document.activeElement === d.querySelector('h3'),
      ocurrio: dato('Ocurrió'),
      seCargo: dato('Se cargó'),
      relaciones: [...d.querySelectorAll('.datos-del-hecho__relaciones li')].map((l) => l.innerText.trim()),
      datosPlegados: d.querySelector('details.datos-del-hecho__todos') ? !d.querySelector('details.datos-del-hecho__todos').open : null,
      datos: [...d.querySelectorAll('.datos-del-hecho__datos > div')].map((x) => `${x.querySelector('dt').textContent.trim()}: ${x.querySelector('dd').textContent.trim()}`),
      enlace: d.querySelector('.enlace-al-area a')?.innerText.trim() ?? null,
      pegado: getComputedStyle(d).position,
    };
  });
  comprobar(
    'E-70',
    'El detalle dice lo que el renglón ya no repite: cuándo ocurrió y cuándo se cargó (los instantes de la API, con quién lo cargó), sus relaciones, todos los datos de la entrada a un clic y el camino a su pestaña; el renglón no los repite',
    detalle.focoEnElTitulo &&
      detalle.ocurrio === momento(comida.occurredAt) &&
      detalle.seCargo === `${momento(comida.recordedAt)}${comida.author ? ` · ${comida.author.displayName}` : ''}` &&
      comida.relations.every((r) => detalle.relaciones.includes(r.label)) &&
      detalle.datosPlegados === true &&
      JSON.stringify(detalle.datos) === JSON.stringify(comida.details.map((x) => `${x.label}: ${x.value}`)) &&
      detalle.enlace === 'Ver en Nutrición · Registros' &&
      detalle.pegado === 'sticky' &&
      sinLoQueSeMudo,
    `${detalle.titulo} · ocurrió ${detalle.ocurrio} · se cargó ${detalle.seCargo} · ${detalle.relaciones.length} relación(es) · ${detalle.datos.length} datos a un clic · el renglón no los repite: ${sinLoQueSeMudo}`,
  );

  // E-73 · La carrera: tocar otro hecho mientras el primero todavía carga ──────────────────────────────────
  const otra = comidasDelDia.find((e) => e.timelineEntryId !== comida.timelineEntryId && e.source.id !== comida.source.id);
  if (otra) {
    const nombreDe = (e) => (e.details.find((x) => x.label === 'Opción')?.value.replace(/^\d+ · /, '') ?? e.details.find((x) => x.label === 'Descripción')?.value ?? '');
    v.reglas = [{ coincide: (u) => u.includes(`/nutrition/meal-records/${otra.source.id}`), accion: 'demorar', ms: 3000 }];
    await page.click(`${delGrupo} .entrada[data-id="${otra.timelineEntryId}"] .entrada__fila`);
    await pausa(250);
    await page.click(`${delGrupo} .entrada[data-id="${comida.timelineEntryId}"] .entrada__fila`);
    await pausa(3600);
    await quieto(page, v);
    v.reglas = [];
    const trasLaCarrera = await page.evaluate(() => ({ titulo: document.querySelector('.detalle-del-hecho h3').innerText.trim(), texto: document.querySelector('.detalle-del-hecho').innerText.replace(/\s+/g, ' '), elegidos: [...document.querySelectorAll('.entrada__fila[aria-current="true"]')].map((b) => b.closest('.entrada').dataset.id) }));
    comprobar(
      'E-73',
      'Al tocar otro hecho mientras el primero todavía carga, el detalle queda con el segundo: la respuesta lenta del primero no lo pinta, y un solo renglón queda marcado',
      trasLaCarrera.titulo.includes(nombreDe(comida)) && (nombreDe(otra) === nombreDe(comida) || !trasLaCarrera.texto.includes(nombreDe(otra))) && JSON.stringify(trasLaCarrera.elegidos) === JSON.stringify([comida.timelineEntryId]),
      `demorado: «${nombreDe(otra)}» · queda: «${trasLaCarrera.titulo}»`,
    );
  } else {
    informar('E-73', 'La carrera entre dos hechos', 'el día elegido no tiene dos comidas distintas');
  }

  // E-70 · Escape: desde la lista cierra y deja el foco; desde el detalle lo devuelve al renglón ────────────
  const elegidoAhora = `${delGrupo} .entrada[data-id="${comida.timelineEntryId}"] .entrada__fila`;
  await page.focus(`${delGrupo} .grupo-de-hechos__cabecera`);
  await page.keyboard.press('Escape');
  await pausa(250);
  const trasEscapeEnLaLista = await page.evaluate((s) => ({ detalle: !!document.querySelector('.detalle-del-hecho'), focoEnElGrupo: document.activeElement === document.querySelector(s) }), `${delGrupo} .grupo-de-hechos__cabecera`);
  await page.click(elegidoAhora);
  await page.waitForSelector('.detalle-del-hecho', { timeout: 5_000 });
  await quieto(page, v);
  await page.click('.detalle-del-hecho__cabecera button');
  await pausa(250);
  const trasCerrar = await page.evaluate((s) => ({ detalle: !!document.querySelector('.detalle-del-hecho'), focoEnElRenglon: document.activeElement === document.querySelector(s) }), elegidoAhora);
  // Con el grupo cerrado mientras el detalle sigue abierto, el foco vuelve al renglón del grupo, que es lo que se ve.
  await page.click(elegidoAhora);
  await page.waitForSelector('.detalle-del-hecho', { timeout: 5_000 });
  await quieto(page, v);
  await page.click(`${delGrupo} .grupo-de-hechos__cabecera`);
  await pausa(250);
  const conElGrupoCerrado = await page.evaluate((s) => ({ detalle: !!document.querySelector('.detalle-del-hecho'), expandido: document.querySelector(`${s} .grupo-de-hechos__cabecera`).getAttribute('aria-expanded') }), delGrupo);
  await page.click('.detalle-del-hecho__cabecera button');
  await pausa(250);
  const focoTrasCerrarElGrupo = await page.evaluate((s) => document.activeElement === document.querySelector(`${s} .grupo-de-hechos__cabecera`), delGrupo);
  comprobar(
    'E-70',
    'Escape desde la lista cierra el detalle y deja el foco donde estaba; «Cerrar» lo devuelve al renglón del hecho; y si el grupo se cerró con el detalle abierto (se puede), al renglón del grupo',
    !trasEscapeEnLaLista.detalle && trasEscapeEnLaLista.focoEnElGrupo && !trasCerrar.detalle && trasCerrar.focoEnElRenglon && conElGrupoCerrado.detalle && conElGrupoCerrado.expandido === 'false' && focoTrasCerrarElGrupo,
    JSON.stringify({ trasEscapeEnLaLista, trasCerrar, conElGrupoCerrado, focoTrasCerrarElGrupo }),
  );

  // E-70 · En 1024 el detalle se abre encima, como un panel que retiene el foco ───────────────────────────
  await page.setViewport({ width: 1024, height: 900 });
  await abrirLinea();
  await page.evaluate(() => [...document.querySelectorAll('.linea-de-tiempo__hechos > .entrada .entrada__fila')][0].setAttribute('data-recorrido', 'primero'));
  await page.click('[data-recorrido="primero"]');
  const abrioElPanel = await page.waitForSelector('dialog.dialogo--panel[open]', { timeout: 5_000 }).then(() => true, () => false);
  await quieto(page, v);
  const enElPanel = await page.evaluate(() => {
    const d = document.querySelector('dialog.dialogo--panel[open]');
    return { alCostado: !!document.querySelector('.detalle-del-hecho'), texto: d?.innerText.replace(/\s+/g, ' ') ?? '', focoAdentro: !!d?.contains(document.activeElement), desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  const axeConElPanel = await axe(page);
  await page.keyboard.press('Escape');
  const cerroElPanel = await page.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 3_000 }).then(() => true, () => false);
  const focoTrasElPanel = await page.evaluate(() => document.activeElement?.getAttribute('data-recorrido'));
  comprobar(
    'E-70',
    'A 1024 px el detalle no entra al costado: se abre encima, en un panel que retiene el foco, con los mismos datos del hecho; Escape lo cierra y el foco vuelve al renglón; axe no encuentra faltas',
    abrioElPanel && !enElPanel.alCostado && /Ocurrió/.test(enElPanel.texto) && /Se cargó/.test(enElPanel.texto) && enElPanel.focoAdentro && enElPanel.desborde <= 1 && axeConElPanel.length === 0 && cerroElPanel && focoTrasElPanel === 'primero',
    `panel: ${abrioElPanel} · al costado: ${enElPanel.alCostado} · foco adentro: ${enElPanel.focoAdentro} · axe: ${JSON.stringify(axeConElPanel)} · foco después: ${focoTrasElPanel}`,
  );
  await page.setViewport({ width: 1440, height: 900 });

  // E-67 · Las vistas con nombre: cada una dice cuántos hechos trae, y los trae ─────────────────────────
  await abrirLinea();
  const deCalidad = (q) => conteos.byQuality.find((x) => x.quality === q)?.count ?? 0;
  const HITOS = ['NUTRITION_PLAN_ACTIVATED', 'NUTRITION_OBJECTIVE_SET', 'NUTRITION_REVIEW_RECORDED', 'TRAINING_PLAN_ACTIVATED', 'TRAINING_OBJECTIVE_SET', 'TRAINING_REVIEW_RECORDED', 'ANTHROPOMETRIC_EVALUATION_RECORDED', 'FOLLOW_UP_OPENED', 'FOLLOW_UP_CLOSED'];
  const VISTAS = {
    TODO: { cuenta: totalDelPeriodo, filtro: '', tipos: null, calidad: null },
    HITOS: { cuenta: conteos.byEventType.filter((t) => !DE_TODOS_LOS_DIAS.has(t.eventType)).reduce((n, t) => n + t.count, 0), filtro: `&type=${HITOS.join(',')}`, tipos: HITOS, calidad: null },
    DISTINTO_DE_LO_INDICADO: { cuenta: deCalidad('QUANTITIES_DIFFER_FROM_PLAN') + deCalidad('SESSION_WITH_DEVIATION'), filtro: '&quality=QUANTITIES_DIFFER_FROM_PLAN,SESSION_WITH_DEVIATION', tipos: null, calidad: ['QUANTITIES_DIFFER_FROM_PLAN', 'SESSION_WITH_DEVIATION'] },
    SIN_CONFIRMAR: { cuenta: deCalidad('QUANTITIES_UNCONFIRMED'), filtro: '&quality=QUANTITIES_UNCONFIRMED', tipos: null, calidad: ['QUANTITIES_UNCONFIRMED'] },
  };
  const vistas = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.vistas-de-la-linea__vistas .vista-de-la-linea')].map((b) => {
        const cuenta = b.querySelector('.vista-de-la-linea__cuenta');
        return { vista: b.dataset.vista, cuenta: cuenta ? Number(cuenta.firstChild.textContent.replace(/\./g, '')) : null, elegida: b.getAttribute('aria-pressed') };
      }),
    );
  const alEntrar = await vistas();
  comprobar(
    'E-67',
    'Las vistas con nombre están en un renglón, en su orden, cada una con la cantidad de hechos del período que trae (las de la API); «Lo nuevo desde la revisión» no lleva número; al entrar está elegida «Todo»',
    JSON.stringify(alEntrar.map((x) => x.vista)) === JSON.stringify(['TODO', 'HITOS', 'LO_NUEVO', 'DISTINTO_DE_LO_INDICADO', 'SIN_CONFIRMAR']) &&
      alEntrar.every((x) => (x.vista === 'LO_NUEVO' ? x.cuenta === null : x.cuenta === VISTAS[x.vista].cuenta)) &&
      alEntrar.every((x) => (x.vista === 'TODO' ? x.elegida === 'true' : x.vista === 'LO_NUEVO' || x.elegida === 'false')),
    alEntrar.map((x) => `${x.vista} ${x.cuenta ?? ''}`.trim()).join(' · '),
  );
  const porVista = {};
  for (const clave of ['HITOS', 'DISTINTO_DE_LO_INDICADO', 'SIN_CONFIRMAR']) {
    await cupo(v, 60);
    await page.click(`.vista-de-la-linea[data-vista="${clave}"]`);
    await quieto(page, v);
    const p = parametros(page);
    const filas = await page.$$eval('.linea-de-tiempo .entrada', (e) => e.map((x) => ({ hito: x.dataset.hito === 'si', rasgos: [...x.querySelectorAll('[data-rasgo]')].map((r) => r.dataset.rasgo), aLaVista: x.getClientRects().length > 0 })));
    porVista[clave] = {
      cuenta: await cuentaDeLaLinea(page),
      // El número que dice el botón, leído de la pantalla en este momento (no el esperado).
      boton: (await vistas()).find((x) => x.vista === clave)?.cuenta ?? null,
      api: (await linea(`${VISTAS[clave].filtro}&limit=1`)).data.totalMatching,
      tipos: p.get('tipos'),
      calidad: p.get('calidad'),
      otros: ['areas', 'estados', 'tardias', 'plan', 'ej', 'novedades'].filter((k) => p.get(k) !== null),
      elegidas: (await vistas()).filter((x) => x.elegida === 'true').map((x) => x.vista),
      filas,
      grupos: await page.$$eval('.grupo-de-hechos', (g) => g.length),
      huecos: await page.$$eval('.linea-de-tiempo__hueco', (h) => h.length),
      filtrosALaVista: await page.$$eval('.filtros-activos', (f) => f.length),
    };
  }
  const traeLoQueDice = {
    HITOS: (f) => f.hito,
    DISTINTO_DE_LO_INDICADO: (f) => f.rasgos.includes('DISTINTO_DE_LO_INDICADO') || f.rasgos.includes('SESION_CON_CAMBIOS'),
    SIN_CONFIRMAR: (f) => f.rasgos.includes('SIN_CONFIRMAR'),
  };
  for (const [clave, x] of Object.entries(porVista)) {
    comprobar(
      'E-67',
      `«${clave === 'HITOS' ? 'Hitos' : clave === 'SIN_CONFIRMAR' ? 'Sin confirmar' : 'Distinto de lo indicado'}» trae los hechos que anuncia: la cantidad del botón, la de la cabecera y la de la API con ese filtro son la misma; la URL lleva solo ese filtro; cada renglón a la vista es de la vista, y no hay otra elegida`,
      VISTAS[clave].cuenta > 0 &&
        x.boton === VISTAS[clave].cuenta &&
        x.cuenta === VISTAS[clave].cuenta &&
        x.api === VISTAS[clave].cuenta &&
        JSON.stringify((x.tipos ?? '').split(',').filter(Boolean).sort()) === JSON.stringify([...(VISTAS[clave].tipos ?? [])].sort()) &&
        JSON.stringify((x.calidad ?? '').split(',').filter(Boolean).sort()) === JSON.stringify([...(VISTAS[clave].calidad ?? [])].sort()) &&
        x.otros.length === 0 &&
        JSON.stringify(x.elegidas) === JSON.stringify([clave]) &&
        x.filas.length === Math.min(x.cuenta, 50) &&
        x.filas.every((f) => f.aLaVista && traeLoQueDice[clave](f)) &&
        x.filtrosALaVista === 0,
      `botón ${x.boton} · cabecera ${x.cuenta} · API ${x.api} · conteos del período ${VISTAS[clave].cuenta} · ${x.filas.length} renglones · elegidas: ${x.elegidas.join(', ')}`,
    );
  }
  comprobar(
    'E-68',
    'Con una vista que recorta dentro del día («Sin confirmar»), cada hecho va en su renglón: no hay grupos de comidas ni días sin hechos',
    porVista.SIN_CONFIRMAR.grupos === 0 && porVista.SIN_CONFIRMAR.huecos === 0 && porVista.SIN_CONFIRMAR.filas.length > 0,
    `${porVista.SIN_CONFIRMAR.filas.length} renglones, ${porVista.SIN_CONFIRMAR.grupos} grupos`,
  );
  // Volver a tocar la vista elegida deja «Todo».
  await page.click('.vista-de-la-linea[data-vista="SIN_CONFIRMAR"]');
  await quieto(page, v);
  const deVuelta = { elegidas: (await vistas()).filter((x) => x.elegida === 'true').map((x) => x.vista), cuenta: await cuentaDeLaLinea(page), calidad: parametros(page).get('calidad') };
  comprobar('E-67', 'Volver a tocar la vista elegida deja «Todo», con todos los hechos del período', JSON.stringify(deVuelta.elegidas) === '["TODO"]' && deVuelta.cuenta === totalDelPeriodo && deVuelta.calidad === null, JSON.stringify(deVuelta));

  // E-69 · «Lo nuevo desde la revisión»: de qué área, y las cantidades siguen siendo las del período ────────
  const resumen = (await leerApi(v, `/advisees/${estado.aseId}/dashboard`)).data.domains;
  const cortes = { NUTRITION: resumen.nutrition.summary?.lastReview?.recordedAt ?? null, TRAINING: resumen.training.summary?.lastReview?.recordedAt ?? null };
  if (cortes.NUTRITION && cortes.TRAINING) {
    await page.click('.vista-de-la-linea[data-vista="LO_NUEVO"]');
    await page.waitForSelector('.vista-de-la-linea__areas', { timeout: 5_000 });
    const opciones = await textos(page, '.vista-de-la-linea__areas button');
    await clic(page, '.vista-de-la-linea__areas button', 'Nutrición');
    await quieto(page, v);
    const p = parametros(page);
    const conElCorte = { aviso: await texto(page, '.aviso-de-filtro'), boton: await texto(page, '.vista-de-la-linea[data-vista="LO_NUEVO"]'), vistas: await vistas(), cuenta: await cuentaDeLaLinea(page), grupos: await page.$$eval('.grupo-de-hechos', (g) => g.length) };
    const diaDe = (instante) => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date(instante));
    const delCorte = (await leerApi(v, `/advisees/${estado.aseId}/timeline?periodStart=${diaMenos(hoy, 365)}&periodEnd=${hoy}&domain=NUTRITION&since=${encodeURIComponent(cortes.NUTRITION)}&limit=1`)).data.totalMatching;
    comprobar(
      'E-69',
      '«Lo nuevo desde la revisión» ofrece cada área con la fecha de su revisión; elegida Nutrición, la URL lleva su instante y su área (la misma que escribe el Resumen), el aviso lo explica, la cantidad es la de la API, y las demás vistas siguen diciendo las cantidades del período elegido',
      JSON.stringify(opciones) === JSON.stringify([`Nutrición · revisión del ${fechaBreve(diaDe(cortes.NUTRITION))}`, `Entrenamiento · revisión del ${fechaBreve(diaDe(cortes.TRAINING))}`]) &&
        p.get('novedades') === new Date(cortes.NUTRITION).toISOString() &&
        p.get('areas') === 'NUTRITION' &&
        /Lo nuevo desde la revisión del/.test(conElCorte.aviso) &&
        /· Nutrición$/.test(conElCorte.boton.trim()) &&
        conElCorte.cuenta === delCorte &&
        conElCorte.grupos === 0 &&
        conElCorte.vistas.every((x) => x.vista === 'LO_NUEVO' || x.cuenta === VISTAS[x.vista].cuenta) &&
        conElCorte.vistas.every((x) => x.vista === 'LO_NUEVO' || x.elegida === 'false'),
      `${opciones.join(' | ')} · ${conElCorte.cuenta} hechos (la API cuenta ${delCorte}) · ${conElCorte.vistas.map((x) => `${x.vista} ${x.cuenta ?? ''}`.trim()).join(' · ')}`,
    );
    await clic(page, '.vista-de-la-linea[data-vista="TODO"]', 'Todo');
    await quieto(page, v);
  } else {
    informar('E-69', '«Lo nuevo desde la revisión»', 'el escenario no tiene una revisión registrada en cada área');
  }

  // E-74 · Una activación de plan se abre con su número de versión ──────────────────────────────────────
  const activacion = entradasApi.find((e) => e.eventType === 'NUTRITION_PLAN_ACTIVATED' && e.details.some((x) => x.label === 'Versión'));
  if (activacion) {
    const numeroDeVersion = activacion.details.find((x) => x.label === 'Versión').value;
    await cupo(v, 60);
    await page.click('.vista-de-la-linea[data-vista="HITOS"]');
    await quieto(page, v);
    await page.click(`.entrada[data-id="${activacion.timelineEntryId}"] .entrada__fila`);
    await page.waitForSelector('.detalle-del-hecho', { timeout: 5_000 });
    await quieto(page, v);
    const delPlan = await texto(page, '.detalle-del-hecho');
    comprobar(
      'E-74',
      'El detalle de un plan activado abre su planificación con su número de versión (antes decía «Versión 0»)',
      new RegExp(`Versión ${numeroDeVersion} · activada el`).test(delPlan) && !/Versión 0 ·/.test(delPlan) && /Ver en Nutrición · Plan/.test(delPlan),
      /Versión \d+ · activada el[^.]{0,30}/.exec(delPlan)?.[0] ?? delPlan.slice(0, 160),
    );
    await page.click('.detalle-del-hecho__cabecera button');
    await clic(page, '.vista-de-la-linea[data-vista="TODO"]', 'Todo');
    await quieto(page, v);
  } else {
    informar('E-74', 'El número de versión de un plan activado', 'el período no tiene una activación de plan de Nutrición');
  }

  // E-75 · Buscar dice por qué coincide, cuando el renglón no lo muestra ────────────────────────────────
  const conMotivo = entradasApi.find((e) => e.eventType === 'TRAINING_SESSION_RECORDED' && e.details.some((x) => x.label === 'Motivo'));
  if (conMotivo) {
    const motivo = conMotivo.details.find((x) => x.label === 'Motivo').value;
    const palabra = motivo.split(/\s+/).find((w) => w.length >= 5 && !new RegExp(w, 'i').test(conMotivo.title)) ?? motivo.split(/\s+/)[0];
    await page.type('.buscador-de-la-linea input[type="search"]', palabra);
    await page.keyboard.press('Enter');
    await quieto(page, v);
    const conElMotivo = await page.evaluate((id) => {
      const e = document.querySelector(`.entrada[data-id="${id}"]`);
      return { coincide: e?.querySelector('.entrada__coincide')?.innerText.replace(/\s+/g, ' ').trim() ?? null, filas: document.querySelectorAll('.linea-de-tiempo .entrada').length, grupos: document.querySelectorAll('.grupo-de-hechos').length };
    }, conMotivo.timelineEntryId);
    // La otra mitad: buscando algo que el renglón ya dice, no se agrega nada.
    await clic(page, 'button', 'Limpiar filtros');
    await quieto(page, v);
    await page.type('.buscador-de-la-linea input[type="search"]', 'cena');
    await page.keyboard.press('Enter');
    await quieto(page, v);
    const conCena = await page.evaluate(() => ({ filas: document.querySelectorAll('.linea-de-tiempo .entrada').length, coinciden: document.querySelectorAll('.entrada__coincide').length }));
    await clic(page, 'button', 'Limpiar filtros');
    await quieto(page, v);
    comprobar(
      'E-75',
      'Al buscar una palabra que está en un dato que el renglón no muestra (el motivo de una sesión), el renglón dice dónde coincide; al buscar lo que el renglón ya dice («cena»), no agrega nada',
      conElMotivo.coincide === `Coincide en: Motivo: ${motivo}` && conElMotivo.grupos === 0 && conCena.filas > 0 && conCena.coinciden === 0,
      `«${palabra}» → ${conElMotivo.coincide} (${conElMotivo.filas} renglón/es) · «cena» → ${conCena.filas} renglones, ${conCena.coinciden} con aclaración`,
    );
  } else {
    informar('E-75', 'Buscar en un dato que el renglón no muestra', 'el período no tiene una sesión con motivo');
  }

  // E-76 · «Actualizar» con dos tandas leídas vuelve a leer todo: ni repite ni pierde ──────────────────────
  await abrirLinea();
  await clic(page, '.linea__mas button', 'Ver días anteriores');
  await quieto(page, v);
  const conDosTandas = await hechosDeLaLinea(page);
  const desdePedidos = v.urls.length;
  await clic(page, '.marco-de-la-ficha button', 'Actualizar');
  await quieto(page, v);
  await pausa(300);
  const trasActualizar = await hechosDeLaLinea(page);
  const releidas = v.urls.slice(desdePedidos).filter((u) => /\/timeline\?/.test(u));
  const idsEsperados = entradasApi.filter((e) => fechasEsperadas.includes(e.occurredDate)).map((e) => e.timelineEntryId).sort();
  comprobar(
    'E-76',
    '«Actualizar» con dos tandas leídas vuelve a leer la línea desde la primera: quedan los días enteros de la primera tanda, sin repetir ni perder hechos (antes le pegaba a la lectura nueva las tandas de la anterior)',
    conDosTandas.ids.length > trasActualizar.ids.length && releidas.length >= 1 && new Set(trasActualizar.ids).size === trasActualizar.ids.length && JSON.stringify([...trasActualizar.ids].sort()) === JSON.stringify(idsEsperados),
    `${conDosTandas.ids.length} hechos con dos tandas → ${trasActualizar.ids.length} después de «Actualizar» (esperados ${idsEsperados.length}) · ${releidas.length} lectura(s) de la línea`,
  );

  // E-77 · Los días sin hechos, entre dos días de la lista ───────────────────────────────────────────────
  const conHechos = [...porDia.keys()].sort().reverse();
  const huecosDeLaApi = [];
  for (let i = 1; i < conHechos.length; i++) {
    const dias = Math.round((Date.parse(`${conHechos[i - 1]}T12:00:00Z`) - Date.parse(`${conHechos[i]}T12:00:00Z`)) / 86_400_000) - 1;
    if (dias >= 1) huecosDeLaApi.push({ desde: diaMenos(conHechos[i - 1], dias), hasta: diaMenos(conHechos[i - 1], 1), dias });
  }
  if (huecosDeLaApi.length > 0) {
    // Un período propio alrededor de los huecos: se ven sin pedir tandas.
    const desde = diaMenos(huecosDeLaApi[huecosDeLaApi.length - 1].desde, 3);
    const hasta = diaMenos(huecosDeLaApi[0].hasta, -3);
    const enElRango = huecosDeLaApi.filter((h) => h.desde > desde && h.hasta < hasta);
    const textoDe = (h) => {
      const primero = h.desde.slice(0, 7) === h.hasta.slice(0, 7) ? String(Number(h.desde.slice(8, 10))) : fechaBreve(h.desde);
      return h.dias === 1 ? `${fechaBreve(h.desde)}: sin hechos registrados` : h.dias === 2 ? `${primero} y ${fechaBreve(h.hasta)}: sin hechos registrados` : `Del ${primero} al ${fechaBreve(h.hasta)}: ${h.dias} días sin hechos registrados`;
    };
    await abrirLinea(`&desde=${desde}&hasta=${hasta}`);
    await verTodosLosDias(page, v, 4);
    const huecos = await textos(page, '.linea-de-tiempo__hueco');
    // Con un filtro, un día sin coincidencias no es un hueco: no se dice ninguno, aunque haya días a la vista.
    await clic(page, '.vistas-de-la-linea button', 'Más filtros');
    await page.waitForSelector('.filtros-de-linea fieldset button.chip', { timeout: 5_000 });
    await clic(page, '.filtros-de-linea fieldset button.chip', 'Nutrición');
    await quieto(page, v);
    const conFiltro = { huecos: await page.$$eval('.linea-de-tiempo__hueco', (h) => h.length), dias: await page.$$eval('.linea-de-tiempo__dia', (d) => d.length) };
    comprobar(
      'E-77',
      'Entre dos días de la lista, los días sin ningún hecho se dicen con sus fechas (los de la API), nunca como un cero; con un filtro puesto no se dice ninguno',
      JSON.stringify(huecos) === JSON.stringify(enElRango.map(textoDe)) && enElRango.length > 0 && conFiltro.huecos === 0 && conFiltro.dias > 0,
      `del ${desde} al ${hasta}: ${huecos.join(' | ')} · con el filtro de Nutrición: ${conFiltro.huecos} en ${conFiltro.dias} días`,
    );
  } else {
    informar('E-77', 'Los días sin hechos', 'el escenario tiene hechos todos los días del período: no hay un hueco para probar');
  }

  // E-78 · La ayuda de la Línea de tiempo ───────────────────────────────────────────────────────────────
  await abrirLinea();
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
      vistasPlegadas: d.querySelector('details.como-se-lee__fuentes') ? !d.querySelector('details.como-se-lee__fuentes').open : null,
      texto: d.innerText.replace(/\s+/g, ' '),
    };
  });
  const axeConLaAyuda = await axe(page);
  await page.click('dialog.como-se-lee[open] details.como-se-lee__fuentes > summary');
  await pausa(200);
  const queTrae = await page.$$eval('dialog.como-se-lee[open] .como-se-lee__fuentes [data-vista]', (f) => f.map((x) => ({ vista: x.dataset.vista, texto: x.innerText.replace(/\s+/g, ' ').trim(), aLaVista: x.checkVisibility() })));
  const axeConLasVistas = await axe(page);
  await page.keyboard.press('Escape');
  const cerroLaAyuda = await page.waitForFunction(() => !document.querySelector('dialog.como-se-lee[open]'), { timeout: 3_000 }).then(() => true, () => false);
  const focoDespues = await page.evaluate(() => document.activeElement?.textContent.replace(/\s+/g, ' ').trim() ?? '');
  comprobar(
    'E-78',
    'La ayuda de la Línea de tiempo se abre desde el marco como un diálogo, por el principio, explica cada parte con su muestra y lo que la vista no dice; qué trae cada vista está a un clic, con las cinco; axe no encuentra faltas; Escape la cierra y el foco vuelve al botón',
    ayuda.titulo === 'Cómo se lee la Línea de tiempo' &&
      ayuda.renglones >= 10 &&
      ayuda.muestras >= 10 &&
      ayuda.focoEnElTitulo &&
      ayuda.tituloALaVista &&
      /No son ceros/.test(ayuda.texto) &&
      /Son datos, no calificaciones/.test(ayuda.texto) &&
      /no califica ni dice si alcanza/.test(ayuda.texto) &&
      ayuda.vistasPlegadas === true &&
      JSON.stringify(queTrae.map((x) => x.vista)) === JSON.stringify(['TODO', 'HITOS', 'DISTINTO_DE_LO_INDICADO', 'SIN_CONFIRMAR', 'LO_NUEVO']) &&
      queTrae.every((x) => x.aLaVista && x.texto.length > 30) &&
      axeConLaAyuda.length === 0 &&
      axeConLasVistas.length === 0 &&
      cerroLaAyuda &&
      focoDespues === 'Cómo se lee esta vista',
    `${ayuda.titulo} · ${ayuda.renglones} renglones, ${ayuda.muestras} muestras · foco en el título: ${ayuda.focoEnElTitulo} · ${queTrae.length} vistas explicadas · axe: ${JSON.stringify([...axeConLaAyuda, ...axeConLasVistas])} · Escape la cierra: ${cerroLaAyuda}`,
  );

  // El teclado: de las vistas a los días, sin trampas ───────────────────────────────────────────────────
  await page.click('#titulo-asesorado');
  const recorridoConTab = [];
  for (let i = 0; i < 40 && recorridoConTab.filter((x) => x.clase === 'fila').length < 2; i++) {
    await page.keyboard.press('Tab');
    recorridoConTab.push(
      await page.evaluate(() => {
        const a = document.activeElement;
        const clase = a?.matches('.vista-de-la-linea') ? 'vista' : a?.matches('.buscador-de-la-linea input') ? 'buscar' : a?.matches('.buscador-de-la-linea__boton') ? 'lupa' : a?.matches('.vistas-de-la-linea__mas') ? 'filtros' : a?.matches('.entrada__fila, .grupo-de-hechos__cabecera') ? 'fila' : 'otro';
        const caja = a?.getBoundingClientRect();
        return { clase, alto: caja ? Math.round(caja.height) : 0, contorno: a ? getComputedStyle(a).outlineStyle : 'none' };
      }),
    );
  }
  const ordenDelFoco = recorridoConTab.map((x) => x.clase).filter((c) => c !== 'otro');
  const primeraFila = `.linea-de-tiempo .grupo-de-hechos__cabecera`;
  await page.focus(primeraFila);
  await page.keyboard.press('Enter');
  await pausa(200);
  const abiertoConEnter = await page.$eval(primeraFila, (b) => b.getAttribute('aria-expanded'));
  await page.keyboard.press('Enter');
  await pausa(200);
  comprobar(
    'PRO-22',
    'Con el teclado se llega, en orden, a las vistas con nombre, el buscador, la lupa, «Más filtros» y los renglones de los días; cada uno mide 44 px o más y muestra el foco; Enter abre y cierra un grupo',
    JSON.stringify(ordenDelFoco.slice(0, 8)) === JSON.stringify(['vista', 'vista', 'vista', 'vista', 'vista', 'buscar', 'lupa', 'filtros']) &&
      ordenDelFoco.filter((c) => c === 'fila').length === 2 &&
      recorridoConTab.filter((x) => x.clase !== 'otro').every((x) => x.alto >= 44 && x.contorno !== 'none') &&
      abiertoConEnter === 'true' &&
      (await page.$eval(primeraFila, (b) => b.getAttribute('aria-expanded'))) === 'false',
    `${ordenDelFoco.join(' → ')} · altos: ${[...new Set(recorridoConTab.filter((x) => x.clase !== 'otro').map((x) => x.alto))].join(', ')} px · Enter: ${abiertoConEnter}`,
  );

  // Accesibilidad y palabras, con un grupo y el detalle abiertos, en los dos temas ──────────────────────
  await page.click(primeraFila);
  await pausa(200);
  await page.evaluate(() => [...document.querySelectorAll('.grupo-de-hechos .entrada__fila')].find((b) => b.getClientRects().length > 0).click());
  await page.waitForSelector('.detalle-del-hecho', { timeout: 5_000 });
  await quieto(page, v);
  const temaInicial = await page.evaluate(() => document.documentElement.dataset.tema);
  const violaciones = {};
  for (const tema of ['claro', 'azul-noche']) {
    await ponerTema(page, tema);
    await pausa(300);
    violaciones[tema] = await axe(page);
  }
  await ponerTema(page, temaInicial);
  comprobar('PRO-22', 'La línea de tiempo por día, con un grupo y el detalle abiertos: axe no encuentra faltas de WCAG 2.2 AA en ninguno de los dos temas', violaciones.claro.length === 0 && violaciones['azul-noche'].length === 0, JSON.stringify(violaciones));
  const todaLaVista = await texto(page, 'section.linea');
  comprobar(
    'E-65',
    'La vista entera, con un grupo y el detalle abiertos, no tiene porcentajes ni palabras que califiquen: describe lo registrado',
    todaLaVista.length > 600 && !/%/.test(todaLaVista) && !/\b(cumpli[óo]|incumpli|adherencia|correcto|incorrecto|bien|mal|alerta|riesgo|excelente|insuficiente)\b/i.test(todaLaVista),
    `${todaLaVista.length} caracteres`,
  );
  await page.click('.detalle-del-hecho__cabecera button');
  // Sin desborde de costado a los tres anchos de escritorio.
  const desbordes = {};
  for (const ancho of [1440, 1280, 1024]) {
    await page.setViewport({ width: ancho, height: 900 });
    await pausa(400);
    desbordes[ancho] = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  }
  await page.setViewport({ width: 1440, height: 900 });
  comprobar('PRO-23', 'La línea de tiempo por día no desborda de costado a 1440, 1280 ni 1024 px', Object.values(desbordes).every((d) => d <= 1), JSON.stringify(desbordes));
  comprobar('PRO-25', 'Sin errores de JavaScript ni respuestas con error de la API durante el recorrido de la línea de tiempo por día', v.errores.length === 0 && v.malas.length === 0, [...v.errores, ...v.malas].slice(0, 4).join(' · ') || 'ninguno');
}

// ─── El Espacio profesional (WP-ESCRITORIO-AMABLE, parte 5: E-83 a E-98) ──────────────────────────────

/** Lo que el Espacio profesional muestra de los pendientes, del directorio y del encabezado, tal como se ve. */
const espacioEnPantalla = (page) =>
  page.evaluate(() => {
    const limpio = (e) => (e ? e.innerText.replace(/\s+/g, ' ').trim() : null);
    const ruta = (a) => {
      const u = new URL(a.getAttribute('href'), location.origin);
      return `${u.pathname.replace(/\/$/, '')}${u.search}`;
    };
    return {
      titulos: [...document.querySelectorAll('h1')].map(limpio),
      hoy: limpio(document.querySelector('.espacio-profesional__hoy')),
      solicitar: limpio(document.querySelector('.espacio-profesional__solicitar')),
      vistas: [...document.querySelectorAll('section.pendientes .vista-de-la-linea')].map((b) => {
        const c = b.querySelector('.vista-de-la-linea__cuenta');
        return { vista: b.dataset.vista, elegida: b.getAttribute('aria-pressed'), cuenta: c ? c.firstChild.textContent.trim() : null, dice: c ? c.textContent.replace(/\s+/g, ' ').trim() : null };
      }),
      masFiltros: limpio(document.querySelector('section.pendientes .vistas-de-la-linea__mas')),
      filas: [...document.querySelectorAll('section.pendientes tr.pendiente')].map((f) => ({
        tipo: f.dataset.tipo,
        area: f.dataset.area,
        persona: limpio(f.querySelector('th')),
        nombreDelArea: limpio(f.querySelector('.pendiente__area')),
        texto: limpio(f.querySelector('.pendiente__texto')),
        ultimo: limpio(f.querySelector('.pendiente__ultimo')),
        destino: ruta(f.querySelector('a.pendiente__enlace')),
        nombreDelEnlace: f.querySelector('a.pendiente__enlace').getAttribute('aria-label'),
        iconos: f.querySelectorAll('svg.icono').length,
      })),
      parcial: limpio(document.querySelector('section.pendientes .pendientes__parcial')),
      etiquetas: [...document.querySelectorAll('section.pendientes .filtros-activos .chip')].map((c) => limpio(c).replace(/ ×.*$/, '')),
      coinciden: limpio(document.querySelector('section.pendientes .pendientes__coinciden')),
      vacio: limpio(document.querySelector('section.pendientes .pendientes__vacio')),
      sinCoincidencias: limpio(document.querySelector('section.pendientes .estado-vacio')),
      falla: limpio(document.querySelector('section.pendientes .estado-de-grafico--error')),
      consulta: limpio(document.querySelector('section.pendientes .pendientes__consulta')),
      cuentaDelDirectorio: limpio(document.querySelector('section.directorio .directorio__cuenta')),
      personas: [...document.querySelectorAll('section.directorio li.persona')].map((p) => ({
        id: p.dataset.persona,
        nombre: limpio(p.querySelector('.persona__nombre')),
        conAcceso: limpio(p.querySelector('.persona__con-acceso')),
        sinAcceso: [...p.querySelectorAll('.persona__sin-acceso')].map(limpio),
        abierta: p.querySelector('.persona__datos').getAttribute('aria-expanded'),
        vinculos: [...p.querySelectorAll('.persona__vinculos li')].map(limpio),
        destino: ruta(p.querySelector('a.persona__abrir')),
        nombreDelEnlace: p.querySelector('a.persona__abrir').getAttribute('aria-label'),
      })),
      fallaDelDirectorio: limpio(document.querySelector('section.directorio .estado-de-grafico--error')),
      directorioVacio: limpio(document.querySelector('section.directorio .directorio__vacio')),
      sinReferencias: limpio(document.querySelector('section.directorio .estado-vacio')),
      solicitudes: limpio(document.querySelector('.directorio__solicitudes')),
      sinResponder: limpio(document.querySelector('.directorio__sin-responder')),
    };
  });

/**
 * El Espacio profesional: «Pendientes» con sus vistas con nombre, el directorio de asesorados y los dos diálogos. Lo
 * esperado se calcula a mano con lo que devuelve la API (`/me/portfolio`, `/me/relationships`,
 * `/me/relationship-requests` y `/me`), sin el dominio: qué tipos junta cada vista, la frase de cada pendiente y las
 * palabras de cada estado de vínculo están escritas acá de nuevo. Los cinco tipos de pendiente que el escenario no
 * tiene se miran con una respuesta simulada en el navegador (`cartera-simulada.mjs`), y lo dice cada comprobación.
 * Cada negativa («no dice…») mira con el mismo selector que una positiva de la misma pantalla. Corre en la sesión de
 * `fichaRecompuesta`, al final; sola, con `node recorrido.mjs espacio`.
 */
async function espacioProfesional(page, v) {
  const num = (n) => new Intl.NumberFormat('es-AR').format(n);
  const fechaBreve = (f) => (f.slice(0, 4) === hoy.slice(0, 4) ? new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${f}T12:00:00Z`)) : diaCivil(f));
  const AREA = { nutrition: 'Nutrición', training: 'Entrenamiento', anthropometry: 'Antropometría' };
  const ORDEN_DE_LAS_VISTAS = ['TODO', 'REVISIONES', 'PLANES', 'FORMULARIOS', 'EVALUACIONES'];
  /** Qué tipos junta cada vista, escrito a mano (no se lee del dominio). */
  const TIPOS_DE = { REVISIONES: ['REVIEW_OVERDUE', 'REVIEW_DUE_SOON', 'REVIEW_UNDATED'], PLANES: ['PLAN_DRAFT_PENDING', 'NO_ACTIVE_PLAN'], FORMULARIOS: ['FORM_REQUEST_OPEN'], EVALUACIONES: ['ANTHRO_DRAFT_PENDING'] };
  const dias = (n) => `${n} ${n === 1 ? 'día' : 'días'}`;
  const frase = (p) =>
    ({
      REVIEW_OVERDUE: `Revisión vencida hace ${dias(p.daysOverdue)}`,
      REVIEW_DUE_SOON: p.daysUntil === 0 ? 'Revisión hoy' : `Revisión en ${dias(p.daysUntil)}`,
      REVIEW_UNDATED: `Revisión pendiente desde el ${p.since ? fechaBreve(p.since) : '—'}`,
      PLAN_DRAFT_PENDING: `Plan en borrador desde el ${p.since ? fechaBreve(p.since) : '—'}`,
      NO_ACTIVE_PLAN: 'Sin plan activo',
      FORM_REQUEST_OPEN: `Formulario sin responder desde el ${p.since ? fechaBreve(p.since) : '—'}`,
      ANTHRO_DRAFT_PENDING: `Toma en preparación desde el ${p.since ? fechaBreve(p.since) : '—'}`,
    })[p.kind];
  const diaEn = (instante, zona) => new Intl.DateTimeFormat('en-CA', { timeZone: zona }).format(new Date(instante));
  const ultimoDe = (p, zona, conPeriodo) => (p.lastActivityAt ? `Último registro: ${fechaBreve(diaEn(p.lastActivityAt, zona))}` : conPeriodo ? 'Sin registros en el período' : 'Sin registros todavía');
  const destinoDe = (p) => (p.open.view === 'solicitudes' ? `/pro/advisees/forms?id=${p.advisee.identityId}&vista=solicitudes` : `/pro/advisees/${p.domain}?id=${p.advisee.identityId}&vista=${p.open.view}`);
  /** Una fila, como tiene que verse. */
  const filaDe = (p, zona, conPeriodo) => ({ tipo: p.kind, area: p.domain, persona: p.advisee.displayName, nombreDelArea: AREA[p.domain], texto: frase(p), ultimo: ultimoDe(p, zona, conPeriodo), destino: destinoDe(p), nombreDelEnlace: `Abrir: ${p.advisee.displayName}, ${AREA[p.domain]}, ${frase(p)}`, iconos: 3 });
  const cuentasDe = (items) => ({ TODO: items.length, ...Object.fromEntries(Object.entries(TIPOS_DE).map(([vista, tipos]) => [vista, items.filter((p) => tipos.includes(p.kind)).length])) });
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const leerCartera = async (extra = '') => {
    const items = [];
    let cursor = null;
    let meta = null;
    do {
      const r = await leerApi(v, `/me/portfolio?limit=50${extra}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
      meta ??= r.data;
      items.push(...r.data.items);
      cursor = r.page.hasMore ? r.page.nextCursor : null;
    } while (cursor);
    return { ...meta, items };
  };
  const leerLista = async (ruta) => {
    const items = [];
    let cursor = null;
    do {
      const r = await leerApi(v, `${ruta}${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);
      items.push(...r.data);
      cursor = r.page.hasMore ? r.page.nextCursor : null;
    } while (cursor);
    return items;
  };
  /** Los pedidos de la página (no los del recorrido) a una dirección de la API, desde una marca. */
  const pedidos = (fragmento, desde, metodo = 'GET') => v.urls.slice(desde).filter((u) => u.startsWith(`${metodo} `) && u.includes(fragmento));
  const vista = (clave) => `section.pendientes .vista-de-la-linea[data-vista="${clave}"]`;
  const actualizar = async () => {
    await cupo(v, 60);
    await page.click('section.pendientes .pendientes__actualizar');
    await quieto(page, v);
  };

  await cupo(v, 60);
  const alEntrar = v.urls.length;
  await ir(page, '/pro');
  await page.waitForSelector('section.pendientes', { timeout: 30_000 });
  await quieto(page, v);
  await page.evaluate(() => window.scrollTo(0, 0));
  const yo = (await leerApi(v, '/me')).data;
  const cartera = await leerCartera();
  const vinculos = (await leerLista('/me/relationships')).filter((x) => x.professional.identityId === yo.identityId);
  const enviadas = (await leerLista('/me/relationship-requests')).filter((x) => x.professional.identityId === yo.identityId && x.initiatedBy === 'PROFESSIONAL');
  const zona = cartera.timeZone;
  const cuentas = cuentasDe(cartera.items);
  const inicial = await espacioEnPantalla(page);

  // E-93 · El encabezado ────────────────────────────────────────────────────────────────────────────────
  const hoyEscrito = `Hoy, ${new Intl.DateTimeFormat('es-AR', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${cartera.today}T12:00:00Z`))} ${diaCivil(cartera.today)}`;
  comprobar(
    'E-93',
    'El encabezado dice «Espacio profesional» (el único título de la página), «Hoy» con el día de la semana y el año de la fecha con que la API clasificó las revisiones, y «Solicitar vínculo»',
    igual(inicial.titulos, ['Espacio profesional']) && inicial.hoy === hoyEscrito && inicial.solicitar === 'Solicitar vínculo',
    `${inicial.titulos.join(' | ')} · ${inicial.hoy} (la API dice ${cartera.today}) · ${inicial.solicitar}`,
  );

  // E-83 · Una sola lectura protegida al entrar, y con toda la cartera ───────────────────────────────────────
  const alAbrir = pedidos('/me/portfolio', alEntrar);
  comprobar(
    'E-83',
    'Al entrar, la página lee los pendientes una sola vez y de a 50 (la cartera entera, para poder contarla), y una vez cada una de las otras dos listas',
    alAbrir.length === 1 && /[?&]limit=50(&|$)/.test(alAbrir[0]) && !/periodStart|domain=|kind=/.test(alAbrir[0]) && pedidos('/me/relationships', alEntrar).length === 1 && pedidos('/me/relationship-requests', alEntrar).length === 1,
    `${alAbrir.map((u) => u.replace(API, '')).join(' · ')} · vínculos: ${pedidos('/me/relationships', alEntrar).length} · solicitudes: ${pedidos('/me/relationship-requests', alEntrar).length}`,
  );

  // E-84 · Las vistas con nombre y sus cantidades ────────────────────────────────────────────────────────
  comprobar(
    'E-84',
    'Las cinco vistas están en su orden, cada una con la cantidad de pendientes que trae (contada a mano sobre la lista de la API); las cuatro suman «Todo», una vista en cero se muestra con su cero, y al entrar está elegida «Todo»',
    igual(inicial.vistas.map((x) => x.vista), ORDEN_DE_LAS_VISTAS) &&
      inicial.vistas.every((x) => x.cuenta === num(cuentas[x.vista]) && x.dice === `${num(cuentas[x.vista])} ${cuentas[x.vista] === 1 ? 'pendiente' : 'pendientes'}`) &&
      cuentas.REVISIONES + cuentas.PLANES + cuentas.FORMULARIOS + cuentas.EVALUACIONES === cuentas.TODO &&
      cuentas.TODO > 0 &&
      inicial.vistas.every((x) => x.elegida === (x.vista === 'TODO' ? 'true' : 'false')),
    inicial.vistas.map((x) => `${x.vista} ${x.cuenta}`).join(' · '),
  );

  // E-87 · Cada fila, con lo que dice la API ──────────────────────────────────────────────────────────────
  const esperadas = cartera.items.map((p) => filaDe(p, zona, false));
  comprobar(
    'E-87',
    'Cada pendiente es una fila, en el orden de la API: la persona, el área y lo pendiente con su ícono y la frase de BE, debajo el último registro (el día en que ocurrió, en la zona de la respuesta) y «Abrir», que lleva a la vista que lo resuelve y se llama distinto en cada fila',
    inicial.filas.length > 0 && igual(inicial.filas, esperadas) && new Set(inicial.filas.map((f) => f.nombreDelEnlace)).size === inicial.filas.length,
    inicial.filas.map((f) => `${f.persona} · ${f.nombreDelArea} · ${f.texto} · ${f.ultimo} → ${f.destino.replace(/id=[^&]+/, 'id=…')}`).join(' | ') || 'sin filas',
  );
  comprobar('E-88', 'Con datos que el profesional puede ver enteros, el aviso de vista parcial no está (la API dice que no hay nada fuera de su alcance)', cartera.partialView === false && inicial.parcial === null, `partialView: ${cartera.partialView} · aviso: ${inicial.parcial ?? 'no está'}`);

  // E-84 · Elegir cada vista no le pide nada a la API ─────────────────────────────────────────────────────
  const antesDeElegir = v.urls.length;
  const porVista = {};
  for (const clave of ORDEN_DE_LAS_VISTAS.slice(1)) {
    await page.click(vista(clave));
    await pausa(250);
    const e = await espacioEnPantalla(page);
    const delTipo = cartera.items.filter((p) => TIPOS_DE[clave].includes(p.kind)).map((p) => filaDe(p, zona, false));
    porVista[clave] = {
      elegidas: e.vistas.filter((x) => x.elegida === 'true').map((x) => x.vista),
      filas: igual(e.filas, delTipo),
      cuantas: e.filas.length,
      // Una vista sin filas dice que nada coincide y cuántos hay en total: no dice que no hay nada pendiente.
      vacia: delTipo.length > 0 ? null : { texto: e.sinCoincidencias, nadaPendiente: e.vacio },
    };
  }
  const enCero = Object.entries(porVista).filter(([, x]) => x.vacia);
  const totalEscrito = cuentas.TODO === 1 ? 'Hay un pendiente en total.' : `Hay ${num(cuentas.TODO)} pendientes en total.`;
  comprobar(
    'E-84',
    'Cada vista trae lo que anuncia: queda elegida ella sola, sus filas son las de sus tipos en el orden de la API, y elegirla no le pide nada a la API',
    Object.entries(porVista).every(([clave, x]) => igual(x.elegidas, [clave]) && x.filas && x.cuantas === cuentas[clave]) && pedidos('/me/', antesDeElegir).length === 0,
    `${Object.entries(porVista).map(([clave, x]) => `${clave}: ${x.cuantas}`).join(' · ')} · pedidos a la API al elegir: ${pedidos('/me/', antesDeElegir).length}`,
  );
  if (enCero.length > 0) {
    comprobar(
      'E-96',
      'Una vista sin filas dice «Ningún pendiente coincide con lo elegido» y cuántos hay en total, con «Ver todo»: no dice que no hay nada pendiente (con «Todo» elegido, las filas están, con el mismo selector)',
      enCero.every(([, x]) => x.vacia.texto === `Ningún pendiente coincide con lo elegido. ${totalEscrito} Ver todo` && x.vacia.nadaPendiente === null) && inicial.sinCoincidencias === null && inicial.filas.length === cuentas.TODO,
      `${enCero.map(([clave, x]) => `${clave}: ${x.vacia.texto}`).join(' | ')}`,
    );
    await clic(page, 'section.pendientes .estado-vacio button', 'Ver todo');
    await pausa(250);
  } else {
    informar('E-96', 'Una vista sin filas', 'el escenario tiene pendientes en las cuatro vistas');
    await page.click(vista('TODO'));
    await pausa(250);
  }
  // Volver a tocar la vista elegida deja «Todo».
  await page.click(vista('REVISIONES'));
  await pausa(200);
  await page.click(vista('REVISIONES'));
  await pausa(250);
  const deVuelta = await espacioEnPantalla(page);
  comprobar('E-84', 'Volver a tocar la vista elegida deja «Todo», con todos los pendientes', igual(deVuelta.vistas.filter((x) => x.elegida === 'true').map((x) => x.vista), ['TODO']) && deVuelta.filas.length === cuentas.TODO, `${deVuelta.filas.length} filas`);

  // E-85 · «Más filtros»: un área y un tipo exacto, a medida ──────────────────────────────────────────────
  const conArea = cartera.items.find((p) => cartera.items.some((q) => q.domain !== p.domain))?.domain ?? cartera.items[0].domain;
  const tipoSuelto = cartera.items.find((p) => p.domain === conArea).kind;
  const NOMBRE_DEL_TIPO = { REVIEW_OVERDUE: 'Revisión vencida', REVIEW_DUE_SOON: 'Revisión próxima', REVIEW_UNDATED: 'Revisión sin fecha', PLAN_DRAFT_PENDING: 'Plan en borrador', NO_ACTIVE_PLAN: 'Sin plan activo', FORM_REQUEST_OPEN: 'Formulario sin responder', ANTHRO_DRAFT_PENDING: 'Toma en preparación' };
  const antesDeFiltrar = v.urls.length;
  await clic(page, 'section.pendientes .vistas-de-la-linea__mas', 'Más filtros');
  await page.waitForSelector('section.pendientes .pendientes__filtros select', { timeout: 5_000 });
  const camposDeFiltros = await textos(page, 'section.pendientes .pendientes__filtros label');
  await elegir(page, 'section.pendientes .pendientes__filtros', 'Área', conArea);
  await pausa(250);
  const porArea = await espacioEnPantalla(page);
  const delArea = cartera.items.filter((p) => p.domain === conArea);
  await elegir(page, 'section.pendientes .pendientes__filtros', 'Tipo de pendiente', tipoSuelto);
  await pausa(250);
  const porAreaYTipo = await espacioEnPantalla(page);
  const delAreaYTipo = delArea.filter((p) => p.kind === tipoSuelto);
  const coincidenEscrito = (n) => `${n === 1 ? 'Un pendiente coincide' : `${num(n)} pendientes coinciden`}, de ${num(cuentas.TODO)}.`;
  comprobar(
    'E-85',
    '«Más filtros» guarda el área, el tipo exacto y el período del último registro. Con un área elegida las filas son las de esa área, ninguna vista queda elegida, lo puesto se lista con su salida y se dice cuántos coinciden de cuántos; sumar un tipo exacto acota más. Las cantidades de las vistas no cambian, y nada de esto le pide algo a la API',
    igual(camposDeFiltros.slice(0, 2), ['Área', 'Tipo de pendiente']) &&
      camposDeFiltros.includes('Desde') &&
      camposDeFiltros.includes('Hasta') &&
      /Período del último registro/.test(await texto(page, 'section.pendientes .pendientes__periodo')) &&
      /Acota solo el último registro de cada fila\. Los pendientes no cambian\./.test(await texto(page, 'section.pendientes .pendientes__periodo')) &&
      igual(porArea.filas, delArea.map((p) => filaDe(p, zona, false))) &&
      porArea.vistas.every((x) => x.elegida === 'false' && x.cuenta === num(cuentas[x.vista])) &&
      igual(porArea.etiquetas, [`Área: ${AREA[conArea]}`]) &&
      porArea.coinciden === coincidenEscrito(delArea.length) &&
      porArea.masFiltros === 'Más filtros (1)' &&
      igual(porAreaYTipo.filas, delAreaYTipo.map((p) => filaDe(p, zona, false))) &&
      igual(porAreaYTipo.etiquetas, [`Área: ${AREA[conArea]}`, `Tipo: ${NOMBRE_DEL_TIPO[tipoSuelto]}`]) &&
      porAreaYTipo.coinciden === coincidenEscrito(delAreaYTipo.length) &&
      porAreaYTipo.masFiltros === 'Más filtros (2)' &&
      pedidos('/me/', antesDeFiltrar).length === 0,
    `${AREA[conArea]}: ${porArea.filas.length} de ${cuentas.TODO} · ${porArea.etiquetas.join(', ')} · «${porArea.coinciden}» · con ${NOMBRE_DEL_TIPO[tipoSuelto]}: ${porAreaYTipo.filas.length} · ${porAreaYTipo.masFiltros}`,
  );
  await clic(page, 'section.pendientes .filtros-activos button', 'Limpiar filtros');
  await pausa(250);
  const limpio = await espacioEnPantalla(page);
  comprobar('E-85', '«Limpiar filtros» vuelve a «Todo», sin nada puesto', igual(limpio.vistas.filter((x) => x.elegida === 'true').map((x) => x.vista), ['TODO']) && limpio.etiquetas.length === 0 && limpio.filas.length === cuentas.TODO && limpio.masFiltros === 'Más filtros', `${limpio.filas.length} filas · ${limpio.masFiltros}`);

  // E-86 · El período acota solo el último registro ───────────────────────────────────────────────────────
  // Un período anterior a todo lo registrado: los pendientes siguen y su último registro pasa a «sin registros en el período».
  const desde = diaMenos(hoy, 400);
  const hasta = diaMenos(hoy, 370);
  const antesDelPeriodo = v.urls.length;
  await cupo(v, 60);
  await fijarFecha(page, 'section.pendientes .pendientes__periodo input[type="date"]', desde);
  await page.evaluate(
    (valor) => {
      const el = document.querySelectorAll('section.pendientes .pendientes__periodo input[type="date"]')[1];
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, valor);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    hasta,
  );
  await clic(page, 'section.pendientes .pendientes__periodo button', 'Ver período');
  await quieto(page, v);
  const conPeriodo = await espacioEnPantalla(page);
  const carteraDelPeriodo = await leerCartera(`&periodStart=${desde}&periodEnd=${hasta}`);
  const delPeriodo = pedidos('/me/portfolio', antesDelPeriodo);
  await page.evaluate(() => [...document.querySelectorAll('section.pendientes .filtros-activos .chip')].find((c) => c.innerText.startsWith('Último registro'))?.click());
  await quieto(page, v);
  const sinPeriodo = await espacioEnPantalla(page);
  comprobar(
    'E-86',
    'El período se le pide a la API (una lectura, con sus dos fechas) y no cambia qué está pendiente: las filas son las mismas, y su último registro es el de ese período («Sin registros en el período» donde no hay). Lo puesto se lista con su salida; al quitarlo, el último registro vuelve a ser el de toda la historia',
    delPeriodo.length === 1 &&
      delPeriodo[0].includes(`periodStart=${desde}`) &&
      delPeriodo[0].includes(`periodEnd=${hasta}`) &&
      igual(conPeriodo.filas, carteraDelPeriodo.items.map((p) => filaDe(p, zona, true))) &&
      igual(conPeriodo.filas.map((f) => `${f.persona}|${f.area}|${f.tipo}`), inicial.filas.map((f) => `${f.persona}|${f.area}|${f.tipo}`)) &&
      conPeriodo.filas.some((f) => f.ultimo === 'Sin registros en el período') &&
      igual(conPeriodo.etiquetas, [`Último registro: ${diaCivil(desde)} – ${diaCivil(hasta)}`]) &&
      conPeriodo.vistas.find((x) => x.vista === 'TODO').elegida === 'true' &&
      igual(sinPeriodo.filas, esperadas) &&
      sinPeriodo.etiquetas.length === 0 &&
      !sinPeriodo.filas.some((f) => f.ultimo === 'Sin registros en el período'),
    `${delPeriodo.map((u) => u.replace(API, '').slice(0, 90)).join(' · ')} · con período: ${[...new Set(conPeriodo.filas.map((f) => f.ultimo))].join(', ')} · sin período: ${[...new Set(sinPeriodo.filas.map((f) => f.ultimo))].join(', ')}`,
  );
  await clic(page, 'section.pendientes .vistas-de-la-linea__mas', 'Más filtros');
  await pausa(200);

  // E-88 · «Actualizar» vuelve a leer todo lo que la página muestra ─────────────────────────────────────────
  const antesDeActualizar = v.urls.length;
  await actualizar();
  const actualizado = await espacioEnPantalla(page);
  comprobar(
    'E-88',
    '«Actualizar», al pie de los pendientes, vuelve a leer las tres listas (una vez cada una) y dice a qué hora se consultó',
    pedidos('/me/portfolio', antesDeActualizar).length === 1 && pedidos('/me/relationships', antesDeActualizar).length === 1 && pedidos('/me/relationship-requests', antesDeActualizar).length === 1 && /^Consultado a las \d{2}:\d{2}$/.test(actualizado.consulta ?? '') && igual(actualizado.filas, esperadas),
    `${pedidos('/me/', antesDeActualizar).map((u) => u.replace(`${API}/api/v1`, '').slice(4, 40)).join(' · ')} · ${actualizado.consulta}`,
  );

  // E-98 · Los siete tipos y el aviso de vista parcial, con una respuesta simulada en el navegador ────────────────────
  const simulada = carteraSimulada(estado);
  v.reglas = [{ coincide: (u) => u.includes('/me/portfolio'), accion: 'entregar', cuerpo: simulada }];
  await actualizar();
  const conSiete = await espacioEnPantalla(page);
  const cuentasSimuladas = cuentasDe(simulada.data.items);
  const cajas = () =>
    page.evaluate(() => {
      const fin = (s) => Math.round(document.querySelector(s).getBoundingClientRect().bottom + window.scrollY);
      return { pendientes: fin('section.pendientes'), directorio: fin('section.directorio'), pagina: document.documentElement.scrollHeight };
    });
  const medidas = await cajas();
  // Con filas del alto de las tarjetas de antes, la misma medición tiene que dar que no entra.
  await page.addStyleTag({ content: 'section.pendientes tr.pendiente { height: 215px !important; }' }).then((h) => h.evaluate((s) => s.setAttribute('data-recorrido', 'filas-altas')));
  await pausa(200);
  const conFilasAltas = await cajas();
  await page.evaluate(() => document.querySelector('style[data-recorrido="filas-altas"]').remove());
  await pausa(200);
  // Lo mismo, medido en otras dos ventanas (se informa; no se exige): la de Dirección, estimada, y la más angosta de
  // las de escritorio con dos columnas.
  const otrasVentanas = {};
  for (const [ancho, alto] of [
    [1920, 950],
    [1280, 900],
  ]) {
    await page.setViewport({ width: ancho, height: alto });
    await pausa(400);
    const c = await cajas();
    otrasVentanas[`${ancho} × ${alto}`] = `${c.pendientes} y ${c.directorio} px`;
  }
  await page.setViewport({ width: 1440, height: 900 });
  await pausa(400);
  comprobar(
    'E-98',
    'Con una respuesta simulada que trae los siete tipos (la API y la base no se tocan), cada tipo se dice con su frase de BE, su ícono, su último registro («Sin registros todavía» donde no hay) y el destino de su «Abrir»; las vistas cuentan 7, 3, 2, 1 y 1',
    igual(conSiete.filas, simulada.data.items.map((p) => filaDe(p, simulada.data.timeZone, false))) &&
      new Set(conSiete.filas.map((f) => f.tipo)).size === 7 &&
      igual(conSiete.vistas.map((x) => x.cuenta), ORDEN_DE_LAS_VISTAS.map((x) => num(cuentasSimuladas[x]))) &&
      igual(Object.values(cuentasSimuladas), [7, 3, 2, 1, 1]) &&
      conSiete.filas.filter((f) => f.ultimo === 'Sin registros todavía').length === 2,
    conSiete.filas.map((f) => `${f.texto} (${f.ultimo}) → ${f.destino.replace(/id=[^&]+/, 'id=…')}`).join(' | '),
  );
  comprobar(
    'E-88',
    'Cuando la respuesta dice que hay datos fuera del alcance del profesional (respuesta simulada), el aviso de vista parcial está debajo de las vistas y arriba de la tabla, con el texto de BE: es el mismo lugar donde con los datos reales no hay nada',
    simulada.data.partialView === true &&
      conSiete.parcial === 'Hay datos de algún asesorado que no podés ver desde tu alcance: no se cuentan acá.' &&
      (await page.evaluate(() => {
        const y = (s) => document.querySelector(s).getBoundingClientRect().top;
        return y('section.pendientes .vistas-de-la-linea') < y('section.pendientes .pendientes__parcial') && y('section.pendientes .pendientes__parcial') < y('section.pendientes table');
      })),
    conSiete.parcial ?? 'no está',
  );
  comprobar(
    'E-94',
    'A 1440 × 900, con siete pendientes (respuesta simulada) y los asesorados del escenario, los pendientes y el directorio terminan dentro de la primera pantalla (antes la página medía tres); con filas del alto de las tarjetas de antes, la misma medición da que no entran (prueba de la prueba)',
    medidas.pendientes <= 900 && medidas.directorio <= 900 && conFilasAltas.pendientes > 900,
    `los pendientes terminan en ${medidas.pendientes} px y el directorio en ${medidas.directorio} px; la página mide ${medidas.pagina} px · con filas de 215 px: ${conFilasAltas.pendientes} px · en otras ventanas: ${Object.entries(otrasVentanas).map(([ventana, fin]) => `${ventana}, ${fin}`).join('; ')}`,
  );
  v.reglas = [];
  await actualizar();

  // E-96 · Una falla dice su motivo, y no esconde lo que sí se pudo leer ────────────────────────────────────
  v.reglas = [{ coincide: (u) => u.includes('/me/portfolio'), accion: 'responder', status: 429, codigo: 'RATE_LIMITED' }];
  await actualizar();
  const conLimite = await espacioEnPantalla(page);
  v.reglas = [{ coincide: (u) => u.includes('/me/portfolio'), accion: 'cortar' }];
  await clic(page, 'section.pendientes .estado-de-grafico--error button', 'Reintentar');
  await quieto(page, v);
  const sinRed = await espacioEnPantalla(page);
  v.reglas = [];
  await clic(page, 'section.pendientes .estado-de-grafico--error button', 'Reintentar');
  await quieto(page, v);
  const recuperado = await espacioEnPantalla(page);
  comprobar(
    'E-96',
    'Si la lectura de los pendientes falla, el bloque dice qué pasó, por qué y qué hacer («muchas consultas seguidas… Esperá un minuto»; sin red, «no hay conexión»): las vistas quedan sin número, «hoy» no se dice, no aparece «Nada pendiente», y el directorio sigue a la vista. «Reintentar» lo trae',
    /^No pudimos cargar los pendientes Hubo muchas consultas seguidas\. Esperá un minuto y reintentá\. Reintentar/.test(conLimite.falla ?? '') &&
      conLimite.vistas.every((x) => x.cuenta === null) &&
      conLimite.hoy === null &&
      conLimite.vacio === null &&
      conLimite.filas.length === 0 &&
      conLimite.personas.length === inicial.personas.length &&
      /^No pudimos cargar los pendientes No hay conexión con BE\. Revisá la conexión y reintentá\./.test(sinRed.falla ?? '') &&
      recuperado.falla === null &&
      igual(recuperado.filas, esperadas) &&
      recuperado.hoy === hoyEscrito,
    `${conLimite.falla} | ${sinRed.falla} | después: ${recuperado.filas.length} filas`,
  );
  v.reglas = [{ coincide: (u) => u.includes('/me/relationships'), accion: 'responder', status: 503, codigo: 'DB_UNAVAILABLE' }];
  await actualizar();
  const sinDirectorio = await espacioEnPantalla(page);
  v.reglas = [];
  await clic(page, 'section.directorio .estado-de-grafico--error button', 'Reintentar');
  await quieto(page, v);
  const conDirectorio = await espacioEnPantalla(page);
  comprobar(
    'E-96',
    'Si falla la lectura de los asesorados, el directorio lo dice con su motivo («BE no está disponible») y no dice que no hay asesorados; los pendientes siguen. «Reintentar» lo trae',
    /^No pudimos cargar tus asesorados BE no está disponible en este momento\. Reintentá en unos minutos\./.test(sinDirectorio.fallaDelDirectorio ?? '') && sinDirectorio.directorioVacio === null && sinDirectorio.personas.length === 0 && sinDirectorio.cuentaDelDirectorio === null && igual(sinDirectorio.filas, esperadas) && conDirectorio.fallaDelDirectorio === null && conDirectorio.personas.length === inicial.personas.length,
    `${sinDirectorio.fallaDelDirectorio} · pendientes a la vista: ${sinDirectorio.filas.length} · después: ${conDirectorio.personas.length} personas`,
  );
  // Las fallas de arriba fueron simuladas: lo que sigue responde por los errores reales.
  v.errores.length = 0;
  v.malas.length = 0;

  // E-89 · El directorio ─────────────────────────────────────────────────────────────────────────────────
  const ORDEN_DE_LAS_AREAS = ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'];
  const FINALIDAD = { ACOMPANAMIENTO_NUTRICIONAL: 'Acompañamiento nutricional', PLANIFICACION_DEL_ENTRENAMIENTO: 'Planificación del entrenamiento', EVALUACION_ANTROPOMETRICA: 'Evaluación antropométrica' };
  /** Las palabras de cada estado de vínculo, para el profesional (10-B04 §28; H10-04-04): seis casos, escritos a mano. */
  const estadoDe = (x) => {
    if (x.relationshipState === 'FINALIZADO') return ['Finalizado', null];
    if (x.relationshipState === 'PAUSADO') return ['Pausado · sin acceso', null];
    if (x.consentState === 'REQUIRED') return ['Vínculo activo', 'Acceso pendiente de autorización del asesorado'];
    if (x.consentState === 'REVOKED') return ['Consentimiento revocado', 'Acceso no disponible'];
    if (x.accessMode === 'CONTEXTUAL') return ['Activo · acceso contextual', null];
    return ['Vínculo activo', 'Acceso no disponible'];
  };
  const conAccesoDe = (x) => estadoDe(x)[0] === 'Activo · acceso contextual';
  const PESO = { ACEPTADO: 0, PAUSADO: 1, FINALIZADO: 2 };
  const personasEsperadas = [...new Set(vinculos.map((x) => x.advisee.identityId))].map((id) => {
    const suyos = vinculos.filter((x) => x.advisee.identityId === id).sort((a, b) => ORDEN_DE_LAS_AREAS.indexOf(a.scope.code) - ORDEN_DE_LAS_AREAS.indexOf(b.scope.code) || b.acceptedAt.localeCompare(a.acceptedAt));
    const conAcceso = [];
    const sinAcceso = [];
    for (const alcance of ORDEN_DE_LAS_AREAS) {
      const delArea = suyos.filter((x) => x.scope.code === alcance);
      if (delArea.length === 0) continue;
      const activo = delArea.find(conAccesoDe);
      if (activo) conAcceso.push(activo.scope.label);
      else {
        const [elQueMasDice] = [...delArea].sort((a, b) => PESO[a.relationshipState] - PESO[b.relationshipState]);
        sinAcceso.push(`${elQueMasDice.scope.label}: ${estadoDe(elQueMasDice).filter(Boolean).join(' · ')}`);
      }
    }
    return { id, nombre: suyos[0].advisee.displayName, conAcceso: conAcceso.length ? conAcceso.join(' · ') : null, sinAcceso, destino: `/pro/advisees?id=${id}`, nombreDelEnlace: `Abrir la ficha de ${suyos[0].advisee.displayName}`, vinculos: suyos };
  });
  const sinDetalle = ({ vinculos: _vinculos, ...resto }) => resto;
  const directorio = conDirectorio.personas.map(({ abierta: _abierta, vinculos: _vinculos, ...resto }) => resto);
  comprobar(
    'E-89',
    'El directorio tiene una persona por renglón, tantas como asesorados distintos tiene el profesional en la API y en su orden; el título las cuenta; cada una dice su referencia, sus áreas con acceso en el orden de BE (y las que no lo tienen, con las palabras de BE), y «Abrir», que lleva a su ficha y la nombra',
    personasEsperadas.length > 0 && igual(directorio, personasEsperadas.map(sinDetalle)) && conDirectorio.cuentaDelDirectorio === `${num(personasEsperadas.length)} ${personasEsperadas.length === 1 ? 'persona' : 'personas'}` && conDirectorio.personas.every((p) => p.abierta === 'false' && p.vinculos.length === 0),
    `${conDirectorio.cuentaDelDirectorio} · ${conDirectorio.personas.map((p) => `${p.nombre}: ${p.conAcceso ?? '—'}${p.sinAcceso.length ? ` (${p.sinAcceso.join('; ')})` : ''}`).join(' | ')}`,
  );
  // El detalle de una persona: cada vínculo con su finalidad, su estado y desde cuándo (lo que antes estaba a la vista).
  const conVarias = personasEsperadas.reduce((a, b) => (b.vinculos.length > a.vinculos.length ? b : a));
  const deEsaPersona = `section.directorio li.persona[data-persona="${conVarias.id}"]`;
  await page.click(`${deEsaPersona} .persona__datos`);
  await pausa(250);
  const abierta = (await espacioEnPantalla(page)).personas.find((p) => p.id === conVarias.id);
  const diaDelNavegador = (instante) => new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(new Date(instante));
  const detalleEsperado = conVarias.vinculos.map((x) => `${x.scope.label} · ${FINALIDAD[x.purpose]} ${estadoDe(x).filter(Boolean).join(' ')} Desde el ${diaDelNavegador(x.acceptedAt)}`);
  await page.click(`${deEsaPersona} .persona__datos`);
  await pausa(200);
  const cerrada = (await espacioEnPantalla(page)).personas.find((p) => p.id === conVarias.id);
  comprobar(
    'E-89',
    'Tocar a una persona abre, en el lugar, el detalle de cada uno de sus vínculos: el área con su finalidad, el estado con las palabras de BE y desde cuándo. Volver a tocarla lo cierra',
    abierta.abierta === 'true' && igual(abierta.vinculos, detalleEsperado) && detalleEsperado.length > 0 && cerrada.abierta === 'false' && cerrada.vinculos.length === 0,
    `${abierta.nombre}: ${abierta.vinculos.join(' | ')}`,
  );

  // E-90 · El buscador ───────────────────────────────────────────────────────────────────────────────────
  const buscador = 'section.directorio .buscador-del-directorio input[type="search"]';
  const rotuloDelBuscador = await page.evaluate((s) => {
    const campo = document.querySelector(s);
    return { rotulo: document.querySelector(`label[for="${campo.id}"]`)?.textContent.trim() ?? null, ejemplo: campo.placeholder };
  }, buscador);
  const antesDeBuscar = v.urls.length;
  const laDeA = personasEsperadas.find((p) => p.id === estado.aseId) ?? personasEsperadas[0];
  // El final de una referencia, en mayúsculas: quiénes la tienen se calcula a mano sobre los nombres de la API.
  const buscado = laDeA.nombre.slice(-4).toUpperCase();
  const lasQueCoinciden = personasEsperadas.filter((p) => p.nombre.toLowerCase().includes(buscado.toLowerCase())).map((p) => p.id);
  await page.type(buscador, buscado);
  await pausa(300);
  const buscada = await espacioEnPantalla(page);
  // Se reemplaza lo escrito con el teclado (seleccionar todo y escribir): tres clics no seleccionan un texto sin espacios.
  await page.focus(buscador);
  await page.keyboard.down('Control');
  await page.keyboard.press('a');
  await page.keyboard.up('Control');
  await page.keyboard.type('zzzz');
  await pausa(300);
  const sinNadie = await espacioEnPantalla(page);
  await clic(page, 'section.directorio .estado-vacio button', 'Quitar la búsqueda');
  await pausa(300);
  const otraVezTodas = await espacioEnPantalla(page);
  comprobar(
    'E-90',
    'El buscador se llama «Buscar por referencia» (también para el lector de pantalla) y filtra mientras se escribe, sin pedirle nada a la API: con el final de una referencia, en mayúsculas, quedan las personas que la tienen y el título dice cuántas de cuántas; con algo que no coincide dice que ninguna referencia coincide (no que no hay asesorados) y ofrece quitar la búsqueda, que las trae a todas',
    rotuloDelBuscador.rotulo === 'Buscar por referencia' &&
      rotuloDelBuscador.ejemplo === 'Buscar por referencia' &&
      lasQueCoinciden.length >= 1 &&
      lasQueCoinciden.length < personasEsperadas.length &&
      igual(buscada.personas.map((p) => p.id), lasQueCoinciden) &&
      buscada.cuentaDelDirectorio === `${num(lasQueCoinciden.length)} de ${num(personasEsperadas.length)} personas` &&
      sinNadie.personas.length === 0 &&
      sinNadie.sinReferencias === 'Ninguna referencia coincide con «zzzz». Quitar la búsqueda' &&
      sinNadie.directorioVacio === null &&
      sinNadie.cuentaDelDirectorio === `0 de ${num(personasEsperadas.length)} personas` &&
      otraVezTodas.personas.length === personasEsperadas.length &&
      pedidos('/me/', antesDeBuscar).length === 0,
    `«${buscado}»: ${buscada.personas.map((p) => p.nombre).join(', ')} (${buscada.cuentaDelDirectorio}) · «zzzz»: ${sinNadie.sinReferencias} · pedidos: ${pedidos('/me/', antesDeBuscar).length}`,
  );

  // E-92 · Las solicitudes enviadas, a un clic ─────────────────────────────────────────────────────────────
  const ESTADO_DE_SOLICITUD = { PENDIENTE: 'Pendiente', ACEPTADA: 'Aceptada', RECHAZADA: 'Rechazada', CADUCADA: 'Caducada', INVALIDADA: 'Sin efecto' };
  const sinResponder = enviadas.filter((s) => s.state === 'PENDIENTE').length;
  await page.click('.directorio__solicitudes');
  await page.waitForSelector('dialog.dialogo--solicitudes[open]', { timeout: 5_000 });
  await pausa(300);
  const listaAbierta = await page.evaluate(() => {
    const d = document.querySelector('dialog.dialogo--solicitudes');
    return {
      modal: d.matches(':modal'),
      titulo: d.querySelector('h2').innerText.trim(),
      focoEnElTitulo: document.activeElement === d.querySelector('h2'),
      columnas: [...d.querySelectorAll('thead th')].map((x) => x.innerText.trim()),
      filas: [...d.querySelectorAll('tbody tr')].map((f) => [...f.querySelectorAll('td')].slice(0, 3).map((c) => c.innerText.replace(/\s+/g, ' ').trim()).join(' | ')),
    };
  });
  const axeDeLaLista = await axe(page);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 5_000 });
  const focoAlCerrarLaLista = await page.evaluate(() => document.activeElement?.matches('.directorio__solicitudes') ?? false);
  // La prueba de la prueba del foco: si el título no pudiera recibirlo, el diálogo se abriría con el foco en otro lado
  // (en «Cerrar», al final) y esta misma medición tiene que decirlo. Este navegador ya enfoca el primer elemento
  // enfocable al abrir un diálogo, y por eso quitar solo el pedido de foco de la pantalla no cambia nada acá.
  await page.evaluate(() => document.querySelector('dialog.dialogo--solicitudes h2').removeAttribute('tabindex'));
  await page.click('.directorio__solicitudes');
  await page.waitForSelector('dialog.dialogo--solicitudes[open]', { timeout: 5_000 });
  await pausa(300);
  const sinTituloEnfocable = await page.evaluate(() => document.activeElement === document.querySelector('dialog.dialogo--solicitudes h2'));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 5_000 });
  await page.evaluate(() => document.querySelector('dialog.dialogo--solicitudes h2').setAttribute('tabindex', '-1'));
  comprobar(
    'E-92',
    '«Solicitudes enviadas (N)», al pie del directorio, dice cuántas envió el profesional (las de la API) y, si alguna espera respuesta, lo dice aparte. Abre un diálogo que retiene el foco y se abre por su título, con una fila por solicitud (la persona, el área con su finalidad y el estado con la palabra de BE). Escape lo cierra y devuelve el foco. Con un título que no puede recibir el foco, la misma medición dice que el foco no está en él (prueba de la prueba)',
    conDirectorio.solicitudes === `Solicitudes enviadas (${num(enviadas.length)})` &&
      conDirectorio.sinResponder === (sinResponder > 0 ? `${num(sinResponder)} ${sinResponder === 1 ? 'pendiente de respuesta' : 'pendientes de respuesta'}` : null) &&
      listaAbierta.modal &&
      listaAbierta.titulo === 'Solicitudes enviadas' &&
      listaAbierta.focoEnElTitulo &&
      !sinTituloEnfocable &&
      igual(listaAbierta.columnas, ['Asesorado', 'Alcance', 'Estado', 'Enviada']) &&
      enviadas.length > 0 &&
      igual(listaAbierta.filas, enviadas.map((s) => `${s.advisee.displayName} | ${s.scope.label} · ${FINALIDAD[s.purpose]} | ${ESTADO_DE_SOLICITUD[s.state]}`)) &&
      axeDeLaLista.length === 0 &&
      focoAlCerrarLaLista,
    `${conDirectorio.solicitudes}${conDirectorio.sinResponder ? ` · ${conDirectorio.sinResponder}` : ''} · ${listaAbierta.filas.length} filas · estados: ${[...new Set(enviadas.map((s) => ESTADO_DE_SOLICITUD[s.state]))].join(', ')} · axe: ${axeDeLaLista.length} · foco en el título: ${listaAbierta.focoEnElTitulo}; con el título sin foco posible: ${sinTituloEnfocable} · foco al cerrar: ${focoAlCerrarLaLista}`,
  );

  // E-91 · «Solicitar vínculo», a un clic ─────────────────────────────────────────────────────────────────
  const formulario = 'dialog.dialogo--formulario';
  await page.click('.espacio-profesional__solicitar');
  await page.waitForSelector(`${formulario}[open]`, { timeout: 5_000 });
  await pausa(300);
  const alAbrirElFormulario = await page.evaluate((s) => {
    const d = document.querySelector(s);
    return {
      modal: d.matches(':modal'),
      titulo: d.querySelector('h2').innerText.trim(),
      focoEnElPrimerCampo: document.activeElement === d.querySelector('input'),
      campos: [...d.querySelectorAll('label')].map((l) => l.innerText.trim()),
      finalidad: [...d.querySelectorAll('p')].map((p) => p.innerText.trim()).find((t) => t.startsWith('Finalidad')) ?? null,
      botones: [...d.querySelectorAll('.acciones button')].map((b) => b.innerText.trim()),
    };
  }, formulario);
  const axeDelFormulario = await axe(page);
  const antesDeEnviar = v.urls.length;
  await clic(page, `${formulario} .acciones button`, 'Solicitar vínculo');
  await pausa(300);
  const vacio = await page.evaluate((s) => [...document.querySelectorAll(`${s} .campo__error`)].map((e) => e.innerText.replace(/\s+/g, ' ').trim()), formulario);
  const enviosVacios = pedidos('/relationship-requests', antesDeEnviar, 'POST').length;
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 5_000 });
  const focoAlCerrarElFormulario = await page.evaluate(() => document.activeElement?.matches('.espacio-profesional__solicitar') ?? false);
  comprobar(
    'E-91',
    '«Solicitar vínculo» abre el formulario de siempre en un diálogo que retiene el foco, con el foco en el primer campo: el identificador con su ayuda, el alcance, la finalidad que sale del alcance, y «Volver» y «Solicitar vínculo». Enviado vacío marca los dos campos y no le pide nada a la API. Escape lo cierra y devuelve el foco al botón',
    alAbrirElFormulario.modal &&
      alAbrirElFormulario.titulo === 'Solicitar vínculo' &&
      alAbrirElFormulario.focoEnElPrimerCampo &&
      igual(alAbrirElFormulario.campos, ['Identificador BE del asesorado', 'Alcance']) &&
      alAbrirElFormulario.finalidad === 'Finalidad: —' &&
      igual(alAbrirElFormulario.botones, ['Volver', 'Solicitar vínculo']) &&
      igual(vacio, ['⚠ Ingresá el identificador BE del asesorado.', '⚠ Elegí un alcance.']) &&
      enviosVacios === 0 &&
      axeDelFormulario.length === 0 &&
      focoAlCerrarElFormulario,
    `${alAbrirElFormulario.campos.join(', ')} · ${alAbrirElFormulario.finalidad} · vacío: ${vacio.join(' ')} · envíos: ${enviosVacios} · axe: ${axeDelFormulario.length} · foco al cerrar: ${focoAlCerrarElFormulario}`,
  );
  // Con un identificador que no existe: el mensaje neutro, que no dice si la persona existe. No crea nada.
  await page.click('.espacio-profesional__solicitar');
  await page.waitForSelector(`${formulario}[open]`, { timeout: 5_000 });
  await page.type(`${formulario} input`, '00000000-0000-4000-8000-000000000000');
  await page.select(`${formulario} select`, 'NUTRICION');
  await pausa(200);
  const finalidadElegida = await page.evaluate((s) => [...document.querySelectorAll(`${s} p`)].map((p) => p.innerText.trim()).find((t) => t.startsWith('Finalidad')) ?? null, formulario);
  const antesDelRechazo = v.urls.length;
  await clic(page, `${formulario} .acciones button`, 'Solicitar vínculo');
  await quieto(page, v);
  const rechazo = await page.evaluate((s) => ({ abierto: document.querySelector(s).open, aviso: document.querySelector(`${s} .aviso`)?.innerText.replace(/\s+/g, ' ').trim() ?? null }), formulario);
  const enviosRechazados = pedidos('/relationship-requests', antesDelRechazo, 'POST').length;
  await clic(page, `${formulario} .acciones button`, 'Volver');
  await page.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 5_000 });
  comprobar(
    'E-91',
    'Con un identificador que no es de nadie, el formulario lo pide una vez y dice lo mismo que diría por cualquier otro rechazo, sin revelar si la persona existe; queda abierto para corregir, y «Volver» lo cierra. La finalidad acompaña al alcance elegido',
    finalidadElegida === 'Finalidad: Acompañamiento nutricional' && enviosRechazados === 1 && rechazo.abierto && /No pudimos enviar la solicitud con esos datos\. Revisá el identificador y el alcance\./.test(rechazo.aviso ?? '') && !/no existe|no encontr/i.test(rechazo.aviso ?? ''),
    `${finalidadElegida} · envíos: ${enviosRechazados} · ${rechazo.aviso}`,
  );
  // El rechazo fue pedido a propósito: no es un error del recorrido.
  v.errores.length = 0;
  v.malas.length = 0;

  // E-95 · La dirección no cambia ────────────────────────────────────────────────────────────────────────
  comprobar('E-95', 'Después de elegir vistas, filtrar, buscar y abrir los dos diálogos, la dirección sigue siendo `/pro`, sin parámetros: lo elegido es de la visita', new URL(page.url()).pathname.replace(/\/$/, '') === '/pro' && new URL(page.url()).search === '' && new URL(page.url()).hash === '', page.url().replace(WEB, ''));

  // PRO-22 · El teclado ─────────────────────────────────────────────────────────────────────────────────
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.espacio-profesional h1');
  const conTab = [];
  for (let i = 0; i < 60 && conTab.at(-1)?.clase !== 'solicitudes'; i++) {
    await page.keyboard.press('Tab');
    conTab.push(
      await page.evaluate(() => {
        const a = document.activeElement;
        const CLASES = [
          ['.espacio-profesional__solicitar', 'solicitar'],
          ['section.pendientes .vista-de-la-linea', 'vista'],
          ['section.pendientes .vistas-de-la-linea__mas', 'filtros'],
          ['a.pendiente__enlace', 'abrir-pendiente'],
          ['.pendientes__actualizar', 'actualizar'],
          ['.buscador-del-directorio input', 'buscar'],
          ['.persona__datos', 'persona'],
          ['a.persona__abrir', 'abrir-persona'],
          ['.directorio__solicitudes', 'solicitudes'],
        ];
        const clase = CLASES.find(([s]) => a?.matches(s))?.[1] ?? 'otro';
        const caja = a?.getBoundingClientRect();
        return { clase, alto: caja ? Math.round(caja.height) : 0, contorno: a ? getComputedStyle(a).outlineStyle : 'none' };
      }),
    );
  }
  const ordenDelFoco = conTab.map((x) => x.clase);
  const ordenEsperado = ['solicitar', 'vista', 'vista', 'vista', 'vista', 'vista', 'filtros', ...cartera.items.map(() => 'abrir-pendiente'), 'actualizar', 'buscar', ...personasEsperadas.flatMap(() => ['persona', 'abrir-persona']), 'solicitudes'];
  comprobar(
    'PRO-22',
    'Con el teclado se llega, en el orden en que se ven, a «Solicitar vínculo», las cinco vistas, «Más filtros», el «Abrir» de cada pendiente, «Actualizar», el buscador, cada persona con su «Abrir» y las solicitudes; cada uno mide 44 px o más y muestra el foco',
    igual(ordenDelFoco, ordenEsperado) && conTab.every((x) => x.alto >= 44 && x.contorno !== 'none'),
    `${ordenDelFoco.join(' → ')} · altos: ${[...new Set(conTab.map((x) => x.alto))].join(', ')} px`,
  );

  // PRO-22 · Accesibilidad y palabras, con «Más filtros» y una persona abiertos, en los dos temas ─────────────────
  await clic(page, 'section.pendientes .vistas-de-la-linea__mas', 'Más filtros');
  await page.click(`${deEsaPersona} .persona__datos`);
  await pausa(300);
  const temaInicial = await page.evaluate(() => document.documentElement.dataset.tema);
  const violaciones = {};
  for (const tema of ['claro', 'azul-noche']) {
    await ponerTema(page, tema);
    await pausa(300);
    violaciones[tema] = await axe(page);
  }
  await ponerTema(page, temaInicial);
  comprobar('PRO-22', 'El Espacio profesional, con «Más filtros» y el detalle de una persona abiertos: axe no encuentra faltas de WCAG 2.2 AA en ninguno de los dos temas', violaciones.claro.length === 0 && violaciones['azul-noche'].length === 0, JSON.stringify(violaciones));
  const todaLaPagina = await texto(page, 'main');
  comprobar(
    'E-87',
    'La página entera, con «Más filtros» y el detalle de una persona abiertos, no tiene porcentajes ni palabras que califiquen a nadie: describe lo que está pendiente',
    todaLaPagina.length > 500 && !/%/.test(todaLaPagina) && !/\b(inactiv[oa]|abandon|riesgo|alerta|urgente|cumpli[óo]|incumpli|adherencia|correcto|incorrecto|excelente|insuficiente|atrasad[oa])\b/i.test(todaLaPagina),
    `${todaLaPagina.length} caracteres`,
  );
  await clic(page, 'section.pendientes .vistas-de-la-linea__mas', 'Más filtros');
  await page.click(`${deEsaPersona} .persona__datos`);

  // E-94 · La composición a cada ancho ───────────────────────────────────────────────────────────────────
  const composicion = {};
  for (const ancho of [1440, 1280, 1024, 768, 390]) {
    await page.setViewport({ width: ancho, height: 900 });
    await pausa(400);
    composicion[ancho] = await page.evaluate(() => {
      const p = document.querySelector('section.pendientes').getBoundingClientRect();
      const d = document.querySelector('section.directorio').getBoundingClientRect();
      // Dónde termina la última de las dos tarjetas: el alto de la página no baja del de la ventana, y no diría nada.
      return { alLado: d.left >= p.right && d.top < p.bottom, debajo: d.top >= p.bottom, desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth, fin: Math.round(Math.max(p.bottom, d.bottom) + window.scrollY) };
    });
  }
  await page.setViewport({ width: 1440, height: 900 });
  await pausa(400);
  comprobar(
    'E-94',
    'A 1440 y a 1280 px el directorio va al lado de los pendientes; a 1024, debajo. La página no desborda de costado a 1440, 1280, 1024, 768 ni 390 px',
    composicion[1440].alLado && composicion[1280].alLado && composicion[1024].debajo && Object.values(composicion).every((c) => c.desborde <= 1),
    Object.entries(composicion).map(([ancho, c]) => `${ancho}: ${c.alLado ? 'al lado' : 'debajo'}, termina en ${c.fin} px${c.desborde > 1 ? `, desborda ${c.desborde} px` : ''}`).join(' · '),
  );
  informar('E-94', 'Dónde termina la última tarjeta a 1440 px con los datos del escenario (antes de esta parte la página medía 2.697 px, con las cuatro tarjetas abiertas)', `${composicion[1440].fin} px`);
  comprobar('PRO-25', 'Sin errores de JavaScript ni respuestas con error de la API durante el recorrido del Espacio profesional (fuera de las fallas y del rechazo pedidos a propósito)', v.errores.length === 0 && v.malas.length === 0, [...v.errores, ...v.malas].slice(0, 4).join(' · ') || 'ninguno');
}

/**
 * El Resumen por área, la Línea de tiempo por día y Analizar recompuesto, en una misma sesión (una sola entrada de la
 * cuenta: el límite es de cinco cada quince minutos). La parte del Resumen va primero, con la ficha recién abierta: ahí
 * se mira qué guiones cargó. El modo funcional corre las tres antes del encabezado; `resumen`, `linea` y `analizar`
 * corren una sola. El Espacio profesional va al final, en la misma sesión; solo, con `espacio`.
 */
// ─── El marco de las pestañas de área (WP-ESCRITORIO-AREAS, parte 0) ─────────────────────────────────────────────

/**
 * Lo que dice el marco de una pestaña de área, y dónde está cada renglón. Solo lo que está a la vista: el texto de un
 * elemento oculto se lee igual, y una pantalla que escondiera el camino de vuelta pasaría por buena.
 */
const marcoEnPantalla = (page) =>
  page.evaluate(() => {
    const t = (e) => e?.innerText.replace(/\s+/g, ' ').trim() ?? null;
    const caja = (e) => {
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { arriba: Math.round(r.top + scrollY), abajo: Math.round(r.bottom + scrollY), izquierda: Math.round(r.left), derecha: Math.round(r.right) };
    };
    const marco = document.querySelector('header.marco-del-area');
    if (!marco) return null;
    const aLaVista = (e) => (e && e.getClientRects().length > 0 ? e : null);
    const vuelta = aLaVista(marco.querySelector('.retorno-a-la-ficha a'));
    return {
      titulos: [...document.querySelectorAll('h1')].map(t),
      volver: vuelta ? { texto: t(vuelta), href: vuelta.getAttribute('href'), caja: caja(vuelta) } : null,
      persona: t(aLaVista(marco.querySelector('.marco-del-area__persona'))),
      acceso: t(aLaVista(marco.querySelector('.ficha__acceso'))),
      hora: t(aLaVista(marco.querySelector('.ficha__consulta .nota'))),
      actualizar: !!aLaVista(marco.querySelector('.ficha__consulta button')),
      etiqueta: marco.querySelector('nav.pestanas')?.getAttribute('aria-label') ?? null,
      pestanas: [...marco.querySelectorAll('nav.pestanas a')].filter(aLaVista).map((a) => ({ texto: t(a), href: a.getAttribute('href'), actual: a.getAttribute('aria-current'), icono: !!a.querySelector('svg') })),
      migas: document.querySelectorAll('nav.migas').length,
      caja: caja(marco),
      renglones: [...marco.querySelectorAll('.marco-de-la-ficha__persona, .marco-de-la-ficha__estado, .marco-de-la-ficha__vistas')].map(caja),
      seccion: caja(document.querySelector('.seccion-del-area')),
      primerTitulo: t(document.querySelector('.seccion-del-area h2')),
      cuerpo: t(document.querySelector('.seccion-del-area')),
    };
  });

/**
 * El marco común de Nutrición, Entrenamiento, Antropometría e Información (F-01). Lo esperado se calcula a mano con lo
 * que devuelve la API: los vínculos del profesional con el asesorado A. Va dentro de `funcional`; solo, con
 * `node recorrido.mjs areas`.
 */
async function marcoDeLasAreas(page, v) {
  const A = estado.aseId;
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  /** Las secciones de cada área, escritas a mano: la clave que viaja en la dirección y el nombre que se lee. */
  const AREAS = [
    { clave: 'nutrition', alcance: 'NUTRICION', titulo: 'Nutrición', secciones: [['resumen', 'Resumen'], ['plan', 'Plan'], ['registros', 'Registros'], ['revisiones', 'Revisiones']] },
    { clave: 'training', alcance: 'ENTRENAMIENTO', titulo: 'Entrenamiento', secciones: [['resumen', 'Resumen'], ['plan', 'Plan'], ['ejecuciones', 'Registros'], ['revisiones', 'Revisiones']] },
    { clave: 'anthropometry', alcance: 'ANTROPOMETRIA', titulo: 'Antropometría', secciones: [['evaluaciones', 'Tomas'], ['evolucion', 'Evolución'], ['lamina', 'Lámina']] },
    { clave: 'forms', alcance: null, titulo: 'Información', secciones: [['solicitudes', 'Solicitudes'], ['pedir', 'Pedir información']] },
  ];
  const ACTIVO = 'Activo · acceso contextual';
  const ORDEN = ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'];
  const destino = (href) => {
    const u = new URL(href || '/', WEB);
    return { ruta: u.pathname.replace(/\/$/, ''), q: Object.fromEntries(u.searchParams) };
  };
  const BOTON = 'header.marco-del-area .ficha__consulta button';
  const HORA = 'header.marco-del-area .ficha__consulta .nota';
  /** Entra a una dirección de un área y espera a que el marco diga la hora de su consulta. Devuelve la marca de los pedidos. */
  const entrar = async (ruta) => {
    await cupo(v, 60);
    const desde = v.urls.length;
    await ir(page, ruta);
    await page.waitForSelector('header.marco-del-area', { timeout: 30_000 });
    await quieto(page, v);
    await page.waitForSelector(HORA, { timeout: 30_000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    return desde;
  };
  /** Las lecturas de la página desde una marca, sin la de la cuenta (que se hace al abrir la página, no al actualizar). */
  const lecturas = (desde) =>
    v.urls
      .slice(desde)
      .filter((u) => u.startsWith('GET ') && !/\/api\/v1\/me$/.test(u))
      .map((u) => u.replace(`GET ${API}/api/v1`, ''))
      .sort();
  const actualizar = async () => {
    await cupo(v, 60);
    const desde = v.urls.length;
    await clic(page, BOTON, 'Actualizar');
    return desde;
  };
  /** La hora del marco es la de ahora (o la del minuto anterior), en el reloj de esta máquina. */
  const esDeAhora = (dice) => {
    const leida = /^Consultado a las (\d{2}):(\d{2})$/.exec(dice ?? '');
    if (!leida) return false;
    const ahora = new Date();
    const minutos = ahora.getHours() * 60 + ahora.getMinutes();
    const dichos = Number(leida[1]) * 60 + Number(leida[2]);
    return [0, 1, 1439].includes((minutos - dichos + 1440) % 1440);
  };

  // Lo esperado: los vínculos del profesional con A, como los da la API.
  await cupo(v, 60);
  const yo = (await leerApi(v, '/me')).data;
  const todos = [];
  let cursor = null;
  do {
    const r = await leerApi(v, `/me/relationships${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);
    todos.push(...r.data);
    cursor = r.page.hasMore ? r.page.nextCursor : null;
  } while (cursor);
  const vinculos = todos.filter((x) => x.professional.identityId === yo.identityId && x.advisee.identityId === A).sort((a, b) => ORDEN.indexOf(a.scope.code) - ORDEN.indexOf(b.scope.code));
  const activo = (x) => x.relationshipState === 'ACEPTADO' && x.consentState === 'ACTIVE' && x.accessMode === 'CONTEXTUAL';
  /** «Acceso actual Nutrición: Activo · acceso contextual». Si el escenario cambió (un vínculo no activo), `null`. */
  const accesoEsperado = (alcance) => {
    const suyos = vinculos.filter((x) => !alcance || x.scope.code === alcance);
    if (suyos.length === 0 || !suyos.every(activo)) return null;
    const nombres = suyos.map((x) => x.scope.label);
    return `Acceso actual ${nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}` : nombres[0]}: ${ACTIVO}`;
  };
  const persona = vinculos[0]?.advisee.displayName ?? null;

  // La ficha, para comparar: los tres renglones de su marco.
  await ir(page, FICHA_A);
  await page.waitForSelector('header.marco-de-la-ficha .ficha__consulta .nota', { timeout: 30_000 });
  await quieto(page, v);
  const ficha = await page.evaluate(() => {
    const alto = (e) => Math.round(e.getBoundingClientRect().height);
    const marco = document.querySelector('header.marco-de-la-ficha');
    return { alto: alto(marco), renglones: [...marco.querySelectorAll('.marco-de-la-ficha__persona, .marco-de-la-ficha__estado, .marco-de-la-ficha__vistas')].map(alto) };
  });

  // F-01 · El marco, en las cuatro áreas ─────────────────────────────────────────────────────────────────
  const medidas = [];
  const sinVolver = [];
  let resumenDeEntrenamiento = null;
  for (const area of AREAS) {
    await entrar(`/pro/advisees/${area.clave}?id=${A}`);
    const m = await marcoEnPantalla(page);
    if (area.clave === 'training') resumenDeEntrenamiento = m.primerTitulo;
    medidas.push({ area: area.titulo, alto: m.caja.abajo - m.caja.arriba, renglones: m.renglones.map((r) => r.abajo - r.arriba), izquierda: m.volver?.caja.izquierda, seccion: m.seccion });
    const pestanasBien =
      igual(m.pestanas.map((p) => p.texto), area.secciones.map((s) => s[1])) &&
      igual(m.pestanas.map((p) => p.actual), area.secciones.map((_, i) => (i === 0 ? 'page' : null))) &&
      m.pestanas.every((p, i) => {
        const d = destino(p.href);
        return p.icono && d.ruta === `/pro/advisees/${area.clave}` && igual(d.q, { id: A, vista: area.secciones[i][0] });
      });
    comprobar(
      'F-01',
      `${area.titulo}: el marco dice el área (el único título de la página), de quién es, su acceso actual con las palabras de BE, «Actualizar» con la hora de la consulta y las secciones, cada una con su ícono y su dirección de siempre; no hay miga`,
      igual(m.titulos, [area.titulo]) &&
        persona !== null &&
        m.persona === persona &&
        accesoEsperado(area.alcance) !== null &&
        m.acceso === accesoEsperado(area.alcance) &&
        m.actualizar &&
        esDeAhora(m.hora) &&
        m.etiqueta === `Secciones de ${area.titulo}` &&
        pestanasBien &&
        m.migas === 0,
      `${m.titulos.join(' | ')} · ${m.persona} · ${m.acceso} (la API: ${accesoEsperado(area.alcance)}) · ${m.hora} · ${m.pestanas.map((p) => `${p.texto}${p.icono ? '' : ' (sin ícono)'}${p.actual ? '*' : ''}`).join(', ')} · migas: ${m.migas}`,
    );
    const d = destino(m.volver?.href);
    sinVolver.push({ area: area.titulo, texto: m.volver?.texto ?? null, migas: m.migas, bien: m.volver?.texto === 'Volver a la ficha' && d.ruta === '/pro/advisees' && igual(d.q, { id: A }) });
  }
  await ir(page, '/pro/templates');
  await page.waitForSelector('nav.migas', { timeout: 30_000 }).catch(() => {});
  await quieto(page, v);
  const migasDeLaBiblioteca = await page.evaluate(() => document.querySelectorAll('nav.migas').length);
  comprobar(
    'F-07',
    'Sin haber llegado desde la ficha (como desde un pendiente), el camino de vuelta de las cuatro áreas dice «Volver a la ficha» y lleva a la ficha de esa persona. Reemplaza a la miga, que ya no está en ninguna de las cuatro (la misma consulta encuentra la de «Plantillas y habituales»)',
    sinVolver.length === 4 && sinVolver.every((x) => x.bien) && sinVolver.every((x) => x.migas === 0) && migasDeLaBiblioteca === 1,
    `${sinVolver.map((x) => `${x.area}: ${x.texto}, ${x.migas} migas`).join(' · ')} · «Plantillas y habituales»: ${migasDeLaBiblioteca}`,
  );

  // F-06 · Los mismos tres renglones que la ficha ───────────────────────────────────────────────────────────
  informar('F-06', 'El alto del marco y de sus tres renglones, a 1440 px', `ficha ${ficha.alto} px (${ficha.renglones.join(' + ')}) · ${medidas.map((x) => `${x.area} ${x.alto} (${x.renglones.join(' + ')})`).join(' · ')}`);
  comprobar(
    'F-06',
    'El marco tiene tres renglones y mide lo mismo en las cuatro áreas y en la ficha: al pasar de la ficha a un área, o de un área a otra, las secciones y lo que está debajo quedan a la misma altura',
    medidas.every((x) => x.renglones.length === 3 && x.alto === ficha.alto && igual(x.renglones, ficha.renglones)),
    `ficha ${ficha.alto} · ${medidas.map((x) => `${x.area} ${x.alto}`).join(' · ')}`,
  );
  // F-10 · La sección conserva su ancho y arranca donde arranca el marco ────────────────────────────────────
  comprobar(
    'F-10',
    'La sección arranca en la misma vertical que el marco. Mientras no se recomponga conserva el ancho para el que se hizo (1.152 px a 1440); la que ya se recompuso usa todo el ancho del marco: de las cuatro que abren al entrar a un área, solo «Tomas», de Antropometría (parte 3)',
    // A 1440 px, «todo el ancho» deja a la derecha el mismo margen que a la izquierda.
    medidas.every((x) => x.seccion && x.seccion.izquierda === x.izquierda && (x.area === 'Antropometría' ? x.seccion.derecha === 1440 - x.seccion.izquierda : x.seccion.derecha - x.seccion.izquierda === 1152)) && medidas.some((x) => x.area === 'Antropometría'),
    medidas.map((x) => `${x.area}: marco desde ${x.izquierda}, sección de ${x.seccion?.izquierda} a ${x.seccion?.derecha}`).join(' · '),
  );

  // C-58 y C-65 · Cambian los nombres que se leen; las direcciones, no ──────────────────────────────────────
  await entrar(`/pro/advisees/training?id=${A}&vista=ejecuciones`);
  const entrenamiento = await marcoEnPantalla(page);
  await entrar(`/pro/advisees/anthropometry?id=${A}&vista=preparacion`);
  const antropometria = await marcoEnPantalla(page);
  const elegida = (m) => m.pestanas.find((p) => p.actual === 'page')?.texto ?? null;
  comprobar(
    'C-65',
    '«vista=ejecuciones» sigue abriendo los registros de Entrenamiento, que se leen «Registros» (y no el Resumen); «vista=preparacion» sigue abriendo la carga de una toma, que desde la parte 3 no es una sección: queda marcada «Tomas», la primera de Antropometría. Ninguna sección dice «Ejecuciones», «Evaluaciones» ni «En preparación»',
    elegida(entrenamiento) === 'Registros' &&
      entrenamiento.primerTitulo !== null &&
      entrenamiento.primerTitulo !== resumenDeEntrenamiento &&
      elegida(antropometria) === 'Tomas' &&
      antropometria.pestanas[0]?.texto === 'Tomas' &&
      /^(Nueva toma|Toma en preparación)$/.test(antropometria.primerTitulo ?? '') &&
      ![...entrenamiento.pestanas, ...antropometria.pestanas].some((p) => /Ejecuciones|Evaluaciones|En preparación/.test(p.texto)),
    `Entrenamiento: ${elegida(entrenamiento)} («${entrenamiento.primerTitulo}»; el Resumen empieza con «${resumenDeEntrenamiento}») · Antropometría: ${antropometria.pestanas.map((p) => p.texto).join(', ')}, elegida ${elegida(antropometria)}, y a la vista «${antropometria.primerTitulo}»`,
  );

  // F-07 · El camino de vuelta, llegando desde la ficha y desde Entrenamiento ───────────────────────────────
  const VOLVER = 'vista=analizar&m=nutricion.energia';
  await entrar(`/pro/advisees/nutrition?id=${A}&vista=registros&volver=${encodeURIComponent(VOLVER)}`);
  const desdeLaFicha = await marcoEnPantalla(page);
  const aLaFicha = destino(desdeLaFicha.volver?.href);
  const loConservan = desdeLaFicha.pestanas.length === 4 && desdeLaFicha.pestanas.every((p) => destino(p.href).q.volver === VOLVER);
  await clic(page, 'header.marco-del-area .retorno-a-la-ficha a', 'Volver a la ficha');
  await page.waitForSelector('header.marco-de-la-ficha .ficha__consulta .nota', { timeout: 30_000 });
  await quieto(page, v);
  const llegada = { ruta: new URL(page.url()).pathname.replace(/\/$/, ''), q: Object.fromEntries(parametros(page)) };
  comprobar(
    'F-07',
    'Llegando desde la ficha, el camino de vuelta dice «Volver a la ficha, donde estabas», las cuatro secciones lo conservan y lleva a esa vista de la ficha, con su métrica',
    desdeLaFicha.volver?.texto === 'Volver a la ficha, donde estabas' &&
      aLaFicha.ruta === '/pro/advisees' &&
      aLaFicha.q.id === A &&
      aLaFicha.q.vista === 'analizar' &&
      aLaFicha.q.m === 'nutricion.energia' &&
      loConservan &&
      llegada.ruta === '/pro/advisees' &&
      llegada.q.id === A &&
      llegada.q.vista === 'analizar' &&
      llegada.q.m === 'nutricion.energia',
    `${desdeLaFicha.volver?.texto} → ${desdeLaFicha.volver?.href} · las secciones lo conservan: ${loConservan} · llegó a ${llegada.ruta}?vista=${llegada.q.vista}&m=${llegada.q.m}`,
  );
  await entrar(`/pro/advisees/forms?id=${A}&vista=pedir&plantilla=FRM-ENTRENAMIENTO&volver=entrenamiento`);
  const desdeEntrenamiento = await marcoEnPantalla(page);
  const aEntrenamiento = destino(desdeEntrenamiento.volver?.href);
  comprobar(
    'F-07',
    'Llegando a «Pedir información» desde Entrenamiento, el camino de vuelta dice «Volver a Entrenamiento» y lleva ahí: no dice «donde estabas» de un lugar de la ficha donde la persona no estaba',
    desdeEntrenamiento.volver?.texto === 'Volver a Entrenamiento' && aEntrenamiento.ruta === '/pro/advisees/training' && aEntrenamiento.q.id === A && aEntrenamiento.q.vista === 'resumen',
    `${desdeEntrenamiento.volver?.texto} → ${desdeEntrenamiento.volver?.href}`,
  );

  // F-08 · «Actualizar» vuelve a leer todo lo que la sección muestra ───────────────────────────────────────
  const alEntrar = await entrar(`/pro/advisees/nutrition?id=${A}&vista=resumen`);
  const deEntrada = lecturas(alEntrar);
  const alActualizar = await actualizar();
  await quieto(page, v);
  await page.waitForSelector(HORA, { timeout: 30_000 });
  const deNuevo = lecturas(alActualizar);
  const trasActualizar = await marcoEnPantalla(page);
  comprobar(
    'F-08',
    '«Actualizar» vuelve a pedir todo lo que la sección leyó al entrar (las mismas lecturas, una vez cada una, con los vínculos) y no abre ninguna pregunta; la hora es la de esa consulta',
    deEntrada.length >= 3 && deEntrada.some((u) => u.startsWith('/me/relationships')) && igual(deNuevo, deEntrada) && esDeAhora(trasActualizar.hora) && !(await page.$('dialog.dialogo[open]')),
    `al entrar (${deEntrada.length}): ${deEntrada.map((u) => u.replace(A, ':a').split('?')[0]).join(' · ')} — al actualizar (${deNuevo.length}): ${igual(deNuevo, deEntrada) ? 'las mismas' : deNuevo.map((u) => u.replace(A, ':a').split('?')[0]).join(' · ')} — ${trasActualizar.hora}`,
  );

  // F-08 · Con algo escrito sin guardar, «Actualizar» pregunta antes ───────────────────────────────────────
  const ESCRITO = 'Texto del recorrido, sin guardar.';
  await entrar(`/pro/advisees/nutrition?id=${A}&vista=revisiones&preparar=1`);
  await page.waitForSelector('#revision-interpretacion', { timeout: 30_000 });
  await page.type('#revision-interpretacion', ESCRITO);
  const alPreguntar = await actualizar();
  const aparecio = () => page.waitForSelector('dialog.dialogo[open]', { timeout: 10_000 }).then(
    () => true,
    () => false,
  );
  const pregunto = await aparecio();
  let pregunta = '(no preguntó)';
  let leyoAlPreguntar = -1;
  let sigueEscrito = null;
  let trasDescartar = null;
  let leyoAlDescartar = 0;
  if (pregunto) {
    pregunta = await texto(page, 'dialog.dialogo[open]');
    await pausa(600);
    leyoAlPreguntar = lecturas(alPreguntar).length;
    await clic(page, 'dialog.dialogo[open] button', 'Seguir editando');
    await page.waitForFunction(() => !document.querySelector('dialog.dialogo[open]'), { timeout: 10_000 });
    sigueEscrito = await page.$eval('#revision-interpretacion', (e) => e.value);
    await actualizar();
    if (await aparecio()) {
      const alDescartar = v.urls.length;
      await clic(page, 'dialog.dialogo[open] button', 'Actualizar y descartar');
      await quieto(page, v);
      await page.waitForSelector('#revision-interpretacion', { timeout: 30_000 });
      trasDescartar = await page.$eval('#revision-interpretacion', (e) => e.value);
      leyoAlDescartar = lecturas(alDescartar).length;
    }
  } else {
    await quieto(page, v);
  }
  comprobar(
    'F-08',
    'Con algo escrito sin guardar, «Actualizar» pregunta antes: dice qué se pierde y no lee nada; «Seguir editando» deja lo escrito como estaba; «Actualizar y descartar» vuelve a leer la sección',
    /Tenés cambios sin guardar/.test(pregunta) && /la revisión/.test(pregunta) && leyoAlPreguntar === 0 && sigueEscrito === ESCRITO && trasDescartar === '' && leyoAlDescartar >= 2,
    `«${pregunta.slice(0, 150)}» · lecturas mientras pregunta: ${leyoAlPreguntar} · tras «Seguir editando»: «${sigueEscrito}» · tras descartar: «${trasDescartar}», ${leyoAlDescartar} lecturas`,
  );

  // C-43 · Una falla dice su motivo, y no es una revocación ─────────────────────────────────────────────────
  const delArea = (u) => u.includes(`/advisees/${A}/nutrition/`);
  const falla = { coincide: delArea, accion: 'responder', status: 503, codigo: 'SERVICE_UNAVAILABLE' };
  await entrar(`/pro/advisees/training?id=${A}`);
  v.reglas.push(falla);
  const alFallar = await entrar(`/pro/advisees/nutrition?id=${A}&vista=resumen`);
  const conFalla = await marcoEnPantalla(page);
  const bloque = await texto(page, '.seccion-del-area .estado-de-grafico--error');
  const preguntoPorLaFalla = lecturas(alFallar).filter((u) => u.includes('/dashboard')).length;
  v.reglas.splice(v.reglas.indexOf(falla), 1);
  await cupo(v, 60);
  const seReintento = !!(await page.$('.seccion-del-area .estado-de-grafico--error button'));
  if (seReintento) await clic(page, '.seccion-del-area .estado-de-grafico--error button', 'Reintentar');
  await quieto(page, v);
  const trasReintentar = await marcoEnPantalla(page);
  comprobar(
    'C-43',
    'Si la sección no se puede leer por una falla (un 503 simulado en el navegador), lo dice en su lugar con el motivo y «Reintentar»; el marco sigue diciendo el acceso del vínculo y no pregunta nada más: una falla no es una revocación. «Reintentar» trae la sección',
    /No pudimos cargar esta vista/.test(bloque) &&
      /BE no está disponible en este momento/.test(bloque) &&
      /Reintentar/.test(bloque) &&
      conFalla.acceso === accesoEsperado('NUTRICION') &&
      preguntoPorLaFalla === 0 &&
      seReintento &&
      !(await page.$('.seccion-del-area .estado-de-grafico--error')) &&
      trasReintentar.primerTitulo !== null,
    `«${bloque}» · el marco: ${conFalla.acceso} · lecturas del resumen del asesorado: ${preguntoPorLaFalla} · tras reintentar: «${trasReintentar.primerTitulo}»`,
  );

  // F-09 · Si una lectura dice «no disponible», el marco vuelve a preguntar el acceso ────────────────────────
  // Con respuestas simuladas en el navegador (la API y la base no se tocan). La revocación real se comprueba en el
  // escenario descartable.
  const NEUTRAL = 'No encontramos un recurso disponible para esta acción.';
  const noDisponible = { coincide: delArea, accion: 'responder', status: 404, codigo: 'RESOURCE_NOT_FOUND' };
  await entrar(`/pro/advisees/training?id=${A}`);
  v.reglas.push(noDisponible);
  const alNoEncontrar = await entrar(`/pro/advisees/nutrition?id=${A}&vista=resumen`);
  await page.waitForFunction((s) => document.querySelector('.seccion-del-area')?.innerText.includes(s), { timeout: 30_000 }, NEUTRAL);
  await quieto(page, v);
  const conRecursoAusente = await marcoEnPantalla(page);
  const preguntas = lecturas(alNoEncontrar).filter((u) => u.includes('/dashboard'));
  comprobar(
    'F-09',
    'Si las lecturas de la sección responden «no disponible» (simulado), la sección dice el texto neutral de siempre y el marco pregunta una sola vez qué deja leer el resumen del asesorado; como el área se puede leer, sigue diciendo el acceso del vínculo',
    conRecursoAusente.cuerpo.includes(NEUTRAL) && preguntas.length === 1 && preguntas[0].startsWith(`/advisees/${A}/dashboard`) && conRecursoAusente.acceso === accesoEsperado('NUTRICION'),
    `la sección: «${conRecursoAusente.cuerpo.slice(0, 80)}» · preguntas al resumen: ${preguntas.length} · el marco: ${conRecursoAusente.acceso}`,
  );
  // El resumen real, con Nutrición marcada como no disponible: es lo único que cambia.
  const real = await leerApi(v, `/advisees/${A}/dashboard`);
  const sinNutricion = { coincide: (u) => u.includes(`/advisees/${A}/dashboard`), accion: 'entregar', cuerpo: { ...real, data: { ...real.data, domains: { ...real.data.domains, nutrition: { available: false, reason: 'NOT_AVAILABLE_TO_VIEW' } } } } };
  v.reglas.push(sinNutricion);
  await entrar(`/pro/advisees/training?id=${A}`);
  const deEntrenamiento = await marcoEnPantalla(page);
  await entrar(`/pro/advisees/nutrition?id=${A}&vista=resumen`);
  await page.waitForFunction(() => /Acceso no disponible/.test(document.querySelector('header.marco-del-area .ficha__acceso')?.innerText ?? ''), { timeout: 30_000 }).catch(() => {});
  const sinAcceso = await marcoEnPantalla(page);
  v.reglas.splice(v.reglas.indexOf(sinNutricion), 1);
  v.reglas.splice(v.reglas.indexOf(noDisponible), 1);
  comprobar(
    'F-09',
    'Si además el resumen dice que Nutrición ya no se puede leer (simulado), el marco de Nutrición dice «Acceso no disponible» y deja de decir «Activo»; el de Entrenamiento, que no recibió ningún «no disponible», sigue diciendo el suyo. No dice quién lo retiró ni por qué',
    sinAcceso.acceso === 'Acceso actual Nutrición: Acceso no disponible' && !/Activo/.test(sinAcceso.acceso) && deEntrenamiento.acceso === accesoEsperado('ENTRENAMIENTO') && !/revoc|retir|motivo/i.test(sinAcceso.acceso),
    `Nutrición: ${sinAcceso.acceso} · Entrenamiento: ${deEntrenamiento.acceso}`,
  );
  // Sin las respuestas simuladas, «Actualizar» devuelve la sección y el acceso del vínculo.
  const alVolverALeer = await actualizar();
  await quieto(page, v);
  await page.waitForFunction((s) => !document.querySelector('.seccion-del-area')?.innerText.includes(s), { timeout: 30_000 }, NEUTRAL).catch(() => {});
  await quieto(page, v);
  const repuesto = await marcoEnPantalla(page);
  comprobar(
    'F-09',
    'Cuando las lecturas vuelven a responder, «Actualizar» trae la sección y el marco vuelve a decir el acceso del vínculo (vuelve a preguntar también el resumen, porque ya había tenido que preguntarlo)',
    !repuesto.cuerpo.includes(NEUTRAL) && repuesto.primerTitulo !== null && repuesto.acceso === accesoEsperado('NUTRICION') && lecturas(alVolverALeer).filter((u) => u.includes('/dashboard')).length === 1,
    `la sección empieza con «${repuesto.primerTitulo}» · el marco: ${repuesto.acceso} · preguntas al resumen: ${lecturas(alVolverALeer).filter((u) => u.includes('/dashboard')).length}`,
  );

  // Los estados conservan el título y el camino de vuelta ───────────────────────────────────────────────────
  const sinCuenta = { coincide: (u) => /\/api\/v1\/me$/.test(u), accion: 'responder', status: 503, codigo: 'SERVICE_UNAVAILABLE' };
  v.reglas.push(sinCuenta);
  await cupo(v, 60);
  await ir(page, `/pro/advisees/anthropometry?id=${A}`);
  await page.waitForSelector('header.marco-del-area', { timeout: 30_000 });
  await quieto(page, v);
  const sinSaberQuienEs = await marcoEnPantalla(page);
  v.reglas.splice(v.reglas.indexOf(sinCuenta), 1);
  if (/Reintentar/.test(sinSaberQuienEs.cuerpo ?? '')) await clic(page, '.seccion-del-area button', 'Reintentar');
  else await ir(page, `/pro/advisees/training?id=${A}`).then(() => ir(page, `/pro/advisees/anthropometry?id=${A}`));
  await quieto(page, v);
  await page.waitForSelector(HORA, { timeout: 30_000 }).catch(() => {});
  const repuestoElMarco = await marcoEnPantalla(page);
  comprobar(
    'F-01',
    'Si no se puede leer la cuenta (un 503 simulado), la página conserva el título del área y el camino de vuelta, y la falla va en el lugar de la sección, con «Reintentar»; no hay secciones ni acceso que mostrar. «Reintentar» trae el marco entero',
    igual(sinSaberQuienEs.titulos, ['Antropometría']) &&
      sinSaberQuienEs.volver?.texto === 'Volver a la ficha' &&
      sinSaberQuienEs.pestanas.length === 0 &&
      sinSaberQuienEs.acceso === null &&
      /Reintentar/.test(sinSaberQuienEs.cuerpo ?? '') &&
      repuestoElMarco.pestanas.length === 3 &&
      repuestoElMarco.acceso === accesoEsperado('ANTROPOMETRIA'),
    `con la falla: ${sinSaberQuienEs.titulos.join(' | ')} · ${sinSaberQuienEs.volver?.texto} · ${sinSaberQuienEs.pestanas.length} secciones · «${sinSaberQuienEs.cuerpo.slice(0, 60)}» — después: ${repuestoElMarco.pestanas.length} secciones · ${repuestoElMarco.acceso}`,
  );

  // Teclado y accesibilidad ───────────────────────────────────────────────────────────────────────────────
  await entrar(`/pro/advisees/nutrition?id=${A}&vista=resumen`);
  await page.click('#titulo-del-area');
  const orden = [];
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    orden.push(await page.evaluate(() => document.activeElement?.innerText.replace(/\s+/g, ' ').trim() ?? ''));
  }
  const faltas = await axe(page);
  comprobar(
    'F-01',
    'Con el teclado, después del título se llega a «Actualizar» y después a las cuatro secciones, en su orden; axe no encuentra faltas en la página con el marco',
    igual(orden.slice(0, 5), ['Actualizar', 'Resumen', 'Plan', 'Registros', 'Revisiones']) && faltas.length === 0,
    `Tab: ${orden.join(' → ')} · axe: ${faltas.length === 0 ? 'sin faltas' : faltas.map((f) => f.id).join(', ')}`,
  );

  // El marco a 1280 y a 1024 px ───────────────────────────────────────────────────────────────────────────
  const anchos = [];
  for (const ancho of [1280, 1024]) {
    await page.setViewport({ width: ancho, height: 900 });
    for (const area of [AREAS[2], AREAS[3]]) {
      await entrar(`/pro/advisees/${area.clave}?id=${A}`);
      const m = await marcoEnPantalla(page);
      anchos.push({ ancho, area: area.titulo, alto: m.caja.abajo - m.caja.arriba, renglones: m.renglones.map((r) => r.abajo - r.arriba), desborda: !(await sinDesborde(page)) });
    }
  }
  await page.setViewport({ width: 1440, height: 900 });
  comprobar(
    'F-06',
    'A 1280 y a 1024 px el marco de Antropometría y el de Información (los de textos más largos) conservan sus tres renglones con el alto de 1440: nada baja de renglón ni desborda la página',
    anchos.every((x) => !x.desborda && x.alto === ficha.alto && igual(x.renglones, ficha.renglones)),
    anchos.map((x) => `${x.ancho} · ${x.area}: ${x.alto} px (${x.renglones.join(' + ')})${x.desborda ? ' DESBORDA' : ''}`).join(' — '),
  );
  comprobar('—', 'El marco de las áreas no produjo errores de página ni respuestas con error fuera de las simuladas', v.errores.length === 0, v.errores.slice(0, 3).join(' | '));
}

// ─── Nutrición · Registros (WP-ESCRITORIO-AREAS, parte 1) ──────────────────────────────────────────────────────

/** Lo que muestra Nutrición · Registros: las vistas, los días y las filas que están a la vista, y el detalle. */
const registrosEnPantalla = (page) =>
  page.evaluate(() => {
    const t = (e) => e?.innerText.replace(/\s+/g, ' ').trim() ?? null;
    const aLaVista = (e) => (e && e.getClientRects().length > 0 ? e : null);
    const detalle = aLaVista(document.querySelector('aside.detalle-del-hecho'));
    return {
      titulo: t(document.querySelector('#titulo-registros')),
      periodo: t(aLaVista(document.querySelector('.registros .periodo-del-seguimiento__boton'))),
      vistas: [...document.querySelectorAll('.registros__vistas .vista-de-la-linea')].filter(aLaVista).map((b) => ({
        vista: b.dataset.vista,
        cuenta: b.querySelector('.vista-de-la-linea__cuenta')?.firstChild?.textContent?.trim() ?? null,
        dice: t(b.querySelector('.vista-de-la-linea__cuenta')),
        elegida: b.getAttribute('aria-pressed'),
        nombre: [...b.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(''),
      })),
      cuenta: t(aLaVista(document.querySelector('.registros__cuenta'))),
      columnas: [...document.querySelectorAll('.registros__columnas span')].map((s) => s.textContent.trim()),
      dias: [...document.querySelectorAll('.dia-de-registros')].filter(aLaVista).map((d) => ({
        fecha: d.dataset.fecha,
        abierto: d.dataset.abierto === 'si',
        seAbre: d.querySelector('.dia-de-registros__resumen')?.tagName === 'BUTTON',
        principal: t(d.querySelector('.dia-de-registros__principal')),
        notas: [...d.querySelectorAll('.dia-de-registros__resumen .etiqueta-de-dato, .dia-de-registros__nota')].map(t),
        filas: [...d.querySelectorAll('.comida-del-dia')].filter(aLaVista).map((li) => {
          const fila = li.querySelector('.comida-del-dia__fila');
          return {
            estado: li.dataset.estado,
            comida: t(li.querySelector('.comida-del-dia__comida')),
            registrado: t(li.querySelector('.comida-del-dia__registrado')),
            cantidades: t(li.querySelector('.comida-del-dia__cantidades')),
            diferencia: t(li.querySelector('.comida-del-dia__diferencia')),
            registro: fila?.dataset.registro ?? null,
            esBoton: fila?.tagName === 'BUTTON',
            elegida: fila?.getAttribute('aria-current') === 'true',
          };
        }),
      })),
      detalle: detalle
        ? {
            titulo: t(detalle.querySelector('h3')),
            texto: t(detalle),
            conElFoco: document.activeElement === detalle.querySelector('h3'),
            celdas: [...detalle.querySelectorAll('table tbody tr')].map((tr) => [...tr.children].map(t)),
          }
        : null,
      panel: t(aLaVista(document.querySelector('dialog.dialogo--panel[open]'))),
      vacio: t(aLaVista(document.querySelector('.registros .estado-vacio'))),
      falla: t(aLaVista(document.querySelector('.registros .estado-de-grafico--error'))),
      masDias: t(aLaVista(document.querySelector('.registros .linea__mas'))),
      alto: document.documentElement.scrollHeight,
    };
  });

/**
 * Lo que se desplaza de costado (`.desplazable-x`) dentro de una superficie —el detalle al costado, el panel de encima—
 * lleva dos «tapas» que esconden la sombra cuando no hay nada que desplazar. Tienen que tener el color de esa
 * superficie: con otro, a cada lado de la tabla queda una franja. Devuelve el color de la superficie y el de sus tapas,
 * resueltos por el navegador (la tapa es una variable: se la prueba como fondo de un elemento que no queda en la página).
 */
const tapasDeLaSuperficie = (page, superficie) =>
  page.evaluate((s) => {
    const e = [...document.querySelectorAll(s)].find((x) => x.getClientRects().length > 0);
    if (!e) return { fondo: null, tapas: [] };
    const color = (valor) => {
      const prueba = document.createElement('span');
      prueba.style.backgroundColor = valor;
      e.append(prueba);
      const c = getComputedStyle(prueba).backgroundColor;
      prueba.remove();
      return c;
    };
    return {
      fondo: getComputedStyle(e).backgroundColor,
      tapas: [...e.querySelectorAll('.desplazable-x')].flatMap((x) => ['--tapa-izquierda', '--tapa-derecha'].map((p) => color(getComputedStyle(x).getPropertyValue(p).trim()))),
    };
  }, superficie);

/** Las tapas de una superficie están bien si hay alguna y todas tienen su color. */
const tapasBien = (t) => t.fondo !== null && t.tapas.length > 0 && t.tapas.every((c) => c === t.fondo);
const tapasEnPalabras = (t) => `la superficie: ${t.fondo ?? 'no está'} · sus tapas: ${[...new Set(t.tapas)].join(', ') || 'no hay'}`;

/**
 * Nutrición · Registros por día (maqueta 20; C-49, C-50, C-51 y C-53; F-15 a F-22). Lo esperado se calcula a mano con lo
 * que devuelven las dos lecturas de la API (el contexto de revisión y las comidas de la línea de tiempo del mismo
 * período): no se usa el módulo del dominio que arma la pantalla. Va dentro de `funcional`; solo, con
 * `node recorrido.mjs registros`.
 */
async function registrosDeNutricion(page, v) {
  const A = estado.aseId;
  const BASE = `/pro/advisees/nutrition?id=${A}&vista=registros`;
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const num = (n) => new Intl.NumberFormat('es-AR').format(n);
  const comidas = (n) => (n === 1 ? 'comida' : 'comidas');
  /** Los pedidos de la página a una dirección de la API, desde una marca. */
  const pedidos = (fragmento, desde) => v.urls.slice(desde).filter((u) => u.startsWith('GET ') && u.includes(fragmento));
  const LISTA = '.registros .dia-de-registros, .registros .estado-vacio';
  /** Entra a una dirección de Registros y espera la lista (o su estado vacío). Devuelve la marca de los pedidos. */
  const entrar = async (ruta) => {
    await cupo(v, 60);
    const desde = v.urls.length;
    await ir(page, ruta);
    await page.waitForSelector('#titulo-registros', { timeout: 30_000 });
    await quieto(page, v);
    await page.waitForSelector(LISTA, { timeout: 30_000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    return desde;
  };
  /** Sale de Registros a otra sección de Nutrición (ahí no hay lista que esperar). */
  const salir = async () => {
    await cupo(v, 60);
    await ir(page, `/pro/advisees/nutrition?id=${A}&vista=resumen`);
    await page.waitForFunction(() => !document.querySelector('#titulo-registros'), { timeout: 30_000 });
    await quieto(page, v);
  };
  /** Abre los días que están plegados, para leer todas sus filas. */
  const abrirLosDias = async () => {
    for (;;) {
      const quedaba = await page.evaluate(() => {
        const plegado = document.querySelector('.dia-de-registros:not([data-abierto]) button.dia-de-registros__resumen');
        if (!plegado) return false;
        plegado.click();
        return true;
      });
      if (!quedaba) break;
      await pausa(60);
    }
  };
  const leerLaLinea = async (desde, hasta) => {
    const entradas = [];
    let cursor = null;
    do {
      const r = await leerApi(v, `/advisees/${A}/timeline?periodStart=${desde}&periodEnd=${hasta}&domain=NUTRITION&type=MEAL_RECORDED&limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
      entradas.push(...r.data.entries);
      cursor = r.page.hasMore ? r.page.nextCursor : null;
    } while (cursor);
    return entradas;
  };
  const dato = (e, rotulo) => e?.details.find((d) => d.label === rotulo)?.value ?? null;
  /** Lo que se espera ver, escrito a mano desde las dos respuestas: los días, del más nuevo al más viejo, con sus filas. */
  const esperado = (ctx, entradas) => {
    const porRegistro = new Map(entradas.map((e) => [e.source.id, e]));
    const dias = [...ctx.descriptiveContrast.days]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((d) => {
        const enUnaComida = new Set(d.meals.flatMap((m) => m.differentMealExecutionIds));
        const descripcion = new Map(d.outsidePrescription.map((o) => [o.executionId, o.description]));
        const filas = [
          ...d.meals.map((m) => ({
            comida: m.label,
            estado: m.state === 'REGISTERED' ? 'REGISTRADA' : m.differentMealExecutionIds.length > 0 ? 'COMIDA_DIFERENTE' : 'SIN_REGISTRO',
            opcion: m.state === 'REGISTERED' ? m.executionId : null,
            entrada: m.state === 'REGISTERED' ? (porRegistro.get(m.executionId) ?? null) : null,
            diferentes: m.differentMealExecutionIds.map((id) => ({ id, descripcion: descripcion.get(id) ?? null, entrada: porRegistro.get(id) ?? null })),
            // Una resta que da cero no es una diferencia (así llegan las porciones del plan confirmadas).
            diferencias: m.quantityDifferences.filter((q) => q.difference !== 0),
            restasEnCero: m.quantityDifferences.filter((q) => q.difference === 0).length,
          })),
          ...d.outsidePrescription.filter((o) => !enUnaComida.has(o.executionId)).map((o) => ({ comida: null, estado: 'COMIDA_DIFERENTE', opcion: null, entrada: null, diferentes: [{ id: o.executionId, descripcion: o.description, entrada: porRegistro.get(o.executionId) ?? null }], diferencias: [] })),
        ];
        return { fecha: d.date, sinRegistros: d.dataState === 'NO_DATA', sinComidasDelPlan: d.meals.length === 0, filas };
      });
    const filas = dias.flatMap((d) => d.filas);
    const con = (rasgo) => filas.filter((f) => f.entrada?.quality.includes(rasgo)).length;
    const cuentas = {
      TODAS: filas.length,
      DISTINTAS: con('QUANTITIES_DIFFER_FROM_PLAN'),
      SIN_CONFIRMAR: con('QUANTITIES_UNCONFIRMED'),
      COMIDA_DIFERENTE: filas.filter((f) => f.diferentes.length > 0).length,
      SIN_REGISTRO: filas.filter((f) => f.estado === 'SIN_REGISTRO').length,
    };
    return { dias, filas, cuentas };
  };
  /** El renglón de un día, a mano: «N de M comidas registradas», «Sin registro» o que no hay una opción del plan. */
  const principalDe = (d) => {
    if (d.sinComidasDelPlan) return null; // lo dice con una frase propia: no se compara acá
    if (d.sinRegistros) return 'Sin registro';
    const delPlan = d.filas.filter((f) => f.comida !== null);
    const registradas = delPlan.filter((f) => f.estado === 'REGISTRADA').length;
    return registradas === 0 ? 'Sin opción del plan registrada' : `${registradas} de ${delPlan.length} ${comidas(delPlan.length)} ${delPlan.length === 1 ? 'registrada' : 'registradas'}`;
  };
  /** Lo que tiene que decir cada dato de una fila, a mano, con el rótulo que oye el lector de pantalla. */
  const MODO = { QUANTITIES_FROM_PLAN: 'Porciones del plan', QUANTITIES_REPORTED: 'Cantidades informadas', QUANTITIES_UNCONFIRMED: 'Sin confirmar' };
  const SIN_COMPROBAR = { QUANTITIES_FROM_PLAN: 'Sin diferencia: son las porciones del plan', QUANTITIES_UNCONFIRMED: 'No se puede comprobar: sin confirmar' };
  const textoDeLaFila = (f) => {
    const e = f.entrada;
    const modo = e ? Object.keys(MODO).find((q) => e.quality.includes(q)) : null;
    const opcion = e ? (dato(e, 'Opción') ?? '') : '';
    const diferentes = f.diferentes.map((d) => `Comida diferente: ${d.descripcion ? `«${d.descripcion}»` : 'sin descripción'}${dato(d.entrada, 'Cantidad aproximada') ? `, ${dato(d.entrada, 'Cantidad aproximada')}` : ''}`);
    const deLaFila = [e, ...f.diferentes.map((d) => d.entrada)].filter(Boolean);
    const etiquetas = [deLaFila.some((x) => x.state === 'RECTIFIED') ? 'Rectificado' : null, deLaFila.some((x) => x.state === 'CORRECTED') ? 'Corregido' : null, deLaFila.some((x) => x.recordedLate) ? 'Cargado otro día' : null].filter(Boolean);
    const registrado =
      f.estado === 'SIN_REGISTRO'
        ? ['Sin registro']
        : [
            ...(f.opcion ? [/^\d+$/.test(opcion) ? `Opción ${opcion}` : opcion.replace(/^\d+ · /, '')] : []),
            ...(f.estado === 'COMIDA_DIFERENTE' && f.comida !== null ? ['Sin opción del plan registrada'] : []),
            ...diferentes,
            ...etiquetas,
          ];
    return {
      estado: f.estado,
      comida: f.comida ?? 'Fuera del plan',
      registrado: `Registrado: ${registrado.join(' ')}`,
      cantidades: `Cantidades: ${f.opcion ? (modo ? MODO[modo] : 'Sin dato') : 'no corresponde'}`,
      // Las restas se escriben con el formato de números de la pantalla: acá se comprueba lo que va antes de ellas.
      diferencia: f.opcion ? `Diferencia observada: ${dato(e, 'Frente a lo indicado') ?? (modo ? (SIN_COMPROBAR[modo] ?? 'Sin dato') : 'Sin dato')}` : f.diferentes.length > 0 ? 'Diferencia observada: No se compara: fuera de lo indicado' : 'Diferencia observada: no corresponde',
      restas: f.diferencias.map((q) => `${q.name} ${q.difference > 0 ? '+' : q.difference < 0 ? '−' : ''}`),
      registro: f.opcion ?? f.diferentes[0]?.id ?? null,
    };
  };
  const filaBien = (vista, espera) =>
    vista.estado === espera.estado &&
    vista.comida === espera.comida &&
    vista.registrado === espera.registrado &&
    vista.cantidades === espera.cantidades &&
    vista.diferencia.startsWith(espera.diferencia) &&
    espera.restas.every((r) => vista.diferencia.includes(r)) &&
    vista.registro === espera.registro &&
    vista.esBoton === (espera.registro !== null);
  /**
   * La celda «Diferencia» de cada ingrediente de un registro, a mano: con palabras, nunca una raya. De una resta se
   * mira el signo (el número lleva el formato de la pantalla).
   */
  const diferenciaAMano = (registro) =>
    (registro.option?.items ?? []).map((item) => {
      const estadoDeLasCantidades = registro.consumption?.status ?? 'UNCONFIRMED';
      if (estadoDeLasCantidades === 'UNCONFIRMED') return 'no se puede comprobar';
      if (estadoDeLasCantidades === 'PLAN_PORTIONS') return 'sin diferencia';
      const informado = (registro.consumption?.items ?? []).find((i) => i.itemId === item.itemId);
      if (!informado || informado.notEaten || !informado.quantity || !item.quantity) return 'no se resta';
      if (informado.quantity.unit !== item.quantity.unit) return 'otra unidad: no se resta';
      const resta = Math.round((informado.quantity.value - item.quantity.value) * 100) / 100;
      return resta === 0 ? 'igual' : resta > 0 ? '+' : '−';
    });
  const celdasBien = (celdas, registro) => {
    const espera = diferenciaAMano(registro);
    return (
      espera.length > 0 &&
      celdas.length === espera.length &&
      espera.every((e, i) => (e === '+' || e === '−' ? (celdas[i][3] ?? '').startsWith(e) : celdas[i][3] === e)) &&
      !celdas.flat().includes('—')
    );
  };

  // ── La entrada: el período que propone la API, las dos lecturas y los días ────────────────────────────────────
  const alEntrar = await entrar(BASE);
  const ctx = (await leerApi(v, `/advisees/${A}/nutrition/review-context`)).data;
  const entradas = await leerLaLinea(ctx.period.start, ctx.period.end);
  const E = esperado(ctx, entradas);
  const inicial = await registrosEnPantalla(page);
  const deLaLinea = pedidos(`/advisees/${A}/timeline`, alEntrar);
  comprobar(
    'F-15',
    'Al entrar, Registros hace dos lecturas: el contexto de revisión, sin período (lo propone la API), y las comidas de la línea de tiempo de ese mismo período; el control dice el período que propuso la API',
    pedidos('/nutrition/review-context', alEntrar).length === 1 &&
      !/periodStart/.test(pedidos('/nutrition/review-context', alEntrar)[0]) &&
      deLaLinea.length === 1 &&
      deLaLinea[0].includes(`periodStart=${ctx.period.start}`) &&
      deLaLinea[0].includes(`periodEnd=${ctx.period.end}`) &&
      /domain=NUTRITION/.test(deLaLinea[0]) &&
      /type=MEAL_RECORDED/.test(deLaLinea[0]) &&
      (inicial.periodo ?? '').includes(`${E.dias.length} días`),
    `contexto: ${pedidos('/nutrition/review-context', alEntrar).length} · línea de tiempo: ${deLaLinea.length} · ${inicial.periodo} · la API: ${ctx.period.start} a ${ctx.period.end}`,
  );
  comprobar(
    'C-49',
    'El día es la unidad: están todos los días del período, del más nuevo al más viejo, cada uno dicho en un renglón con la cuenta calculada a mano («N de M comidas registradas», o «Sin registro» si no hay ninguno); los nombres de las columnas están una vez',
    inicial.titulo === 'Registros' &&
      igual(inicial.dias.map((d) => d.fecha), E.dias.map((d) => d.fecha)) &&
      E.dias.every((d, i) => principalDe(d) === null || inicial.dias[i].principal === principalDe(d)) &&
      igual(inicial.columnas, ['Comida', 'Registrado', 'Cantidades', 'Diferencia observada']),
    inicial.dias.map((d, i) => `${d.fecha.slice(5)}: ${d.principal}${principalDe(E.dias[i]) === d.principal ? '' : ` (a mano: ${principalDe(E.dias[i])})`}`).join(' · '),
  );
  comprobar(
    'C-49',
    'Arrancan abiertos los días con una comida diferente o con algo distinto de lo indicado, y solo esos; los demás van en un renglón que se puede abrir',
    E.dias.every((d, i) => inicial.dias[i].abierto === d.filas.some((f) => f.diferentes.length > 0 || f.entrada?.quality.includes('QUANTITIES_DIFFER_FROM_PLAN') || f.diferencias.length > 0)) && inicial.dias.every((d) => d.seAbre || d.filas.length === 0),
    inicial.dias.map((d) => `${d.fecha.slice(5)}${d.abierto ? ' abierto' : ''}`).join(' · '),
  );

  // ── Las vistas con nombre y su cantidad ─────────────────────────────────────────────────────────────────────
  const ORDEN = ['TODAS', 'DISTINTAS', 'SIN_CONFIRMAR', 'COMIDA_DIFERENTE', 'SIN_REGISTRO'];
  const porEstado = (estadoDeLaFila) => E.filas.filter((f) => f.estado === estadoDeLaFila).length;
  comprobar(
    'F-16',
    'Las cinco vistas están en su orden, cada una con la cantidad de comidas que trae (contada a mano sobre las dos respuestas de la API); registradas, con comida diferente y sin registro suman «Todas las comidas»; al entrar está elegida «Todas»',
    igual(inicial.vistas.map((x) => x.vista), ORDEN) &&
      inicial.vistas.every((x) => x.cuenta === num(E.cuentas[x.vista]) && x.dice === `${num(E.cuentas[x.vista])} ${comidas(E.cuentas[x.vista])}`) &&
      porEstado('REGISTRADA') + porEstado('COMIDA_DIFERENTE') + porEstado('SIN_REGISTRO') === E.cuentas.TODAS &&
      E.cuentas.TODAS > 0 &&
      inicial.vistas.every((x) => x.elegida === (x.vista === 'TODAS' ? 'true' : 'false')),
    `${inicial.vistas.map((x) => `${x.nombre} ${x.cuenta}`).join(' · ')} — a mano: ${ORDEN.map((k) => E.cuentas[k]).join(', ')} (${porEstado('REGISTRADA')} registradas + ${porEstado('COMIDA_DIFERENTE')} con comida diferente + ${porEstado('SIN_REGISTRO')} sin registro)`,
  );

  // ── Cada fila, con las palabras del dominio ─────────────────────────────────────────────────────────────────
  await abrirLosDias();
  const abiertos = await registrosEnPantalla(page);
  const filasALaVista = abiertos.dias.flatMap((d) => d.filas);
  const filasEsperadas = E.filas.map(textoDeLaFila);
  const distintas = filasALaVista.map((f, i) => (filasEsperadas[i] && filaBien(f, filasEsperadas[i]) ? null : i)).filter((i) => i !== null);
  comprobar(
    'C-53',
    'Cada comida del plan es una fila, en el orden del plan: lo registrado (la opción, «Sin registro», o los dos hechos de una comida diferente), cómo se informaron las cantidades y la diferencia observada, con las palabras del dominio; una fila sin registro no abre nada',
    filasALaVista.length === filasEsperadas.length && filasEsperadas.length > 0 && distintas.length === 0,
    distintas.length === 0
      ? `${filasALaVista.length} filas, las ${filasEsperadas.length} esperadas`
      : `${distintas.length} filas distintas; la primera: ${JSON.stringify(filasALaVista[distintas[0]])} — a mano: ${JSON.stringify(filasEsperadas[distintas[0]])}`,
  );
  const conDiferente = filasEsperadas.find((f) => f.estado === 'COMIDA_DIFERENTE');
  const enPantalla = conDiferente ? filasALaVista[filasEsperadas.indexOf(conDiferente)] : null;
  comprobar(
    'C-50',
    'Una comida diferente se lee en la comida donde se registró, con los dos hechos («Sin opción del plan registrada» y la comida diferente, con su descripción); no cuenta como registrada, y la vista «Comida diferente» la trae',
    !!conDiferente && !!enPantalla && /Sin opción del plan registrada/.test(enPantalla.registrado) && /Comida diferente: «/.test(enPantalla.registrado) && enPantalla.estado === 'COMIDA_DIFERENTE' && /No se compara: fuera de lo indicado/.test(enPantalla.diferencia) && E.cuentas.COMIDA_DIFERENTE >= 1,
    conDiferente ? `${enPantalla?.comida} · ${enPantalla?.registrado} · ${enPantalla?.diferencia}` : 'el escenario no tiene una comida diferente en este período',
  );
  const conPorciones = filasALaVista.filter((f) => /Porciones del plan/.test(f.cantidades));
  comprobar(
    'C-51',
    'Con las porciones del plan confirmadas la fila dice «Sin diferencia: son las porciones del plan», y nada más: no una raya, ni «igual» de algo que BE no comparó, ni las restas en cero que la API manda por cada ítem. Ninguna fila dice una raya suelta ni lista una resta en cero',
    conPorciones.length > 0 &&
      conPorciones.every((f) => f.diferencia === 'Diferencia observada: Sin diferencia: son las porciones del plan') &&
      E.filas.some((f) => f.restasEnCero > 0) &&
      !filasALaVista.some((f) => /: —$/.test(f.diferencia) || /: —$/.test(f.registrado) || /\s0 (g|ml|unidad)(\s|$)/.test(f.diferencia)),
    `${conPorciones.length} filas con las porciones del plan · ${conPorciones[0]?.diferencia} · restas en cero que manda la API en el período: ${E.filas.reduce((n, f) => n + (f.restasEnCero ?? 0), 0)}`,
  );

  // ── Elegir una vista: no le pide nada a la API y deja las filas que cuenta ─────────────────────────────────────
  const alElegir = v.urls.length;
  await page.click('.registros__vistas .vista-de-la-linea[data-vista="SIN_REGISTRO"]');
  await page.waitForFunction(() => new URL(location.href).searchParams.get('ver') === 'sin-registro', { timeout: 10_000 }).catch(() => {});
  await pausa(300);
  const sinRegistro = await registrosEnPantalla(page);
  const filasSinRegistro = sinRegistro.dias.flatMap((d) => d.filas);
  await page.click('.registros__vistas .vista-de-la-linea[data-vista="SIN_REGISTRO"]');
  await page.waitForFunction(() => !new URL(location.href).searchParams.has('ver'), { timeout: 10_000 }).catch(() => {});
  await pausa(300);
  const deVuelta = await registrosEnPantalla(page);
  comprobar(
    'F-16',
    'Elegir «Sin registro» no le pide nada a la API, queda en la dirección (`ver=sin-registro`) y deja a la vista las filas que cuenta, todas sin registro y ninguna otra; volver a tocarla deja «Todas las comidas»',
    v.urls.slice(alElegir).filter((u) => u.startsWith('GET ')).length === 0 &&
      E.cuentas.SIN_REGISTRO > 0 &&
      filasSinRegistro.length === E.cuentas.SIN_REGISTRO &&
      filasSinRegistro.every((f) => f.estado === 'SIN_REGISTRO' && !f.esBoton) &&
      sinRegistro.vistas.find((x) => x.vista === 'SIN_REGISTRO')?.elegida === 'true' &&
      (sinRegistro.cuenta ?? '').startsWith(`${num(E.cuentas.SIN_REGISTRO)} de ${num(E.cuentas.TODAS)} ${comidas(E.cuentas.TODAS)}`) &&
      deVuelta.vistas.find((x) => x.vista === 'TODAS')?.elegida === 'true' &&
      deVuelta.dias.length === E.dias.length,
    `${filasSinRegistro.length} filas (a mano: ${E.cuentas.SIN_REGISTRO}) · «${sinRegistro.cuenta}» · pedidos a la API: ${v.urls.slice(alElegir).filter((u) => u.startsWith('GET ')).length}`,
  );

  // ── El detalle de un registro, al costado ───────────────────────────────────────────────────────────────────
  await abrirLosDias();
  const registrada = E.filas.map(textoDeLaFila).find((f) => f.estado === 'REGISTRADA' && f.registro);
  await cupo(v, 60);
  const alAbrir = v.urls.length;
  await page.click(`.comida-del-dia__fila[data-registro="${registrada.registro}"]`);
  await page.waitForSelector('aside.detalle-del-hecho .detalle-de-valores', { timeout: 20_000 }).catch(() => {});
  await quieto(page, v);
  const conDetalle = await registrosEnPantalla(page);
  const leido = (await leerApi(v, `/nutrition/meal-records/${registrada.registro}`)).data;
  const opcionDelDetalle = registrada.registrado.replace(/^Registrado: /, '').replace(/ (Rectificado|Corregido|Cargado otro día)/g, '');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('aside.detalle-del-hecho'), { timeout: 10_000 }).catch(() => {});
  await pausa(150);
  const focoAlCerrar = await page.evaluate(() => document.activeElement?.getAttribute('data-registro') ?? null);
  comprobar(
    'F-18',
    'Tocar una fila abre su registro al costado, sin tapar la lista: el título dice la comida y la opción y recibe el foco, el registro se lee una vez por su propia operación y dice la opción que da la API; en su tabla, la diferencia de cada ingrediente va con palabras, sin rayas; queda en la dirección; Escape lo cierra y el foco vuelve a la fila',
    pedidos(`/nutrition/meal-records/${registrada.registro}`, alAbrir).length === 1 &&
      conDetalle.detalle?.titulo === `${registrada.comida} · ${opcionDelDetalle}` &&
      conDetalle.detalle.conElFoco &&
      conDetalle.detalle.texto.includes(leido.option.label) &&
      celdasBien(conDetalle.detalle.celdas, leido) &&
      conDetalle.dias.length === E.dias.length &&
      conDetalle.dias.flatMap((d) => d.filas).some((f) => f.elegida && f.registro === registrada.registro) &&
      conDetalle.panel === null &&
      focoAlCerrar === registrada.registro &&
      !parametros(page).has('registro'),
    `«${conDetalle.detalle?.titulo}» · foco en el título: ${conDetalle.detalle?.conElFoco} · lecturas del registro: ${pedidos(`/nutrition/meal-records/${registrada.registro}`, alAbrir).length} · la API: ${leido.option?.label} · diferencias: ${(conDetalle.detalle?.celdas ?? []).map((c) => c[3]).join(' | ') || 'sin tabla'} (a mano: ${diferenciaAMano(leido).join(' | ')}) · al cerrar, el foco en la fila: ${focoAlCerrar === registrada.registro}`,
  );

  // ── «Actualizar» conserva lo elegido; el período de 30 días ──────────────────────────────────────────────────
  const hoyDelEscenario = hoy;
  const alCambiar = await entrar(`${BASE}&p=30&ver=sin-registro`);
  const treinta = await registrosEnPantalla(page);
  const ctx30 = (await leerApi(v, `/advisees/${A}/nutrition/review-context?periodStart=${diaMenos(hoyDelEscenario, 29)}&periodEnd=${hoyDelEscenario}`)).data;
  const E30 = esperado(ctx30, await leerLaLinea(ctx30.period.start, ctx30.period.end));
  const diasCon = (clave, e) => e.dias.filter((d) => d.filas.some((f) => (clave === 'SIN_REGISTRO' ? f.estado === 'SIN_REGISTRO' : true))).length;
  await cupo(v, 60);
  const alActualizar = v.urls.length;
  await clic(page, 'header.marco-del-area .ficha__consulta button', 'Actualizar');
  await quieto(page, v);
  await page.waitForSelector(LISTA, { timeout: 30_000 });
  const trasActualizar = await registrosEnPantalla(page);
  comprobar(
    'F-17',
    'El período elegido va en la dirección (`p=30`): las dos lecturas piden esos 30 días, el control lo dice y las cantidades son las de ese período, contadas a mano. «Actualizar» vuelve a leer y conserva el período y la vista elegida',
    pedidos('/nutrition/review-context', alCambiar).some((u) => u.includes(`periodStart=${diaMenos(hoyDelEscenario, 29)}`) && u.includes(`periodEnd=${hoyDelEscenario}`)) &&
      pedidos(`/advisees/${A}/timeline`, alCambiar).length >= 1 &&
      pedidos(`/advisees/${A}/timeline`, alCambiar).every((u) => u.includes(`periodStart=${ctx30.period.start}`) && u.includes(`periodEnd=${ctx30.period.end}`)) &&
      /30 días/.test(treinta.periodo ?? '') &&
      treinta.vistas.every((x) => x.cuenta === num(E30.cuentas[x.vista])) &&
      treinta.vistas.find((x) => x.vista === 'SIN_REGISTRO')?.elegida === 'true' &&
      pedidos('/nutrition/review-context', alActualizar).length === 1 &&
      pedidos(`/advisees/${A}/timeline`, alActualizar).length >= 1 &&
      parametros(page).get('p') === '30' &&
      parametros(page).get('ver') === 'sin-registro' &&
      igual(trasActualizar.vistas, treinta.vistas) &&
      /30 días/.test(trasActualizar.periodo ?? ''),
    `${treinta.periodo} · ${treinta.vistas.map((x) => `${x.nombre} ${x.cuenta}`).join(' · ')} — a mano: ${ORDEN.map((k) => E30.cuentas[k]).join(', ')} · tras «Actualizar»: p=${parametros(page).get('p')}, ver=${parametros(page).get('ver')}`,
  );
  // ── El control de período, usado: los atajos que admite, un rango propio y su tope ─────────────────────────────
  await entrar(BASE);
  const RANGO = '.registros .periodo-del-seguimiento__rango';
  await clic(page, '.registros .periodo-del-seguimiento__boton', 'Período').catch(() => null);
  await page.waitForSelector('.registros .periodo-del-seguimiento__opciones button', { timeout: 5_000 }).catch(() => {});
  const atajos = await textos(page, '.registros .periodo-del-seguimiento__opciones button');
  await cupo(v, 60);
  const alElegirAtajo = v.urls.length;
  await clic(page, '.registros .periodo-del-seguimiento__opciones button', '30 días').catch(() => null);
  await page.waitForFunction(() => new URL(location.href).searchParams.get('p') === '30', { timeout: 10_000 }).catch(() => {});
  await quieto(page, v);
  await page.waitForSelector(LISTA, { timeout: 30_000 }).catch(() => {});
  const conAtajo = await registrosEnPantalla(page);
  const pidioTreinta = pedidos('/nutrition/review-context', alElegirAtajo).some((u) => u.includes(`periodStart=${diaMenos(hoyDelEscenario, 29)}`) && u.includes(`periodEnd=${hoyDelEscenario}`));
  // Un rango propio de 100 días no sale: dice el tope y no le pide nada a la API.
  await clic(page, '.registros .periodo-del-seguimiento__boton', 'Período').catch(() => null);
  await page.waitForSelector(`${RANGO} input[type="date"]`, { timeout: 5_000 }).catch(() => {});
  await page.evaluate((r) => document.querySelectorAll(`${r} input[type="date"]`).forEach((c, i) => c.setAttribute('data-rango', i === 0 ? 'desde' : 'hasta')), RANGO);
  const alPasarse = v.urls.length;
  await fijarFecha(page, `${RANGO} [data-rango="desde"]`, diaMenos(hoyDelEscenario, 99)).catch(() => {});
  await fijarFecha(page, `${RANGO} [data-rango="hasta"]`, hoyDelEscenario).catch(() => {});
  await clic(page, `${RANGO} button`, 'Aplicar').catch(() => null);
  await pausa(300);
  const tope = await texto(page, '.registros .periodo-del-seguimiento__panel .campo__error');
  const pidioAlPasarse = v.urls.slice(alPasarse).filter((u) => u.startsWith('GET ')).length;
  // Uno que entra: queda en la dirección con sus dos fechas, sin el atajo.
  const desdePropio = diaMenos(hoyDelEscenario, 20);
  const hastaPropio = diaMenos(hoyDelEscenario, 10);
  await cupo(v, 60);
  const alAplicar = v.urls.length;
  await fijarFecha(page, `${RANGO} [data-rango="desde"]`, desdePropio).catch(() => {});
  await fijarFecha(page, `${RANGO} [data-rango="hasta"]`, hastaPropio).catch(() => {});
  await clic(page, `${RANGO} button`, 'Aplicar').catch(() => null);
  await page.waitForFunction((d) => new URL(location.href).searchParams.get('desde') === d, { timeout: 10_000 }, desdePropio).catch(() => {});
  await quieto(page, v);
  await page.waitForSelector(LISTA, { timeout: 30_000 }).catch(() => {});
  const conRango = await registrosEnPantalla(page);
  comprobar(
    'F-17',
    'El control de período ofrece los atajos que la lectura admite (7, 30 y 90 días; no «1 año»). Elegir «30 días» deja `p=30` en la dirección y lee esos 30 días. Un rango propio de 100 días no sale: dice el tope (92) y no le pide nada a la API. Uno de 11 días queda en la dirección con sus dos fechas, sin el atajo, y la pantalla lo dice sin «incluye hoy»',
    igual(atajos, ['7 días', '30 días', '90 días']) &&
      pidioTreinta &&
      /30 días/.test(conAtajo.periodo ?? '') &&
      /hasta 92 días/.test(tope) &&
      pidioAlPasarse === 0 &&
      parametros(page).get('desde') === desdePropio &&
      parametros(page).get('hasta') === hastaPropio &&
      !parametros(page).has('p') &&
      pedidos('/nutrition/review-context', alAplicar).some((u) => u.includes(`periodStart=${desdePropio}`) && u.includes(`periodEnd=${hastaPropio}`)) &&
      /11 días/.test(conRango.periodo ?? '') &&
      !/incluye hoy/.test(conRango.periodo ?? '') &&
      conRango.dias.length === 11,
    `atajos: ${atajos.join(', ') || 'ninguno'} · con el atajo: ${conAtajo.periodo} · con 100 días: «${tope}», ${pidioAlPasarse} pedidos · con el rango propio: ${conRango.periodo} · ${conRango.dias.length} días a la vista`,
  );
  // Un período largo no se muestra entero de una vez: catorce días, y los demás a pedido (la lectura ya los trajo).
  await entrar(`${BASE}&p=30`);
  const largo = await registrosEnPantalla(page);
  const alVerMas = v.urls.length;
  const hayMas = !!largo.masDias;
  if (hayMas) await clic(page, '.registros .linea__mas button', 'Ver días anteriores');
  await pausa(300);
  const masLargo = await registrosEnPantalla(page);
  comprobar(
    'F-19',
    'Con 30 días se muestran catorce y «Ver días anteriores» trae otros catorce sin pedirle nada a la API; cada día dice la cuenta calculada a mano',
    E30.dias.length === 30 &&
      largo.dias.length === 14 &&
      hayMas &&
      masLargo.dias.length === 28 &&
      v.urls.slice(alVerMas).filter((u) => u.startsWith('GET ')).length === 0 &&
      masLargo.dias.every((d, i) => principalDe(E30.dias[i]) === null || d.principal === principalDe(E30.dias[i])),
    `${largo.dias.length} días al entrar, ${masLargo.dias.length} después · «${largo.masDias}» · ${diasCon('SIN_REGISTRO', E30)} días con alguna comida sin registro`,
  );

  // ── Noventa días: la línea de tiempo llega en varias páginas, y hay días enteros sin registros ────────────────────
  const alPedir90 = await entrar(`${BASE}&p=90`);
  const ctx90 = (await leerApi(v, `/advisees/${A}/nutrition/review-context?periodStart=${diaMenos(hoyDelEscenario, 89)}&periodEnd=${hoyDelEscenario}`)).data;
  const entradas90 = await leerLaLinea(ctx90.period.start, ctx90.period.end);
  const E90 = esperado(ctx90, entradas90);
  const paginas90 = pedidos(`/advisees/${A}/timeline`, alPedir90).length;
  const noventa = await registrosEnPantalla(page);
  while (await page.$('.registros .linea__mas button')) {
    await clic(page, '.registros .linea__mas button', 'Ver días anteriores');
    await pausa(150);
  }
  const todos90 = await registrosEnPantalla(page);
  const sinNingunRegistro = E90.dias.filter((d) => d.sinRegistros && !d.sinComidasDelPlan).length;
  comprobar(
    'F-19',
    'Con 90 días, la línea de tiempo se lee entera, de a 50 registros (tantas páginas como hagan falta), y las cantidades de las cinco vistas son las del período, contadas a mano; los días enteros sin registros dicen «Sin registro» y ninguno dice «0 de»',
    entradas90.length > 50 &&
      paginas90 === Math.ceil(entradas90.length / 50) &&
      noventa.vistas.every((x) => x.cuenta === num(E90.cuentas[x.vista])) &&
      todos90.dias.length === E90.dias.length &&
      sinNingunRegistro > 0 &&
      todos90.dias.filter((d) => d.principal === 'Sin registro').length === sinNingunRegistro &&
      todos90.dias.every((d, i) => principalDe(E90.dias[i]) === null || d.principal === principalDe(E90.dias[i])) &&
      !todos90.dias.some((d) => /\b0 de\b/.test(`${d.principal} ${d.notas.join(' ')}`)),
    `${entradas90.length} registros en ${paginas90} páginas (a mano: ${Math.ceil(entradas90.length / 50)}) · ${noventa.vistas.map((x) => `${x.nombre} ${x.cuenta}`).join(' · ')} — a mano: ${ORDEN.map((k) => E90.cuentas[k]).join(', ')} · ${todos90.dias.length} días, ${sinNingunRegistro} sin ningún registro`,
  );
  // Los días que no aportan comidas del plan: lo dicen con su frase, y la pantalla dice cuántos son.
  const sinComidas = ctx90.descriptiveContrast.days.filter((d) => d.meals.length === 0);
  const sinPlan90 = sinComidas.filter((d) => !d.planId);
  const sinDiaTipo90 = sinComidas.filter((d) => d.planId);
  const cuantos = (n) => (n === 1 ? 'un día' : `${n} días`);
  if (sinComidas.length > 0) {
    const enPantalla90 = (d) => todos90.dias.find((x) => x.fecha === d.date) ?? null;
    comprobar(
      'F-16',
      'Un día sin plan vigente, o de un plan con más de un día tipo y sin registros que digan cuál era, lo dice con su frase y no se abre (no tiene comidas del plan que mostrar); la pantalla dice cuántos días son, y sus comidas no entran en ninguna cantidad',
      sinPlan90.every((d) => enPantalla90(d)?.principal === 'Ese día no había un plan vigente.') &&
        sinDiaTipo90.every((d) => /más de un día tipo/.test(enPantalla90(d)?.principal ?? '')) &&
        sinComidas.every((d) => enPantalla90(d)?.seAbre === d.outsidePrescription.length > 0) &&
        (sinPlan90.length === 0 || (noventa.cuenta ?? '').includes(`${cuantos(sinPlan90.length)} sin plan vigente`)) &&
        (sinDiaTipo90.length === 0 || (noventa.cuenta ?? '').includes(`${cuantos(sinDiaTipo90.length)} sin día tipo determinado`)),
      `sin plan vigente: ${sinPlan90.length} · sin día tipo determinado: ${sinDiaTipo90.length} · «${noventa.cuenta}»`,
    );
  } else {
    informar('F-16', 'Un día sin plan vigente o sin día tipo determinado', 'el escenario no tiene ninguno en los últimos 90 días: no se pudo mirar');
  }

  // ── El registro de una comida con cantidades informadas, abierto por su dirección (C-53) ──────────────────────
  const informadaE = E90.filas.find((f) => f.opcion && f.entrada?.quality.includes('QUANTITIES_REPORTED')) ?? null;
  if (informadaE) {
    await entrar(`${BASE}&p=90&registro=${informadaE.opcion}`);
    await page.waitForSelector('aside.detalle-del-hecho .detalle-de-valores', { timeout: 20_000 }).catch(() => {});
    await quieto(page, v);
    const informada = await page.evaluate(() => {
      const d = document.querySelector('aside.detalle-del-hecho');
      return {
        titulo: d?.querySelector('h3')?.innerText.replace(/\s+/g, ' ').trim() ?? null,
        texto: d?.innerText.replace(/\s+/g, ' ').trim() ?? '',
        columnas: [...(d?.querySelectorAll('table thead th') ?? [])].map((th) => th.innerText.trim()),
        celdas: [...(d?.querySelectorAll('table tbody tr') ?? [])].map((tr) => [...tr.children].map((c) => c.innerText.replace(/\s+/g, ' ').trim())),
      };
    });
    const leidaInformada = (await leerApi(v, `/nutrition/meal-records/${informadaE.opcion}`)).data;
    comprobar(
      'C-53',
      'El registro de una comida con cantidades informadas se abre por su dirección (aunque su día esté plegado o más abajo) y usa las palabras de BE: «Informó lo que comió de cada ingrediente», y la tabla de ingredientes con las columnas «Indicado», «Registrado» y «Diferencia», con la diferencia de cada ingrediente dicha con la resta o con palabras, sin rayas; dice la opción que da la API',
      parametros(page).get('registro') === informadaE.opcion &&
        (informada.titulo ?? '').startsWith(`${informadaE.comida} · `) &&
        informada.texto.includes('Informó lo que comió de cada ingrediente') &&
        igual(informada.columnas, ['Ingrediente', 'Indicado', 'Registrado', 'Diferencia']) &&
        informada.texto.includes(leidaInformada.option.label) &&
        celdasBien(informada.celdas, leidaInformada),
      `«${informada.titulo}» · columnas: ${informada.columnas.join(', ') || 'sin tabla'} · la API: ${leidaInformada.option?.label} · diferencias: ${informada.celdas.map((c) => c[3]).join(' | ') || 'sin tabla'}`,
    );
    // «Actualizar» con el registro abierto: la sección se monta de nuevo con el registro ya en la dirección. Un vigía
    // anota si el panel de encima llega a abrirse, aunque sea por un instante.
    await page.evaluate(() => {
      window.__panelDeEncima = 0;
      window.__vigiaDelPanel?.disconnect();
      window.__vigiaDelPanel = new MutationObserver(() => {
        if (document.querySelector('dialog.dialogo--panel[open]')) window.__panelDeEncima += 1;
      });
      window.__vigiaDelPanel.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] });
    });
    await cupo(v, 60);
    await clic(page, 'header.marco-del-area .ficha__consulta button', 'Actualizar').catch(() => null);
    await quieto(page, v);
    await page.waitForSelector('aside.detalle-del-hecho .detalle-de-valores', { timeout: 30_000 }).catch(() => {});
    await quieto(page, v);
    const trasActualizarElRegistro = await page.evaluate(() => {
      window.__vigiaDelPanel?.disconnect();
      const d = document.querySelector('aside.detalle-del-hecho');
      return { panel: window.__panelDeEncima ?? -1, titulo: d?.querySelector('h3')?.innerText.replace(/\s+/g, ' ').trim() ?? null };
    });
    comprobar(
      'F-18',
      '«Actualizar» con un registro abierto lo deja abierto al costado, con el registro en la dirección; la sección, que se vuelve a montar, no pasa por el panel de encima ni por un instante (a 1024 px el panel sí se abre: lo mira su comprobación)',
      trasActualizarElRegistro.panel === 0 && !!informada.titulo && trasActualizarElRegistro.titulo === informada.titulo && parametros(page).get('registro') === informadaE.opcion,
      `veces que el panel de encima estuvo abierto: ${trasActualizarElRegistro.panel} · al costado: «${trasActualizarElRegistro.titulo}»`,
    );
    const tapasDelRegistro = await tapasDeLaSuperficie(page, 'aside.detalle-del-hecho');
    comprobar(
      'C-53',
      'La tabla de ingredientes del detalle no lleva una franja a los costados: las «tapas» de lo que se desplaza tienen el color del detalle donde está, no el del fondo de la página',
      tapasBien(tapasDelRegistro),
      tapasEnPalabras(tapasDelRegistro),
    );
  } else {
    informar('C-53', 'El registro de una comida con cantidades informadas', 'el escenario no tiene ninguna en los últimos 90 días: no se pudo mirar');
  }

  // ── Una vista sin ninguna comida ────────────────────────────────────────────────────────────────────────────
  const enCero = ORDEN.find((k) => E.cuentas[k] === 0);
  if (enCero) {
    const PARAMETRO = { DISTINTAS: 'distintas', SIN_CONFIRMAR: 'sin-confirmar', COMIDA_DIFERENTE: 'comida-diferente', SIN_REGISTRO: 'sin-registro' };
    await entrar(`${BASE}&ver=${PARAMETRO[enCero]}`);
    const vacia = await registrosEnPantalla(page);
    comprobar(
      'F-16',
      'Una vista sin ninguna comida se muestra con su cero y, al elegirla, dice que ninguna coincide y cuántas hay en el período: no se confunde con un período vacío',
      vacia.vistas.find((x) => x.vista === enCero)?.cuenta === '0' && /Ninguna comida del período coincide/.test(vacia.vacio ?? '') && (vacia.vacio ?? '').includes(`${num(E.cuentas.TODAS)} ${comidas(E.cuentas.TODAS)}`) && vacia.dias.length === 0,
      `${enCero}: «${vacia.vacio}»`,
    );
  } else {
    informar('F-16', 'Una vista sin ninguna comida', 'el escenario tiene comidas en las cinco vistas del período de entrada: no se pudo mirar');
  }

  // ── Si falla la segunda lectura, los días se ven igual y lo que depende de ella lo dice ─────────────────────────
  const sinLinea = { coincide: (u) => u.includes(`/advisees/${A}/timeline`), accion: 'responder', status: 503, codigo: 'SERVICE_UNAVAILABLE' };
  await salir();
  v.reglas.push(sinLinea);
  await entrar(BASE);
  const conFalla = await registrosEnPantalla(page);
  await abrirLosDias();
  const filasConFalla = (await registrosEnPantalla(page)).dias.flatMap((d) => d.filas);
  v.reglas.splice(v.reglas.indexOf(sinLinea), 1);
  await cupo(v, 60);
  if (conFalla.falla) await clic(page, '.registros .estado-de-grafico--error button', 'Reintentar');
  await quieto(page, v);
  await page.waitForFunction(() => !document.querySelector('.registros .estado-de-grafico--error'), { timeout: 30_000 }).catch(() => {});
  const repuesto = await registrosEnPantalla(page);
  const sinNumero = (x, clave) => x.vistas.find((y) => y.vista === clave)?.cuenta ?? null;
  comprobar(
    'F-15',
    'Si la línea de tiempo no se puede leer (un 503 simulado), los días y sus comidas siguen a la vista con lo que el contraste sabe; lo dice en su lugar con el motivo y «Reintentar»; las dos vistas que dependen de ella no llevan número (no un cero) y las otras tres sí. «Reintentar» trae lo que faltaba',
    /No pudimos traer la opción ni las cantidades/.test(conFalla.falla ?? '') &&
      /BE no está disponible en este momento/.test(conFalla.falla ?? '') &&
      conFalla.dias.length === E.dias.length &&
      E.dias.every((d, i) => principalDe(d) === null || conFalla.dias[i].principal === principalDe(d)) &&
      sinNumero(conFalla, 'DISTINTAS') === null &&
      sinNumero(conFalla, 'SIN_CONFIRMAR') === null &&
      sinNumero(conFalla, 'TODAS') === num(E.cuentas.TODAS) &&
      sinNumero(conFalla, 'SIN_REGISTRO') === num(E.cuentas.SIN_REGISTRO) &&
      sinNumero(conFalla, 'COMIDA_DIFERENTE') === num(E.cuentas.COMIDA_DIFERENTE) &&
      filasConFalla.length === E.filas.length &&
      filasConFalla.filter((f) => f.estado === 'REGISTRADA').every((f) => /No se pudo traer/.test(f.cantidades) && /no se pudo traer/i.test(f.registrado)) &&
      repuesto.falla === null &&
      igual(repuesto.vistas.map((x) => x.cuenta), ORDEN.map((k) => num(E.cuentas[k]))),
    `«${(conFalla.falla ?? '').slice(0, 110)}» · ${conFalla.vistas.map((x) => `${x.nombre} ${x.cuenta ?? 'sin número'}`).join(' · ')} · después: ${repuesto.vistas.map((x) => x.cuenta).join(', ')}`,
  );

  // ── La primera pantalla, la ayuda, el teclado y axe ─────────────────────────────────────────────────────────
  await entrar(BASE);
  const medida = await page.evaluate(() => {
    const abajo = (s) => {
      const e = [...document.querySelectorAll(s)].pop();
      return e ? Math.round(e.getBoundingClientRect().bottom + scrollY) : null;
    };
    const todos = [...document.querySelectorAll('.registros .dia-de-registros')];
    const dias = todos.map((d) => Math.round(d.getBoundingClientRect().bottom + scrollY));
    // El primer día que arranca abierto (el que tiene algo distinto), y dónde termina.
    const abierto = todos.findIndex((d) => d.dataset.abierto === 'si');
    return { alto: document.documentElement.scrollHeight, lista: abajo('.registros .dia-de-registros'), vistas: abajo('.registros__vistas'), columnas: abajo('.registros__columnas'), dias, enteros: dias.filter((y) => y <= 900).length, abierto, finDelAbierto: abierto < 0 ? null : dias[abierto] };
  });
  informar('F-20', 'El alto de Registros con el período de entrada, a 1440 × 900', `${medida.alto} px · las vistas terminan a los ${medida.vistas} px, los nombres de las columnas a los ${medida.columnas} y el último de los ${medida.dias.length} días, a los ${medida.lista}`);
  comprobar(
    'F-20',
    'A 1440 × 900, con el período de entrada, entran sin desplazarse las vistas, los nombres de las columnas y, entero, el primer día que tiene algo distinto, con sus comidas abiertas: lo que hay para mirar está en la primera pantalla',
    medida.columnas !== null && medida.columnas <= 900 && medida.dias.length === E.dias.length && medida.abierto >= 0 && medida.finDelAbierto <= 900,
    `el día abierto (el ${medida.abierto + 1}.º de la lista) termina a los ${medida.finDelAbierto} px · ${medida.enteros} de ${medida.dias.length} días enteros en los primeros 900 px; el último termina a los ${medida.lista}`,
  );
  await clic(page, 'header.marco-del-area .como-se-lee__boton', 'Cómo se lee esta vista').catch(() => null);
  await page.waitForSelector('dialog.como-se-lee[open]', { timeout: 10_000 }).catch(() => {});
  const ayuda = await page.evaluate(() => {
    const d = document.querySelector('dialog.como-se-lee[open]');
    if (!d) return { titulo: null, renglones: 0, vistas: [], foco: false };
    return { titulo: d.querySelector('h2').innerText.trim(), renglones: d.querySelectorAll('.como-se-lee__lista > li').length, vistas: [...d.querySelectorAll('.como-se-lee__fuentes [data-vista]')].map((x) => x.dataset.vista), foco: document.activeElement === d.querySelector('h2') };
  });
  const faltasDeLaAyuda = await axe(page);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog.como-se-lee[open]'), { timeout: 10_000 }).catch(() => {});
  const focoTrasLaAyuda = await page.evaluate(() => document.activeElement?.classList.contains('como-se-lee__boton') ?? false);
  comprobar(
    'F-14',
    'Registros tiene su ayuda en el marco del área («Cómo se lee esta vista»): se abre por el título, explica cada marca y dice qué trae cada una de las cinco vistas; Escape la cierra y el foco vuelve al botón. Las otras secciones de Nutrición todavía no tienen la suya, y no muestran el botón',
    ayuda.titulo === 'Cómo se leen los Registros' && ayuda.renglones >= 10 && igual(ayuda.vistas, ORDEN) && ayuda.foco && focoTrasLaAyuda && faltasDeLaAyuda.length === 0,
    `«${ayuda.titulo}» · ${ayuda.renglones} renglones · ${ayuda.vistas.length} vistas · axe: ${faltasDeLaAyuda.length === 0 ? 'sin faltas' : faltasDeLaAyuda.map((f) => f.id).join(', ')}`,
  );
  await salir();
  const sinAyuda = await page.evaluate(() => document.querySelectorAll('header.marco-del-area .como-se-lee__boton').length);
  comprobar('F-14', 'En Nutrición · Resumen, que todavía no tiene ayuda, el marco no muestra el botón (la misma consulta lo encuentra en Registros)', sinAyuda === 0, `${sinAyuda} botones`);
  await entrar(BASE);
  await abrirLosDias();
  const faltas = await axe(page);
  await page.click(`.comida-del-dia__fila[data-registro="${registrada.registro}"]`);
  await page.waitForSelector('aside.detalle-del-hecho .detalle-de-valores', { timeout: 20_000 }).catch(() => {});
  await quieto(page, v);
  const faltasConDetalle = await axe(page);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('aside.detalle-del-hecho'), { timeout: 10_000 }).catch(() => {});
  comprobar('F-18', 'axe no encuentra faltas en Registros con todos los días abiertos, ni con el detalle de un registro al costado', faltas.length === 0 && faltasConDetalle.length === 0, `sin detalle: ${faltas.map((f) => f.id).join(', ') || 'sin faltas'} · con detalle: ${faltasConDetalle.map((f) => f.id).join(', ') || 'sin faltas'}`);

  // ── A 1024 px el detalle se abre encima ─────────────────────────────────────────────────────────────────────
  await page.setViewport({ width: 1024, height: 900 });
  await entrar(BASE);
  await abrirLosDias();
  await page.click(`.comida-del-dia__fila[data-registro="${registrada.registro}"]`);
  await page.waitForSelector('dialog.dialogo--panel[open] .detalle-de-valores', { timeout: 20_000 }).catch(() => {});
  await quieto(page, v);
  const angosto = await registrosEnPantalla(page);
  const desborda = !(await sinDesborde(page));
  if (angosto.panel) await clic(page, 'dialog.dialogo--panel[open] button', 'Cerrar');
  await pausa(200);
  await page.setViewport({ width: 1440, height: 900 });
  comprobar(
    'F-18',
    'A 1024 px el registro se abre encima, en un panel que retiene el foco, con el mismo título; la página no desborda de costado',
    angosto.detalle === null && (angosto.panel ?? '').includes(`${registrada.comida} · ${opcionDelDetalle}`) && (angosto.panel ?? '').includes(leido.option.label) && !desborda,
    `panel: «${(angosto.panel ?? '').slice(0, 70)}» · al costado: ${angosto.detalle ? 'sí' : 'no'}${desborda ? ' · DESBORDA' : ''}`,
  );
  comprobar('—', 'Registros de Nutrición no produjo errores de página', v.errores.length === 0, v.errores.slice(0, 3).join(' | '));
}

// ─── Entrenamiento · Registros (WP-ESCRITORIO-AREAS, parte 2) ──────────────────────────────────────────────────

/** Lo que muestra Entrenamiento · Registros: las vistas, las filas que están a la vista y el detalle. */
const sesionesEnPantalla = (page) =>
  page.evaluate(() => {
    const t = (e) => e?.innerText.replace(/\s+/g, ' ').trim() ?? null;
    const aLaVista = (e) => (e && e.getClientRects().length > 0 ? e : null);
    const tabla = (d) =>
      [...(d?.querySelectorAll('table.tabla-de-series tbody[data-ejercicio]') ?? [])].map((tb) => ({
        ejercicio: t(tb.querySelector('.tabla-de-series__ejercicio strong')),
        cabecera: t(tb.querySelector('.tabla-de-series__ejercicio')),
        series: [...tb.querySelectorAll('tr:not(.tabla-de-series__ejercicio)')].map((tr) => ({
          celdas: [...tr.children].map(t),
          conDiferencia: tr.dataset.conDiferencia === 'si',
          estado: tr.dataset.estado,
          peso: Number(getComputedStyle(tr.children[3]).fontWeight),
        })),
      }));
    const detalle = aLaVista(document.querySelector('aside.detalle-de-sesion'));
    const panel = aLaVista(document.querySelector('dialog.dialogo--panel[open]'));
    return {
      titulo: t(document.querySelector('#titulo-sesiones')),
      periodo: t(aLaVista(document.querySelector('.sesiones .periodo-del-seguimiento__boton'))),
      vistas: [...document.querySelectorAll('.sesiones .vista-de-la-linea')].filter(aLaVista).map((b) => ({
        vista: b.dataset.vista,
        cuenta: b.querySelector('.vista-de-la-linea__cuenta')?.firstChild?.textContent?.trim() ?? null,
        dice: t(b.querySelector('.vista-de-la-linea__cuenta')),
        elegida: b.getAttribute('aria-pressed'),
        nombre: [...b.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(''),
      })),
      cuenta: t(aLaVista(document.querySelector('.sesiones .registros__cuenta'))),
      columnas: [...document.querySelectorAll('.sesiones__columnas span')].map((s) => s.textContent.trim()),
      filas: [...document.querySelectorAll('.sesion-registrada')].filter(aLaVista).map((li) => {
        const f = li.querySelector('.sesion-registrada__fila');
        return {
          id: f?.dataset.sesion ?? null,
          clase: li.dataset.clase,
          dia: t(li.querySelector('.sesion-registrada__dia')),
          sesion: t(li.querySelector('.sesion-registrada__sesion')),
          series: t(li.querySelector('.sesion-registrada__series')),
          frente: t(li.querySelector('.sesion-registrada__frente')),
          esBoton: f?.tagName === 'BUTTON',
          elegida: f?.getAttribute('aria-current') === 'true',
        };
      }),
      detalle: detalle
        ? { titulo: t(detalle.querySelector('h3')), texto: t(detalle), cuando: t(detalle.querySelector('.detalle-de-sesion__cuando')), conElFoco: document.activeElement === detalle.querySelector('h3'), tabla: tabla(detalle), tiempos: t(detalle.querySelector('.detalle-de-sesion__tiempos')), mas: [...detalle.querySelectorAll('.detalle-de-sesion__mas summary')].map(t) }
        : null,
      panel: panel ? { texto: t(panel), tabla: tabla(panel) } : null,
      masSesiones: t(aLaVista(document.querySelector('.sesiones .linea__mas'))),
      vacio: t(aLaVista(document.querySelector('.sesiones .estado-vacio'))),
      falla: t(aLaVista(document.querySelector('.sesiones > .estado-de-grafico--error, .sesiones .estado-de-grafico--error'))),
      sinSesion: t(aLaVista(document.querySelector('.sesiones__sin-sesion'))),
      aAnalizar: aLaVista(document.querySelector('.sesiones__a-analizar a'))?.getAttribute('href') ?? null,
      titulos: [...document.querySelectorAll('.sesiones h2, .sesiones h3')].filter(aLaVista).map(t),
      alto: document.documentElement.scrollHeight,
    };
  });

/**
 * Entrenamiento · Registros por sesión (maqueta 25; C-66, C-67 y C-68; F-24 en adelante). Lo esperado se calcula a mano
 * con lo que devuelve la API: el contexto de revisión (las sesiones registradas), el plan de cada versión del período
 * (lo indicado de cada serie) y la lista de versiones (su número). Va dentro de `funcional`; solo, con
 * `node recorrido.mjs sesiones`.
 */
async function sesionesDeEntrenamiento(page, v) {
  const A = estado.aseId;
  const BASE = `/pro/advisees/training?id=${A}&vista=ejecuciones`;
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const num = (n) => new Intl.NumberFormat('es-AR').format(n);
  const pedidos = (fragmento, desde) => v.urls.slice(desde).filter((u) => u.startsWith('GET ') && u.includes(fragmento));
  const LISTA = '.sesiones .sesion-registrada, .sesiones .estado-vacio';
  const entrar = async (ruta) => {
    await cupo(v, 60);
    const desde = v.urls.length;
    await ir(page, ruta);
    await page.waitForSelector('#titulo-sesiones', { timeout: 30_000 }).catch(() => {});
    await quieto(page, v);
    await page.waitForSelector(LISTA, { timeout: 30_000 }).catch(() => {});
    await page.evaluate(() => window.scrollTo(0, 0));
    return desde;
  };
  /** Pide las sesiones anteriores hasta que estén todas a la vista (la lista se muestra de a quince). */
  const verTodas = async () => {
    while (await page.$('.sesiones .linea__mas button')) {
      await clic(page, '.sesiones .linea__mas button', 'Ver sesiones anteriores').catch(() => null);
      await pausa(150);
    }
  };
  const salir = async () => {
    await cupo(v, 60);
    await ir(page, `/pro/advisees/training?id=${A}&vista=resumen`);
    await page.waitForFunction(() => !document.querySelector('#titulo-sesiones'), { timeout: 30_000 }).catch(() => {});
    await quieto(page, v);
  };
  const leerLosPlanes = async (ctx) => {
    const planes = new Map();
    for (const planId of [...new Set(ctx.registeredExecutions.map((x) => x.planId))]) planes.set(planId, (await leerApi(v, `/training/plans/${planId}/detail`)).data);
    return planes;
  };

  // ── Lo esperado, a mano ─────────────────────────────────────────────────────────────────────────────────────
  const CONDICION = { COMPLETED: 'Realizada', COMPLETED_WITH_DEVIATION: 'Realizada con desvío', NOT_COMPLETED: 'No realizada' };
  const relReps = (o, r) => (!o ? 'SIN_OBJETIVO' : r === null ? 'SIN_DATO' : r < ('min' in o ? o.min : o.value) ? 'DEBAJO' : r > ('max' in o ? o.max : o.value) ? 'ENCIMA' : 'DENTRO');
  const relRir = (o, r) => (o === null ? 'SIN_OBJETIVO' : r === null ? 'SIN_DATO' : r < o ? 'DEBAJO' : r > o ? 'ENCIMA' : 'IGUAL');
  const relCarga = (o, r) => (o === null ? 'SIN_OBJETIVO' : r === null ? 'SIN_DATO' : o.unit !== r.unit ? 'OTRA_UNIDAD' : r.value < o.value ? 'DEBAJO' : r.value > o.value ? 'ENCIMA' : 'IGUAL');
  const PALABRA = { DEBAJO: 'por debajo', ENCIMA: 'por encima', SIN_DATO: 'sin dato', OTRA_UNIDAD: 'otra unidad: no se compara' };
  const cuantasSeries = (n) => `${n} ${n === 1 ? 'serie' : 'series'}`;
  const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  /** Cómo quedó una serie registrada frente a su objetivo, con las palabras que tiene que decir la tabla. */
  const frenteDeLaSerie = (planificada, objetivo, s) => {
    const reps = relReps(planificada.repetitions, s.completedRepetitions);
    const rir = relRir(objetivo?.rir ?? null, s.rir);
    const carga = relCarga(objetivo?.suggestedLoad ?? null, s.load);
    const partes = [];
    if (reps !== 'SIN_OBJETIVO' && reps !== 'DENTRO') partes.push(`Rep.: ${PALABRA[reps]}`);
    if (rir !== 'SIN_OBJETIVO' && rir !== 'IGUAL') partes.push(`RIR: ${PALABRA[rir]}`);
    // Lo de la carga va aparte, en un renglón propio de la misma celda: se dice, y no cuenta como diferencia.
    const deLaCarga = carga === 'DEBAJO' || carga === 'ENCIMA' ? `Carga: ${PALABRA[carga]} de la sugerida` : carga !== 'SIN_OBJETIVO' && carga !== 'IGUAL' ? `Carga: ${PALABRA[carga]}` : null;
    const sinObjetivo = reps === 'SIN_OBJETIVO' && rir === 'SIN_OBJETIVO' && carga === 'SIN_OBJETIVO';
    const principal = sinObjetivo ? 'Sin objetivo: no se compara' : reps === 'SIN_OBJETIVO' && rir === 'SIN_OBJETIVO' ? 'Sin objetivo de repeticiones ni de RIR' : partes.length === 0 ? 'Dentro de lo indicado' : partes.join(' · ');
    return {
      conDiferencia: ['DEBAJO', 'ENCIMA'].includes(reps) || ['DEBAJO', 'ENCIMA'].includes(rir),
      conDato: reps === 'SIN_DATO' || rir === 'SIN_DATO',
      comparada: !sinObjetivo,
      texto: [principal, deLaCarga].filter(Boolean).join(' '),
    };
  };
  /** Las sesiones del período, de la más nueva a la más vieja, con lo que tiene que decir cada fila y su tabla. */
  const esperado = (ctx, planes) => {
    const ejercicioDe = new Map();
    for (const x of ctx.registeredExecutions) for (const p of x.plannedSession.prescriptions) ejercicioDe.set(p.exerciseVersionId, p.exerciseId);
    const sesiones = ctx.registeredExecutions.map((x) => {
      const vista = x.effectiveView;
      const rige = vista.kind === 'CORRECTED' ? (x.corrections.find((c) => c.correctionId === vista.correctionId)?.correction ?? x.original) : vista.kind === 'ORIGINAL' ? x.original : null;
      const plan = planes.get(x.planId) ?? null;
      const delPlan = plan ? plan.blocks.flatMap((b) => [...b.sessions, ...b.microcycles.flatMap((m) => m.sessions)]).flatMap((s) => s.prescriptions) : null;
      const base = { id: x.executionId, planId: x.planId, fecha: x.date, ocurrio: x.occurredAt, sesion: x.plannedSession.label, condicion: rige ? CONDICION[rige.sessionCondition] : null, corregida: vista.kind === 'CORRECTED', conDesvio: !!rige && rige.sessionCondition !== 'COMPLETED', seLeyo: !!plan, sinRegistrar: 0, conDiferencias: 0, tabla: [] };
      if (!rige) return { ...base, clase: 'SIN_REGISTRO_VIGENTE', series: 'El registro vigente no se puede determinar', frente: 'No se compara' };
      if (rige.sessionCondition === 'NOT_COMPLETED') return { ...base, clase: 'NO_REALIZADA', series: 'Sin series: la sesión se registró así', frente: 'No hay series que comparar' };
      const porSerie = rige.granularity === 'SET';
      let planificadas = 0, registradas = 0, deMas = 0, sinRegistrar = 0, conDiferencias = 0, conDato = 0, comparadas = 0, otros = 0;
      const tabla = [];
      for (const p of [...x.plannedSession.prescriptions].sort((a, b) => a.order - b.order)) {
        const e = rige.exercises.find((y) => y.prescriptionId === p.prescriptionId) ?? null;
        const objetivos = delPlan ? (delPlan.find((y) => y.prescriptionId === p.prescriptionId)?.sets ?? []) : null;
        const mismo = !e || e.performedExerciseVersionId === p.exerciseVersionId || ejercicioDe.get(e.performedExerciseVersionId) === p.exerciseId;
        const numeros = [...new Set([...p.sets.map((s) => s.setIndex), ...(e?.sets ?? []).map((s) => s.setIndex)])].sort((a, b) => a - b);
        const filas = [];
        let delOtro = 0;
        for (const n of numeros) {
          const planificada = p.sets.find((s) => s.setIndex === n) ?? null;
          const s = e?.sets?.find((y) => y.setIndex === n) ?? null;
          if (planificada) planificadas += 1;
          if (!s) {
            const resumida = !!e && !e.sets;
            if (planificada && !resumida) sinRegistrar += 1;
            filas.push({ numero: n, frente: resumida ? 'No se compara serie por serie' : 'Sin registro: no se compara', conDiferencia: false, reps: null });
            continue;
          }
          if (!planificada) {
            deMas += 1;
            filas.push({ numero: n, frente: 'Adicional: no se compara', conDiferencia: false, reps: s.completedRepetitions });
            continue;
          }
          registradas += 1;
          if (!mismo) {
            delOtro += 1;
            filas.push({ numero: n, frente: null, conDiferencia: false, reps: s.completedRepetitions });
            continue;
          }
          if (!plan) {
            filas.push({ numero: n, frente: 'No se pudo leer lo indicado', conDiferencia: false, reps: s.completedRepetitions });
            continue;
          }
          const r = frenteDeLaSerie(planificada, objetivos.find((y) => y.setIndex === n)?.target ?? null, s);
          if (r.conDiferencia) conDiferencias += 1;
          if (r.conDato) conDato += 1;
          if (r.comparada) comparadas += 1;
          filas.push({ numero: n, frente: r.texto, conDiferencia: r.conDiferencia, reps: s.completedRepetitions });
        }
        if (delOtro > 0) otros += 1;
        tabla.push({ ejercicio: e?.performedExerciseName ?? p.exerciseName, registradas: filas.filter((f, i) => p.sets.some((s) => s.setIndex === f.numero) && e?.sets?.some((s) => s.setIndex === f.numero)).length, planificadas: p.sets.length, filas });
      }
      if (!porSerie) return { ...base, clase: 'RESUMIDA', series: 'Registro resumido: sin series', frente: 'No se compara serie por serie', tabla };
      const partes = [];
      if (sinRegistrar > 0) partes.push(`${cuantasSeries(sinRegistrar)} sin registrar`);
      if (!plan) partes.push('no se pudo leer lo indicado');
      else {
        if (conDiferencias > 0) partes.push(`${cuantasSeries(conDiferencias)} con diferencias`);
        if (conDato > 0) partes.push(`${cuantasSeries(conDato)} con un dato sin registrar`);
      }
      if (otros > 0) partes.push(otros === 1 ? 'un ejercicio no se compara' : `${otros} ejercicios no se comparan`);
      return {
        ...base,
        clase: 'POR_SERIE',
        sinRegistrar,
        conDiferencias: plan ? conDiferencias : null,
        series: `${registradas} de ${planificadas} ${planificadas === 1 ? 'registrada' : 'registradas'}${deMas > 0 ? ` · ${deMas} ${deMas === 1 ? 'adicional' : 'adicionales'}` : ''}`,
        frente: partes.length > 0 ? mayuscula(partes.join(' · ')) : comparadas > 0 ? 'Dentro de lo indicado' : 'Sin objetivos que comparar',
        tabla,
      };
    });
    sesiones.sort((a, b) => (a.ocurrio < b.ocurrio ? 1 : a.ocurrio > b.ocurrio ? -1 : 0));
    const sinLeer = sesiones.some((s) => s.clase === 'POR_SERIE' && !s.seLeyo);
    const cuentas = {
      TODAS: sesiones.length,
      CON_DIFERENCIAS: sinLeer ? null : sesiones.filter((s) => (s.conDiferencias ?? 0) > 0).length,
      CON_DESVIO_O_NO_REALIZADA: sesiones.filter((s) => s.conDesvio).length,
      SIN_REGISTRAR: sesiones.filter((s) => s.sinRegistrar > 0).length,
    };
    return { sesiones, cuentas };
  };
  /** Lo que tiene que decir «Sesión y condición»: el nombre, la condición y, si rige una corrección, «Corregida». */
  const sesionYCondicion = (s) => `Sesión y condición: ${[s.sesion, s.condicion, s.corregida ? 'Corregida' : null].filter(Boolean).join(' ')}`;
  const filaBien = (vista, espera) =>
    vista.id === espera.id && vista.clase === espera.clase && vista.sesion === sesionYCondicion(espera) && vista.series === `Series: ${espera.series}` && vista.frente === `Frente a lo indicado: ${espera.frente}` && vista.esBoton;
  const ORDEN = ['TODAS', 'CON_DIFERENCIAS', 'CON_DESVIO_O_NO_REALIZADA', 'SIN_REGISTRAR'];
  const cuentasBien = (vistas, cuentas) => igual(vistas.map((x) => x.vista), ORDEN) && vistas.every((x) => (cuentas[x.vista] === null ? x.cuenta === null : x.cuenta === num(cuentas[x.vista])));
  const numerosDeVersion = (lista) => new Map(lista.filter((p) => p.activatedAt).sort((a, b) => (a.activatedAt < b.activatedAt ? -1 : 1)).map((p, i) => [p.planId, i + 1]));

  // ── La entrada: el período que propone la API y sus lecturas ─────────────────────────────────────────────────
  const alEntrar = await entrar(BASE);
  const ctx = (await leerApi(v, `/advisees/${A}/training/review-context`)).data;
  const planes = await leerLosPlanes(ctx);
  const E = esperado(ctx, planes);
  const inicial = await sesionesEnPantalla(page);
  const dias = Math.round((Date.parse(`${ctx.period.end}T12:00:00Z`) - Date.parse(`${ctx.period.start}T12:00:00Z`)) / 86_400_000) + 1;
  comprobar(
    'F-24',
    'Al entrar, Registros de Entrenamiento lee el contexto de revisión, sin período (lo propone la API), y una vez el plan de cada versión que aparece en el período; el control dice el período que propuso la API',
    pedidos('/training/review-context', alEntrar).length === 1 &&
      !/periodStart/.test(pedidos('/training/review-context', alEntrar)[0]) &&
      [...planes.keys()].every((planId) => pedidos(`/training/plans/${planId}/detail`, alEntrar).length === 1) &&
      (inicial.periodo ?? '').includes(`${dias} días`),
    `contexto: ${pedidos('/training/review-context', alEntrar).length} · versiones del período: ${planes.size} · lecturas de planes: ${pedidos('/detail', alEntrar).length} · ${inicial.periodo} · la API: ${ctx.period.start} a ${ctx.period.end}`,
  );

  // Con el período de entrada puede haber muy pocas sesiones: lo demás se mira con 90 días, que tiene de todas las clases.
  const alPedir90 = await entrar(`${BASE}&p=90`);
  const ctx90 = (await leerApi(v, `/advisees/${A}/training/review-context?periodStart=${diaMenos(hoy, 89)}&periodEnd=${hoy}`)).data;
  const planes90 = await leerLosPlanes(ctx90);
  const E90 = esperado(ctx90, planes90);
  const deEntrada = await sesionesEnPantalla(page);
  const masSesiones = deEntrada.masSesiones;
  const alVerMas = v.urls.length;
  await verTodas();
  const pedidosAlVerMas = v.urls.slice(alVerMas).filter((u) => u.startsWith('GET ')).length;
  const noventa = await sesionesEnPantalla(page);
  const distintas = noventa.filas.map((f, i) => (E90.sesiones[i] && filaBien(f, E90.sesiones[i]) ? null : i)).filter((i) => i !== null);
  comprobar(
    'C-68',
    'Cada sesión registrada es una fila, de la más nueva a la más vieja: la sesión con su condición (la del registro que rige), cuántas series se registraron y cómo quedaron frente a lo indicado, calculado a mano; los nombres de las columnas están una vez; la fila entera es un botón',
    noventa.titulo === 'Sesiones registradas' &&
      pedidos('/training/review-context', alPedir90).some((u) => u.includes(`periodStart=${diaMenos(hoy, 89)}`) && u.includes(`periodEnd=${hoy}`)) &&
      igual(noventa.columnas, ['Día', 'Sesión y condición', 'Series', 'Frente a lo indicado']) &&
      noventa.filas.length === E90.sesiones.length &&
      E90.sesiones.length > 0 &&
      distintas.length === 0,
    distintas.length === 0
      ? `${noventa.filas.length} sesiones en 90 días, las ${E90.sesiones.length} esperadas · la primera: ${noventa.filas[0]?.dia} · ${noventa.filas[0]?.sesion}`
      : `${distintas.length} filas distintas; la primera: ${JSON.stringify(noventa.filas[distintas[0]])} — a mano: ${JSON.stringify({ ...E90.sesiones[distintas[0]], tabla: undefined })}`,
  );
  comprobar(
    'F-31',
    'Un período largo no se muestra entero de una vez: quince sesiones, las más nuevas, y «Ver sesiones anteriores» trae las demás sin pedirle nada a la API',
    E90.sesiones.length > 15 && deEntrada.filas.length === 15 && /Se ven 15 de/.test(masSesiones ?? '') && pedidosAlVerMas === 0 && noventa.filas.length === E90.sesiones.length,
    `${deEntrada.filas.length} al entrar, ${noventa.filas.length} después · «${masSesiones}» · pedidos a la API: ${pedidosAlVerMas}`,
  );
  const porClase = (c) => E90.sesiones.filter((s) => s.clase === c);
  const sinContar = [...porClase('NO_REALIZADA'), ...porClase('RESUMIDA')];
  comprobar(
    'F-25',
    'Una sesión registrada como no realizada, o resumida, no se cuenta serie por serie: dice por qué no tiene series y ninguna fila dice «0 de»; una serie sin registrar se cuenta aparte y no es una diferencia',
    sinContar.length > 0 &&
      sinContar.every((s) => { const f = noventa.filas.find((x) => x.id === s.id); return !!f && !/\d+ de \d+/.test(f.series) && f.series === `Series: ${s.series}`; }) &&
      !noventa.filas.some((f) => /\b0 de\b/.test(f.series)) &&
      E90.sesiones.some((s) => s.sinRegistrar > 0),
    `no realizadas: ${porClase('NO_REALIZADA').length} · resumidas: ${porClase('RESUMIDA').length} · con series sin registrar: ${E90.cuentas.SIN_REGISTRAR} · «${noventa.filas.find((x) => x.id === sinContar[0]?.id)?.series}»`,
  );

  // ── Las vistas con nombre y su cantidad ─────────────────────────────────────────────────────────────────────
  comprobar(
    'F-26',
    'Las cuatro vistas están en su orden, cada una con la cantidad de sesiones que trae, contada a mano; «Con diferencias» cuenta las sesiones con alguna serie cuyas repeticiones o cuyo RIR quedaron fuera de lo indicado (la carga no cuenta); al entrar está elegida «Todas las sesiones»',
    cuentasBien(noventa.vistas, E90.cuentas) &&
      igual(noventa.vistas.map((x) => x.nombre), ['Todas las sesiones', 'Con diferencias', 'Con desvío o no realizada', 'Con series sin registrar']) &&
      noventa.vistas.every((x) => x.elegida === (x.vista === 'TODAS' ? 'true' : 'false')) &&
      noventa.vistas[0].dice === `${num(E90.cuentas.TODAS)} ${E90.cuentas.TODAS === 1 ? 'sesión' : 'sesiones'}`,
    `${noventa.vistas.map((x) => `${x.nombre} ${x.cuenta}`).join(' · ')} — a mano: ${ORDEN.map((k) => E90.cuentas[k]).join(', ')}`,
  );
  const alElegir = v.urls.length;
  await page.click('.sesiones .vista-de-la-linea[data-vista="SIN_REGISTRAR"]').catch(() => {});
  await page.waitForFunction(() => new URL(location.href).searchParams.get('ver') === 'sin-registrar', { timeout: 10_000 }).catch(() => {});
  await pausa(300);
  await verTodas();
  const conDiferencias = await sesionesEnPantalla(page);
  await page.click('.sesiones .vista-de-la-linea[data-vista="SIN_REGISTRAR"]').catch(() => {});
  await page.waitForFunction(() => !new URL(location.href).searchParams.has('ver'), { timeout: 10_000 }).catch(() => {});
  await pausa(300);
  const deVuelta = await sesionesEnPantalla(page);
  const idsConDiferencias = E90.sesiones.filter((s) => s.sinRegistrar > 0).map((s) => s.id);
  comprobar(
    'F-26',
    'Elegir «Con series sin registrar» no le pide nada a la API, queda en la dirección (`ver=sin-registrar`) y deja a la vista las sesiones que cuenta y ninguna otra; volver a tocarla deja «Todas las sesiones»',
    v.urls.slice(alElegir).filter((u) => u.startsWith('GET ')).length === 0 &&
      idsConDiferencias.length > 0 &&
      idsConDiferencias.length < E90.sesiones.length &&
      igual(conDiferencias.filas.map((f) => f.id), idsConDiferencias) &&
      conDiferencias.vistas.find((x) => x.vista === 'SIN_REGISTRAR')?.elegida === 'true' &&
      (conDiferencias.cuenta ?? '').startsWith(`${num(idsConDiferencias.length)} de ${num(E90.cuentas.TODAS)} sesiones`) &&
      deVuelta.vistas.find((x) => x.vista === 'TODAS')?.elegida === 'true' &&
      deVuelta.filas.length === Math.min(15, E90.sesiones.length),
    `${conDiferencias.filas.length} filas (a mano: ${idsConDiferencias.length} de ${E90.sesiones.length}) · «${conDiferencias.cuenta}» · pedidos a la API: ${v.urls.slice(alElegir).filter((u) => u.startsWith('GET ')).length}`,
  );

  // ── El detalle: una tabla con cada serie una sola vez ────────────────────────────────────────────────────────
  const elegida = E90.sesiones.find((s) => s.clase === 'POR_SERIE' && (s.conDiferencias ?? 0) > 0) ?? E90.sesiones.find((s) => s.clase === 'POR_SERIE');
  const versiones = numerosDeVersion((await leerApi(v, `/advisees/${A}/training/plans`)).data);
  await cupo(v, 60);
  const alAbrir = v.urls.length;
  await page.click(`.sesion-registrada__fila[data-sesion="${elegida?.id}"]`).catch(() => {});
  await page.waitForSelector('aside.detalle-de-sesion table.tabla-de-series', { timeout: 20_000 }).catch(() => {});
  await quieto(page, v);
  const conDetalle = await sesionesEnPantalla(page);
  const tabla = conDetalle.detalle?.tabla ?? [];
  const ejecucionElegida = elegida ? (ctx90.registeredExecutions.find((x) => x.executionId === elegida.id) ?? null) : null;
  const tiemposReales = elegida ? (await leerApi(v, `/training/executions/${elegida.id}/timing`)).data : null;
  const aUnClic = [
    ...(tiemposReales?.state === 'NOT_STARTED' ? [] : ['Descansos y duración de cada serie']),
    'Ver la sesión en el plan',
    'Ver en un gráfico',
    (ejecucionElegida?.corrections.length ?? 0) > 0 ? 'Registro original y correcciones' : 'Registro original',
  ];
  const tablaBien =
    !!elegida &&
    tabla.length === elegida.tabla.length &&
    elegida.tabla.every((e, i) => {
      const t = tabla[i];
      return (
        t.ejercicio === e.ejercicio &&
        t.cabecera.includes(`${e.registradas} de ${e.planificadas} ${e.planificadas === 1 ? 'serie registrada' : 'series registradas'}`) &&
        t.series.length === e.filas.length &&
        e.filas.every((f, j) => {
          const s = t.series[j];
          return s.celdas[0] === String(f.numero) && (f.frente === null || s.celdas[3] === f.frente) && s.conDiferencia === f.conDiferencia && (f.conDiferencia ? s.peso >= 600 : s.peso < 600) && (f.reps === null || s.celdas[2].includes(`${f.reps} rep.`));
        })
      );
    });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('aside.detalle-de-sesion'), { timeout: 10_000 }).catch(() => {});
  await pausa(150);
  const focoAlCerrar = await page.evaluate(() => document.activeElement?.getAttribute('data-sesion') ?? null);
  const nombreDeLaElegida = elegida ? (/^sesi[oó]n\b/i.test(elegida.sesion) ? elegida.sesion : `Sesión ${elegida.sesion}`) : null;
  comprobar(
    'C-66',
    'Tocar una sesión abre su detalle al costado, sin tapar la lista: el título recibe el foco; la tabla tiene cada serie una sola vez, por ejercicio, con «N de M series registradas» y, de cada serie, cómo quedó frente a lo indicado (calculado a mano); la serie con una diferencia va en negrita y además lo dice; Escape lo cierra y el foco vuelve a la fila',
    !!elegida &&
      conDetalle.detalle?.titulo === nombreDeLaElegida &&
      conDetalle.detalle.conElFoco &&
      tablaBien &&
      tabla.flatMap((t) => t.series).length === elegida.tabla.flatMap((e) => e.filas).length &&
      conDetalle.filas.length === Math.min(15, E90.sesiones.length) &&
      conDetalle.filas.some((f) => f.elegida && f.id === elegida.id) &&
      conDetalle.panel === null &&
      parametros(page).get('sesion') === null &&
      focoAlCerrar === elegida.id,
    `«${conDetalle.detalle?.titulo}» · ${tabla.length} ejercicios, ${tabla.flatMap((t) => t.series).length} series (a mano: ${elegida?.tabla.flatMap((e) => e.filas).length}) · con diferencia: ${tabla.flatMap((t) => t.series).filter((s) => s.conDiferencia).map((s) => s.celdas[3]).join(' | ') || 'ninguna'} · foco en el título: ${conDetalle.detalle?.conElFoco} · al cerrar, en la fila: ${focoAlCerrar === elegida?.id}`,
  );
  comprobar(
    'F-27',
    'El detalle dice cuándo ocurrió, cuándo se registró y frente a qué versión del plan (su número de orden de activación, calculado a mano); lee una vez los tiempos de esa sesión y no vuelve a leer el plan; lo demás de la sesión está a un clic (sin tiempos marcados, lo dice y no ofrece abrir descansos que no hay)',
    !!elegida &&
      (conDetalle.detalle?.cuando ?? '').includes(`frente al plan versión ${versiones.get(elegida.planId)}, el de ese día`) &&
      /^Ocurrió el /.test(conDetalle.detalle?.cuando ?? '') &&
      pedidos(`/training/executions/${elegida.id}/timing`, alAbrir).length === 1 &&
      pedidos('/detail', alAbrir).length === 0 &&
      igual(conDetalle.detalle?.mas, aUnClic) &&
      /Tiempos de la sesión/.test(conDetalle.detalle?.tiempos ?? '') &&
      (tiemposReales?.state !== 'NOT_STARTED' || /no tiene tiempos marcados/.test(conDetalle.detalle?.tiempos ?? '')),
    `«${conDetalle.detalle?.cuando}» · versión a mano: ${versiones.get(elegida?.planId)} · lecturas de tiempos: ${pedidos('/timing', alAbrir).length} · a un clic: ${(conDetalle.detalle?.mas ?? []).join(' | ')} · ${(conDetalle.detalle?.tiempos ?? '').slice(0, 90)}`,
  );

  // ── La evolución de un ejercicio queda en Analizar; los días sin sesión ──────────────────────────────────────
  comprobar(
    'C-67',
    'La evolución de un ejercicio ya no está en la sección: no hay un bloque «Planificado y registrado» ni un gráfico al entrar, y sí un enlace a Analizar, de la aplicación, con la pregunta del ejercicio y el período que se está mirando',
    !noventa.titulos.some((t) => /Planificado y registrado|Evolución de un ejercicio/.test(t)) &&
      igual(noventa.titulos, ['Sesiones registradas']) &&
      (noventa.aAnalizar ?? '').startsWith(`/pro/advisees?id=${A}&vista=analizar&pregunta=progreso-de-un-ejercicio`) &&
      (noventa.aAnalizar ?? '').endsWith('&p=90'),
    `títulos de la sección: ${noventa.titulos.join(' | ')} · enlace: ${noventa.aAnalizar}`,
  );
  const sinSesion = ctx90.missingData.length;
  await clic(page, '.sesiones__sin-sesion button', 'Ver los días').catch(() => null);
  await pausa(200);
  const conLosDias = await texto(page, '.sesiones__sin-sesion');
  comprobar(
    'F-25',
    'Los días del período sin ninguna sesión registrada se dicen con su cantidad (la que da la API) y como falta de dato, no como sesiones que faltaron; «Ver los días» los lista',
    sinSesion > 0 &&
      (noventa.sinSesion ?? '').startsWith(`${num(sinSesion)} días del período sin sesión registrada.`) &&
      /no hay dato/.test(noventa.sinSesion ?? '') &&
      conLosDias.split(' · ').length >= sinSesion,
    `«${(noventa.sinSesion ?? '').slice(0, 120)}» · la API: ${sinSesion} días`,
  );

  // ── «Más filtros», «Actualizar» y lo que vive en la dirección ────────────────────────────────────────────────
  const versionConSesiones = [...new Set(E90.sesiones.map((s) => s.planId))].find((planId) => E90.sesiones.some((s) => s.planId !== planId)) ?? null;
  if (versionConSesiones) {
    const deLaVersion = E90.sesiones.filter((s) => s.planId === versionConSesiones);
    const cuentasDeLaVersion = {
      TODAS: deLaVersion.length,
      CON_DIFERENCIAS: deLaVersion.filter((s) => (s.conDiferencias ?? 0) > 0).length,
      CON_DESVIO_O_NO_REALIZADA: deLaVersion.filter((s) => s.conDesvio).length,
      SIN_REGISTRAR: deLaVersion.filter((s) => s.sinRegistrar > 0).length,
    };
    await entrar(`${BASE}&p=90&version=${versionConSesiones}`);
    await verTodas();
    const filtrada = await sesionesEnPantalla(page);
    // Para «Actualizar», una vista que en esa versión traiga alguna sesión y no todas: si no, no se sabría si se conservó.
    const PARAMETRO = { CON_DIFERENCIAS: 'con-diferencias', CON_DESVIO_O_NO_REALIZADA: 'con-desvio', SIN_REGISTRAR: 'sin-registrar' };
    const conVista = Object.keys(PARAMETRO).find((k) => cuentasDeLaVersion[k] > 0 && cuentasDeLaVersion[k] < deLaVersion.length) ?? Object.keys(PARAMETRO).find((k) => cuentasDeLaVersion[k] > 0) ?? 'CON_DIFERENCIAS';
    const enLaVista = (s) => (conVista === 'CON_DIFERENCIAS' ? (s.conDiferencias ?? 0) > 0 : conVista === 'SIN_REGISTRAR' ? s.sinRegistrar > 0 : s.conDesvio);
    const esperadas = deLaVersion.filter(enLaVista).map((s) => s.id);
    await entrar(`${BASE}&p=90&version=${versionConSesiones}&ver=${PARAMETRO[conVista]}`);
    await cupo(v, 60);
    const alActualizar = v.urls.length;
    await clic(page, 'header.marco-del-area .ficha__consulta button', 'Actualizar').catch(() => null);
    await quieto(page, v);
    await page.waitForSelector(LISTA, { timeout: 30_000 }).catch(() => {});
    await verTodas();
    const trasActualizar = await sesionesEnPantalla(page);
    comprobar(
      'F-28',
      'El período, la vista y el filtro por versión del plan viven en la dirección: con una versión elegida se ven solo sus sesiones, las cantidades de las cuatro vistas son las de esa versión (a mano) y la pantalla dice que hay un filtro puesto; «Actualizar» vuelve a leer y conserva el período, la versión y la vista',
      deLaVersion.length > 0 &&
        deLaVersion.length < E90.sesiones.length &&
        igual(filtrada.filas.map((f) => f.id), deLaVersion.map((s) => s.id)) &&
        cuentasBien(filtrada.vistas, cuentasDeLaVersion) &&
        /con un filtro de «Más filtros»/.test(filtrada.cuenta ?? '') &&
        esperadas.length > 0 &&
        pedidos('/training/review-context', alActualizar).length === 1 &&
        parametros(page).get('p') === '90' &&
        parametros(page).get('version') === versionConSesiones &&
        parametros(page).get('ver') === PARAMETRO[conVista] &&
        igual(trasActualizar.filas.map((f) => f.id), esperadas),
      `de esa versión: ${filtrada.filas.length} sesiones (a mano: ${deLaVersion.length} de ${E90.sesiones.length}) · ${filtrada.vistas.map((x) => `${x.nombre} ${x.cuenta}`).join(' · ')} — a mano: ${ORDEN.map((k) => cuentasDeLaVersion[k]).join(', ')} · «${filtrada.cuenta}» · tras «Actualizar», con «${PARAMETRO[conVista]}»: ${trasActualizar.filas.length} (a mano: ${esperadas.length})`,
    );
  } else {
    informar('F-28', 'El filtro por versión del plan', 'las sesiones de los últimos 90 días son todas de una misma versión: no se pudo mirar');
  }

  // ── Los tiempos de una sesión, con una respuesta armada por el recorrido ─────────────────────────────────────
  // El escenario no tiene ninguna sesión con tiempos marcados. Se entrega, para esta sesión, una respuesta que cumple el
  // contrato de API-TIE-03: lo que se mira es la pantalla, no el cálculo de los tiempos (que tiene sus pruebas).
  if (ejecucionElegida) {
    const p1 = ejecucionElegida.plannedSession.prescriptions[0];
    const instante = (segundos) => new Date(Date.parse(ejecucionElegida.occurredAt) + segundos * 1000).toISOString();
    const conTiempos = {
      coincide: (u) => u.includes(`/training/executions/${elegida.id}/timing`),
      accion: 'entregar',
      cuerpo: {
        data: {
          ...tiemposReales,
          state: 'FINISHED',
          startedAt: instante(0),
          finishedAt: instante(3260),
          session: { elapsed: { ms: 3_260_000, quality: 'MEASURED' }, pauses: { ms: 190_000, quality: 'MEASURED' }, withoutPauses: { ms: 3_070_000, quality: 'ESTIMATED' } },
          exercises: [{ prescriptionId: p1.prescriptionId, duration: { ms: 905_000, quality: 'MEASURED' } }],
          unassigned: { ms: 65_000, quality: 'MEASURED' },
          // El primer descanso, medido. El segundo quedó abierto (la app se cerró en el medio): no tiene fin ni duración.
          rests: [
            { restId: 'descanso-del-recorrido-1', prescriptionId: p1.prescriptionId, setIndex: 1, startedAt: instante(60), finishedAt: instante(165), duration: { ms: 105_000, quality: 'MEASURED' }, recommendedSeconds: 90, differenceMs: 15_000 },
            { restId: 'descanso-del-recorrido-2', prescriptionId: p1.prescriptionId, setIndex: 2, startedAt: instante(230), finishedAt: null, duration: { ms: null, quality: 'INCOMPLETE' }, recommendedSeconds: 90, differenceMs: null },
          ],
          timedSets: [{ timingId: 'serie-del-recorrido-1', prescriptionId: p1.prescriptionId, setIndex: 1, startedAt: instante(10), finishedAt: instante(50), duration: { ms: 40_000, quality: 'MEASURED' } }],
        },
      },
    };
    await salir();
    v.reglas.push(conTiempos);
    await entrar(`${BASE}&p=90&sesion=${elegida.id}`);
    await page.waitForSelector('aside.detalle-de-sesion .datos-de-tiempo', { timeout: 20_000 }).catch(() => {});
    await quieto(page, v);
    await clic(page, 'aside.detalle-de-sesion .detalle-de-sesion__mas summary', 'Descansos y duración de cada serie').catch(() => null);
    await pausa(300);
    const tiemposEnPantalla = await page.evaluate(() => {
      const t = (e) => e?.innerText.replace(/\s+/g, ' ').trim() ?? null;
      const d = document.querySelector('aside.detalle-de-sesion');
      const abierto = [...(d?.querySelectorAll('.detalle-de-sesion__mas details[open]') ?? [])].find((x) => /Descansos y duración/.test(x.querySelector('summary')?.innerText ?? ''));
      const cuerpo = abierto?.querySelector('tbody');
      return {
        renglon: t(d?.querySelector('.detalle-de-sesion__tiempos')),
        ejercicio: t(cuerpo?.querySelector('.tabla-de-series__ejercicio')),
        series: [...(cuerpo?.querySelectorAll('tr:not(.tabla-de-series__ejercicio)') ?? [])].map((tr) => [...tr.children].map(t)),
        resto: t(abierto),
      };
    });
    // La única captura de los tiempos en pantalla: sale de esta respuesta armada, y se llama así para que no se confunda.
    await captura(page, v, 'sesion-con-tiempos-simulados-1440-azul-noche');
    v.reglas.splice(v.reglas.indexOf(conTiempos), 1);
    const primera = tiemposEnPantalla.series[0] ?? [];
    const segunda = tiemposEnPantalla.series[1] ?? [];
    const tercera = tiemposEnPantalla.series[2] ?? [];
    comprobar(
      'F-27',
      'Con tiempos marcados (una respuesta armada por el recorrido: el escenario no tiene ninguna sesión con tiempos), el detalle dice los tres tiempos de la sesión, cada uno con su certeza, y «Descansos y duración de cada serie» abre en el lugar el descanso de cada serie frente al recomendado, su duración y el tiempo de cada ejercicio; un descanso que quedó abierto dice «Incompleto» (no se completa con otra hora) y una serie sin descanso marcado lo dice con palabras',
      /Tiempo transcurrido 54:20 · medido/.test(tiemposEnPantalla.renglon ?? '') &&
        /Pausas 03:10 · medido/.test(tiemposEnPantalla.renglon ?? '') &&
        /Sin pausas 51:10 · estimado/.test(tiemposEnPantalla.renglon ?? '') &&
        (tiemposEnPantalla.ejercicio ?? '').includes('15:05 · medido') &&
        igual(primera, ['1', '01:45 registrado · 01:30 recomendado · +00:15', 'Duración medida 00:40']) &&
        segunda[1] === 'Incompleto · 01:30 recomendado' &&
        tercera[1] === 'Sin descanso marcado' &&
        /Sin ejercicio asignado: 01:05 · medido/.test(tiemposEnPantalla.resto ?? '') &&
        !tiemposEnPantalla.series.flat().includes('—'),
      `«${(tiemposEnPantalla.renglon ?? '').slice(0, 110)}» · la serie 1: ${primera.join(' | ') || 'sin tabla'} · la serie 2: ${segunda.join(' | ')} · la serie 3: ${tercera.join(' | ')} · ${(tiemposEnPantalla.ejercicio ?? '').slice(0, 60)}`,
    );

    // ── Lo que quedó a un clic se abre: la sesión en el plan, el gráfico por serie y el registro original ─────────
    await entrar(`${BASE}&p=90&sesion=${elegida.id}`);
    await page.waitForSelector('aside.detalle-de-sesion table.tabla-de-series', { timeout: 20_000 }).catch(() => {});
    await quieto(page, v);
    const abrirEnElLugar = async (titulo) => {
      await clic(page, 'aside.detalle-de-sesion .detalle-de-sesion__mas summary', titulo).catch(() => null);
      await pausa(400);
      return page.evaluate((x) => {
        const d = [...document.querySelectorAll('aside.detalle-de-sesion .detalle-de-sesion__mas details[open]')].find((y) => (y.querySelector('summary')?.innerText ?? '').includes(x));
        return d ? { texto: d.innerText.replace(/\s+/g, ' ').trim(), graficos: d.querySelectorAll('svg.recharts-surface, table').length } : null;
      }, titulo);
    };
    const enElPlan = await abrirEnElLugar('Ver la sesión en el plan');
    const elOriginal = await abrirEnElLugar('Registro original');
    await clic(page, 'aside.detalle-de-sesion .detalle-de-sesion__mas summary', 'Ver en un gráfico').catch(() => null);
    await page.waitForSelector('aside.detalle-de-sesion .detalle-de-sesion__mas details[open] svg.recharts-surface', { timeout: 30_000 }).catch(() => {});
    await quieto(page, v);
    const elGrafico = await page.evaluate(() => document.querySelectorAll('aside.detalle-de-sesion .detalle-de-sesion__mas details[open] svg.recharts-surface').length);
    comprobar(
      'F-32',
      'Nada de lo que se veía se quitó, está a un clic y se abre en el lugar: «Ver la sesión en el plan» muestra cada ejercicio indicado ese día; «Registro original», lo que registró la persona, con su condición; y «Ver en un gráfico», el gráfico por serie',
      !!enElPlan &&
        ejecucionElegida.plannedSession.prescriptions.every((p) => enElPlan.texto.includes(p.exerciseName)) &&
        !!elOriginal &&
        /Registrado el /.test(elOriginal.texto) &&
        elOriginal.texto.includes(CONDICION[ejecucionElegida.original.sessionCondition]) &&
        elGrafico >= 1,
      `en el plan: ${ejecucionElegida.plannedSession.prescriptions.map((p) => p.exerciseName).join(', ')} · el original: «${(elOriginal?.texto ?? '').slice(0, 90)}» · gráficos: ${elGrafico}`,
    );
  }

  // ── Si no se puede leer lo indicado, las sesiones se ven igual y lo dicen ────────────────────────────────────
  const sinPlanes = { coincide: (u) => /\/training\/plans\/[^/]+\/detail/.test(u), accion: 'responder', status: 503, codigo: 'SERVICE_UNAVAILABLE' };
  await salir();
  v.reglas.push(sinPlanes);
  await entrar(`${BASE}&p=90`);
  await verTodas();
  const conFalla = await sesionesEnPantalla(page);
  v.reglas.splice(v.reglas.indexOf(sinPlanes), 1);
  const ESinPlanes = esperado(ctx90, new Map());
  await cupo(v, 60);
  if (conFalla.falla) await clic(page, '.sesiones .estado-de-grafico--error button', 'Reintentar').catch(() => null);
  await quieto(page, v);
  await page.waitForFunction(() => !document.querySelector('.sesiones .estado-de-grafico--error'), { timeout: 30_000 }).catch(() => {});
  const repuesto = await sesionesEnPantalla(page);
  comprobar(
    'F-29',
    'Si el plan de una versión no se puede leer (un 503 simulado), las sesiones siguen a la vista con lo registrado; un bloque lo dice, con «Reintentar»; cada sesión registrada serie por serie dice «No se pudo leer lo indicado» y ninguna dice «Dentro de lo indicado»; «Con diferencias» no lleva número (no un cero) y las otras vistas sí. «Reintentar» trae lo que faltaba',
    /No pudimos leer lo indicado/.test(conFalla.falla ?? '') &&
      conFalla.filas.length === ESinPlanes.sesiones.length &&
      conFalla.filas.every((f, i) => filaBien(f, ESinPlanes.sesiones[i])) &&
      ESinPlanes.sesiones.some((s) => /no se pudo leer lo indicado/i.test(s.frente)) &&
      !conFalla.filas.some((f) => /Dentro de lo indicado/.test(f.frente)) &&
      cuentasBien(conFalla.vistas, ESinPlanes.cuentas) &&
      ESinPlanes.cuentas.CON_DIFERENCIAS === null &&
      repuesto.falla === null &&
      cuentasBien(repuesto.vistas, E90.cuentas),
    `«${(conFalla.falla ?? '').slice(0, 110)}» · ${conFalla.vistas.map((x) => `${x.nombre} ${x.cuenta ?? 'sin número'}`).join(' · ')} · después: ${repuesto.vistas.map((x) => x.cuenta).join(', ')}`,
  );

  // ── «Actualizar» con una sesión abierta, la ayuda, la primera pantalla y axe ──────────────────────────────────
  await entrar(`${BASE}&p=90&sesion=${elegida?.id}`);
  await page.waitForSelector('aside.detalle-de-sesion table.tabla-de-series', { timeout: 20_000 }).catch(() => {});
  await quieto(page, v);
  await page.evaluate(() => {
    window.__panelDeEncima = 0;
    window.__vigiaDelPanel?.disconnect();
    window.__vigiaDelPanel = new MutationObserver(() => {
      if (document.querySelector('dialog.dialogo--panel[open]')) window.__panelDeEncima += 1;
    });
    window.__vigiaDelPanel.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] });
  });
  await cupo(v, 60);
  await clic(page, 'header.marco-del-area .ficha__consulta button', 'Actualizar').catch(() => null);
  await quieto(page, v);
  await page.waitForSelector('aside.detalle-de-sesion table.tabla-de-series', { timeout: 30_000 }).catch(() => {});
  await quieto(page, v);
  const panelDeEncima = await page.evaluate(() => {
    window.__vigiaDelPanel?.disconnect();
    return window.__panelDeEncima ?? -1;
  });
  const trasActualizarLaSesion = await sesionesEnPantalla(page);
  const medida = await page.evaluate(() => {
    const abajo = (s) => {
      const e = [...document.querySelectorAll(s)].pop();
      return e ? Math.round(e.getBoundingClientRect().bottom + scrollY) : null;
    };
    const d = document.querySelector('aside.detalle-de-sesion');
    return { alto: document.documentElement.scrollHeight, vistas: abajo('.sesiones .registros__vistas'), columnas: abajo('.sesiones__columnas'), lista: abajo('.sesiones__filas'), detalleAncho: d ? Math.round(d.getBoundingClientRect().width) : null, listaAncho: Math.round(document.querySelector('.sesiones__filas')?.getBoundingClientRect().width ?? 0) };
  });
  comprobar(
    'F-28',
    'La sesión abierta vive en la dirección: se abre al entrar con ella, y «Actualizar» la deja abierta al costado sin pasar por el panel de encima ni por un instante',
    trasActualizarLaSesion.detalle?.titulo === nombreDeLaElegida && parametros(page).get('sesion') === elegida?.id && panelDeEncima === 0 && trasActualizarLaSesion.panel === null,
    `«${trasActualizarLaSesion.detalle?.titulo}» · veces que el panel de encima estuvo abierto: ${panelDeEncima}`,
  );
  informar('F-30', 'Registros de Entrenamiento con 90 días y una sesión abierta, a 1440 × 900', `${medida.alto} px · las vistas terminan a los ${medida.vistas} px, los nombres de las columnas a los ${medida.columnas} y la lista de ${trasActualizarLaSesion.filas.length} sesiones (de ${E90.sesiones.length}), a los ${medida.lista} · la lista mide ${medida.listaAncho} px de ancho y el detalle, ${medida.detalleAncho}`);
  comprobar(
    'F-30',
    'A 1440 × 900, con una sesión abierta, las vistas y los nombres de las columnas entran en la primera pantalla, y la lista conserva al menos 600 px de ancho al lado del detalle: no se aprieta hasta partir cada dato en varios renglones',
    medida.columnas !== null && medida.columnas <= 900 && medida.listaAncho >= 600 && (medida.detalleAncho ?? 0) >= 500,
    `la lista: ${medida.listaAncho} px · el detalle: ${medida.detalleAncho} px`,
  );
  const tapasAlCostado = await tapasDeLaSuperficie(page, 'aside.detalle-de-sesion');
  const faltasConDetalle = await axe(page);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('aside.detalle-de-sesion'), { timeout: 10_000 }).catch(() => {});
  const faltas = await axe(page);
  await clic(page, 'header.marco-del-area .como-se-lee__boton', 'Cómo se lee esta vista').catch(() => null);
  await page.waitForSelector('dialog.como-se-lee[open]', { timeout: 10_000 }).catch(() => {});
  const ayuda = await page.evaluate(() => {
    const d = document.querySelector('dialog.como-se-lee[open]');
    if (!d) return { titulo: null, renglones: 0, vistas: [], foco: false };
    return { titulo: d.querySelector('h2').innerText.trim(), renglones: d.querySelectorAll('.como-se-lee__lista > li').length, vistas: [...d.querySelectorAll('.como-se-lee__fuentes [data-vista]')].map((x) => x.dataset.vista), foco: document.activeElement === d.querySelector('h2') };
  });
  const faltasDeLaAyuda = await axe(page);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog.como-se-lee[open]'), { timeout: 10_000 }).catch(() => {});
  comprobar(
    'F-14',
    'Registros de Entrenamiento tiene su ayuda en el marco del área: se abre por el título, explica cada cosa y dice qué trae cada una de las cuatro vistas; Entrenamiento · Resumen, que no tiene ayuda, no muestra el botón',
    ayuda.titulo === 'Cómo se leen los Registros' && ayuda.renglones >= 10 && igual(ayuda.vistas, ORDEN) && ayuda.foco && faltasDeLaAyuda.length === 0,
    `«${ayuda.titulo}» · ${ayuda.renglones} renglones · ${ayuda.vistas.length} vistas · axe: ${faltasDeLaAyuda.length === 0 ? 'sin faltas' : faltasDeLaAyuda.map((f) => f.id).join(', ')}`,
  );
  comprobar('F-27', 'axe no encuentra faltas en Registros de Entrenamiento, ni con el detalle de una sesión al costado', faltas.length === 0 && faltasConDetalle.length === 0, `sin detalle: ${faltas.map((f) => f.id).join(', ') || 'sin faltas'} · con detalle: ${faltasConDetalle.map((f) => f.id).join(', ') || 'sin faltas'}`);
  await salir();
  const sinAyuda = await page.evaluate(() => document.querySelectorAll('header.marco-del-area .como-se-lee__boton').length);
  comprobar('F-14', 'En Entrenamiento · Resumen el marco no muestra el botón de la ayuda (la misma consulta lo encuentra en Registros)', sinAyuda === 0, `${sinAyuda} botones`);

  // ── A 1024 px el detalle se abre encima ─────────────────────────────────────────────────────────────────────
  await page.setViewport({ width: 1024, height: 900 });
  await entrar(`${BASE}&p=90`);
  await page.click(`.sesion-registrada__fila[data-sesion="${elegida?.id}"]`).catch(() => {});
  await page.waitForSelector('dialog.dialogo--panel[open] table.tabla-de-series', { timeout: 20_000 }).catch(() => {});
  await quieto(page, v);
  const angosto = await sesionesEnPantalla(page);
  const desborda = !(await sinDesborde(page));
  const tapasDelPanel = await tapasDeLaSuperficie(page, 'dialog.dialogo--panel[open]');
  if (angosto.panel) await clic(page, 'dialog.dialogo--panel[open] button', 'Cerrar').catch(() => null);
  await pausa(200);
  await page.setViewport({ width: 1440, height: 900 });
  comprobar(
    'C-66',
    'A 1024 px el detalle de la sesión se abre encima, en un panel que retiene el foco, con la misma tabla; la página no desborda de costado',
    angosto.detalle === null && (angosto.panel?.texto ?? '').includes(nombreDeLaElegida ?? '···') && (angosto.panel?.tabla.length ?? 0) === (elegida?.tabla.length ?? -1) && !desborda,
    `panel: «${(angosto.panel?.texto ?? '').slice(0, 60)}» · ejercicios en la tabla: ${angosto.panel?.tabla.length ?? 0} · al costado: ${angosto.detalle ? 'sí' : 'no'}${desborda ? ' · DESBORDA' : ''}`,
  );
  comprobar(
    'C-66',
    'La tabla de las series no lleva una franja a los costados, ni al costado ni en el panel de encima: las «tapas» de lo que se desplaza tienen el color de la superficie donde está, no el del fondo de la página',
    tapasBien(tapasAlCostado) && tapasBien(tapasDelPanel),
    `al costado — ${tapasEnPalabras(tapasAlCostado)} · en el panel — ${tapasEnPalabras(tapasDelPanel)}`,
  );

  // ── A 1280 px, con una sesión abierta, la lista queda angosta: ningún dato se sale de su columna ──────────────
  // La marca más ancha de una fila es «Realizada con desvío»: se abre esa sesión, en la vista que la trae.
  const conDesvioE = E90.sesiones.find((s) => s.condicion === CONDICION.COMPLETED_WITH_DEVIATION) ?? null;
  if (conDesvioE) {
    await page.setViewport({ width: 1280, height: 900 });
    await entrar(`${BASE}&p=90&ver=con-desvio&sesion=${conDesvioE.id}`);
    await page.waitForSelector('aside.detalle-de-sesion', { timeout: 20_000 }).catch(() => {});
    await quieto(page, v);
    const angosta = await page.evaluate(() => {
      const t = (e) => e.innerText.replace(/\s+/g, ' ').trim();
      const celdas = [...document.querySelectorAll('.sesion-registrada__fila > span')];
      // Un dato está fuera de su columna si su borde derecho pasa el de la celda que lo contiene.
      const fuera = celdas.flatMap((c) => [...c.children].filter((x) => x.getBoundingClientRect().right > c.getBoundingClientRect().right + 1).map(t));
      // Las partes de un dato de la tabla («77,5 kg ·», «6 rep. ·», «RIR 1»): una parte partida ocupa más de un renglón.
      const partidas = () => {
        const partes = [...document.querySelectorAll('aside.detalle-de-sesion .tabla-de-series--frente-a-lo-indicado .parte-de-dato')];
        const altos = partes.map((p) => p.getBoundingClientRect().height);
        const unRenglon = Math.min(...altos);
        return { partes: partes.length, partidas: partes.filter((p, i) => altos[i] > unRenglon + 3).map(t) };
      };
      const conLaRegla = partidas();
      // La misma medida sin la regla que mantiene entera cada parte, quitada en el navegador: dice si la medida ve algo.
      const estilo = document.createElement('style');
      estilo.textContent = '.parte-de-dato { display: inline !important; }';
      document.head.append(estilo);
      const sinLaRegla = partidas();
      estilo.remove();
      return {
        celdas: celdas.length,
        fuera,
        marcas: [...document.querySelectorAll('.sesion-registrada__fila .etiqueta-de-dato')].map(t),
        lista: Math.round(document.querySelector('.sesiones__filas')?.getBoundingClientRect().width ?? 0),
        alCostado: !!document.querySelector('aside.detalle-de-sesion'),
        conLaRegla,
        sinLaRegla,
        // Las frases de dos partes de la lista, tal como están en la página (sin normalizar los espacios).
        frases: [...document.querySelectorAll('.sesion-registrada__frente')].map((c) => c.lastChild?.textContent ?? '').filter((x) => x.includes('·')),
      };
    });
    await page.setViewport({ width: 1440, height: 900 });
    comprobar(
      'F-30',
      'A 1280 px, con una sesión abierta al costado, la lista queda angosta y ningún dato se sale de su columna: la marca «Realizada con desvío» parte su texto adentro, sin pisar la columna de las series',
      angosta.alCostado && angosta.marcas.includes(CONDICION.COMPLETED_WITH_DEVIATION) && angosta.fuera.length === 0,
      `la lista: ${angosta.lista} px · ${angosta.celdas} datos · marcas: ${angosta.marcas.join(', ') || 'ninguna'} · fuera de su columna: ${angosta.fuera.join(' | ') || 'ninguno'}`,
    );
    comprobar(
      'F-30',
      'A 1280 px, en la tabla del detalle, lo que no entra en un renglón baja de a una parte entera: ninguna parte de un dato («RIR 1», «6 rep.») queda partida entre dos renglones',
      angosta.conLaRegla.partes > 0 && angosta.conLaRegla.partidas.length === 0,
      `${angosta.conLaRegla.partes} partes · partidas: ${angosta.conLaRegla.partidas.join(' | ') || 'ninguna'} · sin la regla (quitada en el navegador, para probar la medida): ${angosta.sinLaRegla.partidas.length} partidas${angosta.sinLaRegla.partidas.length > 0 ? `, la primera «${angosta.sinLaRegla.partidas[0]}»` : ''}`,
    );
    // En la lista las partes son frases y corren como cualquier texto; lo que no se parte es el espacio entre el número
    // y lo que cuenta, y el que va antes del separador (U+00A0). Con espacios comunes quedaba «… · 1» y, abajo, «serie».
    const NBSP = ' ';
    const fraseBien = (x) => x.split(`${NBSP}· `).length >= 2 && !x.includes(' · ') && x.split(`${NBSP}· `).every((parte) => !/^\d+ /.test(parte));
    comprobar(
      'F-30',
      'En la fila de una sesión, una frase de dos partes («1 serie con diferencias · un ejercicio no se compara») no deja el número separado de lo que cuenta ni el separador al principio de un renglón: esos dos espacios no se parten, y el texto que se lee no cambia',
      angosta.frases.length > 0 && angosta.frases.every(fraseBien),
      `${angosta.frases.length} frases de dos partes · la primera: «${(angosta.frases[0] ?? '').replaceAll(NBSP, '⍽')}» (⍽ es el espacio que no se parte)`,
    );
  } else {
    informar('F-30', 'Una sesión «Realizada con desvío», a 1280 px', 'el escenario no tiene ninguna en los últimos 90 días: no se pudo mirar');
  }
  comprobar('—', 'Registros de Entrenamiento no produjo errores de página', v.errores.length === 0, v.errores.slice(0, 3).join(' | '));
}

// ─── Nutrición · Registros: la estimación del profesional (WP-ESCRITORIO-AREAS, parte 1) ──────────────────────────

/**
 * La estimación del profesional sobre una comida diferente (NUT-12; C-50), que se agrega desde el detalle del registro.
 * **Escribe en el escenario:** le suma una estimación a una comida diferente. Por eso no va dentro de `funcional`: corre
 * sola (`node recorrido.mjs estimacion`) y última en la pasada completa, para que ningún otro recorrido lea lo que deja.
 * Una de las comprobaciones mira una falla simulada por el recorrido (un 503 al guardar), y lo dice. Lo esperado sale de
 * lo que devuelve la API antes y después de escribir.
 */
async function estimacionDeUnaComida(page, v) {
  const A = estado.aseId;
  const DESCRIPCION = 'Milanesa de carne al horno con ensalada';
  const GRAMOS = '250';
  const desde = diaMenos(hoy, 89);
  const leerElContexto = async () => (await leerApi(v, `/advisees/${A}/nutrition/review-context?periodStart=${desde}&periodEnd=${hoy}`)).data;
  const ingestaDe = (ctx, id) => ctx.registeredIntakes.find((i) => i.executionId === id) ?? null;
  const antes = await leerElContexto();
  const fuera = antes.descriptiveContrast.days.flatMap((d) => d.outsidePrescription.map((o) => ({ ...o, fecha: d.date }))).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  // Las filas que tiene que traer la vista «Comida diferente», a mano: una por comida del plan con alguna, y las sueltas.
  const filasDeLaVista = antes.descriptiveContrast.days.reduce((n, d) => {
    const enUnaComida = new Set(d.meals.flatMap((m) => m.differentMealExecutionIds));
    return n + d.meals.filter((m) => m.differentMealExecutionIds.length > 0).length + d.outsidePrescription.filter((o) => !enUnaComida.has(o.executionId)).length;
  }, 0);
  // La comida diferente más nueva que todavía no tiene una estimación; si todas tienen, la más nueva.
  const elegida = fuera.find((o) => (ingestaDe(antes, o.executionId)?.corrections.length ?? 0) === 0) ?? fuera[0] ?? null;
  if (!elegida || !ingestaDe(antes, elegida.executionId)) {
    informar('C-50', 'La estimación del profesional sobre una comida diferente', 'el escenario no tiene una comida diferente en los últimos 90 días: no se pudo mirar');
    return;
  }
  const id = elegida.executionId;
  const habia = ingestaDe(antes, id).corrections.length;
  const POSTS = (desdeDonde) => v.urls.slice(desdeDonde).filter((u) => u.startsWith('POST ') && u.includes(`/nutrition/executions/${id}/corrections`));
  const ESTIMACION = 'aside.detalle-del-hecho .estimacion-del-profesional';
  const CAMPO = (sufijo) => `${ESTIMACION} input[id="est-${id}-${sufijo}"]`;
  const leer = () =>
    page.evaluate(
      (estimacionS, registro) => {
        const t = (e) => e?.innerText.replace(/\s+/g, ' ').trim() ?? null;
        const d = document.querySelector('aside.detalle-del-hecho');
        const e = document.querySelector(estimacionS);
        const valor = (sufijo) => e?.querySelector(`input[id$="-${sufijo}"]`)?.value ?? null;
        return {
          titulo: t(d?.querySelector('h3')),
          texto: t(d) ?? '',
          rasgos: [...(d?.querySelectorAll('.datos-del-hecho__rasgos .etiqueta-de-dato') ?? [])].map(t),
          estimacion: t(e) ?? '',
          formulario: !!e?.querySelector('fieldset'),
          descripcion: valor('desc'),
          gramos: valor('g'),
          errores: [...(e?.querySelectorAll('.campo__error') ?? [])].map(t),
          aviso: t(e?.querySelector('.aviso--error')),
          filaElegida: document.querySelector(`.comida-del-dia [data-registro="${registro}"]`)?.getAttribute('aria-current') === 'true',
          filas: [...document.querySelectorAll('.registros .comida-del-dia')].filter((x) => x.getClientRects().length > 0).length,
        };
      },
      ESTIMACION,
      id,
    );
  const escribir = async (sufijo, valor) => {
    // Seleccionar todo con el teclado: tres clics no seleccionan el contenido de un campo de una sola palabra.
    const enfocado = await page.focus(CAMPO(sufijo)).then(
      () => true,
      () => false,
    );
    if (!enfocado) return;
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    if (valor) await page.type(CAMPO(sufijo), valor).catch(() => {});
  };
  /** Deja el formulario abierto y con lo escrito: una versión rota puede haberlo cerrado o vaciado, y hay que poder seguir. */
  const dejarEscrito = async () => {
    if (!(await leer()).formulario) {
      await clic(page, `${ESTIMACION} button.boton--secundario`, 'Agregar estimación').catch(() => null);
      await page.waitForSelector(`${ESTIMACION} fieldset`, { timeout: 10_000 }).catch(() => {});
    }
    const hay = await leer();
    if (hay.descripcion !== DESCRIPCION) await escribir('desc', DESCRIPCION);
    if (hay.gramos !== GRAMOS) await escribir('g', GRAMOS);
  };
  const guardar = () => clic(page, `${ESTIMACION} button.boton--primario`, 'Agregar estimación').catch(() => null);
  const actualizar = () => clic(page, 'header.marco-del-area .ficha__consulta button', 'Actualizar').catch(() => null);
  const pregunta = (ms) =>
    page.waitForSelector('dialog.dialogo[open]:not(.dialogo--panel)', { timeout: ms }).then(
      () => true,
      () => false,
    );

  // ── El registro de la comida diferente, abierto por su dirección ─────────────────────────────────────────────
  await cupo(v, 60);
  await ir(page, `/pro/advisees/nutrition?id=${A}&vista=registros&p=90&ver=comida-diferente&registro=${id}`);
  await page.waitForSelector('#titulo-registros', { timeout: 30_000 });
  await quieto(page, v);
  await page.waitForSelector(ESTIMACION, { timeout: 30_000 }).catch(() => {});
  await quieto(page, v);
  const alAbrir = await leer();
  comprobar(
    'C-50',
    'El registro de una comida diferente se abre por su dirección, con la vista «Comida diferente» elegida: su fila queda marcada, el detalle dice «Fuera del plan», la descripción original y que los macros no se calculan, y ofrece «Agregar estimación»',
    alAbrir.filaElegida &&
      alAbrir.rasgos.includes('Fuera del plan') &&
      (elegida.description ? alAbrir.texto.includes(elegida.description) : true) &&
      /Macros sin calcular/.test(alAbrir.texto) &&
      /Agregar estimación/.test(alAbrir.estimacion) &&
      !alAbrir.formulario &&
      filasDeLaVista > 0 &&
      alAbrir.filas === filasDeLaVista,
    `«${alAbrir.titulo}» · ${alAbrir.rasgos.join(', ') || 'sin etiquetas'} · ${alAbrir.filas} filas en la vista (a mano: ${filasDeLaVista}) · estimaciones que ya tenía: ${habia}`,
  );

  // ── Lo que no sale: sin describir nada, o con una cantidad que no es un número ───────────────────────────────
  await clic(page, `${ESTIMACION} button.boton--secundario`, 'Agregar estimación').catch(() => null);
  await page.waitForSelector(`${ESTIMACION} fieldset`, { timeout: 10_000 }).catch(() => {});
  const alValidar = v.urls.length;
  await guardar();
  await pausa(300);
  const vacio = await leer();
  await escribir('desc', DESCRIPCION);
  await escribir('g', 'doscientos');
  await guardar();
  await pausa(300);
  const conLetras = await leer();
  comprobar(
    'F-18',
    'La estimación no sale sin describir nada ni con una cantidad que no es un número: cada error se marca en su campo, con su motivo, y no se le pide nada a la API',
    vacio.formulario &&
      vacio.errores.some((e) => e.includes('Describí lo que estimás.')) &&
      conLetras.errores.length === 1 &&
      !conLetras.errores[0].includes('Describí') &&
      conLetras.descripcion === DESCRIPCION &&
      POSTS(alValidar).length === 0,
    `sin describir: ${vacio.errores.join(' | ') || 'ningún error marcado'} · con «doscientos»: ${conLetras.errores.join(' | ') || 'ningún error marcado'} · pedidos a la API: ${POSTS(alValidar).length}`,
  );
  await escribir('g', GRAMOS);

  // ── Con algo escrito, «Actualizar» pregunta antes ───────────────────────────────────────────────────────────
  await cupo(v, 60);
  const alPreguntar = v.urls.length;
  await actualizar();
  const pregunto = await pregunta(8_000);
  let laPregunta = '(no preguntó)';
  let leyoAlPreguntar = -1;
  if (pregunto) {
    laPregunta = await texto(page, 'dialog.dialogo[open]:not(.dialogo--panel)');
    await pausa(600);
    leyoAlPreguntar = v.urls.slice(alPreguntar).filter((u) => u.startsWith('GET ')).length;
    await clic(page, 'dialog.dialogo[open]:not(.dialogo--panel) button', 'Seguir editando').catch(() => null);
    await page.waitForFunction(() => !document.querySelector('dialog.dialogo[open]:not(.dialogo--panel)'), { timeout: 10_000 }).catch(() => {});
  } else {
    await quieto(page, v);
    await page.waitForSelector(ESTIMACION, { timeout: 30_000 }).catch(() => {});
    await quieto(page, v);
  }
  const trasPreguntar = await leer();
  comprobar(
    'F-08',
    'Con la estimación a medio escribir, «Actualizar» pregunta antes, dice qué se pierde (la estimación de una comida) y no lee nada; «Seguir editando» deja lo escrito y el registro abierto',
    pregunto && /Tenés cambios sin guardar/.test(laPregunta) && /la estimación de una comida/.test(laPregunta) && leyoAlPreguntar === 0 && trasPreguntar.formulario && trasPreguntar.descripcion === DESCRIPCION && trasPreguntar.gramos === GRAMOS,
    `«${laPregunta.slice(0, 150)}» · lecturas mientras pregunta: ${leyoAlPreguntar} · tras «Seguir editando»: «${trasPreguntar.descripcion}», «${trasPreguntar.gramos}»`,
  );
  await dejarEscrito();

  // ── Si guardar falla, lo dice y no se pierde lo escrito ─────────────────────────────────────────────────────
  const falla = { coincide: (u) => u.includes(`/nutrition/executions/${id}/corrections`), accion: 'responder', status: 503, codigo: 'SERVICE_UNAVAILABLE' };
  v.reglas.push(falla);
  await cupo(v, 60);
  await guardar();
  await page.waitForSelector(`${ESTIMACION} .aviso--error`, { timeout: 15_000 }).catch(() => {});
  await quieto(page, v);
  const conFalla = await leer();
  v.reglas.splice(v.reglas.indexOf(falla), 1);
  const trasLaFalla = ingestaDe(await leerElContexto(), id);
  comprobar(
    'F-18',
    'Si guardar falla (un 503 simulado por el recorrido), lo dice con su motivo, el formulario sigue abierto con lo escrito y el registro queda como estaba',
    !!conFalla.aviso && conFalla.formulario && conFalla.descripcion === DESCRIPCION && conFalla.gramos === GRAMOS && trasLaFalla?.corrections.length === habia,
    `«${conFalla.aviso ?? 'sin aviso'}» · lo escrito: «${conFalla.descripcion}», «${conFalla.gramos}» · estimaciones en la API: ${trasLaFalla?.corrections.length} (había ${habia})`,
  );
  await dejarEscrito();

  // ── Guardar: por la API, una vez, y la pantalla lo muestra ───────────────────────────────────────────────────
  await cupo(v, 60);
  const alGuardar = v.urls.length;
  await guardar();
  await page
    .waitForFunction(
      (s, d) => {
        const e = document.querySelector(s);
        return !!e && !e.querySelector('fieldset') && e.innerText.includes(d);
      },
      { timeout: 30_000 },
      ESTIMACION,
      DESCRIPCION,
    )
    .catch(() => {});
  await quieto(page, v);
  const guardado = await leer();
  const despues = await leerElContexto();
  const ingesta = ingestaDe(despues, id);
  const ultima = ingesta?.corrections.at(-1) ?? null;
  const item = ultima?.structuredEstimate.items[0] ?? null;
  const original = despues.descriptiveContrast.days.flatMap((d) => d.outsidePrescription).find((o) => o.executionId === id)?.description ?? null;
  comprobar(
    'C-50',
    '«Agregar estimación» guarda por la API con un solo pedido: la estimación queda en la historia del registro con lo escrito (la descripción y 250 g) y pasa a ser la vigente; la descripción original sigue igual. La pantalla la muestra con quién la hizo, sin cerrar el registro',
    POSTS(alGuardar).length === 1 &&
      ingesta?.corrections.length === habia + 1 &&
      item?.description === DESCRIPCION &&
      item?.quantity?.value === 250 &&
      item?.quantity?.unit === 'g' &&
      ingesta?.effectiveView.kind === 'CORRECTED' &&
      ingesta?.effectiveView.correctionId === ultima?.correctionId &&
      original === elegida.description &&
      !guardado.formulario &&
      guardado.estimacion.includes(DESCRIPCION) &&
      /250 g/.test(guardado.estimacion) &&
      guardado.estimacion.includes(ultima?.author.displayName ?? '···') &&
      (elegida.description ? guardado.texto.includes(elegida.description) : true) &&
      parametros(page).get('registro') === id &&
      guardado.filaElegida,
    `pedidos: ${POSTS(alGuardar).length} · en la API: ${ingesta?.corrections.length} estimaciones (había ${habia}), la última «${item?.description}» · ${item?.quantity ? `${item.quantity.value} ${item.quantity.unit}` : 'sin cantidad'} · original: «${original}» · en pantalla: «${guardado.estimacion.slice(0, 140)}»`,
  );

  // ── Ya no hay nada sin guardar: «Actualizar» no pregunta ─────────────────────────────────────────────────────
  await cupo(v, 60);
  const alActualizar = v.urls.length;
  await actualizar();
  const preguntoDeNuevo = await pregunta(2_500);
  if (preguntoDeNuevo) await clic(page, 'dialog.dialogo[open]:not(.dialogo--panel) button', 'Actualizar y descartar').catch(() => null);
  await quieto(page, v);
  await page.waitForSelector(ESTIMACION, { timeout: 30_000 }).catch(() => {});
  await quieto(page, v);
  const trasActualizar = await leer();
  const releyo = v.urls.slice(alActualizar).filter((u) => u.startsWith('GET ') && u.includes('/nutrition/review-context')).length;
  comprobar(
    'F-08',
    'Con la estimación guardada no queda nada sin guardar: «Actualizar» no pregunta, vuelve a leer y el registro sigue abierto, con la vista elegida y su estimación',
    !preguntoDeNuevo && releyo === 1 && parametros(page).get('registro') === id && parametros(page).get('ver') === 'comida-diferente' && trasActualizar.estimacion.includes(DESCRIPCION) && !trasActualizar.formulario,
    `preguntó: ${preguntoDeNuevo ? 'sí' : 'no'} · lecturas del contexto: ${releyo} · «${trasActualizar.estimacion.slice(0, 110)}»`,
  );
  comprobar('—', 'La estimación de una comida no produjo errores de página', v.errores.length === 0, v.errores.slice(0, 3).join(' | '));
}

// ─── Antropometría · Tomas (WP-ESCRITORIO-AREAS, parte 3) ──────────────────────────────────────────────────────────

/** Lo que «Tomas» tiene a la vista: la cuenta, la lista por tramos (o el selector), la toma abierta y el panel, si lo hay. */
const tomasEnPantalla = (page) =>
  page.evaluate(() => {
    const t = (e) => e?.innerText.replace(/\s+/g, ' ').trim() ?? null;
    const aLaVista = (e) => (e && e.getClientRects().length > 0 ? e : null);
    const lista = aLaVista(document.querySelector('nav.tomas-del-area__lista'));
    const selector = aLaVista(document.querySelector('.tomas-del-area__selector select'));
    const toma = document.querySelector('article.toma-abierta');
    const panel = document.querySelector('dialog.dialogo--panel[open]');
    return {
      cuenta: t(document.querySelector('[data-cuenta-de-tomas]')),
      bajada: t(document.querySelector('.tomas-del-area .registros__bajada')),
      preparar: t(aLaVista(document.querySelector('.tomas-del-area__preparar button'))),
      enPreparacion: t(aLaVista(document.querySelector('.tomas-del-area__preparar .nota'))),
      tramos: lista
        ? [...lista.querySelectorAll('.tramo-de-tomas')].map((x) => ({
            protocolo: t(x.querySelector('.tramo-de-tomas__protocolo')),
            tomas: [...x.querySelectorAll('button.toma-de-la-lista')].map((b) => ({ id: b.dataset.toma, fecha: t(b.querySelector('.toma-de-la-lista__fecha')), cuentas: t(b.querySelector('.toma-de-la-lista__cuentas')), elegida: b.getAttribute('aria-current') === 'true' })),
          }))
        : null,
      opciones: selector ? [...selector.options].map((o) => ({ id: o.value, texto: o.textContent.replace(/\s+/g, ' ').trim(), elegida: o.selected })) : null,
      toma: toma
        ? {
            id: toma.dataset.toma,
            titulo: t(toma.querySelector('#titulo-toma')),
            clase: t(toma.querySelector('.toma-abierta__encabezado .etiqueta-de-dato')),
            metadatos: t(toma.querySelector('.toma-abierta__metadatos')),
            categorias: [...toma.querySelectorAll('.categoria-de-resultados')].map((c) => ({
              titulo: t(c.querySelector('h4')),
              resultados: [...c.querySelectorAll('button.resultado-de-la-toma')].map((b) => ({ id: b.dataset.resultado, nombre: t(b.querySelector('.resultado-de-la-toma__nombre')), valor: t(b.querySelector('.resultado-de-la-toma__valor')), marcas: [...b.querySelectorAll('.etiqueta-de-dato')].map(t) })),
            })),
            sinCalculos: t(toma.querySelector('.resultados-de-la-toma__sin-calculos')),
            anteriores: t(toma.querySelector('button[aria-controls="anteriores-sin-efecto"]')),
            sinEfecto: [...toma.querySelectorAll('.anteriores-sin-efecto button.resultado-de-la-toma')].map((b) => ({ id: b.dataset.resultado, nombre: t(b.querySelector('.resultado-de-la-toma__nombre')), valor: t(b.querySelector('.resultado-de-la-toma__valor')) })),
            fallaDeResultados: t(toma.querySelector('.resultados-de-la-toma .aviso--error')),
            familias: [...toma.querySelectorAll('.familia-de-la-toma')].map((f) => ({
              familia: f.dataset.familia,
              titulo: t(f.querySelector('h4')),
              filas: [...f.querySelectorAll('button.medicion-de-la-toma')].map((b) => ({ id: b.dataset.medicion, nombre: t(b.querySelector('.medicion-de-la-toma__nombre')), valor: t(b.querySelector('.medicion-de-la-toma__valor')), marcas: [...b.querySelectorAll('.etiqueta-de-dato')].map(t), anulada: b.dataset.anulada === 'si', rotulo: b.getAttribute('aria-label') })),
            })),
            // Los botones que hay entre las mediciones, además de las filas: «Corregir» y «Anular» ya no están ahí.
            botonesSueltos: [...toma.querySelectorAll('.mediciones-de-la-toma button:not(.medicion-de-la-toma)')].map(t),
          }
        : null,
      leyendo: !!aLaVista(document.querySelector('.tomas-del-area__toma .cargando')),
      aviso: t(aLaVista(document.querySelector('.tomas-del-area__toma .aviso'))),
      vacio: t(aLaVista(document.querySelector('.tomas-del-area .estado-vacio'))),
      falla: t(aLaVista(document.querySelector('.seccion-del-area .estado-de-grafico--error, .tomas-del-area .estado-de-grafico--error'))),
      panel: panel
        ? {
            titulo: t(panel.querySelector('.dialogo__encabezado h2')),
            conElFoco: panel.contains(document.activeElement),
            deDonde: t(panel.querySelector('.medicion-abierta__de-donde')),
            valor: t(panel.querySelector('.medicion-abierta__valor')),
            marcas: [...panel.querySelectorAll('.medicion-abierta__marcas .etiqueta-de-dato')].map(t),
            datos: [...panel.querySelectorAll('.medicion-abierta__datos > div')].map((d) => [t(d.querySelector('dt')), t(d.querySelector('dd'))]),
            historia: [...panel.querySelectorAll('.historia-de-medicion__evento')].map((e) => ({ tipo: e.dataset.evento, rige: e.dataset.rige === 'si', titulo: t(e.querySelector('.historia-de-medicion__titulo')), nota: t(e.querySelector('.nota')), cuando: t(e.querySelector('.historia-de-medicion__cuando')) })),
            cambios: [...panel.querySelectorAll('.cambios-de-resultados')].map((u) => ({ clase: u.dataset.cambios, filas: [...u.querySelectorAll('li')].map((li) => ({ nombre: t(li.querySelector('.cambios-de-resultados__nombre')), valores: t(li.querySelector('.cambios-de-resultados__valores')) })) })),
            bloques: [...panel.querySelectorAll('.medicion-abierta__bloque')].map((b) => ({ titulo: t(b.querySelector('h3')), texto: t(b) })),
            entradas: panel.querySelectorAll('.entradas-del-calculo li').length,
            acciones: [...panel.querySelectorAll('.medicion-abierta__pie button, .nuevo-calculo > .acciones button')].map(t),
            formulario: panel.querySelector('[data-formulario]')?.dataset.formulario ?? null,
            metodos: panel.querySelectorAll('#cal-metodo option').length,
            exito: t(panel.querySelector('.aviso--exito')),
            error: t(panel.querySelector('.aviso--error')),
            texto: t(panel),
          }
        : null,
      alto: document.documentElement.scrollHeight,
    };
  });

/** El orden del catálogo «Perfil antropométrico completo», escrito a mano: así van las mediciones dentro de su familia. */
const CATALOGO_DE_MEDICIONES = [
  'peso', 'talla', 'edad',
  'pliegue-pectoral', 'pliegue-axilar-media', 'pliegue-triceps', 'pliegue-subescapular', 'pliegue-biceps', 'pliegue-cresta-iliaca', 'pliegue-supraespinal', 'pliegue-abdominal', 'pliegue-muslo-frontal', 'pliegue-pantorrilla', 'pliegue-antebrazo',
  'perimetro-cuello', 'perimetro-hombros', 'perimetro-pecho', 'perimetro-brazo-relajado', 'perimetro-brazo-flexionado', 'perimetro-antebrazo', 'perimetro-muneca', 'perimetro-cintura', 'perimetro-abdomen', 'perimetro-cadera', 'perimetro-muslo', 'perimetro-pantorrilla', 'perimetro-tobillo',
  'diametro-humero', 'diametro-biestiloideo', 'diametro-femur',
];

/**
 * Lo que «Tomas» tiene que decir, escrito a mano con lo que devuelve la API: no se usa el módulo del dominio que arma la
 * pantalla (`tomas-de-antropometria.ts`). Sí los nombres de las métricas, que son del catálogo.
 * `yo` es la identidad de quien mira, para «la corregiste vos».
 */
function esperadoDeTomas({ lista, detalleDe, corridas, metodos, yo }) {
  const dia = (iso) => new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(new Date(iso));
  const hora = (iso) => new Intl.DateTimeFormat('es-AR', { timeStyle: 'short', hourCycle: 'h23' }).format(new Date(iso));
  const fecha = (iso) => `${dia(iso)}, ${hora(iso)}`;
  // Sin miles: ninguna medición del escenario llega a 1.000.
  const num = (n) => String(n).replace('.', ',');
  const FAMILIA = (m) => (['peso', 'talla'].includes(m) ? 'MASA_Y_ESTATURA' : m.startsWith('pliegue-') ? 'PLIEGUES' : m.startsWith('perimetro-') ? 'PERIMETROS' : m.startsWith('diametro-') ? 'DIAMETROS' : 'OTRAS');
  const FAMILIAS = [
    ['MASA_Y_ESTATURA', 'Masa y estatura', null],
    ['PLIEGUES', 'Pliegues cutáneos', 'Pliegue'],
    ['PERIMETROS', 'Perímetros', 'Perímetro'],
    ['DIAMETROS', 'Diámetros', 'Diámetro'],
    ['OTRAS', 'Otras mediciones del protocolo', null],
  ];
  const CLASE = { MEASURED: 'Medido', REPORTED: 'Reportado' };
  const orden = (m) => (CATALOGO_DE_MEDICIONES.indexOf(m) < 0 ? 999 : CATALOGO_DE_MEDICIONES.indexOf(m));
  const corto = (nombre, palabra) => {
    if (!palabra || !nombre.startsWith(`${palabra} `)) return nombre;
    const resto = nombre.slice(palabra.length + 1).replace(/^(de la|de los|de las|del|de) /, '');
    return resto.charAt(0).toUpperCase() + resto.slice(1);
  };
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
  const cuentas = (ms) => {
    const anuladas = ms.filter((m) => m.condition === 'ANNULLED').length;
    const corregidas = ms.filter((m) => m.condition !== 'ANNULLED' && m.corrections.length > 0).length;
    return [plural(ms.length, 'medición', 'mediciones'), corregidas > 0 ? plural(corregidas, 'corregida', 'corregidas') : null, anuladas > 0 ? plural(anuladas, 'anulada', 'anuladas') : null].filter(Boolean).join(' · ');
  };
  const protocolo = (ms) => {
    const cuenta = new Map();
    for (const m of ms) cuenta.set(m.protocol.protocolName, (cuenta.get(m.protocol.protocolName) ?? 0) + 1);
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  };
  const marcasDe = (m) => (m.condition === 'ANNULLED' ? ['Anulada'] : m.effectiveMagnitude === null ? ['Sin valor vigente'] : m.corrections.length > 0 ? ['Corregida'] : []);

  const tomas = lista.map((t) => {
    const d = detalleDe.get(t.evaluationId);
    const ms = d.measurements;
    const unaClase = new Set(ms.map((m) => m.dataClass)).size === 1;
    const familias = FAMILIAS.flatMap(([clave, titulo, palabra]) => {
      const suyas = ms.filter((m) => FAMILIA(m.metric) === clave).sort((a, b) => orden(a.metric) - orden(b.metric) || a.recordedAt.localeCompare(b.recordedAt));
      if (suyas.length === 0) return [];
      const unidades = new Set(suyas.map((m) => (m.effectiveMagnitude ?? m.magnitude).unit));
      const unidad = suyas.length > 1 && unidades.size === 1 ? [...unidades][0] : null;
      return [
        {
          familia: clave,
          titulo: unidad ? `${titulo} · ${unidad}` : titulo,
          filas: suyas.map((m) => {
            const rige = m.effectiveMagnitude;
            const marcas = [...(unaClase ? [] : [CLASE[m.dataClass]]), ...marcasDe(m)];
            const completo = rige ? `${num(rige.value)} ${rige.unit}` : 'Sin valor vigente';
            return {
              id: m.measurementId,
              nombre: corto(dominio.nombreDeMetrica(m.metric), palabra),
              valor: rige ? (unidad ? num(rige.value) : `${num(rige.value)} ${rige.unit}`) : null,
              marcas,
              anulada: m.condition === 'ANNULLED',
              rotulo: [`${dominio.nombreDeMetrica(m.metric)}: ${completo}`, ...marcas.filter((x) => x !== 'Sin valor vigente')].join(' · '),
            };
          }),
        },
      ];
    });
    return {
      id: t.evaluationId,
      fecha: `${dia(t.occurredAt)} · ${hora(t.occurredAt)}`,
      titulo: `Toma del ${fecha(t.occurredAt)}`,
      protocolo: protocolo(ms),
      cuentas: cuentas(ms),
      clase: unaClase ? CLASE[ms[0].dataClass] : null,
      metadatos: [protocolo(ms), cuentas(ms), d.registeredAt ? `registrada el ${fecha(d.registeredAt)} por ${d.author.displayName}` : null, d.context ? `Contexto: «${d.context}»` : null].filter(Boolean).join(' · '),
      familias,
      mediciones: ms,
    };
  });
  // Tramos seguidos del mismo protocolo, sin reordenar.
  const tramos = [];
  for (const t of tomas) {
    const ultimo = tramos[tramos.length - 1];
    if (ultimo && ultimo.protocolo === t.protocolo) ultimo.tomas.push(t);
    else tramos.push({ protocolo: t.protocolo, tomas: [t] });
  }

  // Los resultados: por categoría del catálogo y, adentro, por método, versión y nombre. Nunca por «mejor».
  const CATEGORIAS = [
    ['INDICES', 'Índices'],
    ['SUMAS_DE_PLIEGUES', 'Sumas de pliegues'],
    ['GRASA_CORPORAL', 'Grasa corporal'],
    ['MASAS', 'Masas corporales'],
    ['SOMATOTIPO', 'Somatotipo'],
    [null, 'Otros cálculos'],
  ];
  const vigente = (c) => c.effective && c.supersededByRunId === null;
  const valorDe = (c) => {
    const n = c.result.magnitude.value.toFixed(c.precision.decimals).replace('.', ',');
    return c.result.magnitude.unit === 'adimensional' ? n : `${n} ${c.result.magnitude.unit}`;
  };
  const categoriaDe = (c) => (metodos.find((m) => m.methodVersionId === c.methodVersionId) ?? metodos.find((m) => m.methodId === c.methodId))?.category ?? null;
  const resultadosDe = (tomaId) => {
    const suyas = corridas.filter((c) => c.evaluationId === tomaId);
    const vigentes = suyas.filter(vigente);
    const categorias = CATEGORIAS.flatMap(([clave, titulo]) => {
      const deEsta = vigentes
        .filter((c) => categoriaDe(c) === clave)
        .sort((a, b) => a.methodName.localeCompare(b.methodName, 'es') || a.methodVersion.localeCompare(b.methodVersion, 'es') || dominio.nombreDeMetrica(a.result.metric).localeCompare(dominio.nombreDeMetrica(b.result.metric), 'es'));
      return deEsta.length === 0 ? [] : [{ titulo, resultados: deEsta.map((c) => ({ id: c.calculationRunId, nombre: c.methodName, valor: valorDe(c), marcas: c.referenceForPurpose ? ['Referencia'] : [] })) }];
    });
    return { categorias, sinEfecto: suyas.filter((c) => !vigente(c)), todas: suyas };
  };

  /** La historia de una medición, de lo más nuevo a lo más viejo, con las palabras de la pantalla. */
  const historiaDe = (m) => {
    const cadena = [];
    let anterior = null;
    for (let i = 0; i < m.corrections.length; i++) {
      const sigue = m.corrections.find((c) => c.previousCorrectionId === anterior && !cadena.includes(c));
      if (!sigue) break;
      cadena.push(sigue);
      anterior = sigue.correctionId;
    }
    const enOrden = cadena.length === m.corrections.length ? cadena : [...m.corrections].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
    const hayVigente = m.effectiveMagnitude !== null && m.condition !== 'ANNULLED';
    const quien = (autor, propio) => (yo && autor.identityId === yo ? propio : `${autor.displayName}.`);
    const eventos = [];
    if (m.annulment) eventos.push({ tipo: 'ANULACION', rige: false, titulo: 'Anulación', nota: `Por qué se anuló: «${m.annulment.reason}». ${quien(m.annulment.author, 'La anulaste vos.')}`, cuando: fecha(m.annulment.recordedAt) });
    enOrden
      .map((c, i) => ({ c, ultima: i === enOrden.length - 1 }))
      .reverse()
      .forEach(({ c, ultima }) =>
        eventos.push({
          tipo: 'CORRECCION',
          rige: ultima && hayVigente,
          titulo: `Corrección: ${num(c.magnitude.value)} ${c.magnitude.unit}${ultima && hayVigente ? ' Valor vigente' : ''}`,
          nota: `Por qué se corrigió: «${c.reason}». ${quien(c.author, 'La corregiste vos.')}`,
          cuando: fecha(c.recordedAt),
        }),
      );
    const rigeElOriginal = enOrden.length === 0 && hayVigente;
    eventos.push({
      tipo: 'ORIGINAL',
      rige: rigeElOriginal,
      titulo: `Valor original: ${num(m.magnitude.value)} ${m.magnitude.unit}${rigeElOriginal ? ' Valor vigente' : ''}`,
      nota: enOrden.length > 0 ? 'Se conserva: una corrección no lo borra.' : 'Sin correcciones: es el valor que se tomó.',
      cuando: fecha(m.recordedAt),
    });
    return eventos;
  };
  return { tomas, tramos, resultadosDe, historiaDe, valorDe, fecha, num, vigente };
}

/**
 * Antropometría · Tomas (maquetas 22 y 29; C-58, C-62 y C-64; F-33 a F-43), en lo que solo lee. Lo esperado se calcula a
 * mano con lo que devuelve la API (la lista entera, el detalle de cada toma, las corridas y los métodos). Corregir,
 * anular, calcular y dejar una referencia escriben: van en `medicionesDeUnaToma`, sobre las cuentas descartables. Va
 * dentro de `funcional`; solo, con `node recorrido.mjs tomas`.
 */
async function tomasDeAntropometria(page, v) {
  const A = estado.aseId;
  const AREA = `/pro/advisees/anthropometry?id=${A}`;
  const BASE = `${AREA}&vista=evaluaciones`;
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const pedidos = (fragmento, desde) => v.urls.slice(desde).filter((u) => u.startsWith('GET ') && u.includes(fragmento));
  const LISTO = 'article.toma-abierta, .tomas-del-area .estado-vacio, .tomas-del-area__toma .aviso, .seccion-del-area .estado-de-grafico--error';
  const entrar = async (ruta) => {
    await cupo(v, 45);
    const desde = v.urls.length;
    await ir(page, ruta);
    await page.waitForSelector('#titulo-tomas', { timeout: 30_000 }).catch(() => {});
    await quieto(page, v);
    await page.waitForSelector(LISTO, { timeout: 30_000 }).catch(() => {});
    await quieto(page, v);
    await page.evaluate(() => window.scrollTo(0, 0));
    return desde;
  };
  const salir = async () => {
    await cupo(v, 60);
    await ir(page, `${AREA}&vista=evolucion`);
    await page.waitForFunction(() => !document.querySelector('#titulo-tomas'), { timeout: 30_000 }).catch(() => {});
    await quieto(page, v);
  };
  const leerTodas = async (ruta) => {
    const todo = [];
    let cursor = null;
    do {
      const r = await leerApi(v, `${ruta}?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
      todo.push(...r.data);
      cursor = r.page.hasMore ? r.page.nextCursor : null;
    } while (cursor);
    return todo;
  };
  const abrirFila = async (selector) => {
    await page.click(selector).catch(() => {});
    await page.waitForSelector('dialog.dialogo--panel[open] .medicion-abierta, dialog.dialogo--panel[open] .nuevo-calculo', { timeout: 15_000 }).catch(() => {});
    await pausa(250);
    return tomasEnPantalla(page);
  };
  const cerrarPanel = async () => {
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('dialog.dialogo--panel[open]'), { timeout: 10_000 }).catch(() => {});
    await pausa(150);
  };

  // ── Al entrar: qué se lee, y cuántas veces ───────────────────────────────────────────────────────────────────
  const desde = await entrar(BASE);
  const inicial = await tomasEnPantalla(page);
  // Lo esperado, a mano, después de que la página pidió lo suyo (así las lecturas del recorrido no se cuentan con ellas).
  const alLeer = v.urls.length;
  const yo = (await leerApi(v, '/me')).data.identityId;
  const lista = (await leerTodas(`/advisees/${A}/anthropometry/evaluations`))
    .filter((t) => t.state === 'REGISTERED')
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || (b.registeredAt ?? '').localeCompare(a.registeredAt ?? ''));
  const detalleDe = new Map();
  for (const t of lista) detalleDe.set(t.evaluationId, (await leerApi(v, `/anthropometry/evaluations/${t.evaluationId}`)).data);
  const corridas = await leerTodas(`/advisees/${A}/calculations`);
  const metodos = await leerTodas('/professional-methods');
  const borradores = (await leerApi(v, `/advisees/${A}/anthropometry/evaluation-drafts`)).data;
  const E = esperadoDeTomas({ lista, detalleDe, corridas, metodos, yo });
  const deLaPagina = v.urls.slice(desde, alLeer);
  const lecturas = (fragmento) => deLaPagina.filter((u) => u.startsWith('GET ') && u.includes(fragmento));
  const detallesPedidos = lista.map((t) => lecturas(`/anthropometry/evaluations/${t.evaluationId}`).length);
  comprobar(
    'F-33',
    'Al entrar, «Tomas» lee la lista entera una vez, la toma en preparación una vez, y una vez el detalle de cada toma (hasta veinte): ninguno dos veces. Los métodos y los cálculos, una vez cada lista',
    lecturas(`/advisees/${A}/anthropometry/evaluations?`).length === 1 &&
      lecturas(`/advisees/${A}/anthropometry/evaluation-drafts`).length === 1 &&
      lista.length > 1 &&
      lista.length <= 20 &&
      detallesPedidos.every((n) => n === 1) &&
      lecturas('/professional-methods').length === Math.ceil(metodos.length / 50) &&
      lecturas(`/advisees/${A}/calculations`).length === Math.max(1, Math.ceil(corridas.length / 50)),
    `la lista: ${lecturas(`/advisees/${A}/anthropometry/evaluations?`).length} · en preparación: ${lecturas('/evaluation-drafts').length} · detalles: ${detallesPedidos.join(', ')} (de ${lista.length} tomas) · métodos: ${lecturas('/professional-methods').length} · cálculos: ${lecturas(`/advisees/${A}/calculations`).length}`,
  );

  // ── La lista, en tramos del mismo protocolo ──────────────────────────────────────────────────────────────────
  const tramosALaVista = (inicial.tramos ?? []).map((x) => ({ protocolo: x.protocolo, tomas: x.tomas.map((y) => ({ id: y.id, fecha: y.fecha, cuentas: y.cuentas })) }));
  const tramosEsperados = E.tramos.map((x) => ({ protocolo: x.protocolo, tomas: x.tomas.map((y) => ({ id: y.id, fecha: y.fecha, cuentas: y.cuentas })) }));
  comprobar(
    'C-64',
    'La lista tiene todas las tomas registradas, por cuándo se tomaron y de la más nueva a la más vieja, en tramos seguidos del mismo protocolo (una toma con otro protocolo en el medio parte el tramo); cada una dice su día y hora y sus cuentas: mediciones, corregidas y anuladas, calculadas a mano con su detalle',
    igual(tramosALaVista, tramosEsperados) && E.tramos.length >= 2 && E.tomas.some((x) => /corregida/.test(x.cuentas)) && E.tomas.some((x) => /anulada/.test(x.cuentas)),
    igual(tramosALaVista, tramosEsperados)
      ? `${E.tomas.length} tomas en ${E.tramos.length} tramos: ${E.tramos.map((x) => `${x.protocolo} (${x.tomas.length})`).join(' · ')}`
      : `a la vista: ${JSON.stringify(tramosALaVista).slice(0, 260)} — a mano: ${JSON.stringify(tramosEsperados).slice(0, 260)}`,
  );
  comprobar(
    'C-58',
    'El título dice «Tomas», cuántas hay registradas (la cantidad de la lista entera) y que una toma registrada no se edita; la toma en preparación se anuncia solo si hay una, con sus mediciones',
    inicial.cuenta === `${lista.length} registradas.` &&
      /Una toma registrada no se edita: cada medición se corrige o se anula, y queda constancia\./.test(inicial.bajada ?? '') &&
      inicial.preparar === (borradores.length > 0 ? 'Seguir con la toma en preparación' : 'Preparar una toma') &&
      (borradores.length > 0 ? /Hay una toma en preparación/.test(inicial.enPreparacion ?? '') : inicial.enPreparacion === null),
    `«${inicial.cuenta}» · botón: «${inicial.preparar}» · tomas en preparación según la API: ${borradores.length}${inicial.enPreparacion ? ` · «${inicial.enPreparacion}»` : ''}`,
  );

  // ── La toma que abre: la más reciente, con lo que vale para toda la toma dicho una vez ───────────────────────────
  const primera = E.tomas[0];
  comprobar(
    'F-36',
    'Sin una toma en la dirección abre la más reciente, marcada en la lista. Su encabezado dice cuándo se tomó, la clase del dato si todas las mediciones la comparten, y en un renglón el protocolo, las cuentas, cuándo se registró y quién',
    inicial.toma?.id === primera.id &&
      inicial.toma.titulo === primera.titulo &&
      inicial.toma.clase === primera.clase &&
      inicial.toma.metadatos === primera.metadatos &&
      igual((inicial.tramos ?? []).flatMap((x) => x.tomas).filter((x) => x.elegida).map((x) => x.id), [primera.id]),
    `«${inicial.toma?.titulo}» · ${inicial.toma?.clase ?? 'sin una clase común'} · «${(inicial.toma?.metadatos ?? '').slice(0, 130)}»`,
  );

  // ── Elegir otra toma: va a la dirección, y no vuelve a leer nada ─────────────────────────────────────────────────
  // La más cargada que tenga una medición anulada: es la que más filas y más casos muestra.
  const rica = [...E.tomas].filter((x) => x.id !== primera.id && x.mediciones.some((m) => m.condition === 'ANNULLED')).sort((a, b) => b.mediciones.length - a.mediciones.length)[0] ?? null;
  await page.evaluate(() => {
    window.__cargandoEnTomas = 0;
    window.__vigiaDeTomas?.disconnect();
    window.__vigiaDeTomas = new MutationObserver(() => {
      if (document.querySelector('.tomas-del-area .cargando')) window.__cargandoEnTomas += 1;
    });
    window.__vigiaDeTomas.observe(document.body, { subtree: true, childList: true });
  });
  const alElegir = v.urls.length;
  if (rica) await page.click(`button.toma-de-la-lista[data-toma="${rica.id}"]`).catch(() => {});
  await page.waitForFunction((id) => document.querySelector('article.toma-abierta')?.dataset.toma === id, { timeout: 15_000 }, rica?.id ?? '').catch(() => {});
  await pausa(400);
  const cargandoAlElegir = await page.evaluate(() => {
    window.__vigiaDeTomas?.disconnect();
    return window.__cargandoEnTomas ?? -1;
  });
  const conLaRica = await tomasEnPantalla(page);
  comprobar(
    'F-33',
    'Elegir otra toma la pone en la dirección (`evaluacion=`), la marca en la lista y la muestra sin pedirle nada a la API ni pasar por «Cargando…»: su detalle ya se había leído',
    !!rica &&
      parametros(page).get('evaluacion') === rica.id &&
      conLaRica.toma?.id === rica.id &&
      conLaRica.toma.titulo === rica.titulo &&
      v.urls.slice(alElegir).filter((u) => u.startsWith('GET ')).length === 0 &&
      cargandoAlElegir === 0 &&
      igual((conLaRica.tramos ?? []).flatMap((x) => x.tomas).filter((x) => x.elegida).map((x) => x.id), [rica.id]),
    rica ? `«${conLaRica.toma?.titulo}» · pedidos a la API: ${v.urls.slice(alElegir).filter((u) => u.startsWith('GET ')).length} · veces que se vio «Cargando…»: ${cargandoAlElegir}` : 'el escenario no tiene otra toma con una medición anulada',
  );

  // ── Las mediciones, por familia: el valor que rige y solo la excepción marcada ─────────────────────────────────
  const familiasALaVista = (conLaRica.toma?.familias ?? []).map((f) => ({ familia: f.familia, titulo: f.titulo, filas: f.filas }));
  comprobar(
    'F-36',
    'Las mediciones van por familia, en el orden del dominio y, adentro, en el del catálogo; cada fila dice el nombre corto, el valor que rige y solo lo que se sale de lo común («Anulada», «Corregida»); la unidad va una vez en el título de la familia si todas la comparten, y si no, en cada fila. El lector de pantalla oye el nombre completo y el valor con su unidad',
    !!rica && igual(familiasALaVista, rica.familias) && rica.familias.some((f) => / · /.test(f.titulo)) && rica.familias.some((f) => f.filas.some((x) => / /.test(x.valor ?? ''))) && rica.familias.some((f) => f.filas.some((x) => x.marcas.includes('Anulada'))),
    rica && igual(familiasALaVista, rica.familias)
      ? `${rica.familias.map((f) => `${f.titulo} (${f.filas.length})`).join(' · ')} · ${rica.familias.flatMap((f) => f.filas).find((x) => x.anulada)?.rotulo}`
      : `a la vista: ${JSON.stringify(familiasALaVista).slice(0, 300)} — a mano: ${JSON.stringify(rica?.familias ?? null).slice(0, 300)}`,
  );

  // ── Una medición se abre en el panel; corregir y anular están ahí, no en la fila ─────────────────────────────────
  const comun = rica ? rica.mediciones.find((m) => m.condition === 'EFFECTIVE' && m.corrections.length === 0) : null;
  const alAbrir = v.urls.length;
  const conElPanel = comun ? await abrirFila(`button.medicion-de-la-toma[data-medicion="${comun.measurementId}"]`) : conLaRica;
  const historiaComun = comun ? E.historiaDe(comun) : [];
  await cerrarPanel();
  const focoAlCerrar = await page.evaluate(() => document.activeElement?.dataset?.medicion ?? null);
  comprobar(
    'C-62',
    'Entre las mediciones no hay ningún botón «Corregir» ni «Anular»: la fila entera abre la medición en un panel, que retiene el foco, sin pedirle nada a la API. Ahí están su valor que rige, sus marcas, el protocolo, cuándo se tomó, su historia y los dos actos. Escape lo cierra y el foco vuelve a la fila',
    !!comun &&
      igual(conLaRica.toma?.botonesSueltos, []) &&
      conElPanel.panel?.titulo === dominio.nombreDeMetrica(comun.metric) &&
      conElPanel.panel.conElFoco &&
      conElPanel.panel.valor === `${E.num(comun.effectiveMagnitude.value)} ${comun.effectiveMagnitude.unit}` &&
      igual(conElPanel.panel.marcas, [comun.dataClass === 'REPORTED' ? 'Reportado' : 'Medido', 'Vigente']) &&
      igual(conElPanel.panel.datos, [['Protocolo', comun.protocol.protocolName], ['Se tomó', E.fecha(comun.occurredAt)]]) &&
      igual(conElPanel.panel.historia, historiaComun) &&
      igual(conElPanel.panel.acciones, ['Corregir medición', 'Anular esta medición']) &&
      v.urls.slice(alAbrir).filter((u) => u.startsWith('GET ')).length === 0 &&
      focoAlCerrar === comun.measurementId,
    comun
      ? `«${conElPanel.panel?.titulo}» · ${conElPanel.panel?.valor} · ${conElPanel.panel?.marcas.join(', ')} · historia: ${conElPanel.panel?.historia.map((h) => h.titulo).join(' | ')} · acciones: ${conElPanel.panel?.acciones.join(', ')} · foco al cerrar: ${focoAlCerrar === comun.measurementId ? 'en la fila' : 'en otro lado'}`
      : 'el escenario no tiene una medición vigente y sin correcciones en esa toma',
  );

  // ── Una medición anulada: se dice, conserva su valor y su historia, y no ofrece ninguna acción ─────────────────────
  const anulada = rica ? rica.mediciones.find((m) => m.condition === 'ANNULLED') : null;
  const conLaAnulada = anulada ? await abrirFila(`button.medicion-de-la-toma[data-medicion="${anulada.measurementId}"]`) : conLaRica;
  await cerrarPanel();
  comprobar(
    'F-37',
    'Una medición anulada se abre igual: dice «Anulada» y no «Vigente», conserva su valor a la vista, su historia empieza por la anulación con el motivo y quién la hizo, dice que no se reactiva, y no ofrece ni corregir ni anular (la misma consulta los encuentra en una medición vigente)',
    !!anulada &&
      conLaAnulada.panel?.marcas.includes('Anulada') &&
      !conLaAnulada.panel.marcas.includes('Vigente') &&
      conLaAnulada.panel.valor === `${E.num(anulada.effectiveMagnitude.value)} ${anulada.effectiveMagnitude.unit}` &&
      igual(conLaAnulada.panel.historia, E.historiaDe(anulada)) &&
      conLaAnulada.panel.historia[0]?.tipo === 'ANULACION' &&
      !conLaAnulada.panel.historia.some((h) => h.rige) &&
      /Una medición anulada no se reactiva\./.test(conLaAnulada.panel.texto) &&
      igual(conLaAnulada.panel.acciones, []) &&
      conLaAnulada.panel.bloques.some((b) => b.titulo === 'Lo que pasó con los resultados'),
    anulada ? `${conLaAnulada.panel?.marcas.join(', ')} · ${conLaAnulada.panel?.valor} · ${conLaAnulada.panel?.historia.map((h) => `${h.titulo}: ${h.nota}`).join(' | ').slice(0, 200)} · acciones: ${conLaAnulada.panel?.acciones.length}` : 'el escenario no tiene una medición anulada',
  );

  // ── Una medición corregida: rige la corrección, y el original se conserva en la historia ───────────────────────────
  const tomaCorregida = E.tomas.find((x) => x.mediciones.some((m) => m.condition === 'EFFECTIVE' && m.corrections.length > 0)) ?? null;
  const corregida = tomaCorregida?.mediciones.find((m) => m.condition === 'EFFECTIVE' && m.corrections.length > 0) ?? null;
  let conLaCorregida = conLaRica;
  if (tomaCorregida && corregida) {
    await page.click(`button.toma-de-la-lista[data-toma="${tomaCorregida.id}"]`).catch(() => {});
    await page.waitForFunction((id) => document.querySelector('article.toma-abierta')?.dataset.toma === id, { timeout: 15_000 }, tomaCorregida.id).catch(() => {});
    await pausa(300);
    conLaCorregida = await abrirFila(`button.medicion-de-la-toma[data-medicion="${corregida.measurementId}"]`);
    await cerrarPanel();
  }
  const filaCorregida = tomaCorregida?.familias.flatMap((f) => f.filas).find((x) => x.id === corregida?.measurementId) ?? null;
  const usanLaCorregida = corregida ? corridas.filter((c) => c.evaluationId === tomaCorregida.id && c.inputProvenance.some((i) => i.sourceRef === corregida.measurementId)) : [];
  const bloqueDelCambio = conLaCorregida.panel?.bloques.find((b) => b.titulo === 'Lo que cambió con la corrección') ?? null;
  comprobar(
    'F-37',
    'Una medición corregida muestra en la fila y en el panel el valor que rige, no el que se tomó primero, con la marca «Corregida». Su historia va de lo más nuevo a lo más viejo: la corrección, con su motivo y quién la hizo, marcada como el valor vigente; y el valor original, que se conserva',
    !!corregida &&
      corregida.effectiveMagnitude.value !== corregida.magnitude.value &&
      filaCorregida?.marcas.includes('Corregida') &&
      conLaCorregida.panel?.valor === `${E.num(corregida.effectiveMagnitude.value)} ${corregida.effectiveMagnitude.unit}` &&
      conLaCorregida.panel.marcas.includes('Corregida') &&
      igual(conLaCorregida.panel.historia, E.historiaDe(corregida)) &&
      conLaCorregida.panel.historia.filter((h) => h.rige).length === 1 &&
      conLaCorregida.panel.historia[0].tipo === 'CORRECCION' &&
      conLaCorregida.panel.historia.at(-1).titulo === `Valor original: ${E.num(corregida.magnitude.value)} ${corregida.magnitude.unit}`,
    corregida ? `${conLaCorregida.panel?.valor} (se tomó ${E.num(corregida.magnitude.value)}) · ${conLaCorregida.panel?.historia.map((h) => `${h.titulo} — ${h.nota}`).join(' | ').slice(0, 260)}` : 'el escenario no tiene una medición corregida y vigente',
  );
  // En el escenario principal la corrección se cargó sin cálculos que la usen: el panel lo dice, sin inventar un cambio.
  // Lo que cambia de verdad en los resultados al corregir se comprueba escribiendo, en `mediciones`.
  if (corregida && usanLaCorregida.length === 0) {
    comprobar(
      'F-38',
      'Si ningún resultado calculado de la toma usa la medición corregida, «Lo que cambió con la corrección» lo dice con esas palabras: no lista ningún resultado ni un «antes»',
      !!bloqueDelCambio && /Ningún resultado calculado de esta toma cambió por esta corrección\./.test(bloqueDelCambio.texto) && igual(conLaCorregida.panel.cambios, []),
      `«${bloqueDelCambio?.texto ?? 'sin el bloque'}»`,
    );
  } else {
    informar('F-38', 'Lo que cambió con la corrección, en el escenario principal', corregida ? `${usanLaCorregida.length} corridas de esa toma usan la medición: «${(bloqueDelCambio?.texto ?? '').slice(0, 160)}»` : 'sin medición corregida: no se pudo mirar');
  }

  // ── Los resultados calculados: por categoría, cada uno con los decimales de su método ───────────────────────────
  const conResultados = [...E.tomas].map((x) => ({ toma: x, r: E.resultadosDe(x.id) })).sort((a, b) => b.r.categorias.flatMap((c) => c.resultados).length - a.r.categorias.flatMap((c) => c.resultados).length)[0];
  const sinResultados = E.tomas.find((x) => E.resultadosDe(x.id).todas.length === 0) ?? null;
  const irALaToma = async (id) => {
    await page.click(`button.toma-de-la-lista[data-toma="${id}"]`).catch(() => {});
    await page.waitForFunction((x) => document.querySelector('article.toma-abierta')?.dataset.toma === x, { timeout: 15_000 }, id).catch(() => {});
    await pausa(300);
    return tomasEnPantalla(page);
  };
  const laDeResultados = await irALaToma(conResultados.toma.id);
  const laSinResultados = sinResultados ? await irALaToma(sinResultados.id) : null;
  const totalDeResultados = conResultados.r.categorias.flatMap((c) => c.resultados).length;
  comprobar(
    'F-39',
    'Los resultados vigentes de la toma van por categoría del catálogo y, adentro, por método: cada uno con el nombre de su método y su valor con los decimales que el método declara. «Ver N anteriores, sin efecto» está solo si hay alguno. Una toma sin cálculos lo dice con sus palabras, y no muestra ninguna categoría',
    totalDeResultados > 0 &&
      igual(laDeResultados.toma?.categorias, conResultados.r.categorias) &&
      (conResultados.r.sinEfecto.length > 0 ? new RegExp(`^Ver (1 anterior|${conResultados.r.sinEfecto.length} anteriores), sin efecto$`).test(laDeResultados.toma.anteriores ?? '') : laDeResultados.toma.anteriores === null) &&
      laDeResultados.toma.sinCalculos === null &&
      !!laSinResultados &&
      laSinResultados.toma?.sinCalculos === 'Todavía no hay cálculos para esta toma.' &&
      laSinResultados.toma.categorias.length === 0,
    igual(laDeResultados.toma?.categorias, conResultados.r.categorias)
      ? `${conResultados.r.categorias.map((c) => `${c.titulo}: ${c.resultados.map((x) => `${x.nombre} ${x.valor}`).join(', ')}`).join(' · ').slice(0, 220)} · sin efecto: ${conResultados.r.sinEfecto.length} · una toma sin cálculos: «${laSinResultados?.toma?.sinCalculos}»`
      : `a la vista: ${JSON.stringify(laDeResultados.toma?.categorias).slice(0, 260)} — a mano: ${JSON.stringify(conResultados.r.categorias).slice(0, 260)}`,
  );

  // ── Un resultado y «Calcular con un método» se abren en el panel ────────────────────────────────────────────────
  await irALaToma(conResultados.toma.id);
  const unResultado = conResultados.r.categorias[0]?.resultados[0] ?? null;
  const suCorrida = corridas.find((c) => c.calculationRunId === unResultado?.id) ?? null;
  const conElResultado = unResultado ? await abrirFila(`button.resultado-de-la-toma[data-resultado="${unResultado.id}"]`) : laDeResultados;
  await cerrarPanel();
  const escriturasAntes = v.urls.filter((u) => /^(POST|PUT|DELETE) /.test(u)).length;
  await clic(page, 'article.toma-abierta .toma-abierta__acciones-de-bloque button', 'Calcular con un método').catch(() => null);
  await page.waitForSelector('dialog.dialogo--panel[open] .nuevo-calculo', { timeout: 15_000 }).catch(() => {});
  await pausa(250);
  const conElCalculo = await tomasEnPantalla(page);
  await clic(page, 'dialog.dialogo--panel[open] .nuevo-calculo > .acciones button', 'Cancelar').catch(() => null);
  await page.waitForFunction(() => !document.querySelector('dialog.dialogo--panel[open]'), { timeout: 10_000 }).catch(() => {});
  const puedeSerReferencia = !!suCorrida && !suCorrida.referenceForPurpose && suCorrida.evaluationContext === 'REGISTERED' && E.vigente(suCorrida);
  comprobar(
    'F-39',
    'Un resultado se abre en el panel: su método, su valor con la precisión declarada, la marca «Calculado», con qué se calculó (la versión, la regla, la precisión y una línea por entrada) y, si está vigente y no es ya la referencia, «Dejar como referencia». «Calcular con un método» se abre en el mismo panel, con todos los métodos del catálogo, y «Cancelar» lo cierra sin escribir nada',
    !!suCorrida &&
      conElResultado.panel?.titulo === 'Resultado calculado' &&
      conElResultado.panel.deDonde === suCorrida.methodName &&
      conElResultado.panel.valor === E.valorDe(suCorrida) &&
      conElResultado.panel.marcas.includes('Calculado') &&
      conElResultado.panel.entradas === suCorrida.inputProvenance.length &&
      conElResultado.panel.bloques.some((b) => b.titulo === 'Con qué se calculó' && b.texto.includes(`Regla aplicada: ${suCorrida.ruleId}`)) &&
      igual(conElResultado.panel.acciones, puedeSerReferencia ? ['Dejar como referencia'] : []) &&
      conElCalculo.panel?.titulo === 'Calcular con un método' &&
      conElCalculo.panel.metodos === metodos.length &&
      metodos.length > 0 &&
      v.urls.filter((u) => /^(POST|PUT|DELETE) /.test(u)).length === escriturasAntes,
    `«${conElResultado.panel?.deDonde}» ${conElResultado.panel?.valor} · ${conElResultado.panel?.entradas} entradas · acciones: ${conElResultado.panel?.acciones.join(', ') || 'ninguna'} · métodos en el panel: ${conElCalculo.panel?.metodos} (el catálogo: ${metodos.length})`,
  );

  // ── «En preparación» ya no es una sección: la carga se abre desde «Tomas» ───────────────────────────────────────
  await clic(page, '.tomas-del-area__preparar button', inicial.preparar ?? 'Preparar una toma').catch(() => null);
  await page.waitForSelector('#titulo-preparacion', { timeout: 30_000 }).catch(() => {});
  await quieto(page, v);
  const enLaCarga = await marcoEnPantalla(page);
  const vistaDeLaCarga = parametros(page).get('vista');
  const vuelta = await page.evaluate(() => {
    const a = document.querySelector('.vuelta-a-la-seccion a');
    return a ? { texto: a.innerText.replace(/\s+/g, ' ').trim(), href: a.getAttribute('href') } : null;
  });
  await clic(page, '.vuelta-a-la-seccion a', 'Tomas').catch(() => null);
  await page.waitForSelector('#titulo-tomas', { timeout: 30_000 }).catch(() => {});
  await quieto(page, v);
  comprobar(
    'F-35',
    '«En preparación» dejó de ser una sección: el marco tiene tres (Tomas, Evolución y Lámina). El botón de «Tomas» abre la carga de una toma (`vista=preparacion`, que no cambió), con «Tomas» marcada y un enlace de la aplicación para volver, que vuelve a la lista',
    vistaDeLaCarga === 'preparacion' &&
      igual(enLaCarga?.pestanas.map((p) => p.texto), ['Tomas', 'Evolución', 'Lámina']) &&
      enLaCarga.pestanas.find((p) => p.actual === 'page')?.texto === 'Tomas' &&
      /^(Nueva toma|Toma en preparación)$/.test(enLaCarga.primerTitulo ?? '') &&
      vuelta?.texto === 'Tomas' &&
      /vista=evaluaciones/.test(vuelta.href ?? '') &&
      parametros(page).get('vista') === 'evaluaciones',
    `secciones: ${enLaCarga?.pestanas.map((p) => p.texto).join(', ')} · marcada: ${enLaCarga?.pestanas.find((p) => p.actual === 'page')?.texto} · la carga: «${enLaCarga?.primerTitulo}» · vuelta: «${vuelta?.texto}»`,
  );

  // ── «Actualizar» conserva la toma elegida y vuelve a leer ───────────────────────────────────────────────────────
  await entrar(`${BASE}&evaluacion=${rica?.id ?? primera.id}`);
  await cupo(v, 45);
  const alActualizar = v.urls.length;
  await clic(page, 'header.marco-del-area .ficha__consulta button', 'Actualizar').catch(() => null);
  await quieto(page, v);
  await page.waitForSelector('article.toma-abierta', { timeout: 30_000 }).catch(() => {});
  await quieto(page, v);
  const trasActualizar = await tomasEnPantalla(page);
  comprobar(
    'F-33',
    'La toma elegida vive en la dirección: se abre al entrar con ella, y «Actualizar» vuelve a leer la lista y la deja abierta',
    trasActualizar.toma?.id === (rica?.id ?? primera.id) && parametros(page).get('evaluacion') === (rica?.id ?? primera.id) && pedidos(`/advisees/${A}/anthropometry/evaluations?`, alActualizar).length === 1,
    `«${trasActualizar.toma?.titulo}» · lecturas de la lista al actualizar: ${pedidos(`/advisees/${A}/anthropometry/evaluations?`, alActualizar).length}`,
  );

  // ── Una toma pedida que no está: la lista sigue completa ────────────────────────────────────────────────────────
  await salir();
  await entrar(`${BASE}&evaluacion=00000000-0000-4000-8000-000000000000`);
  const pedidaQueNoEsta = await tomasEnPantalla(page);
  await clic(page, '.tomas-del-area__toma .aviso button', 'Volver a la lista de tomas').catch(() => null);
  await page.waitForSelector('article.toma-abierta', { timeout: 30_000 }).catch(() => {});
  await quieto(page, v);
  const deVueltaEnLaLista = await tomasEnPantalla(page);
  comprobar(
    'F-33',
    'Una toma pedida por la dirección que no está disponible lo dice con el texto neutral, sin tapar la lista, que sigue completa; «Volver a la lista de tomas» saca el parámetro y abre la más reciente',
    /La toma solicitada no está disponible\. La lista de tomas sigue completa\./.test(pedidaQueNoEsta.aviso ?? '') &&
      pedidaQueNoEsta.toma === null &&
      (pedidaQueNoEsta.tramos ?? []).flatMap((x) => x.tomas).length === lista.length &&
      deVueltaEnLaLista.toma?.id === primera.id &&
      !parametros(page).has('evaluacion'),
    `«${(pedidaQueNoEsta.aviso ?? '').slice(0, 90)}» · tomas en la lista: ${(pedidaQueNoEsta.tramos ?? []).flatMap((x) => x.tomas).length} · después: «${deVueltaEnLaLista.toma?.titulo}»`,
  );

  // ── Las fallas se dicen, y no pasan por ausencia de datos (respuestas simuladas en el navegador) ────────────────────
  await salir();
  const sinLista = { coincide: (u) => u.includes(`/advisees/${A}/anthropometry/evaluations?`), accion: 'responder', status: 503, codigo: 'DB_UNAVAILABLE' };
  v.reglas.push(sinLista);
  await entrar(BASE);
  const conLaListaCaida = await tomasEnPantalla(page);
  v.reglas.splice(v.reglas.indexOf(sinLista), 1);
  const textoDeLaFalla = await texto(page, '.seccion-del-area');
  await salir();
  const sinCalculos = { coincide: (u) => u.includes(`/advisees/${A}/calculations`), accion: 'responder', status: 503, codigo: 'DB_UNAVAILABLE' };
  v.reglas.push(sinCalculos);
  await entrar(`${BASE}&evaluacion=${conResultados.toma.id}`);
  const conLosCalculosCaidos = await tomasEnPantalla(page);
  v.reglas.splice(v.reglas.indexOf(sinCalculos), 1);
  await cupo(v, 60);
  await clic(page, '.resultados-de-la-toma .aviso--error button', 'Reintentar').catch(() => null);
  await quieto(page, v);
  await page.waitForSelector('.categoria-de-resultados', { timeout: 20_000 }).catch(() => {});
  const repuestos = await tomasEnPantalla(page);
  comprobar(
    'F-39',
    'Si la lista de tomas no se puede leer (un 503 simulado), la sección dice la falla con «Reintentar» y nunca «Todavía no hay tomas registradas». Si lo que no se puede leer son los cálculos, la toma y sus mediciones siguen a la vista, el bloque de resultados dice que no pudo leerlos (no «todavía no hay cálculos») y «Reintentar» los trae',
    conLaListaCaida.toma === null &&
      conLaListaCaida.tramos === null &&
      conLaListaCaida.vacio === null &&
      /Reintentar/.test(textoDeLaFalla) &&
      !/Todavía no hay tomas/.test(textoDeLaFalla) &&
      conLosCalculosCaidos.toma?.id === conResultados.toma.id &&
      conLosCalculosCaidos.toma.familias.length > 0 &&
      /No pudimos leer los resultados calculados de esta toma\./.test(conLosCalculosCaidos.toma.fallaDeResultados ?? '') &&
      conLosCalculosCaidos.toma.sinCalculos === null &&
      conLosCalculosCaidos.toma.categorias.length === 0 &&
      igual(repuestos.toma?.categorias, conResultados.r.categorias),
    `sin la lista: «${textoDeLaFalla.slice(0, 90)}» · sin los cálculos: «${conLosCalculosCaidos.toma?.fallaDeResultados}», ${conLosCalculosCaidos.toma?.familias.length} familias a la vista · después de reintentar: ${repuestos.toma?.categorias.flatMap((c) => c.resultados).length} resultados`,
  );

  // ── La ayuda, la accesibilidad y los anchos ─────────────────────────────────────────────────────────────────────
  await salir();
  const sinAyuda = await page.evaluate(() => document.querySelectorAll('header.marco-del-area .como-se-lee__boton').length);
  await entrar(`${BASE}&evaluacion=${rica?.id ?? primera.id}`);
  const medida = await page.evaluate(() => {
    const ancho = (s) => Math.round(document.querySelector(s)?.getBoundingClientRect().width ?? 0);
    const abajo = (s) => Math.round((document.querySelector(s)?.getBoundingClientRect().bottom ?? 0) + scrollY);
    return { alto: document.documentElement.scrollHeight, lista: ancho('nav.tomas-del-area__lista'), toma: ancho('article.toma-abierta'), finDeLaToma: abajo('article.toma-abierta') };
  });
  informar('F-41', '«Tomas», con la toma más cargada del escenario principal abierta, a 1440 × 900', `${medida.alto} px · la lista mide ${medida.lista} px de ancho y la toma, ${medida.toma}; la toma termina a los ${medida.finDeLaToma} px`);
  const faltas = await axe(page);
  if (comun) await abrirFila(`button.medicion-de-la-toma[data-medicion="${comun.measurementId}"]`);
  const faltasConElPanel = await axe(page);
  const tapasDelPanel = await page.evaluate(() => document.querySelectorAll('dialog.dialogo--panel[open] .desplazable-x').length);
  await cerrarPanel();
  await clic(page, 'header.marco-del-area .como-se-lee__boton', 'Cómo se lee esta vista').catch(() => null);
  await page.waitForSelector('dialog.como-se-lee[open]', { timeout: 10_000 }).catch(() => {});
  const ayuda = await page.evaluate(() => {
    const d = document.querySelector('dialog.como-se-lee[open]');
    return d ? { titulo: d.querySelector('h2').innerText.trim(), renglones: d.querySelectorAll('.como-se-lee__lista > li').length, foco: document.activeElement === d.querySelector('h2') } : { titulo: null, renglones: 0, foco: false };
  });
  const faltasDeLaAyuda = await axe(page);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog.como-se-lee[open]'), { timeout: 10_000 }).catch(() => {});
  comprobar(
    'F-14',
    '«Tomas» tiene su ayuda en el marco del área: se abre por el título y explica la lista, el valor que rige, las marcas y los resultados; Evolución, que no tiene ayuda, no muestra el botón (la misma consulta lo encuentra en «Tomas»)',
    ayuda.titulo === 'Cómo se leen las Tomas' && ayuda.renglones >= 8 && ayuda.foco && sinAyuda === 0,
    `«${ayuda.titulo}» · ${ayuda.renglones} renglones · botones de ayuda en Evolución: ${sinAyuda}`,
  );
  comprobar(
    'F-37',
    'axe no encuentra faltas en «Tomas», ni con una medición abierta en el panel, ni con la ayuda abierta',
    faltas.length === 0 && faltasConElPanel.length === 0 && faltasDeLaAyuda.length === 0,
    `la lista y la toma: ${faltas.map((f) => f.id).join(', ') || 'sin faltas'} · con el panel: ${faltasConElPanel.map((f) => f.id).join(', ') || 'sin faltas'} · la ayuda: ${faltasDeLaAyuda.map((f) => f.id).join(', ') || 'sin faltas'}${tapasDelPanel ? ` · tablas en el panel: ${tapasDelPanel}` : ''}`,
  );

  // A 1280 px la toma sigue al costado de la lista; a 1024 la lista pasa arriba, como un selector.
  const enAncho = async (ancho) => {
    await page.setViewport({ width: ancho, height: 900 });
    await pausa(300);
    const p = await tomasEnPantalla(page);
    return { p, desborda: !(await sinDesborde(page)), alto: p.alto };
  };
  const a1280 = await enAncho(1280);
  const a1024 = await enAncho(1024);
  const otra = E.tomas.find((x) => x.id !== (rica?.id ?? primera.id)) ?? null;
  if (otra) await page.select('.tomas-del-area__selector select', otra.id).catch(() => {});
  await page.waitForFunction((id) => document.querySelector('article.toma-abierta')?.dataset.toma === id, { timeout: 15_000 }, otra?.id ?? '').catch(() => {});
  await pausa(300);
  const conElSelector = await tomasEnPantalla(page);
  await page.setViewport({ width: 1440, height: 900 });
  await pausa(200);
  informar('F-41', 'El alto de «Tomas» con esa toma, a 1280 y a 1024 px', `${a1280.alto} px y ${a1024.alto} px`);
  comprobar(
    'F-41',
    'A 1280 px la lista sigue al costado de la toma. A 1024 px la lista pasa arriba, como un selector con las mismas tomas, sus mismas cuentas y sus tramos; elegir otra toma en el selector la abre y la pone en la dirección. En ningún ancho la página desborda de costado',
    !a1280.desborda &&
      !a1024.desborda &&
      a1280.p.tramos !== null &&
      a1280.p.opciones === null &&
      a1024.p.tramos === null &&
      igual(a1024.p.opciones?.map((o) => ({ id: o.id, texto: o.texto })), E.tomas.map((x) => ({ id: x.id, texto: `${x.fecha} · ${x.cuentas}` }))) &&
      !!otra &&
      conElSelector.toma?.id === otra.id &&
      parametros(page).get('evaluacion') === otra.id,
    `1280: ${a1280.p.tramos ? 'lista al costado' : 'sin lista'}${a1280.desborda ? ' · DESBORDA' : ''} · 1024: ${a1024.p.opciones?.length ?? 0} opciones en el selector (de ${E.tomas.length})${a1024.desborda ? ' · DESBORDA' : ''} · elegida por el selector: «${conElSelector.toma?.titulo}»`,
  );
  comprobar('—', '«Tomas» no produjo errores de página', v.errores.length === 0, v.errores.slice(0, 3).join(' | '));
}

// ─── Antropometría · Tomas: lo que escribe (WP-ESCRITORIO-AREAS, parte 3) ──────────────────────────────────────────

/**
 * Corregir una medición, anular otra, calcular con un método y dejar un resultado como referencia, por la pantalla
 * (C-62; F-37 a F-39), sobre la toma del perfil completo de las cuentas descartables (`datos/generar.mjs
 * descartable-toma-completa`): 30 mediciones y 8 resultados calculados por la API, con la cintura mal tipeada.
 * **Escribe:** por eso no va dentro de `funcional`. Corre sola (`node recorrido.mjs mediciones`), con esas cuentas recién
 * generadas, y no toca los datos de A, B ni C. Lo esperado sale de lo que devuelve la API antes y después de cada
 * escritura; lo que tiene que decir la pantalla, de `esperadoDeTomas`, escrito a mano. Una de las comprobaciones mira
 * una falla simulada por el recorrido (un 503 al corregir), y lo dice.
 */
async function medicionesDeUnaToma() {
  const d = estado.descartable;
  const T = d?.tomaCompleta;
  if (!T) throw new Error('faltan las cuentas descartables con la toma completa: datos/generar.mjs descartable-cuentas, descartable-datos y descartable-toma-completa');
  const { navegador, page, v } = await abrir();
  try {
    const A = d.aseId;
    const BASE = `/pro/advisees/anthropometry?id=${A}&vista=evaluaciones`;
    const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const PANEL = 'dialog.dialogo--panel[open]';
    const escrituras = (fragmento, desde) => v.urls.slice(desde).filter((u) => /^(POST|PUT) /.test(u) && u.includes(fragmento));
    const leerTodas = async (ruta) => {
      const todo = [];
      let cursor = null;
      do {
        const r = await leerApi(v, `${ruta}?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
        todo.push(...r.data);
        cursor = r.page.hasMore ? r.page.nextCursor : null;
      } while (cursor);
      return todo;
    };
    /** Lo que dice la API ahora, y lo que la pantalla tiene que decir con eso. */
    const leerTodo = async () => {
      const yo = (await leerApi(v, '/me')).data.identityId;
      const lista = (await leerTodas(`/advisees/${A}/anthropometry/evaluations`)).filter((t) => t.state === 'REGISTERED').sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || (b.registeredAt ?? '').localeCompare(a.registeredAt ?? ''));
      const detalleDe = new Map();
      for (const t of lista) detalleDe.set(t.evaluationId, (await leerApi(v, `/anthropometry/evaluations/${t.evaluationId}`)).data);
      const corridas = await leerTodas(`/advisees/${A}/calculations`);
      const metodos = await leerTodas('/professional-methods');
      const E = esperadoDeTomas({ lista, detalleDe, corridas, metodos, yo });
      return { E, corridas, metodos, toma: E.tomas.find((x) => x.id === T.evaluationId), detalle: detalleDe.get(T.evaluationId) };
    };
    const fila = (id) => `button.medicion-de-la-toma[data-medicion="${id}"]`;
    const abrirFila = async (selector) => {
      await page.click(selector).catch(() => {});
      await page.waitForSelector(`${PANEL} .medicion-abierta, ${PANEL} .nuevo-calculo`, { timeout: 15_000 }).catch(() => {});
      await pausa(250);
      return tomasEnPantalla(page);
    };
    const cerrarPanel = async () => {
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('dialog.dialogo--panel[open]'), { timeout: 10_000 }).catch(() => {});
      await pausa(150);
    };
    const escribir = async (selector, valor) => {
      await page.focus(selector);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      if (valor) await page.type(selector, valor);
    };
    const apagado = (selector, contiene) => page.evaluate((s, c) => [...document.querySelectorAll(s)].find((b) => b.innerText.includes(c))?.disabled ?? null, selector, contiene);

    await iniciarSesion(page, v, d.proCorreo, `/pro/advisees?id=${A}`);
    await quieto(page, v);
    await ir(page, BASE);
    await page.waitForSelector('article.toma-abierta', { timeout: 30_000 });
    await quieto(page, v);

    // ── La toma completa, como la dibuja la maqueta 22 ─────────────────────────────────────────────────────────
    const antes = await leerTodo();
    const alEntrar = await tomasEnPantalla(page);
    const resultadosAntes = antes.E.resultadosDe(T.evaluationId);
    comprobar(
      'F-36',
      'La toma del perfil completo abre sola (es la más reciente) y se lee como la maqueta 22: las 30 mediciones en sus cinco familias, en el orden del catálogo, con la unidad en el título de la familia donde todas la comparten; y sus resultados calculados, por categoría',
      alEntrar.toma?.id === T.evaluationId &&
        igual(alEntrar.toma.familias.map((f) => ({ familia: f.familia, titulo: f.titulo, filas: f.filas })), antes.toma.familias) &&
        igual(antes.toma.familias.map((f) => [f.familia, f.filas.length]), [['MASA_Y_ESTATURA', 2], ['PLIEGUES', 11], ['PERIMETROS', 13], ['DIAMETROS', 3], ['OTRAS', 1]]) &&
        igual(alEntrar.toma.categorias, resultadosAntes.categorias) &&
        resultadosAntes.categorias.flatMap((c) => c.resultados).length === T.corridas.length &&
        alEntrar.toma.anteriores === null &&
        antes.toma.cuentas === '30 mediciones',
      `${antes.toma.familias.map((f) => `${f.titulo} (${f.filas.length})`).join(' · ')} · ${resultadosAntes.categorias.map((c) => `${c.titulo} (${c.resultados.length})`).join(' · ')} · «${antes.toma.cuentas}»`,
    );

    // ── Corregir la cintura: primero una falla simulada, después de verdad ────────────────────────────────────────
    const cintura = antes.detalle.measurements.find((m) => m.metric === 'perimetro-cintura');
    const VALOR = '84';
    const MOTIVO = 'Valor tipeado mal: era 84';
    const FORM = `${PANEL} [data-formulario="corregir"]`;
    await abrirFila(fila(cintura.measurementId));
    await clic(page, `${PANEL} .medicion-abierta__pie button`, 'Corregir medición');
    await page.waitForSelector(FORM, { timeout: 10_000 }).catch(() => {});
    const sinNada = await apagado(`${FORM} .acciones button`, 'Corregir medición');
    await escribir(`#corr-valor-${cintura.measurementId}`, '84,5,1');
    await escribir(`#corr-motivo-${cintura.measurementId}`, MOTIVO);
    const conAlgo = await apagado(`${FORM} .acciones button`, 'Corregir medición');
    const alIntentar = v.urls.length;
    await clic(page, `${FORM} .acciones button`, 'Corregir medición');
    await pausa(300);
    const numeroIlegible = await page.evaluate((id) => ({ invalido: document.querySelector(`#corr-valor-${id}`)?.getAttribute('aria-invalid'), texto: document.querySelector('dialog.dialogo--panel[open] [data-formulario="corregir"]')?.innerText.replace(/\s+/g, ' ').trim() ?? '' }), cintura.measurementId);
    comprobar(
      'F-37',
      'Corregir pide el valor y el motivo: sin los dos el botón está apagado (con los dos, la misma consulta lo encuentra encendido). Un valor que no se entiende como número se marca en su campo y no sale ningún pedido',
      sinNada === true && conAlgo === false && numeroIlegible.invalido === 'true' && escrituras('/corrections', alIntentar).length === 0,
      `sin nada: ${sinNada ? 'apagado' : 'encendido'} · con valor y motivo: ${conAlgo ? 'apagado' : 'encendido'} · «84,5,1»: ${numeroIlegible.invalido === 'true' ? 'marcado en el campo' : 'sin marcar'} · pedidos: ${escrituras('/corrections', alIntentar).length}`,
    );
    await escribir(`#corr-valor-${cintura.measurementId}`, VALOR);
    // Una falla al guardar (un 503 simulado en el navegador): se dice en el panel, y lo escrito queda.
    const sinGuardar = { coincide: (u) => u.includes(`/anthropometry/evaluations/${T.evaluationId}/corrections`), accion: 'responder', status: 503, codigo: 'DB_UNAVAILABLE' };
    v.reglas.push(sinGuardar);
    await clic(page, `${FORM} .acciones button`, 'Corregir medición');
    await page.waitForSelector(`${PANEL} .aviso--error`, { timeout: 15_000 }).catch(() => {});
    await quieto(page, v);
    v.reglas.splice(v.reglas.indexOf(sinGuardar), 1);
    const conLaFalla = await tomasEnPantalla(page);
    const loEscrito = await page.evaluate((id) => [document.querySelector(`#corr-valor-${id}`)?.value ?? null, document.querySelector(`#corr-motivo-${id}`)?.value ?? null], cintura.measurementId);
    comprobar(
      'F-37',
      'Si la corrección no se puede guardar (un 503 simulado), el panel lo dice adentro, sigue abierto con el formulario y lo escrito, y la medición no cambió',
      !!conLaFalla.panel?.error && conLaFalla.panel.formulario === 'corregir' && igual(loEscrito, [VALOR, MOTIVO]) && conLaFalla.panel.valor === `${antes.E.num(cintura.magnitude.value)} cm` && !conLaFalla.panel.marcas.includes('Corregida'),
      `«${(conLaFalla.panel?.error ?? '').slice(0, 90)}» · lo escrito: ${loEscrito.join(' | ')} · el valor: ${conLaFalla.panel?.valor}`,
    );
    const alCorregir = v.urls.length;
    await clic(page, `${FORM} .acciones button`, 'Corregir medición');
    await page.waitForSelector(`${PANEL} .aviso--exito`, { timeout: 20_000 }).catch(() => {});
    await quieto(page, v);
    const corregido = await leerTodo();
    const trasCorregir = await tomasEnPantalla(page);
    const cinturaAhora = corregido.detalle.measurements.find((m) => m.measurementId === cintura.measurementId);
    // Lo que cambió, a mano: las corridas vigentes de la toma que reemplazan a otra y usaron la cintura con otro valor.
    const entrada = (c) => c.inputProvenance.find((i) => i.sourceRef === cintura.measurementId) ?? null;
    const recalculadas = corregido.corridas
      .filter((c) => c.evaluationId === T.evaluationId && corregido.E.vigente(c) && c.supersedesRunId && entrada(c))
      .map((c) => ({ c, anterior: corregido.corridas.find((x) => x.calculationRunId === c.supersedesRunId) }))
      .filter(({ c, anterior }) => anterior && entrada(anterior) && entrada(c).magnitude.value !== entrada(anterior).magnitude.value)
      .sort((a, b) => a.c.methodName.localeCompare(b.c.methodName, 'es'))
      .map(({ c, anterior }) => ({ nombre: c.methodName, valores: `${corregido.E.valorDe(c)} antes ${corregido.E.valorDe(anterior)}` }));
    comprobar(
      'F-37',
      'Al corregir sale un solo pedido, con el valor, el motivo y la unidad de la medición. El panel sigue abierto y lo dice: el valor que rige es el corregido, con la marca «Corregida», y la historia tiene la corrección (con su motivo, «La corregiste vos» y marcada como el valor vigente) y el valor original, que se conserva',
      escrituras(`/anthropometry/evaluations/${T.evaluationId}/corrections`, alCorregir).length === 1 &&
        cinturaAhora.effectiveMagnitude.value === 84 &&
        cinturaAhora.magnitude.value === cintura.magnitude.value &&
        trasCorregir.panel?.exito === 'Corrección registrada. El valor original se conserva.' &&
        trasCorregir.panel.valor === '84 cm' &&
        trasCorregir.panel.marcas.includes('Corregida') &&
        trasCorregir.panel.formulario === null &&
        igual(trasCorregir.panel.historia, corregido.E.historiaDe(cinturaAhora)) &&
        trasCorregir.panel.historia[0]?.titulo === 'Corrección: 84 cm Valor vigente' &&
        trasCorregir.panel.historia[0].nota === `Por qué se corrigió: «${MOTIVO}». La corregiste vos.` &&
        trasCorregir.panel.historia.at(-1).titulo === `Valor original: ${antes.E.num(cintura.magnitude.value)} cm`,
      `pedidos: ${escrituras('/corrections', alCorregir).length} · «${trasCorregir.panel?.exito}» · ${trasCorregir.panel?.valor} · ${trasCorregir.panel?.historia.map((h) => `${h.titulo} — ${h.nota}`).join(' | ').slice(0, 200)}`,
    );
    const bloqueDelCambio = trasCorregir.panel?.bloques.find((b) => b.titulo === 'Lo que cambió con la corrección') ?? null;
    comprobar(
      'F-38',
      '«Lo que cambió con la corrección» lista los resultados que la API volvió a calcular porque usaban la cintura, cada uno con el valor de ahora y el de antes (el de la corrida que reemplaza, según la API): no uno más ni uno menos, y ningún resultado que no la usa',
      recalculadas.length >= 2 &&
        !!bloqueDelCambio &&
        bloqueDelCambio.texto.includes(`Se volvieron a calcular los ${recalculadas.length} resultados que usan esta medición. Los anteriores se conservan, sin efecto.`) &&
        igual(trasCorregir.panel.cambios, [{ clase: 'recalculados', filas: recalculadas }]) &&
        !recalculadas.some((r) => /Índice de masa corporal/.test(r.nombre)),
      `${recalculadas.map((r) => `${r.nombre}: ${r.valores}`).join(' · ')} — a la vista: ${JSON.stringify(trasCorregir.panel?.cambios ?? null).slice(0, 200)}`,
    );
    const faltasConElCambio = await axe(page);
    await cerrarPanel();
    const conLaCorreccion = await tomasEnPantalla(page);
    const resultadosCorregidos = corregido.E.resultadosDe(T.evaluationId);
    comprobar(
      'F-39',
      'Cerrado el panel, la toma ya dice lo nuevo sin volver a entrar: la fila de la cintura muestra 84 con «Corregida», la lista dice «1 corregida», los resultados que usaban la cintura muestran su valor nuevo, y los anteriores quedan a un clic («Ver N anteriores, sin efecto»), cada uno con «Sin efecto»',
      igual(conLaCorreccion.toma?.familias.map((f) => ({ familia: f.familia, titulo: f.titulo, filas: f.filas })), corregido.toma.familias) &&
        corregido.toma.familias.flatMap((f) => f.filas).find((x) => x.id === cintura.measurementId)?.valor === '84' &&
        (conLaCorreccion.tramos ?? []).flatMap((x) => x.tomas).find((x) => x.id === T.evaluationId)?.cuentas === '30 mediciones · 1 corregida' &&
        igual(conLaCorreccion.toma.categorias, resultadosCorregidos.categorias) &&
        resultadosCorregidos.sinEfecto.length === recalculadas.length &&
        conLaCorreccion.toma.anteriores === `Ver ${recalculadas.length} anteriores, sin efecto`,
      `la fila: ${JSON.stringify(conLaCorreccion.toma?.familias.flatMap((f) => f.filas).find((x) => x.id === cintura.measurementId) ?? null).slice(0, 150)} · «${conLaCorreccion.toma?.anteriores}»`,
    );
    await clic(page, 'article.toma-abierta button[aria-controls="anteriores-sin-efecto"]', 'anteriores').catch(() => null);
    await pausa(250);
    const conLosAnteriores = await tomasEnPantalla(page);
    const sinEfectoEsperados = resultadosCorregidos.sinEfecto.map((c) => ({ id: c.calculationRunId, nombre: c.methodName, valor: corregido.E.valorDe(c) }));
    const mismos = (a, b) => igual([...a].sort((x, y) => x.id.localeCompare(y.id)), [...b].sort((x, y) => x.id.localeCompare(y.id)));
    comprobar(
      'F-39',
      'Los cálculos que quedaron sin efecto se abren a pedido, en el lugar: son los que la API da por reemplazados, cada uno con su método y el valor que tenía',
      sinEfectoEsperados.length > 0 && mismos(conLosAnteriores.toma?.sinEfecto ?? [], sinEfectoEsperados),
      `${(conLosAnteriores.toma?.sinEfecto ?? []).map((x) => `${x.nombre} ${x.valor}`).join(' · ')}`,
    );

    // ── Anular un pliegue que alimenta una suma: el resultado queda sin efecto, sin un cero en su lugar ───────────────
    const pantorrilla = corregido.detalle.measurements.find((m) => m.metric === 'pliegue-pantorrilla');
    const RAZON = 'El calibre estaba mal apoyado';
    const ANULAR = `${PANEL} [data-formulario="anular"]`;
    await abrirFila(fila(pantorrilla.measurementId));
    await clic(page, `${PANEL} .medicion-abierta__pie button`, 'Anular esta medición');
    await page.waitForSelector(ANULAR, { timeout: 10_000 }).catch(() => {});
    const antesDeAnular = await page.evaluate(() => {
      const f = document.querySelector('dialog.dialogo--panel[open] [data-formulario="anular"]');
      const aviso = f?.querySelector('.aviso');
      const boton = [...(f?.querySelectorAll('.acciones button') ?? [])].find((b) => b.innerText.includes('Anular esta medición'));
      return { aviso: aviso?.innerText.replace(/\s+/g, ' ').trim() ?? '', avisoAntesDelBoton: !!aviso && !!boton && !!(aviso.compareDocumentPosition(boton) & Node.DOCUMENT_POSITION_FOLLOWING), apagado: boton?.disabled ?? null, primario: boton?.classList.contains('boton--primario') ?? null };
    });
    await escribir(`#anul-motivo-${pantorrilla.measurementId}`, RAZON);
    const alAnular = v.urls.length;
    await clic(page, `${ANULAR} .acciones button`, 'Anular esta medición');
    await page.waitForSelector(`${PANEL} .aviso--exito`, { timeout: 20_000 }).catch(() => {});
    await quieto(page, v);
    const anulado = await leerTodo();
    const trasAnular = await tomasEnPantalla(page);
    const pantorrillaAhora = anulado.detalle.measurements.find((m) => m.measurementId === pantorrilla.measurementId);
    const quedaronSinEfecto = anulado.corridas
      .filter((c) => c.evaluationId === T.evaluationId && !c.effective && c.supersededByRunId === null && c.inputProvenance.some((i) => i.sourceRef === pantorrilla.measurementId))
      .sort((a, b) => a.methodName.localeCompare(b.methodName, 'es'))
      .map((c) => ({ nombre: c.methodName, valores: `antes ${anulado.E.valorDe(c)}` }));
    comprobar(
      'F-37',
      'Anular dice antes del botón que no borra nada y que no se reactiva, pide el motivo (sin él, el botón está apagado) y su botón no es el principal. Al anular sale un solo pedido; el panel sigue abierto y dice «Anulada», conserva el valor, cuenta la anulación con su motivo («La anulaste vos») y ya no ofrece ninguna acción',
      /Anular no borra nada/.test(antesDeAnular.aviso) &&
        /Una medición anulada no se reactiva\./.test(antesDeAnular.aviso) &&
        antesDeAnular.avisoAntesDelBoton &&
        antesDeAnular.apagado === true &&
        antesDeAnular.primario === false &&
        escrituras(`/anthropometry/measurements/${pantorrilla.measurementId}/annulments`, alAnular).length === 1 &&
        pantorrillaAhora.condition === 'ANNULLED' &&
        trasAnular.panel?.exito === 'Medición anulada. Su historia se conserva.' &&
        trasAnular.panel.marcas.includes('Anulada') &&
        !trasAnular.panel.marcas.includes('Vigente') &&
        trasAnular.panel.valor === `${anulado.E.num(pantorrilla.magnitude.value)} mm` &&
        igual(trasAnular.panel.historia, anulado.E.historiaDe(pantorrillaAhora)) &&
        trasAnular.panel.historia[0]?.nota === `Por qué se anuló: «${RAZON}». La anulaste vos.` &&
        igual(trasAnular.panel.acciones, []),
      `antes: «${antesDeAnular.aviso.slice(0, 60)}…» · pedidos: ${escrituras('/annulments', alAnular).length} · «${trasAnular.panel?.exito}» · ${trasAnular.panel?.marcas.join(', ')} · ${trasAnular.panel?.historia[0]?.nota} · acciones: ${trasAnular.panel?.acciones.length}`,
    );
    const bloqueDeLaAnulacion = trasAnular.panel?.bloques.find((b) => b.titulo === 'Lo que pasó con los resultados') ?? null;
    await cerrarPanel();
    const conLaAnulacion = await tomasEnPantalla(page);
    const resultadosTrasAnular = anulado.E.resultadosDe(T.evaluationId);
    comprobar(
      'F-38',
      'Los resultados que usaban la medición anulada quedan sin efecto y sin un cálculo que los reemplace: el panel los nombra con el valor que tenían y dice que no se reemplazan por cero; en la toma dejan de estar entre los vigentes (no aparece un cero ni un resultado vacío) y pasan a los anteriores. La fila queda con «Anulada» y su valor, y la lista dice «1 anulada»',
      quedaronSinEfecto.length >= 1 &&
        !!bloqueDeLaAnulacion &&
        bloqueDeLaAnulacion.texto.includes('No se pudo recalcular: falta una medición vigente. No se reemplaza por cero.') &&
        igual(trasAnular.panel.cambios, [{ clase: 'sin-recalcular', filas: quedaronSinEfecto }]) &&
        igual(conLaAnulacion.toma?.categorias, resultadosTrasAnular.categorias) &&
        !resultadosTrasAnular.categorias.flatMap((c) => c.resultados).some((r) => quedaronSinEfecto.some((q) => q.nombre === r.nombre)) &&
        igual(conLaAnulacion.toma.familias.map((f) => ({ familia: f.familia, titulo: f.titulo, filas: f.filas })), anulado.toma.familias) &&
        anulado.toma.familias.flatMap((f) => f.filas).find((x) => x.id === pantorrilla.measurementId)?.anulada === true &&
        (conLaAnulacion.tramos ?? []).flatMap((x) => x.tomas).find((x) => x.id === T.evaluationId)?.cuentas === '30 mediciones · 1 corregida · 1 anulada',
      `${quedaronSinEfecto.map((r) => `${r.nombre}: ${r.valores}`).join(' · ')} · «${(bloqueDeLaAnulacion?.texto ?? '').slice(0, 140)}» · vigentes: ${resultadosTrasAnular.categorias.flatMap((c) => c.resultados).length}`,
    );

    // ── Calcular con un método que la toma cubre y todavía no tiene ───────────────────────────────────────────────
    const vigentesAhora = new Set(anulado.corridas.filter((c) => c.evaluationId === T.evaluationId && anulado.E.vigente(c)).map((c) => c.methodVersionId));
    const conValor = new Set(anulado.detalle.measurements.filter((m) => m.condition === 'EFFECTIVE' && m.effectiveMagnitude).map((m) => m.metric));
    const metodo =
      anulado.metodos.find((m) => /conicidad/i.test(m.name) && !vigentesAhora.has(m.methodVersionId) && m.requiredInputs.every((x) => conValor.has(x.metric))) ??
      anulado.metodos.find((m) => !vigentesAhora.has(m.methodVersionId) && m.requiredInputs.every((x) => conValor.has(x.metric)));
    await clic(page, 'article.toma-abierta .toma-abierta__acciones-de-bloque button', 'Calcular con un método');
    await page.waitForSelector(`${PANEL} .nuevo-calculo`, { timeout: 15_000 }).catch(() => {});
    if (metodo) await page.select('#cal-metodo', metodo.methodVersionId);
    await pausa(300);
    const fichaDelMetodo = await texto(page, `${PANEL} .ficha-de-metodo`);
    const alCalcular = v.urls.length;
    await clic(page, `${PANEL} .nuevo-calculo > .acciones button`, 'Calcular');
    await page.waitForSelector(`${PANEL} .resultado-abierto .aviso--exito`, { timeout: 20_000 }).catch(() => {});
    await quieto(page, v);
    const calculado = await leerTodo();
    const trasCalcular = await tomasEnPantalla(page);
    const nueva = calculado.corridas.find((c) => c.evaluationId === T.evaluationId && c.methodVersionId === metodo?.methodVersionId && calculado.E.vigente(c)) ?? null;
    await cerrarPanel();
    const conElNuevo = await tomasEnPantalla(page);
    comprobar(
      'F-39',
      '«Calcular con un método» muestra la ficha del método elegido con lo que pide; al calcular sale un solo pedido y el panel pasa a mostrar el resultado nuevo, con su método, su valor con la precisión declarada y sus entradas. Cerrado el panel, el resultado está en su categoría, sin haber vuelto a entrar',
      !!metodo &&
        !!nueva &&
        fichaDelMetodo.includes(metodo.name) &&
        escrituras(`/advisees/${A}/calculations`, alCalcular).length === 1 &&
        trasCalcular.panel?.titulo === 'Resultado calculado' &&
        trasCalcular.panel.exito === 'Cálculo registrado. Queda con su método, su versión y sus entradas a la vista.' &&
        trasCalcular.panel.deDonde === nueva.methodName &&
        trasCalcular.panel.valor === calculado.E.valorDe(nueva) &&
        trasCalcular.panel.entradas === nueva.inputProvenance.length &&
        igual(conElNuevo.toma?.categorias, calculado.E.resultadosDe(T.evaluationId).categorias) &&
        conElNuevo.toma.categorias.flatMap((c) => c.resultados).some((r) => r.id === nueva.calculationRunId),
      metodo ? `«${metodo.name}» · pedidos: ${escrituras('/calculations', alCalcular).length} · ${trasCalcular.panel?.deDonde} ${trasCalcular.panel?.valor} · ${trasCalcular.panel?.entradas} entradas` : 'no hay un método que la toma cubra y no tenga calculado',
    );

    // ── Dejar un resultado como referencia: un acto del profesional, dicho antes del botón ─────────────────────────────
    const paraReferencia = calculado.corridas.find((c) => c.evaluationId === T.evaluationId && calculado.E.vigente(c) && !c.referenceForPurpose && /7 pliegues, mujeres/.test(c.methodName)) ?? calculado.corridas.find((c) => c.evaluationId === T.evaluationId && calculado.E.vigente(c) && !c.referenceForPurpose);
    await abrirFila(`button.resultado-de-la-toma[data-resultado="${paraReferencia.calculationRunId}"]`);
    await clic(page, `${PANEL} .medicion-abierta__pie button`, 'Dejar como referencia');
    await page.waitForSelector(`${PANEL} [data-formulario="referencia"]`, { timeout: 10_000 }).catch(() => {});
    const antesDeLaReferencia = await texto(page, `${PANEL} [data-formulario="referencia"] .aviso`);
    await escribir(`#ref-fundamento-${paraReferencia.calculationRunId}`, 'Es el método con que la vengo siguiendo');
    const alAdoptar = v.urls.length;
    await clic(page, `${PANEL} [data-formulario="referencia"] .acciones button`, 'Dejar como referencia');
    await page.waitForSelector(`${PANEL} .aviso--exito`, { timeout: 20_000 }).catch(() => {});
    await quieto(page, v);
    const conReferencia = await leerTodo();
    const trasAdoptar = await tomasEnPantalla(page);
    await cerrarPanel();
    const alFinal = await tomasEnPantalla(page);
    const referencias = conReferencia.corridas.filter((c) => c.referenceForPurpose && c.purpose === paraReferencia.purpose).map((c) => c.calculationRunId);
    comprobar(
      'F-39',
      '«Dejar como referencia» explica antes del botón que no cambia el cálculo ni borra los otros; al confirmarlo sale un solo pedido, el panel lo dice, el resultado queda marcado «Referencia» en el panel y en la toma, y ya no ofrece dejarlo otra vez. Es el único marcado: BE no marca ninguno por su cuenta',
      /no cambia el cálculo ni borra los otros/.test(antesDeLaReferencia) &&
        escrituras(`/advisees/${A}/calculation-references/`, alAdoptar).length === 1 &&
        igual(referencias, [paraReferencia.calculationRunId]) &&
        /^Referencia registrada\. Los demás cálculos se conservan\./.test(trasAdoptar.panel?.exito ?? '') &&
        trasAdoptar.panel.marcas.includes('Referencia') &&
        igual(trasAdoptar.panel.acciones, []) &&
        igual(alFinal.toma?.categorias, conReferencia.E.resultadosDe(T.evaluationId).categorias) &&
        igual(alFinal.toma.categorias.flatMap((c) => c.resultados).filter((r) => r.marcas.includes('Referencia')).map((r) => r.id), [paraReferencia.calculationRunId]),
      `«${paraReferencia.methodName}» · pedidos: ${escrituras('/calculation-references/', alAdoptar).length} · «${trasAdoptar.panel?.exito}» · con «Referencia» en la toma: ${alFinal.toma?.categorias.flatMap((c) => c.resultados).filter((r) => r.marcas.includes('Referencia')).map((r) => r.nombre).join(', ')}`,
    );
    const faltas = await axe(page);
    comprobar('F-37', 'axe no encuentra faltas en la toma completa, ni en el panel de una medición corregida con lo que cambió', faltas.length === 0 && faltasConElCambio.length === 0, `la toma: ${faltas.map((f) => f.id).join(', ') || 'sin faltas'} · el panel: ${faltasConElCambio.map((f) => f.id).join(', ') || 'sin faltas'}`);
    comprobar('—', 'Corregir, anular, calcular y dejar una referencia no produjeron errores de página', v.errores.length === 0, v.errores.slice(0, 3).join(' | '));
  } finally {
    await navegador.close();
  }
}

async function fichaRecompuesta({ resumen = true, linea = true, analizar = true, espacio = true, areas = true, registros = true, sesiones = true, tomas = true, estimacion = false } = {}) {
  const { navegador, page, v } = await abrir();
  // Los guiones que pide la página, desde antes de entrar: para saber con qué se cargó la ficha.
  const guiones = [];
  page.on('request', (r) => {
    if (r.resourceType() === 'script') guiones.push(new URL(r.url()).pathname.split('/').pop());
  });
  try {
    await iniciarSesion(page, v, estado.proCorreo, FICHA_A);
    await quieto(page, v);
    // Cada parte responde por sus propios errores.
    const empezarDeCero = () => {
      v.errores.length = 0;
      v.malas.length = 0;
    };
    if (resumen) await resumenPorArea(page, v, guiones);
    if (linea) {
      empezarDeCero();
      await lineaPorDia(page, v);
    }
    if (analizar) {
      empezarDeCero();
      await analizarRecompuesto(page, v);
    }
    if (espacio) {
      empezarDeCero();
      await espacioProfesional(page, v);
    }
    if (areas) {
      empezarDeCero();
      await marcoDeLasAreas(page, v);
    }
    if (registros) {
      empezarDeCero();
      await registrosDeNutricion(page, v);
    }
    if (sesiones) {
      empezarDeCero();
      await sesionesDeEntrenamiento(page, v);
    }
    if (tomas) {
      empezarDeCero();
      await tomasDeAntropometria(page, v);
    }
    // Escribe en el escenario: solo cuando se lo pide (`estimacion`), nunca dentro de `funcional`.
    if (estimacion) {
      empezarDeCero();
      await estimacionDeUnaComida(page, v);
    }
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
    await page.evaluate(() => [...document.querySelectorAll('.linea-de-tiempo__hechos > .entrada .entrada__fila')][0].click());
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
/**
 * En el escenario descartable, antes de revocar: pedir un vínculo desde el diálogo del Espacio profesional (un área que
 * el profesional todavía no tiene con esa persona) y volver a pedirlo. La primera vez la solicitud se crea: el diálogo
 * se cierra y la página lo dice. La segunda ya hay una igual pendiente: se abre la lista de solicitudes, que la
 * muestra. Devuelve lo que se veía y lo que decía la API, para comparar después de revocar.
 */
async function solicitarDesdeElEspacio(pro, d) {
  const { page, v } = pro;
  const formulario = 'dialog.dialogo--formulario';
  await cupo(v, 60);
  await ir(page, '/pro');
  await page.waitForSelector('section.pendientes', { timeout: 30_000 });
  await quieto(page, v);
  const pantalla = await espacioEnPantalla(page);
  const parcialDeLaApi = (await leerApi(v, '/me/portfolio?limit=50')).data.partialView;
  const yo = (await leerApi(v, '/me')).data;
  const enviadas = async () => (await leerApi(v, '/me/relationship-requests')).data.filter((x) => x.professional.identityId === yo.identityId && x.initiatedBy === 'PROFESSIONAL');
  const AREAS = { NUTRICION: 'Nutrición · Acompañamiento nutricional', ENTRENAMIENTO: 'Entrenamiento · Planificación del entrenamiento', ANTROPOMETRIA: 'Antropometría · Evaluación antropométrica' };
  const libre = Object.keys(AREAS).find((a) => !Object.keys(d.vinculos).includes(a));
  if (!libre) {
    informar('E-91', 'El envío de una solicitud desde el diálogo', 'el escenario descartable ya tiene vínculo en las tres áreas');
    return { pantalla, parcialDeLaApi };
  }
  const antes = await enviadas();
  const pedir = async () => {
    await page.click('.espacio-profesional__solicitar');
    await page.waitForSelector(`${formulario}[open]`, { timeout: 5_000 });
    await page.click(`${formulario} input`, { clickCount: 3 });
    await page.type(`${formulario} input`, d.aseId);
    await page.select(`${formulario} select`, libre);
    await clic(page, `${formulario} .acciones button`, 'Solicitar vínculo');
    await page.waitForFunction((s) => !document.querySelector(s).open, { timeout: 20_000 }, formulario).catch(() => {});
    await quieto(page, v);
    await pausa(400);
  };
  await pedir();
  const primera = {
    formularioAbierto: await page.evaluate((s) => document.querySelector(s).open, formulario),
    aviso: await texto(page, '.aviso-flotante'),
    listaAbierta: await page.evaluate(() => document.querySelector('dialog.dialogo--solicitudes').open),
    pantalla: await espacioEnPantalla(page),
    enLaApi: await enviadas(),
  };
  const creada = primera.enLaApi.find((s) => s.advisee.identityId === d.aseId && s.scope.code === libre && s.state === 'PENDIENTE');
  const pendientes = (lista) => lista.filter((s) => s.state === 'PENDIENTE').length;
  comprobar(
    'E-91',
    'Enviar una solicitud desde el diálogo la crea (la API la tiene, pendiente): el diálogo se cierra, la página dice «Solicitud enviada. El asesorado decide si la acepta.», y el pie del directorio cuenta una más y dice cuántas esperan respuesta',
    Boolean(creada) &&
      primera.enLaApi.length === antes.length + 1 &&
      !primera.formularioAbierto &&
      !primera.listaAbierta &&
      /Solicitud enviada\. El asesorado decide si la acepta\./.test(primera.aviso) &&
      primera.pantalla.solicitudes === `Solicitudes enviadas (${primera.enLaApi.length})` &&
      primera.pantalla.sinResponder === `${pendientes(primera.enLaApi)} ${pendientes(primera.enLaApi) === 1 ? 'pendiente de respuesta' : 'pendientes de respuesta'}` &&
      pantalla.solicitudes === `Solicitudes enviadas (${antes.length})`,
    `${pantalla.solicitudes} → ${primera.pantalla.solicitudes} · ${primera.pantalla.sinResponder} · aviso: ${primera.aviso.slice(0, 80)}`,
  );
  await pedir();
  const segunda = {
    formularioAbierto: await page.evaluate((s) => document.querySelector(s).open, formulario),
    lista: await page.evaluate(() => {
      const l = document.querySelector('dialog.dialogo--solicitudes');
      return { abierta: l.open, aviso: l.querySelector('.aviso')?.innerText.replace(/\s+/g, ' ').trim() ?? null, filas: [...l.querySelectorAll('tbody tr')].map((f) => [...f.querySelectorAll('td')].slice(0, 3).map((c) => c.innerText.replace(/\s+/g, ' ').trim()).join(' | ')) };
    }),
    enLaApi: await enviadas(),
  };
  comprobar(
    'E-91',
    'Pedir de nuevo lo mismo no crea otra solicitud: el diálogo se cierra y se abre la lista de solicitudes, que arriba dice «Ya hay una solicitud pendiente igual. Te mostramos esa.» y la muestra, pendiente',
    segunda.enLaApi.length === primera.enLaApi.length &&
      !segunda.formularioAbierto &&
      segunda.lista.abierta &&
      segunda.lista.aviso === 'Ya hay una solicitud pendiente igual. Te mostramos esa.' &&
      segunda.lista.filas.length === segunda.enLaApi.length &&
      segunda.lista.filas.some((f) => f.endsWith(`${AREAS[libre]} | Pendiente`)),
    `${segunda.lista.aviso} · ${segunda.lista.filas.join(' ; ')}`,
  );
  if (segunda.lista.abierta) {
    await clic(page, 'dialog.dialogo--solicitudes .acciones button', 'Cerrar');
    await page.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 5_000 });
  }
  return { pantalla, parcialDeLaApi };
}

async function descartable() {
  const d = estado.descartable;
  if (!d?.datos) throw new Error('falta el escenario descartable: datos/generar.mjs descartable-cuentas y descartable-datos');
  const FICHA_D = `/pro/advisees?id=${d.aseId}`;
  const URL_D = `${FICHA_D}&vista=analizar&m=${encodeURIComponent('antropometria.peso,antropometria.imc')}`;
  const pro = await abrir();
  try {
    await iniciarSesion(pro.page, pro.v, d.proCorreo, FICHA_D);
    await quieto(pro.page, pro.v);
    // El Espacio profesional, antes de revocar (WP-ESCRITORIO-AMABLE, parte 5): el envío de una solicitud desde su
    // diálogo, que acá no cambia los datos de los otros recorridos, y el punto de partida del aviso de vista parcial.
    const espacioAntes = await solicitarDesdeElEspacio(pro, d);
    // La positiva de la negativa del final: antes de revocar, la línea de tiempo trae las tomas, con el mismo selector.
    await ir(pro.page, `${FICHA_D}&vista=linea`);
    await quieto(pro.page, pro.v);
    const tomasAntesDeRevocar = (await textos(pro.page, '.linea-de-tiempo__hechos > .entrada')).filter((e) => /Toma/.test(e)).length;
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
    await abrirOrigen(pro.page);
    await quieto(pro.page, pro.v);
    const origenAntes = await texto(pro.page, ORIGEN);
    await cerrarOrigen(pro.page);
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
    await abrirOrigen(pro.page);
    await quieto(pro.page, pro.v);
    const origenDespues = await texto(pro.page, ORIGEN);
    comprobar('PRO-20', 'Después de revocar, el origen de un punto que seguía en pantalla dice «no está disponible con tu acceso actual» y no repite el valor', /no está disponible con tu acceso actual/.test(origenDespues) && !/80,5|81,2/.test(origenDespues), origenDespues.slice(0, 200));
    await cerrarOrigen(pro.page);
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
    const entradasDeLaLinea = await textos(pro.page, '.linea-de-tiempo__hechos > .entrada');
    const pestanas = await textos(pro.page, 'nav[aria-label="Vistas del seguimiento"] a');
    comprobar(
      'PRO-20',
      'Al volver a abrir Analizar y la línea de tiempo, no hay gráficos, valores ni tomas de Antropometría (antes de revocar, la línea las traía), ni el aviso de una descarga anterior; el resto del vínculo sigue',
      (reabierto.match(/no está disponible con tu acceso actual/g) ?? []).length === 2 && !avisoViejo && tomasAntesDeRevocar > 0 && !entradasDeLaLinea.some((e) => /Toma|kg/.test(e)) && pestanas.length === 3,
      `${reabierto.slice(0, 140)} · aviso de una descarga anterior: ${avisoViejo ? 'sí' : 'no'} · antes de revocar, ${tomasAntesDeRevocar} toma(s) en la línea de tiempo; después, ${entradasDeLaLinea.length} renglón/es y ninguno de Antropometría`,
    );
    // d) El Espacio profesional, después de revocar: el aviso de vista parcial, con una respuesta real de la API, y el
    // área revocada dicha con las palabras de BE. Antes de revocar, con el mismo selector, no había nada.
    await cupo(pro.v, 60);
    await ir(pro.page, '/pro');
    await pro.page.waitForSelector('section.pendientes', { timeout: 30_000 });
    await quieto(pro.page, pro.v);
    const espacioDespues = await espacioEnPantalla(pro.page);
    // La imagen del aviso real y del área revocada, en el tema claro (la de la respuesta simulada es otra).
    await ponerTema(pro.page, 'claro');
    await pausa(300);
    await captura(pro.page, pro.v, 'espacio-despues-de-revocar-1440-claro');
    const carteraDespues = (await leerApi(pro.v, '/me/portfolio?limit=50')).data;
    const revocado = (await leerApi(pro.v, '/me/relationships')).data.find((x) => x.relationshipId === d.vinculos.ANTROPOMETRIA);
    const personaDespues = espacioDespues.personas.find((p) => p.id === d.aseId);
    comprobar(
      'E-88',
      'Después de revocar, la API dice que hay datos fuera del alcance del profesional y el Espacio profesional lo avisa debajo de las vistas, con el texto de BE (antes de revocar no había aviso ni la API lo decía); ningún pendiente es de Antropometría',
      espacioAntes.parcialDeLaApi === false && espacioAntes.pantalla.parcial === null && carteraDespues.partialView === true && espacioDespues.parcial === 'Hay datos de algún asesorado que no podés ver desde tu alcance: no se cuentan acá.' && !espacioDespues.filas.some((f) => f.area === 'anthropometry') && !carteraDespues.items.some((p) => p.domain === 'anthropometry'),
      `antes: partialView ${espacioAntes.parcialDeLaApi}, aviso ${espacioAntes.pantalla.parcial ?? 'no está'} · después: partialView ${carteraDespues.partialView}, «${espacioDespues.parcial ?? 'no está'}» · filas: ${espacioDespues.filas.map((f) => `${f.nombreDelArea} · ${f.texto}`).join(' | ') || 'ninguna'}`,
    );
    comprobar(
      'E-89',
      'Después de revocar, el directorio dice el área sin acceso con el candado y las palabras de BE («Consentimiento revocado · Acceso no disponible»), y las otras siguen nombradas; antes de revocar, Antropometría estaba entre las áreas con acceso',
      revocado?.consentState === 'REVOKED' &&
        (espacioAntes.pantalla.personas.find((p) => p.id === d.aseId)?.conAcceso ?? '').includes('Antropometría') &&
        espacioAntes.pantalla.personas.find((p) => p.id === d.aseId)?.sinAcceso.length === 0 &&
        personaDespues?.sinAcceso.includes('Antropometría: Consentimiento revocado · Acceso no disponible') &&
        !(personaDespues?.conAcceso ?? '').includes('Antropometría') &&
        (personaDespues?.conAcceso ?? '').length > 0,
      `antes: ${espacioAntes.pantalla.personas.find((p) => p.id === d.aseId)?.conAcceso} · después: ${personaDespues?.conAcceso} · ${personaDespues?.sinAcceso.join('; ')}`,
    );
    // e) El marco de un área, después de revocar (WP-ESCRITORIO-AREAS, parte 0), con respuestas reales de la API: el de
    // Antropometría dice el estado de su vínculo con las palabras de BE y no «Activo», y su sección, el texto neutral.
    // El de un área que sigue con acceso, mirado con el mismo selector, dice «Activo».
    const RUTA_DEL_ALCANCE = { NUTRICION: 'nutrition', ENTRENAMIENTO: 'training', ANTROPOMETRIA: 'anthropometry' };
    const conAcceso = (await leerApi(pro.v, '/me/relationships')).data.find(
      (x) => x.advisee.identityId === d.aseId && x.scope.code !== 'ANTROPOMETRIA' && x.relationshipState === 'ACEPTADO' && x.consentState === 'ACTIVE' && x.accessMode === 'CONTEXTUAL',
    );
    const abrirArea = async (clave) => {
      await cupo(pro.v, 60);
      await ir(pro.page, `/pro/advisees/${clave}?id=${d.aseId}`);
      await pro.page.waitForSelector('header.marco-del-area .ficha__consulta .nota', { timeout: 30_000 });
      await quieto(pro.page, pro.v);
    };
    await abrirArea(RUTA_DEL_ALCANCE[conAcceso?.scope.code] ?? 'nutrition');
    const marcoConAcceso = await marcoEnPantalla(pro.page);
    await abrirArea('anthropometry');
    await pro.page.waitForFunction(() => /No encontramos un recurso disponible/.test(document.querySelector('.seccion-del-area')?.innerText ?? ''), { timeout: 30_000 }).catch(() => {});
    await quieto(pro.page, pro.v);
    const marcoRevocado = await marcoEnPantalla(pro.page);
    comprobar(
      'F-09',
      'Después de una revocación real, el marco de Antropometría dice «Consentimiento revocado» y «Acceso no disponible», no «Activo», y su sección dice el texto neutral de siempre; el de un área que sigue con acceso dice «Activo · acceso contextual»',
      !!conAcceso &&
        marcoRevocado?.acceso === 'Acceso actual Antropometría: Consentimiento revocado Acceso no disponible' &&
        !/Activo/.test(marcoRevocado.acceso) &&
        marcoRevocado.cuerpo.includes('No encontramos un recurso disponible para esta acción.') &&
        marcoRevocado.pestanas.length === 3 &&
        marcoConAcceso?.acceso === `Acceso actual ${conAcceso.scope.label}: Activo · acceso contextual`,
      `Antropometría: ${marcoRevocado?.acceso} · «${(marcoRevocado?.cuerpo ?? '').slice(0, 70)}» · ${conAcceso?.scope.label ?? 'sin otra área con acceso'}: ${marcoConAcceso?.acceso}`,
    );
    // La imagen del marco con el área revocada (el tema claro quedó puesto en el paso anterior).
    await captura(pro.page, pro.v, 'area-despues-de-revocar-1440-claro');
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
  if (modo === 'analizar') await fichaRecompuesta({ tomas: false, resumen: false, linea: false, espacio: false, areas: false, registros: false, sesiones: false });
  if (modo === 'resumen') await fichaRecompuesta({ tomas: false, linea: false, analizar: false, espacio: false, areas: false, registros: false, sesiones: false });
  if (modo === 'linea') await fichaRecompuesta({ tomas: false, resumen: false, analizar: false, espacio: false, areas: false, registros: false, sesiones: false });
  if (modo === 'espacio') await fichaRecompuesta({ tomas: false, resumen: false, linea: false, analizar: false, areas: false, registros: false, sesiones: false });
  if (modo === 'areas') await fichaRecompuesta({ tomas: false, resumen: false, linea: false, analizar: false, espacio: false, registros: false, sesiones: false });
  if (modo === 'registros') await fichaRecompuesta({ tomas: false, resumen: false, linea: false, analizar: false, espacio: false, areas: false, sesiones: false });
  if (modo === 'sesiones') await fichaRecompuesta({ tomas: false, resumen: false, linea: false, analizar: false, espacio: false, areas: false, registros: false });
  if (modo === 'tomas') await fichaRecompuesta({ resumen: false, linea: false, analizar: false, espacio: false, areas: false, registros: false, sesiones: false });
  if (modo === 'mediciones') await medicionesDeUnaToma();
  if (modo === 'estimacion') await fichaRecompuesta({ tomas: false, resumen: false, linea: false, analizar: false, espacio: false, areas: false, registros: false, sesiones: false, estimacion: true });
} catch (e) {
  comprobar('—', 'El recorrido terminó por una excepción', false, e instanceof Error ? e.message : String(e));
} finally {
  const fallas = resultados.filter((r) => !r.ok);
  fs.writeFileSync(new URL(`resultado-${modo}.json`, DIR), JSON.stringify({ modo, inicio: inicio.toISOString(), fin: new Date().toISOString(), hoy, total: resultados.length, fallas: fallas.length, resultados }, null, 2));
  console.log(`\n${resultados.length - fallas.length}/${resultados.length} comprobaciones bien${fallas.length ? `; fallan: ${fallas.map((f) => f.pro).join(', ')}` : ''}`);
  process.exitCode = fallas.length ? 1 : 0;
}
