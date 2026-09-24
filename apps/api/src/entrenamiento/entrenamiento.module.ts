import { Module } from '@nestjs/common';
import { IntegracionesModule } from '../integraciones/integraciones.module';
import { SesionModule } from '../sesion/sesion.module';
import { CatalogoDeEjerciciosService } from './catalogo.service';
import { EjecucionesDeEntrenamientoService } from './ejecuciones.service';
import { EjecutorDeEntrenamiento } from './ejecutor';
import { EntrenamientoController } from './entrenamiento.controller';
import { EvaluacionesDeEntrenamientoService } from './evaluaciones.service';
import { ImportacionDeEjerciciosService } from './importacion.service';
import { PlanesDeEntrenamientoService } from './planes.service';
import { RevisionesDeEntrenamientoService } from './revisiones.service';

/**
 * B-08 — Circuito de entrenamiento (06:4947-5786). Como en nutrición, el PDP (AutorizacionModule) y el Proceso
 * (ProcesoModule) son globales: este módulo no decide autorización ni gestiona el ciclo del Proceso por su cuenta.
 */
@Module({
  imports: [SesionModule, IntegracionesModule],
  controllers: [EntrenamientoController],
  providers: [
    EjecutorDeEntrenamiento,
    CatalogoDeEjerciciosService,
    EvaluacionesDeEntrenamientoService,
    PlanesDeEntrenamientoService,
    EjecucionesDeEntrenamientoService,
    RevisionesDeEntrenamientoService,
    ImportacionDeEjerciciosService,
  ],
})
export class EntrenamientoModule {}
