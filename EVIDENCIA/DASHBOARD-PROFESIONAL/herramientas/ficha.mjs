// Mira la ficha del asesorado mientras se la rediseña (WP-ESCRITORIO-AMABLE): la primera pantalla de cada vista, en los
// dos temas y a los tres anchos del escritorio, y el control de período abierto. No comprueba nada: deja las imágenes.
// Uso: node ficha.mjs <carpeta de salida> [vistas separadas por coma: resumen,linea,analizar]
//   Lee BE_TRABAJO/estado.json e inicia sesión una sola vez. Necesita la API en :3001 y el website en :3000.
import { enTrabajo } from './rutas.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const [salida, vistasPedidas = 'resumen,linea,analizar'] = process.argv.slice(2);
if (!salida) {
  console.error('uso: node ficha.mjs <carpeta de salida> [vistas]');
  process.exit(2);
}
const WEB = 'http://localhost:3000';
const ALTO = 900;
const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const ficha = `/pro/advisees?id=${estado.aseId}`;
const RUTA = { resumen: ficha, linea: `${ficha}&vista=linea`, analizar: `${ficha}&vista=analizar` };
const vistas = vistasPedidas.split(',').filter((v) => RUTA[v]);
fs.mkdirSync(salida, { recursive: true });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--lang=es-AR'],
  defaultViewport: { width: 1440, height: ALTO, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));

async function asentar() {
  await page.waitForNetworkIdle({ idleTime: 700, timeout: 25000 }).catch(() => {});
  await esperar(500);
}
async function ponerTema(tema) {
  await page.select('.apariencia select', tema);
  await page.waitForFunction((t) => document.documentElement.dataset.tema === t, { timeout: 5000 }, tema);
  await esperar(250);
}
const foto = (nombre) => page.screenshot({ path: path.join(salida, `${nombre}.png`) });
/** Dónde empieza el cuerpo de la vista y si la página se desplaza de costado: lo que el marco tiene que cuidar. */
const medidas = () =>
  page.evaluate(() => ({
    cuerpoEmpiezaEn: Math.round(document.querySelector('.ficha__cuerpo')?.getBoundingClientRect().top ?? -1),
    altoDelMarco: Math.round(document.querySelector('.marco-de-la-ficha')?.getBoundingClientRect().height ?? -1),
    desbordeHorizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));

try {
  await page.goto(`${WEB}/login?volver=${encodeURIComponent(ficha)}`, { waitUntil: 'networkidle0' });
  await page.type('#correo', estado.proCorreo);
  await page.type('#contrasena', 'clave-sintetica-de-prueba-01');
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
  await page.waitForFunction(() => location.pathname.startsWith('/pro/advisees'), { timeout: 60000 });
  for (const vista of vistas) {
    // La sesión vive en memoria: se navega dentro de la aplicación, sin recargar.
    await page.evaluate((u) => window.next.router.push(u), RUTA[vista]);
    await asentar();
    for (const tema of ['claro', 'azul-noche']) {
      await ponerTema(tema);
      await foto(`${vista}-1440-${tema}`);
    }
    console.log(`${vista} a 1440:`, JSON.stringify(await medidas()));
    for (const ancho of [1280, 1024, 768, 390]) {
      await page.setViewport({ width: ancho, height: ALTO, deviceScaleFactor: 1 });
      await esperar(500);
      await ponerTema('claro');
      await foto(`${vista}-${ancho}-claro`);
      console.log(`${vista} a ${ancho}:`, JSON.stringify(await medidas()));
    }
    await page.setViewport({ width: 1440, height: ALTO, deviceScaleFactor: 1 });
    await esperar(400);
  }
  // El período, abierto: los atajos y el rango propio.
  await page.evaluate((u) => window.next.router.push(u), RUTA.resumen);
  await asentar();
  if (await page.$('.periodo-del-seguimiento__boton')) {
    await page.click('.periodo-del-seguimiento__boton');
    await esperar(300);
    for (const tema of ['claro', 'azul-noche']) {
      await ponerTema(tema);
      await foto(`periodo-abierto-1440-${tema}`);
    }
    console.log('período abierto:', JSON.stringify(await page.evaluate(() => ({ atajos: [...document.querySelectorAll('.periodo-del-seguimiento__opciones button')].map((b) => `${b.innerText}${b.getAttribute('aria-pressed') === 'true' ? ' (elegido)' : ''}`), fechas: document.querySelectorAll('.periodo-del-seguimiento__rango input[type=date]').length, boton: document.querySelector('.periodo-del-seguimiento__boton')?.innerText.replace(/\s+/g, ' ') }))));
    await page.keyboard.press('Escape');
    await esperar(200);
    console.log('después de Escape:', JSON.stringify(await page.evaluate(() => ({ panel: !!document.querySelector('.periodo-del-seguimiento__panel'), focoEnElBoton: document.activeElement?.classList.contains('periodo-del-seguimiento__boton') ?? false }))));
  }
} finally {
  console.log(`errores de la página: ${errores.length ? errores.slice(0, 6).join(' | ') : 'ninguno'}`);
  await browser.close();
}
