// Las tablas de transición del dominio, copiadas tal cual del código para el anexo E: cada transición con su origen,
// su destino, quién puede dispararla y el evento que deja. Salida: datos/maquinas-de-estado.json.
// Uso: node herramientas/maquinas-de-estado.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const dominio = resolve(aqui, '../../../../packages/domain/src');

const MAQUINAS = [
  { id: 'solicitud', nombre: 'Solicitud de vínculo', archivo: 'vinculo.ts', tabla: 'TRANSICIONES_DE_SOLICITUD_DE_VINCULO' },
  { id: 'alcance', nombre: 'Alcance del vínculo', archivo: 'vinculo.ts', tabla: 'TRANSICIONES_DE_ALCANCE_DE_VINCULO' },
  { id: 'consentimiento', nombre: 'Consentimiento profesional', archivo: 'consentimiento-profesional.ts', tabla: 'TRANSICIONES_DE_CONSENTIMIENTO' },
  { id: 'version-de-plan', nombre: 'Versión de plan', archivo: 'nutricion.ts', tabla: 'TRANSICIONES_DE_VERSION_DE_PLAN' },
  { id: 'proceso', nombre: 'Proceso operativo', archivo: 'proceso.ts', tabla: 'TRANSICIONES_DE_PROCESO' },
];

const FILA = /\{ transicion: '(\w+)', origen: (null|'\w+'), destino: '(\w+)', actores: \[([^\]]*)\], evento: '(\w+)' \}/g;
const maquinas = MAQUINAS.map((m) => {
  const s = readFileSync(join(dominio, m.archivo), 'utf8');
  const inicio = s.indexOf(`export const ${m.tabla}`);
  if (inicio < 0) throw new Error(`no está ${m.tabla} en ${m.archivo}`);
  const fin = s.indexOf('];', inicio);
  const bloque = s.slice(inicio, fin);
  const transiciones = [...bloque.matchAll(FILA)].map((f) => ({
    transicion: f[1],
    origen: f[2] === 'null' ? null : f[2].slice(1, -1),
    destino: f[3],
    actores: f[4].split(',').map((a) => a.trim().slice(1, -1)).filter(Boolean),
    evento: f[5],
  }));
  if (transiciones.length === 0) throw new Error(`sin transiciones en ${m.tabla}`);
  return { ...m, fuente: `packages/domain/src/${m.archivo}`, transiciones };
});
writeFileSync(join(aqui, '../datos/maquinas-de-estado.json'), JSON.stringify({ fuente: 'packages/domain/src (tablas TRANSICIONES_*)', maquinas }, null, 1));
for (const m of maquinas) console.log(`${m.nombre}: ${m.transiciones.length} transiciones`);
