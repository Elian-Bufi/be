// DER · Nutrición: registro y revisión (B-07 de WP-04 y el registro v2 de WP-NUTRICION-RECETAS). Filas y relaciones:
// datos/esquema.json. Reglas: lo registrado no se sobrescribe (REG-06-16): corrección, rectificación de cantidades y
// anulación son filas nuevas; la foto es un medio privado (DL-120).
import { dibujarVistaDer, metaDer } from './_der-comun.mjs';

export const meta = metaDer('DER-07', {
  alcance: 'Lo que la persona registra (ingestas, con foto si quiere), cómo se corrige sin borrar y la revisión del profesional.',
  fuente: 'secciones WP-04 · Circuito nutricional y WP-NUTRICION-RECETAS',
});

export function dibujar(L) {
  dibujarVistaDer(
    L,
    'DER-07',
    {
      area: { x: 24, y: 8, w: 718, h: 404 },
      grilla: {
        CorreccionDeIngesta: [0, 0],
        AnulacionDeIngesta: [0, 1],
        EventoDeNutricion: [0, 2],
        RectificacionDeCantidades: [1, 0],
        IngestaNutricional: [1, 1],
        EvidenciaVisualDeIngesta: [1, 2],
        AplicacionDeRevision: [2, 0],
        RevisionNutricional: [2, 1],
      },
      maximo: { IngestaNutricional: 6 },
      separacionFilas: 42,
      enfasis: ['IngestaNutricional'],
    },
    {
      notas: { columna: 2, desdeFila: 2, limite: 414 },
      propias: [
        {
          titulo: 'Registrar no es corregir',
          texto: 'La ingesta original queda. Corrección, rectificación de cantidades y anulación son filas nuevas, encadenadas. La foto es evidencia aparte.',
        },
      ],
      leyenda: { x: 8, y: 422, w: 734 },
    },
  );
}
