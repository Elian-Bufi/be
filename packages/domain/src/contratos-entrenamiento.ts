/**
 * Contratos HTTP de WP-06 como schemas compartidos (09v7 T21): familia TRN (09v10), API-INT-TRN-01 (09v12) y la
 * lectura de ocurrencias por período que suma DL-078. Objetos estrictos: un campo no declarado → 400 UNKNOWN_FIELD
 * (09v7 T12).
 *
 * **La asimetría del contrato, que es lo primero que hay que respetar** (docs/paquetes/WP-06.md §4.1):
 * - la **ejecución** son dos colecciones: el borrador (`/training/execution-drafts`) y la ejecución registrada
 *   (`/training/executions`). Confirmar crea un recurso nuevo;
 * - el **plan** es una sola: el borrador es la misma versión con `state: "DRAFT"`. No existe `/training/plan-drafts`;
 * - la **ocurrencia** es una tercera colección, y el borrador cuelga de ella como subrecurso singular (`PUT`).
 *
 * Tokens: los del 09 cuando los fija (`PERCENT_RM`/`RIR`, `SET`/`EXERCISE_OR_SESSION`, `COMPLETED`…`NOT_COMPLETED`,
 * `PRIMARY`/`SECONDARY`, MAINTAIN…FINALIZE). Las taxonomías homólogas con nutrición se **importan**, no se copian:
 * estado de la versión de plan, resultado de revisión, procedencia de catálogo, período, dato con fuente. Es
 * REG-06-07 —patrón común sin vocabularios paralelos (06:431)— y el 09 lo pide igual: «no se crea una API paralela
 * conceptual» (CAND-09-TRN-A, 09v10:111-122).
 *
 * Lo que el 09 deja sin forma se define acá con la política de DL-080 (JSON validado por allowlist, salvo donde el 06
 * fija estructura) y las decisiones de forma figuran en DL-088. Lo más importante:
 * - `planId` designa una Versión de plan y `trainingPlanId` el Plan que las agrupa, como en nutrición (DL-046);
 * - el `occurrenceId` es opaco y lo emite el servidor: el cliente no lo arma (DL-077, DL-078);
 * - `plannedSession` lleva las prescripciones con su identificador, para que el APK pueda registrar (DL-079);
 * - el criterio de intensidad y la condición de sesión viajan como texto en la entrada, para que un valor fuera de
 *   la taxonomía sea el 422 específico que declara el 09 y no un 400 genérico — igual que `result` en la revisión.
 *
 * **Sin puntaje, sin porcentaje de cumplimiento, sin cálculo** (DL-082; INV-06-153): ningún schema tiene score,
 * volumen, marca ni «cumplimiento». La única aparición de «percent» es el criterio `PERCENT_RM` de REG-06-128, que es
 * un criterio de prescripción y no una medida de cumplimiento; la prueba de TEST-PRJ-009 lo exceptúa por nombre.
 */
import { z } from 'zod';
import { ClasificacionDeEjercicioSchema } from './clasificacion-de-ejercicios';
import { IdOpaco, Instante } from './contratos';
import {
  AplicacionDeRevisionSchema,
  FechaLocalSchema,
  EstadoDeVersionDePlanSchema,
  PeriodoSchema,
  ProcedenciaDeCatalogoSchema,
  ReferenciaDeEvidenciaSchema,
  ResultadoDeRevisionApiSchema,
  ValoracionSchema,
  ZonaHorariaSchema,
} from './contratos-nutricion';
import { FuenteExternaSchema, OrigenEnElBuscadorSchema } from './contratos-procedencia-externa';
import { PaginaSchema, ResumenDeActorSchema, TokenDeVersionSchema } from './contratos-vinculo';
import { CitaDeRespuestaDeFormularioSchema, RespuestaCitadaSchema } from './contratos-citas-de-respuestas';

const Texto = (max: number) => z.string().trim().min(1).max(max);
const TextoOpcional = (max: number) => z.string().trim().max(max).nullable();

/**
 * Identificador de un nodo de la estructura (bloque, microciclo, sesión, prescripción). Lo asigna el servidor si
 * falta, y queda estable (REG-06-111, 112). Se restringe el alfabeto porque el de la sesión forma parte del
 * `occurrenceId`: un separador dentro del identificador lo volvería ambiguo (DL-088).
 */
export const IdDeNodoSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

// ─── Tokens (CAND-09-TRN-B, C, D, F) ────────────────────────────────────────────────────────────
/** REG-06-128: exactamente dos. Sin tercer criterio: ni RPE ni carga absoluta (REG-06-129; H-09-TRN-02). */
export const CriterioDeIntensidadApiSchema = z.enum(['PERCENT_RM', 'RIR']);
/**
 * DL-192 (WP-RPE-Y-MAXIMO-ESTIMADO, RPE-D01): cómo se escribe el esfuerzo en una versión del plan. `RIR`: las repeticiones
 * en reserva; `RPE`: la escala basada en RIR (RPE = 10 − RIR, de 6 a 10 con medios puntos). Es una **notación**, no un
 * criterio: lo guardado sigue siendo el RIR (`notacion-del-esfuerzo.ts`) y el criterio de intensidad sigue siendo uno de
 * dos (REG-06-128). Ausente es `RIR`: así se leen todos los planes de antes.
 */
export const NotacionDelEsfuerzoSchema = z.enum(['RIR', 'RPE']);
/** REG-06-132: se conserva cuál se usó. */
export const GranularidadApiSchema = z.enum(['SET', 'EXERCISE_OR_SESSION']);
/** REG-06-131. `NOT_COMPLETED` registrada ≠ ausencia de registro (H-09-TRN-01). */
export const CondicionDeSesionApiSchema = z.enum(['COMPLETED', 'COMPLETED_WITH_DEVIATION', 'NOT_COMPLETED']);
/** 09v10:425-427. Sin porcentaje, peso ni «activación» (09v10:438-446). */
export const RolMuscularSchema = z.enum(['PRIMARY', 'SECONDARY']);
/** El 09 da `kg` como ejemplo (09v10:383, 1060). Se admiten kilogramos y libras; siempre con unidad (INV-06-152). */
export const UnidadDeCargaSchema = z.enum(['kg', 'lb']);
export const CargaSchema = z.strictObject({ value: z.number().nonnegative().finite(), unit: UnidadDeCargaSchema });

// ─── Evaluación (API-TRN-01 a 03) ───────────────────────────────────────────────────────────────
// DL-102: la cita y lo citado viven en `contratos-citas-de-respuestas.ts` desde DL-179 (la usa también Nutrición, que
// este archivo importa: definirlas acá armaba un ciclo). Se vuelven a exportar para quien las tomaba de acá.
export { CitaDeRespuestaDeFormularioSchema, RespuestaCitadaSchema, type CitaDeRespuestaDeFormulario, type RespuestaCitada } from './contratos-citas-de-respuestas';

/**
 * La valoración es la misma lista de datos con fuente de nutrición (DL-048): «cada dato debe conservar origen»
 * (B10-06:132), y un dato calculado declara su método. Evidencia ≠ ejecución (09v10:199).
 */
export const CrearEvaluacionDeEntrenamientoRequestSchema = z.strictObject({
  occurredAt: Instante,
  assessment: ValoracionSchema,
  evidenceReferences: z.array(Texto(200)).max(20),
  /** DL-102. Opcional para no romper a los clientes que ya crean evaluaciones; ausente es lo mismo que `[]`. */
  formResponseReferences: z.array(CitaDeRespuestaDeFormularioSchema).max(20).optional(),
  professionalNotes: TextoOpcional(4000),
  /** RF-036: la evaluación se registra «con autoría, fecha, contexto y fuentes» (04:456; 09v10:190). Opcional para no
   *  romper a los clientes que ya la crean; ausente es lo mismo que `null`. */
  context: TextoOpcional(1000).optional(),
});
export type CrearEvaluacionDeEntrenamientoRequest = z.infer<typeof CrearEvaluacionDeEntrenamientoRequestSchema>;

export const EvaluacionDeEntrenamientoSchema = z.strictObject({
  evaluationId: IdOpaco,
  version: TokenDeVersionSchema,
  adviseeId: IdOpaco,
  professional: ResumenDeActorSchema,
  occurredAt: Instante,
  recordedAt: Instante,
  assessment: ValoracionSchema,
  evidenceReferences: z.array(z.string()),
  /** DL-102: las respuestas citadas, en el orden en que se citaron. */
  formResponseReferences: z.array(RespuestaCitadaSchema),
  professionalNotes: z.string().nullable(),
  context: z.string().nullable(),
});
export type EvaluacionDeEntrenamiento = z.infer<typeof EvaluacionDeEntrenamientoSchema>;
export const EvaluacionDeEntrenamientoResponseSchema = z.strictObject({ data: EvaluacionDeEntrenamientoSchema });
export const ListaDeEvaluacionesDeEntrenamientoResponseSchema = z.strictObject({ data: z.array(EvaluacionDeEntrenamientoSchema), page: PaginaSchema });

// ─── Objetivo (API-TRN-04 a 06) ─────────────────────────────────────────────────────────────────
/**
 * «El contenido concreto del objetivo no se fija en 09» (09v10:228) y el 10 lo deja a «dominio posterior»
 * (B10-06:249). La forma mínima es un enunciado del profesional; no se inventan metas cuantitativas (DL-080).
 */
export const EnunciadoDeObjetivoSchema = z.strictObject({ statement: Texto(2000) });

export const ContenidoDeObjetivoDeEntrenamientoSchema = z
  .strictObject({
    evaluationId: IdOpaco,
    effectiveFrom: Instante,
    effectiveUntil: Instante.nullable(),
    objective: EnunciadoDeObjetivoSchema,
    /** Obligatorio (09v10:613). */
    rationale: Texto(4000),
  })
  .refine((o) => o.effectiveUntil === null || o.effectiveUntil > o.effectiveFrom, { message: 'La vigencia termina después de empezar', path: ['effectiveUntil'] });
export const CrearObjetivoDeEntrenamientoRequestSchema = ContenidoDeObjetivoDeEntrenamientoSchema;
export type CrearObjetivoDeEntrenamientoRequest = z.infer<typeof CrearObjetivoDeEntrenamientoRequestSchema>;

export const VersionDeObjetivoDeEntrenamientoSchema = z.strictObject({
  objectiveId: IdOpaco,
  versionId: IdOpaco,
  predecessorVersionId: IdOpaco.nullable(),
  adviseeId: IdOpaco,
  evaluationId: IdOpaco,
  effectiveFrom: Instante,
  effectiveUntil: Instante.nullable(),
  objective: EnunciadoDeObjetivoSchema,
  rationale: z.string(),
  authoredBy: ResumenDeActorSchema,
  createdAt: Instante,
  /** La versión terminal de la sucesión (INV-06-107). Nunca «la última por fecha» (09v10:229, 658). */
  isEffective: z.boolean(),
});
export type VersionDeObjetivoDeEntrenamiento = z.infer<typeof VersionDeObjetivoDeEntrenamientoSchema>;
export const ObjetivoDeEntrenamientoResponseSchema = z.strictObject({ data: VersionDeObjetivoDeEntrenamientoSchema });
export const ListaDeObjetivosDeEntrenamientoResponseSchema = z.strictObject({ data: z.array(VersionDeObjetivoDeEntrenamientoSchema), page: PaginaSchema });
/** 09v10:648-656: `objective: null` es ausencia legítima. */
export const ObjetivoDeEntrenamientoEfectivoResponseSchema = z.strictObject({
  data: z.strictObject({ objective: VersionDeObjetivoDeEntrenamientoSchema.nullable() }),
});

// ─── Estructura del plan (REG-06-111, 126, 127; 09v10 §5-§6) ────────────────────────────────────
/** Repeticiones objetivo de una serie: un número o un rango. El 06 no fija cuáles (09v10:339). */
export const RepeticionesPrescriptasSchema = z.union([
  z.strictObject({ value: z.number().int().positive().max(1000) }),
  z
    .strictObject({ min: z.number().int().positive().max(1000), max: z.number().int().positive().max(1000) })
    .refine((r) => r.max >= r.min, { message: 'El rango termina después de empezar', path: ['max'] }),
]);
/**
 * WP-ENTRENAMIENTO-SERIES (DL-122): cómo se cuenta la carga de una prescripción. Sin base declarada, nadie la supone:
 * - `SINGLE_IMPLEMENT`: una sola mancuerna o implemento (la sentadilla goblet);
 * - `PER_IMPLEMENT`: por mancuerna o implemento, cuando son dos (el peso muerto rumano con mancuernas);
 * - `TOTAL_EXTERNAL`: la carga externa total.
 * BE no multiplica ni suma: «dos mancuernas de 12 kg» no se muestra como 24 kg.
 */
export const BaseDeCargaSchema = z.enum(['SINGLE_IMPLEMENT', 'PER_IMPLEMENT', 'TOTAL_EXTERNAL']);
export type BaseDeCarga = z.infer<typeof BaseDeCargaSchema>;
/** DL-122: qué cuentan las repeticiones. `PER_SIDE` es por pierna o por lado, y BE no las duplica. */
export const BaseDeRepeticionesSchema = z.enum(['PER_SET', 'PER_SIDE']);
export type BaseDeRepeticiones = z.infer<typeof BaseDeRepeticionesSchema>;
/** DL-122: el descanso recomendado, en segundos enteros. 0 es «sin pausa» (por ejemplo, una superserie); el tope, una hora. */
export const DescansoRecomendadoSchema = z.number().int().min(0).max(3600);

/**
 * DL-178 (decisión de Dirección del 2026-11-18) · el tipo de una serie, la planificada y la registrada:
 * - `WORKING`: efectiva. Es el valor por omisión: una serie sin el campo es efectiva, y así queda todo lo anterior;
 * - `WARM_UP`: de calentamiento. Se indica y se registra, pero no entra en ningún cálculo (`tipos-de-serie.ts`).
 * Es un enum y no un booleano para poder sumar otros tipos después. En lo que entra es opcional (ausente = `WORKING`); en
 * lo que sale va explícito para el cliente que declara `training-set-kinds-1` (`compatibilidad-de-clientes.ts`), y no va
 * para el que no la declara, que lo leería como un campo desconocido.
 */
export const TipoDeSerieSchema = z.enum(['WORKING', 'WARM_UP']);
export type TipoDeSerie = z.infer<typeof TipoDeSerieSchema>;

/**
 * DL-181 (WP-ENTRENAMIENTO-PLANIFICACION, decisión de Dirección del 2026-11-18) · el bloque dentro de la sesión. Es una
 * marca sobre la lista de ejercicios (`bloques-de-la-sesion.ts`): qué ejercicios van juntos y cómo. En pantalla, «Bloque»;
 * la etapa de varias semanas (`blocks`) se lee «Fase» (ENP-D01).
 * - `SEQUENTIAL` («Seguido», el que viene por defecto): un título; los ejercicios se hacen de a uno, como siempre;
 * - `ROUNDS` («En vueltas»): dos o más ejercicios alternados, con las vueltas y el descanso al terminar cada vuelta.
 * Es un enum, como `setKind`, para sumar otros tipos después.
 */
export const TipoDeBloqueSchema = z.enum(['SEQUENTIAL', 'ROUNDS']);
export type TipoDeBloque = z.infer<typeof TipoDeBloqueSchema>;
/** DL-181: las vueltas de un bloque «En vueltas». Cada vuelta es una serie efectiva de cada ejercicio (ENP-D05). */
export const VueltasSchema = z.number().int().min(1).max(20);
/**
 * DL-181: un bloque de la sesión, como entra. El identificador lo pone el editor (ENP-D09): el ejercicio nuevo nombra su
 * bloque antes de tener identificador propio. Las vueltas y el descanso son solo de `ROUNDS`, y ahí las vueltas van.
 */
export const BloqueDeLaSesionEntradaSchema = z
  .strictObject({
    groupId: IdDeNodoSchema,
    label: Texto(120),
    kind: TipoDeBloqueSchema,
    rounds: VueltasSchema.nullable().optional(),
    restAfterRoundSeconds: DescansoRecomendadoSchema.nullable().optional(),
  })
  .refine((g) => (g.kind === 'ROUNDS' ? typeof g.rounds === 'number' : (g.rounds ?? null) === null && (g.restAfterRoundSeconds ?? null) === null), {
    message: 'Las vueltas van solo en un bloque «En vueltas», y ahí son obligatorias',
    path: ['rounds'],
  });
export type BloqueDeLaSesionEntrada = z.infer<typeof BloqueDeLaSesionEntradaSchema>;
/** DL-181: el bloque como sale, con su orden en la sesión (el de su primer ejercicio). */
export const BloqueDeLaSesionSchema = z.strictObject({
  groupId: IdDeNodoSchema,
  label: z.string(),
  order: z.number().int().positive(),
  kind: TipoDeBloqueSchema,
  rounds: z.number().int().positive().nullable(),
  restAfterRoundSeconds: z.number().int().min(0).nullable(),
});
export type BloqueDeLaSesion = z.infer<typeof BloqueDeLaSesionSchema>;

/**
 * Una serie planificada. Los tres campos de DL-122 tienen tres estados: ausente hereda de la prescripción, `null` quita
 * el objetivo en esta serie y un valor lo sobrescribe (`objetivosEfectivos`, en `objetivos-por-serie.ts`). El RIR
 * viaja como número sin rango para que uno fuera de 0 a 10, o sin criterio RIR, sea el 422 específico y no un 400.
 */
export const SeriePrescriptaEntradaSchema = z.strictObject({
  repetitions: RepeticionesPrescriptasSchema.nullable(),
  note: TextoOpcional(200).optional(),
  rir: z.number().finite().nullable().optional(),
  suggestedLoad: CargaSchema.nullable().optional(),
  restSeconds: DescansoRecomendadoSchema.nullable().optional(),
  /** DL-178: ausente es `WORKING`. Las de calentamiento van antes que las efectivas (`WARM_UP_AFTER_WORKING_SET`). */
  setKind: TipoDeSerieSchema.optional(),
});

/**
 * «Descanso / parámetros» (B10-06:390): contenido del profesional, que el 06 no fija. Un parámetro cuantitativo
 * declara su unidad, porque «su unidad y significado deben ser identificables» (REG-06-111).
 */
export const ParametroProfesionalSchema = z
  .strictObject({ label: Texto(60), value: z.union([Texto(120), z.number().finite()]), unit: TextoOpcional(20).optional() })
  .refine((p) => typeof p.value !== 'number' || (p.unit ?? '').trim().length > 0, {
    message: 'Un parámetro cuantitativo declara su unidad (REG-06-111)',
    path: ['unit'],
  });

/**
 * Intensidad de entrada. El criterio viaja como texto: `RPE`, un tercer criterio o los dos juntos tienen que ser
 * `422 INTENSITY_CRITERION_INVALID` (09v10:753), con su motivo, y no un 400 que no diga qué se violó.
 * `reference` es la referencia del %RM: «1RM estimado por método X» (B10-06:426-431). BE no fija fórmula (09v10:356).
 */
export const IntensidadEntradaSchema = z.strictObject({
  criterion: z.string().max(40),
  target: z.strictObject({ value: z.number().finite(), reference: z.strictObject({ description: Texto(500) }).nullable().optional() }),
});

export const PrescripcionEntradaSchema = z.strictObject({
  prescriptionId: IdDeNodoSchema.optional(),
  exerciseVersionId: IdOpaco,
  sets: z.array(SeriePrescriptaEntradaSchema).max(20),
  /** `null`: la prescripción no declara criterio, y eso es legítimo (REG-06-128 es condicional). */
  intensity: IntensidadEntradaSchema.nullable(),
  /** Complemento informativo: `suggestedLoad ≠ intensityCriterion` (09v10:391). Es la carga que heredan las series (DL-122). */
  suggestedLoad: CargaSchema.nullable().optional(),
  professionalParameters: z.array(ParametroProfesionalSchema).max(12).optional(),
  note: TextoOpcional(1000).optional(),
  /** DL-122: el descanso recomendado que heredan las series. No reemplaza ni reinterpreta un parámetro libre «Descanso». */
  restSeconds: DescansoRecomendadoSchema.nullable().optional(),
  /** DL-122: cómo se cuenta la carga y qué cuentan las repeticiones. `null` o ausente: no se declaró. */
  loadBasis: BaseDeCargaSchema.nullable().optional(),
  repetitionBasis: BaseDeRepeticionesSchema.nullable().optional(),
  /** DL-181: el bloque de la sesión al que pertenece. Ausente o `null`: va suelto, como todos los de antes. */
  exerciseGroupId: IdDeNodoSchema.nullable().optional(),
});
export const SesionEntradaSchema = z.strictObject({
  sessionId: IdDeNodoSchema.optional(),
  label: Texto(120),
  instructions: TextoOpcional(2000).optional(),
  prescriptions: z.array(PrescripcionEntradaSchema).max(40),
  /** DL-181: los bloques de la sesión. Ausente o vacío: la sesión es una lista, como hoy. */
  exerciseGroups: z.array(BloqueDeLaSesionEntradaSchema).max(20).optional(),
});
export type SesionEntrada = z.infer<typeof SesionEntradaSchema>;
/** Opcional (REG-06-126). Su propósito es texto libre: sin taxonomía (REG-06-127). */
export const MicrocicloEntradaSchema = z.strictObject({
  microcycleId: IdDeNodoSchema.optional(),
  label: Texto(120),
  purpose: TextoOpcional(1000).optional(),
  sessions: z.array(SesionEntradaSchema).max(14),
});
/**
 * Un bloque organiza sus sesiones **o** bajo microciclos **o** directamente (09v10:281-283). Las dos cosas a la vez
 * es `TRAINING_PLAN_STRUCTURE_INVALID`; la omisión de microciclos es legítima y no se inventa uno vacío (09v10:262).
 */
export const BloqueEntradaSchema = z.strictObject({
  blockId: IdDeNodoSchema.optional(),
  label: Texto(120),
  purpose: TextoOpcional(1000).optional(),
  microcycles: z.array(MicrocicloEntradaSchema).max(26).optional(),
  sessions: z.array(SesionEntradaSchema).max(30).optional(),
});
export const EstructuraDePlanDeEntrenamientoEntradaSchema = z.strictObject({ blocks: z.array(BloqueEntradaSchema).max(12) });
export type EstructuraDePlanDeEntrenamientoEntrada = z.infer<typeof EstructuraDePlanDeEntrenamientoEntradaSchema>;

/** Salida: nodos con identificador y orden; cada prescripción con el ejercicio de la instantánea si está activada. */
export const IntensidadSchema = z.strictObject({
  criterion: CriterioDeIntensidadApiSchema,
  target: z.strictObject({ value: z.number().finite(), reference: z.strictObject({ description: z.string() }).nullable() }),
});
export const SeriePrescriptaSchema = z.strictObject({
  setIndex: z.number().int().positive(),
  repetitions: RepeticionesPrescriptasSchema.nullable(),
  note: z.string().nullable(),
  /** DL-178: explícito para el cliente que declara `training-set-kinds-1`; ausente para el que no (y entonces es efectiva). */
  setKind: TipoDeSerieSchema.optional(),
});
export const PrescripcionSchema = z.strictObject({
  prescriptionId: IdDeNodoSchema,
  order: z.number().int().positive(),
  exerciseId: IdOpaco,
  exerciseVersionId: IdOpaco,
  /** El de la instantánea si la versión está activada: un cambio de catálogo no la reescribe (REG-06-112). */
  exerciseName: z.string(),
  sets: z.array(SeriePrescriptaSchema),
  intensity: IntensidadSchema.nullable(),
  suggestedLoad: CargaSchema.nullable(),
  professionalParameters: z.array(ParametroProfesionalSchema),
  note: z.string().nullable(),
  /** DL-181: explícito (`null`: suelto) para el cliente que declara `training-session-groups-1`; ausente para el que no. */
  exerciseGroupId: IdDeNodoSchema.nullable().optional(),
});
export type Prescripcion = z.infer<typeof PrescripcionSchema>;
export const SesionPlanificadaSchema = z.strictObject({
  sessionId: IdDeNodoSchema,
  label: z.string(),
  order: z.number().int().positive(),
  instructions: z.string().nullable(),
  prescriptions: z.array(PrescripcionSchema),
  /** DL-181: explícito (vacío si no tiene) para el cliente que declara `training-session-groups-1`; ausente para el que no. */
  exerciseGroups: z.array(BloqueDeLaSesionSchema).optional(),
});
export type SesionPlanificada = z.infer<typeof SesionPlanificadaSchema>;
export const MicrocicloSchema = z.strictObject({
  microcycleId: IdDeNodoSchema,
  label: z.string(),
  order: z.number().int().positive(),
  purpose: z.string().nullable(),
  sessions: z.array(SesionPlanificadaSchema),
});
export const BloqueSchema = z.strictObject({
  blockId: IdDeNodoSchema,
  label: z.string(),
  order: z.number().int().positive(),
  purpose: z.string().nullable(),
  microcycles: z.array(MicrocicloSchema),
  sessions: z.array(SesionPlanificadaSchema),
});
export type Bloque = z.infer<typeof BloqueSchema>;

// ─── Plan (API-TRN-07 a 12) ─────────────────────────────────────────────────────────────────────
export const CrearPlanDeEntrenamientoRequestSchema = z.strictObject({
  objectiveVersionId: IdOpaco,
  /** Vacío o parcial: un borrador puede estar incompleto; validar lo informa (09v10:682). */
  initialStructure: EstructuraDePlanDeEntrenamientoEntradaSchema.optional(),
  /** Borrador sucesor de la versión efectiva, con su estructura (DL-047, por homología: DL-088). */
  basedOnPlanId: IdOpaco.optional(),
  /** Próxima revisión que fija esta versión (REG-06-145; DL-055, por homología). */
  nextReviewAt: FechaLocalSchema.nullable().optional(),
  /** PF-09 (DL-108): empezar desde una versión de plantilla propia; excluyente con `basedOnPlanId` e `initialStructure`. */
  fromTemplateVersionId: IdOpaco.optional(),
  /**
   * DL-192 (RPE-D01): la notación del esfuerzo del borrador. Ausente: la de la versión de la que parte (`basedOnPlanId`);
   * si no parte de una, la última que usó este profesional con cualquier persona; si nunca eligió, `RIR`.
   */
  effortNotation: NotacionDelEsfuerzoSchema.optional(),
});
export type CrearPlanDeEntrenamientoRequest = z.infer<typeof CrearPlanDeEntrenamientoRequestSchema>;

// ─── WP-AGENDA-DE-ENTRENAMIENTO (DL-137): las fechas previstas de las sesiones ────────────────────────────

/** Los días de la semana, con el lunes primero, como se lee un calendario en Argentina. */
export const DIAS_DE_LA_SEMANA = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
export const DiaDeLaSemanaSchema = z.enum(DIAS_DE_LA_SEMANA);
export type DiaDeLaSemana = z.infer<typeof DiaDeLaSemanaSchema>;

/**
 * La agenda de una versión del plan (DL-137 D-1 y D-2): desde qué fecha rige, qué días de la semana va cada sesión y las
 * fechas que el profesional movió a mano. BE arma con eso el calendario de fechas exactas. Va en el contenido de la
 * versión y se versiona con el plan: activada, no se edita. Una sesión sin días no tiene fecha prevista y se hace a mano,
 * como antes de la agenda.
 */
export const AgendaDeEntrenamientoSchema = z.strictObject({
  startDate: FechaLocalSchema,
  sessions: z.array(z.strictObject({ sessionId: IdDeNodoSchema, weekdays: z.array(DiaDeLaSemanaSchema).min(1).max(7) })).max(60),
  /** La sesión deja de estar prevista en `from` y pasa a `to`. */
  moves: z.array(z.strictObject({ sessionId: IdDeNodoSchema, from: FechaLocalSchema, to: FechaLocalSchema })).max(100),
});
export type AgendaDeEntrenamiento = z.infer<typeof AgendaDeEntrenamientoSchema>;

/**
 * DL-196 (WP-EDITOR-ENTRENAMIENTO, EE-D03) · el paso al que se redondean las cargas de las aproximaciones: sin decimales
 * raros, porque no todos los gimnasios tienen discos chicos. 1 para las mancuernas livianas; 2,5 para la barra y los discos;
 * 5 (o 10 en libras) para las máquinas de placas.
 */
export const PasoDeRedondeoSchema = z.union([z.literal(1), z.literal(2.5), z.literal(5), z.literal(10)]);
export type PasoDeRedondeo = z.infer<typeof PasoDeRedondeoSchema>;

/**
 * DL-196 (EE-07) · cómo se arman las aproximaciones de un ejercicio (las series `WARM_UP` antes de las efectivas):
 * - `FROM_WORKING_LOAD`: BE las calcula desde la carga de trabajo con estos porcentajes, redondeadas al paso;
 * - `MANUAL`: el profesional escribe cada una. Los porcentajes quedan como estaban, por si vuelve a «Por %».
 * Las series en sí son las de siempre (`setKind: WARM_UP`): esto solo recuerda cómo se armaron.
 */
export const AproximacionesDelEjercicioSchema = z.strictObject({
  prescriptionId: IdDeNodoSchema,
  mode: z.enum(['FROM_WORKING_LOAD', 'MANUAL']),
  workingLoadShares: z.array(z.number().int().min(5).max(95)).max(6),
  step: PasoDeRedondeoSchema,
});
export type AproximacionesDelEjercicio = z.infer<typeof AproximacionesDelEjercicioSchema>;

/**
 * DL-196 parte B (EE-D30 a EE-D33) · la progresión de una fase: una **regla** que dice cómo cambia la carga de trabajo
 * semana a semana dentro de la fase. No reescribe las series: la sesión sigue siendo la misma todas las semanas de su
 * fase y la regla se lee encima (`progresiones.ts`). Los modelos:
 * - `LINEAR`: `loadStep` más por semana (en la unidad del ejercicio) y, si se dice, `repStep` repeticiones más;
 * - `DOUBLE`: primero las repeticiones, de `repRange.min` a `repRange.max` de a una por semana; al llegar arriba, la carga
 *   sube `loadStep` y las repeticiones vuelven abajo;
 * - `UNDULATING`: tres semanas que se repiten (pesada, liviana y media), cada una con su parte de la carga de trabajo
 *   (`waves`, en % de la carga de trabajo de la sesión);
 * - `null`: sin modelo, solo la descarga.
 * La descarga (`deload`) va en una semana elegida de la fase: la carga baja a `workingLoadShare` % de la carga de trabajo
 * de la semana anterior (`LOAD`) o se hacen `setsRemoved` series efectivas menos con la misma carga (`SETS`). Se aplica a
 * toda la fase (`prescriptionIds` en `null`) o a los ejercicios elegidos.
 */
export const ProgresionDeLaFaseSchema = z.strictObject({
  blockId: IdDeNodoSchema,
  model: z.enum(['LINEAR', 'DOUBLE', 'UNDULATING']).nullable(),
  loadStep: z.number().finite().min(0).max(50).nullable(),
  repStep: z.number().int().min(0).max(5).nullable(),
  repRange: z
    .strictObject({ min: z.number().int().min(1).max(50), max: z.number().int().min(1).max(50) })
    .refine((r) => r.max > r.min, { message: 'El rango termina después de empezar', path: ['max'] })
    .nullable(),
  waves: z.array(z.number().int().min(40).max(100)).min(3).max(3).nullable(),
  deload: z
    .strictObject({
      week: z.number().int().min(1).max(52),
      mode: z.enum(['LOAD', 'SETS']),
      workingLoadShare: z.number().int().min(40).max(95),
      setsRemoved: z.number().int().min(1).max(10),
    })
    .nullable(),
  prescriptionIds: z.array(IdDeNodoSchema).min(1).max(60).nullable(),
});
export type ProgresionDeLaFase = z.infer<typeof ProgresionDeLaFaseSchema>;

/**
 * DL-196 parte B (EE-D38, GR-27) · un gráfico del editor marcado como favorito de esta planificación: la carga por semana
 * de un ejercicio (`EXERCISE_LOAD`, por su prescripción), la progresión de una fase (`PHASE_PROGRESSION`) o su
 * distribución por músculo (`PHASE_DISTRIBUTION`).
 */
export const GraficoFavoritoDelPlanSchema = z.strictObject({
  kind: z.enum(['EXERCISE_LOAD', 'PHASE_PROGRESSION', 'PHASE_DISTRIBUTION']),
  id: IdDeNodoSchema,
});
export type GraficoFavoritoDelPlan = z.infer<typeof GraficoFavoritoDelPlanSchema>;

/**
 * DL-196 (WP-EDITOR-ENTRENAMIENTO) · la planificación de una versión del plan, aparte de su estructura:
 * - `startDate` y `weeks`: cuándo empieza el plan y cuántas semanas dura (el fin sale de los dos, EE-D01);
 * - `goal`: el objetivo general del plan, en palabras del profesional (para la persona; la APK 0.32 todavía no lo muestra);
 * - `phases`: cuántas semanas dura cada fase (EE-D02), por el identificador de su bloque; las fechas salen solas,
 *   una fase detrás de la otra desde el inicio (`planificacion-del-plan.ts`);
 * - `warmUps`: cómo se armaron las aproximaciones de cada ejercicio;
 * - `privateNotes`: las anotaciones del profesional, del plan y de cada fase. **La persona no las ve:** no salen en
 *   ninguna lectura del titular ni en su exportación (EE-D05).
 * Va en el contenido de la versión, como la agenda, y solo en las lecturas del profesional (API-SER-01).
 */
/** DL-197 (ET1-D10): la intensidad del plan. */
export const IntensidadDelPlanSchema = z.enum(['RIR', 'PERCENT_RM', 'NONE']);
export type IntensidadDelPlan = z.infer<typeof IntensidadDelPlanSchema>;

export const PlanificacionDelPlanSchema = z.strictObject({
  startDate: FechaLocalSchema.nullable(),
  weeks: z.number().int().min(1).max(104).nullable(),
  goal: TextoOpcional(1000).optional(),
  phases: z.array(z.strictObject({ blockId: IdDeNodoSchema, weeks: z.number().int().min(1).max(52).nullable() })).max(12),
  warmUps: z.array(AproximacionesDelEjercicioSchema).max(400).optional(),
  /** DL-196 parte B: la progresión de cada fase, como regla (EE-D30). Una por fase. */
  progressions: z.array(ProgresionDeLaFaseSchema).max(12).optional(),
  /** DL-196 parte B (GR-27): los gráficos del editor marcados como favoritos de esta planificación. */
  favoriteCharts: z.array(GraficoFavoritoDelPlanSchema).max(30).optional(),
  /**
   * DL-197 (ET1-D10): la intensidad del plan, elegida una vez, que hereda cada ejercicio nuevo: `RIR` (escrito como RIR o
   * como RPE, según `effortNotation`: DL-192), `PERCENT_RM` o `NONE` («Solo carga y repeticiones»). Ausente, RIR, como
   * hasta ahora. No cambia el modelo: cada ejercicio sigue guardando su criterio.
   */
  intensity: IntensidadDelPlanSchema.optional(),
  privateNotes: z
    .strictObject({
      plan: TextoOpcional(4000),
      phases: z.array(z.strictObject({ blockId: IdDeNodoSchema, text: Texto(2000) })).max(12),
    })
    .optional(),
});
export type PlanificacionDelPlan = z.infer<typeof PlanificacionDelPlanSchema>;

export const VersionDePlanDeEntrenamientoSchema = z.strictObject({
  planId: IdOpaco,
  /** El Plan que agrupa las versiones (DL-046, por homología). */
  trainingPlanId: IdOpaco,
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
  /**
   * PF-09 (DL-108): de qué plantilla y versión salió esta versión. Solo en lecturas del profesional (la APK instalada
   * valida con esquemas estrictos y no la conoce): ausente para el titular, `null` si no salió de una plantilla.
   */
  templateOrigin: z.strictObject({ templateId: IdOpaco, templateVersionId: IdOpaco }).nullable().optional(),
  /**
   * DL-192 (RPE-D01, RPE-D08): cómo se escribe el esfuerzo en esta versión. Va siempre en las lecturas del profesional; al
   * titular, solo si su cliente declara `training-effort-notation-1` (la APK instalada valida con esquemas estrictos y no
   * la conoce). Ausente es `RIR`.
   */
  effortNotation: NotacionDelEsfuerzoSchema.optional(),
  blocks: z.array(BloqueSchema),
});
export type VersionDePlanDeEntrenamiento = z.infer<typeof VersionDePlanDeEntrenamientoSchema>;
export const PlanDeEntrenamientoResponseSchema = z.strictObject({ data: VersionDePlanDeEntrenamientoSchema });
export const ResumenDeVersionDePlanDeEntrenamientoSchema = VersionDePlanDeEntrenamientoSchema.omit({ blocks: true });
export type ResumenDeVersionDePlanDeEntrenamiento = z.infer<typeof ResumenDeVersionDePlanDeEntrenamientoSchema>;
export const ListaDePlanesDeEntrenamientoResponseSchema = z.strictObject({ data: z.array(ResumenDeVersionDePlanDeEntrenamientoSchema), page: PaginaSchema });

export const EditarPlanDeEntrenamientoRequestSchema = z.strictObject({
  expectedVersion: TokenDeVersionSchema,
  changes: EstructuraDePlanDeEntrenamientoEntradaSchema,
  /** Pasar el borrador al objetivo efectivo, por ejemplo después de CHANGE_OBJECTIVE. */
  objectiveVersionId: IdOpaco.optional(),
  nextReviewAt: FechaLocalSchema.nullable().optional(),
  /** DL-137: la agenda del borrador. Ausente, no cambia; `null`, se quita. */
  agenda: AgendaDeEntrenamientoSchema.nullable().optional(),
  /** DL-192 (RPE-D01): la notación del esfuerzo del borrador. Ausente, no cambia. Lo guardado sigue siendo el RIR. */
  effortNotation: NotacionDelEsfuerzoSchema.optional(),
  /** DL-196: la planificación del borrador (fechas, semanas de cada fase, objetivo, anotaciones). Ausente, no cambia; `null`, se quita. */
  planning: PlanificacionDelPlanSchema.nullable().optional(),
});
export type EditarPlanDeEntrenamientoRequest = z.infer<typeof EditarPlanDeEntrenamientoRequestSchema>;

export const ActivacionDePlanDeEntrenamientoResponseSchema = z.strictObject({
  data: z.strictObject({
    planId: IdOpaco,
    trainingPlanId: IdOpaco,
    state: z.literal('ACTIVATED'),
    version: TokenDeVersionSchema,
    activatedAt: Instante,
    snapshotDigest: z.string().regex(/^[0-9a-f]{64}$/),
    processId: IdOpaco,
    /** `true` si la activación abrió un Proceso nuevo (pasó por capacidad); `false` si fue continuidad. */
    processOpened: z.boolean(),
    supersededPlanId: IdOpaco.nullable(),
  }),
});
export type ActivacionDePlanDeEntrenamientoResponse = z.infer<typeof ActivacionDePlanDeEntrenamientoResponseSchema>;

// ─── Catálogo (API-TRN-13 y API-INT-TRN-01) ─────────────────────────────────────────────────────
/** 09v10:408-413. La zona viaja por identificador, nunca como imagen (H-09-TRN-03). Las zonas llegan en WP-07. */
export const RelacionConZonaSchema = z.strictObject({ zoneId: IdOpaco, role: RolMuscularSchema });
/** 09v10 §9. Licencia obligatoria (09v10:514). El material didáctico llega en WP-07 (REG-06-134). */
export const RecursoDidacticoSchema = z.strictObject({
  resourceId: IdOpaco,
  resourceVersionId: IdOpaco,
  type: z.literal('IMAGE'),
  authorship: z.strictObject({ name: z.string() }),
  license: z.strictObject({ id: z.string(), label: z.string() }),
});
export const EjercicioDeCatalogoSchema = z.strictObject({
  exerciseId: IdOpaco,
  versionId: IdOpaco,
  name: z.string(),
  provenance: ProcedenciaDeCatalogoSchema,
  /** Proveedor, identificador, fecha y licencia de lo importado de wger; `null` en lo sembrado y lo manual (RF-060). */
  externalSource: FuenteExternaSchema.nullable(),
  muscleZones: z.array(RelacionConZonaSchema),
  didacticResources: z.array(RecursoDidacticoSchema),
  available: z.boolean(),
});
export type EjercicioDeCatalogo = z.infer<typeof EjercicioDeCatalogoSchema>;
export const ListaDeEjerciciosResponseSchema = z.strictObject({ data: z.array(EjercicioDeCatalogoSchema), page: PaginaSchema });
/**
 * DL-141 D-2: un ejercicio que encontró el buscador del website (API-TRN-13-BUSQUEDA), con el nombre alternativo que
 * coincidió con lo buscado y (D-6) lo que hace falta para decir su origen en la fila. API-TRN-13, la que lee la APK
 * instalada con su esquema congelado, responde sin estos campos. Desde DL-151 también busca con esta operación la
 * sustitución de la APK: una APK construida sobre una base anterior a D-6 rechazaría `origin`, y cuando se publique una
 * APK con esta lectura su forma queda congelada (DL-152).
 */
export const EjercicioEncontradoSchema = EjercicioDeCatalogoSchema.extend({
  /** El nombre alternativo que coincidió («Bench press» al buscar «bench press»), tal como está guardado; `null` si coincidió el principal, o sin texto. */
  matchedAlternativeName: z.string().nullable(),
  /** DL-141 D-6: quién lo cargó y si su correspondencia con la fuente es aproximada. */
  origin: OrigenEnElBuscadorSchema,
  /**
   * DL-197 (ET1-D12): la clasificación (grupo, equipamiento, patrón y articulaciones), **solo si se pidió**
   * (`withClassification`): la APK 0.32 busca con esta operación y su esquema estricto no la conoce, así que nunca le llega.
   */
  classification: ClasificacionDeEjercicioSchema.optional(),
});
export type EjercicioEncontrado = z.infer<typeof EjercicioEncontradoSchema>;
export const BusquedaDeEjerciciosResponseSchema = z.strictObject({ data: z.array(EjercicioEncontradoSchema), page: PaginaSchema });
/**
 * API-TRN-13-BUSQUEDA (DL-130): la búsqueda de ejercicios con el texto en el **cuerpo**, nunca en una URL. Es una lectura
 * y trae las mismas filas que API-TRN-13, que se conserva con su contrato para los clientes instalados; cada una suma el
 * nombre alternativo que coincidió (DL-141).
 */
export const BusquedaDeEjerciciosRequestSchema = z.strictObject({
  q: z.string().trim().max(80),
  /**
   * DL-196 parte B (EE-D41): solo los ejercicios que trabajan esa zona (una de las 17), como principal o secundaria, en su
   * asignación vigente. Con `q` vacío, todos los de esa zona. Una zona que no existe es un 422 `INVALID_FILTER`.
   */
  zoneId: z.string().max(40).optional(),
  /** DL-197 (ET1-D12): con `true`, cada ejercicio trae su clasificación. Lo pide el website; la APK 0.32 no lo manda. */
  withClassification: z.literal(true).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  cursor: z.string().max(400).optional(),
});
export type BusquedaDeEjerciciosRequest = z.infer<typeof BusquedaDeEjerciciosRequestSchema>;
export const EjercicioDeCatalogoResponseSchema = z.strictObject({ data: EjercicioDeCatalogoSchema });

/**
 * API-INT-TRN-01 (09v12:310-340). Cero zonas es legítimo (REG-06-139: la relación es `0..N`), y así entra en WP-06
 * (docs/paquetes/WP-06.md §9.8). Una zona o un recurso que el dominio todavía no tiene es un 422 con su motivo.
 */
export const CrearEjercicioRequestSchema = z.strictObject({
  name: Texto(120),
  muscleZones: z.array(RelacionConZonaSchema).max(17),
  didacticResources: z.array(z.strictObject({ resourceVersionId: IdOpaco })).max(20),
  provenance: z.strictObject({ type: z.literal('MANUAL_ENTRY') }),
  /** DL-197 (ET1-D14): la clasificación de un ejercicio propio, opcional; ausente, sin clasificar. */
  classification: ClasificacionDeEjercicioSchema.optional(),
});
export type CrearEjercicioRequest = z.infer<typeof CrearEjercicioRequestSchema>;

// ─── Ocurrencias: «Hoy» (API-TRN-14) y el período (DL-078) ──────────────────────────────────────
/**
 * La sesión planificada tal como la ve el asesorado: la de la instantánea, con sus prescripciones y sus
 * identificadores, que es lo que el registro exige (DL-079). Se ubica en su bloque y microciclo.
 */
export const SesionDeOcurrenciaSchema = SesionPlanificadaSchema.extend({
  blockId: IdDeNodoSchema,
  blockLabel: z.string(),
  microcycleId: IdDeNodoSchema.nullable(),
  microcycleLabel: z.string().nullable(),
});
export type SesionDeOcurrencia = z.infer<typeof SesionDeOcurrenciaSchema>;

/**
 * Estado de la ejecución de una ocurrencia. **No existe un estado para «no realizada» por ausencia**: sin borrador
 * es `NOT_STARTED`, y la pantalla dice «No iniciada» hoy y «Sin registro» en un día pasado (B10-10:461). `NOT_COMPLETED`
 * solo aparece como `sessionCondition` de una ejecución que el asesorado registró así (09v10:903-915).
 */
export const EstadoDeEjecucionDeOcurrenciaSchema = z.enum(['NOT_STARTED', 'DRAFT_IN_PROGRESS', 'REGISTERED']);
export const OcurrenciaSchema = z.strictObject({
  /** Opaco: lo emite el servidor, el cliente no lo arma (DL-077). */
  occurrenceId: IdOpaco,
  date: FechaLocalSchema,
  planId: IdOpaco,
  plannedSession: SesionDeOcurrenciaSchema,
  execution: z.strictObject({
    state: EstadoDeEjecucionDeOcurrenciaSchema,
    draftId: IdOpaco.nullable(),
    executionId: IdOpaco.nullable(),
    sessionCondition: CondicionDeSesionApiSchema.nullable(),
  }),
});
export type Ocurrencia = z.infer<typeof OcurrenciaSchema>;

/**
 * DL-137: una fecha prevista de la agenda. `occurrenceId` es la ocurrencia de esa fecha: con ella se registra en diferido
 * o se saltea (registrarla «no realizada»). Hacerla hoy es registrar la ocurrencia de hoy de la misma sesión, que está en
 * las ocurrencias de «Hoy»; la resuelve igual (D-4).
 */
export const FechaDeAgendaSchema = z.strictObject({
  sessionId: IdDeNodoSchema,
  plannedDate: FechaLocalSchema,
  occurrenceId: IdOpaco,
  /** La ejecución que la resolvió, o `null`: hecha (con o sin cambios) o salteada, y en qué fecha. */
  resolvedBy: z.strictObject({ executionId: IdOpaco, date: FechaLocalSchema, sessionCondition: CondicionDeSesionApiSchema }).nullable(),
});
export type FechaDeAgenda = z.infer<typeof FechaDeAgendaSchema>;

/**
 * API-TRN-14. El servidor fija fecha y zona (09v10:872). Si el plan tiene varias sesiones, están todas: BE no elige
 * cuál corresponde hoy, el asesorado la elige (DL-077, igual que el día tipo de nutrición en DL-049).
 */
export const HoyDeEntrenamientoResponseSchema = z.strictObject({
  data: z.strictObject({
    date: FechaLocalSchema,
    timeZone: ZonaHorariaSchema,
    /** Igual que en nutrición: NOT_AVAILABLE es acceso suspendido (vínculo pausado, consentimiento o A3 revocados). */
    planState: z.enum(['AVAILABLE', 'NO_ACTIVE_PLAN', 'NOT_AVAILABLE']),
    activePlan: z
      .strictObject({
        planId: IdOpaco,
        trainingPlanId: IdOpaco,
        /** La instantánea que se ejecuta: su huella SHA-256 (09v10:883). */
        snapshotVersion: z.string().regex(/^[0-9a-f]{64}$/),
        activatedAt: Instante,
      })
      .nullable(),
    occurrences: z.array(OcurrenciaSchema),
  }),
});
export type HoyDeEntrenamientoResponse = z.infer<typeof HoyDeEntrenamientoResponseSchema>;

/**
 * API-AGE-01 (DL-137): la agenda del día del titular, en una operación propia: «Hoy» (API-TRN-14) no cambia, porque la
 * APK instalada lo valida con un esquema estricto. Con el plan vigente y su agenda: lo previsto para hoy, lo pendiente y
 * lo que viene. Los nombres de las sesiones están en las ocurrencias de «Hoy». Sin agenda, `startDate` es `null` y las
 * listas van vacías: la persona elige la sesión como siempre (DL-077).
 */
export const AgendaDeHoyResponseSchema = z.strictObject({
  data: z.strictObject({
    date: FechaLocalSchema,
    timeZone: ZonaHorariaSchema,
    /** Como en «Hoy»: NOT_AVAILABLE es acceso suspendido. */
    planState: z.enum(['AVAILABLE', 'NO_ACTIVE_PLAN', 'NOT_AVAILABLE']),
    /** La versión efectiva del plan, la de las ocurrencias. */
    planId: IdOpaco.nullable(),
    startDate: FechaLocalSchema.nullable(),
    /** Las sesiones previstas para hoy, registradas o no. */
    today: z.array(FechaDeAgendaSchema),
    /** Las de días anteriores que siguen sin registro: se ven una semana, hasta la próxima fecha de la misma sesión. */
    pending: z.array(FechaDeAgendaSchema),
    /** Las de los siete días que siguen y todavía no se hicieron: «Mañana: Piernas A». */
    upcoming: z.array(z.strictObject({ sessionId: IdDeNodoSchema, plannedDate: FechaLocalSchema })),
  }),
});
export type AgendaDeHoyResponse = z.infer<typeof AgendaDeHoyResponseSchema>;

/**
 * DL-078: la lectura que falta para registrar en diferido. Sin ella, la sesión de anteayer no se podría registrar y
 * la ausencia de registro se volvería permanente por limitación técnica. Hasta 31 días, y nunca después de hoy.
 */
export const OcurrenciasDelPeriodoResponseSchema = z.strictObject({
  data: z.strictObject({
    period: PeriodoSchema,
    /** Como en «Hoy»: una lista vacía por acceso suspendido no se confunde con un período sin sesiones. */
    planState: z.enum(['AVAILABLE', 'NO_ACTIVE_PLAN', 'NOT_AVAILABLE']),
    occurrences: z.array(OcurrenciaSchema),
  }),
});
export type OcurrenciasDelPeriodoResponse = z.infer<typeof OcurrenciasDelPeriodoResponseSchema>;

// ─── Registro de ejecución (API-TRN-15 a 20) ────────────────────────────────────────────────────
/** ED-70: el origen de un valor de una serie registrada: lo escribió la persona o vino del plan. */
export const OrigenDelValorSchema = z.enum(['PERSON', 'PLAN']);
export type OrigenDelValor = z.infer<typeof OrigenDelValorSchema>;
/** Los tres valores de la serie que llevan su origen (ED-70), en el orden del contrato. */
export const CAMPOS_CON_ORIGEN = ['load', 'completedRepetitions', 'rir'] as const;
export type CampoConOrigen = (typeof CAMPOS_CON_ORIGEN)[number];
/**
 * 09v10:1055-1066. La carga lleva unidad; reps, RIR y esfuerzo percibido son opcionales y **nunca se infieren**
 * (INV-06-152; TEST-PRJ-004). El esfuerzo percibido es dato de ejecución, jamás de prescripción (REG-06-129); su
 * escala es de 0 a 10 (DL-088).
 */
export const SerieEjecutadaSchema = z.strictObject({
  setIndex: z.number().int().positive().max(50),
  load: CargaSchema.nullable(),
  completedRepetitions: z.number().int().nonnegative().max(1000).nullable(),
  rir: z.number().nonnegative().max(20).finite().nullable(),
  perceivedExertion: z.number().min(0).max(10).nullable(),
  /**
   * Cómo se cargó la serie (DL-161). `TYPED`: la persona escribió algún valor. `AS_PLANNED`: la tildó sin escribir,
   * con lo planificado a la vista, y los valores son los del plan que confirmó (B10-06 §56: repetir el objetivo con
   * confirmación visible). El profesional ve la diferencia. Ausente = `TYPED`: así quedó todo lo registrado antes.
   */
  recordedAs: z.enum(['TYPED', 'AS_PLANNED']).optional(),
  /** Cuánto duró la serie, en segundos (DL-161): la midió el cronómetro o la escribió la persona; nunca se infiere. */
  durationSeconds: z.number().int().nonnegative().max(36000).nullable().optional(),
  /**
   * ED-70 (WP-EDITORES-PROFESIONAL; DL-171, DJ-2): de dónde salió cada valor de la serie. `PERSON`: lo escribió la
   * persona; `PLAN`: vino del plan al tildar. Solo para la carga, las repeticiones y el RIR que tengan valor. Ausente: la
   * serie se registró antes de la procedencia; una clave que falta: no se sabe quién escribió ese valor. No es la
   * `procedencia` de cada escritura (T-06-23): esa dice la operación, la superficie y el pedido.
   */
  fieldOrigins: z
    .strictObject({ load: OrigenDelValorSchema.optional(), completedRepetitions: OrigenDelValorSchema.optional(), rir: OrigenDelValorSchema.optional() })
    .optional(),
  /**
   * DL-178: si la serie fue de calentamiento. Ausente = `WORKING`: así quedó todo lo registrado antes y lo que registra
   * una APK que no conoce el campo. Se guarda solo `WARM_UP` (`serieEnSuForma`); sale explícito para el cliente que
   * declara `training-set-kinds-1`.
   */
  setKind: TipoDeSerieSchema.optional(),
});
export type SerieEjecutadaApi = z.infer<typeof SerieEjecutadaSchema>;
/** Cómo se cargó una serie; ausente se lee como `TYPED` (DL-161). */
export type FormaDeCarga = NonNullable<SerieEjecutadaApi['recordedAs']>;
/** «Ejercicio realizado + resumen» (B10-06:737-738). Solo lo capturado: no se sintetizan series (09v10:1099-1101). */
export const ResumenDeEjercicioSchema = z.strictObject({ description: Texto(1000) });
export const ResumenDeSesionSchema = z.strictObject({ description: Texto(2000) });

/**
 * Lo registrado de una prescripción. `performedExerciseVersionId` distinto del prescripto es una sustitución,
 * legítima y no un error (09v10:1116-1121). Siempre conserva `prescriptionId`.
 */
export const EjercicioPorSerieSchema = z.strictObject({
  prescriptionId: IdDeNodoSchema,
  performedExerciseVersionId: IdOpaco,
  sets: z.array(SerieEjecutadaSchema).max(50),
});
export const EjercicioResumidoSchema = z.strictObject({
  prescriptionId: IdDeNodoSchema,
  performedExerciseVersionId: IdOpaco,
  executionSummary: ResumenDeEjercicioSchema,
});
export const EjercicioRegistradoEntradaSchema = z.union([EjercicioPorSerieSchema, EjercicioResumidoSchema]);
export type EjercicioRegistradoEntrada = z.infer<typeof EjercicioRegistradoEntradaSchema>;

/** 09v10:995-1003. Cada campo presente reemplaza al anterior; uno ausente se conserva. */
export const CambiosDeBorradorDeEjecucionSchema = z.strictObject({
  /** Texto: fuera de la taxonomía es `EXECUTION_GRANULARITY_INVALID` (09v10:1537). `null` antes de decidir. */
  granularity: z.string().max(40).nullable().optional(),
  /** Texto: fuera de la taxonomía es `SESSION_CONDITION_INVALID` (09v10:1538). */
  sessionCondition: z.string().max(40).nullable().optional(),
  /** Motivo opcional, también para `NOT_COMPLETED`: «no se fuerza explicación» (B10-06:816). */
  reason: TextoOpcional(1000).optional(),
  exercises: z.array(EjercicioRegistradoEntradaSchema).max(40).optional(),
  sessionSummary: ResumenDeSesionSchema.nullable().optional(),
  /**
   * Cuándo ocurrió la sesión, para registrar en diferido. Tiene que caer en la fecha de la ocurrencia. Si no se
   * declara, al confirmar se usa el comienzo del borrador, solo si fue ese mismo día: BE no inventa la hora (DL-088).
   */
  occurredAt: Instante.nullable().optional(),
});
export const EditarBorradorDeEjecucionRequestSchema = z.strictObject({ expectedVersion: TokenDeVersionSchema, changes: CambiosDeBorradorDeEjecucionSchema });
export type EditarBorradorDeEjecucionRequest = z.infer<typeof EditarBorradorDeEjecucionRequestSchema>;

/** Lo que el 09 declara para el `PUT` es `{}` (09v10:923-957): el recurso es la ocurrencia, no el cuerpo. */
export const AbrirBorradorDeEjecucionRequestSchema = z.strictObject({});

/**
 * Un ejercicio tal como quedó registrado. Se muestran las dos puntas de una sustitución y su referencia
 * (REG-06-130): «Prescripto: Press banca / Realizado: Press con mancuernas» (B10-06:772-778).
 */
export const EjercicioRegistradoSchema = z.strictObject({
  prescriptionId: IdDeNodoSchema,
  prescribedExerciseVersionId: IdOpaco,
  prescribedExerciseName: z.string(),
  performedExerciseVersionId: IdOpaco,
  performedExerciseName: z.string(),
  substituted: z.boolean(),
  /** Presente solo en `SET`. Nunca se sintetizan desde un resumen. */
  sets: z.array(SerieEjecutadaSchema).nullable(),
  /** Presente solo en `EXERCISE_OR_SESSION`. */
  executionSummary: ResumenDeEjercicioSchema.nullable(),
});
export type EjercicioRegistrado = z.infer<typeof EjercicioRegistradoSchema>;

export const BorradorDeEjecucionSchema = z.strictObject({
  draftId: IdOpaco,
  version: TokenDeVersionSchema,
  /** `REGISTERED` cuando ya se confirmó: el borrador queda congelado y apunta a su ejecución (06:5221). */
  state: z.enum(['DRAFT', 'REGISTERED']),
  occurrenceId: IdOpaco,
  date: FechaLocalSchema,
  timeZone: ZonaHorariaSchema,
  planId: IdOpaco,
  sessionId: IdDeNodoSchema,
  granularity: GranularidadApiSchema.nullable(),
  sessionCondition: CondicionDeSesionApiSchema.nullable(),
  reason: z.string().nullable(),
  exercises: z.array(EjercicioRegistradoSchema),
  sessionSummary: ResumenDeSesionSchema.nullable(),
  occurredAt: Instante.nullable(),
  executionId: IdOpaco.nullable(),
  createdAt: Instante,
  updatedAt: Instante,
});
export type BorradorDeEjecucion = z.infer<typeof BorradorDeEjecucionSchema>;
export const BorradorDeEjecucionResponseSchema = z.strictObject({ data: BorradorDeEjecucionSchema });

/** 09v10:1173-1182. */
export const ConfirmacionDeEjecucionResponseSchema = z.strictObject({
  data: z.strictObject({ executionId: IdOpaco, state: z.literal('REGISTERED'), occurredAt: Instante, recordedAt: Instante }),
});

/** Un registro completo de ejecución: el original, o el contenido de una corrección. */
export const RegistroDeEjecucionSchema = z.strictObject({
  /** `null` si y solo si la sesión se registró `NOT_COMPLETED`: sin entrenamiento no se usó granularidad. */
  granularity: GranularidadApiSchema.nullable(),
  sessionCondition: CondicionDeSesionApiSchema,
  reason: z.string().nullable(),
  exercises: z.array(EjercicioRegistradoSchema),
  sessionSummary: ResumenDeSesionSchema.nullable(),
});
export type RegistroDeEjecucion = z.infer<typeof RegistroDeEjecucionSchema>;

export const CorreccionDeEjecucionSchema = z.strictObject({
  correctionId: IdOpaco,
  previousCorrectionId: IdOpaco.nullable(),
  reason: z.string(),
  /** El registro corregido completo. El original no se toca (INV-06-124). */
  correction: RegistroDeEjecucionSchema,
  /** La autoría real: si corrige el profesional, el dato no se atribuye al asesorado (05:9209-9224; DL-076). */
  author: ResumenDeActorSchema,
  authorRole: z.enum(['ADVISEE', 'PROFESSIONAL']),
  recordedAt: Instante,
});
export type CorreccionDeEjecucion = z.infer<typeof CorreccionDeEjecucionSchema>;

/** Vista efectiva por relación (REG-06-16): la corrección terminal, el original, o `NOT_RESOLVABLE` (09v10:1253). */
export const VistaEfectivaDeEjecucionSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('ORIGINAL') }),
  z.strictObject({ kind: z.literal('CORRECTED'), correctionId: IdOpaco }),
  z.strictObject({ kind: z.literal('NOT_RESOLVABLE') }),
]);

/** API-TRN-19 (09v10:1203-1217). */
export const EjecucionDeEntrenamientoSchema = z.strictObject({
  executionId: IdOpaco,
  state: z.literal('REGISTERED'),
  adviseeId: IdOpaco,
  planId: IdOpaco,
  /** La instantánea contra la que se registró (REG-06-105). */
  snapshotDigest: z.string().regex(/^[0-9a-f]{64}$/),
  occurrenceId: IdOpaco,
  date: FechaLocalSchema,
  timeZone: ZonaHorariaSchema,
  plannedSession: SesionDeOcurrenciaSchema,
  original: RegistroDeEjecucionSchema,
  corrections: z.array(CorreccionDeEjecucionSchema),
  effectiveView: VistaEfectivaDeEjecucionSchema,
  occurredAt: Instante,
  recordedAt: Instante,
});
export type EjecucionDeEntrenamiento = z.infer<typeof EjecucionDeEntrenamientoSchema>;
export const EjecucionDeEntrenamientoResponseSchema = z.strictObject({ data: EjecucionDeEntrenamientoSchema });

/**
 * API-TRN-19-LISTA (DL-096, opción A): «Tu historial» del titular — sus sesiones registradas por período. No la
 * declara el 09; es la lista que TRN-19 no da (lee de a una) y que la lectura por período del plan vigente (TRN-14)
 * tampoco, porque opera sobre el plan activo. Exige solo el A3 vigente: no depende de un plan activo ni del acceso del
 * profesional (08:199, 08:58, 08:406; DL-089). Cada ejecución trae su original y sus correcciones, sin ocultarlos.
 */
export const HistorialDeEntrenamientoResponseSchema = z.strictObject({
  data: z.strictObject({
    period: PeriodoSchema,
    executions: z.array(EjecucionDeEntrenamientoSchema),
  }),
});
export type HistorialDeEntrenamientoResponse = z.infer<typeof HistorialDeEntrenamientoResponseSchema>;

/** La entrada de un registro corregido: la misma forma que el borrador, completa. */
export const RegistroDeEjecucionEntradaSchema = z.strictObject({
  granularity: z.string().max(40).nullable(),
  sessionCondition: z.string().max(40),
  reason: TextoOpcional(1000),
  exercises: z.array(EjercicioRegistradoEntradaSchema).max(40),
  sessionSummary: ResumenDeSesionSchema.nullable(),
});
/** API-TRN-20 (09v10:1240-1245). El motivo es obligatorio: «Requiere: motivo, cambio» (B10-06:879-884). */
export const CorregirEjecucionRequestSchema = z.strictObject({ reason: Texto(1000), correction: RegistroDeEjecucionEntradaSchema });
export type CorregirEjecucionRequest = z.infer<typeof CorregirEjecucionRequestSchema>;

// ─── Revisión (API-TRN-21 a 24) ─────────────────────────────────────────────────────────────────
export const ProximaAccionDeEntrenamientoSchema = z.strictObject({
  description: Texto(2000),
  /** Obligatoria en RESCHEDULE_REVIEW (REG-06-145). */
  nextReviewAt: FechaLocalSchema.nullable().optional(),
  /** CHANGE_OBJECTIVE: el objetivo nuevo, que se emite al aplicar (DL-052, por homología). */
  objective: ContenidoDeObjetivoDeEntrenamientoSchema.optional(),
});

/** 09v10:1312-1324. `result` es texto: un séptimo resultado (`PROGRESS`) es REVIEW_RESULT_INVALID, no 400. */
export const RegistrarRevisionDeEntrenamientoRequestSchema = z.strictObject({
  period: PeriodoSchema,
  evidenceReferences: z.array(ReferenciaDeEvidenciaSchema).max(200),
  interpretation: z.string().max(4000),
  result: z.string().max(40),
  rationale: z.string().max(4000),
  nextAction: ProximaAccionDeEntrenamientoSchema,
});
export type RegistrarRevisionDeEntrenamientoRequest = z.infer<typeof RegistrarRevisionDeEntrenamientoRequestSchema>;

export const RevisionDeEntrenamientoSchema = z.strictObject({
  reviewId: IdOpaco,
  version: TokenDeVersionSchema,
  adviseeId: IdOpaco,
  processId: IdOpaco,
  period: PeriodoSchema,
  evidenceReferences: z.array(ReferenciaDeEvidenciaSchema),
  interpretation: z.string(),
  result: ResultadoDeRevisionApiSchema,
  rationale: z.string(),
  nextAction: ProximaAccionDeEntrenamientoSchema,
  author: ResumenDeActorSchema,
  recordedAt: Instante,
  application: AplicacionDeRevisionSchema.nullable(),
});
export type RevisionDeEntrenamiento = z.infer<typeof RevisionDeEntrenamientoSchema>;
export const RevisionDeEntrenamientoResponseSchema = z.strictObject({ data: RevisionDeEntrenamientoSchema });
/** REV-A: las revisiones de entrenamiento propias, completas (API-TRN-23-LISTA y API-TRN-23-PROPIA). */
export const ListaDeRevisionesDeEntrenamientoPropiasResponseSchema = z.strictObject({ data: z.array(RevisionDeEntrenamientoSchema), page: PaginaSchema });
export type ListaDeRevisionesDeEntrenamientoPropiasResponse = z.infer<typeof ListaDeRevisionesDeEntrenamientoPropiasResponseSchema>;

/**
 * API-TRN-21 (09v10:1269-1293). Read model: no persiste nada, y no define ni calcula volumen, marcas, mapa muscular
 * ni puntaje (09v10:1285-1295). `missingData` son los días del período sin ningún registro: sin dato, nunca «no
 * realizado».
 */
export const ContextoDeRevisionDeEntrenamientoResponseSchema = z.strictObject({
  data: z.strictObject({
    period: PeriodoSchema,
    objective: VersionDeObjetivoDeEntrenamientoSchema.nullable(),
    activePlanVersions: z.array(ResumenDeVersionDePlanDeEntrenamientoSchema),
    registeredExecutions: z.array(EjecucionDeEntrenamientoSchema),
    /** Las correcciones registradas dentro del período, con su ejecución. */
    corrections: z.array(CorreccionDeEjecucionSchema.extend({ executionId: IdOpaco })),
    missingData: z.array(FechaLocalSchema),
    previousReviews: z.array(RevisionDeEntrenamientoSchema),
    process: z.strictObject({ processId: IdOpaco, state: z.enum(['ABIERTO', 'CERRADO']) }).nullable(),
    /** REG-06-150 (DL-054). */
    pendingReview: z.strictObject({ pending: z.boolean(), since: z.string().nullable() }),
  }),
});
export type ContextoDeRevisionDeEntrenamientoResponse = z.infer<typeof ContextoDeRevisionDeEntrenamientoResponseSchema>;
