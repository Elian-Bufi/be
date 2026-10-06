import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { RegistroDeComidasService } from './registro-de-comidas.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * Familia ING (DL-121; docs/paquetes/WP-NUTRICION-RECETAS.md §4): el registro v2 de comidas de la APK nueva. Ningún
 * handler decide autorización: cada servicio invoca al PDP dentro de su transacción.
 */
@Controller()
@UseGuards(SesionGuard)
export class RegistroDeComidasController {
  constructor(
    private readonly registro: RegistroDeComidasService,
    private readonly limitador: LimitadorService,
  ) {}

  /** API-ING-01. */
  @Get('me/nutrition/today/options')
  hoyConOpciones(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    return this.registro.hoyConOpciones(actorDe(req), query, contextoDe(req));
  }

  /** API-ING-02: el mismo comando desde el carrusel y desde el detalle, con la misma clave por intento. */
  @Post('me/nutrition/meal-records')
  async registrar(@Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.registro.registrar(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** API-ING-04. */
  @Get('me/nutrition/meal-records')
  listarPropios(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    return this.registro.listarPropios(actorDe(req), query, contextoDe(req));
  }

  /** API-ING-03. Una lectura protegida: consume el límite de consultas del actor. */
  @Get('nutrition/meal-records/:recordId')
  consultar(@Param('recordId') recordId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
    return this.registro.consultar(actorDe(req), recordId, query, contextoDe(req));
  }

  /** API-ING-05. */
  @Post('nutrition/meal-records/:recordId/consumed-quantities')
  async rectificar(@Param('recordId') recordId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.registro.rectificar(actorDe(req), recordId, cuerpo, clave, contextoDe(req)));
  }

  /** API-ING-06. */
  @Post('nutrition/meal-records/:recordId/annulment')
  async anular(@Param('recordId') recordId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.registro.anular(actorDe(req), recordId, cuerpo, clave, contextoDe(req)));
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
