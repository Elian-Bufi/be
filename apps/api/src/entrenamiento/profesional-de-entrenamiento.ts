import type { Prisma } from '@prisma/client';
import { errores } from '../http/errores';

type Cliente = Pick<Prisma.TransactionClient, '$queryRaw'>;

/**
 * Si la identidad tiene Entrenamiento verificado y habilitado (sin lanzar). Es el criterio del catálogo propio (RF-037):
 * lo usan el catálogo, las plantillas, los habituales, los ejercicios propios con su imagen (DL-123) y la intención de
 * subida de una imagen de ejercicio (API-MED-01 con EXERCISE_REFERENCE), que vive en el módulo de medios.
 */
export async function esProfesionalDeEntrenamiento(cliente: Cliente, identidadId: string): Promise<boolean> {
  const [fila] = await cliente.$queryRaw<{ ok: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM "verificacion_profesional" vp
        JOIN "habilitacion" h ON h."identidad_id" = vp."identidad_id" AND h."alcance" = vp."alcance" AND h."estado" = 'CONCEDIDA'
       WHERE vp."identidad_id" = ${identidadId}::uuid AND vp."alcance" = 'ENTRENAMIENTO' AND vp."estado" = 'VERIFICADO') AS "ok"`;
  return fila?.ok === true;
}

/** Solo un profesional de Entrenamiento verificado y habilitado. Otro actor: 403 (ya es participante: no filtra nada). */
export async function exigirProfesionalDeEntrenamiento(cliente: Cliente, identidadId: string): Promise<void> {
  if (!(await esProfesionalDeEntrenamiento(cliente, identidadId))) throw errores.accionNoPermitida();
}
