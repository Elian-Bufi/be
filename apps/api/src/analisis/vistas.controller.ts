import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { VistasDeAnalisisService } from './vistas.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * API-VAN-01 a 04 (DL-128): las vistas de análisis guardadas del profesional. Ningún handler decide autorización: el
 * servicio lo hace dentro de su transacción. No son datos de salud ni tienen titular: no consumen el límite de lecturas
 * protegidas (como «Mis habituales» y las plantillas).
 */
@Controller()
@UseGuards(SesionGuard)
export class VistasDeAnalisisController {
  constructor(private readonly vistas: VistasDeAnalisisService) {}

  /** API-VAN-01. */
  @Get('me/analysis-views')
  listar(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    sinParametrosDeQuery(query);
    return this.vistas.listar(actorDe(req), contextoDe(req));
  }

  /** API-VAN-02. */
  @Post('me/analysis-views')
  async crear(@Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.vistas.crear(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** API-VAN-03. Sin Idempotency-Key: concurrencia por `expectedVersion`. */
  @Put('me/analysis-views/:viewId')
  async reemplazar(@Param('viewId') viewId: string, @Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.vistas.reemplazar(actorDe(req), viewId, cuerpo, contextoDe(req)));
  }

  /** API-VAN-04. 204 sin cuerpo, también al reintentar con la misma clave. */
  @Delete('me/analysis-views/:viewId')
  async borrar(@Param('viewId') viewId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<void> {
    sinParametrosDeQuery(query);
    await this.vistas.borrar(actorDe(req), viewId, cuerpo, clave, contextoDe(req));
    res.status(204);
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
