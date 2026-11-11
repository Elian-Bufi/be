'use client';

/**
 * Cerrar esta sesión desde el website, igual en el menú de la cuenta y en «Antes de seguir» (WP-USO-FINAL UF-01: cerrar
 * la sesión siempre está a mano). Con la sesión cerrada, o si la API dice que ya no valía, va a «Iniciar sesión» con una
 * carga completa de la página: la sesión vive en memoria, así no queda nada de la visita. La API borra la cookie de
 * reanudación y las otras pestañas se enteran y la olvidan (DL-147). Sin respuesta, lo dice y la sesión sigue.
 */
import { CODIGOS_DE_SESION_NO_VALIDA } from '@be/domain';
import { useCallback, useState } from 'react';
import { api } from './api';
import { COPY } from './copy';
import { olvidarNombrePropio } from './nombre-propio';
import { useSesion } from './sesion';

/** Lo que dice el botón mientras la API cierra la sesión. */
export const CERRANDO_SESION = 'Cerrando sesión…';

export function useCerrarSesion() {
  const { sesion, cerrada } = useSesion();
  const token = sesion?.token ?? null;
  const [cerrando, setCerrando] = useState(false);
  const [problema, setProblema] = useState<string | null>(null);

  const cerrar = useCallback(async () => {
    if (!token || cerrando) return;
    setCerrando(true);
    setProblema(null);
    const r = await api.finalizarSesion(token);
    if (r.ok || (r.tipo === 'API' && CODIGOS_DE_SESION_NO_VALIDA.has(r.codigo))) {
      cerrada();
      olvidarNombrePropio();
      window.location.assign('/login?aviso=sesion-cerrada');
      return;
    }
    setCerrando(false);
    setProblema(r.tipo === 'RED' ? COPY.resultadoIncierto : COPY.noDisponible);
  }, [token, cerrando, cerrada]);

  const olvidarProblema = useCallback(() => setProblema(null), []);

  return { cerrar, cerrando, problema, olvidarProblema };
}
