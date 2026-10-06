/**
 * «¿Cuánto comiste?» (WP-NUTRICION-RECETAS §7; DL-121; encargo de Dirección del 2026-10-05, §4): de lo que la persona
 * marcó y escribió en el detalle, el estado de las cantidades que viaja a la API (API-ING-02 al registrar, API-ING-05 al
 * completar). Es lógica pura: `scripts/registro-de-comidas.test.mjs` la prueba sin teléfono.
 *
 * - **Sin marcar nada: `UNCONFIRMED`.** Es el registro rápido, el mismo de «Comí esta opción» en el carrusel.
 * - **«Comí las porciones del plan»** empieza desmarcada: `PLAN_PORTIONS`. Lo previsto pasa a consumido solo así, porque
 *   la persona lo confirmó.
 * - **«Informar lo que comí de cada ingrediente»: `REPORTED`**, con una entrada por ingrediente:
 *   - un número mayor que cero, en la unidad del plan, escrito con coma o con punto (`leerNumero`);
 *   - «No lo comí»: aporta cero porque se declaró, y va sin cantidad;
 *   - vacío: sin confirmar. **Vacío no es cero.** El cero no se acepta como cantidad: para eso está «No lo comí».
 *   Si no se informó ningún ingrediente, es `UNCONFIRMED`: no hay nada que informar.
 * - **Un ingrediente sin cantidad en el plan no tiene unidad:** solo admite «No lo comí» o quedar sin confirmar. BE no
 *   elige una unidad por la persona.
 */
import { COPY_REGISTRO_DE_COMIDAS, leerNumero, motivoDeNumeroIlegible, numero, type ConsumoEntrada } from '@be/domain';

export type ModoDeCantidades = 'sin-confirmar' | 'porciones-del-plan' | 'informadas';

export interface CantidadesEnPantalla {
  readonly modo: ModoDeCantidades;
  /** Lo escrito en cada campo, por ítem, tal como se escribió. */
  readonly escritas: Readonly<Record<string, string>>;
  /** Los ítems marcados «No lo comí». */
  readonly noComidos: Readonly<Record<string, boolean>>;
}

/** Como empieza el detalle: nada marcado ni escrito. */
export const SIN_CANTIDADES: CantidadesEnPantalla = { modo: 'sin-confirmar', escritas: {}, noComidos: {} };

/** Lo que hace falta de un ítem de la opción: su identidad y la cantidad del plan, que da la unidad. */
export interface ItemParaInformar {
  readonly itemId: string;
  readonly quantity: { readonly value: number; readonly unit: 'g' | 'ml' | 'unit' } | null;
}

export type ConsumoArmado =
  | { readonly ok: true; readonly consumo: ConsumoEntrada }
  /** Los errores van por ítem, para mostrarlos debajo de su campo. */
  | { readonly ok: false; readonly errores: Readonly<Record<string, string>> };

/** Si el ítem tiene un campo para escribir cuánto se comió: solo si el plan le da una unidad. */
export const admiteCantidad = (item: ItemParaInformar): boolean => item.quantity !== null;

export function consumoDesdeLaPantalla(estado: CantidadesEnPantalla, items: readonly ItemParaInformar[]): ConsumoArmado {
  if (estado.modo === 'porciones-del-plan') return { ok: true, consumo: { status: 'PLAN_PORTIONS' } };
  if (estado.modo === 'sin-confirmar' || items.length === 0) return { ok: true, consumo: { status: 'UNCONFIRMED' } };
  const errores: Record<string, string> = {};
  const informados = items.map((item) => {
    if (estado.noComidos[item.itemId]) return { itemId: item.itemId, quantity: null, notEaten: true };
    const escrito = (estado.escritas[item.itemId] ?? '').trim();
    if (escrito === '' || !item.quantity) return { itemId: item.itemId, quantity: null, notEaten: false };
    const valor = leerNumero(escrito);
    if (valor === null) errores[item.itemId] = motivoDeNumeroIlegible(escrito);
    else if (valor <= 0) errores[item.itemId] = COPY_REGISTRO_DE_COMIDAS.ceroNoEsCantidad;
    return { itemId: item.itemId, quantity: valor !== null && valor > 0 ? { value: valor, unit: item.quantity.unit } : null, notEaten: false };
  });
  if (Object.keys(errores).length > 0) return { ok: false, errores };
  if (informados.every((i) => i.quantity === null && !i.notEaten)) return { ok: true, consumo: { status: 'UNCONFIRMED' } };
  return { ok: true, consumo: { status: 'REPORTED', items: informados } };
}

/** Lo que ya está registrado, como queda en pantalla al completar o corregir: la persona parte de lo que informó. */
export function pantallaDesdeElConsumo(
  consumo: { readonly status: 'UNCONFIRMED' | 'PLAN_PORTIONS' | 'REPORTED'; readonly items: readonly { readonly itemId: string; readonly quantity: { readonly value: number } | null; readonly notEaten: boolean }[] } | null,
): CantidadesEnPantalla {
  if (!consumo || consumo.status === 'UNCONFIRMED') return SIN_CANTIDADES;
  if (consumo.status === 'PLAN_PORTIONS') return { ...SIN_CANTIDADES, modo: 'porciones-del-plan' };
  const escritas: Record<string, string> = {};
  const noComidos: Record<string, boolean> = {};
  for (const i of consumo.items) {
    if (i.notEaten) noComidos[i.itemId] = true;
    else if (i.quantity) escritas[i.itemId] = numero(i.quantity.value);
  }
  return { modo: 'informadas', escritas, noComidos };
}

/** La pantalla sin lo que no cuenta: campos vacíos, «No lo comí» desmarcados y lo escrito fuera del modo elegido. */
function normalizada(estado: CantidadesEnPantalla): string {
  if (estado.modo !== 'informadas') return estado.modo;
  const escritas = Object.entries(estado.escritas)
    .map(([id, t]) => [id, t.trim()] as const)
    .filter(([id, t]) => t !== '' && !estado.noComidos[id])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const noComidos = Object.keys(estado.noComidos)
    .filter((id) => estado.noComidos[id])
    .sort();
  // Abrir los campos sin escribir nada es lo mismo que no informar.
  if (escritas.length === 0 && noComidos.length === 0) return 'sin-confirmar';
  return JSON.stringify([escritas, noComidos]);
}

/**
 * Si lo que hay en pantalla cambió respecto de cómo empezó: lo que se perdería al salir sin guardar. Al registrar, el
 * punto de partida es `SIN_CANTIDADES`; al completar o corregir, lo que ya estaba registrado.
 */
export function cambiaronLasCantidades(actual: CantidadesEnPantalla, inicial: CantidadesEnPantalla = SIN_CANTIDADES): boolean {
  return normalizada(actual) !== normalizada(inicial);
}
