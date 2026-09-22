import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { EjecutorDeFormularios } from './ejecutor';
import { FormulariosController } from './formularios.controller';
import { PlantillasService } from './plantillas.service';
import { RespuestasService } from './respuestas.service';
import { SolicitudesService } from './solicitudes.service';

/**
 * CAP-DAT — información profesional pertinente (06 §20.4; RF-071; WP-07). Reutiliza el esqueleto de
 * `EjecutorDeDominio`, pero transversal a los tres Alcances: cada operación decide con el de la fila, no con uno fijo.
 */
@Module({
  imports: [SesionModule],
  controllers: [FormulariosController],
  providers: [EjecutorDeFormularios, PlantillasService, SolicitudesService, RespuestasService],
})
export class FormulariosModule {}
