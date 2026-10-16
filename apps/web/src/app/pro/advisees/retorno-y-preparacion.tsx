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
 */
import { useSearchParams } from 'next/navigation';
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
