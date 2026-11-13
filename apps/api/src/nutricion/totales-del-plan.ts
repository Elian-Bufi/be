import { calcularNutrientes, nutrientesDelResultado, type ContenidoDeInstantanea, type ContenidoDePlan, type EstimacionDeLasOpcionesResponse, type ItemDeLaEstimacion } from '@be/domain';
import type { Prisma } from '@prisma/client';
import type { CatalogoService } from './catalogo.service';
import { recetaCongelada, recetaDeLaOpcion } from './opciones-de-receta';

type Tx = Prisma.TransactionClient;
type DiaDeLaEstimacion = EstimacionDeLasOpcionesResponse['data']['dayTypes'][number];

/** La composición con las claves del contrato y nada más: el catálogo puede guardar otras, y la respuesta es estricta. */
function enSuForma(c: unknown): ItemDeLaEstimacion['composition'] {
  if (!c || typeof c !== 'object') return null;
  const x = c as Record<string, unknown>;
  const fibra = x.fiberG;
  return {
    referenceAmount: x.referenceAmount as '100g' | '100ml',
    energyKcal: Number(x.energyKcal),
    proteinG: Number(x.proteinG),
    carbohydrateG: Number(x.carbohydrateG),
    fatG: Number(x.fatG),
    ...(fibra === undefined ? {} : { fiberG: fibra === null ? null : Number(fibra) }),
  };
}

/**
 * API-PLN-01 (TB-38; ED-31 y ED-D6 de WP-EDITORES-PROFESIONAL) · La estimación de cada opción para las porciones del plan,
 * con la cuenta de la app (`calcularNutrientes`, SUM_SOURCE_PER_100G_V1) y, por ítem, la composición que usó. Cada
 * faltante se nombra por el `itemId`, como en el registro (API-ING-01).
 */
function opcionesConEstimacion(dias: readonly { dayTypeId: string; label: string; meals: readonly { mealId: string; label: string; options: readonly { optionId: string; label: string; recipeVersionId: string | null; items: readonly ItemDeLaEstimacion[] }[] }[] }[]): DiaDeLaEstimacion[] {
  return dias.map((d) => ({
    dayTypeId: d.dayTypeId,
    label: d.label,
    meals: d.meals.map((m) => ({
      mealId: m.mealId,
      label: m.label,
      options: m.options.map((o) => ({
        optionId: o.optionId,
        label: o.label,
        recipeVersionId: o.recipeVersionId,
        planned: nutrientesDelResultado(calcularNutrientes(o.items.map((it) => ({ clave: it.itemId, cantidad: it.quantity, composicion: it.composition })))),
        items: [...o.items],
      })),
    })),
  }));
}

/** Una versión activada: la composición es la de su instantánea, nunca la vigente del catálogo (REG-06-105). */
export function estimacionDeLaInstantanea(instantanea: ContenidoDeInstantanea): DiaDeLaEstimacion[] {
  return opcionesConEstimacion(
    instantanea.dayTypes.map((d) => ({
      dayTypeId: d.dayTypeId,
      label: d.label,
      meals: d.meals.map((m) => ({
        mealId: m.mealId,
        label: m.label,
        options: m.options.map((o) => ({
          optionId: o.optionId,
          label: o.label,
          recipeVersionId: recetaCongelada(o)?.recipeVersionId ?? null,
          items: o.items.map((it) => ({ itemId: it.itemId, catalogItemId: it.catalogItemId, catalogItemVersionId: it.catalogItemVersionId, name: it.name, quantity: it.quantity, composition: enSuForma(it.composition) })),
        })),
      })),
    })),
  );
}

/**
 * Un borrador: la composición que usaría la instantánea si se activara hoy (API-NUT-12). Un alimento de una opción de
 * receta, la versión que cita la receta; los demás, la versión vigente disponible para el profesional. Uno que ya no está
 * disponible queda sin composición, y la opción dice «sin dato» por él: no se inventa un cero.
 */
export async function estimacionDelBorrador(tx: Tx, catalogo: CatalogoService, profesionalId: string, contenido: ContenidoDePlan): Promise<DiaDeLaEstimacion[]> {
  const opciones = contenido.dayTypes.flatMap((d) => d.meals.flatMap((m) => m.options));
  const citada = (it: unknown): string | null => {
    const v = (it as { catalogItemVersionId?: unknown }).catalogItemVersionId;
    return typeof v === 'string' ? v : null;
  };
  const disponibles = await catalogo.disponibles(tx, profesionalId, [...new Set(opciones.flatMap((o) => o.items.map((i) => i.catalogItemId)))]);
  const deRecetas = await catalogo.versionesPorId(tx, opciones.flatMap((o) => (recetaDeLaOpcion(o) ? o.items.flatMap((it) => citada(it) ?? []) : [])));
  return opcionesConEstimacion(
    contenido.dayTypes.map((d) => ({
      dayTypeId: d.dayTypeId,
      label: d.label,
      meals: d.meals.map((m) => ({
        mealId: m.mealId,
        label: m.label,
        options: m.options.map((o) => {
          const receta = recetaDeLaOpcion(o);
          return {
            optionId: o.optionId,
            label: o.label,
            recipeVersionId: receta,
            items: o.items.map((it) => {
              const deLaReceta = receta ? deRecetas.get(citada(it) ?? '') : undefined;
              const vigente = deLaReceta ? undefined : disponibles.get(it.catalogItemId);
              return {
                itemId: it.itemId,
                catalogItemId: it.catalogItemId,
                catalogItemVersionId: deLaReceta?.versionId ?? vigente?.versionId ?? null,
                name: deLaReceta?.nombre ?? vigente?.name ?? null,
                quantity: it.quantity,
                composition: enSuForma(deLaReceta?.composicion ?? vigente?.composition ?? null),
              };
            }),
          };
        }),
      })),
    })),
  );
}
