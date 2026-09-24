import type { Prisma } from '@prisma/client';
import type { ResumenDeAntropometria, ResumenDeEntrenamiento, ResumenDeNutricion } from '@be/domain';
import { nombreVisibleDe } from '../entrenamiento/lectura-entrenamiento';

type Tx = Prisma.TransactionClient;

/** El período consultado, ya validado por el controlador. `null` en un extremo = sin cota de ese lado. */
export interface Periodo {
  readonly start: string | null;
  readonly end: string | null;
}

/** Cota de `momento_de_ocurrencia` para el período, o `undefined` cuando no hay ninguna. */
function enElPeriodo(p: Periodo): { gte?: Date; lte?: Date } | undefined {
  const filtro = { ...(p.start ? { gte: new Date(p.start) } : {}), ...(p.end ? { lte: new Date(p.end) } : {}) };
  return Object.keys(filtro).length > 0 ? filtro : undefined;
}

const actor = (identityId: string, displayName: string) => ({ identityId, displayName });

/**
 * Los resúmenes por dominio de API-DSH-03 (09v11 §15; DL-031, condición de cierre).
 *
 * Cada función lee **un solo dominio**, con el plan, el objetivo y la revisión que ese dominio ya resuelve, y se llama
 * únicamente si el PDP permitió ese Alcance: un dominio denegado no aporta ni un dato al resumen de otro. Nada se
 * agrega entre dominios y ningún número se convierte en un juicio — son conteos de registros, no adherencia ni
 * cumplimiento (09v11 §15, regla crítica; B10-08 §10).
 *
 * La versión vigente es siempre `versionEfectivaId`, la relación explícita del Plan (INV-06-110), nunca «la última por
 * fecha». La última revisión es la del Proceso de ese profesional con ese asesorado en ese Alcance.
 */

export async function resumenDeNutricion(tx: Tx, profesionalId: string, asesoradoId: string, periodo: Periodo): Promise<ResumenDeNutricion | null> {
  const plan = await tx.planNutricional.findUnique({
    where: { profesionalId_asesoradoId: { profesionalId, asesoradoId } },
    select: { versionEfectiva: { select: { id: true, momentoDeActivacion: true, proximaRevision: true, versionDeObjetivoId: true } } },
  });
  const efectiva = plan?.versionEfectiva ?? null;

  const objetivoFila = efectiva
    ? await tx.versionDeObjetivoNutricional.findUnique({
        where: { id: efectiva.versionDeObjetivoId },
        select: { id: true, requerimientoEnergetico: true, autorId: true },
      })
    : null;

  const ultima = await ultimaRevision(tx, profesionalId, asesoradoId, 'NUTRICION');

  const ingestas = await tx.ingestaNutricional.aggregate({
    where: { asesoradoId, versionDePlan: { plan: { profesionalId } }, ...(enElPeriodo(periodo) ? { momentoDeOcurrencia: enElPeriodo(periodo) } : {}) },
    _count: { _all: true },
    _max: { momentoDeOcurrencia: true },
  });

  const resumen: ResumenDeNutricion = {
    activePlan:
      efectiva && efectiva.momentoDeActivacion
        ? { planVersionId: efectiva.id, activatedAt: efectiva.momentoDeActivacion.toISOString(), nextReviewAt: efectiva.proximaRevision?.toISOString().slice(0, 10) ?? null }
        : null,
    objective: objetivoFila
      ? {
          objectiveVersionId: objetivoFila.id,
          estimatedEnergyRequirement: objetivoFila.requerimientoEnergetico as { value: number; unit: 'kcal/day' },
          authoredBy: actor(objetivoFila.autorId, await nombreVisibleDe(tx, objetivoFila.autorId)),
        }
      : null,
    lastReview: ultima,
    registeredIntakes: ingestas._count._all,
    lastIntakeAt: ingestas._max.momentoDeOcurrencia?.toISOString() ?? null,
  };
  return vacio(resumen) ? null : resumen;
}

export async function resumenDeEntrenamiento(tx: Tx, profesionalId: string, asesoradoId: string, periodo: Periodo): Promise<ResumenDeEntrenamiento | null> {
  const plan = await tx.planDeEntrenamiento.findUnique({
    where: { profesionalId_asesoradoId: { profesionalId, asesoradoId } },
    select: { versionEfectiva: { select: { id: true, momentoDeActivacion: true, proximaRevision: true, versionDeObjetivoId: true } } },
  });
  const efectiva = plan?.versionEfectiva ?? null;

  const objetivoFila = efectiva
    ? await tx.versionDeObjetivoDeEntrenamiento.findUnique({ where: { id: efectiva.versionDeObjetivoId }, select: { id: true, objetivo: true, autorId: true } })
    : null;

  const ultima = await ultimaRevision(tx, profesionalId, asesoradoId, 'ENTRENAMIENTO');

  const ejecuciones = await tx.ejecucionDeEntrenamiento.aggregate({
    where: { asesoradoId, versionDePlan: { plan: { profesionalId } }, ...(enElPeriodo(periodo) ? { momentoDeOcurrencia: enElPeriodo(periodo) } : {}) },
    _count: { _all: true },
    _max: { momentoDeOcurrencia: true },
  });

  const resumen: ResumenDeEntrenamiento = {
    activePlan:
      efectiva && efectiva.momentoDeActivacion
        ? { planVersionId: efectiva.id, activatedAt: efectiva.momentoDeActivacion.toISOString(), nextReviewAt: efectiva.proximaRevision?.toISOString().slice(0, 10) ?? null }
        : null,
    objective: objetivoFila
      ? {
          objectiveVersionId: objetivoFila.id,
          // «El contenido concreto del objetivo no se fija en 09» (09v10:228): el enunciado es lo único citable.
          statement: enunciadoDeObjetivo(objetivoFila.objetivo),
          authoredBy: actor(objetivoFila.autorId, await nombreVisibleDe(tx, objetivoFila.autorId)),
        }
      : null,
    lastReview: ultima,
    registeredExecutions: ejecuciones._count._all,
    lastExecutionAt: ejecuciones._max.momentoDeOcurrencia?.toISOString() ?? null,
  };
  return vacio(resumen) ? null : resumen;
}

export async function resumenDeAntropometria(tx: Tx, profesionalId: string, asesoradoId: string, periodo: Periodo): Promise<ResumenDeAntropometria | null> {
  // Solo las REGISTRADAS: una evaluación en preparación todavía no es un dato (REG-06-214 inciso 4).
  const donde = { profesionalId, asesoradoId, estado: 'REGISTRADA' as const, ...(enElPeriodo(periodo) ? { momentoDeOcurrencia: enElPeriodo(periodo) } : {}) };
  const [cantidad, ultima] = await Promise.all([
    tx.evaluacionAntropometrica.count({ where: donde }),
    tx.evaluacionAntropometrica.findFirst({
      where: { profesionalId, asesoradoId, estado: 'REGISTRADA' },
      orderBy: { momentoDeOcurrencia: 'desc' },
      select: { id: true, momentoDeOcurrencia: true, momentoDeRegistroDeEvaluacion: true, profesionalId: true },
    }),
  ]);

  const resumen: ResumenDeAntropometria = {
    lastEvaluation: ultima
      ? {
          evaluationId: ultima.id,
          occurredAt: ultima.momentoDeOcurrencia.toISOString(),
          registeredAt: ultima.momentoDeRegistroDeEvaluacion?.toISOString() ?? null,
          author: actor(ultima.profesionalId, await nombreVisibleDe(tx, ultima.profesionalId)),
        }
      : null,
    registeredEvaluations: cantidad,
  };
  return vacio(resumen) ? null : resumen;
}

/** La última revisión registrada del Proceso de ese profesional con ese asesorado en ese Alcance, sin su contenido. */
async function ultimaRevision(
  tx: Tx,
  profesionalId: string,
  asesoradoId: string,
  alcance: 'NUTRICION' | 'ENTRENAMIENTO',
): Promise<{ reviewId: string; recordedAt: string; author: { identityId: string; displayName: string } } | null> {
  const procesos = await tx.procesoOperativo.findMany({ where: { profesionalId, asesoradoId, alcance }, select: { id: true } });
  if (procesos.length === 0) return null;
  const ids = procesos.map((p) => p.id);
  const fila =
    alcance === 'NUTRICION'
      ? await tx.revisionNutricional.findFirst({ where: { procesoId: { in: ids } }, orderBy: { momentoDeRegistro: 'desc' }, select: { id: true, momentoDeRegistro: true, autorId: true } })
      : await tx.revisionDeEntrenamiento.findFirst({ where: { procesoId: { in: ids } }, orderBy: { momentoDeRegistro: 'desc' }, select: { id: true, momentoDeRegistro: true, autorId: true } });
  if (!fila) return null;
  return { reviewId: fila.id, recordedAt: fila.momentoDeRegistro.toISOString(), author: actor(fila.autorId, await nombreVisibleDe(tx, fila.autorId)) };
}

/** El enunciado del objetivo de entrenamiento, que el 09 deja libre: se cita lo que hay, sin inventar. */
function enunciadoDeObjetivo(objetivo: unknown): string {
  const s = (objetivo as { statement?: unknown } | null)?.statement;
  return typeof s === 'string' ? s : '';
}

/**
 * Un resumen sin ningún hecho es `null`, no un objeto de ceros: «los faltantes se muestran como tales» (RF-053). Un
 * cero sí es un hecho cuando hay plan —«no registró nada en el período»—, pero un dominio autorizado y todavía vacío no
 * debe parecer un dominio con actividad nula.
 */
function vacio(r: ResumenDeNutricion | ResumenDeEntrenamiento | ResumenDeAntropometria): boolean {
  if ('lastEvaluation' in r) return r.lastEvaluation === null && r.registeredEvaluations === 0;
  const conteo = 'registeredIntakes' in r ? r.registeredIntakes : r.registeredExecutions;
  return r.activePlan === null && r.objective === null && r.lastReview === null && conteo === 0;
}
