import type { ExpoConfig } from 'expo/config';

/**
 * Identidad del APK (07 §34, RNF-PORT-001, TEST-APK-008): versión + commit + ambiente visibles en la app.
 * EAS_BUILD_GIT_COMMIT_HASH lo provee EAS durante el build; APP_ENV y API_BASE_URL vienen del perfil de eas.json.
 * Ningún secreto se embebe en el APK (08 §32).
 */
const VERSION = '0.13.2';

/** El fondo de Azul noche (src/tema.ts, tema predeterminado): detrás de la app mientras carga y detrás del ícono adaptativo. */
const FONDO = '#011325';

const config: ExpoConfig = {
  name: 'BE',
  slug: 'be',
  owner: 'elianbufi',
  version: VERSION,
  orientation: 'portrait',
  icon: './assets/icon.png',
  // Azul noche es el tema predeterminado; Claro se elige en Cuenta (src/apariencia.tsx). Los diálogos del sistema
  // quedan oscuros en los dos.
  userInterfaceStyle: 'dark',
  backgroundColor: FONDO,
  android: {
    package: 'com.elianbufi.be',
    versionCode: 22,
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: FONDO,
    },
    predictiveBackGestureEnabled: false,
  },
  // DL-012 (decisión del 2026-10-03): la credencial de la sesión va al almacenamiento seguro. El plugin la deja fuera
  // del respaldo automático de Android. No se usa biometría: sin el permiso de Face ID.
  plugins: [['expo-secure-store', { configureAndroidBackup: true, faceIDPermission: false }]],
  extra: {
    appEnv: process.env.APP_ENV ?? 'development',
    apiBaseUrl: process.env.API_BASE_URL ?? null,
    commit: process.env.EAS_BUILD_GIT_COMMIT_HASH ?? null,
    construidoEn: new Date().toISOString(),
    // Identificador público del proyecto en EAS (no es un secreto).
    eas: { projectId: '8ef1d1f5-76e3-4d2b-b305-b07146e97f77' },
  },
};

export default config;
