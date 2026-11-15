/**
 * GR-16 · La diferencia de una medida que ya es un porcentaje, en puntos (WP-GRAFICOS, pasada visual del 15/11;
 * DISENO-VISUAL §2): «−6,1 puntos», «+1 punto», «0 puntos», nunca «−6,1 %», que se leería como un porcentaje del valor.
 * Las demás medidas, con su unidad, como siempre (`diferenciaDeLaFila`). Y la edad al momento de la toma no va en la
 * tabla: no es una medida para restar.
 *
 * Es puro: lo prueba `apps/web/test/graficos-fase-1.test.mjs`.
 */
import { diferenciaDeLaFila, type DiferenciaDesdeOtraToma } from '@be/domain';

export function diferenciaEnPuntos(d: DiferenciaDesdeOtraToma): string {
  const texto = diferenciaDeLaFila(d);
  if (d.unidad !== '%') return texto;
  const sinUnidad = texto.replace(/[\s  ]*%$/, '');
  return `${sinUnidad} ${Math.abs(d.delta) === 1 ? 'punto' : 'puntos'}`;
}

/** Las filas que no van en «Desde el inicio y desde la anterior»: la edad al momento de la toma. */
export const FUERA_DE_LA_TABLA: ReadonlySet<string> = new Set(['edad']);
