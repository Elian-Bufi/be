/**
 * T-06-24 — Momento de ocurrencia / Momento de registro.
 * Fuente: BE-LEG-06 v0.1.1 §2.5.1, REG-06-18 (§4.8.2), CONV-06-05.
 *
 * Par obligatorio en toda entidad o evento que registre un hecho; ninguno sustituye al otro.
 * - Si la ocurrencia es desconocida, permanece desconocida (`null`).
 * - El momento de registro nunca se copia para fingir una ocurrencia inexistente.
 */
export interface ParTemporal {
  /** Cuándo ocurrió el hecho. `null` = desconocido; nunca se completa con el registro. */
  readonly momentoDeOcurrencia: Date | null;
  /** Cuándo BE lo registró. Siempre presente. */
  readonly momentoDeRegistro: Date;
}
