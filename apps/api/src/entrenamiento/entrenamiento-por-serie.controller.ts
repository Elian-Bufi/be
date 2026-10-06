import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { ImagenesDeEjercicioService } from './imagenes.service';
import { ObjetivosPorSerieService } from './series.service';
import { TiemposDeSesionService } from './tiempos.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * WP-ENTRENAMIENTO-SERIES (encargo de Dirección del 2026-10-06): las familias SER (DL-122, objetivos por serie), TIE
 * (DL-124, tiempos de la sesión) y EJE (DL-123, imagen del ejercicio). Son operaciones nuevas: ninguna respuesta que lee la
 * APK 0.13.2 cambia. Ningún handler decide autorización: cada servicio invoca al PDP dentro de su transacción. Las
 * lecturas de datos de salud (SER-01 y 02, TIE-02 y 03) consumen el límite de consultas protegidas del actor.
 */
@Controller()
@UseGuards(SesionGuard)
export class EntrenamientoPorSerieController {
  constructor(
    private readonly objetivos: ObjetivosPorSerieService,
    private readonly tiempos: TiemposDeSesionService,
    private readonly imagenes: ImagenesDeEjercicioService,
    private readonly limitador: LimitadorService,
  ) {}

  // ─── SER · objetivos por serie (DL-122) ───────────────────────────────────────────────────────
  /** API-SER-01: la versión de plan con los objetivos por serie y las imágenes. Solo el profesional del plan. */
  @Get('training/plans/:planId/detail')
  planConObjetivos(@Param('planId') planId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.objetivos.consultarPlan(actorDe(req), planId, query, contextoDe(req));
  }

  /** API-SER-02: la sesión de una ocurrencia, lista para registrar. Solo el titular. */
  @Get('training/occurrences/:occurrenceId/session')
  sesionParaRegistrar(@Param('occurrenceId') occurrenceId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.objetivos.consultarSesion(actorDe(req), occurrenceId, query, contextoDe(req));
  }

  // ─── TIE · tiempos de la sesión (DL-124) ──────────────────────────────────────────────────────
  /** API-TIE-01. Sin Idempotency-Key: la identidad es la de cada evento, y repetirlo no suma. */
  @Post('training/execution-drafts/:draftId/timing-events')
  async registrarEventos(@Param('draftId') draftId: string, @Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.tiempos.registrar(actorDe(req), draftId, cuerpo, contextoDe(req)));
  }

  /** API-TIE-02. */
  @Get('training/execution-drafts/:draftId/timing')
  tiemposDelBorrador(@Param('draftId') draftId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.tiempos.consultarDelBorrador(actorDe(req), draftId, query, contextoDe(req));
  }

  /** API-TIE-03. */
  @Get('training/executions/:executionId/timing')
  tiemposDeLaEjecucion(@Param('executionId') executionId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.tiempos.consultarDeLaEjecucion(actorDe(req), executionId, query, contextoDe(req));
  }

  /** API-TIE-04. */
  @Get('me/training/session-in-progress')
  sesionEnCurso(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    return this.tiempos.sesionEnCurso(actorDe(req), query, contextoDe(req));
  }

  // ─── EJE · imagen del ejercicio (DL-123) ──────────────────────────────────────────────────────
  /** API-EJE-01. */
  @Get('training/own-exercises')
  ejerciciosPropios(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    return this.imagenes.listar(actorDe(req), query, contextoDe(req));
  }

  /** API-EJE-02. */
  @Put('training/exercises/:exerciseId/image')
  async asociarImagen(@Param('exerciseId') exerciseId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.imagenes.asociar(actorDe(req), exerciseId, cuerpo, clave, contextoDe(req)));
  }

  /** API-EJE-03: `expectedImageVersion` va por query; el servicio rechaza cualquier otro parámetro. */
  @Delete('training/exercises/:exerciseId/image')
  async retirarImagen(@Param('exerciseId') exerciseId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    return responder(res, await this.imagenes.retirar(actorDe(req), exerciseId, query, cuerpo, clave, contextoDe(req)));
  }

  /** Límite de consultas protegidas por actor, desde cualquier red (como API-DSH-03). */
  private limitar(req: Solicitud): void {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
