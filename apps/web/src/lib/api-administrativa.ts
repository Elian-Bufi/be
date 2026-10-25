/**
 * El cliente de la consola de Administración (WP-ADMINISTRACION, DL-155), con la misma base que el cliente común
 * (`BE_API_BASE_URL`, llamada directa con CORS; DL-030). La definición vive en @be/domain (`cliente-administrativo.ts`).
 */
import { crearClienteAdministrativo } from '@be/domain';

export const apiAdministrativa = crearClienteAdministrativo({ baseUrl: `${process.env.BE_API_BASE_URL ?? ''}/api/v1` });
