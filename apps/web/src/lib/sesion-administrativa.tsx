'use client';

/**
 * La sesión de la consola de Administración (WP-ADMINISTRACION, DL-155), aparte de la sesión común del website: otro
 * token, otra cookie de reanudación (de la API, HttpOnly, solo para /api/v1/admin/auth/sessions) y otro canal entre
 * pestañas. Ninguna pantalla de la consola usa la sesión común, ni al revés (`esDeAdministracion` en `sesion.tsx`).
 *
 * - **El servidor decide el segundo factor.** La consola guarda lo que la API dijo en su última respuesta (vigente,
 *   pendiente o por configurar) solo para saber qué pantalla mostrar; cualquier lectura o decisión lo vuelve a exigir en
 *   la API, y un `MFA_REQUIRED` vuelve a pedir el código. Recargar reanuda la misma sesión: la API dice si el segundo
 *   factor sigue vigente; la consola nunca lo supone.
 * - **El token vive en memoria de la pestaña.** No se guarda nada en localStorage ni en sessionStorage.
 * - **Los códigos de recuperación** que trae una configuración se muestran una sola vez y viven solo en memoria hasta que
 *   el administrador dice que los guardó.
 * - **Lo que la lista eligió** (búsqueda, filtros, página y posición) vive acá, en memoria, para volver de una ficha como se
 *   dejó. No va a la URL: la búsqueda es texto que escribe la persona (DL-127).
 */
import {
  CODIGOS_DE_SESION_ADMINISTRATIVA_NO_VALIDA,
  type Alcance,
  type EstadoDelSegundoFactorApi,
  type ResultadoAdministrativo,
  type SesionAdministrativaResponse,
  type SituacionDeArea,
} from '@be/domain';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { apiAdministrativa } from './api-administrativa';

export interface SesionAdministrativa {
  readonly token: string;
  readonly expiraEn: number;
  readonly administrador: { readonly identidadId: string; readonly nombre: string };
  readonly segundoFactor: EstadoDelSegundoFactorApi;
}

/** Lo que la lista eligió, para volver de una ficha como se dejó. */
export interface EstadoDeLaLista {
  readonly texto: string;
  readonly alcance: Alcance | '';
  readonly situacion: SituacionDeArea | '';
  /** El cursor de cada página leída: el de la primera es `null`; el último es el de la página que se ve. */
  readonly cursores: readonly (string | null)[];
  /** Dónde estaba la página al abrir una ficha (`scrollY`). */
  readonly desplazamiento: number;
}

export const LISTA_INICIAL: EstadoDeLaLista = { texto: '', alcance: '', situacion: '', cursores: [null], desplazamiento: 0 };

/**
 * Por qué no hay sesión, para que la entrada lo diga:
 * - `vencida`: pasaron las 8 horas, o la API dijo que venció;
 * - `plazo`: pasaron los 10 minutos para completar el segundo factor después de la contraseña;
 * - `intentos`: cinco códigos que no valen seguidos cerraron la sesión;
 * - `cerrada`: el administrador la cerró (en esta pestaña o en otra);
 * - `sin-conexion`: no se pudo preguntar por la sesión al cargar;
 * - `no-configurada`: el ambiente no tiene la clave del segundo factor (503 ADMINISTRATION_NOT_AVAILABLE).
 */
export type MotivoDeSalida = 'vencida' | 'plazo' | 'intentos' | 'cerrada' | 'sin-conexion' | 'no-configurada';

type Estado =
  | { readonly tipo: 'restaurando' }
  | { readonly tipo: 'sin-sesion'; readonly motivo: MotivoDeSalida | null }
  | ({ readonly tipo: 'con-sesion' } & SesionAdministrativa);

interface Contexto {
  readonly sesion: SesionAdministrativa | null;
  readonly restaurando: boolean;
  readonly motivo: MotivoDeSalida | null;
  /** La sesión que acaba de abrir o reanudar la API (API-ADM-01 o 02). */
  readonly guardar: (r: SesionAdministrativaResponse) => void;
  /** Lo que la API dijo del segundo factor después de un código, una configuración o un `MFA_REQUIRED`. */
  readonly segundoFactor: (e: EstadoDelSegundoFactorApi) => void;
  /** Olvidar la sesión de esta pestaña (la API dijo que ya no sirve, o se cerró). */
  readonly olvidar: (motivo: MotivoDeSalida | null) => void;
  /**
   * Si la respuesta dice que la sesión ya no sirve, la olvida y devuelve true; con `MFA_REQUIRED`, vuelve a pedir el código
   * (la pantalla que estaba se vuelve a leer después).
   */
  readonly revisar: (r: ResultadoAdministrativo<unknown>) => boolean;
  /** Los códigos de recuperación recién generados, hasta que el administrador dice que los guardó. */
  readonly codigosPorGuardar: readonly string[] | null;
  readonly mostrarCodigos: (codigos: readonly string[] | null) => void;
  /** Un aviso para la próxima pantalla (cuántos códigos quedan después de usar uno, un autenticador reemplazado). */
  readonly aviso: string | null;
  readonly avisar: (texto: string | null) => void;
  readonly lista: EstadoDeLaLista;
  readonly guardarLista: (l: EstadoDeLaLista) => void;
}

const ContextoDeAdministracion = createContext<Contexto | null>(null);
const CANAL = 'be-sesion-administrativa';

const sesionDe = (r: SesionAdministrativaResponse): SesionAdministrativa => ({
  token: r.data.session.accessToken,
  expiraEn: new Date(r.data.session.expiresAt).getTime(),
  administrador: { identidadId: r.data.administrator.identityId, nombre: r.data.administrator.displayName },
  segundoFactor: r.data.secondFactor,
});

export function ProveedorDeSesionAdministrativa({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'restaurando' });
  const actual = useRef<Estado>(estado);
  actual.current = estado;
  const [lista, setLista] = useState<EstadoDeLaLista>(LISTA_INICIAL);
  const [codigosPorGuardar, setCodigosPorGuardar] = useState<readonly string[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const canal = useRef<BroadcastChannel | null>(null);

  // Al cargar: reanudar con la cookie de Administración. Lo que dice del segundo factor es lo que dice la API.
  useEffect(() => {
    let vigente = true;
    void apiAdministrativa.reanudarSesion().then((r) => {
      if (!vigente) return;
      if (r.ok) {
        setEstado((e) => (e.tipo === 'restaurando' ? { tipo: 'con-sesion', ...sesionDe(r.datos) } : e));
        return;
      }
      const motivo: MotivoDeSalida | null =
        r.tipo === 'RED' ? 'sin-conexion' : r.codigo === 'ADMINISTRATION_NOT_AVAILABLE' ? 'no-configurada' : r.status >= 500 ? 'sin-conexion' : r.codigo === 'SESSION_EXPIRED' ? 'vencida' : null;
      setEstado((e) => (e.tipo === 'restaurando' ? { tipo: 'sin-sesion', motivo } : e));
    });
    return () => {
      vigente = false;
    };
  }, []);

  // Cerrar la sesión en una pestaña la olvida en las demás (sin tokens en el mensaje).
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const c = new BroadcastChannel(CANAL);
    canal.current = c;
    c.onmessage = (e: MessageEvent<{ tipo: string }>) => {
      if (e.data?.tipo !== 'cerrada') return;
      setEstado({ tipo: 'sin-sesion', motivo: 'cerrada' });
      setCodigosPorGuardar(null);
      setAviso(null);
      setLista(LISTA_INICIAL);
    };
    return () => {
      c.close();
      canal.current = null;
    };
  }, []);

  // Al vencer la sesión (8 h), se olvida aunque nadie la use: la API la rechazaría igual.
  const expiraEn = estado.tipo === 'con-sesion' ? estado.expiraEn : null;
  useEffect(() => {
    if (expiraEn === null) return;
    const restante = expiraEn - Date.now();
    const t = setTimeout(() => setEstado({ tipo: 'sin-sesion', motivo: 'vencida' }), Math.max(0, Math.min(restante, 2_147_000_000)));
    return () => clearTimeout(t);
  }, [expiraEn]);

  const guardar = useCallback((r: SesionAdministrativaResponse) => setEstado({ tipo: 'con-sesion', ...sesionDe(r) }), []);
  const segundoFactor = useCallback((sf: EstadoDelSegundoFactorApi) => setEstado((e) => (e.tipo === 'con-sesion' ? { ...e, segundoFactor: sf } : e)), []);
  const olvidar = useCallback((motivo: MotivoDeSalida | null) => {
    setEstado({ tipo: 'sin-sesion', motivo });
    setCodigosPorGuardar(null);
    setAviso(null);
    setLista(LISTA_INICIAL);
    if (motivo === 'cerrada') {
      try {
        canal.current?.postMessage({ tipo: 'cerrada' });
      } catch {
        // Sin canal, cada pestaña se entera en su próximo pedido.
      }
    }
  }, []);
  const revisar = useCallback(
    (r: ResultadoAdministrativo<unknown>) => {
      if (r.ok || r.tipo !== 'API') return false;
      if (r.codigo === 'MFA_REQUIRED') {
        segundoFactor({ state: 'REQUIRED', deadline: null });
        return true;
      }
      if (!CODIGOS_DE_SESION_ADMINISTRATIVA_NO_VALIDA.has(r.codigo)) return false;
      // Un vencimiento antes de completar el segundo factor es el plazo de los 10 minutos, no las 8 horas.
      const e = actual.current;
      const enElPlazo = e.tipo === 'con-sesion' && e.segundoFactor.state !== 'VERIFIED' && e.segundoFactor.deadline !== null;
      olvidar(r.codigo === 'SESSION_EXPIRED' ? (enElPlazo ? 'plazo' : 'vencida') : null);
      return true;
    },
    [olvidar, segundoFactor],
  );

  const valor = useMemo<Contexto>(
    () => ({
      sesion: estado.tipo === 'con-sesion' ? { token: estado.token, expiraEn: estado.expiraEn, administrador: estado.administrador, segundoFactor: estado.segundoFactor } : null,
      restaurando: estado.tipo === 'restaurando',
      motivo: estado.tipo === 'sin-sesion' ? estado.motivo : null,
      guardar,
      segundoFactor,
      olvidar,
      revisar,
      codigosPorGuardar,
      mostrarCodigos: setCodigosPorGuardar,
      aviso,
      avisar: setAviso,
      lista,
      guardarLista: setLista,
    }),
    [estado, guardar, segundoFactor, olvidar, revisar, codigosPorGuardar, aviso, lista],
  );
  return <ContextoDeAdministracion.Provider value={valor}>{children}</ContextoDeAdministracion.Provider>;
}

export function useAdministracion(): Contexto {
  const c = useContext(ContextoDeAdministracion);
  if (!c) throw new Error('useAdministracion fuera de ProveedorDeSesionAdministrativa');
  return c;
}

/** Una clave de idempotencia por intento lógico: los reintentos del mismo intento la reusan. */
export function nuevaClaveAdministrativa(): string {
  return `admin-${crypto.randomUUID()}`;
}
