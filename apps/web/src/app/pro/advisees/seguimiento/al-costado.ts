'use client';

/**
 * Si la ventana tiene lugar para abrir un detalle al costado de lo que se está mirando, sin taparlo (WP-ESCRITORIO-AMABLE:
 * el detalle de un hecho en la línea de tiempo, E-70, y el origen de un dato en «Analizar», C-13). Desde 75rem entra al
 * costado; en una ventana más angosta se abre encima, en un panel que retiene el foco.
 */
import { useSyncExternalStore } from 'react';

export const DETALLE_AL_COSTADO = '(min-width: 75rem)';

function suscribir(avisar: () => void): () => void {
  const consulta = window.matchMedia(DETALLE_AL_COSTADO);
  consulta.addEventListener('change', avisar);
  return () => consulta.removeEventListener('change', avisar);
}

/**
 * Se lee de la ventana desde el primer dibujo. Si se supusiera que no entra hasta preguntar, lo que se monta con un
 * detalle ya abierto (por la dirección, o al tocar «Actualizar») lo abriría encima por un instante antes de pasarlo al
 * costado (WP-ESCRITORIO-AREAS, parte 1). Solo al hidratar una página servida no se sabe: ahí se supone que no entra.
 */
export function useDetalleAlCostado(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => window.matchMedia(DETALLE_AL_COSTADO).matches,
    () => false,
  );
}
