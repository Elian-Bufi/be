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
        // 1) Revelabilidad de la contraparte (09:213-233): inexistente, no operativa o no elegible → 404 idéntico.
        const destino = solicitud.target.identityId;
        if (!UUID.test(destino)) throw errores.recursoNoEncontrado();
        if (destino.toLowerCase() === actor.identidadId) throw errores.contraparteNoElegible();
        const contraparte = await tx.identidad.findUnique({ where: { id: destino }, select: { estadoOperativoDeCuenta: true } });
        if (!contraparte || contraparte.estadoOperativoDeCuenta !== 'OPERATIVA') throw errores.recursoNoEncontrado();

        // 2) Semántica del pedido: alcance del catálogo y su finalidad (REG-06-61; DL-039).
        if (!esAlcance(solicitud.scope.code)) throw errores.alcanceNoDisponible();
        const alcance: Alcance = solicitud.scope.code;
        if (solicitud.purpose.trim() === '') throw errores.finalidadRequerida();
        if (solicitud.purpose !== FINALIDAD_DE_ALCANCE[alcance]) {
          throw errores.validacionFallida([{ code: 'PURPOSE_NOT_AVAILABLE', path: 'purpose' }]);
        }

        // 3) Elegibilidad estructural: del actor → 422 (es su propio estado); de la contraparte → 404 (no revelable).
        const profesionalId = actorEsProfesional ? actor.identidadId : destino.toLowerCase();
        const asesoradoId = actorEsProfesional ? destino.toLowerCase() : actor.identidadId;
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
        if (pendiente) return deduplicada(pendiente.id);

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
        if (existente) return deduplicada(existente.id);
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
    await this.prisma.$transaction((tx) => this.caducarVencidas(tx, propias, new Date()));
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
      await this.prisma.$transaction((tx) => this.reevaluarAntesDeDecidir(tx, actor.identidadId, solicitudId, ctx.momentoDeRecepcion));
      return await this.idempotencia.ejecutar({ operacion, ambito: actor.identidadId, clave: clave as string, huella }, async (tx) => {
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
      await this.auditarRechazo(e, operacion, actor.identidadId, ctx);
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
      await this.auditarRechazo(e, operacion, actor.identidadId, ctx);
      throw e;
    }
  }

  // ─── Transiciones del sistema ──────────────────────────────────────────────────────────────

  /** CaducarSolicitud (06:3035) para las PENDIENTE vencidas del filtro. Actor: sistema (DL-037). */
  async caducarVencidas(tx: Prisma.TransactionClient, filtro: Prisma.SolicitudDeVinculoWhereInput, momento: Date): Promise<void> {
    const vencidas = await tx.solicitudDeVinculo.findMany({
      where: { AND: [filtro, { estado: 'PENDIENTE', venceEn: { lte: momento } }] },
      select: { id: true, version: true, profesionalId: true, asesoradoId: true, estado: true, venceEn: true },
    });
    for (const s of vencidas) await this.caducarSiVencio(tx, s, momento);
  }

  /** InvalidarSolicitud (06:3036) de todas las PENDIENTE de una identidad que cierra su cuenta (T13; REG-06-24 inc. 5). */
  async invalidarPorCierre(tx: Prisma.TransactionClient, identidadId: string, procedencia: Procedencia, momento: Date): Promise<number> {
    const pendientes = await tx.$queryRaw<{ id: string; version: number; profesional_id: string; asesorado_id: string }[]>`
      SELECT "id"::text, "version", "profesional_id"::text, "asesorado_id"::text FROM "solicitud_de_vinculo"
       WHERE "estado" = 'PENDIENTE' AND ("profesional_id" = ${identidadId}::uuid OR "asesorado_id" = ${identidadId}::uuid)
       ORDER BY "id" FOR UPDATE`;
    for (const s of pendientes) {
      await this.transicionDelSistema(tx, 'InvalidarSolicitud', { id: s.id, version: s.version, profesionalId: s.profesional_id, asesoradoId: s.asesorado_id }, procedencia, momento);
    }
    return pendientes.length;
  }

  /** REG-06-49: antes de aceptar, si la solicitud del titular ya no es compatible, el sistema la invalida. */
  private async reevaluarAntesDeDecidir(tx: Prisma.TransactionClient, asesoradoId: string, solicitudId: string, momento: Date): Promise<void> {
    if (!UUID.test(solicitudId)) return;
    const [s] = await tx.$queryRaw<{ id: string; version: number; estado: EstadoDeSolicitudDeVinculo; profesional_id: string; asesorado_id: string; alcance: Alcance; vence_en: Date }[]>`
      SELECT "id"::text, "version", "estado"::text AS "estado", "profesional_id"::text, "asesorado_id"::text, "alcance"::text AS "alcance", "vence_en"
        FROM "solicitud_de_vinculo" WHERE "id" = ${solicitudId}::uuid AND "asesorado_id" = ${asesoradoId}::uuid FOR UPDATE`;
    if (!s || s.estado !== 'PENDIENTE') return;
    const fila = { id: s.id, version: s.version, profesionalId: s.profesional_id, asesoradoId: s.asesorado_id, estado: s.estado, venceEn: s.vence_en };
    if (s.vence_en.getTime() <= momento.getTime()) {
      await this.caducarSiVencio(tx, fila, momento);
      return;
    }
    const eleg = await this.elegibilidad(tx, s.profesional_id, s.asesorado_id, s.alcance);
    const vigente = await tx.alcanceDeVinculo.findFirst({
      where: { alcance: s.alcance, estado: { not: 'FINALIZADO' }, vinculo: { profesionalId: s.profesional_id, asesoradoId: s.asesorado_id } },
      select: { id: true },
    });
    if (!esCompatible(eleg) || vigente) {
      await this.transicionDelSistema(tx, 'InvalidarSolicitud', fila, procedenciaDelSistema('REG-06-49'), momento);
    }
  }

  private async caducarSiVencio(
    tx: Prisma.TransactionClient,
    s: { id: string; version: number; profesionalId: string; asesoradoId: string; estado: EstadoDeSolicitudDeVinculo; venceEn: Date },
    momento: Date,
  ): Promise<void> {
    if (s.estado !== 'PENDIENTE' || s.venceEn.getTime() > momento.getTime()) return;
    await this.transicionDelSistema(tx, 'CaducarSolicitud', s, procedenciaDelSistema('DL-037'), momento);
  }

  private async transicionDelSistema(
    tx: Prisma.TransactionClient,
    transicion: 'CaducarSolicitud' | 'InvalidarSolicitud',
    s: { id: string; version: number; profesionalId: string; asesoradoId: string },
    procedencia: Procedencia,
    momento: Date,
  ): Promise<void> {
    const evaluacion = evaluarTransicionDeSolicitud(
      'PENDIENTE',
      transicion === 'CaducarSolicitud' ? { transicion, actor: 'SISTEMA', vencida: true } : { transicion, actor: 'SISTEMA', incompatible: true },
    );
    if (!evaluacion.permitida) throw errores.estadoNoPermite();
    const destino = evaluacion.transicion.destino;
    await tx.solicitudDeVinculo.update({ where: { id: s.id }, data: { estado: destino, version: s.version + 1, momentoDeResolucion: momento } });
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
  }

  /** La solicitud, bloqueada, solo si el actor es su asesorado titular. Si no, 404 idéntico (09:226). */
  private async bloquearDelTitular(tx: Prisma.TransactionClient, asesoradoId: string, solicitudId: string) {
    if (!UUID.test(solicitudId)) throw errores.recursoNoEncontrado();
    const [s] = await tx.$queryRaw<
      { id: string; version: number; estado: EstadoDeSolicitudDeVinculo; profesionalId: string; asesoradoId: string; alcance: Alcance; finalidad: string; venceEn: Date }[]
    >`
      SELECT "id"::text, "version", "estado"::text AS "estado", "profesional_id"::text AS "profesionalId", "asesorado_id"::text AS "asesoradoId",
             "alcance"::text AS "alcance", "finalidad"::text AS "finalidad", "vence_en" AS "venceEn"
        FROM "solicitud_de_vinculo" WHERE "id" = ${solicitudId}::uuid AND "asesorado_id" = ${asesoradoId}::uuid FOR UPDATE`;
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

  /** Rechazo auditado fuera de la transacción revertida (patrón de WP-02). Sin sujeto: no se revela a quién apuntaba. */
  private async auditarRechazo(e: unknown, operacion: string, actorId: string, ctx: ContextoDeSolicitud): Promise<void> {
    if (!(e instanceof ErrorDeApi)) return;
    await this.auditoria.registrar({
      operacion,
      resultado: 'RECHAZO',
      motivo: e.code,
      actorId,
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

function procedenciaDelSistema(fundamento: string): Procedencia {
  return { fuente: 'PROPIA', casoDeUso: 'SISTEMA', operacion: fundamento, superficie: null, requestId: null };
}
