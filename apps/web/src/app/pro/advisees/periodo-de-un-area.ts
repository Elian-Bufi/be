/**
 * El período de los registros de un área, en la dirección de la página (WP-ESCRITORIO-AREAS, F-17): un atajo
 * (`p=7|30|90`) o un rango propio (`desde` y `hasta`). Lo usan Registros de Nutrición y de Entrenamiento, con el control
 * de período de la ficha (`ControlDePeriodo`).
 *
 * El tope es el del contexto de una revisión, que es la lectura de las dos secciones: 92 días, contando los dos
 * extremos. Sin nada en la dirección, el período lo propone la API (los últimos siete días) y la pantalla dice cuál es.
 */
import type { PeriodoDelControl } from './control-de-periodo';
import { diasEntre, PRESETS_DE_PERIODO, restarDias } from './seguimiento/estado';

export const MAXIMO_DE_DIAS_DE_UN_AREA = 92;
export const ATAJOS_DE_UN_AREA = PRESETS_DE_PERIODO.filter((p): p is (typeof PRESETS_DE_PERIODO)[number] & { dias: 7 | 30 | 90 } => p.dias <= MAXIMO_DE_DIAS_DE_UN_AREA);
export type DiasDeAtajoDeUnArea = (typeof ATAJOS_DE_UN_AREA)[number]['dias'];
export type PeriodoDeUnArea = PeriodoDelControl<DiasDeAtajoDeUnArea>;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** El período pedido en la dirección, o `null` si no hay ninguno (o no es válido: se descarta entero). */
export function periodoPedidoEnUnArea(parametros: { get(clave: string): string | null }, hoy: string): PeriodoDeUnArea | null {
  const desde = parametros.get('desde');
  const hasta = parametros.get('hasta');
  if (desde && hasta && FECHA.test(desde) && FECHA.test(hasta) && desde <= hasta && diasEntre(desde, hasta) <= MAXIMO_DE_DIAS_DE_UN_AREA) return { preset: null, desde, hasta };
  const atajo = ATAJOS_DE_UN_AREA.find((a) => String(a.dias) === parametros.get('p'));
  return atajo ? { preset: atajo.dias, desde: restarDias(hoy, atajo.dias - 1), hasta: hoy } : null;
}

/** El atajo que coincide con un período, si termina hoy y dura lo que dura un atajo: para marcarlo en el control. */
export function atajoDeUnPeriodo(desde: string, hasta: string, hoy: string): DiasDeAtajoDeUnArea | null {
  if (hasta !== hoy) return null;
  return ATAJOS_DE_UN_AREA.find((a) => a.dias === diasEntre(desde, hasta))?.dias ?? null;
}

/** El período que se está viendo, para el control: el pedido o, si no hay, el que propuso la API. */
export function periodoALaVista(pedido: PeriodoDeUnArea | null, propuesto: { start: string; end: string } | null, hoy: string): PeriodoDeUnArea | null {
  return pedido ?? (propuesto ? { preset: atajoDeUnPeriodo(propuesto.start, propuesto.end, hoy), desde: propuesto.start, hasta: propuesto.end } : null);
}

/** Lo que cambia en la dirección al elegir un período en el control. */
export const cambiosDePeriodo = (p: PeriodoDeUnArea): Record<string, string | null> => ({ p: p.preset ? String(p.preset) : null, desde: p.preset ? null : p.desde, hasta: p.preset ? null : p.hasta });
