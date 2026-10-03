/**
 * El almacenamiento seguro de la plataforma, para la credencial de la sesión (DL-012, decisión del 2026-10-03).
 *
 * `expo-secure-store`: en Android cifra el valor con una clave del Keystore, que no sale del teléfono. Su plugin, en
 * `app.config.ts`, deja este dato fuera del respaldo automático de Android. El token nunca va al almacenamiento plano
 * (`AsyncStorage`), que la app usa solo para el tema y la figura elegida.
 */
import * as SecureStore from 'expo-secure-store';
import type { AlmacenSeguro } from './sesion-persistente';

export const almacenSeguro: AlmacenSeguro = {
  leer: (clave) => SecureStore.getItemAsync(clave),
  guardar: (clave, valor) => SecureStore.setItemAsync(clave, valor),
  borrar: (clave) => SecureStore.deleteItemAsync(clave),
};
