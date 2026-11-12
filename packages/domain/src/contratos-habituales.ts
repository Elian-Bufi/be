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
  BaseDeCargaSchema,
  BaseDeRepeticionesSchema,
  DescansoRecomendadoSchema,
  EjercicioDeCatalogoSchema,
  IntensidadEntradaSchema,
  ParametroProfesionalSchema,
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

/**
 * API-HAB-07: guardar o reemplazar por nombre. Un nombre en uso por otra activa sin `replaces` que la señale es 409
 * PRESET_NAME_TAKEN, como las sesiones habituales; con `replaces` (propia y activa), la reemplaza si su versión es
 * `expectedVersion`.
 */
export const GuardarPrescripcionHabitualRequestSchema = z
  .strictObject({ name: Texto(120), prescription: PrescripcionHabitualContenidoSchema, replaces: IdOpaco.optional(), expectedVersion: TokenDeVersionSchema.optional() })
  .refine((p) => (p.replaces === undefined) === (p.expectedVersion === undefined), { message: 'Reemplazar pide la versión esperada', path: ['expectedVersion'] });
export type GuardarPrescripcionHabitualRequest = z.infer<typeof GuardarPrescripcionHabitualRequestSchema>;

export const PrescripcionHabitualSchema = z.strictObject({
  presetId: IdOpaco,
  version: TokenDeVersionSchema,
  name: z.string(),
  prescription: PrescripcionHabitualContenidoSchema,
  createdAt: Instante,
  updatedAt: Instante,
});
export type PrescripcionHabitual = z.infer<typeof PrescripcionHabitualSchema>;
export const PrescripcionHabitualResponseSchema = z.strictObject({ data: PrescripcionHabitualSchema });
/** API-HAB-06: las propias y activas, la guardada más recientemente primero; hasta 200, sin paginar. */
export const ListaDePrescripcionesHabitualesResponseSchema = z.strictObject({ data: z.array(PrescripcionHabitualSchema) });

/** Gramos por día de un macro: el reparto habitual se escribe en gramos (DJ-7: sin «%» antes del 25/11). */
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
