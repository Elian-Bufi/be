import { Module } from '@nestjs/common';
import { IntegracionesModule } from '../integraciones/integraciones.module';
import { MediosModule } from '../medios/medios.module';
import { SesionModule } from '../sesion/sesion.module';
import { CatalogoService } from './catalogo.service';
import { EjecutorNutricional } from './ejecutor';
import { EvaluacionesService } from './evaluaciones.service';
import { HabitualesNutricionalesController } from './habituales.controller';
import { HabitualesNutricionalesService } from './habituales.service';
import { ImportacionNutricionalService } from './importacion.service';
import { IngestasService } from './ingestas.service';
import { NutricionController } from './nutricion.controller';
import { PlanesService } from './planes.service';
import { PlantillasNutricionalesService } from './plantillas.service';
import { RecetasController } from './recetas.controller';
import { RecetasService } from './recetas.service';
import { RegistroDeComidasController } from './registro-de-comidas.controller';
import { RegistroDeComidasService } from './registro-de-comidas.service';
import { RevisionesService } from './revisiones.service';

/**
 * B-07 — Circuito nutricional (06 §10). El PDP (AutorizacionModule) y el Proceso (ProcesoModule) son globales: este
 * módulo no decide autorización ni gestiona el ciclo del Proceso por su cuenta. Las recetas (DL-119) y el registro v2
 * (DL-121) citan medios privados (DL-120), que viven en su propio módulo.
 */
@Module({
  imports: [SesionModule, IntegracionesModule, MediosModule],
  controllers: [NutricionController, HabitualesNutricionalesController, RecetasController, RegistroDeComidasController],
  providers: [
    EjecutorNutricional,
    CatalogoService,
    EvaluacionesService,
    PlanesService,
    PlantillasNutricionalesService,
    HabitualesNutricionalesService,
    IngestasService,
    RevisionesService,
    ImportacionNutricionalService,
    RecetasService,
    RegistroDeComidasService,
  ],
})
export class NutricionModule {}
