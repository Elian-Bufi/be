import type { Prisma } from '@prisma/client';
import { errores } from '../http/errores';

/**
 * Lo propio del titular exige su A3 vigente: revocado o nunca otorgado, se suspende toda operación sensible del servicio
 * para ese titular, también la lectura de su propia historia (08:406). La respuesta es `403 ACTION_FORBIDDEN`.
 * El A3 es del titular: sobre un recurso con id, primero se ve si es suyo (lo ajeno y lo inexistente siguen dando el mismo
 * 404, sin revelar nada) y, sobre lo propio, el A3 va antes que cualquier otra regla de la operación (09 §36).
 *
 * - **Sin bloqueo** (por defecto): el chequeo de las lecturas propias y de lo que después pasa por el PDP. Es el mismo
 *   criterio de `nutricion/ingestas.service.ts:listarPropias` y de la historia de entrenamiento (DL-089). Una lectura
 *   que ya empezó cuando se confirma la revocación puede terminar.
 * - **Con bloqueo** (`bloquear: true`): toma el acto A3 en modo compartido, como el PDP. Lo usa una escritura propia que
 *   no pasa por el PDP (rectificar una respuesta, API-FRM-08; dejar incompleta una corrida, API-TIE-01): una revocación en
 *   curso la hace esperar y, al confirmarse, la deniega. El acto A3 es el último del orden único de bloqueos
 *   (prisma/concurrencia.ts) y la revocación solo bloquea ese acto, así que tomarlo primero no invierte el orden con nadie.
 *
 * DL-089 (entrenamiento) y DL-115 (antropometría y formularios).
 */
export async function exigirA3Vigente(tx: Prisma.TransactionClient, identidadId: string, opciones: { readonly bloquear?: boolean } = {}): Promise<void> {
  if (!(await tieneA3Vigente(tx, identidadId, opciones))) throw errores.accionNoPermitida();
}

/**
 * Lo mismo, sin lanzar: para la operación que, sin A3, no responde un error sino otra cosa (la sesión en curso, API-TIE-04,
 * no ofrece ninguna) o sigue por otro camino (dejar incompleta una corrida, API-TIE-01, vuelve al PDP de su profesional).
 */
export async function tieneA3Vigente(tx: Prisma.TransactionClient, identidadId: string, opciones: { readonly bloquear?: boolean } = {}): Promise<boolean> {
  if (opciones.bloquear) {
    const filas = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id"::text FROM "acto_registrable"
       WHERE "identidad_id" = ${identidadId}::uuid AND "tipo" = 'DATOS_SALUD_BE' AND "estado" = 'VIGENTE' FOR SHARE`;
    return filas.length > 0;
  }
  const [a3] = await tx.$queryRaw<{ vigente: boolean }[]>`
    SELECT EXISTS (SELECT 1 FROM "acto_registrable" WHERE "identidad_id" = ${identidadId}::uuid AND "tipo" = 'DATOS_SALUD_BE' AND "estado" = 'VIGENTE') AS "vigente"`;
  return a3?.vigente === true;
}
