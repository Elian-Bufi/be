/**
 * T-06-02 — Estado operativo de cuenta.
 * Fuente: BE-LEG-06 v0.1.1 §5.7 (B-01 · M-01), CONV-06-02, CONV-06-03.
 *
 * Dimensión de `Identidad BE`: no existe una entidad paralela «Cuenta» (§5.7.1).
 * Conjunto cerrado (§5.7.2). Toda transición no declarada está prohibida (§5.7.4).
 * `OPERATIVA` no concede facultades de otra dimensión (INV-06-27, REG-06-23).
 */

export const EstadoOperativoDeCuenta = {
  OPERATIVA: 'OPERATIVA',
  SUSPENDIDA: 'SUSPENDIDA',
  CERRADA: 'CERRADA',
} as const;

export type EstadoOperativoDeCuenta =
  (typeof EstadoOperativoDeCuenta)[keyof typeof EstadoOperativoDeCuenta];

/** §5.7.2 — estado inicial tras un registro exitoso. */
export const ESTADO_INICIAL_DE_CUENTA: EstadoOperativoDeCuenta = 'OPERATIVA';

/**
 * §5.7.2 — estado terminal bajo el modelo vigente de M-01.
 * La reversibilidad de `CERRADA` no se decide en B-01: no hay transición de salida.
 */
export const ESTADOS_TERMINALES_DE_CUENTA: readonly EstadoOperativoDeCuenta[] = ['CERRADA'];

export interface TransicionDeclarada<E extends string> {
  /** CONV-06-04: verbo en infinitivo. */
  readonly transicion: string;
  readonly origen: E;
  readonly destino: E;
  /** CONV-06-05: hecho consumado. */
  readonly evento: string;
}

/**
 * §5.7.4 — lista blanca de transiciones.
 * `SUSPENDIDA → CERRADA` no se declara (UC-P27 exige titular con sesión válida).
 * Actor habilitante, condiciones y efectos: 06 §5.7.4 y política del 08; se implementan en el módulo M-01.
 */
export const TRANSICIONES_DE_ESTADO_OPERATIVO_DE_CUENTA: readonly TransicionDeclarada<EstadoOperativoDeCuenta>[] = [
  { transicion: 'SuspenderCuenta', origen: 'OPERATIVA', destino: 'SUSPENDIDA', evento: 'CuentaSuspendida' },
  { transicion: 'RestablecerCuenta', origen: 'SUSPENDIDA', destino: 'OPERATIVA', evento: 'CuentaRestablecida' },
  { transicion: 'CerrarCuenta', origen: 'OPERATIVA', destino: 'CERRADA', evento: 'CuentaCerrada' },
];

/** Consulta de la lista blanca: `undefined` significa transición prohibida. */
export function transicionDeclarada(
  origen: EstadoOperativoDeCuenta,
  destino: EstadoOperativoDeCuenta,
): TransicionDeclarada<EstadoOperativoDeCuenta> | undefined {
  return TRANSICIONES_DE_ESTADO_OPERATIVO_DE_CUENTA.find((t) => t.origen === origen && t.destino === destino);
}
