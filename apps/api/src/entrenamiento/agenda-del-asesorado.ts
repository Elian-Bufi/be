import {
  agendaDelDia,
  CONDICION_DE_SESION_API,
  resolverVistaEfectiva,
  type AgendaDeEntrenamiento,
  type AgendaDelDia,
  type CondicionDeSesion,
  type EjecucionParaLaAgenda,
  type InstantaneaDeEntrenamiento,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { fechaLocalEn } from '../nutricion/zona';

type Tx = Prisma.TransactionClient;

/** Cuántos días antes de hoy se buscan ejecuciones: más que la ventana con la que la agenda resuelve las fechas del día. */
const DIAS_DE_EJECUCIONES = 35;

const comoFecha = (f: string): Date => new Date(`${f}T00:00:00.000Z`);
const fechaDe = (d: Date): string => d.toISOString().slice(0, 10);
const restarDias = (f: string, dias: number): string => fechaDe(new Date(comoFecha(f).getTime() - dias * 86_400_000));

/** Una ejecución registrada, con su identificador y la condición que rige después de las correcciones. */
export interface EjecucionDeLaAgenda extends EjecucionParaLaAgenda {
  readonly executionId: string;
}

export interface AgendaDelAsesorado {
  readonly agenda: AgendaDeEntrenamiento;
  readonly dia: AgendaDelDia<EjecucionDeLaAgenda>;
}

/** La versión activada con lo que la agenda necesita: su instantánea y desde cuándo rige. */
export interface VersionParaLaAgenda {
  readonly activacion: Date;
  readonly instantanea: InstantaneaDeEntrenamiento;
}

/**
 * WP-AGENDA-DE-ENTRENAMIENTO (DEUDA_LEGAJO DL-137): la agenda del día de una persona con la versión que rige, y las
 * ejecuciones que resuelven cada fecha prevista. La usan la agenda del día (API-AGE-01) y los recordatorios de entrenamiento.
 * - Una versión sin agenda no tiene fechas previstas: `null`, y la persona elige la sesión como antes (DL-077).
 * - Las ejecuciones se buscan por las sesiones de la agenda, en cualquier versión del plan: una sucesora conserva los
 *   identificadores de las sesiones (REG-06-111). La regla pura descarta las anteriores a la versión.
 * - La condición es la que rige después de las correcciones (06:5253): corregir una «no realizada» a hecha la sigue
 *   resolviendo, y la pantalla muestra la condición vigente.
 */
export async function agendaDeLaVersion(tx: Tx, asesoradoId: string, version: VersionParaLaAgenda, hoy: string, zona: string): Promise<AgendaDelAsesorado | null> {
  const agenda = version.instantanea.contenido.agenda;
  if (!agenda || agenda.sessions.length === 0) return null;
  const filas = await tx.ejecucionDeEntrenamiento.findMany({
    where: {
      asesoradoId,
      sesionPlanificadaId: { in: agenda.sessions.map((s) => s.sessionId) },
      fechaLocal: { gte: comoFecha(restarDias(hoy, DIAS_DE_EJECUCIONES)), lte: comoFecha(hoy) },
    },
    select: { id: true, sesionPlanificadaId: true, fechaLocal: true, condicion: true, correcciones: { select: { id: true, correccionPreviaId: true, contenido: true } } },
  });
  const ejecuciones: EjecucionDeLaAgenda[] = filas.map((x) => {
    const vista = resolverVistaEfectiva(x.id, x.correcciones.map((c) => ({ id: c.id, originalId: x.id, correccionPreviaId: c.correccionPreviaId })));
    const corregida = vista.tipo === 'CORREGIDA' ? x.correcciones.find((c) => c.id === vista.id) : undefined;
    const condicion = corregida ? (corregida.contenido as unknown as { condicion: CondicionDeSesion }).condicion : x.condicion;
    return { executionId: x.id, sessionId: x.sesionPlanificadaId, date: fechaDe(x.fechaLocal), condition: CONDICION_DE_SESION_API[condicion] };
  });
  return { agenda, dia: agendaDelDia(agenda, ejecuciones, hoy, fechaLocalEn(version.activacion, zona)) };
}
