/**
 * Contratos de la importación controlada (WP-08): API-INT-NUT-02/03 (Open Food Facts) y API-INT-TRN-02/03 (wger),
 * 09 v0.12 §3-§7. Objetos estrictos, como todo el contrato (09v7 T12).
 *
 * El patrón es el del 09 (09v12:87-105): el proveedor responde → BE crea un **candidato** temporal y trazable → el
 * profesional lo revisa → lo incorpora al catálogo BE o lo rechaza. El candidato **no** es todavía un elemento del
 * catálogo, y quien lo resuelve es solo el profesional que lo pidió.
 *
 * Lo que el 09 no fija se define acá y está en DEUDA_LEGAJO DL-097 (docs/paquetes/WP-08.md, D-I):
 * - el formato del identificador externo de cada proveedor;
 * - `null` en cada dato que el proveedor no trajo: un faltante no es un cero (B10-10 §1);
 * - el contenido revisado con la misma forma que el candidato, y su completitud validada en el servicio, para que un
 *   faltante sea el `422 REVIEWED_CONTENT_INVALID` del 09 con la ruta de lo que falta;
 * - el éxito de TRN-03, «mismo patrón» que NUT-03 (09v12:369).
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { LicenciaExternaSchema, ProveedorExternoSchema } from './contratos-procedencia-externa';

const Sha256 = z.string().regex(/^[0-9a-f]{64}$/);
/** Fundamento opcional de la decisión: el 09 lo muestra como `"rationale": null` (09v12:252). */
const Fundamento = z.string().trim().max(500).nullable().optional();

// ─── Identificadores externos (D-I) ─────────────────────────────────────────────────────────────
/** Código de barras: EAN-8, UPC-A (12), EAN-13 o GTIN-14. Es lo que el profesional tiene en el envase. */
export const CodigoDeBarrasSchema = z.string().regex(/^(\d{8}|\d{12,14})$/);
/** Número de ejercicio de wger: entero positivo. */
export const NumeroDeEjercicioWgerSchema = z.string().regex(/^[1-9]\d{0,8}$/);

// ─── API-INT-NUT-02 / API-INT-TRN-02 — Crear candidato ──────────────────────────────────────────
export const CrearCandidatoDeAlimentoRequestSchema = z.strictObject({
  provider: z.literal('OPEN_FOOD_FACTS'),
  lookup: z.strictObject({ externalId: CodigoDeBarrasSchema }),
});
export type CrearCandidatoDeAlimentoRequest = z.infer<typeof CrearCandidatoDeAlimentoRequestSchema>;

export const CrearCandidatoDeEjercicioRequestSchema = z.strictObject({
  provider: z.literal('WGER'),
  lookup: z.strictObject({ externalId: NumeroDeEjercicioWgerSchema }),
});
export type CrearCandidatoDeEjercicioRequest = z.infer<typeof CrearCandidatoDeEjercicioRequestSchema>;

/** Un nutriente que el proveedor puede no traer: `null` es «no vino», nunca «vale cero». */
const NutrienteCandidato = z.number().nonnegative().finite().nullable();

/** La composición tal como llegó, cada 100 g o 100 ml, con lo que faltó en `null`. */
export const ComposicionCandidataSchema = z.strictObject({
  referenceAmount: z.enum(['100g', '100ml']),
  energyKcal: NutrienteCandidato,
  proteinG: NutrienteCandidato,
  carbohydrateG: NutrienteCandidato,
  fatG: NutrienteCandidato,
});
export type ComposicionCandidata = z.infer<typeof ComposicionCandidataSchema>;

export const AlimentoCandidatoSchema = z.strictObject({ name: z.string().nullable(), composition: ComposicionCandidataSchema });
export type AlimentoCandidato = z.infer<typeof AlimentoCandidatoSchema>;

/**
 * El ejercicio tal como lo describe wger. Los músculos y el material son **dato del proveedor**: se muestran para que el
 * profesional revise, y nunca se copian como zona BE (09v12:397-401; B10-06 §22).
 */
export const EjercicioCandidatoSchema = z.strictObject({
  name: z.string().nullable(),
  /** Idioma del nombre elegido: el español si wger lo tiene; si no, el inglés. */
  nameLanguage: z.enum(['es', 'en', 'other']).nullable(),
  category: z.string().nullable(),
  primaryMuscles: z.array(z.string()),
  secondaryMuscles: z.array(z.string()),
  equipment: z.array(z.string()),
});
export type EjercicioCandidato = z.infer<typeof EjercicioCandidatoSchema>;

/** Qué se recibió, de quién, cuándo y con qué licencia. `contentDigest` es el SHA-256 de lo recibido tal cual (D-C). */
export const ProcedenciaDeCandidatoSchema = z.strictObject({
  provider: ProveedorExternoSchema,
  externalId: z.string().min(1),
  receivedAt: Instante,
  contentDigest: Sha256,
  license: LicenciaExternaSchema,
  sourceUrl: z.string().min(1),
});
export type ProcedenciaDeCandidato = z.infer<typeof ProcedenciaDeCandidatoSchema>;

const baseDeCandidato = {
  candidateId: IdOpaco,
  externalId: z.string().min(1),
  receivedAt: Instante,
  /** Después de esta fecha el candidato ya no se puede resolver (D-C: 7 días). */
  expiresAt: Instante,
  provenance: ProcedenciaDeCandidatoSchema,
};
export const CandidatoDeAlimentoSchema = z.strictObject({ ...baseDeCandidato, provider: z.literal('OPEN_FOOD_FACTS'), candidate: AlimentoCandidatoSchema });
export type CandidatoDeAlimento = z.infer<typeof CandidatoDeAlimentoSchema>;
export const CandidatoDeEjercicioSchema = z.strictObject({ ...baseDeCandidato, provider: z.literal('WGER'), candidate: EjercicioCandidatoSchema });
export type CandidatoDeEjercicio = z.infer<typeof CandidatoDeEjercicioSchema>;
export const CandidatoDeAlimentoResponseSchema = z.strictObject({ data: CandidatoDeAlimentoSchema });
export const CandidatoDeEjercicioResponseSchema = z.strictObject({ data: CandidatoDeEjercicioSchema });

// ─── API-INT-NUT-03 / API-INT-TRN-03 — Resolver candidato ───────────────────────────────────────
/**
 * `IMPORT` con el contenido revisado —con la misma forma que el candidato, así que admite `null`— o `REJECT`. La
 * completitud se valida en el servicio: lo que falte es `422 REVIEWED_CONTENT_INVALID` con su ruta (D-I).
 */
export const ResolverCandidatoDeAlimentoRequestSchema = z.discriminatedUnion('decision', [
  z.strictObject({
    decision: z.literal('IMPORT'),
    reviewedContent: z.strictObject({ name: z.string().trim().max(120).nullable(), composition: ComposicionCandidataSchema }),
    rationale: Fundamento,
  }),
  z.strictObject({ decision: z.literal('REJECT'), rationale: Fundamento }),
]);
export type ResolverCandidatoDeAlimentoRequest = z.infer<typeof ResolverCandidatoDeAlimentoRequestSchema>;

export const ResolverCandidatoDeEjercicioRequestSchema = z.discriminatedUnion('decision', [
  z.strictObject({
    decision: z.literal('IMPORT'),
    reviewedContent: z.strictObject({ name: z.string().trim().max(120).nullable() }),
    rationale: Fundamento,
  }),
  z.strictObject({ decision: z.literal('REJECT'), rationale: Fundamento }),
]);
export type ResolverCandidatoDeEjercicioRequest = z.infer<typeof ResolverCandidatoDeEjercicioRequestSchema>;

const baseDeResolucion = {
  candidateId: IdOpaco,
  decision: z.enum(['IMPORT', 'REJECT']),
  /** Los datos que el profesional cambió respecto de lo que trajo el proveedor, por ruta. Vacío si no cambió nada. */
  correctedFields: z.array(z.string()),
  resolvedAt: Instante,
};
/** El éxito del 09 (09v12:277-289) más `candidateId`, `correctedFields` y `resolvedAt` (D-I). */
export const ResolucionDeAlimentoSchema = z.strictObject({
  ...baseDeResolucion,
  catalogItem: z.strictObject({ catalogItemId: IdOpaco, versionId: IdOpaco }).nullable(),
});
export type ResolucionDeAlimento = z.infer<typeof ResolucionDeAlimentoSchema>;
/** «Mismo patrón» (09v12:390), con el nombre que el catálogo de entrenamiento ya usa para sus elementos. */
export const ResolucionDeEjercicioSchema = z.strictObject({
  ...baseDeResolucion,
  exercise: z.strictObject({ exerciseId: IdOpaco, versionId: IdOpaco }).nullable(),
});
export type ResolucionDeEjercicio = z.infer<typeof ResolucionDeEjercicioSchema>;
export const ResolucionDeAlimentoResponseSchema = z.strictObject({ data: ResolucionDeAlimentoSchema });
export const ResolucionDeEjercicioResponseSchema = z.strictObject({ data: ResolucionDeEjercicioSchema });
