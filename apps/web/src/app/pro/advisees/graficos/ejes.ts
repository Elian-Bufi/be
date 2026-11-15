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
  /** Los decimales que hacen falta para escribir todas las marcas iguales y distintas entre sí (de 0 a 4). */
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

/**
 * Los decimales que necesita un número para escribirse entero: hasta 4. Antes cortaba en 2, y un paso de 0,005 (un rango
 * menor que 0,05: el índice cintura/talla de 0,49 a 0,50) dejaba «0,49 / 0,50 / 0,50» (revisión de #283).
 */
const decimalesDe = (v: number): number => {
  for (let d = 0; d < 4; d++) if (Number.isInteger(sinRuido(v * 10 ** d))) return d;
  return 4;
};

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

/**
 * Las marcas del medio entre dos extremos que ya están escritos (el tope y la base del gráfico chico de GR-24, que salen
 * de la escala del Resumen): las de `marcasRedondas` entre los dos, **solo si** los dos extremos caen en su misma grilla
 * (si no, la grilla queda despareja: 3, 4, 6, 8) y si no piden más decimales que los extremos (si no, «80,5» entre «80» y
 * «81» no entra en el canal del eje, que se midió con los extremos, y se corta). Sin marcas que cumplan, ninguna: el eje
 * queda con sus dos extremos, que no se repiten.
 */
export function marcasDelMedio(base: number, tope: number, decimalesDeLosExtremos: number, opciones: { readonly enteros?: boolean } = {}): number[] {
  if (!(tope > base)) return [];
  const m = marcasRedondas(base, tope, opciones);
  const enLaGrilla = (v: number): boolean => Math.abs(sinRuido(v / m.paso) - Math.round(sinRuido(v / m.paso))) < 1e-6;
  if (!enLaGrilla(base) || !enLaGrilla(tope) || m.decimales > decimalesDeLosExtremos) return [];
  return m.valores.filter((v) => v > base && v < tope);
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
  /** Va abajo del punto si entra (el mínimo del período: arriba suele estar la línea). */
  readonly abajo?: boolean;
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
    // Arriba del punto, o abajo si se pide (el mínimo) o si arriba no entra; si el primer lugar pisa algo, el otro.
    const arriba = c.y - separacion;
    const abajo = c.y + separacion + ALTO_DE_UN_ROTULO - 4;
    const lugares = (c.abajo ? [abajo, arriba] : [arriba, abajo]).filter((ty) => ty - ALTO_DE_UN_ROTULO + 2 >= caja.arriba && ty + 3 <= caja.abajo + 4);
    const ocupado = [...puestos.map((p) => p.caja), ...ocupadas];
    const r = lugares
      .map((ty): RotuloUbicado => ({ ...c, tx, ty, ancla, caja: { x1, x2: x1 + ancho, y1: ty - ALTO_DE_UN_ROTULO + 3, y2: ty + 3 } }))
      .find((x) => !ocupado.some((o) => sePisan(o, x.caja, aire)));
    if (r) puestos.push(r);
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

/**
 * Qué puntos de un carril llevan su número (revisión de #283; §5.5 y §5.13): el elegido y el último, siempre; el máximo y
 * el mínimo del período, solo entre lo registrado lleno y con 4 o más de esos. Un subtotal (marca hueca: al día le falta
 * algo) o una carga rápida (hueca y gris: los números del plan, no escritos por la persona) no se rotulan como el extremo
 * del período. `minimo` es el que va abajo de su punto.
 */
export function rotulosDeLoLleno<T extends { readonly clave: string; readonly valor: number; readonly marca: string }>(
  puntos: readonly T[],
  elegido: string | null,
): { readonly claves: string[]; readonly minimo: string | null } {
  const llenos = puntos.filter((p) => p.marca !== 'HUECA' && p.marca !== 'HUECA_GRIS');
  const orden = [...llenos].sort((a, b) => a.valor - b.valor);
  const extremos = orden.length >= 4 ? [orden[orden.length - 1]!.clave, orden[0]!.clave] : [];
  return { claves: [...new Set([...puntosConRotulo(puntos, elegido, false), ...extremos])], minimo: orden[0]?.clave ?? null };
}
