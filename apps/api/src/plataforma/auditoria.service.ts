import { Injectable } from '@nestjs/common';
import type { Prisma, ResultadoDeOperacion, Superficie } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface EntradaDeAuditoria {
  readonly operacion: string;
  readonly resultado: ResultadoDeOperacion;
  /** Código interno del resultado. Nunca se expone al cliente (09v7 T16). */
  readonly motivo?: string | null;
  readonly actorId?: string | null;
  readonly sujetoId?: string | null;
  readonly recursoTipo?: string | null;
  readonly recursoId?: string | null;
  readonly superficie?: Superficie | null;
  readonly requestId?: string | null;
  readonly momentoDeOcurrencia?: Date | null;
}

/**
 * Auditoría probatoria (08 §29): en la base, append-only (trigger), separada de los logs técnicos.
 * No guarda IP, user-agent ni identificadores en claro (08:658). Las operaciones REQUIRED_SAME_TX pasan su `tx`:
 * si la auditoría falla, la operación no se confirma (09v7 T18: «no audit → no success»).
 */
@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(entrada: EntradaDeAuditoria, tx?: Prisma.TransactionClient): Promise<void> {
    await (tx ?? this.prisma).registroDeAuditoria.create({
      data: {
        operacion: entrada.operacion,
        resultado: entrada.resultado,
        motivo: entrada.motivo ?? null,
        actorId: entrada.actorId ?? null,
        sujetoId: entrada.sujetoId ?? null,
        recursoTipo: entrada.recursoTipo ?? null,
        recursoId: entrada.recursoId ?? null,
        superficie: entrada.superficie ?? null,
        requestId: entrada.requestId ?? null,
        momentoDeOcurrencia: entrada.momentoDeOcurrencia ?? null,
      },
    });
  }
}
