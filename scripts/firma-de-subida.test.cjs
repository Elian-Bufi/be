/**
 * La firma del release desde el entorno (WP-GOOGLE-PLAY-PRUEBAS-INTERNAS, 2026-10-28): `apps/mobile/plugins/firma-de-subida.js`.
 *
 * - Sobre el `app/build.gradle` de la plantilla de Expo (la que `expo prebuild` genera), el plugin agrega un
 *   `signingConfigs.release` que lee las variables BE_FIRMA_* y hace que el buildType release lo use solo si
 *   BE_FIRMA_KEYSTORE existe; sin la variable, queda la firma de debug de la plantilla.
 * - No escribe ninguna credencial en el archivo: solo nombres de variables.
 * - Es idempotente, y corta si la plantilla no tiene la forma esperada.
 *
 * **Lo que esto no prueba:** que Gradle firme el artefacto. Eso lo comprueba `scripts/aab/verificar-aab.mjs` sobre el
 * AAB construido (certificado con keytool y apksigner). Uso: node --test scripts/firma-de-subida.test.cjs
 */
const assert = require('node:assert/strict');
const test = require('node:test');

const { aplicarFirma, MARCA } = require('../apps/mobile/plugins/firma-de-subida.js');

/** El tramo de la plantilla de Expo 57 (node_modules/expo/template.tgz, package/android/app/build.gradle) que el plugin toca. */
const PLANTILLA = `android {
    namespace "com.helloworld"
    defaultConfig {
        applicationId "com.helloworld"
        versionCode 1
    }
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug
            def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'false'
            shrinkResources enableShrinkResources.toBoolean()
        }
    }
}
`;

test('agrega la firma desde el entorno y la usa en release solo si BE_FIRMA_KEYSTORE existe', () => {
  const salida = aplicarFirma(PLANTILLA);
  assert.match(salida, /signingConfigs \{\n\s+\/\/ BE: la firma del release sale del entorno/);
  assert.match(salida, /if \(System\.getenv\("BE_FIRMA_KEYSTORE"\)\) \{\n\s+release \{\n\s+storeFile file\(System\.getenv\("BE_FIRMA_KEYSTORE"\)\)/);
  assert.match(salida, /keyPassword System\.getenv\("BE_FIRMA_KEY_PASSWORD"\)/);
  // El release usa la firma del entorno si está, y si no la de debug; el debug no cambia.
  assert.match(salida, /release \{\n(?:.*\n)*?\s+signingConfig System\.getenv\("BE_FIRMA_KEYSTORE"\) \? signingConfigs\.release : signingConfigs\.debug/);
  assert.equal((salida.match(/signingConfig signingConfigs\.debug/g) ?? []).length, 1, 'queda solo el del buildType debug');
  // Todo lo demás de la plantilla sigue ahí.
  assert.ok(salida.includes("storeFile file('debug.keystore')"));
  assert.ok(salida.includes('shrinkResources enableShrinkResources.toBoolean()'));
});

test('no escribe credenciales: solo nombres de variables', () => {
  const salida = aplicarFirma(PLANTILLA);
  for (const variable of ['BE_FIRMA_KEYSTORE', 'BE_FIRMA_KEYSTORE_PASSWORD', 'BE_FIRMA_KEY_ALIAS', 'BE_FIRMA_KEY_PASSWORD']) assert.ok(salida.includes(`System.getenv("${variable}")`), variable);
  assert.doesNotMatch(salida, /storePassword ['"](?!android['"])/, 'ninguna contraseña literal que no sea la de debug de la plantilla');
  assert.equal(MARCA, 'BE_FIRMA_KEYSTORE');
});

test('es idempotente y corta si la plantilla cambió de forma', () => {
  const unaVez = aplicarFirma(PLANTILLA);
  assert.equal(aplicarFirma(unaVez), unaVez);
  assert.throws(() => aplicarFirma(PLANTILLA.replace('signingConfigs {\n', 'firmas {\n')), /signingConfigs/);
  assert.throws(() => aplicarFirma(PLANTILLA.replace(/release \{\n(\s+\/\/ Caution[\s\S]*?)signingConfig signingConfigs\.debug/, 'release {\n$1signingConfig signingConfigs.otra')), /signingConfigs\.debug/);
});
