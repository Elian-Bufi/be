// Leyenda común de las vistas de casos de uso.
// «relaciones: false» = la vista no dibuja ningún «include» ni «extend», así que la leyenda no los explica.
export function leyendaDeCasos(L, { x = 6, y, w = 716, extend = false, relaciones = true, estados = false, nota = 'UC-I02, UC-I03 y UC-I11, en cada ficha', columnas } = {}) {
  const items = [{ muestra: 'linea', texto: 'asociación (actor principal)' }];
  if (relaciones) items.push({ muestra: 'linea-discontinua:flecha', texto: extend ? '«include» o «extend»' : '«include»' });
  if (estados) items.push({ muestra: 'pendiente', texto: 'pendiente o fuera de alcance' });
  items.push({ muestra: 'nota', texto: nota });
  return L.leyenda({ x, y, w, titulo: null, columnas: columnas ?? items.length, items });
}
