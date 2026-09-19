/**
 * OpenAPI 3.1 generado desde los schemas de contrato (09v7 T21: «No se permite mantener manualmente otra definición
 * equivalente»). `scripts/generar-openapi.cjs` lo escribe en `docs/api/openapi.json` y la CI falla si difiere.
 * Alcance:
 * - las operaciones autorizadas de WP-02 (docs/paquetes/WP-02.md §4);
 * - las de WP-03 (docs/paquetes/WP-03.md §4);
 * - las de WP-04 (docs/paquetes/WP-04.md §4).
 */
import { z } from 'zod';
import {
  CodigoDeError,
  ErrorEnvelopeSchema,
  IniciarSesionRequestSchema,
  IniciarSesionResponseSchema,
  MeResponseSchema,
  RegistrarIdentidadRequestSchema,
  RegistrarIdentidadResponseSchema,
  RequisitoDeConsentimientoDeSaludResponseSchema,
  SolicitarCierreRequestSchema,
  SolicitarCierreResponseSchema,
} from './contratos';
import {
  AceptarSolicitudResponseSchema,
  ConsentimientoDeSaludOtorgadoResponseSchema,
  ConsentimientoOtorgadoResponseSchema,
  ConsentimientoRevocadoResponseSchema,
  CrearSolicitudDeVinculoRequestSchema,
  CrearSolicitudDeVinculoResponseSchema,
  DashboardResponseSchema,
  DecidirSolicitudRequestSchema,
  DetalleDeVinculoResponseSchema,
  FinalizarVinculoRequestSchema,
  HistorialDeConsentimientoDeSaludResponseSchema,
  ListaDeConsentimientosResponseSchema,
  ListaDeSolicitudesResponseSchema,
  ListaDeVinculosResponseSchema,
  OtorgarConsentimientoDeSaludRequestSchema,
  OtorgarConsentimientoRequestSchema,
  PausarVinculoRequestSchema,
  ReanudarVinculoRequestSchema,
  RechazarSolicitudResponseSchema,
  RequisitosDeConsentimientoResponseSchema,
  SolicitudDeduplicadaResponseSchema,
  VinculoResponseSchema,
} from './contratos-vinculo';
import {
  ActivacionDePlanResponseSchema,
  AplicarRevisionResponseSchema,
  ContextoDeRevisionResponseSchema,
  CorregirIngestaRequestSchema,
  CrearElementoDeCatalogoRequestSchema,
  CrearEvaluacionRequestSchema,
  CrearEvaluacionResponseSchema,
  CrearObjetivoRequestSchema,
  CrearPlanRequestSchema,
  EditarBorradorRequestSchema,
  ElementoDeCatalogoResponseSchema,
  EvaluacionResponseSchema,
  HoyResponseSchema,
  IngestaResponseSchema,
  ListaDeCatalogoResponseSchema,
  ListaDeEvaluacionesResponseSchema,
  ListaDeIngestasResponseSchema,
  ListaDeObjetivosResponseSchema,
  ListaDePlanesResponseSchema,
  ObjetivoEfectivoResponseSchema,
  ObjetivoResponseSchema,
  PlanResponseSchema,
  RegistrarIngestaRequestSchema,
  RegistrarRevisionRequestSchema,
  RevisionResponseSchema,
  ValidacionDePlanResponseSchema,
  VersionEsperadaRequestSchema,
} from './contratos-nutricion';

type Codigo = keyof typeof CodigoDeError;
type Errores = Partial<Record<400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 503, readonly Codigo[]>>;

interface ParametroDeQuery {
  readonly nombre: string;
  readonly descripcion: string;
  readonly schema: Record<string, unknown>;
}

export interface Operacion {
  readonly id: string;
  readonly metodo: 'get' | 'post' | 'patch' | 'delete';
  /** Relativa a `/api/v1`. Los parámetros de ruta van entre llaves: `/relationships/{relationshipId}`. */
  readonly ruta: string;
  readonly resumen: string;
  readonly autenticacion: 'PUBLIC' | 'SESSION' | 'SESSION_STEP_UP';
  readonly idempotencia: boolean;
  readonly request?: z.ZodType;
  readonly query?: readonly ParametroDeQuery[];
  /** El primero es el éxito principal. REL-01 y CON-02 también responden 200 (deduplicado o replay). */
  readonly exitos: readonly { readonly status: 200 | 201 | 204; readonly schema?: z.ZodType }[];
  readonly errores: Errores;
  readonly fuente: string;
}

const COMUNES: Errores = { 500: ['INTERNAL_ERROR'], 503: ['DB_UNAVAILABLE'] };
const SESION: Errores = { 401: ['AUTHENTICATION_REQUIRED', 'SESSION_INVALID', 'SESSION_EXPIRED', 'SESSION_REVOKED'] };

const LIMIT: ParametroDeQuery = { nombre: 'limit', descripcion: 'Tamaño de página (1 a 50; 20 por defecto).', schema: { type: 'integer', minimum: 1, maximum: 50 } };
const CURSOR: ParametroDeQuery = { nombre: 'cursor', descripcion: 'Cursor opaco de la página siguiente.', schema: { type: 'string' } };
const ALCANCE: ParametroDeQuery = { nombre: 'scope', descripcion: 'Filtra por alcance.', schema: { type: 'string', enum: ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'] } };

/** Errores de una escritura REL/CON sobre un recurso que puede no ser revelable para el actor (09:213-233). */
const ESCRITURA_REVELABLE: Errores = {
  ...SESION,
  400: ['INVALID_REQUEST', 'UNKNOWN_FIELD'],
  404: ['RESOURCE_NOT_FOUND'],
};

const DEFINIDAS: readonly Operacion[] = [
  // ─── WP-02 ────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'API-ACC-01',
    metodo: 'post',
    ruta: '/registrations',
    resumen: 'Registrar identidad BE y perfil propio con A1 (términos) y A2 (privacidad) como actos separados. No concede A3.',
    autenticacion: 'PUBLIC',
    idempotencia: true,
    request: RegistrarIdentidadRequestSchema,
    exitos: [{ status: 201, schema: RegistrarIdentidadResponseSchema }],
    errores: {
      400: ['INVALID_REQUEST', 'UNKNOWN_FIELD'],
      409: ['REGISTRATION_NOT_AVAILABLE', 'IDEMPOTENCY_KEY_REUSED'],
      422: ['TERMS_VERSION_NOT_ACCEPTABLE', 'PRIVACY_VERSION_NOT_ACCEPTABLE'],
      429: ['RATE_LIMITED'],
    },
    fuente: '09v8:227-307',
  },
  {
    id: 'API-ACC-02',
    metodo: 'post',
    ruta: '/auth/sessions',
    resumen: 'Iniciar sesión local. Todo fallo de credenciales o de estado de cuenta responde el mismo 401 neutral.',
    autenticacion: 'PUBLIC',
    idempotencia: false,
    request: IniciarSesionRequestSchema,
    exitos: [{ status: 201, schema: IniciarSesionResponseSchema }],
    errores: { 400: ['INVALID_REQUEST', 'UNKNOWN_FIELD'], 401: ['INVALID_CREDENTIALS'], 429: ['RATE_LIMITED'] },
    fuente: '09v8:311-393',
  },
  {
    id: 'API-ACC-03',
    metodo: 'delete',
    ruta: '/auth/sessions/current',
    resumen: 'Finalizar la sesión actual. Idempotente: repetir responde 204.',
    autenticacion: 'SESSION',
    idempotencia: false,
    exitos: [{ status: 204 }],
    errores: { 400: ['INVALID_REQUEST'], 401: ['AUTHENTICATION_REQUIRED', 'SESSION_INVALID'] },
    fuente: '09v8:397-427 · DEUDA_LEGAJO DL-029 (idempotente: sesión ya no activa → 204)',
  },
  {
    id: 'API-ACC-04',
    metodo: 'delete',
    ruta: '/auth/sessions',
    resumen: 'Revocar todas las sesiones del titular.',
    autenticacion: 'SESSION',
    idempotencia: false,
    exitos: [{ status: 204 }],
    errores: { ...SESION, 400: ['INVALID_REQUEST'] },
    fuente: '09v8:431-457',
  },
  {
    id: 'API-ACC-05',
    metodo: 'get',
    ruta: '/me',
    resumen: 'Identidad, estado operativo y sesión propios. `actorCapabilities` encauza superficies y no es PDP. No incluye A3.',
    autenticacion: 'SESSION',
    idempotencia: false,
    exitos: [{ status: 200, schema: MeResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST'] },
    fuente: '09v8:461-505',
  },
  {
    id: 'API-ACC-P1-03',
    metodo: 'post',
    ruta: '/me/account-closure-requests',
    resumen:
      'Cerrar la propia cuenta (P1, síncrono). Revoca sesiones, suprime el hash de la credencial, finaliza los vínculos por eventos y preserva la historia.',
    autenticacion: 'SESSION_STEP_UP',
    idempotencia: true,
    request: SolicitarCierreRequestSchema,
    exitos: [{ status: 201, schema: SolicitarCierreResponseSchema }],
    errores: {
      ...SESION,
      400: ['INVALID_REQUEST', 'UNKNOWN_FIELD'],
      403: ['STEP_UP_REQUIRED'],
      409: ['IDEMPOTENCY_KEY_REUSED'],
      422: ['VALIDATION_FAILED', 'INVALID_STATE_TRANSITION'],
    },
    fuente: '09v12:578-603 · DEUDA_LEGAJO DL-016/DL-017/DL-018',
  },
  {
    id: 'API-CON-05',
    metodo: 'get',
    ruta: '/me/health-data-consent-requirement',
    resumen: 'Requisito A3 y el último acto A3 del titular. `currentConsent: null` = A3 nunca otorgado.',
    autenticacion: 'SESSION',
    idempotencia: false,
    exitos: [{ status: 200, schema: RequisitoDeConsentimientoDeSaludResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST'] },
    fuente: '09:2379-2433',
  },
  // ─── WP-03 · REL (09v8 §6) ───────────────────────────────────────────────────────────────────
  {
    id: 'API-REL-01',
    metodo: 'post',
    ruta: '/relationship-requests',
    resumen:
      'Crear una solicitud de vínculo por alcance y finalidad. No concede acceso. Una equivalente pendiente se devuelve con 200 deduplicado (REG-06-44).',
    autenticacion: 'SESSION',
    idempotencia: true,
    request: CrearSolicitudDeVinculoRequestSchema,
    exitos: [
      { status: 201, schema: CrearSolicitudDeVinculoResponseSchema },
      { status: 200, schema: SolicitudDeduplicadaResponseSchema },
    ],
    errores: {
      ...ESCRITURA_REVELABLE,
      409: ['IDEMPOTENCY_KEY_REUSED', 'RESOURCE_CONFLICT'],
      422: ['PURPOSE_REQUIRED', 'SCOPE_NOT_AVAILABLE', 'COUNTERPART_NOT_ELIGIBLE', 'VALIDATION_FAILED'],
    },
    fuente: '09v8:1108-1192 · DEUDA_LEGAJO DL-035/DL-037',
  },
  {
    id: 'API-REL-02',
    metodo: 'get',
    ruta: '/me/relationship-requests',
    resumen: 'Solicitudes propias, enviadas y recibidas. No incluye información sanitaria.',
    autenticacion: 'SESSION',
    idempotencia: false,
    query: [LIMIT, CURSOR, { nombre: 'state', descripcion: 'Estado de la solicitud (06 §7.3.1).', schema: { type: 'string', enum: ['PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'CADUCADA', 'INVALIDADA'] } }],
    exitos: [{ status: 200, schema: ListaDeSolicitudesResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST', 'INVALID_CURSOR'] },
    fuente: '09v8:1196-1224',
  },
  {
    id: 'API-REL-03',
    metodo: 'post',
    ruta: '/relationship-requests/{requestId}/accept',
    resumen: 'Aceptar una solicitud (solo el asesorado titular). Crea el Vínculo por Alcance. No concede consentimiento.',
    autenticacion: 'SESSION',
    idempotencia: true,
    request: DecidirSolicitudRequestSchema,
    exitos: [{ status: 200, schema: AceptarSolicitudResponseSchema }],
    errores: { ...ESCRITURA_REVELABLE, 409: ['VERSION_CONFLICT', 'IDEMPOTENCY_KEY_REUSED'], 422: ['INVALID_STATE_TRANSITION'] },
    fuente: '09v8:1228-1290 · REG-06-49',
  },
  {
    id: 'API-REL-04',
    metodo: 'post',
    ruta: '/relationship-requests/{requestId}/reject',
    resumen: 'Rechazar una solicitud (solo el asesorado titular). La solicitud y su historia se conservan.',
    autenticacion: 'SESSION',
    idempotencia: true,
    request: DecidirSolicitudRequestSchema,
    exitos: [{ status: 200, schema: RechazarSolicitudResponseSchema }],
    errores: { ...ESCRITURA_REVELABLE, 409: ['VERSION_CONFLICT', 'IDEMPOTENCY_KEY_REUSED'], 422: ['INVALID_STATE_TRANSITION'] },
    fuente: '09v8:1294-1321 · DEUDA_LEGAJO DL-043',
  },
  {
    id: 'API-REL-05',
    metodo: 'get',
    ruta: '/me/relationships',
    resumen: 'Vínculos por alcance propios, con el modo de acceso calculado por el PDP (diagnóstico, no permiso).',
    autenticacion: 'SESSION',
    idempotencia: false,
    query: [LIMIT, CURSOR, { nombre: 'state', descripcion: 'Estado del vínculo por alcance (06 §7.5.1).', schema: { type: 'string', enum: ['ACEPTADO', 'PAUSADO', 'FINALIZADO'] } }, ALCANCE],
    exitos: [{ status: 200, schema: ListaDeVinculosResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST', 'INVALID_CURSOR'] },
    fuente: '09v8:1325-1369 · DEUDA_LEGAJO DL-034',
  },
  {
    id: 'API-REL-06',
    metodo: 'get',
    ruta: '/relationships/{relationshipId}',
    resumen: 'Detalle de un vínculo propio. No participante o inexistente → 404 idéntico.',
    autenticacion: 'SESSION',
    idempotencia: false,
    exitos: [{ status: 200, schema: DetalleDeVinculoResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST'], 404: ['RESOURCE_NOT_FOUND'] },
    fuente: '09v8:1373-1391 · DEUDA_LEGAJO DL-043',
  },
  {
    id: 'API-REL-07',
    metodo: 'post',
    ruta: '/relationships/{relationshipId}/pause',
    resumen: 'Pausar un vínculo por alcance, con motivo. El acceso profesional pasa a cero en la operación siguiente; no revoca B2.',
    autenticacion: 'SESSION',
    idempotencia: true,
    request: PausarVinculoRequestSchema,
    exitos: [{ status: 200, schema: VinculoResponseSchema }],
    errores: { ...ESCRITURA_REVELABLE, 409: ['VERSION_CONFLICT', 'IDEMPOTENCY_KEY_REUSED'], 422: ['INVALID_STATE_TRANSITION'] },
    fuente: '09v8:1395-1432 · DEUDA_LEGAJO DL-033',
  },
  {
    id: 'API-REL-08',
    metodo: 'post',
    ruta: '/relationships/{relationshipId}/resume',
    resumen: 'Reanudar un vínculo pausado (solo quien pausó). No restaura permisos: el PDP vuelve a evaluar todo.',
    autenticacion: 'SESSION',
    idempotencia: true,
    request: ReanudarVinculoRequestSchema,
    exitos: [{ status: 200, schema: VinculoResponseSchema }],
    errores: {
      ...ESCRITURA_REVELABLE,
      403: ['ACTION_FORBIDDEN'],
      409: ['VERSION_CONFLICT', 'IDEMPOTENCY_KEY_REUSED'],
      422: ['INVALID_STATE_TRANSITION'],
    },
    fuente: '09v8:1436-1468 · DEUDA_LEGAJO DL-033',
  },
  {
    id: 'API-REL-09',
    metodo: 'post',
    ruta: '/relationships/{relationshipId}/finalize',
    resumen: 'Finalizar un vínculo por alcance, con motivo. Terminal; sin lectura residual; conserva consentimientos como evidencia.',
    autenticacion: 'SESSION',
    idempotencia: true,
    request: FinalizarVinculoRequestSchema,
    exitos: [{ status: 200, schema: VinculoResponseSchema }],
    errores: { ...ESCRITURA_REVELABLE, 409: ['VERSION_CONFLICT', 'IDEMPOTENCY_KEY_REUSED'], 422: ['INVALID_STATE_TRANSITION'] },
    fuente: '09v8:1472-1494 · DEUDA_LEGAJO DL-033',
  },
  // ─── WP-03 · CON (09v8 §7; 09 §31-§37) ───────────────────────────────────────────────────────
  {
    id: 'API-CON-01',
    metodo: 'get',
    ruta: '/relationships/{relationshipId}/consent-requirements',
    resumen: 'Texto y versión de B2 aplicables a un vínculo propio (solo el asesorado titular).',
    autenticacion: 'SESSION',
    idempotencia: false,
    exitos: [{ status: 200, schema: RequisitosDeConsentimientoResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST'], 404: ['RESOURCE_NOT_FOUND'] },
    fuente: '09v8:1500-1566 · DEUDA_LEGAJO DL-038/DL-039',
  },
  {
    id: 'API-CON-02',
    metodo: 'post',
    ruta: '/relationships/{relationshipId}/consents',
    resumen:
      'Otorgar B2 para la versión presentada (solo el asesorado titular). 201 al otorgar; 200 si ya estaba vigente con esa versión o al aceptar una versión nueva o reotorgar.',
    autenticacion: 'SESSION',
    idempotencia: true,
    request: OtorgarConsentimientoRequestSchema,
    exitos: [
      { status: 201, schema: ConsentimientoOtorgadoResponseSchema },
      { status: 200, schema: ConsentimientoOtorgadoResponseSchema },
    ],
    errores: {
      ...ESCRITURA_REVELABLE,
      409: ['CONSENT_VERSION_STALE', 'IDEMPOTENCY_KEY_REUSED'],
      422: ['RELATIONSHIP_NOT_READY_FOR_CONSENT'],
    },
    fuente: '09v8:1570-1660 · DEUDA_LEGAJO DL-038',
  },
  {
    id: 'API-CON-03',
    metodo: 'get',
    ruta: '/me/consents',
    resumen: 'Consentimientos B2 propios como titular, con el modo de acceso calculado por el PDP.',
    autenticacion: 'SESSION',
    idempotencia: false,
    query: [LIMIT, CURSOR, { nombre: 'state', descripcion: 'Estado de B2.', schema: { type: 'string', enum: ['ACTIVE', 'REVOKED'] } }, ALCANCE],
    exitos: [{ status: 200, schema: ListaDeConsentimientosResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST', 'INVALID_CURSOR'] },
    fuente: '09v8:1664-1695',
  },
  {
    id: 'API-CON-04',
    metodo: 'post',
    ruta: '/me/consents/{consentId}/revoke',
    resumen: 'Revocar B2. Idempotente por semántica (sin Idempotency-Key). Corta el acceso futuro; no finaliza el vínculo.',
    autenticacion: 'SESSION',
    idempotencia: false,
    exitos: [{ status: 200, schema: ConsentimientoRevocadoResponseSchema }],
    errores: ESCRITURA_REVELABLE,
    fuente: '09v8:1699-1758',
  },
  {
    id: 'API-CON-06',
    metodo: 'post',
    ruta: '/me/health-data-consents',
    resumen: 'Otorgar o reotorgar A3 (un acto nuevo). No crea B2 ni habilita a ningún profesional.',
    autenticacion: 'SESSION',
    idempotencia: true,
    request: OtorgarConsentimientoDeSaludRequestSchema,
    exitos: [{ status: 201, schema: ConsentimientoDeSaludOtorgadoResponseSchema }],
    errores: {
      ...SESION,
      400: ['INVALID_REQUEST', 'UNKNOWN_FIELD'],
      409: ['CONSENT_VERSION_STALE', 'CONSENT_ALREADY_ACTIVE', 'IDEMPOTENCY_KEY_REUSED'],
      422: ['HEALTH_DATA_CONSENT_NOT_AVAILABLE'],
    },
    fuente: '09:2437-2519',
  },
  {
    id: 'API-CON-07',
    metodo: 'get',
    ruta: '/me/health-data-consents',
    resumen: 'Historial de actos A3 del titular. No mezcla B2 ni expone IP o user-agent.',
    autenticacion: 'SESSION',
    idempotencia: false,
    query: [LIMIT, CURSOR],
    exitos: [{ status: 200, schema: HistorialDeConsentimientoDeSaludResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST', 'INVALID_CURSOR'] },
    fuente: '09:2523-2554',
  },
  {
    id: 'API-CON-08',
    metodo: 'post',
    ruta: '/me/health-data-consents/{consentId}/revoke',
    resumen: 'Revocar A3. Idempotente por semántica. El PDP bloquea de inmediato las operaciones sensibles, incluido el acceso profesional.',
    autenticacion: 'SESSION',
    idempotencia: false,
    exitos: [{ status: 200, schema: ConsentimientoRevocadoResponseSchema }],
    errores: ESCRITURA_REVELABLE,
    fuente: '09:2558-2621 · 08:406 (paso 1) · DEUDA_LEGAJO DL-021',
  },
  // ─── WP-03 · DSH-03 mínimo (09v11 §15; DL-031) ───────────────────────────────────────────────
  {
    id: 'API-DSH-03',
    metodo: 'get',
    ruta: '/advisees/{adviseeId}/dashboard',
    resumen:
      'Dashboard del asesorado para un profesional, evaluado por el PDP en cada alcance. Sin datos de dominio en WP-03. Ningún alcance autorizado → 404 idéntico a inexistente.',
    autenticacion: 'SESSION',
    idempotencia: false,
    query: [
      { nombre: 'periodStart', descripcion: 'Inicio del período (RFC 3339).', schema: { type: 'string', format: 'date-time' } },
      { nombre: 'periodEnd', descripcion: 'Fin del período (RFC 3339).', schema: { type: 'string', format: 'date-time' } },
    ],
    exitos: [{ status: 200, schema: DashboardResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST'], 404: ['RESOURCE_NOT_FOUND'] },
    fuente: '09v11:895-950 · 08:581, 09:715 (SESSION con datos sintéticos) · DEUDA_LEGAJO DL-031',
  },
  // ─── WP-04 · NUT (09v9; CONS §11.2) e INT-NUT-01 (09v12) ─────────────────────────────────────
  {
    id: 'API-NUT-01',
    metodo: 'post',
    ruta: '/advisees/{adviseeId}/nutrition/evaluations',
    resumen: 'Registrar una evaluación nutricional. Cada dato declara su fuente (informado, observado o calculado). No sobrescribe evaluaciones anteriores.',
    autenticacion: 'SESSION',
    idempotencia: true,
    request: CrearEvaluacionRequestSchema,
    exitos: [{ status: 201, schema: CrearEvaluacionResponseSchema }],
    errores: { ...ESCRITURA_REVELABLE, 409: ['IDEMPOTENCY_KEY_REUSED'], 422: ['NUTRITION_EVALUATION_INVALID'] },
    fuente: '09v9:325-377 · DEUDA_LEGAJO DL-048, DL-055',
  },
  {
    id: 'API-NUT-02',
    metodo: 'get',
    ruta: '/advisees/{adviseeId}/nutrition/evaluations',
    resumen: 'Evaluaciones propias del profesional sobre el asesorado, paginadas.',
    autenticacion: 'SESSION',
    idempotencia: false,
    query: [LIMIT, CURSOR],
    exitos: [{ status: 200, schema: ListaDeEvaluacionesResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST', 'INVALID_CURSOR'], 404: ['RESOURCE_NOT_FOUND'] },
    fuente: '09v9:381-387 · DEUDA_LEGAJO DL-055, DL-057',
  },
  {
    id: 'API-NUT-03',
    metodo: 'get',
    ruta: '/nutrition/evaluations/{evaluationId}',
    resumen: 'Una evaluación. Inexistente, ajena o no autorizada → el mismo 404.',
    autenticacion: 'SESSION',
    idempotencia: false,
    exitos: [{ status: 200, schema: EvaluacionResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST'], 404: ['RESOURCE_NOT_FOUND'] },
    fuente: '09v9:391-401',
  },
  {
    id: 'API-NUT-04',
    metodo: 'post',
    ruta: '/advisees/{adviseeId}/nutrition/objectives',
    resumen: 'Emitir una nueva versión de objetivo: decisión profesional con fundamento obligatorio. BE no calcula el requerimiento. La anterior se conserva.',
    autenticacion: 'SESSION',
    idempotencia: true,
    request: CrearObjetivoRequestSchema,
    exitos: [{ status: 201, schema: ObjetivoResponseSchema }],
    errores: { ...ESCRITURA_REVELABLE, 409: ['IDEMPOTENCY_KEY_REUSED'], 422: ['NUTRITION_OBJECTIVE_INVALID', 'EVALUATION_NOT_COMPATIBLE'] },
    fuente: '09v9:405-444 · REG-06-123 · INV-06-133',
  },
  {
    id: 'API-NUT-05',
    metodo: 'get',
    ruta: '/advisees/{adviseeId}/nutrition/objectives',
    resumen: 'Historia de versiones de objetivo, con la efectiva marcada por relación de sucesión.',
    autenticacion: 'SESSION',
    idempotencia: false,
    query: [LIMIT, CURSOR],
    exitos: [{ status: 200, schema: ListaDeObjetivosResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST', 'INVALID_CURSOR'], 404: ['RESOURCE_NOT_FOUND'] },
    fuente: '09v9:448-452',
  },
  {
    id: 'API-NUT-06',
    metodo: 'get',
    ruta: '/advisees/{adviseeId}/nutrition/objectives/effective',
    resumen: 'Objetivo efectivo: la versión terminal de la sucesión, nunca «la última por fecha». `objective: null` si no hay.',
    autenticacion: 'SESSION',
    idempotencia: false,
    exitos: [{ status: 200, schema: ObjetivoEfectivoResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST'], 404: ['RESOURCE_NOT_FOUND'] },
    fuente: '09v9:456-472 · INV-06-107',
  },
  {
    id: 'API-NUT-07',
    metodo: 'post',
    ruta: '/advisees/{adviseeId}/nutrition/plans',
    resumen:
      'Crear un borrador de plan: no vigente, no abre proceso ni ocupa capacidad. Con `basedOnPlanId`, borrador sucesor de la versión efectiva, sin tocarla (DL-047). Un solo borrador por plan.',
    autenticacion: 'SESSION',
    idempotencia: true,
    request: CrearPlanRequestSchema,
    exitos: [{ status: 201, schema: PlanResponseSchema }],
    errores: {
      ...ESCRITURA_REVELABLE,
      409: ['IDEMPOTENCY_KEY_REUSED', 'VERSION_CONFLICT'],
      422: ['OBJECTIVE_NOT_EFFECTIVE_OR_COMPATIBLE', 'NUTRITION_PLAN_STRUCTURE_INVALID', 'CATALOG_REFERENCE_INVALID', 'EXCHANGE_MODE_NOT_AVAILABLE', 'VALIDATION_FAILED'],
    },
    fuente: '09v9:476-499 · UC-P10 V07 · DEUDA_LEGAJO DL-046, DL-047, DL-055',
  },
  {
    id: 'API-NUT-08',
    metodo: 'get',
    ruta: '/advisees/{adviseeId}/nutrition/plans',
    resumen: 'Versiones del plan del profesional para el asesorado, sin la jerarquía.',
    autenticacion: 'SESSION',
    idempotencia: false,
    query: [LIMIT, CURSOR, { nombre: 'state', descripcion: 'DRAFT o ACTIVATED.', schema: { type: 'string', enum: ['DRAFT', 'ACTIVATED'] } }],
    exitos: [{ status: 200, schema: ListaDePlanesResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST', 'INVALID_CURSOR'], 404: ['RESOURCE_NOT_FOUND'] },
    fuente: '09v9:503-509',
  },
  {
    id: 'API-NUT-09',
    metodo: 'get',
    ruta: '/nutrition/plans/{planId}',
    resumen: 'Una versión de plan. Activada: se reconstruye desde la instantánea, nunca desde el catálogo vivo. El asesorado ve solo versiones activadas.',
    autenticacion: 'SESSION',
    idempotencia: false,
    exitos: [{ status: 200, schema: PlanResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST'], 404: ['RESOURCE_NOT_FOUND'] },
    fuente: '09v9:513-519 · REG-06-105',
  },
  {
    id: 'API-NUT-10',
    metodo: 'patch',
    ruta: '/nutrition/plans/{planId}',
    resumen: 'Guardar un borrador (reemplaza la jerarquía). Una versión activada no se edita: 422 PLAN_NOT_EDITABLE (INV-06-109).',
    autenticacion: 'SESSION',
    idempotencia: false,
    request: EditarBorradorRequestSchema,
    exitos: [{ status: 200, schema: PlanResponseSchema }],
    errores: {
      ...ESCRITURA_REVELABLE,
      409: ['VERSION_CONFLICT'],
      422: ['PLAN_NOT_EDITABLE', 'NUTRITION_PLAN_STRUCTURE_INVALID', 'CATALOG_REFERENCE_INVALID', 'EXCHANGE_MODE_NOT_AVAILABLE', 'OBJECTIVE_NOT_EFFECTIVE_OR_COMPATIBLE'],
    },
    fuente: '09v9:523-562 · 06:4307',
  },
  {
    id: 'API-NUT-11',
    metodo: 'post',
    ruta: '/nutrition/plans/{planId}/validate',
    resumen: 'Validar un borrador sin activarlo. Responde 200 aunque haya problemas, con cada problema anclado a su ruta.',
    autenticacion: 'SESSION',
    idempotencia: false,
    request: VersionEsperadaRequestSchema,
    exitos: [{ status: 200, schema: ValidacionDePlanResponseSchema }],
    errores: { ...ESCRITURA_REVELABLE, 409: ['VERSION_CONFLICT'], 422: ['PLAN_NOT_EDITABLE'] },
    fuente: '09v9:566-597 · UC-I04',
  },
  {
    id: 'API-NUT-12',
    metodo: 'post',
    ruta: '/nutrition/plans/{planId}/activate',
    resumen:
      'Activar: en una transacción, PDP, validación, instantánea antes de la vigencia, vigencia única y Proceso nuevo (con capacidad) o continuidad. Si algo falla, no cambia nada.',
    autenticacion: 'SESSION',
    idempotencia: true,
    request: VersionEsperadaRequestSchema,
    exitos: [{ status: 200, schema: ActivacionDePlanResponseSchema }],
    errores: {
      ...ESCRITURA_REVELABLE,
      409: ['VERSION_CONFLICT', 'ACTIVE_PLAN_CONFLICT', 'IDEMPOTENCY_KEY_REUSED'],
      422: ['OPERATION_NOT_READY', 'CAPACITY_NOT_AVAILABLE'],
    },
    fuente: '09v9:601-644 · REG-06-104 · REG-06-91 · DEUDA_LEGAJO DL-051, DL-055 (NUTRITION_SCOPE_NOT_OPERATIONAL: 404)',
  },
  {
    id: 'API-NUT-13',
    metodo: 'get',
    ruta: '/nutrition/catalog-items',
    resumen: 'Catálogo nutricional BE: el sembrado (global) y el propio del profesional. Solo profesionales de Nutrición.',
    autenticacion: 'SESSION',
    idempotencia: false,
    query: [LIMIT, CURSOR, { nombre: 'q', descripcion: 'Texto a buscar en el nombre.', schema: { type: 'string' } }, { nombre: 'type', descripcion: 'FOOD.', schema: { type: 'string', enum: ['FOOD'] } }],
    exitos: [{ status: 200, schema: ListaDeCatalogoResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST', 'INVALID_CURSOR'], 403: ['ACTION_FORBIDDEN'] },
    fuente: '09v9:648-654 · REG-06-99, 135',
  },
  {
    id: 'API-INT-NUT-01',
    metodo: 'post',
    ruta: '/nutrition/catalog-items',
    resumen: 'Cargar manualmente un alimento al catálogo propio del profesional (fallback sin proveedor, RF-027).',
    autenticacion: 'SESSION',
    idempotencia: true,
    request: CrearElementoDeCatalogoRequestSchema,
    exitos: [{ status: 201, schema: ElementoDeCatalogoResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST', 'UNKNOWN_FIELD'], 403: ['ACTION_FORBIDDEN'], 409: ['IDEMPOTENCY_KEY_REUSED'] },
    fuente: '09v12:111-160 · RF-027',
  },
  {
    id: 'API-NUT-14',
    metodo: 'get',
    ruta: '/me/nutrition/today',
    resumen: '«Hoy» del asesorado: la instantánea vigente y sus registros del día. Sin registros → NO_DATA, nunca 0 %. No elige un día tipo en silencio.',
    autenticacion: 'SESSION',
    idempotencia: false,
    query: [{ nombre: 'dayTypeId', descripcion: 'Día tipo elegido por el asesorado (DL-049).', schema: { type: 'string' } }],
    exitos: [{ status: 200, schema: HoyResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST'] },
    fuente: '09v9:658-680 · UC-P12 E06 · DEUDA_LEGAJO DL-049',
  },
  {
    id: 'API-NUT-15',
    metodo: 'post',
    ruta: '/me/nutrition/executions',
    resumen:
      'Registrar una ingesta: prescripta (comida y opción de la instantánea vigente, cantidades opcionales) o fuera del plan (texto libre). No modifica el plan. Un reintento no duplica.',
    autenticacion: 'SESSION',
    idempotencia: true,
    request: RegistrarIngestaRequestSchema,
    exitos: [
      { status: 201, schema: IngestaResponseSchema },
      { status: 200, schema: IngestaResponseSchema },
    ],
    errores: {
      ...ESCRITURA_REVELABLE,
      409: ['IDEMPOTENCY_KEY_REUSED', 'EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY'],
      422: ['ACTIVE_PLAN_REQUIRED', 'NUTRITION_EXECUTION_INVALID'],
    },
    fuente: '09v9:684-746 · CONS:564-628 · DEUDA_LEGAJO DL-049, DL-050',
  },
  {
    id: 'API-NUT-16-LISTA',
    metodo: 'get',
    ruta: '/me/nutrition/executions',
    resumen: 'Registros propios del asesorado (B10-05 NUT-11). Exige A3 vigente.',
    autenticacion: 'SESSION',
    idempotencia: false,
    query: [LIMIT, CURSOR],
    exitos: [{ status: 200, schema: ListaDeIngestasResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST', 'INVALID_CURSOR'], 403: ['ACTION_FORBIDDEN'] },
    fuente: 'B10-05 NUT-11 · 10-B01:351-357 · 08:406 · DEUDA_LEGAJO DL-055',
  },
  {
    id: 'API-NUT-16',
    metodo: 'get',
    ruta: '/nutrition/executions/{executionId}',
    resumen: 'Una ingesta con su original, sus correcciones y la vista efectiva por relación de corrección.',
    autenticacion: 'SESSION',
    idempotencia: false,
    exitos: [{ status: 200, schema: IngestaResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST'], 404: ['RESOURCE_NOT_FOUND'] },
    fuente: '09v9:750-756 · REG-06-16',
  },
  {
    id: 'API-NUT-17',
    metodo: 'get',
    ruta: '/advisees/{adviseeId}/nutrition/review-context',
    resumen: 'Contexto de revisión: objetivo, versiones del período, ingestas, contraste descriptivo, días sin dato y revisiones previas. Ver no es revisar.',
    autenticacion: 'SESSION',
    idempotencia: false,
    query: [
      { nombre: 'periodStart', descripcion: 'Fecha local YYYY-MM-DD.', schema: { type: 'string', format: 'date' } },
      { nombre: 'periodEnd', descripcion: 'Fecha local YYYY-MM-DD.', schema: { type: 'string', format: 'date' } },
    ],
    exitos: [{ status: 200, schema: ContextoDeRevisionResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST'], 404: ['RESOURCE_NOT_FOUND'] },
    fuente: '09v9:793-837 · REG-06-125 · INV-06-135',
  },
  {
    id: 'API-NUT-18',
    metodo: 'post',
    ruta: '/advisees/{adviseeId}/nutrition/reviews',
    resumen: 'Registrar una revisión válida: evidencia reconstruible, interpretación, uno de los seis resultados, fundamento y próxima acción o cierre. No aplica nada.',
    autenticacion: 'SESSION',
    idempotencia: true,
    request: RegistrarRevisionRequestSchema,
    exitos: [{ status: 201, schema: RevisionResponseSchema }],
    errores: {
      ...ESCRITURA_REVELABLE,
      409: ['IDEMPOTENCY_KEY_REUSED'],
      422: ['REVIEW_EVIDENCE_NOT_RECONSTRUCTIBLE', 'REVIEW_COMPONENT_REQUIRED', 'REVIEW_RESULT_INVALID', 'REVIEW_NOT_ALLOWED'],
    },
    fuente: '09v9:842-900 · REG-06-141, 144 · UC-I05',
  },
  {
    id: 'API-NUT-19',
    metodo: 'get',
    ruta: '/nutrition/reviews/{reviewId}',
    resumen: 'Una revisión y, si se aplicó, el evento ContinuidadOCierreAplicado.',
    autenticacion: 'SESSION',
    idempotencia: false,
    exitos: [{ status: 200, schema: RevisionResponseSchema }],
    errores: { ...SESION, 400: ['INVALID_REQUEST'], 404: ['RESOURCE_NOT_FOUND'] },
    fuente: '09v9:904-910',
  },
  {
    id: 'API-NUT-20',
    metodo: 'post',
    ruta: '/nutrition/reviews/{reviewId}/apply',
    resumen:
      'Aplicar la continuidad o el cierre (UC-I06): primero la consecuencia (borrador sucesor, objetivo nuevo, próxima revisión o cierre) y después el evento. Sin consecuencia aplicada no hay evento.',
    autenticacion: 'SESSION',
    idempotencia: true,
    request: VersionEsperadaRequestSchema,
    exitos: [{ status: 200, schema: AplicarRevisionResponseSchema }],
    errores: {
      ...ESCRITURA_REVELABLE,
      409: ['VERSION_CONFLICT', 'REVIEW_ALREADY_APPLIED', 'IDEMPOTENCY_KEY_REUSED'],
      422: ['CONTINUITY_ACTION_NOT_APPLICABLE', 'REVIEW_NOT_VALID_FOR_APPLICATION'],
    },
    fuente: '09v9:914-961 · REG-06-75, 77 · DEUDA_LEGAJO DL-052',
  },
  {
    id: 'API-NUT-21',
    metodo: 'post',
    ruta: '/nutrition/executions/{executionId}/corrections',
    resumen: 'Estructurar una ingesta libre como estimación profesional: Corrección trazable, el original queda intacto y la vista efectiva se resuelve por relación.',
    autenticacion: 'SESSION',
    idempotencia: true,
    request: CorregirIngestaRequestSchema,
    exitos: [{ status: 201, schema: IngestaResponseSchema }],
    errores: {
      ...ESCRITURA_REVELABLE,
      409: ['IDEMPOTENCY_KEY_REUSED'],
      422: ['NUTRITION_FREE_DESCRIPTION_REQUIRED', 'STRUCTURED_ESTIMATE_INVALID', 'CORRECTION_NOT_ALLOWED'],
    },
    fuente: 'CONS:632-685 · REG-06-14, 15, 16, 121',
  },
];

/**
 * Códigos que salen del manejo de concurrencia y de carga, comunes a varias operaciones (revisión adversarial de WP-03):
 * - toda escritura corre en una transacción que se repite ante deadlock o falla de serialización; si persiste, responde
 *   409 RESOURCE_CONFLICT («conflicto concurrente», 09 §3);
 * - las lecturas de un recurso protegido comparten un límite por actor: 429 RATE_LIMITED.
 */
const LECTURAS_PROTEGIDAS: ReadonlySet<string> = new Set([
  'API-DSH-03',
  'API-REL-06',
  'API-CON-01',
  'API-NUT-02',
  'API-NUT-03',
  'API-NUT-05',
  'API-NUT-06',
  'API-NUT-08',
  'API-NUT-09',
  'API-NUT-16',
  'API-NUT-17',
  'API-NUT-19',
]);
const ESCRITURAS_SIN_CLAVE: ReadonlySet<string> = new Set(['API-CON-04', 'API-CON-08', 'API-NUT-10', 'API-NUT-11']);

function conCodigosComunes(op: Operacion): Operacion {
  const errores: { -readonly [S in keyof Errores]: Errores[S] } = { ...op.errores };
  const sumar = (status: 409 | 429, codigo: Codigo) => {
    const actuales = errores[status] ?? [];
    if (!actuales.includes(codigo)) errores[status] = [...actuales, codigo];
  };
  if (op.idempotencia || ESCRITURAS_SIN_CLAVE.has(op.id)) sumar(409, 'RESOURCE_CONFLICT');
  if (LECTURAS_PROTEGIDAS.has(op.id)) sumar(429, 'RATE_LIMITED');
  return { ...op, errores };
}

export const OPERACIONES: readonly Operacion[] = DEFINIDAS.map(conCodigosComunes);

const aJson = (schema: z.ZodType) => z.toJSONSchema(schema, { target: 'draft-2020-12', io: 'input' });

export function documentoOpenApi(): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const op of OPERACIONES) {
    const parametros: Record<string, unknown>[] = [];
    for (const [, nombre] of op.ruta.matchAll(/\{([^}]+)\}/g)) {
      parametros.push({ name: nombre, in: 'path', required: true, schema: { type: 'string' } });
    }
    if (op.idempotencia) {
      parametros.push({
        name: 'Idempotency-Key',
        in: 'header',
        required: true,
        schema: { type: 'string', pattern: '^[A-Za-z0-9._:-]{8,128}$' },
      });
    }
    for (const q of op.query ?? []) {
      parametros.push({ name: q.nombre, in: 'query', required: false, description: q.descripcion, schema: q.schema });
    }
    parametros.push({
      name: 'X-BE-Surface',
      in: 'header',
      required: false,
      description: 'Superficie declarada (procedencia). Nunca autoriza (DEUDA_LEGAJO DL-022).',
      schema: { type: 'string', enum: ['WEB', 'APK'] },
    });
    const respuestas: Record<string, unknown> = {};
    for (const exito of op.exitos) {
      respuestas[exito.status] = exito.schema
        ? { description: 'Éxito', content: { 'application/json': { schema: aJson(exito.schema) } } }
        : { description: 'Éxito, sin cuerpo' };
    }
    for (const [status, codigos] of Object.entries({ ...op.errores, ...COMUNES })) {
      respuestas[status] = {
        description: `ErrorEnvelope: ${(codigos ?? []).join(' | ')}`,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      };
    }
    paths[op.ruta] = {
      ...paths[op.ruta],
      [op.metodo]: {
        operationId: op.id,
        summary: op.resumen,
        description: `Fuente: ${op.fuente}. AuthN: ${op.autenticacion}.`,
        security: op.autenticacion === 'PUBLIC' ? [] : [{ sesion: [] }],
        parameters: parametros,
        ...(op.request
          ? { requestBody: { required: true, content: { 'application/json': { schema: aJson(op.request) } } } }
          : {}),
        responses: respuestas,
      },
    };
  }
  return {
    openapi: '3.1.0',
    info: {
      title: 'BE API — WP-02 Identidad y sesiones · WP-03 Vínculo, consentimiento y PDP · WP-04 Circuito nutricional',
      version: '0.4.0',
      description: 'Generado desde @be/domain (contratos.ts, contratos-vinculo.ts y contratos-nutricion.ts). No editar a mano.',
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        sesion: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Sesión revocable verificada en cada request (08 §26).' },
      },
      schemas: { ErrorEnvelope: aJson(ErrorEnvelopeSchema) },
    },
    paths,
  };
}

/** Códigos de error declarados para una operación (los propios más los comunes), por status. Lo usa el contract test. */
export function erroresDeclarados(id: string): Readonly<Record<string, readonly string[]>> {
  const op = OPERACIONES.find((o) => o.id === id);
  if (!op) throw new Error(`Operación no declarada: ${id}`);
  return { ...op.errores, ...COMUNES };
}

/** Busca la operación de una request real (método + ruta concreta con parámetros). Lo usa el contract test. */
export function operacionDe(metodo: string, rutaConcreta: string): Operacion | undefined {
  return OPERACIONES.find((o) => {
    if (o.metodo !== metodo) return false;
    const patron = new RegExp(`^/api/v1${o.ruta.replace(/\{[^}]+\}/g, '[^/]+')}$`);
    return patron.test(rutaConcreta);
  });
}
