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
 */

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

export const COPY_VERSION_NUEVA = {
  hay: (n: number) => `Hay una versión ${n} de esta receta`,
  loQueCambia: 'Lo que cambia en una porción',
  ingredientesDeLaNueva: 'Una porción de la nueva',
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
