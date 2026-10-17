/**
 * WP-ACCESO-GOOGLE (DEUDA_LEGAJO DL-138): la cuenta de Google en la APK, solo para conseguir el ID token de la cuenta que
 * la persona elige. Lo verifica la API de BE (API-GOO-01 a 03); la APK no guarda nada de Google y la sesión es la de BE.
 * - **La biblioteca** es @react-native-google-signin/google-signin en su versión gratuita, que en Android usa el Google
 *   Sign-In de Play Services, el SDK que Google marcó como heredado (la versión con Credential Manager es paga). El ID token
 *   es el mismo y la API lo verifica igual.
 * - **El client ID** que se le pasa es el «Aplicación web» (`webClientId`): el ID token sale con esa audiencia, que la API
 *   acepta. Android reconoce a la APK por su paquete y la huella SHA-1 de su firma, con el client ID «Android» del mismo
 *   proyecto de Google Cloud, que no se escribe en la app.
 * - **Sin el client ID en el build** (`GOOGLE_WEB_CLIENT_ID`, app.config.ts) no hay botón, y la biblioteca ni se carga:
 *   se pide recién al tocar «Continuar con Google». Si faltara su parte nativa, la app no se cae: Google no está
 *   disponible y el correo y la contraseña siguen.
 * - **La persona elige la cuenta cada vez:** después de recibir el token se cierra la sesión de Google en la app. BE no la
 *   necesita: tiene la suya (DL-012).
 */
import type * as BibliotecaDeGoogle from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

type Biblioteca = typeof BibliotecaDeGoogle;

const extra = (Constants.expoConfig?.extra ?? {}) as { googleWebClientId?: string | null };

export const CLIENT_ID_WEB_DE_GOOGLE: string | null = typeof extra.googleWebClientId === 'string' && extra.googleWebClientId ? extra.googleWebClientId : null;

export type CuentaDeGoogle =
  | { readonly tipo: 'ID_TOKEN'; readonly idToken: string }
  /** La persona cerró la ventana de Google sin elegir una cuenta: no pasa nada. */
  | { readonly tipo: 'CANCELADA' }
  /** Ya había una elección en curso (un doble toque). */
  | { readonly tipo: 'EN_CURSO' }
  /**
   * Sin los servicios de Google en el teléfono, sin la parte nativa, o con la configuración de Google Cloud incompleta (un
   * client ID «Android» que no coincide con el paquete o la huella da DEVELOPER_ERROR; ver docs/DESPLIEGUE.md).
   */
  | { readonly tipo: 'NO_DISPONIBLE' };

let biblioteca: Biblioteca | null | undefined;

function cargar(clientId: string): Biblioteca | null {
  if (biblioteca !== undefined) return biblioteca;
  try {
    const cargada = require('@react-native-google-signin/google-signin') as Biblioteca;
    cargada.GoogleSignin.configure({ webClientId: clientId });
    biblioteca = cargada;
  } catch {
    biblioteca = null;
  }
  return biblioteca;
}

/** Abre la elección de cuenta de Google y devuelve el ID token, o por qué no lo hay. */
export async function elegirCuentaDeGoogle(): Promise<CuentaDeGoogle> {
  if (!CLIENT_ID_WEB_DE_GOOGLE) return { tipo: 'NO_DISPONIBLE' };
  const google = cargar(CLIENT_ID_WEB_DE_GOOGLE);
  if (!google) return { tipo: 'NO_DISPONIBLE' };
  try {
    await google.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Una cuenta que quedó elegida de otra vez se olvida: si no, Google la devuelve sin preguntar.
    if (google.GoogleSignin.hasPreviousSignIn()) await google.GoogleSignin.signOut();
    const respuesta = await google.GoogleSignin.signIn();
    if (!google.isSuccessResponse(respuesta)) return { tipo: 'CANCELADA' };
    await google.GoogleSignin.signOut().catch(() => null);
    return respuesta.data.idToken ? { tipo: 'ID_TOKEN', idToken: respuesta.data.idToken } : { tipo: 'NO_DISPONIBLE' };
  } catch (error) {
    if (google.isErrorWithCode(error) && error.code === google.statusCodes.IN_PROGRESS) return { tipo: 'EN_CURSO' };
    return { tipo: 'NO_DISPONIBLE' };
  }
}
