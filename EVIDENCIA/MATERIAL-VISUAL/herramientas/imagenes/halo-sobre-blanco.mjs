// Cuánto del contorno rojizo de las imágenes del paquete se VE una vez aplanadas sobre blanco (como las guarda y muestra
// BE): cuenta, entre los píxeles que eran mayormente fondo (alfa entre 0 y 0,6), los que quedan con un tinte rojizo visible (rojo al menos 8
// por encima del promedio de verde y azul, y a más de 8 del blanco). Uso: node halo-sobre-blanco.mjs <carpeta> <árbol con sharp>
import fs from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const [carpeta, arbol] = process.argv.slice(2);
const sharp = createRequire(join(arbol, 'package.json'))('sharp');
sharp.cache(false);
for (const archivo of fs.readdirSync(carpeta).filter((f) => f.endsWith('.png')).sort()) {
  const { data, info } = await sharp(join(carpeta, archivo)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let borde = 0;
  let visibles = 0;
  let maximo = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const a = data[i + 3] / 255;
    if (a === 0 || a >= 0.6) continue;
    borde++;
    const [r, g, b] = [0, 1, 2].map((k) => data[i + k] * a + 255 * (1 - a));
    const rojizo = r - (g + b) / 2;
    const lejosDelBlanco = Math.max(255 - r, 255 - g, 255 - b);
    if (rojizo > 8 && lejosDelBlanco > 8) visibles++;
    if (rojizo > maximo) maximo = rojizo;
  }
  console.log(`${archivo}: ${borde} px semitransparentes · ${visibles} con tinte rojizo visible sobre blanco (${((100 * visibles) / (info.width * info.height)).toFixed(3)} % de la imagen) · tinte máximo ${maximo.toFixed(0)}`);
}
