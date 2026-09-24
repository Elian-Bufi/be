import { Injectable } from '@nestjs/common';
import {
  AbrirBorradorDeEjecucionRequestSchema,
  CodigoDeError,
  CONDICION_DE_SESION_API,
  CorregirEjecucionRequestSchema,
  EditarBorradorDeEjecucionRequestSchema,
  GRANULARIDAD_API,
  VersionEsperadaRequestSchema,
  codificarOcurrencia,
  decodificarOcurrencia,
  evaluarNuevaCorreccion,
  evaluarTransicionDeEjecucion,
  problemasDeCoherencia,
  problemasParaConfirmar,
  resolverVistaEfectiva,
  serializacionCanonica,
  sesionesDelPlan,
  type BorradorDeEjecucion,
  type CondicionDeSesion,
  type EjecucionDeEntrenamiento,
  type EjercicioRegistradoEntrada,
  type GranularidadDeRegistro,
  type HoyDeEntrenamientoResponse,
  type InstantaneaDeEntrenamiento,
  type Ocurrencia,
  type OcurrenciasDelPeriodoResponse,
  type SesionDeOcurrencia,
  type ValidationIssue,
} from '@be/domain';
import { Prisma } from '@prisma/client';
import { DenegacionDelPdp, PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { ZONA_POR_DEFECTO, fechaLocalEn, finDelDiaLocal, inicioDelDiaLocal } from '../nutricion/zona';
import { nombreDeAsesorado, token, esToken } from '../vinculo/lectura';
import { CatalogoDeEjerciciosService, type Ambito } from './catalogo.service';
import { EjecutorDeEntrenamiento, esUuid, exigirA3Vigente } from './ejecutor';
import { registrarEventoDeEntrenamiento } from './eventos';
import {
  REGISTRO_VACIO,
  ejerciciosRegistradosApi,
  nombreVisibleDe,
  nombresDeEjercicios,
  registroApi,
  sesionDeOcurrenciaApi,
  versionesRealizadas,
  type ContenidoDeRegistro,
} from './lectura-entrenamiento';

type Tx = Prisma.TransactionClient;

const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000;
/** DL-078: la lectura por período alcanza para registrar en diferido sin volverse un volcado del historial. */
const DIAS_MAXIMOS_DEL_PERIODO = 31;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Versión activada del plan vigente, con su instantánea. */
interface VersionActivada {
  readonly id: string;
  readonly activacion: Date;
  readonly instantanea: InstantaneaDeEntrenamiento;
  readonly huella: string;
}

/** El plan del asesorado con su Proceso de entrenamiento ABIERTO, y las versiones activadas desde que se abrió. */
interface PlanDelAsesorado {
  readonly planId: string;
  readonly profesionalId: string;
  readonly efectivaId: string;
  readonly versiones: readonly VersionActivada[];
}

/** Lo que el contenido guarda de una corrección: el registro completo, con los tokens del dominio. */
interface ContenidoDeCorreccion extends ContenidoDeRegistro {
  readonly granularidad: GranularidadDeRegistro | null;
  readonly condicion: CondicionDeSesion;
  readonly motivo: string | null;
}

const CONDICION_DESDE_API = Object.fromEntries(Object.entries(CONDICION_DE_SESION_API).map(([d, a]) => [a, d])) as Record<string, CondicionDeSesion>;
const GRANULARIDAD_DESDE_API = Object.fromEntries(Object.entries(GRANULARIDAD_API).map(([d, a]) => [a, d])) as Record<string, GranularidadDeRegistro>;

/** Fuera de los tres valores es `SESSION_CONDITION_INVALID` con su motivo (09v10:1538), no un 400 genérico. */
function interpretarCondicion(texto: string | null, ruta: string): CondicionDeSesion | null {
  if (texto === null) return null;
  const c = CONDICION_DESDE_API[texto];
  if (!c) throw new ErrorDeApi(422, CodigoDeError.SESSION_CONDITION_INVALID, 'La condición de la sesión no es válida.', { issues: [{ code: 'SESSION_CONDITION_UNKNOWN', path: ruta }] });
  return c;
}
function interpretarGranularidad(texto: string | null, ruta: string): GranularidadDeRegistro | null {
  if (texto === null) return null;
  const g = GRANULARIDAD_DESDE_API[texto];
  if (!g) throw new ErrorDeApi(422, CodigoDeError.EXECUTION_GRANULARITY_INVALID, 'La forma de registro no es válida.', { issues: [{ code: 'GRANULARITY_UNKNOWN', path: ruta }] });
  return g;
}

const fechaDe = (d: Date): string => d.toISOString().slice(0, 10);
const comoFecha = (f: string): Date => new Date(`${f}T00:00:00.000Z`);

/**
 * UC-P17 y UC-E02 — La ejecución de entrenamiento (API-TRN-14 a 20; RF-042, RF-043, RF-044) y la lectura por período
 * que suma DL-078.
 *
 * Lo que este servicio no puede hacer, aunque quisiera, porque la base lo rechaza igual:
 * - registrar contra un borrador de plan: solo contra una versión ACTIVADA del plan del propio asesorado (INV-06-121);
 * - dos ejecuciones para la misma ocurrencia, aunque lleguen dos confirmaciones a la vez (REG-06-115);
 * - volver a editar un borrador confirmado, o editar una ejecución registrada (06:5221; INV-06-124);
 * - registrar un instante que no cae en la fecha de su ocurrencia;
 * - registrar dos veces la misma sesión del plan el mismo día, aunque ese día se haya activado otra versión (DL-077).
 *
 * Y lo que decide acá, con el código de error que declara el 09:
 * - **`NOT_STARTED` no es «no realizada»**: la ausencia de registro nunca se convierte en una condición (H-09-TRN-01);
 * - la ocurrencia la emite el servidor y no se inventa por timestamp: (versión, sesión, fecha local) (DL-077);
 * - el borrador solo lo ve su titular: no es evidencia (09v10:980; DL-088);
 * - BE no inventa la hora de una sesión pasada (DL-088).
 */
@Injectable()
export class EjecucionesDeEntrenamientoService {
  constructor(private readonly ejecutor: EjecutorDeEntrenamiento, private readonly pdp: PdpService, private readonly catalogo: CatalogoDeEjerciciosService) {}

  // ─── API-TRN-14 ────────────────────────────────────────────────────────────────────────────
  hoy(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<HoyDeEntrenamientoResponse> {
    sinParametrosDeQuery(query);
    return this.ejecutor.leer({
      operacion: 'API-TRN-14',
      casoDeUso: 'UC-P17',
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        const zona = ZONA_POR_DEFECTO;
        const fecha = fechaLocalEn(await momentoDeLaBase(tx), zona);
        const base = { date: fecha, timeZone: zona };
        const plan = await this.planConProcesoAbierto(tx, actor.identidadId);
        if (!plan) return { data: { ...base, planState: 'NO_ACTIVE_PLAN', activePlan: null, occurrences: [] } };
        if (!(await this.accesoVigente(tx, 'API-TRN-14', actor, plan, ctx))) return { data: { ...base, planState: 'NOT_AVAILABLE', activePlan: null, occurrences: [] } };
        const efectiva = plan.versiones.find((v) => v.id === plan.efectivaId);
        if (!efectiva) return { data: { ...base, planState: 'NO_ACTIVE_PLAN', activePlan: null, occurrences: [] } };
        // Hoy muestra la versión efectiva. Si hoy mismo se activó otra y el asesorado ya había empezado una sesión de
        // la anterior, esa también aparece: una sesión en curso no desaparece porque cambió el plan.
        const conBorrador = new Set(
          (await tx.borradorDeEjecucionDeEntrenamiento.findMany({ where: { asesoradoId: actor.identidadId, fechaLocal: comoFecha(fecha) }, select: { versionDePlanId: true } })).map(
            (b) => b.versionDePlanId,
          ),
        );
        const versiones = this.versionesPertinentes(plan.versiones, fecha, zona).filter((v) => v.id === efectiva.id || conBorrador.has(v.id));
        return {
          data: {
            ...base,
            planState: 'AVAILABLE',
            activePlan: { planId: efectiva.id, trainingPlanId: plan.planId, snapshotVersion: efectiva.huella, activatedAt: efectiva.activacion.toISOString() },
            occurrences: await this.ocurrencias(tx, actor.identidadId, [{ fecha, versiones }]),
          },
        };
      },
    });
  }

  // ─── API-TRN-14-PERIODO (DL-078) ───────────────────────────────────────────────────────────
  ocurrenciasDelPeriodo(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<OcurrenciasDelPeriodoResponse> {
    const { periodStart, periodEnd, ...resto } = query;
    sinParametrosDeQuery(resto);
    if (typeof periodStart !== 'string' || !FECHA.test(periodStart) || typeof periodEnd !== 'string' || !FECHA.test(periodEnd)) {
      throw errores.solicitudInvalida([{ code: 'PERIOD_REQUIRED', path: 'periodStart' }]);
    }
    return this.ejecutor.leer({
      operacion: 'API-TRN-14-PERIODO',
      casoDeUso: 'UC-P17',
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        const zona = ZONA_POR_DEFECTO;
        const hoy = fechaLocalEn(await momentoDeLaBase(tx), zona);
        const dias = (comoFecha(periodEnd).getTime() - comoFecha(periodStart).getTime()) / 86_400_000;
        if (Number.isNaN(dias) || dias < 0 || dias >= DIAS_MAXIMOS_DEL_PERIODO) throw errores.solicitudInvalida([{ code: 'PERIOD_INVALID', path: 'periodEnd' }]);
        // No se lista el futuro: una sesión que todavía no ocurrió no se registra (09v10:188-189).
        if (periodEnd > hoy) throw errores.solicitudInvalida([{ code: 'PERIOD_IN_FUTURE', path: 'periodEnd' }]);
        const period = { start: periodStart, end: periodEnd, timeZone: zona };
        const plan = await this.planConProcesoAbierto(tx, actor.identidadId);
        if (!plan) return { data: { period, planState: 'NO_ACTIVE_PLAN', occurrences: [] } };
        if (!(await this.accesoVigente(tx, 'API-TRN-14-PERIODO', actor, plan, ctx))) return { data: { period, planState: 'NOT_AVAILABLE', occurrences: [] } };
        const fechas: { fecha: string; versiones: VersionActivada[] }[] = [];
        for (let d = comoFecha(periodStart); fechaDe(d) <= periodEnd; d = new Date(d.getTime() + 86_400_000)) {
          fechas.push({ fecha: fechaDe(d), versiones: this.versionesPertinentes(plan.versiones, fechaDe(d), zona) });
        }
        return { data: { period, planState: 'AVAILABLE', occurrences: await this.ocurrencias(tx, actor.identidadId, fechas) } };
      },
    });
  }

  // ─── API-TRN-15 ────────────────────────────────────────────────────────────────────────────
  /** Crear u obtener el borrador singular de la ocurrencia: tocar «Comenzar» dos veces da el mismo (S10-TRN-01). */
  abrirBorrador(actor: ActorAutenticado, occurrenceId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'Ocurrencia', id: occurrenceId };
    return this.ejecutor.escribir({
      operacion: 'API-TRN-15',
      casoDeUso: 'UC-P17',
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: AbrirBorradorDeEjecucionRequestSchema,
      cuerpo: cuerpo ?? {},
      efecto: async (tx, _pedido, procedencia) => {
        const o = decodificarOcurrencia(occurrenceId);
        if (!o) throw this.ejecutor.noRevelable({ operacion: 'API-TRN-15', actorId: actor.identidadId, recurso }, ctx);
        const version = await tx.versionDePlanDeEntrenamiento.findUnique({ where: { id: o.versionDePlanId }, include: { plan: true, instantanea: true } });
        // Una versión ajena o un borrador de plan no existen para el asesorado.
        if (!version || version.plan.asesoradoId !== actor.identidadId || version.estado !== 'ACTIVADA' || !version.instantanea) {
          throw this.ejecutor.noRevelable({ operacion: 'API-TRN-15', actorId: actor.identidadId, recurso, sujetoId: version?.plan.asesoradoId ?? null }, ctx);
        }
        // La decisión queda registrada sobre el recurso real —la versión de la ocurrencia—: el occurrenceId es opaco.
        await this.decidir(tx, 'API-TRN-15', actor, version.plan.profesionalId, actor.identidadId, { tipo: 'VersionDePlanDeEntrenamiento', id: version.id }, ctx);
        const instantanea = version.instantanea.contenido as unknown as InstantaneaDeEntrenamiento;
        const sesion = sesionDeOcurrenciaApi(instantanea, o.sesionPlanificadaId);
        if (!sesion) throw this.ejecutor.noRevelable({ operacion: 'API-TRN-15', actorId: actor.identidadId, recurso, sujetoId: actor.identidadId }, ctx);
        const plan = await this.planConProcesoAbierto(tx, actor.identidadId, true);
        if (!plan || plan.planId !== version.planId) {
          throw new ErrorDeApi(422, CodigoDeError.ACTIVE_PLAN_REQUIRED, 'No hay un plan de entrenamiento vigente para registrar esta sesión.');
        }
        const zona = ZONA_POR_DEFECTO;
        const hoy = fechaLocalEn(await momentoDeLaBase(tx), zona);
        if (o.fechaLocal > hoy || !this.versionesPertinentes(plan.versiones, o.fechaLocal, zona).some((v) => v.id === version.id)) {
          throw new ErrorDeApi(422, CodigoDeError.OCCURRENCE_NOT_EXECUTABLE, 'Esa sesión no se puede registrar para esa fecha.');
        }
        // Dos «Comenzar» simultáneos no crean dos borradores: la base lo impide y este cerrojo evita el choque. La clave
        // no lleva la versión: el día que se activa una sucesora, la misma sesión tampoco se abre dos veces (DL-077).
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`borrador-trn|${actor.identidadId}|${o.sesionPlanificadaId}|${o.fechaLocal}`}, 0))`;
        const existente = await tx.borradorDeEjecucionDeEntrenamiento.findUnique({
          where: {
            asesoradoId_versionDePlanId_sesionPlanificadaId_fechaLocal: {
              asesoradoId: actor.identidadId,
              versionDePlanId: o.versionDePlanId,
              sesionPlanificadaId: o.sesionPlanificadaId,
              fechaLocal: comoFecha(o.fechaLocal),
            },
          },
          include: { ejecucion: { select: { id: true } } },
        });
        if (existente) return { estadoHttp: 200, cuerpo: { data: await this.borradorApi(tx, existente, sesion) }, sujetoId: actor.identidadId, recurso: { tipo: 'BorradorDeEjecucion', id: existente.id } };
        // La misma sesión del plan, el mismo día, ya empezada o registrada en otra versión: es la misma ocurrencia para
        // la persona, y registrarla otra vez la duplicaría (06:5233). La base lo vuelve a exigir.
        const enOtraVersion = await tx.borradorDeEjecucionDeEntrenamiento.findFirst({
          where: { asesoradoId: actor.identidadId, sesionPlanificadaId: o.sesionPlanificadaId, fechaLocal: comoFecha(o.fechaLocal), versionDePlan: { planId: version.planId }, NOT: { versionDePlanId: o.versionDePlanId } },
          select: { id: true },
        });
        if (enOtraVersion) {
          throw new ErrorDeApi(422, CodigoDeError.OCCURRENCE_NOT_EXECUTABLE, 'Esa sesión ya se empezó a registrar ese día con la versión anterior del plan.', {
            issues: [{ code: 'SESSION_STARTED_IN_OTHER_VERSION', path: 'occurrenceId' }],
          });
        }
        const t = evaluarTransicionDeEjecucion(null, { transicion: 'CrearBorradorEjecucion', sesionYVersionIdentificables: true });
        if (!t.permitida) throw errores.estadoNoPermite();
        const creado = await tx.borradorDeEjecucionDeEntrenamiento.create({
          data: {
            asesoradoId: actor.identidadId,
            versionDePlanId: o.versionDePlanId,
            sesionPlanificadaId: o.sesionPlanificadaId,
            fechaLocal: comoFecha(o.fechaLocal),
            zonaHoraria: zona,
            contenido: REGISTRO_VACIO as unknown as Prisma.InputJsonValue,
          },
          include: { ejecucion: { select: { id: true } } },
        });
        await registrarEventoDeEntrenamiento(tx, {
          tipo: 'BorradorDeEjecucionCreado',
          profesionalId: version.plan.profesionalId,
          asesoradoId: actor.identidadId,
          recurso: { tipo: 'BorradorDeEjecucion', id: creado.id },
          estadoPrevio: null,
          estadoPosterior: 'BORRADOR',
          actorId: actor.identidadId,
          procedencia,
          momento: await momentoDeLaBase(tx),
        });
        return { estadoHttp: 201, cuerpo: { data: await this.borradorApi(tx, creado, sesion) }, sujetoId: actor.identidadId, recurso: { tipo: 'BorradorDeEjecucion', id: creado.id } };
      },
    });
  }

  // ─── API-TRN-16 ────────────────────────────────────────────────────────────────────────────
  consultarBorrador(actor: ActorAutenticado, draftId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: BorradorDeEjecucion }> {
    sinParametrosDeQuery(query);
    const recurso = { tipo: 'BorradorDeEjecucion', id: draftId };
    return this.ejecutor.leer({
      operacion: 'API-TRN-16',
      casoDeUso: 'UC-P17',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const { borrador, sesion } = await this.borradorDelTitular(tx, 'API-TRN-16', actor, draftId, ctx);
        return { data: await this.borradorApi(tx, borrador, sesion) };
      },
    });
  }

  // ─── API-TRN-17 ────────────────────────────────────────────────────────────────────────────
  editarBorrador(actor: ActorAutenticado, draftId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'BorradorDeEjecucion', id: draftId };
    return this.ejecutor.escribir({
      operacion: 'API-TRN-17',
      casoDeUso: 'UC-P17',
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: EditarBorradorDeEjecucionRequestSchema,
      cuerpo,
      efecto: async (tx, pedido, procedencia) => {
        const { borrador, sesion, profesionalId } = await this.borradorDelTitular(tx, 'API-TRN-17', actor, draftId, ctx, true);
        // La vuelta de REGISTRADA a BORRADOR no existe (06:5221): un borrador confirmado no se edita.
        if (borrador.ejecucion) throw errores.transicionNoPermitida();
        if (!esToken(pedido.expectedVersion, borrador.version)) throw errores.conflictoDeVersion();
        const c = pedido.changes;
        const previo = borrador.contenido as unknown as ContenidoDeRegistro;
        const granularidad = c.granularity === undefined ? borrador.granularidad : interpretarGranularidad(c.granularity, 'changes.granularity');
        const condicion = c.sessionCondition === undefined ? borrador.condicion : interpretarCondicion(c.sessionCondition, 'changes.sessionCondition');
        const contenido: ContenidoDeRegistro = {
          exercises: c.exercises ?? previo.exercises,
          sessionSummary: c.sessionSummary === undefined ? previo.sessionSummary : c.sessionSummary,
        };
        const ocurrencia = c.occurredAt === undefined ? borrador.momentoDeOcurrencia : c.occurredAt ? new Date(c.occurredAt) : null;
        await this.verificarRegistro(tx, actor, 'ASESORADO', { granularidad, condicion, contenido }, sesion, 'changes.', profesionalId);
        if (ocurrencia) await this.verificarInstante(tx, ocurrencia, fechaDe(borrador.fechaLocal), borrador.zonaHoraria, 'changes.occurredAt', await this.vigenciaDe(tx, borrador.versionDePlanId));
        const t = evaluarTransicionDeEjecucion('BORRADOR', { transicion: 'GuardarBorradorEjecucion' });
        if (!t.permitida) throw errores.transicionNoPermitida();
        const momento = await momentoDeLaBase(tx);
        const guardado = await tx.borradorDeEjecucionDeEntrenamiento.update({
          where: { id: borrador.id },
          data: {
            granularidad,
            condicion,
            motivo: c.reason === undefined ? borrador.motivo : c.reason,
            contenido: contenido as unknown as Prisma.InputJsonValue,
            momentoDeOcurrencia: ocurrencia,
            version: borrador.version + 1,
            momentoDeActualizacion: momento,
          },
          include: { ejecucion: { select: { id: true } } },
        });
        await registrarEventoDeEntrenamiento(tx, {
          tipo: 'BorradorDeEjecucionGuardado',
          profesionalId,
          asesoradoId: actor.identidadId,
          recurso,
          estadoPrevio: 'BORRADOR',
          estadoPosterior: 'BORRADOR',
          actorId: actor.identidadId,
          procedencia,
          momento,
        });
        return { estadoHttp: 200, cuerpo: { data: await this.borradorApi(tx, guardado, sesion) }, sujetoId: actor.identidadId, recurso };
      },
    });
  }

  // ─── API-TRN-18 ────────────────────────────────────────────────────────────────────────────
  confirmar(actor: ActorAutenticado, draftId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'BorradorDeEjecucion', id: draftId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-TRN-18',
      casoDeUso: 'UC-P17',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: VersionEsperadaRequestSchema,
      cuerpo,
      huellaExtra: { draftId },
      efecto: async (tx, pedido, procedencia) => {
        // 1-3. Recargar el borrador, PDP, y que la ocurrencia siga siendo del plan vigente (09v10:1158-1160).
        const { borrador, profesionalId } = await this.borradorDelTitular(tx, 'API-TRN-18', actor, draftId, ctx, true);
        const plan = await this.planConProcesoAbierto(tx, actor.identidadId, true);
        if (!plan || !plan.versiones.some((v) => v.id === borrador.versionDePlanId)) {
          throw new ErrorDeApi(422, CodigoDeError.ACTIVE_PLAN_REQUIRED, 'No hay un plan de entrenamiento vigente para registrar esta sesión.');
        }
        // 5. Una sola ejecución registrada por ocurrencia. El borrador es del actor, así que decirlo no revela nada.
        if (borrador.ejecucion) throw new ErrorDeApi(409, CodigoDeError.EXECUTION_ALREADY_REGISTERED, 'Esta sesión ya está registrada.', { executionId: borrador.ejecucion.id });
        if (!esToken(pedido.expectedVersion, borrador.version)) throw errores.conflictoDeVersion();
        // 4. Contenido mínimo según granularidad y condición, y el instante: declarado, o el comienzo si fue ese día.
        const contenido = borrador.contenido as unknown as ContenidoDeRegistro;
        const issues: ValidationIssue[] = problemasParaConfirmar({
          condicion: borrador.condicion,
          granularidad: borrador.granularidad,
          ejercicios: contenido.exercises,
          resumenDeSesion: contenido.sessionSummary,
        });
        const fecha = fechaDe(borrador.fechaLocal);
        // El instante tiene que caer mientras la versión regía: si el profesional activó otra después de guardarlo, el
        // declarado ya no alcanza, y el comienzo del borrador tampoco sirve si quedó afuera (06:4351).
        const vigencia = await this.vigenciaDe(tx, borrador.versionDePlanId);
        const dentro = (m: Date) => m >= vigencia.desde && (!vigencia.hasta || m < vigencia.hasta);
        const porDefecto = fechaLocalEn(borrador.momentoDeRegistro, borrador.zonaHoraria) === fecha && dentro(borrador.momentoDeRegistro) ? borrador.momentoDeRegistro : null;
        const ocurrencia = borrador.momentoDeOcurrencia ?? porDefecto;
        if (!ocurrencia) issues.push({ code: 'OCCURRED_AT_REQUIRED', path: 'occurredAt' });
        else if (!dentro(ocurrencia)) issues.push({ code: 'OCCURRED_AT_OUTSIDE_PLAN_VERSION', path: 'occurredAt' });
        if (issues.length > 0 || !borrador.condicion) {
          throw new ErrorDeApi(422, CodigoDeError.EXECUTION_DRAFT_NOT_READY, 'Hay datos de la sesión por completar antes de confirmar.', { issues });
        }
        const t = evaluarTransicionDeEjecucion('BORRADOR', { transicion: 'ConfirmarEjecucion', contenidoMinimoCoherente: true });
        if (!t.permitida) throw errores.transicionNoPermitida();
        // 6-7. El original inmutable, como recurso nuevo.
        let creada;
        try {
          creada = await tx.ejecucionDeEntrenamiento.create({
            data: {
              asesoradoId: actor.identidadId,
              versionDePlanId: borrador.versionDePlanId,
              sesionPlanificadaId: borrador.sesionPlanificadaId,
              fechaLocal: borrador.fechaLocal,
              zonaHoraria: borrador.zonaHoraria,
              borradorId: borrador.id,
              granularidad: borrador.granularidad,
              condicion: borrador.condicion,
              motivo: borrador.motivo,
              contenido: contenido as unknown as Prisma.InputJsonValue,
              procedencia: procedencia as unknown as Prisma.InputJsonValue,
              momentoDeOcurrencia: ocurrencia as Date,
            },
          });
        } catch (e) {
          // Dos confirmaciones a la vez de la misma ocurrencia: la base deja pasar una sola (REG-06-115).
          if ((e as { code?: string }).code === 'P2002') throw new ErrorDeApi(409, CodigoDeError.EXECUTION_ALREADY_REGISTERED, 'Esta sesión ya está registrada.');
          throw e;
        }
        await registrarEventoDeEntrenamiento(tx, {
          tipo: 'EjecucionRegistrada',
          profesionalId,
          asesoradoId: actor.identidadId,
          recurso: { tipo: 'EjecucionDeEntrenamiento', id: creada.id },
          estadoPrevio: 'BORRADOR',
          estadoPosterior: 'REGISTRADA',
          actorId: actor.identidadId,
          procedencia,
          momento: creada.momentoDeOcurrencia,
        });
        return {
          estadoHttp: 201,
          cuerpo: { data: { executionId: creada.id, state: 'REGISTERED', occurredAt: creada.momentoDeOcurrencia.toISOString(), recordedAt: creada.momentoDeRegistro.toISOString() } },
          sujetoId: actor.identidadId,
          recurso: { tipo: 'EjecucionDeEntrenamiento', id: creada.id },
        };
      },
    });
  }

  // ─── API-TRN-19 ────────────────────────────────────────────────────────────────────────────
  /** Lectura de historia: para el titular exige solo su A3 vigente (DL-089 opción A; 08:199, 08:58, 08:406). */
  consultarEjecucion(actor: ActorAutenticado, executionId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: EjecucionDeEntrenamiento }> {
    sinParametrosDeQuery(query);
    const recurso = { tipo: 'EjecucionDeEntrenamiento', id: executionId };
    return this.ejecutor.leer({
      operacion: 'API-TRN-19',
      casoDeUso: 'UC-P17',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => ({ data: await this.ejecucionApi(tx, (await this.ejecucionRevelable(tx, 'API-TRN-19', actor, executionId, ctx, 'HISTORIA')).id) }),
    });
  }

  // ─── API-TRN-20 ────────────────────────────────────────────────────────────────────────────
  /**
   * Corrección trazable (UC-E02; REG-06-116). La hace el asesorado o su profesional (DL-076): la autoría real queda,
   * y el dato corregido por el profesional no se le atribuye al asesorado (05:9209-9224). El original no se toca.
   */
  corregir(actor: ActorAutenticado, executionId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'EjecucionDeEntrenamiento', id: executionId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-TRN-20',
      casoDeUso: 'UC-E02',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: CorregirEjecucionRequestSchema,
      cuerpo,
      huellaExtra: { executionId },
      efecto: async (tx, pedido, procedencia) => {
        const x = await this.ejecucionRevelable(tx, 'API-TRN-20', actor, executionId, ctx);
        const r = pedido.correction;
        const granularidad = interpretarGranularidad(r.granularity, 'correction.granularity');
        const condicion = interpretarCondicion(r.sessionCondition, 'correction.sessionCondition') as CondicionDeSesion;
        const contenido: ContenidoDeRegistro = { exercises: r.exercises, sessionSummary: r.sessionSummary };
        const sesion = sesionDeOcurrenciaApi(x.instantanea, x.sesionPlanificadaId);
        await this.verificarRegistro(tx, actor, x.asesoradoId === actor.identidadId ? 'ASESORADO' : 'PROFESIONAL', { granularidad, condicion, contenido }, sesion, 'correction.', x.profesionalId);
        // La corrección es un registro completo: cumple lo mismo que una confirmación.
        const minimos = problemasParaConfirmar({ condicion, granularidad, ejercicios: contenido.exercises, resumenDeSesion: contenido.sessionSummary });
        if (minimos.length > 0) {
          throw new ErrorDeApi(422, CodigoDeError.EXECUTION_VALUE_INVALID, 'El registro corregido está incompleto.', {
            issues: minimos.map((i) => ({ code: i.code, path: `correction.${i.path}` })),
          });
        }
        // Una sola cadena de correcciones (REG-06-15): se bloquea la ejecución, sin modificarla.
        await tx.$queryRaw`SELECT 1 FROM "ejecucion_de_entrenamiento" WHERE "id" = ${x.id}::uuid FOR NO KEY UPDATE`;
        const existentes = await tx.correccionDeEjecucionDeEntrenamiento.findMany({ where: { ejecucionId: x.id }, select: { id: true, correccionPreviaId: true } });
        const relaciones = existentes.map((c) => ({ id: c.id, originalId: x.id, correccionPreviaId: c.correccionPreviaId }));
        const terminal = relaciones.find((c) => !relaciones.some((s) => s.correccionPreviaId === c.id))?.id ?? null;
        const ev = evaluarNuevaCorreccion(x.id, relaciones, { originalId: x.id, correccionPreviaId: terminal });
        if (!ev.valida) throw new ErrorDeApi(422, CodigoDeError.CORRECTION_NOT_ALLOWED, 'La historia de correcciones de este registro no se puede continuar.');
        const guardado: ContenidoDeCorreccion = { granularidad, condicion, motivo: r.reason, ...contenido };
        // Corregir exige un cambio (B10-06:879-884): una corrección igual a lo que hoy rige no rectifica nada, y dejaría
        // una «Corrección vigente» idéntica al registro que dice corregir.
        if (serializacionCanonica(guardado) === serializacionCanonica(await this.contenidoVigente(tx, x.id, terminal))) {
          throw new ErrorDeApi(422, CodigoDeError.EXECUTION_VALUE_INVALID, 'La corrección no cambia nada del registro.', { issues: [{ code: 'CORRECTION_WITHOUT_CHANGES', path: 'correction' }] });
        }
        const correccion = await tx.correccionDeEjecucionDeEntrenamiento.create({
          data: {
            ejecucionId: x.id,
            correccionPreviaId: ev.correccionPreviaId,
            autorId: actor.identidadId,
            motivo: pedido.reason,
            contenido: guardado as unknown as Prisma.InputJsonValue,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
        });
        await registrarEventoDeEntrenamiento(tx, {
          tipo: 'EjecucionCorregida',
          profesionalId: x.profesionalId,
          asesoradoId: x.asesoradoId,
          recurso: { tipo: 'CorreccionDeEjecucion', id: correccion.id },
          estadoPrevio: null,
          estadoPosterior: null,
          actorId: actor.identidadId,
          procedencia,
          momento: await momentoDeLaBase(tx),
        });
        return { estadoHttp: 201, cuerpo: { data: await this.ejecucionApi(tx, x.id) }, sujetoId: x.asesoradoId, recurso: { tipo: 'CorreccionDeEjecucion', id: correccion.id } };
      },
    });
  }

  // ─── Auxiliares ─────────────────────────────────────────────────────────────────────────────

  /**
   * El plan del asesorado con su Proceso de entrenamiento ABIERTO, y sus versiones activadas desde la que abrió ese
   * Proceso. Como máximo hay uno: activar con otro profesional abierto es ACTIVE_PLAN_CONFLICT (RF-041).
   */
  async planConProcesoAbierto(tx: Tx, asesoradoId: string, bloquear = false): Promise<PlanDelAsesorado | null> {
    // Al escribir, el Proceso se toma FOR SHARE: FINALIZAR lo bloquea FOR NO KEY UPDATE, así que o espera a que se
    // registre, o este SELECT espera al cierre y, al volver a evaluar la fila, ya no la encuentra ABIERTA (UC-I06 V05).
    const [p] = await tx.$queryRaw<{ planId: string; profesionalId: string; efectivaId: string; aperturaId: string | null }[]>`
      SELECT p."id"::text AS "planId", p."profesional_id"::text AS "profesionalId", p."version_efectiva_id"::text AS "efectivaId",
             pr."version_de_apertura_entrenamiento_id"::text AS "aperturaId"
        FROM "plan_de_entrenamiento" p
        JOIN "proceso_operativo" pr ON pr."profesional_id" = p."profesional_id" AND pr."asesorado_id" = p."asesorado_id"
                                    AND pr."alcance" = 'ENTRENAMIENTO' AND pr."estado" = 'ABIERTO'
       WHERE p."asesorado_id" = ${asesoradoId}::uuid AND p."version_efectiva_id" IS NOT NULL
       ${bloquear ? Prisma.sql`FOR SHARE OF pr` : Prisma.empty}`;
    if (!p) return null;
    const filas = await tx.versionDePlanDeEntrenamiento.findMany({
      where: { planId: p.planId, estado: 'ACTIVADA' },
      include: { instantanea: true },
      orderBy: [{ momentoDeActivacion: 'asc' }, { id: 'asc' }],
    });
    const apertura = filas.find((v) => v.id === p.aperturaId)?.momentoDeActivacion ?? filas[0]?.momentoDeActivacion;
    const versiones = filas
      .filter((v) => v.instantanea && v.momentoDeActivacion && apertura && v.momentoDeActivacion >= apertura)
      .map((v) => ({ id: v.id, activacion: v.momentoDeActivacion as Date, instantanea: v.instantanea?.contenido as unknown as InstantaneaDeEntrenamiento, huella: v.instantanea?.huella as string }));
    return { planId: p.planId, profesionalId: p.profesionalId, efectivaId: p.efectivaId, versiones };
  }

  /**
   * Las versiones que rigieron en algún momento de un día local: la que estaba vigente cuando empezó y la que se
   * activó durante ese día, si la hubo. Se corta en hora local, no en UTC (la lección de WP-05).
   */
  private versionesPertinentes(versiones: readonly VersionActivada[], fecha: string, zona: string): VersionActivada[] {
    const inicio = inicioDelDiaLocal(fecha, zona);
    const fin = finDelDiaLocal(fecha, zona);
    return versiones.filter((v, i) => {
      const siguiente = versiones[i + 1];
      return v.activacion < fin && (!siguiente || siguiente.activacion > inicio);
    });
  }

  /**
   * Las ocurrencias de cada fecha, con el estado de su registro. Sin borrador es NOT_STARTED, nunca «no realizada».
   * - El día que se activa una sucesora, cada sesión aparece **una vez**: la de la versión donde ya se empezó o se
   *   registró, y si no, la de la versión más nueva que regía ese día (06:5233; DL-077).
   * - La condición es la que rige después de las correcciones, no la del original (06:5253).
   */
  private async ocurrencias(tx: Tx, asesoradoId: string, fechas: readonly { fecha: string; versiones: readonly VersionActivada[] }[]): Promise<Ocurrencia[]> {
    const todas = fechas.map((f) => f.fecha);
    if (todas.length === 0) return [];
    const borradores = await tx.borradorDeEjecucionDeEntrenamiento.findMany({
      where: { asesoradoId, fechaLocal: { gte: comoFecha(todas[0] as string), lte: comoFecha(todas[todas.length - 1] as string) } },
      include: { ejecucion: { select: { id: true, condicion: true, correcciones: { select: { id: true, correccionPreviaId: true, contenido: true } } } } },
    });
    const porClave = new Map(borradores.map((b) => [`${b.versionDePlanId}|${b.sesionPlanificadaId}|${fechaDe(b.fechaLocal)}`, b]));
    const condicionVigente = (x: NonNullable<(typeof borradores)[number]['ejecucion']>): CondicionDeSesion => {
      const vista = resolverVistaEfectiva(x.id, x.correcciones.map((c) => ({ id: c.id, originalId: x.id, correccionPreviaId: c.correccionPreviaId })));
      const corregida = vista.tipo === 'CORREGIDA' ? x.correcciones.find((c) => c.id === vista.id) : undefined;
      return corregida ? (corregida.contenido as unknown as ContenidoDeCorreccion).condicion : x.condicion;
    };
    const r: Ocurrencia[] = [];
    for (const { fecha, versiones } of fechas) {
      // Por sesión: la versión donde ya hay borrador, o la más nueva de las que rigieron ese día.
      const elegida = new Map<string, VersionActivada>();
      for (const v of versiones) {
        for (const { sesion } of sesionesDelPlan(v.instantanea.contenido)) {
          const previa = elegida.get(sesion.sessionId);
          if (!previa || !porClave.has(`${previa.id}|${sesion.sessionId}|${fecha}`)) elegida.set(sesion.sessionId, v);
        }
      }
      for (const v of versiones) {
        for (const { sesion } of sesionesDelPlan(v.instantanea.contenido)) {
          if (elegida.get(sesion.sessionId) !== v) continue;
          const plannedSession = sesionDeOcurrenciaApi(v.instantanea, sesion.sessionId) as SesionDeOcurrencia;
          const b = porClave.get(`${v.id}|${sesion.sessionId}|${fecha}`);
          r.push({
            occurrenceId: codificarOcurrencia({ versionDePlanId: v.id, sesionPlanificadaId: sesion.sessionId, fechaLocal: fecha }),
            date: fecha,
            planId: v.id,
            plannedSession,
            execution: {
              state: !b ? 'NOT_STARTED' : b.ejecucion ? 'REGISTERED' : 'DRAFT_IN_PROGRESS',
              draftId: b?.id ?? null,
              executionId: b?.ejecucion?.id ?? null,
              sessionCondition: b?.ejecucion ? CONDICION_DE_SESION_API[condicionVigente(b.ejecucion)] : null,
            },
          });
        }
      }
    }
    return r;
  }

  /** El PDP sobre el profesional del plan: si el acceso está suspendido, queda registrado y se informa (UC-P12 E06). */
  private async accesoVigente(tx: Tx, operacion: string, actor: ActorAutenticado, plan: PlanDelAsesorado, ctx: ContextoDeSolicitud): Promise<boolean> {
    try {
      await this.decidir(tx, operacion, actor, plan.profesionalId, actor.identidadId, { tipo: 'VersionDePlanDeEntrenamiento', id: plan.efectivaId }, ctx);
      return true;
    } catch (e) {
      if (!(e instanceof DenegacionDelPdp)) throw e;
      await this.pdp.registrarDenegacion(e);
      return false;
    }
  }

  /** El borrador de su titular, con la sesión de su instantánea. De otro, o inexistente: el mismo 404. */
  private async borradorDelTitular(tx: Tx, operacion: string, actor: ActorAutenticado, draftId: string, ctx: ContextoDeSolicitud, bloquear = false) {
    const recurso = { tipo: 'BorradorDeEjecucion', id: draftId };
    const encontrado = esUuid(draftId)
      ? await tx.borradorDeEjecucionDeEntrenamiento.findUnique({ where: { id: draftId }, include: { versionDePlan: { include: { plan: true, instantanea: true } } } })
      : null;
    // El borrador no es evidencia: ni el profesional lo ve (09v10:975-982; DL-088).
    if (!encontrado || encontrado.asesoradoId !== actor.identidadId) {
      throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso, sujetoId: encontrado?.asesoradoId ?? null }, ctx);
    }
    const profesionalId = encontrado.versionDePlan.plan.profesionalId;
    await this.decidir(tx, operacion, actor, profesionalId, actor.identidadId, recurso, ctx);
    if (bloquear) await tx.$queryRaw`SELECT 1 FROM "borrador_de_ejecucion_de_entrenamiento" WHERE "id" = ${encontrado.id}::uuid FOR NO KEY UPDATE`;
    const borrador = await tx.borradorDeEjecucionDeEntrenamiento.findUniqueOrThrow({ where: { id: encontrado.id }, include: { ejecucion: { select: { id: true } } } });
    const instantanea = encontrado.versionDePlan.instantanea?.contenido as unknown as InstantaneaDeEntrenamiento;
    return { borrador, profesionalId, sesion: sesionDeOcurrenciaApi(instantanea, borrador.sesionPlanificadaId) };
  }

  /**
   * La ejecución, si es revelable para el actor: su titular, o el profesional del plan (con su PDP, y después la
   * propiedad: DL-057). Para cualquier otro, el mismo 404 que lo inexistente.
   *
   * Para el titular, lo que se exige depende de qué se hace con la ejecución (DL-089 opción A; 08:199, 08:58, 08:406):
   * - `HISTORIA` (API-TRN-19): es su historia ya registrada; alcanza con su A3 vigente, como en nutrición.
   * - `OPERACION` (API-TRN-20, corregir): opera sobre el registro; sigue bajo el PDP de su profesional (UC-P17 E03).
   */
  private async ejecucionRevelable(tx: Tx, operacion: string, actor: ActorAutenticado, executionId: string, ctx: ContextoDeSolicitud, uso: 'HISTORIA' | 'OPERACION' = 'OPERACION') {
    const recurso = { tipo: 'EjecucionDeEntrenamiento', id: executionId };
    const x = esUuid(executionId)
      ? await tx.ejecucionDeEntrenamiento.findUnique({ where: { id: executionId }, include: { versionDePlan: { include: { plan: true, instantanea: true } } } })
      : null;
    if (!x) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso }, ctx);
    const profesionalId = x.versionDePlan.plan.profesionalId;
    const esTitular = x.asesoradoId === actor.identidadId;
    if (esTitular && uso === 'HISTORIA') {
      // DL-089 opción A; 08:199, 08:58, 08:406: la historia propia no depende del acceso de terceros.
      await exigirA3Vigente(tx, actor.identidadId);
    } else {
      await this.decidir(tx, operacion, actor, esTitular ? profesionalId : actor.identidadId, x.asesoradoId, recurso, ctx);
    }
    if (!esTitular && profesionalId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso, sujetoId: x.asesoradoId }, ctx);
    return {
      id: x.id,
      asesoradoId: x.asesoradoId,
      profesionalId,
      sesionPlanificadaId: x.sesionPlanificadaId,
      instantanea: x.versionDePlan.instantanea?.contenido as unknown as InstantaneaDeEntrenamiento,
    };
  }

  /**
   * Lo que se verifica de un registro, en el orden en que un cliente lo puede corregir: la forma según la granularidad,
   * los valores, y las referencias —a la prescripción de esta sesión y al ejercicio que realmente se hizo—.
   */
  private async verificarRegistro(
    tx: Tx,
    actor: ActorAutenticado,
    ambito: Ambito,
    r: { granularidad: GranularidadDeRegistro | null; condicion: CondicionDeSesion | null; contenido: ContenidoDeRegistro },
    sesion: SesionDeOcurrencia | null,
    prefijo: string,
    profesionalDelPlan: string,
  ): Promise<void> {
    const conPrefijo = (issues: readonly ValidationIssue[]) => issues.map((i) => ({ code: i.code, path: `${prefijo}${i.path}` }));
    const coherencia = problemasDeCoherencia({ condicion: r.condicion, granularidad: r.granularidad, ejercicios: r.contenido.exercises, resumenDeSesion: r.contenido.sessionSummary });
    if (coherencia.granularidad.length > 0) {
      throw new ErrorDeApi(422, CodigoDeError.EXECUTION_GRANULARITY_INVALID, 'Lo registrado no corresponde a la forma de registro elegida.', { issues: conPrefijo(coherencia.granularidad) });
    }
    const prescriptas = new Set(sesion?.prescriptions.map((p) => p.prescriptionId) ?? []);
    const valores = [
      ...coherencia.valores,
      ...r.contenido.exercises.flatMap((e: EjercicioRegistradoEntrada, i) => (prescriptas.has(e.prescriptionId) ? [] : [{ code: 'PRESCRIPTION_NOT_IN_SESSION', path: `exercises[${i}].prescriptionId` }])),
    ];
    if (valores.length > 0) throw new ErrorDeApi(422, CodigoDeError.EXECUTION_VALUE_INVALID, 'Hay valores registrados que no se pueden guardar.', { issues: conPrefijo(valores) });
    const citables = await this.catalogo.citables(tx, actor.identidadId, ambito, r.contenido.exercises.map((e) => e.performedExerciseVersionId), profesionalDelPlan);
    const invalidos = r.contenido.exercises.flatMap((e, i) => (citables.has(e.performedExerciseVersionId) ? [] : [{ code: 'PERFORMED_EXERCISE_INVALID', path: `exercises[${i}].performedExerciseVersionId` }]));
    if (invalidos.length > 0) throw new ErrorDeApi(422, CodigoDeError.EXERCISE_REFERENCE_INVALID, 'Hay un ejercicio realizado que no está en el catálogo.', { issues: conPrefijo(invalidos) });
  }

  /** Desde la activación de la versión hasta la activación de su sucesora, si la hay. */
  private async vigenciaDe(tx: Tx, versionId: string): Promise<{ readonly desde: Date; readonly hasta: Date | null }> {
    const v = await tx.versionDePlanDeEntrenamiento.findUniqueOrThrow({ where: { id: versionId }, select: { momentoDeActivacion: true } });
    const sucesora = await tx.versionDePlanDeEntrenamiento.findFirst({ where: { predecesoraId: versionId, estado: 'ACTIVADA' }, select: { momentoDeActivacion: true } });
    return { desde: v.momentoDeActivacion as Date, hasta: sucesora?.momentoDeActivacion ?? null };
  }

  /** Lo que hoy rige de una ejecución: la última corrección de la cadena, o el original. */
  private async contenidoVigente(tx: Tx, ejecucionId: string, ultimaCorreccionId: string | null): Promise<ContenidoDeCorreccion> {
    if (ultimaCorreccionId) {
      const c = await tx.correccionDeEjecucionDeEntrenamiento.findUniqueOrThrow({ where: { id: ultimaCorreccionId }, select: { contenido: true } });
      return c.contenido as unknown as ContenidoDeCorreccion;
    }
    const x = await tx.ejecucionDeEntrenamiento.findUniqueOrThrow({ where: { id: ejecucionId }, select: { granularidad: true, condicion: true, motivo: true, contenido: true } });
    const contenido = x.contenido as unknown as ContenidoDeRegistro;
    return { granularidad: x.granularidad, condicion: x.condicion, motivo: x.motivo, exercises: contenido.exercises, sessionSummary: contenido.sessionSummary };
  }

  /**
   * El instante declarado cae en la fecha de la ocurrencia, mientras regía su versión, y no es futuro (DL-088; la base
   * exige la fecha). Una versión rige desde que se activa hasta que se activa su sucesora (06:4351).
   */
  private async verificarInstante(tx: Tx, instante: Date, fecha: string, zona: string, ruta: string, vigencia: { readonly desde: Date; readonly hasta: Date | null }): Promise<void> {
    if (instante.getTime() > (await momentoDeLaBase(tx)).getTime() + TOLERANCIA_FUTURO_MS) {
      throw new ErrorDeApi(422, CodigoDeError.EXECUTION_VALUE_INVALID, 'La sesión no puede ser futura.', { issues: [{ code: 'OCCURRED_AT_IN_FUTURE', path: ruta }] });
    }
    if (fechaLocalEn(instante, zona) !== fecha) {
      throw new ErrorDeApi(422, CodigoDeError.EXECUTION_VALUE_INVALID, 'El horario no corresponde al día de la sesión.', { issues: [{ code: 'OCCURRED_AT_OUTSIDE_OCCURRENCE_DATE', path: ruta }] });
    }
    if (instante < vigencia.desde || (vigencia.hasta && instante >= vigencia.hasta)) {
      throw new ErrorDeApi(422, CodigoDeError.EXECUTION_VALUE_INVALID, 'A esa hora regía otra versión del plan.', { issues: [{ code: 'OCCURRED_AT_OUTSIDE_PLAN_VERSION', path: ruta }] });
    }
  }

  private async borradorApi(
    tx: Tx,
    b: {
      id: string;
      versionDePlanId: string;
      sesionPlanificadaId: string;
      fechaLocal: Date;
      zonaHoraria: string;
      granularidad: GranularidadDeRegistro | null;
      condicion: CondicionDeSesion | null;
      motivo: string | null;
      contenido: unknown;
      momentoDeOcurrencia: Date | null;
      version: number;
      momentoDeRegistro: Date;
      momentoDeActualizacion: Date;
      ejecucion: { id: string } | null;
    },
    sesion: SesionDeOcurrencia | null,
  ): Promise<BorradorDeEjecucion> {
    const contenido = b.contenido as ContenidoDeRegistro;
    const nombres = await nombresDeEjercicios(tx, versionesRealizadas(contenido));
    return {
      draftId: b.id,
      version: token(b.version),
      state: b.ejecucion ? 'REGISTERED' : 'DRAFT',
      occurrenceId: codificarOcurrencia({ versionDePlanId: b.versionDePlanId, sesionPlanificadaId: b.sesionPlanificadaId, fechaLocal: fechaDe(b.fechaLocal) }),
      date: fechaDe(b.fechaLocal),
      timeZone: b.zonaHoraria,
      planId: b.versionDePlanId,
      sessionId: b.sesionPlanificadaId,
      granularity: b.granularidad ? GRANULARIDAD_API[b.granularidad] : null,
      sessionCondition: b.condicion ? CONDICION_DE_SESION_API[b.condicion] : null,
      reason: b.motivo,
      exercises: ejerciciosRegistradosApi(contenido.exercises, sesion, nombres),
      sessionSummary: contenido.sessionSummary,
      occurredAt: b.momentoDeOcurrencia?.toISOString() ?? null,
      executionId: b.ejecucion?.id ?? null,
      createdAt: b.momentoDeRegistro.toISOString(),
      updatedAt: b.momentoDeActualizacion.toISOString(),
    };
  }

  /** La ejecución con su original, la cadena de correcciones y la vista efectiva por relación (09v10:1205-1217). */
  async ejecucionApi(tx: Tx, id: string): Promise<EjecucionDeEntrenamiento> {
    const x = await tx.ejecucionDeEntrenamiento.findUniqueOrThrow({
      where: { id },
      include: { correcciones: { orderBy: [{ momentoDeRegistro: 'asc' }, { id: 'asc' }] }, versionDePlan: { include: { instantanea: true } } },
    });
    const instantanea = x.versionDePlan.instantanea?.contenido as unknown as InstantaneaDeEntrenamiento;
    const sesion = sesionDeOcurrenciaApi(instantanea, x.sesionPlanificadaId);
    const original = x.contenido as unknown as ContenidoDeRegistro;
    const correcciones = x.correcciones.map((c) => ({ fila: c, contenido: c.contenido as unknown as ContenidoDeCorreccion }));
    const nombres = await nombresDeEjercicios(tx, versionesRealizadas(original, ...correcciones.map((c) => c.contenido)));
    const autores = new Map<string, string>();
    for (const { fila } of correcciones) {
      if (!autores.has(fila.autorId)) autores.set(fila.autorId, fila.autorId === x.asesoradoId ? nombreDeAsesorado(fila.autorId) : await nombreVisibleDe(tx, fila.autorId));
    }
    const vista = resolverVistaEfectiva(
      x.id,
      correcciones.map(({ fila }) => ({ id: fila.id, originalId: x.id, correccionPreviaId: fila.correccionPreviaId })),
    );
    return {
      executionId: x.id,
      state: 'REGISTERED',
      adviseeId: x.asesoradoId,
      planId: x.versionDePlanId,
      snapshotDigest: x.versionDePlan.instantanea?.huella as string,
      occurrenceId: codificarOcurrencia({ versionDePlanId: x.versionDePlanId, sesionPlanificadaId: x.sesionPlanificadaId, fechaLocal: fechaDe(x.fechaLocal) }),
      date: fechaDe(x.fechaLocal),
      timeZone: x.zonaHoraria,
      plannedSession: sesion as SesionDeOcurrencia,
      original: registroApi({ granularidad: x.granularidad, condicion: x.condicion, motivo: x.motivo, contenido: original }, sesion, nombres),
      corrections: correcciones.map(({ fila, contenido }) => ({
        correctionId: fila.id,
        previousCorrectionId: fila.correccionPreviaId,
        reason: fila.motivo,
        correction: registroApi({ granularidad: contenido.granularidad, condicion: contenido.condicion, motivo: contenido.motivo, contenido }, sesion, nombres),
        author: { identityId: fila.autorId, displayName: autores.get(fila.autorId) as string },
        authorRole: fila.autorId === x.asesoradoId ? ('ADVISEE' as const) : ('PROFESSIONAL' as const),
        recordedAt: fila.momentoDeRegistro.toISOString(),
      })),
      effectiveView: vista.tipo === 'ORIGINAL' ? { kind: 'ORIGINAL' } : vista.tipo === 'CORREGIDA' ? { kind: 'CORRECTED', correctionId: vista.id } : { kind: 'NOT_RESOLVABLE' },
      occurredAt: x.momentoDeOcurrencia.toISOString(),
      recordedAt: x.momentoDeRegistro.toISOString(),
    };
  }

  /** PDP en la transacción, alcance ENTRENAMIENTO. */
  private async decidir(tx: Tx, operacion: string, actor: ActorAutenticado, profesionalId: string, titularId: string, recurso: { tipo: string; id: string } | null, ctx: ContextoDeSolicitud): Promise<void> {
    await this.pdp.decidirEnTransaccion(tx, { operacion, actorDeLaDecision: actor.identidadId, profesionalId, titularId, alcance: 'ENTRENAMIENTO', recurso }, ctx);
  }
}
