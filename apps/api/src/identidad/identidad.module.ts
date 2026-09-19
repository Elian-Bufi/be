import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { VinculoModule } from '../vinculo/vinculo.module';
import { CierreService } from './cierre.service';
import { CuentaPropiaService } from './cuenta-propia.service';
import { EstadoDeCuentaService } from './estado-de-cuenta.service';
import { IdentidadController } from './identidad.controller';
import { RegistroService } from './registro.service';

/** Identidad, perfil propio y ciclo de vida de la cuenta (06 §5.4, §5.7). El cierre finaliza vínculos (WP-03). */
@Module({
  imports: [SesionModule, VinculoModule],
  controllers: [IdentidadController],
  providers: [RegistroService, CuentaPropiaService, CierreService, EstadoDeCuentaService],
  exports: [EstadoDeCuentaService],
})
export class IdentidadModule {}
