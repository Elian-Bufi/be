import { Injectable } from '@nestjs/common';
import { PdpService } from '../autorizacion/pdp.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { EjecutorDeDominio } from '../plataforma/ejecutor';
import { IdempotenciaService } from '../plataforma/idempotencia.service';
import { PrismaService } from '../prisma/prisma.service';

export { esUuid, type Recurso, type ResultadoDeEfecto } from '../plataforma/ejecutor';

/**
 * El mismo esqueleto que usa nutrición (`plataforma/ejecutor.ts`), con el Alcance de esta vertical. La Finalidad se
 * deriva de él (REG-06-61). Antropometría es Capacidad transversal, nunca tercera Especialidad (06:2774), pero para
 * el PDP es un Alcance más: se decide con las mismas siete dimensiones.
 */
@Injectable()
export class EjecutorAntropometrico extends EjecutorDeDominio {
  constructor(prisma: PrismaService, idempotencia: IdempotenciaService, auditoria: AuditoriaService, pdp: PdpService) {
    super('ANTROPOMETRIA', prisma, idempotencia, auditoria, pdp);
  }
}
