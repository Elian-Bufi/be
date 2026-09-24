import { createHash } from 'node:crypto';

/**
 * La consulta a un proveedor externo (WP-08 D-E), común a Open Food Facts y wger: «patrón interno común, no un payload
 * público artificialmente genérico» (09v12 §8).
 * - Presupuesto de tiempo con AbortController y **ningún reintento** dentro de la request del profesional.
 * - Timeout, error de red, 5xx, 429 o una respuesta desmedida → `ProveedorNoDisponible`: el servicio responde 503 con el
 *   catálogo propio y la carga manual disponibles, y nunca inventa datos (09v12:218-229).
 * - Lo recibido se identifica por su SHA-256 tal cual llegó (D-C): el cuerpo crudo no se guarda.
 */
export class ProveedorNoDisponible extends Error {
  constructor(motivo: string) {
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
const TAMANO_MAXIMO = 2 * 1024 * 1024;

export async function consultarProveedor(url: string, presupuestoMs: number): Promise<RespuestaDelProveedor> {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), presupuestoMs);
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': AGENTE_DE_BE }, signal: controlador.signal });
    if (r.status >= 500 || r.status === 429) throw new ProveedorNoDisponible(`status ${r.status}`);
    const cuerpo = Buffer.from(await r.arrayBuffer());
    if (cuerpo.length > TAMANO_MAXIMO) throw new ProveedorNoDisponible('respuesta demasiado grande');
    return { status: r.status, cuerpo, url, huella: createHash('sha256').update(cuerpo).digest('hex'), recibidoEn: new Date() };
  } catch (e) {
    if (e instanceof ProveedorNoDisponible) throw e;
    // Timeout (AbortError) o red caída: para quien pregunta es lo mismo, el proveedor no respondió.
    throw new ProveedorNoDisponible(e instanceof Error ? e.name : 'desconocido');
  } finally {
    clearTimeout(temporizador);
  }
}

/** El cuerpo como JSON, o `null` si no lo es: una respuesta ilegible del proveedor no se interpreta. */
export function comoJson(cuerpo: Buffer): unknown {
  try {
    return JSON.parse(cuerpo.toString('utf8'));
  } catch {
    return null;
  }
}
