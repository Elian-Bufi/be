import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { SolicitudesService } from './solicitudes.service';
import { VinculoController } from './vinculo.controller';
import { VinculosService } from './vinculos.service';

/** M-03: solicitud y vínculo por alcance (06 §7.3, §7.5). El PDP es de AutorizacionModule (global). */
@Module({
  imports: [SesionModule],
  controllers: [VinculoController],
  providers: [SolicitudesService, VinculosService],
  exports: [SolicitudesService, VinculosService],
})
export class VinculoModule {}
