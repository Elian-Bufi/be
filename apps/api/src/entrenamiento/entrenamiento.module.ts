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
import { FuerzaController } from './fuerza.controller';
import { SeriesObservadasService } from './series-observadas.service';
import { HabitualesDeEntrenamientoController } from './habituales.controller';
import { HabitualesDeEntrenamientoService } from './habituales.service';
import { ImagenesDeEjercicioService } from './imagenes.service';
import { ImportacionDeEjerciciosService } from './importacion.service';
import { NotasDeLaSesionController } from './notas-de-la-sesion.controller';
import { NotasDeLaSesionService } from './notas-de-la-sesion.service';
import { PlanesDeEntrenamientoService } from './planes.service';
import { PlantillasDeEntrenamientoService } from './plantillas.service';
import { PreparacionesDePlantillaService } from './preparaciones-de-plantilla.service';
import { RevisionesDeEntrenamientoService } from './revisiones.service';
import { ObjetivosPorSerieService } from './series.service';
import { TiemposDeSesionService } from './tiempos.service';
import { EditorDeEntrenamientoTanda2Controller } from './tanda-2.controller';
import { EsfuerzoDeLaSesionService } from './esfuerzo-de-la-sesion.service';
import { UnoRMService } from './uno-rm.service';

/**
 * B-08 — Circuito de entrenamiento (06:4947-5786). Como en nutrición, el PDP (AutorizacionModule) y el Proceso
 * (ProcesoModule) son globales: este módulo no decide autorización ni gestiona el ciclo del Proceso por su cuenta.
 * WP-ENTRENAMIENTO-SERIES suma los objetivos por serie, los tiempos de la sesión y la imagen del ejercicio, que cita un
 * medio privado: por eso importa MediosModule, como las recetas. Lo que declara el cliente solo moldea la forma de algunas
 * respuestas: ningún plan se traba ni se retiene por la versión de la app (DL-196; `compatibilidad-de-clientes.ts`).
 */
@Module({
  imports: [SesionModule, IntegracionesModule, MediosModule],
  controllers: [EntrenamientoController, HabitualesDeEntrenamientoController, EntrenamientoPorSerieController, FuerzaController, NotasDeLaSesionController, EditorDeEntrenamientoTanda2Controller],
  providers: [
    EjecutorDeEntrenamiento,
    CatalogoDeEjerciciosService,
    EvaluacionesDeEntrenamientoService,
    PlanesDeEntrenamientoService,
    PlantillasDeEntrenamientoService,
    // PLT (DL-182): la preparación de una plantilla, sin persona (API-TPL-06 a 14).
    PreparacionesDePlantillaService,
    HabitualesDeEntrenamientoService,
    EjecucionesDeEntrenamientoService,
    RevisionesDeEntrenamientoService,
    ImportacionDeEjerciciosService,
    ObjetivosPorSerieService,
    TiemposDeSesionService,
    ImagenesDeEjercicioService,
    // ED-72 (DL-171): la serie observada por el profesional (API-FZA-01 a 03).
    SeriesObservadasService,
    // PG-15 (DL-173): la nota para tu profe (API-TRN-25 y sus dos lecturas).
    NotasDeLaSesionService,
    // DL-198: el 1RM de referencia (API-RMX-01 y 02) y el esfuerzo de la sesión (API-ESF-01 y 02).
    UnoRMService,
    EsfuerzoDeLaSesionService,
  ],
  // El entorno profesional (AnalisisModule) lee cada sesión con el mismo modelo de API-TRN-19.
  // DL-163 D-13, ampliada (TB-52): el plan compartido (API-RES-06) se lee con la misma lectura que usa la persona.
  // PG-16 (DL-173): las notas propias del profesional citan un ejercicio del catálogo con la misma regla que el buscador.
  exports: [EjecucionesDeEntrenamientoService, PlanesDeEntrenamientoService, EvaluacionesDeEntrenamientoService, CatalogoDeEjerciciosService],
})
export class EntrenamientoModule {}
