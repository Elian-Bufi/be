/**
 * DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3, ET3-22 y ET3-23) · reordenar los ejercicios de una sesión arrastrando o con el
 * teclado, sin React, para probarlo solo (`apps/web/test/editor-de-entrenamiento-tanda-3-a.test.mjs`).
 *
 * Arrastrar un ejercicio a otro lugar es **subirlo o bajarlo de a un paso** con la misma regla de «Subir» y «Bajar»
 * (`moverEjercicio` de `bloques-del-editor.ts`, DL-181): dentro de un bloque, entre los del bloque; uno suelto salta un
 * bloque entero. Así arrastrar no puede romper un bloque, y lo abierto acompaña a cada ejercicio (`desdeDonde` compuesto).
 * La regla se pasa como función para que este archivo no dependa de otro módulo del website.
 */

/** Lo mismo que `SesionReordenada`: la sesión nueva y, por cada posición nueva, la que tenía antes. */
export interface Reordenada<S> {
  readonly sesion: S;
  readonly desdeDonde: readonly number[];
}

export type Mover<S> = (s: S, l: number, hacia: -1 | 1) => Reordenada<S> | null;

/**
 * Lleva el ejercicio de `desde` lo más cerca posible de `hasta`, de a un paso. `null` si no se movió (ya estaba ahí o la
 * regla no lo deja). `largo` es cuántos ejercicios tiene la sesión.
 */
export function moverHasta<S>(s: S, largo: number, desde: number, hasta: number, mover: Mover<S>): (Reordenada<S> & { readonly posicion: number }) | null {
  if (desde === hasta || desde < 0 || desde >= largo) return null;
  const hacia: -1 | 1 = hasta > desde ? 1 : -1;
  let sesion = s;
  let desdeDonde: number[] = Array.from({ length: largo }, (_, n) => n);
  let posicion = desde;
  // Cada paso lo acerca por lo menos uno; más pasos que ejercicios no hacen falta.
  for (let pasos = 0; pasos < largo; pasos += 1) {
    if (hacia === 1 ? posicion >= hasta : posicion <= hasta) break;
    const r = mover(sesion, posicion, hacia);
    if (!r) break;
    const compuesto = r.desdeDonde.map((vieja) => (vieja < 0 ? -1 : desdeDonde[vieja]!));
    const nueva = compuesto.indexOf(desde);
    if (nueva === posicion) break;
    sesion = r.sesion;
    desdeDonde = compuesto;
    posicion = nueva;
  }
  return posicion === desde ? null : { sesion, desdeDonde, posicion };
}

/** La tecla de reordenar con el teclado: Alt+↑ sube, Alt+↓ baja (ET3-D23). `null` si es otra. */
export function pasoDelTeclado(t: { readonly key: string; readonly altKey: boolean; readonly ctrlKey: boolean; readonly metaKey: boolean; readonly shiftKey: boolean }): -1 | 1 | null {
  if (!t.altKey || t.ctrlKey || t.metaKey || t.shiftKey) return null;
  return t.key === 'ArrowUp' ? -1 : t.key === 'ArrowDown' ? 1 : null;
}

/**
 * A qué posición va lo que se suelta sobre la tarjeta `sobre`: arriba de ella si se suelta en su mitad de arriba, abajo si
 * en la de abajo. La posición es la que queda en la lista sin el que se arrastra corrido (la de `moverHasta`).
 */
export function destinoAlSoltar(desde: number, sobre: number, enLaMitadDeArriba: boolean): number {
  if (sobre === desde) return desde;
  if (sobre > desde) return enLaMitadDeArriba ? sobre - 1 : sobre;
  return enLaMitadDeArriba ? sobre : sobre + 1;
}

/** Lo que se le anuncia al lector al mover (aria-live). */
export const COPY_REORDENAR = {
  movido: (nombre: string, posicion: number, total: number) => `«${nombre}» quedó en el lugar ${posicion + 1} de ${total}.`,
  noSeMueve: (nombre: string) => `«${nombre}» no se puede mover más para ese lado.`,
  agarrar: 'Arrastrar para reordenar',
  ayuda: 'Arrastrá el ejercicio desde su asa, o usá Alt+↑ y Alt+↓ con el foco en el ejercicio.',
} as const;
