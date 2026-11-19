/**
 * Lo que indicaba el plan para un ejercicio en un tramo (una versión, una etapa), y cómo se dice que cambió (WP-GRAFICOS,
 * pasada visual del 15/11; DISENO-VISUAL §1, principio 5, y §2, la fuerza estimada y GR-24):
 * - **En la línea de la versión** del gráfico: «v8 · de 4 a 3 repeticiones». Solo el RIR y las repeticiones, que son lo
 *   que mueve la estimación aunque la fuerza no cambie (§5.12; `cambioDeLoIndicado` del dominio dice la frase larga).
 * - **En la diferencia de una métrica registrada entre dos etapas:** «el plan indica 1 repetición menos», para que un
 *   «−1 rep» no se lea como un retroceso cuando lo que cambió fue lo indicado.
 *
 * Lo indicado es el de la versión que rigió cada sesión (REG-06-105), con los objetivos por serie (DL-122): sale del
 * comparador del dominio (`observacionesDelEjercicio` y `valorPlanificado`). Una sustitución no cuenta: lo planificado
 * era de otro ejercicio. Nunca se promedia: si el tramo indicó valores distintos, es un rango.
 *
 * Es puro: lo prueba `apps/web/test/graficos-base.test.mjs`.
 */
import { numero, valorPlanificado, type Medida, type ObservacionDeEvolucion } from '@be/domain';

export interface RangoIndicado {
  readonly desde: number;
  readonly hasta: number;
}

export interface LoIndicadoEnElTramo {
  readonly rir: RangoIndicado | null;
  readonly repeticiones: RangoIndicado | null;
  /** La carga sugerida, en la unidad pedida (kg y lb nunca van juntas). */
  readonly carga: RangoIndicado | null;
}

const rangoDe = (valores: readonly number[]): RangoIndicado | null => (valores.length === 0 ? null : { desde: Math.min(...valores), hasta: Math.max(...valores) });

/**
 * Lo indicado en las observaciones que elige `enElTramo`: por todas las series del ejercicio o solo por `serie`. `null`
 * si el tramo no indicó nada que se pueda escribir con un número (sin fijar, un % RM, otra unidad).
 */
export function loIndicadoEnElTramo(
  observaciones: readonly ObservacionDeEvolucion[],
  enElTramo: (o: ObservacionDeEvolucion) => boolean,
  opciones: { readonly serie?: number | null; readonly unidad?: 'kg' | 'lb' } = {},
): LoIndicadoEnElTramo | null {
  const valores = { rir: [] as number[], repeticiones: [] as number[], carga: [] as number[] };
  const medidas: readonly (readonly [keyof typeof valores, Medida])[] = [
    ['rir', { variable: 'rir' }],
    ['repeticiones', { variable: 'repeticiones' }],
    ...(opciones.unidad ? [['carga', { variable: 'carga', unidad: opciones.unidad }] as const] : []),
  ];
  for (const o of observaciones) {
    if (o.rol !== 'planificado-y-registrado' || !enElTramo(o)) continue;
    for (const fila of o.comparacion.filas) {
      if (opciones.serie != null && fila.numero !== opciones.serie) continue;
      if (fila.planificada.tipo === 'no-planificada') continue;
      for (const [clave, medida] of medidas) {
        const v = valorPlanificado(o.comparacion, fila, medida);
        if (v.tipo === 'valor') valores[clave].push(v.valor);
        if (v.tipo === 'rango') valores[clave].push(v.min, v.max);
      }
    }
  }
  const r = { rir: rangoDe(valores.rir), repeticiones: rangoDe(valores.repeticiones), carga: rangoDe(valores.carga) };
  return r.rir === null && r.repeticiones === null && r.carga === null ? null : r;
}

const iguales = (a: RangoIndicado | null, b: RangoIndicado | null): boolean => (a === null || b === null ? a === b : a.desde === b.desde && a.hasta === b.hasta);
/** «4», o «8–10» para un rango: corto, para que «de 8–10 a 6 repeticiones» no se lea como tres números. */
const enPocas = (r: RangoIndicado): string => (r.desde === r.hasta ? numero(r.desde) : `${numero(r.desde)}–${numero(r.hasta)}`);

/**
 * Lo que cambió en lo indicado de una versión a la siguiente, corto, para la línea de la versión: «de 4 a 3
 * repeticiones», «RIR de 2 a 1», o los dos con «·». `null` si no cambió (o si una de las dos no indica nada).
 */
export function cambioCortoDeLoIndicado(a: LoIndicadoEnElTramo | null, b: LoIndicadoEnElTramo | null): string | null {
  if (a === null || b === null) return null;
  const partes: string[] = [];
  if (a.repeticiones && b.repeticiones && !iguales(a.repeticiones, b.repeticiones)) partes.push(`de ${enPocas(a.repeticiones)} a ${enPocas(b.repeticiones)} repeticiones`);
  if (a.rir && b.rir && !iguales(a.rir, b.rir)) partes.push(`RIR de ${enPocas(a.rir)} a ${enPocas(b.rir)}`);
  return partes.length === 0 ? null : partes.join(' · ');
}

/** Las versiones de un plan, con su tramo de fechas: desde el día que rige hasta el anterior al corte. */
export interface TramoDeVersion {
  readonly clave: string;
  readonly desde: string;
  /** El día del corte (ya rige la siguiente); `null` si sigue vigente. */
  readonly hasta: string | null;
  /**
   * La versión (`planVersionId`): con ella, cada sesión cuenta en la versión que la ejecutó (REG-06-105), como en GR-24,
   * aunque se haya registrado el día del corte. Sin ella, por la fecha.
   */
  readonly planVersionId?: string | null;
}

/**
 * El cambio de lo indicado en cada versión que lo tuvo, por su clave: **la versión contra la inmediata anterior** (revisión del
 * 15/11). Lo indicado de cada versión sale de sus sesiones: las que ejecutaron esa versión (por `planVersionId`) o, sin
 * él, las de sus fechas. Si la anterior no tiene ninguna sesión del ejercicio, no se sabe qué indicaba: la versión va sin
 * rótulo de cambio, nunca contra una más vieja (eso afirmaría un cambio que no ocurrió en esa línea).
 *
 * `serie`: lo indicado solo para ese número de serie (rama B: GR-03 y GR-05 son de una serie). Sin ella, el de todas las
 * series del ejercicio, como siempre. Así un gráfico de una serie no rotula un cambio que fue de otra.
 */
export function cambiosPorVersion(
  observaciones: readonly ObservacionDeEvolucion[],
  versiones: readonly TramoDeVersion[],
  opciones: { readonly serie?: number | null } = {},
): ReadonlyMap<string, string> {
  const ordenadas = [...versiones].sort((x, y) => (x.desde < y.desde ? -1 : x.desde > y.desde ? 1 : 0));
  const deLaVersion = (v: TramoDeVersion) => (o: ObservacionDeEvolucion) =>
    v.planVersionId ? o.comparacion.planId === v.planVersionId : o.comparacion.fecha >= v.desde && (v.hasta === null || o.comparacion.fecha < v.hasta);
  const cambios = new Map<string, string>();
  let anterior: LoIndicadoEnElTramo | null = null;
  for (const v of ordenadas) {
    const actual = loIndicadoEnElTramo(observaciones, deLaVersion(v), { serie: opciones.serie ?? null });
    const cambio = cambioCortoDeLoIndicado(anterior, actual);
    if (cambio) cambios.set(v.clave, cambio);
    anterior = actual;
  }
  return cambios;
}

/**
 * La diferencia de lo indicado entre dos etapas, en palabras, para la columna «Diferencia» de una métrica registrada:
 * «el plan indica 1 repetición menos», «el plan indica 2,5 kg más», «el plan indica RIR 1 (antes 2)». Con rangos, los
 * dice enteros. `null` si lo indicado no cambió o no se sabe en alguna de las dos.
 */
export function diferenciaDeLoIndicado(a: LoIndicadoEnElTramo | null, b: LoIndicadoEnElTramo | null, medida: Medida): string | null {
  if (a === null || b === null) return null;
  const clave = medida.variable;
  const x = a[clave];
  const y = b[clave];
  if (x === null || y === null || iguales(x, y)) return null;
  const unValor = x.desde === x.hasta && y.desde === y.hasta;
  if (clave === 'rir') return `el plan indica RIR ${enPocas(y)} (antes ${enPocas(x)})`;
  if (clave === 'repeticiones') {
    if (!unValor) return `el plan indica ${enPocas(y)} repeticiones (antes ${enPocas(x)})`;
    const d = y.desde - x.desde;
    const n = Math.abs(d);
    return `el plan indica ${numero(n)} ${n === 1 ? 'repetición' : 'repeticiones'} ${d < 0 ? 'menos' : 'más'}`;
  }
  const unidad = medida.variable === 'carga' ? medida.unidad : '';
  if (!unValor) return `el plan sugiere ${enPocas(y)} ${unidad} (antes ${enPocas(x)})`;
  const d = y.desde - x.desde;
  return `el plan sugiere ${numero(Math.abs(d))} ${unidad} ${d < 0 ? 'menos' : 'más'}`;
}
