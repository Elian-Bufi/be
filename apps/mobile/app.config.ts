import type { ExpoConfig } from 'expo/config';

/**
 * Identidad del APK (07 §34, RNF-PORT-001, TEST-APK-008): versión + commit + ambiente visibles en la app.
 * EAS_BUILD_GIT_COMMIT_HASH lo provee EAS durante el build; APP_ENV y API_BASE_URL vienen del perfil de eas.json.
 * Ningún secreto se embebe en el APK (08 §32).
 */
const VERSION = '0.1.0';

const config: ExpoConfig = {
  name: 'BE',
  slug: 'be',
  version: VERSION,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  android: {
    package: 'com.elianbufi.be',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#ffffff',
    },
    predictiveBackGestureEnabled: false,
  },
  extra: {
    appEnv: process.env.APP_ENV ?? 'development',
    apiBaseUrl: process.env.API_BASE_URL ?? null,
    commit: process.env.EAS_BUILD_GIT_COMMIT_HASH ?? null,
    construidoEn: new Date().toISOString(),
    ...(process.env.EAS_PROJECT_ID ? { eas: { projectId: process.env.EAS_PROJECT_ID } } : {}),
  },
};

export default config;
