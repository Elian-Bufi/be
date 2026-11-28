// DER · Vista general por dominios: las catorce vistas como paquetes y las claves foráneas que cruzan de una vista a
// otra (datos/esquema.json). Las que apuntan a Identidad (DER-01) son de casi todas las vistas: se cuentan en cada
// paquete y en la nota, y no se dibujan, para que se lean las demás.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VISTAS_DER, vistaDe } from '../motor/vistas-der.mjs';
import { envolver } from '../motor/metricas.mjs';

const esquema = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../datos/esquema.json'), 'utf8'));

export const meta = {
  id: 'DER-00',
  titulo: 'DER · Vista general por dominios',
  alcance: 'Los 113 modelos de la base en catorce vistas y las claves foráneas que unen una vista con otra.',
  fuente: 'prisma/schema.prisma (113 modelos, 212 relaciones) · datos/esquema.json',
  estado: 'implementado',
  ancho: 750,
  alto: 456,
};

// Claves foráneas entre vistas (sin contar las que van a Identidad) y hacia Identidad.
const pares = new Map();
const haciaIdentidad = new Map();
for (const r of esquema.relaciones) {
  const a = vistaDe(r.desde);
  const b = vistaDe(r.hacia);
  if (a === b) continue;
  if (b === 'DER-01') {
    haciaIdentidad.set(a, (haciaIdentidad.get(a) ?? 0) + r.clavesForaneas.length);
    continue;
  }
  const k = [a, b].sort().join('|');
  pares.set(k, (pares.get(k) ?? 0) + r.clavesForaneas.length);
}

const COL = [8, 199, 390, 581];
const FIL = [8, 104, 200, 296];
const W = 160;
const H = 72;
const LUGAR = {
  'DER-04': [0, 0], 'DER-03': [1, 0], 'DER-12': [2, 0], 'DER-13': [3, 0],
  'DER-06': [0, 1], 'DER-02': [1, 1], 'DER-09': [2, 1], 'DER-11': [3, 1],
  'DER-07': [0, 2], 'DER-14': [1, 2], 'DER-10': [2, 2], 'DER-01': [3, 2],
  'DER-05': [0, 3], 'DER-08': [1, 3],
};

export function dibujar(L) {
  const { T, TX } = L;
  for (const v of VISTAS_DER) {
    const [c, f] = LUGAR[v.id];
    const x = COL[c];
    const y = FIL[f];
    const esIdentidad = v.id === 'DER-01';
    L.paquete({ id: v.id, x, y, w: W, h: H, titulo: v.id });
    // Las líneas llegan al cuerpo del paquete, no a la altura de la solapa.
    L.nodos.set(`${v.id}-cuerpo`, { id: `${v.id}-cuerpo`, x, y: y + 17, w: W, h: H - 17, rect: false, forma: 'caja' });
    let yy = y + 34;
    for (const l of envolver(v.corto, W - 18, TX.titulo)) {
      L.texto({ x: x + 9, y: yy, texto: l, estilo: TX.titulo, color: T.color.tinta, de: `${v.id}-nombre` });
      yy += 14;
    }
    const fk = haciaIdentidad.get(v.id);
    const meta2 = esIdentidad ? `${v.modelos.length} entidades · base de todas` : `${v.modelos.length} entidades${fk ? ` · ${fk} FK a Identidad` : ''}`;
    L.texto({ x: x + 9, y: y + H - 9, texto: meta2, estilo: TX.meta, color: T.color.tinta_suave, de: `${v.id}-meta` });
  }

  // Relaciones entre vistas (una línea por par), con la cantidad de claves foráneas.
  for (const [k, n] of pares) {
    const [a, b] = k.split('|');
    if (a === 'DER-01' || b === 'DER-01') continue; // se dibuja aparte, por el margen
    if (k === 'DER-02|DER-10') {
      // En diagonal pisaría la solapa de DER-10: baja al pasillo entre filas y entra por el costado.
      const p = L.nodos.get('DER-02-cuerpo');
      const q = L.nodos.get('DER-10-cuerpo');
      const yPasillo = p.y + p.h + 12;
      const xCalle = q.x - 15;
      L.conector({ de: 'DER-02-cuerpo', lado: 's', t: 0.75, a: 'DER-10-cuerpo', ladoA: 'o', via: [[p.x + p.w * 0.75, yPasillo], [xCalle, yPasillo], [xCalle, q.y + q.h / 2]], fin: null });
      L.pastilla({ cx: (p.x + p.w * 0.75 + xCalle) / 2, cy: yPasillo, texto: `${n} FK` });
      continue;
    }
    const pts = L.relacion({ de: `${a}-cuerpo`, a: `${b}-cuerpo` });
    L.pastilla({ cx: (pts[0].x + pts[1].x) / 2, cy: (pts[0].y + pts[1].y) / 2, texto: `${n} FK` });
  }
  // Identidad → VersionDeTexto (la solicitud de cierre cita la versión de las consecuencias): por abajo y por el margen.
  const n01 = pares.get('DER-01|DER-04');
  const id01 = L.nodos.get('DER-01');
  const id04 = L.nodos.get('DER-04');
  const yRuta = 386;
  const ySale = id01.y + 17 + (id01.h - 17) / 2;
  L.conector({
    de: 'DER-01',
    lado: 'o',
    t: (ySale - id01.y) / id01.h,
    a: 'DER-04',
    ladoA: 'o',
    via: [[id01.x - 15, ySale], [id01.x - 15, yRuta], [3, yRuta], [3, id04.y + 17 + (id04.h - 17) / 2]],
    tA: (17 + (id04.h - 17) / 2) / id04.h,
    fin: null,
  });
  L.pastilla({ cx: 300, cy: yRuta, texto: `${n01} FK` });

  L.nota({
    x: 581,
    y: 296,
    w: 160,
    titulo: 'Cómo leer esta vista',
    texto: `Cada paquete es una vista del DER. Una línea une dos vistas con claves foráneas entre sí; el número dice cuántas. Las ${[...haciaIdentidad.values()].reduce((s, n) => s + n, 0)} claves hacia Identidad no se dibujan: cada paquete dice cuántas tiene.`,
  });
}
