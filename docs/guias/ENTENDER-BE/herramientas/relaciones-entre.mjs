// Lista las relaciones del esquema entre un grupo de modelos (para ubicar una vista del DER antes de dibujarla).
// Uso: node relaciones-entre.mjs Modelo1 Modelo2 …
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const esquema = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../datos/esquema.json'), 'utf8'));
const grupo = new Set(process.argv.slice(2));
for (const n of grupo) if (!esquema.modelos.some((m) => m.nombre === n)) throw new Error(`no existe ${n}`);
for (const r of esquema.relaciones) {
  if (!grupo.has(r.desde)) continue;
  const dentro = grupo.has(r.hacia);
  console.log(`${dentro ? '  ' : '↗ '}${r.desde}.${r.clavesForaneas.join('+')} → ${r.hacia} (${r.cardinalidadHija}:${r.cardinalidadPadre})`);
}
