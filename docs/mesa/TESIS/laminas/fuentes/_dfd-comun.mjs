// Piezas comunes de los diagramas de flujo de datos (anexo D), en notación de Yourdon y DeMarco: el proceso es un
// círculo con su número, el almacén es un rectángulo abierto con su código (D1 a D8) y la entidad externa, un
// rectángulo. Cada flujo lleva el nombre del dato que viaja, nunca un verbo. Una flecha con dos puntas es un almacén
// que el proceso lee y escribe.

/** Flujo de datos recto entre dos nodos, recortado en el borde de cada forma. */
export function flujoDeDatos(L, de, a, texto, { doble = false, desplazamiento = 0, lado, pos, manual = false } = {}) {
  const lineas = [].concat(texto);
  return L.relacion({
    de,
    a,
    fin: 'flecha',
    inicio: doble ? 'flecha' : null,
    desplazamiento,
    etiqueta: lineas[0],
    // `manual`: el rótulo va exactamente en `pos` y del `lado` pedido (la revisión automática igual lo controla).
    rotulo: { texto: lineas, ...(lado ? { lado } : {}), ...(pos !== undefined ? { pos } : {}), ...(manual ? { auto: false, segmento: 0 } : {}) },
  });
}

export const LEYENDA_DFD = [
  { muestra: 'persona', texto: 'persona externa' },
  { muestra: 'externo', texto: 'sistema externo' },
  { muestra: 'proceso', texto: 'proceso numerado' },
  { muestra: 'almacen', texto: 'almacén de datos' },
  { muestra: 'linea:flecha', texto: 'flujo de datos; dos puntas: lee y escribe' },
];
