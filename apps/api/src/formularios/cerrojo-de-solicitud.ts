import type { Prisma } from '@prisma/client';
import { esUuid } from './ejecutor';

/**
 * Toma la fila de la Solicitud en modo exclusivo (`FOR NO KEY UPDATE`) al empezar el efecto de las escrituras que la
 * cambian de hecho: responderla (API-FRM-07, API-FRI-04) y cargarle o reemplazarle la propuesta (API-FRI-06). Así la
 * carrera entre ellas queda en fila: quien espera relee después y encuentra la Respuesta o la propuesta que la otra dejó,
 * y nunca quedan juntas una Solicitud RESPONDED y una propuesta PENDIENTE (DL-164 D-3; REG-06-210). Sin el cerrojo, las
 * dos leían «sin Respuesta, sin propuesta» y las dos escribían.
 *
 * Solo si la Solicitud es del actor: sobre lo ajeno o lo inexistente no se toma nada y la operación sigue a su 404, sin
 * demorar a nadie. La fila se relee después, con el cerrojo tomado (READ COMMITTED: cada sentencia ve lo confirmado).
 *
 * En el orden único de bloqueos (prisma/concurrencia.ts) va antes que el PDP: ningún corte (revocar, pausar, finalizar,
 * cerrar) toma esta fila, así que no invierte el orden con nadie. Las claves foráneas que la nombran (la Respuesta, la
 * propuesta) toman `FOR KEY SHARE`, que no choca con `NO KEY UPDATE`. Y no es un UPDATE: `be_solo_agregar` no se entera.
 */
export async function tomarLaSolicitud(
  tx: Prisma.TransactionClient,
  formRequestId: string,
  de: { readonly asesoradoId: string } | { readonly profesionalId: string },
): Promise<void> {
  if (!esUuid(formRequestId)) return;
  if ('asesoradoId' in de) {
    await tx.$queryRaw`SELECT 1 FROM "solicitud_de_formulario" WHERE "id" = ${formRequestId}::uuid AND "asesorado_id" = ${de.asesoradoId}::uuid FOR NO KEY UPDATE`;
  } else {
    await tx.$queryRaw`SELECT 1 FROM "solicitud_de_formulario" WHERE "id" = ${formRequestId}::uuid AND "profesional_id" = ${de.profesionalId}::uuid FOR NO KEY UPDATE`;
  }
}
