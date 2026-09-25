import { createHash } from 'node:crypto';
import type { ProveedorExterno } from '@be/domain';

/**
 * La consulta a un proveedor externo (WP-08 D-E), común a Open Food Facts y wger: «patrón interno común, no un payload
 * público artificialmente genérico» (09v12 §8).
 * - Presupuesto de tiempo con AbortController y **ningún reintento** dentro de la request del profesional.
 * - Timeout, error de red, 5xx, 429, una redirección o una respuesta desmedida → `ProveedorNoDisponible`: el servicio
 *   responde 503 con el catálogo propio y la carga manual disponibles, y nunca inventa datos (09v12:218-229).
 * - El cuerpo se lee contando bytes y se corta al pasar el tope: la API no aloca lo que un proveedor quiera mandar.
 * - Lo recibido se identifica por su SHA-256 tal cual llegó (D-C): el cuerpo crudo no se guarda.
 */
export class ProveedorNoDisponible extends Error {
  constructor(readonly motivo: string) {
    super(`proveedor no disponible: ${motivo}`);
  }
}

export interface RespuestaDelProveedor {
  readonly status: number;
  readonly cuerpo: Buffer;
  readonly url: string;
  /** SHA-256 del cuerpo tal como llegó. */
  readonly huella: string;
  /** Cuándo llegó la respuesta. */
  readonly recibidoEn: Date;
}

/** Cómo se presenta BE ante los proveedores: nombre y dónde encontrarlo. Sin datos de ninguna persona. */
export const AGENTE_DE_BE = 'BE/1.0 (trabajo final de Analista de Sistemas; https://github.com/Elian-Bufi/be)';

/** Ningún elemento de estos proveedores pesa más que esto; algo más grande no es la respuesta que se pidió. */
export const TAMANO_MAXIMO = 2 * 1024 * 1024;

export async function consultarProveedor(url: string, presupuestoMs: number): Promise<RespuestaDelProveedor> {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), presupuestoMs);
  try {
    // Sin seguir redirecciones: una redirección puede llevar la consulta a otro destino que el configurado.
    const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': AGENTE_DE_BE }, signal: controlador.signal, redirect: 'manual' });
    if (r.status >= 500 || r.status === 429) return await descartar(r, `status ${r.status}`);
    if (r.type === 'opaqueredirect' || (r.status >= 300 && r.status < 400)) return await descartar(r, `redirección ${r.status}`);
    const declarado = Number(r.headers.get('content-length'));
    if (Number.isFinite(declarado) && declarado > TAMANO_MAXIMO) return await descartar(r, 'respuesta demasiado grande');
    const cuerpo = await leerConTope(r);
    return { status: r.status, cuerpo, url, huella: createHash('sha256').update(cuerpo).digest('hex'), recibidoEn: new Date() };
  } catch (e) {
    if (e instanceof ProveedorNoDisponible) throw e;
    // Timeout (AbortError) o red caída: para quien pregunta es lo mismo, el proveedor no respondió.
    throw new ProveedorNoDisponible(e instanceof Error ? e.name : 'desconocido');
  } finally {
    clearTimeout(temporizador);
  }
}

/** El cuerpo, leído de a partes: si pasa el tope se cancela ahí, sin terminar de recibirlo (ya viene descomprimido). */
async function leerConTope(r: Response): Promise<Buffer> {
  if (!r.body) return Buffer.alloc(0);
  const lector = r.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > TAMANO_MAXIMO) {
      await lector.cancel().catch(() => undefined);
      throw new ProveedorNoDisponible('respuesta demasiado grande');
    }
    partes.push(value);
  }
  return Buffer.concat(partes);
}

/** Una respuesta que no se va a usar se cancela antes de salir: no queda el cuerpo pendiente en la conexión. */
async function descartar(r: Response, motivo: string): Promise<never> {
  await r.body?.cancel().catch(() => undefined);
  throw new ProveedorNoDisponible(motivo);
}

/** El cuerpo como JSON, o `null` si no lo es: una respuesta ilegible del proveedor no se interpreta. */
export function comoJson(cuerpo: Buffer): unknown {
  try {
    return JSON.parse(cuerpo.toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Un texto del proveedor como lo puede guardar BE: sin caracteres de control —PostgreSQL rechaza `\u0000` en JSONB—,
 * con los espacios normalizados y con un largo máximo. Vacío o no texto es `null`: no vino.
 */
export function textoDelProveedor(v: unknown, maximo = 200): string | null {
  if (typeof v !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const limpio = v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  return limpio === '' ? null : limpio.slice(0, maximo);
}

/**
 * Por qué no se pudo consultar, en el log técnico (07 §41): distingue un límite de tasa de un timeout. Sin el
 * identificador consultado ni la URL: solo el proveedor, el motivo y la request.
 */
export function registrarProveedorNoDisponible(
  proveedor: ProveedorExterno,
  e: ProveedorNoDisponible,
  requestId: string | null,
  log: (linea: string) => void = (l) => process.stdout.write(`${l}\n`),
): void {
  log(JSON.stringify({ nivel: 'warn', evento: 'proveedor_no_disponible', proveedor, motivo: e.motivo, requestId }));
}
