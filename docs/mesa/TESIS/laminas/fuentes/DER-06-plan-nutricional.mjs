// DER · Nutrición: evaluación, objetivo y plan (B-07 de WP-04 y las plantillas de PF-09). Filas y relaciones:
// datos/esquema.json. Reglas: activar es versionar; la instantánea guarda lo emitido con el catálogo resuelto y su huella
// SHA-256, una por versión activada (T-06-21, REG-06-13).
import { dibujarVistaDer, metaDer } from './_der-comun.mjs';

export const meta = metaDer('DER-06', {
  alcance: 'Cómo se encadenan evaluación, objetivo y plan nutricional, cada uno con sus versiones, y las plantillas del profesional.',
  fuente: 'secciones WP-04 · Circuito nutricional y PF-09',
});

export function dibujar(L) {
  dibujarVistaDer(
    L,
    'DER-06',
    {
      area: { x: 8, y: 24, w: 734, h: 388 },
      grilla: {
        ObjetivoNutricional: [0, 0],
        EvaluacionNutricional: [0, 1],
        VersionDeObjetivoNutricional: [1, 0],
        VersionDePlanNutricional: [2, 0],
        PlanNutricional: [2, 1],
        InstantaneaDePlanNutricional: [3, 0],
        PlantillaDePlanNutricional: [3, 1],
        VersionDePlantillaDePlanNutricional: [3, 2],
      },
      maximo: 4,
      separacionFilas: 22,
      enfasis: ['VersionDePlanNutricional'],
    },
    {
      notas: { columna: 1, desdeFila: 1, limite: 414, maximoCampos: 2 },
      propias: [
        {
          titulo: 'Activar es versionar',
          texto: 'Cada versión del plan apunta a la versión del objetivo que la sostiene; el plan señala su versión efectiva. La instantánea guarda lo emitido con su huella, una por versión activada.',
        },
      ],
      leyenda: { x: 8, y: 422, w: 734 },
    },
  );
}
