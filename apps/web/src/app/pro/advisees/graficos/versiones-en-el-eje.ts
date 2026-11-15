/**
 * Las versiones del plan sobre el eje de fechas, discretas (WP-GRAFICOS, pasada visual del 15/11; DISENO-VISUAL §1,
 * principio 5): un fondo de un solo tono muy tenue que alterna entre versiones, una línea vertical fina en cada cambio
 * (no en el borde izquierdo, que no es un cambio) y el rótulo arriba: «v8 · de 4 a 3 repeticiones» si entra hasta la
 * versión siguiente; si no, «v8»; si tampoco, nada. Nada de bloques grises que dominen el gráfico.
 *
 * El SVG no se lee: el cambio de lo indicado también va en texto (revisión del 15/11, §5.12). `cambiosEnTexto` los dice
 * todos, para el nombre del gráfico; `cambiosQueNoEntran`, los que no entraron enteros en su línea, para decirlos a la vista
 * debajo del gráfico.
 *
 * Es puro: lo prueba `apps/web/test/graficos-base.test.mjs`.
 */
import type { BandaDeVersion } from './carriles';
import { diaYMes, type EscalaDeFechas } from './eje-de-fechas';

/** El ancho aproximado de una letra de 12 px, para no escribir un rótulo que no entra. */
const ANCHO_DE_UNA_LETRA = 6.6;

export interface VersionEnElEje {
  readonly clave: string;
  readonly x1: number;
  readonly x2: number;
  /** Las versiones alternan: una sin fondo, la siguiente con el tono tenue. */
  readonly tenue: boolean;
  /** La línea fina del cambio: no va en la primera si empieza antes del eje. */
  readonly conLinea: boolean;
  /** Lo que entra arriba: con el cambio de lo indicado, solo la versión, o nada. */
  readonly texto: string | null;
  /** El rótulo entero, para la lectura y el lector de pantalla. */
  readonly completo: string;
  /** El rótulo que entra dice el cambio de lo indicado. */
  readonly conCambio: boolean;
  /** La versión («v8»), el día en que empieza y lo que cambió en lo indicado (`null` si nada). */
  readonly version: string;
  readonly desde: string;
  readonly cambio: string | null;
}

export function versionesEnElEje(bandas: readonly BandaDeVersion[], escala: Pick<EscalaDeFechas, 'desde' | 'hasta' | 'x' | 'porDia' | 'derecha'>): VersionEnElEje[] {
  const visibles = bandas
    .filter((b) => !((b.hasta !== null && b.hasta < escala.desde) || b.desde > escala.hasta))
    .sort((a, b) => (a.desde < b.desde ? -1 : a.desde > b.desde ? 1 : 0));
  return visibles.map((b, i) => {
    const x1 = escala.x(b.desde < escala.desde ? escala.desde : b.desde) - escala.porDia / 2;
    const x2 = escala.x(b.hasta === null || b.hasta > escala.hasta ? escala.hasta : b.hasta) + escala.porDia / 2;
    const siguiente = visibles[i + 1];
    const tope = siguiente ? escala.x(siguiente.desde) - escala.porDia / 2 : escala.derecha;
    const lugar = tope - x1 - 10;
    const corto = b.rotulo.split(' · ')[0] ?? b.rotulo;
    const largo = b.cambio ? `${corto} · ${b.cambio}` : corto;
    const texto = [largo, corto].find((t) => t.length * ANCHO_DE_UNA_LETRA <= lugar) ?? null;
    return {
      clave: `${b.desde}-${i}`,
      x1,
      x2,
      tenue: i % 2 === 1,
      conLinea: b.desde > escala.desde,
      texto,
      completo: largo,
      conCambio: texto !== null && texto !== corto,
      version: corto,
      desde: b.desde,
      cambio: b.cambio ?? null,
    };
  });
}

/** «v8, desde el 17 may: de 4 a 3 repeticiones»: el cambio de lo indicado de una versión, en texto. */
const enTexto = (v: VersionEnElEje, hoy: string): string => `${v.version}, desde el ${diaYMes(v.desde, hoy)}: ${v.cambio}`;

/** Todos los cambios de lo indicado del eje, en texto: van en el nombre del gráfico, que el lector de pantalla sí oye. */
export const cambiosEnTexto = (versiones: readonly VersionEnElEje[], hoy: string): string[] => versiones.filter((v) => v.cambio && v.conLinea).map((v) => enTexto(v, hoy));

/** Los cambios de lo indicado que no entraron enteros en la línea de su versión: se dicen a la vista, debajo del gráfico. */
export const cambiosQueNoEntran = (versiones: readonly VersionEnElEje[], hoy: string): string[] => versiones.filter((v) => v.cambio && v.conLinea && !v.conCambio).map((v) => enTexto(v, hoy));
