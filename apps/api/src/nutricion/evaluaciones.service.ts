import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  CrearEvaluacionRequestSchema,
  CrearObjetivoRequestSchema,
  resolverVersionTerminal,
  type CrearObjetivoRequest,
  type EvaluacionNutricional,
  type Procedencia,
  type VersionDeObjetivo,
} from '@be/domain';
import type { Prisma, VersionDeObjetivoNutricional } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecutorNutricional, esUuid } from './ejecutor';
import { evaluacionApi, nombreVisibleDe, versionDeObjetivoApi } from './lectura-nutricion';
import { registrarEventoDeNutricion } from './eventos';

type Tx = Prisma.TransactionClient;

/** Margen para relojes de cliente adelantados: una ocurrencia más allá de esto es futura y no se admite. */
const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000;

/**
 * UC-P09 — Evaluación y objetivo nutricional (API-NUT-01 a 06; RF-026, RF-029).
 * - La evaluación es un hecho: una posterior no sobrescribe la anterior (REG-06-97).
 * - El objetivo es una decisión profesional versionada con fundamento; BE no calcula nada (REG-06-123; INV-06-133).
 * - El objetivo efectivo es la terminal de la sucesión, nunca «el último por fecha» (INV-06-107; 09v9:472).
 * - Cada profesional ve y usa solo lo propio (DL-057): lo de otro profesional no es revelable.
 */
@Injectable()
export class EvaluacionesService {
  constructor(private readonly ejecutor: EjecutorNutricional, private readonly pdp: PdpService) {}

  // ─── API-NUT-01 ────────────────────────────────────────────────────────────────────────────
  crearEvaluacion(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-NUT-01',
      casoDeUso: 'UC-P09',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      clave,
      esquema: CrearEvaluacionRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        const d = await this.decidir(tx, 'API-NUT-01', actor, adviseeId, { tipo: 'Asesorado', id: adviseeId }, ctx);
        const ocurrencia = new Date(pedido.occurredAt);
        const momento = await momentoDeLaBase(tx);
        if (ocurrencia.getTime() > momento.getTime() + TOLERANCIA_FUTURO_MS) {
          throw new ErrorDeApi(422, CodigoDeError.NUTRITION_EVALUATION_INVALID, 'La fecha de la evaluación no puede ser futura.', {
            issues: [{ code: 'OCCURRED_AT_IN_FUTURE', path: 'occurredAt' }],
          });
        }
        const e = await tx.evaluacionNutricional.create({
          data: {
            profesionalId: actor.identidadId,
            asesoradoId: d,
            contexto: pedido.context,
            valoracion: pedido.assessment as Prisma.InputJsonValue,
            referencias: pedido.evidenceReferences,
            notas: pedido.professionalNotes,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeOcurrencia: ocurrencia,
          },
        });
        await registrarEventoDeNutricion(tx, {
          tipo: 'EvaluacionNutricionalRegistrada',
          profesionalId: actor.identidadId,
          asesoradoId: d,
          recurso: { tipo: 'EvaluacionNutricional', id: e.id },
          estadoPrevio: null,
          estadoPosterior: null,
          actorId: actor.identidadId,
          procedencia,
          momento: ocurrencia,
        });
        return {
          estadoHttp: 201,
          cuerpo: { data: { evaluationId: e.id, version: 'v1', occurredAt: e.momentoDeOcurrencia.toISOString(), recordedAt: e.momentoDeRegistro.toISOString() } },
          sujetoId: d,
          recurso: { tipo: 'EvaluacionNutricional', id: e.id },
        };
      },
    });
  }

  // ─── API-NUT-02 ────────────────────────────────────────────────────────────────────────────
  listarEvaluaciones(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: EvaluacionNutricional[]; page: unknown }> {
    const consulta = leerConsultaDeLista(query, {});
    return this.ejecutor.leer({
      operacion: 'API-NUT-02',
      casoDeUso: 'UC-P09',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        const asesoradoId = await this.decidir(tx, 'API-NUT-02', actor, adviseeId, null, ctx);
        const filas = await tx.evaluacionNutricional.findMany({
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

  // ─── API-NUT-03 ────────────────────────────────────────────────────────────────────────────
  consultarEvaluacion(actor: ActorAutenticado, evaluationId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: EvaluacionNutricional }> {
    sinParametrosDeQuery(query);
    const recurso = { tipo: 'EvaluacionNutricional', id: evaluationId };
    return this.ejecutor.leer({
      operacion: 'API-NUT-03',
      casoDeUso: 'UC-P09',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const e = esUuid(evaluationId) ? await tx.evaluacionNutricional.findUnique({ where: { id: evaluationId } }) : null;
        if (!e) throw this.ejecutor.noRevelable({ operacion: 'API-NUT-03', actorId: actor.identidadId, recurso }, ctx);
        await this.decidir(tx, 'API-NUT-03', actor, e.asesoradoId, recurso, ctx);
        if (e.profesionalId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-NUT-03', actorId: actor.identidadId, recurso, sujetoId: e.asesoradoId }, ctx);
        return { data: evaluacionApi(e, await nombreVisibleDe(tx, actor.identidadId)) };
      },
    });
  }

  // ─── API-NUT-04 ────────────────────────────────────────────────────────────────────────────
  crearObjetivo(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-NUT-04',
      casoDeUso: 'UC-P09',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      clave,
      esquema: CrearObjetivoRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        const asesoradoId = await this.decidir(tx, 'API-NUT-04', actor, adviseeId, { tipo: 'Asesorado', id: adviseeId }, ctx);
        const version = await this.emitirVersionDeObjetivo(tx, { profesionalId: actor.identidadId, asesoradoId, contenido: pedido, revisionDeOrigenId: null, procedencia });
        const nombre = await nombreVisibleDe(tx, actor.identidadId);
        return {
          estadoHttp: 201,
          cuerpo: { data: versionDeObjetivoApi(version, { profesionalId: actor.identidadId, asesoradoId }, true, nombre) },
          sujetoId: asesoradoId,
          recurso: { tipo: 'VersionDeObjetivoNutricional', id: version.id },
        };
      },
    });
  }

  /**
   * Emite una versión de objetivo sucesora de la efectiva (REG-06-98, 123). La usan API-NUT-04 y la aplicación de una
   * revisión CAMBIAR_OBJETIVO (DL-052). El objetivo se bloquea para que dos emisiones no bifurquen la cadena.
   */
  async emitirVersionDeObjetivo(
    tx: Tx,
    p: { profesionalId: string; asesoradoId: string; contenido: CrearObjetivoRequest; revisionDeOrigenId: string | null; procedencia: Procedencia },
  ): Promise<VersionDeObjetivoNutricional> {
    const evaluacion = esUuid(p.contenido.evaluationId)
      ? await tx.evaluacionNutricional.findUnique({ where: { id: p.contenido.evaluationId }, select: { profesionalId: true, asesoradoId: true } })
      : null;
    // La evaluación de referencia tiene que ser de este profesional y de este asesorado (UC-P09 E03).
    if (!evaluacion || evaluacion.profesionalId !== p.profesionalId || evaluacion.asesoradoId !== p.asesoradoId) {
      throw new ErrorDeApi(422, CodigoDeError.EVALUATION_NOT_COMPATIBLE, 'La evaluación de referencia no corresponde a este asesorado.', {
        issues: [{ code: 'EVALUATION_NOT_COMPATIBLE', path: 'evaluationId' }],
      });
    }
    const objetivoId = await this.objetivoBloqueado(tx, p.profesionalId, p.asesoradoId);
    const versiones = await tx.versionDeObjetivoNutricional.findMany({ where: { objetivoId }, select: { id: true, objetivoId: true, predecesoraId: true } });
    const terminal = resolverVersionTerminal(versiones.map((v) => ({ id: v.id, objetoId: v.objetivoId, predecesoraId: v.predecesoraId })));
    if (terminal.tipo === 'NO_RESOLUBLE') throw new ErrorDeApi(422, CodigoDeError.NUTRITION_OBJECTIVE_INVALID, 'La historia del objetivo no se puede resolver.');
    const momento = await momentoDeLaBase(tx);
    const version = await tx.versionDeObjetivoNutricional.create({
      data: {
        objetivoId,
        predecesoraId: terminal.tipo === 'TERMINAL' ? terminal.terminalId : null,
        evaluacionId: p.contenido.evaluationId,
        vigenteDesde: new Date(p.contenido.effectiveFrom),
        vigenteHasta: p.contenido.effectiveUntil ? new Date(p.contenido.effectiveUntil) : null,
        requerimientoEnergetico: p.contenido.estimatedEnergyRequirement as Prisma.InputJsonValue,
        distribucionDeMacronutrientes: p.contenido.macronutrientDistribution as Prisma.InputJsonValue,
        distribucionPorComida: p.contenido.mealDistribution,
        fundamento: p.contenido.rationale,
        declaracionDeMetodo: p.contenido.methodStatement,
        revisionDeOrigenId: p.revisionDeOrigenId,
        autorId: p.profesionalId,
        procedencia: p.procedencia as unknown as Prisma.InputJsonValue,
      },
    });
    await registrarEventoDeNutricion(tx, {
      tipo: 'VersionDeObjetivoEmitida',
      profesionalId: p.profesionalId,
      asesoradoId: p.asesoradoId,
      recurso: { tipo: 'VersionDeObjetivoNutricional', id: version.id },
      estadoPrevio: null,
      estadoPosterior: null,
      actorId: p.profesionalId,
      procedencia: p.procedencia,
      momento,
    });
    return version;
  }

  // ─── API-NUT-05 ────────────────────────────────────────────────────────────────────────────
  listarObjetivos(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: VersionDeObjetivo[]; page: unknown }> {
    const consulta = leerConsultaDeLista(query, {});
    return this.ejecutor.leer({
      operacion: 'API-NUT-05',
      casoDeUso: 'UC-P09',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        const asesoradoId = await this.decidir(tx, 'API-NUT-05', actor, adviseeId, null, ctx);
        const objetivo = await tx.objetivoNutricional.findUnique({ where: { profesionalId_asesoradoId: { profesionalId: actor.identidadId, asesoradoId } } });
        if (!objetivo) return { data: [], page: { limit: consulta.limit, nextCursor: null, hasMore: false } };
        const efectiva = await this.efectivaDe(tx, objetivo.id);
        const filas = await tx.versionDeObjetivoNutricional.findMany({
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

  // ─── API-NUT-06 ────────────────────────────────────────────────────────────────────────────
  objetivoEfectivo(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: { objective: VersionDeObjetivo | null } }> {
    sinParametrosDeQuery(query);
    return this.ejecutor.leer({
      operacion: 'API-NUT-06',
      casoDeUso: 'UC-P09',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        const asesoradoId = await this.decidir(tx, 'API-NUT-06', actor, adviseeId, null, ctx);
        const objetivo = await tx.objetivoNutricional.findUnique({ where: { profesionalId_asesoradoId: { profesionalId: actor.identidadId, asesoradoId } } });
        const efectiva = objetivo ? await this.efectivaDe(tx, objetivo.id) : null;
        return {
          data: { objective: efectiva && objetivo ? versionDeObjetivoApi(efectiva, objetivo, true, await nombreVisibleDe(tx, actor.identidadId)) : null },
        };
      },
    });
  }

  /** Versión efectiva del objetivo: la terminal de la sucesión (INV-06-107). `null` si no hay o no es resoluble. */
  async efectivaDe(cliente: Tx, objetivoId: string): Promise<VersionDeObjetivoNutricional | null> {
    const versiones = await cliente.versionDeObjetivoNutricional.findMany({ where: { objetivoId } });
    const terminal = resolverVersionTerminal(versiones.map((v) => ({ id: v.id, objetoId: v.objetivoId, predecesoraId: v.predecesoraId })));
    return terminal.tipo === 'TERMINAL' ? (versiones.find((v) => v.id === terminal.terminalId) ?? null) : null;
  }

  /** PDP del profesional sobre el asesorado, alcance NUTRICION. Devuelve el id del titular ya resuelto. */
  private async decidir(tx: Tx, operacion: string, actor: ActorAutenticado, adviseeId: string, recurso: { tipo: string; id: string } | null, ctx: ContextoDeSolicitud): Promise<string> {
    const d = await this.pdp.decidirEnTransaccion(
      tx,
      { operacion, actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: adviseeId, alcance: 'NUTRICION', recurso },
      ctx,
    );
    return d.hechos.titular?.identidadId as string;
  }

  /** El objetivo de la terna, creado si no existe, y bloqueado para escribir versiones. */
  private async objetivoBloqueado(tx: Tx, profesionalId: string, asesoradoId: string): Promise<string> {
    await tx.$executeRaw`
      INSERT INTO "objetivo_nutricional" ("id", "profesional_id", "asesorado_id")
      VALUES (gen_random_uuid(), ${profesionalId}::uuid, ${asesoradoId}::uuid)
      ON CONFLICT ("profesional_id", "asesorado_id") DO NOTHING`;
    const [fila] = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id"::text AS "id" FROM "objetivo_nutricional"
       WHERE "profesional_id" = ${profesionalId}::uuid AND "asesorado_id" = ${asesoradoId}::uuid FOR NO KEY UPDATE`;
    if (!fila) throw new Error('objetivo no creado');
    return fila.id;
  }
}
