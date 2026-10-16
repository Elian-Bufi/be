'use client';

/**
 * Si la ventana tiene lugar para abrir un detalle al costado de lo que se está mirando, sin taparlo (WP-ESCRITORIO-AMABLE:
 * el detalle de un hecho en la línea de tiempo, E-70, y el origen de un dato en «Analizar», C-13). Desde 75rem entra al
 * costado; en una ventana más angosta se abre encima, en un panel que retiene el foco.
 */
import { useEffect, useState } from 'react';

export const DETALLE_AL_COSTADO = '(min-width: 75rem)';

/** En el primer dibujo no se sabe: se supone que no entra. */
export function useDetalleAlCostado(): boolean {
  const [entra, setEntra] = useState(false);
  useEffect(() => {
    const consulta = window.matchMedia(DETALLE_AL_COSTADO);
    const actualizar = () => setEntra(consulta.matches);
    actualizar();
    consulta.addEventListener('change', actualizar);
    return () => consulta.removeEventListener('change', actualizar);
  }, []);
  return entra;
}
