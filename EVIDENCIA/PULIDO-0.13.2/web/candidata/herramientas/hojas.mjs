// Hojas de contacto de las capturas del website sobre la candidata combinada: una grilla rotulada por hoja, en JPEG.
// Uso: node hojas.mjs <carpeta de capturas> <carpeta de salida>
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire('C:/Users/bufim/AppData/Local/Temp/claude/C--Users-bufim-BE-Best/48b6effd-4f9c-500b-87ab-08468f0503c1/scratchpad/e2e/tanda/');
const puppeteer = require('puppeteer-core');
const [origen, destino] = process.argv.slice(2);
fs.mkdirSync(destino, { recursive: true });
const TEMAS = ['azul-noche', 'claro'];
const ANCHOS = ['360', '390', '1440'];
const LETRAS = ['letra-normal', 'letra-grande'];
const matriz = (prefijo, sufijo = () => '') =>
  TEMAS.flatMap((t) => LETRAS.flatMap((l) => ANCHOS.map((a) => ({ archivo: `${prefijo}-${a}-${t}-${l}${sufijo(a)}.png`, rotulo: `${a} px · ${t === 'claro' ? 'Claro' : 'Azul noche'} · ${l === 'letra-grande' ? 'letra grande (150 %)' : 'letra normal'}` }))));
const HOJAS = [
  { nombre: 'candidata-01-tomas', titulo: 'Tomas registradas · orden por fecha de la toma, abierta la más reciente', celdas: matriz('a-tomas'), columnas: 6 },
  { nombre: 'candidata-02-lamina', titulo: 'Lámina · la imagen y «Descargar imagen» primero', celdas: matriz('b-lamina'), columnas: 6 },
  { nombre: 'candidata-03-preparacion', titulo: 'Preparación · último campo enfocado; en el teléfono, teclado emulado (la ventana pierde 330 px)', celdas: matriz('c-preparacion', (a) => (Number(a) < 500 ? '-teclado-emulado' : '')), columnas: 6 },
  {
    nombre: 'candidata-04-validacion',
    titulo: 'Un valor ilegible con el teclado emulado · 390 px, Azul noche',
    celdas: ['', '-letra-grande'].flatMap((g) => [
      { archivo: `e-validacion-1-escrito${g}.png`, rotulo: `1 · escrito${g ? ' · letra grande' : ''}` },
      { archivo: `e-validacion-2-aviso${g}.png`, rotulo: `2 · «Guardar»: el aviso toma el foco y nombra el campo${g ? ' · letra grande' : ''}` },
      { archivo: `e-validacion-3-en-el-campo${g}.png`, rotulo: `3 · el enlace lleva al campo, con su error a la vista${g ? ' · letra grande' : ''}` },
      { archivo: `e-validacion-4-segundo-guardar${g}.png`, rotulo: `4 · un segundo «Guardar» vuelve a llevar el foco al aviso${g ? ' · letra grande' : ''}` },
    ]),
    columnas: 4,
  },
  {
    nombre: 'candidata-05-visor-e-indice',
    titulo: 'Visor «Ver en tamaño real» (390 px) y el eje de un índice en la evolución',
    celdas: [
      { archivo: 'd-visor-ampliado-390.png', rotulo: 'Visor: la lámina a 1080 px, con «Ver entera»' },
      { archivo: 'd-visor-ampliado-390-desplazado.png', rotulo: 'Visor desplazado con el dedo' },
      { archivo: 'f-evolucion-indice-390.png', rotulo: 'Índice cintura/cadera · 390 px' },
      { archivo: 'f-evolucion-indice-1440.png', rotulo: 'Índice cintura/cadera · 1440 px: eje de 0,8 a 0,92' },
    ],
    columnas: 4,
  },
];

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--allow-file-access-from-files'] });
const p = await browser.newPage();
const faltan = [];
for (const h of HOJAS) {
  const celdas = h.celdas.filter((c) => {
    const ok = fs.existsSync(path.join(origen, c.archivo));
    if (!ok) faltan.push(c.archivo);
    return ok;
  });
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:24px;background:#eef2f7;font:15px/1.35 system-ui,Segoe UI,sans-serif;color:#0a1f44}
    h1{font-size:20px;margin:0 0 4px} p{margin:0 0 16px;color:#4a5a73}
    .g{display:grid;grid-template-columns:repeat(${h.columnas},1fr);gap:14px;align-items:start}
    figure{margin:0;background:#fff;border:1px solid #cfd8e6;border-radius:10px;padding:8px}
    img{display:block;width:100%;height:auto;border-radius:6px} figcaption{font-size:13px;margin-top:6px}
  </style><h1>${h.titulo}</h1><p>Website local con datos sintéticos, candidata combinada. Captura de Chrome sin interfaz; el teclado del teléfono es una emulación.</p>
  <div class="g">${celdas.map((c) => `<figure><img src="${pathToFileURL(path.join(origen, c.archivo)).href}"><figcaption>${c.rotulo}</figcaption></figure>`).join('')}</div>`;
  const temporal = path.join(destino, `${h.nombre}.html`);
  fs.writeFileSync(temporal, html);
  await p.setViewport({ width: h.columnas >= 6 ? 2400 : 2000, height: 900, deviceScaleFactor: 1 });
  await p.goto(pathToFileURL(temporal).href, { waitUntil: 'load' });
  await p.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => (i.onload = i.onerror = r))))));
  await p.screenshot({ path: path.join(destino, `${h.nombre}.jpg`), type: 'jpeg', quality: 78, fullPage: true });
  fs.unlinkSync(temporal);
}
// La imagen exportada, reducida a la mitad (el archivo original es de 2160 × 3840).
const exportada = path.join(origen, 'g-exportada.png');
if (fs.existsSync(exportada)) {
  const temporal = path.join(destino, 'exportada.html');
  fs.writeFileSync(temporal, `<!doctype html><style>body{margin:0}img{display:block;width:1080px;height:1920px}</style><img src="${pathToFileURL(exportada).href}">`);
  await p.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await p.goto(pathToFileURL(temporal).href, { waitUntil: 'load' });
  await p.screenshot({ path: path.join(destino, 'candidata-06-exportada-a-la-mitad.jpg'), type: 'jpeg', quality: 80 });
  fs.unlinkSync(temporal);
}
await browser.close();
console.log(JSON.stringify({ faltan }));
