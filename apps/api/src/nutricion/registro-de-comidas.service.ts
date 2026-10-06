import { Injectable } from '@nestjs/common';
import {
  AnularRegistroRequestSchema,
  CodigoDeError,
  RectificarCantidadesRequestSchema,
  RegistrarComidaRequestSchema,
  type ConsumoEntrada,
  type HoyConOpcionesResponse,
  type Procedencia,
  type RegistroDeComida,
  type ValidationIssue,
} from '@be/domain';
import type { Prisma, TipoDeEventoDeNutricion } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import { exigirA3Vigente } from '../consentimiento/a3-del-titular';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import { sinParametrosDeQuery } from '../http/validacion';
import { MediosService } from '../medios/medios.service';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase, sinDuplicar } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { esToken, token } from '../vinculo/lectura';
import { cantidadesEfectivas, mismasCantidades, type CantidadesConsumidas } from './cantidades-consumidas';
import { EjecutorNutricional, esUuid } from './ejecutor';
import { registrarEventoDeNutricion } from './eventos';
import { IngestasService, TOLERANCIA_FUTURO_MS, type PlanDelAsesorado } from './ingestas.service';
import {
  comidaDe,
  imagenesDeLasOpciones,
  INCLUIR_REGISTRO,
  instantaneasDe,
  opcionConMacros,
  registrosApi,
  versionDelRegistro,
  type IngestaConTodo,
  type OpcionDeInstantanea,
} from './lectura-registro';
import { recetaCongelada } from './opciones-de-receta';
import { ZONA_POR_DEFECTO, fechaLocalEn } from './zona';

type Tx = Prisma.TransactionClient;
const CASO_DE_USO = 'UC-P12';
const RECURSO = 'IngestaNutricional';
const INCLUIR_CON_PROFESIONAL = { ...INCLUIR_REGISTRO, versionDePlan: { select: { plan: { select: { profesionalId: true } } } } } as const;

const ejecucionInvalida = (mensaje: string, issues: ValidationIssue[]) => new ErrorDeApi(422, CodigoDeError.NUTRITION_EXECUTION_INVALID, mensaje, { issues });

/**
 * Las cantidades consumidas de un pedido, resueltas contra la opción de la instantánea (DL-121):
 * - sin confirmar: ningún ítem; lo previsto no se convierte en consumido;
 * - porciones del plan: la persona lo confirmó de forma expresa, y se guardan las cantidades de la opción;
 * - informadas: cada ítem es de la opción, una sola vez y en la unidad prescripta; `null` es «no se sabe» (nunca cero) y
 *   «no lo comí» es cero porque se declaró.
 */
function consumoResuelto(opcion: OpcionDeInstantanea, consumo: ConsumoEntrada): CantidadesConsumidas {
  if (consumo.status === 'UNCONFIRMED') return { status: 'UNCONFIRMED', items: [] };
  if (consumo.status === 'PLAN_PORTIONS') return { status: 'PLAN_PORTIONS', items: opcion.items.map((it) => ({ itemId: it.itemId, quantity: it.quantity, notEaten: false })) };
  const issues: ValidationIssue[] = [];
  const vistos = new Set<string>();
  consumo.items.forEach((c, i) => {
    const ruta = `consumption.items[${i}]`;
    if (vistos.has(c.itemId)) issues.push({ code: 'ITEM_REPETIDO', path: `${ruta}.itemId` });
    vistos.add(c.itemId);
    const item = opcion.items.find((it) => it.itemId === c.itemId);
    if (!item) issues.push({ code: 'ITEM_AJENO_A_LA_OPCION', path: `${ruta}.itemId` });
    else if (c.quantity && item.quantity && item.quantity.unit !== c.quantity.unit) issues.push({ code: 'UNIDAD_DISTINTA', path: `${ruta}.quantity.unit` });
  });
  if (issues.length > 0) throw ejecucionInvalida('Las cantidades no corresponden a la opción registrada.', issues);
  return { status: 'REPORTED', items: consumo.items.map((c) => ({ itemId: c.itemId, quantity: c.quantity, notEaten: c.notEaten })) };
}

const mismasFotos = (a: readonly string[], b: readonly string[]): boolean => a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i]);

/**
 * DL-121 — Registro v2 de comidas (API-ING-01 a 06), para la APK nueva. API-NUT-14, 15, 16 y 16-LISTA siguen igual: lo
 * nuevo va en estas rutas (09v7 T19).
 * - «Hoy» con opciones es la misma «Hoy» de API-NUT-14 (fecha civil, zona, estado del plan y día tipo), con cada opción
 *   en la forma con macros: los de las porciones del plan, calculados con las composiciones congeladas.
 * - Una sola ingesta efectiva por comida y día, de cualquier clase: una equivalente devuelve la existente (200) y una
 *   distinta es 409. Después de anular, la siguiente usa la secuencia siguiente.
 * - La comida diferente lleva texto, fotos propias o los dos; nada se convierte en cantidades ni en macros (09v9 §28).
 * - Anular y rectificar son del titular, de solo agregar, con `expectedVersion`; la ingesta original no cambia.
 */
@Injectable()
export class RegistroDeComidasService {
  constructor(
    private readonly ejecutor: EjecutorNutricional,
    private readonly pdp: PdpService,
    private readonly ingestas: IngestasService,
    private readonly medios: MediosService,
  ) {}

  // ─── API-ING-01 ────────────────────────────────────────────────────────────────────────────
  hoyConOpciones(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<HoyConOpcionesResponse> {
    const { dayTypeId, ...resto } = query;
    sinParametrosDeQuery(resto);
    if (dayTypeId !== undefined && typeof dayTypeId !== 'string') throw errores.solicitudInvalida([{ code: 'INVALID_DAY_TYPE', path: 'dayTypeId' }]);
    return this.ejecutor.leer({
      operacion: 'API-ING-01',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        const hoy = await this.ingestas.contextoDeHoy(tx, actor, 'API-ING-01', ctx);
        const delDia = await tx.ingestaNutricional.findMany({
          where: { asesoradoId: actor.identidadId, fechaLocal: new Date(`${hoy.fecha}T00:00:00.000Z`), anulacion: { is: null } },
          include: INCLUIR_REGISTRO,
          orderBy: [{ momentoDeOcurrencia: 'asc' }, { id: 'asc' }],
        });
        const base = { date: hoy.fecha, timeZone: hoy.zona, records: await registrosApi(tx, delDia) };
        if (hoy.estado !== 'AVAILABLE' || !hoy.plan) return { data: { ...base, planState: hoy.estado, plan: null, dayTypes: [], selectedDayTypeId: null, meals: [] } };
        const plan = hoy.plan;
        const dias = plan.instantanea.dayTypes;
        // No se elige un día tipo en silencio (09v9:680; DL-049): el único, o el que eligió el asesorado.
        const elegido = dias.length === 1 ? dias[0]!.dayTypeId : (dias.find((d) => d.dayTypeId === dayTypeId)?.dayTypeId ?? null);
        const imagenes = await imagenesDeLasOpciones(tx, [plan.instantanea]);
        const ocupa = (i: IngestaConTodo, mealId: string) => i.versionDePlanId === plan.versionId && (i.origen === 'PRESCRIPTA' ? i.comidaId : i.comidaDeContextoId) === mealId;
        return {
          data: {
            ...base,
            planState: 'AVAILABLE',
            plan: { planId: plan.versionId, version: token(plan.version), activatedAt: plan.momentoDeActivacion.toISOString() },
            dayTypes: dias.map((d, i) => ({ dayTypeId: d.dayTypeId, label: d.label, order: i + 1 })),
            selectedDayTypeId: elegido,
            meals: (dias.find((d) => d.dayTypeId === elegido)?.meals ?? []).map((m, j) => ({
              mealId: m.mealId,
              label: m.label,
              order: j + 1,
              options: m.options.map((o, k) => opcionConMacros(o, k + 1, imagenes)),
              recordId: delDia.find((i) => ocupa(i, m.mealId))?.id ?? null,
            })),
          },
        };
      },
    });
  }

  // ─── API-ING-02 ────────────────────────────────────────────────────────────────────────────
  registrar(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-ING-02',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: RegistrarComidaRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        const recurso = { tipo: 'VersionDePlanNutricional', id: pedido.activePlanId };
        const dueño = esUuid(pedido.activePlanId)
          ? await tx.versionDePlanNutricional.findUnique({ where: { id: pedido.activePlanId }, select: { estado: true, plan: { select: { asesoradoId: true, profesionalId: true } } } })
          : null;
        // Un plan ajeno o un borrador no existen para el asesorado (09v9:503).
        if (!dueño || dueño.plan.asesoradoId !== actor.identidadId || dueño.estado !== 'ACTIVADA') {
          throw this.ejecutor.noRevelable({ operacion: 'API-ING-02', actorId: actor.identidadId, recurso, sujetoId: dueño ? dueño.plan.asesoradoId : null }, ctx);
        }
        await this.pdp.decidirEnTransaccion(
          tx,
          { operacion: 'API-ING-02', actorDeLaDecision: actor.identidadId, profesionalId: dueño.plan.profesionalId, titularId: actor.identidadId, alcance: 'NUTRICION', recurso },
          ctx,
        );
        const plan = await this.ingestas.planVigente(tx, actor.identidadId);
        // UC-P12 E03: una referencia que ya no es la vigente no se reasigna en silencio.
        if (!plan || plan.versionId !== pedido.activePlanId) {
          throw new ErrorDeApi(422, CodigoDeError.ACTIVE_PLAN_REQUIRED, 'El plan que estás viendo ya no es el vigente. Actualizá para ver tu plan actual.');
        }
        const momento = await momentoDeLaBase(tx);
        const ocurrencia = new Date(pedido.occurredAt);
        if (ocurrencia.getTime() > momento.getTime() + TOLERANCIA_FUTURO_MS) throw ejecucionInvalida('La comida no puede ser futura.', [{ code: 'OCCURRED_AT_IN_FUTURE', path: 'occurredAt' }]);
        const fecha = fechaLocalEn(ocurrencia, ZONA_POR_DEFECTO);
        const r =
          pedido.kind === 'PLAN_OPTION'
            ? await this.registrarOpcion(tx, actor, plan, fecha, ocurrencia, pedido, procedencia)
            : await this.registrarDiferente(tx, actor, plan, fecha, ocurrencia, pedido, procedencia);
        if (r.creada) {
          await registrarEventoDeNutricion(tx, {
            tipo: 'IngestaRegistrada',
            profesionalId: plan.profesionalId,
            asesoradoId: actor.identidadId,
            recurso: { tipo: RECURSO, id: r.ingestaId },
            estadoPrevio: null,
            estadoPosterior: null,
            actorId: actor.identidadId,
            procedencia,
            momento: ocurrencia,
          });
        }
        return { estadoHttp: r.creada ? 201 : 200, cuerpo: { data: await this.leer(tx, r.ingestaId) }, sujetoId: actor.identidadId, recurso: { tipo: RECURSO, id: r.ingestaId } };
      },
    });
  }

  /** Una opción del plan: la de la instantánea vigente, con el estado de sus cantidades. */
  private async registrarOpcion(
    tx: Tx,
    actor: ActorAutenticado,
    plan: PlanDelAsesorado,
    fecha: string,
    ocurrencia: Date,
    r: { dayTypeId: string; mealId: string; optionId: string; consumption: ConsumoEntrada; observation: string | null },
    procedencia: Procedencia,
  ): Promise<{ ingestaId: string; creada: boolean }> {
    const dia = plan.instantanea.dayTypes.find((d) => d.dayTypeId === r.dayTypeId);
    const comida = dia?.meals.find((m) => m.mealId === r.mealId);
    const opcion = comida?.options.find((o) => o.optionId === r.optionId);
    if (!dia) throw ejecucionInvalida('La comida registrada no corresponde al plan vigente.', [{ code: 'DIA_TIPO_INEXISTENTE', path: 'dayTypeId' }]);
    if (!comida) throw ejecucionInvalida('La comida registrada no corresponde al plan vigente.', [{ code: 'COMIDA_INEXISTENTE', path: 'mealId' }]);
    if (!opcion) throw ejecucionInvalida('La comida registrada no corresponde al plan vigente.', [{ code: 'OPCION_INEXISTENTE', path: 'optionId' }]);
    const cantidades = consumoResuelto(opcion, r.consumption);
    const { efectiva, siguiente } = await this.ingestas.efectivaDeLaComida(tx, plan.versionId, fecha, r.mealId);
    if (efectiva) {
      const igual =
        efectiva.origen === 'PRESCRIPTA' && efectiva.diaTipoId === r.dayTypeId && efectiva.opcionId === r.optionId && mismasCantidades(cantidadesEfectivas(efectiva)!.cantidades, cantidades);
      if (!igual) throw new ErrorDeApi(409, CodigoDeError.EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY, 'Esa comida ya está registrada para ese día.', { recordId: efectiva.id });
      return { ingestaId: efectiva.id, creada: false };
    }
    const fila = await tx.ingestaNutricional.create({
      data: {
        versionDePlanId: plan.versionId,
        asesoradoId: actor.identidadId,
        origen: 'PRESCRIPTA',
        modo: 'OPCIONES_DE_PLATO',
        fechaLocal: new Date(`${fecha}T00:00:00.000Z`),
        zonaHoraria: ZONA_POR_DEFECTO,
        diaTipoId: r.dayTypeId,
        comidaId: r.mealId,
        opcionId: r.optionId,
        cantidadesConsumidas: cantidades as unknown as Prisma.InputJsonValue,
        versionDeRecetaId: recetaCongelada(opcion)?.recipeVersionId ?? null,
        observacion: r.observation || null,
        secuencia: siguiente,
        procedencia: procedencia as unknown as Prisma.InputJsonValue,
        momentoDeOcurrencia: ocurrencia,
      },
      select: { id: true },
    });
    return { ingestaId: fila.id, creada: true };
  }

  /**
   * Una comida diferente: descripción, fotos propias o las dos, con la comida del plan como contexto si corresponde a una.
   * Con contexto, ocupa esa comida ese día (la misma regla que una opción).
   */
  private async registrarDiferente(
    tx: Tx,
    actor: ActorAutenticado,
    plan: PlanDelAsesorado,
    fecha: string,
    ocurrencia: Date,
    r: { dayTypeId: string | null; mealId: string | null; description: string | null; approximateQuantity: string | null; mediaIds: string[] },
    procedencia: Procedencia,
  ): Promise<{ ingestaId: string; creada: boolean }> {
    if (r.dayTypeId) {
      const dia = plan.instantanea.dayTypes.find((d) => d.dayTypeId === r.dayTypeId);
      if (!dia) throw ejecucionInvalida('La comida indicada no corresponde al plan vigente.', [{ code: 'DIA_TIPO_INEXISTENTE', path: 'dayTypeId' }]);
      if (r.mealId && !dia.meals.some((m) => m.mealId === r.mealId)) throw ejecucionInvalida('La comida indicada no corresponde al plan vigente.', [{ code: 'COMIDA_INEXISTENTE', path: 'mealId' }]);
    }
    const descripcion = r.description?.trim() || null;
    const aproximada = r.approximateQuantity?.trim() || null;
    let secuencia = 0;
    if (r.mealId) {
      const { efectiva, siguiente } = await this.ingestas.efectivaDeLaComida(tx, plan.versionId, fecha, r.mealId);
      if (efectiva) {
        const igual =
          efectiva.origen === 'FUERA_DE_PRESCRIPCION' &&
          efectiva.diaTipoDeContextoId === r.dayTypeId &&
          (efectiva.descripcion ?? null) === descripcion &&
          (efectiva.descripcionDePorcion ?? null) === aproximada &&
          mismasFotos(efectiva.evidencias.map((e) => e.medioId), r.mediaIds);
        if (!igual) throw new ErrorDeApi(409, CodigoDeError.EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY, 'Esa comida ya está registrada para ese día.', { recordId: efectiva.id });
        return { ingestaId: efectiva.id, creada: false };
      }
      secuencia = siguiente;
    }
    // Fotos propias, disponibles, de una comida y sin unir a otro registro: si no, MEDIA_REFERENCE_INVALID con la ruta.
    const problemas = await this.medios.problemasDeReferencia(tx, actor.identidadId, r.mediaIds, 'EVIDENCIA_DE_INGESTA', (i) => `mediaIds[${i}]`);
    const unidas = new Set(
      (await tx.evidenciaVisualDeIngesta.findMany({ where: { medioId: { in: r.mediaIds.filter(esUuid) } }, select: { medioId: true } })).map((e) => e.medioId),
    );
    r.mediaIds.forEach((id, i) => {
      if (unidas.has(id) && !problemas.some((p) => p.path === `mediaIds[${i}]`)) problemas.push({ code: 'MEDIA_ALREADY_ATTACHED', path: `mediaIds[${i}]` });
    });
    if (problemas.length > 0) throw errores.referenciaDeMedioInvalida(problemas);
    const fila = await tx.ingestaNutricional.create({
      data: {
        versionDePlanId: plan.versionId,
        asesoradoId: actor.identidadId,
        origen: 'FUERA_DE_PRESCRIPCION',
        modo: 'DESCRIPCION_LIBRE',
        fechaLocal: new Date(`${fecha}T00:00:00.000Z`),
        zonaHoraria: ZONA_POR_DEFECTO,
        descripcion,
        descripcionDePorcion: aproximada,
        diaTipoDeContextoId: r.dayTypeId,
        comidaDeContextoId: r.mealId,
        secuencia,
        procedencia: procedencia as unknown as Prisma.InputJsonValue,
        momentoDeOcurrencia: ocurrencia,
      },
      select: { id: true },
    });
    for (const medioId of r.mediaIds) {
      // REG-06-133: la foto queda unida a la ingesta con su autoría, su momento y su procedencia. Dos registros a la vez con
      // la misma foto: la base deja pasar uno.
      await sinDuplicar(
        tx.evidenciaVisualDeIngesta.create({ data: { ingestaId: fila.id, medioId, autorId: actor.identidadId, procedencia: procedencia as unknown as Prisma.InputJsonValue } }),
        () => errores.referenciaDeMedioInvalida([{ code: 'MEDIA_ALREADY_ATTACHED', path: `mediaIds[${r.mediaIds.indexOf(medioId)}]` }]),
      );
    }
    return { ingestaId: fila.id, creada: true };
  }

  // ─── API-ING-03 ────────────────────────────────────────────────────────────────────────────
  /** El titular o el profesional del plan, con el mismo PDP que API-NUT-16. Uno anulado se ve, marcado como tal. */
  consultar(actor: ActorAutenticado, recordId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: RegistroDeComida }> {
    sinParametrosDeQuery(query);
    const recurso = { tipo: RECURSO, id: recordId };
    return this.ejecutor.leer({
      operacion: 'API-ING-03',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const i = esUuid(recordId) ? await tx.ingestaNutricional.findUnique({ where: { id: recordId }, include: INCLUIR_CON_PROFESIONAL }) : null;
        if (!i) throw this.ejecutor.noRevelable({ operacion: 'API-ING-03', actorId: actor.identidadId, recurso }, ctx);
        const profesionalDelPlan = i.versionDePlan.plan.profesionalId;
        const esTitular = i.asesoradoId === actor.identidadId;
        await this.pdp.decidirEnTransaccion(
          tx,
          { operacion: 'API-ING-03', actorDeLaDecision: actor.identidadId, profesionalId: esTitular ? profesionalDelPlan : actor.identidadId, titularId: i.asesoradoId, alcance: 'NUTRICION', recurso },
          ctx,
        );
        if (!esTitular && profesionalDelPlan !== actor.identidadId) {
          throw this.ejecutor.noRevelable({ operacion: 'API-ING-03', actorId: actor.identidadId, recurso, sujetoId: i.asesoradoId }, ctx);
        }
        return { data: (await registrosApi(tx, [i]))[0]! };
      },
    });
  }

  // ─── API-ING-04 ────────────────────────────────────────────────────────────────────────────
  /** Los propios, del más reciente al más viejo, con los anulados marcados; por período de fechas locales. Exige A3. */
  listarPropios(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: RegistroDeComida[]; page: unknown }> {
    const { from, to, ...resto } = query ?? {};
    const consulta = leerConsultaDeLista(resto, {});
    const desde = fechaDeConsulta(from, 'from');
    const hasta = fechaDeConsulta(to, 'to');
    if (desde && hasta && desde > hasta) throw errores.solicitudInvalida([{ code: 'PERIOD_START_AFTER_END', path: 'from' }]);
    return this.ejecutor.leer({
      operacion: 'API-ING-04',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await exigirA3Vigente(tx, actor.identidadId);
        const filas = await tx.ingestaNutricional.findMany({
          where: {
            asesoradoId: actor.identidadId,
            ...(desde || hasta ? { fechaLocal: { ...(desde ? { gte: new Date(`${desde}T00:00:00.000Z`) } : {}), ...(hasta ? { lte: new Date(`${hasta}T00:00:00.000Z`) } : {}) } } : {}),
            ...despuesDelCursor(consulta.cursor),
          },
          include: INCLUIR_REGISTRO,
          orderBy: ORDEN_DE_LISTA,
          take: consulta.limit + 1,
        });
        const { pagina, page } = paginar(filas, consulta.limit);
        return { data: await registrosApi(tx, pagina), page };
      },
    });
  }

  // ─── API-ING-05 ────────────────────────────────────────────────────────────────────────────
  /** «Completar cantidades»: una rectificación nueva, de solo agregar; la vista efectiva es la última. Solo el titular. */
  rectificar(actor: ActorAutenticado, recordId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-ING-05',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: RECURSO, id: recordId },
      clave,
      esquema: RectificarCantidadesRequestSchema,
      cuerpo,
      huellaExtra: { recordId },
      efecto: async (tx, pedido, procedencia) => {
        const i = await this.propiaBloqueada(tx, 'API-ING-05', actor, recordId, ctx);
        if (i.anulacion) throw errores.estadoEnConflicto('Este registro está deshecho: no se completan sus cantidades.');
        if (i.origen !== 'PRESCRIPTA') throw ejecucionInvalida('Una comida diferente no tiene cantidades del plan para completar.', [{ code: 'PLAN_OPTION_REQUIRED', path: 'consumption' }]);
        if (!esToken(pedido.expectedVersion, versionDelRegistro(i))) throw errores.conflictoDeVersion();
        const instantanea = (await instantaneasDe(tx, [i.versionDePlanId])).get(i.versionDePlanId);
        const opcion = instantanea && i.comidaId ? comidaDe(instantanea, i.comidaId, i.diaTipoId)?.options.find((o) => o.optionId === i.opcionId) : undefined;
        if (!opcion) throw errores.interno();
        const cantidades = consumoResuelto(opcion, pedido.consumption);
        const previa = i.rectificaciones.find((x) => !i.rectificaciones.some((s) => s.predecesoraId === x.id)) ?? null;
        await tx.rectificacionDeCantidades.create({
          data: { ingestaId: i.id, predecesoraId: previa?.id ?? null, cantidades: cantidades as unknown as Prisma.InputJsonValue, autorId: actor.identidadId, procedencia: procedencia as unknown as Prisma.InputJsonValue },
        });
        await this.evento(tx, 'CantidadesDeIngestaRectificadas', i, actor, procedencia);
        return { estadoHttp: 201, cuerpo: { data: await this.leer(tx, i.id) }, sujetoId: actor.identidadId, recurso: { tipo: RECURSO, id: i.id } };
      },
    });
  }

  // ─── API-ING-06 ────────────────────────────────────────────────────────────────────────────
  /** «Deshacer registro»: una anulación auditable, sin borrar. Libera la comida; anular dos veces es 409. */
  anular(actor: ActorAutenticado, recordId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-ING-06',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: RECURSO, id: recordId },
      clave,
      esquema: AnularRegistroRequestSchema,
      cuerpo,
      huellaExtra: { recordId },
      efecto: async (tx, pedido, procedencia) => {
        const i = await this.propiaBloqueada(tx, 'API-ING-06', actor, recordId, ctx);
        const yaDeshecho = () => errores.estadoEnConflicto('Este registro ya está deshecho.');
        if (i.anulacion) throw yaDeshecho();
        if (!esToken(pedido.expectedVersion, versionDelRegistro(i))) throw errores.conflictoDeVersion();
        const momento = await momentoDeLaBase(tx);
        await sinDuplicar(
          tx.anulacionDeIngesta.create({
            data: { ingestaId: i.id, autorId: actor.identidadId, motivo: pedido.reason?.trim() || null, procedencia: procedencia as unknown as Prisma.InputJsonValue, momentoDeOcurrencia: momento },
          }),
          yaDeshecho,
        );
        await this.evento(tx, 'IngestaAnulada', i, actor, procedencia, momento);
        return { estadoHttp: 201, cuerpo: { data: await this.leer(tx, i.id) }, sujetoId: actor.identidadId, recurso: { tipo: RECURSO, id: i.id } };
      },
    });
  }

  // ─── Apoyo ─────────────────────────────────────────────────────────────────────────────────

  /**
   * Un registro del actor como titular; uno ajeno o inexistente es el mismo 404 (el profesional no rectifica ni anula por
   * el asesorado). Después el PDP, como en API-NUT-15, y recién entonces el bloqueo de la ingesta: el orden único pone la
   * ingesta después de lo que decide el PDP (prisma/concurrencia.ts).
   */
  private async propiaBloqueada(tx: Tx, operacion: string, actor: ActorAutenticado, recordId: string, ctx: ContextoDeSolicitud): Promise<IngestaConTodo & { versionDePlan: { plan: { profesionalId: string } } }> {
    const recurso = { tipo: RECURSO, id: recordId };
    const dueño = esUuid(recordId) ? await tx.ingestaNutricional.findUnique({ where: { id: recordId }, select: { asesoradoId: true, versionDePlan: { select: { plan: { select: { profesionalId: true } } } } } }) : null;
    if (!dueño || dueño.asesoradoId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso }, ctx);
    await this.pdp.decidirEnTransaccion(
      tx,
      { operacion, actorDeLaDecision: actor.identidadId, profesionalId: dueño.versionDePlan.plan.profesionalId, titularId: actor.identidadId, alcance: 'NUTRICION', recurso },
      ctx,
    );
    // La ingesta se bloquea sin modificarla: las rectificaciones y la anulación quedan en orden.
    await tx.$queryRaw`SELECT 1 FROM "ingesta_nutricional" WHERE "id" = ${recordId}::uuid FOR NO KEY UPDATE`;
    return tx.ingestaNutricional.findUniqueOrThrow({ where: { id: recordId }, include: INCLUIR_CON_PROFESIONAL });
  }

  private async leer(tx: Tx, ingestaId: string): Promise<RegistroDeComida> {
    const i = await tx.ingestaNutricional.findUniqueOrThrow({ where: { id: ingestaId }, include: INCLUIR_REGISTRO });
    return (await registrosApi(tx, [i]))[0]!;
  }

  private async evento(
    tx: Tx,
    tipo: TipoDeEventoDeNutricion,
    i: IngestaConTodo & { versionDePlan: { plan: { profesionalId: string } } },
    actor: ActorAutenticado,
    procedencia: Procedencia,
    momento?: Date,
  ): Promise<void> {
    await registrarEventoDeNutricion(tx, {
      tipo,
      profesionalId: i.versionDePlan.plan.profesionalId,
      asesoradoId: i.asesoradoId,
      recurso: { tipo: RECURSO, id: i.id },
      estadoPrevio: null,
      estadoPosterior: null,
      actorId: actor.identidadId,
      procedencia,
      momento: momento ?? (await momentoDeLaBase(tx)),
    });
  }
}

/** Una fecha local `YYYY-MM-DD` de la query, si viene; otra cosa es 400. */
function fechaDeConsulta(valor: unknown, ruta: string): string | null {
  if (valor === undefined) return null;
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number.isNaN(new Date(`${valor}T00:00:00Z`).getTime())) {
    throw errores.solicitudInvalida([{ code: 'INVALID_DATE', path: ruta }]);
  }
  return valor;
}
