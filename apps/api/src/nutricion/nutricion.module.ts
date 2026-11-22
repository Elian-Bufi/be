import { Module } from '@nestjs/common';
import { IntegracionesModule } from '../integraciones/integraciones.module';
import { MediosModule } from '../medios/medios.module';
import { SesionModule } from '../sesion/sesion.module';
import { AlimentosController } from './alimentos.controller';
import { AlimentosService } from './alimentos.service';
import { CatalogoService } from './catalogo.service';
import { EjecutorNutricional } from './ejecutor';
import { EvaluacionesService } from './evaluaciones.service';
import { HabitualesNutricionalesController } from './habituales.controller';
import { HabitualesNutricionalesService } from './habituales.service';
import { ImportacionNutricionalService } from './importacion.service';
import { IngestasService } from './ingestas.service';
import { NutricionController } from './nutricion.controller';
import { ObjetivoYCalculadorController } from './objetivo-y-calculador.controller';
import { ObjetivoYCalculadorService } from './objetivo-y-calculador.service';
import { PlanesService } from './planes.service';
import { PlantillasNutricionalesService } from './plantillas.service';
import { RangosDeNutricionService } from './rangos.service';
import { RecetasController } from './recetas.controller';
import { RecetasService } from './recetas.service';
import { RegistroDeComidasController } from './registro-de-comidas.controller';
import { RegistroDeComidasService } from './registro-de-comidas.service';
import { RevisionDeAlimentosService } from './revision-de-alimentos.service';
import { PropuestasAlRecetarioService } from './propuestas-al-recetario.service';
import { RevisionesService } from './revisiones.service';

/**
 * B-07 — Circuito nutricional (06 §10). El PDP (AutorizacionModule) y el Proceso (ProcesoModule) son globales: este
 * módulo no decide autorización ni gestiona el ciclo del Proceso por su cuenta. Las recetas (DL-119) y el registro v2
 * (DL-121) citan medios privados (DL-120), que viven en su propio módulo.
 */
@Module({
  imports: [SesionModule, IntegracionesModule, MediosModule],
  controllers: [NutricionController, HabitualesNutricionalesController, RecetasController, RegistroDeComidasController, AlimentosController, ObjetivoYCalculadorController],
  providers: [
    EjecutorNutricional,
    CatalogoService,
    EvaluacionesService,
    PlanesService,
    PlantillasNutricionalesService,
    RangosDeNutricionService,
    HabitualesNutricionalesService,
    IngestasService,
    RevisionesService,
    ImportacionNutricionalService,
    RecetasService,
    RegistroDeComidasService,
    AlimentosService,
    RevisionDeAlimentosService,
    // DL-191 (WP-RECETARIO-E-IMAGENES): Administración revisa las propuestas al Recetario de BE.
    PropuestasAlRecetarioService,
    // DL-186 (WP-OBJETIVO-Y-CALCULADOR): el objetivo con una toma de referencia y el calculador de macros.
    ObjetivoYCalculadorService,
  ],
  // DL-163 D-13, ampliada (TB-52): el plan compartido (API-RES-06) se lee con la misma lectura que usa la persona.
  // DL-180 (NUA-04): Administración revisa los alimentos cargados a mano desde su controlador, como las incidencias.
  // DL-191 (REC-08): las propuestas al Recetario de BE, también desde el controlador de Administración.
  exports: [PlanesService, EvaluacionesService, RevisionDeAlimentosService, PropuestasAlRecetarioService],
})
export class NutricionModule {}
