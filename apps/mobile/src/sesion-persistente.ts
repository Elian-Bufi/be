/**
 * La sesión guardada en el teléfono (DL-012, decisión de Dirección del 2026-10-03).
 *
 * **Qué se guarda.** El token que entregó la API al iniciar sesión, con la identidad, su vencimiento (`expiresAt`) y
 * cuánto duraba la sesión, para poder decirlo si vence. Nada más:
 * - ni la contraseña;
 * - ni datos de salud;
 * - ni la pantalla en la que se estaba.
 * Va al almacenamiento seguro de la plataforma (`almacen-seguro.ts`; en Android, cifrado con una clave del Keystore),
 * nunca a un almacenamiento plano. Este módulo no importa ningún almacenamiento: recibe uno, y así se prueba sin
 * teléfono.
 *
 * **Un token guardado no es una sesión autorizada.** Al abrir la app se verifica con la API (API-ACC-05, `/me`) antes de
 * mostrar nada protegido:
 * - la API lo acepta: la sesión sigue, con la vigencia que la API informa en ese momento;
 * - la API dice que venció (`SESSION_EXPIRED`): se borra, y se va a Iniciar sesión con el aviso de vencimiento;
 * - la API dice que no sirve (revocada o inválida), o la identidad no coincide: se borra, y se va a Iniciar sesión;
 * - sin red, con un 429, un 5xx o cualquier otra falla, no se borra. La app dice que no pudo verificarla y deja
 *   reintentar.
 * No hay renovación: la sesión vence cuando la API dice, como siempre (12 h desde que se inició).
 *
 * **Las causas se distinguen** (WP-ENTRENAMIENTO-SERIES §7.6; encargo del 2026-10-06, §8): sin conexión (el pedido
 * falló sin respuesta), tiempo agotado (pasaron los 10 s del tope), servicio no disponible (un 5xx o un 429) y otra
 * respuesta. Solo la credencial inválida vuelve a Iniciar sesión. A los 5 s (`UMBRAL_DE_DEMORA_MS`) la pantalla dice que
 * está tardando y ofrece reintentar; el pedido sigue hasta su tope.
 *
 * **Operaciones en fila.** Las operaciones sobre el almacén se hacen de a una, y cada pedido nuevo deja sin efecto a los
 * anteriores que todavía no empezaron. Así una escritura lenta no puede volver a dejar el token después de un cierre de
 * sesión o de un cambio de cuenta: el estado final es siempre el del último pedido.
 */
import { CODIGOS_DE_SESION_NO_VALIDA, type MeResponse, type Resultado } from '@be/domain';
import type { Sesion } from './sesion-en-memoria';

/** Lo mínimo que se le pide a un almacenamiento seguro. */
export interface AlmacenSeguro {
  leer(clave: string): Promise<string | null>;
  guardar(clave: string, valor: string): Promise<void>;
  borrar(clave: string): Promise<void>;
}

/** La clave de la credencial en el almacén (solo letras, números, puntos y guiones, como pide la plataforma). */
export const CLAVE_DE_LA_SESION = 'be.sesion';

/** El aviso de una credencial que la API rechazó sin decir que venció. */
export const AVISO_DE_SESION_NO_VALIDA = 'La sesión ya no es válida. Iniciá sesión para continuar.';

export interface CredencialGuardada {
  readonly token: string;
  readonly identidadId: string;
  /** El vencimiento que informó la API al iniciar la sesión. */
  readonly expiresAt: string;
  /** Cuánto duraba la sesión según la API, para el aviso de vencimiento; `null` si no se supo. */
  readonly vigenciaMs: number | null;
}

const VERSION = 1;

export function serializarCredencial(c: CredencialGuardada): string {
  return JSON.stringify({ v: VERSION, token: c.token, identidadId: c.identidadId, expiresAt: c.expiresAt, vigenciaMs: c.vigenciaMs });
}

/** La credencial guardada, o `null` si no hay nada o lo que hay no tiene la forma esperada. */
export function leerCredencial(texto: string | null): CredencialGuardada | null {
  if (texto === null) return null;
  try {
    const o = JSON.parse(texto) as Record<string, unknown>;
    const vigenciaValida = o.vigenciaMs === null || (typeof o.vigenciaMs === 'number' && Number.isFinite(o.vigenciaMs) && o.vigenciaMs > 0);
    if (o.v !== VERSION || typeof o.token !== 'string' || o.token === '' || typeof o.identidadId !== 'string' || o.identidadId === '') return null;
    if (typeof o.expiresAt !== 'string' || !Number.isFinite(Date.parse(o.expiresAt)) || !vigenciaValida) return null;
    return { token: o.token, identidadId: o.identidadId, expiresAt: o.expiresAt, vigenciaMs: o.vigenciaMs as number | null };
  } catch {
    return null;
  }
}

export type LecturaDeCredencial = { readonly tipo: 'ninguna' } | { readonly tipo: 'credencial'; readonly credencial: CredencialGuardada } | { readonly tipo: 'error' };

export interface GuardaDeSesion {
  /** Guarda la credencial. Devuelve si quedó guardada y sigue siendo la última pedida. */
  guardar(credencial: CredencialGuardada): Promise<boolean>;
  /** Borra la credencial. Devuelve si se pudo borrar. */
  borrar(): Promise<boolean>;
  /** Lee la credencial. Si el almacén no responde a tiempo o falla, devuelve `error`: la app no se queda esperando. */
  leer(): Promise<LecturaDeCredencial>;
  /** Si la sesión de este token quedó guardada en el teléfono: `true`, `false`, o `null` si todavía no se sabe. */
  recordada(token: string): boolean | null;
}

export function crearGuardaDeSesion(almacen: AlmacenSeguro, opciones: { readonly esperaMaximaDeLecturaMs?: number } = {}): GuardaDeSesion {
  const espera = opciones.esperaMaximaDeLecturaMs ?? 4000;
  let cola: Promise<unknown> = Promise.resolve();
  let ultimoPedido = 0;
  let estado: { readonly token: string; readonly guardada: boolean | null } | null = null;

  function enFila<T>(operacion: () => Promise<T>): Promise<T> {
    const resultado = cola.then(operacion);
    cola = resultado.catch(() => undefined);
    return resultado;
  }

  return {
    guardar(credencial) {
      const pedido = ++ultimoPedido;
      estado = { token: credencial.token, guardada: null };
      return enFila(async () => {
        // Si antes de su turno se pidió otra cosa (un borrado, otra cuenta), esta escritura ya no corresponde.
        if (pedido !== ultimoPedido) return false;
        try {
          await almacen.guardar(CLAVE_DE_LA_SESION, serializarCredencial(credencial));
        } catch {
          if (estado?.token === credencial.token) estado = { token: credencial.token, guardada: false };
          return false;
        }
        // Si mientras escribía se pidió un borrado, la fila lo hace a continuación: el estado final es el último pedido.
        const vigente = pedido === ultimoPedido;
        if (vigente) estado = { token: credencial.token, guardada: true };
        return vigente;
      });
    },
    borrar() {
      ++ultimoPedido;
      estado = null;
      return enFila(async () => {
        try {
          await almacen.borrar(CLAVE_DE_LA_SESION);
          return true;
        } catch {
          return false;
        }
      });
    },
    leer() {
      return enFila(async () => {
        let texto: string | null;
        try {
          texto = await conEspera(almacen.leer(CLAVE_DE_LA_SESION), espera);
        } catch {
          return { tipo: 'error' } as const;
        }
        const credencial = leerCredencial(texto);
        if (credencial) {
          estado = { token: credencial.token, guardada: true };
          return { tipo: 'credencial', credencial } as const;
        }
        // Algo que no es una credencial válida no sirve para nada: se borra, sin esperar.
        if (texto !== null) void almacen.borrar(CLAVE_DE_LA_SESION).catch(() => undefined);
        return { tipo: 'ninguna' } as const;
      });
    },
    recordada(token) {
      return estado?.token === token ? estado.guardada : null;
    },
  };
}

function conEspera<T>(promesa: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolver, rechazar) => {
    const reloj = setTimeout(() => rechazar(new Error('El almacenamiento seguro no respondió a tiempo.')), ms);
    promesa.then(
      (valor) => {
        clearTimeout(reloj);
        resolver(valor);
      },
      (error: unknown) => {
        clearTimeout(reloj);
        rechazar(error);
      },
    );
  });
}

export type Recuperacion =
  /** No hay credencial guardada, o no se pudo leer: la app arranca en la bienvenida. */
  | { readonly tipo: 'ninguna' }
  /** La API aceptó la credencial: la sesión sigue. */
  | { readonly tipo: 'recuperada'; readonly sesion: Sesion; readonly credencial: CredencialGuardada }
  /** La API dijo que venció: se borró. El aviso lo arma la raíz con `avisoDeVencimiento` y esta vigencia. */
  | { readonly tipo: 'vencida'; readonly vigenciaMs: number | null }
  /** La API la rechazó, o la identidad no coincide: se borró. */
  | { readonly tipo: 'no-valida'; readonly aviso: string }
  /**
   * No se pudo verificar (red, tiempo agotado, 429, 5xx u otra falla): sigue guardada y se puede reintentar. `causa` dice
   * cuál; `sinConexion` es lo mismo que `causa === 'sin-conexion'`.
   */
  | { readonly tipo: 'sin-verificar'; readonly credencial: CredencialGuardada; readonly sinConexion: boolean; readonly causa: CausaDeLaFalla };

/**
 * Por qué no se pudo verificar la credencial:
 * - `sin-conexion`: el pedido falló sin respuesta;
 * - `tiempo-agotado`: la API no respondió antes del tope (`TOPE_DE_VERIFICACION_MS`);
 * - `servicio-no-disponible`: un 5xx o un 429;
 * - `otra`: cualquier otra respuesta que no prueba que la sesión no sirva (un 403, una respuesta que no se reconoce).
 * Ninguna borra la credencial.
 */
export type CausaDeLaFalla = 'sin-conexion' | 'tiempo-agotado' | 'servicio-no-disponible' | 'otra';

/** A los 5 s de comprobar, la pantalla dice que está tardando más de lo habitual y ofrece reintentar. */
export const UMBRAL_DE_DEMORA_MS = 5_000;
/** El tope del pedido que verifica la credencial: pasado este tiempo, la causa es «tiempo agotado». */
export const TOPE_DE_VERIFICACION_MS = 10_000;

/** Lo que vuelve de la verificación: la respuesta de la API, o el tope cumplido sin respuesta. */
export const TIEMPO_AGOTADO = { ok: false, tipo: 'TIEMPO_AGOTADO' } as const;
export type RespuestaDeVerificacion = Resultado<MeResponse> | typeof TIEMPO_AGOTADO;

/** La causa de una falla que no invalida la credencial. */
export function causaDeLaFalla(r: Exclude<RespuestaDeVerificacion, { readonly ok: true }>): CausaDeLaFalla {
  if (r.tipo === 'TIEMPO_AGOTADO') return 'tiempo-agotado';
  if (r.tipo === 'RED') return 'sin-conexion';
  if (r.status === 429 || r.status >= 500) return 'servicio-no-disponible';
  return 'otra';
}

/** Un temporizador inyectable: espera `ms` y llama; devuelve cómo cancelarlo. */
export interface TemporizadorDeDemora {
  esperar(ms: number, alCumplirse: () => void): () => void;
}

/**
 * Avisa una vez cuando una comprobación pasa el umbral de demora. `reiniciar` vuelve a contar (un reintento) y `parar`
 * lo cancela (llegó la respuesta). Con el temporizador inyectado, se prueba sin esperas reales.
 */
export function crearVigiaDeDemora(temporizador: TemporizadorDeDemora, alTardar: () => void, umbralMs = UMBRAL_DE_DEMORA_MS): { reiniciar(): void; parar(): void } {
  let cancelar: (() => void) | null = null;
  const parar = () => {
    cancelar?.();
    cancelar = null;
  };
  return {
    reiniciar() {
      parar();
      cancelar = temporizador.esperar(umbralMs, () => {
        cancelar = null;
        alTardar();
      });
    },
    parar,
  };
}

/**
 * La sesión en memoria a partir de lo que la API dice ahora. Le queda `expiresAt` menos la hora del servidor de esta
 * respuesta. La vigencia total, la del aviso, es la que se midió al iniciarla. Los relojes arrancan como si la sesión
 * hubiera empezado hace (total − restante), así `restanteMs` y `quizasVencida` siguen valiendo sin cambios.
 */
export function sesionRecuperada(credencial: CredencialGuardada, expiresAt: string, fechaDelServidor: string | null, ahoraMonotono: number, ahoraReloj: number): Sesion {
  const expira = Date.parse(expiresAt);
  const restante = expira - (fechaDelServidor ? Date.parse(fechaDelServidor) : Number.NaN);
  const total = credencial.vigenciaMs;
  if (total !== null && Number.isFinite(restante) && restante > 0 && restante <= total) {
    const transcurrido = total - restante;
    return { token: credencial.token, identidadId: credencial.identidadId, vigenciaMs: total, inicioMonotono: ahoraMonotono - transcurrido, inicioReloj: ahoraReloj - transcurrido, expiraEnReloj: expira };
  }
  // Sin la hora del servidor, o con valores que no cierran, se compara `expiresAt` con el reloj del teléfono, y el aviso
  // no dice cuánto duraba (como en `crearSesion`).
  return { token: credencial.token, identidadId: credencial.identidadId, vigenciaMs: null, inicioMonotono: ahoraMonotono, inicioReloj: ahoraReloj, expiraEnReloj: expira };
}

/** Lo que significa la respuesta de la API (o el tope cumplido) para una credencial guardada. */
export function decidirRecuperacion(credencial: CredencialGuardada, r: RespuestaDeVerificacion, ahoraMonotono: number, ahoraReloj: number): Exclude<Recuperacion, { tipo: 'ninguna' }> {
  if (r.ok) {
    if (r.datos.data.identityId !== credencial.identidadId) return { tipo: 'no-valida', aviso: AVISO_DE_SESION_NO_VALIDA };
    return { tipo: 'recuperada', credencial, sesion: sesionRecuperada(credencial, r.datos.data.session.expiresAt, r.fechaDelServidor ?? null, ahoraMonotono, ahoraReloj) };
  }
  if (r.tipo === 'API' && CODIGOS_DE_SESION_NO_VALIDA.has(r.codigo)) {
    return r.codigo === 'SESSION_EXPIRED' ? { tipo: 'vencida', vigenciaMs: credencial.vigenciaMs } : { tipo: 'no-valida', aviso: AVISO_DE_SESION_NO_VALIDA };
  }
  // Ni la red, ni el tiempo agotado, ni un 429 o un 5xx, ni un 403 prueban que la sesión no sirva: no se borra nada.
  const causa = causaDeLaFalla(r);
  return { tipo: 'sin-verificar', credencial, sinConexion: causa === 'sin-conexion', causa };
}

/**
 * Al abrir la app: lee la credencial guardada y la verifica con la API antes de mostrar nada protegido. Borra la que la
 * API rechaza y conserva la que no se pudo verificar. Con `credencial`, reintenta sin volver a leer.
 *
 * Si mientras tanto la persona eligió otra cosa (`sigueVigente()` da `false`), devuelve `null` y no toca nada: una
 * respuesta tardía no restaura una sesión.
 *
 * Nada de esto deja la app esperando. La lectura tiene su tope en la guarda. Si la API no responde en
 * `esperaMaximaDeVerificacionMs` (10 s), la causa es «tiempo agotado», distinta de la falta de red (encargo §8): la
 * credencial queda y se puede reintentar. El borrado queda en la fila sin frenar la decisión, y la fila conserva el orden.
 */
export async function recuperarSesion(o: {
  readonly guarda: GuardaDeSesion;
  readonly verificar: (token: string) => Promise<Resultado<MeResponse>>;
  readonly credencial?: CredencialGuardada;
  readonly ahora: () => { readonly monotono: number; readonly reloj: number };
  readonly sigueVigente: () => boolean;
  readonly esperaMaximaDeVerificacionMs?: number;
}): Promise<Recuperacion | null> {
  let credencial = o.credencial ?? null;
  if (!credencial) {
    const leida = await o.guarda.leer();
    if (!o.sigueVigente()) return null;
    if (leida.tipo !== 'credencial') return { tipo: 'ninguna' };
    credencial = leida.credencial;
  }
  const r = await verificarConTope(o.verificar(credencial.token), o.esperaMaximaDeVerificacionMs ?? TOPE_DE_VERIFICACION_MS);
  if (!o.sigueVigente()) return null;
  const { monotono, reloj } = o.ahora();
  const decision = decidirRecuperacion(credencial, r, monotono, reloj);
  if (decision.tipo === 'vencida' || decision.tipo === 'no-valida') void o.guarda.borrar();
  return decision;
}

/**
 * La respuesta de la API, o `TIEMPO_AGOTADO` si no llega a tiempo: la app no se queda esperando una red colgada. Un
 * pedido que falla sin respuesta es «sin red».
 */
function verificarConTope(pedido: Promise<Resultado<MeResponse>>, ms: number): Promise<RespuestaDeVerificacion> {
  return new Promise((resolver) => {
    const reloj = setTimeout(() => resolver(TIEMPO_AGOTADO), ms);
    pedido.then(
      (r) => {
        clearTimeout(reloj);
        resolver(r);
      },
      () => {
        clearTimeout(reloj);
        resolver({ ok: false, tipo: 'RED' });
      },
    );
  });
}
