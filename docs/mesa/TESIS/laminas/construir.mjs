// Construye las láminas: cada archivo de laminas/fuentes es la fuente única de un gráfico. Para cada uno:
//   1. genera el SVG con el motor (laminas/generado/<id>.svg), que es el que inserta el documento;
//   2. guarda la revisión automática (laminas/revision.json): tipografía mínima, densidad, cruces, rótulos y desbordes;
//   3. con Typst, exporta PDF, PNG de previsualización y un SVG autocontenido (laminas/exportaciones/).
// Uso: node construir.mjs [--sin-exportar] [filtro…]   (el filtro elige láminas por id, por ejemplo ARQ DER-03)
import { readdirSync, writeFileSync, mkdirSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { crearLamina } from './motor/lamina.mjs';
import { typst } from '../herramientas/typst.mjs';

const aqui = dirname(fileURLToPath(import.meta.url));
const tesis = resolve(aqui, '..');
const args = process.argv.slice(2);
const sinExportar = args.includes('--sin-exportar');
const filtros = args.filter((a) => !a.startsWith('--'));


const carpetaFuentes = join(aqui, 'fuentes');
const archivos = readdirSync(carpetaFuentes).filter((n) => n.endsWith('.mjs') && !n.startsWith('_')).sort();
const dirs = { generado: join(aqui, 'generado'), svg: join(aqui, 'exportaciones/svg'), pdf: join(aqui, 'exportaciones/pdf'), png: join(aqui, 'exportaciones/png') };
for (const d of Object.values(dirs)) mkdirSync(d, { recursive: true });
const rutaRevision = join(aqui, 'revision.json');
const revisiones = existsSync(rutaRevision) ? JSON.parse(readFileSync(rutaRevision, 'utf8')) : {};
const version = JSON.parse(readFileSync(join(tesis, 'datos/version.json'), 'utf8'));

let problemas = 0;
for (const archivo of archivos) {
  const mod = await import(pathToFileURL(join(carpetaFuentes, archivo)).href);
  const meta = mod.meta;
  if (filtros.length && !filtros.some((f) => meta.id.startsWith(f) || archivo.includes(f))) continue;
  const L = crearLamina({ ...meta, version: `${version.commitCorto} (${version.fecha})` });
  await mod.dibujar(L, { version });
  const { svg, revision } = L.render();
  writeFileSync(join(dirs.generado, `${meta.id}.svg`), svg);
  revisiones[meta.id] = { titulo: meta.titulo, archivoFuente: `laminas/fuentes/${archivo}`, ...revision };
  const marca = revision.hallazgos.length ? '✖' : '✔';
  console.log(`${marca} ${meta.id} · ${meta.ancho}×${meta.alto} pt · fuente mínima ${revision.fuenteMinima} pt · nodos ${revision.nodos} · conectores ${revision.conectores} · cruces ${revision.cruces}`);
  for (const h of revision.hallazgos) console.log(`    · ${h}`);
  problemas += revision.hallazgos.length;

  if (!sinExportar) {
    // La exportación suelta lleva título, alcance, fuente, versión y estado; el documento usa el SVG sin ellos (los pone
    // en su epígrafe). Los textos viajan por JSON para que Typst no los lea como marcado.
    const datos = join(aqui, `generado/_${meta.id}.json`);
    const temporal = join(aqui, `generado/_${meta.id}.typ`);
    writeFileSync(datos, JSON.stringify({ ...meta, svg: `${meta.id}.svg`, version: `${version.commitCorto} (${version.fecha})` }));
    writeFileSync(
      temporal,
      [
        `#let m = json("_${meta.id}.json")`,
        '#set page(width: m.ancho * 1pt + 32pt, height: auto, margin: (x: 16pt, top: 14pt, bottom: 12pt), fill: white)',
        '#set text(font: "Inter", size: 10pt, fill: rgb("#0A1F44"), lang: "es")',
        '#block(below: 4pt, text(size: 14pt, weight: 600, m.id + " · " + m.titulo))',
        '#block(below: 10pt, width: m.ancho * 1pt, text(fill: rgb("#566881"), m.alcance))',
        '#image(m.svg, width: m.ancho * 1pt)',
        '#block(above: 8pt, width: m.ancho * 1pt, text(fill: rgb("#566881"), "Fuente: " + m.fuente + " · Versión " + m.version + " · Estado: " + m.estado))',
        '',
      ].join('\n'),
    );
    const base = [typst(), 'compile', '--root', tesis, '--font-path', join(tesis, 'tipografias'), '--ignore-system-fonts'];
    execFileSync(base[0], [...base.slice(1), temporal, join(dirs.pdf, `${meta.id}.pdf`)]);
    execFileSync(base[0], [...base.slice(1), '--format', 'png', '--ppi', '160', temporal, join(dirs.png, `${meta.id}.png`)]);
    execFileSync(base[0], [...base.slice(1), '--format', 'svg', temporal, join(dirs.svg, `${meta.id}.svg`)]);
    rmSync(temporal);
    rmSync(datos);
  }
}
writeFileSync(rutaRevision, JSON.stringify(revisiones, null, 1));
console.log(problemas ? `\n${problemas} hallazgo(s) para corregir.` : '\nSin hallazgos automáticos (falta la revisión visual).');
