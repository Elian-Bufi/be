/**
 * ED-76 (WP-EDITORES-PROFESIONAL §5.8; DL-171) · Usar la estimación para planificar: del % RM a los kilos. La fuente (c)
 * de Dirección: el profesional elige una estimación, escribe un % RM y BE sugiere la carga, con el redondeo a la vista,
 * que él confirma. Nunca hay carga automática: esta función solo hace la cuenta; escribir es de quien la llama, con el
 * clic del profesional.
 *
 * - **El redondeo (ED-D17):** al múltiplo elegido (2,5 kg de entrada; 1 y 0,5 kg; 5 y 2,5 lb), hacia abajo: nunca más
 *   que el % pedido. «Al más cercano» queda como opción a la vista.
 * - **Sin convertir unidades (RM-39):** una estimación en lb da una carga en lb.
 * - **La referencia que se escribe (RM-40; B10-06:426-431):** el método y la fecha de la estimación, nunca su valor,
 *   porque el plan viaja a otras áreas (RES-06).
 *
 * Sin React ni base: la usan el cuadro del website y sus pruebas.
 */
import { epley, estimacionConLaDecima, type EntradasDeLaEstimacion, type UnidadDeLaCarga } from './estimacion-de-fuerza';
import { numero } from './formato-numeros';

/** Los pasos del redondeo por unidad; el primero es el de entrada. */
export const PASOS_DEL_REDONDEO: Readonly<Record<UnidadDeLaCarga, readonly number[]>> = { kg: [2.5, 1, 0.5], lb: [5, 2.5] };

export type SentidoDelRedondeo = 'ABAJO' | 'CERCANO';
export const SENTIDO_DEL_REDONDEO: Readonly<Record<SentidoDelRedondeo, string>> = { ABAJO: 'hacia abajo', CERCANO: 'al más cercano' };

export interface CargaDesdeLaEstimacion {
  /** El % RM de la estimación, sin redondear. */
  readonly bruta: number;
  /** La carga redondeada al paso, en la unidad de la estimación. */
  readonly sugerida: number;
  readonly unidad: UnidadDeLaCarga;
  /** «75 % RM de 98,0 kg = 73,5 kg → 72,5 kg». */
  readonly cuenta: string;
  /** «Múltiplo de 2,5, hacia abajo: nunca más que el % RM pedido.» */
  readonly redondeo: string;
}

/** Cuántos pasos entran, con un margen para el binario: 0,29 × 100 da 28,999…, que son 29 y no 28. */
const MARGEN = 1e-9;

/**
 * La carga a partir de una estimación y un % RM. `null` si el % no tiene sentido (hasta 0, más de 100 o ilegible) o si
 * el paso no es uno de los de la unidad: el cuadro lo dice y no escribe nada.
 */
export function cargaDesdeLaEstimacion(
  estimacion: EntradasDeLaEstimacion,
  porcentaje: number,
  paso: number = PASOS_DEL_REDONDEO[estimacion.unidad][0]!,
  sentido: SentidoDelRedondeo = 'ABAJO',
): CargaDesdeLaEstimacion | null {
  if (!Number.isFinite(porcentaje) || porcentaje <= 0 || porcentaje > 100) return null;
  if (!PASOS_DEL_REDONDEO[estimacion.unidad].includes(paso)) return null;
  // La cuenta usa el valor con todos sus decimales; la vista, la décima.
  const valor = epley(estimacion.carga, estimacion.repeticiones + estimacion.rir);
  const bruta = (valor * porcentaje) / 100;
  const pasos = sentido === 'ABAJO' ? Math.floor(bruta / paso + MARGEN) : Math.round(bruta / paso);
  const sugerida = Number((pasos * paso).toFixed(2));
  if (sugerida <= 0) return null;
  const u = estimacion.unidad;
  // Hacia abajo, el bruto se muestra truncado a la décima: redondeado, 87,47 se leería 87,5, un múltiplo del paso que
  // después «baja» a 85. Truncado («87,4 kg → 85 kg») la cuenta a la vista dice lo mismo que la que se hace.
  const brutaALaVista = sentido === 'ABAJO' ? Math.floor(bruta * 10 + MARGEN) / 10 : bruta;
  return {
    bruta,
    sugerida,
    unidad: u,
    cuenta: `${numero(porcentaje, 2)} % RM de ${estimacionConLaDecima(estimacion)} = ${numero(brutaALaVista, 1)} ${u} → ${numero(sugerida, 2)} ${u}`,
    redondeo: `Múltiplo de ${numero(paso, 1)}, ${SENTIDO_DEL_REDONDEO[sentido]}${sentido === 'ABAJO' ? ': nunca más que el % RM pedido.' : '.'}`,
  };
}

/**
 * La referencia del % RM que se escribe en el plan (RM-40): «1RM estimado · Epley v1 · 11/11/2026». El método y la
 * fecha civil de la estimación, nunca el valor.
 */
export function referenciaDeLaEstimacion(fechaCivil: string): string {
  const [anio, mes, dia] = fechaCivil.split('-');
  return `1RM estimado · Epley v1 · ${dia}/${mes}/${anio}`;
}
