/**
 * Achicar la foto de una comida antes de subirla (DL-191 REC-03, en la app con DL-194, A32-05). Es la lógica pura, sin
 * React Native: el achique de verdad (`expo-image-manipulator`) se inyecta, y `scripts/imagen-de-medio.test.mjs` (§5)
 * la prueba sin teléfono.
 *
 * - **Una sola vez, al elegirla.** La foto que queda en la pantalla ya es la achicada: un reintento sube lo mismo, con la
 *   misma ruta y la misma clave (`pasoDeLaSubida` compara la foto por su `uri`).
 * - **El lado mayor a 1600 px, sin agrandar y sin cambiar la proporción**, en JPEG de calidad 0,85: la foto de una comida
 *   se sigue guardando en JPEG. Es la regla única del dominio de DL-191, la misma del website: `medidasAlAchicar`, con
 *   `LIMITES_DE_MEDIO.ladoAlAchicarEnElCliente` y `calidadAlAchicarEnElCliente` (A32-D12: la copia local se fue cuando
 *   DL-191 entró a main). El servidor igual valida y recodifica.
 * - **Tolerante.** Sin medidas, o si el teléfono no la pudo achicar, se sube la original, como hasta la 0.31: achicar
 *   ahorra datos, no es una condición para registrar.
 */
import { LIMITES_DE_MEDIO, medidasAlAchicar } from '@be/domain';
import type { ImagenDelSelector } from './borrador-de-comida-diferente';

/** El achique del teléfono: la foto en esas medidas, en JPEG con esa calidad. */
export type Achicador = (uri: string, medidas: { readonly ancho: number; readonly alto: number }, calidad: number) => Promise<{ readonly uri: string; readonly width: number; readonly height: number }>;

const positivo = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;

/**
 * La foto que se usa: la achicada, si hacía falta y se pudo; si no, la original. La achicada es un JPEG nuevo, sin el
 * nombre ni el peso del original (el peso se mide con los bytes, al subir).
 */
export async function fotoParaSubir(imagen: ImagenDelSelector, achicar: Achicador): Promise<ImagenDelSelector> {
  if (!positivo(imagen.width) || !positivo(imagen.height)) return imagen;
  const medidas = medidasAlAchicar(imagen.width, imagen.height);
  if (!medidas.achicar) return imagen;
  try {
    const r = await achicar(imagen.uri, { ancho: medidas.ancho, alto: medidas.alto }, LIMITES_DE_MEDIO.calidadAlAchicarEnElCliente);
    if (!r.uri || !positivo(r.width) || !positivo(r.height)) return imagen;
    return { uri: r.uri, mimeType: 'image/jpeg', fileName: null, fileSize: null, width: r.width, height: r.height };
  } catch {
    return imagen;
  }
}
