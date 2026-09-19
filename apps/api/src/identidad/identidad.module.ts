import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { CierreService } from './cierre.service';
import { CuentaPropiaService } from './cuenta-propia.service';
import { EstadoDeCuentaService } from './estado-de-cuenta.service';
import { IdentidadController } from './identidad.controller';
import { RegistroService } from './registro.service';

/** Identidad, perfil propio y ciclo de vida de la cuenta (06 §5.4, §5.7). */
@Module({
  imports: [SesionModule],
  controllers: [IdentidadController],
  providers: [RegistroService, CuentaPropiaService, CierreService, EstadoDeCuentaService],
  exports: [EstadoDeCuentaService],
})
export class IdentidadModule {}
