import { Controller, Get, Header, HttpStatus, Inject, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ENTORNO, VERSION } from '../config/tokens';
import type { Entorno } from '../config/entorno';
import type { VersionDesplegada } from '../config/version';
import { HealthService } from './health.service';

/**
 * Señales de salud (07 §30). Fuera del prefijo /api/v1 (07 §13.2; ver DEUDA_LEGAJO DL-004).
 * Exponen ambiente, versión desplegada y estado de dependencias, sin secretos (RNF-OBS-002).
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly salud: HealthService,
    @Inject(ENTORNO) private readonly entorno: Entorno,
    @Inject(VERSION) private readonly version: VersionDesplegada,
  ) {}

  /** Liveness: el proceso responde. No consulta nada externo. */
  @Get('live')
  @Header('Cache-Control', 'no-store')
  live() {
    return { data: { estado: 'OK', ambiente: this.entorno.appEnv, version: this.version } };
  }

  /** Readiness: gate de deploy y routing. */
  @Get('ready')
  @Header('Cache-Control', 'no-store')
  ready(@Res({ passthrough: true }) res: Response) {
    return this.responderReadiness(res);
  }

  /** Alias de readiness para monitoreo externo (07 §30, conserva 503 DB_UNAVAILABLE). */
  @Get()
  @Header('Cache-Control', 'no-store')
  alias(@Res({ passthrough: true }) res: Response) {
    return this.responderReadiness(res);
  }

  private async responderReadiness(res: Response) {
    const { listo, dependencias } = await this.salud.readiness();
    const cuerpo = { ambiente: this.entorno.appEnv, version: this.version, dependencias };
    if (listo) return { data: { estado: 'OK', ...cuerpo } };

    res.status(HttpStatus.SERVICE_UNAVAILABLE);
    // 09 §3.2 — ErrorEnvelope; el origen de la indisponibilidad es la base de datos.
    return { error: { code: 'DB_UNAVAILABLE', message: 'El servicio no está listo.', details: cuerpo } };
  }
}
