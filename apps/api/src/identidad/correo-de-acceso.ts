import type { Prisma } from '@prisma/client';

/**
 * Un correo es de una sola identidad, sea el de un método LOCAL (su `referencia`) o el de uno GOOGLE (su `correo`): RF-001
 * («un correo ya asociado no produce una segunda cuenta») e INV-06-21 (un método de acceso no crea una identidad
 * paralela). DL-138.
 *
 * Ningún índice único lo puede expresar, porque la misma identidad sí tiene los dos métodos con el mismo correo (es la
 * vinculación). Por eso toda alta y toda vinculación toman este cerrojo transaccional por correo antes de mirar si el correo
 * está libre: dos pedidos simultáneos con el mismo correo se ordenan, y el segundo ve lo que confirmó el primero. El
 * disparador `metodo_de_acceso_sin_identidad_paralela` toma el mismo cerrojo y repite la verificación en la base.
 */
export async function bloquearCorreoDeAcceso(tx: Prisma.TransactionClient, correo: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${PREFIJO_DEL_CERROJO_DE_CORREO}${correo}`}, 0))`;
}

/** La clave del cerrojo es este prefijo y el correo: la misma en el disparador (lo verifica schema.int-spec). */
export const PREFIJO_DEL_CERROJO_DE_CORREO = 'be:correo-de-acceso:';

/** Los métodos de acceso que usan ese correo (normalizado), de cualquier identidad. */
export function metodosDelCorreo(tx: Prisma.TransactionClient, correo: string) {
  return tx.metodoDeAcceso.findMany({
    where: { OR: [{ tipo: 'LOCAL', referencia: correo }, { tipo: 'GOOGLE', correo }] },
    select: { id: true, identidadId: true, tipo: true, referencia: true },
  });
}
