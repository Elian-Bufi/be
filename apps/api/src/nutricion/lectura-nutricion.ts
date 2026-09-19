import {
  RESULTADO_HACIA_API,
  resolverVistaEfectiva,
  type ContenidoDeInstantanea,
  type ContenidoDePlan,
  type DiaTipo,
  type EvaluacionNutricional,
  type Ingesta,
  type Revision,
  type VersionDeObjetivo,
  type VersionDePlan,
} from '@be/domain';
import type {
  AplicacionDeRevision,
  CorreccionDeIngesta,
  EvaluacionNutricional as FilaDeEvaluacion,
  IngestaNutricional,
  InstantaneaDePlanNutricional,
  PlanNutricional,
  Prisma,
  RevisionNutricional,
  VersionDeObjetivoNutricional,
  VersionDePlanNutricional,
} from '@prisma/client';
import { nombreDeProfesional, token } from '../vinculo/lectura';

/**
 * Modelos de lectura de NUT (09v9; contratos-nutricion.ts). Un plan ACTIVADO se lee de su instantánea, nunca del catálogo
 * vivo (REG-06-13, 105; 09v9:519). Las fechas locales viajan como YYYY-MM-DD.
 */

type Cliente = Prisma.TransactionClient;

export const fechaLocal = (d: Date): string => d.toISOString().slice(0, 10);

export async function nombreVisibleDe(cliente: Cliente, identidadId: string): Promise<string> {
  const perfil = await cliente.perfilProfesional.findUnique({ where: { identidadId }, select: { nombreVisible: true } });
  return nombreDeProfesional(perfil);
}

// ─── Evaluación ──────────────────────────────────────────────────────────────────────────────────

export function evaluacionApi(e: FilaDeEvaluacion, nombreProfesional: string): EvaluacionNutricional {
  return {
    evaluationId: e.id,
    version: token(1),
    adviseeId: e.asesoradoId,
    professional: { identityId: e.profesionalId, displayName: nombreProfesional },
    occurredAt: e.momentoDeOcurrencia.toISOString(),
    recordedAt: e.momentoDeRegistro.toISOString(),
    context: e.contexto,
    assessment: e.valoracion as EvaluacionNutricional['assessment'],
    evidenceReferences: e.referencias as string[],
    professionalNotes: e.notas,
  };
}

// ─── Objetivo ────────────────────────────────────────────────────────────────────────────────────

export function versionDeObjetivoApi(
  v: VersionDeObjetivoNutricional,
  o: { profesionalId: string; asesoradoId: string },
  esEfectiva: boolean,
  nombreProfesional: string,
): VersionDeObjetivo {
  return {
    objectiveId: v.objetivoId,
    versionId: v.id,
    predecessorVersionId: v.predecesoraId,
    adviseeId: o.asesoradoId,
    evaluationId: v.evaluacionId,
    effectiveFrom: v.vigenteDesde.toISOString(),
    effectiveUntil: v.vigenteHasta?.toISOString() ?? null,
    estimatedEnergyRequirement: v.requerimientoEnergetico as VersionDeObjetivo['estimatedEnergyRequirement'],
    macronutrientDistribution: v.distribucionDeMacronutrientes as VersionDeObjetivo['macronutrientDistribution'],
    mealDistribution: v.distribucionPorComida,
    rationale: v.fundamento,
    methodStatement: v.declaracionDeMetodo,
    authoredBy: { identityId: v.autorId, displayName: nombreProfesional },
    createdAt: v.momentoDeRegistro.toISOString(),
    isEffective: esEfectiva,
  };
}

// ─── Plan ────────────────────────────────────────────────────────────────────────────────────────

/** Nombre y versión de cada elemento de catálogo, para mostrar un borrador (la instantánea trae los suyos). */
export type NombresDeCatalogo = ReadonlyMap<string, { versionId: string; nombre: string }>;

/** Jerarquía de salida desde la instantánea (activada) o desde el contenido y el catálogo actual (borrador). */
export function diasTipoApi(contenido: ContenidoDePlan, instantanea: ContenidoDeInstantanea | null, catalogo: NombresDeCatalogo): DiaTipo[] {
  if (instantanea) {
    return instantanea.dayTypes.map((d, i) => ({
      dayTypeId: d.dayTypeId,
      label: d.label,
      order: i + 1,
      meals: d.meals.map((m, j) => ({
        mealId: m.mealId,
        label: m.label,
        order: j + 1,
        prescriptionMode: m.prescriptionMode,
        options: m.options.map((o, k) => ({
          optionId: o.optionId,
          label: o.label,
          order: k + 1,
          items: o.items.map((it) => ({
            itemId: it.itemId,
            catalogItemId: it.catalogItemId,
            catalogItemVersionId: it.catalogItemVersionId,
            name: it.name,
            quantity: it.quantity,
            preparationState: it.preparationState,
            note: it.note,
          })),
        })),
      })),
    }));
  }
  return contenido.dayTypes.map((d, i) => ({
    dayTypeId: d.dayTypeId,
    label: d.label,
    order: i + 1,
    meals: d.meals.map((m, j) => ({
      mealId: m.mealId,
      label: m.label,
      order: j + 1,
      prescriptionMode: m.prescriptionMode,
      options: m.options.map((o, k) => ({
        optionId: o.optionId,
        label: o.label,
        order: k + 1,
        items: o.items.map((it) => ({
          itemId: it.itemId,
          catalogItemId: it.catalogItemId,
          catalogItemVersionId: null,
          name: catalogo.get(it.catalogItemId)?.nombre ?? 'Elemento no disponible',
          quantity: it.quantity,
          preparationState: it.preparationState,
          note: it.note,
        })),
      })),
    })),
  }));
}

export type VersionConPlan = VersionDePlanNutricional & { plan: PlanNutricional; instantanea: InstantaneaDePlanNutricional | null };
export const INCLUIR_PLAN = { plan: true, instantanea: true } as const;

export function versionDePlanApi(v: VersionConPlan, nombreProfesional: string, catalogo: NombresDeCatalogo, conJerarquia = true): VersionDePlan {
  return {
    planId: v.id,
    nutritionPlanId: v.planId,
    version: token(v.version),
    state: v.estado === 'ACTIVADA' ? 'ACTIVATED' : 'DRAFT',
    adviseeId: v.plan.asesoradoId,
    professional: { identityId: v.plan.profesionalId, displayName: nombreProfesional },
    objectiveVersionId: v.versionDeObjetivoId,
    predecessorPlanId: v.predecesoraId,
    isEffective: v.plan.versionEfectivaId === v.id,
    createdAt: v.momentoDeRegistro.toISOString(),
    activatedAt: v.momentoDeActivacion?.toISOString() ?? null,
    snapshotDigest: v.instantanea?.huella ?? null,
    nextReviewAt: v.proximaRevision ? fechaLocal(v.proximaRevision) : null,
    dayTypes: conJerarquia
      ? diasTipoApi(v.contenido as unknown as ContenidoDePlan, (v.instantanea?.contenido as unknown as ContenidoDeInstantanea | undefined) ?? null, catalogo)
      : [],
  };
}

/** Nombres actuales del catálogo para los ítems de un contenido (lectura de borradores). */
export async function nombresDeCatalogo(cliente: Cliente, contenido: ContenidoDePlan): Promise<NombresDeCatalogo> {
  const ids = [...new Set(contenido.dayTypes.flatMap((d) => d.meals.flatMap((m) => m.options.flatMap((o) => o.items.map((i) => i.catalogItemId)))))];
  if (ids.length === 0) return new Map();
  const filas = await cliente.$queryRaw<{ elementoId: string; versionId: string; nombre: string }[]>`
    SELECT v."elemento_id"::text AS "elementoId", v."id"::text AS "versionId", v."nombre"
      FROM "version_de_elemento_nutricional" v
     WHERE v."elemento_id" = ANY(${ids}::uuid[])
       AND NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" s WHERE s."predecesora_id" = v."id")`;
  return new Map(filas.map((f) => [f.elementoId, { versionId: f.versionId, nombre: f.nombre }]));
}

// ─── Ingesta ─────────────────────────────────────────────────────────────────────────────────────

export function ingestaApi(i: IngestaNutricional & { correcciones: CorreccionDeIngesta[] }, nombres: ReadonlyMap<string, string>): Ingesta {
  const vista = resolverVistaEfectiva(
    i.id,
    i.correcciones.map((c) => ({ id: c.id, originalId: c.ingestaId, correccionPreviaId: c.correccionPreviaId })),
  );
  return {
    executionId: i.id,
    planId: i.versionDePlanId,
    adviseeId: i.asesoradoId,
    origin: i.origen === 'PRESCRIPTA' ? 'PRESCRIBED' : 'OUTSIDE_PRESCRIPTION',
    mode: i.modo === 'OPCIONES_DE_PLATO' ? 'DISH_OPTIONS' : 'FREE_DESCRIPTION',
    occurredAt: i.momentoDeOcurrencia.toISOString(),
    recordedAt: i.momentoDeRegistro.toISOString(),
    localDate: fechaLocal(i.fechaLocal),
    timeZone: i.zonaHoraria,
    dayTypeId: i.diaTipoId,
    mealId: i.comidaId,
    optionId: i.opcionId,
    consumedItems: i.itemsConsumidos as Ingesta['consumedItems'],
    observation: i.observacion,
    description: i.descripcion,
    portionDescription: i.descripcionDePorcion,
    corrections: [...i.correcciones]
      .sort((a, b) => a.momentoDeRegistro.getTime() - b.momentoDeRegistro.getTime() || a.id.localeCompare(b.id))
      .map((c) => ({
        correctionId: c.id,
        previousCorrectionId: c.correccionPreviaId,
        reason: 'STRUCTURE_FREE_DESCRIPTION' as const,
        nature: 'ESTIMATE' as const,
        structuredEstimate: c.estimacion as Ingesta['corrections'][number]['structuredEstimate'],
        estimationStatement: c.declaracion,
        author: { identityId: c.autorId, displayName: nombres.get(c.autorId) ?? 'Profesional' },
        recordedAt: c.momentoDeRegistro.toISOString(),
      })),
    effectiveView: vista.tipo === 'ORIGINAL' ? { kind: 'ORIGINAL' } : vista.tipo === 'CORREGIDA' ? { kind: 'CORRECTED', correctionId: vista.id } : { kind: 'NOT_RESOLVABLE' },
  };
}

// ─── Revisión ────────────────────────────────────────────────────────────────────────────────────

export function revisionApi(
  r: RevisionNutricional & { aplicacion: AplicacionDeRevision | null },
  proceso: { asesoradoId: string },
  nombreAutor: string,
  procesoIdAplicado: string,
): Revision {
  return {
    reviewId: r.id,
    version: token(1),
    adviseeId: proceso.asesoradoId,
    processId: r.procesoId,
    period: { start: fechaLocal(r.periodoInicio), end: fechaLocal(r.periodoFin), timeZone: r.zonaHoraria },
    evidenceReferences: r.evidencias as Revision['evidenceReferences'],
    interpretation: r.interpretacion,
    result: RESULTADO_HACIA_API[r.resultado],
    rationale: r.fundamento,
    nextAction: r.proximaAccion as Revision['nextAction'],
    author: { identityId: r.autorId, displayName: nombreAutor },
    recordedAt: r.momentoDeRegistro.toISOString(),
    application: r.aplicacion
      ? {
          appliedAt: r.aplicacion.momentoDeRegistro.toISOString(),
          eventId: r.aplicacion.eventoId,
          type: r.aplicacion.tipo,
          processId: procesoIdAplicado,
          processStateAfter: r.aplicacion.estadoDeProcesoPosterior,
          createdPlanId: r.aplicacion.versionDePlanCreadaId,
          createdObjectiveVersionId: r.aplicacion.versionDeObjetivoCreadaId,
        }
      : null,
  };
}
