import { Body, Controller, Get, Headers, HttpCode, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY, type LoQueSePuedeCompartirResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { errores } from '../http/errores';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { CompartirService } from './compartir.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * Familia CMP (WP-COMPARTIR; DL-176; decisión de Dirección del 2026-11-15): compartir casi por omisión, con una sola pantalla
 * de consentimiento al aceptar el vínculo y un toque que escribe todo lo elegido. Familia propia de BE: el 09 no tiene
 * estas operaciones (lo nuevo va en operaciones nuevas, DL-137 D-7).
 *
 * Como en RES y HIA, ningún handler autoriza: todo es de la persona sobre lo suyo, y el servicio decide. La lectura consume
 * el límite de consultas protegidas del actor.
 */
@Controller()
@UseGuards(SesionGuard)
export class CompartirController {
  constructor(
    private readonly compartir: CompartirService,
    private readonly limitador: LimitadorService,
  ) {}

  /** API-CMP-01. Lo que puedo compartir y lo que ya comparto; con `relationshipId`, lo que toca a ese componente. */
  @Get('me/sharing-proposal')
  propuesta(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<LoQueSePuedeCompartirResponse> {
    const desconocidos = Object.keys(query ?? {}).filter((k) => k !== 'relationshipId');
    const relationshipId = query?.relationshipId;
    if (desconocidos.length > 0) throw errores.solicitudInvalida(desconocidos.map((c) => ({ code: 'UNKNOWN_QUERY_PARAMETER', path: c })));
    if (relationshipId !== undefined && (typeof relationshipId !== 'string' || relationshipId.length === 0)) throw errores.solicitudInvalida([{ code: 'INVALID_VALUE', path: 'relationshipId' }]);
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
    return this.compartir.propuesta(actorDe(req), typeof relationshipId === 'string' ? relationshipId : null, contextoDe(req));
  }

  /** API-CMP-02. Un toque: todo lo elegido, en una sola transacción. */
  @Post('me/sharing-choices')
  @HttpCode(200)
  async compartirLoElegido(
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.compartir.compartir(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** API-CMP-03. Dejar de compartir una cosa, desde ahora. */
  @Post('me/sharing-choices/withdrawal')
  @HttpCode(200)
  async retirar(
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.compartir.retirar(actorDe(req), cuerpo, clave, contextoDe(req)));
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
