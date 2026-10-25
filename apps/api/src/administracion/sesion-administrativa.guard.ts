import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { cuentaPermiteOperar, estadoDelSegundoFactor, type EstadoDelSegundoFactor, type EstadoOperativoDeCuenta, type MetodoDelSegundoFactor } from '@be/domain';
import type { Request } from 'express';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { errores } from '../http/errores';
import { PrismaService } from '../prisma/prisma.service';
import { extraerBearer, TokensService } from '../sesion/tokens.service';

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
    if (sesion.estado !== 'ACTIVA') throw errores.sesionRevocada();
    if (sesion.expiraEn.getTime() <= Date.now()) throw errores.sesionExpirada();
    const versionVigente = sesion.identidad.controlDeSesion?.version;
    if (versionVigente !== reclamos.tv || sesion.versionDeControl !== reclamos.tv) throw errores.sesionRevocada();
    if (!cuentaPermiteOperar(sesion.identidad.estadoOperativoDeCuenta as EstadoOperativoDeCuenta)) throw errores.sesionRevocada();
    if (sesion.clase !== 'ADMINISTRATIVA') throw errores.noEsAdministrativa();
    const rol = sesion.identidad.rolesAdministrativos[0];
    // Sin el rol vigente (lo retiró el operador), la sesión ya no es de nadie que administre.
    if (!rol) throw errores.sesionRevocada();
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
 * - Sin vigencia, 403 MFA_REQUIRED, con el motivo en la auditoría del filtro: falta, venció por inactividad o falta
 *   configurarlo. La consola pide el código; la contraseña, no.
 * - Vigente, anota la actividad (a lo sumo una vez por minuto): 15 minutos sin actividad lo vencen.
 * Ninguna lectura ni decisión administrativa corre sin esto.
 */
@Injectable()
export class SegundoFactorGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const req = contexto.switchToHttp().getRequest<SolicitudAdministrativa>();
    const actor = req.actorAdministrativo;
    if (!actor) throw errores.autenticacionRequerida();
    if (actor.segundoFactor.estado !== 'VERIFICADO') throw errores.segundoFactorRequerido(`SEGUNDO_FACTOR_${actor.segundoFactor.estado}`);
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
