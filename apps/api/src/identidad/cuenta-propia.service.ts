import { Injectable } from '@nestjs/common';
import { RegistrationIntentSchema, type MeResponse } from '@be/domain';
import { errores } from '../http/errores';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';

/**
 * API-ACC-05 — identidad y sesión propias (09v8:461-505). Auditoría BEST_EFFORT_TECHNICAL: la línea de log técnico
 * de `request-id.ts` (09v7 T18). Nunca devuelve hash, tokens ni campo A3 (A3 vive en CON-05).
 */
@Injectable()
export class CuentaPropiaService {
  constructor(private readonly prisma: PrismaService) {}

  async consultar(actor: ActorAutenticado): Promise<MeResponse> {
    const identidad = await this.prisma.identidad.findUnique({
      where: { id: actor.identidadId },
      select: { id: true, estadoOperativoDeCuenta: true },
    });
    if (!identidad) throw errores.sesionInvalida();
    // `registrationIntent` vive en el hecho IdentidadCreada, no en Identidad (DL-021).
    const alta = await this.prisma.eventoDeDominio.findFirst({
      where: { identidadId: actor.identidadId, tipo: 'IdentidadCreada' },
      select: { datos: true },
    });
    const intencion = RegistrationIntentSchema.parse((alta?.datos as { registrationIntent?: unknown } | null)?.registrationIntent);

    return {
      data: {
        identityId: identidad.id,
        accountOperationalState: identidad.estadoOperativoDeCuenta,
        registrationIntent: intencion,
        profile: {},
        actorCapabilities: [],
        session: { id: actor.sesionId, expiresAt: actor.expiraEn.toISOString() },
      },
    };
  }
}
