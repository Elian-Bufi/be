import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { contextoDe, type SolicitudConContexto } from '../http/contexto';
import { errores } from '../http/errores';
import { LimitadorService } from '../plataforma/limitador.service';
import { actorDe, type SolicitudAutenticada } from '../sesion/sesion.guard';
import { PdpService, type DecisionesRegistradas } from './pdp.service';

export interface DeclaracionDeOperacionProtegida {
  /** ID de la operación del 09 (p. ej. API-DSH-03): queda en cada decisión registrada. */
  readonly operacion: string;
  /** Parámetro de ruta con el identificador del titular de los datos. */
  readonly parametroDelTitular: string;
  /**
   * Validación de la query, ANTES del PDP: schema y payload van primero (09 §3, 09:221). El 400 no depende del recurso,
   * así que no es un oráculo, y una consulta inválida no deja decisiones registradas.
   */
  readonly validarConsulta?: (query: Record<string, unknown>) => unknown;
}

const METADATO = 'be:operacion-protegida';

/** Declara una operación protegida: el PDP decide antes del controlador (04 RF-021: «en cada operación protegida»). */
export const OperacionProtegida = (declaracion: DeclaracionDeOperacionProtegida) => SetMetadata(METADATO, declaracion);

export type SolicitudAutorizada = SolicitudAutenticada & SolicitudConContexto & { decisiones?: DecisionesRegistradas; consultaValidada?: unknown };

/**
 * Guard del PDP. Va después de `SesionGuard`, que ya autenticó y verificó la cuenta del actor.
 * - Invoca `PdpService`: una lectura, una decisión por alcance y el registro de todas en la misma transacción.
 * - Si ningún alcance queda permitido, responde 404 idéntico al de un titular inexistente (09:207, 09:226; UC-I02 E05).
 * - Si alguno queda permitido, deja las decisiones en la request. El controlador solo muestra lo que el PDP permitió,
 *   con los hechos que el PDP leyó: no vuelve a decidir.
 * El cliente no aporta nada a la decisión (09 §20.2.2): ni rol, ni capacidades, ni alcance.
 * Antes de decidir: la query validada (400) y el límite de consultas del actor (429). Ninguno depende del titular.
 */
@Injectable()
export class PdpGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly pdp: PdpService,
    private readonly limitador: LimitadorService,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const declaracion = this.reflector.get<DeclaracionDeOperacionProtegida | undefined>(METADATO, contexto.getHandler());
    // Un handler protegido sin declaración es un error de programación: se deniega, nunca se abre (08 §27: deny by default).
    if (!declaracion) throw errores.recursoNoEncontrado();
    const req = contexto.switchToHttp().getRequest<SolicitudAutorizada>();
    const actor = actorDe(req);
    if (declaracion.validarConsulta) req.consultaValidada = declaracion.validarConsulta((req.query ?? {}) as Record<string, unknown>);
    // Por actor, desde cualquier red.
    this.limitador.consumir('consultaProtegida', null, actor.identidadId);
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
