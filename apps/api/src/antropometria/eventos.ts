import type { Procedencia } from '@be/domain';
import type { Prisma, TipoDeEventoDeAntropometria } from '@prisma/client';

/** Hecho de B-10, append-only: alimenta el futuro timeline igual que los de nutrición (DL-054). */
export async function registrarEventoDeAntropometria(
  tx: Prisma.TransactionClient,
  e: {
    tipo: TipoDeEventoDeAntropometria;
    evaluacionId: string | null;
    medicionId: string | null;
    actorId: string;
    procedencia: Procedencia;
    momento: Date;
  },
): Promise<void> {
  await tx.eventoDeAntropometria.create({
    data: {
      tipo: e.tipo,
      evaluacionId: e.evaluacionId,
      medicionId: e.medicionId,
      actorId: e.actorId,
      procedencia: e.procedencia as unknown as Prisma.InputJsonValue,
      momentoDeOcurrencia: e.momento,
    },
  });
}
