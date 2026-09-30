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
import { IdOpaco, Instante } from './contratos';
import { EstructuraDePlanDeEntrenamientoEntradaSchema } from './contratos-entrenamiento';
import { PaginaSchema, TokenDeVersionSchema } from './contratos-vinculo';

const Texto = (max: number) => z.string().trim().min(1).max(max);
const TextoOpcional = (max: number) => z.string().trim().max(max).nullable();

export const EstadoDePlantillaSchema = z.enum(['ACTIVE', 'ARCHIVED']);
export type EstadoDePlantilla = z.infer<typeof EstadoDePlantillaSchema>;

/** De qué versión de plan salió la plantilla; solo para el propietario. No lleva la identidad del asesorado. */
export const OrigenDePlantillaSchema = z.strictObject({ planVersionId: IdOpaco });
export type OrigenDePlantilla = z.infer<typeof OrigenDePlantillaSchema>;

export const CrearPlantillaDeEntrenamientoRequestSchema = z.strictObject({
  name: Texto(120),
  description: TextoOpcional(1000).optional(),
  structure: EstructuraDePlanDeEntrenamientoEntradaSchema,
  /** D-2: las cargas sugeridas no se copian por defecto; con `true` se conservan como referencia de la plantilla. */
  copySuggestedLoads: z.boolean().optional(),
  /** Si la estructura salió de una versión de plan propia, para dejarlo registrado. */
  origin: OrigenDePlantillaSchema.optional(),
});
export type CrearPlantillaDeEntrenamientoRequest = z.infer<typeof CrearPlantillaDeEntrenamientoRequestSchema>;

export const NuevaVersionDePlantillaRequestSchema = z.strictObject({
  expectedVersion: TokenDeVersionSchema,
  structure: EstructuraDePlanDeEntrenamientoEntradaSchema,
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

export const PlantillaDeEntrenamientoSchema = ResumenDePlantillaDeEntrenamientoSchema.extend({
  /** La estructura tal como se guardó: la misma forma que se manda al crear un plan. */
  structure: EstructuraDePlanDeEntrenamientoEntradaSchema,
});
export type PlantillaDeEntrenamiento = z.infer<typeof PlantillaDeEntrenamientoSchema>;

export const PlantillaDeEntrenamientoResponseSchema = z.strictObject({ data: PlantillaDeEntrenamientoSchema });
export const ListaDePlantillasDeEntrenamientoResponseSchema = z.strictObject({ data: z.array(ResumenDePlantillaDeEntrenamientoSchema), page: PaginaSchema });

/** De qué plantilla y versión salió una versión de plan (solo en lecturas del profesional). */
export const OrigenDePlanEnPlantillaSchema = z.strictObject({ templateId: IdOpaco, templateVersionId: IdOpaco });
export type OrigenDePlanEnPlantilla = z.infer<typeof OrigenDePlanEnPlantillaSchema>;

/** Cuenta sesiones de una estructura de entrada: bloques → microciclos o sesiones directas. */
export function sesionesDeLaEstructura(structure: z.infer<typeof EstructuraDePlanDeEntrenamientoEntradaSchema>): number {
  return structure.blocks.reduce((n, b) => n + (b.sessions?.length ?? 0) + (b.microcycles ?? []).reduce((m, c) => m + c.sessions.length, 0), 0);
}

/** D-2: quita las cargas sugeridas de una estructura (son de la persona, no del molde). */
export function sinCargasSugeridas(structure: z.infer<typeof EstructuraDePlanDeEntrenamientoEntradaSchema>): z.infer<typeof EstructuraDePlanDeEntrenamientoEntradaSchema> {
  const sesion = <S extends { prescriptions: readonly { suggestedLoad?: unknown }[] }>(s: S): S => ({ ...s, prescriptions: s.prescriptions.map(({ suggestedLoad: _omitida, ...p }) => p) });
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
