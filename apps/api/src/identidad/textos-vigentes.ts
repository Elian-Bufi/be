import {
  CAPACIDAD_TEXTOS_VIGENTES,
  pasosDeLosTextos,
  TIPO_DEL_TEXTO_A_ACEPTAR,
  VERSION_VIGENTE,
  type AceptacionDeVersionResponse,
  type CapacidadDeCliente,
  type PasoPendiente,
  type Procedencia,
  type TextoAAceptar,
  type TipoDeTexto,
  type VersionDeTexto,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';

type Tx = Prisma.TransactionClient;
/** Las versiones vigentes por tipo. Por omisión, las de @be/domain; la prueba de la publicación pasa otras. */
export type Vigentes = Readonly<Record<TipoDeTexto, Pick<VersionDeTexto, 'id'>>>;

/**
 * UF-05 de WP-USO-FINAL (DL-169) · los pasos de textos de API-ACC-07: solo para un cliente que sabe mostrarlos
 * (`CAPACIDAD_TEXTOS_VIGENTES`); la APK 0.24 no la declara y nunca los recibe. Compara la última aceptación vigente de los
 * términos y de la privacidad con la versión vigente.
 */
export async function pasosDeTextosPendientes(tx: Tx, identidadId: string, capacidades: ReadonlySet<CapacidadDeCliente>, vigentes: Vigentes = VERSION_VIGENTE): Promise<PasoPendiente[]> {
  if (!capacidades.has(CAPACIDAD_TEXTOS_VIGENTES)) return [];
  const ultimas = await tx.$queryRaw<{ tipo: string; version: string }[]>`
    SELECT DISTINCT ON ("tipo") "tipo"::text AS "tipo", "version_de_texto_id" AS "version"
      FROM "acto_registrable"
     WHERE "identidad_id" = ${identidadId}::uuid AND "tipo" IN ('TERMINOS', 'PRIVACIDAD_INFO') AND "estado" = 'VIGENTE'
     ORDER BY "tipo", "momento_de_registro" DESC, "id"`;
  const de = (tipo: string): string | null => ultimas.find((u) => u.tipo === tipo)?.version ?? null;
  return pasosDeLosTextos({ TERMINOS: de('TERMINOS'), PRIVACIDAD_INFO: de('PRIVACIDAD_INFO') }, vigentes);
}

/**
 * UF-05 · API-ACC-08: registra la aceptación de la versión vigente de un texto, con la versión que la pantalla mostró
 * (08 §12.2). Otra versión, el 422 de su texto. Si la última aceptación vigente de ese texto ya es esa versión, devuelve ese
 * acto y no crea otro (`creado: false`). Toma la identidad en modo exclusivo, así dos aceptaciones simultáneas no crean dos
 * actos.
 */
export async function registrarAceptacionVigente(
  tx: Tx,
  p: { readonly identidadId: string; readonly texto: TextoAAceptar; readonly versionId: string; readonly ctx: ContextoDeSolicitud; readonly procedencia: Procedencia; readonly momento: Date },
  vigentes: Vigentes = VERSION_VIGENTE,
): Promise<{ readonly creado: boolean; readonly respuesta: AceptacionDeVersionResponse }> {
  const tipo = TIPO_DEL_TEXTO_A_ACEPTAR[p.texto];
  const rechazo = tipo === 'TERMINOS' ? errores.versionDeTerminosNoAceptable : errores.versionDePrivacidadNoAceptable;
  if (p.versionId !== vigentes[tipo].id) throw rechazo();
  const version = await tx.versionDeTexto.findUnique({ where: { id: p.versionId }, select: { id: true, tipo: true, hash: true, finalidad: true } });
  if (!version || version.tipo !== tipo) throw rechazo();
  await tx.$queryRaw`SELECT 1 FROM "identidad" WHERE "id" = ${p.identidadId}::uuid FOR NO KEY UPDATE`;
  const [ultima] = await tx.$queryRaw<{ id: string; version: string; momento: Date }[]>`
    SELECT "id"::text AS "id", "version_de_texto_id" AS "version", "momento_de_registro" AS "momento"
      FROM "acto_registrable"
     WHERE "identidad_id" = ${p.identidadId}::uuid AND "tipo" = ${tipo}::"TipoDeActoRegistrable" AND "estado" = 'VIGENTE'
     ORDER BY "momento_de_registro" DESC, "id" LIMIT 1`;
  if (ultima && ultima.version === version.id) {
    return { creado: false, respuesta: { data: { actId: ultima.id, text: p.texto, versionId: version.id, acceptedAt: new Date(ultima.momento).toISOString() } } };
  }
  const acto = await tx.actoRegistrable.create({
    data: {
      identidadId: p.identidadId,
      tipo,
      versionDeTextoId: version.id,
      hashDelTexto: version.hash,
      finalidad: version.finalidad,
      superficie: p.ctx.superficie,
      direccionIp: p.ctx.direccionIp,
      agenteDeUsuario: p.ctx.agenteDeUsuario,
      actorId: p.identidadId,
      autoriaId: p.identidadId,
      procedencia: p.procedencia as unknown as Prisma.InputJsonValue,
      momentoDeOcurrencia: p.momento,
    },
    select: { id: true, momentoDeRegistro: true },
  });
  return { creado: true, respuesta: { data: { actId: acto.id, text: p.texto, versionId: version.id, acceptedAt: acto.momentoDeRegistro.toISOString() } } };
}
