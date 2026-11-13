/**
 * El vocabulario prohibido, en TODO el texto visible del website y de la APK (pedido de Dirección: «persona», nunca
 * «asesorado»; «ubicar, nunca calificar»). Las pruebas de cada pantalla ya miran su propio texto, pero la portada se les
 * escapó el 2026-11-13. Esta prueba recorre todos los .tsx y .ts de apps/web/src y apps/mobile/src y busca la palabra en:
 *  1. el texto entre etiquetas de JSX (`<h2>…</h2>`);
 *  2. las cadenas de una línea con al menos un espacio (`'…'`, `"…"` y las plantillas): son frases, no identificadores.
 * Los comentarios y los nombres del código (`asesoradoId`, `soyAsesorado`) no se ven, así que no cuentan.
 *
 * Uso: npm run test -w @be/web.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CARPETAS = ['apps/web/src', 'apps/mobile/src'];
// Las que no pueden aparecer nunca, ni siquiera negadas (B05). «Racha» y «puntaje» se permiten en una negación («no calcula
// un puntaje»), y las cuidan las pruebas de cada pantalla.
const PROHIBIDAS = /\b(asesorad[oa]s?|cumplimiento|adherencia)\b/i;

function archivos(dir) {
  const salida = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...archivos(ruta));
    else if (/\.(tsx|ts)$/.test(nombre) && !/\.(test|spec)\.tsx?$/.test(nombre)) salida.push(ruta);
  }
  return salida;
}

/** Saca los comentarios sin tocar el largo de las líneas que quedan (para que el número de línea siga valiendo). */
function sinComentarios(codigo) {
  return codigo
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`])\/\/.*$/gm, (c, antes) => antes + ' '.repeat(c.length - antes.length));
}

/** Las frases que se pueden ver: el texto de JSX y las cadenas con espacios. */
export function frasesVisibles(codigo) {
  const limpio = sinComentarios(codigo);
  const frases = [];
  const linea = (i) => limpio.slice(0, i).split('\n').length;
  for (const m of limpio.matchAll(/>([^<>{}=;]+)</g)) if (/[a-záéíóúñ]/i.test(m[1])) frases.push({ texto: m[1].trim(), linea: linea(m.index) });
  for (const m of limpio.matchAll(/'([^'\n]*[ \t][^'\n]*)'|"([^"\n]*[ \t][^"\n]*)"|`([^`\n]*[ \t][^`\n]*)`/g)) {
    frases.push({ texto: (m[1] ?? m[2] ?? m[3]).trim(), linea: linea(m.index) });
  }
  return frases;
}

test('frasesVisibles toma el texto de JSX y las frases, y deja afuera comentarios e identificadores', () => {
  const codigo = [
    '/** El asesorado ve esto (comentario) */',
    'const asesoradoId = "x";',
    '// otro comentario del asesorado',
    'const a = <h2>Para el asesorado</h2>;',
    "const b = 'El asesorado usa BE';",
    'const c = soyAsesorado(p);',
  ].join('\n');
  const prohibidas = frasesVisibles(codigo).filter((f) => PROHIBIDAS.test(f.texto));
  assert.deepEqual(prohibidas.map((f) => [f.linea, f.texto]), [
    [4, 'Para el asesorado'],
    [5, 'El asesorado usa BE'],
  ]);
});

test('ningún texto visible del website ni de la APK usa vocabulario prohibido', () => {
  const hallazgos = [];
  for (const carpeta of CARPETAS) {
    for (const ruta of archivos(join(RAIZ, carpeta))) {
      for (const f of frasesVisibles(readFileSync(ruta, 'utf8'))) {
        if (PROHIBIDAS.test(f.texto)) hallazgos.push(`${relative(RAIZ, ruta).replace(/\\/g, '/')}:${f.linea} · ${f.texto.slice(0, 90)}`);
      }
    }
  }
  assert.deepEqual(hallazgos, []);
});
