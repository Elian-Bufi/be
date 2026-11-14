import { Injectable } from '@nestjs/common';
import { PdpService } from '../autorizacion/pdp.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { EjecutorDeDominio } from '../plataforma/ejecutor';
import { IdempotenciaService } from '../plataforma/idempotencia.service';
import { PrismaService } from '../prisma/prisma.service';

export { esUuid } from '../plataforma/ejecutor';

/**
 * El esqueleto común (`plataforma/ejecutor.ts`) para la familia GRF, los enfoques de WP-GRAFICOS (GR-27; DL-174): el
 * cuerpo se valida antes que nada, la Idempotency-Key cuando se exige, la auditoría de éxito en la misma transacción
 * (REQUIRED_SAME_TX) y la del rechazo con su motivo.
 * - Un enfoque es configuración del profesional, sin titular ni datos de salud, como una vista de «Analizar» (DL-128):
 *   API-GRF-01 a 04 no deciden con el PDP, y uno ajeno o inexistente es el mismo 404, que la auditoría registra.
 * - Una elección es sobre una persona: API-GRF-05 a 07 deciden con el PDP dentro de su transacción (alguna área, o la del
 *   plan). El reintento de quitar una con la misma clave vuelve a decidir (08:601).
 * El alcance fijo de la superclase solo alimenta el `noRevelable()` sin un área conocida (el servicio pasa la del plan
 * cuando la sabe); el constructor lo exige, como en las notas de coordinación (DL-140).
 */
@Injectable()
export class EjecutorDeGraficos extends EjecutorDeDominio {
  constructor(prisma: PrismaService, idempotencia: IdempotenciaService, auditoria: AuditoriaService, pdp: PdpService) {
    super('ENTRENAMIENTO', prisma, idempotencia, auditoria, pdp);
  }
}
