// DER · Entrenamiento: ejecución y revisión (B-08 de WP-06 y WP-ENTRENAMIENTO-SERIES). Filas y relaciones:
// datos/esquema.json. Reglas: un borrador por ocurrencia (DL-049, DL-077); confirmado queda congelado (06:5221); una sola
// ejecución por ocurrencia (REG-06-115); los tiempos de la sesión son eventos aparte (DL-124).
import { dibujarVistaDer, metaDer } from './_der-comun.mjs';

export const meta = metaDer('DER-10', {
  alcance: 'La sesión en curso como borrador, la ejecución registrada, su corrección trazable y la revisión del profesional.',
  fuente: 'secciones WP-06 · Circuito de entrenamiento y WP-ENTRENAMIENTO-SERIES',
});

export function dibujar(L) {
  dibujarVistaDer(
    L,
    'DER-10',
    {
      area: { x: 8, y: 24, w: 734, h: 388 },
      grilla: {
        EventoDeTiempoDeEntrenamiento: [0, 0],
        BorradorDeEjecucionDeEntrenamiento: [1, 0],
        EjecucionDeEntrenamiento: [2, 0],
        CorreccionDeEjecucionDeEntrenamiento: [3, 0],
        AplicacionDeRevisionDeEntrenamiento: [0, 1],
        RevisionDeEntrenamiento: [1, 1],
        EventoDeEntrenamiento: [2, 1],
      },
      maximo: 6,
      separacionFilas: 22,
      enfasis: ['EjecucionDeEntrenamiento'],
    },
    {
      notas: { columna: 3, desdeFila: 1, limite: 414 },
      propias: [
        {
          titulo: 'Borrador y ejecución',
          texto: 'La sesión en curso se guarda como borrador en el servidor, uno por ocurrencia. Registrarla crea la ejecución, una sola por ocurrencia, y el borrador queda congelado. Corregir agrega una corrección encadenada.',
        },
      ],
      leyenda: { x: 8, y: 422, w: 734 },
    },
  );
}
