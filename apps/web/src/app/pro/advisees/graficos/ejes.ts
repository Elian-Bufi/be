/**
 * Los ejes y los rótulos de los gráficos (WP-GRAFICOS, pasada visual del 15/11; DISENO-VISUAL §1, principios 3 y 4):
 * - **El eje vertical, sobrio:** de 3 a 5 marcas con números redondos (pasos de 1, 2 o 5 por una potencia de diez; 25,
 *   250… también), sin un número repetido y sin decimales de más. Lo que se cuenta va en enteros.
 * - **Sin rótulo en cada punto:** llevan su número el último valor, el elegido y, si suma, el mínimo y el máximo. Dos
 *   rótulos nunca se pisan: el que no entra no se dibuja (`rotulosSinPisarse`, en orden de prioridad).
 *
 * Es puro: lo prueba `apps/web/test/graficos-base.test.mjs`.
 */

/** Sin el ruido binario de una cuenta con decimales (0,1 + 0,2 no es 0,30000000000000004). */
const sinRuido = (n: number): number => Number(n.toFixed(6));

export const MARCAS_MINIMAS = 3;
export const MARCAS_MAXIMAS = 5;

export interface MarcasDelEje {
  readonly abajo: number;
  readonly arriba: number;
  readonly paso: number;
  /** Las marcas, de abajo hacia arriba: la primera es `abajo` y la última, `arriba`. */
  readonly valores: readonly number[];
  /** Los decimales que hacen falta para escribir todas las marcas iguales (0, 1 o 2). */
  readonly decimales: number;
}

/** Los pasos redondos en orden creciente: 1, 2 y 5 por cada potencia de diez, y 25, 250… (nunca 2,5: dejaría «102,5»). */
function pasosRedondos(desde: number): number[] {
  const potencia = 10 ** Math.floor(Math.log10(desde));
  const pasos: number[] = [];
  for (let p = potencia / 10; pasos.length < 24; p *= 10) {
    for (const m of [1, 2, 2.5, 5]) {
      if (m === 2.5 && p < 10) continue;
      pasos.push(sinRuido(m * p));
    }
  }
  return pasos.sort((a, b) => a - b);
}

const decimalesDe = (v: number): number => (Number.isInteger(sinRuido(v)) ? 0 : Number.isInteger(sinRuido(v * 10)) ? 1 : 2);

/**
 * Las marcas del eje vertical para un mínimo y un máximo: el paso redondo más chico que deja 5 marcas o menos, y al
 * menos 3. Los extremos del eje son la primera y la última marca, así la grilla cierra arriba y abajo. Con `enteros`,
 * el paso es entero (lo que se cuenta). Un eje de algo que no baja de cero no muestra marcas negativas.
 */
export function marcasRedondas(minimo: number, maximo: number, opciones: { readonly enteros?: boolean } = {}): MarcasDelEje {
  let min = Number.isFinite(minimo) ? minimo : 0;
  let max = Number.isFinite(maximo) ? maximo : 1;
  if (min > max) [min, max] = [max, min];
  const noNegativo = min >= 0;
  if (max === min) {
    const margen = Math.abs(max) * 0.05 || 1;
    min -= margen;
    max += margen;
    if (noNegativo && min < 0) min = 0;
  }
  const rango = max - min;
  const cuantas = (paso: number): number => Math.ceil(sinRuido(max / paso)) - Math.floor(sinRuido(min / paso)) + 1;
  const candidatos = pasosRedondos(rango / MARCAS_MAXIMAS).filter((p) => !opciones.enteros || Number.isInteger(p));
  const paso = candidatos.find((p) => cuantas(p) <= MARCAS_MAXIMAS) ?? candidatos[candidatos.length - 1] ?? 1;
  let abajo = sinRuido(Math.floor(sinRuido(min / paso)) * paso);
  let arriba = sinRuido(Math.ceil(sinRuido(max / paso)) * paso);
  if (noNegativo && abajo < 0) abajo = 0;
  // Con menos de 3 marcas, se suma una arriba (o abajo, si no baja de cero): dos marcas no ubican un valor.
  while (Math.round((arriba - abajo) / paso) + 1 < MARCAS_MINIMAS) {
    if (abajo - paso >= 0 || !noNegativo) abajo = sinRuido(abajo - paso);
    else arriba = sinRuido(arriba + paso);
  }
  const valores: number[] = [];
  for (let v = abajo; v <= arriba + paso / 1000; v = sinRuido(v + paso)) valores.push(v);
  return { abajo, arriba, paso, valores, decimales: Math.max(0, ...valores.map(decimalesDe)) };
}

/** Un número del eje, en es-AR y con los decimales de todas las marcas: «1.850», «2,5». */
export const textoDeLaMarcaDelEje = (v: number, decimales: number): string => v.toLocaleString('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

// ─── Los rótulos de los puntos ──────────────────────────────────────────────────────────────────────

/** El ancho aproximado de una cifra de 12 px con cifras tabulares, y el alto de un renglón. */
export const ANCHO_DE_UNA_CIFRA = 7;
export const ALTO_DE_UN_ROTULO = 14;

export interface RotuloCandidato {
  readonly clave: string;
  /** El centro de la marca del punto. */
  readonly x: number;
  readonly y: number;
  readonly texto: string;
}

export interface RotuloUbicado extends RotuloCandidato {
  /** Dónde va el texto: su línea de base y su ancla. */
  readonly tx: number;
  readonly ty: number;
  readonly ancla: 'start' | 'middle' | 'end';
  readonly caja: { readonly x1: number; readonly x2: number; readonly y1: number; readonly y2: number };
}

const sePisan = (a: RotuloUbicado['caja'], b: RotuloUbicado['caja'], aire: number): boolean => a.x1 < b.x2 + aire && b.x1 < a.x2 + aire && a.y1 < b.y2 + aire && b.y1 < a.y2 + aire;

/**
 * Los rótulos que entran, en orden de prioridad (el primero manda): cada uno va arriba de su punto o, si no entra en la
 * caja, abajo; cerca de un borde, alineado hacia adentro. Uno que pisaría a otro ya ubicado no se dibuja: nunca dos
 * rótulos encimados. Las cajas de `ocupadas` (otra cosa escrita en el dibujo) también cuentan.
 */
export function rotulosSinPisarse(
  candidatos: readonly RotuloCandidato[],
  caja: { readonly izquierda: number; readonly derecha: number; readonly arriba: number; readonly abajo: number },
  ocupadas: readonly RotuloUbicado['caja'][] = [],
  separacion = 10,
  aire = 3,
): RotuloUbicado[] {
  const puestos: RotuloUbicado[] = [];
  const vistas = new Set<string>();
  for (const c of candidatos) {
    if (vistas.has(c.clave)) continue;
    vistas.add(c.clave);
    const ancho = c.texto.length * ANCHO_DE_UNA_CIFRA;
    const ancla: RotuloUbicado['ancla'] = c.x - ancho / 2 < caja.izquierda ? 'start' : c.x + ancho / 2 > caja.derecha ? 'end' : 'middle';
    const x1 = ancla === 'start' ? c.x - 4 : ancla === 'end' ? c.x - ancho + 4 : c.x - ancho / 2;
    const tx = ancla === 'start' ? c.x - 4 : ancla === 'end' ? c.x + 4 : c.x;
    const arriba = c.y - separacion;
    const ty = arriba - ALTO_DE_UN_ROTULO + 2 >= caja.arriba ? arriba : c.y + separacion + ALTO_DE_UN_ROTULO - 4;
    const r: RotuloUbicado = { ...c, tx, ty, ancla, caja: { x1, x2: x1 + ancho, y1: ty - ALTO_DE_UN_ROTULO + 3, y2: ty + 3 } };
    if (r.caja.y2 > caja.abajo + 4) continue;
    if ([...puestos.map((p) => p.caja), ...ocupadas].some((o) => sePisan(o, r.caja, aire))) continue;
    puestos.push(r);
  }
  return puestos;
}

/**
 * Qué puntos llevan su número, en orden de prioridad: el elegido, el último y, con 4 o más, el máximo y el mínimo del
 * período. Devuelve las claves sin repetir.
 */
export function puntosConRotulo<T extends { readonly clave: string; readonly valor: number }>(puntos: readonly T[], elegido: string | null, conExtremos = true): string[] {
  if (puntos.length === 0) return [];
  const claves: string[] = [];
  if (elegido !== null && puntos.some((p) => p.clave === elegido)) claves.push(elegido);
  claves.push(puntos[puntos.length - 1]!.clave);
  if (conExtremos && puntos.length >= 4) {
    const orden = [...puntos].sort((a, b) => a.valor - b.valor);
    claves.push(orden[orden.length - 1]!.clave, orden[0]!.clave);
  }
  return [...new Set(claves)];
}
