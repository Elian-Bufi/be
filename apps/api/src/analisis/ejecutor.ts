import { Injectable } from '@nestjs/common';
import { PdpService } from '../autorizacion/pdp.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { EjecutorDeDominio } from '../plataforma/ejecutor';
import { IdempotenciaService } from '../plataforma/idempotencia.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * El esqueleto común (validación, Idempotency-Key, transacción y auditoría REQUIRED_SAME_TX) para la familia VAN
 * (DL-128). Una vista guardada es configuración del profesional, sin titular ni datos de salud: estas operaciones no
 * deciden con el PDP ni llaman a `noRevelable()`, y una vista ajena o inexistente es un 404 que la auditoría registra
 * como rechazo. El Alcance fijo de la superclase no se usa: queda el de Nutrición solo porque el constructor lo exige
 * (mismo tratamiento que MED y FRM, que lo documentan igual).
 */
@Injectable()
export class EjecutorDeVistas extends EjecutorDeDominio {
  constructor(prisma: PrismaService, idempotencia: IdempotenciaService, auditoria: AuditoriaService, pdp: PdpService) {
    super('NUTRICION', prisma, idempotencia, auditoria, pdp);
  }
}
