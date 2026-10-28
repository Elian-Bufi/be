// Vistas simplificadas del DER para el cuaderno de datos: solo las tablas centrales de cada área, en una grilla de dos
// filas. El compositor (motor/der-vista.mjs) dibuja TODAS las relaciones del esquema entre las tablas elegidas, con su
// cardinalidad; lo que no entra en la vista se nombra en el texto de la página y está en las vistas completas (DER-01 a
// DER-15). El guion bajo evita que el constructor la tome como lámina.
import { componerVistaDer } from '../motor/der-vista.mjs';

// Alto de cada vista (pt): el de la grilla más la leyenda. Las vistas con entidades cortas usan menos.
const ALTOS = { 'D-10': 300, 'D-16': 326 };
const altoDe = (id) => ALTOS[id] ?? 372;

export function metaVista(id, titulo, alcance, fuente) {
  return { id, titulo, alcance, fuente: `prisma/schema.prisma · ${fuente}`, estado: 'implementado', ancho: 750, alto: altoDe(id) };
}

export function dibujarVista(L, { vista, grilla, enfasis = [], maximo = 3, separacionFilas = 30, rutas = {} }) {
  const alto = altoDe(L.id);
  const area = { x: 26, y: 24, w: 698, h: alto - 70 };
  const g = componerVistaDer(L, { vista, grilla, area, maximo, enfasis, separacionFilas, rutas, anchoLamina: 750 });
  L.leyenda({
    x: 4,
    y: alto - 30,
    w: 742,
    titulo: null,
    columnas: 5,
    items: [
      { muestra: 'linea:uno', texto: 'uno y solo uno' },
      { muestra: 'linea:cero_o_uno', texto: 'cero o uno' },
      { muestra: 'linea:cero_o_muchos', texto: 'cero o muchos' },
      { muestra: 'texto:PK FK', texto: 'claves · * obligatorio · o opcional' },
      { muestra: 'texto:↗', texto: 'clave hacia otra área' },
    ],
  });
  return g;
}
