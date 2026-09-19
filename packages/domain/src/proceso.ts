/**
 * T-06-25 — Proceso operativo (06 §8, B-04; M-04). Transversal: lo abren las activaciones de nutrición y, desde WP-06,
 * las de entrenamiento.
 *
 * - Máquina de dos estados, `ABIERTO` y `CERRADO` (06:3413-3432). `NUEVO` y `VIGENTE` son predicados, no estados
 *   (06:3358; INV-06-71, 72).
 * - Como máximo un Proceso `ABIERTO` por (profesional, asesorado, alcance) (REG-06-78; INV-06-74).
 * - Pausa, suspensión, revocación o pérdida de Habilitación no son estados del Proceso (06:3432): lo vuelven no
 *   vigente, y eso lo decide el PDP en cada operación.
 * - `CERRADO` es terminal: no hay reapertura (INV-06-86). Una relación futura equivalente crea otro Proceso.
 */
import type { TransicionDeMaquina } from './maquina';
import { transicionDe } from './maquina';

export const EstadoDeProceso = { ABIERTO: 'ABIERTO', CERRADO: 'CERRADO' } as const;
export type EstadoDeProceso = (typeof EstadoDeProceso)[keyof typeof EstadoDeProceso];

export type TransicionDeProceso =
  | 'AbrirProceso'
  | 'AplicarContinuidad'
  | 'CerrarPorRevision'
  | 'CerrarPorFinalizacionVinculo'
  | 'CerrarPorCierreCuenta';

export type ActorDeProceso = 'PROFESIONAL' | 'SISTEMA';

/** 06:3420-3428, literal. Los eventos son los del 06:3563-3570. */
export const TRANSICIONES_DE_PROCESO: readonly TransicionDeMaquina<EstadoDeProceso, TransicionDeProceso, ActorDeProceso>[] = [
  { transicion: 'AbrirProceso', origen: null, destino: 'ABIERTO', actores: ['PROFESIONAL'], evento: 'ProcesoOperativoAbierto' },
  { transicion: 'AplicarContinuidad', origen: 'ABIERTO', destino: 'ABIERTO', actores: ['PROFESIONAL'], evento: 'ContinuidadOCierreAplicado' },
  { transicion: 'CerrarPorRevision', origen: 'ABIERTO', destino: 'CERRADO', actores: ['PROFESIONAL'], evento: 'ProcesoOperativoCerrado' },
  { transicion: 'CerrarPorFinalizacionVinculo', origen: 'ABIERTO', destino: 'CERRADO', actores: ['SISTEMA'], evento: 'ProcesoOperativoCerrado' },
  { transicion: 'CerrarPorCierreCuenta', origen: 'ABIERTO', destino: 'CERRADO', actores: ['SISTEMA'], evento: 'ProcesoOperativoCerrado' },
];

/** Motivo de cierre, persistido con el Proceso cerrado. */
export type MotivoDeCierreDeProceso = 'REVISION_FINALIZAR' | 'FINALIZACION_DE_VINCULO' | 'CIERRE_DE_CUENTA';
export const MOTIVO_DE_CIERRE: Readonly<Record<'CerrarPorRevision' | 'CerrarPorFinalizacionVinculo' | 'CerrarPorCierreCuenta', MotivoDeCierreDeProceso>> = {
  CerrarPorRevision: 'REVISION_FINALIZAR',
  CerrarPorFinalizacionVinculo: 'FINALIZACION_DE_VINCULO',
  CerrarPorCierreCuenta: 'CIERRE_DE_CUENTA',
};

export type ContextoDeTransicionDeProceso =
  | {
      readonly transicion: 'AbrirProceso';
      readonly actor: ActorDeProceso;
      /** REG-06-65: la vertical puede emitir o activar la versión inicial en el mismo acto. */
      readonly activacionConfirmada: boolean;
      /** REG-06-65 inc. 3; INV-06-75: B-05 admitió la apertura. */
      readonly capacidadAdmite: boolean;
    }
  | {
      readonly transicion: 'AplicarContinuidad' | 'CerrarPorRevision';
      readonly actor: ActorDeProceso;
      /** Revisión M-10 válida y consecuencia aplicable (06:3421-3422; INV-06-85). */
      readonly revisionValida: boolean;
    }
  | { readonly transicion: 'CerrarPorFinalizacionVinculo' | 'CerrarPorCierreCuenta'; readonly actor: ActorDeProceso };

export type MotivoDeRechazoDeProceso = 'TRANSICION_NO_DECLARADA' | 'ACTOR_NO_HABILITADO' | 'SIN_ACTIVACION' | 'CAPACIDAD_NO_ADMITE' | 'SIN_REVISION_VALIDA';

export type EvaluacionDeTransicionDeProceso =
  | { readonly permitida: true; readonly transicion: TransicionDeMaquina<EstadoDeProceso, TransicionDeProceso, ActorDeProceso> }
  | { readonly permitida: false; readonly motivo: MotivoDeRechazoDeProceso };

export function evaluarTransicionDeProceso(estado: EstadoDeProceso | null, c: ContextoDeTransicionDeProceso): EvaluacionDeTransicionDeProceso {
  const declarada = transicionDe(TRANSICIONES_DE_PROCESO, c.transicion, estado);
  if (!declarada) return { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' };
  if (!declarada.actores.includes(c.actor)) return { permitida: false, motivo: 'ACTOR_NO_HABILITADO' };
  switch (c.transicion) {
    case 'AbrirProceso':
      if (!c.activacionConfirmada) return { permitida: false, motivo: 'SIN_ACTIVACION' };
      if (!c.capacidadAdmite) return { permitida: false, motivo: 'CAPACIDAD_NO_ADMITE' };
      break;
    case 'AplicarContinuidad':
    case 'CerrarPorRevision':
      if (!c.revisionValida) return { permitida: false, motivo: 'SIN_REVISION_VALIDA' };
      break;
    default:
      break;
  }
  return { permitida: true, transicion: declarada };
}

/**
 * REG-06-64 y REG-06-78: una activación es `NUEVO` si no hay un Proceso `ABIERTO` equivalente para la terna. Si lo hay,
 * es continuidad: no se crea otro Proceso y no se consulta la capacidad (REG-06-92; INV-06-76, 104).
 */
export type ClasificacionDeActivacion = { readonly tipo: 'NUEVO' } | { readonly tipo: 'CONTINUIDAD'; readonly procesoId: string };
export function clasificarActivacion(procesoAbiertoId: string | null): ClasificacionDeActivacion {
  return procesoAbiertoId === null ? { tipo: 'NUEVO' } : { tipo: 'CONTINUIDAD', procesoId: procesoAbiertoId };
}

/**
 * REG-06-66: un Proceso `ABIERTO` es vigente si se cumplen a la vez cuenta no bloqueada, Verificación VERIFICADO,
 * Habilitación efectiva, Vínculo ACEPTADO y Consentimiento VIGENTE. «Vigente no es autorización» (06:3405): el PDP
 * sigue decidiendo cada operación.
 */
export interface HechosDeVigencia {
  readonly estado: EstadoDeProceso;
  readonly cuentasOperativas: boolean;
  readonly verificado: boolean;
  readonly habilitado: boolean;
  readonly vinculoAceptado: boolean;
  readonly consentimientoVigente: boolean;
}
export function procesoVigente(h: HechosDeVigencia): boolean {
  return h.estado === 'ABIERTO' && h.cuentasOperativas && h.verificado && h.habilitado && h.vinculoAceptado && h.consentimientoVigente;
}
