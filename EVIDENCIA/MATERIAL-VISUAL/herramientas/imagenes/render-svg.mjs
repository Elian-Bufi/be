// Rasteriza un SVG a PNG con sharp, para revisarlo a ojo. Uso: node render-svg.mjs <svg> <png> <árbol con sharp>
import { createRequire } from 'node:module';
import { join } from 'node:path';
const [svg, png, arbol] = process.argv.slice(2);
const sharp = createRequire(join(arbol, 'package.json'))('sharp');
await sharp(svg, { density: 96 }).png().toFile(png);
console.log('listo', png);
