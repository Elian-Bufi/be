import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { ContextoDeLaPersonaController } from './contexto-de-la-persona.controller';
import { ContextoDeLaPersonaService } from './contexto-de-la-persona.service';
import { EjecutorDelContexto } from './ejecutor';

/**
 * WP-CONTEXTO-DE-LA-PERSONA (DL-179): la familia CTX, las lecturas del panel «Contexto de <nombre>» que no existían. Lo demás
 * que el panel muestra (los hábitos compartidos, lo de otras áreas, las notas propias) se lee con sus operaciones de siempre.
 * El PDP es global.
 */
@Module({
  imports: [SesionModule],
  controllers: [ContextoDeLaPersonaController],
  providers: [EjecutorDelContexto, ContextoDeLaPersonaService],
})
export class ContextoDeLaPersonaModule {}
