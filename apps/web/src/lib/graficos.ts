'use client';

/**
 * Lo que comparten los gráficos del espacio profesional (entrenamiento y antropometría): cómo se recorre una lista con el
 * teclado y cuándo tiene sentido un recuadro que sigue al puntero. Cada gráfico conserva sus propias reglas de datos.
 */
import { useSyncExternalStore, type KeyboardEvent } from 'react';

/**
 * ¿Hay un puntero que pasa por encima (mouse)? El recuadro que sigue al puntero es una ayuda para ese caso. En una
 * pantalla táctil quedaría fijo encima del gráfico, y el panel de valores ya dice lo mismo: ahí no se muestra.
 */
const CONSULTA_PUNTERO = '(hover: hover) and (pointer: fine)';
export function useConPuntero(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const m = window.matchMedia(CONSULTA_PUNTERO);
      m.addEventListener('change', avisar);
      return () => m.removeEventListener('change', avisar);
    },
    () => window.matchMedia(CONSULTA_PUNTERO).matches,
    () => false,
  );
}

/** Recorre una lista con el teclado: flechas, Inicio y Fin. Devuelve el índice nuevo, o `null` si la tecla no es suya. */
export function indiceConTeclado(e: KeyboardEvent, actual: number | null, total: number): number | null {
  if (total === 0) return null;
  const desde = actual ?? -1;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return Math.min(desde + 1, total - 1);
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return Math.max(desde - 1, 0);
  if (e.key === 'Home') return 0;
  if (e.key === 'End') return total - 1;
  return null;
}
