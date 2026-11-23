/**
 * DL-196 (WP-EDITOR-ENTRENAMIENTO, EE-05) · el panel derecho del editor de Entrenamiento es contextual: según dónde está
 * el foco del profesional (el plan, una fase, una sesión o un ejercicio) muestra su herramienta. Sin React, para probarlo
 * solo (`apps/web/test/editor-de-entrenamiento.test.mjs`).
 *
 * - **El foco** lo marca el centro con `data-foco` («plan», «fase», «sesion», «ejercicio») y, en un ejercicio, su
 *   posición en `data-foco-ejercicio`. Lo lee el elemento que recibe el foco o el toque, subiendo hasta la marca.
 * - **Las herramientas de cada foco** están en un registro: la parte A trae el almanaque (plan, fase y sesión) y, para un
 *   ejercicio, «La vez pasada» con la carga en el tiempo. La parte B suma las suyas acá (progresiones y descargas, la
 *   distribución por grupo muscular con la silueta, los gráficos X/Y, los favoritos del plan) sin tocar el marco.
 */
import type { VezPasada } from '@be/domain';

export type FocoDelEditor = { readonly tipo: 'plan' } | { readonly tipo: 'fase' } | { readonly tipo: 'sesion' } | { readonly tipo: 'ejercicio'; readonly l: number };

/** Las herramientas del panel. Las de la parte B quedan nombradas para que el registro las reciba sin cambiar su forma. */
export type HerramientaDelPanel = 'almanaque' | 'la-vez-pasada' | 'carga-en-el-tiempo';
export type HerramientaDeLaParteB = 'progresiones-y-descargas' | 'distribucion-por-grupo' | 'silueta' | 'graficos-x-y' | 'favoritos-del-plan';

export const HERRAMIENTAS_DEL_FOCO: Readonly<Record<FocoDelEditor['tipo'], readonly HerramientaDelPanel[]>> = {
  plan: ['almanaque'],
  fase: ['almanaque'],
  sesion: ['almanaque'],
  ejercicio: ['la-vez-pasada', 'carga-en-el-tiempo'],
};

export const FOCO_DE_ENTRADA: FocoDelEditor = { tipo: 'plan' };

/** Lo mínimo de un elemento del DOM que hace falta para leer su foco (así se prueba sin navegador). */
interface ConMarca {
  closest(selector: string): { getAttribute(nombre: string): string | null } | null;
}

/** El foco que marca el elemento (o el más cercano de sus contenedores), o `null` si no está en el centro. */
export function focoDelElemento(el: ConMarca | null): FocoDelEditor | null {
  const marca = el?.closest('[data-foco]') ?? null;
  const tipo = marca?.getAttribute('data-foco');
  if (tipo === 'plan' || tipo === 'fase' || tipo === 'sesion') return { tipo };
  if (tipo === 'ejercicio') {
    const valor = marca?.getAttribute('data-foco-ejercicio') ?? '';
    const l = valor === '' ? Number.NaN : Number(valor);
    return Number.isInteger(l) && l >= 0 ? { tipo, l } : { tipo: 'sesion' };
  }
  return null;
}

/** Si dos focos son el mismo (para no volver a dibujar el panel en cada toque). */
export const mismoFoco = (a: FocoDelEditor, b: FocoDelEditor): boolean => a.tipo === b.tipo && (a.tipo !== 'ejercicio' || (b.tipo === 'ejercicio' && a.l === b.l));

/** Un punto de «La carga en el tiempo»: la carga más alta registrada en una vez del ejercicio. */
export interface PuntoDeCarga {
  readonly fecha: string;
  readonly carga: number;
}

/**
 * La carga más alta de cada vez registrada del ejercicio, de la más vieja a la más nueva, en la unidad de todas (con
 * unidades mezcladas, nada: no se convierte). Una vez sin cargas no es un punto.
 */
export function puntosDeCarga(veces: readonly VezPasada[]): { readonly unidad: 'kg' | 'lb'; readonly puntos: readonly PuntoDeCarga[] } | null {
  // La unidad de todas las cargas registradas, si es una sola (como `unidadComun` de «La vez pasada»).
  const unidades = new Set(veces.flatMap((v) => (v.como.tipo === 'series' ? v.como.series.flatMap((s) => (s.carga ? [s.carga.unit] : [])) : [])));
  const unidad = unidades.size === 1 ? [...unidades][0]! : null;
  if (!unidad) return null;
  const puntos = veces
    .flatMap((v) => {
      if (v.como.tipo !== 'series') return [];
      const cargas = v.como.series.flatMap((s) => (s.carga && s.carga.unit === unidad ? [s.carga.value] : []));
      return cargas.length > 0 ? [{ fecha: v.fecha, carga: Math.max(...cargas) }] : [];
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  return puntos.length > 0 ? { unidad, puntos } : null;
}
