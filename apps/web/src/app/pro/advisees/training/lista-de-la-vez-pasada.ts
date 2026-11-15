/**
 * Las cuentas de la lista de «La vez pasada» (GR-01; pasada visual del 15/11 y revisión del 15/11), aparte del componente
 * para que se prueben ejecutándolas:
 * - **Todas las veces de lo leído:** la lectura ya trae los 91 días; se arman todas, no las doce primeras. Así «Ver las 9
 *   anteriores» dice cuántas hay de verdad, y abrirlas llega hasta el «desde el …» de la línea de arriba.
 * - **Cada fila es una vez,** no una sesión: el mismo ejercicio dos veces en una sesión son dos filas (cada una con su
 *   prescripción). El botón cuenta filas («anteriores»), no sesiones.
 * - **Una sola unidad para toda la lista:** la línea de arriba y las fichas la sacan de todas las veces, no de las que se
 *   ven. Si las tres últimas son sin carga y una vieja tiene 10 kg, la unidad va arriba y la ficha vieja dice «10 × 8»;
 *   antes, al abrir la lista, la ficha perdía su «kg» y arriba no estaba.
 *
 * Es puro: lo prueba `apps/web/test/graficos-fase-1.test.mjs`.
 */
import { textoDeLaSerie, type SerieDeLaVezPasada, type VezPasada } from '@be/domain';

/** Cuántas veces se arman de lo leído: todas (los 91 días ya están leídos; no hay otra lectura). */
export const TODAS_LAS_VECES = Number.POSITIVE_INFINITY;

/** La unidad de carga de todas las veces, si es una sola: se dice una vez arriba y no en cada ficha. */
export function unidadComun(veces: readonly VezPasada[]): 'kg' | 'lb' | null {
  const unidades = new Set(veces.flatMap((v) => (v.como.tipo === 'series' ? v.como.series.flatMap((s) => (s.carga ? [s.carga.unit] : [])) : [])));
  return unidades.size === 1 ? ([...unidades][0] as 'kg' | 'lb') : null;
}

/** El texto de la ficha: «137,5 × 3 · RIR 2» si la unidad ya está arriba; si no, la serie entera («137,5 kg × 3 · RIR 2»). */
export function textoDeLaFicha(s: SerieDeLaVezPasada, unidad: 'kg' | 'lb' | null): string {
  const entero = textoDeLaSerie(s);
  return unidad && s.carga?.unit === unidad && s.repeticiones !== null ? entero.replace(` ${unidad} ×`, ' ×') : entero;
}

/** Cuántas filas quedan detrás de «Ver las anteriores», con `aLaVista` filas a la vista. */
export const anterioresQueQuedan = (veces: readonly VezPasada[], aLaVista: number): number => Math.max(0, veces.length - aLaVista);
