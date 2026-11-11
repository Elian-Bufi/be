import { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;
type AreaConSeguimiento = 'NUTRICION' | 'ENTRENAMIENTO';

/**
 * Los hechos de revisión que la cartera (API-CAR-01) y la cola (API-DSH-02) leen igual que los servicios de revisión
 * (`pendiente` en `nutricion/revisiones.service.ts` y `entrenamiento/revisiones.service.ts`), para que no haya dos
 * definiciones de pendiente (09 §14; TB-13).
 */

/** La aplicación más reciente de una revisión de este Proceso registrada después de la expectativa (REG-06-150). */
export async function aplicacionPosteriorA(tx: Tx, area: AreaConSeguimiento, procesoId: string, expectativaRegistradaEn: Date): Promise<{ revisionId: string; momentoDeRegistro: Date } | null> {
  const donde = { revision: { procesoId, momentoDeRegistro: { gt: expectativaRegistradaEn } } };
  const orden = [{ momentoDeRegistro: 'desc' as const }, { id: 'desc' as const }];
  const seleccion = { revisionId: true, momentoDeRegistro: true } as const;
  return area === 'NUTRICION'
    ? tx.aplicacionDeRevision.findFirst({ where: donde, orderBy: orden, select: seleccion })
    : tx.aplicacionDeRevisionDeEntrenamiento.findFirst({ where: donde, orderBy: orden, select: seleccion });
}

/** La última revisión registrada del Proceso, con su aplicación si la tuvo (la misma que API-DSH-03 llama `lastReview`). */
export async function ultimaRevisionDelProceso(tx: Tx, area: AreaConSeguimiento, procesoId: string): Promise<{ id: string; momentoDeRegistro: Date; aplicadaEn: Date | null } | null> {
  const consulta = { where: { procesoId }, orderBy: [{ momentoDeRegistro: 'desc' as const }, { id: 'desc' as const }], select: { id: true, momentoDeRegistro: true, aplicacion: { select: { momentoDeRegistro: true } } } };
  const fila = area === 'NUTRICION' ? await tx.revisionNutricional.findFirst(consulta) : await tx.revisionDeEntrenamiento.findFirst(consulta);
  return fila ? { id: fila.id, momentoDeRegistro: fila.momentoDeRegistro, aplicadaEn: fila.aplicacion?.momentoDeRegistro ?? null } : null;
}

/**
 * Si el último seguimiento de la terna se cerró con una revisión «Finalizar» (REG-06-73): una decisión del
 * profesional, no un pendiente (TB-13). Un cierre por el fin del vínculo o de la cuenta no cuenta.
 */
export async function cerradoConFinalizar(tx: Tx, profesionalId: string, asesoradoId: string, area: AreaConSeguimiento): Promise<boolean> {
  const ultimo = await tx.procesoOperativo.findFirst({
    where: { profesionalId, asesoradoId, alcance: area },
    orderBy: [{ momentoDeRegistro: 'desc' }, { id: 'desc' }],
    select: { estado: true, motivoDeCierre: true },
  });
  return ultimo?.estado === 'CERRADO' && ultimo.motivoDeCierre === 'REVISION_FINALIZAR';
}

// ─── Los mismos hechos, por conjuntos (la cartera; TA-62) ───────────────────────────────────────

/** Las tablas de la revisión y de su aplicación, por área: identificadores fijos, nunca datos del pedido. */
const TABLAS_DE_REVISION: Readonly<Record<AreaConSeguimiento, { readonly revision: Prisma.Sql; readonly aplicacion: Prisma.Sql }>> = {
  NUTRICION: { revision: Prisma.raw('"revision_nutricional"'), aplicacion: Prisma.raw('"aplicacion_de_revision"') },
  ENTRENAMIENTO: { revision: Prisma.raw('"revision_de_entrenamiento"'), aplicacion: Prisma.raw('"aplicacion_de_revision_de_entrenamiento"') },
};

/**
 * `aplicacionPosteriorA` para varias expectativas de un área, en una sentencia: los Procesos cuya expectativa quedó
 * resuelta por una revisión del mismo Proceso registrada después de ella y aplicada (REG-06-150). Es la misma
 * comparación, hecha en la base con los momentos tal como están guardados. Recibe los identificadores de las
 * expectativas (`proxima_revision`); sin ninguna, no consulta.
 */
export async function procesosConAplicacionPosterior(tx: Tx, area: AreaConSeguimiento, expectativaIds: readonly string[]): Promise<Set<string>> {
  if (expectativaIds.length === 0) return new Set();
  const t = TABLAS_DE_REVISION[area];
  const filas = await tx.$queryRaw<{ procesoId: string }[]>`
    SELECT e."proceso_id"::text AS "procesoId"
      FROM "proxima_revision" e
     WHERE e."id" = ANY(${[...expectativaIds]}::uuid[])
       AND EXISTS (SELECT 1
                     FROM ${t.revision} r
                     JOIN ${t.aplicacion} a ON a."revision_id" = r."id"
                    WHERE r."proceso_id" = e."proceso_id"
                      AND r."momento_de_registro" > e."momento_de_registro")`;
  return new Set(filas.map((f) => f.procesoId));
}

/**
 * `cerradoConFinalizar` para varios asesorados de un profesional, en una sentencia: de cada asesorado y área, el último
 * seguimiento, con el mismo orden (el registro más reciente y, a igual momento, el identificador mayor), y si se cerró
 * con una revisión «Finalizar» (REG-06-73). La base elige el último de cada terna (`DISTINCT ON`). Devuelve, por área,
 * los asesorados cuyo último seguimiento se cerró así; sin asesorados, no consulta.
 */
export async function asesoradosCerradosConFinalizar(tx: Tx, profesionalId: string, asesorados: Readonly<Record<AreaConSeguimiento, readonly string[]>>): Promise<Record<AreaConSeguimiento, Set<string>>> {
  const cerrados: Record<AreaConSeguimiento, Set<string>> = { NUTRICION: new Set(), ENTRENAMIENTO: new Set() };
  const ramas = (['NUTRICION', 'ENTRENAMIENTO'] as const)
    .filter((area) => asesorados[area].length > 0)
    .map((area) => Prisma.sql`(p."alcance" = ${area}::"Alcance" AND p."asesorado_id" = ANY(${[...asesorados[area]]}::uuid[]))`);
  if (ramas.length === 0) return cerrados;
  const filas = await tx.$queryRaw<{ alcance: AreaConSeguimiento; asesoradoId: string; estado: string; motivoDeCierre: string | null }[]>`
    SELECT DISTINCT ON (p."alcance", p."asesorado_id") p."alcance"::text AS "alcance", p."asesorado_id"::text AS "asesoradoId", p."estado"::text AS "estado", p."motivo_de_cierre"::text AS "motivoDeCierre"
      FROM "proceso_operativo" p
     WHERE p."profesional_id" = ${profesionalId}::uuid
       AND (${Prisma.join(ramas, ' OR ')})
     ORDER BY p."alcance", p."asesorado_id", p."momento_de_registro" DESC, p."id" DESC`;
  for (const f of filas) if (f.estado === 'CERRADO' && f.motivoDeCierre === 'REVISION_FINALIZAR') cerrados[f.alcance].add(f.asesoradoId);
  return cerrados;
}
