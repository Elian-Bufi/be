/**
 * «Comí algo diferente» (WP-NUTRICION-RECETAS §7 y §9; encargo de Dirección del 2026-10-05, §5): el borrador y su
 * guardado, como lógica pura. `scripts/registro-de-comidas.test.mjs` la prueba sin teléfono.
 *
 * - **Texto, foto o los dos, y al menos uno.** La cantidad aproximada es texto libre: no se convierte en cantidades del
 *   catálogo, y nada se infiere de la foto ni del texto. Los macros quedan «sin calcular».
 * - **La foto se valida en el teléfono con los límites de la API** (`LIMITES_DE_MEDIO`): JPEG, PNG o WebP, hasta 10 MB,
 *   de 64 a 8000 píxeles por lado y hasta 40 megapíxeles. Lo que el selector no dice (el tamaño, a veces) se valida con
 *   los bytes, antes de pedir la ruta. La API la vuelve a validar y la guarda recodificada, sin EXIF.
 * - **Guardar tiene estados distintos:** subiendo la foto, guardando, un error recuperable y guardado confirmado. Un
 *   error no borra nada: el texto y la foto quedan, y el reintento usa la misma clave. Si la foto no sube, el texto queda y
 *   se puede guardar sin ella.
 * - **La subida es su propio intento:** con la misma foto y la ruta firmada todavía vigente, se vuelve a subir ahí; si
 *   venció o cambió la foto, se pide otra ruta.
 */
import { COPY, COPY_RECETAS, COPY_REGISTRO_DE_COMIDAS, LIMITES_DE_MEDIO, type RegistrarComidaRequest, type TipoDeImagen } from '@be/domain';

/** Una foto elegida con la cámara o la galería, todavía en el teléfono. */
export interface FotoElegida {
  readonly uri: string;
  readonly tipo: TipoDeImagen;
  /** El tamaño en bytes, si el selector lo dio. */
  readonly bytes: number | null;
  readonly ancho: number | null;
  readonly alto: number | null;
}

const POR_EXTENSION: Readonly<Record<string, TipoDeImagen>> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

/** El tipo de la imagen por lo que declara el selector o, si no declara nada, por la extensión del archivo. */
export function tipoDeImagen(mimeType?: string | null, nombre?: string | null): TipoDeImagen | null {
  const declarado = (mimeType ?? '').split(';')[0]!.trim().toLowerCase();
  if (declarado === 'image/jpeg' || declarado === 'image/jpg' || declarado === 'image/pjpeg') return 'image/jpeg';
  if (declarado === 'image/png' || declarado === 'image/webp') return declarado;
  // Declaró otro tipo (GIF, HEIC, un video): no se acepta, aunque el nombre diga otra cosa.
  if (declarado !== '') return null;
  const extension = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(nombre ?? '')?.[1]?.toLowerCase();
  return extension ? (POR_EXTENSION[extension] ?? null) : null;
}

export type MotivoDeFotoInvalida = 'TIPO' | 'TAMANO' | 'DIMENSIONES';

/** Por qué una foto no se puede usar, o `null` si se puede. Lo que no se sabe todavía no la invalida. */
export function motivoDeFotoInvalida(f: { readonly tipo: TipoDeImagen | null; readonly bytes: number | null; readonly ancho: number | null; readonly alto: number | null }): MotivoDeFotoInvalida | null {
  if (!f.tipo) return 'TIPO';
  if (f.bytes !== null && (f.bytes <= 0 || f.bytes > LIMITES_DE_MEDIO.bytesMaximos)) return 'TAMANO';
  if (f.ancho !== null && f.alto !== null) {
    const menor = Math.min(f.ancho, f.alto);
    const mayor = Math.max(f.ancho, f.alto);
    if (menor < LIMITES_DE_MEDIO.ladoMinimo || mayor > LIMITES_DE_MEDIO.ladoMaximo || f.ancho * f.alto > LIMITES_DE_MEDIO.pixelesMaximos) return 'DIMENSIONES';
  }
  return null;
}

/** Lo que devuelve `expo-image-picker` de una imagen, reducido a lo que usa BE. */
export interface ImagenDelSelector {
  readonly uri: string;
  readonly mimeType?: string | null;
  readonly fileName?: string | null;
  readonly fileSize?: number | null;
  readonly width?: number | null;
  readonly height?: number | null;
}

const positivo = (n: number | null | undefined): number | null => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null);

export function fotoDesdeElSelector(imagen: ImagenDelSelector): { readonly foto: FotoElegida; readonly motivo: null } | { readonly foto: null; readonly motivo: MotivoDeFotoInvalida } {
  const tipo = tipoDeImagen(imagen.mimeType, imagen.fileName ?? imagen.uri);
  const datos = { tipo, bytes: positivo(imagen.fileSize), ancho: positivo(imagen.width), alto: positivo(imagen.height) };
  const motivo = motivoDeFotoInvalida(datos);
  if (motivo !== null || tipo === null) return { foto: null, motivo: motivo ?? 'TIPO' };
  return { foto: { uri: imagen.uri, tipo, bytes: datos.bytes, ancho: datos.ancho, alto: datos.alto }, motivo: null };
}

/** Lo que dice la pantalla de una foto que no se puede usar. */
export const AVISO_DE_FOTO_INVALIDA: Readonly<Record<MotivoDeFotoInvalida, string>> = {
  TIPO: COPY_REGISTRO_DE_COMIDAS.fotoInvalida,
  TAMANO: COPY_REGISTRO_DE_COMIDAS.fotoInvalida,
  // El aviso completo, con las medidas: el mismo que ve el profesional al cargar una imagen de receta.
  DIMENSIONES: COPY_RECETAS.imagenInvalida,
};

/** Si el borrador se puede guardar: hace falta una descripción o una foto. Los espacios solos no son una descripción. */
export const hayContenido = (descripcion: string, foto: FotoElegida | null): boolean => descripcion.trim().length > 0 || foto !== null;

/** Si hay algo que se perdería al salir: texto, cantidad o foto. */
export const hayBorrador = (descripcion: string, cantidad: string, foto: FotoElegida | null): boolean => descripcion.trim() !== '' || cantidad.trim() !== '' || foto !== null;

/** El contexto de la comida: el plan, el día del plan y la comida que se estaba viendo. */
export interface ContextoDeLaComida {
  readonly activePlanId: string;
  readonly dayTypeId: string | null;
  readonly mealId: string | null;
}

/** El pedido de API-ING-02 para una comida diferente. Nunca lleva macros ni cantidades del catálogo. */
export function cuerpoDeLaComidaDiferente(
  contexto: ContextoDeLaComida,
  datos: { readonly descripcion: string; readonly cantidad: string; readonly mediaIds: readonly string[]; readonly occurredAt: string },
): RegistrarComidaRequest {
  return {
    kind: 'DIFFERENT',
    activePlanId: contexto.activePlanId,
    dayTypeId: contexto.dayTypeId,
    mealId: contexto.mealId,
    occurredAt: datos.occurredAt,
    description: datos.descripcion.trim() || null,
    approximateQuantity: datos.cantidad.trim() || null,
    mediaIds: [...datos.mediaIds],
  };
}

// ─── La subida de la foto ───────────────────────────────────────────────────────────────────────

/** Lo que se sabe de la subida de la foto elegida: la ruta firmada que dio la API y si ya se subió. */
export interface SubidaDeLaFoto {
  /** La foto para la que se pidió la ruta. */
  readonly uri: string;
  readonly mediaId: string;
  readonly uploadPath: string;
  /** Cuándo vence la ruta de subida, en ms, en la hora del servidor. */
  readonly venceMs: number;
  /** La API la recibió y la devolvió disponible. */
  readonly subida: boolean;
}

/** Una ruta que vence en menos de esto no se usa: se pide otra. */
export const MARGEN_DE_LA_RUTA_MS = 60_000;

export type PasoDeLaSubida = 'pedir-ruta' | 'subir' | 'lista';

/** Qué falta para que la foto esté disponible en la API. */
export function pasoDeLaSubida(subida: SubidaDeLaFoto | null, foto: FotoElegida, ahoraMs: number): PasoDeLaSubida {
  if (!subida || subida.uri !== foto.uri) return 'pedir-ruta';
  if (subida.subida) return 'lista';
  return subida.venceMs - MARGEN_DE_LA_RUTA_MS > ahoraMs ? 'subir' : 'pedir-ruta';
}

// ─── El estado del guardado ─────────────────────────────────────────────────────────────────────

export type EstadoDelGuardado =
  | { readonly tipo: 'editando' }
  | { readonly tipo: 'subiendo' }
  | { readonly tipo: 'guardando' }
  /** La foto no subió: el texto y la foto quedan. Se puede reintentar o, si hay texto, guardar sin la foto. */
  | { readonly tipo: 'error-de-la-foto' }
  /** El registro no se confirmó. `incierto`: no se sabe si se guardó, y el reintento usa la misma clave. */
  | { readonly tipo: 'error-al-guardar'; readonly incierto: boolean; readonly mensaje: string }
  | { readonly tipo: 'guardado' };

export const EDITANDO: EstadoDelGuardado = { tipo: 'editando' };

/** Mientras sube o guarda, los botones esperan: un segundo toque no manda nada. */
export const estaOcupado = (estado: EstadoDelGuardado): boolean => estado.tipo === 'subiendo' || estado.tipo === 'guardando';

/** El texto del botón principal en cada estado. Cada estado se distingue: nunca se anuncia «Guardado» antes de tiempo. */
export function textoDelBotonDeGuardar(estado: EstadoDelGuardado, comida: string): string {
  switch (estado.tipo) {
    case 'subiendo':
      return COPY_REGISTRO_DE_COMIDAS.subiendoFoto;
    case 'guardando':
      return COPY_REGISTRO_DE_COMIDAS.guardando;
    case 'error-de-la-foto':
      return COPY.reintentar;
    case 'error-al-guardar':
      return estado.incierto ? COPY.reintentar : COPY_REGISTRO_DE_COMIDAS.guardarComida(comida);
    case 'guardado':
      return COPY_REGISTRO_DE_COMIDAS.guardado;
    case 'editando':
      return COPY_REGISTRO_DE_COMIDAS.guardarComida(comida);
  }
}
