/**
 * Plugin de Expo: qué entra en el respaldo y en las transferencias de Android (precierre del 2026-10-06, §4).
 *
 * **Qué hay en el teléfono, por archivo** (una clave de JavaScript no es un archivo que se pueda excluir):
 * - `databases/RKStorage` (y sus `-journal`, `-wal` y `-shm`): la base SQLite de AsyncStorage 2.2.0, sin «next
 *   storage». Guarda el tema, la figura elegida, el ancla del reloj desde el arranque y, cifrado, el entrenamiento en
 *   curso de cada cuenta (`src/almacen-cifrado.ts`);
 * - `shared_prefs/SecureStore.xml`: expo-secure-store, con la credencial de la sesión y la clave de cifrado del
 *   entrenamiento de cada cuenta, cifradas con el Keystore. Esas claves del Keystore nunca salen del teléfono: una copia
 *   restaurada en otro teléfono no se podría descifrar.
 *
 * **Las reglas** (https://developer.android.com/identity/data/autobackup):
 * - Android 11 o anterior, `android:fullBackupContent`; Android 12 o posterior, `android:dataExtractionRules`, con
 *   `<cloud-backup>` y `<device-transfer>`. Una sección que falta deja ese modo abierto para todo, y en Android 12 o
 *   posterior `allowBackup="false"` no frena las transferencias entre dispositivos en algunos fabricantes: por eso van
 *   las dos secciones, explícitas.
 * - Solo se incluyen las preferencias de la plataforma (`<include domain="sharedpref" path="."/>`): con un `<include>`,
 *   Android respalda solamente lo incluido, así que la base de AsyncStorage (`databases/RKStorage` con sus `-journal`,
 *   `-wal` y `-shm`) y los archivos de la app quedan fuera: ningún archivo del dominio `database` entra.
 * - Dentro de lo incluido, se excluye por nombre el almacenamiento seguro: `SecureStore.xml` (y `SecureStore`, como lo
 *   nombra expo-secure-store).
 * - **Una exclusión solo puede nombrar algo incluido.** Excluir `RKStorage`, que no está en ningún `<include>`, es el error
 *   fatal `FullBackupContent` de lint al compilar la versión release (lo encontró la construcción de la 0.15.0-candidata.1):
 *   la exclusión no hace falta, porque la base ya queda fuera.
 * - No hay `<cross-platform-transfer>`: BE no tiene una app para iOS que reciba datos.
 *
 * Reemplaza las reglas del plugin de expo-secure-store (que en `app.config.ts` va con `configureAndroidBackup: false`)
 * y conserva su exclusión. Lo sincronizado con el servicio se recupera desde la API; lo que no se envió no viaja en
 * ningún respaldo: la app lo dice con sus estados (`src/textos-del-guardado.ts`).
 */
const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const ARCHIVO_DE_RESPALDO = 'be_reglas_de_respaldo';
const ARCHIVO_DE_EXTRACCION = 'be_reglas_de_extraccion';

/** Lo que se incluye: solo las preferencias de la plataforma. */
const INCLUSIONES = [['sharedpref', '.']];
/** Lo que se excluye por nombre dentro de lo incluido: el almacenamiento seguro. */
const EXCLUSIONES = [
  ['sharedpref', 'SecureStore.xml'],
  ['sharedpref', 'SecureStore'],
];

const reglas = (sangria) =>
  [...INCLUSIONES.map(([dominio, ruta]) => `${sangria}<include domain="${dominio}" path="${ruta}"/>`), ...EXCLUSIONES.map(([dominio, ruta]) => `${sangria}<exclude domain="${dominio}" path="${ruta}"/>`)].join('\n');

/** Android 11 o anterior. */
const XML_DE_RESPALDO = `<?xml version="1.0" encoding="utf-8"?>
<!-- BE: respaldo de Android 11 o anterior. Solo preferencias de la plataforma; nada de AsyncStorage ni del almacenamiento seguro. -->
<full-backup-content>
${reglas('  ')}
</full-backup-content>
`;

/** Android 12 o posterior: el respaldo en la nube y la transferencia entre dispositivos, cada uno explícito. */
const XML_DE_EXTRACCION = `<?xml version="1.0" encoding="utf-8"?>
<!-- BE: respaldo y transferencia de Android 12 o posterior. Las dos secciones son explícitas: una que falta queda abierta. -->
<data-extraction-rules>
  <cloud-backup>
${reglas('    ')}
  </cloud-backup>
  <device-transfer>
${reglas('    ')}
  </device-transfer>
</data-extraction-rules>
`;

function conReglasDeRespaldo(config) {
  config = withAndroidManifest(config, (c) => {
    const aplicacion = AndroidConfig.Manifest.getMainApplicationOrThrow(c.modResults);
    aplicacion.$['android:fullBackupContent'] = `@xml/${ARCHIVO_DE_RESPALDO}`;
    aplicacion.$['android:dataExtractionRules'] = `@xml/${ARCHIVO_DE_EXTRACCION}`;
    return c;
  });
  return withDangerousMod(config, [
    'android',
    async (c) => {
      const carpeta = path.join(c.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(carpeta, { recursive: true });
      fs.writeFileSync(path.join(carpeta, `${ARCHIVO_DE_RESPALDO}.xml`), XML_DE_RESPALDO);
      fs.writeFileSync(path.join(carpeta, `${ARCHIVO_DE_EXTRACCION}.xml`), XML_DE_EXTRACCION);
      return c;
    },
  ]);
}

module.exports = conReglasDeRespaldo;
module.exports.XML_DE_RESPALDO = XML_DE_RESPALDO;
module.exports.XML_DE_EXTRACCION = XML_DE_EXTRACCION;
module.exports.INCLUSIONES = INCLUSIONES;
module.exports.EXCLUSIONES = EXCLUSIONES;
