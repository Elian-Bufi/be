// Qué elementos pasan el ancho de la ventana con la letra grande (raíz al 150 %) en 390 px: tomas y preparación.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('C:/Users/bufim/AppData/Local/Temp/claude/C--Users-bufim-BE-Best/48b6effd-4f9c-500b-87ab-08468f0503c1/scratchpad/e2e/tanda/');
const puppeteer = require('puppeteer-core');
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const estado = JSON.parse(fs.readFileSync(path.join(AQUI, '../e2e-ux/estado.json'), 'utf8'));
const WEB = 'http://localhost:3000';
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--lang=es-AR'], defaultViewport: { width: 390, height: 844, deviceScaleFactor: 1 } });
const p = await browser.newPage();
await p.goto(`${WEB}/login`, { waitUntil: 'networkidle0', timeout: 240000 });
await p.type('#correo', estado.proCorreo);
await p.type('#contrasena', process.env.BE_CLAVE_LOCAL ?? ''); // la clave sintética local, por el entorno
await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), p.keyboard.press('Enter')]);
await p.waitForFunction(() => !location.pathname.startsWith('/login'), { timeout: 60000 });
await pausa(1200);
const ancho = Number(process.argv[2] ?? 390);
await p.setViewport({ width: ancho, height: 844 });
for (const vista of ['evaluaciones', 'preparacion']) {
  await p.evaluate((u) => window.next.router.push(u), `/pro/advisees/anthropometry?id=${estado.aseId}&vista=${vista}`);
  await p.waitForFunction(() => !/Cargando…/.test(document.querySelector('main')?.textContent ?? ''), { timeout: 90000 });
  await pausa(1200);
  if (vista === 'preparacion') {
    await p.evaluate(() => {
      const el = document.querySelector('#ant-protocolo');
      const o = el && [...el.options].find((x) => x.textContent.includes('Perfil antropométrico completo'));
      if (!o) return;
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, o.value);
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await pausa(900);
  }
  await p.evaluate(() => {
    document.documentElement.style.fontSize = '150%';
  });
  await pausa(500);
  const fuera = await p.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const lista = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= w + 1) continue;
      // Solo el más externo de cada rama: si el padre ya se pasa, no se repite el hijo.
      if (el.parentElement && el.parentElement.getBoundingClientRect().right > w + 1) continue;
      const cs = getComputedStyle(el);
      lista.push({ etiqueta: el.tagName.toLowerCase(), clase: el.className?.toString().slice(0, 60), texto: el.textContent.trim().slice(0, 50), derecha: Math.round(r.right), ancho: Math.round(r.width), minWidth: cs.minWidth, whiteSpace: cs.whiteSpace, display: cs.display });
    }
    return { anchoDeVentana: w, scrollWidth: document.documentElement.scrollWidth, fuera: lista.slice(0, 12) };
  });
  console.log(vista, JSON.stringify(fuera, null, 1));
  await p.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });
}
await browser.close();
