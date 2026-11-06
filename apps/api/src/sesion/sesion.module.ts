import { Module } from '@nestjs/common';
import { ReanudacionService } from './reanudacion.service';
import { SesionGuard } from './sesion.guard';
import { SesionService } from './sesion.service';
import { SesionesController } from './sesiones.controller';
import { TokensService } from './tokens.service';

/**
 * Sesiones revocables (07 §43-bis; 08 §26). Exporta el guard SESSION para los demás módulos, y la apertura de sesiones
 * para la familia GOO (DL-138), que abre la misma sesión que API-ACC-02, con la reanudación del website (DL-147).
 */
@Module({
  controllers: [SesionesController],
  providers: [SesionService, TokensService, SesionGuard, ReanudacionService],
  exports: [SesionGuard, TokensService, SesionService, ReanudacionService],
})
export class SesionModule {}
