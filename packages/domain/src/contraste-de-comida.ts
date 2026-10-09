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

// ─── Modo de registro y diferencia comprobada (pasada del 2026-10-09) ───────────────────────────

/**
 * Cómo registró la persona las cantidades: es el modo, no una diferencia con el plan. Unas cantidades informadas a mano
 * pueden coincidir con lo indicado.
 */
export type ModoDeRegistro = 'PORCIONES_DEL_PLAN' | 'INFORMADAS' | 'SIN_CONFIRMAR' | 'COMIDA_DIFERENTE' | 'SIN_OPCION';

/**
 * Lo que BE comprueba al comparar, ingrediente por ingrediente, lo registrado con la opción indicada. Solo se comparan
 * cantidades informadas: las porciones del plan confirmadas son las del plan; sin confirmar no hay qué comparar; una
 * comida diferente queda fuera de lo indicado.
 */
export type FrenteALoIndicado = 'DIFERENCIA_COMPROBADA' | 'IGUAL' | 'IGUAL_EN_LO_COMPARABLE' | 'SIN_COMPARABLES' | 'LAS_DEL_PLAN' | 'NO_SE_COMPRUEBA';

export interface ComidaFrenteALoIndicado {
  readonly modo: ModoDeRegistro;
  readonly resultado: FrenteALoIndicado;
  /** Los ingredientes de la opción elegida. */
  readonly ingredientes: number;
  /** Con una cantidad distinta de la indicada, o que no comió. */
  readonly distintos: number;
  /** Sin cantidad informada, sin cantidad indicada o en otra unidad: no se comparan. */
  readonly sinComparar: number;
}

/** El modo y el resultado de la comparación de un registro de comida, con el mismo contraste que se abre al costado. */
export function comidaFrenteALoIndicado(r: Pick<RegistroDeComida, 'kind' | 'option' | 'consumption' | 'description'>): ComidaFrenteALoIndicado {
  const c = contrasteDeLaComida(r);
  if (c.tipo === 'FUERA_DE_LO_INDICADO') return { modo: 'COMIDA_DIFERENTE', resultado: 'NO_SE_COMPRUEBA', ingredientes: 0, distintos: 0, sinComparar: 0 };
  if (c.tipo === 'SIN_OPCION') return { modo: 'SIN_OPCION', resultado: 'NO_SE_COMPRUEBA', ingredientes: 0, distintos: 0, sinComparar: 0 };
  const ingredientes = c.filas.length;
  if (c.cantidades === 'UNCONFIRMED') return { modo: 'SIN_CONFIRMAR', resultado: 'NO_SE_COMPRUEBA', ingredientes, distintos: 0, sinComparar: ingredientes };
  if (c.cantidades === 'PLAN_PORTIONS') return { modo: 'PORCIONES_DEL_PLAN', resultado: 'LAS_DEL_PLAN', ingredientes, distintos: 0, sinComparar: 0 };
  const distintos = c.filas.filter((f) => f.estado === 'DISTINTO' || f.estado === 'NO_LO_COMIO').length;
  const iguales = c.filas.filter((f) => f.estado === 'IGUAL').length;
  const sinComparar = ingredientes - distintos - iguales;
  const resultado: FrenteALoIndicado = distintos > 0 ? 'DIFERENCIA_COMPROBADA' : iguales === 0 ? 'SIN_COMPARABLES' : sinComparar > 0 ? 'IGUAL_EN_LO_COMPARABLE' : 'IGUAL';
  return { modo: 'INFORMADAS', resultado, ingredientes, distintos, sinComparar };
}

/** El modo de registro en palabras: cómo se registró, sin decir si difiere. */
export const TEXTO_DEL_MODO_DE_REGISTRO: Readonly<Record<ModoDeRegistro, string>> = {
  PORCIONES_DEL_PLAN: 'Confirmó las porciones del plan',
  INFORMADAS: 'Informó las cantidades a mano',
  SIN_CONFIRMAR: 'Sin confirmar las cantidades',
  COMIDA_DIFERENTE: 'Una comida diferente',
  SIN_OPCION: 'Sin una opción del plan',
};

const contarIngredientes = (n: number): string => `${numero(n)} ${n === 1 ? 'ingrediente' : 'ingredientes'}`;

/** El resultado de la comparación en palabras: un hecho, nunca un juicio. */
export function frenteALoIndicadoEnPalabras(c: ComidaFrenteALoIndicado): string {
  switch (c.resultado) {
    case 'DIFERENCIA_COMPROBADA':
      return `Distinta de lo indicado en ${numero(c.distintos)} de ${contarIngredientes(c.ingredientes)}`;
    case 'IGUAL':
      return 'Igual a lo indicado';
    case 'IGUAL_EN_LO_COMPARABLE':
      return `Igual en lo que se puede comparar; ${contarIngredientes(c.sinComparar)} sin comparar`;
    case 'SIN_COMPARABLES':
      return 'No se puede comparar: ningún ingrediente tiene cantidades comparables';
    case 'LAS_DEL_PLAN':
      return 'Sin diferencia: son las porciones del plan';
    case 'NO_SE_COMPRUEBA':
      return c.modo === 'COMIDA_DIFERENTE' ? 'No se compara: fuera de lo indicado' : c.modo === 'SIN_CONFIRMAR' ? 'No se puede comprobar: sin confirmar' : 'No se compara: sin una opción del plan';
  }
}
