// Compila el documento de tesis con Typst.
//   node construir-documento.mjs                    → salida/BE-tesis-v1.pdf (variante pública, la del repositorio)
//   node construir-documento.mjs --evaluacion       → variante de evaluación, con el logotipo de la escuela, los datos
//                                                     de los integrantes y las credenciales; queda FUERA del repositorio
//   node construir-documento.mjs --png [carpeta]    → además, una imagen por página para revisar (fuera del repositorio)
// Datos privados: C:\Users\bufim\BE-datos-locales\tesis\ (o la carpeta de BE_TESIS_PRIVADO): davinci-logotipo.png y
// privado.json. Nunca se copian al repositorio: se usan desde una carpeta ignorada y se borran al terminar.
import { existsSync, mkdirSync, copyFileSync, rmSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { typst } from './herramientas/typst.mjs';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../../..');
const args = process.argv.slice(2);
const evaluacion = args.includes('--evaluacion');
const iPng = args.indexOf('--png');
const carpetaPng = iPng >= 0 ? resolve(args[iPng + 1] && !args[iPng + 1].startsWith('--') ? args[iPng + 1] : join(aqui, '../../../../tesis-paginas')) : null;
const privadoDir = process.env.BE_TESIS_PRIVADO ?? 'C:/Users/bufim/BE-datos-locales/tesis';
const desdeRaiz = (p) => '/' + relative(raiz, p).replace(/\\/g, '/');

const entradas = ['--input', `variante=${evaluacion ? 'evaluacion' : 'publica'}`];
if (existsSync(join(aqui, 'imagenes/portada-website.png')) && existsSync(join(aqui, 'imagenes/portada-apk.png'))) entradas.push('--input', 'capturas=si');

let temporal = null;
let salida = join(aqui, 'salida/BE-tesis-v1.pdf');
if (evaluacion) {
  for (const f of ['davinci-logotipo.png', 'privado.json'])
    if (!existsSync(join(privadoDir, f))) throw new Error(`Falta ${f} en ${privadoDir}: la variante de evaluación no se compila sin los datos privados.`);
  temporal = join(aqui, 'documento/.privado');
  mkdirSync(temporal, { recursive: true });
  for (const f of ['davinci-logotipo.png', 'privado.json']) copyFileSync(join(privadoDir, f), join(temporal, f));
  entradas.push('--input', `privado=${desdeRaiz(join(temporal, 'privado.json'))}`, '--input', `logo=${desdeRaiz(join(temporal, 'davinci-logotipo.png'))}`);
  mkdirSync(join(privadoDir, 'salida'), { recursive: true });
  salida = join(privadoDir, 'salida/BE-tesis-v1-evaluacion.pdf');
}
mkdirSync(dirname(salida), { recursive: true });

const base = ['compile', '--root', raiz, '--font-path', join(aqui, 'tipografias'), '--ignore-system-fonts', ...entradas];
try {
  const inicio = Date.now();
  execFileSync(typst(), [...base, join(aqui, 'documento/tesis.typ'), salida], { stdio: 'inherit' });
  console.log(`PDF: ${salida} (${Math.round(statSync(salida).size / 1024)} KB, ${((Date.now() - inicio) / 1000).toFixed(1)} s)`);
  if (carpetaPng) {
    mkdirSync(carpetaPng, { recursive: true });
    for (const f of readdirSync(carpetaPng)) if (f.endsWith('.png')) rmSync(join(carpetaPng, f));
    execFileSync(typst(), [...base, '--format', 'png', '--ppi', '72', join(aqui, 'documento/tesis.typ'), join(carpetaPng, 'p-{0p}.png')], { stdio: 'inherit' });
    console.log(`Páginas para revisar: ${carpetaPng} (${readdirSync(carpetaPng).filter((f) => f.endsWith('.png')).length})`);
  }
} finally {
  if (temporal) rmSync(temporal, { recursive: true, force: true });
}
