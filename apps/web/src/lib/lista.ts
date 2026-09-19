'use client';

/**
 * Listas paginadas por cursor (09v7 T10): la primera página al montar, «Ver más» con `nextCursor`. Carga con estructura
 * real y error con «Reintentar» (10-B10:343-378). Si la sesión se perdió, no se muestra nada: la página ya redirige.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Resultado } from './api';

interface Pagina<T> {
  readonly data: readonly T[];
  readonly page: { readonly nextCursor: string | null; readonly hasMore: boolean };
}

export type EstadoDeLista<T> =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'error' }
  | { readonly tipo: 'listo'; readonly items: readonly T[]; readonly siguiente: string | null; readonly mas: 'libre' | 'cargando' | 'error' };

export function useListaPaginada<T>(
  cargar: ((cursor?: string) => Promise<Resultado<Pagina<T>>>) | null,
  sesionPerdida: (r: Resultado<unknown>) => boolean,
) {
  const [estado, setEstado] = useState<EstadoDeLista<T>>({ tipo: 'cargando' });
  // Una respuesta vieja no pisa una recarga posterior.
  const generacion = useRef(0);

  const recargar = useCallback(async () => {
    if (!cargar) return;
    const esta = ++generacion.current;
    setEstado({ tipo: 'cargando' });
    const r = await cargar();
    if (esta !== generacion.current || sesionPerdida(r)) return;
    setEstado(r.ok ? { tipo: 'listo', items: r.datos.data, siguiente: r.datos.page.hasMore ? r.datos.page.nextCursor : null, mas: 'libre' } : { tipo: 'error' });
  }, [cargar, sesionPerdida]);

  const verMas = useCallback(async () => {
    if (!cargar || estado.tipo !== 'listo' || !estado.siguiente || estado.mas === 'cargando') return;
    const esta = generacion.current;
    const previos = estado.items;
    const cursor = estado.siguiente;
    setEstado({ ...estado, mas: 'cargando' });
    const r = await cargar(cursor);
    if (esta !== generacion.current || sesionPerdida(r)) return;
    setEstado(
      r.ok
        ? { tipo: 'listo', items: [...previos, ...r.datos.data], siguiente: r.datos.page.hasMore ? r.datos.page.nextCursor : null, mas: 'libre' }
        : { tipo: 'listo', items: previos, siguiente: cursor, mas: 'error' },
    );
  }, [cargar, estado, sesionPerdida]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { estado, recargar, verMas };
}
