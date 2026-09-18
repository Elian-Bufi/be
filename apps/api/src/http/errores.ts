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
  /** 09v7:185 — falla no clasificada (DEUDA_LEGAJO DL-005). */
  interno: () => new ErrorDeApi(500, CodigoDeError.INTERNAL_ERROR, 'Ocurrió un error inesperado.'),
};
