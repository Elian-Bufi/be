/**
 * WP-NUTRICION-ALIMENTOS (DL-180) · la lógica de los alimentos del catálogo en el website del profesional, sin React:
 * - **NUA-02:** lo que ya está citado y se retiró se marca «retirado», discreto, y no se esconde;
 * - **NUA-03:** el nivel del origen en la fila del buscador («Verificado» o «Tuyo»; desde el segundo tramo, NUA-D14, lo
 *   cargado a mano es solo de quien lo cargó);
 * - **NUA-04:** el verificado equivalente se sugiere justo antes del alimento que lo tiene;
 * - **NUA-05:** el ícono del grupo, en el buscador y en las opciones.
 * Las pantallas (`cuadro-de-la-opcion.tsx`, `comida-del-editor.tsx`, `/pro/foods`) solo dibujan lo que esto decide.
 */
import {
  cantidadDeLaMedida,
  COPY_ALIMENTOS,
  ETIQUETA_DEL_NIVEL,
  iconoDelAlimento,
  NOMBRE_DE_LA_MEDIDA,
  TipoDeMedidaCaseraSchema,
  type GrupoDeAlimento,
  type MedidaCasera,
  type MedidaElegida,
  type NivelDeOrigen,
  type NombreDeIcono,
} from '@be/domain';
import { createContext, useContext } from 'react';

/** Lo que el editor sabe de un alimento citado, por su identidad: su grupo, si se retiró y sus medidas caseras (NUA-08). */
export interface DatosDelAlimento {
  readonly grupo: GrupoDeAlimento | null;
  readonly retirado: boolean;
  readonly medidas: readonly MedidaCasera[];
}
export const SIN_DATOS_DEL_ALIMENTO: DatosDelAlimento = { grupo: null, retirado: false, medidas: [] };

/** De una fila del buscador o de la consulta por identidad (API-ALI-04): lo que falta vale lo de siempre (sin grupo, no retirado, sin medidas). */
export function datosDelAlimento(
  a: { readonly foodGroup?: GrupoDeAlimento | null | undefined; readonly retired?: boolean | undefined; readonly householdMeasures?: readonly MedidaCasera[] | undefined } | undefined | null,
): DatosDelAlimento {
  return a ? { grupo: a.foodGroup ?? null, retirado: a.retired === true, medidas: a.householdMeasures ?? [] } : SIN_DATOS_DEL_ALIMENTO;
}

// ─── NUA-08 · la cantidad con una medida casera ─────────────────────────────────────────────────────────────

/** Lo que importa de un ítem para su cantidad: la cantidad (siempre en gramos o mililitros con medida) y la medida elegida. */
interface ConCantidad {
  readonly quantity: { readonly value: number; readonly unit: 'g' | 'ml' | 'unit' } | null;
  readonly householdMeasure?: MedidaElegida | null | undefined;
}

const PREFIJO_DE_MEDIDA = 'medida:';

/** El valor del selector de la unidad: «g», «ml», «unit» o la medida elegida («medida:CUP»). */
export function valorDeLaUnidad(it: ConCantidad): string {
  return it.householdMeasure ? `${PREFIJO_DE_MEDIDA}${it.householdMeasure.kind}` : (it.quantity?.unit ?? 'g');
}

/** Las opciones del selector: las tres de siempre y, si el alimento las tiene, sus medidas con su equivalencia. */
export function opcionesDeUnidad(medidas: readonly MedidaCasera[], etiquetas: Readonly<Record<'g' | 'ml' | 'unit', string>>, ml = false): { readonly valor: string; readonly texto: string }[] {
  return [
    ...(['g', 'ml', 'unit'] as const).map((u) => ({ valor: u, texto: etiquetas[u] })),
    ...medidas.map((m) => ({ valor: `${PREFIJO_DE_MEDIDA}${m.kind}`, texto: `${NOMBRE_DE_LA_MEDIDA[m.kind].una} (${String(m.amount).replace('.', ',')} ${ml ? 'ml' : 'g'})` })),
  ];
}

/**
 * Lo que cambia al elegir otra unidad. Una medida empieza con 1 (su equivalencia) y guarda la equivalencia de ese momento;
 * volver a gramos, mililitros o unidades conserva el número que había y deja la medida.
 */
export function conUnidad(it: ConCantidad, valor: string, medidas: readonly MedidaCasera[], ml = false): Pick<ConCantidad, 'quantity'> & { readonly householdMeasure: MedidaElegida | null } {
  if (valor.startsWith(PREFIJO_DE_MEDIDA)) {
    const tipo = TipoDeMedidaCaseraSchema.safeParse(valor.slice(PREFIJO_DE_MEDIDA.length));
    const m = tipo.success ? medidas.find((x) => x.kind === tipo.data) : undefined;
    if (m) {
      const elegida: MedidaElegida = { kind: m.kind, count: 1, amountPerUnit: m.amount };
      return { quantity: { value: cantidadDeLaMedida(elegida), unit: ml ? 'ml' : 'g' }, householdMeasure: elegida };
    }
  }
  const unidad = valor === 'ml' || valor === 'unit' ? valor : 'g';
  const numero = it.householdMeasure ? it.householdMeasure.count : (it.quantity?.value ?? null);
  return { quantity: numero === null ? null : { value: numero, unit: unidad }, householdMeasure: null };
}

/** Lo que cambia al escribir el número: con una medida, es cuántas, y la cantidad es la de la medida, en gramos. */
export function conNumero(it: ConCantidad, n: number | null, ml = false): Pick<ConCantidad, 'quantity'> & { readonly householdMeasure?: MedidaElegida | null } {
  const m = it.householdMeasure;
  if (m) {
    if (n === null || !Number.isFinite(n) || n <= 0) return { quantity: n === null ? null : { value: Number.NaN, unit: ml ? 'ml' : 'g' }, householdMeasure: m };
    const elegida: MedidaElegida = { ...m, count: n };
    return { quantity: { value: cantidadDeLaMedida(elegida), unit: ml ? 'ml' : 'g' }, householdMeasure: elegida };
  }
  return { quantity: n === null ? null : { value: n, unit: it.quantity?.unit ?? 'g' } };
}

/** El número que se ve en el campo: con una medida, cuántas; si no, la cantidad. */
export const numeroDelCampo = (it: ConCantidad): number | undefined => (it.householdMeasure ? it.householdMeasure.count : it.quantity?.value);

/**
 * Los datos de los alimentos citados, para las filas que los muestran (`FilaDeItem`) sin pasarlos de mano en mano: el
 * editor los provee y el cuadro de la opción suma los que se agregan.
 */
export const ContextoDeLosAlimentos = createContext<ReadonlyMap<string, DatosDelAlimento>>(new Map());
export function useDatosDelAlimento(catalogItemId: string): DatosDelAlimento {
  return useContext(ContextoDeLosAlimentos).get(catalogItemId) ?? SIN_DATOS_DEL_ALIMENTO;
}

/** El ícono de la fila: el de su grupo, o el genérico. */
export function iconoDeLaFila(datos: Pick<DatosDelAlimento, 'grupo'>): NombreDeIcono {
  return iconoDelAlimento(datos.grupo);
}

// ─── El buscador ──────────────────────────────────────────────────────────────────────────────────

/** Lo que el buscador necesita de un alimento para el nivel, la sugerencia y el aviso (todo opcional: una API anterior no lo manda). */
export interface ConNivel {
  readonly catalogItemId: string;
  readonly name: string;
  readonly originLevel?: NivelDeOrigen | undefined;
  readonly verifiedEquivalent?: { readonly catalogItemId: string; readonly name: string } | null | undefined;
}

/** La etiqueta del nivel que va a la vista, o ninguna (lo importado y lo de demostración ya dicen su origen). */
export function etiquetaDelNivel(a: Pick<ConNivel, 'catalogItemId' | 'originLevel'>): string | null {
  return a.originLevel ? ETIQUETA_DEL_NIVEL[a.originLevel] : null;
}

/** Una fila del buscador: el alimento, si es habitual y, si es una sugerencia, de cuál es el equivalente verificado. */
export interface FilaSugerida<A> {
  readonly alimento: A;
  readonly habitual: boolean;
  /** NUA-04: el nombre del alimento del que es el equivalente verificado; `null` si no es una sugerencia. */
  readonly sugeridoPor: string | null;
}

/**
 * NUA-04: cada alimento que tiene un equivalente verificado lleva ese verificado justo antes, como sugerencia. Si el
 * verificado ya venía más abajo en la lista, sube a ese lugar (no se repite); si ya estaba más arriba, queda donde estaba
 * y la fila del alimento lo nombra (`avisoDeEquivalente`). Una sugerencia no se sugiere dos veces.
 */
export function conSugeridos<A extends ConNivel>(filas: readonly { readonly alimento: A; readonly habitual: boolean }[], comoAlimento: (equivalente: NonNullable<ConNivel['verifiedEquivalent']>) => A): FilaSugerida<A>[] {
  const porId = new Map(filas.map((f) => [f.alimento.catalogItemId, f]));
  const puestos = new Set<string>();
  const resultado: FilaSugerida<A>[] = [];
  for (const f of filas) {
    if (puestos.has(f.alimento.catalogItemId)) continue;
    const e = f.alimento.verifiedEquivalent;
    if (e && !puestos.has(e.catalogItemId)) {
      const yaEstaba = porId.get(e.catalogItemId);
      puestos.add(e.catalogItemId);
      resultado.push({ alimento: yaEstaba ? yaEstaba.alimento : comoAlimento(e), habitual: yaEstaba?.habitual ?? false, sugeridoPor: f.alimento.name });
    }
    puestos.add(f.alimento.catalogItemId);
    resultado.push({ ...f, sugeridoPor: null });
  }
  return resultado;
}

/** Lo que se dice en la fila de un alimento con equivalente verificado, si el verificado ya está en la lista. */
export function avisoDeEquivalente(a: ConNivel): string | null {
  return a.verifiedEquivalent ? COPY_ALIMENTOS.tieneEquivalente(a.verifiedEquivalent.name) : null;
}
