/**
 * Lo que los gráficos de Entrenamiento toman del comparador «Planificado y registrado» (WP-GRAFICOS fase 2, rama B;
 * DL-174; GR-T14): las sesiones registradas de API-TRN-21, leídas en tramos de 92 días, con los objetivos por serie de
 * cada versión (API-SER-01). Las cuentas son las del dominio (`observacionesDelEjercicio`, `evolucion`, `valorPlanificado`):
 * acá solo se elige qué mirar. Lo indicado es siempre el de la versión que ejecutó cada sesión (REG-06-105).
 *
 * Es puro: lo prueba `apps/web/test/graficos-entrenamiento.test.mjs`.
 */
import { observacionesDelEjercicio, type EjecucionDeEntrenamiento, type ObjetivosDeLaVersion, type ObservacionDeEvolucion } from '@be/domain';

/** El día civil de un instante en una zona («AAAA-MM-DD»), sin pasar por la zona del navegador. */
export function diaCivilEn(instante: string, zona: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(instante));
  } catch {
    return instante.slice(0, 10);
  }
}

/**
 * Las sesiones cargadas en un día posterior al de la sesión, por su ejecución: lo cargado tarde es un recuerdo, y se marca
 * en cada punto y en la tira de cobertura (la regla de honestidad de lo cargado tarde).
 */
export function cargadasDespues(ejecuciones: readonly Pick<EjecucionDeEntrenamiento, 'executionId' | 'date' | 'recordedAt' | 'timeZone'>[]): ReadonlySet<string> {
  return new Set(ejecuciones.filter((x) => diaCivilEn(x.recordedAt, x.timeZone) > x.date).map((x) => x.executionId));
}

/** Las fechas de las sesiones del ejercicio cargadas después: lo que marca la tira de cobertura de un carril. */
export function fechasCargadasDespues(observaciones: readonly ObservacionDeEvolucion[], tardias: ReadonlySet<string>): ReadonlySet<string> {
  return new Set(observaciones.filter((o) => tardias.has(o.comparacion.executionId)).map((o) => o.comparacion.fecha));
}

/**
 * Las observaciones del ejercicio en el período (cada una, una prescripción de una sesión registrada), en el orden en que
 * ocurrieron, con lo indicado por la versión que rigió. `exerciseKey` es `e:<exerciseId>` (o `v:<versionId>`).
 */
export function observacionesDelPeriodo(
  ejecuciones: readonly EjecucionDeEntrenamiento[],
  exerciseKey: string,
  objetivosPorVersion: ReadonlyMap<string, ObjetivosDeLaVersion>,
  desde: string,
  hasta: string,
): ObservacionDeEvolucion[] {
  return observacionesDelEjercicio(ejecuciones, exerciseKey, ejecuciones, objetivosPorVersion).filter((o) => o.comparacion.fecha >= desde && o.comparacion.fecha <= hasta);
}

/** La mediana de unos valores, o `null` si no hay. */
export function mediana(valores: readonly number[]): number | null {
  if (valores.length === 0) return null;
  const v = [...valores].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 === 1 ? v[m]! : (v[m - 1]! + v[m]!) / 2;
}
