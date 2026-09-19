import { HEADER_DE_SUPERFICIE, superficieDeclarada, type Procedencia, type Superficie } from '@be/domain';
import type { Request } from 'express';

/** Datos de la request que se registran como procedencia y evidencia técnica (08 §12.2, T-06-23). */
export interface ContextoDeSolicitud {
  readonly requestId: string | null;
  /** Momento en que BE recibió la confirmación: ocurrencia de los hechos del alta y del cierre (TEN-39). */
  readonly momentoDeRecepcion: Date;
  readonly superficie: Superficie | null;
  /** Evidencia técnica del acto (C3). Solo se guarda en actos A1/A2/A3, nunca en auditoría ni logs (08:658). */
  readonly direccionIp: string | null;
  readonly agenteDeUsuario: string | null;
}

export type SolicitudConContexto = Request & { requestId?: string; momentoDeRecepcion?: Date };

export function contextoDe(req: SolicitudConContexto): ContextoDeSolicitud {
  const ua = req.get('user-agent');
  return {
    requestId: req.requestId ?? null,
    momentoDeRecepcion: req.momentoDeRecepcion ?? new Date(),
    superficie: superficieDeclarada(req.get(HEADER_DE_SUPERFICIE)),
    direccionIp: req.ip ?? null,
    agenteDeUsuario: ua ? ua.slice(0, 256) : null,
  };
}

export function procedenciaDe(ctx: ContextoDeSolicitud, casoDeUso: string, operacion: string): Procedencia {
  return { fuente: 'PROPIA', casoDeUso, operacion, superficie: ctx.superficie, requestId: ctx.requestId };
}
