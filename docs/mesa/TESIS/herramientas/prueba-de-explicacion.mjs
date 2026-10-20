// La prueba de explicación del encargo: cada figura de la tesis tiene que poder explicarse en 30 a 60 segundos. Lee las
// explicaciones de defensa/GUION.md (una sección «### <ID> · <título>» por figura), cuenta sus palabras y estima el
// tiempo a 140 palabras por minuto, el ritmo de una exposición tranquila. Entra si dura entre 30 y 60 segundos.
// También controla que cada lámina del documento tenga su explicación (por su id o dentro de un rango «D-01 a D-03»).
// Salida: defensa/explicaciones.json. Uso: node herramientas/prueba-de-explicacion.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const tesis = join(aqui, '..');
const PALABRAS_POR_MINUTO = 140;
const guion = readFileSync(join(tesis, 'defensa/GUION.md'), 'utf8');
const inicio = guion.indexOf('## Cada lámina en 30 a 60 segundos');
if (inicio < 0) throw new Error('el guion no tiene la sección de explicaciones');
const secciones = guion.slice(inicio).split(/^### /m).slice(1);

const resultados = secciones.map((s) => {
  const [encabezado, ...resto] = s.split('\n');
  const texto = resto.join(' ').replace(/\s+/g, ' ').trim();
  const palabras = texto.split(' ').filter((p) => /[\p{L}\p{N}]/u.test(p)).length;
  const segundos = Math.round((palabras / PALABRAS_POR_MINUTO) * 60);
  return { figura: encabezado.trim(), palabras, segundos, entra: segundos >= 30 && segundos <= 60 };
});

// Las láminas que hay que poder explicar: las familias que aparecen en el documento con su vista general o su única
// lámina. Las vistas de detalle (CU-01 a CU-08, DER-01 a DER-14) se explican con su vista general.
const revision = JSON.parse(readFileSync(join(tesis, 'laminas/revision.json'), 'utf8'));
const detalle = /^(CU-0[1-8]|DER-(0[1-9]|1[0-4]))$/;
const cubierta = (id) =>
  resultados.some((r) => {
    if (r.figura.startsWith(`${id} `)) return true;
    const rango = r.figura.match(/^([A-Z]+)-(\d+) a [A-Z]+-(\d+)/);
    if (!rango) return false;
    const [, fam, desde, hasta] = rango;
    const m = id.match(/^([A-Z]+)-(\d+)$/);
    return m && m[1] === fam && Number(m[2]) >= Number(desde) && Number(m[2]) <= Number(hasta);
  });
const sinExplicar = Object.keys(revision).filter((id) => !detalle.test(id) && !cubierta(id)).sort();

writeFileSync(join(tesis, 'defensa/explicaciones.json'), JSON.stringify({ palabrasPorMinuto: PALABRAS_POR_MINUTO, resultados, sinExplicar }, null, 1));
for (const r of resultados) console.log(`${r.entra ? '✔' : '✖'} ${r.figura.padEnd(58)} ${String(r.palabras).padStart(3)} palabras · ${r.segundos} s`);
console.log(sinExplicar.length ? `\nLáminas sin explicación: ${sinExplicar.join(', ')}` : '\nTodas las láminas tienen su explicación.');
console.log(`${resultados.filter((r) => r.entra).length} de ${resultados.length} entran en 30 a 60 segundos.`);
