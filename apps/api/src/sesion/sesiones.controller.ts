import { Body, Controller, Delete, HttpCode, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { IniciarSesionResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { borrarCookieDeReanudacion, ReanudacionService } from './reanudacion.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from './sesion.guard';
import { SesionService } from './sesion.service';

/**
 * API-ACC-02, 03 y 04 (09v8 §4), y la reanudación del website (DL-147). Prefijo global /api/v1.
 * Una sesión abierta desde el website recibe además la cookie de reanudación; cerrar la sesión la borra.
 */
@Controller('auth/sessions')
export class SesionesController {
  constructor(
    private readonly sesiones: SesionService,
    private readonly reanudaciones: ReanudacionService,
  ) {}

  /** API-ACC-02 — PUBLIC. */
  @Post()
  @HttpCode(201)
  async iniciar(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: SolicitudConContexto, @Res({ passthrough: true }) res: Response): Promise<IniciarSesionResponse> {
    sinParametrosDeQuery(query);
    const ctx = contextoDe(req);
    const respuesta = await this.sesiones.iniciar(cuerpo, ctx);
    await this.reanudaciones.emitir(respuesta, ctx, res);
    return respuesta;
  }

  /**
   * API-ACC-02-REANUDACION (DL-147) — sin Bearer: autentica solo con la cookie de reanudación, y solo para devolver un
   * token nuevo de la misma sesión.
   */
  @Post('resume')
  @HttpCode(200)
  reanudar(@Query() query: Record<string, unknown>, @Req() req: SolicitudConContexto, @Res({ passthrough: true }) res: Response): Promise<IniciarSesionResponse> {
    sinParametrosDeQuery(query);
    return this.reanudaciones.reanudar(req.get('cookie'), req.get('origin'), contextoDe(req), res);
  }

  /** API-ACC-03 — SESSION (idempotente). También borra la cookie de reanudación del website. */
  @Delete('current')
  @HttpCode(204)
  async finalizarActual(@Query() query: Record<string, unknown>, @Req() req: SolicitudConContexto, @Res({ passthrough: true }) res: Response): Promise<void> {
    sinParametrosDeQuery(query);
    await this.sesiones.finalizarActual(req.get('authorization'), contextoDe(req));
    borrarCookieDeReanudacion(res);
  }

  /** API-ACC-04 — SESSION. También borra la cookie de reanudación de este navegador. */
  @Delete()
  @HttpCode(204)
  @UseGuards(SesionGuard)
  async revocarTodas(@Query() query: Record<string, unknown>, @Req() req: SolicitudAutenticada & SolicitudConContexto, @Res({ passthrough: true }) res: Response): Promise<void> {
    sinParametrosDeQuery(query);
    await this.sesiones.revocarTodas(actorDe(req), contextoDe(req));
    borrarCookieDeReanudacion(res);
  }
}
