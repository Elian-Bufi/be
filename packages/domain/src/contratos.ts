/**
 * Contratos HTTP de WP-02 como schemas compartidos (09v7 T21: «No se permite mantener manualmente
 * otra definición equivalente en los clientes»). La API valida requests y respuestas con estos schemas,
 * el website y el APK compilan contra sus tipos, y el OpenAPI se genera desde aquí.
 *
 * Fuentes: 09v8 §4 (API-ACC-01…05), 09v12 (API-ACC-P1-03), 09 §32 (API-CON-05), 09v7 T02/T03/T12/T13.
 * Objetos estrictos: un campo no declarado → 400 UNKNOWN_FIELD (09v7 T12).
 */
import { z } from 'zod';

/** Tipo de cualquier schema de contrato: las apps validan con él sin depender de su propia copia de zod. */
export type EsquemaDeContrato = z.ZodType;
export type SalidaDe<S extends EsquemaDeContrato> = z.output<S>;

// ─── Catálogo de códigos de error (09v7 §4 + fichas de familia) ───────────────────────────────
export const CodigoDeError = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNKNOWN_FIELD: 'UNKNOWN_FIELD',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  SESSION_INVALID: 'SESSION_INVALID',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  STEP_UP_REQUIRED: 'STEP_UP_REQUIRED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  IDEMPOTENCY_KEY_REUSED: 'IDEMPOTENCY_KEY_REUSED',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  DB_UNAVAILABLE: 'DB_UNAVAILABLE',
  DEPENDENCY_UNAVAILABLE: 'DEPENDENCY_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  // ACC (09v8)
  REGISTRATION_NOT_AVAILABLE: 'REGISTRATION_NOT_AVAILABLE',
  TERMS_VERSION_NOT_ACCEPTABLE: 'TERMS_VERSION_NOT_ACCEPTABLE',
  PRIVACY_VERSION_NOT_ACCEPTABLE: 'PRIVACY_VERSION_NOT_ACCEPTABLE',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  /** API-ACC-06 (09v8:509-554): el nombre visible no se puede guardar (DL-009 y DL-040, 2026-10-15). */
  INVALID_PROFILE_DATA: 'INVALID_PROFILE_DATA',
  // Transversales que aparecen con WP-03 (09v7 §4)
  VERSION_CONFLICT: 'VERSION_CONFLICT',
  ACTION_FORBIDDEN: 'ACTION_FORBIDDEN',
  INVALID_CURSOR: 'INVALID_CURSOR',
  // REL y CON (09v8:1807-1826; 09:2513-2516)
  PURPOSE_REQUIRED: 'PURPOSE_REQUIRED',
  SCOPE_NOT_AVAILABLE: 'SCOPE_NOT_AVAILABLE',
  COUNTERPART_NOT_ELIGIBLE: 'COUNTERPART_NOT_ELIGIBLE',
  CONSENT_VERSION_STALE: 'CONSENT_VERSION_STALE',
  RELATIONSHIP_NOT_READY_FOR_CONSENT: 'RELATIONSHIP_NOT_READY_FOR_CONSENT',
  CONSENT_ALREADY_ACTIVE: 'CONSENT_ALREADY_ACTIVE',
  HEALTH_DATA_CONSENT_NOT_AVAILABLE: 'HEALTH_DATA_CONSENT_NOT_AVAILABLE',
  // NUT e INT-NUT (09v9 §6-§27; CONS §11.2; 09v12). NUTRITION_SCOPE_NOT_OPERATIONAL no se emite: la precedencia
  // del 09 (09:213-233) lo vuelve un 404 indistinguible (DEUDA_LEGAJO DL-055).
  NUTRITION_EVALUATION_INVALID: 'NUTRITION_EVALUATION_INVALID',
  NUTRITION_OBJECTIVE_INVALID: 'NUTRITION_OBJECTIVE_INVALID',
  EVALUATION_NOT_COMPATIBLE: 'EVALUATION_NOT_COMPATIBLE',
  OBJECTIVE_NOT_EFFECTIVE_OR_COMPATIBLE: 'OBJECTIVE_NOT_EFFECTIVE_OR_COMPATIBLE',
  PLAN_NOT_EDITABLE: 'PLAN_NOT_EDITABLE',
  NUTRITION_PLAN_STRUCTURE_INVALID: 'NUTRITION_PLAN_STRUCTURE_INVALID',
  CATALOG_REFERENCE_INVALID: 'CATALOG_REFERENCE_INVALID',
  EXCHANGE_MODE_NOT_AVAILABLE: 'EXCHANGE_MODE_NOT_AVAILABLE',
  ACTIVE_PLAN_CONFLICT: 'ACTIVE_PLAN_CONFLICT',
  OPERATION_NOT_READY: 'OPERATION_NOT_READY',
  CAPACITY_NOT_AVAILABLE: 'CAPACITY_NOT_AVAILABLE',
  EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY: 'EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY',
  ACTIVE_PLAN_REQUIRED: 'ACTIVE_PLAN_REQUIRED',
  RECORDING_MODE_NOT_AVAILABLE: 'RECORDING_MODE_NOT_AVAILABLE',
  NUTRITION_EXECUTION_INVALID: 'NUTRITION_EXECUTION_INVALID',
  REVIEW_EVIDENCE_NOT_RECONSTRUCTIBLE: 'REVIEW_EVIDENCE_NOT_RECONSTRUCTIBLE',
  REVIEW_COMPONENT_REQUIRED: 'REVIEW_COMPONENT_REQUIRED',
  REVIEW_RESULT_INVALID: 'REVIEW_RESULT_INVALID',
  REVIEW_NOT_ALLOWED: 'REVIEW_NOT_ALLOWED',
  REVIEW_ALREADY_APPLIED: 'REVIEW_ALREADY_APPLIED',
  CONTINUITY_ACTION_NOT_APPLICABLE: 'CONTINUITY_ACTION_NOT_APPLICABLE',
  REVIEW_NOT_VALID_FOR_APPLICATION: 'REVIEW_NOT_VALID_FOR_APPLICATION',
  NUTRITION_FREE_DESCRIPTION_REQUIRED: 'NUTRITION_FREE_DESCRIPTION_REQUIRED',
  STRUCTURED_ESTIMATE_INVALID: 'STRUCTURED_ESTIMATE_INVALID',
  CORRECTION_NOT_ALLOWED: 'CORRECTION_NOT_ALLOWED',
  // ANT (09v11; CONS v0.16 §23 y §24). ANTHROPOMETRY_SCOPE_NOT_OPERATIONAL no se emite, por la misma precedencia
  // que en nutrición: es un 404 indistinguible (09:213-233).
  ANTHROPOMETRY_EVALUATION_NOT_EDITABLE: 'ANTHROPOMETRY_EVALUATION_NOT_EDITABLE',
  ANTHROPOMETRY_EVALUATION_INVALID: 'ANTHROPOMETRY_EVALUATION_INVALID',
  ANTHROPOMETRY_MEASUREMENT_INVALID: 'ANTHROPOMETRY_MEASUREMENT_INVALID',
  SPECIFICATION_REFERENCE_INVALID: 'SPECIFICATION_REFERENCE_INVALID',
  ANTHROPOMETRY_ANNULMENT_NOT_ALLOWED: 'ANTHROPOMETRY_ANNULMENT_NOT_ALLOWED',
  // MTH y CAL (09v16 §21). El patrón transversal de cálculo reproducible (T-06-N12; REG-06-202 a 207).
  METHOD_VERSION_NOT_SELECTABLE: 'METHOD_VERSION_NOT_SELECTABLE',
  CALCULATION_INPUTS_INSUFFICIENT: 'CALCULATION_INPUTS_INSUFFICIENT',
  CALCULATION_NOT_REPRODUCIBLE: 'CALCULATION_NOT_REPRODUCIBLE',
  CALCULATION_REFERENCE_NOT_COMPATIBLE: 'CALCULATION_REFERENCE_NOT_COMPATIBLE',
  UNIT_NOT_COMPATIBLE: 'UNIT_NOT_COMPATIBLE',
  // TRN (09v10 §41). Los compartidos con nutrición (PLAN_NOT_EDITABLE, ACTIVE_PLAN_CONFLICT, CAPACITY_NOT_AVAILABLE,
  // ACTIVE_PLAN_REQUIRED, EVALUATION_NOT_COMPATIBLE, los de revisión) no se repiten: son el mismo registro común.
  // TRAINING_SCOPE_NOT_OPERATIONAL no se emite, por la misma precedencia que en los otros dos dominios (09:213-233).
  TRAINING_EVALUATION_INVALID: 'TRAINING_EVALUATION_INVALID',
  TRAINING_OBJECTIVE_INVALID: 'TRAINING_OBJECTIVE_INVALID',
  TRAINING_PLAN_STRUCTURE_INVALID: 'TRAINING_PLAN_STRUCTURE_INVALID',
  EXERCISE_REFERENCE_INVALID: 'EXERCISE_REFERENCE_INVALID',
  /** PF-09 (DL-108): plantillas del profesional. */
  TEMPLATE_NAME_TAKEN: 'TEMPLATE_NAME_TAKEN',
  TEMPLATE_ARCHIVED: 'TEMPLATE_ARCHIVED',
  /** PF-09 bis (DL-109): «Mis habituales»; otra sesión o comida habitual activa ya tiene ese nombre. */
  PRESET_NAME_TAKEN: 'PRESET_NAME_TAKEN',
  INTENSITY_CRITERION_INVALID: 'INTENSITY_CRITERION_INVALID',
  OCCURRENCE_NOT_EXECUTABLE: 'OCCURRENCE_NOT_EXECUTABLE',
  EXECUTION_DRAFT_NOT_READY: 'EXECUTION_DRAFT_NOT_READY',
  EXECUTION_ALREADY_REGISTERED: 'EXECUTION_ALREADY_REGISTERED',
  EXECUTION_GRANULARITY_INVALID: 'EXECUTION_GRANULARITY_INVALID',
  SESSION_CONDITION_INVALID: 'SESSION_CONDITION_INVALID',
  EXECUTION_VALUE_INVALID: 'EXECUTION_VALUE_INVALID',
  /**
   * Un plan con objetivos distintos por serie no se activa mientras su titular no haya usado una APK que los muestre: las
   * instaladas mostrarían los generales (DL-122, precierre del 2026-10-06, §2; `compatibilidad-de-clientes.ts`).
   */
  CLIENT_CAPABILITY_REQUIRED: 'CLIENT_CAPABILITY_REQUIRED',
  // FRM (09v16.1 §22). Solicitar y completar información profesional pertinente (RF-071; WP-07).
  FORM_TEMPLATE_NOT_SELECTABLE: 'FORM_TEMPLATE_NOT_SELECTABLE',
  FORM_REQUEST_NOT_ALLOWED: 'FORM_REQUEST_NOT_ALLOWED',
  FORM_REQUEST_INVALID: 'FORM_REQUEST_INVALID',
  FORM_REQUEST_NOT_RESPONDABLE: 'FORM_REQUEST_NOT_RESPONDABLE',
  FORM_RESPONSE_RECTIFICATION_NOT_ALLOWED: 'FORM_RESPONSE_RECTIFICATION_NOT_ALLOWED',
  FORM_RESPONSE_INVALID: 'FORM_RESPONSE_INVALID',
  // INT (09v12 §5-§7). Importación controlada de Open Food Facts y wger (RF-028, RF-038; WP-08).
  IMPORT_CANDIDATE_NOT_RESOLVABLE: 'IMPORT_CANDIDATE_NOT_RESOLVABLE',
  REVIEWED_CONTENT_INVALID: 'REVIEWED_CONTENT_INVALID',
  /** El proveedor respondió que no conoce ese identificador: no es una caída (WP-08 D-E; DL-097). */
  IMPORT_SOURCE_NOT_FOUND: 'IMPORT_SOURCE_NOT_FOUND',
  // MED (09v8 API-PRO-04; 09v12 §24; DL-120). Los dos primeros son los del 09 para una subida.
  FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
  FILE_SIZE_NOT_ALLOWED: 'FILE_SIZE_NOT_ALLOWED',
  /** Los bytes no se decodifican como el tipo declarado, o la imagen sale de las dimensiones admitidas (DL-120). */
  FILE_CONTENT_INVALID: 'FILE_CONTENT_INVALID',
  /** Un medio citado en el cuerpo no es propio, no está disponible o no es de esa finalidad (DL-119, DL-121). */
  MEDIA_REFERENCE_INVALID: 'MEDIA_REFERENCE_INVALID',
  /**
   * Falta el acto `EVIDENCIA_VISUAL` (08 §12.4) del vínculo de Nutrición para subir la foto de una comida. Solo con la
   * exigencia activa (`BE_EVIDENCIA_VISUAL_EXIGIDA`). `details` dice el vínculo y la versión del texto a mostrar
   * (precierre del 2026-10-06, §6; DL-125).
   */
  VISUAL_EVIDENCE_ACT_REQUIRED: 'VISUAL_EVIDENCE_ACT_REQUIRED',
  // INV (familia propia de BE; WP-INVITACION, DL-136). Quien los recibe tiene el token o el código: decir por qué ya no
  // sirve no revela nada que no tenga. Una invitación que no existe responde 404 RESOURCE_NOT_FOUND, igual que un código mal
  // escrito.
  /** Pasaron los 7 días sin que nadie la usara. */
  INVITATION_EXPIRED: 'INVITATION_EXPIRED',
  /** Ya la usó alguien (también quien pierde entre dos usos simultáneos). Es de un solo uso. */
  INVITATION_USED: 'INVITATION_USED',
  /** El profesional la anuló. */
  INVITATION_REVOKED: 'INVITATION_REVOKED',
  // GOO (familia propia de BE; WP-ACCESO-GOOGLE, DL-138). Quien los recibe tiene un ID token válido de Google para ese
  // correo: lo que se le dice es sobre su propia cuenta, no revela la de otro (08 §24.5). Google sin configurar o caído
  // responde 503 DEPENDENCY_UNAVAILABLE, con el acceso local disponible (UC-E05 E01).
  /** El ID token no se pudo verificar: firma, emisor, audiencia, vencimiento o forma. */
  GOOGLE_TOKEN_INVALID: 'GOOGLE_TOKEN_INVALID',
  /** Google no verificó el correo de esa cuenta: BE no lo puede usar para encontrar ni crear una cuenta. */
  GOOGLE_EMAIL_NOT_VERIFIED: 'GOOGLE_EMAIL_NOT_VERIFIED',
  /** Hay una cuenta BE con contraseña y ese correo: vincular Google exige confirmar la contraseña (API-GOO-02). */
  GOOGLE_LINK_REQUIRED: 'GOOGLE_LINK_REQUIRED',
  /** Ninguna cuenta BE usa esa cuenta de Google ni ese correo: el cliente ofrece crearla (API-GOO-03). */
  GOOGLE_ACCOUNT_NOT_FOUND: 'GOOGLE_ACCOUNT_NOT_FOUND',
  /** La cuenta BE ya tiene otra cuenta de Google, o esa cuenta de Google ya es de otra cuenta BE. */
  GOOGLE_ACCOUNT_ALREADY_LINKED: 'GOOGLE_ACCOUNT_ALREADY_LINKED',
  // CRD (09 §11.6; WP-NOTAS-DE-COORDINACION, DL-140). Quien los recibe ya está autorizado sobre la persona: el autor sin
  // acceso recibe antes el 404 neutral (UC-E07, paso 3).
  /**
   * UC-E07 E01: la nota no tiene a quién llegar con esa visibilidad. El profesional elegido no la acompaña hoy con su
   * autorización vigente, o con «todos» no hay ningún otro que la acompañe. `details.issues` dice cuál.
   */
  COORDINATION_RECIPIENT_NOT_AVAILABLE: 'COORDINATION_RECIPIENT_NOT_AVAILABLE',
  /**
   * CRD-D5 y CRD-D7: algo citado no se puede citar (no existe, no es del autor con esta persona, no es de su área de origen
   * o no está registrado), o la nota que dice corregir no es una nota suya sobre esta persona. `details.issues` dice cuál.
   */
  COORDINATION_REFERENCE_INVALID: 'COORDINATION_REFERENCE_INVALID',
  // ADM (familia propia de BE; WP-ADMINISTRACION, DL-155). El 09 ya registra MFA_REQUIRED (09v7 §4.3) y RATIONALE_REQUIRED
  // (09v8 PRO-11); los demás son del acceso administrativo con segundo factor (08 §25).
  /** La sesión administrativa no tiene el segundo factor vigente: falta, venció por inactividad o falta configurarlo. */
  MFA_REQUIRED: 'MFA_REQUIRED',
  /** Una decisión administrativa sin fundamento (09v8 PRO-11). */
  RATIONALE_REQUIRED: 'RATIONALE_REQUIRED',
  /** El código del autenticador o de recuperación no vale: incorrecto, vencido o ya usado. `details.attemptsRemaining`. */
  SECOND_FACTOR_INVALID: 'SECOND_FACTOR_INVALID',
  /**
   * El autenticador quedó bloqueado por demasiados códigos que no valen seguidos (en cualquier sesión). Se entra con un
   * código de recuperación, que lo desbloquea, o el operador restablece el segundo factor.
   */
  SECOND_FACTOR_LOCKED: 'SECOND_FACTOR_LOCKED',
  /** El código de incorporación no vale: incorrecto, vencido, usado o anulado. */
  INCORPORATION_CODE_INVALID: 'INCORPORATION_CODE_INVALID',
  /** La administración no está configurada en este ambiente (falta la clave del segundo factor). */
  ADMINISTRATION_NOT_AVAILABLE: 'ADMINISTRATION_NOT_AVAILABLE',
} as const;
export type CodigoDeError = (typeof CodigoDeError)[keyof typeof CodigoDeError];

export const ValidationIssueSchema = z.strictObject({ code: z.string(), path: z.string() });
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;

export const ErrorEnvelopeSchema = z.strictObject({
  error: z.strictObject({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

// ─── Tipos comunes ──────────────────────────────────────────────────────────────────────────────
/** 09v8 §3.1 — no es un rol de autorización. */
export const RegistrationIntentSchema = z.enum(['ADVISEE', 'PROFESSIONAL']);
export type RegistrationIntent = z.infer<typeof RegistrationIntentSchema>;

/** Tokens canónicos del 06 §5.7.2 (09v8: `"<canonical-06>"`). */
export const AccountOperationalStateSchema = z.enum(['OPERATIVA', 'SUSPENDIDA', 'CERRADA']);

/** 09v7 T13 — instante RFC 3339 con offset, transporte en UTC. */
export const Instante = z.iso.datetime({ offset: true });
export const IdOpaco = z.string().min(1);

// ─── API-ACC-01 — Registrar identidad ───────────────────────────────────────────────────────────
/**
 * 08 §24.7 a: «el alta requiere declaración de fecha de nacimiento/mayoría de edad» (gate §42, ítem 22). BE pide la
 * declaración, con la versión del texto que la persona vio, como A1 y A2 (08 §12.2), y `declared: true` (DL-138). En el
 * schema es optativa para que la API responda un 422 preciso, y no un 400 de forma: sin ella no hay alta.
 */
export const DeclaracionDeMayoriaDeEdadSchema = z.strictObject({ versionId: IdOpaco, declared: z.boolean() });
export type DeclaracionDeMayoriaDeEdad = z.infer<typeof DeclaracionDeMayoriaDeEdadSchema>;

export const RegistrarIdentidadRequestSchema = z.strictObject({
  registrationIntent: RegistrationIntentSchema,
  identity: z.strictObject({
    localIdentifier: z.string(),
    localCredential: z.string(),
  }),
  /** «campos mínimos definidos por 04/05»: ninguno aprobado todavía (DEUDA_LEGAJO DL-009). */
  profile: z.strictObject({}).optional(),
  termsAcceptance: z.strictObject({ versionId: IdOpaco }),
  privacyAcknowledgement: z.strictObject({ versionId: IdOpaco }),
  /** Obligatoria desde DL-138 (2026-10-16); ver `DeclaracionDeMayoriaDeEdadSchema`. */
  adultDeclaration: DeclaracionDeMayoriaDeEdadSchema.optional(),
});
export type RegistrarIdentidadRequest = z.infer<typeof RegistrarIdentidadRequestSchema>;

export const RegistrarIdentidadResponseSchema = z.strictObject({
  data: z.strictObject({
    identityId: IdOpaco,
    registrationIntent: RegistrationIntentSchema,
    accountOperationalState: AccountOperationalStateSchema,
    createdAt: Instante,
  }),
});
export type RegistrarIdentidadResponse = z.infer<typeof RegistrarIdentidadResponseSchema>;

// ─── API-ACC-02 — Iniciar sesión local ──────────────────────────────────────────────────────────
export const IniciarSesionRequestSchema = z.strictObject({
  method: z.literal('LOCAL'),
  identifier: z.string(),
  credential: z.string(),
});
export type IniciarSesionRequest = z.infer<typeof IniciarSesionRequestSchema>;

/**
 * «El mecanismo de entrega de la credencial activa se documentará en el OpenAPI/implementación concreta»
 * (09v8). Se entrega en el body como Bearer; el cliente la guarda solo en memoria (DEUDA_LEGAJO DL-012).
 */
export const IniciarSesionResponseSchema = z.strictObject({
  data: z.strictObject({
    session: z.strictObject({
      id: IdOpaco,
      expiresAt: Instante,
      /** Sin operación de renovación en WP-02 (DL-012). */
      renewable: z.boolean(),
      accessToken: z.string().min(1),
      tokenType: z.literal('Bearer'),
    }),
    actor: z.strictObject({
      identityId: IdOpaco,
      accountOperationalState: AccountOperationalStateSchema,
    }),
  }),
});
export type IniciarSesionResponse = z.infer<typeof IniciarSesionResponseSchema>;

// ─── API-ACC-05 — Consultar identidad/sesión propia ─────────────────────────────────────────────
export const MeResponseSchema = z.strictObject({
  data: z.strictObject({
    identityId: IdOpaco,
    accountOperationalState: AccountOperationalStateSchema,
    registrationIntent: RegistrationIntentSchema,
    /** «datos propios mínimos»: ninguno aprobado (DL-009). */
    profile: z.strictObject({}),
    /** «no es PDP; no es permiso de lectura sensible» (09v8). Vacío en WP-02. */
    actorCapabilities: z.array(z.string()),
    session: z.strictObject({ id: IdOpaco, expiresAt: Instante }),
  }),
});
export type MeResponse = z.infer<typeof MeResponseSchema>;

// ─── API-ACC-P1-03 — Solicitar cierre de cuenta (P1) ────────────────────────────────────────────
/** Forma definida en implementación: el 09v12 no fija body ni respuesta (DEUDA_LEGAJO DL-016). */
export const SolicitarCierreRequestSchema = z.strictObject({
  /** «consecuencias presentadas»: versión del texto que la UI mostró (06 §5.7.4). */
  consequencesAcknowledgement: z.strictObject({ versionId: IdOpaco }),
  /** «confirmación explícita» (06 §5.7.4). */
  confirmed: z.boolean(),
});
export type SolicitarCierreRequest = z.infer<typeof SolicitarCierreRequestSchema>;

export const SolicitarCierreResponseSchema = z.strictObject({
  data: z.strictObject({
    id: IdOpaco,
    identityId: IdOpaco,
    accountOperationalState: z.literal('CERRADA'),
    requestedAt: Instante,
  }),
});
export type SolicitarCierreResponse = z.infer<typeof SolicitarCierreResponseSchema>;

// ─── API-CON-05 — Consultar requisito A3 (solo lectura en WP-02) ────────────────────────────────
export const RequisitoDeConsentimientoDeSaludResponseSchema = z.strictObject({
  data: z.strictObject({
    type: z.literal('HEALTH_DATA_BE'),
    consentVersion: z.strictObject({
      id: IdOpaco,
      text: z.string(),
      textHash: z.string(),
      effectiveFrom: Instante,
    }),
    purpose: z.literal('HEALTH_DATA_PROCESSING_AND_LONGITUDINAL_HISTORY'),
    /** `null` = el concepto existe y no tiene valor (09v7 T11): A3 no otorgado. */
    currentConsent: z
      .strictObject({
        consentId: IdOpaco,
        state: z.enum(['ACTIVE', 'REVOKED']),
        consentVersionId: IdOpaco,
        acceptedAt: Instante,
        revokedAt: Instante.nullable(),
      })
      .nullable(),
  }),
});
export type RequisitoDeConsentimientoDeSaludResponse = z.infer<typeof RequisitoDeConsentimientoDeSaludResponseSchema>;

// ─── Headers contractuales (09v7 §22) ───────────────────────────────────────────────────────────
export const HEADER_IDEMPOTENCY_KEY = 'idempotency-key';
export const HEADER_REQUEST_ID = 'x-request-id';
