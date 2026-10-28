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

/** «Todo bien» solo si hay comprobaciones y cada una dio true; 'pendiente' y false lo impiden y se listan. */
export function resumirVeredicto(V) {
  const entradas = Object.entries(V);
  return {
    todoBien: entradas.length > 0 && entradas.every(([, v]) => v === true),
    pendientes: entradas.filter(([, v]) => v === 'pendiente').map(([k]) => k),
    fallidos: entradas.filter(([, v]) => v !== true && v !== 'pendiente').map(([k]) => k),
  };
}
