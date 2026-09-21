import { CONDICION_DE_SESION_API, GRANULARIDAD_API, sesionesDelPlan } from '@be/domain';
import type {
  Bloque,
  CondicionDeSesion,
  EjercicioRegistrado,
  EjercicioRegistradoEntrada,
  GranularidadDeRegistro,
  RegistroDeEjecucion,
  SesionDeOcurrencia,
  ContenidoDePlanDeEntrenamiento,
  EjercicioCitable,
  EjercicioCongelado,
  EjercicioDeCatalogo,
  EvaluacionDeEntrenamiento,
  InstantaneaDeEntrenamiento,
  Prescripcion,
  PrescripcionGuardada,
  SesionGuardada,
  SesionPlanificada,
  VersionDeObjetivoDeEntrenamiento,
  VersionDePlanDeEntrenamiento,
} from '@be/domain';
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
    context: e.contexto,
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

// ─── Plan ────────────────────────────────────────────────────────────────────────────────────────

export const INCLUIR_PLAN_DE_ENTRENAMIENTO = { plan: true, instantanea: true } as const;
export type VersionConPlan = Prisma.VersionDePlanDeEntrenamientoGetPayload<{ include: typeof INCLUIR_PLAN_DE_ENTRENAMIENTO }>;

/** Cómo se nombra el ejercicio de una referencia: desde la instantánea si está activada, desde el catálogo si no. */
export type ResolverDeEjercicio = (versionId: string) => EjercicioCongelado | null;

export function resolverDeInstantanea(i: InstantaneaDeEntrenamiento): ResolverDeEjercicio {
  return (versionId) => i.ejercicios[versionId] ?? null;
}
export function resolverDeCatalogo(catalogo: ReadonlyMap<string, EjercicioCitable>): ResolverDeEjercicio {
  return (versionId) => {
    const e = catalogo.get(versionId);
    return e ? { exerciseId: e.ejercicioId, exerciseName: e.nombre } : null;
  };
}

/**
 * Una referencia que no se resuelve no se inventa: se muestra como no disponible, con su versión como identificador.
 * En una versión activada no puede pasar —la instantánea no se construye si falta una—; en un borrador, validar lo
 * informa como problema.
 */
function ejercicioDe(resolver: ResolverDeEjercicio, versionId: string): EjercicioCongelado {
  return resolver(versionId) ?? { exerciseId: versionId, exerciseName: 'Ejercicio no disponible' };
}

export function prescripcionApi(p: PrescripcionGuardada, orden: number, resolver: ResolverDeEjercicio): Prescripcion {
  const e = ejercicioDe(resolver, p.exerciseVersionId);
  return {
    prescriptionId: p.prescriptionId,
    order: orden,
    exerciseId: e.exerciseId,
    exerciseVersionId: p.exerciseVersionId,
    exerciseName: e.exerciseName,
    sets: p.sets.map((s, i) => ({ setIndex: i + 1, repetitions: s.repetitions, note: s.note })),
    intensity: p.intensity,
    suggestedLoad: p.suggestedLoad,
    professionalParameters: p.professionalParameters.map((q) => ({ label: q.label, value: q.value, unit: q.unit })),
    note: p.note,
  };
}

export function sesionApi(s: SesionGuardada, orden: number, resolver: ResolverDeEjercicio): SesionPlanificada {
  return {
    sessionId: s.sessionId,
    label: s.label,
    order: orden,
    instructions: s.instructions,
    prescriptions: s.prescriptions.map((p, i) => prescripcionApi(p, i + 1, resolver)),
  };
}

export function bloquesApi(contenido: ContenidoDePlanDeEntrenamiento, resolver: ResolverDeEjercicio): Bloque[] {
  return contenido.blocks.map((b, i) => ({
    blockId: b.blockId,
    label: b.label,
    order: i + 1,
    purpose: b.purpose,
    microcycles: b.microcycles.map((m, j) => ({
      microcycleId: m.microcycleId,
      label: m.label,
      order: j + 1,
      purpose: m.purpose,
      sessions: m.sessions.map((s, k) => sesionApi(s, k + 1, resolver)),
    })),
    sessions: b.sessions.map((s, k) => sesionApi(s, k + 1, resolver)),
  }));
}

/**
 * Una versión de plan. La activada se reconstruye **desde su instantánea**, no desde el borrador ni desde el catálogo
 * actual (09v10:706; REG-06-112): si el catálogo cambió después, esto no cambia.
 *
 * `isEffective` es «la que ve el asesorado» (contrato): la versión efectiva de un seguimiento **abierto**. Después de
 * FINALIZAR la versión sigue ACTIVADA —la historia no se reescribe— pero ya no rige (06:4297).
 */
/** Si el profesional y el asesorado tienen un seguimiento de entrenamiento ABIERTO. */
export async function seguimientoAbierto(tx: Prisma.TransactionClient, profesionalId: string, asesoradoId: string): Promise<boolean> {
  return (await tx.procesoOperativo.count({ where: { profesionalId, asesoradoId, alcance: 'ENTRENAMIENTO', estado: 'ABIERTO' } })) > 0;
}

export function versionDePlanApi(
  v: VersionConPlan,
  nombreProfesional: string,
  catalogoDeBorrador: ReadonlyMap<string, EjercicioCitable>,
  seguimientoAbierto: boolean,
): VersionDePlanDeEntrenamiento {
  const instantanea = v.estado === 'ACTIVADA' && v.instantanea ? (v.instantanea.contenido as unknown as InstantaneaDeEntrenamiento) : null;
  const contenido = instantanea ? instantanea.contenido : (v.contenido as unknown as ContenidoDePlanDeEntrenamiento);
  const resolver = instantanea ? resolverDeInstantanea(instantanea) : resolverDeCatalogo(catalogoDeBorrador);
  return {
    planId: v.id,
    trainingPlanId: v.planId,
    version: token(v.version),
    state: v.estado === 'ACTIVADA' ? 'ACTIVATED' : 'DRAFT',
    adviseeId: v.plan.asesoradoId,
    professional: { identityId: v.plan.profesionalId, displayName: nombreProfesional },
    objectiveVersionId: v.versionDeObjetivoId,
    predecessorPlanId: v.predecesoraId,
    isEffective: seguimientoAbierto && v.plan.versionEfectivaId === v.id,
    createdAt: v.momentoDeRegistro.toISOString(),
    activatedAt: v.momentoDeActivacion?.toISOString() ?? null,
    snapshotDigest: v.instantanea?.huella ?? null,
    nextReviewAt: v.proximaRevision ? v.proximaRevision.toISOString().slice(0, 10) : null,
    blocks: bloquesApi(contenido, resolver),
  };
}

// ─── Ocurrencias, borradores y ejecuciones ───────────────────────────────────────────────────────

/** Lo que guarda el borrador y la ejecución en `contenido`: los ejercicios registrados y el resumen de sesión. */
export interface ContenidoDeRegistro {
  readonly exercises: readonly EjercicioRegistradoEntrada[];
  readonly sessionSummary: { readonly description: string } | null;
}
export const REGISTRO_VACIO: ContenidoDeRegistro = { exercises: [], sessionSummary: null };

/**
 * La sesión planificada de una ocurrencia, tal como está en la instantánea, ubicada en su bloque y su microciclo. Es
 * la forma mínima que DL-079 exige para poder registrar: las prescripciones con su identificador.
 */
export function sesionDeOcurrenciaApi(i: InstantaneaDeEntrenamiento, sesionId: string): SesionDeOcurrencia | null {
  const u = sesionesDelPlan(i.contenido).find((s) => s.sesion.sessionId === sesionId);
  if (!u) return null;
  const orden = (u.microciclo ? u.microciclo.sessions : u.bloque.sessions).indexOf(u.sesion) + 1;
  return {
    ...sesionApi(u.sesion, orden, resolverDeInstantanea(i)),
    blockId: u.bloque.blockId,
    blockLabel: u.bloque.label,
    microcycleId: u.microciclo?.microcycleId ?? null,
    microcycleLabel: u.microciclo?.label ?? null,
  };
}

/**
 * Los ejercicios tal como se registraron, con las dos puntas de una sustitución a la vista (REG-06-130). El
 * prescripto sale de la instantánea; el realizado, del catálogo. Nunca se sintetizan series desde un resumen.
 */
export function ejerciciosRegistradosApi(
  ejercicios: readonly EjercicioRegistradoEntrada[],
  sesion: SesionDeOcurrencia | null,
  nombres: ReadonlyMap<string, string>,
): EjercicioRegistrado[] {
  return ejercicios.map((e) => {
    const prescripta = sesion?.prescriptions.find((p) => p.prescriptionId === e.prescriptionId);
    const prescribedExerciseVersionId = prescripta?.exerciseVersionId ?? e.performedExerciseVersionId;
    return {
      prescriptionId: e.prescriptionId,
      prescribedExerciseVersionId,
      prescribedExerciseName: prescripta?.exerciseName ?? 'Ejercicio no disponible',
      performedExerciseVersionId: e.performedExerciseVersionId,
      performedExerciseName: nombres.get(e.performedExerciseVersionId) ?? 'Ejercicio no disponible',
      substituted: e.performedExerciseVersionId !== prescribedExerciseVersionId,
      sets: 'sets' in e ? e.sets.map((s) => ({ ...s })) : null,
      executionSummary: 'executionSummary' in e ? { description: e.executionSummary.description } : null,
    };
  });
}

/** Un registro completo (el original o el contenido de una corrección) en la forma del contrato. */
export function registroApi(
  r: { granularidad: GranularidadDeRegistro | null; condicion: CondicionDeSesion; motivo: string | null; contenido: ContenidoDeRegistro },
  sesion: SesionDeOcurrencia | null,
  nombres: ReadonlyMap<string, string>,
): RegistroDeEjecucion {
  return {
    granularity: r.granularidad ? GRANULARIDAD_API[r.granularidad] : null,
    sessionCondition: CONDICION_DE_SESION_API[r.condicion],
    reason: r.motivo,
    exercises: ejerciciosRegistradosApi(r.contenido.exercises, sesion, nombres),
    sessionSummary: r.contenido.sessionSummary,
  };
}

/** Las versiones de ejercicio que se nombran en uno o más registros. */
export function versionesRealizadas(...contenidos: readonly ContenidoDeRegistro[]): string[] {
  return [...new Set(contenidos.flatMap((c) => c.exercises.map((e) => e.performedExerciseVersionId)))];
}

export async function nombresDeEjercicios(cliente: Prisma.TransactionClient, versionIds: readonly string[]): Promise<Map<string, string>> {
  const validos = versionIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (validos.length === 0) return new Map();
  const filas = await cliente.versionDeEjercicio.findMany({ where: { id: { in: validos } }, select: { id: true, nombre: true } });
  return new Map(filas.map((f) => [f.id, f.nombre]));
}
