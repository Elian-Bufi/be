import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { EjecutorDeFormularios } from './ejecutor';
import { FormulariosController } from './formularios.controller';
import { FormulariosDeInicioController } from './formularios-de-inicio.controller';
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
 * llega del módulo global de novedades.
 */
@Module({
  imports: [SesionModule],
  controllers: [FormulariosController, FormulariosDeInicioController],
  providers: [EjecutorDeFormularios, PlantillasService, SolicitudesService, RespuestasService, VistasV2Service, RespuestasV2Service, PropuestasService],
})
export class FormulariosModule {}
