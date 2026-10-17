import { Body, Controller, HttpCode, Post, Query, Req, Res } from '@nestjs/common';
import type { IniciarSesionResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { AccesoGoogleService } from './acceso-google.service';

/**
 * API-GOO-01, 02 y 03 (familia propia de BE; DEUDA_LEGAJO DL-138), bajo el prefijo que bosqueja el 09 v0.12 §11
 * («/auth/federated/google/…»). Todas PUBLIC: autentican con el ID token de Google, que viaja solo en el cuerpo.
 * Prefijo global /api/v1.
 */
@Controller('auth/federated/google')
export class AccesoGoogleController {
  constructor(private readonly acceso: AccesoGoogleService) {}

  /** API-GOO-01 — iniciar sesión con Google. */
  @Post('sessions')
  @HttpCode(201)
  iniciar(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: SolicitudConContexto): Promise<IniciarSesionResponse> {
    sinParametrosDeQuery(query);
    return this.acceso.iniciar(cuerpo, contextoDe(req));
  }

  /** API-GOO-02 — vincular Google a la cuenta con contraseña del mismo correo, y entrar. */
  @Post('links')
  @HttpCode(201)
  vincular(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: SolicitudConContexto): Promise<IniciarSesionResponse> {
    sinParametrosDeQuery(query);
    return this.acceso.vincular(cuerpo, contextoDe(req));
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
    const resultado = await this.acceso.registrar(cuerpo, contextoDe(req));
    res.status(resultado.estadoHttp);
    return resultado.cuerpo;
  }
}
