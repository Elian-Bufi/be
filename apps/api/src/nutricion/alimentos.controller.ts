import { Body, Controller, Get, Headers, HttpCode, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { AlimentosService } from './alimentos.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * Familia ALI (DL-180; docs/paquetes/WP-NUTRICION-ALIMENTOS.md): los alimentos que un profesional de Nutrición cargó a
 * mano. Ningún handler decide autorización: el servicio exige el profesional verificado y habilitado, y lo ajeno es 404.
 * Las rutas fijas (`mine`, `lookup`) van antes que la del alimento.
 */
@Controller()
@UseGuards(SesionGuard)
export class AlimentosController {
  constructor(private readonly alimentos: AlimentosService) {}

  /** API-ALI-01. */
  @Get('nutrition/catalog-items/mine')
  listarPropios(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    return this.alimentos.listarPropios(actorDe(req), query);
  }

  /** API-ALI-04: una lectura con las identidades en el cuerpo; 200, sin Idempotency-Key. */
  @Post('nutrition/catalog-items/lookup')
  @HttpCode(200)
  consultar(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    sinParametrosDeQuery(query);
    return this.alimentos.consultar(actorDe(req), cuerpo);
  }

  /** API-ALI-02: emite una versión nueva. */
  @Patch('nutrition/catalog-items/:catalogItemId')
  async corregir(
    @Param('catalogItemId') catalogItemId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.alimentos.corregir(actorDe(req), catalogItemId, cuerpo, clave, contextoDe(req)));
  }

  /** API-ALI-03: emite una versión RETIRADO. */
  @Post('nutrition/catalog-items/:catalogItemId/retirement')
  async retirar(
    @Param('catalogItemId') catalogItemId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.alimentos.retirar(actorDe(req), catalogItemId, cuerpo, clave, contextoDe(req)));
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
