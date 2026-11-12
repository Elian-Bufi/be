import { Inject, Injectable, Logger } from '@nestjs/common';
import type { CorreoConfigurado, Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { AGENTE_DE_BE } from '../integraciones/proveedor-http';

/** Un correo de BE: a quién, con qué asunto y qué texto (texto plano). */
export interface MensajeDeCorreo {
  readonly para: string;
  readonly asunto: string;
  readonly texto: string;
}

export type ResultadoDelCorreo =
  | { readonly estado: 'ENVIADO' }
  | { readonly estado: 'DESACTIVADO' }
  | { readonly estado: 'RECHAZADO'; readonly detalle: string }
  | { readonly estado: 'SIN_RESPUESTA'; readonly detalle: string };

/** El nombre con que firma BE, delante del remitente. */
export const NOMBRE_DEL_REMITENTE = 'BE';

/** Una respuesta de un proveedor cabe holgada en esto; algo más grande no es su respuesta. */
const TAMANO_MAXIMO = 64 * 1024;

/**
 * El pedido HTTP de cada proveedor para un mensaje: la ruta, los encabezados (con la clave) y el cuerpo. Puro, para probar
 * la forma sin red. Los dos proveedores reciben JSON por HTTPS y autentican con una clave en un encabezado:
 * - **Brevo** (`POST /v3/smtp/email`, encabezado `api-key`): `sender`, `to`, `subject` y `textContent`; responde 201.
 * - **Postmark** (`POST /email`, encabezado `X-Postmark-Server-Token`): `From`, `To`, `Subject`, `TextBody` y el flujo
 *   transaccional `outbound`; responde 200.
 */
export function pedidoAlProveedor(c: CorreoConfigurado, m: MensajeDeCorreo): { readonly url: string; readonly encabezados: Readonly<Record<string, string>>; readonly cuerpo: string } {
  const comunes = { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': AGENTE_DE_BE };
  switch (c.proveedor) {
    case 'brevo':
      return {
        url: `${c.url}/v3/smtp/email`,
        encabezados: { ...comunes, 'api-key': c.clave },
        cuerpo: JSON.stringify({ sender: { name: NOMBRE_DEL_REMITENTE, email: c.remitente }, to: [{ email: m.para }], subject: m.asunto, textContent: m.texto }),
      };
    case 'postmark':
      return {
        url: `${c.url}/email`,
        encabezados: { ...comunes, 'X-Postmark-Server-Token': c.clave },
        cuerpo: JSON.stringify({ From: `${NOMBRE_DEL_REMITENTE} <${c.remitente}>`, To: m.para, Subject: m.asunto, TextBody: m.texto, MessageStream: 'outbound' }),
      };
  }
}

/** Qué quiere decir el status de cada proveedor: aceptado, rechazado (no se reintenta) o sin respuesta. */
export function resultadoDelStatus(c: Pick<CorreoConfigurado, 'proveedor'>, status: number): ResultadoDelCorreo {
  const aceptado = c.proveedor === 'brevo' ? status === 201 || status === 202 : status === 200;
  if (aceptado) return { estado: 'ENVIADO' };
  if (status === 429 || status >= 500) return { estado: 'SIN_RESPUESTA', detalle: `HTTP ${status}` };
  return { estado: 'RECHAZADO', detalle: `HTTP ${status}` };
}

/**
 * UF-03 de WP-USO-FINAL (DL-169; UF-D9): el correo de BE, para los códigos de recuperación del acceso. El proveedor lo
 * elige Dirección (con DPA y un remitente de un dominio propio, 08 §34); sin configurarlo, `activo` es falso, no sale
 * nada y rige la recuperación asistida. Mismo patrón que los proveedores de WP-08 y el canal de Expo: presupuesto de
 * tiempo, sin seguir redirecciones, la respuesta leída con tope y sin reintentos. **Nunca registra el destinatario, el
 * asunto ni el texto** (llevan el código): solo el resultado.
 */
@Injectable()
export class CorreoService {
  private readonly registro = new Logger('Correo');
  /** fetch de la plataforma (reemplazable en pruebas). */
  hacerFetch: typeof fetch = (...args) => fetch(...args);

  constructor(@Inject(ENTORNO) private readonly entorno: Entorno) {}

  get activo(): boolean {
    return this.entorno.correo !== null;
  }

  async enviar(m: MensajeDeCorreo): Promise<ResultadoDelCorreo> {
    const c = this.entorno.correo;
    if (!c) return { estado: 'DESACTIVADO' };
    const pedido = pedidoAlProveedor(c, m);
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), c.presupuestoMs);
    try {
      const r = await this.hacerFetch(pedido.url, { method: 'POST', headers: pedido.encabezados, body: pedido.cuerpo, signal: controlador.signal, redirect: 'manual' });
      await leerConTope(r);
      return resultadoDelStatus(c, r.status);
    } catch (e) {
      // Timeout, red caída o una respuesta desmedida: para quien manda es lo mismo, el proveedor no respondió.
      return { estado: 'SIN_RESPUESTA', detalle: e instanceof Error ? e.name.slice(0, 60) : 'desconocido' };
    } finally {
      clearTimeout(temporizador);
    }
  }

  /**
   * Manda sin esperar, después de confirmar la transacción: la respuesta del pedido (y su tiempo) no depende de que haya un
   * correo que mandar ni de cuánto tarde el proveedor (TEST-UF-007). Si no sale, queda en el registro de la API, sin el
   * destinatario ni el contenido; la persona puede pedir otro código.
   */
  enviarSinEsperar(m: MensajeDeCorreo, operacion: string, requestId: string | null): void {
    void this.enviar(m).then((r) => {
      if (r.estado === 'RECHAZADO' || r.estado === 'SIN_RESPUESTA') this.registro.warn(`${operacion}: el correo no salió (${r.estado}, ${r.detalle}; requestId ${requestId ?? '-'})`);
    });
  }
}

async function leerConTope(r: Response): Promise<void> {
  if (!r.body) return;
  const lector = r.body.getReader();
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) return;
    total += value.byteLength;
    if (total > TAMANO_MAXIMO) {
      await lector.cancel();
      throw new Error('RespuestaDemasiadoGrande');
    }
  }
}
