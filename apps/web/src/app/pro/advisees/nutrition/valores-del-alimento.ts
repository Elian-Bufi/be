/**
 * WP-NUTRICION-ALIMENTOS (DL-180) · lo que se escribe en el formulario de un alimento cargado a mano y cómo se lee, sin
 * React (lo usa `formulario-del-alimento.tsx`): los valores obligatorios cada 100 g, la fibra opcional (vacía es «sin
 * dato», nunca cero) y el grupo. Y lo que decidió Administración sobre uno propio, en una línea («Mis alimentos»).
 */
import { COPY_MIS_ALIMENTOS, leerNumero, motivoDeNumeroIlegible, type AlimentoPropio, type Composicion, type GrupoDeAlimento } from '@be/domain';

/** Lo escrito en el formulario, como texto. */
export interface AlimentoEscrito {
  readonly nombre: string;
  readonly kcal: string;
  readonly c: string;
  readonly g: string;
  readonly p: string;
  readonly fibra: string;
  readonly grupo: GrupoDeAlimento | '';
}

export const ALIMENTO_EN_BLANCO: AlimentoEscrito = { nombre: '', kcal: '', c: '', g: '', p: '', fibra: '', grupo: '' };

const numeroEnTexto = (n: number | null | undefined): string => (n === null || n === undefined ? '' : String(n).replace('.', ','));

/** Lo que ya tiene un alimento, para corregirlo. */
export function alimentoEscrito(a: { readonly name: string; readonly composition: Composicion; readonly foodGroup: GrupoDeAlimento | null }): AlimentoEscrito {
  const c = a.composition;
  return { nombre: a.name, kcal: numeroEnTexto(c.energyKcal), c: numeroEnTexto(c.carbohydrateG), g: numeroEnTexto(c.fatG), p: numeroEnTexto(c.proteinG), fibra: numeroEnTexto(c.fiberG), grupo: a.foodGroup ?? '' };
}

/**
 * Los valores para la API, o lo que falta por campo. La fibra vacía no se manda (sin dato, nunca cero); los demás valores
 * son obligatorios y no pueden ser menores que cero. La base es siempre cada 100 g, como la carga a mano de siempre.
 */
export function valoresDelAlimento(
  e: AlimentoEscrito,
  referencia: '100g' | '100ml' = '100g',
): { readonly tipo: 'faltan'; readonly problemas: Readonly<Record<string, string>> } | { readonly tipo: 'listo'; readonly nombre: string; readonly composicion: Composicion; readonly grupo: GrupoDeAlimento | null } {
  const problemas: Record<string, string> = {};
  if (!e.nombre.trim()) problemas['nombre'] = 'Falta el nombre del alimento.';
  const valores: Record<string, number> = {};
  for (const [clave, texto] of [
    ['kcal', e.kcal],
    ['c', e.c],
    ['g', e.g],
    ['p', e.p],
  ] as const) {
    const n = leerNumero(texto);
    if (n === null) problemas[clave] = texto.trim() === '' ? 'Falta el valor cada 100 g.' : motivoDeNumeroIlegible(texto);
    else if (n < 0) problemas[clave] = 'El valor no puede ser menor que cero.';
    else valores[clave] = n;
  }
  let fibra: number | null = null;
  if (e.fibra.trim() !== '') {
    const n = leerNumero(e.fibra);
    if (n === null) problemas['fibra'] = motivoDeNumeroIlegible(e.fibra);
    else if (n < 0) problemas['fibra'] = 'El valor no puede ser menor que cero.';
    else fibra = n;
  }
  if (Object.keys(problemas).length > 0) return { tipo: 'faltan', problemas };
  return {
    tipo: 'listo',
    nombre: e.nombre.trim(),
    composicion: { referenceAmount: referencia, energyKcal: valores['kcal']!, proteinG: valores['p']!, carbohydrateG: valores['c']!, fatG: valores['g']!, ...(fibra === null ? {} : { fiberG: fibra }) },
    grupo: e.grupo || null,
  };
}

/** Lo que decidió Administración sobre la versión vigente de uno propio, en una línea. */
export function revisionEnPalabras(a: Pick<AlimentoPropio, 'review'>): string {
  if (a.review.state === 'CERTIFIED' && a.review.certification) return COPY_MIS_ALIMENTOS.verificado(a.review.certification.source);
  if (a.review.state === 'EQUIVALENT' && a.review.equivalent) return COPY_MIS_ALIMENTOS.equivalente(a.review.equivalent.name);
  return COPY_MIS_ALIMENTOS.sinRevisar;
}
