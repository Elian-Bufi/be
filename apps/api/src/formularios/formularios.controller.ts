import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { PlantillasService } from './plantillas.service';
import { RespuestasService } from './respuestas.service';
import { SolicitudesService } from './solicitudes.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * Familia FRM (09v16.1 §22; RF-071; WP-07). AuthN SESSION en la demo sintética — el 09 declara `SESSION_MFA` para
 * FRM-03 (09:1466), mismo tratamiento que WP-06 (DL-088 #17).
 *
 * Ningún handler decide autorización ni pertinencia: cada servicio invoca al PDP con el Alcance de la fila, nunca
 * uno fijo (FRM es transversal a los tres — WP-07.md §5). Las lecturas person-scoped consumen el límite de consultas
 * protegidas del actor, como el resto de los dominios de salud.
 */
@Controller()
@UseGuards(SesionGuard)
export class FormulariosController {
  constructor(
    private readonly plantillas: PlantillasService,
    private readonly solicitudes: SolicitudesService,
    private readonly respuestas: RespuestasService,
    private readonly limitador: LimitadorService,
  ) {}

  // ─── Catálogo (UC-P32; 09v16.1 §22.1-§22.2) ────────────────────────────────────────────────
  /** API-FRM-01. Metadatos: una plantilla listada no prueba que sus campos puedan pedirse a un asesorado concreto. */
  @Get('form-templates')
  listarPlantillas(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    return this.plantillas.listar(actorDe(req), query, contextoDe(req));
  }

  /** API-FRM-02. La versión exacta, seleccionable o histórica. No devuelve datos personales. */
  @Get('form-templates/:templateId/versions/:versionId')
  consultarPlantilla(@Param('templateId') templateId: string, @Param('versionId') versionId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    sinParametrosDeQuery(query);
    return this.plantillas.consultar(actorDe(req), templateId, versionId, contextoDe(req));
  }

  // ─── Solicitud (UC-P32; 09v16.1 §22.3-§22.6) ───────────────────────────────────────────────
  /** API-FRM-03. Crear la Solicitud. Una plantilla con campos más amplios no amplía B2 (09:1528). */
  @Post('advisees/:adviseeId/form-requests')
  async crearSolicitud(
    @Param('adviseeId') adviseeId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.solicitudes.crear(actorDe(req), adviseeId, cuerpo, clave, contextoDe(req)));
  }

  /** API-FRM-04. Las Solicitudes del profesional sobre este asesorado; solo las actualmente revelables. */
  @Get('advisees/:adviseeId/form-requests')
  listarSolicitudes(@Param('adviseeId') adviseeId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.solicitudes.listar(actorDe(req), adviseeId, query, contextoDe(req));
  }

  /** API-FRM-05. Proyección actor-scoped: el profesional solo si el PDP lo sigue permitiendo, el asesorado siempre. */
  @Get('form-requests/:formRequestId')
  consultarSolicitud(@Param('formRequestId') formRequestId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    sinParametrosDeQuery(query);
    return this.solicitudes.consultarDetalle(actorDe(req), formRequestId, contextoDe(req));
  }

  /** API-FRM-06. Las Solicitudes propias, con `respondable` proyectado por el PDP en esta misma lectura. */
  @Get('me/form-requests')
  misSolicitudes(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.solicitudes.listarPropias(actorDe(req), query, contextoDe(req));
  }

  // ─── Respuesta (UC-P33; 09v16.1 §22.7-§22.8) ───────────────────────────────────────────────
  /** API-FRM-07. Cada respuesta queda SELF_REPORTED; un opcional sin responder se omite, nunca cero/default. */
  @Post('me/form-requests/:formRequestId/responses')
  async responderSolicitud(
    @Param('formRequestId') formRequestId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.respuestas.responder(actorDe(req), formRequestId, cuerpo, clave, contextoDe(req)));
  }

  /** API-FRM-08. Crea una sucesora; nunca sobrescribe la original (09:1618). */
  @Post('me/form-responses/:formResponseId/rectifications')
  async rectificarRespuesta(
    @Param('formResponseId') formResponseId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.respuestas.rectificar(actorDe(req), formResponseId, cuerpo, clave, contextoDe(req)));
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
