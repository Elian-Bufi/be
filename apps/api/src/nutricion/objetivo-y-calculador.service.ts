import { Injectable } from '@nestjs/common';
import {
  calcularObjetivo,
  nombreDeMetrica,
  ObjetivoConReferenciaRequestSchema,
  type ComposicionDeLaToma,
  type DatosUsados,
  type EstadoDeLaReferencia,
  type ObjetivoConReferenciaRequest,
  type ParametrosDelCalculo,
  type ReferenciaYCalculo,
  type ResultadoDelCalculo,
  type TomaDeReferencia,
  type TomasDeReferenciaResponse,
} from '@be/domain';
import type { CalculoDelObjetivoNutricional, Prisma } from '@prisma/client';
import { DenegacionDelPdp, PdpService } from '../autorizacion/pdp.service';
import { magnitudEfectiva } from '../antropometria/lectura-antropometria';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecutorNutricional, esUuid } from './ejecutor';
import { EvaluacionesService } from './evaluaciones.service';
import { nombreVisibleDe, versionDeObjetivoApi } from './lectura-nutricion';
import { fechaLocalEn, ZONA_POR_DEFECTO } from './zona';

type Tx = Prisma.TransactionClient;

/** El motivo en la auditoría cuando se pide una toma sin Antropometría habilitada. Nunca se serializa. */
export const MOTIVO_SIN_ANTROPOMETRIA = 'ANTROPOMETRIA_NO_HABILITADA';

/**
 * Sin permiso, una toma que no existe, de otro profesional o sin registrar, o una corrida que no es de esa toma: el mismo
 * problema, que no dice nada de la toma. El motivo real, si es el permiso, queda solo en la auditoría.
 */
const tomaNoDisponible = (path: string, motivoDeAuditoria?: string) => {
  const e = errores.validacionFallida([{ code: 'MEASUREMENT_NOT_AVAILABLE', path }]);
  return motivoDeAuditoria ? new ErrorDeApi(e.status, e.code, e.mensajeSeguro, e.details, motivoDeAuditoria) : e;
};

/** Lo que se guarda en `contenido`: lo que se usó y lo que dio, tal cual. */
interface ContenidoDelCalculo {
  readonly reference: { readonly source: 'RECORDED' | 'MANUAL'; readonly evaluationId: string | null; readonly measuredOn: string; readonly occurredAt: string | null };
  readonly data: DatosUsados;
  readonly parameters: ParametrosDelCalculo | null;
  readonly result: ResultadoDelCalculo | null;
}

const METRICAS_DE_LA_TOMA = ['peso', 'talla', 'edad'] as const;
const UNIDAD_DE_LA_METRICA: Readonly<Record<(typeof METRICAS_DE_LA_TOMA)[number], string>> = { peso: 'kg', talla: 'cm', edad: 'años' };
const MAXIMO_DE_TOMAS = 12;
const aDosDecimales = (x: number): number => Math.round(x * 100) / 100;

/**
 * API-OBC-01 a 03 (WP-OBJETIVO-Y-CALCULADOR, DL-186; pedido de Dirección del 2026-11-19) · El objetivo con una toma de
 * referencia y el calculador de macros.
 *
 * - **Solo el profesional de Nutrición de la persona,** con el PDP de Nutrición: lo ajeno o lo inexistente, el mismo 404.
 * - **La toma, con el PDP de Antropometría,** decidido y registrado en cada lectura y en cada escritura (la denegada de una
 *   escritura, aparte: queda aunque se rechace). Denegada, no sale ninguna toma por ningún camino: ni sus valores, ni que
 *   existe, ni en el error, que es el mismo para «sin permiso», «no existe» y «no es tuya».
 * - **Las tomas son las del profesional:** sus evaluaciones registradas, con el valor vigente de cada medición (con su
 *   corrección; lo anulado no) y las corridas vigentes de la toma, como la evolución (API-ANT-06).
 * - **Lo guardado no se mueve:** la versión del objetivo y su cálculo se escriben juntos, y el cálculo lo rehace el
 *   servidor con la misma función del dominio. Una toma más nueva, una corrección o una anulación solo se avisan al leer.
 */
@Injectable()
export class ObjetivoYCalculadorService {
  constructor(
    private readonly ejecutor: EjecutorNutricional,
    private readonly pdp: PdpService,
    private readonly evaluaciones: EvaluacionesService,
  ) {}

  // ─── API-OBC-01 ────────────────────────────────────────────────────────────────────────────
  tomas(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<TomasDeReferenciaResponse> {
    sinParametrosDeQuery(query);
    const recurso = { tipo: 'Asesorado', id: adviseeId };
    return this.ejecutor.leer({
      operacion: 'API-OBC-01',
      casoDeUso: 'UC-P09',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const asesoradoId = await this.decidirNutricion(tx, 'API-OBC-01', actor, adviseeId, ctx);
        const habilitada = await this.antropometriaHabilitada(tx, 'API-OBC-01', actor, asesoradoId, recurso, ctx, 'en-la-transaccion');
        if (!habilitada) return { data: { anthropometryEnabled: false, measurements: [] } };
        return { data: { anthropometryEnabled: true, measurements: await tomasDe(tx, actor.identidadId, asesoradoId) } };
      },
    });
  }

  // ─── API-OBC-02 ────────────────────────────────────────────────────────────────────────────
  crear(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'Asesorado', id: adviseeId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-OBC-02',
      casoDeUso: 'UC-P09',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: ObjetivoConReferenciaRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        const asesoradoId = await this.decidirNutricion(tx, 'API-OBC-02', actor, adviseeId, ctx);
        const { referencia, datos, evaluacionId, habilitada } = await this.referenciaPedida(tx, pedido, actor, asesoradoId, recurso, ctx);
        const result = pedido.parameters ? calcularObjetivo(datos, pedido.parameters) : null;
        const version = await this.evaluaciones.emitirVersionDeObjetivo(tx, { profesionalId: actor.identidadId, asesoradoId, contenido: pedido.objective, revisionDeOrigenId: null, procedencia });
        const contenido: ContenidoDelCalculo = { reference: referencia, data: datos, parameters: pedido.parameters, result };
        const fila = await tx.calculoDelObjetivoNutricional.create({
          data: {
            versionDeObjetivoId: version.id,
            profesionalId: actor.identidadId,
            asesoradoId,
            evaluacionAntropometricaId: evaluacionId,
            contenido: contenido as unknown as Prisma.InputJsonValue,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
        });
        const nombre = await nombreVisibleDe(tx, actor.identidadId);
        return {
          estadoHttp: 201,
          cuerpo: { data: { objective: versionDeObjetivoApi(version, { profesionalId: actor.identidadId, asesoradoId }, true, nombre), calculation: calculoApi(fila, habilitada) } },
          sujetoId: asesoradoId,
          recurso: { tipo: 'VersionDeObjetivoNutricional', id: version.id },
        };
      },
    });
  }

  // ─── API-OBC-03 ────────────────────────────────────────────────────────────────────────────
  leer(actor: ActorAutenticado, versionId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud) {
    sinParametrosDeQuery(query);
    const recurso = { tipo: 'VersionDeObjetivoNutricional', id: versionId };
    return this.ejecutor.leer({
      operacion: 'API-OBC-03',
      casoDeUso: 'UC-P09',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const v = esUuid(versionId)
          ? await tx.versionDeObjetivoNutricional.findUnique({ where: { id: versionId }, select: { id: true, objetivo: { select: { profesionalId: true, asesoradoId: true } }, calculo: true } })
          : null;
        if (!v) throw this.ejecutor.noRevelable({ operacion: 'API-OBC-03', actorId: actor.identidadId, recurso }, ctx);
        const titularId = v.objetivo.asesoradoId;
        await this.pdp.decidirEnTransaccion(tx, { operacion: 'API-OBC-03', actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId, alcance: 'NUTRICION', recurso }, ctx);
        if (v.objetivo.profesionalId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-OBC-03', actorId: actor.identidadId, recurso, sujetoId: titularId }, ctx);
        const habilitada = await this.antropometriaHabilitada(tx, 'API-OBC-03', actor, titularId, recurso, ctx, 'en-la-transaccion');
        const anthropometry = await estadoDeLaReferencia(tx, actor.identidadId, titularId, v.calculo, habilitada);
        return { data: { objectiveVersionId: v.id, calculation: v.calculo ? calculoApi(v.calculo, habilitada) : null, anthropometry } };
      },
    });
  }

  // ─── Auxiliares ─────────────────────────────────────────────────────────────────────────────

  /**
   * La referencia pedida, resuelta en el servidor: de una toma, sus valores vigentes (lo que la toma no tiene, de lo
   * escrito a mano); a mano, lo escrito, sin fecha futura y con la masa libre de grasa menor que el peso.
   */
  private async referenciaPedida(
    tx: Tx,
    pedido: ObjetivoConReferenciaRequest,
    actor: ActorAutenticado,
    asesoradoId: string,
    recurso: { tipo: string; id: string },
    ctx: ContextoDeSolicitud,
  ): Promise<{ referencia: ContenidoDelCalculo['reference']; datos: DatosUsados; evaluacionId: string | null; habilitada: boolean }> {
    const r = pedido.reference;
    if (r.source === 'MANUAL') {
      const issues: { code: string; path: string }[] = [];
      if (r.measuredOn > fechaLocalEn(new Date(), ZONA_POR_DEFECTO)) issues.push({ code: 'DATE_IN_FUTURE', path: 'reference.measuredOn' });
      if (r.leanMassKg !== null && r.weightKg !== null && r.leanMassKg >= r.weightKg) issues.push({ code: 'LEAN_MASS_NOT_BELOW_WEIGHT', path: 'reference.leanMassKg' });
      if (issues.length > 0) throw errores.validacionFallida(issues);
      const aMano = (x: number | null) => (x === null ? null : { value: x, origin: 'MANUAL' as const });
      return {
        referencia: { source: 'MANUAL', evaluationId: null, measuredOn: r.measuredOn, occurredAt: null },
        datos: {
          weightKg: aMano(r.weightKg),
          heightCm: aMano(r.heightCm),
          ageYears: aMano(r.ageYears),
          leanMassKg: r.leanMassKg === null ? null : { value: r.leanMassKg, origin: 'MANUAL', method: r.leanMassNote, bodyFatValue: null },
        },
        evaluacionId: null,
        habilitada: true,
      };
    }
    const habilitada = await this.antropometriaHabilitada(tx, 'API-OBC-02', actor, asesoradoId, recurso, ctx, 'aparte');
    if (!habilitada) throw tomaNoDisponible('reference.evaluationId', MOTIVO_SIN_ANTROPOMETRIA);
    const [toma] = esUuid(r.evaluationId) ? await tomasDe(tx, actor.identidadId, asesoradoId, r.evaluationId) : [];
    if (!toma) throw tomaNoDisponible('reference.evaluationId');
    const corrida = r.leanMassCalculationId === null ? null : (toma.composition.find((c) => c.calculationId === r.leanMassCalculationId) ?? null);
    if (r.leanMassCalculationId !== null && (!corrida || corrida.leanMassKg === null)) throw tomaNoDisponible('reference.leanMassCalculationId');
    const deLaToma = (x: number | null) => (x === null ? null : { value: x, origin: 'MEASUREMENT' as const });
    const oAMano = (x: number | null, escrito: number | null) => (x !== null ? deLaToma(x) : escrito === null ? null : { value: escrito, origin: 'MANUAL' as const });
    return {
      referencia: { source: 'RECORDED', evaluationId: toma.evaluationId, measuredOn: toma.measuredOn, occurredAt: toma.occurredAt },
      datos: {
        weightKg: deLaToma(toma.weightKg),
        heightCm: oAMano(toma.heightCm, r.additions.heightCm),
        ageYears: oAMano(toma.ageYears, r.additions.ageYears),
        leanMassKg: corrida
          ? { value: corrida.leanMassKg as number, origin: corrida.unit === 'kg' ? 'CALCULATION' : 'FROM_BODY_FAT', method: corrida.label, bodyFatValue: corrida.unit === '%' ? corrida.value : null }
          : null,
      },
      evaluacionId: toma.evaluationId,
      habilitada,
    };
  }

  /** El PDP de Nutrición con la persona; devuelve su identidad. Sin vínculo o sin persona: el 404 de lo inexistente. */
  private async decidirNutricion(tx: Tx, operacion: string, actor: ActorAutenticado, adviseeId: string, ctx: ContextoDeSolicitud): Promise<string> {
    const d = await this.pdp.decidirEnTransaccion(
      tx,
      { operacion, actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: adviseeId, alcance: 'NUTRICION', recurso: { tipo: 'Asesorado', id: adviseeId } },
      ctx,
    );
    return d.hechos.titular?.identidadId as string;
  }

  /**
   * ¿La persona le habilitó Antropometría a este profesional? Decide el PDP y la decisión queda registrada también si se
   * deniega (en una escritura, aparte: el intento queda aunque la escritura se rechace), como en API-PLN-02 y 03.
   */
  private async antropometriaHabilitada(
    tx: Tx,
    operacion: string,
    actor: ActorAutenticado,
    titularId: string,
    recurso: { tipo: string; id: string },
    ctx: ContextoDeSolicitud,
    registro: 'en-la-transaccion' | 'aparte',
  ): Promise<boolean> {
    try {
      await this.pdp.decidirEnTransaccion(tx, { operacion, actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId, alcance: 'ANTROPOMETRIA', recurso }, ctx);
      return true;
    } catch (e) {
      if (!(e instanceof DenegacionDelPdp)) throw e;
      if (registro === 'aparte') await this.pdp.registrarDenegacion(e);
      else await tx.decisionDeAcceso.createMany({ data: [e.decision] });
      return false;
    }
  }
}

// ─── Lecturas de Antropometría ──────────────────────────────────────────────────────────────────

/**
 * Las tomas registradas del profesional con la persona, de la más nueva a la más vieja: el peso, la talla y la edad
 * vigentes (la medición más reciente de cada una en la toma, con su corrección; lo anulado y lo que está en otra unidad, no:
 * REG-06-09) y las corridas vigentes de la toma de las que sale la masa libre de grasa. Una corrida que usó una medición
 * anulada no cuenta (REG-06-221). Con `evaluacionId`, solo esa toma, si es del profesional y está registrada.
 */
async function tomasDe(tx: Tx, profesionalId: string, asesoradoId: string, evaluacionId?: string): Promise<TomaDeReferencia[]> {
  const filas = await tx.evaluacionAntropometrica.findMany({
    where: { asesoradoId, profesionalId, estado: 'REGISTRADA', ...(evaluacionId ? { id: evaluacionId } : {}) },
    orderBy: [{ momentoDeOcurrencia: 'desc' }, { momentoDeRegistro: 'desc' }],
    take: evaluacionId ? 1 : MAXIMO_DE_TOMAS * 2,
    include: {
      mediciones: {
        where: { metrica: { in: [...METRICAS_DE_LA_TOMA] }, anulacion: { is: null } },
        include: { correcciones: { orderBy: { momentoDeRegistro: 'asc' } } },
        orderBy: [{ momentoDeOcurrencia: 'desc' }, { momentoDeRegistro: 'desc' }],
      },
      ejecuciones: {
        where: { finalidad: 'SOPORTE_ANTROPOMETRICO', reemplazadaPor: { is: null } },
        include: { entradas: { include: { medicion: { select: { anulacion: { select: { id: true } } } } } } },
        orderBy: { momentoDeRegistro: 'asc' },
      },
    },
  });
  const tomas: TomaDeReferencia[] = [];
  for (const e of filas) {
    const valor = (metrica: (typeof METRICAS_DE_LA_TOMA)[number]): number | null => {
      for (const m of e.mediciones.filter((x) => x.metrica === metrica)) {
        const efectiva = magnitudEfectiva(m);
        if (efectiva && efectiva.unit === UNIDAD_DE_LA_METRICA[metrica]) return aDosDecimales(efectiva.value);
      }
      return null;
    };
    const peso = valor('peso');
    const composicion: ComposicionDeLaToma[] = [];
    for (const c of e.ejecuciones) {
      if (c.entradas.length === 0 || c.entradas.some((x) => x.medicion.anulacion)) continue;
      const enKg = c.metrica.startsWith('masa-libre-de-grasa') && c.unidad === 'kg';
      const enPorcentaje = c.metrica.startsWith('grasa-') && c.unidad === '%';
      if (!enKg && !enPorcentaje) continue;
      const v = aDosDecimales(Number(c.valor.toString()));
      const leanMassKg = enKg ? v : peso === null ? null : Math.round(peso * (1 - v / 100) * 10) / 10;
      composicion.push({ calculationId: c.id, metric: c.metrica, label: nombreDeMetrica(c.metrica), value: v, unit: enKg ? 'kg' : '%', leanMassKg: leanMassKg !== null && leanMassKg > 0 ? leanMassKg : null });
    }
    const t: TomaDeReferencia = {
      evaluationId: e.id,
      measuredOn: fechaLocalEn(e.momentoDeOcurrencia, ZONA_POR_DEFECTO),
      occurredAt: e.momentoDeOcurrencia.toISOString(),
      weightKg: peso,
      heightCm: valor('talla'),
      ageYears: valor('edad'),
      composition: composicion,
    };
    // Una toma sin ninguno de estos datos no sirve de referencia: se saltea (sigue en Antropometría).
    if (evaluacionId || t.weightKg !== null || t.heightCm !== null || t.ageYears !== null || t.composition.length > 0) tomas.push(t);
    if (tomas.length >= MAXIMO_DE_TOMAS) break;
  }
  return tomas;
}

/** Lo guardado, como lo lee el profesional: tal cual, o retenido si la toma ya no se puede ver. */
function calculoApi(fila: CalculoDelObjetivoNutricional, habilitada: boolean): ReferenciaYCalculo {
  const c = fila.contenido as unknown as ContenidoDelCalculo;
  const retenida = c.reference.source === 'RECORDED' && !habilitada;
  return {
    calculationId: fila.id,
    createdAt: fila.momentoDeRegistro.toISOString(),
    reference: { source: c.reference.source, evaluationId: retenida ? null : c.reference.evaluationId, measuredOn: retenida ? null : c.reference.measuredOn },
    anthropometryWithheld: retenida,
    restingMethod: c.parameters?.restingMethod ?? null,
    data: retenida ? null : c.data,
    parameters: retenida ? null : c.parameters,
    result: retenida ? null : c.result,
  };
}

/**
 * Cómo está hoy la referencia: la toma registrada más nueva que la de referencia (o que la fecha de los datos a mano), y
 * si los datos usados de la toma siguen siendo los de hoy. Sin Antropometría, nada.
 */
async function estadoDeLaReferencia(tx: Tx, profesionalId: string, asesoradoId: string, fila: CalculoDelObjetivoNutricional | null, habilitada: boolean): Promise<EstadoDeLaReferencia> {
  if (!habilitada || !fila) return { anthropometryEnabled: habilitada, newerMeasurement: null, referenceState: null };
  const c = fila.contenido as unknown as ContenidoDelCalculo;
  const [ultima] = await tomasDe(tx, profesionalId, asesoradoId);
  const masNueva =
    ultima && ultima.evaluationId !== c.reference.evaluationId && (c.reference.occurredAt ? ultima.occurredAt > c.reference.occurredAt : ultima.measuredOn > c.reference.measuredOn)
      ? { evaluationId: ultima.evaluationId, measuredOn: ultima.measuredOn }
      : null;
  if (c.reference.source !== 'RECORDED' || !c.reference.evaluationId) return { anthropometryEnabled: true, newerMeasurement: masNueva, referenceState: null };
  const [hoy] = await tomasDe(tx, profesionalId, asesoradoId, c.reference.evaluationId);
  const igual = (usado: { value: number; origin: string } | null, actual: number | null) => !usado || usado.origin !== 'MEASUREMENT' || usado.value === actual;
  const masa = c.data.leanMassKg;
  const masaIgual = !masa || masa.origin === 'MANUAL' || (hoy?.composition.some((x) => x.leanMassKg === masa.value) ?? false);
  const vigente = !!hoy && igual(c.data.weightKg, hoy.weightKg) && igual(c.data.heightCm, hoy.heightCm) && igual(c.data.ageYears, hoy.ageYears) && masaIgual;
  return { anthropometryEnabled: true, newerMeasurement: masNueva, referenceState: vigente ? 'CURRENT' : 'CHANGED' };
}
