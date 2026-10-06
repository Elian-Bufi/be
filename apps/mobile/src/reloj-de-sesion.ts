/**
 * El reloj de la sesión de entrenamiento (WP-ENTRENAMIENTO-SERIES §5; DL-124; precierre del 2026-10-06, §3).
 *
 * Cada evento de tiempo lleva dos relojes y su origen (`InstanteDeEventoApi`):
 * - **el monotónico, con su base y su ancla** (`monotonic.clock` y `monotonic.anchor`):
 *   - en el teléfono, **el tiempo desde el arranque** (`ELAPSED_SINCE_BOOT`): `SystemClock.elapsedRealtimeNanos()`, por
 *     el módulo nativo `modules/reloj-del-sistema`. Sigue contando mientras el teléfono duerme y no cambia si alguien
 *     cambia la hora. El ancla nombra el arranque: un identificador aleatorio que se guarda junto con el número de
 *     arranque del sistema, que nunca sale del teléfono (`crearRelojDelTelefono`). Después de reiniciar el teléfono, el
 *     ancla es otra, y lo que cruza el reinicio deja de ser medido;
 *   - sin el módulo nativo (el navegador, las pruebas, Expo Go), **el del proceso** (`PROCESS_MONOTONIC`):
 *     `performance.now()`, que en React Native 0.86 es `std::chrono::steady_clock` (CLOCK_MONOTONIC en Android) y no
 *     cuenta el reposo. El ancla nombra el proceso. El dominio lo trata con la tolerancia entre relojes;
 * - **el civil**, `Date.now()`, que ordena, recupera y sincroniza, pero no mide si hay monotónico.
 *
 * Nunca se mezclan bases bajo una misma ancla: el dominio compara la base además del ancla, y las anclas de cada base
 * tienen su prefijo. Que el ancla siga igual después de reabrir la app no cierra nada solo: una medición abierta por
 * otro proceso se pregunta igual (`medicionDeOtroProceso` del almacén). Lo que se muestra mientras corre se recalcula
 * desde los instantes (`enVivo`): este módulo no cuenta nada ni guarda ticks.
 *
 * Es lógica pura y se inyecta: las pruebas usan un reloj de mentira, sin esperas reales.
 */
import type { BaseDelRelojApi, InstanteDeEventoApi } from '@be/domain';

export interface RelojDeSesion {
  /** La base del monotónico: desde el arranque (en el teléfono) o del proceso. */
  readonly base: BaseDelRelojApi;
  /** El ancla del monotónico: la del arranque o la del proceso. */
  readonly ancla: string;
  /** Un instante medido por la app: el monotónico con su base y su ancla, y el civil. */
  ahora(): InstanteDeEventoApi;
  /**
   * Un instante que declara la persona al resolver una medición abierta («Terminó ahora»): solo el civil. Es una
   * declaración, no una medición, y el dominio nunca lo trata como medido.
   */
  declarado(): InstanteDeEventoApi;
  /** El reloj civil, en milisegundos. */
  civilMs(): number;
  /**
   * Se cumple cuando el reloj ya sabe su ancla (la del arranque se lee del teléfono). El almacén lo espera antes de dejar
   * marcar el primer evento: así una corrida no empieza con un ancla y sigue con otra.
   */
  listo?(): Promise<void>;
}

export interface FuentesDelReloj {
  /** Por omisión, el del proceso. */
  readonly base?: BaseDelRelojApi;
  /** El ancla, o cómo leerla cuando todavía se está resolviendo. */
  readonly ancla: string | (() => string);
  /** Milisegundos del monotónico de esa base. */
  readonly monotonico: () => number;
  /** Milisegundos del reloj civil (`Date.now()`). */
  readonly civil: () => number;
  readonly listo?: () => Promise<void>;
}

export function crearReloj({ base = 'PROCESS_MONOTONIC', ancla, monotonico, civil, listo }: FuentesDelReloj): RelojDeSesion {
  const civilIso = () => new Date(civil()).toISOString();
  const anclaActual = typeof ancla === 'string' ? () => ancla : ancla;
  return {
    base,
    get ancla() {
      return anclaActual();
    },
    ahora: () => ({ civil: civilIso(), monotonic: { anchor: anclaActual(), ms: Math.max(0, monotonico()), clock: base }, source: 'MONOTONIC' }),
    declarado: () => ({ civil: civilIso(), monotonic: null, source: 'DECLARED' }),
    civilMs: () => civil(),
    ...(listo ? { listo } : {}),
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

/** La identidad de este proceso: se crea una sola vez, al cargar el módulo. Es también el ancla del reloj del proceso. */
export const ANCLA_DEL_PROCESO = idAleatorio('proceso');

/** El reloj del proceso: `performance.now()` y `Date.now()`, con el ancla de este proceso. */
export const relojDelProceso: RelojDeSesion = crearReloj({ base: 'PROCESS_MONOTONIC', ancla: ANCLA_DEL_PROCESO, monotonico: () => performance.now(), civil: () => Date.now() });

// ─── El reloj del teléfono ──────────────────────────────────────────────────────────────────────

/** Lo que da el módulo nativo `modules/reloj-del-sistema` en Android. */
export interface RelojDelSistema {
  /** `SystemClock.elapsedRealtimeNanos()` en milisegundos: desde el arranque, con el reposo incluido. */
  msDesdeElArranque(): number;
  /** `Settings.Global.BOOT_COUNT`, o `null` si el sistema no lo da. No sale del teléfono. */
  numeroDeArranque(): number | null;
}

/** Lo mínimo para guardar el ancla del arranque (AsyncStorage en el teléfono). */
export interface AlmacenDelAncla {
  leer(clave: string): Promise<string | null>;
  guardar(clave: string, valor: string): Promise<void>;
}

/** Dónde se guarda el ancla del arranque actual, con el número de arranque al que corresponde. */
export const CLAVE_DEL_ANCLA_DEL_ARRANQUE = 'be-reloj-del-arranque';

/**
 * El ancla del arranque: la guardada si es del mismo arranque del sistema, o una nueva. Sin número de arranque, una por
 * proceso: dentro del proceso la duración cuenta el reposo, pero lo que cruza un cierre de la app no se puede restar.
 * Si leer o guardar falla, el ancla es nueva: en el peor caso, lo que cruza el cierre queda estimado, nunca mal medido.
 */
export async function anclaDelArranque(sistema: RelojDelSistema, almacen: AlmacenDelAncla, nuevoId: (prefijo: string) => string, proceso: string): Promise<string> {
  let numero: number | null = null;
  try {
    numero = sistema.numeroDeArranque();
  } catch {
    numero = null;
  }
  if (numero === null || !Number.isInteger(numero)) return `arranque-${proceso}`.slice(0, 64);
  try {
    const guardado = JSON.parse((await almacen.leer(CLAVE_DEL_ANCLA_DEL_ARRANQUE)) ?? 'null') as { v?: unknown; arranque?: unknown; ancla?: unknown } | null;
    if (guardado?.v === 1 && guardado.arranque === numero && typeof guardado.ancla === 'string' && /^arranque-[A-Za-z0-9_-]{4,55}$/.test(guardado.ancla)) return guardado.ancla;
  } catch {
    // Ilegible: se crea otra.
  }
  const ancla = nuevoId('arranque');
  try {
    await almacen.guardar(CLAVE_DEL_ANCLA_DEL_ARRANQUE, JSON.stringify({ v: 1, arranque: numero, ancla }));
  } catch {
    // Sin guardar: el próximo proceso crea otra.
  }
  return ancla;
}

/**
 * El reloj de la sesión en el teléfono: el del arranque si está el módulo nativo, o el del proceso si no. El ancla del
 * arranque se resuelve una vez; hasta que `listo` se cumple, el ancla es una de este proceso, y el almacén no deja
 * marcar nada antes.
 */
export function crearRelojDelTelefono(o: {
  readonly sistema: RelojDelSistema | null;
  readonly almacen: AlmacenDelAncla;
  readonly nuevoId: (prefijo: string) => string;
  readonly proceso?: string;
  readonly civil?: () => number;
}): RelojDeSesion {
  const proceso = o.proceso ?? ANCLA_DEL_PROCESO;
  const civil = o.civil ?? (() => Date.now());
  const sistema = o.sistema;
  if (!sistema) return crearReloj({ base: 'PROCESS_MONOTONIC', ancla: proceso, monotonico: () => performance.now(), civil });
  let ancla = `arranque-${proceso}`.slice(0, 64);
  let resolviendo: Promise<void> | null = null;
  const listo = () =>
    (resolviendo ??= anclaDelArranque(sistema, o.almacen, o.nuevoId, proceso).then((a) => {
      ancla = a;
    }));
  return crearReloj({ base: 'ELAPSED_SINCE_BOOT', ancla: () => ancla, monotonico: () => sistema.msDesdeElArranque(), civil, listo });
}
