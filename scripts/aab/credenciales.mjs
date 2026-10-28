/**
 * Busca credenciales dentro de un artefacto descomprimido (un AAB o una APK extraídos a una carpeta), por el nombre de
 * los archivos y por su contenido, sin devolver nunca lo encontrado: solo el archivo y el tipo de marcador.
 * WP-GOOGLE-PLAY-PRUEBAS-INTERNAS (2026-10-28). Lo prueba scripts/aab/verificar-aab.test.cjs con secretos sintéticos.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Nombres de archivo que no tienen nada que hacer dentro de un artefacto publicado. */
export const NOMBRES_SOSPECHOSOS = [
  { patron: /(^|\/)credentials\.json$/i, marcador: 'credentials.json (credenciales de EAS)' },
  { patron: /\.(jks|keystore|p12|pfx)$/i, marcador: 'keystore o PKCS#12' },
  { patron: /\.pem$/i, marcador: 'archivo PEM (clave o certificado): revisar' },
  { patron: /(^|\/)\.env(\.|$)/i, marcador: 'archivo .env' },
  { patron: /(^|\/)keystore\.properties$/i, marcador: 'keystore.properties' },
  { patron: /service[-_]?account.*\.json$/i, marcador: 'cuenta de servicio de Google' },
  { patron: /pepk.*\.zip$/i, marcador: 'salida de PEPK (clave de firma cifrada)' },
];

/** Marcadores de contenido: cada uno es un buffer o una expresión que denuncia un secreto. Nunca se copia lo que sigue. */
export const MARCADORES_DE_CONTENIDO = [
  { marcador: 'clave privada PEM', patron: /-----BEGIN (?:RSA |EC |DSA |ENCRYPTED |OPENSSH |PGP )?PRIVATE KEY(?: BLOCK)?-----/ },
  { marcador: 'credentials.json de EAS (keystorePassword / keyPassword)', patron: /"(?:keystorePassword|keyPassword|storePassword)"\s*:/ },
  { marcador: 'variable de entorno con una contraseña de firma', patron: /BE_FIRMA_(?:KEYSTORE_PASSWORD|KEY_PASSWORD)\s*=/ },
  { marcador: 'token de Expo o de GitHub', patron: /(?:EXPO_TOKEN\s*=|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{20,})/ },
  { marcador: 'cuenta de servicio de Google (private_key)', patron: /"type"\s*:\s*"service_account"[\s\S]{0,2000}"private_key"\s*:/ },
  { marcador: 'secreto de cliente OAuth', patron: /"client_secret"\s*:\s*"[^"]{8,}"/ },
  { marcador: 'clave de acceso de AWS', patron: /\bAKIA[0-9A-Z]{16}\b/ },
];

/** Firmas binarias al comienzo del archivo. */
const MAGICOS = [
  { marcador: 'keystore JKS', bytes: Buffer.from([0xfe, 0xed, 0xfe, 0xed]) },
  { marcador: 'keystore JCEKS', bytes: Buffer.from([0xce, 0xce, 0xce, 0xce]) },
];
const OID_PKCS7_DATA = Buffer.from([0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x07, 0x01]);

/** Qué archivos se leen enteros: los demás solo por su nombre y sus primeros bytes. */
const LIMITE_DE_LECTURA = 64 * 1024 ** 2;

/**
 * Recorre `carpeta` y devuelve [{ archivo, marcador }] por cada hallazgo. `archivo` es relativo a la carpeta; el
 * contenido que coincidió no se devuelve ni se registra.
 */
export function buscarCredenciales(carpeta) {
  const hallazgos = [];
  let archivos = 0;
  let bytes = 0;
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
      for (const { patron, marcador } of NOMBRES_SOSPECHOSOS) if (patron.test(relativa)) hallazgos.push({ archivo: relativa, marcador: `nombre: ${marcador}` });
      if (st.size === 0) continue;
      const contenido = st.size <= LIMITE_DE_LECTURA ? readFileSync(ruta) : leerComienzo(ruta, 4096);
      for (const { marcador, bytes: magico } of MAGICOS) if (contenido.length >= magico.length && contenido.subarray(0, magico.length).equals(magico)) hallazgos.push({ archivo: relativa, marcador: `contenido: ${marcador}` });
      if (contenido.length > 4 && contenido[0] === 0x30 && contenido[1] === 0x82 && contenido.subarray(0, 64).includes(OID_PKCS7_DATA)) hallazgos.push({ archivo: relativa, marcador: 'contenido: PKCS#12' });
      const texto = contenido.toString('latin1');
      for (const { marcador, patron } of MARCADORES_DE_CONTENIDO) if (patron.test(texto)) hallazgos.push({ archivo: relativa, marcador: `contenido: ${marcador}` });
    }
  };
  visitar(carpeta);
  return { archivos, bytes, hallazgos };
}

function leerComienzo(ruta, n) {
  const fd = require('node:fs').openSync(ruta, 'r');
  try {
    const buf = Buffer.alloc(n);
    const leidos = require('node:fs').readSync(fd, buf, 0, n, 0);
    return buf.subarray(0, leidos);
  } finally {
    require('node:fs').closeSync(fd);
  }
}
