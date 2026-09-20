import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { exigirCapacidadAntropometrica } from './capacidad';
import { EjecutorAntropometrico } from './ejecutor';
import { especificacionApi } from './lectura-antropometria';

/**
 * API-ANT-01 — el catálogo de especificaciones: protocolos y métodos admitidos, con su versión. Permite que el
 * website y el APK no tengan contenido técnico hardcodeado (09v11:336).
 *
 * Solo se publican las versiones **vigentes** de cada especificación: la terminal de su cadena. Publicar una versión
 * nueva no modifica evaluaciones anteriores (09v11:336) ni reescribe cálculos históricos (INV-06-172).
 *
 * El contenido es sintético y está rotulado: el legajo prohíbe fijar un catálogo científico desde este bloque, que
 * «define la estructura para representarlas y reconstruirlas, no selecciona una como universal» (REG-06-157).
 */
@Injectable()
export class EspecificacionesService {
  constructor(private readonly ejecutor: EjecutorAntropometrico) {}

  listar(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<unknown> {
    const consulta = leerConsultaDeLista(query, { kind: ['PROTOCOL', 'METHOD'] });
    return this.ejecutor.leer({
      operacion: 'API-ANT-01',
      casoDeUso: 'UC-P19',
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx: Prisma.TransactionClient) => {
        // El catálogo es de la capacidad: solo lo ve quien la tiene verificada y habilitada (WP-05 §0 D-C).
        await exigirCapacidadAntropometrica(tx, actor.identidadId);
        const filas = await tx.versionDeEspecificacionAntropometrica.findMany({
          where: {
            sucesora: null,
            ...(consulta.filtros.kind ? { especificacion: { tipo: consulta.filtros.kind === 'METHOD' ? 'METODO' : 'PROTOCOLO' } } : {}),
            ...despuesDelCursor(consulta.cursor),
          },
          include: { especificacion: true },
          orderBy: ORDEN_DE_LISTA,
          take: consulta.limit + 1,
        });
        const { pagina, page } = paginar(filas, consulta.limit);
        return { data: pagina.map(especificacionApi), page };
      },
    });
  }

}
