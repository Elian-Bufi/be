// Qué caso de uso ejecuta cada operación de la API, leído del código: la procedencia que cada escritura deja en la
// auditoría. Reconoce tres formas:
//   - `operacion: 'API-…'` y `casoDeUso: 'UC-…'` en el mismo objeto (en cualquier orden);
//   - `casoDeUso: CONSTANTE` con `const CONSTANTE = 'UC-…'` en el mismo archivo;
//   - `const operacion = 'API-…'` y después `procedenciaDe(ctx, 'UC-…' o CONSTANTE, operacion)`.
// Salida: datos/operaciones-y-casos.json. Uso: node herramientas/operaciones-y-casos.mjs
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../../../..');
const api = join(raiz, 'apps/api/src');

const archivos = [];
(function recorrer(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) recorrer(p);
    else if (n.endsWith('.ts') && !n.endsWith('.spec.ts')) archivos.push(p);
  }
})(api);

const mapa = new Map();
const agregar = (op, uc, archivo) => {
  if (!uc) return;
  if (!mapa.has(op)) mapa.set(op, { casos: new Set(), archivos: new Set() });
  mapa.get(op).casos.add(uc);
  mapa.get(op).archivos.add(relative(raiz, archivo).replace(/\\/g, '/'));
};
const CASO = String.raw`(?:'(UC-[A-Z]\d+)'|([A-Z][A-Z_]+))`;
for (const a of archivos) {
  const s = readFileSync(a, 'utf8');
  const constantes = Object.fromEntries([...s.matchAll(/const ([A-Z][A-Z_]+) = '(UC-[A-Z]\d+)'/g)].map((m) => [m[1], m[2]]));
  const caso = (literal, constante) => literal ?? constantes[constante] ?? null;
  for (const m of s.matchAll(new RegExp(String.raw`operacion: '(API-[A-Z]+-[A-Z0-9-]+)',[\s\S]{0,200}?casoDeUso: ${CASO}`, 'g'))) agregar(m[1], caso(m[2], m[3]), a);
  for (const m of s.matchAll(new RegExp(String.raw`casoDeUso: ${CASO},[\s\S]{0,200}?operacion: '(API-[A-Z]+-[A-Z0-9-]+)'`, 'g'))) agregar(m[3], caso(m[1], m[2]), a);
  for (const m of s.matchAll(new RegExp(String.raw`const operacion = '(API-[A-Z]+-[A-Z0-9-]+)';[\s\S]{0,600}?procedenciaDe\(ctx, ${CASO}, operacion\)`, 'g'))) agregar(m[1], caso(m[2], m[3]), a);
}
const operaciones = Object.fromEntries(
  [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b, 'es', { numeric: true })).map(([op, v]) => [op, { casos: [...v.casos].sort(), archivos: [...v.archivos].sort() }]),
);
writeFileSync(join(aqui, '../datos/operaciones-y-casos.json'), JSON.stringify({ fuente: 'apps/api/src (procedencia de cada escritura)', operaciones }, null, 1));
console.log(`${Object.keys(operaciones).length} operaciones con su caso de uso`);
for (const op of process.argv.slice(2)) console.log(op, operaciones[op]?.casos.join(', ') ?? '—');
