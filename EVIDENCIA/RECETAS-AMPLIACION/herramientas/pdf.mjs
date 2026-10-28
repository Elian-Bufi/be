#!/usr/bin/env node
// Compila los dos PDF de la entrega de las recetas (encargo nocturno de Dirección del 2026-10-28, §12):
//   salida/BE-recetario-ampliacion.pdf      · las 50 nuevas, una por página, y la vista de las 66
//   salida/BE-recetas-hoja-de-contacto.pdf  · las fotos de las 66, seis por página, o «Falta la foto»
// Typst solo lee archivos dentro de su raíz, y las fotos viven fuera del repositorio: por eso se arma una carpeta de
// trabajo con las plantillas, los datos y una miniatura de cada foto registrada, y se compila ahí. Los PDF quedan en el
// repositorio; la carpeta de trabajo se borra (salvo que se pase --trabajo).
//
//   node EVIDENCIA/RECETAS-AMPLIACION/herramientas/pdf.mjs [--typst <ejecutable>] [--trabajo <carpeta>]
//
// Antes: node EVIDENCIA/RECETAS-AMPLIACION/herramientas/armar-entrega.mjs (los datos). Typst 0.15.1; si no está en el
// PATH, se pasa con --typst o con la variable TYPST.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const CARPETA = resolve(AQUI, '..');
const RAIZ = resolve(CARPETA, '..', '..');
const arg = (nombre) => {
  const k = process.argv.indexOf(nombre);
  return k > 0 ? process.argv[k + 1] : null;
};
const typst = arg('--typst') ?? process.env.TYPST ?? 'typst';
const propia = arg('--trabajo');
const trabajo = propia ? resolve(propia) : fs.mkdtempSync(join(tmpdir(), 'be-recetas-pdf-'));

try {
  for (const sub of ['pdf', 'datos', 'img']) fs.mkdirSync(join(trabajo, sub), { recursive: true });
  for (const f of ['recetario.typ', 'contacto.typ']) fs.copyFileSync(join(CARPETA, 'pdf', f), join(trabajo, 'pdf', f));
  for (const f of ['recetario.json', 'contacto.json']) fs.copyFileSync(join(CARPETA, 'datos', f), join(trabajo, 'datos', f));
  // Una miniatura de 800 × 600 de cada foto registrada: alcanza para la hoja de contacto y deja el PDF liviano.
  const registro = fs.existsSync(join(CARPETA, 'fotos.json')) ? JSON.parse(fs.readFileSync(join(CARPETA, 'fotos.json'), 'utf8')) : { fotos: {} };
  const fotos = Object.values(registro.fotos);
  if (fotos.length > 0) {
    const { default: sharp } = await import('sharp');
    for (const f of fotos) await sharp(f.entrega.ruta).resize(800, 600, { fit: 'cover' }).jpeg({ quality: 85 }).toFile(join(trabajo, 'img', `${f.codigo}.jpg`));
  }
  const salida = join(CARPETA, 'salida');
  fs.mkdirSync(salida, { recursive: true });
  const fuentes = join(RAIZ, 'docs', 'guias', 'ENTENDER-BE', 'tipografias');
  for (const [plantilla, pdf] of [
    ['recetario.typ', 'BE-recetario-ampliacion.pdf'],
    ['contacto.typ', 'BE-recetas-hoja-de-contacto.pdf'],
  ]) {
    execFileSync(typst, ['compile', '--root', trabajo, '--font-path', fuentes, '--ignore-system-fonts', join(trabajo, 'pdf', plantilla), join(salida, pdf)], { stdio: 'inherit' });
    console.log(`${pdf}: ${(fs.statSync(join(salida, pdf)).size / 1024).toFixed(0)} KB`);
  }
  console.log(`Con ${fotos.length} fotos registradas.`);
} finally {
  if (!propia) fs.rmSync(trabajo, { recursive: true, force: true });
}
