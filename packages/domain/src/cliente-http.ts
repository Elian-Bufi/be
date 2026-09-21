/**
 * Cliente HTTP de los contratos de WP-02 a WP-06, compartido por el website y el APK (09v7 T21: una sola definición).
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
import {
  ActivacionDePlanResponseSchema,
  AplicarRevisionResponseSchema,
  ContextoDeRevisionResponseSchema,
  CrearEvaluacionResponseSchema,
  ElementoDeCatalogoResponseSchema,
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
  RevisionResponseSchema,
  ValidacionDePlanResponseSchema,
  type CorregirIngestaRequest,
  type CrearElementoDeCatalogoRequest,
  type CrearEvaluacionRequest,
  type CrearObjetivoRequest,
  type CrearPlanRequest,
  type EditarBorradorRequest,
  type RegistrarIngestaRequest,
  type RegistrarRevisionRequest,
} from './contratos-nutricion';
import {
  AnularMedicionResponseSchema,
  EvaluacionAntropometricaResponseSchema,
  EvolucionResponseSchema,
  ListaDeEspecificacionesResponseSchema,
  ListaDeEvaluacionesAntropometricasResponseSchema,
  MedicionSchema,
  type AnularMedicionRequestSchema,
  type CorregirMedicionRequestSchema,
  type CrearBorradorRequestSchema,
  type CrearEvaluacionAntropometricaRequestSchema,
  type GuardarBorradorRequestSchema,
} from './contratos-antropometria';
import {
  AdoptarReferenciaRequestSchema,
  CorridaResponseSchema,
  EjecutarCalculoRequestSchema,
  ListaDeCorridasResponseSchema,
  ListaDeMetodosResponseSchema,
  MetodoResponseSchema,
  ReferenciaResponseSchema,
} from './contratos-calculo';
import {
  ActivacionDePlanDeEntrenamientoResponseSchema,
  BorradorDeEjecucionResponseSchema,
  ConfirmacionDeEjecucionResponseSchema,
  ContextoDeRevisionDeEntrenamientoResponseSchema,
  CorregirEjecucionRequestSchema,
  CrearEvaluacionDeEntrenamientoRequestSchema,
  CrearObjetivoDeEntrenamientoRequestSchema,
  CrearPlanDeEntrenamientoRequestSchema,
  EditarBorradorDeEjecucionRequestSchema,
  EditarPlanDeEntrenamientoRequestSchema,
  EjecucionDeEntrenamientoResponseSchema,
  EjercicioDeCatalogoResponseSchema,
  HoyDeEntrenamientoResponseSchema,
  ListaDeEjerciciosResponseSchema,
  ListaDeEvaluacionesDeEntrenamientoResponseSchema,
  ListaDeObjetivosDeEntrenamientoResponseSchema,
  ListaDePlanesDeEntrenamientoResponseSchema,
  ObjetivoDeEntrenamientoEfectivoResponseSchema,
  ObjetivoDeEntrenamientoResponseSchema,
  OcurrenciasDelPeriodoResponseSchema,
  PlanDeEntrenamientoResponseSchema,
  RegistrarRevisionDeEntrenamientoRequestSchema,
  RevisionDeEntrenamientoResponseSchema,
} from './contratos-entrenamiento';
import { z } from 'zod';
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
    metodo: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
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

    // ─── WP-04 · NUT (09v9; CONS §11.2) e INT-NUT-01 ────────────────────────────────────────────
    /** API-NUT-01. */
    crearEvaluacion(token: string, asesoradoId: string, cuerpo: CrearEvaluacionRequest, claveDeIdempotencia: string) {
      return llamar('POST', `/advisees/${encodeURIComponent(asesoradoId)}/nutrition/evaluations`, { token, claveDeIdempotencia, esquema: CrearEvaluacionResponseSchema, cuerpo });
    },
    /** API-NUT-02. */
    listarEvaluaciones(token: string, asesoradoId: string, filtro: { cursor?: string } = {}) {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/nutrition/evaluations${query(filtro)}`, { token, esquema: ListaDeEvaluacionesResponseSchema });
    },
    /** API-NUT-04. Una versión nueva: la anterior se conserva. */
    crearObjetivo(token: string, asesoradoId: string, cuerpo: CrearObjetivoRequest, claveDeIdempotencia: string) {
      return llamar('POST', `/advisees/${encodeURIComponent(asesoradoId)}/nutrition/objectives`, { token, claveDeIdempotencia, esquema: ObjetivoResponseSchema, cuerpo });
    },
    /** API-NUT-05. */
    listarObjetivos(token: string, asesoradoId: string) {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/nutrition/objectives`, { token, esquema: ListaDeObjetivosResponseSchema });
    },
    /** API-NUT-06. */
    objetivoEfectivo(token: string, asesoradoId: string) {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/nutrition/objectives/effective`, { token, esquema: ObjetivoEfectivoResponseSchema });
    },
    /** API-NUT-07. Con `basedOnPlanId`, la versión sucesora de la efectiva (DL-047). */
    crearBorradorDePlan(token: string, asesoradoId: string, cuerpo: CrearPlanRequest, claveDeIdempotencia: string) {
      return llamar('POST', `/advisees/${encodeURIComponent(asesoradoId)}/nutrition/plans`, { token, claveDeIdempotencia, esquema: PlanResponseSchema, cuerpo });
    },
    /** API-NUT-08. */
    listarPlanes(token: string, asesoradoId: string, filtro: { state?: 'DRAFT' | 'ACTIVATED'; cursor?: string } = {}) {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/nutrition/plans${query(filtro)}`, { token, esquema: ListaDePlanesResponseSchema });
    },
    /** API-NUT-09. Una versión activada llega desde su instantánea. */
    consultarPlan(token: string, planId: string) {
      return llamar('GET', `/nutrition/plans/${encodeURIComponent(planId)}`, { token, esquema: PlanResponseSchema });
    },
    /** API-NUT-10. Sin Idempotency-Key: concurrencia por la versión que la pantalla mostró. */
    guardarBorrador(token: string, planId: string, cuerpo: EditarBorradorRequest) {
      return llamar('PATCH', `/nutrition/plans/${encodeURIComponent(planId)}`, { token, esquema: PlanResponseSchema, cuerpo });
    },
    /** API-NUT-11. Validar no activa. */
    validarPlan(token: string, planId: string, versionMostrada: string) {
      return llamar('POST', `/nutrition/plans/${encodeURIComponent(planId)}/validate`, { token, esquema: ValidacionDePlanResponseSchema, cuerpo: { expectedVersion: versionMostrada } });
    },
    /** API-NUT-12. */
    activarPlan(token: string, planId: string, versionMostrada: string, claveDeIdempotencia: string) {
      return llamar('POST', `/nutrition/plans/${encodeURIComponent(planId)}/activate`, {
        token,
        claveDeIdempotencia,
        esquema: ActivacionDePlanResponseSchema,
        cuerpo: { expectedVersion: versionMostrada },
      });
    },
    /** API-NUT-13. */
    buscarEnCatalogo(token: string, texto: string) {
      return llamar('GET', `/nutrition/catalog-items${query({ q: texto, limit: '20' })}`, { token, esquema: ListaDeCatalogoResponseSchema });
    },
    /** API-INT-NUT-01. */
    crearElementoDeCatalogo(token: string, cuerpo: CrearElementoDeCatalogoRequest, claveDeIdempotencia: string) {
      return llamar('POST', '/nutrition/catalog-items', { token, claveDeIdempotencia, esquema: ElementoDeCatalogoResponseSchema, cuerpo });
    },
    /** API-NUT-14. El servidor fija la fecha; el día tipo lo elige el asesorado si hay más de uno (DL-049). */
    hoyNutricional(token: string, diaTipoId?: string) {
      return llamar('GET', `/me/nutrition/today${query({ dayTypeId: diaTipoId })}`, { token, esquema: HoyResponseSchema });
    },
    /** API-NUT-15. */
    registrarIngesta(token: string, cuerpo: RegistrarIngestaRequest, claveDeIdempotencia: string) {
      return llamar('POST', '/me/nutrition/executions', { token, claveDeIdempotencia, esquema: IngestaResponseSchema, cuerpo });
    },
    /** Registros propios (DL-055). */
    listarMisIngestas(token: string, filtro: { cursor?: string } = {}) {
      return llamar('GET', `/me/nutrition/executions${query(filtro)}`, { token, esquema: ListaDeIngestasResponseSchema });
    },
    /** API-NUT-16. */
    consultarIngesta(token: string, ingestaId: string) {
      return llamar('GET', `/nutrition/executions/${encodeURIComponent(ingestaId)}`, { token, esquema: IngestaResponseSchema });
    },
    /** API-NUT-21. */
    corregirIngesta(token: string, ingestaId: string, cuerpo: CorregirIngestaRequest, claveDeIdempotencia: string) {
      return llamar('POST', `/nutrition/executions/${encodeURIComponent(ingestaId)}/corrections`, { token, claveDeIdempotencia, esquema: IngestaResponseSchema, cuerpo });
    },
    /** API-NUT-17. Ver no es revisar. */
    contextoDeRevision(token: string, asesoradoId: string, periodo: { periodStart?: string; periodEnd?: string } = {}) {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/nutrition/review-context${query(periodo)}`, { token, esquema: ContextoDeRevisionResponseSchema });
    },
    /** API-NUT-18. */
    registrarRevision(token: string, asesoradoId: string, cuerpo: RegistrarRevisionRequest, claveDeIdempotencia: string) {
      return llamar('POST', `/advisees/${encodeURIComponent(asesoradoId)}/nutrition/reviews`, { token, claveDeIdempotencia, esquema: RevisionResponseSchema, cuerpo });
    },
    /** API-NUT-19. */
    consultarRevision(token: string, revisionId: string) {
      return llamar('GET', `/nutrition/reviews/${encodeURIComponent(revisionId)}`, { token, esquema: RevisionResponseSchema });
    },
    /** API-NUT-20. Aplica la próxima acción que la revisión ya declaró. */
    aplicarRevision(token: string, revisionId: string, claveDeIdempotencia: string) {
      return llamar('POST', `/nutrition/reviews/${encodeURIComponent(revisionId)}/apply`, { token, claveDeIdempotencia, esquema: AplicarRevisionResponseSchema, cuerpo: { expectedVersion: 'v1' } });
    },

    // ─── ANT · antropometría (WP-05) ──────────────────────────────────────────────────────────
    /**
     * API-ANT-01: protocolos y métodos admitidos. Sin `status` devuelve las versiones vigentes, que es lo que el
     * catálogo existe para ofrecer; con `HISTORICAL`, las superadas, que se consultan pero no se seleccionan para
     * una corrida nueva (REG-06-203; DL-072).
     */
    listarEspecificaciones(token: string, filtro: { kind?: 'PROTOCOL' | 'METHOD'; status?: 'CURRENT' | 'HISTORICAL'; cursor?: string } = {}) {
      return llamar('GET', `/anthropometry/specifications${query(filtro)}`, { token, esquema: ListaDeEspecificacionesResponseSchema });
    },
    /** API-ANT-02: la evaluación nace REGISTRADA, en un solo acto atómico (09v11 §6). */
    crearEvaluacionAntropometrica(token: string, asesoradoId: string, cuerpo: z.input<typeof CrearEvaluacionAntropometricaRequestSchema>, claveDeIdempotencia: string) {
      return llamar('POST', `/advisees/${asesoradoId}/anthropometry/evaluations`, {
        token,
        claveDeIdempotencia,
        esquema: EvaluacionAntropometricaResponseSchema,
        cuerpo,
      });
    },
    /** API-ANT-07: crear la evaluación EN PREPARACIÓN. */
    crearBorradorAntropometrico(token: string, asesoradoId: string, cuerpo: z.input<typeof CrearBorradorRequestSchema>, claveDeIdempotencia: string) {
      return llamar('POST', `/advisees/${asesoradoId}/anthropometry/evaluation-drafts`, {
        token,
        claveDeIdempotencia,
        esquema: EvaluacionAntropometricaResponseSchema,
        cuerpo,
      });
    },
    /** API-ANT-08: borradores retomables. */
    listarBorradoresAntropometricos(token: string, asesoradoId: string, filtro: { cursor?: string } = {}) {
      return llamar('GET', `/advisees/${asesoradoId}/anthropometry/evaluation-drafts${query(filtro)}`, {
        token,
        esquema: ListaDeEvaluacionesAntropometricasResponseSchema,
      });
    },
    /** API-ANT-03: las registradas, que son las que forman historia. */
    listarEvaluacionesAntropometricas(token: string, asesoradoId: string, filtro: { cursor?: string } = {}) {
      return llamar('GET', `/advisees/${asesoradoId}/anthropometry/evaluations${query(filtro)}`, {
        token,
        esquema: ListaDeEvaluacionesAntropometricasResponseSchema,
      });
    },
    /** API-ANT-04 y 09. */
    consultarEvaluacionAntropometrica(token: string, evaluacionId: string) {
      return llamar('GET', `/anthropometry/evaluations/${evaluacionId}`, { token, esquema: EvaluacionAntropometricaResponseSchema });
    },
    /** API-ANT-09: el borrador propio, en la colección del borrador. */
    consultarBorradorAntropometrico(token: string, evaluacionId: string) {
      return llamar('GET', `/anthropometry/evaluation-drafts/${evaluacionId}`, { token, esquema: EvaluacionAntropometricaResponseSchema });
    },
    /** API-ANT-10: guardar el borrador con su token de trabajo. */
    guardarBorradorAntropometrico(token: string, evaluacionId: string, cuerpo: z.input<typeof GuardarBorradorRequestSchema>) {
      return llamar('PUT', `/anthropometry/evaluation-drafts/${evaluacionId}`, { token, esquema: EvaluacionAntropometricaResponseSchema, cuerpo });
    },
    /** API-ANT-11: el acto explícito de registro. */
    registrarEvaluacionAntropometrica(token: string, evaluacionId: string, versionEsperada: string, claveDeIdempotencia: string) {
      return llamar('POST', `/anthropometry/evaluation-drafts/${evaluacionId}/register`, {
        token,
        claveDeIdempotencia,
        esquema: EvaluacionAntropometricaResponseSchema,
        cuerpo: { expectedVersion: versionEsperada },
      });
    },
    /** API-ANT-05: corregir, conservando el original. */
    corregirMedicion(token: string, evaluacionId: string, cuerpo: z.input<typeof CorregirMedicionRequestSchema>, claveDeIdempotencia: string) {
      return llamar('POST', `/anthropometry/evaluations/${evaluacionId}/corrections`, {
        token,
        claveDeIdempotencia,
        esquema: z.strictObject({ data: MedicionSchema.loose() }),
        cuerpo,
      });
    },
    /** API-ANT-12: anular. Una segunda anulación responde 200 con la existente, no un error (DL-059). */
    anularMedicion(token: string, medicionId: string, cuerpo: z.input<typeof AnularMedicionRequestSchema>, claveDeIdempotencia: string) {
      return llamar('POST', `/anthropometry/measurements/${medicionId}/annulments`, {
        token,
        claveDeIdempotencia,
        esquema: AnularMedicionResponseSchema,
        cuerpo,
      });
    },
    /** API-ANT-06, del lado del profesional. */
    evolucionAntropometrica(token: string, asesoradoId: string, filtro: { periodStart?: string; periodEnd?: string; metric?: string } = {}) {
      return llamar('GET', `/advisees/${asesoradoId}/anthropometry/progress${query(filtro)}`, { token, esquema: EvolucionResponseSchema });
    },
    /** API-ANT-06, del lado del asesorado: lo consume la APK (RF-049, RF-065). */
    miEvolucionAntropometrica(token: string, filtro: { periodStart?: string; periodEnd?: string; metric?: string } = {}) {
      return llamar('GET', `/me/anthropometry/progress${query(filtro)}`, { token, esquema: EvolucionResponseSchema });
    },

    // ─── MTH y CAL · cálculo profesional reproducible (09v16 §21) ────────────────────────────
    /** API-MTH-01: los métodos seleccionables. Son metadatos: no lleva asesorado. */
    listarMetodos(token: string, filtro: { purpose?: string; cursor?: string; limit?: string } = {}) {
      return llamar('GET', `/professional-methods${query(filtro)}`, { token, esquema: ListaDeMetodosResponseSchema });
    },
    /** API-MTH-02: la versión exacta, seleccionable o histórica. */
    consultarMetodo(token: string, metodoId: string, versionId: string) {
      return llamar('GET', `/professional-methods/${encodeURIComponent(metodoId)}/versions/${encodeURIComponent(versionId)}`, { token, esquema: MetodoResponseSchema });
    },
    /** API-CAL-01: ejecutar. No crea objetivo ni prescripción, y la respuesta no dice que lo haya hecho. */
    ejecutarCalculo(token: string, asesoradoId: string, cuerpo: z.input<typeof EjecutarCalculoRequestSchema>, claveDeIdempotencia: string) {
      return llamar('POST', `/advisees/${asesoradoId}/calculations`, { token, claveDeIdempotencia, esquema: CorridaResponseSchema, cuerpo });
    },
    /** API-CAL-02: las corridas, tal como coexisten. */
    listarCalculos(token: string, asesoradoId: string, filtro: { purpose?: string; cursor?: string; limit?: string } = {}) {
      return llamar('GET', `/advisees/${asesoradoId}/calculations${query(filtro)}`, { token, esquema: ListaDeCorridasResponseSchema });
    },
    /** API-CAL-03: una corrida, con su método, su versión y su regla. */
    consultarCalculo(token: string, corridaId: string) {
      return llamar('GET', `/calculations/${encodeURIComponent(corridaId)}`, { token, esquema: CorridaResponseSchema });
    },
    /** API-CAL-04: adoptar una corrida como referencia. Es una relación, no una decisión automática. */
    adoptarReferenciaDeCalculo(token: string, asesoradoId: string, finalidad: string, cuerpo: z.input<typeof AdoptarReferenciaRequestSchema>, claveDeIdempotencia: string) {
      return llamar('PUT', `/advisees/${asesoradoId}/calculation-references/${encodeURIComponent(finalidad)}`, {
        token,
        claveDeIdempotencia,
        esquema: ReferenciaResponseSchema,
        cuerpo,
      });
    },

    // ─── TRN · entrenamiento (WP-06; 09v10) ──────────────────────────────────────────────────
    /** API-TRN-01. */
    crearEvaluacionDeEntrenamiento(token: string, asesoradoId: string, cuerpo: z.input<typeof CrearEvaluacionDeEntrenamientoRequestSchema>, claveDeIdempotencia: string) {
      return llamar('POST', `/advisees/${encodeURIComponent(asesoradoId)}/training/evaluations`, { token, claveDeIdempotencia, esquema: CrearEvaluacionResponseSchema, cuerpo });
    },
    /** API-TRN-02. */
    listarEvaluacionesDeEntrenamiento(token: string, asesoradoId: string, filtro: { cursor?: string } = {}) {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/training/evaluations${query(filtro)}`, { token, esquema: ListaDeEvaluacionesDeEntrenamientoResponseSchema });
    },
    /** API-TRN-04: una versión nueva; la anterior se conserva. */
    crearObjetivoDeEntrenamiento(token: string, asesoradoId: string, cuerpo: z.input<typeof CrearObjetivoDeEntrenamientoRequestSchema>, claveDeIdempotencia: string) {
      return llamar('POST', `/advisees/${encodeURIComponent(asesoradoId)}/training/objectives`, { token, claveDeIdempotencia, esquema: ObjetivoDeEntrenamientoResponseSchema, cuerpo });
    },
    /** API-TRN-05. */
    listarObjetivosDeEntrenamiento(token: string, asesoradoId: string) {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/training/objectives`, { token, esquema: ListaDeObjetivosDeEntrenamientoResponseSchema });
    },
    /** API-TRN-06: la terminal de la sucesión; `null` si no hay. */
    objetivoDeEntrenamientoEfectivo(token: string, asesoradoId: string) {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/training/objectives/effective`, { token, esquema: ObjetivoDeEntrenamientoEfectivoResponseSchema });
    },
    /** API-TRN-07: el borrador es el mismo recurso del plan, en DRAFT. */
    crearPlanDeEntrenamiento(token: string, asesoradoId: string, cuerpo: z.input<typeof CrearPlanDeEntrenamientoRequestSchema>, claveDeIdempotencia: string) {
      return llamar('POST', `/advisees/${encodeURIComponent(asesoradoId)}/training/plans`, { token, claveDeIdempotencia, esquema: PlanDeEntrenamientoResponseSchema, cuerpo });
    },
    /** API-TRN-08. */
    listarPlanesDeEntrenamiento(token: string, asesoradoId: string, filtro: { state?: 'DRAFT' | 'ACTIVATED'; cursor?: string } = {}) {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/training/plans${query(filtro)}`, { token, esquema: ListaDePlanesDeEntrenamientoResponseSchema });
    },
    /** API-TRN-09. */
    consultarPlanDeEntrenamiento(token: string, planId: string) {
      return llamar('GET', `/training/plans/${encodeURIComponent(planId)}`, { token, esquema: PlanDeEntrenamientoResponseSchema });
    },
    /** API-TRN-10: con la versión que se está viendo; si cambió, 409. */
    editarPlanDeEntrenamiento(token: string, planId: string, cuerpo: z.input<typeof EditarPlanDeEntrenamientoRequestSchema>) {
      return llamar('PATCH', `/training/plans/${encodeURIComponent(planId)}`, { token, esquema: PlanDeEntrenamientoResponseSchema, cuerpo });
    },
    /** API-TRN-11: validar no activa y no es un estado. */
    validarPlanDeEntrenamiento(token: string, planId: string, versionMostrada: string) {
      return llamar('POST', `/training/plans/${encodeURIComponent(planId)}/validate`, { token, esquema: ValidacionDePlanResponseSchema, cuerpo: { expectedVersion: versionMostrada } });
    },
    /** API-TRN-12. */
    activarPlanDeEntrenamiento(token: string, planId: string, versionMostrada: string, claveDeIdempotencia: string) {
      return llamar('POST', `/training/plans/${encodeURIComponent(planId)}/activate`, {
        token,
        claveDeIdempotencia,
        esquema: ActivacionDePlanDeEntrenamientoResponseSchema,
        cuerpo: { expectedVersion: versionMostrada },
      });
    },
    /** API-TRN-13. */
    buscarEjercicios(token: string, texto: string) {
      return llamar('GET', `/training/exercises${query({ q: texto, limit: '20' })}`, { token, esquema: ListaDeEjerciciosResponseSchema });
    },
    /** API-INT-TRN-01: carga manual, con cero zonas hasta WP-07. */
    crearEjercicio(token: string, nombre: string, claveDeIdempotencia: string) {
      return llamar('POST', '/training/exercises', {
        token,
        claveDeIdempotencia,
        esquema: EjercicioDeCatalogoResponseSchema,
        cuerpo: { name: nombre, muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } },
      });
    },
    /** API-TRN-14. */
    hoyDeEntrenamiento(token: string) {
      return llamar('GET', '/me/training/today', { token, esquema: HoyDeEntrenamientoResponseSchema });
    },
    /** DL-078: para registrar en diferido. */
    ocurrenciasDeEntrenamiento(token: string, periodo: { periodStart: string; periodEnd: string }) {
      return llamar('GET', `/me/training/occurrences${query(periodo)}`, { token, esquema: OcurrenciasDelPeriodoResponseSchema });
    },
    /** API-TRN-15: «Comenzar» o «Continuar sesión»: siempre el mismo borrador de la ocurrencia. */
    abrirBorradorDeEjecucion(token: string, occurrenceId: string) {
      return llamar('PUT', `/training/occurrences/${encodeURIComponent(occurrenceId)}/execution-draft`, { token, esquema: BorradorDeEjecucionResponseSchema, cuerpo: {} });
    },
    /** API-TRN-16. */
    consultarBorradorDeEjecucion(token: string, draftId: string) {
      return llamar('GET', `/training/execution-drafts/${encodeURIComponent(draftId)}`, { token, esquema: BorradorDeEjecucionResponseSchema });
    },
    /** API-TRN-17: guardado incremental. */
    guardarBorradorDeEjecucion(token: string, draftId: string, cuerpo: z.input<typeof EditarBorradorDeEjecucionRequestSchema>) {
      return llamar('PATCH', `/training/execution-drafts/${encodeURIComponent(draftId)}`, { token, esquema: BorradorDeEjecucionResponseSchema, cuerpo });
    },
    /** API-TRN-18: confirmar crea la ejecución registrada; no hay vuelta. */
    confirmarEjecucion(token: string, draftId: string, versionMostrada: string, claveDeIdempotencia: string) {
      return llamar('POST', `/training/execution-drafts/${encodeURIComponent(draftId)}/confirm`, {
        token,
        claveDeIdempotencia,
        esquema: ConfirmacionDeEjecucionResponseSchema,
        cuerpo: { expectedVersion: versionMostrada },
      });
    },
    /** API-TRN-19. */
    consultarEjecucionDeEntrenamiento(token: string, executionId: string) {
      return llamar('GET', `/training/executions/${encodeURIComponent(executionId)}`, { token, esquema: EjecucionDeEntrenamientoResponseSchema });
    },
    /** API-TRN-20: el original queda; la corrección conserva autor y motivo. */
    corregirEjecucion(token: string, executionId: string, cuerpo: z.input<typeof CorregirEjecucionRequestSchema>, claveDeIdempotencia: string) {
      return llamar('POST', `/training/executions/${encodeURIComponent(executionId)}/corrections`, { token, claveDeIdempotencia, esquema: EjecucionDeEntrenamientoResponseSchema, cuerpo });
    },
    /** API-TRN-21: ver no es revisar. */
    contextoDeRevisionDeEntrenamiento(token: string, asesoradoId: string, periodo: { periodStart?: string; periodEnd?: string } = {}) {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/training/review-context${query(periodo)}`, { token, esquema: ContextoDeRevisionDeEntrenamientoResponseSchema });
    },
    /** API-TRN-22. */
    registrarRevisionDeEntrenamiento(token: string, asesoradoId: string, cuerpo: z.input<typeof RegistrarRevisionDeEntrenamientoRequestSchema>, claveDeIdempotencia: string) {
      return llamar('POST', `/advisees/${encodeURIComponent(asesoradoId)}/training/reviews`, { token, claveDeIdempotencia, esquema: RevisionDeEntrenamientoResponseSchema, cuerpo });
    },
    /** API-TRN-24. */
    aplicarRevisionDeEntrenamiento(token: string, revisionId: string, claveDeIdempotencia: string) {
      return llamar('POST', `/training/reviews/${encodeURIComponent(revisionId)}/apply`, { token, claveDeIdempotencia, esquema: AplicarRevisionResponseSchema, cuerpo: { expectedVersion: 'v1' } });
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
