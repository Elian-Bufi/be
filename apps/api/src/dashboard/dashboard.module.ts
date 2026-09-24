import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SesionModule } from '../sesion/sesion.module';
import { DashboardController } from './dashboard.controller';

/** API-DSH-03 (DL-031). El PDP y su guard vienen de AutorizacionModule (global). */
@Module({
  imports: [SesionModule, PrismaModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
