/**
 * API-PLN-01 (WP-TABLERO-ALTA-GAMA TB-38; WP-EDITORES-PROFESIONAL §8.3, ED-31 y ED-D6) · Los totales del plan, calculados
 * por el servidor: la estimación de cada opción para las porciones del plan, con la misma cuenta que ve la app
 * (`SUM_SOURCE_PER_100G_V1`, las kcal de la fuente, nunca 4/4/9) y, por ítem, la composición y la versión del catálogo que
 * usó. Así el editor del website, que calcula al instante con la función del dominio, y el servidor dan lo mismo
 * (TEST-EDP-028).
 *
 * - En una versión activada, la composición es la de su instantánea; en un borrador, la que usaría la instantánea si se
 *   activara hoy: la versión vigente de cada alimento disponible para el profesional, o la congelada por la receta.
 * - Lo que falta dice «sin dato» y qué ítem lo impide: un alimento que ya no está disponible, uno sin cantidad o una
 *   unidad sin equivalencia en gramos. Nunca un cero.
 * - Sin total del día: las opciones de una comida son alternativas y nunca se suman entre sí (TB-38; el rango del día de
 *   DJ-4 lo arma el website con estos totales).
 * Solo lo lee el profesional del plan. La persona sigue leyendo sus opciones con API-ING-01, que no cambia.
 */
import { z } from 'zod';
import { IdOpaco } from './contratos';
import { METODO_DE_CALCULO_NUTRICIONAL } from './calculo-nutricional';
import { CantidadSchema, ComposicionSchema } from './contratos-nutricion';
import { NutrientesSchema } from './contratos-recetas';
import { TokenDeVersionSchema } from './contratos-vinculo';

/** Un ítem de una opción con lo que usó la cuenta: la versión del catálogo y su composición, o `null` si no la hay. */
export const ItemDeLaEstimacionSchema = z.strictObject({
  itemId: IdOpaco,
  catalogItemId: IdOpaco,
  /** `null`: el alimento ya no está disponible para el profesional; la opción dice «sin dato» por él. */
  catalogItemVersionId: IdOpaco.nullable(),
  name: z.string().nullable(),
  quantity: CantidadSchema.nullable(),
  composition: ComposicionSchema.nullable(),
});
export type ItemDeLaEstimacion = z.infer<typeof ItemDeLaEstimacionSchema>;

export const OpcionConEstimacionSchema = z.strictObject({
  optionId: IdOpaco,
  label: z.string(),
  /** La versión de la receta de la opción, si nació de una (DL-119). */
  recipeVersionId: IdOpaco.nullable(),
  /** La estimación para las porciones del plan, por nutriente, con lo que falta. */
  planned: NutrientesSchema,
  items: z.array(ItemDeLaEstimacionSchema),
});
export type OpcionConEstimacion = z.infer<typeof OpcionConEstimacionSchema>;

export const EstimacionDeLasOpcionesResponseSchema = z.strictObject({
  data: z.strictObject({
    planId: IdOpaco,
    version: TokenDeVersionSchema,
    state: z.enum(['DRAFT', 'ACTIVATED']),
    method: z.literal(METODO_DE_CALCULO_NUTRICIONAL),
    dayTypes: z.array(
      z.strictObject({
        dayTypeId: IdOpaco,
        label: z.string(),
        meals: z.array(z.strictObject({ mealId: IdOpaco, label: z.string(), options: z.array(OpcionConEstimacionSchema) })),
      }),
    ),
  }),
});
export type EstimacionDeLasOpcionesResponse = z.infer<typeof EstimacionDeLasOpcionesResponseSchema>;
