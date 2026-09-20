/**
 * Contratos HTTP de métodos y cálculos (09v16 §21: API-MTH-01/02 y API-CAL-01 a 04). Son la parte transversal de
 * WP-05: el patrón T-06-N12, que la antropometría especializa pero no redefine (REG-06-202).
 *
 * Tres cosas que el contrato **no** tiene, y que es lo importante:
 * - no hay campo para un promedio ni para una corrida ganadora: varias coexisten y se listan (REG-06-205);
 * - la respuesta de una ejecución no afirma `objectiveCreated`, `prescriptionUpdated` ni `planChanged` (09 §21.3);
 * - adoptar una referencia devuelve la relación, no una ejecución modificada (REG-06-207).
 *
 * `inputProvenance` viaja con la procedencia de cada entrada, nunca con el valor de una fuente que el actor ya no
 * puede consultar (09 §21.5).
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { CondicionDeMedicionSchema, EstadoDeEvaluacionSchema, MagnitudSchema } from './contratos-antropometria';
import { PaginaSchema, ResumenDeActorSchema, TokenDeVersionSchema } from './contratos-vinculo';

const Texto = (max: number) => z.string().trim().min(1).max(max);

/** Las finalidades declaradas. Una versión de método es seleccionable para las que declara, no para todas. */
export const FinalidadDeCalculoSchema = z.enum(['ANTHROPOMETRIC_SUPPORT', 'NUTRITION_OBJECTIVE_SUPPORT']);
/** REG-06-203: dos estados, sin eliminar versiones históricas. */
export const SeleccionabilidadSchema = z.enum(['SELECTABLE', 'HISTORICAL_NOT_SELECTABLE']);
/** REG-06-204: qué procedencias admite cada entrada. Son las mismas de la medición (REG-06-153). */
export const ProcedenciaAdmitidaSchema = z.enum(['DIRECT_CAPTURE', 'SELF_REPORTED', 'CONTROLLED_IMPORT']);
export const ModoDeRedondeoApiSchema = z.enum(['HALF_UP', 'DOWN', 'UP']);

// ─── API-MTH-01/02 · métodos ────────────────────────────────────────────────────────────────────

export const EntradaRequeridaSchema = z.strictObject({
  inputCode: z.string(),
  metric: z.string(),
  acceptedUnits: z.array(z.string()),
  acceptedProvenances: z.array(ProcedenciaAdmitidaSchema),
});

export const MetodoSchema = z.strictObject({
  methodId: IdOpaco,
  methodVersionId: IdOpaco,
  key: z.string(),
  name: z.string(),
  version: z.string(),
  purposes: z.array(FinalidadDeCalculoSchema),
  status: SeleccionabilidadSchema,
  requiredInputs: z.array(EntradaRequeridaSchema),
  output: z.strictObject({ metric: z.string(), unit: z.string() }),
  precisionPolicy: z.strictObject({ decimals: z.number().int().min(0).max(6), rounding: ModoDeRedondeoApiSchema }),
  /** REG-06-156: la regla de dominio aplicable, identificada y versionada. */
  ruleId: z.string(),
  /** Rótulo obligatorio: el contenido es sintético de demostración (REG-06-157). */
  provenanceNote: z.string(),
  /** La versión que sucede a esta, si dejó de ser seleccionable. Nunca se elimina (REG-06-203). */
  supersededByVersionId: IdOpaco.nullable(),
  effectiveSince: Instante,
});
export type MetodoApi = z.infer<typeof MetodoSchema>;

export const ListaDeMetodosResponseSchema = z.strictObject({ data: z.array(MetodoSchema), page: PaginaSchema });
export const MetodoResponseSchema = z.strictObject({ data: MetodoSchema });

// ─── API-CAL-01 · ejecutar ──────────────────────────────────────────────────────────────────────

/**
 * Cada entrada se declara por su código de método y la referencia a la fuente. `sourceRef` es el identificador de
 * una medición: si no es revelable para el actor, la respuesta es el mismo 404 que ante una inexistente, así que el
 * campo no sirve como oráculo de existencia (09 §20.2.1; TEST-CAL-003).
 */
export const VinculoDeEntradaSchema = z.strictObject({ inputCode: Texto(60), sourceRef: IdOpaco });

export const EjecutarCalculoRequestSchema = z.strictObject({
  purpose: FinalidadDeCalculoSchema,
  methodVersionId: IdOpaco,
  inputBindings: z.array(VinculoDeEntradaSchema).min(1).max(20),
});

/**
 * REG-06-205: la procedencia de cada entrada. El valor es **opcional**: viaja solo cuando el actor puede consultar la
 * medición de origen, porque una corrida no reintroduce valores de fuentes que ya no le son revelables (09 §21.5).
 * `condition` se deriva del evento de anulación de la medición, igual que en la medición misma (06:8670): una
 * entrada que quedó anulada tiene que verse anulada también desde la corrida que la usó.
 */
export const ProcedenciaDeEntradaSchema = z.strictObject({
  inputCode: z.string(),
  sourceRef: IdOpaco,
  metric: z.string(),
  magnitude: MagnitudSchema.optional(),
  provenanceType: ProcedenciaAdmitidaSchema,
  condition: CondicionDeMedicionSchema,
  sourceOccurredAt: Instante,
});

export const CorridaDeCalculoSchema = z.strictObject({
  calculationRunId: IdOpaco,
  adviseeId: IdOpaco,
  evaluationId: IdOpaco,
  /**
   * Si la corrida es de una evaluación en preparación o de una registrada. Lo de preparación no adquiere autoridad
   * histórica por persistirse (REG-06-215): se muestra, pero se muestra como lo que es.
   */
  evaluationContext: EstadoDeEvaluacionSchema,
  purpose: FinalidadDeCalculoSchema,
  methodId: IdOpaco,
  methodVersionId: IdOpaco,
  methodName: z.string(),
  methodVersion: z.string(),
  /** La regla exacta que se aplicó: es lo que vuelve reproducible el resultado (REG-06-156). */
  ruleId: z.string(),
  result: z.strictObject({ metric: z.string(), magnitude: MagnitudSchema }),
  precision: z.strictObject({ decimals: z.number().int().min(0).max(6), rounding: ModoDeRedondeoApiSchema }),
  inputProvenance: z.array(ProcedenciaDeEntradaSchema),
  /** La corrida que esta reemplaza, cuando nació de un recálculo. Se relaciona, no sobrescribe (REG-06-161). */
  supersedesRunId: IdOpaco.nullable(),
  /** `true` solo si el profesional la adoptó con un acto explícito. No existe referencia automática (REG-06-207). */
  referenceForPurpose: z.boolean(),
  /**
   * Token de la referencia vigente del profesional para esa finalidad, o `null` si todavía no adoptó ninguna. Viaja
   * en la lectura para que reemplazarla sea posible sin pisar la decisión anterior (09 §21.6).
   */
  referenceVersion: TokenDeVersionSchema.nullable(),
  /**
   * `false` cuando alguna entrada quedó anulada o cuando otra corrida la reemplazó: el resultado histórico se
   * conserva, pero deja de presentarse como vigente (REG-06-220 incisos 2 y 4).
   */
  effective: z.boolean(),
  /** La corrida que reemplazó a esta, si la hubo. Mira hacia adelante; `supersedesRunId` mira hacia atrás. */
  supersededByRunId: IdOpaco.nullable(),
  author: ResumenDeActorSchema,
  recordedAt: Instante,
});
export type CorridaDeCalculoApi = z.infer<typeof CorridaDeCalculoSchema>;

export const CorridaResponseSchema = z.strictObject({ data: CorridaDeCalculoSchema });
export const ListaDeCorridasResponseSchema = z.strictObject({ data: z.array(CorridaDeCalculoSchema), page: PaginaSchema });

// ─── API-CAL-04 · referencia profesional ────────────────────────────────────────────────────────

export const AdoptarReferenciaRequestSchema = z.strictObject({
  calculationRunId: IdOpaco,
  /** Token de la referencia vigente; `null` cuando todavía no hay ninguna (REG-06-207: sucede, no pisa). */
  expectedVersion: TokenDeVersionSchema.nullable(),
  rationale: z.string().trim().max(1000).nullable().optional(),
});

export const ReferenciaSchema = z.strictObject({
  referenceId: IdOpaco,
  adviseeId: IdOpaco,
  purpose: FinalidadDeCalculoSchema,
  calculationRunId: IdOpaco,
  /** La referencia anterior, que se conserva: cambiar de referencia crea historia (REG-06-207). */
  supersedesReferenceId: IdOpaco.nullable(),
  rationale: z.string().nullable(),
  version: TokenDeVersionSchema,
  author: ResumenDeActorSchema,
  adoptedAt: Instante,
});
export type ReferenciaApi = z.infer<typeof ReferenciaSchema>;

export const ReferenciaResponseSchema = z.strictObject({ data: ReferenciaSchema });
