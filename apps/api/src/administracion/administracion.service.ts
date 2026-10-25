import { Injectable } from '@nestjs/common';
import {
  ALCANCES,
  ConsultarProfesionalesRequestSchema,
  DecidirSobreAreaRequestSchema,
  cambioDeOperacion,
  decisionesDisponibles,
  esAlcance,
  evaluarDecision,
  puedeOperar,
  situacionDelArea,
  versionDelArea,
  type Alcance,
  type AreaDeLaFicha,
  type AreaDelProfesional,
  type DecidirSobreAreaRequest,
  type DecisionRegistradaResponse,
  type EntradaDelHistorialAdministrativo,
  type EstadoDeHabilitacion,
  type EstadoDeVerificacionProfesional,
  type EstadoDelArea,
  type FichaDeProfesionalResponse,
  type HistorialAdministrativoResponse,
  type ListaDeProfesionalesResponse,
  type Procedencia,
  type ProfesionalDeLaLista,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { esUuid } from '../plataforma/ejecutor';
import { IdempotenciaService, type ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { conReintento, momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import { PublicadorDeNovedades, type HechoParaNovedad } from '../novedades/publicador';
import { VerificacionService } from '../profesional/verificacion.service';
import type { ActorAdministrativo } from './sesion-administrativa.guard';

type Tx = Prisma.TransactionClient;

/** Las filas de un área, como las devuelve la base. */
interface EstadoLeido {
  readonly verificacion: EstadoDeVerificacionProfesional | null;
  readonly versionDeVerificacion: number | null;
  readonly desdeVerificacion: Date | null;
  readonly habilitacion: EstadoDeHabilitacion | null;
  readonly versionDeHabilitacion: number | null;
  readonly desdeHabilitacion: Date | null;
}

const SIN_FILAS: EstadoLeido = { verificacion: null, versionDeVerificacion: null, desdeVerificacion: null, habilitacion: null, versionDeHabilitacion: null, desdeHabilitacion: null };

/** Sin tildes ni mayúsculas, para buscar y ordenar nombres como se escriben. */
export const normalizarTexto = (t: string): string =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const PERFIL_API = { SANITARIO: 'HEALTH_PROFESSIONAL', NO_SANITARIO: 'NON_HEALTH_PROFESSIONAL' } as const;

/**
 * UC-P02, UC-P03, UC-ADM-04 y UC-ADM-05 (WP-ADMINISTRACION, DL-155): lo que Administración lee y decide sobre los
 * profesionales registrados. Los guards ya exigieron la sesión administrativa, el rol vigente y el segundo factor.
 * - **Información mínima** (D-5): del profesional, su identidad profesional; por área, los estados y las decisiones; de las
 *   personas vinculadas, solo cuántas. Ninguna lectura toca datos de salud.
 * - **Cada lectura queda auditada**, sin el texto de la búsqueda (09v8: «Admin verificación reads · Audit REQUIRED»).
 * - **Cada decisión es una transacción**: la transición del 06 con el administrador como actor, la novedad al profesional,
 *   el aviso a las personas si cambia que pueda operar el área, la auditoría y la idempotencia. Contra la versión del área
 *   que vio el administrador.
 */
@Injectable()
export class AdministracionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly verificacion: VerificacionService,
    private readonly publicador: PublicadorDeNovedades,
    private readonly idempotencia: IdempotenciaService,
    private readonly auditoria: AuditoriaService,
    private readonly limitador: LimitadorService,
  ) {}

  // ─── API-ADM-10 ──────────────────────────────────────────────────────────────────────────────
  async consultar(actor: ActorAdministrativo, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ListaDeProfesionalesResponse> {
    this.limitador.consumir('consultaProtegida', null, actor.identidadId);
    const pedido = validarCuerpo(ConsultarProfesionalesRequestSchema, cuerpo);
    const limite = pedido.limit ?? 20;
    const cursor = pedido.cursor !== undefined ? leerCursorDeLista(pedido.cursor) : null;
    const texto = normalizarTexto(pedido.text ?? '');
    return conReintento(() =>
      this.prisma.$transaction(async (tx) => {
        const todos = await this.profesionales(tx, null);
        const pendientes = todos.reduce((n, p) => n + p.scopes.filter((a) => a.situation === 'PENDING_REVIEW').length, 0);
        const coinciden = todos.filter((p) => {
          if (texto && !normalizarTexto(p.displayName).includes(texto) && !(p.email ?? '').includes(texto)) return false;
          const areas = pedido.scope ? p.scopes.filter((a) => a.scope === pedido.scope) : p.scopes;
          if (pedido.situation) return areas.some((a) => a.situation === pedido.situation);
          return pedido.scope ? areas.some((a) => a.situation !== 'NOT_PRESENTED') : true;
        });
        const ordenados = coinciden.map((p) => ({ p, clave: claveDeOrden(p) })).sort((a, b) => compararClaves(a.clave, b.clave));
        const desde = cursor ? ordenados.findIndex((x) => compararClaves(x.clave, cursor) > 0) : 0;
        const inicio = desde < 0 ? ordenados.length : desde;
        const pagina = ordenados.slice(inicio, inicio + limite);
        const hayMas = inicio + limite < ordenados.length;
        const ultima = pagina[pagina.length - 1];
        await this.auditarLectura(tx, 'API-ADM-10', actor, null, 'ListaDeProfesionales', null, ctx);
        return {
          // La lista no lleva la fecha del perfil: es de la ficha (el contrato de la lista es estricto).
          data: pagina.map(({ p: { profileSince: _desde, ...p } }) => p),
          page: { limit: limite, nextCursor: hayMas && ultima ? escribirCursorDeLista(ultima.clave) : null, hasMore: hayMas },
          totals: { matching: coinciden.length, pendingReview: pendientes },
        };
      }),
    );
  }

  // ─── API-ADM-11 ──────────────────────────────────────────────────────────────────────────────
  async ficha(actor: ActorAdministrativo, profesionalId: string, ctx: ContextoDeSolicitud): Promise<FichaDeProfesionalResponse> {
    this.limitador.consumir('consultaProtegida', null, actor.identidadId);
    return conReintento(() =>
      this.prisma.$transaction(async (tx) => {
        const [p] = esUuid(profesionalId) ? await this.profesionales(tx, profesionalId.toLowerCase()) : [];
        if (!p) {
          await this.auditarRechazo(tx, 'API-ADM-11', actor, 'PROFESIONAL_NO_ENCONTRADO', ctx);
          throw errores.recursoNoEncontrado();
        }
        const areas = await this.areasDeLaFicha(tx, p.professionalId);
        await this.auditarLectura(tx, 'API-ADM-11', actor, p.professionalId, 'PerfilProfesional', p.professionalId, ctx);
        const { scopes: _scopes, ...identidad } = p;
        return { data: { professional: { ...identidad, profileSince: p.profileSince }, scopes: areas } };
      }),
    );
  }

  // ─── API-ADM-12 ──────────────────────────────────────────────────────────────────────────────
  async historial(actor: ActorAdministrativo, profesionalId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<HistorialAdministrativoResponse> {
    this.limitador.consumir('consultaProtegida', null, actor.identidadId);
    const consulta = leerConsultaDelHistorial(query);
    return conReintento(() =>
      this.prisma.$transaction(async (tx) => {
        const id = esUuid(profesionalId) ? profesionalId.toLowerCase() : null;
        const perfil = id ? await tx.perfilProfesional.findUnique({ where: { identidadId: id }, select: { identidadId: true } }) : null;
        if (!id || !perfil) {
          await this.auditarRechazo(tx, 'API-ADM-12', actor, 'PROFESIONAL_NO_ENCONTRADO', ctx);
          throw errores.recursoNoEncontrado();
        }
        const filas = await tx.eventoDeVerificacion.findMany({
          where: { identidadId: id, ...(consulta.alcance ? { alcance: consulta.alcance } : {}), ...(consulta.cursor !== null ? { secuencia: { lt: consulta.cursor } } : {}) },
          orderBy: { secuencia: 'desc' },
          take: consulta.limite + 1,
          select: {
            id: true,
            secuencia: true,
            tipo: true,
            alcance: true,
            estadoPrevio: true,
            estadoPosterior: true,
            fundamento: true,
            tipoDeActor: true,
            administradorId: true,
            mensajeAlProfesional: true,
            versionPrevia: true,
            momentoDeOcurrencia: true,
            momentoDeRegistro: true,
          },
        });
        const hayMas = filas.length > consulta.limite;
        const pagina = filas.slice(0, consulta.limite);
        const administradores = [...new Set(pagina.map((f) => f.administradorId).filter((x): x is string => x !== null))];
        const roles = administradores.length > 0
          ? await tx.rolAdministrativo.findMany({ where: { identidadId: { in: administradores } }, orderBy: { momentoDeRegistro: 'desc' }, select: { identidadId: true, nombreVisible: true } })
          : [];
        const nombres = new Map<string, string>();
        for (const r of roles) if (!nombres.has(r.identidadId)) nombres.set(r.identidadId, r.nombreVisible);
        await this.auditarLectura(tx, 'API-ADM-12', actor, id, 'HistorialAdministrativo', id, ctx);
        const ultima = pagina[pagina.length - 1];
        return {
          data: pagina.map(
            (f): EntradaDelHistorialAdministrativo => ({
              eventId: f.id,
              scope: f.alcance,
              kind: f.tipo,
              previousState: f.estadoPrevio,
              newState: f.estadoPosterior,
              actor:
                f.tipoDeActor === 'ADMINISTRADOR' && f.administradorId
                  ? { type: 'ADMINISTRATOR', identityId: f.administradorId, displayName: nombres.get(f.administradorId) ?? 'Administración' }
                  : { type: 'INTERNAL_SERVICE' },
              rationale: f.fundamento,
              messageToProfessional: f.mensajeAlProfesional,
              reviewedVersion: f.versionPrevia,
              occurredAt: f.momentoDeOcurrencia?.toISOString() ?? null,
              recordedAt: f.momentoDeRegistro.toISOString(),
            }),
          ),
          page: { limit: consulta.limite, nextCursor: hayMas && ultima ? Buffer.from(JSON.stringify([ultima.secuencia.toString()]), 'utf8').toString('base64url') : null, hasMore: hayMas },
        };
      }),
    );
  }

  // ─── API-ADM-13 ──────────────────────────────────────────────────────────────────────────────
  /**
   * Una decisión sobre un área. El orden es el del 09 (09:213-233): la forma (400), la clave de idempotencia, el
   * profesional (404), la versión del área (409) y la transición (422). Un rechazo no deja nada guardado: ni la decisión,
   * ni su hecho, ni una novedad, ni el registro de idempotencia. Se audita igual, con su motivo.
   */
  async decidir(actor: ActorAdministrativo, profesionalId: string, alcanceCrudo: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const pedido = validarCuerpo(DecidirSobreAreaRequestSchema, cuerpo);
    if (!IdempotenciaService.claveValida(clave)) {
      throw errores.solicitudInvalida([{ code: 'IDEMPOTENCY_KEY_REQUIRED', path: 'Idempotency-Key' }], { header: 'Idempotency-Key' });
    }
    if (!esAlcance(alcanceCrudo)) throw errores.solicitudInvalida([{ code: 'INVALID_SCOPE', path: 'scope' }]);
    const alcance: Alcance = alcanceCrudo;
    const id = esUuid(profesionalId) ? profesionalId.toLowerCase() : null;
    const procedencia = procedenciaDe(ctx, pedido.decision === 'SUSPEND' || pedido.decision === 'REINSTATE' ? 'UC-P03' : pedido.decision.endsWith('ENABLEMENT') ? 'UC-ADM-04' : 'UC-P02', 'API-ADM-13');
    const huella = IdempotenciaService.huella({ profesionalId: id, alcance, pedido });
    try {
      return await this.idempotencia.ejecutar({ operacion: 'API-ADM-13', ambito: actor.identidadId, clave, huella }, async (tx) => {
        const perfil = id ? await tx.perfilProfesional.findUnique({ where: { identidadId: id }, select: { nombreVisible: true } }) : null;
        if (!id || !perfil) throw new ErrorDeApi(404, 'RESOURCE_NOT_FOUND', 'Recurso no encontrado.', undefined, 'PROFESIONAL_NO_ENCONTRADO');
        const r = await this.aplicar(tx, actor, id, alcance, pedido, procedencia);
        return { estadoHttp: 200, cuerpo: r as unknown as Prisma.InputJsonValue };
      });
    } catch (e) {
      if (e instanceof ErrorDeApi) {
        await this.auditoria.registrar({
          operacion: 'API-ADM-13',
          resultado: 'RECHAZO',
          motivo: e.motivoDeAuditoria ?? e.code,
          actorId: actor.identidadId,
          sujetoId: id,
          recursoTipo: 'Area',
          recursoId: alcance,
          superficie: ctx.superficie,
          requestId: ctx.requestId,
          momentoDeOcurrencia: ctx.momentoDeRecepcion,
        });
      }
      throw e;
    }
  }

  /** La decisión dentro de la transacción de la idempotencia. */
  private async aplicar(
    tx: Tx,
    actor: ActorAdministrativo,
    profesionalId: string,
    alcance: Alcance,
    pedido: DecidirSobreAreaRequest,
    procedencia: Procedencia,
  ): Promise<DecisionRegistradaResponse> {
    // Las dos filas del área en modo exclusivo, en el orden único (verificación, después habilitación): el PDP y las
    // comprobaciones de las operaciones profesionales las toman en modo compartido, así cada una queda antes o después.
    const antes = await this.leerYBloquear(tx, profesionalId, alcance);
    const estado: EstadoDelArea = { verificacion: antes.verificacion, habilitacion: antes.habilitacion };
    if (versionDelArea(antes.versionDeVerificacion, antes.versionDeHabilitacion) !== pedido.expectedVersion) {
      throw new ErrorDeApi(409, 'VERSION_CONFLICT', 'La situación de esta área cambió desde que la abriste. Revisá cómo está ahora.', undefined, 'VERSION_DEL_AREA');
    }
    const mensaje = pedido.messageToProfessional?.trim() ? pedido.messageToProfessional.trim() : null;
    const evaluacion = evaluarDecision(estado, pedido.decision, pedido.rationale, mensaje);
    if (!evaluacion.permitida) {
      if (evaluacion.motivo === 'SIN_FUNDAMENTO') throw errores.fundamentoRequerido();
      if (evaluacion.motivo === 'SIN_MENSAJE') throw errores.mensajeAlProfesionalRequerido();
      throw new ErrorDeApi(422, 'INVALID_STATE_TRANSITION', 'Esta decisión no corresponde al estado actual del área.', undefined, `DECISION_${evaluacion.motivo}`);
    }
    const momento = await momentoDeLaBase(tx);
    const autor = { tipo: 'ADMINISTRADOR' as const, administradorId: actor.identidadId, mensaje, procedencia };
    const fundamento = pedido.rationale.trim();
    const t = evaluacion.transicion;
    const aplicada =
      t.sobre === 'VERIFICACION'
        ? await this.verificacion.transicionarVerificacion(tx, profesionalId, alcance, t.transicion, fundamento, momento, autor)
        : await this.verificacion.transicionarHabilitacion(tx, profesionalId, alcance, t.transicion, fundamento, momento, autor);

    // D-6: al profesional, siempre; a las personas vinculadas en el área, si cambia que pueda operarla.
    const cambio = cambioDeOperacion(estado, evaluacion.despues);
    const hechos: HechoParaNovedad[] = [
      {
        tipo: 'DECISION_ADMINISTRATIVA',
        destinatarioId: profesionalId,
        alcance,
        fuenteId: actor.identidadId,
        referencia: { tipo: 'EventoDeVerificacion', id: aplicada.eventoId },
        identidadDelHecho: aplicada.eventoId,
        momentoDeOcurrencia: momento,
      },
    ];
    if (cambio !== 'SIN_CAMBIO') {
      const vinculadas = await tx.$queryRaw<{ alcanceDeVinculoId: string; asesoradoId: string }[]>`
        SELECT av."id"::text AS "alcanceDeVinculoId", vi."asesorado_id"::text AS "asesoradoId"
          FROM "alcance_de_vinculo" av JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
         WHERE vi."profesional_id" = ${profesionalId}::uuid AND av."alcance" = ${alcance}::"Alcance" AND av."estado" IN ('ACEPTADO', 'PAUSADO')
         ORDER BY av."id"`;
      for (const v of vinculadas) {
        hechos.push({
          tipo: cambio === 'DEJA_DE_OPERAR' ? 'ACCESO_PROFESIONAL_SUSPENDIDO' : 'ACCESO_PROFESIONAL_RESTABLECIDO',
          destinatarioId: v.asesoradoId,
          alcance,
          fuenteId: actor.identidadId,
          referencia: { tipo: 'AlcanceDeVinculo', id: v.alcanceDeVinculoId },
          identidadDelHecho: aplicada.eventoId,
          momentoDeOcurrencia: momento,
        });
      }
    }
    await this.publicador.publicar(tx, hechos, procedencia);
    await this.auditoria.registrar(
      {
        operacion: 'API-ADM-13',
        resultado: 'EXITO',
        motivo: pedido.decision,
        actorId: actor.identidadId,
        sujetoId: profesionalId,
        recursoTipo: 'EventoDeVerificacion',
        recursoId: aplicada.eventoId,
        superficie: procedencia.superficie,
        requestId: procedencia.requestId,
        momentoDeOcurrencia: momento,
      },
      tx,
    );
    const [area] = (await this.areasDeLaFicha(tx, profesionalId)).filter((a) => a.scope === alcance);
    return { data: { eventId: aplicada.eventoId, scope: area!, notified: { professional: true, linkedPeople: hechos.length - 1 } } };
  }

  // ─── Lecturas comunes ────────────────────────────────────────────────────────────────────────

  private async leerYBloquear(tx: Tx, profesionalId: string, alcance: Alcance): Promise<EstadoLeido> {
    const [v] = await tx.$queryRaw<{ estado: EstadoDeVerificacionProfesional; version: number }[]>`
      SELECT "estado"::text AS "estado", "version" FROM "verificacion_profesional"
       WHERE "identidad_id" = ${profesionalId}::uuid AND "alcance" = ${alcance}::"Alcance" FOR NO KEY UPDATE`;
    const [h] = await tx.$queryRaw<{ estado: EstadoDeHabilitacion; version: number }[]>`
      SELECT "estado"::text AS "estado", "version" FROM "habilitacion"
       WHERE "identidad_id" = ${profesionalId}::uuid AND "alcance" = ${alcance}::"Alcance" FOR NO KEY UPDATE`;
    return { ...SIN_FILAS, verificacion: v?.estado ?? null, versionDeVerificacion: v?.version ?? null, habilitacion: h?.estado ?? null, versionDeHabilitacion: h?.version ?? null };
  }

  /** Los profesionales registrados (o uno), con sus áreas en el orden del catálogo. Una sola lectura de cada tabla. */
  private async profesionales(tx: Tx, uno: string | null): Promise<(ProfesionalDeLaLista & { profileSince: string | null })[]> {
    const filtro = uno ? { identidadId: uno } : {};
    const perfiles = await tx.perfilProfesional.findMany({
      where: filtro,
      select: {
        identidadId: true,
        nombreVisible: true,
        tipo: true,
        momentoDeOcurrencia: true,
        momentoDeRegistro: true,
        identidad: { select: { estadoOperativoDeCuenta: true, metodosDeAcceso: { where: { tipo: 'LOCAL' }, select: { referencia: true } } } },
      },
    });
    if (perfiles.length === 0) return [];
    const ids = perfiles.map((p) => p.identidadId);
    const [verificaciones, habilitaciones] = await Promise.all([
      tx.verificacionProfesional.findMany({ where: { identidadId: { in: ids } }, select: { identidadId: true, alcance: true, estado: true, version: true, momentoDeOcurrencia: true, momentoDeRegistro: true, momentoDeUltimaTransicion: true } }),
      tx.habilitacion.findMany({ where: { identidadId: { in: ids } }, select: { identidadId: true, alcance: true, estado: true, version: true, momentoDeOcurrencia: true, momentoDeRegistro: true, momentoDeUltimaTransicion: true } }),
    ]);
    const clave = (identidadId: string, alcance: string) => `${identidadId}|${alcance}`;
    const v = new Map(verificaciones.map((x) => [clave(x.identidadId, x.alcance), x]));
    const h = new Map(habilitaciones.map((x) => [clave(x.identidadId, x.alcance), x]));
    return perfiles.map((p) => ({
      professionalId: p.identidadId,
      displayName: p.nombreVisible,
      profileType: PERFIL_API[p.tipo],
      email: p.identidad.metodosDeAcceso[0]?.referencia ?? null,
      accountState: p.identidad.estadoOperativoDeCuenta,
      profileSince: (p.momentoDeOcurrencia ?? p.momentoDeRegistro).toISOString(),
      scopes: ALCANCES.map((alcance): AreaDelProfesional => {
        const fv = v.get(clave(p.identidadId, alcance));
        const fh = h.get(clave(p.identidadId, alcance));
        const e: EstadoDelArea = { verificacion: (fv?.estado as EstadoDeVerificacionProfesional | undefined) ?? null, habilitacion: (fh?.estado as EstadoDeHabilitacion | undefined) ?? null };
        const desde = (f: { momentoDeUltimaTransicion: Date | null; momentoDeOcurrencia: Date | null; momentoDeRegistro: Date } | undefined) => (f ? (f.momentoDeUltimaTransicion ?? f.momentoDeOcurrencia ?? f.momentoDeRegistro).toISOString() : null);
        return {
          scope: alcance,
          situation: situacionDelArea(e),
          verification: { state: e.verificacion, since: desde(fv) },
          enablement: { state: e.habilitacion, since: desde(fh) },
          canOperate: puedeOperar(e),
        };
      }),
    }));
  }

  /** Las tres áreas de la ficha: lo de la lista, su versión, lo que admiten hoy, cuántas personas y la última observación. */
  private async areasDeLaFicha(tx: Tx, profesionalId: string): Promise<AreaDeLaFicha[]> {
    const [p] = await this.profesionales(tx, profesionalId);
    if (!p) return [];
    const [versiones, habilitaciones, personas, observaciones] = await Promise.all([
      tx.verificacionProfesional.findMany({ where: { identidadId: profesionalId }, select: { alcance: true, version: true } }),
      tx.habilitacion.findMany({ where: { identidadId: profesionalId }, select: { alcance: true, version: true } }),
      tx.$queryRaw<{ alcance: string; estado: string; n: number }[]>`
        SELECT av."alcance"::text AS "alcance", av."estado"::text AS "estado", count(*)::int AS "n"
          FROM "alcance_de_vinculo" av JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
         WHERE vi."profesional_id" = ${profesionalId}::uuid AND av."estado" IN ('ACEPTADO', 'PAUSADO')
         GROUP BY 1, 2`,
      tx.$queryRaw<{ alcance: string; momento: Date; mensaje: string | null }[]>`
        SELECT DISTINCT ON (e."alcance") e."alcance"::text AS "alcance", COALESCE(e."momento_de_ocurrencia", e."momento_de_registro") AS "momento", e."mensaje_al_profesional" AS "mensaje"
          FROM "evento_de_verificacion" e
         WHERE e."identidad_id" = ${profesionalId}::uuid AND e."tipo" = 'ObservacionRegistrada'
           AND e."secuencia" > COALESCE((SELECT max(x."secuencia") FROM "evento_de_verificacion" x
                                         WHERE x."identidad_id" = e."identidad_id" AND x."alcance" = e."alcance"
                                           AND x."tipo" IN ('AlcancePresentado', 'AlcancePresentadoNuevamente')), 0)
         ORDER BY e."alcance", e."secuencia" DESC`,
    ]);
    return p.scopes.map((a): AreaDeLaFicha => {
      const vv = versiones.find((x) => x.alcance === a.scope)?.version ?? null;
      const hv = habilitaciones.find((x) => x.alcance === a.scope)?.version ?? null;
      const e: EstadoDelArea = { verificacion: a.verification.state, habilitacion: a.enablement.state };
      const obs = a.verification.state === 'PENDIENTE' ? observaciones.find((o) => o.alcance === a.scope) : undefined;
      return {
        ...a,
        version: versionDelArea(vv, hv),
        availableDecisions: decisionesDisponibles(e),
        linkedPeople: {
          active: personas.find((x) => x.alcance === a.scope && x.estado === 'ACEPTADO')?.n ?? 0,
          paused: personas.find((x) => x.alcance === a.scope && x.estado === 'PAUSADO')?.n ?? 0,
        },
        lastObservation: obs ? { at: new Date(obs.momento).toISOString(), messageToProfessional: obs.mensaje } : null,
      };
    });
  }

  private auditarLectura(tx: Tx, operacion: string, actor: ActorAdministrativo, sujetoId: string | null, recursoTipo: string, recursoId: string | null, ctx: ContextoDeSolicitud): Promise<void> {
    return this.auditoria.registrar(
      { operacion, resultado: 'EXITO', actorId: actor.identidadId, sujetoId, recursoTipo, recursoId, superficie: ctx.superficie, requestId: ctx.requestId, momentoDeOcurrencia: ctx.momentoDeRecepcion },
      tx,
    );
  }

  /** Un 404 de una lectura, auditado fuera de la transacción que se revierte. */
  private async auditarRechazo(_tx: Tx, operacion: string, actor: ActorAdministrativo, motivo: string, ctx: ContextoDeSolicitud): Promise<void> {
    await this.auditoria.registrar({ operacion, resultado: 'RECHAZO', motivo, actorId: actor.identidadId, superficie: ctx.superficie, requestId: ctx.requestId, momentoDeOcurrencia: ctx.momentoDeRecepcion });
  }
}

// ─── El orden y el cursor de la lista ───────────────────────────────────────────────────────────

/** Los que tienen un área pendiente de revisión van primero; después, por nombre sin tildes y por identidad. */
type ClaveDeOrden = readonly [number, string, string];
const claveDeOrden = (p: ProfesionalDeLaLista): ClaveDeOrden => [p.scopes.some((a) => a.situation === 'PENDING_REVIEW') ? 0 : 1, normalizarTexto(p.displayName), p.professionalId];
function compararClaves(a: ClaveDeOrden, b: ClaveDeOrden): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  if (a[1] !== b[1]) return a[1] < b[1] ? -1 : 1;
  return a[2] === b[2] ? 0 : a[2] < b[2] ? -1 : 1;
}
const escribirCursorDeLista = (c: ClaveDeOrden): string => Buffer.from(JSON.stringify(c), 'utf8').toString('base64url');
function leerCursorDeLista(texto: string): ClaveDeOrden {
  try {
    const v: unknown = JSON.parse(Buffer.from(texto, 'base64url').toString('utf8'));
    if (Array.isArray(v) && v.length === 3 && (v[0] === 0 || v[0] === 1) && typeof v[1] === 'string' && typeof v[2] === 'string' && esUuid(v[2])) return [v[0], v[1], v[2]];
  } catch {
    // cae al error neutral
  }
  throw errores.cursorInvalido();
}

/** La query del historial: `limit`, `cursor` (la secuencia, opaca) y `scope`. Otra cosa: 400. */
function leerConsultaDelHistorial(query: Record<string, unknown>): { limite: number; cursor: bigint | null; alcance: Alcance | null } {
  const desconocidos = Object.keys(query ?? {}).filter((k) => !['limit', 'cursor', 'scope'].includes(k));
  if (desconocidos.length > 0) throw errores.solicitudInvalida(desconocidos.map((c) => ({ code: 'UNKNOWN_QUERY_PARAMETER', path: c })));
  let limite = 20;
  if (query.limit !== undefined) {
    const n = typeof query.limit === 'string' && /^\d{1,2}$/.test(query.limit) ? Number(query.limit) : NaN;
    if (!Number.isInteger(n) || n < 1 || n > 50) throw errores.solicitudInvalida([{ code: 'INVALID_LIMIT', path: 'limit' }]);
    limite = n;
  }
  let cursor: bigint | null = null;
  if (query.cursor !== undefined) {
    try {
      const v: unknown = typeof query.cursor === 'string' ? JSON.parse(Buffer.from(query.cursor, 'base64url').toString('utf8')) : null;
      if (!Array.isArray(v) || v.length !== 1 || typeof v[0] !== 'string' || !/^\d{1,19}$/.test(v[0])) throw new Error('forma');
      cursor = BigInt(v[0]);
    } catch {
      throw errores.cursorInvalido();
    }
  }
  let alcance: Alcance | null = null;
  if (query.scope !== undefined) {
    if (typeof query.scope !== 'string' || !esAlcance(query.scope)) throw errores.solicitudInvalida([{ code: 'INVALID_FILTER', path: 'scope' }]);
    alcance = query.scope;
  }
  return { limite, cursor, alcance };
}
