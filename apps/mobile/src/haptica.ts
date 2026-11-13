/**
 * PG-08 (WP-PULIDO-GRANDES): los tres toques, en un solo lugar. Es el único archivo de la APK que usa expo-haptics
 * (`toques.test.ts` lo fija); las pantallas llaman a estas tres funciones después de que algo quedó, nunca al tocar el
 * botón. Las reglas están en `toques.ts`.
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { preferenciasDelTelefono } from './preferencias-en-el-telefono';
import { EN_IOS, primeroQueAnde, SECUENCIA_EN_ANDROID, suena, toqueTrasLaRespuesta, toqueTrasLaSerie, type Toque } from './toques';

function sentir(toque: Toque | null): void {
  if (!suena(toque, preferenciasDelTelefono.actuales().haptica)) return;
  if (Platform.OS === 'android') {
    void primeroQueAnde(SECUENCIA_EN_ANDROID[toque], (tipo) => Haptics.performAndroidHapticsAsync(tipo as Haptics.AndroidHaptics));
    return;
  }
  const ios = EN_IOS[toque];
  const hecho =
    ios.tipo === 'impacto'
      ? Haptics.impactAsync(ios.estilo as Haptics.ImpactFeedbackStyle)
      : ios.tipo === 'aviso'
        ? Haptics.notificationAsync(ios.estilo as Haptics.NotificationFeedbackType)
        : Haptics.selectionAsync();
  void hecho.catch(() => undefined);
}

/** Después de una respuesta del servidor: confirmar (o deshacer) si confirmó; error si no. */
export const tocarTrasLaRespuesta = (respuesta: { readonly ok: boolean }, al: 'guardar' | 'deshacer'): void => sentir(toqueTrasLaRespuesta(respuesta, al));

/** Después de guardar una serie en el teléfono: tildarla confirma; destildarla deshace. */
export const tocarTrasLaSerie = (resultado: string): void => sentir(toqueTrasLaSerie(resultado));

/** Un error del formulario, después de revisarlo: el doble toque suave, junto con el texto que dice qué falta. */
export const tocarPorUnError = (): void => sentir('error');
