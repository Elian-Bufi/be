import type { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;
type AreaConSeguimiento = 'NUTRICION' | 'ENTRENAMIENTO';

/**
 * Los hechos de revisión que la cartera (API-CAR-01) y la cola (API-DSH-02) leen igual que los servicios de revisión
 * (`pendiente` en `nutricion/revisiones.service.ts` y `entrenamiento/revisiones.service.ts`), para que no haya dos
 * definiciones de pendiente (09 §14; TB-13).
 */

/** La aplicación más reciente de una revisión de este Proceso registrada después de la expectativa (REG-06-150). */
export async function aplicacionPosteriorA(tx: Tx, area: AreaConSeguimiento, procesoId: string, expectativaRegistradaEn: Date): Promise<{ revisionId: string; momentoDeRegistro: Date } | null> {
  const donde = { revision: { procesoId, momentoDeRegistro: { gt: expectativaRegistradaEn } } };
  const orden = [{ momentoDeRegistro: 'desc' as const }, { id: 'desc' as const }];
  const seleccion = { revisionId: true, momentoDeRegistro: true } as const;
  return area === 'NUTRICION'
    ? tx.aplicacionDeRevision.findFirst({ where: donde, orderBy: orden, select: seleccion })
    : tx.aplicacionDeRevisionDeEntrenamiento.findFirst({ where: donde, orderBy: orden, select: seleccion });
}

/** La última revisión registrada del Proceso, con su aplicación si la tuvo (la misma que API-DSH-03 llama `lastReview`). */
export async function ultimaRevisionDelProceso(tx: Tx, area: AreaConSeguimiento, procesoId: string): Promise<{ id: string; momentoDeRegistro: Date; aplicadaEn: Date | null } | null> {
  const consulta = { where: { procesoId }, orderBy: [{ momentoDeRegistro: 'desc' as const }, { id: 'desc' as const }], select: { id: true, momentoDeRegistro: true, aplicacion: { select: { momentoDeRegistro: true } } } };
  const fila = area === 'NUTRICION' ? await tx.revisionNutricional.findFirst(consulta) : await tx.revisionDeEntrenamiento.findFirst(consulta);
  return fila ? { id: fila.id, momentoDeRegistro: fila.momentoDeRegistro, aplicadaEn: fila.aplicacion?.momentoDeRegistro ?? null } : null;
}

/**
 * Si el último seguimiento de la terna se cerró con una revisión «Finalizar» (REG-06-73): una decisión del
 * profesional, no un pendiente (TB-13). Un cierre por el fin del vínculo o de la cuenta no cuenta.
 */
export async function cerradoConFinalizar(tx: Tx, profesionalId: string, asesoradoId: string, area: AreaConSeguimiento): Promise<boolean> {
  const ultimo = await tx.procesoOperativo.findFirst({
    where: { profesionalId, asesoradoId, alcance: area },
    orderBy: [{ momentoDeRegistro: 'desc' }, { id: 'desc' }],
    select: { estado: true, motivoDeCierre: true },
  });
  return ultimo?.estado === 'CERRADO' && ultimo.motivoDeCierre === 'REVISION_FINALIZAR';
}
