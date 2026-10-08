/**
 * Contratos del entorno profesional de seguimiento (WP-DASHBOARD-PROFESIONAL; encargo de Dirección del 2026-10-08):
 * - API-DSH-04 — línea de tiempo longitudinal (09 v0.11 §16; DL-127);
 * - API-PRJ-01 — proyección profunda (09 v0.11 §18-§23; DL-126);
 * - API-VAN-01 a 04 — vistas de análisis guardadas, familia propia de BE (DL-128).
 *
 * Reglas que la forma protege (y que serían fáciles de romper sin darse cuenta):
 * - **Lo desconocido no es cero.** Un valor que falta es `null` con su motivo; no hay campo donde poner un cero
 *   inventado, un valor interpolado ni uno arrastrado (09 v0.11 §11 y §22; B10-08 §3).
 * - **Ocurrió y registrado son independientes** (T-06-24; 09 v0.11 §16). Un hecho que solo tiene fecha lleva
 *   `occurredDate` y `occurredAt: null`: no se inventa una hora, y `recordedAt` nunca rellena la ocurrencia.
 * - **Ningún puntaje.** No existe `score`, `compliance`, `adherence` ni un juicio por color: los campos describen datos,
 *   no a la persona (09 v0.11 §15; B10-08 §10).
 * - **La vista parcial es un aviso único** (`partialView`), sin nombrar lo que no se ve (B10-08 §8.4).
 * - **Una vista guardada es configuración**, nunca datos de salud ni un permiso: cada lectura vuelve a pasar por el PDP.
 */
import { z } from 'zod';
import { Instante, IdOpaco } from './contratos';
import { FechaLocalSchema, ZonaHorariaSchema } from './contratos-nutricion';
import { TokenDeVersionSchema } from './contratos-vinculo';

// ─── Comunes ────────────────────────────────────────────────────────────────────────────────────

/** La taxonomía cerrada del 09 (v0.11 §18): ocho claves, ninguna extra (11A TEST-PRJ-001). */
export const CLAVES_DE_PROYECCION = [
  'TRAINING_VOLUME_BY_EXERCISE',
  'TRAINING_VOLUME_BY_MUSCLE_ZONE',
  'TRAINING_EFFECTIVE_VS_TOTAL_VOLUME',
  'TRAINING_PROGRESSION_BY_EXERCISE',
  'TRAINING_PERSONAL_RECORDS',
  'TRAINING_WORK_DISTRIBUTION_BY_MUSCLE_ZONE',
  'ANTHROPOMETRY_LONGITUDINAL',
  'NUTRITION_PRESCRIBED_VS_RECORDED',
] as const;
export const ClaveDeProyeccionSchema = z.enum(CLAVES_DE_PROYECCION);
export type ClaveDeProyeccion = z.infer<typeof ClaveDeProyeccionSchema>;

/** Las tres claves con una derivación definida en BE (DL-126). Las otras cinco responden `INSUFFICIENT_INFORMATION`. */
export const PROYECCIONES_DERIVADAS = ['NUTRITION_PRESCRIBED_VS_RECORDED', 'TRAINING_PROGRESSION_BY_EXERCISE', 'ANTHROPOMETRY_LONGITUDINAL'] as const satisfies readonly ClaveDeProyeccion[];

/** Estados longitudinales del 09 (v0.11 §22). `NO_DATA` nunca se representa como cero. */
export const EstadoLongitudinalSchema = z.enum(['AVAILABLE', 'NO_DATA', 'NOT_COMPARABLE', 'INSUFFICIENT_INFORMATION', 'NOT_AVAILABLE_TO_VIEW']);
export type EstadoLongitudinal = z.infer<typeof EstadoLongitudinalSchema>;

/** Los dominios del entorno profesional, con el nombre del 09 (v0.11 §16: `domain: "ANTHROPOMETRY"`). */
export const DominioDeAnalisisSchema = z.enum(['NUTRITION', 'TRAINING', 'ANTHROPOMETRY']);
export type DominioDeAnalisis = z.infer<typeof DominioDeAnalisisSchema>;

/** El período en fechas civiles del asesorado, inclusive, con su zona. */
export const PeriodoCivilSchema = z.strictObject({ start: FechaLocalSchema, end: FechaLocalSchema, timeZone: ZonaHorariaSchema });
export type PeriodoCivil = z.infer<typeof PeriodoCivilSchema>;

/** De qué registro sale un dato: lo que abre «Abrir registro». Es un identificador opaco, nunca texto clínico. */
export const TipoDeOrigenSchema = z.enum([
  'MEAL_RECORD',
  'NUTRITION_PLAN_VERSION',
  'NUTRITION_OBJECTIVE_VERSION',
  'NUTRITION_REVIEW',
  'TRAINING_EXECUTION',
  'TRAINING_PLAN_VERSION',
  'TRAINING_OBJECTIVE_VERSION',
  'TRAINING_REVIEW',
  'ANTHROPOMETRIC_EVALUATION',
  'ANTHROPOMETRIC_MEASUREMENT',
  'CALCULATION_RUN',
  'FOLLOW_UP_PROCESS',
]);
export type TipoDeOrigen = z.infer<typeof TipoDeOrigenSchema>;
export const OrigenDeDatoSchema = z.strictObject({ type: TipoDeOrigenSchema, id: IdOpaco });
export type OrigenDeDato = z.infer<typeof OrigenDeDatoSchema>;

/** Una línea factual («Repeticiones: 8», «Objetivo: 8 a 10»). Nunca un juicio. */
export const DetalleFactualSchema = z.strictObject({ label: z.string().min(1), value: z.string() });

// ─── Series de una métrica (resultado común de las proyecciones derivadas) ──────────────────────

/**
 * Calidad de un punto:
 * - `COMPLETE`: todo lo que el punto declara sumar o medir está;
 * - `PARTIAL`: es un **subtotal de lo registrado** (falta algún dato: registros sin cantidades o un nutriente sin dato);
 * - `UNKNOWN`: hay registros, pero ningún valor conocido para esta métrica (`value: null`).
 */
export const CalidadDePuntoSchema = z.enum(['COMPLETE', 'PARTIAL', 'UNKNOWN']);
export type CalidadDePunto = z.infer<typeof CalidadDePuntoSchema>;

export const GranoSchema = z.enum(['ORIGINAL', 'DAY', 'WEEK']);
export type Grano = z.infer<typeof GranoSchema>;

export const EscalaSchema = z.enum(['RATIO', 'INTERVAL', 'ORDINAL', 'COUNT']);
export type Escala = z.infer<typeof EscalaSchema>;

/** Cómo se resume un balde (día o semana). `NONE`: cada punto es una observación, sin agregar. */
export const AgregacionSchema = z.enum(['NONE', 'SUM_OF_KNOWN', 'MEAN_OF_DAYS_WITH_DATA', 'COUNT', 'SUM']);
export type Agregacion = z.infer<typeof AgregacionSchema>;

/** Lo que falta en un punto, por motivo y cuántas veces (por ejemplo, «2 registros sin cantidades»). */
export const FaltanteDelPuntoSchema = z.strictObject({ reason: z.string().min(1), count: z.number().int().positive() });

/** La cobertura que sostiene un punto de nutrición: qué se registró y con qué cantidades. */
export const CoberturaDelPuntoSchema = z.strictObject({
  records: z.number().int().nonnegative(),
  recordsWithQuantities: z.number().int().nonnegative(),
  recordsWithoutQuantities: z.number().int().nonnegative(),
  /** En el grano semanal: los días con al menos un valor conocido, y los días del balde que caen en el período. */
  daysWithData: z.number().int().nonnegative().nullable(),
  daysInBucket: z.number().int().positive().nullable(),
});
export type CoberturaDelPunto = z.infer<typeof CoberturaDelPuntoSchema>;

export const PuntoAnaliticoSchema = z.strictObject({
  /** Identificador estable del punto dentro de la serie: sirve para elegirlo y volver a él. */
  pointId: z.string().min(1),
  /** La fecha civil del punto (para la semana, el lunes de esa semana). */
  date: FechaLocalSchema,
  /** El último día del balde semanal; `null` en los otros granos. */
  dateEnd: FechaLocalSchema.nullable(),
  /** La hora del hecho, cuando el grano es el original y el hecho la tiene. Nunca se inventa. */
  at: Instante.nullable(),
  value: z.number().finite().nullable(),
  quality: CalidadDePuntoSchema,
  /** Cuántas observaciones sostienen el punto (registros, series o tomas). */
  n: z.number().int().nonnegative(),
  /** Tramo de la línea: dos puntos seguidos se unen solo si comparten tramo (huecos y cambios de método cortan). */
  segment: z.string().min(1),
  /** El valor vigente viene de una corrección o rectificación (se cuenta una sola vez). */
  corrected: z.boolean(),
  /** El balde no está completo dentro del período (una semana partida, o el día de hoy). */
  partialBucket: z.boolean(),
  coverage: CoberturaDelPuntoSchema.nullable(),
  missing: z.array(FaltanteDelPuntoSchema),
  detail: z.array(DetalleFactualSchema),
  sources: z.array(OrigenDeDatoSchema).max(60),
  /** Hay más registros detrás del punto que los listados en `sources`. */
  sourcesTruncated: z.boolean(),
});
export type PuntoAnalitico = z.infer<typeof PuntoAnaliticoSchema>;

/** Un tramo sin observaciones, nombrado como tal (09 v0.11 §11): un rango, no una fila con un valor vacío. */
export const HuecoAnaliticoSchema = z.strictObject({ from: FechaLocalSchema, to: FechaLocalSchema, days: z.number().int().positive(), state: z.literal('NO_DATA') });

export const TramoAnaliticoSchema = z.strictObject({
  segment: z.string().min(1),
  /** Qué hace comparables a los puntos del tramo (protocolo y método, unidad, versión del plan). */
  label: z.string(),
  /** Por qué empieza un tramo nuevo; `null` para el primero o cuando solo lo corta un hueco. */
  breakReason: z.string().nullable(),
});

export const SerieAnaliticaSchema = z.strictObject({
  metricId: z.string().min(1),
  label: z.string().min(1),
  unit: z.string().min(1),
  scale: EscalaSchema,
  grain: GranoSchema,
  aggregation: AgregacionSchema,
  points: z.array(PuntoAnaliticoSchema),
  gaps: z.array(HuecoAnaliticoSchema),
  segments: z.array(TramoAnaliticoSchema),
  /** Límites de interpretación de esta serie, dichos en la respuesta. */
  notes: z.array(z.string()),
});
export type SerieAnalitica = z.infer<typeof SerieAnaliticaSchema>;

/** Una banda de vigencia de un plan: contexto temporal, **no** «plan cumplido». */
export const VigenciaDePlanSchema = z.strictObject({
  domain: DominioDeAnalisisSchema,
  planVersionId: IdOpaco,
  /** «v2», según el orden de activación de las versiones del plan. */
  label: z.string(),
  activatedAt: Instante,
  from: FechaLocalSchema,
  /**
   * El día del corte: la activación de la sucesora o el cierre del seguimiento (06:4297), lo primero. Ese día ya rige la
   * siguiente, así que dos bandas pueden compartirlo. `null` si sigue vigente.
   */
  to: FechaLocalSchema.nullable(),
});
export type VigenciaDePlan = z.infer<typeof VigenciaDePlanSchema>;

// ─── API-PRJ-01 · resultados por clave ──────────────────────────────────────────────────────────

export const MetricaNutricionalSchema = z.enum(['ENERGY', 'PROTEIN', 'CARBOHYDRATE', 'FAT', 'FIBER', 'RECORDS']);
export type MetricaNutricional = z.infer<typeof MetricaNutricionalSchema>;

/** Una versión del objetivo nutricional con su requerimiento energético: un escalón, no una curva continua. */
export const EscalonDeRequerimientoSchema = z.strictObject({
  objectiveVersionId: IdOpaco,
  from: FechaLocalSchema,
  to: FechaLocalSchema.nullable(),
  value: z.number().positive().finite(),
  unit: z.literal('kcal/day'),
});

export const ResultadoDeProyeccionNutricionalSchema = z.strictObject({
  kind: z.literal('NUTRITION_PRESCRIBED_VS_RECORDED'),
  metric: MetricaNutricionalSchema,
  /** Lo **registrado**: subtotales de lo conocido, con su cobertura. Nunca «consumo total». */
  recorded: SerieAnaliticaSchema,
  prescribed: z.strictObject({
    /** El requerimiento energético de cada versión del objetivo vigente en el período (solo para la energía). */
    energyRequirement: z.array(EscalonDeRequerimientoSchema),
    /** Por qué lo previsto de las opciones no se suma como un objetivo diario (alternativas por comida). */
    note: z.string(),
  }),
  coverage: z.strictObject({
    daysInPeriod: z.number().int().positive(),
    daysWithRecords: z.number().int().nonnegative(),
    records: z.number().int().nonnegative(),
    recordsWithQuantities: z.number().int().nonnegative(),
    recordsWithoutQuantities: z.number().int().nonnegative(),
    /** Comidas diferentes sin cantidades: texto o foto, sin calorías ni macros inventados. */
    differentMealsWithoutQuantities: z.number().int().nonnegative(),
    /** Registros anulados por el titular: siguen en el historial y quedan fuera del agregado. */
    annulledExcluded: z.number().int().nonnegative(),
    /** Registros cuyo valor vigente es una rectificación: cuentan una sola vez, en su versión efectiva. */
    rectifiedCountedOnce: z.number().int().nonnegative(),
  }),
  planVersions: z.array(VigenciaDePlanSchema),
});
export type ResultadoDeProyeccionNutricional = z.infer<typeof ResultadoDeProyeccionNutricionalSchema>;

export const MetricaDeEntrenamientoSchema = z.enum(['LOAD', 'REPETITIONS', 'RIR', 'SETS_RECORDED']);
export type MetricaDeEntrenamiento = z.infer<typeof MetricaDeEntrenamientoSchema>;

/** Un ejercicio del período, por identidad (`e:<exerciseId>`, o `v:<versionId>` si no se conoce su ejercicio). */
export const EjercicioDelPeriodoSchema = z.strictObject({
  exerciseKey: z.string().regex(/^[ev]:[0-9a-fA-F-]{36}$/),
  name: z.string(),
  otherNames: z.array(z.string()),
  homonym: z.boolean(),
  /** Sesiones registradas del período en las que aparece. */
  sessions: z.number().int().nonnegative(),
  /** Los números de serie planificados o registrados de este ejercicio. */
  setNumbers: z.array(z.number().int().positive()),
  /** Las unidades de carga registradas: kg y lb nunca se mezclan en una misma serie. */
  loadUnits: z.array(z.enum(['kg', 'lb'])),
  lastDate: FechaLocalSchema.nullable(),
});
export type EjercicioDelPeriodo = z.infer<typeof EjercicioDelPeriodoSchema>;

export const ResultadoDeProyeccionDeEntrenamientoSchema = z.strictObject({
  kind: z.literal('TRAINING_PROGRESSION_BY_EXERCISE'),
  /** Los ejercicios con sesiones registradas en el período (para el selector), siempre presentes. */
  exercises: z.array(EjercicioDelPeriodoSchema),
  /** La serie pedida (`exerciseId` y `metric`); `null` si no se pidió un ejercicio. */
  progression: z
    .strictObject({
      exerciseKey: z.string(),
      metric: MetricaDeEntrenamientoSchema,
      /** El número de serie comparado entre sesiones; `null` para el conteo de series registradas. */
      setIndex: z.number().int().positive().nullable(),
      unit: z.enum(['kg', 'lb']).nullable(),
      series: SerieAnaliticaSchema,
    })
    .nullable(),
  planVersions: z.array(VigenciaDePlanSchema),
});
export type ResultadoDeProyeccionDeEntrenamiento = z.infer<typeof ResultadoDeProyeccionDeEntrenamientoSchema>;

export const MetricaAntropometricaDisponibleSchema = z.strictObject({
  metricCode: z.string().min(1),
  name: z.string(),
  observations: z.number().int().nonnegative(),
  units: z.array(z.string()),
});

export const ResultadoDeProyeccionAntropometricaSchema = z.strictObject({
  kind: z.literal('ANTHROPOMETRY_LONGITUDINAL'),
  /** Las métricas con observaciones en el período (para el selector). */
  available: z.array(MetricaAntropometricaDisponibleSchema),
  /** Las series pedidas, una por métrica, con un tramo por grupo de comparabilidad (09 v0.11 §10-§11). */
  series: z.array(SerieAnaliticaSchema),
  honesty: z.strictObject({ interpolated: z.literal(false), imputed: z.literal(false), carriedForward: z.literal(false) }),
});
export type ResultadoDeProyeccionAntropometrica = z.infer<typeof ResultadoDeProyeccionAntropometricaSchema>;

export const ResultadoDeProyeccionSchema = z.discriminatedUnion('kind', [ResultadoDeProyeccionNutricionalSchema, ResultadoDeProyeccionDeEntrenamientoSchema, ResultadoDeProyeccionAntropometricaSchema]);
export type ResultadoDeProyeccion = z.infer<typeof ResultadoDeProyeccionSchema>;

/** Por qué una proyección no tiene resultado. `SPECIFICATION_PENDING`: el 09 exige una especificación que BE no tiene. */
export const MotivoSinResultadoSchema = z.enum(['SPECIFICATION_PENDING', 'NO_RECORDS_IN_PERIOD']);

export const ProyeccionResponseSchema = z.strictObject({
  data: z.strictObject({
    projectionKey: ClaveDeProyeccionSchema,
    period: PeriodoCivilSchema,
    partialView: z.boolean(),
    generatedAt: Instante,
    dataState: EstadoLongitudinalSchema,
    reason: MotivoSinResultadoSchema.nullable(),
    /** La especificación de derivación usada (09 v0.11 §19); `null` si no hay derivación. */
    derivation: z.strictObject({ specificationId: z.string(), version: z.string(), method: z.string() }).nullable(),
    sourceDomains: z.array(DominioDeAnalisisSchema),
    result: ResultadoDeProyeccionSchema.nullable(),
  }),
});
export type ProyeccionResponse = z.infer<typeof ProyeccionResponseSchema>;

// ─── API-DSH-04 · línea de tiempo ───────────────────────────────────────────────────────────────

export const TIPOS_DE_EVENTO = [
  'NUTRITION_PLAN_ACTIVATED',
  'NUTRITION_OBJECTIVE_SET',
  'MEAL_RECORDED',
  'NUTRITION_REVIEW_RECORDED',
  'TRAINING_PLAN_ACTIVATED',
  'TRAINING_OBJECTIVE_SET',
  'TRAINING_SESSION_RECORDED',
  'TRAINING_REVIEW_RECORDED',
  'ANTHROPOMETRIC_EVALUATION_RECORDED',
  'FOLLOW_UP_OPENED',
  'FOLLOW_UP_CLOSED',
] as const;
export const TipoDeEventoSchema = z.enum(TIPOS_DE_EVENTO);
export type TipoDeEvento = z.infer<typeof TipoDeEventoSchema>;

/** El estado de la entrada respecto de su historia. Una anulación no borra la entrada (B10-08 §12). */
export const EstadoDeEntradaSchema = z.enum(['EFFECTIVE', 'RECTIFIED', 'ANNULLED', 'CORRECTED']);
export type EstadoDeEntrada = z.infer<typeof EstadoDeEntradaSchema>;

/** Rasgos operativos del dato, para filtrar y avisar: nunca alertas clínicas. */
export const CalidadDeEntradaSchema = z.enum([
  'QUANTITIES_UNCONFIRMED',
  'QUANTITIES_FROM_PLAN',
  'QUANTITIES_REPORTED',
  'NUTRIENTS_INCOMPLETE',
  'DIFFERENT_MEAL',
  'SESSION_SUMMARY_ONLY',
  'SESSION_NOT_COMPLETED',
  'SESSION_WITH_DEVIATION',
]);
export type CalidadDeEntrada = z.infer<typeof CalidadDeEntradaSchema>;

/**
 * Solo relaciones que las fuentes ya contienen (09 v0.11 §16; B10-08 §11.3): nunca por cercanía temporal
 * (11A TEST-TIM-002).
 */
export const RelacionDeEntradaSchema = z.strictObject({
  kind: z.enum(['RECTIFIED', 'ANNULLED', 'CORRECTED', 'EXECUTES_PLAN_VERSION', 'SUCCEEDS_VERSION', 'MEASUREMENT_CORRECTED', 'MEASUREMENT_ANNULLED', 'REVIEW_APPLIED']),
  at: Instante.nullable(),
  target: OrigenDeDatoSchema.nullable(),
  label: z.string(),
});
export type RelacionDeEntrada = z.infer<typeof RelacionDeEntradaSchema>;

export const EntradaDeLineaDeTiempoSchema = z.strictObject({
  timelineEntryId: z.string().min(1),
  domain: DominioDeAnalisisSchema,
  eventType: TipoDeEventoSchema,
  source: OrigenDeDatoSchema,
  /** El instante del hecho; `null` si el hecho solo tiene fecha. Nunca se copia de `recordedAt`. */
  occurredAt: Instante.nullable(),
  /** La fecha civil del hecho, en la zona del asesorado: ordena la línea de tiempo. */
  occurredDate: FechaLocalSchema,
  recordedAt: Instante.nullable(),
  /** Se registró en un día civil posterior al del hecho (carga tardía). */
  recordedLate: z.boolean(),
  timeZone: ZonaHorariaSchema,
  author: z.strictObject({ identityId: IdOpaco, displayName: z.string(), role: z.enum(['PROFESSIONAL', 'ADVISEE']) }).nullable(),
  title: z.string().min(1),
  details: z.array(DetalleFactualSchema),
  state: EstadoDeEntradaSchema,
  quality: z.array(CalidadDeEntradaSchema),
  planVersionId: IdOpaco.nullable(),
  exerciseKeys: z.array(z.string()),
  relations: z.array(RelacionDeEntradaSchema),
});
export type EntradaDeLineaDeTiempo = z.infer<typeof EntradaDeLineaDeTiempoSchema>;

/**
 * Cuántas entradas tiene el período en el conjunto autorizado, **antes de los filtros**, por tipo y por rasgo de calidad:
 * la cobertura del Resumen sale de una sola lectura. Un alcance denegado no aporta a ningún conteo (TEST-DSH-002).
 */
export const ConteosDelPeriodoSchema = z.strictObject({
  byEventType: z.array(z.strictObject({ eventType: TipoDeEventoSchema, count: z.number().int().positive() })),
  byQuality: z.array(z.strictObject({ quality: CalidadDeEntradaSchema, count: z.number().int().positive() })),
  recordedLate: z.number().int().nonnegative(),
});
export type ConteosDelPeriodo = z.infer<typeof ConteosDelPeriodoSchema>;

export const LineaDeTiempoResponseSchema = z.strictObject({
  data: z.strictObject({
    period: PeriodoCivilSchema,
    partialView: z.boolean(),
    generatedAt: Instante,
    sourceDomains: z.array(DominioDeAnalisisSchema),
    /** Cuántas entradas del conjunto autorizado cumplen los filtros en todo el período (no solo en esta página). */
    totalMatching: z.number().int().nonnegative(),
    periodCounts: ConteosDelPeriodoSchema,
    /** La búsqueda `q` recorre todo el período del conjunto autorizado, no solo lo cargado. */
    searchScope: z.literal('WHOLE_PERIOD'),
    entries: z.array(EntradaDeLineaDeTiempoSchema),
  }),
  page: z.strictObject({ limit: z.number().int().positive(), nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type LineaDeTiempoResponse = z.infer<typeof LineaDeTiempoResponseSchema>;

// ─── API-VAN-01 a 04 · vistas de análisis guardadas ─────────────────────────────────────────────

/** Una métrica elegida: identificadores opacos y parámetros de la proyección. Ningún dato de salud. */
export const ReferenciaDeMetricaSchema = z.strictObject({
  metricId: z.string().regex(/^(nutricion|entrenamiento|antropometria)\.[a-z0-9-]+$/),
  exerciseKey: z
    .string()
    .regex(/^[ev]:[0-9a-fA-F-]{36}$/)
    .nullable(),
  setIndex: z.number().int().min(1).max(30).nullable(),
  unit: z.enum(['kg', 'lb']).nullable(),
});
export type ReferenciaDeMetrica = z.infer<typeof ReferenciaDeMetricaSchema>;

const RangoCivilSchema = z.strictObject({ start: FechaLocalSchema, end: FechaLocalSchema });

export const ConfiguracionDeAnalisisSchema = z.strictObject({
  schemaVersion: z.literal(1),
  metrics: z.array(ReferenciaDeMetricaSchema).min(1).max(3),
  mode: z.enum(['PANELS', 'OVERLAY', 'RELATIVE']),
  grain: GranoSchema,
  period: z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('LAST_DAYS'), days: z.union([z.literal(7), z.literal(30), z.literal(90), z.literal(365)]) }),
    z.strictObject({ kind: z.literal('RANGE'), start: FechaLocalSchema, end: FechaLocalSchema }),
  ]),
  layers: z.strictObject({ planBands: z.boolean(), events: z.boolean() }),
  /** La referencia del cambio relativo: los primeros N días del período. */
  referenceDays: z.number().int().min(1).max(31),
  comparison: z.strictObject({ a: RangoCivilSchema, b: RangoCivilSchema }).nullable(),
});
export type ConfiguracionDeAnalisis = z.infer<typeof ConfiguracionDeAnalisisSchema>;

export const ConfiguracionDeIndicadoresSchema = z.strictObject({
  schemaVersion: z.literal(1),
  metrics: z.array(ReferenciaDeMetricaSchema).min(1).max(4),
});
export type ConfiguracionDeIndicadores = z.infer<typeof ConfiguracionDeIndicadoresSchema>;

const NombreDeVistaSchema = z.string().trim().min(1).max(80);

export const VistaDeAnalisisSchema = z.discriminatedUnion('usage', [
  z.strictObject({
    viewId: IdOpaco,
    usage: z.literal('ANALYSIS'),
    name: NombreDeVistaSchema,
    configuration: ConfiguracionDeAnalisisSchema,
    version: TokenDeVersionSchema,
    createdAt: Instante,
    updatedAt: Instante,
  }),
  z.strictObject({
    viewId: IdOpaco,
    usage: z.literal('SUMMARY_INDICATORS'),
    name: NombreDeVistaSchema,
    configuration: ConfiguracionDeIndicadoresSchema,
    version: TokenDeVersionSchema,
    createdAt: Instante,
    updatedAt: Instante,
  }),
]);
export type VistaDeAnalisis = z.infer<typeof VistaDeAnalisisSchema>;

export const ListaDeVistasResponseSchema = z.strictObject({ data: z.array(VistaDeAnalisisSchema) });
export const VistaDeAnalisisResponseSchema = z.strictObject({ data: VistaDeAnalisisSchema });

export const CrearVistaRequestSchema = z.discriminatedUnion('usage', [
  z.strictObject({ usage: z.literal('ANALYSIS'), name: NombreDeVistaSchema, configuration: ConfiguracionDeAnalisisSchema }),
  z.strictObject({ usage: z.literal('SUMMARY_INDICATORS'), name: NombreDeVistaSchema, configuration: ConfiguracionDeIndicadoresSchema }),
]);
export type CrearVistaRequest = z.infer<typeof CrearVistaRequestSchema>;

export const ReemplazarVistaRequestSchema = z.strictObject({
  expectedVersion: TokenDeVersionSchema,
  name: NombreDeVistaSchema,
  configuration: z.union([ConfiguracionDeAnalisisSchema, ConfiguracionDeIndicadoresSchema]),
});
export type ReemplazarVistaRequest = z.infer<typeof ReemplazarVistaRequestSchema>;
