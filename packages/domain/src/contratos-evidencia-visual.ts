/**
 * `EVIDENCIA_VISUAL` (08 §12.4 y §21.3; precierre del 2026-10-06, §6): la información destacada de las fotos de comidas,
 * registrada como un acto por cada alcance de Nutrición («B2 reforzado»). No es un consentimiento por foto: se registra
 * una vez por profesional, al habilitar la categoría, y es revocable.
 *
 * **El 09 no define estas operaciones.** Son una propuesta, en una familia propia de BE (API-EVI-01 a 04; DEUDA_LEGAJO
 * DL-125), para no tomar números de la familia CON del 09 (DL-116). Tienen la forma de las operaciones CON:
 * - el requisito, como API-CON-01: lo pide solo el asesorado titular del vínculo;
 * - otorgar, como API-CON-02: el cliente manda la versión que mostró y nada más (la versión mostrada es la aceptada);
 * - la lista propia, como API-CON-07, sin IP ni agente de usuario;
 * - revocar, como API-CON-08: idempotente por semántica, sin Idempotency-Key.
 *
 * Objetos estrictos, como el resto de los contratos (09v7 T12).
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { EstadoDeConsentimientoApiSchema, PaginaSchema, ResumenDeActorSchema, ResumenDeAlcanceSchema } from './contratos-vinculo';

/** La categoría informada. Una sola: las fotos de comidas (los medios `MEAL_EVIDENCE`). */
export const CategoriaDeEvidenciaVisualSchema = z.enum(['MEAL_PHOTOS']);
export type CategoriaDeEvidenciaVisual = z.infer<typeof CategoriaDeEvidenciaVisualSchema>;

/** Si el texto mostrado está aprobado. `PENDING_APPROVAL`: es una propuesta (`VERSIONES_PROPUESTAS`). */
export const AprobacionDelTextoSchema = z.enum(['PENDING_APPROVAL', 'APPROVED']);
export type AprobacionDelTexto = z.infer<typeof AprobacionDelTextoSchema>;

// ─── API-EVI-01 — El requisito de un vínculo propio ─────────────────────────────────────────────
export const RequisitoDeEvidenciaVisualResponseSchema = z.strictObject({
  data: z.strictObject({
    relationshipId: IdOpaco,
    professional: ResumenDeActorSchema,
    scope: ResumenDeAlcanceSchema,
    category: CategoriaDeEvidenciaVisualSchema,
    consentVersion: z.strictObject({ id: IdOpaco, title: z.string(), text: z.string(), textHash: z.string(), effectiveFrom: Instante }),
    textApproval: AprobacionDelTextoSchema,
    /**
     * `false`: la API todavía no exige el acto para subir ni para ver fotos. La exigencia se activa con
     * `BE_EVIDENCIA_VISUAL_EXIGIDA`, que es una decisión de Dirección.
     */
    enforced: z.boolean(),
    /** El acto vigente para este vínculo, si hay uno. */
    currentConsent: z.strictObject({ consentId: IdOpaco, consentVersionId: IdOpaco, acceptedAt: Instante }).nullable(),
  }),
});
export type RequisitoDeEvidenciaVisualResponse = z.infer<typeof RequisitoDeEvidenciaVisualResponseSchema>;

// ─── API-EVI-02 — Otorgar ───────────────────────────────────────────────────────────────────────
/** Profesional, alcance, categoría y hash son del servidor: el cliente solo dice qué versión mostró. */
export const OtorgarEvidenciaVisualRequestSchema = z.strictObject({ consentVersionId: IdOpaco });
export type OtorgarEvidenciaVisualRequest = z.infer<typeof OtorgarEvidenciaVisualRequestSchema>;

export const ActoDeEvidenciaVisualSchema = z.strictObject({
  consentId: IdOpaco,
  type: z.literal('VISUAL_EVIDENCE'),
  relationshipId: IdOpaco,
  professional: ResumenDeActorSchema,
  scope: ResumenDeAlcanceSchema,
  category: CategoriaDeEvidenciaVisualSchema,
  consentVersionId: IdOpaco,
  state: EstadoDeConsentimientoApiSchema,
  acceptedAt: Instante,
  revokedAt: Instante.nullable(),
});
export type ActoDeEvidenciaVisual = z.infer<typeof ActoDeEvidenciaVisualSchema>;

export const EvidenciaVisualOtorgadaResponseSchema = z.strictObject({ data: ActoDeEvidenciaVisualSchema });
export type EvidenciaVisualOtorgadaResponse = z.infer<typeof EvidenciaVisualOtorgadaResponseSchema>;

// ─── API-EVI-03 — Los actos propios ─────────────────────────────────────────────────────────────
export const ListaDeEvidenciaVisualResponseSchema = z.strictObject({ data: z.array(ActoDeEvidenciaVisualSchema), page: PaginaSchema });
export type ListaDeEvidenciaVisualResponse = z.infer<typeof ListaDeEvidenciaVisualResponseSchema>;

// ─── API-EVI-04 — Revocar: responde `ConsentimientoRevocadoResponseSchema`, como API-CON-04 y 08 ─────

/**
 * `error.details` del 403 `VISUAL_EVIDENCE_ACT_REQUIRED` de API-MED-01: el vínculo para el que falta el acto y la versión
 * que hay que mostrar. Con eso, el cliente pide el texto (API-EVI-01), lo muestra y lo registra (API-EVI-02).
 */
export const DetalleDeEvidenciaVisualRequeridaSchema = z.strictObject({ relationshipId: IdOpaco, consentVersionId: IdOpaco });
export type DetalleDeEvidenciaVisualRequerida = z.infer<typeof DetalleDeEvidenciaVisualRequeridaSchema>;
