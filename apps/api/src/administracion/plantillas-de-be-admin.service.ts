import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  ConsultarPlantillasDeBeRequestSchema,
  DecidirSobrePlantillaDeBeRequestSchema,
  plantillaDeBeParaLaApi,
  type ListaDePlantillasDeBeParaAdministrarResponse,
  type PlantillaDeBe,
} from '@be/domain';
import { Prisma } from '@prisma/client';
import { catalogoDeLasPlantillasDeBe, decisionesSobreLasPlantillasDeBe, estadoVigente, plantillasDeBeVigentes, type DecisionLeida } from '../entrenamiento/plantillas-de-be';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { IdempotenciaService, type ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAdministrativo } from './sesion-administrativa.guard';

type Tx = Prisma.TransactionClient;
type Cliente = Tx | PrismaService;
const CASO_DE_USO = 'UC-P15';
const RECURSO = 'PlantillaDeBe';

/**
 * DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3, ET3-05) · Administración y las Plantillas de BE de Entrenamiento: las ve todas,
 * con su historia (API-TPB-03), y decide si cada una se ofrece o se retira (API-TPB-04), con la autorización de
 * WP-ADMINISTRACION (la sesión administrativa con el segundo factor la exige el controlador). El contenido de cada plantilla
 * lo cura Dirección como datos versionados de BE (ET3-D01): acá no se edita. Retirarla no toca los planes que ya salieron
 * de ella (son de cada persona). Cada operación queda auditada, sin los textos.
 */
@Injectable()
export class PlantillasDeBeAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotencia: IdempotenciaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  // ─── API-TPB-03 ──────────────────────────────────────────────────────────────────────────────
  async consultar(actor: ActorAdministrativo, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ListaDePlantillasDeBeParaAdministrarResponse> {
    validarCuerpo(ConsultarPlantillasDeBeRequestSchema, cuerpo ?? {});
    const respuesta = { data: await this.leer(this.prisma, plantillasDeBeVigentes()) };
    await this.auditar(this.prisma, 'API-TPB-03', 'EXITO', null, actor.identidadId, ctx);
    return respuesta;
  }

  // ─── API-TPB-04 ──────────────────────────────────────────────────────────────────────────────
  async decidir(actor: ActorAdministrativo, clave: string, cuerpo: unknown, claveDeIdempotencia: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const pedido = validarCuerpo(DecidirSobrePlantillaDeBeRequestSchema, cuerpo);
    if (!IdempotenciaService.claveValida(claveDeIdempotencia)) throw errores.solicitudInvalida([{ code: 'IDEMPOTENCY_KEY_REQUIRED', path: 'Idempotency-Key' }], { header: 'Idempotency-Key' });
    const plantilla = plantillasDeBeVigentes().find((p) => p.clave === clave) ?? null;
    const motivo = pedido.reason?.trim() || null;
    if (pedido.decision === 'PUBLISH' && motivo) {
      await this.auditar(this.prisma, 'API-TPB-04', 'RECHAZO', 'VALIDATION_FAILED', actor.identidadId, ctx);
      throw errores.validacionFallida([{ code: 'REASON_NOT_EXPECTED', path: 'reason' }]);
    }
    const procedencia = procedenciaDe(ctx, CASO_DE_USO, 'API-TPB-04');
    try {
      return await this.idempotencia.ejecutar(
        { operacion: 'API-TPB-04', ambito: actor.identidadId, clave: claveDeIdempotencia as string, huella: IdempotenciaService.huella({ clave, pedido }) },
        async (tx) => {
          if (!plantilla) throw new ErrorDeApi(404, CodigoDeError.RESOURCE_NOT_FOUND, 'Recurso no encontrado.', undefined, 'PLANTILLA_DE_BE_NO_ENCONTRADA');
          // Las decisiones sobre una clave se ordenan: dos simultáneas no se pisan, y la segunda ve la primera.
          const cerrojo = `plantilla-de-be:${plantilla.clave}`;
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${cerrojo}))`;
          const estado = estadoVigente(await decisionesSobreLasPlantillasDeBe(tx), plantilla.clave);
          const pedida = pedido.decision === 'PUBLISH' ? 'PUBLISHED' : 'WITHDRAWN';
          if (estado === pedida) {
            throw new ErrorDeApi(422, CodigoDeError.INVALID_STATE_TRANSITION, pedida === 'PUBLISHED' ? 'Esa plantilla ya se ofrece.' : 'Esa plantilla ya está retirada.', undefined, 'MISMO_ESTADO');
          }
          const momento = await momentoDeLaBase(tx);
          await tx.decisionSobrePlantillaDeBe.create({
            data: {
              clave: plantilla.clave,
              estado: pedida === 'PUBLISHED' ? 'PUBLICADA' : 'RETIRADA',
              motivo: pedida === 'WITHDRAWN' ? motivo : null,
              administradorId: actor.identidadId,
              procedencia: procedencia as unknown as Prisma.InputJsonValue,
              momentoDeRegistro: momento,
            },
          });
          await this.auditar(tx, 'API-TPB-04', 'EXITO', pedida === 'PUBLISHED' ? 'PUBLICADA' : 'RETIRADA', actor.identidadId, ctx);
          const [leida] = await this.leer(tx, [plantilla]);
          return { estadoHttp: 200, cuerpo: { data: leida! } as unknown as Prisma.InputJsonValue };
        },
      );
    } catch (e) {
      if (e instanceof ErrorDeApi) await this.auditar(this.prisma, 'API-TPB-04', 'RECHAZO', e.motivoDeAuditoria ?? e.code, actor.identidadId, ctx);
      throw e;
    }
  }

  /** Las plantillas, en la forma de lo que ve Administración: con su estado y su historia (quién, cuándo y por qué). */
  private async leer(cliente: Cliente, plantillas: readonly PlantillaDeBe[]) {
    const [catalogo, decisiones] = await Promise.all([catalogoDeLasPlantillasDeBe(cliente, plantillas), decisionesSobreLasPlantillasDeBe(cliente)]);
    const ids = [...new Set([...decisiones.values()].flatMap((l) => l.map((d) => d.administradorId)))];
    const roles = ids.length === 0 ? [] : await cliente.rolAdministrativo.findMany({ where: { identidadId: { in: ids } }, orderBy: { momentoDeRegistro: 'desc' }, select: { identidadId: true, nombreVisible: true } });
    const nombres = new Map<string, string>();
    for (const r of roles) if (!nombres.has(r.identidadId)) nombres.set(r.identidadId, r.nombreVisible);
    const historia = (l: readonly DecisionLeida[] | undefined) =>
      (l ?? []).map((d) => ({ state: d.estado, reason: d.motivo, decidedAt: d.momento.toISOString(), administratorName: nombres.get(d.administradorId) ?? null }));
    return plantillas.map((p) => ({ ...plantillaDeBeParaLaApi(p, catalogo, estadoVigente(decisiones, p.clave)), history: historia(decisiones.get(p.clave)) }));
  }

  private auditar(cliente: Cliente, operacion: string, resultado: 'EXITO' | 'RECHAZO', motivo: string | null, actorId: string, ctx: ContextoDeSolicitud): Promise<void> {
    return this.auditoria.registrar(
      { operacion, resultado, motivo, actorId, sujetoId: null, recursoTipo: RECURSO, recursoId: null, superficie: ctx.superficie, requestId: ctx.requestId, momentoDeOcurrencia: ctx.momentoDeRecepcion },
      cliente as Tx,
    );
  }
}
