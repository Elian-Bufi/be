// Revisión del head fbeb256, hallazgos 3 y 4: la referencia del cambio relativo con el zoom, y el texto buscado en las
// URL de la API. Uso: node reproducir-3-y-4.mjs   (web y API locales en marcha; lee trabajo/estado.json)
//
// - 3: en fbeb256 la referencia eran «los primeros N días de lo que se ve»: al acercar el gráfico, cambiaba. Corregido,
//   el texto de la referencia es el mismo con el período entero, acercado y restablecido.
// - 4: en fbeb256 la búsqueda viajaba como `?q=` en la URL de API-DSH-04 (y en la del pedido OPTIONS previo). Corregido,
//   ninguna URL de la API lleva el texto: va en el cuerpo de un POST a `/timeline/search`.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { enTrabajo } from '../rutas.mjs';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const WEB = 'http://localhost:3000';
const API = 'http://localhost:3001';
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const ficha = `/pro/advisees?id=${estado.aseId}`;

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--lang=es-AR'], defaultViewport: { width: 1440, height: 900 } });
try {
  const page = await browser.newPage();
  const pedidos = [];
  page.on('request', (r) => r.url().startsWith(API) && pedidos.push({ linea: `${r.method()} ${r.url().replace(API, '').replace(/[0-9a-f-]{36}/g, ':id')}`, cuerpo: r.postData() ?? '' }));
  await page.goto(`${WEB}/login?volver=${encodeURIComponent(ficha)}`, { waitUntil: 'networkidle0' });
  await page.type('#correo', estado.proCorreo);
  await page.type('#contrasena', 'clave-sintetica-de-prueba-01');
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
  await page.waitForFunction(() => location.pathname.startsWith('/pro/advisees'), { timeout: 60_000 });
  await pausa(3000);

  // Hallazgo 4: la búsqueda en la línea de tiempo.
  await page.evaluate((u) => window.next.router.push(u), `${ficha}&vista=linea`);
  await pausa(3000);
  const desde = pedidos.length;
  await page.type('input[type="search"]', 'cena');
  await page.click('.filtros-de-linea button[type="submit"]');
  await pausa(3000);
  const deLaBusqueda = pedidos.slice(desde);
  console.log('4 · URL de la página:', page.url().replace(WEB, '').replace(/[0-9a-f-]{36}/g, ':id'));
  console.log('4 · pedidos a la API durante la búsqueda:', JSON.stringify(deLaBusqueda.map((p) => p.linea)));
  console.log('4 · URL de la API con el texto buscado:', JSON.stringify(deLaBusqueda.filter((p) => /cena/i.test(p.linea)).map((p) => p.linea)));
  console.log('4 · cuerpos con el texto buscado:', JSON.stringify(deLaBusqueda.filter((p) => /cena/i.test(p.cuerpo)).map((p) => `${p.linea} ${p.cuerpo}`)));

  // Hallazgo 3: la referencia del cambio relativo y el zoom (con los dos campos de fecha, la alternativa al arrastre).
  await page.evaluate((u) => window.next.router.push(u), `${ficha}&vista=analizar&m=${encodeURIComponent('nutricion.proteinas')}&modo=R`);
  await pausa(4000);
  const referencia = () => page.evaluate(() => document.querySelector('.referencias')?.innerText.replace(/\s+/g, ' ') ?? '(sin referencia)');
  console.log('3 · referencia con el período entero:', await referencia());
  await page.evaluate(() => document.querySelector('details.intervalo summary').click());
  await pausa(300);
  await page.evaluate(() => {
    const i = document.querySelector('details.intervalo input[type="date"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, '2026-09-01');
    i.dispatchEvent(new Event('input', { bubbles: true }));
    i.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await pausa(1500);
  console.log('3 · referencia después de acercar desde el 1/9:', await referencia());
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Restablecer vista'))?.click());
  await pausa(1500);
  console.log('3 · referencia después de restablecer:', await referencia());
} finally {
  await browser.close();
}
