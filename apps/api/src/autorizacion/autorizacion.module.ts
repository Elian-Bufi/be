import { Global, Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { PdpGuard } from './pdp.guard';
import { PdpService } from './pdp.service';

/**
 * Autorización contextual (T-06-19). Un solo módulo y un solo servicio de decisión para toda la API: ningún otro módulo
 * decide si un profesional accede a datos de un asesorado (brief WP-03: «No distribuyas la lógica por módulo»).
 */
@Global()
@Module({
  imports: [SesionModule],
  providers: [PdpService, PdpGuard],
  exports: [PdpService, PdpGuard],
})
export class AutorizacionModule {}
