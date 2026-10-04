/**
 * Cómo se acomodan los cinco destinos de la barra (DL-117; cierre del 2026-10-04). Es lógica pura, sin React: la usa
 * `barra-de-zonas.tsx`, y la prueba `scripts/barra-de-zonas.test.mjs` sin teléfono.
 *
 * Las etiquetas crecen con la letra de la persona, sin tope. Para que entren, el orden de prioridades es:
 * 1. **Reparto:** cada destino mide lo que su etiqueta, más una parte igual de lo que sobra («Inicio» cede lugar a
 *    «Entrenamiento»).
 * 2. **Espacio útil:** en un teléfono angosto, la cápsula se acerca a los bordes (márgenes de 12, 8 o 6 dp).
 * 3. **Alto:** si las cinco no entran en una fila con al menos el 90 % del tamaño pedido, la cápsula pasa a **dos filas**:
 *    Inicio, Nutrición y Entrenamiento arriba; Evolución e Información abajo. Es una adaptación excepcional y una
 *    decisión visual explícita: la cápsula deja de ser una píldora y queda como un rectángulo de esquinas redondeadas,
 *    con el mismo orden de lectura.
 * 4. **Letra:** solo si aun en dos filas no entran, la etiqueta baja lo justo para no cortarse (`escalaEfectiva`).
 *
 * El ancho de cada etiqueta sale de medirla con Roboto, la letra de Android, en negrita (la de la elegida, la más ancha),
 * con una holgura del 4 %. Con otra letra del sistema la estimación puede quedar corta: la etiqueta igual se achica lo
 * justo en el teléfono y nunca se corta.
 */
import type { Zona } from './navegacion';

/** El tamaño de las etiquetas en sp, antes de la escala de la persona. */
export const LETRA_DE_LA_BARRA = 12;

/** El ancho de cada etiqueta en «em» (veces el tamaño de la letra), medido con Roboto 700 en el render del navegador. */
export const ANCHO_DE_LAS_ETIQUETAS_EN_EM: Readonly<Record<Zona, number>> = {
  inicio: 2.4678,
  nutricion: 4.1456,
  entrenamiento: 6.5753,
  evolucion: 4.3488,
  informacion: 5.4538,
};

/** Lo que se suma a la medida por si la letra del teléfono es un poco más ancha que la del navegador. */
const HOLGURA = 1.04;
/** El ancho mínimo de un destino (un objetivo táctil) y su relleno de cada lado. */
const ANCHO_MINIMO_DEL_DESTINO = 48;
const RELLENO_DEL_DESTINO = 2;
/** El relleno y el borde de la cápsula, de cada lado. */
const RELLENO_DE_LA_CAPSULA = 3;
const BORDE_DE_LA_CAPSULA = 1;
/** Con menos de esto del tamaño pedido, una fila no alcanza y la cápsula pasa a dos. */
export const TOLERANCIA_EN_UNA_FILA = 0.9;

/** El margen de la cápsula a cada lado: en un teléfono angosto, la cápsula gana ancho antes que achicar las etiquetas. */
export function margenDeLaBarra(anchoDePantalla: number): number {
  return anchoDePantalla < 340 ? 6 : anchoDePantalla < 400 ? 8 : 12;
}

export interface DisposicionDeLaBarra {
  /** Los destinos de cada fila, en el orden de la barra. */
  readonly filas: readonly (readonly Zona[])[];
  readonly margen: number;
  /** El ancho que tienen los destinos dentro de la cápsula. */
  readonly anchoUtil: number;
  /** La escala de letra que pidió la persona. */
  readonly escalaPedida: number;
  /** La escala con que se estima que quedan las etiquetas: igual a la pedida si entran sin achicarse. */
  readonly escalaEfectiva: number;
}

/** El ancho que pide una fila de destinos con la letra a una escala dada. */
function anchoDeLaFila(zonas: readonly Zona[], escala: number): number {
  return zonas.reduce((total, z) => total + Math.max(ANCHO_MINIMO_DEL_DESTINO, ANCHO_DE_LAS_ETIQUETAS_EN_EM[z] * LETRA_DE_LA_BARRA * escala * HOLGURA + 2 * RELLENO_DEL_DESTINO), 0);
}

/** La proporción del tamaño pedido con que entra una fila: 1 si entra entera. */
function proporcionQueEntra(zonas: readonly Zona[], escala: number, anchoUtil: number): number {
  return Math.min(1, anchoUtil / anchoDeLaFila(zonas, escala));
}

export function disposicionDeLaBarra({ anchoDePantalla, escalaDeLetra, zonas }: { anchoDePantalla: number; escalaDeLetra: number; zonas: readonly Zona[] }): DisposicionDeLaBarra {
  const escalaPedida = Math.max(escalaDeLetra, 0.85);
  const margen = margenDeLaBarra(anchoDePantalla);
  const anchoUtil = anchoDePantalla - 2 * margen - 2 * RELLENO_DE_LA_CAPSULA - 2 * BORDE_DE_LA_CAPSULA;
  const enUna = proporcionQueEntra(zonas, escalaPedida, anchoUtil);
  if (enUna >= TOLERANCIA_EN_UNA_FILA || zonas.length < 4) {
    return { filas: [zonas], margen, anchoUtil, escalaPedida, escalaEfectiva: escalaPedida * enUna };
  }
  const corte = Math.ceil(zonas.length / 2);
  const filas = [zonas.slice(0, corte), zonas.slice(corte)];
  const enDos = Math.min(...filas.map((f) => proporcionQueEntra(f, escalaPedida, anchoUtil)));
  return { filas, margen, anchoUtil, escalaPedida, escalaEfectiva: escalaPedida * enDos };
}
