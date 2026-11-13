/**
 * Las comidas de «Hoy» en Nutrición (WP-NUTRICION-RECETAS §9; API-ING-01): qué comida se muestra y qué registro tiene
 * cada una. Es lógica pura: `scripts/registro-de-comidas.test.mjs` la prueba sin teléfono.
 *
 * - **Las comidas salen del plan**, en su orden: desayuno, almuerzo, merienda y cena son ejemplos, no una lista fija.
 * - **Una comida tiene a lo sumo un registro efectivo por día** (DL-121): el de una opción del plan (`recordId`) o el de
 *   algo diferente comido en esa comida. Lo deshecho no cuenta: la comida queda libre para volver a registrarla.
 * - **«La que sigue»** (DL-170, AV2-10, con el paso 1 de AV2-D1 ratificado por Dirección el 2026-11-11) es la primera sin
 *   registrar que viene, en el orden del plan, después de la comida registrada hoy que va más adelante en el plan. Manda
 *   el orden del plan, no la hora de los registros. Las anteriores sin registrar quedan neutras; si después de la última
 *   registrada no queda ninguna, no se destaca ninguna; sin nada registrado, es la primera del plan. La comparten Inicio
 *   y Nutrición.
 * - **La comida que se muestra** es la que pidió Inicio al tocar su ficha (AV2-14) o la que eligió la persona, si sigue en
 *   el plan. Si no, «la que sigue»; y si no hay, la primera, como antes.
 */
import { COPY_REGISTRO_DE_COMIDAS, textoDeComidaRegistrada, type HoyConOpcionesResponse, type RegistroDeComida } from '@be/domain';

type Comida = HoyConOpcionesResponse['data']['meals'][number];
/** Una comida del plan, con su orden si se sabe: sin orden, vale el orden en que llegan. */
type ComidaEnOrden = Pick<Comida, 'mealId' | 'recordId'> & { readonly order?: number };

/** El registro efectivo de una comida hoy, o `null` si no tiene. */
export function registroDeLaComida(comida: Pick<Comida, 'mealId' | 'recordId'>, registros: readonly RegistroDeComida[]): RegistroDeComida | null {
  const vigentes = registros.filter((r) => r.annulment === null);
  if (comida.recordId) {
    const deLaOpcion = vigentes.find((r) => r.recordId === comida.recordId);
    if (deLaOpcion) return deLaOpcion;
  }
  // Algo diferente comido en esta comida: si hubiera más de uno, el último.
  return vigentes.filter((r) => r.meal?.mealId === comida.mealId).reduce<RegistroDeComida | null>((ultimo, r) => (ultimo === null || r.recordedAt > ultimo.recordedAt ? r : ultimo), null);
}

/** Si la comida tiene un registro hoy, aunque la respuesta no traiga su detalle. */
export const comidaRegistrada = (comida: Pick<Comida, 'mealId' | 'recordId'>, registros: readonly RegistroDeComida[]): boolean => comida.recordId !== null || registroDeLaComida(comida, registros) !== null;

/** Las comidas en el orden del plan. */
const enElOrdenDelPlan = <T extends { readonly order?: number }>(comidas: readonly T[]): T[] => [...comidas].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

/** La posición, en el orden del plan, de la comida registrada hoy que va más adelante; -1 si no hay ninguna. */
function ultimaRegistrada(comidas: readonly ComidaEnOrden[], registros: readonly RegistroDeComida[]): number {
  let ultima = -1;
  comidas.forEach((c, i) => {
    if (comidaRegistrada(c, registros)) ultima = i;
  });
  return ultima;
}

/**
 * «La que sigue» (AV2-10): la primera sin registrar después de la registrada hoy que va más adelante en el plan, o `null`
 * si después de esa no queda ninguna. Sin nada registrado, la primera del plan.
 */
export function laQueSigueEnElPlan(comidas: readonly ComidaEnOrden[], registros: readonly RegistroDeComida[]): string | null {
  const enOrden = enElOrdenDelPlan(comidas);
  return enOrden[ultimaRegistrada(enOrden, registros) + 1]?.mealId ?? null;
}

/** El estado de cada comida para las fichas de Inicio: registrada, la que sigue, una anterior sin registrar o una que viene. */
export type EstadoDeLaComida = 'registrada' | 'la-que-sigue' | 'sin-registrar' | 'por-venir';

/** El estado de cada comida, en el orden del plan (AV2-10): las anteriores sin registrar, neutras; las que vienen, sus opciones. */
export function estadosDeLasComidas(comidas: readonly ComidaEnOrden[], registros: readonly RegistroDeComida[]): ReadonlyMap<string, EstadoDeLaComida> {
  const enOrden = enElOrdenDelPlan(comidas);
  const ultima = ultimaRegistrada(enOrden, registros);
  const sigue = laQueSigueEnElPlan(enOrden, registros);
  return new Map(
    enOrden.map((c, i): [string, EstadoDeLaComida] => [c.mealId, comidaRegistrada(c, registros) ? 'registrada' : c.mealId === sigue ? 'la-que-sigue' : i < ultima ? 'sin-registrar' : 'por-venir']),
  );
}

/** La comida que pidió Inicio al tocar su ficha (AV2-14), si está en el plan de hoy; si no, la que eligió la persona. */
export const comidaPedidaOElegida = (pedida: string | null | undefined, elegida: string | null, comidas: readonly Pick<Comida, 'mealId'>[]): string | null =>
  pedida && comidas.some((c) => c.mealId === pedida) ? pedida : elegida;

/** La comida que se muestra en Nutrición: la elegida (o la pedida) si sigue en el plan; si no, «la que sigue»; si no hay, la primera. */
export function comidaQueSeMuestra(comidas: readonly ComidaEnOrden[], registros: readonly RegistroDeComida[], elegida: string | null | undefined): string | null {
  if (elegida && comidas.some((c) => c.mealId === elegida)) return elegida;
  const enOrden = enElOrdenDelPlan(comidas);
  return laQueSigueEnElPlan(enOrden, registros) ?? enOrden[0]?.mealId ?? null;
}

/** La letra del nombre de una ficha, en sp, su relleno de los dos lados y la separación entre fichas, en dp. */
export const LETRA_DE_LA_FICHA = 14;
export const RELLENO_DE_LA_FICHA = 12;
export const SEPARACION_DE_LAS_FICHAS = 6;
/** El ancho de un carácter en negrita, en proporción a la letra: algo más que lo medido de Roboto («Desayuno»: 0,52). */
const ANCHO_POR_CARACTER = 0.56;

/**
 * El ancho estimado de la palabra más larga de unos textos en negrita, en dp, con la letra de la persona: es lo mínimo
 * que pide su renglón, porque una palabra no se parte. Una escala menor que 1 cuenta como 1 (la cuenta queda holgada).
 * La usan las fichas de Nutrición y, desde DL-170, las de Inicio y los títulos de sus tarjetas chicas.
 */
export function anchoDeLaPalabraMasLarga(textos: readonly string[], letra: number, escala: number): number {
  const e = Math.max(1, Number.isFinite(escala) ? escala : 1);
  const caracteres = Math.max(0, ...textos.flatMap((t) => t.trim().split(/\s+/).map((p) => p.length)));
  return caracteres * letra * e * ANCHO_POR_CARACTER;
}

/** Las medidas de una ficha para repartirlas: la letra del nombre (sp), lo que ocupa además del nombre y la separación (dp). */
export interface MedidasDeLaFicha {
  readonly letra: number;
  readonly alrededor: number;
  readonly separacion: number;
}

/** La ficha de Nutrición: el nombre en 14 sp, con 12 dp de relleno entre los dos lados y 6 dp entre fichas. */
const FICHA_DE_NUTRICION: MedidasDeLaFicha = { letra: LETRA_DE_LA_FICHA, alrededor: RELLENO_DE_LA_FICHA, separacion: SEPARACION_DE_LAS_FICHAS };

/**
 * Cuántas fichas van por fila, repartidas parejas: todas en una fila si entran (cuatro a 360 dp con letra normal); si no,
 * las filas que hagan falta con la misma cantidad en cada una (dos y dos, tres y tres), en vez de dejar una sola abajo. El
 * nombre más largo no se parte: si tiene dos palabras, cuenta la más larga, que no se corta. Las medidas son las de la
 * ficha de Nutrición, salvo que se pidan otras (las de Inicio, `inicio-de-hoy.ts`).
 */
export function fichasPorFila(anchoDisponible: number, nombres: readonly string[], escala: number, medidas: MedidasDeLaFicha = FICHA_DE_NUTRICION): number {
  if (nombres.length === 0) return 1;
  const necesario = Math.max(48, anchoDeLaPalabraMasLarga(nombres, medidas.letra, escala) + medidas.alrededor);
  const entran = Math.max(1, Math.floor((anchoDisponible + medidas.separacion) / (necesario + medidas.separacion)));
  const filas = Math.ceil(nombres.length / entran);
  return Math.ceil(nombres.length / filas);
}

/** Cómo lee el lector de pantalla la ficha de una comida: «Almuerzo registrado» o «Merienda, sin registro». */
export const etiquetaDeLaComida = (nombre: string, registrada: boolean): string => (registrada ? textoDeComidaRegistrada(nombre) : COPY_REGISTRO_DE_COMIDAS.comidaSinRegistro(nombre));
