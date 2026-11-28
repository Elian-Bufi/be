// Familias de operaciones del contrato publicado (packages/domain/src/openapi.ts): cuántas operaciones tiene cada una,
// la primera ruta y su resumen. Uso: node familias-api.mjs → datos/familias-api.json
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../../../..');
const s = readFileSync(join(raiz, 'packages/domain/src/openapi.ts'), 'utf8');
// El resumen puede ser una cadena simple o una plantilla con valores interpolados.
const re = /id: '(API-([A-Z]+)-[A-Z0-9-]+)',\s*metodo: '(\w+)',\s*ruta: ('([^']+)'|[\w.]+),\s*resumen:\s*(?:'([^']*)'|`([^`]*)`)/g;
// Una ruta escrita como constante (por ejemplo RUTAS_DE_ACCESO_GOOGLE.sesiones) se resuelve con su definición en el
// dominio, para que la tabla muestre la ruta y no el nombre de la constante.
const constantes = {};
for (const archivo of readdirSync(join(raiz, 'packages/domain/src')).filter((n) => n.endsWith('.ts'))) {
  const t = readFileSync(join(raiz, 'packages/domain/src', archivo), 'utf8');
  for (const c of t.matchAll(/export const ([A-Z_]+) = \{([^}]*)\}/g)) {
    for (const k of c[2].matchAll(/(\w+): '([^']+)'/g)) constantes[`${c[1]}.${k[1]}`] = k[2];
  }
}
const resolver = (ruta) => {
  if (ruta.startsWith('/')) return ruta;
  if (!constantes[ruta]) throw new Error(`ruta sin resolver: ${ruta}`);
  return constantes[ruta];
};
const familias = {};
let m;
let total = 0;
while ((m = re.exec(s))) {
  total++;
  const f = m[2];
  familias[f] ??= { n: 0, ejemplo: `${m[3].toUpperCase()} ${resolver(m[5] ?? m[4])}`, resumen: (m[6] ?? m[7]).replace(/\$\{[^}]*\}/g, '…') };
  familias[f].n++;
}
const declaradas = (s.match(/^\s*id: 'API-/gm) ?? []).length;
if (total !== declaradas) throw new Error(`se leyeron ${total} de ${declaradas} operaciones`);
writeFileSync(join(aqui, '../datos/familias-api.json'), JSON.stringify({ _que_es: 'Familias de operaciones de packages/domain/src/openapi.ts.', operaciones: total, familias }, null, 1));
console.log(`operaciones: ${total} · familias: ${Object.keys(familias).length}`);
