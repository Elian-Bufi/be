// Medidas de texto con las tipografías reales (las mismas que usa Typst al dibujar): se leen las tablas cmap y hmtx de
// cada TTF, sin dependencias. El ancho ignora el interletrado (kerning), que en Inter achica el texto: la medida queda
// apenas por encima de lo dibujado, del lado seguro.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CARPETA = join(dirname(fileURLToPath(import.meta.url)), '../../tipografias');
const ARCHIVOS = {
  Inter: { 400: 'Inter-Regular.ttf', 500: 'Inter-Medium.ttf', 600: 'Inter-SemiBold.ttf', 700: 'Inter-Bold.ttf', '400i': 'Inter-Italic.ttf', '600i': 'Inter-SemiBoldItalic.ttf' },
  'JetBrains Mono': { 400: 'JetBrainsMono-Regular.ttf', 500: 'JetBrainsMono-Medium.ttf', 600: 'JetBrainsMono-Bold.ttf', 700: 'JetBrainsMono-Bold.ttf' },
};
const cache = new Map();

function leerFuente(ruta) {
  const b = readFileSync(ruta);
  const tablas = {};
  for (let i = 0, n = b.readUInt16BE(4); i < n; i++) {
    const o = 12 + i * 16;
    tablas[b.toString('latin1', o, o + 4)] = b.readUInt32BE(o + 8);
  }
  const unidades = b.readUInt16BE(tablas.head + 18);
  const ascendente = b.readInt16BE(tablas.hhea + 4);
  const descendente = b.readInt16BE(tablas.hhea + 6);
  const metricasH = b.readUInt16BE(tablas.hhea + 34);
  const avance = (g) => b.readUInt16BE(tablas.hmtx + 4 * Math.min(g, metricasH - 1));
  // cmap: preferimos el formato 12 (Unicode completo) y si no, el 4 (BMP).
  const c = tablas.cmap;
  let f4 = null;
  let f12 = null;
  for (let i = 0, n = b.readUInt16BE(c + 2); i < n; i++) {
    const plataforma = b.readUInt16BE(c + 4 + i * 8);
    const sub = c + b.readUInt32BE(c + 8 + i * 8);
    const formato = b.readUInt16BE(sub);
    if (formato === 12 && (plataforma === 3 || plataforma === 0)) f12 ??= sub;
    if (formato === 4 && (plataforma === 3 || plataforma === 0)) f4 ??= sub;
  }
  function glifo(cp) {
    if (f12) {
      for (let i = 0, n = b.readUInt32BE(f12 + 12); i < n; i++) {
        const g = f12 + 16 + i * 12;
        const ini = b.readUInt32BE(g);
        const fin = b.readUInt32BE(g + 4);
        if (cp >= ini && cp <= fin) return b.readUInt32BE(g + 8) + (cp - ini);
        if (cp < ini) break;
      }
      return 0;
    }
    if (!f4 || cp > 0xffff) return 0;
    const segs = b.readUInt16BE(f4 + 6) / 2;
    const finales = f4 + 14;
    const iniciales = finales + segs * 2 + 2;
    const deltas = iniciales + segs * 2;
    const rangos = deltas + segs * 2;
    for (let i = 0; i < segs; i++) {
      const fin = b.readUInt16BE(finales + i * 2);
      if (fin < cp) continue;
      const ini = b.readUInt16BE(iniciales + i * 2);
      if (ini > cp) return 0;
      const delta = b.readInt16BE(deltas + i * 2);
      const rango = b.readUInt16BE(rangos + i * 2);
      if (rango === 0) return (cp + delta) & 0xffff;
      const g = b.readUInt16BE(rangos + i * 2 + rango + 2 * (cp - ini));
      return g === 0 ? 0 : (g + delta) & 0xffff;
    }
    return 0;
  }
  const anchos = new Map();
  return {
    tiene: (cp) => glifo(cp) !== 0,
    unidades,
    ascendente,
    descendente,
    anchoDe(cp) {
      if (!anchos.has(cp)) anchos.set(cp, avance(glifo(cp)));
      return anchos.get(cp);
    },
  };
}

function fuente(familia, peso = 400, cursiva = false) {
  const clave = `${familia}|${peso}|${cursiva}`;
  if (!cache.has(clave)) {
    const tabla = ARCHIVOS[familia];
    if (!tabla) throw new Error(`familia sin archivo: ${familia}`);
    const archivo = tabla[cursiva ? `${peso}i` : peso] ?? tabla[400];
    cache.set(clave, leerFuente(join(CARPETA, archivo)));
  }
  return cache.get(clave);
}

/** Ancho en pt de un texto en una línea. */
export function ancho(texto, { familia = 'Inter', peso = 400, cursiva = false, tamano = 10 } = {}) {
  const f = fuente(familia, peso, cursiva);
  let u = 0;
  for (const ch of String(texto)) u += f.anchoDe(ch.codePointAt(0));
  return (u / f.unidades) * tamano;
}

/** Ascendente y descendente (en pt) para ubicar la línea de base dentro de una caja. */
export function alturas({ familia = 'Inter', peso = 400, tamano = 10 } = {}) {
  const f = fuente(familia, peso);
  return { ascendente: (f.ascendente / f.unidades) * tamano, descendente: (-f.descendente / f.unidades) * tamano };
}

/** Parte un texto en líneas que no superan `maximo` pt, por palabras. Una palabra más larga que el máximo queda sola. */
export function envolver(texto, maximo, estilo = {}) {
  const lineas = [];
  for (const parrafo of String(texto).split('\n')) {
    let actual = '';
    for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (!actual || ancho(prueba, estilo) <= maximo) actual = prueba;
      else {
        lineas.push(actual);
        actual = palabra;
      }
    }
    lineas.push(actual);
  }
  return lineas;
}

/** Caracteres del texto que la tipografía no tiene (Typst los dibujaría con otra fuente). */
export function faltantes(texto, { familia = 'Inter', peso = 400, cursiva = false } = {}) {
  const f = fuente(familia, peso, cursiva);
  return [...new Set([...String(texto)].filter((ch) => !/s/.test(ch) && !f.tiene(ch.codePointAt(0))))];
}
