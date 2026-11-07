'use client';

/**
 * Lo que comparten las pestañas de área cuando se llega desde la ficha (WP-DASHBOARD-COMPRENSION, eje 5):
 * - **Retorno:** `volver` trae la configuración de la ficha (vista, período, métricas, pregunta…) como identificadores; se
 *   reconstruye con los mismos lectores de la ficha y nunca sale de `/pro/advisees` del mismo asesorado
 *   (`retornoALaFicha`). Se conserva al cambiar de sección dentro del área. El enlace lo muestra el marco del área
 *   (`MarcoDelArea`), siempre: con `volver` dice «donde estabas»; sin él, lleva a la ficha en su estado inicial.
 * - **Preparar la revisión:** con `preparar=1`, la vista Revisiones abre la pantalla de una revisión nueva con el período
 *   desde la última revisión (o el que propone la API, si no hay), dicho como preparado por BE (`periodo-de-la-revision.ts`).
 *   Ver no es revisar: nada se registra hasta «Registrar revisión», y la evidencia, la interpretación y el resultado los
 *   elige el profesional. Desde la parte 10 de WP-ESCRITORIO-AREAS, «Nueva revisión» también la abre con `preparar=1`
 *   (DEC-17).
 * - **Aplicar una revisión** (WP-TABLERO-ALTA-GAMA TB-09): con `revision=<id>`, la lista de Revisiones lleva el foco a
 *   esa revisión registrada, con su «Aplicar» a la vista. Abrirla no aplica nada: aplicar es otro acto.
 */
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, type RefObject } from 'react';
import { retornoALaFicha } from './seguimiento/estado';

/** El retorno a la ficha (validado) y el valor crudo para conservarlo en los enlaces de la pestaña. */
export function useRetornoALaFicha(id: string): { readonly href: string | null; readonly valor: string | null } {
  const parametros = useSearchParams();
  const valor = parametros.get('volver');
  const href = retornoALaFicha(valor, id);
  return { href, valor: href ? valor : null };
}

/** Agrega `volver` a un enlace de la pestaña, si se llegó desde la ficha. */
export const conVolver = (href: string, valor: string | null): string => (valor ? `${href}&volver=${encodeURIComponent(valor)}` : href);

export const usePreparar = (): boolean => useSearchParams().get('preparar') === '1';

/** La revisión registrada a la que lleva «Aplicar la revisión» desde la ficha (TB-09), o `null`. */
export const useRevisionPedida = (): string | null => useSearchParams().get('revision');

/**
 * La revisión pedida, a la vista: se desplaza hasta ella y le pasa el foco una vez, al aparecer. Devuelve lo que va en
 * su `<li>`: la referencia, el `tabIndex` que la deja recibir el foco y si es la pedida.
 */
export function useLaRevisionPedida(reviewId: string): { readonly ref: RefObject<HTMLLIElement | null>; readonly pedida: boolean } {
  const pedida = useRevisionPedida() === reviewId;
  const ref = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    if (!pedida || !ref.current) return;
    ref.current.scrollIntoView({ block: 'center' });
    ref.current.focus({ preventScroll: true });
  }, [pedida]);
  return { ref, pedida };
}
