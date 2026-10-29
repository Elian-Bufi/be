/**
 * Busca credenciales dentro de un artefacto descomprimido (un AAB o una APK extraídos a una carpeta), por el nombre de
 * los archivos y por su contenido, sin devolver nunca lo encontrado: solo el archivo y el tipo de marcador.
 * WP-GOOGLE-PLAY-PRUEBAS-INTERNAS (2026-10-28; corregido tras la revisión adversaria: el bloque de firma JAR
 * `META-INF/*.RSA` ya no se confunde con un PKCS#12, los archivos grandes se recorren enteros por bloques, se buscan los
 * nombres de las variables de firma sueltos, el PEM en base64 y en UTF-16, los contenedores anidados y, si se piden,
 * los valores literales del respaldo). Lo prueba scripts/aab/verificar-aab.test.cjs con secretos sintéticos.
 */
import { closeSync, openSync, readdirSync, readSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Nombres de archivo que no tienen nada que hacer dentro de un artefacto publicado. */
export const NOMBRES_SOSPECHOSOS = [
  { patron: /(^|\/)credentials\.json$/i, marcador: 'credentials.json (credenciales de EAS)' },
  { patron: /\.(jks|keystore|p12|pfx|bks|bcfks|der)$/i, marcador: 'keystore, PKCS#12 o certificado binario' },
  { patron: /\.pem$/i, marcador: 'archivo PEM (clave o certificado): revisar' },
  { patron: /(^|\/)\.env(\.|$)/i, marcador: 'archivo .env' },
  { patron: /(^|\/)keystore\.properties$/i, marcador: 'keystore.properties' },
  { patron: /service[-_]?account.*\.json$/i, marcador: 'cuenta de servicio de Google' },
  { patron: /pepk.*\.zip$/i, marcador: 'salida de PEPK (clave de firma cifrada)' },
  { patron: /\.(zip|jar|aar|apk|apks)$/i, marcador: 'contenedor anidado: no revisado por dentro' },
];

/** Marcadores de contenido (texto en latin1): cada uno denuncia un secreto. Nunca se copia lo que sigue. */
export const MARCADORES_DE_CONTENIDO = [
  { marcador: 'clave privada PEM', patron: /-----BEGIN (?:RSA |EC |DSA |ENCRYPTED |OPENSSH |PGP )?PRIVATE KEY(?: BLOCK)?-----/ },
  // «-----BEGIN» y «PRIVATE KEY» en base64, en las tres alineaciones posibles de cada uno.
  { marcador: 'clave privada PEM en base64 (revisar)', patron: /(?:LS0tLS1CRUdJTi|0tLS0tQkVHSU4g|tLS0tLUJFR0lOI)[A-Za-z0-9+/]{0,40}(?:UFJJVkFURSBLRVk|BSSVZBVEUgS0VZ|QUklWQVRFIEtFW)/ },
  { marcador: 'credentials.json de EAS (keystorePassword / keyPassword)', patron: /"(?:keystorePassword|keyPassword|storePassword)"\s*:/ },
  { marcador: 'nombre de una variable de firma (BE_FIRMA_*)', patron: /BE_FIRMA_(?:KEYSTORE|KEY)(?:_PASSWORD|_ALIAS)?\b/ },
  { marcador: 'token de Expo o de GitHub', patron: /(?:\bEXPO_TOKEN\b|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{20,})/ },
  { marcador: 'cuenta de servicio de Google (private_key)', patron: /"type"\s*:\s*"service_account"[\s\S]{0,2000}"private_key"\s*:/ },
  { marcador: 'secreto de cliente OAuth', patron: /"client_secret"\s*:\s*"[^"]{8,}"/ },
  { marcador: 'clave de acceso de AWS', patron: /\bAKIA[0-9A-Z]{16}\b/ },
];

/** Firmas binarias al comienzo del archivo. */
const MAGICOS = [
  { marcador: 'keystore JKS', bytes: Buffer.from([0xfe, 0xed, 0xfe, 0xed]) },
  { marcador: 'keystore JCEKS', bytes: Buffer.from([0xce, 0xce, 0xce, 0xce]) },
  { marcador: 'contenedor comprimido anidado (zip): no revisado por dentro', bytes: Buffer.from([0x50, 0x4b, 0x03, 0x04]) },
];
const OID_PKCS7_DATA = Buffer.from([0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x07, 0x01]);
const PEM_UTF16 = Buffer.from('-----BEGIN ', 'utf16le');
const CLAVE_PRIVADA_UTF16 = Buffer.from('PRIVATE KEY', 'utf16le');

/** Por omisión, un archivo de hasta 64 MiB se lee entero; los más grandes, por bloques con solapamiento. */
export const LIMITE_DE_LECTURA = 64 * 1024 ** 2;
const BLOQUE = 8 * 1024 ** 2;
const SOLAPAMIENTO = 4096;

/**
 * ¿Es un PKCS#12 (PFX)? Un PFX es SEQUENCE { INTEGER 3, ContentInfo(data) … }: después del encabezado tiene que venir
 * `02 01 03` y enseguida el OID pkcs7-data. Un PKCS#7 SignedData (el bloque de firma JAR, META-INF/*.RSA) empieza con
 * SEQUENCE { OID signedData … } y no cumple: no es una credencial.
 */
export function pareceP12(buf) {
  if (buf.length < 16 || buf[0] !== 0x30) return false;
  let i;
  if (buf[1] === 0x80) i = 2;
  else if (buf[1] & 0x80) i = 2 + (buf[1] & 0x7f);
  else i = 2;
  if (!(buf[i] === 0x02 && buf[i + 1] === 0x01 && buf[i + 2] === 0x03)) return false;
  return buf.subarray(i + 3, i + 3 + 32).includes(OID_PKCS7_DATA);
}

/**
 * Recorre `carpeta` y devuelve { archivos, bytes, hallazgos: [{ archivo, marcador }] }. `archivo` es relativo a la
 * carpeta; el contenido que coincidió no se devuelve ni se registra. `valoresLiterales` (opcional) son valores secretos
 * que NO tienen que aparecer (por ejemplo, las contraseñas del respaldo): se buscan en latin1 y en UTF-16LE y solo se
 * informa que aparecieron, nunca cuáles.
 */
export function buscarCredenciales(carpeta, { limiteDeLectura = LIMITE_DE_LECTURA, valoresLiterales = [] } = {}) {
  const hallazgos = [];
  let archivos = 0;
  let bytes = 0;
  const literales = valoresLiterales.filter((v) => typeof v === 'string' && v.length >= 4).flatMap((v) => [Buffer.from(v, 'latin1'), Buffer.from(v, 'utf16le')]);
  const anotar = (archivo, marcador, vistos) => {
    if (vistos.has(marcador)) return;
    vistos.add(marcador);
    hallazgos.push({ archivo, marcador });
  };
  const revisarBloque = (buf, archivo, vistos, esElPrimero) => {
    if (esElPrimero) {
      for (const { marcador, bytes: magico } of MAGICOS) if (buf.length >= magico.length && buf.subarray(0, magico.length).equals(magico)) anotar(archivo, `contenido: ${marcador}`, vistos);
      if (pareceP12(buf)) anotar(archivo, 'contenido: PKCS#12', vistos);
    }
    const texto = buf.toString('latin1');
    for (const { marcador, patron } of MARCADORES_DE_CONTENIDO) if (patron.test(texto)) anotar(archivo, `contenido: ${marcador}`, vistos);
    if (buf.includes(PEM_UTF16) && buf.includes(CLAVE_PRIVADA_UTF16)) anotar(archivo, 'contenido: clave privada PEM (UTF-16)', vistos);
    for (const literal of literales) if (buf.includes(literal)) anotar(archivo, 'contenido: un valor secreto del respaldo (literal)', vistos);
  };
  const visitar = (dir) => {
    for (const nombre of readdirSync(dir)) {
      const ruta = join(dir, nombre);
      const st = statSync(ruta);
      if (st.isDirectory()) {
        visitar(ruta);
        continue;
      }
      archivos++;
      bytes += st.size;
      const relativa = relative(carpeta, ruta).replace(/\\/g, '/');
      const vistos = new Set();
      for (const { patron, marcador } of NOMBRES_SOSPECHOSOS) if (patron.test(relativa)) anotar(relativa, `nombre: ${marcador}`, vistos);
      if (st.size === 0) continue;
      const fd = openSync(ruta, 'r');
      try {
        if (st.size <= limiteDeLectura) {
          const buf = Buffer.alloc(st.size);
          readSync(fd, buf, 0, st.size, 0);
          revisarBloque(buf, relativa, vistos, true);
        } else {
          // Por bloques con solapamiento, para no cortar un marcador entre dos lecturas.
          const buf = Buffer.alloc(BLOQUE + SOLAPAMIENTO);
          let posicion = 0;
          let primero = true;
          while (posicion < st.size) {
            const leidos = readSync(fd, buf, 0, buf.length, posicion);
            if (leidos <= 0) break;
            revisarBloque(buf.subarray(0, leidos), relativa, vistos, primero);
            primero = false;
            if (posicion + leidos >= st.size) break;
            posicion += BLOQUE;
          }
        }
      } finally {
        closeSync(fd);
      }
    }
  };
  visitar(carpeta);
  return { archivos, bytes, hallazgos };
}
