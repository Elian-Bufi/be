/**
 * La evidencia de una revisión registrada, resuelta (DL-154; encargo de consolidación del 2026-10-23, punto 4; hallazgo
 * UX-02 de la auditoría): API-NUT-19-EVIDENCIA y API-TRN-23-EVIDENCIA, variantes de API-NUT-19 y API-TRN-23 que solo lee
 * el website del profesional.
 *
 * Lo que la forma protege:
 * - **Lo que se seleccionó, no lo que hoy se ve.** Los ítems son las referencias que la revisión guardó al registrarse
 *   (`evidenceReferences`), en su orden, y nada más: no se reconstruyen con el período ni con un filtro, y una revisión
 *   que no guardó evidencia devuelve la lista vacía.
 * - **El sentido histórico.** Lo que cambió después de registrada la revisión (una rectificación, una corrección, una
 *   anulación, una versión sucesora) va en `changesAfterReview`, con su instante: lo que se abre hoy puede no ser lo que
 *   se revisó, y se dice. Un cambio anterior a la revisión es parte de lo que se miró y no se marca.
 * - **El permiso de hoy.** La lectura vuelve a pasar por el PDP: una referencia vieja no concede acceso. Sin acceso, la
 *   respuesta es la de API-NUT-19 (el mismo 404), sin ningún ítem.
 * - **Sin valores de salud.** Cada ítem dice qué es y cuándo ocurrió (la comida y su clase, la sesión, la versión), no
 *   cantidades, cargas ni medidas: esas se ven al abrir el origen, que vuelve a decidir con el PDP.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { OrigenDeDatoSchema } from './contratos-analisis';
import { FechaLocalSchema, PeriodoSchema, ReferenciaDeEvidenciaSchema } from './contratos-nutricion';

/** Lo que pasó con un elemento de la evidencia después de registrada la revisión. */
export const CambioPosteriorSchema = z.strictObject({
  /**
   * - `RECTIFIED`: la persona corrigió las cantidades de la comida;
   * - `CORRECTED`: una corrección del registro (la estimación del profesional de una comida, o la de una sesión);
   * - `ANNULLED`: la persona deshizo el registro, que quedó fuera de los totales;
   * - `SUCCEEDED`: se activó otra versión del plan, o rige otro objetivo.
   */
  kind: z.enum(['RECTIFIED', 'CORRECTED', 'ANNULLED', 'SUCCEEDED']),
  at: Instante,
});
export type CambioPosterior = z.infer<typeof CambioPosteriorSchema>;

/** Qué es el elemento, en palabras que no son datos de salud. */
export const QueEsLaEvidenciaSchema = z.discriminatedUnion('kind', [
  /** Una comida: la comida del plan en la que se registró (`null` si fue fuera de toda comida) y si es una opción del plan o algo diferente. */
  z.strictObject({ kind: z.literal('MEAL_RECORD'), meal: z.string().nullable(), recordKind: z.enum(['PLAN_OPTION', 'DIFFERENT']) }),
  /** Una sesión: el nombre de la sesión planificada («Piernas A»). */
  z.strictObject({ kind: z.literal('TRAINING_SESSION'), session: z.string().nullable() }),
  /** Una versión activada del plan, con su número por orden de activación («v2»). */
  z.strictObject({ kind: z.literal('PLAN_VERSION'), number: z.number().int().positive().nullable() }),
  /** Una versión del objetivo. */
  z.strictObject({ kind: z.literal('OBJECTIVE_VERSION') }),
  /** Una evaluación del área. */
  z.strictObject({ kind: z.literal('EVALUATION') }),
]);
export type QueEsLaEvidencia = z.infer<typeof QueEsLaEvidenciaSchema>;

export const EvidenciaResueltaSchema = z.strictObject({
  /** La referencia tal como la guardó la revisión. */
  reference: ReferenciaDeEvidenciaSchema,
  /** `NOT_FOUND`: la revisión la guardó, pero hoy no corresponde a este seguimiento. No se dice nada más de ella. */
  state: z.enum(['AVAILABLE', 'NOT_FOUND']),
  /** Lo que abre «Abrir registro», que vuelve a pasar por el PDP; `null` si BE no tiene una lectura para ese tipo. */
  source: OrigenDeDatoSchema.nullable(),
  /** La fecha civil del hecho (la comida, la sesión, la activación, desde cuándo rige el objetivo) y su instante. */
  occurredDate: FechaLocalSchema.nullable(),
  occurredAt: Instante.nullable(),
  what: QueEsLaEvidenciaSchema.nullable(),
  /** Lo que cambió después de registrada la revisión, del más viejo al más nuevo. */
  changesAfterReview: z.array(CambioPosteriorSchema),
});
export type EvidenciaResuelta = z.infer<typeof EvidenciaResueltaSchema>;

export const EvidenciaDeRevisionResponseSchema = z.strictObject({
  data: z.strictObject({
    reviewId: IdOpaco,
    area: z.enum(['NUTRITION', 'TRAINING']),
    period: PeriodoSchema,
    recordedAt: Instante,
    /** En el orden en que la revisión los guardó; vacía si la revisión no guardó evidencia. */
    items: z.array(EvidenciaResueltaSchema),
  }),
});
export type EvidenciaDeRevisionResponse = z.infer<typeof EvidenciaDeRevisionResponseSchema>;
