/**
 * Forma común de las máquinas de estado de WP-03 (06 CONV-06-03): «entidad propietaria; conjunto cerrado de estados;
 * estado inicial; estados terminales; lista blanca de transiciones con actor habilitante, condiciones y efectos;
 * eventos de dominio emitidos». Toda transición no declarada está prohibida.
 *
 * A diferencia de `TransicionDeclarada` (WP-02), acá el origen puede ser `null` = «inicio» (la transición crea la
 * entidad) y cada transición declara sus actores.
 */

export interface TransicionDeMaquina<E extends string, T extends string, A extends string> {
  /** CONV-06-04: verbo en infinitivo. */
  readonly transicion: T;
  /** `null` = inicio (06: «inicio → PENDIENTE»). */
  readonly origen: E | null;
  readonly destino: E;
  /** Actor habilitante declarado por el 06 (o por la DL que lo fija provisoriamente). */
  readonly actores: readonly A[];
  /** CONV-06-05: hecho consumado. Los nombres de M-03 son derivados (DEUDA_LEGAJO DL-033). */
  readonly evento: string;
}

/** Busca la transición declarada para (transición, origen). `undefined` = prohibida. */
export function transicionDe<E extends string, T extends string, A extends string>(
  lista: readonly TransicionDeMaquina<E, T, A>[],
  transicion: T,
  origen: E | null,
): TransicionDeMaquina<E, T, A> | undefined {
  return lista.find((t) => t.transicion === transicion && t.origen === origen);
}

/** Pares (origen, destino) permitidos entre estados existentes: los mismos que exige el trigger de la base. */
export function paresPermitidos<E extends string, T extends string, A extends string>(
  lista: readonly TransicionDeMaquina<E, T, A>[],
): readonly (readonly [E, E])[] {
  return lista.filter((t) => t.origen !== null).map((t) => [t.origen as E, t.destino] as const);
}
