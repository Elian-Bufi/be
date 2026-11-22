/**
 * Medios privados (DL-120): imágenes de referencia de recetas y fotos de una comida del asesorado. Sigue el 09v12 §24
 * («Media privada — contrato condicionado a activación»), que el encargo de Dirección del 2026-10-05 activa, con las
 * garantías del 08 §21:
 * - **privado:** ninguna URL pública ni clave de almacenamiento; la identidad del medio no es su URL;
 * - **URL firmadas temporales:** 10 minutos para subir y 15 como máximo para leer;
 * - **EXIF depurado:** el servidor decodifica y recodifica cada imagen sin metadatos;
 * - **acceso por PDP y auditado;**
 * - **supresión** a pedido del titular (08:451): se borran los bytes y queda el registro.
 *
 * Las rutas de subida y de lectura son relativas a la base de la API (`/api/v1`): el cliente les antepone la suya.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';

/**
 * Para qué es el medio. Una foto de una comida es del titular y nunca se reusa como imagen de receta.
 * `EXERCISE_REFERENCE` (DL-123): la imagen de un ejercicio propio de un profesional de Entrenamiento.
 */
export const FinalidadDeMedioSchema = z.enum(['RECIPE_REFERENCE', 'MEAL_EVIDENCE', 'EXERCISE_REFERENCE']);
export type FinalidadDeMedio = z.infer<typeof FinalidadDeMedioSchema>;

/** De dónde viene la imagen: generada por IA (las tres de la demostración) o aportada por una persona. */
export const ProcedenciaDeMedioSchema = z.enum(['AI_GENERATED', 'PERSON_PROVIDED']);
export type ProcedenciaDeMedio = z.infer<typeof ProcedenciaDeMedioSchema>;

/**
 * Los tipos que se aceptan para subir. Lo guardado es siempre una imagen recodificada: JPEG para la foto de una comida y
 * la imagen de un ejercicio; WebP para la imagen de una receta, en dos variantes (DL-191).
 */
export const TipoDeImagenSchema = z.enum(['image/jpeg', 'image/png', 'image/webp']);
export type TipoDeImagen = z.infer<typeof TipoDeImagenSchema>;

/** Lo que guarda BE: JPEG (lo de antes, la foto de una comida y la imagen de un ejercicio) o WebP (DL-191). */
export const TipoGuardadoSchema = z.enum(['image/jpeg', 'image/webp']);
export type TipoGuardado = z.infer<typeof TipoGuardadoSchema>;

/**
 * DL-191 (REC-01) · la medida de la imagen de una receta que se pide: la miniatura (400 px en el lado mayor) para listas,
 * tarjetas y el carrusel, y la grande (1200 px) para el detalle. Sin variante, la de siempre: lo guardado.
 */
export const VarianteDeMedioSchema = z.enum(['thumbnail', 'large']);
export type VarianteDeMedio = z.infer<typeof VarianteDeMedioSchema>;

/**
 * Los límites, iguales en el cliente y en el servidor.
 *
 * DL-191 (REC-D01) · **los tamaños esperados de la imagen de una receta**, medidos con las tres fotos del paquete de
 * Nutrición (1254 × 1254, PNG de 2,5 MB cada una) y sharp 0.35: la grande de 1200 px en WebP de calidad 78 pesa de 146 a
 * 178 kB, y la miniatura de 400 px, de 24 a 29 kB, contra 263 a 302 kB del JPEG de 1600 px de calidad 82 de antes. La
 * calidad 78 es la más alta del rango pedido (78 a 80) que deja la grande cerca de los 150 kB; a 80, la grande sube a
 * 169-206 kB. El esfuerzo 6 (de 0 a 6) baja otro 5 % a cambio de unos 0,4 s de CPU por subida, que pasa una vez.
 */
export const LIMITES_DE_MEDIO = {
  /** Lo máximo que se acepta para subir: 10 MB. */
  bytesMaximos: 10 * 1024 * 1024,
  /** El lado mínimo y el máximo de la imagen recibida, en píxeles. */
  ladoMinimo: 64,
  ladoMaximo: 8000,
  /** El máximo de píxeles de la imagen recibida (40 megapíxeles): una imagen que lo pasa no se decodifica. */
  pixelesMaximos: 40_000_000,
  /** El lado mayor de lo guardado como JPEG (la foto de una comida y la imagen de un ejercicio), en píxeles. */
  ladoMaximoGuardado: 1600,
  /** La calidad del JPEG guardado. */
  calidadJpeg: 82,
  /** DL-191 · el lado mayor de la grande de la imagen de una receta, en píxeles. */
  ladoDeLaGrande: 1200,
  /** DL-191 · el lado mayor de la miniatura, en píxeles. */
  ladoDeLaMiniatura: 400,
  /** DL-191 · la calidad WebP de las dos variantes (REC-D01). */
  calidadWebp: 78,
  /** DL-191 · el esfuerzo del codificador WebP, de 0 a 6. */
  esfuerzoWebp: 6,
  /** DL-191 · lo que se espera que pese cada variante de una foto de comida, en bytes (una referencia, no un tope). */
  bytesEsperadosDeLaMiniatura: 25 * 1024,
  bytesEsperadosDeLaGrande: 150 * 1024,
  /** DL-191 (REC-03) · el lado mayor al que el cliente achica una imagen antes de subirla, y la calidad que usa. */
  ladoAlAchicarEnElCliente: 1600,
  calidadAlAchicarEnElCliente: 0.85,
  /** Cuánto vale una URL de subida, en segundos. */
  vigenciaDeSubidaSegundos: 600,
  /** Cuánto vale una URL de lectura, en segundos: 15 minutos como máximo (08 §21). */
  vigenciaDeLecturaSegundos: 900,
  /**
   * DL-191 (REC-D10) · una imagen del Recetario de BE no es un dato de nadie: su ruta de lectura vale de 6 a 7 horas (vence
   * en la hora redonda siguiente a las 6 horas), así la misma imagen tiene la misma ruta durante una hora y el navegador la
   * guarda.
   */
  vigenciaDeLecturaDelRecetarioSegundos: 6 * 3600,
  redondeoDeLecturaDelRecetarioSegundos: 3600,
  /** Cuántas fotos puede llevar el registro de una comida diferente. */
  fotosPorRegistro: 3,
} as const;

/**
 * DL-191 (REC-03) · las medidas a las que se achica una imagen antes de subirla: el lado mayor a `ladoMayor`, sin agrandar
 * y sin cambiar la proporción. La usa el website antes de subir; la APK, en DL-194. El servidor igual valida y recodifica.
 */
export function medidasAlAchicar(ancho: number, alto: number, ladoMayor: number = LIMITES_DE_MEDIO.ladoAlAchicarEnElCliente): { readonly ancho: number; readonly alto: number; readonly achicar: boolean } {
  if (!(ancho > 0) || !(alto > 0)) throw new RangeError('medidas inválidas');
  const mayor = Math.max(ancho, alto);
  if (mayor <= ladoMayor) return { ancho, alto, achicar: false };
  const factor = ladoMayor / mayor;
  return { ancho: Math.max(1, Math.round(ancho * factor)), alto: Math.max(1, Math.round(alto * factor)), achicar: true };
}

export const EstadoDeMedioSchema = z.enum(['PENDING', 'AVAILABLE', 'DELETED']);

const Autoria = z.string().trim().min(1).max(120);

/**
 * API-MED-01. La finalidad decide quién puede subir: un profesional de Nutrición para una receta, uno de Entrenamiento
 * para un ejercicio y el asesorado para su comida.
 */
export const IntencionDeSubidaRequestSchema = z.strictObject({
  purpose: FinalidadDeMedioSchema,
  contentType: TipoDeImagenSchema,
  byteSize: z.number().int().positive().max(LIMITES_DE_MEDIO.bytesMaximos),
  /** `MEAL_EVIDENCE` es siempre `PERSON_PROVIDED`: lo controla el servidor. */
  provenance: ProcedenciaDeMedioSchema,
  authorship: Autoria.nullable(),
});
export type IntencionDeSubidaRequest = z.infer<typeof IntencionDeSubidaRequestSchema>;

export const IntencionDeSubidaResponseSchema = z.strictObject({
  data: z.strictObject({
    mediaId: IdOpaco,
    /** Relativa a la base de la API: `/media/uploads/{token}`. Se sube con PUT y el tipo declarado. */
    uploadPath: z.string().regex(/^\/media\/uploads\/[A-Za-z0-9._-]+$/),
    method: z.literal('PUT'),
    contentType: TipoDeImagenSchema,
    maxBytes: z.number().int().positive(),
    expiresAt: Instante,
  }),
});
export type IntencionDeSubidaResponse = z.infer<typeof IntencionDeSubidaResponseSchema>;

export const MedioSchema = z.strictObject({
  mediaId: IdOpaco,
  purpose: FinalidadDeMedioSchema,
  status: EstadoDeMedioSchema,
  /**
   * Lo guardado: JPEG recodificado (la foto de una comida, la imagen de un ejercicio y lo de antes de DL-191) o WebP (la
   * grande de la imagen de una receta). `null` mientras está pendiente o después de suprimirlo.
   */
  contentType: TipoGuardadoSchema.nullable(),
  byteSize: z.number().int().positive().nullable(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  provenance: ProcedenciaDeMedioSchema,
  authorship: z.string().nullable(),
  createdAt: Instante,
});
export type Medio = z.infer<typeof MedioSchema>;
export const MedioResponseSchema = z.strictObject({ data: MedioSchema });

/** La ruta de lectura de API-MED-04, relativa a la base de la API. */
export const RutaDeLecturaDeMedioSchema = z.string().regex(/^\/media\/content\/[A-Za-z0-9._-]+$/);

/**
 * API-MED-03. La URL de lectura, relativa a la base de la API, que vence en `expiresAt` (15 minutos como máximo; la de
 * una imagen del Recetario de BE, de 6 a 7 horas, REC-D10). Con `?variant=thumbnail|large`, la de esa variante (DL-191).
 */
export const AccesoAMedioResponseSchema = z.strictObject({
  data: z.strictObject({
    mediaId: IdOpaco,
    path: RutaDeLecturaDeMedioSchema,
    expiresAt: Instante,
  }),
});
export type AccesoAMedioResponse = z.infer<typeof AccesoAMedioResponseSchema>;
