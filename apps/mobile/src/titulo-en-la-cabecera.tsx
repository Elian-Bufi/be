/**
 * PG-04 (WP-PULIDO-GRANDES): el enlace entre el título grande de cada pantalla (`Titulo`, en ui.tsx), la cabecera y el
 * desplazamiento de App.tsx. La lógica está en `titulo-de-la-cabecera.ts`; acá, solo lo de React Native.
 *
 * App.tsx provee el registro y el valor del fundido. El título grande se registra al montarse, se mide con su `onLayout`
 * y se apaga con `1 − v`; la cabecera muestra el texto registrado con `v`. Fuera del proveedor (una prueba, un diálogo),
 * el título grande se dibuja como siempre.
 */
import { createContext, useContext, useEffect, useId, useSyncExternalStore } from 'react';
import { Animated, type LayoutChangeEvent } from 'react-native';
import { finDelTitulo, type RegistroDelTitulo } from './titulo-de-la-cabecera';

export interface TituloCompartido {
  readonly registro: RegistroDelTitulo;
  /** De 0 (el título grande) a 1 (el de la cabecera). */
  readonly valor: Animated.Value;
}

export const ContextoDelTitulo = createContext<TituloCompartido | null>(null);

/** Para el título grande: se registra con su texto, se mide y se apaga cuando sube a la cabecera. */
export function useTituloGrande(texto: string | null): { readonly alMedir?: (e: LayoutChangeEvent) => void; readonly opacidad?: Animated.AnimatedInterpolation<number> } {
  const compartido = useContext(ContextoDelTitulo);
  const id = useId();
  useEffect(() => {
    if (!compartido || texto === null) return;
    compartido.registro.registrar(id, texto);
    return () => compartido.registro.quitar(id);
  }, [compartido, id, texto]);
  if (!compartido || texto === null) return {};
  return {
    alMedir: (e) => compartido.registro.medir(id, finDelTitulo(e.nativeEvent.layout.y, e.nativeEvent.layout.height)),
    opacidad: compartido.valor.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
  };
}

/** Para la cabecera: el texto del título de la pantalla, o `null`. Solo cambia al cambiar de pantalla, no al desplazar. */
export function useTextoDelTitulo(registro: RegistroDelTitulo): string | null {
  return useSyncExternalStore(registro.suscribir, () => registro.actual()?.texto ?? null);
}
