import { Global, Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { CanalExpo } from './canal-expo';
import { DespachadorDeAvisos } from './despachador';
import { NovedadesController } from './novedades.controller';
import { NovedadesService } from './novedades.service';
import { PublicadorDeNovedades } from './publicador';
import { RecordatoriosService } from './recordatorios.service';
import { TareasController } from './tareas.controller';

/**
 * WP-NOVEDADES-Y-AVISOS (DL-133): RF-061 y RF-062. Global como el Proceso: los servicios de dominio publican sus
 * novedades con `PublicadorDeNovedades` dentro de sus transacciones, sin importar este módulo uno por uno.
 */
@Global()
@Module({
  imports: [SesionModule],
  controllers: [NovedadesController, TareasController],
  providers: [CanalExpo, DespachadorDeAvisos, PublicadorDeNovedades, NovedadesService, RecordatoriosService],
  exports: [PublicadorDeNovedades],
})
export class NovedadesModule {}
