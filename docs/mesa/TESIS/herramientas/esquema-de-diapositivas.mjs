// El esquema legible de la presentación de la defensa: lee la fuente del mazo (defensa/presentacion/project: deck.json y
// una sección HTML por diapositiva) y escribe defensa/DIAPOSITIVAS.md con el texto visible y las notas del orador de cada
// una. La fuente editable es la del mazo; este archivo es para leerla sin abrirlo.
// Uso: node herramientas/esquema-de-diapositivas.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const base = join(aqui, '../defensa/presentacion/project');
const indice = JSON.parse(readFileSync(join(base, 'deck.json'), 'utf8'));
const limpio = (s) =>
  s
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const secciones = Object.values(indice.sections ?? {});
const lineas = [
  `# ${indice.title}: las diapositivas`,
  '',
  'Esquema generado desde la fuente del mazo (`defensa/presentacion/project`) por `herramientas/esquema-de-diapositivas.mjs`.',
  'El mazo se edita y se presenta en https://claude.ai/artifact/9LiufGdUTJjAbEonGT8t2U (privado hasta que Dirección lo',
  'comparta; se descarga como PowerPoint o PDF). Las imágenes son recursos del mazo.',
  '',
];
indice.order.forEach((id, i) => {
  const html = readFileSync(join(base, `slides/${id}.html`), 'utf8');
  const seccion = secciones.find((s) => s.start === id);
  if (seccion) lineas.push(`## ${seccion.description}`, '');
  const titulo = limpio((html.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/) ?? [, id])[1]);
  const notas = limpio((html.match(/<aside>([\s\S]*?)<\/aside>/) ?? [, ''])[1]);
  const visibles = [...html.replace(/<aside>[\s\S]*?<\/aside>/, '').matchAll(/<(h3|p|li)[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => limpio(m[2])).filter(Boolean);
  const imagenes = [...html.matchAll(/<img[^>]*alt="([^"]*)"/g)].map((m) => m[1]);
  lineas.push(`### ${i + 1} · ${titulo}`, '');
  for (const v of visibles) lineas.push(`- ${v}`);
  for (const a of imagenes) lineas.push(`- *Imagen:* ${a}`);
  lineas.push('', `> **Notas del orador.** ${notas}`, '');
});
writeFileSync(join(aqui, '../defensa/DIAPOSITIVAS.md'), lineas.join('\n'));
console.log(`${indice.order.length} diapositivas en defensa/DIAPOSITIVAS.md`);
