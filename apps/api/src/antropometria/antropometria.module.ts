import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { AntropometriaController } from './antropometria.controller';
import { EjecutorAntropometrico } from './ejecutor';
import { EspecificacionesService } from './especificaciones.service';
import { EvaluacionesAntropometricasService } from './evaluaciones.service';
import { EvolucionService } from './evolucion.service';
import { MedicionesService } from './mediciones.service';

/**
 * B-10 — antropometría (06 §13 y §20). Reutiliza el esqueleto de `EjecutorDeDominio` con el Alcance ANTROPOMETRIA y
 * el PDP global. **No usa Proceso ni capacidad**: una operación antropométrica aislada no los toca (06 §8.9, §9.11.2).
 */
@Module({
  imports: [SesionModule],
  controllers: [AntropometriaController],
  providers: [EjecutorAntropometrico, EspecificacionesService, EvaluacionesAntropometricasService, MedicionesService, EvolucionService],
})
export class AntropometriaModule {}
