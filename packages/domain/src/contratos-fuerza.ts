/**
 * La vertical de fuerza de WP-EDITORES-PROFESIONAL (DL-171; DJ-1): los contratos de la API, solo para el profesional.
 *
 * - **API-FZA-01 a 03 (ED-72), familia propia de BE:** la serie observada por el profesional. Se guarda con su estimación
 *   (especificación, versión, método, banda, entradas y valor), como hecho histórico (REG-06-205), y no se edita: una
 *   corrección o una anulación es una observación nueva que sucede a la anterior, con su motivo. El RIR es obligatorio y
 *   va de 0 a 2: una observación que no se puede estimar no se guarda (ED-D19).
 * - **La clave nueva de API-PRJ-01 (ED-74):** `TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE`, la estimación por ejercicio con
 *   Epley v1, calculada al leer desde el registro vigente de cada sesión y las observaciones. Nunca la clave de las marcas
 *   (TRAINING_PERSONAL_RECORDS; B10-08: «marca observada ≠ 1RM estimado»).
 *
 * Nada de esto llega a la persona: no hay ruta del titular, y ninguna lectura de la APK cambia.
 */
import { z } from 'zod';
import { Instante, IdOpaco } from './contratos';
import { CargaSchema } from './contratos-entrenamiento';
import { FechaLocalSchema, ZonaHorariaSchema } from './contratos-nutricion';
import { PaginaSchema, ResumenDeActorSchema, TokenDeVersionSchema } from './contratos-vinculo';

const Texto = (max: number) => z.string().trim().min(1).max(max);

/** La identidad del método en la API (RM-14): la que lleva cada valor y que una versión futura no reescribe (RM-18). */
export const MetodoDeLaEstimacionSchema = z.strictObject({ specification: z.literal('BE-E1RM'), version: z.literal(1), method: z.literal('EPLEY_V1') });

/** `CORE`: hasta 10 repeticiones equivalentes; `ORIENTATIVE`: de más de 10 a 12 (DL-171). */
export const BandaDeLaEstimacionApiSchema = z.enum(['CORE', 'ORIENTATIVE']);
export type BandaDeLaEstimacionApi = z.infer<typeof BandaDeLaEstimacionApiSchema>;

/**
 * Un valor del método con sus entradas: lo necesario para que «Cómo se calculó» reproduzca la cuenta (ED-73). `value`
 * lleva todos sus decimales; la vista lo redondea al medio kilo o a la libra (RM-22).
 */
export const EstimacionDeFuerzaApiSchema = MetodoDeLaEstimacionSchema.extend({
  band: BandaDeLaEstimacionApiSchema,
  load: CargaSchema,
  completedRepetitions: z.number().int().positive(),
  rir: z.number().min(0).max(2),
  equivalentRepetitions: z.number().positive().max(12),
  value: z.number().positive().finite(),
});
export type EstimacionDeFuerzaApi = z.infer<typeof EstimacionDeFuerzaApiSchema>;

// ─── API-FZA-01 a 03 · la serie observada (ED-72) ───────────────────────────────────────────────────────────────────

/**
 * Lo que observa el profesional. El RIR viaja como número sin rango (y `null` permitido) para que «Sin RIR» o un RIR
 * mayor que 2 sean el 422 que dice el motivo en palabras, y no un 400 (como el RIR de la prescripción).
 */
export const SerieObservadaSchema = z.strictObject({
  /** El ejercicio del catálogo (no su versión): la identidad de la línea (RM-10). */
  exerciseId: IdOpaco,
  /** La fecha civil en la que se observó, en la zona de la persona (RM-15). No puede ser futura. */
  localDate: FechaLocalSchema,
  timeZone: ZonaHorariaSchema,
  load: CargaSchema,
  completedRepetitions: z.number().int().nonnegative().max(1000),
  rir: z.number().finite().nullable(),
  note: z.string().trim().max(500).nullable().optional(),
});
export type SerieObservada = z.infer<typeof SerieObservadaSchema>;

/** API-FZA-01. */
export const RegistrarSerieObservadaRequestSchema = SerieObservadaSchema;
export type RegistrarSerieObservadaRequest = z.infer<typeof RegistrarSerieObservadaRequestSchema>;

/**
 * API-FZA-03: corregir (una observación nueva con los valores corregidos) o anular (sin valores), siempre con el motivo y
 * la versión esperada de la que se sucede. La anterior no cambia: queda en la historia.
 */
export const SucederSerieObservadaRequestSchema = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('CORRECT'), expectedVersion: TokenDeVersionSchema, reason: Texto(500), observation: SerieObservadaSchema.omit({ exerciseId: true }) }),
  z.strictObject({ action: z.literal('VOID'), expectedVersion: TokenDeVersionSchema, reason: Texto(500) }),
]);
export type SucederSerieObservadaRequest = z.infer<typeof SucederSerieObservadaRequestSchema>;

export const SerieObservadaGuardadaSchema = z.strictObject({
  observationId: IdOpaco,
  /** `v1` la original; `v2` la que la sucede, y así. Solo se sucede la última de la cadena (la vigente). */
  version: TokenDeVersionSchema,
  adviseeId: IdOpaco,
  exerciseId: IdOpaco,
  /** El nombre del catálogo, el de la lista de la v1. */
  exerciseName: z.string(),
  localDate: FechaLocalSchema,
  timeZone: ZonaHorariaSchema,
  note: z.string().nullable(),
  estimate: EstimacionDeFuerzaApiSchema,
  /** Quién la observó: siempre un profesional, nunca «validado» (RM-21). */
  observedBy: ResumenDeActorSchema,
  /** La observación a la que sucede, con su motivo; `null` la original. */
  supersedes: z.strictObject({ observationId: IdOpaco, reason: z.string() }).nullable(),
  recordedAt: Instante,
});
export type SerieObservadaGuardada = z.infer<typeof SerieObservadaGuardadaSchema>;
export const SerieObservadaResponseSchema = z.strictObject({ data: SerieObservadaGuardadaSchema });

/**
 * API-FZA-02: las vigentes de la persona (las que nadie sucedió ni anuló), de la más reciente a la más antigua. El tope de
 * 200 es definitivo (EDT-38): `hasMore` dice que hay más y `nextCursor` es siempre `null`; la evolución (API-PRJ-01) las
 * suma todas.
 */
export const ListaDeSeriesObservadasResponseSchema = z.strictObject({ data: z.array(SerieObservadaGuardadaSchema), page: PaginaSchema });

/** API-FZA-03: la corrección devuelve la observación nueva; la anulación, a cuál anuló y cuándo. */
export const SucesionDeSerieObservadaResponseSchema = z.strictObject({
  data: z.discriminatedUnion('action', [
    z.strictObject({ action: z.literal('CORRECTED'), observation: SerieObservadaGuardadaSchema }),
    z.strictObject({ action: z.literal('VOIDED'), voidedObservationId: IdOpaco, reason: z.string(), recordedAt: Instante }),
  ]),
});
export type SucesionDeSerieObservadaResponse = z.infer<typeof SucesionDeSerieObservadaResponseSchema>;

// ─── API-PRJ-01 · TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE (ED-74) ─────────────────────────────────────────────────────

/** Por qué una serie registrada no entra, con los códigos del dominio (`MotivoFueraDeLaEstimacion`). */
export const MotivoFueraDeLaEstimacionApiSchema = z.enum([
  'LO_INDICADO',
  'FUERA_DE_LA_LISTA',
  'SUSTITUIDO',
  'CARGA_RAPIDA',
  'SIN_PROCEDENCIA',
  'VALOR_DEL_PLAN',
  'SIN_CARGA',
  'CARGA_NO_TOTAL',
  'REPETICIONES_POR_LADO',
  'SIN_REPETICIONES',
  'SIN_RIR',
  'RIR_MAYOR_QUE_2',
  'MAS_DE_12',
]);

/** Un punto de la evolución: la serie elegida de una sesión (la regla por sesión) o una observación del profesional. */
export const PuntoDeFuerzaSchema = z.strictObject({
  pointId: z.string().min(1),
  /** La fecha civil de la sesión o de la observación (RM-15). */
  date: FechaLocalSchema,
  source: z.enum(['PERSON', 'OBSERVED']),
  /**
   * El registro de origen: la ejecución (con la serie elegida, por su prescripción y su número: una sesión puede tener
   * dos prescripciones del mismo ejercicio) o la observación.
   */
  origin: z.discriminatedUnion('type', [
    z.strictObject({ type: z.literal('TRAINING_EXECUTION'), id: IdOpaco, prescriptionId: z.string().min(1), setIndex: z.number().int().positive(), corrected: z.boolean() }),
    z.strictObject({ type: z.literal('STRENGTH_OBSERVATION'), id: IdOpaco }),
  ]),
  /** Quién escribió los valores: la persona en la app, o el profesional que la observó (RM-21). */
  writtenBy: ResumenDeActorSchema,
  estimate: EstimacionDeFuerzaApiSchema,
});
export type PuntoDeFuerza = z.infer<typeof PuntoDeFuerzaSchema>;

/** En una sesión, una serie del ejercicio que no entró, con su motivo (ED-73: «Serie 3: el RIR es el del plan»). */
export const SerieQueNoEntroSchema = z.strictObject({
  executionId: IdOpaco,
  date: FechaLocalSchema,
  /** La prescripción de la serie: con dos del mismo ejercicio en la sesión, el número de serie solo no la ubica. */
  prescriptionId: z.string().min(1),
  setIndex: z.number().int().positive(),
  reason: MotivoFueraDeLaEstimacionApiSchema,
  /** Para la procedencia: qué valores vinieron del plan o no dicen quién los escribió. */
  fields: z.array(z.enum(['load', 'completedRepetitions', 'rir'])),
});

export const EjercicioDeLaEstimacionSchema = z.strictObject({
  exerciseId: IdOpaco,
  name: z.string(),
  /** Sesiones del período en las que se registró, y observaciones del profesional. */
  sessions: z.number().int().nonnegative(),
  observations: z.number().int().nonnegative(),
  /** Las unidades con algún punto: kg y lb nunca se mezclan (RM-29). */
  units: z.array(z.enum(['kg', 'lb'])),
});

/**
 * El resultado sin las vigencias del plan, que suma `contratos-analisis.ts` (`ResultadoDeEstimacionDeFuerzaSchema`) con su
 * esquema: así este archivo no depende de aquel, que lo importa.
 */
export const ResultadoDeEstimacionDeFuerzaBaseSchema = z.strictObject({
  kind: z.literal('TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE'),
  /** Los ejercicios de la lista de la v1 con sesiones u observaciones en el período (para el selector). */
  exercises: z.array(EjercicioDeLaEstimacionSchema),
  /** La línea pedida (`exerciseId` y `unit`); `null` si no se pidió un ejercicio. */
  estimate: z
    .strictObject({
      exerciseId: IdOpaco,
      unit: z.enum(['kg', 'lb']),
      /** «Incluir las de más de 10 a 12»: apagado de entrada (ED-74). */
      includeOrientative: z.boolean(),
      points: z.array(PuntoDeFuerzaSchema),
      /** Las series que no entraron, por sesión: lo que «Cómo se calculó» dice que no entró y por qué. */
      notIncluded: z.array(SerieQueNoEntroSchema),
    })
    .nullable(),
  /** Hay registros del período con otro profesional, que este no ve: «Hay registros con otro profesional que no ves». */
  otherProfessionalRecords: z.boolean(),
});
