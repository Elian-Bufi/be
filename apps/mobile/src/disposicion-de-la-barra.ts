/**
 * Cómo se acomodan los cinco destinos de la barra (DL-117; cierre del 2026-10-04). Es lógica pura, sin React: la usa
 * `barra-de-zonas.tsx`, y la prueba `scripts/barra-de-zonas.test.mjs` sin teléfono.
 *
 * Las etiquetas crecen con la letra de la persona, sin tope. Para que entren, el orden de prioridades es:
 * 1. **Reparto:** cada destino mide lo que su etiqueta, más una parte igual de lo que sobra («Inicio» cede lugar a
 *    «Entrenamiento»).
 * 2. **Espacio útil:** en un teléfono angosto, la cápsula se acerca a los bordes (márgenes de 12, 8 o 6 dp).
 * 3. **Alto:** si las cinco no entran en una fila con el tamaño pedido (DL-166), la cápsula pasa a **dos filas**:
 *    Inicio, Nutrición y Entrenamiento arriba; Evolución y Perfil abajo. Es una adaptación excepcional y una
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
  // DL-166: «Perfil» reemplaza a «Información» (5,4538 em). Estimado con los anchos de Roboto 700 de las letras que
  // comparte con las etiquetas medidas, y redondeado hacia arriba; se mide en el render con la candidata (AV-16).
  perfil: 2.62,
};

/** Lo que se suma a la medida por si la letra del teléfono es un poco más ancha que la del navegador. */
const HOLGURA = 1.04;
/** El ancho mínimo de un destino (un objetivo táctil) y su relleno de cada lado. */
const ANCHO_MINIMO_DEL_DESTINO = 48;
const RELLENO_DEL_DESTINO = 2;
/** El relleno y el borde de la cápsula, de cada lado. */
const RELLENO_DE_LA_CAPSULA = 3;
const BORDE_DE_LA_CAPSULA = 1;
/**
 * Con menos de esto del tamaño pedido, una fila no alcanza y la cápsula pasa a dos. Desde DL-166 (AV-02 y maqueta 08) es
 * 1: en una fila, ninguna etiqueta se achica. Con «Perfil», más corta que «Información», las cinco entraban con letra ×1,3
 * en 360 dp achicándose al 97 %; ahora pasan a dos filas enteras, como pide la maqueta: cambia la composición y la
 * letra no se achica (AVT-01).
 */
export const TOLERANCIA_EN_UNA_FILA = 1;

/**
 * El alto mínimo de un destino, en dp (DL-170, AV2-06): la barra es más fina que antes (56) y sigue por encima de los 48
 * del objetivo táctil.
 */
export const ALTO_DEL_DESTINO = 52;

/**
 * El token del fondo de la barra: flotante, el vidrio (`barraVidrio`); fija durante la sesión, `fondo`, opaco: nada se ve
 * a través de ella (PV-11, DL-166).
 */
export const tokenDelFondoDeLaBarra = (fija: boolean): 'fondo' | 'barraVidrio' => (fija ? 'fondo' : 'barraVidrio');

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

// ─── Dónde termina el contenido (hallazgos 5 y 12 de la 0.25 y la 0.26) ───────────────────────────────

/** Lo que la cápsula flota por encima del área segura de abajo, en dp. */
export const SEPARACION_DE_LA_BARRA = 10;

/** El aire entre lo último del contenido y el borde de abajo del área que se desplaza, en dp. */
export const AIRE_AL_FINAL = 16;

/** El alto del fundido con que el contenido se apaga justo arriba de la barra, en dp. */
export const ALTO_DEL_FUNDIDO = 20;

/**
 * El alto de la barra antes de medirla (el primer dibujo de una pantalla), en dp: cada fila mide su destino, que crece
 * con la letra (el ícono de 28, la etiqueta de 16 sp y su relleno), más el borde y el relleno de la cápsula. Fija, suma
 * su línea de arriba y su relleno, sin el área segura, que se suma aparte.
 */
export function altoEstimadoDeLaBarra(filas: number, escalaDeLetra: number, fija: boolean): number {
  const destino = Math.max(ALTO_DEL_DESTINO, Math.ceil(28 + 1 + 16 * Math.max(escalaDeLetra, 1) + 8));
  const entreFilas = (filas - 1) * 2;
  if (fija) return filas * destino + entreFilas + 1 + 4 + 4;
  return filas * destino + entreFilas + 2 * BORDE_DE_LA_CAPSULA + 2 * (filas > 1 ? 6 : 4);
}

/** Dónde termina el área que se desplaza y cuánto aire deja el contenido al final. */
export interface LugarDelContenido {
  /** Lo que el área que se desplaza deja libre abajo, en dp: ahí van la barra, su separación y el área segura. */
  readonly margenAbajo: number;
  /** El relleno al final del contenido, en dp. */
  readonly rellenoAbajo: number;
  /** Si el contenido se apaga en un fundido justo arriba de la barra flotante. */
  readonly fundido: boolean;
}

/**
 * El único lugar que decide dónde termina el contenido de todas las pantallas (App.tsx; Material 3 y HIG: lo que se
 * toca no queda debajo de la navegación):
 * - **Con la barra flotante**, el área que se desplaza termina donde empieza la cápsula: su alto, su separación y el área
 *   segura quedan fuera. Nada pasa por detrás de la barra, ni al final ni a mitad de camino («Empezar» de Torso A en
 *   Inicio, «Comí algo diferente» en Nutrición, «Tiempos de la sesión» en el cierre). El contenido se apaga en un
 *   fundido corto justo arriba, en lugar de cortarse de golpe.
 * - **Fijas, durante la sesión,** la barra (que ya incluye el área segura) y la fila de acciones quedan fuera igual.
 * - **Antes de medirla**, la barra cuenta con su alto estimado; **oculta** (con el teclado abierto), no ocupa nada.
 * - **Sin barra**, el área llega abajo y el contenido deja el área segura y su aire.
 *
 * `altoDeLaBarra`: `null` mientras no se midió; 0 si está oculta.
 */
export function lugarDelContenido({
  conBarra,
  fija,
  altoDeLaBarra,
  altoDeLaFila,
  insetAbajo,
  filas,
  escalaDeLetra,
}: {
  conBarra: boolean;
  fija: boolean;
  altoDeLaBarra: number | null;
  altoDeLaFila: number;
  insetAbajo: number;
  filas: number;
  escalaDeLetra: number;
}): LugarDelContenido {
  const sinBarra: LugarDelContenido = { margenAbajo: 0, rellenoAbajo: 2 * AIRE_AL_FINAL + insetAbajo, fundido: false };
  if (!conBarra) return sinBarra;
  if (fija) {
    const barra = altoDeLaBarra ?? altoEstimadoDeLaBarra(filas, escalaDeLetra, true) + insetAbajo;
    return { margenAbajo: barra + altoDeLaFila, rellenoAbajo: AIRE_AL_FINAL, fundido: false };
  }
  const barra = altoDeLaBarra ?? altoEstimadoDeLaBarra(filas, escalaDeLetra, false);
  if (barra === 0) return sinBarra;
  // Al final del desplazamiento, lo último queda entero arriba del fundido: el aire no es menor que su alto.
  return { margenAbajo: barra + SEPARACION_DE_LA_BARRA + insetAbajo, rellenoAbajo: Math.max(AIRE_AL_FINAL, ALTO_DEL_FUNDIDO), fundido: true };
}
