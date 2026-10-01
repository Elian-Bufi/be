/**
 * API-DSH-04 — Cartera del profesional (PF-07, propuesta del 2026-09-30): «Pendientes» de todos los asesorados con
 * vínculo vigente, por dominio disponible según el PDP, con hechos fechados y sin juicios.
 *
 * - Cada ítem es **un pendiente** de un asesorado en un dominio (`kind`), con la fecha civil que lo origina y, si es
 *   una revisión, los días de atraso o los que faltan. La última actividad registrada acompaña al ítem como dato;
 *   nunca genera un ítem por sí sola ni se traduce a «inactivo».
 * - Un dominio no disponible para este profesional no aparece ni se explica (B10-08 §8.4); si alguno quedó fuera por
 *   eso, `partialView` es un aviso único (10-B04:1171-1176), igual que en API-DSH-03.
 * - El período acota solo `lastActivityAt` y `activityCount`; los pendientes de revisión y de plan no dependen de él.
 * - `today` y `timeZone` dicen con qué fecha civil se clasificaron las revisiones.
 */
import { z } from 'zod';
import { TIPOS_DE_PENDIENTE } from './cartera';
import { IdOpaco, Instante } from './contratos';
import { PaginaSchema, ResumenDeActorSchema } from './contratos-vinculo';

export const DominioDeCarteraSchema = z.enum(['nutrition', 'training', 'anthropometry']);
export type DominioDeCartera = z.infer<typeof DominioDeCarteraSchema>;

export const TipoDePendienteSchema = z.enum(TIPOS_DE_PENDIENTE);

/** La vista del asesorado que resuelve el pendiente: el website arma la ruta; la API no decide nada por el profesional. */
export const VistaDeAperturaSchema = z.enum(['plan', 'revisiones', 'solicitudes', 'preparacion']);
export type VistaDeApertura = z.infer<typeof VistaDeAperturaSchema>;

const FechaCivil = z.iso.date();

export const PendienteDeCarteraSchema = z.strictObject({
  advisee: ResumenDeActorSchema,
  relationshipId: IdOpaco,
  domain: DominioDeCarteraSchema,
  kind: TipoDePendienteSchema,
  /** Fecha civil que origina el pendiente (fecha objetivo de la revisión, registro del borrador o de la solicitud); `null` cuando no hay una. */
  since: FechaCivil.nullable(),
  /** Solo en `REVIEW_OVERDUE`: días de atraso. */
  daysOverdue: z.number().int().nonnegative().nullable(),
  /** Solo en `REVIEW_DUE_SOON`: días que faltan (0 = hoy). */
  daysUntil: z.number().int().nonnegative().nullable(),
  /** Último registro del asesorado en el dominio dentro del período, o `null`. Un dato, no un pendiente. */
  lastActivityAt: Instante.nullable(),
  activityCount: z.number().int().nonnegative(),
  open: z.strictObject({ view: VistaDeAperturaSchema }),
});
export type PendienteDeCartera = z.infer<typeof PendienteDeCarteraSchema>;

export const CarteraResponseSchema = z.strictObject({
  data: z.strictObject({
    today: FechaCivil,
    timeZone: z.string(),
    /** Fechas civiles del período de actividad, tal como se pidieron (`null` = sin cota de ese lado). */
    period: z.strictObject({ start: FechaCivil.nullable(), end: FechaCivil.nullable() }),
    partialView: z.boolean(),
    items: z.array(PendienteDeCarteraSchema),
  }),
  page: PaginaSchema,
});
export type CarteraResponse = z.infer<typeof CarteraResponseSchema>;

/** Filtros de la consulta (los mismos nombres que en la query). */
export interface FiltroDeCartera {
  readonly periodStart?: string;
  readonly periodEnd?: string;
  readonly domain?: DominioDeCartera;
  readonly kind?: z.infer<typeof TipoDePendienteSchema>;
  readonly limit?: string;
  readonly cursor?: string;
}
