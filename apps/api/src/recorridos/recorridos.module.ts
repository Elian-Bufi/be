import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { RecorridosController } from './recorridos.controller';
import { RecorridosService } from './recorridos.service';

/**
 * WP-RECORRIDOS-GUIADOS (DL-195): qué recorridos guiados vio u omitió cada usuario, familia RGU (API-RGU-01 y 02). Los
 * recorridos se dibujan en el website; esta es la única parte del paquete que pide API. La auditoría viene del módulo
 * global de la plataforma.
 */
@Module({
  imports: [SesionModule],
  controllers: [RecorridosController],
  providers: [RecorridosService],
})
export class RecorridosModule {}
