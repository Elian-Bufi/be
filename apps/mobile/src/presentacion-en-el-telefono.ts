/**
 * PG-13 (WP-PULIDO-GRANDES, DL-173): lo visto de la presentación, en este teléfono, con AsyncStorage, como las
 * preferencias del teléfono. La lógica está en `presentacion.ts`, con su prueba; acá solo se le da el almacén y el reloj.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import { crearRegistroDeLaPresentacion, type EstadoDeLaPresentacion } from './presentacion';

export const registroDeLaPresentacion = crearRegistroDeLaPresentacion(AsyncStorage, (ms) => new Promise<void>((resolver) => setTimeout(resolver, ms)));

/**
 * Lo que se sabe de la presentación de la cuenta con sesión: `leyendo` mientras se lee lo guardado, `pendiente` si hay
 * que mostrarla y `vista` si no. Sin sesión, `vista`: no hay nada que presentar.
 */
export function usePresentacion(identidadId: string | null): EstadoDeLaPresentacion {
  const estado = useSyncExternalStore(registroDeLaPresentacion.suscribir, () => (identidadId ? registroDeLaPresentacion.estado(identidadId) : 'vista'));
  useEffect(() => {
    if (identidadId) void registroDeLaPresentacion.leer(identidadId);
  }, [identidadId]);
  return estado;
}
