import { Injectable } from '@nestjs/common';
import { VERSION_VIGENTE, type RequisitoDeConsentimientoDeSaludResponse } from '@be/domain';
import { errores } from '../http/errores';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';

/**
 * API-CON-05 (09:2379-2433) — requisito A3 del titular. La fuente de verdad es el acto DATOS_SALUD_BE en la base:
 * sin acto, `currentConsent: null` («el concepto existe y no tiene valor», 09v7 T11) = A3 NO otorgado (TEST-AUTH-002).
 * No devuelve datos de salud. Auditoría BEST_EFFORT_TECHNICAL (log técnico).
 */
@Injectable()
export class ConsentimientoService {
  constructor(private readonly prisma: PrismaService) {}

  async requisito(actor: ActorAutenticado): Promise<RequisitoDeConsentimientoDeSaludResponse> {
    const version = await this.prisma.versionDeTexto.findUnique({ where: { id: VERSION_VIGENTE.DATOS_SALUD_BE.id } });
    if (!version) throw errores.interno();
    const acto = await this.prisma.actoRegistrable.findFirst({
      where: { identidadId: actor.identidadId, tipo: 'DATOS_SALUD_BE' },
      orderBy: { momentoDeRegistro: 'desc' },
    });
    return {
      data: {
        type: 'HEALTH_DATA_BE',
        consentVersion: {
          id: version.id,
          text: version.texto,
          textHash: version.hash,
          effectiveFrom: version.vigenteDesde.toISOString(),
        },
        purpose: 'HEALTH_DATA_PROCESSING_AND_LONGITUDINAL_HISTORY',
        currentConsent: acto
          ? {
              consentId: acto.id,
              state: acto.estado === 'VIGENTE' ? 'ACTIVE' : 'REVOKED',
              consentVersionId: acto.versionDeTextoId,
              acceptedAt: acto.momentoDeOcurrencia.toISOString(),
              revokedAt: acto.momentoDeRevocacion?.toISOString() ?? null,
            }
          : null,
      },
    };
  }
}
