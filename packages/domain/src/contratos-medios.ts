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

/** Los tipos que se aceptan para subir. Lo guardado es siempre JPEG recodificado. */
export const TipoDeImagenSchema = z.enum(['image/jpeg', 'image/png', 'image/webp']);
export type TipoDeImagen = z.infer<typeof TipoDeImagenSchema>;

/** Los límites, iguales en el cliente y en el servidor. */
export const LIMITES_DE_MEDIO = {
  /** Lo máximo que se acepta para subir: 10 MB. */
  bytesMaximos: 10 * 1024 * 1024,
  /** El lado mínimo y el máximo de la imagen recibida, en píxeles. */
  ladoMinimo: 64,
  ladoMaximo: 8000,
  /** El máximo de píxeles de la imagen recibida (40 megapíxeles): una imagen que lo pasa no se decodifica. */
  pixelesMaximos: 40_000_000,
  /** El lado mayor de lo guardado, en píxeles. */
  ladoMaximoGuardado: 1600,
  /** La calidad del JPEG guardado. */
  calidadJpeg: 82,
  /** Cuánto vale una URL de subida, en segundos. */
  vigenciaDeSubidaSegundos: 600,
  /** Cuánto vale una URL de lectura, en segundos: 15 minutos como máximo (08 §21). */
  vigenciaDeLecturaSegundos: 900,
  /** Cuántas fotos puede llevar el registro de una comida diferente. */
  fotosPorRegistro: 3,
} as const;

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
  /** Lo guardado: JPEG recodificado. `null` mientras está pendiente o después de suprimirlo. */
  contentType: z.literal('image/jpeg').nullable(),
  byteSize: z.number().int().positive().nullable(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  provenance: ProcedenciaDeMedioSchema,
  authorship: z.string().nullable(),
  createdAt: Instante,
});
export type Medio = z.infer<typeof MedioSchema>;
export const MedioResponseSchema = z.strictObject({ data: MedioSchema });

/** API-MED-03. La URL de lectura, relativa a la base de la API, que vence en `expiresAt` (15 minutos como máximo). */
export const AccesoAMedioResponseSchema = z.strictObject({
  data: z.strictObject({
    mediaId: IdOpaco,
    path: z.string().regex(/^\/media\/content\/[A-Za-z0-9._-]+$/),
    expiresAt: Instante,
  }),
});
export type AccesoAMedioResponse = z.infer<typeof AccesoAMedioResponseSchema>;
