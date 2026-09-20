import type { Prisma } from '@prisma/client';
import { errores } from '../http/errores';

/**
 * La capacidad antropométrica verificada y habilitada. Es lo que autoriza el catálogo y los métodos, que son
 * metadatos de la capacidad y no datos de una persona: ahí no hay titular sobre el que decidir, así que no hay PDP
 * que consultar.
 *
 * No se exige ninguna Especialidad: «una identidad con cero Especialidades, Capacidad antropométrica verificada y
 * Habilitación antropométrica efectiva» es válida (06 §8.10), porque la capacidad es transversal y nunca una tercera
 * Especialidad (06:2774).
 */
export async function exigirCapacidadAntropometrica(cliente: Prisma.TransactionClient, identidadId: string): Promise<void> {
  const [fila] = await cliente.$queryRaw<{ ok: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM "verificacion_profesional" vp
        JOIN "habilitacion" h ON h."identidad_id" = vp."identidad_id" AND h."alcance" = vp."alcance" AND h."estado" = 'CONCEDIDA'
       WHERE vp."identidad_id" = ${identidadId}::uuid AND vp."alcance" = 'ANTROPOMETRIA' AND vp."estado" = 'VERIFICADO') AS "ok"`;
  if (!fila?.ok) throw errores.accionNoPermitida();
}
