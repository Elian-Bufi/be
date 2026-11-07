import { Body, Controller, Get, Headers, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import {
  HEADER_IDEMPOTENCY_KEY,
  type LoQueSeComparteDeMiAreaResponse,
  type MisResumenesCompartidosResponse,
  type PedidosDePlanResponse,
  type PlanCompartidoResponse,
  type ResumenesParaElProfesionalResponse,
} from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { ResumenesService } from './resumenes.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * Familia RES (WP-TABLERO-ALTA-GAMA TB-52 a TB-56; DEUDA_LEGAJO DL-163 D-13, ampliada por Dirección el 2026-11-07): lo que
 * la persona les comparte a sus profesionales de otras áreas, el plan del otro y el pedido de verlo. Familia propia de BE:
 * el 09 no tiene estas operaciones (lo nuevo va en operaciones nuevas, DL-137 D-7). Ninguna APK instalada las llama.
 *
 * Como en HBT, ningún handler autoriza: el servicio decide con el A3 de la persona (lo suyo) y con el PDP (el profesional,
 * API-RES-04 y 06 a 08). Las lecturas consumen el límite de consultas protegidas del actor.
 */
@Controller()
@UseGuards(SesionGuard)
export class ResumenesController {
  constructor(
    private readonly resumenes: ResumenesService,
    private readonly limitador: LimitadorService,
  ) {}

  /** API-RES-01. Lo que comparto de otras áreas, con quién, en qué nivel, desde cuándo y quién lo miró. */
  @Get('me/summary-sharing')
  mios(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<MisResumenesCompartidosResponse> {
    sinParametrosDeQuery(query);
    this.limitar(req);
    return this.resumenes.mios(actorDe(req), contextoDe(req));
  }

  /** API-RES-02. Compartir, o cambiar con quiénes y en qué nivel, con el texto que se acepta. */
  @Put('me/summary-sharing')
  async compartir(
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.resumenes.compartir(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** API-RES-03. Dejar de compartir todo, a la vez. */
  @Post('me/summary-sharing/withdrawal')
  async dejarDeCompartir(
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.resumenes.dejarDeCompartir(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** API-RES-09. Los pedidos de ver un plan que esperan mi respuesta. */
  @Get('me/summary-sharing/access-requests')
  pedidos(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<PedidosDePlanResponse> {
    sinParametrosDeQuery(query);
    this.limitar(req);
    return this.resumenes.pedidosQueEsperan(actorDe(req), contextoDe(req));
  }

  /** API-RES-10. Responder un pedido: «Sí, que lo vea» o «No, por ahora». */
  @Post('me/summary-sharing/access-requests/:accessRequestId/answer')
  async responderPedido(
    @Param('accessRequestId') accessRequestId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.resumenes.responderPedido(actorDe(req), accessRequestId, cuerpo, clave, contextoDe(req)));
  }

  /** API-RES-04. Las otras áreas de la persona, quién las lleva, qué le comparte de cada una y su pedido. */
  @Get('advisees/:adviseeId/shared-summaries')
  paraElProfesional(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ResumenesParaElProfesionalResponse> {
    sinParametrosDeQuery(query);
    this.limitar(req);
    return this.resumenes.paraElProfesional(actorDe(req), adviseeId, contextoDe(req));
  }

  /** API-RES-07. Con quién se comparte lo de mi área con esta persona. Va antes que la ruta con el área. */
  @Get('advisees/:adviseeId/shared-summaries/outgoing')
  loQueSeComparte(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<LoQueSeComparteDeMiAreaResponse> {
    sinParametrosDeQuery(query);
    this.limitar(req);
    return this.resumenes.loQueSeComparte(actorDe(req), adviseeId, contextoDe(req));
  }

  /** API-RES-06. El plan vigente de un área compartida con «resumen y plan»; si no, el 404 de lo inexistente. */
  @Get('advisees/:adviseeId/shared-summaries/:area/plan')
  plan(@Param('adviseeId') adviseeId: string, @Param('area') area: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<PlanCompartidoResponse> {
    sinParametrosDeQuery(query);
    this.limitar(req);
    return this.resumenes.plan(actorDe(req), adviseeId, area, contextoDe(req));
  }

  /** API-RES-08. El profesional pide ver el plan de otra área, desde la suya: le llega a la persona como novedad importante. */
  @Post('advisees/:adviseeId/shared-summaries/access-requests')
  async pedirVerElPlan(
    @Param('adviseeId') adviseeId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.resumenes.pedirVerElPlan(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req)));
  }

  /** Límite de consultas protegidas por actor, desde cualquier red (como HBT). */
  private limitar(req: Solicitud): void {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
