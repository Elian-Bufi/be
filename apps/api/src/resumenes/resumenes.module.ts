import { Module } from '@nestjs/common';
import { EntrenamientoModule } from '../entrenamiento/entrenamiento.module';
import { NutricionModule } from '../nutricion/nutricion.module';
import { SesionModule } from '../sesion/sesion.module';
import { EjecutorDeResumenes } from './ejecutor';
import { ResumenesController } from './resumenes.controller';
import { ResumenesService } from './resumenes.service';

/**
 * Familia RES (WP-TABLERO-ALTA-GAMA TB-52 a TB-56; DL-163 D-13, ampliada): lo que la persona comparte de otras áreas. El
 * PDP y el publicador de novedades son globales. El plan del otro se lee con la misma lectura que usa la persona, la de
 * cada circuito: por eso importa los módulos de Nutrición y de Entrenamiento, que exportan sus planes y sus objetivos.
 */
@Module({
  imports: [SesionModule, NutricionModule, EntrenamientoModule],
  controllers: [ResumenesController],
  providers: [EjecutorDeResumenes, ResumenesService],
})
export class ResumenesModule {}
