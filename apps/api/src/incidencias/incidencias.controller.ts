import { Body, Controller, Get, Headers, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY, type ListaDeIncidenciasPropiasResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { IncidenciasService } from './incidencias.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * RF-068 (DL-172): API-INC-01 y 02, lo de quien avisa un problema, con su sesión (persona o profesional; lo profesional no
 * hace falta para avisar). Las de Administración (API-INC-03 a 05) están en `AdministracionController`, con su sesión
 * administrativa y el segundo factor. Prefijo global /api/v1.
 */
@Controller()
export class IncidenciasController {
  constructor(private readonly incidencias: IncidenciasService) {}

  /** API-INC-01 — Idempotency-Key requerida. */
  @Post('incidents')
  @UseGuards(SesionGuard)
  async reportar(
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    const r = await this.incidencias.reportar(actorDe(req), cuerpo, clave, contextoDe(req));
    res.status(r.estadoHttp);
    return r.cuerpo;
  }

  /** API-INC-02. */
  @Get('me/incidents')
  @UseGuards(SesionGuard)
  propias(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ListaDeIncidenciasPropiasResponse> {
    return this.incidencias.propias(actorDe(req), query);
  }
}
