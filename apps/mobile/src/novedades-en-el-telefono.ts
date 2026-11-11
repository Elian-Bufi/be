/**
 * APK · Novedades (WP-NOVEDADES-Y-AVISOS, DL-133): la lógica pura del centro, sin React Native, para que
 * `novedades-en-el-telefono.test.ts` la pruebe sin teléfono. La pantalla (`pantallas/novedades.tsx`) solo dibuja.
 *
 * - **A qué pantalla lleva cada novedad** (`rutaDeNovedad`): la vista la decide BE (`open.view`) y la pantalla de destino
 *   vuelve a pedir el acceso (INV-06-33). Una vista que esta APK no conoce no lleva a ningún lado: la novedad queda leída
 *   en el centro, con su título y su texto, que ya dicen qué pasó. Así lee la 0.21 una vista nueva, como `MY_HABITS`.
 * - **Cuál se destaca** (DL-165, ronda 2.1; D-17 nueva): la que BE marca como importante por su tipo
 *   (`esNovedadImportante`), hoy el pedido de un profesional para ver los hábitos. Se dice con la palabra «Importante»,
 *   también al lector de pantalla, no solo con el color.
 */
import { COPY_NOVEDADES, esNovedadImportante, type Novedad } from '@be/domain';
import type { Ruta } from './navegacion';

/** La pantalla de la APK que resuelve una novedad, o `null` si se queda en Novedades. */
export function rutaDeNovedad(n: Pick<Novedad, 'open'>): Ruta | null {
  switch (n.open.view) {
    case 'NUTRITION':
      return { nombre: 'hoy' };
    case 'TRAINING':
      return { nombre: 'entrenamiento' };
    case 'RELATIONSHIPS':
      return { nombre: 'vinculos' };
    // REV-A (DL-134): la novedad de una revisión abre esa revisión, completa.
    case 'NUTRITION_REVIEW':
      return n.open.referenceId ? { nombre: 'revision', area: 'NUTRICION', id: n.open.referenceId } : { nombre: 'revisiones', area: 'NUTRICION' };
    case 'TRAINING_REVIEW':
      return n.open.referenceId ? { nombre: 'revision', area: 'ENTRENAMIENTO', id: n.open.referenceId } : { nombre: 'revisiones', area: 'ENTRENAMIENTO' };
    // DL-164: el profesional cargó algo para que la persona lo confirme (`FORM_PROPOSAL_LOADED`). Abre la bandeja de
    // formularios, donde lo que espera está primero, en «Para confirmar»; la solicitud se abre desde ahí, con su sesión.
    case 'FORMS':
      return { nombre: 'mis-solicitudes' };
    // DL-165, ronda 2.1: un profesional pide ver los hábitos. «Mis hábitos» muestra el pedido arriba, con las dos respuestas.
    case 'MY_HABITS':
      return { nombre: 'mis-habitos' };
    default:
      return null;
  }
}

/** Si la novedad se destaca, y con qué palabra: la insignia la dice y el lector de pantalla la lee primero. */
export const insigniaDeImportancia = (n: Pick<Novedad, 'kind'>): string | null => (esNovedadImportante(n.kind) ? COPY_NOVEDADES.importante : null);

/** Lo que lee TalkBack de una novedad: si está sin leer, si es importante, el título, el texto y la fecha. */
export function etiquetaDeNovedad(n: Pick<Novedad, 'kind' | 'readAt' | 'title' | 'body'>, fecha: string): string {
  const importante = insigniaDeImportancia(n);
  return `${n.readAt ? '' : `${COPY_NOVEDADES.noLeida}. `}${importante ? `${importante}. ` : ''}${n.title}. ${n.body} ${fecha}`;
}
