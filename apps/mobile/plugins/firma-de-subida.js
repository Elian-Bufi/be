/**
 * Plugin de Expo: la firma del release, desde el entorno (WP-GOOGLE-PLAY-PRUEBAS-INTERNAS, 2026-10-28).
 *
 * Hasta ahora, en cada construcción local se agregaba a mano un `signingConfigs.release` al `android/app/build.gradle`
 * generado, y `expo prebuild --clean` lo borraba (EVIDENCIA/HISTORIAL-ENTRENAMIENTO/build-local-0.11.1.md, paso 6). Este
 * plugin escribe ese mismo bloque en cada prebuild, para la APK (`assembleRelease`) y para el App Bundle
 * (`:app:bundleRelease`). No contiene ninguna credencial: lee, en el momento de compilar, las variables de entorno
 * `BE_FIRMA_KEYSTORE` (ruta de la keystore), `BE_FIRMA_KEYSTORE_PASSWORD`, `BE_FIRMA_KEY_ALIAS` y `BE_FIRMA_KEY_PASSWORD`.
 * Sin `BE_FIRMA_KEYSTORE`, el release queda como en la plantilla de Expo: firmado con la clave de debug (que Google Play
 * rechaza), así que no hay forma de firmar «sin querer» con una clave que no se eligió.
 *
 * Con `BE_SIN_FIRMA=1` (y sin `BE_FIRMA_KEYSTORE`), el release queda SIN firma: así lo construye GitHub Actions, que no
 * tiene ni debe tener la keystore, y se firma después en la máquina de Dirección con scripts/aab/firmar-aab.mjs
 * (2026-10-29). Un AAB sin firma no se puede instalar ni subir: no hay forma de que salga así por error.
 *
 * Qué clave va en esas variables lo decide quien construye: la keystore de EAS (la que firma todas las APK publicadas;
 * respaldo en la máquina de Dirección) o, para subir a Google Play con una clave de subida aparte, esa clave de subida.
 * Ver docs/paquetes/GOOGLE-PLAY-PRUEBAS-INTERNAS-2026-10-28.md.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARCA = 'BE_FIRMA_KEYSTORE';

/** El bloque que se agrega dentro de `signingConfigs { … }`: solo existe si el entorno trae la keystore. */
const BLOQUE_DE_FIRMA = `        // BE: la firma del release sale del entorno (plugins/firma-de-subida.js); sin BE_FIRMA_KEYSTORE, queda la de debug.
        if (System.getenv("${MARCA}")) {
            release {
                storeFile file(System.getenv("${MARCA}"))
                storePassword System.getenv("BE_FIRMA_KEYSTORE_PASSWORD")
                keyAlias System.getenv("BE_FIRMA_KEY_ALIAS")
                keyPassword System.getenv("BE_FIRMA_KEY_PASSWORD")
            }
        }
`;

const USO_EN_RELEASE = `signingConfig System.getenv("${MARCA}") ? signingConfigs.release : (System.getenv("BE_SIN_FIRMA") ? null : signingConfigs.debug)`;

/**
 * Aplica la firma al texto de `app/build.gradle` de la plantilla de Expo. Es una función pura, para poder probarla.
 * Lanza si la plantilla no tiene la forma esperada: mejor cortar el prebuild que firmar con la clave equivocada.
 */
function aplicarFirma(contenido) {
  if (contenido.includes(MARCA)) return contenido;
  const signingConfigs = contenido.indexOf('signingConfigs {\n');
  if (signingConfigs < 0) throw new Error('firma-de-subida: no encuentro `signingConfigs {` en app/build.gradle');
  const buildTypes = contenido.indexOf('buildTypes {', signingConfigs);
  if (buildTypes < 0) throw new Error('firma-de-subida: no encuentro `buildTypes {` en app/build.gradle');
  const release = contenido.indexOf('release {', buildTypes);
  if (release < 0) throw new Error('firma-de-subida: no encuentro `release {` dentro de buildTypes');
  const uso = contenido.indexOf('signingConfig signingConfigs.debug', release);
  if (uso < 0) throw new Error('firma-de-subida: el release de la plantilla no firma con signingConfigs.debug');
  const conUso = `${contenido.slice(0, uso)}${USO_EN_RELEASE}${contenido.slice(uso + 'signingConfig signingConfigs.debug'.length)}`;
  const inicioDelBloque = signingConfigs + 'signingConfigs {\n'.length;
  return `${conUso.slice(0, inicioDelBloque)}${BLOQUE_DE_FIRMA}${conUso.slice(inicioDelBloque)}`;
}

function conFirmaDeSubida(config) {
  return withAppBuildGradle(config, (c) => {
    if (c.modResults.language !== 'groovy') throw new Error('firma-de-subida: solo sé escribir el build.gradle en Groovy');
    c.modResults.contents = aplicarFirma(c.modResults.contents);
    return c;
  });
}

module.exports = conFirmaDeSubida;
module.exports.aplicarFirma = aplicarFirma;
module.exports.MARCA = MARCA;
