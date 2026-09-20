import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  CrearBorradorRequestSchema,
  GuardarBorradorRequestSchema,
  RegistrarEvaluacionRequestSchema,
  evaluarTransicionDeEvaluacion,
  type Procedencia,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { esToken } from '../vinculo/lectura';
import { EjecutorAntropometrico, esUuid } from './ejecutor';
import { registrarEventoDeAntropometria } from './eventos';
import { CLASE_DESDE_ORIGEN, evaluacionApi, INCLUIR_EVALUACION, nombreVisibleDe, ORIGEN_DESDE_API, token } from './lectura-antropometria';

type Tx = Prisma.TransactionClient;

/** Margen para relojes de cliente adelantados, igual que en nutrición. */
const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000;

/**
 * UC-P19 — Evaluación antropométrica (API-ANT-02, 03, 04, 07 a 11; RF-047).
 *
 * La máquina es la de REG-06-214: `EN_PREPARACION → REGISTRADA`, con acto explícito de registro y sin vuelta atrás.
 * Lo que el borrador guarda **no es historia** (REG-06-215): no alimenta la serie, no figura como última evaluación
 * registrada y no crea resultado confirmado. Por eso API-ANT-03 lista solo las registradas (09v16 §23.1) y el
 * borrador de otro profesional no es revelable (08 §56.5; adversarial 10).
 *
 * Antropometría **no abre Proceso ni ocupa capacidad** (06 §8.9, §9.11.2): acá no se consulta B-04 ni B-05.
 */
@Injectable()
export class EvaluacionesAntropometricasService {
  constructor(private readonly ejecutor: EjecutorAntropometrico, private readonly pdp: PdpService) {}

  // ─── API-ANT-07 · crear la evaluación en preparación ───────────────────────────────────────
  crearBorrador(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-ANT-07',
      casoDeUso: 'UC-P19',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      clave,
      esquema: CrearBorradorRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        const titular = await this.decidir(tx, 'API-ANT-07', actor, adviseeId, { tipo: 'Asesorado', id: adviseeId }, ctx);
        await this.exigirOcurrenciaNoFutura(tx, pedido.occurredAt);

        const evaluacion = await tx.evaluacionAntropometrica.create({
          data: {
            profesionalId: actor.identidadId,
            asesoradoId: titular,
            contexto: pedido.context ?? null,
            momentoDeOcurrencia: new Date(pedido.occurredAt),
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
        });
        await this.escribirMediciones(tx, evaluacion.id, pedido.measurements ?? [], procedencia);

        const completa = await this.leerEvaluacion(tx, evaluacion.id);
        return {
          estadoHttp: 201,
          cuerpo: { data: await this.aApi(tx, completa) },
          sujetoId: titular,
          recurso: { tipo: 'EvaluacionAntropometrica', id: evaluacion.id },
        };
      },
    });
  }

  // ─── API-ANT-10 · guardar el borrador ──────────────────────────────────────────────────────
  guardarBorrador(actor: ActorAutenticado, evaluationId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'EvaluacionAntropometrica', id: evaluationId };
    return this.ejecutor.escribir({
      operacion: 'API-ANT-10',
      casoDeUso: 'UC-P19',
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: GuardarBorradorRequestSchema,
      cuerpo,
      efecto: async (tx, pedido, procedencia) => {
        const e = await this.propiaBloqueada(tx, 'API-ANT-10', actor, evaluationId, ctx);
        if (!esToken(pedido.expectedVersion, e.version)) throw errores.conflictoDeVersion();
        this.exigirTransicion(e.estado, 'GuardarBorrador');

        // El contenido del borrador se reemplaza por el declarado: es trabajo en curso, no historia (REG-06-215).
        await tx.entradaDeCalculo.deleteMany({ where: { ejecucion: { evaluacionId: e.id } } });
        await tx.ejecucionDeCalculo.deleteMany({ where: { evaluacionId: e.id } });
        await tx.medicionAntropometrica.deleteMany({ where: { evaluacionId: e.id } });
        await this.escribirMediciones(tx, e.id, pedido.measurements, procedencia);
        await tx.evaluacionAntropometrica.update({
          where: { id: e.id },
          data: { version: e.version + 1, contexto: pedido.context === undefined ? e.contexto : pedido.context },
        });

        const completa = await this.leerEvaluacion(tx, e.id);
        return { estadoHttp: 200, cuerpo: { data: await this.aApi(tx, completa) }, sujetoId: e.asesoradoId, recurso };
      },
    });
  }

  // ─── API-ANT-11 · registrar ────────────────────────────────────────────────────────────────
  registrar(actor: ActorAutenticado, evaluationId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'EvaluacionAntropometrica', id: evaluationId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-ANT-11',
      casoDeUso: 'UC-P19',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: RegistrarEvaluacionRequestSchema,
      cuerpo,
      huellaExtra: { evaluationId },
      efecto: async (tx, pedido, procedencia) => {
        const e = await this.propiaBloqueada(tx, 'API-ANT-11', actor, evaluationId, ctx);
        if (!esToken(pedido.expectedVersion, e.version)) throw errores.conflictoDeVersion();

        const mediciones = await tx.medicionAntropometrica.count({ where: { evaluacionId: e.id } });
        // REG-06-214 inciso 4: el acto explícito exige contenido registrable. La base lo vuelve a exigir.
        const evaluacion = evaluarTransicionDeEvaluacion(e.estado, { transicion: 'RegistrarEvaluacion', contenidoRegistrable: mediciones > 0 });
        if (!evaluacion.permitida) {
          throw evaluacion.motivo === 'CONTENIDO_NO_REGISTRABLE'
            ? new ErrorDeApi(422, CodigoDeError.ANTHROPOMETRY_EVALUATION_INVALID, 'Una evaluación sin mediciones no se registra.', {
                issues: [{ code: 'NO_MEASUREMENTS', path: 'measurements' }],
              })
            : new ErrorDeApi(422, CodigoDeError.ANTHROPOMETRY_EVALUATION_NOT_EDITABLE, 'Esta evaluación ya está registrada. Para cambiarla, corregí o anulá una medición.');
        }

        const momento = await momentoDeLaBase(tx);
        await tx.evaluacionAntropometrica.update({
          where: { id: e.id },
          data: { estado: 'REGISTRADA', momentoDeRegistroDeEvaluacion: momento },
        });
        await registrarEventoDeAntropometria(tx, {
          tipo: 'EvaluacionAntropometricaRegistrada',
          evaluacionId: e.id,
          medicionId: null,
          actorId: actor.identidadId,
          procedencia,
          momento,
        });

        const completa = await this.leerEvaluacion(tx, e.id);
        return { estadoHttp: 200, cuerpo: { data: await this.aApi(tx, completa) }, sujetoId: e.asesoradoId, recurso };
      },
    });
  }

  // ─── API-ANT-08 · listar borradores retomables ─────────────────────────────────────────────
  listarBorradores(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<unknown> {
    return this.listar(actor, adviseeId, query, ctx, 'API-ANT-08', 'EN_PREPARACION');
  }

  // ─── API-ANT-03 · listar evaluaciones registradas ──────────────────────────────────────────
  listarRegistradas(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<unknown> {
    return this.listar(actor, adviseeId, query, ctx, 'API-ANT-03', 'REGISTRADA');
  }

  /** 09v16 §23.1: ANT-03 lista únicamente REGISTRADA; ANT-08, únicamente los borradores propios. */
  private listar(
    actor: ActorAutenticado,
    adviseeId: string,
    query: Record<string, unknown>,
    ctx: ContextoDeSolicitud,
    operacion: string,
    estado: 'EN_PREPARACION' | 'REGISTRADA',
  ): Promise<unknown> {
    const consulta = leerConsultaDeLista(query, {});
    return this.ejecutor.leer({
      operacion,
      casoDeUso: 'UC-P19',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        const titular = await this.decidir(tx, operacion, actor, adviseeId, { tipo: 'Asesorado', id: adviseeId }, ctx);
        const filas = await tx.evaluacionAntropometrica.findMany({
          where: { asesoradoId: titular, profesionalId: actor.identidadId, estado, ...despuesDelCursor(consulta.cursor) },
          include: { mediciones: { select: { id: true, metrica: true, anulacion: { select: { id: true } } } } },
          orderBy: ORDEN_DE_LISTA,
          take: consulta.limit + 1,
        });
        const { pagina, page } = paginar(filas, consulta.limit);
        const nombre = await nombreVisibleDe(tx, actor.identidadId);
        const data = pagina.map((e) => ({
          evaluationId: e.id,
          adviseeId: e.asesoradoId,
          author: { identityId: e.profesionalId, displayName: nombre },
          state: estado === 'REGISTRADA' ? ('REGISTERED' as const) : ('IN_PREPARATION' as const),
          summary: {
            measurementCount: e.mediciones.length,
            derivedResultCount: 0,
            metrics: [...new Set(e.mediciones.map((m) => m.metrica))],
            annulledCount: e.mediciones.filter((m) => m.anulacion).length,
          },
          occurredAt: e.momentoDeOcurrencia.toISOString(),
          registeredAt: e.momentoDeRegistroDeEvaluacion?.toISOString() ?? null,
        }));
        return { data, page };
      },
    });
  }

  // ─── API-ANT-04 y API-ANT-09 · consultar ───────────────────────────────────────────────────
  /**
   * Una evaluación de otro profesional no es revelable, y **un borrador ajeno tampoco existe**: mismo 404 que ante un
   * identificador inventado (08 §56.5; adversarial 10). El PDP se decide primero contra el titular real, y recién
   * después se compara la propiedad (DL-057).
   */
  consultar(actor: ActorAutenticado, evaluationId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<unknown> {
    sinParametrosDeQuery(query);
    const recurso = { tipo: 'EvaluacionAntropometrica', id: evaluationId };
    return this.ejecutor.leer({
      operacion: 'API-ANT-04',
      casoDeUso: 'UC-P19',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const e = esUuid(evaluationId) ? await tx.evaluacionAntropometrica.findUnique({ where: { id: evaluationId }, include: INCLUIR_EVALUACION }) : null;
        if (!e) throw this.ejecutor.noRevelable({ operacion: 'API-ANT-04', actorId: actor.identidadId, recurso }, ctx);
        await this.decidir(tx, 'API-ANT-04', actor, e.asesoradoId, recurso, ctx);
        if (e.profesionalId !== actor.identidadId) {
          throw this.ejecutor.noRevelable({ operacion: 'API-ANT-04', actorId: actor.identidadId, recurso, sujetoId: e.asesoradoId }, ctx);
        }
        return { data: await this.aApi(tx, e) };
      },
    });
  }

  // ─── Interno ───────────────────────────────────────────────────────────────────────────────

  private exigirTransicion(estado: 'EN_PREPARACION' | 'REGISTRADA', transicion: 'GuardarBorrador'): void {
    const r = evaluarTransicionDeEvaluacion(estado, { transicion });
    if (!r.permitida) {
      throw new ErrorDeApi(422, CodigoDeError.ANTHROPOMETRY_EVALUATION_NOT_EDITABLE, 'Esta evaluación ya está registrada. Para cambiarla, corregí o anulá una medición.');
    }
  }

  private async escribirMediciones(
    tx: Tx,
    evaluacionId: string,
    mediciones: readonly {
      metric: string;
      magnitude: { value: number; unit: string };
      protocolVersionId: string;
      origin: 'DIRECT_CAPTURE' | 'SELF_REPORTED' | 'CONTROLLED_IMPORT';
      preparationReference?: string | null;
      occurredAt: string;
    }[],
    procedencia: Procedencia,
  ): Promise<void> {
    if (mediciones.length === 0) return;
    const versiones = await tx.versionDeEspecificacionAntropometrica.findMany({
      where: { id: { in: [...new Set(mediciones.map((m) => m.protocolVersionId))] } },
      select: { id: true },
    });
    const conocidas = new Set(versiones.map((v) => v.id));
    for (const [i, m] of mediciones.entries()) {
      if (!conocidas.has(m.protocolVersionId)) {
        throw new ErrorDeApi(422, CodigoDeError.SPECIFICATION_REFERENCE_INVALID, 'El protocolo declarado no existe en el catálogo.', {
          issues: [{ code: 'UNKNOWN_SPECIFICATION_VERSION', path: `measurements[${i}].protocolVersionId` }],
        });
      }
    }
    await tx.medicionAntropometrica.createMany({
      data: mediciones.map((m) => ({
        evaluacionId,
        metrica: m.metric,
        valor: m.magnitude.value,
        unidadDeOrigen: m.magnitude.unit,
        protocoloVersionId: m.protocolVersionId,
        origen: ORIGEN_DESDE_API[m.origin],
        // La clase se deriva del origen: el cliente no la elige (04:1090). La base lo vuelve a exigir.
        clase: CLASE_DESDE_ORIGEN[ORIGEN_DESDE_API[m.origin]],
        referenciaDePreparacion: m.preparationReference ?? null,
        momentoDeOcurrencia: new Date(m.occurredAt),
        procedencia: procedencia as unknown as Prisma.InputJsonValue,
      })),
    });
  }

  private async exigirOcurrenciaNoFutura(tx: Tx, occurredAt: string): Promise<void> {
    const momento = await momentoDeLaBase(tx);
    if (new Date(occurredAt).getTime() > momento.getTime() + TOLERANCIA_FUTURO_MS) {
      throw new ErrorDeApi(422, CodigoDeError.ANTHROPOMETRY_EVALUATION_INVALID, 'La fecha de la evaluación no puede ser futura.', {
        issues: [{ code: 'OCCURRED_AT_IN_FUTURE', path: 'occurredAt' }],
      });
    }
  }

  /** La evaluación propia, bloqueada para escribir. Ajena o inexistente: el mismo 404 (DL-057). */
  private async propiaBloqueada(tx: Tx, operacion: string, actor: ActorAutenticado, evaluationId: string, ctx: ContextoDeSolicitud) {
    const recurso = { tipo: 'EvaluacionAntropometrica', id: evaluationId };
    const e = esUuid(evaluationId) ? await tx.evaluacionAntropometrica.findUnique({ where: { id: evaluationId } }) : null;
    if (!e) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso }, ctx);
    await this.decidir(tx, operacion, actor, e.asesoradoId, recurso, ctx);
    if (e.profesionalId !== actor.identidadId) {
      throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso, sujetoId: e.asesoradoId }, ctx);
    }
    await tx.$queryRaw`SELECT 1 FROM "evaluacion_antropometrica" WHERE "id" = ${e.id}::uuid FOR NO KEY UPDATE`;
    return e;
  }

  private async leerEvaluacion(tx: Tx, id: string) {
    return tx.evaluacionAntropometrica.findUniqueOrThrow({ where: { id }, include: INCLUIR_EVALUACION });
  }

  private async aApi(tx: Tx, e: Awaited<ReturnType<EvaluacionesAntropometricasService['leerEvaluacion']>>) {
    const nombre = await nombreVisibleDe(tx, e.profesionalId);
    return evaluacionApi(e, () => nombre);
  }

  private async decidir(tx: Tx, operacion: string, actor: ActorAutenticado, adviseeId: string, recurso: { tipo: string; id: string } | null, ctx: ContextoDeSolicitud): Promise<string> {
    const d = await this.pdp.decidirEnTransaccion(
      tx,
      { operacion, actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: adviseeId, alcance: 'ANTROPOMETRIA', recurso },
      ctx,
    );
    return d.hechos.titular?.identidadId as string;
  }
}
