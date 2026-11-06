import { createCipheriv, createDecipheriv, createHash, createHmac, hkdfSync, randomBytes } from 'node:crypto';
import { ALFABETO_DE_CODIGOS, codigoEnGrupos } from '@be/domain';
import * as OTPAuth from 'otpauth';

/**
 * WP-ADMINISTRACION (DL-155; 08 §25): el segundo factor, con piezas estándar y una biblioteca mantenida. No hay
 * criptografía propia:
 * - **TOTP** (RFC 6238) con `otpauth` 9.5.2, que en Node usa el HMAC y la comparación en tiempo constante de `node:crypto`.
 * - **El secreto TOTP** se guarda cifrado con AES-256-GCM. La clave sale de `BE_CLAVE_DEL_SEGUNDO_FACTOR` por HKDF-SHA-256,
 *   y el cifrado lleva la identidad como dato asociado: un secreto copiado a otra fila no se descifra.
 * - **Los códigos de recuperación** se guardan como HMAC-SHA-256 con otra clave derivada: sin la clave del servidor, la
 *   base sola no alcanza para probar códigos.
 * - **Los códigos de incorporación** (100 bits, de un solo uso, 24 h) se guardan como SHA-256: el comando que los emite no
 *   necesita la clave del servidor.
 * Nada de esto se imprime ni se audita.
 */

export interface ClavesDelSegundoFactor {
  readonly cifrado: Buffer;
  readonly huellas: Buffer;
}

export function derivarClaves(clave: Buffer): ClavesDelSegundoFactor {
  const derivar = (info: string) => Buffer.from(hkdfSync('sha256', clave, Buffer.alloc(0), info, 32));
  return { cifrado: derivar('be/segundo-factor/cifrado-totp/v1'), huellas: derivar('be/segundo-factor/huellas-de-recuperacion/v1') };
}

const b64 = (b: Buffer): string => b.toString('base64url');

/** «v1.<iv>.<texto cifrado>.<etiqueta>», en base64url: la forma que exige la base (CHECK). */
export function cifrarSecreto(claves: ClavesDelSegundoFactor, secretoBase32: string, identidadId: string): string {
  const iv = randomBytes(12);
  const cifrador = createCipheriv('aes-256-gcm', claves.cifrado, iv);
  cifrador.setAAD(Buffer.from(`be/totp/${identidadId.toLowerCase()}`, 'utf8'));
  const cifrado = Buffer.concat([cifrador.update(secretoBase32, 'utf8'), cifrador.final()]);
  return `v1.${b64(iv)}.${b64(cifrado)}.${b64(cifrador.getAuthTag())}`;
}

/** El secreto en base32, o `null` si no se puede descifrar (otra clave, otra identidad, un valor alterado). */
export function descifrarSecreto(claves: ClavesDelSegundoFactor, guardado: string, identidadId: string): string | null {
  const partes = guardado.split('.');
  if (partes.length !== 4 || partes[0] !== 'v1') return null;
  try {
    const descifrador = createDecipheriv('aes-256-gcm', claves.cifrado, Buffer.from(partes[1]!, 'base64url'));
    descifrador.setAAD(Buffer.from(`be/totp/${identidadId.toLowerCase()}`, 'utf8'));
    descifrador.setAuthTag(Buffer.from(partes[3]!, 'base64url'));
    return Buffer.concat([descifrador.update(Buffer.from(partes[2]!, 'base64url')), descifrador.final()]).toString('utf8');
  } catch {
    return null;
  }
}

/**
 * Un código al azar con el alfabeto de los códigos (32 símbolos, 5 bits cada uno): cada byte al azar elige un símbolo con
 * sus 5 bits bajos, y como 256 es múltiplo de 32 la elección es uniforme.
 */
export function codigoAlAzar(caracteres: number): string {
  const bytes = randomBytes(caracteres);
  let codigo = '';
  for (const b of bytes) codigo += ALFABETO_DE_CODIGOS[b & 31];
  return codigo;
}

/** Diez códigos de recuperación de 60 bits (12 caracteres), para mostrar en grupos y guardar solo su huella. */
export function codigosDeRecuperacionNuevos(cantidad: number): { readonly normalizado: string; readonly visible: string }[] {
  const codigos = new Set<string>();
  while (codigos.size < cantidad) codigos.add(codigoAlAzar(12));
  return [...codigos].map((normalizado) => ({ normalizado, visible: codigoEnGrupos(normalizado) }));
}

export const huellaDeIncorporacion = (normalizado: string): string => createHash('sha256').update(`be/incorporacion/${normalizado}`).digest('hex');
export const huellaDeRecuperacion = (claves: ClavesDelSegundoFactor, normalizado: string): string =>
  createHmac('sha256', claves.huellas).update(`be/recuperacion/${normalizado}`).digest('hex');

export const PARAMETROS_TOTP = { algorithm: 'SHA1', digits: 6, period: 30 } as const;
export const EMISOR_TOTP = 'BE';

/** Un secreto nuevo de 160 bits, en base32, con su URI otpauth (lo que lleva el QR). */
export function totpNuevo(cuenta: string): { readonly secreto: string; readonly uri: string } {
  const secreto = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({ issuer: EMISOR_TOTP, label: cuenta, secret: secreto, ...PARAMETROS_TOTP });
  return { secreto: secreto.base32, uri: totp.toString() };
}

/**
 * Si el código vale para el secreto ahora (el paso actual y uno de cada lado), y en qué paso. Un paso igual o anterior al
 * último aceptado no vale: un código ya usado no se vuelve a aceptar, tampoco dentro de su ventana.
 */
export function validarCodigoTotp(secretoBase32: string, codigo: string, ahoraMs: number, ultimoPaso: bigint | null): { readonly paso: bigint } | null {
  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secretoBase32), ...PARAMETROS_TOTP });
  const delta = totp.validate({ token: codigo, timestamp: ahoraMs, window: 1 });
  if (delta === null) return null;
  const paso = BigInt(totp.counter({ timestamp: ahoraMs }) + delta);
  if (ultimoPaso !== null && paso <= ultimoPaso) return null;
  return { paso };
}
