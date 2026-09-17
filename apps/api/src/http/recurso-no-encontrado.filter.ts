import { ArgumentsHost, Catch, ExceptionFilter, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';

/**
 * 09 §3.2 — ruta inexistente responde el ErrorEnvelope `404 RESOURCE_NOT_FOUND`, sin eco de la ruta
 * pedida ni formato propio del framework. Base de la denegación uniforme (08 §48).
 */
@Catch(NotFoundException)
export class RecursoNoEncontradoFilter implements ExceptionFilter {
  catch(_excepcion: NotFoundException, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(404)
      .json({ error: { code: 'RESOURCE_NOT_FOUND', message: 'Recurso no encontrado.' } });
  }
}
