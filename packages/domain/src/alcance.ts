/**
 * T-06-45 — Alcance (06:241). Conjunto cerrado de tres valores:
 * - dos Especialidades: Nutrición y Entrenamiento («Las Especialidades iniciales son exclusivamente Nutrición y
 *   Entrenamiento», 06:2772);
 * - la Capacidad antropométrica transversal, «nunca tercera Especialidad» (06:2774).
 * Un Alcance referencia exactamente una Especialidad o la Capacidad, nunca ambas (REG-06-32, INV-06-38).
 *
 * En WP-03 son solo valores de gate: ningún dominio de salud (docs/paquetes/WP-03.md §8).
 *
 * Finalidad: atributo estructural REFERENCIADO; su catálogo pertenece al 08 (06:251, 06:262, Q-003). Mientras no exista,
 * hay una finalidad sintética por alcance (DEUDA_LEGAJO DL-039). La finalidad no se amplía implícitamente (REG-06-61).
 */

export const Alcance = {
  NUTRICION: 'NUTRICION',
  ENTRENAMIENTO: 'ENTRENAMIENTO',
  ANTROPOMETRIA: 'ANTROPOMETRIA',
} as const;
export type Alcance = (typeof Alcance)[keyof typeof Alcance];
export const ALCANCES: readonly Alcance[] = ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'];

/** REG-06-32: Especialidad XOR Capacidad antropométrica transversal. */
export const TipoDeAlcance = { ESPECIALIDAD: 'ESPECIALIDAD', CAPACIDAD_TRANSVERSAL: 'CAPACIDAD_TRANSVERSAL' } as const;
export type TipoDeAlcance = (typeof TipoDeAlcance)[keyof typeof TipoDeAlcance];
export const TIPO_DE_ALCANCE: Readonly<Record<Alcance, TipoDeAlcance>> = {
  NUTRICION: 'ESPECIALIDAD',
  ENTRENAMIENTO: 'ESPECIALIDAD',
  ANTROPOMETRIA: 'CAPACIDAD_TRANSVERSAL',
};

/** Finalidades sintéticas, una por alcance (DL-039). */
export const Finalidad = {
  ACOMPANAMIENTO_NUTRICIONAL: 'ACOMPANAMIENTO_NUTRICIONAL',
  PLANIFICACION_DEL_ENTRENAMIENTO: 'PLANIFICACION_DEL_ENTRENAMIENTO',
  EVALUACION_ANTROPOMETRICA: 'EVALUACION_ANTROPOMETRICA',
} as const;
export type Finalidad = (typeof Finalidad)[keyof typeof Finalidad];

export const FINALIDAD_DE_ALCANCE: Readonly<Record<Alcance, Finalidad>> = {
  NUTRICION: 'ACOMPANAMIENTO_NUTRICIONAL',
  ENTRENAMIENTO: 'PLANIFICACION_DEL_ENTRENAMIENTO',
  ANTROPOMETRIA: 'EVALUACION_ANTROPOMETRICA',
};

/** Etiquetas legibles: la UI nunca muestra códigos (10-B04:387-393). */
export const ETIQUETA_DE_ALCANCE: Readonly<Record<Alcance, string>> = {
  NUTRICION: 'Nutrición',
  ENTRENAMIENTO: 'Entrenamiento',
  ANTROPOMETRIA: 'Antropometría',
};

export const ETIQUETA_DE_FINALIDAD: Readonly<Record<Finalidad, string>> = {
  ACOMPANAMIENTO_NUTRICIONAL: 'Acompañamiento nutricional',
  PLANIFICACION_DEL_ENTRENAMIENTO: 'Planificación del entrenamiento',
  EVALUACION_ANTROPOMETRICA: 'Evaluación antropométrica',
};

export function esAlcance(valor: unknown): valor is Alcance {
  return typeof valor === 'string' && (ALCANCES as readonly string[]).includes(valor);
}

export function esFinalidad(valor: unknown): valor is Finalidad {
  return typeof valor === 'string' && Object.values(Finalidad).includes(valor as Finalidad);
}

/** La finalidad pertenece al alcance: no se amplía ni se cruza entre alcances (REG-06-61; 06:3139). */
export function finalidadCorrespondeAlAlcance(alcance: Alcance, finalidad: Finalidad): boolean {
  return FINALIDAD_DE_ALCANCE[alcance] === finalidad;
}

/**
 * 08 §12.3 — el texto de B2 se diferencia según el perfil del profesional: sanitario (nutricionista matriculado) o no
 * sanitario (entrenador). Lo carga el servicio interno de verificación (DEUDA_LEGAJO DL-036).
 */
export const TipoDePerfilProfesional = { SANITARIO: 'SANITARIO', NO_SANITARIO: 'NO_SANITARIO' } as const;
export type TipoDePerfilProfesional = (typeof TipoDePerfilProfesional)[keyof typeof TipoDePerfilProfesional];
