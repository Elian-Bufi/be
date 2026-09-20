import { Body, Controller, Get, Headers, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { EspecificacionesService } from './especificaciones.service';
import { EvaluacionesAntropometricasService } from './evaluaciones.service';
import { EvolucionService } from './evolucion.service';
import { MedicionesService } from './mediciones.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * Familia ANT (09v11; consolidado v0.16 §23 y §24). AuthN SESSION en la demo sintética (08 §25; WP-05 §4), con el
 * mismo criterio que WP-03 y WP-04.
 *
 * Ningún handler decide autorización: cada servicio invoca al PDP dentro de su transacción, con el Alcance
 * ANTROPOMETRIA (EjecutorAntropometrico). Las lecturas de datos de salud consumen el límite de consultas
 * protegidas del actor, como API-DSH-03.
 */
@Controller()
@UseGuards(SesionGuard)
export class AntropometriaController {
  constructor(
    private readonly especificaciones: EspecificacionesService,
    private readonly evaluaciones: EvaluacionesAntropometricasService,
    private readonly mediciones: MedicionesService,
    private readonly evolucion: EvolucionService,
    private readonly limitador: LimitadorService,
  ) {}

  // ─── Catálogo ──────────────────────────────────────────────────────────────────────────────
  /** API-ANT-01. */
  @Get('anthropometry/specifications')
  listarEspecificaciones(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    return this.especificaciones.listar(actorDe(req), query, contextoDe(req));
  }

  // ─── Evaluación en preparación (UC-P19) ────────────────────────────────────────────────────
  /** API-ANT-07. */
  @Post('advisees/:adviseeId/anthropometry/evaluations')
  async crearBorrador(
    @Param('adviseeId') adviseeId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.evaluaciones.crearBorrador(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req)));
  }

  /** API-ANT-08: los borradores retomables del profesional. */
  @Get('advisees/:adviseeId/anthropometry/evaluations/drafts')
  listarBorradores(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.evaluaciones.listarBorradores(actorDe(req), adviseeId, query, contextoDe(req));
  }

  /** API-ANT-03: lista **solo** las registradas (09v16 §23.1). */
  @Get('advisees/:adviseeId/anthropometry/evaluations')
  listarEvaluaciones(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.evaluaciones.listarRegistradas(actorDe(req), adviseeId, query, contextoDe(req));
  }

  /** API-ANT-04 y API-ANT-09: la misma lectura para una registrada y para un borrador propio. */
  @Get('anthropometry/evaluations/:evaluationId')
  consultarEvaluacion(@Param('evaluationId') evaluationId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.evaluaciones.consultar(actorDe(req), evaluationId, query, contextoDe(req));
  }

  /** API-ANT-10. */
  @Patch('anthropometry/evaluations/:evaluationId')
  async guardarBorrador(
    @Param('evaluationId') evaluationId: string,
    @Body() cuerpo: unknown,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.evaluaciones.guardarBorrador(actorDe(req), evaluationId, cuerpo, contextoDe(req)));
  }

  /** API-ANT-11: el acto explícito de registro (REG-06-214 inciso 4). */
  @Post('anthropometry/evaluations/:evaluationId/register')
  async registrar(
    @Param('evaluationId') evaluationId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.evaluaciones.registrar(actorDe(req), evaluationId, cuerpo, clave, contextoDe(req)));
  }

  // ─── Corregir y anular (UC-E03) ────────────────────────────────────────────────────────────
  /** API-ANT-05. */
  @Post('anthropometry/measurements/:measurementId/corrections')
  async corregir(
    @Param('measurementId') measurementId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.mediciones.corregir(actorDe(req), measurementId, cuerpo, clave, contextoDe(req)));
  }

  /** API-ANT-12: anular. La segunda anulación no es un error (adversarial 6; DL-059). */
  @Post('anthropometry/measurements/:measurementId/annulment')
  async anular(
    @Param('measurementId') measurementId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.mediciones.anular(actorDe(req), measurementId, cuerpo, clave, contextoDe(req)));
  }

  // ─── Evolución (UC-P20) ────────────────────────────────────────────────────────────────────
  /** API-ANT-06, del lado del profesional. */
  @Get('advisees/:adviseeId/anthropometry/progress')
  evolucionDelAsesorado(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.evolucion.consultar(actorDe(req), adviseeId, query, contextoDe(req));
  }

  /** API-ANT-06, del lado del asesorado: RF-049 lo nombra como actor, y la APK la consume. */
  @Get('me/anthropometry/progress')
  miEvolucion(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.evolucion.consultar(actorDe(req), 'me', query, contextoDe(req));
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
