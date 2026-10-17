import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { EjecutorDeCoordinacion } from './ejecutor';
import { NotasDeCoordinacionController } from './notas.controller';
import { NotasDeCoordinacionService } from './notas.service';

/**
 * RF-057 · UC-E07 · API-CRD-01 (WP-NOTAS-DE-COORDINACION; DEUDA_LEGAJO DL-140): la nota de coordinación entre los
 * profesionales de una persona. El PDP (global) decide al autor y a cada destinatario; las novedades salen con el
 * publicador (global) en la misma transacción. La lectura del profesional vive en la línea de tiempo (AnalisisModule), que
 * usa `lectura-notas.ts`.
 */
@Module({
  imports: [SesionModule],
  controllers: [NotasDeCoordinacionController],
  providers: [EjecutorDeCoordinacion, NotasDeCoordinacionService],
})
export class CoordinacionModule {}
