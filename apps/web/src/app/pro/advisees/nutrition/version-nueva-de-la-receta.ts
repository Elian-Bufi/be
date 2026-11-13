/**
 * ED-32 (WP-EDITORES-PROFESIONAL; V3 N-03) · «Hay una versión 3 de esta receta · Usarla», sin React.
 *
 * - **La opción cita una versión de la receta** (DL-119): editar la receta después crea otra versión y el plan sigue con
 *   la suya (TEST-EDP-030). Si hay una más nueva, el editor lo dice en la opción y deja pasarla, nunca solo.
 * - **Antes de usarla, lo que cambia en una porción:** lo que sale, lo que entra y las cantidades que cambian, frente a
 *   la porción que la API armó para el plan con la versión de ahora. Si esa porción todavía no está (la opción no se
 *   guardó), se dicen los ingredientes de la nueva.
 * - **Usarla cambia solo la versión que cita la opción** (y su nombre, si era el de la receta): los ítems los vuelve a
 *   armar la API al guardar, como con cualquier opción de receta.
 * - **Con las cuentas del servidor** (API-PLN-01, §8.7): la porción de ahora, como la estima API-PLN-01, frente a la
 *   porción de la versión nueva, como la calculó la API al guardarla. Ninguna de las dos es una cuenta del editor.
 */
import { ETIQUETA_DE_NUTRIENTE, nutrienteParaMostrar, UNIDAD_DE_NUTRIENTE } from '@be/domain';

/** Lo que se sabe de la versión que cita una opción. */
export interface VersionCitada {
  readonly recipeId: string;
  readonly recipeVersionId: string;
  readonly versionNumber: number;
  readonly name: string;
}

/** La receta como está hoy (API-REC-03), con lo que hace falta para una porción. */
export interface RecetaVigente {
  readonly recipeId: string;
  readonly recipeVersionId: string;
  readonly versionNumber: number;
  readonly name: string;
  readonly servings: number;
  readonly ingredients: readonly { readonly catalogItemId: string; readonly name: string; readonly quantity: { readonly value: number; readonly unit: 'g' | 'ml' } }[];
  /** El cálculo que la API guardó con esta versión: el de una porción es el que se compara (API-PLN-01). */
  readonly calculation?: { readonly perServing: NutrientesDeLaPorcion };
}

/** Un ítem de la porción, como lo compara la vista previa. */
export interface ItemDeLaPorcion {
  readonly catalogItemId: string;
  readonly nombre: string;
  readonly cantidad: { readonly value: number; readonly unit: string } | null;
}

/** Si la receta tiene una versión más nueva que la que cita la opción. */
export const hayVersionNueva = (citada: Pick<VersionCitada, 'recipeId' | 'versionNumber'>, vigente: Pick<RecetaVigente, 'recipeId' | 'versionNumber'> | null | undefined): boolean =>
  Boolean(vigente && vigente.recipeId === citada.recipeId && vigente.versionNumber > citada.versionNumber);

/** Un número con coma y hasta un decimal: «12,5». */
const numero = (n: number): string => (Math.round(n * 10) / 10).toLocaleString('es-AR', { maximumFractionDigits: 1 });

/** Una porción de la versión vigente: cada ingrediente dividido por las porciones que rinde. */
export function porcionDe(r: Pick<RecetaVigente, 'servings' | 'ingredients'>): ItemDeLaPorcion[] {
  const porciones = r.servings > 0 ? r.servings : 1;
  return r.ingredients.map((i) => ({ catalogItemId: i.catalogItemId, nombre: i.name, cantidad: { value: i.quantity.value / porciones, unit: i.quantity.unit } }));
}

const enTexto = (c: ItemDeLaPorcion['cantidad']): string => (c ? `${numero(c.value)} ${c.unit === 'unit' ? 'u.' : c.unit}` : 'sin cantidad');
const mismo = (a: ItemDeLaPorcion['cantidad'], b: ItemDeLaPorcion['cantidad']): boolean => (a && b ? a.unit === b.unit && numero(a.value) === numero(b.value) : a === b);

/**
 * Lo que cambia en una porción, en renglones: «Avena: de 40 g a 50 g», «Se suma Banana, 100 g», «Sale Miel». Sin la
 * porción de ahora, los ingredientes de la nueva. Sin cambios en la porción, lo dice (pudo cambiar el nombre o los pasos).
 */
export function cambiosEnUnaPorcion(antes: readonly ItemDeLaPorcion[] | null, despues: readonly ItemDeLaPorcion[]): string[] {
  if (antes === null) return despues.map((d) => `${d.nombre}, ${enTexto(d.cantidad)}`);
  const lineas: string[] = [];
  const deAntes = new Map(antes.map((a) => [a.catalogItemId, a]));
  const deDespues = new Set(despues.map((d) => d.catalogItemId));
  for (const d of despues) {
    const a = deAntes.get(d.catalogItemId);
    if (!a) lineas.push(`Se suma ${d.nombre}, ${enTexto(d.cantidad)}`);
    else if (!mismo(a.cantidad, d.cantidad)) lineas.push(`${d.nombre}: de ${enTexto(a.cantidad)} a ${enTexto(d.cantidad)}`);
  }
  for (const a of antes) if (!deDespues.has(a.catalogItemId)) lineas.push(`Sale ${a.nombre}`);
  return lineas.length > 0 ? lineas : ['Una porción tiene los mismos ingredientes y cantidades.'];
}

/** La opción con la versión vigente: cambia la versión que cita y, si su nombre era el de la receta, también el nombre. */
export function opcionConLaVersionNueva<O extends { readonly label: string; readonly recipeVersionId?: string | undefined }>(o: O, citada: Pick<VersionCitada, 'name'>, vigente: Pick<RecetaVigente, 'recipeVersionId' | 'name'>): O {
  const conNombreDeLaReceta = o.label.trim() === citada.name.trim();
  return { ...o, recipeVersionId: vigente.recipeVersionId, label: conNombreDeLaReceta ? vigente.name.slice(0, 120) : o.label };
}

/** Un valor nutricional como lo devuelve la API: exacto, en texto; `null` si un ingrediente impide calcularlo. */
type ValorEnTexto = { readonly value: string | null };
/** Los nutrientes de una porción, como los devuelven API-PLN-01 (`planned`) y la receta (`calculation.perServing`). */
export type NutrientesDeLaPorcion = Readonly<Record<'energyKcal' | 'proteinG' | 'carbohydrateG' | 'fatG', ValorEnTexto>>;

const NUTRIENTES_DE_LA_PORCION = ['energyKcal', 'proteinG', 'carbohydrateG', 'fatG'] as const;

/**
 * API-PLN-01 en la vista previa (§8.7): lo que cambia en una porción, con las cuentas del servidor. «Antes» es la
 * estimación que API-PLN-01 hace de la opción guardada: suma los alimentos de la porción que armó con la versión que cita,
 * con cada cantidad redondeada a 0,1 por porción. «Después» es el cálculo que la API guardó con la versión nueva, que
 * divide el total exacto de la receta por sus porciones. No es el mismo método (EDT-60): con porciones que no dividen
 * exacto, una receta sin cambios nutricionales puede mostrar una unidad de diferencia («de 1474 kcal a 1473 kcal»). Las dos
 * son cuentas del servidor, nunca del editor; igualarlas pide el cálculo por porción de la versión citada, que la API no da. Sin la estimación de la opción (no se leyó, o la opción todavía no se guardó con esa versión), se dice solo
 * la porción nueva. Lo que no tiene dato dice «sin dato», nunca 0.
 */
export function nutrientesDeLaPorcion(antes: NutrientesDeLaPorcion | null, despues: NutrientesDeLaPorcion | null): string[] {
  if (!despues) return [];
  return NUTRIENTES_DE_LA_PORCION.map((n) => {
    const d = nutrienteParaMostrar(despues[n], n);
    const unidad = UNIDAD_DE_NUTRIENTE[n];
    const enTexto = (v: string | null) => (v === null ? 'sin dato' : `${v} ${unidad}`);
    if (!antes) return `${ETIQUETA_DE_NUTRIENTE[n]}: ${enTexto(d)}`;
    const a = nutrienteParaMostrar(antes[n], n);
    return a === d ? `${ETIQUETA_DE_NUTRIENTE[n]}: ${enTexto(d)}, igual que ahora` : `${ETIQUETA_DE_NUTRIENTE[n]}: de ${enTexto(a)} a ${enTexto(d)}`;
  });
}

/**
 * La estimación de una opción en la respuesta de API-PLN-01, si es de la versión del plan que se mira y cita la misma
 * versión de la receta. Una estimación de otro guardado, o de otra versión de la receta, no es la porción de ahora.
 */
export function estimacionDeLaOpcion(
  e: { readonly version: string; readonly dayTypes: readonly { readonly meals: readonly { readonly options: readonly { readonly optionId: string; readonly recipeVersionId: string | null; readonly planned: NutrientesDeLaPorcion }[] }[] }[] } | null,
  version: string | null,
  optionId: string | undefined,
  recipeVersionId: string,
): NutrientesDeLaPorcion | null {
  if (!e || !optionId || e.version !== version) return null;
  for (const d of e.dayTypes) for (const m of d.meals) for (const o of m.options) if (o.optionId === optionId) return o.recipeVersionId === recipeVersionId ? o.planned : null;
  return null;
}

export const COPY_VERSION_NUEVA = {
  hay: (n: number) => `Hay una versión ${n} de esta receta`,
  loQueCambia: 'Lo que cambia en una porción',
  ingredientesDeLaNueva: 'Una porción de la nueva',
  nutrientesDeLaPorcion: 'Una porción, con las cuentas de BE',
  nutrientesDeLaNueva: 'Una porción de la nueva, con las cuentas de BE',
  usarla: (n: number) => `Usar la versión ${n}`,
  queHace: 'La opción pasa a citar la versión nueva. Sus alimentos se arman al guardar, como en toda opción de receta.',
  usada: (receta: string, n: number) => `La opción usa la versión ${n} de «${receta}». Sus alimentos se arman al guardar.`,
  noSeLeyo: 'No pudimos ver si esta receta tiene una versión más nueva.',
} as const;

export const COPY_FOTO_DE_LA_RECETA = {
  titulo: 'Una foto de la receta (opcional)',
  queEs: 'Es una referencia del plato: no mide la porción. Podés sumarla ahora o después, desde Mis recetas.',
  listo: 'Volver al plan',
} as const;
