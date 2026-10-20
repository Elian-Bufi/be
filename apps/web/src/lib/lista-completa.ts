'use client';

/**
 * Una lista leída entera (`todasLasPaginas`, del dominio), para una pantalla que la cuenta o busca en ella: una cantidad
 * dicha sobre una lista a medias sería un número que no es.
 * - Mientras se vuelve a leer, lo que había sigue a la vista, marcado como «actualizando»: la pantalla no salta.
 * - Si falla, guarda el motivo: «esperá un minuto» no es lo mismo que «revisá la conexión» (`fallas.ts`). Si ya había
 *   una lista, sigue a la vista con la falla al lado (`fallaAlActualizar`): un «Actualizar» que falla no borra lo leído.
 * - Una respuesta vieja no pisa a una posterior.
 * - `consultado` es el momento en que llegó la última lectura, en el reloj del navegador.
 */
import { todasLasPaginas, type PaginaDeUnaLista } from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Resultado } from './api';
import { motivoDeFalla, type MotivoDeFalla } from './fallas';

export type EstadoDeListaCompleta<P extends PaginaDeUnaLista<unknown>> =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'error'; readonly motivo: MotivoDeFalla }
  | {
      readonly tipo: 'listo';
      readonly items: readonly P['data'][number][];
      /** La primera página, con lo que la respuesta dice además de la lista. */
      readonly primera: P;
      /** Falso si quedaron páginas sin leer: las cantidades son «al menos». */
      readonly completa: boolean;
      readonly consultado: Date;
      readonly actualizando: boolean;
      /** La última vez que se volvió a leer, falló: lo que se ve es lo de `consultado`. `null` si llegó. */
      readonly fallaAlActualizar: MotivoDeFalla | null;
    };

export function useListaCompleta<P extends PaginaDeUnaLista<unknown>>(
  pedir: ((filtro: { cursor?: string; limit: string }) => Promise<Resultado<P>>) | null,
  sesionPerdida: (r: Resultado<unknown>) => boolean,
  /** De a cuántos se pide y cuántas páginas se leen de una vez; «Ver más» lee otras tantas. */
  { limite, paginas }: { limite: number; paginas: number },
) {
  const [estado, setEstado] = useState<EstadoDeListaCompleta<P>>({ tipo: 'cargando' });
  const generacion = useRef(0);
  const tope = useRef(paginas);

  const leer = useCallback(async () => {
    if (!pedir) return;
    const esta = ++generacion.current;
    setEstado((e) => (e.tipo === 'listo' ? { ...e, actualizando: true } : { tipo: 'cargando' }));
    const r = await todasLasPaginas(pedir, { limite, maximoDePaginas: tope.current });
    if (esta !== generacion.current || sesionPerdida(r)) return;
    if (!r.ok) {
      const motivo = motivoDeFalla(r);
      return setEstado((e) => (e.tipo === 'listo' ? { ...e, actualizando: false, fallaAlActualizar: motivo } : { tipo: 'error', motivo }));
    }
    setEstado({ tipo: 'listo', items: r.datos.data, primera: r.datos.primera, completa: r.datos.completa, consultado: new Date(), actualizando: false, fallaAlActualizar: null });
  }, [pedir, sesionPerdida, limite]);

  const verMas = useCallback(() => {
    tope.current += paginas;
    return leer();
  }, [leer, paginas]);

  useEffect(() => {
    void leer();
  }, [leer]);

  return { estado, recargar: leer, verMas };
}
