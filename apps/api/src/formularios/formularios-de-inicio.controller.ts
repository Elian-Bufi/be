import { Body, Controller, Get, Headers, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { HEADER_IDEMPOTENCY_KEY } from '@be/domain';
import type { Response } from 'express';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { PropuestasService } from './propuestas.service';
import { RespuestasV2Service } from './respuestas-v2.service';
import { VistasV2Service } from './vistas-v2.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * Familia FRI (WP-FORMULARIOS-DE-INICIO; DEUDA_LEGAJO DL-164 D-5): los formularios V2 y la propuesta del profesional
 * que la persona confirma. Lo nuevo va en operaciones nuevas (DL-137 D-7): las ocho de FRM no cambian de forma y siguen
 * sirviendo a las APK instaladas (DL-152); estas sirven para cualquier Solicitud, de P0 o con tipos nuevos.
 *
 * Como en FRM, ningún handler autoriza: cada servicio decide con el PDP y el Alcance de la fila. Las lecturas
 * person-scoped consumen el límite de consultas protegidas del actor.
 */
@Controller()
@UseGuards(SesionGuard)
export class FormulariosDeInicioController {
  constructor(
    private readonly vistas: VistasV2Service,
    private readonly respuestas: RespuestasV2Service,
    private readonly propuestas: PropuestasService,
    private readonly limitador: LimitadorService,
  ) {}

  /** API-FRI-01. La definición de cualquier versión, en V2. Metadatos: no devuelve datos personales. */
  @Get('form-templates/:templateId/versions/:versionId/definition')
  definicion(@Param('templateId') templateId: string, @Param('versionId') versionId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    sinParametrosDeQuery(query);
    return this.vistas.definicion(actorDe(req), templateId, versionId, contextoDe(req));
  }

  /** API-FRI-02. La bandeja de la persona: todas sus Solicitudes, con la propuesta que espera su confirmación. */
  @Get('me/form-inbox')
  bandeja(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    return this.vistas.bandeja(actorDe(req), query, contextoDe(req));
  }

  /** API-FRI-03. El detalle V2, actor-scoped como FRM-05: con la propuesta y la transcripción. */
  @Get('form-requests/:formRequestId/view')
  vista(@Param('formRequestId') formRequestId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    this.limitar(req);
    sinParametrosDeQuery(query);
    return this.vistas.vista(actorDe(req), formRequestId, contextoDe(req));
  }

  /** API-FRI-04. Responder (la persona), sola o confirmando la propuesta: confirmar es responder (D-4). */
  @Post('me/form-requests/:formRequestId/answers')
  async responder(
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

  /** API-FRI-05. Rectificar una respuesta propia con respuestas V2; la original no se toca. */
  @Post('me/form-responses/:formResponseId/corrections')
  async corregir(
    @Param('formResponseId') formResponseId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.respuestas.corregir(actorDe(req), formResponseId, cuerpo, clave, contextoDe(req)));
  }

  /** API-FRI-06. El profesional carga (201) o reemplaza (200) lo que la persona le contó, para que ella lo confirme. */
  @Put('form-requests/:formRequestId/proposal')
  async cargar(
    @Param('formRequestId') formRequestId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.propuestas.cargar(actorDe(req), formRequestId, cuerpo, clave, contextoDe(req)));
  }

  /** API-FRI-07. El profesional retira lo cargado: se borra (D-6). */
  @Post('form-requests/:formRequestId/proposal/withdrawal')
  async retirar(
    @Param('formRequestId') formRequestId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.propuestas.retirar(actorDe(req), formRequestId, cuerpo, clave, contextoDe(req)));
  }

  /** API-FRI-08. La persona dice «No es correcto»: lo cargado se borra y la Solicitud sigue pendiente (D-6). */
  @Post('me/form-requests/:formRequestId/proposal/rejection')
  async rechazar(
    @Param('formRequestId') formRequestId: string,
    @Body() cuerpo: unknown,
    @Headers(HEADER_IDEMPOTENCY_KEY) clave: string | undefined,
    @Query() query: Record<string, unknown>,
    @Req() req: Solicitud,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    sinParametrosDeQuery(query);
    return responder(res, await this.propuestas.rechazar(actorDe(req), formRequestId, cuerpo, clave, contextoDe(req)));
  }

  /** Límite de consultas protegidas por actor, desde cualquier red (como FRM-05 y FRM-06). */
  private limitar(req: Solicitud): void {
    this.limitador.consumir('consultaProtegida', null, actorDe(req).identidadId);
  }
}

function responder(res: Response, resultado: ResultadoIdempotente): unknown {
  res.status(resultado.estadoHttp);
  return resultado.cuerpo;
}
