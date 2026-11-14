/**
 * El período del historial del cuadro del ejercicio y los enlaces a «Analizar» (WP-GRAFICOS fase 2, rama B; DL-174).
 *
 * - **El período** (GR-T31): 12 semanas, 6 meses o desde que la acompañás. Cada lectura abarca hasta un año (API-PRJ-01
 *   acepta 366 días): «desde que la acompañás» arranca el día del vínculo si fue en el último año; si fue antes, en el
 *   último año, y la pantalla lo dice. Lo anterior al vínculo no se dibuja (TB-16, `desdeElVinculo`).
 * - **«Abrir en Analizar»**: con el ejercicio, la serie, la unidad y el período ya elegidos.
 *
 * Es puro: lo prueba `apps/web/test/graficos-entrenamiento.test.mjs`.
 */
import { inicioDelEje, type PeriodoDelGrafico } from '../eje-de-fechas';
import type { OpcionDePeriodo } from './copy';

export const OPCIONES_DE_PERIODO: readonly OpcionDePeriodo[] = ['DOCE_SEMANAS', 'SEIS_MESES', 'DESDE_EL_VINCULO'];

/** Los días de cada opción, con hoy. «Desde que la acompañás» tiene como tope un año: 365 días con hoy. */
export const DIAS_DE_LA_OPCION: Readonly<Record<OpcionDePeriodo, number>> = { DOCE_SEMANAS: 84, SEIS_MESES: 182, DESDE_EL_VINCULO: 365 };

const restar = (fecha: string, dias: number): string => new Date(Date.parse(`${fecha}T12:00:00Z`) - dias * 86_400_000).toISOString().slice(0, 10);

/**
 * El período de una opción. `inicioDelVinculo`: el día en que empezó el acompañamiento, si se sabe. `recortado`: «desde
 * que la acompañás» con un acompañamiento de más de un año (o sin saber desde cuándo): se ve el último año.
 */
export function periodoDelHistorial(opcion: OpcionDePeriodo, hoy: string, inicioDelVinculo: string | null): PeriodoDelGrafico & { readonly recortado: boolean } {
  const desde = restar(hoy, DIAS_DE_LA_OPCION[opcion] - 1);
  if (opcion !== 'DESDE_EL_VINCULO') return { desde, hasta: hoy, hoy, desdeElVinculo: inicioDelVinculo, recortado: false };
  const dentro = inicioDelVinculo !== null && inicioDelVinculo >= desde;
  return { desde: dentro ? (inicioDelVinculo > hoy ? hoy : inicioDelVinculo) : desde, hasta: hoy, hoy, desdeElVinculo: inicioDelVinculo, recortado: !dentro };
}

/** «Abrir en Analizar» con lo elegido: `parametros` son los de la pregunta (`pregunta`, `ejercicio`, `serie`…). */
export function haciaAnalizar(asesoradoId: string, parametros: Readonly<Record<string, string>>, periodo: PeriodoDelGrafico): string {
  const p = new URLSearchParams({ id: asesoradoId, vista: 'analizar', ...parametros, desde: inicioDelEje(periodo), hasta: periodo.hasta });
  return `/pro/advisees?${p.toString()}`;
}

/** GR-02 en «Analizar»: la evolución de la fuerza estimada del ejercicio, en su unidad (ED-74). */
export const haciaLaFuerzaEnAnalizar = (asesoradoId: string, exerciseId: string, unidad: 'kg' | 'lb', orientativas: boolean, periodo: PeriodoDelGrafico): string =>
  haciaAnalizar(asesoradoId, { pregunta: 'fuerza-estimada', ejercicio: exerciseId, unidad, ...(orientativas ? { orientativas: '1' } : {}) }, periodo);

/** GR-03 en «Analizar»: la pregunta por un ejercicio (carga, repeticiones y RIR de una serie), con la serie y la unidad. */
export const haciaElProgresoEnAnalizar = (asesoradoId: string, exerciseKey: string, serie: number, unidad: 'kg' | 'lb' | null, periodo: PeriodoDelGrafico): string =>
  haciaAnalizar(asesoradoId, { pregunta: 'progreso-de-un-ejercicio', ejercicio: exerciseKey, serie: String(serie), ...(unidad ? { unidad } : {}) }, periodo);

/** GR-05 en «Analizar»: «¿Lo registrado coincide con lo indicado?», en Entrenamiento y con el ejercicio. */
export const haciaLoIndicadoEnAnalizar = (asesoradoId: string, exerciseKey: string, periodo: PeriodoDelGrafico): string =>
  haciaAnalizar(asesoradoId, { pregunta: 'registrado-vs-indicado', area: 'ENTRENAMIENTO', ejercicio: exerciseKey }, periodo);
