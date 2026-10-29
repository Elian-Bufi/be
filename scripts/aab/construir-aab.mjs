#!/usr/bin/env node
/**
 * Construye un Android App Bundle (AAB) de BE en esta máquina, con el mismo procedimiento con que se construyen las APK
 * desde la 0.11.1 (EVIDENCIA/HISTORIAL-ENTRENAMIENTO/build-local-0.11.1.md; EVIDENCIA/PUBLICACION-0.18.0-candidata.1),
 * cambiando `assembleRelease` por `:app:bundleRelease`. WP-GOOGLE-PLAY-PRUEBAS-INTERNAS (2026-10-28).
 *
 *   node scripts/aab/construir-aab.mjs [--ambiente test] [--salida C:/Users/bufim/BE-artefactos/aab]
 *        [--respaldo C:/Users/bufim/be-firma-respaldo] [--datos C:/Users/bufim/BE-datos-locales] [--sin-prebuild]
 *        [--permitir-sucio] [--sin-google] [--sin-firebase] [--sin-firma]
 *
 * - Se niega a construir con cambios sin confirmar en apps/mobile o packages/domain (el commit no describiría lo
 *   construido) salvo `--permitir-sucio`, y deja `arbolLimpio` en esperado.json: el verificador lo exige en true.
 * - Se niega a construir sin google-services.json o sin el client ID web salvo `--sin-firebase` / `--sin-google`, y deja
 *   `sinFirebaseAProposito` / `sinGoogleAProposito` en esperado.json: una app sin avisos o sin «Continuar con Google»
 *   por un archivo que faltó no puede pasar por una construida así a propósito.
 * - El ambiente sale del perfil de `apps/mobile/eas.json` (por omisión `test`: la API y el website de test, como todas las
 *   APK publicadas). `EAS_BUILD_GIT_COMMIT_HASH` es el commit construido y `NODE_ENV=production`, como hace EAS.
 * - Firebase (`google-services.json`) y el client ID web de Google salen de la carpeta de datos locales, fuera del repo.
 * - La firma: lee `credentials.json` del respaldo (el formato de EAS: android.keystore.{keystorePath, keystorePassword,
 *   keyAlias, keyPassword}) y pasa los valores a Gradle SOLO por el entorno del proceso hijo (BE_FIRMA_*), que el plugin
 *   `plugins/firma-de-subida.js` lee. Nunca los imprime ni los escribe en un archivo. Qué keystore va ahí (la de EAS, o una
 *   clave de subida aparte) lo decide quien construye: este script no genera ni reemplaza ninguna clave.
 * - `--sin-firma` (2026-10-29): no lee ningún respaldo y construye el AAB SIN firma (`BE_SIN_FIRMA=1`, que el plugin
 *   convierte en `signingConfig null`); así lo construye GitHub Actions (.github/workflows/aab-sin-firma.yml), que no
 *   tiene la keystore, y después se firma en la máquina de Dirección con scripts/aab/firmar-aab.mjs. El archivo lleva
 *   `-sin-firma` en el nombre. Corre también en Linux (gradlew, separador del PATH).
 * - Gradle con un solo worker y sin demonio: la máquina de Dirección tiene poca memoria.
 * - El artefacto queda FUERA del repositorio (--salida), con su SHA-256 y un `construccion.json` sin secretos.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, copyFileSync, createHash, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from './soporte.mjs';
import { freemem, totalmem } from 'node:os';
import { basename, delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const MOVIL = join(RAIZ, 'apps', 'mobile');
const ANDROID = join(MOVIL, 'android');

/** La huella SHA-256 del certificado de la keystore de EAS, la que firma todas las APK publicadas (EVIDENCIA/PUBLICACION-*). */
const CERTIFICADO_DE_EAS = '61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06';

const opciones = leerOpciones(process.argv.slice(2), {
  ambiente: 'test',
  salida: 'C:/Users/bufim/BE-artefactos/aab',
  respaldo: 'C:/Users/bufim/be-firma-respaldo',
  datos: 'C:/Users/bufim/BE-datos-locales',
  'sin-prebuild': false,
  'permitir-sucio': false,
  'sin-google': false,
  'sin-firebase': false,
  'sin-firma': false,
  // Lo que el verificador va a exigir del artefacto. Mientras no exista una clave de subida aparte, el AAB se firma con
  // la keystore de EAS y las dos huellas son la misma; con la clave de subida, --cert-subida pasa a ser la suya.
  'cert-subida': CERTIFICADO_DE_EAS,
  'cert-firma-app': CERTIFICADO_DE_EAS,
});

const JAVA_HOME = process.env.JAVA_HOME || 'C:/Program Files/Android/Android Studio/jbr';
const ANDROID_HOME = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk');
for (const [nombre, ruta] of [
  ['JAVA_HOME', JAVA_HOME],
  ['ANDROID_HOME', ANDROID_HOME],
]) {
  if (!existsSync(ruta)) throw new Error(`${nombre} no existe: ${ruta}`);
}

const comienzo = Date.now();
const avisar = (t) => process.stdout.write(`[aab] ${new Date().toISOString().slice(11, 19)} ${t}\n`);

// 1. El commit y la versión que se construyen.
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: RAIZ, encoding: 'utf8' }).trim();
const rama = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: RAIZ, encoding: 'utf8' }).trim();
const sucio = execFileSync('git', ['status', '--porcelain', '--', 'apps/mobile', 'packages/domain'], { cwd: RAIZ, encoding: 'utf8' }).trim();
if (sucio && !opciones['permitir-sucio']) throw new Error(`hay cambios sin confirmar en apps/mobile o packages/domain y el commit no describiría lo construido (confirmalos, o --permitir-sucio para una prueba que no se sube):\n${sucio}`);
if (sucio) avisar(`ATENCIÓN (--permitir-sucio): hay cambios sin confirmar; esperado.json llevará arbolLimpio: false y el verificador no dará «todo bien»:\n${sucio}`);
const arbolLimpio = !sucio;
const configuracion = readFileSync(join(MOVIL, 'app.config.ts'), 'utf8');
const version = /const VERSION = '([^']+)'/.exec(configuracion)?.[1];
const versionCode = Number(/versionCode: (\d+)/.exec(configuracion)?.[1]);
const paquete = /package: '([^']+)'/.exec(configuracion)?.[1];
if (!version || !Number.isInteger(versionCode) || !paquete) throw new Error('no pude leer VERSION, versionCode y package de apps/mobile/app.config.ts');
avisar(`commit ${commit.slice(0, 7)} (${rama}) · versión ${version} · versionCode ${versionCode} · ambiente ${opciones.ambiente}`);

// 2. El entorno del perfil (eas.json), Firebase y Google, y la memoria disponible.
const perfiles = JSON.parse(readFileSync(join(MOVIL, 'eas.json'), 'utf8')).build;
const perfil = perfiles[opciones.ambiente];
if (!perfil) throw new Error(`el perfil «${opciones.ambiente}» no está en apps/mobile/eas.json`);
for (const clave of ['APP_ENV', 'API_BASE_URL', 'WEB_BASE_URL']) if (!perfil.env?.[clave]) throw new Error(`el perfil «${opciones.ambiente}» no define ${clave}: la app quedaría sin API o sin App Link`);
const googleServices = join(opciones.datos, 'firebase', 'google-services.json');
const clientIds = join(opciones.datos, 'google', 'client-ids.env');
const entornoDeLaApp = {
  ...perfil.env,
  EAS_BUILD_GIT_COMMIT_HASH: commit,
  NODE_ENV: 'production',
  ...(existsSync(googleServices) ? { GOOGLE_SERVICES_JSON: googleServices } : {}),
  ...(existsSync(clientIds) ? { GOOGLE_WEB_CLIENT_ID: valorDe(clientIds, 'GOOGLE_WEB_CLIENT_ID') } : {}),
};
const firebaseProjectId = entornoDeLaApp.GOOGLE_SERVICES_JSON ? (JSON.parse(readFileSync(googleServices, 'utf8')).project_info?.project_id ?? null) : null;
if (!entornoDeLaApp.GOOGLE_SERVICES_JSON && !opciones['sin-firebase']) throw new Error(`falta ${googleServices}: la app quedaría sin avisos push. Si es a propósito, --sin-firebase`);
if (!entornoDeLaApp.GOOGLE_WEB_CLIENT_ID && !opciones['sin-google']) throw new Error(`falta GOOGLE_WEB_CLIENT_ID en ${clientIds}: la app quedaría sin «Continuar con Google». Si es a propósito, --sin-google`);
if (entornoDeLaApp.GOOGLE_SERVICES_JSON && !firebaseProjectId) throw new Error('google-services.json no tiene project_info.project_id');
if (opciones['sin-firebase'] && entornoDeLaApp.GOOGLE_SERVICES_JSON) throw new Error('--sin-firebase, pero google-services.json está: sacá una de las dos cosas');
if (opciones['sin-google'] && entornoDeLaApp.GOOGLE_WEB_CLIENT_ID) throw new Error('--sin-google, pero GOOGLE_WEB_CLIENT_ID está: sacá una de las dos cosas');
if (opciones['sin-firebase']) avisar('--sin-firebase: la app se construye sin avisos push, a propósito');
if (opciones['sin-google']) avisar('--sin-google: la app se construye sin «Continuar con Google», a propósito');
const libreMb = Math.round(freemem() / 1024 ** 2);
avisar(`memoria libre ${libreMb} MB de ${Math.round(totalmem() / 1024 ** 2)} MB`);
if (libreMb < 700) avisar('ATENCIÓN: menos de 700 MB libres; Gradle puede fallar por memoria (pasó en la 0.11.3)');

// 3. La firma, solo en el entorno del proceso hijo; o ninguna, con --sin-firma.
const sinFirma = opciones['sin-firma'];
let keystore = null;
let entornoDeFirma = { BE_SIN_FIRMA: '1' };
if (sinFirma) {
  avisar('--sin-firma: el AAB sale SIN firma, a propósito; se firma aparte con scripts/aab/firmar-aab.mjs');
} else {
  const credenciales = JSON.parse(readFileSync(join(opciones.respaldo, 'credentials.json'), 'utf8')).android?.keystore;
  if (!credenciales?.keystorePath || !credenciales.keystorePassword || !credenciales.keyAlias || !credenciales.keyPassword) throw new Error('credentials.json no tiene android.keystore completo');
  keystore = resolve(opciones.respaldo, credenciales.keystorePath);
  if (!existsSync(keystore)) throw new Error(`la keystore no existe: ${keystore}`);
  entornoDeFirma = {
    BE_FIRMA_KEYSTORE: keystore,
    BE_FIRMA_KEYSTORE_PASSWORD: credenciales.keystorePassword,
    BE_FIRMA_KEY_ALIAS: credenciales.keyAlias,
    BE_FIRMA_KEY_PASSWORD: credenciales.keyPassword,
  };
  avisar(`firma: ${basename(keystore)} del respaldo (el certificado se comprueba después, con verificar-aab.mjs)`);
}

const entornoHijo = {
  ...process.env,
  ...entornoDeLaApp,
  ...entornoDeFirma,
  JAVA_HOME,
  ANDROID_HOME,
  ANDROID_SDK_ROOT: ANDROID_HOME,
  PATH: `${join(JAVA_HOME, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
};
// Sin firma, que ninguna variable de firma heredada del entorno se cuele; con firma, que no quede BE_SIN_FIRMA heredada.
if (sinFirma) for (const v of ['BE_FIRMA_KEYSTORE', 'BE_FIRMA_KEYSTORE_PASSWORD', 'BE_FIRMA_KEY_ALIAS', 'BE_FIRMA_KEY_PASSWORD']) delete entornoHijo[v];
else delete entornoHijo.BE_SIN_FIRMA;

// 4. El dominio compartido (el gancho eas-build-post-install) y el proyecto Android generado.
correr('npm', ['run', 'build:domain'], RAIZ, entornoHijo, 'build:domain');
if (!opciones['sin-prebuild']) {
  correr('npx', ['expo', 'prebuild', '--platform', 'android', '--no-install', '--clean'], MOVIL, entornoHijo, 'expo prebuild');
  // Un solo worker, sin demonio y con la memoria acotada: la máquina de Dirección (build-local-0.11.1.md, paso 6).
  appendFileSync(
    join(ANDROID, 'gradle.properties'),
    '\n# BE (scripts/aab/construir-aab.mjs): poca memoria, un worker, sin demonio.\norg.gradle.jvmargs=-Xmx2560m -XX:MaxMetaspaceSize=512m\norg.gradle.workers.max=1\norg.gradle.parallel=false\norg.gradle.daemon=false\nkotlin.daemon.jvmargs=-Xmx1024m\n',
  );
  const gradle = readFileSync(join(ANDROID, 'app', 'build.gradle'), 'utf8');
  if (!gradle.includes('BE_FIRMA_KEYSTORE')) throw new Error('el plugin firma-de-subida no escribió la firma en android/app/build.gradle');
  avisar('prebuild listo: la firma desde el entorno está en app/build.gradle');
}

// 5. El App Bundle.
correr(join(ANDROID, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew'), [':app:bundleRelease', '--no-daemon', '--max-workers=1'], ANDROID, entornoHijo, 'gradle :app:bundleRelease');
const construido = join(ANDROID, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
if (!existsSync(construido)) throw new Error(`Gradle terminó pero no está ${construido}`);

// 6. Afuera del repositorio, con su huella y su registro.
const carpeta = join(opciones.salida, version);
mkdirSync(carpeta, { recursive: true });
const nombre = `be-${version}-${commit.slice(0, 7)}${sinFirma ? '-sin-firma' : ''}.aab`;
const destino = join(carpeta, nombre);
copyFileSync(construido, destino);
const sha256 = createHash('sha256').update(readFileSync(destino)).digest('hex');
writeFileSync(join(carpeta, `${nombre}.sha256`), `${sha256}  ${nombre}\n`);
const registro = {
  artefacto: destino,
  sha256,
  bytes: statSync(destino).size,
  version,
  versionCode,
  commit,
  rama,
  cambiosSinConfirmar: sucio ? sucio.split('\n') : [],
  ambiente: { perfil: opciones.ambiente, APP_ENV: perfil.env.APP_ENV, API_BASE_URL: perfil.env.API_BASE_URL, WEB_BASE_URL: perfil.env.WEB_BASE_URL },
  firebase: Boolean(entornoDeLaApp.GOOGLE_SERVICES_JSON),
  googleWebClientId: Boolean(entornoDeLaApp.GOOGLE_WEB_CLIENT_ID),
  firma: sinFirma ? { sinFirma: true, nota: 'construido sin firma (--sin-firma); se firma aparte con scripts/aab/firmar-aab.mjs' } : { keystore: basename(keystore), origen: opciones.respaldo, nota: 'alias y contraseñas solo en el entorno del proceso de Gradle; el certificado lo registra verificar-aab.mjs' },
  maquina: { sistema: process.platform, actions: process.env.GITHUB_ACTIONS === 'true' ? { corrida: process.env.GITHUB_RUN_ID ?? null, intento: process.env.GITHUB_RUN_ATTEMPT ?? null, sha: process.env.GITHUB_SHA ?? null } : null },
  herramientas: { node: process.version, javaHome: JAVA_HOME, androidHome: ANDROID_HOME, gradle: 'wrapper de la plantilla de Expo', workers: 1, demonio: false, jvm: '-Xmx2560m' },
  memoriaLibreMbAlEmpezar: libreMb,
  construidoEn: new Date().toISOString(),
  minutos: Math.round((Date.now() - comienzo) / 60_000),
};
writeFileSync(join(carpeta, 'construccion.json'), `${JSON.stringify(registro, null, 2)}\n`);
// Lo esperado del artefacto, a partir de las FUENTES de esta construcción (no del artefacto): lo exige verificar-aab.mjs.
const esperado = {
  paquete,
  version,
  versionCode,
  commit,
  arbolLimpio,
  appEnv: perfil.env.APP_ENV,
  apiBaseUrl: perfil.env.API_BASE_URL,
  webBaseUrl: perfil.env.WEB_BASE_URL,
  googleWebClientId: entornoDeLaApp.GOOGLE_WEB_CLIENT_ID ?? null,
  sinGoogleAProposito: opciones['sin-google'],
  firebaseProjectId,
  sinFirebaseAProposito: opciones['sin-firebase'],
  certSubidaSha256: opciones['cert-subida'],
  certFirmaAppSha256: opciones['cert-firma-app'],
  // Informativo: el verificador exige la firma igual; un AAB construido sin firma da «todo bien» recién después de firmar.
  firmadoAlConstruir: !sinFirma,
};
writeFileSync(join(carpeta, 'esperado.json'), `${JSON.stringify(esperado, null, 2)}\n`);
avisar(`listo: ${destino} (${registro.bytes} bytes, sha256 ${sha256.slice(0, 16)}…) en ${registro.minutos} min`);
if (sinFirma) avisar(`firmar: node scripts/aab/firmar-aab.mjs "${destino}" --respaldo <carpeta del respaldo>`);
else avisar(`verificar: node scripts/aab/verificar-aab.mjs "${destino}" --esperado "${join(carpeta, 'esperado.json')}"`);

// ─── ayudas ──────────────────────────────────────────────────────────────────────────────────

function correr(comando, args, cwd, env, que) {
  avisar(`${que} …`);
  const t0 = Date.now();
  const r = spawnSync(comando, args, { cwd, env, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) throw new Error(`${que} terminó con código ${r.status}`);
  avisar(`${que}: ${Math.round((Date.now() - t0) / 1000)} s`);
}

function valorDe(archivoEnv, clave) {
  const linea = readFileSync(archivoEnv, 'utf8')
    .split('\n')
    .find((l) => l.startsWith(`${clave}=`));
  return linea ? linea.slice(clave.length + 1).trim().replace(/^["']|["']$/g, '') : undefined;
}

function leerOpciones(argv, porOmision) {
  const o = { ...porOmision };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) throw new Error(`opción desconocida: ${a}`);
    const clave = a.slice(2);
    if (!(clave in o)) throw new Error(`opción desconocida: ${a}`);
    if (typeof o[clave] === 'boolean') o[clave] = true;
    else o[clave] = argv[++i];
  }
  return o;
}
