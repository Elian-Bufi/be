/**
 * Cómo se dibujan, en el teléfono, los sitios de la figura de la toma (DL-111): anillos, puntos y guías.
 *
 * Es la receta de Medición del compositor (`DIBUJO_EN_MEDICION` y `GUIA_EN_MEDICION`, en @be/domain), simplificada para
 * una pantalla chica (Dirección, 2026-10-01: los anillos eran cápsulas con doble contorno y en el teléfono se veían
 * rotos). Las capas son del mismo tipo que las del compositor y toman de él los colores y las opacidades de cada tema;
 * lo que cambia es que hay menos capas y que los grosores están en dp:
 * - un anillo es una **elipse**: la mitad trasera, la de arriba, fina y punteada; la delantera, la de abajo, llena y con
 *   un resplandor suave en dos pasadas. Se dibuja entero encima del cuerpo (el compositor dibuja además una copia
 *   debajo, que en el teléfono no se llega a ver);
 * - un punto de pliegue es un halo, un aro y su centro; el de la cara posterior lleva el aro punteado;
 * - una guía es punteada, como en la lámina, con su punto en el borde de la tarjeta.
 * Ubica, nunca califica (RF-048; DL-073): los colores distinguen capas del dibujo, nunca rangos.
 *
 * Sin JSX ni React, para que una maqueta en el navegador pueda dibujar con estos mismos números sin teléfono.
 */
import type { CapaDelDibujo, ElipseEnLaLamina, TrazoDeLaGuia } from '@be/domain';

/** El anillo de un perímetro, de abajo hacia arriba (compositor: las capas de encima de `DIBUJO_EN_MEDICION.anillo`). */
export const ANILLO_EN_EL_TELEFONO: readonly CapaDelDibujo[] = [
  // La mitad trasera: fina y punteada, se ve «a través» del cuerpo.
  { color: 'anilloTrazo', tramo: 'TRASERO', grosor: 1.2, opacidad: 0.7, guiones: [3, 2.6] },
  // La mitad delantera: el resplandor ancho y el angosto, con las opacidades del tema, y el trazo lleno encima.
  { color: 'anilloResplandor', tramo: 'DELANTERO', grosor: 8, opacidad: { resplandor: 'ANCHO', mas: 0.02 } },
  { color: 'anilloResplandor', tramo: 'DELANTERO', grosor: 4.6, opacidad: { resplandor: 'ANGOSTO', mas: 0.06 } },
  { color: 'anilloNucleo', tramo: 'DELANTERO', grosor: 2.2, opacidad: 1 },
];

/** El punto de un pliegue (compositor: `DIBUJO_EN_MEDICION.pliegue`): el halo, el aro con su relleno y el centro. */
export const PLIEGUE_EN_EL_TELEFONO: readonly CapaDelDibujo[] = [
  { color: 'anilloResplandor', radio: 11, opacidad: 0.18 },
  { color: 'puntoRelleno', radio: 6, opacidad: 1 },
  { color: 'puntoAro', radio: 6, grosor: 2, opacidad: 1 },
  { color: 'puntoCentro', radio: 2, opacidad: 1 },
];

/** El punto de un pliegue de la cara posterior (compositor: `DIBUJO_EN_MEDICION.plieguePosterior`): el aro, punteado. */
export const PLIEGUE_POSTERIOR_EN_EL_TELEFONO: readonly CapaDelDibujo[] = [
  { color: 'anilloResplandor', radio: 11, opacidad: 0.18 },
  { color: 'posteriorFondo', radio: 6, opacidad: 1 },
  { color: 'posterior', radio: 6, grosor: 2, opacidad: 1, guiones: [2.6, 2.4] },
  { color: 'posterior', radio: 2, opacidad: 1 },
];

/** Las guías (compositor: `GUIA_EN_MEDICION`), más finas: la de un pliegue posterior, con su propio punteado. */
export const GUIA_EN_EL_TELEFONO: { readonly normal: TrazoDeLaGuia; readonly posterior: TrazoDeLaGuia } = {
  normal: { color: 'guia', colorDelPunto: 'guiaPunto', grosor: 1.3, guiones: [4, 3], radioDelPunto: 2.5 },
  posterior: { color: 'posterior', colorDelPunto: 'posterior', grosor: 1.3, guiones: [2, 3], radioDelPunto: 2.5 },
};

/**
 * La mitad de una elipse como trazo SVG (compositor y website: `arco`). Las dos van de un extremo al otro en el sentido
 * de las agujas del reloj: la delantera pasa por abajo; la trasera, por arriba.
 */
export function arcoDeLaElipse({ cx, cy, rx, ry }: ElipseEnLaLamina, tramo: 'DELANTERO' | 'TRASERO'): string {
  return tramo === 'DELANTERO' ? `M ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy}` : `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`;
}

/** Una guía como trazo SVG: sale de la tarjeta, sigue horizontal hasta el quiebre y va recta hasta el sitio. */
export function trazoDeLaGuia(desde: { readonly x: number; readonly y: number }, quiebre: number, hasta: { readonly x: number; readonly y: number }): string {
  return `M ${desde.x} ${desde.y} H ${quiebre} L ${hasta.x} ${hasta.y}`;
}
