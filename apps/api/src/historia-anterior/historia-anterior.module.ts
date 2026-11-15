import { Module } from '@nestjs/common';
import { EntrenamientoModule } from '../entrenamiento/entrenamiento.module';
import { NutricionModule } from '../nutricion/nutricion.module';
import { SesionModule } from '../sesion/sesion.module';
import { EjecutorDeHistoriaAnterior } from './ejecutor';
import { HistoriaAnteriorController } from './historia-anterior.controller';
import { HistoriaAnteriorService } from './historia-anterior.service';

/**
 * Familia HIA (WP-HISTORIA-ANTERIOR; DL-175): la historia anterior de un área, para el profesional nuevo. El PDP es global.
 * Los planes de antes se leen con la misma lectura que usa la persona, la de cada circuito, y las sesiones con la de
 * Entrenamiento: por eso importa los módulos de Nutrición y de Entrenamiento, que las exportan.
 */
@Module({
  imports: [SesionModule, NutricionModule, EntrenamientoModule],
  controllers: [HistoriaAnteriorController],
  providers: [EjecutorDeHistoriaAnterior, HistoriaAnteriorService],
})
export class HistoriaAnteriorModule {}
