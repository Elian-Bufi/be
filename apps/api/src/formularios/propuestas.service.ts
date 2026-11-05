import { Injectable } from '@nestjs/common';
import { CargarPropuestaRequestSchema, CodigoDeError, ResolverPropuestaRequestSchema, type Alcance } from '@be/domain';
import { Prisma, type TipoDeEventoDeFormulario } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { PublicadorDeNovedades } from '../novedades/publicador';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase, sinDuplicar, sinViolarRegla } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { tomarLaSolicitud } from './cerrojo-de-solicitud';
import { esUuid, EjecutorDeFormularios } from './ejecutor';
import { registrarEventoDeFormulario } from './eventos';
import { camposV2PorCodigo, contenidoDePropuesta, definicionV2, exigirRespuestasValidas, solicitudAValidar } from './lectura-formularios-v2';

const RECURSO = 'PropuestaDeRespuestaDeFormulario';
const yaRespondida = () => new ErrorDeApi(422, CodigoDeError.FORM_REQUEST_NOT_RESPONDABLE, 'Esta Solicitud ya tiene una respuesta registrada: no hay nada que confirmar.');
/** El trigger de insertar propuestas (migración 20261104120200), cuando la Respuesta entró entre la lectura y la escritura. */
const REGLA_DE_SOLICITUD_RESPONDIDA = /una Solicitud respondida no admite propuestas/;

/**
 * API-FRI-06, 07 y 08 — la propuesta del profesional (DL-164 D-3): lo que cargó desde el escritorio con lo que la persona
 * le contó, que espera que ella lo confirme desde su app (confirmar es responder: FRI-04).
 * - Una sola pendiente por Solicitud, con su versión como token (`expectedVersion`); la base lo sostiene (índice parcial).
 * - Cargar y retirar son del profesional de la Solicitud, con el mismo PDP que FRM-03 y FRM-05: sin autorización actual,
 *   o sobre una Solicitud ajena o inexistente, el mismo 404 (TEST-FRI-006).
 * - Rechazar es de la persona, sobre lo propio: la pertenencia (404 idéntico a lo inexistente) y el token de versión, y
 *   nada más. Descarta un dato que ella no confirmó: no lo lee ni lo escribe, así que no exige el A3 ni pasa por el PDP
 *   (si lo exigiera, con el A3 revocado la propuesta quedaría imposible de descartar). Al revocar el A3, además, las
 *   pendientes se retiran solas (`propuestas-del-titular.ts`).
 * - Rechazar y retirar **borran** las respuestas propuestas (D-6): queda solo cómo y cuándo terminó.
 * - La novedad: a la persona cuando se carga o se reemplaza; al profesional cuando ella rechaza, solo si sigue autorizado
 *   sobre el Alcance de la Solicitud (y cuando confirma, en FRI-04). Nunca el contenido.
 * - Cargar toma la fila de la Solicitud al empezar (`cerrojo-de-solicitud.ts`), como responder: así no quedan juntas una
 *   Respuesta y una propuesta pendiente. Si igual la Respuesta entró antes, el trigger de la base lo dice y acá es 422.
 */
@Injectable()
export class PropuestasService {
  constructor(
    private readonly ejecutor: EjecutorDeFormularios,
    private readonly pdp: PdpService,
    private readonly publicador: PublicadorDeNovedades,
  ) {}

  // ─── API-FRI-06 · cargar o reemplazar ───────────────────────────────────────────────────────
  cargar(actor: ActorAutenticado, formRequestId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'SolicitudDeFormulario', id: formRequestId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-FRI-06',
      casoDeUso: 'UC-P32',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: CargarPropuestaRequestSchema,
      cuerpo,
      huellaExtra: { formRequestId },
      efecto: async (tx, pedido, procedencia) => {
        // La fila de la Solicitud, primero: responder (FRM-07, FRI-04) la toma igual, y quien espera relee después.
        await tomarLaSolicitud(tx, formRequestId, { profesionalId: actor.identidadId });
        const s = await this.solicitudDelProfesional(tx, 'API-FRI-06', actor, formRequestId, ctx);
        // Mismo PDP que FRM-03: lo que se carga es dato de salud de la persona, para su Alcance; denegado, 404 idéntico.
        await this.pdp.decidirEnTransaccion(
          tx,
          { operacion: 'API-FRI-06', actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: s.asesoradoId, alcance: s.alcance as Alcance, recurso },
          ctx,
        );
        if (s.respuesta) throw yaRespondida();

        const definicion = definicionV2(s.templateVersion.contenido);
        const campos = camposV2PorCodigo(definicion.sections);
        // Sin exigir los obligatorios: los completa la persona al confirmar (FI-05).
        exigirRespuestasValidas(definicion.sections, solicitudAValidar(s), pedido.answers, { exigirObligatorios: false });
        const contenido = contenidoDePropuesta(campos, pedido.answers);

        const momento = await momentoDeLaBase(tx);
        const pendiente = await tx.propuestaDeRespuestaDeFormulario.findFirst({ where: { solicitudId: s.id, estado: 'PENDIENTE' } });
        let propuesta;
        let estadoHttp: 200 | 201;
        let hecho: { tipo: TipoDeEventoDeFormulario; previo: string | null; posterior: string };
        if (pedido.expectedVersion === null) {
          // Crear: con una pendiente (o si otra carga simultánea gana en la base), la pantalla tiene que verla primero.
          // Y si la Respuesta entró igual antes que esta escritura, la regla de la base es el mismo 422 de «respondida».
          if (pendiente) throw errores.conflictoDeVersion();
          propuesta = await sinViolarRegla(
            sinDuplicar(
              tx.propuestaDeRespuestaDeFormulario.create({
                data: { solicitudId: s.id, profesionalId: actor.identidadId, contenido, procedencia: procedencia as unknown as Prisma.InputJsonValue, cargadaEn: momento },
              }),
              errores.conflictoDeVersion,
            ),
            REGLA_DE_SOLICITUD_RESPONDIDA,
            yaRespondida,
          );
          estadoHttp = 201;
          hecho = { tipo: 'PropuestaDeRespuestaCargada', previo: null, posterior: 'PENDIENTE' };
        } else {
          // Reemplazar: solo la pendiente, con la versión que se vio; la versión avanza de a uno y la carga se renueva.
          if (!pendiente || `v${pendiente.version}` !== pedido.expectedVersion) throw errores.conflictoDeVersion();
          const r = await tx.propuestaDeRespuestaDeFormulario.updateMany({
            where: { id: pendiente.id, estado: 'PENDIENTE', version: pendiente.version },
            data: { contenido, version: pendiente.version + 1, cargadaEn: momento, procedencia: procedencia as unknown as Prisma.InputJsonValue },
          });
          if (r.count !== 1) throw errores.conflictoDeVersion();
          propuesta = await tx.propuestaDeRespuestaDeFormulario.findUniqueOrThrow({ where: { id: pendiente.id } });
          estadoHttp = 200;
          hecho = { tipo: 'PropuestaDeRespuestaReemplazada', previo: `v${pendiente.version}`, posterior: `v${propuesta.version}` };
        }
        await registrarEventoDeFormulario(tx, {
          tipo: hecho.tipo,
          profesionalId: actor.identidadId,
          asesoradoId: s.asesoradoId,
          recurso: { tipo: RECURSO, id: propuesta.id },
          estadoPrevio: hecho.previo,
          estadoPosterior: hecho.posterior,
          actorId: actor.identidadId,
          procedencia,
          momento,
        });
        // A la persona, que abra sus formularios. Cada versión cargada es un hecho: un reemplazo vuelve a avisar.
        await this.publicador.publicar(
          tx,
          [
            {
              tipo: 'PROPUESTA_DE_FORMULARIO_CARGADA',
              destinatarioId: s.asesoradoId,
              alcance: s.alcance as Alcance,
              fuenteId: actor.identidadId,
              referencia: { tipo: 'SolicitudDeFormulario', id: s.id },
              identidadDelHecho: `${propuesta.id}#v${propuesta.version}`,
              momentoDeOcurrencia: momento,
            },
          ],
          procedencia,
        );
        return {
          estadoHttp,
          cuerpo: { data: { proposalId: propuesta.id, version: `v${propuesta.version}`, loadedAt: propuesta.cargadaEn.toISOString() } },
          sujetoId: s.asesoradoId,
          recurso: { tipo: RECURSO, id: propuesta.id },
        };
      },
    });
  }

  // ─── API-FRI-07 · retirar (el profesional) ──────────────────────────────────────────────────
  retirar(actor: ActorAutenticado, formRequestId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'SolicitudDeFormulario', id: formRequestId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-FRI-07',
      casoDeUso: 'UC-P32',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: ResolverPropuestaRequestSchema,
      cuerpo,
      huellaExtra: { formRequestId },
      efecto: async (tx, pedido, procedencia) => {
        const s = await this.solicitudDelProfesional(tx, 'API-FRI-07', actor, formRequestId, ctx);
        // El mismo corte que FRM-05 sobre la Solicitud: sin autorización actual, el 404 de lo inexistente.
        await this.pdp.decidirEnTransaccion(
          tx,
          { operacion: 'API-FRI-07', actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: s.asesoradoId, alcance: s.alcance as Alcance, recurso },
          ctx,
        );
        const pendiente = await tx.propuestaDeRespuestaDeFormulario.findFirst({ where: { solicitudId: s.id, estado: 'PENDIENTE', profesionalId: actor.identidadId } });
        if (!pendiente || `v${pendiente.version}` !== pedido.expectedVersion) throw errores.conflictoDeVersion();
        const momento = await momentoDeLaBase(tx);
        await this.resolver(tx, pendiente, 'RETIRADA', momento);
        await registrarEventoDeFormulario(tx, {
          tipo: 'PropuestaDeRespuestaRetirada',
          profesionalId: actor.identidadId,
          asesoradoId: s.asesoradoId,
          recurso: { tipo: RECURSO, id: pendiente.id },
          estadoPrevio: 'PENDIENTE',
          estadoPosterior: 'RETIRADA',
          actorId: actor.identidadId,
          procedencia,
          momento,
        });
        return {
          estadoHttp: 200,
          cuerpo: { data: { proposalId: pendiente.id, outcome: 'WITHDRAWN', resolvedAt: momento.toISOString() } },
          sujetoId: s.asesoradoId,
          recurso: { tipo: RECURSO, id: pendiente.id },
        };
      },
    });
  }

  // ─── API-FRI-08 · rechazar (la persona) ─────────────────────────────────────────────────────
  rechazar(actor: ActorAutenticado, formRequestId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'SolicitudDeFormulario', id: formRequestId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-FRI-08',
      casoDeUso: 'UC-P33',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: ResolverPropuestaRequestSchema,
      cuerpo,
      huellaExtra: { formRequestId },
      efecto: async (tx, pedido, procedencia) => {
        const s = esUuid(formRequestId) ? await tx.solicitudDeFormulario.findUnique({ where: { id: formRequestId } }) : null;
        if (!s || s.asesoradoId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-FRI-08', actorId: actor.identidadId, recurso }, ctx);
        // Sobre lo propio, nada más que el token: descartar un dato que no se confirmó no lee ni escribe datos de salud,
        // así que no exige el A3 (con el A3 revocado tiene que poder descartarla igual) ni pasa por el PDP.
        const pendiente = await tx.propuestaDeRespuestaDeFormulario.findFirst({ where: { solicitudId: s.id, estado: 'PENDIENTE' } });
        if (!pendiente || `v${pendiente.version}` !== pedido.expectedVersion) throw errores.conflictoDeVersion();
        const momento = await momentoDeLaBase(tx);
        await this.resolver(tx, pendiente, 'RECHAZADA', momento);
        await registrarEventoDeFormulario(tx, {
          tipo: 'PropuestaDeRespuestaRechazada',
          profesionalId: pendiente.profesionalId,
          asesoradoId: actor.identidadId,
          recurso: { tipo: RECURSO, id: pendiente.id },
          estadoPrevio: 'PENDIENTE',
          estadoPosterior: 'RECHAZADA',
          actorId: actor.identidadId,
          procedencia,
          momento,
        });
        // La novedad al profesional, solo si hoy sigue autorizado sobre el Alcance de la Solicitud (la misma evaluación que
        // muestran las listas, sin registrar una decisión: no es un acceso suyo). Con el vínculo en pausa, el B2 revocado o
        // el A3 revocado no se le avisa nada; el rechazo y el borrado son iguales.
        const autorizado = (await this.pdp.evaluarSinRegistrar(tx, pendiente.profesionalId, actor.identidadId, s.alcance as Alcance)).permitida;
        if (autorizado) {
          await this.publicador.publicar(
            tx,
            [
              {
                tipo: 'PROPUESTA_DE_FORMULARIO_RECHAZADA',
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
          estadoHttp: 200,
          cuerpo: { data: { proposalId: pendiente.id, outcome: 'REJECTED', resolvedAt: momento.toISOString() } },
          sujetoId: actor.identidadId,
          recurso: { tipo: RECURSO, id: pendiente.id },
        };
      },
    });
  }

  /** La Solicitud, si es de este profesional; si no existe o es de otro, el mismo 404 (con el Alcance real, si se conoce). */
  private async solicitudDelProfesional(tx: Prisma.TransactionClient, operacion: string, actor: ActorAutenticado, formRequestId: string, ctx: ContextoDeSolicitud) {
    const recurso = { tipo: 'SolicitudDeFormulario', id: formRequestId };
    const s = esUuid(formRequestId)
      ? await tx.solicitudDeFormulario.findUnique({ where: { id: formRequestId }, include: { respuesta: { select: { id: true } }, templateVersion: { select: { contenido: true } } } })
      : null;
    if (!s) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso }, ctx);
    if (s.profesionalId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso, sujetoId: s.asesoradoId, alcance: s.alcance as Alcance }, ctx);
    return s;
  }

  /** Resuelve la pendiente con la versión que se leyó: las respuestas se borran (D-6). Si cambió en el medio, 409. */
  private async resolver(tx: Prisma.TransactionClient, pendiente: { id: string; version: number }, estado: 'RECHAZADA' | 'RETIRADA', momento: Date): Promise<void> {
    const r = await tx.propuestaDeRespuestaDeFormulario.updateMany({
      where: { id: pendiente.id, estado: 'PENDIENTE', version: pendiente.version },
      data: { estado, contenido: Prisma.DbNull, resueltaEn: momento },
    });
    if (r.count !== 1) throw errores.conflictoDeVersion();
  }
}
