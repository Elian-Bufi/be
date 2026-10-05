/**
 * La geometría del gráfico de evolución de la APK: dónde va cada observación, qué marcas llevan los ejes y qué punto
 * se elige con un toque. Es lógica pura, sin React: la usa `GraficoDeEvolucion` (pantallas/grafico-de-evolucion.tsx) y la
 * prueba `scripts/grafico-de-evolucion.test.mjs`.
 *
 * Reglas (las mismas del gráfico del website; REG-06-165/166, INV-06-176/177):
 * - **Solo puntos, sobre un eje temporal a escala**, recortado al período en la zona horaria del período. Nada une dos
 *   observaciones: un tramo sin medición queda vacío. Sin interpolación, suavizado ni tendencia calculada.
 * - **Un eje por grupo de comparabilidad.** Quien llama pasa las observaciones de un solo grupo: nunca se mezclan
 *   unidades, métodos ni protocolos en un mismo eje.
 * - **El eje vertical** usa la regla común (`dominioDelEjeVertical`): no fuerza el cero, y tiene un margen de al menos una
 *   unidad del eje y del 5 %, así una diferencia chica no parece enorme. La unidad es 1 para las medidas de 10 o más, y
 *   la décima o la centésima para los índices (DL-111). Las marcas muestran el rango, siempre.
 */
import { decimalesDelEje, dominioDelEjeVertical, limitesDelPeriodo, marcasDelPeriodo, unidadDelEje, type Observacion } from '@be/domain';

export interface PuntoDelGrafico {
  readonly indice: number;
  readonly x: number;
  readonly y: number;
  readonly observacion: Observacion;
}

export interface ComposicionDelGrafico {
  readonly ancho: number;
  readonly alto: number;
  /** El rectángulo donde van los puntos. */
  readonly area: { readonly izquierda: number; readonly derecha: number; readonly arriba: number; readonly abajo: number };
  readonly puntos: readonly PuntoDelGrafico[];
  /** Las fechas del eje temporal que entran sin pisarse. */
  readonly marcasX: readonly { readonly x: number; readonly fecha: string }[];
  readonly marcasY: readonly { readonly y: number; readonly valor: number }[];
  readonly dominio: { readonly desde: number; readonly hasta: number };
}

/** Un paso «redondo» (1, 2 o 5 por una potencia de diez) que deja unas `cantidad` marcas entre `desde` y `hasta`. */
export function pasoRedondo(desde: number, hasta: number, cantidad = 4): number {
  const crudo = Math.max(hasta - desde, Number.EPSILON) / Math.max(1, cantidad);
  const potencia = 10 ** Math.floor(Math.log10(crudo));
  const fraccion = crudo / potencia;
  const redondo = fraccion <= 1 ? 1 : fraccion <= 2 ? 2 : fraccion <= 5 ? 5 : 10;
  return redondo * potencia;
}

/** Las marcas del eje vertical: múltiplos del paso redondo dentro del dominio, sin errores de coma flotante. */
export function marcasVerticales(desde: number, hasta: number, cantidad = 4): number[] {
  const paso = pasoRedondo(desde, hasta, cantidad);
  const decimales = Math.max(0, -Math.floor(Math.log10(paso)));
  const marcas: number[] = [];
  for (let v = Math.ceil(desde / paso) * paso; v <= hasta + paso * 1e-9; v += paso) marcas.push(Number(v.toFixed(decimales)));
  return marcas;
}

export interface EntradaDelGrafico {
  readonly observaciones: readonly Observacion[];
  readonly periodo: { readonly start: string; readonly end: string };
  readonly zonaHoraria: string;
  readonly ancho: number;
  readonly alto: number;
  /** La escala de letra del sistema: los márgenes de los rótulos crecen con ella. */
  readonly escalaDeLetra: number;
  /** El ancho estimado de un rótulo, para no pisar marcas. */
  readonly anchoDelTexto: (texto: string, tamano: number) => number;
  readonly formatoDelValor: (valor: number) => string;
  readonly formatoDeLaFecha: (fecha: string) => string;
}

export function componerGrafico(e: EntradaDelGrafico): ComposicionDelGrafico {
  const escala = Math.max(1, e.escalaDeLetra);
  const valores = e.observaciones.map((o) => o.punto.value);
  const dominio = valores.length === 0 ? { desde: 0, hasta: 1 } : dominioDelEjeVertical(Math.min(...valores), Math.max(...valores));
  const valoresY = marcasVerticales(dominio.desde, dominio.hasta);
  const tamanoDeRotulo = 12 * escala;
  const izquierda = 8 + Math.max(...valoresY.map((v) => e.anchoDelTexto(e.formatoDelValor(v), tamanoDeRotulo)), 0) + 6;
  // Arriba queda lugar para la etiqueta del valor elegido; abajo, para las fechas.
  const area = { izquierda, derecha: e.ancho - 12, arriba: 18 + 22 * escala, abajo: e.alto - (10 + 18 * escala) };
  const { desde, hasta } = limitesDelPeriodo(e.periodo, e.zonaHoraria);
  const x = (instante: number) => area.izquierda + ((instante - desde) / Math.max(1, hasta - desde)) * (area.derecha - area.izquierda);
  const y = (valor: number) => area.abajo - ((valor - dominio.desde) / Math.max(Number.EPSILON, dominio.hasta - dominio.desde)) * (area.abajo - area.arriba);

  const puntos = e.observaciones.map((observacion, indice) => ({ indice, x: x(observacion.instante), y: y(observacion.punto.value), observacion }));

  // Las fechas del eje: las del período, salteando las que pisarían a la anterior con la letra de la persona.
  const marcasX: { x: number; fecha: string }[] = [];
  let finAnterior = -Infinity;
  for (const m of marcasDelPeriodo(e.periodo, e.zonaHoraria)) {
    const mx = x(m.instante);
    const mitad = e.anchoDelTexto(e.formatoDeLaFecha(m.fecha), tamanoDeRotulo) / 2;
    if (mx - mitad < finAnterior + 6 || mx + mitad > e.ancho || mx - mitad < 0) continue;
    marcasX.push({ x: mx, fecha: m.fecha });
    finAnterior = mx + mitad;
  }
  return { ancho: e.ancho, alto: e.alto, area, puntos, marcasX, marcasY: valoresY.map((v) => ({ y: y(v), valor: v })), dominio };
}

/**
 * El punto que elige un toque: el más cercano dentro de `radio` dp, o ninguno. Con dos puntos casi encima, gana el más
 * cercano. Los botones «Anterior» y «Siguiente» de la pantalla alcanzan a los dos.
 */
export function puntoMasCercano(grafico: ComposicionDelGrafico, x: number, y: number, radio = 24): number | null {
  let mejor: number | null = null;
  let distancia = radio * radio;
  for (const p of grafico.puntos) {
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d <= distancia) {
      distancia = d;
      mejor = p.indice;
    }
  }
  return mejor;
}

export interface EntradaDelGraficoCompacto {
  readonly observaciones: readonly Observacion[];
  /** La toma de cada observación (T1, T2…), en el mismo orden; `null` si no se sabe. */
  readonly tomas: readonly (string | null)[];
  /** La observación de la toma elegida: su rótulo no se saltea nunca. */
  readonly elegida: number | null;
  readonly periodo: { readonly start: string; readonly end: string };
  readonly zonaHoraria: string;
  readonly ancho: number;
  readonly alto: number;
  readonly escalaDeLetra: number;
  readonly anchoDelTexto: (texto: string, tamano: number) => number;
  readonly formatoDelValor: (valor: number) => string;
}

/** Lo que el gráfico de una tarjeta suma al grande: la toma bajo cada punto y los valores, en fila. */
export interface ComposicionDelGraficoCompacto extends ComposicionDelGrafico {
  /** El rótulo de la toma de cada punto que entra sin pisar a otro, de izquierda a derecha. El de la elegida, siempre. */
  readonly tomas: readonly { readonly indice: number; readonly x: number; readonly texto: string }[];
  /** El valor de cada punto, en su orden, como se escribe debajo del gráfico. */
  readonly valores: readonly string[];
}

/** El radio de la observación de la toma elegida y el de las demás, en el gráfico compacto. */
export const RADIO_COMPACTO_ELEGIDA = 5.5;
export const RADIO_COMPACTO = 4.5;
/** Lo que separa dos rótulos de toma: si no entra, el de menos prioridad no se escribe. */
const ESPACIO_ENTRE_ROTULOS = 6;

/**
 * El gráfico de una tarjeta de Progreso o de Indicadores (DL-118, con la forma del ejemplo de Dirección del 2026-10-05):
 * los mismos puntos y la misma regla de eje que el gráfico grande.
 * - **Fechas reales.** Cada punto va en su fecha, dentro del período: dos observaciones cercanas en el tiempo quedan
 *   cerca. Debajo de cada punto va su toma (T1, T2…), la del selector. Si dos rótulos se pisan, se escriben primero el de
 *   la toma elegida, el último y el primero, y después los demás de izquierda a derecha.
 * - **La escala se ve.** Tres líneas de referencia: los extremos del dominio (`dominioDelEjeVertical`), que no fuerza el
 *   cero y deja un margen, y el medio, redondeado a la unidad del eje.
 * - **Puntos sin unir**, huecos con borde; el de la toma elegida, lleno y más grande. No hay líneas, áreas ni tendencias:
 *   unir los puntos sugeriría valores entre dos tomas que nadie midió (REG-06-166, DL-118). Un hueco queda vacío.
 * - **Los valores, en fila**, en el orden de los puntos: se leen sin adivinarlos en la escala.
 * `null` con menos de dos observaciones: un solo punto no muestra un recorrido, y su valor ya está escrito.
 */
export function componerGraficoCompacto(e: EntradaDelGraficoCompacto): ComposicionDelGraficoCompacto | null {
  if (e.observaciones.length < 2 || e.ancho <= 0 || e.alto <= 0) return null;
  const escala = Math.max(1, e.escalaDeLetra);
  const valores = e.observaciones.map((o) => o.punto.value);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const dominio = dominioDelEjeVertical(minimo, maximo);
  const unidad = unidadDelEje(minimo, maximo);
  const medio = Number((Math.round((dominio.desde + dominio.hasta) / 2 / unidad) * unidad).toFixed(decimalesDelEje(minimo, maximo)));
  const marcas = [dominio.hasta, medio, dominio.desde];
  const tamano = 11 * escala;
  const izquierda = 4 + Math.max(...marcas.map((v) => e.anchoDelTexto(e.formatoDelValor(v), tamano))) + 6;
  // Arriba y a la derecha, lugar para el punto más grande; abajo, para la fila de las tomas.
  const area = { izquierda, derecha: e.ancho - RADIO_COMPACTO_ELEGIDA - 2, arriba: RADIO_COMPACTO_ELEGIDA + 2, abajo: e.alto - (8 + 13 * escala) };
  const { desde, hasta } = limitesDelPeriodo(e.periodo, e.zonaHoraria);
  const x = (instante: number) => area.izquierda + ((instante - desde) / Math.max(1, hasta - desde)) * (area.derecha - area.izquierda);
  const y = (valor: number) => area.abajo - ((valor - dominio.desde) / Math.max(Number.EPSILON, dominio.hasta - dominio.desde)) * (area.abajo - area.arriba);
  const puntos = e.observaciones.map((observacion, indice) => ({ indice, x: x(observacion.instante), y: y(observacion.punto.value), observacion }));

  const ultimo = puntos.length - 1;
  const prioridad = [e.elegida, ultimo, 0, ...puntos.map((p) => p.indice)].filter((i, k, todos): i is number => i !== null && i >= 0 && i <= ultimo && todos.indexOf(i) === k);
  const ocupados: { desde: number; hasta: number }[] = [];
  const tomas: { indice: number; x: number; texto: string }[] = [];
  for (const indice of prioridad) {
    const texto = e.tomas[indice];
    if (!texto) continue;
    const medioAncho = e.anchoDelTexto(texto, tamano) / 2;
    const centro = Math.min(Math.max(puntos[indice]!.x, medioAncho), e.ancho - medioAncho);
    const tramo = { desde: centro - medioAncho, hasta: centro + medioAncho };
    if (ocupados.some((o) => tramo.desde < o.hasta + ESPACIO_ENTRE_ROTULOS && o.desde < tramo.hasta + ESPACIO_ENTRE_ROTULOS)) continue;
    ocupados.push(tramo);
    tomas.push({ indice, x: centro, texto });
  }
  return {
    ancho: e.ancho,
    alto: e.alto,
    area,
    puntos,
    marcasX: [],
    marcasY: marcas.map((valor) => ({ y: y(valor), valor })),
    dominio,
    tomas: tomas.sort((a, b) => a.x - b.x),
    valores: valores.map((v) => e.formatoDelValor(v)),
  };
}
