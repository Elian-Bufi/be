import { Injectable } from '@nestjs/common';
import { PdpService } from '../autorizacion/pdp.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { EjecutorDeDominio } from '../plataforma/ejecutor';
import { IdempotenciaService } from '../plataforma/idempotencia.service';
import { PrismaService } from '../prisma/prisma.service';

export { esUuid } from '../plataforma/ejecutor';

/**
 * El mismo esqueleto que el resto de los dominios (`plataforma/ejecutor.ts`) para los formularios vinculados a una
 * evaluación (DL-185): el PDP dentro de la transacción, la idempotencia y la auditoría. Las operaciones sirven a Nutrición y
 * a Entrenamiento: cada una decide el PDP con el Alcance de la evaluación y lo pasa a `noRevelable()`. El fijo de acá solo
 * cubre el caso en que todavía no se sabe el área (una ruta con un área que no existe).
 */
@Injectable()
export class EjecutorDeEvaluacionYFormularios extends EjecutorDeDominio {
  constructor(prisma: PrismaService, idempotencia: IdempotenciaService, auditoria: AuditoriaService, pdp: PdpService) {
    super('NUTRICION', prisma, idempotencia, auditoria, pdp);
  }
}
