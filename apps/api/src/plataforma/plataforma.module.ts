import { Global, Module } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { CredencialesService } from './credenciales.service';
import { IdempotenciaService } from './idempotencia.service';
import { LimitadorService } from './limitador.service';

/** Servicios transversales (07: `emision`/plataforma). Sin lógica de dominio. */
@Global()
@Module({
  providers: [AuditoriaService, IdempotenciaService, LimitadorService, CredencialesService],
  exports: [AuditoriaService, IdempotenciaService, LimitadorService, CredencialesService],
})
export class PlataformaModule {}
