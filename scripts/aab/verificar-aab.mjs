#!/usr/bin/env node
/**
 * Verifica un Android App Bundle de BE contra lo que se espera de él, antes de subirlo a Google Play, sin tocar ninguna
 * credencial. WP-GOOGLE-PLAY-PRUEBAS-INTERNAS (2026-10-28; corrección del 28/10: los valores esperados son obligatorios y
 * «todo bien» exige que cada comprobación obligatoria haya corrido y dado bien).
 *
 *   node scripts/aab/verificar-aab.mjs <ruta.aab> --esperado <esperado.json> [--salida <carpeta>] [--sin-red]
 *
 * `esperado.json` (lo escribe construir-aab.mjs a partir de las FUENTES de la construcción, no del artefacto; también se
 * puede escribir a mano) tiene, todos obligatorios:
 *   paquete, version, versionCode, commit (40 hex), appEnv, apiBaseUrl, webBaseUrl,
 *   googleWebClientId (el client ID web, público; o null si la app se construyó a propósito sin Google),
 *   firebaseProjectId (público; o null si se construyó a propósito sin Firebase),
 *   certSubidaSha256 (la huella del certificado que firma el AAB: la clave de subida),
 *   certFirmaAppSha256 (la huella de la clave de firma de la app, la que verán los teléfonos y la que tiene que estar
 *   publicada en assetlinks.json; hasta que exista una clave de subida aparte, es la misma que certSubidaSha256).
 *
 * Qué comprueba y con qué:
 * - `bundletool validate`; `bundletool dump manifest` (paquete, versión, versionCode, minSdk, targetSdk,
 *   extractNativeLibs, permisos, el App Link de la invitación con el host del website); `bundletool dump config`
 *   (bibliotecas nativas sin comprimir); `bundletool dump resources` (los recursos de Firebase: project_id y los
 *   identificadores públicos de FCM).
 * - `keytool -printcert -jarfile`: el certificado del AAB, comparado con certSubidaSha256.
 * - La configuración embebida (`base/assets/app.config`): ambiente, API, website, commit, versión y el client ID web.
 * - Invitaciones: el App Link apunta al host de webBaseUrl, el esquema `be` está, y el `assetlinks.json` publicado en ese
 *   website declara el paquete con certFirmaAppSha256 (con `--sin-red`, esa comprobación queda PENDIENTE y «todo bien»
 *   no se da).
 * - 16 KB: en el artefacto, extractNativeLibs=false y bibliotecas sin comprimir (config), la alineación ELF de cada
 *   biblioteca de 64 bits (segmentos PT_LOAD a 16384) y `zipalign -c -P 16` sobre la APK universal de inspección. Lo que
 *   no se puede comprobar acá: que la app corra en un dispositivo con páginas de 16 KB (pendiente en un dispositivo).
 * - Credenciales: el bundle entero descomprimido, por nombre y por contenido (scripts/aab/credenciales.mjs), sin
 *   imprimir lo encontrado.
 * Escribe `verificacion.json` y `verificacion.md` (sin secretos). Sale con 0 solo si todo lo obligatorio dio bien.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { buscarCredenciales } from './credenciales.mjs';
import { alineadaA16Kb, PAGINA_DE_16_KB } from './elf.mjs';

const CAMPOS_ESPERADOS = ['paquete', 'version', 'versionCode', 'commit', 'appEnv', 'apiBaseUrl', 'webBaseUrl', 'googleWebClientId', 'firebaseProjectId', 'certSubidaSha256', 'certFirmaAppSha256'];

const [ruta, ...resto] = process.argv.slice(2);
if (!ruta) salir('Uso: node scripts/aab/verificar-aab.mjs <ruta.aab> --esperado <esperado.json> [--salida <carpeta>] [--sin-red]');
const opciones = { esperado: null, salida: dirname(resolve(ruta)), 'sin-red': false };
for (let i = 0; i < resto.length; i++) {
  const clave = resto[i].replace(/^--/, '');
  if (!(clave in opciones)) salir(`opción desconocida: ${resto[i]}`);
  if (typeof opciones[clave] === 'boolean') opciones[clave] = true;
  else opciones[clave] = resto[++i];
}
const aab = resolve(ruta);
if (!existsSync(aab)) salir(`no existe ${aab}`);
if (!opciones.esperado) salir('falta --esperado <esperado.json>: sin los valores esperados no hay verificación');
const E = JSON.parse(readFileSync(resolve(opciones.esperado), 'utf8'));
const faltantes = CAMPOS_ESPERADOS.filter((c) => !(c in E));
if (faltantes.length) salir(`esperado.json sin ${faltantes.join(', ')} (todos los campos son obligatorios; null solo donde se construyó a propósito sin Google o sin Firebase)`);
const huella = (h) => (typeof h === 'string' ? h.replace(/:/g, '').toLowerCase() : null);
E.certSubidaSha256 = huella(E.certSubidaSha256);
E.certFirmaAppSha256 = huella(E.certFirmaAppSha256);
if (!/^[0-9a-f]{64}$/.test(E.certSubidaSha256 ?? '') || !/^[0-9a-f]{64}$/.test(E.certFirmaAppSha256 ?? '')) salir('certSubidaSha256 y certFirmaAppSha256 tienen que ser huellas SHA-256 (64 hex)');
if (!/^[0-9a-f]{40}$/.test(String(E.commit))) salir('commit tiene que ser el SHA completo (40 hex)');

const JAVA_HOME = process.env.JAVA_HOME || 'C:/Program Files/Android/Android Studio/jbr';
const ANDROID_HOME = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk');
const java = join(JAVA_HOME, 'bin', 'java.exe');
const keytool = join(JAVA_HOME, 'bin', 'keytool.exe');
const buildTools = join(ANDROID_HOME, 'build-tools', '36.0.0');
const aapt2 = join(buildTools, 'aapt2.exe');
const zipalign = join(buildTools, 'zipalign.exe');
const bundletool = process.env.BUNDLETOOL || ultimoBundletool('C:/Users/bufim/BE-herramientas/bundletool');
const tar = join(process.env.SystemRoot ?? 'C:/Windows', 'System32', 'tar.exe');
for (const [n, p] of [
  ['java', java],
  ['keytool', keytool],
  ['aapt2', aapt2],
  ['zipalign', zipalign],
  ['bundletool', bundletool],
  ['tar', tar],
]) {
  if (!p || !existsSync(p)) salir(`falta ${n}: ${p}`);
}

const resultado = {
  artefacto: aab,
  bytes: statSync(aab).size,
  sha256: createHash('sha256').update(readFileSync(aab)).digest('hex'),
  verificadoEn: new Date().toISOString(),
  esperado: { ...E },
  controles: {},
  /** Cada comprobación obligatoria: true (bien), false (mal) o 'pendiente' (no corrió); «todo bien» exige todas en true. */
  veredicto: {},
  pendienteEnDispositivo: [],
};
const C = resultado.controles;
const V = resultado.veredicto;
const temporal = join(tmpdir(), `be-aab-${process.pid}`);
mkdirSync(temporal, { recursive: true });

try {
  // 1. Validez del bundle.
  const validacion = correr(java, ['-jar', bundletool, 'validate', `--bundle=${aab}`]);
  C.bundletoolValidate = { ok: validacion.status === 0, resumen: primerasLineas(validacion.salida, 12) };
  V.bundleValido = validacion.status === 0;

  // 2. El manifiesto, contra lo esperado.
  const manifiesto = correr(java, ['-jar', bundletool, 'dump', 'manifest', `--bundle=${aab}`]);
  if (manifiesto.status !== 0) throw new Error(`bundletool dump manifest falló: ${primerasLineas(manifiesto.salida, 8)}`);
  const xml = manifiesto.salida;
  const atributo = (nombre) => new RegExp(`${nombre}="([^"]*)"`).exec(xml)?.[1] ?? null;
  const filtroVerificado = /<intent-filter[^>]*android:autoVerify="true"[\s\S]*?<\/intent-filter>/.exec(xml)?.[0] ?? '';
  const hostDelWebsite = new URL(E.webBaseUrl).host;
  C.manifiesto = {
    package: atributo('package'),
    versionCode: Number(atributo('android:versionCode')),
    versionName: atributo('android:versionName'),
    minSdk: Number(/<uses-sdk[^>]*android:minSdkVersion="(\d+)"/.exec(xml)?.[1]),
    targetSdk: Number(/<uses-sdk[^>]*android:targetSdkVersion="(\d+)"/.exec(xml)?.[1]),
    extractNativeLibs: /<application[^>]*android:extractNativeLibs="([^"]+)"/.exec(xml)?.[1] ?? null,
    permisos: [...xml.matchAll(/<uses-permission android:name="([^"]+)"/g)].map((m) => m[1]).sort(),
    appLink: filtroVerificado ? { autoVerify: true, host: /android:host="([^"]+)"/.exec(filtroVerificado)?.[1] ?? null, pathPrefix: /android:pathPrefix="([^"]+)"/.exec(filtroVerificado)?.[1] ?? null } : null,
    esquemas: [...new Set([...xml.matchAll(/android:scheme="([^"]+)"/g)].map((m) => m[1]))].sort(),
  };
  const m = C.manifiesto;
  V.paquete = m.package === E.paquete;
  V.versionName = m.versionName === E.version;
  V.versionCode = m.versionCode === Number(E.versionCode);
  V.targetSdkApi36 = m.targetSdk >= 36;
  V.appLinkDeInvitacion = Boolean(m.appLink?.autoVerify && m.appLink.host === hostDelWebsite && m.appLink.pathPrefix === '/invitacion');
  V.esquemaBe = m.esquemas.includes('be');

  // 3. El certificado del AAB (la clave de subida).
  const cert = correr(keytool, ['-printcert', '-jarfile', aab]);
  const sha256Cert = huella(/SHA256:\s*([0-9A-F:]+)/i.exec(cert.salida)?.[1] ?? null);
  const sha1Cert = huella(/SHA1:\s*([0-9A-F:]+)/i.exec(cert.salida)?.[1] ?? null);
  C.firmaDelAab = { firmado: cert.status === 0 && Boolean(sha256Cert), sha256: sha256Cert, sha1: sha1Cert, algoritmo: /Signature algorithm name:\s*(.+)/i.exec(cert.salida)?.[1]?.trim() ?? null };
  V.certificadoDeSubida = C.firmaDelAab.firmado && sha256Cert === E.certSubidaSha256;

  // 4. La configuración del bundle y los recursos de Firebase.
  const config = correr(java, ['-jar', bundletool, 'dump', 'config', `--bundle=${aab}`]);
  let bundleConfig = null;
  try {
    bundleConfig = JSON.parse(config.salida);
  } catch {
    bundleConfig = null;
  }
  const sinComprimir = bundleConfig?.optimizations?.uncompressNativeLibraries?.enabled ?? null;
  C.bundleConfig = { ok: config.status === 0, versionDeBundletool: bundleConfig?.bundletool?.version ?? null, bibliotecasNativasSinComprimir: sinComprimir, extractNativeLibsEnManifiesto: m.extractNativeLibs };
  const recurso = (nombre) => {
    const r = correr(java, ['-jar', bundletool, 'dump', 'resources', `--bundle=${aab}`, `--resource=string/${nombre}`, '--values']);
    return r.status === 0 ? (/\[STR\] "([^"]*)"/.exec(r.salida)?.[1] ?? null) : null;
  };
  const projectId = recurso('project_id');
  C.firebase = { project_id: projectId, google_app_id: Boolean(recurso('google_app_id')), gcm_defaultSenderId: Boolean(recurso('gcm_defaultSenderId')), google_api_key: Boolean(recurso('google_api_key')) };
  V.firebase = E.firebaseProjectId === null ? !C.firebase.google_app_id && projectId === null : projectId === E.firebaseProjectId && C.firebase.google_app_id && C.firebase.gcm_defaultSenderId;

  // 5. La configuración embebida: ambiente, API, website, commit, versión y Google.
  correr(tar, ['-xf', aab, '-C', temporal, 'base/assets/app.config']);
  const appConfig = JSON.parse(readFileSync(join(temporal, 'base', 'assets', 'app.config'), 'utf8'));
  const extra = appConfig.extra ?? {};
  C.configuracionEmbebida = { appEnv: extra.appEnv ?? null, apiBaseUrl: extra.apiBaseUrl ?? null, commit: extra.commit ?? null, construidoEn: extra.construidoEn ?? null, version: appConfig.version ?? null, slug: appConfig.slug ?? null, googleWebClientIdPresente: Boolean(extra.googleWebClientId), googleWebClientIdCoincide: E.googleWebClientId === null ? !extra.googleWebClientId : extra.googleWebClientId === E.googleWebClientId };
  V.ambiente = C.configuracionEmbebida.appEnv === E.appEnv && C.configuracionEmbebida.apiBaseUrl === E.apiBaseUrl;
  V.commit = C.configuracionEmbebida.commit === E.commit;
  V.versionEmbebida = C.configuracionEmbebida.version === E.version;
  V.google = C.configuracionEmbebida.googleWebClientIdCoincide;

  // 6. assetlinks.json publicado en el website (la clave de firma de la app tiene que estar declarada).
  if (opciones['sin-red']) {
    C.assetlinks = { comprobado: false, motivo: '--sin-red' };
    V.assetlinksPublicado = 'pendiente';
  } else {
    const urlAssetlinks = `${E.webBaseUrl.replace(/\/$/, '')}/.well-known/assetlinks.json`;
    const descarga = correr('curl', ['-sS', '--max-time', '15', '-w', '\n%{http_code} %{content_type}', urlAssetlinks]);
    const lineas = descarga.salida.trimEnd().split('\n');
    const estado = lineas.pop() ?? '';
    const [codigo, tipo] = estado.split(' ');
    let declaraciones = [];
    try {
      declaraciones = JSON.parse(lineas.join('\n'));
    } catch {
      declaraciones = [];
    }
    const huellasPublicadas = declaraciones.filter((d) => d?.target?.namespace === 'android_app' && d.target.package_name === E.paquete).flatMap((d) => (d.target.sha256_cert_fingerprints ?? []).map(huella));
    C.assetlinks = { comprobado: descarga.status === 0, url: urlAssetlinks, http: codigo ?? null, contentType: tipo ?? null, huellasDelPaquete: huellasPublicadas.length, incluyeLaClaveDeFirmaDeLaApp: huellasPublicadas.includes(E.certFirmaAppSha256) };
    V.assetlinksPublicado = descarga.status === 0 && codigo === '200' && /application\/json/.test(tipo ?? '') && C.assetlinks.incluyeLaClaveDeFirmaDeLaApp;
  }

  // 7. 16 KB en el artefacto: bibliotecas sin comprimir, la alineación ELF de las de 64 bits y zipalign sobre la APK universal.
  correr(tar, ['-xf', aab, '-C', temporal, 'base/lib']);
  const bibliotecas = [];
  const carpetaLib = join(temporal, 'base', 'lib');
  if (existsSync(carpetaLib)) {
    for (const abi of readdirSync(carpetaLib)) {
      for (const nombre of readdirSync(join(carpetaLib, abi)).filter((n) => n.endsWith('.so'))) {
        const { elf, alineada } = alineadaA16Kb(readFileSync(join(carpetaLib, abi, nombre)));
        bibliotecas.push({ abi, nombre, bits: elf?.bits ?? null, alineaciones: elf?.alineaciones ?? [], alineadaA16Kb: alineada });
      }
    }
  }
  const de64 = bibliotecas.filter((b) => b.abi === 'arm64-v8a' || b.abi === 'x86_64');
  const apks = join(temporal, 'universal.apks');
  const construccion = correr(java, ['-jar', bundletool, 'build-apks', `--bundle=${aab}`, `--output=${apks}`, '--mode=universal']);
  if (construccion.status !== 0) throw new Error(`bundletool build-apks falló: ${primerasLineas(construccion.salida, 20)}`);
  correr(tar, ['-xf', apks, '-C', temporal, 'universal.apk']);
  const universal = join(temporal, 'universal.apk');
  const badging = correr(aapt2, ['dump', 'badging', universal]).salida;
  const alineacion = correr(zipalign, ['-c', '-P', '16', '-v', '4', universal]);
  const lineasSo = alineacion.salida.split('\n').filter((l) => /lib\/.*\.so/.test(l));
  C.paginasDe16Kb = {
    extractNativeLibs: m.extractNativeLibs,
    bibliotecasNativasSinComprimir: sinComprimir,
    bibliotecas: bibliotecas.length,
    de64Bits: de64.length,
    de64BitsNoAlineadas: de64.filter((b) => !b.alineadaA16Kb).map((b) => `${b.abi}/${b.nombre} (${b.alineaciones.join(',')})`),
    de32Bits: bibliotecas.length - de64.length,
    zipalignUniversal: { ok: alineacion.status === 0 && /Verification succes/i.test(alineacion.salida), bibliotecas: lineasSo.length, mal: lineasSo.filter((l) => /BAD/i.test(l)).length },
    pagina: PAGINA_DE_16_KB,
  };
  V.nativasSinComprimir = m.extractNativeLibs === 'false' || sinComprimir === true;
  V.elfDe64BitsAlineadosA16Kb = de64.length > 0 && de64.every((b) => b.alineadaA16Kb);
  V.zipalign16KbUniversal = C.paginasDe16Kb.zipalignUniversal.ok && C.paginasDe16Kb.zipalignUniversal.mal === 0;
  C.apkUniversal = { bytes: statSync(universal).size, arquitecturas: /native-code: (.+)/.exec(badging)?.[1]?.replace(/'/g, '').trim().split(/\s+/) ?? [], package: /package: name='([^']+)'/.exec(badging)?.[1] ?? null };
  V.sesentaYCuatroBits = C.apkUniversal.arquitecturas.includes('arm64-v8a') && C.apkUniversal.arquitecturas.includes('x86_64');
  resultado.pendienteEnDispositivo.push('Que la app arranque y funcione en un dispositivo o emulador con páginas de 16 KB (Android 15 o posterior con esa configuración): la alineación comprobada acá es la del artefacto, no la ejecución.');

  // 8. Credenciales en el bundle entero, descomprimido.
  const extraccion = join(temporal, 'todo');
  mkdirSync(extraccion, { recursive: true });
  const extraido = correr(tar, ['-xf', aab, '-C', extraccion]);
  const busqueda = buscarCredenciales(extraccion);
  C.credenciales = { extraido: extraido.status === 0, archivos: busqueda.archivos, bytes: busqueda.bytes, hallazgos: busqueda.hallazgos };
  V.sinCredenciales = extraido.status === 0 && busqueda.hallazgos.length === 0;
} finally {
  rmSync(temporal, { recursive: true, force: true });
}

const obligatorios = Object.entries(V);
resultado.pendientes = obligatorios.filter(([, v]) => v === 'pendiente').map(([k]) => k);
resultado.fallidos = obligatorios.filter(([, v]) => v === false).map(([k]) => k);
resultado.todoBien = obligatorios.length > 0 && obligatorios.every(([, v]) => v === true);

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
  const si = (x) => (x === true ? 'sí' : x === false ? '**NO**' : '**pendiente**');
  const L = [];
  L.push(`# Verificación del AAB ${basename(r.artefacto)}`, '');
  L.push(`${r.bytes} bytes · SHA-256 \`${r.sha256}\` · verificado ${r.verificadoEn}`, '');
  L.push(`**Todo bien: ${r.todoBien ? 'sí' : 'NO'}.**${r.fallidos.length ? ` Fallaron: ${r.fallidos.join(', ')}.` : ''}${r.pendientes.length ? ` Pendientes: ${r.pendientes.join(', ')}.` : ''}`, '');
  L.push('| Comprobación obligatoria | Resultado | Detalle |', '|---|---|---|');
  L.push(`| Bundle válido (\`bundletool validate\`) | ${si(v.bundleValido)} | |`);
  L.push(`| Paquete | ${si(v.paquete)} | \`${c.manifiesto.package}\` (esperado \`${r.esperado.paquete}\`) |`);
  L.push(`| Versión y versionCode | ${si(v.versionName && v.versionCode)} | \`${c.manifiesto.versionName}\` / ${c.manifiesto.versionCode} (esperado \`${r.esperado.version}\` / ${r.esperado.versionCode}) |`);
  L.push(`| Versión embebida (app.config) | ${si(v.versionEmbebida)} | \`${c.configuracionEmbebida.version}\` |`);
  L.push(`| Commit embebido | ${si(v.commit)} | \`${c.configuracionEmbebida.commit}\` (esperado \`${r.esperado.commit}\`) |`);
  L.push(`| Ambiente embebido | ${si(v.ambiente)} | appEnv \`${c.configuracionEmbebida.appEnv}\` · API \`${c.configuracionEmbebida.apiBaseUrl}\` (esperado \`${r.esperado.appEnv}\` · \`${r.esperado.apiBaseUrl}\`) |`);
  L.push(`| Google (client ID web) | ${si(v.google)} | presente: ${c.configuracionEmbebida.googleWebClientIdPresente ? 'sí' : 'no'}; esperado: ${r.esperado.googleWebClientId === null ? 'sin Google' : 'el client ID web registrado'} |`);
  L.push(`| Firebase (recursos de FCM) | ${si(v.firebase)} | project_id \`${c.firebase.project_id}\` (esperado \`${r.esperado.firebaseProjectId}\`); google_app_id ${c.firebase.google_app_id ? 'sí' : 'no'}; gcm_defaultSenderId ${c.firebase.gcm_defaultSenderId ? 'sí' : 'no'} |`);
  L.push(`| targetSdk ≥ 36 | ${si(v.targetSdkApi36)} | minSdk ${c.manifiesto.minSdk} · targetSdk ${c.manifiesto.targetSdk} |`);
  L.push(`| Certificado del AAB (clave de subida) | ${si(v.certificadoDeSubida)} | SHA-256 \`${c.firmaDelAab.sha256 ?? '—'}\` · SHA-1 \`${c.firmaDelAab.sha1 ?? '—'}\` · ${c.firmaDelAab.algoritmo ?? '—'} (esperado \`${r.esperado.certSubidaSha256}\`) |`);
  L.push(`| App Link de la invitación | ${si(v.appLinkDeInvitacion)} | ${c.manifiesto.appLink ? `https://${c.manifiesto.appLink.host}${c.manifiesto.appLink.pathPrefix}` : '—'} (esperado el host de \`${r.esperado.webBaseUrl}\`) |`);
  L.push(`| Esquema \`be\` | ${si(v.esquemaBe)} | esquemas ${c.manifiesto.esquemas.join(', ')} |`);
  L.push(`| assetlinks.json publicado con la clave de firma de la app | ${si(v.assetlinksPublicado)} | ${c.assetlinks.comprobado ? `HTTP ${c.assetlinks.http}, ${c.assetlinks.contentType}, ${c.assetlinks.huellasDelPaquete} huella(s) del paquete, incluye la esperada: ${c.assetlinks.incluyeLaClaveDeFirmaDeLaApp ? 'sí' : 'no'}` : `no comprobado (${c.assetlinks.motivo})`} |`);
  L.push(`| 64 bits | ${si(v.sesentaYCuatroBits)} | ${c.apkUniversal.arquitecturas.join(', ')} |`);
  L.push(`| 16 KB · bibliotecas nativas sin comprimir | ${si(v.nativasSinComprimir)} | extractNativeLibs \`${c.paginasDe16Kb.extractNativeLibs}\` · config uncompressNativeLibraries \`${String(c.paginasDe16Kb.bibliotecasNativasSinComprimir)}\` |`);
  L.push(`| 16 KB · alineación ELF (PT_LOAD a 16384) de las bibliotecas de 64 bits | ${si(v.elfDe64BitsAlineadosA16Kb)} | ${c.paginasDe16Kb.de64Bits} de 64 bits (${c.paginasDe16Kb.de32Bits} de 32, informativas)${c.paginasDe16Kb.de64BitsNoAlineadas.length ? ` · no alineadas: ${c.paginasDe16Kb.de64BitsNoAlineadas.join('; ')}` : ''} |`);
  L.push(`| 16 KB · \`zipalign -c -P 16\` sobre la APK universal | ${si(v.zipalign16KbUniversal)} | ${c.paginasDe16Kb.zipalignUniversal.bibliotecas} bibliotecas, ${c.paginasDe16Kb.zipalignUniversal.mal} mal |`);
  L.push(`| Sin credenciales adentro (todo el bundle descomprimido) | ${si(v.sinCredenciales)} | ${c.credenciales.archivos} archivos, ${c.credenciales.bytes} bytes; hallazgos: ${c.credenciales.hallazgos.length}${c.credenciales.hallazgos.length ? ` (${c.credenciales.hallazgos.map((h) => `${h.archivo}: ${h.marcador}`).join('; ')})` : ''} |`);
  L.push('', `Permisos (${c.manifiesto.permisos.length}): ${c.manifiesto.permisos.map((p) => p.replace('android.permission.', '')).join(', ')}.`, '');
  L.push('**Pendiente en un dispositivo (no lo prueba este script):**');
  for (const p of r.pendienteEnDispositivo) L.push(`- ${p}`);
  L.push('', 'La APK universal la firma bundletool con una clave de debug: sirve para mirar adentro, no para instalar ni para comparar certificados. El certificado que importa es el del AAB (la clave de subida); el que verán los teléfonos es el de la clave de firma de la app que guarde Google, y es el que tiene que estar en assetlinks.json y en el client ID Android de Google.', '');
  return `${L.join('\n')}\n`;
}
