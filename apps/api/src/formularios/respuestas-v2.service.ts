import { Injectable } from '@nestjs/common';
import { camposCorregidos, CodigoDeError, EnviarRespuestaV2RequestSchema, evaluarNuevaCorreccion, RectificarRespuestaV2RequestSchema, resolverVistaEfectiva, type Alcance, type RelacionDeCorreccion } from '@be/domain';
import { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import { exigirA3Vigente } from '../consentimiento/a3-del-titular';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { PublicadorDeNovedades } from '../novedades/publicador';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase, sinDuplicar } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { tomarLaSolicitud } from './cerrojo-de-solicitud';
import { decideBlando } from './decision-blanda';
import { esUuid, EjecutorDeFormularios } from './ejecutor';
import { registrarEventoDeFormulario } from './eventos';
import { camposV2PorCodigo, contenidoDeRespuestasV2, definicionV2, exigirRespuestasValidas, respuestasDePropuesta, solicitudAValidar, type TranscripcionAlmacenada } from './lectura-formularios-v2';

const yaRespondida = () => new ErrorDeApi(422, CodigoDeError.FORM_REQUEST_NOT_RESPONDABLE, 'Esta Solicitud ya tiene una respuesta registrada.');

/**
 * API-FRI-04 y API-FRI-05 — responder y rectificar con respuestas V2 (DL-164), siempre `/me/...`: el actor es el titular,
 * como en FRM-07 y FRM-08, y con el mismo orden (propio o 404; A3; respondable o 422; validación). Lo nuevo:
 * - se valida con el dominio (`validarRespuestasV2`) contra la versión fijada en la Solicitud, un issue por problema;
 * - se guarda en el formato de la versión (V2, o la forma V1 de siempre si la versión es de P0);
 * - **confirmar es responder** (D-4): con `fromProposal`, la Respuesta nace SELF_REPORTED con la transcripción (quién
 *   cargó, cuándo, cuándo confirmó y qué corrigió), la propuesta pasa a CONFIRMADA sin sus respuestas (ya viven en la
 *   Respuesta) y el profesional recibe la novedad; todo en la misma transacción.
 */
@Injectable()
export class RespuestasV2Service {
  constructor(
    private readonly ejecutor: EjecutorDeFormularios,
    private readonly pdp: PdpService,
    private readonly publicador: PublicadorDeNovedades,
  ) {}

  // ─── API-FRI-04 · responder, sola o confirmando la propuesta ─────────────────────────────────
  responder(actor: ActorAutenticado, formRequestId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'SolicitudDeFormulario', id: formRequestId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-FRI-04',
      casoDeUso: 'UC-P33',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: EnviarRespuestaV2RequestSchema,
      cuerpo,
      huellaExtra: { formRequestId },
      efecto: async (tx, pedido, procedencia) => {
        // La fila de la Solicitud, primero (`cerrojo-de-solicitud.ts`): la propuesta que FRI-06 carga a la vez, o la
        // Respuesta que entra por FRM-07, se ven en la relectura; nunca quedan juntas una Respuesta y una pendiente.
        await tomarLaSolicitud(tx, formRequestId, { asesoradoId: actor.identidadId });
        const s = esUuid(formRequestId)
          ? await tx.solicitudDeFormulario.findUnique({ where: { id: formRequestId }, include: { respuesta: { select: { id: true } }, templateVersion: { select: { contenido: true } } } })
          : null;
        // Propio y revelable; ajeno o inexistente, el mismo 404 (09:1599).
        if (!s || s.asesoradoId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-FRI-04', actorId: actor.identidadId, recurso }, ctx);
        // Sobre lo propio, el A3 va antes que cualquier otra regla (09 §36; 08:406; DL-115).
        await exigirA3Vigente(tx, actor.identidadId);
        if (s.respuesta) throw yaRespondida();
        const sigueVigente = await decideBlando(
          this.pdp,
          tx,
          { operacion: 'API-FRI-04', actorDeLaDecision: actor.identidadId, profesionalId: s.profesionalId, titularId: actor.identidadId, alcance: s.alcance as Alcance, recurso },
          ctx,
        );
        if (!sigueVigente) throw new ErrorDeApi(422, CodigoDeError.FORM_REQUEST_NOT_RESPONDABLE, 'Esta Solicitud ya no es respondable.');

        // La propuesta que espera, si hay una. Con `fromProposal` tiene que ser esa y con esa versión; sin él, no puede
        // haber una que esta pantalla no vio: que la lea antes (confirmarla, corregirla o rechazarla), nada se pisa en silencio.
        const pendiente = await tx.propuestaDeRespuestaDeFormulario.findFirst({ where: { solicitudId: s.id, estado: 'PENDIENTE' } });
        if (pedido.fromProposal) {
          if (!pendiente || pendiente.id !== pedido.fromProposal.proposalId.toLowerCase() || `v${pendiente.version}` !== pedido.fromProposal.expectedVersion) throw errores.conflictoDeVersion();
        } else if (pendiente) {
          throw errores.conflictoDeVersion();
        }

        const definicion = definicionV2(s.templateVersion.contenido);
        const campos = camposV2PorCodigo(definicion.sections);
        exigirRespuestasValidas(definicion.sections, solicitudAValidar(s), pedido.answers, { exigirObligatorios: true });

        const momento = await momentoDeLaBase(tx);
        const transcripcion: TranscripcionAlmacenada | null =
          pendiente && pedido.fromProposal
            ? {
                professionalId: pendiente.profesionalId,
                proposalId: pendiente.id,
                loadedAt: pendiente.cargadaEn.toISOString(),
                confirmedAt: momento.toISOString(),
                correctedFieldCodes: camposCorregidos(definicion.sections, respuestasDePropuesta(pendiente.contenido), pedido.answers),
              }
            : null;
        // Dos envíos simultáneos sobre la misma Solicitud: la base deja pasar uno (solicitud_id es única); el otro, 422.
        const respuesta = await sinDuplicar(
          tx.respuestaDeFormulario.create({
            data: {
              solicitudId: s.id,
              asesoradoId: actor.identidadId,
              templateVersionId: s.templateVersionId,
              contenido: contenidoDeRespuestasV2(campos, definicion.usesNewTypes, pedido.answers),
              procedencia: procedencia as unknown as Prisma.InputJsonValue,
              transcripcion: transcripcion ? (transcripcion as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
            },
          }),
          yaRespondida,
        );
        await registrarEventoDeFormulario(tx, {
          tipo: 'RespuestaDeFormularioRegistrada',
          profesionalId: s.profesionalId,
          asesoradoId: actor.identidadId,
          recurso: { tipo: 'RespuestaDeFormulario', id: respuesta.id },
          estadoPrevio: 'PENDING',
          estadoPosterior: 'RESPONDED',
          actorId: actor.identidadId,
          procedencia,
          momento,
        });
        if (pendiente && transcripcion) {
          // La propuesta queda confirmada y sin sus respuestas: ya viven en la Respuesta (D-4, D-6). Si otra operación la
          // resolvió en el medio (la retiró el profesional), la versión no coincide y nada se escribe.
          const confirmada = await tx.propuestaDeRespuestaDeFormulario.updateMany({
            where: { id: pendiente.id, estado: 'PENDIENTE', version: pendiente.version },
            data: { estado: 'CONFIRMADA', contenido: Prisma.DbNull, resueltaEn: momento },
          });
          if (confirmada.count !== 1) throw errores.conflictoDeVersion();
          await registrarEventoDeFormulario(tx, {
            tipo: 'PropuestaDeRespuestaConfirmada',
            profesionalId: pendiente.profesionalId,
            asesoradoId: actor.identidadId,
            recurso: { tipo: 'PropuestaDeRespuestaDeFormulario', id: pendiente.id },
            estadoPrevio: 'PENDIENTE',
            estadoPosterior: 'CONFIRMADA',
            actorId: actor.identidadId,
            procedencia,
            momento,
          });
          await this.publicador.publicar(
            tx,
            [
              {
                tipo: 'PROPUESTA_DE_FORMULARIO_CONFIRMADA',
                destinatarioId: pendiente.profesionalId,
                alcance: s.alcance as Alcance,
                fuenteId: actor.identidadId,
                referencia: { tipo: 'SolicitudDeFormulario', id: s.id },
                identidadDelHecho: pendiente.id,
                momentoDeOcurrencia: momento,
              },
            ],
            procedencia,
          );
        }
        return {
          estadoHttp: 201,
          cuerpo: { data: { formResponseId: respuesta.id, version: `v${respuesta.version}`, submittedAt: respuesta.momentoDeRegistro.toISOString() } },
          sujetoId: actor.identidadId,
          recurso: { tipo: 'RespuestaDeFormulario', id: respuesta.id },
        };
      },
    });
  }

  // ─── API-FRI-05 · rectificar ────────────────────────────────────────────────────────────────
  corregir(actor: ActorAutenticado, formResponseId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'RespuestaDeFormulario', id: formResponseId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-FRI-05',
      casoDeUso: 'UC-P33',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: RectificarRespuestaV2RequestSchema,
      cuerpo,
      huellaExtra: { formResponseId },
      efecto: async (tx, pedido, procedencia) => {
        const r = esUuid(formResponseId)
          ? await tx.respuestaDeFormulario.findUnique({
              where: { id: formResponseId },
              include: { rectificaciones: true, solicitud: { select: { profesionalId: true, alcance: true, camposSolicitados: true, camposRequeridos: true } }, templateVersion: { select: { contenido: true } } },
            })
          : null;
        if (!r || r.asesoradoId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-FRI-05', actorId: actor.identidadId, recurso }, ctx);
        // Como FRM-08: rectificar no pasa por el PDP (09:1633); el A3, con el acto bloqueado (08:406; DL-115).
        await exigirA3Vigente(tx, actor.identidadId, { bloquear: true });

        const relaciones: RelacionDeCorreccion[] = r.rectificaciones.map((c) => ({ id: c.id, originalId: r.id, correccionPreviaId: c.correccionPreviaId }));
        const vista = resolverVistaEfectiva(r.id, relaciones);
        if (vista.tipo === 'NO_RESOLUBLE') {
          throw new ErrorDeApi(422, CodigoDeError.FORM_RESPONSE_RECTIFICATION_NOT_ALLOWED, 'La historia de esta respuesta no se puede resolver.');
        }
        const terminal = vista.tipo === 'CORREGIDA' ? r.rectificaciones.find((c) => c.id === vista.id)! : null;
        const versionVigente = terminal?.version ?? r.version;
        if (`v${versionVigente}` !== pedido.expectedVersion) throw errores.conflictoDeVersion();
        const evaluacion = evaluarNuevaCorreccion(r.id, relaciones, { originalId: r.id, correccionPreviaId: terminal?.id ?? null });
        if (!evaluacion.valida) throw new ErrorDeApi(422, CodigoDeError.FORM_RESPONSE_RECTIFICATION_NOT_ALLOWED, 'No se puede registrar esta rectificación ahora.');

        const definicion = definicionV2(r.templateVersion.contenido);
        const campos = camposV2PorCodigo(definicion.sections);
        exigirRespuestasValidas(definicion.sections, solicitudAValidar(r.solicitud), pedido.answers, { exigirObligatorios: true });

        const rectificacion = await tx.rectificacionDeRespuestaDeFormulario.create({
          data: {
            respuestaId: r.id,
            correccionPreviaId: terminal?.id ?? null,
            motivo: pedido.reason,
            contenido: contenidoDeRespuestasV2(campos, definicion.usesNewTypes, pedido.answers),
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            version: versionVigente + 1,
          },
        });
        const momento = await momentoDeLaBase(tx);
        await registrarEventoDeFormulario(tx, {
          tipo: 'RespuestaDeFormularioRectificada',
          profesionalId: r.solicitud.profesionalId,
          asesoradoId: actor.identidadId,
          recurso: { tipo: 'RectificacionDeRespuestaDeFormulario', id: rectificacion.id },
          estadoPrevio: `v${versionVigente}`,
          estadoPosterior: `v${rectificacion.version}`,
          actorId: actor.identidadId,
          procedencia,
          momento,
        });
        return {
          estadoHttp: 201,
          cuerpo: { data: { formResponseId: r.id, rectificationId: rectificacion.id, version: `v${rectificacion.version}`, recordedAt: rectificacion.momentoDeRegistro.toISOString() } },
          sujetoId: actor.identidadId,
          recurso: { tipo: 'RectificacionDeRespuestaDeFormulario', id: rectificacion.id },
        };
      },
    });
  }
}
