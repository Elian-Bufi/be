import { Injectable } from '@nestjs/common';
import { PdpService } from '../autorizacion/pdp.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { EjecutorDeDominio } from '../plataforma/ejecutor';
import { IdempotenciaService } from '../plataforma/idempotencia.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * El esqueleto común (idempotencia, transacción, PDP y auditoría) para la familia MED (DL-120). Dos finalidades de un
 * medio son de Nutrición (la imagen de una receta y la foto de una comida), y ese es el Alcance fijo. La tercera, la imagen
 * de un ejercicio (DL-123), es de Entrenamiento: el servicio ramifica el Alcance según la finalidad, en la decisión del PDP
 * y en cada denegación que audita (`noRevelable` con su `alcance`).
 */
@Injectable()
export class EjecutorDeMedios extends EjecutorDeDominio {
  constructor(prisma: PrismaService, idempotencia: IdempotenciaService, auditoria: AuditoriaService, pdp: PdpService) {
    super('NUTRICION', prisma, idempotencia, auditoria, pdp);
  }
}
