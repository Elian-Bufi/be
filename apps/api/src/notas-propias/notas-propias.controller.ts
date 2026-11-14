import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY, type ListaDeNotasPropiasDelProfesionalResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { NotasPropiasService } from './notas-propias.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * WP-PULIDO-GRANDES PG-16 (DL-173; PG-D11) · API-NPP-01 a 03. Ningún handler decide autorización: el servicio decide con
 * el PDP dentro de su transacción, y solo el autor ve y archiva lo suyo. La lista consume el límite de consultas
 * protegidas del actor.
 */
@Controller()
@UseGuards(SesionGuard)
export class NotasPropiasController {
  constructor(
    private readonly notas: NotasPropiasService,
    private readonly limitador: LimitadorService,
  ) {}

  /** API-NPP-01: agregar una nota propia sobre la persona. Idempotency-Key requerida. */
  @Post('advisees/:adviseeId/professional-notes')
  async agregar(
    @Param('adviseeId') adviseeId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.notas.agregar(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req)));
  }

  /** API-NPP-02: las notas propias sobre la persona, activas y archivadas. */
  @Get('advisees/:adviseeId/professional-notes')
  listar(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ListaDeNotasPropiasDelProfesionalResponse> {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
    return this.notas.listar(actorDe(req), adviseeId, query, contextoDe(req));
  }

  /** API-NPP-03: archivar una nota propia (queda en la historia). Idempotency-Key requerida. */
  @Post('professional-notes/:noteId/archive')
  async archivar(
    @Param('noteId') noteId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.notas.archivar(actorDe(req), noteId, cuerpo, clave, contextoDe(req)));
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
