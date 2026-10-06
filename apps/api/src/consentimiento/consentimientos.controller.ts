import { Body, Controller, Get, Headers, HttpCode, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import {
  HEADER_IDEMPOTENCY_KEY,
  type ConsentimientoRevocadoResponse,
  type HistorialDeConsentimientoDeSaludResponse,
  type ListaDeConsentimientosResponse,
  type ListaDeEvidenciaVisualResponse,
  type RequisitoDeEvidenciaVisualResponse,
  type RequisitosDeConsentimientoResponse,
} from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { ConsentimientoDeSaludService } from './consentimiento-de-salud.service';
import { ConsentimientoProfesionalService } from './consentimiento-profesional.service';
import { EvidenciaVisualService } from './evidencia-visual.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * Familia CON (09v8 §7; 09 §31-§37): B2 (CON-01 a 04) y A3 (CON-06 a 08). CON-05 sigue en ConsentimientoController.
 * EVIDENCIA_VISUAL (EVI-01 a 04; 08 §12.4; DL-125) es una propuesta: el 09 no define esas operaciones.
 */
@Controller()
@UseGuards(SesionGuard)
export class ConsentimientosController {
  constructor(
    private readonly b2: ConsentimientoProfesionalService,
    private readonly a3: ConsentimientoDeSaludService,
    private readonly evidenciaVisual: EvidenciaVisualService,
  ) {}

  /** API-CON-01 — solo el asesorado titular. */
  @Get('relationships/:relationshipId/consent-requirements')
  requisitos(
    @Param('relationshipId') relationshipId: string,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
  ): Promise<RequisitosDeConsentimientoResponse> {
    sinParametrosDeQuery(query);
    return this.b2.requisitos(actorDe(req), relationshipId, contextoDe(req));
  }

  /** API-CON-02 — Idempotency-Key requerida. */
  @Post('relationships/:relationshipId/consents')
  async otorgar(
    @Param('relationshipId') relationshipId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.b2.otorgar(actorDe(req), relationshipId, cuerpo, clave, contextoDe(req)));
  }

  /** API-CON-03. */
  @Get('me/consents')
  listar(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ListaDeConsentimientosResponse> {
    return this.b2.listar(actorDe(req), query);
  }

  /** API-CON-04 — idempotente por semántica, sin Idempotency-Key. */
  @Post('me/consents/:consentId/revoke')
  @HttpCode(200)
  revocar(
    @Param('consentId') consentId: string,
    @Body() cuerpo: unknown,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
  ): Promise<ConsentimientoRevocadoResponse> {
    sinParametrosDeQuery(query);
    return this.b2.revocar(actorDe(req), consentId, cuerpo, contextoDe(req));
  }

  /** API-CON-06 — Idempotency-Key requerida. */
  @Post('me/health-data-consents')
  async otorgarA3(
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.a3.otorgar(actorDe(req), cuerpo, clave, contextoDe(req)));
  }

  /** API-CON-07. */
  @Get('me/health-data-consents')
  historialA3(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<HistorialDeConsentimientoDeSaludResponse> {
    return this.a3.historial(actorDe(req), query);
  }

  /** API-CON-08 — idempotente por semántica, sin Idempotency-Key. */
  @Post('me/health-data-consents/:consentId/revoke')
  @HttpCode(200)
  revocarA3(
    @Param('consentId') consentId: string,
    @Body() cuerpo: unknown,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
  ): Promise<ConsentimientoRevocadoResponse> {
    sinParametrosDeQuery(query);
    return this.a3.revocar(actorDe(req), consentId, cuerpo, contextoDe(req));
  }

  /** API-EVI-01 — solo el asesorado titular de un vínculo de Nutrición. */
  @Get('relationships/:relationshipId/visual-evidence-requirement')
  requisitoDeEvidenciaVisual(
    @Param('relationshipId') relationshipId: string,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
  ): Promise<RequisitoDeEvidenciaVisualResponse> {
    sinParametrosDeQuery(query);
    return this.evidenciaVisual.requisito(actorDe(req), relationshipId, contextoDe(req));
  }

  /** API-EVI-02 — Idempotency-Key requerida. */
  @Post('relationships/:relationshipId/visual-evidence-consents')
  async otorgarEvidenciaVisual(
    @Param('relationshipId') relationshipId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.evidenciaVisual.otorgar(actorDe(req), relationshipId, cuerpo, clave, contextoDe(req)));
  }

  /** API-EVI-03. */
  @Get('me/visual-evidence-consents')
  listarEvidenciasVisuales(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<ListaDeEvidenciaVisualResponse> {
    return this.evidenciaVisual.listar(actorDe(req), query);
  }

  /** API-EVI-04 — idempotente por semántica, sin Idempotency-Key. */
  @Post('me/visual-evidence-consents/:consentId/revoke')
  @HttpCode(200)
  revocarEvidenciaVisual(
    @Param('consentId') consentId: string,
    @Body() cuerpo: unknown,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
  ): Promise<ConsentimientoRevocadoResponse> {
    sinParametrosDeQuery(query);
    return this.evidenciaVisual.revocar(actorDe(req), consentId, cuerpo, contextoDe(req));
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
