/**
 * Cliente de la API para el APK: base absoluta del perfil de build (API_BASE_URL, eas.json) y superficie APK.
 * La APK va directo a la API por HTTPS, sin CORS (07:645, 790). La definición del cliente es única: @be/domain.
 */
import { crearClienteBe } from '@be/domain';
import Constants from 'expo-constants';
import { randomUUID } from 'expo-crypto';
import { memoria } from './lecturas';

interface ExtraDeBuild {
  appEnv?: string;
  apiBaseUrl?: string | null;
  commit?: string | null;
}

export const extra = (Constants.expoConfig?.extra ?? {}) as ExtraDeBuild;

/** Sin API declarada en el build, la app lo dice en vez de inventar una URL. */
export const apiConfigurada = typeof extra.apiBaseUrl === 'string' && extra.apiBaseUrl.startsWith('https://');

/**
 * Cualquier escritura olvida las lecturas recordadas, al salir y al volver la respuesta (navegación, 2026-10-03). Una
 * comida, una respuesta, el A3, un consentimiento o un vínculo pueden cambiar lo que se ve o lo que se puede ver. Vale
 * también para una escritura que falla: no se sabe qué cambió. Ver src/lecturas.ts.
 */
const fetchQueOlvidaAlEscribir: typeof fetch = async (entrada, init) => {
  const escribe = (init?.method ?? 'GET').toUpperCase() !== 'GET';
  if (escribe) memoria.olvidarLecturas();
  try {
    return await fetch(entrada, init);
  } finally {
    if (escribe) memoria.olvidarLecturas();
  }
};

export const api = crearClienteBe({ baseUrl: `${extra.apiBaseUrl ?? ''}/api/v1`, superficie: 'APK', fetch: fetchQueOlvidaAlEscribir });

/** Una key por intento lógico; los reintentos del mismo intento la reusan (10-B10:430-438). */
export function nuevaClaveDeIdempotencia(): string {
  return `apk-${randomUUID()}`;
}
