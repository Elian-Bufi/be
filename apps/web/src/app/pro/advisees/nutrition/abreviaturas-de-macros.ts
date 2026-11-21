/**
 * RP-07 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · Ícono, número y abreviatura, sin React. En las vistas de Nutrición de /pro,
 * cada cantidad de kcal o de macros se escribe igual: el ícono del macro (el de «Objetivo del día»), el número y la
 * abreviatura —«2.500 kcal», «112 g P», «335 g C», «80 g G»—. El nombre accesible dice la palabra completa: «112 gramos
 * de proteínas». La pieza que lo dibuja es `cantidad-del-macro.tsx`.
 */
import { numero, type NombreDeIcono } from '@be/domain';

/** Las cantidades que llevan ícono: la energía y los tres macros. */
export type MacroConIcono = 'kcal' | 'protein' | 'carbohydrate' | 'fat';

/** Los íconos de la tira «Objetivo del día»: el rayo de las calorías y el de cada macro. */
export const ICONO_DEL_MACRO: Readonly<Record<MacroConIcono, NombreDeIcono>> = { kcal: 'calorias', protein: 'proteinas', carbohydrate: 'carbohidratos', fat: 'grasas' };

export const ABREVIATURA_DEL_MACRO: Readonly<Record<MacroConIcono, string>> = { kcal: 'kcal', protein: 'g P', carbohydrate: 'g C', fat: 'g G' };

const EN_PALABRAS: Readonly<Record<MacroConIcono, string>> = { kcal: 'kilocalorías', protein: 'gramos de proteínas', carbohydrate: 'gramos de carbohidratos', fat: 'gramos de grasas' };

/** Cada nutriente de «Rangos y totales» con su macro. */
export const MACRO_DEL_NUTRIENTE = { energyKcal: 'kcal', proteinG: 'protein', carbohydrateG: 'carbohydrate', fatG: 'fat' } as const satisfies Readonly<Record<string, MacroConIcono>>;

/** Los límites de un rango indicado, sin la unidad: «125 a 156», «desde 30», «hasta 40», «30». */
export function cifraDeLosLimites(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return min === max ? numero(min) : `${numero(min)} a ${numero(max)}`;
  if (min !== null) return `desde ${numero(min)}`;
  return `hasta ${numero(max as number)}`;
}

/** Lo que se ve: «112 g P», «110 a 134 g P», «2.500 kcal». `cifra` ya viene escrita («112», «110 a 134», «desde 30»). */
export const cantidadAbreviada = (macro: MacroConIcono, cifra: string): string => `${cifra} ${ABREVIATURA_DEL_MACRO[macro]}`;

/** Lo que lee el lector de pantalla: «112 gramos de proteínas», «2.500 kilocalorías». */
export const cantidadEnPalabras = (macro: MacroConIcono, cifra: string): string => `${cifra} ${EN_PALABRAS[macro]}`;
