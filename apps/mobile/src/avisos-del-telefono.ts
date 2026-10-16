/**
 * Las dependencias reales de src/avisos.ts: el permiso y el token de expo-notifications, AsyncStorage y la API
 * (WP-NOVEDADES-Y-AVISOS, DL-133). Lo demás está en src/avisos.ts, que se prueba sin el teléfono.
 * - El token es el de Expo para el proyecto de EAS de BE (`extra.eas.projectId`, público).
 * - Mientras la app está abierta, un aviso que llega se muestra en la lista del sistema, sin sonido: la pantalla ya
 *   está a la vista y el número de la campana se actualiza.
 * - El canal de Android es el «default» que crea Expo, con el nombre que ve la persona en los ajustes.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { randomUUID } from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';
import type { CanalDelTelefono, DependenciasDeAvisos, Permiso } from './avisos';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

const deEstado = (estado: Notifications.PermissionStatus): Permiso =>
  estado === Notifications.PermissionStatus.GRANTED ? 'concedido' : estado === Notifications.PermissionStatus.DENIED ? 'denegado' : 'sin-preguntar';

const canal: CanalDelTelefono = {
  async permiso() {
    return deEstado((await Notifications.getPermissionsAsync()).status);
  },
  async pedirPermiso() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', { name: 'Novedades de BE', importance: Notifications.AndroidImportance.DEFAULT });
    }
    return deEstado((await Notifications.requestPermissionsAsync()).status);
  },
  async token() {
    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
    if (!projectId) throw new Error('sin proyecto de EAS');
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  },
};

export const dependenciasDeAvisos: DependenciasDeAvisos = {
  canal,
  almacen: {
    leer: (clave) => AsyncStorage.getItem(clave),
    guardar: (clave, valor) => AsyncStorage.setItem(clave, valor),
    borrar: (clave) => AsyncStorage.removeItem(clave),
  },
  api: {
    registrar: (token, deviceId, expoPushToken) => api.registrarSuscripcionPush(token, deviceId, { expoPushToken, platform: 'ANDROID' }),
    retirar: (token, deviceId) => api.retirarSuscripcionPush(token, deviceId),
  },
  nuevoIdentificador: () => randomUUID(),
};

/** Tocar un aviso de BE (con la app abierta, en segundo plano o cerrada): `alTocar` recibe sus datos. */
export function escucharAvisosTocados(alTocar: (datos: unknown) => void): () => void {
  const suscripcion = Notifications.addNotificationResponseReceivedListener((r) => alTocar(r.notification.request.content.data));
  return () => suscripcion.remove();
}

/** El aviso que abrió la app desde cerrada, si lo hubo. */
export function avisoQueAbrioLaApp(): unknown {
  return Notifications.getLastNotificationResponse()?.notification.request.content.data ?? null;
}

/** Un aviso que llegó con la app abierta: `alLlegar` actualiza el número de la campana. */
export function escucharAvisosRecibidos(alLlegar: () => void): () => void {
  const suscripcion = Notifications.addNotificationReceivedListener(() => alLlegar());
  return () => suscripcion.remove();
}
