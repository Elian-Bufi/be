/**
 * La sesión vive en memoria, fuera del árbol de React (2026-10-03).
 *
 * Android vuelve a crear la pantalla de la app cuando cambia el tamaño de letra o de visualización, el idioma o la
 * negrita del sistema: esos cambios no están en `configChanges`. React monta todo de nuevo y el estado de los
 * componentes se pierde, aunque el proceso y el motor de JavaScript sigan vivos. Mientras la sesión estuvo en el estado
 * de la raíz, cambiar el tamaño de letra devolvía a la bienvenida. Guardada acá, sobrevive a eso, junto con la pantalla
 * en la que se estaba.
 *
 * **No sobrevive a la muerte del proceso.** Este módulo no guarda nada: si el sistema cierra el proceso, o la persona
 * cierra la app desde Recientes, vuelve a empezar vacío. Para ese caso está la credencial guardada
 * (`sesion-persistente.ts`, DL-012): al abrir, la raíz la verifica con la API antes de mostrar nada protegido.
 *
 * **Cuándo vence.** Lo dice la API: `expiresAt`. La duración se mide contra el reloj del servidor (la cabecera `Date`
 * de la respuesta del inicio de sesión), así un reloj del teléfono adelantado o atrasado no la cambia. El tiempo que
 * pasa se mide con un reloj monótono (`performance.now()`). Ese reloj puede quedarse corto si el teléfono duerme, pero
 * nunca se adelanta. Así la app nunca da por vencida una sesión antes que la API. Si se queda corta, el próximo pedido
 * recibe `SESSION_EXPIRED` y la app lo dice igual. Sin la cabecera, se compara `expiresAt` con el reloj del teléfono y
 * el aviso no dice cuánto duraba.
 *
 * **Con el teléfono dormido**, el reloj monótono se detiene. Si al volver el reloj de pared dice que ya pasó la vigencia,
 * la sesión *pudo* vencer (`quizasVencida`). Entonces la app no lo declara, pero ninguna pantalla conserva lo
 * confirmado: todas vuelven a verificar con la API. Sin red no se muestra nada protegido, y con red la API decide.
 */
import type { Ruta } from './navegacion';

export interface Sesion {
  readonly token: string;
  readonly identidadId: string;
  /** Cuánto dura esta sesión según la API (`expiresAt` menos la hora del servidor al iniciarla); `null` si no se supo. */
  readonly vigenciaMs: number | null;
  /** `performance.now()` al iniciar la sesión. */
  readonly inicioMonotono: number;
  /** `Date.now()` al iniciar la sesión: solo para sospechar un vencimiento mientras el teléfono dormía. */
  readonly inicioReloj: number;
  /** `expiresAt` en el reloj del teléfono: solo para cuando no se conoce la vigencia. */
  readonly expiraEnReloj: number;
}

/** Más de esto no es una sesión de BE (DL-012 fija ≤ 24 h): una cuenta así viene de una cabecera rota. */
const VIGENCIA_MAXIMA_CREIBLE_MS = 48 * 3_600_000;

/** La sesión que devolvió el inicio de sesión, con su vigencia medida contra el reloj del servidor. */
export function crearSesion(datos: { token: string; identidadId: string; expiresAt: string; fechaDelServidor?: string | null }, ahoraMonotono: number, ahoraReloj: number): Sesion {
  const expira = Date.parse(datos.expiresAt);
  const servidor = datos.fechaDelServidor ? Date.parse(datos.fechaDelServidor) : Number.NaN;
  const vigencia = expira - servidor;
  const vigenciaMs = Number.isFinite(vigencia) && vigencia > 0 && vigencia <= VIGENCIA_MAXIMA_CREIBLE_MS ? vigencia : null;
  return { token: datos.token, identidadId: datos.identidadId, vigenciaMs, inicioMonotono: ahoraMonotono, inicioReloj: ahoraReloj, expiraEnReloj: expira };
}

/**
 * Si el reloj de pared dice que ya pasó la vigencia. No alcanza para declarar el vencimiento, porque ese reloj se puede
 * mover. Alcanza para no mostrar nada sin volver a preguntarle a la API.
 */
export function quizasVencida(sesion: Sesion, ahoraReloj: number): boolean {
  return sesion.vigenciaMs === null ? sesion.expiraEnReloj <= ahoraReloj : ahoraReloj - sesion.inicioReloj >= sesion.vigenciaMs;
}

/** Lo que le queda a la sesión, en ms (≤ 0: venció). */
export function restanteMs(sesion: Sesion, ahoraMonotono: number, ahoraReloj: number): number {
  return sesion.vigenciaMs === null ? sesion.expiraEnReloj - ahoraReloj : sesion.vigenciaMs - (ahoraMonotono - sesion.inicioMonotono);
}

/** El aviso de una sesión vencida: dice cuánto duraba solo si lo dijo la API. */
export function avisoDeVencimiento(sesion: Pick<Sesion, 'vigenciaMs'> | null): string {
  if (!sesion || sesion.vigenciaMs === null) return 'Tu sesión venció. Iniciá sesión para continuar.';
  const horas = Math.round(sesion.vigenciaMs / 3_600_000);
  const duracion = horas >= 1 ? `${horas} ${horas === 1 ? 'hora' : 'horas'}` : `${Math.max(1, Math.round(sesion.vigenciaMs / 60_000))} minutos`;
  return `Tu sesión venció: duraba ${duracion}. Iniciá sesión para continuar.`;
}

let recordada: { readonly sesion: Sesion; readonly ruta: Ruta } | null = null;

export type SesionAlMontar = { readonly estado: 'vigente'; readonly sesion: Sesion; readonly ruta: Ruta } | { readonly estado: 'vencida'; readonly sesion: Sesion } | { readonly estado: 'ninguna' };

/**
 * Lo que encuentra la raíz al montarse:
 * - la sesión que seguía viva en el proceso;
 * - una que venció mientras tanto, comprobado con su propia vigencia;
 * - o nada, si el proceso es nuevo.
 */
export function sesionAlMontar(ahoraMonotono: number, ahoraReloj: number): SesionAlMontar {
  if (!recordada) return { estado: 'ninguna' };
  if (restanteMs(recordada.sesion, ahoraMonotono, ahoraReloj) <= 0) return { estado: 'vencida', sesion: recordada.sesion };
  return { estado: 'vigente', sesion: recordada.sesion, ruta: recordada.ruta };
}

export function recordarSesion(sesion: Sesion, ruta: Ruta): void {
  recordada = { sesion, ruta };
}

export function olvidarSesion(): void {
  recordada = null;
}
