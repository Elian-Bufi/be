import { Module } from '@nestjs/common';
import { RecuperacionController } from './recuperacion.controller';
import { RecuperacionService } from './recuperacion.service';

/**
 * UF-03 de WP-USO-FINAL (DL-169; UF-D9): recuperar el acceso local (API-ACC-P1-01 y 02). Exporta el servicio para
 * Administración, que emite la recuperación asistida (API-ADM-18) desde su propio controlador. El correo, el limitador y
 * las credenciales vienen de la plataforma.
 */
@Module({
  controllers: [RecuperacionController],
  providers: [RecuperacionService],
  exports: [RecuperacionService],
})
export class RecuperacionModule {}
