import { DIAS_DE_VIGENCIA_DEL_CANDIDATO, type FuenteExterna, type LicenciaExterna, type ProcedenciaDeCandidato } from '@be/domain';
import type { Alcance, CandidatoDeImportacion, Prisma, ResolucionDeCandidato } from '@prisma/client';
import { esUuid } from '../plataforma/ejecutor';
import { errores } from '../http/errores';

type Tx = Prisma.TransactionClient;

/**
 * Lo común a los candidatos de los dos proveedores (09v12 §3, §8: «patrón interno común, no un payload público
 * artificialmente genérico»). El contrato público sigue siendo uno por dominio.
 */

export const vencimientoDe = (recibidoEn: Date): Date => new Date(recibidoEn.getTime() + DIAS_DE_VIGENCIA_DEL_CANDIDATO * 24 * 60 * 60 * 1000);

/** La procedencia pública del candidato: qué se recibió, de quién, cuándo y con qué licencia. */
export function procedenciaDeCandidato(c: CandidatoDeImportacion): ProcedenciaDeCandidato {
  return {
    provider: c.proveedor,
    externalId: c.idExterno,
    receivedAt: c.recibidoEn.toISOString(),
    contentDigest: c.huellaDeLoRecibido,
    license: c.licencia as unknown as LicenciaExterna,
    sourceUrl: c.urlDeOrigen,
  };
}

/** Lo que queda en la procedencia del elemento incorporado, para que el catálogo diga de dónde vino (RF-060). */
export function fuenteExternaDe(c: CandidatoDeImportacion): FuenteExterna {
  return { provider: c.proveedor, externalId: c.idExterno, receivedAt: c.recibidoEn.toISOString(), license: c.licencia as unknown as LicenciaExterna };
}

/**
 * El candidato, si es del actor y del dominio que lo pide, bloqueado para resolverlo: la resolución es única y dos
 * pedidos concurrentes se ordenan acá (la base igual lo sostiene con su índice único). Para cualquier otro actor —o si
 * no existe, o es del otro dominio— es el mismo 404 (09v12:103-105: «solo puede resolverse por actor autorizado»).
 */
export async function candidatoPropio(tx: Tx, candidateId: string, actorId: string, alcance: Alcance): Promise<CandidatoDeImportacion & { resolucion: ResolucionDeCandidato | null }> {
  if (!esUuid(candidateId)) throw errores.recursoNoEncontrado();
  await tx.$queryRaw`SELECT 1 FROM "candidato_de_importacion" WHERE "id" = ${candidateId}::uuid FOR UPDATE`;
  const c = await tx.candidatoDeImportacion.findUnique({ where: { id: candidateId }, include: { resolucion: true } });
  if (!c || c.profesionalId !== actorId || c.alcance !== alcance) throw errores.recursoNoEncontrado();
  return c;
}

/** Ya resuelto o vencido (D-C): no se resuelve de nuevo. */
export function exigirResoluble(c: CandidatoDeImportacion & { resolucion: ResolucionDeCandidato | null }, ahora: Date): void {
  if (c.resolucion !== null || c.venceEn.getTime() < ahora.getTime()) throw errores.candidatoNoResoluble();
}

/** Un fundamento en blanco no es un fundamento: se guarda `null` (la base exige que no esté vacío). */
export const fundamentoDe = (texto: string | null | undefined): string | null => (texto && texto.trim() !== '' ? texto.trim() : null);
