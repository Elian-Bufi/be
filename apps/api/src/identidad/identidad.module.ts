import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { VinculoModule } from '../vinculo/vinculo.module';
import { CierreService } from './cierre.service';
import { CuentaPropiaService } from './cuenta-propia.service';
import { EstadoDeCuentaService } from './estado-de-cuenta.service';
import { IdentidadController } from './identidad.controller';
import { EjecutorDePerfilPropio, PerfilPropioService } from './perfil-propio.service';
import { RegistroService } from './registro.service';

/**
 * Identidad, perfil propio y ciclo de vida de la cuenta (06 §5.4, §5.5, §5.7). El cierre finaliza vínculos (WP-03). El
 * perfil propio tiene su nombre visible desde el 2026-10-15 (DL-009 y DL-040).
 */
@Module({
  imports: [SesionModule, VinculoModule],
  controllers: [IdentidadController],
  providers: [RegistroService, CuentaPropiaService, CierreService, EstadoDeCuentaService, EjecutorDePerfilPropio, PerfilPropioService],
  exports: [EstadoDeCuentaService],
})
export class IdentidadModule {}
