/**
 * Cliente HTTP de los contratos de WP-02 a WP-08, compartido por el website y el APK (09v7 T21: una sola definición).
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
  LoQueFaltaParaSeguirResponseSchema,
  PerfilPropioResponseSchema,
  type EditarPerfilPropioRequest,
  type LoQueFaltaParaSeguirResponse,
  type PerfilPropioResponse,
} from './contratos-perfil-propio';
import { DetalleDeCuentaDeGoogleInexistenteSchema, DetalleDeCuentaDeGoogleSchema, RUTAS_DE_ACCESO_GOOGLE, SesionConGoogleResponseSchema } from './contratos-acceso-google';
import { declaracionDeMayoriaDeEdad } from './mayoria-de-edad';
import { CodigosDeRecuperacionResponseSchema, ConfiguracionDelAutenticadorResponseSchema, DetalleDeCodigoInvalidoSchema } from './contratos-administracion';
import { ConfiguracionDeLaSesionConfirmadaResponseSchema, SegundoFactorDeLaSesionResponseSchema, SegundoFactorDeLaSesionVerificadoResponseSchema } from './segundo-factor-del-profesional';
import { ExportacionResponseSchema, ListaDePedidosDeDerechoResponseSchema, PedidoDeDerechoResponseSchema, type CrearExportacionRequest, type CrearPedidoDeDerechoRequest } from './derechos-del-titular';
import {
  CandidatoDeAlimentoResponseSchema,
  CandidatoDeEjercicioResponseSchema,
  ResolucionDeAlimentoResponseSchema,
  ResolucionDeEjercicioResponseSchema,
  type ResolverCandidatoDeAlimentoRequest,
  type ResolverCandidatoDeEjercicioRequest,
} from './contratos-integraciones';
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
import { CarteraResponseSchema, type CarteraResponse, type FiltroDeCartera } from './contratos-cartera';
import { ColaDeRevisionesResponseSchema, type ColaDeRevisionesResponse, type FiltroDeLaCola } from './contratos-cola-de-revisiones';
import { DescarteDeBorradorResponseSchema } from './contratos-descarte-de-borrador';
import {
  InvitacionCreadaResponseSchema,
  InvitacionResponseSchema,
  ListaDeInvitacionesResponseSchema,
  VistaPreviaDeInvitacionResponseSchema,
  type InvitacionCreadaResponse,
  type InvitacionResponse,
  type ListaDeInvitacionesResponse,
  type SecretoDeInvitacionRequest,
  type VistaPreviaDeInvitacionResponse,
} from './contratos-invitaciones';
import {
  ListaDeNovedadesResponseSchema,
  NovedadResponseSchema,
  PreferenciasDeAvisosResponseSchema,
  SuscripcionPushResponseSchema,
  type RegistrarSuscripcionPushRequest,
  type ReemplazarPreferenciasDeAvisosRequest,
} from './contratos-novedades';
import {
  DestinatariosPosiblesResponseSchema,
  ListaDeNotasPropiasResponseSchema,
  NotaDeCoordinacionResponseSchema,
  type CrearNotaDeCoordinacionRequest,
  type DestinatariosPosiblesResponse,
  type ListaDeNotasPropiasResponse,
  type NotaDeCoordinacionResponse,
} from './contratos-notas-de-coordinacion';
import {
  LineaDeTiempoResponseSchema,
  ListaDeVistasResponseSchema,
  ProyeccionResponseSchema,
  VistaDeAnalisisResponseSchema,
  type BusquedaEnLineaDeTiempoRequest,
  type ClaveDeProyeccion,
  type CrearVistaRequest,
  type ReemplazarVistaRequest,
} from './contratos-analisis';
import { EvidenciaDeRevisionResponseSchema } from './contratos-evidencia-de-revision';

/**
 * Los filtros de API-DSH-04, ya como texto de la consulta (listas separadas por coma). Sin `q`: la búsqueda va en el
 * cuerpo de API-DSH-04-BUSQUEDA (`buscarEnLineaDeTiempo`), nunca en una URL (DL-127).
 */
export type FiltroDeLineaDeTiempo = {
  readonly periodStart?: string;
  readonly periodEnd?: string;
  readonly domain?: string;
  readonly type?: string;
  readonly state?: string;
  readonly quality?: string;
  readonly late?: 'true';
  readonly planVersionId?: string;
  readonly exerciseId?: string;
  /** El instante de un corte (la última revisión de un área): lo nuevo desde entonces (WP-DASHBOARD-COMPRENSION). */
  readonly since?: string;
  readonly limit?: string;
  readonly cursor?: string;
};

const CLAVES_DE_LA_LINEA_DE_TIEMPO = ['periodStart', 'periodEnd', 'domain', 'type', 'state', 'quality', 'late', 'planVersionId', 'exerciseId', 'since', 'limit', 'cursor'] as const satisfies readonly (keyof FiltroDeLineaDeTiempo)[];

/** Los parámetros de API-PRJ-01, ya como texto de la consulta. */
export type FiltroDeProyeccion = {
  readonly periodStart?: string;
  readonly periodEnd?: string;
  readonly metric?: string;
  readonly exerciseId?: string;
  readonly setIndex?: string;
  readonly unit?: 'kg' | 'lb';
  readonly grain?: 'ORIGINAL' | 'DAY' | 'WEEK';
};
import {
  DetalleDeEvidenciaVisualRequeridaSchema,
  EvidenciaVisualOtorgadaResponseSchema,
  ListaDeEvidenciaVisualResponseSchema,
  RequisitoDeEvidenciaVisualResponseSchema,
  type DetalleDeEvidenciaVisualRequerida,
  type EvidenciaVisualOtorgadaResponse,
  type ListaDeEvidenciaVisualResponse,
  type RequisitoDeEvidenciaVisualResponse,
} from './contratos-evidencia-visual';
import {
  ListaDePlantillasDeEntrenamientoResponseSchema,
  PlantillaDeEntrenamientoResponseSchema,
  type CrearPlantillaDeEntrenamientoRequest,
  type EditarPlantillaRequest,
  type NuevaVersionDePlantillaRequest,
  ListaDePlantillasNutricionalesResponseSchema,
  PlantillaNutricionalResponseSchema,
  type CrearPlantillaNutricionalRequest,
  type NuevaVersionDePlantillaNutricionalRequest,
} from './contratos-plantillas';
import {
  ComidaHabitualResponseSchema,
  ListaDeAlimentosHabitualesResponseSchema,
  ListaDeComidasHabitualesResponseSchema,
  ListaDeEjerciciosHabitualesResponseSchema,
  ListaDeSesionesHabitualesResponseSchema,
  MarcaDeAlimentoResponseSchema,
  MarcaDeEjercicioResponseSchema,
  SesionHabitualResponseSchema,
  type EditarHabitualRequest,
  type GuardarComidaHabitualRequest,
  type GuardarSesionHabitualRequest,
  type MarcarHabitualRequest,
} from './contratos-habituales';
import {
  ActivacionDePlanResponseSchema,
  AplicarRevisionResponseSchema,
  ContextoDeRevisionResponseSchema,
  CrearEvaluacionResponseSchema,
  ElementoDeCatalogoResponseSchema,
  HoyResponseSchema,
  IngestaResponseSchema,
  BusquedaEnCatalogoResponseSchema,
  ListaDeEvaluacionesResponseSchema,
  ListaDeIngestasResponseSchema,
  ListaDeObjetivosResponseSchema,
  ListaDePlanesResponseSchema,
  ObjetivoEfectivoResponseSchema,
  ObjetivoResponseSchema,
  PlanResponseSchema,
  ListaDeRevisionesPropiasResponseSchema,
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
  AccesoAMedioResponseSchema,
  IntencionDeSubidaResponseSchema,
  MedioResponseSchema,
  type IntencionDeSubidaRequest,
} from './contratos-medios';
import {
  CalculoDeRecetaResponseSchema,
  DetalleDeRecetaResponseSchema,
  ListaDeRecetasResponseSchema,
  RecetaResponseSchema,
  type AsociarImagenDeRecetaRequest,
  type CalcularRecetaRequest,
  type CrearRecetaRequest,
  type EditarRecetaRequest,
} from './contratos-recetas';
import {
  HoyConOpcionesResponseSchema,
  ListaDeRegistrosDeComidaResponseSchema,
  RegistroDeComidaResponseSchema,
  type AnularRegistroRequest,
  type RectificarCantidadesRequest,
  type RegistrarComidaRequest,
} from './contratos-registro-de-comidas';
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
  AgendaDeHoyResponseSchema,
  HoyDeEntrenamientoResponseSchema,
  BusquedaDeEjerciciosResponseSchema,
  ListaDeEvaluacionesDeEntrenamientoResponseSchema,
  ListaDeObjetivosDeEntrenamientoResponseSchema,
  ListaDePlanesDeEntrenamientoResponseSchema,
  ObjetivoDeEntrenamientoEfectivoResponseSchema,
  ObjetivoDeEntrenamientoResponseSchema,
  HistorialDeEntrenamientoResponseSchema,
  OcurrenciasDelPeriodoResponseSchema,
  PlanDeEntrenamientoResponseSchema,
  RegistrarRevisionDeEntrenamientoRequestSchema,
  ListaDeRevisionesDeEntrenamientoPropiasResponseSchema,
  RevisionDeEntrenamientoResponseSchema,
} from './contratos-entrenamiento';
import {
  EjercicioPropioResponseSchema,
  ListaDeEjerciciosPropiosResponseSchema,
  PlanConObjetivosResponseSchema,
  ResultadoDeEventosResponseSchema,
  SesionEnCursoResponseSchema,
  SesionParaRegistrarResponseSchema,
  TiemposDeSesionResponseSchema,
  type AsociarImagenDeEjercicioRequest,
  type RegistrarEventosDeTiempoRequest,
} from './contratos-entrenamiento-por-serie';
import { FichaVisualDeEjercicioResponseSchema, FichasVisualesResponseSchema, type CambiarZonasDeEjercicioRequest } from './contratos-catalogo-visual';
import { ListaDeZonasMuscularesResponseSchema } from './zonas-musculares';
import {
  CrearSolicitudDeFormularioRequestSchema,
  DetalleDeSolicitudResponseSchema,
  EnviarRespuestaRequestSchema,
  ListaDePlantillasResponseSchema,
  ListaDeSolicitudesDeFormularioResponseSchema,
  ListaDeSolicitudesPropiasResponseSchema,
  RectificacionCreadaResponseSchema,
  RectificarRespuestaRequestSchema,
  RespuestaCreadaResponseSchema,
  SolicitudDeFormularioCreadaResponseSchema,
  VersionDePlantillaResponseSchema,
} from './contratos-formularios';
import {
  DetalleDeSolicitudV2ResponseSchema,
  ListaDeSolicitudesPropiasV2ResponseSchema,
  PropuestaCargadaResponseSchema,
  PropuestaResueltaResponseSchema,
  VersionDePlantillaV2ResponseSchema,
  type CargarPropuestaRequest,
  type EnviarRespuestaV2Request,
  type RectificarRespuestaV2Request,
  type ResolverPropuestaRequest,
} from './contratos-formularios-v2';
import {
  HabitosCompartidosEstadoResponseSchema,
  HabitosCompartidosResponseSchema,
  HabitosRegistradosResponseSchema,
  HabitosParaElProfesionalResponseSchema,
  MisHabitosResponseSchema,
  PedidoDeAccesoCreadoResponseSchema,
  PedidoDeAccesoRespondidoResponseSchema,
  PedidosDeAccesoResponseSchema,
  type CompartirHabitosRequest,
  type DejarDeCompartirHabitosRequest,
  type PedirAccesoAHabitosRequest,
  type RegistrarHabitosRequest,
  type ResponderPedidoDeAccesoRequest,
} from './contratos-habitos-de-la-persona';
import {
  LoQueSeComparteDeMiAreaResponseSchema,
  MisResumenesCompartidosResponseSchema,
  PedidoDePlanCreadoResponseSchema,
  PedidoDePlanRespondidoResponseSchema,
  PedidosDePlanResponseSchema,
  PlanCompartidoResponseSchema,
  ResumenesCompartidosEstadoResponseSchema,
  ResumenesParaElProfesionalResponseSchema,
  type AreaConPlan,
  type CompartirResumenesRequest,
  type DejarDeCompartirResumenesRequest,
  type PedirVerElPlanRequest,
  type ResponderPedidoDePlanRequest,
} from './contratos-resumenes-compartidos';
import { z } from 'zod';
import { FINALIDAD_DE_ALCANCE, type Alcance } from './alcance';
import { HEADER_DE_CAPACIDADES, valorDeCapacidades, type CapacidadDeCliente } from './compatibilidad-de-clientes';
import type { Superficie } from './procedencia';
import { VERSION_VIGENTE } from './textos';
import { RecuperacionPedidaResponseSchema, type RecuperacionPedidaResponse } from './recuperacion-de-acceso';

export type Resultado<T> =
  | {
      readonly ok: true;
      readonly datos: T;
      /**
       * La cabecera `Date` de la respuesta, si se pudo leer. La APK la usa para medir la vigencia de la sesión contra el
       * reloj del servidor. En el navegador no llega: CORS no la expone.
       */
      readonly fechaDelServidor?: string;
    }
  /** La API respondió con un ErrorEnvelope. `codigo` decide la UI; nunca se muestra en pantalla (10-B01:1146-1189). */
  | {
      readonly ok: false;
      readonly tipo: 'API';
      readonly status: number;
      readonly codigo: string;
      readonly issues: readonly ValidationIssue[];
      /**
       * Con `VISUAL_EVIDENCE_ACT_REQUIRED` (API-MED-01; DL-125): el vínculo y la versión del texto a mostrar, validados
       * contra su schema. Sin ellos, la pantalla no tiene qué mostrar y lo trata como cualquier otro rechazo.
       */
      readonly evidenciaVisual?: DetalleDeEvidenciaVisualRequerida;
      /**
       * Con `GOOGLE_LINK_REQUIRED` o `GOOGLE_ACCOUNT_NOT_FOUND` (familia GOO; DL-138): el correo verificado de la cuenta de
       * Google, para decir con qué cuenta sigue la persona (vincular o crear).
       */
      readonly correoDeGoogle?: string;
      /**
       * Con `GOOGLE_ACCOUNT_NOT_FOUND` (DL-169, UF-D2): el nombre de la cuenta de Google que la API leyó del token
       * verificado, para proponerlo al crear la cuenta; `null` si no trae uno que se pueda guardar.
       */
      readonly nombreDeGoogle?: string | null;
      /** Con `SECOND_FACTOR_INVALID` (familia MFA, UF-11): cuántos intentos le quedan a la sesión antes de revocarse. */
      readonly intentosRestantes?: number;
    }
  /** Sin respuesta: no se sabe si la acción ocurrió (10-B10:430-438). */
  | { readonly ok: false; readonly tipo: 'RED' };

/** Los rechazos de la familia GOO que traen el correo de la cuenta de Google en `details` (DL-138). */
const CODIGOS_CON_CORREO_DE_GOOGLE: ReadonlySet<string> = new Set(['GOOGLE_LINK_REQUIRED', 'GOOGLE_ACCOUNT_NOT_FOUND']);

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
  /**
   * Lo que este cliente sabe mostrar, en `X-BE-Capabilities` (`compatibilidad-de-clientes.ts`). Solo lo declara quien lo
   * dibuja: la APK que muestra los objetivos de cada serie. Sin capacidades, la cabecera no va.
   */
  readonly capacidades?: readonly CapacidadDeCliente[];
  /** fetch de la plataforma (inyectable en pruebas). */
  readonly fetch?: typeof fetch;
}

export function crearClienteBe(opciones: OpcionesDeCliente) {
  const hacerFetch = opciones.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const capacidades = opciones.capacidades && opciones.capacidades.length > 0 ? valorDeCapacidades(opciones.capacidades) : null;

  async function llamar<S extends EsquemaDeContrato | null>(
    metodo: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    ruta: string,
    extra: {
      token?: string;
      cuerpo?: unknown;
      claveDeIdempotencia?: string;
      esquema: S;
      /**
       * DL-147: la operación abre, reanuda o cierra una sesión del website, y viaja con la cookie de reanudación
       * (HttpOnly, de la API). Solo en la superficie WEB: la APK nunca manda ni recibe cookies.
       */
      conCookies?: boolean;
    },
  ): Promise<Resultado<S extends EsquemaDeContrato ? SalidaDe<S> : null>> {
    const encabezados: Record<string, string> = { Accept: 'application/json', 'X-BE-Surface': opciones.superficie };
    if (capacidades) encabezados[HEADER_DE_CAPACIDADES] = capacidades;
    if (extra.cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';
    if (extra.token) encabezados.Authorization = `Bearer ${extra.token}`;
    if (extra.claveDeIdempotencia) encabezados['Idempotency-Key'] = extra.claveDeIdempotencia;

    let respuesta: Response;
    try {
      respuesta = await hacerFetch(`${opciones.baseUrl}${ruta}`, {
        method: metodo,
        headers: encabezados,
        body: extra.cuerpo === undefined ? undefined : JSON.stringify(extra.cuerpo),
        credentials: extra.conCookies && opciones.superficie === 'WEB' ? 'include' : 'omit',
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
      const evidenciaVisual = error.data.error.code === 'VISUAL_EVIDENCE_ACT_REQUIRED' ? DetalleDeEvidenciaVisualRequeridaSchema.safeParse(error.data.error.details) : null;
      // GOOGLE_ACCOUNT_NOT_FOUND trae también el nombre de la cuenta de Google (DL-169, UF-D2); GOOGLE_LINK_REQUIRED, solo
      // el correo.
      const cuentaInexistente = error.data.error.code === 'GOOGLE_ACCOUNT_NOT_FOUND' ? DetalleDeCuentaDeGoogleInexistenteSchema.safeParse(error.data.error.details) : null;
      const cuentaDeGoogle = CODIGOS_CON_CORREO_DE_GOOGLE.has(error.data.error.code) ? DetalleDeCuentaDeGoogleSchema.safeParse(error.data.error.details) : null;
      const codigoInvalido = error.data.error.code === 'SECOND_FACTOR_INVALID' ? DetalleDeCodigoInvalidoSchema.safeParse(error.data.error.details) : null;
      const deGoogle = cuentaInexistente?.success
        ? { correoDeGoogle: cuentaInexistente.data.email, nombreDeGoogle: cuentaInexistente.data.name }
        : cuentaDeGoogle?.success
          ? { correoDeGoogle: cuentaDeGoogle.data.email }
          : {};
      return {
        ok: false,
        tipo: 'API',
        status: respuesta.status,
        codigo: error.data.error.code,
        issues,
        ...(evidenciaVisual?.success ? { evidenciaVisual: evidenciaVisual.data } : {}),
        ...deGoogle,
        ...(codigoInvalido?.success ? { intentosRestantes: codigoInvalido.data.attemptsRemaining } : {}),
      };
    }
    const fecha = respuesta.headers?.get?.('date');
    const conFecha = fecha ? { fechaDelServidor: fecha } : {};
    if (extra.esquema === null) return { ok: true, datos: null as never, ...conFecha };
    const datos = extra.esquema.safeParse(json);
    if (!datos.success) return { ok: false, tipo: 'API', status: respuesta.status, codigo: 'RESPUESTA_NO_RECONOCIDA', issues: [] };
    return { ok: true, datos: datos.data as never, ...conFecha };
  }

  /**
   * API-MED-02: sube los bytes de una imagen a la ruta firmada de la intención, con su tipo. No lleva sesión: la ruta
   * firmada es la autorización, y vence a los 10 minutos. La respuesta se valida como cualquier otra.
   */
  async function subirBytes(rutaDeSubida: string, cuerpo: Blob | ArrayBuffer | Uint8Array, tipo: string): Promise<Resultado<SalidaDe<typeof MedioResponseSchema>>> {
    let respuesta: Response;
    try {
      respuesta = await hacerFetch(`${opciones.baseUrl}${rutaDeSubida}`, {
        method: 'PUT',
        headers: { Accept: 'application/json', 'Content-Type': tipo, 'X-BE-Surface': opciones.superficie },
        body: cuerpo as BodyInit,
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
    const datos = MedioResponseSchema.safeParse(json);
    if (!datos.success) return { ok: false, tipo: 'API', status: respuesta.status, codigo: 'RESPUESTA_NO_RECONOCIDA', issues: [] };
    return { ok: true, datos: datos.data };
  }

  return {
    /** La URL absoluta de una ruta de la API (la de una imagen con su acceso firmado, por ejemplo). */
    urlDe(ruta: string): string {
      return `${opciones.baseUrl}${ruta}`;
    },
    /**
     * API-ACC-01. A1, A2 y la declaración de mayoría de edad viajan como actos separados con la versión que la UI mostró.
     * Nunca A3. `mayoriaDeEdad` es la casilla que la persona marcó (08 §24.7 a; DL-138): el cliente no la declara por ella.
     * Sin ese dato no viaja la declaración, y la API responde 422 (la pantalla tiene que mostrar la casilla).
     * `nombre` es «Nombre y apellido», obligatorio desde DL-169 (UF-01): la cuenta nace con su perfil propio v1.
     */
    registrar(datos: { correo: string; contrasena: string; nombre: string; mayoriaDeEdad?: boolean }, claveDeIdempotencia: string): Promise<Resultado<RegistrarIdentidadResponse>> {
      return llamar('POST', '/registrations', {
        claveDeIdempotencia,
        esquema: RegistrarIdentidadResponseSchema,
        cuerpo: {
          registrationIntent: 'ADVISEE', // DL-024: la UI registra solo asesorados
          identity: { localIdentifier: datos.correo, localCredential: datos.contrasena },
          profile: { displayName: datos.nombre },
          termsAcceptance: { versionId: VERSION_VIGENTE.TERMINOS.id },
          privacyAcknowledgement: { versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id },
          ...(datos.mayoriaDeEdad === undefined ? {} : { adultDeclaration: declaracionDeMayoriaDeEdad(datos.mayoriaDeEdad) }),
        },
      });
    },
    /**
     * API-GOO-01 (DL-138): entrar con el ID token que el cliente obtuvo de Google. Responde la sesión como `iniciarSesion`;
     * GOOGLE_LINK_REQUIRED y GOOGLE_ACCOUNT_NOT_FOUND traen `correoDeGoogle`; 503 DEPENDENCY_UNAVAILABLE: Google no está
     * disponible y el acceso local sigue.
     */
    iniciarSesionConGoogle(idToken: string): Promise<Resultado<IniciarSesionResponse>> {
      return llamar('POST', RUTAS_DE_ACCESO_GOOGLE.sesiones, { esquema: SesionConGoogleResponseSchema, cuerpo: { idToken }, conCookies: true });
    },
    /** API-GOO-02 (DL-138): vincular Google a la cuenta con contraseña del mismo correo, confirmando esa contraseña. */
    vincularGoogle(idToken: string, contrasena: string): Promise<Resultado<IniciarSesionResponse>> {
      return llamar('POST', RUTAS_DE_ACCESO_GOOGLE.vinculos, { esquema: SesionConGoogleResponseSchema, cuerpo: { idToken, credential: contrasena }, conCookies: true });
    },
    /**
     * API-GOO-03 (DL-138): crear la cuenta con Google, con los mismos actos que `registrar` y la casilla de mayoría de
     * edad que la persona marcó. Responde la sesión (201 creada; 200 si esa cuenta de Google ya tenía identidad).
     * `nombre`: el que propuso la API (el de la cuenta de Google, UF-D2), confirmado o corregido por la persona (DL-169).
     */
    registrarConGoogle(idToken: string, mayoriaDeEdad: boolean, nombre: string): Promise<Resultado<IniciarSesionResponse>> {
      return llamar('POST', RUTAS_DE_ACCESO_GOOGLE.registros, {
        esquema: SesionConGoogleResponseSchema,
        cuerpo: {
          idToken,
          registrationIntent: 'ADVISEE', // DL-024: la UI registra solo asesorados
          profile: { displayName: nombre },
          termsAcceptance: { versionId: VERSION_VIGENTE.TERMINOS.id },
          privacyAcknowledgement: { versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id },
          adultDeclaration: declaracionDeMayoriaDeEdad(mayoriaDeEdad),
        },
        conCookies: true,
      });
    },
    /** API-ACC-02. */
    iniciarSesion(correo: string, contrasena: string): Promise<Resultado<IniciarSesionResponse>> {
      return llamar('POST', '/auth/sessions', {
        esquema: IniciarSesionResponseSchema,
        cuerpo: { method: 'LOCAL', identifier: correo, credential: contrasena },
        conCookies: true,
      });
    },
    /**
     * API-ACC-P1-01 (UF-03, DL-169): pedir la recuperación del acceso con el correo de la cuenta. La respuesta es la misma
     * exista o no la cuenta: el pedido, su vencimiento y cómo llega el código (por correo o por Administración).
     */
    pedirRecuperacion(correo: string): Promise<Resultado<RecuperacionPedidaResponse>> {
      return llamar('POST', '/auth/recovery-requests', { esquema: RecuperacionPedidaResponseSchema, cuerpo: { identifier: correo } });
    },
    /**
     * API-ACC-P1-02 (UF-03): completar con el código y la contraseña nueva. Sin cuerpo en la respuesta (204): después se
     * entra con la contraseña nueva. Un código que no vale, siempre RECOVERY_CODE_INVALID.
     */
    completarRecuperacion(recoveryId: string, codigo: string, contrasenaNueva: string): Promise<Resultado<null>> {
      return llamar('POST', `/auth/recovery-requests/${encodeURIComponent(recoveryId)}/complete`, { esquema: null, cuerpo: { proof: codigo, newCredential: contrasenaNueva } });
    },
    /**
     * API-ACC-02-REANUDACION (DL-147): después de recargar, el website pide un token nuevo de la misma sesión con la cookie
     * de reanudación. Sin cookie, o con una sesión que ya no sirve, responde un código de sesión (401).
     */
    reanudarSesion(): Promise<Resultado<IniciarSesionResponse>> {
      return llamar('POST', '/auth/sessions/resume', { esquema: IniciarSesionResponseSchema, conCookies: true });
    },
    /** API-ACC-03. En el website, también borra la cookie de reanudación (DL-147). */
    finalizarSesion(token: string): Promise<Resultado<null>> {
      return llamar('DELETE', '/auth/sessions/current', { token, esquema: null, conCookies: true });
    },
    /** API-ACC-04. En el website, también borra la cookie de reanudación de este navegador (DL-147). */
    cerrarTodasLasSesiones(token: string): Promise<Resultado<null>> {
      return llamar('DELETE', '/auth/sessions', { token, esquema: null, conCookies: true });
    },
    /** API-ACC-05. */
    consultarCuenta(token: string): Promise<Resultado<MeResponse>> {
      return llamar('GET', '/me', { token, esquema: MeResponseSchema });
    },
    /** API-ACC-06-PROPIA (DL-009 y DL-040): el perfil propio, con su nombre visible y su versión efectiva. */
    consultarPerfilPropio(token: string): Promise<Resultado<PerfilPropioResponse>> {
      return llamar('GET', '/me/profile', { token, esquema: PerfilPropioResponseSchema });
    },
    /**
     * API-ACC-06: cambia el nombre visible. Desde DL-169 (UF-D3) no se quita: `null` o vacío responden 422. Sin
     * Idempotency-Key: concurrencia por `expectedVersion`.
     */
    editarPerfilPropio(token: string, cuerpo: EditarPerfilPropioRequest): Promise<Resultado<PerfilPropioResponse>> {
      return llamar('PATCH', '/me/profile', { token, cuerpo, esquema: PerfilPropioResponseSchema });
    },
    /**
     * API-ACC-07 (DL-169, UF-D4): lo que la cuenta tiene que completar antes de usar BE. Vacío, sigue; con pasos, la
     * pantalla «Antes de seguir» los pide, y uno que este cliente no conoce pide actualizar (`conocePasos`).
     */
    loQueFaltaParaSeguir(token: string): Promise<Resultado<LoQueFaltaParaSeguirResponse>> {
      return llamar('GET', '/me/pending-steps', { token, esquema: LoQueFaltaParaSeguirResponseSchema });
    },
    // ─── UF-11 (DL-169): el segundo factor del profesional, familia MFA ───────────────────────────────
    /** API-MFA-01: el estado del segundo factor de la sesión. */
    segundoFactorDeLaSesion(token: string) {
      return llamar('GET', '/me/second-factor', { token, esquema: SegundoFactorDeLaSesionResponseSchema });
    },
    /** API-MFA-02: el código del autenticador. */
    verificarSegundoFactorDeLaSesion(token: string, codigo: string) {
      return llamar('POST', '/me/second-factor/verification', { token, cuerpo: { code: codigo }, esquema: SegundoFactorDeLaSesionVerificadoResponseSchema });
    },
    /** API-MFA-03: un código de recuperación. */
    usarCodigoDeRecuperacionDeLaSesion(token: string, codigo: string) {
      return llamar('POST', '/me/second-factor/recovery-code', { token, cuerpo: { recoveryCode: codigo }, esquema: SegundoFactorDeLaSesionVerificadoResponseSchema });
    },
    /** API-MFA-04: empezar a configurar (o a reemplazar) el autenticador. */
    iniciarConfiguracionDeLaSesion(token: string) {
      return llamar('POST', '/me/second-factor/enrollment', { token, cuerpo: {}, esquema: ConfiguracionDelAutenticadorResponseSchema });
    },
    /** API-MFA-05: confirmar la configuración con un código del autenticador nuevo. */
    confirmarConfiguracionDeLaSesion(token: string, codigo: string) {
      return llamar('POST', '/me/second-factor/enrollment/confirm', { token, cuerpo: { code: codigo }, esquema: ConfiguracionDeLaSesionConfirmadaResponseSchema });
    },
    /** API-MFA-06: diez códigos de recuperación nuevos. */
    codigosDeRecuperacionNuevosDeLaSesion(token: string) {
      return llamar('POST', '/me/second-factor/recovery-codes', { token, cuerpo: {}, esquema: CodigosDeRecuperacionResponseSchema });
    },
    // ─── UF-06 (DL-169): los derechos de la persona ───────────────────────────────────────────────────
    /** API-RGT-01: pedir el acceso, la rectificación o la supresión, con su clave de idempotencia. */
    pedirUnDerecho(token: string, pedido: CrearPedidoDeDerechoRequest, claveDeIdempotencia: string) {
      return llamar('POST', '/me/data-rights-requests', { token, cuerpo: pedido, claveDeIdempotencia, esquema: PedidoDeDerechoResponseSchema });
    },
    /** API-RGT-03: los pedidos propios. */
    pedidosDeDerechos(token: string, cursor?: string) {
      return llamar('GET', `/me/data-rights-requests?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { token, esquema: ListaDePedidosDeDerechoResponseSchema });
    },
    /** API-EXP-01: pedir la exportación propia. */
    exportarMisDatos(token: string, pedido: CrearExportacionRequest, claveDeIdempotencia: string) {
      return llamar('POST', '/me/exports', { token, cuerpo: pedido, claveDeIdempotencia, esquema: ExportacionResponseSchema });
    },
    /** API-EXP-02: el estado de la exportación, con una ruta de descarga firmada nueva (relativa a la base de la API). */
    exportacionPropia(token: string, exportacionId: string) {
      return llamar('GET', `/me/exports/${encodeURIComponent(exportacionId)}`, { token, esquema: ExportacionResponseSchema });
    },
    /** La dirección completa de una ruta firmada de descarga (API-EXP-02-DESCARGA), para abrirla en el navegador. */
    direccionDeDescarga(ruta: string): string {
      return `${opciones.baseUrl}${ruta}`;
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

    // ─── EVIDENCIA_VISUAL (08 §12.4 y §21.3; DL-125) ──────────────────────────────────────────────
    /** API-EVI-01. El texto a mostrar antes de la primera foto para el profesional de ese vínculo. */
    consultarRequisitoDeEvidenciaVisual(token: string, vinculoId: string): Promise<Resultado<RequisitoDeEvidenciaVisualResponse>> {
      return llamar('GET', `/relationships/${encodeURIComponent(vinculoId)}/visual-evidence-requirement`, { token, esquema: RequisitoDeEvidenciaVisualResponseSchema });
    },
    /** API-EVI-02. La versión enviada es la que la pantalla mostró; lo demás es del servidor. */
    otorgarEvidenciaVisual(token: string, vinculoId: string, versionMostrada: string, claveDeIdempotencia: string): Promise<Resultado<EvidenciaVisualOtorgadaResponse>> {
      return llamar('POST', `/relationships/${encodeURIComponent(vinculoId)}/visual-evidence-consents`, {
        token,
        claveDeIdempotencia,
        esquema: EvidenciaVisualOtorgadaResponseSchema,
        cuerpo: { consentVersionId: versionMostrada },
      });
    },
    /** API-EVI-03. */
    consultarEvidenciasVisuales(token: string, filtro: { cursor?: string } = {}): Promise<Resultado<ListaDeEvidenciaVisualResponse>> {
      return llamar('GET', `/me/visual-evidence-consents${query(filtro)}`, { token, esquema: ListaDeEvidenciaVisualResponseSchema });
    },
    /** API-EVI-04. Idempotente por semántica: sin Idempotency-Key; reintentar repite el POST. */
    revocarEvidenciaVisual(token: string, actoId: string): Promise<Resultado<ConsentimientoRevocadoResponse>> {
      return llamar('POST', `/me/visual-evidence-consents/${encodeURIComponent(actoId)}/revoke`, {
        token,
        esquema: ConsentimientoRevocadoResponseSchema,
        cuerpo: {},
      });
    },

    // ─── WP-03 · DSH-03 mínimo (DL-031) ────────────────────────────────────────────────────────
    /**
     * API-DSH-03. 404 = no hay acceso que mostrar: la UI no distingue por qué (UC-I02 E05). El período es opcional
     * (instantes RFC 3339): sin él, los conteos son de toda la historia, como hasta ahora.
     */
    consultarDashboard(token: string, asesoradoId: string, periodo?: { readonly periodStart?: string; readonly periodEnd?: string }): Promise<Resultado<DashboardResponse>> {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/dashboard${query({ periodStart: periodo?.periodStart, periodEnd: periodo?.periodEnd })}`, { token, esquema: DashboardResponseSchema });
    },
    // ─── PF-09 · Plantillas de plan de entrenamiento (DL-108) ─────────────────────────────
    crearPlantillaDeEntrenamiento(token: string, cuerpo: CrearPlantillaDeEntrenamientoRequest, clave: string) {
      return llamar('POST', '/training/plan-templates', { token, cuerpo, claveDeIdempotencia: clave, esquema: PlantillaDeEntrenamientoResponseSchema });
    },
    listarPlantillasDeEntrenamiento(token: string, filtro: { state?: 'ACTIVE' | 'ARCHIVED'; cursor?: string } = {}) {
      return llamar('GET', `/training/plan-templates${query(filtro)}`, { token, esquema: ListaDePlantillasDeEntrenamientoResponseSchema });
    },
    consultarPlantillaDeEntrenamiento(token: string, templateId: string) {
      return llamar('GET', `/training/plan-templates/${encodeURIComponent(templateId)}`, { token, esquema: PlantillaDeEntrenamientoResponseSchema });
    },
    nuevaVersionDePlantillaDeEntrenamiento(token: string, templateId: string, cuerpo: NuevaVersionDePlantillaRequest, clave: string) {
      return llamar('POST', `/training/plan-templates/${encodeURIComponent(templateId)}/versions`, { token, cuerpo, claveDeIdempotencia: clave, esquema: PlantillaDeEntrenamientoResponseSchema });
    },
    editarPlantillaDeEntrenamiento(token: string, templateId: string, cuerpo: EditarPlantillaRequest) {
      return llamar('PATCH', `/training/plan-templates/${encodeURIComponent(templateId)}`, { token, cuerpo, esquema: PlantillaDeEntrenamientoResponseSchema });
    },
    crearPlantillaNutricional(token: string, cuerpo: CrearPlantillaNutricionalRequest, clave: string) {
      return llamar('POST', '/nutrition/plan-templates', { token, cuerpo, claveDeIdempotencia: clave, esquema: PlantillaNutricionalResponseSchema });
    },
    listarPlantillasNutricionales(token: string, filtro: { state?: 'ACTIVE' | 'ARCHIVED'; cursor?: string } = {}) {
      return llamar('GET', `/nutrition/plan-templates${query(filtro)}`, { token, esquema: ListaDePlantillasNutricionalesResponseSchema });
    },
    consultarPlantillaNutricional(token: string, templateId: string) {
      return llamar('GET', `/nutrition/plan-templates/${encodeURIComponent(templateId)}`, { token, esquema: PlantillaNutricionalResponseSchema });
    },
    nuevaVersionDePlantillaNutricional(token: string, templateId: string, cuerpo: NuevaVersionDePlantillaNutricionalRequest, clave: string) {
      return llamar('POST', `/nutrition/plan-templates/${encodeURIComponent(templateId)}/versions`, { token, cuerpo, claveDeIdempotencia: clave, esquema: PlantillaNutricionalResponseSchema });
    },
    editarPlantillaNutricional(token: string, templateId: string, cuerpo: EditarPlantillaRequest) {
      return llamar('PATCH', `/nutrition/plan-templates/${encodeURIComponent(templateId)}`, { token, cuerpo, esquema: PlantillaNutricionalResponseSchema });
    },
    /** API-CAR-01 (PF-07, propuesta; DL-116): los pendientes de toda la cartera del profesional. */
    consultarCartera(token: string, filtro: FiltroDeCartera = {}): Promise<Resultado<CarteraResponse>> {
      return llamar('GET', `/me/portfolio${query(filtro as Readonly<Record<string, string | undefined>>)}`, { token, esquema: CarteraResponseSchema });
    },
    /**
     * API-DSH-02 (09 v0.11 §14; DL-163 D-6): la cola de revisiones. Una API anterior a la operación responde 404: el
     * website muestra la mesa sin esas filas (TB-14).
     */
    consultarColaDeRevisiones(token: string, filtro: FiltroDeLaCola = {}): Promise<Resultado<ColaDeRevisionesResponse>> {
      return llamar('GET', `/me/review-queue${query(filtro as Readonly<Record<string, string | undefined>>)}`, { token, esquema: ColaDeRevisionesResponseSchema });
    },

    // ─── PF-09 bis · «Mis habituales» (DL-109) ────────────────────────────────────────────────
    /** API-HAB-01. */
    listarEjerciciosHabituales(token: string) {
      return llamar('GET', '/training/favorite-exercises', { token, esquema: ListaDeEjerciciosHabitualesResponseSchema });
    },
    /** API-HAB-02: marcar o quitar, la misma operación. */
    marcarEjercicioHabitual(token: string, exerciseId: string, cuerpo: MarcarHabitualRequest) {
      return llamar('PATCH', `/training/favorite-exercises/${encodeURIComponent(exerciseId)}`, { token, cuerpo, esquema: MarcaDeEjercicioResponseSchema });
    },
    /** API-HAB-03. */
    listarSesionesHabituales(token: string, filtro: { cursor?: string } = {}) {
      return llamar('GET', `/training/session-presets${query(filtro)}`, { token, esquema: ListaDeSesionesHabitualesResponseSchema });
    },
    /** API-HAB-04. */
    guardarSesionHabitual(token: string, cuerpo: GuardarSesionHabitualRequest, clave: string) {
      return llamar('POST', '/training/session-presets', { token, cuerpo, claveDeIdempotencia: clave, esquema: SesionHabitualResponseSchema });
    },
    /** API-HAB-05: renombrar o quitar. */
    editarSesionHabitual(token: string, presetId: string, cuerpo: EditarHabitualRequest) {
      return llamar('PATCH', `/training/session-presets/${encodeURIComponent(presetId)}`, { token, cuerpo, esquema: SesionHabitualResponseSchema });
    },
    /** API-HAN-01. */
    listarAlimentosHabituales(token: string) {
      return llamar('GET', '/nutrition/favorite-items', { token, esquema: ListaDeAlimentosHabitualesResponseSchema });
    },
    /** API-HAN-02: marcar o quitar, la misma operación. */
    marcarAlimentoHabitual(token: string, catalogItemId: string, cuerpo: MarcarHabitualRequest) {
      return llamar('PATCH', `/nutrition/favorite-items/${encodeURIComponent(catalogItemId)}`, { token, cuerpo, esquema: MarcaDeAlimentoResponseSchema });
    },
    /** API-HAN-03. */
    listarComidasHabituales(token: string, filtro: { cursor?: string } = {}) {
      return llamar('GET', `/nutrition/meal-presets${query(filtro)}`, { token, esquema: ListaDeComidasHabitualesResponseSchema });
    },
    /** API-HAN-04. */
    guardarComidaHabitual(token: string, cuerpo: GuardarComidaHabitualRequest, clave: string) {
      return llamar('POST', '/nutrition/meal-presets', { token, cuerpo, claveDeIdempotencia: clave, esquema: ComidaHabitualResponseSchema });
    },
    /** API-HAN-05: renombrar o quitar. */
    editarComidaHabitual(token: string, presetId: string, cuerpo: EditarHabitualRequest) {
      return llamar('PATCH', `/nutrition/meal-presets/${encodeURIComponent(presetId)}`, { token, cuerpo, esquema: ComidaHabitualResponseSchema });
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
    /**
     * API-PLN-07 (DL-163 D-21; TB-47): descartar un borrador que nunca se activó, con la versión que la pantalla mostró.
     * Una versión activada responde 422 PLAN_NOT_EDITABLE; una descartada, el mismo 404 que una inexistente.
     */
    descartarBorradorDePlanNutricional(token: string, planId: string, versionMostrada: string, claveDeIdempotencia: string) {
      return llamar('POST', `/nutrition/plans/${encodeURIComponent(planId)}/discard`, {
        token,
        claveDeIdempotencia,
        esquema: DescarteDeBorradorResponseSchema,
        cuerpo: { expectedVersion: versionMostrada },
      });
    },
    /**
     * API-NUT-13-BUSQUEDA (DL-130): buscar en el catálogo con el texto en el cuerpo, nunca en una URL. Es una lectura: sin
     * clave de idempotencia. API-NUT-13 (`q` en la URL) queda como contrato legado de la API. Cada alimento trae el nombre
     * alternativo que coincidió, si fue por uno (DL-141).
     */
    buscarEnCatalogo(token: string, texto: string) {
      return llamar('POST', '/nutrition/catalog-items/search', { token, esquema: BusquedaEnCatalogoResponseSchema, cuerpo: { q: texto, limit: 20 } });
    },
    /** API-INT-NUT-01. */
    crearElementoDeCatalogo(token: string, cuerpo: CrearElementoDeCatalogoRequest, claveDeIdempotencia: string) {
      return llamar('POST', '/nutrition/catalog-items', { token, claveDeIdempotencia, esquema: ElementoDeCatalogoResponseSchema, cuerpo });
    },
    /** API-INT-NUT-02: consulta Open Food Facts y crea un candidato. Todavía no es un elemento del catálogo. */
    crearCandidatoDeAlimento(token: string, codigoDeBarras: string, claveDeIdempotencia: string) {
      return llamar('POST', '/nutrition/catalog-import-candidates', {
        token,
        claveDeIdempotencia,
        esquema: CandidatoDeAlimentoResponseSchema,
        cuerpo: { provider: 'OPEN_FOOD_FACTS', lookup: { externalId: codigoDeBarras } },
      });
    },
    /** API-INT-NUT-03: incorporar lo revisado o rechazarlo. */
    resolverCandidatoDeAlimento(token: string, candidateId: string, cuerpo: ResolverCandidatoDeAlimentoRequest, claveDeIdempotencia: string) {
      return llamar('POST', `/nutrition/catalog-import-candidates/${encodeURIComponent(candidateId)}/resolve`, {
        token,
        claveDeIdempotencia,
        esquema: ResolucionDeAlimentoResponseSchema,
        cuerpo,
      });
    },
    /** API-NUT-14. El servidor fija la fecha; el día tipo lo elige el asesorado si hay más de uno (DL-049). */
    hoyNutricional(token: string, diaTipoId?: string) {
      return llamar('GET', `/me/nutrition/today${query({ dayTypeId: diaTipoId })}`, { token, esquema: HoyResponseSchema });
    },
    /** API-NUT-15. */
    registrarIngesta(token: string, cuerpo: RegistrarIngestaRequest, claveDeIdempotencia: string) {
      return llamar('POST', '/me/nutrition/executions', { token, claveDeIdempotencia, esquema: IngestaResponseSchema, cuerpo });
    },
    /** Registros propios (DL-055). `limit` es el del contrato (API-NUT-16-LISTA): Inicio pide solo el último. */
    listarMisIngestas(token: string, filtro: { cursor?: string; limit?: string } = {}) {
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
    // ─── REC · recetas (DL-119) ──────────────────────────────────────────────────────────────
    /** API-REC-01. */
    crearReceta(token: string, cuerpo: CrearRecetaRequest, claveDeIdempotencia: string) {
      return llamar('POST', '/nutrition/recipes', { token, claveDeIdempotencia, esquema: RecetaResponseSchema, cuerpo });
    },
    /** API-REC-02. */
    listarRecetas(token: string, filtro: { cursor?: string; limit?: string } = {}) {
      return llamar('GET', `/nutrition/recipes${query(filtro)}`, { token, esquema: ListaDeRecetasResponseSchema });
    },
    /** API-REC-03. */
    consultarReceta(token: string, recetaId: string) {
      return llamar('GET', `/nutrition/recipes/${encodeURIComponent(recetaId)}`, { token, esquema: DetalleDeRecetaResponseSchema });
    },
    /** API-REC-04: emite una versión nueva. */
    editarReceta(token: string, recetaId: string, cuerpo: EditarRecetaRequest, claveDeIdempotencia: string) {
      return llamar('PATCH', `/nutrition/recipes/${encodeURIComponent(recetaId)}`, { token, claveDeIdempotencia, esquema: RecetaResponseSchema, cuerpo });
    },
    /** API-REC-05: asocia o reemplaza la imagen de referencia. */
    asociarImagenDeReceta(token: string, recetaId: string, cuerpo: AsociarImagenDeRecetaRequest, claveDeIdempotencia: string) {
      return llamar('PUT', `/nutrition/recipes/${encodeURIComponent(recetaId)}/image`, { token, claveDeIdempotencia, esquema: RecetaResponseSchema, cuerpo });
    },
    /** API-REC-06: retira la imagen; el medio no se borra y la historia queda. */
    retirarImagenDeReceta(token: string, recetaId: string, expectedVersion: string, claveDeIdempotencia: string) {
      return llamar('DELETE', `/nutrition/recipes/${encodeURIComponent(recetaId)}/image${query({ expectedVersion })}`, { token, claveDeIdempotencia, esquema: RecetaResponseSchema });
    },
    /** API-REC-07: calcula sin guardar, para ver el cálculo mientras se edita. */
    calcularReceta(token: string, cuerpo: CalcularRecetaRequest) {
      return llamar('POST', '/nutrition/recipe-calculations', { token, esquema: CalculoDeRecetaResponseSchema, cuerpo });
    },

    // ─── MED · medios privados (DL-120) ─────────────────────────────────────────────────────
    /** API-MED-01: la intención de subida, con su ruta firmada. */
    crearIntencionDeSubida(token: string, cuerpo: IntencionDeSubidaRequest, claveDeIdempotencia: string) {
      return llamar('POST', '/me/media/upload-intents', { token, claveDeIdempotencia, esquema: IntencionDeSubidaResponseSchema, cuerpo });
    },
    /** API-MED-02. */
    subirMedio: subirBytes,
    /** API-MED-03: la ruta de lectura firmada, que vence en 15 minutos como máximo. */
    accederAMedio(token: string, medioId: string) {
      return llamar('GET', `/media/${encodeURIComponent(medioId)}/access`, { token, esquema: AccesoAMedioResponseSchema });
    },
    /** API-MED-05: supresión a pedido de una foto propia de una comida. */
    suprimirMedio(token: string, medioId: string, claveDeIdempotencia: string) {
      return llamar('DELETE', `/me/media/${encodeURIComponent(medioId)}`, { token, claveDeIdempotencia, esquema: MedioResponseSchema });
    },

    // ─── ING · registro de comidas v2 (DL-121) ──────────────────────────────────────────────
    /** API-ING-01: «Hoy» con las opciones, sus imágenes y los macros de las porciones del plan. */
    hoyConOpciones(token: string, diaTipoId?: string) {
      return llamar('GET', `/me/nutrition/today/options${query({ dayTypeId: diaTipoId })}`, { token, esquema: HoyConOpcionesResponseSchema });
    },
    /** API-ING-02: el mismo comando desde el carrusel y desde el detalle, con la misma clave por intento. */
    registrarComida(token: string, cuerpo: RegistrarComidaRequest, claveDeIdempotencia: string) {
      return llamar('POST', '/me/nutrition/meal-records', { token, claveDeIdempotencia, esquema: RegistroDeComidaResponseSchema, cuerpo });
    },
    /** API-ING-03. */
    consultarRegistroDeComida(token: string, registroId: string) {
      return llamar('GET', `/nutrition/meal-records/${encodeURIComponent(registroId)}`, { token, esquema: RegistroDeComidaResponseSchema });
    },
    /** API-ING-04. */
    listarMisRegistrosDeComida(token: string, filtro: { from?: string; to?: string; cursor?: string; limit?: string } = {}) {
      return llamar('GET', `/me/nutrition/meal-records${query(filtro)}`, { token, esquema: ListaDeRegistrosDeComidaResponseSchema });
    },
    /** API-ING-05: completar o corregir las cantidades, como una rectificación. */
    rectificarCantidades(token: string, registroId: string, cuerpo: RectificarCantidadesRequest, claveDeIdempotencia: string) {
      return llamar('POST', `/nutrition/meal-records/${encodeURIComponent(registroId)}/consumed-quantities`, { token, claveDeIdempotencia, esquema: RegistroDeComidaResponseSchema, cuerpo });
    },
    /** API-ING-06: deshacer, como una anulación auditable. */
    deshacerRegistroDeComida(token: string, registroId: string, cuerpo: AnularRegistroRequest, claveDeIdempotencia: string) {
      return llamar('POST', `/nutrition/meal-records/${encodeURIComponent(registroId)}/annulment`, { token, claveDeIdempotencia, esquema: RegistroDeComidaResponseSchema, cuerpo });
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
    /** API-NUT-19-EVIDENCIA (DL-154): la evidencia que guardó la revisión, resuelta con el permiso de hoy. Solo la lee el website. */
    evidenciaDeRevision(token: string, revisionId: string) {
      return llamar('GET', `/nutrition/reviews/${encodeURIComponent(revisionId)}/evidence`, { token, esquema: EvidenciaDeRevisionResponseSchema });
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
    /** API-PLE-05 (DL-163 D-21; TB-47): el par de API-PLN-07 en Entrenamiento. */
    descartarBorradorDePlanDeEntrenamiento(token: string, planId: string, versionMostrada: string, claveDeIdempotencia: string) {
      return llamar('POST', `/training/plans/${encodeURIComponent(planId)}/discard`, {
        token,
        claveDeIdempotencia,
        esquema: DescarteDeBorradorResponseSchema,
        cuerpo: { expectedVersion: versionMostrada },
      });
    },
    /**
     * API-TRN-13-BUSQUEDA (DL-130): buscar ejercicios con el texto en el cuerpo, nunca en una URL. Es una lectura: sin
     * clave de idempotencia. API-TRN-13 (`q` en la URL) queda como contrato legado de la API. Cada ejercicio trae el nombre
     * alternativo que coincidió, si fue por uno (DL-141).
     */
    buscarEjercicios(token: string, texto: string) {
      return llamar('POST', '/training/exercises/search', { token, esquema: BusquedaDeEjerciciosResponseSchema, cuerpo: { q: texto, limit: 20 } });
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
    /** API-INT-TRN-02: consulta wger y crea un candidato. Los músculos que trae son dato del proveedor. */
    crearCandidatoDeEjercicio(token: string, numeroDeWger: string, claveDeIdempotencia: string) {
      return llamar('POST', '/training/catalog-import-candidates', {
        token,
        claveDeIdempotencia,
        esquema: CandidatoDeEjercicioResponseSchema,
        cuerpo: { provider: 'WGER', lookup: { externalId: numeroDeWger } },
      });
    },
    /** API-INT-TRN-03: incorporar lo revisado o rechazarlo. */
    resolverCandidatoDeEjercicio(token: string, candidateId: string, cuerpo: ResolverCandidatoDeEjercicioRequest, claveDeIdempotencia: string) {
      return llamar('POST', `/training/catalog-import-candidates/${encodeURIComponent(candidateId)}/resolve`, {
        token,
        claveDeIdempotencia,
        esquema: ResolucionDeEjercicioResponseSchema,
        cuerpo,
      });
    },
    /** API-TRN-14. */
    hoyDeEntrenamiento(token: string) {
      return llamar('GET', '/me/training/today', { token, esquema: HoyDeEntrenamientoResponseSchema });
    },
    /** API-AGE-01 (DL-137): lo previsto para hoy, lo pendiente y lo que viene. */
    agendaDeEntrenamiento(token: string) {
      return llamar('GET', '/me/training/agenda', { token, esquema: AgendaDeHoyResponseSchema });
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
    /** API-TRN-19-LISTA (DL-096): «Tu historial» — sesiones registradas propias por período. */
    misEjecucionesDeEntrenamiento(token: string, periodo: { periodStart: string; periodEnd: string }) {
      return llamar('GET', `/me/training/executions${query(periodo)}`, { token, esquema: HistorialDeEntrenamientoResponseSchema });
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
    /**
     * API-TRN-23: una revisión de Entrenamiento, para su profesional. La operación ya existía en la API; el cliente la suma
     * para el cajón «De a una» del website (WP-TABLERO-ALTA-GAMA TB-15, TA-42), que escribe el resultado, el fundamento y
     * el efecto antes de aplicar. Las APK no la leen.
     */
    consultarRevisionDeEntrenamiento(token: string, revisionId: string) {
      return llamar('GET', `/training/reviews/${encodeURIComponent(revisionId)}`, { token, esquema: RevisionDeEntrenamientoResponseSchema });
    },
    /** API-TRN-23-EVIDENCIA (DL-154): la evidencia que guardó la revisión de entrenamiento, resuelta con el permiso de hoy. Solo la lee el website. */
    evidenciaDeRevisionDeEntrenamiento(token: string, revisionId: string) {
      return llamar('GET', `/training/reviews/${encodeURIComponent(revisionId)}/evidence`, { token, esquema: EvidenciaDeRevisionResponseSchema });
    },
    /** API-TRN-24. */
    aplicarRevisionDeEntrenamiento(token: string, revisionId: string, claveDeIdempotencia: string) {
      return llamar('POST', `/training/reviews/${encodeURIComponent(revisionId)}/apply`, { token, claveDeIdempotencia, esquema: AplicarRevisionResponseSchema, cuerpo: { expectedVersion: 'v1' } });
    },

    // ─── WP-ENTRENAMIENTO-SERIES: objetivos por serie, imagen de ejercicio y tiempos (DL-122 a DL-124) ─────────
    /** API-SER-01: la versión de plan con los objetivos por serie y las imágenes. Solo el profesional. */
    planConObjetivos(token: string, planId: string) {
      return llamar('GET', `/training/plans/${encodeURIComponent(planId)}/detail`, { token, esquema: PlanConObjetivosResponseSchema });
    },
    /** API-SER-02: la sesión de una ocurrencia, con el objetivo efectivo de cada serie. Solo el titular. */
    sesionParaRegistrar(token: string, occurrenceId: string) {
      return llamar('GET', `/training/occurrences/${encodeURIComponent(occurrenceId)}/session`, { token, esquema: SesionParaRegistrarResponseSchema });
    },
    /** API-TIE-01: eventos de tiempo, en orden de secuencia. Reintentar el mismo pedido no suma nada. */
    registrarEventosDeTiempo(token: string, draftId: string, cuerpo: RegistrarEventosDeTiempoRequest) {
      return llamar('POST', `/training/execution-drafts/${encodeURIComponent(draftId)}/timing-events`, { token, esquema: ResultadoDeEventosResponseSchema, cuerpo });
    },
    /** API-TIE-02: los tiempos de un borrador propio. */
    tiemposDelBorrador(token: string, draftId: string) {
      return llamar('GET', `/training/execution-drafts/${encodeURIComponent(draftId)}/timing`, { token, esquema: TiemposDeSesionResponseSchema });
    },
    /** API-TIE-03: los tiempos de una ejecución registrada, para el titular o el profesional del plan. */
    tiemposDeLaEjecucion(token: string, executionId: string) {
      return llamar('GET', `/training/executions/${encodeURIComponent(executionId)}/timing`, { token, esquema: TiemposDeSesionResponseSchema });
    },
    /** API-TIE-04: la sesión en curso, si hay una. */
    sesionEnCurso(token: string) {
      return llamar('GET', '/me/training/session-in-progress', { token, esquema: SesionEnCursoResponseSchema });
    },
    /**
     * API-DSH-04: la línea de tiempo del asesorado (DL-127). Sin ningún alcance permitido: 404. Solo las claves declaradas
     * van a la URL: un objeto con otros campos (por ejemplo, un texto de búsqueda) no los arrastra a la consulta.
     */
    lineaDeTiempo(token: string, asesoradoId: string, filtro: FiltroDeLineaDeTiempo) {
      const declarados: Record<string, string | undefined> = {};
      for (const clave of CLAVES_DE_LA_LINEA_DE_TIEMPO) declarados[clave] = filtro[clave];
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/timeline${query(declarados)}`, { token, esquema: LineaDeTiempoResponseSchema });
    },
    /**
     * API-DSH-04-BUSQUEDA: buscar en la línea de tiempo con el texto en el cuerpo (DL-127). Es una lectura: sin clave de
     * idempotencia. La URL lleva solo el asesorado; el texto no queda en ninguna URL ni bitácora de la API.
     */
    buscarEnLineaDeTiempo(token: string, asesoradoId: string, cuerpo: BusquedaEnLineaDeTiempoRequest) {
      return llamar('POST', `/advisees/${encodeURIComponent(asesoradoId)}/timeline/search`, { token, esquema: LineaDeTiempoResponseSchema, cuerpo });
    },
    /** API-PRJ-01: una proyección profunda (DL-126). */
    proyeccion(token: string, asesoradoId: string, clave: ClaveDeProyeccion, filtro: FiltroDeProyeccion) {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/projections/${clave}${query(filtro)}`, { token, esquema: ProyeccionResponseSchema });
    },
    /** API-VAN-01: las vistas de análisis propias (DL-128). */
    listarVistasDeAnalisis(token: string) {
      return llamar('GET', '/me/analysis-views', { token, esquema: ListaDeVistasResponseSchema });
    },
    /** API-VAN-02. */
    crearVistaDeAnalisis(token: string, cuerpo: CrearVistaRequest, claveDeIdempotencia: string) {
      return llamar('POST', '/me/analysis-views', { token, claveDeIdempotencia, esquema: VistaDeAnalisisResponseSchema, cuerpo });
    },
    /** API-VAN-03. */
    reemplazarVistaDeAnalisis(token: string, viewId: string, cuerpo: ReemplazarVistaRequest) {
      return llamar('PUT', `/me/analysis-views/${encodeURIComponent(viewId)}`, { token, esquema: VistaDeAnalisisResponseSchema, cuerpo });
    },
    /** API-VAN-04. */
    borrarVistaDeAnalisis(token: string, viewId: string, claveDeIdempotencia: string) {
      return llamar('DELETE', `/me/analysis-views/${encodeURIComponent(viewId)}`, { token, claveDeIdempotencia, esquema: null });
    },
    /** API-NUT-19-LISTA (REV-A, DL-134): las revisiones de Nutrición propias, completas. */
    consultarMisRevisionesNutricionales(token: string, filtro: { cursor?: string; limit?: string } = {}) {
      return llamar('GET', `/me/nutrition/reviews${query(filtro)}`, { token, esquema: ListaDeRevisionesPropiasResponseSchema });
    },
    /** API-NUT-19-PROPIA: una revisión de Nutrición propia. */
    consultarMiRevisionNutricional(token: string, reviewId: string) {
      return llamar('GET', `/me/nutrition/reviews/${encodeURIComponent(reviewId)}`, { token, esquema: RevisionResponseSchema });
    },
    /** API-TRN-23-LISTA (REV-A, DL-134): las revisiones de Entrenamiento propias, completas. */
    consultarMisRevisionesDeEntrenamiento(token: string, filtro: { cursor?: string; limit?: string } = {}) {
      return llamar('GET', `/me/training/reviews${query(filtro)}`, { token, esquema: ListaDeRevisionesDeEntrenamientoPropiasResponseSchema });
    },
    /** API-TRN-23-PROPIA: una revisión de Entrenamiento propia. */
    consultarMiRevisionDeEntrenamiento(token: string, reviewId: string) {
      return llamar('GET', `/me/training/reviews/${encodeURIComponent(reviewId)}`, { token, esquema: RevisionDeEntrenamientoResponseSchema });
    },
    /** API-NOV-01: las novedades propias, de la más nueva a la más vieja, con las no leídas (DL-133). */
    consultarNovedades(token: string, filtro: { cursor?: string; limit?: string } = {}) {
      return llamar('GET', `/me/news${query(filtro)}`, { token, esquema: ListaDeNovedadesResponseSchema });
    },
    /** API-NOV-02: una novedad propia, que queda leída. */
    abrirNovedad(token: string, newsId: string) {
      return llamar('GET', `/me/news/${encodeURIComponent(newsId)}`, { token, esquema: NovedadResponseSchema });
    },
    /** API-NOV-03: este teléfono recibe los avisos push de esta cuenta. */
    registrarSuscripcionPush(token: string, deviceId: string, cuerpo: RegistrarSuscripcionPushRequest) {
      return llamar('PUT', `/me/push-subscriptions/${encodeURIComponent(deviceId)}`, { token, esquema: SuscripcionPushResponseSchema, cuerpo });
    },
    /** API-NOV-04: este teléfono deja de recibirlos. */
    retirarSuscripcionPush(token: string, deviceId: string) {
      return llamar('DELETE', `/me/push-subscriptions/${encodeURIComponent(deviceId)}`, { token, esquema: null });
    },
    /** API-NOV-05: las preferencias de los recordatorios diarios. */
    consultarPreferenciasDeAvisos(token: string) {
      return llamar('GET', '/me/notification-preferences', { token, esquema: PreferenciasDeAvisosResponseSchema });
    },
    /** API-NOV-06: reemplazarlas. */
    reemplazarPreferenciasDeAvisos(token: string, cuerpo: ReemplazarPreferenciasDeAvisosRequest) {
      return llamar('PUT', '/me/notification-preferences', { token, esquema: PreferenciasDeAvisosResponseSchema, cuerpo });
    },

    // ─── INV · invitaciones de vínculo (WP-INVITACION; DL-136) ──────────────────────────────────
    /**
     * API-INV-01: el profesional crea una invitación para un alcance. La respuesta trae el token y el código, la única vez
     * que se ven: el enlace se arma con `enlaceDeInvitacion`. La finalidad es la del alcance (DL-039), como en REL-01.
     */
    crearInvitacion(token: string, alcance: Alcance, claveDeIdempotencia: string): Promise<Resultado<InvitacionCreadaResponse>> {
      return llamar('POST', '/relationship-invitations', {
        token,
        claveDeIdempotencia,
        esquema: InvitacionCreadaResponseSchema,
        cuerpo: { scope: { code: alcance }, purpose: FINALIDAD_DE_ALCANCE[alcance] },
      });
    },
    /** API-INV-02: las propias, con su estado (PENDING, USED, EXPIRED o REVOKED). */
    consultarInvitaciones(token: string, filtro: { state?: string; cursor?: string; limit?: string } = {}): Promise<Resultado<ListaDeInvitacionesResponse>> {
      return llamar('GET', `/relationship-invitations${query(filtro)}`, { token, esquema: ListaDeInvitacionesResponseSchema });
    },
    /** API-INV-03: anular una propia que todavía no se usó ni venció. */
    anularInvitacion(token: string, invitationId: string, claveDeIdempotencia: string): Promise<Resultado<InvitacionResponse>> {
      return llamar('POST', `/relationship-invitations/${encodeURIComponent(invitationId)}/revoke`, { token, claveDeIdempotencia, esquema: InvitacionResponseSchema, cuerpo: {} });
    },
    /** API-INV-04: quién invita y para qué, con el token del enlace o el código (en el cuerpo, nunca en la URL). */
    verInvitacion(token: string, secreto: SecretoDeInvitacionRequest): Promise<Resultado<VistaPreviaDeInvitacionResponse>> {
      return llamar('POST', '/relationship-invitations/preview', { token, esquema: VistaPreviaDeInvitacionResponseSchema, cuerpo: secreto });
    },
    /**
     * API-INV-05: usar la invitación. Responde como REL-01: la solicitud creada (201) o la equivalente pendiente (200). La
     * persona la acepta después con `aceptarSolicitud` y otorga B2 con `otorgarConsentimiento`: no se saltea ningún acto.
     */
    usarInvitacion(token: string, secreto: SecretoDeInvitacionRequest, claveDeIdempotencia: string): Promise<Resultado<RespuestaDeCrearSolicitud>> {
      return llamar('POST', '/relationship-invitations/claim', { token, claveDeIdempotencia, esquema: RespuestaDeCrearSolicitudSchema, cuerpo: secreto });
    },

    // ─── CRD · notas de coordinación (WP-NOTAS-DE-COORDINACION; DL-140) ───────────────────────────
    /**
     * API-CRD-01: el profesional registra una nota sobre la persona. La lee en la línea de tiempo (API-DSH-04, tipo
     * `COORDINATION_NOTE_RECORDED`); la persona, con `misNotasDeCoordinacion`.
     */
    crearNotaDeCoordinacion(token: string, asesoradoId: string, cuerpo: CrearNotaDeCoordinacionRequest, claveDeIdempotencia: string): Promise<Resultado<NotaDeCoordinacionResponse>> {
      return llamar('POST', `/advisees/${encodeURIComponent(asesoradoId)}/coordination-notes`, { token, claveDeIdempotencia, esquema: NotaDeCoordinacionResponseSchema, cuerpo });
    },
    /** API-CRD-01-LISTA: desde qué área puede escribir y a quién (los otros profesionales que hoy acompañan a la persona). */
    destinatariosDeNota(token: string, asesoradoId: string): Promise<Resultado<DestinatariosPosiblesResponse>> {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/coordination-notes/recipients`, { token, esquema: DestinatariosPosiblesResponseSchema });
    },
    /** API-CRD-01-PROPIA: las notas de coordinación sobre la persona, todas (08 §9.15). */
    misNotasDeCoordinacion(token: string, filtro: { cursor?: string; limit?: string } = {}): Promise<Resultado<ListaDeNotasPropiasResponse>> {
      return llamar('GET', `/me/coordination-notes${query(filtro)}`, { token, esquema: ListaDeNotasPropiasResponseSchema });
    },
    /** API-EJE-01: los ejercicios propios, con su imagen vigente. */
    ejerciciosPropios(token: string) {
      return llamar('GET', '/training/own-exercises', { token, esquema: ListaDeEjerciciosPropiosResponseSchema });
    },
    /** API-EJE-02: asocia o reemplaza la imagen de un ejercicio propio. */
    asociarImagenDeEjercicio(token: string, exerciseId: string, cuerpo: AsociarImagenDeEjercicioRequest, claveDeIdempotencia: string) {
      return llamar('PUT', `/training/exercises/${encodeURIComponent(exerciseId)}/image`, { token, claveDeIdempotencia, esquema: EjercicioPropioResponseSchema, cuerpo });
    },
    /** API-EJE-03: retira la imagen; el medio no se borra y la historia queda. */
    retirarImagenDeEjercicio(token: string, exerciseId: string, expectedImageVersion: number, claveDeIdempotencia: string) {
      return llamar('DELETE', `/training/exercises/${encodeURIComponent(exerciseId)}/image${query({ expectedImageVersion: String(expectedImageVersion) })}`, { token, claveDeIdempotencia, esquema: EjercicioPropioResponseSchema });
    },

    // ─── ZON y EJE · zonas musculares e imagen del catálogo (DL-081, DL-162) ──────────────────────
    /** API-ZON-01: las 17 zonas, en el orden del catálogo (de la cabeza a los pies). */
    zonasMusculares(token: string) {
      return llamar('GET', '/training/muscle-zones', { token, esquema: ListaDeZonasMuscularesResponseSchema });
    },
    /** API-EJE-04: reemplaza las zonas de un ejercicio propio (la lista completa; vacía quita todas). */
    cambiarZonasDeEjercicio(token: string, exerciseId: string, cuerpo: CambiarZonasDeEjercicioRequest, claveDeIdempotencia: string) {
      return llamar('PUT', `/training/exercises/${encodeURIComponent(exerciseId)}/muscle-zones`, { token, claveDeIdempotencia, esquema: FichaVisualDeEjercicioResponseSchema, cuerpo });
    },
    /** API-EJE-05: la ficha visual (zonas e imagen) de 1 a 50 ejercicios, en el orden pedido. */
    fichasVisualesDeEjercicios(token: string, exerciseIds: readonly string[]) {
      return llamar('POST', '/training/exercises/visual-sheets', { token, esquema: FichasVisualesResponseSchema, cuerpo: { exerciseIds: [...exerciseIds] } });
    },

    // ─── FRM · información profesional pertinente (WP-07; 09v16.1 §22) ───────────────────────
    /** API-FRM-01: el catálogo. Una plantilla listada no prueba que sus campos puedan pedirse a alguien. */
    listarPlantillasDeFormulario(token: string, filtro: { domain?: string; status?: string; cursor?: string; limit?: string } = {}) {
      return llamar('GET', `/form-templates${query(filtro)}`, { token, esquema: ListaDePlantillasResponseSchema });
    },
    /** API-FRM-02: la versión exacta, con sus secciones y campos. No devuelve datos personales. */
    consultarVersionDePlantilla(token: string, plantillaId: string, versionId: string) {
      return llamar('GET', `/form-templates/${encodeURIComponent(plantillaId)}/versions/${encodeURIComponent(versionId)}`, { token, esquema: VersionDePlantillaResponseSchema });
    },
    /** API-FRM-03: pedir. Solicitar no es consentir ni obtener acceso (05:15098). */
    crearSolicitudDeFormulario(token: string, asesoradoId: string, cuerpo: z.input<typeof CrearSolicitudDeFormularioRequestSchema>, claveDeIdempotencia: string) {
      return llamar('POST', `/advisees/${encodeURIComponent(asesoradoId)}/form-requests`, { token, claveDeIdempotencia, esquema: SolicitudDeFormularioCreadaResponseSchema, cuerpo });
    },
    /** API-FRM-04: las del profesional sobre ese asesorado, solo las actualmente revelables. */
    listarSolicitudesDeFormulario(token: string, asesoradoId: string, filtro: { status?: string; cursor?: string; limit?: string } = {}) {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/form-requests${query(filtro)}`, { token, esquema: ListaDeSolicitudesDeFormularioResponseSchema });
    },
    /** API-FRM-05: proyección por actor. El profesional la ve si el PDP lo permite; el titular, siempre. */
    consultarSolicitudDeFormulario(token: string, solicitudId: string) {
      return llamar('GET', `/form-requests/${encodeURIComponent(solicitudId)}`, { token, esquema: DetalleDeSolicitudResponseSchema });
    },
    /** API-FRM-06: las propias, con `respondable` calculado en esta misma lectura. */
    misSolicitudesDeFormulario(token: string, filtro: { status?: string; cursor?: string; limit?: string } = {}) {
      return llamar('GET', `/me/form-requests${query(filtro)}`, { token, esquema: ListaDeSolicitudesPropiasResponseSchema });
    },
    /** API-FRM-07: responder. Un campo opcional que no se responde se omite, nunca cero ni default. */
    responderSolicitudDeFormulario(token: string, solicitudId: string, cuerpo: z.input<typeof EnviarRespuestaRequestSchema>, claveDeIdempotencia: string) {
      return llamar('POST', `/me/form-requests/${encodeURIComponent(solicitudId)}/responses`, { token, claveDeIdempotencia, esquema: RespuestaCreadaResponseSchema, cuerpo });
    },
    /** API-FRM-08: rectificar crea una sucesora; la original queda intacta (09:1618). */
    rectificarRespuestaDeFormulario(token: string, respuestaId: string, cuerpo: z.input<typeof RectificarRespuestaRequestSchema>, claveDeIdempotencia: string) {
      return llamar('POST', `/me/form-responses/${encodeURIComponent(respuestaId)}/rectifications`, { token, claveDeIdempotencia, esquema: RectificacionCreadaResponseSchema, cuerpo });
    },

    // ─── FRI · formularios de inicio (WP-FORMULARIOS-DE-INICIO, DL-164) ───────────────────────
    // Sirven para cualquier Solicitud (de P0 o con tipos nuevos). Las de FRM quedan para las APK instaladas.
    /** API-FRI-01: la estructura de cualquier versión, en formato V2. */
    consultarDefinicionDePlantilla(token: string, plantillaId: string, versionId: string) {
      return llamar('GET', `/form-templates/${encodeURIComponent(plantillaId)}/versions/${encodeURIComponent(versionId)}/definition`, { token, esquema: VersionDePlantillaV2ResponseSchema });
    },
    /** API-FRI-02: la bandeja de la persona: todas sus solicitudes, con la propuesta que espera confirmación. */
    miBandejaDeFormularios(token: string, filtro: { status?: string; cursor?: string; limit?: string } = {}) {
      return llamar('GET', `/me/form-inbox${query(filtro)}`, { token, esquema: ListaDeSolicitudesPropiasV2ResponseSchema });
    },
    /** API-FRI-03: el detalle V2, para los dos actores, con la propuesta y la transcripción. */
    consultarVistaDeSolicitud(token: string, solicitudId: string) {
      return llamar('GET', `/form-requests/${encodeURIComponent(solicitudId)}/view`, { token, esquema: DetalleDeSolicitudV2ResponseSchema });
    },
    /** API-FRI-04: responder (la persona), sola o confirmando lo que cargó el profesional. */
    responderSolicitudV2(token: string, solicitudId: string, cuerpo: EnviarRespuestaV2Request, claveDeIdempotencia: string) {
      return llamar('POST', `/me/form-requests/${encodeURIComponent(solicitudId)}/answers`, { token, claveDeIdempotencia, esquema: RespuestaCreadaResponseSchema, cuerpo });
    },
    /** API-FRI-05: rectificar una respuesta propia; la original queda intacta. */
    corregirRespuestaV2(token: string, respuestaId: string, cuerpo: RectificarRespuestaV2Request, claveDeIdempotencia: string) {
      return llamar('POST', `/me/form-responses/${encodeURIComponent(respuestaId)}/corrections`, { token, claveDeIdempotencia, esquema: RectificacionCreadaResponseSchema, cuerpo });
    },
    /** API-FRI-06: el profesional carga (o reemplaza) lo que la persona le contó, para que ella lo confirme. */
    cargarPropuestaDeRespuesta(token: string, solicitudId: string, cuerpo: CargarPropuestaRequest, claveDeIdempotencia: string) {
      return llamar('PUT', `/form-requests/${encodeURIComponent(solicitudId)}/proposal`, { token, claveDeIdempotencia, esquema: PropuestaCargadaResponseSchema, cuerpo });
    },
    /** API-FRI-07: el profesional retira lo cargado; se borra. */
    retirarPropuestaDeRespuesta(token: string, solicitudId: string, cuerpo: ResolverPropuestaRequest, claveDeIdempotencia: string) {
      return llamar('POST', `/form-requests/${encodeURIComponent(solicitudId)}/proposal/withdrawal`, { token, claveDeIdempotencia, esquema: PropuestaResueltaResponseSchema, cuerpo });
    },
    /** API-FRI-08: la persona dice «No es correcto»; lo cargado se borra y la Solicitud sigue pendiente. */
    rechazarPropuestaDeRespuesta(token: string, solicitudId: string, cuerpo: ResolverPropuestaRequest, claveDeIdempotencia: string) {
      return llamar('POST', `/me/form-requests/${encodeURIComponent(solicitudId)}/proposal/rejection`, { token, claveDeIdempotencia, esquema: PropuestaResueltaResponseSchema, cuerpo });
    },

    // ─── HBT · los hábitos de la persona (WP-FORMULARIOS-RONDA-2, FR-10; DL-165 D-9) ─────────────
    // Familia propia de BE: API-HAB ya es «Mis habituales» (DL-109). La APK 0.21.0-candidata.1 llama 01 a 04, con la forma
    // congelada (DL-152); la 05 es del website.
    /** API-HBT-01: mis hábitos (lo vigente y la historia), la autorización y mis profesionales. */
    misHabitos(token: string) {
      return llamar('GET', '/me/habits', { token, esquema: MisHabitosResponseSchema });
    },
    /** API-HBT-02: una versión nueva de mis hábitos, desde «Mis hábitos». */
    registrarMisHabitos(token: string, cuerpo: RegistrarHabitosRequest, claveDeIdempotencia: string) {
      return llamar('POST', '/me/habits', { token, claveDeIdempotencia, esquema: HabitosRegistradosResponseSchema, cuerpo });
    },
    /** API-HBT-03: compartirlos, o cambiar con quiénes, con el texto que se acepta. */
    compartirMisHabitos(token: string, cuerpo: CompartirHabitosRequest, claveDeIdempotencia: string) {
      return llamar('PUT', '/me/habits/sharing', { token, claveDeIdempotencia, esquema: HabitosCompartidosEstadoResponseSchema, cuerpo });
    },
    /** API-HBT-04: dejar de compartirlos, para todos a la vez. */
    dejarDeCompartirMisHabitos(token: string, cuerpo: DejarDeCompartirHabitosRequest, claveDeIdempotencia: string) {
      return llamar('POST', '/me/habits/sharing/withdrawal', { token, claveDeIdempotencia, esquema: HabitosCompartidosEstadoResponseSchema, cuerpo });
    },
    /** API-HBT-05: los hábitos que la persona le comparte a este profesional. Si no se los comparte, el 404 de lo inexistente. */
    habitosDeLaPersona(token: string, asesoradoId: string) {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/habits`, { token, esquema: HabitosCompartidosResponseSchema });
    },
    // Ronda 2.1 (DL-165 D-17 nueva): «Pedir acceso a sus hábitos». 06 y 07, del website; 08 y 09, de la APK
    // 0.22.0-candidata.1, con la forma congelada (DL-152).
    /** API-HBT-06: el profesional le pide a la persona ver sus hábitos, desde su área. Le llega como novedad importante. */
    pedirAccesoAHabitos(token: string, asesoradoId: string, cuerpo: PedirAccesoAHabitosRequest, claveDeIdempotencia: string) {
      return llamar('POST', `/advisees/${encodeURIComponent(asesoradoId)}/habits/access-requests`, { token, claveDeIdempotencia, esquema: PedidoDeAccesoCreadoResponseSchema, cuerpo });
    },
    /** API-HBT-07: lo que el profesional sabe de los hábitos de la persona (si los recibe, lo más nuevo que ve, su último pedido). */
    habitosParaElProfesional(token: string, asesoradoId: string) {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/habits/status`, { token, esquema: HabitosParaElProfesionalResponseSchema });
    },
    /** API-HBT-08: los pedidos de acceso que esperan la respuesta de la persona. */
    pedidosDeAccesoAMisHabitos(token: string) {
      return llamar('GET', '/me/habits/access-requests', { token, esquema: PedidosDeAccesoResponseSchema });
    },
    /** API-HBT-09: la persona responde un pedido: «Sí, que los vea» o «No, por ahora». */
    responderPedidoDeAcceso(token: string, pedidoId: string, cuerpo: ResponderPedidoDeAccesoRequest, claveDeIdempotencia: string) {
      return llamar('POST', `/me/habits/access-requests/${encodeURIComponent(pedidoId)}/answer`, { token, claveDeIdempotencia, esquema: PedidoDeAccesoRespondidoResponseSchema, cuerpo });
    },
    // ─── RES · lo que la persona comparte de otras áreas (DL-163 D-13, ampliada; WP-TABLERO-ALTA-GAMA TB-52 a TB-56) ──
    // Familia propia de BE. Ninguna APK instalada la llama: lo que leen no cambia (DL-152). 01 a 03, 09 y 10 son de la
    // persona (una candidata de la APK, etapa B); 04 y 06 a 08, del website.
    /** API-RES-01: lo que comparto, con quién, en qué nivel, desde cuándo y quién lo miró. */
    misResumenesCompartidos(token: string) {
      return llamar('GET', '/me/summary-sharing', { token, esquema: MisResumenesCompartidosResponseSchema });
    },
    /** API-RES-02: compartir, o cambiar con quién y en qué nivel, con el texto que se acepta. La lista es completa. */
    compartirResumenes(token: string, cuerpo: CompartirResumenesRequest, claveDeIdempotencia: string) {
      return llamar('PUT', '/me/summary-sharing', { token, claveDeIdempotencia, esquema: ResumenesCompartidosEstadoResponseSchema, cuerpo });
    },
    /** API-RES-03: dejar de compartir todo, a la vez. */
    dejarDeCompartirResumenes(token: string, cuerpo: DejarDeCompartirResumenesRequest, claveDeIdempotencia: string) {
      return llamar('POST', '/me/summary-sharing/withdrawal', { token, claveDeIdempotencia, esquema: ResumenesCompartidosEstadoResponseSchema, cuerpo });
    },
    /** API-RES-04: las otras áreas de la persona, quién las lleva, qué le comparte de cada una y su pedido. */
    resumenesCompartidos(token: string, asesoradoId: string) {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/shared-summaries`, { token, esquema: ResumenesParaElProfesionalResponseSchema });
    },
    /** API-RES-06: el plan vigente de un área compartida con «resumen y plan». Si no, el 404 de lo inexistente. */
    planCompartido(token: string, asesoradoId: string, area: AreaConPlan) {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/shared-summaries/${encodeURIComponent(area)}/plan`, { token, esquema: PlanCompartidoResponseSchema });
    },
    /** API-RES-07: con quién se comparte lo de mi área con esta persona. */
    loQueSeComparteDeMiArea(token: string, asesoradoId: string) {
      return llamar('GET', `/advisees/${encodeURIComponent(asesoradoId)}/shared-summaries/outgoing`, { token, esquema: LoQueSeComparteDeMiAreaResponseSchema });
    },
    /** API-RES-08: pedir ver el plan de otra área, desde la mía. Le llega a la persona como novedad importante. */
    pedirVerElPlan(token: string, asesoradoId: string, cuerpo: PedirVerElPlanRequest, claveDeIdempotencia: string) {
      return llamar('POST', `/advisees/${encodeURIComponent(asesoradoId)}/shared-summaries/access-requests`, { token, claveDeIdempotencia, esquema: PedidoDePlanCreadoResponseSchema, cuerpo });
    },
    /** API-RES-09: los pedidos de ver un plan que esperan mi respuesta. */
    pedidosDePlan(token: string) {
      return llamar('GET', '/me/summary-sharing/access-requests', { token, esquema: PedidosDePlanResponseSchema });
    },
    /** API-RES-10: responder un pedido: «Sí, que lo vea» o «No, por ahora». */
    responderPedidoDePlan(token: string, pedidoId: string, cuerpo: ResponderPedidoDePlanRequest, claveDeIdempotencia: string) {
      return llamar('POST', `/me/summary-sharing/access-requests/${encodeURIComponent(pedidoId)}/answer`, { token, claveDeIdempotencia, esquema: PedidoDePlanRespondidoResponseSchema, cuerpo });
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

/**
 * Junta todas las páginas de una lista por cursor (09:188-189), para las pantallas que necesitan la lista completa: los
 * métodos del catálogo (desde DL-111 son más que una página) y las corridas de un asesorado (API-CAL-02 no filtra por
 * evaluación). Pide de a `limite` (el máximo de la API es 50) y se detiene en `maximoDePaginas` para que una lista sin fin
 * no cuelgue la pantalla: si quedó algo afuera, `completa` es falso y la pantalla lo puede decir. Un error en cualquier
 * página es el resultado: no se muestra media lista como si fuera entera.
 *
 * WP-ESCRITORIO-AMABLE, parte 5 (los pendientes de la cartera, que se cuentan en la pantalla):
 * - `primera` es la primera página tal como llegó, con lo que la respuesta dice además de la lista (en la cartera, la
 *   fecha con que se clasificó y el aviso de vista parcial);
 * - un cursor vence si la lista cambió mientras se la leía (`INVALID_CURSOR`): se empieza de nuevo, una sola vez. Si
 *   vuelve a vencer, ese es el resultado.
 */
export interface PaginaDeUnaLista<T> {
  readonly data: readonly T[];
  readonly page: { readonly nextCursor: string | null; readonly hasMore: boolean };
}

export async function todasLasPaginas<P extends PaginaDeUnaLista<unknown>>(
  pedir: (filtro: { cursor?: string; limit: string }) => Promise<Resultado<P>>,
  { limite = 50, maximoDePaginas = 20 }: { limite?: number; maximoDePaginas?: number } = {},
): Promise<Resultado<{ data: P['data'][number][]; completa: boolean; primera: P }>> {
  for (let intento = 0; ; intento++) {
    const data: P['data'][number][] = [];
    let primera: P | null = null;
    let cursor: string | undefined;
    let vencido = false;
    for (let pagina = 0; pagina < Math.max(1, maximoDePaginas); pagina++) {
      const r = await pedir({ ...(cursor ? { cursor } : {}), limit: String(limite) });
      if (!r.ok) {
        if (cursor !== undefined && intento === 0 && r.tipo === 'API' && r.codigo === 'INVALID_CURSOR') {
          vencido = true;
          break;
        }
        return r;
      }
      primera ??= r.datos;
      data.push(...r.datos.data);
      if (!r.datos.page.hasMore || !r.datos.page.nextCursor) return { ok: true, datos: { data, completa: true, primera } };
      cursor = r.datos.page.nextCursor;
    }
    if (!vencido) return { ok: true, datos: { data, completa: false, primera: primera as P } };
  }
}
