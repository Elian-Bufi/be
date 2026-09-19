import { Module } from '@nestjs/common';
import { SesionModule } from '../sesion/sesion.module';
import { DashboardController } from './dashboard.controller';

/** API-DSH-03 mínimo (DL-031). El PDP y su guard vienen de AutorizacionModule (global). */
@Module({
  imports: [SesionModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
