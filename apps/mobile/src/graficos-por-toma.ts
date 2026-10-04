/**
 * Los gráficos chicos de «Mi evolución»: qué hay de una medida en cada toma y dónde va cada punto (DL-117; cierre del
 * 2026-10-04). Es lógica pura, sin React: la usan `pantallas/antropometria.tsx` y `pantallas/puntos-por-toma.tsx`, y
 * la prueba `scripts/selector-de-tomas.test.mjs` sin teléfono.
 *
 * **Una sola elección.** La toma elegida en el selector decide, a la vez, el resumen que muestran el mapa y los
 * indicadores, el punto resaltado de cada gráfico y el grupo de comparabilidad con que se lee cada medida
 * (`puntosDeLaToma`).
 *
 * **El eje es el orden de las tomas, no el tiempo.** Las tomas van a la misma distancia, T1 a la izquierda y la última a
 * la derecha, aunque entre dos tomas pasen días distintos. El gráfico detallado de una medida, en «Evolución», sí usa
 * las fechas a escala. Por eso los gráficos chicos llevan rotulados sus extremos («T1 … T6») y la pantalla lo dice.
 *
 * **No desborda.** El ancho es el del lugar donde va el gráfico. Lo que se adapta es la separación y el radio: con doce
 * tomas en una fila angosta, los puntos se achican y no se superponen ni se salen.
 *
 * En cada toma hay una de tres cosas (REG-06-162/165/166):
 * - **un valor** del mismo grupo de comparabilidad que el de la toma elegida: un punto;
 * - **otro grupo** (otro protocolo, método o unidad): una raya corta sobre la base, que no es un valor y no se compara;
 * - **sin dato**: nada. Un hueco no es un cero ni el valor anterior, y ninguna línea une dos tomas.
 */
import { tomaDe, valoresPorToma, type EvolucionResponse, type MedidaDeLaToma, type Observacion, type TomaDelPeriodo, type UltimaToma } from '@be/domain';

type Datos = EvolucionResponse['data'];

export type EnLaToma =
  | { readonly tipo: 'valor'; readonly observacion: Observacion }
  | { readonly tipo: 'otro-grupo'; readonly observacion: Observacion }
  | { readonly tipo: 'sin-dato' };

/**
 * Qué hay de una medida en cada toma. `valores` son los del grupo de la toma elegida (`valoresPorToma`, en @be/domain).
 * Donde no hay valor, `resumenes` (el de cada toma, con `tomaDe`) dice si la toma tiene la medida con otro grupo.
 */
export function enCadaToma(metrica: string, valores: readonly (Observacion | null)[], resumenes: readonly (Pick<UltimaToma, 'medidas' | 'derivadas'> | null)[]): readonly EnLaToma[] {
  return valores.map((o, i): EnLaToma => {
    if (o) return { tipo: 'valor', observacion: o };
    const r = resumenes[i];
    const otra = r ? [...r.medidas, ...r.derivadas].find((m) => m.metrica === metrica) : undefined;
    return otra ? { tipo: 'otro-grupo', observacion: otra.actual } : { tipo: 'sin-dato' };
  });
}

/**
 * El resumen de cada toma se calcula una vez por respuesta: al volver a la zona con lo recordado, o al volver a elegir
 * una toma, no se repite. Se guarda con la respuesta como clave débil, así se va con ella cuando se olvida.
 */
const resumenes = new WeakMap<Datos, Map<string, UltimaToma | null>>();
export function resumenDe(datos: Datos, evaluacionId: string): UltimaToma | null {
  let porToma = resumenes.get(datos);
  if (!porToma) {
    porToma = new Map();
    resumenes.set(datos, porToma);
  }
  if (!porToma.has(evaluacionId)) porToma.set(evaluacionId, tomaDe(datos, evaluacionId));
  return porToma.get(evaluacionId) ?? null;
}

/** Lo que un gráfico chico necesita de la toma: las tomas del período, cuál es la elegida y qué hay de cada medida. */
export interface PuntosDeLaToma {
  readonly tomas: readonly TomaDelPeriodo[];
  /** El índice de la toma elegida en `tomas`. */
  readonly elegida: number;
  readonly estados: (m: MedidaDeLaToma) => readonly EnLaToma[];
}

/**
 * Para la toma elegida: qué hay de cada medida en cada toma, leído con el grupo de comparabilidad de su valor en la
 * elegida (`valoresPorToma`), con otro grupo, o nada (`enCadaToma`). Se calcula una vez por medida y grupo.
 */
export function puntosDeLaToma(datos: Datos, tomas: readonly TomaDelPeriodo[], evaluacionId: string): PuntosDeLaToma {
  const resumenesDeLasTomas = tomas.map((t) => resumenDe(datos, t.evaluacionId));
  const calculados = new Map<string, readonly EnLaToma[]>();
  return {
    tomas,
    elegida: tomas.findIndex((t) => t.evaluacionId === evaluacionId),
    estados: (m) => {
      const clave = `${m.metrica}|${m.actual.punto.comparabilityGroup}`;
      let estados = calculados.get(clave);
      if (!estados) {
        estados = enCadaToma(m.metrica, valoresPorToma(datos, m.metrica, m.actual.punto.comparabilityGroup, tomas), resumenesDeLasTomas);
        calculados.set(clave, estados);
      }
      return estados;
    },
  };
}

export interface GeometriaDePuntos {
  readonly ancho: number;
  readonly alto: number;
  /** La base, de lado a lado: una referencia fija, no una línea entre valores. */
  readonly base: { readonly x1: number; readonly x2: number; readonly y: number };
  readonly puntos: readonly { readonly indice: number; readonly x: number; readonly y: number; readonly radio: number; readonly elegida: boolean }[];
  /** Las tomas con la medida en otro grupo: una raya vertical corta, en la x de esa toma. */
  readonly marcas: readonly { readonly indice: number; readonly x: number; readonly y1: number; readonly y2: number }[];
  /** La x de cada toma. */
  readonly xs: readonly number[];
}

/** El radio de la toma elegida y el de las demás, cuando hay lugar. */
export const RADIO_DE_LA_ELEGIDA = 5;
export const RADIO_DE_LAS_DEMAS = 3.5;
/** Lo que queda entre dos puntos vecinos, como mínimo, para que no se toquen. */
const LUZ = 1;

/**
 * Dónde va cada punto en un gráfico de `ancho` × `alto` dp. `null` con menos de dos tomas: un solo punto no muestra un
 * recorrido, y el valor ya está escrito al lado.
 *
 * - En x, la toma `i` va en `margen + i × separación`. El margen es el radio de la elegida y un poco más, así ningún
 *   punto se sale por los costados.
 * - Los radios bajan con la separación, en la misma proporción, hasta que dos vecinos quedan a `LUZ` dp. También bajan
 *   con el alto, para que el punto quepa entre el techo y la base.
 * - En y, el valor más alto arriba y el más bajo abajo. Con todos iguales, a media altura: no hay escala que inventar.
 */
export function geometriaDePuntos({ ancho, alto, estados, elegida }: { ancho: number; alto: number; estados: readonly EnLaToma[]; elegida: number }): GeometriaDePuntos | null {
  const n = estados.length;
  if (n < 2 || ancho <= 0 || alto <= 0) return null;
  const tope = Math.min(RADIO_DE_LA_ELEGIDA, alto / 5);
  const margen = tope + LUZ;
  const separacion = (ancho - 2 * margen) / (n - 1);
  const k = Math.min(1, (separacion - LUZ) / (tope + tope * (RADIO_DE_LAS_DEMAS / RADIO_DE_LA_ELEGIDA)));
  const radioElegida = Math.max(0.5, tope * k);
  const radioDemas = Math.max(0.5, tope * (RADIO_DE_LAS_DEMAS / RADIO_DE_LA_ELEGIDA) * k);
  const xs = estados.map((_, i) => margen + i * separacion);
  const yBase = alto - 0.5;
  const techo = radioElegida + LUZ;
  const piso = yBase - LUZ - radioElegida;
  const numeros = estados.flatMap((e) => (e.tipo === 'valor' ? [e.observacion.punto.value] : []));
  const minimo = Math.min(...numeros);
  const maximo = Math.max(...numeros);
  const y = (v: number) => (maximo === minimo ? (techo + piso) / 2 : techo + (1 - (v - minimo) / (maximo - minimo)) * (piso - techo));
  const largoDeLaMarca = Math.max(3, Math.min(7, alto / 3));
  return {
    ancho,
    alto,
    base: { x1: margen, x2: ancho - margen, y: yBase },
    puntos: estados.flatMap((e, i) => (e.tipo === 'valor' ? [{ indice: i, x: xs[i]!, y: y(e.observacion.punto.value), radio: i === elegida ? radioElegida : radioDemas, elegida: i === elegida }] : [])),
    marcas: estados.flatMap((e, i) => (e.tipo === 'otro-grupo' ? [{ indice: i, x: xs[i]!, y1: yBase - largoDeLaMarca, y2: yBase }] : [])),
    xs,
  };
}
