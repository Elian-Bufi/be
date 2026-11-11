'use client';

/**
 * El nombre con que las personas ven al profesional que mira (DL-040: el de su perfil profesional), para su monograma en
 * el menú de la cuenta (WP-TABLERO-ALTA-GAMA TB-05; DL-163 D-2). No es una lectura nueva: lo anotan las pantallas que
 * ya leen los vínculos (el Espacio y la ficha), donde la cuenta figura como profesional. Vive en la memoria de la pestaña,
 * como la sesión: sin vínculos leídos todavía, el menú sigue con su dibujo.
 */
import { useSyncExternalStore } from 'react';

let nombre: string | null = null;
const oyentes = new Set<() => void>();

/** Lo anota quien leyó un vínculo de la cuenta como profesional. */
export function anotarNombrePropio(valor: string | null | undefined): void {
  const nuevo = valor?.trim() ? valor : null;
  if (nuevo === null || nuevo === nombre) return;
  nombre = nuevo;
  for (const avisar of oyentes) avisar();
}

/** Al cerrar la sesión, el nombre se olvida con ella. */
export function olvidarNombrePropio(): void {
  nombre = null;
  for (const avisar of oyentes) avisar();
}

const suscribir = (avisar: () => void) => {
  oyentes.add(avisar);
  return () => {
    oyentes.delete(avisar);
  };
};

export function useNombrePropio(): string | null {
  return useSyncExternalStore(
    suscribir,
    () => nombre,
    () => null,
  );
}

/** El nombre propio de entre los vínculos leídos: el que figura en los vínculos donde la cuenta es la profesional. */
export function nombrePropioEn(vinculos: readonly { readonly professional: { readonly identityId: string; readonly displayName: string } }[], yo: string): string | null {
  return vinculos.find((v) => v.professional.identityId === yo)?.professional.displayName ?? null;
}
