import type { Procedencia } from '@be/domain';
import type { Prisma, TipoDeEventoDeEntrenamiento } from '@prisma/client';

/**
 * Hecho del circuito de entrenamiento, append-only. Las transiciones de la versión de plan lo exigen en la misma
 * transacción (trigger `be_transicion_con_hecho_wp06`), y todos alimentan el futuro timeline, como en nutrición.
 */
export async function registrarEventoDeEntrenamiento(
  tx: Prisma.TransactionClient,
  e: {
    tipo: TipoDeEventoDeEntrenamiento;
    profesionalId: string | null;
    asesoradoId: string | null;
    recurso: { tipo: string; id: string };
    estadoPrevio: string | null;
    estadoPosterior: string | null;
    actorId: string;
    procedencia: Procedencia;
    momento: Date | null;
  },
): Promise<void> {
  await tx.eventoDeEntrenamiento.create({
    data: {
      tipo: e.tipo,
      profesionalId: e.profesionalId,
      asesoradoId: e.asesoradoId,
      recursoTipo: e.recurso.tipo,
      recursoId: e.recurso.id,
      estadoPrevio: e.estadoPrevio,
      estadoPosterior: e.estadoPosterior,
      actorId: e.actorId,
      procedencia: e.procedencia as unknown as Prisma.InputJsonValue,
      momentoDeOcurrencia: e.momento,
    },
  });
}
