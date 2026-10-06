import { Injectable } from '@nestjs/common';
import { PdpService } from '../autorizacion/pdp.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { EjecutorDeDominio } from '../plataforma/ejecutor';
import { IdempotenciaService } from '../plataforma/idempotencia.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * El esqueleto común (idempotencia, transacción, PDP y auditoría) para la familia MED (DL-120). Las dos finalidades de un
 * medio son de Nutrición: la imagen de una receta y la foto de una comida.
 */
@Injectable()
export class EjecutorDeMedios extends EjecutorDeDominio {
  constructor(prisma: PrismaService, idempotencia: IdempotenciaService, auditoria: AuditoriaService, pdp: PdpService) {
    super('NUTRICION', prisma, idempotencia, auditoria, pdp);
  }
}
