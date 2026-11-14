// El detalle de cada operación del contrato publicado (packages/domain/src/openapi.ts: método, ruta y resumen) junto
// con el caso de uso que deja en su procedencia (datos/operaciones-y-casos.json, de herramientas/operaciones-y-casos.mjs).
// Salida: datos/operaciones-detalle.json. Uso: node herramientas/operaciones-detalle.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../../../..');
const fuente = readFileSync(join(raiz, 'packages/domain/src/openapi.ts'), 'utf8');
const casos = JSON.parse(readFileSync(join(aqui, '../datos/operaciones-y-casos.json'), 'utf8')).operaciones;

// Una ruta escrita como constante (por ejemplo RUTAS_DE_ACCESO_GOOGLE.sesiones) se resuelve con su definición.
const constantes = {};
for (const archivo of readdirSync(join(raiz, 'packages/domain/src')).filter((n) => n.endsWith('.ts'))) {
  const t = readFileSync(join(raiz, 'packages/domain/src', archivo), 'utf8');
  for (const c of t.matchAll(/export const ([A-Z_]+) = \{([^}]*)\}/g)) {
    for (const k of c[2].matchAll(/(\w+): '([^']+)'/g)) constantes[`${c[1]}.${k[1]}`] = k[2];
  }
}

// Cada operación empieza con «id: 'API-…'» (también API-ACC-P1-03 o API-INT-NUT-01); se lee el bloque hasta la
// siguiente.
const inicios = [...fuente.matchAll(/id: '(API-[A-Z]+-[A-Z0-9-]+)',/g)];
const operaciones = {};
inicios.forEach((m, i) => {
  const bloque = fuente.slice(m.index, i + 1 < inicios.length ? inicios[i + 1].index : fuente.length);
  const metodo = bloque.match(/metodo: '(\w+)'/)?.[1]?.toUpperCase() ?? null;
  const constante = bloque.match(/ruta: ([A-Z_]+\.\w+),/)?.[1];
  const ruta = bloque.match(/ruta: '([^']+)'/)?.[1] ?? (constante ? constantes[constante] : null) ?? null;
  if (!ruta) throw new Error(`${m[1]} sin ruta`);
  // El resumen es una cadena entre comillas simples (puede seguir en el renglón siguiente) o entre acentos graves.
  const r = bloque.match(/resumen:\s*'((?:[^'\\]|\\.)*)'/) ?? bloque.match(/resumen:\s*`([^`]*)`/);
  const resumen = r ? r[1].replace(/\\'/g, "'").replace(/\s+/g, ' ').trim() : null;
  operaciones[m[1]] = { metodo, ruta, resumen, casos: casos[m[1]]?.casos ?? [] };
});
writeFileSync(join(aqui, '../datos/operaciones-detalle.json'), JSON.stringify({ fuente: 'packages/domain/src/openapi.ts y la procedencia de cada escritura en apps/api/src', operaciones }, null, 1));
console.log(`${Object.keys(operaciones).length} operaciones`);
for (const op of process.argv.slice(2)) {
  const o = operaciones[op];
  console.log(op, o ? `${o.metodo} ${o.ruta} · ${o.casos.join(', ') || '—'} · ${String(o.resumen).slice(0, 100)}` : '—');
}
