import { Module } from '@nestjs/common';
import { SesionGuard } from './sesion.guard';
import { SesionService } from './sesion.service';
import { SesionesController } from './sesiones.controller';
import { TokensService } from './tokens.service';

/** Sesiones revocables (07 §43-bis; 08 §26). Exporta el guard SESSION para los demás módulos. */
@Module({
  controllers: [SesionesController],
  providers: [SesionService, TokensService, SesionGuard],
  exports: [SesionGuard, TokensService],
})
export class SesionModule {}
