/**
 * WP-CATALOGO-VISUAL (encargo de Dirección del 2026-11-02; DL-081 y DL-162): las zonas musculares de un ejercicio y su
 * imagen, en operaciones nuevas. Las lecturas que ya leen las APK instaladas (API-TRN-13 y su búsqueda) no cambian de
 * forma: sus `muscleZones` y `didacticResources` ahora traen lo que el ejercicio tiene, con la misma forma congelada
 * (DL-152).
 *
 * - **API-ZON-01**: el catálogo de las 17 zonas (`zonas-musculares.ts`), la operación de descubrimiento que faltaba.
 * - **API-EJE-04**: las zonas de un ejercicio propio, con su rol PRIMARY o SECONDARY. Cada cambio es una asignación
 *   nueva de una historia de solo agregar; `zonesVersion` es el token de concurrencia, como `imageVersion`.
 * - **API-EJE-05**: la ficha visual de varios ejercicios a la vez (zonas e imagen, con su procedencia, su licencia y su
 *   texto alternativo), para el website. Es una lectura: el cuerpo lleva los identificadores, nunca un texto.
 *
 * Las zonas y la imagen de un ejercicio del catálogo de todos (sembrado o importado) las cura BE con el comando interno
 * del operador, nunca un profesional por HTTP (REG-06-135; B10-06 §22): `apps/api/src/entrenamiento/curaduria.ts`.
 */
import { z } from 'zod';
import { IdOpaco } from './contratos';
import { RelacionConZonaSchema } from './contratos-entrenamiento';
import { ImagenDeEjercicioSchema, LicenciaDeImagenSchema, RevisionTecnicaSchema } from './contratos-entrenamiento-por-serie';
import { ProcedenciaDeCatalogoSchema } from './contratos-nutricion';

/**
 * API-EJE-04: reemplazar las zonas de un ejercicio propio. `muscleZones` es la lista completa (vacía quita todas), sin
 * repetidas, cada una con su rol y sin porcentajes. `expectedZonesVersion` es la que se vio: 0 si nunca tuvo zonas.
 */
export const CambiarZonasDeEjercicioRequestSchema = z.strictObject({
  exerciseVersionId: IdOpaco,
  expectedZonesVersion: z.number().int().min(0),
  muscleZones: z.array(RelacionConZonaSchema).max(17),
});
export type CambiarZonasDeEjercicioRequest = z.infer<typeof CambiarZonasDeEjercicioRequestSchema>;

/**
 * La ficha visual de un ejercicio: sus zonas vigentes y su imagen vigente. `zonesVersion` es el número de la última
 * asignación (0 si nunca tuvo); `zonesExerciseVersionId`, la versión del ejercicio para la que se declararon. La imagen
 * es la misma forma que leen el plan y la sesión (ImagenDeEjercicioSchema): `provenance` dice si se generó con IA.
 */
export const FichaVisualDeEjercicioSchema = z.strictObject({
  exerciseId: IdOpaco,
  versionId: IdOpaco,
  name: z.string(),
  provenance: ProcedenciaDeCatalogoSchema,
  muscleZones: z.array(RelacionConZonaSchema),
  zonesVersion: z.number().int().min(0),
  zonesExerciseVersionId: IdOpaco.nullable(),
  imageVersion: z.number().int().min(0),
  image: ImagenDeEjercicioSchema.nullable(),
});
export type FichaVisualDeEjercicio = z.infer<typeof FichaVisualDeEjercicioSchema>;
export const FichaVisualDeEjercicioResponseSchema = z.strictObject({ data: FichaVisualDeEjercicioSchema });

// ─── Lo que lee el comando de curaduría de BE (no es una operación HTTP) ──────────────────────────

/** `curaduria-comando.js zonas --archivo`: la lista completa de zonas de cada ejercicio del catálogo de todos. */
export const ArchivoDeZonasCuradasSchema = z.object({
  ejercicios: z.array(z.strictObject({ exerciseId: IdOpaco, muscleZones: z.array(RelacionConZonaSchema).max(17) })).min(1),
});
export type ArchivoDeZonasCuradas = z.infer<typeof ArchivoDeZonasCuradasSchema>;

/**
 * `curaduria-comando.js imagenes --manifiesto`: cada imagen con lo que piden API-MED-01 y API-EJE-02 (procedencia, autoría,
 * texto alternativo, licencia y revisión técnica). `archivo` es relativo al manifiesto.
 */
export const ManifiestoDeImagenesCuradasSchema = z.object({
  imagenes: z
    .array(
      z.strictObject({
        exerciseId: IdOpaco,
        archivo: z.string().min(1),
        contentType: z.string().min(1),
        provenance: z.enum(['AI_GENERATED', 'PERSON_PROVIDED']),
        authorship: z.string(),
        altText: z.string(),
        license: LicenciaDeImagenSchema,
        technicalReview: RevisionTecnicaSchema,
      }),
    )
    .min(1),
});
export type ManifiestoDeImagenesCuradas = z.infer<typeof ManifiestoDeImagenesCuradasSchema>;

/** API-EJE-05: de 1 a 50 ejercicios, por identidad. Lo que el actor no ve no se responde (ni existe para él). */
export const FichasVisualesRequestSchema = z.strictObject({ exerciseIds: z.array(IdOpaco).min(1).max(50) });
export type FichasVisualesRequest = z.infer<typeof FichasVisualesRequestSchema>;
export const FichasVisualesResponseSchema = z.strictObject({ data: z.array(FichaVisualDeEjercicioSchema) });
export type FichasVisuales = z.infer<typeof FichasVisualesResponseSchema>;
