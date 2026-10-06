/**
 * Contratos de WP-ENTRENAMIENTO-SERIES (encargo de Dirección del 2026-10-06; DL-122, DL-123 y DL-124). Son operaciones
 * nuevas: ninguna respuesta que lee la APK 0.13.2 cambia de forma. Sus formas están congeladas en
 * `fixtures/respuestas-que-lee-la-apk-instalada.json` y se prueban en `entrenamiento-por-serie.test.ts`.
 *
 * - **Objetivos por serie (DL-122).** El RIR objetivo, la carga sugerida y el descanso recomendado de cada serie, con
 *   herencia desde la prescripción. Se escriben con API-TRN-07 y 10, que solo usa la web. Se leen con dos lecturas
 *   nuevas:
 *   - API-SER-01, del profesional;
 *   - API-SER-02, la sesión para registrar, del titular.
 *   Las dos resuelven el objetivo efectivo con `objetivosEfectivos`, la misma función que usa la vista previa del
 *   editor.
 * - **Imagen de ejercicio (DL-123).** Un medio propio de finalidad `EXERCISE_REFERENCE`, asociado a un ejercicio propio
 *   y a su versión, con licencia, autoría, procedencia y estado de revisión técnica. Nunca por coincidencia de nombre.
 *   La historia de asociaciones es de solo agregar.
 * - **Tiempos de la sesión (DL-124).** Eventos idempotentes con identificador de cliente, secuencia causal y los dos
 *   relojes, colgados del borrador de ejecución. La API calcula los tiempos con su calidad, con la misma lógica que
 *   la APK (`sesion-de-entrenamiento.ts`).
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import {
  BaseDeCargaSchema,
  BaseDeRepeticionesSchema,
  CargaSchema,
  IdDeNodoSchema,
  IntensidadSchema,
  ParametroProfesionalSchema,
  RepeticionesPrescriptasSchema,
  VersionDePlanDeEntrenamientoSchema,
} from './contratos-entrenamiento';
import { ProcedenciaDeMedioSchema } from './contratos-medios';
import { FechaLocalSchema, ZonaHorariaSchema } from './contratos-nutricion';

const Texto = (max: number) => z.string().trim().min(1).max(max);

/** Un identificador que genera el cliente (evento, corrida, descanso, medición). Sin separadores: es opaco. */
export const IdDeClienteSchema = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/);

// ─── Imagen de ejercicio (DL-123) ───────────────────────────────────────────────────────────────

/**
 * La licencia de la imagen, obligatoria (REG-06-134). Hay dos formas, y ninguna se completa sola:
 * - `NO_EXTERNAL_LICENSE`: contenido propio o generado para BE, sin una licencia de terceros. `usage` dice en qué
 *   términos se aporta. Es el caso de las tres imágenes generadas por IA de la demostración: no se les inventa una
 *   licencia, y menos CC0;
 * - `EXTERNAL`: una licencia de terceros, con su identificador, su nombre y, si la hay, su URL.
 */
export const LicenciaDeImagenSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('NO_EXTERNAL_LICENSE'), usage: Texto(300) }),
  z.strictObject({ kind: z.literal('EXTERNAL'), id: Texto(80), label: Texto(200), url: z.url().max(500).nullable() }),
]);
export type LicenciaDeImagen = z.infer<typeof LicenciaDeImagenSchema>;

/** La revisión técnica de la imagen. Ilustra para reconocer el ejercicio; no certifica la técnica. */
export const RevisionTecnicaSchema = z.enum(['PENDING_PROFESSIONAL_REVIEW', 'REVIEWED_BY_PROFESSIONAL']);
export type RevisionTecnica = z.infer<typeof RevisionTecnicaSchema>;

/**
 * La imagen asociada a un ejercicio. `provenance` y `authorship` son las del medio, declaradas al subirlo.
 * `imageVersion` es el número de la asociación vigente.
 */
export const ImagenDeEjercicioSchema = z.strictObject({
  mediaId: IdOpaco,
  imageVersion: z.number().int().positive(),
  /** La versión del ejercicio a la que se aplica (REG-06-134). */
  exerciseVersionId: IdOpaco,
  provenance: ProcedenciaDeMedioSchema,
  authorship: z.string(),
  license: LicenciaDeImagenSchema,
  technicalReview: RevisionTecnicaSchema,
  altText: z.string(),
  associatedAt: Instante,
});
export type ImagenDeEjercicio = z.infer<typeof ImagenDeEjercicioSchema>;

/**
 * API-EJE-02: asociar o reemplazar la imagen de un ejercicio propio. El medio tiene que ser propio, estar disponible,
 * tener finalidad `EXERCISE_REFERENCE` y declarar autoría. `expectedImageVersion` es la versión de imagen que se vio:
 * 0 si el ejercicio no tenía ninguna.
 */
export const AsociarImagenDeEjercicioRequestSchema = z.strictObject({
  exerciseVersionId: IdOpaco,
  mediaId: IdOpaco,
  expectedImageVersion: z.number().int().min(0),
  altText: Texto(300),
  license: LicenciaDeImagenSchema,
  technicalReview: RevisionTecnicaSchema,
});
export type AsociarImagenDeEjercicioRequest = z.infer<typeof AsociarImagenDeEjercicioRequestSchema>;

/** Un ejercicio propio del profesional (PROFESSIONAL_MANUAL), con su imagen vigente. */
export const EjercicioPropioSchema = z.strictObject({
  exerciseId: IdOpaco,
  versionId: IdOpaco,
  name: z.string(),
  available: z.boolean(),
  createdAt: Instante,
  /** 0 si nunca tuvo imagen. Cada asociación y cada retiro suman uno. */
  imageVersion: z.number().int().min(0),
  image: ImagenDeEjercicioSchema.nullable(),
});
export type EjercicioPropio = z.infer<typeof EjercicioPropioSchema>;
export const EjercicioPropioResponseSchema = z.strictObject({ data: EjercicioPropioSchema });
/** API-EJE-01: los ejercicios propios, del más nuevo al más viejo. Hasta 500: la lista no pagina. */
export const ListaDeEjerciciosPropiosResponseSchema = z.strictObject({ data: z.array(EjercicioPropioSchema) });

// ─── Objetivos por serie (DL-122) ───────────────────────────────────────────────────────────────

export const OrigenDelObjetivoSchema = z.enum(['SET', 'PRESCRIPTION', 'NONE']);

/** El objetivo efectivo de una serie. `null` es «sin objetivo», nunca cero. */
export const ObjetivoDeSerieSchema = z.strictObject({
  repetitions: RepeticionesPrescriptasSchema.nullable(),
  rir: z.number().finite().nullable(),
  suggestedLoad: CargaSchema.nullable(),
  restSeconds: z.number().int().min(0).nullable(),
});
export type ObjetivoDeSerie = z.infer<typeof ObjetivoDeSerieSchema>;

export const SerieConObjetivoSchema = z.strictObject({
  setIndex: z.number().int().positive(),
  note: z.string().nullable(),
  /** Lo que la serie declara, con sus tres estados: ausente hereda, `null` quita el objetivo y un valor lo sobrescribe. */
  rir: z.number().finite().nullable().optional(),
  suggestedLoad: CargaSchema.nullable().optional(),
  restSeconds: z.number().int().min(0).nullable().optional(),
  /** El objetivo efectivo, resuelto con `objetivosEfectivos`. */
  target: ObjetivoDeSerieSchema,
  /** De dónde sale cada valor del objetivo efectivo. */
  targetOrigin: z.strictObject({ rir: OrigenDelObjetivoSchema, suggestedLoad: OrigenDelObjetivoSchema, restSeconds: OrigenDelObjetivoSchema }),
});
export type SerieConObjetivo = z.infer<typeof SerieConObjetivoSchema>;

export const PrescripcionConObjetivosSchema = z.strictObject({
  prescriptionId: IdDeNodoSchema,
  order: z.number().int().positive(),
  exerciseId: IdOpaco,
  exerciseVersionId: IdOpaco,
  /** El de la instantánea si la versión está activada (REG-06-112). */
  exerciseName: z.string(),
  /** La imagen del ejercicio (DL-123). En API-SER-02 de una sesión ya registrada, la vigente cuando se registró. */
  image: ImagenDeEjercicioSchema.nullable(),
  sets: z.array(SerieConObjetivoSchema),
  intensity: IntensidadSchema.nullable(),
  suggestedLoad: CargaSchema.nullable(),
  restSeconds: z.number().int().min(0).nullable(),
  loadBasis: BaseDeCargaSchema.nullable(),
  repetitionBasis: BaseDeRepeticionesSchema.nullable(),
  professionalParameters: z.array(ParametroProfesionalSchema),
  note: z.string().nullable(),
});
export type PrescripcionConObjetivos = z.infer<typeof PrescripcionConObjetivosSchema>;

export const SesionConObjetivosSchema = z.strictObject({
  sessionId: IdDeNodoSchema,
  label: z.string(),
  order: z.number().int().positive(),
  instructions: z.string().nullable(),
  prescriptions: z.array(PrescripcionConObjetivosSchema),
});
export type SesionConObjetivos = z.infer<typeof SesionConObjetivosSchema>;
const MicrocicloConObjetivosSchema = z.strictObject({
  microcycleId: IdDeNodoSchema,
  label: z.string(),
  order: z.number().int().positive(),
  purpose: z.string().nullable(),
  sessions: z.array(SesionConObjetivosSchema),
});
const BloqueConObjetivosSchema = z.strictObject({
  blockId: IdDeNodoSchema,
  label: z.string(),
  order: z.number().int().positive(),
  purpose: z.string().nullable(),
  microcycles: z.array(MicrocicloConObjetivosSchema),
  sessions: z.array(SesionConObjetivosSchema),
});

/** API-SER-01: la versión de plan como API-TRN-09, con los objetivos por serie y las imágenes. Solo el profesional. */
export const PlanConObjetivosSchema = VersionDePlanDeEntrenamientoSchema.omit({ blocks: true }).extend({ blocks: z.array(BloqueConObjetivosSchema) });
export type PlanConObjetivos = z.infer<typeof PlanConObjetivosSchema>;
export const PlanConObjetivosResponseSchema = z.strictObject({ data: PlanConObjetivosSchema });

/** API-SER-02: la sesión de una ocurrencia, lista para registrarla serie por serie. Solo el titular. */
export const SesionParaRegistrarSchema = z.strictObject({
  occurrenceId: IdOpaco,
  date: FechaLocalSchema,
  timeZone: ZonaHorariaSchema,
  planId: IdOpaco,
  snapshotDigest: z.string().regex(/^[0-9a-f]{64}$/),
  /** A qué momento corresponden las imágenes: el registro de la ejecución si ya existe; si no, el de la lectura. */
  imagesAsOf: Instante,
  session: SesionConObjetivosSchema,
});
export type SesionParaRegistrar = z.infer<typeof SesionParaRegistrarSchema>;
export const SesionParaRegistrarResponseSchema = z.strictObject({ data: SesionParaRegistrarSchema });

// ─── Tiempos de la sesión (DL-124) ──────────────────────────────────────────────────────────────

/**
 * Cómo se tomó un instante:
 * - `MONOTONIC`: con el reloj monotónico de la app, en el proceso que dice `anchor`;
 * - `RECOVERED_WALL_CLOCK`: reconstruido con el reloj civil, sin un monotónico confiable;
 * - `DECLARED`: lo declaró la persona al resolver una medición abierta. Es una declaración, no una medición.
 */
export const OrigenDelInstanteApiSchema = z.enum(['MONOTONIC', 'RECOVERED_WALL_CLOCK', 'DECLARED']);
export const InstanteDeEventoApiSchema = z
  .strictObject({
    /** El reloj civil del teléfono. Ordena y recupera, pero no mide si hay monotónico. */
    civil: Instante,
    monotonic: z.strictObject({ anchor: IdDeClienteSchema, ms: z.number().finite().min(0) }).nullable(),
    source: OrigenDelInstanteApiSchema,
  })
  .refine((i) => (i.source === 'MONOTONIC') === (i.monotonic !== null), {
    message: 'Un instante monotónico lleva su reloj y su ancla; uno civil o declarado, no',
    path: ['monotonic'],
  });
export type InstanteDeEventoApi = z.infer<typeof InstanteDeEventoApiSchema>;

const BaseDeEvento = {
  /** El identificador del evento: repetirlo con el mismo contenido no suma nada; con otro, es un conflicto. */
  eventId: IdDeClienteSchema,
  /** La corrida: la identidad de esta sesión en curso, que fija SESSION_STARTED. */
  runId: IdDeClienteSchema,
  /** El orden causal dentro de la corrida: 1, 2, 3… sin huecos. */
  sequence: z.number().int().min(1).max(100_000),
  at: InstanteDeEventoApiSchema,
  /** Agrupa los eventos de una sola acción (por ejemplo, finalizar el descanso e iniciar la serie). */
  compoundActionId: IdDeClienteSchema.nullable(),
};
const IndiceDeSerie = z.number().int().min(1).max(50);

/** Las acciones explícitas que marcan tiempos. Abrir la técnica de un ejercicio no es ninguna de ellas. */
export const EventoDeTiempoSchema = z.discriminatedUnion('type', [
  z.strictObject({ ...BaseDeEvento, type: z.literal('SESSION_STARTED') }),
  z.strictObject({ ...BaseDeEvento, type: z.literal('SESSION_PAUSED') }),
  z.strictObject({ ...BaseDeEvento, type: z.literal('SESSION_RESUMED') }),
  /** `FINISHED`: terminó en ese instante. `LEFT_INCOMPLETE`: se cierra sin afirmar cuándo terminó (una sesión abandonada). */
  z.strictObject({ ...BaseDeEvento, type: z.literal('SESSION_FINISHED'), resolution: z.enum(['FINISHED', 'LEFT_INCOMPLETE']) }),
  z.strictObject({ ...BaseDeEvento, type: z.literal('EXERCISE_ACTIVATED'), prescriptionId: IdDeNodoSchema }),
  /** El descanso queda ligado a la serie que lo originó, aunque después se enfoque otra fila. */
  z.strictObject({ ...BaseDeEvento, type: z.literal('REST_STARTED'), restId: IdDeClienteSchema, prescriptionId: IdDeNodoSchema, setIndex: IndiceDeSerie }),
  z.strictObject({ ...BaseDeEvento, type: z.literal('REST_FINISHED'), restId: IdDeClienteSchema }),
  z.strictObject({ ...BaseDeEvento, type: z.literal('SET_TIMING_STARTED'), timingId: IdDeClienteSchema, prescriptionId: IdDeNodoSchema, setIndex: IndiceDeSerie }),
  z.strictObject({ ...BaseDeEvento, type: z.literal('SET_TIMING_FINISHED'), timingId: IdDeClienteSchema }),
  /** Una medición abierta que la persona decide dejar sin fin: queda incompleta, no se cierra a la hora de reabrir. */
  z.strictObject({ ...BaseDeEvento, type: z.literal('MEASUREMENT_LEFT_INCOMPLETE'), measurementId: IdDeClienteSchema }),
]);
export type EventoDeTiempo = z.infer<typeof EventoDeTiempoSchema>;
export type TipoDeEventoDeTiempo = EventoDeTiempo['type'];

/** API-TIE-01. Hasta 30 eventos por pedido, en orden de secuencia (el cuerpo de la API tiene un tope de 16 kB). */
export const RegistrarEventosDeTiempoRequestSchema = z.strictObject({ events: z.array(EventoDeTiempoSchema).min(1).max(30) });
export type RegistrarEventosDeTiempoRequest = z.infer<typeof RegistrarEventosDeTiempoRequestSchema>;

/**
 * Por qué un evento no se registró:
 * - **conflictos:** `EVENT_ID_REUSED` (el mismo identificador con otro contenido) y `SEQUENCE_REUSED` (otro evento
 *   ya ocupa ese lugar);
 * - **rechazos:** el resto. Desde el primer evento no registrado, los siguientes del mismo pedido no se procesan
 *   (`PREVIOUS_EVENT_NOT_RECORDED`): dependen de él.
 */
export const MotivoDeEventoSchema = z.enum([
  'EVENT_ID_REUSED',
  'SEQUENCE_REUSED',
  'SEQUENCE_GAP',
  'PREVIOUS_EVENT_NOT_RECORDED',
  'SESSION_NOT_STARTED',
  'SESSION_ALREADY_STARTED',
  'ANOTHER_SESSION_IN_PROGRESS',
  'RUN_MISMATCH',
  'SESSION_FINISHED',
  'SESSION_PAUSED',
  'SESSION_NOT_PAUSED',
  'MEASUREMENT_OPEN',
  'MEASUREMENT_NOT_OPEN',
  'MEASUREMENT_ID_REUSED',
  'EXERCISE_ALREADY_ACTIVE',
  'PRESCRIPTION_NOT_IN_SESSION',
]);
export type MotivoDeEvento = z.infer<typeof MotivoDeEventoSchema>;
export const EstadoDeEventoSchema = z.enum(['RECORDED', 'DUPLICATE', 'CONFLICT', 'REJECTED']);
export const ResultadoDeEventoSchema = z.strictObject({ eventId: IdDeClienteSchema, status: EstadoDeEventoSchema, reason: MotivoDeEventoSchema.nullable() });
export type ResultadoDeEvento = z.infer<typeof ResultadoDeEventoSchema>;

/** La calidad de un tiempo: medido, estimado, incompleto, sin dato o inválido. Nunca se muestra uno como otro. */
export const CalidadDeTiempoApiSchema = z.enum(['MEASURED', 'ESTIMATED', 'INCOMPLETE', 'NO_DATA', 'INVALID']);
export type CalidadDeTiempoApi = z.infer<typeof CalidadDeTiempoApiSchema>;
/** Una duración en milisegundos (`null` si no se puede afirmar) y su calidad. Se redondea solo al mostrar. */
export const DuracionApiSchema = z.strictObject({ ms: z.number().int().min(0).nullable(), quality: CalidadDeTiempoApiSchema });
export type DuracionApi = z.infer<typeof DuracionApiSchema>;

export const EstadoDeTiemposSchema = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'PAUSED', 'FINISHED', 'LEFT_INCOMPLETE']);
export type EstadoDeTiempos = z.infer<typeof EstadoDeTiemposSchema>;

export const MedicionAbiertaSchema = z.strictObject({
  kind: z.enum(['REST', 'SET']),
  measurementId: IdDeClienteSchema,
  prescriptionId: IdDeNodoSchema,
  setIndex: IndiceDeSerie,
  startedAt: Instante,
});

export const DescansoRegistradoSchema = z.strictObject({
  restId: IdDeClienteSchema,
  prescriptionId: IdDeNodoSchema,
  setIndex: IndiceDeSerie,
  startedAt: Instante,
  finishedAt: Instante.nullable(),
  duration: DuracionApiSchema,
  /** El descanso recomendado histórico de esa serie, de la instantánea del plan. */
  recommendedSeconds: z.number().int().min(0).nullable(),
  /** Lo registrado menos lo recomendado, sin juicio. `null` sin recomendado o sin duración. */
  differenceMs: z.number().int().nullable(),
});
export type DescansoRegistrado = z.infer<typeof DescansoRegistradoSchema>;

export const SerieCronometradaSchema = z.strictObject({
  timingId: IdDeClienteSchema,
  prescriptionId: IdDeNodoSchema,
  setIndex: IndiceDeSerie,
  startedAt: Instante,
  finishedAt: Instante.nullable(),
  duration: DuracionApiSchema,
});
export type SerieCronometrada = z.infer<typeof SerieCronometradaSchema>;

/** Lo que se calcula de los eventos. Lo arma `calcularTiempos`, igual en la API y en la APK. */
export const CalculoDeTiemposSchema = z.strictObject({
  state: EstadoDeTiemposSchema,
  runId: IdDeClienteSchema.nullable(),
  /** La última secuencia registrada: el próximo evento lleva la siguiente. */
  lastSequence: z.number().int().min(0),
  startedAt: Instante.nullable(),
  finishedAt: Instante.nullable(),
  activePrescriptionId: IdDeNodoSchema.nullable(),
  openMeasurement: MedicionAbiertaSchema.nullable(),
  /** El total va del inicio al fin; «sin pausas» descuenta las pausas declaradas. No son minutos de esfuerzo. */
  session: z.strictObject({ elapsed: DuracionApiSchema, pauses: DuracionApiSchema, withoutPauses: DuracionApiSchema }),
  /** El tiempo asociado a cada ejercicio, con sus descansos y su carga de datos. No es tiempo bajo tensión. */
  exercises: z.array(z.strictObject({ prescriptionId: IdDeNodoSchema, duration: DuracionApiSchema })),
  unassigned: DuracionApiSchema,
  rests: z.array(DescansoRegistradoSchema),
  timedSets: z.array(SerieCronometradaSchema),
});
export type CalculoDeTiempos = z.infer<typeof CalculoDeTiemposSchema>;

export const EventoDeTiempoRegistradoSchema = z.strictObject({ event: EventoDeTiempoSchema, receivedAt: Instante });
export type EventoDeTiempoRegistrado = z.infer<typeof EventoDeTiempoRegistradoSchema>;

/** API-TIE-02 y 03: los tiempos de un borrador o de una ejecución, con los eventos que los sostienen. */
export const TiemposDeSesionSchema = CalculoDeTiemposSchema.extend({
  draftId: IdOpaco,
  occurrenceId: IdOpaco,
  executionId: IdOpaco.nullable(),
  events: z.array(EventoDeTiempoRegistradoSchema),
});
export type TiemposDeSesion = z.infer<typeof TiemposDeSesionSchema>;
export const TiemposDeSesionResponseSchema = z.strictObject({ data: TiemposDeSesionSchema });
export const ResultadoDeEventosResponseSchema = z.strictObject({ data: z.strictObject({ results: z.array(ResultadoDeEventoSchema), timing: TiemposDeSesionSchema }) });

/** API-TIE-04: la sesión en curso del titular, si hay una (en cualquier dispositivo y de cualquier día). */
export const SesionEnCursoSchema = z.strictObject({
  draftId: IdOpaco,
  occurrenceId: IdOpaco,
  date: FechaLocalSchema,
  sessionId: IdDeNodoSchema,
  sessionLabel: z.string(),
  runId: IdDeClienteSchema,
  state: z.enum(['IN_PROGRESS', 'PAUSED']),
  startedAt: Instante,
  lastSequence: z.number().int().min(1),
});
export type SesionEnCurso = z.infer<typeof SesionEnCursoSchema>;
export const SesionEnCursoResponseSchema = z.strictObject({ data: z.strictObject({ inProgress: SesionEnCursoSchema.nullable() }) });
