import { Injectable } from '@nestjs/common';
import {
  BuscarVerificadosRequestSchema,
  CodigoDeError,
  ConsultarAlimentosParaRevisarRequestSchema,
  DecidirSobreAlimentoRequestSchema,
  GRUPO_API,
  type AlimentoParaRevisar,
  type AlimentoParaRevisarResponse,
  type ListaDeAlimentosParaRevisarResponse,
  type ListaDeVerificadosResponse,
  type ValidationIssue,
} from '@be/domain';
import { Prisma, type ResultadoDeRevisionDeAlimento } from '@prisma/client';
import type { ActorAdministrativo } from '../administracion/sesion-administrativa.guard';
import { CON_MARCA, SIN_MARCA, sinMarcas } from '../http/busqueda';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { esUuid } from '../plataforma/ejecutor';
import { IdempotenciaService, type ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import { esToken } from '../vinculo/lectura';
import { leerAlimentosCargados, RECURSO_ALIMENTO, revisionDelAlimento, type FilaDeAlimentoCargado } from './alimentos.service';
import { ALIMENTO_COMPARTIDO, CatalogoService } from './catalogo.service';

type Tx = Prisma.TransactionClient;
const CASO_DE_USO = 'UC-P10';

/** La versión vigente `v` está certificada: la última decisión es CERTIFICADO y revisó esta versión. Usa `rev` de la lectura. */
const CERTIFICADA = Prisma.sql`COALESCE(rev."resultado" = 'CERTIFICADO' AND rev."version_id" = v."id", FALSE)`;
const EQUIVALENTE = Prisma.sql`COALESCE(rev."resultado" = 'EQUIVALENTE', FALSE)`;
const ESTADO: Readonly<Record<'PENDING' | 'CERTIFIED' | 'EQUIVALENT', Prisma.Sql>> = {
  PENDING: Prisma.sql`NOT ${CERTIFICADA} AND NOT ${EQUIVALENTE}`,
  CERTIFIED: CERTIFICADA,
  EQUIVALENT: EQUIVALENTE,
};
const DECISION: Readonly<Record<'CERTIFY' | 'EQUIVALENT' | 'CLEAR', ResultadoDeRevisionDeAlimento>> = { CERTIFY: 'CERTIFICADO', EQUIVALENT: 'EQUIVALENTE', CLEAR: 'QUITADA' };

function alimentoParaRevisar(f: FilaDeAlimentoCargado): AlimentoParaRevisar {
  const review = revisionDelAlimento(f);
  return {
    catalogItemId: f.elementoId,
    versionId: f.versionId,
    version: `v${f.cantidadDeVersiones}`,
    versionNumber: f.cantidadDeVersiones,
    name: f.nombre,
    composition: f.composicion,
    foodGroup: f.grupoDeAlimento ? GRUPO_API[f.grupoDeAlimento] : null,
    available: f.disponible,
    review: { ...review, decidedAt: review.state === 'PENDING' ? null : (f.decidido?.toISOString() ?? null) },
    createdAt: f.creado.toISOString(),
    updatedAt: f.actualizado.toISOString(),
  };
}

/**
 * WP-NUTRICION-ALIMENTOS (DL-180, NUA-04) · Administración revisa los alimentos que los profesionales cargaron a mano
 * (API-ALI-05 a 07), con la autorización de WP-ADMINISTRACION: la sesión administrativa con el segundo factor la exige el
 * controlador; acá no se decide nada de autorización con lo que manda el cliente.
 * - **Lo que ve:** el nombre, los valores cada 100 g, el grupo y lo decidido. Nunca quién lo cargó ni a quién se le indicó.
 *   Solo lo que se comparte ahora (NUA-D05; segundo tramo, NUA-D15): lo que su autor no compartió o dejó de compartir lo
 *   ve solo él, como le dice «Mis alimentos», y Administración tampoco lo ve ni decide sobre eso (el mismo 404 que lo
 *   inexistente). La base lo sostiene (trigger).
 * - **Lo que decide:** certificarlo con una fuente citada (vale para la versión que vio; si su autor lo corrige, la nueva
 *   vuelve a esperar revisión), marcarlo como equivalente de un alimento de la tabla oficial (el buscador sugiere ese en su
 *   lugar, y los planes viejos no cambian) o quitar lo decidido. Cada decisión es una fila nueva: la historia no se pisa.
 * - Contra la versión que vio (`expectedVersion`): si el profesional lo corrigió mientras tanto, 409 VERSION_CONFLICT.
 * - Uno que no existe, que no es una carga a mano o que su autor no compartió es el mismo 404.
 * - La auditoría registra cada operación sin los textos (la fuente puede citar un rótulo con datos de un tercero).
 */
@Injectable()
export class RevisionDeAlimentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotencia: IdempotenciaService,
    private readonly auditoria: AuditoriaService,
    private readonly catalogo: CatalogoService,
  ) {}

  // ─── API-ALI-05 ──────────────────────────────────────────────────────────────────────────────
  /** Sin estado: los que esperan revisión primero (lo más nuevo arriba) y después lo decidido. Los retirados no se ofrecen. */
  async consultar(actor: ActorAdministrativo, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ListaDeAlimentosParaRevisarResponse> {
    const pedido = validarCuerpo(ConsultarAlimentosParaRevisarRequestSchema, cuerpo);
    const limite = pedido.limit ?? 20;
    const desde = pedido.cursor !== undefined ? this.leerCursor(pedido.cursor) : 0;
    const texto = pedido.q ? sinMarcas(pedido.q).replace(/\s+/g, ' ').trim() : '';
    const conTexto = texto ? Prisma.sql`lower(translate(v."nombre", ${CON_MARCA}, ${SIN_MARCA})) LIKE ${`%${texto.replace(/[\\%_]/g, (c) => `\\${c}`)}%`}` : Prisma.sql`TRUE`;
    const filas = await leerAlimentosCargados(
      this.prisma,
      Prisma.sql`v."disponibilidad" = 'DISPONIBLE' AND ${ALIMENTO_COMPARTIDO} AND ${pedido.state ? ESTADO[pedido.state] : Prisma.sql`TRUE`} AND ${conTexto}`,
      Prisma.sql`(CASE WHEN ${ESTADO.PENDING} THEN 0 ELSE 1 END), v."momento_de_registro" DESC, e."id" DESC OFFSET ${desde}`,
      limite + 1,
    );
    const hayMas = filas.length > limite;
    await this.auditar(this.prisma, 'API-ALI-05', 'EXITO', null, actor.identidadId, null, ctx);
    return {
      data: filas.slice(0, limite).map(alimentoParaRevisar),
      page: { limit: limite, nextCursor: hayMas ? Buffer.from(String(desde + limite), 'utf8').toString('base64url') : null, hasMore: hayMas },
    };
  }

  // ─── API-ALI-06 ──────────────────────────────────────────────────────────────────────────────
  async decidir(actor: ActorAdministrativo, catalogItemId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const pedido = validarCuerpo(DecidirSobreAlimentoRequestSchema, cuerpo);
    if (!IdempotenciaService.claveValida(clave)) throw errores.solicitudInvalida([{ code: 'IDEMPOTENCY_KEY_REQUIRED', path: 'Idempotency-Key' }], { header: 'Idempotency-Key' });
    const fuente = pedido.source?.trim() || null;
    const issues: ValidationIssue[] = [];
    if (pedido.decision === 'CERTIFY' && !fuente) issues.push({ code: 'SOURCE_REQUIRED', path: 'source' });
    if (pedido.decision === 'EQUIVALENT' && !pedido.equivalentCatalogItemId) issues.push({ code: 'EQUIVALENT_REQUIRED', path: 'equivalentCatalogItemId' });
    if (pedido.decision !== 'EQUIVALENT' && pedido.equivalentCatalogItemId) issues.push({ code: 'EQUIVALENT_NOT_EXPECTED', path: 'equivalentCatalogItemId' });
    if (pedido.decision === 'CLEAR' && fuente) issues.push({ code: 'SOURCE_NOT_EXPECTED', path: 'source' });
    const id = esUuid(catalogItemId) ? catalogItemId.toLowerCase() : null;
    if (issues.length > 0) {
      await this.auditar(this.prisma, 'API-ALI-06', 'RECHAZO', 'VALIDATION_FAILED', actor.identidadId, id, ctx);
      throw errores.validacionFallida(issues);
    }
    const procedencia = procedenciaDe(ctx, CASO_DE_USO, 'API-ALI-06');
    try {
      return await this.idempotencia.ejecutar({ operacion: 'API-ALI-06', ambito: actor.identidadId, clave: clave as string, huella: IdempotenciaService.huella({ id, pedido }) }, async (tx) => {
        // El alimento se toma antes de decidir: una decisión y una corrección simultáneas se ordenan. Lo que su autor no
        // compartió es el mismo 404 que lo inexistente (NUA-D05).
        const [tomado] = id
          ? await tx.$queryRaw<{ id: string }[]>`
              SELECT e."id"::text AS "id" FROM "elemento_de_catalogo_nutricional" e WHERE e."id" = ${id}::uuid AND e."procedencia" = 'PROFESSIONAL_MANUAL'
                 AND ${ALIMENTO_COMPARTIDO}
               FOR NO KEY UPDATE`
          : [];
        const [actual] = tomado ? await leerAlimentosCargados(tx, Prisma.sql`e."id" = ${tomado.id}::uuid`, Prisma.sql`e."id"`, 1) : [];
        if (!actual) throw new ErrorDeApi(404, CodigoDeError.RESOURCE_NOT_FOUND, 'Recurso no encontrado.', undefined, 'ALIMENTO_NO_ENCONTRADO');
        if (!esToken(pedido.expectedVersion, actual.cantidadDeVersiones)) {
          throw new ErrorDeApi(409, CodigoDeError.VERSION_CONFLICT, errores.conflictoDeVersion().mensajeSeguro, undefined, 'VERSION_VISTA_NO_VIGENTE');
        }
        if (pedido.decision === 'CLEAR' && revisionDelAlimento(actual).state === 'PENDING') {
          throw new ErrorDeApi(422, CodigoDeError.INVALID_STATE_TRANSITION, 'No hay nada decidido para quitar.', undefined, 'SIN_DECISION');
        }
        if (pedido.decision === 'EQUIVALENT') {
          // Un identificador que no es un UUID no es un verificado: el mismo 422, no un error de la base.
          const equivalenteId = pedido.equivalentCatalogItemId;
          const [verificado] = equivalenteId && esUuid(equivalenteId)
            ? await tx.$queryRaw<{ id: string }[]>`
            SELECT v."elemento_id"::text AS "id" FROM "version_de_elemento_nutricional" v
             WHERE v."elemento_id" = ${equivalenteId}::uuid AND v."disponibilidad" = 'DISPONIBLE'
               AND v."procedencia" -> 'fuenteExterna' ->> 'provider' = 'USDA_FDC_SR_LEGACY'
               AND NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" s WHERE s."predecesora_id" = v."id")`
            : [];
          if (!verificado) throw new ErrorDeApi(422, CodigoDeError.VALIDATION_FAILED, 'El equivalente tiene que ser un alimento verificado.', { issues: [{ code: 'EQUIVALENT_NOT_VERIFIED', path: 'equivalentCatalogItemId' }] });
        }
        const ultima = await tx.revisionAdministrativaDeAlimento.findFirst({ where: { elementoId: actual.elementoId }, orderBy: { numero: 'desc' }, select: { numero: true } });
        await tx.revisionAdministrativaDeAlimento.create({
          data: {
            elementoId: actual.elementoId,
            numero: (ultima?.numero ?? 0) + 1,
            resultado: DECISION[pedido.decision],
            versionId: actual.versionId,
            fuente: pedido.decision === 'CLEAR' ? null : fuente,
            equivalenteId: pedido.decision === 'EQUIVALENT' ? (pedido.equivalentCatalogItemId ?? null) : null,
            administradorId: actor.identidadId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeRegistro: await momentoDeLaBase(tx),
          },
        });
        await this.auditar(tx, 'API-ALI-06', 'EXITO', DECISION[pedido.decision], actor.identidadId, actual.elementoId, ctx);
        const [leida] = await leerAlimentosCargados(tx, Prisma.sql`e."id" = ${actual.elementoId}::uuid`, Prisma.sql`e."id"`, 1);
        const respuesta: AlimentoParaRevisarResponse = { data: alimentoParaRevisar(leida!) };
        return { estadoHttp: 200, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
      });
    } catch (e) {
      if (e instanceof ErrorDeApi) await this.auditar(this.prisma, 'API-ALI-06', 'RECHAZO', e.motivoDeAuditoria ?? e.code, actor.identidadId, id, ctx);
      throw e;
    }
  }

  // ─── API-ALI-07 ──────────────────────────────────────────────────────────────────────────────
  async buscarVerificados(actor: ActorAdministrativo, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ListaDeVerificadosResponse> {
    const pedido = validarCuerpo(BuscarVerificadosRequestSchema, cuerpo);
    const data = await this.catalogo.buscarVerificados(pedido.q, pedido.limit ?? 10);
    await this.auditar(this.prisma, 'API-ALI-07', 'EXITO', null, actor.identidadId, null, ctx);
    return { data };
  }

  // ─── Piezas comunes ──────────────────────────────────────────────────────────────────────────

  private leerCursor(cursor: string): number {
    const texto = /^[A-Za-z0-9_-]{1,40}$/.test(cursor) ? Buffer.from(cursor, 'base64url').toString('utf8') : '';
    const n = /^\d{1,7}$/.test(texto) ? Number(texto) : -1;
    if (!Number.isInteger(n) || n < 0 || n > 1_000_000) throw errores.cursorInvalido();
    return n;
  }

  private auditar(cliente: Tx | PrismaService, operacion: string, resultado: 'EXITO' | 'RECHAZO', motivo: string | null, actorId: string, recursoId: string | null, ctx: ContextoDeSolicitud): Promise<void> {
    return this.auditoria.registrar(
      { operacion, resultado, motivo, actorId, sujetoId: null, recursoTipo: RECURSO_ALIMENTO, recursoId, superficie: ctx.superficie, requestId: ctx.requestId, momentoDeOcurrencia: ctx.momentoDeRecepcion },
      cliente as Tx,
    );
  }
}
