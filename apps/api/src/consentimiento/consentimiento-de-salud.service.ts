import { Injectable } from '@nestjs/common';
import {
  CuerpoVacioSchema,
  OtorgarConsentimientoDeSaludRequestSchema,
  VERSION_VIGENTE,
  type ConsentimientoDeSaludOtorgadoResponse,
  type ConsentimientoRevocadoResponse,
  type HistorialDeConsentimientoDeSaludResponse,
} from '@be/domain';
import { Prisma } from '@prisma/client';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { IdempotenciaService, type ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { conReintento, momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A3 — tratamiento de datos de salud por BE (08 §12.4 `DATOS_SALUD_BE`; 09 §33-§35; API-CON-06, 07 y 08).
 * Es un acto registrable de la Relación A, no una entidad del 06 (DL-021):
 * - otorgar o reotorgar crea un acto nuevo y el revocado anterior queda preservado (09:2508, 09:2607);
 * - como máximo un A3 VIGENTE por titular (índice parcial en la base);
 * - revocar suspende de inmediato toda operación sensible del titular, incluido el acceso profesional: el PDP lo lee en
 *   la dimensión SITUACIÓN (08:406; 09:2603). Los B2 no se revocan: quedan sin capacidad efectiva mientras A3 no esté
 *   vigente. Los pasos 2 y 3 del flujo único de revocación quedan pendientes (DL-021).
 * - A3 no crea B2 ni habilita a ningún profesional (09:2503-2508).
 */
@Injectable()
export class ConsentimientoDeSaludService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotencia: IdempotenciaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  // ─── API-CON-06 ────────────────────────────────────────────────────────────────────────────
  async otorgar(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const operacion = 'API-CON-06';
    if (!IdempotenciaService.claveValida(clave)) {
      throw errores.solicitudInvalida([{ code: 'IDEMPOTENCY_KEY_REQUIRED', path: 'Idempotency-Key' }], { header: 'Idempotency-Key' });
    }
    const pedido = validarCuerpo(OtorgarConsentimientoDeSaludRequestSchema, cuerpo);
    const huella = IdempotenciaService.huella(pedido);
    const vigente = VERSION_VIGENTE.DATOS_SALUD_BE;
    const procedencia = procedenciaDe(ctx, 'UC-P25', operacion);
    try {
      return await this.idempotencia.ejecutar({ operacion, ambito: actor.identidadId, clave: clave as string, huella }, async (tx) => {
        // «versión existente y aplicable a HEALTH_DATA_BE» (09:2472-2479).
        if (pedido.consentVersionId !== vigente.id) {
          const otra = await tx.versionDeTexto.findUnique({ where: { id: pedido.consentVersionId }, select: { tipo: true } });
          throw otra?.tipo === 'DATOS_SALUD_BE' ? errores.versionDeConsentimientoVieja() : errores.consentimientoDeSaludNoDisponible();
        }
        // Serializa los otorgamientos del mismo titular; el índice parcial lo garantiza igual ante cualquier carrera.
        // NO KEY UPDATE: no choca con las claves foráneas de hechos y decisiones (prisma/concurrencia.ts).
        await tx.$queryRaw`SELECT 1 FROM "identidad" WHERE "id" = ${actor.identidadId}::uuid FOR NO KEY UPDATE`;
        const activo = await tx.actoRegistrable.findFirst({ where: { identidadId: actor.identidadId, tipo: 'DATOS_SALUD_BE', estado: 'VIGENTE' }, select: { id: true } });
        if (activo) throw errores.consentimientoYaVigente();
        const acto = await tx.actoRegistrable.create({
          data: {
            identidadId: actor.identidadId,
            tipo: 'DATOS_SALUD_BE',
            versionDeTextoId: vigente.id,
            hashDelTexto: vigente.hash,
            finalidad: vigente.finalidad,
            superficie: ctx.superficie,
            direccionIp: ctx.direccionIp,
            agenteDeUsuario: ctx.agenteDeUsuario,
            actorId: actor.identidadId,
            autoriaId: actor.identidadId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeOcurrencia: ctx.momentoDeRecepcion,
          },
        });
        await tx.eventoDeDominio.create({
          data: {
            tipo: 'ActoOtorgado',
            identidadId: actor.identidadId,
            actorId: actor.identidadId,
            autoriaId: actor.identidadId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeOcurrencia: ctx.momentoDeRecepcion,
            datos: { actoId: acto.id, tipo: 'DATOS_SALUD_BE', versionDeTexto: vigente.id },
          },
        });
        await this.auditar(tx, operacion, actor.identidadId, acto.id, ctx);
        const respuesta: ConsentimientoDeSaludOtorgadoResponse = {
          data: { consentId: acto.id, type: 'HEALTH_DATA_BE', consentVersionId: vigente.id, state: 'ACTIVE', acceptedAt: acto.momentoDeOcurrencia.toISOString() },
        };
        return { estadoHttp: 201, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
      });
    } catch (e) {
      const final = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' ? errores.consentimientoYaVigente() : e;
      await this.auditarRechazo(final, operacion, actor.identidadId, ctx);
      throw final;
    }
  }

  // ─── API-CON-07 ────────────────────────────────────────────────────────────────────────────
  async historial(actor: ActorAutenticado, query: Record<string, unknown>): Promise<HistorialDeConsentimientoDeSaludResponse> {
    const consulta = leerConsultaDeLista(query, {});
    const filas = await this.prisma.actoRegistrable.findMany({
      where: { AND: [{ identidadId: actor.identidadId, tipo: 'DATOS_SALUD_BE' }, despuesDelCursor(consulta.cursor)] },
      orderBy: ORDEN_DE_LISTA,
      take: consulta.limit + 1,
    });
    const { pagina, page } = paginar(filas, consulta.limit);
    return {
      // Sin IP ni user-agent en la UI normal (09:2547-2552).
      data: pagina.map((a) => ({
        consentId: a.id,
        type: 'HEALTH_DATA_BE' as const,
        consentVersionId: a.versionDeTextoId,
        state: a.estado === 'VIGENTE' ? ('ACTIVE' as const) : ('REVOKED' as const),
        acceptedAt: a.momentoDeOcurrencia.toISOString(),
        revokedAt: a.momentoDeRevocacion?.toISOString() ?? null,
      })),
      page,
    };
  }

  // ─── API-CON-08 ────────────────────────────────────────────────────────────────────────────
  /**
   * Idempotente por semántica (09:2582-2594). AuthN `SESSION` con datos sintéticos (09:2566).
   * La hora de la revocación es la de la base con el acto bloqueado: el PDP lo lee en modo compartido, así que toda
   * decisión queda antes o después del corte (T-PDP-4).
   */
  async revocar(actor: ActorAutenticado, actoId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ConsentimientoRevocadoResponse> {
    const operacion = 'API-CON-08';
    validarCuerpo(CuerpoVacioSchema, cuerpo);
    const procedencia = procedenciaDe(ctx, 'UC-P25', operacion);
    try {
      return await conReintento(() => this.prisma.$transaction(async (tx) => {
        if (!UUID.test(actoId)) throw errores.recursoNoEncontrado();
        const [acto] = await tx.$queryRaw<{ id: string; estado: 'VIGENTE' | 'REVOCADO'; momento_de_revocacion: Date | null }[]>`
          SELECT "id"::text, "estado"::text AS "estado", "momento_de_revocacion" FROM "acto_registrable"
           WHERE "id" = ${actoId}::uuid AND "identidad_id" = ${actor.identidadId}::uuid AND "tipo" = 'DATOS_SALUD_BE' FOR NO KEY UPDATE`;
        // «El consentimiento debe pertenecer al titular. Recurso inexistente/no revelable: 404» (09:2568-2576).
        if (!acto) throw errores.recursoNoEncontrado();
        if (acto.estado === 'REVOCADO') {
          // Replay: la misma revocación, con su fecha. Es una respuesta exitosa: también se audita.
          await this.auditar(tx, operacion, actor.identidadId, acto.id, ctx);
          return { data: { consentId: acto.id, state: 'REVOKED', revokedAt: (acto.momento_de_revocacion as Date).toISOString() } };
        }
        const ahora = await momentoDeLaBase(tx);
        await tx.actoRegistrable.update({ where: { id: acto.id }, data: { estado: 'REVOCADO', momentoDeRevocacion: ahora } });
        await tx.eventoDeDominio.create({
          data: {
            tipo: 'ActoRevocado',
            identidadId: actor.identidadId,
            actorId: actor.identidadId,
            autoriaId: actor.identidadId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeOcurrencia: ahora,
            datos: { actoId: acto.id, tipo: 'DATOS_SALUD_BE', fundamento: '08 §12.4: DATOS_SALUD_BE revocable por el titular' },
          },
        });
        await this.auditar(tx, operacion, actor.identidadId, acto.id, ctx);
        return { data: { consentId: acto.id, state: 'REVOKED', revokedAt: ahora.toISOString() } };
      }));
    } catch (e) {
      await this.auditarRechazo(e, operacion, actor.identidadId, ctx, actoId);
      throw e;
    }
  }

  private async auditar(tx: Prisma.TransactionClient, operacion: string, actorId: string, actoId: string, ctx: ContextoDeSolicitud): Promise<void> {
    await this.auditoria.registrar(
      {
        operacion,
        resultado: 'EXITO',
        actorId,
        sujetoId: actorId,
        recursoTipo: 'ActoRegistrable',
        recursoId: actoId,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      },
      tx,
    );
  }

  private async auditarRechazo(e: unknown, operacion: string, actorId: string, ctx: ContextoDeSolicitud, actoId?: string): Promise<void> {
    if (!(e instanceof ErrorDeApi)) return;
    await this.auditoria.registrar({
      operacion,
      resultado: 'RECHAZO',
      motivo: e.code,
      actorId,
      // El recurso intentado, solo si tiene forma de identificador.
      recursoTipo: actoId && UUID.test(actoId) ? 'ActoRegistrable' : null,
      recursoId: actoId && UUID.test(actoId) ? actoId.toLowerCase() : null,
      superficie: ctx.superficie,
      requestId: ctx.requestId,
      momentoDeOcurrencia: ctx.momentoDeRecepcion,
    });
  }
}
