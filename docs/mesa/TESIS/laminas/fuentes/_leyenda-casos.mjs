// Leyenda común de las vistas de casos de uso.
export function leyendaDeCasos(L, { x = 6, y, w = 716, extend = false, estados = false, nota = 'todos incluyen además UC-I02 y UC-I03', columnas } = {}) {
  const items = [{ muestra: 'linea', texto: 'asociación (actor principal)' }, { muestra: 'linea-discontinua:flecha', texto: extend ? '«include» o «extend»' : '«include»' }];
  if (estados) items.push({ muestra: 'pendiente', texto: 'pendiente o fuera de alcance' });
  items.push({ muestra: 'nota', texto: nota });
  return L.leyenda({ x, y, w, titulo: null, columnas: columnas ?? items.length, items });
}
