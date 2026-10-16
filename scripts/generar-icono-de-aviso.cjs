/**
 * El ícono de los avisos de Android (WP-NOVEDADES-Y-AVISOS, DL-133): Android dibuja el ícono de una notificación con
 * su forma y le pone el color él, así que tiene que ser blanco con transparencia (expo-notifications: «96x96 all-white
 * png with transparency»). Si no, muestra un cuadrado. Sale del isotipo de la marca: su dibujo claro (el aro y las alas),
 * en blanco; el disco del fondo queda transparente, porque como silueta sería un círculo lleno.
 *
 * Sin dependencias: lee el PNG del isotipo (paleta de 8 bits con transparencia), reduce a 96 × 96 promediando y
 * escribe un PNG RGBA. Reproducible: el mismo isotipo da el mismo archivo.
 *
 * Uso: node scripts/generar-icono-de-aviso.cjs [--verificar]
 */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const RAIZ = path.join(__dirname, '..');
const ORIGEN = path.join(RAIZ, 'apps/mobile/assets/isotipo.png');
const DESTINO = path.join(RAIZ, 'apps/mobile/assets/icono-de-aviso.png');
const LADO = 96;

function leerPng(archivo) {
  const b = fs.readFileSync(archivo);
  let o = 8;
  let ancho = 0;
  let alto = 0;
  let paleta = null;
  let alfas = null;
  const datos = [];
  while (o < b.length) {
    const n = b.readUInt32BE(o);
    const tipo = b.toString('ascii', o + 4, o + 8);
    const c = b.subarray(o + 8, o + 8 + n);
    if (tipo === 'IHDR') {
      ancho = c.readUInt32BE(0);
      alto = c.readUInt32BE(4);
      if (c[8] !== 8 || c[9] !== 3 || c[12] !== 0) throw new Error('el isotipo tiene que ser un PNG de paleta de 8 bits, sin entrelazado');
    } else if (tipo === 'PLTE') paleta = c;
    else if (tipo === 'tRNS') alfas = c;
    else if (tipo === 'IDAT') datos.push(c);
    o += 12 + n;
  }
  const crudo = zlib.inflateSync(Buffer.concat(datos));
  // Deshacer los filtros de cada fila (un byte por píxel).
  const indices = Buffer.alloc(ancho * alto);
  let previa = Buffer.alloc(ancho);
  for (let y = 0; y < alto; y++) {
    const filtro = crudo[y * (ancho + 1)];
    const fila = Buffer.from(crudo.subarray(y * (ancho + 1) + 1, (y + 1) * (ancho + 1)));
    for (let x = 0; x < ancho; x++) {
      const a = x > 0 ? fila[x - 1] : 0;
      const arriba = previa[x];
      const c = x > 0 ? previa[x - 1] : 0;
      let suma = 0;
      if (filtro === 1) suma = a;
      else if (filtro === 2) suma = arriba;
      else if (filtro === 3) suma = (a + arriba) >> 1;
      else if (filtro === 4) {
        const p = a + arriba - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - arriba);
        const pc = Math.abs(p - c);
        suma = pa <= pb && pa <= pc ? a : pb <= pc ? arriba : c;
      }
      fila[x] = (fila[x] + suma) & 0xff;
    }
    fila.copy(indices, y * ancho);
    previa = fila;
  }
  const alfa = (i) => (alfas && i < alfas.length ? alfas[i] : 255);
  if (!paleta) throw new Error('el isotipo no tiene paleta');
  // Cuánto cuenta cada color: su opacidad por su claridad, en rampa entre 120 y 180 de luminancia (el dibujo claro).
  const peso = (i) => {
    const luminancia = 0.2126 * paleta[i * 3] + 0.7152 * paleta[i * 3 + 1] + 0.0722 * paleta[i * 3 + 2];
    return alfa(i) * Math.min(1, Math.max(0, (luminancia - 120) / 60));
  };
  return { ancho, alto, alfaDe: (x, y) => peso(indices[y * ancho + x]) };
}

const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(b) {
  let c = 0xffffffff;
  for (const x of b) c = TABLA_CRC[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function trozo(tipo, datos) {
  const t = Buffer.from(tipo, 'ascii');
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, datos])));
  return Buffer.concat([largo, t, datos, crc]);
}

function generar() {
  const origen = leerPng(ORIGEN);
  const escala = origen.ancho / LADO;
  const filas = [];
  for (let y = 0; y < LADO; y++) {
    const fila = Buffer.alloc(1 + LADO * 4); // filtro 0
    for (let x = 0; x < LADO; x++) {
      let suma = 0;
      let n = 0;
      for (let sy = Math.floor(y * escala); sy < Math.floor((y + 1) * escala); sy++) {
        for (let sx = Math.floor(x * escala); sx < Math.floor((x + 1) * escala); sx++) {
          suma += origen.alfaDe(sx, sy);
          n++;
        }
      }
      const a = Math.round(suma / Math.max(1, n));
      fila.set([255, 255, 255, a], 1 + x * 4);
    }
    filas.push(fila);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(LADO, 0);
  ihdr.writeUInt32BE(LADO, 4);
  ihdr.set([8, 6, 0, 0, 0], 8); // RGBA de 8 bits
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', ihdr),
    trozo('IDAT', zlib.deflateSync(Buffer.concat(filas), { level: 9 })),
    trozo('IEND', Buffer.alloc(0)),
  ]);
}

const png = generar();
if (process.argv.includes('--verificar')) {
  if (!fs.existsSync(DESTINO) || !fs.readFileSync(DESTINO).equals(png)) {
    process.stderr.write('apps/mobile/assets/icono-de-aviso.png no coincide con el isotipo. Ejecutá: node scripts/generar-icono-de-aviso.cjs\n');
    process.exit(1);
  }
  process.stdout.write('El ícono de los avisos está al día con el isotipo.\n');
} else {
  fs.writeFileSync(DESTINO, png);
  process.stdout.write(`Escrito ${path.relative(RAIZ, DESTINO)} (${png.length} bytes).\n`);
}
