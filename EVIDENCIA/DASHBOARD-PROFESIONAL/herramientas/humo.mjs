// Prueba de humo del entorno profesional: inicia sesión como el profesional sintético, abre las tres vistas de la ficha
// del asesorado A y guarda una captura de cada una. Sirve para revisar a ojo antes del recorrido completo.
// Uso: node humo.mjs [ancho] [tema]   (lee trabajo/estado.json; escribe trabajo/humo/)
import { enTrabajo } from './rutas.mjs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const [ancho = '1440', tema = 'azul-noche'] = process.argv.slice(2);
const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const WEB = 'http://localhost:3000';
const dir = enTrabajo('humo/');
fs.mkdirSync(dir, { recursive: true });

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--lang=es-AR'], defaultViewport: { width: Number(ancho), height: 900 } });
const page = await browser.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
await page.evaluateOnNewDocument((t) => localStorage.setItem('be-apariencia', t), tema);
try {
  const ficha = `/pro/advisees?id=${estado.aseId}`;
  await page.goto(`${WEB}/login?volver=${encodeURIComponent(ficha)}`, { waitUntil: 'networkidle0' });
  await page.type('#correo', estado.proCorreo);
  await page.type('#contrasena', 'clave-sintetica-de-prueba-01');
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
  await page.waitForFunction(() => location.pathname.startsWith('/pro/advisees'), { timeout: 60000 });
  for (const [vista, consulta] of [
    ['resumen', ''],
    ['linea', '&vista=linea'],
    ['analizar', '&vista=analizar'],
  ]) {
    // La sesión vive en memoria: se navega dentro de la aplicación, sin recargar.
    await page.evaluate((u) => window.next.router.push(u), `${ficha}${consulta}`);
    await new Promise((r) => setTimeout(r, 4000));
    await page.screenshot({ path: fileURLToPath(new URL(`${vista}-${ancho}-${tema}.png`, dir)), fullPage: true });
    console.log(vista, (await page.evaluate(() => document.querySelector('main')?.innerText ?? '')).replace(/\s+/g, ' ').slice(0, 400));
  }
} finally {
  console.log('errores de la página:', errores.length ? errores.slice(0, 8) : 'ninguno');
  await browser.close();
}
