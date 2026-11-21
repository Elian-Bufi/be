/**
 * API-OBC-01 a 03 (WP-OBJETIVO-Y-CALCULADOR, DL-186; pedido de Dirección del 2026-11-19) · El objetivo nutricional con una
 * toma de Antropometría de referencia y el calculador de macros del profesional.
 *
 * - **La referencia:** una toma registrada de Antropometría (solo si la persona le habilitó Antropometría a ese
 *   profesional) o datos cargados a mano. El objetivo guarda la referencia y los valores usados en ese momento (peso,
 *   talla, edad y masa libre de grasa, con el método de la toma), con su fecha. Nada se recalcula solo: una toma más
 *   nueva se avisa y el profesional decide.
 * - **El cálculo:** el gasto en reposo con su método a la vista (fórmula, datos y cita), el factor de actividad (con una
 *   variante para el día de descanso), el ajuste que escribe el profesional y los macros en g/kg (proteína y grasa) con
 *   los carbohidratos por diferencia. Es una estimación: el objetivo sigue siendo la decisión del profesional, con su
 *   fundamento (REG-06-123), y lo que guarda es lo que él escribió.
 * - **Solo para el profesional:** la persona no lo lee, y lo que lee la APK no cambia.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { CrearObjetivoRequestSchema, FechaLocalSchema, VersionDeObjetivoSchema } from './contratos-nutricion';

// ─── Lo que elige el profesional ────────────────────────────────────────────────────────────────

/** El sexo con el que se elige la ecuación. No es un dato de la toma (como en el catálogo antropométrico): lo elige el profesional. */
export const SexoDelCalculoSchema = z.enum(['FEMALE', 'MALE']);
export type SexoDelCalculo = z.infer<typeof SexoDelCalculoSchema>;

/**
 * Los métodos del gasto en reposo que ofrece BE. Cada uno con su fórmula, sus datos y su cita (`calculador-de-macros.ts`).
 * RP-09 (WP-RECORRIDO-PLAN-PULIDO, DL-188) suma ten Haaf y Weijs (2014), la ecuación para deportistas, en sus dos
 * variantes: con peso, talla, edad y sexo, y con la masa libre de grasa. Es un agregado al final: lo guardado antes sigue
 * leyéndose igual. El método no viaja a la APK: la persona lee su objetivo sin la declaración del método
 * (`ObjetivoParaAsesorado`), y el cálculo (API-OBC-03) es solo para el profesional.
 */
export const METODOS_DE_REPOSO = ['MIFFLIN_ST_JEOR', 'HARRIS_BENEDICT_REVISED', 'FAO_WHO_UNU_1985', 'KATCH_MCARDLE', 'CUNNINGHAM_1980', 'TEN_HAAF_2014_WEIGHT', 'TEN_HAAF_2014_LEAN_MASS'] as const;
export const MetodoDeReposoSchema = z.enum(METODOS_DE_REPOSO);
export type MetodoDeReposo = z.infer<typeof MetodoDeReposoSchema>;

/** Los datos que puede necesitar un método. */
export const DATOS_DEL_CALCULO = ['weightKg', 'heightCm', 'ageYears', 'sex', 'leanMassKg'] as const;
export const DatoDelCalculoSchema = z.enum(DATOS_DEL_CALCULO);
export type DatoDelCalculo = z.infer<typeof DatoDelCalculoSchema>;

/** Los topes de lo que se escribe: fuera de ellos no es un error de tipeo que el calculador deba aceptar. */
export const TOPES_DEL_CALCULADOR = {
  pesoKg: { minimo: 20, maximo: 350 },
  tallaCm: { minimo: 100, maximo: 250 },
  edadAnios: { minimo: 18, maximo: 110 },
  factor: { minimo: 1, maximo: 2.5 },
  ajusteKcal: { minimo: -1500, maximo: 1500 },
  ajustePorcentaje: { minimo: -40, maximo: 40 },
  proteinaPorKg: { minimo: 0, maximo: 5 },
  grasaPorKg: { minimo: 0, maximo: 3 },
} as const;

/**
 * RP-05 (WP-RECORRIDO-PLAN-PULIDO, DL-188): lo que el calculador acepta para un cálculo nuevo, en g/kg, con su paso de
 * 0,1. Fuera de estos límites, el calculador lo avisa junto al campo y no propone nada. Los topes de arriba siguen siendo
 * los del contrato: un cálculo ya guardado con 3,5 g/kg de proteína (append-only) se sigue leyendo tal cual.
 */
export const LIMITES_DE_LOS_GRAMOS_POR_KG = {
  proteina: { minimo: 0.6, maximo: 3, paso: 0.1 },
  grasa: { minimo: 0.5, maximo: 2.5, paso: 0.1 },
} as const;

const TextoOpcional = (max: number) => z.string().trim().max(max).nullable();
const entre = (t: { readonly minimo: number; readonly maximo: number }) => z.number().finite().min(t.minimo).max(t.maximo);
const T = TOPES_DEL_CALCULADOR;

export const ParametrosDelCalculoSchema = z.strictObject({
  sex: SexoDelCalculoSchema.nullable(),
  restingMethod: MetodoDeReposoSchema,
  /** El factor de actividad del día; `restDayFactor`, si el profesional quiere otro para el día de descanso. */
  activity: z.strictObject({ factor: entre(T.factor), restDayFactor: entre(T.factor).nullable() }),
  /** Déficit o superávit, escrito por el profesional: kcal por día o un porcentaje del gasto total. `null`: sin ajuste. */
  adjustment: z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('KCAL'), value: entre(T.ajusteKcal) }),
    z.strictObject({ kind: z.literal('PERCENT'), value: entre(T.ajustePorcentaje) }),
  ]).nullable(),
  /** Proteína y grasa en g/kg del peso o de la masa libre de grasa; los carbohidratos, por diferencia. `null`: sin macros. */
  macros: z
    .strictObject({ base: z.enum(['BODY_WEIGHT', 'LEAN_MASS']), proteinPerKg: entre(T.proteinaPorKg), fatPerKg: entre(T.grasaPorKg) })
    .nullable(),
});
export type ParametrosDelCalculo = z.infer<typeof ParametrosDelCalculoSchema>;

// ─── La referencia (entrada) ────────────────────────────────────────────────────────────────────

const Opcional = (t: { readonly minimo: number; readonly maximo: number }) => entre(t).nullable();

export const ReferenciaEntradaSchema = z.discriminatedUnion('source', [
  z.strictObject({
    source: z.literal('RECORDED'),
    /** La toma (la evaluación antropométrica registrada). */
    evaluationId: IdOpaco,
    /** La corrida vigente de la toma de la que sale la masa libre de grasa (en kg, o el % de grasa con el peso); `null` si no se usa. */
    leanMassCalculationId: IdOpaco.nullable(),
    /** Lo que la toma no tiene, cargado a mano. Lo que la toma sí tiene se toma de la toma. */
    additions: z.strictObject({ heightCm: Opcional(T.tallaCm), ageYears: Opcional(T.edadAnios) }),
  }),
  z.strictObject({
    source: z.literal('MANUAL'),
    measuredOn: FechaLocalSchema,
    weightKg: Opcional(T.pesoKg),
    heightCm: Opcional(T.tallaCm),
    ageYears: Opcional(T.edadAnios),
    leanMassKg: z.number().finite().positive().max(T.pesoKg.maximo).nullable(),
    /** De dónde sale la masa libre de grasa escrita a mano («bioimpedancia del 10/11»). */
    leanMassNote: TextoOpcional(200),
  }),
]);
export type ReferenciaEntrada = z.infer<typeof ReferenciaEntradaSchema>;

/** API-OBC-02: una versión nueva del objetivo, con su referencia y, si se usó, su cálculo. */
export const ObjetivoConReferenciaRequestSchema = z.strictObject({
  objective: CrearObjetivoRequestSchema,
  reference: ReferenciaEntradaSchema,
  parameters: ParametrosDelCalculoSchema.nullable(),
});
export type ObjetivoConReferenciaRequest = z.infer<typeof ObjetivoConReferenciaRequestSchema>;

// ─── Los datos usados y el resultado ────────────────────────────────────────────────────────────

/** Un dato usado, con su origen: la toma o a mano. */
export const DatoUsadoSchema = z.strictObject({ value: z.number(), origin: z.enum(['MEASUREMENT', 'MANUAL']) });
export type DatoUsado = z.infer<typeof DatoUsadoSchema>;

/**
 * La masa libre de grasa usada: de una corrida de la toma en kg (`CALCULATION`), derivada del % de grasa de una corrida
 * con el peso de la toma (`FROM_BODY_FAT`: peso × (1 − %G/100)), o escrita a mano.
 */
export const MasaLibreUsadaSchema = z.strictObject({
  value: z.number().positive(),
  origin: z.enum(['CALCULATION', 'FROM_BODY_FAT', 'MANUAL']),
  /** El método de la toma («Masa libre de grasa (Durnin y Womersley)») o la nota escrita a mano. */
  method: z.string().nullable(),
  /** Con `FROM_BODY_FAT`, el % de grasa del que sale. */
  bodyFatValue: z.number().nullable(),
});
export type MasaLibreUsada = z.infer<typeof MasaLibreUsadaSchema>;

export const DatosUsadosSchema = z.strictObject({
  weightKg: DatoUsadoSchema.nullable(),
  heightCm: DatoUsadoSchema.nullable(),
  ageYears: DatoUsadoSchema.nullable(),
  leanMassKg: MasaLibreUsadaSchema.nullable(),
});
export type DatosUsados = z.infer<typeof DatosUsadosSchema>;

/** El gasto en reposo: calculado, con la fórmula y los números; o lo que falta; o por qué queda fuera de la ecuación. */
export const GastoEnReposoSchema = z.discriminatedUnion('state', [
  z.strictObject({
    state: z.literal('CALCULATED'),
    method: MetodoDeReposoSchema,
    kcal: z.number().int(),
    /** La ecuación con sus letras: «10 × peso (kg) + 6,25 × talla (cm) − 5 × edad (años) − 161». */
    equation: z.string(),
    /** La misma con los números: «10 × 68 + 6,25 × 162 − 5 × 45 − 161 = 1.306,5». */
    applied: z.string(),
  }),
  z.strictObject({ state: z.literal('MISSING_DATA'), method: MetodoDeReposoSchema, missing: z.array(DatoDelCalculoSchema).min(1) }),
  z.strictObject({ state: z.literal('OUT_OF_RANGE'), method: MetodoDeReposoSchema, reason: z.string() }),
]);
export type GastoEnReposo = z.infer<typeof GastoEnReposoSchema>;

export const MacroDelDiaSchema = z.strictObject({
  grams: z.number().int().nonnegative(),
  /** Por kilo de la base elegida (peso o masa libre de grasa). */
  perKg: z.number().nonnegative(),
  kcal: z.number().int().nonnegative(),
  /** La parte de la energía del día, en porcentaje, con su base al lado (`MacrosDelDia.energyKcal`). */
  energyShare: z.number().nonnegative(),
});
export const MacrosDelDiaSchema = z.strictObject({
  energyKcal: z.number().int(),
  protein: MacroDelDiaSchema,
  carbohydrate: MacroDelDiaSchema,
  fat: MacroDelDiaSchema,
});
export type MacrosDelDia = z.infer<typeof MacrosDelDiaSchema>;

/**
 * Lo que no deja cerrar una parte del cálculo, sin inventar nada:
 * - `LEAN_MASS_MISSING`: los macros por masa libre de grasa sin ese dato;
 * - `WEIGHT_MISSING`: los macros por peso sin el peso;
 * - `CARBOHYDRATE_NEGATIVE`: la proteína y la grasa ya superan la energía del día (los carbohidratos quedan en 0 g);
 * - `ENERGY_NOT_POSITIVE`: con el ajuste, la energía de un día queda en cero o menos (un déficit mayor que el gasto
 *   total): no hay macros ni valores para el objetivo.
 */
export const ProblemaDelCalculoSchema = z.enum(['LEAN_MASS_MISSING', 'WEIGHT_MISSING', 'CARBOHYDRATE_NEGATIVE', 'ENERGY_NOT_POSITIVE']);
export type ProblemaDelCalculo = z.infer<typeof ProblemaDelCalculoSchema>;

export const ResultadoDelCalculoSchema = z.strictObject({
  resting: GastoEnReposoSchema,
  /** El gasto total: el de reposo por el factor. `restDay`, con el factor del día de descanso si hay uno. */
  totals: z.strictObject({ day: z.number().int(), restDay: z.number().int().nullable() }).nullable(),
  /** La energía con el ajuste del profesional. */
  energy: z.strictObject({ day: z.number().int(), restDay: z.number().int().nullable() }).nullable(),
  macros: z
    .strictObject({ base: z.enum(['BODY_WEIGHT', 'LEAN_MASS']), baseKg: z.number().positive(), day: MacrosDelDiaSchema, restDay: MacrosDelDiaSchema.nullable() })
    .nullable(),
  issues: z.array(ProblemaDelCalculoSchema),
});
export type ResultadoDelCalculo = z.infer<typeof ResultadoDelCalculoSchema>;

// ─── API-OBC-01: las tomas que se pueden usar de referencia ─────────────────────────────────────

/** Una corrida de la toma de la que puede salir la masa libre de grasa. */
export const ComposicionDeLaTomaSchema = z.strictObject({
  calculationId: IdOpaco,
  metric: z.string(),
  /** «Masa libre de grasa (Durnin y Womersley)», «Grasa corporal (Faulkner)». */
  label: z.string(),
  value: z.number(),
  unit: z.enum(['kg', '%']),
  /** La masa libre de grasa que resulta: la misma, si es en kg; peso × (1 − %G/100), si es un %; `null` si la toma no tiene peso. */
  leanMassKg: z.number().nullable(),
});
export type ComposicionDeLaToma = z.infer<typeof ComposicionDeLaTomaSchema>;

export const TomaDeReferenciaSchema = z.strictObject({
  evaluationId: IdOpaco,
  measuredOn: FechaLocalSchema,
  occurredAt: Instante,
  weightKg: z.number().nullable(),
  heightCm: z.number().nullable(),
  ageYears: z.number().nullable(),
  composition: z.array(ComposicionDeLaTomaSchema),
});
export type TomaDeReferencia = z.infer<typeof TomaDeReferenciaSchema>;

export const TomasDeReferenciaResponseSchema = z.strictObject({
  data: z.strictObject({
    /** Si la persona le habilitó Antropometría a este profesional. Sin eso, ninguna toma: ni sus valores, ni que existen. */
    anthropometryEnabled: z.boolean(),
    /** Las tomas registradas de este profesional, de la más nueva a la más vieja (hasta 12). */
    measurements: z.array(TomaDeReferenciaSchema),
  }),
});
export type TomasDeReferenciaResponse = z.infer<typeof TomasDeReferenciaResponseSchema>;

// ─── API-OBC-02 y 03: lo guardado con la versión del objetivo ───────────────────────────────────

export const ReferenciaYCalculoSchema = z.strictObject({
  calculationId: IdOpaco,
  createdAt: Instante,
  reference: z.strictObject({
    source: z.enum(['RECORDED', 'MANUAL']),
    /** La toma; `null` si es a mano o si Antropometría ya no está habilitada para este profesional. */
    evaluationId: IdOpaco.nullable(),
    /** La fecha de la toma o de los datos a mano; `null` si la toma no se puede mostrar. */
    measuredOn: FechaLocalSchema.nullable(),
  }),
  /**
   * `true`: la referencia es una toma que este profesional ya no puede ver (Antropometría no está habilitada para él).
   * Entonces no van los datos, ni los parámetros, ni el resultado: de ellos se deduciría el peso. Queda el método.
   */
  anthropometryWithheld: z.boolean(),
  restingMethod: MetodoDeReposoSchema.nullable(),
  data: DatosUsadosSchema.nullable(),
  parameters: ParametrosDelCalculoSchema.nullable(),
  result: ResultadoDelCalculoSchema.nullable(),
});
export type ReferenciaYCalculo = z.infer<typeof ReferenciaYCalculoSchema>;

/**
 * Cómo está hoy la referencia (solo con Antropometría habilitada y una toma de referencia):
 * - `newerMeasurement`: la toma registrada más nueva que la de referencia, si la hay;
 * - `referenceState`: `CURRENT` si los datos usados siguen siendo los de la toma; `CHANGED` si alguno se corrigió, se anuló
 *   o su corrida se reemplazó. Avisarlo no cambia lo guardado.
 */
export const EstadoDeLaReferenciaSchema = z.strictObject({
  anthropometryEnabled: z.boolean(),
  newerMeasurement: z.strictObject({ evaluationId: IdOpaco, measuredOn: FechaLocalSchema }).nullable(),
  referenceState: z.enum(['CURRENT', 'CHANGED']).nullable(),
});
export type EstadoDeLaReferencia = z.infer<typeof EstadoDeLaReferenciaSchema>;

export const ObjetivoConReferenciaResponseSchema = z.strictObject({
  data: z.strictObject({ objective: VersionDeObjetivoSchema, calculation: ReferenciaYCalculoSchema }),
});
export type ObjetivoConReferenciaResponse = z.infer<typeof ObjetivoConReferenciaResponseSchema>;

export const ReferenciaDelObjetivoResponseSchema = z.strictObject({
  data: z.strictObject({
    objectiveVersionId: IdOpaco,
    /** `null`: esa versión del objetivo se escribió sin referencia ni cálculo. */
    calculation: ReferenciaYCalculoSchema.nullable(),
    anthropometry: EstadoDeLaReferenciaSchema,
  }),
});
export type ReferenciaDelObjetivoResponse = z.infer<typeof ReferenciaDelObjetivoResponseSchema>;
