/**
 * Lo que el verificador del AAB tiene que detectar (WP-GOOGLE-PLAY-PRUEBAS-INTERNAS, corrección del 2026-10-28):
 * - credenciales dentro de un archivo comprimido, por nombre y por contenido, SIN devolver ni imprimir lo encontrado
 *   (scripts/aab/credenciales.mjs), demostrado con secretos sintéticos metidos en un zip y extraídos como hace el verificador;
 * - la alineación ELF de 16 KB de los segmentos de carga (scripts/aab/elf.mjs), con ELF sintéticos de 64 y 32 bits.
 *
 * **Lo que esto no prueba:** un AAB real, bundletool, keytool ni Play. Uso: node --test scripts/aab/verificar-aab.test.cjs
 */
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const cargar = () => Promise.all([import('./credenciales.mjs'), import('./elf.mjs')]);
const tar = path.join(process.env.SystemRoot ?? 'C:/Windows', 'System32', 'tar.exe');

// Secretos sintéticos: no son credenciales de nadie (valores inventados) y ninguno tiene que aparecer en el resultado.
const SECRETOS = {
  pem: 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCx-SINTETICO-0001',
  keystorePassword: 'clave-sintetica-del-keystore-7781',
  firma: 'otra-clave-sintetica-de-firma-9932',
  expo: 'expo-token-sintetico-ab12cd34',
  cuentaDeServicio: 'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSk-SINTETICO-0002',
};

function armarZipConSecretos(carpeta) {
  const origen = path.join(carpeta, 'origen');
  fs.mkdirSync(path.join(origen, 'base', 'assets'), { recursive: true });
  fs.mkdirSync(path.join(origen, 'base', 'lib', 'arm64-v8a'), { recursive: true });
  // Limpios: la configuración embebida con identificadores públicos y una biblioteca cualquiera.
  fs.writeFileSync(path.join(origen, 'base', 'assets', 'app.config'), JSON.stringify({ extra: { appEnv: 'test', apiBaseUrl: 'https://be-api-hndp.onrender.com', googleWebClientId: '123-abc.apps.googleusercontent.com' } }));
  fs.writeFileSync(path.join(origen, 'base', 'lib', 'arm64-v8a', 'libx.so'), Buffer.from('no es un ELF, es relleno'));
  // Con secretos sintéticos, por contenido (nombres inocentes) y por nombre.
  fs.writeFileSync(path.join(origen, 'base', 'assets', 'notas.txt'), `-----BEGIN RSA PRIVATE KEY-----\n${SECRETOS.pem}\n-----END RSA PRIVATE KEY-----\n`);
  fs.writeFileSync(path.join(origen, 'base', 'assets', 'config-vieja.json'), JSON.stringify({ android: { keystore: { keystorePath: 'k.jks', keystorePassword: SECRETOS.keystorePassword, keyAlias: 'a', keyPassword: SECRETOS.keystorePassword } } }));
  fs.writeFileSync(path.join(origen, 'base', 'assets', 'entorno.txt'), `API_BASE_URL=https://x\nBE_FIRMA_KEYSTORE_PASSWORD=${SECRETOS.firma}\nEXPO_TOKEN=${SECRETOS.expo}\n`);
  fs.writeFileSync(path.join(origen, 'base', 'assets', 'cuenta.json'), JSON.stringify({ type: 'service_account', project_id: 'x', private_key: `-----BEGIN PRIVATE KEY-----\n${SECRETOS.cuentaDeServicio}\n-----END PRIVATE KEY-----\n` }));
  fs.writeFileSync(path.join(origen, 'base', 'assets', 'firma.jks'), Buffer.concat([Buffer.from([0xfe, 0xed, 0xfe, 0xed, 0x00, 0x00, 0x00, 0x02]), Buffer.from('relleno-sintetico')]));
  fs.writeFileSync(path.join(origen, 'credentials.json'), '{"android":{}}');
  const zip = path.join(carpeta, 'artefacto.zip');
  const r = spawnSync(tar, ['-a', '-c', '-f', zip, '-C', origen, '.'], { encoding: 'utf8' });
  assert.equal(r.status, 0, `tar no pudo crear el zip: ${r.stderr}`);
  return zip;
}

test('detecta credenciales sintéticas dentro de un zip, por nombre y por contenido, sin devolver lo encontrado', async () => {
  const [{ buscarCredenciales }] = await cargar();
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'be-credenciales-'));
  try {
    const zip = armarZipConSecretos(carpeta);
    const extraido = path.join(carpeta, 'extraido');
    fs.mkdirSync(extraido);
    assert.equal(spawnSync(tar, ['-xf', zip, '-C', extraido]).status, 0);
    const r = buscarCredenciales(extraido);
    const porArchivo = (archivo) => r.hallazgos.filter((h) => h.archivo === archivo).map((h) => h.marcador);
    assert.ok(porArchivo('base/assets/notas.txt').some((m) => /clave privada PEM/.test(m)), 'la clave PEM con nombre inocente');
    assert.ok(porArchivo('base/assets/config-vieja.json').some((m) => /credentials\.json de EAS/.test(m)), 'las contraseñas del keystore en un JSON cualquiera');
    assert.ok(porArchivo('base/assets/entorno.txt').some((m) => /contraseña de firma/.test(m)), 'BE_FIRMA_*_PASSWORD=');
    assert.ok(porArchivo('base/assets/entorno.txt').some((m) => /token de Expo/.test(m)), 'EXPO_TOKEN=');
    assert.ok(porArchivo('base/assets/cuenta.json').some((m) => /cuenta de servicio/.test(m)), 'la cuenta de servicio de Google');
    assert.ok(porArchivo('base/assets/firma.jks').some((m) => /keystore JKS/.test(m)), 'el keystore por su firma binaria');
    assert.ok(porArchivo('base/assets/firma.jks').some((m) => /^nombre:/.test(m)), 'y por su nombre');
    assert.ok(porArchivo('credentials.json').some((m) => /^nombre: credentials\.json/.test(m)), 'credentials.json por su nombre');
    assert.deepEqual(porArchivo('base/assets/app.config'), [], 'la configuración embebida es limpia');
    assert.deepEqual(porArchivo('base/lib/arm64-v8a/libx.so'), [], 'la biblioteca es limpia');
    // Nada de lo encontrado viaja en el resultado.
    const texto = JSON.stringify(r);
    for (const [nombre, valor] of Object.entries(SECRETOS)) assert.ok(!texto.includes(valor), `el resultado no contiene el secreto sintético «${nombre}»`);
    assert.equal(r.archivos, 8);
  } finally {
    fs.rmSync(carpeta, { recursive: true, force: true });
  }
});

/** Un ELF sintético: cabecera y segmentos PT_LOAD con la alineación pedida. */
function elfSintetico(bits, alineaciones) {
  const le = true;
  const phentsize = bits === 64 ? 56 : 32;
  const ehsize = bits === 64 ? 64 : 52;
  const buf = Buffer.alloc(ehsize + phentsize * alineaciones.length);
  buf.writeUInt32BE(0x7f454c46, 0);
  buf[4] = bits === 64 ? 2 : 1;
  buf[5] = le ? 1 : 2;
  buf[6] = 1;
  if (bits === 64) {
    buf.writeBigUInt64LE(BigInt(ehsize), 32);
    buf.writeUInt16LE(phentsize, 54);
    buf.writeUInt16LE(alineaciones.length, 56);
  } else {
    buf.writeUInt32LE(ehsize, 28);
    buf.writeUInt16LE(phentsize, 42);
    buf.writeUInt16LE(alineaciones.length, 44);
  }
  alineaciones.forEach((a, i) => {
    const o = ehsize + i * phentsize;
    buf.writeUInt32LE(1, o); // PT_LOAD
    if (bits === 64) buf.writeBigUInt64LE(BigInt(a), o + 48);
    else buf.writeUInt32LE(a, o + 28);
  });
  return buf;
}

test('la alineación ELF de 16 KB: lee los PT_LOAD y distingue 4 KB de 16 KB, en 64 y 32 bits', async () => {
  const [, { cargasDeElf, alineadaA16Kb, PAGINA_DE_16_KB }] = await cargar();
  assert.equal(PAGINA_DE_16_KB, 16384);
  assert.deepEqual(cargasDeElf(elfSintetico(64, [16384, 16384])), { bits: 64, alineaciones: [16384, 16384] });
  assert.equal(alineadaA16Kb(elfSintetico(64, [16384, 16384])).alineada, true);
  assert.equal(alineadaA16Kb(elfSintetico(64, [16384, 4096])).alineada, false, 'un segmento a 4 KB alcanza para no cumplir');
  assert.equal(alineadaA16Kb(elfSintetico(64, [65536])).alineada, true, 'múltiplos de 16 KB cumplen');
  assert.deepEqual(cargasDeElf(elfSintetico(32, [4096])), { bits: 32, alineaciones: [4096] });
  assert.equal(alineadaA16Kb(elfSintetico(64, [])).alineada, false, 'sin segmentos de carga no se afirma nada');
  assert.equal(cargasDeElf(Buffer.from('no es un ELF, es relleno')), null);
});
