import { Injectable } from '@nestjs/common';
import {
  ALCANCES,
  FinalizarVinculoRequestSchema,
  PausarVinculoRequestSchema,
  ReanudarVinculoRequestSchema,
  evaluarTransicionDeAlcance,
  type ActorDeVinculo,
  type ContextoDeTransicionDeAlcance,
  type DetalleDeVinculoResponse,
  type EsquemaDeContrato,
  type EstadoDeAlcanceDeVinculo,
  type ListaDeVinculosResponse,
  type Procedencia,
  type SalidaDe,
  type VinculoResponse,
} from '@be/domain';
import type { MotivoDeTransicionDeVinculo, Prisma, RolEnVinculo, TipoDeEventoDeVinculo } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { IdempotenciaService, type ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { INCLUIR_PARTES_DE_COMPONENTE, esToken, itemDeVinculo, registrarEventoDeVinculo, resumenDeCadena } from './lectura';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ESTADOS: readonly EstadoDeAlcanceDeVinculo[] = ['ACEPTADO', 'PAUSADO', 'FINALIZADO'];

interface ComponenteBloqueado {
  readonly id: string;
  readonly version: number;
  readonly estado: EstadoDeAlcanceDeVinculo;
  readonly pausadoPor: RolEnVinculo | null;
  readonly profesionalId: string;
  readonly asesoradoId: string;
}

/**
 * Vínculo por Alcance (T-06-15; 06 §7.5; UC-P06; API-REL-05 a 09). `relationshipId` = componente por alcance (DL-034).
 * - Pausar un alcance no toca los demás (REG-06-47, INV-06-57): cada componente es independiente.
 * - Reanudar no restaura gates (REG-06-48): el PDP vuelve a evaluar todo en la operación siguiente.
 * - Finalizar es terminal y preserva historia (INV-06-58, INV-06-64).
 * - Pausar o finalizar no revocan el consentimiento (REG-06-52). La asimetría 7.5-05 queda en la base: el consentimiento
 *   sigue como está, y el acceso se corta por la dimensión VÍNCULO del PDP.
 */
@Injectable()
export class VinculosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdp: PdpService,
    private readonly idempotencia: IdempotenciaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  // ─── API-REL-05 ────────────────────────────────────────────────────────────────────────────
  async listar(actor: ActorAutenticado, query: Record<string, unknown>): Promise<ListaDeVinculosResponse> {
    const consulta = leerConsultaDeLista(query, { state: ESTADOS, scope: ALCANCES });
    const filas = await this.prisma.alcanceDeVinculo.findMany({
      where: {
        AND: [
          { vinculo: { OR: [{ profesionalId: actor.identidadId }, { asesoradoId: actor.identidadId }] } },
          consulta.filtros.state ? { estado: consulta.filtros.state as EstadoDeAlcanceDeVinculo } : {},
          consulta.filtros.scope ? { alcance: consulta.filtros.scope as (typeof ALCANCES)[number] } : {},
          despuesDelCursor(consulta.cursor),
        ],
      },
      orderBy: ORDEN_DE_LISTA,
      take: consulta.limit + 1,
      include: INCLUIR_PARTES_DE_COMPONENTE,
    });
    const { pagina, page } = paginar(filas, consulta.limit);
    const data = [];
    for (const c of pagina) data.push(await itemDeVinculo(this.prisma as unknown as Prisma.TransactionClient, this.pdp, c));
    return { data, page };
  }

  // ─── API-REL-06 ────────────────────────────────────────────────────────────────────────────
  async detalle(actor: ActorAutenticado, vinculoId: string): Promise<DetalleDeVinculoResponse> {
    const c = UUID.test(vinculoId)
      ? await this.prisma.alcanceDeVinculo.findFirst({
          where: { id: vinculoId, vinculo: { OR: [{ profesionalId: actor.identidadId }, { asesoradoId: actor.identidadId }] } },
          include: INCLUIR_PARTES_DE_COMPONENTE,
        })
      : null;
    // «No participante/no visible → 404» (09v8:1385).
    if (!c) throw errores.recursoNoEncontrado();
    const item = await itemDeVinculo(this.prisma as unknown as Prisma.TransactionClient, this.pdp, c);

    const consentimiento = c.consentimientos.find((x) => x.finalidad === c.finalidad) ?? null;
    let resumen: DetalleDeVinculoResponse['data']['consent'] = null;
    if (consentimiento) {
      const versiones = await this.prisma.versionDeConsentimiento.findMany({ where: { consentimientoId: consentimiento.id } });
      const cadena = resumenDeCadena(versiones);
      resumen = {
        consentId: consentimiento.id,
        state: consentimiento.situacion === 'VIGENTE' ? 'ACTIVE' : 'REVOKED',
        consentVersionId: cadena.ultimaAceptacion.versionDeTextoId as string,
        acceptedAt: cadena.ultimaAceptacion.momentoDeOcurrencia.toISOString(),
        revokedAt: cadena.revocadoEn?.toISOString() ?? null,
      };
    }

    // «Historial mínimo de estado» (10-B04:627-638): hechos de la solicitud de origen, del componente y de su B2.
    const eventos = await this.prisma.eventoDeVinculo.findMany({
      where: {
        OR: [
          { alcanceDeVinculoId: c.id },
          { solicitudDeVinculoId: c.solicitudDeOrigenId },
          ...(consentimiento ? [{ consentimientoId: consentimiento.id }] : []),
        ],
      },
      orderBy: { secuencia: 'asc' },
    });
    const vistos = new Set<string>();
    const history = eventos
      .filter((e) => (vistos.has(e.id) ? false : (vistos.add(e.id), true)))
      .map((e) => ({
        event: e.tipo,
        occurredAt: (e.momentoDeOcurrencia ?? e.momentoDeRegistro).toISOString(),
        actor: e.actorServicio ? ('SYSTEM' as const) : e.actorId === c.vinculo.profesionalId ? ('PROFESSIONAL' as const) : ('ADVISEE' as const),
        reason: e.motivo,
      }));
    return { data: { ...item, consent: resumen, history } };
  }

  // ─── API-REL-07 / 08 / 09 ──────────────────────────────────────────────────────────────────
  pausar(actor: ActorAutenticado, vinculoId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.transicionar('API-REL-07', PausarVinculoRequestSchema, actor, vinculoId, cuerpo, clave, ctx, (pedido, rol) => ({
      transicion: 'PausarAlcance',
      actor: rol,
      decisionExplicita: true,
      motivo: pedido.reason,
    }));
  }

  reanudar(actor: ActorAutenticado, vinculoId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.transicionar('API-REL-08', ReanudarVinculoRequestSchema, actor, vinculoId, cuerpo, clave, ctx, (_pedido, rol, c) => ({
      transicion: 'ReanudarAlcance',
      actor: rol,
      decisionExplicita: true,
      actorEsQuienPauso: c.pausadoPor === rol,
    }));
  }

  finalizar(actor: ActorAutenticado, vinculoId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.transicionar('API-REL-09', FinalizarVinculoRequestSchema, actor, vinculoId, cuerpo, clave, ctx, (pedido, rol) => ({
      transicion: 'FinalizarAlcance',
      actor: rol,
      decisionExplicita: true,
      motivo: pedido.reason,
    }));
  }

  /**
   * Cierre de cuenta (T13; REG-06-24 inc. 5; 08 §14.1). En la transacción del cierre: FinalizarAlcance con actor sistema
   * y motivo CIERRE_DE_CUENTA para cada componente ACEPTADO o PAUSADO donde la identidad es parte. Los consentimientos
   * no se tocan: quedan como evidencia (REG-06-52, INV-06-64). Cierra DL-018.
   */
  async finalizarPorCierre(tx: Prisma.TransactionClient, identidadId: string, procedencia: Procedencia, momento: Date): Promise<number> {
    const activos = await tx.$queryRaw<ComponenteBloqueado[]>`
      SELECT av."id"::text AS "id", av."version", av."estado"::text AS "estado", av."pausado_por"::text AS "pausadoPor",
             vi."profesional_id"::text AS "profesionalId", vi."asesorado_id"::text AS "asesoradoId"
        FROM "alcance_de_vinculo" av JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
       WHERE av."estado" IN ('ACEPTADO', 'PAUSADO') AND (vi."profesional_id" = ${identidadId}::uuid OR vi."asesorado_id" = ${identidadId}::uuid)
       ORDER BY av."id" FOR UPDATE OF av`;
    for (const c of activos) {
      const evaluacion = evaluarTransicionDeAlcance(c.estado, { transicion: 'FinalizarAlcance', actor: 'SISTEMA', decisionExplicita: true, motivo: 'CIERRE_DE_CUENTA' });
      if (!evaluacion.permitida) throw errores.estadoNoPermite();
      await this.aplicar(tx, c, evaluacion.transicion.destino, evaluacion.transicion.evento as TipoDeEventoDeVinculo, 'CIERRE_DE_CUENTA', null, 'SISTEMA', procedencia, momento);
    }
    return activos.length;
  }

  private async transicionar<S extends EsquemaDeContrato>(
    operacion: string,
    esquema: S,
    actor: ActorAutenticado,
    vinculoId: string,
    cuerpo: unknown,
    clave: string | undefined,
    ctx: ContextoDeSolicitud,
    contexto: (pedido: SalidaDe<S>, rol: ActorDeVinculo, c: ComponenteBloqueado) => ContextoDeTransicionDeAlcance,
  ): Promise<ResultadoIdempotente> {
    if (!IdempotenciaService.claveValida(clave)) {
      throw errores.solicitudInvalida([{ code: 'IDEMPOTENCY_KEY_REQUIRED', path: 'Idempotency-Key' }], { header: 'Idempotency-Key' });
    }
    const pedido = validarCuerpo(esquema, cuerpo) as SalidaDe<S> & { expectedVersion: string; reason?: MotivoDeTransicionDeVinculo };
    const huella = IdempotenciaService.huella({ vinculoId, ...pedido });
    const procedencia = procedenciaDe(ctx, 'UC-P06', operacion);
    try {
      return await this.idempotencia.ejecutar({ operacion, ambito: actor.identidadId, clave: clave as string, huella }, async (tx) => {
        const c = await this.bloquearDeParticipante(tx, actor.identidadId, vinculoId);
        const rol: ActorDeVinculo = c.profesionalId === actor.identidadId ? 'PROFESIONAL' : 'ASESORADO';
        const evaluacion = evaluarTransicionDeAlcance(c.estado, contexto(pedido, rol, c));
        if (!evaluacion.permitida) {
          // Solo quien pausó reanuda (DL-033): el actor ya es participante, revelar la prohibición no filtra existencia.
          throw evaluacion.motivo === 'SOLO_REANUDA_QUIEN_PAUSO' ? errores.accionNoPermitida() : errores.estadoNoPermite();
        }
        if (!esToken(pedido.expectedVersion, c.version)) throw errores.conflictoDeVersion();
        await this.aplicar(
          tx,
          c,
          evaluacion.transicion.destino,
          evaluacion.transicion.evento as TipoDeEventoDeVinculo,
          pedido.reason ?? null,
          rol === 'PROFESIONAL' ? 'PROFESIONAL' : 'ASESORADO',
          { identidadId: actor.identidadId },
          procedencia,
          ctx.momentoDeRecepcion,
        );
        await this.auditoria.registrar(
          {
            operacion,
            resultado: 'EXITO',
            actorId: actor.identidadId,
            sujetoId: c.asesoradoId,
            recursoTipo: 'AlcanceDeVinculo',
            recursoId: c.id,
            superficie: ctx.superficie,
            requestId: ctx.requestId,
            momentoDeOcurrencia: ctx.momentoDeRecepcion,
          },
          tx,
        );
        const actualizado = await tx.alcanceDeVinculo.findUniqueOrThrow({ where: { id: c.id }, include: INCLUIR_PARTES_DE_COMPONENTE });
        const respuesta: VinculoResponse = { data: await itemDeVinculo(tx, this.pdp, actualizado) };
        return { estadoHttp: 200, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
      });
    } catch (e) {
      if (e instanceof ErrorDeApi) {
        await this.auditoria.registrar({
          operacion,
          resultado: 'RECHAZO',
          motivo: e.code,
          actorId: actor.identidadId,
          superficie: ctx.superficie,
          requestId: ctx.requestId,
          momentoDeOcurrencia: ctx.momentoDeRecepcion,
        });
      }
      throw e;
    }
  }

  /** Aplica la transición ya evaluada: estado, versión, motivo, quién pausó y el hecho. */
  private async aplicar(
    tx: Prisma.TransactionClient,
    c: ComponenteBloqueado,
    destino: EstadoDeAlcanceDeVinculo,
    evento: TipoDeEventoDeVinculo,
    motivo: MotivoDeTransicionDeVinculo | null,
    rolQuePausa: RolEnVinculo | null,
    actor: { identidadId: string } | 'SISTEMA',
    procedencia: Procedencia,
    momento: Date,
  ): Promise<void> {
    // «preserva pausa previa» al finalizar desde PAUSADO; al reanudar, nadie la tiene pausada.
    const pausadoPor = destino === 'PAUSADO' ? rolQuePausa : destino === 'FINALIZADO' ? c.pausadoPor : null;
    await tx.alcanceDeVinculo.update({
      where: { id: c.id },
      data: { estado: destino, version: c.version + 1, pausadoPor, motivoDeUltimaTransicion: motivo },
    });
    await registrarEventoDeVinculo(tx, {
      tipo: evento,
      profesionalId: c.profesionalId,
      asesoradoId: c.asesoradoId,
      alcanceDeVinculoId: c.id,
      estadoPrevio: c.estado,
      estadoPosterior: destino,
      motivo,
      actor,
      procedencia,
      momento,
    });
  }

  /** El componente, bloqueado, solo si el actor es parte. Si no, 404 idéntico (09v8:1385; 09:226). */
  private async bloquearDeParticipante(tx: Prisma.TransactionClient, actorId: string, vinculoId: string): Promise<ComponenteBloqueado> {
    if (!UUID.test(vinculoId)) throw errores.recursoNoEncontrado();
    const [c] = await tx.$queryRaw<ComponenteBloqueado[]>`
      SELECT av."id"::text AS "id", av."version", av."estado"::text AS "estado", av."pausado_por"::text AS "pausadoPor",
             vi."profesional_id"::text AS "profesionalId", vi."asesorado_id"::text AS "asesoradoId"
        FROM "alcance_de_vinculo" av JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
       WHERE av."id" = ${vinculoId}::uuid AND (vi."profesional_id" = ${actorId}::uuid OR vi."asesorado_id" = ${actorId}::uuid)
         FOR UPDATE OF av`;
    if (!c) throw errores.recursoNoEncontrado();
    return c;
  }
}
