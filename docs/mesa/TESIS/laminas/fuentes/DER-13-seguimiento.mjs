// DER · Seguimiento, novedades y avisos (WP-NOTAS-DE-COORDINACION, WP-DASHBOARD-PROFESIONAL, TVCC-30 y
// WP-NOVEDADES-Y-AVISOS). Filas y relaciones: datos/esquema.json. Reglas: el aviso push no lleva datos sensibles y
// referencia una sola novedad (T-06-08); cada corrida de la TVCC-30 es un resultado nuevo, sucesor del anterior (REG-06-198).
import { dibujarVistaDer, metaDer } from './_der-comun.mjs';

export const meta = metaDer('DER-13', {
  alcance: 'Notas entre profesionales, vistas de análisis guardadas, la métrica TVCC-30, las novedades y los avisos al teléfono.',
  fuente: 'secciones WP-NOTAS-DE-COORDINACION, Vistas de análisis, RF-058 · TVCC-30 y Novedades y avisos push',
});

export function dibujar(L) {
  dibujarVistaDer(
    L,
    'DER-13',
    {
      area: { x: 24, y: 8, w: 718, h: 404 },
      grilla: {
        DestinatarioDeNota: [0, 0],
        NotaDeCoordinacion: [0, 1],
        ReferenciaDeNota: [0, 2],
        LecturaDeNovedad: [1, 0],
        Novedad: [1, 1],
        AvisoPush: [1, 2],
        VistaDeAnalisis: [2, 0],
        ResultadoTvcc30: [2, 1],
        SuscripcionPush: [2, 2],
        PreferenciaDeRecordatorio: [3, 0],
      },
      maximo: 3,
      separacionFilas: 22,
      enfasis: ['Novedad'],
    },
    {
      notas: { columna: 3, desdeFila: 1, limite: 414, maximoCampos: 2 },
      propias: [
        {
          titulo: 'Avisos sin datos sensibles',
          texto: 'Un aviso referencia una sola novedad y lleva un texto genérico, como «Tenés una novedad.»; el contenido se lee dentro de BE.',
        },
      ],
      leyenda: { x: 8, y: 422, w: 734 },
    },
  );
}
