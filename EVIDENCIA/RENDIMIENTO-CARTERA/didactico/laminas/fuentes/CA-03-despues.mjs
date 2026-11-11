// Cartera por conjuntos · lámina 3: la propuesta. Una consulta por tipo de hecho para toda la cartera, cada una acotada
// a los pares que el PDP permitió en ese alcance; después, los hechos de cada par se arman en memoria, en el mismo orden.
// Fuente: apps/api/src/cartera/lectura-cartera.ts (leerHechosPorConjuntos), apps/api/src/proceso/proceso.service.ts
// (proximasRevisionesVigentes).
export const meta = {
  id: 'CA-03',
  titulo: 'Después: una consulta por tipo de hecho, acotada a lo permitido',
  alcance: 'El paso 3 pasa de «una por par y por hecho» a «una por hecho»: unas once sentencias, cualquiera sea la cantidad de personas.',
  fuente: 'apps/api/src/cartera/lectura-cartera.ts · apps/api/src/proceso/proceso.service.ts',
  estado: 'implementado',
  ancho: 750,
  alto: 320,
};

export function dibujar(L) {
  L.marco({ id: 'tx', x: 4, y: 4, w: 742, h: 312, titulo: 'La misma transacción de lectura', subtitulo: 'por conjuntos' });

  // Entrada: lo que el PDP permitió, por alcance.
  L.redondeado({ id: 'ids', x: 16, y: 32, w: 176, h: 128, titulo: 'Lo que el PDP permitió, por alcance', detalle: 'Nutrición: Ana, Bruno, … · Entrenamiento: Ana, … · Antropometría: Carla, … Cada consulta recibe solo la lista de su alcance.', enfasis: true, radio: 6 });

  // Las consultas, una por tipo de hecho.
  const consultas = [
    ['q1', 'Borradores pendientes', 'una por alcance de plan; DISTINCT ON: una fila por par'],
    ['q2', 'Procesos abiertos', 'y sus expectativas vigentes (otra sentencia)'],
    ['q3', 'Solicitudes sin respuesta', 'la más antigua por par y alcance'],
    ['q4', 'Evaluaciones en preparación', 'la más antigua por par'],
    ['q5', 'Actividad del período', 'GROUP BY asesorado: comidas, sesiones, tomas'],
  ];
  const w = 230;
  consultas.forEach(([id, t, d], i) => L.redondeado({ id, x: 232, y: 32 + i * 56, w, h: 46, titulo: t, detalle: d, radio: 6 }));
  consultas.forEach(([id], i) => L.conector({ de: 'ids', lado: 'e', t: 0.5, a: id, ladoA: 'o', via: [[212, 96], [212, 55 + i * 56]], fin: 'flecha' }));

  L.cilindro({ id: 'bd', x: 502, y: 40, w: 112, titulo: 'PostgreSQL', descripcion: 'Una ida y vuelta por consulta.' });
  consultas.forEach(([id], i) => L.conector({ de: id, lado: 'e', a: 'bd', ladoA: 'o', tA: 0.15 + i * 0.17, via: [[482, 55 + i * 56]], inicio: 'flecha', fin: 'flecha', color: '#9AA8BC' }));

  // Salida: armar los hechos de cada par.
  L.redondeado({ id: 'armar', x: 502, y: 150, w: 232, h: 72, titulo: 'Armar los hechos de cada par', detalle: 'En memoria, en el mismo orden de siempre: revisión, borrador o sin plan, solicitud. Mapas por (alcance, persona).', radio: 6 });
  L.conector({ de: 'bd', lado: 's', a: 'armar', ladoA: 'n', tA: 0.24 });
  L.redondeado({ id: 'lista', x: 502, y: 238, w: 232, h: 64, titulo: 'La misma lista', detalle: 'Mismos ítems, mismo orden, mismo cursor. Lo comprueba la prueba de equivalencia contra la copia congelada.', tipo: 'persona', radio: 6 });
  L.conector({ de: 'armar', lado: 's', a: 'lista', ladoA: 'n' });
}
