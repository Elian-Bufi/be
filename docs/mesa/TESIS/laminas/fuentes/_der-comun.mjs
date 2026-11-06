// Piezas comunes de las vistas del DER (el guion bajo evita que el constructor la tome como lámina).
import { componerVistaDer, textoDeReferencias } from '../motor/der-vista.mjs';
import { VISTAS_DER } from '../motor/vistas-der.mjs';

export const vistaDer = (id) => VISTAS_DER.find((v) => v.id === id);

/** meta estándar de una vista del DER (por defecto, 750 × 456 pt: entra en una página apaisada). */
export function metaDer(id, { alcance, fuente, estado = 'implementado', ancho = 750, alto = 456 }) {
  const v = vistaDer(id);
  return { id, titulo: `DER · ${v.titulo}`, alcance, fuente: `prisma/schema.prisma · ${fuente}`, estado, ancho, alto };
}

/**
 * Dibuja la vista: entidades y relaciones (compositor), notas propias, la nota de claves hacia otras vistas y la leyenda.
 * notas: { x, y, w } o { columna, desdeFila } (una celda de la grilla), con `limite` (y máxima) y `sinReferencias`.
 */
export function dibujarVistaDer(L, id, spec, { notas, propias = [], leyenda, anchoLamina = 750 }) {
  const v = vistaDer(id);
  const g = componerVistaDer(L, { vista: v.modelos, anchoLamina, ...spec });
  if (notas) {
    if (notas.columna !== undefined) {
      notas.x = g.xs[notas.columna];
      notas.w = notas.w ?? g.anchos[notas.columna];
      notas.y = notas.y ?? g.ys[notas.desdeFila ?? 0];
    }
    let y = notas.y;
    const bloques = [...propias];
    const refs = textoDeReferencias(v.modelos, { maximoCampos: notas.maximoCampos ?? 3 });
    if (refs && notas.conReferencias) bloques.push({ titulo: '↗ Claves hacia otras vistas', texto: refs });
    for (const b of bloques) y += 8 + L.nota({ x: notas.x, y, w: notas.w, titulo: b.titulo, texto: b.texto });
    if (notas.limite && y - 8 > notas.limite) throw new Error(`${id}: las notas no entran (${Math.ceil(y - 8)} > ${notas.limite})`);
  }
  L.leyenda({
    x: leyenda.x,
    y: leyenda.y,
    w: leyenda.w,
    titulo: null,
    columnas: leyenda.columnas ?? 5,
    items: [
      { muestra: 'linea:uno', texto: 'uno y solo uno' },
      { muestra: 'linea:cero_o_uno', texto: 'cero o uno' },
      { muestra: 'linea:cero_o_muchos', texto: 'cero o muchos' },
      { muestra: 'texto:PK FK', texto: 'claves · * obligatorio · o opcional' },
      { muestra: 'texto:↗', texto: 'clave hacia otra vista' },
    ],
  });
  return g;
}
