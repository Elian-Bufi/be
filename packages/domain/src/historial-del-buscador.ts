/**
 * «Con historial» en el buscador «Agregar ejercicio» (WP-GRAFICOS GR-04, DL-174; fase 1, solo la marca): antes de elegir
 * un ejercicio, si la persona ya lo hizo, desde cuándo y cuántas veces. En la fila del resultado: «Con historial ·
 * 9 sesiones · la última el mar 3 nov».
 *
 * Los datos ya existen: API-PRJ-01 (`TRAINING_PROGRESSION_BY_EXERCISE`) sin ejercicio devuelve el índice de los ejercicios
 * con sesiones registradas en el período, con `sessions` y `lastDate` (`ejerciciosDelPeriodo`). El período es el último
 * año (la API acepta hasta 366 días y lo recorta al inicio del acompañamiento: RF-025, DJ-14), y la marca lo dice.
 *
 * Lo que no hace, a propósito (la propuesta, «cuidado»): no dice el primer valor ni el último, no dibuja una flecha y no
 * usa color. La vista previa con el último valor y el mínimo y el máximo, que pide una lectura por lote, queda para la
 * fase 2. Un ejercicio sin sesiones no lleva marca: ni «0», ni «sin historial».
 *
 * **Qué cuenta, dicho entero.** `sessions` y `lastDate` son de las sesiones registradas en las que el ejercicio aparece
 * (el contrato de PRJ-01): también las registradas como no realizadas, las que no lo incluyeron y las hechas con otro
 * ejercicio en su lugar. El índice no las separa, así que la línea de arriba de los resultados lo dice, para que «la
 * última el 3 nov» no se lea como «lo hizo el 3 nov»; lo que hizo, serie por serie, está en «La vez pasada» (GR-01).
 * Contar solo las hechas pide la lectura por lote de la fase 2.
 */
import type { EjercicioDelPeriodo } from './contratos-analisis';
import { numero } from './formato-numeros';
import { fechaEnPocasPalabras } from './la-vez-pasada';

export const COPY_HISTORIAL_DEL_BUSCADOR = {
  conHistorial: 'Con historial',
  /** Qué cuenta la marca, dicho una vez arriba de los resultados, con lo que el índice no separa. */
  queCuenta:
    '«Con historial»: en cuántas sesiones registradas de tus planes con esta persona estuvo el ejercicio en el último año, y la última. Cuentan también las registradas como no realizadas o hechas con otro ejercicio: lo que hizo, serie por serie, está en «La vez pasada» del ejercicio.',
  noSeLeyo: 'No pudimos leer las sesiones registradas de la persona, así que los resultados no dicen cuáles ya hizo.',
  reintentar: 'Reintentar',
} as const;

/**
 * El índice de PRJ-01 por ejercicio del catálogo: el `exerciseId` (en minúsculas) → su entrada. Las versiones cuyo
 * ejercicio no se conoce (`v:`) no se pueden atar a un resultado del catálogo y quedan afuera, como las que no tienen
 * ninguna sesión.
 */
export function historialPorEjercicio(ejercicios: readonly EjercicioDelPeriodo[]): ReadonlyMap<string, EjercicioDelPeriodo> {
  return new Map(ejercicios.filter((e) => e.exerciseKey.startsWith('e:') && e.sessions > 0).map((e) => [e.exerciseKey.slice(2).toLowerCase(), e] as const));
}

/**
 * La marca de un resultado: «Con historial · 9 sesiones · la última el mar 3 nov», o «… · la última, hoy». `null` si el
 * ejercicio no tiene sesiones en el período: el resultado va sin marca.
 */
export function marcaDeHistorial(historial: ReadonlyMap<string, EjercicioDelPeriodo>, exerciseId: string, hoy: string): string | null {
  const e = historial.get(exerciseId.toLowerCase());
  if (!e || e.sessions <= 0) return null;
  const partes = [COPY_HISTORIAL_DEL_BUSCADOR.conHistorial, `${numero(e.sessions)} ${e.sessions === 1 ? 'sesión' : 'sesiones'}`];
  if (e.lastDate) partes.push(e.lastDate === hoy ? 'la última, hoy' : `la última el ${fechaEnPocasPalabras(e.lastDate, hoy)}`);
  return partes.join(' · ');
}
