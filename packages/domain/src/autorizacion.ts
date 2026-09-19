/**
 * T-06-19 — Autorización contextual (06 §7.8; 04 RF-021; 05 UC-I02; 08 §27). Evaluación pura del PDP.
 *
 * Recibe los hechos que la API leyó de la base en una sola lectura consistente (UC-I02 E02) y decide. No cachea
 * (08 §27.3), no conoce superficies (08 §27.2: una sola semántica para website y APK) y no confía en nada que declare el
 * cliente (09 §20.2.2).
 *
 * Reglas:
 * - Ninguna dimensión aislada autoriza (REG-06-53, INV-06-65).
 * - Una dimensión ausente, inconsistente o que no puede comprobarse deniega (REG-06-54; UC-I02 E01/E02).
 * - La decisión se limita a la operación, la finalidad y el alcance pedidos (UC-I02 regla 4).
 *
 * Las siete dimensiones llevan los nombres de RF-021 (04:317) y del 06 §7.8 (06:3183-3191), en el orden de evaluación
 * de UC-I02 (05:4834-4851). «Situación» incluye el A3 del titular, que ninguna lista nombra: 08:406 y 09:2603
 * (DEUDA_LEGAJO DL-032). La pertinencia (08 §11-bis) es un filtro posterior; sin dominios no hay categorías y hoy no
 * se evalúa (DL-039).
 */
import { finalidadCorrespondeAlAlcance, type Alcance, type Finalidad } from './alcance';
import type { SituacionDeConsentimiento } from './consentimiento-profesional';
import type { EstadoDeHabilitacion, EstadoDeVerificacionProfesional } from './verificacion-profesional';
import type { EstadoDeAlcanceDeVinculo } from './vinculo';

export const DimensionDeAutorizacion = {
  /** El actor opera con el rol que la operación exige (profesional sobre un titular distinto de sí mismo). */
  ROL: 'ROL',
  /** El alcance tuvo resolución favorable de verificación: VERIFICADO o SUSPENDIDO (06 §6.8). */
  ESPECIALIDAD_O_CAPACIDAD: 'ESPECIALIDAD_O_CAPACIDAD',
  /**
   * La situación permite operar:
   * - cuenta del actor y cuenta del titular OPERATIVA;
   * - verificación no SUSPENDIDA y habilitación CONCEDIDA;
   * - A3 del titular vigente.
   */
  SITUACION: 'SITUACION',
  /** Existe el Vínculo por Alcance y está ACEPTADO: PAUSADO y FINALIZADO cortan (08 §14.1). */
  VINCULO: 'VINCULO',
  /** B2 VIGENTE para ese alcance de vínculo y finalidad, con versión identificable (INV-06-60). */
  CONSENTIMIENTO: 'CONSENTIMIENTO',
  /** La finalidad de la operación coincide con la del vínculo y la del consentimiento (REG-06-61). */
  FINALIDAD: 'FINALIDAD',
  /** El alcance de la operación coincide con el del vínculo: no hay acceso cruzado entre alcances (08 §27). */
  ALCANCE: 'ALCANCE',
} as const;
export type DimensionDeAutorizacion = (typeof DimensionDeAutorizacion)[keyof typeof DimensionDeAutorizacion];
export const DIMENSIONES_DE_AUTORIZACION: readonly DimensionDeAutorizacion[] = [
  'ROL',
  'ESPECIALIDAD_O_CAPACIDAD',
  'SITUACION',
  'VINCULO',
  'CONSENTIMIENTO',
  'FINALIDAD',
  'ALCANCE',
];

/** Hechos que el PDP evalúa. Todos salen de la base; ninguno del cliente. */
export interface HechosDeAutorizacion {
  readonly operacion: { readonly alcance: Alcance; readonly finalidad: Finalidad };
  readonly actor: { readonly identidadId: string; readonly cuentaOperativa: boolean; readonly tienePerfilProfesional: boolean };
  /** `null`: el titular no existe o no es revelable. La respuesta no lo distingue (UC-I02 E05). */
  readonly titular: { readonly identidadId: string; readonly cuentaOperativa: boolean; readonly a3Vigente: boolean } | null;
  readonly verificacion: EstadoDeVerificacionProfesional | null;
  readonly habilitacion: EstadoDeHabilitacion | null;
  readonly alcanceDeVinculo: {
    readonly id: string;
    readonly alcance: Alcance;
    readonly finalidad: Finalidad;
    readonly estado: EstadoDeAlcanceDeVinculo;
  } | null;
  readonly consentimiento: {
    readonly id: string;
    readonly finalidad: Finalidad;
    readonly situacion: SituacionDeConsentimiento;
    /** Cabeza de la cadena de versiones (REG-06-50); `null` si no es identificable. */
    readonly versionVigenteId: string | null;
  } | null;
}

export type DecisionDeAutorizacion =
  | {
      readonly permitida: true;
      readonly dimensionesDesfavorables: readonly [];
      /** La decisión registra el componente y la versión de consentimiento que la resolvieron (REG-06-50; 08:307). */
      readonly alcanceDeVinculoId: string;
      readonly consentimientoId: string;
      readonly versionDeConsentimientoId: string;
    }
  | { readonly permitida: false; readonly dimensionesDesfavorables: readonly DimensionDeAutorizacion[] };

/**
 * Evalúa las siete dimensiones y devuelve todas las desfavorables, en el orden de UC-I02. La lista va solo a la
 * auditoría: RF-015 pide que cada denegación se atribuya a la condición faltante, y UC-I02 E05 prohíbe mostrarla.
 */
export function evaluarAutorizacion(h: HechosDeAutorizacion): DecisionDeAutorizacion {
  const desfavorables: DimensionDeAutorizacion[] = [];
  const titular = h.titular;
  const vinculo = h.alcanceDeVinculo;
  const consentimiento = h.consentimiento;

  if (!(h.actor.tienePerfilProfesional && titular !== null && titular.identidadId !== h.actor.identidadId)) desfavorables.push('ROL');

  if (!(h.verificacion === 'VERIFICADO' || h.verificacion === 'SUSPENDIDO')) desfavorables.push('ESPECIALIDAD_O_CAPACIDAD');

  const situacionFavorable =
    h.actor.cuentaOperativa &&
    titular !== null &&
    titular.cuentaOperativa &&
    titular.a3Vigente &&
    h.verificacion !== 'SUSPENDIDO' &&
    h.habilitacion === 'CONCEDIDA';
  if (!situacionFavorable) desfavorables.push('SITUACION');

  if (!(vinculo !== null && vinculo.estado === 'ACEPTADO')) desfavorables.push('VINCULO');

  if (!(consentimiento !== null && consentimiento.situacion === 'VIGENTE' && consentimiento.versionVigenteId !== null)) {
    desfavorables.push('CONSENTIMIENTO');
  }

  const finalidadFavorable =
    vinculo !== null &&
    consentimiento !== null &&
    vinculo.finalidad === h.operacion.finalidad &&
    consentimiento.finalidad === h.operacion.finalidad;
  if (!finalidadFavorable) desfavorables.push('FINALIDAD');

  const alcanceFavorable =
    vinculo !== null && vinculo.alcance === h.operacion.alcance && finalidadCorrespondeAlAlcance(h.operacion.alcance, h.operacion.finalidad);
  if (!alcanceFavorable) desfavorables.push('ALCANCE');

  if (desfavorables.length > 0 || vinculo === null || consentimiento === null || consentimiento.versionVigenteId === null) {
    return { permitida: false, dimensionesDesfavorables: desfavorables };
  }
  return {
    permitida: true,
    dimensionesDesfavorables: [],
    alcanceDeVinculoId: vinculo.id,
    consentimientoId: consentimiento.id,
    versionDeConsentimientoId: consentimiento.versionVigenteId,
  };
}

/**
 * Modo de acceso que ven el asesorado y el profesional en sus listas (09v8:1351-1369). Lo calcula el mismo PDP, para
 * que lo mostrado coincida con la autorización efectiva (RF-023). Es diagnóstico: nunca es un permiso reusable.
 */
export type ModoDeAcceso = 'CONTEXTUAL' | 'BLOCKED';
export function modoDeAcceso(decision: DecisionDeAutorizacion): ModoDeAcceso {
  return decision.permitida ? 'CONTEXTUAL' : 'BLOCKED';
}
