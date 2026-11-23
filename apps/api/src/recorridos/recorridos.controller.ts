import { Body, Controller, Get, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { RecorridosVistosResponse, RecorridoVistoResponse } from '@be/domain';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { RecorridosService } from './recorridos.service';

type Solicitud = SolicitudAutenticada & SolicitudConContexto;

/**
 * API-RGU-01 y 02 (WP-RECORRIDOS-GUIADOS, DL-195): los recorridos guiados del usuario de la sesión. Con sesión y sin
 * titular en la ruta: cada uno lee y marca solo lo suyo. Son preferencias de la pantalla, sin datos de salud: no consumen
 * el límite de lecturas protegidas (como API-NOV-05 y 06).
 */
@Controller()
@UseGuards(SesionGuard)
export class RecorridosController {
  constructor(private readonly recorridos: RecorridosService) {}

  /** API-RGU-01. */
  @Get('me/guided-tours')
  listar(@Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<RecorridosVistosResponse> {
    sinParametrosDeQuery(query);
    return this.recorridos.listar(actorDe(req));
  }

  /** API-RGU-02. Idempotente por semántica: sin Idempotency-Key. */
  @Put('me/guided-tours/:tourId')
  marcar(@Param('tourId') tourId: string, @Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: Solicitud): Promise<RecorridoVistoResponse> {
    sinParametrosDeQuery(query);
    return this.recorridos.marcar(actorDe(req), tourId, cuerpo, contextoDe(req));
  }
}
