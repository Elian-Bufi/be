/**
 * API-PLN-02 y API-PLN-03 (WP-TABLERO-ALTA-GAMA TB-39; WP-EDITORES-PROFESIONAL ED-34; decisión de Dirección del
 * 2026-11-13, «Último peso, guardado en gramos») · Los rangos de macronutrientes que indica el profesional en una versión
 * del plan de Nutrición: por día tipo y por comida, las proteínas, los carbohidratos y las grasas, cada uno con su mínimo y
 * su máximo, en gramos o en gramos por kilo.
 *
 * - **El plan guarda los gramos** y anota de qué peso salieron: el valor en kg, la fecha y el origen (el último peso
 *   registrado en Antropometría o uno cargado a mano). Nada se recalcula solo: un pesaje nuevo no mueve el plan.
 * - **El peso registrado** se usa solo si la persona le habilitó Antropometría a ese profesional. Sin ese permiso, la API no
 *   devuelve el peso por ningún camino: ni el valor, ni los gramos por kilo de los que se podría deducir, ni el error.
 * - **Las kcal no se escriben acá:** las de cada opción siguen saliendo de la fuente de cada alimento (API-PLN-01).
 * - **Solo para el profesional:** la persona no lee los rangos, y lo que lee la APK no cambia.
 */
import { z } from 'zod';
import { IdOpaco } from './contratos';
import { FechaLocalSchema } from './contratos-nutricion';

export const MACROS_DEL_RANGO = ['protein', 'carbohydrate', 'fat'] as const;
export type MacroDelRango = (typeof MACROS_DEL_RANGO)[number];

/** `g`: gramos del día o de la comida. `g_per_kg`: gramos por kilo del peso de referencia. */
export const UnidadDeRangoSchema = z.enum(['g', 'g_per_kg']);
export type UnidadDeRango = z.infer<typeof UnidadDeRangoSchema>;

/** Un límite que falta es `null`: no hay límite de ese lado. Nunca se toma como cero. */
const Limite = z.number().finite().nonnegative().nullable();

// ─── Entrada (API-PLN-03) ───────────────────────────────────────────────────────────────────────
/** Lo que escribe el profesional, en la unidad que eligió. Los gramos por kilo se pasan a gramos en el servidor. */
export const RangoDeMacroEntradaSchema = z.strictObject({ unit: UnidadDeRangoSchema, min: Limite, max: Limite });
export type RangoDeMacroEntrada = z.infer<typeof RangoDeMacroEntradaSchema>;
export const RangoEntradaSchema = z.strictObject({
  protein: RangoDeMacroEntradaSchema.optional(),
  carbohydrate: RangoDeMacroEntradaSchema.optional(),
  fat: RangoDeMacroEntradaSchema.optional(),
});
export type RangoEntrada = z.infer<typeof RangoEntradaSchema>;

/**
 * El peso de referencia: el registrado en Antropometría (por su medición; el valor y la fecha los pone el servidor) o
 * uno cargado a mano, con su fecha.
 */
export const PesoDeReferenciaEntradaSchema = z.discriminatedUnion('source', [
  z.strictObject({ source: z.literal('RECORDED'), measurementId: IdOpaco }),
  z.strictObject({ source: z.literal('MANUAL'), valueKg: z.number().finite(), measuredOn: FechaLocalSchema }),
]);
export type PesoDeReferenciaEntrada = z.infer<typeof PesoDeReferenciaEntradaSchema>;

export const RangosDeDiaTipoEntradaSchema = z.strictObject({
  dayTypeId: IdOpaco,
  /** El rango del día tipo entero; `null` si no se indica. */
  day: RangoEntradaSchema.nullable(),
  meals: z.array(z.strictObject({ mealId: IdOpaco, range: RangoEntradaSchema })).max(12),
});
export type RangosDeDiaTipoEntrada = z.infer<typeof RangosDeDiaTipoEntradaSchema>;

/** API-PLN-03: reemplaza todos los rangos de un borrador. Ninguno es obligatorio. */
export const EscribirRangosRequestSchema = z.strictObject({
  /** La revisión de los rangos que mostró la pantalla; 0 si todavía no tenía. Es aparte de la versión del borrador. */
  expectedRevision: z.number().int().nonnegative(),
  /** Hace falta si algún macronutriente va en gramos por kilo; si ninguno, no se guarda. */
  bodyWeight: PesoDeReferenciaEntradaSchema.nullable(),
  dayTypes: z.array(RangosDeDiaTipoEntradaSchema).max(7),
});
export type EscribirRangosRequest = z.infer<typeof EscribirRangosRequestSchema>;

// ─── Salida (API-PLN-02 y 03) ───────────────────────────────────────────────────────────────────
export const LimitesSchema = z.strictObject({ min: z.number().nullable(), max: z.number().nullable() });
export type Limites = z.infer<typeof LimitesSchema>;

export const RangoDeMacroSchema = z.strictObject({
  unit: UnidadDeRangoSchema,
  /** Lo escrito en gramos por kilo; `null` en gramos, y también cuando el peso del que salieron no se puede mostrar. */
  perKg: LimitesSchema.nullable(),
  /** Lo que guarda el plan, siempre en gramos. */
  grams: LimitesSchema,
});
export type RangoDeMacro = z.infer<typeof RangoDeMacroSchema>;
export const RangoSchema = z.strictObject({
  protein: RangoDeMacroSchema.optional(),
  carbohydrate: RangoDeMacroSchema.optional(),
  fat: RangoDeMacroSchema.optional(),
});
export type Rango = z.infer<typeof RangoSchema>;

/** El peso con el que se calcularon los gramos: «con 78 kg del 10/11». */
export const PesoDeReferenciaSchema = z.strictObject({
  source: z.enum(['RECORDED', 'MANUAL']),
  valueKg: z.number().positive(),
  measuredOn: FechaLocalSchema,
  /** La medición de Antropometría, si es un peso registrado; `null` si se cargó a mano. */
  measurementId: IdOpaco.nullable(),
});
export type PesoDeReferencia = z.infer<typeof PesoDeReferenciaSchema>;

export const PesoRegistradoSchema = z.strictObject({ measurementId: IdOpaco, valueKg: z.number().positive(), measuredOn: FechaLocalSchema });
export type PesoRegistrado = z.infer<typeof PesoRegistradoSchema>;

export const RangosDeDiaTipoSchema = z.strictObject({
  dayTypeId: IdOpaco,
  day: RangoSchema.nullable(),
  meals: z.array(z.strictObject({ mealId: IdOpaco, range: RangoSchema })),
});
export type RangosDeDiaTipo = z.infer<typeof RangosDeDiaTipoSchema>;

export const RangosDelPlanSchema = z.strictObject({
  planId: IdOpaco,
  state: z.enum(['DRAFT', 'ACTIVATED']),
  /** 0: el borrador todavía no tiene rangos. */
  revision: z.number().int().nonnegative(),
  bodyWeight: PesoDeReferenciaSchema.nullable(),
  /**
   * `true`: los gramos salieron de un peso registrado que este profesional ya no puede ver (Antropometría no está
   * habilitada para él). Entonces `bodyWeight` y cada `perKg` van en `null`, y quedan los gramos.
   */
  bodyWeightWithheld: z.boolean(),
  anthropometry: z.strictObject({
    /** Si la persona le habilitó Antropometría a este profesional. */
    enabled: z.boolean(),
    /** El último peso registrado que puede ver; `null` si no hay o si Antropometría no está habilitada. */
    latestWeight: PesoRegistradoSchema.nullable(),
  }),
  dayTypes: z.array(RangosDeDiaTipoSchema),
});
export type RangosDelPlan = z.infer<typeof RangosDelPlanSchema>;
export const RangosDelPlanResponseSchema = z.strictObject({ data: RangosDelPlanSchema });
export type RangosDelPlanResponse = z.infer<typeof RangosDelPlanResponseSchema>;
