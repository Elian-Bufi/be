/**
 * T-06-16 — Solicitud de vínculo (06 §7.3) y T-06-15 — Vínculo por Alcance (06 §7.5). Máquinas literales del 06
 * (CONV-06-03): lista blanca con actor, condición y efecto. Toda transición no declarada está prohibida; la base lo
 * exige además con triggers.
 *
 * «Ningún paso concede implícitamente el siguiente» (06:2968): solicitar no da acceso (INV-06-50), aceptar no es
 * consentir (REG-06-59, INV-06-53), y pausar o finalizar no revoca consentimientos (REG-06-52).
 *
 * El 06 remite al 08 los actores de pausa, reanudación y finalización, y el 08 no los fija. El motivo tampoco tiene
 * campo en el 09. Provisorio de DEUDA_LEGAJO DL-033:
 * - pausan y finalizan los dos participantes;
 * - reanuda quien pausó;
 * - el sistema finaliza por cierre de cuenta;
 * - el motivo sale de una lista cerrada.
 * Los nombres de los eventos son derivados (el §7 no los publica).
 */
import type { TransicionDeMaquina } from './maquina';
import { transicionDe } from './maquina';

// ─── Solicitud de vínculo (06 §7.3.1-§7.3.2) ────────────────────────────────────────────────────

export const EstadoDeSolicitudDeVinculo = {
  PENDIENTE: 'PENDIENTE',
  ACEPTADA: 'ACEPTADA',
  RECHAZADA: 'RECHAZADA',
  CADUCADA: 'CADUCADA',
  INVALIDADA: 'INVALIDADA',
} as const;
export type EstadoDeSolicitudDeVinculo = (typeof EstadoDeSolicitudDeVinculo)[keyof typeof EstadoDeSolicitudDeVinculo];

/** «Los cuatro últimos son terminales para esa Solicitud concreta» (06:3026). */
export const ESTADOS_TERMINALES_DE_SOLICITUD: readonly EstadoDeSolicitudDeVinculo[] = ['ACEPTADA', 'RECHAZADA', 'CADUCADA', 'INVALIDADA'];

export type TransicionDeSolicitud = 'CrearSolicitud' | 'AceptarSolicitud' | 'RechazarSolicitud' | 'CaducarSolicitud' | 'InvalidarSolicitud';

/** Rol con el que actúa cada participante, más el sistema. */
export type ActorDeVinculo = 'PROFESIONAL' | 'ASESORADO' | 'SISTEMA';

/** 06:3030-3036. «Sistema/actor propietario» de InvalidarSolicitud: en WP-03, el sistema (DL-037). */
export const TRANSICIONES_DE_SOLICITUD_DE_VINCULO: readonly TransicionDeMaquina<EstadoDeSolicitudDeVinculo, TransicionDeSolicitud, ActorDeVinculo>[] = [
  { transicion: 'CrearSolicitud', origen: null, destino: 'PENDIENTE', actores: ['PROFESIONAL', 'ASESORADO'], evento: 'SolicitudDeVinculoCreada' },
  { transicion: 'AceptarSolicitud', origen: 'PENDIENTE', destino: 'ACEPTADA', actores: ['ASESORADO'], evento: 'SolicitudDeVinculoAceptada' },
  { transicion: 'RechazarSolicitud', origen: 'PENDIENTE', destino: 'RECHAZADA', actores: ['ASESORADO'], evento: 'SolicitudDeVinculoRechazada' },
  { transicion: 'CaducarSolicitud', origen: 'PENDIENTE', destino: 'CADUCADA', actores: ['SISTEMA'], evento: 'SolicitudDeVinculoCaducada' },
  { transicion: 'InvalidarSolicitud', origen: 'PENDIENTE', destino: 'INVALIDADA', actores: ['SISTEMA'], evento: 'SolicitudDeVinculoInvalidada' },
];

/** Contexto que exige cada guarda (06:3030-3036, columna «Condición»; REG-06-49 para la reevaluación). */
export type ContextoDeTransicionDeSolicitud =
  | {
      readonly transicion: 'CrearSolicitud';
      readonly actor: ActorDeVinculo;
      /** «Alcance/finalidad»: alcance del catálogo y finalidad que le corresponde (REG-06-61). */
      readonly alcanceYFinalidadValidos: boolean;
      /** «elegibilidad estructural»: identidades distintas y operativas; alcance verificado y habilitado del profesional. */
      readonly elegibilidadEstructural: boolean;
    }
  | {
      readonly transicion: 'AceptarSolicitud';
      readonly actor: ActorDeVinculo;
      readonly confirmacionExplicita: boolean;
      /** REG-06-49: identidades, Verificación, Habilitación y contenido siguen siendo compatibles. */
      readonly reevaluacionFavorable: boolean;
    }
  | { readonly transicion: 'RechazarSolicitud'; readonly actor: ActorDeVinculo; readonly confirmacionExplicita: boolean }
  | {
      readonly transicion: 'CaducarSolicitud';
      readonly actor: ActorDeVinculo;
      /** «condición temporal»: venció el plazo (DL-037; el 06 fija la transición, no la duración). */
      readonly vencida: boolean;
    }
  | {
      readonly transicion: 'InvalidarSolicitud';
      readonly actor: ActorDeVinculo;
      /** «elegibilidad o contenido ya incompatibles». */
      readonly incompatible: boolean;
    };

export type MotivoDeRechazoDeTransicionDeVinculo =
  | 'TRANSICION_NO_DECLARADA'
  | 'ACTOR_NO_HABILITADO'
  | 'ALCANCE_O_FINALIDAD_INVALIDOS'
  | 'NO_ELEGIBLE'
  | 'SIN_CONFIRMACION_EXPLICITA'
  | 'REEVALUACION_DESFAVORABLE'
  | 'NO_VENCIDA'
  | 'SIN_INCOMPATIBILIDAD'
  | 'SIN_MOTIVO'
  | 'MOTIVO_NO_ADMITIDO'
  | 'SOLO_REANUDA_QUIEN_PAUSO';

export type EvaluacionDeTransicion<E extends string, T extends string> =
  | { readonly permitida: true; readonly transicion: TransicionDeMaquina<E, T, ActorDeVinculo> }
  | { readonly permitida: false; readonly motivo: MotivoDeRechazoDeTransicionDeVinculo };

/** Único punto de decisión de las transiciones de Solicitud: el servicio lo invoca antes de escribir y la base lo refuerza. */
export function evaluarTransicionDeSolicitud(
  estadoActual: EstadoDeSolicitudDeVinculo | null,
  contexto: ContextoDeTransicionDeSolicitud,
): EvaluacionDeTransicion<EstadoDeSolicitudDeVinculo, TransicionDeSolicitud> {
  const declarada = transicionDe(TRANSICIONES_DE_SOLICITUD_DE_VINCULO, contexto.transicion, estadoActual);
  if (!declarada) return { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' };
  if (!declarada.actores.includes(contexto.actor)) return { permitida: false, motivo: 'ACTOR_NO_HABILITADO' };

  switch (contexto.transicion) {
    case 'CrearSolicitud':
      if (!contexto.alcanceYFinalidadValidos) return { permitida: false, motivo: 'ALCANCE_O_FINALIDAD_INVALIDOS' };
      if (!contexto.elegibilidadEstructural) return { permitida: false, motivo: 'NO_ELEGIBLE' };
      break;
    case 'AceptarSolicitud':
      if (!contexto.confirmacionExplicita) return { permitida: false, motivo: 'SIN_CONFIRMACION_EXPLICITA' };
      if (!contexto.reevaluacionFavorable) return { permitida: false, motivo: 'REEVALUACION_DESFAVORABLE' };
      break;
    case 'RechazarSolicitud':
      if (!contexto.confirmacionExplicita) return { permitida: false, motivo: 'SIN_CONFIRMACION_EXPLICITA' };
      break;
    case 'CaducarSolicitud':
      if (!contexto.vencida) return { permitida: false, motivo: 'NO_VENCIDA' };
      break;
    case 'InvalidarSolicitud':
      if (!contexto.incompatible) return { permitida: false, motivo: 'SIN_INCOMPATIBILIDAD' };
      break;
  }
  return { permitida: true, transicion: declarada };
}

// ─── Vínculo por Alcance (06 §7.5.1-§7.5.2) ─────────────────────────────────────────────────────

export const EstadoDeAlcanceDeVinculo = {
  ACEPTADO: 'ACEPTADO',
  PAUSADO: 'PAUSADO',
  FINALIZADO: 'FINALIZADO',
} as const;
export type EstadoDeAlcanceDeVinculo = (typeof EstadoDeAlcanceDeVinculo)[keyof typeof EstadoDeAlcanceDeVinculo];

/** «FINALIZADO no tiene salida» (06:3113). */
export const ESTADOS_TERMINALES_DE_ALCANCE_DE_VINCULO: readonly EstadoDeAlcanceDeVinculo[] = ['FINALIZADO'];

export type TransicionDeAlcanceDeVinculo = 'AceptarAlcanceDeVinculo' | 'PausarAlcance' | 'ReanudarAlcance' | 'FinalizarAlcance';

/** 06:3105-3111. «Actor habilitado por 08» → provisorio de DL-033. */
export const TRANSICIONES_DE_ALCANCE_DE_VINCULO: readonly TransicionDeMaquina<EstadoDeAlcanceDeVinculo, TransicionDeAlcanceDeVinculo, ActorDeVinculo>[] = [
  { transicion: 'AceptarAlcanceDeVinculo', origen: null, destino: 'ACEPTADO', actores: ['ASESORADO'], evento: 'AlcanceDeVinculoAceptado' },
  { transicion: 'PausarAlcance', origen: 'ACEPTADO', destino: 'PAUSADO', actores: ['ASESORADO', 'PROFESIONAL'], evento: 'AlcanceDeVinculoPausado' },
  { transicion: 'ReanudarAlcance', origen: 'PAUSADO', destino: 'ACEPTADO', actores: ['ASESORADO', 'PROFESIONAL'], evento: 'AlcanceDeVinculoReanudado' },
  { transicion: 'FinalizarAlcance', origen: 'ACEPTADO', destino: 'FINALIZADO', actores: ['ASESORADO', 'PROFESIONAL', 'SISTEMA'], evento: 'AlcanceDeVinculoFinalizado' },
  { transicion: 'FinalizarAlcance', origen: 'PAUSADO', destino: 'FINALIZADO', actores: ['ASESORADO', 'PROFESIONAL', 'SISTEMA'], evento: 'AlcanceDeVinculoFinalizado' },
];

/** Motivos de pausa (DL-033: lista cerrada, sin texto libre; 08:646). */
export const MotivoDePausa = { DECISION_PERSONAL: 'DECISION_PERSONAL', DISPONIBILIDAD: 'DISPONIBILIDAD', OTRO: 'OTRO' } as const;
export type MotivoDePausa = (typeof MotivoDePausa)[keyof typeof MotivoDePausa];

/** Motivos de finalización (DL-033). `CIERRE_DE_CUENTA` queda reservado al sistema. */
export const MotivoDeFinalizacion = {
  DECISION_PERSONAL: 'DECISION_PERSONAL',
  OBJETIVO_CUMPLIDO: 'OBJETIVO_CUMPLIDO',
  CAMBIO_DE_PROFESIONAL: 'CAMBIO_DE_PROFESIONAL',
  OTRO: 'OTRO',
  CIERRE_DE_CUENTA: 'CIERRE_DE_CUENTA',
} as const;
export type MotivoDeFinalizacion = (typeof MotivoDeFinalizacion)[keyof typeof MotivoDeFinalizacion];
export const MOTIVOS_DE_FINALIZACION_DE_PARTICIPANTE: readonly MotivoDeFinalizacion[] = [
  'DECISION_PERSONAL',
  'OBJETIVO_CUMPLIDO',
  'CAMBIO_DE_PROFESIONAL',
  'OTRO',
];

export const ETIQUETA_DE_MOTIVO: Readonly<Record<MotivoDeFinalizacion | MotivoDePausa, string>> = {
  DECISION_PERSONAL: 'Decisión personal',
  DISPONIBILIDAD: 'Disponibilidad',
  OBJETIVO_CUMPLIDO: 'Objetivo cumplido',
  CAMBIO_DE_PROFESIONAL: 'Cambio de profesional',
  OTRO: 'Otro motivo',
  CIERRE_DE_CUENTA: 'Cierre de cuenta',
};

export type ContextoDeTransicionDeAlcance =
  | { readonly transicion: 'AceptarAlcanceDeVinculo'; readonly actor: ActorDeVinculo; readonly solicitudAceptada: boolean }
  | { readonly transicion: 'PausarAlcance'; readonly actor: ActorDeVinculo; readonly decisionExplicita: boolean; readonly motivo: string | null }
  | {
      readonly transicion: 'ReanudarAlcance';
      readonly actor: ActorDeVinculo;
      readonly decisionExplicita: boolean;
      /** DL-033: reanuda quien pausó. */
      readonly actorEsQuienPauso: boolean;
    }
  | { readonly transicion: 'FinalizarAlcance'; readonly actor: ActorDeVinculo; readonly decisionExplicita: boolean; readonly motivo: string | null };

/** Efectos declarados (06:3105-3111; REG-06-47, REG-06-48, REG-06-52). */
export interface EfectosDeTransicionDeAlcance {
  /** «bloquea operaciones incompatibles»: lo aplica el PDP en la operación siguiente (dimensión VÍNCULO). */
  readonly cortaAccesoProfesional: boolean;
  /** REG-06-48: reanudar no restaura otros gates; el PDP vuelve a evaluar todo. */
  readonly restauraOtrosGates: false;
  /** REG-06-52: pausar o finalizar no crea revocación. */
  readonly revocaConsentimientos: false;
}

const EFECTOS_DE_ALCANCE: Record<TransicionDeAlcanceDeVinculo, EfectosDeTransicionDeAlcance> = {
  AceptarAlcanceDeVinculo: { cortaAccesoProfesional: false, restauraOtrosGates: false, revocaConsentimientos: false },
  PausarAlcance: { cortaAccesoProfesional: true, restauraOtrosGates: false, revocaConsentimientos: false },
  ReanudarAlcance: { cortaAccesoProfesional: false, restauraOtrosGates: false, revocaConsentimientos: false },
  FinalizarAlcance: { cortaAccesoProfesional: true, restauraOtrosGates: false, revocaConsentimientos: false },
};

export function efectosDeTransicionDeAlcance(transicion: TransicionDeAlcanceDeVinculo): EfectosDeTransicionDeAlcance {
  return EFECTOS_DE_ALCANCE[transicion];
}

function motivoAdmitido(transicion: 'PausarAlcance' | 'FinalizarAlcance', actor: ActorDeVinculo, motivo: string): boolean {
  if (transicion === 'PausarAlcance') return (Object.values(MotivoDePausa) as string[]).includes(motivo);
  if (actor === 'SISTEMA') return motivo === 'CIERRE_DE_CUENTA';
  return (MOTIVOS_DE_FINALIZACION_DE_PARTICIPANTE as readonly string[]).includes(motivo);
}

/** Único punto de decisión de las transiciones del Vínculo por Alcance. */
export function evaluarTransicionDeAlcance(
  estadoActual: EstadoDeAlcanceDeVinculo | null,
  contexto: ContextoDeTransicionDeAlcance,
): EvaluacionDeTransicion<EstadoDeAlcanceDeVinculo, TransicionDeAlcanceDeVinculo> {
  const declarada = transicionDe(TRANSICIONES_DE_ALCANCE_DE_VINCULO, contexto.transicion, estadoActual);
  if (!declarada) return { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' };
  if (!declarada.actores.includes(contexto.actor)) return { permitida: false, motivo: 'ACTOR_NO_HABILITADO' };

  switch (contexto.transicion) {
    case 'AceptarAlcanceDeVinculo':
      // [Solicitud ACEPTADA]
      if (!contexto.solicitudAceptada) return { permitida: false, motivo: 'REEVALUACION_DESFAVORABLE' };
      break;
    case 'PausarAlcance':
    case 'FinalizarAlcance':
      // [decisión + motivo] (06:3108; el 04 y el 05 exigen motivo también al finalizar: DL-033)
      if (!contexto.decisionExplicita) return { permitida: false, motivo: 'SIN_CONFIRMACION_EXPLICITA' };
      if (!contexto.motivo) return { permitida: false, motivo: 'SIN_MOTIVO' };
      if (!motivoAdmitido(contexto.transicion, contexto.actor, contexto.motivo)) return { permitida: false, motivo: 'MOTIVO_NO_ADMITIDO' };
      break;
    case 'ReanudarAlcance':
      if (!contexto.decisionExplicita) return { permitida: false, motivo: 'SIN_CONFIRMACION_EXPLICITA' };
      if (!contexto.actorEsQuienPauso) return { permitida: false, motivo: 'SOLO_REANUDA_QUIEN_PAUSO' };
      break;
  }
  return { permitida: true, transicion: declarada };
}
