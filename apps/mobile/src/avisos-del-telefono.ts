/**
 * Las dependencias reales de src/avisos.ts: el permiso y el token de expo-notifications, AsyncStorage y la API
 * (WP-NOVEDADES-Y-AVISOS, DL-133). Lo demás está en src/avisos.ts, que se prueba sin el teléfono.
 * - El token es el de Expo para el proyecto de EAS de BE (`extra.eas.projectId`, público).
 * - Mientras la app está abierta, un aviso que llega se muestra en la lista del sistema, sin sonido: la pantalla ya
 *   está a la vista y el número de la campana se actualiza.
 * - El canal de Android es el «default» que crea Expo, con el nombre que ve la persona en los ajustes.
 * - **El aviso del descanso** (DL-166, AVD-5): el único aviso local de BE. Se programa cuando un descanso empieza, para el
 *   instante en que llega al recomendado, y se cancela si el descanso termina antes, al pausar, al destildar, al
 *   finalizar o al cerrar la sesión. Va por su propio canal, «El descanso», que vibra. Es común, sin alarma exacta, y no
 *   nombra el ejercicio ni muestra ningún dato. Con la app abierta no se muestra: vibra la app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { randomUUID } from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';
import type { CanalDelTelefono, DependenciasDeAvisos, Permiso } from './avisos';
import { CONTENIDO_DEL_AVISO, esElAvisoDelDescanso, type PermisoDeAvisos } from './descanso-automatico';
import { TEXTOS_DEL_DESCANSO } from './textos-del-descanso';

Notifications.setNotificationHandler({
  // El del descanso, con la app abierta, no se muestra: la app ya vibra y la sesión está a la vista (DL-166).
  handleNotification: async (aviso) =>
    esElAvisoDelDescanso(aviso.request.content.data)
      ? { shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false }
      : { shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false },
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

// ─── El aviso del descanso (DL-166, AV-12) ──────────────────────────────────────────────────────

const CANAL_DEL_DESCANSO = 'descanso';
/** El identificador del aviso programado: hay uno solo a la vez, y programar otro reemplaza al anterior. */
const ID_DEL_AVISO_DEL_DESCANSO = 'be-descanso';

/** El permiso de avisos, en las palabras de la sesión: dado, sin pedir o negado. */
export async function permisoDeAvisos(): Promise<PermisoDeAvisos> {
  try {
    const p = deEstado((await Notifications.getPermissionsAsync()).status);
    return p === 'concedido' ? 'dado' : p === 'denegado' ? 'negado' : 'sin-pedir';
  } catch {
    return 'negado';
  }
}

/** Pide el permiso de avisos, recién cuando la persona toca «Permitir avisos» (AVD-8). Crea el canal del descanso. */
export async function pedirPermisoDeAvisos(): Promise<PermisoDeAvisos> {
  try {
    await crearCanalDelDescanso();
    const p = deEstado((await Notifications.requestPermissionsAsync()).status);
    return p === 'concedido' ? 'dado' : p === 'denegado' ? 'negado' : 'sin-pedir';
  } catch {
    return 'negado';
  }
}

async function crearCanalDelDescanso(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL_DEL_DESCANSO, {
    name: TEXTOS_DEL_DESCANSO.canalDelDescanso,
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 400, 200, 400],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

/** Programa el aviso del descanso para dentro de `enSegundos`. Lo mejor posible: si el teléfono no deja, vibra solo con la app abierta. */
export async function programarAvisoDelDescanso(enSegundos: number): Promise<void> {
  try {
    await crearCanalDelDescanso();
    await Notifications.scheduleNotificationAsync({
      identifier: ID_DEL_AVISO_DEL_DESCANSO,
      content: { title: CONTENIDO_DEL_AVISO.title, body: CONTENIDO_DEL_AVISO.body, data: { ...CONTENIDO_DEL_AVISO.data }, sound: false },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: enSegundos, channelId: CANAL_DEL_DESCANSO },
    });
  } catch {
    // Sin el aviso, la app vibra igual mientras está abierta.
  }
}

/** Cancela el aviso del descanso, si había uno. */
export async function cancelarAvisoDelDescanso(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(ID_DEL_AVISO_DEL_DESCANSO);
  } catch {
    // No había ninguno.
  }
}

/** Un aviso que llegó con la app abierta: `alLlegar` actualiza el número de la campana. */
export function escucharAvisosRecibidos(alLlegar: () => void): () => void {
  // El del descanso no es una novedad: no cambia el número de la campana.
  const suscripcion = Notifications.addNotificationReceivedListener((aviso) => {
    if (!esElAvisoDelDescanso(aviso.request.content.data)) alLlegar();
  });
  return () => suscripcion.remove();
}
