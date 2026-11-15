/**
 * Lo que dice a la vista un gráfico de la base, debajo y arriba del dibujo (WP-GRAFICOS §5; revisión de #283). La pasada
 * visual mandaba a «Cómo leerlo» (cerrado) todo lo que no fuera exactamente la frase fija de los cruces, y con un solo
 * carril el método dejaba de verse. §5 manda sobre la guía visual:
 * - **Las notas se ven todas** (`notasALaVista`): la frase fija (también con algo agregado: «… Ventana: 4 semanas»), lo
 *   que también cambió en esa ventana (§5.1), una media con su cantidad (§5.13), lo cargado después (§5.14), la cuenta de
 *   lo que no entra en la escala (explica la muesca) y los cambios de lo indicado que no entraron en la línea de su
 *   versión (§5.12). A «Cómo leerlo» va solo lo que el llamador pide como aclaración.
 * - **El método, a la vista** (`lineaTenueDelGrafico`, §5.6): con un solo carril no se dibuja su renglón, así que el
 *   método va en la línea tenue, aunque el llamador pase la suya.
 *
 * Es puro: lo prueba `apps/web/test/graficos-base.test.mjs`.
 */
import { FRASE_DE_LA_COINCIDENCIA } from '@be/domain';
import { COPY_DE_LOS_GRAFICOS } from './copy';

/** Las notas que van debajo del gráfico, en orden: las del llamador, lo cargado después, la muesca y lo indicado. */
export function notasALaVista(e: {
  readonly notas: readonly string[];
  /** «3 tomas cargadas después», una por carril (sin mayúscula ni punto). */
  readonly tarde: readonly string[];
  readonly fueraDeLaEscala: number;
  /** Los cambios de lo indicado que no entraron enteros en la línea de su versión, en texto. */
  readonly cambiosRecortados: readonly string[];
}): string[] {
  return [
    ...e.notas,
    ...e.tarde.map((x) => `${x.charAt(0).toUpperCase()}${x.slice(1)}.`),
    ...(e.fueraDeLaEscala > 0 ? [COPY_DE_LOS_GRAFICOS.fueraDeLaEscala(e.fueraDeLaEscala)] : []),
    ...(e.cambiosRecortados.length > 0 ? [COPY_DE_LOS_GRAFICOS.cambiosDeLoIndicado(e.cambiosRecortados)] : []),
  ];
}

/** Si una nota va como la frase fija de los cruces (en su línea tenue): la frase, sola o con algo agregado. */
export const esLaFraseFija = (nota: string): boolean => nota.startsWith(FRASE_DE_LA_COINCIDENCIA);

/** La línea tenue debajo del título: la del llamador o la unidad y el período; con un solo carril, también el método. */
export function lineaTenueDelGrafico(e: { readonly detalle: string | undefined; readonly porDefecto: string; readonly metodo: string | null }): string {
  const base = e.detalle ?? e.porDefecto;
  return e.metodo && !base.includes(e.metodo) ? `${base} · ${e.metodo}` : base;
}
