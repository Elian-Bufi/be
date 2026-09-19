/**
 * T-06-11 — Verificación profesional por Alcance (06 §6.8). Máquina literal del 06:2829-2838; «Toda transición no
 * listada está prohibida» (06:2840). «Identidad BE + Alcance — Verificación profesional | una situación efectiva»
 * (06:2870).
 *
 * T-06-13 — Habilitación: dimensión separada de la verificación y de la autorización. «VERIFICADO ≠ Habilitación
 * efectiva ≠ Autorización sobre datos» (06:2784-2788); «requiere concesión explícita» (REG-06-79); «no se presume»
 * (INV-06-87). El 06 no fija sus estados: CONCEDIDA y RETIRADA salen de «concesión» y «Retirar Habilitación» (06 §8.6.6).
 *
 * En WP-03 no hay caso de uso administrativo. El actor «administrador» del 06 lo reemplaza un servicio interno sin
 * endpoint (DEUDA_LEGAJO DL-036, mismo patrón que DL-020).
 */
import type { TransicionDeMaquina } from './maquina';
import { transicionDe } from './maquina';

export const EstadoDeVerificacionProfesional = {
  PENDIENTE: 'PENDIENTE',
  VERIFICADO: 'VERIFICADO',
  RECHAZADO: 'RECHAZADO',
  SUSPENDIDO: 'SUSPENDIDO',
} as const;
export type EstadoDeVerificacionProfesional = (typeof EstadoDeVerificacionProfesional)[keyof typeof EstadoDeVerificacionProfesional];

export type TransicionDeVerificacion =
  | 'PresentarAlcance'
  | 'RegistrarObservacion'
  | 'PresentarSubsanacion'
  | 'VerificarAlcance'
  | 'RechazarAlcance'
  | 'VolverAPresentar'
  | 'SuspenderAlcance'
  | 'RehabilitarAlcance';

/** Actores del 06 §6.8.2. En WP-03 los dos los ejecuta el servicio interno (DL-036). */
export type ActorDeVerificacion = 'PROFESIONAL' | 'ADMINISTRADOR';

/** 06 §6.8.2 — lista blanca literal. Eventos: nombres derivados (DL-036). */
export const TRANSICIONES_DE_VERIFICACION: readonly TransicionDeMaquina<
  EstadoDeVerificacionProfesional,
  TransicionDeVerificacion,
  ActorDeVerificacion
>[] = [
  { transicion: 'PresentarAlcance', origen: null, destino: 'PENDIENTE', actores: ['PROFESIONAL'], evento: 'AlcancePresentado' },
  { transicion: 'RegistrarObservacion', origen: 'PENDIENTE', destino: 'PENDIENTE', actores: ['ADMINISTRADOR'], evento: 'ObservacionRegistrada' },
  { transicion: 'PresentarSubsanacion', origen: 'PENDIENTE', destino: 'PENDIENTE', actores: ['PROFESIONAL'], evento: 'SubsanacionPresentada' },
  { transicion: 'VerificarAlcance', origen: 'PENDIENTE', destino: 'VERIFICADO', actores: ['ADMINISTRADOR'], evento: 'AlcanceVerificado' },
  { transicion: 'RechazarAlcance', origen: 'PENDIENTE', destino: 'RECHAZADO', actores: ['ADMINISTRADOR'], evento: 'AlcanceRechazado' },
  { transicion: 'VolverAPresentar', origen: 'RECHAZADO', destino: 'PENDIENTE', actores: ['PROFESIONAL'], evento: 'AlcancePresentadoNuevamente' },
  { transicion: 'SuspenderAlcance', origen: 'VERIFICADO', destino: 'SUSPENDIDO', actores: ['ADMINISTRADOR'], evento: 'AlcanceSuspendido' },
  { transicion: 'RehabilitarAlcance', origen: 'SUSPENDIDO', destino: 'VERIFICADO', actores: ['ADMINISTRADOR'], evento: 'AlcanceRehabilitado' },
];

/** Transiciones cuya condición del 06 exige un fundamento o resolución explícita (06 §6.8.2 columna «Condición»). */
const EXIGEN_FUNDAMENTO: ReadonlySet<TransicionDeVerificacion> = new Set([
  'RegistrarObservacion',
  'VerificarAlcance',
  'RechazarAlcance',
  'SuspenderAlcance',
  'RehabilitarAlcance',
]);

export type MotivoDeRechazoDeVerificacion = 'TRANSICION_NO_DECLARADA' | 'SIN_FUNDAMENTO';

export type EvaluacionDeVerificacion =
  | {
      readonly permitida: true;
      readonly transicion: TransicionDeMaquina<EstadoDeVerificacionProfesional, TransicionDeVerificacion, ActorDeVerificacion>;
    }
  | { readonly permitida: false; readonly motivo: MotivoDeRechazoDeVerificacion };

/** Lista blanca + guardas (06 §6.8.2). `estadoActual = null` = todavía no hay trayectoria para ese alcance. */
export function evaluarTransicionDeVerificacion(
  estadoActual: EstadoDeVerificacionProfesional | null,
  transicion: TransicionDeVerificacion,
  fundamento: string,
): EvaluacionDeVerificacion {
  const declarada = transicionDe(TRANSICIONES_DE_VERIFICACION, transicion, estadoActual);
  if (!declarada) return { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' };
  if (EXIGEN_FUNDAMENTO.has(transicion) && fundamento.trim().length === 0) return { permitida: false, motivo: 'SIN_FUNDAMENTO' };
  return { permitida: true, transicion: declarada };
}

export const EstadoDeHabilitacion = { CONCEDIDA: 'CONCEDIDA', RETIRADA: 'RETIRADA' } as const;
export type EstadoDeHabilitacion = (typeof EstadoDeHabilitacion)[keyof typeof EstadoDeHabilitacion];

export type TransicionDeHabilitacion = 'ConcederHabilitacion' | 'RetirarHabilitacion';

/** Habilitación mínima (DL-036): concesión explícita (REG-06-79) y retiro (06 §8.6.6). Una nueva concesión es explícita. */
export const TRANSICIONES_DE_HABILITACION: readonly TransicionDeMaquina<EstadoDeHabilitacion, TransicionDeHabilitacion, 'ADMINISTRADOR'>[] = [
  { transicion: 'ConcederHabilitacion', origen: null, destino: 'CONCEDIDA', actores: ['ADMINISTRADOR'], evento: 'HabilitacionConcedida' },
  { transicion: 'RetirarHabilitacion', origen: 'CONCEDIDA', destino: 'RETIRADA', actores: ['ADMINISTRADOR'], evento: 'HabilitacionRetirada' },
  { transicion: 'ConcederHabilitacion', origen: 'RETIRADA', destino: 'CONCEDIDA', actores: ['ADMINISTRADOR'], evento: 'HabilitacionConcedida' },
];

export function evaluarTransicionDeHabilitacion(
  estadoActual: EstadoDeHabilitacion | null,
  transicion: TransicionDeHabilitacion,
  fundamento: string,
): { readonly permitida: true; readonly destino: EstadoDeHabilitacion; readonly evento: string } | { readonly permitida: false; readonly motivo: MotivoDeRechazoDeVerificacion } {
  const declarada = transicionDe(TRANSICIONES_DE_HABILITACION, transicion, estadoActual);
  if (!declarada) return { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' };
  if (fundamento.trim().length === 0) return { permitida: false, motivo: 'SIN_FUNDAMENTO' };
  return { permitida: true, destino: declarada.destino, evento: declarada.evento };
}
