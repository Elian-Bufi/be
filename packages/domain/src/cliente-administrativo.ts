/**
 * WP-ADMINISTRACION (DL-155): el cliente HTTP de la consola de Administración del website (API-ADM-01 a 13). Va aparte del
 * cliente común (`cliente-http.ts`) a propósito: la sesión administrativa es otra, con otro token y otra cookie, y ninguna
 * pantalla de la consola llama a una operación de profesionales o de personas (ni viceversa).
 * - El Bearer lo guarda quien llama, en memoria. La cookie de reanudación de Administración (HttpOnly, de la API) viaja
 *   solo con las operaciones de la sesión (`conCookies`).
 * - Toda respuesta exitosa se valida contra su schema; un `SECOND_FACTOR_INVALID` trae cuántos intentos le quedan a la
 *   sesión.
 */
import {
  CodigosDeRecuperacionResponseSchema,
  ConfiguracionConfirmadaResponseSchema,
  ConfiguracionDelAutenticadorResponseSchema,
  DecisionRegistradaResponseSchema,
  DetalleDeCodigoInvalidoSchema,
  EstadoDeSesionAdministrativaResponseSchema,
  FichaDeProfesionalResponseSchema,
  HistorialAdministrativoResponseSchema,
  ListaDeProfesionalesResponseSchema,
  SegundoFactorVerificadoResponseSchema,
  SesionAdministrativaResponseSchema,
  type ConsultarProfesionalesRequest,
  type DecidirSobreAreaRequest,
} from './contratos-administracion';
import { ErrorEnvelopeSchema, type EsquemaDeContrato, type SalidaDe, type ValidationIssue } from './contratos';
import type { Alcance } from './alcance';

export type ResultadoAdministrativo<T> =
  | { readonly ok: true; readonly datos: T }
  | {
      readonly ok: false;
      readonly tipo: 'API';
      readonly status: number;
      readonly codigo: string;
      readonly issues: readonly ValidationIssue[];
      /** Con `SECOND_FACTOR_INVALID` o `INCORPORATION_CODE_INVALID`: cuántos intentos le quedan a la sesión. */
      readonly intentosRestantes?: number;
    }
  | { readonly ok: false; readonly tipo: 'RED' };

/** Los códigos que significan que la sesión administrativa ya no sirve: hay que volver a entrar. */
export const CODIGOS_DE_SESION_ADMINISTRATIVA_NO_VALIDA: ReadonlySet<string> = new Set(['AUTHENTICATION_REQUIRED', 'SESSION_INVALID', 'SESSION_EXPIRED', 'SESSION_REVOKED', 'ACTION_FORBIDDEN']);

const leerJson = (texto: string): unknown => {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
};

export function crearClienteAdministrativo(opciones: { readonly baseUrl: string; readonly fetch?: typeof fetch }) {
  const hacerFetch = opciones.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));

  async function llamar<S extends EsquemaDeContrato | null>(
    metodo: 'GET' | 'POST' | 'DELETE',
    ruta: string,
    extra: { token?: string; cuerpo?: unknown; claveDeIdempotencia?: string; esquema: S; conCookies?: boolean },
  ): Promise<ResultadoAdministrativo<S extends EsquemaDeContrato ? SalidaDe<S> : null>> {
    const encabezados: Record<string, string> = { Accept: 'application/json', 'X-BE-Surface': 'WEB' };
    if (extra.cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';
    if (extra.token) encabezados.Authorization = `Bearer ${extra.token}`;
    if (extra.claveDeIdempotencia) encabezados['Idempotency-Key'] = extra.claveDeIdempotencia;
    let respuesta: Response;
    try {
      respuesta = await hacerFetch(`${opciones.baseUrl}${ruta}`, {
        method: metodo,
        headers: encabezados,
        body: extra.cuerpo === undefined ? undefined : JSON.stringify(extra.cuerpo),
        credentials: extra.conCookies ? 'include' : 'omit',
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
      const intentos = error.data.error.code === 'SECOND_FACTOR_INVALID' || error.data.error.code === 'INCORPORATION_CODE_INVALID' ? DetalleDeCodigoInvalidoSchema.safeParse(error.data.error.details) : null;
      return { ok: false, tipo: 'API', status: respuesta.status, codigo: error.data.error.code, issues, ...(intentos?.success ? { intentosRestantes: intentos.data.attemptsRemaining } : {}) };
    }
    if (extra.esquema === null) return { ok: true, datos: null as never };
    const datos = extra.esquema.safeParse(json);
    if (!datos.success) return { ok: false, tipo: 'API', status: respuesta.status, codigo: 'RESPUESTA_NO_RECONOCIDA', issues: [] };
    return { ok: true, datos: datos.data as never };
  }

  return {
    /** API-ADM-01 — el primer factor. Abre la sesión y su cookie de reanudación. */
    iniciarSesion(correo: string, contrasena: string) {
      return llamar('POST', '/admin/auth/sessions', { cuerpo: { identifier: correo, credential: contrasena }, esquema: SesionAdministrativaResponseSchema, conCookies: true });
    },
    /** API-ADM-02 — reanudar con la cookie, después de recargar. */
    reanudarSesion() {
      return llamar('POST', '/admin/auth/sessions/resume', { esquema: SesionAdministrativaResponseSchema, conCookies: true });
    },
    /** API-ADM-03 — cerrar la sesión y borrar la cookie. */
    cerrarSesion(token: string) {
      return llamar('DELETE', '/admin/auth/sessions/current', { token, esquema: null, conCookies: true });
    },
    /** API-ADM-04 — el estado de la propia sesión. */
    estadoDeLaSesion(token: string) {
      return llamar('GET', '/admin/auth/sessions/current', { token, esquema: EstadoDeSesionAdministrativaResponseSchema });
    },
    /** API-ADM-05 — el código del autenticador. */
    verificarCodigo(token: string, codigo: string) {
      return llamar('POST', '/admin/auth/sessions/current/second-factor', { token, cuerpo: { code: codigo }, esquema: SegundoFactorVerificadoResponseSchema });
    },
    /** API-ADM-06 — un código de recuperación. */
    usarCodigoDeRecuperacion(token: string, codigo: string) {
      return llamar('POST', '/admin/auth/sessions/current/recovery-code', { token, cuerpo: { recoveryCode: codigo }, esquema: SegundoFactorVerificadoResponseSchema });
    },
    /** API-ADM-07 — empezar la configuración: con el código de incorporación o, para reemplazar, con la contraseña. */
    iniciarConfiguracion(token: string, con: { readonly codigoDeIncorporacion: string } | { readonly contrasena: string }) {
      const cuerpo = 'codigoDeIncorporacion' in con ? { incorporationCode: con.codigoDeIncorporacion } : { credential: con.contrasena };
      return llamar('POST', '/admin/auth/second-factor/enrollment', { token, cuerpo, esquema: ConfiguracionDelAutenticadorResponseSchema });
    },
    /** API-ADM-08 — confirmar con un código del autenticador nuevo. */
    confirmarConfiguracion(token: string, codigo: string) {
      return llamar('POST', '/admin/auth/second-factor/enrollment/confirm', { token, cuerpo: { code: codigo }, esquema: ConfiguracionConfirmadaResponseSchema });
    },
    /** API-ADM-09 — códigos de recuperación nuevos, con la contraseña. */
    regenerarCodigos(token: string, contrasena: string) {
      return llamar('POST', '/admin/auth/recovery-codes', { token, cuerpo: { credential: contrasena }, esquema: CodigosDeRecuperacionResponseSchema });
    },
    /** API-ADM-10 — la lista de profesionales; la búsqueda viaja en el cuerpo. */
    consultarProfesionales(token: string, consulta: ConsultarProfesionalesRequest) {
      return llamar('POST', '/admin/professionals/query', { token, cuerpo: consulta, esquema: ListaDeProfesionalesResponseSchema });
    },
    /** API-ADM-11 — la ficha de un profesional. */
    fichaDeProfesional(token: string, profesionalId: string) {
      return llamar('GET', `/admin/professionals/${encodeURIComponent(profesionalId)}`, { token, esquema: FichaDeProfesionalResponseSchema });
    },
    /** API-ADM-12 — el historial administrativo, de a páginas. */
    historialDeProfesional(token: string, profesionalId: string, filtro: { readonly cursor?: string; readonly limit?: number; readonly scope?: Alcance } = {}) {
      const q = new URLSearchParams();
      if (filtro.cursor) q.set('cursor', filtro.cursor);
      if (filtro.limit) q.set('limit', String(filtro.limit));
      if (filtro.scope) q.set('scope', filtro.scope);
      const s = q.toString();
      return llamar('GET', `/admin/professionals/${encodeURIComponent(profesionalId)}/history${s ? `?${s}` : ''}`, { token, esquema: HistorialAdministrativoResponseSchema });
    },
    /** API-ADM-13 — una decisión sobre un área, con su clave de idempotencia (la misma en cada reintento del mismo intento). */
    decidir(token: string, profesionalId: string, alcance: Alcance, pedido: DecidirSobreAreaRequest, claveDeIdempotencia: string) {
      return llamar('POST', `/admin/professionals/${encodeURIComponent(profesionalId)}/scopes/${alcance}/decisions`, {
        token,
        cuerpo: pedido,
        claveDeIdempotencia,
        esquema: DecisionRegistradaResponseSchema,
      });
    },
  };
}

export type ClienteAdministrativo = ReturnType<typeof crearClienteAdministrativo>;
