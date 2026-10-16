import { Inject, Injectable } from '@nestjs/common';
import type { DatosDelAvisoPush } from '@be/domain';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { AGENTE_DE_BE } from '../integraciones/proveedor-http';

/** Un aviso para un teléfono, tal como lo pide Expo Push. */
export interface MensajeExpo {
  readonly to: string;
  readonly title: string;
  readonly body: string;
  readonly data: DatosDelAvisoPush;
}

/** Lo que pasó con cada mensaje, en el mismo orden en que se mandaron. */
export type ResultadoDeMensaje =
  | { readonly estado: 'ENVIADO'; readonly ticket: string }
  | { readonly estado: 'RECHAZADO'; readonly detalle: string }
  | { readonly estado: 'SIN_RESPUESTA'; readonly detalle: string };

/** Expo admite hasta 100 mensajes por pedido. */
const POR_PEDIDO = 100;
/** Una respuesta de Expo para 100 mensajes cabe holgada en esto; algo más grande no es su respuesta. */
const TAMANO_MAXIMO = 256 * 1024;

/**
 * El adaptador de Expo Push (07 §23: «envío post-commit best-effort»; RF-062). Mismo patrón que los proveedores de
 * WP-08: presupuesto de tiempo, sin seguir redirecciones, la respuesta leída con tope y **sin reintentos acá**: el
 * despachador vuelve a intentar en la próxima pasada. Nunca registra el token ni el contenido.
 * - `desactivado` (sin `BE_AVISOS_PUSH=expo`): no sale nada; CI y desarrollo no dependen de un tercero.
 * - Con `EXPO_ACCESS_TOKEN`, el pedido va autenticado (la seguridad reforzada de los avisos de Expo).
 */
@Injectable()
export class CanalExpo {
  constructor(@Inject(ENTORNO) private readonly entorno: Entorno) {}

  get activo(): boolean {
    return this.entorno.avisos.canal === 'expo';
  }

  async enviar(mensajes: readonly MensajeExpo[]): Promise<ResultadoDeMensaje[]> {
    const resultados: ResultadoDeMensaje[] = [];
    for (let i = 0; i < mensajes.length; i += POR_PEDIDO) resultados.push(...(await this.enviarTanda(mensajes.slice(i, i + POR_PEDIDO))));
    return resultados;
  }

  private async enviarTanda(tanda: readonly MensajeExpo[]): Promise<ResultadoDeMensaje[]> {
    const todos = (r: ResultadoDeMensaje): ResultadoDeMensaje[] => tanda.map(() => r);
    const { expoUrl, expoToken, presupuestoMs } = this.entorno.avisos;
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), presupuestoMs);
    try {
      const encabezados: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': AGENTE_DE_BE };
      if (expoToken) encabezados.Authorization = `Bearer ${expoToken}`;
      // Sin `channelId`: Expo usa el canal «default» de Android y lo crea si no existe.
      const cuerpo = tanda.map((m) => ({ to: m.to, title: m.title, body: m.body, data: m.data, sound: 'default', priority: 'high' }));
      const r = await fetch(`${expoUrl}/--/api/v2/push/send`, { method: 'POST', headers: encabezados, body: JSON.stringify(cuerpo), signal: controlador.signal, redirect: 'manual' });
      const texto = await leerConTope(r);
      if (r.status === 429 || r.status >= 500) return todos({ estado: 'SIN_RESPUESTA', detalle: `HTTP ${r.status}` });
      if (r.status !== 200) return todos({ estado: 'RECHAZADO', detalle: `HTTP ${r.status}` });
      const datos = leerTickets(texto, tanda.length);
      return datos ?? todos({ estado: 'SIN_RESPUESTA', detalle: 'respuesta no reconocida' });
    } catch (e) {
      // Timeout, red caída o una respuesta desmedida: para quien manda es lo mismo, el canal no respondió.
      return todos({ estado: 'SIN_RESPUESTA', detalle: e instanceof Error ? e.name.slice(0, 60) : 'desconocido' });
    } finally {
      clearTimeout(temporizador);
    }
  }
}

async function leerConTope(r: Response): Promise<string> {
  if (!r.body) return '';
  const lector = r.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > TAMANO_MAXIMO) {
      await lector.cancel();
      throw new Error('RespuestaDemasiadoGrande');
    }
    partes.push(value);
  }
  return Buffer.concat(partes).toString('utf8');
}

/** Los tickets de Expo (`{ data: [{ status: 'ok', id } | { status: 'error', details: { error } }] }`), o `null` si no son eso. */
export function leerTickets(texto: string, cantidad: number): ResultadoDeMensaje[] | null {
  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch {
    return null;
  }
  const data = (json as { data?: unknown } | null)?.data;
  if (!Array.isArray(data) || data.length !== cantidad) return null;
  return data.map((t: unknown): ResultadoDeMensaje => {
    const ticket = t as { status?: unknown; id?: unknown; details?: { error?: unknown } } | null;
    if (ticket?.status === 'ok' && typeof ticket.id === 'string') return { estado: 'ENVIADO', ticket: ticket.id.slice(0, 200) };
    const codigo = typeof ticket?.details?.error === 'string' ? ticket.details.error : 'error';
    return { estado: 'RECHAZADO', detalle: codigo.slice(0, 200) };
  });
}
