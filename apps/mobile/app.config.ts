import type { ExpoConfig } from 'expo/config';

/**
 * Identidad del APK (07 §34, RNF-PORT-001, TEST-APK-008): versión + commit + ambiente visibles en la app.
 * EAS_BUILD_GIT_COMMIT_HASH lo provee EAS durante el build; APP_ENV y API_BASE_URL vienen del perfil de eas.json.
 * Ningún secreto se embebe en el APK (08 §32).
 */
const VERSION = '0.17.0-candidata.1';

/** El fondo de Azul noche (src/tema.ts, tema predeterminado): detrás de la app mientras carga y detrás del ícono adaptativo. */
const FONDO = '#011325';

/**
 * WP-NOVEDADES-Y-AVISOS (DL-133): los avisos push de Android llegan por Firebase Cloud Messaging, y la APK necesita el
 * `google-services.json` del proyecto de Firebase de BE. No se versiona: el build lo toma de la ruta que diga
 * `GOOGLE_SERVICES_JSON` (fuera del repo, en la máquina de Dirección). Sin él la APK se construye igual, el centro de
 * novedades funciona, y Cuenta dice que los avisos todavía no están disponibles en esa versión.
 */
const SERVICIOS_DE_GOOGLE = process.env.GOOGLE_SERVICES_JSON?.trim() || null;

/**
 * WP-INVITACION (DL-136): el enlace de una invitación abre la APK por dos caminos.
 * - El esquema propio be://, que usa la página /invitacion del website (un enlace intent: en Android).
 * - El App Link https del website (WEB_BASE_URL, en el perfil de eas.json y en la construcción local), verificado con su
 *   /.well-known/assetlinks.json: tocar el enlace en WhatsApp abre la app directo. Sin WEB_BASE_URL, solo el esquema.
 */
const HOST_DEL_WEBSITE = process.env.WEB_BASE_URL?.trim() ? new URL(process.env.WEB_BASE_URL.trim()).host : null;

/**
 * WP-ACCESO-GOOGLE (DL-138): «Continuar con Google» aparece solo si el build tiene `GOOGLE_WEB_CLIENT_ID`, el client ID
 * «Aplicación web» de Google (el mismo del website). Con él, la APK pide el ID token que verifica la API. Es público, no
 * un secreto. Google reconoce a la APK por el paquete y la huella SHA-1 de su firma, con el client ID «Android» del mismo
 * proyecto, que no se escribe acá (docs/DESPLIEGUE.md, «Entrar con Google»). Va en el entorno de la generación y de Gradle,
 * como API_BASE_URL. Un valor con otra forma corta el build, como en la API: puede ser un secreto pegado por error, y el
 * mensaje no lo repite.
 * Sin plugin de configuración: en Android la biblioteca no lo necesita (se enlaza sola). El suyo solo configura iOS, que
 * BE no construye, o Firebase, que BE no usa para entrar.
 */
const CLIENT_ID_WEB_DE_GOOGLE = process.env.GOOGLE_WEB_CLIENT_ID?.trim() || null;
if (CLIENT_ID_WEB_DE_GOOGLE && !/^[0-9]+-[0-9a-z]+\.apps\.googleusercontent\.com$/.test(CLIENT_ID_WEB_DE_GOOGLE)) {
  throw new Error('GOOGLE_WEB_CLIENT_ID no tiene la forma de un client ID de Google (…apps.googleusercontent.com) (DL-138)');
}

/**
 * La APK pide solo lo que usa (08, minimización). Las librerías declaran estos permisos y BE no los necesita:
 * - expo-notifications (0.16.0-candidata.1) trajo el arranque del sistema, que sirve para reprogramar avisos locales,
 *   el referidor de instalación de Google Play y las insignias del ícono de quince lanzadores. BE no programa avisos
 *   locales (los avisos llegan del servidor), no lee el referidor y no pone insignias (`shouldSetBadge: false`).
 * - La ventana sobre otras apps es de las herramientas de desarrollo de React Native.
 * - La biometría es de expo-secure-store, que BE usa sin pedir la huella (DL-012).
 * Quedan los que hacen falta para recibir avisos: POST_NOTIFICATIONS, WAKE_LOCK, ACCESS_NETWORK_STATE y
 * com.google.android.c2dm.permission.RECEIVE. scripts/avisos-del-telefono.test.mjs fija la lista.
 */
const PERMISOS_QUE_BE_NO_USA = [
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.USE_BIOMETRIC',
  'android.permission.USE_FINGERPRINT',
  'com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE',
  'android.permission.READ_APP_BADGE',
  'com.anddoes.launcher.permission.UPDATE_COUNT',
  'com.htc.launcher.permission.READ_SETTINGS',
  'com.htc.launcher.permission.UPDATE_SHORTCUT',
  'com.huawei.android.launcher.permission.CHANGE_BADGE',
  'com.huawei.android.launcher.permission.READ_SETTINGS',
  'com.huawei.android.launcher.permission.WRITE_SETTINGS',
  'com.majeur.launcher.permission.UPDATE_BADGE',
  'com.oppo.launcher.permission.READ_SETTINGS',
  'com.oppo.launcher.permission.WRITE_SETTINGS',
  'com.sec.android.provider.badge.permission.READ',
  'com.sec.android.provider.badge.permission.WRITE',
  'com.sonyericsson.home.permission.BROADCAST_BADGE',
  'com.sonymobile.home.permission.PROVIDER_INSERT_BADGE',
  'me.everything.badger.permission.BADGE_COUNT_READ',
  'me.everything.badger.permission.BADGE_COUNT_WRITE',
];

const config: ExpoConfig = {
  name: 'BE',
  slug: 'be',
  owner: 'elianbufi',
  version: VERSION,
  orientation: 'portrait',
  scheme: 'be',
  icon: './assets/icon.png',
  // Azul noche es el tema predeterminado; Claro se elige en Cuenta (src/apariencia.tsx). Los diálogos del sistema
  // quedan oscuros en los dos.
  userInterfaceStyle: 'dark',
  backgroundColor: FONDO,
  android: {
    package: 'com.elianbufi.be',
    versionCode: 27,
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: FONDO,
    },
    predictiveBackGestureEnabled: false,
    blockedPermissions: PERMISOS_QUE_BE_NO_USA,
    ...(HOST_DEL_WEBSITE
      ? {
          intentFilters: [
            {
              action: 'VIEW',
              autoVerify: true,
              data: [{ scheme: 'https', host: HOST_DEL_WEBSITE, pathPrefix: '/invitacion' }],
              category: ['BROWSABLE', 'DEFAULT'],
            },
          ],
        }
      : {}),
    ...(SERVICIOS_DE_GOOGLE ? { googleServicesFile: SERVICIOS_DE_GOOGLE } : {}),
  },
  // DL-012 (decisión del 2026-10-03): la credencial de la sesión va al almacenamiento seguro. El plugin la deja fuera
  // del respaldo automático de Android. No se usa biometría: sin el permiso de Face ID.
  // WP-NUTRICION-RECETAS (DL-120): la foto de «Comí algo diferente», con la cámara o la galería. El permiso se pide al
  // tocar «Cámara» o «Galería», no al abrir la app. Sin micrófono: no se graban videos, y el permiso queda bloqueado.
  // Precierre del 2026-10-06 (§4): las reglas de respaldo y de transferencia de Android son las de
  // `plugins/respaldo-de-android.js`, que conservan la exclusión del almacenamiento seguro y suman la base de
  // AsyncStorage, con el entrenamiento en curso. Por eso expo-secure-store no configura las suyas.
  plugins: [
    ['expo-secure-store', { configureAndroidBackup: false, faceIDPermission: false }],
    './plugins/respaldo-de-android',
    [
      'expo-image-picker',
      {
        cameraPermission: 'BE usa la cámara solo cuando tocás «Cámara», para sacar la foto de una comida que registrás. La foto es privada.',
        photosPermission: 'BE abre tus fotos solo cuando tocás «Galería», para que elijas la foto de una comida que registrás. La foto es privada.',
        microphonePermission: false,
      },
    ],
    // DL-133: los avisos. El ícono es la marca en blanco con transparencia (scripts/generar-icono-de-aviso.cjs), que
    // Android tiñe con el acento; el permiso de Android 13 se pide recién al tocar «Activar avisos» en Cuenta.
    ['expo-notifications', { icon: './assets/icono-de-aviso.png', color: '#27D5F9' }],
  ],
  extra: {
    appEnv: process.env.APP_ENV ?? 'development',
    apiBaseUrl: process.env.API_BASE_URL ?? null,
    googleWebClientId: CLIENT_ID_WEB_DE_GOOGLE,
    commit: process.env.EAS_BUILD_GIT_COMMIT_HASH ?? null,
    construidoEn: new Date().toISOString(),
    // Identificador público del proyecto en EAS (no es un secreto).
    eas: { projectId: '8ef1d1f5-76e3-4d2b-b305-b07146e97f77' },
  },
};

export default config;
