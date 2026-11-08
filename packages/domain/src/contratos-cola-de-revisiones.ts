/**
 * API-DSH-02 — La cola de revisiones (09 v0.11 §14; B10-08 §6.3; DL-163 D-6; TB-14). La forma es la del 09: una lista
 * de ítems con la persona, el área, desde cuándo, el motivo y las fuentes relacionadas, y la página.
 *
 * - Un ítem por seguimiento (la persona y el área) con un motivo de `MOTIVOS_DE_LA_COLA`, en el orden de
 *   `compararFilasDeLaCola`. La lógica vive en `cola-de-revisiones.ts`, con la definición de pendiente del dominio.
 * - `agreedReviewDate` es la fecha de la revisión acordada que sigue en pie, o `null`: sin fecha, o ninguna en pie.
 * - Las fuentes son referencias que ya se pueden abrir: la revisión (API-NUT-19 o API-TRN-23) y la versión del plan
 *   (API-NUT-09 o API-TRN-09). No hay valores de salud, puntajes ni actividad de la persona.
 * - Un área que el PDP no permite no aparece ni se explica (B10-08 §8.4); el aviso de vista parcial ya lo da la
 *   cartera (API-CAR-01), que el website lee junto con esta.
 */
import { z } from 'zod';
import { MOTIVOS_DE_LA_COLA } from './cola-de-revisiones';
import { IdOpaco } from './contratos';
import { PaginaSchema, ResumenDeActorSchema } from './contratos-vinculo';

export const MotivoDeLaColaSchema = z.enum(MOTIVOS_DE_LA_COLA);
/** Los dominios con seguimiento (06 §8.9: Antropometría no abre Proceso), con los tokens del 09. */
export const DominioDeLaColaSchema = z.enum(['NUTRITION', 'TRAINING']);
export type DominioDeLaCola = z.infer<typeof DominioDeLaColaSchema>;

export const FuenteDeLaColaSchema = z.strictObject({
  type: z.enum(['REVIEW', 'PLAN_VERSION']),
  id: IdOpaco,
});

const FechaCivil = z.iso.date();

export const ItemDeLaColaSchema = z.strictObject({
  advisee: ResumenDeActorSchema,
  relationshipId: IdOpaco,
  domain: DominioDeLaColaSchema,
  /** Fecha civil desde la que está en la cola: el registro de la revisión sin aplicar, la fecha acordada (o su registro, si no tiene fecha) o desde cuándo no hay una acordada. */
  pendingSince: FechaCivil,
  reason: z.strictObject({ code: MotivoDeLaColaSchema }),
  agreedReviewDate: FechaCivil.nullable(),
  sourceReferences: z.array(FuenteDeLaColaSchema),
});
export type ItemDeLaCola = z.infer<typeof ItemDeLaColaSchema>;

export const ColaDeRevisionesResponseSchema = z.strictObject({
  data: z.array(ItemDeLaColaSchema),
  page: PaginaSchema,
});
export type ColaDeRevisionesResponse = z.infer<typeof ColaDeRevisionesResponseSchema>;

/** Filtros de la consulta (los nombres del 09: `domain` y `status`, que es el motivo). */
export interface FiltroDeLaCola {
  readonly domain?: DominioDeLaCola;
  readonly status?: z.infer<typeof MotivoDeLaColaSchema>;
  readonly limit?: string;
  readonly cursor?: string;
}
