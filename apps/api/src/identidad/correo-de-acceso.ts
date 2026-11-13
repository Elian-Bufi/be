import { Prisma } from '@prisma/client';

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

/**
 * La condición SQL «este método entra hoy con ese correo»: el LOCAL de ese correo o un GOOGLE con ese correo que no se
 * desvinculó (RF-004, DL-172: una cantidad impar de cambios es un retiro). La usan las búsquedas de una cuenta por su
 * correo para recuperar el acceso o atenderla (API-ACC-P1-01, API-ADM-14, 18 y 19): una cuenta de Google desvinculada ya
 * no identifica la cuenta, porque con ella no se entra (revisión de DL-172). `alias` es el de `metodo_de_acceso` en la
 * consulta. Distinto de `metodosDelCorreo`, que cuenta también los desvinculados: un correo no pasa a otra identidad (D-12).
 */
export function metodoVigenteDelCorreo(alias: string, correo: string): Prisma.Sql {
  const m = Prisma.raw(alias);
  return Prisma.sql`((${m}."tipo" = 'LOCAL' AND ${m}."referencia" = ${correo}) OR (${m}."tipo" = 'GOOGLE' AND ${m}."correo" = ${correo}
    AND (SELECT count(*) FROM "cambio_de_metodo_de_acceso" x WHERE x."metodo_de_acceso_id" = ${m}."id") % 2 = 0))`;
}
