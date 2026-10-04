/**
 * DL-111 · «Tu última toma», para la APK y la lámina del website. Se arma sobre la misma lectura de API-ANT-06 que usa
 * la evolución (`prepararSerie`), así las dos pantallas no pueden decir cosas distintas:
 * - la toma es la evaluación del punto más reciente del período;
 * - de cada métrica que esa evaluación tiene, el valor vigente y el anterior **del mismo grupo de comparabilidad**
 *   (mismo protocolo, método y unidad, REG-06-162), con la diferencia como una resta (`diferenciaDescriptiva`);
 * - las mediciones y los resultados de las fórmulas (corridas vigentes, clase «calculado») van por separado.
 *
 * DL-117 (Dirección, 2026-10-04) suma el selector de tomas de la APK: T1, T2, T3… con sus fechas reales. Cada toma es
 * una evaluación (`sourceEvaluationId`), **nunca una fecha**: dos evaluaciones del mismo día son dos tomas
 * (`tomasDelPeriodo`). Cualquier toma se resume igual que la última (`tomaDe`), con el anterior comparable de una
 * evaluación anterior a ella.
 *
 * Nunca califica (TEST-PRJ-009): no hay «mejor» ni «peor», ni un color por rango. Una diferencia es un número con signo.
 */
import type { EvolucionResponse } from './contratos-antropometria';
import { diferenciaDescriptiva, observacionesDelGrupo, prepararSerie, type Observacion, type SeriePreparada } from './evolucion-antropometrica';
import { NOMBRE_DE_METRICA, nombreDeMetrica } from './nombres-de-metricas';

type Datos = EvolucionResponse['data'];

export interface MedidaDeLaToma {
  readonly metrica: string;
  readonly nombre: string;
  readonly actual: Observacion;
  /** La observación anterior del mismo grupo, de otra evaluación; `null` si no hay ninguna en el período. */
  readonly anterior: Observacion | null;
  readonly diferencia: { readonly delta: number; readonly unidad: string; readonly dias: number } | null;
  /**
   * Por qué no hay anterior comparable, si no lo hay:
   * - `SIN_PREVIA`: la medida no tiene una observación anterior en el período;
   * - `OTRO_GRUPO`: la tiene, pero con otro protocolo, método o unidad, y no se comparan (REG-06-162/164).
   */
  readonly motivoSinAnterior: 'SIN_PREVIA' | 'OTRO_GRUPO' | null;
}

export interface UltimaToma {
  readonly evaluacionId: string;
  /** Fecha civil de la toma (`AAAA-MM-DD`) y su instante. */
  readonly fecha: string;
  readonly instante: number;
  /** Fecha civil de la toma anterior con la que se compara la mayoría de las medidas, si la hay. */
  readonly fechaAnterior: string | null;
  readonly medidas: readonly MedidaDeLaToma[];
  readonly derivadas: readonly MedidaDeLaToma[];
}

/** Una toma del período: una evaluación, con su orden y su fecha. */
export interface TomaDelPeriodo {
  readonly evaluacionId: string;
  /** «T1», «T2»…: el orden de la toma en el período, de la más vieja a la más nueva. */
  readonly etiqueta: string;
  readonly fecha: string;
  readonly instante: number;
  /** Cuántas métricas de esta evaluación quedan a la vista en el período (medidas y resultados). */
  readonly metricas: number;
}

/** El orden del catálogo de BE: primero las mediciones, después los resultados; lo que BE no conoce va al final, por nombre. */
const ORDEN = new Map(Object.keys(NOMBRE_DE_METRICA).map((clave, i) => [clave, i]));
export const compararPorCatalogo = (a: string, b: string): number =>
  (ORDEN.get(a) ?? Number.MAX_SAFE_INTEGER) - (ORDEN.get(b) ?? Number.MAX_SAFE_INTEGER) || nombreDeMetrica(a).localeCompare(nombreDeMetrica(b), 'es');
const porCatalogo = (a: MedidaDeLaToma, b: MedidaDeLaToma): number => compararPorCatalogo(a.metrica, b.metrica);

/** Las series preparadas de una respuesta, una vez por respuesta: el selector y los gráficos chicos las leen muchas veces. */
const preparadas = new WeakMap<Datos, readonly SeriePreparada[]>();
function seriesDe(datos: Datos): readonly SeriePreparada[] {
  let series = preparadas.get(datos);
  if (!series) {
    series = datos.metrics.map((m) => prepararSerie(m, datos.period.timeZone));
    preparadas.set(datos, series);
  }
  return series;
}

/** La observación más reciente de dos: por instante y, a igual instante, por momento de registro. */
const masReciente = (a: Observacion, b: Observacion): Observacion => (b.instante > a.instante || (b.instante === a.instante && b.punto.recordedAt > a.punto.recordedAt) ? b : a);

/**
 * Las tomas del período, de la más vieja a la más nueva: una por evaluación (`sourceEvaluationId`). La fecha de cada una
 * es la de su observación más reciente. Dos evaluaciones del mismo día son dos tomas, con la misma fecha. Si la API
 * proyecta una sola observación por día y métrica, de una evaluación tapada se ve solo lo que la API expone (D-3).
 */
export function tomasDelPeriodo(datos: Datos): readonly TomaDelPeriodo[] {
  const porEvaluacion = new Map<string, { ultima: Observacion; metricas: Set<string> }>();
  for (const serie of seriesDe(datos)) {
    for (const o of serie.observaciones) {
      const id = o.punto.sourceEvaluationId;
      const previa = porEvaluacion.get(id);
      if (!previa) porEvaluacion.set(id, { ultima: o, metricas: new Set([serie.metricCode]) });
      else {
        previa.ultima = masReciente(previa.ultima, o);
        previa.metricas.add(serie.metricCode);
      }
    }
  }
  return [...porEvaluacion.entries()]
    .sort(([idA, a], [idB, b]) => a.ultima.instante - b.ultima.instante || a.ultima.punto.recordedAt.localeCompare(b.ultima.punto.recordedAt) || idA.localeCompare(idB))
    .map(([evaluacionId, t], i) => ({ evaluacionId, etiqueta: `T${i + 1}`, fecha: t.ultima.fecha, instante: t.ultima.instante, metricas: t.metricas.size }));
}

/**
 * Una toma del período resumida: de cada métrica que la evaluación tiene, el valor vigente y el anterior del mismo grupo
 * de una evaluación anterior a ella. `null` si la evaluación no está en el período.
 */
export function tomaDe(datos: Datos, evaluacionId: string): UltimaToma | null {
  const filas: MedidaDeLaToma[] = [];
  let ultima: Observacion | null = null;
  for (const serie of seriesDe(datos)) {
    // Las observaciones vienen ordenadas en el tiempo: la última de esta evaluación es la vigente.
    const deLaToma = serie.observaciones.filter((o) => o.punto.sourceEvaluationId === evaluacionId);
    const actual = deLaToma[deLaToma.length - 1];
    if (!actual) continue;
    ultima = ultima ? masReciente(ultima, actual) : actual;
    const previas = observacionesDelGrupo(serie, actual.punto.comparabilityGroup).filter((o) => o.instante < actual.instante && o.punto.sourceEvaluationId !== evaluacionId);
    const anterior = previas[previas.length - 1] ?? null;
    const huboOtraAntes = serie.observaciones.some((o) => o.instante < actual.instante && o.punto.sourceEvaluationId !== evaluacionId);
    const motivoSinAnterior = anterior ? null : huboOtraAntes ? ('OTRO_GRUPO' as const) : ('SIN_PREVIA' as const);
    filas.push({ metrica: serie.metricCode, nombre: nombreDeMetrica(serie.metricCode), actual, anterior, diferencia: anterior ? diferenciaDescriptiva(anterior, actual) : null, motivoSinAnterior });
  }
  if (!ultima) return null;

  const conAnterior = filas.filter((f) => f.anterior !== null).map((f) => f.anterior!.fecha);
  const fechaAnterior = conAnterior.length === 0 ? null : masFrecuente(conAnterior);
  return {
    evaluacionId,
    fecha: ultima.fecha,
    instante: ultima.instante,
    fechaAnterior,
    medidas: filas.filter((f) => f.actual.punto.dataClass !== 'DERIVED').sort(porCatalogo),
    derivadas: filas.filter((f) => f.actual.punto.dataClass === 'DERIVED').sort(porCatalogo),
  };
}

/** La última toma del período, con cada valor junto al anterior comparable; `null` si el período no tiene ninguna. */
export function ultimaToma(datos: Datos): UltimaToma | null {
  const tomas = tomasDelPeriodo(datos);
  const ultima = tomas[tomas.length - 1];
  return ultima ? tomaDe(datos, ultima.evaluacionId) : null;
}

/**
 * Los valores de una métrica en cada toma del período, **del mismo grupo de comparabilidad**: lo que dibuja un gráfico
 * chico de puntos. Una toma sin esa métrica, o con otro protocolo, método o unidad, queda `null`: es un hueco, no un
 * cero ni el valor anterior (REG-06-165/166).
 */
export function valoresPorToma(datos: Datos, metrica: string, comparabilityGroup: string, tomas: readonly TomaDelPeriodo[]): readonly (Observacion | null)[] {
  const serie = seriesDe(datos).find((s) => s.metricCode === metrica);
  const delGrupo = serie ? observacionesDelGrupo(serie, comparabilityGroup) : [];
  return tomas.map((t) => {
    const deLaToma = delGrupo.filter((o) => o.punto.sourceEvaluationId === t.evaluacionId);
    return deLaToma[deLaToma.length - 1] ?? null;
  });
}

/** La fecha que más se repite; ante un empate, la más reciente. */
function masFrecuente(fechas: readonly string[]): string {
  const cuenta = new Map<string, number>();
  for (const f of fechas) cuenta.set(f, (cuenta.get(f) ?? 0) + 1);
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0]![0];
}
