// expo-secure-store en el render del navegador: localStorage con un prefijo. En el teléfono, el valor va cifrado con una
// clave del Keystore; acá solo se reproduce la interfaz, para que la clave de cifrado del entrenamiento en curso
// (`apps/mobile/src/almacen-cifrado.ts`) sobreviva a una recarga como sobrevive a un cierre de la app. No es seguro: es
// el arnés, con datos sintéticos.
const PREFIJO = 'almacen-seguro:';
export const getItemAsync = async (k) => localStorage.getItem(PREFIJO + k);
export const setItemAsync = async (k, v) => void localStorage.setItem(PREFIJO + k, v);
export const deleteItemAsync = async (k) => void localStorage.removeItem(PREFIJO + k);
