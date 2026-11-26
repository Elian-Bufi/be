/**
 * DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3, ET3-01 a ET3-06) · los contratos de las Plantillas de BE de Entrenamiento, una
 * familia propia de BE (TPB):
 * - **API-TPB-01** `GET /training/be-templates`: las que se ofrecen, para cualquier profesional con Entrenamiento habilitado,
 *   con lo necesario para elegir (división, días, semanas, fases, sesiones y ejercicios, con su disponibilidad en el catálogo).
 * - **API-TPB-02** `POST /advisees/{adviseeId}/training/plans/from-be-template`: crear el borrador del plan de la persona desde
 *   una (con `Idempotency-Key`); BE resuelve las cargas en % RM con el 1RM de esa persona y dice cuáles quedan para completar.
 * - **API-TPB-03** `POST /admin/training-templates/query` y **API-TPB-04** `POST /admin/training-templates/{key}/decisions`:
 *   Administración ve todas, con su historia, y decide si cada una se ofrece o se retira (SESSION_MFA).
 * Nada viaja a la APK: es del profesional y de Administración.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { CargaSchema, IntensidadDelPlanSchema, NotacionDelEsfuerzoSchema, VersionDePlanDeEntrenamientoSchema } from './contratos-entrenamiento';

export const ClaveDePlantillaDeBeSchema = z.string().regex(/^BE-[A-Z0-9-]{2,60}$/);
export const DivisionDeLaPlantillaDeBeSchema = z.enum(['FULL_BODY', 'UPPER_LOWER', 'PUSH_PULL_LEGS', 'BODY_PART_SPLIT']);
/** `PUBLISHED`: se ofrece; `WITHDRAWN`: Administración la retiró (no se ofrece ni se aplica). */
export const EstadoDePlantillaDeBeSchema = z.enum(['PUBLISHED', 'WITHDRAWN']);
export type EstadoDePlantillaDeBe = z.infer<typeof EstadoDePlantillaDeBeSchema>;
/** ET3-D02: lo que dice la plantilla de sí misma. Las de la semilla, `PROPOSAL`: «propuesta, a validar por Elián». */
export const ValidacionDePlantillaDeBeSchema = z.enum(['PROPOSAL', 'VALIDATED']);

const EjercicioDeLaPlantillaDeBeSchema = z.strictObject({
  /** El ejercicio del catálogo de este entorno, o `null` si no está (no entra al aplicarla). */
  exerciseId: IdOpaco.nullable(),
  name: z.string(),
  /** «3 × 10 · 65 % RM» o «3 × 8–10». */
  prescription: z.string(),
  percentRm: z.number().nullable(),
});

export const PlantillaDeBeSchema = z.strictObject({
  key: ClaveDePlantillaDeBeSchema,
  version: z.number().int().positive(),
  name: z.string(),
  description: z.string(),
  split: DivisionDeLaPlantillaDeBeSchema,
  daysPerWeek: z.number().int().min(1).max(7),
  suggestedDays: z.string(),
  weeks: z.number().int().positive(),
  intensity: IntensidadDelPlanSchema,
  validation: ValidacionDePlantillaDeBeSchema,
  state: EstadoDePlantillaDeBeSchema,
  phases: z.array(
    z.strictObject({
      name: z.string(),
      purpose: z.string(),
      weeks: z.number().int().positive(),
      /** La progresión en palabras («Lineal: +2,5 kg por semana · descarga en la semana 4»), o `null`. */
      progression: z.string().nullable(),
      sessions: z.array(z.strictObject({ label: z.string(), exercises: z.array(EjercicioDeLaPlantillaDeBeSchema) })),
    }),
  ),
});
export type PlantillaDeBeApi = z.infer<typeof PlantillaDeBeSchema>;
export const ListaDePlantillasDeBeResponseSchema = z.strictObject({ data: z.array(PlantillaDeBeSchema) });
export type ListaDePlantillasDeBeResponse = z.infer<typeof ListaDePlantillasDeBeResponseSchema>;

// ─── API-TPB-02 ──────────────────────────────────────────────────────────────────────────────
export const CrearPlanDesdePlantillaDeBeRequestSchema = z.strictObject({
  objectiveVersionId: IdOpaco,
  templateKey: ClaveDePlantillaDeBeSchema,
  /** La versión que se vio: si cambió o se retiró, 409 o 422 y la pantalla vuelve a leer. */
  templateVersion: z.number().int().positive(),
  effortNotation: NotacionDelEsfuerzoSchema.optional(),
});
export type CrearPlanDesdePlantillaDeBeRequest = z.infer<typeof CrearPlanDesdePlantillaDeBeRequestSchema>;

export const CargaResueltaSchema = z.discriminatedUnion('status', [
  z.strictObject({ prescriptionId: z.string(), exerciseName: z.string(), percentRm: z.number(), status: z.literal('RESOLVED'), load: CargaSchema, basis: z.string() }),
  z.strictObject({ prescriptionId: z.string(), exerciseName: z.string(), percentRm: z.number(), status: z.literal('WITHOUT_ONE_REP_MAX') }),
]);
export const PlanDesdePlantillaDeBeResponseSchema = z.strictObject({
  data: VersionDePlanDeEntrenamientoSchema,
  beTemplate: z.strictObject({
    key: ClaveDePlantillaDeBeSchema,
    version: z.number().int().positive(),
    /** Las cargas en % RM, una por ejercicio: con su base («70 % de 100 kg = 70 kg») o sin 1RM (para completar). */
    loads: z.array(CargaResueltaSchema),
    /** Los ejercicios de la plantilla que no están en el catálogo de este entorno: no entraron. */
    unavailableExercises: z.array(z.string()),
  }),
});
export type PlanDesdePlantillaDeBeResponse = z.infer<typeof PlanDesdePlantillaDeBeResponseSchema>;

// ─── API-TPB-03 y 04 (Administración) ────────────────────────────────────────────────────────
export const ConsultarPlantillasDeBeRequestSchema = z.strictObject({});
export const DecisionSobrePlantillaDeBeSchema = z.strictObject({
  state: EstadoDePlantillaDeBeSchema,
  reason: z.string().nullable(),
  decidedAt: Instante,
  administratorName: z.string().nullable(),
});
export const PlantillaDeBeParaAdministrarSchema = PlantillaDeBeSchema.extend({ history: z.array(DecisionSobrePlantillaDeBeSchema) });
export const ListaDePlantillasDeBeParaAdministrarResponseSchema = z.strictObject({ data: z.array(PlantillaDeBeParaAdministrarSchema) });
export type ListaDePlantillasDeBeParaAdministrarResponse = z.infer<typeof ListaDePlantillasDeBeParaAdministrarResponseSchema>;
export const DecidirSobrePlantillaDeBeRequestSchema = z.strictObject({
  decision: z.enum(['PUBLISH', 'WITHDRAW']),
  /** Por qué se retira (opcional; al publicar, no va). */
  reason: z.string().trim().max(500).nullable().optional(),
});
export const PlantillaDeBeParaAdministrarResponseSchema = z.strictObject({ data: PlantillaDeBeParaAdministrarSchema });
