import { Module } from '@nestjs/common';
import { SiembraDemoService } from './siembra-demo.service';
import { VerificacionService } from './verificacion.service';

/** M-02 mínimo (06 §6; DL-036): perfil profesional, verificación y habilitación por servicio interno, sin endpoint. */
@Module({
  providers: [VerificacionService, SiembraDemoService],
  exports: [VerificacionService],
})
export class ProfesionalModule {}
