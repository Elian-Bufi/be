/**
 * El reloj de la sesión en la APK (precierre del 2026-10-06, §3; `reloj-de-sesion.ts`): el tiempo desde el arranque con
 * el módulo nativo `modules/reloj-del-sistema`, o el del proceso donde el módulo no está. El ancla del arranque se guarda
 * en AsyncStorage junto con el número de arranque del sistema, que no sale del teléfono.
 *
 * El almacén y las pantallas usan este mismo reloj: si el conteo en vivo usara otro, mezclaría bases y lo mostraría como
 * estimado.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RelojDelSistemaNativo } from '../modules/reloj-del-sistema';
import { crearRelojDelTelefono, idAleatorio, type RelojDeSesion } from './reloj-de-sesion';

export const relojDeLaSesion: RelojDeSesion = crearRelojDelTelefono({
  sistema: RelojDelSistemaNativo,
  almacen: { leer: (clave) => AsyncStorage.getItem(clave), guardar: (clave, valor) => AsyncStorage.setItem(clave, valor) },
  nuevoId: (prefijo) => idAleatorio(prefijo),
});
