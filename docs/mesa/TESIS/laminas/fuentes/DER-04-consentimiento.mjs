// DER · Actos, consentimiento y autorización (relación A del 08 §12, M-03 de WP-03 y el PDP). Filas y relaciones:
// datos/esquema.json. Reglas de la base: un acto solo pasa de VIGENTE a REVOCADO (trigger); cada decisión del PDP se
// registra en la misma transacción, con la versión de consentimiento que la resolvió (08 §29).
import { dibujarVistaDer, metaDer } from './_der-comun.mjs';

export const meta = metaDer('DER-04', {
  alcance: 'Los actos de la persona (términos, privacidad, datos de salud), el consentimiento por vínculo y cada decisión de acceso.',
  fuente: 'secciones Relación A, WP-03 · M-03 y WP-03 · PDP',
});

export function dibujar(L) {
  dibujarVistaDer(
    L,
    'DER-04',
    {
      area: { x: 8, y: 24, w: 734, h: 388 },
      grilla: {
        VersionDeTexto: [0, 0],
        ActoRegistrable: [0, 1],
        VersionDeConsentimiento: [1, 0],
        DecisionDeAcceso: [1, 1],
        Consentimiento: [2, 0],
        EventoDeVinculo: [2, 1],
      },
      maximo: 6,
      separacionFilas: 42,
      enfasis: ['Consentimiento'],
    },
    {
      leyenda: { x: 8, y: 422, w: 734 },
    },
  );
}
