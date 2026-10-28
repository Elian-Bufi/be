// Cuaderno de datos · de lo macro a lo micro: el motor, la base, el esquema, la tabla, la columna y la fila, con nombres
// reales de BE. Fuentes: prisma/schema.prisma (datasource y @@map), render.yaml (be-db-test, base be_test).
export const meta = {
  id: 'D-01',
  titulo: 'Motor, base, esquema, tabla, columna y fila',
  alcance: 'Cómo se anidan las piezas de una base relacional, con los nombres reales de BE en el ambiente test.',
  fuente: 'prisma/schema.prisma · render.yaml',
  estado: 'implementado',
  ancho: 500,
  alto: 344,
};

export function dibujar(L) {
  L.marco({ id: 'motor', x: 2, y: 2, w: 496, h: 340, titulo: 'Motor: PostgreSQL 16', subtitulo: 'servidor be-db-test, en Render' });
  L.marco({ id: 'base', x: 16, y: 30, w: 468, h: 300, titulo: 'Base de datos: be_test', subtitulo: 'una por ambiente', relleno: '#FFFFFF' });
  L.marco({ id: 'esquema', x: 30, y: 58, w: 440, h: 258, titulo: 'Esquema: public', subtitulo: 'el único que usa BE', relleno: '#F4F7FC' });
  L.entidad({
    id: 'tabla',
    x: 44,
    y: 86,
    w: 196,
    nombre: 'ingesta_nutricional',
    marca: 'tabla',
    filas: [
      { clave: 'PK', nombre: 'id' },
      { clave: 'FK', nombre: 'version_de_plan_id' },
      { clave: 'FK', nombre: 'asesorado_id' },
      { clave: '', nombre: 'fecha_local' },
      { clave: '', nombre: 'origen' },
      { clave: '', nombre: 'cantidades_consumidas' },
      { clave: '', nombre: 'momento_de_registro' },
    ],
    omitidos: 13,
  });
  L.nota({
    x: 258,
    y: 86,
    w: 198,
    titulo: 'Columna',
    texto: 'Un dato con nombre y tipo, igual para todas las filas: fecha_local es una fecha; cantidades_consumidas, un JSON.',
  });
  L.nota({
    x: 258,
    y: 180,
    w: 198,
    titulo: 'Fila',
    texto: 'Un hecho concreto: «Prueba Dos registró su almuerzo el 24/10». Su clave primaria (id) la distingue de todas las demás.',
  });
  L.nota({
    x: 44,
    y: 262,
    w: 412,
    titulo: '118 tablas en el mismo esquema',
    texto: 'Los «módulos» (Nutrición, Entrenamiento…) son agrupaciones lógicas, no esquemas aparte.',
  });
}
