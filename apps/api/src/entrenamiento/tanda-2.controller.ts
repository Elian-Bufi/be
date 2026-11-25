import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY, type EsfuerzosDeLaSesionResponse, type UnoRMDeLaPersonaResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { LimitadorService } from '../plataforma/limitador.service';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { EsfuerzoDeLaSesionService } from './esfuerzo-de-la-sesion.service';
import { UnoRMService } from './uno-rm.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2) · el 1RM de referencia (API-RMX-01 y 02) y el esfuerzo de la sesión (API-ESF-01
 * y 02). Como el resto de la familia TRN, ningún handler decide autorización: cada servicio la decide con el PDP dentro de
 * su transacción. Las lecturas consumen el límite de consultas protegidas del actor.
 */
@Controller()
@UseGuards(SesionGuard)
export class EditorDeEntrenamientoTanda2Controller {
  constructor(
    private readonly unoRM: UnoRMService,
    private readonly esfuerzo: EsfuerzoDeLaSesionService,
    private readonly limitador: LimitadorService,
  ) {}

  /** API-RMX-01: el 1RM de referencia de la persona en los ejercicios pedidos. */
  @Get('advisees/:adviseeId/training/one-rep-max')
  listar(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<UnoRMDeLaPersonaResponse> {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
    return this.unoRM.listar(actorDe(req), adviseeId, query, contextoDe(req));
  }

  /** API-RMX-02: sumar un 1RM de referencia (calibración, declarado o el registro). Idempotency-Key requerida. */
  @Post('advisees/:adviseeId/training/one-rep-max')
  async sumar(@Param('adviseeId') adviseeId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.unoRM.sumar(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req)));
  }

  /** API-ESF-01: la persona responde el esfuerzo de una sesión suya ya registrada. Idempotency-Key requerida. */
  @Post('training/executions/:executionId/session-effort')
  async registrar(@Param('executionId') executionId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.esfuerzo.registrar(actorDe(req), executionId, cuerpo, clave, contextoDe(req)));
  }

  /** API-ESF-02: los esfuerzos de la sesión del período que el profesional de Entrenamiento ya ve. */
  @Get('advisees/:adviseeId/training/session-efforts')
  delProfesional(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<EsfuerzosDeLaSesionResponse> {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
    return this.esfuerzo.delProfesional(actorDe(req), adviseeId, query, contextoDe(req));
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
