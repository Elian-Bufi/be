import { Injectable } from '@nestjs/common';
import { esRecorridoGuiado, MarcarRecorridoRequestSchema, type EstadoDelRecorrido, type RecorridosVistosResponse, type RecorridoVisto, type RecorridoVistoResponse } from '@be/domain';
import type { EstadoDelRecorridoGuiado, Prisma, RecorridoGuiadoVisto } from '@prisma/client';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { conReintento } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';

type Tx = Prisma.TransactionClient;

/** RGU no tiene un caso de uso del 05: la procedencia nombra la parte del paquete (WP-RECORRIDOS-GUIADOS, DL-195). */
const CASO_DE_USO = 'GUI-06';

const EN_LA_BASE: Readonly<Record<EstadoDelRecorrido, EstadoDelRecorridoGuiado>> = { SEEN: 'VISTO', SKIPPED: 'OMITIDO' };
const EN_LA_API: Readonly<Record<EstadoDelRecorridoGuiado, EstadoDelRecorrido>> = { VISTO: 'SEEN', OMITIDO: 'SKIPPED' };

/** Una fila como la lee la API. Una fila con un recorrido que @be/domain ya no tiene no se devuelve (`null`). */
export function recorridoApi(f: Pick<RecorridoGuiadoVisto, 'recorrido' | 'estado' | 'momentoDeActualizacion'>): RecorridoVisto | null {
  if (!esRecorridoGuiado(f.recorrido)) return null;
  return { tourId: f.recorrido, state: EN_LA_API[f.estado], updatedAt: f.momentoDeActualizacion.toISOString() };
}

/**
 * API-RGU-01 y 02 (WP-RECORRIDOS-GUIADOS, DL-195): los recorridos guiados que vio u omitió el usuario de la sesión.
 * - **Solo lo propio.** La ruta no tiene titular: se lee y se escribe siempre con la identidad de la sesión, así nadie ve
 *   ni marca lo de otro (GUI-07). No son datos de salud ni de una persona acompañada: no decide el PDP, como las
 *   preferencias de los avisos (API-NOV-05 y 06).
 * - **Idempotente por semántica:** marcar con el mismo estado no escribe nada; con el otro, lo reemplaza.
 * - Cada cambio queda en la auditoría de la misma transacción.
 */
@Injectable()
export class RecorridosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  // ─── API-RGU-01 ──────────────────────────────────────────────────────────────────────────────
  async listar(actor: ActorAutenticado): Promise<RecorridosVistosResponse> {
    const filas = await this.prisma.recorridoGuiadoVisto.findMany({ where: { identidadId: actor.identidadId }, orderBy: { recorrido: 'asc' } });
    return { data: filas.map(recorridoApi).filter((x): x is RecorridoVisto => x !== null) };
  }

  // ─── API-RGU-02 ──────────────────────────────────────────────────────────────────────────────
  async marcar(actor: ActorAutenticado, tourId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<RecorridoVistoResponse> {
    // Un recorrido que no existe es 404, como un recurso que no está; antes que el cuerpo, para no validar de más.
    if (!esRecorridoGuiado(tourId)) throw errores.recursoNoEncontrado();
    const pedido = validarCuerpo(MarcarRecorridoRequestSchema, cuerpo);
    const estado = EN_LA_BASE[pedido.state];
    const procedencia = procedenciaDe(ctx, CASO_DE_USO, 'API-RGU-02') as unknown as Prisma.InputJsonValue;
    const clave = { identidadId_recorrido: { identidadId: actor.identidadId, recorrido: tourId } };
    return conReintento(() =>
      this.prisma.$transaction(async (tx) => {
        const actual = await tx.recorridoGuiadoVisto.findUnique({ where: clave });
        if (actual?.estado === estado) return { data: recorridoApi(actual)! };
        const fila = await tx.recorridoGuiadoVisto.upsert({
          where: clave,
          create: { identidadId: actor.identidadId, recorrido: tourId, estado, procedencia },
          update: { estado, procedencia, momentoDeActualizacion: new Date() },
        });
        await this.auditar(tx, actor, ctx, tourId);
        return { data: recorridoApi(fila)! };
      }),
    );
  }

  private auditar(tx: Tx, actor: ActorAutenticado, ctx: ContextoDeSolicitud, tourId: string): Promise<void> {
    return this.auditoria.registrar(
      {
        operacion: 'API-RGU-02',
        resultado: 'EXITO',
        actorId: actor.identidadId,
        sujetoId: actor.identidadId,
        recursoTipo: 'RecorridoGuiadoVisto',
        recursoId: tourId,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      },
      tx,
    );
  }
}
