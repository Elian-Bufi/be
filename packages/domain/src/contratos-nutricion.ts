/**
 * Contratos HTTP de WP-04 como schemas compartidos (09v7 T21): familia NUT (09v9, con los cambios del consolidado
 * v0.16.1 §11.2) y API-INT-NUT-01 (09v12). Objetos estrictos: un campo no declarado → 400 UNKNOWN_FIELD (09v7 T12).
 *
 * Tokens: los del 09 cuando los fija (`RAW`/`COOKED`/`AS_PURCHASED`, `DISH_OPTIONS`, `PRESCRIBED`/`OUTSIDE_PRESCRIPTION`,
 * `FREE_DESCRIPTION`, MAINTAIN…FINALIZE). El estado de la versión de plan es `DRAFT`/`ACTIVATED` en la API y
 * `BORRADOR`/`ACTIVADA` en el dominio, como hizo WP-03 con B2 y A3.
 *
 * Lo que el 09 deja sin forma se define acá y figura en DEUDA_LEGAJO DL-055. Lo más importante:
 * - `assessment` es una lista de datos con fuente (DL-048);
 * - `planId` designa una Versión de plan, y `nutritionPlanId`, el Plan que las agrupa (DL-046);
 * - el orden de días tipo, comidas, opciones e ítems es el del arreglo, y `order` solo aparece en las respuestas;
 * - la ingesta prescripta referencia la comida y la opción de la instantánea, y admite cantidades consumidas (DL-049);
 * - `nextAction` lleva la descripción, la fecha de la próxima revisión y, en CHANGE_OBJECTIVE, el objetivo nuevo
 *   (DL-052).
 *
 * **Sin puntaje de adherencia** (REG-06-125; INV-06-135): ningún schema tiene score, grade ni porcentaje de
 * cumplimiento. Lo verifica una prueba que recorre este archivo y el OpenAPI (TEST-PRJ-009).
 */
import { z } from 'zod';
import { IdOpaco, Instante, ValidationIssueSchema } from './contratos';
import { FuenteExternaSchema } from './contratos-procedencia-externa';
import { PaginaSchema, ResumenDeActorSchema, TokenDeVersionSchema } from './contratos-vinculo';

// ─── Tipos comunes ──────────────────────────────────────────────────────────────────────────────
/** Fecha local del asesorado, sin hora (RNF-DAT-005). */
export const FechaLocalSchema = z.iso.date();
/** Zona horaria IANA. */
export const ZonaHorariaSchema = z.string().regex(/^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)+$|^UTC$/);
/** Fuente de cada dato de la evaluación (REG-06-109; 04 RF-026): informado, observado o calculado. */
export const FuenteDeDatoSchema = z.enum(['REPORTED', 'OBSERVED', 'CALCULATED']);
/** T-06-53; REG-06-122 (09v9 §4.5). */
export const EstadoDePreparacionSchema = z.enum(['RAW', 'COOKED', 'AS_PURCHASED']);
/** Unidades de cantidad. El legajo no fija una lista (B05:491-497): gramos, mililitros y unidades. */
export const UnidadDeCantidadSchema = z.enum(['g', 'ml', 'unit']);
export const CantidadSchema = z.strictObject({ value: z.number().positive().finite(), unit: UnidadDeCantidadSchema });
/** 09v9 §4.4. La modalidad B existe en el contrato y se rechaza con EXCHANGE_MODE_NOT_AVAILABLE (06:4599). */
export const ModoDePrescripcionSchema = z.enum(['DISH_OPTIONS', 'EXCHANGE_PORTIONS']);
export const EstadoDeVersionDePlanSchema = z.enum(['DRAFT', 'ACTIVATED']);
const Texto = (max: number) => z.string().trim().min(1).max(max);
const TextoOpcional = (max: number) => z.string().trim().max(max).nullable();

// ─── Evaluación (API-NUT-01 a 03) ───────────────────────────────────────────────────────────────
/** Un dato de la evaluación con su fuente (DL-048). Un dato CALCULATED exige declarar el método: BE no calcula. */
export const DatoDeEvaluacionSchema = z
  .strictObject({
    concept: Texto(120),
    value: z.union([Texto(500), z.number().finite()]),
    unit: TextoOpcional(30).optional(),
    source: FuenteDeDatoSchema,
    methodStatement: TextoOpcional(500).optional(),
  })
  .refine((d) => d.source !== 'CALCULATED' || (d.methodStatement ?? '').trim().length > 0, {
    message: 'Un dato calculado declara su método',
    path: ['methodStatement'],
  });
export const ValoracionSchema = z.strictObject({ entries: z.array(DatoDeEvaluacionSchema).min(1).max(100) });

export const CrearEvaluacionRequestSchema = z.strictObject({
  occurredAt: Instante,
  context: TextoOpcional(1000),
  assessment: ValoracionSchema,
  evidenceReferences: z.array(Texto(200)).max(20),
  professionalNotes: TextoOpcional(4000),
});
export type CrearEvaluacionRequest = z.infer<typeof CrearEvaluacionRequestSchema>;

/** Respuesta literal de 09v9:360-372. */
export const CrearEvaluacionResponseSchema = z.strictObject({
  data: z.strictObject({ evaluationId: IdOpaco, version: TokenDeVersionSchema, occurredAt: Instante, recordedAt: Instante }),
});

export const EvaluacionNutricionalSchema = z.strictObject({
  evaluationId: IdOpaco,
  version: TokenDeVersionSchema,
  adviseeId: IdOpaco,
  professional: ResumenDeActorSchema,
  occurredAt: Instante,
  recordedAt: Instante,
  context: z.string().nullable(),
  assessment: ValoracionSchema,
  evidenceReferences: z.array(z.string()),
  professionalNotes: z.string().nullable(),
});
export type EvaluacionNutricional = z.infer<typeof EvaluacionNutricionalSchema>;
export const EvaluacionResponseSchema = z.strictObject({ data: EvaluacionNutricionalSchema });
export const ListaDeEvaluacionesResponseSchema = z.strictObject({ data: z.array(EvaluacionNutricionalSchema), page: PaginaSchema });

// ─── Objetivo (API-NUT-04 a 06) ─────────────────────────────────────────────────────────────────
/** Requerimiento energético estimado, declarado por el profesional (REG-06-123; INV-06-133). */
export const RequerimientoEnergeticoSchema = z.strictObject({ value: z.number().positive().finite(), unit: z.literal('kcal/day') });
export const MacronutrienteSchema = z.strictObject({ value: z.number().nonnegative().finite(), unit: z.enum(['g/day', 'energy_share']) });
export const DistribucionDeMacronutrientesSchema = z.strictObject({ protein: MacronutrienteSchema, carbohydrate: MacronutrienteSchema, fat: MacronutrienteSchema });

export const ContenidoDeObjetivoSchema = z
  .strictObject({
    evaluationId: IdOpaco,
    effectiveFrom: Instante,
    effectiveUntil: Instante.nullable(),
    estimatedEnergyRequirement: RequerimientoEnergeticoSchema,
    macronutrientDistribution: DistribucionDeMacronutrientesSchema,
    /** Distribución por comida, opcional (06:4635): descripción del profesional. */
    mealDistribution: TextoOpcional(1000),
    /** Obligatorio (09v9:430). */
    rationale: Texto(4000),
    methodStatement: TextoOpcional(1000),
  })
  .refine((o) => o.effectiveUntil === null || o.effectiveUntil > o.effectiveFrom, { message: 'La vigencia termina después de empezar', path: ['effectiveUntil'] });
export const CrearObjetivoRequestSchema = ContenidoDeObjetivoSchema;
export type CrearObjetivoRequest = z.infer<typeof CrearObjetivoRequestSchema>;

export const VersionDeObjetivoSchema = z.strictObject({
  objectiveId: IdOpaco,
  versionId: IdOpaco,
  predecessorVersionId: IdOpaco.nullable(),
  adviseeId: IdOpaco,
  evaluationId: IdOpaco,
  effectiveFrom: Instante,
  effectiveUntil: Instante.nullable(),
  estimatedEnergyRequirement: RequerimientoEnergeticoSchema,
  macronutrientDistribution: DistribucionDeMacronutrientesSchema,
  mealDistribution: z.string().nullable(),
  rationale: z.string(),
  methodStatement: z.string().nullable(),
  authoredBy: ResumenDeActorSchema,
  createdAt: Instante,
  /** La versión terminal de la sucesión (INV-06-107). Nunca «la última por fecha». */
  isEffective: z.boolean(),
});
export type VersionDeObjetivo = z.infer<typeof VersionDeObjetivoSchema>;
export const ObjetivoResponseSchema = z.strictObject({ data: VersionDeObjetivoSchema });
export const ListaDeObjetivosResponseSchema = z.strictObject({ data: z.array(VersionDeObjetivoSchema), page: PaginaSchema });
/** 09v9:456-472: `objective: null` si no hay versión efectiva legítima. */
export const ObjetivoEfectivoResponseSchema = z.strictObject({ data: z.strictObject({ objective: VersionDeObjetivoSchema.nullable() }) });

// ─── Estructura del plan (REG-06-118; 09v9 §4) ──────────────────────────────────────────────────
/**
 * Entrada: los identificadores de nodo son opcionales (el servidor asigna los que faltan) y estables una vez asignados,
 * porque la ingesta referencia la comida y la opción (DL-049). El orden es el del arreglo.
 */
export const ItemPrescriptoEntradaSchema = z.strictObject({
  itemId: IdOpaco.optional(),
  catalogItemId: IdOpaco,
  quantity: CantidadSchema.nullable(),
  preparationState: EstadoDePreparacionSchema.nullable(),
  note: TextoOpcional(300).optional(),
});
export const OpcionDeComidaEntradaSchema = z.strictObject({
  optionId: IdOpaco.optional(),
  label: Texto(120),
  items: z.array(ItemPrescriptoEntradaSchema).max(40),
});
export const ComidaEntradaSchema = z.strictObject({
  mealId: IdOpaco.optional(),
  label: Texto(80),
  prescriptionMode: ModoDePrescripcionSchema,
  options: z.array(OpcionDeComidaEntradaSchema).max(12),
});
export const DiaTipoEntradaSchema = z.strictObject({
  dayTypeId: IdOpaco.optional(),
  label: Texto(80),
  meals: z.array(ComidaEntradaSchema).max(12),
});
export const EstructuraDePlanEntradaSchema = z.strictObject({ dayTypes: z.array(DiaTipoEntradaSchema).max(7) });
export type EstructuraDePlanEntrada = z.infer<typeof EstructuraDePlanEntradaSchema>;

/** Salida: nodos con identificador y orden; cada ítem con el nombre del catálogo (el de la instantánea si está activada). */
export const ItemPrescriptoSchema = z.strictObject({
  itemId: IdOpaco,
  catalogItemId: IdOpaco,
  /** Versión del catálogo congelada en la instantánea; `null` en un borrador, que usa la versión disponible. */
  catalogItemVersionId: IdOpaco.nullable(),
  name: z.string(),
  quantity: CantidadSchema.nullable(),
  preparationState: EstadoDePreparacionSchema.nullable(),
  note: z.string().nullable(),
});
export const OpcionDeComidaSchema = z.strictObject({ optionId: IdOpaco, label: z.string(), order: z.number().int().positive(), items: z.array(ItemPrescriptoSchema) });
export const ComidaSchema = z.strictObject({
  mealId: IdOpaco,
  label: z.string(),
  order: z.number().int().positive(),
  prescriptionMode: ModoDePrescripcionSchema,
  options: z.array(OpcionDeComidaSchema),
});
export const DiaTipoSchema = z.strictObject({ dayTypeId: IdOpaco, label: z.string(), order: z.number().int().positive(), meals: z.array(ComidaSchema) });
export type DiaTipo = z.infer<typeof DiaTipoSchema>;

// ─── Plan (API-NUT-07 a 12) ─────────────────────────────────────────────────────────────────────
export const CrearPlanRequestSchema = z.strictObject({
  objectiveVersionId: IdOpaco,
  /** Vacío o parcial: un borrador puede estar incompleto; validar lo informa (RF-030). */
  initialStructure: EstructuraDePlanEntradaSchema.optional(),
  /** DL-047: borrador sucesor de la versión efectiva («Crear nueva versión a partir de esta», UC-P10 V07). */
  basedOnPlanId: IdOpaco.optional(),
  /** Próxima revisión que fija esta versión (REG-06-145); al activar nace la expectativa del Proceso (DL-055). */
  nextReviewAt: FechaLocalSchema.nullable().optional(),
});
export type CrearPlanRequest = z.infer<typeof CrearPlanRequestSchema>;

export const VersionDePlanSchema = z.strictObject({
  planId: IdOpaco,
  /** El Plan (T-06-28) que agrupa las versiones (DL-046). */
  nutritionPlanId: IdOpaco,
  version: TokenDeVersionSchema,
  state: EstadoDeVersionDePlanSchema,
  adviseeId: IdOpaco,
  professional: ResumenDeActorSchema,
  objectiveVersionId: IdOpaco,
  predecessorPlanId: IdOpaco.nullable(),
  /** La versión efectiva del Plan (INV-06-110): la que ve el asesorado. */
  isEffective: z.boolean(),
  createdAt: Instante,
  activatedAt: Instante.nullable(),
  /** SHA-256 de la instantánea; `null` en un borrador (REG-06-105). */
  snapshotDigest: z.string().regex(/^[0-9a-f]{64}$/).nullable(),
  nextReviewAt: FechaLocalSchema.nullable(),
  dayTypes: z.array(DiaTipoSchema),
});
export type VersionDePlan = z.infer<typeof VersionDePlanSchema>;
export const PlanResponseSchema = z.strictObject({ data: VersionDePlanSchema });

export const ResumenDeVersionDePlanSchema = VersionDePlanSchema.omit({ dayTypes: true });
export const ListaDePlanesResponseSchema = z.strictObject({ data: z.array(ResumenDeVersionDePlanSchema), page: PaginaSchema });

export const EditarBorradorRequestSchema = z.strictObject({
  expectedVersion: TokenDeVersionSchema,
  changes: EstructuraDePlanEntradaSchema,
  /** Pasar el borrador al objetivo efectivo, por ejemplo después de CAMBIAR_OBJETIVO (DL-055). */
  objectiveVersionId: IdOpaco.optional(),
  nextReviewAt: FechaLocalSchema.nullable().optional(),
});
export type EditarBorradorRequest = z.infer<typeof EditarBorradorRequestSchema>;

export const VersionEsperadaRequestSchema = z.strictObject({ expectedVersion: TokenDeVersionSchema });
export type VersionEsperadaRequest = z.infer<typeof VersionEsperadaRequestSchema>;

/** 09v9:584-597: `200` aunque `valid=false`. */
export const ValidacionDePlanResponseSchema = z.strictObject({
  data: z.strictObject({ valid: z.boolean(), version: TokenDeVersionSchema, issues: z.array(ValidationIssueSchema) }),
});
export type ValidacionDePlanResponse = z.infer<typeof ValidacionDePlanResponseSchema>;

export const ActivacionDePlanResponseSchema = z.strictObject({
  data: z.strictObject({
    planId: IdOpaco,
    nutritionPlanId: IdOpaco,
    state: z.literal('ACTIVATED'),
    version: TokenDeVersionSchema,
    activatedAt: Instante,
    snapshotDigest: z.string().regex(/^[0-9a-f]{64}$/),
    processId: IdOpaco,
    /** `true` si la activación abrió un Proceso nuevo (pasó por capacidad); `false` si fue continuidad. */
    processOpened: z.boolean(),
    /** Versión que dejó de ser efectiva; queda en el historial con su instantánea. */
    supersededPlanId: IdOpaco.nullable(),
  }),
});
export type ActivacionDePlanResponse = z.infer<typeof ActivacionDePlanResponseSchema>;

// ─── Catálogo (API-NUT-13 y API-INT-NUT-01) ─────────────────────────────────────────────────────
/** Composición cada 100 g o 100 ml. Los valores del catálogo sembrado son sintéticos de demostración (WP-04 T14). */
export const ComposicionSchema = z.strictObject({
  referenceAmount: z.enum(['100g', '100ml']),
  energyKcal: z.number().nonnegative().finite(),
  proteinG: z.number().nonnegative().finite(),
  carbohydrateG: z.number().nonnegative().finite(),
  fatG: z.number().nonnegative().finite(),
});
/**
 * De dónde salió un elemento del catálogo: sembrado por BE, cargado a mano por un profesional, o **importado de un
 * proveedor externo después de su revisión** (WP-08; UC-I07). Lo comparten nutrición y entrenamiento.
 */
export const ProcedenciaDeCatalogoSchema = z.enum(['BE_SYNTHETIC_SEED', 'PROFESSIONAL_MANUAL', 'CONTROLLED_IMPORT']);
export const ElementoDeCatalogoSchema = z.strictObject({
  catalogItemId: IdOpaco,
  versionId: IdOpaco,
  name: z.string(),
  itemType: z.literal('FOOD'),
  composition: ComposicionSchema,
  provenance: ProcedenciaDeCatalogoSchema,
  /** Proveedor, identificador, fecha y licencia de lo importado; `null` en lo sembrado y lo manual (RF-060). */
  externalSource: FuenteExternaSchema.nullable(),
  available: z.boolean(),
});
export type ElementoDeCatalogo = z.infer<typeof ElementoDeCatalogoSchema>;
export const ListaDeCatalogoResponseSchema = z.strictObject({ data: z.array(ElementoDeCatalogoSchema), page: PaginaSchema });
export const CrearElementoDeCatalogoRequestSchema = z.strictObject({ name: Texto(120), itemType: z.literal('FOOD'), composition: ComposicionSchema });
export type CrearElementoDeCatalogoRequest = z.infer<typeof CrearElementoDeCatalogoRequestSchema>;
export const ElementoDeCatalogoResponseSchema = z.strictObject({ data: ElementoDeCatalogoSchema });

// ─── Ingesta (API-NUT-14 a 16 y 21) ─────────────────────────────────────────────────────────────
export const OrigenDeIngestaSchema = z.enum(['PRESCRIBED', 'OUTSIDE_PRESCRIPTION']);
export const ModoDeRegistroSchema = z.enum(['DISH_OPTIONS', 'EXCHANGE_PORTIONS', 'FREE_DESCRIPTION']);

export const ItemConsumidoSchema = z.strictObject({ itemId: IdOpaco, quantity: CantidadSchema });
export const RegistroPrescriptoSchema = z.strictObject({
  origin: z.literal('PRESCRIBED'),
  mode: z.literal('DISH_OPTIONS'),
  mealId: IdOpaco,
  optionId: IdOpaco,
  /** Cantidades realmente consumidas de ítems de esa opción, si el asesorado las informa (DL-049). */
  consumedItems: z.array(ItemConsumidoSchema).max(40).optional(),
  observation: TextoOpcional(1000).optional(),
});
export const RegistroLibreSchema = z.strictObject({
  origin: z.literal('OUTSIDE_PRESCRIPTION'),
  mode: z.literal('FREE_DESCRIPTION'),
  description: Texto(2000),
  portionDescription: TextoOpcional(500).optional(),
});

/** CONS:564-628. Evidencia visual fuera de WP-04 (CONS:752): `visualEvidenceUploadIds` no se acepta. */
export const RegistrarIngestaRequestSchema = z.union([
  z.strictObject({ activePlanId: IdOpaco, dayTypeId: IdOpaco, occurredAt: Instante, recording: RegistroPrescriptoSchema }),
  z.strictObject({ activePlanId: IdOpaco, occurredAt: Instante, recording: RegistroLibreSchema }),
]);
export type RegistrarIngestaRequest = z.infer<typeof RegistrarIngestaRequestSchema>;

/** Estimación estructurada de un registro libre (API-NUT-21). Nunca es una medición (INV-06-131). */
export const ItemEstimadoSchema = z.strictObject({
  catalogItemId: IdOpaco.nullable(),
  description: Texto(200),
  quantity: CantidadSchema.nullable(),
});
export const EstimacionEstructuradaSchema = z.strictObject({ items: z.array(ItemEstimadoSchema).min(1).max(40) });

export const CorreccionDeIngestaSchema = z.strictObject({
  correctionId: IdOpaco,
  previousCorrectionId: IdOpaco.nullable(),
  reason: z.literal('STRUCTURE_FREE_DESCRIPTION'),
  /** `ESTIMATE`: nunca medición (CONS:652). */
  nature: z.literal('ESTIMATE'),
  structuredEstimate: EstimacionEstructuradaSchema,
  estimationStatement: z.string(),
  author: ResumenDeActorSchema,
  recordedAt: Instante,
});

/** Vista efectiva por relación (REG-06-16): `ORIGINAL`, la corrección terminal o `NOT_RESOLVABLE`. */
export const VistaEfectivaDeIngestaSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('ORIGINAL') }),
  z.strictObject({ kind: z.literal('CORRECTED'), correctionId: IdOpaco }),
  z.strictObject({ kind: z.literal('NOT_RESOLVABLE') }),
]);

export const IngestaSchema = z.strictObject({
  executionId: IdOpaco,
  planId: IdOpaco,
  adviseeId: IdOpaco,
  origin: OrigenDeIngestaSchema,
  mode: ModoDeRegistroSchema,
  occurredAt: Instante,
  recordedAt: Instante,
  localDate: FechaLocalSchema,
  timeZone: ZonaHorariaSchema,
  dayTypeId: IdOpaco.nullable(),
  mealId: IdOpaco.nullable(),
  optionId: IdOpaco.nullable(),
  consumedItems: z.array(ItemConsumidoSchema),
  observation: z.string().nullable(),
  /** Modalidad C: texto original, siempre conservado (INV-06-131). */
  description: z.string().nullable(),
  portionDescription: z.string().nullable(),
  corrections: z.array(CorreccionDeIngestaSchema),
  effectiveView: VistaEfectivaDeIngestaSchema,
});
export type Ingesta = z.infer<typeof IngestaSchema>;
export const IngestaResponseSchema = z.strictObject({ data: IngestaSchema });

export const CorregirIngestaRequestSchema = z.strictObject({
  reason: z.literal('STRUCTURE_FREE_DESCRIPTION'),
  structuredEstimate: EstimacionEstructuradaSchema,
  estimationStatement: Texto(1000),
});
export type CorregirIngestaRequest = z.infer<typeof CorregirIngestaRequestSchema>;

/** Resumen del objetivo que ve el asesorado: la formulación autorizada (RF-029; UC-P09 V05). */
export const ObjetivoParaAsesoradoSchema = z.strictObject({
  versionId: IdOpaco,
  estimatedEnergyRequirement: RequerimientoEnergeticoSchema,
  macronutrientDistribution: DistribucionDeMacronutrientesSchema,
  mealDistribution: z.string().nullable(),
  effectiveFrom: Instante,
  effectiveUntil: Instante.nullable(),
});

/** API-NUT-14. El servidor fija fecha y zona; no elige un día tipo en silencio (09v9:680; DL-049). */
export const HoyResponseSchema = z.strictObject({
  data: z.strictObject({
    date: FechaLocalSchema,
    timeZone: ZonaHorariaSchema,
    /**
     * AVAILABLE: hay un plan vigente. NO_ACTIVE_PLAN: no hay plan activado o el seguimiento se cerró. NOT_AVAILABLE: hay
     * plan, pero el acceso está suspendido (consentimiento o A3 revocados, vínculo pausado): UC-P12 E06.
     */
    planState: z.enum(['AVAILABLE', 'NO_ACTIVE_PLAN', 'NOT_AVAILABLE']),
    activePlan: z
      .strictObject({
        planId: IdOpaco,
        version: TokenDeVersionSchema,
        activatedAt: Instante,
        objective: ObjetivoParaAsesoradoSchema,
        dayTypes: z.array(DiaTipoSchema),
      })
      .nullable(),
    /** Día tipo que muestra la vista: el único, o el que eligió el asesorado; `null` = hay que elegir. */
    selectedDayTypeId: IdOpaco.nullable(),
    registeredIntake: z.array(IngestaSchema),
    /** Sin registros hoy → NO_DATA, nunca «0 %» ni «no cumplido» (CAND-09-NUT-D). */
    dataState: z.enum(['HAS_DATA', 'NO_DATA']),
  }),
});
export type HoyResponse = z.infer<typeof HoyResponseSchema>;

export const ListaDeIngestasResponseSchema = z.strictObject({ data: z.array(IngestaSchema), page: PaginaSchema });

// ─── Revisión (API-NUT-17 a 20) ─────────────────────────────────────────────────────────────────
/** Contraste descriptivo por día y comida (T12; REG-06-125). Sin porcentajes, puntajes ni juicios. */
export const ContrasteDeComidaSchema = z.strictObject({
  mealId: IdOpaco,
  label: z.string(),
  /** `REGISTERED` o `NO_DATA`: la ausencia de registro es sin dato, nunca incumplimiento (INV-06-135). */
  state: z.enum(['REGISTERED', 'NO_DATA']),
  registeredOptionId: IdOpaco.nullable(),
  executionId: IdOpaco.nullable(),
  /** Diferencia de cantidad de un mismo ítem, con la misma unidad. Solo si el asesorado informó la cantidad. */
  quantityDifferences: z.array(
    z.strictObject({ itemId: IdOpaco, name: z.string(), prescribed: CantidadSchema, registered: CantidadSchema, difference: z.number().finite(), unit: UnidadDeCantidadSchema }),
  ),
});
export const ContrasteDeDiaSchema = z.strictObject({
  date: FechaLocalSchema,
  planId: IdOpaco.nullable(),
  dayTypeId: IdOpaco.nullable(),
  /** Sin ningún registro ese día. */
  dataState: z.enum(['HAS_DATA', 'NO_DATA']),
  meals: z.array(ContrasteDeComidaSchema),
  /** Ingestas fuera del plan: dato observado aparte, que no marca ninguna comida (CONS:599-612). */
  outsidePrescription: z.array(z.strictObject({ executionId: IdOpaco, description: z.string() })),
});
export const ContrasteDescriptivoSchema = z.strictObject({ days: z.array(ContrasteDeDiaSchema) });
export type ContrasteDescriptivo = z.infer<typeof ContrasteDescriptivoSchema>;

export const ReferenciaDeEvidenciaSchema = z.strictObject({
  type: z.enum(['EXECUTION', 'PLAN_VERSION', 'OBJECTIVE_VERSION', 'EVALUATION']),
  id: IdOpaco,
});
export const PeriodoSchema = z.strictObject({ start: FechaLocalSchema, end: FechaLocalSchema, timeZone: ZonaHorariaSchema });

export const ProximaAccionSchema = z.strictObject({
  /** Próxima acción o, en FINALIZE, el cierre. */
  description: Texto(2000),
  /** Próxima revisión (REG-06-145). Obligatoria en RESCHEDULE_REVIEW. */
  nextReviewAt: FechaLocalSchema.nullable().optional(),
  /** CHANGE_OBJECTIVE: el objetivo nuevo, que se emite al aplicar (DL-052). */
  objective: ContenidoDeObjetivoSchema.optional(),
});

export const ResultadoDeRevisionApiSchema = z.enum(['MAINTAIN', 'ADJUST', 'REPLACE', 'RESCHEDULE_REVIEW', 'CHANGE_OBJECTIVE', 'FINALIZE']);
export const RegistrarRevisionRequestSchema = z.strictObject({
  period: PeriodoSchema,
  evidenceReferences: z.array(ReferenciaDeEvidenciaSchema).max(200),
  interpretation: z.string().max(4000),
  /** Texto libre en el contrato: un valor fuera de la taxonomía es REVIEW_RESULT_INVALID (UC-P13 E05), no 400. */
  result: z.string().max(40),
  rationale: z.string().max(4000),
  nextAction: ProximaAccionSchema,
});
export type RegistrarRevisionRequest = z.infer<typeof RegistrarRevisionRequestSchema>;

export const AplicacionDeRevisionSchema = z.strictObject({
  appliedAt: Instante,
  /** Evento `ContinuidadOCierreAplicado` (REG-06-75). */
  eventId: IdOpaco,
  type: z.enum(['CONTINUIDAD', 'CIERRE_PROCESO']),
  processId: IdOpaco,
  processStateAfter: z.enum(['ABIERTO', 'CERRADO']),
  createdPlanId: IdOpaco.nullable(),
  createdObjectiveVersionId: IdOpaco.nullable(),
});

export const RevisionSchema = z.strictObject({
  reviewId: IdOpaco,
  version: TokenDeVersionSchema,
  adviseeId: IdOpaco,
  processId: IdOpaco,
  period: PeriodoSchema,
  evidenceReferences: z.array(ReferenciaDeEvidenciaSchema),
  interpretation: z.string(),
  result: ResultadoDeRevisionApiSchema,
  rationale: z.string(),
  nextAction: ProximaAccionSchema,
  author: ResumenDeActorSchema,
  recordedAt: Instante,
  application: AplicacionDeRevisionSchema.nullable(),
});
export type Revision = z.infer<typeof RevisionSchema>;
/** API-NUT-20: la aplicación de la revisión (DL-055). */
export const AplicarRevisionResponseSchema = z.strictObject({ data: z.strictObject({ reviewId: IdOpaco, application: AplicacionDeRevisionSchema }) });
export type AplicarRevisionResponse = z.infer<typeof AplicarRevisionResponseSchema>;
export const RevisionResponseSchema = z.strictObject({ data: RevisionSchema });

export const ContextoDeRevisionResponseSchema = z.strictObject({
  data: z.strictObject({
    period: PeriodoSchema,
    objective: VersionDeObjetivoSchema.nullable(),
    activePlanVersions: z.array(ResumenDeVersionDePlanSchema),
    registeredIntakes: z.array(IngestaSchema),
    descriptiveContrast: ContrasteDescriptivoSchema,
    /** Días del período sin ningún registro (06:4661: «un período sin registro es un período sin dato»). */
    missingData: z.array(FechaLocalSchema),
    previousReviews: z.array(RevisionSchema),
    process: z.strictObject({ processId: IdOpaco, state: z.enum(['ABIERTO', 'CERRADO']) }).nullable(),
    /** REG-06-150 (DL-054). */
    pendingReview: z.strictObject({ pending: z.boolean(), since: z.string().nullable() }),
  }),
});
export type ContextoDeRevisionResponse = z.infer<typeof ContextoDeRevisionResponseSchema>;
