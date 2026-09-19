import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { errores } from '../http/errores';
import { actorDe, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { PdpService, type DecisionesRegistradas } from './pdp.service';

export interface DeclaracionDeOperacionProtegida {
  /** ID de la operación del 09 (p. ej. API-DSH-03): queda en cada decisión registrada. */
  readonly operacion: string;
  /** Parámetro de ruta con el identificador del titular de los datos. */
  readonly parametroDelTitular: string;
}

const METADATO = 'be:operacion-protegida';

/** Declara una operación protegida: el PDP decide antes del controlador (04 RF-021: «en cada operación protegida»). */
export const OperacionProtegida = (declaracion: DeclaracionDeOperacionProtegida) => SetMetadata(METADATO, declaracion);

export type SolicitudAutorizada = SolicitudAutenticada & SolicitudConContexto & { decisiones?: DecisionesRegistradas };

/**
 * Guard del PDP. Va después de `SesionGuard`, que ya autenticó y verificó la cuenta del actor.
 * - Invoca `PdpService`: una lectura, una decisión por alcance y el registro de todas en la misma transacción.
 * - Si ningún alcance queda permitido, responde 404 idéntico al de un titular inexistente (09:207, 09:226; UC-I02 E05).
 * - Si alguno queda permitido, deja las decisiones en la request. El controlador solo muestra lo que el PDP permitió,
 *   con los hechos que el PDP leyó: no vuelve a decidir.
 * El cliente no aporta nada a la decisión (09 §20.2.2): ni rol, ni capacidades, ni alcance.
 */
@Injectable()
export class PdpGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly pdp: PdpService) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const declaracion = this.reflector.get<DeclaracionDeOperacionProtegida | undefined>(METADATO, contexto.getHandler());
    // Un handler protegido sin declaración es un error de programación: se deniega, nunca se abre (08 §27: deny by default).
    if (!declaracion) throw errores.recursoNoEncontrado();
    const req = contexto.switchToHttp().getRequest<SolicitudAutorizada>();
    const actor = actorDe(req);
    const titular = String((req.params as Record<string, unknown>)[declaracion.parametroDelTitular] ?? '');
    const decisiones = await this.pdp.decidirPorAlcance(declaracion.operacion, actor.identidadId, titular, contextoDe(req));
    if (!decisiones.algunaPermitida) throw errores.recursoNoEncontrado();
    req.decisiones = decisiones;
    return true;
  }
}

export function decisionesDe(req: SolicitudAutorizada): DecisionesRegistradas {
  // Sin decisiones no hay acceso: el guard no corrió o denegó.
  if (!req.decisiones) throw errores.recursoNoEncontrado();
  return req.decisiones;
}
