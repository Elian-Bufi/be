import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const REQUEST_ID_ACEPTABLE = /^[A-Za-z0-9._-]{8,128}$/;

/**
 * X-Request-Id en toda respuesta (09 CAND-09-T17) y una línea de log JSON por request (07 §41).
 * Se registra la ruta parametrizada, nunca la URL concreta, ni cuerpos, IP o user-agent (08 §30).
 */
export function requestId(log: (linea: string) => void = (l) => process.stdout.write(`${l}\n`)) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const entrante = req.header('x-request-id');
    const id = entrante && REQUEST_ID_ACEPTABLE.test(entrante) ? entrante : randomUUID();
    res.setHeader('X-Request-Id', id);
    const inicio = process.hrtime.bigint();

    res.on('finish', () => {
      const ruta = req.route?.path ? `${req.baseUrl}${String(req.route.path)}` : 'SIN_RUTA';
      log(
        JSON.stringify({
          nivel: 'info',
          requestId: id,
          metodo: req.method,
          ruta,
          status: res.statusCode,
          duracionMs: Number((process.hrtime.bigint() - inicio) / 1_000_000n),
        }),
      );
    });
    next();
  };
}
