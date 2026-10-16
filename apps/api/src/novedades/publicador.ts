import { Injectable } from '@nestjs/common';
import type { Alcance, Procedencia } from '@be/domain';
import type { Prisma, TipoDeNovedad } from '@prisma/client';
import { DespachadorDeAvisos } from './despachador';

type Tx = Prisma.TransactionClient;

/** Un hecho que una persona tiene que ver en su centro de novedades. */
export interface HechoParaNovedad {
  readonly tipo: TipoDeNovedad;
  readonly destinatarioId: string;
  readonly alcance: Alcance;
  /** Quién lo hizo. `null` solo en un recordatorio, que lo emite BE (la base lo exige). */
  readonly fuenteId: string | null;
  /** El recurso del hecho, para la pantalla que lo resuelve. */
  readonly referencia: { readonly tipo: string; readonly id: string } | null;
  /** El día de un recordatorio (`AAAA-MM-DD`). */
  readonly fechaLocal?: string | null;
  /**
   * Lo que identifica al hecho (el id de la versión activada, de la revisión, de la transición…). Con el tipo y el
   * destinatario forma la clave única: un reintento del mismo hecho no da dos novedades.
   */
  readonly identidadDelHecho: string;
  readonly momentoDeOcurrencia: Date | null;
}

export const claveDeUnicidad = (h: Pick<HechoParaNovedad, 'tipo' | 'destinatarioId' | 'identidadDelHecho'>): string =>
  `${h.tipo}|${h.destinatarioId.toLowerCase()}|${h.identidadDelHecho.toLowerCase()}`.slice(0, 200);

/**
 * El que publica las novedades (RF-061; 06 §5.11). Lo usan los servicios de dominio **dentro de la transacción del
 * hecho**: si el hecho no se confirma, tampoco su novedad, y la novedad es la fuente de verdad (07 §24). El aviso push no
 * sale de acá: el despachador lo manda después de confirmar, lo mejor posible (07 §23), y si falla la novedad queda.
 */
@Injectable()
export class PublicadorDeNovedades {
  constructor(private readonly despachador: DespachadorDeAvisos) {}

  async publicar(tx: Tx, hechos: readonly HechoParaNovedad[], procedencia: Procedencia): Promise<number> {
    // Nadie recibe una novedad de algo que hizo él mismo.
    const validos = hechos.filter((h) => h.fuenteId === null || h.fuenteId.toLowerCase() !== h.destinatarioId.toLowerCase());
    if (validos.length === 0) return 0;
    const r = await tx.novedad.createMany({
      data: validos.map((h) => ({
        destinatarioId: h.destinatarioId,
        tipo: h.tipo,
        alcance: h.alcance,
        fuenteId: h.fuenteId,
        referenciaTipo: h.referencia?.tipo ?? null,
        referenciaId: h.referencia?.id ?? null,
        fechaLocal: h.fechaLocal ? new Date(`${h.fechaLocal}T00:00:00.000Z`) : null,
        claveDeUnicidad: claveDeUnicidad(h),
        procedencia: procedencia as unknown as Prisma.InputJsonValue,
        momentoDeOcurrencia: h.momentoDeOcurrencia,
      })),
      // El mismo hecho (un reintento, una corrida repetida) no da otra novedad.
      skipDuplicates: true,
    });
    // Después de confirmar: el despachador mira dentro de unos segundos, fuera de esta transacción.
    if (r.count > 0) this.despachador.programar();
    return r.count;
  }
}
