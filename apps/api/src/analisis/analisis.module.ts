import { Module } from '@nestjs/common';
import { EntrenamientoModule } from '../entrenamiento/entrenamiento.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SesionModule } from '../sesion/sesion.module';
import { AnalisisController } from './analisis.controller';
import { EjecutorDeVistas } from './ejecutor';
import { VistasDeAnalisisController } from './vistas.controller';
import { VistasDeAnalisisService } from './vistas.service';

/**
 * WP-DASHBOARD-PROFESIONAL: la línea de tiempo (API-DSH-04; DL-127), las proyecciones (API-PRJ-01; DL-126) y las vistas
 * guardadas (API-VAN-01 a 04; DL-128). El PDP y su guard vienen de AutorizacionModule (global). Importa
 * EntrenamientoModule para leer cada sesión con el mismo modelo de API-TRN-19.
 */
@Module({
  imports: [SesionModule, PrismaModule, EntrenamientoModule],
  controllers: [AnalisisController, VistasDeAnalisisController],
  providers: [EjecutorDeVistas, VistasDeAnalisisService],
})
export class AnalisisModule {}
