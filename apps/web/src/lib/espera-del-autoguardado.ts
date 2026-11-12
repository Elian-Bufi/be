/**
 * ED-60 · El autoguardado no insiste ante un error que no se arregla solo (WP-EDITORES-PROFESIONAL; V3 PR-B: «no
 * convertir un error de tamaño en reintento infinito»).
 *
 * Antes, cuando un guardado fallaba, el autoguardado volvía a intentar a los 4 s, una y otra vez: con un plan grande,
 * cada intento subía hasta 700 KB y dejaba un rechazo auditado. Ahora:
 * - **un cambio** en lo escrito se guarda en la primera pausa (4 s), como siempre (DL-148);
 * - **un rechazo que no se arregla solo** (demasiado grande, u otro rechazo del contrato) no se reintenta hasta que
 *   cambie lo escrito o el profesional toque «Reintentar»;
 * - **sin respuesta**, los intentos se espacian: 4 s de pausa y después 8, 16, 32 y 60 s, y cada 60 s; vuelven a 4 s con
 *   el evento `online` o con un cambio.
 *
 * Sin React ni navegador: el reloj se recibe, así que la prueba lo reemplaza por temporizadores falsos.
 */

/** Cómo terminó un intento de guardar. `NADA`: no se intentó (algo no deja guardar). */
export type ResultadoDelIntento = 'GUARDADO' | 'SIN_RESPUESTA' | 'DEMASIADO_GRANDE' | 'OTRO' | 'NADA';

export const DEMORA_DEL_AUTOGUARDADO_MS = 4_000;
/** La espera después de la 1.ª, 2.ª, 3.ª y 4.ª falla sin respuesta seguidas; desde la 4.ª, cada 60 s. */
export const ESPERAS_SIN_RESPUESTA_MS: readonly number[] = [8_000, 16_000, 32_000, 60_000];

export interface RelojDelAutoguardado {
  setTimeout(f: () => void, ms: number): unknown;
  clearTimeout(t: unknown): void;
}

/** La espera antes del próximo intento después de `seguidas` fallas sin respuesta (desde 1). */
export function esperaSinRespuesta(seguidas: number): number {
  return ESPERAS_SIN_RESPUESTA_MS[Math.min(Math.max(seguidas, 1), ESPERAS_SIN_RESPUESTA_MS.length) - 1]!;
}

/**
 * Decide cuándo intenta el autoguardado. El editor le avisa los cambios, si puede guardar ahora (`activo`: nada abierto,
 * nada en viaje, nada mal escrito) y el resultado de cada intento, automático o no.
 */
export class PlanificadorDelAutoguardado {
  #intentar: () => void;
  #reloj: RelojDelAutoguardado;
  #demoraMs: number;
  #temporizador: unknown = null;
  #activo = false;
  /** Un rechazo que no se arregla solo: nada hasta un cambio o «Reintentar». */
  #bloqueado = false;
  #sinRespuestaSeguidas = 0;

  constructor(intentar: () => void, reloj: RelojDelAutoguardado, demoraMs: number = DEMORA_DEL_AUTOGUARDADO_MS) {
    this.#intentar = intentar;
    this.#reloj = reloj;
    this.#demoraMs = demoraMs;
  }

  /** Lo escrito cambió: se guarda en la primera pausa, aunque el intento anterior se haya rechazado. */
  cambio(): void {
    this.#bloqueado = false;
    this.#sinRespuestaSeguidas = 0;
    if (this.#activo) this.#programar(this.#demoraMs);
  }

  /** El editor puede guardar: retoma lo pendiente con la espera que corresponde (nada, si hubo un rechazo). */
  reanudar(): void {
    this.#activo = true;
    if (this.#bloqueado) return;
    this.#programar(this.#sinRespuestaSeguidas > 0 ? esperaSinRespuesta(this.#sinRespuestaSeguidas) : this.#demoraMs);
  }

  /** El editor no puede guardar ahora (un guardado en viaje, un cuadro abierto, algo mal escrito): se espera. */
  pausar(): void {
    this.#activo = false;
    this.#cancelar();
  }

  /**
   * El resultado de un intento, automático o del profesional («Guardar ahora», «Reintentar»). `conCambiosDespues`: lo
   * escrito cambió mientras el guardado viajaba, así que lo rechazado ya no es lo que está en pantalla.
   */
  resultado(r: ResultadoDelIntento, conCambiosDespues = false): void {
    if (r === 'NADA') return;
    if (r === 'GUARDADO') {
      this.#bloqueado = false;
      this.#sinRespuestaSeguidas = 0;
      return this.#cancelar();
    }
    if (r === 'SIN_RESPUESTA') {
      this.#bloqueado = false;
      this.#sinRespuestaSeguidas += 1;
      if (this.#activo) this.#programar(esperaSinRespuesta(this.#sinRespuestaSeguidas));
      return;
    }
    // Un rechazo que no se arregla solo espera un cambio. Si el cambio llegó mientras viajaba el guardado, ya está: lo
    // nuevo se intenta en la primera pausa.
    if (conCambiosDespues) {
      this.#bloqueado = false;
      if (this.#activo) this.#programar(this.#demoraMs);
      return;
    }
    this.#bloqueado = true;
    this.#cancelar();
  }

  /** Volvió la conexión: si lo último fue sin respuesta, la espera vuelve a 4 s. */
  enLinea(): void {
    if (this.#sinRespuestaSeguidas === 0) return;
    this.#sinRespuestaSeguidas = 0;
    if (this.#activo && !this.#bloqueado) this.#programar(this.#demoraMs);
  }

  /** Si hay un intento esperando (para las pruebas y para decir «se reintenta»). */
  get programado(): boolean {
    return this.#temporizador !== null;
  }

  detener(): void {
    this.#activo = false;
    this.#cancelar();
  }

  #programar(ms: number): void {
    this.#cancelar();
    this.#temporizador = this.#reloj.setTimeout(() => {
      this.#temporizador = null;
      this.#intentar();
    }, ms);
  }

  #cancelar(): void {
    if (this.#temporizador !== null) this.#reloj.clearTimeout(this.#temporizador);
    this.#temporizador = null;
  }
}
