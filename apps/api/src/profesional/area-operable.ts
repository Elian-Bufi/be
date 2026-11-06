import { Prisma } from '@prisma/client';
import type { Alcance } from '@be/domain';

type Cliente = Pick<Prisma.TransactionClient, '$queryRaw'>;

/**
 * Si la identidad puede operar un área (o alguna, sin `alcance`): verificada y con la habilitación concedida, lo mismo que
 * exige el PDP. Es el criterio de lo que un profesional usa sin titular de por medio: catálogos, plantillas, recetas,
 * habituales, imágenes, métodos y vistas.
 *
 * WP-ADMINISTRACION (DL-155): las filas de la verificación y de la habilitación se toman **en modo compartido** dentro de
 * la transacción de quien llama, como las toma el PDP (`be_bloquear_lo_que_corta`). Una decisión de Administración las toma
 * en modo exclusivo: una operación profesional en curso termina antes de la suspensión o empieza después y la ve; nunca
 * queda en el medio. Fuera de una transacción, el bloqueo dura lo que la sentencia, y la lectura es la del momento.
 */
export async function puedeOperarArea(cliente: Cliente, identidadId: string, alcance?: Alcance): Promise<boolean> {
  const filtro = alcance ? Prisma.sql`AND vp."alcance" = ${alcance}::"Alcance"` : Prisma.empty;
  const filas = await cliente.$queryRaw<{ ok: boolean }[]>`
    SELECT (vp."estado" = 'VERIFICADO' AND h."estado" = 'CONCEDIDA') AS "ok"
      FROM "verificacion_profesional" vp
      JOIN "habilitacion" h ON h."identidad_id" = vp."identidad_id" AND h."alcance" = vp."alcance"
     WHERE vp."identidad_id" = ${identidadId}::uuid ${filtro}
     ORDER BY vp."id"
       FOR SHARE OF vp, h`;
  return filas.some((f) => f.ok === true);
}
