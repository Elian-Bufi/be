/**
 * Método de acceso local (T-06-03): identificador y credencial.
 * 06 §5.6: el 06 modela la relación; credenciales y verificadores pertenecen a 08/09/07.
 * Las mismas reglas corren en API, website y APK para que los clientes no mantengan otra definición (09v7 T21).
 */

export const TipoDeMetodoDeAcceso = { LOCAL: 'LOCAL' } as const;
export type TipoDeMetodoDeAcceso = (typeof TipoDeMetodoDeAcceso)[keyof typeof TipoDeMetodoDeAcceso];

/**
 * Identificador local = correo con trim y minúsculas (decisión técnica T3; 04 RF-001 nombra el correo).
 * La unicidad vive sobre este valor normalizado en `MetodoDeAcceso` (INV-06-24; DEUDA_LEGAJO DL-011).
 */
export function normalizarIdentificadorLocal(valor: string): string {
  return valor.trim().toLowerCase();
}

// Validación sintáctica mínima. No verifica que el correo exista ni presupone el correo como canal (08 §24.4).
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const LARGO_MAXIMO_DE_IDENTIFICADOR = 254;

export function identificadorLocalValido(normalizado: string): boolean {
  return normalizado.length > 0 && normalizado.length <= LARGO_MAXIMO_DE_IDENTIFICADOR && CORREO.test(normalizado);
}

/**
 * Política provisional de contraseña (decisión técnica T2; el legajo no la fija: DEUDA_LEGAJO DL-013).
 * Mínimo 12 caracteres (OWASP ASVS 2.1.1), máximo 72 bytes UTF-8 (límite de bcrypt; evita truncamiento
 * silencioso). Sin reglas de composición.
 */
export const LARGO_MINIMO_DE_CREDENCIAL = 12;
export const BYTES_MAXIMOS_DE_CREDENCIAL = 72;

export type ProblemaDeCredencial = 'CREDENCIAL_DEMASIADO_CORTA' | 'CREDENCIAL_DEMASIADO_LARGA';

export function problemaDeCredencialLocal(credencial: string): ProblemaDeCredencial | null {
  if ([...credencial].length < LARGO_MINIMO_DE_CREDENCIAL) return 'CREDENCIAL_DEMASIADO_CORTA';
  if (bytesUtf8(credencial) > BYTES_MAXIMOS_DE_CREDENCIAL) return 'CREDENCIAL_DEMASIADO_LARGA';
  return null;
}

function bytesUtf8(texto: string): number {
  let bytes = 0;
  for (const caracter of texto) {
    const punto = caracter.codePointAt(0) ?? 0;
    bytes += punto < 0x80 ? 1 : punto < 0x800 ? 2 : punto < 0x10000 ? 3 : 4;
  }
  return bytes;
}
