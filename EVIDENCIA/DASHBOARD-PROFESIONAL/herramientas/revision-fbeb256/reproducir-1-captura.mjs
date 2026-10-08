// Revisión del head fbeb256, hallazgo 1: gráficos vacíos en las capturas de Analizar.
// Uso: node reproducir-1-captura.mjs [ancho] [tema] [veces]   (web y API locales en marcha; lee trabajo/estado.json)
//
// Abre Analizar con tres métricas y, con un observador en la página, registra qué pasa durante dos tipos de captura:
// - `fullPage: true` (la de fbeb256): Puppeteer achica la ventana a 1 × 1 por un instante; el contenedor de recharts
//   mide 0, quita el SVG y lo vuelve a dibujar cuando la ventana recupera su tamaño. Si la imagen se toma en ese
//   intervalo, los paneles salen vacíos aunque la pantalla esté bien.
// - la del recorrido corregido: la ventana se agranda al alto de la página, se espera el dibujo y se captura la ventana
//   tal cual. Ningún contenedor mide 0.
// Para cada captura informa los eventos (cambios de tamaño y SVG quitados) y si la imagen tiene píxeles de los colores
// de las métricas en la zona de los paneles.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { enTrabajo } from '../rutas.mjs';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const [ancho = '1440', tema = 'claro', veces = '5'] = process.argv.slice(2);
const WEB = 'http://localhost:3000';
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const ficha = `/pro/advisees?id=${estado.aseId}`;
const SALIDA = fileURLToPath(enTrabajo('revision-fbeb256/'));
fs.mkdirSync(SALIDA, { recursive: true });

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--lang=es-AR'], defaultViewport: { width: Number(ancho), height: 900 } });
try {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument((t) => localStorage.setItem('be-apariencia', t), tema);
  await page.goto(`${WEB}/login?volver=${encodeURIComponent(ficha)}`, { waitUntil: 'networkidle0' });
  await page.type('#correo', estado.proCorreo);
  await page.type('#contrasena', 'clave-sintetica-de-prueba-01');
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
  await page.waitForFunction(() => location.pathname.startsWith('/pro/advisees'), { timeout: 60_000 });
  await page.evaluate((u) => window.next.router.push(u), `${ficha}&vista=analizar&m=${encodeURIComponent('nutricion.energia,nutricion.proteinas,antropometria.peso')}`);
  await page.waitForFunction(() => document.querySelectorAll('.grafico__lienzo svg.recharts-surface').length === 3, { timeout: 30_000 });
  await pausa(1500);
  await page.evaluate(() => {
    window.__eventos = [];
    new MutationObserver((ms) => {
      for (const m of ms) for (const n of m.removedNodes) if (n.nodeType === 1 && (n.matches?.('svg.recharts-surface') || n.querySelector?.('svg.recharts-surface'))) window.__eventos.push('svg quitado');
    }).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', () => window.__eventos.push(`ventana ${window.innerWidth}x${window.innerHeight}`));
  });

  /** Píxeles de los colores de las métricas en la zona de los paneles, en la imagen ya guardada. */
  const pixeles = async (archivo) => {
    const zona = await page.evaluate(() => {
      const l = [...document.querySelectorAll('.grafico__lienzo')].map((x) => x.getBoundingClientRect());
      return { x: Math.min(...l.map((b) => b.x)), y: Math.min(...l.map((b) => b.y + scrollY)), ancho: Math.max(...l.map((b) => b.width)), alto: Math.max(...l.map((b) => b.bottom + scrollY)) - Math.min(...l.map((b) => b.y + scrollY)) };
    });
    const colores = await page.evaluate(() =>
      [1, 2, 3].map((n) => {
        const s = document.createElement('span');
        s.style.color = `var(--metrica-${n})`;
        document.body.appendChild(s);
        const c = getComputedStyle(s).color;
        s.remove();
        return c;
      }),
    );
    const png = fs.readFileSync(archivo).toString('base64');
    return page.evaluate(
      async (png, zona, colores) => {
        const img = new Image();
        img.src = `data:image/png;base64,${png}`;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = Math.floor(zona.ancho);
        c.height = Math.floor(zona.alto);
        c.getContext('2d').drawImage(img, zona.x, zona.y, c.width, c.height, 0, 0, c.width, c.height);
        const { data } = c.getContext('2d').getImageData(0, 0, c.width, c.height);
        const rgb = colores.map((t) => (t.match(/\d+/g) ?? []).slice(0, 3).map(Number));
        const cuenta = rgb.map(() => 0);
        for (let p = 0; p < data.length; p += 4) rgb.forEach(([r, g, b], j) => Math.abs(data[p] - r) + Math.abs(data[p + 1] - g) + Math.abs(data[p + 2] - b) <= 60 && cuenta[j]++);
        return cuenta;
      },
      png,
      zona,
      colores,
    );
  };

  for (let i = 1; i <= Number(veces); i++) {
    for (const metodo of ['fullPage', 'ventana-alta']) {
      await page.evaluate(() => {
        window.__eventos = [];
        window.scrollTo(0, 0);
      });
      const archivo = `${SALIDA}${metodo}-${ancho}-${tema}-${i}.png`;
      if (metodo === 'fullPage') {
        await page.screenshot({ path: archivo, fullPage: true });
      } else {
        const alto = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.setViewport({ width: Number(ancho), height: alto });
        await page.waitForFunction(() => document.querySelectorAll('.grafico__lienzo svg.recharts-surface').length === 3, { timeout: 10_000 });
        await pausa(400);
        await page.evaluate(() => (window.__eventos = []));
        await page.screenshot({ path: archivo });
        await page.setViewport({ width: Number(ancho), height: 900 });
      }
      const eventos = await page.evaluate(() => window.__eventos);
      await page.waitForFunction(() => document.querySelectorAll('.grafico__lienzo svg.recharts-surface').length === 3, { timeout: 10_000 });
      const px = await pixeles(archivo);
      console.log(`${metodo} #${i}: eventos durante la captura ${JSON.stringify(eventos)} · píxeles de las métricas en la imagen ${px.join('/')}${px.every((n) => n > 100) ? '' : '  ← paneles vacíos en la imagen'}`);
    }
  }
} finally {
  await browser.close();
}
