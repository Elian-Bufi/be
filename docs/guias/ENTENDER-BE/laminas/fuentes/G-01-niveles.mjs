// Guía central · el mapa de lectura: cinco niveles, de lo macro a lo micro, y los dos materiales que profundizan.
export const meta = {
  id: 'G-01',
  titulo: 'La guía, de lo macro a lo micro',
  alcance: 'Los cinco niveles de la guía central, en orden de lectura, y dónde se profundiza cada uno.',
  fuente: 'esta guía',
  estado: 'implementado',
  ancho: 750,
  alto: 214,
};

export function dibujar(L) {
  const niveles = [
    ['Nivel 1 · El sentido', '¿Qué problema resuelve BE y qué valor está demostrado?'],
    ['Nivel 2 · Las piezas', 'APK, website, API, dominio compartido y base: qué hace cada una.'],
    ['Nivel 3 · Las reglas', 'Dónde se valida, dónde se decide el acceso y qué garantiza la base.'],
    ['Nivel 4 · Dos recorridos', 'Una comida y una suspensión, de la pantalla a los datos.'],
    ['Nivel 5 · El cambio', 'Migraciones, versiones, pruebas, CI y despliegue.'],
  ];
  const w = 136;
  const g = 15.5;
  niveles.forEach(([t, d], i) => {
    L.redondeado({ id: `n${i + 1}`, x: 4 + i * (w + g), y: 8, w, h: 88, titulo: t, detalle: d, enfasis: i === 3 });
  });
  for (let i = 1; i < 5; i++) L.conector({ de: `n${i}`, lado: 'e', a: `n${i + 1}`, ladoA: 'o' });

  // Lo que profundiza: el cuaderno de datos (sobre el nivel 3) y el plan de estudio (para practicar todo).
  const xCuaderno = 4 + 2 * (w + g);
  L.caja({ id: 'cuaderno', x: xCuaderno - 20, y: 132, w: w + 40, titulo: 'Cuaderno de datos', tecnologia: 'PDF aparte', descripcion: 'La base de datos por áreas, de macro a micro.' });
  L.conector({ de: 'n3', lado: 's', a: 'cuaderno', ladoA: 'n', estilo: 'discontinuo', etiqueta: { texto: ['profundiza'], lado: 'der' } });
  const xPlan = 4 + 4 * (w + g);
  L.caja({ id: 'plan', x: xPlan, y: 132, w, titulo: 'Plan de estudio', tecnologia: 'cuatro sesiones', descripcion: 'Ejercicios, con las respuestas aparte.' });
  L.conector({ de: 'n5', lado: 's', a: 'plan', ladoA: 'n', estilo: 'discontinuo', etiqueta: { texto: ['practica'], lado: 'der' } });
  L.nota({ x: 4, y: 132, w: 270, titulo: 'Cómo leerla', texto: 'Cada lámina responde una pregunta. Las tarjetas de concepto dan el término técnico, la explicación en criollo, un ejemplo de BE y una pregunta para comprobar.' });
}
