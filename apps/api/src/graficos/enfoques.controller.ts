import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY, type EleccionesDeEnfoqueResponse, type ListaDeEnfoquesResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { EnfoquesService } from './enfoques.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * WP-GRAFICOS GR-27 (DL-174) · API-GRF-01 a 07, los enfoques. Ningún handler decide autorización: el servicio lo hace
 * dentro de su transacción. Los enfoques son configuración del profesional, sin titular ni datos de salud, y no consumen
 * el límite de lecturas protegidas (como las vistas de «Analizar»); la lectura de las elecciones de una persona
 * (API-GRF-05), sí.
 */
@Controller()
@UseGuards(SesionGuard)
export class EnfoquesController {
  constructor(
    private readonly enfoques: EnfoquesService,
    private readonly limitador: LimitadorService,
  ) {}

  /** API-GRF-01. */
  @Get('me/chart-sets')
  listar(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ListaDeEnfoquesResponse> {
    sinParametrosDeQuery(query);
    return this.enfoques.listar(actorDe(req), contextoDe(req));
  }

  /** API-GRF-02. Idempotency-Key requerida. */
  @Post('me/chart-sets')
  async crear(@Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.enfoques.crear(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** API-GRF-03. Sin Idempotency-Key: concurrencia por `expectedVersion`. */
  @Put('me/chart-sets/:setId')
  async reemplazar(@Param('setId') setId: string, @Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.enfoques.reemplazar(actorDe(req), setId, cuerpo, contextoDe(req)));
  }

  /** API-GRF-04. 204 sin cuerpo, también al reintentar con la misma clave. */
  @Delete('me/chart-sets/:setId')
  async borrar(@Param('setId') setId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<void> {
    sinParametrosDeQuery(query);
    await this.enfoques.borrar(actorDe(req), setId, cuerpo, clave, contextoDe(req));
    res.status(204);
  }

  /** API-GRF-05. Consume el límite de consultas protegidas del actor, desde cualquier red. */
  @Get('advisees/:adviseeId/chart-set-choices')
  elecciones(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<EleccionesDeEnfoqueResponse> {
    sinParametrosDeQuery(query);
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
    return this.enfoques.elecciones(actorDe(req), adviseeId, contextoDe(req));
  }

  /** API-GRF-06. Sin Idempotency-Key: crear es `expectedVersion: null` (201); cambiar, con la versión leída (200). */
  @Put('advisees/:adviseeId/chart-set-choices')
  async elegir(@Param('adviseeId') adviseeId: string, @Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.enfoques.elegir(actorDe(req), adviseeId, cuerpo, contextoDe(req)));
  }

  /** API-GRF-07. 204 sin cuerpo, también al reintentar con la misma clave (si el PDP lo sigue permitiendo). */
  @Delete('advisees/:adviseeId/chart-set-choices/:choiceId')
  async quitar(
    @Param('adviseeId') adviseeId: string,
    @Param('choiceId') choiceId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    sinParametrosDeQuery(query);
    await this.enfoques.quitar(actorDe(req), adviseeId, choiceId, cuerpo, clave, contextoDe(req));
    res.status(204);
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
