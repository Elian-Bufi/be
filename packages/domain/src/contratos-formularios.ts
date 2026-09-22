/**
 * Contratos HTTP de formularios de información profesional pertinente (09v16.1 §22: API-FRM-01 a 08). RF-071
 * (04:266-275), P0 — núcleo no recortable. Es transversal, no una pantalla de un dominio (docs/paquetes/WP-07.md §5).
 *
 * Tres cosas que el contrato **no** tiene, y que es lo importante:
 * - la Solicitud no amplía nunca vínculo, consentimiento ni acceso por sí sola (REG-06-210; 09:1528);
 * - la Respuesta es siempre `SELF_REPORTED`: nunca medición profesional, diagnóstico ni autorización (09 §22.7);
 * - no hay operación para crear una Plantilla: el catálogo es sintético, sembrado por migración (D-D, WP-07.md).
 *
 * `respondable` es una proyección del PDP en cada lectura, no un tercer estado de la Solicitud (D-B, WP-07.md;
 * 09:1610-1618; REG-06-213). La Solicitud tiene dos estados persistidos: `PENDING → RESPONDED`, sin retorno.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { SeleccionabilidadSchema } from './contratos-calculo';
import { AlcanceSchema, PaginaSchema, ResumenDeActorSchema, TokenDeVersionSchema } from './contratos-vinculo';

const Texto = (max: number) => z.string().trim().min(1).max(max);

// ─── Tipos comunes ──────────────────────────────────────────────────────────────────────────────

/**
 * Categoría de política del campo (08 §11-bis, adaptada a P0). Clasifica el contenido de un campo; no autoriza el
 * acceso por sí sola — la autorización real es Vínculo+Alcance+B2, evaluada por el PDP en cada operación (09:1509).
 */
/** Mismo conjunto que `CategoriaDeDato` de formularios.ts (lo verifica una prueba). */
export const CategoriaDeDatoSchema = z.enum(['SALUD_Y_SEGURIDAD', 'HABITOS_Y_CONTEXTO', 'OBJETIVOS_Y_PREFERENCIAS', 'DATOS_GENERALES']);

/** P0: TEXT/NUMBER/BOOLEAN. CHOICE/multi-select quedan fuera de este paquete (WP-07.md §9.3). */
export const TipoDeCampoSchema = z.enum(['TEXT', 'NUMBER', 'BOOLEAN']);

// ─── API-FRM-01/02 · plantillas ─────────────────────────────────────────────────────────────────

export const CampoDePlantillaSchema = z.strictObject({
  fieldCode: z.string().regex(/^[a-z][a-z0-9_]{0,63}$/),
  label: z.string(),
  dataType: TipoDeCampoSchema,
  /** Solo con sentido en `NUMBER`; `null` en los demás tipos. */
  unit: z.string().nullable(),
  category: CategoriaDeDatoSchema,
  helpText: z.string().nullable(),
});
export type CampoDePlantilla = z.infer<typeof CampoDePlantillaSchema>;

export const SeccionDePlantillaSchema = z.strictObject({
  sectionCode: z.string(),
  title: z.string(),
  fields: z.array(CampoDePlantillaSchema).min(1),
});

/** Metadatos C2 (09:1461). Una plantilla listada no prueba que todos sus campos puedan solicitarse a un asesorado
 *  concreto: la pertinencia se evalúa recién en FRM-03. */
export const PlantillaSchema = z.strictObject({
  templateId: IdOpaco,
  key: z.string(),
  name: z.string(),
  /** Descripción libre de para qué sirve la plantilla; distinto del `purpose` de una Solicitud concreta. */
  purpose: z.string(),
  /** `null`: la plantilla es transversal a los tres Alcances (D-D, catálogo domain-agnostic). */
  domain: AlcanceSchema.nullable(),
  status: SeleccionabilidadSchema,
  latestVersionId: IdOpaco,
  fieldCount: z.number().int().min(0),
  effectiveSince: Instante,
});
export type Plantilla = z.infer<typeof PlantillaSchema>;

export const ListaDePlantillasResponseSchema = z.strictObject({ data: z.array(PlantillaSchema), page: PaginaSchema });

/** No devuelve datos personales (09:1479): solo estructura (09v16.1 §22.2). */
export const VersionDePlantillaSchema = z.strictObject({
  templateId: IdOpaco,
  templateVersionId: IdOpaco,
  key: z.string(),
  name: z.string(),
  purpose: z.string(),
  domain: AlcanceSchema.nullable(),
  version: z.string(),
  status: SeleccionabilidadSchema,
  sections: z.array(SeccionDePlantillaSchema).min(1),
  /** La versión que sucede a esta, si dejó de ser seleccionable. Nunca se elimina (REG-06-209). */
  supersededByVersionId: IdOpaco.nullable(),
  effectiveSince: Instante,
  /** Rótulo obligatorio: el catálogo es sintético de demostración (D-D). */
  provenanceNote: z.string(),
});
export type VersionDePlantilla = z.infer<typeof VersionDePlantillaSchema>;

export const VersionDePlantillaResponseSchema = z.strictObject({ data: VersionDePlantillaSchema });

// ─── API-FRM-03 · crear solicitud ───────────────────────────────────────────────────────────────

export const EstadoDeSolicitudDeFormularioSchema = z.enum(['PENDING', 'RESPONDED']);

export const CrearSolicitudDeFormularioRequestSchema = z.strictObject({
  templateVersionId: IdOpaco,
  /** Justificación libre de esta Solicitud concreta; no es un catálogo cerrado (09:1500, ejemplo conceptual). */
  purpose: Texto(300),
  scope: AlcanceSchema,
  requestedFieldCodes: z.array(z.string()).min(1).max(60),
  /** Subconjunto de `requestedFieldCodes`; la inclusión se valida en el dominio (422 FORM_REQUEST_INVALID). */
  requiredFieldCodes: z.array(z.string()).max(60),
});
export type CrearSolicitudDeFormularioRequest = z.infer<typeof CrearSolicitudDeFormularioRequestSchema>;

/** Éxito `201` de FRM-03 (09:1521-1535): solo lo que el propio profesional acaba de pedir, nada server-owned más
 *  allá del estado inicial — `professionalId`/`relationshipId`/`consentVersionId` no viajan en la respuesta. */
export const SolicitudDeFormularioCreadaSchema = z.strictObject({
  formRequestId: IdOpaco,
  templateVersionId: IdOpaco,
  purpose: z.string(),
  scope: AlcanceSchema,
  requestedFieldCodes: z.array(z.string()),
  requiredFieldCodes: z.array(z.string()),
  status: z.literal('PENDING'),
  createdAt: Instante,
});
export const SolicitudDeFormularioCreadaResponseSchema = z.strictObject({ data: SolicitudDeFormularioCreadaSchema });

// ─── API-FRM-04/05/06 · consultar solicitudes ───────────────────────────────────────────────────

/** T-06-76 (06:8506-8533). Lo que el profesional ve al listar o consultar una Solicitud propia. */
export const SolicitudDeFormularioSchema = z.strictObject({
  formRequestId: IdOpaco,
  professional: ResumenDeActorSchema,
  advisee: ResumenDeActorSchema,
  relationshipId: IdOpaco,
  purpose: z.string(),
  scope: AlcanceSchema,
  /** La plantilla y la versión exacta: con las dos, quien responde puede pedir su estructura a FRM-02 (DL-095). */
  templateId: IdOpaco,
  templateVersionId: IdOpaco,
  templateName: z.string(),
  requestedFieldCodes: z.array(z.string()),
  requiredFieldCodes: z.array(z.string()),
  status: EstadoDeSolicitudDeFormularioSchema,
  createdAt: Instante,
});
export type SolicitudDeFormulario = z.infer<typeof SolicitudDeFormularioSchema>;

export const ListaDeSolicitudesDeFormularioResponseSchema = z.strictObject({ data: z.array(SolicitudDeFormularioSchema), page: PaginaSchema });

/** API-FRM-06 (09:1601-1618): agrega `respondable`, proyección del PDP — no un estado nuevo. */
export const SolicitudPropiaSchema = SolicitudDeFormularioSchema.extend({ respondable: z.boolean() });
export type SolicitudPropia = z.infer<typeof SolicitudPropiaSchema>;

export const ListaDeSolicitudesPropiasResponseSchema = z.strictObject({ data: z.array(SolicitudPropiaSchema), page: PaginaSchema });

// ─── Respuesta: original + rectificaciones + vista efectiva (mismo patrón que ejecución de TRN) ────

export const RespuestaDeCampoSchema = z.strictObject({
  fieldCode: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  unit: z.string().nullable(),
  /** Referencia a un dato propio reutilizado; reutilizar perfil preserva la procedencia real (09:1583-1585). */
  profileSourceRef: IdOpaco.nullable(),
  /** Invariante, nunca variable: cada respuesta queda `SELF_REPORTED` (09:1581; TEST-FRM-003). */
  provenance: z.literal('SELF_REPORTED'),
});
export type RespuestaDeCampo = z.infer<typeof RespuestaDeCampoSchema>;

/**
 * La entrada de una respuesta o rectificación. Un campo opcional que el actor no quiere responder se **omite** del
 * arreglo — nunca se envía con un valor vacío o por defecto (09:1586-1587; TEST-FRM-005).
 */
export const RespuestaDeCampoEntradaSchema = z.strictObject({
  fieldCode: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  unit: z.string().nullable().optional(),
  profileSourceRef: IdOpaco.nullable().optional(),
});
export type RespuestaDeCampoEntrada = z.infer<typeof RespuestaDeCampoEntradaSchema>;

export const EnviarRespuestaRequestSchema = z.strictObject({ answers: z.array(RespuestaDeCampoEntradaSchema).min(1).max(60) });
export type EnviarRespuestaRequest = z.infer<typeof EnviarRespuestaRequestSchema>;

/** Éxito `201` de FRM-07 (09:1595-1596): mínimo, sin volver a listar las respuestas enviadas. */
export const RespuestaCreadaSchema = z.strictObject({ formResponseId: IdOpaco, version: TokenDeVersionSchema, submittedAt: Instante });
export const RespuestaCreadaResponseSchema = z.strictObject({ data: RespuestaCreadaSchema });

export const RectificacionDeRespuestaSchema = z.strictObject({
  rectificationId: IdOpaco,
  previousRectificationId: IdOpaco.nullable(),
  reason: z.string(),
  /** El conjunto de respuestas de esta rectificación, completo. La original no se toca (09:1618, «no overwrite»). */
  answers: z.array(RespuestaDeCampoSchema),
  version: TokenDeVersionSchema,
  recordedAt: Instante,
});
export type RectificacionDeRespuesta = z.infer<typeof RectificacionDeRespuestaSchema>;

/** Vista efectiva por respuesta (REG-06-16 vía `resolverVistaEfectiva`): la rectificación terminal, la original, o
 *  `NOT_RESOLVABLE` si la cadena no se puede resolver para el actor. */
export const VistaEfectivaDeRespuestaSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('ORIGINAL') }),
  z.strictObject({ kind: z.literal('RECTIFIED'), rectificationId: IdOpaco }),
  z.strictObject({ kind: z.literal('NOT_RESOLVABLE') }),
]);

export const RespuestaDeFormularioSchema = z.strictObject({
  formResponseId: IdOpaco,
  formRequestId: IdOpaco,
  adviseeId: IdOpaco,
  templateVersionId: IdOpaco,
  original: z.strictObject({ answers: z.array(RespuestaDeCampoSchema) }),
  rectifications: z.array(RectificacionDeRespuestaSchema),
  effectiveView: VistaEfectivaDeRespuestaSchema,
  version: TokenDeVersionSchema,
  submittedAt: Instante,
});
export type RespuestaDeFormulario = z.infer<typeof RespuestaDeFormularioSchema>;

// ─── API-FRM-05 · detalle actor-scoped ──────────────────────────────────────────────────────────

/**
 * Misma ruta, misma forma para los dos actores permitidos (09:1543-1565): la proyección actor-scoped se realiza por
 * *si* la API responde `200` o el `404` no revelador — nunca por una forma de JSON distinta que exponga
 * autorizaciones internas ajenas (09:1565).
 */
export const DetalleDeSolicitudSchema = z.strictObject({
  request: SolicitudDeFormularioSchema,
  response: RespuestaDeFormularioSchema.nullable(),
});
export const DetalleDeSolicitudResponseSchema = z.strictObject({ data: DetalleDeSolicitudSchema });

// ─── API-FRM-08 · rectificar respuesta propia ───────────────────────────────────────────────────

export const RectificarRespuestaRequestSchema = z.strictObject({
  expectedVersion: TokenDeVersionSchema,
  reason: Texto(1000),
  answers: z.array(RespuestaDeCampoEntradaSchema).min(1).max(60),
});
export type RectificarRespuestaRequest = z.infer<typeof RectificarRespuestaRequestSchema>;

export const RectificacionCreadaSchema = z.strictObject({
  formResponseId: IdOpaco,
  rectificationId: IdOpaco,
  version: TokenDeVersionSchema,
  recordedAt: Instante,
});
export const RectificacionCreadaResponseSchema = z.strictObject({ data: RectificacionCreadaSchema });
