import { LIMITES_DE_MEDIO, TipoDeImagenSchema, type TipoDeImagen } from '@be/domain';
import { createHash } from 'node:crypto';
import sharp, { type Metadata, type OutputInfo } from 'sharp';
import { errores } from '../http/errores';

// Cada imagen es distinta: el caché de libvips no ahorra nada y retendría memoria.
sharp.cache(false);

const TIPO_DE_FORMATO: Readonly<Record<string, TipoDeImagen>> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export interface ImagenProcesada {
  readonly original: { readonly tipo: TipoDeImagen; readonly bytes: number; readonly ancho: number; readonly alto: number; readonly sha256: string };
  readonly procesada: { readonly tipo: 'image/jpeg'; readonly bytes: number; readonly ancho: number; readonly alto: number; readonly sha256: string; readonly contenido: Buffer };
}

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
 */
export async function procesarImagen(bytes: Buffer, tipoDeclarado: TipoDeImagen): Promise<ImagenProcesada> {
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
  let salida: { data: Buffer; info: OutputInfo };
  try {
    let imagen = sharp(bytes, { limitInputPixels: pixelesMaximos, failOn: 'warning' }).rotate();
    if (metadatos.hasAlpha) imagen = imagen.flatten({ background: '#ffffff' });
    salida = await imagen
      .resize({ width: ladoMaximoGuardado, height: ladoMaximoGuardado, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: calidadJpeg })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw errores.contenidoDeArchivoInvalido([{ code: 'IMAGE_NOT_DECODABLE', path: '(body)' }]);
  }
  return {
    original: { tipo: tipoReal, bytes: bytes.length, ancho, alto, sha256: sha256(bytes) },
    procesada: { tipo: 'image/jpeg', bytes: salida.data.length, ancho: salida.info.width, alto: salida.info.height, sha256: sha256(salida.data), contenido: salida.data },
  };
}
