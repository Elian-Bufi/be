/**
 * Las preferencias de la sesión de este teléfono (`preferencias-del-telefono.ts`), con AsyncStorage, como los ajustes del
 * descanso. Se leen una vez al abrir la app; hasta entonces, valen las de fábrica.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { crearPreferenciasDelTelefono, type PreferenciasDelTelefono } from './preferencias-del-telefono';

export const preferenciasDelTelefono = crearPreferenciasDelTelefono(AsyncStorage);
void preferenciasDelTelefono.leer();

export function usePreferenciasDelTelefono(): PreferenciasDelTelefono {
  return useSyncExternalStore(preferenciasDelTelefono.suscribir, preferenciasDelTelefono.actuales, preferenciasDelTelefono.actuales);
}
