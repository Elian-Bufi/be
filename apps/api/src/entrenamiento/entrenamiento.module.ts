import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { CatalogoDeEjerciciosService } from './catalogo.service';
import { EjecutorDeEntrenamiento } from './ejecutor';
import { EntrenamientoController } from './entrenamiento.controller';
import { EvaluacionesDeEntrenamientoService } from './evaluaciones.service';
import { PlanesDeEntrenamientoService } from './planes.service';

/**
 * B-08 — Circuito de entrenamiento (06:4947-5786). Como en nutrición, el PDP (AutorizacionModule) y el Proceso
 * (ProcesoModule) son globales: este módulo no decide autorización ni gestiona el ciclo del Proceso por su cuenta.
 */
@Module({
  imports: [SesionModule],
  controllers: [EntrenamientoController],
  providers: [EjecutorDeEntrenamiento, CatalogoDeEjerciciosService, EvaluacionesDeEntrenamientoService, PlanesDeEntrenamientoService],
})
export class EntrenamientoModule {}
