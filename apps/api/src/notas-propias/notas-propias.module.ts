import { Module } from '@nestjs/common';
import { EntrenamientoModule } from '../entrenamiento/entrenamiento.module';
import { SesionModule } from '../sesion/sesion.module';
import { EjecutorDeNotasPropias } from './ejecutor';
import { NotasPropiasController } from './notas-propias.controller';
import { NotasPropiasService } from './notas-propias.service';

/**
 * WP-PULIDO-GRANDES PG-16 (DL-173; PG-D11, aprobada por Dirección el 2026-11-14): las notas propias del profesional sobre
 * una persona, familia NPP (API-NPP-01 a 03). El PDP (global) decide en cada pedido; el catálogo de ejercicios
 * (EntrenamientoModule) dice qué ejercicio puede citar el autor, con la regla del buscador.
 */
@Module({
  imports: [SesionModule, EntrenamientoModule],
  controllers: [NotasPropiasController],
  providers: [EjecutorDeNotasPropias, NotasPropiasService],
})
export class NotasPropiasModule {}
