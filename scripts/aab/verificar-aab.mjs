#!/usr/bin/env node
/**
 * Verifica un Android App Bundle de BE antes de subirlo a Google Play, sin tocar ninguna credencial.
 * WP-GOOGLE-PLAY-PRUEBAS-INTERNAS (2026-10-28).
 *
 *   node scripts/aab/verificar-aab.mjs <ruta.aab> [--salida <carpeta>] [--esperado-sha256-cert <huella>]
 *
 * Qué comprueba y con qué:
 * - `bundletool validate`: que el bundle sea válido para Play.
 * - `bundletool dump manifest`: paquete, versionCode, versionName, minSdk, targetSdk, permisos y el App Link.
 * - `keytool -printcert -jarfile`: el certificado con que está firmado el AAB (la clave de subida), SHA-1 y SHA-256. Si se
 *   pasa `--esperado-sha256-cert`, compara.
 * - `bundletool build-apks --mode=universal` (firmada con una clave de debug de bundletool, que no es la del AAB: sirve
 *   solo para inspeccionar) y sobre esa APK: `aapt2 dump badging` (arquitecturas nativas) y `zipalign -c -P 16` (páginas
 *   de 16 KB).
 * - La configuración embebida (`base/assets/app.config`): ambiente, API, website, commit y si va el client ID web.
 * - Que el bundle no contenga archivos de credenciales ni claves privadas.
 * Escribe `verificacion.json` y `verificacion.md` junto al AAB (o en --salida), sin secretos.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from './soporte.mjs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

const [ruta, ...resto] = process.argv.slice(2);
if (!ruta) {
  console.error('Uso: node scripts/aab/verificar-aab.mjs <ruta.aab> [--salida <carpeta>] [--esperado-sha256-cert <huella>]');
  process.exit(2);
}
const opciones = { salida: dirname(resolve(ruta)), 'esperado-sha256-cert': null };
for (let i = 0; i < resto.length; i++) {
  const clave = resto[i].replace(/^--/, '');
  if (!(clave in opciones)) throw new Error(`opción desconocida: ${resto[i]}`);
  opciones[clave] = resto[++i];
}
const aab = resolve(ruta);
if (!existsSync(aab)) throw new Error(`no existe ${aab}`);

const JAVA_HOME = process.env.JAVA_HOME || 'C:/Program Files/Android/Android Studio/jbr';
const ANDROID_HOME = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk');
const java = join(JAVA_HOME, 'bin', 'java.exe');
const keytool = join(JAVA_HOME, 'bin', 'keytool.exe');
const buildTools = join(ANDROID_HOME, 'build-tools', '36.0.0');
const aapt2 = join(buildTools, 'aapt2.exe');
const zipalign = join(buildTools, 'zipalign.exe');
const bundletool = process.env.BUNDLETOOL || ultimoBundletool('C:/Users/bufim/BE-herramientas/bundletool');
for (const [n, p] of [
  ['java', java],
  ['keytool', keytool],
  ['aapt2', aapt2],
  ['zipalign', zipalign],
  ['bundletool', bundletool],
]) {
  if (!p || !existsSync(p)) throw new Error(`falta ${n}: ${p}`);
}

const resultado = { artefacto: aab, bytes: statSync(aab).size, sha256: createHash('sha256').update(readFileSync(aab)).digest('hex'), verificadoEn: new Date().toISOString(), controles: {} };
const C = resultado.controles;
const temporal = join(tmpdir(), `be-aab-${process.pid}`);
mkdirSync(temporal, { recursive: true });

try {
  // 1. Validez del bundle.
  const validacion = correr(java, ['-jar', bundletool, 'validate', `--bundle=${aab}`]);
  C.bundletoolValidate = { ok: validacion.status === 0, resumen: primerasLineas(validacion.salida, 12) };

  // 2. El manifiesto.
  const manifiesto = correr(java, ['-jar', bundletool, 'dump', 'manifest', `--bundle=${aab}`]);
  if (manifiesto.status !== 0) throw new Error(`bundletool dump manifest falló: ${manifiesto.salida}`);
  const xml = manifiesto.salida;
  const atributo = (nombre) => new RegExp(`${nombre}="([^"]*)"`).exec(xml)?.[1] ?? null;
  C.manifiesto = {
    package: atributo('package'),
    versionCode: Number(atributo('android:versionCode')),
    versionName: atributo('android:versionName'),
    minSdk: Number(/<uses-sdk[^>]*android:minSdkVersion="(\d+)"/.exec(xml)?.[1]),
    targetSdk: Number(/<uses-sdk[^>]*android:targetSdkVersion="(\d+)"/.exec(xml)?.[1]),
    permisos: [...xml.matchAll(/<uses-permission android:name="([^"]+)"/g)].map((m) => m[1]).sort(),
    appLink: (() => {
      const filtro = /<intent-filter[^>]*android:autoVerify="true"[\s\S]*?<\/intent-filter>/.exec(xml)?.[0] ?? '';
      return filtro ? { autoVerify: true, host: /android:host="([^"]+)"/.exec(filtro)?.[1] ?? null, pathPrefix: /android:pathPrefix="([^"]+)"/.exec(filtro)?.[1] ?? null } : null;
    })(),
    esquemas: [...new Set([...xml.matchAll(/android:scheme="([^"]+)"/g)].map((m) => m[1]))].sort(),
  };

  // 3. El certificado con que está firmado el AAB (la clave de subida).
  const cert = correr(keytool, ['-printcert', '-jarfile', aab]);
  const sha256Cert = /SHA256:\s*([0-9A-F:]+)/i.exec(cert.salida)?.[1]?.replace(/:/g, '').toLowerCase() ?? null;
  const sha1Cert = /SHA1:\s*([0-9A-F:]+)/i.exec(cert.salida)?.[1]?.replace(/:/g, '').toLowerCase() ?? null;
  C.firmaDelAab = {
    firmado: cert.status === 0 && Boolean(sha256Cert),
    sha256: sha256Cert,
    sha1: sha1Cert,
    algoritmo: /Signature algorithm name:\s*(.+)/i.exec(cert.salida)?.[1]?.trim() ?? null,
    claveDeSubidaEsperada: opciones['esperado-sha256-cert'] ? { esperada: opciones['esperado-sha256-cert'].replace(/:/g, '').toLowerCase(), coincide: sha256Cert === opciones['esperado-sha256-cert'].replace(/:/g, '').toLowerCase() } : null,
  };

  // 4. La APK universal (firma de debug de bundletool: solo para inspeccionar), arquitecturas y 16 KB.
  const apks = join(temporal, 'universal.apks');
  const construccion = correr(java, ['-jar', bundletool, 'build-apks', `--bundle=${aab}`, `--output=${apks}`, '--mode=universal']);
  if (construccion.status !== 0) throw new Error(`bundletool build-apks falló: ${primerasLineas(construccion.salida, 20)}`);
  correr('tar', ['-xf', apks, '-C', temporal, 'universal.apk']);
  const universal = join(temporal, 'universal.apk');
  const badging = correr(aapt2, ['dump', 'badging', universal]).salida;
  const alineacion = correr(zipalign, ['-c', '-P', '16', '-v', '4', universal]);
  const lineasSo = alineacion.salida.split('\n').filter((l) => /lib\/.*\.so/.test(l));
  C.apkUniversal = {
    bytes: statSync(universal).size,
    package: /package: name='([^']+)'/.exec(badging)?.[1] ?? null,
    versionCode: Number(/versionCode='(\d+)'/.exec(badging)?.[1]),
    versionName: /versionName='([^']+)'/.exec(badging)?.[1] ?? null,
    targetSdk: Number(/targetSdkVersion:'(\d+)'/.exec(badging)?.[1]),
    arquitecturas: /native-code: (.+)/.exec(badging)?.[1]?.replace(/'/g, '').trim().split(/\s+/) ?? [],
    paginasDe16Kb: {
      verificacionExitosa: alineacion.status === 0 && /Verification succes/i.test(alineacion.salida),
      bibliotecasNativas: lineasSo.length,
      noAlineadas: lineasSo.filter((l) => /BAD/i.test(l)).map((l) => l.trim()).slice(0, 20),
    },
  };

  // 5. La configuración embebida y lo que no tiene que estar.
  const entradas = correr('tar', ['-tf', aab]).salida.split('\n').map((l) => l.trim()).filter(Boolean);
  correr('tar', ['-xf', aab, '-C', temporal, 'base/assets/app.config']);
  const config = JSON.parse(readFileSync(join(temporal, 'base', 'assets', 'app.config'), 'utf8'));
  const extra = config.extra ?? {};
  C.configuracionEmbebida = { appEnv: extra.appEnv ?? null, apiBaseUrl: extra.apiBaseUrl ?? null, commit: extra.commit ?? null, construidoEn: extra.construidoEn ?? null, version: config.version ?? null, googleWebClientId: Boolean(extra.googleWebClientId), slug: config.slug ?? null };
  const sospechosas = entradas.filter((e) => /credentials\.json|\.jks$|\.keystore$|\.env$|keystore\.properties|\.pem$|\.p12$/i.test(e));
  const bytes = readFileSync(aab);
  C.sinCredenciales = { entradas: entradas.length, archivosSospechosos: sospechosas, marcadorDeClavePrivada: bytes.includes(Buffer.from('PRIVATE KEY')) };

  // 6. Veredicto.
  const m = C.manifiesto;
  resultado.veredicto = {
    bundleValido: C.bundletoolValidate.ok,
    paqueteEsperado: m.package === 'com.elianbufi.be',
    firmado: C.firmaDelAab.firmado,
    targetSdkCumpleApi36: m.targetSdk >= 36,
    sesentaYCuatroBits: C.apkUniversal.arquitecturas.includes('arm64-v8a') && C.apkUniversal.arquitecturas.includes('x86_64'),
    paginasDe16Kb: C.apkUniversal.paginasDe16Kb.verificacionExitosa && C.apkUniversal.paginasDe16Kb.noAlineadas.length === 0,
    appLinkDeInvitacion: Boolean(m.appLink?.autoVerify && m.appLink.pathPrefix === '/invitacion'),
    ambienteTest: C.configuracionEmbebida.appEnv === 'test' && /be-api-hndp/.test(C.configuracionEmbebida.apiBaseUrl ?? ''),
    sinCredenciales: sospechosas.length === 0 && !C.sinCredenciales.marcadorDeClavePrivada,
    claveDeSubidaEsperada: C.firmaDelAab.claveDeSubidaEsperada?.coincide ?? null,
  };
  resultado.todoBien = Object.values(resultado.veredicto).every((v) => v === true || v === null);
} finally {
  rmSync(temporal, { recursive: true, force: true });
}

mkdirSync(opciones.salida, { recursive: true });
writeFileSync(join(opciones.salida, 'verificacion.json'), `${JSON.stringify(resultado, null, 2)}\n`);
writeFileSync(join(opciones.salida, 'verificacion.md'), informe(resultado));
console.log(informe(resultado));
process.exit(resultado.todoBien ? 0 : 1);

// ─── ayudas ──────────────────────────────────────────────────────────────────────────────────

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
  const si = (v) => (v === true ? 'sí' : v === false ? '**NO**' : '—');
  const L = [];
  L.push(`# Verificación del AAB ${basename(r.artefacto)}`, '');
  L.push(`${r.bytes} bytes · SHA-256 \`${r.sha256}\` · verificado ${r.verificadoEn}`, '');
  L.push('| Control | Resultado |', '|---|---|');
  L.push(`| Bundle válido (\`bundletool validate\`) | ${si(r.veredicto.bundleValido)} |`);
  L.push(`| Paquete | \`${c.manifiesto.package}\` (esperado: ${si(r.veredicto.paqueteEsperado)}) |`);
  L.push(`| Versión | \`${c.manifiesto.versionName}\` · versionCode ${c.manifiesto.versionCode} |`);
  L.push(`| minSdk · targetSdk | ${c.manifiesto.minSdk} · ${c.manifiesto.targetSdk} (API 36 exigida por Play: ${si(r.veredicto.targetSdkCumpleApi36)}) |`);
  L.push(`| Firma del AAB (clave de subida) | ${si(r.veredicto.firmado)} · ${c.firmaDelAab.algoritmo ?? '—'} · SHA-256 \`${c.firmaDelAab.sha256 ?? '—'}\` · SHA-1 \`${c.firmaDelAab.sha1 ?? '—'}\`${c.firmaDelAab.claveDeSubidaEsperada ? ` · coincide con la esperada: ${si(c.firmaDelAab.claveDeSubidaEsperada.coincide)}` : ''} |`);
  L.push(`| Arquitecturas (APK universal de inspección) | ${c.apkUniversal.arquitecturas.join(', ')} (64 bits: ${si(r.veredicto.sesentaYCuatroBits)}) |`);
  L.push(`| Páginas de 16 KB (\`zipalign -P 16\`) | ${si(r.veredicto.paginasDe16Kb)} · ${c.apkUniversal.paginasDe16Kb.bibliotecasNativas} bibliotecas nativas${c.apkUniversal.paginasDe16Kb.noAlineadas.length ? ` · no alineadas: ${c.apkUniversal.paginasDe16Kb.noAlineadas.join(', ')}` : ''} |`);
  L.push(`| App Link de la invitación | ${si(r.veredicto.appLinkDeInvitacion)} · ${c.manifiesto.appLink ? `https://${c.manifiesto.appLink.host}${c.manifiesto.appLink.pathPrefix}` : '—'} · esquemas ${c.manifiesto.esquemas.join(', ')} |`);
  L.push(`| Ambiente embebido | appEnv \`${c.configuracionEmbebida.appEnv}\` · API \`${c.configuracionEmbebida.apiBaseUrl}\` · commit \`${c.configuracionEmbebida.commit}\` · client ID web de Google: ${si(c.configuracionEmbebida.googleWebClientId)} (test: ${si(r.veredicto.ambienteTest)}) |`);
  L.push(`| Permisos | ${c.manifiesto.permisos.length}: ${c.manifiesto.permisos.map((p) => p.replace('android.permission.', '')).join(', ')} |`);
  L.push(`| Sin credenciales adentro | ${si(r.veredicto.sinCredenciales)} (${c.sinCredenciales.entradas} entradas; sospechosas: ${c.sinCredenciales.archivosSospechosos.length}; marcador de clave privada: ${c.sinCredenciales.marcadorDeClavePrivada ? 'SÍ' : 'no'}) |`);
  L.push('', `**Todo bien: ${r.todoBien ? 'sí' : 'NO'}.** La APK universal la firma bundletool con una clave de debug: sirve para mirar adentro, no para instalar ni para comparar certificados. El certificado que importa es el del AAB (la clave de subida); el que verán los teléfonos es el de la clave de firma de la app que Google guarde.`, '');
  return `${L.join('\n')}\n`;
}
