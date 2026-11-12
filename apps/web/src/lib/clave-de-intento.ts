/**
 * La clave de idempotencia de un intento de escritura, sin React (09:253-262; 10-B10:430-438). La usa `useClaveDeIntento`
 * (`lib/intento.ts`), y la prueba la recorre sola.
 *
 * - Una clave por intento lógico. El reintento de un resultado incierto reusa la misma, así el servidor devuelve el
 *   resultado original en vez de ejecutar dos veces.
 * - Después de una respuesta definitiva (éxito o error), el próximo intento es otro y usa una clave nueva.
 * - **ED-62 (WP-EDITORES-PROFESIONAL):** con `de` (lo que se manda; por ejemplo, la versión que se activa), un pedido
 *   distinto es otro intento lógico y usa otra clave: reusar una clave con otro cuerpo da 409 IDEMPOTENCY_KEY_REUSED.
 *   Y `quedoIncierto` dice si el último intento terminó sin saber si ocurrió: entonces «Volver» conserva la clave, y el
 *   intento siguiente, con el mismo pedido, la reusa.
 */
export class ClaveDeIntento {
  #nueva: () => string;
  #clave: string | null = null;
  #de: string | null = null;
  #incierto = false;

  constructor(nueva: () => string) {
    this.#nueva = nueva;
  }

  /** La clave del intento en curso; se crea al primer uso. Con otro `de`, es otro intento: otra clave. */
  actual(de: string | null = null): string {
    if (this.#clave !== null && de !== null && this.#de !== null && this.#de !== de) this.#clave = null;
    this.#clave ??= this.#nueva();
    this.#de = de;
    return this.#clave;
  }

  /** Después de cada respuesta: solo un resultado incierto conserva la clave para el reintento. */
  registrar(incierto: boolean): void {
    this.#incierto = incierto;
    if (!incierto) this.#clave = null;
  }

  /** El usuario abandona el intento: la próxima vez, otra clave. */
  descartar(): void {
    this.#clave = null;
    this.#incierto = false;
  }

  /** ED-62: si el último intento terminó sin saber si ocurrió (sin respuesta, o una que no se entendió). */
  quedoIncierto(): boolean {
    return this.#incierto;
  }
}
