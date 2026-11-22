import { LIMITES_DE_MEDIO, TipoDeImagenSchema, type TipoDeImagen } from '@be/domain';
import { createHash } from 'node:crypto';
import sharp, { type Metadata, type OutputInfo, type Sharp } from 'sharp';
import { errores } from '../http/errores';

// Cada imagen es distinta: el caché de libvips no ahorra nada y retendría memoria.
sharp.cache(false);

const TIPO_DE_FORMATO: Readonly<Record<string, TipoDeImagen>> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

/** Una imagen recodificada: lo que se guarda, con sus medidas y su huella. */
export interface ImagenGuardable<T extends 'image/jpeg' | 'image/webp' = 'image/jpeg' | 'image/webp'> {
  readonly tipo: T;
  readonly bytes: number;
  readonly ancho: number;
  readonly alto: number;
  readonly sha256: string;
  readonly contenido: Buffer;
}

export interface ImagenProcesada {
  readonly original: { readonly tipo: TipoDeImagen; readonly bytes: number; readonly ancho: number; readonly alto: number; readonly sha256: string };
  /** Lo guardado: el JPEG de 1600 px, o la grande WebP de una imagen de receta (DL-191). */
  readonly procesada: ImagenGuardable;
  /** DL-191: la miniatura WebP, solo en la imagen de una receta. */
  readonly miniatura: ImagenGuardable<'image/webp'> | null;
}

/** Cómo se recodifica: en JPEG de 1600 px (lo de siempre) o en las dos variantes WebP de la imagen de una receta. */
export type FormaDeGuardar = 'JPEG' | 'VARIANTES_WEBP';

export const sha256 = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

/** El tipo de un `Content-Type` (sin parámetros, en minúsculas), si es uno de los admitidos. */
export function tipoAdmitido(contentType: string | undefined): TipoDeImagen | null {
  const tipo = (contentType ?? '').split(';')[0]!.trim().toLowerCase();
  const r = TipoDeImagenSchema.safeParse(tipo);
  return r.success ? r.data : null;
}

/**
 * DL-120 · validación y recodificación en el servidor (08 §21: EXIF depurado al ingerir).
 * 1. El tipo real sale de los bytes, no de lo declarado: otro formato (GIF, TIFF, HEIF…) es FILE_TYPE_NOT_ALLOWED; uno
 *    admitido pero distinto del declarado, o bytes que no son una imagen, FILE_CONTENT_INVALID.
 * 2. Medidas de 64 a 8000 px por lado y hasta 40 megapíxeles (`limitInputPixels`: una imagen mayor no se decodifica).
 * 3. Decodificación completa: una imagen truncada o con advertencias del decodificador no pasa.
 * 4. Se orienta según el EXIF, se aplana sobre blanco si tiene transparencia, se achica a 1600 px en el lado mayor sin
 *    agrandar y se guarda en JPEG de calidad 82. `sharp` no copia metadatos salvo que se le pida: EXIF, GPS, ICC y XMP
 *    no pasan.
 * 5. El SHA-256 de lo recibido identifica la subida (repetirla responde el mismo medio); el de lo guardado, el contenido.
 * 6. DL-191 (`VARIANTES_WEBP`, la imagen de una receta): en lugar del JPEG, dos WebP de calidad 78 y esfuerzo 6 desde lo
 *    recibido, la grande de 1200 px (lo guardado) y la miniatura de 400 px, sin agrandar ninguna. Las dos salen de la
 *    imagen original orientada, no una de la otra: la miniatura no hereda los artefactos de la grande.
 */
export async function procesarImagen(bytes: Buffer, tipoDeclarado: TipoDeImagen, forma: FormaDeGuardar = 'JPEG'): Promise<ImagenProcesada> {
  let metadatos: Metadata;
  try {
    metadatos = await sharp(bytes, { limitInputPixels: false }).metadata();
  } catch {
    throw errores.contenidoDeArchivoInvalido([{ code: 'NOT_AN_IMAGE', path: '(body)' }]);
  }
  const tipoReal = metadatos.format ? TIPO_DE_FORMATO[metadatos.format] : undefined;
  if (!tipoReal) throw errores.tipoDeArchivoNoAdmitido([{ code: 'FILE_TYPE_NOT_ALLOWED', path: '(body)' }]);
  if (tipoReal !== tipoDeclarado) throw errores.contenidoDeArchivoInvalido([{ code: 'CONTENT_DIFFERS_FROM_DECLARED_TYPE', path: '(body)' }]);
  const ancho = metadatos.width ?? 0;
  const alto = metadatos.height ?? 0;
  const { ladoMinimo, ladoMaximo, pixelesMaximos, ladoMaximoGuardado, calidadJpeg } = LIMITES_DE_MEDIO;
  if (ancho < ladoMinimo || alto < ladoMinimo || ancho > ladoMaximo || alto > ladoMaximo || ancho * alto > pixelesMaximos) {
    throw errores.contenidoDeArchivoInvalido([{ code: 'IMAGE_DIMENSIONS_OUT_OF_RANGE', path: '(body)' }]);
  }
  const original = { tipo: tipoReal, bytes: bytes.length, ancho, alto, sha256: sha256(bytes) };
  const base = () => {
    const imagen = sharp(bytes, { limitInputPixels: pixelesMaximos, failOn: 'warning' }).rotate();
    return metadatos.hasAlpha ? imagen.flatten({ background: '#ffffff' }) : imagen;
  };
  try {
    if (forma === 'VARIANTES_WEBP') {
      // Una después de la otra: dos decodificaciones a la vez de una imagen de 40 megapíxeles duplicarían la memoria.
      const grande = await webpDeLado(base(), LIMITES_DE_MEDIO.ladoDeLaGrande);
      const miniatura = await webpDeLado(base(), LIMITES_DE_MEDIO.ladoDeLaMiniatura);
      return { original, procesada: grande, miniatura };
    }
    const salida = await base()
      .resize({ width: ladoMaximoGuardado, height: ladoMaximoGuardado, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: calidadJpeg })
      .toBuffer({ resolveWithObject: true });
    return { original, procesada: guardable('image/jpeg', salida), miniatura: null };
  } catch {
    throw errores.contenidoDeArchivoInvalido([{ code: 'IMAGE_NOT_DECODABLE', path: '(body)' }]);
  }
}

function guardable<T extends 'image/jpeg' | 'image/webp'>(tipo: T, salida: { data: Buffer; info: OutputInfo }): ImagenGuardable<T> {
  return { tipo, bytes: salida.data.length, ancho: salida.info.width, alto: salida.info.height, sha256: sha256(salida.data), contenido: salida.data };
}

/** Un WebP con el lado mayor en `lado` px (sin agrandar), con la calidad y el esfuerzo de `LIMITES_DE_MEDIO`. */
async function webpDeLado(imagen: Sharp, lado: number): Promise<ImagenGuardable<'image/webp'>> {
  const salida = await imagen
    .resize({ width: lado, height: lado, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: LIMITES_DE_MEDIO.calidadWebp, effort: LIMITES_DE_MEDIO.esfuerzoWebp })
    .toBuffer({ resolveWithObject: true });
  return guardable('image/webp', salida);
}

/**
 * DL-191 (REC-D02) · las variantes de un medio de antes, desde lo que ya está guardado (el JPEG de 1600 px, sin
 * metadatos): la grande de 1200 px y la miniatura de 400 px, en WebP. Es lo guardado por BE: se decodifica igual con los
 * mismos límites, y si no se puede (no debería pasar), quien llama sirve lo guardado.
 */
export async function variantesDesdeLoGuardado(guardado: Buffer): Promise<{ readonly grande: ImagenGuardable<'image/webp'>; readonly miniatura: ImagenGuardable<'image/webp'> }> {
  const base = () => sharp(guardado, { limitInputPixels: LIMITES_DE_MEDIO.pixelesMaximos, failOn: 'error' });
  const grande = await webpDeLado(base(), LIMITES_DE_MEDIO.ladoDeLaGrande);
  const miniatura = await webpDeLado(base(), LIMITES_DE_MEDIO.ladoDeLaMiniatura);
  return { grande, miniatura };
}
