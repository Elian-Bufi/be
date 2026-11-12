import { Body, Controller, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import type { RecuperacionPedidaResponse } from '@be/domain';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { RecuperacionService } from './recuperacion.service';

/**
 * UF-03 de WP-USO-FINAL (DL-169; 09 v0.12 §10): recuperar el acceso local, API-ACC-P1-01 y 02. Públicas: no hay sesión
 * que pedir. Prefijo global /api/v1. La recuperación asistida (API-ADM-18) está en el controlador de Administración.
 */
@Controller('auth/recovery-requests')
export class RecuperacionController {
  constructor(private readonly recuperacion: RecuperacionService) {}

  /** API-ACC-P1-01 — PUBLIC. Siempre 202 con la misma forma, exista o no la cuenta. */
  @Post()
  @HttpCode(202)
  pedir(@Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: SolicitudConContexto): Promise<RecuperacionPedidaResponse> {
    sinParametrosDeQuery(query);
    return this.recuperacion.pedir(cuerpo, contextoDe(req));
  }

  /** API-ACC-P1-02 — PUBLIC. 204 con la contraseña cambiada; un código que no vale, siempre el mismo 422. */
  @Post(':recoveryId/complete')
  @HttpCode(204)
  async completar(@Param('recoveryId') recoveryId: string, @Body() cuerpo: unknown, @Query() query: Record<string, unknown>, @Req() req: SolicitudConContexto): Promise<void> {
    sinParametrosDeQuery(query);
    await this.recuperacion.completar(recoveryId, cuerpo, contextoDe(req));
  }
}
