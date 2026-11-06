// Guía central · nivel 5: cinco dimensiones de un mismo cambio, con un caso real (la comparación de Nutrición, #211, de la
// tanda del 2026-10-25). Fuentes: docs/paquetes/REANUDACION-TANDA-2026-10-25.md, EVIDENCIA/PRUEBA-BREVE-2026-10-26.
// Encargo del 2026-10-28, §14: las cinco no son peldaños de una escala. Se prueban por separado y se combinan, así que
// el diagrama no las encadena con flechas.
export const meta = {
  id: 'G-15',
  titulo: 'Cinco dimensiones de un mismo cambio',
  alcance: 'Implementado, verificado, integrado, desplegado y validado se prueban por separado y se combinan: ninguno es un peldaño del otro.',
  fuente: 'docs/paquetes/REANUDACION-TANDA-2026-10-25.md · EVIDENCIA/PRUEBA-BREVE-2026-10-26',
  estado: 'implementado',
  ancho: 750,
  alto: 318,
};

export function dibujar(L) {
  const w = 136;
  const g = 15.5;
  const x = (i) => 4 + i * (w + g);
  const dimensiones = [
    ['Implementado', 'El código existe en una rama, con su PR en borrador.'],
    ['Verificado', 'Una prueba automática lo comprueba: la CI del PR o un script.'],
    ['Integrado', 'El merge lo llevó a main: es parte del producto.'],
    ['Desplegado', 'Test sirve ese commit, o la APK está publicada.'],
    ['Validado', 'Una persona lo usó y se entendió sin ayuda.'],
  ];
  dimensiones.forEach(([t, d], i) => L.redondeado({ id: `e${i}`, x: x(i), y: 8, w, h: 86, titulo: t, detalle: d, tipo: i === 4 ? 'persona' : 'sistema' }));

  // El caso real, debajo de cada dimensión.
  const caso = [
    ['Rama wp-nutricion-comparacion, PR #211 en borrador'],
    ['CI de la cabeza 91ec9d8: integración 894 de 894'],
    ['main 7079677, el 2026-10-25'],
    ['La API y el website de test lo sirven desde las 19:54 UTC'],
    ['Prueba breve: la parte de Nutrición, todavía pendiente'],
  ];
  caso.forEach(([t], i) => {
    L.caja({ id: `c${i}`, x: x(i), y: 128, w, titulo: i === 4 ? 'En #211 · pendiente' : 'En #211 · hecho', descripcion: t, tipo: i === 4 ? 'pendiente' : 'externo' });
    L.conector({ de: `e${i}`, lado: 's', a: `c${i}`, ladoA: 'n', estilo: 'punteado', fin: null });
  });
  L.nota({
    x: 4,
    y: 244,
    w: 742,
    titulo: 'Se combinan, no se suben como una escalera',
    texto: 'Cada una responde su pregunta: «¿está hecho?», «¿lo comprueba una prueba?», «¿es parte del producto?», «¿se puede usar?» y «¿lo entiende una persona?». #218 está verificado y no integrado; una APK candidata se publica desde su propia rama.',
  });
}
