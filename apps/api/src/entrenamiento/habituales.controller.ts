import { Body, Controller, Get, Headers, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { HabitualesDeEntrenamientoService } from './habituales.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * «Mis habituales» de entrenamiento (DL-109; API-HAB-01 a 05): ejercicios marcados y sesiones guardadas del
 * profesional. Como en el resto de la familia TRN, ningún handler decide autorización: el servicio lo hace dentro de
 * su transacción. No son datos de salud: no consumen el límite de consultas protegidas (como las plantillas).
 */
@Controller()
@UseGuards(SesionGuard)
export class HabitualesDeEntrenamientoController {
  constructor(private readonly habituales: HabitualesDeEntrenamientoService) {}

  /** API-HAB-01. */
  @Get('training/favorite-exercises')
  listarEjercicios(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    sinParametrosDeQuery(query);
    return this.habituales.listarEjercicios(actorDe(req), contextoDe(req));
  }

  /** API-HAB-02. Sin Idempotency-Key: marcar o quitar es idempotente por naturaleza. */
  @Patch('training/favorite-exercises/:exerciseId')
  async marcarEjercicio(@Param('exerciseId') exerciseId: string, @Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.habituales.marcarEjercicio(actorDe(req), exerciseId, cuerpo, contextoDe(req)));
  }

  /** API-HAB-03. */
  @Get('training/session-presets')
  listarSesiones(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    return this.habituales.listarSesiones(actorDe(req), query, contextoDe(req));
  }

  /** API-HAB-04. */
  @Post('training/session-presets')
  async guardarSesion(@Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.habituales.guardarSesion(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** API-HAB-05. Sin Idempotency-Key: concurrencia por expectedVersion. */
  @Patch('training/session-presets/:presetId')
  async editarSesion(@Param('presetId') presetId: string, @Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.habituales.editarSesion(actorDe(req), presetId, cuerpo, contextoDe(req)));
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
