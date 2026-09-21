import { Injectable } from '@nestjs/common';
import { PdpService } from '../autorizacion/pdp.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { EjecutorDeDominio } from '../plataforma/ejecutor';
import { IdempotenciaService } from '../plataforma/idempotencia.service';
import { PrismaService } from '../prisma/prisma.service';

export { esUuid, type Recurso, type ResultadoDeEfecto } from '../plataforma/ejecutor';

/**
 * El esqueleto común de las operaciones TRN (WP-06), con el Alcance de la vertical. Es el mismo `EjecutorDeDominio`
 * que usan nutrición y antropometría: «no se crea una API paralela conceptual para versionado, activación, revisión,
 * continuidad, concurrencia, idempotencia» (CAND-09-TRN-A, 09v10:111-122). Lo único propio es el Alcance.
 */
@Injectable()
export class EjecutorDeEntrenamiento extends EjecutorDeDominio {
  constructor(prisma: PrismaService, idempotencia: IdempotenciaService, auditoria: AuditoriaService, pdp: PdpService) {
    super('ENTRENAMIENTO', prisma, idempotencia, auditoria, pdp);
  }
}
