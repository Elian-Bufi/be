import type { Prisma } from '@prisma/client';
import type { ResumenDeAntropometria, ResumenDeEntrenamiento, ResumenDeNutricion } from '@be/domain';
import { resolverVersionTerminal } from '@be/domain';
import { nombreVisibleDe } from '../entrenamiento/lectura-entrenamiento';
import type { ProcesoService } from '../proceso/proceso.service';

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
 * Vigente, en las tres cosas que este resumen llama así, es siempre la terminal de su propia cadena — nunca lo que
 * quedó congelado en la versión de plan que se activó, que puede haber quedado atrás (hallazgo de la auditoría de
 * cierre):
 * - el **plan** es `versionEfectivaId`, la relación explícita del Plan (INV-06-110), y además exige que el Proceso
 *   siga ABIERTO: una versión ACTIVADA no equivale a vigente si el seguimiento ya cerró (06:4297; DL-088 punto 18).
 * - el **objetivo** es la terminal de la sucesión del Objetivo (INV-06-107), no `versionDeObjetivoId` del plan: ese
 *   campo es una foto de qué objetivo regía cuando la versión se activó, y CAMBIAR_OBJETIVO no la actualiza.
 * - la **próxima revisión** es la expectativa vigente del Proceso (REG-06-146: terminal de la cadena de
 *   `ProximaRevision`, no la de fecha mayor), la misma que ya usa `review-context`; no la columna `proxima_revision`
 *   de la versión de plan, que solo la siembra al activar y no se toca después.
 */

export async function resumenDeNutricion(tx: Tx, procesos: ProcesoService, profesionalId: string, asesoradoId: string, periodo: Periodo): Promise<ResumenDeNutricion | null> {
  const plan = await tx.planNutricional.findUnique({
    where: { profesionalId_asesoradoId: { profesionalId, asesoradoId } },
    select: { versionEfectiva: { select: { id: true, momentoDeActivacion: true } } },
  });
  const efectiva = plan?.versionEfectiva ?? null;

  const [activePlan, objetivoFila, ultima] = await Promise.all([
    planVigente(tx, procesos, profesionalId, asesoradoId, 'NUTRICION', efectiva),
    objetivoEfectivoDeNutricion(tx, profesionalId, asesoradoId),
    ultimaRevision(tx, profesionalId, asesoradoId, 'NUTRICION'),
  ]);

  const ingestas = await tx.ingestaNutricional.aggregate({
    where: { asesoradoId, versionDePlan: { plan: { profesionalId } }, ...(enElPeriodo(periodo) ? { momentoDeOcurrencia: enElPeriodo(periodo) } : {}) },
    _count: { _all: true },
    _max: { momentoDeOcurrencia: true },
  });

  const resumen: ResumenDeNutricion = {
    activePlan,
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

export async function resumenDeEntrenamiento(tx: Tx, procesos: ProcesoService, profesionalId: string, asesoradoId: string, periodo: Periodo): Promise<ResumenDeEntrenamiento | null> {
  const plan = await tx.planDeEntrenamiento.findUnique({
    where: { profesionalId_asesoradoId: { profesionalId, asesoradoId } },
    select: { versionEfectiva: { select: { id: true, momentoDeActivacion: true } } },
  });
  const efectiva = plan?.versionEfectiva ?? null;

  const [activePlan, objetivoFila, ultima] = await Promise.all([
    planVigente(tx, procesos, profesionalId, asesoradoId, 'ENTRENAMIENTO', efectiva),
    objetivoEfectivoDeEntrenamiento(tx, profesionalId, asesoradoId),
    ultimaRevision(tx, profesionalId, asesoradoId, 'ENTRENAMIENTO'),
  ]);

  const ejecuciones = await tx.ejecucionDeEntrenamiento.aggregate({
    where: { asesoradoId, versionDePlan: { plan: { profesionalId } }, ...(enElPeriodo(periodo) ? { momentoDeOcurrencia: enElPeriodo(periodo) } : {}) },
    _count: { _all: true },
    _max: { momentoDeOcurrencia: true },
  });

  const resumen: ResumenDeEntrenamiento = {
    activePlan,
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

/**
 * El plan «vigente» para el resumen: la versión activada, con la próxima revisión que rige hoy en el Proceso, y solo
 * si ese Proceso sigue abierto. Cerrado el seguimiento (FINALIZAR), el plan deja de presentarse como vigente aunque
 * la versión activada siga siendo, técnicamente, la última (06:4297; DL-088 punto 18).
 */
async function planVigente(
  tx: Tx,
  procesos: ProcesoService,
  profesionalId: string,
  asesoradoId: string,
  alcance: 'NUTRICION' | 'ENTRENAMIENTO',
  efectiva: { id: string; momentoDeActivacion: Date | null } | null,
): Promise<{ planVersionId: string; activatedAt: string; nextReviewAt: string | null } | null> {
  if (!efectiva || !efectiva.momentoDeActivacion) return null;
  const proceso = await tx.procesoOperativo.findFirst({ where: { profesionalId, asesoradoId, alcance, estado: 'ABIERTO' }, select: { id: true } });
  if (!proceso) return null;
  const expectativa = await procesos.proximaRevisionVigente(tx, proceso.id);
  return { planVersionId: efectiva.id, activatedAt: efectiva.momentoDeActivacion.toISOString(), nextReviewAt: expectativa?.fechaObjetivo?.toISOString().slice(0, 10) ?? null };
}

/** El objetivo nutricional efectivo: la terminal de su sucesión (INV-06-107), igual que lee API-NUT-06. */
async function objetivoEfectivoDeNutricion(tx: Tx, profesionalId: string, asesoradoId: string) {
  const objetivo = await tx.objetivoNutricional.findUnique({ where: { profesionalId_asesoradoId: { profesionalId, asesoradoId } }, select: { id: true } });
  if (!objetivo) return null;
  const versiones = await tx.versionDeObjetivoNutricional.findMany({ where: { objetivoId: objetivo.id }, select: { id: true, objetivoId: true, predecesoraId: true, requerimientoEnergetico: true, autorId: true } });
  const terminal = resolverVersionTerminal(versiones.map((v) => ({ id: v.id, objetoId: v.objetivoId, predecesoraId: v.predecesoraId })));
  return terminal.tipo === 'TERMINAL' ? (versiones.find((v) => v.id === terminal.terminalId) ?? null) : null;
}

/** El objetivo de entrenamiento efectivo: la terminal de su sucesión (INV-06-107), igual que lee API-TRN-06. */
async function objetivoEfectivoDeEntrenamiento(tx: Tx, profesionalId: string, asesoradoId: string) {
  const objetivo = await tx.objetivoDeEntrenamiento.findUnique({ where: { profesionalId_asesoradoId: { profesionalId, asesoradoId } }, select: { id: true } });
  if (!objetivo) return null;
  const versiones = await tx.versionDeObjetivoDeEntrenamiento.findMany({ where: { objetivoId: objetivo.id }, select: { id: true, objetivoId: true, predecesoraId: true, objetivo: true, autorId: true } });
  const terminal = resolverVersionTerminal(versiones.map((v) => ({ id: v.id, objetoId: v.objetivoId, predecesoraId: v.predecesoraId })));
  return terminal.tipo === 'TERMINAL' ? (versiones.find((v) => v.id === terminal.terminalId) ?? null) : null;
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
