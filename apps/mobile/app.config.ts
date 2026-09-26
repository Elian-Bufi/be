import type { ExpoConfig } from 'expo/config';

/**
 * Identidad del APK (07 §34, RNF-PORT-001, TEST-APK-008): versión + commit + ambiente visibles en la app.
 * EAS_BUILD_GIT_COMMIT_HASH lo provee EAS durante el build; APP_ENV y API_BASE_URL vienen del perfil de eas.json.
 * Ningún secreto se embebe en el APK (08 §32).
 */
const VERSION = '0.11.1';

/** El fondo navy del tema oscuro (src/tema.ts): detrás de la app mientras carga y detrás del ícono adaptativo. */
const FONDO = '#04213F';

const config: ExpoConfig = {
  name: 'BE',
  slug: 'be',
  owner: 'elianbufi',
  version: VERSION,
  orientation: 'portrait',
  icon: './assets/icon.png',
  // La APK usa el tema oscuro de las referencias de Dirección del 2026-09-21 (docs/paquetes/WP-IDENTIDAD-VISUAL.md).
  userInterfaceStyle: 'dark',
  backgroundColor: FONDO,
  android: {
    package: 'com.elianbufi.be',
    versionCode: 14,
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: FONDO,
    },
    predictiveBackGestureEnabled: false,
  },
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
