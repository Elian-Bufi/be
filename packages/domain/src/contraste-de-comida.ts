/**
 * «¿Lo registrado coincide con lo indicado?» en Nutrición (encargo del 2026-10-09, eje 2): un registro de comida frente a
 * la opción del plan que la persona eligió, ingrediente por ingrediente.
 *
 * - **Lo indicado es la opción registrada, tal como estaba en su versión del plan** (`registro.option`): si la receta
 *   cambió después, esto no cambia.
 * - **Sin confirmar sigue sin confirmar:** no se completa con las porciones del plan.
 * - **Una comida diferente queda fuera de lo indicado:** no se compara con ninguna opción.
 * - **No hay porcentaje global ni se suman alternativas:** cada fila es un ingrediente de la opción elegida, y la
 *   diferencia es una resta con signo en la misma unidad, nunca un juicio.
 */
import type { RegistroDeComida } from './contratos-registro-de-comidas';
import { numero } from './formato-numeros';

const UNIDAD: Readonly<Record<'g' | 'ml' | 'unit', readonly [string, string]>> = { g: ['g', 'g'], ml: ['ml', 'ml'], unit: ['unidad', 'unidades'] };
const conUnidad = (q: { value: number; unit: 'g' | 'ml' | 'unit' }): string => `${numero(q.value)} ${UNIDAD[q.unit][q.value === 1 ? 0 : 1]}`;

export type EstadoDeLaFila = 'IGUAL' | 'DISTINTO' | 'SIN_CONFIRMAR' | 'PORCIONES_DEL_PLAN' | 'NO_LO_COMIO' | 'SIN_CANTIDAD' | 'SIN_INDICACION' | 'OTRA_UNIDAD';

export interface FilaDeContraste {
  readonly itemId: string;
  readonly nombre: string;
  /** La porción indicada en la opción, o «sin cantidad indicada». */
  readonly indicado: string;
  /** Lo registrado para ese ingrediente, dicho como es. */
  readonly registrado: string;
  /** La resta registrado − indicado, en la misma unidad; `null` si no corresponde. */
  readonly diferencia: string | null;
  readonly estado: EstadoDeLaFila;
}

export type ContrasteDeComida =
  | { readonly tipo: 'FUERA_DE_LO_INDICADO'; readonly descripcion: string | null }
  | { readonly tipo: 'SIN_OPCION' }
  | { readonly tipo: 'CON_LA_OPCION'; readonly opcion: string; readonly cantidades: 'UNCONFIRMED' | 'PLAN_PORTIONS' | 'REPORTED'; readonly filas: readonly FilaDeContraste[] };

/** El contraste de un registro con la opción indicada. Un registro anulado se contrasta igual: queda en el historial. */
export function contrasteDeLaComida(r: Pick<RegistroDeComida, 'kind' | 'option' | 'consumption' | 'description'>): ContrasteDeComida {
  if (r.kind === 'DIFFERENT') return { tipo: 'FUERA_DE_LO_INDICADO', descripcion: r.description };
  if (!r.option) return { tipo: 'SIN_OPCION' };
  const estado = r.consumption?.status ?? 'UNCONFIRMED';
  const informados = new Map((r.consumption?.items ?? []).map((i) => [i.itemId, i] as const));
  const filas = r.option.items.map((item): FilaDeContraste => {
    const indicado = item.quantity ? conUnidad(item.quantity) : 'sin cantidad indicada';
    const base = { itemId: item.itemId, nombre: item.name, indicado };
    if (estado === 'UNCONFIRMED') return { ...base, registrado: 'sin confirmar', diferencia: null, estado: 'SIN_CONFIRMAR' };
    if (estado === 'PLAN_PORTIONS') return { ...base, registrado: 'las porciones del plan, confirmadas', diferencia: null, estado: 'PORCIONES_DEL_PLAN' };
    const informado = informados.get(item.itemId);
    if (informado?.notEaten) return { ...base, registrado: 'no lo comió', diferencia: null, estado: 'NO_LO_COMIO' };
    if (!informado?.quantity) return { ...base, registrado: 'sin cantidad', diferencia: null, estado: 'SIN_CANTIDAD' };
    const q = informado.quantity;
    if (!item.quantity) return { ...base, registrado: conUnidad(q), diferencia: null, estado: 'SIN_INDICACION' };
    if (item.quantity.unit !== q.unit) return { ...base, registrado: conUnidad(q), diferencia: null, estado: 'OTRA_UNIDAD' };
    const resta = Math.round((q.value - item.quantity.value) * 100) / 100;
    if (resta === 0) return { ...base, registrado: conUnidad(q), diferencia: null, estado: 'IGUAL' };
    return { ...base, registrado: conUnidad(q), diferencia: `${resta > 0 ? '+' : '−'}${conUnidad({ value: Math.abs(resta), unit: q.unit })}`, estado: 'DISTINTO' };
  });
  return { tipo: 'CON_LA_OPCION', opcion: r.option.label, cantidades: estado, filas };
}

/** La fila en una línea: «Arroz: indicado 120 g · registrado 100 g (−20 g)». */
export function filaEnPalabras(f: FilaDeContraste): string {
  return `${f.nombre}: indicado ${f.indicado} · registrado ${f.registrado}${f.diferencia ? ` (${f.diferencia})` : ''}${f.estado === 'OTRA_UNIDAD' ? ' (otra unidad: no se resta)' : ''}`;
}
