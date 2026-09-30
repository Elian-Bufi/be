import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SesionModule } from '../sesion/sesion.module';
import { CarteraController } from './cartera.controller';

/** API-DSH-04 (PF-07, propuesta). El PDP, el Proceso y el limitador vienen de módulos globales. */
@Module({
  imports: [SesionModule, PrismaModule],
  controllers: [CarteraController],
})
export class CarteraModule {}
