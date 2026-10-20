// Leyenda común de las vistas de casos de uso.
// «relaciones: false» = la vista no dibuja ningún «include» ni «extend», así que la leyenda no los explica.
// «soloExtend» = la vista tiene «extend» y ningún «include»; «externos» y «parcial», si la vista los dibuja.
export function leyendaDeCasos(L, { x = 6, y, w = 716, extend = false, soloExtend = false, relaciones = true, estados = false, externos = false, parcial = false, nota = 'UC-I02, UC-I03 y UC-I11, en cada ficha', columnas } = {}) {
  const items = [{ muestra: 'linea', texto: 'asociación con un actor' }];
  if (relaciones) items.push({ muestra: 'linea-discontinua:flecha', texto: soloExtend ? '«extend»' : extend ? '«include» o «extend»' : '«include»' });
  if (externos) items.push({ muestra: 'externo', texto: 'sistema externo' });
  if (estados) items.push({ muestra: 'pendiente', texto: 'pendiente o fuera de alcance' });
  if (parcial) items.push({ muestra: 'chip:parcial', texto: 'implementado en parte' });
  items.push({ muestra: 'nota', texto: nota });
  return L.leyenda({ x, y, w, titulo: null, columnas: columnas ?? items.length, items });
}
