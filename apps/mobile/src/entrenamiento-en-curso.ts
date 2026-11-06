/**
 * El entrenamiento en curso de la APK (WP-ENTRENAMIENTO-SERIES §7.5; precierre del 2026-10-06, §1, §3 y §4): el almacén
 * de `almacen-de-entrenamiento.ts` con lo del teléfono.
 * - **AsyncStorage cifrado** (`almacen-cifrado.ts`), con una clave por cuenta: AES-256-GCM de expo-crypto y la clave de
 *   cifrado de cada cuenta en el almacenamiento seguro. Lo que se guarda son datos de entrenamiento de la persona, nunca
 *   la credencial, que sigue en el almacenamiento seguro (`sesion-persistente.ts`). Las reglas de respaldo de Android lo
 *   dejan fuera de las copias y de las transferencias (`plugins/respaldo-de-android.js`).
 * - **La API real**, el reloj del teléfono (`reloj-del-telefono.ts`: desde el arranque, con el módulo nativo) e
 *   identificadores de expo-crypto.
 *
 * La raíz abre la cuenta con sesión y la cierra al salir o al cambiar de cuenta (`useCuentaDelEntrenamiento`). Al volver
 * del segundo plano se manda lo pendiente, y se reintenta lo que no se pudo leer o guardar en el teléfono: el reloj de la
 * sesión no depende de eso, se recalcula desde los instantes.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aesDecryptAsync, aesEncryptAsync, AESEncryptionKey, AESKeySize, AESSealedData, randomUUID } from 'expo-crypto';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { crearAlmacenCifrado, type CifradorAes } from './almacen-cifrado';
import { crearAlmacenDeEntrenamiento, type AlmacenDeEntrenamiento } from './almacen-de-entrenamiento';
import { almacenSeguro } from './almacen-seguro';
import { api } from './api';
import { enCursoEnElTelefono } from './sesion-en-curso';
import { relojDeLaSesion } from './reloj-del-telefono';

/**
 * AES-256-GCM de expo-crypto: vector inicial de 12 bytes y etiqueta de 16, los valores por omisión. Lo usa también el
 * borrador de los formularios (`formularios-en-el-telefono.ts`).
 */
export const aesDeExpo: CifradorAes = {
  async nuevaClave() {
    return (await AESEncryptionKey.generate(AESKeySize.AES256)).encoded('base64');
  },
  async cifrar(claveB64, datos, asociados) {
    const clave = await AESEncryptionKey.import(claveB64, 'base64');
    return (await aesEncryptAsync(datos, clave, { additionalData: asociados })).combined('base64');
  },
  async descifrar(claveB64, combinadoB64, asociados) {
    const clave = await AESEncryptionKey.import(claveB64, 'base64');
    return aesDecryptAsync(AESSealedData.fromCombined(combinadoB64), clave, { output: 'bytes', additionalData: asociados });
  },
};

export const entrenamientoLocal: AlmacenDeEntrenamiento = crearAlmacenDeEntrenamiento({
  almacen: crearAlmacenCifrado({
    plano: {
      leer: (clave) => AsyncStorage.getItem(clave),
      guardar: (clave, valor) => AsyncStorage.setItem(clave, valor),
      borrar: (clave) => AsyncStorage.removeItem(clave),
    },
    claves: almacenSeguro,
    aes: aesDeExpo,
  }),
  api,
  reloj: relojDeLaSesion,
  nuevoId: (prefijo) => `${prefijo}-${randomUUID()}`,
});

/** Para las pantallas: se vuelven a dibujar con cada cambio del entrenamiento en el teléfono. */
export function useEntrenamientoLocal(): AlmacenDeEntrenamiento {
  useSyncExternalStore(entrenamientoLocal.suscribir, entrenamientoLocal.instantanea);
  return entrenamientoLocal;
}

/**
 * Si hay un entrenamiento en curso en este teléfono: la barra inferior lo marca en Entrenamiento (PA-02). Vuelve a dibujar
 * solo cuando cambia la respuesta, no con cada cambio del entrenamiento.
 */
export function useHayEntrenamientoEnCurso(): boolean {
  return useSyncExternalStore(entrenamientoLocal.suscribir, () => enCursoEnElTelefono(entrenamientoLocal.sesiones()) !== null);
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
      // Al pasar a segundo plano, lo escrito que esperaba su demora se guarda ya (PA-01): Android puede cerrar la app.
      if (momento !== 'active') {
        void entrenamientoLocal.guardarYa();
        return;
      }
      // Al volver: lo que no se pudo leer o guardar en el teléfono se reintenta, y lo pendiente se manda.
      void entrenamientoLocal.reintentarLectura();
      void entrenamientoLocal.reintentarGuardado();
      sincronizarTodo();
    });
    return () => suscripcion.remove();
  }, []);
}
