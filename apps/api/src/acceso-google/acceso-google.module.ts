import { Module } from '@nestjs/common';
import { IdentidadModule } from '../identidad/identidad.module';
import { SesionModule } from '../sesion/sesion.module';
import { AccesoGoogleController } from './acceso-google.controller';
import { AccesoGoogleService } from './acceso-google.service';
import { MetodosDeAccesoController } from './metodos-de-acceso.controller';
import { MetodosDeAccesoService } from './metodos-de-acceso.service';
import { VerificadorDeGoogle } from './verificador-de-google';

/**
 * WP-ACCESO-GOOGLE (DEUDA_LEGAJO DL-138): entrar con Google, verificado por la API (RF-003, UC-E05). Usa la apertura de
 * sesiones de SesionModule (la misma sesión que API-ACC-02) y el alta de IdentidadModule (los mismos actos que API-ACC-01).
 * El verificador es el adaptador de Google Identity (07 §23): sin client IDs configurados, la familia responde 503 y el
 * acceso local sigue igual.
 * Desde RF-004 (DL-172), también los métodos de acceso de la cuenta propia (API-MET-01 a 03), con el mismo verificador.
 */
@Module({
  imports: [SesionModule, IdentidadModule],
  controllers: [AccesoGoogleController, MetodosDeAccesoController],
  providers: [AccesoGoogleService, MetodosDeAccesoService, VerificadorDeGoogle],
})
export class AccesoGoogleModule {}
