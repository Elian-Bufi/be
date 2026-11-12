import { Global, Module } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { CorreoService } from './correo.service';
import { CredencialesService } from './credenciales.service';
import { IdempotenciaService } from './idempotencia.service';
import { LimitadorService } from './limitador.service';

/** Servicios transversales (07: `emision`/plataforma). Sin lógica de dominio. Desde UF-03 (DL-169), el correo de BE. */
@Global()
@Module({
  providers: [AuditoriaService, IdempotenciaService, LimitadorService, CredencialesService, CorreoService],
  exports: [AuditoriaService, IdempotenciaService, LimitadorService, CredencialesService, CorreoService],
})
export class PlataformaModule {}
