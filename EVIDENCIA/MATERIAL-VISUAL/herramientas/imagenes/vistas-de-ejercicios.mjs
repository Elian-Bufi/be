// Vistas de los recortes REALES de las imágenes de ejercicios que existen, en los dos temas: cada imagen tal como la guarda
// BE (JPEG sobre blanco), entera (contain) dentro de los marcos que usa la app, sobre el fondo de cada tema:
//   APK  · sesión enfocada 112 dp · plan 64 dp · «Ver técnica» 1:1 (300 dp de ancho, como ejemplo)
//   Web  · ficha 5:6 hasta 18rem (288 px) · grilla de «Mis ejercicios» 1:1 (256 px, como ejemplo)
// Escala 1 dp = 1 px. Colores de apps/mobile/src/tema.ts (fondo, superficie, borde, tenue). No toca test.
// Uso: node vistas-de-ejercicios.mjs <carpeta como-las-guarda-be> <carpeta de salida> <árbol con node_modules/sharp>
import fs from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const [entrada, salida, arbol] = process.argv.slice(2);
const sharp = createRequire(join(arbol, 'package.json'))('sharp');
sharp.cache(false);
fs.mkdirSync(salida, { recursive: true });

const TEMAS = {
  'azul-noche': { fondo: '#011325', superficie: '#052238', borde: '#173F61', texto: '#FFFFFF', tenue: '#8DCAE5' },
  claro: { fondo: '#F2F6FC', superficie: '#FFFFFF', borde: '#E3ECFF', texto: '#0A1F44', tenue: '#62728A' },
};
const MARCOS = [
  { x: 24, y: 48, w: 112, h: 112, rotulo: 'APK · sesión enfocada · 112 dp' },
  { x: 176, y: 48, w: 64, h: 64, rotulo: 'APK · plan · 64 dp' },
  { x: 316, y: 48, w: 300, h: 300, rotulo: 'APK · «Ver técnica» · 1:1' },
  { x: 24, y: 412, w: 288, h: 346, rotulo: 'Web · ficha · 5:6 (18rem)' },
  { x: 336, y: 412, w: 256, h: 256, rotulo: 'Web · «Mis ejercicios» · 1:1' },
];
const ANCHO = 640;
const ALTO = 820;
const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

for (const archivo of fs.readdirSync(entrada).filter((f) => f.endsWith('.jpg')).sort()) {
  const clave = archivo.replace(/\.jpg$/, '');
  for (const [tema, c] of Object.entries(TEMAS)) {
    const capas = [];
    for (const m of MARCOS) {
      const img = await sharp(join(entrada, archivo)).resize(m.w, m.h, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
      capas.push({ input: img, left: m.x, top: m.y });
    }
    const marcos = MARCOS.map(
      (m) =>
        `<rect x="${m.x - 0.5}" y="${m.y - 0.5}" width="${m.w + 1}" height="${m.h + 1}" rx="10" fill="none" stroke="${c.borde}" stroke-width="1"/>` +
        `<text x="${m.x}" y="${m.y + m.h + 18}" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="${c.tenue}">${escapar(m.rotulo)}</text>`,
    );
    const encabezado =
      `<text x="24" y="24" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="700" fill="${c.texto}">${escapar(clave)} · tema ${tema === 'claro' ? 'Claro' : 'Azul noche'}</text>` +
      `<text x="24" y="${ALTO - 10}" font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="${c.tenue}">Vista de recortes reales (no es una captura de la app): la imagen tal como la guarda BE, entera y sobre blanco.</text>`;
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}">${encabezado}${marcos.join('')}</svg>`);
    const destino = join(salida, `${clave}-${tema}.png`);
    await sharp({ create: { width: ANCHO, height: ALTO, channels: 3, background: c.fondo } })
      .composite([...capas, { input: svg, left: 0, top: 0 }])
      .png()
      .toFile(destino);
    console.log(`${destino} · ${(fs.statSync(destino).size / 1024).toFixed(0)} KB`);
  }
}
