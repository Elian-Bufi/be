// La profesional ve, en el website, lo que registró el asesorado (después de recorrido-api.mjs): «Ver registro» con el
// estado de las cantidades, lo consumido estimado y la foto privada de la comida diferente. Además revisa el website en
// el ancho de un teléfono (390 px): «Mis recetas», el editor con su foto y el plan, sin desplazamiento de costado.
// Uso: node recorrido-web-registros.mjs [prefijo]   (el prefijo distingue las capturas, por ejemplo «tras-reinicio»)
import { enTrabajo } from './rutas.mjs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const recetas = JSON.parse(fs.readFileSync(enTrabajo('recorrido-web.json'), 'utf8')).recetas;
const PREFIJO = process.argv[2] ?? 'registros';
const WEB = 'http://localhost:3000';
const CRED = 'clave-sintetica-de-prueba-01';
const dir = enTrabajo('capturas-web/');
fs.mkdirSync(dir, { recursive: true });
const controles = [];
const control = (nombre, ok, detalle = '') => {
  controles.push({ nombre, ok: !!ok, detalle: String(detalle).slice(0, 500) });
  console.log(`${ok ? '✓' : '✗'} ${nombre}${detalle ? ` · ${String(detalle).slice(0, 200)}` : ''}`);
};
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--lang=es-AR'], defaultViewport: { width: 1280, height: 900 } });
const page = await browser.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
const capturar = (nombre) => page.screenshot({ path: fileURLToPath(new URL(`${PREFIJO}-${nombre}.png`, dir)), fullPage: true });
const texto = () => page.evaluate(() => document.body.innerText);
const ir = (ruta) => page.evaluate((u) => window.next.router.push(u), ruta);
const sinDesborde = () => page.evaluate(() => document.scrollingElement.scrollWidth <= window.innerWidth + 1);
try {
  await page.goto(`${WEB}/login?volver=${encodeURIComponent('/pro')}`, { waitUntil: 'networkidle0', timeout: 120000 });
  await page.type('#correo', estado.proCorreo);
  await page.type('#contrasena', CRED);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
  await page.waitForFunction(() => location.pathname === '/pro', { timeout: 60000 });

  // ─── Registros del asesorado, con «Ver registro» ─────────────────────────────────────────────
  await ir(`/pro/advisees/nutrition?id=${estado.aseId}&vista=registros`);
  await page.waitForFunction(() => document.body.innerText.includes('Ver registro'), { timeout: 60000 });
  await pausa(500);
  const cuantos = await page.$$eval('button', (bs) => bs.filter((b) => b.textContent.trim() === 'Ver registro').length);
  control('Registros ofrece «Ver registro» en cada comida registrada y en lo de fuera del plan', cuantos >= 3, `${cuantos} registros`);
  await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === 'Ver registro').forEach((b) => b.click()));
  await page.waitForFunction(() => document.querySelectorAll('.fotos-del-registro img[src^="data:image/jpeg"]').length >= 2, { timeout: 60000 });
  await pausa(500);
  const t = await texto();
  control('la profesional ve las fotos privadas del asesorado (texto y foto, y solo foto)', (await page.$$('.fotos-del-registro img')).length >= 2, `${(await page.$$('.fotos-del-registro img')).length} fotos`);
  control('el registro con cantidades dice cómo se registraron y la estimación de lo consumido', t.includes('Informó lo que comió de cada ingrediente') && t.includes('Estimación de lo consumido') && t.includes('no lo comió'));
  control('la comida diferente dice «Macros sin calcular» y su cantidad aproximada; una foto no agrega macros', t.includes('Macros sin calcular') && t.includes('Cantidad aproximada: 2 porciones'));
  control('una comida diferente sin descripción dice «Sin descripción», sin comillas vacías', t.includes('Sin descripción') && !t.includes('«»'));
  await capturar('profesional-ve-los-registros');

  // ─── El website a 390 px ─────────────────────────────────────────────────────────────────────
  // Solo el ancho: cambiar isMobile recarga la página, y la sesión del website vive en memoria (DL-012).
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await ir('/pro/recipes');
  await page.waitForFunction(() => document.querySelectorAll('.tarjeta-de-receta img').length === 3, { timeout: 60000 });
  control('a 390 px, «Mis recetas» no se desplaza de costado', await sinDesborde());
  await capturar('movil-mis-recetas');
  const pollo = Object.values(recetas)[0].recipeId;
  await ir(`/pro/recipes?receta=${pollo}`);
  await page.waitForFunction(() => document.querySelector('figure.figura-de-receta img')?.src.startsWith('data:image/jpeg'), { timeout: 60000 });
  await pausa(500);
  control('a 390 px, el editor con su foto no se desplaza de costado', await sinDesborde());
  await capturar('movil-editor-de-receta');
  await ir(`/pro/advisees/nutrition?id=${estado.aseId}&vista=plan`);
  await page.waitForFunction(() => document.body.innerText.includes('Plan activo'), { timeout: 60000 });
  await pausa(500);
  control('a 390 px, el plan activo con sus recetas no se desplaza de costado', await sinDesborde());
  await capturar('movil-plan-activo');
  control('sin errores de página ni de CSP en el navegador', errores.length === 0, errores.join(' | '));
} catch (e) {
  control('el recorrido terminó sin excepciones', false, e.stack ?? String(e));
  await capturar('zz-fallo').catch(() => {});
} finally {
  fs.writeFileSync(enTrabajo(`recorrido-web-${PREFIJO}.json`), JSON.stringify({ controles }, null, 2));
  await browser.close();
  const fallas = controles.filter((c) => !c.ok).length;
  console.log(`${controles.length - fallas}/${controles.length} controles OK`);
  process.exit(fallas ? 1 : 0);
}
