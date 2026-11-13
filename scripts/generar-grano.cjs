/**
 * Genera `apps/mobile/assets/grano.png`, el grano del fondo de Azul noche (WP-APP-VUELTA-2, AV2-T23, con la vuelta de
 * Dirección a la 0.25: «un fondo más oscuro con una textura suave»).
 *
 * - **Chica y que se repite:** 512 × 512 píxeles, con paleta de cuatro entradas y dos bits por píxel. La APK la dibuja
 *   en mosaico, píxel a píxel (`fondo-de-la-app.tsx`): decodificada pesa 1 MB, contra unos 10 MB de un mapa de bits del
 *   tamaño de la pantalla (AV2-T1).
 * - **Sus topes salen de los tokens:** la mota clara es blanca con el alfa de `granoLuz` (y la mitad), y la oscura,
 *   negra con el de `granoSombra`, de `AZUL_NOCHE` en `tema.ts`. `scripts/contraste.test.cjs` lee la paleta del archivo
 *   y falla si una mota pasa su token: el contraste se mide con el grano en el peor punto.
 * - **Siempre la misma:** un generador con semilla fija. Volver a correrlo da el mismo archivo.
 *
 * Uso: node scripts/generar-grano.cjs
 */
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { crc32, deflateSync } = require('node:zlib');

const RAIZ = join(__dirname, '..');
const LADO = 512;
const SEMILLA = 0x0be170;

function tokenDeAzulNoche(clave) {
  const ts = readFileSync(join(RAIZ, 'apps/mobile/src/tema.ts'), 'utf8');
  const inicio = ts.indexOf('export const AZUL_NOCHE = {');
  const cuerpo = ts.slice(inicio, ts.indexOf('};', inicio));
  const m = new RegExp(`${clave}: '#([0-9a-f]{6})([0-9a-f]{2})'`, 'i').exec(cuerpo);
  if (!m) throw new Error(`tema.ts no declara ${clave} en AZUL_NOCHE`);
  return { color: m[1].toLowerCase(), alfa: parseInt(m[2], 16) };
}

/** Un generador congruencial con semilla: el mismo grano en cada corrida. */
function generador(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function trozo(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const control = Buffer.alloc(4);
  control.writeUInt32BE(crc32(cuerpo) >>> 0);
  return Buffer.concat([largo, cuerpo, control]);
}

function generar() {
  const luz = tokenDeAzulNoche('granoLuz');
  const sombra = tokenDeAzulNoche('granoSombra');
  if (luz.color !== 'ffffff' || sombra.color !== '000000') throw new Error('el grano es de motas blancas y negras');
  // La paleta: nada, la mota clara suave, la mota clara y la mota oscura.
  const paleta = Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00]);
  const alfas = Buffer.from([0, Math.floor(luz.alfa / 2), luz.alfa, sombra.alfa]);
  // Cuánto de cada una: casi todo vacío, para que sea un grano y no un velo.
  const azar = generador(SEMILLA);
  const indice = () => {
    const r = azar();
    return r < 0.6 ? 0 : r < 0.78 ? 1 : r < 0.86 ? 2 : 3;
  };
  const porFila = LADO / 4; // dos bits por píxel
  const crudo = Buffer.alloc((porFila + 1) * LADO);
  for (let y = 0; y < LADO; y++) {
    const fila = y * (porFila + 1);
    crudo[fila] = 0; // sin filtro
    for (let x = 0; x < porFila; x++) crudo[fila + 1 + x] = (indice() << 6) | (indice() << 4) | (indice() << 2) | indice();
  }
  const cabecera = Buffer.alloc(13);
  cabecera.writeUInt32BE(LADO, 0);
  cabecera.writeUInt32BE(LADO, 4);
  cabecera[8] = 2; // bits por píxel
  cabecera[9] = 3; // con paleta
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', cabecera),
    trozo('PLTE', paleta),
    trozo('tRNS', alfas),
    trozo('IDAT', deflateSync(crudo, { level: 9 })),
    trozo('IEND', Buffer.alloc(0)),
  ]);
}

if (require.main === module) {
  const png = generar();
  writeFileSync(join(RAIZ, 'apps/mobile/assets/grano.png'), png);
  console.log(`apps/mobile/assets/grano.png: ${LADO} × ${LADO}, ${png.length} bytes`);
}

module.exports = { generar, LADO };
