import { Injectable } from '@nestjs/common';
import { PdpService } from '../autorizacion/pdp.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { EjecutorDeDominio } from '../plataforma/ejecutor';
import { IdempotenciaService } from '../plataforma/idempotencia.service';
import { PrismaService } from '../prisma/prisma.service';

export { esUuid, type Recurso, type ResultadoDeEfecto } from '../plataforma/ejecutor';

/**
 * El esqueleto común de las operaciones NUT (WP-04), con el Alcance de la vertical. Todo el comportamiento vive en
 * `EjecutorDeDominio` (`apps/api/src/plataforma/ejecutor.ts`), que WP-05 generalizó sin cambiarlo: lo único propio
 * de nutrición era el Alcance, y la Finalidad se deriva de él (REG-06-61).
 */
@Injectable()
export class EjecutorNutricional extends EjecutorDeDominio {
  constructor(prisma: PrismaService, idempotencia: IdempotenciaService, auditoria: AuditoriaService, pdp: PdpService) {
    super('NUTRICION', prisma, idempotencia, auditoria, pdp);
  }
}
