import { CanActivate, ExecutionContext, Inject, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { cuentaPermiteOperar, estadoDelSegundoFactor, type EstadoDelSegundoFactor, type EstadoOperativoDeCuenta, type MetodoDelSegundoFactor } from '@be/domain';
import type { Request } from 'express';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { errores, type ErrorDeApi } from '../http/errores';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { PrismaService } from '../prisma/prisma.service';
import { extraerBearer, TokensService } from '../sesion/tokens.service';

const METADATO_DE_OPERACION = 'be:operacion-administrativa';

/**
 * La operación de Administración de una ruta (API-ADM-04 a 13). Los guards la usan para auditar sus rechazos: una sesión
 * que no es administrativa, una que ya no vale y una sin el segundo factor vigente quedan registradas con la operación que
 * intentaron (revisión de seguridad del 2026-10-25: antes, esos rechazos no dejaban rastro).
 */
export const OperacionAdministrativa = (operacion: string) => SetMetadata(METADATO_DE_OPERACION, operacion);

/** Un rechazo de un guard, auditado (sin el token ni nada del cuerpo) y después lanzado. */
async function rechazar(
  auditoria: AuditoriaService,
  reflector: Reflector,
  contexto: ExecutionContext,
  error: ErrorDeApi,
  motivo: string,
  identidadId: string,
  sesionId: string,
): Promise<never> {
  const req = contexto.switchToHttp().getRequest<SolicitudConContexto>();
  const ctx = contextoDe(req);
  await auditoria.registrar({
    operacion: reflector.get<string | undefined>(METADATO_DE_OPERACION, contexto.getHandler()) ?? 'API-ADM',
    resultado: 'RECHAZO',
    motivo,
    actorId: identidadId,
    sujetoId: identidadId,
    recursoTipo: 'Sesion',
    recursoId: sesionId,
    superficie: ctx.superficie,
    requestId: ctx.requestId,
    momentoDeOcurrencia: ctx.momentoDeRecepcion,
  });
  throw error;
}

/** El administrador autenticado. Sale del token verificado y de la base en cada pedido, nunca del cliente. */
export interface ActorAdministrativo {
  readonly identidadId: string;
  readonly sesionId: string;
  readonly inicioDeLaSesion: Date;
  readonly expiraEn: Date;
  /** El nombre con que figura en el historial (el de su rol administrativo). */
  readonly nombreVisible: string;
  /** El estado del segundo factor de esta sesión, decidido con lo que guarda la base. */
  readonly segundoFactor: EstadoDelSegundoFactor;
}

export type SolicitudAdministrativa = Request & { actorAdministrativo?: ActorAdministrativo };

/** La actividad que mantiene vigente el segundo factor se anota a lo sumo una vez por minuto (una escritura, no una por pedido). */
const ANOTAR_ACTIVIDAD_CADA_MS = 60 * 1000;

export const METODO_API: Readonly<Record<'TOTP' | 'CODIGO_DE_RECUPERACION' | 'CONFIGURACION', MetodoDelSegundoFactor>> = {
  TOTP: 'TOTP',
  CODIGO_DE_RECUPERACION: 'RECOVERY_CODE',
  CONFIGURACION: 'ENROLLMENT',
};

/**
 * La sesión administrativa (WP-ADMINISTRACION, DL-155), en cada pedido contra la base, como `SesionGuard`:
 * - sin la clave del segundo factor configurada, la administración no abre (503);
 * - el token tiene que ser de una sesión ADMINISTRATIVA, activa, sin vencer, con la versión de control vigente, de una
 *   cuenta operativa y con el rol administrativo vigente. Una sesión común (de un profesional o de una persona) recibe
 *   403 ACTION_FORBIDDEN: nunca obtiene privilegios administrativos;
 * - deja en la request el actor y el estado de su segundo factor. Esto solo alcanza para las operaciones del segundo
 *   factor y para la propia sesión: leer o decidir exige además `SegundoFactorGuard`.
 */
@Injectable()
export class SesionAdministrativaGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
    private readonly auditoria: AuditoriaService,
    private readonly reflector: Reflector,
    @Inject(ENTORNO) private readonly entorno: Entorno,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    if (!this.entorno.claveDelSegundoFactor) throw errores.administracionNoDisponible();
    const req = contexto.switchToHttp().getRequest<SolicitudAdministrativa>();
    const token = extraerBearer(req.get('authorization'));
    if (!token) throw errores.autenticacionRequerida();
    const reclamos = this.tokens.verificar(token);
    const sesion = await this.prisma.sesion.findUnique({
      where: { id: reclamos.sid },
      select: {
        identidadId: true,
        estado: true,
        expiraEn: true,
        momentoDeOcurrencia: true,
        versionDeControl: true,
        clase: true,
        segundoFactor: { select: { verificadoEn: true, metodo: true, ultimaActividad: true } },
        identidad: {
          select: {
            estadoOperativoDeCuenta: true,
            controlDeSesion: { select: { version: true } },
            rolesAdministrativos: { where: { estado: 'VIGENTE' }, select: { nombreVisible: true } },
            factoresTotp: { where: { estado: 'ACTIVO' }, select: { id: true } },
          },
        },
      },
    });
    if (!sesion || sesion.identidadId !== reclamos.sub) throw errores.sesionInvalida();
    // Un token bien firmado de una sesión que existe: los rechazos que siguen se auditan, con la identidad y la sesión.
    const rechazo = (error: ErrorDeApi, motivo: string) => rechazar(this.auditoria, this.reflector, contexto, error, motivo, sesion.identidadId, reclamos.sid);
    // Una sesión común (de un profesional o de una persona) nunca obtiene nada de Administración, ni siquiera el estado de
    // su propia sesión: se dice y queda auditado.
    if (sesion.clase !== 'ADMINISTRATIVA') return rechazo(errores.noEsAdministrativa(), 'SESION_NO_ADMINISTRATIVA');
    if (sesion.estado !== 'ACTIVA') return rechazo(errores.sesionRevocada(), `SESION_${sesion.estado}`);
    if (sesion.expiraEn.getTime() <= Date.now()) return rechazo(errores.sesionExpirada(), 'SESION_VENCIDA');
    const versionVigente = sesion.identidad.controlDeSesion?.version;
    if (versionVigente !== reclamos.tv || sesion.versionDeControl !== reclamos.tv) return rechazo(errores.sesionRevocada(), 'VERSION_DE_CONTROL');
    if (!cuentaPermiteOperar(sesion.identidad.estadoOperativoDeCuenta as EstadoOperativoDeCuenta)) return rechazo(errores.sesionRevocada(), 'CUENTA_NO_OPERATIVA');
    const rol = sesion.identidad.rolesAdministrativos[0];
    // Sin el rol vigente (lo retiró el operador), la sesión ya no es de nadie que administre.
    if (!rol) return rechazo(errores.sesionRevocada(), 'SIN_ROL_ADMINISTRATIVO');
    const factor = sesion.segundoFactor;
    req.actorAdministrativo = {
      identidadId: sesion.identidadId,
      sesionId: reclamos.sid,
      inicioDeLaSesion: sesion.momentoDeOcurrencia,
      expiraEn: sesion.expiraEn,
      nombreVisible: rol.nombreVisible,
      segundoFactor: estadoDelSegundoFactor({
        inicioDeLaSesion: sesion.momentoDeOcurrencia,
        verificadoEn: factor?.verificadoEn ?? null,
        metodo: factor?.metodo ? METODO_API[factor.metodo] : null,
        ultimaActividad: factor?.ultimaActividad ?? null,
        tieneAutenticadorActivo: sesion.identidad.factoresTotp.length > 0,
        ahora: new Date(),
      }),
    };
    return true;
  }
}

/**
 * `SESSION_MFA` (09v7 T14): el segundo factor de la sesión, vigente. Va después de `SesionAdministrativaGuard`.
 * - Sin vigencia, 403 MFA_REQUIRED, con el motivo en la auditoría: falta, venció por inactividad o falta configurarlo. La
 *   consola pide el código; la contraseña, no.
 * - Vigente, anota la actividad (a lo sumo una vez por minuto): 15 minutos sin actividad lo vencen.
 * Ninguna lectura ni decisión administrativa corre sin esto.
 */
@Injectable()
export class SegundoFactorGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const req = contexto.switchToHttp().getRequest<SolicitudAdministrativa>();
    const actor = req.actorAdministrativo;
    if (!actor) throw errores.autenticacionRequerida();
    if (actor.segundoFactor.estado !== 'VERIFICADO') {
      const motivo = `SEGUNDO_FACTOR_${actor.segundoFactor.estado}`;
      return rechazar(this.auditoria, this.reflector, contexto, errores.segundoFactorRequerido(motivo), `MFA_REQUERIDO:${motivo}`, actor.identidadId, actor.sesionId);
    }
    const ahora = new Date();
    await this.prisma.segundoFactorDeSesion.updateMany({
      where: { sesionId: actor.sesionId, OR: [{ ultimaActividad: null }, { ultimaActividad: { lt: new Date(ahora.getTime() - ANOTAR_ACTIVIDAD_CADA_MS) } }] },
      data: { ultimaActividad: ahora },
    });
    return true;
  }
}

export function actorAdministrativoDe(req: SolicitudAdministrativa): ActorAdministrativo {
  if (!req.actorAdministrativo) throw errores.autenticacionRequerida();
  return req.actorAdministrativo;
}
