/**
 * Lo que devuelve una lectura de los gráficos de Nutrición y Antropometría (WP-GRAFICOS fase 2, rama C; DL-174). Todas
 * van a la API, que decide con el PDP en cada una: no hay caché de datos de salud en el navegador. Un 404 es «sin
 * acceso» (anti-enumeración) y no deja rastro; cualquier otra falla se dice con «Reintentar», sin parecer un vacío.
 */
import type { MotivoDeFalla } from '../../../../../lib/fallas';

export type Leido<T> =
  | { readonly tipo: 'LISTO'; readonly datos: T }
  | { readonly tipo: 'SIN_ACCESO' }
  | { readonly tipo: 'ERROR'; readonly motivo: MotivoDeFalla }
  /** La respuesta cerró la sesión: la pantalla ya va al ingreso y no se cambia nada. */
  | { readonly tipo: 'SESION' };

/** Lo que dibuja un gráfico leído: el gráfico, o un estado que no se dibuja (sin datos, sin acceso, una falla). */
export type GraficoLeido<T> =
  | Leido<T>
  | { readonly tipo: 'SIN_DATOS'; readonly texto: string }
  | { readonly tipo: 'FALTA_HISTORIA'; readonly hay: readonly number[]; readonly hacen: number; readonly unidad: string };

/** Lo que no es `LISTO`, tal cual: sirve para devolver la falla de una lectura como la del gráfico. */
export type FallaDeLaLectura = Exclude<Leido<never>, { readonly tipo: 'LISTO' }>;

export const esFalla = <T>(l: Leido<T>): l is Extract<Leido<T>, { readonly tipo: 'SIN_ACCESO' | 'ERROR' | 'SESION' }> => l.tipo !== 'LISTO';

/**
 * Si una lectura nueva es de lo mismo que la anterior (la misma persona y el mismo período, sin «Reintentar»): entonces lo
 * que se ve sigue a la vista hasta que llega lo nuevo y la página no salta, como «Registros» cuando relee en silencio
 * después de guardar. Compara cada dependencia con `Object.is`; sin una lectura anterior, no es la misma.
 */
export function esLaMismaLectura(anterior: readonly unknown[] | null, ahora: readonly unknown[]): boolean {
  return anterior !== null && anterior.length === ahora.length && ahora.every((d, i) => Object.is(d, anterior[i]));
}
