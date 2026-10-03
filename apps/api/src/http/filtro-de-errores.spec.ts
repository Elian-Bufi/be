import type { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { faseDeP2028, FiltroDeErrores } from './filtro-de-errores';

/**
 * P2028 · el 503 deja en el log técnico su código y su fase, nunca el mensaje. Antes quedaba solo el código, y un 503
 * intermitente bajo carga no se podía diagnosticar (DEFENSA/WP-06.md §5.5; EVIDENCIA/P2028).
 */
const p2028 = (mensaje: string) => new Prisma.PrismaClientKnownRequestError(mensaje, { code: 'P2028', clientVersion: 'prueba' });
const INICIO = 'Transaction API error: Unable to start a transaction in the given time.';
const VENCIDA =
  'Transaction already closed: A query cannot be executed on an expired transaction. The timeout for this transaction was 5000 ms, however 5123 ms passed since the start of the transaction.';

function responder(filtro: FiltroDeErrores, excepcion: unknown): { status: number; cuerpo: { error: { code: string } } } {
  const res = { status: 0, cuerpo: undefined as unknown as { error: { code: string } } };
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({
        status(n: number) {
          res.status = n;
          return this;
        },
        json(b: { error: { code: string } }) {
          res.cuerpo = b;
        },
      }),
      getRequest: () => ({ requestId: 'pedido-de-prueba' }),
    }),
  } as unknown as ArgumentsHost;
  filtro.catch(excepcion, host);
  return { status: res.status, cuerpo: res.cuerpo };
}

describe('P2028 · el log técnico dice la fase', () => {
  it('distingue no conseguir una conexión a tiempo de una transacción vencida', () => {
    expect(faseDeP2028(p2028(INICIO))).toBe('inicio');
    expect(faseDeP2028(p2028(VENCIDA))).toBe('vencida');
    expect(faseDeP2028(p2028('Algo distinto.'))).toBe('otra');
    expect(faseDeP2028('no es un error')).toBe('otra');
  });

  it('el 503 registra el código y la fase, y nunca el mensaje de Prisma', () => {
    const filtro = new FiltroDeErrores();
    const lineas: string[] = [];
    filtro.log = (l) => lineas.push(l);
    const r = responder(filtro, p2028(INICIO));
    expect(r.status).toBe(503);
    expect(r.cuerpo.error.code).toBe('DB_UNAVAILABLE');
    expect(lineas).toHaveLength(1);
    expect(JSON.parse(lineas[0]!)).toEqual({ nivel: 'warn', evento: 'base_no_disponible', tipo: 'PrismaClientKnownRequestError', codigo: 'P2028', fase: 'inicio', requestId: 'pedido-de-prueba' });
    expect(lineas[0]).not.toContain('Unable to start');
  });

  it('otro código de base no disponible no lleva fase', () => {
    const filtro = new FiltroDeErrores();
    const lineas: string[] = [];
    filtro.log = (l) => lineas.push(l);
    responder(filtro, new Prisma.PrismaClientKnownRequestError('sin conexión', { code: 'P1001', clientVersion: 'prueba' }));
    expect(JSON.parse(lineas[0]!)).not.toHaveProperty('fase');
  });
});
