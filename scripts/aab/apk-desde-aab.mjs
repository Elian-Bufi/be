#!/usr/bin/env node
/**
 * Arma, en la máquina de Dirección, la APK universal de BE a partir de un AAB YA FIRMADO Y VERIFICADO, la firma con
 * apksigner (solo el esquema v2) y la verifica. WP-GOOGLE-PLAY-PRUEBAS-INTERNAS (2026-11-02, ruta A).
 *
 *   node scripts/aab/apk-desde-aab.mjs <be-….aab> --verificacion <verificacion.json> --referencia <APK instalada>
 *        --respaldo <carpeta con credentials.json> [--esperado <esperado.json>] [--salida <carpeta>]
 *        [--cert <SHA-256>] [--cert-sha1 <SHA-1>] [--memoria-minima <MB>]
 *   node scripts/aab/apk-desde-aab.mjs <be-….aab> --verificacion <…> --referencia <…> --clave-de-prueba --salida <carpeta>
 *
 * Para qué: instalar en el teléfono una versión nueva ENCIMA de la que ya tiene (la referencia), sin pasar por Google
 * Play. Android solo lo acepta si la APK nueva está firmada con el mismo certificado (el de EAS) y tiene un versionCode
 * mayor; el App Link de las invitaciones y «Continuar con Google» también dependen de ese certificado.
 *
 * - Exige el AAB firmado (sin «-sin-firma»), su verificacion.json (la de verificar-aab.mjs) en «todo bien», con cada
 *   comprobación en true, la misma SHA-256 y el mismo tamaño, y que esperado.json (por omisión, el de la carpeta del
 *   AAB) sea el mismo que se verificó.
 * - Antes de lo pesado: lee el certificado de la clave con keytool (tiene que ser el esperado) y mira la referencia
 *   (aapt2 y `apksigner verify`; con firma real, tiene que estar firmada con el mismo certificado). Si hay menos memoria
 *   libre que --memoria-minima (1200 MB por omisión), no arranca.
 * - `bundletool build-apks --mode=universal` (java -Xmx768m) con una carpeta personal vacía, para que bundletool NO
 *   firme la universal con la clave de debug de la PC: así la única firma es la de apksigner.
 * - Firma con `java -Xmx512m -jar build-tools/36.0.0/lib/apksigner.jar` (sin el .bat, para no pasar por un shell):
 *   v1, v3 y v4 apagados y v2 prendido, como la APK que hoy está en el teléfono. Las contraseñas viajan solo en el
 *   entorno del proceso hijo (`--ks-pass env:…`, `--key-pass env:…`); el alias va como argumento. Nada de eso se
 *   imprime ni se escribe: lo que se muestra de apksigner y keytool va con esos valores tapados.
 * - Verifica la APK firmada: `apksigner verify -v --print-certs` (verifica, solo v2, un firmante, la SHA-256 y la SHA-1
 *   esperadas; con firma real, además la certFirmaAppSha256 del esperado), el bloque de firma presente y ningún bloque
 *   v1 en META-INF; mismas entradas, con el mismo CRC-32 y tamaño, que la universal antes de firmar (salvo los archivos
 *   de firma de META-INF); `aapt2 dump badging` (paquete, versión, versionCode mayor que el de la referencia, los
 *   mismos permisos y ABI que la referencia); `aapt2 dump xmltree` del manifiesto (el App Link https://<website>
 *   /invitacion con autoVerify y el esquema `be`); los recursos de Firebase; `assets/app.config` contra el esperado;
 *   `zipalign -c -P 16 -v 4` (todas las bibliotecas sin comprimir y alineadas a 16 KB) y, con todo descomprimido,
 *   `buscarCredenciales` (con firma real, también los valores literales de las contraseñas del respaldo). Descomprime
 *   con `extraerZip` (scripts/aab/zip.mjs) y no con tar: en Windows, tar pisaría los recursos cuyos nombres solo
 *   difieren en mayúsculas y quedarían archivos sin revisar.
 * - Nunca pisa un archivo: si ya están la APK, su .sha256, el registro o un `.firmando` de una corrida cortada, no
 *   arranca; la APK firmada se copia a su nombre final con COPYFILE_EXCL y los registros se escriben con `wx`. Si todo
 *   dio bien deja be-<versión>-<sha7>.apk, su .sha256 (con dos espacios, para `sha256sum -c`) y apk.json (sin
 *   secretos). Si algo falló, borra la APK y deja apk-fallida-<fecha>.json. Sale con 0 solo si todo dio bien (1 si
 *   falló algo, 2 si faltan datos para empezar).
 *
 * --clave-de-prueba: ensayo con la clave de debug de Android de esta PC (~/.android/debug.keystore, alias
 * androiddebugkey, contraseña android: los valores públicos que trae toda instalación del SDK, no secretos). Espera el
 * certificado de esa clave en lugar del de EAS, exige que la universal haya salido de bundletool sin firma (si no, el
 * ensayo no distinguiría la firma de apksigner de la de bundletool) y pide --salida, que no puede ser la carpeta del
 * AAB ni estar dentro de ella. La APK de ensayo no se publica nunca: el script la borra apenas la verificó, no escribe
 * su .sha256 y deja solo apk-prueba-debug.json, con su SHA-256 y `publicable: false`.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { constants, copyFileSync, createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { freemem, homedir, tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { performance } from 'node:perf_hooks';
import { buscarCredenciales } from './credenciales.mjs';
import { CAMPOS_ESPERADOS, normalizarHuella, resumirVeredicto, validarEsperado } from './esperado.mjs';
import { enlacesDelManifiesto, leerBadging, leerRecursoDeTexto, leerVerificacionApksigner } from './lectores.mjs';
import { esArchivoDeFirmaJar, esBloqueDeFirmaJar, extraerZip, leerZip } from './zip.mjs';

/** El certificado de la keystore de EAS, el que firma la APK que está en el teléfono (y todas las publicadas). */
const CERTIFICADO_DE_EAS = '61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06';
const SHA1_DE_EAS = 'b108ec558c0568abb4ccc2d7495d49b4e24836e6';
/** La clave de debug que el SDK de Android crea en cada PC: valores públicos, iguales en todas las instalaciones. */
const CLAVE_DE_PRUEBA = { keystore: join(homedir(), '.android', 'debug.keystore'), alias: 'androiddebugkey', contrasena: 'android' };
const USO = 'Uso: node scripts/aab/apk-desde-aab.mjs <be-….aab> --verificacion <verificacion.json> --referencia <APK instalada> (--respaldo <carpeta> | --clave-de-prueba --salida <carpeta>) [--esperado <esperado.json>] [--salida <carpeta>] [--cert <sha256>] [--cert-sha1 <sha1>] [--memoria-minima <MB>]';

// ─── entrada ─────────────────────────────────────────────────────────────────────────────────

const [ruta, ...resto] = process.argv.slice(2);
if (!ruta || ruta.startsWith('--')) salir(USO);
const opciones = { verificacion: null, esperado: null, referencia: null, respaldo: null, salida: null, cert: null, 'cert-sha1': null, 'clave-de-prueba': false, 'memoria-minima': '1200' };
for (let i = 0; i < resto.length; i++) {
  const clave = resto[i].replace(/^--/, '');
  if (!resto[i].startsWith('--') || !(clave in opciones)) salir(`opción desconocida: ${resto[i]}`);
  if (typeof opciones[clave] === 'boolean') {
    opciones[clave] = true;
    continue;
  }
  if (resto[i + 1] === undefined || resto[i + 1].startsWith('--')) salir(`falta el valor de ${resto[i]}`);
  opciones[clave] = resto[++i];
}
const prueba = opciones['clave-de-prueba'];
if (prueba && opciones.respaldo) salir('--clave-de-prueba y --respaldo no van juntos: o es un ensayo con la clave de debug, o es la firma de verdad');
if (!prueba && !opciones.respaldo) salir('falta --respaldo <carpeta con credentials.json> (o --clave-de-prueba, para un ensayo con la clave de debug de Android)');
if (prueba && (opciones.cert || opciones['cert-sha1'])) salir('con --clave-de-prueba el certificado esperado es el de la clave de debug: --cert y --cert-sha1 no van');
const aab = resolve(ruta);
if (!existsSync(aab)) salir(`no existe ${aab}`);
if (!/\.aab$/i.test(aab) || /-sin-firma\.aab$/i.test(aab)) salir(`la entrada tiene que ser el AAB FIRMADO (be-….aab, sin «-sin-firma»): ${basename(aab)}`);
if (!opciones.verificacion) salir('falta --verificacion <verificacion.json> (la que escribió verificar-aab.mjs sobre este mismo AAB)');
if (!opciones.referencia) salir('falta --referencia <APK instalada en el teléfono>: la nueva se instala encima de esa');
const rutaVerificacion = resolve(opciones.verificacion);
const referencia = resolve(opciones.referencia);
const rutaEsperado = resolve(opciones.esperado ?? join(dirname(aab), 'esperado.json'));
for (const p of [rutaVerificacion, referencia, rutaEsperado]) if (!existsSync(p)) salir(`no existe ${p}`);
if (prueba && !opciones.salida) salir('con --clave-de-prueba, --salida es obligatoria: una carpeta de ensayo, nunca la del AAB');
const carpeta = resolve(opciones.salida ?? dirname(aab));
// relative() de Windows compara sin distinguir mayúsculas: C:/X y c:/x son la misma carpeta.
if (prueba && dentroDe(dirname(aab), carpeta)) salir('con --clave-de-prueba, la salida no puede ser la carpeta del AAB ni estar dentro de ella: una APK de debug no va junto a los artefactos');
const memoriaMinima = Number(opciones['memoria-minima']);
if (!Number.isFinite(memoriaMinima) || memoriaMinima < 0) salir('--memoria-minima tiene que ser un número de MB');
const certPedido = opciones.cert === null ? null : normalizarHuella(opciones.cert);
const sha1Pedido = opciones['cert-sha1'] === null ? null : normalizarHuella(opciones['cert-sha1']);
if (certPedido !== null && !/^[0-9a-f]{64}$/.test(certPedido)) salir('--cert tiene que ser una huella SHA-256 (64 hex)');
if (sha1Pedido !== null && !/^[0-9a-f]{40}$/.test(sha1Pedido)) salir('--cert-sha1 tiene que ser una huella SHA-1 (40 hex)');

let E;
let verificacion;
try {
  E = validarEsperado(JSON.parse(readFileSync(rutaEsperado, 'utf8')));
  verificacion = JSON.parse(readFileSync(rutaVerificacion, 'utf8'));
} catch (e) {
  salir(e instanceof Error ? e.message : String(e));
}
if (!/^[0-9A-Za-z][0-9A-Za-z.-]*$/.test(E.version)) salir(`la versión del esperado no sirve para un nombre de archivo: ${E.version}`);
const nombreDeLaApk = `be-${E.version}-${E.commit.slice(0, 7)}${prueba ? '-prueba-debug' : ''}.apk`;
const destino = join(carpeta, nombreDeLaApk);
const firmandose = `${destino}.firmando`;
const registroBien = join(carpeta, prueba ? 'apk-prueba-debug.json' : 'apk.json');
for (const p of [destino, `${destino}.sha256`, registroBien, firmandose, `${firmandose}.idsig`]) if (existsSync(p)) salir(`ya existe ${p}: no lo piso (si es de otra corrida o quedó de una cortada, movelo o borralo a mano)`);

// ─── herramientas ────────────────────────────────────────────────────────────────────────────

const exe = process.platform === 'win32' ? '.exe' : '';
const JAVA_HOME = process.env.JAVA_HOME || 'C:/Program Files/Android/Android Studio/jbr';
const ANDROID_HOME = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk');
const java = join(JAVA_HOME, 'bin', `java${exe}`);
const keytool = join(JAVA_HOME, 'bin', `keytool${exe}`);
const buildTools = join(ANDROID_HOME, 'build-tools', '36.0.0');
const apksigner = join(buildTools, 'lib', 'apksigner.jar');
const aapt2 = join(buildTools, `aapt2${exe}`);
const zipalign = join(buildTools, `zipalign${exe}`);
const bundletool = process.env.BUNDLETOOL || 'C:/Users/bufim/BE-herramientas/bundletool/bundletool-all-1.18.3.jar';
for (const [n, p] of [
  ['java', java],
  ['keytool', keytool],
  ['apksigner.jar', apksigner],
  ['aapt2', aapt2],
  ['zipalign', zipalign],
  ['bundletool', bundletool],
]) {
  if (!existsSync(p)) salir(`falta ${n}: ${p}`);
}

const libreMb = () => Math.round(freemem() / 1024 ** 2);
const libreAlEmpezar = libreMb();
if (libreAlEmpezar < memoriaMinima) salir(`hay ${libreAlEmpezar} MB libres y hacen falta ${memoriaMinima}: cerrá Chrome y las otras sesiones y volvé a correr`);

// ─── la clave (en memoria, nunca impresa) ────────────────────────────────────────────────────

let clave;
if (prueba) {
  if (!existsSync(CLAVE_DE_PRUEBA.keystore)) salir(`no está la clave de debug de Android: ${CLAVE_DE_PRUEBA.keystore}`);
  clave = { keystore: CLAVE_DE_PRUEBA.keystore, alias: CLAVE_DE_PRUEBA.alias, storepass: CLAVE_DE_PRUEBA.contrasena, keypass: CLAVE_DE_PRUEBA.contrasena };
} else {
  let k;
  try {
    k = JSON.parse(readFileSync(join(resolve(opciones.respaldo), 'credentials.json'), 'utf8')).android?.keystore;
  } catch {
    salir('no pude leer credentials.json del respaldo');
  }
  if (!k?.keystorePath || !k.keystorePassword || !k.keyAlias || !k.keyPassword) salir('credentials.json no tiene android.keystore completo');
  clave = { keystore: resolve(opciones.respaldo, k.keystorePath), alias: k.keyAlias, storepass: k.keystorePassword, keypass: k.keyPassword };
  if (!existsSync(clave.keystore)) salir(`la keystore no existe: ${clave.keystore}`);
}
/** Con firma real se tapan las contraseñas y el alias en todo lo que se muestra; los de debug son públicos. */
const secretos = prueba ? [] : [clave.storepass, clave.keypass, clave.alias].filter((s) => typeof s === 'string' && s.length > 0);
const tapar = (texto, cuales = secretos) => cuales.reduce((t, s) => t.split(s).join('[oculto]'), String(texto ?? ''));
/** El registro no lleva ningún secreto; por las dudas se tapan las contraseñas (el alias no: si fuera corto, rompería el JSON). */
const taparContrasenas = (texto) => tapar(texto, prueba ? [] : [clave.storepass, clave.keypass].filter((s) => typeof s === 'string' && s.length > 0));
const conLaClave = { ...process.env, BE_FIRMA_STOREPASS: clave.storepass, BE_FIRMA_KEYPASS: clave.keypass };

// ─── el trabajo ──────────────────────────────────────────────────────────────────────────────

const avisar = (t) => process.stdout.write(`[apk] ${t}\n`);
const resultado = {
  modo: prueba ? 'prueba (clave de debug de Android)' : 'real (clave de EAS, del respaldo)',
  publicable: false,
  nota: prueba ? 'ENSAYO: firmada con la clave de debug de esta PC. El script la borra al terminar, haya dado bien o no: no se instala ni se publica.' : 'Publicable solo si todoBien es true y con la autorización de Dirección.',
  aab: { archivo: basename(aab), bytes: statSync(aab).size, sha256: null },
  esperado: { paquete: E.paquete, version: E.version, versionCode: E.versionCode, commit: E.commit, appEnv: E.appEnv, apiBaseUrl: E.apiBaseUrl, webBaseUrl: E.webBaseUrl, firebaseProjectId: E.firebaseProjectId, certFirmaAppSha256: E.certFirmaAppSha256 },
  referencia: { archivo: basename(referencia) },
  artefacto: null,
  sha256: null,
  bytes: null,
  controles: {},
  /** Cada comprobación obligatoria: true (bien) o false (mal); «todo bien» exige todas en true. */
  veredicto: {},
  informativo: {},
  herramientas: { java: JAVA_HOME, bundletool: basename(bundletool), apksigner: `build-tools 36.0.0 · ${basename(apksigner)}`, aapt2: 'build-tools 36.0.0', zipalign: 'build-tools 36.0.0', topes: { bundletool: '-Xmx768m', apksigner: '-Xmx512m' } },
  tiempos: {},
  memoria: { libreAlEmpezarMb: libreAlEmpezar, libreMinimaEntrePasosMb: libreAlEmpezar, minimaPedidaMb: memoriaMinima },
  hechoEn: new Date().toISOString(),
};
const C = resultado.controles;
const V = resultado.veredicto;
const I = resultado.informativo;
const inicio = performance.now();
const temporal = mkdtempSync(join(tmpdir(), 'be-apk-'));
let error = null;

/** Antes de lo pesado: si una comprobación previa falló, no se sigue. */
function cortarSiFalla(claves) {
  const mal = claves.filter((k) => k in V && V[k] !== true);
  if (mal.length) throw new Error(`no sigo: fallaron las comprobaciones previas (${mal.join(', ')})`);
}

async function paso(nombre, fn) {
  const t0 = performance.now();
  avisar(`${nombre}…`);
  try {
    return await fn();
  } finally {
    resultado.tiempos[nombre] = Math.round(performance.now() - t0);
    resultado.memoria.libreMinimaEntrePasosMb = Math.min(resultado.memoria.libreMinimaEntrePasosMb, libreMb());
  }
}

try {
  // 1. El AAB es el que se verificó, y la verificación dio «todo bien».
  await paso('verificación del AAB', async () => {
    resultado.aab.sha256 = await sha256DeArchivo(aab);
    const previo = resumirVeredicto(verificacion?.veredicto ?? {});
    C.verificacionDelAab = {
      archivo: basename(rutaVerificacion),
      artefactoVerificado: typeof verificacion?.artefacto === 'string' ? basename(verificacion.artefacto.replace(/\\/g, '/')) : null,
      verificadoEn: verificacion?.verificadoEn ?? null,
      todoBien: verificacion?.todoBien === true,
      comprobaciones: Object.keys(verificacion?.veredicto ?? {}).length,
      fallidos: previo.fallidos,
      pendientes: previo.pendientes,
      mismaSha256: verificacion?.sha256 === resultado.aab.sha256,
      mismosBytes: verificacion?.bytes === resultado.aab.bytes,
    };
    V.aabVerificado = C.verificacionDelAab.todoBien && previo.todoBien && C.verificacionDelAab.mismaSha256 && C.verificacionDelAab.mismosBytes;
    let delaVerificacion = null;
    try {
      delaVerificacion = validarEsperado(verificacion?.esperado);
    } catch {
      delaVerificacion = null;
    }
    const distintos = delaVerificacion ? CAMPOS_ESPERADOS.filter((c) => JSON.stringify(E[c]) !== JSON.stringify(delaVerificacion[c])) : [...CAMPOS_ESPERADOS];
    C.esperado = { archivo: rutaEsperado, camposDistintosDeLosVerificados: distintos };
    V.esperadoEsElVerificado = distintos.length === 0;
  });
  cortarSiFalla(['aabVerificado', 'esperadoEsElVerificado']);

  // 2. La clave: su certificado, antes de gastar memoria en bundletool.
  await paso('certificado de la clave', async () => {
    const lista = correr(keytool, ['-J-Duser.language=en', '-list', '-v', '-keystore', clave.keystore, '-alias', clave.alias, '-storepass:env', 'BE_FIRMA_STOREPASS'], { env: conLaClave, timeout: 60_000 });
    const sha256 = normalizarHuella(/SHA256:\s*([0-9A-F:]+)/i.exec(lista.salida)?.[1] ?? null);
    const sha1 = normalizarHuella(/SHA1:\s*([0-9A-F:]+)/i.exec(lista.salida)?.[1] ?? null);
    C.clave = {
      keystore: basename(clave.keystore),
      leida: lista.status === 0 && Boolean(sha256) && Boolean(sha1),
      sha256,
      sha1,
      esperadoSha256: prueba ? sha256 : (certPedido ?? CERTIFICADO_DE_EAS),
      esperadoSha1: prueba ? sha1 : (sha1Pedido ?? SHA1_DE_EAS),
      esLaDeEas: sha256 === CERTIFICADO_DE_EAS,
      error: lista.status === 0 ? null : tapar(primerasLineas(lista.salida, 3)),
    };
    // En el ensayo, el certificado esperado es el de la clave de debug, y tiene que NO ser el de EAS.
    V.claveDeFirma = C.clave.leida && sha256 === C.clave.esperadoSha256 && sha1 === C.clave.esperadoSha1 && (prueba ? !C.clave.esLaDeEas : true);
  });
  cortarSiFalla(['claveDeFirma']);
  const esperadoSha256 = C.clave.esperadoSha256;
  const esperadoSha1 = C.clave.esperadoSha1;

  // 3. La referencia: la APK que está en el teléfono.
  const ref = await paso('referencia', async () => {
    const sha256 = await sha256DeArchivo(referencia);
    const archivoSha = `${referencia}.sha256`;
    const declarada = existsSync(archivoSha) ? (/^([0-9a-f]{64})\s/i.exec(readFileSync(archivoSha, 'utf8'))?.[1]?.toLowerCase() ?? null) : undefined;
    const badging = leerBadging(correr(aapt2, ['dump', 'badging', referencia]).salida);
    const enlaces = enlacesDelManifiesto(correr(aapt2, ['dump', 'xmltree', '--file', 'AndroidManifest.xml', referencia]).salida);
    const v = correr(java, ['-Xmx512m', '-jar', apksigner, 'verify', '-v', '--print-certs', referencia], { timeout: 180_000 });
    const firma = leerVerificacionApksigner(v.salida, v.status);
    Object.assign(resultado.referencia, { sha256, bytes: statSync(referencia).size, versionCode: badging.versionCode, versionName: badging.versionName, permisos: badging.permisos.length, abis: badging.abis, firma: { verifica: firma.verifica, esquemas: firma.esquemas, firmantes: firma.firmantes, sha256: firma.sha256, sha1: firma.sha1 } });
    if (declarada === undefined) I.referenciaSinSha256 = `no hay ${basename(archivoSha)} al lado: no se comprobó que la copia sea la publicada`;
    else V.referenciaIntegra = declarada === sha256;
    const firmadaConLaEsperada = firma.verifica && firma.sha256.length === 1 && firma.sha256[0] === esperadoSha256 && firma.sha1[0] === esperadoSha1;
    // Con firma real, la nueva se instala encima solo si la referencia tiene el mismo certificado.
    if (prueba) I.referenciaFirmadaConLaClaveDeEas = firma.sha256.length === 1 && firma.sha256[0] === CERTIFICADO_DE_EAS;
    else V.referenciaConElMismoCertificado = firmadaConLaEsperada;
    return { badging, enlaces };
  });

  cortarSiFalla(['referenciaIntegra', 'referenciaConElMismoCertificado']);

  // 4. La universal, con bundletool y sin la clave de debug a la vista (carpeta personal vacía).
  const universal = join(temporal, 'universal.apk');
  await paso('bundletool build-apks', async () => {
    const casaVacia = join(temporal, 'casa-vacia');
    mkdirSync(casaVacia);
    const entorno = Object.fromEntries(Object.entries(process.env).filter(([k]) => !['ANDROID_SDK_HOME', 'ANDROID_USER_HOME', 'ANDROID_PREFS_ROOT', 'HOME'].includes(k.toUpperCase())));
    entorno.HOME = casaVacia;
    const apks = join(temporal, 'u.apks');
    const r = correr(java, ['-Xmx768m', `-Duser.home=${casaVacia}`, '-jar', bundletool, 'build-apks', `--bundle=${aab}`, `--output=${apks}`, '--mode=universal'], { env: entorno, timeout: 420_000 });
    if (r.status !== 0 || !existsSync(apks)) throw new Error(`bundletool build-apks falló (código ${r.status}${r.error ? `, ${r.error}` : ''}): ${primerasLineas(r.salida, 12)}`);
    const delApks = join(temporal, 'apks');
    extraerZip(apks, delApks);
    if (!existsSync(join(delApks, '0', 'universal.apk'))) throw new Error('el .apks no trae universal.apk');
    renameSync(join(delApks, '0', 'universal.apk'), universal);
    rmSync(apks, { force: true });
    rmSync(delApks, { recursive: true, force: true });
  });
  const antes = leerZip(universal);
  const bloquesV1Antes = antes.entradas.filter((e) => esBloqueDeFirmaJar(e.nombre)).length;
  C.universal = { bytes: statSync(universal).size, entradas: antes.entradas.length, conBloqueDeFirmaApk: antes.conBloqueDeFirmaApk, bloquesDeFirmaJar: bloquesV1Antes };
  const universalSinFirma = !antes.conBloqueDeFirmaApk && bloquesV1Antes === 0;
  if (prueba) V.universalSinFirmaAntesDeApksigner = universalSinFirma;
  else I.universalSinFirmaAntesDeApksigner = universalSinFirma;

  // 5. La firma: solo v2, las contraseñas en el entorno del hijo.
  await paso('apksigner sign', async () => {
    // Ni el .firmando ni su .idsig existían al arrancar (si no, no se llega acá): lo que haya es de esta corrida.
    mkdirSync(carpeta, { recursive: true });
    const r = correr(
      java,
      ['-Xmx512m', '-jar', apksigner, 'sign', '--ks', clave.keystore, '--ks-key-alias', clave.alias, '--ks-pass', 'env:BE_FIRMA_STOREPASS', '--key-pass', 'env:BE_FIRMA_KEYPASS', '--v1-signing-enabled', 'false', '--v2-signing-enabled', 'true', '--v3-signing-enabled', 'false', '--v4-signing-enabled', 'false', '--out', firmandose, universal],
      { env: conLaClave, timeout: 300_000 },
    );
    C.apksignerSign = { codigo: r.status, salida: tapar(primerasLineas(r.salida, 6)) || 'sin mensajes' };
    if (r.status !== 0 || !existsSync(firmandose)) throw new Error(`apksigner no firmó (código ${r.status}${r.error ? `, ${r.error}` : ''}): ${C.apksignerSign.salida}`);
  });

  // 6. La firma quedó como tiene que quedar.
  const despues = leerZip(firmandose);
  await paso('apksigner verify', async () => {
    const r = correr(java, ['-Xmx512m', '-jar', apksigner, 'verify', '-v', '--print-certs', firmandose], { timeout: 180_000 });
    const f = leerVerificacionApksigner(r.salida, r.status);
    const bloquesV1 = despues.entradas.filter((e) => esBloqueDeFirmaJar(e.nombre)).length;
    C.firma = { codigo: r.status, verifica: f.verifica, esquemas: f.esquemas, firmantes: f.firmantes, sha256: f.sha256, sha1: f.sha1, avisos: f.avisos, conBloqueDeFirmaApk: despues.conBloqueDeFirmaApk, bloquesDeFirmaJar: bloquesV1, idsig: existsSync(`${firmandose}.idsig`), esperadoSha256, esperadoSha1 };
    if (!f.verifica) C.firma.motivo = tapar(primerasLineas(r.salida, 4));
    V.firmaSoloV2 = f.verifica && f.esquemas.v1 === false && f.esquemas.v2 === true && f.esquemas.v3 === false && f.esquemas['v3.1'] !== true && f.esquemas.v4 !== true && despues.conBloqueDeFirmaApk && bloquesV1 === 0 && !C.firma.idsig;
    V.unSoloFirmanteConElCertificadoEsperado = f.firmantes === 1 && f.sha256.length === 1 && f.sha256[0] === esperadoSha256 && f.sha1.length === 1 && f.sha1[0] === esperadoSha1;
    if (!prueba) V.certificadoDeLaApp = f.sha256.length === 1 && f.sha256[0] === E.certFirmaAppSha256;
  });

  // 7. La firma no cambió el contenido.
  await paso('mismas entradas', async () => {
    const delFirmado = new Map(despues.entradas.map((e) => [e.nombre, e]));
    const distintas = [];
    let comparadas = 0;
    for (const e of antes.entradas) {
      if (e.nombre.endsWith('/') || esArchivoDeFirmaJar(e.nombre)) continue;
      comparadas++;
      const f = delFirmado.get(e.nombre);
      if (!f) distintas.push(`${e.nombre}: falta en la firmada`);
      else if (f.crc !== e.crc || f.tamano !== e.tamano) distintas.push(`${e.nombre}: cambió (crc ${e.crc.toString(16)} → ${f.crc.toString(16)}, ${e.tamano} → ${f.tamano} bytes)`);
    }
    const deAntes = new Set(antes.entradas.map((e) => e.nombre));
    const agregadas = despues.entradas.filter((e) => !deAntes.has(e.nombre)).map((e) => e.nombre);
    // Los nombres de bloques de firma no se listan: apksigner los nombraría con el alias.
    const agregadasDeContenido = agregadas.filter((n) => !esArchivoDeFirmaJar(n));
    C.mismasEntradas = { comparadas, distintas: distintas.length, ejemplos: distintas.slice(0, 5), agregadas: agregadas.length, agregadasDeContenido, agregadoManifestMf: agregadas.includes('META-INF/MANIFEST.MF') };
    V.mismasEntradasQueLaUniversal = comparadas > 0 && distintas.length === 0 && agregadasDeContenido.length === 0;
  });

  // 8. Paquete, versión, permisos y ABI, contra el esperado y la referencia.
  await paso('aapt2 badging y manifiesto', async () => {
    const b = leerBadging(correr(aapt2, ['dump', 'badging', firmandose]).salida);
    const iguales = (a, z) => a.length === z.length && a.every((x, i) => x === z[i]);
    C.badging = { ...b, permisosDeLaReferencia: ref.badging.permisos.length, soloEnLaNueva: b.permisos.filter((p) => !ref.badging.permisos.includes(p)), soloEnLaReferencia: ref.badging.permisos.filter((p) => !b.permisos.includes(p)) };
    V.paquete = b.paquete !== null && b.paquete === E.paquete;
    V.versionYVersionCode = b.versionName === E.version && b.versionCode === E.versionCode;
    V.versionCodeMayorQueLaReferencia = b.versionCode !== null && ref.badging.versionCode !== null && b.versionCode > ref.badging.versionCode;
    V.mismosPermisosQueLaReferencia = b.permisos.length > 0 && iguales(b.permisos, ref.badging.permisos);
    V.mismasAbiQueLaReferencia = b.abis.includes('arm64-v8a') && iguales(b.abis, ref.badging.abis);
    I.sdk = { nueva: { min: b.minSdk, target: b.targetSdk }, referencia: { min: ref.badging.minSdk, target: ref.badging.targetSdk } };

    const enlaces = enlacesDelManifiesto(correr(aapt2, ['dump', 'xmltree', '--file', 'AndroidManifest.xml', firmandose]).salida);
    const host = new URL(E.webBaseUrl).host;
    const esElAppLink = (f) => f.autoVerify && f.esquemas.includes('https') && f.hosts.includes(host) && f.prefijos.includes('/invitacion');
    C.manifiesto = { filtros: enlaces.filtros.length, appLink: enlaces.filtros.find(esElAppLink) ?? null, esquemas: enlaces.esquemas };
    V.appLinkDeInvitacion = Boolean(C.manifiesto.appLink);
    V.esquemaBe = enlaces.esquemas.includes('be');
    I.manifiestoContraLaReferencia = {
      mismosEsquemas: iguales(enlaces.esquemas, ref.enlaces.esquemas),
      appLinkEnLaReferencia: ref.enlaces.filtros.some(esElAppLink),
      metaDatosSoloEnLaNueva: enlaces.metaDatos.filter((n) => !ref.enlaces.metaDatos.includes(n)),
      metaDatosSoloEnLaReferencia: ref.enlaces.metaDatos.filter((n) => !enlaces.metaDatos.includes(n)),
    };
  });

  // 9. Los recursos de Firebase.
  await paso('recursos de Firebase', async () => {
    const volcado = correr(aapt2, ['dump', 'resources', firmandose]);
    const valor = (n) => leerRecursoDeTexto(volcado.salida, n);
    const [projectId, appId, senderId, apiKey] = ['project_id', 'google_app_id', 'gcm_defaultSenderId', 'google_api_key'].map(valor);
    C.firebase = { leido: volcado.status === 0, project_id: projectId, google_app_id: Boolean(appId), gcm_defaultSenderId: Boolean(senderId), google_api_key: Boolean(apiKey) };
    V.firebase = volcado.status === 0 && (E.sinFirebaseAProposito ? !projectId && !appId : projectId === E.firebaseProjectId && Boolean(appId) && Boolean(senderId) && Boolean(apiKey));
  });

  // 10. 16 KB: zipalign sobre la firmada.
  await paso('zipalign', async () => {
    const r = correr(zipalign, ['-c', '-P', '16', '-v', '4', firmandose]);
    const lineasSo = r.salida.split('\n').filter((l) => /lib\/.*\.so/.test(l));
    const soEnLaApk = despues.entradas.filter((e) => /^lib\/.*\.so$/.test(e.nombre)).length;
    const soBien = lineasSo.filter((l) => /\(OK\)\s*$/.test(l.trim())).length;
    C.zipalign = { codigo: r.status, verificado: /Verification succes/i.test(r.salida), bibliotecasEnLaApk: soEnLaApk, informadas: lineasSo.length, sinComprimirYAlineadas: soBien };
    V.zipalign16Kb = r.status === 0 && C.zipalign.verificado && soEnLaApk > 0 && soBien === soEnLaApk && lineasSo.length === soEnLaApk;
  });

  // 11. Todo descomprimido: la configuración embebida y las credenciales.
  await paso('configuración embebida y credenciales', async () => {
    // Con extraerZip y no con tar: los nombres que solo difieren en mayúsculas no se pisan (ver zip.mjs).
    const extraccion = join(temporal, 'apk');
    const extraido = extraerZip(firmandose, extraccion);
    const rutaConfig = join(extraccion, '0', 'assets', 'app.config');
    const appConfig = existsSync(rutaConfig) ? JSON.parse(readFileSync(rutaConfig, 'utf8')) : {};
    const extra = appConfig.extra ?? {};
    C.configuracionEmbebida = { leida: existsSync(rutaConfig), version: appConfig.version ?? null, appEnv: extra.appEnv ?? null, apiBaseUrl: extra.apiBaseUrl ?? null, commit: extra.commit ?? null, construidoEn: extra.construidoEn ?? null, googleWebClientIdPresente: typeof extra.googleWebClientId === 'string' && extra.googleWebClientId.length > 0 };
    V.versionEmbebida = appConfig.version === E.version;
    V.commitEmbebido = extra.commit === E.commit;
    V.ambienteEmbebido = extra.appEnv === E.appEnv && extra.apiBaseUrl === E.apiBaseUrl;
    V.google = E.sinGoogleAProposito ? 'googleWebClientId' in extra && !extra.googleWebClientId : typeof extra.googleWebClientId === 'string' && extra.googleWebClientId === E.googleWebClientId;

    let literales = prueba ? [] : [clave.storepass, clave.keypass];
    const busqueda = buscarCredenciales(extraccion, { valoresLiterales: literales });
    literales = null;
    const archivosDelZip = despues.entradas.filter((e) => !e.nombre.endsWith('/')).length;
    const hallazgos = busqueda.hallazgos.map((h) => ({ ...h, archivo: h.archivo.replace(/^\d+\//, '') }));
    C.credenciales = { extraidos: extraido.archivos, nombresQueChocanEnMayusculas: extraido.choques, entradasDelZip: archivosDelZip, archivosRevisados: busqueda.archivos, bytes: busqueda.bytes, valoresDelRespaldoBuscados: !prueba, hallazgos };
    V.sinCredenciales = extraido.archivos === archivosDelZip && busqueda.archivos === archivosDelZip && hallazgos.length === 0;
  });
} catch (e) {
  error = e instanceof Error ? e.message : String(e);
} finally {
  rmSync(temporal, { recursive: true, force: true });
}

Object.assign(resultado, resumirVeredicto(V));
if (error) {
  resultado.todoBien = false;
  resultado.error = tapar(error);
}
resultado.tiempos.totalMs = Math.round(performance.now() - inicio);

let archivoDelRegistro;
let copiada = false;
if (resultado.todoBien) {
  try {
    resultado.sha256 = await sha256DeArchivo(firmandose);
    resultado.bytes = statSync(firmandose).size;
    if (prueba) {
      // El ensayo no deja ninguna APK que se pueda instalar o publicar por error: se borra acá y queda solo el registro.
      rmSync(firmandose, { force: true });
      resultado.artefactoBorrado = nombreDeLaApk;
    } else {
      // COPYFILE_EXCL: si mientras tanto apareció un archivo con ese nombre, corta en lugar de pisarlo.
      copyFileSync(firmandose, destino, constants.COPYFILE_EXCL);
      copiada = true;
      rmSync(firmandose, { force: true });
      writeFileSync(`${destino}.sha256`, `${resultado.sha256}  ${basename(destino)}\n`, { flag: 'wx' });
      resultado.artefacto = destino;
      resultado.publicable = true;
    }
    archivoDelRegistro = registroBien;
  } catch (e) {
    resultado.todoBien = false;
    resultado.error = tapar(`al dejar la APK: ${e instanceof Error ? e.message : String(e)}`);
    // Solo se borra la copia hecha por esta corrida; lo que ya estaba no se toca.
    if (copiada) rmSync(destino, { force: true });
  }
}
if (!resultado.todoBien) {
  resultado.artefacto = null;
  resultado.publicable = false;
  rmSync(firmandose, { force: true });
  rmSync(`${firmandose}.idsig`, { force: true });
  mkdirSync(carpeta, { recursive: true });
  archivoDelRegistro = join(carpeta, `apk-fallida-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
}
writeFileSync(archivoDelRegistro, `${taparContrasenas(JSON.stringify(resultado, null, 2))}\n`, { flag: 'wx' });
console.log(tapar(informe(resultado)));
avisar(`registro: ${archivoDelRegistro}`);
process.exit(resultado.todoBien ? 0 : 1);

// ─── ayudas ──────────────────────────────────────────────────────────────────────────────────

function salir(mensaje) {
  console.error(`[apk] ${mensaje}`);
  process.exit(2);
}

/** ¿`hija` es `padre` o está dentro de ella? */
function dentroDe(padre, hija) {
  const r = relative(padre, hija);
  return r === '' || (r !== '..' && !r.startsWith(`..${sep}`) && !isAbsolute(r));
}

function correr(comando, args, { env = process.env, timeout = 120_000 } = {}) {
  const r = spawnSync(comando, args, { encoding: 'utf8', env, maxBuffer: 64 * 1024 ** 2, timeout, windowsHide: true });
  return { status: r.status, salida: `${r.stdout ?? ''}${r.stderr ?? ''}`, error: r.error ? (r.error.code ?? r.error.message) : null };
}

function sha256DeArchivo(archivo) {
  return new Promise((resolver, rechazar) => {
    const h = createHash('sha256');
    createReadStream(archivo)
      .on('data', (d) => h.update(d))
      .on('end', () => resolver(h.digest('hex')))
      .on('error', rechazar);
  });
}

function primerasLineas(texto, n) {
  return String(texto ?? '')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim())
    .slice(0, n)
    .join(' / ');
}

function informe(r) {
  const c = r.controles;
  const si = (x) => (x === true ? 'sí' : 'NO');
  const L = [];
  L.push(`APK desde ${r.aab.archivo} · modo ${r.modo}`);
  L.push(`Todo bien: ${r.todoBien ? 'sí' : 'NO'}.${r.fallidos.length ? ` Fallaron: ${r.fallidos.join(', ')}.` : ''}${r.error ? ` Error: ${r.error}` : ''}`);
  const detalle = {
    aabVerificado: c.verificacionDelAab && `${c.verificacionDelAab.comprobaciones} comprobaciones en «todo bien»: ${c.verificacionDelAab.todoBien ? 'sí' : 'no'}; misma SHA-256: ${c.verificacionDelAab.mismaSha256 ? 'sí' : 'no'}`,
    esperadoEsElVerificado: c.esperado && (c.esperado.camposDistintosDeLosVerificados.length ? `distintos: ${c.esperado.camposDistintosDeLosVerificados.join(', ')}` : 'el mismo que se verificó'),
    claveDeFirma: c.clave && `${c.clave.keystore} · SHA-256 ${c.clave.sha256 ?? '—'}${c.clave.error ? ` · ${c.clave.error}` : ''}`,
    referenciaIntegra: r.referencia.sha256 && `${r.referencia.archivo} · ${r.referencia.sha256.slice(0, 16)}…`,
    referenciaConElMismoCertificado: r.referencia.firma && `firmantes ${r.referencia.firma.firmantes} · ${r.referencia.firma.sha256.join(', ')}`,
    universalSinFirmaAntesDeApksigner: c.universal && `bloque de firma APK: ${c.universal.conBloqueDeFirmaApk ? 'sí' : 'no'} · bloques JAR: ${c.universal.bloquesDeFirmaJar}`,
    firmaSoloV2: c.firma && `verifica: ${c.firma.verifica ? 'sí' : 'no'} · v1 ${c.firma.esquemas.v1} · v2 ${c.firma.esquemas.v2} · v3 ${c.firma.esquemas.v3} · v3.1 ${c.firma.esquemas['v3.1']} · v4 ${c.firma.esquemas.v4} · bloques JAR ${c.firma.bloquesDeFirmaJar} · .idsig ${c.firma.idsig ? 'sí' : 'no'}`,
    unSoloFirmanteConElCertificadoEsperado: c.firma && `${c.firma.firmantes} firmante(s) · SHA-256 ${c.firma.sha256.join(', ') || '—'} · SHA-1 ${c.firma.sha1.join(', ') || '—'} (esperado ${c.firma.esperadoSha256} / ${c.firma.esperadoSha1})`,
    certificadoDeLaApp: c.firma && `esperado certFirmaAppSha256 ${r.esperado.certFirmaAppSha256}`,
    mismasEntradasQueLaUniversal: c.mismasEntradas && `${c.mismasEntradas.comparadas} comparadas, ${c.mismasEntradas.distintas} distintas, ${c.mismasEntradas.agregadas} agregadas (${c.mismasEntradas.agregadasDeContenido.length} de contenido)`,
    paquete: c.badging && c.badging.paquete,
    versionYVersionCode: c.badging && `${c.badging.versionName} / ${c.badging.versionCode} (esperado ${r.esperado.version} / ${r.esperado.versionCode})`,
    versionCodeMayorQueLaReferencia: c.badging && `${c.badging.versionCode} > ${r.referencia.versionCode}`,
    mismosPermisosQueLaReferencia: c.badging && `${c.badging.permisos.length} y ${c.badging.permisosDeLaReferencia} en la referencia${c.badging.soloEnLaNueva.length ? ` · solo en la nueva: ${c.badging.soloEnLaNueva.join(', ')}` : ''}${c.badging.soloEnLaReferencia.length ? ` · solo en la referencia: ${c.badging.soloEnLaReferencia.join(', ')}` : ''}`,
    mismasAbiQueLaReferencia: c.badging && c.badging.abis.join(', '),
    appLinkDeInvitacion: c.manifiesto && (c.manifiesto.appLink ? `https://${c.manifiesto.appLink.hosts.join(',')}${c.manifiesto.appLink.prefijos.join(',')} con autoVerify` : 'no está'),
    esquemaBe: c.manifiesto && `esquemas ${c.manifiesto.esquemas.join(', ')}`,
    firebase: c.firebase && `project_id ${c.firebase.project_id} · google_app_id ${c.firebase.google_app_id ? 'sí' : 'no'} · gcm_defaultSenderId ${c.firebase.gcm_defaultSenderId ? 'sí' : 'no'} · google_api_key ${c.firebase.google_api_key ? 'sí' : 'no'}`,
    zipalign16Kb: c.zipalign && `${c.zipalign.bibliotecasEnLaApk} bibliotecas, ${c.zipalign.sinComprimirYAlineadas} sin comprimir y alineadas`,
    versionEmbebida: c.configuracionEmbebida && c.configuracionEmbebida.version,
    commitEmbebido: c.configuracionEmbebida && c.configuracionEmbebida.commit,
    ambienteEmbebido: c.configuracionEmbebida && `${c.configuracionEmbebida.appEnv} · ${c.configuracionEmbebida.apiBaseUrl}`,
    google: c.configuracionEmbebida && `client ID web presente: ${c.configuracionEmbebida.googleWebClientIdPresente ? 'sí' : 'no'} (no se imprime)`,
    sinCredenciales: c.credenciales && `${c.credenciales.archivosRevisados} archivos de ${c.credenciales.entradasDelZip} (${c.credenciales.nombresQueChocanEnMayusculas} separados por chocar en mayúsculas), ${c.credenciales.bytes} bytes; hallazgos ${c.credenciales.hallazgos.length}${c.credenciales.hallazgos.length ? ` (${c.credenciales.hallazgos.map((h) => `${h.archivo}: ${h.marcador}`).join('; ')})` : ''}`,
  };
  for (const [k, v] of Object.entries(r.veredicto)) L.push(`- ${k}: ${si(v)}${detalle[k] ? ` · ${detalle[k]}` : ''}`);
  L.push(`Tiempos (ms): ${Object.entries(r.tiempos).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
  L.push(`Memoria libre: ${r.memoria.libreAlEmpezarMb} MB al empezar, mínima entre pasos ${r.memoria.libreMinimaEntrePasosMb} MB`);
  if (r.todoBien && r.artefacto) L.push(`APK: ${r.artefacto} · ${r.bytes} bytes · sha256 ${r.sha256}`);
  if (r.todoBien && r.artefactoBorrado) L.push(`APK de ensayo verificada y borrada: ${r.artefactoBorrado} · ${r.bytes} bytes · sha256 ${r.sha256}`);
  L.push(r.nota);
  return L.join('\n');
}
