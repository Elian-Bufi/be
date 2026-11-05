import { Injectable } from '@nestjs/common';
import { CargarPropuestaRequestSchema, CodigoDeError, ResolverPropuestaRequestSchema, type Alcance } from '@be/domain';
import { Prisma, type TipoDeEventoDeFormulario } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import { exigirA3Vigente } from '../consentimiento/a3-del-titular';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { PublicadorDeNovedades } from '../novedades/publicador';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase, sinDuplicar } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { esUuid, EjecutorDeFormularios } from './ejecutor';
import { registrarEventoDeFormulario } from './eventos';
import { camposV2PorCodigo, contenidoDePropuesta, definicionV2, exigirRespuestasValidas, solicitudAValidar } from './lectura-formularios-v2';

const RECURSO = 'PropuestaDeRespuestaDeFormulario';

/**
 * API-FRI-06, 07 y 08 — la propuesta del profesional (DL-164 D-3): lo que cargó desde el escritorio con lo que la persona
 * le contó, que espera que ella lo confirme desde su app (confirmar es responder: FRI-04).
 * - Una sola pendiente por Solicitud, con su versión como token (`expectedVersion`); la base lo sostiene (índice parcial).
 * - Cargar y retirar son del profesional de la Solicitud, con el mismo PDP que FRM-03 y FRM-05: sin autorización actual,
 *   o sobre una Solicitud ajena o inexistente, el mismo 404 (TEST-FRI-006).
 * - Rechazar es de la persona, sobre lo propio: A3 (403) y nada más, como FRM-08 (09:1633).
 * - Rechazar y retirar **borran** las respuestas propuestas (D-6): queda solo cómo y cuándo terminó.
 * - La novedad: a la persona cuando se carga o se reemplaza; al profesional cuando ella rechaza (y cuando confirma, en
 *   FRI-04). Nunca el contenido.
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
        const s = await this.solicitudDelProfesional(tx, 'API-FRI-06', actor, formRequestId, ctx);
        // Mismo PDP que FRM-03: lo que se carga es dato de salud de la persona, para su Alcance; denegado, 404 idéntico.
        await this.pdp.decidirEnTransaccion(
          tx,
          { operacion: 'API-FRI-06', actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: s.asesoradoId, alcance: s.alcance as Alcance, recurso },
          ctx,
        );
        if (s.respuesta) throw new ErrorDeApi(422, CodigoDeError.FORM_REQUEST_NOT_RESPONDABLE, 'Esta Solicitud ya tiene una respuesta registrada: no hay nada que confirmar.');

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
          if (pendiente) throw errores.conflictoDeVersion();
          propuesta = await sinDuplicar(
            tx.propuestaDeRespuestaDeFormulario.create({
              data: { solicitudId: s.id, profesionalId: actor.identidadId, contenido, procedencia: procedencia as unknown as Prisma.InputJsonValue, cargadaEn: momento },
            }),
            errores.conflictoDeVersion,
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
        // Sobre lo propio, el A3 con el acto bloqueado (como FRM-08); no pasa por el PDP: descarta un dato, no lo lee ni lo escribe.
        await exigirA3Vigente(tx, actor.identidadId, { bloquear: true });
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
