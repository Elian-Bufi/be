/**
 * Cliente de la API para el APK: base absoluta del perfil de build (API_BASE_URL, eas.json) y superficie APK.
 * La APK va directo a la API por HTTPS, sin CORS (07:645, 790). La definición del cliente es única: @be/domain.
 */
import { CAPACIDAD_OBJETIVOS_POR_SERIE, crearClienteBe } from '@be/domain';
import Constants from 'expo-constants';
import { randomUUID } from 'expo-crypto';
import { memoria } from './lecturas';
import { relojDelServidor } from './reloj-del-servidor';

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
    const respuesta = await fetch(entrada, init);
    // La hora del servidor, de cada respuesta: con ella se sabe qué día es «hoy» para la API (reloj-del-servidor.ts).
    relojDelServidor.registrar(respuesta.headers?.get?.('date'));
    return respuesta;
  } finally {
    if (escribe) memoria.olvidarLecturas();
  }
};

/**
 * La APK declara lo que sabe mostrar (`X-BE-Capabilities`; precierre del 2026-10-06, §2): el objetivo de cada serie
 * (API-SER-02), sin mostrar nunca los generales como si fueran los de una serie (`sesionDesdeLaOcurrencia`). Las APK
 * anteriores no la declaran, y la API no les entrega un plan que exige objetivos por serie.
 */
export const api = crearClienteBe({ baseUrl: `${extra.apiBaseUrl ?? ''}/api/v1`, superficie: 'APK', capacidades: [CAPACIDAD_OBJETIVOS_POR_SERIE], fetch: fetchQueOlvidaAlEscribir });

/**
 * API-ACC-05 con una señal para cortar el pedido (precierre del 2026-10-06, §5): la verificación de la credencial al
 * abrir la app espera hasta un minuto y, si no hay respuesta, corta el pedido antes de ofrecer otro. Es el mismo cliente,
 * con la señal en cada `fetch`.
 */
export function consultarCuentaConSenal(token: string, senal: AbortSignal) {
  const conSenal = crearClienteBe({ baseUrl: `${extra.apiBaseUrl ?? ''}/api/v1`, superficie: 'APK', capacidades: [CAPACIDAD_OBJETIVOS_POR_SERIE], fetch: (entrada, init) => fetchQueOlvidaAlEscribir(entrada, { ...init, signal: senal }) });
  return conSenal.consultarCuenta(token);
}

/** Una key por intento lógico; los reintentos del mismo intento la reusan (10-B10:430-438). */
export function nuevaClaveDeIdempotencia(): string {
  return `apk-${randomUUID()}`;
}
