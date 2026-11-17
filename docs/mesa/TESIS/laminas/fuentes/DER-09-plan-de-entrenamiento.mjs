// DER · Entrenamiento: evaluación, objetivo y plan (B-08 de WP-06). Filas y relaciones: datos/esquema.json. Reglas:
// activar es versionar, como en nutrición; la evaluación puede citar respuestas de información pertinente (WP-07).
import { dibujarVistaDer, metaDer } from './_der-comun.mjs';

export const meta = metaDer('DER-09', {
  alcance: 'Evaluación, objetivo y plan de entrenamiento con sus versiones; la evaluación cita respuestas de la persona.',
  fuente: 'sección WP-06 · Circuito de entrenamiento',
});

export function dibujar(L) {
  dibujarVistaDer(
    L,
    'DER-09',
    {
      area: { x: 8, y: 24, w: 734, h: 392 },
      grilla: {
        CitaDeRespuestaEnEvaluacionDeEntrenamiento: [0, 0],
        EvaluacionDeEntrenamiento: [0, 1],
        VersionDeObjetivoDeEntrenamiento: [1, 0],
        ObjetivoDeEntrenamiento: [1, 1],
        VersionDePlanDeEntrenamiento: [2, 0],
        PlanDeEntrenamiento: [2, 1],
        InstantaneaDePlanDeEntrenamiento: [3, 0],
      },
      maximo: 6,
      separacionFilas: 26,
      enfasis: ['VersionDePlanDeEntrenamiento'],
    },
    {
      notas: { columna: 3, desdeFila: 1, limite: 414 },
      propias: [
        {
          titulo: 'El mismo circuito',
          texto: 'Como en nutrición: la versión del plan apunta a la del objetivo, el plan señala su versión efectiva y la instantánea guarda lo emitido.',
        },
      ],
      leyenda: { x: 8, y: 422, w: 734 },
    },
  );
}
