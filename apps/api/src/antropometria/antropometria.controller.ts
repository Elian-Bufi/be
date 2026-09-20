import { Body, Controller, Get, Headers, Param, Patch, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { CalculosService } from './calculos.service';
import { EspecificacionesService } from './especificaciones.service';
import { EvaluacionesAntropometricasService } from './evaluaciones.service';
import { EvolucionService } from './evolucion.service';
import { MedicionesService } from './mediciones.service';
import { MetodosService } from './metodos.service';

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
    private readonly metodos: MetodosService,
    private readonly calculos: CalculosService,
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

  // ─── Métodos profesionales (UC-I09; 09v16 §21.1 y §21.2) ───────────────────────────────────
  /**
   * API-MTH-01. Metadatos de la capacidad: no acepta `adviseeId` y no usa datos personales para decidir qué listar
   * (09 §21.1). Por eso no consume el límite de consultas protegidas: no hay titular que proteger.
   */
  @Get('professional-methods')
  listarMetodos(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    return this.metodos.listar(actorDe(req), query, contextoDe(req));
  }

  /** API-MTH-02. La versión exacta, seleccionable o histórica: una corrida que la cita tiene que poder explicarse. */
  @Get('professional-methods/:methodId/versions/:versionId')
  consultarMetodo(@Param('methodId') methodId: string, @Param('versionId') versionId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    sinParametrosDeQuery(query);
    return this.metodos.consultar(actorDe(req), methodId, versionId, contextoDe(req));
  }

  // ─── Cálculos (UC-I09; 09v16 §21.3 a §21.6) ────────────────────────────────────────────────
  /** API-CAL-01. */
  @Post('advisees/:adviseeId/calculations')
  ejecutarCalculo(
    @Param('adviseeId') adviseeId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return this.calculos
      .ejecutarCalculo(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req))
      .then((r) => responder(res, r));
  }

  /** API-CAL-02. Las corridas se listan como están: sin promedio y sin ganadora (REG-06-205). */
  @Get('advisees/:adviseeId/calculations')
  listarCalculos(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.calculos.listar(actorDe(req), adviseeId, query, contextoDe(req));
  }

  /** API-CAL-03. */
  @Get('calculations/:runId')
  consultarCalculo(@Param('runId') runId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    sinParametrosDeQuery(query);
    return this.calculos.consultar(actorDe(req), runId, contextoDe(req));
  }

  /** API-CAL-04. Adoptar es una relación con historia, no una mutación de la corrida (REG-06-207). */
  @Put('advisees/:adviseeId/calculation-references/:purpose')
  adoptarReferencia(
    @Param('adviseeId') adviseeId: string,
    @Param('purpose') purpose: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return this.calculos.adoptar(actorDe(req), adviseeId, purpose, cuerpo, clave, contextoDe(req)).then((r) => responder(res, r));
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
