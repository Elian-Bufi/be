/**
 * Cliente HTTP de los contratos de WP-02 y WP-03, compartido por el website y el APK (09v7 T21: una sola definición).
 * Cada superficie lo instancia con su base y su superficie declarada:
 * - website: origen de la API inyectado en el build (`BE_API_BASE_URL`), llamada directa con CORS (DL-030);
 * - APK: base absoluta `API_BASE_URL/api/v1` del perfil de build (07:645, sin CORS).
 * El Bearer lo guarda quien llama, solo en memoria (DL-012, T5). Toda respuesta exitosa se valida contra su schema:
 * si la API devolviera otra forma, la UI no la interpreta. Sin cookies.
 */
import {
  ErrorEnvelopeSchema,
  IniciarSesionResponseSchema,
  MeResponseSchema,
  RegistrarIdentidadResponseSchema,
  RequisitoDeConsentimientoDeSaludResponseSchema,
  SolicitarCierreResponseSchema,
  type EsquemaDeContrato,
  type IniciarSesionResponse,
  type MeResponse,
  type RegistrarIdentidadResponse,
  type RequisitoDeConsentimientoDeSaludResponse,
  type SalidaDe,
  type SolicitarCierreResponse,
  type ValidationIssue,
} from './contratos';
import {
  AceptarSolicitudResponseSchema,
  ConsentimientoDeSaludOtorgadoResponseSchema,
  ConsentimientoOtorgadoResponseSchema,
  ConsentimientoRevocadoResponseSchema,
  DashboardResponseSchema,
  DetalleDeVinculoResponseSchema,
  HistorialDeConsentimientoDeSaludResponseSchema,
  ListaDeConsentimientosResponseSchema,
  ListaDeSolicitudesResponseSchema,
  ListaDeVinculosResponseSchema,
  RechazarSolicitudResponseSchema,
  RequisitosDeConsentimientoResponseSchema,
  RespuestaDeCrearSolicitudSchema,
  VinculoResponseSchema,
  type AceptarSolicitudResponse,
  type ConsentimientoDeSaludOtorgadoResponse,
  type ConsentimientoOtorgadoResponse,
  type ConsentimientoRevocadoResponse,
  type DashboardResponse,
  type DetalleDeVinculoResponse,
  type FinalizarVinculoRequest,
  type HistorialDeConsentimientoDeSaludResponse,
  type ListaDeConsentimientosResponse,
  type ListaDeSolicitudesResponse,
  type ListaDeVinculosResponse,
  type PausarVinculoRequest,
  type RechazarSolicitudResponse,
  type RequisitosDeConsentimientoResponse,
  type RespuestaDeCrearSolicitud,
  type VinculoResponse,
} from './contratos-vinculo';
import { FINALIDAD_DE_ALCANCE, type Alcance } from './alcance';
import type { Superficie } from './procedencia';
import { VERSION_VIGENTE } from './textos';

export type Resultado<T> =
  | { readonly ok: true; readonly datos: T }
  /** La API respondió con un ErrorEnvelope. `codigo` decide la UI; nunca se muestra en pantalla (10-B01:1146-1189). */
  | { readonly ok: false; readonly tipo: 'API'; readonly status: number; readonly codigo: string; readonly issues: readonly ValidationIssue[] }
  /** Sin respuesta: no se sabe si la acción ocurrió (10-B10:430-438). */
  | { readonly ok: false; readonly tipo: 'RED' };

/** Códigos que significan «esta sesión ya no sirve»: la UI olvida el token y vuelve a Iniciar sesión. */
export const CODIGOS_DE_SESION_NO_VALIDA: ReadonlySet<string> = new Set([
  'AUTHENTICATION_REQUIRED',
  'SESSION_INVALID',
  'SESSION_EXPIRED',
  'SESSION_REVOKED',
]);

export interface OpcionesDeCliente {
  /** Base con el prefijo de versión, sin barra final: `/api/v1` o `https://…/api/v1`. */
  readonly baseUrl: string;
  readonly superficie: Superficie;
  /** fetch de la plataforma (inyectable en pruebas). */
  readonly fetch?: typeof fetch;
}

export function crearClienteBe(opciones: OpcionesDeCliente) {
  const hacerFetch = opciones.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));

  async function llamar<S extends EsquemaDeContrato | null>(
    metodo: 'GET' | 'POST' | 'DELETE',
    ruta: string,
    extra: { token?: string; cuerpo?: unknown; claveDeIdempotencia?: string; esquema: S },
  ): Promise<Resultado<S extends EsquemaDeContrato ? SalidaDe<S> : null>> {
    const encabezados: Record<string, string> = { Accept: 'application/json', 'X-BE-Surface': opciones.superficie };
    if (extra.cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';
    if (extra.token) encabezados.Authorization = `Bearer ${extra.token}`;
    if (extra.claveDeIdempotencia) encabezados['Idempotency-Key'] = extra.claveDeIdempotencia;

    let respuesta: Response;
    try {
      respuesta = await hacerFetch(`${opciones.baseUrl}${ruta}`, {
        method: metodo,
        headers: encabezados,
        body: extra.cuerpo === undefined ? undefined : JSON.stringify(extra.cuerpo),
        credentials: 'omit',
        cache: 'no-store',
      });
    } catch {
      return { ok: false, tipo: 'RED' };
    }

    const texto = await respuesta.text().catch(() => '');
    const json = texto ? leerJson(texto) : null;
    if (!respuesta.ok) {
      const error = ErrorEnvelopeSchema.safeParse(json);
      if (!error.success) return { ok: false, tipo: 'API', status: respuesta.status, codigo: 'RESPUESTA_NO_RECONOCIDA', issues: [] };
      const issues = (error.data.error.details as { issues?: ValidationIssue[] } | undefined)?.issues ?? [];
      return { ok: false, tipo: 'API', status: respuesta.status, codigo: error.data.error.code, issues };
    }
    if (extra.esquema === null) return { ok: true, datos: null as never };
    const datos = extra.esquema.safeParse(json);
    if (!datos.success) return { ok: false, tipo: 'API', status: respuesta.status, codigo: 'RESPUESTA_NO_RECONOCIDA', issues: [] };
    return { ok: true, datos: datos.data as never };
  }

  return {
    /** API-ACC-01. A1 y A2 viajan como dos actos separados con la versión que la UI mostró. Nunca A3. */
    registrar(datos: { correo: string; contrasena: string }, claveDeIdempotencia: string): Promise<Resultado<RegistrarIdentidadResponse>> {
      return llamar('POST', '/registrations', {
        claveDeIdempotencia,
        esquema: RegistrarIdentidadResponseSchema,
        cuerpo: {
          registrationIntent: 'ADVISEE', // DL-024: la UI registra solo asesorados
          identity: { localIdentifier: datos.correo, localCredential: datos.contrasena },
          termsAcceptance: { versionId: VERSION_VIGENTE.TERMINOS.id },
          privacyAcknowledgement: { versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id },
        },
      });
    },
    /** API-ACC-02. */
    iniciarSesion(correo: string, contrasena: string): Promise<Resultado<IniciarSesionResponse>> {
      return llamar('POST', '/auth/sessions', {
        esquema: IniciarSesionResponseSchema,
        cuerpo: { method: 'LOCAL', identifier: correo, credential: contrasena },
      });
    },
    /** API-ACC-03. */
    finalizarSesion(token: string): Promise<Resultado<null>> {
      return llamar('DELETE', '/auth/sessions/current', { token, esquema: null });
    },
    /** API-ACC-04. */
    cerrarTodasLasSesiones(token: string): Promise<Resultado<null>> {
      return llamar('DELETE', '/auth/sessions', { token, esquema: null });
    },
    /** API-ACC-05. */
    consultarCuenta(token: string): Promise<Resultado<MeResponse>> {
      return llamar('GET', '/me', { token, esquema: MeResponseSchema });
    },
    /** API-CON-05 (solo lectura). */
    consultarRequisitoA3(token: string): Promise<Resultado<RequisitoDeConsentimientoDeSaludResponse>> {
      return llamar('GET', '/me/health-data-consent-requirement', { token, esquema: RequisitoDeConsentimientoDeSaludResponseSchema });
    },
    /** API-ACC-P1-03. La versión enviada es la que el diálogo mostró (06 §5.7.4 «consecuencias presentadas»). */
    solicitarCierre(token: string, claveDeIdempotencia: string): Promise<Resultado<SolicitarCierreResponse>> {
      return llamar('POST', '/me/account-closure-requests', {
        token,
        claveDeIdempotencia,
        esquema: SolicitarCierreResponseSchema,
        cuerpo: { consequencesAcknowledgement: { versionId: VERSION_VIGENTE.CONSECUENCIAS_DE_CIERRE.id }, confirmed: true },
      });
    },

    // ─── WP-03 · REL (09v8 §6) ─────────────────────────────────────────────────────────────────
    /**
     * API-REL-01 desde el profesional: el asesorado se identifica por su identificador BE (DL-035).
     * La finalidad no la elige el cliente: es la del alcance (DL-039). Responde la solicitud creada o la equivalente.
     */
    solicitarVinculo(token: string, datos: { asesoradoId: string; alcance: Alcance }, claveDeIdempotencia: string): Promise<Resultado<RespuestaDeCrearSolicitud>> {
      return llamar('POST', '/relationship-requests', {
        token,
        claveDeIdempotencia,
        esquema: RespuestaDeCrearSolicitudSchema,
        cuerpo: {
          target: { type: 'ADVISEE', identityId: datos.asesoradoId },
          scope: { code: datos.alcance },
          purpose: FINALIDAD_DE_ALCANCE[datos.alcance],
        },
      });
    },
    /** API-REL-02. */
    consultarSolicitudes(token: string, filtro: { state?: string; cursor?: string } = {}): Promise<Resultado<ListaDeSolicitudesResponse>> {
      return llamar('GET', `/me/relationship-requests${query(filtro)}`, { token, esquema: ListaDeSolicitudesResponseSchema });
    },
    /** API-REL-03. `expectedVersion`: la versión que la pantalla mostró (09:255-257). */
    aceptarSolicitud(token: string, solicitudId: string, versionMostrada: string, claveDeIdempotencia: string): Promise<Resultado<AceptarSolicitudResponse>> {
      return llamar('POST', `/relationship-requests/${encodeURIComponent(solicitudId)}/accept`, {
        token,
        claveDeIdempotencia,
        esquema: AceptarSolicitudResponseSchema,
        cuerpo: { expectedVersion: versionMostrada },
      });
    },
    /** API-REL-04. */
    rechazarSolicitud(token: string, solicitudId: string, versionMostrada: string, claveDeIdempotencia: string): Promise<Resultado<RechazarSolicitudResponse>> {
      return llamar('POST', `/relationship-requests/${encodeURIComponent(solicitudId)}/reject`, {
        token,
        claveDeIdempotencia,
        esquema: RechazarSolicitudResponseSchema,
        cuerpo: { expectedVersion: versionMostrada },
      });
    },
    /** API-REL-05. */
    consultarVinculos(token: string, filtro: { state?: string; scope?: string; cursor?: string } = {}): Promise<Resultado<ListaDeVinculosResponse>> {
      return llamar('GET', `/me/relationships${query(filtro)}`, { token, esquema: ListaDeVinculosResponseSchema });
    },
    /** API-REL-06. */
    consultarVinculo(token: string, vinculoId: string): Promise<Resultado<DetalleDeVinculoResponse>> {
      return llamar('GET', `/relationships/${encodeURIComponent(vinculoId)}`, { token, esquema: DetalleDeVinculoResponseSchema });
    },
    /** API-REL-07. */
    pausarVinculo(
      token: string,
      vinculoId: string,
      versionMostrada: string,
      motivo: PausarVinculoRequest['reason'],
      claveDeIdempotencia: string,
    ): Promise<Resultado<VinculoResponse>> {
      return llamar('POST', `/relationships/${encodeURIComponent(vinculoId)}/pause`, {
        token,
        claveDeIdempotencia,
        esquema: VinculoResponseSchema,
        cuerpo: { expectedVersion: versionMostrada, reason: motivo },
      });
    },
    /** API-REL-08. */
    reanudarVinculo(token: string, vinculoId: string, versionMostrada: string, claveDeIdempotencia: string): Promise<Resultado<VinculoResponse>> {
      return llamar('POST', `/relationships/${encodeURIComponent(vinculoId)}/resume`, {
        token,
        claveDeIdempotencia,
        esquema: VinculoResponseSchema,
        cuerpo: { expectedVersion: versionMostrada },
      });
    },
    /** API-REL-09. */
    finalizarVinculo(
      token: string,
      vinculoId: string,
      versionMostrada: string,
      motivo: FinalizarVinculoRequest['reason'],
      claveDeIdempotencia: string,
    ): Promise<Resultado<VinculoResponse>> {
      return llamar('POST', `/relationships/${encodeURIComponent(vinculoId)}/finalize`, {
        token,
        claveDeIdempotencia,
        esquema: VinculoResponseSchema,
        cuerpo: { expectedVersion: versionMostrada, reason: motivo },
      });
    },

    // ─── WP-03 · CON (09v8 §7; 09 §31-§37) ─────────────────────────────────────────────────────
    /** API-CON-01. */
    consultarRequisitosDeConsentimiento(token: string, vinculoId: string): Promise<Resultado<RequisitosDeConsentimientoResponse>> {
      return llamar('GET', `/relationships/${encodeURIComponent(vinculoId)}/consent-requirements`, {
        token,
        esquema: RequisitosDeConsentimientoResponseSchema,
      });
    },
    /** API-CON-02. La versión enviada es la que la pantalla mostró; lo demás es del servidor (09v8:1595-1605). */
    otorgarConsentimiento(token: string, vinculoId: string, versionMostrada: string, claveDeIdempotencia: string): Promise<Resultado<ConsentimientoOtorgadoResponse>> {
      return llamar('POST', `/relationships/${encodeURIComponent(vinculoId)}/consents`, {
        token,
        claveDeIdempotencia,
        esquema: ConsentimientoOtorgadoResponseSchema,
        cuerpo: { consentVersionId: versionMostrada },
      });
    },
    /** API-CON-03. */
    consultarConsentimientos(token: string, filtro: { state?: string; scope?: string; cursor?: string } = {}): Promise<Resultado<ListaDeConsentimientosResponse>> {
      return llamar('GET', `/me/consents${query(filtro)}`, { token, esquema: ListaDeConsentimientosResponseSchema });
    },
    /** API-CON-04. Idempotente por semántica: sin Idempotency-Key (09v8:1758); reintentar repite el POST. */
    revocarConsentimiento(token: string, consentimientoId: string): Promise<Resultado<ConsentimientoRevocadoResponse>> {
      return llamar('POST', `/me/consents/${encodeURIComponent(consentimientoId)}/revoke`, {
        token,
        esquema: ConsentimientoRevocadoResponseSchema,
        cuerpo: {},
      });
    },
    /** API-CON-06. La versión enviada es la que CON-05 entregó y la pantalla mostró. */
    otorgarA3(token: string, versionMostrada: string, claveDeIdempotencia: string): Promise<Resultado<ConsentimientoDeSaludOtorgadoResponse>> {
      return llamar('POST', '/me/health-data-consents', {
        token,
        claveDeIdempotencia,
        esquema: ConsentimientoDeSaludOtorgadoResponseSchema,
        cuerpo: { consentVersionId: versionMostrada },
      });
    },
    /** API-CON-07. */
    consultarHistorialA3(token: string, filtro: { cursor?: string } = {}): Promise<Resultado<HistorialDeConsentimientoDeSaludResponse>> {
      return llamar('GET', `/me/health-data-consents${query(filtro)}`, { token, esquema: HistorialDeConsentimientoDeSaludResponseSchema });
    },
    /** API-CON-08. Idempotente por semántica. */
    revocarA3(token: string, consentimientoId: string): Promise<Resultado<ConsentimientoRevocadoResponse>> {
      return llamar('POST', `/me/health-data-consents/${encodeURIComponent(consentimientoId)}/revoke`, {
        token,
        esquema: ConsentimientoRevocadoResponseSchema,
        cuerpo: {},
      });
    },

    // ─── WP-03 · DSH-03 mínimo (DL-031) ────────────────────────────────────────────────────────
    /** API-DSH-03. 404 = no hay acceso que mostrar: la UI no distingue por qué (UC-I02 E05). */
    consultarDashboard(token: string, asesoradoId: string): Promise<Resultado<DashboardResponse>> {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/dashboard`, { token, esquema: DashboardResponseSchema });
    },
  };
}

/** Query string con los filtros definidos, en orden estable. */
function query(filtro: Readonly<Record<string, string | undefined>>): string {
  const pares = Object.entries(filtro).filter((p): p is [string, string] => typeof p[1] === 'string' && p[1].length > 0);
  if (pares.length === 0) return '';
  return `?${pares.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}`;
}

export type ClienteBe = ReturnType<typeof crearClienteBe>;

function leerJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}
