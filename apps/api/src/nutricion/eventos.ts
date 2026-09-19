import type { Procedencia } from '@be/domain';
import type { Prisma, TipoDeEventoDeNutricion } from '@prisma/client';

/**
 * Hecho del circuito nutricional (T-06-N08), append-only. Las transiciones de la Versión de plan lo exigen en la
 * misma transacción (trigger `version_de_plan_nutricional_con_hecho`), y todos alimentan el futuro timeline (DL-054).
 */
export async function registrarEventoDeNutricion(
  tx: Prisma.TransactionClient,
  e: {
    tipo: TipoDeEventoDeNutricion;
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
  await tx.eventoDeNutricion.create({
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
