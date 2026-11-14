import { Injectable } from '@nestjs/common';
import {
  AgregarNotaDeLaSesionRequestSchema,
  CodigoDeError,
  DIAS_MAXIMOS_DE_LAS_NOTAS_DE_LAS_SESIONES,
  MAXIMO_DE_NOTAS_POR_SESION,
  type NotaDeLaSesion,
  type NotasDeLasSesionesResponse,
  type NotasDeUnaSesionResponse,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { sinParametrosDeQuery } from '../http/validacion';
import { ZONA_POR_DEFECTO } from '../nutricion/zona';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecucionesDeEntrenamientoService } from './ejecuciones.service';
import { EjecutorDeEntrenamiento, esUuid, exigirA3Vigente } from './ejecutor';

const CASO_DE_USO = 'PG-15';
const RECURSO = 'NotaDeEjecucion';
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const fechaDe = (d: Date): string => d.toISOString().slice(0, 10);
const comoFecha = (f: string): Date => new Date(`${f}T00:00:00.000Z`);

/** Una nota como la guarda BE: lo escrito y cuándo. Ni la condición de la sesión ni su motivo (REG-06-131). */
function notaApi(n: { readonly id: string; readonly ejecucionId: string; readonly texto: string; readonly momentoDeRegistro: Date }): NotaDeLaSesion {
  return { noteId: n.id, executionId: n.ejecucionId, text: n.texto, recordedAt: n.momentoDeRegistro.toISOString() };
}

/**
 * WP-PULIDO-GRANDES PG-15 (DL-173; PG-D10, aprobada por Dirección el 2026-11-14) · La nota para tu profe al finalizar:
 * API-TRN-25 y sus dos lecturas. Operaciones nuevas (DL-137 D-7): confirmar (API-TRN-18) no cambia, y la nota viaja
 * después, aparte: si falla, la sesión ya quedó registrada.
 * - **La escribe la persona de la sesión**, con el permiso con que corrige su registro (API-TRN-20, `OPERACION`): el PDP
 *   del par con su profesional. El profesional del plan la lee, pero no escribe por ella: el mismo 404 que lo ajeno.
 * - **Solo se agrega** (la base lo sostiene con un trigger): no se edita ni se borra; una nueva queda debajo, con su hora.
 *   Hasta `MAXIMO_DE_NOTAS_POR_SESION` por sesión (PG-T61), contadas con la ejecución tomada, así dos pedidos a la vez no
 *   pasan el tope.
 * - **El profesional de Entrenamiento la lee** (API-TRN-25-LISTA) en las sesiones que ya ve: las de sus planes con esa
 *   persona, como API-TRN-19 y API-TRN-21, con el PDP de Entrenamiento. Otra área: el 404 de lo inexistente.
 * - **La persona lee las suyas** (API-TRN-25-PROPIA) con su A3 vigente, como «Tu historial» (DL-089 opción A).
 * - No dispara avisos ni novedades, y no cambia la ejecución: BE no interpreta lo que dice la nota.
 */
@Injectable()
export class NotasDeLaSesionService {
  constructor(
    private readonly ejecutor: EjecutorDeEntrenamiento,
    private readonly ejecuciones: EjecucionesDeEntrenamientoService,
    private readonly pdp: PdpService,
  ) {}

  // ─── API-TRN-25 ────────────────────────────────────────────────────────────────────────────
  agregar(actor: ActorAutenticado, executionId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'EjecucionDeEntrenamiento', id: executionId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-TRN-25',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: AgregarNotaDeLaSesionRequestSchema,
      cuerpo,
      huellaExtra: { executionId },
      efecto: async (tx, pedido, procedencia) => {
        // El PDP del par con su profesional, como corregir (lo ajeno y lo inexistente, el mismo 404).
        const x = await this.ejecuciones.ejecucionRevelable(tx, 'API-TRN-25', actor, executionId, ctx);
        // El profesional del plan pasa por ahí (ve la sesión), pero la nota es de la persona.
        if (x.asesoradoId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-TRN-25', actorId: actor.identidadId, recurso, sujetoId: x.asesoradoId }, ctx);
        // Las notas de una sesión, de a una: la ejecución tomada (sin modificarla), como en sus correcciones.
        await tx.$queryRaw`SELECT 1 FROM "ejecucion_de_entrenamiento" WHERE "id" = ${x.id}::uuid FOR NO KEY UPDATE`;
        if ((await tx.notaDeEjecucion.count({ where: { ejecucionId: x.id } })) >= MAXIMO_DE_NOTAS_POR_SESION) {
          throw new ErrorDeApi(422, CodigoDeError.VALIDATION_FAILED, 'Esta sesión ya tiene todas las notas que admite.', { issues: [{ code: 'NOTE_LIMIT_REACHED', path: 'text' }] });
        }
        const nota = await tx.notaDeEjecucion.create({
          data: { ejecucionId: x.id, asesoradoId: actor.identidadId, texto: pedido.text, procedencia: procedencia as unknown as Prisma.InputJsonValue },
        });
        return { estadoHttp: 201, cuerpo: { data: notaApi(nota) }, sujetoId: actor.identidadId, recurso: { tipo: RECURSO, id: nota.id } };
      },
    });
  }

  // ─── API-TRN-25-PROPIA ─────────────────────────────────────────────────────────────────────
  /** Lo ajeno y lo inexistente, el mismo 404; sobre lo propio, el A3 primero (como «Tu historial», DL-089). */
  propias(actor: ActorAutenticado, executionId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<NotasDeUnaSesionResponse> {
    sinParametrosDeQuery(query);
    const recurso = { tipo: 'EjecucionDeEntrenamiento', id: executionId };
    return this.ejecutor.leer({
      operacion: 'API-TRN-25-PROPIA',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const x = esUuid(executionId) ? await tx.ejecucionDeEntrenamiento.findUnique({ where: { id: executionId.toLowerCase() }, select: { id: true, asesoradoId: true } }) : null;
        if (!x || x.asesoradoId !== actor.identidadId) {
          throw this.ejecutor.noRevelable({ operacion: 'API-TRN-25-PROPIA', actorId: actor.identidadId, recurso, sujetoId: x?.asesoradoId ?? null }, ctx);
        }
        await exigirA3Vigente(tx, actor.identidadId);
        const filas = await tx.notaDeEjecucion.findMany({ where: { ejecucionId: x.id }, orderBy: [{ momentoDeRegistro: 'asc' }, { id: 'asc' }] });
        return { data: filas.map(notaApi) };
      },
    });
  }

  // ─── API-TRN-25-LISTA ──────────────────────────────────────────────────────────────────────
  /**
   * Las notas de las sesiones del período que el profesional ve: registradas en sus planes con esa persona (API-TRN-21
   * lee las mismas). El período es obligatorio y llega hasta `DIAS_MAXIMOS_DE_LAS_NOTAS_DE_LAS_SESIONES` días.
   */
  delProfesional(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<NotasDeLasSesionesResponse> {
    const { periodStart, periodEnd, ...resto } = query;
    sinParametrosDeQuery(resto);
    if (typeof periodStart !== 'string' || !FECHA.test(periodStart) || typeof periodEnd !== 'string' || !FECHA.test(periodEnd)) {
      throw errores.solicitudInvalida([{ code: 'PERIOD_REQUIRED', path: 'periodStart' }]);
    }
    const dias = (comoFecha(periodEnd).getTime() - comoFecha(periodStart).getTime()) / 86_400_000;
    if (Number.isNaN(dias) || dias < 0 || dias >= DIAS_MAXIMOS_DE_LAS_NOTAS_DE_LAS_SESIONES) throw errores.solicitudInvalida([{ code: 'PERIOD_INVALID', path: 'periodEnd' }]);
    return this.ejecutor.leer({
      operacion: 'API-TRN-25-LISTA',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        const d = await this.pdp.decidirEnTransaccion(
          tx,
          { operacion: 'API-TRN-25-LISTA', actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: adviseeId, alcance: 'ENTRENAMIENTO', recurso: null },
          ctx,
        );
        const asesoradoId = d.hechos.titular?.identidadId as string;
        const filas = await tx.notaDeEjecucion.findMany({
          where: {
            asesoradoId,
            ejecucion: { asesoradoId, versionDePlan: { plan: { profesionalId: actor.identidadId } }, fechaLocal: { gte: comoFecha(periodStart), lte: comoFecha(periodEnd) } },
          },
          include: { ejecucion: { select: { fechaLocal: true } } },
          orderBy: [{ ejecucion: { fechaLocal: 'desc' } }, { ejecucionId: 'desc' }, { momentoDeRegistro: 'asc' }, { id: 'asc' }],
        });
        return {
          data: {
            period: { start: periodStart, end: periodEnd, timeZone: ZONA_POR_DEFECTO },
            notes: filas.map((n) => ({ ...notaApi(n), executionDate: fechaDe(n.ejecucion.fechaLocal) })),
          },
        };
      },
    });
  }
}
