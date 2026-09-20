import { Injectable } from '@nestjs/common';
import {
  AdoptarReferenciaRequestSchema,
  CodigoDeError,
  EjecutarCalculoRequestSchema,
  admiteFinalidad,
  ejecutar,
  evaluarAdmisibilidad,
  evaluarAdopcion,
  type DatoPropuesto,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { exigirCapacidadAntropometrica } from './capacidad';
import { EjecutorAntropometrico, esUuid } from './ejecutor';
import { registrarEventoDeAntropometria } from './eventos';
import { nombreVisibleDe } from './lectura-antropometria';
import { corridaApi, FINALIDAD_DESDE_API, leerEspecificacionDeMetodo, referenciaApi } from './lectura-calculo';

type Tx = Prisma.TransactionClient;

const INCLUIR_CORRIDA = {
  // La condición de cada entrada se deriva de la existencia de su evento de anulación, igual que la de la medición
  // (06:8670). Sin esto, una corrida apoyada en una medición anulada se leería como si nada hubiera pasado.
  entradas: { include: { medicion: { include: { anulacion: { select: { id: true } } } } } },
  metodoVersion: { include: { especificacion: true, sucesora: { select: { id: true } } } },
  evaluacion: { select: { asesoradoId: true, profesionalId: true, estado: true } },
  reemplazadaPor: { select: { id: true } },
} as const;

/**
 * UC-I09 — cálculo profesional reproducible (API-CAL-01 a 04; RF-048).
 *
 * El patrón es el transversal T-06-N12 (REG-06-202), y lo que lo vuelve honesto son cuatro negativas:
 * - **no ejecuta con lo que haya:** disponible no es admisible, y cada versión declara qué entradas acepta, en qué
 *   unidades y de qué procedencias (REG-06-204);
 * - **no elige:** varias corridas coexisten para la misma finalidad, sin promedio, sin orden por «mejor» y sin
 *   ganadora automática (REG-06-205);
 * - **no reescribe el pasado:** la corrida conserva la versión exacta del método que se usó, aunque después haya una
 *   más nueva (REG-06-203; INV-06-172);
 * - **no decide:** adoptar una referencia es una relación con historia, que no modifica la corrida, no borra las
 *   otras y no crea objetivo ni prescripción (REG-06-207; INV-06-05).
 *
 * Y, como toda operación sobre datos de salud, **ninguna de las cuatro decide por su cuenta**: el PDP se consulta
 * dentro de la transacción y antes de cualquier validación de contrato, porque «Sesión ≠ autorización» y el acceso se
 * recalcula server-side con el estado actual (09 §3.3, §20.2.2). Una corrida de otro profesional no es revelable:
 * mismo 404 que lo inexistente (DL-057), también por el camino del cálculo. Sin ese corte, el cálculo sería una
 * puerta trasera para leer las mediciones que API-ANT-04 no muestra.
 */
@Injectable()
export class CalculosService {
  constructor(private readonly ejecutor: EjecutorAntropometrico, private readonly pdp: PdpService) {}

  // ─── API-CAL-01 · ejecutar ─────────────────────────────────────────────────────────────────
  ejecutarCalculo(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'Asesorado', id: adviseeId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-CAL-01',
      casoDeUso: 'UC-I09',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: EjecutarCalculoRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        // Primero la autorización, antes de cualquier 422: así un rechazo de contrato no le confirma a alguien no
        // autorizado que el recurso existe (09 §3.2.1, precedencia).
        const titular = await this.decidir(tx, 'API-CAL-01', actor, adviseeId, recurso, ctx);
        await exigirCapacidadAntropometrica(tx, actor.identidadId);

        const version = esUuid(pedido.methodVersionId)
          ? await tx.versionDeEspecificacionAntropometrica.findFirst({
              where: { id: pedido.methodVersionId, especificacion: { tipo: 'METODO' } },
              include: { especificacion: true, sucesora: { select: { id: true } } },
            })
          : null;
        const metodo = version ? leerEspecificacionDeMetodo(version.contenido) : null;
        if (!version || !metodo) {
          throw new ErrorDeApi(422, CodigoDeError.METHOD_VERSION_NOT_SELECTABLE, 'El método declarado no existe en el catálogo.');
        }
        // REG-06-203: una versión histórica se puede consultar, no seleccionar para una corrida nueva.
        if (version.sucesora) {
          throw new ErrorDeApi(422, CodigoDeError.METHOD_VERSION_NOT_SELECTABLE, 'Esa versión del método es histórica. Para ejecutar, elegí la versión vigente.');
        }
        const finalidad = FINALIDAD_DESDE_API[pedido.purpose];
        if (!admiteFinalidad(metodo, finalidad)) {
          throw new ErrorDeApi(422, CodigoDeError.METHOD_VERSION_NOT_SELECTABLE, 'Esa versión del método no está declarada para esta finalidad.');
        }

        const { mediciones, evaluacionId } = await this.entradasVisibles(tx, actor, titular, pedido.inputBindings, ctx);
        const propuestos: DatoPropuesto[] = pedido.inputBindings.map((b) => {
          const m = mediciones.get(b.sourceRef)!;
          return {
            codigo: b.inputCode,
            medicionId: m.id,
            metrica: m.metrica,
            magnitud: { valor: Number(m.valor), unidad: m.unidadDeOrigen },
            origen: m.origen,
            vigente: m.anulacion === null,
          };
        });

        const admisibilidad = evaluarAdmisibilidad(metodo, propuestos);
        if (!admisibilidad.admisible) {
          throw new ErrorDeApi(422, CodigoDeError.CALCULATION_INPUTS_INSUFFICIENT, 'Las entradas declaradas no alcanzan para ejecutar este método.', {
            issues: admisibilidad.problemas.map((p) => ({ code: p.motivo, path: `inputBindings.${p.codigo}` })),
          });
        }

        const resultado = ejecutar(metodo, admisibilidad.entradas);
        if (!resultado.ok) {
          throw new ErrorDeApi(422, CodigoDeError.CALCULATION_NOT_REPRODUCIBLE, `No se puede reproducir el cálculo: ${resultado.detalle}.`);
        }

        const corrida = await tx.ejecucionDeCalculo.create({
          data: {
            evaluacionId,
            metodoVersionId: version.id,
            autorId: actor.identidadId,
            metrica: metodo.salida.metrica,
            valor: resultado.magnitud.valor,
            unidad: resultado.magnitud.unidad,
            decimales: metodo.precision.decimales,
            modoDeRedondeo: metodo.precision.modo,
            finalidad,
            regla: resultado.regla,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            entradas: { create: admisibilidad.entradas.map((e) => ({ medicionId: e.medicionId, metrica: e.metrica, valor: e.magnitud.valor, unidad: e.magnitud.unidad })) },
          },
          include: INCLUIR_CORRIDA,
        });

        const momento = await momentoDeLaBase(tx);
        await registrarEventoDeAntropometria(tx, { tipo: 'CalculoEjecutado', evaluacionId, medicionId: null, actorId: actor.identidadId, procedencia, momento });

        const nombre = await nombreVisibleDe(tx, actor.identidadId);
        // Recién ejecutada: ninguna corrida nace adoptada. No existe referencia automática (REG-06-207).
        return { estadoHttp: 201, cuerpo: { data: corridaApi(corrida, () => nombre, null) }, sujetoId: titular, recurso };
      },
    });
  }

  // ─── API-CAL-02 · listar las corridas revelables ───────────────────────────────────────────
  /** Se listan como están: sin promedio, sin ranking y sin ganadora marcada (REG-06-205), y solo las propias. */
  listar(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<unknown> {
    const consulta = leerConsultaDeLista(query, { purpose: ['ANTHROPOMETRIC_SUPPORT', 'NUTRITION_OBJECTIVE_SUPPORT'] });
    return this.ejecutor.leer({
      operacion: 'API-CAL-02',
      casoDeUso: 'UC-I09',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        const titular = await this.decidir(tx, 'API-CAL-02', actor, adviseeId, { tipo: 'Asesorado', id: adviseeId }, ctx);
        await exigirCapacidadAntropometrica(tx, actor.identidadId);
        const filas = await tx.ejecucionDeCalculo.findMany({
          where: {
            evaluacion: { asesoradoId: titular, profesionalId: actor.identidadId },
            ...(consulta.filtros.purpose ? { finalidad: FINALIDAD_DESDE_API[consulta.filtros.purpose as 'ANTHROPOMETRIC_SUPPORT'] } : {}),
            ...despuesDelCursor(consulta.cursor),
          },
          include: INCLUIR_CORRIDA,
          orderBy: ORDEN_DE_LISTA,
          take: consulta.limit + 1,
        });
        const { pagina, page } = paginar(filas, consulta.limit);
        const referencias = await this.referencias(tx, titular, actor.identidadId);
        const nombres = await this.nombres(tx, pagina.map((c) => c.autorId));
        return { data: pagina.map((c) => corridaApi(c, (id) => nombres.get(id) ?? 'Profesional', referencias.get(c.finalidad) ?? null)), page };
      },
    });
  }

  // ─── API-CAL-03 · consultar una corrida ────────────────────────────────────────────────────
  consultar(actor: ActorAutenticado, runId: string, ctx: ContextoDeSolicitud): Promise<unknown> {
    const recurso = { tipo: 'EjecucionDeCalculo', id: runId };
    return this.ejecutor.leer({
      operacion: 'API-CAL-03',
      casoDeUso: 'UC-I09',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const c = esUuid(runId) ? await tx.ejecucionDeCalculo.findUnique({ where: { id: runId }, include: INCLUIR_CORRIDA }) : null;
        if (!c) throw this.ejecutor.noRevelable({ operacion: 'API-CAL-03', actorId: actor.identidadId, recurso }, ctx);
        await this.decidir(tx, 'API-CAL-03', actor, c.evaluacion.asesoradoId, recurso, ctx);
        await exigirCapacidadAntropometrica(tx, actor.identidadId);
        // El PDP decide sobre el titular; la propiedad se compara después, con el mismo 404 (DL-057).
        if (c.evaluacion.profesionalId !== actor.identidadId) {
          throw this.ejecutor.noRevelable({ operacion: 'API-CAL-03', actorId: actor.identidadId, recurso, sujetoId: c.evaluacion.asesoradoId }, ctx);
        }
        const referencias = await this.referencias(tx, c.evaluacion.asesoradoId, actor.identidadId);
        const nombre = await nombreVisibleDe(tx, c.autorId);
        return { data: corridaApi(c, () => nombre, referencias.get(c.finalidad) ?? null) };
      },
    });
  }

  // ─── API-CAL-04 · adoptar o reemplazar la referencia ───────────────────────────────────────
  /**
   * «Reemplazar referencia crea historia; no muta la Ejecución» (09 §21.6). La referencia anterior se conserva
   * encadenada, y con un token desactualizado la respuesta es 409: nadie pisa la decisión de otro momento.
   *
   * Solo se adopta una corrida de una evaluación **registrada**: el contenido de preparación no adquiere autoridad
   * histórica por persistirse (REG-06-215), y una referencia profesional es autoridad histórica.
   */
  adoptar(actor: ActorAutenticado, adviseeId: string, purpose: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'ReferenciaDeCalculo', id: `${adviseeId}:${purpose}` };
    const finalidad = FINALIDAD_DESDE_API[purpose as 'ANTHROPOMETRIC_SUPPORT'];
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-CAL-04',
      casoDeUso: 'UC-I09',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: AdoptarReferenciaRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId, purpose },
      efecto: async (tx, pedido, procedencia) => {
        if (!finalidad) throw errores.recursoNoEncontrado();
        const titular = await this.decidir(tx, 'API-CAL-04', actor, adviseeId, { tipo: 'Asesorado', id: adviseeId }, ctx);
        await exigirCapacidadAntropometrica(tx, actor.identidadId);

        const corrida = esUuid(pedido.calculationRunId)
          ? await tx.ejecucionDeCalculo.findUnique({ where: { id: pedido.calculationRunId }, include: INCLUIR_CORRIDA })
          : null;
        // Una corrida de otro asesorado, o de otro profesional, no es revelable: el campo no sirve como oráculo.
        if (!corrida || corrida.evaluacion.asesoradoId !== titular || corrida.evaluacion.profesionalId !== actor.identidadId) {
          throw this.ejecutor.noRevelable({ operacion: 'API-CAL-04', actorId: actor.identidadId, recurso }, ctx);
        }
        if (corrida.evaluacion.estado !== 'REGISTRADA') {
          throw new ErrorDeApi(
            422,
            CodigoDeError.CALCULATION_REFERENCE_NOT_COMPATIBLE,
            'Ese cálculo es de una evaluación en preparación. Para dejarlo como referencia, registrá antes la evaluación.',
          );
        }

        const actual = await tx.referenciaDeCalculo.findFirst({
          where: { asesoradoId: titular, profesionalId: actor.identidadId, finalidad, sucesora: null },
        });
        const evaluacion = evaluarAdopcion(
          { ejecucionId: corrida.id, asesoradoId: corrida.evaluacion.asesoradoId, finalidad: corrida.finalidad },
          {
            asesoradoId: titular,
            finalidad,
            actual: actual ? { referenciaId: actual.id, ejecucionId: actual.ejecucionId, finalidad: actual.finalidad, version: `v${actual.version}` } : null,
            expectedVersion: pedido.expectedVersion ?? null,
          },
        );
        if (!evaluacion.adopta) {
          if (evaluacion.motivo === 'VERSION_DESACTUALIZADA') {
            throw new ErrorDeApi(409, CodigoDeError.VERSION_CONFLICT, 'La referencia cambió desde que la leíste. Volvé a consultarla antes de reemplazarla.');
          }
          if (evaluacion.motivo === 'YA_ES_LA_REFERENCIA') {
            const nombreActual = await nombreVisibleDe(tx, actor.identidadId);
            return { estadoHttp: 200, cuerpo: { data: referenciaApi(actual!, () => nombreActual) }, sujetoId: titular, recurso };
          }
          throw new ErrorDeApi(422, CodigoDeError.CALCULATION_REFERENCE_NOT_COMPATIBLE, 'Esa corrida no corresponde a esta finalidad.');
        }

        const momento = await momentoDeLaBase(tx);
        const referencia = await tx.referenciaDeCalculo.create({
          data: {
            asesoradoId: titular,
            profesionalId: actor.identidadId,
            finalidad,
            ejecucionId: corrida.id,
            predecesoraId: evaluacion.sucedeA,
            version: (actual?.version ?? 0) + 1,
            fundamento: pedido.rationale?.trim() || null,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeOcurrencia: momento,
          },
        });
        await registrarEventoDeAntropometria(tx, {
          tipo: 'ReferenciaDeCalculoAdoptada',
          evaluacionId: corrida.evaluacionId,
          medicionId: null,
          actorId: actor.identidadId,
          procedencia,
          momento,
        });

        const nombre = await nombreVisibleDe(tx, actor.identidadId);
        return { estadoHttp: 201, cuerpo: { data: referenciaApi(referencia, () => nombre) }, sujetoId: titular, recurso };
      },
    });
  }

  private async decidir(tx: Tx, operacion: string, actor: ActorAutenticado, adviseeId: string, recurso: { tipo: string; id: string } | null, ctx: ContextoDeSolicitud): Promise<string> {
    const d = await this.pdp.decidirEnTransaccion(
      tx,
      { operacion, actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: adviseeId, alcance: 'ANTROPOMETRIA', recurso },
      ctx,
    );
    return d.hechos.titular?.identidadId as string;
  }

  /**
   * Las mediciones referidas: del mismo asesorado, de una misma evaluación y **del propio profesional**. Una que no
   * sea revelable para el actor devuelve el mismo 404 que una inexistente, así que el `sourceRef` no funciona como
   * oráculo de existencia (09 §20.2.1; TEST-CAL-003).
   */
  private async entradasVisibles(
    tx: Tx,
    actor: ActorAutenticado,
    titular: string,
    vinculos: readonly { inputCode: string; sourceRef: string }[],
    ctx: ContextoDeSolicitud,
  ) {
    const recurso = { tipo: 'Asesorado', id: titular };
    const ids = [...new Set(vinculos.map((v) => v.sourceRef))];
    const filas = ids.every(esUuid)
      ? await tx.medicionAntropometrica.findMany({
          where: { id: { in: ids } },
          include: { anulacion: true, evaluacion: { select: { id: true, asesoradoId: true, profesionalId: true } } },
        })
      : [];
    if (filas.length !== ids.length || filas.some((m) => m.evaluacion.asesoradoId !== titular || m.evaluacion.profesionalId !== actor.identidadId)) {
      throw this.ejecutor.noRevelable({ operacion: 'API-CAL-01', actorId: actor.identidadId, recurso }, ctx);
    }
    const evaluaciones = new Set(filas.map((m) => m.evaluacionId));
    if (evaluaciones.size !== 1) {
      throw new ErrorDeApi(422, CodigoDeError.CALCULATION_NOT_REPRODUCIBLE, 'Las entradas de una corrida son de una misma evaluación: así se puede reconstruir con qué observación se calculó.');
    }
    return { mediciones: new Map(filas.map((m) => [m.id, m])), evaluacionId: [...evaluaciones][0]! };
  }

  /**
   * Las corridas que este profesional adoptó como referencia, con el token de la referencia vigente. Es la punta de
   * la cadena, no un flag de la corrida: adoptar no toca la corrida (REG-06-207). El token viaja en la lectura
   * porque, sin él, la pantalla no puede reemplazar una referencia sin pisar la decisión anterior.
   */
  private async referencias(tx: Tx, adviseeId: string, profesionalId: string): Promise<Map<string, { ejecucionId: string; version: string }>> {
    const filas = await tx.referenciaDeCalculo.findMany({
      where: { asesoradoId: adviseeId, profesionalId, sucesora: null },
      select: { ejecucionId: true, version: true, finalidad: true },
    });
    return new Map(filas.map((f) => [f.finalidad, { ejecucionId: f.ejecucionId, version: `v${f.version}` }]));
  }

  private async nombres(tx: Tx, ids: readonly string[]): Promise<Map<string, string>> {
    const perfiles = await tx.perfilProfesional.findMany({ where: { identidadId: { in: [...new Set(ids)] } }, select: { identidadId: true, nombreVisible: true } });
    return new Map(perfiles.map((p) => [p.identidadId, p.nombreVisible ?? 'Profesional']));
  }
}
