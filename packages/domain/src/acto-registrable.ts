/**
 * Actos registrables de la Relación A usuario ↔ BE (08 §12.1, taxonomía §12.4).
 * «aceptar términos ≠ autorizar tratamiento sensible ≠ autorizar a un profesional
 *  (tres actos distintos con evidencia distinta)» (08 §12.1).
 * La evidencia §12.2 aplica a todos los tipos. El 06 no los modela (DEUDA_LEGAJO DL-021).
 */
import type { TransicionDeclarada } from './estado-operativo-de-cuenta';

export const TipoDeActoRegistrable = {
  /** A1 — aceptación contractual; «no es consentimiento de datos». */
  TERMINOS: 'TERMINOS',
  /** A2 — constancia de información, no consentimiento. */
  PRIVACIDAD_INFO: 'PRIVACIDAD_INFO',
  /** A3 — consentimiento expreso de tratamiento de datos de salud por BE. Nunca ocurre en el registro. */
  DATOS_SALUD_BE: 'DATOS_SALUD_BE',
} as const;
export type TipoDeActoRegistrable = (typeof TipoDeActoRegistrable)[keyof typeof TipoDeActoRegistrable];

export const EstadoDeActoRegistrable = {
  VIGENTE: 'VIGENTE',
  REVOCADO: 'REVOCADO',
} as const;
export type EstadoDeActoRegistrable = (typeof EstadoDeActoRegistrable)[keyof typeof EstadoDeActoRegistrable];

/** Única transición: `VIGENTE → REVOCADO`, y solo para los tipos que el 08 declara revocables. */
export const TRANSICIONES_DE_ACTO_REGISTRABLE: readonly TransicionDeclarada<EstadoDeActoRegistrable, 'RevocarActo'>[] = [
  { transicion: 'RevocarActo', origen: 'VIGENTE', destino: 'REVOCADO', evento: 'ActoRevocado' },
];

/** 08 §12.4 columna «Revocable»: TERMINOS «Cierre de cuenta»; PRIVACIDAD_INFO «N/A»; DATOS_SALUD_BE «Sí». */
export const ACTO_REVOCABLE: Readonly<Record<TipoDeActoRegistrable, boolean>> = {
  TERMINOS: true,
  PRIVACIDAD_INFO: false,
  DATOS_SALUD_BE: true,
};

/** Actos que el registro (API-ACC-01) crea. A3 no está (09v8 §2.2: «No se considera otorgado A3 por registrarse»). */
export const ACTOS_DEL_REGISTRO: readonly TipoDeActoRegistrable[] = ['TERMINOS', 'PRIVACIDAD_INFO'];
