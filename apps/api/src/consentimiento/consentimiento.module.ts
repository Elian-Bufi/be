import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { ConsentimientoDeSaludService } from './consentimiento-de-salud.service';
import { ConsentimientoProfesionalService } from './consentimiento-profesional.service';
import { ConsentimientoController } from './consentimiento.controller';
import { ConsentimientoService } from './consentimiento.service';
import { ConsentimientosController } from './consentimientos.controller';
import { EvidenciaVisualService } from './evidencia-visual.service';

/**
 * Consentimientos:
 * - A3 (08 §12.4): requisito (CON-05, WP-02), otorgar, historial y revocar (CON-06 a 08, WP-03);
 * - B2 por vínculo, alcance y finalidad (06 §7.7): CON-01 a 04, WP-03;
 * - EVIDENCIA_VISUAL por alcance de Nutrición (08 §12.4; DL-125): EVI-01 a 04, una propuesta del precierre del 2026-10-06.
 */
@Module({
  imports: [SesionModule],
  controllers: [ConsentimientoController, ConsentimientosController],
  providers: [ConsentimientoService, ConsentimientoProfesionalService, ConsentimientoDeSaludService, EvidenciaVisualService],
})
export class ConsentimientoModule {}
