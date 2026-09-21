import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  CrearEvaluacionDeEntrenamientoRequestSchema,
  CrearObjetivoDeEntrenamientoRequestSchema,
  resolverVersionTerminal,
  type CrearObjetivoDeEntrenamientoRequest,
  type EvaluacionDeEntrenamiento,
  type Procedencia,
  type VersionDeObjetivoDeEntrenamiento,
} from '@be/domain';
import type { Prisma, VersionDeObjetivoDeEntrenamiento as FilaDeVersionDeObjetivo } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecutorDeEntrenamiento, esUuid } from './ejecutor';
import { registrarEventoDeEntrenamiento } from './eventos';
import { evaluacionApi, nombreVisibleDe, versionDeObjetivoApi } from './lectura-entrenamiento';

type Tx = Prisma.TransactionClient;

/** Margen para relojes de cliente adelantados: una ocurrencia más allá de esto es futura y no se admite. */
const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000;

/**
 * UC-P14 — Evaluación y objetivo de entrenamiento (API-TRN-01 a 06; RF-036, RF-064). Es el mismo patrón que
 * nutrición, porque el 06 lo reutiliza sin renombrarlo (REG-06-97, 98; 06:4956-4965):
 * - la evaluación es un hecho, y una posterior no sobrescribe la anterior; evidencia ≠ ejecución (09v10:199);
 * - el objetivo es una decisión profesional versionada con fundamento; su contenido no lo fija el 09 (09v10:228);
 * - el efectivo es la terminal de la sucesión, **nunca por timestamp** (09v10:658; INV-06-107);
 * - cada profesional ve y usa solo lo propio (DL-057).
 */
@Injectable()
export class EvaluacionesDeEntrenamientoService {
  constructor(private readonly ejecutor: EjecutorDeEntrenamiento, private readonly pdp: PdpService) {}

  // ─── API-TRN-01 ────────────────────────────────────────────────────────────────────────────
  crearEvaluacion(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-TRN-01',
      casoDeUso: 'UC-P14',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      clave,
      esquema: CrearEvaluacionDeEntrenamientoRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        const asesoradoId = await this.decidir(tx, 'API-TRN-01', actor, adviseeId, { tipo: 'Asesorado', id: adviseeId }, ctx);
        const ocurrencia = new Date(pedido.occurredAt);
        if (ocurrencia.getTime() > (await momentoDeLaBase(tx)).getTime() + TOLERANCIA_FUTURO_MS) {
          throw new ErrorDeApi(422, CodigoDeError.TRAINING_EVALUATION_INVALID, 'La fecha de la evaluación no puede ser futura.', {
            issues: [{ code: 'OCCURRED_AT_IN_FUTURE', path: 'occurredAt' }],
          });
        }
        const e = await tx.evaluacionDeEntrenamiento.create({
          data: {
            profesionalId: actor.identidadId,
            asesoradoId,
            valoracion: pedido.assessment as Prisma.InputJsonValue,
            referencias: pedido.evidenceReferences,
            notas: pedido.professionalNotes,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeOcurrencia: ocurrencia,
          },
        });
        await registrarEventoDeEntrenamiento(tx, {
          tipo: 'EvaluacionDeEntrenamientoRegistrada',
          profesionalId: actor.identidadId,
          asesoradoId,
          recurso: { tipo: 'EvaluacionDeEntrenamiento', id: e.id },
          estadoPrevio: null,
          estadoPosterior: null,
          actorId: actor.identidadId,
          procedencia,
          momento: ocurrencia,
        });
        return {
          estadoHttp: 201,
          cuerpo: { data: { evaluationId: e.id, version: 'v1', occurredAt: e.momentoDeOcurrencia.toISOString(), recordedAt: e.momentoDeRegistro.toISOString() } },
          sujetoId: asesoradoId,
          recurso: { tipo: 'EvaluacionDeEntrenamiento', id: e.id },
        };
      },
    });
  }

  // ─── API-TRN-02 ────────────────────────────────────────────────────────────────────────────
  listarEvaluaciones(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: EvaluacionDeEntrenamiento[]; page: unknown }> {
    const consulta = leerConsultaDeLista(query, {});
    return this.ejecutor.leer({
      operacion: 'API-TRN-02',
      casoDeUso: 'UC-P14',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        const asesoradoId = await this.decidir(tx, 'API-TRN-02', actor, adviseeId, null, ctx);
        const filas = await tx.evaluacionDeEntrenamiento.findMany({
          where: { profesionalId: actor.identidadId, asesoradoId, ...despuesDelCursor(consulta.cursor) },
          orderBy: ORDEN_DE_LISTA,
          take: consulta.limit + 1,
        });
        const { pagina, page } = paginar(filas, consulta.limit);
        const nombre = await nombreVisibleDe(tx, actor.identidadId);
        return { data: pagina.map((e) => evaluacionApi(e, nombre)), page };
      },
    });
  }

  // ─── API-TRN-03 ────────────────────────────────────────────────────────────────────────────
  consultarEvaluacion(actor: ActorAutenticado, evaluationId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: EvaluacionDeEntrenamiento }> {
    sinParametrosDeQuery(query);
    const recurso = { tipo: 'EvaluacionDeEntrenamiento', id: evaluationId };
    return this.ejecutor.leer({
      operacion: 'API-TRN-03',
      casoDeUso: 'UC-P14',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const e = esUuid(evaluationId) ? await tx.evaluacionDeEntrenamiento.findUnique({ where: { id: evaluationId } }) : null;
        if (!e) throw this.ejecutor.noRevelable({ operacion: 'API-TRN-03', actorId: actor.identidadId, recurso }, ctx);
        await this.decidir(tx, 'API-TRN-03', actor, e.asesoradoId, recurso, ctx);
        if (e.profesionalId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-TRN-03', actorId: actor.identidadId, recurso, sujetoId: e.asesoradoId }, ctx);
        return { data: evaluacionApi(e, await nombreVisibleDe(tx, actor.identidadId)) };
      },
    });
  }

  // ─── API-TRN-04 ────────────────────────────────────────────────────────────────────────────
  crearObjetivo(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-TRN-04',
      casoDeUso: 'UC-P14',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      clave,
      esquema: CrearObjetivoDeEntrenamientoRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        const asesoradoId = await this.decidir(tx, 'API-TRN-04', actor, adviseeId, { tipo: 'Asesorado', id: adviseeId }, ctx);
        const version = await this.emitirVersionDeObjetivo(tx, { profesionalId: actor.identidadId, asesoradoId, contenido: pedido, revisionDeOrigenId: null, procedencia });
        return {
          estadoHttp: 201,
          cuerpo: { data: versionDeObjetivoApi(version, { asesoradoId }, true, await nombreVisibleDe(tx, actor.identidadId)) },
          sujetoId: asesoradoId,
          recurso: { tipo: 'VersionDeObjetivoDeEntrenamiento', id: version.id },
        };
      },
    });
  }

  /**
   * Emite una versión sucesora de la efectiva (REG-06-98). La usan API-TRN-04 y la aplicación de una revisión
   * CHANGE_OBJECTIVE. El objetivo se bloquea para que dos emisiones concurrentes no bifurquen la cadena.
   */
  async emitirVersionDeObjetivo(
    tx: Tx,
    p: { profesionalId: string; asesoradoId: string; contenido: CrearObjetivoDeEntrenamientoRequest; revisionDeOrigenId: string | null; procedencia: Procedencia },
  ): Promise<FilaDeVersionDeObjetivo> {
    const evaluacion = esUuid(p.contenido.evaluationId)
      ? await tx.evaluacionDeEntrenamiento.findUnique({ where: { id: p.contenido.evaluationId }, select: { profesionalId: true, asesoradoId: true } })
      : null;
    // La evaluación de referencia es de este profesional y de este asesorado (UC-P14).
    if (!evaluacion || evaluacion.profesionalId !== p.profesionalId || evaluacion.asesoradoId !== p.asesoradoId) {
      throw new ErrorDeApi(422, CodigoDeError.EVALUATION_NOT_COMPATIBLE, 'La evaluación de referencia no corresponde a este asesorado.', {
        issues: [{ code: 'EVALUATION_NOT_COMPATIBLE', path: 'evaluationId' }],
      });
    }
    const objetivoId = await this.objetivoBloqueado(tx, p.profesionalId, p.asesoradoId);
    const versiones = await tx.versionDeObjetivoDeEntrenamiento.findMany({ where: { objetivoId }, select: { id: true, objetivoId: true, predecesoraId: true } });
    const terminal = resolverVersionTerminal(versiones.map((v) => ({ id: v.id, objetoId: v.objetivoId, predecesoraId: v.predecesoraId })));
    if (terminal.tipo === 'NO_RESOLUBLE') throw new ErrorDeApi(422, CodigoDeError.TRAINING_OBJECTIVE_INVALID, 'La historia del objetivo no se puede resolver.');
    const version = await tx.versionDeObjetivoDeEntrenamiento.create({
      data: {
        objetivoId,
        predecesoraId: terminal.tipo === 'TERMINAL' ? terminal.terminalId : null,
        evaluacionId: p.contenido.evaluationId,
        vigenteDesde: new Date(p.contenido.effectiveFrom),
        vigenteHasta: p.contenido.effectiveUntil ? new Date(p.contenido.effectiveUntil) : null,
        objetivo: p.contenido.objective as Prisma.InputJsonValue,
        fundamento: p.contenido.rationale,
        revisionDeOrigenId: p.revisionDeOrigenId,
        autorId: p.profesionalId,
        procedencia: p.procedencia as unknown as Prisma.InputJsonValue,
      },
    });
    await registrarEventoDeEntrenamiento(tx, {
      tipo: 'VersionDeObjetivoDeEntrenamientoEmitida',
      profesionalId: p.profesionalId,
      asesoradoId: p.asesoradoId,
      recurso: { tipo: 'VersionDeObjetivoDeEntrenamiento', id: version.id },
      estadoPrevio: null,
      estadoPosterior: null,
      actorId: p.profesionalId,
      procedencia: p.procedencia,
      momento: await momentoDeLaBase(tx),
    });
    return version;
  }

  // ─── API-TRN-05 ────────────────────────────────────────────────────────────────────────────
  listarObjetivos(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: VersionDeObjetivoDeEntrenamiento[]; page: unknown }> {
    const consulta = leerConsultaDeLista(query, {});
    return this.ejecutor.leer({
      operacion: 'API-TRN-05',
      casoDeUso: 'UC-P14',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        const asesoradoId = await this.decidir(tx, 'API-TRN-05', actor, adviseeId, null, ctx);
        const objetivo = await tx.objetivoDeEntrenamiento.findUnique({ where: { profesionalId_asesoradoId: { profesionalId: actor.identidadId, asesoradoId } } });
        if (!objetivo) return { data: [], page: { limit: consulta.limit, nextCursor: null, hasMore: false } };
        const efectiva = await this.efectivaDe(tx, objetivo.id);
        const filas = await tx.versionDeObjetivoDeEntrenamiento.findMany({
          where: { objetivoId: objetivo.id, ...despuesDelCursor(consulta.cursor) },
          orderBy: ORDEN_DE_LISTA,
          take: consulta.limit + 1,
        });
        const { pagina, page } = paginar(filas, consulta.limit);
        const nombre = await nombreVisibleDe(tx, actor.identidadId);
        return { data: pagina.map((v) => versionDeObjetivoApi(v, objetivo, v.id === efectiva?.id, nombre)), page };
      },
    });
  }

  // ─── API-TRN-06 ────────────────────────────────────────────────────────────────────────────
  objetivoEfectivo(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: { objective: VersionDeObjetivoDeEntrenamiento | null } }> {
    sinParametrosDeQuery(query);
    return this.ejecutor.leer({
      operacion: 'API-TRN-06',
      casoDeUso: 'UC-P14',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        const asesoradoId = await this.decidir(tx, 'API-TRN-06', actor, adviseeId, null, ctx);
        const objetivo = await tx.objetivoDeEntrenamiento.findUnique({ where: { profesionalId_asesoradoId: { profesionalId: actor.identidadId, asesoradoId } } });
        const efectiva = objetivo ? await this.efectivaDe(tx, objetivo.id) : null;
        return { data: { objective: efectiva && objetivo ? versionDeObjetivoApi(efectiva, objetivo, true, await nombreVisibleDe(tx, actor.identidadId)) : null } };
      },
    });
  }

  /** La versión efectiva: la terminal de la sucesión (INV-06-107). `null` si no hay o no es resoluble. */
  async efectivaDe(cliente: Tx, objetivoId: string): Promise<FilaDeVersionDeObjetivo | null> {
    const versiones = await cliente.versionDeObjetivoDeEntrenamiento.findMany({ where: { objetivoId } });
    const terminal = resolverVersionTerminal(versiones.map((v) => ({ id: v.id, objetoId: v.objetivoId, predecesoraId: v.predecesoraId })));
    return terminal.tipo === 'TERMINAL' ? (versiones.find((v) => v.id === terminal.terminalId) ?? null) : null;
  }

  /** PDP del profesional sobre el asesorado, alcance ENTRENAMIENTO. Devuelve el id del titular ya resuelto. */
  private async decidir(tx: Tx, operacion: string, actor: ActorAutenticado, adviseeId: string, recurso: { tipo: string; id: string } | null, ctx: ContextoDeSolicitud): Promise<string> {
    const d = await this.pdp.decidirEnTransaccion(
      tx,
      { operacion, actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: adviseeId, alcance: 'ENTRENAMIENTO', recurso },
      ctx,
    );
    return d.hechos.titular?.identidadId as string;
  }

  /** El objetivo de la terna, creado si no existe, y bloqueado para escribir versiones. */
  private async objetivoBloqueado(tx: Tx, profesionalId: string, asesoradoId: string): Promise<string> {
    await tx.$executeRaw`
      INSERT INTO "objetivo_de_entrenamiento" ("id", "profesional_id", "asesorado_id")
      VALUES (gen_random_uuid(), ${profesionalId}::uuid, ${asesoradoId}::uuid)
      ON CONFLICT ("profesional_id", "asesorado_id") DO NOTHING`;
    const [fila] = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id"::text AS "id" FROM "objetivo_de_entrenamiento"
       WHERE "profesional_id" = ${profesionalId}::uuid AND "asesorado_id" = ${asesoradoId}::uuid FOR NO KEY UPDATE`;
    if (!fila) throw new Error('objetivo no creado');
    return fila.id;
  }
}
