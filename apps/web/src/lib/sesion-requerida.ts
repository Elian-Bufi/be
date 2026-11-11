'use client';

/**
 * Páginas con sesión (WP-03): sin token, se va a Iniciar sesión con retorno seguro; si la API dice que la sesión ya no
 * sirve, se olvida el token y se vuelve al login. Es el patrón de Cuenta (WP-02) compartido por las rutas nuevas.
 * El token vive en memoria de la pestaña y una recarga lo recupera con la cookie de reanudación (DL-147): mientras se
 * restaura, no se manda a Iniciar sesión. Si la sesión venció, la entrada lo dice y, después de entrar, vuelve al mismo
 * lugar: la misma ruta, vista y período, si tienen una forma conocida (`retornoDeLaPagina`); si no, al retorno que pidió
 * la página. Nada de lo escrito sin guardar se confirma solo después de entrar: la página se vuelve a montar.
 *
 * `useSesionPerdida` es solo la mitad de la salida: lo que se hace cuando la API dice que la sesión ya no sirve. La usa
 * también «Antes de seguir» (WP-USO-FINAL UF-01), que envuelve a `/account` y `/pro` y no exige sesión por su cuenta: sin
 * sesión, deja que cada página decida.
 */
import { CODIGOS_DE_SESION_NO_VALIDA } from '@be/domain';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import type { Resultado } from './api';
import { retornoDeLaPagina } from './copy';
import { useSesion } from './sesion';

/** Olvidar la sesión y volver a Iniciar sesión, con el retorno de la página y el motivo. */
export function useSesionPerdida(volver: string) {
  const router = useRouter();
  const { olvidar } = useSesion();
  const saliendo = useRef(false);

  /** El retorno, calculado al irse: la dirección de ese momento, con lo que se puede conservar. */
  const volverA = useCallback(() => encodeURIComponent(typeof window === 'undefined' ? volver : retornoDeLaPagina(window.location.pathname, window.location.search, volver)), [volver]);

  const salir = useCallback(
    (destino: string) => {
      saliendo.current = true;
      olvidar();
      router.replace(destino);
    },
    [olvidar, router],
  );

  const sesionPerdida = useCallback(
    (r: Resultado<unknown>) => {
      if (!r.ok && r.tipo === 'API' && CODIGOS_DE_SESION_NO_VALIDA.has(r.codigo)) {
        salir(`/login?volver=${volverA()}&aviso=${r.codigo === 'SESSION_EXPIRED' ? 'sesion-vencida' : 'sesion-no-valida'}`);
        return true;
      }
      return false;
    },
    [salir, volverA],
  );

  return { salir, sesionPerdida, saliendo, volverA };
}

export function useSesionRequerida(volver: string) {
  const router = useRouter();
  const { sesion, restaurando, vencida, sinConexion } = useSesion();
  const { salir, sesionPerdida, saliendo, volverA } = useSesionPerdida(volver);
  const token = sesion?.token ?? null;

  useEffect(() => {
    if (restaurando || token || saliendo.current) return;
    // Una sesión que no se pudo recuperar por la conexión no es una sesión vencida: la entrada dice cuál de las dos fue.
    router.replace(`/login?volver=${volverA()}${vencida ? '&aviso=sesion-vencida' : sinConexion ? '&aviso=sin-conexion' : ''}`);
  }, [token, restaurando, vencida, sinConexion, router, volverA, saliendo]);

  return { token, salir, sesionPerdida, restaurando };
}
