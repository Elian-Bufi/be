import { CorreoService, pedidoAlProveedor, resultadoDelStatus, type MensajeDeCorreo } from './correo.service';
import type { CorreoConfigurado, Entorno } from '../config/entorno';

/**
 * TEST-UF-007 (UF-03 de WP-USO-FINAL; DL-169; UF-D9): el adaptador del correo de BE. Cada proveedor recibe su pedido con
 * la clave en su encabezado y el código en el texto; sin proveedor no sale nada; el resultado no depende del cuerpo de la
 * respuesta. Sin red: el fetch se reemplaza.
 */
const MENSAJE: MensajeDeCorreo = { para: 'persona@example.invalid', asunto: 'Tu código', texto: 'Tu código es ABCDE-FGHJK.' };
const config = (proveedor: CorreoConfigurado['proveedor']): CorreoConfigurado => ({
  proveedor,
  clave: 'clave-sintetica-del-proveedor',
  remitente: 'no-responder@example.invalid',
  url: 'http://127.0.0.1:9',
  presupuestoMs: 2000,
});
const entorno = (correo: CorreoConfigurado | null) => ({ correo }) as unknown as Entorno;

describe('TEST-UF-007 · el correo de BE', () => {
  it('Brevo: POST /v3/smtp/email con la clave en api-key, el remitente y el código en el texto', () => {
    const p = pedidoAlProveedor(config('brevo'), MENSAJE);
    expect(p.url).toBe('http://127.0.0.1:9/v3/smtp/email');
    expect(p.encabezados['api-key']).toBe('clave-sintetica-del-proveedor');
    expect(JSON.parse(p.cuerpo)).toEqual({
      sender: { name: 'BE', email: 'no-responder@example.invalid' },
      to: [{ email: 'persona@example.invalid' }],
      subject: 'Tu código',
      textContent: 'Tu código es ABCDE-FGHJK.',
    });
  });

  it('Postmark: POST /email con la clave en X-Postmark-Server-Token y el flujo transaccional', () => {
    const p = pedidoAlProveedor(config('postmark'), MENSAJE);
    expect(p.url).toBe('http://127.0.0.1:9/email');
    expect(p.encabezados['X-Postmark-Server-Token']).toBe('clave-sintetica-del-proveedor');
    expect(JSON.parse(p.cuerpo)).toEqual({ From: 'BE <no-responder@example.invalid>', To: 'persona@example.invalid', Subject: 'Tu código', TextBody: 'Tu código es ABCDE-FGHJK.', MessageStream: 'outbound' });
  });

  it('el status de cada proveedor: aceptado, rechazado o sin respuesta (429 y 5xx)', () => {
    expect(resultadoDelStatus({ proveedor: 'brevo' }, 201)).toEqual({ estado: 'ENVIADO' });
    expect(resultadoDelStatus({ proveedor: 'postmark' }, 200)).toEqual({ estado: 'ENVIADO' });
    expect(resultadoDelStatus({ proveedor: 'postmark' }, 201)).toEqual({ estado: 'RECHAZADO', detalle: 'HTTP 201' });
    expect(resultadoDelStatus({ proveedor: 'brevo' }, 401)).toEqual({ estado: 'RECHAZADO', detalle: 'HTTP 401' });
    expect(resultadoDelStatus({ proveedor: 'brevo' }, 429)).toEqual({ estado: 'SIN_RESPUESTA', detalle: 'HTTP 429' });
    expect(resultadoDelStatus({ proveedor: 'postmark' }, 503)).toEqual({ estado: 'SIN_RESPUESTA', detalle: 'HTTP 503' });
  });

  it('sin proveedor no está activo y no sale nada; con proveedor manda el pedido armado, sin seguir redirecciones', async () => {
    const pedidos: { url: string; init: RequestInit }[] = [];
    const fetchFalso = (async (url: string, init: RequestInit) => {
      pedidos.push({ url, init });
      return new Response('{"messageId":"x"}', { status: 201 });
    }) as unknown as typeof fetch;

    const apagado = new CorreoService(entorno(null));
    apagado.hacerFetch = fetchFalso;
    expect(apagado.activo).toBe(false);
    expect(await apagado.enviar(MENSAJE)).toEqual({ estado: 'DESACTIVADO' });
    expect(pedidos).toHaveLength(0);

    const prendido = new CorreoService(entorno(config('brevo')));
    prendido.hacerFetch = fetchFalso;
    expect(prendido.activo).toBe(true);
    expect(await prendido.enviar(MENSAJE)).toEqual({ estado: 'ENVIADO' });
    expect(pedidos).toHaveLength(1);
    expect(pedidos[0]!.url).toBe('http://127.0.0.1:9/v3/smtp/email');
    expect(pedidos[0]!.init.method).toBe('POST');
    expect(pedidos[0]!.init.redirect).toBe('manual');
    expect((pedidos[0]!.init.headers as Record<string, string>)['api-key']).toBe('clave-sintetica-del-proveedor');
  });

  it('un proveedor que no responde es «sin respuesta», sin lanzar', async () => {
    const caido = new CorreoService(entorno(config('postmark')));
    caido.hacerFetch = (async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;
    expect(await caido.enviar(MENSAJE)).toEqual({ estado: 'SIN_RESPUESTA', detalle: 'TypeError' });
  });
});
