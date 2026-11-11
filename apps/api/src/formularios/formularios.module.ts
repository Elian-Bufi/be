import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { EjecutorDeFormularios } from './ejecutor';
import { FormulariosController } from './formularios.controller';
import { FormulariosDeInicioController } from './formularios-de-inicio.controller';
import { HabitosController } from './habitos.controller';
import { HabitosService } from './habitos.service';
import { PlantillasService } from './plantillas.service';
import { PropuestasService } from './propuestas.service';
import { RespuestasService } from './respuestas.service';
import { RespuestasV2Service } from './respuestas-v2.service';
import { SolicitudesService } from './solicitudes.service';
import { VistasV2Service } from './vistas-v2.service';

/**
 * CAP-DAT — información profesional pertinente (06 §20.4; RF-071; WP-07). Reutiliza el esqueleto de
 * `EjecutorDeDominio`, pero transversal a los tres Alcances: cada operación decide con el de la fila, no con uno fijo.
 * Desde DL-164, también la familia FRI (los formularios V2 y la propuesta del profesional); `PublicadorDeNovedades`
 * llega del módulo global de novedades. Desde DL-165 (FR-10), también la familia HBT: los hábitos de la persona y la
 * autorización para compartirlos con sus profesionales.
 */
@Module({
  imports: [SesionModule],
  controllers: [FormulariosController, FormulariosDeInicioController, HabitosController],
  providers: [EjecutorDeFormularios, PlantillasService, SolicitudesService, RespuestasService, VistasV2Service, RespuestasV2Service, PropuestasService, HabitosService],
})
export class FormulariosModule {}
