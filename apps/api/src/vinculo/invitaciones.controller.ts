import { Body, Controller, Get, Headers, HttpCode, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY, type ListaDeInvitacionesResponse, type VistaPreviaDeInvitacionResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { InvitacionesService } from './invitaciones.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * Familia INV (propia de BE; WP-INVITACION, DEUDA_LEGAJO DL-136): API-INV-01 a 05. Todas con AuthN SESSION. El token y el
 * código viajan siempre en el cuerpo, nunca en la URL. Prefijo global /api/v1.
 */
@Controller()
@UseGuards(SesionGuard)
export class InvitacionesController {
  constructor(private readonly invitaciones: InvitacionesService) {}

  /** API-INV-01 — Idempotency-Key requerida. */
  @Post('relationship-invitations')
  async crear(
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.invitaciones.crear(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** API-INV-02 — las propias del profesional. */
  @Get('relationship-invitations')
  listar(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ListaDeInvitacionesResponse> {
    return this.invitaciones.listar(actorDe(req), query, contextoDe(req));
  }

  /** API-INV-04 — una lectura con el secreto en el cuerpo: responde 200, no 201. */
  @Post('relationship-invitations/preview')
  @HttpCode(200)
  ver(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<VistaPreviaDeInvitacionResponse> {
    sinParametrosDeQuery(query);
    return this.invitaciones.ver(actorDe(req), cuerpo, contextoDe(req));
  }

  /** API-INV-05 — Idempotency-Key requerida. */
  @Post('relationship-invitations/claim')
  async usar(
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.invitaciones.usar(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** API-INV-03 — solo la propia; Idempotency-Key requerida. */
  @Post('relationship-invitations/:invitationId/revoke')
  async anular(
    @Param('invitationId') invitationId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.invitaciones.anular(actorDe(req), invitationId, cuerpo, clave, contextoDe(req)));
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
