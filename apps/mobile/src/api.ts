/**
 * Cliente de la API para el APK: base absoluta del perfil de build (API_BASE_URL, eas.json) y superficie APK.
 * La APK va directo a la API por HTTPS, sin CORS (07:645, 790). La definición del cliente es única: @be/domain.
 */
import { crearClienteBe } from '@be/domain';
import Constants from 'expo-constants';
import { randomUUID } from 'expo-crypto';

interface ExtraDeBuild {
  appEnv?: string;
  apiBaseUrl?: string | null;
  commit?: string | null;
}

export const extra = (Constants.expoConfig?.extra ?? {}) as ExtraDeBuild;

/** Sin API declarada en el build, la app lo dice en vez de inventar una URL. */
export const apiConfigurada = typeof extra.apiBaseUrl === 'string' && extra.apiBaseUrl.startsWith('https://');

export const api = crearClienteBe({ baseUrl: `${extra.apiBaseUrl ?? ''}/api/v1`, superficie: 'APK' });

/** Una key por intento lógico; los reintentos del mismo intento la reusan (10-B10:430-438). */
export function nuevaClaveDeIdempotencia(): string {
  return `apk-${randomUUID()}`;
}
