import type { IncomingMessage } from 'node:http';

/**
 * El cuerpo crudo de API-MED-02, leído por esta ruta y solo por ella: el resto de la API sigue con el límite de 16 kB
 * del parser JSON (bootstrap.ts). Lo que pasa del límite no se guarda en memoria, pero se lee hasta el final (se
 * descarta): así la conexión queda sana y el cliente recibe el 422 del contrato en lugar de un corte.
 */
export function leerCuerpoCrudo(req: IncomingMessage, limite: number): Promise<{ readonly bytes: Buffer } | { readonly excedido: true }> {
  return new Promise((resolver, rechazar) => {
    // Si otro parser ya lo consumió, no hay nada que leer (y esperar el final colgaría la request).
    if (req.readableEnded) {
      resolver({ bytes: Buffer.alloc(0) });
      return;
    }
    const partes: Buffer[] = [];
    let total = 0;
    let excedido = false;
    req.on('data', (parte: Buffer) => {
      total += parte.length;
      if (excedido) return;
      if (total > limite) {
        excedido = true;
        partes.length = 0;
        return;
      }
      partes.push(parte);
    });
    req.on('end', () => resolver(excedido ? { excedido: true } : { bytes: Buffer.concat(partes) }));
    req.on('error', rechazar);
  });
}
