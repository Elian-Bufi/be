/**
 * Contratos HTTP de WP-05 como schemas compartidos (09v7 T21): familia ANT (09v11 y el consolidado v0.16 §23 y §24).
 * Objetos estrictos: un campo no declarado → 400 UNKNOWN_FIELD (09v7 T12).
 *
 * Tokens: los del 09 cuando los fija (`IN_PREPARATION`/`REGISTERED`, `EFFECTIVE`/`ANNULLED`, `MEASURED`/`REPORTED`/
 * `DERIVED`, `AVAILABLE`/`NO_DATA`). En el dominio son `EN_PREPARACION`/`REGISTRADA`, `VIGENTE`/`ANULADA`, `MEDIDO`/
 * `REPORTADO`/`CALCULADO` y `REGISTRADO`/`SIN_DATO`, como hizo WP-03 con B2 y A3.
 *
 * Lo que el 09 deja como `{}` vacío se define acá y figura en DEUDA_LEGAJO DL-069: `author`, `summary`,
 * `specification`, `comparability` y `period`. Además:
 * - `formulaVersionId` no viaja en el request: lo resuelve el servidor desde la versión de método, porque ninguna
 *   operación lo publica (DL-061);
 * - `preparationReference` es una referencia opaca, sin entidad ni validación de formato (DL-062; INV-06-167).
 *
 * **La serie no miente** (INV-06-176/177): un checkpoint sin observación vigente es `NO_DATA` y **no lleva valor**.
 * No hay campo para interpolar, imputar ni arrastrar, y un cero medido viaja como `AVAILABLE` con `value: 0`.
 */
import { z } from 'zod';
import { IdOpaco, Instante, ValidationIssueSchema } from './contratos';
import { FechaLocalSchema, ZonaHorariaSchema } from './contratos-nutricion';
import { PaginaSchema, ResumenDeActorSchema, TokenDeVersionSchema } from './contratos-vinculo';

const Texto = (max: number) => z.string().trim().min(1).max(max);
const TextoOpcional = (max: number) => z.string().trim().max(max).nullable();

// ─── Tipos comunes ──────────────────────────────────────────────────────────────────────────────

/** REG-06-214 en la API. */
export const EstadoDeEvaluacionSchema = z.enum(['IN_PREPARATION', 'REGISTERED']);
/** REG-06-217: condición efectiva local de la medición. */
export const CondicionDeMedicionSchema = z.enum(['EFFECTIVE', 'ANNULLED']);
/** La frontera de 04:1090: lo medido, lo que informó la persona y lo que calculó BE. */
export const ClaseDeDatoSchema = z.enum(['MEASURED', 'REPORTED', 'DERIVED']);
/** REG-06-153; INV-06-167 no admite exigir formato ni proveedor. */
export const OrigenDeMedicionSchema = z.enum(['DIRECT_CAPTURE', 'SELF_REPORTED', 'CONTROLLED_IMPORT']);
/** REG-06-158: el redondeo se declara. */
export const ModoDeRedondeoSchema = z.enum(['HALF_UP', 'DOWN', 'UP']);
/** INV-06-176: `NO_DATA` no es cero, y un cero real es `AVAILABLE`. */
export const DisponibilidadSchema = z.enum(['AVAILABLE', 'NO_DATA']);
/** REG-06-162/163/164: por qué dos puntos no son comparables. */
export const MotivoDeIncomparabilidadSchema = z.enum(['PROTOCOL', 'METHOD', 'UNIT']);

/** REG-06-154: la unidad viaja siempre con el valor, y nunca se normaliza en silencio. */
export const MagnitudSchema = z.strictObject({ value: z.number().finite(), unit: Texto(24) });

/** Lo que hay que demostrar compatible para comparar (REG-06-162). Define el `{}` de 09v11 (DL-069). */
export const FichaDeComparabilidadSchema = z.strictObject({
  protocolId: IdOpaco,
  protocolVersionId: IdOpaco,
  protocolName: z.string(),
  methodId: IdOpaco.nullable(),
  methodVersionId: IdOpaco.nullable(),
  unit: z.string(),
});

// ─── API-ANT-01 · especificaciones ──────────────────────────────────────────────────────────────

export const EspecificacionSchema = z.strictObject({
  specificationId: IdOpaco,
  versionId: IdOpaco,
  key: z.string(),
  kind: z.enum(['PROTOCOL', 'METHOD']),
  name: z.string(),
  /** Métricas, unidades admitidas, entradas requeridas y precisión declarada (REG-06-154/158/159). */
  content: z.unknown(),
  /** Rótulo obligatorio: el contenido es sintético de demostración, no un catálogo científico (REG-06-157). */
  provenanceNote: z.string(),
  effectiveSince: Instante,
});
export type Especificacion = z.infer<typeof EspecificacionSchema>;
export type MagnitudApi = z.infer<typeof MagnitudSchema>;
export type FichaDeComparabilidadApi = z.infer<typeof FichaDeComparabilidadSchema>;
export type CorreccionDeMedicionApi = z.infer<typeof CorreccionDeMedicionSchema>;
export type AnulacionApi = z.infer<typeof AnulacionSchema>;
export type ResumenDeEvaluacionApi = z.infer<typeof ResumenDeEvaluacionSchema>;

export const ListaDeEspecificacionesResponseSchema = z.strictObject({ data: z.array(EspecificacionSchema), page: PaginaSchema });

// ─── Medición ───────────────────────────────────────────────────────────────────────────────────

/** Una corrección de la cadena de B-06: el original nunca se toca (REG-06-160; INV-06-171). */
export const CorreccionDeMedicionSchema = z.strictObject({
  correctionId: IdOpaco,
  previousCorrectionId: IdOpaco.nullable(),
  reason: z.string(),
  magnitude: MagnitudSchema,
  author: ResumenDeActorSchema,
  recordedAt: Instante,
});

/** REG-06-218: el evento de anulación conserva actor, momento y motivo. */
export const AnulacionSchema = z.strictObject({
  annulmentId: IdOpaco,
  reason: z.string(),
  author: ResumenDeActorSchema,
  occurredAt: Instante,
  recordedAt: Instante,
});

export const MedicionSchema = z.strictObject({
  measurementId: IdOpaco,
  evaluationId: IdOpaco,
  metric: z.string(),
  /** El valor tal como se tomó, con su unidad de origen (REG-06-154). */
  magnitude: MagnitudSchema,
  origin: OrigenDeMedicionSchema,
  dataClass: ClaseDeDatoSchema,
  protocol: FichaDeComparabilidadSchema,
  /** Referencia opaca de la preparación externa; solo en CONTROLLED_IMPORT (DL-062). */
  preparationReference: z.string().nullable(),
  /** REG-06-217: se deriva del evento de anulación, no es una columna que alguien pueda poner en cualquier valor. */
  condition: CondicionDeMedicionSchema,
  annulment: AnulacionSchema.nullable(),
  corrections: z.array(CorreccionDeMedicionSchema),
  /** La vista efectiva resuelta por relación, nunca por fecha (REG-06-16; 09v11:650-657). */
  effectiveMagnitude: MagnitudSchema.nullable(),
  occurredAt: Instante,
  recordedAt: Instante,
});
export type Medicion = z.infer<typeof MedicionSchema>;

// ─── Cálculo derivado ───────────────────────────────────────────────────────────────────────────

/** REG-06-159: la entrada declara qué medición se usó. Nunca se infiere por nombre ni por posición. */
export const EntradaDeCalculoSchema = z.strictObject({ measurementId: IdOpaco, metric: z.string(), magnitude: MagnitudSchema });

export const EjecucionDeCalculoSchema = z.strictObject({
  runId: IdOpaco,
  evaluationId: IdOpaco,
  methodId: IdOpaco,
  methodVersionId: IdOpaco,
  methodName: z.string(),
  metric: z.string(),
  magnitude: MagnitudSchema,
  /** REG-06-158: declarados, no implícitos. */
  precision: z.strictObject({ decimals: z.number().int().min(0).max(6), rounding: ModoDeRedondeoSchema }),
  inputs: z.array(EntradaDeCalculoSchema),
  /** REG-06-161: la corrida que esta reemplaza. Se relaciona con la anterior, no la sobrescribe. */
  supersedesRunId: IdOpaco.nullable(),
  author: ResumenDeActorSchema,
  recordedAt: Instante,
});
export type EjecucionDeCalculoApi = z.infer<typeof EjecucionDeCalculoSchema>;

// ─── Evaluación (API-ANT-02, 03, 04, 07 a 11) ───────────────────────────────────────────────────

export const EvaluacionAntropometricaSchema = z.strictObject({
  evaluationId: IdOpaco,
  adviseeId: IdOpaco,
  author: ResumenDeActorSchema,
  state: EstadoDeEvaluacionSchema,
  context: z.string().nullable(),
  /** Token de concurrencia del borrador (REG-06-216). */
  version: TokenDeVersionSchema,
  measurements: z.array(MedicionSchema),
  derivedResults: z.array(EjecucionDeCalculoSchema),
  occurredAt: Instante,
  recordedAt: Instante,
  /** Momento del acto explícito de registro; nulo mientras está en preparación (REG-06-214 inciso 4). */
  registeredAt: Instante.nullable(),
});
export type EvaluacionAntropometricaApi = z.infer<typeof EvaluacionAntropometricaSchema>;

/** Define el `summary{}` y el `author{}` que 09v11 dejó vacíos (DL-069). */
export const ResumenDeEvaluacionSchema = z.strictObject({
  evaluationId: IdOpaco,
  adviseeId: IdOpaco,
  author: ResumenDeActorSchema,
  state: EstadoDeEvaluacionSchema,
  summary: z.strictObject({
    measurementCount: z.number().int().nonnegative(),
    derivedResultCount: z.number().int().nonnegative(),
    metrics: z.array(z.string()),
    /** Cuántas mediciones están anuladas: un hecho, no un juicio. */
    annulledCount: z.number().int().nonnegative(),
  }),
  occurredAt: Instante,
  registeredAt: Instante.nullable(),
});

/**
 * Una medición directa tal como la declara el 09: métrica, valor y unidad (09v11 §6). El protocolo y la procedencia
 * son de la **evaluación**, no de cada fila: una evaluación es una toma, con su especificación y su origen.
 * La clase del dato se deriva de la procedencia declarada: el cliente no la elige (04:1090).
 */
export const MedicionDirectaSchema = z.strictObject({
  metricCode: Texto(60),
  value: z.number().finite(),
  unit: Texto(24),
});

/** El origen de la toma (REG-06-153). `preparationReference` es una referencia opaca y solo aplica a la importación. */
export const OrigenDeLaTomaSchema = z
  .strictObject({
    type: OrigenDeMedicionSchema,
    preparationReference: z.string().trim().max(200).nullable().optional(),
  })
  .refine((o) => o.type === 'CONTROLLED_IMPORT' || !o.preparationReference, {
    message: 'preparationReference solo corresponde a CONTROLLED_IMPORT',
    path: ['preparationReference'],
  });

/** Un método que la evaluación pide ejecutar en el mismo acto (09v11 §6, paso 7 de la frontera transaccional). */
export const MetodoSolicitadoSchema = z.strictObject({ methodVersionId: IdOpaco });

/**
 * API-ANT-02: crear la evaluación **ya registrada**, de una sola vez y de forma atómica. Es la vía directa que el
 * consolidado ratifica como P0 y distinta del borrador: «API-ANT-02 ≠ draft» (09v16:1709-1713).
 */
export const CrearEvaluacionAntropometricaRequestSchema = z.strictObject({
  occurredAt: Instante,
  specificationVersionId: IdOpaco,
  source: OrigenDeLaTomaSchema,
  directMeasurements: z.array(MedicionDirectaSchema).min(1).max(200),
  requestedDerivedMethods: z.array(MetodoSolicitadoSchema).max(10).optional(),
  professionalNotes: TextoOpcional(2000).optional(),
});

/** API-ANT-07: crear la evaluación en preparación. El request puede ser parcial (09v16 §23.2). */
export const CrearBorradorRequestSchema = z.strictObject({
  occurredAt: Instante.nullable().optional(),
  specificationVersionId: IdOpaco.nullable().optional(),
  source: OrigenDeLaTomaSchema.optional(),
  directMeasurements: z.array(MedicionDirectaSchema).max(200).optional(),
  requestedDerivedMethods: z.array(MetodoSolicitadoSchema).max(10).optional(),
  professionalNotes: TextoOpcional(2000).optional(),
});

/**
 * API-ANT-10: guardar el borrador. **Reemplaza la versión de trabajo**, no la historia registrada (09v16 §23.5), y
 * por eso el verbo es PUT. El token de trabajo evita pisar el trabajo de otro momento (REG-06-216).
 */
export const GuardarBorradorRequestSchema = z.strictObject({
  expectedVersion: TokenDeVersionSchema,
  occurredAt: Instante.nullable().optional(),
  specificationVersionId: IdOpaco.nullable().optional(),
  source: OrigenDeLaTomaSchema.optional(),
  directMeasurements: z.array(MedicionDirectaSchema).max(200),
  requestedDerivedMethods: z.array(MetodoSolicitadoSchema).max(10).optional(),
  professionalNotes: TextoOpcional(2000).optional(),
});

/** API-ANT-11: el acto explícito de registro (REG-06-214 inciso 4). */
export const RegistrarEvaluacionRequestSchema = z.strictObject({ expectedVersion: TokenDeVersionSchema });

export const EvaluacionAntropometricaResponseSchema = z.strictObject({ data: EvaluacionAntropometricaSchema });
export const ListaDeEvaluacionesAntropometricasResponseSchema = z.strictObject({ data: z.array(ResumenDeEvaluacionSchema), page: PaginaSchema });
export const ValidacionDeEvaluacionResponseSchema = z.strictObject({
  data: z.strictObject({ valid: z.boolean(), version: TokenDeVersionSchema, issues: z.array(ValidationIssueSchema) }),
});

// ─── API-ANT-05 · corrección ────────────────────────────────────────────────────────────────────

export const CorregirMedicionRequestSchema = z.strictObject({
  /** Qué se corrige dentro de la evaluación: el identificador de la medición (09v11:596-599). */
  targetId: IdOpaco,
  reason: Texto(1000),
  magnitude: MagnitudSchema,
});

// ─── API-ANT-12 · anulación ─────────────────────────────────────────────────────────────────────

export const AnularMedicionRequestSchema = z.strictObject({
  /** El token de la evaluación que contiene la medición: anular sobre una foto vieja es 409 (09v16 §24.1, paso 2). */
  expectedVersion: TokenDeVersionSchema.optional(),
  reason: Texto(1000),
  occurredAt: Instante.optional(),
});

/**
 * REG-06-220: al anular, el impacto sobre los dependientes se informa, no se esconde. `recalculated` son las corridas
 * nuevas; `withoutSuccessor`, las que quedaron sin entradas suficientes y **no** se reemplazan por un cero (inciso 6).
 */
export const AnularMedicionResponseSchema = z.strictObject({
  data: z.strictObject({
    measurementId: IdOpaco,
    condition: CondicionDeMedicionSchema,
    annulment: AnulacionSchema,
    /** `true` cuando la medición ya estaba anulada: no hubo segundo efecto (adversarial 6; DL-059). */
    alreadyAnnulled: z.boolean(),
    dependencyImpact: z.strictObject({
      recalculated: z.array(z.strictObject({ runId: IdOpaco, supersedesRunId: IdOpaco, metric: z.string(), magnitude: MagnitudSchema })),
      withoutSuccessor: z.array(z.strictObject({ runId: IdOpaco, metric: z.string(), missingInputs: z.array(z.string()) })),
    }),
  }),
});

// ─── API-ANT-06 · evolución ─────────────────────────────────────────────────────────────────────

/**
 * Un punto de la serie: una observación vigente, con su momento, su valor, su unidad y de qué evaluación salió
 * (09v11 §11). Los días sin observación **no están acá**: están en `gaps`, que es un rango sin valor. No hay campo
 * donde poner un cero, un valor interpolado ni uno arrastrado, y esa es la garantía (INV-06-176/177).
 */
export const PuntoDeSerieSchema = z.strictObject({
  occurredAt: Instante,
  recordedAt: Instante,
  value: z.number().finite(),
  unit: z.string(),
  sourceEvaluationId: IdOpaco,
  sourceId: IdOpaco,
  dataClass: ClaseDeDatoSchema,
  /** Agrupa los puntos que sí se pueden comparar entre sí: mismo protocolo, mismo método y misma unidad (REG-06-162). */
  comparabilityGroup: z.string(),
  /** Si el valor vigente viene del original o de una corrección de la cadena (REG-06-16). */
  correctionState: z.enum(['EFFECTIVE', 'CORRECTED']),
  /** Vacío si es comparable con el punto anterior; si no, por qué no (REG-06-164). */
  incomparableWithPrevious: z.array(MotivoDeIncomparabilidadSchema),
});
export type PuntoDeSerieApi = z.infer<typeof PuntoDeSerieSchema>;

/** Un tramo sin observación vigente, nombrado como tal (REG-06-165): un rango, no una fila con un valor vacío. */
export const HuecoDeSerieSchema = z.strictObject({
  from: FechaLocalSchema,
  to: FechaLocalSchema,
  state: z.literal('NO_DATA'),
  days: z.number().int().positive(),
});

/** Un grupo de comparabilidad: qué hace comparables entre sí a los puntos que lo comparten (REG-06-162). */
export const GrupoDeComparabilidadSchema = z.strictObject({
  comparabilityGroup: z.string(),
  protocolVersionId: IdOpaco,
  protocolName: z.string(),
  methodVersionId: IdOpaco.nullable(),
  unit: z.string(),
});

export const SerieSchema = z.strictObject({
  metricCode: z.string(),
  series: z.array(PuntoDeSerieSchema),
  gaps: z.array(HuecoDeSerieSchema),
  comparability: z.strictObject({ groups: z.array(GrupoDeComparabilidadSchema) }),
});
export type SerieApi = z.infer<typeof SerieSchema>;

/**
 * Define el `period{}` y el `comparability{}` que 09v11 dejó vacíos (DL-069).
 *
 * `partialView` es del 09 y significa exactamente lo que el 09 dice: «la proyección fue construida correctamente
 * usando únicamente el subconjunto de fuentes que el actor está autorizado a consultar», y **no** «error incompleto»
 * (09v11:786-796). Acá es `true` cuando el asesorado tiene evaluaciones registradas en el período que son de otro
 * profesional: existen, no se muestran, y la respuesta lo dice en vez de presentar la serie como completa.
 *
 * `metrics` es un bloque por métrica. El 09 declara una métrica por respuesta (`metricCode` en la raíz); BE devuelve
 * varias con la misma forma, porque el asesorado no tiene ninguna operación para descubrir sus métricas. La
 * diferencia está declarada en DEUDA_LEGAJO.
 */
export const EvolucionResponseSchema = z.strictObject({
  data: z.strictObject({
    adviseeId: IdOpaco,
    period: z.strictObject({ start: FechaLocalSchema, end: FechaLocalSchema, timeZone: ZonaHorariaSchema }),
    metrics: z.array(SerieSchema),
    partialView: z.boolean(),
    /** Lo que el legajo prohíbe hacer con esta serie, dicho en el propio contrato (REG-06-166; RF-049). */
    honesty: z.strictObject({
      interpolated: z.literal(false),
      imputed: z.literal(false),
      carriedForward: z.literal(false),
    }),
  }),
});
export type EvolucionResponse = z.infer<typeof EvolucionResponseSchema>;
