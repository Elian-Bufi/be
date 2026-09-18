import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { ConsentimientoController } from './consentimiento.controller';
import { ConsentimientoService } from './consentimiento.service';

/** Consentimiento A3 (08 §12.3). WP-02: solo CON-05 en lectura; otorgar y revocar quedan fuera (CON-06/07). */
@Module({
  imports: [SesionModule],
  controllers: [ConsentimientoController],
  providers: [ConsentimientoService],
})
export class ConsentimientoModule {}
