/**
 * WP-PULIDO-GRANDES PG-16 (DEUDA_LEGAJO DL-173; PG-D11, aprobada por Dirección el 2026-11-14): las notas propias del
 * profesional sobre una persona. Familia propia de BE, **NPP**, que la guardia de trazabilidad declara con DL-173.
 * - **API-NPP-01** `POST /advisees/{adviseeId}/professional-notes`: agregar una nota, opcionalmente atada a un ejercicio
 *   del catálogo o a una comida del plan (por su nombre). Con Idempotency-Key; hasta 1000 caracteres; solo agrega.
 * - **API-NPP-02** `GET /advisees/{adviseeId}/professional-notes`: las notas propias sobre esa persona, activas y
 *   archivadas, de la más nueva a la más vieja.
 * - **API-NPP-03** `POST /professional-notes/{noteId}/archive`: archivarla. Queda en la historia, no se borra.
 * **Solo las lee y las archiva su autor** (PG-D11): otro profesional, aunque sea del mismo equipo o área, recibe el 404 de
 * lo inexistente. Sin vínculo vigente con la persona en ningún área, no se agrega ni se lee: las de antes quedan
 * guardadas. La persona no las ve en la app, pero entran en lo que puede pedir de sus datos (la exportación). No se
 * mandan a nadie (para eso está la nota de coordinación, DL-140) y BE no las resume ni las analiza.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { PaginaSchema } from './contratos-vinculo';

/** PG-16: el texto libre. La base no admite más (CHECK en la migración). */
export const MAXIMO_DE_CARACTERES_DE_LA_NOTA_PROPIA = 1000;
/** El nombre de una comida, con el mismo tope que en el plan (`ComidaEntradaSchema`). */
export const MAXIMO_DEL_NOMBRE_DE_LA_COMIDA_DE_LA_NOTA = 80;
/** API-NPP-02: cuántas notas trae de una vez (PG-T69). `page.hasMore` dice si quedaron más viejas afuera. */
export const TOPE_DE_NOTAS_PROPIAS = 200;

const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * A qué está atada una nota, al escribirla (PG-T67):
 * - `EXERCISE`: un ejercicio del catálogo (no una versión): aparece al lado de ese ejercicio en el editor de Entrenamiento,
 *   en cualquier sesión y en cualquier versión del plan. Pide Entrenamiento con la persona;
 * - `MEAL`: una comida del plan, por su nombre («Almuerzo»): aparece al lado de cada comida con ese nombre, en cualquier
 *   día tipo, sin importar mayúsculas ni tildes. Pide Nutrición con la persona.
 */
export const AnclaDeNotaPropiaRequestSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('EXERCISE'), exerciseId: z.string().regex(UUID) }),
  z.strictObject({ type: z.literal('MEAL'), mealLabel: z.string().trim().min(1).max(MAXIMO_DEL_NOMBRE_DE_LA_COMIDA_DE_LA_NOTA) }),
]);
export type AnclaDeNotaPropiaRequest = z.infer<typeof AnclaDeNotaPropiaRequestSchema>;

/** API-NPP-01. El texto llega recortado en sus bordes; los saltos de línea de adentro quedan. Sin ancla: `null` o ausente. */
export const AgregarNotaPropiaRequestSchema = z.strictObject({
  text: z.string().trim().min(1).max(MAXIMO_DE_CARACTERES_DE_LA_NOTA_PROPIA),
  anchor: AnclaDeNotaPropiaRequestSchema.nullable().optional(),
});
export type AgregarNotaPropiaRequest = z.infer<typeof AgregarNotaPropiaRequestSchema>;

/**
 * El ancla como se lee, con lo que la pantalla necesita para decirla:
 * - del ejercicio, su nombre de hoy en el catálogo;
 * - `inPlan` (PG-T68): si hoy está en la última versión del plan del autor con esa persona, en esa área (la que prepara o,
 *   si no hay, la vigente). `null`: el autor no tiene un plan de esa área con ella, y no se dice nada.
 */
export const AnclaDeNotaPropiaSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('EXERCISE'), exerciseId: IdOpaco, exerciseName: z.string(), inPlan: z.boolean().nullable() }),
  z.strictObject({ type: z.literal('MEAL'), mealLabel: z.string().min(1), inPlan: z.boolean().nullable() }),
]);
export type AnclaDeNotaPropia = z.infer<typeof AnclaDeNotaPropiaSchema>;

/** Una nota propia, como la lee su autor. `archivedAt`: cuándo la archivó, o `null` si sigue activa. */
export const NotaPropiaSchema = z.strictObject({
  noteId: IdOpaco,
  adviseeId: IdOpaco,
  text: z.string().min(1).max(MAXIMO_DE_CARACTERES_DE_LA_NOTA_PROPIA),
  anchor: AnclaDeNotaPropiaSchema.nullable(),
  recordedAt: Instante,
  archivedAt: Instante.nullable(),
});
export type NotaPropia = z.infer<typeof NotaPropiaSchema>;

/** API-NPP-01 (201) y API-NPP-03 (200): la nota. */
export const NotaPropiaResponseSchema = z.strictObject({ data: NotaPropiaSchema });
export type NotaPropiaResponse = z.infer<typeof NotaPropiaResponseSchema>;

/** API-NPP-02: hasta `TOPE_DE_NOTAS_PROPIAS`, de la más nueva a la más vieja, las archivadas también. */
export const ListaDeNotasPropiasDelProfesionalResponseSchema = z.strictObject({ data: z.array(NotaPropiaSchema), page: PaginaSchema });
export type ListaDeNotasPropiasDelProfesionalResponse = z.infer<typeof ListaDeNotasPropiasDelProfesionalResponseSchema>;
