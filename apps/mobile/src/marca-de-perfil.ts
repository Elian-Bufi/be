/**
 * La marca de la pestaña Perfil (PV-6, DL-166; AV-04), compartida entre las pantallas: Inicio y Perfil la fijan cuando su
 * lectura de «Para responder» se confirma, y App.tsx la lee para la barra. Vive fuera del árbol de React, como la sesión
 * en memoria, y se olvida al cerrar la sesión. Mientras nadie leyó, no hay marca: no se afirma nada sin saberlo.
 *
 * La regla de cuándo hay marca es `marcaDePerfil`, de `perfil.ts`: la misma cuenta en Inicio y en Perfil.
 */
import { useSyncExternalStore } from 'react';
import { marcaDePerfil, type FilaParaResponder } from './perfil';

export interface AlmacenDeLaMarca {
  /** Las filas de «Para responder» recién confirmadas por una lectura. */
  fijar(filas: readonly FilaParaResponder[]): void;
  /** Al cerrar la sesión: sin lectura, sin marca. */
  olvidar(): void;
  visible(): boolean;
  suscribir(alCambiar: () => void): () => void;
}

export function crearAlmacenDeLaMarca(): AlmacenDeLaMarca {
  let visible = false;
  const oyentes = new Set<() => void>();
  const avisar = (nuevo: boolean) => {
    if (nuevo === visible) return;
    visible = nuevo;
    for (const o of oyentes) o();
  };
  return {
    fijar: (filas) => avisar(marcaDePerfil(filas).visible),
    olvidar: () => avisar(false),
    visible: () => visible,
    suscribir(alCambiar) {
      oyentes.add(alCambiar);
      return () => oyentes.delete(alCambiar);
    },
  };
}

export const marcaEnPerfil = crearAlmacenDeLaMarca();

/** Si la barra lleva el punto en Perfil. */
export function useMarcaEnPerfil(): boolean {
  return useSyncExternalStore(marcaEnPerfil.suscribir, marcaEnPerfil.visible, marcaEnPerfil.visible);
}
