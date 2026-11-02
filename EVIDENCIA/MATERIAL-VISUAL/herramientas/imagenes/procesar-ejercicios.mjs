// Las imágenes de ejercicios que ya existen (las tres del paquete de Dirección del 2026-10-06): se copian los originales,
// se miden, se cuantifica el halo del contorno (píxeles semitransparentes con tinte rojizo) y se genera la versión tal
// como la guarda BE (DL-120: rotar por EXIF, aplanar sobre blanco si hay transparencia, 1600 px en el lado mayor sin
// agrandar, JPEG de calidad 82; apps/api/src/medios/procesamiento-de-imagen.ts:54-58), más una miniatura liviana para
// la galería. No sube nada ni toca test.
// Uso: node procesar-ejercicios.mjs <carpeta del paquete> <carpeta de salida> <árbol con node_modules/sharp>
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const [paquete, salida, arbol] = process.argv.slice(2);
const sharp = createRequire(join(arbol, 'package.json'))('sharp');
sharp.cache(false);
const sha = (b) => createHash('sha256').update(b).digest('hex');
for (const d of ['originales', 'como-las-guarda-be', 'miniaturas']) fs.mkdirSync(join(salida, d), { recursive: true });

const resultado = [];
for (const archivo of fs.readdirSync(paquete).filter((f) => f.endsWith('.png')).sort()) {
  const clave = archivo.replace(/\.png$/, '');
  const bytes = fs.readFileSync(join(paquete, archivo));
  fs.writeFileSync(join(salida, 'originales', archivo), bytes);
  const meta = await sharp(bytes).metadata();

  // El halo: entre los píxeles del borde (alfa entre 1 y 254), cuántos tienen el rojo bien por encima del verde y el azul.
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let semi = 0;
  let rojizos = 0;
  let transparentes = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a === 0) transparentes++;
    else if (a < 255) {
      semi++;
      if (r > g + 40 && r > b + 40) rojizos++;
    }
  }

  // Como la guarda BE.
  const guardada = await sharp(bytes, { failOn: 'warning' })
    .rotate()
    .flatten({ background: '#ffffff' })
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  fs.writeFileSync(join(salida, 'como-las-guarda-be', `${clave}.jpg`), guardada.data);

  // Miniatura para la galería (sobre blanco, como se ve en la app).
  const mini = await sharp(guardada.data).resize({ width: 480, height: 480, fit: 'inside' }).jpeg({ quality: 80 }).toBuffer({ resolveWithObject: true });
  fs.writeFileSync(join(salida, 'miniaturas', `${clave}.jpg`), mini.data);

  const pixeles = info.width * info.height;
  resultado.push({
    clave,
    original: { archivo: `originales/${archivo}`, ancho: meta.width, alto: meta.height, bytes: bytes.length, formato: meta.format, transparencia: meta.hasAlpha, sha256: sha(bytes) },
    contorno: { pixelesSemitransparentes: semi, rojizos, porcentajeRojizoDelContorno: semi ? +(100 * rojizos / semi).toFixed(1) : 0, porcentajeTransparente: +(100 * transparentes / pixeles).toFixed(1) },
    comoLaGuardaBe: { archivo: `como-las-guarda-be/${clave}.jpg`, ancho: guardada.info.width, alto: guardada.info.height, bytes: guardada.data.length, sha256: sha(guardada.data) },
    miniatura: { archivo: `miniaturas/${clave}.jpg`, ancho: mini.info.width, alto: mini.info.height, bytes: mini.data.length },
  });
}
fs.writeFileSync(join(salida, 'medidas.json'), JSON.stringify(resultado, null, 2));
for (const r of resultado) {
  console.log(`${r.clave}: ${r.original.ancho}×${r.original.alto} ${r.original.formato} ${(r.original.bytes / 1024).toFixed(0)} KB, transparencia ${r.original.transparencia} · contorno ${r.contorno.pixelesSemitransparentes} px semitransparentes, ${r.contorno.rojizos} rojizos (${r.contorno.porcentajeRojizoDelContorno} %) · como la guarda BE ${r.comoLaGuardaBe.ancho}×${r.comoLaGuardaBe.alto} ${(r.comoLaGuardaBe.bytes / 1024).toFixed(0)} KB`);
}
