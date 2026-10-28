// Guía central · nivel 5: cómo cambia la base. Arriba, las 53 migraciones en el tiempo (los hitos, no cantidades);
// abajo, el camino de una migración hasta test. Fuentes: prisma/migrations (53 carpetas, del 2026-09-16 al 2026-10-25),
// apps/api/scripts/iniciar.sh (DL-006), .github/workflows/ci.yml (integración e imagen API).
export const meta = {
  id: 'G-12',
  titulo: 'Las migraciones: la base cambia por pasos que no se reescriben',
  alcance: '53 migraciones del 16/9 al 25/10. Cada una se aplica una sola vez, en orden, y queda anotada.',
  fuente: 'prisma/migrations · apps/api/scripts/iniciar.sh · .github/workflows/ci.yml',
  estado: 'implementado',
  ancho: 750,
  alto: 304,
};

const X0 = 34;
const X1 = 716;
const DIAS = 39; // del 16/9 al 25/10
const xDe = (dia) => X0 + ((X1 - X0) * dia) / DIAS;
// Días desde el 16/9 con al menos una migración (19 fechas, 53 migraciones).
const FECHAS = [0, 2, 3, 4, 5, 8, 12, 14, 15, 16, 17, 19, 20, 22, 29, 30, 31, 33, 39];

export function dibujar(L) {
  const yEje = 52;
  // El eje es una cadena de tramos entre fecha y fecha (sin puntas); la flecha final dice que el tiempo sigue.
  for (const d of FECHAS) L.nodoInicial({ id: `f${d}`, cx: xDe(d), cy: yEje, r: 3.5 });
  for (let i = 0; i < FECHAS.length - 1; i++) L.conector({ de: `f${FECHAS[i]}`, lado: 'e', a: `f${FECHAS[i + 1]}`, ladoA: 'o', fin: null });
  L.mensaje({ x1: X1 + 4, x2: X1 + 26, y: yEje, tipo: 'asinc' });
  const hitos = [
    [0, 'arriba', ['16/9 · identidad', 'y sesiones'], 'start'],
    [4, 'abajo', ['19 a 21/9 · vínculos y PDP, nutrición,', 'antropometría, entrenamiento: once'], 'start'],
    [17, 'arriba', ['3/10 · el PDP bloquea', 'lo que corta'], 'middle'],
    [20, 'abajo', ['5 y 6/10 · recetas y medios,', 'capacidades del cliente'], 'middle'],
    [30, 'arriba', ['16 y 17/10 · novedades,', 'Google, notas'], 'middle'],
    [33, 'abajo', ['19/10 · catálogo base', 'y reanudación web'], 'middle'],
    [39, 'arriba', ['25/10 ·', 'administración'], 'end'],
  ];
  for (const [d, lado, lineas, ancla] of hitos) {
    const x = xDe(d);
    lineas.forEach((t, k) => {
      const y = lado === 'arriba' ? yEje - 14 - (lineas.length - 1 - k) * 13.5 : yEje + 22 + k * 13.5;
      L.texto({ x, y, texto: t, ancla, color: '#0F172A' });
    });
  }

  const pasos = [
    ['sch', 'schema.prisma cambia', 'El modelo de datos, en el código.'],
    ['sql', 'migration.sql nueva', 'Prisma la genera; los disparadores se escriben a mano.'],
    ['ci', 'La CI la prueba', 'Aplica las 53 sobre bases vacías, como el despliegue.'],
    ['dep', 'Render: migrate deploy', 'Al arrancar el contenedor nuevo.'],
    ['tab', '_prisma_migrations', 'Anota cuáles se aplicaron: nunca dos veces.'],
  ];
  const w = 132;
  const g = (742 - 5 * w) / 4;
  pasos.forEach(([id, titulo, detalle], i) => L.redondeado({ id, x: 4 + i * (w + g), y: 124, w, h: 76, titulo, detalle, radio: 6 }));
  for (let i = 0; i < pasos.length - 1; i++) L.conector({ de: pasos[i][0], lado: 'e', a: pasos[i + 1][0], ladoA: 'o' });
  L.redondeado({ id: 'falla', x: 4 + 3 * (w + g) - 70, y: 230, w: 272, h: 64, titulo: 'Si falla', detalle: 'El proceso termina, la instancia nueva no pasa /health/ready y Render conserva la anterior.', tipo: 'pendiente', radio: 6 });
  L.conector({ de: 'dep', lado: 's', a: 'falla', ladoA: 'n', tA: 0.757 });
}
