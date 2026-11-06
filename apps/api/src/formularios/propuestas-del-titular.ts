import type { Procedencia } from '@be/domain';
import { Prisma } from '@prisma/client';
import { registrarEventoDeFormulario } from './eventos';

/**
 * Las propuestas PENDIENTE del titular se retiran cuando él corta el tratamiento de sus datos de salud (revoca su A3,
 * API-CON-08): lo no confirmado se borra (DL-164 D-6) y no puede quedar esperando una confirmación que ya no va a
 * poder dar por la API (FRI-04 pasa por el PDP, que sin A3 deniega). Cada una queda RETIRADA, con su contenido en NULL
 * y su evento de retiro con el actor del corte: la persona, no el profesional que la cargó. Para quien la cargó se ve
 * igual que un retiro (`lastProposalOutcome: WITHDRAWN`), si alguna vez vuelve a estar autorizado.
 *
 * Se llama con el acto A3 ya tomado en modo exclusivo (el orden «acto A3 → propuesta» es el mismo con que confirmar,
 * retirar o reemplazar la escriben después del PDP). Si la persona la rechazó en el medio (FRI-08 no toma el A3), la
 * fila ya no está PENDIENTE y no se toca: el desenlace es el suyo.
 */
export async function retirarPropuestasPendientesDelTitular(
  tx: Prisma.TransactionClient,
  p: { readonly titularId: string; readonly actorId: string; readonly procedencia: Procedencia; readonly momento: Date },
): Promise<number> {
  const pendientes = await tx.propuestaDeRespuestaDeFormulario.findMany({
    where: { estado: 'PENDIENTE', solicitud: { asesoradoId: p.titularId } },
    select: { id: true, version: true, profesionalId: true },
    orderBy: { id: 'asc' },
  });
  let retiradas = 0;
  for (const pendiente of pendientes) {
    const r = await tx.propuestaDeRespuestaDeFormulario.updateMany({
      where: { id: pendiente.id, estado: 'PENDIENTE', version: pendiente.version },
      data: { estado: 'RETIRADA', contenido: Prisma.DbNull, resueltaEn: p.momento },
    });
    if (r.count !== 1) continue;
    await registrarEventoDeFormulario(tx, {
      tipo: 'PropuestaDeRespuestaRetirada',
      profesionalId: pendiente.profesionalId,
      asesoradoId: p.titularId,
      recurso: { tipo: 'PropuestaDeRespuestaDeFormulario', id: pendiente.id },
      estadoPrevio: 'PENDIENTE',
      estadoPosterior: 'RETIRADA',
      actorId: p.actorId,
      procedencia: p.procedencia,
      momento: p.momento,
    });
    retiradas++;
  }
  return retiradas;
}
