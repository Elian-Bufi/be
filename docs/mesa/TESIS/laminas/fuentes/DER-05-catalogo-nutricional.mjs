// DER · Nutrición: catálogo, recetas e importación (B-07 de WP-04, WP-08, WP-CATALOGO-BASE, Mis habituales y
// WP-NUTRICION-RECETAS). Filas y relaciones: datos/esquema.json. Reglas: un ítem externo es único por proveedor e
// identificador y lo ven todos (DL-141 D-1); las versiones se encadenan; las imágenes de receta son medios privados (DL-120).
import { dibujarVistaDer, metaDer } from './_der-comun.mjs';

export const meta = metaDer('DER-05', {
  alcance: 'Los alimentos y sus versiones, lo importado de Open Food Facts, los nombres alternativos, las recetas y los habituales.',
  fuente: 'secciones WP-04 · Circuito nutricional, WP-08, WP-CATALOGO-BASE, Mis habituales y WP-NUTRICION-RECETAS',
});

export function dibujar(L) {
  dibujarVistaDer(
    L,
    'DER-05',
    {
      area: { x: 8, y: 8, w: 734, h: 404 },
      grilla: {
        AlimentoHabitual: [0, 0],
        NombreAlternativoDeAlimento: [0, 1],
        RetiroDeNombreAlternativoDeAlimento: [0, 2],
        VersionDeElementoNutricional: [1, 0],
        ElementoDeCatalogoNutricional: [1, 1],
        ItemExternoDeCatalogo: [1, 2],
        CandidatoDeImportacion: [2, 0],
        ResolucionDeCandidato: [2, 1],
        ComidaHabitual: [2, 2],
        VersionDeReceta: [3, 0],
        Receta: [3, 1],
        AsociacionDeImagenDeReceta: [3, 2],
      },
      maximo: 3,
      separacionFilas: 22,
      enfasis: ['ElementoDeCatalogoNutricional'],
    },
    { leyenda: { x: 8, y: 422, w: 734 } },
  );
}
