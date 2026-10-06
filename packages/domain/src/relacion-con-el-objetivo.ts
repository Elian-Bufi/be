/**
 * La relación de lo realizado en una serie con su objetivo histórico (WP-ENTRENAMIENTO-SERIES; DL-122). Es descriptiva y
 * neutral: «dentro del rango», «por debajo», «por encima». No es un puntaje, una evaluación ni una adherencia:
 * - estar por encima o por debajo del rango no implica éxito ni fracaso;
 * - un dato ausente no es cero, y un cero explícito no se convierte en ausente;
 * - se compara contra la versión histórica de la prescripción, nunca contra el plan de hoy;
 * - solo se compara lo comparable: unidades distintas no se convierten.
 * El oráculo de sus pruebas es `datos/casos_series.json` del paquete de Dirección del 2026-10-06.
 */

export type RelacionConElObjetivo = 'DENTRO' | 'DEBAJO' | 'ENCIMA' | 'IGUAL' | 'SIN_DATO' | 'SIN_OBJETIVO' | 'UNIDADES_INCOMPATIBLES' | 'INVALIDO';

/** Los límites del RIR que informa el asesorado, los del contrato vigente (WP-06): de 0 a 20, con decimales. */
export const RIR_MINIMO = 0;
export const RIR_MAXIMO = 20;

/** Las repeticiones objetivo de una serie: un valor exacto o un rango inclusivo. */
export type RepeticionesObjetivo = { readonly value: number } | { readonly min: number; readonly max: number };

/** Lo realizado frente al objetivo de repeticiones. Los rangos son inclusivos; un rango invertido no se compara. */
export function relacionDeRepeticiones(objetivo: RepeticionesObjetivo | null, realizado: number | null): RelacionConElObjetivo {
  if (objetivo && 'min' in objetivo && objetivo.min > objetivo.max) return 'INVALIDO';
  if (realizado !== null && (!Number.isInteger(realizado) || realizado < 0)) return 'INVALIDO';
  if (!objetivo) return 'SIN_OBJETIVO';
  if (realizado === null) return 'SIN_DATO';
  const [min, max] = 'min' in objetivo ? [objetivo.min, objetivo.max] : [objetivo.value, objetivo.value];
  if (realizado < min) return 'DEBAJO';
  if (realizado > max) return 'ENCIMA';
  return 'DENTRO';
}

/** El RIR informado frente al RIR objetivo. Un RIR fuera de 0 a 20 no se compara, y un 0 informado es un valor válido. */
export function relacionDeRir(objetivo: number | null, realizado: number | null): RelacionConElObjetivo {
  if (realizado !== null && (!Number.isFinite(realizado) || realizado < RIR_MINIMO || realizado > RIR_MAXIMO)) return 'INVALIDO';
  if (objetivo === null) return 'SIN_OBJETIVO';
  if (realizado === null) return 'SIN_DATO';
  if (realizado < objetivo) return 'DEBAJO';
  if (realizado > objetivo) return 'ENCIMA';
  return 'IGUAL';
}

export interface CargaConUnidad {
  readonly value: number;
  readonly unit: string;
}

/** La carga informada frente a la sugerida. Con unidades distintas no se compara: BE no convierte kilos y libras acá. */
export function relacionDeCarga(objetivo: CargaConUnidad | null, realizado: CargaConUnidad | null): RelacionConElObjetivo {
  if (realizado !== null && (!Number.isFinite(realizado.value) || realizado.value < 0)) return 'INVALIDO';
  if (objetivo === null) return 'SIN_OBJETIVO';
  if (realizado === null) return 'SIN_DATO';
  if (objetivo.unit !== realizado.unit) return 'UNIDADES_INCOMPATIBLES';
  if (realizado.value < objetivo.value) return 'DEBAJO';
  if (realizado.value > objetivo.value) return 'ENCIMA';
  return 'IGUAL';
}

/** Lo que la persona escribió en una fila. Los placeholders del plan no son datos: nunca llegan acá. */
export interface FilaInformada {
  readonly carga: CargaConUnidad | null;
  readonly repeticiones: number | null;
  readonly rir: number | null;
}

/** Si la fila tiene al menos un dato realizado. Sin ninguno, «Registrar serie» no guarda nada: no se fabrica una serie. */
export const hayDatosRealizados = (fila: FilaInformada): boolean => fila.carga !== null || fila.repeticiones !== null || fila.rir !== null;
