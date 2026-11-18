/**
 * La fecha elegida de una página que la acota a lo que se ve (la de «Analizar», que vive en la URL), compartida con la
 * cinta del tiempo y sus gráficos (WP-GRAFICOS §3.8, DL-174; rama D). Es puro: lo prueba
 * `apps/web/test/graficos-cruces.test.mjs` (TEST-GRF-076).
 */

/** Lo que se ve: el primer y el último día. */
export interface IntervaloQueSeVe {
  readonly desde: string;
  readonly hasta: string;
}

/** Una fecha acotada a lo que se ve: lo de antes, a su primer día; lo de después, al último. */
export const acotarAlIntervalo = (fecha: string, i: IntervaloQueSeVe): string => (fecha < i.desde ? i.desde : fecha > i.hasta ? i.hasta : fecha);

/**
 * La fecha que ve quien eligió adentro (la cinta). Si eligió un evento que empieza antes de lo que se ve (la barra de una
 * versión vigente desde antes), la página guarda la fecha acotada y la cinta sigue viendo la suya. Sin esto, la cinta
 * dejaba de verlo elegido, y con el teclado la flecha volvía siempre al primer evento. Si la página cambió la fecha por
 * otro lado (un clic en un gráfico), manda la de la página. Sin intervalo, la de la página, como siempre.
 */
export function fechaVistaAdentro(deLaPagina: string | null, pedida: string | null, intervalo: IntervaloQueSeVe | null): string | null {
  if (pedida === null || deLaPagina === null || intervalo === null) return deLaPagina;
  return acotarAlIntervalo(pedida, intervalo) === deLaPagina ? pedida : deLaPagina;
}
