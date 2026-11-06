/**
 * El borrador de los formularios en el teléfono (WP-FORMULARIOS-RONDA-2, FR-01): el almacén de
 * `borrador-de-formulario.ts` con lo del teléfono, el mismo que usa el entrenamiento en curso.
 * - **AsyncStorage cifrado** (`almacen-cifrado.ts`): AES-256-GCM de expo-crypto, con un valor por cuenta y por solicitud
 *   y la clave de cifrado de cada cuenta en el almacenamiento seguro (`nombreDeLaClaveDeCifrado`). Las reglas de
 *   respaldo de Android lo dejan fuera de las copias y de las transferencias (`plugins/respaldo-de-android.js`).
 * - **Las claves de AsyncStorage**, para encontrar los borradores de una cuenta al cerrar la sesión o al leer la bandeja.
 *
 * La pantalla de la solicitud lee, escribe y borra (`pantallas/formularios.tsx`); la bandeja borra lo que ya no está
 * pendiente; la raíz borra lo de la cuenta cuando la persona cierra la sesión (App.tsx).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { crearAlmacenCifrado } from './almacen-cifrado';
import { almacenSeguro } from './almacen-seguro';
import { crearBorradoresDeFormularios, nombreDeLaClaveDeCifrado, type BorradoresDeFormularios } from './borrador-de-formulario';
import { aesDeExpo } from './entrenamiento-en-curso';

export const borradoresDeFormularios: BorradoresDeFormularios = crearBorradoresDeFormularios({
  almacen: crearAlmacenCifrado({
    plano: {
      leer: (clave) => AsyncStorage.getItem(clave),
      guardar: (clave, valor) => AsyncStorage.setItem(clave, valor),
      borrar: (clave) => AsyncStorage.removeItem(clave),
    },
    claves: almacenSeguro,
    aes: aesDeExpo,
    nombreDeLaClave: nombreDeLaClaveDeCifrado,
  }),
  plano: {
    borrar: (clave) => AsyncStorage.removeItem(clave),
    claves: () => AsyncStorage.getAllKeys(),
  },
});
