import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import { errores } from '../http/errores';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { EjecutorDeDominio } from '../plataforma/ejecutor';
import { IdempotenciaService } from '../plataforma/idempotencia.service';
import { PrismaService } from '../prisma/prisma.service';

export { esUuid, type Recurso, type ResultadoDeEfecto } from '../plataforma/ejecutor';

/**
 * La historia ya registrada del titular —su ejecución (API-TRN-19) y su plan tal como lo aceptó (API-TRN-09 sobre una
 * versión ACTIVADA)— exige solo su A3 vigente, no el PDP sobre su profesional: el fin del vínculo corta al profesional
 * «sin destruir la historia del asesorado» (08:58) y el titular tiene acceso pleno a «Plan entrenamiento + ejecución»
 * (08:199). Revocado el A3, se suspende toda operación sensible del titular (08:406). Es el mismo criterio de
 * `nutricion/ingestas.service.ts:listarPropias`. DL-089 opción A.
 */
export async function exigirA3Vigente(tx: Prisma.TransactionClient, identidadId: string): Promise<void> {
  const [a3] = await tx.$queryRaw<{ vigente: boolean }[]>`
    SELECT EXISTS (SELECT 1 FROM "acto_registrable" WHERE "identidad_id" = ${identidadId}::uuid AND "tipo" = 'DATOS_SALUD_BE' AND "estado" = 'VIGENTE') AS "vigente"`;
  if (!a3?.vigente) throw errores.accionNoPermitida();
}

/**
 * El esqueleto común de las operaciones TRN (WP-06), con el Alcance de la vertical. Es el mismo `EjecutorDeDominio`
 * que usan nutrición y antropometría: «no se crea una API paralela conceptual para versionado, activación, revisión,
 * continuidad, concurrencia, idempotencia» (CAND-09-TRN-A, 09v10:111-122). Lo único propio es el Alcance.
 */
@Injectable()
export class EjecutorDeEntrenamiento extends EjecutorDeDominio {
  constructor(prisma: PrismaService, idempotencia: IdempotenciaService, auditoria: AuditoriaService, pdp: PdpService) {
    super('ENTRENAMIENTO', prisma, idempotencia, auditoria, pdp);
  }
}
