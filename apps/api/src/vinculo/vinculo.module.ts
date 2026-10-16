import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { InvitacionesController } from './invitaciones.controller';
import { InvitacionesService } from './invitaciones.service';
import { SolicitudesService } from './solicitudes.service';
import { VinculoController } from './vinculo.controller';
import { VinculosService } from './vinculos.service';

/**
 * M-03: solicitud y vínculo por alcance (06 §7.3, §7.5), y la invitación previa a Identidad BE (06 §7.4; WP-INVITACION,
 * DL-136), que al usarse crea la solicitud con el mismo `SolicitudesService`. El PDP es de AutorizacionModule (global).
 */
@Module({
  imports: [SesionModule],
  controllers: [VinculoController, InvitacionesController],
  providers: [SolicitudesService, VinculosService, InvitacionesService],
  exports: [SolicitudesService, VinculosService],
})
export class VinculoModule {}
