// Lee apps/api/src y deja en datos/modulos-api.json, por carpeta de la API: el módulo NestJS (y si es global), sus
// controladores con las operaciones que exponen (los ID API-… de sus comentarios), sus servicios y las carpetas de las que
// importa código. Es la base del diagrama de componentes: las dependencias salen de los import, no de la memoria.
// Uso: node leer-modulos-api.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../../../..');
const src = join(raiz, 'apps/api/src');

function archivos(dir, acc = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) archivos(p, acc);
    else if (n.endsWith('.ts') && !n.endsWith('.spec.ts')) acc.push(p);
  }
  return acc;
}

const carpetas = readdirSync(src).filter((n) => statSync(join(src, n)).isDirectory());
const resultado = [];
for (const c of carpetas) {
  const lista = archivos(join(src, c));
  const modulo = { carpeta: c, ubicacion: `apps/api/src/${c}`, archivos: lista.length, modulo: null, global: false, controladores: [], servicios: [], importaDe: {}, usaDominio: false, usaPrisma: false };
  for (const f of lista) {
    const t = readFileSync(f, 'utf8');
    const nombre = relative(join(src, c), f).replace(/\\/g, '/');
    if (f.endsWith('.module.ts')) {
      modulo.modulo = (t.match(/export class (\w+)/) || [])[1] ?? null;
      modulo.global = /@Global\(\)/.test(t);
      modulo.importaModulos = ((t.match(/imports:\s*\[([^\]]*)\]/) || [])[1] ?? '').split(',').map((x) => x.trim().replace(/\(.*$/, '')).filter(Boolean);
    }
    if (f.endsWith('.controller.ts')) {
      const prefijo = (t.match(/@Controller\(\s*['"]([^'"]*)['"]/) || [])[1] ?? '';
      const ops = [...new Set(t.match(/API-[A-Z]+(?:-[A-Z0-9]+)?-\d{2}(?:-[A-Z]+)?/g) ?? [])];
      const rutas = [...t.matchAll(/@(Get|Post|Put|Patch|Delete)\(\s*(?:['"]([^'"]*)['"])?\s*\)/g)].map((m) => `${m[1].toUpperCase()} /${[prefijo, m[2] ?? ''].filter(Boolean).join('/')}`);
      modulo.controladores.push({ archivo: nombre, clase: (t.match(/export class (\w+)/) || [])[1], operaciones: ops, rutas: rutas.length });
    }
    if (f.endsWith('.service.ts')) modulo.servicios.push({ archivo: nombre, clase: (t.match(/export class (\w+)/) || [])[1] });
    for (const m of t.matchAll(/from\s+['"](\.\.?\/[^'"]+)['"]/g)) {
      const destino = resolve(dirname(f), m[1]);
      const rel = relative(src, destino).split(sep);
      if (rel[0] && rel[0] !== c && !rel[0].startsWith('..') && carpetas.includes(rel[0])) modulo.importaDe[rel[0]] = (modulo.importaDe[rel[0]] ?? 0) + 1;
    }
    if (/from\s+['"]@be\/domain['"]/.test(t)) modulo.usaDominio = true;
    if (/PrismaService|from\s+['"]@prisma\/client['"]/.test(t)) modulo.usaPrisma = true;
  }
  resultado.push(modulo);
}

const salida = join(aqui, '../datos/modulos-api.json');
writeFileSync(salida, JSON.stringify({ fuente: 'apps/api/src', carpetas: resultado }, null, 1));
for (const m of resultado)
  console.log(
    `${m.carpeta.padEnd(15)} ${String(m.modulo ?? '—').padEnd(22)} ${m.global ? 'GLOBAL ' : '       '}ctrl ${m.controladores.length} ops ${String(m.controladores.flatMap((x) => x.operaciones).length).padStart(3)} srv ${String(m.servicios.length).padStart(2)} → ${Object.keys(m.importaDe).join(', ')}`,
  );
