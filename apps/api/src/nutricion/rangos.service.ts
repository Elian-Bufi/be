import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  EscribirRangosRequestSchema,
  esVersionVisible,
  nodosDelPlan,
  pesoAlDecimo,
  problemasDelPesoManual,
  rangosParaGuardar,
  rangosParaMostrar,
  type ContenidoDePlan,
  type ContenidoDeRangos,
  type EscribirRangosRequest,
  type PesoDeReferencia,
  type PesoRegistrado,
  type RangosDelPlan,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { DenegacionDelPdp, PdpService } from '../autorizacion/pdp.service';
import { magnitudEfectiva } from '../antropometria/lectura-antropometria';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecutorNutricional, esUuid } from './ejecutor';
import { fechaLocalEn, ZONA_POR_DEFECTO } from './zona';

type Tx = Prisma.TransactionClient;

interface VersionDelProfesional {
  readonly id: string;
  readonly estado: 'BORRADOR' | 'ACTIVADA';
  readonly contenido: ContenidoDePlan;
  readonly titularId: string;
}

const noEditable = () =>
  new ErrorDeApi(422, CodigoDeError.PLAN_NOT_EDITABLE, 'Esta versión está activada: sus rangos quedan como se activaron. Para cambiarlos, creá una nueva versión a partir de esta.');
/** Sin permiso, sin la medición o sin peso: el mismo problema, que no dice nada del peso. */
const pesoNoDisponible = () => errores.validacionFallida([{ code: 'BODY_WEIGHT_NOT_AVAILABLE', path: 'bodyWeight.measurementId' }]);

/**
 * API-PLN-02 y API-PLN-03 (WP-EDITORES-PROFESIONAL ED-34; WP-TABLERO-ALTA-GAMA TB-39; decisión de Dirección del
 * 2026-11-13, «Último peso, guardado en gramos») · Los rangos de macronutrientes de una versión del plan de Nutrición.
 *
 * - **Solo el profesional del plan,** con el PDP de Nutrición: lo ajeno, lo descartado o lo inexistente es el mismo 404, y
 *   la persona tampoco los lee (su plan, en «Hoy», no cambia).
 * - **El peso registrado, con el PDP de Antropometría:** la decisión se toma y se registra en cada lectura y en cada
 *   escritura que lo usa. Denegada, la API no devuelve el peso por ningún camino: ni el último registrado, ni el guardado
 *   (se retienen el peso y los g/kg, `rangosParaMostrar`), ni en el error, que es el mismo para «sin permiso», «no existe»
 *   y «no hay peso».
 * - **El último peso** es el más reciente que este profesional puede leer en Antropometría, con la misma regla que la
 *   evolución (API-ANT-06): sus evaluaciones registradas, la medición vigente y su corrección; en kg, al décimo.
 * - **Lo guardado no se mueve:** escribir guarda los gramos y el peso del que salieron; leer los devuelve tal cual. Un
 *   pesaje nuevo solo aparece como `latestWeight`, para que el editor avise; recalcular es volver a escribir con ese peso.
 * - **Su propia revisión:** los rangos van en su tabla, con una revisión aparte de la versión del borrador, así no chocan
 *   con el autoguardado de la estructura. Activada la versión, quedan fijos con ella (la base lo garantiza).
 */
@Injectable()
export class RangosDeNutricionService {
  constructor(
    private readonly ejecutor: EjecutorNutricional,
    private readonly pdp: PdpService,
  ) {}

  // ─── API-PLN-02 ────────────────────────────────────────────────────────────────────────────
  leer(actor: ActorAutenticado, planId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: RangosDelPlan }> {
    sinParametrosDeQuery(query);
    const recurso = { tipo: 'VersionDePlanNutricional', id: planId };
    return this.ejecutor.leer({
      operacion: 'API-PLN-02',
      casoDeUso: 'UC-P10',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const v = await this.versionDelProfesional(tx, 'API-PLN-02', actor, planId, ctx, false);
        const fila = await tx.rangosDePlanNutricional.findUnique({ where: { versionDePlanId: v.id }, select: { revision: true, contenido: true } });
        return { data: await this.respuesta(tx, 'API-PLN-02', actor, v, fila, ctx) };
      },
    });
  }

  // ─── API-PLN-03 ────────────────────────────────────────────────────────────────────────────
  escribir(actor: ActorAutenticado, planId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'VersionDePlanNutricional', id: planId };
    return this.ejecutor.escribir({
      operacion: 'API-PLN-03',
      casoDeUso: 'UC-P10',
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: EscribirRangosRequestSchema,
      cuerpo,
      efecto: async (tx, pedido) => {
        const v = await this.versionDelProfesional(tx, 'API-PLN-03', actor, planId, ctx, true);
        // Como al editar el borrador: la inmutabilidad se informa antes que la revisión.
        if (v.estado !== 'BORRADOR') throw noEditable();
        const [actual] = await tx.$queryRaw<{ revision: number; contenido: ContenidoDeRangos }[]>`
          SELECT "revision", "contenido" FROM "rangos_de_plan_nutricional" WHERE "version_de_plan_id" = ${v.id}::uuid FOR UPDATE`;
        if (pedido.expectedRevision !== (actual?.revision ?? 0)) throw errores.conflictoDeVersion();
        const peso = await this.pesoPedido(tx, pedido.bodyWeight, actual?.contenido.bodyWeight ?? null, actor, v, ctx);
        const r = rangosParaGuardar(pedido.dayTypes, peso, nodosDelPlan(v.contenido.dayTypes));
        if (!r.ok) throw errores.validacionFallida([...r.issues]);
        const contenido = r.contenido as unknown as Prisma.InputJsonValue;
        const fila = actual
          ? await tx.rangosDePlanNutricional.update({ where: { versionDePlanId: v.id }, data: { revision: actual.revision + 1, contenido }, select: { revision: true, contenido: true } })
          : await tx.rangosDePlanNutricional.create({ data: { versionDePlanId: v.id, revision: 1, contenido }, select: { revision: true, contenido: true } });
        return { estadoHttp: 200, cuerpo: { data: await this.respuesta(tx, 'API-PLN-03', actor, v, fila, ctx) }, sujetoId: v.titularId, recurso };
      },
    });
  }

  // ─── Auxiliares ─────────────────────────────────────────────────────────────────────────────

  /** La respuesta de las dos operaciones: lo guardado, tal cual, con el peso retenido si Antropometría no está habilitada. */
  private async respuesta(
    tx: Tx,
    operacion: string,
    actor: ActorAutenticado,
    v: VersionDelProfesional,
    fila: { revision: number; contenido: Prisma.JsonValue } | null,
    ctx: ContextoDeSolicitud,
  ): Promise<RangosDelPlan> {
    const habilitada = await this.antropometriaHabilitada(tx, operacion, actor, v, ctx);
    const vista = rangosParaMostrar((fila?.contenido as unknown as ContenidoDeRangos | undefined) ?? null, nodosDelPlan(v.contenido.dayTypes), habilitada);
    return {
      planId: v.id,
      state: v.estado === 'ACTIVADA' ? 'ACTIVATED' : 'DRAFT',
      revision: fila?.revision ?? 0,
      bodyWeight: vista.bodyWeight,
      bodyWeightWithheld: vista.bodyWeightWithheld,
      anthropometry: { enabled: habilitada, latestWeight: habilitada ? await ultimoPesoRegistrado(tx, actor.identidadId, v.titularId) : null },
      dayTypes: vista.dayTypes.map((d) => ({ ...d, meals: [...d.meals] })),
    };
  }

  /**
   * El peso que pide la escritura:
   * - a mano, con sus topes y sin fecha futura;
   * - registrado, solo con Antropometría habilitada: el guardado, si es el mismo (se conserva tal cual, sin releerlo), o el
   *   último que este profesional puede ver. Uno que ya no es el último es `BODY_WEIGHT_OUTDATED`; sin permiso, sin la
   *   medición o sin peso, `BODY_WEIGHT_NOT_AVAILABLE`.
   */
  private async pesoPedido(
    tx: Tx,
    pedido: EscribirRangosRequest['bodyWeight'],
    guardado: PesoDeReferencia | null,
    actor: ActorAutenticado,
    v: VersionDelProfesional,
    ctx: ContextoDeSolicitud,
  ): Promise<PesoDeReferencia | null> {
    if (!pedido) return null;
    if (pedido.source === 'MANUAL') {
      const issues = problemasDelPesoManual(pedido.valueKg, pedido.measuredOn, fechaLocalEn(new Date(), ZONA_POR_DEFECTO));
      if (issues.length > 0) throw errores.validacionFallida(issues);
      return { source: 'MANUAL', valueKg: pedido.valueKg, measuredOn: pedido.measuredOn, measurementId: null };
    }
    if (!(await this.antropometriaHabilitada(tx, 'API-PLN-03', actor, v, ctx))) throw pesoNoDisponible();
    if (guardado?.source === 'RECORDED' && guardado.measurementId === pedido.measurementId) return guardado;
    const ultimo = await ultimoPesoRegistrado(tx, actor.identidadId, v.titularId);
    if (ultimo && ultimo.measurementId === pedido.measurementId) return { source: 'RECORDED', valueKg: ultimo.valueKg, measuredOn: ultimo.measuredOn, measurementId: ultimo.measurementId };
    if (ultimo && esUuid(pedido.measurementId) && (await tx.medicionAntropometrica.count({ where: { id: pedido.measurementId, ...pesosVisibles(actor.identidadId, v.titularId) } })) > 0) {
      throw errores.validacionFallida([{ code: 'BODY_WEIGHT_OUTDATED', path: 'bodyWeight.measurementId' }]);
    }
    throw pesoNoDisponible();
  }

  /**
   * ¿La persona le habilitó Antropometría a este profesional? Decide el PDP, como en API-ANT-06. La decisión queda
   * registrada también si se deniega: leer el plan no es leer el peso, y por eso no responde un 404.
   */
  private async antropometriaHabilitada(tx: Tx, operacion: string, actor: ActorAutenticado, v: VersionDelProfesional, ctx: ContextoDeSolicitud): Promise<boolean> {
    try {
      await this.pdp.decidirEnTransaccion(
        tx,
        { operacion, actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: v.titularId, alcance: 'ANTROPOMETRIA', recurso: { tipo: 'VersionDePlanNutricional', id: v.id } },
        ctx,
      );
      return true;
    } catch (e) {
      if (!(e instanceof DenegacionDelPdp)) throw e;
      await tx.decisionDeAcceso.createMany({ data: [e.decision] });
      return false;
    }
  }

  /**
   * La versión del profesional del plan, con el PDP de Nutrición decidido. Lo inexistente, lo descartado y lo ajeno: el
   * mismo 404 (DL-057; TB-47). Para escribir, bloquea el plan y la versión en el orden de siempre (PDP → plan → versión).
   */
  private async versionDelProfesional(tx: Tx, operacion: string, actor: ActorAutenticado, planId: string, ctx: ContextoDeSolicitud, bloquear: boolean): Promise<VersionDelProfesional> {
    const recurso = { tipo: 'VersionDePlanNutricional', id: planId };
    const v = esUuid(planId)
      ? await tx.versionDePlanNutricional.findUnique({ where: { id: planId }, select: { id: true, planId: true, plan: { select: { profesionalId: true, asesoradoId: true } } } })
      : null;
    if (!v) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso }, ctx);
    const titularId = v.plan.asesoradoId;
    await this.pdp.decidirEnTransaccion(tx, { operacion, actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId, alcance: 'NUTRICION', recurso }, ctx);
    if (v.plan.profesionalId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso, sujetoId: titularId }, ctx);
    if (bloquear) await tx.$queryRaw`SELECT 1 FROM "plan_nutricional" WHERE "id" = ${v.planId}::uuid FOR NO KEY UPDATE`;
    const [fila] = bloquear
      ? await tx.$queryRaw<{ estado: string; contenido: ContenidoDePlan }[]>`
          SELECT "estado"::text AS "estado", "contenido" FROM "version_de_plan_nutricional" WHERE "id" = ${v.id}::uuid FOR NO KEY UPDATE`
      : await tx.$queryRaw<{ estado: string; contenido: ContenidoDePlan }[]>`
          SELECT "estado"::text AS "estado", "contenido" FROM "version_de_plan_nutricional" WHERE "id" = ${v.id}::uuid`;
    if (!fila || !esVersionVisible(fila.estado as 'BORRADOR' | 'ACTIVADA' | 'DESCARTADA')) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso, sujetoId: titularId }, ctx);
    return { id: v.id, estado: fila.estado as 'BORRADOR' | 'ACTIVADA', contenido: fila.contenido, titularId };
  }
}

/** Los pesos que este profesional puede leer de la persona: los de sus evaluaciones registradas, sin anular (API-ANT-06). */
const pesosVisibles = (profesionalId: string, titularId: string) =>
  ({ metrica: 'peso', anulacion: { is: null }, evaluacion: { asesoradoId: titularId, profesionalId, estado: 'REGISTRADA' } }) satisfies Prisma.MedicionAntropometricaWhereInput;

/**
 * El último peso registrado que este profesional puede leer: el de la toma más reciente, con su corrección vigente, en kg
 * y al décimo. Una toma en otra unidad no se convierte en silencio (REG-06-09): se saltea.
 */
export async function ultimoPesoRegistrado(tx: Tx, profesionalId: string, titularId: string): Promise<PesoRegistrado | null> {
  const filas = await tx.medicionAntropometrica.findMany({
    where: pesosVisibles(profesionalId, titularId),
    include: { correcciones: { orderBy: { momentoDeRegistro: 'asc' } } },
    orderBy: [{ momentoDeOcurrencia: 'desc' }, { momentoDeRegistro: 'desc' }],
    take: 20,
  });
  for (const f of filas) {
    const m = magnitudEfectiva(f);
    const kg = m && m.unit === 'kg' ? pesoAlDecimo(m.value) : null;
    if (kg !== null) return { measurementId: f.id, valueKg: kg, measuredOn: fechaLocalEn(f.momentoDeOcurrencia, ZONA_POR_DEFECTO) };
  }
  return null;
}
