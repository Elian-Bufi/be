import { Injectable } from '@nestjs/common';
import { PdpService } from '../autorizacion/pdp.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { EjecutorDeDominio } from '../plataforma/ejecutor';
import { IdempotenciaService } from '../plataforma/idempotencia.service';
import { PrismaService } from '../prisma/prisma.service';

export { esUuid, type Recurso, type ResultadoDeEfecto } from '../plataforma/ejecutor';

/**
 * El mismo esqueleto que el resto de los dominios (`plataforma/ejecutor.ts`) para las notas de coordinación (DL-140): el
 * cuerpo se valida antes que nada, la Idempotency-Key, el PDP dentro de la transacción, la auditoría de éxito en la misma
 * transacción y la del rechazo con su motivo. Una nota es transversal a las áreas, como FRM: el PDP decide con el área de
 * origen que trae cada pedido (`decidirEnTransaccion` la toma por llamada). El alcance fijo de acá solo alimenta el
 * `noRevelable()` por defecto, que estas operaciones no usan.
 */
@Injectable()
export class EjecutorDeCoordinacion extends EjecutorDeDominio {
  constructor(prisma: PrismaService, idempotencia: IdempotenciaService, auditoria: AuditoriaService, pdp: PdpService) {
    super('NUTRICION', prisma, idempotencia, auditoria, pdp);
  }
}
