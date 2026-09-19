import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { ConsentimientoDeSaludService } from './consentimiento-de-salud.service';
import { ConsentimientoProfesionalService } from './consentimiento-profesional.service';
import { ConsentimientoController } from './consentimiento.controller';
import { ConsentimientoService } from './consentimiento.service';
import { ConsentimientosController } from './consentimientos.controller';

/**
 * Consentimientos:
 * - A3 (08 §12.4): requisito (CON-05, WP-02), otorgar, historial y revocar (CON-06 a 08, WP-03);
 * - B2 por vínculo, alcance y finalidad (06 §7.7): CON-01 a 04, WP-03.
 */
@Module({
  imports: [SesionModule],
  controllers: [ConsentimientoController, ConsentimientosController],
  providers: [ConsentimientoService, ConsentimientoProfesionalService, ConsentimientoDeSaludService],
})
export class ConsentimientoModule {}
