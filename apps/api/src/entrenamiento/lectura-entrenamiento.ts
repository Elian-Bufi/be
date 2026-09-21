import type { EjercicioDeCatalogo, EvaluacionDeEntrenamiento, VersionDeObjetivoDeEntrenamiento } from '@be/domain';
import type { EvaluacionDeEntrenamiento as FilaDeEvaluacion, Prisma, VersionDeObjetivoDeEntrenamiento as FilaDeVersionDeObjetivo } from '@prisma/client';
import { nombreDeProfesional, token } from '../vinculo/lectura';

/**
 * Modelos de lectura de TRN (09v10; contratos-entrenamiento.ts). Una versión ACTIVADA se lee de su instantánea,
 * nunca del catálogo vivo (REG-06-112; 09v10:706).
 */

// ─── Evaluación ──────────────────────────────────────────────────────────────────────────────────

export function evaluacionApi(e: FilaDeEvaluacion, nombreProfesional: string): EvaluacionDeEntrenamiento {
  return {
    evaluationId: e.id,
    version: token(1),
    adviseeId: e.asesoradoId,
    professional: { identityId: e.profesionalId, displayName: nombreProfesional },
    occurredAt: e.momentoDeOcurrencia.toISOString(),
    recordedAt: e.momentoDeRegistro.toISOString(),
    assessment: e.valoracion as EvaluacionDeEntrenamiento['assessment'],
    evidenceReferences: e.referencias as string[],
    professionalNotes: e.notas,
  };
}

// ─── Objetivo ────────────────────────────────────────────────────────────────────────────────────

export function versionDeObjetivoApi(
  v: FilaDeVersionDeObjetivo,
  o: { asesoradoId: string },
  esEfectiva: boolean,
  nombreProfesional: string,
): VersionDeObjetivoDeEntrenamiento {
  return {
    objectiveId: v.objetivoId,
    versionId: v.id,
    predecessorVersionId: v.predecesoraId,
    adviseeId: o.asesoradoId,
    evaluationId: v.evaluacionId,
    effectiveFrom: v.vigenteDesde.toISOString(),
    effectiveUntil: v.vigenteHasta?.toISOString() ?? null,
    objective: v.objetivo as VersionDeObjetivoDeEntrenamiento['objective'],
    rationale: v.fundamento,
    authoredBy: { identityId: v.autorId, displayName: nombreProfesional },
    createdAt: v.momentoDeRegistro.toISOString(),
    isEffective: esEfectiva,
  };
}

// ─── Catálogo ────────────────────────────────────────────────────────────────────────────────────

export interface FilaDeEjercicio {
  readonly ejercicioId: string;
  readonly versionId: string;
  readonly nombre: string;
  readonly disponible: boolean;
  readonly procedencia: 'BE_SYNTHETIC_SEED' | 'PROFESSIONAL_MANUAL';
  readonly creadoPorId: string | null;
  readonly momentoDeRegistro: Date;
}

/**
 * Las zonas musculares y el material didáctico llegan en WP-07 (docs/paquetes/WP-06.md D-A, §9.8). Mientras tanto
 * viajan vacíos: cero zonas es legítimo (REG-06-139), y nunca se inventa una relación para llenar el campo.
 */
export function ejercicioApi(f: FilaDeEjercicio): EjercicioDeCatalogo {
  return {
    exerciseId: f.ejercicioId,
    versionId: f.versionId,
    name: f.nombre,
    provenance: f.procedencia,
    muscleZones: [],
    didacticResources: [],
    available: f.disponible,
  };
}

// ─── Nombres ─────────────────────────────────────────────────────────────────────────────────────

export async function nombreVisibleDe(cliente: Prisma.TransactionClient, identidadId: string): Promise<string> {
  const perfil = await cliente.perfilProfesional.findUnique({ where: { identidadId }, select: { nombreVisible: true } });
  return nombreDeProfesional(perfil);
}
