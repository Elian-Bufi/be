/**
 * ED-32 (WP-EDITORES-PROFESIONAL; V3 N-03) · La receta nueva, creada desde una comida del plan, entra como opción de esa
 * comida, sin React.
 *
 * Son dos escrituras sin transacción conjunta: la receta se guarda en Mis recetas (API-REC-01) y después la opción se
 * suma al borrador (y viaja con el autoguardado). Si la segunda no se puede, la primera ya quedó: el cuadro lo dice y
 * ofrece «Agregarla a Merienda» con la versión que devolvió la API, sin crear otra receta.
 *
 * - La comida se busca por su identidad (`mealId`) si la tiene; si es nueva, por su lugar y su nombre, aunque mientras
 *   tanto el autoguardado le haya dado identidad. Si ya no está, no se agrega en otra.
 * - Una comida recién creada nace con «Opción 1» vacía (ED-33): la receta ocupa ese lugar en vez de dejar una opción sin
 *   ítems, que después impediría activar (OPTION_ITEM_REQUIRED). Vale para la receta nueva y para la elegida.
 * - Agregar dos veces la misma versión a la misma comida no la duplica: el reintento encuentra la que ya está.
 * - La opción guarda `recipeVersionId`: editar la receta después crea otra versión y no cambia la del plan (TEST-EDP-030).
 */
import type { EstructuraDePlanEntrada } from '@be/domain';

type Estructura = EstructuraDePlanEntrada['dayTypes'];

/** Dónde se pidió la receta: la posición, y la identidad y el nombre de la comida para encontrarla aunque se mueva. */
export interface LugarDeLaReceta {
  readonly i: number;
  readonly j: number;
  readonly mealId: string | null;
  /** El nombre tal como está escrito: con él se reconoce una comida nueva, que todavía no tiene identidad. */
  readonly label: string;
  /** Cómo se la nombra («Comida 3» si no tiene nombre). */
  readonly nombre: string;
}

/** El contrato admite hasta doce opciones por comida. */
const MAXIMO_DE_OPCIONES = 12;

export type ResultadoDeAgregar =
  | { readonly tipo: 'agregada'; readonly estructura: Estructura; readonly i: number; readonly j: number; readonly k: number }
  | { readonly tipo: 'ya-estaba'; readonly i: number; readonly j: number; readonly k: number }
  | { readonly tipo: 'no-se-pudo'; readonly motivo: 'YA_NO_ESTA' | 'TOPE' };

/** Dónde está hoy la comida del lugar, o `null`. */
export function dondeEstaLaComida(e: Estructura, lugar: LugarDeLaReceta): { readonly i: number; readonly j: number } | null {
  if (lugar.mealId) {
    for (let i = 0; i < e.length; i++) {
      const j = e[i]!.meals.findIndex((m) => m.mealId === lugar.mealId);
      if (j >= 0) return { i, j };
    }
    return null;
  }
  // Una comida nueva no tiene identidad cuando se abre el cuadro, pero el autoguardado se la puede dar mientras tanto.
  const m = e[lugar.i]?.meals[lugar.j];
  return m && m.label === lugar.label ? { i: lugar.i, j: lugar.j } : null;
}

type Opcion = Estructura[number]['meals'][number]['options'][number];

/** El rótulo con el que nace la opción de una comida nueva (ED-33). */
export const OPCION_INICIAL = 'Opción 1';

/** La opción con la que nace una comida y que nadie tocó todavía: sin ítems, sin receta y con su rótulo. */
export function esLaOpcionSinTocar(o: Opcion): boolean {
  return o.items.length === 0 && !o.recipeVersionId && o.label === OPCION_INICIAL;
}

/**
 * Las opciones con la receta sumada, y en qué lugar quedó. Si la comida solo tiene su opción inicial sin tocar, la receta
 * la reemplaza; si no, va al final. No toca `opciones`.
 */
export function opcionesConLaReceta(opciones: readonly Opcion[], receta: { readonly recipeVersionId: string; readonly name: string }): { readonly opciones: Opcion[]; readonly k: number } {
  const nueva: Opcion = { label: receta.name, items: [], recipeVersionId: receta.recipeVersionId };
  if (opciones.length === 1 && esLaOpcionSinTocar(opciones[0]!)) return { opciones: [nueva], k: 0 };
  return { opciones: [...opciones, nueva], k: opciones.length };
}

/** Suma la receta como opción de la comida del lugar; no toca `e`, devuelve la estructura nueva. */
export function agregarLaReceta(e: Estructura, lugar: LugarDeLaReceta, receta: { readonly recipeVersionId: string; readonly name: string }): ResultadoDeAgregar {
  const donde = dondeEstaLaComida(e, lugar);
  if (!donde) return { tipo: 'no-se-pudo', motivo: 'YA_NO_ESTA' };
  const comida = e[donde.i]!.meals[donde.j]!;
  const ya = comida.options.findIndex((o) => o.recipeVersionId === receta.recipeVersionId);
  if (ya >= 0) return { tipo: 'ya-estaba', ...donde, k: ya };
  if (comida.options.length >= MAXIMO_DE_OPCIONES) return { tipo: 'no-se-pudo', motivo: 'TOPE' };
  const nueva = structuredClone(e) as Estructura;
  const { opciones, k } = opcionesConLaReceta(comida.options, receta);
  nueva[donde.i]!.meals[donde.j]!.options = opciones;
  return { tipo: 'agregada', estructura: nueva, ...donde, k };
}

export const COPY_RECETA_NUEVA = {
  recetaNueva: 'Receta nueva',
  queEs: 'Se crea en Mis recetas y, si querés, entra como opción de esta comida sin salir del plan.',
  titulo: (comida: string) => `Receta nueva para ${comida}`,
  agregada: (receta: string, k: number, comida: string) => `«${receta}» quedó en Mis recetas (versión 1) y es la opción ${k + 1} de ${comida}.`,
  soloGuardada: (receta: string) => `«${receta}» quedó en Mis recetas (versión 1). No se agregó al plan.`,
  quedoGuardada: (receta: string, version: number) => `«${receta}» quedó guardada en Mis recetas (versión ${version}).`,
  noSeAgrego: (comida: string, motivo: 'YA_NO_ESTA' | 'TOPE') =>
    motivo === 'TOPE' ? `No se pudo agregar a ${comida}: ya tiene 12 opciones, el máximo. Quitá una y volvé a intentar.` : `No se pudo agregar a ${comida}: esa comida ya no está en la versión en preparación.`,
  agregarla: (comida: string) => `Agregarla a ${comida}`,
  cerrar: 'Cerrar sin agregarla',
} as const;
