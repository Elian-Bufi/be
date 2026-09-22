import type { Procedencia } from '@be/domain';
import type { Prisma, TipoDeEventoDeFormulario } from '@prisma/client';

/** Hecho de CAP-DAT, append-only, mismo patrón que el resto de los dominios (audit REQUIRED_SAME_TX, 09 §22). */
export async function registrarEventoDeFormulario(
  tx: Prisma.TransactionClient,
  e: {
    tipo: TipoDeEventoDeFormulario;
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
  await tx.eventoDeFormulario.create({
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
