'use client';

/**
 * Páginas con sesión (WP-03): sin token, se va a Iniciar sesión con retorno seguro; si la API dice que la sesión ya no
 * sirve, se olvida el token y se vuelve al login. Es el patrón de Cuenta (WP-02) compartido por las rutas nuevas.
 * El token vive en memoria de la pestaña y una recarga lo recupera con la cookie de reanudación (DL-147): mientras se
 * restaura, no se manda a Iniciar sesión. Si la sesión venció, la entrada lo dice y, después de entrar, vuelve al mismo
 * lugar: la misma ruta, vista y período, si tienen una forma conocida (`retornoDeLaPagina`); si no, al retorno que pidió
 * la página. Nada de lo escrito sin guardar se confirma solo después de entrar: la página se vuelve a montar.
 */
import { CODIGOS_DE_SESION_NO_VALIDA } from '@be/domain';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import type { Resultado } from './api';
import { retornoDeLaPagina } from './copy';
import { useSesion } from './sesion';

export function useSesionRequerida(volver: string) {
  const router = useRouter();
  const { sesion, olvidar, restaurando, vencida } = useSesion();
  const saliendo = useRef(false);
  const token = sesion?.token ?? null;

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

  useEffect(() => {
    if (restaurando || token || saliendo.current) return;
    router.replace(`/login?volver=${volverA()}${vencida ? '&aviso=sesion-vencida' : ''}`);
  }, [token, restaurando, vencida, router, volverA]);

  return { token, salir, sesionPerdida, restaurando };
}
