/**
 * La franja de lo indicado en GR-03 (WP-GRAFICOS-POR-FASE, GPF-05; DL-187): si el plan indica de 8 a 10 repeticiones, el
 * panel de las repeticiones pinta de fondo el rango indicado, en escalones según la versión que rige, y lo registrado se
 * marca encima. Lo mismo con la carga sugerida, en la unidad del panel.
 *
 * - **La franja es la de la serie elegida**, con lo que indicaba cada versión (la instantánea que rigió cada sesión,
 *   REG-06-105; los objetivos por serie de DL-122). Si la versión indica cosas distintas en distintas sesiones del plan,
 *   la franja va del menor al mayor y su rótulo lo dice; la marca hueca de cada sesión sigue diciendo la suya.
 * - **Su largo es la vigencia de la versión** dentro del período (de la activación al día anterior a la sucesora, u hoy);
 *   sin la vigencia, del primer al último día con sesiones de esa versión.
 * - **Un % RM no se convierte a kg** (09v10:356): no es una franja en el panel de la carga, y la nota lo dice.
 * - **Ubicar sin calificar** (GPF-D06): la lectura de cada punto dice «dentro de lo indicado (8 a 10)», «2 por encima de
 *   lo indicado (8 a 10)» o «igual a lo indicado (5)», sin color ni palabra de juicio.
 *
 * Es puro: lo prueba `apps/web/test/graficos-por-fase.test.mjs`.
 */
import { numero, valorPlanificado, type Medida, type ObservacionDeEvolucion, type VigenciaDePlan } from '@be/domain';
import type { FranjaDelCarril, PuntoDelCarril } from '../carriles';

export interface RangoDeLoIndicado {
  readonly minimo: number;
  readonly maximo: number;
}

const unidadDe = (m: Medida): string => (m.variable === 'carga' ? ` ${m.unidad}` : m.variable === 'repeticiones' ? ' rep' : '');

/** «8 a 10 rep», «100 kg», «RIR 1 a 2». */
export function textoDeLoIndicado(r: RangoDeLoIndicado, m: Medida): string {
  const valor = r.minimo === r.maximo ? numero(r.minimo) : `${numero(r.minimo)} a ${numero(r.maximo)}`;
  return m.variable === 'rir' ? `RIR ${valor}` : `${valor}${unidadDe(m)}`;
}

/** Lo indicado para la serie elegida en una observación: un valor o un rango; `null` si no hay nada que dibujar. */
export function loIndicadoEnLaObservacion(o: ObservacionDeEvolucion, serie: number, medida: Medida): RangoDeLoIndicado | null {
  if (o.rol !== 'planificado-y-registrado') return null;
  const fila = o.comparacion.filas.find((f) => f.numero === serie);
  if (!fila) return null;
  const v = valorPlanificado(o.comparacion, fila, medida);
  if (v.tipo === 'valor') return { minimo: v.valor, maximo: v.valor };
  if (v.tipo === 'rango') return { minimo: v.min, maximo: v.max };
  return null;
}

/** Si alguna versión indica la carga de la serie en % RM: la franja de la carga no se dibuja, y se dice. */
export function indicaPorcentajeRm(observaciones: readonly ObservacionDeEvolucion[], serie: number, medida: Medida): boolean {
  return observaciones.some((o) => {
    const fila = o.rol === 'planificado-y-registrado' ? o.comparacion.filas.find((f) => f.numero === serie) : undefined;
    return !!fila && valorPlanificado(o.comparacion, fila, medida).tipo === 'porcentaje-rm';
  });
}

const diaAnterior = (f: string): string => new Date(Date.parse(`${f}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/**
 * Las franjas de un panel, una por versión con algo indicado para la serie, en el orden de las sesiones. `desde` y
 * `hasta` son los del eje: una franja no sale del período.
 */
export function franjasDeLoIndicado(
  observaciones: readonly ObservacionDeEvolucion[],
  o: { readonly serie: number; readonly medida: Medida; readonly vigencias: readonly VigenciaDePlan[]; readonly desde: string; readonly hasta: string },
): FranjaDelCarril[] {
  const porVersion = new Map<string, { minimo: number; maximo: number; primera: string; ultima: string; distintos: Set<string> }>();
  for (const obs of observaciones) {
    const r = loIndicadoEnLaObservacion(obs, o.serie, o.medida);
    if (!r) continue;
    const c = obs.comparacion;
    const a = porVersion.get(c.planId);
    if (!a) porVersion.set(c.planId, { minimo: r.minimo, maximo: r.maximo, primera: c.fecha, ultima: c.fecha, distintos: new Set([`${r.minimo}|${r.maximo}`]) });
    else {
      a.minimo = Math.min(a.minimo, r.minimo);
      a.maximo = Math.max(a.maximo, r.maximo);
      if (c.fecha < a.primera) a.primera = c.fecha;
      if (c.fecha > a.ultima) a.ultima = c.fecha;
      a.distintos.add(`${r.minimo}|${r.maximo}`);
    }
  }
  const franjas: FranjaDelCarril[] = [];
  for (const [planId, a] of porVersion) {
    const v = o.vigencias.find((x) => x.planVersionId === planId);
    const inicio = v ? v.from : a.primera;
    const fin = v ? (v.to === null ? o.hasta : diaAnterior(v.to)) : a.ultima;
    const desde = inicio < o.desde ? o.desde : inicio;
    const hasta = fin > o.hasta ? o.hasta : fin;
    if (desde > hasta) continue;
    const texto = textoDeLoIndicado(a, o.medida);
    const segun = a.distintos.size > 1 ? ', según la sesión del plan' : '';
    franjas.push({ desde, hasta, minimo: a.minimo, maximo: a.maximo, rotulo: `Indicado ${texto}${segun}${v ? ` · ${v.label}` : ''}` });
  }
  return franjas.sort((x, y) => (x.desde < y.desde ? -1 : x.desde > y.desde ? 1 : 0));
}

/**
 * Dónde queda un valor registrado respecto de lo indicado, sin calificar: «dentro de lo indicado (8 a 10)», «2 por
 * encima de lo indicado (8 a 10)», «igual a lo indicado (5)». La diferencia, con su unidad si es la carga.
 */
export function ubicacionRespectoDeLoIndicado(valor: number, r: RangoDeLoIndicado, m: Medida): string {
  const indicado = textoDeLoIndicado(r, m);
  const conUnidad = (d: number): string => `${numero(Math.round(d * 100) / 100)}${m.variable === 'carga' ? ` ${m.unidad}` : ''}`;
  if (valor > r.maximo) return `${conUnidad(valor - r.maximo)} por encima de lo indicado (${indicado})`;
  if (valor < r.minimo) return `${conUnidad(r.minimo - valor)} por debajo de lo indicado (${indicado})`;
  return r.minimo === r.maximo ? `igual a lo indicado (${indicado})` : `dentro de lo indicado (${indicado})`;
}

/**
 * Los puntos registrados de un panel, con su ubicación respecto de lo indicado en la misma sesión al final de la lectura
 * (y por eso en la tabla). El punto se busca por la hora de la sesión y, si no la tiene, por el día con una sola sesión.
 */
export function conLaUbicacion(puntos: readonly PuntoDelCarril[], observaciones: readonly ObservacionDeEvolucion[], serie: number, medida: Medida): PuntoDelCarril[] {
  return puntos.map((p) => {
    if (p.valor === null) return p;
    const delDia = observaciones.filter((o) => o.comparacion.fecha === p.fecha);
    const obs = (p.en ? delDia.find((o) => o.comparacion.ocurrio === p.en) : undefined) ?? (delDia.length === 1 ? delDia[0] : undefined);
    const r = obs ? loIndicadoEnLaObservacion(obs, serie, medida) : null;
    return r ? { ...p, lectura: `${p.lectura} · ${ubicacionRespectoDeLoIndicado(p.valor, r, medida)}` } : p;
  });
}
