import { Injectable } from '@nestjs/common';
import {
  aplicarEventos,
  codificarOcurrencia,
  estadoDeLaCorrida,
  RegistrarEventosDeTiempoRequestSchema,
  type EventoDeTiempo,
  type InstantaneaDeEntrenamiento,
  type SesionEnCurso,
  type TiemposDeSesion,
  type TipoDeEventoDeTiempo as TipoApi,
} from '@be/domain';
import type { OrigenDelInstante, Prisma, TipoDeEventoDeTiempo } from '@prisma/client';
import { tieneA3Vigente } from '../consentimiento/a3-del-titular';
import type { ContextoDeSolicitud } from '../http/contexto';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecucionesDeEntrenamientoService } from './ejecuciones.service';
import { EjecutorDeEntrenamiento } from './ejecutor';
import { descansoRecomendado, eventosDeTiempo, sesionDeLaInstantanea, tiemposDeSesionApi } from './lectura-por-serie';

type Tx = Prisma.TransactionClient;

const RECURSO_BORRADOR = 'BorradorDeEjecucion';

/** El tipo de cada evento en la base. */
const TIPO_EN_LA_BASE: Readonly<Record<TipoApi, TipoDeEventoDeTiempo>> = {
  SESSION_STARTED: 'SESION_INICIADA',
  SESSION_PAUSED: 'SESION_PAUSADA',
  SESSION_RESUMED: 'SESION_REANUDADA',
  SESSION_FINISHED: 'SESION_FINALIZADA',
  EXERCISE_ACTIVATED: 'EJERCICIO_ACTIVADO',
  REST_STARTED: 'DESCANSO_INICIADO',
  REST_FINISHED: 'DESCANSO_FINALIZADO',
  SET_TIMING_STARTED: 'SERIE_CRONOMETRADA_INICIADA',
  SET_TIMING_FINISHED: 'SERIE_CRONOMETRADA_FINALIZADA',
  MEASUREMENT_LEFT_INCOMPLETE: 'MEDICION_DEJADA_INCOMPLETA',
};
const ORIGEN_EN_LA_BASE: Readonly<Record<EventoDeTiempo['at']['source'], OrigenDelInstante>> = {
  MONOTONIC: 'MONOTONICO',
  RECOVERED_WALL_CLOCK: 'RELOJ_CIVIL_RECUPERADO',
  DECLARED: 'DECLARADO',
};

/**
 * Un evento que solo cierra sin afirmar nada: deja la sesión incompleta (no dice cuándo terminó) o deja incompleta una
 * medición abierta. No opera con el profesional: es la salida de una corrida que quedó abierta.
 */
const cierraSinAfirmar = (e: EventoDeTiempo): boolean => (e.type === 'SESSION_FINISHED' && e.resolution === 'LEFT_INCOMPLETE') || e.type === 'MEASUREMENT_LEFT_INCOMPLETE';

/**
 * DL-124 · los tiempos de la sesión como eventos (API-TIE-01 a 04). La lógica es la del dominio, la misma de la APK
 * (`sesion-de-entrenamiento.ts`): `aplicarEventos` decide qué se registra y `calcularTiempos` arma los tiempos con su
 * calidad. Acá se decide quién, se bloquea lo que hay que bloquear y se guarda.
 * - **Sin Idempotency-Key:** la identidad es la de cada evento. Repetirlo con el mismo contenido es `DUPLICATE` y no
 *   suma; con otro, `CONFLICT`, y nada se reemplaza en silencio.
 * - **Una corrida por borrador y una sesión en curso por titular:** el borrador se bloquea para leer y escribir sus
 *   eventos, y un inicio toma además un cerrojo por titular. La base lo vuelve a exigir.
 * - **Una corrida huérfana siempre tiene salida:** si el acceso a su profesional se suspendió o terminó, el titular la
 *   sigue viendo en su sesión en curso (con su A3, como su historia) y la puede dejar incompleta sin ese acceso. Cerrarla
 *   lo libera para otra sesión; nada más se registra sin el PDP.
 * - **Después de confirmar:** se aceptan eventos mientras la corrida no esté cerrada; así llegan los que el teléfono tenía
 *   pendientes. Lo que llega tarde conserva su secuencia y sus instantes: `receivedAt` no reemplaza al reloj de la sesión.
 * - **Quién ve los tiempos:** el borrador, solo su titular (como API-TRN-16); la ejecución, su titular con su A3 y el
 *   profesional del plan, como API-TRN-19.
 */
@Injectable()
export class TiemposDeSesionService {
  constructor(
    private readonly ejecutor: EjecutorDeEntrenamiento,
    private readonly ejecuciones: EjecucionesDeEntrenamientoService,
  ) {}

  // ─── API-TIE-01 ────────────────────────────────────────────────────────────────────────────
  registrar(actor: ActorAutenticado, draftId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO_BORRADOR, id: draftId };
    return this.ejecutor.escribir({
      operacion: 'API-TIE-01',
      casoDeUso: 'UC-P17',
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: RegistrarEventosDeTiempoRequestSchema,
      cuerpo,
      efecto: async (tx, pedido, procedencia) => {
        // Un pedido que solo deja incompleto lo abierto es del titular y no opera con su profesional: con su A3 vigente (que
        // se toma en modo compartido, como el PDP) no pide ese acceso, así una corrida huérfana siempre se puede cerrar.
        // Sin A3, o con cualquier otro evento, decide el PDP como siempre.
        const sinPdp = pedido.events.every(cierraSinAfirmar) && (await tieneA3Vigente(tx, actor.identidadId, { bloquear: true }));
        // El borrador propio, y bloqueado: dos pedidos del mismo borrador se ordenan acá.
        const { borrador, instantanea } = await this.ejecuciones.borradorDelTitular(tx, 'API-TIE-01', actor, draftId, ctx, true, !sinPdp);
        const inicia = pedido.events.some((e) => e.type === 'SESSION_STARTED');
        // Dos inicios a la vez en dos borradores del mismo titular: el cerrojo los ordena, y el segundo ve al primero.
        if (inicia) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`sesion-en-curso|${actor.identidadId}`}, 0))`;
        const sesion = sesionDeLaInstantanea(instantanea, borrador.sesionPlanificadaId)?.sesion ?? null;
        const registrados = (await eventosDeTiempo(tx, borrador.id)).map((f) => f.contenido as unknown as EventoDeTiempo);
        const { resultados, aRegistrar } = aplicarEventos(registrados, pedido.events, {
          prescripciones: new Set(sesion?.prescriptions.map((p) => p.prescriptionId) ?? []),
          otraSesionEnCurso: inicia ? await this.otraSesionEnCurso(tx, actor.identidadId, borrador.id) : false,
        });
        // De a uno y en orden: cada fila sigue a la anterior (la base exige la secuencia sin huecos).
        for (const ev of aRegistrar) {
          await tx.eventoDeTiempoDeEntrenamiento.create({
            data: {
              borradorId: borrador.id,
              asesoradoId: actor.identidadId,
              corridaId: ev.runId,
              secuencia: ev.sequence,
              eventoId: ev.eventId,
              tipo: TIPO_EN_LA_BASE[ev.type],
              contenido: ev as unknown as Prisma.InputJsonValue,
              instanteCivil: new Date(ev.at.civil),
              anclaMonotonica: ev.at.monotonic?.anchor ?? null,
              msMonotonicos: ev.at.monotonic?.ms ?? null,
              origenDelInstante: ORIGEN_EN_LA_BASE[ev.at.source],
              // El recomendado histórico: el de la instantánea para esa prescripción y esa serie, que no cambia después.
              descansoRecomendadoSegundos: ev.type === 'REST_STARTED' ? descansoRecomendado(sesion, ev.prescriptionId, ev.setIndex) : null,
              procedencia: procedencia as unknown as Prisma.InputJsonValue,
            },
          });
        }
        const timing = tiemposDeSesionApi(borrador, borrador.ejecucion?.id ?? null, await eventosDeTiempo(tx, borrador.id));
        return { estadoHttp: 200, cuerpo: { data: { results: resultados, timing } }, sujetoId: actor.identidadId, recurso };
      },
    });
  }

  // ─── API-TIE-02 ────────────────────────────────────────────────────────────────────────────
  /** Los tiempos de un borrador, para retomar desde otro dispositivo o después de reinstalar. Solo su titular. */
  consultarDelBorrador(actor: ActorAutenticado, draftId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: TiemposDeSesion }> {
    sinParametrosDeQuery(query);
    return this.ejecutor.leer({
      operacion: 'API-TIE-02',
      casoDeUso: 'UC-P17',
      actor,
      ctx,
      recursoIntentado: { tipo: RECURSO_BORRADOR, id: draftId },
      lectura: async (tx) => {
        const { borrador } = await this.ejecuciones.borradorDelTitular(tx, 'API-TIE-02', actor, draftId, ctx);
        return { data: tiemposDeSesionApi(borrador, borrador.ejecucion?.id ?? null, await eventosDeTiempo(tx, borrador.id)) };
      },
    });
  }

  // ─── API-TIE-03 ────────────────────────────────────────────────────────────────────────────
  /**
   * Los tiempos de una ejecución registrada, para su titular (su historia: con su A3, DL-089) o para el profesional del
   * plan (PDP y propiedad, DL-057): la misma regla que API-TRN-19. Una ejecución registrada sin tiempos sigue sin
   * tiempos: no se le calcula ninguno.
   */
  consultarDeLaEjecucion(actor: ActorAutenticado, executionId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: TiemposDeSesion }> {
    sinParametrosDeQuery(query);
    return this.ejecutor.leer({
      operacion: 'API-TIE-03',
      casoDeUso: 'UC-P17',
      actor,
      ctx,
      recursoIntentado: { tipo: 'EjecucionDeEntrenamiento', id: executionId },
      lectura: async (tx) => {
        const x = await this.ejecuciones.ejecucionRevelable(tx, 'API-TIE-03', actor, executionId, ctx, 'HISTORIA');
        const { borrador } = await tx.ejecucionDeEntrenamiento.findUniqueOrThrow({
          where: { id: x.id },
          select: { borrador: { select: { id: true, versionDePlanId: true, sesionPlanificadaId: true, fechaLocal: true } } },
        });
        return { data: tiemposDeSesionApi(borrador, x.id, await eventosDeTiempo(tx, borrador.id)) };
      },
    });
  }

  // ─── API-TIE-04 ────────────────────────────────────────────────────────────────────────────
  /**
   * La sesión en curso del titular, de cualquier día y en cualquier dispositivo: la corrida empezada y sin terminar de un
   * borrador suyo que todavía no se registró. Una a lo sumo. Es su propia historia, con la regla de API-TRN-19-LISTA
   * (DL-096): con su A3 vigente se muestra aunque el acceso a su profesional esté suspendido o terminado, para que pueda
   * dejarla incompleta (API-TIE-01); sin A3, no se ofrece ninguna. No es un error: esta lectura no declara 403.
   */
  sesionEnCurso(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: { inProgress: SesionEnCurso | null } }> {
    sinParametrosDeQuery(query);
    return this.ejecutor.leer({
      operacion: 'API-TIE-04',
      casoDeUso: 'UC-P17',
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        if (!(await tieneA3Vigente(tx, actor.identidadId))) return { data: { inProgress: null } };
        for (const borradorId of await this.borradoresEnCurso(tx, actor.identidadId, null)) {
          const b = await tx.borradorDeEjecucionDeEntrenamiento.findUniqueOrThrow({
            where: { id: borradorId },
            include: { versionDePlan: { include: { instantanea: { select: { contenido: true } } } } },
          });
          const eventos = (await eventosDeTiempo(tx, b.id)).map((f) => f.contenido as unknown as EventoDeTiempo);
          const estado = estadoDeLaCorrida(eventos);
          const inicio = eventos.find((e) => e.type === 'SESSION_STARTED');
          if (!inicio || !estado.runId || estado.cierre !== null) continue;
          const instantanea = b.versionDePlan.instantanea?.contenido as unknown as InstantaneaDeEntrenamiento;
          const fecha = b.fechaLocal.toISOString().slice(0, 10);
          return {
            data: {
              inProgress: {
                draftId: b.id,
                occurrenceId: codificarOcurrencia({ versionDePlanId: b.versionDePlanId, sesionPlanificadaId: b.sesionPlanificadaId, fechaLocal: fecha }),
                date: fecha,
                sessionId: b.sesionPlanificadaId,
                sessionLabel: sesionDeLaInstantanea(instantanea, b.sesionPlanificadaId)?.sesion.label ?? 'Sesión',
                runId: estado.runId,
                state: estado.pausada ? 'PAUSED' : 'IN_PROGRESS',
                startedAt: inicio.at.civil,
                lastSequence: estado.lastSequence,
              },
            },
          };
        }
        return { data: { inProgress: null } };
      },
    });
  }

  // ─── Apoyo ─────────────────────────────────────────────────────────────────────────────────

  /**
   * Los borradores del titular con una corrida en curso: empezada, sin terminar y sin ejecución registrada. El más
   * reciente primero. `salvo` excluye uno (el del pedido).
   */
  private async borradoresEnCurso(tx: Tx, asesoradoId: string, salvo: string | null): Promise<string[]> {
    const filas = await tx.$queryRaw<{ borradorId: string }[]>`
      SELECT i."borrador_id"::text AS "borradorId"
        FROM "evento_de_tiempo_de_entrenamiento" i
       WHERE i."asesorado_id" = ${asesoradoId}::uuid AND i."tipo" = 'SESION_INICIADA'
         AND (${salvo}::uuid IS NULL OR i."borrador_id" <> ${salvo}::uuid)
         AND NOT EXISTS (SELECT 1 FROM "evento_de_tiempo_de_entrenamiento" f WHERE f."borrador_id" = i."borrador_id" AND f."tipo" = 'SESION_FINALIZADA')
         AND NOT EXISTS (SELECT 1 FROM "ejecucion_de_entrenamiento" x WHERE x."borrador_id" = i."borrador_id")
       ORDER BY i."momento_de_recepcion" DESC, i."id" DESC`;
    return filas.map((f) => f.borradorId);
  }

  /** Otro borrador del mismo titular, sin ejecución registrada, con su sesión empezada y sin terminar. */
  private async otraSesionEnCurso(tx: Tx, asesoradoId: string, borradorId: string): Promise<boolean> {
    return (await this.borradoresEnCurso(tx, asesoradoId, borradorId)).length > 0;
  }
}
