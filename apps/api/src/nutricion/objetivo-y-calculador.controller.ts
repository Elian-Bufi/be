import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { ObjetivoYCalculadorService } from './objetivo-y-calculador.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * API-OBC-01 a 03 (WP-OBJETIVO-Y-CALCULADOR, DL-186) · El objetivo nutricional con una toma de Antropometría de
 * referencia y el calculador de macros, solo para el profesional. Ningún handler decide autorización: el servicio la
 * resuelve dentro de su transacción. Las lecturas llevan datos de salud: consumen el límite de consultas protegidas.
 */
@Controller()
@UseGuards(SesionGuard)
export class ObjetivoYCalculadorController {
  constructor(
    private readonly servicio: ObjetivoYCalculadorService,
    private readonly limitador: LimitadorService,
  ) {}

  /** API-OBC-01: las tomas que se pueden usar de referencia. */
  @Get('advisees/:adviseeId/nutrition/objective-reference/measurements')
  tomas(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.servicio.tomas(actorDe(req), adviseeId, query, contextoDe(req));
  }

  /** API-OBC-02: una versión nueva del objetivo con su referencia y su cálculo. */
  @Post('advisees/:adviseeId/nutrition/objectives/with-reference')
  async crear(@Param('adviseeId') adviseeId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    const r = await this.servicio.crear(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req));
    res.status(r.estadoHttp);
    return r.cuerpo;
  }

  /** API-OBC-03: la referencia y el cálculo de una versión del objetivo, y cómo está hoy la toma. */
  @Get('nutrition/objective-versions/:versionId/reference')
  leer(@Param('versionId') versionId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.servicio.leer(actorDe(req), versionId, query, contextoDe(req));
  }

  private limitar(req: Solicitud): void {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
  }
}
