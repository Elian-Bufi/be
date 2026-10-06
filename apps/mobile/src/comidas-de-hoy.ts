/**
 * Las comidas de «Hoy» en Nutrición (WP-NUTRICION-RECETAS §9; API-ING-01): qué comida se muestra y qué registro tiene
 * cada una. Es lógica pura: `scripts/registro-de-comidas.test.mjs` la prueba sin teléfono.
 *
 * - **Las comidas salen del plan**, en su orden: desayuno, almuerzo, merienda y cena son ejemplos, no una lista fija.
 * - **Una comida tiene a lo sumo un registro efectivo por día** (DL-121): el de una opción del plan (`recordId`) o el de
 *   algo diferente comido en esa comida. Lo deshecho no cuenta: la comida queda libre para volver a registrarla.
 * - **La comida que se muestra** es la que eligió la persona, si sigue en el plan. Si no eligió, la primera sin registro,
 *   para seguir el día; y si todas tienen, la primera.
 */
import { COPY_REGISTRO_DE_COMIDAS, textoDeComidaRegistrada, type HoyConOpcionesResponse, type RegistroDeComida } from '@be/domain';

type Comida = HoyConOpcionesResponse['data']['meals'][number];

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

/** La comida que se muestra: la elegida si sigue en el plan; si no, la primera sin registro; y si todas tienen, la primera. */
export function comidaQueSeMuestra(comidas: readonly Pick<Comida, 'mealId' | 'recordId'>[], registros: readonly RegistroDeComida[], elegida: string | null | undefined): string | null {
  if (elegida && comidas.some((c) => c.mealId === elegida)) return elegida;
  return (comidas.find((c) => !comidaRegistrada(c, registros)) ?? comidas[0])?.mealId ?? null;
}

/** La letra del nombre de una ficha, en sp, su relleno de los dos lados y la separación entre fichas, en dp. */
export const LETRA_DE_LA_FICHA = 14;
export const RELLENO_DE_LA_FICHA = 12;
export const SEPARACION_DE_LAS_FICHAS = 6;
/** El ancho de un carácter en negrita, en proporción a la letra: algo más que lo medido de Roboto («Desayuno»: 0,52). */
const ANCHO_POR_CARACTER = 0.56;

/**
 * Cuántas fichas van por fila, repartidas parejas: todas en una fila si entran (cuatro a 360 dp con letra normal); si no,
 * las filas que hagan falta con la misma cantidad en cada una (dos y dos, tres y tres), en vez de dejar una sola abajo. El
 * nombre más largo no se parte: si tiene dos palabras, cuenta la más larga, que no se corta.
 */
export function fichasPorFila(anchoDisponible: number, nombres: readonly string[], escala: number): number {
  if (nombres.length === 0) return 1;
  const e = Math.max(1, Number.isFinite(escala) ? escala : 1);
  const palabraMasLarga = Math.max(...nombres.flatMap((n) => n.trim().split(/\s+/).map((p) => p.length)));
  const necesario = Math.max(48, palabraMasLarga * LETRA_DE_LA_FICHA * e * ANCHO_POR_CARACTER + RELLENO_DE_LA_FICHA);
  const entran = Math.max(1, Math.floor((anchoDisponible + SEPARACION_DE_LAS_FICHAS) / (necesario + SEPARACION_DE_LAS_FICHAS)));
  const filas = Math.ceil(nombres.length / entran);
  return Math.ceil(nombres.length / filas);
}

/** Cómo lee el lector de pantalla la ficha de una comida: «Almuerzo registrado» o «Merienda, sin registro». */
export const etiquetaDeLaComida = (nombre: string, registrada: boolean): string => (registrada ? textoDeComidaRegistrada(nombre) : COPY_REGISTRO_DE_COMIDAS.comidaSinRegistro(nombre));
