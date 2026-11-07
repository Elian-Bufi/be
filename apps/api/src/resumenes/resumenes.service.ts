import { Injectable } from '@nestjs/common';
import {
  ALCANCES,
  areasDe,
  CODIGO_DE_PROBLEMA_DE_RESUMEN,
  CodigoDeError,
  CompartirResumenesRequestSchema,
  DejarDeCompartirResumenesRequestSchema,
  ETIQUETA_DE_ALCANCE,
  PedirVerElPlanRequestSchema,
  ResponderPedidoDePlanRequestSchema,
  VERSION_VIGENTE,
  ampliaLoCompartido,
  esAreaConPlan,
  loQueRecibe,
  permisosAlAceptarUnPedido,
  problemasDeLosPermisos,
  puedePedirVerElPlan,
  renglonesDeLosPermisos,
  renglonesDelPlan,
  renglonesVigentes,
  semanasDeLoAvanzado,
  sesionesPorSemanaDeLaAgenda,
  type AreaConPlan,
  type AvanceDelPlan,
  type LoQueSeComparteDeMiAreaResponse,
  type MisResumenesCompartidosResponse,
  type NivelDeResumen,
  type PedidosDePlanResponse,
  type PlanCompartidoResponse,
  type ResumenesParaElProfesionalResponse,
  type ValidationIssue,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import { exigirA3Vigente } from '../consentimiento/a3-del-titular';
import { EvaluacionesDeEntrenamientoService } from '../entrenamiento/evaluaciones.service';
import { contenidoDeLaVersion, INCLUIR_PLAN_DE_ENTRENAMIENTO, versionDeObjetivoApi as objetivoDeEntrenamientoApi, type VersionConPlan as VersionDeEntrenamientoConPlan } from '../entrenamiento/lectura-entrenamiento';
import { PlanesDeEntrenamientoService } from '../entrenamiento/planes.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { PublicadorDeNovedades } from '../novedades/publicador';
import { EvaluacionesService } from '../nutricion/evaluaciones.service';
import { nombreVisibleDe, versionDeObjetivoApi as objetivoDeNutricionApi } from '../nutricion/lectura-nutricion';
import { PlanesService } from '../nutricion/planes.service';
import { fechaLocalEn, ZONA_POR_DEFECTO } from '../nutricion/zona';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecutorDeResumenes, esUuid } from './ejecutor';
import {
  aceptarLosPedidosDeQuienesVenElPlan,
  agregarVersionDeAutorizacionDeResumenes,
  autorizacionDeResumenesVigente,
  compartirApi,
  componentesDeLaPersona,
  crearPedidoDePlan,
  lecturasDeLoCompartido,
  momentoDeLosResumenes,
  pedidoDePlanApi,
  pedidosDePlanQueEsperan,
  planVigenteCompartido,
  profesionalesApi,
  quienesLlevanCadaArea,
  RECURSO_DEL_PLAN_COMPARTIDO,
  resolverPedidoDePlan,
  textoDelActo,
  token,
  tomarLaAutorizacionDeResumenes,
  tomarLosPedidosDePlan,
  ultimoPedidoDePlan,
  versionDelTexto,
} from './resumenes-de-la-persona';

type Tx = Prisma.TransactionClient;

/** La persona comparte lo suyo; el profesional lee lo que ella le comparte (como UC-P33 y UC-P32 de los hábitos). */
const DE_LA_PERSONA = 'UC-P33';
const DEL_PROFESIONAL = 'UC-P32';

/** El 404 de lo inexistente, idéntico, cuando la persona no le comparte el plan: el motivo, solo en la auditoría. */
const noLoComparte = (motivo: string): ErrorDeApi => new ErrorDeApi(404, CodigoDeError.RESOURCE_NOT_FOUND, 'Recurso no encontrado.', undefined, motivo);

const noDisponible = (issues: readonly ValidationIssue[]): ErrorDeApi =>
  new ErrorDeApi(422, CodigoDeError.SUMMARY_RECIPIENT_NOT_AVAILABLE, 'Uno de los permisos no se puede dar: el profesional no te acompaña hoy o esa área no se le puede compartir.', { issues });

/**
 * API-RES-01 a 04 y 06 a 10 — lo que la persona les comparte a sus profesionales de otras áreas (DL-163 D-13, ampliada por
 * Dirección el 2026-11-07; WP-TABLERO-ALTA-GAMA TB-52 a TB-56). Calca los hábitos compartidos y su pedido (DL-165 D-9 y
 * D-17). Lo que garantiza este servicio, con la base detrás (migración 20261107120100):
 * - **la autorización es de la persona y explícita**, por profesional, por área y por nivel (TA-85): ampliar es una
 *   aceptación nueva, con el A3 y el texto vigente (08 C-12); bajar, sacar a alguien o retirar corta en el momento, sin
 *   pedir nada (RNF-PRI-002). Lo compartido es lo de quien lleva el área hoy (TA-96);
 * - **el profesional** ve el plan de otra área (API-RES-06) solo con el PDP del par, la autorización vigente que lo nombra
 *   en esa área con «resumen y plan» y la fila de la matriz (TA-87 y TA-88). Si falta algo, el mismo 404 que lo inexistente.
 *   El plan es el que ve la persona: la versión ACTIVADA vigente, desde su instantánea. Cada lectura queda registrada como
 *   una decisión del PDP, y la persona la ve en API-RES-01;
 * - **pedir no concede nada** (TB-56): le llega a la persona una novedad importante, uno por vez y 7 días entre pedidos, y
 *   lo decide ella.
 */
@Injectable()
export class ResumenesService {
  constructor(
    private readonly ejecutor: EjecutorDeResumenes,
    private readonly pdp: PdpService,
    private readonly publicador: PublicadorDeNovedades,
    private readonly planesDeNutricion: PlanesService,
    private readonly planesDeEntrenamiento: PlanesDeEntrenamientoService,
    private readonly objetivosDeNutricion: EvaluacionesService,
    private readonly objetivosDeEntrenamiento: EvaluacionesDeEntrenamientoService,
  ) {}

  // ─── API-RES-01 · lo que comparto ────────────────────────────────────────────────────────────
  mios(actor: ActorAutenticado, ctx: ContextoDeSolicitud): Promise<MisResumenesCompartidosResponse> {
    return this.ejecutor.leer({
      operacion: 'API-RES-01',
      casoDeUso: DE_LA_PERSONA,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await exigirA3Vigente(tx, actor.identidadId);
        const [vigente, { componentes, nombres }, accesses] = await Promise.all([
          autorizacionDeResumenesVigente(tx, actor.identidadId),
          componentesDeLaPersona(tx, actor.identidadId),
          lecturasDeLoCompartido(tx, actor.identidadId),
        ]);
        return {
          data: {
            sharing: compartirApi(vigente),
            professionals: profesionalesApi(componentes, nombres, renglonesVigentes(vigente?.renglones ?? null, componentes)),
            text: textoDelActo(),
            accesses,
          },
        };
      },
    });
  }

  // ─── API-RES-02 · compartir, o cambiar con quiénes y en qué nivel ────────────────────────────
  compartir(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-RES-02',
      casoDeUso: DE_LA_PERSONA,
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: CompartirResumenesRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        const personaId = actor.identidadId;
        // Lo que se vio tiene que ser la última versión. Con esa misma versión se decide si amplía: ampliar pide el A3, con
        // el acto tomado (DL-115), antes del cerrojo de la autorización, como en API-HBT-03.
        const vista = await autorizacionDeResumenesVigente(tx, personaId);
        if ((vista ? token(vista.fila.version) : null) !== pedido.expectedVersion) throw errores.conflictoDeVersion();
        const antes = await componentesDeLaPersona(tx, personaId);
        const issues = problemasDeLosPermisos(antes.componentes, pedido.grants);
        if (issues.length > 0) throw noDisponible(issues);
        const anteriores = renglonesVigentes(vista?.renglones ?? null, antes.componentes);
        const amplia = ampliaLoCompartido(anteriores, renglonesDeLosPermisos({ componentes: antes.componentes, anteriores, permisos: pedido.grants, ahora: new Date(0).toISOString() }));
        const vigenteDelTipo = VERSION_VIGENTE.RESUMENES_COMPARTIDOS;
        if (amplia) {
          await exigirA3Vigente(tx, personaId, { bloquear: true });
          // La versión mostrada es la aceptada (08 §12.2): para ampliar, la vigente del tipo.
          if (pedido.textVersionId !== vigenteDelTipo.id) throw errores.versionDeConsentimientoVieja();
        } else if (pedido.textVersionId !== vigenteDelTipo.id && pedido.textVersionId !== vista?.fila.versionDeTextoId) {
          // Bajar o sacar a alguien no pide aceptar nada nuevo (TA-98): alcanza con el texto que ya había aceptado.
          throw errores.versionDeConsentimientoVieja();
        }
        await tomarLaAutorizacionDeResumenes(tx, personaId, 'escribir');
        const vigente = await autorizacionDeResumenesVigente(tx, personaId);
        if ((vigente ? token(vigente.fila.version) : null) !== pedido.expectedVersion) throw errores.conflictoDeVersion();
        // Con el cerrojo: lo de recién, otra vez. Si un vínculo cambió en el medio y ahora ampliaría sin el A3 tomado, que
        // lo vuelva a intentar.
        const { componentes } = await componentesDeLaPersona(tx, personaId);
        const problemas = problemasDeLosPermisos(componentes, pedido.grants);
        if (problemas.length > 0) throw noDisponible(problemas);
        const previos = renglonesVigentes(vigente?.renglones ?? null, componentes);
        const momento = await momentoDeLosResumenes(tx);
        const renglones = renglonesDeLosPermisos({ componentes, anteriores: previos, permisos: pedido.grants, ahora: momento.toISOString() });
        if (!amplia && ampliaLoCompartido(previos, renglones)) throw errores.conflictoConcurrente();
        const texto = versionDelTexto(pedido.textVersionId);
        if (!texto) throw errores.versionDeConsentimientoVieja();
        const fila = await agregarVersionDeAutorizacionDeResumenes(tx, { personaId, anterior: vigente?.fila ?? null, estado: 'ACTIVA', texto, renglones, procedencia, momento });
        // TB-56: compartir el plan de un área con quien lo había pedido acepta su pedido.
        await tomarLosPedidosDePlan(tx, personaId);
        await aceptarLosPedidosDeQuienesVenElPlan(tx, { personaId, renglones, procedencia, momento });
        return { estadoHttp: 200, cuerpo: await this.estado(tx, personaId), sujetoId: personaId, recurso: { tipo: 'AutorizacionDeResumenes', id: fila.id } };
      },
    });
  }

  // ─── API-RES-03 · dejar de compartir todo ────────────────────────────────────────────────────
  dejarDeCompartir(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-RES-03',
      casoDeUso: DE_LA_PERSONA,
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: DejarDeCompartirResumenesRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        const personaId = actor.identidadId;
        // Sin el A3: retirar siempre se puede (RNF-PRI-002).
        await tomarLaAutorizacionDeResumenes(tx, personaId, 'escribir');
        const vigente = await autorizacionDeResumenesVigente(tx, personaId);
        if (!vigente || vigente.fila.estado !== 'ACTIVA' || token(vigente.fila.version) !== pedido.expectedVersion) throw errores.conflictoDeVersion();
        const momento = await momentoDeLosResumenes(tx);
        const fila = await agregarVersionDeAutorizacionDeResumenes(tx, { personaId, anterior: vigente.fila, estado: 'RETIRADA', texto: null, renglones: [], procedencia, momento });
        return { estadoHttp: 200, cuerpo: await this.estado(tx, personaId), sujetoId: personaId, recurso: { tipo: 'AutorizacionDeResumenes', id: fila.id } };
      },
    });
  }

  // ─── API-RES-04 · lo que el profesional sabe de las otras áreas ──────────────────────────────
  /**
   * Quién lleva cada otra área (lo que ya dice API-CRD-01-LISTA), lo que la persona le comparte de ella, su último pedido y
   * si puede pedir. Nada depende de que haya un plan activado (TA-100).
   */
  paraElProfesional(actor: ActorAutenticado, adviseeId: string, ctx: ContextoDeSolicitud): Promise<ResumenesParaElProfesionalResponse> {
    const recurso = { tipo: 'ResumenesCompartidos', id: adviseeId };
    return this.ejecutor.leer({
      operacion: 'API-RES-04',
      casoDeUso: DEL_PROFESIONAL,
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        if (!esUuid(adviseeId)) throw this.ejecutor.noRevelable({ operacion: 'API-RES-04', actorId: actor.identidadId, recurso: null }, ctx);
        const personaId = adviseeId.toLowerCase();
        const yo = actor.identidadId;
        const permitidos = await this.pdp.decidirAlgunAlcanceEnTransaccion(
          tx,
          { operacion: 'API-RES-04', actorDeLaDecision: yo, profesionalId: yo, titularId: personaId, recurso: { tipo: 'ResumenesCompartidos', id: personaId } },
          ctx,
        );
        const scopes = ALCANCES.filter((a) => permitidos.some((p) => p.alcance === a));
        const { componentes } = await componentesDeLaPersona(tx, personaId);
        const mias = areasDe(yo, componentes);
        const llevan = await quienesLlevanCadaArea(tx, this.pdp, personaId, yo);
        await tomarLaAutorizacionDeResumenes(tx, personaId, 'leer');
        const vigente = await autorizacionDeResumenesVigente(tx, personaId);
        const recibe = loQueRecibe(yo, permitidos.map((p) => p.alcanceDeVinculoId), renglonesVigentes(vigente?.renglones ?? null, componentes));
        const momento = await momentoDeLosResumenes(tx);
        const areas = [];
        for (const area of ALCANCES.filter((a) => !mias.includes(a))) {
          const quien = llevan.get(area)?.[0] ?? null;
          const compartida = recibe.find((r) => r.area === area) ?? null;
          const ultimo = esAreaConPlan(area) ? await ultimoPedidoDePlan(tx, yo, personaId, area) : null;
          const puede = puedePedirVerElPlan({
            area,
            areasDelProfesional: mias,
            hayQuienLaLleve: quien !== null,
            yaLoVe: compartida?.level === 'SUMMARY_AND_PLAN',
            ultimoPedidoEl: ultimo?.pedidoEn.toISOString() ?? null,
            ahora: momento.toISOString(),
          });
          areas.push({
            area,
            professional: quien ? { identityId: quien.profesionalId, displayName: quien.nombre } : null,
            shared: compartida ? { level: compartida.level, since: compartida.since } : null,
            accessRequest: ultimo ? pedidoDePlanApi(ultimo) : null,
            canRequestPlan: puede.puede,
            canRequestPlanFrom: !puede.puede && puede.motivo === 'MUY_PRONTO' ? puede.desde : null,
          });
        }
        return { data: { scopes, areas } };
      },
    });
  }

  // ─── API-RES-06 · el plan vigente de un área compartida ──────────────────────────────────────
  plan(actor: ActorAutenticado, adviseeId: string, area: string, ctx: ContextoDeSolicitud): Promise<PlanCompartidoResponse> {
    const tipo = esAreaConPlan(area as never) ? RECURSO_DEL_PLAN_COMPARTIDO[area as AreaConPlan] : 'PlanCompartido';
    const recurso = { tipo, id: adviseeId };
    return this.ejecutor.leer({
      operacion: 'API-RES-06',
      casoDeUso: DEL_PROFESIONAL,
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        if (!esUuid(adviseeId) || !esAreaConPlan(area as never)) throw this.ejecutor.noRevelable({ operacion: 'API-RES-06', actorId: actor.identidadId, recurso: null }, ctx);
        const delArea = area as AreaConPlan;
        const personaId = adviseeId.toLowerCase();
        const yo = actor.identidadId;
        // El PDP primero, para el par: vínculo aceptado (ni en pausa ni terminado), B2, cuentas y el A3 de la persona. Cada
        // lectura queda en el registro de decisiones, con el área en el recurso: es lo que la persona ve en API-RES-01.
        const permitidos = await this.pdp.decidirAlgunAlcanceEnTransaccion(
          tx,
          { operacion: 'API-RES-06', actorDeLaDecision: yo, profesionalId: yo, titularId: personaId, recurso: { tipo: RECURSO_DEL_PLAN_COMPARTIDO[delArea], id: personaId } },
          ctx,
        );
        const { componentes } = await componentesDeLaPersona(tx, personaId);
        // La autorización, con su cerrojo compartido: un retiro o una baja que empezó antes ya está confirmado cuando se lee.
        await tomarLaAutorizacionDeResumenes(tx, personaId, 'leer');
        const vigente = await autorizacionDeResumenesVigente(tx, personaId);
        const compartido = await planVigenteCompartido(tx, this.pdp, { profesionalId: yo, personaId, area: delArea, permitidos, componentes, renglones: renglonesVigentes(vigente?.renglones ?? null, componentes) });
        if (compartido === 'NO_LO_VE') throw noLoComparte('PLAN_NO_COMPARTIDO');
        // TA-92: se lo comparten, pero el área no tiene un plan vigente.
        if (compartido === null) return { data: null };
        const momento = await momentoDeLosResumenes(tx);
        const base = { author: { identityId: compartido.fuenteId, displayName: await nombreVisibleDe(tx, compartido.fuenteId) }, level: 'SUMMARY_AND_PLAN' as const, sharedSince: compartido.compartidoDesde, activatedAt: compartido.activadoEn.toISOString() };
        if (delArea === 'NUTRICION') {
          // El plan como lo ve la persona: la lectura del titular, sin el origen de plantilla ni las recetas (API-NUT-09).
          const plan = await this.planesDeNutricion.leerVersion(tx, compartido.versionId, compartido.fuenteId, false);
          const objetivo = await tx.objetivoNutricional.findUnique({ where: { profesionalId_asesoradoId: { profesionalId: compartido.fuenteId, asesoradoId: personaId } } });
          const efectiva = objetivo ? await this.objetivosDeNutricion.efectivaDe(tx, objetivo.id) : null;
          const registradas = await tx.ingestaNutricional.findMany({ where: { versionDePlanId: compartido.versionId, anulacion: { is: null } }, select: { fechaLocal: true } });
          return {
            data: {
              area: 'NUTRICION',
              ...base,
              nextReviewAt: plan.nextReviewAt,
              progress: avance('MEAL_RECORDS', null, compartido.activadoEn, momento, registradas.map((r) => r.fechaLocal)),
              plan,
              objective: efectiva && objetivo ? objetivoDeNutricionApi(efectiva, objetivo, true, base.author.displayName) : null,
            },
          };
        }
        const plan = await this.planesDeEntrenamiento.leerVersion(tx, compartido.versionId, false);
        const fila = (await tx.versionDePlanDeEntrenamiento.findUniqueOrThrow({ where: { id: compartido.versionId }, include: INCLUIR_PLAN_DE_ENTRENAMIENTO })) as VersionDeEntrenamientoConPlan;
        const objetivo = await tx.objetivoDeEntrenamiento.findUnique({ where: { profesionalId_asesoradoId: { profesionalId: compartido.fuenteId, asesoradoId: personaId } } });
        const efectiva = objetivo ? await this.objetivosDeEntrenamiento.efectivaDe(tx, objetivo.id) : null;
        // Las sesiones registradas, sin las salteadas: «no realizada» es un registro, no una sesión hecha (DL-137 D-5).
        const registradas = await tx.ejecucionDeEntrenamiento.findMany({ where: { versionDePlanId: compartido.versionId, condicion: { not: 'NO_REALIZADA' } }, select: { fechaLocal: true } });
        return {
          data: {
            area: 'ENTRENAMIENTO',
            ...base,
            nextReviewAt: plan.nextReviewAt,
            progress: avance('SESSIONS', sesionesPorSemanaDeLaAgenda(contenidoDeLaVersion(fila, new Map()).contenido.agenda), compartido.activadoEn, momento, registradas.map((r) => r.fechaLocal)),
            plan,
            objective: efectiva && objetivo ? objetivoDeEntrenamientoApi(efectiva, objetivo, true, base.author.displayName) : null,
          },
        };
      },
    });
  }

  // ─── API-RES-07 · con quién se comparte lo de mi área ────────────────────────────────────────
  loQueSeComparte(actor: ActorAutenticado, adviseeId: string, ctx: ContextoDeSolicitud): Promise<LoQueSeComparteDeMiAreaResponse> {
    const recurso = { tipo: 'ResumenesCompartidos', id: adviseeId };
    return this.ejecutor.leer({
      operacion: 'API-RES-07',
      casoDeUso: DEL_PROFESIONAL,
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        if (!esUuid(adviseeId)) throw this.ejecutor.noRevelable({ operacion: 'API-RES-07', actorId: actor.identidadId, recurso: null }, ctx);
        const personaId = adviseeId.toLowerCase();
        const permitidos = await this.pdp.decidirAlgunAlcanceEnTransaccion(
          tx,
          { operacion: 'API-RES-07', actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: personaId, recurso: { tipo: 'ResumenesCompartidos', id: personaId } },
          ctx,
        );
        const mios = new Set(permitidos.map((p) => p.alcanceDeVinculoId));
        const { componentes, nombres } = await componentesDeLaPersona(tx, personaId);
        await tomarLaAutorizacionDeResumenes(tx, personaId, 'leer');
        const vigente = await autorizacionDeResumenesVigente(tx, personaId);
        const deMiArea = renglonesVigentes(vigente?.renglones ?? null, componentes).filter((r) => mios.has(r.origenId));
        const porPar = new Map<string, { area: (typeof ALCANCES)[number]; profesionalId: string; level: NivelDeResumen; since: string }>();
        for (const r of deMiArea) {
          const clave = `${r.area}|${r.profesionalId}`;
          const antes = porPar.get(clave);
          const sube = !antes || (r.nivel === 'SUMMARY_AND_PLAN' && antes.level === 'SUMMARY');
          if (sube) porPar.set(clave, { area: r.area, profesionalId: r.profesionalId, level: r.nivel, since: r.desde });
          else if (antes && antes.level === r.nivel && r.desde < antes.since) porPar.set(clave, { ...antes, since: r.desde });
        }
        const data = [...porPar.values()]
          .map((x) => ({ area: x.area, professional: { identityId: x.profesionalId, displayName: nombres.get(x.profesionalId) as string }, level: x.level, since: x.since }))
          .sort((a, b) => ALCANCES.indexOf(a.area) - ALCANCES.indexOf(b.area) || a.professional.displayName.localeCompare(b.professional.displayName, 'es'));
        return { data };
      },
    });
  }

  // ─── API-RES-08 · el profesional pide ver el plan de otra área ───────────────────────────────
  pedirVerElPlan(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'Asesorado', id: adviseeId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-RES-08',
      casoDeUso: DEL_PROFESIONAL,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: PedirVerElPlanRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        // Primero la autorización, como API-HBT-06: a quien no puede pedir, el 404 de lo inexistente.
        if (!esUuid(adviseeId)) throw this.ejecutor.noRevelable({ operacion: 'API-RES-08', actorId: actor.identidadId, recurso: null }, ctx);
        const personaId = adviseeId.toLowerCase();
        const yo = actor.identidadId;
        const permitidos = await this.pdp.decidirAlgunAlcanceEnTransaccion(tx, { operacion: 'API-RES-08', actorDeLaDecision: yo, profesionalId: yo, titularId: personaId, recurso }, ctx);
        const desde = permitidos.find((p) => p.alcance === pedido.scope);
        if (!desde) {
          // Esa área no está permitida (aunque otra sí): la decisión de esa área, con su dimensión real, da el 404.
          await this.pdp.decidirEnTransaccion(tx, { operacion: 'API-RES-08', actorDeLaDecision: yo, profesionalId: yo, titularId: personaId, alcance: pedido.scope, recurso }, ctx);
          throw this.ejecutor.noRevelable({ operacion: 'API-RES-08', actorId: yo, recurso, sujetoId: personaId, alcance: pedido.scope }, ctx);
        }
        const { componentes } = await componentesDeLaPersona(tx, personaId);
        const llevan = await quienesLlevanCadaArea(tx, this.pdp, personaId, yo);
        // El cerrojo compartido de la autorización ordena este pedido con un retiro o un cambio en curso.
        await tomarLaAutorizacionDeResumenes(tx, personaId, 'leer');
        const vigente = await autorizacionDeResumenesVigente(tx, personaId);
        const yaLoVe = renglonesDelPlan(yo, permitidos.map((p) => p.alcanceDeVinculoId), pedido.area, renglonesVigentes(vigente?.renglones ?? null, componentes)).length > 0;
        await tomarLosPedidosDePlan(tx, personaId);
        const momento = await momentoDeLosResumenes(tx);
        const ultimo = await ultimoPedidoDePlan(tx, yo, personaId, pedido.area);
        const puede = puedePedirVerElPlan({
          area: pedido.area,
          areasDelProfesional: areasDe(yo, componentes),
          hayQuienLaLleve: (llevan.get(pedido.area)?.length ?? 0) > 0,
          yaLoVe,
          ultimoPedidoEl: ultimo?.pedidoEn.toISOString() ?? null,
          ahora: momento.toISOString(),
        });
        if (!puede.puede) {
          if (puede.motivo === 'YA_LO_VE') throw new ErrorDeApi(422, CodigoDeError.PLAN_ALREADY_SHARED, 'La persona ya te comparte ese plan.');
          if (puede.motivo === 'NO_SE_PUEDE') throw new ErrorDeApi(422, CodigoDeError.PLAN_ACCESS_NOT_REQUESTABLE, 'Ese plan no se puede pedir: nadie lleva hoy esa área con la persona, o la llevás vos.');
          throw new ErrorDeApi(422, CodigoDeError.PLAN_ACCESS_REQUEST_TOO_SOON, 'Ya le pediste ver ese plan hace menos de 7 días.', { availableFrom: puede.desde as string });
        }
        // Uno pendiente de hace 7 días o más: el nuevo lo reemplaza (sigue habiendo uno solo).
        if (ultimo && ultimo.estado === 'PENDIENTE') await resolverPedidoDePlan(tx, { pedido: ultimo, estado: 'REEMPLAZADO', actorId: yo, procedencia, momento });
        const fila = await crearPedidoDePlan(tx, { profesionalId: yo, personaId, alcanceDeVinculoId: desde.alcanceDeVinculoId, alcance: pedido.scope, area: pedido.area, procedencia, momento });
        // La novedad nace en la misma transacción; el aviso push sale después, genérico (DL-133).
        await this.publicador.publicar(
          tx,
          [{ tipo: 'PEDIDO_DE_ACCESO_A_PLAN', destinatarioId: personaId, alcance: pedido.scope, fuenteId: yo, referencia: { tipo: 'PedidoDeAccesoAPlan', id: fila.id }, identidadDelHecho: fila.id, momentoDeOcurrencia: momento }],
          procedencia,
        );
        return { estadoHttp: 201, cuerpo: { data: pedidoDePlanApi(fila) }, sujetoId: personaId, recurso: { tipo: 'PedidoDeAccesoAPlan', id: fila.id } };
      },
    });
  }

  // ─── API-RES-09 · los pedidos que esperan la respuesta de la persona ─────────────────────────
  pedidosQueEsperan(actor: ActorAutenticado, ctx: ContextoDeSolicitud): Promise<PedidosDePlanResponse> {
    return this.ejecutor.leer({
      operacion: 'API-RES-09',
      casoDeUso: DE_LA_PERSONA,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await exigirA3Vigente(tx, actor.identidadId);
        const filas = await pedidosDePlanQueEsperan(tx, actor.identidadId);
        return {
          data: filas.map((f) => ({
            accessRequestId: f.id,
            version: token(f.version),
            professional: { identityId: f.profesionalId, displayName: f.nombre },
            scope: { code: f.alcance, label: ETIQUETA_DE_ALCANCE[f.alcance] },
            area: f.area as AreaConPlan,
            requestedAt: f.pedidoEn.toISOString(),
          })),
        };
      },
    });
  }

  // ─── API-RES-10 · la persona responde ────────────────────────────────────────────────────────
  /**
   * «Sí, que lo vea» es compartir (como API-RES-02, con el A3 y el texto vigente): quien pidió pasa a «resumen y plan» en esa
   * área y lo demás sigue como estaba; sin compartir todavía, solo eso. «No, por ahora» solo resuelve el pedido.
   */
  responderPedido(actor: ActorAutenticado, accessRequestId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'PedidoDeAccesoAPlan', id: accessRequestId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-RES-10',
      casoDeUso: DE_LA_PERSONA,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: ResponderPedidoDePlanRequestSchema,
      cuerpo,
      huellaExtra: { accessRequestId },
      efecto: async (tx, pedido, procedencia) => {
        const personaId = actor.identidadId;
        const comparte = pedido.answer === 'SHARE';
        if (comparte) await exigirA3Vigente(tx, personaId, { bloquear: true });
        const texto = VERSION_VIGENTE.RESUMENES_COMPARTIDOS;
        if (pedido.sharing && pedido.sharing.textVersionId !== texto.id) throw errores.versionDeConsentimientoVieja();
        if (comparte) await tomarLaAutorizacionDeResumenes(tx, personaId, 'escribir');
        await tomarLosPedidosDePlan(tx, personaId);
        const fila = esUuid(accessRequestId) ? await tx.pedidoDeAccesoAPlan.findUnique({ where: { id: accessRequestId.toLowerCase() } }) : null;
        // Ajeno o inexistente, el mismo 404.
        if (!fila || fila.asesoradoId !== personaId) throw this.ejecutor.noRevelable({ operacion: 'API-RES-10', actorId: personaId, recurso }, ctx);
        if (fila.estado !== 'PENDIENTE' || token(fila.version) !== pedido.expectedVersion) throw errores.conflictoDeVersion();
        const momento = await momentoDeLosResumenes(tx);
        if (!comparte) {
          await resolverPedidoDePlan(tx, { pedido: fila, estado: 'NO_POR_AHORA', actorId: personaId, procedencia, momento });
          return { estadoHttp: 200, cuerpo: { data: { accessRequestId: fila.id, answer: 'NOT_NOW', answeredAt: momento.toISOString() } }, sujetoId: personaId, recurso: { tipo: 'PedidoDeAccesoAPlan', id: fila.id } };
        }
        const vigente = await autorizacionDeResumenesVigente(tx, personaId);
        if ((vigente ? token(vigente.fila.version) : null) !== pedido.sharing!.expectedVersion) throw errores.conflictoDeVersion();
        const { componentes } = await componentesDeLaPersona(tx, personaId);
        const noEsta: ValidationIssue[] = [{ code: CODIGO_DE_PROBLEMA_DE_RESUMEN.NOT_AVAILABLE, path: 'accessRequestId' }];
        // Quien pidió tiene que acompañarla hoy, con el vínculo aceptado en algún área.
        if (!componentes.some((c) => c.profesionalId === fila.profesionalId && c.estado === 'ACEPTADO')) throw noDisponible(noEsta);
        const previos = renglonesVigentes(vigente?.renglones ?? null, componentes);
        const permisos = permisosAlAceptarUnPedido({ vigentes: vigente?.fila.estado === 'ACTIVA' ? previos : null, profesionalId: fila.profesionalId, area: fila.area as AreaConPlan });
        // Un permiso de antes que ya no vale (quien lo recibía ahora lleva esa área) se deja de dar; el de quien pidió, tiene que poder darse.
        const problemas = problemasDeLosPermisos(componentes, permisos);
        const delQuePidio = permisos.length - 1;
        if (problemas.some((i) => i.path === `grants[${delQuePidio}]`)) throw noDisponible(problemas.filter((i) => i.path === `grants[${delQuePidio}]`).map((i) => ({ code: i.code, path: 'accessRequestId' })));
        const validos = permisos.filter((_, i) => !problemas.some((x) => x.path === `grants[${i}]`));
        const renglones = renglonesDeLosPermisos({ componentes, anteriores: previos, permisos: validos, ahora: momento.toISOString() });
        await agregarVersionDeAutorizacionDeResumenes(tx, { personaId, anterior: vigente?.fila ?? null, estado: 'ACTIVA', texto: { id: texto.id, hash: texto.hash }, renglones, procedencia, momento });
        // El pedido queda aceptado (y el de cualquier otro que ahora ve ese plan).
        await aceptarLosPedidosDeQuienesVenElPlan(tx, { personaId, renglones, procedencia, momento });
        return { estadoHttp: 200, cuerpo: { data: { accessRequestId: fila.id, answer: 'SHARE', answeredAt: momento.toISOString() } }, sujetoId: personaId, recurso: { tipo: 'PedidoDeAccesoAPlan', id: fila.id } };
      },
    });
  }

  /** Cómo queda la autorización, para la respuesta de RES-02 y 03: con lo que esta misma transacción acaba de escribir. */
  private async estado(tx: Tx, personaId: string) {
    const [vigente, { componentes, nombres }] = await Promise.all([autorizacionDeResumenesVigente(tx, personaId), componentesDeLaPersona(tx, personaId)]);
    return { data: { sharing: compartirApi(vigente), professionals: profesionalesApi(componentes, nombres, renglonesVigentes(vigente?.renglones ?? null, componentes)) } };
  }
}

/** Lo avanzado (TA-86): las fechas civiles de lo registrado, contadas por semana en la zona de la persona. */
function avance(unit: AvanceDelPlan['unit'], plannedPerWeek: number | null, activadoEn: Date, ahora: Date, fechas: readonly Date[]): AvanceDelPlan {
  const civil = (d: Date) => fechaLocalEn(d, ZONA_POR_DEFECTO);
  return { unit, plannedPerWeek, weeks: semanasDeLoAvanzado({ activadoEl: civil(activadoEn), hoy: civil(ahora), registradas: fechas.map((f) => f.toISOString().slice(0, 10)) }) };
}
