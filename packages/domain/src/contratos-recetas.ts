/**
 * Recetas del profesional de Nutrición (DL-119): una **preparación propia** con recursos visuales propios en su ámbito
 * (REG-06-135, inciso 2). Familia de operaciones de BE `REC` (API-REC-01 a 07; `docs/paquetes/WP-NUTRICION-RECETAS.md` §4).
 *
 * - Los ingredientes son elementos del catálogo **por identidad y versión** (`catalogItemId` + `catalogItemVersionId`),
 *   nunca por coincidencia de nombre, con gramos o mililitros del estado de preparación indicado. No se convierten estados
 *   ni unidades (06:4617-4621).
 * - Editar emite una versión nueva e inmutable. La imagen va en la receta, no en la versión: reemplazarla o retirarla no
 *   toca ingredientes, versiones ni registros.
 * - El cálculo lo hace la API (`calculo-nutricional.ts`): el cliente no manda totales.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { METODO_DE_CALCULO_NUTRICIONAL, NUTRIENTES_CALCULADOS, type ResultadoNutricional } from './calculo-nutricional';
import { ProcedenciaDeMedioSchema } from './contratos-medios';
import { EstadoDePreparacionSchema } from './contratos-nutricion';
import { PaginaSchema, TokenDeVersionSchema } from './contratos-vinculo';

const Texto = (max: number) => z.string().trim().min(1).max(max);

// ─── El cálculo, en la forma del contrato ───────────────────────────────────────────────────────

/** Por qué un nutriente no tiene total: el contrato nombra cada caso (desconocido, nunca cero). */
export const MotivoDeFaltanteSchema = z.enum(['SIN_CANTIDAD', 'SIN_COMPOSICION', 'SIN_DATO_DEL_NUTRIENTE', 'UNIDAD_SIN_EQUIVALENCIA']);

export const ValorNutricionalSchema = z.strictObject({
  /** Exacto, en decimal con punto; `null` si un ingrediente impide calcularlo. Se redondea solo al mostrar. */
  value: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .nullable(),
  /** Qué ingredientes lo impiden, y por qué. Vacío si el total está completo. */
  missing: z.array(z.strictObject({ key: z.string(), reason: MotivoDeFaltanteSchema })),
});
export type ValorNutricional = z.infer<typeof ValorNutricionalSchema>;

export const NutrientesSchema = z.strictObject({
  energyKcal: ValorNutricionalSchema,
  carbohydrateG: ValorNutricionalSchema,
  fatG: ValorNutricionalSchema,
  proteinG: ValorNutricionalSchema,
  fiberG: ValorNutricionalSchema,
});
export type Nutrientes = z.infer<typeof NutrientesSchema>;

export const MetodoDeCalculoSchema = z.literal(METODO_DE_CALCULO_NUTRICIONAL);

/** El resultado del cálculo en la forma del contrato. */
export function nutrientesDelResultado(resultado: ResultadoNutricional): Nutrientes {
  const salida = {} as Record<(typeof NUTRIENTES_CALCULADOS)[number], ValorNutricional>;
  for (const n of NUTRIENTES_CALCULADOS) {
    const v = resultado.nutrientes[n];
    salida[n] = { value: v.exacto, missing: v.faltan.map((f) => ({ key: f.clave, reason: f.motivo })) };
  }
  return salida;
}

/** API-REC-07 y el cálculo guardado en cada versión: el total de la receta y el de una porción. */
export const CalculoDeRecetaSchema = z.strictObject({
  method: MetodoDeCalculoSchema,
  total: NutrientesSchema,
  perServing: NutrientesSchema,
});
export type CalculoDeReceta = z.infer<typeof CalculoDeRecetaSchema>;

// ─── Entrada ────────────────────────────────────────────────────────────────────────────────────

/** Gramos o mililitros del estado indicado. Una «unidad» no tiene peso identificado: no entra en una receta. */
export const CantidadDeIngredienteSchema = z.strictObject({
  value: z.number().positive().finite().max(5000),
  unit: z.enum(['g', 'ml']),
});

export const IngredienteDeRecetaEntradaSchema = z.strictObject({
  catalogItemId: IdOpaco,
  catalogItemVersionId: IdOpaco,
  quantity: CantidadDeIngredienteSchema,
  preparationState: EstadoDePreparacionSchema,
});
export type IngredienteDeRecetaEntrada = z.infer<typeof IngredienteDeRecetaEntradaSchema>;

/** Lo que se calcula: porciones e ingredientes. */
export const CalcularRecetaRequestSchema = z.strictObject({
  servings: z.number().int().min(1).max(50),
  ingredients: z.array(IngredienteDeRecetaEntradaSchema).min(1).max(40),
});
export type CalcularRecetaRequest = z.infer<typeof CalcularRecetaRequestSchema>;

/** API-REC-01. */
export const CrearRecetaRequestSchema = CalcularRecetaRequestSchema.extend({
  name: Texto(120),
  description: z.string().trim().max(500).nullable(),
  steps: z.array(Texto(500)).max(20),
});
export type CrearRecetaRequest = z.infer<typeof CrearRecetaRequestSchema>;

/** API-REC-04: la versión nueva completa, con la versión del recurso que se vio. */
export const EditarRecetaRequestSchema = CrearRecetaRequestSchema.extend({ expectedVersion: TokenDeVersionSchema });
export type EditarRecetaRequest = z.infer<typeof EditarRecetaRequestSchema>;

/** API-REC-05: asociar o reemplazar la imagen con un medio propio `AVAILABLE` de finalidad `RECIPE_REFERENCE`. */
export const AsociarImagenDeRecetaRequestSchema = z.strictObject({ mediaId: IdOpaco, expectedVersion: TokenDeVersionSchema });
export type AsociarImagenDeRecetaRequest = z.infer<typeof AsociarImagenDeRecetaRequestSchema>;

// ─── Salida ─────────────────────────────────────────────────────────────────────────────────────

export const IngredienteDeRecetaSchema = z.strictObject({
  order: z.number().int().positive(),
  catalogItemId: IdOpaco,
  catalogItemVersionId: IdOpaco,
  /** El nombre de esa versión del catálogo. */
  name: z.string(),
  quantity: CantidadDeIngredienteSchema,
  preparationState: EstadoDePreparacionSchema,
});
export type IngredienteDeReceta = z.infer<typeof IngredienteDeRecetaSchema>;

/** La imagen de referencia: no mide la porción ni demuestra un consumo. */
export const ImagenDeRecetaSchema = z.strictObject({
  mediaId: IdOpaco,
  provenance: ProcedenciaDeMedioSchema,
  authorship: z.string().nullable(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  attachedAt: Instante,
});
export type ImagenDeReceta = z.infer<typeof ImagenDeRecetaSchema>;

export const RecetaSchema = z.strictObject({
  recipeId: IdOpaco,
  /** La versión del recurso, para `expectedVersion`: cambia con cada versión nueva y con cada cambio de imagen. */
  version: TokenDeVersionSchema,
  /** La versión vigente de la receta (la de los ingredientes), la que se ofrece como opción. */
  recipeVersionId: IdOpaco,
  versionNumber: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable(),
  servings: z.number().int().positive(),
  ingredients: z.array(IngredienteDeRecetaSchema),
  steps: z.array(z.string()),
  calculation: CalculoDeRecetaSchema,
  image: ImagenDeRecetaSchema.nullable(),
  createdAt: Instante,
  updatedAt: Instante,
});
export type Receta = z.infer<typeof RecetaSchema>;
export const RecetaResponseSchema = z.strictObject({ data: RecetaSchema });

/** API-REC-03: la receta con el historial de sus versiones, de la más vieja a la más nueva. */
export const DetalleDeRecetaResponseSchema = z.strictObject({
  data: RecetaSchema.extend({
    versions: z.array(z.strictObject({ recipeVersionId: IdOpaco, versionNumber: z.number().int().positive(), name: z.string(), recordedAt: Instante })),
  }),
});
export type DetalleDeRecetaResponse = z.infer<typeof DetalleDeRecetaResponseSchema>;

export const ListaDeRecetasResponseSchema = z.strictObject({ data: z.array(RecetaSchema), page: PaginaSchema });
export type ListaDeRecetasResponse = z.infer<typeof ListaDeRecetasResponseSchema>;

export const CalculoDeRecetaResponseSchema = z.strictObject({ data: CalculoDeRecetaSchema });
export type CalculoDeRecetaResponse = z.infer<typeof CalculoDeRecetaResponseSchema>;
