/**
 * Los ajustes del descanso en este teléfono (PV-10, DL-166; AV-11): los de `descanso-automatico.ts`, guardados con
 * AsyncStorage como la apariencia. Se leen una vez al abrir la app; hasta entonces, y si el teléfono no deja leer,
 * valen los de fábrica. No viajan a la API.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { crearAjustesDelDescanso, type AjustesDelDescanso } from './descanso-automatico';
import { crearMarcaDeLaExplicacion } from './explicacion-de-los-tiempos';

export const ajustesDelDescanso = crearAjustesDelDescanso(AsyncStorage);
void ajustesDelDescanso.leer();

export function useAjustesDelDescanso(): AjustesDelDescanso {
  return useSyncExternalStore(ajustesDelDescanso.suscribir, ajustesDelDescanso.actuales, ajustesDelDescanso.actuales);
}

/** La marca de la explicación de los tiempos, una vez por cuenta en este teléfono (AV2-33). */
export const marcaDeLaExplicacion = crearMarcaDeLaExplicacion(AsyncStorage);
