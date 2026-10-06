import type { Prisma } from '@prisma/client';
import { errores } from '../http/errores';

type Cliente = Pick<Prisma.TransactionClient, '$queryRaw'>;

/** Si la identidad tiene Nutrición verificada y habilitada (sin lanzar). */
export async function esProfesionalDeNutricion(cliente: Cliente, identidadId: string): Promise<boolean> {
  const [fila] = await cliente.$queryRaw<{ ok: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM "verificacion_profesional" vp
        JOIN "habilitacion" h ON h."identidad_id" = vp."identidad_id" AND h."alcance" = vp."alcance" AND h."estado" = 'CONCEDIDA'
       WHERE vp."identidad_id" = ${identidadId}::uuid AND vp."alcance" = 'NUTRICION' AND vp."estado" = 'VERIFICADO') AS "ok"`;
  return fila?.ok === true;
}

/**
 * Solo un profesional con Nutrición verificada y habilitada usa el catálogo nutricional, importa, arma plantillas,
 * recetas y sus imágenes (WP-04, WP-08, DL-108, DL-119). Otro actor: 403.
 */
export async function exigirProfesionalDeNutricion(cliente: Cliente, identidadId: string): Promise<void> {
  if (!(await esProfesionalDeNutricion(cliente, identidadId))) throw errores.accionNoPermitida();
}
