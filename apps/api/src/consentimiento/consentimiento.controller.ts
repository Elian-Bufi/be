import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { RequisitoDeConsentimientoDeSaludResponse } from '@be/domain';
import { sinParametrosDeQuery } from '../http/validacion';
import { actorDe, SesionGuard, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { ConsentimientoService } from './consentimiento.service';

/** API-CON-05 — solo lectura en WP-02 (DEUDA_LEGAJO DL-021/TEN-30). */
@Controller('me/health-data-consent-requirement')
export class ConsentimientoController {
  constructor(private readonly consentimiento: ConsentimientoService) {}

  @Get()
  @UseGuards(SesionGuard)
  consultar(@Query() query: Record<string, unknown>, @Req() req: SolicitudAutenticada): Promise<RequisitoDeConsentimientoDeSaludResponse> {
    sinParametrosDeQuery(query);
    return this.consentimiento.requisito(actorDe(req));
  }
}
