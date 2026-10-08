// Recorrido real del entorno profesional (encargo §18; ACEPTACION.md): Chrome contra la web y la API locales, con los datos
// sintéticos de `datos/regenerar.sh`. Interactúa con los controles y comprueba resultados; las capturas complementan.
//
// Uso: node recorrido.mjs [funcional|capturas|todo]   (lee trabajo/estado.json; escribe trabajo/recorrido/)
//
// - Una sesión por cuenta y por navegador (el límite de inicios es 5 cada 15 minutos).
// - Respeta el cupo de 120 lecturas protegidas por minuto: si se acerca, espera (`cupo`).
// - Las fallas (503, 429, sin red) y la respuesta lenta se simulan interceptando pedidos en el navegador: no se toca la
//   API ni la base.
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
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const hoy = estado.hoy;
const diaMenos = (fecha, n) => new Date(Date.parse(`${fecha}T12:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);
const FICHA_A = `/pro/advisees?id=${estado.aseId}`;
const FICHA_B = `/pro/advisees?id=${estado.aseBId}`;
const TRES = 'nutricion.energia,nutricion.proteinas,antropometria.peso';
/** El nombre de la vista guardada de esta corrida (único: una corrida interrumpida puede dejar otra). */
const VISTA = `Recorrido ${new Date().toISOString().slice(11, 19).replace(/:/g, '')}`;

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
  const v = { enVuelo: 0, ultimo: Date.now(), marcas: [], errores: [], malas: [], reglas: [] };
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    const url = req.url();
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
  await page.waitForFunction(() => location.pathname.startsWith('/pro/advisees'), { timeout: 60_000 });
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

async function axe(page) {
  await page.evaluate(AXE);
  return page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
    return r.violations.map((x) => ({ id: x.id, impacto: x.impact, nodos: x.nodes.length, ejemplo: x.nodes[0]?.target?.join(' ') ?? '' }));
  });
}

/**
 * Una captura de página completa. La línea de tiempo tiene 50 entradas por página: se recorta a sus primeros 2.400 px
 * (filtros y los primeros días), que es lo que hace falta para ver el diseño; el resto es la misma entrada repetida.
 */
async function captura(page, nombre) {
  const path = fileURLToPath(new URL(`${nombre}.png`, DIR));
  if (!nombre.startsWith('linea-')) return page.screenshot({ path, fullPage: true });
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  const ancho = page.viewport()?.width ?? 1440;
  return page.screenshot({ path, clip: { x: 0, y: 0, width: ancho, height: Math.min(alto, 2400) }, captureBeyondViewport: true });
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
    await page.type('input[type="search"]', 'cena');
    await clic(page, '.filtros-de-linea button[type="submit"]', 'Buscar');
    await quieto(page, v);
    const conCena = await textos(page, '.entrada__titulo');
    comprobar('PRO-04', 'La búsqueda recorre el período y no viaja en la URL de la página', !page.url().includes('cena') && conCena.length > 0 && conCena.every((t) => /cena/i.test(t)), `${conCena.length} entradas; URL ${page.url().replace(WEB, '')}`);
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
    await clic(page, '.presets button', '¿Cómo evoluciona el peso junto con la alimentación registrada?');
    await quieto(page, v);
    const titulos = await textos(page, '.grafico__titulo');
    comprobar('PRO-06', 'Una pregunta de tres métricas dibuja tres paneles', titulos.length === 3, titulos.join(' | '));
    comprobar('PRO-07', 'Cada panel conserva su unidad (kcal, g, kg)', /kcal/.test(titulos[0]) && /\(g\)/.test(titulos[1]) && /kg/.test(titulos[2]));
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

    // Dos etapas, con el mismo criterio y sin conclusiones causales.
    await abrirDetalles(page, 'details.presets');
    await clic(page, '.presets button', '¿Qué cambió entre dos etapas?');
    await quieto(page, v);
    const comparacion = await page.evaluate(() => [...document.querySelectorAll('table')].find((t) => t.querySelector('caption')?.textContent.includes('Comparación'))?.innerText.replace(/\s+/g, ' ') ?? '');
    comprobar('PRO-18', 'La comparación de dos etapas dice criterio, n, duración y diferencia, sin causas', /B − A/.test(comparacion) && /n = \d+ de \d+ · \d+ días/.test(comparacion) && !/mejor|peor|gracias a|provoc|causó/i.test(comparacion), comparacion.slice(0, 260));

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

    // Vista guardada (se reabre en otra sesión, más abajo).
    await ir(page, `${FICHA_A}&vista=analizar&m=${encodeURIComponent(TRES)}&p=30`);
    await quieto(page, v);
    await clic(page, 'details.vistas-guardadas summary', 'Vistas guardadas');
    await page.type('details.vistas-guardadas input', VISTA);
    await clic(page, 'details.vistas-guardadas button', 'Guardar esta vista');
    await page.waitForFunction(() => document.querySelector('details.vistas-guardadas')?.innerText.includes('Guardada:'));
    comprobar('PRO-19', 'Guardar una vista la suma a la lista', (await texto(page, 'details.vistas-guardadas')).includes(VISTA));

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
      comprobar('PRO-19', 'En una sesión nueva, la vista guardada reabre la misma configuración y vuelve a pedir los datos', p.get('m') === TRES && p.get('p') === '30' && (await page.$$eval('.grafico__lienzo', (g) => g.length)) === 3, page.url().replace(WEB, ''));
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
          await captura(page, `${vista}-${ancho}-${tema}`);
          const acciones = await page.evaluate(() => ({
            pestanas: document.querySelectorAll('nav[aria-label="Vistas del seguimiento"] a').length,
            periodos: document.querySelectorAll('.periodo-del-seguimiento__opciones button').length,
          }));
          comprobar('PRO-23', `${vista} a ${ancho} px en ${tema}: sin desborde de costado, con pestañas y períodos`, (await sinDesborde(page)) && acciones.pestanas === 3 && acciones.periodos === 5);
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

// ─── Principal ────────────────────────────────────────────────────────────────────────────────

const inicio = new Date();
try {
  if (modo === 'funcional' || modo === 'todo') await funcional();
  if (modo === 'capturas' || modo === 'todo') await capturas();
} catch (e) {
  comprobar('—', 'El recorrido terminó por una excepción', false, e instanceof Error ? e.message : String(e));
} finally {
  const fallas = resultados.filter((r) => !r.ok);
  fs.writeFileSync(new URL(`resultado-${modo}.json`, DIR), JSON.stringify({ modo, inicio: inicio.toISOString(), fin: new Date().toISOString(), hoy, total: resultados.length, fallas: fallas.length, resultados }, null, 2));
  console.log(`\n${resultados.length - fallas.length}/${resultados.length} comprobaciones bien${fallas.length ? `; fallan: ${fallas.map((f) => f.pro).join(', ')}` : ''}`);
  process.exitCode = fallas.length ? 1 : 0;
}
