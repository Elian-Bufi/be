import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { CompartirController } from './compartir.controller';
import { CompartirService } from './compartir.service';
import { EjecutorDeCompartir } from './ejecutor';

/**
 * Familia CMP (WP-COMPARTIR; DL-176): la pantalla única de consentimiento y el toque que escribe todo lo elegido. Los actos
 * son los de siempre (A3, B2, lo de otras áreas, los hábitos y la historia anterior), con sus funciones de la base: no
 * importa sus módulos. El PDP, la auditoría y la idempotencia son globales.
 */
@Module({
  imports: [SesionModule],
  controllers: [CompartirController],
  providers: [EjecutorDeCompartir, CompartirService],
})
export class CompartirModule {}
