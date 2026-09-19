/**
 * Cliente de la API para el website: same-origin (el borde de Render reescribe /api/* hacia la API, 07 CAND-07-J C),
 * superficie WEB. La definición del cliente es única y vive en @be/domain (cliente-http.ts).
 */
import { crearClienteBe } from '@be/domain';

export type { Resultado } from '@be/domain';

export const api = crearClienteBe({ baseUrl: '/api/v1', superficie: 'WEB' });

/** Una key por intento lógico; los reintentos del mismo intento la reusan (10-B10:430-438). */
export function nuevaClaveDeIdempotencia(): string {
  return `web-${crypto.randomUUID()}`;
}
