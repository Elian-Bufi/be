// Cuántas veces aparece cada alimento del catálogo en las 16 recetas del manifiesto, y en qué recetas.
// Uso: node frecuencias.mjs <manifiesto.json>
import fs from 'node:fs';
const m = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const porItem = new Map();
for (const r of m.recetas) {
  for (const i of r.ingredientes) {
    const k = i.catalogItemId;
    const e = porItem.get(k) ?? { catalogItemId: k, catalogItemVersionId: i.catalogItemVersionId, nombre: i.nombre, fdcId: i.fdcId, preparacionDeLaFuente: i.preparacionDeLaFuente, estados: new Set(), recetas: [] };
    e.estados.add(i.estado);
    e.recetas.push(r.numero);
    porItem.set(k, e);
  }
}
const lista = [...porItem.values()].sort((a, b) => b.recetas.length - a.recetas.length || a.nombre.localeCompare(b.nombre, 'es'));
for (const e of lista) console.log(`${String(e.recetas.length).padStart(2)} · ${e.nombre} · ${[...e.estados].join('/')} · ${e.preparacionDeLaFuente} · fdc ${e.fdcId} · ${e.catalogItemId} · v ${e.catalogItemVersionId} · recetas ${e.recetas.join(',')}`);
console.log(`\n${lista.length} alimentos distintos en ${m.recetas.length} recetas`);
