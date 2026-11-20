import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { EjecutorDeEvaluacionYFormularios } from './ejecutor';
import { EvaluacionYFormulariosController } from './evaluacion-y-formularios.controller';
import { EvaluacionYFormulariosService } from './evaluacion-y-formularios.service';

/**
 * WP-EVALUACION-Y-FORMULARIOS (DL-185): la familia EVF, los formularios que la persona respondió vinculados por referencia a
 * la evaluación inicial de Nutrición y de Entrenamiento. Lo nuevo va en operaciones nuevas (DL-137 D-7): las de la
 * evaluación (API-NUT-01 a 03, API-TRN-01 a 03) no cambian de forma. El PDP es global.
 */
@Module({
  imports: [SesionModule],
  controllers: [EvaluacionYFormulariosController],
  providers: [EjecutorDeEvaluacionYFormularios, EvaluacionYFormulariosService],
})
export class EvaluacionYFormulariosModule {}
