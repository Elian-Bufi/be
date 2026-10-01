import { Body, Controller, Get, Headers, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { HabitualesNutricionalesService } from './habituales.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * API-HAN-01 a 05 — «Mis habituales» de nutrición (PF-09 bis; DL-109): los alimentos marcados y las comidas guardadas
 * del profesional. Ningún handler decide autorización: el servicio la resuelve dentro de su transacción. No llevan
 * nada de una persona, así que no consumen el límite de consultas protegidas.
 */
@Controller()
@UseGuards(SesionGuard)
export class HabitualesNutricionalesController {
  constructor(private readonly habituales: HabitualesNutricionalesService) {}

  /** API-HAN-01. */
  @Get('nutrition/favorite-items')
  listarAlimentos(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    sinParametrosDeQuery(query);
    return this.habituales.listarAlimentos(actorDe(req), contextoDe(req));
  }

  /** API-HAN-02. Sin Idempotency-Key: marcar y quitar son idempotentes por naturaleza. */
  @Patch('nutrition/favorite-items/:catalogItemId')
  async marcarAlimento(@Param('catalogItemId') catalogItemId: string, @Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.habituales.marcarAlimento(actorDe(req), catalogItemId, cuerpo, contextoDe(req)));
  }

  /** API-HAN-03. */
  @Get('nutrition/meal-presets')
  listarComidas(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    return this.habituales.listarComidas(actorDe(req), query, contextoDe(req));
  }

  /** API-HAN-04. */
  @Post('nutrition/meal-presets')
  async guardarComida(@Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.habituales.guardarComida(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** API-HAN-05. Sin Idempotency-Key: concurrencia por `expectedVersion`. */
  @Patch('nutrition/meal-presets/:presetId')
  async editarComida(@Param('presetId') presetId: string, @Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.habituales.editarComida(actorDe(req), presetId, cuerpo, contextoDe(req)));
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
