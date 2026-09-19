'use client';

/**
 * Páginas con sesión (WP-03): sin token, se va a Iniciar sesión con retorno seguro; si la API dice que la sesión ya no
 * sirve, se olvida el token y se vuelve al login. Es el patrón de Cuenta (WP-02) compartido por las rutas nuevas.
 * El token vive solo en memoria de la pestaña (DL-012): recargar exige volver a iniciar sesión.
 */
import { CODIGOS_DE_SESION_NO_VALIDA } from '@be/domain';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import type { Resultado } from './api';
import { useSesion } from './sesion';

export function useSesionRequerida(volver: string) {
  const router = useRouter();
  const { sesion, olvidar } = useSesion();
  const saliendo = useRef(false);
  const token = sesion?.token ?? null;
  const volverA = encodeURIComponent(volver);

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
        salir(`/login?volver=${volverA}&aviso=sesion-no-valida`);
        return true;
      }
      return false;
    },
    [salir, volverA],
  );

  useEffect(() => {
    if (!token && !saliendo.current) router.replace(`/login?volver=${volverA}`);
  }, [token, router, volverA]);

  return { token, salir, sesionPerdida };
}
