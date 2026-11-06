import { Module } from '@nestjs/common';
import { ProfesionalModule } from '../profesional/profesional.module';
import { SesionModule } from '../sesion/sesion.module';
import { AccesoAdministrativoService } from './acceso-administrativo.service';
import { AdministracionController } from './administracion.controller';
import { AdministracionService } from './administracion.service';
import { SegundoFactorGuard, SesionAdministrativaGuard } from './sesion-administrativa.guard';

/**
 * WP-ADMINISTRACION (DL-155; docs/paquetes/WP-ADMINISTRACION.md): la administración de profesionales por área, con
 * identidad administrativa separada y segundo factor TOTP. El rol lo asigna solo el comando interno
 * (`administracion/comando.ts`, D-3): nada de este módulo concede ni retira el rol.
 */
@Module({
  imports: [SesionModule, ProfesionalModule],
  controllers: [AdministracionController],
  providers: [AccesoAdministrativoService, AdministracionService, SesionAdministrativaGuard, SegundoFactorGuard],
})
export class AdministracionModule {}
