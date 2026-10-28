// Cartera por conjuntos · lámina 2: dónde se repetía trabajo. La lectura anterior (main e4512cb) recorría persona por
// persona y área por área, con cinco a siete consultas cada vez. Fuente: test/integration/soporte-cartera-anterior.ts
// (la copia congelada), funciones dePlanificacion, deAntropometria y solicitudAbierta.
export const meta = {
  id: 'CA-02',
  titulo: 'Antes: el paso 3 iba persona por persona',
  alcance: 'Con tres personas ya son veintiuna idas y vueltas; con 200, unas 1.320. Cada ida y vuelta espera a la anterior.',
  fuente: 'test/integration/soporte-cartera-anterior.ts (= apps/api/src/cartera/lectura-cartera.ts en e4512cb)',
  estado: 'implementado',
  ancho: 750,
  alto: 322,
};

export function dibujar(L) {
  L.marco({ id: 'tx', x: 4, y: 4, w: 492, h: 314, titulo: 'Una transacción de lectura', subtitulo: 'persona por persona, área por área, consulta por consulta' });
  const personas = [
    ['Ana · Nutrición', 'plan y versión efectiva · borrador · Proceso abierto · revisión vigente · solicitud sin respuesta · comidas del período'],
    ['Ana · Entrenamiento', 'plan y versión efectiva · borrador · Proceso abierto · revisión vigente · solicitud sin respuesta · sesiones del período'],
    ['Bruno · Nutrición', 'plan y versión efectiva · borrador · Proceso abierto · revisión vigente · solicitud sin respuesta · comidas del período'],
    ['Carla · Antropometría', 'evaluación en preparación · solicitud sin respuesta · tomas registradas del período'],
  ];
  const y0 = 30;
  const h = 56;
  personas.forEach(([t, d], i) => L.redondeado({ id: `par${i}`, x: 16, y: y0 + i * (h + 8), w: 290, h, titulo: t, detalle: d, radio: 6 }));
  L.texto({ x: 16, y: 300, texto: '… y así con cada par (persona, área) permitido: hasta 200 personas por 3 áreas.', estilo: L.TX.meta });

  L.cilindro({ id: 'bd', x: 346, y: 96, w: 136, titulo: 'PostgreSQL', descripcion: 'Responde cada consulta en microsegundos; el viaje tarda más que la consulta.' });
  for (let i = 0; i < personas.length; i++) L.conector({ de: `par${i}`, lado: 'e', a: 'bd', ladoA: 'o', tA: 0.2 + i * 0.2, inicio: 'flecha', fin: 'flecha', color: '#9AA8BC', etiqueta: i === 0 ? '6 ó 7 por par' : undefined });

  L.redondeado({ id: 'ciclo', x: 516, y: 4, w: 230, h: 112, titulo: 'Cada consulta espera a la anterior', detalle: 'La conexión queda tomada con la transacción abierta mientras la API prepara la siguiente: con 200 personas, 1.320 esperas chicas que suman 880 ms.', tipo: 'pendiente', radio: 6 });
  L.nota({ x: 516, y: 132, w: 230, titulo: 'Por qué se llama N+1', texto: 'Una consulta para la lista (los vínculos) y después N consultas más, una por elemento. El costo crece con N aunque cada consulta sea trivial.' });
  L.nota({ x: 516, y: 232, w: 230, titulo: 'Medido (CONCURRENCIA.md, S-B200)', texto: '1.320 sentencias, 21 ms ejecutándose en la base, 880 ms de bloque: el 43 % de la página.' });
}
