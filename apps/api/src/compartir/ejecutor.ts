import { Injectable } from '@nestjs/common';
import { PdpService } from '../autorizacion/pdp.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { EjecutorDeDominio } from '../plataforma/ejecutor';
import { IdempotenciaService } from '../plataforma/idempotencia.service';
import { PrismaService } from '../prisma/prisma.service';

export { esUuid } from '../plataforma/ejecutor';

/**
 * El esqueleto común (`plataforma/ejecutor.ts`) para la familia CMP (DL-176), transversal a los tres Alcances como el de los
 * resúmenes y el de la historia anterior: todas sus operaciones son de la persona sobre lo suyo. El Alcance fijo solo
 * alimenta el `noRevelable()` por defecto cuando el recurso no existe y no hay ninguno que reportar.
 */
@Injectable()
export class EjecutorDeCompartir extends EjecutorDeDominio {
  constructor(prisma: PrismaService, idempotencia: IdempotenciaService, auditoria: AuditoriaService, pdp: PdpService) {
    super('NUTRICION', prisma, idempotencia, auditoria, pdp);
  }
}
