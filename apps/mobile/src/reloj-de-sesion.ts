/**
 * El reloj de la sesión de entrenamiento (WP-ENTRENAMIENTO-SERIES §5; DL-124).
 *
 * Cada evento de tiempo lleva dos relojes y su origen (`InstanteDeEventoApi`):
 * - **el monotónico**, `performance.now()`, que no salta si alguien cambia la hora del teléfono. Solo vale dentro del
 *   proceso que lo leyó: por eso va con el **ancla del proceso**, un identificador aleatorio que se crea al cargar este
 *   módulo. Si el sistema cierra la app, el proceso nuevo tiene otra ancla, y lo que cruza procesos deja de ser medido
 *   (el dominio lo calcula como estimado);
 * - **el civil**, `Date.now()`, que ordena, recupera y sincroniza, pero no mide si hay monotónico.
 *
 * En Android, el monotónico no avanza mientras el teléfono duerme: el dominio lo detecta comparando los dos relojes
 * (`TOLERANCIA_ENTRE_RELOJES_MS`). Lo que se muestra mientras corre se recalcula desde los instantes (`enVivo`): este
 * módulo no cuenta nada ni guarda ticks.
 *
 * Es lógica pura y se inyecta: las pruebas usan un reloj de mentira, sin esperas reales.
 */
import type { InstanteDeEventoApi } from '@be/domain';

export interface RelojDeSesion {
  /** El ancla del proceso: la misma mientras viva la app, otra si el sistema la cerró. */
  readonly ancla: string;
  /** Un instante medido por la app: el monotónico con su ancla y el civil. */
  ahora(): InstanteDeEventoApi;
  /**
   * Un instante que declara la persona al resolver una medición abierta («Terminó ahora»): solo el civil. Es una
   * declaración, no una medición, y el dominio nunca lo trata como medido.
   */
  declarado(): InstanteDeEventoApi;
  /** El reloj civil, en milisegundos. */
  civilMs(): number;
}

export interface FuentesDelReloj {
  readonly ancla: string;
  /** Milisegundos de un reloj que no retrocede (`performance.now()`). */
  readonly monotonico: () => number;
  /** Milisegundos del reloj civil (`Date.now()`). */
  readonly civil: () => number;
}

export function crearReloj({ ancla, monotonico, civil }: FuentesDelReloj): RelojDeSesion {
  const civilIso = () => new Date(civil()).toISOString();
  return {
    ancla,
    ahora: () => ({ civil: civilIso(), monotonic: { anchor: ancla, ms: Math.max(0, monotonico()) }, source: 'MONOTONIC' }),
    declarado: () => ({ civil: civilIso(), monotonic: null, source: 'DECLARED' }),
    civilMs: () => civil(),
  };
}

/**
 * Un identificador aleatorio para lo que genera el cliente (el ancla, una corrida, un evento, un descanso). Cumple el
 * formato de `IdDeClienteSchema` (`[A-Za-z0-9_-]{8,64}`). Usa el generador criptográfico si la plataforma lo tiene; si
 * no, `Math.random`, que alcanza para un identificador que no es un secreto: solo tiene que no repetirse.
 */
export function idAleatorio(prefijo: string, aleatorio?: () => number): string {
  const cripto = (globalThis as { crypto?: { getRandomValues?: (a: Uint32Array) => Uint32Array } }).crypto;
  const partes: string[] = [];
  if (!aleatorio && typeof cripto?.getRandomValues === 'function') {
    const valores = cripto.getRandomValues(new Uint32Array(4));
    for (const v of valores) partes.push(v.toString(36).padStart(7, '0'));
  } else {
    const azar = aleatorio ?? Math.random;
    for (let i = 0; i < 4; i++) partes.push(Math.floor(azar() * 0xffffffff).toString(36).padStart(7, '0'));
  }
  return `${prefijo}-${Date.now().toString(36)}-${partes.join('')}`.slice(0, 64);
}

/** El ancla de este proceso: se crea una sola vez, al cargar el módulo. */
export const ANCLA_DEL_PROCESO = idAleatorio('proceso');

/** El reloj de la app: `performance.now()` y `Date.now()`, con el ancla de este proceso. */
export const relojDelProceso: RelojDeSesion = crearReloj({ ancla: ANCLA_DEL_PROCESO, monotonico: () => performance.now(), civil: () => Date.now() });
