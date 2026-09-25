import { CodigoDeError, type ValidationIssue } from '@be/domain';

/**
 * Error de contrato: se serializa como ErrorEnvelope (09 §3.2, 09v7 T03).
 * `message` es seguro para mostrar; `details` nunca lleva internals (stack, SQL, Prisma, secretos).
 */
export class ErrorDeApi extends Error {
  constructor(
    readonly status: number,
    readonly code: CodigoDeError,
    readonly mensajeSeguro: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(code);
  }
}

export const errores = {
  solicitudInvalida: (issues: ValidationIssue[] = [], extra: Record<string, unknown> = {}) =>
    new ErrorDeApi(400, CodigoDeError.INVALID_REQUEST, 'La solicitud no es válida.', { issues, ...extra }),
  campoDesconocido: (issues: ValidationIssue[]) =>
    new ErrorDeApi(400, CodigoDeError.UNKNOWN_FIELD, 'La solicitud incluye campos no permitidos.', { issues }),
  autenticacionRequerida: () => new ErrorDeApi(401, CodigoDeError.AUTHENTICATION_REQUIRED, 'Iniciá sesión para continuar.'),
  sesionInvalida: () => new ErrorDeApi(401, CodigoDeError.SESSION_INVALID, 'La sesión no es válida.'),
  sesionExpirada: () => new ErrorDeApi(401, CodigoDeError.SESSION_EXPIRED, 'La sesión expiró.'),
  sesionRevocada: () => new ErrorDeApi(401, CodigoDeError.SESSION_REVOKED, 'La sesión ya no es válida.'),
  /** 09v8 ACC-02: respuesta neutral para identificador inexistente, credencial incorrecta y cuenta no utilizable. */
  credencialesInvalidas: () =>
    new ErrorDeApi(401, CodigoDeError.INVALID_CREDENTIALS, 'No pudimos verificar los datos de acceso.'),
  stepUpRequerido: () =>
    new ErrorDeApi(403, CodigoDeError.STEP_UP_REQUIRED, 'Por seguridad, volvé a iniciar sesión para confirmar esta acción.'),
  recursoNoEncontrado: () => new ErrorDeApi(404, CodigoDeError.RESOURCE_NOT_FOUND, 'Recurso no encontrado.'),
  /** 09v8 ACC-01: «deliberadamente neutral». Mismo mensaje para toda causa (DEUDA_LEGAJO DL-010). */
  registroNoDisponible: () =>
    new ErrorDeApi(409, CodigoDeError.REGISTRATION_NOT_AVAILABLE, 'No pudimos completar el registro con esos datos.'),
  claveDeIdempotenciaReutilizada: () =>
    new ErrorDeApi(409, CodigoDeError.IDEMPOTENCY_KEY_REUSED, 'La clave de idempotencia ya se usó con otra solicitud.'),
  versionDeTerminosNoAceptable: () =>
    new ErrorDeApi(422, CodigoDeError.TERMS_VERSION_NOT_ACCEPTABLE, 'La versión de los términos no es la vigente.'),
  versionDePrivacidadNoAceptable: () =>
    new ErrorDeApi(422, CodigoDeError.PRIVACY_VERSION_NOT_ACCEPTABLE, 'La versión de la información de privacidad no es la vigente.'),
  transicionNoPermitida: () =>
    new ErrorDeApi(422, CodigoDeError.INVALID_STATE_TRANSITION, 'La operación no es válida para el estado actual de la cuenta.'),
  validacionFallida: (issues: ValidationIssue[]) =>
    new ErrorDeApi(422, CodigoDeError.VALIDATION_FAILED, 'Falta información necesaria para continuar.', { issues }),
  limiteDeIntentos: () => new ErrorDeApi(429, CodigoDeError.RATE_LIMITED, 'Demasiados intentos. Probá de nuevo más tarde.'),
  baseNoDisponible: () => new ErrorDeApi(503, CodigoDeError.DB_UNAVAILABLE, 'El servicio no está disponible. Probá de nuevo más tarde.'),

  // ─── WP-03 (09v7 §4; 09v8:1807-1826; 09:2513-2516) ─────────────────────────────────────────────
  /** 09:255-257: la versión mostrada ya no es la vigente. «El cliente no hace blind retry». */
  conflictoDeVersion: () =>
    new ErrorDeApi(409, CodigoDeError.VERSION_CONFLICT, 'Este contenido cambió desde que lo abriste. Actualizá la vista antes de volver a intentar.'),
  /** 403 solo cuando revelar la prohibición no filtra existencia (09v7:151-157): el actor ya es participante. */
  accionNoPermitida: () => new ErrorDeApi(403, CodigoDeError.ACTION_FORBIDDEN, 'Esta acción no está disponible para vos.'),
  cursorInvalido: () => new ErrorDeApi(400, CodigoDeError.INVALID_CURSOR, 'La solicitud no es válida.'),
  conflictoDeRecurso: () => new ErrorDeApi(409, CodigoDeError.RESOURCE_CONFLICT, 'Ya existe un vínculo vigente para este alcance.'),
  /** 09 §3 «409 para conflicto concurrente»: otra transacción tomó el recurso y los reintentos se agotaron. */
  conflictoConcurrente: () =>
    new ErrorDeApi(409, CodigoDeError.RESOURCE_CONFLICT, 'Otra operación cambió este recurso al mismo tiempo. Actualizá la vista y volvé a intentar.'),
  /** Transición no declarada o guarda desfavorable sobre un recurso revelable (06 CONV-06-03). */
  estadoNoPermite: () =>
    new ErrorDeApi(422, CodigoDeError.INVALID_STATE_TRANSITION, 'La operación no es válida para el estado actual.'),
  finalidadRequerida: () => new ErrorDeApi(422, CodigoDeError.PURPOSE_REQUIRED, 'Falta la finalidad.'),
  alcanceNoDisponible: () => new ErrorDeApi(422, CodigoDeError.SCOPE_NOT_AVAILABLE, 'El alcance no está disponible.'),
  contraparteNoElegible: () => new ErrorDeApi(422, CodigoDeError.COUNTERPART_NOT_ELIGIBLE, 'La contraparte no es elegible.'),
  versionDeConsentimientoVieja: () =>
    new ErrorDeApi(409, CodigoDeError.CONSENT_VERSION_STALE, 'El texto del consentimiento cambió. Revisá la versión vigente.'),
  vinculoNoListoParaConsentir: () =>
    new ErrorDeApi(422, CodigoDeError.RELATIONSHIP_NOT_READY_FOR_CONSENT, 'El vínculo no admite consentimiento en su estado actual.'),
  consentimientoYaVigente: () => new ErrorDeApi(409, CodigoDeError.CONSENT_ALREADY_ACTIVE, 'Ya hay una autorización vigente.'),
  consentimientoDeSaludNoDisponible: () =>
    new ErrorDeApi(422, CodigoDeError.HEALTH_DATA_CONSENT_NOT_AVAILABLE, 'La versión indicada no corresponde a esta autorización.'),
  // ─── WP-08 · importación controlada (09v12 §5-§7) ──────────────────────────────────────────────
  /**
   * 09v12:218-229: el proveedor no respondió, y la respuesta dice de forma segura que el catálogo propio y la carga
   * manual siguen disponibles (UC-I08). Nunca «200 con datos inventados».
   */
  proveedorNoDisponible: () =>
    new ErrorDeApi(503, CodigoDeError.DEPENDENCY_UNAVAILABLE, 'No pudimos consultar el proveedor. Podés seguir usando el catálogo BE o cargar el elemento manualmente.', {
      fallback: { catalog: true, manualEntry: true },
    }),
  /** El proveedor respondió que no conoce ese identificador: no es una caída (WP-08 D-E). */
  fuenteNoEncontrada: () =>
    new ErrorDeApi(422, CodigoDeError.IMPORT_SOURCE_NOT_FOUND, 'El proveedor no tiene un elemento con ese identificador.'),
  /** Ya resuelto o vencido (D-C): no se puede resolver de nuevo. */
  candidatoNoResoluble: () =>
    new ErrorDeApi(422, CodigoDeError.IMPORT_CANDIDATE_NOT_RESOLVABLE, 'Este candidato ya no se puede resolver. Consultá el proveedor de nuevo si lo necesitás.'),
  /** Lo revisado no alcanza para incorporarlo al catálogo: se dice qué falta, por ruta (D-I). */
  contenidoRevisadoInvalido: (issues: ValidationIssue[]) =>
    new ErrorDeApi(422, CodigoDeError.REVIEWED_CONTENT_INVALID, 'Faltan datos para incorporar el elemento al catálogo.', { issues }),
  /** 09v7:185 — falla no clasificada (DEUDA_LEGAJO DL-005). */
  interno: () => new ErrorDeApi(500, CodigoDeError.INTERNAL_ERROR, 'Ocurrió un error inesperado.'),
};
