// Piezas comunes de los diagramas de actividad con carriles (anexos B y C), en notación UML 2.5: cada carril es quién
// actúa y por dónde; las acciones de una persona y las de BE tienen colores distintos y, además, están en carriles
// distintos, así el significado no depende del color.

/** Carriles horizontales, de arriba hacia abajo. Devuelve la geometría de cada uno por id. */
export function carriles(L, { x = 0, y = 0, w, wCabecera = 86, lista }) {
  let yy = y;
  const g = {};
  for (const c of lista) {
    L.carril({ id: c.id, x, y: yy, w, h: c.h, titulo: c.titulo, subtitulo: c.subtitulo, wCabecera });
    g[c.id] = { y: yy, h: c.h, cy: yy + c.h / 2, x0: x + wCabecera };
    yy += c.h;
  }
  return g;
}

/** Acción centrada en (cx, centro del carril + dy). Persona en los carriles de personas; BE en el suyo. */
export function accion(L, g, { id, carril, cx, w = 82, titulo, detalle, tipo, dy = 0, enfasis = false }) {
  const t = tipo ?? (carril === 'be' ? 'sistema' : 'persona');
  const h = L.altoDeRedondeado({ w, titulo, detalle });
  return L.redondeado({ id, x: cx - w / 2, y: g[carril].cy - h / 2 + dy, w, titulo, detalle, tipo: t, enfasis });
}

/** Flujo de control con punta abierta (UML). Acepta las mismas opciones que el conector del motor. */
export const flujo = (L, opciones) => L.conector({ fin: 'flecha', ...opciones });

/** Posición relativa de una coordenada sobre el lado de un nodo (para alinear tramos rectos). */
export const tEn = (L, id, valor, eje = 'x') => {
  const n = L.nodos.get(id);
  return eje === 'x' ? (valor - n.x) / n.w : (valor - n.y) / n.h;
};

export const LEYENDA_ACTIVIDAD = [
  { muestra: 'inicio', texto: 'inicio' },
  { muestra: 'accion-persona', texto: 'acción de una persona' },
  { muestra: 'accion', texto: 'acción de BE' },
  { muestra: 'rombo', texto: 'decisión o fusión' },
  { muestra: 'final', texto: 'fin' },
  { muestra: 'linea:flecha', texto: 'flujo; [guarda] entre corchetes' },
];
