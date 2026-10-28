// Cuaderno de datos · parte 1: cuántas bases tiene BE y dónde está cada una. Un ambiente es una copia entera del
// sistema; un módulo (un área) es una parte del código. Fuentes: render.yaml (be-db-test, plan basic-256mb),
// test/integration/global-setup.ts (Testcontainers, postgres:16-alpine), test/integration/soporte.ts (la guarda de
// TEST_DATABASE_URL local), docs/paquetes y el alcance declarado (sin producción).
export const meta = {
  id: 'D-02',
  titulo: 'Las bases de BE: una por ambiente, el mismo esquema en todas',
  alcance: 'Las migraciones son las mismas en todos lados; lo que cambia de un ambiente a otro son los datos.',
  fuente: 'render.yaml · test/integration/global-setup.ts · prisma/migrations',
  estado: 'implementado',
  ancho: 750,
  alto: 262,
};

export function dibujar(L) {
  L.caja({ id: 'mig', x: 235, y: 4, w: 280, titulo: 'prisma/migrations', tecnologia: '53 migraciones', descripcion: 'Un solo esquema, public, con 118 tablas.' });
  const columnas = [
    ['pc', 'Tu PC', 'local', 'PostgreSQL 16 local', 'en esta computadora', 'Pruebas y demostraciones sin internet. Datos sintéticos; se rehace.'],
    ['ci', 'La CI', 'ci', 'Uno por corrida', 'Testcontainers', 'Nace vacío, recibe las 53 migraciones y se descarta.'],
    ['test', 'Test', 'test', 'be-db-test', 'PostgreSQL 16 · Render', 'Base be_test, en Frankfurt. Solo la API llega, por la red interna.'],
  ];
  const w = 178;
  const g = 10;
  columnas.forEach(([id, titulo, idBase, nombre, tecnologia, descripcion], i) => {
    const x = 4 + i * (w + g);
    L.marco({ id: `m-${id}`, x, y: 104, w, h: 150, titulo, subtitulo: null });
    L.cilindro({ id: idBase, x: x + 14, y: 132, w: w - 28, titulo: nombre, tecnologia, descripcion });
    if (i === 0) L.conector({ de: 'mig', lado: 'o', a: idBase, ladoA: 'n' });
    else L.conector({ de: 'mig', lado: 's', t: i === 1 ? 0.164 : 0.836, a: idBase, ladoA: 'n' });
  });
  const xP = 4 + 3 * (w + g);
  L.marco({ id: 'prod', x: xP, y: 104, w: 742 - 3 * (w + g), h: 150, titulo: 'Producción', subtitulo: null });
  L.caja({ id: 'noprod', x: xP + 14, y: 140, w: 742 - 3 * (w + g) - 28, tipo: 'externo', titulo: 'No existe', descripcion: 'BE no tiene producción ni datos reales: está fuera del alcance de la entrega.' });
}
