// Mira la ficha del asesorado mientras se la rediseña (WP-ESCRITORIO-AMABLE): la primera pantalla de cada vista, en los
// dos temas y a los tres anchos del escritorio (más 768 y 390 px, para ver que no se rompe), el control de período
// abierto y el menú de la cuenta abierto. No comprueba nada: deja las imágenes y las medidas del encabezado y del marco.
// Uso: node ficha.mjs <carpeta de salida> [vistas separadas por coma: resumen,linea,analizar,analizar-metricas,
//      analizar-juntas,analizar-relativo]
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
const TRES = encodeURIComponent('nutricion.energia,nutricion.proteinas,antropometria.peso');
const DOS = encodeURIComponent('nutricion.proteinas,nutricion.carbohidratos');
const RUTA = {
  resumen: ficha,
  linea: `${ficha}&vista=linea`,
  analizar: `${ficha}&vista=analizar`,
  // Analizar con gráficos: tres métricas separadas, dos juntas y dos en cambio relativo.
  'analizar-metricas': `${ficha}&vista=analizar&m=${TRES}`,
  'analizar-juntas': `${ficha}&vista=analizar&m=${DOS}&modo=S`,
  'analizar-relativo': `${ficha}&vista=analizar&m=${DOS}&modo=R`,
};
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
/**
 * El tema se elige en el menú de la cuenta, en la esquina del encabezado (WP-ESCRITORIO-AMABLE): se abre, se marca la
 * opción y se cierra con el mismo botón. Todo sin teclado y sin mover el foco: Escape cerraría también otro panel
 * abierto (el del período) y dejaría el aro de foco en las capturas. No recarga la página ni cierra la sesión.
 */
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
const foto = (nombre) => page.screenshot({ path: path.join(salida, `${nombre}.png`) });
/** Dónde empieza el cuerpo de la vista y si la página se desplaza de costado: lo que el marco tiene que cuidar. */
const medidas = () =>
  page.evaluate(() => ({
    altoDelEncabezado: Math.round(document.querySelector('.encabezado')?.getBoundingClientRect().height ?? -1),
    lineasDeNavegacion: new Set([...document.querySelectorAll('.encabezado .navegacion a')].map((a) => Math.round(a.getBoundingClientRect().top))).size,
    anchoLibreDeLaNavegacion: Math.round((document.querySelector('.encabezado .navegacion')?.getBoundingClientRect().width ?? 0) - (document.querySelector('.encabezado .navegacion ul')?.scrollWidth ?? 0)),
    cuerpoEmpiezaEn: Math.round(document.querySelector('.ficha__cuerpo')?.getBoundingClientRect().top ?? -1),
    altoDelMarco: Math.round(document.querySelector('.marco-de-la-ficha')?.getBoundingClientRect().height ?? -1),
    desbordeHorizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    // En Analizar con gráficos: hasta dónde llegan los gráficos y la lectura, y cuántos gráficos hay dibujados.
    finDeLosGraficos: Math.round(document.querySelector('.tarjeta-de-graficos')?.getBoundingClientRect().bottom ?? -1),
    finDelUltimoGrafico: Math.round([...document.querySelectorAll('figure.grafico__figura')].pop()?.getBoundingClientRect().bottom ?? -1),
    finDeLaLectura: Math.round(document.querySelector('.tarjeta-de-lectura')?.getBoundingClientRect().bottom ?? -1),
    graficos: document.querySelectorAll('figure.grafico__figura svg.recharts-surface').length,
  }));

try {
  await page.goto(`${WEB}/login?volver=${encodeURIComponent(ficha)}`, { waitUntil: 'networkidle0' });
  // Antes de iniciar sesión: el botón de la esquina dice «Apariencia» y abre solo eso. En escritorio y en tablet de pie.
  for (const [ancho, tema] of [[1440, 'azul-noche'], [768, 'claro']]) {
    await page.setViewport({ width: ancho, height: ALTO, deviceScaleFactor: 1 });
    await esperar(400);
    await ponerTema(tema);
    await page.click('.menu-de-cuenta__boton');
    await page.waitForSelector('.menu-de-cuenta__panel');
    await esperar(200);
    await foto(`sin-sesion-menu-${ancho}-${tema}`);
    await page.click('.menu-de-cuenta__boton');
    await esperar(200);
  }
  await page.setViewport({ width: 1440, height: ALTO, deviceScaleFactor: 1 });
  await esperar(300);
  await page.type('#correo', estado.proCorreo);
  await page.type('#contrasena', 'clave-sintetica-de-prueba-01');
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
  await page.waitForFunction(() => location.pathname.startsWith('/pro/advisees'), { timeout: 60000 });
  for (const vista of vistas) {
    // La sesión vive en memoria: se navega dentro de la aplicación, sin recargar.
    await page.evaluate((u) => window.next.router.push(u), RUTA[vista]);
    await asentar();
    if (vista.startsWith('analizar-')) {
      await page.waitForSelector('figure.grafico__figura svg.recharts-surface', { timeout: 20000 }).catch(() => {});
      await esperar(600);
    }
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
  // El menú de la cuenta, abierto: en los dos temas a 1440 px y en una tablet de pie.
  if (await page.$('.menu-de-cuenta__boton')) {
    for (const [ancho, tema] of [[1440, 'claro'], [1440, 'azul-noche'], [768, 'claro']]) {
      await page.setViewport({ width: ancho, height: ALTO, deviceScaleFactor: 1 });
      await esperar(400);
      await ponerTema(tema);
      await page.click('.menu-de-cuenta__boton');
      await page.waitForSelector('.menu-de-cuenta__panel');
      await esperar(200);
      await foto(`menu-de-cuenta-${ancho}-${tema}`);
      if (ancho === 1440 && tema === 'claro') {
        console.log('menú de la cuenta:', JSON.stringify(await page.evaluate(() => { const p = document.querySelector('.menu-de-cuenta__panel'); const r = p.getBoundingClientRect(); return { boton: document.querySelector('.menu-de-cuenta__boton').innerText.replace(/\s+/g, ' ').trim(), opciones: [...p.querySelectorAll('a, button, label')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()), entra: r.left >= 0 && r.right <= document.documentElement.clientWidth }; })));
      }
      // Se cierra con el mismo botón y con el mouse: con Escape quedaría el aro de foco en la captura siguiente.
      await page.click('.menu-de-cuenta__boton');
      await esperar(200);
    }
    await page.setViewport({ width: 1440, height: ALTO, deviceScaleFactor: 1 });
    await esperar(300);
    await page.click('.menu-de-cuenta__boton');
    await page.waitForSelector('.menu-de-cuenta__panel');
    await page.keyboard.press('Escape');
    await esperar(200);
    console.log('después de Escape:', JSON.stringify(await page.evaluate(() => ({ panel: !!document.querySelector('.menu-de-cuenta__panel'), focoEnElBoton: document.activeElement?.classList.contains('menu-de-cuenta__boton') ?? false }))));
  }
} finally {
  console.log(`errores de la página: ${errores.length ? errores.slice(0, 6).join(' | ') : 'ninguno'}`);
  await browser.close();
}
