// Cuaderno de datos · qué hace un JOIN: cada fila de ingesta_nutricional busca, por su clave foránea, la fila de
// version_de_plan_nutricional con ese id, y el resultado pone las columnas de las dos lado a lado. Datos sintéticos
// (los de Prueba Dos el 24/10, abreviados).
export const meta = {
  id: 'D-05',
  titulo: 'Qué hace un JOIN',
  alcance: 'Las filas de dos tablas se emparejan por clave foránea = clave primaria; el resultado tiene las columnas de las dos.',
  fuente: 'prisma/schema.prisma (ingesta_nutricional, version_de_plan_nutricional) · datos sintéticos de la prueba breve',
  estado: 'implementado',
  ancho: 750,
  alto: 196,
};

export function dibujar(L) {
  const ingestas = [
    { clave: '', nombre: 'i-01 · plan v-dos · 24/10 · Desayuno' },
    { clave: '', nombre: 'i-02 · plan v-dos · 24/10 · Almuerzo' },
    { clave: '', nombre: 'i-03 · plan v-dos · 24/10 · Cena' },
    { clave: '', nombre: 'i-04 · plan v-tres · 23/10 · Cena' },
  ];
  L.entidad({ id: 'ing', x: 4, y: 26, w: 250, nombre: 'ingesta_nutricional', marca: 'i · FK · fecha · comida', filas: ingestas });
  const versiones = [
    { clave: '', nombre: 'v-dos · ACTIVADA' },
    { clave: '', nombre: 'v-tres · ACTIVADA' },
    { clave: '', nombre: 'v-cuatro · BORRADOR' },
  ];
  L.entidad({ id: 'ver', x: 330, y: 34, w: 160, nombre: 'version_de_plan', marca: 'id · estado', filas: versiones });
  for (const [i, v] of [[0, 0], [1, 0], [2, 0], [3, 1]]) {
    L.conector({ de: 'ing', lado: 'e', campo: ingestas[i].nombre, a: 'ver', ladoA: 'o', campoA: versiones[v].nombre, fin: 'flecha', color: '#1453C9' });
  }
  const resultado = [
    { clave: '', nombre: '24/10 · Desayuno · ACTIVADA' },
    { clave: '', nombre: '24/10 · Almuerzo · ACTIVADA' },
    { clave: '', nombre: '24/10 · Cena · ACTIVADA' },
    { clave: '', nombre: '23/10 · Cena · ACTIVADA' },
  ];
  L.entidad({ id: 'res', x: 540, y: 26, w: 206, nombre: 'resultado', marca: 'fecha · comida · estado', filas: resultado, enfasis: true });
  L.conector({ de: 'ver', lado: 'e', a: 'res', ladoA: 'o', estilo: 'discontinuo' });
  L.nota({
    x: 4,
    y: 132,
    w: 742,
    titulo: 'Leído en criollo',
    texto: '«Para cada comida registrada, traeme la versión del plan que cita, y mostrame las dos cosas juntas». La versión v-cuatro no aparece en el resultado: ninguna comida la cita (un INNER JOIN deja afuera lo que no empareja; un LEFT JOIN la conservaría con las columnas de la otra tabla vacías).',
  });
}
