// Guía central · nivel 5: cinco estados distintos de un mismo cambio, con un caso real (la comparación de Nutrición,
// #211, de la tanda del 2026-10-25). Fuentes: docs/paquetes/REANUDACION-TANDA-2026-10-25.md, EVIDENCIA/PRUEBA-BREVE-2026-10-26.
export const meta = {
  id: 'G-15',
  titulo: 'Cinco estados de un mismo cambio',
  alcance: 'Implementado, verificado, integrado, desplegado y validado no son lo mismo: cada uno tiene su prueba y su lugar.',
  fuente: 'docs/paquetes/REANUDACION-TANDA-2026-10-25.md · EVIDENCIA/PRUEBA-BREVE-2026-10-26',
  estado: 'implementado',
  ancho: 750,
  alto: 318,
};

export function dibujar(L) {
  const w = 136;
  const g = 15.5;
  const x = (i) => 4 + i * (w + g);
  const etapas = [
    ['Implementado', 'El código existe en una rama, con su PR en borrador.'],
    ['Verificado', 'La CI del PR pasó: tipos, unidades, integración y recorridos.'],
    ['Integrado', 'El merge lo llevó a main: es parte del producto.'],
    ['Desplegado', 'Test sirve ese commit, o la APK está publicada.'],
    ['Validado', 'Una persona lo usó y se entendió sin ayuda.'],
  ];
  etapas.forEach(([t, d], i) => L.redondeado({ id: `e${i}`, x: x(i), y: 8, w, h: 86, titulo: t, detalle: d, tipo: i === 4 ? 'persona' : 'sistema', enfasis: i === 2 }));
  for (let i = 0; i < 4; i++) L.conector({ de: `e${i}`, lado: 'e', a: `e${i + 1}`, ladoA: 'o' });

  // El caso real, debajo de cada etapa.
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
    titulo: 'Por qué separarlos',
    texto: 'Cada estado responde una pregunta distinta. «¿Está hecho?», «¿pasa las pruebas?», «¿es parte del producto?», «¿se puede usar en test?» y «¿lo entiende una persona?». Que uno esté hecho no adelanta el siguiente.',
  });
}
