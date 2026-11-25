/**
 * DL-197 (ET1-D10) · la intensidad del plan, elegida una vez: cómo se lee de lo guardado y cómo se guarda. Lo guardado no
 * cambia de modelo: RIR y RPE son la misma medida (DL-192) y cada ejercicio sigue guardando su criterio.
 */
import type { IntensidadDelPlan, NotacionDelEsfuerzo, PlanificacionDelPlan } from '@be/domain';

/** Las cuatro formas de la intensidad del plan, como se eligen en pantalla (ET1-D10). */
export type IntensidadElegida = 'RIR' | 'RPE' | 'PERCENT_RM' | 'NONE';
export const INTENSIDADES: readonly IntensidadElegida[] = ['RIR', 'RPE', 'PERCENT_RM', 'NONE'];

/** La intensidad elegida en pantalla, de lo guardado: % RM y «Solo carga» en la planificación; RIR o RPE, la notación. */
export const intensidadElegida = (p: PlanificacionDelPlan, notacion: NotacionDelEsfuerzo): IntensidadElegida =>
  p.intensity === 'PERCENT_RM' ? 'PERCENT_RM' : p.intensity === 'NONE' ? 'NONE' : notacion;

/** Lo que se guarda de una intensidad elegida: la de la planificación y la notación del esfuerzo (DL-192). */
export const guardadoDeLaIntensidad = (i: IntensidadElegida, notacionAntes: NotacionDelEsfuerzo): { readonly intensity: IntensidadDelPlan; readonly notacion: NotacionDelEsfuerzo } =>
  i === 'RIR' || i === 'RPE' ? { intensity: 'RIR', notacion: i } : { intensity: i, notacion: notacionAntes };

/** El criterio que toma un ejercicio con esta intensidad: `RIR`, `PERCENT_RM` o ninguno. */
export const criterioDeLaIntensidad = (i: IntensidadDelPlan | undefined): 'RIR' | 'PERCENT_RM' | null => (i === 'PERCENT_RM' ? 'PERCENT_RM' : i === 'NONE' ? null : 'RIR');

