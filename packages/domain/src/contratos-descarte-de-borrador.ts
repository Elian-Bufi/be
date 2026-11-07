/**
 * API-PLN-07 y API-PLE-05 — Descartar un borrador de plan que nunca se activó (DL-163 D-21; WP-TABLERO-ALTA-GAMA TB-47).
 *
 * El pedido es el de activar: la versión que la pantalla mostró (`VersionEsperadaRequestSchema`), con Idempotency-Key.
 * La respuesta es mínima (TA-69): qué versión se descartó y cuándo. No trae `state` ni `version`, porque con una versión
 * descartada no se hace nada más: no se lista, no se lee y no se escribe. El esquema de plan que leen las APK instaladas
 * no cambia (DL-152).
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';

export const DescarteDeBorradorResponseSchema = z.strictObject({
  data: z.strictObject({
    planId: IdOpaco,
    discardedAt: Instante,
  }),
});
export type DescarteDeBorradorResponse = z.infer<typeof DescarteDeBorradorResponseSchema>;
