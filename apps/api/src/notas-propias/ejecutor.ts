import { Injectable } from '@nestjs/common';
import { PdpService } from '../autorizacion/pdp.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { EjecutorDeDominio } from '../plataforma/ejecutor';
import { IdempotenciaService } from '../plataforma/idempotencia.service';
import { PrismaService } from '../prisma/prisma.service';

export { esUuid } from '../plataforma/ejecutor';

/**
 * El mismo esqueleto que el resto de los dominios (`plataforma/ejecutor.ts`) para las notas propias del profesional
 * (PG-16; DL-173): el cuerpo se valida antes que nada, la Idempotency-Key, el PDP dentro de la transacción, la auditoría
 * de éxito en la misma transacción y la del rechazo con su motivo. Una nota propia no es de un área: el servicio decide
 * con el PDP el área que corresponde en cada pedido (la del ancla, o alguna con la persona). El alcance fijo de acá solo
 * alimenta el `noRevelable()` de una nota ajena o inexistente, como en las notas de coordinación (DL-140).
 */
@Injectable()
export class EjecutorDeNotasPropias extends EjecutorDeDominio {
  constructor(prisma: PrismaService, idempotencia: IdempotenciaService, auditoria: AuditoriaService, pdp: PdpService) {
    super('ENTRENAMIENTO', prisma, idempotencia, auditoria, pdp);
  }
}
