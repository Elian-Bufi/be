'use client';

/**
 * DL-113 · las pestañas de una sección del asesorado (Nutrición, Entrenamiento, Antropometría, Información), en un solo
 * lugar. Antes cada sección armaba las suyas y en el teléfono se partían en dos renglones, empujando la tarea hacia
 * abajo. Ahora van en una sola línea:
 * - si no entran, la línea se desplaza de costado (`desplazable-x`), y una sombra en el borde avisa que hay más;
 * - la pestaña elegida siempre queda a la vista, aunque esté al final;
 * - el desplazamiento es solo horizontal, para no mover la página.
 * Siguen siendo enlaces con `aria-current`, en el mismo orden de tabulación.
 */
import Link from 'next/link';
import { useEffect, useRef, type RefObject } from 'react';

export function Pestanas<C extends string>({
  etiqueta,
  vistas,
  actual,
  href,
}: {
  etiqueta: string;
  vistas: readonly { readonly clave: C; readonly texto: string }[];
  actual: C;
  href: (clave: C) => string;
}) {
  const lista = useRef<HTMLUListElement>(null);
  useActualALaVista(lista, actual);
  return (
    <nav className="pestanas" aria-label={etiqueta}>
      <ul ref={lista} className="desplazable-x">
        {vistas.map((v) => (
          <li key={v.clave}>
            <Link href={href(v.clave)} aria-current={v.clave === actual ? 'page' : undefined} replace>
              {v.texto}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Mantiene a la vista el enlace actual de una línea que se desplaza de costado: al montar, al cambiar de pestaña y cada
 * vez que la línea cambia de ancho (rotar el teléfono, agrandar la ventana).
 */
export function useActualALaVista(lista: RefObject<HTMLElement | null>, actual: unknown): void {
  useEffect(() => {
    const elemento = lista.current;
    if (!elemento) return;
    mostrarLaActual(elemento);
    if (typeof ResizeObserver === 'undefined') return;
    const observador = new ResizeObserver(() => mostrarLaActual(elemento));
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [lista, actual]);
}

/**
 * Lleva de costado la lista hasta el enlace actual, si quedó fuera de la vista. Nunca desplaza la página. La lista es
 * `position: relative` (`.desplazable-x`), así que la posición del enlace ya se mide desde ella.
 */
export function mostrarLaActual(lista: HTMLElement | null): void {
  const actual = lista?.querySelector<HTMLElement>('[aria-current]');
  if (!lista || !actual) return;
  const izquierda = actual.offsetLeft;
  const derecha = izquierda + actual.offsetWidth;
  if (izquierda < lista.scrollLeft) lista.scrollLeft = Math.max(0, izquierda - 16);
  else if (derecha > lista.scrollLeft + lista.clientWidth) lista.scrollLeft = derecha - lista.clientWidth + 16;
}
