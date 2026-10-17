import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY, type DestinatariosPosiblesResponse, type ListaDeNotasPropiasResponse } from '@be/domain';
import type { Response } from 'express';
import { OperacionProtegida, PdpGuard, type SolicitudAutorizada } from '../autorizacion/pdp.guard';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { NotasDeCoordinacionService } from './notas.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * API-CRD-01 (09 §11.6) y sus dos variantes (WP-NOTAS-DE-COORDINACION; DEUDA_LEGAJO DL-140). AuthN SESSION en la demo
 * sintética: el 09 pide `SESSION_MFA` con datos reales sensibles (08 §25), el mismo tratamiento que FRM-03 (DL-088 #17).
 * Ningún handler decide autorización: la escritura decide con el PDP dentro de su transacción, la lista de destinatarios
 * pasa por el PdpGuard, y la lectura propia es del titular, con su A3. Prefijo global /api/v1.
 */
@Controller()
@UseGuards(SesionGuard)
export class NotasDeCoordinacionController {
  constructor(
    private readonly notas: NotasDeCoordinacionService,
    private readonly limitador: LimitadorService,
  ) {}

  /** API-CRD-01 — Idempotency-Key requerida. */
  @Post('advisees/:adviseeId/coordination-notes')
  async crear(
    @Param('adviseeId') adviseeId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    const resultado: ResultadoIdempotente = await this.notas.crear(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req));
    res.status(resultado.estadoHttp);
    return resultado.cuerpo;
  }

  /** API-CRD-01-LISTA — el PDP decide los alcances del autor; sin ninguno, el mismo 404 que una persona inexistente. */
  @Get('advisees/:adviseeId/coordination-notes/recipients')
  @UseGuards(PdpGuard)
  @OperacionProtegida({ operacion: 'API-CRD-01-LISTA', parametroDelTitular: 'adviseeId', validarConsulta: (query) => sinParametrosDeQuery(query) })
  destinatarios(@Param('adviseeId') _adviseeId: string, @Req() req: SolicitudAutorizada): Promise<DestinatariosPosiblesResponse> {
    return this.notas.destinatarios(req);
  }

  /** API-CRD-01-PROPIA — las notas sobre quien consulta, con el límite de consultas protegidas, como REV-A. */
  @Get('me/coordination-notes')
  propias(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ListaDeNotasPropiasResponse> {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
    return this.notas.propias(actorDe(req), query, contextoDe(req));
  }
}
