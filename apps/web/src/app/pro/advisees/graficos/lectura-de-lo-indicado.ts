'use client';

/**
 * Lo indicado para un ejercicio en un período, leído para decir qué cambió en lo indicado (WP-GRAFICOS, pasada visual del
 * 15/11): la línea de la versión en la fuerza estimada («v8 · de 4 a 3 repeticiones») y la diferencia de GR-24 («el plan
 * indica 1 repetición menos»). Es la lectura del comparador que ya usa la base: API-TRN-21 en tramos de 92 días
 * (`leerLasSesionesEnTramos`) y API-SER-01 por versión (`leerLosObjetivosDeLasVersiones`), compartida mientras está en
 * vuelo y sin caché. Si no se puede leer, el gráfico se dibuja igual, sin el rótulo del cambio: no es un dato de la
 * persona, es una ayuda para leerlo.
 */
import { observacionesDelEjercicio, type ObservacionDeEvolucion } from '@be/domain';
import { useEffect, useState } from 'react';
import type { Resultado } from '../../../../lib/api';
import { leerLasSesionesEnTramos, leerLosObjetivosDeLasVersiones } from './lecturas';

export type LecturaDeLoIndicado = { readonly tipo: 'cargando' } | { readonly tipo: 'lista'; readonly observaciones: readonly ObservacionDeEvolucion[] } | { readonly tipo: 'sin-dato' };

/** Las observaciones del ejercicio (`e:<id>`) en el período, con lo indicado por la versión que rigió cada sesión. */
export function useLoIndicadoDelEjercicio(
  acceso: { readonly token: string; readonly asesoradoId: string; readonly sesionPerdida: (r: Resultado<unknown>) => boolean },
  exerciseKey: string | null,
  desde: string,
  hasta: string,
): LecturaDeLoIndicado {
  const { token, asesoradoId, sesionPerdida } = acceso;
  const [lectura, setLectura] = useState<LecturaDeLoIndicado>({ tipo: 'cargando' });
  useEffect(() => {
    if (exerciseKey === null || hasta < desde) {
      setLectura({ tipo: 'sin-dato' });
      return;
    }
    let vigente = true;
    setLectura({ tipo: 'cargando' });
    const p = { token, asesoradoId, sesionPerdida, periodo: { desde, hasta, hoy: hasta, desdeElVinculo: null } };
    void (async () => {
      const sesiones = await leerLasSesionesEnTramos(p);
      if (!vigente || sesiones === null) return;
      if (sesiones.tipo !== 'lista') return setLectura({ tipo: 'sin-dato' });
      const objetivos = await leerLosObjetivosDeLasVersiones(p, sesiones.ejecuciones.map((x) => x.planId));
      if (!vigente || objetivos === null) return;
      if (objetivos.tipo !== 'lista') return setLectura({ tipo: 'sin-dato' });
      setLectura({ tipo: 'lista', observaciones: observacionesDelEjercicio(sesiones.ejecuciones, exerciseKey, sesiones.ejecuciones, objetivos.objetivos) });
    })();
    return () => {
      vigente = false;
    };
  }, [token, asesoradoId, sesionPerdida, exerciseKey, desde, hasta]);
  return lectura;
}
