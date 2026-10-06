import { Module } from '@nestjs/common';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { SesionModule } from '../sesion/sesion.module';
import { ALMACEN_DE_MEDIOS, almacenSegunEntorno } from './almacen-de-medios';
import { EjecutorDeMedios } from './ejecutor';
import { MediosController, RutasFirmadasController } from './medios.controller';
import { MediosService } from './medios.service';
import { RutasFirmadas } from './rutas-firmadas';

/**
 * DL-120 · medios privados: imágenes de referencia de las recetas y fotos de una comida. El almacenamiento se elige con
 * `BE_MEDIOS_ALMACEN` (`postgres`); el PDP y la auditoría son los globales. Exporta el servicio para las recetas y el
 * registro, que citan medios.
 */
@Module({
  imports: [SesionModule],
  controllers: [MediosController, RutasFirmadasController],
  providers: [
    EjecutorDeMedios,
    RutasFirmadas,
    MediosService,
    { provide: ALMACEN_DE_MEDIOS, useFactory: (entorno: Entorno) => almacenSegunEntorno(entorno), inject: [ENTORNO] },
  ],
  exports: [MediosService, RutasFirmadas, ALMACEN_DE_MEDIOS],
})
export class MediosModule {}
