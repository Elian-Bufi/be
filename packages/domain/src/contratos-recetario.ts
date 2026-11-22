/**
 * El Recetario de BE (DL-191; `docs/paquetes/WP-RECETARIO-E-IMAGENES.md`): las recetas curadas por Administración, a la
 * vista de todos los profesionales de Nutrición y de solo lectura, y el camino de una receta propia hasta ahí. Familia de
 * operaciones de BE `RCT` (API-RCT-01 a 05):
 * - API-RCT-01 · `GET /nutrition/recipe-book` — las recetas del recetario, con la miniatura ya firmada.
 * - API-RCT-02 · `POST /nutrition/recipe-book/{recipeId}/copies` — «Copiar a Mis recetas»: una receta propia nueva, con
 *   la misma imagen (el mismo medio, sin duplicar bytes).
 * - API-RCT-03 · `POST /nutrition/recipes/{recipeId}/proposals` — proponer una receta propia, con la cesión de la foto.
 * - API-RCT-04 · `POST /admin/recipe-proposals/query` — Administración: las propuestas, con su autor y sus parecidas.
 * - API-RCT-05 · `POST /admin/recipe-proposals/{proposalId}/decisions` — Administración la suma o la rechaza.
 * Una receta del recetario se lee también con API-REC-03 y se ofrece como opción del plan tal cual (API-NUT-07 y 10).
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { CalculoDeRecetaSchema, EstadoDePropuestaSchema, ImagenDeRecetaSchema, IngredienteDeRecetaSchema } from './contratos-recetas';
import { PaginaSchema, TokenDeVersionSchema } from './contratos-vinculo';

/**
 * DL-191 (REC-D08) · **la cesión de la foto**, versionada. Se muestra entera al proponer una receta con imagen y se acepta
 * con una casilla; la API registra la versión, el SHA-256 del texto y el momento. Si el texto cambia, cambia la versión, y
 * una aceptación de una versión vieja no vale (422 PHOTO_ASSIGNMENT_OUTDATED). **A validar por el abogado** (§6 del
 * paquete): hasta entonces es la redacción del continuador.
 */
export const CESION_DE_LA_FOTO = {
  version: 'REC-CESION-FOTO-1',
  titulo: 'Cesión de la foto al Recetario de BE',
  texto:
    'Al proponer esta receta al Recetario de BE, le cedés a BE, sin cargo y sin exclusividad, el uso de su foto: BE puede mostrarla junto a la receta a todos los profesionales de Nutrición de BE y a las personas a las que ellos se la ofrezcan en un plan, mientras la receta esté en el recetario. BE puede achicarla y volver a codificarla para mostrarla, sin cambiar lo que muestra, y la muestra con la procedencia y la autoría que declaraste. Declarás que la foto es tuya o que tenés permiso para cederla, y que no muestra a ninguna persona ni datos de nadie. Si Administración no suma la receta, la foto sigue siendo solo tuya.',
} as const;

// ─── API-RCT-03 · proponer ──────────────────────────────────────────────────────────────────────

/** La aceptación de la cesión: la versión del texto que se mostró. Solo si la receta tiene imagen. */
export const AceptacionDeLaCesionSchema = z.strictObject({
  textVersion: z.string().trim().min(1).max(60),
  accepted: z.literal(true),
});

export const ProponerAlRecetarioRequestSchema = z.strictObject({
  /** La versión de la receta que se vio: se propone su versión vigente. */
  expectedVersion: TokenDeVersionSchema,
  /** Obligatoria si la receta tiene imagen; `null` si no tiene. */
  photoAssignment: AceptacionDeLaCesionSchema.nullable(),
});
export type ProponerAlRecetarioRequest = z.infer<typeof ProponerAlRecetarioRequestSchema>;

export const PropuestaAlRecetarioSchema = z.strictObject({
  proposalId: IdOpaco,
  recipeId: IdOpaco,
  recipeVersionId: IdOpaco,
  versionNumber: z.number().int().positive(),
  name: z.string(),
  status: EstadoDePropuestaSchema,
  /** La cesión registrada, si la propuesta lleva imagen. */
  photoAssignment: z.strictObject({ textVersion: z.string(), acceptedAt: Instante }).nullable(),
  proposedAt: Instante,
  decidedAt: Instante.nullable(),
  reason: z.string().nullable(),
  /** La receta del recetario que nació de esta propuesta, si se sumó. */
  recipeBookRecipeId: IdOpaco.nullable(),
});
export type PropuestaAlRecetario = z.infer<typeof PropuestaAlRecetarioSchema>;
export const PropuestaAlRecetarioResponseSchema = z.strictObject({ data: PropuestaAlRecetarioSchema });
export type PropuestaAlRecetarioResponse = z.infer<typeof PropuestaAlRecetarioResponseSchema>;

// ─── API-RCT-04 y 05 · Administración ───────────────────────────────────────────────────────────

export const ConsultarPropuestasAlRecetarioRequestSchema = z.strictObject({
  /** Sin estado: las que esperan primero, y después lo decidido. */
  state: EstadoDePropuestaSchema.optional(),
  limit: z.number().int().min(1).max(50).optional(),
  cursor: z.string().max(40).optional(),
});
export type ConsultarPropuestasAlRecetarioRequest = z.infer<typeof ConsultarPropuestasAlRecetarioRequestSchema>;

/** Una receta del recetario o una propuesta con un nombre parecido (`recetasParecidas`). */
export const ParecidaSchema = z.strictObject({
  kind: z.enum(['BE_RECIPE', 'PROPOSAL']),
  recipeId: IdOpaco,
  proposalId: IdOpaco.nullable(),
  name: z.string(),
});
export type Parecida = z.infer<typeof ParecidaSchema>;

/** Lo que ve Administración: la propuesta, quién la propuso (su nombre de profesional), la receta propuesta y las parecidas. */
export const PropuestaParaRevisarSchema = PropuestaAlRecetarioSchema.extend({
  proposedBy: z.strictObject({ displayName: z.string() }),
  recipe: z.strictObject({
    name: z.string(),
    description: z.string().nullable(),
    servings: z.number().int().positive(),
    ingredients: z.array(IngredienteDeRecetaSchema),
    steps: z.array(z.string()),
    calculation: CalculoDeRecetaSchema,
    /** Con sus rutas firmadas: Administración no tiene sesión de profesional para pedir API-MED-03. */
    image: ImagenDeRecetaSchema.nullable(),
  }),
  similar: z.array(ParecidaSchema),
});
export type PropuestaParaRevisar = z.infer<typeof PropuestaParaRevisarSchema>;

export const ListaDePropuestasParaRevisarResponseSchema = z.strictObject({ data: z.array(PropuestaParaRevisarSchema), page: PaginaSchema });
export type ListaDePropuestasParaRevisarResponse = z.infer<typeof ListaDePropuestasParaRevisarResponseSchema>;

export const DecidirPropuestaRequestSchema = z.strictObject({
  decision: z.enum(['ADD', 'REJECT']),
  /** El motivo de un rechazo, que ve quien la propuso. Opcional; no se acepta al sumar. */
  reason: z.string().trim().min(1).max(300).nullable().optional(),
});
export type DecidirPropuestaRequest = z.infer<typeof DecidirPropuestaRequestSchema>;

export const PropuestaParaRevisarResponseSchema = z.strictObject({ data: PropuestaParaRevisarSchema });
export type PropuestaParaRevisarResponse = z.infer<typeof PropuestaParaRevisarResponseSchema>;
