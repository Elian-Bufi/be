#!/usr/bin/env node
/**
 * Verifica un Android App Bundle de BE contra lo que se espera de él, antes de subirlo a Google Play, sin tocar ninguna
 * credencial. WP-GOOGLE-PLAY-PRUEBAS-INTERNAS (2026-10-28; corregido tras la revisión adversaria del mismo día).
 *
 *   node scripts/aab/verificar-aab.mjs <ruta.aab> --esperado <esperado.json> [--salida <carpeta>] [--sin-red]
 *                                      [--respaldo <carpeta con credentials.json>]
 *
 * `esperado.json` (lo escribe construir-aab.mjs a partir de las FUENTES de la construcción, no del artefacto; también se
 * puede escribir a mano) tiene, todos obligatorios y validados por scripts/aab/esperado.mjs: paquete, version,
 * versionCode, commit (40 hex), arbolLimpio, appEnv, apiBaseUrl, webBaseUrl, googleWebClientId + sinGoogleAProposito,
 * firebaseProjectId + sinFirebaseAProposito, certSubidaSha256 (la clave de subida, la que firma el AAB) y
 * certFirmaAppSha256 (la clave de firma de la app, la que verán los teléfonos y la que tiene que estar publicada en
 * assetlinks.json; hasta que exista una clave de subida aparte, es la misma).
 *
 * Qué comprueba y con qué (cada una es obligatoria; «todo bien» solo si todas dieron true):
 * - `bundletool validate`; `dump manifest` (paquete, versión, versionCode, targetSdk, el App Link con el host de
 *   webBaseUrl, el esquema `be`); `dump config` (bibliotecas nativas sin comprimir y alineación de 16 KB pedida por el
 *   bundle); `dump resources` (los recursos de Firebase).
 * - `keytool -printcert -jarfile` y `jarsigner -verify -strict`: el certificado del AAB es certSubidaSha256 y no hay
 *   entradas sin firmar.
 * - La configuración embebida (`base/assets/app.config`): ambiente, API, commit, versión y el client ID web de Google
 *   (el website se comprueba por el host del App Link, porque app.config no lo embebe).
 * - Invitaciones: el `assetlinks.json` publicado en webBaseUrl declara el paquete, con la relación
 *   `delegate_permission/common.handle_all_urls` y la huella certFirmaAppSha256 (con `--sin-red`, queda PENDIENTE y no
 *   hay «todo bien»).
 * - 16 KB en el artefacto: config con bibliotecas sin comprimir y `PAGE_ALIGNMENT_16K` (o 64K), la alineación ELF de
 *   cada biblioteca de 64 bits (PT_LOAD y RELRO) y `zipalign -c -P 16` sobre la APK universal de inspección, con todas
 *   las bibliotecas sin comprimir. Lo que no se puede comprobar acá: que la app corra en un dispositivo con páginas de
 *   16 KB (pendiente en un dispositivo).
 * - Credenciales: el bundle entero descomprimido, por nombre y por contenido (scripts/aab/credenciales.mjs) y, con
 *   `--respaldo`, también los valores literales de las contraseñas del respaldo (que se leen y nunca se escriben).
 * Escribe `verificacion.json` y `verificacion.md` (sin secretos). Sale con 0 solo si todo lo obligatorio dio bien.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { buscarCredenciales } from './credenciales.mjs';
import { alineadaA16Kb, PAGINA_DE_16_KB } from './elf.mjs';
import { normalizarHuella, resumirVeredicto, validarEsperado } from './esperado.mjs';

const [ruta, ...resto] = process.argv.slice(2);
if (!ruta) salir('Uso: node scripts/aab/verificar-aab.mjs <ruta.aab> --esperado <esperado.json> [--salida <carpeta>] [--sin-red] [--respaldo <carpeta>]');
const opciones = { esperado: null, salida: dirname(resolve(ruta)), 'sin-red': false, respaldo: null };
for (let i = 0; i < resto.length; i++) {
  const clave = resto[i].replace(/^--/, '');
  if (!(clave in opciones)) salir(`opción desconocida: ${resto[i]}`);
  if (typeof opciones[clave] === 'boolean') opciones[clave] = true;
  else opciones[clave] = resto[++i];
}
const aab = resolve(ruta);
if (!existsSync(aab)) salir(`no existe ${aab}`);
if (!opciones.esperado) salir('falta --esperado <esperado.json>: sin los valores esperados no hay verificación');
let E;
try {
  E = validarEsperado(JSON.parse(readFileSync(resolve(opciones.esperado), 'utf8')));
} catch (e) {
  salir(e instanceof Error ? e.message : String(e));
}

const JAVA_HOME = process.env.JAVA_HOME || 'C:/Program Files/Android/Android Studio/jbr';
const ANDROID_HOME = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk');
const java = join(JAVA_HOME, 'bin', 'java.exe');
const keytool = join(JAVA_HOME, 'bin', 'keytool.exe');
const jarsigner = join(JAVA_HOME, 'bin', 'jarsigner.exe');
const buildTools = join(ANDROID_HOME, 'build-tools', '36.0.0');
const aapt2 = join(buildTools, 'aapt2.exe');
const zipalign = join(buildTools, 'zipalign.exe');
const bundletool = process.env.BUNDLETOOL || ultimoBundletool('C:/Users/bufim/BE-herramientas/bundletool');
const tar = join(process.env.SystemRoot ?? 'C:/Windows', 'System32', 'tar.exe');
for (const [n, p] of [
  ['java', java],
  ['keytool', keytool],
  ['jarsigner', jarsigner],
  ['aapt2', aapt2],
  ['zipalign', zipalign],
  ['bundletool', bundletool],
  ['tar', tar],
]) {
  if (!p || !existsSync(p)) salir(`falta ${n}: ${p}`);
}
/** bundletool con la memoria acotada: la PC de Dirección tiene poca. */
const bt = (...args) => correr(java, ['-Xmx768m', '-jar', bundletool, ...args]);

const resultado = {
  artefacto: aab,
  bytes: statSync(aab).size,
  sha256: await sha256DeArchivo(aab),
  verificadoEn: new Date().toISOString(),
  esperado: { ...E },
  controles: {},
  /** Cada comprobación obligatoria: true (bien), false (mal) o 'pendiente' (no corrió); «todo bien» exige todas en true. */
  veredicto: {},
  informativo: {},
  pendienteEnDispositivo: [],
};
const C = resultado.controles;
const V = resultado.veredicto;
const temporal = mkdtempSync(join(tmpdir(), 'be-aab-'));

try {
  // 1. Validez del bundle.
  const validacion = bt('validate', `--bundle=${aab}`);
  C.bundletoolValidate = { ok: validacion.status === 0, resumen: primerasLineas(validacion.salida, 12) };
  V.bundleValido = validacion.status === 0;

  // 2. El manifiesto, contra lo esperado (ningún valor leído puede ser null para dar bien).
  const manifiesto = bt('dump', 'manifest', `--bundle=${aab}`);
  if (manifiesto.status !== 0) throw new Error(`bundletool dump manifest falló: ${primerasLineas(manifiesto.salida, 8)}`);
  const xml = manifiesto.salida;
  const atributo = (nombre) => new RegExp(`${nombre}="([^"]*)"`).exec(xml)?.[1] ?? null;
  const filtroVerificado = /<intent-filter[^>]*android:autoVerify="true"[\s\S]*?<\/intent-filter>/.exec(xml)?.[0] ?? '';
  const hostDelWebsite = new URL(E.webBaseUrl).host;
  const versionCodeLeido = atributo('android:versionCode');
  const targetSdkLeido = /<uses-sdk[^>]*android:targetSdkVersion="(\d+)"/.exec(xml)?.[1] ?? null;
  C.manifiesto = {
    package: atributo('package'),
    versionCode: versionCodeLeido === null ? null : Number(versionCodeLeido),
    versionName: atributo('android:versionName'),
    minSdk: /<uses-sdk[^>]*android:minSdkVersion="(\d+)"/.exec(xml)?.[1] ?? null,
    targetSdk: targetSdkLeido === null ? null : Number(targetSdkLeido),
    extractNativeLibs: /<application[^>]*android:extractNativeLibs="([^"]+)"/.exec(xml)?.[1] ?? null,
    permisos: [...xml.matchAll(/<uses-permission android:name="([^"]+)"/g)].map((m) => m[1]).sort(),
    appLink: filtroVerificado ? { autoVerify: true, host: /android:host="([^"]+)"/.exec(filtroVerificado)?.[1] ?? null, pathPrefix: /android:pathPrefix="([^"]+)"/.exec(filtroVerificado)?.[1] ?? null } : null,
    esquemas: [...new Set([...xml.matchAll(/android:scheme="([^"]+)"/g)].map((m) => m[1]))].sort(),
  };
  const m = C.manifiesto;
  V.paquete = m.package !== null && m.package === E.paquete;
  V.versionName = m.versionName !== null && m.versionName === E.version;
  V.versionCode = m.versionCode !== null && m.versionCode === E.versionCode;
  V.targetSdkApi36 = m.targetSdk !== null && m.targetSdk >= 36;
  V.appLinkDeInvitacion = Boolean(m.appLink?.autoVerify && m.appLink.host !== null && m.appLink.host === hostDelWebsite && m.appLink.pathPrefix === '/invitacion');
  V.esquemaBe = m.esquemas.includes('be');

  // 3. El certificado del AAB (la clave de subida) y que no haya entradas sin firmar.
  const cert = correr(keytool, ['-printcert', '-jarfile', aab]);
  const huellasSha256 = [...cert.salida.matchAll(/SHA256:\s*([0-9A-F:]+)/gi)].map((x) => normalizarHuella(x[1]));
  const sha1Cert = normalizarHuella(/SHA1:\s*([0-9A-F:]+)/i.exec(cert.salida)?.[1] ?? null);
  const verificacionJar = correr(jarsigner, ['-verify', '-strict', aab]);
  C.firmaDelAab = {
    firmado: cert.status === 0 && huellasSha256.length > 0,
    firmantes: huellasSha256.length,
    sha256: huellasSha256,
    sha1: sha1Cert,
    algoritmo: /Signature algorithm name:\s*(.+)/i.exec(cert.salida)?.[1]?.trim() ?? null,
    jarsigner: { ok: verificacionJar.status === 0 && !/unsigned/i.test(verificacionJar.salida) && /jar verified/i.test(verificacionJar.salida), resumen: primerasLineas(verificacionJar.salida, 6) },
  };
  V.certificadoDeSubida = C.firmaDelAab.firmado && huellasSha256.every((h) => h === E.certSubidaSha256) && C.firmaDelAab.jarsigner.ok;
  resultado.informativo.claveDeSubidaSeparada = E.certSubidaSha256 !== E.certFirmaAppSha256;

  // 4. La configuración del bundle (16 KB) y los recursos de Firebase.
  const config = bt('dump', 'config', `--bundle=${aab}`);
  let bundleConfig = null;
  try {
    bundleConfig = config.status === 0 ? JSON.parse(config.salida) : null;
  } catch {
    bundleConfig = null;
  }
  const sinComprimir = bundleConfig?.optimizations?.uncompressNativeLibraries?.enabled ?? null;
  const alineacionDelBundle = bundleConfig?.optimizations?.uncompressNativeLibraries?.alignment ?? null;
  C.bundleConfig = { ok: config.status === 0 && bundleConfig !== null, versionDeBundletool: bundleConfig?.bundletool?.version ?? null, bibliotecasNativasSinComprimir: sinComprimir, alineacionPedida: alineacionDelBundle, extractNativeLibsEnManifiesto: m.extractNativeLibs };
  V.nativasSinComprimir = sinComprimir === true;
  V.alineacionDelBundle16Kb = ['PAGE_ALIGNMENT_16K', 'PAGE_ALIGNMENT_64K'].includes(alineacionDelBundle);
  const recurso = (nombre) => {
    const r = bt('dump', 'resources', `--bundle=${aab}`, `--resource=string/${nombre}`, '--values');
    const valor = /\[STR\] "([^"]*)"/.exec(r.salida)?.[1] ?? null;
    // bundletool falla con «not found» si el recurso no existe: eso es «ausente», no «no se pudo comprobar».
    const ausente = r.status !== 0 && /not found|does not exist|no resource/i.test(r.salida);
    return { comprobado: r.status === 0 || ausente, valor: r.status === 0 ? valor : null };
  };
  const projectId = recurso('project_id');
  const appId = recurso('google_app_id');
  const senderId = recurso('gcm_defaultSenderId');
  const apiKey = recurso('google_api_key');
  C.firebase = { comprobado: projectId.comprobado && appId.comprobado && senderId.comprobado && apiKey.comprobado, project_id: projectId.valor, google_app_id: Boolean(appId.valor), gcm_defaultSenderId: Boolean(senderId.valor), google_api_key: Boolean(apiKey.valor) };
  V.firebase = C.firebase.comprobado && (E.sinFirebaseAProposito ? !appId.valor && !projectId.valor : projectId.valor === E.firebaseProjectId && Boolean(appId.valor) && Boolean(senderId.valor) && Boolean(apiKey.valor));

  // 5. La configuración embebida: ambiente, API, commit, versión y Google.
  const extraccionConfig = correr(tar, ['-xf', aab, '-C', temporal, 'base/assets/app.config']);
  if (extraccionConfig.status !== 0) throw new Error('no pude extraer base/assets/app.config del bundle');
  const appConfig = JSON.parse(readFileSync(join(temporal, 'base', 'assets', 'app.config'), 'utf8'));
  const extra = appConfig.extra ?? {};
  C.configuracionEmbebida = { appEnv: extra.appEnv ?? null, apiBaseUrl: extra.apiBaseUrl ?? null, commit: extra.commit ?? null, construidoEn: extra.construidoEn ?? null, version: appConfig.version ?? null, slug: appConfig.slug ?? null, googleWebClientIdPresente: typeof extra.googleWebClientId === 'string' && extra.googleWebClientId.length > 0 };
  V.ambiente = typeof extra.appEnv === 'string' && extra.appEnv === E.appEnv && typeof extra.apiBaseUrl === 'string' && extra.apiBaseUrl === E.apiBaseUrl;
  V.commit = typeof extra.commit === 'string' && extra.commit === E.commit;
  V.arbolLimpio = E.arbolLimpio === true;
  V.versionEmbebida = typeof appConfig.version === 'string' && appConfig.version === E.version;
  V.google = E.sinGoogleAProposito ? 'googleWebClientId' in extra && !extra.googleWebClientId : typeof extra.googleWebClientId === 'string' && extra.googleWebClientId === E.googleWebClientId;

  // 6. assetlinks.json publicado en el website (la clave de firma de la app tiene que estar declarada).
  if (opciones['sin-red']) {
    C.assetlinks = { comprobado: false, motivo: '--sin-red' };
    V.assetlinksPublicado = 'pendiente';
  } else {
    const urlAssetlinks = new URL('/.well-known/assetlinks.json', E.webBaseUrl).toString();
    const descarga = correr('curl', ['-sS', '--max-time', '15', '-w', '\n%{http_code} %{content_type}', urlAssetlinks]);
    const lineas = descarga.salida.trimEnd().split('\n');
    const estado = lineas.pop() ?? '';
    const [codigo, tipo] = estado.split(' ');
    let declaraciones = [];
    try {
      const parseado = JSON.parse(lineas.join('\n'));
      declaraciones = Array.isArray(parseado) ? parseado : [];
    } catch {
      declaraciones = [];
    }
    const delPaquete = declaraciones.filter((d) => d?.target?.namespace === 'android_app' && d.target.package_name === E.paquete && Array.isArray(d.relation) && d.relation.includes('delegate_permission/common.handle_all_urls'));
    const huellasPublicadas = delPaquete.flatMap((d) => (Array.isArray(d.target.sha256_cert_fingerprints) ? d.target.sha256_cert_fingerprints : []).map(normalizarHuella));
    C.assetlinks = { comprobado: descarga.status === 0, url: urlAssetlinks, http: codigo ?? null, contentType: tipo ?? null, declaracionesDelPaquete: delPaquete.length, huellasDelPaquete: huellasPublicadas.length, incluyeLaClaveDeFirmaDeLaApp: huellasPublicadas.includes(E.certFirmaAppSha256) };
    V.assetlinksPublicado = descarga.status === 0 && codigo === '200' && /application\/json/.test(tipo ?? '') && C.assetlinks.incluyeLaClaveDeFirmaDeLaApp;
  }

  // 7. 16 KB en el artefacto: la alineación ELF de las bibliotecas de 64 bits y zipalign sobre la APK universal.
  const extraccionLib = correr(tar, ['-xf', aab, '-C', temporal, 'base/lib']);
  const bibliotecas = [];
  const carpetaLib = join(temporal, 'base', 'lib');
  if (extraccionLib.status === 0 && existsSync(carpetaLib)) {
    for (const abi of readdirSync(carpetaLib)) {
      for (const nombre of readdirSync(join(carpetaLib, abi)).filter((n) => n.endsWith('.so'))) {
        const { elf, alineada, cargasAlineadas, relroAlineado } = alineadaA16Kb(readFileSync(join(carpetaLib, abi, nombre)));
        bibliotecas.push({ abi, nombre, bits: elf?.bits ?? null, alineaciones: elf?.alineaciones ?? [], relro: elf?.relro ?? null, cargasAlineadas, relroAlineado, alineadaA16Kb: alineada });
      }
    }
  }
  const de64 = bibliotecas.filter((b) => b.abi === 'arm64-v8a' || b.abi === 'x86_64');
  const apks = join(temporal, 'universal.apks');
  const construccion = bt('build-apks', `--bundle=${aab}`, `--output=${apks}`, '--mode=universal');
  if (construccion.status !== 0) throw new Error(`bundletool build-apks falló: ${primerasLineas(construccion.salida, 20)}`);
  if (correr(tar, ['-xf', apks, '-C', temporal, 'universal.apk']).status !== 0) throw new Error('no pude extraer universal.apk');
  const universal = join(temporal, 'universal.apk');
  const badging = correr(aapt2, ['dump', 'badging', universal]).salida;
  const alineacion = correr(zipalign, ['-c', '-P', '16', '-v', '4', universal]);
  const lineasSo = alineacion.salida.split('\n').filter((l) => /lib\/.*\.so/.test(l));
  const soEnLaApk = correr(tar, ['-tf', universal]).salida.split('\n').filter((l) => /^lib\/.*\.so$/.test(l.trim())).length;
  const soBien = lineasSo.filter((l) => /\(OK\)\s*$/.test(l.trim())).length;
  C.paginasDe16Kb = {
    extractNativeLibs: m.extractNativeLibs,
    bibliotecasNativasSinComprimir: sinComprimir,
    alineacionPedidaPorElBundle: alineacionDelBundle,
    bibliotecas: bibliotecas.length,
    de64Bits: de64.length,
    de64BitsNoAlineadas: de64.filter((b) => !b.alineadaA16Kb).map((b) => `${b.abi}/${b.nombre} (cargas ${b.alineaciones.join(',')}; relro ${b.relroAlineado === null ? 'sin' : b.relroAlineado ? 'bien' : 'MAL'})`),
    de32Bits: bibliotecas.length - de64.length,
    zipalignUniversal: { ok: alineacion.status === 0 && /Verification succes/i.test(alineacion.salida), bibliotecasEnLaApk: soEnLaApk, informadas: lineasSo.length, sinComprimirYAlineadas: soBien, comprimidasOMal: lineasSo.length - soBien },
    pagina: PAGINA_DE_16_KB,
  };
  V.elfDe64BitsAlineadosA16Kb = de64.length > 0 && de64.every((b) => b.alineadaA16Kb);
  V.zipalign16KbUniversal = C.paginasDe16Kb.zipalignUniversal.ok && soEnLaApk > 0 && soBien === soEnLaApk && lineasSo.length === soEnLaApk;
  C.apkUniversal = { bytes: statSync(universal).size, arquitecturas: /native-code: (.+)/.exec(badging)?.[1]?.replace(/'/g, '').trim().split(/\s+/) ?? [], package: /package: name='([^']+)'/.exec(badging)?.[1] ?? null };
  V.sesentaYCuatroBits = C.apkUniversal.arquitecturas.includes('arm64-v8a') && C.apkUniversal.arquitecturas.includes('x86_64');
  resultado.pendienteEnDispositivo.push('Que la app arranque y funcione en un dispositivo o emulador con páginas de 16 KB (Android 15 o posterior con esa configuración): la alineación comprobada acá es la del artefacto, no la ejecución.');

  // 8. Credenciales en el bundle entero, descomprimido (y los valores literales del respaldo, si se pidió).
  const extraccion = join(temporal, 'todo');
  mkdirSync(extraccion, { recursive: true });
  const extraido = correr(tar, ['-xf', aab, '-C', extraccion]);
  const entradas = correr(tar, ['-tf', aab]).salida.split('\n').map((l) => l.trim()).filter((l) => l && !l.endsWith('/'));
  let valoresLiterales = [];
  if (opciones.respaldo) {
    const k = JSON.parse(readFileSync(join(opciones.respaldo, 'credentials.json'), 'utf8')).android?.keystore ?? {};
    valoresLiterales = [k.keystorePassword, k.keyPassword].filter(Boolean);
  }
  const busqueda = buscarCredenciales(extraccion, { valoresLiterales });
  valoresLiterales = null;
  C.credenciales = { extraido: extraido.status === 0, entradasDelZip: entradas.length, archivosRevisados: busqueda.archivos, bytes: busqueda.bytes, valoresDelRespaldoBuscados: Boolean(opciones.respaldo), hallazgos: busqueda.hallazgos };
  V.sinCredenciales = extraido.status === 0 && busqueda.archivos === entradas.length && busqueda.hallazgos.length === 0;
} finally {
  rmSync(temporal, { recursive: true, force: true });
}

Object.assign(resultado, resumirVeredicto(V));

mkdirSync(opciones.salida, { recursive: true });
writeFileSync(join(opciones.salida, 'verificacion.json'), `${JSON.stringify(resultado, null, 2)}\n`);
writeFileSync(join(opciones.salida, 'verificacion.md'), informe(resultado));
console.log(informe(resultado));
process.exit(resultado.todoBien ? 0 : 1);

// ─── ayudas ──────────────────────────────────────────────────────────────────────────────────

function salir(mensaje) {
  console.error(mensaje);
  process.exit(2);
}

function correr(comando, args) {
  const r = spawnSync(comando, args, { encoding: 'utf8', maxBuffer: 64 * 1024 ** 2 });
  return { status: r.status, salida: `${r.stdout ?? ''}${r.stderr ?? ''}` };
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
  return texto.split('\n').filter((l) => l.trim()).slice(0, n).join('\n');
}

function ultimoBundletool(carpeta) {
  if (!existsSync(carpeta)) return null;
  const jars = readdirSync(carpeta)
    .filter((n) => /^bundletool-all-.*\.jar$/.test(n))
    .sort();
  return jars.length ? join(carpeta, jars[jars.length - 1]) : null;
}

function informe(r) {
  const c = r.controles;
  const v = r.veredicto;
  const si = (x) => (x === true ? 'sí' : x === 'pendiente' ? '**pendiente**' : '**NO**');
  const L = [];
  L.push(`# Verificación del AAB ${basename(r.artefacto)}`, '');
  L.push(`${r.bytes} bytes · SHA-256 \`${r.sha256}\` · verificado ${r.verificadoEn}`, '');
  L.push(`**Todo bien: ${r.todoBien ? 'sí' : 'NO'}.**${r.fallidos.length ? ` Fallaron: ${r.fallidos.join(', ')}.` : ''}${r.pendientes.length ? ` Pendientes: ${r.pendientes.join(', ')}.` : ''}`, '');
  L.push('| Comprobación obligatoria | Resultado | Detalle |', '|---|---|---|');
  L.push(`| Bundle válido (\`bundletool validate\`) | ${si(v.bundleValido)} | |`);
  L.push(`| Paquete | ${si(v.paquete)} | \`${c.manifiesto.package}\` (esperado \`${r.esperado.paquete}\`) |`);
  L.push(`| Versión y versionCode | ${si(v.versionName && v.versionCode)} | \`${c.manifiesto.versionName}\` / ${c.manifiesto.versionCode} (esperado \`${r.esperado.version}\` / ${r.esperado.versionCode}) |`);
  L.push(`| Versión embebida (app.config) | ${si(v.versionEmbebida)} | \`${c.configuracionEmbebida.version}\` |`);
  L.push(`| Commit embebido y árbol limpio al construir | ${si(v.commit && v.arbolLimpio)} | \`${c.configuracionEmbebida.commit}\` (esperado \`${r.esperado.commit}\`); árbol limpio: ${r.esperado.arbolLimpio ? 'sí' : 'NO'} |`);
  L.push(`| Ambiente embebido | ${si(v.ambiente)} | appEnv \`${c.configuracionEmbebida.appEnv}\` · API \`${c.configuracionEmbebida.apiBaseUrl}\` (esperado \`${r.esperado.appEnv}\` · \`${r.esperado.apiBaseUrl}\`); el website se comprueba por el host del App Link |`);
  L.push(`| Google (client ID web) | ${si(v.google)} | presente: ${c.configuracionEmbebida.googleWebClientIdPresente ? 'sí' : 'no'}; esperado: ${r.esperado.sinGoogleAProposito ? 'sin Google, a propósito' : 'el client ID web registrado'} |`);
  L.push(`| Firebase (recursos de FCM) | ${si(v.firebase)} | comprobado: ${c.firebase.comprobado ? 'sí' : 'no'}; project_id \`${c.firebase.project_id}\` (esperado ${r.esperado.sinFirebaseAProposito ? 'ninguno, a propósito' : `\`${r.esperado.firebaseProjectId}\``}); google_app_id ${c.firebase.google_app_id ? 'sí' : 'no'}; gcm_defaultSenderId ${c.firebase.gcm_defaultSenderId ? 'sí' : 'no'}; google_api_key ${c.firebase.google_api_key ? 'sí' : 'no'} |`);
  L.push(`| targetSdk ≥ 36 | ${si(v.targetSdkApi36)} | minSdk ${c.manifiesto.minSdk} · targetSdk ${c.manifiesto.targetSdk} |`);
  L.push(`| Certificado del AAB (clave de subida) y sin entradas sin firmar | ${si(v.certificadoDeSubida)} | ${c.firmaDelAab.firmantes} firmante(s) · SHA-256 \`${c.firmaDelAab.sha256.join(', ') || '—'}\` · SHA-1 \`${c.firmaDelAab.sha1 ?? '—'}\` · ${c.firmaDelAab.algoritmo ?? '—'} (esperado \`${r.esperado.certSubidaSha256}\`) · jarsigner: ${c.firmaDelAab.jarsigner.ok ? 'verificado' : 'NO'} |`);
  L.push(`| App Link de la invitación | ${si(v.appLinkDeInvitacion)} | ${c.manifiesto.appLink ? `https://${c.manifiesto.appLink.host}${c.manifiesto.appLink.pathPrefix}` : '—'} (esperado el host de \`${r.esperado.webBaseUrl}\`) |`);
  L.push(`| Esquema \`be\` | ${si(v.esquemaBe)} | esquemas ${c.manifiesto.esquemas.join(', ')} |`);
  L.push(`| assetlinks.json publicado con la clave de firma de la app | ${si(v.assetlinksPublicado)} | ${c.assetlinks.comprobado ? `HTTP ${c.assetlinks.http}, ${c.assetlinks.contentType}, ${c.assetlinks.declaracionesDelPaquete} declaración(es) del paquete con handle_all_urls, ${c.assetlinks.huellasDelPaquete} huella(s), incluye la esperada: ${c.assetlinks.incluyeLaClaveDeFirmaDeLaApp ? 'sí' : 'no'}` : `no comprobado (${c.assetlinks.motivo})`} |`);
  L.push(`| 64 bits | ${si(v.sesentaYCuatroBits)} | ${c.apkUniversal.arquitecturas.join(', ')} |`);
  L.push(`| 16 KB · bibliotecas nativas sin comprimir (config del bundle) | ${si(v.nativasSinComprimir)} | uncompressNativeLibraries \`${String(c.paginasDe16Kb.bibliotecasNativasSinComprimir)}\` · extractNativeLibs en el manifiesto \`${c.paginasDe16Kb.extractNativeLibs}\` (informativo) |`);
  L.push(`| 16 KB · alineación pedida por el bundle | ${si(v.alineacionDelBundle16Kb)} | \`${String(c.paginasDe16Kb.alineacionPedidaPorElBundle)}\` (se exige PAGE_ALIGNMENT_16K o 64K) |`);
  L.push(`| 16 KB · ELF de 64 bits (PT_LOAD a 16384 y fin del RELRO alineado) | ${si(v.elfDe64BitsAlineadosA16Kb)} | ${c.paginasDe16Kb.de64Bits} de 64 bits (${c.paginasDe16Kb.de32Bits} de 32, informativas)${c.paginasDe16Kb.de64BitsNoAlineadas.length ? ` · no alineadas: ${c.paginasDe16Kb.de64BitsNoAlineadas.join('; ')}` : ''} |`);
  L.push(`| 16 KB · \`zipalign -c -P 16\` sobre la APK universal, todas las bibliotecas sin comprimir y alineadas | ${si(v.zipalign16KbUniversal)} | ${c.paginasDe16Kb.zipalignUniversal.bibliotecasEnLaApk} en la APK, ${c.paginasDe16Kb.zipalignUniversal.sinComprimirYAlineadas} bien, ${c.paginasDe16Kb.zipalignUniversal.comprimidasOMal} comprimidas o mal |`);
  L.push(`| Sin credenciales adentro (todo el bundle descomprimido) | ${si(v.sinCredenciales)} | ${c.credenciales.archivosRevisados} archivos revisados de ${c.credenciales.entradasDelZip} entradas, ${c.credenciales.bytes} bytes; valores del respaldo buscados: ${c.credenciales.valoresDelRespaldoBuscados ? 'sí' : 'no'}; hallazgos: ${c.credenciales.hallazgos.length}${c.credenciales.hallazgos.length ? ` (${c.credenciales.hallazgos.map((h) => `${h.archivo}: ${h.marcador}`).join('; ')})` : ''} |`);
  L.push('', `Informativo: clave de subida separada de la clave de firma de la app: ${r.informativo.claveDeSubidaSeparada ? 'sí' : 'no (la misma keystore; la recomendación ratificada es separarlas cuando Dirección genere la clave de subida)'}. Permisos (${c.manifiesto.permisos.length}): ${c.manifiesto.permisos.map((p) => p.replace('android.permission.', '')).join(', ')}.`, '');
  L.push('**Pendiente en un dispositivo (no lo prueba este script):**');
  for (const p of r.pendienteEnDispositivo) L.push(`- ${p}`);
  L.push('', 'La APK universal la firma bundletool con una clave de debug: sirve para mirar adentro, no para instalar ni para comparar certificados. El certificado que importa es el del AAB (la clave de subida); el que verán los teléfonos es el de la clave de firma de la app que guarde Google, y es el que tiene que estar en assetlinks.json y en el client ID Android de Google.', '');
  return `${L.join('\n')}\n`;
}
