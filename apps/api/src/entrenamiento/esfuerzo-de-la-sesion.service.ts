import { Injectable } from '@nestjs/common';
import {
  cargaDeLaSesion,
  CodigoDeError,
  RegistrarEsfuerzoDeLaSesionRequestSchema,
  sesionesDelPlan,
  type EsfuerzoDeLaSesion,
  type EsfuerzosDeLaSesionResponse,
  type InstantaneaDeEntrenamiento,
  type OrigenDeLosMinutos,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { sinDuplicar } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecucionesDeEntrenamientoService } from './ejecuciones.service';
import { EjecutorDeEntrenamiento } from './ejecutor';

const CASO_DE_USO = 'UC-P17';
const RECURSO = 'EsfuerzoDeSesionDeEntrenamiento';
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
/** El período más largo que lee API-ESF-02: un año, para el gráfico. */
const DIAS_MAXIMOS = 366;
const fechaDe = (d: Date): string => d.toISOString().slice(0, 10);
const comoFecha = (f: string): Date => new Date(`${f}T00:00:00.000Z`);

interface FilaConEjecucion {
  readonly ejecucionId: string;
  readonly valor: number;
  readonly minutos: number | null;
  readonly origenDeMinutos: string | null;
  readonly momentoDeRegistro: Date;
  readonly ejecucion: { readonly fechaLocal: Date; readonly sesionPlanificadaId: string; readonly versionDePlan: { readonly instantanea: { readonly contenido: unknown } | null } };
}

/** El nombre de la sesión en la instantánea contra la que se registró. */
function nombreDeLaSesion(f: FilaConEjecucion): string {
  const instantanea = f.ejecucion.versionDePlan.instantanea?.contenido as InstantaneaDeEntrenamiento | undefined;
  return (instantanea?.contenido ? sesionesDelPlan(instantanea.contenido).find((s) => s.sesion.sessionId === f.ejecucion.sesionPlanificadaId)?.sesion.label : undefined) ?? '';
}

function esfuerzoApi(f: FilaConEjecucion): EsfuerzoDeLaSesion {
  return {
    executionId: f.ejecucionId,
    date: fechaDe(f.ejecucion.fechaLocal),
    sessionLabel: nombreDeLaSesion(f),
    rating: f.valor,
    durationMinutes: f.minutos,
    durationSource: (f.origenDeMinutos as OrigenDeLosMinutos | null) ?? null,
    sessionLoad: cargaDeLaSesion(f.valor, f.minutos),
    recordedAt: f.momentoDeRegistro.toISOString(),
  };
}

const CON_LA_EJECUCION = { ejecucion: { select: { fechaLocal: true, sesionPlanificadaId: true, versionDePlan: { select: { instantanea: { select: { contenido: true } } } } } } } as const;

/**
 * DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2, ET2-07 a ET2-09) · el esfuerzo de la sesión (Foster): API-ESF-01 y 02.
 * Operaciones nuevas, como la nota para tu profe (API-TRN-25): confirmar (API-TRN-18) no cambia, y el esfuerzo viaja
 * después, aparte; si falla o la persona lo saltea, la sesión ya quedó registrada.
 * - **Lo responde la persona de la sesión**, con el permiso con que corrige su registro: el PDP del par con su
 *   profesional. El profesional del plan no responde por ella: el mismo 404 que lo ajeno.
 * - **Uno por sesión, de solo agregar** (la base lo sostiene): un segundo es 409 RESOURCE_CONFLICT.
 * - **El profesional de Entrenamiento lo lee** (API-ESF-02) en las sesiones que ya ve, por período, con la carga de la
 *   sesión (esfuerzo × minutos). Otra área: el 404 de lo inexistente.
 */
@Injectable()
export class EsfuerzoDeLaSesionService {
  constructor(
    private readonly ejecutor: EjecutorDeEntrenamiento,
    private readonly ejecuciones: EjecucionesDeEntrenamientoService,
    private readonly pdp: PdpService,
  ) {}

  // ─── API-ESF-01 ────────────────────────────────────────────────────────────────────────────
  registrar(actor: ActorAutenticado, executionId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'EjecucionDeEntrenamiento', id: executionId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-ESF-01',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: RegistrarEsfuerzoDeLaSesionRequestSchema,
      cuerpo,
      huellaExtra: { executionId },
      efecto: async (tx, pedido, procedencia) => {
        const x = await this.ejecuciones.ejecucionRevelable(tx, 'API-ESF-01', actor, executionId, ctx);
        if (x.asesoradoId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-ESF-01', actorId: actor.identidadId, recurso, sujetoId: x.asesoradoId }, ctx);
        const yaEsta = () => new ErrorDeApi(409, CodigoDeError.RESOURCE_CONFLICT, 'Esta sesión ya tiene su esfuerzo guardado.', { issues: [{ code: 'SESSION_EFFORT_ALREADY_RECORDED', path: 'rating' }] });
        if (await tx.esfuerzoDeSesionDeEntrenamiento.findUnique({ where: { ejecucionId: x.id }, select: { id: true } })) throw yaEsta();
        const creada = await sinDuplicar(
          tx.esfuerzoDeSesionDeEntrenamiento.create({
            data: {
              ejecucionId: x.id,
              asesoradoId: actor.identidadId,
              valor: pedido.rating,
              minutos: pedido.durationMinutes,
              origenDeMinutos: pedido.durationSource,
              procedencia: procedencia as unknown as Prisma.InputJsonValue,
            },
          }),
          yaEsta,
        );
        const fila = await tx.esfuerzoDeSesionDeEntrenamiento.findUniqueOrThrow({ where: { id: creada.id }, include: CON_LA_EJECUCION });
        return { estadoHttp: 201, cuerpo: { data: esfuerzoApi(fila) }, sujetoId: actor.identidadId, recurso: { tipo: RECURSO, id: creada.id } };
      },
    });
  }

  // ─── API-ESF-02 ────────────────────────────────────────────────────────────────────────────
  /** Los del período en las sesiones que el profesional ve (las de sus planes con esa persona), de la más vieja a la más nueva. */
  delProfesional(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<EsfuerzosDeLaSesionResponse> {
    const { periodStart, periodEnd, ...resto } = query;
    sinParametrosDeQuery(resto);
    if (typeof periodStart !== 'string' || !FECHA.test(periodStart) || typeof periodEnd !== 'string' || !FECHA.test(periodEnd)) {
      throw errores.solicitudInvalida([{ code: 'PERIOD_REQUIRED', path: 'periodStart' }]);
    }
    for (const [path, f] of [['periodStart', periodStart], ['periodEnd', periodEnd]] as const) {
      if (Number.isNaN(comoFecha(f).getTime()) || fechaDe(comoFecha(f)) !== f) throw errores.solicitudInvalida([{ code: 'INVALID_DATE', path }]);
    }
    const dias = (comoFecha(periodEnd).getTime() - comoFecha(periodStart).getTime()) / 86_400_000;
    if (Number.isNaN(dias) || dias < 0 || dias >= DIAS_MAXIMOS) throw errores.solicitudInvalida([{ code: 'PERIOD_INVALID', path: 'periodEnd' }]);
    return this.ejecutor.leer({
      operacion: 'API-ESF-02',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        const d = await this.pdp.decidirEnTransaccion(
          tx,
          { operacion: 'API-ESF-02', actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: adviseeId, alcance: 'ENTRENAMIENTO', recurso: null },
          ctx,
        );
        const asesoradoId = d.hechos.titular?.identidadId as string;
        const filas = await tx.esfuerzoDeSesionDeEntrenamiento.findMany({
          where: {
            asesoradoId,
            ejecucion: { asesoradoId, versionDePlan: { plan: { profesionalId: actor.identidadId } }, fechaLocal: { gte: comoFecha(periodStart), lte: comoFecha(periodEnd) } },
          },
          include: CON_LA_EJECUCION,
          orderBy: [{ ejecucion: { fechaLocal: 'asc' } }, { momentoDeRegistro: 'asc' }, { id: 'asc' }],
        });
        return { data: { from: periodStart, to: periodEnd, efforts: filas.map(esfuerzoApi) } };
      },
    });
  }
}
