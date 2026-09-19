/**
 * T-06-17 — Consentimiento vigente (B2) y T-06-18 — Revocación de consentimiento (06 §7.7). Máquina literal del
 * 06:3170-3175.
 *
 * - El consentimiento se identifica por asesorado + profesional + Alcance de Vínculo + finalidad (06:3127). No es un
 *   booleano por cuenta.
 * - «Cada decisión expresa emite nueva Versión» y «Aceptar una versión nunca acepta futuras» (REG-06-50). La vigencia
 *   es la cabeza de una cadena explícita de versiones, no la más reciente por fecha (06:1286-1288).
 * - Solo el asesorado otorga o revoca (INV-06-62).
 * - Revocar no finaliza el vínculo (REG-06-51, INV-06-63), y finalizar el vínculo no revoca ni borra el consentimiento
 *   (REG-06-52, INV-06-64). Es la asimetría 7.5-05.
 *
 * CON-02 del 09 no define la versión sucesora ni el reotorgamiento. Provisorio de DEUDA_LEGAJO DL-038: B2 sigue al 06,
 * con un solo Consentimiento por (alcance de vínculo, finalidad) y la cadena de versiones adentro. A3 sigue al 09:
 * cada otorgamiento es un acto nuevo (DL-021).
 */
import type { TransicionDeMaquina } from './maquina';
import { transicionDe } from './maquina';

export const SituacionDeConsentimiento = { VIGENTE: 'VIGENTE', REVOCADO: 'REVOCADO' } as const;
export type SituacionDeConsentimiento = (typeof SituacionDeConsentimiento)[keyof typeof SituacionDeConsentimiento];

export type TransicionDeConsentimiento = 'OtorgarConsentimiento' | 'AceptarNuevaVersion' | 'RevocarConsentimiento' | 'OtorgarNuevamente';

/** Qué decisión expresa registra cada Versión (REG-06-50). */
export const DecisionDeConsentimiento = {
  OTORGAMIENTO: 'OTORGAMIENTO',
  NUEVA_VERSION: 'NUEVA_VERSION',
  REVOCACION: 'REVOCACION',
  REOTORGAMIENTO: 'REOTORGAMIENTO',
} as const;
export type DecisionDeConsentimiento = (typeof DecisionDeConsentimiento)[keyof typeof DecisionDeConsentimiento];

export const DECISION_DE_TRANSICION: Readonly<Record<TransicionDeConsentimiento, DecisionDeConsentimiento>> = {
  OtorgarConsentimiento: 'OTORGAMIENTO',
  AceptarNuevaVersion: 'NUEVA_VERSION',
  RevocarConsentimiento: 'REVOCACION',
  OtorgarNuevamente: 'REOTORGAMIENTO',
};

/** 06:3170-3175. Los corchetes del brief son efectos del 06, no guardas (docs/paquetes/WP-03.md §11-12). */
export const TRANSICIONES_DE_CONSENTIMIENTO: readonly TransicionDeMaquina<SituacionDeConsentimiento, TransicionDeConsentimiento, 'ASESORADO'>[] = [
  { transicion: 'OtorgarConsentimiento', origen: null, destino: 'VIGENTE', actores: ['ASESORADO'], evento: 'ConsentimientoOtorgado' },
  { transicion: 'AceptarNuevaVersion', origen: 'VIGENTE', destino: 'VIGENTE', actores: ['ASESORADO'], evento: 'NuevaVersionDeConsentimientoAceptada' },
  { transicion: 'RevocarConsentimiento', origen: 'VIGENTE', destino: 'REVOCADO', actores: ['ASESORADO'], evento: 'ConsentimientoRevocado' },
  { transicion: 'OtorgarNuevamente', origen: 'REVOCADO', destino: 'VIGENTE', actores: ['ASESORADO'], evento: 'ConsentimientoOtorgadoNuevamente' },
];

/**
 * Guardas reales del 06:
 * - actor asesorado titular (INV-06-62);
 * - versión identificable y aplicable (INV-06-60);
 * - decisión explícita;
 * - alcance de vínculo ACEPTADO (06:3127; 05 UC-P07: «vínculo explícitamente aceptado»).
 * Para OtorgarNuevamente, «cuando 08 lo permita»: el 08 lo permite siempre (08:404).
 */
export interface ContextoDeTransicionDeConsentimiento {
  readonly transicion: TransicionDeConsentimiento;
  readonly actorEsTitular: boolean;
  readonly decisionExplicita: boolean;
  /** Otorgar, nueva versión y reotorgar: la versión presentada es la aplicable (la cabeza de la cadena de textos). */
  readonly versionPresentadaAplicable?: boolean;
  /** AceptarNuevaVersion: la versión presentada es distinta de la que ya está vigente. */
  readonly versionPresentadaEsSucesora?: boolean;
  /** Otorgar, nueva versión y reotorgar: el Alcance de Vínculo está ACEPTADO. */
  readonly alcanceDeVinculoAceptado?: boolean;
}

export type MotivoDeRechazoDeConsentimiento =
  | 'TRANSICION_NO_DECLARADA'
  | 'ACTOR_NO_TITULAR'
  | 'SIN_DECISION_EXPLICITA'
  | 'VERSION_NO_APLICABLE'
  | 'VERSION_NO_SUCESORA'
  | 'VINCULO_NO_ACEPTADO';

export type EvaluacionDeConsentimiento =
  | { readonly permitida: true; readonly transicion: TransicionDeMaquina<SituacionDeConsentimiento, TransicionDeConsentimiento, 'ASESORADO'> }
  | { readonly permitida: false; readonly motivo: MotivoDeRechazoDeConsentimiento };

export function evaluarTransicionDeConsentimiento(
  situacionActual: SituacionDeConsentimiento | null,
  contexto: ContextoDeTransicionDeConsentimiento,
): EvaluacionDeConsentimiento {
  const declarada = transicionDe(TRANSICIONES_DE_CONSENTIMIENTO, contexto.transicion, situacionActual);
  if (!declarada) return { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' };
  if (!contexto.actorEsTitular) return { permitida: false, motivo: 'ACTOR_NO_TITULAR' };
  if (!contexto.decisionExplicita) return { permitida: false, motivo: 'SIN_DECISION_EXPLICITA' };
  if (contexto.transicion !== 'RevocarConsentimiento') {
    if (!contexto.alcanceDeVinculoAceptado) return { permitida: false, motivo: 'VINCULO_NO_ACEPTADO' };
    if (!contexto.versionPresentadaAplicable) return { permitida: false, motivo: 'VERSION_NO_APLICABLE' };
    if (contexto.transicion === 'AceptarNuevaVersion' && !contexto.versionPresentadaEsSucesora) {
      return { permitida: false, motivo: 'VERSION_NO_SUCESORA' };
    }
  }
  return { permitida: true, transicion: declarada };
}

/**
 * CON-02 aplica la transición que corresponde a la situación actual (DL-038):
 * - sin consentimiento → OtorgarConsentimiento;
 * - VIGENTE con otra versión → AceptarNuevaVersion;
 * - VIGENTE con la misma versión → sin cambio (200 con el existente);
 * - REVOCADO → OtorgarNuevamente.
 */
export function transicionDeOtorgamiento(
  situacionActual: SituacionDeConsentimiento | null,
  versionDeTextoVigente: string | null,
  versionDeTextoPresentada: string,
): TransicionDeConsentimiento | 'SIN_CAMBIO' {
  if (situacionActual === null) return 'OtorgarConsentimiento';
  if (situacionActual === 'REVOCADO') return 'OtorgarNuevamente';
  return versionDeTextoVigente === versionDeTextoPresentada ? 'SIN_CAMBIO' : 'AceptarNuevaVersion';
}
