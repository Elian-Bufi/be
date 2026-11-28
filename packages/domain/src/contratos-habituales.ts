/**
 * API-HAB-01 a API-HAB-05 y API-HAN-01 a API-HAN-05 — «Mis habituales» del profesional (PF-09 bis; DL-109, decidido el
 * 2026-09-30). Dos cosas, en cada área:
 * - **elementos habituales**: los ejercicios (o alimentos) del catálogo que el profesional marca para tenerlos a mano
 *   arriba del buscador; una marca por profesional y elemento, sin nada más;
 * - **bloques habituales**: una sesión (o una comida) guardada con nombre para insertarla en cualquier borrador. Es
 *   una herramienta de trabajo, no un molde versionado: guardar otra con el mismo nombre la **reemplaza** (D-2), y
 *   ningún plan depende de ella (lo insertado ya es del plan). Se guarda **sin identificadores de nodo** (el servidor
 *   los asigna al guardar el borrador, así se puede insertar dos veces) y **sin cargas ni cantidades** salvo pedido.
 * Solo el profesional que lo creó lo ve (DL-108 D-1): lo ajeno es 404 neutral.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import {
  AproximacionesDelEjercicioSchema,
  BaseDeCargaSchema,
  BaseDeRepeticionesSchema,
  BloqueDeLaSesionEntradaSchema,
  DescansoRecomendadoSchema,
  DiaDeLaSemanaSchema,
  EjercicioDeCatalogoSchema,
  IdDeNodoSchema,
  IntensidadEntradaSchema,
  ParametroProfesionalSchema,
  PrescripcionEntradaSchema,
  ProgresionDeLaFaseSchema,
  SeriePrescriptaEntradaSchema,
  SesionEntradaSchema,
} from './contratos-entrenamiento';
import { ComidaEntradaSchema, ElementoDeCatalogoSchema } from './contratos-nutricion';
import { PaginaSchema, TokenDeVersionSchema } from './contratos-vinculo';

const Texto = (max: number) => z.string().trim().min(1).max(max);

// ─── Elementos habituales ───────────────────────────────────────────────────────────────────────────────────────────

export const EstadoDeMarcaSchema = z.enum(['MARKED', 'REMOVED']);
export type EstadoDeMarca = z.infer<typeof EstadoDeMarcaSchema>;

/** API-HAB-02 / API-HAN-02: marcar o quitar es la misma operación, naturalmente idempotente. */
export const MarcarHabitualRequestSchema = z.strictObject({ state: EstadoDeMarcaSchema });
export type MarcarHabitualRequest = z.infer<typeof MarcarHabitualRequestSchema>;

/** API-HAB-01: los ejercicios habituales, con la misma forma que devuelve el buscador del catálogo. */
export const ListaDeEjerciciosHabitualesResponseSchema = z.strictObject({ data: z.array(EjercicioDeCatalogoSchema) });
export const MarcaDeEjercicioResponseSchema = z.strictObject({ data: z.strictObject({ exerciseId: IdOpaco, state: EstadoDeMarcaSchema }) });

/** API-HAN-01: los alimentos habituales, con la misma forma que devuelve el buscador del catálogo. */
export const ListaDeAlimentosHabitualesResponseSchema = z.strictObject({ data: z.array(ElementoDeCatalogoSchema) });
export const MarcaDeAlimentoResponseSchema = z.strictObject({ data: z.strictObject({ catalogItemId: IdOpaco, state: EstadoDeMarcaSchema }) });

// ─── Sesiones habituales (entrenamiento) ────────────────────────────────────────────────────────────────────────────

export const GuardarSesionHabitualRequestSchema = z.strictObject({
  name: Texto(120),
  /** La sesión tal como está en el editor; los identificadores de nodo, si vienen, se descartan. */
  structure: SesionEntradaSchema,
  /** DL-108 D-2: las cargas sugeridas no se copian por defecto. */
  copySuggestedLoads: z.boolean().optional(),
  /** D-2 de habituales: reemplazar esta sesión habitual propia (nombre, estructura y cargas). */
  replaces: IdOpaco.optional(),
});
export type GuardarSesionHabitualRequest = z.infer<typeof GuardarSesionHabitualRequestSchema>;

export const EstadoDeHabitualEditableSchema = z.enum(['REMOVED']);

/** Renombrar o quitar; no cambia la estructura (para eso se vuelve a guardar desde el editor). */
export const EditarHabitualRequestSchema = z
  .strictObject({
    expectedVersion: TokenDeVersionSchema,
    name: Texto(120).optional(),
    state: EstadoDeHabitualEditableSchema.optional(),
  })
  .refine((p) => p.name !== undefined || p.state !== undefined, { message: 'Nada que cambiar', path: ['name'] });
export type EditarHabitualRequest = z.infer<typeof EditarHabitualRequestSchema>;

/** Cómo se llama hoy cada ejercicio que la sesión referencia, y si sigue disponible para este profesional. */
export const EjercicioDeHabitualSchema = z.strictObject({ exerciseId: IdOpaco, exerciseName: z.string(), available: z.boolean() });

export const SesionHabitualSchema = z.strictObject({
  presetId: IdOpaco,
  /** Token de concurrencia (cambia al renombrar, quitar o reemplazar). */
  version: TokenDeVersionSchema,
  name: z.string(),
  copiedLoads: z.boolean(),
  prescriptionCount: z.number().int().nonnegative(),
  /** La sesión tal como se guardó: sin identificadores de nodo; lista para insertar en un borrador. */
  structure: SesionEntradaSchema,
  /** Por `exerciseVersionId`. Uno que ya no exista no figura. */
  exercises: z.record(IdOpaco, EjercicioDeHabitualSchema),
  createdAt: Instante,
  updatedAt: Instante,
});
export type SesionHabitual = z.infer<typeof SesionHabitualSchema>;
export const SesionHabitualResponseSchema = z.strictObject({ data: SesionHabitualSchema });
export const ListaDeSesionesHabitualesResponseSchema = z.strictObject({ data: z.array(SesionHabitualSchema), page: PaginaSchema });

// ─── Comidas habituales (nutrición) ─────────────────────────────────────────────────────────────────────────────────

export const GuardarComidaHabitualRequestSchema = z.strictObject({
  name: Texto(120),
  /** La comida tal como está en el editor; los identificadores de nodo, si vienen, se descartan. */
  structure: ComidaEntradaSchema,
  /** DL-108 D-2 en nutrición: las cantidades no se copian por defecto (son de cada persona). */
  copyQuantities: z.boolean().optional(),
  replaces: IdOpaco.optional(),
});
export type GuardarComidaHabitualRequest = z.infer<typeof GuardarComidaHabitualRequestSchema>;

/** Por `catalogItemId`: el nombre vigente del elemento y si sigue disponible para este profesional. */
export const ElementoDeHabitualSchema = z.strictObject({ name: z.string(), available: z.boolean() });

export const ComidaHabitualSchema = z.strictObject({
  presetId: IdOpaco,
  version: TokenDeVersionSchema,
  name: z.string(),
  copiedQuantities: z.boolean(),
  itemCount: z.number().int().nonnegative(),
  structure: ComidaEntradaSchema,
  items: z.record(IdOpaco, ElementoDeHabitualSchema),
  createdAt: Instante,
  updatedAt: Instante,
});
export type ComidaHabitual = z.infer<typeof ComidaHabitualSchema>;
export const ComidaHabitualResponseSchema = z.strictObject({ data: ComidaHabitualSchema });
export const ListaDeComidasHabitualesResponseSchema = z.strictObject({ data: z.array(ComidaHabitualSchema), page: PaginaSchema });

// ─── Prescripciones y repartos habituales (ED-13 de WP-EDITORES-PROFESIONAL; DL-167) ───────────────────────────────
/**
 * Una prescripción habitual («Mi fuerza 5×3 · RIR 1»): lo de una prescripción menos el ejercicio, la nota y las cargas.
 * Las series no admiten `suggestedLoad` (el esquema es estricto: es un 400): la carga es de cada persona y de cada
 * ejercicio (ED-D2, A05). Se valida como una prescripción de un plan: el criterio de intensidad, el RIR y los objetivos
 * por serie (DL-122).
 */
export const PrescripcionHabitualContenidoSchema = z.strictObject({
  sets: z.array(SeriePrescriptaEntradaSchema.omit({ suggestedLoad: true })).min(1).max(20),
  intensity: IntensidadEntradaSchema.nullable(),
  restSeconds: DescansoRecomendadoSchema.nullable().optional(),
  loadBasis: BaseDeCargaSchema.nullable().optional(),
  repetitionBasis: BaseDeRepeticionesSchema.nullable().optional(),
  professionalParameters: z.array(ParametroProfesionalSchema).max(12).optional(),
});
export type PrescripcionHabitualContenido = z.infer<typeof PrescripcionHabitualContenidoSchema>;

// ─── DL-203 (WP-PRESETS-POR-NIVEL) · los presets de sesión y de fase del profesional ──────────────────────────────
/**
 * Los presets propios en tres niveles, con el mismo mecanismo de API-HAB-06 a 08 (PN-D07): `SERIES` (la prescripción
 * habitual de siempre), `SESION` y `FASE`. El tipo viaja en el contenido guardado (la columna JSON de siempre: sin
 * migración, PN-D08); lo guardado antes, sin tipo, es `SERIES`. Lo que guardan:
 * - **los ejercicios sí,** porque los eligió el profesional;
 * - **nunca cargas absolutas** (el esquema es estricto: una carga es un 400): son de cada persona. Con el criterio
 *   PERCENT_RM se guarda el porcentaje y la carga se recalcula con el 1RM de quien lo recibe;
 * - **nunca las notas del ejercicio ni de sus series,** ni las anotaciones privadas de la fase, ni la referencia del
 *   criterio PERCENT_RM: pueden nombrar a la persona. Los nombres, el objetivo de la fase y las indicaciones de la sesión sí se guardan (son
 *   parte del armado), y el website los muestra antes de guardar para revisarlos;
 * - **los identificadores son claves locales** del preset (`IdDeNodoSchema`): al aplicarlo, el editor los cambia por
 *   nuevos, y con ellos los días, las aproximaciones y la progresión que los citan.
 * Los topes son los del plan (40 ejercicios por sesión, 20 series, 30 sesiones por fase, 400 aproximaciones).
 */
export const TipoDePresetPropioSchema = z.enum(['SERIES', 'SESION', 'FASE']);
export type TipoDePresetPropio = z.infer<typeof TipoDePresetPropioSchema>;

/** Una serie del preset: sin carga ni nota. */
const SerieDelPresetSchema = SeriePrescriptaEntradaSchema.omit({ suggestedLoad: true, note: true });
/** Un ejercicio del preset: el del catálogo, sus series y lo general, sin carga, sin nota y con su clave local. */
export const EjercicioDelPresetSchema = PrescripcionEntradaSchema.omit({ suggestedLoad: true, note: true }).extend({
  prescriptionId: IdDeNodoSchema,
  sets: z.array(SerieDelPresetSchema).max(20),
});
export type EjercicioDelPreset = z.infer<typeof EjercicioDelPresetSchema>;
/** Una sesión del preset, con su clave local (para sus días, en un preset de fase). */
export const SesionDelPresetSchema = z.strictObject({
  sessionId: IdDeNodoSchema,
  label: Texto(120),
  instructions: z.string().trim().max(2000).nullable().optional(),
  prescriptions: z.array(EjercicioDelPresetSchema).max(40),
  exerciseGroups: z.array(BloqueDeLaSesionEntradaSchema).max(20).optional(),
});
export type SesionDelPreset = z.infer<typeof SesionDelPresetSchema>;

/** «Preset de sesión»: la sesión entera, con sus ejercicios, sus series y sus aproximaciones. */
export const PresetDeSesionContenidoSchema = z.strictObject({
  session: SesionDelPresetSchema,
  warmUps: z.array(AproximacionesDelEjercicioSchema).max(40).optional(),
});
export type PresetDeSesionContenido = z.infer<typeof PresetDeSesionContenidoSchema>;

/** «Preset de fase»: la fase entera, con sus semanas, sus sesiones y sus días, su progresión y las aproximaciones. */
export const PresetDeFaseContenidoSchema = z.strictObject({
  label: Texto(120),
  purpose: z.string().trim().max(1000).nullable().optional(),
  weeks: z.number().int().min(1).max(52).nullable(),
  sessions: z.array(SesionDelPresetSchema).max(30),
  /** Los días de la semana de cada sesión (la semana tipo), por la clave local de la sesión. */
  days: z.array(z.strictObject({ sessionId: IdDeNodoSchema, weekdays: z.array(DiaDeLaSemanaSchema).min(1).max(7) })).max(30).optional(),
  /** La progresión de la fase (EE-D30), sin su bloque; `prescriptionIds` cita claves locales (la progresión por ejercicio). */
  progression: ProgresionDeLaFaseSchema.omit({ blockId: true }).nullable().optional(),
  warmUps: z.array(AproximacionesDelEjercicioSchema).max(400).optional(),
});
export type PresetDeFaseContenido = z.infer<typeof PresetDeFaseContenidoSchema>;

const Reemplazo = { replaces: IdOpaco.optional(), expectedVersion: TokenDeVersionSchema.optional() };

/**
 * API-HAB-07: guardar o reemplazar por nombre. Un nombre en uso por otra activa sin `replaces` que la señale es 409
 * PRESET_NAME_TAKEN, como las sesiones habituales; con `replaces` (propia y activa), la reemplaza si su versión es
 * `expectedVersion`. DL-203: `kind` dice el nivel; sin `kind`, `SERIES`, como hasta ahora. El nombre es único entre todos
 * los presets propios de entrenamiento, de cualquier nivel (PN-D09).
 */
export const GuardarPrescripcionHabitualRequestSchema = z
  .union([
    z.strictObject({ name: Texto(120), kind: z.literal('SERIES').optional(), prescription: PrescripcionHabitualContenidoSchema, ...Reemplazo }),
    z.strictObject({ name: Texto(120), kind: z.literal('SESION'), session: PresetDeSesionContenidoSchema, ...Reemplazo }),
    z.strictObject({ name: Texto(120), kind: z.literal('FASE'), phase: PresetDeFaseContenidoSchema, ...Reemplazo }),
  ])
  .refine((p) => (p.replaces === undefined) === (p.expectedVersion === undefined), { message: 'Reemplazar pide la versión esperada', path: ['expectedVersion'] });
export type GuardarPrescripcionHabitualRequest = z.infer<typeof GuardarPrescripcionHabitualRequestSchema>;

const DelPreset = { presetId: IdOpaco, version: TokenDeVersionSchema, name: z.string(), createdAt: Instante, updatedAt: Instante };

export const PrescripcionHabitualSchema = z.strictObject({ ...DelPreset, kind: z.literal('SERIES'), prescription: PrescripcionHabitualContenidoSchema });
export type PrescripcionHabitual = z.infer<typeof PrescripcionHabitualSchema>;
/** DL-203: un preset de sesión, con el nombre vigente de cada ejercicio (por `exerciseVersionId`), como las sesiones habituales. */
export const PresetDeSesionPropioSchema = z.strictObject({ ...DelPreset, kind: z.literal('SESION'), session: PresetDeSesionContenidoSchema, exercises: z.record(IdOpaco, EjercicioDeHabitualSchema) });
export type PresetDeSesionPropio = z.infer<typeof PresetDeSesionPropioSchema>;
/** DL-203: un preset de fase, con el nombre vigente de cada ejercicio. */
export const PresetDeFasePropioSchema = z.strictObject({ ...DelPreset, kind: z.literal('FASE'), phase: PresetDeFaseContenidoSchema, exercises: z.record(IdOpaco, EjercicioDeHabitualSchema) });
export type PresetDeFasePropio = z.infer<typeof PresetDeFasePropioSchema>;
export const PresetPropioDeEntrenamientoSchema = z.discriminatedUnion('kind', [PrescripcionHabitualSchema, PresetDeSesionPropioSchema, PresetDeFasePropioSchema]);
export type PresetPropioDeEntrenamiento = z.infer<typeof PresetPropioDeEntrenamientoSchema>;
export const PrescripcionHabitualResponseSchema = z.strictObject({ data: PresetPropioDeEntrenamientoSchema });
/** API-HAB-06: los propios y activos de los tres niveles, el guardado más recientemente primero; hasta 200, sin paginar. */
export const ListaDePrescripcionesHabitualesResponseSchema = z.strictObject({ data: z.array(PresetPropioDeEntrenamientoSchema) });

/** Gramos por día de un macro: el reparto habitual se escribe en gramos (DJ-7: nunca en proporciones antes del 25/11). */
const GramosPorDiaSchema = z.strictObject({ value: z.number().nonnegative().finite().max(2000), unit: z.literal('g/day') });

/** Un reparto habitual de macros, en gramos por día, como el que escribe el profesional en el objetivo. */
export const RepartoHabitualContenidoSchema = z.strictObject({ protein: GramosPorDiaSchema, carbohydrate: GramosPorDiaSchema, fat: GramosPorDiaSchema });
export type RepartoHabitualContenido = z.infer<typeof RepartoHabitualContenidoSchema>;

/** API-HAN-07: guardar o reemplazar por nombre, con las reglas de API-HAB-07. */
export const GuardarRepartoHabitualRequestSchema = z
  .strictObject({ name: Texto(120), distribution: RepartoHabitualContenidoSchema, replaces: IdOpaco.optional(), expectedVersion: TokenDeVersionSchema.optional() })
  .refine((p) => (p.replaces === undefined) === (p.expectedVersion === undefined), { message: 'Reemplazar pide la versión esperada', path: ['expectedVersion'] });
export type GuardarRepartoHabitualRequest = z.infer<typeof GuardarRepartoHabitualRequestSchema>;

export const RepartoHabitualSchema = z.strictObject({
  presetId: IdOpaco,
  version: TokenDeVersionSchema,
  name: z.string(),
  distribution: RepartoHabitualContenidoSchema,
  createdAt: Instante,
  updatedAt: Instante,
});
export type RepartoHabitual = z.infer<typeof RepartoHabitualSchema>;
export const RepartoHabitualResponseSchema = z.strictObject({ data: RepartoHabitualSchema });
/** API-HAN-06: los propios y activos, el guardado más recientemente primero; hasta 200, sin paginar. */
export const ListaDeRepartosHabitualesResponseSchema = z.strictObject({ data: z.array(RepartoHabitualSchema) });
