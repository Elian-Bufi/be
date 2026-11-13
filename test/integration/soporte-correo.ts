/**
 * Un proveedor de correo falso local (la API de Postmark, contra 127.0.0.1) para las pruebas que miran lo que BE manda por
 * correo: la recuperación del acceso (UF-03, DL-169) y el aviso de cada cambio en cómo se entra (DL-172 D-11). Ninguna
 * prueba manda un correo de verdad ni depende de un tercero.
 */
import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { CorreoConfigurado } from '../../apps/api/src/config/entorno';

/** Un proveedor de correo falso (la API de Postmark): guarda cada mensaje y responde 200. */
export interface CorreoFalso {
  readonly config: CorreoConfigurado;
  readonly recibidos: { readonly para: string; readonly asunto: string; readonly texto: string; readonly clave: string | undefined }[];
  /**
   * Espera hasta que hayan llegado `cantidad` correos para `para` (uno, si no se dice) y devuelve el último de ellos, sin
   * pausas fijas: cada llegada despierta la espera.
   */
  esperar(para: string, cantidad?: number): Promise<{ readonly texto: string; readonly asunto: string }>;
  cerrar(): Promise<void>;
}

export async function levantarCorreoFalso(): Promise<CorreoFalso> {
  const recibidos: CorreoFalso['recibidos'] = [];
  const esperando: (() => void)[] = [];
  const servidor: Server = createServer((req, res) => {
    let cuerpo = '';
    req.on('data', (c: Buffer) => (cuerpo += c.toString('utf8')));
    req.on('end', () => {
      const m = JSON.parse(cuerpo) as { To: string; Subject: string; TextBody: string };
      recibidos.push({ para: m.To, asunto: m.Subject, texto: m.TextBody, clave: req.headers['x-postmark-server-token'] as string | undefined });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ MessageID: randomUUID(), ErrorCode: 0 }));
      for (const despertar of esperando.splice(0)) despertar();
    });
  });
  await new Promise<void>((r) => servidor.listen(0, '127.0.0.1', r));
  const { port } = servidor.address() as AddressInfo;
  return {
    config: { proveedor: 'postmark', clave: 'clave-sintetica-del-proveedor-uf03', remitente: 'no-responder@example.invalid', url: `http://127.0.0.1:${port}`, presupuestoMs: 5000 },
    recibidos,
    async esperar(para, cantidad = 1) {
      const limite = Date.now() + 10_000;
      for (;;) {
        const llegado = recibidos.filter((r) => r.para === para)[cantidad - 1];
        if (llegado) return llegado;
        if (Date.now() > limite) throw new Error(`no llegó el correo para ${para}`);
        await new Promise<void>((r) => {
          esperando.push(r);
          setTimeout(r, 500).unref();
        });
      }
    },
    cerrar: () => new Promise((r) => servidor.close(() => r())),
  };
}
