// DER · Información pertinente (CAP-DAT del 06 §20.4, WP-07, RF-071). Filas y relaciones: datos/esquema.json. Reglas: la
// respuesta original es inmutable y siempre SELF_REPORTED (09 §22.7), una por solicitud; se rectifica con filas nuevas.
import { dibujarVistaDer, metaDer } from './_der-comun.mjs';

export const meta = metaDer('DER-12', {
  alcance: 'Plantillas versionadas, la solicitud del profesional, la respuesta de la persona y su rectificación.',
  fuente: 'sección WP-07 · Información profesional pertinente',
});

export function dibujar(L) {
  dibujarVistaDer(
    L,
    'DER-12',
    {
      area: { x: 24, y: 8, w: 718, h: 404 },
      grilla: {
        PlantillaDeFormulario: [0, 0],
        VersionDePlantillaDeFormulario: [0, 1],
        SolicitudDeFormulario: [1, 1],
        RespuestaDeFormulario: [1, 2],
        EventoDeFormulario: [2, 0],
        RectificacionDeRespuestaDeFormulario: [2, 2],
      },
      maximo: 4,
      separacionFilas: 22,
      enfasis: ['RespuestaDeFormulario'],
    },
    {
      notas: { columna: 1, desdeFila: 0, limite: 150, maximoCampos: 3 },
      propias: [
        {
          titulo: 'Lo que responde la persona',
          texto: 'La respuesta original no cambia y siempre es autodeclarada (SELF_REPORTED): una por solicitud. Rectificar agrega filas encadenadas.',
        },
      ],
      leyenda: { x: 8, y: 422, w: 734 },
    },
  );
}
