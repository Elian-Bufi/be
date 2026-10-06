import type { IngestaNutricional, RectificacionDeCantidades } from '@prisma/client';
import { cantidadesEfectivas, itemsConsumidosV1, mismasCantidades } from './cantidades-consumidas';

/** Una ingesta sintética con lo mínimo que mira la vista efectiva. */
function ingesta(cambios: Partial<IngestaNutricional>, rectificaciones: Partial<RectificacionDeCantidades>[] = []) {
  return {
    id: 'ingesta-1',
    origen: 'PRESCRIPTA',
    itemsConsumidos: [],
    cantidadesConsumidas: null,
    ...cambios,
    rectificaciones: rectificaciones.map((r, i) => ({ id: `r${i + 1}`, ingestaId: 'ingesta-1', predecesoraId: null, momentoDeRegistro: new Date(2026, 9, 5, 12, i), ...r })),
  } as unknown as IngestaNutricional & { rectificaciones: RectificacionDeCantidades[] };
}
const g = (value: number) => ({ value, unit: 'g' as const });

describe('DL-121 · las cantidades consumidas: vista efectiva y forma v1', () => {
  it('lo registrado por API-NUT-15 se lee como v2: sin cantidades, sin confirmar; con alguna, informadas', () => {
    expect(cantidadesEfectivas(ingesta({}))!.cantidades).toEqual({ status: 'UNCONFIRMED', items: [] });
    expect(cantidadesEfectivas(ingesta({ itemsConsumidos: [{ itemId: 'a', quantity: g(80) }] }))!.cantidades).toEqual({ status: 'REPORTED', items: [{ itemId: 'a', quantity: g(80), notEaten: false }] });
    // Y su forma v1 sale tal como se guardó.
    expect(itemsConsumidosV1(ingesta({ itemsConsumidos: [{ itemId: 'a', quantity: g(80) }] }))).toEqual([{ itemId: 'a', quantity: g(80) }]);
  });

  it('la vista efectiva es la rectificación terminal; el original no cambia', () => {
    const original = { status: 'UNCONFIRMED', items: [] };
    const i = ingesta({ cantidadesConsumidas: original }, [
      { id: 'r1', cantidades: { status: 'PLAN_PORTIONS', items: [{ itemId: 'a', quantity: g(120), notEaten: false }] } },
      { id: 'r2', predecesoraId: 'r1', cantidades: { status: 'REPORTED', items: [{ itemId: 'a', quantity: g(100), notEaten: false }] } },
    ]);
    const v = cantidadesEfectivas(i)!;
    expect(v.fuente).toBe('RECTIFIED');
    expect(v.cantidades.status).toBe('REPORTED');
    expect(i.cantidadesConsumidas).toBe(original);
  });

  it('la forma v1 lleva solo cantidades conocidas: «no lo comí» y lo desconocido no tienen forma ahí', () => {
    const i = ingesta({
      cantidadesConsumidas: {
        status: 'REPORTED',
        items: [
          { itemId: 'a', quantity: g(120), notEaten: false },
          { itemId: 'b', quantity: null, notEaten: false },
          { itemId: 'c', quantity: null, notEaten: true },
        ],
      },
    });
    expect(itemsConsumidosV1(i)).toEqual([{ itemId: 'a', quantity: g(120) }]);
    // Una comida diferente no tiene cantidades.
    expect(cantidadesEfectivas(ingesta({ origen: 'FUERA_DE_PRESCRIPCION' }))).toBeNull();
    expect(itemsConsumidosV1(ingesta({ origen: 'FUERA_DE_PRESCRIPCION' }))).toEqual([]);
  });

  it('dos estados equivalentes son iguales aunque cambie el orden de los ítems o de las claves', () => {
    const a = { status: 'REPORTED' as const, items: [{ itemId: 'a', quantity: g(1), notEaten: false }, { itemId: 'b', quantity: null, notEaten: true }] };
    const b = { status: 'REPORTED' as const, items: [{ notEaten: true, quantity: null, itemId: 'b' }, { itemId: 'a', notEaten: false, quantity: g(1) }] };
    expect(mismasCantidades(a, b)).toBe(true);
    expect(mismasCantidades(a, { ...a, status: 'PLAN_PORTIONS' })).toBe(false);
  });
});
