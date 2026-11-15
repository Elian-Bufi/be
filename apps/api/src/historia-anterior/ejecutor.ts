import { Injectable } from '@nestjs/common';
import { PdpService } from '../autorizacion/pdp.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { EjecutorDeDominio } from '../plataforma/ejecutor';
import { IdempotenciaService } from '../plataforma/idempotencia.service';
import { PrismaService } from '../prisma/prisma.service';

export { esUuid } from '../plataforma/ejecutor';

/**
 * El esqueleto común (`plataforma/ejecutor.ts`) para la familia HIA (DL-175), transversal a los tres Alcances como el de
 * los resúmenes: la lectura del profesional decide con el PDP del área que pide. El Alcance fijo solo alimenta el
 * `noRevelable()` por defecto cuando el recurso no existe y no hay ninguno que reportar.
 */
@Injectable()
export class EjecutorDeHistoriaAnterior extends EjecutorDeDominio {
  constructor(prisma: PrismaService, idempotencia: IdempotenciaService, auditoria: AuditoriaService, pdp: PdpService) {
    super('NUTRICION', prisma, idempotencia, auditoria, pdp);
  }
}
