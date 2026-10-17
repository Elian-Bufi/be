import { CodigoDeError, ISSUE_DE_MAYORIA_DE_EDAD, type ValidationIssue } from '@be/domain';

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
    /**
     * El motivo que queda en la auditoría cuando no es `code`. Nunca se serializa (09v7 T16). Lo lleva un rechazo que se
     * responde idéntico a otro para no revelar nada, como el 404 de lo inexistente, pero cuyo motivo real tiene que poder
     * reconstruirse (`EjecutorDeDominio` lo audita también en una lectura).
     */
    readonly motivoDeAuditoria?: string,
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
  // ─── WP-NUTRICION-RECETAS · medios privados y registro v2 (DL-120, DL-121; 09v8 API-PRO-04) ─────────────────
  /** El tipo declarado o el real no es JPEG, PNG ni WebP. */
  tipoDeArchivoNoAdmitido: (issues: ValidationIssue[] = []) =>
    new ErrorDeApi(422, CodigoDeError.FILE_TYPE_NOT_ALLOWED, 'La imagen tiene que ser JPG, PNG o WebP.', { issues }),
  /** Más de 10 MB: un 422 del contrato, no un 413 ni un 400 del parser. */
  tamanoDeArchivoNoAdmitido: () => new ErrorDeApi(422, CodigoDeError.FILE_SIZE_NOT_ALLOWED, 'La imagen supera los 10 MB.', { issues: [{ code: 'FILE_TOO_LARGE', path: '(body)' }] }),
  /** Los bytes no se decodifican como el tipo declarado, o la imagen sale de las medidas admitidas. */
  contenidoDeArchivoInvalido: (issues: ValidationIssue[]) =>
    new ErrorDeApi(422, CodigoDeError.FILE_CONTENT_INVALID, 'La imagen no se puede leer o no tiene las medidas admitidas (de 64 a 8000 píxeles por lado).', { issues }),
  /** Un medio citado en el cuerpo no es propio, no está disponible o no es de esa finalidad. Se dice cuál, por ruta. */
  referenciaDeMedioInvalida: (issues: ValidationIssue[]) =>
    new ErrorDeApi(422, CodigoDeError.MEDIA_REFERENCE_INVALID, 'Hay una imagen que no se puede usar acá.', { issues }),
  /**
   * 409 por el estado del recurso (DL-120, DL-121): anular dos veces, rectificar lo anulado o subir otros bytes a un medio
   * que ya los tiene. El recurso es revelable para el actor: es suyo.
   */
  estadoEnConflicto: (mensaje: string) => new ErrorDeApi(409, CodigoDeError.INVALID_STATE_TRANSITION, mensaje),
  // ─── EVIDENCIA_VISUAL (08 §12.4; DL-125), solo con la exigencia activa ─────────────────────────────────────────
  /** API-MED-01: falta el acto del vínculo de Nutrición del plan vigente. `details` dice el vínculo y la versión a mostrar. */
  evidenciaVisualRequerida: (detalle: { relationshipId: string; consentVersionId: string }) =>
    new ErrorDeApi(403, CodigoDeError.VISUAL_EVIDENCE_ACT_REQUIRED, 'Antes de tu primera foto, leé la información sobre las fotos de tus comidas.', detalle),
  /** API-MED-01: la foto de una comida sin un plan de Nutrición vigente: no hay un profesional al que se le informe. */
  planDeNutricionRequerido: () => new ErrorDeApi(422, CodigoDeError.ACTIVE_PLAN_REQUIRED, 'Para subir la foto de una comida hace falta un plan de Nutrición vigente.'),
  // ─── WP-INVITACION (DL-136) ──────────────────────────────────────────────────────────────────────────────────────
  /**
   * Una invitación que no existe, un token o un código mal escritos, o un profesional que ya no está disponible: el mismo
   * 404, sin oráculo (08 §24.5). El motivo real queda solo en la auditoría.
   */
  invitacionNoEncontrada: (motivo: 'INVITACION_DESCONOCIDA' | 'PROFESIONAL_NO_DISPONIBLE') =>
    new ErrorDeApi(404, CodigoDeError.RESOURCE_NOT_FOUND, 'Recurso no encontrado.', undefined, motivo),
  invitacionVencida: () => new ErrorDeApi(422, CodigoDeError.INVITATION_EXPIRED, 'La invitación venció. Pedile al profesional una nueva.'),
  invitacionUsada: () => new ErrorDeApi(422, CodigoDeError.INVITATION_USED, 'La invitación ya se usó: es de un solo uso.'),
  invitacionAnulada: () => new ErrorDeApi(422, CodigoDeError.INVITATION_REVOKED, 'El profesional anuló esta invitación.'),
  /**
   * El reintento de API-INV-01 con la misma clave no puede volver a mostrar el token y el código: BE no los guarda, los
   * vuelve a calcular, y el cálculo ya no coincide (cambió el secreto del servidor). Nunca pasa en el uso normal.
   */
  invitacionNoRecuperable: () =>
    new ErrorDeApi(409, CodigoDeError.RESOURCE_CONFLICT, 'La invitación se creó, pero no se puede volver a mostrar. Anulala y creá otra.'),
  // ─── Declaración de mayoría de edad del alta (08 §24.7 a; DL-138) ─────────────────────────────────────────────────
  /**
   * El cuerpo no trae la declaración: es lo que manda un cliente anterior a DL-138. Sale con el código que esos clientes
   * ya traducen a «Los textos cambiaron. Actualizá la app para continuar.» (la APK) o «Recargá la página» (la web): el
   * conjunto de textos del alta cambió y su pantalla no muestra la casilla. El issue dice exactamente qué falta.
   */
  mayoriaDeEdadAusente: () =>
    new ErrorDeApi(422, CodigoDeError.TERMS_VERSION_NOT_ACCEPTABLE, 'Para crear la cuenta hay que declarar que tenés 18 años o más. Actualizá la app para continuar.', {
      issues: [{ code: ISSUE_DE_MAYORIA_DE_EDAD.REQUERIDA, path: 'adultDeclaration' }],
    }),
  /** La declaración llegó sin marcar (o falta en el alta con Google, que no tiene clientes viejos). */
  mayoriaDeEdadRequerida: (path: string) =>
    new ErrorDeApi(422, CodigoDeError.VALIDATION_FAILED, 'Para crear la cuenta tenés que declarar que tenés 18 años o más.', {
      issues: [{ code: ISSUE_DE_MAYORIA_DE_EDAD.REQUERIDA, path }],
    }),
  versionDeMayoriaDeEdadNoAceptable: () =>
    new ErrorDeApi(422, CodigoDeError.VALIDATION_FAILED, 'La versión de la declaración de mayoría de edad no es la vigente.', {
      issues: [{ code: ISSUE_DE_MAYORIA_DE_EDAD.VERSION_NO_VIGENTE, path: 'adultDeclaration.versionId' }],
    }),
  // ─── WP-ACCESO-GOOGLE (DL-138) ─────────────────────────────────────────────────────────────────────────────────────
  /** UC-E05 E01: Google sin configurar o sin responder. «Se informa la contingencia y se ofrece acceso local». */
  googleNoDisponible: (motivo: 'GOOGLE_NO_CONFIGURADO' | 'CLAVES_NO_DISPONIBLES') =>
    new ErrorDeApi(503, CodigoDeError.DEPENDENCY_UNAVAILABLE, 'Ahora no podemos usar Google. Podés entrar con tu correo y tu contraseña.', { fallback: { localAccess: true } }, motivo),
  /** UC-E05 E03: «resultado no verificable». El motivo (firma, audiencia, vencimiento…) queda solo en la auditoría. */
  tokenDeGoogleInvalido: (motivo: string) =>
    new ErrorDeApi(401, CodigoDeError.GOOGLE_TOKEN_INVALID, 'No pudimos verificar tu cuenta de Google.', undefined, `TOKEN_${motivo}`),
  correoDeGoogleNoVerificado: () => new ErrorDeApi(422, CodigoDeError.GOOGLE_EMAIL_NOT_VERIFIED, 'Google no verificó el correo de esa cuenta.'),
  /** Hay una cuenta BE con contraseña y ese correo: nunca se vincula sola (UC-E05 E02). */
  vinculacionConGoogleRequerida: (correo: string) =>
    new ErrorDeApi(409, CodigoDeError.GOOGLE_LINK_REQUIRED, 'Para entrar con Google a esa cuenta, confirmá su contraseña una vez.', { email: correo }),
  cuentaDeGoogleInexistente: (correo: string) =>
    new ErrorDeApi(404, CodigoDeError.GOOGLE_ACCOUNT_NOT_FOUND, 'Todavía no hay una cuenta BE con esa cuenta de Google.', { email: correo }),
  cuentaDeGoogleYaVinculada: () => new ErrorDeApi(409, CodigoDeError.GOOGLE_ACCOUNT_ALREADY_LINKED, 'La cuenta BE ya está vinculada con otra cuenta de Google.'),
  // ─── WP-NOTAS-DE-COORDINACION (DL-140) ────────────────────────────────────────────────────────────────────────────
  /** UC-E07 E01: con esa visibilidad, la nota no tiene a quién llegar. Llega después de autorizar al autor. */
  destinatarioDeNotaNoDisponible: (issues: ValidationIssue[]) =>
    new ErrorDeApi(422, CodigoDeError.COORDINATION_RECIPIENT_NOT_AVAILABLE, 'La nota no tiene a quién llegar con su autorización vigente.', { issues }),
  /** CRD-D5 y CRD-D7: algo citado no se puede citar, o la nota que dice corregir no es una suya sobre esta persona. */
  referenciaDeNotaInvalida: (issues: ValidationIssue[]) =>
    new ErrorDeApi(422, CodigoDeError.COORDINATION_REFERENCE_INVALID, 'Algo de lo que cita la nota no se puede citar.', { issues }),
  /** 09v7:185 — falla no clasificada (DEUDA_LEGAJO DL-005). */
  interno: () => new ErrorDeApi(500, CodigoDeError.INTERNAL_ERROR, 'Ocurrió un error inesperado.'),
};
