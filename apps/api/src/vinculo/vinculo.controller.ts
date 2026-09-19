import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY, type DetalleDeVinculoResponse, type ListaDeSolicitudesResponse, type ListaDeVinculosResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { SolicitudesService } from './solicitudes.service';
import { VinculosService } from './vinculos.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/** Familia REL (09v8 §6): API-REL-01 a 09. Todas con AuthN SESSION. Prefijo global /api/v1. */
@Controller()
@UseGuards(SesionGuard)
export class VinculoController {
  constructor(private readonly solicitudes: SolicitudesService, private readonly vinculos: VinculosService) {}

  /** API-REL-01 — Idempotency-Key requerida. */
  @Post('relationship-requests')
  async crearSolicitud(
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.solicitudes.crear(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** API-REL-02. */
  @Get('me/relationship-requests')
  listarSolicitudes(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ListaDeSolicitudesResponse> {
    return this.solicitudes.listar(actorDe(req), query);
  }

  /** API-REL-03 — solo el asesorado titular. */
  @Post('relationship-requests/:requestId/accept')
  async aceptar(
    @Param('requestId') requestId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.solicitudes.aceptar(actorDe(req), requestId, cuerpo, clave, contextoDe(req)));
  }

  /** API-REL-04 — solo el asesorado titular. */
  @Post('relationship-requests/:requestId/reject')
  async rechazar(
    @Param('requestId') requestId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.solicitudes.rechazar(actorDe(req), requestId, cuerpo, clave, contextoDe(req)));
  }

  /** API-REL-05. */
  @Get('me/relationships')
  listarVinculos(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ListaDeVinculosResponse> {
    return this.vinculos.listar(actorDe(req), query);
  }

  /** API-REL-06 — no participante → 404 idéntico. */
  @Get('relationships/:relationshipId')
  detalle(@Param('relationshipId') relationshipId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<DetalleDeVinculoResponse> {
    sinParametrosDeQuery(query);
    return this.vinculos.detalle(actorDe(req), relationshipId, contextoDe(req));
  }

  /** API-REL-07. */
  @Post('relationships/:relationshipId/pause')
  async pausar(
    @Param('relationshipId') relationshipId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.vinculos.pausar(actorDe(req), relationshipId, cuerpo, clave, contextoDe(req)));
  }

  /** API-REL-08. */
  @Post('relationships/:relationshipId/resume')
  async reanudar(
    @Param('relationshipId') relationshipId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.vinculos.reanudar(actorDe(req), relationshipId, cuerpo, clave, contextoDe(req)));
  }

  /** API-REL-09. */
  @Post('relationships/:relationshipId/finalize')
  async finalizar(
    @Param('relationshipId') relationshipId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.vinculos.finalizar(actorDe(req), relationshipId, cuerpo, clave, contextoDe(req)));
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
