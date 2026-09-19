/**
 * Estado de sesión — artefacto de infraestructura, no término del 06 («B-01 no define … sesión física», 06:1839).
 * 08 §26.1: «Toda sesión es revocable server-side». 07 §43-bis: tabla de sesiones + tokenVersion por cuenta.
 * Estados como enum con lista blanca, nunca booleanos (regla de schema del proyecto). DEUDA_LEGAJO DL-012.
 * La expiración no es un estado: se deriva de `expiraEn` (una sesión ACTIVA vencida no autentica).
 */
import type { TransicionDeclarada } from './estado-operativo-de-cuenta';

export const EstadoDeSesion = {
  ACTIVA: 'ACTIVA',
  /** El titular finalizó la sesión (UC-P26, API-ACC-03). */
  FINALIZADA: 'FINALIZADA',
  /** Revocada por el servidor: revocar todas (API-ACC-04), cierre o suspensión de cuenta (08 §26.3). */
  REVOCADA: 'REVOCADA',
} as const;
export type EstadoDeSesion = (typeof EstadoDeSesion)[keyof typeof EstadoDeSesion];

export type TransicionDeSesion = 'FinalizarSesion' | 'RevocarSesion';

export const TRANSICIONES_DE_SESION: readonly TransicionDeclarada<EstadoDeSesion, TransicionDeSesion>[] = [
  { transicion: 'FinalizarSesion', origen: 'ACTIVA', destino: 'FINALIZADA', evento: 'SesionFinalizada' },
  { transicion: 'RevocarSesion', origen: 'ACTIVA', destino: 'REVOCADA', evento: 'SesionRevocada' },
];

/** Motivo de revocación registrado con la sesión (08 §26.3). */
export const MotivoDeRevocacionDeSesion = {
  REVOCACION_POR_TITULAR: 'REVOCACION_POR_TITULAR',
  CIERRE_DE_CUENTA: 'CIERRE_DE_CUENTA',
  SUSPENSION_DE_CUENTA: 'SUSPENSION_DE_CUENTA',
} as const;
export type MotivoDeRevocacionDeSesion = (typeof MotivoDeRevocacionDeSesion)[keyof typeof MotivoDeRevocacionDeSesion];

/** Parámetros de sesión (decisiones técnicas T5/T6 de WP-02; 08 §26.2 tope ≤ 24 h). */
export const DURACION_DE_SESION_MS = 12 * 60 * 60 * 1000;
export const VENTANA_DE_STEP_UP_MS = 10 * 60 * 1000;
