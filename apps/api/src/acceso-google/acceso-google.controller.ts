import { Body, Controller, HttpCode, Post, Query, Req, Res } from '@nestjs/common';
import type { IniciarSesionResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { ReanudacionService } from '../sesion/reanudacion.service';
import { AccesoGoogleService } from './acceso-google.service';

/**
 * API-GOO-01, 02 y 03 (familia propia de BE; DEUDA_LEGAJO DL-138), bajo el prefijo que bosqueja el 09 v0.12 §11
 * («/auth/federated/google/…»). Todas PUBLIC: autentican con el ID token de Google, que viaja solo en el cuerpo.
 * Prefijo global /api/v1. Una sesión abierta desde el website recibe además la cookie de reanudación (DL-147).
 */
@Controller('auth/federated/google')
export class AccesoGoogleController {
  constructor(
    private readonly acceso: AccesoGoogleService,
    private readonly reanudaciones: ReanudacionService,
  ) {}

  /** API-GOO-01 — iniciar sesión con Google. */
  @Post('sessions')
  @HttpCode(201)
  async iniciar(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: SolicitudConContexto, @Res({ passthrough: true }) res: Response): Promise<IniciarSesionResponse> {
    sinParametrosDeQuery(query);
    const ctx = contextoDe(req);
    const respuesta = await this.acceso.iniciar(cuerpo, ctx);
    await this.reanudaciones.emitir(respuesta, ctx, res);
    return respuesta;
  }

  /** API-GOO-02 — vincular Google a la cuenta con contraseña del mismo correo, y entrar. */
  @Post('links')
  @HttpCode(201)
  async vincular(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: SolicitudConContexto, @Res({ passthrough: true }) res: Response): Promise<IniciarSesionResponse> {
    sinParametrosDeQuery(query);
    const ctx = contextoDe(req);
    const respuesta = await this.acceso.vincular(cuerpo, ctx);
    await this.reanudaciones.emitir(respuesta, ctx, res);
    return respuesta;
  }

  /** API-GOO-03 — crear la cuenta con Google (201), o entrar si esa cuenta de Google ya tiene una (200). */
  @Post('registrations')
  async registrar(
    @Body() cuerpo: unknown,
    @Query() query: Record<string, unknown>,
    @Req() req: SolicitudConContexto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IniciarSesionResponse> {
    sinParametrosDeQuery(query);
    const ctx = contextoDe(req);
    const resultado = await this.acceso.registrar(cuerpo, ctx);
    await this.reanudaciones.emitir(resultado.cuerpo, ctx, res);
    res.status(resultado.estadoHttp);
    return resultado.cuerpo;
  }
}
