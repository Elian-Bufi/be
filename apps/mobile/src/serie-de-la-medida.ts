/**
 * La serie de una medida para los gráficos con fechas de «Mi evolución» (DL-118): Progreso, Indicadores y el detalle de
 * una medida. Es lógica pura, sin React, y la prueba `scripts/selector-de-tomas.test.mjs` sin teléfono.
 *
 * - **Un grupo de comparabilidad por gráfico.** El de la observación de la toma elegida, si la medida está en ella; si
 *   no, el más reciente (`grupoVigente`). Otro protocolo, método o unidad nunca va en el mismo eje: se cuenta aparte, y
 *   el detalle permite verlo (REG-06-162/164).
 * - **Las fechas reales del período**, con sus huecos (`filasDelPeriodo`): un tramo sin medición no se completa
 *   (REG-06-165/166).
 * - **La toma de cada punto** (T1, T2…), con la numeración del selector (`tomasDelPeriodo`): el gráfico de una tarjeta la
 *   escribe bajo cada punto (ajuste de Dirección del 2026-10-05).
 * - El resumen de cada toma (`tomaDe`), la numeración y la serie preparada se calculan una vez por respuesta.
 */
import { filasDelPeriodo, grupoVigente, prepararSerie, tomaDe, tomasDelPeriodo, type EvolucionResponse, type FilaDeEvolucion, type GrupoDeComparabilidad, type Observacion, type SeriePreparada, type UltimaToma } from '@be/domain';

type Datos = EvolucionResponse['data'];

const series = new WeakMap<Datos, Map<string, SeriePreparada | null>>();

/** La serie preparada de una métrica, una vez por respuesta; `null` si la respuesta no la tiene. */
export function serieDe(datos: Datos, metrica: string): SeriePreparada | null {
  let porMetrica = series.get(datos);
  if (!porMetrica) {
    porMetrica = new Map();
    series.set(datos, porMetrica);
  }
  if (!porMetrica.has(metrica)) {
    const api = datos.metrics.find((m) => m.metricCode === metrica);
    porMetrica.set(metrica, api ? prepararSerie(api, datos.period.timeZone) : null);
  }
  return porMetrica.get(metrica) ?? null;
}

const resumenes = new WeakMap<Datos, Map<string, UltimaToma | null>>();

/** El resumen de una toma (`tomaDe`), una vez por respuesta: volver a elegirla no lo repite. */
export function resumenDe(datos: Datos, evaluacionId: string): UltimaToma | null {
  let porToma = resumenes.get(datos);
  if (!porToma) {
    porToma = new Map();
    resumenes.set(datos, porToma);
  }
  if (!porToma.has(evaluacionId)) porToma.set(evaluacionId, tomaDe(datos, evaluacionId));
  return porToma.get(evaluacionId) ?? null;
}

const etiquetas = new WeakMap<Datos, ReadonlyMap<string, string>>();

/** La etiqueta de cada evaluación del período (T1, T2…), la misma del selector de tomas, una vez por respuesta. */
export function etiquetasDeLasTomas(datos: Datos): ReadonlyMap<string, string> {
  let porEvaluacion = etiquetas.get(datos);
  if (!porEvaluacion) {
    porEvaluacion = new Map(tomasDelPeriodo(datos).map((t) => [t.evaluacionId, t.etiqueta]));
    etiquetas.set(datos, porEvaluacion);
  }
  return porEvaluacion;
}

export interface SerieDeLaMedida {
  /** El grupo de comparabilidad que se dibuja, o `null` si la medida no tiene observaciones. */
  readonly grupo: string | null;
  /** Las observaciones del grupo y los huecos, en orden, dentro del período: lo que dice la lista equivalente. */
  readonly filas: readonly FilaDeEvolucion[];
  /** Las observaciones del grupo dentro del período: lo que dibuja el gráfico. */
  readonly observaciones: readonly Observacion[];
  /** La toma de cada observación (T1, T2…), en el mismo orden; `null` si su evaluación no está en el período. */
  readonly tomas: readonly (string | null)[];
  /** Cuántas observaciones del período tienen otro protocolo, método o unidad: no se dibujan en este eje. */
  readonly enOtrosGrupos: number;
  /** Los grupos que la medida usa en el período, para elegir otro en el detalle. */
  readonly grupos: readonly GrupoDeComparabilidad[];
}

/**
 * La serie de una medida con el grupo pedido: el de la observación de la toma elegida, si lo hay. Si el grupo pedido no
 * tiene observaciones, la del grupo más reciente.
 */
export function serieDeLaMedida(datos: Datos, metrica: string, grupoPedido: string | null): SerieDeLaMedida {
  const serie = serieDe(datos, metrica);
  if (!serie) return { grupo: null, filas: [], observaciones: [], tomas: [], enOtrosGrupos: 0, grupos: [] };
  const grupo = grupoVigente(serie, grupoPedido);
  const filas = filasDelPeriodo(serie, grupo, datos.period);
  const observaciones = filas.flatMap((f) => (f.tipo === 'observacion' ? [f.observacion] : []));
  const delPeriodo = serie.observaciones.filter((o) => o.fecha >= datos.period.start && o.fecha <= datos.period.end);
  const usados = new Set(delPeriodo.map((o) => o.punto.comparabilityGroup));
  const deCadaEvaluacion = etiquetasDeLasTomas(datos);
  return {
    grupo,
    filas,
    observaciones,
    tomas: observaciones.map((o) => deCadaEvaluacion.get(o.punto.sourceEvaluationId) ?? null),
    enOtrosGrupos: delPeriodo.filter((o) => o.punto.comparabilityGroup !== grupo).length,
    grupos: serie.grupos.filter((g) => usados.has(g.comparabilityGroup)),
  };
}

/** El índice, en `observaciones`, de la observación de una evaluación; `null` si esa toma no tiene la medida en el grupo. */
export function indiceDeLaToma(observaciones: readonly Observacion[], evaluacionId: string): number | null {
  for (let i = observaciones.length - 1; i >= 0; i--) if (observaciones[i]!.punto.sourceEvaluationId === evaluacionId) return i;
  return null;
}
