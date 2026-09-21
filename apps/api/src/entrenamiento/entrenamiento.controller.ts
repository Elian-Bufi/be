import { Body, Controller, Get, Headers, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { CatalogoDeEjerciciosService } from './catalogo.service';
import { EvaluacionesDeEntrenamientoService } from './evaluaciones.service';
import { PlanesDeEntrenamientoService } from './planes.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * Familia TRN (09v10), API-INT-TRN-01 (09v12) y la lectura por período (DL-078). AuthN SESSION en la demo sintética,
 * como NUT y ANT (08 §25). Ningún handler decide autorización: cada servicio invoca al PDP dentro de su transacción.
 * Las lecturas de datos de salud consumen el límite de consultas protegidas del actor.
 */
@Controller()
@UseGuards(SesionGuard)
export class EntrenamientoController {
  constructor(
    private readonly evaluaciones: EvaluacionesDeEntrenamientoService,
    private readonly catalogo: CatalogoDeEjerciciosService,
    private readonly planes: PlanesDeEntrenamientoService,
    private readonly limitador: LimitadorService,
  ) {}

  // ─── Evaluación y objetivo (UC-P14) ─────────────────────────────────────────────────────────
  /** API-TRN-01. */
  @Post('advisees/:adviseeId/training/evaluations')
  async crearEvaluacion(@Param('adviseeId') adviseeId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.evaluaciones.crearEvaluacion(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req)));
  }

  /** API-TRN-02. */
  @Get('advisees/:adviseeId/training/evaluations')
  listarEvaluaciones(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.evaluaciones.listarEvaluaciones(actorDe(req), adviseeId, query, contextoDe(req));
  }

  /** API-TRN-03. */
  @Get('training/evaluations/:evaluationId')
  consultarEvaluacion(@Param('evaluationId') evaluationId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.evaluaciones.consultarEvaluacion(actorDe(req), evaluationId, query, contextoDe(req));
  }

  /** API-TRN-04. */
  @Post('advisees/:adviseeId/training/objectives')
  async crearObjetivo(@Param('adviseeId') adviseeId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.evaluaciones.crearObjetivo(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req)));
  }

  /** API-TRN-06. Subrecurso con nombre propio: el efectivo no se resuelve con un filtro (09v10:645). */
  @Get('advisees/:adviseeId/training/objectives/effective')
  objetivoEfectivo(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.evaluaciones.objetivoEfectivo(actorDe(req), adviseeId, query, contextoDe(req));
  }

  /** API-TRN-05. */
  @Get('advisees/:adviseeId/training/objectives')
  listarObjetivos(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.evaluaciones.listarObjetivos(actorDe(req), adviseeId, query, contextoDe(req));
  }

  // ─── Plan (UC-P15, UC-P16) ──────────────────────────────────────────────────────────────────
  /** API-TRN-07. El borrador es el mismo recurso del plan: no existe /training/plan-drafts (09v10:238-245). */
  @Post('advisees/:adviseeId/training/plans')
  async crearPlan(@Param('adviseeId') adviseeId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.planes.crearBorrador(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req)));
  }

  /** API-TRN-08. */
  @Get('advisees/:adviseeId/training/plans')
  listarPlanes(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.planes.listar(actorDe(req), adviseeId, query, contextoDe(req));
  }

  /** API-TRN-09. */
  @Get('training/plans/:planId')
  consultarPlan(@Param('planId') planId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.planes.consultar(actorDe(req), planId, query, contextoDe(req));
  }

  /** API-TRN-10. Sin Idempotency-Key: concurrencia por expectedVersion (09v10 §42). */
  @Patch('training/plans/:planId')
  async editarPlan(@Param('planId') planId: string, @Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.planes.editarBorrador(actorDe(req), planId, cuerpo, contextoDe(req)));
  }

  /** API-TRN-11. */
  @Post('training/plans/:planId/validate')
  async validarPlan(@Param('planId') planId: string, @Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.planes.validar(actorDe(req), planId, cuerpo, contextoDe(req)));
  }

  /** API-TRN-12. */
  @Post('training/plans/:planId/activate')
  async activarPlan(@Param('planId') planId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.planes.activar(actorDe(req), planId, cuerpo, clave, contextoDe(req)));
  }

  // ─── Catálogo (RF-037) ──────────────────────────────────────────────────────────────────────
  /** API-TRN-13. */
  @Get('training/exercises')
  listarEjercicios(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    return this.catalogo.listar(actorDe(req), query);
  }

  /** API-INT-TRN-01. */
  @Post('training/exercises')
  async crearEjercicio(@Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.catalogo.crear(actorDe(req), cuerpo, clave, contextoDe(req)));
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
