import type { Prisma } from '@prisma/client';
import { DenegacionDelPdp, PdpService, type SolicitudDeDecision } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';

/**
 * Chequeo blando del PDP: se atrapa la denegación, se registra igual, y el resultado es `false` sin 404. Es el mismo
 * criterio de FRM-04/06/07 (`solicitudes.service.ts`, `respuestas.service.ts`): la fila es del titular y siempre
 * revelable (REG-06-213); lo que el PDP decide es si hoy sigue siendo respondable.
 */
export async function decideBlando(pdp: PdpService, tx: Prisma.TransactionClient, p: SolicitudDeDecision, ctx: ContextoDeSolicitud): Promise<boolean> {
  try {
    await pdp.decidirEnTransaccion(tx, p, ctx);
    return true;
  } catch (e) {
    if (e instanceof DenegacionDelPdp) {
      await pdp.registrarDenegacion(e);
      return false;
    }
    throw e;
  }
}
