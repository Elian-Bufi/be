import { Body, Controller, Delete, Get, HttpCode, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { NovedadesService } from './novedades.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * API-NOV-01 a 06 (WP-NOVEDADES-Y-AVISOS, DL-133): el centro de novedades y los avisos push del propio actor. Todas con
 * sesión; las dos lecturas comparten el límite por actor de las lecturas protegidas (429 RATE_LIMITED), porque la APK
 * las pide al abrir y al recibir un aviso.
 */
@Controller()
@UseGuards(SesionGuard)
export class NovedadesController {
  constructor(
    private readonly novedades: NovedadesService,
    private readonly limitador: LimitadorService,
  ) {}

  /** API-NOV-01. */
  @Get('me/news')
  listar(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    const actor = actorDe(req);
    this.limitador.consumir('consultaProtegida', null, actor.identidadId);
    return this.novedades.listar(actor, query);
  }

  /** API-NOV-02. Abrirla registra la primera lectura. */
  @Get('me/news/:newsId')
  abrir(@Param('newsId') newsId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    sinParametrosDeQuery(query);
    const actor = actorDe(req);
    this.limitador.consumir('consultaProtegida', null, actor.identidadId);
    return this.novedades.abrir(actor, newsId, contextoDe(req));
  }

  /** API-NOV-03. Idempotente por semántica: sin Idempotency-Key. */
  @Put('me/push-subscriptions/:deviceId')
  registrarSuscripcion(@Param('deviceId') deviceId: string, @Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    sinParametrosDeQuery(query);
    return this.novedades.registrarSuscripcion(actorDe(req), deviceId, cuerpo, contextoDe(req));
  }

  /** API-NOV-04. Idempotente por semántica: repetirlo responde 204 igual. */
  @Delete('me/push-subscriptions/:deviceId')
  @HttpCode(204)
  async retirarSuscripcion(@Param('deviceId') deviceId: string, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<void> {
    sinParametrosDeQuery(query);
    await this.novedades.retirarSuscripcion(actorDe(req), deviceId, contextoDe(req));
  }

  /** API-NOV-05. */
  @Get('me/notification-preferences')
  preferencias(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    sinParametrosDeQuery(query);
    return this.novedades.preferencias(actorDe(req));
  }

  /** API-NOV-06. Idempotente por semántica: sin Idempotency-Key. */
  @Put('me/notification-preferences')
  reemplazarPreferencias(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<unknown> {
    sinParametrosDeQuery(query);
    return this.novedades.reemplazarPreferencias(actorDe(req), cuerpo, contextoDe(req));
  }
}
