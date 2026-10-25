'use client';

/**
 * Sesión del website (DL-147, que sustituye en el website la opción A de DL-012). El Bearer vive en memoria de la
 * pestaña, como antes; lo nuevo es que una recarga o una pestaña nueva lo recuperan con la cookie de reanudación, que es
 * HttpOnly y de la API: el JavaScript del website no la ve, y no se guarda nada en localStorage ni en sessionStorage.
 * La verdad de la sesión está en la API, que la verifica en cada request: restaurar nunca restaura un permiso que ya no
 * está. Nunca se guarda un «rol autorizado» en el cliente (10-B01:881-901).
 *
 * - **Restaurando:** al cargar, mientras la API responde. Las páginas con sesión dicen «Recuperando tu sesión…» y no
 *   mandan a Iniciar sesión ni muestran datos de nadie. Una falla de red o del servidor se reintenta dos veces antes de
 *   dar la sesión por perdida; un código de sesión, no.
 * - **Entre pestañas** (BroadcastChannel `be-sesion`, sin tokens en los mensajes): al cerrar la sesión en una, las demás
 *   la olvidan; al entrar en una con otra cuenta, las que mostraban otra cuenta se recargan, para no enseñar sus datos.
 * - **Al vencer** (12 h desde el inicio, sin renovación: DL-012), el token se descarta y la página lo dice al pedir que
 *   se entre de nuevo.
 * - **En la consola de Administración** (`/admin`, WP-ADMINISTRACION) esta sesión no se reanuda ni escucha a las otras
 *   pestañas: la consola tiene su propia sesión (`sesion-administrativa.tsx`). Así una pestaña de Administración no carga
 *   la sesión de un profesional ni se recarga cuando alguien entra con otra cuenta en otra pestaña. Al salir de `/admin`,
 *   se reanuda como en cualquier carga.
 */
import type { IniciarSesionResponse } from '@be/domain';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api } from './api';

/** Si la ruta es de la consola de Administración, que no usa esta sesión. */
export const esDeAdministracion = (ruta: string | null): boolean => ruta === '/admin' || (ruta?.startsWith('/admin/') ?? false);

interface Sesion {
  readonly token: string;
  readonly expiraEn: number;
  readonly identidadId: string;
}

/** `sinConexion`: no se pudo preguntar por la sesión (sin conexión con BE, o BE no respondió). No es que haya vencido. */
type Estado =
  | { readonly tipo: 'restaurando' }
  /** `omitida`: la página es de la consola de Administración, que no usa esta sesión; al salir de ella se reanuda. */
  | { readonly tipo: 'sin-sesion'; readonly vencida: boolean; readonly sinConexion?: boolean; readonly omitida?: boolean }
  | ({ readonly tipo: 'con-sesion' } & Sesion);

interface ContextoDeSesion {
  readonly sesion: Sesion | null;
  /** Al cargar la página, mientras se pregunta a la API si hay una sesión para reanudar. */
  readonly restaurando: boolean;
  /** La última sesión de esta pestaña venció (o la API dijo que venció al reanudar): la página de entrada lo explica. */
  readonly vencida: boolean;
  /**
   * No se pudo recuperar la sesión porque no hubo conexión con BE (o no respondió): la entrada lo dice, para no confundirlo
   * con una sesión vencida ni con datos mal escritos, y al volver la conexión se vuelve a intentar sola.
   */
  readonly sinConexion: boolean;
  /** La sesión que acaba de abrir API-ACC-02 o la familia GOO. */
  readonly guardar: (respuesta: IniciarSesionResponse) => void;
  /** Olvidar el token de esta pestaña (la API dijo que la sesión ya no sirve). */
  readonly olvidar: () => void;
  /** Después de cerrar la sesión en la API: la olvidan esta pestaña y las demás. */
  readonly cerrada: () => void;
}

const Contexto = createContext<ContextoDeSesion | null>(null);
const CANAL = 'be-sesion';
type Mensaje = { readonly tipo: 'cerrada' } | { readonly tipo: 'iniciada'; readonly identidadId: string };
const REINTENTOS_MS = [1_000, 3_000] as const;

const sesionDe = (r: IniciarSesionResponse): Sesion => ({
  token: r.data.session.accessToken,
  expiraEn: new Date(r.data.session.expiresAt).getTime(),
  identidadId: r.data.actor.identityId,
});

export function ProveedorDeSesion({ children }: { children: ReactNode }) {
  const enAdministracion = esDeAdministracion(usePathname());
  const [estado, setEstado] = useState<Estado>(() => (enAdministracion ? { tipo: 'sin-sesion', vencida: false, omitida: true } : { tipo: 'restaurando' }));
  const actual = useRef<Estado>(estado);
  actual.current = estado;
  const enLaConsola = useRef(enAdministracion);
  enLaConsola.current = enAdministracion;
  const canal = useRef<BroadcastChannel | null>(null);

  const avisar = useCallback((m: Mensaje) => {
    try {
      canal.current?.postMessage(m);
    } catch {
      // Sin canal entre pestañas, cada una se entera en su próximo pedido.
    }
  }, []);

  /** Reanudar con la cookie. Solo reemplaza un estado que todavía esté restaurando: un login que llegó antes, gana. */
  const reanudar = useCallback(async () => {
    for (let intento = 0; ; intento++) {
      const r = await api.reanudarSesion();
      if (r.ok) {
        const s = sesionDe(r.datos);
        setEstado((e) => (e.tipo === 'restaurando' ? { tipo: 'con-sesion', ...s } : e));
        return;
      }
      const pasajera = r.tipo === 'RED' || (r.tipo === 'API' && (r.status >= 500 || r.codigo === 'RATE_LIMITED'));
      if (pasajera && intento < REINTENTOS_MS.length) {
        await new Promise((listo) => setTimeout(listo, REINTENTOS_MS[intento]));
        continue;
      }
      const vencida = r.tipo === 'API' && r.codigo === 'SESSION_EXPIRED';
      setEstado((e) => (e.tipo === 'restaurando' ? { tipo: 'sin-sesion', vencida, sinConexion: pasajera } : e));
      return;
    }
  }, []);

  // Al cargar fuera de la consola, o al salir de ella, se reanuda; dentro de la consola, no.
  useEffect(() => {
    if (enAdministracion) return;
    const e = actual.current;
    if (e.tipo === 'restaurando') void reanudar();
    else if (e.tipo === 'sin-sesion' && e.omitida) {
      setEstado({ tipo: 'restaurando' });
      void reanudar();
    }
  }, [enAdministracion, reanudar]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const c = new BroadcastChannel(CANAL);
    canal.current = c;
    c.onmessage = (evento: MessageEvent<Mensaje>) => {
      const m = evento.data;
      const e = actual.current;
      if (enLaConsola.current) return;
      if (m?.tipo === 'cerrada') setEstado({ tipo: 'sin-sesion', vencida: false });
      else if (m?.tipo === 'iniciada' && e.tipo === 'con-sesion' && e.identidadId !== m.identidadId) window.location.reload();
      else if (m?.tipo === 'iniciada' && e.tipo === 'sin-sesion') {
        setEstado({ tipo: 'restaurando' });
        void reanudar();
      }
    };
    return () => {
      c.close();
      canal.current = null;
    };
  }, [reanudar]);

  // Si la sesión no se pudo recuperar por falta de conexión, se vuelve a intentar sola cuando la conexión vuelve.
  useEffect(() => {
    const alVolver = () => {
      const e = actual.current;
      if (enLaConsola.current || e.tipo !== 'sin-sesion' || !e.sinConexion) return;
      setEstado({ tipo: 'restaurando' });
      void reanudar();
    };
    window.addEventListener('online', alVolver);
    return () => window.removeEventListener('online', alVolver);
  }, [reanudar]);

  const guardar = useCallback(
    (respuesta: IniciarSesionResponse) => {
      const s = sesionDe(respuesta);
      setEstado({ tipo: 'con-sesion', ...s });
      avisar({ tipo: 'iniciada', identidadId: s.identidadId });
    },
    [avisar],
  );
  const olvidar = useCallback(() => setEstado({ tipo: 'sin-sesion', vencida: false }), []);
  const cerrada = useCallback(() => {
    setEstado({ tipo: 'sin-sesion', vencida: false });
    avisar({ tipo: 'cerrada' });
  }, [avisar]);

  // Al vencer, el token se descarta aunque nadie lo use (la API lo rechazaría igual), y la entrada lo explica.
  const expiraEn = estado.tipo === 'con-sesion' ? estado.expiraEn : null;
  useEffect(() => {
    if (expiraEn === null) return;
    const restante = expiraEn - Date.now();
    if (restante <= 0) {
      setEstado({ tipo: 'sin-sesion', vencida: true });
      return;
    }
    const temporizador = setTimeout(() => setEstado({ tipo: 'sin-sesion', vencida: true }), Math.min(restante, 2_147_000_000));
    return () => clearTimeout(temporizador);
  }, [expiraEn]);

  const valor = useMemo<ContextoDeSesion>(
    () => ({
      sesion: estado.tipo === 'con-sesion' ? { token: estado.token, expiraEn: estado.expiraEn, identidadId: estado.identidadId } : null,
      restaurando: estado.tipo === 'restaurando',
      vencida: estado.tipo === 'sin-sesion' && estado.vencida,
      sinConexion: estado.tipo === 'sin-sesion' && !!estado.sinConexion,
      guardar,
      olvidar,
      cerrada,
    }),
    [estado, guardar, olvidar, cerrada],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): ContextoDeSesion {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useSesion fuera de ProveedorDeSesion');
  return contexto;
}

/**
 * Lo que dice una página con sesión mientras todavía no tiene el token: «Recuperando tu sesión…» al cargar, o
 * «Redirigiendo a Iniciar sesión…» si ya se sabe que no hay una.
 */
export function EsperandoSesion({ className = 'nota' }: { className?: string }) {
  const { restaurando } = useSesion();
  return (
    <p className={className} aria-live="polite">
      {restaurando ? 'Recuperando tu sesión…' : 'Redirigiendo a Iniciar sesión…'}
    </p>
  );
}
