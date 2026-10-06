import { Module } from '@nestjs/common';
import { IntegracionesModule } from '../integraciones/integraciones.module';
import { MediosModule } from '../medios/medios.module';
import { SesionModule } from '../sesion/sesion.module';
import { CatalogoDeEjerciciosService } from './catalogo.service';
import { EjecucionesDeEntrenamientoService } from './ejecuciones.service';
import { EjecutorDeEntrenamiento } from './ejecutor';
import { EntrenamientoPorSerieController } from './entrenamiento-por-serie.controller';
import { EntrenamientoController } from './entrenamiento.controller';
import { EvaluacionesDeEntrenamientoService } from './evaluaciones.service';
import { HabitualesDeEntrenamientoController } from './habituales.controller';
import { HabitualesDeEntrenamientoService } from './habituales.service';
import { ImagenesDeEjercicioService } from './imagenes.service';
import { ImportacionDeEjerciciosService } from './importacion.service';
import { PlanesDeEntrenamientoService } from './planes.service';
import { PlantillasDeEntrenamientoService } from './plantillas.service';
import { RevisionesDeEntrenamientoService } from './revisiones.service';
import { ObjetivosPorSerieService } from './series.service';
import { TiemposDeSesionService } from './tiempos.service';

/**
 * B-08 — Circuito de entrenamiento (06:4947-5786). Como en nutrición, el PDP (AutorizacionModule) y el Proceso
 * (ProcesoModule) son globales: este módulo no decide autorización ni gestiona el ciclo del Proceso por su cuenta.
 * WP-ENTRENAMIENTO-SERIES suma los objetivos por serie, los tiempos de la sesión y la imagen del ejercicio, que cita un
 * medio privado: por eso importa MediosModule, como las recetas.
 */
@Module({
  imports: [SesionModule, IntegracionesModule, MediosModule],
  controllers: [EntrenamientoController, HabitualesDeEntrenamientoController, EntrenamientoPorSerieController],
  providers: [
    EjecutorDeEntrenamiento,
    CatalogoDeEjerciciosService,
    EvaluacionesDeEntrenamientoService,
    PlanesDeEntrenamientoService,
    PlantillasDeEntrenamientoService,
    HabitualesDeEntrenamientoService,
    EjecucionesDeEntrenamientoService,
    RevisionesDeEntrenamientoService,
    ImportacionDeEjerciciosService,
    ObjetivosPorSerieService,
    TiemposDeSesionService,
    ImagenesDeEjercicioService,
  ],
})
export class EntrenamientoModule {}
