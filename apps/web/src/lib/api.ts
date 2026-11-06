/**
 * Cliente de la API para el website, superficie WEB. La definición del cliente es única y vive en @be/domain
 * (cliente-http.ts).
 * DL-030: en el build desplegado, BE_API_BASE_URL es el origen de la API y las llamadas van directo, con CORS, para que la
 * API vea la IP real (08 §12.2). Fuera del build de Render (next dev, CI, build local) puede quedar vacía: en `next dev`
 * /api/* se reescribe a la API local.
 */
import { CAPACIDAD_FORMULARIOS_FORMATO_3, crearClienteBe } from '@be/domain';

export type { Resultado } from '@be/domain';

// DL-165 (FR-08): el website lee y dibuja las versiones de formulario de formato 3; se despliega con la API.
export const api = crearClienteBe({ baseUrl: `${process.env.BE_API_BASE_URL ?? ''}/api/v1`, superficie: 'WEB', capacidades: [CAPACIDAD_FORMULARIOS_FORMATO_3] });

/** Una key por intento lógico; los reintentos del mismo intento la reusan (10-B10:430-438). */
export function nuevaClaveDeIdempotencia(): string {
  return `web-${crypto.randomUUID()}`;
}
