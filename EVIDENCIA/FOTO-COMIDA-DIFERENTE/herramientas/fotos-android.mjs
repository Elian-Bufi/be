// Archivos sintéticos con la forma en que los deja `expo-image-picker` 57 en Android con `quality: 0.8` (la de la APK),
// según su fuente (MediaHandler.handleImage, CompressionImageExporter, ImagePickerUtils):
// - decodifica el original con Glide (que aplica la orientación EXIF a los píxeles) y lo vuelve a codificar: en PNG si el
//   archivo de salida es .png, si no en JPEG; la extensión sale del tipo del ORIGINAL (.webp y .gif conservan la suya; HEIC
//   y otros caen en .jpeg);
// - copia el EXIF del original salvo la orientación y las medidas (con GPS, marca y modelo);
// - `mimeType` es el del original y `fileSize` el del original; `width` y `height`, los del bitmap.
// Ninguna es una foto real: son imágenes generadas, sin personas, con el texto «foto sintética de prueba».
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(new URL('../../../package.json', import.meta.url));
const sharp = require('sharp');

// Fuera del repositorio: son archivos generados, de varios MB.
export const DIR = join(tmpdir(), 'be-fotos-android');
mkdirSync(DIR, { recursive: true });

const EXIF = {
  IFD0: { Make: 'Google', Model: 'Pixel 7', DateTime: '2026:10:06 21:30:00' },
  IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '34/1 36/1 0/1', GPSLongitudeRef: 'W', GPSLongitude: '58/1 22/1 0/1' },
};

/** Un plato de comida de juguete: fondo con ruido (como el grano de una foto), un plato y el rótulo. */
function plato(ancho, alto, sigma = 14) {
  const r = Math.round(Math.min(ancho, alto) * 0.35);
  const svg = `<svg width="${ancho}" height="${alto}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${ancho / 2}" cy="${alto / 2}" r="${r}" fill="#f4f1ea" stroke="#c9c2b3" stroke-width="${r / 20}"/>
    <circle cx="${ancho / 2 - r / 3}" cy="${alto / 2}" r="${r / 3}" fill="#e3b04b"/>
    <circle cx="${ancho / 2 + r / 3}" cy="${alto / 2 - r / 5}" r="${r / 4}" fill="#4f8a3a"/>
    <text x="${ancho / 2}" y="${alto * 0.12}" font-size="${Math.round(alto / 22)}" text-anchor="middle" fill="#1d2a44" font-family="Arial">foto sintética de prueba · ${ancho}×${alto}</text>
    <text x="${ancho * 0.06}" y="${alto * 0.94}" font-size="${Math.round(alto / 18)}" fill="#1d2a44" font-family="Arial">ARRIBA ↑</text>
  </svg>`;
  return sharp({ create: { width: ancho, height: alto, channels: 3, background: '#8a6d4b', noise: { type: 'gaussian', mean: 120, sigma } } }).composite([{ input: Buffer.from(svg) }]);
}

const jpeg = async (ancho, alto, calidad = 80, sigma) => (await plato(ancho, alto, sigma).jpeg({ quality: calidad }).withExif(EXIF).toBuffer());

export async function generar() {
  const casos = [];
  const guardar = (nombre, bytes, selector, esperado) => {
    const ruta = join(DIR, nombre);
    writeFileSync(ruta, bytes);
    const uri = pathToFileURL(ruta).href;
    casos.push({ nombre, uri, bytes: bytes.length, selector: { uri, fileName: nombre, ...selector }, esperado });
  };
  const horizontal = await jpeg(4000, 3000);
  guardar('camara-horizontal.jpeg', horizontal, { mimeType: 'image/jpeg', width: 4000, height: 3000, fileSize: 5_800_000 }, 'sube');
  const vertical = await jpeg(3000, 4000);
  guardar('camara-vertical.jpeg', vertical, { mimeType: 'image/jpeg', width: 3000, height: 4000, fileSize: 5_600_000 }, 'sube');
  const captura = await plato(1080, 2400, 4).png().toBuffer();
  guardar('galeria-captura.png', captura, { mimeType: 'image/png', width: 1080, height: 2400, fileSize: captura.length }, 'sube');
  // Un WebP de la galería: el selector lo vuelve a codificar en JPEG, pero el archivo se llama .webp y declara image/webp.
  guardar('galeria-webp.webp', await jpeg(1600, 1200), { mimeType: 'image/webp', width: 1600, height: 1200, fileSize: 380_000 }, 'sube');
  // Un HEIC de la galería: sale en .jpeg, en JPEG, y declara image/heic.
  guardar('galeria-heic.jpeg', await jpeg(4032, 3024), { mimeType: 'image/heic', width: 4032, height: 3024, fileSize: 2_100_000 }, 'sube');
  // Un GIF de la galería: el primer cuadro, en JPEG, en un archivo .gif que declara image/gif.
  guardar('galeria-gif.gif', await jpeg(480, 360), { mimeType: 'image/gif', width: 480, height: 360, fileSize: 900_000 }, 'sube');
  // Más de 10 MB después de la compresión del selector: se rechaza en el teléfono, sin pedir la ruta.
  const pesada = await jpeg(6000, 6000, 97, 60);
  guardar('mas-de-10-mb.jpeg', pesada, { mimeType: 'image/jpeg', width: 6000, height: 6000, fileSize: pesada.length }, 'TAMANO');
  return casos;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  for (const c of await generar()) console.log(`${c.nombre}: ${c.bytes} bytes · selector ${c.selector.mimeType} ${c.selector.width}×${c.selector.height}`);
}
