// Captura cada página del website, entera y en los dos temas, para comparar antes y después de un cambio visual
// (WP-ESCRITORIO-AMABLE). No comprueba nada: mide el alto de cada página y deja las imágenes para mirarlas.
// Uso: node paginas.mjs <carpeta de salida> [ancho]
//   Lee BE_TRABAJO/estado.json (el profesional sintético y su asesorado A) e inicia sesión una sola vez.
//   Escribe <salida>/<tema>/<nn>-<nombre>.png y <salida>/alturas.json.
// Necesita la API en :3001 y el website estático en :3000 (`entorno.sh`). Usa Chrome sin ventana: va sola.
import { enTrabajo } from './rutas.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const [salida, anchoPedido = '1440'] = process.argv.slice(2);
if (!salida) {
  console.error('uso: node paginas.mjs <carpeta de salida> [ancho]');
  process.exit(2);
}
const ANCHO = Number(anchoPedido);
const ALTO = 900;
const WEB = 'http://localhost:3000';
const TEMAS = ['claro', 'azul-noche'];
const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const id = estado.aseId;

const PUBLICAS = [
  ['inicio', '/'],
  ['ingresar', '/login'],
  ['registro', '/register'],
  ['privacidad', '/legal/privacidad'],
  ['terminos', '/legal/terminos'],
];
const area = (nombre, ruta, vistas) => vistas.map((v) => [`${nombre}-${v}`, `/pro/advisees/${ruta}?id=${id}&vista=${v}`]);
const PRIVADAS = [
  ['espacio-profesional', '/pro'],
  ['ficha-resumen', `/pro/advisees?id=${id}`],
  ['ficha-linea-de-tiempo', `/pro/advisees?id=${id}&vista=linea`],
  ['ficha-analizar', `/pro/advisees?id=${id}&vista=analizar`],
  ...area('nutricion', 'nutrition', ['resumen', 'plan', 'registros', 'revisiones']),
  ...area('entrenamiento', 'training', ['resumen', 'plan', 'ejecuciones', 'revisiones']),
  ...area('antropometria', 'anthropometry', ['evaluaciones', 'preparacion', 'evolucion', 'lamina']),
  ...area('informacion', 'forms', ['solicitudes', 'pedir']),
  ['plantillas-y-habituales', '/pro/templates'],
  ['mis-recetas', '/pro/recipes'],
  ['mis-ejercicios', '/pro/exercises'],
  ['cuenta', '/account'],
  ['cuenta-privacidad', '/account/privacy'],
];

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
for (const tema of TEMAS) fs.mkdirSync(path.join(salida, tema), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--lang=es-AR'],
  defaultViewport: { width: ANCHO, height: ALTO, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));
const alturas = [];
let numero = 0;

/** Espera a que la página termine de pedir datos y de acomodarse. */
async function asentar() {
  await page.waitForNetworkIdle({ idleTime: 700, timeout: 25000 }).catch(() => {});
  await esperar(500);
}

/** El tema se cambia con el selector del encabezado, como lo hace una persona: no recarga ni cierra la sesión. */
async function ponerTema(tema) {
  await page.waitForSelector('.apariencia select', { timeout: 15000 });
  await page.select('.apariencia select', tema);
  await page.waitForFunction((t) => document.documentElement.dataset.tema === t, { timeout: 5000 }, tema);
  await esperar(250);
}

/** La página entera, con la ventana estirada a su alto: con `fullPage`, los gráficos se quedan sin dibujo. */
async function capturar(nombre, ruta) {
  numero += 1;
  const prefijo = String(numero).padStart(2, '0');
  const fila = { pagina: nombre, ruta: ruta.replace(id, '{asesorado}') };
  for (const tema of TEMAS) {
    await ponerTema(tema);
    const alto = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
    await page.setViewport({ width: ANCHO, height: Math.min(Math.max(alto, ALTO), 16000), deviceScaleFactor: 1 });
    await esperar(600);
    await page.screenshot({ path: path.join(salida, tema, `${prefijo}-${nombre}.png`) });
    await page.setViewport({ width: ANCHO, height: ALTO, deviceScaleFactor: 1 });
    await esperar(200);
    fila[tema] = alto;
  }
  fila.pantallas = Number((fila.claro / ALTO).toFixed(1));
  alturas.push(fila);
  console.log(`${prefijo} ${nombre}: ${fila.claro} px (${fila.pantallas} pantallas de ${ALTO})`);
}

try {
  for (const [nombre, ruta] of PUBLICAS) {
    await page.goto(`${WEB}${ruta}`, { waitUntil: 'networkidle0' });
    await capturar(nombre, ruta);
  }
  const ficha = `/pro/advisees?id=${id}`;
  await page.goto(`${WEB}/login?volver=${encodeURIComponent(ficha)}`, { waitUntil: 'networkidle0' });
  await page.type('#correo', estado.proCorreo);
  await page.type('#contrasena', 'clave-sintetica-de-prueba-01');
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
  await page.waitForFunction(() => location.pathname.startsWith('/pro/advisees'), { timeout: 60000 });
  for (const [nombre, ruta] of PRIVADAS) {
    // La sesión vive en memoria: se navega dentro de la aplicación, sin recargar.
    await page.evaluate((u) => window.next.router.push(u), ruta);
    await asentar();
    await capturar(nombre, ruta);
  }
} finally {
  fs.writeFileSync(path.join(salida, 'alturas.json'), `${JSON.stringify({ ancho: ANCHO, alto: ALTO, hoy: new Date().toISOString().slice(0, 10), paginas: alturas, errores }, null, 2)}\n`);
  console.log(`errores de la página: ${errores.length ? errores.slice(0, 8).join(' | ') : 'ninguno'}`);
  await browser.close();
}
