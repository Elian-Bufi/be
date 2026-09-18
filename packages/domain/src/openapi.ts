/**
 * OpenAPI 3.1 generado desde los schemas de contrato (09v7 T21: «No se permite mantener manualmente otra definición
 * equivalente»). `scripts/generar-openapi.cjs` lo escribe en `docs/api/openapi.json` y la CI falla si difiere.
 * Alcance: las operaciones autorizadas de WP-02 (docs/paquetes/WP-02.md §4).
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

type Codigo = keyof typeof CodigoDeError;
type Errores = Partial<Record<400 | 401 | 403 | 409 | 422 | 429 | 500 | 503, readonly Codigo[]>>;

interface Operacion {
  readonly id: string;
  readonly metodo: 'get' | 'post' | 'delete';
  readonly ruta: string;
  readonly resumen: string;
  readonly autenticacion: 'PUBLIC' | 'SESSION' | 'SESSION_STEP_UP';
  readonly idempotencia: boolean;
  readonly request?: z.ZodType;
  readonly exito: { readonly status: 200 | 201 | 204; readonly schema?: z.ZodType };
  readonly errores: Errores;
  readonly fuente: string;
}

const COMUNES: Errores = { 500: ['INTERNAL_ERROR'], 503: ['DB_UNAVAILABLE'] };
const SESION: Errores = { 401: ['AUTHENTICATION_REQUIRED', 'SESSION_INVALID', 'SESSION_EXPIRED', 'SESSION_REVOKED'] };

export const OPERACIONES_WP02: readonly Operacion[] = [
  {
    id: 'API-ACC-01',
    metodo: 'post',
    ruta: '/registrations',
    resumen: 'Registrar identidad BE y perfil propio con A1 (términos) y A2 (privacidad) como actos separados. No concede A3.',
    autenticacion: 'PUBLIC',
    idempotencia: true,
    request: RegistrarIdentidadRequestSchema,
    exito: { status: 201, schema: RegistrarIdentidadResponseSchema },
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
    exito: { status: 201, schema: IniciarSesionResponseSchema },
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
    exito: { status: 204 },
    errores: { 400: ['UNKNOWN_FIELD'] },
    fuente: '09v8:397-427',
  },
  {
    id: 'API-ACC-04',
    metodo: 'delete',
    ruta: '/auth/sessions',
    resumen: 'Revocar todas las sesiones del titular.',
    autenticacion: 'SESSION',
    idempotencia: false,
    exito: { status: 204 },
    errores: { ...SESION, 400: ['UNKNOWN_FIELD'] },
    fuente: '09v8:431-457',
  },
  {
    id: 'API-ACC-05',
    metodo: 'get',
    ruta: '/me',
    resumen: 'Identidad, estado operativo y sesión propios. No incluye A3 ni datos sensibles.',
    autenticacion: 'SESSION',
    idempotencia: false,
    exito: { status: 200, schema: MeResponseSchema },
    errores: { ...SESION, 400: ['UNKNOWN_FIELD'] },
    fuente: '09v8:461-505',
  },
  {
    id: 'API-ACC-P1-03',
    metodo: 'post',
    ruta: '/me/account-closure-requests',
    resumen: 'Cerrar la propia cuenta (P1, síncrono). Revoca sesiones, suprime el hash de la credencial y preserva la historia.',
    autenticacion: 'SESSION_STEP_UP',
    idempotencia: true,
    request: SolicitarCierreRequestSchema,
    exito: { status: 201, schema: SolicitarCierreResponseSchema },
    errores: {
      ...SESION,
      400: ['INVALID_REQUEST', 'UNKNOWN_FIELD'],
      403: ['STEP_UP_REQUIRED'],
      409: ['IDEMPOTENCY_KEY_REUSED'],
      422: ['VALIDATION_FAILED', 'INVALID_STATE_TRANSITION'],
    },
    fuente: '09v12:578-603 · DEUDA_LEGAJO DL-016/DL-017',
  },
  {
    id: 'API-CON-05',
    metodo: 'get',
    ruta: '/me/health-data-consent-requirement',
    resumen: 'Requisito A3 (solo lectura en WP-02). `currentConsent: null` = A3 no otorgado.',
    autenticacion: 'SESSION',
    idempotencia: false,
    exito: { status: 200, schema: RequisitoDeConsentimientoDeSaludResponseSchema },
    errores: { ...SESION, 400: ['UNKNOWN_FIELD'] },
    fuente: '09:2379-2433',
  },
];

const aJson = (schema: z.ZodType) => z.toJSONSchema(schema, { target: 'draft-2020-12', io: 'input' });

export function documentoOpenApi(): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const op of OPERACIONES_WP02) {
    const parametros: Record<string, unknown>[] = [
      {
        name: 'X-BE-Surface',
        in: 'header',
        required: false,
        description: 'Superficie declarada (procedencia). Nunca autoriza (DEUDA_LEGAJO DL-022).',
        schema: { type: 'string', enum: ['WEB', 'APK'] },
      },
    ];
    if (op.idempotencia) {
      parametros.unshift({
        name: 'Idempotency-Key',
        in: 'header',
        required: true,
        schema: { type: 'string', pattern: '^[A-Za-z0-9._:-]{8,128}$' },
      });
    }
    const respuestas: Record<string, unknown> = {
      [op.exito.status]: op.exito.schema
        ? { description: 'Éxito', content: { 'application/json': { schema: aJson(op.exito.schema) } } }
        : { description: 'Éxito, sin cuerpo' },
    };
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
      title: 'BE API — WP-02 Identidad y sesiones',
      version: '0.2.0',
      description: 'Generado desde @be/domain (contratos.ts). No editar a mano.',
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
