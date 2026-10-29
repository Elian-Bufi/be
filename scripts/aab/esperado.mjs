/**
 * Lo que el verificador del AAB exige y cómo decide: funciones puras, para poder probarlas.
 * WP-GOOGLE-PLAY-PRUEBAS-INTERNAS (corrección del 2026-10-28 a la tarde, tras la revisión adversaria).
 */

const HUELLA = /^[0-9a-f]{64}$/;
const COMMIT = /^[0-9a-f]{40}$/;
const CLIENT_ID_WEB = /^[0-9]+-[0-9a-z]+\.apps\.googleusercontent\.com$/;

/** Los campos de esperado.json, todos obligatorios. */
export const CAMPOS_ESPERADOS = ['paquete', 'version', 'versionCode', 'commit', 'arbolLimpio', 'appEnv', 'apiBaseUrl', 'webBaseUrl', 'googleWebClientId', 'sinGoogleAProposito', 'firebaseProjectId', 'sinFirebaseAProposito', 'certSubidaSha256', 'certFirmaAppSha256'];

const textoNoVacio = (v) => typeof v === 'string' && v.trim().length > 0;
const urlHttps = (v) => {
  if (!textoNoVacio(v)) return false;
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
};
export const normalizarHuella = (h) => (typeof h === 'string' ? h.trim().replace(/:/g, '').toLowerCase() : null);

/**
 * Valida y normaliza el esperado. Lanza con un mensaje concreto si algo falta, está vacío o tiene otra forma: un
 * esperado incompleto nunca puede dar «todo bien» por comparar null con null.
 */
export function validarEsperado(E) {
  if (!E || typeof E !== 'object') throw new Error('esperado.json no es un objeto');
  const faltantes = CAMPOS_ESPERADOS.filter((c) => !(c in E));
  if (faltantes.length) throw new Error(`esperado.json sin ${faltantes.join(', ')} (todos los campos son obligatorios)`);
  const errores = [];
  for (const c of ['paquete', 'version', 'appEnv']) if (!textoNoVacio(E[c])) errores.push(`${c} tiene que ser un texto no vacío`);
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i.test(String(E.paquete ?? ''))) errores.push('paquete no tiene la forma de un nombre de paquete Android');
  if (!Number.isInteger(E.versionCode) || E.versionCode <= 0) errores.push('versionCode tiene que ser un entero mayor que 0');
  if (!COMMIT.test(String(E.commit ?? ''))) errores.push('commit tiene que ser el SHA completo (40 hex)');
  if (E.arbolLimpio !== true && E.arbolLimpio !== false) errores.push('arbolLimpio tiene que ser true o false');
  if (!urlHttps(E.apiBaseUrl)) errores.push('apiBaseUrl tiene que ser una URL https');
  if (!urlHttps(E.webBaseUrl)) errores.push('webBaseUrl tiene que ser una URL https');
  if (E.sinGoogleAProposito !== true && E.sinGoogleAProposito !== false) errores.push('sinGoogleAProposito tiene que ser true o false');
  if (E.sinGoogleAProposito === false && !CLIENT_ID_WEB.test(String(E.googleWebClientId ?? ''))) errores.push('googleWebClientId tiene que ser el client ID web (…apps.googleusercontent.com), o sinGoogleAProposito: true');
  if (E.sinGoogleAProposito === true && E.googleWebClientId !== null) errores.push('con sinGoogleAProposito: true, googleWebClientId tiene que ser null');
  if (E.sinFirebaseAProposito !== true && E.sinFirebaseAProposito !== false) errores.push('sinFirebaseAProposito tiene que ser true o false');
  if (E.sinFirebaseAProposito === false && !textoNoVacio(E.firebaseProjectId)) errores.push('firebaseProjectId tiene que ser un texto no vacío, o sinFirebaseAProposito: true');
  if (E.sinFirebaseAProposito === true && E.firebaseProjectId !== null) errores.push('con sinFirebaseAProposito: true, firebaseProjectId tiene que ser null');
  const certSubida = normalizarHuella(E.certSubidaSha256);
  const certFirma = normalizarHuella(E.certFirmaAppSha256);
  if (!HUELLA.test(certSubida ?? '')) errores.push('certSubidaSha256 tiene que ser una huella SHA-256 (64 hex)');
  if (!HUELLA.test(certFirma ?? '')) errores.push('certFirmaAppSha256 tiene que ser una huella SHA-256 (64 hex)');
  if (errores.length) throw new Error(`esperado.json inválido: ${errores.join('; ')}`);
  return { ...E, paquete: E.paquete.trim(), version: E.version.trim(), appEnv: E.appEnv.trim(), apiBaseUrl: E.apiBaseUrl.trim(), webBaseUrl: E.webBaseUrl.trim(), certSubidaSha256: certSubida, certFirmaAppSha256: certFirma };
}

/**
 * Si la salida de `keytool -printcert -jarfile` (en inglés: se corre con -J-Duser.language=en) describe un único
 * firmante con un único certificado autofirmado (Owner igual a Issuer), como toda clave de firma de Android.
 */
export function esAutofirmado(salidaDeKeytool) {
  const t = String(salidaDeKeytool ?? '');
  const firmantes = (t.match(/^Signer #\d+:/gim) ?? []).length;
  const certificados = (t.match(/^Certificate #\d+:/gim) ?? []).length;
  const owner = /^Owner:\s*(.+)$/im.exec(t)?.[1]?.trim();
  const issuer = /^Issuer:\s*(.+)$/im.exec(t)?.[1]?.trim();
  return firmantes <= 1 && certificados === 1 && Boolean(owner) && owner === issuer;
}

/** Los avisos graves que `jarsigner -verify -strict` deja bajo «Error:», hasta «Warning:» o el final. */
function erroresDeJarsigner(texto) {
  const lineas = texto.split(/\r?\n/).map((l) => l.trim());
  const inicio = lineas.findIndex((l) => /^Error:$/i.test(l));
  if (inicio < 0) return [];
  const errores = [];
  for (const l of lineas.slice(inicio + 1)) {
    if (/^Warning:$/i.test(l)) break;
    if (l && !/^Re-run with the -verbose/i.test(l)) errores.push(l);
  }
  return errores;
}

/**
 * Lee `jarsigner -verify -strict` (en inglés). Las claves de firma de Android son autofirmadas (Android no usa cadenas
 * de certificación), así que con -strict jarsigner informa la cadena «inválida» (PKIX) y sale con el bit 4. El bit 4
 * junta varias causas (también certificado vencido o algoritmo deshabilitado), por eso se mira el texto: se acepta la
 * cadena no validada y nada más, y solo si el certificado es autofirmado. Entradas sin firmar (bit 16), uso de clave
 * (8), alias (32) o cualquier otro aviso grave rechazan. Corrección del 2026-10-29, con el primer AAB firmado: antes
 * se exigía código 0, imposible con una clave de Android.
 */
export function evaluarVerificacionJar({ codigo, salida, autofirmado }) {
  const texto = String(salida ?? '');
  if (!/jar verified/i.test(texto)) return { ok: false, motivo: 'jarsigner no dice «jar verified»' };
  if (/unsigned/i.test(texto)) return { ok: false, motivo: 'jarsigner informa entradas sin firmar' };
  if (codigo === 0) return { ok: true, motivo: 'verificado, sin avisos graves' };
  if (codigo !== 4) return { ok: false, motivo: `jarsigner -strict salió con ${codigo}` };
  const errores = erroresDeJarsigner(texto);
  if (!errores.length) return { ok: false, motivo: 'jarsigner -strict salió con 4 sin informar el motivo' };
  const ajenos = errores.filter((l) => !/^This jar contains entries whose certificate chain is invalid\. Reason: PKIX path building failed/i.test(l));
  if (ajenos.length) return { ok: false, motivo: `avisos graves de jarsigner: ${ajenos.join(' / ')}` };
  if (autofirmado !== true) return { ok: false, motivo: 'la cadena no se valida y el certificado no es autofirmado' };
  return { ok: true, motivo: 'verificado; el único aviso es la cadena de un certificado autofirmado, lo normal en Android' };
}

/** «Todo bien» solo si hay comprobaciones y cada una dio true; 'pendiente' y false lo impiden y se listan. */
export function resumirVeredicto(V) {
  const entradas = Object.entries(V);
  return {
    todoBien: entradas.length > 0 && entradas.every(([, v]) => v === true),
    pendientes: entradas.filter(([, v]) => v === 'pendiente').map(([k]) => k),
    fallidos: entradas.filter(([, v]) => v !== true && v !== 'pendiente').map(([k]) => k),
  };
}
