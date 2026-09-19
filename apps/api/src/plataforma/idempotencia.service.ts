import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { errores } from '../http/errores';
import { conReintento } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';

export interface ResultadoIdempotente {
  readonly estadoHttp: number;
  readonly cuerpo: Prisma.InputJsonValue;
}

/** Ámbito de las operaciones PUBLIC (DEUDA_LEGAJO DL-026). */
export const AMBITO_PUBLICO = 'PUBLICO';

/**
 * Idempotency-Key (09v7 T07):
 * - primera request: ejecutar → persistir resultado lógico, en la misma transacción que los efectos;
 * - replay con misma key + mismo ámbito + misma huella → mismo resultado, sin repetir efectos;
 * - misma key con otra huella → 409 IDEMPOTENCY_KEY_REUSED.
 * Requests concurrentes con la misma key se serializan con un advisory lock transaccional: la segunda espera a
 * que la primera confirme y hace replay (DL-026). Solo se guardan resultados exitosos: un error no se «congela».
 * «La key no sustituye: unique constraint; transacción» (09v7): la unicidad de negocio sigue en la base.
 * Un deadlock o una falla de serialización revierten la transacción entera: se repite (conReintento) y, si persiste,
 * sale como 409 de conflicto concurrente.
 */
@Injectable()
export class IdempotenciaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Huella del request lógico. Quien llama debe excluir la credencial (nunca se guarda nada derivado de ella). */
  static huella(solicitudSinSecretos: unknown): string {
    return createHash('sha256').update(JSON.stringify(ordenar(solicitudSinSecretos))).digest('hex');
  }

  static claveValida(clave: string | undefined): clave is string {
    return typeof clave === 'string' && /^[A-Za-z0-9._:-]{8,128}$/.test(clave);
  }

  async ejecutar(
    params: { operacion: string; ambito: string; clave: string; huella: string },
    efecto: (tx: Prisma.TransactionClient) => Promise<ResultadoIdempotente>,
  ): Promise<ResultadoIdempotente> {
    return conReintento(() => this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${params.operacion}|${params.ambito}|${params.clave}`}, 0))`;
      const previo = await tx.registroDeIdempotencia.findUnique({
        where: { operacion_ambito_clave: { operacion: params.operacion, ambito: params.ambito, clave: params.clave } },
      });
      if (previo) {
        if (previo.huella !== params.huella) throw errores.claveDeIdempotenciaReutilizada();
        return { estadoHttp: previo.estadoHttp, cuerpo: previo.cuerpo as Prisma.InputJsonValue };
      }
      const resultado = await efecto(tx);
      await tx.registroDeIdempotencia.create({
        data: { ...params, estadoHttp: resultado.estadoHttp, cuerpo: resultado.cuerpo },
      });
      return resultado;
    }));
  }
}

function ordenar(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ordenar);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.keys(valor as Record<string, unknown>)
        .sort()
        .map((k) => [k, ordenar((valor as Record<string, unknown>)[k])]),
    );
  }
  return valor;
}
