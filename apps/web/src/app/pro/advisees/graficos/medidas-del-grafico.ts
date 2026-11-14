'use client';

/**
 * Las medidas que comparten los gráficos de la base (WP-GRAFICOS fase 2, DL-174): los márgenes del eje de fechas y el
 * ancho medido. Los paneles alineados y la cinta del tiempo usan los mismos, así una fecha cae en el mismo lugar en todos
 * los gráficos de una columna («Patrones»: la cinta arriba y las tarjetas debajo, con un solo cursor).
 */
import { useEffect, useRef, useState, type RefObject } from 'react';

/** El espacio a la izquierda para las marcas del eje vertical (o el ícono de la fila de la cinta). */
export const MARGEN_IZQUIERDO = 56;
/** El espacio a la derecha, para que la última marca del eje no se corte. */
export const MARGEN_DERECHO = 16;
/** El alto de los textos del eje de fechas, debajo del último carril. */
export const ALTO_DEL_EJE_DE_FECHAS = 24;
/** El ancho antes de medir: el del contenido de una tarjeta a todo el ancho en 1280. */
export const ANCHO_INICIAL = 720;
/** Menos que esto no se dibuja: en un teléfono, el gráfico se lee igual con su tabla. */
export const ANCHO_MINIMO = 280;

/** El ancho del contenedor, medido: el SVG no se estira, así la letra no baja de 12,5 px. */
export function useAnchoDelGrafico(): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ancho, setAncho] = useState(ANCHO_INICIAL);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const medir = () => setAncho(Math.max(ANCHO_MINIMO, Math.round(el.getBoundingClientRect().width)));
    medir();
    const o = new ResizeObserver(medir);
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return [ref, ancho];
}
