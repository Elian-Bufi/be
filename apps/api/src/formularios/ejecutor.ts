import { Injectable } from '@nestjs/common';
import { PdpService } from '../autorizacion/pdp.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { EjecutorDeDominio } from '../plataforma/ejecutor';
import { IdempotenciaService } from '../plataforma/idempotencia.service';
import { PrismaService } from '../prisma/prisma.service';

export { esUuid, type Recurso, type ResultadoDeEfecto } from '../plataforma/ejecutor';

/**
 * El mismo esqueleto que el resto de los dominios (`plataforma/ejecutor.ts`), pero FRM es transversal a los tres
 * Alcances (WP-07.md §5): `scope` lo declara cada Solicitud, no la vertical. `decidirEnTransaccion` ya toma el
 * Alcance por llamada, así que cada operación pasa el real. El Alcance fijo de acá solo alimenta el `noRevelable()`
 * por defecto cuando el recurso no existe y no hay ninguno que reportar (mismo tratamiento que CAL-03 en
 * antropometria/calculos.service.ts); cuando el recurso existe pero es ajeno, se pasa el Alcance real de la fila.
 */
@Injectable()
export class EjecutorDeFormularios extends EjecutorDeDominio {
  constructor(prisma: PrismaService, idempotencia: IdempotenciaService, auditoria: AuditoriaService, pdp: PdpService) {
    super('ENTRENAMIENTO', prisma, idempotencia, auditoria, pdp);
  }
}
