import { Body, Controller, Get, Headers, Param, Post, Put, Query, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { SinTipoDeSerieInterceptor } from '../http/sin-tipo-de-serie.interceptor';
import { SinBloquesDeLaSesionInterceptor } from '../http/sin-bloques-de-la-sesion.interceptor';
import { HEADER_IDEMPOTENCY_KEY, type HistoriaAnteriorResponse, type MiHistoriaAnteriorResponse } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { errores } from '../http/errores';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { HistoriaAnteriorService } from './historia-anterior.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/** Los parámetros de query de API-HIA-04: el tramo, y nada más (09 §3.1). */
const DEL_TRAMO = new Set(['periodStart', 'periodEnd']);

/**
 * Familia HIA (WP-HISTORIA-ANTERIOR; DL-175): la historia anterior de un área, para el profesional nuevo, con el permiso de
 * la persona. Familia propia de BE: el 09 no tiene estas operaciones (lo nuevo va en operaciones nuevas, DL-137 D-7).
 *
 * Como en RES, ningún handler autoriza: el servicio decide con lo de la persona (lo suyo) y con el PDP (el profesional,
 * API-HIA-04). Las lecturas consumen el límite de consultas protegidas del actor.
 */
@Controller()
@UseGuards(SesionGuard)
// DL-178: el tipo de cada serie sale explícito solo para el cliente que declara `training-set-kinds-1`.
@UseInterceptors(SinTipoDeSerieInterceptor, SinBloquesDeLaSesionInterceptor)
export class HistoriaAnteriorController {
  constructor(
    private readonly historia: HistoriaAnteriorService,
    private readonly limitador: LimitadorService,
  ) {}

  /** API-HIA-01. Por cada profesional de hoy en un área: si hubo otro antes, lo que decidí y cuándo la miró. */
  @Get('me/previous-history')
  mia(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<MiHistoriaAnteriorResponse> {
    sinParametrosDeQuery(query);
    this.limitar(req);
    return this.historia.mia(actorDe(req), contextoDe(req));
  }

  /** API-HIA-02. Autorizar al profesional de ese componente a ver mi historia anterior de esa área. */
  @Put('me/previous-history/:relationshipId')
  async autorizar(
    @Param('relationshipId') relationshipId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.historia.autorizar(actorDe(req), relationshipId, cuerpo, clave, contextoDe(req)));
  }

  /** API-HIA-03. Dejar de compartirla, desde ahora. */
  @Post('me/previous-history/:relationshipId/withdrawal')
  async retirar(
    @Param('relationshipId') relationshipId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.historia.retirar(actorDe(req), relationshipId, cuerpo, clave, contextoDe(req)));
  }

  /** API-HIA-04. La historia anterior de un área de la persona, por tramos de fechas. */
  @Get('advisees/:adviseeId/previous-history/:area')
  leer(@Param('adviseeId') adviseeId: string, @Param('area') area: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<HistoriaAnteriorResponse> {
    const desconocidos = Object.keys(query ?? {}).filter((k) => !DEL_TRAMO.has(k));
    if (desconocidos.length > 0) throw errores.solicitudInvalida(desconocidos.map((c) => ({ code: 'UNKNOWN_QUERY_PARAMETER', path: c })));
    this.limitar(req);
    return this.historia.leer(actorDe(req), adviseeId, area, query ?? {}, contextoDe(req));
  }

  /** Límite de consultas protegidas por actor, desde cualquier red (como RES). */
  private limitar(req: Solicitud): void {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
