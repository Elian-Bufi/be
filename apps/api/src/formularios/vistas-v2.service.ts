import { Injectable } from '@nestjs/common';
import type { Alcance } from '@be/domain';
import type { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import { exigirA3Vigente } from '../consentimiento/a3-del-titular';
import type { ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { nombreDeAsesoradoPara } from '../vinculo/lectura';
import { CAPACIDAD_FORMULARIOS_FORMATO_3 } from '@be/domain';
import { decideBlando } from './decision-blanda';
import { esUuid, EjecutorDeFormularios } from './ejecutor';
import {
  camposV2PorCodigo,
  definicionV2,
  desenlaceApi,
  formatoRetenido,
  propuestaApi,
  respuestaV2Api,
  resumenDePropuestaApi,
  seRetieneElFormato,
  solicitudV2Api,
  transcripcionApi,
  versionDePlantillaV2Api,
  versionesDeFormato3,
  type TranscripcionAlmacenada,
} from './lectura-formularios-v2';

type Tx = Prisma.TransactionClient;

/** La Solicitud con lo que la vista V2 necesita: la versión entera (su formato), si tiene Respuesta y la propuesta pendiente. */
const INCLUIR_SOLICITUD_V2 = {
  templateVersion: { select: { nombre: true, plantillaId: true, contenido: true } },
  respuesta: { select: { id: true } },
  propuestas: { where: { estado: 'PENDIENTE' as const }, take: 1 },
} as const;

/**
 * API-FRI-01, 02 y 03 — las lecturas de los formularios V2 (DL-164 D-5). Sirven para cualquier versión, de P0 o con
 * tipos nuevos, y las usan el website y la APK nueva; las de FRM quedan para las APK instaladas.
 * - FRI-01 es como FRM-02: metadatos, solo sesión, sin PDP (09:1461).
 * - FRI-02 es como FRM-06, con todas las Solicitudes de la persona y la propuesta que espera su confirmación.
 * - FRI-03 es como FRM-05: el profesional, solo si el PDP lo sigue permitiendo (si no, el 404 de lo inexistente); la
 *   persona, con su A3 vigente. La propuesta la ven solo quien la cargó y la persona; el desenlace de la última que no
 *   se confirmó, solo quien la cargó (D-3, D-6).
 */
@Injectable()
export class VistasV2Service {
  constructor(
    private readonly ejecutor: EjecutorDeFormularios,
    private readonly pdp: PdpService,
  ) {}

  // ─── API-FRI-01 · la definición de una versión, en V2 ────────────────────────────────────────
  definicion(actor: ActorAutenticado, templateId: string, versionId: string, ctx: ContextoDeSolicitud): Promise<unknown> {
    return this.ejecutor.leer({
      operacion: 'API-FRI-01',
      casoDeUso: 'UC-P32',
      actor,
      ctx,
      recursoIntentado: { tipo: 'VersionDePlantillaDeFormulario', id: versionId },
      lectura: async (tx) => {
        const v =
          esUuid(templateId) && esUuid(versionId)
            ? await tx.versionDePlantillaDeFormulario.findFirst({ where: { id: versionId, plantillaId: templateId }, include: { plantilla: true, sucesora: { select: { id: true } } } })
            : null;
        if (!v) throw errores.recursoNoEncontrado();
        // DL-165 · una versión de formato 3, a un cliente que no la lee (la APK 0.20): el 404 de lo inexistente.
        if (seRetieneElFormato(ctx, v.contenido)) throw formatoRetenido();
        return { data: versionDePlantillaV2Api(v) };
      },
    });
  }

  // ─── API-FRI-02 · la bandeja de la persona ──────────────────────────────────────────────────
  bandeja(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<unknown> {
    const consulta = leerConsultaDeLista(query, { status: ['PENDING', 'RESPONDED'] });
    return this.ejecutor.leer({
      operacion: 'API-FRI-02',
      casoDeUso: 'UC-P33',
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        // DL-165 · a un cliente que no lee el formato 3 no se le listan sus Solicitudes: en el `where`, para que el cursor
        // y la página sigan siendo consistentes (como FRM-06 con las V2).
        const sinFormato3 = ctx.capacidades.has(CAPACIDAD_FORMULARIOS_FORMATO_3) ? {} : { templateVersionId: { notIn: await versionesDeFormato3(tx) } };
        const filas = await tx.solicitudDeFormulario.findMany({
          where: {
            asesoradoId: actor.identidadId,
            ...sinFormato3,
            ...(consulta.filtros.status ? { respuesta: consulta.filtros.status === 'RESPONDED' ? { isNot: null } : { is: null } } : {}),
            ...despuesDelCursor(consulta.cursor),
          },
          include: INCLUIR_SOLICITUD_V2,
          orderBy: ORDEN_DE_LISTA,
          take: consulta.limit + 1,
        });
        const { pagina, page } = paginar(filas, consulta.limit);
        // `respondable`, una vez por par (profesional, Alcance), como FRM-06; la denegación se registra igual.
        const combos = new Map<string, boolean>();
        const datos = [];
        for (const s of pagina) {
          const clave = `${s.profesionalId}|${s.alcance}`;
          if (!combos.has(clave)) {
            combos.set(
              clave,
              await decideBlando(this.pdp, tx, { operacion: 'API-FRI-02', actorDeLaDecision: actor.identidadId, profesionalId: s.profesionalId, titularId: actor.identidadId, alcance: s.alcance as Alcance, recurso: null }, ctx),
            );
          }
          const nombreProfesional = await this.nombreProfesional(tx, s.profesionalId);
          const pendiente = s.propuestas[0] ?? null;
          datos.push({
            ...solicitudV2Api(s, nombreProfesional, await nombreDeAsesoradoPara(tx, s.profesionalId, actor.identidadId), s.respuesta !== null),
            respondable: s.respuesta === null && combos.get(clave) === true,
            pendingProposal: pendiente ? resumenDePropuestaApi(pendiente, nombreProfesional) : null,
          });
        }
        return { data: datos, page };
      },
    });
  }

  // ─── API-FRI-03 · el detalle V2, para los dos actores ───────────────────────────────────────
  vista(actor: ActorAutenticado, formRequestId: string, ctx: ContextoDeSolicitud): Promise<unknown> {
    const recurso = { tipo: 'SolicitudDeFormulario', id: formRequestId };
    return this.ejecutor.leer({
      operacion: 'API-FRI-03',
      casoDeUso: 'UC-P32',
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        const s = esUuid(formRequestId) ? await tx.solicitudDeFormulario.findUnique({ where: { id: formRequestId }, include: INCLUIR_SOLICITUD_V2 }) : null;
        if (!s) throw this.ejecutor.noRevelable({ operacion: 'API-FRI-03', actorId: actor.identidadId, recurso }, ctx);
        const esAsesorado = s.asesoradoId === actor.identidadId;
        const esProfesional = s.profesionalId === actor.identidadId;
        if (!esAsesorado && !esProfesional) {
          throw this.ejecutor.noRevelable({ operacion: 'API-FRI-03', actorId: actor.identidadId, recurso, sujetoId: s.asesoradoId, alcance: s.alcance as Alcance }, ctx);
        }
        // DL-165 · a quien no lee el formato 3, el mismo 404 antes que el A3 o el PDP: para esa APK, la Solicitud no existe.
        if (seRetieneElFormato(ctx, s.templateVersion.contenido)) throw formatoRetenido();
        let respondable: boolean;
        if (esAsesorado) {
          // Lo propio, «conforme a 08»: sin el A3 vigente, 403 (08:406; DL-115). `respondable` es la proyección del PDP.
          await exigirA3Vigente(tx, actor.identidadId);
          respondable =
            s.respuesta === null &&
            (await decideBlando(this.pdp, tx, { operacion: 'API-FRI-03', actorDeLaDecision: actor.identidadId, profesionalId: s.profesionalId, titularId: actor.identidadId, alcance: s.alcance as Alcance, recurso }, ctx));
        } else {
          // El profesional: el mismo corte que FRM-05; sin autorización actual, el 404 de lo inexistente (TEST-FRM-007).
          await this.pdp.decidirEnTransaccion(
            tx,
            { operacion: 'API-FRI-03', actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: s.asesoradoId, alcance: s.alcance as Alcance, recurso },
            ctx,
          );
          respondable = s.respuesta === null;
        }

        const respuesta = await tx.respuestaDeFormulario.findUnique({ where: { solicitudId: s.id }, include: { rectificaciones: { orderBy: { momentoDeRegistro: 'asc' } } } });
        const nombreProfesional = await this.nombreProfesional(tx, s.profesionalId);
        const transcripcion = respuesta?.transcripcion ? (respuesta.transcripcion as unknown as TranscripcionAlmacenada) : null;
        // Los campos de la versión fijada en la Solicitud: un número que la APK instalada guardó sin unidad la toma de acá.
        const campos = camposV2PorCodigo(definicionV2(s.templateVersion.contenido).sections);
        const pendiente = s.propuestas[0] ?? null;
        // La última propuesta de quien consulta sobre esta Solicitud: si no se confirmó, se le dice cómo terminó (D-6).
        const ultima = esProfesional
          ? await tx.propuestaDeRespuestaDeFormulario.findFirst({ where: { solicitudId: s.id, profesionalId: actor.identidadId }, orderBy: [{ momentoDeRegistro: 'desc' }, { id: 'desc' }] })
          : null;
        return {
          data: {
            request: solicitudV2Api(s, nombreProfesional, await nombreDeAsesoradoPara(tx, s.profesionalId, s.asesoradoId), respuesta !== null),
            respondable,
            response: respuesta ? respuestaV2Api(respuesta, transcripcion ? transcripcionApi(transcripcion, await this.nombreProfesional(tx, transcripcion.professionalId)) : null, campos) : null,
            proposal: pendiente && (esAsesorado || pendiente.profesionalId === actor.identidadId) ? propuestaApi(pendiente, nombreProfesional) : null,
            lastProposalOutcome: ultima ? desenlaceApi(ultima) : null,
          },
        };
      },
    });
  }

  private async nombreProfesional(tx: Tx, id: string): Promise<string> {
    const p = await tx.perfilProfesional.findUnique({ where: { identidadId: id }, select: { nombreVisible: true } });
    return p?.nombreVisible ?? 'Profesional';
  }
}
