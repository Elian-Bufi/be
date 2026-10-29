#!/usr/bin/env node
/**
 * Firma, en la máquina de Dirección, un AAB que se construyó SIN firma (en GitHub Actions, con
 * `construir-aab.mjs --sin-firma`). WP-GOOGLE-PLAY-PRUEBAS-INTERNAS (2026-10-29).
 *
 *   node scripts/aab/firmar-aab.mjs <be-…-sin-firma.aab> --respaldo <carpeta con credentials.json> [--salida <carpeta>]
 *                                   [--cert <SHA-256 esperado>]
 *
 * Por qué así: construir pide varios GB de memoria y la keystore no puede salir de esta máquina; firmar es liviano.
 *
 * - Exige que la entrada NO esté firmada (jarsigner la informa «unsigned» y no hay bloques de firma en META-INF).
 * - Firma con `jarsigner` (SHA256withRSA, SHA-256), la forma que documenta Google para un App Bundle. Las contraseñas
 *   pasan por el entorno del proceso (`-storepass:env`, `-keypass:env`); el alias va como argumento. Nada de eso se
 *   imprime ni se escribe: la salida de jarsigner se muestra con esos valores tapados. No genera ninguna clave.
 * - `-sigfile BE`: sin eso, jarsigner nombra los archivos de firma con los primeros 8 caracteres del alias
 *   (META-INF/<ALIAS>.SF y .RSA) y el alias quedaría dentro del AAB. Lo único agregado tiene que ser exactamente
 *   META-INF/MANIFEST.MF, META-INF/BE.SF y META-INF/BE.RSA (corrección del 2026-10-29: la primera firma lo mostró).
 * - Comprueba que la firma no cambió el contenido: cada entrada del AAB sin firma está en el firmado con el mismo CRC-32
 *   y el mismo tamaño, y lo único agregado son los archivos de firma de META-INF. Así, lo que se comprobó sobre el
 *   artefacto sin firma sigue valiendo, y verificar-aab.mjs se corre igual sobre el firmado.
 * - Comprueba el certificado (`keytool -printcert -jarfile`) contra el esperado y `jarsigner -verify -strict`, leído con
 *   `evaluarVerificacionJar` (scripts/aab/esperado.mjs): la clave de Android es autofirmada y -strict siempre marca su
 *   cadena; eso se acepta, y ningún otro aviso grave. keytool y jarsigner corren en inglés, para leerlos igual siempre.
 * - Nunca pisa un archivo existente. Escribe el AAB firmado (sin `-sin-firma` en el nombre), su `.sha256` y `firma.json`
 *   (sin secretos). Sale con 0 solo si todo dio bien.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, existsSync, fstatSync, mkdirSync, openSync, readFileSync, readSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { esAutofirmado, evaluarVerificacionJar } from './esperado.mjs';

/** La huella del certificado de la keystore de EAS, la que firma todas las APK publicadas. */
const CERTIFICADO_DE_EAS = '61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06';
/** Lo único que la firma puede agregar o cambiar en el zip (en el origen, cualquier bloque de firma cuenta como firma). */
const ES_DE_FIRMA = (nombre) => /^META-INF\/(MANIFEST\.MF|[^/]+\.(SF|RSA|DSA|EC))$/i.test(nombre);
/** El nombre de los archivos de firma: fijo, para que no salga del alias. */
const NOMBRE_DE_LA_FIRMA = 'BE';
const AGREGADAS_ESPERADAS = ['META-INF/MANIFEST.MF', `META-INF/${NOMBRE_DE_LA_FIRMA}.SF`, `META-INF/${NOMBRE_DE_LA_FIRMA}.RSA`];

const [ruta, ...resto] = process.argv.slice(2);
if (!ruta) salir('Uso: node scripts/aab/firmar-aab.mjs <be-…-sin-firma.aab> --respaldo <carpeta> [--salida <carpeta>] [--cert <sha256>]');
const opciones = { respaldo: null, salida: null, cert: CERTIFICADO_DE_EAS };
for (let i = 0; i < resto.length; i++) {
  const clave = resto[i].replace(/^--/, '');
  if (!(clave in opciones) || resto[i + 1] === undefined) salir(`opción desconocida o sin valor: ${resto[i]}`);
  opciones[clave] = resto[++i];
}
const origen = resolve(ruta);
if (!existsSync(origen)) salir(`no existe ${origen}`);
if (!/-sin-firma\.aab$/.test(origen)) salir(`la entrada tiene que ser un AAB construido con --sin-firma (…-sin-firma.aab): ${basename(origen)}`);
if (!opciones.respaldo) salir('falta --respaldo <carpeta con credentials.json>');
const certEsperado = opciones.cert.replace(/:/g, '').toLowerCase();
if (!/^[0-9a-f]{64}$/.test(certEsperado)) salir('--cert tiene que ser una huella SHA-256 (64 hex)');
const carpeta = resolve(opciones.salida ?? dirname(origen));
mkdirSync(carpeta, { recursive: true });
const destino = join(carpeta, basename(origen).replace(/-sin-firma\.aab$/, '.aab'));
if (existsSync(destino)) salir(`ya existe ${destino}: no lo piso (movelo o borralo a mano si es de otra prueba)`);

const exe = process.platform === 'win32' ? '.exe' : '';
const JAVA_HOME = process.env.JAVA_HOME || 'C:/Program Files/Android/Android Studio/jbr';
const keytool = join(JAVA_HOME, 'bin', `keytool${exe}`);
const jarsigner = join(JAVA_HOME, 'bin', `jarsigner${exe}`);
for (const [n, p] of [
  ['keytool', keytool],
  ['jarsigner', jarsigner],
]) {
  if (!existsSync(p)) salir(`falta ${n}: ${p}`);
}
const avisar = (t) => process.stdout.write(`[firma] ${t}\n`);
/** keytool y jarsigner en inglés: sus mensajes se leen con expresiones regulares. */
const EN_INGLES = '-J-Duser.language=en';

// 1. La entrada no está firmada.
const entradasDelOrigen = leerDirectorioCentral(origen);
const firmasPrevias = entradasDelOrigen.filter((e) => /^META-INF\/[^/]+\.(SF|RSA|DSA|EC)$/i.test(e.nombre)).map((e) => e.nombre);
const verificacionPrevia = correr(jarsigner, [EN_INGLES, '-verify', origen]);
if (firmasPrevias.length || !/unsigned/i.test(verificacionPrevia.salida)) salir(`la entrada ya trae firma (${firmasPrevias.length ? `${firmasPrevias.length} bloque(s) de firma en META-INF` : 'jarsigner no la informa «unsigned»'}): no la firmo encima`);
const sha256Origen = sha256(origen);
avisar(`entrada sin firma: ${basename(origen)} · ${entradasDelOrigen.length} entradas · sha256 ${sha256Origen.slice(0, 16)}…`);

// 2. Firmar, con las credenciales solo en el entorno del proceso y la salida tapada.
const credenciales = JSON.parse(readFileSync(join(opciones.respaldo, 'credentials.json'), 'utf8')).android?.keystore;
if (!credenciales?.keystorePath || !credenciales.keystorePassword || !credenciales.keyAlias || !credenciales.keyPassword) salir('credentials.json no tiene android.keystore completo');
const keystore = resolve(opciones.respaldo, credenciales.keystorePath);
if (!existsSync(keystore)) salir(`la keystore no existe: ${keystore}`);
const tapar = (texto) => [credenciales.keystorePassword, credenciales.keyPassword, credenciales.keyAlias].reduce((t, s) => t.split(s).join('[oculto]'), texto);
const temporal = `${destino}.firmando`;
rmSync(temporal, { force: true });
const firma = correr(
  jarsigner,
  [EN_INGLES, '-keystore', keystore, '-storepass:env', 'BE_FIRMA_STOREPASS', '-keypass:env', 'BE_FIRMA_KEYPASS', '-sigalg', 'SHA256withRSA', '-digestalg', 'SHA-256', '-sigfile', NOMBRE_DE_LA_FIRMA, '-signedjar', temporal, origen, credenciales.keyAlias],
  { ...process.env, BE_FIRMA_STOREPASS: credenciales.keystorePassword, BE_FIRMA_KEYPASS: credenciales.keyPassword },
);
const salidaDeLaFirma = tapar(firma.salida).trim();
if (firma.status !== 0 || !existsSync(temporal)) {
  rmSync(temporal, { force: true });
  salir(`jarsigner no firmó (código ${firma.status}): ${salidaDeLaFirma.split('\n').slice(0, 6).join(' / ')}`);
}
avisar(`jarsigner: ${salidaDeLaFirma.split('\n').filter((l) => l.trim()).slice(0, 3).join(' / ') || 'sin mensajes'}`);

// 3. La firma no cambió el contenido.
const entradasDelFirmado = leerDirectorioCentral(temporal);
const delFirmado = new Map(entradasDelFirmado.map((e) => [e.nombre, e]));
const distintas = [];
for (const e of entradasDelOrigen) {
  if (e.nombre.endsWith('/') || ES_DE_FIRMA(e.nombre)) continue;
  const f = delFirmado.get(e.nombre);
  if (!f) distintas.push(`${e.nombre}: falta en el firmado`);
  else if (f.crc !== e.crc || f.tamano !== e.tamano) distintas.push(`${e.nombre}: cambió (crc ${e.crc.toString(16)} → ${f.crc.toString(16)}, ${e.tamano} → ${f.tamano} bytes)`);
}
const nombresDelOrigen = new Set(entradasDelOrigen.map((e) => e.nombre));
const agregadas = entradasDelFirmado.filter((e) => !nombresDelOrigen.has(e.nombre)).map((e) => e.nombre);
// Solo MANIFEST.MF, BE.SF y BE.RSA: ningún otro archivo, y ningún bloque de firma con otro nombre (sería el alias).
const agregadasRaras = agregadas.filter((n) => !AGREGADAS_ESPERADAS.includes(n));
const bloquesDeFirma = entradasDelFirmado.filter((e) => /^META-INF\/[^/]+\.(SF|RSA|DSA|EC)$/i.test(e.nombre)).map((e) => e.nombre).sort();
const bloquesEsperados = AGREGADAS_ESPERADAS.slice(1).sort();
const bloquesBien = bloquesDeFirma.length === bloquesEsperados.length && bloquesDeFirma.every((n, i) => n === bloquesEsperados[i]);
const comparadas = entradasDelOrigen.filter((e) => !e.nombre.endsWith('/') && !ES_DE_FIRMA(e.nombre)).length;

// 4. El certificado y la verificación estricta.
const cert = correr(keytool, [EN_INGLES, '-printcert', '-jarfile', temporal]);
const huellas = [...cert.salida.matchAll(/SHA256:\s*([0-9A-F:]+)/gi)].map((x) => x[1].replace(/:/g, '').toLowerCase());
const autofirmado = esAutofirmado(cert.salida);
const verificacion = correr(jarsigner, [EN_INGLES, '-verify', '-strict', temporal]);
const lectura = evaluarVerificacionJar({ codigo: verificacion.status, salida: verificacion.salida, autofirmado });
const verificado = lectura.ok;

const bien = distintas.length === 0 && agregadasRaras.length === 0 && bloquesBien && huellas.length > 0 && huellas.every((h) => h === certEsperado) && verificado;
if (!bien) {
  rmSync(temporal, { force: true });
  salir(
    [
      'la firma no quedó bien; no dejo el AAB firmado:',
      distintas.length ? `- entradas distintas (${distintas.length}): ${distintas.slice(0, 5).join('; ')}` : null,
      agregadasRaras.length ? `- entradas agregadas que no son MANIFEST.MF, ${NOMBRE_DE_LA_FIRMA}.SF ni ${NOMBRE_DE_LA_FIRMA}.RSA: ${agregadasRaras.length} (no se listan: el nombre podría salir del alias)` : null,
      !bloquesBien ? `- los bloques de firma no son exactamente ${bloquesEsperados.join(' y ')} (${bloquesDeFirma.length} bloque(s); no se listan)` : null,
      !huellas.length ? '- keytool no informa ningún certificado' : null,
      huellas.length && !huellas.every((h) => h === certEsperado) ? `- certificado ${huellas.join(', ')} (esperado ${certEsperado})` : null,
      !verificado ? `- jarsigner -verify -strict (código ${verificacion.status}): ${tapar(lectura.motivo)} · ${tapar(verificacion.salida).trim().split('\n').filter((l) => l.trim()).slice(0, 4).join(' / ')}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  );
}
renameSync(temporal, destino);
const sha256Destino = sha256(destino);
writeFileSync(`${destino}.sha256`, `${sha256Destino}  ${basename(destino)}\n`);
const registro = {
  origen: { archivo: basename(origen), sha256: sha256Origen, entradas: entradasDelOrigen.length },
  artefacto: destino,
  sha256: sha256Destino,
  bytes: statSync(destino).size,
  certificadoSha256: huellas[0],
  certificadoEsperado: certEsperado,
  entradasComparadas: comparadas,
  entradasAgregadasPorLaFirma: agregadas,
  certificadoAutofirmado: autofirmado,
  jarsignerVerifyStrict: { codigo: verificacion.status, lectura: lectura.motivo },
  keystore: basename(keystore),
  nota: 'alias y contraseñas solo en el proceso de jarsigner (entorno y argumento), nunca impresos ni escritos',
  firmadoEn: new Date().toISOString(),
};
writeFileSync(join(carpeta, 'firma.json'), `${JSON.stringify(registro, null, 2)}\n`);
avisar(`firmado: ${destino} · sha256 ${sha256Destino.slice(0, 16)}… · certificado ${huellas[0].slice(0, 16)}… (el esperado)`);
avisar(`${comparadas} entradas iguales al AAB sin firma; agregadas por la firma: ${agregadas.join(', ')}`);
avisar(`jarsigner -verify -strict (código ${verificacion.status}): ${lectura.motivo}`);
avisar(`verificar: node scripts/aab/verificar-aab.mjs "${destino}" --esperado <esperado.json> --respaldo <carpeta del respaldo>`);

// ─── ayudas ──────────────────────────────────────────────────────────────────────────────────

function salir(mensaje) {
  console.error(`[firma] ${mensaje}`);
  process.exit(1);
}

function correr(comando, args, env = process.env) {
  const r = spawnSync(comando, args, { encoding: 'utf8', env, maxBuffer: 16 * 1024 ** 2 });
  return { status: r.status, salida: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

function sha256(archivo) {
  return createHash('sha256').update(readFileSync(archivo)).digest('hex');
}

/** Las entradas del directorio central de un zip: nombre, CRC-32 y tamaño sin comprimir. Sin zip64 (un AAB no lo usa). */
function leerDirectorioCentral(archivo) {
  const fd = openSync(archivo, 'r');
  try {
    const total = fstatSync(fd).size;
    const cola = Math.min(total, 65_557);
    const fin = Buffer.alloc(cola);
    readSync(fd, fin, 0, cola, total - cola);
    let p = cola - 22;
    while (p >= 0 && fin.readUInt32LE(p) !== 0x06054b50) p--;
    if (p < 0) throw new Error(`${basename(archivo)} no es un zip (sin fin de directorio central)`);
    const cantidad = fin.readUInt16LE(p + 10);
    const tamanoDelDirectorio = fin.readUInt32LE(p + 12);
    const desplazamiento = fin.readUInt32LE(p + 16);
    if (cantidad === 0xffff || tamanoDelDirectorio === 0xffffffff || desplazamiento === 0xffffffff) throw new Error(`${basename(archivo)} es zip64: no lo sé leer`);
    const dir = Buffer.alloc(tamanoDelDirectorio);
    readSync(fd, dir, 0, tamanoDelDirectorio, desplazamiento);
    const entradas = [];
    let q = 0;
    for (let i = 0; i < cantidad; i++) {
      if (dir.readUInt32LE(q) !== 0x02014b50) throw new Error(`${basename(archivo)}: directorio central dañado en la entrada ${i}`);
      const largoNombre = dir.readUInt16LE(q + 28);
      const largoExtra = dir.readUInt16LE(q + 30);
      const largoComentario = dir.readUInt16LE(q + 32);
      entradas.push({ nombre: dir.toString('utf8', q + 46, q + 46 + largoNombre), crc: dir.readUInt32LE(q + 16), tamano: dir.readUInt32LE(q + 24) });
      q += 46 + largoNombre + largoExtra + largoComentario;
    }
    return entradas;
  } finally {
    closeSync(fd);
  }
}
