import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { SeriesObservadasService } from './series-observadas.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * ED-72 (WP-EDITORES-PROFESIONAL; DL-171) · La serie observada por el profesional: API-FZA-01 a 03. Como el resto de la
 * familia TRN, ningún handler decide autorización: el servicio la decide con el PDP dentro de su transacción.
 */
@Controller()
@UseGuards(SesionGuard)
export class FuerzaController {
  constructor(private readonly series: SeriesObservadasService) {}

  /** API-FZA-01: registrar una serie observada, con su estimación. */
  @Post('advisees/:adviseeId/training/observed-sets')
  async registrar(@Param('adviseeId') adviseeId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.series.registrar(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req)));
  }

  /** API-FZA-02: las series observadas vigentes de la persona, por ejercicio si se pide. */
  @Get('advisees/:adviseeId/training/observed-sets')
  listar(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    return this.series.listar(actorDe(req), adviseeId, query, contextoDe(req));
  }

  /** API-FZA-03: corregir o anular una serie observada, con una nueva que la sucede. */
  @Post('training/observed-sets/:observationId/successors')
  async suceder(@Param('observationId') observationId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.series.suceder(actorDe(req), observationId, cuerpo, clave, contextoDe(req)));
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
