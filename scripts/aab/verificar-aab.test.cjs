/**
 * Lo que el verificador del AAB tiene que detectar y cómo decide (WP-GOOGLE-PLAY-PRUEBAS-INTERNAS, corrección del
 * 2026-10-28, ampliada tras la revisión adversaria del mismo día):
 * - credenciales dentro de un archivo comprimido, por nombre y por contenido, SIN devolver ni imprimir lo encontrado
 *   (scripts/aab/credenciales.mjs), demostrado con secretos sintéticos metidos en un zip (escrito y extraído acá mismo,
 *   sin herramientas externas, para que corra igual en Windows y en la CI de Ubuntu); el bloque de firma JAR
 *   (META-INF/*.RSA, un PKCS#7 SignedData) NO es un secreto; un PKCS#12 sí; un zip anidado se denuncia; los archivos
 *   grandes se recorren enteros por bloques; los valores literales del respaldo se detectan sin escribirse;
 * - la alineación ELF de 16 KB (scripts/aab/elf.mjs): PT_LOAD y fin del RELRO, en 64 y 32 bits, little y big endian,
 *   y los ELF que no se pueden leer no se afirman;
 * - el esperado (scripts/aab/esperado.mjs): ningún campo puede faltar ni estar vacío, y «todo bien» exige que cada
 *   comprobación obligatoria haya dado true (una pendiente o un false lo impiden).
 *
 * **Lo que esto no prueba:** un AAB real, bundletool, keytool, jarsigner, zipalign ni Play.
 * Uso: node --test scripts/aab/verificar-aab.test.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const zlib = require('node:zlib');

const cargar = () => Promise.all([import('./credenciales.mjs'), import('./elf.mjs'), import('./esperado.mjs')]);

// ─── un zip mínimo, escrito y leído acá (entradas deflate; sin herramientas externas) ─────────────────────────

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = TABLA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

/** entradas: [{ nombre, datos }] → Buffer de un zip con cada entrada comprimida con deflate. */
function escribirZip(entradas) {
  const locales = [];
  const centrales = [];
  let desplazamiento = 0;
  for (const { nombre, datos } of entradas) {
    const nombreBuf = Buffer.from(nombre, 'utf8');
    const comprimido = zlib.deflateRawSync(datos);
    const crc = crc32(datos);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(0, 10);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comprimido.length, 18);
    local.writeUInt32LE(datos.length, 22);
    local.writeUInt16LE(nombreBuf.length, 26);
    local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(0, 12);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(comprimido.length, 20);
    central.writeUInt32LE(datos.length, 24);
    central.writeUInt16LE(nombreBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(desplazamiento, 42);
    locales.push(local, nombreBuf, comprimido);
    centrales.push(central, nombreBuf);
    desplazamiento += local.length + nombreBuf.length + comprimido.length;
  }
  const directorio = Buffer.concat(centrales);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(0, 4);
  fin.writeUInt16LE(0, 6);
  fin.writeUInt16LE(entradas.length, 8);
  fin.writeUInt16LE(entradas.length, 10);
  fin.writeUInt32LE(directorio.length, 12);
  fin.writeUInt32LE(desplazamiento, 16);
  fin.writeUInt16LE(0, 20);
  return Buffer.concat([...locales, directorio, fin]);
}

/** Extrae un zip (como el que escribe escribirZip) a una carpeta; devuelve los nombres extraídos. */
function extraerZip(zip, carpeta) {
  let fin = zip.length - 22;
  while (fin >= 0 && zip.readUInt32LE(fin) !== 0x06054b50) fin--;
  assert.ok(fin >= 0, 'el zip tiene fin de directorio central');
  const entradas = zip.readUInt16LE(fin + 10);
  let p = zip.readUInt32LE(fin + 16);
  const nombres = [];
  for (let i = 0; i < entradas; i++) {
    assert.equal(zip.readUInt32LE(p), 0x02014b50);
    const metodo = zip.readUInt16LE(p + 10);
    const csize = zip.readUInt32LE(p + 20);
    const nlen = zip.readUInt16LE(p + 28);
    const elen = zip.readUInt16LE(p + 30);
    const clen = zip.readUInt16LE(p + 32);
    const local = zip.readUInt32LE(p + 42);
    const nombre = zip.subarray(p + 46, p + 46 + nlen).toString('utf8');
    const datosDesde = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const comprimido = zip.subarray(datosDesde, datosDesde + csize);
    const datos = metodo === 8 ? zlib.inflateRawSync(comprimido) : comprimido;
    const destino = path.join(carpeta, ...nombre.split('/'));
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, datos);
    nombres.push(nombre);
    p += 46 + nlen + elen + clen;
  }
  return nombres;
}

// ─── secretos sintéticos: valores inventados, de nadie; ninguno tiene que aparecer en el resultado ─────────────

const SECRETOS = {
  pem: 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCx-SINTETICO-0001',
  keystorePassword: 'clave-sintetica-del-keystore-7781',
  firma: 'otra-clave-sintetica-de-firma-9932',
  expo: 'expo-token-sintetico-ab12cd34',
  cuentaDeServicio: 'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSk-SINTETICO-0002',
  utf16: 'clave-sintetica-en-utf16-5566',
};

/** Un PKCS#7 SignedData sintético, con la forma del bloque de firma JAR (META-INF/*.RSA): NO es un secreto. */
const SIGNED_DATA = Buffer.concat([Buffer.from([0x30, 0x82, 0x01, 0x00, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x07, 0x02, 0xa0, 0x82, 0x00, 0xf1]), Buffer.alloc(241, 0x5a)]);
/** Un PKCS#12 sintético (SEQUENCE { INTEGER 3, ContentInfo(pkcs7-data) … }): SÍ es un secreto. */
const PFX = Buffer.concat([Buffer.from([0x30, 0x82, 0x02, 0x00, 0x02, 0x01, 0x03, 0x30, 0x82, 0x01, 0xf0, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x07, 0x01, 0xa0, 0x82, 0x01, 0xe1]), Buffer.alloc(486, 0x5a)]);

const BLOQUE = 8 * 1024 ** 2;

function entradasConSecretos() {
  const grande = Buffer.alloc(BLOQUE + 64 * 1024, 0x20);
  // El marcador queda cortado justo por el límite del primer bloque: solo el solapamiento lo encuentra entero.
  grande.write('-----BEGIN PRIVATE KEY-----', BLOQUE - 10, 'latin1');
  return [
    // Limpios: la configuración embebida con identificadores públicos, una biblioteca cualquiera y la firma JAR.
    { nombre: 'base/assets/app.config', datos: Buffer.from(JSON.stringify({ extra: { appEnv: 'test', apiBaseUrl: 'https://be-api-hndp.onrender.com', googleWebClientId: '123-abc.apps.googleusercontent.com' } })) },
    { nombre: 'base/lib/arm64-v8a/libx.so', datos: Buffer.from('no es un ELF, es relleno') },
    { nombre: 'META-INF/BE.RSA', datos: SIGNED_DATA },
    { nombre: 'META-INF/MANIFEST.MF', datos: Buffer.from('Manifest-Version: 1.0\nName: base/assets/app.config\nSHA-256-Digest: AAAA\n') },
    // Con secretos sintéticos, por contenido (nombres inocentes) y por nombre.
    { nombre: 'base/assets/notas.txt', datos: Buffer.from(`-----BEGIN RSA PRIVATE KEY-----\n${SECRETOS.pem}\n-----END RSA PRIVATE KEY-----\n`) },
    { nombre: 'base/assets/config-vieja.json', datos: Buffer.from(JSON.stringify({ android: { keystore: { keystorePath: 'k.jks', keystorePassword: SECRETOS.keystorePassword, keyAlias: 'a', keyPassword: SECRETOS.keystorePassword } } })) },
    { nombre: 'base/assets/entorno.txt', datos: Buffer.from(`API_BASE_URL=https://x\nBE_FIRMA_KEYSTORE_PASSWORD=${SECRETOS.firma}\nEXPO_TOKEN=${SECRETOS.expo}\n`) },
    { nombre: 'base/assets/solo-nombres.txt', datos: Buffer.from('export BE_FIRMA_KEY_ALIAS\nexport EXPO_TOKEN\n') },
    { nombre: 'base/assets/cuenta.json', datos: Buffer.from(JSON.stringify({ type: 'service_account', project_id: 'x', private_key: `-----BEGIN PRIVATE KEY-----\n${SECRETOS.cuentaDeServicio}\n-----END PRIVATE KEY-----\n` })) },
    { nombre: 'base/assets/firma.jks', datos: Buffer.concat([Buffer.from([0xfe, 0xed, 0xfe, 0xed, 0x00, 0x00, 0x00, 0x02]), Buffer.from('relleno-sintetico')]) },
    { nombre: 'base/assets/clave.p12', datos: PFX },
    { nombre: 'base/assets/adjunto.zip', datos: escribirZip([{ nombre: 'adentro.txt', datos: Buffer.from('nada') }]) },
    { nombre: 'base/assets/en-utf16.txt', datos: Buffer.from(`-----BEGIN PRIVATE KEY-----\n${SECRETOS.utf16}\n-----END PRIVATE KEY-----\n`, 'utf16le') },
    { nombre: 'base/assets/en-base64.txt', datos: Buffer.from(Buffer.from(`xx-----BEGIN EC PRIVATE KEY-----\n${SECRETOS.pem}\n`).toString('base64')) },
    { nombre: 'base/assets/grande.bin', datos: grande },
    { nombre: 'credentials.json', datos: Buffer.from('{"android":{}}') },
  ];
}

test('detecta credenciales sintéticas dentro de un zip, por nombre y por contenido, sin devolver lo encontrado', async () => {
  const [{ buscarCredenciales }] = await cargar();
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'be-credenciales-'));
  try {
    const entradas = entradasConSecretos();
    const zip = escribirZip(entradas);
    const extraido = path.join(carpeta, 'extraido');
    fs.mkdirSync(extraido);
    assert.equal(extraerZip(zip, extraido).length, entradas.length);
    const r = buscarCredenciales(extraido, { limiteDeLectura: 1024 ** 2, valoresLiterales: [SECRETOS.keystorePassword, SECRETOS.utf16] });
    const porArchivo = (archivo) => r.hallazgos.filter((h) => h.archivo === archivo).map((h) => h.marcador);
    assert.ok(porArchivo('base/assets/notas.txt').some((m) => /clave privada PEM/.test(m)), 'la clave PEM con nombre inocente');
    assert.ok(porArchivo('base/assets/config-vieja.json').some((m) => /credentials\.json de EAS/.test(m)), 'las contraseñas del keystore en un JSON cualquiera');
    assert.ok(porArchivo('base/assets/config-vieja.json').some((m) => /valor secreto del respaldo/.test(m)), 'el valor literal del respaldo, en latin1');
    assert.ok(porArchivo('base/assets/entorno.txt').some((m) => /variable de firma/.test(m)), 'BE_FIRMA_*_PASSWORD=');
    assert.ok(porArchivo('base/assets/entorno.txt').some((m) => /token de Expo/.test(m)), 'EXPO_TOKEN=');
    assert.ok(porArchivo('base/assets/solo-nombres.txt').some((m) => /variable de firma/.test(m)), 'el nombre de la variable de firma, sin valor');
    assert.ok(porArchivo('base/assets/solo-nombres.txt').some((m) => /token de Expo/.test(m)), 'EXPO_TOKEN sin valor');
    assert.ok(porArchivo('base/assets/cuenta.json').some((m) => /cuenta de servicio/.test(m)), 'la cuenta de servicio de Google');
    assert.ok(porArchivo('base/assets/firma.jks').some((m) => /keystore JKS/.test(m)), 'el keystore por su firma binaria');
    assert.ok(porArchivo('base/assets/firma.jks').some((m) => /^nombre:/.test(m)), 'y por su nombre');
    assert.ok(porArchivo('base/assets/clave.p12').some((m) => /PKCS#12/.test(m)), 'el PKCS#12 por su estructura');
    assert.ok(porArchivo('base/assets/adjunto.zip').some((m) => /^nombre: contenedor anidado/.test(m)), 'el zip anidado por su nombre');
    assert.ok(porArchivo('base/assets/adjunto.zip').some((m) => /^contenido: contenedor comprimido anidado/.test(m)), 'y por su firma binaria');
    assert.ok(porArchivo('base/assets/en-utf16.txt').some((m) => /PEM \(UTF-16\)/.test(m)), 'la clave PEM escrita en UTF-16');
    assert.ok(porArchivo('base/assets/en-utf16.txt').some((m) => /valor secreto del respaldo/.test(m)), 'el valor literal del respaldo, en UTF-16');
    assert.ok(porArchivo('base/assets/en-base64.txt').some((m) => /PEM en base64/.test(m)), 'la clave PEM codificada en base64');
    assert.ok(porArchivo('base/assets/grande.bin').some((m) => /clave privada PEM/.test(m)), 'un archivo mayor que el límite se recorre entero, con el marcador cortado por un bloque');
    assert.ok(porArchivo('credentials.json').some((m) => /^nombre: credentials\.json/.test(m)), 'credentials.json por su nombre');
    assert.deepEqual(porArchivo('base/assets/app.config'), [], 'la configuración embebida es limpia');
    assert.deepEqual(porArchivo('base/lib/arm64-v8a/libx.so'), [], 'la biblioteca es limpia');
    assert.deepEqual(porArchivo('META-INF/BE.RSA'), [], 'el bloque de firma JAR (PKCS#7 SignedData) no es un secreto: si lo fuera, ningún AAB firmado daría bien');
    assert.deepEqual(porArchivo('META-INF/MANIFEST.MF'), [], 'el manifiesto de la firma es limpio');
    // Nada de lo encontrado viaja en el resultado.
    const texto = JSON.stringify(r);
    for (const [nombre, valor] of Object.entries(SECRETOS)) assert.ok(!texto.includes(valor), `el resultado no contiene el secreto sintético «${nombre}»`);
    assert.equal(r.archivos, entradas.length);
    assert.equal(r.bytes, entradas.reduce((s, e) => s + e.datos.length, 0));
  } finally {
    fs.rmSync(carpeta, { recursive: true, force: true });
  }
});

test('un PKCS#7 SignedData (la firma JAR) no se confunde con un PKCS#12', async () => {
  const [{ pareceP12 }] = await cargar();
  assert.equal(pareceP12(SIGNED_DATA), false);
  assert.equal(pareceP12(PFX), true);
  assert.equal(pareceP12(Buffer.from('30 no es DER')), false);
  assert.equal(pareceP12(Buffer.alloc(4)), false);
});

// ─── ELF sintéticos ───────────────────────────────────────────────────────────────────────────────────────────

/** Un ELF sintético: cabecera y segmentos; `segmentos` = [{ tipo, align, vaddr, memsz, flags, offset }] (offset = vaddr por omisión). */
function elfSintetico({ bits = 64, le = true, segmentos = [], phnum, phoff }) {
  const phentsize = bits === 64 ? 56 : 32;
  const ehsize = bits === 64 ? 64 : 52;
  const buf = Buffer.alloc(ehsize + phentsize * segmentos.length);
  const w16 = (v, o) => (le ? buf.writeUInt16LE(v, o) : buf.writeUInt16BE(v, o));
  const w32 = (v, o) => (le ? buf.writeUInt32LE(v, o) : buf.writeUInt32BE(v, o));
  const w64 = (v, o) => (le ? buf.writeBigUInt64LE(BigInt(v), o) : buf.writeBigUInt64BE(BigInt(v), o));
  buf.writeUInt32BE(0x7f454c46, 0);
  buf[4] = bits === 64 ? 2 : 1;
  buf[5] = le ? 1 : 2;
  buf[6] = 1;
  if (bits === 64) {
    w64(phoff ?? ehsize, 32);
    w16(phentsize, 54);
    w16(phnum ?? segmentos.length, 56);
  } else {
    w32(phoff ?? ehsize, 28);
    w16(phentsize, 42);
    w16(phnum ?? segmentos.length, 44);
  }
  segmentos.forEach(({ tipo = 1, align = 0, vaddr = 0, memsz = 0, flags = R, offset = vaddr }, i) => {
    const o = ehsize + i * phentsize;
    w32(tipo, o);
    if (bits === 64) {
      w32(flags, o + 4);
      w64(offset, o + 8);
      w64(vaddr, o + 16);
      w64(memsz, o + 40);
      w64(align, o + 48);
    } else {
      w32(offset, o + 4);
      w32(vaddr, o + 8);
      w32(memsz, o + 20);
      w32(flags, o + 24);
      w32(align, o + 28);
    }
  });
  return buf;
}
const PT_GNU_RELRO = 0x6474e552;
const [X, W, R] = [1, 2, 4];
const K16 = 16384;

test('la alineación ELF de 16 KB: PT_LOAD, segmentos en páginas propias y RELRO, en 64 y 32 bits, little y big endian', async () => {
  const [, { cargasDeElf, alineadaA16Kb, PAGINA_DE_16_KB }] = await cargar();
  assert.equal(PAGINA_DE_16_KB, 16384);
  const bien = elfSintetico({ segmentos: [{ align: K16, vaddr: 0, memsz: 0x4000 }, { align: K16, vaddr: 0x20000, memsz: 0x4000, flags: R | W }, { tipo: PT_GNU_RELRO, vaddr: 0x20000, memsz: 0x4000 }] });
  const leido = cargasDeElf(bien);
  assert.deepEqual([leido.bits, leido.alineaciones, leido.relro], [64, [K16, K16], { vaddr: 0x20000, memsz: 0x4000 }]);
  assert.deepEqual(leido.cargas[1], { flags: R | W, offset: 0x20000, vaddr: 0x20000, memsz: 0x4000, align: K16 });
  assert.equal(alineadaA16Kb(bien).alineada, true);
  assert.equal(alineadaA16Kb(elfSintetico({ segmentos: [{ align: K16 }, { align: 4096, vaddr: 0x8000 }] })).alineada, false, 'un segmento a 4 KB alcanza para no cumplir');
  assert.equal(alineadaA16Kb(elfSintetico({ segmentos: [{ align: 65536 }] })).alineada, true, 'múltiplos de 16 KB cumplen');
  assert.equal(alineadaA16Kb(elfSintetico({ segmentos: [{ align: K16, vaddr: 0x24000, offset: 0x21000, memsz: 0x100 }] })).cargasAlineadas, false, 'dirección y desplazamiento distintos módulo 16 KB: no se puede mapear');

  // La forma real de arm64-v8a/libc++_shared.so del primer AAB (llvm-readelf, 29/10): lld termina el RELRO a 4 KB
  // (0x143000) y pone los datos siguientes en otra página de 16 KB (0x146e40). Cumple; la regla vieja decía «MAL».
  const libcxx = elfSintetico({
    segmentos: [
      { align: K16, offset: 0, vaddr: 0, memsz: 0x9aca8, flags: R },
      { align: K16, offset: 0x9acb0, vaddr: 0x9ecb0, memsz: 0x96640, flags: R | X },
      { align: K16, offset: 0x1312f0, vaddr: 0x1392f0, memsz: 0x9d10, flags: R | W },
      { align: K16, offset: 0x13ae40, vaddr: 0x146e40, memsz: 0x7d10, flags: R | W },
      { tipo: PT_GNU_RELRO, vaddr: 0x1392f0, memsz: 0x9d10 },
    ],
  });
  const real = alineadaA16Kb(libcxx);
  assert.notEqual((0x1392f0 + 0x9d10) % K16, 0, 'el final del RELRO no es múltiplo de 16 KB');
  assert.deepEqual([real.cargasAlineadas, real.paginasPropias, real.relroSeguro, real.alineada], [true, true, true, true], 'y cumple');

  // Al estilo de GNU ld: un solo segmento escribible con el RELRO al principio y .data a continuación en la misma
  // página de 16 KB. Android volvería .data de solo lectura: no cumple.
  const relroMal = alineadaA16Kb(elfSintetico({ segmentos: [{ align: K16, vaddr: 0, memsz: 0x4000, flags: R | X }, { align: K16, vaddr: 0x20000, memsz: 0x6000, flags: R | W }, { tipo: PT_GNU_RELRO, vaddr: 0x20000, memsz: 0x1000 }] }));
  assert.deepEqual([relroMal.cargasAlineadas, relroMal.paginasPropias, relroMal.relroSeguro, relroMal.alineada], [true, true, false, false], 'datos escribibles en una página del RELRO');
  // El mismo RELRO a 4 KB, pero sin datos después en esa página: cumple.
  assert.equal(alineadaA16Kb(elfSintetico({ segmentos: [{ align: K16, vaddr: 0x20000, memsz: 0x1000, flags: R | W }, { tipo: PT_GNU_RELRO, vaddr: 0x20000, memsz: 0x1000 }] })).relroSeguro, true);
  // Dos segmentos que comparten una página de 16 KB (enlazado para 4 KB): no cumple aunque declare 16 KB.
  const compartida = alineadaA16Kb(elfSintetico({ segmentos: [{ align: K16, vaddr: 0, memsz: 0x5000, flags: R }, { align: K16, vaddr: 0x6000, memsz: 0x1000, flags: R | X }] }));
  assert.deepEqual([compartida.cargasAlineadas, compartida.paginasPropias, compartida.alineada], [true, false, false]);

  const sinRelro = alineadaA16Kb(elfSintetico({ segmentos: [{ align: K16 }] }));
  assert.equal(sinRelro.relroSeguro, null);
  assert.equal(sinRelro.alineada, true, 'sin RELRO, deciden las cargas');
  const de32 = cargasDeElf(elfSintetico({ bits: 32, segmentos: [{ align: 4096, vaddr: 0x1000, offset: 0x1000, memsz: 0x10, flags: R | W }] }));
  assert.deepEqual([de32.bits, de32.alineaciones, de32.relro, de32.cargas[0]], [32, [4096], null, { flags: R | W, offset: 0x1000, vaddr: 0x1000, memsz: 0x10, align: 4096 }], '32 bits, con su orden de campos');
  const be = cargasDeElf(elfSintetico({ bits: 64, le: false, segmentos: [{ align: K16, flags: R | X }, { tipo: PT_GNU_RELRO, vaddr: 0x4000, memsz: 0x4000 }] }));
  assert.deepEqual([be.alineaciones, be.relro, be.cargas[0].flags], [[K16], { vaddr: 0x4000, memsz: 0x4000 }, R | X], 'big endian');
  assert.equal(alineadaA16Kb(elfSintetico({ segmentos: [] })).alineada, false, 'sin segmentos de carga no se afirma nada');
  assert.equal(cargasDeElf(elfSintetico({ segmentos: [{ align: 16384 }], phnum: 0xffff })), null, 'PN_XNUM no se lee: no se afirma nada');
  assert.equal(cargasDeElf(elfSintetico({ segmentos: [{ align: 16384 }], phoff: 4096 })), null, 'tabla de programa fuera del archivo');
  const eiDataMal = elfSintetico({ segmentos: [{ align: 16384 }] });
  eiDataMal[5] = 7;
  assert.equal(cargasDeElf(eiDataMal), null, 'EI_DATA inválido');
  assert.equal(cargasDeElf(Buffer.from('no es un ELF, es relleno')), null);
});

// ─── el esperado y el veredicto ───────────────────────────────────────────────────────────────────────────────

const ESPERADO_VALIDO = {
  paquete: 'com.elianbufi.be',
  version: '0.18.0-candidata.2',
  versionCode: 31,
  commit: 'b6ea7c3a0b1c2d3e4f5061728394a5b6c7d8e9f0',
  arbolLimpio: true,
  appEnv: 'test',
  apiBaseUrl: 'https://be-api-hndp.onrender.com',
  webBaseUrl: 'https://be-web-1ngj.onrender.com',
  googleWebClientId: '123456789012-abcdefghijklmnopqrstuvwxyz012345.apps.googleusercontent.com',
  sinGoogleAProposito: false,
  firebaseProjectId: 'be-app-c4623',
  sinFirebaseAProposito: false,
  certSubidaSha256: '61:56:96:91:BD:47:30:0F:C1:8F:32:C3:7A:84:80:FF:A5:1E:C5:4E:96:47:B6:12:5A:F4:40:53:5C:89:3E:06',
  certFirmaAppSha256: '61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06',
};

test('el esperado: ningún campo puede faltar ni estar vacío, y las huellas se normalizan', async () => {
  const [, , { validarEsperado, CAMPOS_ESPERADOS }] = await cargar();
  const E = validarEsperado(ESPERADO_VALIDO);
  assert.equal(E.certSubidaSha256, '61569691bd47300fc18f32c37a8480ffa51ec54e9647b6125af440535c893e06', 'con dos puntos y mayúsculas, como lo imprime keytool');
  assert.equal(E.certFirmaAppSha256, E.certSubidaSha256);
  for (const campo of CAMPOS_ESPERADOS) {
    const sin = { ...ESPERADO_VALIDO };
    delete sin[campo];
    assert.throws(() => validarEsperado(sin), new RegExp(`sin ${campo}`), `falta ${campo}`);
    assert.throws(() => validarEsperado({ ...ESPERADO_VALIDO, [campo]: null }), /inválido/, `${campo} en null`);
  }
  for (const campo of ['paquete', 'version', 'appEnv', 'apiBaseUrl', 'webBaseUrl', 'commit', 'firebaseProjectId', 'googleWebClientId', 'certSubidaSha256']) assert.throws(() => validarEsperado({ ...ESPERADO_VALIDO, [campo]: '' }), /inválido/, `${campo} vacío`);
  assert.throws(() => validarEsperado({ ...ESPERADO_VALIDO, versionCode: 0 }), /versionCode/);
  assert.throws(() => validarEsperado({ ...ESPERADO_VALIDO, versionCode: '31' }), /versionCode/);
  assert.throws(() => validarEsperado({ ...ESPERADO_VALIDO, commit: 'b6ea7c3' }), /SHA completo/);
  assert.throws(() => validarEsperado({ ...ESPERADO_VALIDO, apiBaseUrl: 'http://be-api-hndp.onrender.com' }), /https/);
  assert.throws(() => validarEsperado({ ...ESPERADO_VALIDO, googleWebClientId: 'cualquier-cosa' }), /client ID web/);
  assert.throws(() => validarEsperado({ ...ESPERADO_VALIDO, sinGoogleAProposito: true }), /googleWebClientId tiene que ser null/, 'sin Google a propósito, el client ID no puede estar');
  assert.throws(() => validarEsperado({ ...ESPERADO_VALIDO, sinFirebaseAProposito: true }), /firebaseProjectId tiene que ser null/);
  assert.throws(() => validarEsperado({ ...ESPERADO_VALIDO, certFirmaAppSha256: 'b108ec55' }), /huella SHA-256/);
  assert.throws(() => validarEsperado({ ...ESPERADO_VALIDO, arbolLimpio: 'sí' }), /arbolLimpio/);
  assert.equal(validarEsperado({ ...ESPERADO_VALIDO, sinGoogleAProposito: true, googleWebClientId: null }).sinGoogleAProposito, true, 'sin Google a propósito, declarado');
});

test('el veredicto: «todo bien» solo si hay comprobaciones y cada una dio true', async () => {
  const [, , { resumirVeredicto }] = await cargar();
  assert.deepEqual(resumirVeredicto({}), { todoBien: false, pendientes: [], fallidos: [] }, 'sin comprobaciones no hay «todo bien»');
  assert.deepEqual(resumirVeredicto({ a: true, b: true }), { todoBien: true, pendientes: [], fallidos: [] });
  assert.deepEqual(resumirVeredicto({ a: true, b: 'pendiente' }), { todoBien: false, pendientes: ['b'], fallidos: [] }, 'una pendiente impide «todo bien»');
  assert.deepEqual(resumirVeredicto({ a: true, b: false, c: null, d: undefined }), { todoBien: false, pendientes: [], fallidos: ['b', 'c', 'd'] }, 'false, null y undefined son fallos');
});

// ─── jarsigner -verify -strict con una clave de Android (autofirmada) ─────────────────────────────────────────

/** Lo que imprimió jarsigner -strict el 2026-10-29 sobre el primer AAB firmado (salió con 4). */
const CADENA_PKIX = 'This jar contains entries whose certificate chain is invalid. Reason: PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target';
const salidaStrict = (errores, avisos = ['This jar contains signatures that do not include a timestamp. Without a timestamp, users may not be able to validate this jar after any of the signer certificates expire (as early as 2053-01-01).']) =>
  ['jar verified, with signer errors.', '', 'Error:', ...errores, '', 'Warning:', ...avisos, '', 'Re-run with the -verbose and -certs options for more details.'].join('\n');
/** keytool -printcert -jarfile, con nombres sintéticos. */
const keytoolCon = ({ owner = 'CN=Prueba, O=BE, C=AR', issuer = owner, certificados = 1 } = {}) =>
  ['Signer #1:', '', ...Array.from({ length: certificados }, (_, i) => [`Certificate #${i + 1}:`, `Owner: ${owner}`, `Issuer: ${issuer}`, 'Serial number: 1', 'Certificate fingerprints:', '\t SHA256: AA:BB', '']).flat()].join('\n');

test('el certificado autofirmado: un firmante, un certificado, Owner igual a Issuer', async () => {
  const [, , { esAutofirmado }] = await cargar();
  assert.equal(esAutofirmado(keytoolCon()), true);
  assert.equal(esAutofirmado(keytoolCon({ issuer: 'CN=Una autoridad, O=Otra, C=US' })), false, 'emitido por otro');
  assert.equal(esAutofirmado(keytoolCon({ certificados: 2 })), false, 'una cadena de dos');
  assert.equal(esAutofirmado(''), false, 'sin salida no se afirma');
});

test('jarsigner -strict: se acepta la cadena de un certificado autofirmado, y ningún otro aviso grave', async () => {
  const [, , { evaluarVerificacionJar }] = await cargar();
  const ok = (codigo, salida, autofirmado = true) => evaluarVerificacionJar({ codigo, salida, autofirmado }).ok;
  assert.equal(ok(4, salidaStrict([CADENA_PKIX])), true, 'lo real del 29/10: código 4, solo la cadena PKIX, autofirmado');
  assert.equal(ok(0, 'jar verified.'), true, 'sin avisos graves');
  assert.equal(ok(4, salidaStrict([CADENA_PKIX]), false), false, 'la cadena no valida y el certificado no es autofirmado');
  assert.equal(ok(20, salidaStrict([CADENA_PKIX, 'This jar contains unsigned entries which have not been integrity-checked.'])), false, 'entradas sin firmar (bit 16)');
  assert.equal(ok(4, salidaStrict([CADENA_PKIX, 'This jar contains entries whose signer certificate has expired.'])), false, 'el bit 4 también es «vencido»: se mira el texto');
  assert.equal(ok(4, salidaStrict([CADENA_PKIX, 'This jar contains entries signed with SHA1withRSA, which is considered a security risk and is disabled.'])), false, 'el bit 4 también es «algoritmo deshabilitado»');
  assert.equal(ok(4, 'jar verified, with signer errors.'), false, 'código 4 sin decir por qué');
  assert.equal(ok(8, salidaStrict(['This jar contains entries whose signer certificate KeyUsage extension does not allow code signing.'])), false, 'uso de clave (bit 8)');
  assert.equal(ok(0, 'jar is unsigned.'), false, 'sin firma');
  assert.equal(ok(1, 'jarsigner: java.lang.SecurityException: SHA-256 digest error for base/dex/classes.dex'), false, 'un resumen que no coincide');
});
