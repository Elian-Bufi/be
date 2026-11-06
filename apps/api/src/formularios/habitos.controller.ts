import { Body, Controller, Get, Headers, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY, type HabitosCompartidosResponse, type HabitosParaElProfesionalResponse, type MisHabitosResponse, type PedidosDeAccesoResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { HabitosService } from './habitos.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * Familia HBT (WP-FORMULARIOS-RONDA-2, FR-10; DEUDA_LEGAJO DL-165 D-9): los hábitos de la persona y la autorización para
 * compartirlos con sus profesionales. Familia propia de BE: el diseño la llamaba HAB, que ya es «Mis habituales» de
 * entrenamiento (DL-109), y repetir un ID es lo que DL-116 prohíbe (D-14).
 *
 * Como en FRI, ningún handler autoriza: el servicio decide con el A3 de la persona (lo suyo) y con el PDP (el profesional,
 * API-HBT-05 a 07). Las lecturas consumen el límite de consultas protegidas del actor.
 *
 * Ronda 2.1 (DL-165 D-17 nueva): «Pedir acceso a sus hábitos». API-HBT-06 y 07 son del profesional (el website); 08 y 09,
 * de la persona (la APK 0.22). Las cuatro de la persona que lee la 0.21 no cambian de forma (DL-152).
 */
@Controller()
@UseGuards(SesionGuard)
export class HabitosController {
  constructor(
    private readonly habitos: HabitosService,
    private readonly limitador: LimitadorService,
  ) {}

  /** API-HBT-01. Mis hábitos: lo vigente, la historia, la autorización y mis profesionales. */
  @Get('me/habits')
  mios(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<MisHabitosResponse> {
    sinParametrosDeQuery(query);
    this.limitar(req);
    return this.habitos.mios(actorDe(req), contextoDe(req));
  }

  /** API-HBT-02. Una versión nueva de mis hábitos, desde «Mis hábitos». */
  @Post('me/habits')
  async registrar(
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.habitos.registrar(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** API-HBT-03. Compartirlos, o cambiar con quiénes. */
  @Put('me/habits/sharing')
  async compartir(
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.habitos.compartir(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** API-HBT-04. Dejar de compartirlos, para todos a la vez. */
  @Post('me/habits/sharing/withdrawal')
  async dejarDeCompartir(
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.habitos.dejarDeCompartir(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** API-HBT-05. Los hábitos que la persona le comparte a este profesional; si no, el 404 de lo inexistente. */
  @Get('advisees/:adviseeId/habits')
  deLaPersona(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<HabitosCompartidosResponse> {
    sinParametrosDeQuery(query);
    this.limitar(req);
    return this.habitos.deLaPersona(actorDe(req), adviseeId, contextoDe(req));
  }

  /** API-HBT-06. El profesional le pide a la persona ver sus hábitos, desde su área: le llega como novedad importante. */
  @Post('advisees/:adviseeId/habits/access-requests')
  async pedirAcceso(
    @Param('adviseeId') adviseeId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.habitos.pedirAcceso(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req)));
  }

  /** API-HBT-07. Lo que este profesional sabe de los hábitos de la persona: si los recibe, lo más nuevo que ve y su último pedido. */
  @Get('advisees/:adviseeId/habits/status')
  paraElProfesional(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<HabitosParaElProfesionalResponse> {
    sinParametrosDeQuery(query);
    this.limitar(req);
    return this.habitos.paraElProfesional(actorDe(req), adviseeId, contextoDe(req));
  }

  /** API-HBT-08. Los pedidos de acceso que esperan mi respuesta. */
  @Get('me/habits/access-requests')
  pedidos(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<PedidosDeAccesoResponse> {
    sinParametrosDeQuery(query);
    this.limitar(req);
    return this.habitos.pedidosQueEsperan(actorDe(req), contextoDe(req));
  }

  /** API-HBT-09. Responder un pedido de acceso: «Sí, que los vea» o «No, por ahora». */
  @Post('me/habits/access-requests/:accessRequestId/answer')
  async responderPedido(
    @Param('accessRequestId') accessRequestId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.habitos.responderPedido(actorDe(req), accessRequestId, cuerpo, clave, contextoDe(req)));
  }

  /** Límite de consultas protegidas por actor, desde cualquier red (como FRI-02 y FRI-03). */
  private limitar(req: Solicitud): void {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
