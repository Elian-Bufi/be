// Captura, entera y en los dos temas, las rutas que se le pidan: para mirar una pantalla mientras se la trabaja
// (WP-ESCRITORIO-AMABLE). No comprueba nada: deja las imágenes y dice el alto de cada una.
// Uso: node ver.mjs <carpeta de salida> <ancho> <nombre>=<ruta> [<nombre>=<ruta> …]
//   En la ruta, `{a}` es el asesorado A de BE_TRABAJO/estado.json, y `{nutricion.planV2}` (o cualquier otra clave del
//   archivo) trae ese identificador. La ruta va **sin la barra inicial:** Git Bash
//   convierte en ruta de Windows un argumento que la lleva después del signo igual. Ejemplo:
//   node ver.mjs "$BE_TRABAJO/ver" 1440 "tres=pro/advisees?id={a}&vista=analizar&m=nutricion.energia,antropometria.peso"
//   Para mirar algo desplegado, la ruta puede terminar en `#clic:Texto|Otro texto`: antes de capturar se toca, en orden,
//   el primer botón, resumen o enlace a la vista que contiene cada texto.
//   Inicia sesión una sola vez y navega dentro de la aplicación (recargar cierra la sesión).
//   Escribe <salida>/<nombre>-<ancho>-<tema>.png. Necesita la API en :3001 y el website en :3000 (`entorno.sh`).
import { enTrabajo } from './rutas.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const [salida, anchoPedido, ...pedidos] = process.argv.slice(2);
const ANCHO = Number(anchoPedido);
if (!salida || !Number.isFinite(ANCHO) || pedidos.length === 0 || pedidos.some((p) => !p.includes('='))) {
  console.error('uso: node ver.mjs <carpeta de salida> <ancho> <nombre>=<ruta> [<nombre>=<ruta> …]');
  process.exit(2);
}
const ALTO = 900;
const WEB = 'http://localhost:3000';
const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const rutas = pedidos.map((p) => {
  const corte = p.indexOf('=');
  // `{a}` es el asesorado A; `{nutricion.planV2}` (o cualquier otra clave de estado.json) trae ese identificador.
  const ruta = p.slice(corte + 1).replace(/\{([\w.]+)\}/g, (_, clave) => {
    const valor = clave === 'a' ? estado.aseId : clave.split('.').reduce((o, parte) => o?.[parte], estado);
    if (typeof valor !== 'string') {
      console.error(`«${p.slice(0, corte)}»: estado.json no tiene «${clave}».`);
      process.exit(2);
    }
    return valor;
  });
  if (/^[A-Za-z]:[\\/]/.test(ruta)) {
    console.error(`«${p.slice(0, corte)}»: la ruta llegó como una ruta de Windows (${ruta.slice(0, 40)}…). Escribila sin la barra inicial.`);
    process.exit(2);
  }
  const [destino, clics = ''] = ruta.split('#clic:');
  return [p.slice(0, corte), destino.startsWith('/') ? destino : `/${destino}`, clics.split('|').filter(Boolean)];
});
fs.mkdirSync(salida, { recursive: true });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--lang=es-AR'],
  defaultViewport: { width: ANCHO, height: ALTO, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

async function asentar() {
  await page.waitForNetworkIdle({ idleTime: 700, timeout: 25000 }).catch(() => {});
  await esperar(600);
}
/** El tema se elige en el menú de la cuenta, sin teclado y sin mover el foco (como en los recorridos). */
async function ponerTema(tema) {
  if ((await page.evaluate(() => document.documentElement.dataset.tema)) === tema) return;
  await page.waitForSelector('.menu-de-cuenta__boton', { timeout: 15_000 });
  await page.evaluate(() => document.querySelector('.menu-de-cuenta__boton').click());
  await page.waitForSelector('.menu-de-cuenta__panel input[type="radio"]', { timeout: 5_000 });
  await page.evaluate((t) => document.querySelector(`.menu-de-cuenta__panel input[type="radio"][value="${t}"]`).click(), tema);
  await page.waitForFunction((t) => document.documentElement.dataset.tema === t, { timeout: 5_000 }, tema);
  await page.evaluate(() => document.querySelector('.menu-de-cuenta__boton').click());
  await page.waitForFunction(() => !document.querySelector('.menu-de-cuenta__panel'), { timeout: 3_000 });
  await esperar(250);
}

try {
  // Se entra por la ficha (un retorno corto, que el inicio de sesión acepta) y después se navega a cada ruta pedida.
  // Los plazos son largos a propósito: contra `next dev`, la primera vez que se pide una página hay que esperar a que
  // se compile.
  const entrada = `/pro/advisees?id=${estado.aseId}`;
  page.setDefaultNavigationTimeout(240_000);
  page.setDefaultTimeout(240_000);
  await page.goto(`${WEB}/login?volver=${encodeURIComponent(entrada)}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#correo');
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 60_000 }).catch(() => {});
  await page.type('#correo', estado.proCorreo);
  await page.type('#contrasena', 'clave-sintetica-de-prueba-01');
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
  await page.waitForFunction(() => location.pathname.startsWith('/pro/advisees'), { timeout: 240_000 });
  await page.waitForFunction(() => typeof window.next?.router?.push === 'function', { timeout: 240_000 });
  for (const [nombre, ruta, clics] of rutas) {
    await page.setViewport({ width: ANCHO, height: ALTO, deviceScaleFactor: 1 });
    // Se espera a que la dirección cambie (contra `next dev` la página puede tardar en compilarse) y a que se asiente.
    const antes = await page.evaluate(() => location.pathname + location.search);
    await page.evaluate((u) => window.next.router.push(u), ruta);
    if (antes !== ruta) await page.waitForFunction((a) => location.pathname + location.search !== a, {}, antes).catch(() => {});
    await asentar();
    for (const texto of clics) {
      // Lo que se va a tocar puede tardar en aparecer (la vista se arma después de leer los datos).
      await page
        .waitForFunction((t) => [...document.querySelectorAll('main button, main summary, main a')].some((e) => e.textContent.replace(/\s+/g, ' ').includes(t) && e.getClientRects().length > 0), { timeout: 30_000 }, texto)
        .catch(() => {});
      const tocado = await page.evaluate((t) => {
        const el = [...document.querySelectorAll('main button, main summary, main a')].find((e) => e.textContent.replace(/\s+/g, ' ').includes(t) && e.getClientRects().length > 0);
        el?.click();
        return !!el;
      }, texto);
      if (!tocado) console.log(`${nombre}: no encontré «${texto}» para tocar`);
      await asentar();
    }
    for (const tema of ['claro', 'azul-noche']) {
      await ponerTema(tema);
      // La ventana se estira al alto de la página: con `fullPage`, los gráficos se quedan sin dibujo.
      const alto = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
      await page.setViewport({ width: ANCHO, height: Math.min(Math.max(alto, ALTO), 16000), deviceScaleFactor: 1 });
      await esperar(700);
      await page.screenshot({ path: path.join(salida, `${nombre}-${ANCHO}-${tema}.png`) });
      await page.setViewport({ width: ANCHO, height: ALTO, deviceScaleFactor: 1 });
      await esperar(250);
      if (tema === 'claro') console.log(`${nombre}: ${alto} px de alto (${(alto / ALTO).toFixed(1)} pantallas de ${ALTO})`);
    }
  }
} finally {
  console.log(`errores de la página: ${errores.length ? errores.slice(0, 6).join(' | ') : 'ninguno'}`);
  await browser.close();
}
