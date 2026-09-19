import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { esConflictoTransitorio } from '../prisma/concurrencia';
import { ErrorDeApi, errores } from './errores';

/** Códigos de Prisma que significan «base no disponible» (09v7 §4.6: 503 DB_UNAVAILABLE). */
const PRISMA_SIN_BASE = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);

/**
 * Filtro global: toda respuesta de error es un ErrorEnvelope (09 §3.2).
 * - ruta inexistente → 404 RESOURCE_NOT_FOUND sin eco de la ruta (09v7 T16);
 * - JSON mal formado o body demasiado grande → 400 INVALID_REQUEST;
 * - base caída o transacción que no se pudo abrir a tiempo → 503 DB_UNAVAILABLE;
 * - deadlock o falla de serialización → 409 RESOURCE_CONFLICT, «conflicto concurrente» (09 §3);
 * - cualquier otra cosa → 500 INTERNAL_ERROR sin detalles (DL-005).
 * El log técnico registra solo el tipo y el requestId: nunca el mensaje, que puede incluir datos (08 §30).
 */
@Catch()
export class FiltroDeErrores implements ExceptionFilter {
  /** Salida del log técnico; reemplazable en pruebas (propiedad, no parámetro: Nest inyecta el constructor). */
  log: (linea: string) => void = (l) => process.stderr.write(`${l}\n`);

  catch(excepcion: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    const req = http.getRequest<Request & { requestId?: string }>();
    const error = this.traducir(excepcion, req.requestId);
    const cuerpo: { error: { code: string; message: string; details?: Record<string, unknown> } } = {
      error: { code: error.code, message: error.mensajeSeguro },
    };
    if (error.details) cuerpo.error.details = error.details;
    res.status(error.status).json(cuerpo);
  }

  private traducir(excepcion: unknown, requestId: string | undefined): ErrorDeApi {
    if (excepcion instanceof ErrorDeApi) return excepcion;
    if (excepcion instanceof HttpException) {
      const status = excepcion.getStatus();
      if (status === 404) return errores.recursoNoEncontrado();
      if (status >= 400 && status < 500) return errores.solicitudInvalida();
    }
    // Errores de body-parser (JSON inválido, payload grande) llegan con `status`/`type`.
    const conStatus = excepcion as { status?: number; type?: string };
    if (typeof conStatus.status === 'number' && conStatus.status >= 400 && conStatus.status < 500) {
      return errores.solicitudInvalida();
    }
    if (
      excepcion instanceof Prisma.PrismaClientInitializationError ||
      (excepcion instanceof Prisma.PrismaClientKnownRequestError && PRISMA_SIN_BASE.has(excepcion.code))
    ) {
      return errores.baseNoDisponible();
    }
    // Deadlock o serialización que no pasó por conReintento: conflicto concurrente, no error interno (09 §3).
    if (esConflictoTransitorio(excepcion)) return errores.conflictoConcurrente();
    // P2028: no se pudo abrir o completar la transacción a tiempo (pool agotado): la base no está disponible ahora.
    if (excepcion instanceof Prisma.PrismaClientKnownRequestError && excepcion.code === 'P2028') return errores.baseNoDisponible();
    const tipo = excepcion instanceof Error ? excepcion.constructor.name : typeof excepcion;
    const codigo = excepcion instanceof Prisma.PrismaClientKnownRequestError ? excepcion.code : undefined;
    this.log(JSON.stringify({ nivel: 'error', evento: 'error_no_clasificado', tipo, codigo, requestId: requestId ?? null }));
    return errores.interno();
  }
}
