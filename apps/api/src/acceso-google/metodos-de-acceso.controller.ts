import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { MetodosDeAccesoResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { MetodosDeAccesoService } from './metodos-de-acceso.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * RF-004 (DL-172): API-MET-01 a 03, los métodos de acceso de la cuenta propia, en las rutas que bosqueja el 09 v0.12 §12.
 * Con sesión; el segundo factor del profesional y la entrada reciente los decide el servicio. Prefijo global /api/v1.
 */
@Controller('me/access-methods')
@UseGuards(SesionGuard)
export class MetodosDeAccesoController {
  constructor(private readonly metodos: MetodosDeAccesoService) {}

  /** API-MET-01. */
  @Get()
  listar(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<MetodosDeAccesoResponse> {
    sinParametrosDeQuery(query);
    return this.metodos.listar(actorDe(req));
  }

  /** API-MET-02 — 201 si vinculó; 200 si esa cuenta de Google ya estaba vinculada. */
  @Post()
  async vincular(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<MetodosDeAccesoResponse> {
    sinParametrosDeQuery(query);
    const r = await this.metodos.vincular(actorDe(req), cuerpo, contextoDe(req));
    res.status(r.estadoHttp);
    return r.cuerpo;
  }

  /** API-MET-03 — SESSION_STEP_UP. */
  @Delete(':methodId')
  @HttpCode(200)
  desvincular(@Param('methodId') metodoId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<MetodosDeAccesoResponse> {
    sinParametrosDeQuery(query);
    return this.metodos.desvincular(actorDe(req), metodoId, contextoDe(req));
  }
}
