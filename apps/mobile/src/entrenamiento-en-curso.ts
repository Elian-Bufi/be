/**
 * El entrenamiento en curso de la APK (WP-ENTRENAMIENTO-SERIES §7.5): el almacén de `almacen-de-entrenamiento.ts` con lo
 * del teléfono.
 * - **AsyncStorage**, con una clave por cuenta. Lo que se guarda son datos de entrenamiento de la persona, nunca la
 *   credencial, que sigue en el almacenamiento seguro (`sesion-persistente.ts`).
 * - **La API real**, el reloj de este proceso (`reloj-de-sesion.ts`) e identificadores de expo-crypto.
 *
 * La raíz abre la cuenta con sesión y la cierra al salir o al cambiar de cuenta (`useCuentaDelEntrenamiento`). Al volver
 * del segundo plano se manda lo pendiente: el reloj de la sesión no depende de eso, se recalcula desde los instantes.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { crearAlmacenDeEntrenamiento, type AlmacenDeEntrenamiento } from './almacen-de-entrenamiento';
import { api } from './api';
import { relojDelProceso } from './reloj-de-sesion';

export const entrenamientoLocal: AlmacenDeEntrenamiento = crearAlmacenDeEntrenamiento({
  almacen: {
    leer: (clave) => AsyncStorage.getItem(clave),
    guardar: (clave, valor) => AsyncStorage.setItem(clave, valor),
    borrar: (clave) => AsyncStorage.removeItem(clave),
  },
  api,
  reloj: relojDelProceso,
  nuevoId: (prefijo) => `${prefijo}-${randomUUID()}`,
});

/** Para las pantallas: se vuelven a dibujar con cada cambio del entrenamiento en el teléfono. */
export function useEntrenamientoLocal(): AlmacenDeEntrenamiento {
  useSyncExternalStore(entrenamientoLocal.suscribir, entrenamientoLocal.instantanea);
  return entrenamientoLocal;
}

function sincronizarTodo(): void {
  for (const s of entrenamientoLocal.sesiones()) void entrenamientoLocal.sincronizar(s.draftId);
}

/**
 * Para la raíz: abre lo guardado de la cuenta con sesión y lo cierra al salir o al cambiar de cuenta. Lo de otra cuenta
 * no se muestra ni se sincroniza.
 */
export function useCuentaDelEntrenamiento(sesion: { readonly token: string; readonly identidadId: string } | null): void {
  const token = sesion?.token ?? null;
  const identidadId = sesion?.identidadId ?? null;
  useEffect(() => {
    if (!token || !identidadId) {
      entrenamientoLocal.cerrarCuenta();
      return;
    }
    void entrenamientoLocal.abrirCuenta(identidadId, token).then(sincronizarTodo);
  }, [token, identidadId]);
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (momento) => {
      if (momento === 'active') sincronizarTodo();
    });
    return () => suscripcion.remove();
  }, []);
}
