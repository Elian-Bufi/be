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
import { epley, estimacionConLaDecima, RIR_MAXIMO_DE_LA_ESTIMACION, TOPE_DE_LA_ESTIMACION, TOPE_DEL_NUCLEO, type EntradasDeLaEstimacion, type UnidadDeLaCarga } from './estimacion-de-fuerza';
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
 * La referencia del % RM que se escribe en el plan (RM-40): «1RM estimado · Epley · 11/11/2026». El método y la
 * fecha civil de la estimación, nunca el valor. Hasta el 28/11/2026 se escribía «Epley v1»: los planes guardados antes
 * la conservan, y {@link esLaReferenciaDeLaEstimacion} la sigue reconociendo.
 */
export function referenciaDeLaEstimacion(fechaCivil: string): string {
  const [anio, mes, dia] = fechaCivil.split('-');
  return `1RM estimado · Epley · ${dia}/${mes}/${anio}`;
}

/**
 * Si la referencia guardada en el plan es la de la estimación de esa fecha civil: la de hoy («Epley») o la que se
 * escribía antes («Epley v1»), que nombran la misma cuenta.
 */
export function esLaReferenciaDeLaEstimacion(descripcion: string, fechaCivil: string): boolean {
  const actual = referenciaDeLaEstimacion(fechaCivil);
  return descripcion === actual || descripcion === actual.replace(' · Epley · ', ' · Epley v1 · ');
}

// ─── DL-196 parte B (E7, E18; EE-D36) · la carga para N repeticiones a un esfuerzo dado ──────────────────────────────

export type CargaParaRepeticiones =
  | {
      readonly hay: true;
      /** La carga redondeada hacia abajo al paso, en la unidad de la estimación. */
      readonly carga: number;
      readonly unidad: UnidadDeLaCarga;
      readonly repeticionesEquivalentes: number;
      /** Más de 10 repeticiones equivalentes (hasta 12): la banda orientativa del método. */
      readonly orientativa: boolean;
      /** «≈ 100,0 kg × 30 ÷ (30 + 8 + 2) = 75,0 kg → 75 kg». */
      readonly cuenta: string;
    }
  | { readonly hay: false; readonly motivo: 'FUERA_DE_LOS_LIMITES' | 'DATOS_INVALIDOS' };

/**
 * La carga con la que, según la estimación de Epley v1, se harían `repeticiones` dejando `rir` en reserva: la cuenta del
 * método al revés, con las repeticiones equivalentes (repeticiones + RIR). Respeta los límites ratificados del método
 * (DL-171): RIR de 0 a 2 y hasta 12 repeticiones equivalentes; de más de 10 a 12, orientativa. Se redondea hacia abajo al
 * paso: nunca más de lo que dice la cuenta. Fuera de los límites o con datos que no tienen sentido, no hay carga: se dice
 * por qué.
 */
export function cargaParaRepeticiones(estimacion: number, unidad: UnidadDeLaCarga, repeticiones: number, rir: number, paso: number = PASOS_DEL_REDONDEO[unidad][0]!): CargaParaRepeticiones {
  if (!Number.isFinite(estimacion) || estimacion <= 0 || !Number.isInteger(repeticiones) || repeticiones < 1 || !Number.isFinite(rir) || rir < 0 || !(paso > 0)) {
    return { hay: false, motivo: 'DATOS_INVALIDOS' };
  }
  // DL-171 (R3): con un RIR mayor que 2 el método no estima, así que tampoco se usa al revés.
  if (rir > RIR_MAXIMO_DE_LA_ESTIMACION) return { hay: false, motivo: 'FUERA_DE_LOS_LIMITES' };
  const equivalentes = repeticiones + rir;
  if (equivalentes > TOPE_DE_LA_ESTIMACION) return { hay: false, motivo: 'FUERA_DE_LOS_LIMITES' };
  const bruta = equivalentes === 1 ? estimacion : (estimacion * 30) / (30 + equivalentes);
  const carga = Number((Math.floor(bruta / paso + MARGEN) * paso).toFixed(2));
  if (carga <= 0) return { hay: false, motivo: 'DATOS_INVALIDOS' };
  const u = unidad;
  const cuenta =
    equivalentes === 1
      ? `≈ ${numero(estimacion, 1)} ${u} con 1 repetición equivalente → ${numero(carga, 2)} ${u}`
      : `≈ ${numero(estimacion, 1)} ${u} × 30 ÷ (30 + ${numero(repeticiones, 0)} + ${numero(rir, 1)}) = ${numero(Math.floor(bruta * 10 + MARGEN) / 10, 1)} ${u} → ${numero(carga, 2)} ${u}`;
  return { hay: true, carga, unidad: u, repeticionesEquivalentes: equivalentes, orientativa: equivalentes > TOPE_DEL_NUCLEO, cuenta };
}
