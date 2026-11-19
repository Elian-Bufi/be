import { Injectable } from '@nestjs/common';
import { PdpService } from '../autorizacion/pdp.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { EjecutorDeDominio } from '../plataforma/ejecutor';
import { IdempotenciaService } from '../plataforma/idempotencia.service';
import { PrismaService } from '../prisma/prisma.service';

export { esUuid } from '../plataforma/ejecutor';

/**
 * El mismo esqueleto que el resto de los dominios (`plataforma/ejecutor.ts`) para el contexto de la persona (DL-179): el PDP
 * dentro de la transacción y la auditoría de la lectura. El contexto no es de un área: cada lectura decide con el PDP las
 * áreas que hoy se permiten. El alcance fijo de acá solo alimenta el `noRevelable()` de un id malformado.
 */
@Injectable()
export class EjecutorDelContexto extends EjecutorDeDominio {
  constructor(prisma: PrismaService, idempotencia: IdempotenciaService, auditoria: AuditoriaService, pdp: PdpService) {
    super('ENTRENAMIENTO', prisma, idempotencia, auditoria, pdp);
  }
}
