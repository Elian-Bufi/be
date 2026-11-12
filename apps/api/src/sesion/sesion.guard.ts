import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { cuentaPermiteOperar, estadoDelSegundoFactorDelProfesional, type EstadoDelSegundoFactorDelProfesional, type EstadoOperativoDeCuenta } from '@be/domain';
import type { Request } from 'express';
import { errores } from '../http/errores';
import { PrismaService } from '../prisma/prisma.service';
import { METODO_API } from '../administracion/sesion-administrativa.guard';
import { anotarLaSesionDelPedido } from './sesion-de-la-solicitud';
import { extraerBearer, TokensService } from './tokens.service';

/** Actor autenticado. Sale siempre del token verificado + la base, nunca del cliente (07:883-897). */
export interface ActorAutenticado {
  readonly identidadId: string;
  readonly sesionId: string;
  readonly momentoDeAutenticacion: Date;
  readonly expiraEn: Date;
  /**
   * UF-11 (DL-169): el segundo factor del profesional en esta sesión, leído de la base en este pedido. Sin perfil
   * profesional, NO_REQUERIDO. Lo profesional lo pregunta con `puedeActuarComoProfesional` (sesion-de-la-solicitud.ts).
   */
  readonly segundoFactor: EstadoDelSegundoFactorDelProfesional;
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
        clase: true,
        // UF-11: el segundo factor de esta sesión y lo que lo decide (perfil profesional y autenticador activo).
        segundoFactor: { select: { verificadoEn: true, metodo: true } },
        identidad: {
          select: {
            estadoOperativoDeCuenta: true,
            controlDeSesion: { select: { version: true } },
            perfilProfesional: { select: { id: true } },
            factoresTotp: { where: { estado: 'ACTIVO' }, select: { id: true } },
          },
        },
      },
    });
    if (!sesion || sesion.identidadId !== reclamos.sub) throw errores.sesionInvalida();
    if (sesion.estado !== 'ACTIVA') throw errores.sesionRevocada();
    // WP-ADMINISTRACION (DL-155): una sesión administrativa solo sirve en la consola de Administración (su propio guard).
    // Acá es una sesión que no vale: el administrador no opera como persona ni como profesional, ni lee datos de salud.
    if (sesion.clase !== 'PERSONAL') throw errores.sesionInvalida();
    if (sesion.expiraEn.getTime() <= Date.now()) throw errores.sesionExpirada();
    const versionVigente = sesion.identidad.controlDeSesion?.version;
    if (versionVigente !== reclamos.tv || sesion.versionDeControl !== reclamos.tv) throw errores.sesionRevocada();
    // INV-06-28 / REG-06-23: SUSPENDIDA y CERRADA no operan, aunque la sesión siga marcada ACTIVA.
    if (!cuentaPermiteOperar(sesion.identidad.estadoOperativoDeCuenta as EstadoOperativoDeCuenta)) throw errores.sesionRevocada();

    const segundoFactor = estadoDelSegundoFactorDelProfesional({
      esProfesional: sesion.identidad.perfilProfesional !== null,
      inicioDeLaSesion: sesion.momentoDeOcurrencia,
      verificadoEn: sesion.segundoFactor?.verificadoEn ?? null,
      metodo: sesion.segundoFactor?.metodo ? METODO_API[sesion.segundoFactor.metodo] : null,
      tieneAutenticadorActivo: sesion.identidad.factoresTotp.length > 0,
      ahora: new Date(),
    });
    req.actor = {
      identidadId: sesion.identidadId,
      sesionId: reclamos.sid,
      momentoDeAutenticacion: sesion.momentoDeOcurrencia,
      expiraEn: sesion.expiraEn,
      segundoFactor,
    };
    // UF-11: lo profesional de este pedido se decide con esto (el PDP, las áreas y las listas del profesional).
    anotarLaSesionDelPedido({ identidadId: sesion.identidadId, sesionId: reclamos.sid, segundoFactor });
    return true;
  }
}

export function actorDe(req: SolicitudAutenticada): ActorAutenticado {
  if (!req.actor) throw errores.autenticacionRequerida();
  return req.actor;
}
