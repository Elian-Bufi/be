import { Injectable } from '@nestjs/common';
import {
  decodificarOcurrencia,
  referenciasDeEjercicio,
  sesionesDelPlan,
  type ContenidoDePlanDeEntrenamiento,
  type InstantaneaDeEntrenamiento,
  type OrigenDePlanEnPlantilla,
  type PlanConObjetivos,
  type SesionParaRegistrar,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import { ZONA_POR_DEFECTO, fechaLocalEn } from '../nutricion/zona';
import { momentoDeLaBase } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { CatalogoDeEjerciciosService } from './catalogo.service';
import { CompatibilidadDeClientesService, exigeObjetivosPorSerie } from './compatibilidad-de-clientes';
import { EjecucionesDeEntrenamientoService } from './ejecuciones.service';
import { EjecutorDeEntrenamiento, esUuid, exigirA3Vigente } from './ejecutor';
import { contenidoDeLaVersion, INCLUIR_PLAN_DE_ENTRENAMIENTO, nombreVisibleDe, resolverDeInstantanea, seguimientoAbierto, versionDePlanApi } from './lectura-entrenamiento';
import { aCitables, bloquesConObjetivosApi, ejerciciosCitados, imagenesDeEjercicios, sesionConObjetivosApi, sesionDeLaInstantanea } from './lectura-por-serie';

type Tx = Prisma.TransactionClient;

const RECURSO_VERSION = 'VersionDePlanDeEntrenamiento';
const comoFecha = (f: string): Date => new Date(`${f}T00:00:00.000Z`);

/**
 * DL-122 · las lecturas de los objetivos por serie (API-SER-01 y 02). Son operaciones nuevas: API-TRN-09 y 14, que lee
 * la APK 0.13.2 con esquemas estrictos, no cambian (docs/paquetes/WP-ENTRENAMIENTO-SERIES.md §8).
 * - Cada serie trae lo que declara, con sus tres estados (ausente hereda, `null` quita, un valor sobrescribe), y su
 *   objetivo efectivo con su origen, resuelto con `objetivosEfectivos`: la misma función que la vista previa del editor y
 *   la APK.
 * - Una versión ACTIVADA se lee desde su instantánea (REG-06-112): el objetivo histórico de una serie (versión del plan,
 *   prescripción e índice) no cambia aunque el profesional edite después.
 * - La imagen de cada ejercicio es la de su historia de solo agregar (DL-123): la vigente, o la vigente al registrar.
 * - Si el plan se le puede entregar a la app de su titular (`setTargetsDelivery`; DL-122, precierre del 2026-10-06): un plan
 *   con objetivos distintos por serie se activa solo cuando el titular ya usó una app que los muestra.
 */
@Injectable()
export class ObjetivosPorSerieService {
  constructor(
    private readonly ejecutor: EjecutorDeEntrenamiento,
    private readonly pdp: PdpService,
    private readonly catalogo: CatalogoDeEjerciciosService,
    private readonly ejecuciones: EjecucionesDeEntrenamientoService,
    private readonly compatibilidad: CompatibilidadDeClientesService,
  ) {}

  // ─── API-SER-01 ────────────────────────────────────────────────────────────────────────────
  /**
   * La versión de plan como API-TRN-09 para el profesional, con los objetivos por serie, las bases de carga y de
   * repeticiones y la imagen de cada ejercicio. El PDP es el de API-TRN-09 para el profesional del plan; cualquier otro,
   * también el titular (que lee su sesión con API-SER-02), recibe el mismo 404 que lo inexistente.
   *
   * `setTargetsDelivery` dice si esta versión exige objetivos por serie (con la misma estructura que se lee: la instantánea
   * si está activada) y si su titular ya usó una app que los muestra, lo que registran API-TRN-14 y API-SER-02.
   */
  consultarPlan(actor: ActorAutenticado, planId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: PlanConObjetivos }> {
    sinParametrosDeQuery(query);
    const recurso = { tipo: RECURSO_VERSION, id: planId };
    return this.ejecutor.leer({
      operacion: 'API-SER-01',
      casoDeUso: 'UC-P15',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const v = esUuid(planId) ? await tx.versionDePlanDeEntrenamiento.findUnique({ where: { id: planId }, include: INCLUIR_PLAN_DE_ENTRENAMIENTO }) : null;
        if (!v) throw this.ejecutor.noRevelable({ operacion: 'API-SER-01', actorId: actor.identidadId, recurso }, ctx);
        const titular = v.plan.asesoradoId;
        if (titular === actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-SER-01', actorId: actor.identidadId, recurso, sujetoId: titular }, ctx);
        await this.decidir(tx, 'API-SER-01', actor, actor.identidadId, titular, recurso, ctx);
        if (v.plan.profesionalId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-SER-01', actorId: actor.identidadId, recurso, sujetoId: titular }, ctx);
        // Un borrador nombra sus ejercicios con el catálogo vivo; una versión activada, con su instantánea (como TRN-09).
        const catalogo =
          v.estado === 'BORRADOR'
            ? aCitables(await this.catalogo.citables(tx, v.plan.profesionalId, 'PROFESIONAL', referenciasDeEjercicio(v.contenido as unknown as ContenidoDePlanDeEntrenamiento)))
            : new Map();
        const { contenido, resolver } = contenidoDeLaVersion(v, catalogo);
        const imagenes = await imagenesDeEjercicios(tx, ejerciciosCitados(sesionesDelPlan(contenido).map((s) => s.sesion), resolver), null);
        const { blocks: _laFormaQueLeeLaApk, ...cabecera } = versionDePlanApi(v, await nombreVisibleDe(tx, v.plan.profesionalId), catalogo, await seguimientoAbierto(tx, v.plan.profesionalId, titular));
        return {
          data: {
            ...cabecera,
            templateOrigin: (v.origenDePlantilla as OrigenDePlanEnPlantilla | null) ?? null,
            blocks: bloquesConObjetivosApi(contenido, resolver, imagenes),
            setTargetsDelivery: { required: exigeObjetivosPorSerie(contenido), adviseeClientCapable: await this.compatibilidad.titularCapaz(tx, titular) },
          },
        };
      },
    });
  }

  // ─── API-SER-02 ────────────────────────────────────────────────────────────────────────────
  /**
   * La sesión de una ocurrencia, lista para registrarla serie por serie. Solo el titular, y solo una ocurrencia legible:
   * - **ya registrada:** es su historia, con su A3 vigente (DL-089 opción A, como API-TRN-19). Las imágenes son las
   *   vigentes cuando se registró (`imagesAsOf`, el `recordedAt` de la ejecución);
   * - **con borrador:** con el PDP sobre su profesional, como API-TRN-16;
   * - **sin borrador:** la que puede ejecutar ahora, con las reglas de API-TRN-15 (PDP, plan vigente, versión que rige
   *   ese día y fecha no futura).
   * Lo demás, también una ocurrencia ajena o alterada, es el mismo 404: esta lectura no declara 422.
   *
   * Solo la lee la APK que muestra los objetivos de cada serie: las instaladas no la conocen. Si el pedido lo declara,
   * después de responder queda registrado, como en API-TRN-14 (`registrarDeclaracion`).
   */
  async consultarSesion(actor: ActorAutenticado, occurrenceId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: SesionParaRegistrar }> {
    sinParametrosDeQuery(query);
    const recurso = { tipo: 'Ocurrencia', id: occurrenceId };
    const respuesta = await this.ejecutor.leer<{ data: SesionParaRegistrar }>({
      operacion: 'API-SER-02',
      casoDeUso: 'UC-P17',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const noLegible = (sujetoId: string | null = actor.identidadId) => this.ejecutor.noRevelable({ operacion: 'API-SER-02', actorId: actor.identidadId, recurso, sujetoId }, ctx);
        const o = decodificarOcurrencia(occurrenceId);
        if (!o) throw noLegible(null);
        const version = await tx.versionDePlanDeEntrenamiento.findUnique({ where: { id: o.versionDePlanId }, include: { plan: true, instantanea: true } });
        // Una versión ajena o un borrador de plan no existen para el asesorado.
        if (!version || version.plan.asesoradoId !== actor.identidadId || version.estado !== 'ACTIVADA' || !version.instantanea) throw noLegible(version?.plan.asesoradoId ?? null);
        const instantanea = version.instantanea.contenido as unknown as InstantaneaDeEntrenamiento;
        const ubicada = sesionDeLaInstantanea(instantanea, o.sesionPlanificadaId);
        if (!ubicada) throw noLegible();
        const borrador = await tx.borradorDeEjecucionDeEntrenamiento.findUnique({
          where: {
            asesoradoId_versionDePlanId_sesionPlanificadaId_fechaLocal: {
              asesoradoId: actor.identidadId,
              versionDePlanId: o.versionDePlanId,
              sesionPlanificadaId: o.sesionPlanificadaId,
              fechaLocal: comoFecha(o.fechaLocal),
            },
          },
          select: { zonaHoraria: true, ejecucion: { select: { momentoDeRegistro: true } } },
        });
        if (borrador?.ejecucion) {
          await exigirA3Vigente(tx, actor.identidadId);
        } else {
          // La decisión queda registrada sobre el recurso real —la versión de la ocurrencia—: el occurrenceId es opaco.
          await this.decidir(tx, 'API-SER-02', actor, version.plan.profesionalId, actor.identidadId, { tipo: RECURSO_VERSION, id: version.id }, ctx);
          if (!borrador && !(await this.ejecutableAhora(tx, actor.identidadId, version.id, version.planId, o.sesionPlanificadaId, o.fechaLocal))) throw noLegible();
        }
        const imagesAsOf = borrador?.ejecucion?.momentoDeRegistro ?? (await momentoDeLaBase(tx));
        const resolver = resolverDeInstantanea(instantanea);
        const imagenes = await imagenesDeEjercicios(tx, ejerciciosCitados([ubicada.sesion], resolver), imagesAsOf);
        return {
          data: {
            occurrenceId,
            date: o.fechaLocal,
            timeZone: borrador?.zonaHoraria ?? ZONA_POR_DEFECTO,
            planId: version.id,
            snapshotDigest: version.instantanea.huella,
            imagesAsOf: imagesAsOf.toISOString(),
            session: sesionConObjetivosApi(ubicada.sesion, ubicada.orden, resolver, imagenes),
          },
        };
      },
    });
    await this.compatibilidad.registrarDeclaracion(actor.identidadId, ctx);
    return respuesta;
  }

  /**
   * Las reglas con las que API-TRN-15 abre un borrador, sin abrirlo: el plan con su seguimiento abierto es el de esta
   * versión, la fecha no es futura, la versión regía ese día, y la misma sesión no se empezó ese día en otra versión.
   */
  private async ejecutableAhora(tx: Tx, asesoradoId: string, versionId: string, planId: string, sesionId: string, fecha: string): Promise<boolean> {
    const plan = await this.ejecuciones.planConProcesoAbierto(tx, asesoradoId);
    if (!plan || plan.planId !== planId) return false;
    const zona = ZONA_POR_DEFECTO;
    if (fecha > fechaLocalEn(await momentoDeLaBase(tx), zona)) return false;
    if (!this.ejecuciones.versionesPertinentes(plan.versiones, fecha, zona).some((v) => v.id === versionId)) return false;
    const enOtraVersion = await tx.borradorDeEjecucionDeEntrenamiento.count({
      where: { asesoradoId, sesionPlanificadaId: sesionId, fechaLocal: comoFecha(fecha), versionDePlan: { planId }, NOT: { versionDePlanId: versionId } },
    });
    return enOtraVersion === 0;
  }

  /** PDP en la transacción, alcance ENTRENAMIENTO. */
  private async decidir(tx: Tx, operacion: string, actor: ActorAutenticado, profesionalId: string, titularId: string, recurso: { tipo: string; id: string } | null, ctx: ContextoDeSolicitud): Promise<void> {
    await this.pdp.decidirEnTransaccion(tx, { operacion, actorDeLaDecision: actor.identidadId, profesionalId, titularId, alcance: 'ENTRENAMIENTO', recurso }, ctx);
  }
}
