import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { IncidenciasController } from './incidencias.controller';
import { IncidenciasService } from './incidencias.service';

/**
 * RF-068 (DL-172): las incidencias administrativas mínimas. Exporta el servicio para Administración, que las consulta y les
 * cambia el estado (API-INC-03 a 05) desde su propio controlador, como los pedidos de derechos.
 */
@Module({
  imports: [SesionModule],
  controllers: [IncidenciasController],
  providers: [IncidenciasService],
  exports: [IncidenciasService],
})
export class IncidenciasModule {}
