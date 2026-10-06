import { Inject, Injectable } from '@nestjs/common';
import {
  CuerpoVacioSchema,
  OtorgarEvidenciaVisualRequestSchema,
  VERSIONES_PROPUESTAS,
  type ActoDeEvidenciaVisual,
  type ConsentimientoRevocadoResponse,
  type ListaDeEvidenciaVisualResponse,
  type RequisitoDeEvidenciaVisualResponse,
} from '@be/domain';
import { Prisma } from '@prisma/client';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { IdempotenciaService, type ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { conReintento, momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { nombreDeProfesional, resumenDeAlcance } from '../vinculo/lectura';
import { versionDeEvidenciaVisual } from './evidencia-visual-del-alcance';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIPO = 'EVIDENCIA_VISUAL';

/** El componente de Nutrición del titular, con lo que el acto necesita para su evidencia y su respuesta. */
interface AlcanceDelTitular {
  readonly id: string;
  readonly estado: 'ACEPTADO' | 'PAUSADO' | 'FINALIZADO';
  readonly finalidad: string;
  readonly profesionalId: string;
}

type FilaDeActo = Prisma.ActoRegistrableGetPayload<{
  include: { alcanceDeVinculo: { include: { vinculo: { include: { profesional: { select: { perfilProfesional: { select: { nombreVisible: true } } } } } } } } };
}>;
const INCLUIR_PROFESIONAL = {
  alcanceDeVinculo: { include: { vinculo: { include: { profesional: { select: { perfilProfesional: { select: { nombreVisible: true } } } } } } } },
} as const;

/**
 * `EVIDENCIA_VISUAL` (08 §12.4, 08:395; §21.3): la información destacada de las fotos de comidas, como un acto registrable
 * por cada alcance de Nutrición del titular, con la evidencia del 08 §12.2 (precierre del 2026-10-06, §6; DL-125).
 * - **No es un consentimiento por foto** (08:386): se registra una vez por profesional, al habilitar la categoría.
 * - **Solo el titular** lo pide, lo registra y lo revoca (INV-06-62): a cualquier otro, el mismo 404 que lo inexistente.
 * - **Registrarlo exige el vínculo aceptado y su B2 vigente** («B2 reforzado»): no amplía nada que B2 no autorice.
 * - **La versión mostrada es la aceptada:** la cabeza de la cadena del tipo, hoy una propuesta (`VERSIONES_PROPUESTAS`).
 * - **Revocar** corta en la operación siguiente las fotos nuevas para ese profesional (API-MED-01) y su acceso a las fotos
 *   (API-MED-03), si la exigencia está activa. No borra fotos ni registros, y el titular sigue viendo las suyas.
 * - **La exigencia** (`BE_EVIDENCIA_VISUAL_EXIGIDA`) no cambia estas operaciones: solo lo que exigen los medios.
 */
@Injectable()
export class EvidenciaVisualService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotencia: IdempotenciaService,
    private readonly auditoria: AuditoriaService,
    private readonly limitador: LimitadorService,
    @Inject(ENTORNO) private readonly entorno: Entorno,
  ) {}

  // ─── API-EVI-01 ────────────────────────────────────────────────────────────────────────────
  async requisito(actor: ActorAutenticado, vinculoId: string, ctx: ContextoDeSolicitud): Promise<RequisitoDeEvidenciaVisualResponse> {
    this.limitador.consumir('consultaProtegida', null, actor.identidadId);
    const tx = this.prisma as unknown as Prisma.TransactionClient;
    let alcance: AlcanceDelTitular;
    try {
      alcance = await this.alcanceDelTitular(tx, actor.identidadId, vinculoId, false);
    } catch (e) {
      await this.auditarRechazo(e, 'API-EVI-01', actor.identidadId, ctx, { tipo: 'AlcanceDeVinculo', id: vinculoId });
      throw e;
    }
    const [version, perfil, vigente] = await Promise.all([
      versionDeEvidenciaVisual(tx),
      this.prisma.perfilProfesional.findUnique({ where: { identidadId: alcance.profesionalId }, select: { nombreVisible: true } }),
      this.prisma.actoRegistrable.findFirst({ where: { alcanceDeVinculoId: alcance.id, tipo: TIPO, estado: 'VIGENTE' } }),
    ]);
    if (!version) throw errores.interno();
    return {
      data: {
        relationshipId: alcance.id,
        professional: { identityId: alcance.profesionalId, displayName: nombreDeProfesional(perfil) },
        scope: resumenDeAlcance('NUTRICION'),
        category: 'MEAL_PHOTOS',
        consentVersion: { id: version.id, title: version.titulo, text: version.texto, textHash: version.hash, effectiveFrom: version.vigenteDesde.toISOString() },
        textApproval: VERSIONES_PROPUESTAS.has(version.id) ? 'PENDING_APPROVAL' : 'APPROVED',
        enforced: this.entorno.evidenciaVisualExigida,
        currentConsent: vigente
          ? { consentId: vigente.id, consentVersionId: vigente.versionDeTextoId, acceptedAt: vigente.momentoDeOcurrencia.toISOString() }
          : null,
      },
    };
  }

  // ─── API-EVI-02 ────────────────────────────────────────────────────────────────────────────
  async otorgar(actor: ActorAutenticado, vinculoId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const operacion = 'API-EVI-02';
    if (!IdempotenciaService.claveValida(clave)) {
      throw errores.solicitudInvalida([{ code: 'IDEMPOTENCY_KEY_REQUIRED', path: 'Idempotency-Key' }], { header: 'Idempotency-Key' });
    }
    const pedido = validarCuerpo(OtorgarEvidenciaVisualRequestSchema, cuerpo);
    const huella = IdempotenciaService.huella({ vinculoId, ...pedido });
    const procedencia = procedenciaDe(ctx, 'UC-P07', operacion);
    try {
      return await this.idempotencia.ejecutar({ operacion, ambito: actor.identidadId, clave: clave as string, huella }, async (tx) => {
        // Bloquea el componente, como API-CON-02: serializa las decisiones sobre el mismo vínculo.
        const alcance = await this.alcanceDelTitular(tx, actor.identidadId, vinculoId, true);
        if (alcance.estado !== 'ACEPTADO') throw errores.vinculoNoListoParaConsentir();
        const b2 = await tx.consentimiento.findFirst({ where: { alcanceDeVinculoId: alcance.id, situacion: 'VIGENTE' }, select: { id: true } });
        if (!b2) throw errores.vinculoNoListoParaConsentir();
        const version = await versionDeEvidenciaVisual(tx);
        if (!version) throw errores.interno();
        if (pedido.consentVersionId !== version.id) throw errores.versionDeConsentimientoVieja();

        const vigente = await tx.actoRegistrable.findFirst({ where: { alcanceDeVinculoId: alcance.id, tipo: TIPO, estado: 'VIGENTE' }, include: INCLUIR_PROFESIONAL });
        if (vigente) {
          // Ya vigente con esta versión: se devuelve el mismo acto, como API-CON-02. Con otra versión, primero se revoca.
          if (vigente.versionDeTextoId !== version.id) throw errores.consentimientoYaVigente();
          await this.auditar(tx, operacion, actor.identidadId, vigente.id, ctx);
          return { estadoHttp: 200, cuerpo: { data: actoApi(vigente) } as unknown as Prisma.InputJsonValue };
        }
        const acto = await tx.actoRegistrable.create({
          data: {
            identidadId: actor.identidadId,
            tipo: TIPO,
            versionDeTextoId: version.id,
            hashDelTexto: version.hash,
            // 08 §12.2: la finalidad del alcance B2 en el que se informa la categoría.
            finalidad: alcance.finalidad,
            superficie: ctx.superficie,
            direccionIp: ctx.direccionIp,
            agenteDeUsuario: ctx.agenteDeUsuario,
            actorId: actor.identidadId,
            autoriaId: actor.identidadId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeOcurrencia: ctx.momentoDeRecepcion,
            alcanceDeVinculoId: alcance.id,
          },
          include: INCLUIR_PROFESIONAL,
        });
        await tx.eventoDeDominio.create({
          data: {
            tipo: 'ActoOtorgado',
            identidadId: actor.identidadId,
            actorId: actor.identidadId,
            autoriaId: actor.identidadId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeOcurrencia: ctx.momentoDeRecepcion,
            datos: { actoId: acto.id, tipo: TIPO, versionDeTexto: version.id, alcanceDeVinculoId: alcance.id },
          },
        });
        await this.auditar(tx, operacion, actor.identidadId, acto.id, ctx);
        return { estadoHttp: 201, cuerpo: { data: actoApi(acto) } as unknown as Prisma.InputJsonValue };
      });
    } catch (e) {
      // Dos registros simultáneos con claves distintas: el bloqueo del componente los ordena; el índice parcial es la red.
      const final = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' ? errores.consentimientoYaVigente() : e;
      await this.auditarRechazo(final, operacion, actor.identidadId, ctx, { tipo: 'AlcanceDeVinculo', id: vinculoId });
      throw final;
    }
  }

  // ─── API-EVI-03 ────────────────────────────────────────────────────────────────────────────
  async listar(actor: ActorAutenticado, query: Record<string, unknown>): Promise<ListaDeEvidenciaVisualResponse> {
    const consulta = leerConsultaDeLista(query, {});
    const filas = await this.prisma.actoRegistrable.findMany({
      where: { AND: [{ identidadId: actor.identidadId, tipo: TIPO }, despuesDelCursor(consulta.cursor)] },
      orderBy: ORDEN_DE_LISTA,
      take: consulta.limit + 1,
      include: INCLUIR_PROFESIONAL,
    });
    const { pagina, page } = paginar(filas, consulta.limit);
    // Sin IP ni user-agent en la UI normal (09:2547-2552).
    return { data: pagina.map(actoApi), page };
  }

  // ─── API-EVI-04 ────────────────────────────────────────────────────────────────────────────
  /**
   * Idempotente por semántica, como API-CON-08: revocar dos veces devuelve la misma revocación. La hora es la de la base
   * con el acto bloqueado: una subida o un acceso que lo leen en modo compartido quedan antes o después del corte.
   */
  async revocar(actor: ActorAutenticado, actoId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ConsentimientoRevocadoResponse> {
    const operacion = 'API-EVI-04';
    validarCuerpo(CuerpoVacioSchema, cuerpo);
    const procedencia = procedenciaDe(ctx, 'UC-P08', operacion);
    try {
      return await conReintento(() =>
        this.prisma.$transaction(async (tx) => {
          if (!UUID.test(actoId)) throw errores.recursoNoEncontrado();
          const [acto] = await tx.$queryRaw<{ id: string; estado: 'VIGENTE' | 'REVOCADO'; momento_de_revocacion: Date | null; alcance_de_vinculo_id: string }[]>`
            SELECT "id"::text, "estado"::text AS "estado", "momento_de_revocacion", "alcance_de_vinculo_id"::text FROM "acto_registrable"
             WHERE "id" = ${actoId}::uuid AND "identidad_id" = ${actor.identidadId}::uuid AND "tipo" = 'EVIDENCIA_VISUAL' FOR NO KEY UPDATE`;
          // Solo el titular (INV-06-62): lo ajeno o inexistente, el mismo 404.
          if (!acto) throw errores.recursoNoEncontrado();
          if (acto.estado === 'REVOCADO') {
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
              datos: { actoId: acto.id, tipo: TIPO, alcanceDeVinculoId: acto.alcance_de_vinculo_id, fundamento: '08 §12.4: EVIDENCIA_VISUAL revocable por el titular' },
            },
          });
          await this.auditar(tx, operacion, actor.identidadId, acto.id, ctx);
          return { data: { consentId: acto.id, state: 'REVOKED', revokedAt: ahora.toISOString() } };
        }),
      );
    } catch (e) {
      await this.auditarRechazo(e, operacion, actor.identidadId, ctx, { tipo: 'ActoRegistrable', id: actoId });
      throw e;
    }
  }

  /** El componente de Nutrición, solo si el actor es su asesorado titular. Otro alcance, ajeno o inexistente: 404. */
  private async alcanceDelTitular(tx: Prisma.TransactionClient, asesoradoId: string, vinculoId: string, bloquear: boolean): Promise<AlcanceDelTitular> {
    if (!UUID.test(vinculoId)) throw errores.recursoNoEncontrado();
    const filas = bloquear
      ? await tx.$queryRaw<AlcanceDelTitular[]>`
          SELECT av."id"::text AS "id", av."estado"::text AS "estado", av."finalidad"::text AS "finalidad", vi."profesional_id"::text AS "profesionalId"
            FROM "alcance_de_vinculo" av JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
           WHERE av."id" = ${vinculoId}::uuid AND vi."asesorado_id" = ${asesoradoId}::uuid AND av."alcance" = 'NUTRICION' FOR NO KEY UPDATE OF av`
      : await tx.$queryRaw<AlcanceDelTitular[]>`
          SELECT av."id"::text AS "id", av."estado"::text AS "estado", av."finalidad"::text AS "finalidad", vi."profesional_id"::text AS "profesionalId"
            FROM "alcance_de_vinculo" av JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
           WHERE av."id" = ${vinculoId}::uuid AND vi."asesorado_id" = ${asesoradoId}::uuid AND av."alcance" = 'NUTRICION'`;
    if (!filas[0]) throw errores.recursoNoEncontrado();
    return filas[0];
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

  private async auditarRechazo(e: unknown, operacion: string, actorId: string, ctx: ContextoDeSolicitud, recurso: { tipo: string; id: string }): Promise<void> {
    if (!(e instanceof ErrorDeApi)) return;
    await this.auditoria.registrar({
      operacion,
      resultado: 'RECHAZO',
      motivo: e.code,
      actorId,
      // El recurso intentado, solo si tiene forma de identificador.
      recursoTipo: UUID.test(recurso.id) ? recurso.tipo : null,
      recursoId: UUID.test(recurso.id) ? recurso.id.toLowerCase() : null,
      superficie: ctx.superficie,
      requestId: ctx.requestId,
      momentoDeOcurrencia: ctx.momentoDeRecepcion,
    });
  }
}

/** El acto en la forma del contrato, sin IP ni agente de usuario. */
function actoApi(a: FilaDeActo): ActoDeEvidenciaVisual {
  const av = a.alcanceDeVinculo;
  if (!av) throw errores.interno();
  return {
    consentId: a.id,
    type: 'VISUAL_EVIDENCE',
    relationshipId: av.id,
    professional: { identityId: av.vinculo.profesionalId, displayName: nombreDeProfesional(av.vinculo.profesional.perfilProfesional) },
    scope: resumenDeAlcance('NUTRICION'),
    category: 'MEAL_PHOTOS',
    consentVersionId: a.versionDeTextoId,
    state: a.estado === 'VIGENTE' ? 'ACTIVE' : 'REVOKED',
    acceptedAt: a.momentoDeOcurrencia.toISOString(),
    revokedAt: a.momentoDeRevocacion?.toISOString() ?? null,
  };
}
