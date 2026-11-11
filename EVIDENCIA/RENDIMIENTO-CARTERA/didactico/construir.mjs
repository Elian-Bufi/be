// Construye el PDF didáctico de la cartera por conjuntos: primero las láminas (laminas/fuentes → laminas/generado, con
// el motor de las guías y su revisión automática), después el PDF con Typst y la plantilla común de las guías.
// Uso: node construir.mjs [--sin-laminas] [--png]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../../..');
const guias = join(raiz, 'docs/guias/ENTENDER-BE');
const args = process.argv.slice(2);
const { crearLamina } = await import(pathToFileURL(join(guias, 'laminas/motor/lamina.mjs')).href);
const { typst } = await import(pathToFileURL(join(guias, 'herramientas/typst.mjs')).href);
const version = JSON.parse(readFileSync(join(guias, 'datos/version.json'), 'utf8'));

if (!args.includes('--sin-laminas')) {
  const fuentes = join(aqui, 'laminas/fuentes');
  const generado = join(aqui, 'laminas/generado');
  mkdirSync(generado, { recursive: true });
  let problemas = 0;
  for (const archivo of readdirSync(fuentes).filter((n) => n.endsWith('.mjs')).sort()) {
    const mod = await import(pathToFileURL(join(fuentes, archivo)).href);
    const L = crearLamina({ ...mod.meta, version: `${version.commitCorto} (${version.fecha})` });
    await mod.dibujar(L, { version });
    const { svg, revision } = L.render();
    const marca = revision.hallazgos.length ? '✖' : '✔';
    console.log(`${marca} ${mod.meta.id} · ${mod.meta.ancho}×${mod.meta.alto} pt · fuente mínima ${revision.fuenteMinima} pt · nodos ${revision.nodos} · conectores ${revision.conectores} · cruces ${revision.cruces}`);
    for (const h of revision.hallazgos) console.log(`    · ${h}`);
    problemas += revision.hallazgos.length;
    if (!revision.hallazgos.length) writeFileSync(join(generado, `${mod.meta.id}.svg`), svg);
  }
  if (problemas) {
    console.error(`${problemas} hallazgos: las láminas con hallazgos no se escribieron.`);
    process.exit(1);
  }
}

const salida = join(aqui, 'salida');
mkdirSync(salida, { recursive: true });
const fuente = join(aqui, 'cartera-por-conjuntos.typ');
if (!existsSync(join(aqui, 'datos.json'))) throw new Error('falta datos.json (node datos.mjs <carpeta-de-resultados>)');
const fecha = String(Math.floor(Date.parse(version.commitFecha) / 1000));
const base = ['compile', '--root', raiz, '--font-path', join(guias, 'tipografias'), '--ignore-system-fonts', '--creation-timestamp', fecha];
execFileSync(typst(), [...base, fuente, join(salida, 'BE-cartera-por-conjuntos.pdf')], { stdio: 'inherit' });
console.log('listo: salida/BE-cartera-por-conjuntos.pdf');
if (args.includes('--png')) {
  const revision = join(salida, 'revision');
  mkdirSync(revision, { recursive: true });
  execFileSync(typst(), [...base, '--format', 'png', '--ppi', '110', fuente, join(revision, 'pagina-{0p}.png')], { stdio: 'inherit' });
  console.log('páginas en salida/revision/pagina-NN.png');
}
