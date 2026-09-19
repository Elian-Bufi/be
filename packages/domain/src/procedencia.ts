/**
 * T-06-23 — Procedencia: «actor, fuente propia/externa, proveedor, fecha, contexto» (06:219).
 * REG-06-17: actor ≠ autoría ≠ procedencia. 06 §4.8.3 no fija una taxonomía cerrada; esta estructura
 * es un descriptor abierto (TEN-41). La superficie es la declarada por el cliente (DEUDA_LEGAJO DL-022).
 */

export const Superficie = { WEB: 'WEB', APK: 'APK' } as const;
export type Superficie = (typeof Superficie)[keyof typeof Superficie];

export const HEADER_DE_SUPERFICIE = 'x-be-surface';

export function superficieDeclarada(valor: string | undefined | null): Superficie | null {
  return valor === 'WEB' || valor === 'APK' ? valor : null;
}

export interface Procedencia {
  /** Fuente propia de BE; no hay proveedores externos en WP-02. */
  readonly fuente: 'PROPIA';
  /** Caso de uso y operación de origen. */
  readonly casoDeUso: string;
  readonly operacion: string;
  /** Superficie declarada; `null` si el cliente no la declaró (nunca se inventa). */
  readonly superficie: Superficie | null;
  /** Correlación con la request (09v7 T17). */
  readonly requestId: string | null;
}
