import { Body, Controller, Delete, HttpCode, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { IniciarSesionResponse } from '@be/domain';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { actorDe, SesionGuard, type SolicitudAutenticada } from './sesion.guard';
import { SesionService } from './sesion.service';

/** API-ACC-02, 03 y 04 (09v8 §4). Prefijo global /api/v1. */
@Controller('auth/sessions')
export class SesionesController {
  constructor(private readonly sesiones: SesionService) {}

  /** API-ACC-02 — PUBLIC. */
  @Post()
  @HttpCode(201)
  iniciar(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: SolicitudConContexto): Promise<IniciarSesionResponse> {
    sinParametrosDeQuery(query);
    return this.sesiones.iniciar(cuerpo, contextoDe(req));
  }

  /** API-ACC-03 — SESSION (idempotente). */
  @Delete('current')
  @HttpCode(204)
  async finalizarActual(@Query() query: Record<string, unknown>, @Req() req: SolicitudConContexto): Promise<void> {
    sinParametrosDeQuery(query);
    await this.sesiones.finalizarActual(req.get('authorization'), contextoDe(req));
  }

  /** API-ACC-04 — SESSION. */
  @Delete()
  @HttpCode(204)
  @UseGuards(SesionGuard)
  async revocarTodas(@Query() query: Record<string, unknown>, @Req() req: SolicitudAutenticada & SolicitudConContexto): Promise<void> {
    sinParametrosDeQuery(query);
    await this.sesiones.revocarTodas(actorDe(req), contextoDe(req));
  }
}
