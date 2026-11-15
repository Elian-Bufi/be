/**
 * Las series de Antropometría del catálogo de los gráficos (DL-174). Alcance ANTROPOMETRIA, caso 1: las tomas del
 * profesional que consulta. Fuente API-PRJ-01 `ANTHROPOMETRY_LONGITUDINAL`. Eje X por toma (dos el mismo día son dos
 * puntos) y **solo puntos**: nada une dos tomas, en ningún modo (B10-07, REG-06-165/166; GR-D5). La unidad sale de los
 * datos, y los grupos de comparabilidad (protocolo, método y unidad) cortan. Marca llena para lo medido, contorno
 * cortado para lo reportado y un punto adentro para lo calculado, con su método del catálogo (DL-111).
 *
 * Cualquier `antropometria.<código>` se resuelve como hoy (`definicionAntropometrica`); las de abajo son las que nombran
 * los gráficos sugeridos. Este archivo lo edita solo la rama de Nutrición y Antropometría (C).
 */
import { definicionAntropometrica, type DefinicionDeMetrica } from './metricas-del-analisis';
import type { EstadoDeLaSerie, SerieDisponible } from './series-disponibles';

/** La serie de un código del catálogo de medidas, con la unidad de los datos (vacía mientras no se leyó). */
export function serieDisponibleAntropometrica(codigo: string, unidad: string, estado: EstadoDeLaSerie = 'OFRECIDA', graficos: readonly string[] = [], definicion?: DefinicionDeMetrica): SerieDisponible {
  const d = definicion ?? definicionAntropometrica(codigo, unidad);
  return {
    id: d.id,
    definicion: d,
    ejeX: 'FECHA',
    granos: ['ORIGINAL'],
    unirPuntos: false,
    fuente: { tipo: 'PROYECCION', operacion: 'API-PRJ-01', clave: 'ANTHROPOMETRY_LONGITUDINAL', parametro: codigo },
    acceso: { alcances: ['ANTROPOMETRIA'], caso: 'PLANES_PROPIOS', soloProfesional: false },
    metodo: null,
    marca: 'MEDIDO_O_CALCULADO',
    requiere: { ejercicio: false, serie: false, listaV1: false },
    rangoMinimoDelEje: null,
    estado,
    graficos,
  };
}

export const SERIES_DE_ANTROPOMETRIA: readonly SerieDisponible[] = [
  serieDisponibleAntropometrica('peso', 'kg', 'OFRECIDA', ['SP-02', 'GR-13']),
  serieDisponibleAntropometrica('suma-6-pliegues-isak', 'mm', 'OFRECIDA', ['GR-16']),
  serieDisponibleAntropometrica('masa-grasa-durnin-womersley', 'kg', 'OFRECIDA', ['GR-20']),
  serieDisponibleAntropometrica('masa-grasa-faulkner', 'kg', 'OFRECIDA', ['GR-20']),
  serieDisponibleAntropometrica('masa-libre-de-grasa-durnin-womersley', 'kg', 'OFRECIDA', ['GR-20']),
  serieDisponibleAntropometrica('masa-libre-de-grasa-faulkner', 'kg', 'OFRECIDA', ['GR-20']),
  // GR-19 y GR-D9: el perímetro corregido por pliegue es de la fase 4 y pide su DL; no se ofrece.
  serieDisponibleAntropometrica('perimetro-corregido', 'cm', 'PIDE_DL', ['GR-19'], {
    ...definicionAntropometrica('perimetro-corregido', 'cm'),
    nombre: 'Perímetro corregido por pliegue',
    nombreCorto: 'Perímetro corregido',
    clase: 'FUTURA',
    implementada: false,
  }),
];
