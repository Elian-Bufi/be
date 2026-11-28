/**
 * API-TPL-01 a API-TPL-05 — Plantillas de plan de entrenamiento del profesional (PF-09; DL-108, decidido el
 * 2026-09-30). Una plantilla es un **molde propio**, sin asesorado:
 * - guarda una estructura de plan con la misma forma que acepta API-TRN-07 (`EstructuraDePlanDeEntrenamientoEntrada`),
 *   en versiones inmutables; un nombre por profesional;
 * - no lleva objetivo, próxima revisión, citas ni nada de una persona (DL-108 D-5); las cargas sugeridas se copian
 *   solo si el profesional lo pide y quedan marcadas como referencia (`copiedLoads`, D-2); las notas de texto libre las
 *   confirma el website una por una antes de mandarlas (D-3): la API guarda lo que recibe;
 * - solo la ve y la aplica quien la creó (D-1): cualquier otra identidad recibe 404, sin distinguir inexistente de ajena;
 * - aplicarla es crear un borrador de plan (API-TRN-07 con `fromTemplateVersionId`): el plan es de la persona y registra
 *   su origen; cambiar la plantilla después no lo altera.
 */
import { z } from 'zod';
import { IdOpaco, Instante, ValidationIssueSchema } from './contratos';
import { EstructuraDePlanDeEntrenamientoEntradaSchema, PlanificacionDelPlanSchema } from './contratos-entrenamiento';
import { ImagenDeEjercicioSchema } from './contratos-entrenamiento-por-serie';
import { PaginaSchema, TokenDeVersionSchema } from './contratos-vinculo';

const Texto = (max: number) => z.string().trim().min(1).max(max);
const TextoOpcional = (max: number) => z.string().trim().max(max).nullable();

/**
 * DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2, ET2-10) · la planificación que guarda una plantilla: las semanas del plan y de
 * cada fase, las aproximaciones, las progresiones, la intensidad del plan y el esfuerzo de la sesión. **Nada de una
 * persona** (DL-108 D-5): sin fecha de inicio, sin objetivo, sin anotaciones privadas y sin favoritos. Nombra las fases y
 * los ejercicios de su estructura; DL-202: también «Pedir el esfuerzo de cada serie», si está escrito; al aplicarla, cada uno pasa al suyo del plan nuevo (`planificacionDesdeLaPlantilla`).
 * Opcional en todo: una plantilla de antes no la tiene, y un website anterior no la manda.
 */
export const PlanificacionDeLaPlantillaSchema = PlanificacionDelPlanSchema.pick({
  weeks: true,
  phases: true,
  warmUps: true,
  progressions: true,
  intensity: true,
  withoutIntensity: true,
  askSessionEffort: true,
  askSetEffort: true,
  loadRounding: true,
  loadRoundingByExercise: true,
});
export type PlanificacionDeLaPlantilla = z.infer<typeof PlanificacionDeLaPlantillaSchema>;

export const EstadoDePlantillaSchema = z.enum(['ACTIVE', 'ARCHIVED']);
export type EstadoDePlantilla = z.infer<typeof EstadoDePlantillaSchema>;

/** De qué versión de plan salió la plantilla; solo para el propietario. No lleva la identidad del asesorado. */
export const OrigenDePlantillaSchema = z.strictObject({ planVersionId: IdOpaco });
export type OrigenDePlantilla = z.infer<typeof OrigenDePlantillaSchema>;

export const CrearPlantillaDeEntrenamientoRequestSchema = z.strictObject({
  name: Texto(120),
  description: TextoOpcional(1000).optional(),
  structure: EstructuraDePlanDeEntrenamientoEntradaSchema,
  /** DL-198 (ET2-10): la planificación de la plantilla; ausente, sin planificación. */
  planning: PlanificacionDeLaPlantillaSchema.nullable().optional(),
  /** D-2: las cargas sugeridas no se copian por defecto; con `true` se conservan como referencia de la plantilla. */
  copySuggestedLoads: z.boolean().optional(),
  /** Si la estructura salió de una versión de plan propia, para dejarlo registrado. */
  origin: OrigenDePlantillaSchema.optional(),
});
export type CrearPlantillaDeEntrenamientoRequest = z.infer<typeof CrearPlantillaDeEntrenamientoRequestSchema>;

export const NuevaVersionDePlantillaRequestSchema = z.strictObject({
  expectedVersion: TokenDeVersionSchema,
  structure: EstructuraDePlanDeEntrenamientoEntradaSchema,
  /** DL-198 (ET2-10): la planificación de la versión nueva; ausente, sin planificación. */
  planning: PlanificacionDeLaPlantillaSchema.nullable().optional(),
  copySuggestedLoads: z.boolean().optional(),
  origin: OrigenDePlantillaSchema.optional(),
});
export type NuevaVersionDePlantillaRequest = z.infer<typeof NuevaVersionDePlantillaRequestSchema>;

/** Nombre, descripción y estado: no cambian la estructura ni crean versión. */
export const EditarPlantillaRequestSchema = z
  .strictObject({
    expectedVersion: TokenDeVersionSchema,
    name: Texto(120).optional(),
    description: TextoOpcional(1000).optional(),
    state: EstadoDePlantillaSchema.optional(),
  })
  .refine((p) => p.name !== undefined || p.description !== undefined || p.state !== undefined, { message: 'Nada que cambiar', path: ['name'] });
export type EditarPlantillaRequest = z.infer<typeof EditarPlantillaRequestSchema>;

export const ResumenDePlantillaDeEntrenamientoSchema = z.strictObject({
  templateId: IdOpaco,
  /** Versión vigente de la plantilla (la última) y su número. */
  versionId: IdOpaco,
  versionNumber: z.number().int().positive(),
  /** Token de concurrencia de la plantilla (nombre, descripción, estado y versión nueva). */
  version: TokenDeVersionSchema,
  name: z.string(),
  description: z.string().nullable(),
  state: EstadoDePlantillaSchema,
  copiedLoads: z.boolean(),
  origin: OrigenDePlantillaSchema.nullable(),
  sessionCount: z.number().int().nonnegative(),
  createdAt: Instante,
  updatedAt: Instante,
});
export type ResumenDePlantillaDeEntrenamiento = z.infer<typeof ResumenDePlantillaDeEntrenamientoSchema>;

/** Cómo se llama hoy cada ejercicio que la estructura referencia, y si sigue disponible para este profesional. */
export const EjercicioDePlantillaSchema = z.strictObject({ exerciseId: IdOpaco, exerciseName: z.string(), available: z.boolean() });
export type EjercicioDePlantilla = z.infer<typeof EjercicioDePlantillaSchema>;

export const PlantillaDeEntrenamientoSchema = ResumenDePlantillaDeEntrenamientoSchema.extend({
  /** La estructura tal como se guardó: la misma forma que se manda al crear un plan. */
  structure: EstructuraDePlanDeEntrenamientoEntradaSchema,
  /** DL-198 (ET2-10): la planificación de la versión vigente, o `null`. Opcional para un website anterior. */
  planning: PlanificacionDeLaPlantillaSchema.nullable().optional(),
  /** Por `exerciseVersionId`: el nombre vigente en el catálogo y su disponibilidad. Uno que ya no exista no figura. */
  exercises: z.record(IdOpaco, EjercicioDePlantillaSchema),
});
export type PlantillaDeEntrenamiento = z.infer<typeof PlantillaDeEntrenamientoSchema>;

export const PlantillaDeEntrenamientoResponseSchema = z.strictObject({ data: PlantillaDeEntrenamientoSchema });
export const ListaDePlantillasDeEntrenamientoResponseSchema = z.strictObject({ data: z.array(ResumenDePlantillaDeEntrenamientoSchema), page: PaginaSchema });

/** De qué plantilla y versión salió una versión de plan (solo en lecturas del profesional). */
export const OrigenDePlanEnPlantillaSchema = z.strictObject({ templateId: IdOpaco, templateVersionId: IdOpaco });
export type OrigenDePlanEnPlantilla = z.infer<typeof OrigenDePlanEnPlantillaSchema>;

// ─── PLT (DL-182) · la preparación de una plantilla: crearla y editarla sin una persona ─────────────────────────────
//
// Una plantilla se prepara aparte de sus versiones: la preparación es el trabajo en curso del profesional, privado, que
// se autoguarda (API-TPL-10) y no cambia ninguna versión. Publicarla (API-TPL-12) crea la plantilla, la primera vez, o
// una versión nueva; descartarla (API-TPL-13) deja las versiones como estaban. Una preparación por plantilla; las de una
// plantilla nueva no tienen plantilla hasta publicarse. Lo de la persona (objetivo, días, próxima revisión) no existe acá.

/** API-TPL-06: una plantilla nueva, en blanco (una fase, sin sesiones) o como copia de una versión propia. */
export const CrearPreparacionDePlantillaRequestSchema = z.strictObject({
  /** PLT-D07: la versión propia que se copia («desde una existente»); ausente, en blanco. */
  fromTemplateVersionId: IdOpaco.optional(),
});
export type CrearPreparacionDePlantillaRequest = z.infer<typeof CrearPreparacionDePlantillaRequestSchema>;

/** API-TPL-07: editar una plantilla existente abre su preparación, o devuelve la que ya hay (PLT-D04). Sin cuerpo propio. */
export const AbrirPreparacionDePlantillaRequestSchema = z.strictObject({});

/**
 * API-TPL-10: el autoguardado. La estructura viaja entera, como en API-TRN-10. El nombre y la descripción son de la
 * preparación solo en una plantilla nueva (PLT-D05): los de una existente se cambian con API-TPL-05.
 */
export const GuardarPreparacionDePlantillaRequestSchema = z.strictObject({
  expectedVersion: TokenDeVersionSchema,
  structure: EstructuraDePlanDeEntrenamientoEntradaSchema,
  /** DL-198 (ET2-10): la planificación en preparación. Ausente, no cambia; `null`, se quita. */
  planning: PlanificacionDeLaPlantillaSchema.nullable().optional(),
  /** Puede quedar vacío mientras se prepara: el nombre se exige al guardar la plantilla. */
  name: z.string().trim().max(120).optional(),
  description: TextoOpcional(1000).optional(),
  /** D-2 de DL-108: con `true`, las cargas sugeridas quedan en la versión como referencia. */
  copySuggestedLoads: z.boolean().optional(),
});
export type GuardarPreparacionDePlantillaRequest = z.infer<typeof GuardarPreparacionDePlantillaRequestSchema>;

/** Revisar, guardar como versión y descartar: con la versión de la preparación que se tiene a la vista. */
export const VersionDeLaPreparacionRequestSchema = z.strictObject({ expectedVersion: TokenDeVersionSchema });

/** Cada ejercicio de la preparación: su nombre vigente, si sigue disponible y su imagen (DL-123), para el editor. */
export const EjercicioDeLaPreparacionSchema = EjercicioDePlantillaSchema.extend({ image: ImagenDeEjercicioSchema.nullable() });

export const ResumenDePreparacionDePlantillaSchema = z.strictObject({
  draftId: IdOpaco,
  /** La plantilla que se cambia; `null`: una plantilla nueva, que nace al guardarla. */
  templateId: IdOpaco.nullable(),
  /** La versión de la que partió (la vigente al abrirla); `null` en una plantilla nueva. */
  baseVersionId: IdOpaco.nullable(),
  baseVersionNumber: z.number().int().positive().nullable(),
  /** Token de concurrencia de la preparación: cambia con cada guardado. */
  version: TokenDeVersionSchema,
  /** En una plantilla nueva, el de la preparación (vacío mientras no tenga); en una existente, el de la plantilla. */
  name: z.string(),
  description: z.string().nullable(),
  /** El estado de la plantilla que se cambia; `null` en una nueva. Una archivada no recibe versiones (TEMPLATE_ARCHIVED). */
  templateState: EstadoDePlantillaSchema.nullable(),
  copySuggestedLoads: z.boolean(),
  sessionCount: z.number().int().nonnegative(),
  createdAt: Instante,
  updatedAt: Instante,
});
export type ResumenDePreparacionDePlantilla = z.infer<typeof ResumenDePreparacionDePlantillaSchema>;

export const PreparacionDePlantillaSchema = ResumenDePreparacionDePlantillaSchema.extend({
  /** La estructura en preparación, con los identificadores que le puso el servidor al guardarla. */
  structure: EstructuraDePlanDeEntrenamientoEntradaSchema,
  /** DL-198 (ET2-10): la planificación en preparación, o `null`. Opcional para un website anterior. */
  planning: PlanificacionDeLaPlantillaSchema.nullable().optional(),
  /** Por `exerciseVersionId`, los que este profesional puede citar. */
  exercises: z.record(IdOpaco, EjercicioDeLaPreparacionSchema),
});
export type PreparacionDePlantilla = z.infer<typeof PreparacionDePlantillaSchema>;
export const PreparacionDePlantillaResponseSchema = z.strictObject({ data: PreparacionDePlantillaSchema });
export const ListaDePreparacionesDePlantillaResponseSchema = z.strictObject({ data: z.array(ResumenDePreparacionDePlantillaSchema), page: PaginaSchema });

/**
 * API-TPL-11: la revisión antes de guardar. `issues` impide guardar la plantilla (el nombre, ninguna sesión, un ejercicio
 * que ya no está disponible); `toComplete` es lo que queda para completar al adaptarla a una persona y no impide nada.
 */
export const RevisionDePreparacionResponseSchema = z.strictObject({
  data: z.strictObject({ valid: z.boolean(), version: TokenDeVersionSchema, issues: z.array(ValidationIssueSchema), toComplete: z.array(ValidationIssueSchema) }),
});
export type RevisionDePreparacion = z.infer<typeof RevisionDePreparacionResponseSchema>['data'];

/** API-TPL-13: la preparación se descartó; las versiones de la plantilla no cambian. */
export const DescarteDePreparacionResponseSchema = z.strictObject({ data: z.strictObject({ draftId: IdOpaco, discardedAt: Instante }) });

/** API-TPL-14: cada versión de una plantilla, de la más nueva a la primera, con cuántos planes salieron de ella. */
export const VersionDePlantillaDeEntrenamientoSchema = z.strictObject({
  versionId: IdOpaco,
  versionNumber: z.number().int().positive(),
  createdAt: Instante,
  sessionCount: z.number().int().nonnegative(),
  copiedLoads: z.boolean(),
  /** PLT-D11: versiones de plan (en preparación o activadas; no las descartadas) creadas desde esta versión. Sin personas. */
  plansCreated: z.number().int().nonnegative(),
});
export type VersionDePlantillaDeEntrenamiento = z.infer<typeof VersionDePlantillaDeEntrenamientoSchema>;
export const VersionesDePlantillaDeEntrenamientoResponseSchema = z.strictObject({ data: z.array(VersionDePlantillaDeEntrenamientoSchema) });

/** Cuenta sesiones de una estructura de entrada: bloques → microciclos o sesiones directas. */
export function sesionesDeLaEstructura(structure: z.infer<typeof EstructuraDePlanDeEntrenamientoEntradaSchema>): number {
  return structure.blocks.reduce((n, b) => n + (b.sessions?.length ?? 0) + (b.microcycles ?? []).reduce((m, c) => m + c.sessions.length, 0), 0);
}

/**
 * D-2: quita las cargas sugeridas de una estructura (son de la persona, no del molde): la de cada prescripción y, desde
 * DL-122, la de cada serie. El RIR y el descanso de cada serie quedan: son del método, no de la persona.
 */
export function sinCargasSugeridas(structure: z.infer<typeof EstructuraDePlanDeEntrenamientoEntradaSchema>): z.infer<typeof EstructuraDePlanDeEntrenamientoEntradaSchema> {
  const sesion = <S extends { prescriptions: readonly { suggestedLoad?: unknown; sets: readonly { suggestedLoad?: unknown }[] }[] }>(s: S): S => ({
    ...s,
    prescriptions: s.prescriptions.map(({ suggestedLoad: _omitida, ...p }) => ({ ...p, sets: p.sets.map(({ suggestedLoad: _deLaSerie, ...serie }) => serie) })),
  });
  return {
    blocks: structure.blocks.map((b) => ({
      ...b,
      ...(b.sessions ? { sessions: b.sessions.map(sesion) } : {}),
      ...(b.microcycles ? { microcycles: b.microcycles.map((m) => ({ ...m, sessions: m.sessions.map(sesion) })) } : {}),
    })),
  } as z.infer<typeof EstructuraDePlanDeEntrenamientoEntradaSchema>;
}

/** Nombre normalizado para la unicidad por profesional: sin espacios repetidos, en minúsculas y sin acentos. */
export const nombreNormalizadoDePlantilla = (nombre: string): string =>
  nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

// ─── Nutrición: el mismo molde con la estructura de API-NUT-07 y las cantidades como dato de la persona (D-2) ─────────
import { EstructuraDePlanEntradaSchema } from './contratos-nutricion';

export const CrearPlantillaNutricionalRequestSchema = z.strictObject({
  name: Texto(120),
  description: TextoOpcional(1000).optional(),
  structure: EstructuraDePlanEntradaSchema,
  /** D-2: las cantidades no se copian por defecto; con `true` quedan como referencia de la plantilla. */
  copyQuantities: z.boolean().optional(),
  origin: OrigenDePlantillaSchema.optional(),
});
export type CrearPlantillaNutricionalRequest = z.infer<typeof CrearPlantillaNutricionalRequestSchema>;

export const NuevaVersionDePlantillaNutricionalRequestSchema = z.strictObject({
  expectedVersion: TokenDeVersionSchema,
  structure: EstructuraDePlanEntradaSchema,
  copyQuantities: z.boolean().optional(),
  origin: OrigenDePlantillaSchema.optional(),
});
export type NuevaVersionDePlantillaNutricionalRequest = z.infer<typeof NuevaVersionDePlantillaNutricionalRequestSchema>;

export const ResumenDePlantillaNutricionalSchema = z.strictObject({
  templateId: IdOpaco,
  versionId: IdOpaco,
  versionNumber: z.number().int().positive(),
  version: TokenDeVersionSchema,
  name: z.string(),
  description: z.string().nullable(),
  state: EstadoDePlantillaSchema,
  copiedQuantities: z.boolean(),
  origin: OrigenDePlantillaSchema.nullable(),
  mealCount: z.number().int().nonnegative(),
  createdAt: Instante,
  updatedAt: Instante,
});
export type ResumenDePlantillaNutricional = z.infer<typeof ResumenDePlantillaNutricionalSchema>;

/** Por `catalogItemId`: el nombre vigente del elemento y si sigue disponible para este profesional. */
export const ElementoDePlantillaSchema = z.strictObject({ name: z.string(), available: z.boolean() });

export const PlantillaNutricionalSchema = ResumenDePlantillaNutricionalSchema.extend({
  structure: EstructuraDePlanEntradaSchema,
  items: z.record(IdOpaco, ElementoDePlantillaSchema),
});
export type PlantillaNutricional = z.infer<typeof PlantillaNutricionalSchema>;
export const PlantillaNutricionalResponseSchema = z.strictObject({ data: PlantillaNutricionalSchema });
export const ListaDePlantillasNutricionalesResponseSchema = z.strictObject({ data: z.array(ResumenDePlantillaNutricionalSchema), page: PaginaSchema });

/** Cuenta comidas de una estructura de comidas: días tipo → comidas. */
export const comidasDeLaEstructura = (structure: z.infer<typeof EstructuraDePlanEntradaSchema>): number => structure.dayTypes.reduce((n, d) => n + d.meals.length, 0);

/** D-2 en nutrición: quita las cantidades de cada ítem (son de la persona); el elemento, el estado de preparación y la nota quedan. */
export function sinCantidades(structure: z.infer<typeof EstructuraDePlanEntradaSchema>): z.infer<typeof EstructuraDePlanEntradaSchema> {
  return {
    dayTypes: structure.dayTypes.map((d) => ({
      ...d,
      meals: d.meals.map((m) => ({ ...m, options: m.options.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i, quantity: null })) })) })),
    })),
  };
}
