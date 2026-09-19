import { Body, Controller, Get, Headers, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY, type MeResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { CierreService } from './cierre.service';
import { CuentaPropiaService } from './cuenta-propia.service';
import { RegistroService } from './registro.service';

/** API-ACC-01, ACC-05 y ACC-P1-03 (09v8 §4; 09v12). Prefijo global /api/v1. */
@Controller()
export class IdentidadController {
  constructor(
    private readonly registro: RegistroService,
    private readonly cuentaPropia: CuentaPropiaService,
    private readonly cierre: CierreService,
  ) {}

  /** API-ACC-01 — PUBLIC, Idempotency-Key requerida. */
  @Post('registrations')
  async registrar(
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: SolicitudConContexto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.registro.registrar(cuerpo, clave, contextoDe(req)));
  }

  /** API-ACC-05 — SESSION. */
  @Get('me')
  @UseGuards(SesionGuard)
  consultar(@Query() query: Record<string, unknown>, @Req() req: SolicitudAutenticada): Promise<MeResponse> {
    sinParametrosDeQuery(query);
    return this.cuentaPropia.consultar(actorDe(req));
  }

  /** API-ACC-P1-03 — SESSION_STEP_UP, Idempotency-Key requerida. La autenticación la resuelve el servicio (replay). */
  @Post('me/account-closure-requests')
  async solicitarCierre(
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: SolicitudConContexto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.cierre.solicitar(req.get('authorization'), cuerpo, clave, contextoDe(req)));
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
