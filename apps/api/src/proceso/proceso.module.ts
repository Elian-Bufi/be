import { Global, Module } from '@nestjs/common';
import { ProcesoService } from './proceso.service';

/**
 * B-04 (Proceso operativo) y B-05 (capacidad). Global: lo usan la activación de un plan, la aplicación de una revisión,
 * la finalización de un vínculo y el cierre de cuenta, que viven en módulos distintos.
 */
@Global()
@Module({
  providers: [ProcesoService],
  exports: [ProcesoService],
})
export class ProcesoModule {}
