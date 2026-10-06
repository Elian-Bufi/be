// M05 (ACEPTACION.csv): ir a la técnica y volver conserva la fila, lo escrito, el objetivo y el ejercicio activo; y ver la
// técnica de otro ejercicio desde «Ver rutina» no lo cambia. Sobre el render de componentes de la APK con datos
// sintéticos (escena «sesion-escrita»: 14 repeticiones y RIR 2,5 escritos en la serie 1). NO es la APK nativa.
// Uso: node tecnica-y-vuelta.mjs <carpeta salida del arnés armado sin API_REAL>   (escribe tecnica-y-vuelta.json)
import { enTrabajo } from './rutas.mjs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const salida = process.argv[2];
const dir = enTrabajo('capturas-apk-tecnica/');
fs.mkdirSync(dir, { recursive: true });
const controles = [];
const control = (nombre, ok, detalle = '') => {
  controles.push({ nombre, ok: !!ok, detalle: String(detalle).slice(0, 400) });
  console.log(`${ok ? '✓' : '✗'} ${nombre}${detalle ? ` · ${String(detalle).slice(0, 200)}` : ''}`);
};
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--lang=es-AR'], defaultViewport: { width: 430, height: 960 } });
const page = await browser.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
async function tocar(nombre, indice = 0) {
  await page.evaluate(
    (n, i) => {
      const cs = [...document.querySelectorAll('[role="button"],[role="link"]')].filter((e) => e.getAttribute('aria-label') === n || e.textContent?.trim() === n);
      if (!cs[i]) throw new Error(`no encontré «${n}» (${i})`);
      cs[i].click();
    },
    nombre,
    indice,
  );
  await pausa(400);
}
/** Lo que importa del estado de la sesión: los campos de la fila activa, la fila marcada y el ejercicio activo. */
const estado = () =>
  page.evaluate(() => {
    const valor = (c) => [...document.querySelectorAll('input')].find((e) => (e.getAttribute('aria-label') ?? '').startsWith(c))?.value ?? null;
    const texto = document.body.innerText;
    return { repeticiones: valor('Repeticiones de la serie 1'), rir: valor('RIR de la serie 1'), ejercicio: /Ejercicio \d de \d/.exec(texto)?.[0] ?? null, actual: texto.includes('Serie actual'), sentadilla: texto.includes('Sentadilla goblet') };
  });
try {
  const url = `${pathToFileURL(`${salida}/evidencia.html`).href}?escena=sesion-escrita&tema=azul-noche&ancho=390&alto=900&escala=1&titulo=${encodeURIComponent('M05 · técnica y vuelta')}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
  await page.waitForFunction(() => document.body.dataset.acciones === 'listas', { timeout: 60000 });
  const antes = await estado();
  control('la serie 1 tiene lo escrito (14 repeticiones, RIR 2,5) y es la serie actual del ejercicio 1', antes.repeticiones === '14' && antes.rir === '2,5' && antes.actual && antes.ejercicio === 'Ejercicio 1 de 3', JSON.stringify(antes));
  await tocar('Ver técnica');
  await page.waitForFunction(() => document.body.innerText.includes('Volver a la sesión'), { timeout: 30000 });
  await page.screenshot({ path: fileURLToPath(new URL('m05-01-tecnica-del-activo.png', dir)) });
  await tocar('Volver a la sesión');
  const tras = await estado();
  control('al volver de la técnica, la fila, lo escrito y el ejercicio activo son los mismos', JSON.stringify(tras) === JSON.stringify(antes), JSON.stringify(tras));
  await tocar('Ver rutina');
  await page.waitForFunction(() => document.body.innerText.includes('Peso muerto rumano con mancuernas'), { timeout: 30000 });
  // La técnica del segundo ejercicio, desde la rutina: el enlace «Ver técnica» de su fila. Cada enlace pertenece al
  // primer contenedor que nombra un solo ejercicio.
  await page.evaluate(() => {
    const NOMBRES = ['Sentadilla goblet', 'Peso muerto rumano con mancuernas', 'Zancada estática'];
    const deQuien = (b) => {
      for (let p = b.parentElement; p; p = p.parentElement) {
        const nombres = NOMBRES.filter((n) => p.innerText?.includes(n));
        if (nombres.length === 1) return nombres[0];
        if (nombres.length > 1) return null;
      }
      return null;
    };
    const enlaces = [...document.querySelectorAll('[role="button"],[role="link"]')].filter((e) => e.textContent?.trim() === 'Ver técnica');
    const delSegundo = enlaces.find((b) => deQuien(b) === 'Peso muerto rumano con mancuernas');
    if (!delSegundo) throw new Error(`no encontré la técnica del peso muerto: ${enlaces.map(deQuien).join(', ')}`);
    delSegundo.click();
  });
  await pausa(400);
  const titulo = await page.evaluate(() => document.body.innerText);
  control('desde «Ver rutina» se abre la técnica del peso muerto rumano, no la del ejercicio activo', /Peso muerto rumano con mancuernas[\s\S]*Volver a la sesión/.test(titulo) && titulo.includes('Persona adulta en bisagra de cadera'), titulo.slice(0, 200));
  await page.screenshot({ path: fileURLToPath(new URL('m05-02-tecnica-de-otro-desde-la-rutina.png', dir)) });
  await tocar('Volver a la sesión');
  const final = await estado();
  control('ver la técnica de otro ejercicio desde «Ver rutina» no cambia el activo ni lo escrito', JSON.stringify(final) === JSON.stringify(antes), JSON.stringify(final));
} catch (e) {
  control('la prueba terminó sin errores', false, e.stack ?? String(e));
} finally {
  control('sin errores de página', errores.length === 0, errores.join(' | '));
  fs.writeFileSync(enTrabajo('tecnica-y-vuelta.json'), JSON.stringify({ controles }, null, 2));
  await browser.close();
  const fallas = controles.filter((c) => !c.ok).length;
  console.log(`${controles.length - fallas}/${controles.length} controles`);
  process.exit(fallas ? 1 : 0);
}
