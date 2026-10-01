/**
 * DL-111 · «Tu última toma», para la APK y la lámina del website. Se arma sobre la misma lectura de API-ANT-06 que usa
 * la evolución (`prepararSerie`), así las dos pantallas no pueden decir cosas distintas:
 * - la toma es la evaluación del punto más reciente del período;
 * - de cada métrica que esa evaluación tiene, el valor vigente y el anterior **del mismo grupo de comparabilidad**
 *   (mismo protocolo, método y unidad, REG-06-162), con la diferencia como una resta (`diferenciaDescriptiva`);
 * - las mediciones y los resultados de las fórmulas (corridas vigentes, clase «calculado») van por separado.
 *
 * Nunca califica (TEST-PRJ-009): no hay «mejor» ni «peor», ni un color por rango. Una diferencia es un número con signo.
 */
import type { EvolucionResponse } from './contratos-antropometria';
import { diferenciaDescriptiva, observacionesDelGrupo, prepararSerie, type Observacion } from './evolucion-antropometrica';
import { NOMBRE_DE_METRICA, nombreDeMetrica } from './nombres-de-metricas';

export interface MedidaDeLaToma {
  readonly metrica: string;
  readonly nombre: string;
  readonly actual: Observacion;
  /** La observación anterior del mismo grupo, de otra evaluación; `null` si no hay ninguna en el período. */
  readonly anterior: Observacion | null;
  readonly diferencia: { readonly delta: number; readonly unidad: string; readonly dias: number } | null;
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

/** El orden del catálogo de BE; lo que BE no conoce va al final, por nombre. */
const ORDEN = new Map(Object.keys(NOMBRE_DE_METRICA).map((clave, i) => [clave, i]));
const porCatalogo = (a: MedidaDeLaToma, b: MedidaDeLaToma): number =>
  (ORDEN.get(a.metrica) ?? Number.MAX_SAFE_INTEGER) - (ORDEN.get(b.metrica) ?? Number.MAX_SAFE_INTEGER) || a.nombre.localeCompare(b.nombre, 'es');

/** La última toma del período, con cada valor junto al anterior comparable; `null` si el período no tiene ninguna. */
export function ultimaToma(datos: EvolucionResponse['data']): UltimaToma | null {
  const series = datos.metrics.map((m) => prepararSerie(m, datos.period.timeZone));
  const todas = series.flatMap((s) => s.observaciones);
  if (todas.length === 0) return null;
  const masReciente = todas.reduce((a, b) => (b.instante > a.instante || (b.instante === a.instante && b.punto.recordedAt > a.punto.recordedAt) ? b : a));
  const evaluacionId = masReciente.punto.sourceEvaluationId;

  const filas: MedidaDeLaToma[] = [];
  for (const serie of series) {
    // Las observaciones vienen ordenadas en el tiempo: la última de esta evaluación es la vigente.
    const deLaToma = serie.observaciones.filter((o) => o.punto.sourceEvaluationId === evaluacionId);
    const actual = deLaToma[deLaToma.length - 1];
    if (!actual) continue;
    const previas = observacionesDelGrupo(serie, actual.punto.comparabilityGroup).filter((o) => o.instante < actual.instante && o.punto.sourceEvaluationId !== evaluacionId);
    const anterior = previas[previas.length - 1] ?? null;
    filas.push({ metrica: serie.metricCode, nombre: nombreDeMetrica(serie.metricCode), actual, anterior, diferencia: anterior ? diferenciaDescriptiva(anterior, actual) : null });
  }

  const conAnterior = filas.filter((f) => f.anterior !== null).map((f) => f.anterior!.fecha);
  const fechaAnterior = conAnterior.length === 0 ? null : masFrecuente(conAnterior);
  return {
    evaluacionId,
    fecha: masReciente.fecha,
    instante: masReciente.instante,
    fechaAnterior,
    medidas: filas.filter((f) => f.actual.punto.dataClass !== 'DERIVED').sort(porCatalogo),
    derivadas: filas.filter((f) => f.actual.punto.dataClass === 'DERIVED').sort(porCatalogo),
  };
}

/** La fecha que más se repite; ante un empate, la más reciente. */
function masFrecuente(fechas: readonly string[]): string {
  const cuenta = new Map<string, number>();
  for (const f of fechas) cuenta.set(f, (cuenta.get(f) ?? 0) + 1);
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0]![0];
}
