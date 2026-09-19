import { Injectable } from '@nestjs/common';
import {
  SolicitarCierreRequestSchema,
  VENTANA_DE_STEP_UP_MS,
  type ContextoDeTransicionDeCuenta,
  type MotivoDeRechazoDeTransicion,
  type SolicitarCierreResponse,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { validarCuerpo } from '../http/validacion';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { IdempotenciaService, type ResultadoIdempotente } from '../plataforma/idempotencia.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { extraerBearer, TokensService } from '../sesion/tokens.service';
import { EstadoDeCuentaService } from './estado-de-cuenta.service';

const OPERACION = 'API-ACC-P1-03';

/**
 * UC-P27 / RF-069 — Solicitar cierre de cuenta (API-ACC-P1-03, P1). Cierre síncrono (DEUDA_LEGAJO DL-016):
 * en una transacción, CerrarCuenta (06 §5.7.4) + efectos §5.8 + SolicitudDeCierreDeCuenta + auditoría.
 * AuthN SESSION_STEP_UP = sesión autenticada hace ≤ 10 min (DL-017).
 */
@Injectable()
export class CierreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
    private readonly idempotencia: IdempotenciaService,
    private readonly auditoria: AuditoriaService,
    private readonly estadoDeCuenta: EstadoDeCuentaService,
  ) {}

  async solicitar(
    encabezadoAuthorization: string | undefined,
    cuerpo: unknown,
    claveDeIdempotencia: string | undefined,
    ctx: ContextoDeSolicitud,
  ): Promise<ResultadoIdempotente> {
    if (!IdempotenciaService.claveValida(claveDeIdempotencia)) {
      throw errores.solicitudInvalida([{ code: 'IDEMPOTENCY_KEY_REQUIRED', path: 'Idempotency-Key' }], { header: 'Idempotency-Key' });
    }
    const autenticacion = await this.autenticar(encabezadoAuthorization, claveDeIdempotencia);
    const solicitud = validarCuerpo(SolicitarCierreRequestSchema, cuerpo);
    const huella = IdempotenciaService.huella(solicitud);
    if (autenticacion.tipo === 'replay') {
      // Mismo contrato que IdempotenciaService: misma key con otro request lógico → 409, nunca el resultado guardado.
      if (autenticacion.huella !== huella) throw errores.claveDeIdempotenciaReutilizada();
      return autenticacion.resultado;
    }
    const actor = autenticacion.actor;
    const procedencia = procedenciaDe(ctx, 'UC-P27', OPERACION);

    try {
      return await this.idempotencia.ejecutar(
        { operacion: OPERACION, ambito: actor.identidadId, clave: claveDeIdempotencia, huella },
        async (tx) => {
          const contexto: ContextoDeTransicionDeCuenta = {
            transicion: 'CerrarCuenta',
            actor: 'TITULAR',
            sesionDelTitularValida: true, // el guard de sesión ya verificó sesión ACTIVA del titular
            autenticacionReciente: ctx.momentoDeRecepcion.getTime() - actor.momentoDeAutenticacion.getTime() <= VENTANA_DE_STEP_UP_MS,
            versionDeConsecuenciasPresentada: solicitud.consequencesAcknowledgement.versionId,
            confirmacionExplicita: solicitud.confirmed === true,
          };
          const evaluacion = await this.estadoDeCuenta.transicionar(
            tx,
            actor.identidadId,
            contexto,
            { identidadId: actor.identidadId },
            procedencia,
            ctx.momentoDeRecepcion,
          );
          if (!evaluacion.permitida) throw errorDeRechazo(evaluacion.motivo);

          const registrada = await tx.solicitudDeCierreDeCuenta.create({
            data: {
              identidadId: actor.identidadId,
              actorId: actor.identidadId,
              versionDeConsecuenciasId: solicitud.consequencesAcknowledgement.versionId,
              procedencia: procedencia as unknown as Prisma.InputJsonValue,
              momentoDeOcurrencia: ctx.momentoDeRecepcion,
            },
          });
          await this.auditoria.registrar(
            {
              operacion: OPERACION,
              resultado: 'EXITO',
              actorId: actor.identidadId,
              sujetoId: actor.identidadId,
              recursoTipo: 'SolicitudDeCierreDeCuenta',
              recursoId: registrada.id,
              superficie: ctx.superficie,
              requestId: ctx.requestId,
              momentoDeOcurrencia: ctx.momentoDeRecepcion,
            },
            tx,
          );
          const respuesta: SolicitarCierreResponse = {
            data: {
              id: registrada.id,
              identityId: actor.identidadId,
              accountOperationalState: 'CERRADA',
              requestedAt: registrada.momentoDeOcurrencia.toISOString(),
            },
          };
          return { estadoHttp: 201, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
        },
      );
    } catch (e) {
      if (e instanceof ErrorDeApi) {
        await this.auditoria.registrar({
          operacion: OPERACION,
          resultado: 'RECHAZO',
          motivo: e.code,
          actorId: actor.identidadId,
          sujetoId: actor.identidadId,
          superficie: ctx.superficie,
          requestId: ctx.requestId,
          momentoDeOcurrencia: ctx.momentoDeRecepcion,
        });
      }
      throw e;
    }
  }

  /**
   * SESSION normal, con una sola excepción: si la sesión fue revocada por ESTE cierre (motivo CIERRE_DE_CUENTA) y
   * existe el registro de idempotencia de la misma key, se devuelve el mismo resultado (09v7 T07/T08: un POST con
   * Idempotency-Key se reintenta ante incertidumbre de red). Cualquier otro caso responde como el guard SESSION.
   */
  private async autenticar(
    encabezado: string | undefined,
    clave: string,
  ): Promise<{ tipo: 'actor'; actor: ActorAutenticado } | { tipo: 'replay'; huella: string; resultado: ResultadoIdempotente }> {
    const token = extraerBearer(encabezado);
    if (!token) throw errores.autenticacionRequerida();
    const reclamos = this.tokens.verificar(token);
    const sesion = await this.prisma.sesion.findUnique({
      where: { id: reclamos.sid },
      select: {
        identidadId: true,
        estado: true,
        motivoDeRevocacion: true,
        expiraEn: true,
        momentoDeOcurrencia: true,
        versionDeControl: true,
        identidad: { select: { estadoOperativoDeCuenta: true, controlDeSesion: { select: { version: true } } } },
      },
    });
    if (!sesion || sesion.identidadId !== reclamos.sub) throw errores.sesionInvalida();

    if (sesion.estado === 'REVOCADA' && sesion.motivoDeRevocacion === 'CIERRE_DE_CUENTA') {
      const previo = await this.prisma.registroDeIdempotencia.findUnique({
        where: { operacion_ambito_clave: { operacion: OPERACION, ambito: sesion.identidadId, clave } },
      });
      if (previo) {
        return { tipo: 'replay', huella: previo.huella, resultado: { estadoHttp: previo.estadoHttp, cuerpo: previo.cuerpo as Prisma.InputJsonValue } };
      }
      throw errores.sesionRevocada();
    }
    if (sesion.estado !== 'ACTIVA') throw errores.sesionRevocada();
    if (sesion.expiraEn.getTime() <= Date.now()) throw errores.sesionExpirada();
    const version = sesion.identidad.controlDeSesion?.version;
    if (version !== reclamos.tv || sesion.versionDeControl !== reclamos.tv) throw errores.sesionRevocada();
    if (sesion.identidad.estadoOperativoDeCuenta !== 'OPERATIVA') throw errores.sesionRevocada();
    return {
      tipo: 'actor',
      actor: {
        identidadId: sesion.identidadId,
        sesionId: reclamos.sid,
        momentoDeAutenticacion: sesion.momentoDeOcurrencia,
        expiraEn: sesion.expiraEn,
      },
    };
  }
}

function errorDeRechazo(motivo: MotivoDeRechazoDeTransicion): ErrorDeApi {
  switch (motivo) {
    case 'STEP_UP_REQUERIDO':
      return errores.stepUpRequerido();
    case 'CONSECUENCIAS_NO_PRESENTADAS':
      return errores.validacionFallida([{ code: 'CONSEQUENCES_NOT_PRESENTED', path: 'consequencesAcknowledgement.versionId' }]);
    case 'SIN_CONFIRMACION_EXPLICITA':
      return errores.validacionFallida([{ code: 'EXPLICIT_CONFIRMATION_REQUIRED', path: 'confirmed' }]);
    case 'SESION_NO_VALIDA':
      return errores.sesionInvalida();
    default:
      return errores.transicionNoPermitida();
  }
}
