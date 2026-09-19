import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { CatalogoService } from './catalogo.service';
import { EjecutorNutricional } from './ejecutor';
import { EvaluacionesService } from './evaluaciones.service';
import { IngestasService } from './ingestas.service';
import { NutricionController } from './nutricion.controller';
import { PlanesService } from './planes.service';
import { RevisionesService } from './revisiones.service';

/**
 * B-07 — Circuito nutricional (06 §10). El PDP (AutorizacionModule) y el Proceso (ProcesoModule) son globales: este
 * módulo no decide autorización ni gestiona el ciclo del Proceso por su cuenta.
 */
@Module({
  imports: [SesionModule],
  controllers: [NutricionController],
  providers: [EjecutorNutricional, CatalogoService, EvaluacionesService, PlanesService, IngestasService, RevisionesService],
})
export class NutricionModule {}
