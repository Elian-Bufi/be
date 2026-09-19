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
