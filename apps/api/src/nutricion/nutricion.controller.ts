import { Body, Controller, Get, Headers, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { CatalogoService } from './catalogo.service';
import { EvaluacionesService } from './evaluaciones.service';
import { IngestasService } from './ingestas.service';
import { PlanesService } from './planes.service';
import { RevisionesService } from './revisiones.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * Familia NUT (09v9; CONS §11.2) y API-INT-NUT-01 (09v12). AuthN SESSION en la demo sintética (08 §25; WP-04 §4).
 * Ningún handler decide autorización: cada servicio invoca al PDP dentro de su transacción (EjecutorNutricional).
 * Las lecturas de datos de salud consumen el límite de consultas protegidas del actor, como API-DSH-03.
 */
@Controller()
@UseGuards(SesionGuard)
export class NutricionController {
  constructor(
    private readonly evaluaciones: EvaluacionesService,
    private readonly planes: PlanesService,
    private readonly catalogo: CatalogoService,
    private readonly ingestas: IngestasService,
    private readonly revisiones: RevisionesService,
    private readonly limitador: LimitadorService,
  ) {}

  // ─── Evaluación y objetivo (UC-P09) ─────────────────────────────────────────────────────────
  /** API-NUT-01. */
  @Post('advisees/:adviseeId/nutrition/evaluations')
  async crearEvaluacion(@Param('adviseeId') adviseeId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.evaluaciones.crearEvaluacion(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req)));
  }

  /** API-NUT-02. */
  @Get('advisees/:adviseeId/nutrition/evaluations')
  listarEvaluaciones(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.evaluaciones.listarEvaluaciones(actorDe(req), adviseeId, query, contextoDe(req));
  }

  /** API-NUT-03. */
  @Get('nutrition/evaluations/:evaluationId')
  consultarEvaluacion(@Param('evaluationId') evaluationId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.evaluaciones.consultarEvaluacion(actorDe(req), evaluationId, query, contextoDe(req));
  }

  /** API-NUT-04. */
  @Post('advisees/:adviseeId/nutrition/objectives')
  async crearObjetivo(@Param('adviseeId') adviseeId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.evaluaciones.crearObjetivo(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req)));
  }

  /** API-NUT-06. Declarada antes que NUT-05 no hace falta: son rutas distintas. */
  @Get('advisees/:adviseeId/nutrition/objectives/effective')
  objetivoEfectivo(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.evaluaciones.objetivoEfectivo(actorDe(req), adviseeId, query, contextoDe(req));
  }

  /** API-NUT-05. */
  @Get('advisees/:adviseeId/nutrition/objectives')
  listarObjetivos(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.evaluaciones.listarObjetivos(actorDe(req), adviseeId, query, contextoDe(req));
  }

  // ─── Plan (UC-P10, UC-P11) ──────────────────────────────────────────────────────────────────
  /** API-NUT-07. */
  @Post('advisees/:adviseeId/nutrition/plans')
  async crearBorrador(@Param('adviseeId') adviseeId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.planes.crearBorrador(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req)));
  }

  /** API-NUT-08. */
  @Get('advisees/:adviseeId/nutrition/plans')
  listarPlanes(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.planes.listar(actorDe(req), adviseeId, query, contextoDe(req));
  }

  /** API-NUT-09. */
  @Get('nutrition/plans/:planId')
  consultarPlan(@Param('planId') planId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.planes.consultar(actorDe(req), planId, query, contextoDe(req));
  }

  /** API-NUT-10. Sin Idempotency-Key: concurrencia por `expectedVersion` (09v9:523-562). */
  @Patch('nutrition/plans/:planId')
  async editarBorrador(@Param('planId') planId: string, @Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.planes.editarBorrador(actorDe(req), planId, cuerpo, contextoDe(req)));
  }

  /** API-NUT-11. */
  @Post('nutrition/plans/:planId/validate')
  async validarPlan(@Param('planId') planId: string, @Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.planes.validar(actorDe(req), planId, cuerpo, contextoDe(req)));
  }

  /** API-NUT-12. */
  @Post('nutrition/plans/:planId/activate')
  async activarPlan(@Param('planId') planId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.planes.activar(actorDe(req), planId, cuerpo, clave, contextoDe(req)));
  }

  // ─── Catálogo ───────────────────────────────────────────────────────────────────────────────
  /** API-NUT-13. */
  @Get('nutrition/catalog-items')
  listarCatalogo(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    return this.catalogo.listar(actorDe(req), query);
  }

  /** API-INT-NUT-01. */
  @Post('nutrition/catalog-items')
  async crearElemento(@Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.catalogo.crear(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  // ─── Ingesta (UC-P12) ───────────────────────────────────────────────────────────────────────
  /** API-NUT-14. */
  @Get('me/nutrition/today')
  hoy(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    return this.ingestas.hoy(actorDe(req), query, contextoDe(req));
  }

  /** API-NUT-15. */
  @Post('me/nutrition/executions')
  async registrarIngesta(@Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.ingestas.registrar(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** Registros propios del asesorado (B10-05 NUT-11; DL-055). */
  @Get('me/nutrition/executions')
  listarIngestasPropias(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    return this.ingestas.listarPropias(actorDe(req), query, contextoDe(req));
  }

  /** API-NUT-16. */
  @Get('nutrition/executions/:executionId')
  consultarIngesta(@Param('executionId') executionId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.ingestas.consultar(actorDe(req), executionId, query, contextoDe(req));
  }

  /** API-NUT-21. */
  @Post('nutrition/executions/:executionId/corrections')
  async corregirIngesta(@Param('executionId') executionId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.ingestas.corregir(actorDe(req), executionId, cuerpo, clave, contextoDe(req)));
  }

  // ─── Revisión (UC-P13, UC-I05, UC-I06) ──────────────────────────────────────────────────────
  /** API-NUT-17. */
  @Get('advisees/:adviseeId/nutrition/review-context')
  contextoDeRevision(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.revisiones.contexto(actorDe(req), adviseeId, query, contextoDe(req));
  }

  /** API-NUT-18. */
  @Post('advisees/:adviseeId/nutrition/reviews')
  async registrarRevision(@Param('adviseeId') adviseeId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.revisiones.registrar(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req)));
  }

  /** API-NUT-19. */
  @Get('nutrition/reviews/:reviewId')
  consultarRevision(@Param('reviewId') reviewId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.revisiones.consultar(actorDe(req), reviewId, query, contextoDe(req));
  }

  /** API-NUT-20. */
  @Post('nutrition/reviews/:reviewId/apply')
  async aplicarRevision(@Param('reviewId') reviewId: string, @Body() cuerpo: unknown, @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined, @Query() query: Record<string, unknown>, @Req() req: Solicitud, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.revisiones.aplicar(actorDe(req), reviewId, cuerpo, clave, contextoDe(req)));
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
