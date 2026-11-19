import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { EjecutorDeGraficos } from './ejecutor';
import { EnfoquesController } from './enfoques.controller';
import { EnfoquesService } from './enfoques.service';

/**
 * WP-GRAFICOS (DL-174): GR-27, los enfoques del profesional y dónde los eligió, familia GRF (API-GRF-01 a 07). Los
 * gráficos se dibujan en el website con las lecturas que ya existen; esta es la única parte del paquete que pide API. El
 * PDP, la auditoría, la idempotencia y el límite de lecturas vienen de los módulos globales.
 */
@Module({
  imports: [SesionModule],
  controllers: [EnfoquesController],
  providers: [EjecutorDeGraficos, EnfoquesService],
})
export class GraficosModule {}
