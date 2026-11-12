import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { DerechosController } from './derechos.controller';
import { DerechosService } from './derechos.service';
import { RutaDeExportacion } from './ruta-de-exportacion';

/**
 * UF-06 de WP-USO-FINAL (DL-169): los derechos de la persona (API-RGT-01 a 03, API-EXP-01 y 02 y su descarga firmada).
 * Exporta el servicio para Administración, que resuelve los pedidos (API-ADM-16 y 17) desde su propio controlador.
 */
@Module({
  imports: [SesionModule],
  controllers: [DerechosController],
  providers: [DerechosService, RutaDeExportacion],
  exports: [DerechosService],
})
export class DerechosModule {}
