/**
 * «Comí algo diferente» (WP-NUTRICION-RECETAS §7 y §9; encargo de Dirección del 2026-10-05, §5): el borrador y su
 * guardado, como lógica pura. `scripts/registro-de-comidas.test.mjs` la prueba sin teléfono.
 *
 * - **Texto, foto o los dos, y al menos uno.** La cantidad aproximada es texto libre: no se convierte en cantidades del
 *   catálogo, y nada se infiere de la foto ni del texto. Los macros quedan «sin calcular».
 * - **La foto se valida en el teléfono con los límites de la API** (`LIMITES_DE_MEDIO`): JPEG, PNG o WebP, hasta 10 MB,
 *   de 64 a 8000 píxeles por lado y hasta 40 megapíxeles. Al elegirla se miran las medidas; el tipo y el tamaño salen de
 *   los bytes que se van a subir, antes de pedir la ruta (`leerLaFoto`). La API la vuelve a validar y la guarda
 *   recodificada, sin EXIF.
 * - **Guardar tiene estados distintos:** subiendo la foto, guardando, un error recuperable y guardado confirmado. Un
 *   error no borra nada: el texto y la foto quedan, y el reintento usa la misma clave. Si la foto no sube, el texto queda y
 *   se puede guardar sin ella.
 * - **La subida es su propio intento:** con la misma foto y la ruta firmada todavía vigente, se vuelve a subir ahí; si
 *   venció o cambió la foto, se pide otra ruta.
 */
import { COPY, COPY_RECETAS, COPY_REGISTRO_DE_COMIDAS, LIMITES_DE_MEDIO, type RegistrarComidaRequest, type TipoDeImagen } from '@be/domain';

/**
 * Una foto elegida con la cámara o la galería, todavía en el teléfono: el archivo que dejó el selector y sus medidas. El
 * tipo y el tamaño no se guardan acá: el selector informa los del original, no los del archivo (ver `esImagen`).
 */
export interface FotoElegida {
  readonly uri: string;
  readonly ancho: number | null;
  readonly alto: number | null;
}

const EXTENSIONES_DE_IMAGEN: ReadonlySet<string> = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif', 'bmp', 'avif']);

/**
 * Si lo elegido es una imagen: por lo que declara el selector o, si no declara nada, por la extensión del archivo. No
 * decide el formato. Con `quality` menor que 1, `expo-image-picker` vuelve a codificar en Android toda imagen que elige: en
 * PNG si era PNG y si no en JPEG, aunque el original fuera HEIC, WebP o GIF y aunque declare el tipo del original. El tipo
 * que se le declara a la API sale de los bytes (`tipoPorLosBytes`).
 */
export function esImagen(mimeType?: string | null, nombre?: string | null): boolean {
  const declarado = (mimeType ?? '').split(';')[0]!.trim().toLowerCase();
  // Declaró otra cosa (un video, un documento): no es una foto, aunque el nombre diga otra cosa.
  if (declarado !== '') return declarado.startsWith('image/');
  const extension = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(nombre ?? '')?.[1]?.toLowerCase();
  return extension !== undefined && EXTENSIONES_DE_IMAGEN.has(extension);
}

const empiezaCon = (b: Uint8Array, firma: readonly number[], desde = 0): boolean => b.length >= desde + firma.length && firma.every((x, i) => b[desde + i] === x);

/** El tipo real de una imagen por sus primeros bytes, como lo decide la API (DL-120): JPEG, PNG o WebP. Otro, `null`. */
export function tipoPorLosBytes(b: Uint8Array): TipoDeImagen | null {
  if (empiezaCon(b, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (empiezaCon(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  // «RIFF», el tamaño y «WEBP».
  if (empiezaCon(b, [0x52, 0x49, 0x46, 0x46]) && empiezaCon(b, [0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp';
  return null;
}

export type MotivoDeFotoInvalida = 'TIPO' | 'TAMANO' | 'DIMENSIONES';

/** Si las medidas salen de lo admitido. Lo que no se sabe todavía no la invalida. */
function fueraDeMedida(ancho: number | null, alto: number | null): boolean {
  if (ancho === null || alto === null) return false;
  const menor = Math.min(ancho, alto);
  const mayor = Math.max(ancho, alto);
  return menor < LIMITES_DE_MEDIO.ladoMinimo || mayor > LIMITES_DE_MEDIO.ladoMaximo || ancho * alto > LIMITES_DE_MEDIO.pixelesMaximos;
}

/** Por qué los bytes de una foto no se pueden subir, o `null` si se pueden. */
export function motivoDeFotoInvalida(f: { readonly tipo: TipoDeImagen | null; readonly bytes: number; readonly ancho: number | null; readonly alto: number | null }): MotivoDeFotoInvalida | null {
  if (!f.tipo) return 'TIPO';
  if (f.bytes <= 0 || f.bytes > LIMITES_DE_MEDIO.bytesMaximos) return 'TAMANO';
  if (fueraDeMedida(f.ancho, f.alto)) return 'DIMENSIONES';
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

/**
 * Lo que se mira al elegir: que sea una imagen y sus medidas. El tamaño no: `fileSize` es el del original, no el del archivo
 * que se va a subir, que el selector volvió a comprimir. Se mide con los bytes, al guardar.
 */
export function fotoDesdeElSelector(imagen: ImagenDelSelector): { readonly foto: FotoElegida; readonly motivo: null } | { readonly foto: null; readonly motivo: MotivoDeFotoInvalida } {
  if (!esImagen(imagen.mimeType, imagen.fileName ?? imagen.uri)) return { foto: null, motivo: 'TIPO' };
  const ancho = positivo(imagen.width);
  const alto = positivo(imagen.height);
  if (fueraDeMedida(ancho, alto)) return { foto: null, motivo: 'DIMENSIONES' };
  return { foto: { uri: imagen.uri, ancho, alto }, motivo: null };
}

/** Los bytes de la foto, listos para subir, con su tipo real. Si no se pueden subir, por qué; `null`: no se pudieron leer. */
export type LecturaDeLaFoto = { readonly ok: true; readonly bytes: Uint8Array; readonly tipo: TipoDeImagen } | { readonly ok: false; readonly motivo: MotivoDeFotoInvalida | null };

/**
 * Lee el archivo que dejó el selector y decide con sus bytes: el tipo real, el tamaño y las medidas que dio el selector.
 *
 * Bytes, nunca un `Blob` (defecto de la APK 0.15.0-candidata.1, 2026-10-07). El `fetch` global de la APK es el de Expo
 * (`expo/fetch`, que instala el runtime de Expo 57):
 * - un `file://` le devuelve una respuesta sin `Content-Type`, así que `blob()` da un `Blob` de tipo vacío;
 * - al mandar un `Blob`, reemplaza el `Content-Type` del pedido por el tipo del `Blob`.
 * La API recibía un tipo vacío y respondía FILE_TYPE_NOT_ALLOWED: ninguna foto subía, y la pantalla culpaba a la foto. Con
 * bytes, `expo/fetch` deja el `Content-Type` que se declara.
 */
export async function leerLaFoto(foto: FotoElegida, leer: (uri: string) => Promise<{ readonly ok: boolean; arrayBuffer(): Promise<ArrayBuffer> }>): Promise<LecturaDeLaFoto> {
  let bytes: Uint8Array;
  try {
    const respuesta = await leer(foto.uri);
    // Un archivo que ya no está responde 404 con un texto: eso no es la foto.
    if (!respuesta.ok) return { ok: false, motivo: null };
    bytes = new Uint8Array(await respuesta.arrayBuffer());
  } catch {
    return { ok: false, motivo: null };
  }
  const tipo = tipoPorLosBytes(bytes);
  const motivo = motivoDeFotoInvalida({ tipo, bytes: bytes.byteLength, ancho: foto.ancho, alto: foto.alto });
  if (motivo !== null || tipo === null) return { ok: false, motivo: motivo ?? 'TIPO' };
  return { ok: true, bytes, tipo };
}

/**
 * Si la API rechazó la foto por lo que es: su tamaño, o sus bytes (un problema en `(body)`). Un rechazo por la cabecera o
 * por lo declarado en la intención es una falla del envío, no de la foto: devuelve `null`, y la pantalla ofrece reintentar
 * o guardar sin la foto en vez de decirle a la persona que su foto no sirve.
 */
export function motivoDelRechazo(codigo: string, issues: readonly { readonly path: string }[]): MotivoDeFotoInvalida | null {
  if (codigo === 'FILE_SIZE_NOT_ALLOWED') return 'TAMANO';
  if (!issues.some((i) => i.path === '(body)')) return null;
  if (codigo === 'FILE_TYPE_NOT_ALLOWED') return 'TIPO';
  if (codigo === 'FILE_CONTENT_INVALID') return 'DIMENSIONES';
  return null;
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
