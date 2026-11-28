// DER · Entrenamiento: catálogo y plantillas (B-08 de WP-06, WP-CATALOGO-BASE, Mis habituales, PF-09 y las imágenes de
// WP-ENTRENAMIENTO-SERIES). Filas y relaciones: datos/esquema.json. Reglas: lo importado de wger es de todos y cada
// profesional le da nombres alternativos que puede retirar sin borrar (DL-141); las versiones se encadenan.
import { dibujarVistaDer, metaDer } from './_der-comun.mjs';

export const meta = metaDer('DER-08', {
  alcance: 'Los ejercicios y sus versiones, sus nombres alternativos e imágenes, los habituales del profesional y sus plantillas de plan.',
  fuente: 'secciones WP-06, WP-CATALOGO-BASE, Mis habituales, PF-09 y WP-ENTRENAMIENTO-SERIES',
});

export function dibujar(L) {
  dibujarVistaDer(
    L,
    'DER-08',
    {
      area: { x: 8, y: 8, w: 566, h: 404 },
      grilla: {
        EjercicioHabitual: [0, 0],
        NombreAlternativoDeEjercicio: [0, 1],
        RetiroDeNombreAlternativoDeEjercicio: [0, 2],
        EjercicioDeCatalogo: [1, 0],
        VersionDeEjercicio: [1, 1],
        SesionHabitual: [1, 2],
        AsociacionDeImagenDeEjercicio: [2, 0],
        PlantillaDePlanDeEntrenamiento: [2, 1],
        VersionDePlantillaDePlanDeEntrenamiento: [2, 2],
      },
      maximo: 3,
      separacionFilas: 22,
      enfasis: ['EjercicioDeCatalogo'],
    },
    {
      notas: { x: 596, y: 8, w: 146, limite: 414, maximoCampos: 2 },
      propias: [
        {
          titulo: 'Lo importado es de todos',
          texto: 'Un ejercicio de wger se guarda una sola vez y lo ven todos los profesionales. Cada uno puede darle otros nombres y retirarlos sin borrar nada.',
        },
      ],
      leyenda: { x: 8, y: 422, w: 734 },
    },
  );
}
