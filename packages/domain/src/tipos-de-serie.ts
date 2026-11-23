/**
 * DL-178 (decisión de Dirección del 2026-11-18) · las series de calentamiento.
 *
 * Dentro de un mismo ejercicio, el profesional indica series de calentamiento, escalonadas en carga, antes de las
 * efectivas. **Las de calentamiento se registran, pero no cuentan.** Este módulo es la única regla de qué es cada serie y
 * cómo se numera; lo usan la API, el website y la APK.
 *
 * - **El dato.** Cada serie (la indicada y la registrada) lleva `setKind`: `WORKING` (efectiva, por omisión) o `WARM_UP`.
 *   Ausente es `WORKING`: todo lo indicado y registrado antes de DL-178 queda con todas sus series efectivas, sin
 *   reescribir nada. Por eso se guarda solo `WARM_UP`, y una serie efectiva queda idéntica a las de antes.
 * - **El orden.** En el plan, las de calentamiento van arriba, antes de la primera efectiva
 *   (`WARM_UP_AFTER_WORKING_SET` al guardar).
 * - **La numeración.** `setIndex` sigue siendo la posición real de la serie (1, 2, 3… contando el calentamiento): es la
 *   identidad con la que se registra y se corrige, y no se toca. Lo que se muestra y lo que se compara entre sesiones es
 *   el **número efectivo**: las efectivas se numeran 1, 2, 3, como hoy, y las de calentamiento llevan «C». Sin
 *   calentamiento, el número efectivo es el `setIndex`, así que todo lo anterior responde igual.
 * - **Lo que no las usa.** El conteo de series, la tira de cada sesión, «La vez pasada», el historial del ejercicio,
 *   Analizar, el 1RM estimado (Epley v1), las comparaciones de etapas y los cruces: todos se apoyan en
 *   `compararEjecucion` o en `seriesEfectivas`, que las dejan afuera.
 *
 * Nada de esto califica: el calentamiento no es «menos» ni «mal hecho», es otra cosa.
 */
import type { TipoDeSerie } from './contratos-entrenamiento';
import { numero } from './formato-numeros';

/** Lo mínimo de una serie para saber su tipo. Sirve para la planificada, la registrada y las de la APK. */
export interface ConTipoDeSerie {
  readonly setKind?: TipoDeSerie | null;
}

/** El tipo de una serie; ausente es efectiva (`WORKING`). */
export const tipoDeSerie = (s: ConTipoDeSerie): TipoDeSerie => s.setKind ?? 'WORKING';
export const esDeCalentamiento = (s: ConTipoDeSerie): boolean => tipoDeSerie(s) === 'WARM_UP';
export const esEfectiva = (s: ConTipoDeSerie): boolean => tipoDeSerie(s) === 'WORKING';

/** Solo las series efectivas, en su orden. Es el filtro de todo lo que cuenta, promedia o compara. */
export function seriesEfectivas<T extends ConTipoDeSerie>(series: readonly T[]): T[] {
  return series.filter(esEfectiva);
}
export function seriesDeCalentamiento<T extends ConTipoDeSerie>(series: readonly T[]): T[] {
  return series.filter(esDeCalentamiento);
}

/**
 * Las series registradas de un ejercicio que son efectivas: sin las que el registro marca como calentamiento ni las que
 * ocupan el lugar de una de calentamiento indicada (`planificadas`, por `setIndex`). Es el filtro de lo que se estima,
 * se cuenta o se grafica a partir de lo registrado.
 */
export function registradasEfectivas<T extends ConTipoDeSerie & { readonly setIndex: number }>(
  registradas: readonly T[],
  planificadas: readonly (ConTipoDeSerie & { readonly setIndex: number })[] = [],
): T[] {
  const calentamiento = new Set(planificadas.filter(esDeCalentamiento).map((s) => s.setIndex));
  return registradas.filter((s) => esEfectiva(s) && !calentamiento.has(s.setIndex));
}

/** Si alguna serie es de calentamiento. */
export const tieneCalentamiento = (series: readonly ConTipoDeSerie[]): boolean => series.some(esDeCalentamiento);

/**
 * Lo que se guarda del tipo: solo `WARM_UP`. Una serie efectiva no lleva la clave, como todas las de antes de DL-178,
 * así que un plan o un registro sin calentamiento queda idéntico (su huella, su comparación «sin cambios»).
 */
export const tipoGuardado = (s: ConTipoDeSerie): { readonly setKind?: 'WARM_UP' } => (esDeCalentamiento(s) ? { setKind: 'WARM_UP' } : {});

/**
 * La primera serie de calentamiento que está después de una efectiva, por su posición (0 en adelante), o `null` si el
 * orden es el que pide DL-178: todo el calentamiento arriba.
 */
export function calentamientoFueraDeLugar(series: readonly ConTipoDeSerie[]): number | null {
  let vioEfectiva = false;
  for (let i = 0; i < series.length; i++) {
    if (esEfectiva(series[i]!)) vioEfectiva = true;
    else if (vioEfectiva) return i;
  }
  return null;
}

/** Las series con el calentamiento arriba, sin cambiar el orden dentro de cada tipo. */
export function conElCalentamientoArriba<T extends ConTipoDeSerie>(series: readonly T[]): T[] {
  return [...seriesDeCalentamiento(series), ...seriesEfectivas(series)];
}

/**
 * Los números efectivos de un ejercicio, por `setIndex`: las efectivas se numeran restando las de calentamiento que tienen
 * antes; las de calentamiento no tienen número (`null`). Recibe todas las series que se conocen del ejercicio (las
 * indicadas y las registradas, con su `setIndex`): una serie es de calentamiento si cualquiera de las dos lo dice, así un
 * calentamiento indicado y no registrado igual corre la numeración.
 *
 * Sin calentamiento, cada número efectivo es su `setIndex`: lo registrado antes de DL-178 responde igual.
 */
export function numerosEfectivos(series: readonly (ConTipoDeSerie & { readonly setIndex: number })[]): ReadonlyMap<number, number | null> {
  const calentamiento = new Set(series.filter(esDeCalentamiento).map((s) => s.setIndex));
  const indices = [...new Set(series.map((s) => s.setIndex))].sort((a, b) => a - b);
  const r = new Map<number, number | null>();
  let antes = 0;
  for (const i of indices) {
    if (calentamiento.has(i)) {
      r.set(i, null);
      antes++;
    } else r.set(i, i - antes);
  }
  return r;
}

/** Cómo se rotula cada serie de una lista, en su orden: las efectivas 1, 2, 3; las de calentamiento, «C». */
export interface RotuloDeSerie {
  readonly tipo: TipoDeSerie;
  /** El número efectivo; `null` en una de calentamiento. */
  readonly numero: number | null;
  /** «C» o el número: lo que va en la columna angosta. */
  readonly corto: string;
  /** «Calentamiento» o «Serie 2»: lo que se lee entero (y lo que dice un lector de pantalla). */
  readonly largo: string;
  /** «del calentamiento» o «de la serie 2»: para armar una frase («Repeticiones de la serie 2»). */
  readonly deLa: string;
}

/** El rótulo de un número efectivo (`null`: calentamiento). */
export function rotuloDelNumero(n: number | null): RotuloDeSerie {
  if (n === null) return { tipo: 'WARM_UP', numero: null, corto: COPY_TIPOS_DE_SERIE.marca, largo: COPY_TIPOS_DE_SERIE.calentamiento, deLa: 'del calentamiento' };
  return { tipo: 'WORKING', numero: n, corto: numero(n), largo: `${COPY_TIPOS_DE_SERIE.serie} ${numero(n)}`, deLa: `de la serie ${numero(n)}` };
}

/**
 * Los rótulos de una lista de series **contigua** (las de un plan, en su orden): la posición en la lista es la serie.
 * Para series que pueden tener huecos (lo registrado: una serie salteada no renumera las demás), `rotuloPorIndice`.
 */
export function rotulosDeLasSeries(series: readonly ConTipoDeSerie[]): RotuloDeSerie[] {
  let n = 0;
  return series.map((s) => {
    if (esDeCalentamiento(s)) return rotuloDelNumero(null);
    n++;
    return rotuloDelNumero(n);
  });
}

/**
 * El rótulo de cada serie por su `setIndex`, con todas las series que se conocen del ejercicio (las indicadas y las
 * registradas): una serie es de calentamiento si cualquiera de las dos lo dice (D-5), y una serie salteada no renumera las
 * que siguen. Un `setIndex` que no está en la lista (una serie de más) resta el calentamiento que tiene antes. Sin
 * calentamiento, el número es el `setIndex`, como antes de DL-178.
 */
export function rotuloPorIndice(series: readonly (ConTipoDeSerie & { readonly setIndex: number })[]): (setIndex: number) => RotuloDeSerie {
  const efectivos = numerosEfectivos(series);
  const calentamiento = [...efectivos].flatMap(([i, n]) => (n === null ? [i] : []));
  return (setIndex) => rotuloDelNumero(efectivos.has(setIndex) ? efectivos.get(setIndex)! : setIndex - calentamiento.filter((c) => c < setIndex).length);
}

/**
 * La primera serie registrada de calentamiento que va después de una efectiva (registrada o indicada), por su posición en
 * `registradas`, o `null`. Lo registrado sigue la misma regla que el plan: el calentamiento, antes de las efectivas. Una
 * serie es de calentamiento si lo dice el registro o el plan (D-5); una efectiva es la que ninguno de los dos marca.
 */
export function calentamientoRegistradoFueraDeLugar(
  registradas: readonly (ConTipoDeSerie & { readonly setIndex: number })[],
  planificadas: readonly (ConTipoDeSerie & { readonly setIndex: number })[] = [],
): number | null {
  const efectivos = numerosEfectivos([...planificadas, ...registradas]);
  const primeraEfectiva = Math.min(...[...efectivos].flatMap(([i, n]) => (n !== null ? [i] : [])));
  const i = registradas.findIndex((s) => esDeCalentamiento(s) && s.setIndex > primeraEfectiva);
  return i === -1 ? null : i;
}

/**
 * Cuántas series tiene algo. Sin calentamiento, como siempre: «4 series». Con calentamiento, cuenta las efectivas y lo
 * dice, y el calentamiento aparte: «3 series efectivas + 2 de calentamiento».
 */
export function cuentaDeSeries(series: readonly ConTipoDeSerie[]): string {
  const calentamiento = seriesDeCalentamiento(series).length;
  const efectivas = series.length - calentamiento;
  if (calentamiento === 0) return `${numero(efectivas)} ${efectivas === 1 ? 'serie' : 'series'}`;
  return `${COPY_TIPOS_DE_SERIE.efectivas(efectivas)} + ${COPY_TIPOS_DE_SERIE.deCalentamiento(calentamiento)}`;
}

/** Los textos de DL-178. Describen, no califican. */
export const COPY_TIPOS_DE_SERIE = {
  serie: 'Serie',
  calentamiento: 'Calentamiento',
  /** La marca corta de una serie de calentamiento, en el editor y en las tablas. */
  marca: 'C',
  efectivas: (n: number) => `${numero(n)} ${n === 1 ? 'serie efectiva' : 'series efectivas'}`,
  deCalentamiento: (n: number) => `${numero(n)} de calentamiento`,
  /** El interruptor del editor del plan. */
  marcarComoCalentamiento: 'Calentamiento',
  ayudaDelEditor: 'Marcá con «C» las series de calentamiento: van arriba, se registran y no entran en los cálculos ni en los gráficos.',
  /** Lo que se dice donde se cuentan o se grafican series. */
  noCuentan: 'Las series de calentamiento se registran, pero no entran en esta cuenta.',
  /** En el teléfono, sobre la serie. */
  enElTelefono: 'Se registra y no entra en tus gráficos ni en tus cuentas.',
} as const;
