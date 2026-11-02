// Construye la guía central y el cuaderno de datos: primero las láminas (laminas/construir.mjs), después los PDF con
// Typst. Las tipografías son las de tipografias/ (Inter y JetBrains Mono, licencia OFL), sin las del sistema: el mismo
// commit da el mismo PDF. Uso: node construir.mjs [--sin-laminas] [guia|cuaderno]
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { typst } from './herramientas/typst.mjs';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../../..');
const args = process.argv.slice(2);
const version = JSON.parse(readFileSync(join(aqui, 'datos/version.json'), 'utf8'));
const fecha = String(Math.floor(Date.parse(version.commitFecha) / 1000));

if (!args.includes('--sin-laminas')) execFileSync(process.execPath, [join(aqui, 'laminas/construir.mjs'), '--sin-exportar'], { stdio: 'inherit' });

const documentos = [
  { clave: 'guia', fuente: 'guia-central/guia.typ', salida: 'BE-guia-central.pdf' },
  { clave: 'cuaderno', fuente: 'cuaderno-de-datos/cuaderno.typ', salida: 'BE-cuaderno-de-datos.pdf' },
];
const elegidos = args.filter((a) => !a.startsWith('--'));
mkdirSync(join(aqui, 'salida'), { recursive: true });
for (const d of documentos) {
  if (elegidos.length && !elegidos.includes(d.clave)) continue;
  const salida = join(aqui, 'salida', d.salida);
  const base = ['compile', '--root', raiz, '--font-path', join(aqui, 'tipografias'), '--ignore-system-fonts', '--creation-timestamp', fecha];
  execFileSync(typst(), [...base, join(aqui, d.fuente), salida], { stdio: 'inherit' });
  console.log(`listo: salida/${d.salida}`);
  // --png: cada página como imagen, para revisarla a ojo (salida/revision, fuera del repositorio).
  if (args.includes('--png')) {
    const carpeta = join(aqui, 'salida/revision');
    mkdirSync(carpeta, { recursive: true });
    execFileSync(typst(), [...base, '--format', 'png', '--ppi', '110', join(aqui, d.fuente), join(carpeta, `${d.clave}-{0p}.png`)], { stdio: 'inherit' });
    console.log(`páginas en salida/revision/${d.clave}-NN.png`);
  }
}
