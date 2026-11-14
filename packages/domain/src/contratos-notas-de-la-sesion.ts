/**
 * WP-PULIDO-GRANDES PG-15 (DEUDA_LEGAJO DL-173; PG-D10, aprobada por Dirección el 2026-11-14): la nota para tu profe al
 * finalizar la sesión. Operaciones nuevas, aparte de confirmar (DL-137 D-7): API-TRN-18 no cambia y las APK instaladas
 * siguen andando.
 * - **API-TRN-25** `POST /training/executions/{executionId}/notes`: la persona agrega una nota a una sesión suya ya
 *   registrada. Con Idempotency-Key, solo agrega (no se edita ni se borra: una nueva queda debajo, con su hora), hasta
 *   280 caracteres. Con el mismo permiso que corregir la sesión (API-TRN-20): mientras su profesional la acompaña.
 * - **API-TRN-25-LISTA** `GET /advisees/{adviseeId}/training/execution-notes`: el profesional de Entrenamiento lee las notas
 *   de las sesiones que ya puede ver (las de sus planes con esa persona, como API-TRN-19 y API-TRN-21), por período.
 * - **API-TRN-25-PROPIA** `GET /me/training/executions/{executionId}/notes`: la persona lee las suyas de una sesión, con su
 *   A3 vigente, como «Tu historial» (decisión del continuador PG-T64, a ratificar).
 * La nota no es un chat: el profesional no responde desde ahí, no dispara avisos y BE no interpreta lo que dice.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { FechaLocalSchema } from './contratos-nutricion';

/** PG-15: el texto libre corto. La base no admite más (CHECK en la migración). */
export const MAXIMO_DE_CARACTERES_DE_LA_NOTA_DE_LA_SESION = 280;
/** PG-T61: cuántas notas puede tener una sesión. Una más es 422 VALIDATION_FAILED con NOTE_LIMIT_REACHED. */
export const MAXIMO_DE_NOTAS_POR_SESION = 20;
/** API-TRN-25-LISTA: el período más largo que se lee de una vez, el mismo de los registros (API-TRN-21). */
export const DIAS_MAXIMOS_DE_LAS_NOTAS_DE_LAS_SESIONES = 92;

/** API-TRN-25. El texto llega recortado en sus bordes; los saltos de línea de adentro quedan. */
export const AgregarNotaDeLaSesionRequestSchema = z.strictObject({
  text: z.string().trim().min(1).max(MAXIMO_DE_CARACTERES_DE_LA_NOTA_DE_LA_SESION),
});
export type AgregarNotaDeLaSesionRequest = z.infer<typeof AgregarNotaDeLaSesionRequestSchema>;

/** Una nota de la persona sobre una sesión suya, como la guarda BE: lo escrito y cuándo, nada más. */
export const NotaDeLaSesionSchema = z.strictObject({
  noteId: IdOpaco,
  executionId: IdOpaco,
  text: z.string().min(1).max(MAXIMO_DE_CARACTERES_DE_LA_NOTA_DE_LA_SESION),
  recordedAt: Instante,
});
export type NotaDeLaSesion = z.infer<typeof NotaDeLaSesionSchema>;

/** API-TRN-25: 201 con la nota agregada. */
export const NotaDeLaSesionResponseSchema = z.strictObject({ data: NotaDeLaSesionSchema });
export type NotaDeLaSesionResponse = z.infer<typeof NotaDeLaSesionResponseSchema>;

/** API-TRN-25-PROPIA: las notas de una sesión propia, de la más vieja a la más nueva (la nueva queda debajo). */
export const NotasDeUnaSesionResponseSchema = z.strictObject({ data: z.array(NotaDeLaSesionSchema) });
export type NotasDeUnaSesionResponse = z.infer<typeof NotasDeUnaSesionResponseSchema>;

/**
 * API-TRN-25-LISTA: las notas de las sesiones del período que el profesional ve, con la fecha de cada sesión. Van de la
 * sesión más nueva a la más vieja y, dentro de una sesión, de la nota más vieja a la más nueva.
 */
export const NotasDeLasSesionesResponseSchema = z.strictObject({
  data: z.strictObject({
    period: z.strictObject({ start: FechaLocalSchema, end: FechaLocalSchema, timeZone: z.string() }),
    notes: z.array(NotaDeLaSesionSchema.extend({ executionDate: FechaLocalSchema })),
  }),
});
export type NotasDeLasSesionesResponse = z.infer<typeof NotasDeLasSesionesResponseSchema>;
