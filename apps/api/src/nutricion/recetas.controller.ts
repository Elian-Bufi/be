import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { RecetasService } from './recetas.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * Familia REC (DL-119; docs/paquetes/WP-NUTRICION-RECETAS.md §4): las recetas del profesional de Nutrición. Ningún handler
 * decide autorización: el servicio exige el profesional verificado y habilitado, y lo ajeno es 404.
 */
@Controller()
@UseGuards(SesionGuard)
export class RecetasController {
  constructor(private readonly recetas: RecetasService) {}

  /** API-REC-01. */
  @Post('nutrition/recipes')
  async crear(@Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.recetas.crear(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** API-REC-02. */
  @Get('nutrition/recipes')
  listar(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    return this.recetas.listar(actorDe(req), query, contextoDe(req));
  }

  /** API-REC-03. */
  @Get('nutrition/recipes/:recipeId')
  consultar(@Param('recipeId') recipeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    return this.recetas.consultar(actorDe(req), recipeId, query, contextoDe(req));
  }

  /** API-REC-04: emite una versión nueva. */
  @Patch('nutrition/recipes/:recipeId')
  async editar(@Param('recipeId') recipeId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.recetas.editar(actorDe(req), recipeId, cuerpo, clave, contextoDe(req)));
  }

  /** API-REC-05. */
  @Put('nutrition/recipes/:recipeId/image')
  async asociarImagen(@Param('recipeId') recipeId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.recetas.asociarImagen(actorDe(req), recipeId, cuerpo, clave, contextoDe(req)));
  }

  /** API-REC-06: `expectedVersion` va por query (un DELETE no lleva cuerpo). */
  @Delete('nutrition/recipes/:recipeId/image')
  async retirarImagen(@Param('recipeId') recipeId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    return responder(res, await this.recetas.retirarImagen(actorDe(req), recipeId, query, cuerpo, clave, contextoDe(req)));
  }

  /** API-REC-07: calcula sin guardar; no lleva Idempotency-Key. */
  @Post('nutrition/recipe-calculations')
  calcular(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    res.status(200);
    return this.recetas.calcular(actorDe(req), cuerpo, contextoDe(req));
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
