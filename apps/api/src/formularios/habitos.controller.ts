import { Body, Controller, Get, Headers, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY, type HabitosCompartidosResponse, type MisHabitosResponse } from '@be/domain';
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
 * API-HBT-05). Las dos lecturas consumen el límite de consultas protegidas del actor.
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

  /** Límite de consultas protegidas por actor, desde cualquier red (como FRI-02 y FRI-03). */
  private limitar(req: Solicitud): void {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
