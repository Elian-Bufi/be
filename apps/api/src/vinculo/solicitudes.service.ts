import { Inject, Injectable } from '@nestjs/common';
import {
  CrearSolicitudDeVinculoRequestSchema,
  DecidirSolicitudRequestSchema,
  FINALIDAD_DE_ALCANCE,
  esAlcance,
  evaluarTransicionDeSolicitud,
  evaluarTransicionDeAlcance,
  type AceptarSolicitudResponse,
  type ActorDeVinculo,
  type Alcance,
  type CrearSolicitudDeVinculoResponse,
  type EstadoDeSolicitudDeVinculo,
  type ListaDeSolicitudesResponse,
  type Procedencia,
  type RechazarSolicitudResponse,
  type SolicitudDeduplicadaResponse,
} from '@be/domain';
import { Prisma, type TipoDeEventoDeVinculo } from '@prisma/client';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { IdempotenciaService, type ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { conReintento } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import {
  INCLUIR_PARTES_DE_SOLICITUD,
  esToken,
  itemDeSolicitud,
  registrarEventoDeVinculo,
  resumenDeAlcance,
  token,
} from './lectura';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ESTADOS: readonly EstadoDeSolicitudDeVinculo[] = ['PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'CADUCADA', 'INVALIDADA'];

interface Elegibilidad {
  readonly profesionalOperativo: boolean;
  readonly asesoradoOperativo: boolean;
  readonly perfilProfesional: boolean;
  readonly verificado: boolean;
  readonly habilitado: boolean;
}

/**
 * Solicitud de vínculo (T-06-16; 06 §7.3; UC-P04, UC-P05; API-REL-01 a 04). Máquina de @be/domain + trigger de la base.
 * - Una solicitud no concede acceso ni capacidad (INV-06-50, REG-06-57).
 * - Solo el asesorado acepta o rechaza (INV-06-52).
 * - Una sola equivalente PENDIENTE, por índice único parcial (REG-06-44).
 * - La caducidad es perezosa y parametrizada (DL-037): una solicitud vencida pasa a CADUCADA, con actor sistema, en la
 *   primera operación que la toca.
 * - Al aceptar se reevalúa la elegibilidad (REG-06-49). Si ya no es compatible, el sistema la invalida.
 */
@Injectable()
export class SolicitudesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotencia: IdempotenciaService,
    private readonly auditoria: AuditoriaService,
    @Inject(ENTORNO) private readonly entorno: Entorno,
  ) {}

  // ─── API-REL-01 ────────────────────────────────────────────────────────────────────────────
  async crear(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const operacion = 'API-REL-01';
    exigirClave(clave);
    const solicitud = validarCuerpo(CrearSolicitudDeVinculoRequestSchema, cuerpo);
    const huella = IdempotenciaService.huella(solicitud);
    // «`target.type` será la contraparte del actor autenticado» (09v8:1138).
    const actorEsProfesional = solicitud.target.type === 'ADVISEE';
    const procedencia = procedenciaDe(ctx, 'UC-P04', operacion);

    try {
      return await this.idempotencia.ejecutar({ operacion, ambito: actor.identidadId, clave: clave as string, huella }, async (tx) => {
        // Primero, todo lo que no depende de la contraparte: la respuesta a un pedido que falla por eso no puede
        // variar según exista o no el destino (09:213-233; 09v8:1188, «revelar la contraparte cuando ya es legítimo»).
        // 1) Semántica del pedido: alcance del catálogo y su finalidad (REG-06-61; DL-039).
        if (!esAlcance(solicitud.scope.code)) throw errores.alcanceNoDisponible();
        const alcance: Alcance = solicitud.scope.code;
        if (solicitud.purpose.trim() === '') throw errores.finalidadRequerida();
        if (solicitud.purpose !== FINALIDAD_DE_ALCANCE[alcance]) {
          throw errores.validacionFallida([{ code: 'PURPOSE_NOT_AVAILABLE', path: 'purpose' }]);
        }
        const destino = solicitud.target.identityId.toLowerCase();
        if (!UUID.test(destino)) throw errores.recursoNoEncontrado();
        if (destino === actor.identidadId) throw errores.contraparteNoElegible();
        const profesionalId = actorEsProfesional ? actor.identidadId : destino;
        const asesoradoId = actorEsProfesional ? destino : actor.identidadId;
        // 2) Elegibilidad propia del profesional que solicita → 422: es su propio estado y no depende del destino.
        if (actorEsProfesional && !(await this.profesionalHabilitado(tx, actor.identidadId, alcance))) throw errores.alcanceNoDisponible();

        // 3) Las dos cuentas, con bloqueo compartido y en orden de id: el cierre y la suspensión (FOR NO KEY UPDATE)
        //    quedan antes o después de esta solicitud, nunca en el medio (T13; D8). Contraparte no operativa → 404.
        const cuentas = await this.bloquearCuentas(tx, profesionalId, asesoradoId);
        if (cuentas.get(destino) !== 'OPERATIVA') throw errores.recursoNoEncontrado();
        if (cuentas.get(actor.identidadId) !== 'OPERATIVA') throw errores.estadoNoPermite();

        // 4) Elegibilidad estructural completa: de la contraparte → 404 (no revelable).
        const eleg = await this.elegibilidad(tx, profesionalId, asesoradoId, alcance);
        const profesionalElegible = eleg.perfilProfesional && eleg.verificado && eleg.habilitado;
        if (!profesionalElegible) throw actorEsProfesional ? errores.alcanceNoDisponible() : errores.recursoNoEncontrado();

        const rol: ActorDeVinculo = actorEsProfesional ? 'PROFESIONAL' : 'ASESORADO';
        const evaluacion = evaluarTransicionDeSolicitud(null, {
          transicion: 'CrearSolicitud',
          actor: rol,
          alcanceYFinalidadValidos: true,
          elegibilidadEstructural: eleg.profesionalOperativo && eleg.asesoradoOperativo && profesionalElegible,
        });
        if (!evaluacion.permitida) throw errores.estadoNoPermite();

        // 4) Estado: una vencida no bloquea la equivalente nueva; un vínculo vigente para ese alcance, sí (UC-P04 E03).
        const equivalente = { profesionalId, asesoradoId, alcance, finalidad: FINALIDAD_DE_ALCANCE[alcance] };
        await this.caducarVencidas(tx, equivalente, ctx.momentoDeRecepcion);
        const vigente = await tx.alcanceDeVinculo.findFirst({
          where: { alcance, estado: { not: 'FINALIZADO' }, vinculo: { profesionalId, asesoradoId } },
          select: { id: true },
        });
        if (vigente) throw errores.conflictoDeRecurso();

        // 5) REG-06-44: si hay una equivalente PENDIENTE, se devuelve esa (09v8:1165-1176; CAND-09-S03, DL-037).
        const pendiente = await tx.solicitudDeVinculo.findFirst({ where: { ...equivalente, estado: 'PENDIENTE' }, select: { id: true } });
        if (pendiente) {
          // Respuesta exitosa: se audita como cualquier otra (REQUIRED_SAME_TX).
          await this.auditar(tx, operacion, 'EXITO', actor.identidadId, asesoradoId, pendiente.id, ctx);
          return deduplicada(pendiente.id);
        }

        // «Reiterar crea nueva Solicitud relacionada» (REG-06-45).
        const antecedente = await tx.solicitudDeVinculo.findFirst({ where: equivalente, orderBy: ORDEN_DE_LISTA, select: { id: true } });
        const creada = await tx.solicitudDeVinculo.create({
          data: {
            ...equivalente,
            iniciador: rol === 'PROFESIONAL' ? 'PROFESIONAL' : 'ASESORADO',
            antecedenteId: antecedente?.id ?? null,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeOcurrencia: ctx.momentoDeRecepcion,
            venceEn: new Date(ctx.momentoDeRecepcion.getTime() + this.entorno.caducidadDeSolicitudMs),
          },
          include: INCLUIR_PARTES_DE_SOLICITUD,
        });
        await registrarEventoDeVinculo(tx, {
          tipo: 'SolicitudDeVinculoCreada',
          profesionalId,
          asesoradoId,
          solicitudDeVinculoId: creada.id,
          estadoPrevio: null,
          estadoPosterior: 'PENDIENTE',
          actor: { identidadId: actor.identidadId },
          procedencia,
          momento: ctx.momentoDeRecepcion,
        });
        await this.auditar(tx, operacion, 'EXITO', actor.identidadId, asesoradoId, creada.id, ctx);
        const respuesta: CrearSolicitudDeVinculoResponse = { data: itemDeSolicitud(creada) };
        return { estadoHttp: 201, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
      });
    } catch (e) {
      // Dos pedidos equivalentes simultáneos: el índice parcial deja pasar uno; el otro recibe la que quedó (REG-06-44).
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const existente = await this.prisma.solicitudDeVinculo.findFirst({
          where: {
            estado: 'PENDIENTE',
            alcance: solicitud.scope.code as Alcance,
            ...(actorEsProfesional
              ? { profesionalId: actor.identidadId, asesoradoId: solicitud.target.identityId.toLowerCase() }
              : { asesoradoId: actor.identidadId, profesionalId: solicitud.target.identityId.toLowerCase() }),
          },
          select: { id: true },
        });
        if (existente) {
          await this.auditoria.registrar({
            operacion,
            resultado: 'EXITO',
            actorId: actor.identidadId,
            recursoTipo: 'SolicitudDeVinculo',
            recursoId: existente.id,
            superficie: ctx.superficie,
            requestId: ctx.requestId,
            momentoDeOcurrencia: ctx.momentoDeRecepcion,
          });
          return deduplicada(existente.id);
        }
      }
      await this.auditarRechazo(e, operacion, actor.identidadId, ctx);
      throw e;
    }
  }

  // ─── API-REL-02 ────────────────────────────────────────────────────────────────────────────
  async listar(actor: ActorAutenticado, query: Record<string, unknown>): Promise<ListaDeSolicitudesResponse> {
    const consulta = leerConsultaDeLista(query, { state: ESTADOS });
    const propias = { OR: [{ profesionalId: actor.identidadId }, { asesoradoId: actor.identidadId }] };
    // Caducidad perezosa antes de mostrar: el estado listado es el vigente (DL-037).
    await conReintento(() => this.prisma.$transaction((tx) => this.caducarVencidas(tx, propias, new Date())));
    const filas = await this.prisma.solicitudDeVinculo.findMany({
      where: {
        AND: [propias, consulta.filtros.state ? { estado: consulta.filtros.state as EstadoDeSolicitudDeVinculo } : {}, despuesDelCursor(consulta.cursor)],
      },
      orderBy: ORDEN_DE_LISTA,
      take: consulta.limit + 1,
      include: INCLUIR_PARTES_DE_SOLICITUD,
    });
    const { pagina, page } = paginar(filas, consulta.limit);
    return { data: pagina.map(itemDeSolicitud), page };
  }

  // ─── API-REL-03 ────────────────────────────────────────────────────────────────────────────
  async aceptar(actor: ActorAutenticado, solicitudId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const operacion = 'API-REL-03';
    exigirClave(clave);
    const pedido = validarCuerpo(DecidirSolicitudRequestSchema, cuerpo);
    const huella = IdempotenciaService.huella({ solicitudId, ...pedido });
    const procedencia = procedenciaDe(ctx, 'UC-P05', operacion);
    try {
      // REG-06-49, en su propia transacción: si al aceptar la elegibilidad ya no es compatible, la solicitud queda
      // INVALIDADA aunque esta request falle. Solo para el asesorado titular: a un tercero no se le revela ni se
      // modifica nada.
      await conReintento(() => this.prisma.$transaction((tx) => this.reevaluarAntesDeDecidir(tx, actor.identidadId, solicitudId, ctx)));
      return await this.idempotencia.ejecutar({ operacion, ambito: actor.identidadId, clave: clave as string, huella }, async (tx) => {
        // Orden único de bloqueos: las dos cuentas (compartido) y después la solicitud. Un cierre concurrente queda
        // antes (y la solicitud ya está INVALIDADA) o después (y finaliza el vínculo que se crea acá).
        await this.bloquearCuentasDeLaSolicitud(tx, actor.identidadId, solicitudId);
        const s = await this.bloquearDelTitular(tx, actor.identidadId, solicitudId);
        const eleg = await this.elegibilidad(tx, s.profesionalId, s.asesoradoId, s.alcance);
        const vigente = await tx.alcanceDeVinculo.findFirst({
          where: { alcance: s.alcance, estado: { not: 'FINALIZADO' }, vinculo: { profesionalId: s.profesionalId, asesoradoId: s.asesoradoId } },
          select: { id: true },
        });
        const evaluacion = evaluarTransicionDeSolicitud(s.estado, {
          transicion: 'AceptarSolicitud',
          actor: 'ASESORADO',
          confirmacionExplicita: true,
          reevaluacionFavorable: esCompatible(eleg) && !vigente,
        });
        // 09:213-233: el estado (422) se evalúa antes que la concurrencia (409).
        if (!evaluacion.permitida) throw errores.estadoNoPermite();
        if (!esToken(pedido.expectedVersion, s.version)) throw errores.conflictoDeVersion();

        await tx.solicitudDeVinculo.update({
          where: { id: s.id },
          data: { estado: 'ACEPTADA', version: s.version + 1, momentoDeResolucion: ctx.momentoDeRecepcion },
        });
        await registrarEventoDeVinculo(tx, {
          tipo: 'SolicitudDeVinculoAceptada',
          profesionalId: s.profesionalId,
          asesoradoId: s.asesoradoId,
          solicitudDeVinculoId: s.id,
          estadoPrevio: 'PENDIENTE',
          estadoPosterior: 'ACEPTADA',
          actor: { identidadId: actor.identidadId },
          procedencia,
          momento: ctx.momentoDeRecepcion,
        });

        // AceptarAlcanceDeVinculo (06 §7.5.2), en la misma transacción: «crea o incorpora Alcance de Vínculo».
        const alcanceEvaluado = evaluarTransicionDeAlcance(null, { transicion: 'AceptarAlcanceDeVinculo', actor: 'ASESORADO', solicitudAceptada: true });
        if (!alcanceEvaluado.permitida) throw errores.estadoNoPermite();
        await tx.$executeRaw`
          INSERT INTO "vinculo" ("profesional_id", "asesorado_id", "momento_de_ocurrencia")
          VALUES (${s.profesionalId}::uuid, ${s.asesoradoId}::uuid, ${ctx.momentoDeRecepcion})
          ON CONFLICT ("profesional_id", "asesorado_id") DO NOTHING`;
        const vinculo = await tx.vinculo.findUniqueOrThrow({
          where: { profesionalId_asesoradoId: { profesionalId: s.profesionalId, asesoradoId: s.asesoradoId } },
          select: { id: true },
        });
        const componente = await tx.alcanceDeVinculo.create({
          data: {
            vinculoId: vinculo.id,
            alcance: s.alcance,
            finalidad: s.finalidad,
            solicitudDeOrigenId: s.id,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeOcurrencia: ctx.momentoDeRecepcion,
          },
        });
        await registrarEventoDeVinculo(tx, {
          tipo: 'AlcanceDeVinculoAceptado',
          profesionalId: s.profesionalId,
          asesoradoId: s.asesoradoId,
          solicitudDeVinculoId: s.id,
          alcanceDeVinculoId: componente.id,
          estadoPrevio: null,
          estadoPosterior: 'ACEPTADO',
          actor: { identidadId: actor.identidadId },
          procedencia,
          momento: ctx.momentoDeRecepcion,
        });
        await this.auditar(tx, operacion, 'EXITO', actor.identidadId, s.asesoradoId, s.id, ctx);
        const respuesta: AceptarSolicitudResponse = {
          data: {
            relationshipId: componente.id,
            relationshipState: 'ACEPTADO',
            scope: resumenDeAlcance(s.alcance),
            purpose: s.finalidad,
            // «aceptación no crea B2» (09v8:1253-1258; INV-06-53).
            consentRequired: true,
            accessMode: 'BLOCKED_PENDING_AUTHORIZATION',
          },
        };
        return { estadoHttp: 200, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
      });
    } catch (e) {
      await this.auditarRechazo(e, operacion, actor.identidadId, ctx, solicitudId);
      throw e;
    }
  }

  // ─── API-REL-04 ────────────────────────────────────────────────────────────────────────────
  async rechazar(actor: ActorAutenticado, solicitudId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const operacion = 'API-REL-04';
    exigirClave(clave);
    const pedido = validarCuerpo(DecidirSolicitudRequestSchema, cuerpo);
    const huella = IdempotenciaService.huella({ solicitudId, ...pedido });
    const procedencia = procedenciaDe(ctx, 'UC-P05', operacion);
    try {
      return await this.idempotencia.ejecutar({ operacion, ambito: actor.identidadId, clave: clave as string, huella }, async (tx) => {
        const s = await this.bloquearDelTitular(tx, actor.identidadId, solicitudId);
        await this.caducarSiVencio(tx, s, ctx.momentoDeRecepcion);
        const actual = await tx.solicitudDeVinculo.findUniqueOrThrow({ where: { id: s.id }, select: { estado: true, version: true } });
        const evaluacion = evaluarTransicionDeSolicitud(actual.estado, { transicion: 'RechazarSolicitud', actor: 'ASESORADO', confirmacionExplicita: true });
        if (!evaluacion.permitida) throw errores.estadoNoPermite();
        if (!esToken(pedido.expectedVersion, actual.version)) throw errores.conflictoDeVersion();
        await tx.solicitudDeVinculo.update({
          where: { id: s.id },
          data: { estado: 'RECHAZADA', version: actual.version + 1, momentoDeResolucion: ctx.momentoDeRecepcion },
        });
        await registrarEventoDeVinculo(tx, {
          tipo: 'SolicitudDeVinculoRechazada',
          profesionalId: s.profesionalId,
          asesoradoId: s.asesoradoId,
          solicitudDeVinculoId: s.id,
          estadoPrevio: 'PENDIENTE',
          estadoPosterior: 'RECHAZADA',
          actor: { identidadId: actor.identidadId },
          procedencia,
          momento: ctx.momentoDeRecepcion,
        });
        await this.auditar(tx, operacion, 'EXITO', actor.identidadId, s.asesoradoId, s.id, ctx);
        const respuesta: RechazarSolicitudResponse = { data: { relationshipRequestId: s.id, state: 'RECHAZADA', version: token(actual.version + 1) } };
        return { estadoHttp: 200, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
      });
    } catch (e) {
      await this.auditarRechazo(e, operacion, actor.identidadId, ctx, solicitudId);
      throw e;
    }
  }

  // ─── Transiciones del sistema ──────────────────────────────────────────────────────────────

  /**
   * CaducarSolicitud (06:3035) para las PENDIENTE vencidas del filtro. Actor: sistema (DL-037). Lee sin bloquear: si
   * dos requests llegan juntas, la transición condicional deja pasar a una y la otra sigue sin error.
   */
  async caducarVencidas(tx: Prisma.TransactionClient, filtro: Prisma.SolicitudDeVinculoWhereInput, momento: Date): Promise<void> {
    const vencidas = await tx.solicitudDeVinculo.findMany({
      where: { AND: [filtro, { estado: 'PENDIENTE', venceEn: { lte: momento } }] },
      // En orden de id, como el cierre: dos transacciones que caducan las mismas solicitudes no se bloquean cruzadas.
      orderBy: { id: 'asc' },
      select: { id: true, version: true, profesionalId: true, asesoradoId: true, estado: true, venceEn: true },
    });
    for (const s of vencidas) await this.caducarSiVencio(tx, s, momento);
  }

  /** InvalidarSolicitud (06:3036) de todas las PENDIENTE de una identidad que cierra su cuenta (T13; REG-06-24 inc. 5). */
  async invalidarPorCierre(tx: Prisma.TransactionClient, identidadId: string, procedencia: Procedencia, momento: Date): Promise<number> {
    const pendientes = await tx.$queryRaw<{ id: string; version: number; profesional_id: string; asesorado_id: string }[]>`
      SELECT "id"::text, "version", "profesional_id"::text, "asesorado_id"::text FROM "solicitud_de_vinculo"
       WHERE "estado" = 'PENDIENTE' AND ("profesional_id" = ${identidadId}::uuid OR "asesorado_id" = ${identidadId}::uuid)
       ORDER BY "id" FOR NO KEY UPDATE`;
    let invalidadas = 0;
    for (const s of pendientes) {
      if (await this.transicionDelSistema(tx, 'InvalidarSolicitud', { id: s.id, version: s.version, profesionalId: s.profesional_id, asesoradoId: s.asesorado_id }, procedencia, momento)) {
        invalidadas++;
      }
    }
    return invalidadas;
  }

  /**
   * REG-06-49: antes de aceptar, si la solicitud del titular ya no es compatible, el sistema la invalida. Queda con el
   * request que la disparó (procedencia) y auditada, aunque ese request termine después en 409 o 422.
   */
  private async reevaluarAntesDeDecidir(tx: Prisma.TransactionClient, asesoradoId: string, solicitudId: string, ctx: ContextoDeSolicitud): Promise<void> {
    if (!UUID.test(solicitudId)) return;
    const momento = ctx.momentoDeRecepcion;
    const [s] = await tx.$queryRaw<{ id: string; version: number; estado: EstadoDeSolicitudDeVinculo; profesional_id: string; asesorado_id: string; alcance: Alcance; vence_en: Date }[]>`
      SELECT "id"::text, "version", "estado"::text AS "estado", "profesional_id"::text, "asesorado_id"::text, "alcance"::text AS "alcance", "vence_en"
        FROM "solicitud_de_vinculo" WHERE "id" = ${solicitudId}::uuid AND "asesorado_id" = ${asesoradoId}::uuid FOR NO KEY UPDATE`;
    if (!s || s.estado !== 'PENDIENTE') return;
    const fila = { id: s.id, version: s.version, profesionalId: s.profesional_id, asesoradoId: s.asesorado_id, estado: s.estado, venceEn: s.vence_en };
    if (s.vence_en.getTime() <= momento.getTime()) {
      if (await this.caducarSiVencio(tx, fila, momento, ctx.requestId)) await this.auditarSistema(tx, 'SolicitudDeVinculoCaducada', fila, ctx);
      return;
    }
    const eleg = await this.elegibilidad(tx, s.profesional_id, s.asesorado_id, s.alcance);
    const vigente = await tx.alcanceDeVinculo.findFirst({
      where: { alcance: s.alcance, estado: { not: 'FINALIZADO' }, vinculo: { profesionalId: s.profesional_id, asesoradoId: s.asesorado_id } },
      select: { id: true },
    });
    if (!esCompatible(eleg) || vigente) {
      if (await this.transicionDelSistema(tx, 'InvalidarSolicitud', fila, procedenciaDelSistema('REG-06-49', ctx.requestId), momento)) {
        await this.auditarSistema(tx, 'SolicitudDeVinculoInvalidada', fila, ctx);
      }
    }
  }

  private async caducarSiVencio(
    tx: Prisma.TransactionClient,
    s: { id: string; version: number; profesionalId: string; asesoradoId: string; estado: EstadoDeSolicitudDeVinculo; venceEn: Date },
    momento: Date,
    requestId: string | null = null,
  ): Promise<boolean> {
    if (s.estado !== 'PENDIENTE' || s.venceEn.getTime() > momento.getTime()) return false;
    return this.transicionDelSistema(tx, 'CaducarSolicitud', s, procedenciaDelSistema('DL-037', requestId), momento);
  }

  private async transicionDelSistema(
    tx: Prisma.TransactionClient,
    transicion: 'CaducarSolicitud' | 'InvalidarSolicitud',
    s: { id: string; version: number; profesionalId: string; asesoradoId: string },
    procedencia: Procedencia,
    momento: Date,
  ): Promise<boolean> {
    const evaluacion = evaluarTransicionDeSolicitud(
      'PENDIENTE',
      transicion === 'CaducarSolicitud' ? { transicion, actor: 'SISTEMA', vencida: true } : { transicion, actor: 'SISTEMA', incompatible: true },
    );
    if (!evaluacion.permitida) throw errores.estadoNoPermite();
    const destino = evaluacion.transicion.destino;
    // Condicional: si otra transacción ya la resolvió (dos listados simultáneos, o la caducidad contra una decisión),
    // no hay nada que hacer y no es un error.
    const { count } = await tx.solicitudDeVinculo.updateMany({
      where: { id: s.id, estado: 'PENDIENTE', version: s.version },
      data: { estado: destino, version: s.version + 1, momentoDeResolucion: momento },
    });
    if (count === 0) return false;
    await registrarEventoDeVinculo(tx, {
      tipo: evaluacion.transicion.evento as TipoDeEventoDeVinculo,
      profesionalId: s.profesionalId,
      asesoradoId: s.asesoradoId,
      solicitudDeVinculoId: s.id,
      estadoPrevio: 'PENDIENTE',
      estadoPosterior: destino,
      actor: 'SISTEMA',
      procedencia,
      momento,
    });
    return true;
  }

  /** Bloqueo compartido de las dos cuentas, en orden de id (orden único: prisma/concurrencia.ts). Devuelve su estado. */
  private async bloquearCuentas(tx: Prisma.TransactionClient, a: string, b: string): Promise<Map<string, string>> {
    const filas = await tx.$queryRaw<{ id: string; estado: string }[]>`
      SELECT "id"::text AS "id", "estado_operativo_de_cuenta"::text AS "estado" FROM "identidad"
       WHERE "id" IN (${a}::uuid, ${b}::uuid) ORDER BY "id" FOR SHARE`;
    return new Map(filas.map((f) => [f.id, f.estado]));
  }

  /** Las cuentas de una solicitud del titular, antes de bloquear la solicitud. Si no es suya, no bloquea nada. */
  private async bloquearCuentasDeLaSolicitud(tx: Prisma.TransactionClient, asesoradoId: string, solicitudId: string): Promise<void> {
    if (!UUID.test(solicitudId)) return;
    const [partes] = await tx.$queryRaw<{ profesional_id: string }[]>`
      SELECT "profesional_id"::text FROM "solicitud_de_vinculo" WHERE "id" = ${solicitudId}::uuid AND "asesorado_id" = ${asesoradoId}::uuid`;
    if (partes) await this.bloquearCuentas(tx, partes.profesional_id, asesoradoId);
  }

  /** Perfil, verificación y habilitación del profesional para el alcance (06 §6.8; REG-06-79). */
  private async profesionalHabilitado(tx: Prisma.TransactionClient, profesionalId: string, alcance: Alcance): Promise<boolean> {
    const e = await this.elegibilidad(tx, profesionalId, profesionalId, alcance);
    return e.perfilProfesional && e.verificado && e.habilitado;
  }

  /** Transición del sistema disparada por un request: queda auditada con ese request, sin actor humano. */
  private async auditarSistema(
    tx: Prisma.TransactionClient,
    hecho: 'SolicitudDeVinculoInvalidada' | 'SolicitudDeVinculoCaducada',
    s: { id: string; asesoradoId: string },
    ctx: ContextoDeSolicitud,
  ): Promise<void> {
    await this.auditoria.registrar(
      {
        operacion: 'API-REL-03',
        resultado: 'EXITO',
        motivo: hecho,
        actorId: null,
        sujetoId: s.asesoradoId,
        recursoTipo: 'SolicitudDeVinculo',
        recursoId: s.id,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      },
      tx,
    );
  }

  /** La solicitud, bloqueada, solo si el actor es su asesorado titular. Si no, 404 idéntico (09:226). */
  private async bloquearDelTitular(tx: Prisma.TransactionClient, asesoradoId: string, solicitudId: string) {
    if (!UUID.test(solicitudId)) throw errores.recursoNoEncontrado();
    const [s] = await tx.$queryRaw<
      { id: string; version: number; estado: EstadoDeSolicitudDeVinculo; profesionalId: string; asesoradoId: string; alcance: Alcance; finalidad: string; venceEn: Date }[]
    >`
      SELECT "id"::text, "version", "estado"::text AS "estado", "profesional_id"::text AS "profesionalId", "asesorado_id"::text AS "asesoradoId",
             "alcance"::text AS "alcance", "finalidad"::text AS "finalidad", "vence_en" AS "venceEn"
        FROM "solicitud_de_vinculo" WHERE "id" = ${solicitudId}::uuid AND "asesorado_id" = ${asesoradoId}::uuid FOR NO KEY UPDATE`;
    if (!s) throw errores.recursoNoEncontrado();
    return { ...s, finalidad: FINALIDAD_DE_ALCANCE[s.alcance] };
  }

  /** Elegibilidad estructural en una sola lectura (REG-06-49: identidades, Verificación y Habilitación). */
  private async elegibilidad(tx: Prisma.TransactionClient, profesionalId: string, asesoradoId: string, alcance: Alcance): Promise<Elegibilidad> {
    const [f] = await tx.$queryRaw<
      { profesional_operativo: boolean; asesorado_operativo: boolean; perfil: boolean; verificado: boolean; habilitado: boolean }[]
    >`
      SELECT EXISTS (SELECT 1 FROM "identidad" WHERE "id" = ${profesionalId}::uuid AND "estado_operativo_de_cuenta" = 'OPERATIVA') AS "profesional_operativo",
             EXISTS (SELECT 1 FROM "identidad" WHERE "id" = ${asesoradoId}::uuid AND "estado_operativo_de_cuenta" = 'OPERATIVA') AS "asesorado_operativo",
             EXISTS (SELECT 1 FROM "perfil_profesional" WHERE "identidad_id" = ${profesionalId}::uuid) AS "perfil",
             EXISTS (SELECT 1 FROM "verificacion_profesional" WHERE "identidad_id" = ${profesionalId}::uuid
                        AND "alcance" = ${alcance}::"Alcance" AND "estado" = 'VERIFICADO') AS "verificado",
             EXISTS (SELECT 1 FROM "habilitacion" WHERE "identidad_id" = ${profesionalId}::uuid
                        AND "alcance" = ${alcance}::"Alcance" AND "estado" = 'CONCEDIDA') AS "habilitado"`;
    return {
      profesionalOperativo: f.profesional_operativo,
      asesoradoOperativo: f.asesorado_operativo,
      perfilProfesional: f.perfil,
      verificado: f.verificado,
      habilitado: f.habilitado,
    };
  }

  private async auditar(
    tx: Prisma.TransactionClient,
    operacion: string,
    resultado: 'EXITO' | 'RECHAZO',
    actorId: string,
    sujetoId: string | null,
    recursoId: string | null,
    ctx: ContextoDeSolicitud,
  ): Promise<void> {
    await this.auditoria.registrar(
      {
        operacion,
        resultado,
        actorId,
        sujetoId,
        recursoTipo: 'SolicitudDeVinculo',
        recursoId,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      },
      tx,
    );
  }

  /**
   * Rechazo auditado fuera de la transacción revertida (patrón de WP-02). Sin sujeto: no se revela a quién apuntaba.
   * Con la solicitud intentada, si tiene forma de identificador: permite reconstruir un intento de enumeración.
   */
  private async auditarRechazo(e: unknown, operacion: string, actorId: string, ctx: ContextoDeSolicitud, solicitudId?: string): Promise<void> {
    if (!(e instanceof ErrorDeApi)) return;
    await this.auditoria.registrar({
      operacion,
      resultado: 'RECHAZO',
      motivo: e.code,
      actorId,
      recursoTipo: solicitudId && UUID.test(solicitudId) ? 'SolicitudDeVinculo' : null,
      recursoId: solicitudId && UUID.test(solicitudId) ? solicitudId.toLowerCase() : null,
      superficie: ctx.superficie,
      requestId: ctx.requestId,
      momentoDeOcurrencia: ctx.momentoDeRecepcion,
    });
  }
}

function exigirClave(clave: string | undefined): void {
  if (!IdempotenciaService.claveValida(clave)) {
    throw errores.solicitudInvalida([{ code: 'IDEMPOTENCY_KEY_REQUIRED', path: 'Idempotency-Key' }], { header: 'Idempotency-Key' });
  }
}

function deduplicada(id: string): ResultadoIdempotente {
  const respuesta: SolicitudDeduplicadaResponse = { data: { relationshipRequestId: id, deduplicated: true } };
  return { estadoHttp: 200, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
}

function esCompatible(e: Elegibilidad): boolean {
  return e.profesionalOperativo && e.asesoradoOperativo && e.perfilProfesional && e.verificado && e.habilitado;
}

function procedenciaDelSistema(fundamento: string, requestId: string | null = null): Procedencia {
  return { fuente: 'PROPIA', casoDeUso: 'SISTEMA', operacion: fundamento, superficie: null, requestId };
}
