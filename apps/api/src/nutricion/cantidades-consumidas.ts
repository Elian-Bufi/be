import { serializacionCanonica, type Cantidad } from '@be/domain';
import type { IngestaNutricional, RectificacionDeCantidades } from '@prisma/client';

/**
 * DL-121 · las cantidades consumidas de una opción del plan registrada, en sus tres estados:
 * - `UNCONFIRMED`: registró la opción sin decir cuánto comió (sin ítems);
 * - `PLAN_PORTIONS`: confirmó de forma expresa las porciones del plan (los ítems llevan las cantidades del plan);
 * - `REPORTED`: informó por ingrediente una cantidad, «no lo comí» o nada (`null`: no se sabe, nunca cero).
 * Lo que se guarda (`cantidades_consumidas` y cada rectificación) son los ítems ya resueltos: la vista efectiva no
 * necesita releer el plan.
 */
export type EstadoDeCantidades = 'UNCONFIRMED' | 'PLAN_PORTIONS' | 'REPORTED';
export interface ItemConsumido {
  readonly itemId: string;
  readonly quantity: Cantidad | null;
  readonly notEaten: boolean;
}
export interface CantidadesConsumidas {
  readonly status: EstadoDeCantidades;
  readonly items: readonly ItemConsumido[];
}

type IngestaConRectificaciones = IngestaNutricional & { readonly rectificaciones?: readonly RectificacionDeCantidades[] };

/**
 * Lo registrado por API-NUT-15 leído como cantidades v2: sin cantidades informadas es una opción sin confirmar; con
 * alguna, cantidades informadas (los ítems que no nombró, sin dato).
 */
function cantidadesDeV1(itemsConsumidos: unknown): CantidadesConsumidas {
  const items = (itemsConsumidos as { itemId: string; quantity: Cantidad }[]) ?? [];
  return items.length === 0 ? { status: 'UNCONFIRMED', items: [] } : { status: 'REPORTED', items: items.map((i) => ({ itemId: i.itemId, quantity: i.quantity, notEaten: false })) };
}

/** La rectificación terminal de una cadena lineal (la base garantiza una raíz y una sucesora por eslabón). */
function terminal(rectificaciones: readonly RectificacionDeCantidades[]): RectificacionDeCantidades | null {
  return rectificaciones.find((r) => !rectificaciones.some((s) => s.predecesoraId === r.id)) ?? null;
}

/**
 * La vista efectiva de las cantidades de una ingesta prescripta (06:1422-1462): la última rectificación o lo original.
 * `null` para una comida diferente, que no tiene cantidades del catálogo.
 */
export function cantidadesEfectivas(i: IngestaConRectificaciones): { readonly cantidades: CantidadesConsumidas; readonly fuente: 'ORIGINAL' | 'RECTIFIED'; readonly rectificadaEn: Date | null } | null {
  if (i.origen !== 'PRESCRIPTA') return null;
  const ultima = terminal(i.rectificaciones ?? []);
  if (ultima) return { cantidades: ultima.cantidades as unknown as CantidadesConsumidas, fuente: 'RECTIFIED', rectificadaEn: ultima.momentoDeRegistro };
  const original = i.cantidadesConsumidas ? (i.cantidadesConsumidas as unknown as CantidadesConsumidas) : cantidadesDeV1(i.itemsConsumidos);
  return { cantidades: original, fuente: 'ORIGINAL', rectificadaEn: null };
}

/**
 * La proyección a la forma v1 (`IngestaSchema.consumedItems`, que lee la APK instalada): las cantidades efectivas que se
 * conocen. «No lo comí» y una cantidad desconocida no tienen forma en v1 (exige una cantidad positiva): no figuran, como
 * un ítem no informado. Lo registrado por NUT-15 y nunca rectificado sale exactamente como se guardó.
 */
export function itemsConsumidosV1(i: IngestaConRectificaciones): { itemId: string; quantity: Cantidad }[] {
  if (i.origen !== 'PRESCRIPTA') return i.itemsConsumidos as unknown as { itemId: string; quantity: Cantidad }[];
  if (!i.cantidadesConsumidas && (i.rectificaciones ?? []).length === 0) return i.itemsConsumidos as unknown as { itemId: string; quantity: Cantidad }[];
  const efectivas = cantidadesEfectivas(i)!.cantidades;
  return efectivas.items.flatMap((it) => (it.quantity && !it.notEaten ? [{ itemId: it.itemId, quantity: it.quantity }] : []));
}

/**
 * Si dos estados de cantidades dicen lo mismo: jsonb reordena las claves (se compara la serialización canónica) y el
 * orden de los ítems informados no cambia lo informado.
 */
export function mismasCantidades(a: CantidadesConsumidas, b: CantidadesConsumidas): boolean {
  const normal = (c: CantidadesConsumidas) => serializacionCanonica({ status: c.status, items: [...c.items].sort((x, y) => x.itemId.localeCompare(y.itemId)) });
  return normal(a) === normal(b);
}
