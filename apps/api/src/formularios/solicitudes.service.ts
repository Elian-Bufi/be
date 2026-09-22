import { Injectable } from '@nestjs/common';
import {
  categoriaPertinenteParaAlcance,
  CodigoDeError,
  CrearSolicitudDeFormularioRequestSchema,
  requeridosDentroDeSolicitados,
  solicitudDentroDeLaPlantilla,
  type Alcance,
  type CategoriaDeDato,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { DenegacionDelPdp, PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { nombreDeAsesorado } from '../vinculo/lectura';
import { esUuid, EjecutorDeFormularios } from './ejecutor';
import { registrarEventoDeFormulario } from './eventos';
import { categoriasDeCampos, codigosDeCampo, respuestaApi, solicitudApi } from './lectura-formularios';

type Tx = Prisma.TransactionClient;

const INCLUIR_SOLICITUD = { templateVersion: { select: { nombre: true } }, respuesta: { select: { id: true } } } as const;

/**
 * API-FRM-03, 04, 05 y 06 — crear y consultar Solicitudes (09v16.1 §22.3 a §22.6; UC-P32).
 *
 * FRM es transversal a los tres Alcances (WP-07.md §5): cada Solicitud declara el suyo, así que el PDP se decide
 * por Alcance de la fila, no por el de un Ejecutor fijo (ver `ejecutor.ts`).
 *
 * Dos formas de negar, deliberadamente distintas:
 * - **dura** (propaga `DenegacionDelPdp`, mismo 404 que lo inexistente): cuando el actor es el profesional y el PDP
 *   ya no lo permite (FRM-03, FRM-05 del lado profesional) — «profesional sin autorización actual no conserva
 *   lectura» (TEST-FRM-007);
 * - **blanda** (se atrapa, se registra igual, y el resultado es «no» sin 404): cuando el actor es el titular
 *   consultando lo propio — la fila **siempre** es suya (REG-06-213: «06 conserva estructura e historia»), lo que
 *   deja de estar vigente es si el PDP la sigue considerando respondable (FRM-04 filtra filas ajenas al Alcance
 *   vigente; FRM-06 calcula `respondable` así, fila por fila).
 */
@Injectable()
export class SolicitudesService {
  constructor(private readonly ejecutor: EjecutorDeFormularios, private readonly pdp: PdpService) {}

  // ─── API-FRM-03 · crear ─────────────────────────────────────────────────────────────────────
  crear(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'Asesorado', id: adviseeId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-FRM-03',
      casoDeUso: 'UC-P32',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: CrearSolicitudDeFormularioRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        // Primero la autorización: un rechazo de contrato después no le confirma a alguien no autorizado que el
        // recurso o la plantilla existen (09 §3.2.1, precedencia).
        const decision = await this.pdp.decidirEnTransaccion(
          tx,
          { operacion: 'API-FRM-03', actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: adviseeId, alcance: pedido.scope, recurso },
          ctx,
        );
        const titular = decision.hechos.titular?.identidadId as string;

        const version = esUuid(pedido.templateVersionId)
          ? await tx.versionDePlantillaDeFormulario.findUnique({ where: { id: pedido.templateVersionId }, include: { sucesora: { select: { id: true } } } })
          : null;
        if (!version) {
          throw new ErrorDeApi(422, CodigoDeError.FORM_TEMPLATE_NOT_SELECTABLE, 'La plantilla declarada no existe en el catálogo.');
        }
        // REG-06-209: una versión histórica se puede consultar, no seleccionar para una Solicitud nueva.
        if (version.sucesora) {
          throw new ErrorDeApi(422, CodigoDeError.FORM_TEMPLATE_NOT_SELECTABLE, 'Esa versión de la plantilla es histórica. Para solicitar, elegí la versión vigente.');
        }

        const codigos = codigosDeCampo(version.contenido);
        if (!solicitudDentroDeLaPlantilla(pedido.requestedFieldCodes, codigos)) {
          throw new ErrorDeApi(422, CodigoDeError.FORM_REQUEST_INVALID, 'Uno o más campos solicitados no existen en esta versión de la plantilla.');
        }
        // REG-06-212: lo requerido es un subconjunto de lo solicitado, nunca un conjunto aparte.
        if (!requeridosDentroDeSolicitados(pedido.requestedFieldCodes, pedido.requiredFieldCodes)) {
          throw new ErrorDeApi(422, CodigoDeError.FORM_REQUEST_INVALID, 'Un campo requerido tiene que estar entre los solicitados.');
        }
        // 09:1557 — no revela qué categorías existen fuera de lo que el propio profesional pidió: el mensaje es
        // genérico y solo compara contra `pedido.requestedFieldCodes`, nunca contra el resto del catálogo.
        const categorias = categoriasDeCampos(version.contenido, pedido.requestedFieldCodes) as CategoriaDeDato[];
        if (categorias.some((c) => !categoriaPertinenteParaAlcance(pedido.scope, c))) {
          throw new ErrorDeApi(422, CodigoDeError.FORM_REQUEST_NOT_ALLOWED, 'Alguno de los campos solicitados no es pertinente para este Alcance.');
        }

        const vinculo = await tx.vinculo.findFirstOrThrow({ where: { profesionalId: actor.identidadId, asesoradoId: titular } });
        const momento = await momentoDeLaBase(tx);
        const solicitud = await tx.solicitudDeFormulario.create({
          data: {
            profesionalId: actor.identidadId,
            asesoradoId: titular,
            vinculoId: vinculo.id,
            templateVersionId: version.id,
            proposito: pedido.purpose,
            alcance: pedido.scope,
            camposSolicitados: pedido.requestedFieldCodes,
            camposRequeridos: pedido.requiredFieldCodes,
          },
        });
        await registrarEventoDeFormulario(tx, {
          tipo: 'SolicitudDeFormularioCreada',
          profesionalId: actor.identidadId,
          asesoradoId: titular,
          recurso: { tipo: 'SolicitudDeFormulario', id: solicitud.id },
          estadoPrevio: null,
          estadoPosterior: 'PENDING',
          actorId: actor.identidadId,
          procedencia,
          momento,
        });

        return {
          estadoHttp: 201,
          cuerpo: {
            data: {
              formRequestId: solicitud.id,
              templateVersionId: solicitud.templateVersionId,
              purpose: solicitud.proposito,
              scope: solicitud.alcance,
              requestedFieldCodes: solicitud.camposSolicitados,
              requiredFieldCodes: solicitud.camposRequeridos,
              status: 'PENDING',
              createdAt: solicitud.momentoDeRegistro.toISOString(),
            },
          },
          sujetoId: titular,
          recurso: { tipo: 'SolicitudDeFormulario', id: solicitud.id },
        };
      },
    });
  }

  // ─── API-FRM-04 · listar las del profesional sobre un asesorado ───────────────────────────────
  /** Solo las actualmente revelables: una fila cuyo Alcance ya no está autorizado se excluye, sin 404 general. */
  listar(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<unknown> {
    const consulta = leerConsultaDeLista(query, { status: ['PENDING', 'RESPONDED'] });
    return this.ejecutor.leer({
      operacion: 'API-FRM-04',
      casoDeUso: 'UC-P32',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        if (!esUuid(adviseeId)) return { data: [], page: { limit: consulta.limit, nextCursor: null, hasMore: false } };
        const filas = await tx.solicitudDeFormulario.findMany({
          where: {
            profesionalId: actor.identidadId,
            asesoradoId: adviseeId,
            ...(consulta.filtros.status ? { respuesta: consulta.filtros.status === 'RESPONDED' ? { isNot: null } : { is: null } } : {}),
            ...despuesDelCursor(consulta.cursor),
          },
          include: INCLUIR_SOLICITUD,
          orderBy: ORDEN_DE_LISTA,
          take: consulta.limit + 1,
        });
        const permitidos = new Set<string>();
        for (const alcance of new Set(filas.map((f) => f.alcance))) {
          if (await this.puedeAcceder(tx, 'API-FRM-04', actor.identidadId, actor.identidadId, adviseeId, alcance, ctx)) permitidos.add(alcance);
        }
        const visibles = filas.filter((f) => permitidos.has(f.alcance));
        const { pagina, page } = paginar(visibles, consulta.limit);
        const nombreProfesional = await this.nombreProfesional(tx, actor.identidadId);
        return { data: pagina.map((s) => solicitudApi(s, nombreProfesional, nombreDeAsesorado(adviseeId), s.respuesta !== null)), page };
      },
    });
  }

  // ─── API-FRM-05 · consultar, proyección por actor ──────────────────────────────────────────────
  consultarDetalle(actor: ActorAutenticado, formRequestId: string, ctx: ContextoDeSolicitud): Promise<unknown> {
    const recurso = { tipo: 'SolicitudDeFormulario', id: formRequestId };
    return this.ejecutor.leer({
      operacion: 'API-FRM-05',
      casoDeUso: 'UC-P32',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const s = esUuid(formRequestId) ? await tx.solicitudDeFormulario.findUnique({ where: { id: formRequestId }, include: INCLUIR_SOLICITUD }) : null;
        if (!s) throw this.ejecutor.noRevelable({ operacion: 'API-FRM-05', actorId: actor.identidadId, recurso }, ctx);

        const esAsesorado = s.asesoradoId === actor.identidadId;
        const esProfesional = s.profesionalId === actor.identidadId;
        if (!esAsesorado && !esProfesional) {
          throw this.ejecutor.noRevelable({ operacion: 'API-FRM-05', actorId: actor.identidadId, recurso, sujetoId: s.asesoradoId, alcance: s.alcance as Alcance }, ctx);
        }
        // El asesorado consulta lo propio siempre, aunque el profesional ya no conserve lectura (REG-06-213).
        if (!esAsesorado) {
          // Profesional: exactamente el mismo corte que crear/listar — sin autorización actual, el mismo 404
          // que lo inexistente (TEST-FRM-007). Se deja propagar la denegación: no se atrapa acá.
          await this.pdp.decidirEnTransaccion(
            tx,
            { operacion: 'API-FRM-05', actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: s.asesoradoId, alcance: s.alcance as Alcance, recurso },
            ctx,
          );
        }

        const respuesta = await tx.respuestaDeFormulario.findUnique({ where: { solicitudId: s.id }, include: { rectificaciones: { orderBy: { momentoDeRegistro: 'asc' } } } });
        const nombreProfesional = await this.nombreProfesional(tx, s.profesionalId);
        return {
          data: {
            request: solicitudApi(s, nombreProfesional, nombreDeAsesorado(s.asesoradoId), respuesta !== null),
            response: respuesta ? respuestaApi(respuesta) : null,
          },
        };
      },
    });
  }

  // ─── API-FRM-06 · las Solicitudes propias del asesorado ────────────────────────────────────────
  /** `respondable` es la proyección del PDP en esta misma lectura (09:1610-1618): no crea un estado nuevo. */
  listarPropias(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<unknown> {
    const consulta = leerConsultaDeLista(query, { status: ['PENDING', 'RESPONDED'] });
    return this.ejecutor.leer({
      operacion: 'API-FRM-06',
      casoDeUso: 'UC-P33',
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        const filas = await tx.solicitudDeFormulario.findMany({
          where: {
            asesoradoId: actor.identidadId,
            ...(consulta.filtros.status ? { respuesta: consulta.filtros.status === 'RESPONDED' ? { isNot: null } : { is: null } } : {}),
            ...despuesDelCursor(consulta.cursor),
          },
          include: INCLUIR_SOLICITUD,
          orderBy: ORDEN_DE_LISTA,
          take: consulta.limit + 1,
        });
        const { pagina, page } = paginar(filas, consulta.limit);
        const combos = new Map<string, boolean>();
        const datos = [];
        for (const s of pagina) {
          const clave = `${s.profesionalId}|${s.alcance}`;
          if (!combos.has(clave)) {
            combos.set(
              clave,
              s.respuesta === null && (await this.puedeAcceder(tx, 'API-FRM-06', actor.identidadId, s.profesionalId, actor.identidadId, s.alcance, ctx)),
            );
          }
          const nombreProfesional = await this.nombreProfesional(tx, s.profesionalId);
          datos.push({
            ...(solicitudApi(s, nombreProfesional, nombreDeAsesorado(actor.identidadId), s.respuesta !== null) as Record<string, unknown>),
            respondable: combos.get(clave) === true,
          });
        }
        return { data: datos, page };
      },
    });
  }

  /** Chequeo blando: se atrapa la denegación, se registra igual, y el resultado es `false` sin 404 (FRM-04/06). */
  private async puedeAcceder(tx: Tx, operacion: string, actorDeLaDecision: string, profesionalId: string, titularId: string, alcance: string, ctx: ContextoDeSolicitud): Promise<boolean> {
    try {
      await this.pdp.decidirEnTransaccion(tx, { operacion, actorDeLaDecision, profesionalId, titularId, alcance: alcance as Alcance, recurso: null }, ctx);
      return true;
    } catch (e) {
      if (e instanceof DenegacionDelPdp) {
        await this.pdp.registrarDenegacion(e);
        return false;
      }
      throw e;
    }
  }

  private async nombreProfesional(tx: Tx, id: string): Promise<string> {
    const p = await tx.perfilProfesional.findUnique({ where: { identidadId: id }, select: { nombreVisible: true } });
    return p?.nombreVisible ?? 'Profesional';
  }
}
