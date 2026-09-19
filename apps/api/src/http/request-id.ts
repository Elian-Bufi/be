import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * X-Request-Id en toda respuesta (09v7 T17: «Toda request recibe ID server-side»). El valor del cliente se ignora.
 * Una línea de log JSON por request (07 §41): ruta parametrizada, nunca la URL concreta, ni cuerpos, IP o
 * user-agent (08 §30). Sin query string: podría llevar datos.
 */
export function requestId(log: (linea: string) => void = (l) => process.stdout.write(`${l}\n`)) {
  return (req: Request & { requestId?: string; momentoDeRecepcion?: Date }, res: Response, next: NextFunction): void => {
    const id = randomUUID();
    req.requestId = id;
    req.momentoDeRecepcion = new Date();
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
