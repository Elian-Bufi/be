import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { cuentaPermiteOperar, type EstadoOperativoDeCuenta } from '@be/domain';
import type { Request } from 'express';
import { errores } from '../http/errores';
import { PrismaService } from '../prisma/prisma.service';
import { extraerBearer, TokensService } from './tokens.service';

/** Actor autenticado. Sale siempre del token verificado + la base, nunca del cliente (07:883-897). */
export interface ActorAutenticado {
  readonly identidadId: string;
  readonly sesionId: string;
  readonly momentoDeAutenticacion: Date;
  readonly expiraEn: Date;
}

export type SolicitudAutenticada = Request & { actor?: ActorAutenticado };

/**
 * AuthN `SESSION` (09v7 T14): «Sesión activa y cuenta operativa». Se evalúa en CADA request contra la base, así
 * la revocación afecta «la siguiente request» (09v7 T15) aunque el token no haya expirado (07:2977, TEST-AUTH-012).
 */
@Injectable()
export class SesionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService, private readonly tokens: TokensService) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const req = contexto.switchToHttp().getRequest<SolicitudAutenticada>();
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
        identidad: { select: { estadoOperativoDeCuenta: true, controlDeSesion: { select: { version: true } } } },
      },
    });
    if (!sesion || sesion.identidadId !== reclamos.sub) throw errores.sesionInvalida();
    if (sesion.estado !== 'ACTIVA') throw errores.sesionRevocada();
    if (sesion.expiraEn.getTime() <= Date.now()) throw errores.sesionExpirada();
    const versionVigente = sesion.identidad.controlDeSesion?.version;
    if (versionVigente !== reclamos.tv || sesion.versionDeControl !== reclamos.tv) throw errores.sesionRevocada();
    // INV-06-28 / REG-06-23: SUSPENDIDA y CERRADA no operan, aunque la sesión siga marcada ACTIVA.
    if (!cuentaPermiteOperar(sesion.identidad.estadoOperativoDeCuenta as EstadoOperativoDeCuenta)) throw errores.sesionRevocada();

    req.actor = {
      identidadId: sesion.identidadId,
      sesionId: reclamos.sid,
      momentoDeAutenticacion: sesion.momentoDeOcurrencia,
      expiraEn: sesion.expiraEn,
    };
    return true;
  }
}

export function actorDe(req: SolicitudAutenticada): ActorAutenticado {
  if (!req.actor) throw errores.autenticacionRequerida();
  return req.actor;
}
