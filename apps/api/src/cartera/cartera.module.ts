import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SesionModule } from '../sesion/sesion.module';
import { CarteraController } from './cartera.controller';

/** API-CAR-01 (PF-07, propuesta; DL-116). El PDP, el Proceso y el limitador vienen de módulos globales. */
@Module({
  imports: [SesionModule, PrismaModule],
  controllers: [CarteraController],
})
export class CarteraModule {}
