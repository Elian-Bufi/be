import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY, type FormularioVinculadoConRespuestasResponse, type FormulariosVinculadosResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { LimitadorService } from '../plataforma/limitador.service';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { EvaluacionYFormulariosService } from './evaluacion-y-formularios.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * WP-EVALUACION-Y-FORMULARIOS (DL-185) · API-EVF-01 a 04: los formularios vinculados a la evaluación inicial. `:area` es
 * `nutrition` o `training`; cualquier otra cosa, el 404 de lo inexistente (lo decide el servicio, como la autorización).
 * Las lecturas devuelven datos de salud: consumen el límite de consultas protegidas del actor.
 */
@Controller()
@UseGuards(SesionGuard)
export class EvaluacionYFormulariosController {
  constructor(
    private readonly servicio: EvaluacionYFormulariosService,
    private readonly limitador: LimitadorService,
  ) {}

  /** API-EVF-01. */
  @Get(':area/evaluations/:evaluationId/linked-forms')
  listar(@Param('area') area: string, @Param('evaluationId') evaluationId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<FormulariosVinculadosResponse> {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
    return this.servicio.listar(actorDe(req), area, evaluationId, query, contextoDe(req));
  }

  /** API-EVF-02. */
  @Post(':area/evaluations/:evaluationId/linked-forms')
  async vincular(
    @Param('area') area: string,
    @Param('evaluationId') evaluationId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.servicio.vincular(actorDe(req), area, evaluationId, cuerpo, clave, contextoDe(req)));
  }

  /** API-EVF-03. */
  @Post(':area/evaluations/:evaluationId/linked-forms/:linkId/removal')
  async desvincular(
    @Param('area') area: string,
    @Param('evaluationId') evaluationId: string,
    @Param('linkId') linkId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.servicio.desvincular(actorDe(req), area, evaluationId, linkId, cuerpo, clave, contextoDe(req)));
  }

  /** API-EVF-04. */
  @Get(':area/evaluations/:evaluationId/linked-forms/:linkId')
  abrir(
    @Param('area') area: string,
    @Param('evaluationId') evaluationId: string,
    @Param('linkId') linkId: string,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
  ): Promise<FormularioVinculadoConRespuestasResponse> {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
    return this.servicio.abrir(actorDe(req), area, evaluationId, linkId, query, contextoDe(req));
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
