/**
 * Listas paginadas por cursor (09:188-189; 09v7 T10): la primera página al montar y «Ver más» con `nextCursor`.
 * Carga con estructura real y error con «Reintentar» (10-B10:343-378). Si la sesión se perdió, no se muestra nada: la
 * app ya volvió a Iniciar sesión.
 */
import type { Resultado } from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Pagina<T> {
  readonly data: readonly T[];
  readonly page: { readonly nextCursor: string | null; readonly hasMore: boolean };
}

export type EstadoDeLista<T> =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'error'; readonly sinConexion: boolean }
  | {
      readonly tipo: 'listo';
      readonly items: readonly T[];
      /** Cursor de la página siguiente; `null` si no hay más. */
      readonly siguiente: string | null;
      readonly mas: 'libre' | 'cargando' | 'error' | 'sin-conexion';
    };

/** `pedir` debe ser estable (useCallback): cada vez que cambia, la lista se vuelve a cargar desde el principio. */
export function useListaPaginada<T>(
  pedir: (cursor?: string) => Promise<Resultado<Pagina<T>>>,
  sesionPerdida: (r: Resultado<unknown>) => boolean,
) {
  const [estado, setEstado] = useState<EstadoDeLista<T>>({ tipo: 'cargando' });
  // Una respuesta vieja no pisa una recarga posterior.
  const generacion = useRef(0);
  // Dos toques seguidos en «Ver más» no piden dos veces la misma página.
  const pidiendoMas = useRef(false);

  const recargar = useCallback(async () => {
    const esta = ++generacion.current;
    pidiendoMas.current = false;
    setEstado({ tipo: 'cargando' });
    const r = await pedir();
    if (esta !== generacion.current || sesionPerdida(r)) return;
    setEstado(
      r.ok
        ? { tipo: 'listo', items: r.datos.data, siguiente: r.datos.page.hasMore ? r.datos.page.nextCursor : null, mas: 'libre' }
        : { tipo: 'error', sinConexion: r.tipo === 'RED' },
    );
  }, [pedir, sesionPerdida]);

  const verMas = useCallback(async () => {
    if (estado.tipo !== 'listo' || !estado.siguiente || pidiendoMas.current) return;
    pidiendoMas.current = true;
    const esta = generacion.current;
    const { items: previos, siguiente: cursor } = estado;
    setEstado({ ...estado, mas: 'cargando' });
    const r = await pedir(cursor);
    if (esta !== generacion.current) return;
    pidiendoMas.current = false;
    if (sesionPerdida(r)) return;
    setEstado(
      r.ok
        ? { tipo: 'listo', items: [...previos, ...r.datos.data], siguiente: r.datos.page.hasMore ? r.datos.page.nextCursor : null, mas: 'libre' }
        : { tipo: 'listo', items: previos, siguiente: cursor, mas: r.tipo === 'RED' ? 'sin-conexion' : 'error' },
    );
  }, [estado, pedir, sesionPerdida]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { estado, recargar, verMas };
}
