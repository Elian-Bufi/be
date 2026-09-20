import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecutorAntropometrico, esUuid } from './ejecutor';
import { exigirCapacidadAntropometrica } from './capacidad';
import { leerEspecificacionDeMetodo, metodoApi } from './lectura-calculo';

/**
 * API-MTH-01 y API-MTH-02 — los métodos profesionales y sus versiones (09v16 §21.1 y §21.2).
 *
 * Son **metadatos**: no aceptan `adviseeId`, no usan datos personales para decidir qué listar y no implican
 * compatibilidad con los datos de ninguna persona (09 §21.1). Por eso la autorización acá es la capacidad
 * antropométrica, no el PDP sobre un titular: no hay titular.
 *
 * La lista devuelve **solo las versiones seleccionables**, que son las terminales de cada cadena. Una versión
 * histórica se puede consultar de a una con MTH-02 —las corridas la citan y tienen que poder explicarse— pero no se
 * presenta como seleccionable (REG-06-203). Ninguna versión se elimina.
 */
@Injectable()
export class MetodosService {
  constructor(private readonly ejecutor: EjecutorAntropometrico) {}

  // ─── API-MTH-01 · listar los métodos seleccionables ────────────────────────────────────────
  listar(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<unknown> {
    const consulta = leerConsultaDeLista(query, { purpose: ['ANTHROPOMETRIC_SUPPORT', 'NUTRITION_OBJECTIVE_SUPPORT'] });
    return this.ejecutor.leer({
      operacion: 'API-MTH-01',
      casoDeUso: 'UC-I09',
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx: Prisma.TransactionClient) => {
        await exigirCapacidadAntropometrica(tx, actor.identidadId);
        const filas = await tx.versionDeEspecificacionAntropometrica.findMany({
          where: { sucesora: null, especificacion: { tipo: 'METODO' }, ...despuesDelCursor(consulta.cursor) },
          include: { especificacion: true, sucesora: { select: { id: true } } },
          orderBy: ORDEN_DE_LISTA,
          take: consulta.limit + 1,
        });
        const { pagina, page } = paginar(filas, consulta.limit);
        const metodos = pagina.flatMap((v) => {
          const especificacion = leerEspecificacionDeMetodo(v.contenido);
          // Una especificación que no cumple la forma declarada no se publica como seleccionable: sería ofrecer
          // algo que no se puede ejecutar.
          if (!especificacion) return [];
          if (consulta.filtros.purpose && !metodoApi(v, especificacion).purposes.includes(consulta.filtros.purpose as 'ANTHROPOMETRIC_SUPPORT')) return [];
          return [metodoApi(v, especificacion)];
        });
        return { data: metodos, page };
      },
    });
  }

  // ─── API-MTH-02 · consultar la versión exacta ──────────────────────────────────────────────
  /**
   * Devuelve la versión pedida, sea seleccionable o histórica: una corrida que la cita tiene que poder explicarse.
   * No devuelve datos de ningún asesorado (09 §21.2).
   */
  consultar(actor: ActorAutenticado, methodId: string, versionId: string, ctx: ContextoDeSolicitud): Promise<unknown> {
    return this.ejecutor.leer({
      operacion: 'API-MTH-02',
      casoDeUso: 'UC-I09',
      actor,
      ctx,
      recursoIntentado: { tipo: 'VersionDeMetodo', id: versionId },
      lectura: async (tx: Prisma.TransactionClient) => {
        await exigirCapacidadAntropometrica(tx, actor.identidadId);
        const v =
          esUuid(methodId) && esUuid(versionId)
            ? await tx.versionDeEspecificacionAntropometrica.findFirst({
                where: { id: versionId, especificacionId: methodId, especificacion: { tipo: 'METODO' } },
                include: { especificacion: true, sucesora: { select: { id: true } } },
              })
            : null;
        const especificacion = v ? leerEspecificacionDeMetodo(v.contenido) : null;
        if (!v || !especificacion) throw errores.recursoNoEncontrado();
        return { data: metodoApi(v, especificacion) };
      },
    });
  }
}
