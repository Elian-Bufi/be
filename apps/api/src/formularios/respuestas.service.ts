import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  EnviarRespuestaRequestSchema,
  evaluarNuevaCorreccion,
  RectificarRespuestaRequestSchema,
  resolverVistaEfectiva,
  type Alcance,
  type RelacionDeCorreccion,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { DenegacionDelPdp, PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { esUuid, EjecutorDeFormularios } from './ejecutor';
import { registrarEventoDeFormulario } from './eventos';
import { camposPorCodigo, tipoDeValorCorrecto } from './lectura-formularios';

type Tx = Prisma.TransactionClient;
type Answer = { fieldCode: string; value: string | number | boolean; unit?: string | null; profileSourceRef?: string | null };

/**
 * API-FRM-07 y API-FRM-08 — enviar y rectificar la respuesta propia (09v16.1 §22.7 y §22.8; UC-P33).
 *
 * Las dos son exclusivamente `/me/...`: el actor es siempre el titular de la Solicitud/Respuesta. Por eso acá no
 * hay proyección profesional y la denegación del PDP nunca es el 404 genérico de «no existe»: el recurso es propio
 * y siempre revelable (REG-06-213). Lo que el PDP decide acá es si **sigue siendo respondable** — y si no, el
 * resultado es `422 FORM_REQUEST_NOT_RESPONDABLE`, no un 404 (D-B, WP-07.md).
 */
@Injectable()
export class RespuestasService {
  constructor(private readonly ejecutor: EjecutorDeFormularios, private readonly pdp: PdpService) {}

  // ─── API-FRM-07 · enviar ────────────────────────────────────────────────────────────────────
  responder(actor: ActorAutenticado, formRequestId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'SolicitudDeFormulario', id: formRequestId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-FRM-07',
      casoDeUso: 'UC-P33',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: EnviarRespuestaRequestSchema,
      cuerpo,
      huellaExtra: { formRequestId },
      efecto: async (tx, pedido, procedencia) => {
        const s = esUuid(formRequestId)
          ? await tx.solicitudDeFormulario.findUnique({ where: { id: formRequestId }, include: { respuesta: { select: { id: true } } } })
          : null;
        // Propio y revelable: no es un oráculo de terceros (09:1599). Ajeno o inexistente, el mismo 404.
        if (!s || s.asesoradoId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-FRM-07', actorId: actor.identidadId, recurso }, ctx);
        if (s.respuesta) throw new ErrorDeApi(422, CodigoDeError.FORM_REQUEST_NOT_RESPONDABLE, 'Esta Solicitud ya tiene una respuesta registrada.');

        const sigueVigente = await this.puedeResponder(tx, 'API-FRM-07', s.profesionalId, actor.identidadId, s.alcance, recurso, ctx);
        if (!sigueVigente) throw new ErrorDeApi(422, CodigoDeError.FORM_REQUEST_NOT_RESPONDABLE, 'Esta Solicitud ya no es respondable.');

        const version = await tx.versionDePlantillaDeFormulario.findUniqueOrThrow({ where: { id: s.templateVersionId } });
        this.validarRespuestas(version.contenido, s.camposSolicitados as string[], s.camposRequeridos as string[], pedido.answers);

        const respuesta = await tx.respuestaDeFormulario.create({
          data: {
            solicitudId: s.id,
            asesoradoId: actor.identidadId,
            templateVersionId: s.templateVersionId,
            contenido: { answers: this.contenidoDeRespuestas(pedido.answers) } as unknown as Prisma.InputJsonValue,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
        });
        const momento = await momentoDeLaBase(tx);
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
        return {
          estadoHttp: 201,
          cuerpo: { data: { formResponseId: respuesta.id, version: `v${respuesta.version}`, submittedAt: respuesta.momentoDeRegistro.toISOString() } },
          sujetoId: actor.identidadId,
          recurso: { tipo: 'RespuestaDeFormulario', id: respuesta.id },
        };
      },
    });
  }

  // ─── API-FRM-08 · rectificar ────────────────────────────────────────────────────────────────
  rectificar(actor: ActorAutenticado, formResponseId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'RespuestaDeFormulario', id: formResponseId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-FRM-08',
      casoDeUso: 'UC-P33',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: RectificarRespuestaRequestSchema,
      cuerpo,
      huellaExtra: { formResponseId },
      efecto: async (tx, pedido, procedencia) => {
        const r = esUuid(formResponseId)
          ? await tx.respuestaDeFormulario.findUnique({
              where: { id: formResponseId },
              include: { rectificaciones: true, solicitud: { select: { profesionalId: true, alcance: true } } },
            })
          : null;
        if (!r || r.asesoradoId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-FRM-08', actorId: actor.identidadId, recurso }, ctx);

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

        // «No restaura lectura profesional si el PDP ya no la permite» (09:1633): rectificar es siempre propio y
        // no depende de si el profesional todavía podría leerla — por eso acá no hay chequeo de PDP en absoluto.
        const solicitud = await tx.solicitudDeFormulario.findUniqueOrThrow({ where: { id: r.solicitudId }, select: { camposSolicitados: true, camposRequeridos: true } });
        const version = await tx.versionDePlantillaDeFormulario.findUniqueOrThrow({ where: { id: r.templateVersionId } });
        this.validarRespuestas(version.contenido, solicitud.camposSolicitados as string[], solicitud.camposRequeridos as string[], pedido.answers);

        const rectificacion = await tx.rectificacionDeRespuestaDeFormulario.create({
          data: {
            respuestaId: r.id,
            correccionPreviaId: terminal?.id ?? null,
            motivo: pedido.reason,
            contenido: { answers: this.contenidoDeRespuestas(pedido.answers) } as unknown as Prisma.InputJsonValue,
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

  /**
   * Forma común de un envío o una rectificación (09 §22.7/22.8): cada `fieldCode` existe en la plantilla y tiene el
   * tipo declarado, cada requerido tiene respuesta, ninguno se repite, y ninguno excede lo que la Solicitud pidió —
   * «una plantilla con campos más amplios no amplía B2» aplica también del lado de la respuesta (09:1528).
   */
  private validarRespuestas(contenido: unknown, solicitados: readonly string[], requeridos: readonly string[], answers: readonly Answer[]): void {
    const campos = camposPorCodigo(contenido);
    const codigos = answers.map((a) => a.fieldCode);
    if (new Set(codigos).size !== codigos.length) {
      throw new ErrorDeApi(422, CodigoDeError.FORM_RESPONSE_INVALID, 'Un campo no puede responderse dos veces.');
    }
    if (!codigos.every((c) => solicitados.includes(c))) {
      throw new ErrorDeApi(422, CodigoDeError.FORM_RESPONSE_INVALID, 'Una respuesta no puede exceder lo que la Solicitud pidió.');
    }
    if (!requeridos.every((c) => codigos.includes(c))) {
      throw new ErrorDeApi(422, CodigoDeError.FORM_RESPONSE_INVALID, 'Falta responder un campo requerido.');
    }
    for (const a of answers) {
      const campo = campos.get(a.fieldCode);
      if (!campo || !tipoDeValorCorrecto(campo.dataType, a.value)) {
        throw new ErrorDeApi(422, CodigoDeError.FORM_RESPONSE_INVALID, `El campo "${a.fieldCode}" no tiene el tipo declarado por la plantilla.`);
      }
    }
  }

  /** Cada respuesta persistida queda SELF_REPORTED, invariante (09:1581; TEST-FRM-003). */
  private contenidoDeRespuestas(answers: readonly Answer[]): unknown[] {
    return answers.map((a) => ({ fieldCode: a.fieldCode, value: a.value, unit: a.unit ?? null, profileSourceRef: a.profileSourceRef ?? null, provenance: 'SELF_REPORTED' as const }));
  }

  /** Chequeo blando: «ya no respondable» es 422, no 404 — la Solicitud sigue siendo del titular (D-B). */
  private async puedeResponder(tx: Tx, operacion: string, profesionalId: string, titularId: string, alcance: string, recurso: { tipo: string; id: string }, ctx: ContextoDeSolicitud): Promise<boolean> {
    try {
      await this.pdp.decidirEnTransaccion(tx, { operacion, actorDeLaDecision: titularId, profesionalId, titularId, alcance: alcance as Alcance, recurso }, ctx);
      return true;
    } catch (e) {
      if (e instanceof DenegacionDelPdp) {
        await this.pdp.registrarDenegacion(e);
        return false;
      }
      throw e;
    }
  }
}
